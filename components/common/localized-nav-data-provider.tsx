import { getLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/common/category-navigation';
import { getHierarchicalCategoryData, ProcessedCategoryData } from '@/lib/utils/categories';
import { fetchAllCategorySlugMaps } from '@/lib/api/slug-map';
import fs from 'fs/promises';
import path from 'path';

export async function LocalizedNavDataProvider() {
  const locale = await getLocale();
  
  const allMenuCategories: ProcessedCategoryData[] = await getHierarchicalCategoryData(locale);
  const categorySlugMap = await fetchAllCategorySlugMaps();

  // Limit the categories after fetching them
  const prioritizedMenuCategories = allMenuCategories;

  // --- Load translations for all menu categories ---
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

  return <SiteHeader 
            menuCategories={prioritizedMenuCategories} 
            categorySlugMap={categorySlugMap}
            categoryTranslations={categoryTranslations}
        />;
} 