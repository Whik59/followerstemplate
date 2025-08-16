'use client';
import React from 'react';

interface SMMACTAProps {
  translations: { headline: string; subheadline: string };
}

export function SMMACTA({ translations }: SMMACTAProps) {
  if (!translations.headline) return null;
  return (
    <section className="w-full py-8 md:py-12 bg-gradient-to-r from-amber-50 via-white to-white dark:from-amber-900/10 dark:via-black/10 dark:to-black/10">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4" dangerouslySetInnerHTML={{ __html: translations.headline }} />
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-300 font-medium">{translations.subheadline}</p>
      </div>
    </section>
  );
} 