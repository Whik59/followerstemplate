import { NextRequest, NextResponse } from 'next/server';

// Use a separate, non-public environment variable for the backend Client ID
const PAYPAL_BACKEND_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''; 
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

// FORCE LIVE PAYPAL API FOR TESTING IN DEVELOPMENT
const PAYPAL_API_BASE = 'https://api-m.paypal.com'; 
// Original logic based on NODE_ENV:
// const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
//     ? 'https://api-m.paypal.com' 
//     : 'https://api-m.sandbox.paypal.com';

interface RequestBody {
  items: Array<{
    name: string;
    description?: string;
    unit_amount: {
      currency_code: string;
      value: string; // Amount as a string, e.g., "10.99"
    };
    quantity: string; // Quantity as a string
  }>;
  purchaseAmount: {
    currency_code: string;
    value: string; // Total amount as a string
  };
  applicationContext?: {
    return_url?: string;
    cancel_url?: string;
    brand_name?: string;
    user_action?: 'CONTINUE' | 'PAY_NOW';
  };
}

interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

// Function to get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  // Use the backend-specific client ID for authentication
  const auth = Buffer.from(`${PAYPAL_BACKEND_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
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
    const { items, purchaseAmount, applicationContext } = (await request.json()) as RequestBody;

    if (!items || items.length === 0 || !purchaseAmount) {
      return NextResponse.json({ error: 'Invalid order data provided.' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    const defaultApplicationContext = {
      brand_name: 'Your Store Name', // Replace with your actual store name
      user_action: 'PAY_NOW',
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?paypal_order_id={paypal_order_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
    };

    const payPalItems = items.map((item) => ({
      name: item.name,
      description: item.description || item.name,
      unit_amount: item.unit_amount,
      quantity: item.quantity,
      // Add sku if you send it from the client, otherwise omit
    }));

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items: payPalItems,
          amount: {
            currency_code: purchaseAmount.currency_code.toUpperCase(),
            value: purchaseAmount.value,
            breakdown: {
              item_total: {
                currency_code: purchaseAmount.currency_code.toUpperCase(),
                value: purchaseAmount.value, // Assuming item_total is the same as the purchase amount for simplicity
              },
            },
          },
        },
      ],
      application_context: { ...defaultApplicationContext, ...applicationContext },
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        // 'PayPal-Request-Id': 'your-unique-request-id', // Optional: for idempotency
      },
      body: JSON.stringify(orderPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error('PayPal API Error:', responseData);
        return NextResponse.json({ error: responseData.message || 'Failed to create PayPal order.', details: responseData.details }, { status: response.status });
    }

    return NextResponse.json({
      orderId: responseData.id,
      approvalUrl: (responseData.links as PayPalLink[] | undefined)?.find(link => link.rel === 'approve')?.href
    });

  } catch (error) {
    console.error('PayPal Create Order Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: `Error creating PayPal order: ${errorMessage}` }, { status: 500 });
  }
} 