import { NextRequest, NextResponse } from 'next/server';
// Assuming CartItem might not be directly needed if we only pass totalAmount, currency etc.
// import { CartItem } from '@/types/cart'; 

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
// Using the correct NowPayments API endpoint for creating an invoice
const NOWPAYMENTS_CREATE_INVOICE_URL = 'https://api.nowpayments.io/v1/invoice';

interface NowPaymentsInvoiceRequestBody {
  price_amount: number;
  price_currency: string;
  pay_currency?: string; // Made optional here to match your interface, but working example implies it's sent. Will be sent.
  order_id?: string;
  order_description?: string;
  // ipn_callback_url?: string; // Removed as per working example for /invoice
  success_url?: string;
  cancel_url?: string;
  is_fee_paid_by_user?: boolean; // Added from working example
  // Add any other parameters required by NOWPayments for the /invoice endpoint
}

interface RequestPayload {
  totalAmount: number;
  currency: string;
  payCurrency?: string; // Optional: to allow frontend to specify, otherwise default
  locale?: string;
  orderId?: string;
}

export async function POST(request: NextRequest) {
  if (!NOWPAYMENTS_API_KEY) {
    console.error('NOWPayments API key is not set.');
    return NextResponse.json({ error: 'Server configuration error for crypto payments.' }, { status: 500 });
  }

  try {
    const body = (await request.json()) as RequestPayload;
    // Add payCurrency to destructuring, provide a default like 'btc' if not sent from frontend.
    const { totalAmount, currency, payCurrency = 'btc', locale, orderId: clientOrderId } = body;

    if (!totalAmount || !currency || !payCurrency) { // payCurrency is now expected
      return NextResponse.json({ error: 'Missing required payment details: totalAmount, currency, or payCurrency.' }, { status: 400 });
    }

    const order_id = clientOrderId || `ORDER_${Date.now()}`;
    const order_description = `Order ${order_id} for ${totalAmount} ${currency.toUpperCase()}`;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; // Fallback for safety
    const success_url = `${baseUrl}/${locale || 'en'}/payment-success?source=nowpayments&orderId=${order_id}`;
    const cancel_url = `${baseUrl}/${locale || 'en'}/payment-cancelled?source=nowpayments`;
    // IPN URL is NOT sent for /invoice endpoint as per the working example.
    // const ipn_callback_url = `${baseUrl}/api/nowpayments/ipn-handler`;


    const nowPaymentsPayload: NowPaymentsInvoiceRequestBody = {
      price_amount: totalAmount,
      price_currency: currency.toLowerCase(),
      pay_currency: payCurrency.toLowerCase(), // ensure it's sent
      order_id: order_id,
      order_description: order_description,
      success_url: success_url,
      cancel_url: cancel_url,
      is_fee_paid_by_user: false, // Added from working example
      // removed ipn_callback_url
    };

    console.log("[NOWPayments API] Sending to /invoice:", JSON.stringify(nowPaymentsPayload, null, 2));

    const response = await fetch(NOWPAYMENTS_CREATE_INVOICE_URL, {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nowPaymentsPayload),
    });

    const responseData = await response.json();

    console.log('[NOWPayments API] Full Response Data from /invoice:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error('NOWPayments API Error (from /invoice, logged above):', responseData);
      return NextResponse.json({ error: responseData.message || 'Failed to create NOWPayments invoice.', details: responseData }, { status: response.status });
    }

    const paymentRedirectUrl = responseData.invoice_url;
    const nowPaymentsPaymentId = responseData.id; // For /invoice endpoint, use 'id'

    if (!paymentRedirectUrl) {
      console.error('NOWPayments Error: No invoice_url found in /invoice response. Full response logged above.', responseData);
      if (responseData.payment_url) console.log('[NOWPayments API] payment_url was present:', responseData.payment_url);
      if (responseData.pay_address) console.log('[NOWPayments API] pay_address was present:', responseData.pay_address);
      return NextResponse.json({ error: 'Could not get invoice URL from NOWPayments.' }, { status: 500 });
    }

    console.log('[NOWPayments API] Determined Invoice URL:', paymentRedirectUrl);
    console.log('[NOWPayments API] Payment ID (from invoice):', nowPaymentsPaymentId);

    return NextResponse.json({ redirectUrl: paymentRedirectUrl, paymentId: nowPaymentsPaymentId, orderId: order_id });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('NOWPayments Create Invoice Error:', error.message, error.stack);
      return NextResponse.json({ error: `Error creating NOWPayments invoice: ${error.message}` }, { status: 500 });
    } else {
      console.error('NOWPayments Create Invoice Error:', error);
      return NextResponse.json({ error: 'Error creating NOWPayments invoice: Internal Server Error for crypto payment.' }, { status: 500 });
    }
  }
} 