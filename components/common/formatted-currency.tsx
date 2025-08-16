import { countryCurrencyMap, exchangeRates, type CurrencyInfo } from '../../types/currency'; // Adjust path as needed
// import { getUserGeoInfo } from '../../lib/utils/geolocation'; // Adjust path as needed for actual usage

interface FormattedCurrencyProps {
  amountInUSD: number;
  userLocale: string; // e.g., 'de-DE', 'fr-FR', 'ja-JP'
  userCountryCode: string; // e.g., 'DE', 'FR', 'JP'
}

function getLocalCurrencyInfo(
  userCountryCode: string,
  currentCountryCurrencyMap: Record<string, CurrencyInfo>
): CurrencyInfo | undefined {
  return currentCountryCurrencyMap[userCountryCode];
}

function convertCurrency(
  amountInUSD: number,
  targetCurrencyCode: string,
  currentExchangeRates: Record<string, number>
): number | undefined {
  const rate = currentExchangeRates[targetCurrencyCode];
  if (rate === undefined) {
    console.warn(`Exchange rate for ${targetCurrencyCode} not found.`);
    return undefined;
  }
  // Assumes exchangeRates store how many units of local currency 1 USD is worth
  return amountInUSD * rate;
}

export function FormattedCurrency({
  amountInUSD,
  userLocale,
  userCountryCode,
}: FormattedCurrencyProps): JSX.Element | string {
  const localCurrencyInfo = getLocalCurrencyInfo(userCountryCode, countryCurrencyMap);

  if (!localCurrencyInfo) {
    console.warn(`Currency info for ${userCountryCode} not found. Displaying in USD.`);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amountInUSD);
    } catch (e) {
      console.error("Error formatting USD (fallback 1):", e);
      return `${amountInUSD.toFixed(2)} USD`;
    }
  }

  const { code: targetCurrencyCode } = localCurrencyInfo;

  const amountInLocalCurrency = convertCurrency(amountInUSD, targetCurrencyCode, exchangeRates);

  if (amountInLocalCurrency === undefined) {
    console.warn(`Could not convert ${amountInUSD} USD to ${targetCurrencyCode}. Displaying in USD.`);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amountInUSD);
    } catch (e) {
      console.error("Error formatting USD (fallback 2):", e);
      return `${amountInUSD.toFixed(2)} USD`;
    }
  }

  try {
    const formatter = new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency: targetCurrencyCode,
    });
    return formatter.format(amountInLocalCurrency);
  } catch (error) {
    console.error(
      `Error formatting currency for locale ${userLocale} and currency ${targetCurrencyCode}:`,
      error
    );
    // Fallback if Intl.NumberFormat fails for the specific locale/currency
    try {
        console.warn(`Falling back to en-US formatting for ${targetCurrencyCode} due to previous error.`);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: targetCurrencyCode,
          }).format(amountInLocalCurrency);
    } catch (finalFallbackError) {
        console.error(`Error in final en-US fallback formatting for ${targetCurrencyCode}:`, finalFallbackError);
        return `${amountInLocalCurrency.toFixed(2)} ${targetCurrencyCode}`;
    }
  }
}

/*
Conceptual Example: How to use the `getUserGeoInfo` utility and the `FormattedCurrency` component.
This part would typically be in your page component or a higher-order component.

// 1. Import the utility function (adjust path as necessary)
// import { getUserGeoInfo } from '../../lib/utils/geolocation';

// 2. Example React Page Component (e.g., pages/product/[id].tsx in Next.js Pages Router)
//
// import { GetServerSideProps } from 'next';
// import { FormattedCurrency } from '../components/common/formatted-currency'; // Adjust path
// import { getUserGeoInfo } from '../../lib/utils/geolocation'; // Adjust path

// interface ProductPageProps {
//   userLocale: string;
//   userCountryCode: string;
//   productPriceUSD: number;
// }

// export default function ProductPage({ userLocale, userCountryCode, productPriceUSD }: ProductPageProps) {
//   return (
//     <div>
//       <h1>Product Details</h1>
//       <p>Price:
//         <FormattedCurrency
//           amountInUSD={productPriceUSD}
//           userLocale={userLocale}
//           userCountryCode={userCountryCode}
//         />
//       </p>
//       <p><small>Prices are displayed based on your region. Locale: {userLocale}, Country: {userCountryCode}</small></p>
//     </div>
//   );
// }

// export const getServerSideProps: GetServerSideProps = async (context) => {
//   // Get user IP/geolocation info from request headers using the utility
//   const { locale, countryCode } = await getUserGeoInfo(context.req.headers);
//   const productPriceUSD = 29.99; // Example price

//   return {
//     props: {
//       userLocale: locale,
//       userCountryCode: countryCode,
//       productPriceUSD,
//     },
//   };
// };

// For Next.js App Router (Example in a Server Component)
//
// import { headers } from 'next/headers';
// import { FormattedCurrency } from '../components/common/formatted-currency'; // Adjust path
// import { getUserGeoInfo } from '../../lib/utils/geolocation'; // Adjust path
//
// export default async function ProductPageAppRouter() {
//   const requestHeaders = headers(); // This gets a Headers object
//   const { locale, countryCode } = await getUserGeoInfo(requestHeaders);
//   const productPriceUSD = 29.99; // Example price

//   return (
//     <div>
//       <h1>Product Details (App Router)</h1>
//       <p>Price:
//         <FormattedCurrency
//           amountInUSD={productPriceUSD}
//           userLocale={locale}
//           userCountryCode={countryCode}
//         />
//       </p>
//       <p><small>Prices displayed based on your region. Locale: {locale}, Country: {countryCode}</small></p>
//     </div>
//   );
// }

*/
