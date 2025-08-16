import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, localePrefix } from './config/i18n.config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  // pathnames // Add this if you are using pathnames
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de)/:path*']
}; 