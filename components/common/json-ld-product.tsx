import { CurrencyInfo } from '@/types/currency';

export interface ProductJsonLdProps {
  productName: string;
  description: string;
  sku: string;
  imageUrl: string; // URL of the main product image
  brandName: string;
  price: number; // The numerical price, will be formatted
  currencyInfo: CurrencyInfo; // Currency details (code, symbol)
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  // The absolute URL of the product page
  productUrl: string;
  // Optional: if the product has reviews
  ratingValue?: number; // e.g., 4.5
  reviewCount?: number; // e.g., 120
}

export function JsonLdProduct({ 
    productName,
    description,
    sku,
    imageUrl,
    brandName,
    price,
    currencyInfo,
    availability = 'InStock',
    productUrl,
    ratingValue,
    reviewCount,
 }: ProductJsonLdProps) {

  const effectivePrice = price.toFixed(2);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: description,
    sku: sku,
    image: imageUrl,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: currencyInfo.code, 
      price: effectivePrice,
      availability: `https://schema.org/${availability}`,
      url: productUrl, // URL to the product page itself
      seller: {
        '@type': 'Organization',
        name: 'Your Company Name', // Replace with your actual company name
      },
    },
    ...(ratingValue && reviewCount && {
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ratingValue.toString(),
            reviewCount: reviewCount.toString(),
        }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
} 