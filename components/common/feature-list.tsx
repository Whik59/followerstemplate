import { getTranslations } from 'next-intl/server';
import { Rocket, CheckCheck, Target, TrendingUp, ShieldCheck, BadgePercent } from 'lucide-react';
import React from 'react';

interface FeatureListProps {
  locale: string;
}

export async function FeatureList({ locale }: FeatureListProps) {
  const t = await getTranslations({ locale, namespace: 'smma' });

  // Data-driven approach for features
  const features = [
    {
      Icon: Rocket,
      title: t('featureInstantTitle'),
      description: t('featureInstantDesc'),
      color: 'text-red-500',
    },
    {
      Icon: CheckCheck,
      title: t('featureRealTitle'),
      description: t('featureRealDesc'),
      color: 'text-green-500',
    },
    {
      Icon: Target,
      title: t('featureGrowthTitle'),
      description: t('featureGrowthDesc'),
      color: 'text-sky-500',
    },
    {
      Icon: TrendingUp,
      title: t('featureEngagementTitle'),
      description: t('featureEngagementDesc'),
      color: 'text-indigo-500',
    },
    {
      Icon: ShieldCheck,
      title: t('featureSecureTitle'),
      description: t('featureSecureDesc'),
      color: 'text-amber-500',
    },
    {
      Icon: BadgePercent,
      title: t('featurePackagesTitle'),
      description: t('featurePackagesDesc'),
      color: 'text-purple-500',
    },
  ];

  return (
    <section 
      aria-label={t('featureListAriaLabel', { defaultValue: 'Key Features' })}
      className="bg-gradient-to-br from-amber-50/50 via-white to-sky-50/50 dark:from-slate-900 dark:via-gray-900 dark:to-slate-900/90 rounded-2xl p-6 border border-black/5 shadow-subtle"
    >
      <ul className="space-y-4">
        {features.map(({ Icon, title, description, color }, i) => (
          <li 
            key={i} 
            className="group flex items-start gap-4 p-3 rounded-lg transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 rounded-full p-2 border border-black/5 group-hover:scale-110 transition-transform">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
} 