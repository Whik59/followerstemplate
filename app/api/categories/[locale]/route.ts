import { NextResponse } from 'next/server';
import { getHierarchicalCategoryData, ProcessedCategoryData } from '@/lib/utils/categories';

interface Params {
  locale: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const { locale } = params;

  if (!locale) {
    return NextResponse.json({ error: 'Locale parameter is missing' }, { status: 400 });
  }

  try {
    // We assume getHierarchicalCategoryData can now be called directly
    // if it's ensured to run only on the server (which API routes do).
    // If 'fs' issues persist, we'd need to move fs-dependent parts here
    // or ensure lib/utils/categories.ts is marked with "use server"
    // if ALL its exports are server-only.
    const categoryTree: ProcessedCategoryData[] = await getHierarchicalCategoryData(locale);
    console.log(`Category tree for locale ${locale}:`, JSON.stringify(categoryTree, null, 2));
    return NextResponse.json(categoryTree);
  } catch (error) {
    console.error(`Failed to fetch category tree for locale ${locale}:`, error);
    return NextResponse.json({ error: 'Failed to fetch category data', details: (error as Error).message }, { status: 500 });
  }
} 