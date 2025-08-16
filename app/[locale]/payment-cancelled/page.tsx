'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentCancelledPage() {
  const t = useTranslations('Common');
  const searchParams = useSearchParams();
  const currentLocale = useLocale();

  const source = searchParams.get('source'); // e.g., stripe, paypal

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center">
      <XCircle className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-3xl font-bold mb-4">{t('paymentCancelledTitle')}</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {t('paymentCancelledMessage')}
      </p>
      {source && <p className="text-sm text-gray-600">{t('paymentSource')}: {source}</p>}
      
      <div className="mt-8 space-y-4">
        <Button asChild size="lg">
          <Link href={`/${currentLocale}/checkout`}>{t('tryCheckoutAgain')}</Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href={`/${currentLocale}/products`}>{t('continueShopping')}</Link>
        </Button>
      </div>
    </div>
  );
} 