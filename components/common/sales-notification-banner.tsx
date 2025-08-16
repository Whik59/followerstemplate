'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ShoppingCart } from 'lucide-react';
import { recentSales, Sale } from '@/data/recent-sales';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

function formatTimeAgo(minutes: number, t: (key: string, values?: { count: number }) => string): string {
  if (minutes < 1) return t('salesNotification.justNow');
  if (minutes < 60) return t('salesNotification.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('salesNotification.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('salesNotification.daysAgo', { count: days });
}

export function SalesNotificationBanner() {
  const [currentSale, setCurrentSale] = useState<Sale & { timeAgo: number } | null>(null);
  const t = useTranslations('Common');
  const pathname = usePathname();

  useEffect(() => {
    const cycleSale = () => {
      const randomIndex = Math.floor(Math.random() * recentSales.length);
      const randomTime = Math.floor(Math.random() * 60); // 0 to 60 minutes ago
      setCurrentSale({ ...recentSales[randomIndex], timeAgo: randomTime });
    };

    cycleSale(); // Set initial sale immediately

    const interval = setInterval(cycleSale, 7000); // Cycle every 7 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  const formattedQuantity = new Intl.NumberFormat('en-US').format(currentSale?.quantity || 0);

  return (
    <AnimatePresence>
      {currentSale && (
        <motion.div
          key={currentSale.username + currentSale.product}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="overflow-hidden bg-amber-500 dark:bg-amber-600 w-full"
          role="alert"
          aria-live="assertive"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center text-white text-sm font-medium">
              <div className="flex-grow flex items-center justify-center gap-x-3">
                <span className="flex items-center">
                  {(() => {
                    let icon = null;
                    let alt = '';
                    if (currentSale.product.toLowerCase().includes('instagram')) {
                      icon = '/svg/instagram.svg';
                      alt = 'Instagram';
                    } else if (currentSale.product.toLowerCase().includes('tiktok')) {
                      icon = '/svg/tiktok.svg';
                      alt = 'TikTok';
                    } else {
                      icon = '/svg/tiktok.svg';
                      alt = 'TikTok';
                    }
                    return (
                      <span className="bg-white rounded-full p-1 flex items-center justify-center mr-2">
                        <Image src={icon} alt={alt} width={20} height={20} className="w-5 h-5" />
                      </span>
                    );
                  })()}
                </span>
                <p className="text-center">
                  {t.rich('salesNotification.message', {
                    username: (chunks) => <span className="font-bold opacity-90">{chunks}</span>,
                    quantity: formattedQuantity,
                    product: currentSale.product,
                    user: currentSale.username 
                  })}
                </p>
                <p className="opacity-75 text-xs hidden sm:block whitespace-nowrap">
                  ({formatTimeAgo(currentSale.timeAgo, t)})
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 