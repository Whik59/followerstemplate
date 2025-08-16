'use client';

// import { useState } from 'react';
import React from 'react';
// Removed Link from next/link as direct navigation will be handled by router.push
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button'; // Kept for potential future use, but not for the select itself
import { useTranslations } from 'next-intl';
// import { useRouter } from 'next/navigation';

export interface Category {
  categoryId: number;
  categoryNameCanonical: string;
  parentCategoryId: number | null;
  subCategories?: Category[]; // Added for nesting
  localizedName?: string; // Optional, if you pass localized names
}

interface CategoryFiltersProps {
  categories: Category[];
  _currentLocale: string;
  // t: (key: string) => string;
}

export function CategoryFilters({ categories, _currentLocale }: CategoryFiltersProps) {
  const t = useTranslations('Common');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentCategory = searchParams.get('category');

  console.log('[CategoryFilters Debug] Received categories:', categories);

  // Prepare categories with subcategories nested
  const categoryTree = categories.reduce((acc, category) => {
    if (category.parentCategoryId === null) {
      acc.push({
        ...category,
        subCategories: categories.filter(sub => sub.parentCategoryId === category.categoryId)
      });
    }
    return acc;
  }, [] as Category[]);

  console.log('[CategoryFilters Debug] Constructed categoryTree:', JSON.stringify(categoryTree, null, 2));

  function handleCategoryChange(value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set('category', value);
    } else {
      params.delete('category'); // "All Categories" selected
    }
    params.delete('page'); // Reset page when category changes
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!categoryTree || categoryTree.length === 0) {
    console.log('[CategoryFilters Debug] No categoryTree or empty, rendering null.');
    return null;
  }

  return (
    <div className="mb-8 w-full md:w-auto md:min-w-[250px]">
      <h3 className="text-lg font-semibold mb-3 text-amber-600 dark:text-amber-500">{t('filterByCategory')}</h3>
      <Select
        onValueChange={handleCategoryChange}
        defaultValue={currentCategory || "all"}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('selectCategoryPlaceholder', {defaultValue: "Select a category..."})} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allCategories')}</SelectItem>
          {categoryTree.map(category => (
            <SelectGroup key={category.categoryId}>
              <SelectLabel className="text-amber-600 dark:text-amber-500">{category.localizedName || category.categoryNameCanonical}</SelectLabel>
              {/* The SelectItem for parent category itself has been removed */}
              {category.subCategories && category.subCategories.map(subCategory => (
                <SelectItem 
                  key={subCategory.categoryId} 
                  value={String(subCategory.categoryId)}
                  className="pl-6" // Indent subcategories
                >
                  {subCategory.localizedName || subCategory.categoryNameCanonical}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 