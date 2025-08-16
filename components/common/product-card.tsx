// import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server'; // For t function
import { Product } from '@/types/product'; // Import the main Product type
import { ReviewSummary } from '@/types/review'; // Import ReviewSummary
import matter from 'gray-matter'; // Only for parsing, not for file reading
// import CurrencyInfo from '@/components/common/currency-info';
import { AddToCartButton } from './add-to-cart-button'; // Import the new button
import { Star } from 'lucide-react'; // Import Star icon
import { ProductLink } from './product-link'; // Import the new ProductLink component
import { FormattedCurrency } from '@/components/common/formatted-currency';

// Updated ProductCardProps
interface ProductCardProps {
  product: Pick<Product, 'productId' | 'productNameCanonical' | 'basePrice' | 'imagePaths'> & Partial<Pick<Product, 'categoryIds' | 'variations'>>;
  locale: string; // Kept for translations
  geoCountryCode: string; // Added for currency conversion
  formattingLocale: string; // Added for currency formatting
  reviewSummary?: ReviewSummary;
  productSlug: string; // Make required and always string
  productTranslations?: Record<string, string>; // Fix: Changed type to match batched data
  isPriority?: boolean; // ADDED: For LCP optimization
}

// Minimal frontmatter type for fetching slug
interface ProductMdxFrontmatter {
  title?: string;
  shortTitle?: string; // Add shortTitle for products
  slugOverride?: string;
  // Add other frontmatter fields if needed
}

export async function ProductCard({ 
  product, 
  locale, 
  geoCountryCode, 
  formattingLocale, 
  reviewSummary, 
  productSlug, 
  productTranslations,
  isPriority = false // ADDED: Default to false
}: ProductCardProps) {
  const tProductCard = await getTranslations({ locale, namespace: 'Common' });

  const productUrl = `/${locale}/products/${productSlug}`;
  // Use translation from productTranslations if available
  const localizedTitle = productTranslations?.[product.productId] || product.productNameCanonical;

  // Remove all MDX/slugOverride logic

  const productForButton: Product = {
    productId: product.productId,
    productNameCanonical: product.productNameCanonical,
    basePrice: typeof product.basePrice === 'number' ? product.basePrice : 0,
    imagePaths: product.imagePaths,
    productNameLocalized: { [locale]: localizedTitle },
    localizedShortTitle: { [locale]: localizedTitle },
    slugOverride: productSlug,
    categoryIds: product.categoryIds || [],
    variations: product.variations || [],
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-white 
                    border border-amber-200/50 dark:border-amber-700/30
                    hover:border-amber-400 dark:hover:border-amber-600
                    shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(251,191,36,0.1)]
                    dark:shadow-none dark:hover:shadow-amber-600/10
                    backdrop-blur-sm
                    flex flex-col h-full transition-all duration-300 ease-in-out">
      <ProductLink 
        href={productUrl} 
        className="block flex flex-col flex-grow" 
        productNameCanonical={product.productNameCanonical}
        productSlug={productSlug || ''}
        productUrl={productUrl}
      >
        <div className="relative w-full pt-[80%] overflow-hidden bg-white dark:bg-white">
          {product.imagePaths && product.imagePaths.length > 0 && (
            <Image
              src={product.imagePaths[0]}
              alt={localizedTitle}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain transition-all duration-500 group-hover:scale-105 p-2"
              priority={isPriority}
            />
          )}
        </div>
        <div className="p-3 flex flex-col flex-grow">
          <h3 
            className="text-xs font-semibold mb-1
                       text-amber-700 group-hover:text-amber-600 
                       dark:text-amber-300 dark:group-hover:text-amber-200 
                       transition-colors truncate block leading-tight tracking-tight"
            title={localizedTitle}
          >
            {localizedTitle}
          </h3>
          {reviewSummary && (
            <div className="flex items-center mb-1.5">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                      i < Math.floor(reviewSummary.averageRating)
                        ? 'text-amber-400 fill-amber-400'
                        : i < reviewSummary.averageRating
                        ? 'text-amber-400 fill-amber-400 opacity-60'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span className="ml-1.5 text-xs text-slate-600 dark:text-slate-400">
                ({reviewSummary.numberOfReviews} {reviewSummary.numberOfReviews === 1 ? tProductCard('review') : tProductCard('reviews')})
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5 mt-auto mb-1">
            <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-400 dark:to-amber-300 text-transparent bg-clip-text">
              <FormattedCurrency 
                amountInUSD={product.basePrice} 
                userLocale={formattingLocale} 
                userCountryCode={geoCountryCode} 
              />
            </p>
            {product.basePrice && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-through">
                <FormattedCurrency 
                  amountInUSD={product.basePrice / 0.7}
                  userLocale={formattingLocale} 
                  userCountryCode={geoCountryCode} 
                />
              </p>
            )}
          </div>
        </div>
      </ProductLink>
    </div>
  );
} 