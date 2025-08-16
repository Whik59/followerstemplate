'use client';

import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

export function ProductFaqAccordion() {
  const t = useTranslations('Common');

  const faqItems = [
    {
      id: 'delivery-time',
      icon: Zap,
      titleKey: 'productFaqQ4', // How long does delivery take?
      contentKey: 'productFaqA4',
    },
    {
      id: 'profile-quality',
      icon: ShieldCheck, 
      titleKey: 'productFaqQ1', // Are the profiles real?
      contentKey: 'productFaqA1',
    },
    {
      id: 'risk-free',
      icon: ShieldCheck,
      titleKey: 'productFaqQ2', // Is there any risk?
      contentKey: 'productFaqA2',
    },
    {
      id: 'no-subscription',
      icon: RefreshCw,
      titleKey: 'productFaqQ3', // Is there a subscription?
      contentKey: 'productFaqA3',
    },
  ];

  return (
    <div className="w-full mt-6">
      <Accordion type="single" collapsible className="w-full space-y-3">
        {faqItems.map((item) => (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <AccordionTrigger className="group text-base font-medium px-4 py-3 text-left hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-lg flex items-center justify-between w-full">
                <span className="flex items-center">
                  <item.icon className="w-5 h-5 mr-3 text-amber-600 dark:text-amber-500 transition-colors" />
                  {t(item.titleKey)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
                  {t(item.contentKey)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    </div>
  );
}

export default ProductFaqAccordion; 