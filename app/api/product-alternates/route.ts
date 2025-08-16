import { NextRequest, NextResponse } from 'next/server';
import { locales as supportedLocales, defaultLocale } from '@/config/i18n.config';
import fs from 'fs/promises';
import path from 'path';

// New: Load all batched slug maps
async function fetchBatchedSlugMaps(): Promise<Record<string, Record<string, string>>> {
  const dir = path.join(process.cwd(), 'data/batched-product-slug-map');
  const maps: Record<string, Record<string, string>> = {};
  for (const locale of supportedLocales) {
    const filePath = path.join(dir, `${locale}.json`);
    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      maps[locale] = data;
    } catch {
      maps[locale] = {};
    }
  }
  return maps;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const currentLocale = searchParams.get('currentLocale');
  const productSlugFromQuery = searchParams.get('productSlug');
  const countryCode = searchParams.get('countryCode');

  if (!currentLocale || !productSlugFromQuery) {
    return NextResponse.json({ error: 'Missing currentLocale or productSlug' }, { status: 400 });
  }

  try {
    const slugMaps = await fetchBatchedSlugMaps();
    const normalizedQuerySlug = decodeURIComponent(productSlugFromQuery).toLowerCase().trim();
    // Find productId by matching slug in the current locale
    let productId: string | null = null;
    for (const [id, slug] of Object.entries(slugMaps[currentLocale] || {})) {
      if ((slug || '').toLowerCase().trim() === normalizedQuerySlug) {
        productId = id;
        break;
      }
    }
    if (!productId) {
      return NextResponse.json({ error: 'Product not found for the given slug and locale' }, { status: 404 });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const domain = isProd
      ? process.env.NEXT_PUBLIC_CANONICAL_DOMAIN?.replace(/^https?:\/\//, '')
      : request.headers.get('host');
    const protocol = isProd ? 'https' : 'http';
    const baseUrl = `${protocol}://${domain}`;

    const alternates: Record<string, string> = {};
    for (const altLocale of supportedLocales) {
      const altSlug = slugMaps[altLocale]?.[productId];
      if (altSlug) {
        const localePrefix = countryCode && altLocale === currentLocale ? `${altLocale}-${countryCode}` : altLocale;
        alternates[altLocale] = `${baseUrl}/${localePrefix}/products/${altSlug}`;
      }
    }
    if (alternates[defaultLocale]) {
      alternates['x-default'] = alternates[defaultLocale];
    } else if (alternates[currentLocale]) {
      alternates['x-default'] = alternates[currentLocale];
    }
    return NextResponse.json(alternates);
  } catch (error) {
    console.error('Failed to fetch product alternates:', error);
    return NextResponse.json({ error: 'Internal server error fetching product alternates', details: (error as Error).message }, { status: 500 });
  }
} 