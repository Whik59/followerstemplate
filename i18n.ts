import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales} from './config/i18n.config'; // Import locales

// The locale is implicitly available or passed via unstable_setRequestLocale
export default getRequestConfig(async ({locale}) => {
  // console.log(`[i18n.ts - BUILD DEBUG] getRequestConfig called. Received locale: ${locale}`);

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    console.warn(`[i18n.ts - BUILD DEBUG] Invalid locale detected: ${locale}. Calling notFound().`);
    notFound();
  }

  try {
    // console.log(`[i18n.ts] Attempting to import messages for locale: ${locale}`)
    const messages = {
      Common: (await import(`./locales/${locale}/common.json`)).default,
      Reviews: (await import(`./locales/${locale}/reviews.json`)).default,
      smma: (await import(`./locales/${locale}/smma.json`)).default,
     
    };
    // console.log(`[i18n.ts] Successfully imported messages for locale: ${locale}`);
    return {
      locale,
      messages,
    };
  } catch (error) {
    console.error(`[i18n.ts - BUILD DEBUG] Error importing messages for locale: '${locale}'.`, error);
    // If messages for a valid locale are missing, it's a critical error.
    // For example, if `./locales/en/common.json` is missing, it should be fixed.
    // notFound() could be an option here if a specific namespace file is non-critical and missing,
    // but usually, all namespace files for a supported locale should exist.
    // Re-throwing the error will make the build fail, which is often desired for missing critical translation files.
    throw error;
  }
}); 