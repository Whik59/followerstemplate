'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PaymentSuccessPage() {
  const t = useTranslations('Common');
  const searchParams = useSearchParams();
  const currentLocale = useLocale();

  // Example: Extracting details from query parameters
  const sessionId = searchParams.get('session_id'); // From Stripe
  const paypalOrderId = searchParams.get('paypal_order_id'); // From PayPal (if you add it in success URL)
  // const source = searchParams.get('source');

  useEffect(() => {
    if (sessionId) {
      console.log('Stripe Checkout Session ID:', sessionId);
      // Here you might want to fetch order details from your backend using the session_id
      // to confirm payment and display order summary.
      // Example: verifyStripePayment(sessionId);
    } else if (paypalOrderId) {
      console.log('PayPal Order ID:', paypalOrderId);
      // Similarly for PayPal, you might verify the payment on the server if not already done
      // in the /api/paypal/capture-order route upon client-side approval.
      // Example: verifyPayPalPayment(paypalOrderId);
    }
    // Potentially clear cart here if not done elsewhere
    // import { useCart } from '@/context/cart-context';
    // const { clearCart } = useCart();
    // clearCart();
  }, [sessionId, paypalOrderId]);

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
      <h1 className="text-3xl font-bold mb-4">{t('paymentSuccessfulTitle')}</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {t('paymentSuccessfulMessage')}
      </p>
      {sessionId && <p className="text-sm text-gray-600">{t('stripeSessionId')}: {sessionId}</p>}
      {paypalOrderId && <p className="text-sm text-gray-600">{t('paypalOrderId')}: {paypalOrderId}</p>}
      
      <div className="mt-8 space-y-4">
        <Button asChild size="lg">
          <Link href={`/${currentLocale}/products`}>{t('continueShopping')}</Link>
        </Button>
        {/* You might want a link to view order details if you implement such a page */}
        {/* <Button variant="outline" asChild size="lg">
          <Link href={`/${currentLocale}/account/orders`}>{t('viewYourOrders')}</Link>
        </Button> */}
      </div>
    </div>
  );
} 