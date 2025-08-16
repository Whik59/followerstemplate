'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Globe } from 'lucide-react'; // Using an icon for the switcher
import { useState, useEffect, useRef } from 'react';
import { locales as supportedLocales, defaultLocale } from '@/config/i18n.config'; // Import from central config
import { languageNames } from '@/lib/data/language-names';
import useSWR from 'swr';

// No longer taking alternates as a prop for this strategy
// interface LanguageSwitcherProps {
//   alternates?: Record<string, string>;
// }

export function LanguageSwitcher(/* { alternates: propAlternates }: LanguageSwitcherProps */) {
  console.log('[LangSwitcher] Component mounted');
  const pathname = usePathname();
  const params = useParams(); // params will include { locale: string, categorySlug?: string[] }
  const currentLocale = params.locale as string;

  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  let categorySlugArray = params.categorySlug;
  if (typeof categorySlugArray === 'string') {
    categorySlugArray = [categorySlugArray];
  }
  if (!Array.isArray(categorySlugArray)) {
    categorySlugArray = [];
  }
  // Correctly extract product slug for product pages
  const slugParam = params.productSlug; // FIX: use productSlug param
  let productSlug: string | undefined = undefined;
  if (typeof slugParam === 'string') {
    productSlug = slugParam;
  } else if (Array.isArray(slugParam) && slugParam.length > 0) {
    productSlug = slugParam[slugParam.length -1];
  }

  console.log('[LangSwitcher] Params:', { currentLocale, productSlug, categorySlugArray, pathname, params });

  const fetcher = (url: string) => fetch(url).then(res => res.json());

  let apiUrl = '';
  let queryParams = '';
  const isProductPage = pathname.includes('/products/') && productSlug && currentLocale;
  const isCategoryPage = categorySlugArray && categorySlugArray.length > 0 && currentLocale;
  if (isProductPage) {
    apiUrl = '/api/product-alternates';
    queryParams = `currentLocale=${currentLocale}&productSlug=${encodeURIComponent(productSlug!)}`;
  } else if (isCategoryPage) {
    apiUrl = '/api/category-alternates';
    const categorySlugString = categorySlugArray.join(',');
    queryParams = `currentLocale=${currentLocale}&categorySlug=${encodeURIComponent(categorySlugString)}`;
  }
  const swrKey = apiUrl ? `${apiUrl}?${queryParams}` : null;
  const { data: pageAlternates, isLoading: isLoadingAlternates } = useSWR(swrKey, fetcher);

  // Detect root categories or products page
  const isRootCategoryPage = pathname.endsWith('/categories') && categorySlugArray.length === 0;
  const isRootProductsPage = pathname.endsWith('/products') && !productSlug;

  const getLocalizedPath = (targetLocale: string) => {
    // Handle root categories/products page: link directly to /{locale}/categories or /{locale}/products
    if (isRootCategoryPage) {
      return `/${targetLocale}/categories`;
    }
    if (isRootProductsPage) {
      return `/${targetLocale}/products`;
    }
    console.log(`[LangSwitcher] getLocalizedPath called for targetLocale: "${targetLocale}". Current pageAlternates:`, JSON.stringify(pageAlternates, null, 2));
    if (pageAlternates && pageAlternates[targetLocale]) {
      return pageAlternates[targetLocale];
    }

    // Fallback logic: if no alternates, construct path based on current pathname and targetLocale
    if (!pathname) return '/';
    let newPath = pathname;
    const segments = pathname.split('/');

    // Check if the current path starts with a known locale
    const pathHasLocale = segments.length > 1 && supportedLocales.includes(segments[1]);

    if (pathHasLocale) {
      // Current path is like /<locale>/foo, always update to /<targetLocale>/foo
      segments[1] = targetLocale;
      newPath = segments.join('/');
    } else {
      // Current path is like /foo (implicitly default locale), prepend targetLocale: /foo -> /<targetLocale>/foo
      // This handles the case where pathname might be just "/"
      newPath = `/${targetLocale}${pathname === '/' ? '' : pathname}`;
    }
    
    // Normalize potential double slashes like //foo or /foo//bar if segments were empty
    // Also ensure that if the original path was just "/" and we prepended a locale,
    // it doesn't become "/en/" but rather "/en". 
    // However, if the original path was "/somepage", it becomes "/en/somepage".
    newPath = newPath.replace(/\/\/+/g, '/');
    if (newPath.endsWith('/') && newPath.length > 1 && pathname === '/') {
      // If original was root, and new is /locale/, trim trailing slash only if original was truly root
      // This prevents /en/products/ becoming /en/products
      // More precise: if original was / and newPath is /<locale>/, then newPath should be /<locale>
      // Let Next.js handle if /<locale> should redirect to /<locale>/
    }

    return newPath;
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [switcherRef]);

  return (
    <div className="relative" ref={switcherRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-md hover:bg-amber-100 text-amber-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-label="Change language"
        aria-haspopup="true"
        aria-expanded={isOpen}
        disabled={isLoadingAlternates} // Disable while loading new paths
      >
        <Globe className="h-5 w-5" />
        <span className="ml-1 text-xs font-medium uppercase">{currentLocale}</span>
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[22rem] min-w-[16rem] max-w-full bg-white shadow-lg rounded-md border border-gray-200 z-50 py-1 grid grid-cols-2 sm:grid-cols-3 gap-1 px-2 max-h-[60vh] overflow-y-auto text-base"
        >
          {isLoadingAlternates ? (
            <div className="col-span-3 p-4 text-center text-xs text-gray-500">Loading languages...</div>
          ) : (
            supportedLocales.map((loc) => (
              <Link
                key={loc}
                href={getLocalizedPath(loc)}
                locale={loc}
                onClick={() => setIsOpen(false)}
                className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  !pageAlternates || !pageAlternates[loc]
                    ? 'opacity-80'
                    : ''
                } ${
                  currentLocale === loc
                    ? 'bg-amber-500 text-white font-semibold'
                    : 'text-gray-700 hover:bg-amber-100 hover:text-amber-600'
                }`}
                aria-disabled={currentLocale === loc}
              >
                {languageNames[loc] || loc.toUpperCase()}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}