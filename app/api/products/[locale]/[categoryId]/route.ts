import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/utils/products';
import { fetchProductSlugMapForLocale } from '@/lib/api/slug-map';
import fs from 'fs/promises';
import path from 'path';

interface Params {
  locale: string;
  categoryId: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const { locale, categoryId } = params;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '8', 10);

  if (!locale || !categoryId) {
    return NextResponse.json({ error: 'Missing locale or categoryId' }, { status: 400 });
  }

  const categoryIdNum = parseInt(categoryId, 10);
  if (isNaN(categoryIdNum)) {
    return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 });
  }

  try {
    const productResponse = await getAllProducts({ categoryId: categoryIdNum, limit });
    const productSlugMap = await fetchProductSlugMapForLocale(locale);
    const productsWithSlugs = productResponse.products.map(product => ({
      ...product,
      slug: productSlugMap[product.productId] || product.productNameCanonical,
    }));

    // Load translations for these products
    const normalizedLocale = locale.split('-')[0];
    const filePath = path.join(process.cwd(), 'data/batched-product-translations', `${normalizedLocale}.json`);
    let translations = {};
    try {
      const file = await fs.readFile(filePath, 'utf8');
      translations = JSON.parse(file);
    } catch (error) {
      translations = {};
    }

    return NextResponse.json({ products: productsWithSlugs, translations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products', details: (error as Error).message }, { status: 500 });
  }
} 