'use server';

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import remarkGfm from 'remark-gfm';
import type { Product } from '@/types/product';
import { getCountryForCurrency } from '@/lib/utils/location';
import { convertPrice, formatPrice, exchangeRates } from '@/lib/utils/currency';
import { headers } from 'next/headers';
import type { ProductDetailsPayload } from '@/components/common/product-page-client';
import { getHierarchicalCategoryData, ProcessedCategoryData } from '@/lib/utils/categories';
import { ReviewSummary } from '@/types/review';
import { getTranslations } from 'next-intl/server';
import { locales as allLocales } from "@/config/i18n.config";
import { supabase } from '@/lib/supabaseClient';
import { fetchProductSlugMapForLocale } from '@/lib/api/slug-map';
import { getProductById } from '@/lib/utils/products';

// Define helper interfaces for translated variations (can be moved to a shared types file later)
interface TranslatedVariationOption {
  originalName: string;
  translatedName: string;
}

interface TranslatedVariationType {
  originalType: string;
  translatedType: string;
  options: TranslatedVariationOption[];
}
// End helper interfaces for translated variations

// Added for breadcrumbs
interface BreadcrumbSegment {
  name: string;
  path: string;
}

export interface MDXFrontmatter {
  // Core Info (some might be overridden by products.json or specific logic)
  title?: string; // Full H1 title, from MDX
  shortTitle?: string; // Short title for cards/nav, from MDX
  slugOverride?: string; // Slug for this locale, from MDX
  canonicalProductId?: number; // To link MDX to products.json

  // SEO Metadata (primarily from MDX)
  metaTitle?: string; // SEO <title> tag content
  description?: string; // This will be used as metaDescription
  keywords?: string; // Meta keywords

  // Additional Product Details (from MDX, can augment/override products.json)
  brand?: string;
  sku?: string;
  imageAltProduct?: string; // Default alt text for the main product image
 
  [key: `translatedVariations_${string}`]: TranslatedVariationType[] | undefined; // Added for translated variations
  // Note: price, imagePaths, variations are usually from products.json
}

const contentDirectory = path.join(process.cwd(), 'content');

// Helper interface for structured MDX sections
interface MdxSection {
  title: string;
  contentBody: string;
  serializedContent?: MDXRemoteSerializeResult; // To hold the serialized output
}
interface ParsedMdx {
  introContent: string;
  serializedIntroContent?: MDXRemoteSerializeResult;
  sections: MdxSection[];
}

// Helper function to parse MDX content into intro and H2 sections
function parseMdxContent(mdxFileContent: string): Omit<ParsedMdx, 'serializedIntroContent'> {
  const sections: MdxSection[] = [];
  const h2SplitRegex = /\n## /; // Splits at newline followed by '## '
  
  const parts = mdxFileContent.split(h2SplitRegex);
  
  let introContent = '';

  if (parts.length > 0) {
    introContent = parts[0].trim(); // Everything before the first '## '
    
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const firstNewlineIndex = part.indexOf('\n');
      let title = '';
      let contentBody = '';

      if (firstNewlineIndex !== -1) {
        title = part.substring(0, firstNewlineIndex).trim().replace(/#+$/, '').trim(); // Remove trailing hashes from title
        contentBody = part.substring(firstNewlineIndex + 1).trim();
      } else {
        title = part.trim().replace(/#+$/, '').trim(); // Remove trailing hashes from title
        contentBody = ''; // No content if H2 is the last thing or has no content below it
      }
      // Only add if title is not empty, to avoid sections from just newlines or empty H2s
      if (title) { 
         sections.push({ title, contentBody });
      }
    }
  }
  
  return { introContent, sections };
}

// --- File-based utilities ---
async function getProductIdBySlug(slug: string, locale: string): Promise<number | null> {
  const slugMap = await fetchProductSlugMapForLocale(locale);
  const decodedSlug = decodeURIComponent(slug);
  for (const [productId, productSlug] of Object.entries(slugMap)) {
    if (productSlug === decodedSlug) return Number(productId);
  }
  return null;
}
async function getProductMdx(locale: string, productId: number) {
  const { data, error } = await supabase
    .from('product_mdx')
    .select('mdx_full')
    .eq('id', productId)
    .eq('language', locale)
    .single();
  if (error || !data) return '';
  return data.mdx_full;
}

// Helper function to find a category and its path in the tree
function findCategoryPath(
  nodes: ProcessedCategoryData[],
  targetId: number,
  currentPath: BreadcrumbSegment[],
  locale: string,
  categoryTranslations: Record<number, Record<string, string>>
): BreadcrumbSegment[] | null {
  for (const node of nodes) {
    const translatedName = categoryTranslations?.[node.categoryId]?.[locale] || node.localeShortTitle || node.localeTitle || node.categoryNameCanonical;
    const newSegment = {
      name: translatedName,
      path: node.fullLocalePath || `/categories/unknown`,
    };
    const newPath = [...currentPath, newSegment];
    if (node.categoryId === targetId) {
      return newPath;
    }
    if (node.children && node.children.length > 0) {
      const foundPath = findCategoryPath(node.children, targetId, newPath, locale, categoryTranslations);
      if (foundPath) return foundPath;
    }
  }
  return null;
}

export async function fetchProductDetailsServer(locale: string, productSlug: string): Promise<ProductDetailsPayload> {
  const functionStartTime = new Date();
  const headerList = headers();
  let geolocatedCountry: string | null = null;
  try {
    geolocatedCountry = await getCountryForCurrency(headerList);
  } catch {}
  let countryCodeForPricing: string;
  if (geolocatedCountry) {
    countryCodeForPricing = geolocatedCountry.toUpperCase();
  } else {
    const localeParts = locale.split('-');
    countryCodeForPricing = (localeParts.length > 1 ? localeParts[1] : localeParts[0]).toUpperCase();
    if (countryCodeForPricing === 'EN') countryCodeForPricing = 'US';
  }
  if (!countryCodeForPricing) countryCodeForPricing = 'US';

  // --- Load category translations for all categories in the tree ---
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

  // 1. Find productId by slug and locale
  const canonicalProductId = await getProductIdBySlug(productSlug, locale);
  if (canonicalProductId === null) {
    return {
      error: 'Product data not found (slug mapping failed)',
      productDataFromJSON: null, 
      mdxFrontmatter: null,
      localizedPriceInfo: null,
      detectedLocale: locale, 
      detectedCountryForPricing: countryCodeForPricing,
      exchangeRates: null,
      serializedIntroContent: null,
      mdxSections: [],
      breadcrumbs: [{ name: "Home", path: `/${locale}` }],
    };
  }

  // 2. Load product data
  let productDataFromJSON = null;
  try {
    productDataFromJSON = await getProductById(canonicalProductId);
  } catch {}

  // 3. Load MDX content and parse frontmatter
  let mdxFrontmatter: MDXFrontmatter | null = null;
  let mdxFileData: { frontmatter: MDXFrontmatter; content: string } | null = null;
  let mdxContent = '';
  try {
    mdxContent = await getProductMdx(locale, canonicalProductId);
    if (mdxContent) {
      const { data, content } = matter(mdxContent);
      mdxFrontmatter = data as MDXFrontmatter;
      mdxFileData = { frontmatter: mdxFrontmatter, content };
    }
  } catch (err) {
    // Error parsing mdx, continue gracefully
  }

  // 4. Parse and serialize MDX sections
  let serializedIntroContent: MDXRemoteSerializeResult | null = null;
  const mdxSections: Array<{ title: string; serializedContent: MDXRemoteSerializeResult }> = [];
  if (mdxFileData && mdxFileData.content) {
    const { introContent, sections: parsedSections } = parseMdxContent(mdxFileData.content);
    if (introContent) {
      try {
        serializedIntroContent = await serialize(introContent, {
          mdxOptions: { remarkPlugins: [remarkGfm] },
          parseFrontmatter: false
        });
      } catch (err) {
        serializedIntroContent = null;
      }
    }
    for (const section of parsedSections) {
      if (section.contentBody) {
        try {
          const serializedSectionContent = await serialize(section.contentBody, {
            mdxOptions: { remarkPlugins: [remarkGfm] },
            parseFrontmatter: false
          });
          mdxSections.push({ title: section.title, serializedContent: serializedSectionContent });
        } catch (err) {
          // Gracefully skip section if serialization fails
        }
      }
    }
  }

  // Define translatedProductName here to be available in the whole function scope
  let translatedProductName = '';
  if (productDataFromJSON) {
    try {
      // Load batched translations for the current locale
      const batchedTranslationsPath = path.join(process.cwd(), 'data/batched-product-translations', `${locale}.json`);
      const translations = JSON.parse(await fs.readFile(batchedTranslationsPath, 'utf8'));
      translatedProductName = translations[productDataFromJSON.productId];
    } catch (err) {
      // No translation found, continue gracefully
    }
  }
  
  const finalProductName = (
    translatedProductName ||
    mdxFrontmatter?.title ||
    (productDataFromJSON ? productDataFromJSON.productNameCanonical : '') ||
    "Product"
  ).trim();

  // 5. Breadcrumbs
  let breadcrumbs: BreadcrumbSegment[] = [];
  const t = await getTranslations({ locale, namespace: 'Common' });
  const homeBreadcrumbName = t('homeBreadcrumb').trim();
  const homePath = `/${locale}`;
  breadcrumbs = [{ name: homeBreadcrumbName, path: homePath }];
  if (productDataFromJSON && productDataFromJSON.categoryIds && productDataFromJSON.categoryIds.length > 0) {
    const primaryCategoryId = productDataFromJSON.categoryIds[0];
    const categoryTreeForLocale = await getHierarchicalCategoryData(locale);
    const rawCategoryPath = findCategoryPath(categoryTreeForLocale, primaryCategoryId, [], locale, categoryTranslations);
    if (rawCategoryPath && rawCategoryPath.length > 0) {
      let categorySegmentsToAdd = rawCategoryPath.map(segment => ({
        name: (segment.name || '').trim(),
        path: segment.path // This is fullLocalePath, which is the correct slug for subcategories
      }));
      if (categorySegmentsToAdd[0].name === homeBreadcrumbName && categorySegmentsToAdd[0].path === homePath) {
        categorySegmentsToAdd = categorySegmentsToAdd.slice(1); 
      }
      categorySegmentsToAdd = categorySegmentsToAdd.filter((seg, idx, arr) => {
        if (idx === 0) return true;
        return seg.path !== arr[idx - 1].path;
      });
      if (categorySegmentsToAdd.length > 0) {
        breadcrumbs = [...breadcrumbs, ...categorySegmentsToAdd];
      }
    }
  }
  if (productDataFromJSON) {
    if (breadcrumbs.length > 0) {
      const lastExistingSegmentName = breadcrumbs[breadcrumbs.length - 1].name;
      if (lastExistingSegmentName !== finalProductName) {
        breadcrumbs.push({ name: finalProductName, path: '' });
      } else {
        breadcrumbs[breadcrumbs.length - 1].path = '';
      }
    } else {
      breadcrumbs.push({ name: homeBreadcrumbName, path: homePath });
      breadcrumbs.push({ name: finalProductName, path: '' });
    }
  } else if (breadcrumbs.length === 0) {
    breadcrumbs = [{ name: homeBreadcrumbName, path: homePath }];
  }

  // 6. Price info
  let localizedPriceInfo: ProductDetailsPayload['localizedPriceInfo'] = null;
  let originalLocalizedPriceInfo: ProductDetailsPayload['originalLocalizedPriceInfo'] = null;
  
  const basePriceToUse = productDataFromJSON?.basePriceUSD ?? productDataFromJSON?.basePrice;

  if (basePriceToUse && countryCodeForPricing) {
    const priceDetails = convertPrice(basePriceToUse, countryCodeForPricing);
    if (priceDetails) {
      localizedPriceInfo = {
        displayPrice: formatPrice(priceDetails.convertedPrice, priceDetails.currency),
        currencyCode: priceDetails.currency.code,
        currencySymbol: priceDetails.currency.symbol,
        convertedAmount: priceDetails.convertedPrice,
      };

      const originalPrice = priceDetails.convertedPrice / 0.7;
      originalLocalizedPriceInfo = {
        displayPrice: formatPrice(originalPrice, priceDetails.currency),
        currencyCode: priceDetails.currency.code,
        currencySymbol: priceDetails.currency.symbol,
        convertedAmount: originalPrice,
      };
    }
  }
  const currentExchangeRates = exchangeRates || {};
  let productSpecificReviewSummary: ReviewSummary | undefined = undefined;
  if (productDataFromJSON && typeof productDataFromJSON === 'object' && 'reviewSummary' in productDataFromJSON) {
    productSpecificReviewSummary = (productDataFromJSON as { reviewSummary?: ReviewSummary }).reviewSummary;
  }
  let finalProductDataFromJSON: (Product & { basePriceUSD: number }) | null = null;
  if (productDataFromJSON) {
    const safeBasePrice = typeof productDataFromJSON.basePrice === 'number' ? productDataFromJSON.basePrice : 0;
    const safeBasePriceUSD = typeof productDataFromJSON.basePriceUSD === 'number'
      ? productDataFromJSON.basePriceUSD
      : safeBasePrice;
    finalProductDataFromJSON = {
      ...productDataFromJSON,
      basePrice: safeBasePrice,
      basePriceUSD: safeBasePriceUSD,
    };
  }
  let productSchema: Record<string, unknown> | undefined = undefined;
  if (finalProductDataFromJSON) {
    const canonicalDomain = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || 'https://www.example.com';
    const imageUrl = finalProductDataFromJSON.imagePaths?.[0]
      ? `${canonicalDomain}${finalProductDataFromJSON.imagePaths[0]}`
      : undefined;
    productSchema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": finalProductName,
      "description": mdxFrontmatter?.description || finalProductName,
      "image": imageUrl,
      "sku": String(finalProductDataFromJSON.productId),
      "brand": mdxFrontmatter?.brand || undefined,
      "offers": {
        "@type": "Offer",
        "url": `${canonicalDomain}/${locale}/products/${productSlug}`,
        "priceCurrency": "USD", // NOTE: Hardcoded as this info is no longer on the product object
        "price": finalProductDataFromJSON.basePrice,
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };
  }
  const result = {
    productDataFromJSON: finalProductDataFromJSON,
    mdxFrontmatter,
    localizedPriceInfo,
    originalLocalizedPriceInfo,
    detectedLocale: locale,
    detectedCountryForPricing: countryCodeForPricing,
    exchangeRates: currentExchangeRates,
    serializedIntroContent,
    mdxSections,
    breadcrumbs,
    translatedProductName: finalProductName,
    ...(productSpecificReviewSummary && { reviewSummary: productSpecificReviewSummary }),
    productSchema
  };

  return result;
} 