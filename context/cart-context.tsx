'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { CartItem, CartState, GiftProgressInfo } from '@/types/cart';
import { Product } from '@/types/product';
import { convertPrice, getCurrencyForCountry } from '@/lib/utils/currency'; // Import currency utils
import type { CurrencyInfo } from '@/types/currency'; 
import { GIFT_TIERS, GiftTier } from '@/lib/config/gifts'; // Import gift configuration

interface CartContextType extends CartState {
  addItem: (product: Product, quantity: number, selectedPriceUSD?: number, onComplete?: () => void) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (itemId: string) => CartItem | undefined;
  isDrawerOpen: boolean; // New: Drawer state
  openDrawer: () => void;  // New: Function to open drawer
  closeDrawer: () => void; // New: Function to close drawer
  // Note: The main CartState (itemCount, totalPrice, currency) will be localized
  geoCountryCode: string;
  formattingLocale: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialCartStateDefinition = (geoCountryCode: string, formattingLocale: string): CartState => ({
  items: [],
  itemCount: 0,
  totalPrice: 0,
  baseTotalPriceUSD: 0,
  currency: null,
  giftProgress: {
    progressPercentage: 0,
    isFinalTierUnlocked: false,
  },
  geoCountryCode,
  formattingLocale,
});

interface StoredCartItemData {
  productId: number;
  productNameCanonical: string;
  productNameLocalized?: { [locale: string]: string }; // Added for localized names
  localizedShortTitle?: { [locale: string]: string }; // ADDED
  slugOverride?: string; // <<< ADDED slugOverride here
  variantId?: string; // ADDED: For unique identification of a variant
  productNameWithVariant?: string; // ADDED: For displaying product name + variant
  imagePath?: string;
  basePriceUSD: number; // This is the discounted price
  originalBasePriceUSD?: number; // ADDED: Artificial original price
  quantity: number;
}

// Calculates totals, localizes prices, AND determines gift progress
function calculateAndLocalizeCart(
  storedItemsData: StoredCartItemData[], 
  geoCountryCode: string, 
  formattingLocale: string // Added parameter
): CartState {
  const baseTotalPriceUSD_items = storedItemsData.reduce((sum, item) => sum + item.basePriceUSD * item.quantity, 0);
  
  let baseOriginalTotalPriceUSD_items = storedItemsData.reduce((sum, item) => {
    const originalItemPrice = item.originalBasePriceUSD || (item.basePriceUSD / 0.7); 
    return sum + originalItemPrice * item.quantity;
  }, 0);
  const itemCount = storedItemsData.reduce((sum, item) => sum + item.quantity, 0);
  
  let overallLocalizedTotalPrice_items = 0;
  let overallLocalizedOriginalTotalPrice_items = 0; 
  const defaultCurrency = getCurrencyForCountry(geoCountryCode); 

  const localizedCartItems: CartItem[] = storedItemsData.map(storedItem => {
    const conversionResult = convertPrice(storedItem.basePriceUSD, geoCountryCode);
    const localizedPrice = conversionResult ? conversionResult.convertedPrice : storedItem.basePriceUSD;
    const itemCurrencyInfo = conversionResult ? conversionResult.currency : defaultCurrency;
    
    overallLocalizedTotalPrice_items += localizedPrice * storedItem.quantity;

    let localizedOriginalPrice: number | undefined = undefined;
    if (storedItem.originalBasePriceUSD) {
      const originalConversionResult = convertPrice(storedItem.originalBasePriceUSD, geoCountryCode);
      localizedOriginalPrice = originalConversionResult ? originalConversionResult.convertedPrice : storedItem.originalBasePriceUSD;
      overallLocalizedOriginalTotalPrice_items += (localizedOriginalPrice || 0) * storedItem.quantity;
    } else {
      const calculatedOriginalPrice = localizedPrice / 0.7;
      localizedOriginalPrice = calculatedOriginalPrice;
      overallLocalizedOriginalTotalPrice_items += calculatedOriginalPrice * storedItem.quantity;
    }
    

    return {
      ...storedItem,
      price: localizedPrice, // Localized discounted price for this item
      originalPrice: localizedOriginalPrice, // ADDED: Localized original price for this item
      originalBasePriceUSD: storedItem.originalBasePriceUSD || (storedItem.basePriceUSD / 0.7), // Ensure this is set
      currencySymbol: itemCurrencyInfo.symbol, // Symbol for this item
      variantId: storedItem.variantId,
      productNameWithVariant: storedItem.productNameWithVariant,
    };
  });

  // --- Gift Progress Logic --- 
  let currentTier: GiftTier | undefined = undefined;
  let nextTier: GiftTier | undefined = undefined;
  let localizedAmountNeededForNextTier: number | undefined = undefined;
  let localizedCurrentGiftValue: number | undefined = undefined;
  let localizedNextGiftValue: number | undefined = undefined;
  let progressPercentage = 0;
  let isFinalTierUnlocked = false;

  // Find the highest unlocked tier
  for (let i = GIFT_TIERS.length - 1; i >= 0; i--) {
    if (baseTotalPriceUSD_items >= GIFT_TIERS[i].thresholdUSD) {
      currentTier = GIFT_TIERS[i];
      break;
    }
  }

  if (currentTier) {
    const currentGiftValueConversion = convertPrice(currentTier.giftValueUSD, geoCountryCode);
    localizedCurrentGiftValue = currentGiftValueConversion ? currentGiftValueConversion.convertedPrice : currentTier.giftValueUSD;
    
    // Find the next tier after the current one
    const currentTierIndex = GIFT_TIERS.findIndex(t => t.id === currentTier!.id);
    if (currentTierIndex < GIFT_TIERS.length - 1) {
      nextTier = GIFT_TIERS[currentTierIndex + 1];
    } else {
      isFinalTierUnlocked = true; // Current tier is the highest, so final tier unlocked
    }
  } else {
    // No tier unlocked, so the next tier is the first one
    if (GIFT_TIERS.length > 0) {
      nextTier = GIFT_TIERS[0];
    }
  }

  if (nextTier) {
    const nextGiftValueConversion = convertPrice(nextTier.giftValueUSD, geoCountryCode);
    localizedNextGiftValue = nextGiftValueConversion ? nextGiftValueConversion.convertedPrice : nextTier.giftValueUSD;

    const amountNeededUSD = nextTier.thresholdUSD - baseTotalPriceUSD_items;
    const amountNeededConversion = convertPrice(amountNeededUSD > 0 ? amountNeededUSD : 0, geoCountryCode);
    localizedAmountNeededForNextTier = amountNeededConversion ? amountNeededConversion.convertedPrice : (amountNeededUSD > 0 ? amountNeededUSD : 0);
    
    // Calculate progress percentage towards the next tier
    // If currentTier exists, progress is from currentTier.threshold to nextTier.threshold
    // If no currentTier, progress is from 0 to nextTier.threshold
    const lowerBoundUSD = currentTier ? currentTier.thresholdUSD : 0;
    const upperBoundUSD = nextTier.thresholdUSD;
    if (upperBoundUSD > lowerBoundUSD) {
        const progress = (baseTotalPriceUSD_items - lowerBoundUSD) / (upperBoundUSD - lowerBoundUSD);
        progressPercentage = Math.min(Math.max(progress * 100, 0), 100); 
    }
  } else if (currentTier && isFinalTierUnlocked) {
    // All tiers unlocked, progress is 100%
    progressPercentage = 100;
  }
  // If no tiers at all, or if something unexpected, percentage remains 0.

  const giftProgress: GiftProgressInfo = {
    currentTier,
    nextTier,
    localizedAmountNeededForNextTier,
    localizedCurrentGiftValue,
    localizedNextGiftValue,
    progressPercentage,
    isFinalTierUnlocked,
  };
  // --- End Gift Progress Logic ---

  // Adjust original totals to include gift value if a gift is unlocked
  let finalBaseOriginalTotalPriceUSD = baseOriginalTotalPriceUSD_items;
  let finalOverallLocalizedOriginalTotalPrice = overallLocalizedOriginalTotalPrice_items;

  if (currentTier && localizedCurrentGiftValue !== undefined) {
    finalBaseOriginalTotalPriceUSD += currentTier.giftValueUSD;
    finalOverallLocalizedOriginalTotalPrice += localizedCurrentGiftValue;
  }

  return {
    items: localizedCartItems,
    itemCount,
    totalPrice: overallLocalizedTotalPrice_items, // This is the amount the user pays
    originalTotalPrice: finalOverallLocalizedOriginalTotalPrice, // This includes the gift value for display
    baseTotalPriceUSD: baseTotalPriceUSD_items, // Base USD sum of actual items
    baseOriginalTotalPriceUSD: finalBaseOriginalTotalPriceUSD, // Base USD sum of actual items + gift value
    currency: defaultCurrency, 
    giftProgress, 
    geoCountryCode,
    formattingLocale,
  };
}

interface CartProviderProps {
  children: ReactNode;
  geoCountryCode: string;
  formattingLocale: string;
}

export function CartProvider({ children, geoCountryCode, formattingLocale }: CartProviderProps) {
  // console.log('[CartProvider] Initializing with locale prop:', locale);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  // Initialize state from localStorage or default
  const [cartState, setCartState] = useState<CartState>(() => {
    // Initialize with props from CartProvider
    const initialState = initialCartStateDefinition(geoCountryCode, formattingLocale);
    if (typeof window !== 'undefined') {
      const storedItems = localStorage.getItem('shoppingCart');
      if (storedItems) {
        try {
          const parsedItems: StoredCartItemData[] = JSON.parse(storedItems);
          // Pass formattingLocale from props here
          return calculateAndLocalizeCart(parsedItems, geoCountryCode, formattingLocale);
        } catch (e) {
          localStorage.removeItem('shoppingCart');
        }
      }
    }
    return initialState; // Return initial state using props if local storage is empty or invalid
  });

  // Effect to update cart if geoCountryCode or formattingLocale changes (e.g., user logs in from different IP)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedItemsJson = localStorage.getItem('shoppingCart');
      let storedItemsData: StoredCartItemData[] = [];
      if (storedItemsJson) {
        try {
          storedItemsData = JSON.parse(storedItemsJson);
        } catch (e) {
          console.error('[CartProvider] Error parsing stored cart items on geo change:', e);
          localStorage.removeItem('shoppingCart'); // Clear invalid data
        }
      }
      setCartState(calculateAndLocalizeCart(storedItemsData, geoCountryCode, formattingLocale));
    }
  }, [geoCountryCode, formattingLocale]);

  const addItem = (product: Product, quantity: number, selectedPriceUSD?: number, onComplete?: () => void) => {
    console.log("[CartContext] addItem called. Product received:", JSON.stringify(product, null, 2));
    console.log("[CartContext] Product variantId received by addItem:", product.variantId);
    console.log("[CartContext] Product slugOverride received by addItem:", product.slugOverride);

    if (!product.variantId) {
      console.error("[CartContext] CRITICAL WARNING: Product received by addItem is MISSING variantId. Product ID:", product.productId, "Name:", product.productNameCanonical, product);
      // Fallback or error handling if variantId is absolutely required.
      // For now, we'll proceed, but this indicates an issue upstream.
    }

    const itemBasePriceUSD = selectedPriceUSD !== undefined ? selectedPriceUSD : product.basePrice;
    const itemOriginalBasePriceUSD = product.basePrice / 0.7; // Example: always 30% markup for "original"

    let currentStoredItems: StoredCartItemData[] = [];
    if (typeof window !== 'undefined') {
      const storedItemsJson = localStorage.getItem('shoppingCart');
      if (storedItemsJson) {
        try {
          currentStoredItems = JSON.parse(storedItemsJson);
        } catch (e) {
          console.error('[CartContext] Error parsing stored cart items in addItem:', e);
          // Potentially clear localStorage if corrupt
        }
      }
    }

    // Use variantId for existing item check if available, otherwise productId
    const itemIdentifier = product.variantId || product.productId.toString();
    const existingItemIndex = currentStoredItems.findIndex(item => (item.variantId || item.productId.toString()) === itemIdentifier);

    let updatedStoredItems;
    if (existingItemIndex > -1) {
      updatedStoredItems = currentStoredItems.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      const newItemData: StoredCartItemData = {
        productId: product.productId,
        variantId: product.variantId, // Store variantId
        productNameCanonical: product.productNameCanonical,
        productNameLocalized: product.productNameLocalized,
        localizedShortTitle: product.localizedShortTitle,
        productNameWithVariant: product.productNameWithVariant, // Store name with variant
        slugOverride: product.slugOverride,
        imagePath: product.imagePaths?.[0],
        basePriceUSD: itemBasePriceUSD,
        originalBasePriceUSD: itemOriginalBasePriceUSD,
        quantity,
      };
      updatedStoredItems = [...currentStoredItems, newItemData];
    }

    // This is where state is actually saved to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('shoppingCart', JSON.stringify(updatedStoredItems));
    }
    
    // Recalculate and set the new cart state
    setCartState(calculateAndLocalizeCart(updatedStoredItems, geoCountryCode, formattingLocale));
    
    if (onComplete) {
      onComplete();
    } else {
      openDrawer(); // Only open drawer if no callback is provided
    }
  };

  const removeItem = (itemId: string) => { // itemId is expected to be variantId
    let currentStoredItems: StoredCartItemData[] = [];
    if (typeof window !== 'undefined') {
      const storedItemsJson = localStorage.getItem('shoppingCart');
      if (storedItemsJson) {
        try {
          currentStoredItems = JSON.parse(storedItemsJson);
        } catch (e) { /* Handle error */ }
      }
    }
    const updatedStoredItems = currentStoredItems.filter(item => (item.variantId || item.productId.toString()) !== itemId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shoppingCart', JSON.stringify(updatedStoredItems));
    }
    setCartState(calculateAndLocalizeCart(updatedStoredItems, geoCountryCode, formattingLocale));
  };

  const updateQuantity = (itemId: string, quantity: number) => { // itemId is expected to be variantId
    let currentStoredItems: StoredCartItemData[] = [];
    if (typeof window !== 'undefined') {
      const storedItemsJson = localStorage.getItem('shoppingCart');
      if (storedItemsJson) {
        try {
          currentStoredItems = JSON.parse(storedItemsJson);
        } catch (e) { /* Handle error */ }
      }
    }
    
    let updatedStoredItems;
    if (quantity <= 0) {
      updatedStoredItems = currentStoredItems.filter(item => (item.variantId || item.productId.toString()) !== itemId);
    } else {
      updatedStoredItems = currentStoredItems.map(item =>
        (item.variantId || item.productId.toString()) === itemId ? { ...item, quantity } : item
      );
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('shoppingCart', JSON.stringify(updatedStoredItems));
    }
    setCartState(calculateAndLocalizeCart(updatedStoredItems, geoCountryCode, formattingLocale));
  };

  const clearCart = () => {
    if (typeof window !== 'undefined') {
    localStorage.removeItem('shoppingCart');
    }
    setCartState(initialCartStateDefinition(geoCountryCode, formattingLocale));
  };

  const getItem = (itemId: string): CartItem | undefined => { // itemId is expected to be variantId
    return cartState.items.find(item => (item.variantId || item.productId.toString()) === itemId);
  }

  return (
    <CartContext.Provider value={{ ...cartState, addItem, removeItem, updateQuantity, clearCart, getItem, isDrawerOpen, openDrawer, closeDrawer }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 