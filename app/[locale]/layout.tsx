import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import { NextIntlClientProvider, useMessages } from 'next-intl'; // useMessages moved, NextIntlClientProvider in new component
import "../../styles/globals.css";
import { Footer } from '@/components/common/footer';
import { LocalizedNavDataProvider } from '@/components/common/localized-nav-data-provider';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { CartProvider } from '@/context/cart-context';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ui/theme-provider";
import nextDynamic from 'next/dynamic';
import NextTopLoader from 'nextjs-toploader';
import { FaqChat } from '@/components/common/faq-chat';
import { UIProvider } from '@/context/ui-context';
import { headers } from 'next/headers';
import { getUserGeoInfo } from '@/lib/utils/geolocation';
import { IntlProviderSetup } from '@/components/common/intl-provider-setup';
import { ProductStickyBar } from '@/components/common/product-sticky-bar'; // Import the new component

import { locales } from "@/config/i18n.config";

// Dynamically import CartDrawer
const CartDrawer = nextDynamic(() => 
  import('@/components/common/cart-drawer').then(mod => mod.CartDrawer), 
  { 
    ssr: false, // CartDrawer is client-side, no need for SSR
    // You could add a simple loading indicator if needed, 
    // but for a drawer, it might be fine to just not render until ready.
    // loading: () => <p>Loading cart...</p> 
  }
);

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"] // Ensure all used weights are included
});

const defaultLocale = 'en';
const canonicalDomain = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || "YOUR_FALLBACK_DOMAIN.COM";
const siteNameFromEnv = process.env.NEXT_PUBLIC_SITE_NAME || "ElectroMart";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Common' });

  const alternates: Record<string, string> = {};
  locales.forEach(altLocale => {
    alternates[altLocale] = `${canonicalDomain}/${altLocale}`;
  });
  alternates['x-default'] = `${canonicalDomain}/${defaultLocale}`;

  return {
    metadataBase: new URL(canonicalDomain),
    title: {
      default: t('siteName', {siteNameFromEnv}),
      template: `%s | ${t('siteName', {siteNameFromEnv})}`,
    },
    description: t('siteDescription', {siteNameFromEnv}),
    alternates: {
      canonical: `${canonicalDomain}/${locale}`,
      languages: alternates,
    },
    openGraph: {
      title: t('siteName', {siteNameFromEnv}),
      description: t('siteDescription', {siteNameFromEnv}),
      url: `${canonicalDomain}/${locale}`,
      siteName: t('siteName', {siteNameFromEnv}),
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('siteName', {siteNameFromEnv}),
      description: t('siteDescription', {siteNameFromEnv}),
    },
  };
}

export default async function RootLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  unstable_setRequestLocale(locale);
  // if (!locales.includes(locale)) {
  //   notFound(); 
  // }

  // const messages = useMessages(); // Moved to IntlProviderSetup
  const headersList = headers(); 
  const { countryCode: geoCountryCode, locale: formattingLocale } = await getUserGeoInfo(headersList); 

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Favicon links */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
        {/* <link rel="manifest" href="/favicons/site.webmanifest" /> */}
        <link rel="icon" href="/favicons/favicon.ico" sizes="any" /> 
        <link rel="icon" type="image/png" sizes="192x192" href="/favicons/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicons/android-chrome-512x512.png" />

        {/* Preload custom fonts (if any) - REPLACE WITH YOUR ACTUAL FONT FILES */}
        {/* Example for a regular weight font */}
        {/* <link rel="preload" href="/fonts/MyCustomFont-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /> */}
        {/* Example for a bold weight font */}
        {/* <link rel="preload" href="/fonts/MyCustomFont-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /> */}

        {/* Other head elements like meta tags for SEO are handled by generateMetadata */}
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)} suppressHydrationWarning>
        <IntlProviderSetup locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <CartProvider geoCountryCode={geoCountryCode} formattingLocale={formattingLocale}>
              <UIProvider>
                <NextTopLoader color="#f59e0b" showSpinner={false} />
                <LocalizedNavDataProvider />
                <main className="flex-1">{children}</main>
                <Footer locale={locale} />
                <Toaster />
                <CartDrawer />
                <FaqChat whatsappNumber={whatsappNumber} />
                <ProductStickyBar />
              </UIProvider>
            </CartProvider>
          </ThemeProvider>
        </IntlProviderSetup>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
} 