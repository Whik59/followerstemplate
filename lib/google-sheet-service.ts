import { google } from 'googleapis';

// Define a simple interface for the order details we expect to log
// This should match the structure of data you plan to send from your webhooks
export interface OrderSheetRow {
  orderId: string;
  timestamp: string;
  customerEmail: string;
  productNames: string; // e.g., "Product A, Product B"
  productQuantities: string; // e.g., "1, 2"
  productPrices: string; // e.g., "10.99, 5.49"
  productURLs?: string; // e.g., "url1, url2"
  totalAmount: number;
  currency: string;
  paymentMethod: string; // e.g., "Stripe", "PayPal", "NOWPayments_BTC"
  paymentId: string;
  orderStatus: string; // e.g., "Processing", "Confirmed"
  customerLocale?: string; // Added for storing customer's language preference
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
// !!! IMPORTANT: Verify this matches your actual Google Sheet tab name EXACTLY (case-sensitive) !!!
// Common default is "Sheet1", but if you renamed it, update this value.
const SHEET_NAME = 'Sheet1';

// Ensure your private key has newline characters correctly interpreted
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function appendOrderToSheet(orderDetails: OrderSheetRow): Promise<void> {
  if (!SPREADSHEET_ID) {
    console.error('Google Sheets SPREADSHEET_ID is not configured.');
    throw new Error('Spreadsheet ID not configured for order logging.');
  }
  if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !privateKey) {
    console.error('Google Sheets API credentials (client email or private key) are not fully configured.');
    throw new Error('Google Sheets API credentials not configured for order logging.');
  }

  try {
    // IMPORTANT: The order of values in this array MUST match the column order in your Google Sheet
    const rowValues = [
      orderDetails.orderId,
      orderDetails.timestamp,
      orderDetails.customerEmail,
      orderDetails.productNames,
      orderDetails.productQuantities,
      orderDetails.productPrices,
      orderDetails.productURLs || '', // Provide a default if optional
      orderDetails.totalAmount,
      orderDetails.currency,
      orderDetails.paymentMethod,
      orderDetails.paymentId,
      orderDetails.orderStatus,
      orderDetails.customerLocale || 'en', // Add to sheet, default to 'en' if not present
    ];

    console.log(`Appending to Google Sheet ID: ${SPREADSHEET_ID}, Actual Sheet Tab Name Used: ${SHEET_NAME}`);
    console.log('Row values:', rowValues);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`, // Appends after the last row with data in the specified sheet (starting from A1)
      valueInputOption: 'USER_ENTERED', // Treats input data as if a user typed it into the sheet
      requestBody: {
        values: [rowValues],
      },
    });

    console.log('Successfully appended order to Google Sheet:', response.data);
  } catch (error: unknown) {
    let message = 'Unknown error';
    let apiError: unknown = undefined;
    if (typeof error === 'object' && error) {
      if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
        message = (error as { message: string }).message;
      }
      if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        apiError = error.response.data.error;
        console.error('Google API Error Details:', JSON.stringify(apiError, null, 2));
      }
    }
    console.error('Error appending order to Google Sheet:', message);
    throw new Error(`Failed to append order to Google Sheet: ${message}`);
  }
} 