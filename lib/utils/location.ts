import { NextRequest } from 'next/server';
import { supportedLocales } from './seo'; // Import supportedLocales
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers'; // More specific type if needed, or use ReturnType

/**
 * Determines the user's country code based on the incoming request.
 * It first checks the URL path for a country code segment (e.g., /fr/, /mx/),
 * then checks platform-specific headers, and finally falls back to IP geolocation.
 *
 * @param request The Next.js request object.
 * @returns A two-letter ISO country code (e.g., 'US', 'MX') or null if undetermined.
 */
export async function getCountryFromRequest(request: NextRequest): Promise<string | null> {
  console.log('[location.ts] --- Starting getCountryFromRequest ---');
  const pathname = request.nextUrl.pathname;
  console.log(`[location.ts] Received pathname: "${pathname}"`);

  // 1. Try to extract country from the first path segment
  const pathSegments = pathname.split('/').filter(Boolean);
  console.log(`[location.ts] Path segments: ${JSON.stringify(pathSegments)}`);

  if (pathSegments.length > 0) {
    const potentialCountryPathSegment = pathSegments[0].toUpperCase();
    console.log(`[location.ts] Potential country path segment: "${potentialCountryPathSegment}"`);
    const matchedLocale = supportedLocales.find(loc => loc.country.toUpperCase() === potentialCountryPathSegment);
    console.log(`[location.ts] Matched locale from path: ${JSON.stringify(matchedLocale)}`);

    if (matchedLocale) {
      console.log(`[location.ts] SUCCESS: Country from path segment: "${matchedLocale.country}"`);
      return matchedLocale.country;
    }
  }

  console.log('[location.ts] Path segment detection did not yield a country. Proceeding to headers/IP...');

  // 2. Check for Vercel-specific header (if deploying on Vercel)
  const vercelIPCountry = request.headers.get('x-vercel-ip-country');
  if (vercelIPCountry) {
    console.log(`[location.ts] SUCCESS: Country from x-vercel-ip-country: "${vercelIPCountry}"`);
    return vercelIPCountry;
  }

  // 3. Check for Cloudflare-specific header (if using Cloudflare)
  const cloudflareIPCountry = request.headers.get('cf-ipcountry');
  if (cloudflareIPCountry) {
    console.log(`[location.ts] SUCCESS: Country from cf-ipcountry: "${cloudflareIPCountry.toUpperCase()}"`);
    return cloudflareIPCountry.toUpperCase();
  }

  // 4. Fallback to a third-party IP geolocation API (example)
  try {
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    console.log('[location.ts] Attempting IP API fallback. Detected IP (for API fallback): ', ip);

    if (ip && ip !== '::1' && ip !== '127.0.0.1') { // Avoid API calls for localhost
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[location.ts] IP Geolocation API request failed: ${response.status} ${errorText}`);
      } else {
        const data = await response.json();
        if (data.countryCode) {
          console.log(`[location.ts] SUCCESS: Country from ip-api.com: "${data.countryCode}"`);
          return data.countryCode;
        }
        console.log('[location.ts] IP API response did not contain countryCode.');
      }
    }
  } catch (error) {
    console.error('[location.ts] Error fetching IP geolocation:', error);
  }

  // 5. If all else fails, return a default or null
  console.warn('[location.ts] FALLBACK: Could not determine country. Defaulting to US.');
  return 'US';
}

/**
 * Determines the user's country code based on headers or IP geolocation for currency purposes.
 * Suitable for use in Server Actions/Components where full NextRequest might not be available.
 *
 * @param headerList The Next.js headers object.
 * @returns A two-letter ISO country code (e.g., 'US', 'MX') or null if undetermined.
 */
export async function getCountryForCurrency(headerList: ReadonlyHeaders): Promise<string | null> {
  console.log('[location.ts] --- Starting getCountryForCurrency ---');

  // 1. Check for Vercel-specific header
  const vercelIPCountry = headerList.get('x-vercel-ip-country');
  if (vercelIPCountry) {
    console.log(`[location.ts] SUCCESS (getCountryForCurrency): Country from x-vercel-ip-country: "${vercelIPCountry}"`);
    return vercelIPCountry;
  }

  // 2. Check for Cloudflare-specific header
  const cloudflareIPCountry = headerList.get('cf-ipcountry');
  if (cloudflareIPCountry) {
    console.log(`[location.ts] SUCCESS (getCountryForCurrency): Country from cf-ipcountry: "${cloudflareIPCountry.toUpperCase()}"`);
    return cloudflareIPCountry.toUpperCase();
  }

  // 3. Fallback to a third-party IP geolocation API
  // Note: request.ip is not directly available here. If x-forwarded-for is reliable, use it.
  const ip = headerList.get('x-forwarded-for')?.split(',')[0].trim();
  console.log('[location.ts] Attempting IP API fallback (getCountryForCurrency). Detected IP: ', ip);

  if (ip && ip !== '::1' && ip !== '127.0.0.1') { 
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[location.ts] IP Geolocation API request failed (getCountryForCurrency): ${response.status} ${errorText}`);
      } else {
        const data = await response.json();
        if (data.countryCode) {
          console.log(`[location.ts] SUCCESS (getCountryForCurrency): Country from ip-api.com: "${data.countryCode}"`);
          return data.countryCode;
        }
        console.log('[location.ts] IP API response did not contain countryCode (getCountryForCurrency).');
      }
    } catch (error) {
      console.error('[location.ts] Error fetching IP geolocation (getCountryForCurrency):', error);
    }
  }

  // 4. If all else fails, return null (so the caller can decide a fallback strategy, e.g., based on locale)
  console.warn('[location.ts] FALLBACK (getCountryForCurrency): Could not determine country from headers/IP. Returning null.');
  return null;
} 