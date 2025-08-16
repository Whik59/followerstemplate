import { getTranslations } from 'next-intl/server';
import { getSectionContent } from '@/lib/mdx-content';
import { Award, Lightbulb, Heart, Gem } from 'lucide-react'; // Example icons

interface OurValuesSectionProps {
  locale: string;
}

interface ValueItem {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

export async function OurValuesSection({ locale }: OurValuesSectionProps) {
  const t = await getTranslations({ locale, namespace: 'Common' });
  const ourValuesData = await getSectionContent(locale, 'components/our-values');

  if (!ourValuesData) {
    return (
      <section id="our-values" className="py-12 md:py-16 bg-slate-50 dark:bg-slate-800/30">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-amber-700 dark:text-amber-500 mb-4">
            {t('ourValuesTitle', { fallback: "Our Values" })}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{t('contentUnavailableError')}</p>
        </div>
      </section>
    );
  }

  const sectionTitle = ourValuesData.frontmatter.title || t('ourValuesTitle', { fallback: "Our Values" });
  let introText = '';
  const valueItems: ValueItem[] = [];

  if (ourValuesData.content) {
    const contentParts = ourValuesData.content.split(/\n###\s*/m); // Split by "\n### "
    introText = contentParts[0]?.trim();

    const valueIcons = [Award, Lightbulb, Heart]; // Define icons for Values

    for (let i = 1; i < contentParts.length; i++) {
      const part = contentParts[i];
      const firstNewlineIndex = part.indexOf('\n');
      if (firstNewlineIndex !== -1) {
        valueItems.push({
          id: `value-${i}`,
          icon: valueIcons[i - 1] || Gem, // Fallback icon
          title: part.substring(0, firstNewlineIndex).trim(),
          description: part.substring(firstNewlineIndex + 1).trim(),
        });
      } else {
        valueItems.push({
          id: `value-${i}`,
          icon: valueIcons[i - 1] || Gem,
          title: part.trim(),
          description: '',
        });
      }
    }
  }

  return (
    <section id="our-values" className="pt-6 md:pt-8 pb-12 md:pb-16 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-center mb-6">
          <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 px-6 py-3 rounded-2xl shadow-md border border-amber-500 dark:border-amber-700">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-white dark:text-amber-100 m-0">
              {sectionTitle}
            </h2>
          </div>
        </div>
        {introText && (
          <p className="mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            {introText}
          </p>
        )}

        {valueItems.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-10 md:space-y-12">
            {valueItems.map((item, _index) => {
              const IconComponent = item.icon;
              // Alternate layout for visual rhythm if desired, or keep consistent
              // const isReversed = index % 2 === 1;
              return (
                <div 
                  key={item.id} 
                  className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 p-6 bg-amber-50/60 dark:bg-slate-800/70 rounded-xl shadow-lg hover:shadow-amber-500/10 dark:hover:shadow-amber-400/5 transition-shadow duration-300"
                >
                  <div className="flex-shrink-0 p-4 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 rounded-full text-white shadow-md">
                    <IconComponent className="w-10 h-10 md:w-12 md:h-12" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
} 