import { countryCurrencyMap, exchangeRates, type CurrencyInfo } from '@/types/currency';

/**
 * Converts a price from USD to the target currency based on the country code.
 * @param priceInUSD The price in US dollars.
 * @param countryCode The two-letter ISO country code (e.g., 'MX', 'FR').
 * @returns The converted price and currency information, or null if not found.
 */
export function convertPrice(
  priceInUSD: number,
  countryCode: string
): { convertedPrice: number; currency: CurrencyInfo } | null {
  const upperCountryCode = countryCode.toUpperCase();
  const targetCurrencyInfo = countryCurrencyMap[upperCountryCode];

  if (!targetCurrencyInfo) {
    const usdInfo = countryCurrencyMap['US'];
    if (!usdInfo) {
      return null;
    }
    return {
      convertedPrice: priceInUSD,
      currency: usdInfo,
    };
  }

  const rate = exchangeRates[targetCurrencyInfo.code];

  if (rate === undefined) {
    const usdInfo = countryCurrencyMap['US'];
    if (!usdInfo) {
      return null;
    }
    return {
      convertedPrice: priceInUSD,
      currency: usdInfo,
    };
  }

  const convertedPrice = priceInUSD * rate;

  return {
    convertedPrice,
    currency: targetCurrencyInfo,
  };
}

/**
 * Formats a price with the given currency symbol.
 * @param price The numerical price.
 * @param currency The currency information.
 * @returns A string with the formatted price (e.g., "$10.00", "€25.50").
 */
export function formatPrice(
  price: number,
  currency: CurrencyInfo
): string {
  return `${currency.symbol}${price.toFixed(2)}`;
}

/**
 * Retrieves currency information for a given country code.
 * Defaults to USD if the country code is not found or is invalid.
 */
export function getCurrencyForCountry(countryCode: string | undefined): CurrencyInfo {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.trim() === '') {
    console.warn(`[getCurrencyForCountry] Received invalid countryCode: '${countryCode}'. Defaulting to US.`);
    return countryCurrencyMap.US; 
  }
  const upperCaseCountryCode = countryCode.toUpperCase();
  return countryCurrencyMap[upperCaseCountryCode] || countryCurrencyMap.US;
}

// Interface for the new formatCurrency function
interface FormatCurrencyOptions {
  amount: number;
  currencyCode: string; // e.g., 'USD', 'EUR'
  locale: string;       
}

// New formatCurrency function using Intl.NumberFormat
export function formatCurrency({ amount, currencyCode, locale }: FormatCurrencyOptions): string {
  let fullLocale = locale;
  const lang = locale.split('-')[0].toLowerCase();

  if (locale.indexOf('-') === -1) {
    switch (lang) {
      case 'en':
        fullLocale = 'en-US';
        break;
      case 'fr':
        fullLocale = 'fr-FR';
        break;
      case 'es':
        fullLocale = 'es-ES';
        break;
      default:
        fullLocale = locale;
    }
  }

  try {
    return new Intl.NumberFormat(fullLocale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    const fallbackCurrencyInfo = Object.values(countryCurrencyMap).find(c => c.code === currencyCode) || {symbol: currencyCode, code: currencyCode, name: currencyCode};
    return `${fallbackCurrencyInfo.symbol}${amount.toFixed(2)}`;
  }
}

// Re-export exchangeRates so it can be imported elsewhere
export { exchangeRates }; 