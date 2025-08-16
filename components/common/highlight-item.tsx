import React from 'react';
import { KeyHighlightMetadata, KeyHighlightsTranslations } from '@/types';
import { UsersIcon } from '@/components/ui/users-icon';
import { GlobeIcon } from '@/components/ui/globe-icon';
import { LockIcon } from '@/components/ui/lock-icon';
import { BriefcaseIcon } from '@/components/ui/briefcase-icon';

interface HighlightItemProps {
  item: KeyHighlightMetadata;
  translations: KeyHighlightsTranslations;
}

const iconMap: Record<string, React.ElementType> = {
  UsersIcon,
  GlobeIcon,
  LockIcon,
  BriefcaseIcon,
};

export function HighlightItem({ item, translations }: HighlightItemProps) {
  const IconComponent = iconMap[item.iconName];
  const title = translations[item.titleKey];
  const description = item.descriptionKey ? translations[item.descriptionKey] : null;

  return (
    <div className="flex flex-col items-center text-center p-4">
      {IconComponent && <IconComponent className="h-10 w-10 mb-3 text-blue-600 dark:text-blue-400" />}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
    </div>
  );
} 