export const revalidate = false;
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { Suspense } from 'react';
import {
  getHierarchicalCategoryData,
  findCategoryByTranslatedPath,
  ProcessedCategoryData,
  getCategoryMdx,
} from '@/lib/utils/categories';
import { ProductCard } from '@/components/common/product-card';
import { CategoryCard } from '@/components/common/category-card';
import { ReviewSummary } from '@/types/review';
import { VideosSection } from '@/components/common/videos-section';
import { ReviewsSummary } from '@/components/common/reviews-summary';
import { PaginationControls } from '@/components/common/pagination-controls';
import { headers } from 'next/headers';
import { getUserGeoInfo } from '@/lib/utils/geolocation';
import { reviewsMetadata } from '@/lib/data/reviews-metadata';
import { AboutUsSection } from '@/components/common/about-us-section';
import { WhyChooseUsSection } from '@/components/common/why-choose-us-section';
import { OurValuesSection } from '@/components/common/our-values-section';
import dynamic from 'next/dynamic';
import { getAllProducts } from '@/lib/utils/products';
import type { Product } from '@/types/product';
import { fetchAllProductSlugMaps, fetchAllCategorySlugMaps, fetchProductSlugMapForLocale } from '@/lib/api/slug-map';
import { mdxComponents } from '@/lib/mdx-components';
import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';

import { locales } from "@/config/i18n.config";

// Locally define an interface that extends ProcessedCategoryData to include parentId
// This helps resolve the TypeScript error locally. 
// The canonical ProcessedCategoryData in your utils/types should also be updated.
interface ProcessedCategoryDataWithParentId extends ProcessedCategoryData {
  parentId?: number | null;
}

// Define ProductVariationOption and ProductVariation if not imported from a shared types file
interface ProductVariationOption {
  name: string;
  value: string;
  price?: number | null;
  stockCount?: number;
  imagePath?: string;
}

interface ProductVariation {
  type: string;
  options: ProductVariationOption[];
}

const siteNameFromEnv = process.env.NEXT_PUBLIC_SITE_NAME || "Your Awesome Shop";
const canonicalDomain = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || "YOUR_FALLBACK_DOMAIN.COM";

const defaultLocale = 'en';

interface CategoryPageParams {
  locale: string;
  categorySlug: string[]; // e.g., ["translated-parent-slug", "translated-child-slug"]
}

// contentMdx will now be the raw string for the source prop
interface AccordionSectionData {
  triggerTitle: string;
  contentMdx: string; 
}

// parseMdxForCategoryPage now just returns raw strings
function parseMdxForCategoryPage(mdxText: string | undefined | null): { introContent: string; accordionSections: AccordionSectionData[] } {
  if (!mdxText) return { introContent: '', accordionSections: [] };
  const sectionsData: AccordionSectionData[] = [];
  const h2SplitRegex = /\n## /;
  const parts = mdxText.split(h2SplitRegex);
  let introContent = '';
  if (parts.length > 0) {
    introContent = parts[0].trim();
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const firstNewlineIndex = part.indexOf('\n');
      let title = '';
      let contentBody = '';
      if (firstNewlineIndex !== -1) {
        title = part.substring(0, firstNewlineIndex).trim().replace(/#+$/, '').trim();
        contentBody = part.substring(firstNewlineIndex + 1).trim();
      } else {
        title = part.trim().replace(/#+$/, '').trim();
        contentBody = '';
      }
      if (title) {
         sectionsData.push({ triggerTitle: title, contentMdx: contentBody });
      }
    }
  }
  return { introContent, accordionSections: sectionsData };
}

/**
 * Gathers all category IDs from a category and its descendants.
 */
function getAllDescendantCategoryIds(category: ProcessedCategoryData): number[] {
  let ids = [category.categoryId];
  if (category.children && category.children.length > 0) {
    for (const child of category.children) {
      ids = ids.concat(getAllDescendantCategoryIds(child));
    }
  }
  return ids;
}

export async function generateMetadata({ params }: { params: CategoryPageParams }): Promise<Metadata> {
  unstable_setRequestLocale(params.locale);
  const currentCategory = await findCategoryByTranslatedPath(params.locale, params.categorySlug);

  if (!currentCategory) {
    return {
      title: `${siteNameFromEnv} | Category Not Found`,
      description: "The category you are looking for could not be found.",
    };
  }

  const pageTitle = currentCategory.localeTitle || currentCategory.categoryNameCanonical;
  const pageDescription = currentCategory.mdxDescription || ` ${pageTitle}  ${siteNameFromEnv}.`;

  // Hreflang alternates
  const alternates: Record<string, string> = {};

  // Define helper function findInTreeById here, BEFORE the loop
  function findInTreeById(nodes: ProcessedCategoryData[], id: number): ProcessedCategoryData | null {
    for(const node of nodes) {
        if(node.categoryId === id) return node;
        if(node.children && node.children.length > 0) { // Ensure children exist before checking length
            const found = findInTreeById(node.children, id);
            if(found) return found;
        }
    }
    return null;
  }

  for (const altLocale of locales) {
    const altCategoryTree = await getHierarchicalCategoryData(altLocale);
    const foundAltCategory = findInTreeById(altCategoryTree, currentCategory.categoryId);
    
    if (foundAltCategory && foundAltCategory.fullLocalePath) {
      alternates[altLocale] = `${canonicalDomain}${foundAltCategory.fullLocalePath}`;
    }
  }
  if (alternates[defaultLocale]) {
    alternates['x-default'] = alternates[defaultLocale];
  } else if (alternates[params.locale]){
    alternates['x-default'] = alternates[params.locale]; // Fallback to current if default not found
  }

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: currentCategory.mdxKeywords,
    alternates: {
      canonical: `${canonicalDomain}${currentCategory.fullLocalePath}`,
      languages: alternates,
    },
  };
}

// It's better to have a distinct props interface for the page component
// if we're adding searchParams.
interface CategoryPageProps {
  params: CategoryPageParams;
  searchParams?: {
    page?: string;
  };
}

interface CategoryPageData {
    currentCategory: ProcessedCategoryData;
    paginatedProducts: Product[];
    totalPages: number;
    currentPage: number;
    totalProductsInCategory: number;
    itemsPerPage: number;
    locale: string;
    breadcrumbs: Array<{ name: string; path?: string }>;
    childCategories: ProcessedCategoryData[];
    navigationalCategories: ProcessedCategoryData[];
    navigationalCategoriesTitle: string;
    productSlugMap: Record<number, string>;
    categorySlugMap: { [id: number]: { locales: { [locale: string]: string } } };
    productTranslations: Record<string, string>;
    categoryTranslations: Record<number, Record<string, string>>;
    mdxContent: string;
}

async function getPageData(
  locale: string, 
  categorySlug: string[],
  page: number = 1, // Default to page 1
  limit: number = 24 // Default limit
): Promise<CategoryPageData | null> {
    const t = await getTranslations({ locale, namespace: 'Common' });
    console.log('[CategoryPage Debug] Incoming slug:', categorySlug);
    const currentCategoryTyped = await findCategoryByTranslatedPath(locale, categorySlug) as ProcessedCategoryDataWithParentId | null;
    if (currentCategoryTyped) {
      const { categoryId, categoryNameCanonical, parentCategoryId, localeTitle, localeShortTitle, localeSlugSegment } = currentCategoryTyped;
      console.log('[CategoryPage Debug] Matched category:', { categoryId, categoryNameCanonical, parentCategoryId, localeTitle, localeShortTitle, localeSlugSegment });
    } else {
      console.log('[CategoryPage Debug] Matched category: null');
    }

    if (!currentCategoryTyped) return null;

    const currentCategory = currentCategoryTyped;

    // Fetch the MDX content for only the current category
    const mdxContent = await getCategoryMdx(locale, currentCategory.categoryId);

    const allDescendantIds = getAllDescendantCategoryIds(currentCategory);
    console.log('[CategoryPage Debug] categoryAndDescendantIds:', allDescendantIds);
    const productResponse = await getAllProducts({
      categoryIds: allDescendantIds,
      page,
      limit,
    });
    const paginatedProducts = productResponse.products;
    console.log('[CategoryPage Debug] paginatedProducts:', paginatedProducts.map(p => ({ id: p.productId, name: p.productNameCanonical, categoryIds: p.categoryIds })));
    const totalProductsInCategory = productResponse.totalProducts;
    const totalPages = productResponse.totalPages;
    const currentPage = productResponse.currentPage;

    const breadcrumbs: Array<{ name: string; path?: string }> = [{ name: t('homeBreadcrumb'), path: `/${locale}` }];
    const categoryTreeForLocale = await getHierarchicalCategoryData(locale);
    
    // --- Load translations for all categories in the tree (for breadcrumbs) ---
    let categoryTranslations: Record<number, Record<string, string>> = {};
    try {
      const file = await fs.readFile(path.join(process.cwd(), 'data/category-translations.json'), 'utf8');
      const arr = JSON.parse(file);
      categoryTranslations = arr.reduce((acc: Record<number, Record<string, string>>, curr: { categoryId: number, translations: Record<string, string> }) => {
        acc[curr.categoryId] = curr.translations;
        return acc;
      }, {});
    } catch {
      categoryTranslations = {};
    }

    function findPathToCategory(nodes: ProcessedCategoryData[], targetId: number, currentPath: Array<{ name: string; path?: string }>): boolean {
        for (const node of nodes) {
            // Use translation for breadcrumb name, fallback to localeShortTitle/localeTitle
            const translatedName = categoryTranslations?.[node.categoryId]?.[locale] || node.localeShortTitle || node.localeTitle;
            const newPath = [...currentPath, { name: translatedName, path: node.fullLocalePath }];
            if (node.categoryId === targetId) {
                breadcrumbs.push(...newPath.slice(1)); 
                return true;
            }
            if (node.children && node.children.length > 0) {
                if (findPathToCategory(node.children, targetId, newPath)) {
                    return true;
                }
            }
        }
        return false;
    }
    // For the current page breadcrumb, use its own translation
    const currentCategoryBreadcrumbName = categoryTranslations?.[currentCategoryTyped.categoryId]?.[locale] || currentCategoryTyped.localeShortTitle || currentCategoryTyped.localeTitle;
    const breadcrumbPathFound = findPathToCategory(categoryTreeForLocale, currentCategoryTyped.categoryId, breadcrumbs.slice(0,1)); 
    if(breadcrumbs.length > 1) {
        breadcrumbs[breadcrumbs.length-1].name = currentCategoryBreadcrumbName;
        breadcrumbs[breadcrumbs.length-1].path = undefined;
    }

    const childCategories = currentCategoryTyped.children || [];
    let navigationalCategories: ProcessedCategoryData[] = [];
    let navigationalCategoriesTitle = '';

    const parentId = currentCategoryTyped.parentId;
    if (parentId) { // Current category is a subcategory
        const parentCategory = findCategoryInTreeById(categoryTreeForLocale, parentId) as ProcessedCategoryDataWithParentId | null;
        if (parentCategory && parentCategory.children) {
            navigationalCategories = parentCategory.children.filter(child => child.categoryId !== currentCategoryTyped.categoryId);
            navigationalCategoriesTitle = t('siblingCategoriesTitle');
        }
    } else { // Current category is a top-level category
        navigationalCategories = categoryTreeForLocale.filter(cat => cat.categoryId !== currentCategoryTyped.categoryId);
        navigationalCategoriesTitle = t('otherTopLevelCategoriesTitle');
    }

    const productSlugMap = await fetchProductSlugMapForLocale(locale);
    const categorySlugMap = await fetchAllCategorySlugMaps();

    // Load translations for all products on the current page (batched by locale)
    let productTranslations: Record<string, string> = {};
    try {
      const file = await fs.readFile(path.join(process.cwd(), 'data/batched-product-translations', `${locale}.json`), 'utf8');
      productTranslations = JSON.parse(file);
    } catch {
      productTranslations = {};
    }

    return { 
        currentCategory,
        paginatedProducts,
        totalPages,
        currentPage,
        totalProductsInCategory,
        itemsPerPage: limit,
        locale, 
        breadcrumbs, 
        childCategories, 
        navigationalCategories, 
        navigationalCategoriesTitle,
        productSlugMap,
        categorySlugMap,
        productTranslations,
        categoryTranslations,
        mdxContent,
    };
}

// Helper function to find a category by ID in the tree (could be moved to utils if used elsewhere)
function findCategoryInTreeById(nodes: ProcessedCategoryData[], id: number): ProcessedCategoryData | null {
  for (const node of nodes) {
    if (node.categoryId === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findCategoryInTreeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to get rating description (copied from product page)
// Consider moving this to a shared utility file if used in multiple places
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

const ReviewsSection = dynamic(() => import('@/components/common/reviews-section').then(mod => mod.ReviewsSection), { ssr: false });

// Update the props for CategoryPage
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  unstable_setRequestLocale(params.locale);
  const currentPageNum = searchParams?.page ? parseInt(searchParams.page, 10) : 1;

  // Fetch translations

  const pageData = await getPageData(params.locale, params.categorySlug, currentPageNum);
  const headersList = headers();
  const { countryCode: geoCountryCode, locale: formattingLocale } = await getUserGeoInfo(headersList);

  if (!pageData || !pageData.currentCategory) {
    notFound();
  }

  const { 
    currentCategory,
    paginatedProducts,
    totalPages,
    currentPage,
    totalProductsInCategory,
    itemsPerPage,
    locale,
    breadcrumbs,
    childCategories,
    navigationalCategories,
    navigationalCategoriesTitle,
    productSlugMap,
    categorySlugMap,
    productTranslations,
    categoryTranslations: categoryTranslationsForBreadcrumbs,
    mdxContent,
  } = pageData;

  // Use gray-matter to parse the MDX and separate frontmatter from content
  const { content: mdxBody, data: mdxFrontmatter } = matter(mdxContent || '');
  const { introContent, accordionSections } = parseMdxForCategoryPage(mdxBody);
  const t = await getTranslations({ locale, namespace: 'Common' });
  
  // Calculate review statistics for the entire site (assuming reviewsMetadata is site-wide)
  let siteAverageRating = 0;
  let siteTotalReviewsCount = 0;
  let siteRatingDescription = '';

  if (reviewsMetadata && reviewsMetadata.length > 0) {
    siteTotalReviewsCount = reviewsMetadata.length;
    const siteTotalRatingSum = reviewsMetadata.reduce((sum, review) => sum + review.rating, 0);
    siteAverageRating = siteTotalReviewsCount > 0 ? siteTotalRatingSum / siteTotalReviewsCount : 0;
    siteRatingDescription = await getRatingDescription(siteAverageRating, locale);
  }

  // Get the translated name for the current category
  const translatedCategoryName = categoryTranslationsForBreadcrumbs?.[currentCategory.categoryId]?.[locale] || currentCategory.localeTitle || currentCategory.localeShortTitle || currentCategory.categoryNameCanonical;

  return (
    <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-background dark:from-amber-900 dark:via-amber-800/50 dark:to-background min-h-screen">
      {/* Main content area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 md:mb-8">
          <ol className="flex space-x-1.5">
            {breadcrumbs.length > 2 && breadcrumbs.slice(1, -1).map((crumb, index) => (
              <li key={index} className="flex items-center">
                <Link
                  href={crumb.path || '#'}
                  className="bg-white border border-amber-200 text-amber-700 font-medium tracking-wide uppercase rounded-full px-2.5 py-0.5 shadow transition-all text-[10px] sm:text-xs md:text-sm hover:bg-amber-50 hover:text-amber-900 focus:ring-1 focus:ring-amber-200 focus:outline-none"
                >
                    {crumb.name}
                  </Link>
                {index < breadcrumbs.slice(1, -1).length - 1 && (
                  <svg className="ml-1.5 h-5 w-5 flex-shrink-0 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Category Header */}
        <div className="mb-8 md:mb-12 text-center">
          <div className="flex justify-center">
            <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 px-6 py-3 rounded-2xl shadow-md border border-amber-500 dark:border-amber-700">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-white dark:text-amber-100 m-0">
            {translatedCategoryName}
          </h1>
            </div>
          </div>
          {currentCategory.mdxDescription && (
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {currentCategory.mdxDescription}
            </p>
          )}
        </div>

        {/* MDX Intro Content */}
        {introContent && (
          <div className="prose prose-lg sm:prose-xl dark:prose-invert max-w-none mb-8 md:mb-12 p-6 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-md">
            <MDXRemote source={introContent} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
          </div>
        )}
        
        {/* Child Categories (if any) */}
        {childCategories && childCategories.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {childCategories.map(cat => (
                <CategoryCard 
                  key={cat.categoryId} 
                  category={cat}
                  _locale={locale}
                  categorySlugMap={categorySlugMap}
                  categoryTranslations={categoryTranslationsForBreadcrumbs}
                />
              ))}
            </div>
          </section>
        )}

        {/* Products in Category */}
        {paginatedProducts && paginatedProducts.length > 0 ? (
          <section id="products-section" className="mb-12 md:mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {paginatedProducts.map((product: Product, index: number) => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  locale={locale}
                  geoCountryCode={geoCountryCode}
                  formattingLocale={formattingLocale}
                  productSlug={productSlugMap[product.productId] || product.productNameCanonical}
                  productTranslations={productTranslations}
                  isPriority={index < 5}
                />
              ))}
            </div>
            <PaginationControls 
              currentPage={currentPage} 
              totalPages={totalPages} 
              itemsPerPage={itemsPerPage} 
              totalItems={totalProductsInCategory} 
              queryParamName="page" 
            />
          </section>
        ) : childCategories && childCategories.length > 0 ? (
          <section className="mb-12 md:mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {childCategories.map(cat => (
                <CategoryCard 
                  key={cat.categoryId} 
                  category={cat}
                  _locale={locale}
                  categorySlugMap={categorySlugMap}
                  categoryTranslations={categoryTranslationsForBreadcrumbs}
                />
              ))}
            </div>
          </section>
        ) : (
          <p className="text-center text-lg text-gray-500 dark:text-gray-400 py-10">
            {t('noProductsInCategory', { categoryName: currentCategory.localeShortTitle || currentCategory.localeTitle })}
          </p>
        )}

        {/* MDX Sections - Direct Display */}
        {accordionSections && accordionSections.length > 0 && (
          <div className="w-full mb-12 md:mb-16 p-4 sm:p-6 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-md">
            {accordionSections.map((section, index) => (
              <section key={index} className="mb-8 last:mb-0">
                <h2 className="text-2xl sm:text-3xl font-semibold text-amber-700 dark:text-amber-400 mb-4 border-b border-amber-200 dark:border-amber-700 pb-2">
                  {section.triggerTitle}
                </h2>
                <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none pt-2">
                  <MDXRemote source={section.contentMdx} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Site-wide Reviews Summary */}
        {siteTotalReviewsCount > 0 && (
          <div className="my-12 md:my-16">
            <Suspense fallback={<div>Loading reviews summary...</div>}>
              <ReviewsSummary 
                locale={locale} 
                averageRating={siteAverageRating} 
                totalReviewsCount={siteTotalReviewsCount} 
                ratingDescription={siteRatingDescription}
              />
            </Suspense>
          </div>
        )}

        {/* Full Reviews Section for the site */}
        <div className="my-12 md:my-16">
          <Suspense fallback={<div className="min-h-[300px] flex items-center justify-center">Loading reviews...</div>}>
            <ReviewsSection locale={params.locale} />
          </Suspense>
        </div>
        
        {/* Videos Section */}
        <div className="my-12 md:my-16 md:max-w-2xl lg:max-w-3xl mx-auto">
          <Suspense fallback={<div>Loading videos...</div>}>
            <VideosSection locale={locale} />
          </Suspense>
        </div>

      </div>
     
    </div>
  );
}
