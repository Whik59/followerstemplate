'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // ADD Link for breadcrumbs
import { useRouter } from 'next/navigation'; // Import useRouter
// import { notFound } from 'next/navigation'; // Keep for client-side notFound
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MDXRemote } from 'next-mdx-remote'; // Simplified import
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'; // Import this type
import { ShoppingCart, Star, ShieldCheck, Zap, Check, Rocket, CheckCheck, Target, TrendingUp, BadgePercent } from 'lucide-react';
import { cn } from '@/lib/utils';

// ADD Breadcrumb UI components
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Assuming types are correctly defined and accessible
import { Product, ProductVariation, ProductVariationOption } from '@/types/product';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel"; // IMPORT CarouselApi type
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Added Accordion imports
import { useUIContext, StickyBarProductData } from '@/context/ui-context'; // Import useUIContext and StickyBarProductData
import { ReviewSummary } from '@/types/review'; // Make sure this import exists or add it

import { CategorySelector } from '@/components/common/category-selector';
import { ProductFaqAccordion } from '@/components/common/product-faq-accordion';
import { LottieAnimation } from './lottie-animation';
import { LottieAnimation2 } from './lottie-animation-2';
import { LottieAnimation4 } from './lottie-animation-4';

// Define the components to be used in MDX
const mdxComponents = {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  // Add other custom components you might use in MDX here
  // For example: Button, CustomImage, etc.
  // Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <Button {...props} />,
};

// Define helper interfaces for translated variations
interface TranslatedVariationOption {
  originalName: string;
  translatedName: string;
}

interface TranslatedVariationType {
  originalType: string;
  translatedType: string;
  options: TranslatedVariationOption[];
}
// End helper interfaces for translated variations

// Added for breadcrumbs from actions.ts
export interface BreadcrumbSegment {
  name: string;
  path: string;
}

// Updated interface to match the server action's return type
interface LocalizedPriceInfo {
  displayPrice: string;      // e.g., "Mex$457.30"
  currencyCode: string;      
  currencySymbol: string;    // e.g., "Mex$"
  convertedAmount: number;   // e.g., 457.2999...
}

export interface ProductDetailsMdxSection { // Export if needed by page.tsx directly, but it's mainly internal to this flow
  title: string;
  serializedContent: MDXRemoteSerializeResult;
}

// UPDATED type for productDataFromJSON
export interface ProductDetailsPayload { // Export for page.tsx to use as prop type
  productDataFromJSON: (Product & { basePriceUSD: number; stockCount?: number }) | null; 
  mdxFrontmatter: {
    title?: string;
    shortTitle?: string; // Added shortTitle
    canonicalProductId?: number;
    metaTitle?: string; // Added metaTitle
    description?: string; 
    keywords?: string; 
    brand?: string;
    sku?: string;
    imageAltProduct?: string;
    featureHighlightsString?: string; // ADDED: For structured features
    [key: `translatedVariations_${string}`]: TranslatedVariationType[] | undefined; // Added for translated variations
  } | null; // Ensure all fields used in schema are here
  localizedPriceInfo: LocalizedPriceInfo | null; 
  originalLocalizedPriceInfo?: LocalizedPriceInfo | null; // Added for strikethrough price
  detectedLocale: string;                     
  detectedCountryForPricing: string;          
  exchangeRates: Record<string, number> | null; 
  serializedIntroContent?: MDXRemoteSerializeResult | null; 
  mdxSections?: ProductDetailsMdxSection[];
  breadcrumbs?: BreadcrumbSegment[]; // Added breadcrumbs field
  reviewSummary?: ReviewSummary; // ADDED for product page reviews
  error?: string;
  // Added fields for SimilarProducts
  mdxContent?: MDXRemoteSerializeResult | null;
  geoCountryCode?: string;
  formattingLocale?: string;
  translatedProductName?: string;
  productSchema?: Record<string, unknown>;
}

interface ProductPageClientProps {
  locale: string; // Still useful for translations, fallback if needed
  productSlug: string; // Potentially useful for client-side fallbacks or refetching if ever implemented
  initialProductDetails: ProductDetailsPayload | null; // Data is now passed as a prop
  videosComponent: React.ReactNode; // Add prop for the Videos component
  reviewsSummaryComponent: React.ReactNode; // Add prop for the reviewsSummaryComponent
  fullReviewsSectionComponent?: React.ReactNode; // ADDED: Optional prop for the full reviews section
  // faqAccordionComponent?: React.ReactNode; // Added prop for FaqAccordion
  similarProductsComponent?: React.ReactNode; // Added for SimilarProducts
  whyChooseUsSectionComponent?: React.ReactNode;
}

export function ProductPageClient({ 
  locale, 
  productSlug, 
  initialProductDetails, 
  videosComponent, 
  reviewsSummaryComponent, 
  fullReviewsSectionComponent, // ADDED: Destructure the new prop
  // faqAccordionComponent, // Destructure FaqAccordion prop
  similarProductsComponent, // Destructure similarProductsComponent
  whyChooseUsSectionComponent
}: ProductPageClientProps) {
  console.log(`[TTFB Debug] ProductPageClient rendering STARTED for slug: ${productSlug}, locale: ${locale}, timestamp: ${new Date().toISOString()}`);
  // console.log("[Cart Debug] ProductPageClient rendered. Locale:", locale, "Product Slug Prop:", productSlug);
  const t = useTranslations('Common'); // Reinstated
// <-- ADD for SMMA translations
  const { addItem } = useCart();
  const { toast } = useToast();
  const { setIsProductStickyBarVisible, setStickyBarProductDetails } = useUIContext(); // Use the context setter
  const router = useRouter(); // Initialize router
  
  // ADDED: State for Carousel API and current slide
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [selectedVariationOptions, setSelectedVariationOptions] = useState<Record<string, string | undefined>>({});
  
  // Renamed state for clarity and added state for dynamic original price
  const [activeDisplayPrice, setActiveDisplayPrice] = useState<string | null>(null);
  const [activeOriginalDisplayPrice, setActiveOriginalDisplayPrice] = useState<string | null>(null);
  const [currentPriceForCart, setCurrentPriceForCart] = useState<number | undefined>(undefined);
  const [savingsDisplay, setSavingsDisplay] = useState<string | null>(null);

  // State is now initialized directly from the prop or set to loading/error based on it.
  const [productDetails] = useState<ProductDetailsPayload | null>(initialProductDetails);
  const [isLoading, setIsLoading] = useState(!initialProductDetails); // Only loading if no initial details

  const [mainCtaRef, setMainCtaRef] = useState<HTMLDivElement | null>(null);
  const [stockCount, setStockCount] = useState(0);

  // START MOD: FormattedFeaturesList component
  const FormattedFeaturesList: React.FC<{ featuresString?: string }> = ({ featuresString }) => {
    if (!featuresString || featuresString.trim() === '') {
      return null;
    }

    const emojiToIconMap: Record<string, { Icon: React.ElementType; color: string }> = {
      '🚀': { Icon: Rocket, color: 'text-red-500' },
      '✅': { Icon: CheckCheck, color: 'text-green-500' },
      '🎯': { Icon: Target, color: 'text-sky-500' },
      '📈': { Icon: TrendingUp, color: 'text-indigo-500' },
      '🔒': { Icon: ShieldCheck, color: 'text-amber-500' },
      '💰': { Icon: BadgePercent, color: 'text-purple-500' },
      '💬': { Icon: Star, color: 'text-blue-500' }, // fallback for chat
      '🛡️': { Icon: ShieldCheck, color: 'text-amber-500' },
      '💎': { Icon: Star, color: 'text-purple-500' },
    };

    const features = featuresString
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        // Support lines starting with '- ' (dash and space)
        if (line.startsWith('- ')) line = line.slice(2).trim();
        const emoji = line.substring(0, line.indexOf(' '));
        const rest = line.substring(line.indexOf(' ') + 1);
        const [title, description] = rest.split(/:\s*/, 2);
        return {
          emoji,
          title,
          description,
          ...emojiToIconMap[emoji],
        };
      })
      .filter(feature => feature.Icon);

    if (features.length === 0) return null;

    return (
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
    );
  };
  // END MOD: FormattedFeaturesList component

  useEffect(() => {
    // This effect now primarily handles setting up derived state (like price and variations)
    // once initialProductDetails is available and processed.
    // It also handles the case where initialProductDetails might be null due to an error during server fetch.

    if (!productDetails) { // If initialProductDetails was null (error state from server)
        setIsLoading(false); // Stop loading indicator
        setStickyBarProductDetails(null); // Clear sticky bar details on error
        // notFound() will be called in the render logic if productDetails remains null
        return;
    }
    
    React.startTransition(() => {
      setIsLoading(false); // Data is present, stop loading

      if (productDetails.error || !productDetails.productDataFromJSON) {
        setActiveDisplayPrice(t('priceUnavailable'));
        setActiveOriginalDisplayPrice(null); 
        setCurrentPriceForCart(undefined);
        setStickyBarProductDetails(null); // Clear sticky bar details on error
        return;
      }

      // Destructure for convenience
      const { productDataFromJSON: baseData, mdxFrontmatter: frontmatter, localizedPriceInfo: priceInfo } = productDetails;
      const currentDisplayTitle = frontmatter?.title || baseData.productNameCanonical;
      const currentProductUrl = `/${locale}/products/${productSlug}`;
      const currentShippingTimeInfo = t('shippingTimeInfo'); // Assuming this is already translated
      let currentStock = baseData.stockCount !== undefined ? baseData.stockCount : 5;

      // Setup price from productDetails
      if (priceInfo) {
        setActiveDisplayPrice(priceInfo.displayPrice);
        setCurrentPriceForCart(priceInfo.convertedAmount);
        const artificialOriginalPrice = priceInfo.convertedAmount / 0.7;
        setActiveOriginalDisplayPrice(`${priceInfo.currencySymbol}${artificialOriginalPrice.toFixed(2)}`);
        
        const savedAmount = artificialOriginalPrice - priceInfo.convertedAmount;
        setSavingsDisplay(`${t('youSave')} ${priceInfo.currencySymbol}${savedAmount.toFixed(2)} (30%)`);
      } else if (baseData?.basePriceUSD) {
        const basePriceStr = `$${baseData.basePriceUSD.toFixed(2)}`;
        setActiveDisplayPrice(basePriceStr);
        setCurrentPriceForCart(baseData.basePriceUSD);
        const artificialOriginalUSD = baseData.basePriceUSD / 0.7;
        setActiveOriginalDisplayPrice(`$${artificialOriginalUSD.toFixed(2)}`);

        const savedAmount = artificialOriginalUSD - baseData.basePriceUSD;
        setSavingsDisplay(`${t('youSave')} $${savedAmount.toFixed(2)} `);
      } else if (baseData?.basePrice) {
        const basePriceStr = `$${baseData.basePrice.toFixed(2)}`;
        setActiveDisplayPrice(basePriceStr);
        const artificialOriginal = baseData.basePrice / 0.7;
        setActiveOriginalDisplayPrice(`$${artificialOriginal.toFixed(2)}`);

        const savedAmount = artificialOriginal - baseData.basePrice;
        setSavingsDisplay(`${t('youSave')} $${savedAmount.toFixed(2)} `);
      }

      // Only set default variations if not already set
      if (
        baseData.variations &&
        baseData.variations.length > 0 &&
        Object.keys(selectedVariationOptions).length === 0
      ) {
        const initialSelections: Record<string, string | undefined> = {};
        baseData.variations.forEach(variation => {
          let defaultOption: ProductVariationOption | undefined = undefined;
          if (variation.type === 'quality') {
            // Preselect 'premium' if available
            defaultOption = variation.options.find(opt => opt.value.toLowerCase() === 'premium') || variation.options[0];
          } else {
            defaultOption = variation.options[0];
          }
          if (defaultOption) {
            initialSelections[variation.type] = defaultOption.value;
            if (defaultOption.stockCount !== undefined) {
              currentStock = defaultOption.stockCount;
            }
          }
        });
        setSelectedVariationOptions(initialSelections);
      }
      setStockCount(currentStock); // Set the final stock count

      // Update StickyBar Product Details
      const newStickyBarDetails: StickyBarProductData = {
        imagePath: baseData.imagePaths?.[0],
        displayTitle: productDetails.translatedProductName || baseData.productNameCanonical,
        activeDisplayPrice: activeDisplayPrice || (priceInfo?.displayPrice ?? `$${baseData.basePriceUSD?.toFixed(2)}`) || `$${baseData.basePrice?.toFixed(2)}`,
        stockCount: currentStock,
        shippingTimeInfo: currentShippingTimeInfo,
        productUrl: currentProductUrl,
        productForCart: {
          ...baseData,
          productNameLocalized: { [locale]: productDetails.translatedProductName || baseData.productNameCanonical },
          localizedShortTitle: { [locale]: productDetails.translatedProductName || baseData.productNameCanonical },
        },
        priceForCart: currentPriceForCart || baseData.basePriceUSD || baseData.basePrice, // Ensure fallback for price
        locale: locale, // Pass current locale
        productSlug: productSlug // Pass current productSlug
      };
      setStickyBarProductDetails(newStickyBarDetails);

    });

  }, [productDetails, locale, t, productSlug, setStickyBarProductDetails]);

  // REWRITTEN useEffect for COMBINATION price changes
  useEffect(() => {
    if (isLoading || !productDetails || !productDetails.productDataFromJSON) {
      return;
    }
    const { productDataFromJSON, localizedPriceInfo, exchangeRates } = productDetails;

    if (!localizedPriceInfo || !exchangeRates) {
      return;
    }
    
    const { prices } = productDataFromJSON;
    const hasSelectedAllVariations = productDataFromJSON.variations.every(
      v => selectedVariationOptions[v.type]
    );

    if (!prices || prices.length === 0 || !hasSelectedAllVariations) {
      // Fallback to initial price if structure is old or not all variations selected
      setActiveDisplayPrice(localizedPriceInfo.displayPrice);
      setCurrentPriceForCart(localizedPriceInfo.convertedAmount);
      return;
    }

    // Find the correct price from the matrix
    const matchedPriceEntry = prices.find(p => {
      return (['quantity', 'quality'] as const).every(key => {
        return selectedVariationOptions[key] && selectedVariationOptions[key] === p[key];
      });
    });

    const finalPriceUSD = matchedPriceEntry ? matchedPriceEntry.price : productDataFromJSON.basePriceUSD;

    // Convert to local currency
    const targetCurrencyCode = localizedPriceInfo.currencyCode;
    const targetCurrencySymbol = localizedPriceInfo.currencySymbol;
    const rate = exchangeRates[targetCurrencyCode] || 1;
    const baseRateUSD = exchangeRates['USD'] || 1;
    const convertedFinalPrice = (finalPriceUSD / baseRateUSD) * rate;

    const finalDisplayPrice = `${targetCurrencySymbol}${convertedFinalPrice.toFixed(2)}`;
    const artificialOriginalPrice = convertedFinalPrice / 0.7;
    const finalOriginalDisplayPrice = `${targetCurrencySymbol}${artificialOriginalPrice.toFixed(2)}`;

    // Set component states
    setActiveDisplayPrice(finalDisplayPrice);
    setCurrentPriceForCart(convertedFinalPrice);
    setActiveOriginalDisplayPrice(finalOriginalDisplayPrice);
    
    const savedAmount = artificialOriginalPrice - convertedFinalPrice;
    setSavingsDisplay(`${t('youSave')} ${targetCurrencySymbol}${savedAmount.toFixed(2)} `);
    
    // setStockCount remains the same for now, can be updated if prices matrix includes stock

  }, [selectedVariationOptions, productDetails, isLoading, t]);

  // ADDED: useEffect to handle carousel events
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCurrentSlide(carouselApi.selectedScrollSnap()); // Set initial slide

    const onSelect = () => {
      if (!carouselApi) return;
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  const handleVariationChange = (variationType: string, optionValue: string) => {
    setSelectedVariationOptions(prev => ({ ...prev, [variationType]: optionValue }));
  };

  const handleAddToCart = () => {
    if (!productDetails || !productDetails.productDataFromJSON || currentPriceForCart === undefined) {
      toast({
        title: 'Error Adding to Cart',
        description: 'There was an error adding the item to the cart. Please try again later.',
        variant: "destructive",
      });
      return;
    }

    const { productDataFromJSON, mdxFrontmatter } = productDetails;

    // Determine the base name for the product for the current locale
    const nameToUseForCurrentLocale = productDetails.translatedProductName || productDataFromJSON.productNameCanonical;

    let variantId = productSlug;
    let productNameWithVariant = nameToUseForCurrentLocale;
    const selectedVariantParts: string[] = [];

    if (productDataFromJSON.variations && productDataFromJSON.variations.length > 0) {
      // Sort variation types to ensure consistent variantId generation
      const sortedVariationTypes = Object.keys(selectedVariationOptions).sort();

      sortedVariationTypes.forEach(variationType => {
        const optionValue = selectedVariationOptions[variationType];
        if (optionValue) {
          const variation = productDataFromJSON.variations.find(v => v.type === variationType);
          const option = variation?.options.find(o => o.value === optionValue);
          if (option) {
            // Try to get translated variation type and option name for a more descriptive product name
            const translatedVariationsKey = `translatedVariations_${locale}` as keyof typeof mdxFrontmatter;
            const mdxTranslatedVariations = mdxFrontmatter?.[translatedVariationsKey] as TranslatedVariationType[] | undefined;
            const translatedTypeInfo = mdxTranslatedVariations?.find(tv => tv.originalType === variationType);
            const displayVariationType = translatedTypeInfo?.translatedType || variationType;
            const translatedOptionInfo = translatedTypeInfo?.options.find(to => to.originalName === option.name);
            const displayOptionName = translatedOptionInfo?.translatedName || option.name;
            
            selectedVariantParts.push(`${displayOptionName}`); // Use display name for productNameWithVariant
            variantId += `_${variationType}_${optionValue}`; // Use system values for variantId
          }
        }
      });

      if (selectedVariantParts.length > 0) {
        productNameWithVariant = `${nameToUseForCurrentLocale} - ${selectedVariantParts.join(', ')}`;
      }
    }

    const productForCart: Product = {
      ...productDataFromJSON,
      slugOverride: productSlug, 
      variantId: variantId, // ADDED: Unique ID for the cart item
      productNameWithVariant: productNameWithVariant, // ADDED: Name including variant details
      productNameLocalized: productDataFromJSON.productNameLocalized || { [locale]: nameToUseForCurrentLocale },
    };
    
    addItem(productForCart, 1, currentPriceForCart, () => {
      router.push(`/${locale}/checkout`);
    });

    toast({
      title: t('toastItemAddedToCartTitle'),
      description: t('toastItemAddedToCartDescription', { productNameWithVariant: productNameWithVariant }),
    });
  };

  const handleThumbnailClick = (index: number) => {
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  };

  const renderMdxSections = () => {
    if (!productDetails?.mdxSections || productDetails.mdxSections.length === 0) {
      return null;
    }

    return productDetails.mdxSections.map((section, index) => {
      if (section.serializedContent && section.serializedContent.compiledSource) {
        // Log valid content before rendering
        // console.log(`[ProductPageClient Debug] Rendering MDX section "${section.title}" on "${productSlug}" with valid serializedContent:`, JSON.stringify(section.serializedContent, null, 2));
        return (
          <AccordionItem value={`item-${index}`} key={`mdx-section-${index}`} 
            className="border border-amber-200 dark:border-amber-800/70 rounded-lg 
                       bg-gradient-to-br from-white to-amber-50 
                       dark:from-slate-800 dark:to-slate-800/60 
                       shadow-lg hover:shadow-amber-500/20 dark:hover:shadow-amber-400/10 transition-shadow duration-300"
          >
            <AccordionTrigger 
              className="py-4 px-4 sm:px-5 text-lg md:text-xl font-semibold text-left 
                         text-amber-700 dark:text-amber-400 
                         hover:text-amber-800 dark:hover:text-amber-300 
                         hover:no-underline transition-colors duration-200 w-full rounded-t-lg group"
            >
              <span className="group-hover:translate-x-1 transition-transform duration-200 ease-in-out">{section.title}</span>
            </AccordionTrigger>
            <AccordionContent className="p-4 sm:p-5 pt-2 prose prose-amber dark:prose-invert lg:prose-lg max-w-none text-slate-700 dark:text-slate-300">
              <MDXRemote {...section.serializedContent} components={mdxComponents} />
            </AccordionContent>
          </AccordionItem>
        );
      } else if (section.serializedContent) {
        // Log if serializedContent exists but compiledSource is missing
        // console.warn(`[ProductPageClient Debug] MDX section "${section.title}" on "${productSlug}" has serializedContent but NO COMPILED SOURCE:`, JSON.stringify(section.serializedContent, null, 2));
        return (
          <div key={`missing-compiled-source-${index}`}>
            <h2 className="text-lg md:text-xl font-semibold py-4">{section.title}</h2>
            <p className="text-red-500">Content for this section could not be loaded.</p>
          </div>
        );
      } else {
        // Log if no serializedContent at all
        // console.warn(`[ProductPageClient Debug] MDX section "${section.title}" on "${productSlug}" has NO SERIALIZED CONTENT at all.`);
        return (
          <div key={`no-content-${index}`}>
            <h2 className="text-lg md:text-xl font-semibold py-4">{section.title}</h2>
            <p className="text-red-500">Content for this section could not be loaded.</p>
          </div>
        );
      }
    });
  };

  const renderMdxContent = () => {
    if (!productDetails?.mdxContent) return null;
    return (
      <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-amber-700 dark:prose-headings:text-amber-400 prose-a:text-sky-600 dark:prose-a:text-sky-400 hover:prose-a:text-sky-700 dark:hover:prose-a:text-sky-500">
        <MDXRemote {...productDetails.mdxContent} components={mdxComponents} />
      </div>
    );
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">{t('loadingText')}</div>;
  }

  if (!productDetails || productDetails.error || !productDetails.productDataFromJSON) {
    return (
      <div className="container mx-auto p-4 text-center text-red-600 dark:text-red-400">
        <h2 className="text-2xl font-semibold mb-2">{t('errorTitle')}</h2>
        <p>{t('productLoadError')}</p>
        {productDetails?.error && <p className="text-sm mt-1">{t('errorDetailsPrefix')}: {productDetails.error}</p>}
      </div>
    );
  }

  const { 
    productDataFromJSON: baseProductData, 
    mdxFrontmatter, 
    localizedPriceInfo,
    exchangeRates,
    originalLocalizedPriceInfo: _artificialOriginalPriceInfo,
    serializedIntroContent,
    mdxSections: _mdxSections,
    breadcrumbs,
    reviewSummary,
    mdxContent: _mdxContent,
    geoCountryCode: _geoCountryCode,
    formattingLocale: _formattingLocale,
    translatedProductName
  } = productDetails;


  const displayTitle = translatedProductName || baseProductData.productNameCanonical;



  const addToCartText = t('addToCart');
  const quantityLabel = t('quantityLabel');

  const defaultImageAlt = mdxFrontmatter?.imageAltProduct || displayTitle || t('productImageDefaultAlt');

  // Helper to render main product image or carousel
  const renderProductMedia = () => {
    if (!baseProductData.imagePaths || baseProductData.imagePaths.length === 0) {
      return (
        <div className="aspect-square w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 
                      rounded-xl flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          {t('noImageAvailable')}
        </div>
      );
    }

    if (baseProductData.imagePaths.length === 1) {
      return (
        <div className="aspect-square w-full relative rounded-xl overflow-hidden group">
          <Image
            src={baseProductData.imagePaths[0]}
            alt={defaultImageAlt}
            fill
            className="object-contain transition-all duration-700 group-hover:scale-110"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Carousel setApi={setCarouselApi} className="w-full">
          <CarouselContent>
            {baseProductData.imagePaths.map((src, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-square w-full overflow-hidden rounded-xl group">
                  <Image
                    src={src}
                    alt={`${defaultImageAlt} - View ${index + 1}`}
                    fill
                    className="object-contain transition-all duration-700 group-hover:scale-110"
                    priority={index === 0}
                    loading={index === 1 ? 'eager' : undefined}
                    sizes="(max-width: 640px) 90vw, (max-width: 768px) 92vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {baseProductData.imagePaths.length > 1 && (
            <>
              <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 scale-75 sm:scale-100 
                                         bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800" />
              <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 scale-75 sm:scale-100 
                                     bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800" />
            </>
          )}
        </Carousel>

        {/* Thumbnails */}
        <div className="hidden md:grid grid-cols-4 gap-4 px-4">
          {baseProductData.imagePaths.map((_, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden",
                "border-2 transition-all duration-200",
                currentSlide === index 
                  ? "border-amber-500 ring-2 ring-amber-500/50" 
                  : "border-gray-200 dark:border-gray-700 hover:border-amber-400"
              )}
              aria-label={t('showImageAriaLabel', { index: index + 1 })}
            >
              <Image
                src={baseProductData.imagePaths[index]}
                alt={t('productThumbnailAlt', { productName: defaultImageAlt, index: index + 1 })}
                fill
                className="object-cover transition-transform duration-300 hover:scale-110"
                sizes="(max-width: 768px) 25vw, 120px"
              />
            </button>
          ))}
        </div>

        {/* Mobile Dots */}
        <div className="flex md:hidden justify-center gap-2 pt-4">
          {baseProductData.imagePaths.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => handleThumbnailClick(index)}
              aria-label={t('showImageAriaLabel', { index: index + 1 })}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                currentSlide === index 
                  ? "bg-amber-500 w-4" 
                  : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
              )}
            />
          ))}
        </div>
      </div>
    );
  };
  
  // Ensure productDetails and its nested properties are available
  const productAvailable = productDetails && productDetails.productDataFromJSON && !productDetails.error;
  const canAddToCart = productAvailable && currentPriceForCart !== undefined && stockCount > 0;

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="container mx-auto max-w-6xl p-4 md:p-8 overflow-hidden">
        {/* BREADCRUMBS WITH SMALL PRODUCT IMAGE - REMOVED */}
        
        {/* Main content grid, remove image/carousel column */}
        <div className="space-y-6">
          {/* MOVED Review Summary (Stars & Count) HERE - Above Title */}
          {reviewSummary && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5", // Slightly larger stars
                      i < Math.floor(reviewSummary.averageRating)
                        ? "text-amber-400 fill-amber-400"
                        : i < reviewSummary.averageRating
                        ? "text-amber-400 fill-amber-400 opacity-60"
                        : "text-gray-300 dark:text-gray-600"
                    )}
                  />
                ))}
              </div>
              <a href="#reviews-section" className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-500">
                ({reviewSummary.numberOfReviews} {t(reviewSummary.numberOfReviews === 1 ? 'review' : 'reviews')})
              </a>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
            {/* Title Section */}
            <div className="space-y-2">
              <div className="flex justify-center items-center gap-4">
                <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 px-5 py-2 rounded-2xl shadow-md border border-amber-500 dark:border-amber-700">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white dark:text-amber-100 m-0">
                    {displayTitle}
                  </h1>
                </div>
                {baseProductData.imagePaths && baseProductData.imagePaths.length > 0 && (
                  <Image
                    src={baseProductData.imagePaths[0]}
                    alt={defaultImageAlt}
                    width={56}
                    height={56}
                    className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white object-contain flex-shrink-0"
                  />
                )}
              </div>
              {reviewsSummaryComponent && (
                <div className="mt-2 mb-4">{reviewsSummaryComponent}</div>
              )}
              <LottieAnimation4 />
            </div>
              {/* Render quality selector after price/button */}
              {baseProductData.variations.map((variation: ProductVariation) =>
                variation.type === 'quality' ? (
                  <div key={variation.type} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {variation.options.map((option: ProductVariationOption) => {
                        const isSelected = selectedVariationOptions[variation.type] === option.value;
                        const isPremium = option.value.toLowerCase().includes('premium');
                        
                        const title = isPremium 
                          ? t('qualityPremiumTitle', { country: 'USA' })
                          : t('qualityBasicTitle');

                        const feature1 = isPremium
                          ? t('qualityPremiumFeature1')
                          : t('qualityBasicFeature1');
                        
                        const feature2 = isPremium
                          ? t('qualityPremiumFeature2', { country: 'USA' })
                          : t('qualityBasicFeature2');

                        return (
                          <button
                            key={option.value}
                            onClick={() => handleVariationChange(variation.type, option.value)}
                            className={cn(
                              'p-5 text-left border-2 rounded-xl transition-all duration-200 transform hover:scale-[1.03]',
                              isSelected 
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 shadow-lg' 
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-amber-400'
                            )}
                            aria-pressed={isSelected}
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h4>
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                isSelected ? "border-amber-600 bg-amber-500" : "border-gray-400 dark:border-gray-500"
                              )}>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </div>
                            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>{feature1}</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>{feature2}</span>
                              </li>
                            </ul>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null
              )}
            </div>

            {/* MOVED Price Section HERE - Below Quantity Grid */}
            <div className="space-y-6 pb-4">
              {/* Render quantity selector first */}
              {baseProductData.variations.map((variation: ProductVariation) =>
                variation.type === 'quantity' ? (
                  <div key={variation.type} className="space-y-3">
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {variation.options.map((option: ProductVariationOption) => {
                        const isSelected = selectedVariationOptions[variation.type] === option.value;
                        const quantityValue = parseInt(option.name.replace(/\D/g, ''), 10);
                        // Price logic removed from button
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleVariationChange(variation.type, option.value)}
                            className={cn(
                              'flex flex-col items-center justify-center p-0.5 h-16 md:h-20 w-full border-2 rounded-xl transition-all duration-200 font-bold',
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                                : 'bg-white border-gray-200 text-black hover:border-orange-400',
                              'focus:outline-none focus:ring-2 focus:ring-orange-300',
                              'relative'
                            )}
                            aria-pressed={isSelected}
                          >
                            {selectedVariationOptions['quality'] === 'premium' && (
                              <div className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-yellow-300 text-yellow-800 px-1.5 py-0.5 rounded-full shadow-sm z-10">
                                Premium
                              </div>
                            )}
                            <span className={cn(
                              'block text-base md:text-lg font-extrabold',
                              isSelected ? 'text-white' : 'text-black')}>{option.name}</span>
                            {/* 15% bonus text below quantity */}
                            {(() => {
                              const quantity = parseInt(option.name.replace(/\D/g, ''), 10);
                              const bonus = Math.floor(quantity * 0.15);
                              return bonus > 0 ? (
                                <span className={cn(
                                  'block mt-0.5 text-xs md:text-sm font-semibold',
                                  isSelected ? 'text-green-200' : 'text-green-600')}
                                >
                                  {t('quantityFifteenPercentBonus', { bonus })}
                                </span>
                              ) : null;
                            })()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null
              )}
              {/* Price and Add to Cart below quantity selector */}
              <div className="flex flex-col items-center justify-center gap-2 mt-6 mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-500">
                    {activeDisplayPrice}
                  </span>
                  {activeOriginalDisplayPrice && (
                    <span className="text-2xl text-gray-400 line-through">
                      {activeOriginalDisplayPrice}
                    </span>
                  )}
                </div>
                {savingsDisplay && (
                  <div className="text-center mt-2 text-sm font-semibold text-green-600 dark:text-green-500">
                    {savingsDisplay}
                  </div>
                )}
                <Button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className={cn(
                    "h-14 px-8 text-lg font-extrabold rounded-xl text-white",
                    "bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400",
                    "hover:from-orange-500 hover:via-amber-600 hover:to-yellow-500",
                    "shadow-lg hover:shadow-amber-400/60 focus:ring-4 focus:ring-amber-300",
                    "transition-all duration-200",
                    "animate-none hover:animate-pulse",
                    !canAddToCart && "opacity-50 cursor-not-allowed"
                  )}
                  style={{ boxShadow: '0 0 16px 2px #f59e42, 0 2px 8px 0 #fbbf24' }}
                >
                  <ShoppingCart className="mr-2 h-6 w-6 text-white" />
                  {addToCartText}
                </Button>
                <div className="mt-4">
                  <Image 
                    src="/icons/payment.avif" 
                    alt={t('securePaymentsAlt')} 
                    width={250} 
                    height={30} 
                    className="mx-auto" 
                  />
              </div>
            
                {/* Feature Highlights Section (restored) */}
            <div className="rounded-xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 dark:from-amber-900/70 dark:via-amber-800/60 dark:to-orange-900/50 border border-amber-300 dark:border-amber-700 p-4 my-3 shadow-sm">
              <FormattedFeaturesList featuresString={productDetails?.mdxFrontmatter?.featureHighlightsString} />
                </div>
            </div>
            

            <LottieAnimation2 />
            <ProductFaqAccordion />

            {/* Why Choose Us Section */}
            {whyChooseUsSectionComponent}

            {/* Add to Cart Section - Input and Button are REMOVED from here */}
            <div id="add-to-cart-section" className="pt-4 space-y-4">
            </div>
          </div>

          {/* Videos on Mobile/Tablet */}
          <div className="md:hidden mt-8">
            {videosComponent}
          </div>
          
          <div className="mt-8">
            <CategorySelector locale={locale} />
          </div>
          
          {/* FAQ Section - REMOVED */}
           
          {/* Product Details Intro MDX */}
          {serializedIntroContent && (
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <MDXRemote {...serializedIntroContent} components={mdxComponents} />
            </div>
          )}

          {/* Product Description Accordion */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            {productDetails?.mdxSections && productDetails.mdxSections.length > 0 && (
              <Accordion type="single" collapsible className="w-full" defaultValue="item-0" aria-label={t('productDetailsAccordionAriaLabel')}>
                {renderMdxSections()}
              </Accordion>
            )}
          </div>
        </div>

        {/* ADDED: Full Reviews Section */}
        {fullReviewsSectionComponent}
        
        {/* Renders Similar Products */}
        {similarProductsComponent}

      </div>
    </div>
  );
}

