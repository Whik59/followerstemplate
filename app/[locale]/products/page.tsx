// import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { getAllProducts, type PaginatedProductsResponse } from '@/lib/utils/products';
import type { Metadata } from 'next';
import { PaginationControls } from '@/components/common/pagination-controls';
import { ProductCard } from '@/components/common/product-card';
import type { ReviewSummary } from '@/types/review';
import type { Product } from '@/types/product';
import { CategoryFilters, type Category as CategoryFilterType } from '@/components/common/category-filters';
import { getLightweightHierarchicalCategoryData, type ProcessedCategoryData } from '@/lib/utils/categories';
import { headers } from 'next/headers';
import { getUserGeoInfo } from '@/lib/utils/geolocation';
import { ReviewsSummary } from '@/components/common/reviews-summary';
import { ReviewsSection } from '@/components/common/reviews-section';
import { reviewsMetadata } from '@/lib/data/reviews-metadata';
import { Suspense } from 'react';
import { AboutUsSection } from '@/components/common/about-us-section';
import { WhyChooseUsSection } from '@/components/common/why-choose-us-section';
import { OurValuesSection } from '@/components/common/our-values-section';
import fs from 'fs/promises';
import path from 'path';
import { fetchProductSlugMapForLocale, fetchAllCategorySlugMaps } from '@/lib/api/slug-map';

// Helper function to convert the category tree into a flat list for the filter component
function flattenCategories(categories: ProcessedCategoryData[]): Omit<ProcessedCategoryData, 'children'>[] {
  const flat: Omit<ProcessedCategoryData, 'children'>[] = [];
  function recurse(nodes: ProcessedCategoryData[]) {
    for (const node of nodes) {
      // Create a copy of the node without its children to avoid circular references
      const { children, ...rest } = node;
      flat.push(rest);
      if (children) {
        recurse(children);
      }
    }
  }
  recurse(categories);
  return flat;
}

async function getProductTranslationsById(id: number) {
  try {
    const file = path.join(process.cwd(), 'data/product-translations', `${id}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

function generateRandomReviewSummary(): ReviewSummary {
  const randomRatingOptions = [4.0, 4.5, 5.0];
  const averageRating = randomRatingOptions[Math.floor(Math.random() * randomRatingOptions.length)];
  const numberOfReviews = Math.floor(Math.random() * (55 - 8 + 1)) + 8;
  return { averageRating, numberOfReviews };
}

async function getAllProductTranslations(productIds: number[], locale: string): Promise<Record<string, string>> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'data/batched-product-translations', `${locale}.json`), 'utf8');
    const allTranslations = JSON.parse(file);
    
    const relevantTranslations: Record<string, string> = {};
    for (const id of productIds) {
      if (allTranslations[id]) {
        relevantTranslations[id] = allTranslations[id];
      }
    }
    return relevantTranslations;
  } catch {
    return {};
  }
}

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

export async function generateMetadata({ params: { locale }, searchParams }: { params: { locale: string }, searchParams?: { page?: string, category?: string } }): Promise<Metadata> {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ProductsPage' });
  const commonT = await getTranslations({ locale, namespace: 'Common' });
  const siteNameValue = commonT('siteName');
  const pageTitle = t('metaTitleAllProducts', { siteNameFromEnv: siteNameValue });
  const pageDescription = t('metaDescriptionAllProducts', { siteNameFromEnv: siteNameValue });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: `/${locale}/products`,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `/${locale}/products`,
      siteName: siteNameValue,
      type: 'website',
      images: [
        {
          url: '/images/og-image.png',
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
  };
}

export const revalidate = false;

export default async function ProductsPage({ params, searchParams }: { params: { locale: string }, searchParams?: { page?: string, category?: string } }) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'ProductsPage' });
  const commonT = await getTranslations({ locale: params.locale, namespace: 'Common' });
  const siteNameValue = commonT('siteName');

  const headersList = headers();
  const { countryCode: geoCountryCode, locale: formattingLocale } = await getUserGeoInfo(headersList);

  const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
  const limit = 16;
  const categoryIdFromSearch = searchParams?.category ? parseInt(searchParams.category, 10) : undefined;

  // Fetch all slug maps and translations at once
  const productSlugMap = await fetchProductSlugMapForLocale(params.locale);

  const productsResponse: PaginatedProductsResponse = await getAllProducts({ 
    page, 
    limit,
    categoryId: categoryIdFromSearch
  });
  const { products, totalPages, currentPage } = productsResponse;

  // Load product translations for all products on the page
  const productIds = products.map((product) => product.productId);
  const productTranslations = await getAllProductTranslations(productIds, params.locale);

  let reviewsSummaryComponent = null;
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

  // Use the new, fast, lightweight function to get category data
  const categoryTree = await getLightweightHierarchicalCategoryData(params.locale);
  const categoriesFromMdx = flattenCategories(categoryTree);

  const allCategories: CategoryFilterType[] = categoriesFromMdx.map((cat) => ({
    categoryId: cat.categoryId,
    categoryNameCanonical: cat.categoryNameCanonical,
    parentCategoryId: cat.parentCategoryId,
    localizedName: cat.localeShortTitle,
  }));

  const itemsPerPage = limit;
  const totalItems = productsResponse.totalProducts;

  return (
    <div className="bg-amber-50 dark:bg-amber-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Site-wide Reviews Summary - Placed at the top */}
        {reviewsSummaryComponent && (
          <div className="mb-8">
            {reviewsSummaryComponent}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <CategoryFilters categories={allCategories} _currentLocale={params.locale} />
          <div className="flex-1">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {products.map((product: Product, index: number) => {
                    const productForCard = {
                      productId: product.productId,
                      productNameCanonical: product.productNameCanonical,
                      basePrice: product.basePrice,
                      imagePaths: product.imagePaths || [],
                      categoryIds: product.categoryIds,
                      variations: product.variations,
                    };
                    return (
                      <ProductCard 
                        key={product.productId}
                        product={productForCard}
                        locale={params.locale}
                        geoCountryCode={geoCountryCode}
                        formattingLocale={formattingLocale}
                        productSlug={productSlugMap[product.productId] || product.productNameCanonical}
                        productTranslations={productTranslations}
                        isPriority={index < 5}
                      />
                    );
                  })}
                </div>
                
                <PaginationControls 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  queryParamName="page"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center h-full">
                <div className="mb-4 rounded-full bg-muted p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-muted-foreground"><path d="M21 10c0-4.4-3.6-8-8-8S5 5.6 5 10c0 .8.1 1.6.4 2.3l-3.9 3.9c-.4.4-.4 1 0 1.4s1 .4 1.4 0l3.9-3.9c.7.3 1.5.4 2.3.4 4.4 0 8-3.6 8-8Z"/><path d="M17.6 17.6c-1.7 1.7-4 2.4-6.4 2.4H9"/><path d="m9.1 13.1 7.8-7.8"/></svg>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">{t('noProductsFound', { siteNameFromEnv: siteNameValue })}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {commonT('checkBackLaterOrClearFilters')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section - Placed at the bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Suspense fallback={<div>Loading reviews...</div>}>
            <ReviewsSection locale={params.locale} />
          </Suspense>
        </div>
      </div>

      {/* Informational Sections */}
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16 space-y-12 md:space-y-16">
        <Suspense fallback={<div>Loading About Us...</div>}>
          <AboutUsSection locale={params.locale} />
        </Suspense>
        <Suspense fallback={<div>Loading Why Choose Us...</div>}>
          <WhyChooseUsSection locale={params.locale} />
        </Suspense>
        <Suspense fallback={<div>Loading Our Values...</div>}>
          <OurValuesSection locale={params.locale} />
        </Suspense>
      </div>
    </div>
  );
} 