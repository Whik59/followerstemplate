import { getTranslations } from 'next-intl/server';
import { Users, Globe2, Package, Calendar } from 'lucide-react';

interface FeaturesStripProps {
  locale: string;
}

export async function FeaturesStrip({ locale }: FeaturesStripProps) {
  const t = await getTranslations({ locale, namespace: 'Common' });

  return (
    <div className="container mx-auto px-4 md:px-8 bg-amber-50 dark:bg-amber-900 py-6 rounded-lg shadow-md">
      <div className="grid grid-cols-2 sm:grid-cols-4 items-center gap-4 text-center">
        <div className="flex flex-col items-center">
          <Users className="w-10 h-10 md:w-12 md:h-12 mb-1 md:mb-2 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-md md:text-lg text-amber-800 dark:text-amber-100">{t('featureSatisfiedCustomers', {defaultValue: '+2500 clients satisfaits'})}</h3>
        </div>
        <div className="flex flex-col items-center">
          <Globe2 className="w-10 h-10 md:w-12 md:h-12 mb-1 md:mb-2 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-md md:text-lg text-amber-800 dark:text-amber-100">{t('featureInternationalShipping', {defaultValue: 'Livraison internationale'})}</h3>
        </div>
        <div className="flex flex-col items-center">
          <Package className="w-10 h-10 md:w-12 md:h-12 mb-1 md:mb-2 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-md md:text-lg text-amber-800 dark:text-amber-100">{t('featureTenKDeliveries', {defaultValue: '+10 000 livraisons'})}</h3>
        </div>
        <div className="flex flex-col items-center">
          <Calendar className="w-10 h-10 md:w-12 md:h-12 mb-1 md:mb-2 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-md md:text-lg text-amber-800 dark:text-amber-100">{t('featureFiveYearsExperience', {defaultValue: '+5 ans d\'expérience'})}</h3>
        </div>
      </div>
    </div>
  );
} 