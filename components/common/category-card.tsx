'use client';
import Link from 'next/link';
// Remove Image import as it's no longer used directly in this card,
// but keep it if subcategories might render images or if it's used elsewhere in this file's context.
// For now, assuming it's not needed here.
// import Image from 'next/image';
import type { ProcessedCategoryData } from '@/lib/utils/categories';
import { useTranslations } from 'next-intl';
import { ChevronRightIcon } from 'lucide-react'; // For subcategory list styling
// import { useRouter } from 'next/navigation';


interface CategoryCardProps {
  category: ProcessedCategoryData & { children?: ProcessedCategoryData[] };
  _locale: string;
  isNavigational?: boolean;
  categorySlugMap?: { [id: number]: { locales: { [locale: string]: string } } };
  categoryTranslations?: Record<number, Record<string, string>>; // Add translations map
}

export function CategoryCard({ category, _locale, isNavigational, categorySlugMap, categoryTranslations }: CategoryCardProps) {
  const t = useTranslations('Common');
  // const router = useRouter();

  if (!category.fullLocalePath) {
    // console.warn(`CategoryCard: category "${category.categoryNameCanonical}" (ID: ${category.categoryId}) is missing fullLocalePath for locale ${locale}.`);
    return null; 
  }

 
  const displayTitle = categoryTranslations?.[category.categoryId]?.[_locale] || category.categoryNameCanonical;
  const buttonText = t('viewCategoryButtonText', { categoryName: displayTitle });

  const hasSubcategories = category.children && category.children.length > 0;

  // Use the slug map for the category link
  const categorySlug = categorySlugMap?.[category.categoryId]?.locales?.[_locale];
  const categoryHref = categorySlug ? `/${_locale}/categories/${categorySlug}` : '#';

  return (
    <div className="group bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 rounded-lg shadow-md hover:shadow-xl hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-300 ease-in-out overflow-hidden flex flex-col h-full">
      {/* Image container removed */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <Link href={categoryHref} className="block mb-2">
          <h5 className="text-base sm:text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-100 capitalize group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {displayTitle}
          </h5>
        </Link>

        {!isNavigational && hasSubcategories && (
          <div className="mb-3 space-y-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            {category.children?.slice(0, 3).map((subCategory) => {
              const subCategorySlug = categorySlugMap?.[subCategory.categoryId]?.locales?.[_locale];
              // Always use the subcategory's slug as a full path
              const subCategoryHref = subCategorySlug ? `/${_locale}/categories/${subCategorySlug}` : '#';
              const subDisplayTitle = categoryTranslations?.[subCategory.categoryId]?.[_locale] || subCategory.categoryNameCanonical;
              return (
                <Link
                  key={subCategory.categoryId}
                  href={subCategoryHref}
                  className="flex items-center group/sub hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <ChevronRightIcon className="w-3 h-3 mr-1.5 text-amber-500 group-hover/sub:text-amber-600 dark:group-hover/sub:text-amber-400 transition-colors" />
                  <span className="truncate">
                    {subDisplayTitle}
                  </span>
                </Link>
              );
            })}
            {category.children && category.children.length > 3 && (
               <Link
                href={categoryHref}
                className="flex items-center group/sub hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-xs"
              >
                <ChevronRightIcon className="w-3 h-3 mr-1.5 text-amber-500 group-hover/sub:text-amber-600 dark:group-hover/sub:text-amber-400 transition-colors" />
                <span>{t('viewAllSubcategories', { count: category.children.length - 3 })}</span>
              </Link>
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          <Link
            href={categoryHref}
            className="inline-block bg-amber-500 group-hover:bg-amber-600 text-white text-xs sm:text-sm font-medium py-1.5 px-3 sm:py-2 sm:px-4 rounded-md transition-colors duration-150 w-full text-center"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
} 