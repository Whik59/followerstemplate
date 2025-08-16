import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

interface RequestBody {
  orderID: string;
}

// Function to get PayPal access token (can be shared or re-declared)
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to get PayPal access token: ${errorData.error_description || response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { orderID } = (await request.json()) as RequestBody;

    if (!orderID) {
      return NextResponse.json({ error: 'PayPal Order ID not provided.' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        // 'PayPal-Request-Id': 'unique-capture-request-id', // Optional: for idempotency
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error('PayPal Capture Error:', responseData);
        return NextResponse.json({ error: responseData.message || 'Failed to capture PayPal payment.', details: responseData.details }, { status: response.status });
    }
    
    // Potentially save capture details to your database here
    // For example, responseData.id (capture ID), responseData.status, responseData.purchase_units[0].payments.captures[0].amount

    return NextResponse.json({ captureData: responseData });

  } catch (error) {
    console.error('PayPal Capture Order Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: `Error capturing PayPal order: ${errorMessage}` }, { status: 500 });
  }
} 