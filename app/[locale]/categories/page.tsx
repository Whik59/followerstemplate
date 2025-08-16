import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { getHierarchicalCategoryData, type ProcessedCategoryData } from '@/lib/utils/categories';
import type { Metadata } from 'next';
import { CategoryCard } from '@/components/common/category-card';
import { Suspense } from 'react';
import { AboutUsSection } from '@/components/common/about-us-section';
import { WhyChooseUsSection } from '@/components/common/why-choose-us-section';
import { OurValuesSection } from '@/components/common/our-values-section';
import fs from 'fs/promises';
import path from 'path';
import { fetchAllCategorySlugMaps } from '@/lib/api/slug-map';

interface CategoriesPageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({ params: { locale } }: CategoriesPageProps): Promise<Metadata> {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CategoriesPage' });
  const siteName = await getTranslations({ locale, namespace: 'Common' }).then(c => c('siteName'));

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/categories`,
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `/${locale}/categories`,
      siteName: siteName,
      type: 'website',
      locale: locale,
    },
  };
}

export const revalidate = false;

export default async function CategoriesPage({ params: { locale } }: CategoriesPageProps) {
  unstable_setRequestLocale(locale);
  const tCategories = await getTranslations({ locale, namespace: 'CategoriesPage' });

  const categories: ProcessedCategoryData[] = await getHierarchicalCategoryData(locale);
  const categorySlugMap = await fetchAllCategorySlugMaps();

  // --- Load translations for all categories ---
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

  return (
    <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-background dark:from-amber-900 dark:via-amber-800/50 dark:to-background min-h-screen">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          {/* <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            {tCategories('pageTitle')}
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            {tCategories('pageSubtitle')}
          </p> */}
        </header>

        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.categoryId} category={category} _locale={locale} categorySlugMap={categorySlugMap} categoryTranslations={categoryTranslations} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 dark:text-gray-400">{tCategories('noCategoriesFound')}</p>
          </div>
        )}
      </div>
      {/* Informational Sections */}
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16 space-y-12 md:space-y-16">
        <Suspense fallback={<div>Loading About Us...</div>}>
          <AboutUsSection locale={locale} />
        </Suspense>
        <Suspense fallback={<div>Loading Why Choose Us...</div>}>
          <WhyChooseUsSection locale={locale} />
        </Suspense>
        <Suspense fallback={<div>Loading Our Values...</div>}>
          <OurValuesSection locale={locale} />
        </Suspense>
      </div>
    </div>
  );
} 