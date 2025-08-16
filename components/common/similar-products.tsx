import { ProductCard } from '@/components/common/product-card';
import { getTranslations } from 'next-intl/server';
import { PaginationControls } from '@/components/common/pagination-controls';
import { shuffleArray } from '@/lib/utils/array';
import { Star, Sparkles } from 'lucide-react';
import { getAllProducts } from '@/lib/utils/products';
import type { Product as CanonicalProduct } from '@/types/product';
import fs from 'fs/promises';
import path from 'path';

interface SimilarProductsProps {
  currentProductId: number;
  currentProductCategoryIds: number[];
  locale: string;
  productSlugMap: Record<string, string>;
  geoCountryCode: string;
  formattingLocale: string;
  initialPage?: number;
}

const PRODUCTS_PER_PAGE = 6;

async function getProductTranslationsById(id: number) {
  try {
    const file = path.join(process.cwd(), 'data/product-translations', `${id}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

export async function SimilarProducts({
  currentProductId,
  currentProductCategoryIds,
  locale,
  productSlugMap,
  geoCountryCode,
  formattingLocale,
  initialPage = 1,
}: SimilarProductsProps) {
  const t = await getTranslations({ locale, namespace: 'ProductPage' });
  const tCommon = await getTranslations({ locale, namespace: 'Common' });

  const productsResponse = await getAllProducts({
    categoryIds: currentProductCategoryIds,
    limit: 50,
    excludeProductIds: [currentProductId]
  });

  if (!productsResponse || productsResponse.products.length === 0) {
    return (
      <div className="my-12 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">{t('noSimilarProductsFound')}</p>
      </div>
    );
  }

  const similarProducts = shuffleArray(productsResponse.products).slice(0, 18);
  const totalPages = Math.ceil(similarProducts.length / PRODUCTS_PER_PAGE);
  const currentPage = Math.min(Math.max(initialPage, 1), totalPages);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const productsToShow = similarProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  if (productsToShow.length === 0 && currentPage > 1) {
    return null;
  }
  if (productsToShow.length === 0) {
     return (
        <div className="my-12 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('noSimilarProductsFound')}</p>
        </div>
    );
  }

  // --- OPTIMIZATION: Load all translations for the locale at once ---
  let productTranslations: Record<string, string> = {};
  try {
    const file = path.join(process.cwd(), 'data/batched-product-translations', `${locale}.json`);
    productTranslations = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    // Fallback to empty if the file doesn't exist
    productTranslations = {};
  }

  return (
    <section aria-labelledby="similar-products-heading" className="py-12 bg-amber-50/30 dark:bg-slate-800/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-4">
          <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 px-6 py-3 rounded-2xl shadow-md border border-amber-500 dark:border-amber-700 relative">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-white dark:text-amber-100 m-0 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-100 dark:text-amber-200" />
              {tCommon('similarProductsTitle')}
              <Sparkles className="w-5 h-5 text-amber-100 dark:text-amber-200" />
            </h2>
          </div>
        </div>

        {productsToShow.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {productsToShow.map((product: CanonicalProduct, index: number) => {
                const safeProduct: CanonicalProduct = {
                  ...product,
                  imagePaths: Array.isArray(product.imagePaths) ? product.imagePaths : [],
                };
                const productSlug = productSlugMap?.[safeProduct.productId];
                return (
                  <div key={safeProduct.productId}
                       className="transform transition-all duration-500"
                       style={{ 
                         animationDelay: `${index * 100}ms`,
                         opacity: 0,
                         animation: 'fadeInUp 0.5s ease forwards'
                       }}>
                    <ProductCard
                      product={safeProduct}
                      locale={locale}
                      geoCountryCode={geoCountryCode}
                      formattingLocale={formattingLocale}
                      productTranslations={productTranslations}
                      productSlug={productSlug}
                    />
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-10">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={PRODUCTS_PER_PAGE}
                  totalItems={similarProducts.length}
                  queryParamName="similarPage"
                />
              </div>
            )}
          </>
        ) : (
          <div className="my-12 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('noSimilarProductsFound')}</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Helper to create shuffleArray utility if it doesn't exist
// This is a placeholder and should be created in @/lib/utils/array.ts
/*
// In @/lib/utils/array.ts
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]; // Create a copy to avoid mutating the original array
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements
  }
  return newArray;
}
*/

// Helper to create PaginationControls component if it doesn't exist
// This is a placeholder and should be created in @/components/common/pagination-controls.tsx
/* REMOVING THIS BLOCK
// In @/components/common/pagination-controls.tsx
'use client'; // This component will likely need client-side interactivity for navigation

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server'; // Can't use in client component
// import { useTranslations } from 'next-intl'; // Use this for client components

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // Base URL for the page, e.g., /products or /category/some-category
  pageParamName?: string; // Optional: custom query parameter name for page, defaults to 'page'
}

export function PaginationControls({ 
  currentPage, 
  totalPages, 
  baseUrl,
  pageParamName = 'page' 
}: PaginationControlsProps) {
  // const t = useTranslations('Pagination'); // For client-side translations
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set(pageParamName, String(pageNumber));
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return null;
  }

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Determine page numbers to display
  let pages: (number | string)[] = [];
  const pageBuffer = 2; // Number of pages to show around current page
  const ellipsis = '...';

  if (totalPages <= 5) { // Show all pages if 5 or less
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    pages.push(1); // Always show first page
    if (currentPage > pageBuffer + 1) {
      pages.push(ellipsis);
    }

    let startPage = Math.max(2, currentPage - pageBuffer +1);
    let endPage = Math.min(totalPages - 1, currentPage + pageBuffer -1);
    
    // Adjust if current page is near the beginning
    if (currentPage <= pageBuffer) {
        startPage = 2;
        endPage = Math.min(totalPages -1, pageBuffer * 2 );
    }
    // Adjust if current page is near the end
    else if (currentPage > totalPages - pageBuffer) {
        startPage = Math.max(2, totalPages - pageBuffer * 2 +1) ;
        endPage = totalPages - 1;
    }


    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - pageBuffer) {
      pages.push(ellipsis);
    }
    pages.push(totalPages); // Always show last page
  }
  
 // Remove duplicate ellipsis
  pages = pages.filter((page, index) => page !== ellipsis || pages[index-1] !== ellipsis);


  return (
    <nav aria-label="Pagination" className="flex items-center justify-center space-x-2 my-8">
      <Link 
        href={hasPreviousPage ? createPageURL(currentPage - 1) : '#'}
        className={`inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors ${!hasPreviousPage ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-disabled={!hasPreviousPage}
        tabIndex={!hasPreviousPage ? -1 : undefined}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
        {/* {t('previous')} Can use if t is set up for client component */ /*}
      </Link>

      {pages.map((page, index) => (
        <Link
          key={index}
          href={typeof page === 'number' ? createPageURL(page) : '#'}
          className={`inline-flex items-center justify-center rounded-md border text-sm font-medium min-w-[36px] h-9 px-3 py-1.5 transition-colors ${
            page === currentPage 
              ? 'border-amber-500 bg-amber-500 text-white dark:text-black ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-800' 
              : typeof page === 'number' 
              ? 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600' 
              : 'text-gray-500 dark:text-slate-400 px-1' // Ellipsis style
          } ${typeof page !== 'number' ? 'cursor-default' : ''}`}
          aria-current={page === currentPage ? 'page' : undefined}
          aria-disabled={typeof page !== 'number'}
          tabIndex={typeof page !== 'number' ? -1 : undefined}
        >
          {page}
        </Link>
      ))}

      <Link 
        href={hasNextPage ? createPageURL(currentPage + 1) : '#'}
        className={`inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors ${!hasNextPage ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-disabled={!hasNextPage}
        tabIndex={!hasNextPage ? -1 : undefined}
      >
        Next
        {/* {t('next')} */ /*}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Link>
    </nav>
  );
}
*/ 