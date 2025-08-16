import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Params {
  locale: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const { locale } = params;
  const normalizedLocale = locale.split('-')[0];
  const filePath = path.join(process.cwd(), 'data/batched-product-translations', `${normalizedLocale}.json`);

  try {
    const file = await fs.readFile(filePath, 'utf8');
    const translations = JSON.parse(file);
    return NextResponse.json(translations);
  } catch (error) {
    return NextResponse.json({}, { status: 200 }); // Return empty object if not found
  }
} 