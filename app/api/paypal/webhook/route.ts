import { NextRequest, NextResponse } from 'next/server';
import { appendOrderToSheet, OrderSheetRow } from '@/lib/google-sheet-service';
import { sendOrderConfirmationEmail } from '@/lib/email-service';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

// Use environment variable for SITE_BASE_URL
const SITE_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!SITE_BASE_URL) {
  console.warn('Warning: NEXT_PUBLIC_BASE_URL is not set in environment variables. SITE_BASE_URL will be undefined in PayPal webhook, which might affect URL generation.');
}

// Determine PayPal API base URL (Sandbox or Live)
// For webhooks, always use live if your app is live, or sandbox if testing with sandbox.
// We assume live for production webhooks.
const PAYPAL_API_BASE = 'https://api-m.paypal.com'; // Live PayPal API

interface PayPalAccessTokenResponse {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal Client ID or Secret is not configured.');
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    }
  );
  const data = (await response.json()) as PayPalAccessTokenResponse;
  if (!response.ok || !data.access_token) {
    console.error('PayPal getAccessToken error response:', data);
    throw new Error('Failed to get PayPal access token.');
  }
  return data.access_token;
}

interface PayPalWebhookVerificationResponse {
  verification_status: 'SUCCESS' | 'FAILURE';
}

async function verifyPayPalWebhook(
  accessToken: string,
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.error('PAYPAL_WEBHOOK_ID is not configured.');
    return false; // Cannot verify without Webhook ID
  }

  const paypalHeaders: Record<string, string> = {};
  paypalHeaders['PAYPAL-AUTH-ALGO'] = headers.get('paypal-auth-algo') || '';
  paypalHeaders['PAYPAL-CERT-URL'] = headers.get('paypal-cert-url') || '';
  paypalHeaders['PAYPAL-TRANSMISSION-ID'] = headers.get('paypal-transmission-id') || '';
  paypalHeaders['PAYPAL-TRANSMISSION-SIG'] = headers.get('paypal-transmission-sig') || '';
  paypalHeaders['PAYPAL-TRANSMISSION-TIME'] = headers.get('paypal-transmission-time') || '';

  const verificationBody = {
    auth_algo: paypalHeaders['PAYPAL-AUTH-ALGO'],
    cert_url: paypalHeaders['PAYPAL-CERT-URL'],
    transmission_id: paypalHeaders['PAYPAL-TRANSMISSION-ID'],
    transmission_sig: paypalHeaders['PAYPAL-TRANSMISSION-SIG'],
    transmission_time: paypalHeaders['PAYPAL-TRANSMISSION-TIME'],
    webhook_id: PAYPAL_WEBHOOK_ID,
    webhook_event: JSON.parse(rawBody), // PayPal expects the event body as a JSON object here
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationBody),
    }
  );

  const data = (await response.json()) as PayPalWebhookVerificationResponse;
  return data.verification_status === 'SUCCESS';
}

interface PayPalItem {
  name?: string;
  quantity?: string;
  unit_amount?: { value?: string };
  sku?: string;
  url?: string;
  description?: string;
}

export async function POST(req: NextRequest) {
  console.log('PayPal Webhook Event Received...');

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !PAYPAL_WEBHOOK_ID) {
    console.error('PayPal environment variables (CLIENT_ID, CLIENT_SECRET, or WEBHOOK_ID) are not configured.');
    return NextResponse.json({ error: 'PayPal webhook configuration error.' }, { status: 500 });
  }

  const rawBody = await req.text();
  let eventPayload;
  try {
    eventPayload = JSON.parse(rawBody);
  } catch (e) {
    console.error('Error parsing PayPal webhook body:', e);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
  
  console.log('PayPal Event Type:', eventPayload.event_type);
  // console.log('PayPal Full Event Payload:', JSON.stringify(eventPayload, null, 2)); // For debugging, can be very verbose

  try {
    const accessToken = await getPayPalAccessToken();
    const isVerified = await verifyPayPalWebhook(accessToken, req.headers, rawBody);

    if (!isVerified) {
      console.warn('PayPal webhook verification failed. Event ID:', eventPayload.id);
      return NextResponse.json({ error: 'Webhook verification failed.' }, { status: 403 });
    }
    console.log('PayPal webhook event VERIFIED. Event ID:', eventPayload.id);

    // Handle the event
    if (eventPayload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = eventPayload.resource;
      const amount = capture.amount?.value;
      const currency = capture.amount?.currency_code;
      const paypalPaymentId = capture.id;
      const orderId = capture.custom_id || capture.invoice_id || paypalPaymentId;
      
      // Attempt to extract locale from orderId (e.g., if orderId is like "someID_en" or "customInv-fr")
      let orderLocale = 'en'; // Default locale
      const orderIdParts = orderId.split('_');
      if (orderIdParts.length > 1) {
        const potentialLocale = orderIdParts[orderIdParts.length - 1];
        // Basic check for common locale patterns (e.g., 2 letters, or 2 letters-2 letters)
        if (/^[a-z]{2}(-[A-Z]{2})?$/.test(potentialLocale)) {
          orderLocale = potentialLocale;
          console.log(`[PayPal Webhook] Extracted locale '${orderLocale}' from orderId: ${orderId}`);
        }
      }

      const payerEmail = capture.payer?.email_address || capture.supplementary_data?.related_ids?.order_id?.payer?.email_address || 'N/A';

      let productNames = `Order ${orderId}`;
      let productQuantities = '1';
      let productPrices = amount ? String(amount) : 'N/A';
      let productURLs = '';

      // Attempt to get item details from purchase_units
      if (capture.purchase_units && capture.purchase_units.length > 0 && capture.purchase_units[0].items && capture.purchase_units[0].items.length > 0) {
        const items = capture.purchase_units[0].items;
        productNames = items.map((item: PayPalItem) => item.name || 'N/A').join(', ');
        productQuantities = items.map((item: PayPalItem) => item.quantity || 'N/A').join(', ');
        productPrices = items.map((item: PayPalItem) => item.unit_amount?.value || 'N/A').join(', ');
        
        productURLs = items.map((item: PayPalItem) => {
          // Preferred method: Construct from SITE_BASE_URL, hardcoded /fr/, and item.sku (slug)
          if (item.sku) {
            return `${SITE_BASE_URL}/fr/products/${item.sku}`;
          }
          // Fallback 1: Full URL in item.url (if you provide it from client)
          // Used if item.sku is not available.
          if (item.url) return item.url;
          
          // Fallback 2: Full URL in item.description (if you provide it from client and it looks like a URL)
          // Used if item.sku and item.url are not available.
          if (item.description && (item.description.startsWith('http://') || item.description.startsWith('https://'))) {
            return item.description;
          }
          // Fallback 3: Use description as is if it's not a URL, or empty string, if other options fail
          return item.description || ''; 
        }).filter((url: string) => url).join(', '); 
      }

      const orderDetails: OrderSheetRow = {
        orderId: orderId, 
        timestamp: capture.create_time || new Date().toISOString(),
        customerEmail: payerEmail,
        productNames: productNames,
        productQuantities: productQuantities,
        productPrices: productPrices,
        productURLs: productURLs,
        totalAmount: parseFloat(amount || '0'),
        currency: currency || 'N/A',
        paymentMethod: 'PayPal',
        paymentId: paypalPaymentId,
        orderStatus: 'Processing',
        customerLocale: orderLocale,
      };

      // CHECK FOR TEST DATA
      if (payerEmail.toLowerCase() === 'test@example.com' || orderId.startsWith('TEST_ORDER_')) {
        console.log(`Test PayPal order detected (Email: ${payerEmail}, OrderID: ${orderId}). Skipping sheet append and email.`);
        // Optionally, you could return a success response to PayPal here if you don't want to process further
        // return NextResponse.json({ received: true, message: 'Test order ignored' }); 
      } else {
      try {
        console.log('Attempting to append PayPal order to Google Sheet:', JSON.stringify(orderDetails, null, 2));
        await appendOrderToSheet(orderDetails);
        console.log('PayPal order successfully appended to Google Sheet.');

        // Send confirmation email
        if (orderDetails.customerEmail && orderDetails.customerEmail !== 'N/A') {
          console.log(`Attempting to send order confirmation email to ${orderDetails.customerEmail} for PayPal order ${orderDetails.orderId}`);
          const emailSent = await sendOrderConfirmationEmail(orderDetails.customerEmail, orderDetails);
          if (emailSent) {
            console.log('Order confirmation email sent successfully for PayPal order.');
          } else {
            console.warn('Failed to send order confirmation email for PayPal order.');
            // You might want additional logging or retry logic here for email failures
          }
        } else {
          console.warn('No valid customer email for PayPal order, skipping confirmation email.', orderDetails.orderId);
        }

      } catch (sheetError: unknown) {
        const message = typeof sheetError === 'object' && sheetError && 'message' in sheetError ? (sheetError as { message: string }).message : String(sheetError);
        console.error('CRITICAL: Error appending PayPal order to Google Sheet:', message);
        // Acknowledge webhook to prevent PayPal retries for this specific failure.
        }
      }
    } else {
      console.log(`Unhandled PayPal event type: ${eventPayload.event_type}`);
    }

    return NextResponse.json({ received: true, verificationStatus: 'SUCCESS' });

  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : String(error);
    console.error('Error processing PayPal webhook:', message);
    return NextResponse.json({ error: `Webhook processing error: ${message}` }, { status: 500 });
  }
} 