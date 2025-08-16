'use client';

import React from 'react'; // useState might be needed if isLoading is used
import { useCart } from '@/context/cart-context';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AddToCartButtonProps {
  product: Product; 
  isCompact?: boolean; // Add isCompact prop
}

export function AddToCartButton({ product, isCompact = false }: AddToCartButtonProps) {
  const { addItem, openDrawer: _openDrawer } = useCart();
  const t = useTranslations('Common'); 
  // const [isLoading, setIsLoading] = React.useState(false); // Example if loading state is used

  const handleAddToCart = () => {
    // setIsLoading(true); // Example
    console.log('[AddToCartButton] Product being added:', JSON.stringify(product, null, 2)); // <<< Key log
    addItem(product, 1);
    // openDrawer(); 
    // setTimeout(() => setIsLoading(false), 1000); // Example
  };

  return (
    <Button 
      onClick={handleAddToCart} 
      // disabled={isLoading} // Example
      className={isCompact 
        ? "w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white dark:text-slate-900 font-medium text-xs px-2 py-1.5 transition-colors duration-150 ease-in-out rounded-md" 
        : "w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white dark:text-slate-900 font-medium text-xs sm:text-sm transition-colors duration-150 ease-in-out"
      }
      aria-label={t('addToCartFor', { productName: product.productNameCanonical })}
    >
      {/* {isLoading ? t('addingToCart') : ( */} 
        <>
          <ShoppingCart className={isCompact ? "mr-1 h-3 w-3" : "mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4"} /> 
          {t('addToCart')}
        </>
      {/* )} */} 
    </Button>
  );
} 