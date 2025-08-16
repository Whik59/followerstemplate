// import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";
import Link from 'next/link';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { reviewsMetadata } from '@/lib/data/reviews-metadata';
import { unstable_cache } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { getUserGeoInfo } from '@/lib/utils/geolocation';
import { fetchAllProductSlugMaps, fetchProductSlugMapForLocale, fetchAllCategorySlugMaps } from '@/lib/api/slug-map';
import { headers } from 'next/headers';
// import { fetchProductTranslationsFrom } from '@/lib/utils/products';
// import { fetchCategoryTranslations } from '@/lib/utils/categories';
// import { getTopCategoriesWithProducts } from '@/lib/utils/categories';

// import fs from 'fs';
// import path from 'path';
// import matter from 'gray-matter';
// import { MDXRemote } from 'next-mdx-remote/rsc';
// import { notFound } from 'next/navigation';

// Data imports
// productsData removed as we'll fetch dynamically
import { ProductCard } from '@/components/common/product-card';
// import { Product } from '@/types/product';
import { ReviewSummary } from '@/types/review';

// Import section components
import { HeroSection } from '@/components/common/hero-section';
import { AboutUsSection } from '@/components/common/about-us-section'; 
import { WhyChooseUsSection } from '@/components/common/why-choose-us-section'; 
import { OurValuesSection } from '@/components/common/our-values-section'; 
import { FaqAccordion } from '@/components/common/faq-accordion';

// Import the new data fetching function
import { getTopCategoriesWithProducts, TopCategoryWithProducts } from '@/lib/utils/categories';
import type { Product } from '@/types/product';
import { CategorySelector } from '@/components/common/category-selector';
import { SMMACTA } from '@/components/common/smma-cta';
import { LottieAnimation } from '@/components/common/lottie-animation';

// const contentDirectory = path.join(process.cwd(), 'content');
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Shop"; // Simplified fallback
const canonicalDomain = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || "example.com"; // More generic fallback
import { locales } from "@/config/i18n.config";

const defaultLocale = 'en';
// featuredProductsCount removed as it's no longer used in the same way
const PRODUCTS_PER_CATEGORY_HOME = parseInt(process.env.NEXT_PUBLIC_PRODUCTS_PER_CATEGORY_HOME || '10', 10);
const NUMBER_OF_CATEGORIES_HOME = 5;

// Helper function to generate random review summary (can be kept if ProductCard still needs it)
function _generateRandomReviewSummary(): ReviewSummary {
  const randomRatingOptions = [4.0, 4.5, 5.0];
  const averageRating = randomRatingOptions[Math.floor(Math.random() * randomRatingOptions.length)];
  const numberOfReviews = Math.floor(Math.random() * (55 - 8 + 1)) + 8; 
  return { averageRating, numberOfReviews };
}

// Correctly generate metadata for each locale
export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: 'Common'});
 
  const alternates: Record<string, string> = {};
  locales.forEach(altLocale => {
    alternates[altLocale] = `${canonicalDomain}/${altLocale}`;
  });
  alternates['x-default'] = `${canonicalDomain}/${defaultLocale}`;

  return {
    title: `${t('homePageTitle', { siteNameFromEnv: siteName })} | ${siteName}`,
    description: t('homePageDescription'),
    alternates: {
      canonical: `${canonicalDomain}/${locale}`,
      languages: alternates,
    }
  };
}

interface HomePageProps {
  params: {
    locale: string;
  };
}

const ReviewsSection = dynamic(() => import('@/components/common/reviews-section').then(mod => mod.ReviewsSection), { ssr: false });

const getTopCategoriesWithProductsCached = unstable_cache(
  getTopCategoriesWithProducts,
  ['top-categories-with-products'],
  { revalidate: 300 }
);

export const revalidate = false;

export default async function HomePage({ params: { locale } }: HomePageProps) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Common' });
  
  // Fetch top categories with their products
  const topCategoriesData = await getTopCategoriesWithProductsCached(locale, PRODUCTS_PER_CATEGORY_HOME, NUMBER_OF_CATEGORIES_HOME);

  // --- Collect all product IDs shown on the homepage ---
  const allProductIds = Array.from(new Set(
    topCategoriesData.flatMap(cat => (cat.products || []).map(p => p.productId))
  ));

  // --- Load translations for these products (batched by locale) ---
  let productTranslations: Record<string, string> = {};
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'data/batched-product-translations', `${locale}.json`), 'utf8');
    productTranslations = JSON.parse(file);
  } catch {
    productTranslations = {};
  }

  // --- Get geoCountryCode and formattingLocale for currency/number formatting ---
  const requestHeaders = headers();
  const { locale: formattingLocale, countryCode: geoCountryCode } = await getUserGeoInfo(requestHeaders);

  // --- Load product slug map (batched by locale) ---
  const productSlugMap = await fetchProductSlugMapForLocale(locale);

  // Calculate review statistics for HeroSection (can be simplified if Hero is also changing)
  const totalReviewsCount = reviewsMetadata.length;
  let sumOfRatings = 0;
  for (const review of reviewsMetadata) {
    sumOfRatings += review.rating;
  }
  const rawAverageRating = totalReviewsCount > 0 ? sumOfRatings / totalReviewsCount : 0;
  const averageRating = Math.round(rawAverageRating * 2) / 2; 
  let ratingDescriptionKey = 'ratingDescriptionGood'; 
  if (averageRating >= 4.8) ratingDescriptionKey = 'ratingDescriptionExcellent';
  else if (averageRating >= 4.3) ratingDescriptionKey = 'ratingVeryGood';
  else if (averageRating >= 3.5) ratingDescriptionKey = 'ratingGood';
  const ratingDescription = t(ratingDescriptionKey);

  // Define an interface for the objects in the category translations array
  interface CategoryTranslationRecord {
    categoryId: number;
    translations: Record<string, string>;
  }

  // --- Load category translations for top categories ---
  const categoryTranslations: Record<number, Record<string, string>> = {};
  await Promise.all(
    topCategoriesData.map(async (cat) => {
      const filePath = path.join(process.cwd(), 'data/category-translations.json');
      try {
        const file = await fs.readFile(filePath, 'utf8');
        const translationsArr: CategoryTranslationRecord[] = JSON.parse(file);
        const found = translationsArr.find((c) => c.categoryId === cat.categoryId);
        if (found) categoryTranslations[cat.categoryId] = found.translations;
      } catch {
        categoryTranslations[cat.categoryId] = {};
      }
    })
  );

  // --- Load SMMA CTA translations server-side ---
  let smmaTranslations: { headline: string; subheadline: string } = { headline: '', subheadline: '' };
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'locales', locale, 'smma.json'), 'utf8');
    smmaTranslations = JSON.parse(file);
  } catch {
    try {
      const file = await fs.readFile(path.join(process.cwd(), 'locales', 'en', 'smma.json'), 'utf8');
      smmaTranslations = JSON.parse(file);
    } catch {
      smmaTranslations = { headline: '', subheadline: '' };
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-grow">
        
        <SMMACTA translations={smmaTranslations} />
        <div className="flex flex-col md:flex-row md:items-start md:gap-8 my-12 w-full max-w-5xl mx-auto">
        <LottieAnimation />
          <div className="md:w-1/2">
            <CategorySelector locale={locale} />
          </div>
          {/* <div className="md:w-1/2 md:mt-0 mt-8">
            <FeatureList locale={locale} />
          </div> */}
        </div>
        <HeroSection 
          locale={locale} 
          averageRating={averageRating} 
          totalReviewsCount={totalReviewsCount}
          ratingDescription={ratingDescription}
        />
        
        <WhyChooseUsSection locale={locale} />

        {/* Reviews Section: Wrapper padding was previously removed, now relies on ReviewsSection internal padding */}
        <div id="reviews-section" className="bg-amber-50 dark:bg-amber-900">
          <Suspense fallback={<div className="min-h-[300px] flex items-center justify-center">Loading reviews...</div>}>
            <ReviewsSection locale={locale} />
          </Suspense>
        </div>

       
      </main>
    </div>
  );
} 