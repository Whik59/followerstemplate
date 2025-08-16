import fs from 'fs/promises';
import path from 'path';

export interface SlugMap {
  locales: { [locale: string]: string };
}

let productSlugMapCache: Record<number, SlugMap> | null = null;
let categorySlugMapCache: Record<number, SlugMap> | null = null;

async function getProductSlugMapFromCache(): Promise<Record<number, SlugMap>> {
  if (productSlugMapCache) return productSlugMapCache;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'cache/product-slug-map.json'), 'utf8');
    productSlugMapCache = JSON.parse(raw);
    return productSlugMapCache as Record<number, SlugMap>;
  } catch {
    throw new Error('Failed to load product slug map cache. Please run `npm run cache`.');
  }
}

async function getCategorySlugMapFromCache(): Promise<Record<number, SlugMap>> {
    if (categorySlugMapCache) return categorySlugMapCache;
    try {
        const raw = await fs.readFile(path.join(process.cwd(), 'cache/category-slug-map.json'), 'utf8');
        categorySlugMapCache = JSON.parse(raw);
        return categorySlugMapCache as Record<number, SlugMap>;
    } catch {
        throw new Error('Failed to load category slug map cache. Please run `npm run cache`.');
    }
}

export async function fetchAllProductSlugMaps(): Promise<Record<number, SlugMap>> {
  return getProductSlugMapFromCache();
}

export async function fetchAllCategorySlugMaps(): Promise<Record<number, SlugMap>> {
  return getCategorySlugMapFromCache();
}

export async function fetchProductSlugMapById(id: number): Promise<SlugMap | null> {
  const allMaps = await getProductSlugMapFromCache();
  return allMaps[id] || null;
}

export async function fetchCategorySlugMapById(id: number): Promise<SlugMap | null> {
  const allMaps = await getCategorySlugMapFromCache();
  return allMaps[id] || null;
}

export async function fetchProductSlugMapForLocale(locale: string): Promise<Record<number, string>> {
  const filePath = path.join(process.cwd(), 'data/batched-product-slug-map', `${locale}.json`);
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return {};
  }
} 