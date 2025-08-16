// import fs from 'fs';
// import path from 'path';
// import matter from 'gray-matter';
import { unstable_setRequestLocale, getTranslations, getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import { getUserGeoInfo } from '@/lib/utils/geolocation';
import type { Product } from '@/types/product';

import { ProductPageClient } from '@/components/common/product-page-client';
import { fetchProductDetailsServer } from './actions'; // Corrected import path
import type { ProductDetailsPayload } from '@/components/common/product-page-client';
import { VideosSection } from '@/components/common/videos-section';
import { ReviewsSection } from '@/components/common/reviews-section';
import { ReviewsSummary } from '@/components/common/reviews-summary';
import { SimilarProducts } from '@/components/common/similar-products'; // Added import
// import { FaqAccordion } from '@/components/common/faq-accordion';
import { reviewsMetadata } from '@/lib/data/reviews-metadata'; // Import site-wide reviews metadata
import { locales as allLocales } from "@/config/i18n.config"; // Renamed import
import { Locale } from "@/config/i18n.config";
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { pick } from 'lodash';
// import { notFound } from 'next/navigation';
import { AboutUsSection } from '@/components/common/about-us-section';
import { WhyChooseUsSection } from '@/components/common/why-choose-us-section';
import { OurValuesSection } from '@/components/common/our-values-section';
// import { NextIntlClientProvider } from 'next-intl';
import type { Metadata } from 'next';
import type { MDXFrontmatter } from './actions';
// import { getMessages } from 'next-intl/server';
// import { pick } from 'lodash';
// import { AboutUsSection } from '@/components/common/about-us-section';
// import { WhyChooseUsSection } from '@/components/common/why-choose-us-section';
// import { OurValuesSection } from '@/components/common/our-values-section';
import { getProductById } from '@/lib/api/products';
import { fetchAllProductSlugMaps, fetchProductSlugMapForLocale } from '@/lib/api/slug-map';
import fs from 'fs/promises';
import path from 'path';
import { serialize } from 'next-mdx-remote/serialize';
import matter from 'gray-matter';

// Define a base URL for canonical links and image paths
// const CANONICAL_DOMAIN_FALLBACK = 'https://www.example.com'; // Fallback if env var is not set

// ISR: Revalidate product pages every 1 hour (3600 seconds)
// export const revalidate = 3600;
export const revalidate = false; // Revalidate every 60 seconds for ISR

// Helper function to get rating description (defined at module level)
async function getRatingDescription(averageRating: number, locale: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'Common' }); 
  if (averageRating >= 4.8) return t('ratingPerfect', { defaultValue: 'Perfect' });
  if (averageRating >= 4.5) return t('ratingExcellent', { defaultValue: 'Excellent' });
  if (averageRating >= 4.0) return t('ratingVeryGood', { defaultValue: 'Very Good' });
  if (averageRating >= 3.5) return t('ratingGood', { defaultValue: 'Good' });
  if (averageRating >= 3.0) return t('ratingAverage', { defaultValue: 'Average' });
  if (averageRating >= 2.0) return t('ratingFair', { defaultValue: 'Fair' });
  if (averageRating >= 1.0) return t('ratingPoor', { defaultValue: 'Poor' });
  if (averageRating > 0) return t('ratingVeryPoor', { defaultValue: 'Very Poor' });
  return t('noRating', { defaultValue: 'Not Rated Yet' });
}

// Define helper interfaces for translated variations (can be moved to a shared types file later)
interface TranslatedVariationOption {
  originalName: string;
  translatedName: string;
}

// Updated MDXFrontmatter interface to match actions.ts
// interface MDXFrontmatter { ... }

// const contentDirectory = path.join(process.cwd(), 'content');
const siteNameFromEnv = process.env.NEXT_PUBLIC_SITE_NAME || "Your Awesome Shop";
const canonicalDomain = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || 'https://www.example.com';
const _defaultLocale = 'en';

export async function generateStaticParams() {
  // For simplicity, we are not generating static params for all products here.
  // In a real-world scenario, you might fetch all product slugs for all locales.
  // This is often complex and might not be suitable for very large e-commerce sites.
  // Returning an empty array means all pages will be dynamically rendered at request time or ISR.
  return [];
}

interface ProductPageParams {
  locale: Locale;
  productSlug: string;
}

async function getProductIdBySlug(slug: string, locale: string): Promise<number | null> {
  const allSlugMaps = await fetchAllProductSlugMaps();
  for (const [id, map] of Object.entries(allSlugMaps)) {
    if (map.locales?.[locale] === slug) return Number(id);
  }
  return null;
}

export async function generateMetadata({ params }: { params: ProductPageParams }): Promise<Metadata> {
  unstable_setRequestLocale(params.locale);
  const productId = await getProductIdBySlug(params.productSlug, params.locale);
  if (!productId) {
    return {
      title: `Product Not Found | ${siteNameFromEnv}`,
      description: "The product you are looking for could not be found.",
      robots: { index: false, follow: false },
      alternates: {
        canonical: `${canonicalDomain}/${params.locale}/products/${params.productSlug}`,
        languages: allLocales.reduce((acc, loc) => {
          acc[loc] = `${canonicalDomain}/${loc}/products/${params.productSlug}`;
          return acc;
        }, {} as Record<string, string>),
      },
    };
  }
  const productDataFromJSON = await getProductById(productId);
  let mdxFrontmatter: MDXFrontmatter = {};
  try {
    const mdxPath = path.join(process.cwd(), `content/${params.locale}/products/${productId}.mdx`);
    const mdxSource = await fs.readFile(mdxPath, 'utf8');
    const { data } = matter(mdxSource);
    mdxFrontmatter = data as MDXFrontmatter;
  } catch {}
  // Load product translations and use the translated name for the current locale if available
  let translatedName = '';
  try {
    const translationsPath = path.join(process.cwd(), 'data/product-translations', `${productId}.json`);
    const translations = JSON.parse(await fs.readFile(translationsPath, 'utf8'));
    translatedName = translations[params.locale] || '';
  } catch {}
  const imageUrl = productDataFromJSON?.imagePaths?.[0] ? `${canonicalDomain}${productDataFromJSON.imagePaths[0]}` : undefined;
  const titleToUse = translatedName || mdxFrontmatter?.metaTitle || mdxFrontmatter?.title || productDataFromJSON?.productNameCanonical || `Product Not Found | ${siteNameFromEnv}`;
  const descriptionToUse = mdxFrontmatter?.description || translatedName || productDataFromJSON?.productNameCanonical || `View details for ${productDataFromJSON?.productNameCanonical}`;
  return {
    title: titleToUse,
    description: descriptionToUse,
    openGraph: {
      title: titleToUse,
      description: descriptionToUse,
      images: imageUrl ? [{ url: imageUrl, alt: mdxFrontmatter?.imageAltProduct || titleToUse }] : [],
      url: `${canonicalDomain}/${params.locale}/products/${params.productSlug}`,
      type: 'article',
      siteName: siteNameFromEnv,
    },
    twitter: {
      card: 'summary_large_image',
      title: titleToUse,
      description: descriptionToUse,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${canonicalDomain}/${params.locale}/products/${params.productSlug}`,
      languages: allLocales.reduce((acc, loc) => {
        acc[loc] = `${canonicalDomain}/${loc}/products/${params.productSlug}`;
        return acc;
      }, {} as Record<string, string>),
    },
  };
}

// ProductPage Server Component - now async and fetches data
export default async function ProductPage({ params, searchParams }: { params: ProductPageParams, searchParams?: { [key: string]: string | string[] | undefined } }) {
  console.log('[MDX DEBUG] ProductPage route loaded', params);
  const startTime = new Date();
  console.log(`[TTFB Debug] Product page server component rendering STARTED for slug: ${params.productSlug}, locale: ${params.locale}, timestamp: ${startTime.toISOString()}`);
  unstable_setRequestLocale(params.locale);

  // 1. Load messages for the client component
  const messages = await getMessages();

  // Fetch the slug map for the current locale
  const productSlugMap = await fetchProductSlugMapForLocale(params.locale);

  // Remove all direct MDX reading/serialization logic
  // Use the server action to fetch all product details, including MDX structure
  const productDetails = await fetchProductDetailsServer(params.locale, params.productSlug);

  // Render VideosSection and FaqAccordion here in the Server Component
  const videosComponent = <VideosSection locale={params.locale} />;
  const reviewsComponent = <ReviewsSection locale={params.locale} />;
  const whyChooseUsComponent = <WhyChooseUsSection locale={params.locale} />;
  // const faqAccordionComponent = <FaqAccordion />;
  let similarProductsComponent = null;
  let reviewsSummaryComponent = null;

  // Calculate site-wide review aggregates
  if (reviewsMetadata && reviewsMetadata.length > 0) {
    const siteTotalReviewsCount = reviewsMetadata.length;
    const siteTotalRatingSum = reviewsMetadata.reduce((sum, review) => sum + review.rating, 0);
    const siteAverageRating = siteTotalReviewsCount > 0 ? siteTotalRatingSum / siteTotalReviewsCount : 0;
    const ratingDescriptionText = await getRatingDescription(siteAverageRating, params.locale);
    reviewsSummaryComponent = (
      <ReviewsSummary
        locale={params.locale}
        averageRating={siteAverageRating}
        totalReviewsCount={siteTotalReviewsCount}
        ratingDescription={ratingDescriptionText}
      />
    );
  }

  // Prepare SimilarProducts component if product data is available
  if (productDetails && productDetails.productDataFromJSON && productDetails.productDataFromJSON.productId && productDetails.productDataFromJSON.categoryIds) {
    const similarPage = searchParams?.similarPage ? parseInt(String(searchParams.similarPage), 10) : 1;
    similarProductsComponent = (
      <Suspense fallback={<div className="text-center py-8">Loading similar products...</div>}>
        <SimilarProducts
          currentProductId={productDetails.productDataFromJSON.productId}
          currentProductCategoryIds={productDetails.productDataFromJSON.categoryIds}
          locale={params.locale}
          productSlugMap={productSlugMap}
          geoCountryCode={productDetails.detectedCountryForPricing}
          formattingLocale={productDetails.detectedLocale}
          initialPage={similarPage}
        />
      </Suspense>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-background dark:from-amber-900 dark:via-amber-800/50 dark:to-background min-h-screen">
      {productDetails.productSchema && typeof productDetails.productSchema === 'object' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productDetails.productSchema) || '' }}
        />
      )}
      <Suspense fallback={<div>Loading...</div>}>
        <NextIntlClientProvider
          locale={params.locale}
          messages={pick(messages, 'Common', 'Smma')}
        >
          <ProductPageClient
            locale={params.locale}
            productSlug={params.productSlug}
            initialProductDetails={productDetails}
            videosComponent={videosComponent}
            reviewsSummaryComponent={reviewsSummaryComponent}
            fullReviewsSectionComponent={reviewsComponent}
            whyChooseUsSectionComponent={whyChooseUsComponent}
            // faqAccordionComponent={faqAccordionComponent}
            similarProductsComponent={similarProductsComponent}
          />
        </NextIntlClientProvider>
      </Suspense>
     
    </div>
  );
} 