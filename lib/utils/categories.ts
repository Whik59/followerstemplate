import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { unstable_cache as nextCache } from 'next/cache';
import type { Product } from '@/types/product';
import { getAllProducts } from './products';
import { fetchAllCategorySlugMaps, fetchAllProductSlugMaps } from '@/lib/api/slug-map';
import { supabase } from '@/lib/supabaseClient';

// Export this new function so it can be used on the category page
export async function getCategoryMdx(locale: string, categoryId: number): Promise<string> {
  const { data, error } = await supabase
    .from('category_mdx')
    .select('mdx_full')
    .eq('id', categoryId)
    .eq('language', locale)
    .single();
  if (error || !data) {
    // console.error(`[getCategoryMdx] Error fetching MDX for category ${categoryId} in ${locale}:`, error);
    return '';
  }
  return data.mdx_full || '';
}

const contentDirectory = path.join(process.cwd(), 'content');
const siteNameFromEnv = process.env.NEXT_PUBLIC_SITE_NAME || "Your Awesome Shop";

interface CanonicalCategory {
  categoryId: number;
  categoryNameCanonical: string;
  parentCategoryId: number | null;
}

interface CategoryMdxFrontmatter {
  title?: string;
  shortTitle?: string;
  description?: string;
  keywords?: string;
  slugOverride?: string;
  canonicalCategoryId?: number;
  [key: string]: unknown;
}

interface CategoryPrePath extends Omit<ProcessedCategoryData, 'fullLocalePath' | 'children'> {
  children: CategoryPrePath[];
}

export interface ProcessedCategoryData extends CanonicalCategory {
  localeTitle: string;
  localeShortTitle: string;
  localeSlugSegment: string;
  heroImageUrl?: string;
  mdxDescription?: string;
  mdxKeywords?: string;
  mdxContent?: string | null;
  children: ProcessedCategoryData[];
  fullLocalePath: string;
}

export interface TopCategoryWithProducts extends ProcessedCategoryData {
  products: Product[];
}

function stringToSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

const CATEGORIES_DIR = path.join(process.cwd(), 'data/categories');
const CATEGORY_TRANSLATIONS_DIR = path.join(process.cwd(), 'data/category-translations');

async function getCategoryById(id: number) {
  const file = path.join(CATEGORIES_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as CanonicalCategory;
  } catch {
    return undefined;
  }
}

async function getCategorySlugMapById(id: number) {
  const file = path.join(process.cwd(), 'data/category-slug-map', `${id}.json`);
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function getCategoryTranslationsById(id: number) {
  const file = path.join(CATEGORY_TRANSLATIONS_DIR, `${id}.json`);
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

// --- New Lightweight Category Fetching Logic ---

// Define a specific type for the translations map
interface CategoryTranslationsMap {
  [categoryId: string]: {
    [locale: string]: string;
  };
}

// Define the type for a single item in the translations JSON file
interface CategoryTranslationFileItem {
  categoryId: number;
  translations: {
    [locale: string]: string;
  };
}

// Cache for category translations to avoid re-reading the file
let categoryTranslationsCache: CategoryTranslationsMap | null = null;

async function getAllCategoryTranslationsBatched(): Promise<CategoryTranslationsMap> {
  if (categoryTranslationsCache) {
    return categoryTranslationsCache;
  }
  const filePath = path.join(process.cwd(), 'data/category-translations.json');
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed: CategoryTranslationFileItem[] = JSON.parse(raw);
    // Convert array to a map for easier lookup
    const translationsMap = parsed.reduce((acc: CategoryTranslationsMap, item) => {
      acc[item.categoryId] = item.translations;
      return acc;
    }, {});
    categoryTranslationsCache = translationsMap;
    return translationsMap;
  } catch {
    // In case of an error, set the cache to an empty object to prevent re-reading the file
    categoryTranslationsCache = {};
    return categoryTranslationsCache;
  }
}

// A new function that gets all category data WITHOUT fetching MDX content.
export async function getLightweightCategories(locale: string): Promise<CategoryPrePath[]> {
  const categoriesPath = path.join(process.cwd(), 'data/categories.json');
  
  const [rawCategories, allSlugMaps, allTranslations] = await Promise.all([
    fs.readFile(categoriesPath, 'utf8'),
    fetchAllCategorySlugMaps(), // This is already optimized to read a single file
    getAllCategoryTranslationsBatched() // New optimized function
  ]);

  const categories: CanonicalCategory[] = JSON.parse(rawCategories);
  
  return categories.map(category => {
    const slugMap = allSlugMaps[category.categoryId];
    const translations = allTranslations[category.categoryId];
    const localeTitle = translations?.[locale] || category.categoryNameCanonical;
    
    let localeSlugSegment = slugMap?.locales?.[locale] || stringToSlug(category.categoryNameCanonical);
    if (!localeSlugSegment || localeSlugSegment.trim() === '') {
      localeSlugSegment = String(category.categoryId);
    }

    return {
      ...category,
      localeTitle,
      localeShortTitle: localeTitle, // No MDX, so we use the full title
      localeSlugSegment,
      mdxContent: null, // Ensure MDX fields are null
      mdxDescription: undefined,
      mdxKeywords: undefined,
      heroImageUrl: undefined,
      children: [],
    };
  });
}

// A new cached function to build the tree from the lightweight data
const getAndCacheLightweightHierarchicalCategoryData = nextCache(
  async (locale: string): Promise<ProcessedCategoryData[]> => {
    const categories = await getLightweightCategories(locale);
    return buildCategoryTreeWithPaths(categories, null, `/${locale}/categories`);
  },
  ['lightweight-hierarchical-category-data'],
  { revalidate: 3600 } 
);

export async function getLightweightHierarchicalCategoryData(locale: string): Promise<ProcessedCategoryData[]> {
  return getAndCacheLightweightHierarchicalCategoryData(locale);
}

// --- The original, slower functions remain for pages that need MDX ---

async function getAllCategoryIds() {
  const files = await fs.readdir(CATEGORIES_DIR);
  return files.filter(f => f.endsWith('.json')).map(f => Number(f.replace('.json', '')));
}

export async function getAllCategoriesWithMdxData(locale: string): Promise<CategoryPrePath[]> {
  // Read from data/categories.json instead of directory
  const categoriesPath = path.join(process.cwd(), 'data/categories.json');
  const raw = await fs.readFile(categoriesPath, 'utf8');
  const categories: CanonicalCategory[] = JSON.parse(raw); // should be an array
  const allSlugMaps = await fetchAllCategorySlugMaps();
  const processedCategories: CategoryPrePath[] = [];
  for (const category of categories) {
    const slugMap = allSlugMaps[category.categoryId];
    const translations = await getCategoryTranslationsById(category.categoryId);
    const mdxContent = await getCategoryMdx(locale, category.categoryId);
    let mdxFrontmatter: CategoryMdxFrontmatter = {};
    let content = '';
    if (mdxContent) {
      try {
        const { data, content: mdxBody } = matter(mdxContent);
        mdxFrontmatter = data as CategoryMdxFrontmatter;
        content = mdxBody;
      } catch (err) {
        console.error('[MDX Frontmatter Parse Error]', err);
        mdxFrontmatter = {};
        content = mdxContent; // fallback: show raw content
      }
    }
    const localeTitle = translations?.[locale] || category.categoryNameCanonical;
    let localeSlugSegment = '';
    if (slugMap?.locales?.[locale]) {
      localeSlugSegment = slugMap.locales[locale];
    } else if (mdxFrontmatter.slugOverride) {
      localeSlugSegment = mdxFrontmatter.slugOverride;
    } else {
      localeSlugSegment = stringToSlug(category.categoryNameCanonical);
    }
    if (!localeSlugSegment || localeSlugSegment.trim() === '') {
      localeSlugSegment = String(category.categoryId);
    }
    processedCategories.push({
      ...category,
      localeTitle,
      localeShortTitle: mdxFrontmatter.shortTitle || localeTitle,
      localeSlugSegment,
      heroImageUrl: undefined,
      mdxDescription: mdxFrontmatter.description,
      mdxKeywords: mdxFrontmatter.keywords,
      mdxContent: content,
      children: [],
    });
  }
  return processedCategories;
}

function buildCategoryTreeWithPaths(
  flatCategories: CategoryPrePath[],
  parentId: number | null,
  currentPathPrefix: string, 
  parentSlugPath: string = ''
): ProcessedCategoryData[] {
  const tree: ProcessedCategoryData[] = [];
  for (const category of flatCategories) {
    if (category.parentCategoryId === parentId) {
      const currentFullSlug = category.localeSlugSegment;
      const node: ProcessedCategoryData = {
        ...category,
        fullLocalePath: `${currentPathPrefix}/${currentFullSlug}`,
        children: buildCategoryTreeWithPaths(
          flatCategories,
          category.categoryId,
          currentPathPrefix,
          currentFullSlug
        ),
      };
      tree.push(node);
    }
  }
  return tree.sort((a, b) => a.localeTitle.localeCompare(b.localeTitle));
}

export function getCategoryAndDescendantIds(category: ProcessedCategoryData): number[] {
  let ids = [category.categoryId];
  if (category.children && category.children.length > 0) {
    for (const child of category.children) {
      ids = ids.concat(getCategoryAndDescendantIds(child));
    }
  }
  return ids;
}

const getAndCacheHierarchicalCategoryData = nextCache(
  async (locale: string): Promise<ProcessedCategoryData[]> => {
    const categoriesWithMdx = await getLightweightCategories(locale);
    const categoryTree = buildCategoryTreeWithPaths(categoriesWithMdx, null, `/${locale}/categories`);
    return categoryTree;
  },
  ['hierarchical-category-data'],
  { revalidate: 3600 } 
);

export async function getHierarchicalCategoryData(locale: string): Promise<ProcessedCategoryData[]> {
  return getAndCacheHierarchicalCategoryData(locale);
}

export async function findCategoryByTranslatedPath(locale: string, slugPathArray: string[]): Promise<ProcessedCategoryData | null> {
  const slugMapPath = path.join(process.cwd(), 'data/category-slug-map.json');
  const joinedSlug = slugPathArray.map(decodeURIComponent).join('/').normalize('NFC');
  let categoryId: number | null = null;
  let slugMap: Record<string, { locales?: Record<string, string> }> = {};
  try {
    slugMap = JSON.parse(await fs.readFile(slugMapPath, 'utf8'));
  } catch {
    slugMap = {};
  }
  for (const [id, data] of Object.entries(slugMap)) {
    if (data.locales?.[locale] === joinedSlug) {
      categoryId = Number(id);
      break;
    }
  }
  if (categoryId === null) return null;
  const allCategories = await getHierarchicalCategoryData(locale);
  function findInTree(nodes: ProcessedCategoryData[], id: number): ProcessedCategoryData | null {
    for (const node of nodes) {
      if (node.categoryId === id) return node;
      if (node.children && node.children.length > 0) {
        const found = findInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }
  return findInTree(allCategories, categoryId);
}

export async function findCategoryByFullSlug(locale: string, fullSlug: string): Promise<ProcessedCategoryData | null> {
  const categoryTree = await getHierarchicalCategoryData(locale);
    function searchTree(categories: ProcessedCategoryData[]): ProcessedCategoryData | null {
        for (const category of categories) {
            if (category.fullLocalePath === fullSlug) {
                return category;
            }
            if (category.children && category.children.length > 0) {
                const foundInChildren = searchTree(category.children);
                if (foundInChildren) {
                    return foundInChildren;
                }
            }
        }
        return null;
    }
  return searchTree(categoryTree);
}

export async function getTopCategoriesWithProducts(
  locale: string,
  productsPerCategory: number,
  numberOfCategories: number
): Promise<TopCategoryWithProducts[]> {
  const allCategories = await getHierarchicalCategoryData(locale);
  // Using top-level categories that have no parent
  const topLevelCategories = allCategories.filter(c => !c.parentCategoryId);
  const selectedCategories = topLevelCategories.slice(0, numberOfCategories);

  const categoriesWithProducts = await Promise.all(
    selectedCategories.map(async (category) => {
      const descendantIds = getCategoryAndDescendantIds(category);
      const productResponse = await getAllProducts({
        categoryIds: descendantIds,
        limit: productsPerCategory,
      });
      return {
        ...category,
        products: productResponse.products,
      };
    })
  );

  return categoriesWithProducts;
} 