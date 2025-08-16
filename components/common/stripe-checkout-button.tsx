'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeCheckoutItem {
  name: string;
  description?: string;
  amount: number; // Amount in smallest currency unit (e.g., cents for USD)
  currency: string;
  quantity: number;
}

interface StripeCheckoutButtonProps {
  items: StripeCheckoutItem[];
  successUrl?: string; // Optional: custom success URL
  cancelUrl?: string;  // Optional: custom cancel URL
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

export function StripeCheckoutButton({
  items,
  successUrl,
  cancelUrl,
  buttonText = 'Checkout with Stripe',
  className,
  disabled,
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    const stripe = await stripePromise;

    if (!stripe) {
      setError('Stripe.js has not loaded yet.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, successUrl, cancelUrl }),
      });

      const session = await response.json();

      if (!response.ok) {
        throw new Error(session.error || 'Failed to create Stripe session.');
      }

      if (session.url) {
        // Redirect to Stripe Checkout
        window.location.href = session.url;
      } else if (session.sessionId) {
        // Alternative: Redirect to Stripe Checkout using session ID (if session.url is not available)
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: session.sessionId });
        if (stripeError) {
          throw new Error(stripeError.message || 'Stripe redirection failed.');
        }
      } else {
        throw new Error('Invalid session response from server.');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Stripe Checkout Error:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
    // No need to setIsLoading(false) here if redirecting, as the component will unmount.
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading || items.length === 0}
      className={className}
    >
      {isLoading ? 'Processing...' : buttonText}
      {error && <p style={{ color: 'red', marginTop: '8px' }}>Error: {error}</p>}
    </Button>
  );
} 