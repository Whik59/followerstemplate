import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { appendOrderToSheet, OrderSheetRow } from '@/lib/google-sheet-service';
import { sendOrderConfirmationEmail } from '@/lib/email-service';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('CRITICAL: STRIPE_SECRET_KEY is not set in environment variables.');
  // Optionally throw an error here or handle appropriately if you can't run without it
}

const stripe = new Stripe(stripeSecretKey || '', { // Fallback to empty string if undefined, though checks prevent this.
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Use environment variable for SITE_BASE_URL
const SITE_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!SITE_BASE_URL) {
  console.warn('Warning: NEXT_PUBLIC_BASE_URL is not set in environment variables. SITE_BASE_URL will be undefined in Stripe webhook, which might affect URL generation.');
}

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is not configured.');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }
  if (!stripeSecretKey) {
    // This check is somewhat redundant due to the top-level check, but good for within the request lifecycle.
    console.error('Stripe secret key is not available for webhook processing.');
    return NextResponse.json({ error: 'Stripe configuration error.' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.warn('Stripe webhook request missing signature.');
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err);
    console.error(`Stripe webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  console.log('Stripe Webhook Event Received:', event.type, event.id);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Processing checkout.session.completed for session ID: ${session.id}`);

      let sessionWithLineItems: Stripe.Checkout.Session | null = null;
      try {
        // Retrieve the session with line items and product details expanded
        sessionWithLineItems = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ['line_items', 'line_items.data.price.product'] }
        );
      } catch (retrieveError: unknown) {
        const message = typeof retrieveError === 'object' && retrieveError && 'message' in retrieveError ? (retrieveError as { message: string }).message : String(retrieveError);
        console.error(`Error retrieving Stripe session ${session.id} with line items:`, message);
        // Fallback to the session from the webhook event if retrieval fails.
        // This might mean line_items are not as detailed.
        sessionWithLineItems = session; 
      }

      if (!sessionWithLineItems) {
         console.error(`Stripe Checkout Session ${session.id} could not be fully processed or retrieved.`);
         // Still acknowledge the webhook to Stripe to prevent retries for this specific issue.
         return NextResponse.json({ received: true, error: 'Session processing failed internally after retrieval attempt.' });
      }

      const lineItems = sessionWithLineItems.line_items?.data || [];
      
      const productNames = lineItems.map(item => {
        if (typeof item.price?.product === 'object' && item.price.product !== null && 'name' in item.price.product) {
          return (item.price.product as Stripe.Product).name;
        }
        return item.description || 'Unknown Product';
      }).join(', ');

      const productQuantities = lineItems.map(item => item.quantity || 0).join(', ');
      const productPrices = lineItems.map(item => ((item.price?.unit_amount || 0) / 100).toFixed(2)).join(', ');
      
      const productURLs = lineItems.map(item => {
        const product = item.price?.product;
        if (typeof product === 'object' && product !== null && !('deleted' in product)) {
          // Preferred method: Construct URL using English slug from metadata
          if (product.metadata && product.metadata.productSlug_en) {
            return `${SITE_BASE_URL}/en/products/${product.metadata.productSlug_en}`;
          }
          // Fallback 1: If product.url (from Stripe Dashboard) exists and we assume it might be a non-localized direct link or needs to be used as is.
          if (product.url) {
            return product.url;
          }
          // Fallback 2: If product.metadata.productUrl (custom metadata) exists.
          if (product.metadata && product.metadata.productUrl) {
            return product.metadata.productUrl;
          }
        }
        return ''; // Return empty string if no suitable URL can be constructed
      }).filter(url => url).join(', ');

      // Determine the locale for the email
      let determinedLocale: string = session.locale || 'en'; // Default to 'en' if Stripe provides no locale
      console.log(`[Stripe Webhook] Initial Stripe session.locale: '${session.locale}' for session ID ${session.id}`);

      if (determinedLocale === 'es') {
        // If Stripe sends generic 'es', check if currency is COP to refine to 'es-CO'.
        // This assumes COP currency is a strong indicator for a Colombian customer for whom es-CO translations are desired.
        if (session.currency && session.currency.toLowerCase() === 'cop') {
          determinedLocale = 'es-CO';
          console.log(`[Stripe Webhook] Stripe locale was 'es' with COP currency, mapped to 'es-CO' for session ID ${session.id}`);
        } else {
          // Optional: Handle generic 'es' for other Spanish-speaking regions if necessary.
          // For instance, you might map it to 'es-ES' or another default if you don't support generic 'es'.
          // Or, if you add 'es' to your i18n.config.ts, you could just leave determinedLocale as 'es'.
          console.log(`[Stripe Webhook] Stripe locale was 'es' but currency was not COP (${session.currency}). Keeping locale as 'es' for session ID ${session.id}. Ensure 'es' is a supported locale if this path is taken.`);
        }
      }
      const customerLocaleForEmail = determinedLocale;
      console.log(`[Stripe Webhook] Final customerLocaleForEmail set to: '${customerLocaleForEmail}' for session ID ${session.id}`);

      // --- START: Construct structuredOrderItems for email ---
      const structuredOrderItemsForEmail = lineItems.map(item => {
        const product = item.price?.product as Stripe.Product; // Cast to Stripe.Product for easier access
        const canonicalName = product?.name || item.description || 'Unknown Product';
        
        // Attempt to get localizedShortTitle from product metadata
        // Example: product.metadata.localizedShortTitle_en, product.metadata.localizedShortTitle_fr
        // This requires you to store these in Stripe product metadata.
        const shortTitleEn = product?.metadata?.localizedShortTitle_en;
        const shortTitleLocale = product?.metadata?.[`localizedShortTitle_${customerLocaleForEmail.split('-')[0]}`];
        
        const localizedTitles: { [locale: string]: string } = {};
        if (shortTitleEn) localizedTitles['en'] = shortTitleEn;
        if (shortTitleLocale) localizedTitles[customerLocaleForEmail.split('-')[0]] = shortTitleLocale;

        // If you have variant info available, construct productNameWithVariant here
        // For example, if variant details are in product description or metadata
        // For now, defaulting to canonicalName if specific variant info is not easily available
        const nameWithVariant = canonicalName; // Placeholder - refine if variant info is available

        return {
          productNameCanonical: canonicalName,
          productNameWithVariant: nameWithVariant, // Use the more specific name if available
          localizedShortTitle: Object.keys(localizedTitles).length > 0 ? localizedTitles : undefined,
          quantity: item.quantity || 1,
          price: (item.price?.unit_amount || 0) / 100,
        };
      });
      // --- END: Construct structuredOrderItems for email ---

      const orderDetails: OrderSheetRow = {
        orderId: session.id, 
        timestamp: new Date(session.created * 1000).toISOString(),
        customerEmail: session.customer_details?.email || session.customer_email || 'N/A',
        productNames: productNames || 'N/A',
        productQuantities: productQuantities || 'N/A',
        productPrices: productPrices || 'N/A',
        productURLs: productURLs || '',
        totalAmount: (session.amount_total || 0) / 100,
        currency: (session.currency || 'N/A').toUpperCase(),
        paymentMethod: 'Stripe',
        paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id || 'N/A'),
        orderStatus: 'Processing',
        customerLocale: customerLocaleForEmail, // Added for email localization
      };

      try {
        console.log('Attempting to append Stripe order to Google Sheet:', JSON.stringify(orderDetails, null, 2));
        await appendOrderToSheet(orderDetails);
        console.log('Stripe order successfully appended to Google Sheet.');

        // Send confirmation email
        if (orderDetails.customerEmail && orderDetails.customerEmail !== 'N/A') {
          console.log(`Attempting to send order confirmation email to ${orderDetails.customerEmail} for Stripe order ${orderDetails.orderId}`);
          const emailSent = await sendOrderConfirmationEmail(orderDetails.customerEmail, orderDetails, structuredOrderItemsForEmail);
          if (emailSent) {
            console.log('Order confirmation email sent successfully for Stripe order.');
          } else {
            console.warn('Failed to send order confirmation email for Stripe order.');
            // You might want additional logging or retry logic here for email failures
          }
        } else {
          console.warn('No valid customer email for Stripe order, skipping confirmation email.', orderDetails.orderId);
        }

      } catch (sheetError: unknown) {
        const message = typeof sheetError === 'object' && sheetError && 'message' in sheetError ? (sheetError as { message: string }).message : String(sheetError);
        console.error('CRITICAL: Error appending Stripe order to Google Sheet:', message);
        // Decide on retry strategy. For now, acknowledge webhook to prevent Stripe retries for this specific failure.
        // However, this means the order might not be logged if the sheet error is persistent.
      }
      break;
    
    // Example: Handling payment failures if you want to log them differently
    // case 'checkout.session.async_payment_failed':
    //   const failedSession = event.data.object as Stripe.Checkout.Session;
    //   console.log(`Payment failed for checkout session: ${failedSession.id}`);
    //   // Optionally log this to a different sheet or with a different status
    //   break;

    default:
      console.warn(`Unhandled Stripe event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 