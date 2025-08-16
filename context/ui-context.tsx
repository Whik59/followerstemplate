'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/types/product'; // Assuming Product type is here

// Define the shape of the product data for the sticky bar
export interface StickyBarProductData {
  imagePath?: string;
  displayTitle: string;
  activeDisplayPrice?: string;
  stockCount: number;
  shippingTimeInfo: string;
  productUrl: string;
  // Data needed for adding to cart
  productForCart: Product; // The full product object for the cart
  priceForCart: number;   // The price to use when adding to cart
  locale: string; // Needed for cart item localization
  productSlug: string; // Needed for cart item localization
}

interface UIContextType {
  isProductStickyBarVisible: boolean;
  setIsProductStickyBarVisible: (isVisible: boolean) => void;
  stickyBarProductDetails: StickyBarProductData | null;
  setStickyBarProductDetails: (details: StickyBarProductData | null) => void;
  // Potentially add other global UI states here later
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isProductStickyBarVisible, setIsProductStickyBarVisible] = useState(false);
  const [stickyBarProductDetails, setStickyBarProductDetails] = useState<StickyBarProductData | null>(null);

  return (
    <UIContext.Provider 
      value={{
        isProductStickyBarVisible, 
        setIsProductStickyBarVisible, 
        stickyBarProductDetails,
        setStickyBarProductDetails
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUIContext(): UIContextType {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
} 