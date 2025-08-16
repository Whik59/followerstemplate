export interface ProductVariationOption {
  name: string;
  value: string;
  price?: number | null; // Allow price to be number, undefined, OR null
  stockCount?: number; // Added optional stockCount for variations
}

export interface ProductVariation {
  type: string;
  options: ProductVariationOption[];
}

export interface Product {
  productId: number;
  productNameCanonical: string; // Changed from productName
  productNameLocalized?: { [locale: string]: string }; // Field for localized names
  localizedShortTitle?: { [locale: string]: string }; // ADDED: For localized short titles
  slugOverride?: string; // ADDED: To store the product slug, e.g., from MDX slugOverride
  variantId?: string; // ADDED: For unique identification of a variant in cart
  productNameWithVariant?: string; // ADDED: For displaying product name + variant in cart
  categoryIds: number[];       // Changed from categoryPath (string) to array of numbers
  basePrice: number;
  basePriceUSD?: number; // ADDED: Optional USD base price for consistent currency conversion
  variations: ProductVariation[];
  imagePaths: string[];
  prices?: Array<{ quantity: string; quality: string; price: number }>; // ADDED: Optional prices matrix
} 