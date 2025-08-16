// import { ReadonlyURLSearchParams } from 'next/navigation';
import { defaultLocale } from '@/config/i18n.config'; // Import defaultLocale

export interface SupportedLocale {
  lang: string;
  country: string;
  hrefLang: string; 
}

// Define the locales your site supports
// This should align with your content strategy
export const supportedLocales: SupportedLocale[] = [
  { lang: 'es', country: 'ES', hrefLang: 'es' },
  { lang: 'en', country: 'US', hrefLang: 'en' },
  { lang: 'de', country: 'DE', hrefLang: 'de' },
  { lang: 'fr', country: 'FR', hrefLang: 'fr' },
  { lang: 'pt', country: 'PT', hrefLang: 'pt' },
  { lang: 'ar', country: 'DZ', hrefLang: 'ar' },
  { lang: 'ja', country: 'JP', hrefLang: 'ja' },
  { lang: 'ko', country: 'KR', hrefLang: 'ko' },
  { lang: 'ru', country: 'RU', hrefLang: 'ru' },
  { lang: 'it', country: 'IT', hrefLang: 'it' },
  { lang: 'pl', country: 'PL', hrefLang: 'pl' },
  { lang: 'nl', country: 'NL', hrefLang: 'nl' },
  { lang: 'tr', country: 'TR', hrefLang: 'tr' },
  { lang: 'vi', country: 'VN', hrefLang: 'vi' },
  { lang: 'sv', country: 'SE', hrefLang: 'sv' },
  { lang: 'da', country: 'DK', hrefLang: 'da' },
  { lang: 'no', country: 'NO', hrefLang: 'no' },
  { lang: 'fi', country: 'FI', hrefLang: 'fi' },
  { lang: 'id', country: 'ID', hrefLang: 'id' },
  { lang: 'th', country: 'TH', hrefLang: 'th' },
  { lang: 'uk', country: 'UA', hrefLang: 'uk' },
  { lang: 'cs', country: 'CZ', hrefLang: 'cs' },
  { lang: 'hu', country: 'HU', hrefLang: 'hu' },
  { lang: 'ro', country: 'RO', hrefLang: 'ro' },
  { lang: 'bg', country: 'BG', hrefLang: 'bg' },
  { lang: 'he', country: 'IL', hrefLang: 'he' },
  { lang: 'el', country: 'GR', hrefLang: 'el' },
  { lang: 'sr', country: 'RS', hrefLang: 'sr' },
  { lang: 'sk', country: 'SK', hrefLang: 'sk' },
  { lang: 'sl', country: 'SI', hrefLang: 'sl' },
  { lang: 'hr', country: 'HR', hrefLang: 'hr' },
  { lang: 'ms', country: 'MY', hrefLang: 'ms' },
  { lang: 'zh', country: 'CN', hrefLang: 'zh' },
];

/**
 * Generates hreflang link objects for Next.js metadata.
 * Assumes URL structure like: ${baseUrl}/${langCode}/${unlocalizedPathname}
 *
 * @param baseUrl The base URL of the site (e.g., https://www.example.com).
 * @param unlocalizedPathname The current pathname of the request, without the locale prefix (e.g., /products/widget).
 * @returns An object suitable for Next.js metadata.alternates.languages.
 */
export function generateHreflangLinks(
  baseUrl: string,
  unlocalizedPathname: string
): Record<string, string> {
  const links: Record<string, string> = {};

  // Ensure unlocalizedPathname starts with a slash if it's not empty or just "/"
  const normalizedPathname = unlocalizedPathname === '/' || unlocalizedPathname === '' ? '' : (unlocalizedPathname.startsWith('/') ? unlocalizedPathname : `/${unlocalizedPathname}`);

  supportedLocales.forEach(localeConfig => {
    // Use localeConfig.lang (e.g., 'fr', 'en') for the path segment.
    // This assumes localeConfig.lang is one of the locales defined for path prefixing (e.g., in i18n.config.ts).
    links[localeConfig.hrefLang] = `${baseUrl}/${localeConfig.lang}${normalizedPathname}`;
  });

  // x-default: specifies the default version for users whose language/region doesn't match any other hreflang tag.
  // Points to the primary language version (using defaultLocale from i18n config).
  links['x-default'] = `${baseUrl}/${defaultLocale}${normalizedPathname}`;

  return links;
}

// Example of how you might get the base URL in a server component or middleware
export function getBaseUrl(headers: Headers): string {
  const host = headers.get('x-forwarded-host') || headers.get('host');
  const protocol = headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
} 