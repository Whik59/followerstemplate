'use client';

import React, { useState, Suspense, useEffect, useRef, useCallback } from 'react';
import { useCart } from '@/context/cart-context';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/currency';
import { Separator } from '@/components/ui/separator';
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Lock, Gift, Plus, Minus, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Lottie from 'lottie-react';

// Import payment components
import { StripeRedirectCheckoutButton } from '@/components/common/stripe-redirect-checkout-button';
import { PayPalCheckout } from '@/components/common/paypal-checkout';
import { NowPaymentsButton } from '@/components/common/nowpayments-button';
import { CartItem as AppCartItem } from '@/types/cart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from '@/types/product';

export const dynamic = 'force-dynamic';

interface FormData {
  email: string;
  shippingName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  billingSameAsShipping: boolean;
  billingName?: string;
  billingStreet?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;
}

// Define LoggedCartItem interface based on usage in the useEffect hook
interface LoggedCartItem {
  productId: string | number; // productId can be string or number based on usage
  productName?: string;
  price?: string | number;
  variantId?: string;
  productImage?: string;
  productUrl?: string;
  quantity?: string | number;
}

// Sample list of cryptocurrencies - verify these codes with NOWPayments documentation!
const supportedCryptoCurrencies = [
  { code: 'btc', name: 'Bitcoin (BTC)' },
  { code: 'eth', name: 'Ethereum (ETH)' },
  { code: 'ltc', name: 'Litecoin (LTC)' },
  // For USDT, NOWPayments might expect a more specific code like 'usdt.erc20', 'usdt.trc20', 'usdt.polygon' etc.
  // Using a generic 'usdt' might work or might need adjustment based on NOWPayments behavior and your account settings.
  { code: 'usdt', name: 'Tether (USDT)' }, 
  { code: 'doge', name: 'Dogecoin (DOGE)' },
  { code: 'sol', name: 'Solana (SOL)' },
  { code: 'ada', name: 'Cardano (ADA)' },
  // For USDC, similar to USDT, network-specific codes like 'usdc.erc20', 'usdc.polygon' might be needed.
  { code: 'usdc', name: 'USD Coin (USDC)' }, 
  { code: 'xrp', name: 'Ripple (XRP)' }, // XRP might require destination tags; check NOWPayments handling.
  { code: 'dot', name: 'Polkadot (DOT)' },
  { code: 'trx', name: 'Tron (TRX)' },
  // Add more as needed, ensuring codes are valid for NOWPayments /invoice endpoint
];

function LottieAnimation3() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/lottie/animation3.json')
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error('Error loading Lottie animation 3:', error));
  }, []);

  if (!animationData) {
    return null; 
  }

  return <Lottie animationData={animationData} className="w-full max-w-[150px] mx-auto" style={{ marginTop: '-40px', marginBottom: '-40px' }} />;
}

export default function CheckoutPage() {
  const { items: cartItems, totalPrice, currency, clearCart, itemCount, originalTotalPrice, updateQuantity, removeItem, addItem } = useCart();
  const t = useTranslations('Common');
  const tCart = useTranslations('Common');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDisplayLocale = pathname.split('/')[1] || 'en';

  const [formData, setFormData] = useState<FormData>({
    email: '',
    shippingName: '',
    shippingStreet: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: '',
    billingSameAsShipping: true,
  });

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedPayCurrency, setSelectedPayCurrency] = useState<string>(supportedCryptoCurrencies[0].code); // Default to the first crypto

  // Abandoned cart logging state
  const [isLoggingAbandonedCart, setIsLoggingAbandonedCart] = useState(false);

  // Coupon Code State
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Coupon Code State and Data
  interface Coupon {
    code: string;
    type: 'percentage' | 'fixed' | 'shipping';
    value: number;
    minSpend?: number;
    // validUntil?: string; // REMOVED: No longer tracking expiry client-side for these
  }
  // MODIFIED: Update type for appliedCouponDetails to remove validUntil
  const [appliedCouponDetails, setAppliedCouponDetails] = useState<Omit<Coupon, 'validUntil'> | null>(null);

  const currentCurrencyCode = (currency?.code || 'USD').toLowerCase();

  // Add state for username/publication link per item
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  // --- BEGIN DISCOUNT BANNER STATE ---
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer <= 0) return;
    timerRef.current = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timer]);

  const minutes = String(Math.floor(timer / 60)).padStart(2, '0');
  const seconds = String(timer % 60).padStart(2, '0');
  // --- END DISCOUNT BANNER STATE ---

  // Effect for abandoned cart recovery
  useEffect(() => {
    const cartRef = searchParams.get('cart_ref');
    const utmSource = searchParams.get('utm_source');

    if (cartRef && utmSource === 'abandoned_cart') {
      const fetchAndRestoreCart = async () => {
        console.log(`[Checkout] Attempting to restore abandoned cart for: ${cartRef}`);
        try {
          const response = await fetch(`/api/abandoned-cart/retrieve?email=${encodeURIComponent(cartRef)}`);
          if (response.ok) {
            const recoveredCart = await response.json() as { cartItems: LoggedCartItem[] };
            if (recoveredCart && recoveredCart.cartItems && recoveredCart.cartItems.length > 0) {
              clearCart(); 

              recoveredCart.cartItems.forEach((loggedItem: LoggedCartItem) => {
                // Construct productForCart to match the imported Product type
                const productForCart: Product = {
                  productId: Number(loggedItem.productId),
                  productNameCanonical: loggedItem.productName || 'Recovered Item',
                  basePrice: Number(loggedItem.price) || 0,
                  variantId: loggedItem.variantId,
                  slugOverride: loggedItem.productUrl ? new URL(loggedItem.productUrl).pathname.split('/').pop() : undefined,
                  categoryIds: [],
                  imagePaths: loggedItem.productImage ? [loggedItem.productImage] : [],
                  variations: []
                };

                const quantity = Number(loggedItem.quantity) || 1;
                const price = Number(loggedItem.price) || 0;

                addItem(productForCart, quantity, price);
              });

              // Pre-fill email in the form
              setFormData(prev => ({ ...prev, email: cartRef }));
              
              console.log(`[Checkout] Abandoned cart restored successfully for: ${cartRef} with ${recoveredCart.cartItems.length} items.`);

              // Clean URL: remove cart_ref and utm_source
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('cart_ref');
              newUrl.searchParams.delete('utm_source');
              newUrl.searchParams.delete('utm_medium'); // also remove utm_medium
              router.replace(newUrl.pathname + newUrl.search, { scroll: false });

            } else {
              console.warn(`[Checkout] Abandoned cart for ${cartRef} not found or was empty via API. Response:`, recoveredCart);
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('cart_ref');
              newUrl.searchParams.delete('utm_source');
              newUrl.searchParams.delete('utm_medium');
              router.replace(newUrl.pathname + newUrl.search, { scroll: false });
            }
          } else {
            const errorText = await response.text();
            console.error(`[Checkout] Failed to retrieve abandoned cart for ${cartRef}. Status: ${response.status}. Error: ${errorText}`);
          }
        } catch (error) {
          console.error(`[Checkout] Error fetching or restoring abandoned cart for ${cartRef}:`, error);
        }
      };

      fetchAndRestoreCart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [searchParams, router, clearCart, addItem, setFormData]); // Added router, clearCart, addItem, setFormData to deps array

  // Helper to format currency for display in messages (specific to this component)
  const formatDisplayCurrencyCheckout = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return formatCurrency({ amount, currencyCode: currentCurrencyCode.toUpperCase(), locale: currentDisplayLocale });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Items for Stripe API (ensure your CartItem type matches what API expects)
  const stripeApiItems: AppCartItem[] = cartItems.map(item => ({
    ...item,
    name: item.productNameLocalized?.[currentDisplayLocale] || item.productNameCanonical,
    description: item.productNameLocalized?.[currentDisplayLocale] || item.productNameCanonical,
    currencyCode: currentCurrencyCode, // Add currency code to each item for API if needed
  }));

  // Prepare items for PayPal (amount as string)
  const payPalItems = cartItems.map(item => ({
    name: item.productNameLocalized?.[currentDisplayLocale] || item.productNameCanonical,
    description: item.productNameLocalized?.[currentDisplayLocale] || item.productNameCanonical,
    unit_amount: {
      currency_code: currentCurrencyCode.toUpperCase(),
      value: item.price.toFixed(2),
    },
    quantity: item.quantity.toString(),
    sku: item.variantId || item.productId.toString(), // Added SKU for PayPal item
  }));

  const totalPayPalAmount = {
    currency_code: (currency?.code ?? 'USD'),
    value: totalPrice.toFixed(2),
    breakdown: {
      item_total: {
        currency_code: (currency?.code ?? 'USD'),
        value: totalPrice.toFixed(2),
      },
    },
  };

  function handleStripeCheckoutInitiate() {
    setIsProcessingPayment(true);
    setPaymentError(null); // Clear previous errors
  }

  function handleStripeError(errorMsg: string) {
    console.error('Stripe Checkout Error on Page:', errorMsg);
    setIsProcessingPayment(false);
    setPaymentError(errorMsg || t('paymentErrorOccurred'));
  }

  function handlePayPalSuccess(details: unknown) {
    console.log('[PayPal] Payment successful:', details);
    setIsProcessingPayment(false);
    clearCart();
    router.push(`/${currentDisplayLocale}/payment-success?method=paypal`); // Simpler success redirect for now
  }

  function handlePayPalError(error: unknown) {
    let message = '';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = 'An unknown error occurred with PayPal.';
    }
    console.error('[PayPal] Payment error:', error);
    setPaymentError(t('payPalProcessingError') + ': ' + message);
    setIsProcessingPayment(false);
  }

  function handlePayPalCancel() {
    console.log('PayPal Payment Cancelled');
    setIsProcessingPayment(false);
    setPaymentError(t('paymentCancelled'));
  }
  
  const validCoupons: Coupon[] = [
    { code: 'SAVE10', type: 'percentage', value: 10, minSpend: 50 },
    { code: '5OFF', type: 'fixed', value: 5, minSpend: 20 },
    // { code: 'FREESHIP', type: 'shipping', value: 0 }, // Shipping coupons need more logic for shippingCost state
    { code: '10FIRST', type: 'percentage', value: 10 }, // REMOVED validUntil
    { code: '20TWO', type: 'percentage', value: 20 }, // REMOVED validUntil
    { code: '30LAST', type: 'percentage', value: 30 },  // REMOVED validUntil
    { code: '1HOUR', type: 'percentage', value: 30 },
    // New welcome coupon
    { code: 'WELCOME', type: 'percentage', value: 5 },
  ];

  const handleApplyCoupon = useCallback(() => {
    setCouponMessage(null);
    setDiscountAmount(0);
    setAppliedCouponDetails(null); 

    const enteredCode = couponCodeInput.trim().toUpperCase();
    const coupon = validCoupons.find(c => c.code === enteredCode);

    if (!coupon) {
      setCouponMessage(t('invalidCouponCode'));
      return;
    }

    if (coupon.minSpend && totalPrice < coupon.minSpend) {
      setCouponMessage(t('couponMinSpendNotMet', { amount: formatDisplayCurrencyCheckout(coupon.minSpend), code: coupon.code }));
      return;
    }

    let calculatedDiscount = 0;
    if (coupon.type === 'percentage') {
      calculatedDiscount = (totalPrice * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      calculatedDiscount = coupon.value;
    } else if (coupon.type === 'shipping') {
      setCouponMessage(t('couponShippingNotApplicable'));
      return; 
    }

    calculatedDiscount = Math.min(calculatedDiscount, totalPrice);

    setDiscountAmount(calculatedDiscount);
    setAppliedCouponDetails(coupon);
    setCouponMessage(t('couponAppliedSuccess', { code: coupon.code, savedAmount: formatDisplayCurrencyCheckout(calculatedDiscount) }));
    setCouponCodeInput('');
  }, [couponCodeInput, validCoupons, t, totalPrice, formatDisplayCurrencyCheckout]);

  useEffect(() => {
    if (!appliedCouponDetails) {
      setCouponCodeInput('WELCOME');
      setTimeout(() => {
        handleApplyCoupon();
      }, 0);
    }
  }, [appliedCouponDetails, handleApplyCoupon]);
  
  const shippingCost = 0; // Placeholder
  const taxes = 0; // Placeholder
  // MODIFIED: Subtract discountAmount from finalTotal
  const finalTotal = totalPrice + shippingCost + taxes - discountAmount;

  if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_BASE_URL) {
    console.error("CRITICAL: NEXT_PUBLIC_BASE_URL is not set in .env.local. Payment redirects might fail.");
  }
   if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    // This is less critical for redirect checkout, but good to be aware of if you ever mix strategies
    // console.warn("FYI: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Not needed for redirect checkout, but Stripe.js won't load.");
  }

  if (itemCount === 0 && typeof window !== 'undefined') {
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl font-semibold mb-6">{t('yourCartIsEmpty')}</h1>
            <p className="text-lg text-muted-foreground mb-8">{t('addItemsToCheckout')}</p>
            <Button asChild size="lg">
                <Link href={`/${currentDisplayLocale}/products`}>{tCart('continueShopping')}</Link>
            </Button>
        </div>
    );
  }

  const isFormPotentiallyValid = !!formData.email;

  const dynamicStripeButtonText = t('payWithCard') + ` (${formatCurrency({ amount: finalTotal, currencyCode: currentCurrencyCode.toUpperCase(), locale: currentDisplayLocale })})`;

  // --- BEGIN ABANDONED CART LOGIC ---
  const handleEmailBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    const email = event.target.value;
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(email) && cartItems.length > 0 && !isLoggingAbandonedCart) {
      setIsLoggingAbandonedCart(true);
      // console.log('Email field lost focus, logging abandoned cart for:', email);
      // console.log('Cart items:', cartItems);

      // Prepare cart items for logging - adapt based on what your API expects
      // and what details are useful for the abandoned cart email.
      const itemsToLog = cartItems.map(item => ({
        productId: item.variantId || item.productId.toString(),
        productName: item.productNameWithVariant || item.productNameCanonical,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        currencyCode: currency?.code || 'USD',
        imagePath: item.imagePath,
        // productUrl: `/${currentDisplayLocale}/products/${item.slugOverride || item.productId}`
      }));

      try {
        const response = await fetch('/api/abandoned-cart/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, cartItems: itemsToLog, locale: currentDisplayLocale }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to log abandoned cart:', response.status, errorData.message);
          // Optionally, set an error state to inform the user, though it's a background task.
        } else {
          // const successData = await response.json();
          // console.log('Abandoned cart logged successfully:', successData);
        }
      } catch (error) {
        console.error('Error calling abandoned cart logging API:', error);
      } finally {
        setIsLoggingAbandonedCart(false);
      }
    }
  };
  // --- END ABANDONED CART LOGIC ---

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <LottieAnimation3 />

      <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-amber-600 dark:text-amber-500">{t('customerInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">{t('emailAddressLabel')}</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={t('emailPlaceholder')}
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                  required
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* WELCOME Coupon Card */}
          <Card className="border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/80 via-white/80 to-orange-50/80 dark:from-amber-900/40 dark:via-amber-800/30 dark:to-orange-900/30 shadow-md flex flex-col items-center p-6 my-2">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-7 h-7 text-amber-500" />
            </div>
            <div className="text-center text-sm text-gray-700 dark:text-gray-200 mb-3">
              <span>{t('couponWelcomeDescription')}</span>
            </div>
            <div className="flex gap-2 w-full max-w-xs mx-auto">
              <Input
                type="text"
                id="welcome-coupon-input"
                value={couponCodeInput === '' ? 'WELCOME' : couponCodeInput}
                onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                className="h-10 text-center font-mono tracking-widest bg-white/80 dark:bg-slate-900/60 border-amber-200 dark:border-amber-700"
                maxLength={16}
                disabled={!!appliedCouponDetails}
              />
              <Button
                type="button"
                onClick={() => {
                  setCouponCodeInput('WELCOME');
                  handleApplyCoupon();
                }}
                disabled={!!appliedCouponDetails || (couponCodeInput.toUpperCase() === 'WELCOME' && !!appliedCouponDetails && (appliedCouponDetails as { code: string }).code === 'WELCOME')}
                className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
              >
                {t('applyCouponButton')}
              </Button>
            </div>
            {(!!appliedCouponDetails && (appliedCouponDetails as { code: string }).code === 'WELCOME' && discountAmount > 0) && (
              <div className="mt-2 text-green-600 dark:text-green-400 text-xs font-medium">{t('couponAppliedSuccess', { code: 'WELCOME', savedAmount: formatDisplayCurrencyCheckout(discountAmount) })}</div>
            )}
            {couponMessage && couponCodeInput.toUpperCase() === 'WELCOME' && (
              <div className={`mt-2 text-xs ${!!appliedCouponDetails && discountAmount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{couponMessage}</div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card className="sticky top-24 border-amber-300 dark:border-amber-700/60 bg-amber-50/30 dark:bg-slate-800/30 shadow-lg hover:shadow-amber-500/10 dark:hover:shadow-amber-400/5 transition-shadow duration-300">
            <CardHeader className="border-b border-amber-200 dark:border-amber-700/40 pb-4">
              <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">{t('orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {cartItems.map(item => {
                const displayName = item.productNameWithVariant ||
                                  item.localizedShortTitle?.[currentDisplayLocale] ||
                                  item.localizedShortTitle?.['en'] ||
                                  item.productNameLocalized?.[currentDisplayLocale] ||
                                  item.productNameLocalized?.['en'] ||
                                  item.productNameCanonical;
                const itemKey = item.variantId || item.productId.toString();

                // Add state for username/publication link per item
                if (!userInputs[itemKey]) userInputs[itemKey] = '';

                return (
                  <div key={itemKey} className="flex flex-col py-2 border-b last:border-b-0">
                    <div className="flex justify-between items-start text-sm">
                      <div className="flex items-start space-x-2">
                        <div className="relative w-12 h-12 rounded overflow-hidden border flex-shrink-0">
                            {item.imagePath ? (
                                <Image src={item.imagePath} alt={displayName} fill sizes="48px" className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">{tCommon('noImageShort')}</div>
                            )}
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium leading-tight">{displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {tCart('unitPrice')}: 
                            {formatCurrency({ amount: item.price, currencyCode: currentCurrencyCode.toUpperCase(), locale: currentDisplayLocale })}
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="line-through text-xs ml-1 text-gray-500 dark:text-gray-400">
                                {formatCurrency({ amount: item.originalPrice, currencyCode: currentCurrencyCode.toUpperCase(), locale: currentDisplayLocale })}
                              </span>
                            )}
                          </p>
                          {/* Username or publication link input */}
                          <div className="mt-2">
                            <Label htmlFor={`userInput-${itemKey}`} className="text-xs font-medium">
                              {t('usernameOrPublicationLabel', {defaultValue: 'Username or publication link'})}
                            </Label>
                            <Input
                              id={`userInput-${itemKey}`}
                              name={`userInput-${itemKey}`}
                              type="text"
                              required
                              placeholder={t('usernameOrPublicationPlaceholder', {defaultValue: 'Enter username or link...'})}
                              value={userInputs[itemKey] || ''}
                              onChange={e => setUserInputs({ ...userInputs, [itemKey]: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-1.5 space-x-2">
                      <div className="flex items-center border border-border rounded-md h-7">
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="h-full w-7 text-muted-foreground hover:bg-muted/50 rounded-r-none"
                          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={t('decreaseQuantity', { productName: displayName })}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="px-2 text-sm font-medium w-8 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="h-full w-7 text-muted-foreground hover:bg-muted/50 rounded-l-none"
                          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          aria-label={t('increaseQuantity', { productName: displayName })}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive h-7 w-7"
                          onClick={() => removeItem(itemKey)}
                          aria-label={t('removeItemSpecific', { productName: displayName })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* --- COUPON CODE SECTION START --- */}
              <Separator className="my-3" />
              <div className="space-y-2 py-2">
                <Label htmlFor="couponCode" className="text-sm font-medium">{t('couponCodeLabel', {defaultValue: 'Coupon Code'})}</Label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    id="couponCode"
                    placeholder={t('enterCouponPlaceholder', {defaultValue: 'Enter coupon'})}
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    disabled={!!appliedCouponDetails}
                    className="h-10"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={!couponCodeInput.trim() || !!appliedCouponDetails}
                    className="h-10 whitespace-nowrap"
                  >
                    {t('applyCouponButton')}
                  </Button>
                </div>
                {couponMessage && (
                  <p className={`text-xs mt-1 px-1 ${!!appliedCouponDetails && discountAmount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500'}`}>
                    {couponMessage}
                  </p>
                )}
                {appliedCouponDetails && (
                    <Button variant="link" size="sm" className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-0 h-auto mt-1" onClick={() => {
                        setAppliedCouponDetails(null);
                        setDiscountAmount(0);
                        setCouponMessage(t('couponRemoved', {defaultValue: 'Coupon removed.'})); 
                        setCouponCodeInput('');
                    }}>
                        {t('removeCouponButton')}
                    </Button>
                )}
              </div>
              {/* --- COUPON CODE SECTION END --- */}

              {/* Display Discount Line if applicable */}
              {discountAmount > 0 && appliedCouponDetails && (
                <>
                  {/* No extra separator needed here as the coupon section itself is separated */}
                  <div className="flex justify-between text-sm font-medium text-green-700 dark:text-green-500 py-1">
                    <span>{t('discountAppliedLabel', { code: (appliedCouponDetails as { code: string }).code, defaultValue: `Discount (${(appliedCouponDetails as { code: string }).code})` })}</span>
                    <span>- {formatDisplayCurrencyCheckout(discountAmount)}</span>
                  </div>
                </>
              )}

              <Separator />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('shippingTimeInfo')}</span>
                {shippingCost > 0 ? (
                  <span>{formatCurrency({ amount: shippingCost, currencyCode: currentCurrencyCode.toUpperCase(), locale: currentDisplayLocale })}</span>
                ) : (
                  <span className="text-green-600 dark:text-green-400 font-semibold">{t('checkoutFreeShippingText')}</span>
                )}
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{t('total')}</span>
                <div>
                  {(originalTotalPrice && originalTotalPrice > totalPrice) && (
                    <span className="line-through text-sm text-muted-foreground mr-1.5">
                      {formatCurrency({ amount: (originalTotalPrice || 0) + shippingCost + taxes, currencyCode: currentCurrencyCode.toUpperCase(), locale: currentDisplayLocale })}
                    </span>
                  )}
                  <span>{formatCurrency({ amount: finalTotal, currencyCode: currentCurrencyCode.toUpperCase(), locale: currentDisplayLocale })}</span>
                </div>
              </div>

              {/* Display Total Savings (Item Discounts + Coupon Discount) */}
              {(() => {
                const itemDiscountAmount = (originalTotalPrice && originalTotalPrice > totalPrice) ? (originalTotalPrice - totalPrice) : 0;
                const totalSavings = itemDiscountAmount + discountAmount;

                if (totalSavings > 0) {
                  return (
                    <div className="flex justify-between text-sm font-semibold text-green-600 dark:text-green-400 border-t border-amber-200 dark:border-amber-700/40 pt-3 mt-3">
                      <span>{tCart('youSave')}:</span>
                      <span>
                        {formatCurrency({ amount: totalSavings, currencyCode: currentCurrencyCode.toUpperCase(), locale: currentDisplayLocale })}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-amber-200 dark:border-amber-700/40">
                {paymentError && <p className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">{paymentError}</p>}
                
                {!isFormPotentiallyValid && (
                    <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-md text-yellow-700 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-700 text-xs">
                        {t('fillRequiredFieldsToPay')} 
                    </div>
                )}

                <StripeRedirectCheckoutButton 
                    items={stripeApiItems}
                    currency={currentCurrencyCode}
                    locale={currentDisplayLocale} 
                    buttonText={dynamicStripeButtonText}
                    disabled={isProcessingPayment || !isFormPotentiallyValid}
                    onInitiateCheckout={handleStripeCheckoutInitiate}
                    onError={handleStripeError}
                />

                <div className="w-full">
                  <Suspense fallback={<div className='h-[78px] w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md flex items-center justify-center text-sm text-muted-foreground'>Loading PayPal...</div>}>
                    <PayPalCheckout
                      items={payPalItems}
                      purchaseAmount={totalPayPalAmount}
                      onPaymentSuccess={handlePayPalSuccess}
                      onPaymentError={handlePayPalError}
                      onPaymentCancel={handlePayPalCancel}
                      disabled={isProcessingPayment || !isFormPotentiallyValid || cartItems.length === 0}
                    />
                  </Suspense>
                </div>

                <div className="w-full">
                  <Suspense fallback={<div className='h-[54px] w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md flex items-center justify-center text-sm text-muted-foreground'>Loading Crypto Options...</div>}>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="cryptoSelect" className="text-xs text-muted-foreground">
                          {t('selectCryptoCurrency') || 'Choose Crypto to Pay With:'}
                        </Label>
                        <Select value={selectedPayCurrency} onValueChange={setSelectedPayCurrency}>
                          <SelectTrigger id="cryptoSelect" className="w-full">
                            <SelectValue placeholder={t('selectCryptoPlaceholder') || "Select cryptocurrency"} />
                          </SelectTrigger>
                          <SelectContent>
                            {supportedCryptoCurrencies.map((crypto) => (
                              <SelectItem key={crypto.code} value={crypto.code}>
                                {crypto.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <NowPaymentsButton 
                        items={cartItems}
                        totalAmount={finalTotal}
                        currency={currentCurrencyCode} // This is the FIAT currency (e.g., 'usd')
                        payCurrency={selectedPayCurrency} // This is the CRYPTO currency (e.g., 'btc')
                        locale={currentDisplayLocale}
                        disabled={isProcessingPayment || !isFormPotentiallyValid || cartItems.length === 0}
                        onInitiateCheckout={() => {
                          setIsProcessingPayment(true);
                          setPaymentError(null);
                        }}
                        onError={(errorMsg) => {
                          console.error('NOWPayments Error on Page:', errorMsg);
                          setIsProcessingPayment(false);
                          setPaymentError(errorMsg || t('paymentErrorOccurred'));
                        }}
                      />
                    </div>
                  </Suspense>
                </div>

                <div className="mt-4 flex justify-center">
                  <Image 
                    src="/icons/payment.svg" 
                    alt={tCommon('securePaymentsAlt')}
                    width={280}
                    height={40}
                    className="object-contain"
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center flex items-center justify-center">
                    <Lock className="h-3 w-3 mr-1" /> {t('securePaymentPoweredBy')}
                </p>

                <p className="text-xs text-muted-foreground text-center">
                {t('byPlacingOrderAgreement')}
              </p>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
} 