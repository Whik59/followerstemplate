import { getTranslations } from 'next-intl/server';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getSectionContent } from '@/lib/mdx-content';
import Image from 'next/image';

interface AboutUsSectionProps {
  locale: string;
}

export async function AboutUsSection({ locale }: AboutUsSectionProps) {
  const t = await getTranslations({ locale, namespace: 'Common' });
  const aboutSectionData = await getSectionContent(locale, 'components/about');

  if (!aboutSectionData) {
    // console.warn(`[AboutUsSection] MDX content not found for locale: ${locale}, path: components/about`);
    return (
      <section id="about-us" className="py-12 md:py-16 bg-slate-50 dark:bg-slate-800/30">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-amber-700 dark:text-amber-500 mb-4">
            {t('aboutUsTitle', { fallback: "About Us"})}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{t('contentUnavailableError', { fallback: "Content for this section is currently unavailable."})}</p>
        </div>
      </section>
    );
  }

  const sectionTitle = aboutSectionData.frontmatter.title || t('aboutUsTitle', { fallback: "About Us"});
  const imageAltText = aboutSectionData.frontmatter.imageAlt || sectionTitle; // Use specific alt from frontmatter if available

  return (
    <section id="about-us" className="pt-8 md:pt-10 pb-6 md:pb-8 bg-white dark:bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-center mb-6">
          <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 px-6 py-3 rounded-2xl shadow-md border border-amber-500 dark:border-amber-700">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-white dark:text-amber-100 m-0">
              {sectionTitle}
            </h2>
          </div>
        </div>
        {aboutSectionData.frontmatter.subtitle && (
          <p className="mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            {aboutSectionData.frontmatter.subtitle}
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="prose prose-lg sm:prose-xl dark:prose-invert max-w-none 
                        text-slate-700 dark:text-slate-300 
                        prose-headings:font-semibold prose-headings:text-amber-700 dark:prose-headings:text-amber-400
                        prose-a:text-amber-600 hover:prose-a:text-amber-700 dark:prose-a:text-amber-400 dark:hover:prose-a:text-amber-300
                        p-2">
            {aboutSectionData.content && <MDXRemote source={aboutSectionData.content} />}
          </div>
          
          <div className="relative h-80 sm:h-96 md:h-[550px] rounded-xl overflow-hidden shadow-2xl group transform hover:scale-105 transition-transform duration-300 ease-in-out">
            <Image 
              src={aboutSectionData.frontmatter.imagePath || "/homepage/aboutus.webp"} 
              alt={imageAltText} 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity duration-300"></div>
          </div>
        </div>
      </div>
    </section>
  );
} 