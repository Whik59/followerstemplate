import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'path';
import { ReviewTranslations } from '@/types'; // Assuming ReviewTranslations is correctly typed

async function readReviewFile(locale: string): Promise<ReviewTranslations | null> {
  const filePath = path.join(process.cwd(), 'locales', locale, 'reviews.json');
  console.log(`[API /reviews] Attempting to read: ${filePath}`); // DEBUG LOG
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    console.log(`[API /reviews] Successfully read file for locale ${locale}. Attempting to parse...`); // DEBUG LOG
    const parsedJson = JSON.parse(fileContents) as ReviewTranslations;
    console.log(`[API /reviews] Successfully parsed JSON for locale ${locale}.`); // DEBUG LOG
    return parsedJson;
  } catch (error: unknown) { // Added :any to error for accessing message property
    console.error(`[API /reviews] Error processing file for locale ${locale}: ${filePath}. Error: ${error}`, error); // ENHANCED DEBUG LOG
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { locale: string } }
) {
  const locale = params.locale;
  console.log(`[API /reviews] GET request for locale: ${locale}`); // DEBUG LOG

  if (!locale) {
    console.error('[API /reviews] Locale parameter is missing'); // DEBUG LOG
    return NextResponse.json({ error: 'Locale parameter is missing' }, { status: 400 });
  }

  let translations = await readReviewFile(locale);

  if (!translations) {
    console.warn(`[API /reviews] Translations not found for locale ${locale}, attempting fallback to 'en'.`); // DEBUG LOG
    if (locale !== 'en') {
      translations = await readReviewFile('en');
    }
  }

  if (!translations) {
    console.error(`[API /reviews] Review translations not found for locale '${locale}' and fallback 'en' also failed.`); // DEBUG LOG
    return NextResponse.json({ error: `Review translations not found for locale '${locale}' and fallback 'en' also failed.` }, { status: 404 });
  }

  console.log(`[API /reviews] Successfully returning translations for locale: ${locale}`); // DEBUG LOG
  return NextResponse.json(translations);
} 