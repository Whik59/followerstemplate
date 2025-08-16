import { getTranslations } from 'next-intl/server';
import { Clock, ShieldCheck, UserCheck, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-white/60 dark:bg-gray-900/60 border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
        </div>
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </CardContent>
    </Card>
  );
}

export async function WhyChooseUsSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'Common' });

  const features = [
    {
      icon: Clock,
      title: t('whyChooseUs.instantDelivery.title'),
      description: t('whyChooseUs.instantDelivery.description'),
    },
    {
      icon: ShieldCheck,
      title: t('whyChooseUs.lifetimeGuarantee.title'),
      description: t('whyChooseUs.lifetimeGuarantee.description'),
    },
    {
      icon: UserCheck,
      title: t('whyChooseUs.realProfiles.title'),
      description: t('whyChooseUs.realProfiles.description'),
    },
    {
      icon: Star,
      title: t('whyChooseUs.bestQuality.title'),
      description: t('whyChooseUs.bestQuality.description'),
    },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block bg-amber-200/80 text-amber-800 dark:bg-amber-800/20 dark:text-amber-300 text-sm font-semibold px-4 py-1 rounded-full">
            {t('whyChooseUs.tagline')}
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t.rich('whyChooseUs.title', {
              best: (chunks) => <span className="text-amber-500 dark:text-amber-400">{chunks}</span>,
            })}
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300">
            {t('whyChooseUs.subtitle')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
