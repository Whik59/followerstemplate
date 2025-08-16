'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import * as Popover from '@radix-ui/react-popover';
import * as Accordion from '@radix-ui/react-accordion';
import useSWR from 'swr';

import {
  // NavigationMenu,
  // NavigationMenuContent,
  // NavigationMenuItem,
  NavigationMenuLink,
  // NavigationMenuList,
  // NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MenuIcon } from 'lucide-react';
import { ProcessedCategoryData } from '@/lib/utils/categories';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import { CartIcon } from '@/components/common/cart-icon';
import { SalesNotificationBanner } from '@/components/common/sales-notification-banner';
import type { Product } from '@/types/product';

// const _navigationMenuTriggerStyle =
//   'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2';

// const NavLink: React.FC<NavLinkProps> = ({ href, children, className, activeClassName = 'font-semibold text-sky-600 dark:text-sky-400' }) => {

interface SiteHeaderProps {
  menuCategories: ProcessedCategoryData[];
  categorySlugMap?: { [id: number]: { locales: { [locale: string]: string } } };
  categoryTranslations?: Record<number, Record<string, string>>;
}

// Extend Product to include slug for dropdown preview
interface ProductWithSlug extends Product {
  slug: string;
}

const CATEGORIES_ORDER = [
  { id: 23, key: 'instagram' },
  { id: 9, key: 'tiktok' },
  { id: 24, key: 'facebook' },
  { id: 2, key: 'youtube' },
  { id: 3, key: 'x-twitter' },
  { id: 11, key: 'spotify' },
  // ... existing code ...
  { id: 4, key: 'threads' },
  { id: 19, key: 'linkedin' },
  { id: 10, key: 'telegram' },
  { id: 5, key: 'twitch' },
  { id: 14, key: 'reddit' },
  { id: 17, key: 'onlyfans' },
  { id: 1, key: 'whatsapp' },
  { id: 6, key: 'trustpilot' },
  { id: 7, key: 'google' },
  { id: 8, key: 'tripadvisor' },
  { id: 12, key: 'soundcloud' },
  { id: 13, key: 'snapchat' },
  { id: 15, key: 'quora' },
  { id: 16, key: 'pinterest' },
  { id: 18, key: 'medium' },
  { id: 20, key: 'kick' },
  { id: 25, key: 'discord' },

// ... existing code ...
];

export function SiteHeader({ menuCategories, categorySlugMap, categoryTranslations }: SiteHeaderProps) {
  const locale = useLocale();
  const baseLocale = locale.split('-')[0];
  const t = useTranslations('smma');
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showMore, setShowMore] = React.useState(false);
  
  // Reorder menuCategories to match CATEGORIES_ORDER for mobile as well
  const orderedMenuCategories = React.useMemo(() => {
    const map = new Map(menuCategories.map(cat => [cat.categoryId, cat]));
    const ordered = CATEGORIES_ORDER.map(({ id }) => map.get(id)).filter((c): c is ProcessedCategoryData => !!c);
    console.log('menuCategories:', menuCategories.map(c => ({ id: c.categoryId, name: c.categoryNameCanonical })));
    console.log('orderedMenuCategories:', ordered.map(c => ({ id: c.categoryId, name: c.categoryNameCanonical })));
    return ordered;
  }, [menuCategories]);

  const renderMobileCategoryLinks = (categoriesToRender: ProcessedCategoryData[]) => {
    return (
      <ul className="w-full">
        {categoriesToRender.map((category) => {
          const displayName = categoryTranslations?.[category.categoryId]?.[baseLocale] || category.categoryNameCanonical;
          const categoryHref = category.fullLocalePath || '#';
          if (category.children && category.children.length > 0) {
            return (
              <li key={category.categoryId} className="border-b border-amber-100 dark:border-amber-900/30">
                <Accordion.Root type="single" collapsible>
                  <Accordion.Item value={String(category.categoryId)}>
                    <Accordion.Trigger className="flex w-full items-center justify-between py-2 px-3 text-base font-semibold tracking-wide text-black dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-md capitalize focus:outline-none">
                      <span className="flex items-center gap-2">
                        <Image src={`/svg/${category.categoryNameCanonical.toLowerCase()}.svg`} alt={displayName} width={24} height={24} className="w-6 h-6 mr-1" />
                        {displayName}
                      </span>
                      <svg className="ml-2 w-4 h-4 transition-transform data-[state=open]:rotate-180" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </Accordion.Trigger>
                    <Accordion.Content className="pl-4 pb-2">
                      <ul className="flex flex-col gap-1">
                        {category.children.map((subCategory) => {
                          const subDisplayName = categoryTranslations?.[subCategory.categoryId]?.[baseLocale] || subCategory.categoryNameCanonical;
                          const subCategoryHref = subCategory.fullLocalePath || '#';
                          return (
                            <li key={subCategory.categoryId}>
                              <Link
                                href={subCategoryHref}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 py-1 px-2 text-base font-semibold tracking-wide text-black dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-md capitalize"
                              >
                                <Image src={`/svg/${subCategory.categoryNameCanonical.toLowerCase()}.svg`} alt={subDisplayName} width={20} height={20} className="w-5 h-5 mr-1" />
                                {subDisplayName}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </li>
            );
          }
          // No subcategories: just a link
          return (
            <li key={category.categoryId} className="border-b border-amber-100 dark:border-amber-900/30">
              <Link
                href={categoryHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full py-2 px-3 text-base font-semibold tracking-wide text-black dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-md capitalize"
              >
                <Image src={`/svg/${category.categoryNameCanonical.toLowerCase()}.svg`} alt={displayName} width={24} height={24} className="w-6 h-6 mr-1" />
                {displayName}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };
  
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Peluche Store";

  function ProductPreviewList({ categoryId, locale }: { categoryId: number; locale: string }) {
    const fetcher = (url: string) => fetch(url).then(res => res.json());
    const { data: products, isLoading } = useSWR<ProductWithSlug[]>(`/api/products/${locale}/${categoryId}?limit=6`, fetcher);

    // Normalize locale to base (e.g., 'fr-FR' -> 'fr')
    const normalizedLocale = locale.split('-')[0];
    const [translations, setTranslations] = React.useState<Record<string, string> | null>(null);

    React.useEffect(() => {
      fetch(`/api/product-translations/${normalizedLocale}`)
        .then(res => res.ok ? res.json() : {})
        .then(setTranslations)
        .catch(() => setTranslations({}));
    }, [normalizedLocale]);

    React.useEffect(() => {
      if (products) {
        products.forEach((product: ProductWithSlug) => {
          const translationKey = String(product.productId);
          const translatedName = translations ? translations[translationKey] : undefined;
          console.log('productId:', product.productId, 'translationKey:', translationKey, 'translatedName:', translatedName, 'locale:', locale, 'normalizedLocale:', normalizedLocale, 'translations:', translations);
        });
      }
    }, [products, translations, locale, normalizedLocale]);

    if (isLoading || !translations) return <div className="p-4 text-center text-xs text-gray-400">Loading...</div>;
    if (!products || products.length === 0) return <div className="p-4 text-center text-xs text-gray-400">No products</div>;

    return (
      <ul className="grid grid-cols-1 gap-2 min-w-[220px]">
        {products.map((product: ProductWithSlug) => {
          const translationKey = String(product.productId);
          const translatedName = translations[translationKey] || product.productNameCanonical;
          return (
            <li key={product.productId}>
              <Link href={`/${locale}/products/${product.slug}`} className="flex items-center gap-2 p-2 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30">
                {product.imagePaths && product.imagePaths[0] && (
                  <img src={product.imagePaths[0]} alt={translatedName} className="w-10 h-10 object-contain rounded bg-white border" loading="lazy" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium text-amber-700 dark:text-amber-400">{translatedName}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }
  
  // Helper to render a single row of categories with popover
  function renderCategoryRowPopover(categoriesToRender: ProcessedCategoryData[], showMore: boolean, setShowMore: React.Dispatch<React.SetStateAction<boolean>>) {
    const MAX_VISIBLE = 6;
    const visibleCategories = categoriesToRender.slice(0, MAX_VISIBLE);
    const remainingCategories = categoriesToRender.slice(MAX_VISIBLE);
    return (
      <div className="flex justify-center space-x-1 items-center relative">
        {visibleCategories.map((category) => {
          const displayName = categoryTranslations?.[category.categoryId]?.[baseLocale] || category.categoryNameCanonical;
          const isActive = pathname === category.fullLocalePath || pathname.startsWith(`${category.fullLocalePath}/`);
          const categorySlug = categorySlugMap?.[category.categoryId]?.locales?.[baseLocale];
          const categoryHref = categorySlug ? `/${baseLocale}/categories/${categorySlug}` : '#';
          return (
            <Link
              key={category.categoryId}
              href={categoryHref}
              className={cn(
                "capitalize px-3 h-9 text-sm rounded-md transition-colors flex items-center gap-1 cursor-pointer",
                isActive
                  ? 'font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
                  : 'text-amber-600 dark:text-amber-500 hover:text-amber-700 focus:text-amber-700 dark:hover:text-amber-400 dark:focus:text-amber-400',
              )}
            >
              <Image src={`/svg/${category.categoryNameCanonical.toLowerCase()}.svg`} alt={displayName} width={24} height={24} className="w-6 h-6 mr-1" />
              {displayName}
            </Link>
          );
        })}
        {remainingCategories.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMore(v => !v)}
              className="flex items-center px-3 h-9 text-sm rounded-md transition-colors text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-900 ml-2"
              aria-label="see-more-categories"
            >
              <span className="mr-1">{showMore ? t('seeLessCategories', { defaultValue: 'See less' }) : t('seeMoreCategories', { defaultValue: 'See more' })}</span>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {showMore && (
              <div className="absolute left-0 mt-2 z-50 bg-white dark:bg-neutral-900 rounded-md shadow-lg border border-amber-200 dark:border-amber-700 p-2 min-w-[220px] flex flex-col">
                {remainingCategories.map((category) => {
                  const displayName = categoryTranslations?.[category.categoryId]?.[baseLocale] || category.categoryNameCanonical;
                  const categorySlug = categorySlugMap?.[category.categoryId]?.locales?.[baseLocale];
                  const categoryHref = categorySlug ? `/${baseLocale}/categories/${categorySlug}` : '#';
                  return (
                    <Link
                      key={category.categoryId}
                      href={categoryHref}
                      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm capitalize"
                    >
                      <Image src={`/svg/${category.categoryNameCanonical.toLowerCase()}.svg`} alt={displayName} width={24} height={24} className="w-6 h-6 mr-1" />
                      {displayName}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 w-full">
      <SalesNotificationBanner />
      {/* Mobile Menu Bar */}
      <div className="md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}/`} className="flex items-center space-x-2">
            <Image src="/logo.webp" alt={`${siteName} logo`} width={36} height={36} className="h-9 w-9" />
            <span className="font-extrabold text-black text-2xl tracking-tight font-sans" style={{letterSpacing: '-0.03em'}}>
              {siteName}
            </span>
          </Link>
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <CartIcon />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">{t('toggleMobileMenu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm p-0">
                <div className="flex h-full flex-col space-y-1 overflow-y-auto p-4">
                  {renderMobileCategoryLinks(orderedMenuCategories && orderedMenuCategories.length > 0 ? orderedMenuCategories : [])} 
                  <div className="pt-4 mt-auto border-t border-amber-200 dark:border-amber-700/60">
                    <div className="py-2"><LanguageSwitcher /></div>
                    <div className="py-2"><CartIcon /></div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <header className="hidden md:block w-full border-b border-amber-200 dark:border-amber-800 bg-white/95 dark:bg-black/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-auto max-w-screen-2xl items-center px-4 py-2">
          {/* Logo */}
          <Link href={`/${locale}/`} className="ml-6 flex items-center space-x-2">
            <Image src="/logo.webp" alt={`${siteName} logo`} width={36} height={36} className="h-9 w-9" />
            <span className="font-extrabold text-black text-2xl tracking-tight font-sans" style={{letterSpacing: '-0.03em'}}>
              {siteName}
            </span>
          </Link>
          {/* Category menu fills the space between logo and controls */}
          {orderedMenuCategories && orderedMenuCategories.length > 0 && (
            <div className="flex-1 flex flex-col justify-center mx-2">
              {renderCategoryRowPopover(orderedMenuCategories, showMore, setShowMore)}
            </div>
          )}
          {/* Controls (LanguageSwitcher + Cart) */}
          <div className="flex items-center space-x-4 ml-auto">
            <LanguageSwitcher />
            <CartIcon />
          </div>
        </div>
      </header>
      {(!menuCategories || menuCategories.length === 0) && <div>No categories found.</div>}
    </div>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { title: string; href: string; }
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href} 
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground capitalize',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem'; 