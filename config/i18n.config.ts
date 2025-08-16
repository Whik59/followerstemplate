const appLocalesEnv = process.env.APP_LOCALES;
const defaultLocales = ['de'];

export const locales = appLocalesEnv 
    ? appLocalesEnv.split(',').map(locale => locale.trim()) 
    : defaultLocales;

export type Locale = typeof locales[number];

export const defaultLocale = process.env.DEFAULT_LOCALE || 'en';

// Example of how you might want to structure pathnames if they are consistent
// export const pathnames = {
//   '/': '/',
//   '/pathnames': {
//     en: '/pathnames',
//     de: '/pfadnamen',
//   },
// };

// Use the default: `always`
export const localePrefix = undefined;

// export type AppPathnames = keyof typeof pathnames; 