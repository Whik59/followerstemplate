'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { CartItem } from '@/types/cart'; // Or your specific item type for checkout
import { Coins } from 'lucide-react'; // Using Coins icon for crypto

interface NowPaymentsButtonProps {
  items: CartItem[]; // Or the type you use to calculate total and pass to API
  totalAmount: number;
  currency: string; // e.g., "USD", "EUR" - this is price_currency
  payCurrency?: string; // e.g., "btc", "eth" - this is the crypto to pay in
  locale?: string;
  orderId?: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  onInitiateCheckout?: () => void;
  onError?: (error: string) => void;
  showIcon?: boolean;
}

export function NowPaymentsButton({
  items,
  totalAmount,
  currency,
  payCurrency,
  locale,
  orderId,
  buttonText,
  className,
  disabled = false,
  onInitiateCheckout,
  onError,
  showIcon = true,
}: NowPaymentsButtonProps) {
  const t = useTranslations('Common');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const defaultButtonText = buttonText || t('payWithCrypto'); // Example translation key

  async function handleClick() {
    if (onInitiateCheckout) {
      onInitiateCheckout();
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, totalAmount, currency, payCurrency, locale, orderId }),
      });

      const session = await response.json();

      if (!response.ok) {
        const errorMsg = session.error || 'Failed to create NOWPayments session.';
        throw new Error(errorMsg);
      }

      if (session.redirectUrl) {
        window.open(session.redirectUrl, '_blank'); // Open in new tab
        // No setIsLoading(false) here as the page will redirect away in new tab.
      } else {
        throw new Error('Invalid session response from NOWPayments server. Missing redirect URL.');
      }

    } catch (err: unknown) {
      let errorMessage = t('paymentErrorOccurred');
      if (err instanceof Error) {
        console.error('NOWPayments Button Error:', err.message, err.stack);
        errorMessage = err.message || errorMessage;
      } else {
        console.error('NOWPayments Button Error:', err);
      }
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
      className={className || "w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-md transition duration-150 disabled:opacity-50 flex items-center justify-center space-x-2"}
    >
      {isLoading ? (
        <>{t('processing')}</>
      ) : (
        <>
          {showIcon && <Coins className="h-4 w-4" />} 
          <span>{defaultButtonText}</span>
        </>
      )}
    </Button>
  );
} 