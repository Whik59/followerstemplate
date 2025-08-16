import { Product } from './product';
import type { CurrencyInfo } from '@/types/currency'; // Import CurrencyInfo
import type { GiftTier } from '@/lib/config/gifts'; // Import GiftTier

// Represents a single item in the shopping cart
export interface CartItem {
  productId: number; // From Product
  productNameCanonical: string; // From Product
  productNameLocalized?: { [locale: string]: string }; // Added for localized names
  localizedShortTitle?: { [locale: string]: string }; // ADDED: For localized short titles
  slugOverride?: string; // ADDED: To store the product slug, e.g., from MDX slugOverride
  variantId?: string; // ENSURE THIS EXISTS: For unique identification of a variant
  productNameWithVariant?: string; // ENSURE THIS EXISTS: For displaying product name + variant in cart
  imagePath?: string; // First image from Product.imagePaths
  price: number; // This will store the localized DISDCOUNTED price after conversion
  originalPrice?: number; // ADDED: Localized ORIGINAL price (before discount)
  basePriceUSD: number; // The original DISDCOUNTED price in USD (or your base currency)
  originalBasePriceUSD?: number; // ADDED: The ORIGINAL price in USD (before discount)
  quantity: number;
  currencySymbol: string; // The symbol for the localized price (e.g., €, $)
  // variationDetails could include things like size, color, if your products have variations
  // For example: variationDetails?: { [key: string]: string }; 
  // For now, we'll keep it simple. If variations affect price, the selected variation's price should be used.
  // We'll assume price in CartItem is the final price for that item configuration.
}

export interface GiftProgressInfo {
  currentTier?: GiftTier; // The highest tier unlocked
  nextTier?: GiftTier; // The next tier to aim for
  localizedAmountNeededForNextTier?: number;
  localizedCurrentGiftValue?: number; // Value of the currently unlocked gift, localized
  localizedNextGiftValue?: number;    // Value of the next gift, localized
  progressPercentage: number; // 0-100 for the progress bar
  isFinalTierUnlocked: boolean;
}

// Represents the overall state of the shopping cart
export interface CartState {
  items: CartItem[]; // Array of cart items with localized prices
  itemCount: number; // Total number of individual items (sum of quantities)
  totalPrice: number; // This will be the localized total DISDCOUNTED price
  originalTotalPrice?: number; // ADDED: Localized total ORIGINAL price (before discount)
  baseTotalPriceUSD: number; // Total DISDCOUNTED price in base currency (USD)
  baseOriginalTotalPriceUSD?: number; // ADDED: Total ORIGINAL price in base currency (USD)
  currency: CurrencyInfo | null; // Currency info for the localized total price
  giftProgress?: GiftProgressInfo; // New field for gift progress
  geoCountryCode: string; // Added for geo-specific currency logic
  formattingLocale: string; // Added for geo-specific number formatting
}

// Actions that can be dispatched to update the cart state (for context reducer, if used)
// export type CartAction = 
//   | { type: 'ADD_ITEM'; payload: CartItem }
//   | { type: 'REMOVE_ITEM'; payload: { productId: number /* add variationId if needed */ } }
//   | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number /* add variationId if needed */ } }
//   | { type: 'CLEAR_CART' }
//   | { type: 'LOAD_CART'; payload: CartState }; // For loading from localStorage 