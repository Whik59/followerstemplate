export interface Category {
  categoryId: number;
  categoryNameCanonical: string;
  parentCategoryId: number | null;
  subcategories?: Category[]; // Optional: for nesting subcategories
  displayTitle?: string; // Localized title for display
  linkSlug?: string;     // Localized slug for the URL
} 