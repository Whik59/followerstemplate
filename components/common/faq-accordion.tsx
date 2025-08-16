'use client';

import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Package, ShieldCheck } from 'lucide-react'; // Simplified icons

export function FaqAccordion() {
  const t = useTranslations('Common');

  const faqItems = [
    {
      id: 'delivery-time',
      icon: Package,
      titleKey: 'deliveryTimeTitle',
      contentKey: 'deliveryTimeContent',
    },
    {
      id: 'product-quality',
      icon: ShieldCheck, 
      titleKey: 'productQualityTitle',
      contentKey: 'productQualityContent',
    },
    {
      id: 'refund-policy',
      icon: ShieldCheck,
      titleKey: 'refundPolicyTitle',
      contentKey: 'refundPolicyContent',
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto pt-10 pb-0 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center mb-6">
        <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 px-6 py-3 rounded-2xl shadow-md border border-amber-500 dark:border-amber-700">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-white dark:text-amber-100 m-0">
            {t('mainTitle')}
          </h2>
        </div>
      </div>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {faqItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className="bg-card border border-border rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out"
            >
              <AccordionTrigger className="group text-lg font-semibold px-6 py-5 text-left hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-lg flex items-center justify-between w-full">
                <span className="flex items-center">
                  <IconComponent className="w-6 h-6 mr-3 text-primary group-hover:text-primary-focus transition-colors" />
                  {t(item.titleKey)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-0 pb-5 text-base text-muted-foreground">
                <Separator className="mb-4 bg-border/70" />
                <div className="prose prose-sm sm:prose dark:prose-invert max-w-none whitespace-pre-line">
                  {t(item.contentKey)}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export default FaqAccordion; 