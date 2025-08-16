'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { CartItem } from '@/types/cart';
import { Lock } from 'lucide-react'; // Import Lock icon

interface StripeRedirectCheckoutButtonProps {
  items: CartItem[];
  currency: string;
  locale?: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  onInitiateCheckout?: () => void;
  onError?: (error: string) => void;
  showLockIcon?: boolean; // New prop to control icon visibility
}

export function StripeRedirectCheckoutButton({
  items,
  currency,
  locale,
  buttonText,
  className,
  disabled = false,
  onInitiateCheckout,
  onError,
  showLockIcon = true, // Default to true
}: StripeRedirectCheckoutButtonProps) {
  const t = useTranslations('Common');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const defaultButtonText = buttonText || t('payWithCard');

  async function handleClick() {
    if (onInitiateCheckout) {
      onInitiateCheckout();
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, currency, locale }),
      });

      const session = await response.json();

      if (!response.ok) {
        const errorMsg = session.error || 'Failed to create Stripe session.';
        throw new Error(errorMsg);
      }

      if (session.url) {
        window.open(session.url, '_blank');
      } else {
        throw new Error('Invalid session response from server. Missing URL.');
      }

    } catch (err: unknown) {
      console.error('Stripe Checkout Button Error:', err);
      const errorMessage = err instanceof Error ? err.message : t('paymentErrorOccurred');
      if (onError) {
        onError(errorMessage);
      }
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || disabled || items.length === 0}
      className={className || "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md transition duration-150 disabled:opacity-50 flex items-center justify-center space-x-2"} // Added flex classes
    >
      {isLoading ? (
        <>{t('processing')}</>
      ) : (
        <>
          {showLockIcon && <Lock className="h-4 w-4" />} 
          <span>{defaultButtonText}</span>
        </>
      )}
    </Button>
  );
} 