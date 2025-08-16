'use client';

import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js';
import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation'; // Or 'next/router' for older Next.js versions

interface PayPalCheckoutItem {
  name: string;
  description?: string;
  unit_amount: {
    currency_code: string; 
    value: string; // e.g., "10.99"
  };
  quantity: string; // e.g., "1"
}

interface PayPalPurchaseAmount {
  currency_code: string;
  value: string; // Total amount, e.g., "10.99"
}

interface PayPalCheckoutProps {
  items: PayPalCheckoutItem[];
  purchaseAmount: PayPalPurchaseAmount;
  onPaymentSuccess?: (details: unknown) => void; // Callback for successful payment
  onPaymentError?: (error: unknown) => void;   // Callback for payment error
  onPaymentCancel?: () => void;      // Callback for payment cancellation
  disabled?: boolean;
}

export function PayPalCheckout({
  items,
  purchaseAmount,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  disabled = false,
}: PayPalCheckoutProps) {
  // const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true); // Ensure PayPal SDK only loads on the client
  }, []);

  if (!isClient) {
    // Render a placeholder or nothing until the component has mounted
    return <div className="h-[50px] w-full bg-gray-200 animate-pulse rounded-md"></div>; 
  }
  
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    console.error("PayPal Client ID is not set in .env.local. PayPal buttons will not render.");
    return <p className="text-xs text-red-600 p-2 bg-red-50 rounded-md">PayPal is currently unavailable (missing configuration).</p>;
  }

  const paypalOptions = {
    clientId: clientId,
    currency: purchaseAmount.currency_code.toUpperCase() || 'USD',
    intent: 'capture',
    // "enable-funding": "venmo", // Example: enable Venmo, comma-separate for multiple
    // "disable-funding": "card,credit", // Example: disable card and credit payments
  };

  async function createOrder(_data: unknown, _actions: unknown): Promise<string> {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          purchaseAmount,
          applicationContext: {
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?source=paypal`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled?source=paypal`,
          }
        }),
      });
      const order = await res.json();
      if (!res.ok) {
        console.error('PayPal createOrder API Error:', order);
        throw new Error(order.error || 'Failed to create PayPal order. Details: ' + JSON.stringify(order.details));
      }
      if (order.orderId) {
        return order.orderId;
      } else {
        console.error('PayPal createOrder Error: No orderId received', order);
        throw new Error('Could not initiate PayPal Checkout. No orderId received.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error during order creation.';
      console.error('PayPal createOrder Function Error:', msg);
      setErrorMessage(msg);
      if (onPaymentError) onPaymentError(msg);
      throw err; // Re-throw to inform PayPal SDK
    }
  }

  async function onApprove(data: unknown, _actions: unknown): Promise<void> {
    setErrorMessage(null);
    try {
      if (!data || typeof data !== 'object' || !('orderID' in data) || typeof (data as { orderID?: unknown }).orderID !== 'string') {
        throw new Error('PayPal onApprove: data.orderID is missing or invalid.');
      }
      const _orderID = (data as { orderID: string }).orderID;
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      const captureDetails = await res.json();
      if (!res.ok) {
        console.error('PayPal captureOrder API Error:', captureDetails);
        throw new Error(captureDetails.error || 'Failed to capture PayPal payment. Details: ' + JSON.stringify(captureDetails.details));
      }

      // Successful capture!
      console.log('Payment Successful:', captureDetails);
      if (onPaymentSuccess) {
        onPaymentSuccess(captureDetails);
      }
      // Redirect to a success page or update UI
      // Example: router.push(`/payment-success?paypal_order_id=${data.orderID}&capture_id=${captureDetails.captureData.id}`);
      return captureDetails; // Ensure you return a promise

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error during payment capture.';
      console.error('PayPal onApprove Error:', msg);
      setErrorMessage(msg);
      if (onPaymentError) onPaymentError(msg);
      // Optionally, redirect to an error page or show a message
      // Example: router.push('/payment-error?message=' + encodeURIComponent(msg));
      throw err; // Re-throw to inform PayPal SDK
    }
  }

  function onError(err: unknown) {
    const friendlyMessage = 'An error occurred with the PayPal payment. Please try again or use a different payment method.';
    let errorMsg = friendlyMessage;
    if (err instanceof Error) {
      errorMsg = err.message || friendlyMessage;
    }
    console.error('PayPal SDK Error:', err);
    setErrorMessage(errorMsg);
    if (onPaymentError) onPaymentError(err);
    // Optionally, redirect to an error page or show a message
  }

  function onCancel() {
    console.log('PayPal payment cancelled by user.');
    setErrorMessage('Payment was cancelled.');
    if (onPaymentCancel) onPaymentCancel();
    // Optionally, redirect to a cancellation page or update UI
    // Example: router.push('/payment-cancelled?source=paypal');
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {errorMessage && <p style={{ color: 'red' }}>Error: {errorMessage}</p>}
      <PayPalButtons
        style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal', tagline: false }}
        fundingSource={FUNDING.PAYPAL} // Explicitly use PayPal funding
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        onCancel={onCancel}
        disabled={disabled || items.length === 0 || !purchaseAmount.value}
      />
       {/* Optional: Add Venmo button separately if desired */}
       {/* <PayPalButtons
        style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'venmo' }}
        fundingSource={FUNDING.VENMO}
        createOrder={createOrder} // You might need a different createOrder for Venmo if amounts/logic differ
        onApprove={onApprove}
        onError={onError}
        onCancel={onCancel}
        disabled={disabled || items.length === 0 || !purchaseAmount.value}
      /> */}
    </PayPalScriptProvider>
  );
} 