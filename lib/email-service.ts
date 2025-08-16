import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/order-confirmation-email';
import { OrderSheetRow } from '@/lib/google-sheet-service';
import * as React from 'react';
import { getTranslations } from 'next-intl/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME;
const SITE_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!RESEND_API_KEY) {
  console.warn('Resend API key (RESEND_API_KEY) is not configured. Emails will not be sent.');
}
if (!FROM_EMAIL) {
  console.warn('FROM_EMAIL environment variable is not set. Emails may fail or be improperly formatted.');
}
if (!SITE_NAME) {
  console.warn('NEXT_PUBLIC_SITE_NAME environment variable is not set. Emails may have missing site name.');
}
if (!SITE_BASE_URL) {
  console.warn('NEXT_PUBLIC_BASE_URL environment variable is not set. Email links may be broken.');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

interface EmailOrderDetails extends OrderSheetRow {}

// Define OrderDetailItem here if not already globally available or imported
interface OrderDetailItem {
  nameToDisplay: string; 
  quantity: string | number;
  price: string | number; 
}

export async function sendOrderConfirmationEmail(
  customerEmail: string,
  orderDetails: EmailOrderDetails,
  // ADDING cartItems as an optional parameter. Ideally, this comes from your order processing logic.
  // This is a placeholder for where you'd get the structured cart item data.
  // For now, the function will try to parse from orderDetails if cartItems are not provided.
  structuredOrderItems?: Array<{
    productNameCanonical: string;
    productNameWithVariant?: string;
    localizedShortTitle?: { [locale: string]: string };
    quantity: number;
    price: number; // Assuming this is the unit price for the item in the order
  }>
): Promise<boolean> {
  if (!resend) {
    console.error('Resend client is not initialized. Cannot send email.');
    return false;
  }

  if (!customerEmail || customerEmail === 'N/A') {
    console.warn('No valid customer email provided. Skipping order confirmation email for Order ID:', orderDetails.orderId);
    return false;
  }

  try {
    // Determine locale - use customerLocale from orderDetails, fallback to 'en'
    const locale = orderDetails.customerLocale || 'en'; 
    console.log(`[email-service] Sending email for locale: ${locale}`); // For debugging
    const t = await getTranslations({ locale, namespace: 'Common' });

    const emailSubject = t('subject', { orderId: orderDetails.orderId, siteName: SITE_NAME || 'Site' });

    // --- MODIFICATION: Construct items for the email template ---
    let emailItems: OrderDetailItem[] = [];

    if (structuredOrderItems && structuredOrderItems.length > 0) {
        emailItems = structuredOrderItems.map(item => {
            let nameToDisplayValue: string | undefined;

            // 1. Try short title in the email's specific locale
            if (item.localizedShortTitle && item.localizedShortTitle[locale]) {
                nameToDisplayValue = item.localizedShortTitle[locale];
            }
            // 2. Else, try English short title
            else if (item.localizedShortTitle && item.localizedShortTitle['en']) {
                nameToDisplayValue = item.localizedShortTitle['en'];
            }
            // 3. Else, if localizedShortTitle object exists, try to find *any* non-empty short title from it
            else if (item.localizedShortTitle) {
                // Find the first truthy value in the localizedShortTitle object
                const anyAvailableShortTitle = Object.values(item.localizedShortTitle).find(st => st && st.trim() !== '');
                if (anyAvailableShortTitle) {
                    nameToDisplayValue = anyAvailableShortTitle;
                }
            }

            // 4. If no short title found by any means, fall back to productNameWithVariant
            if (!nameToDisplayValue && item.productNameWithVariant) {
                nameToDisplayValue = item.productNameWithVariant;
            }

            // 5. If still no name, fall back to productNameCanonical
            if (!nameToDisplayValue) {
                nameToDisplayValue = item.productNameCanonical;
            }

            // 6. Final fallback to a generic term if all else fails (e.g. canonical name is also empty)
            nameToDisplayValue = nameToDisplayValue && nameToDisplayValue.trim() !== '' ? nameToDisplayValue : t('orderConfirmation.defaultProductName', {defaultValue: 'Product'});
            
            return {
                nameToDisplay: nameToDisplayValue,
                quantity: item.quantity.toString(),
                price: item.price.toFixed(2), // Assuming price is a number
            };
        });
    } else if (orderDetails.productNames) {
        // Fallback to parsing from comma-separated strings if structuredOrderItems are not available
        // This part assumes productNames, productQuantities, productPrices exist on orderDetails
        const productNamesArray = orderDetails.productNames ? orderDetails.productNames.split(', ') : [];
        const productQuantitiesArray = orderDetails.productQuantities ? orderDetails.productQuantities.split(', ') : [];
        const productPricesArray = orderDetails.productPrices ? orderDetails.productPrices.split(', ') : [];

        emailItems = productNamesArray.map((name, index) => ({
            nameToDisplay: name, // No short title available in this fallback path
            quantity: productQuantitiesArray[index] || '1',
            price: productPricesArray[index] || '0.00',
        }));
    }
    // --- END MODIFICATION ---

    const emailElement = React.createElement(OrderConfirmationEmail, {
      // ...orderDetails, // Remove full spread if it conflicts with new 'items' prop
      orderId: orderDetails.orderId,
      timestamp: orderDetails.timestamp,
      customerEmail: customerEmail, // or orderDetails.customerEmail
      items: emailItems, // MODIFIED: Pass the constructed items array
      totalAmount: orderDetails.totalAmount,
      currency: orderDetails.currency,
      paymentMethod: orderDetails.paymentMethod,
      siteName: SITE_NAME || 'Your Site',
      siteBaseUrl: SITE_BASE_URL || '',
      locale: locale,
      t: t,
    });

    // Note: Resend SDK's render method for React components is useful if you don't use react-email's own render
    // but since react-email components are used, they effectively become the email body.
    // For Resend, you pass the React element directly to the `react` property.

    const { data, error } = await resend.emails.send({
      from: `${SITE_NAME} <${FROM_EMAIL}>`,
      to: [customerEmail],
      subject: emailSubject, // Use translated subject
      react: emailElement, // Pass the React element directly
    });

    if (error) {
      console.error(`Error sending order confirmation email to ${customerEmail} for order ${orderDetails.orderId}:`, error);
      return false;
    }

    console.log(`Order confirmation email sent successfully to ${customerEmail} for order ${orderDetails.orderId}. Message ID: ${data?.id}`);
    return true;
  } catch (err: unknown) {
    const message = typeof err === 'object' && err && 'message' in err
      ? (err as { message: string }).message
      : String(err);
    console.error(`Exception sending order confirmation email to ${customerEmail} for order ${orderDetails.orderId}:`, message);
    return false;
  }
} 