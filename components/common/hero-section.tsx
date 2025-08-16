import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getSectionContent } from '@/lib/mdx-content';
import { Button } from '@/components/ui/button';
import { Star, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { VideosSection } from '@/components/common/videos-section';
import { ReviewsSummary } from '@/components/common/reviews-summary';
import { FeaturesStrip } from './features-strip';

interface HeroSectionProps {
  locale: string;
  averageRating: number;
  totalReviewsCount: number;
  ratingDescription: string;
}

export async function HeroSection({ locale, averageRating, totalReviewsCount, ratingDescription }: HeroSectionProps) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Common' });
  const heroContent = await getSectionContent(locale, 'components/hero');

  if (!heroContent) {
    return (
      <section className="py-20 md:py-32 bg-gradient-to-b from-amber-50 via-amber-100/50 to-background text-center">
        <p>Error: Hero content not found for locale: {locale}</p>
      </section>
    );
  }

  const { title, subtitle, buttonText, reviewText, reviewRating } = heroContent.frontmatter;

  return (
    <section className="relative bg-gradient-to-b from-amber-50 via-white to-amber-50/30 
                      dark:from-amber-950 dark:via-black dark:to-black 
                      text-gray-800 dark:text-gray-200 overflow-hidden 
                      pt-8 md:pt-16 pb-8 sm:pb-10">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-200/30 dark:bg-amber-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light blur-3xl animate-blob" />
        <div className="absolute -top-8 right-1/4 w-96 h-96 bg-orange-200/30 dark:bg-orange-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-yellow-200/30 dark:bg-yellow-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container relative mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 md:items-center">
          <div className="flex flex-col items-start text-left space-y-6 md:space-y-8 order-2 md:order-1">
            <div className="relative">
              <div className="flex justify-center">
                <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 px-6 py-3 rounded-2xl shadow-md border border-amber-500 dark:border-amber-700 relative">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wide text-white dark:text-amber-100 m-0">
                    <span>
                      {title || t('heroTitle', { siteNameFromEnv: process.env.NEXT_PUBLIC_SITE_NAME || "Pelucheland"})}
                    </span>
                    <Sparkles className="absolute -top-6 -right-6 w-6 h-6 text-amber-100 dark:text-amber-200 animate-float" />
                  </h1>
                </div>
              </div>
            </div>
            
            {subtitle && (
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 
                          max-w-[35ch] font-medium leading-relaxed
                          animate-slide-in-left animation-delay-300">
                {subtitle}
              </p>
            )}
            
            <div className="prose prose-lg prose-amber dark:prose-invert max-w-none 
                          text-gray-600 dark:text-gray-400 text-base sm:text-lg
                          animate-slide-in-left animation-delay-500">
              <MDXRemote source={heroContent.content} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full
                          animate-slide-in-left animation-delay-700">
              <Button 
                asChild 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-yellow-500 
                         hover:from-amber-600 hover:to-yellow-600 
                         dark:from-amber-400 dark:to-yellow-400 
                         dark:hover:from-amber-500 dark:hover:to-yellow-500 
                         text-white font-semibold shadow-lg hover:shadow-amber-500/25 
                         transform hover:scale-[1.02] transition-all duration-300 
                         text-base sm:text-lg md:text-xl py-6 px-8 rounded-xl"
              >
                <Link href={`/${locale}/products`} className="flex items-center justify-center gap-2">
                  {buttonText || t('exploreProducts')}
                  <Star className="w-5 h-5 animate-pulse" />
                  {/* Shine effect overlay */}
                  <div className="absolute inset-0 animate-shine" />
                </Link>
              </Button>

              {reviewText && (
                <div className="flex items-center space-x-3 bg-white/80 dark:bg-black/30 
                              backdrop-blur-sm rounded-xl p-4 
                              border border-amber-200/50 dark:border-amber-800/30
                              animate-shimmer">
                  <div className="flex shrink-0">
                    {reviewRating && Array.from({ length: 5 }, (_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${
                          i < Math.floor(reviewRating) 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-gray-300 dark:text-gray-600'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{reviewText}</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative w-full sm:mx-0 order-1 md:order-2 flex flex-col items-center animate-slide-in-right">
            <div className="w-full max-w-xl sm:w-full backdrop-blur-sm bg-white/30 dark:bg-black/30 
                         sm:rounded-2xl p-2 sm:p-4 
                         shadow-xl shadow-amber-500/5">
              <VideosSection locale={locale} />
            </div>
            <div className="mt-4 sm:mt-6 w-full max-w-md px-4 sm:px-0
                          animate-slide-in-right animation-delay-300">
              <ReviewsSummary 
                locale={locale} 
                averageRating={averageRating} 
                totalReviewsCount={totalReviewsCount}
                ratingDescription={ratingDescription}
              />
            </div>
          </div>
        </div>
      </div>

      <FeaturesStrip locale={locale} />

    </section>
  );
} 