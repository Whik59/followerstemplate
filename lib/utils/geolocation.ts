// NOTE: This map needs to be comprehensive based on the languages you support (provided list)
// and the most likely country codes Vercel will provide for those language regions.
// It should align with the country codes present in types/currency.ts countryCurrencyMap.
const countryToLocaleMap: Record<string, string> = {
  // Africa
  DZ: 'ar', // Algeria - Arabic
  MA: 'ar', // Morocco - Arabic
  ZW: 'en', // Zimbabwe - English
  EG: 'ar', // Egypt - Arabic
  GQ: 'es', // Equatorial Guinea - Spanish
  GH: 'en', // Ghana - English
  NG: 'en', // Nigeria - English
  KE: 'sw', // Kenya - Swahili (not in supported, fallback to 'en' if needed)
  ZA: 'en', // South Africa - English
  ZM: 'en', // Zambia - English
  TZ: 'sw', // Tanzania - Swahili (not in supported, fallback to 'en' if needed)
  NE: 'fr', // Niger - French
  // Americas
  CU: 'es', // Cuba - Spanish
  HT: 'fr', // Haiti - French
  AU: 'en', // Australia - English
  BZ: 'en', // Belize - English
  BO: 'es', // Bolivia - Spanish
  BR: 'pt', // Brazil - Portuguese
  CA: 'en', // Canada - English
  CL: 'es', // Chile - Spanish
  CO: 'es', // Colombia - Spanish
  CR: 'es', // Costa Rica - Spanish
  DO: 'es', // Dominican Republic - Spanish
  EC: 'es', // Ecuador - Spanish
  SV: 'es', // El Salvador - Spanish
  GT: 'es', // Guatemala - Spanish
  JM: 'en', // Jamaica - English
  MX: 'es', // Mexico - Spanish
  NI: 'es', // Nicaragua - Spanish
  PA: 'es', // Panama - Spanish
  PE: 'es', // Peru - Spanish
  PR: 'es', // Puerto Rico - Spanish
  TT: 'en', // Trinidad and Tobago - English
  US: 'en', // United States - English
  UY: 'es', // Uruguay - Spanish
  SR: 'nl', // Suriname - Dutch
  // Asia
  AZ: 'az', // Azerbaijan - Azerbaijani (not in supported, fallback to 'en' if needed)
  CN: 'zh', // China - Chinese
  GE: 'ka', // Georgia - Georgian (not in supported, fallback to 'en' if needed)
  ID: 'id', // Indonesia - Indonesian
  IL: 'he', // Israel - Hebrew
  JP: 'ja', // Japan - Japanese
  JO: 'ar', // Jordan - Arabic
  KZ: 'kk', // Kazakhstan - Kazakh (not in supported, fallback to 'ru' or 'en' if needed)
  KR: 'ko', // South Korea - Korean
  KW: 'ar', // Kuwait - Arabic
  MY: 'ms', // Malaysia - Malay
  OM: 'ar', // Oman - Arabic
  PH: 'tl', // Philippines - Tagalog (not in supported, fallback to 'en' if needed)
  QA: 'ar', // Qatar - Arabic
  RU: 'ru', // Russia - Russian
  SA: 'ar', // Saudi Arabia - Arabic
  SG: 'en', // Singapore - English
  TW: 'zh', // Taiwan - Chinese
  TH: 'th', // Thailand - Thai
  TR: 'tr', // Turkey - Turkish
  AE: 'ar', // UAE - Arabic
  VN: 'vi', // Vietnam - Vietnamese
  UZ: 'uz', // Uzbekistan - Uzbek (not in supported, fallback to 'ru' or 'en' if needed)
  HK: 'zh', // Hong Kong - Chinese
  // Europe
  AL: 'sq', // Albania - Albanian (not in supported, fallback to 'en' if needed)
  AD: 'ca', // Andorra - Catalan (not in supported, fallback to 'es' or 'fr' if needed)
  AT: 'de', // Austria - German
  BA: 'bs', // Bosnia and Herzegovina - Bosnian (not in supported, fallback to 'hr' or 'sr' if needed)
  BE: 'nl', // Belgium - Dutch
  BG: 'bg', // Bulgaria - Bulgarian
  HR: 'hr', // Croatia - Croatian
  CY: 'el', // Cyprus - Greek
  CZ: 'cs', // Czech Republic - Czech
  DK: 'da', // Denmark - Danish
  EE: 'et', // Estonia - Estonian (not in supported, fallback to 'en' if needed)
  FI: 'fi', // Finland - Finnish
  FR: 'fr', // France - French
  DE: 'de', // Germany - German
  GR: 'el', // Greece - Greek
  HU: 'hu', // Hungary - Hungarian
  IE: 'en', // Ireland - English
  IT: 'it', // Italy - Italian
  XK: 'sq', // Kosovo - Albanian (not in supported, fallback to 'sr' if needed)
  LV: 'lv', // Latvia - Latvian (not in supported, fallback to 'en' if needed)
  LT: 'lt', // Lithuania - Lithuanian (not in supported, fallback to 'en' if needed)
  LU: 'fr', // Luxembourg - French
  MT: 'mt', // Malta - Maltese (not in supported, fallback to 'en' if needed)
  ME: 'sr', // Montenegro - Serbian
  NL: 'nl', // Netherlands - Dutch
  NO: 'no', // Norway - Norwegian
  PL: 'pl', // Poland - Polish
  PT: 'pt', // Portugal - Portuguese
  RO: 'ro', // Romania - Romanian
  RS: 'sr', // Serbia - Serbian
  SK: 'sk', // Slovakia - Slovak
  SI: 'sl', // Slovenia - Slovenian
  ES: 'es', // Spain - Spanish
  SE: 'sv', // Sweden - Swedish
  CH: 'de', // Switzerland - German (could also be 'fr', 'it')
  UA: 'uk', // Ukraine - Ukrainian
  GB: 'en', // United Kingdom - English
  MK: 'mk', // North Macedonia - Macedonian (not in supported, fallback to 'en' if needed)
  // Oceania
  FJ: 'en', // Fiji - English
  NZ: 'en', // New Zealand - English
  // Fallback/Default
  DEFAULT: 'en', // Fallback to English if no match
};

export async function getUserGeoInfo(
  requestHeaders: Headers | { [key: string]: string | string[] | undefined }
): Promise<{ locale: string; countryCode: string }> {
  // console.log('[getUserGeoInfo] Received requestHeaders:', requestHeaders); // Problematic line
  let vercelCountryCode: string | undefined = undefined;

  if (typeof (requestHeaders as Headers).get === 'function') {
    vercelCountryCode = (requestHeaders as Headers).get('x-vercel-ip-country')?.toUpperCase();
    console.log('[getUserGeoInfo] x-vercel-ip-country from Headers object:', vercelCountryCode);
  } else if (requestHeaders && typeof requestHeaders === 'object' && 'x-vercel-ip-country' in requestHeaders) {
    const headerValue = requestHeaders['x-vercel-ip-country'];
    vercelCountryCode = (Array.isArray(headerValue) ? headerValue[0] : headerValue)?.toUpperCase();
    console.log('[getUserGeoInfo] x-vercel-ip-country from plain object:', vercelCountryCode);
  } else {
    console.log('[getUserGeoInfo] x-vercel-ip-country header not found or requestHeaders type is unexpected.');
  }

  const country = vercelCountryCode || process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || 'US';
  console.log('[getUserGeoInfo] Detected country code (uppercased):', country);

  let finalLocale = 'en-US'; // Default to US English
  let finalCountryCode = 'US'; // Default to US country code

  if (country && countryToLocaleMap[country]) {
    finalLocale = countryToLocaleMap[country];
    finalCountryCode = country;
    console.log(`[getUserGeoInfo] Mapped to: locale=${finalLocale}, countryCode=${finalCountryCode}`);
  } else if (country) {
    console.warn(`[getUserGeoInfo] Locale for country ${country} not in specific map. Attempting generic en-[CC] locale.`);
    finalCountryCode = country;
    const genericLocale = `en-${country}`;
    try {
      new Intl.NumberFormat(genericLocale); // Test if the generic locale is valid
      finalLocale = genericLocale;
      console.log(`[getUserGeoInfo] Using generic locale: ${finalLocale}`);
    } catch (e) {
      console.warn(`[getUserGeoInfo] Generic locale ${genericLocale} is invalid. Defaulting to en-US.`);
      finalLocale = countryToLocaleMap.DEFAULT || 'en-US'; // Fallback to default or en-US
    }
  } else {
    console.warn("[getUserGeoInfo] No country code detected or requestHeaders malformed. Defaulting...");
    finalLocale = countryToLocaleMap.DEFAULT || 'en-US'; 
    // finalCountryCode remains 'US' or you could set it to undefined/empty
  }
  console.log(`[getUserGeoInfo] Returning: locale=${finalLocale}, countryCode=${finalCountryCode}`);
  return { locale: finalLocale, countryCode: finalCountryCode };
} 