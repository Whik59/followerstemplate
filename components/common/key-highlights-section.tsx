import { keyHighlightsMetadata } from '@/lib/data/key-highlights-metadata';
import { HighlightItem } from '@/components/common/highlight-item';
import { KeyHighlightsTranslations } from '@/types';
import fs from 'fs';
import path from 'path';

// Helper function to load translations - adapt to your i18n setup
async function getKeyHighlightTranslations(locale: string): Promise<KeyHighlightsTranslations> {
  const filePath = path.join(process.cwd(), `public/locales/${locale}/key-highlights.json`);
  try {
    const fileContents = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as KeyHighlightsTranslations;
  } catch (error) {
    console.error(`Error loading key-highlights translations for locale ${locale}:`, error);
    // Fallback to English if a locale is not found or if the current locale is not 'en' or 'fr' or 'es'
    if (locale !== 'en') {
      const fallbackFilePath = path.join(process.cwd(), 'public/locales/en/key-highlights.json');
      const fallbackFileContents = await fs.promises.readFile(fallbackFilePath, 'utf8');
      return JSON.parse(fallbackFileContents) as KeyHighlightsTranslations;
    }
    throw new Error('Failed to load key-highlights translations.');
  }
}

interface KeyHighlightsSectionProps {
  locale: string; // e.g., 'en', 'es', 'fr'
}

export async function KeyHighlightsSection({ locale }: KeyHighlightsSectionProps) {
  const translations = await getKeyHighlightTranslations(locale);

  return (
    <section className="py-12 bg-white dark:bg-gray-800 sm:py-16 lg:py-20">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6 lg:gap-x-8">
          {keyHighlightsMetadata.map((item) => (
            <HighlightItem key={item.id} item={item} translations={translations} />
          ))}
        </div>
      </div>
    </section>
  );
} 