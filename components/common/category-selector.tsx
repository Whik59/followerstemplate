'use client';
import React from 'react';
import useSWR, { useSWRConfig } from 'swr';
import type { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Category config
const CATEGORIES = [
  { id: 23, key: 'instagram' },
  { id: 9, key: 'tiktok' },
  { id: 2, key: 'youtube' },
  { id: 3, key: 'x-twitter' },
  { id: 24, key: 'facebook' },
  { id: 11, key: 'spotify' },
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
  { id: 21, key: 'apple-app' },
  { id: 22, key: 'android-app' },
  { id: 25, key: 'discord' },
];

interface ProductWithSlug extends Product {
  slug: string;
}

interface SmmaTranslations {
  seeMoreCategories?: string;
  seeLessCategories?: string;
  [key: string]: string | undefined;
}

export function CategorySelector({ locale }: { locale: string }) {
  const [selected, setSelected] = React.useState(CATEGORIES[0].id);
  const normalizedLocale = locale.split('-')[0];
  const { mutate } = useSWRConfig();
  const t = useTranslations('Common');

  // Prefetch products for the first 4 categories on mount
  React.useEffect(() => {
    const MAX_VISIBLE = 4;
    CATEGORIES.slice(0, MAX_VISIBLE).forEach(cat => {
      const url = `/api/products/${locale}/${cat.id}?limit=12`;
      mutate(url, fetch(url).then(res => res.json()), false);
    });
  }, [locale, mutate]);

  // Fetch products + translations for selected category
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, isLoading } = useSWR<{ products: ProductWithSlug[]; translations: Record<string, string> }>(`/api/products/${locale}/${selected}?limit=12`, fetcher);
  const products = data?.products || [];
  const translations = data?.translations || {};

  const MAX_VISIBLE = 4;
  const visibleCategories = CATEGORIES.slice(0, MAX_VISIBLE);
  const remainingCategories = CATEGORIES.slice(MAX_VISIBLE);
  const [showMore, setShowMore] = React.useState(false);

  // Ref for the product list
  const productListRef = React.useRef<HTMLDivElement>(null);
  const seeMoreContainerRef = React.useRef<HTMLDivElement>(null);
  const iconsContainerRef = React.useRef<HTMLDivElement>(null);

  // Helper to get the see more/less label as a comma-separated list
  function getSeeMoreLabel() {
    if (showMore) return 'Show less';
    if (remainingCategories.length === 0) return '';
    const names = remainingCategories.map(cat => cat.key.charAt(0).toUpperCase() + cat.key.slice(1));
    if (names.length <= 3) return names.join(', ');
    return names.slice(0, 3).join(', ') + ', ...';
  }

  // Handler for icon click: set selected and scroll to products
  function handleCategoryClick(catId: number) {
    setSelected(catId);
    setTimeout(() => {
      if (iconsContainerRef.current) {
        const offset = 120; // Adjust this value to match your header + banner height
        const y = iconsContainerRef.current.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100); // Delay to allow products to update
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* See more/less button above icon selector */}
      {remainingCategories.length > 0 && (
        <div ref={seeMoreContainerRef} className="flex justify-center mb-4 w-full">
          <button
            type="button"
            onClick={() => setShowMore(v => !v)}
            className="flex items-center justify-center rounded-xl p-2 border-2 transition-all bg-white shadow-sm border-transparent opacity-60 hover:opacity-100 whitespace-nowrap"
            aria-label="more-categories"
          >
            {showMore ? (
              <Minus className="w-8 h-8 text-amber-500" />
            ) : (
              <Plus className="w-8 h-8 text-amber-500" />
            )}
            <span className="ml-2 text-sm font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
              {getSeeMoreLabel()}
            </span>
          </button>
        </div>
      )}
      {/* Expanded categories grid now appears above the main icon selector */}
      {showMore && (
        <div className="grid grid-cols-4 gap-4 mb-2 w-full max-w-lg mx-auto bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-lg z-20 relative">
          {remainingCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { handleCategoryClick(cat.id); setShowMore(false); }}
              className={`rounded-xl p-2 border-2 transition-all flex items-center justify-center bg-white shadow-sm ${selected === cat.id ? 'border-amber-400 shadow-amber-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
              aria-label={cat.key}
              type="button"
            >
              <Image src={`/svg/${cat.key}.svg`} alt={cat.key} width={48} height={48} className="w-12 h-12" />
            </button>
          ))}
        </div>
      )}
      {/* Icon selector */}
      <div ref={iconsContainerRef} className="grid grid-cols-4 gap-4 mb-6 w-full max-w-lg mx-auto">
        {visibleCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`rounded-xl p-2 border-2 transition-all flex items-center justify-center bg-white shadow-sm ${selected === cat.id ? 'border-amber-400 shadow-amber-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
            aria-label={cat.key}
            type="button"
          >
            <Image src={`/svg/${cat.key}.svg`} alt={cat.key} width={48} height={48} className="w-12 h-12" />
          </button>
        ))}
      </div>
      {/* Product list */}
      <div ref={productListRef} className="w-full bg-amber-50/60 dark:bg-neutral-900/60 rounded-2xl p-4 shadow-md flex flex-col gap-2">
        {isLoading ? (
          <ul className="flex flex-col gap-2 w-full">
            {[...Array(6)].map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-neutral-800 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </li>
            ))}
          </ul>
        ) : products && products.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {products.map(product => {
              const translationKey = String(product.productId);
              const translatedName = translations[translationKey] || product.productNameCanonical;
              const selectedCategory = CATEGORIES.find(cat => cat.id === selected);
              return (
                <li key={product.productId}>
                  <Link
                    href={`/${locale}/products/${product.slug}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 shadow hover:shadow-lg transition group"
                  >
                    {selectedCategory && (
                      <img src={`/svg/${selectedCategory.key}.svg`} alt={selectedCategory.key} className="w-10 h-10 object-contain rounded bg-white border" loading="lazy" />
                    )}
                    <span className="flex-1 text-base font-medium text-neutral-800 dark:text-neutral-100 group-hover:text-amber-600 truncate">{translatedName}</span>
                    <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-600 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center text-sm text-gray-400 py-8">No products found.</div>
        )}
      </div>
    </div>
  );
} 