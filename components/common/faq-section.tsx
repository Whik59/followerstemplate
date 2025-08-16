import { getTranslations } from 'next-intl/server';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getSectionContent } from '@/lib/mdx-content';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqSectionProps {
  locale: string;
}

export async function FaqSection({ locale }: FaqSectionProps) {
  const t = await getTranslations({ locale, namespace: 'Common' });
  const faqSectionData = await getSectionContent(locale, 'components/faq');

  if (!faqSectionData) {
    return null;
  }

  const outerAccordionId = "faq-main-accordion";

  return (
    <section id="faq" className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8">
        <Accordion type="single" collapsible defaultValue={outerAccordionId} className="w-full space-y-4">
          <AccordionItem value={outerAccordionId} className="border-none rounded-lg shadow-lg overflow-hidden bg-amber-50/50">
            <AccordionTrigger className="text-3xl md:text-4xl font-bold text-amber-700 hover:text-amber-600 w-full flex justify-between items-center p-6 hover:bg-amber-100/70 transition-colors group">
              <span>{faqSectionData.frontmatter.title || t('faqTitle', { fallback: "FAQ"})}</span>
            </AccordionTrigger>
            <AccordionContent className="pt-0 p-6 bg-white">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                <div className="relative h-80 md:h-[500px] rounded-lg overflow-hidden shadow-xl md:order-first">
                  <Image 
                    src="/homepage/faq.webp" 
                    alt={faqSectionData.frontmatter.title || t('faqTitle', { fallback: "FAQ"})} 
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="prose prose-amber lg:prose-lg max-w-none md:order-last">
                  {faqSectionData.content && <MDXRemote source={faqSectionData.content} />}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
} 