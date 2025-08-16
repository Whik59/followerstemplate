export interface CurrencyInfo {
  code: string; // e.g., USD, EUR, 
  symbol: string; // e.g., $, €, Mex$
  name: string; // e.g., US Dollar, Euro, Mexican Peso
}

export const countryCurrencyMap: Record<string, CurrencyInfo> = {
  DZ: { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar' },
  CU: { code: 'USD', symbol: '$', name: 'US Dollar' },
  HT: { code: 'USD', symbol: '$', name: 'US Dollar' },
  MA: { code: 'USD', symbol: '$', name: 'US Dollar' },
  ZW: { code: 'USD', symbol: '$', name: 'US Dollar' },
  AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  AT: { code: 'EUR', symbol: '€', name: 'Euro' },
  AZ: { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
  BH: { code: 'USD', symbol: '$', name: 'US Dollar' },
  BE: { code: 'EUR', symbol: '€', name: 'Euro' },
  BZ: { code: 'USD', symbol: '$', name: 'US Dollar' },
  BO: { code: 'BOB', symbol: 'Bs', name: 'Boliviano' },
  BA: { code: 'BAM', symbol: 'KM', name: 'Convertible Mark' },
  BR: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  BG: { code: 'BGN', symbol: 'BGN', name: 'Lev' },
  CA: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  CL: { code: 'CLP', symbol: 'CLP', name: 'Chilean Peso' },
  CN: { code: 'CNY', symbol: '¥', name: 'Yuan' },
  CO: { code: 'COP', symbol: 'COP$', name: 'Colombian Peso' },
  CR: { code: 'CRC', symbol: 'CRC', name: 'Colón' },
  HR: { code: 'EUR', symbol: '€', name: 'Euro' },
  CY: { code: 'EUR', symbol: '€', name: 'Euro' },
  CZ: { code: 'CZK', symbol: 'CZK', name: 'Koruna' },
  DK: { code: 'DKK', symbol: 'DKK', name: 'Krone' },
  DO: { code: 'DOP', symbol: 'DOP', name: 'Dominican Peso' },
  EC: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EG: { code: 'EGP', symbol: 'EGP', name: 'Egyptian Pound' },
  SV: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EE: { code: 'EUR', symbol: '€', name: 'Euro' },
  FI: { code: 'EUR', symbol: '€', name: 'Euro' },
  FR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GE: { code: 'GEL', symbol: '₾', name: 'Lari' },
  DE: { code: 'EUR', symbol: '€', name: 'Euro' },
  GH: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  GR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GT: { code: 'GTQ', symbol: 'Q', name: 'Quetzal' },
  NG: { code: 'NGN', symbol: '₦', name: 'Naira' },
  HU: { code: 'HUF', symbol: 'HUF', name: 'Forint' },
  ID: { code: 'IDR', symbol: 'IDR', name: 'Rupiah' },
  IE: { code: 'EUR', symbol: '€', name: 'Euro' },
  IL: { code: 'ILS', symbol: 'ILS', name: 'Shekel' },
  IT: { code: 'EUR', symbol: '€', name: 'Euro' },
  JM: { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar' },
  JP: { code: 'JPY', symbol: '¥', name: 'Yen' },
  JO: { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar' },
  KZ: { code: 'KZT', symbol: '₸', name: 'Tenge' },
  KE: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  KR: { code: 'KRW', symbol: '₩', name: 'Won' },
  XK: { code: 'EUR', symbol: '€', name: 'Euro' },
  KW: { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
  LV: { code: 'EUR', symbol: '€', name: 'Euro' },
  LT: { code: 'EUR', symbol: '€', name: 'Euro' },
  LU: { code: 'EUR', symbol: '€', name: 'Euro' },
  MY: { code: 'MYR', symbol: 'MYR', name: 'Ringgit' },
  MT: { code: 'EUR', symbol: '€', name: 'Euro' },
  MX: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  ME: { code: 'EUR', symbol: '€', name: 'Euro' },
  NL: { code: 'EUR', symbol: '€', name: 'Euro' },
  NZ: { code: 'NZD', symbol: 'NZD', name: 'New Zealand Dollar' },
  NI: { code: 'USD', symbol: '$', name: 'US Dollar' },
  NO: { code: 'NOK', symbol: 'NOK', name: 'Krone' },
  OM: { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
  PA: { code: 'USD', symbol: '$', name: 'US Dollar' },
  PE: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
  PH: { code: 'PHP', symbol: 'PHP', name: 'Peso' },
  PL: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  PT: { code: 'EUR', symbol: '€', name: 'Euro' },
  PR: { code: 'USD', symbol: '$', name: 'US Dollar' },
  QA: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
  RO: { code: 'RON', symbol: 'RON', name: 'Romanian Leu' },
  RU: { code: 'RUB', symbol: 'RUB', name: 'Rubles' },
  SA: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  RS: { code: 'RSD', symbol: 'RSD', name: 'Dinar' },
  SG: { code: 'SGD', symbol: 'SGD', name: 'Singapore Dollar' },
  SK: { code: 'EUR', symbol: '€', name: 'Euro' },
  SI: { code: 'EUR', symbol: '€', name: 'Euro' },
  ZA: { code: 'ZAR', symbol: 'ZAR', name: 'Rand' },
  ES: { code: 'EUR', symbol: '€', name: 'Euro' },
  SE: { code: 'SEK', symbol: 'SEK', name: 'Krona' },
  CH: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  TW: { code: 'TWD', symbol: 'TWD', name: 'New Taiwan Dollar' },
  TH: { code: 'THB', symbol: 'THB', name: 'Baht' },
  TR: { code: 'TRY', symbol: 'TRY', name: 'Lira' },
  UA: { code: 'UAH', symbol: 'UAH', name: 'Hryvnia' },
  AE: { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  GB: { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
  US: { code: 'USD', symbol: '$', name: 'US Dollar' },
  UY: { code: 'UYU', symbol: 'UYU', name: 'Uruguayan Peso' },
  VN: { code: 'VND', symbol: 'VND', name: 'Dong' },
  ZM: { code: 'ZMW', symbol: 'ZMW', name: 'Zambian Kwacha' },
  AD: { code: 'EUR', symbol: '€', name: 'Euro' },
  AL: { code: 'ALL', symbol: 'ALL', name: 'Lek' },
  FJ: { code: 'FJD', symbol: 'FJD', name: 'Fijian Dollar' },
  NE: { code: 'USD', symbol: '$', name: 'US Dollar' },
  HK: { code: 'HKD', symbol: 'HKD', name: 'Hong Kong Dollar' },
  MK: { code: 'MKD', symbol: 'ден', name: 'Denar' },
  SR: { code: 'SRD', symbol: 'SRD', name: 'Surinamese Dollar' },
  TZ: { code: 'TZS', symbol: 'TZS', name: 'Tanzanian Shilling' },
  UZ: { code: 'UZS', symbol: 'soʻm', name: 'Uzbekistani Som' },
};

// Placeholder for exchange rates - integrate with a real API
export const exchangeRates: Record<string, number> = {
  USD: 1, // Base currency
  AED: 3.70, // United Arab Emirates Dirham
  ALL: 90.91, // Albanian Lek
  AUD: 1.52, // Australian Dollar
  AZN: 1.69, // Azerbaijani Manat
  BAM: 1.85, // Convertible Mark
  BGN: 1.85, // Bulgarian Lev
  MXN: 20.00, // Mexican Peso
  BOB: 7.14, // Boliviano
  BRL: 5.26, // Brazilian Real
  CAD: 1.37, // Canadian Dollar
  CHF: 0.90, // Swiss Franc
  CLP: 909.09, // Chilean Peso
  CNY: 7.14, // Chinese Yuan
  COP: 3846.15, // Colombian Peso
  CRC: 526.32, // Costa Rican Colón
  CZK: 23.26, // Czech Koruna
  DKK: 7.14, // Danish Krone
  DOP: 58.82, // Dominican Peso
  DZD: 135.14, // Algerian Dinar
  EGP: 47.62, // Egyptian Pound
  EUR: 0.93, // Euro
  FJD: 2.22, // Fijian Dollar
  GBP: 0.79, // British Pound Sterling
  GEL: 2.86, // Georgian Lari
  GHS: 14.93, // Ghanaian Cedi
  GTQ: 7.69, // Guatemalan Quetzal
  HKD: 7.69, // Hong Kong Dollar
  HUF: 357.14, // Hungarian Forint
  IDR: 16129.03, // Indonesian Rupiah
  ILS: 3.70, // Israeli New Sheqel
  JMD: 156.25, // Jamaican Dollar
  JOD: 0.71, // Jordanian Dinar
  JPY: 156.25, // Japanese Yen
  KES: 129.87, // Kenyan Shilling
  KRW: 1388.89, // South Korean Won
  KWD: 0.31, // Kuwaiti Dinar
  KZT: 454.55, // Kazakhstani Tenge
  MKD: 55.56, // Macedonian Denar
  MYR: 4.76, // Malaysian Ringgit
  NGN: 1492.54, // Nigerian Naira
  NOK: 10.64, // Norwegian Krone
  NZD: 1.64, // New Zealand Dollar
  OMR: 0.38, // Omani Rial
  PEN: 3.70, // Peruvian Sol
  PHP: 58.82, // Philippine Peso
  PLN: 4.00, // Polish Złoty
  QAR: 3.70, // Qatari Riyal
  RON: 4.55, // Romanian Leu
  RSD: 108.70, // Serbian Dinar
  RUB: 90.91, // Russian Ruble
  SAR: 3.70, // Saudi Riyal
  SEK: 10.53, // Swedish Krona
  SGD: 1.35, // Singapore Dollar
  SRD: 33.33, // Surinamese Dollar
  THB: 37.04, // Thai Baht
  TRY: 32.26, // Turkish Lira
  TWD: 32.26, // New Taiwan Dollar
  TZS: 2631.58, // Tanzanian Shilling
  UAH: 40.00, // Ukrainian Hryvnia
  UYU: 38.46, // Uruguayan Peso
  UZS: 12658.23, // Uzbekistani Som
  VND: 25641.03, // Vietnamese Dong
  ZAR: 18.87, // South African Rand
  ZMW: 27.03 // Zambian Kwacha
}; 