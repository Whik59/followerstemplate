import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
// import { Globe } from 'lucide-react'; // Assuming you might want an icon, adjust as needed
import Image from 'next/image'; // ADDED: Import Next.js Image component
import getConfig from 'next/config';

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'Common' });
  const tCommon = await getTranslations({ locale, namespace: 'Common' });
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Your Awesome Shop';
  const currentYear = new Date().getFullYear();
  const partners: string[] = [];
  for (const key in process.env) {
    if (key.startsWith('PARTNER_')) {
      partners.push(process.env[key]!);
    }
  }

  return (
    <footer className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-3">
              <Image src="/logo.webp" alt={`${siteName} logo`} width={28} height={28} className="h-7 w-7 mr-2" />
              <h3 className="text-2xl font-extrabold text-black tracking-tight font-sans" style={{letterSpacing: '-0.03em'}}>
                {siteName}
              </h3>
            </div>
            <p className={"text-sm"}>
              {tCommon('footerTagline')}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              {t('legalLinks')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/legal/legal-mentions`} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{t('legalMentions')}</Link></li>
              <li><Link href={`/${locale}/legal/shipping-returns`} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{t('shippingReturns')}</Link></li>
              <li><Link href={`/${locale}/legal/secure-payment`} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{t('securePayment')}</Link></li>
              <li><Link href={`/${locale}/legal/privacy-policy`} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{t('privacyPolicy')}</Link></li>
              <li><Link href={`/${locale}/legal/refund-policy`} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{t('refundPolicy')}</Link></li>
              <li><Link href={`/${locale}/legal/terms-conditions`} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{t('termsConditions')}</Link></li>
            </ul>
          </div>
          <div>
            {/* Placeholder for other links or newsletter sign-up if needed in future */}
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              {t('connect')}
            </h3>
            {/* Example: Add social media links or contact info here */}
            <p className="text-sm">{t('connectHint')}</p>
          </div>
          {partners.length > 0 && (
            <div className="md:col-span-3 mt-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                {t('ourPartners')}
              </h3>
              <ul className="flex flex-wrap gap-3 justify-center">
                {partners.map((domain) => (
                  <li key={domain}>
                    <a
                      href={`https://${domain}/${locale}`}
                      className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors underline"
                      rel="noopener"
                      target="_blank"
                    >
                      {domain}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="border-t border-slate-300 dark:border-slate-600 pt-8 text-center text-sm">
          <p>
            &copy; {currentYear} {siteName}. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
} 