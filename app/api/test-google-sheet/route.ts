import { NextRequest, NextResponse } from 'next/server';
import { appendOrderToSheet, OrderSheetRow } from '@/lib/google-sheet-service';

export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    console.log('Test Google Sheet API route called in production. Disabling.');
    return NextResponse.json({ message: 'Test route disabled in production.' }, { status: 404 });
  }
  console.log('Test Google Sheet API route hit');

  // Ensure your environment variables are loaded correctly for this test
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID || !process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    console.error('Google Sheets environment variables are not fully configured for the test.');
    return NextResponse.json({ error: 'Google Sheets environment variables not set up for test.', success: false }, { status: 500 });
  }

  // Create a sample order detail object
  // Make sure the structure and data types match your OrderSheetRow interface
  // and the expected column order in your Google Sheet.
  const sampleOrder: OrderSheetRow = {
    orderId: `TEST_ORDER_${Date.now()}`,
    timestamp: new Date().toISOString(),
    customerEmail: 'test@example.com',
    productNames: 'Test Product A, Test Product B',
    productQuantities: '1, 2',
    productPrices: '9.99, 19.99',
    productURLs: 'http://example.com/productA, http://example.com/productB',
    totalAmount: 49.97,
    currency: 'USD',
    paymentMethod: 'TEST_METHOD',
    paymentId: `TEST_PAYMENT_${Date.now()}`,
    orderStatus: 'Test - Processing',
  };

  try {
    console.log('Attempting to append sample order to sheet...', sampleOrder);
    await appendOrderToSheet(sampleOrder);
    console.log('Sample order successfully appended to Google Sheet via test route.');
    return NextResponse.json({ message: 'Successfully appended test order to Google Sheet!', success: true, data: sampleOrder });
  } catch (error: unknown) {
    let message = 'Unknown error';
    let details = '';
    if (typeof error === 'object' && error && 'message' in error) {
      message = (error as { message: string }).message;
      details = (error as { stack?: string }).stack || '';
    } else {
      message = String(error);
    }
    console.error('Error in test-google-sheet route while appending:', message);
    return NextResponse.json(
      {
        message: 'Failed to append test order to Google Sheet.',
        success: false,
        error: message,
        details,
      },
      { status: 500 }
    );
  }
}

// export async function POST(_request: Request) {
//   // ... existing code ...
//   const rows: unknown[] = ...
//   // ... existing code ...
// } 