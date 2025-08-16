'use client';

import { useUIContext } from '@/context/ui-context';
import { useCart } from '@/context/cart-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { Product } from '@/types/product';

export function ProductStickyBar() {
  const { isProductStickyBarVisible, stickyBarProductDetails } = useUIContext();
  const { addItem } = useCart();
  const t = useTranslations('Common');
  const { toast } = useToast();

  if (!isProductStickyBarVisible || !stickyBarProductDetails) {
    return null;
  }

  const {
    imagePath,
    displayTitle,
    activeDisplayPrice,
    stockCount,
    shippingTimeInfo,
    productUrl,
    productForCart,
    priceForCart,
    locale,
    productSlug
  } = stickyBarProductDetails;

  const handleAddToCart = () => {
    if (!productForCart || priceForCart === undefined) {
      toast({
        title: t('errorTitle'),
        description: t('productLoadError'),
        variant: "destructive",
      });
      return;
    }

    const cartProduct: Product = {
      productId: productForCart.productId,
      productNameCanonical: productForCart.productNameCanonical,
      basePrice: typeof productForCart.basePrice === 'number' ? productForCart.basePrice : 0,
      imagePaths: productForCart.imagePaths,
      productNameLocalized: productForCart.productNameLocalized,
      localizedShortTitle: productForCart.localizedShortTitle,
      slugOverride: productSlug,
      categoryIds: productForCart.categoryIds || [],
      variations: productForCart.variations || [],
    };

    addItem(cartProduct, 1, priceForCart);

    toast({
      title: t('itemAddedToCartTitle'),
      description: t('itemAddedToCartDescription', {
        itemName: cartProduct.productNameLocalized?.[locale] || cartProduct.productNameCanonical
      }),
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 
                    shadow-lg shadow-black/5 p-3 sm:p-4 z-50 animate-slideInUp">
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideInUp {
          animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
      
      <div className="container mx-auto flex items-center justify-between gap-4 sm:gap-6">
        {/* Product Info */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          {imagePath && (
            <Link href={productUrl} className="shrink-0 group">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden 
                            border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <Image
                  src={imagePath}
                  alt={displayTitle || 'Product Image'}
                  fill
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </Link>
          )}
          
          <div className="flex flex-col flex-1 min-w-0">
            <Link href={productUrl} className="group">
              <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 
                           truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 
                           transition-colors" 
                  title={displayTitle}>
                {displayTitle || 'Product Name'}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-500">
                {activeDisplayPrice || '$?.??'}
              </p>
              {stockCount > 0 && (
                <p className="text-[0.65rem] leading-tight text-red-600 dark:text-red-500 font-medium whitespace-nowrap">
                  {t('stockUrgencyMessage', { stockCount })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {shippingTimeInfo && (
            <div className="hidden sm:flex items-center text-gray-600 dark:text-gray-400">
              <Package className="w-4 h-4 mr-1.5 opacity-80" />
              <span className="text-sm whitespace-nowrap">{shippingTimeInfo}</span>
            </div>
          )}
          
          <Button 
            onClick={handleAddToCart}
            className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 
                     hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 
                     text-white font-medium px-4 py-2 h-10 sm:h-12 
                     rounded-lg shadow-lg hover:shadow-amber-500/25 
                     transform hover:scale-[1.02] transition-all duration-300"
            disabled={stockCount === 0}
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-sm sm:text-base">
              {stockCount > 0 ? t('addToCart') : t('outOfStock')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
} 