import { NextResponse } from 'next/server';
import {
  findCategoryByTranslatedPath,
  getHierarchicalCategoryData,
  ProcessedCategoryData,
} from '@/lib/utils/categories';
import { locales, defaultLocale } from '@/config/i18n.config'; // Assuming you have a central i18n config
import { fetchAllCategorySlugMaps, SlugMap } from '@/lib/api/slug-map';

// Helper function (could be in categories.ts or a shared util if used elsewhere)
function findInCategoryTreeById(nodes: ProcessedCategoryData[], id: number): ProcessedCategoryData | null {
  for (const node of nodes) {
    if (node.categoryId === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findInCategoryTreeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentLocale = searchParams.get('currentLocale');
  const categorySlugParams = searchParams.get('categorySlug'); // This will be a comma-separated string
  const countryCode = searchParams.get('countryCode'); // Optionally passed in

  if (!currentLocale || !categorySlugParams) {
    return NextResponse.json({ error: 'Missing currentLocale or categorySlug' }, { status: 400 });
  }

  const categorySlugArray = categorySlugParams.split(',');

  try {
    const slugMap = await fetchAllCategorySlugMaps();
    // Find the categoryId in the slug map that matches this slug for the current locale
    const joinedSlug = categorySlugArray.map(decodeURIComponent).join('/');
    const entry = Object.entries(slugMap).find(([, slugDataObject]) => (slugDataObject as SlugMap).locales[currentLocale] === joinedSlug);
    if (!entry) {
      return NextResponse.json({ error: 'Category not found for the given slug and locale' }, { status: 404 });
    }
    const categoryId = Number(entry[0]);

    const isProd = process.env.NODE_ENV === 'production';
    const domain = isProd
      ? process.env.NEXT_PUBLIC_CANONICAL_DOMAIN?.replace(/^https?:\/\//, '')
      : request.headers.get('host');
    const protocol = isProd ? 'https' : 'http';
    const baseUrl = `${protocol}://${domain}`;

    const alternates: Record<string, string> = {};
    for (const altLocale of locales) {
      const altSlug = slugMap[categoryId]?.locales?.[altLocale];
      if (altSlug) {
        // If a country code is present, include it in the path (e.g., /it-IT/categories/slug)
        const localePrefix = countryCode && altLocale === currentLocale ? `${altLocale}-${countryCode}` : altLocale;
        alternates[altLocale] = `${baseUrl}/${localePrefix}/categories/${altSlug}`;
      }
    }
    // Ensure x-default is set
    if (alternates[defaultLocale]) {
      alternates['x-default'] = alternates[defaultLocale];
    } else if (alternates[currentLocale]) {
      alternates['x-default'] = alternates[currentLocale];
    }
    return NextResponse.json(alternates);
  } catch (error) {
    console.error('Failed to fetch category alternates:', error);
    return NextResponse.json({ error: 'Internal server error fetching category alternates', details: (error as Error).message }, { status: 500 });
  }
} 