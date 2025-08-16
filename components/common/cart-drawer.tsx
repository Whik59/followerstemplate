'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X as _X, ShoppingBag, Gift, Plus, Minus, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation'; // To get current locale from path
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from '@/lib/utils/currency';

export function CartDrawer() {
  const { 
    items, 
    itemCount, 
    totalPrice, 
    originalTotalPrice,
    currency, 
    removeItem, 
    updateQuantity, // Destructure updateQuantity
    isDrawerOpen, // From context
    closeDrawer,    // From context
  } = useCart();
  const tCart = useTranslations('Common');
  const tCommon = useTranslations('Common');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en'; // Simple locale extraction

  const currentCurrencySymbol = currency?.symbol || '$';
  const currentCurrencyCode = currency?.code || 'USD';

  // Helper to format currency for display in messages
  const formatDisplayCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return formatCurrency({ amount, currencyCode: currentCurrencyCode, locale });
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(isOpen: boolean) => !isOpen && closeDrawer()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col py-6">
        <SheetHeader className="px-4 pt-0 pb-4 border-b border-amber-300 dark:border-amber-700">
          <SheetTitle className="text-xl font-semibold flex items-center text-amber-600 dark:text-amber-400">
            <ShoppingBag className="mr-2 h-6 w-6 text-amber-500" />
            {tCart('yourShoppingCart')} ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <ShoppingBag className="h-20 w-20 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-4">{tCart('emptyCartTitle')}</p>
            <SheetClose asChild>
              <Button onClick={closeDrawer} className="bg-amber-500 hover:bg-amber-600 text-white">
                {tCart('continueShopping')}
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-2 sm:px-4 py-4">
              <div className="space-y-4">
                {items.map(item => {
                  // Determine the locale for translation
                  const currentLocale = pathname.split('/')[1] || 'en'; 

                  // Determine the name to display
                  const displayName = item.productNameWithVariant || 
                                    item.localizedShortTitle?.[currentLocale] ||
                                    item.localizedShortTitle?.['en'] ||
                                    item.productNameLocalized?.[currentLocale] ||
                                    item.productNameLocalized?.['en'] ||
                                    item.productNameCanonical;

                  // Ensure a unique key for items, preferring variantId
                  const itemKey = item.variantId || item.productId.toString();

                  return (
                    <div key={itemKey} className="flex items-start gap-4 py-3 border-b border-border/50 last:border-b-0">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        {item.imagePath ? (
                          <Image 
                            src={item.imagePath} 
                            alt={displayName} // Use potentially variant-specific name
                            fill 
                            sizes="80px"
                            className="object-cover rounded-md border border-amber-300 dark:border-amber-600"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs border border-amber-300 dark:border-amber-600">
                            {tCommon('noImageAvailable')}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-500 leading-tight">
                            {displayName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {tCart('unitPrice')}: 
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="line-through mr-1.5 text-gray-500 dark:text-gray-400">
                                {item.currencySymbol}{item.originalPrice.toFixed(2)}
                              </span>
                            )}
                            <span className="font-semibold text-foreground">
                              {item.currencySymbol}{item.price.toFixed(2)}
                            </span>
                          </p>
                        </div>
                        {/* Quantity Controls & Remove Button Flex Container */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-border rounded-md">
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:bg-muted/50 rounded-r-none"
                              onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                              aria-label={tCart('decreaseQuantity', { productName: displayName })}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-3 text-sm font-medium w-10 text-center tabular-nums">
                              {item.quantity}
                            </span>
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:bg-muted/50 rounded-l-none"
                              onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                              aria-label={tCart('increaseQuantity', { productName: displayName })}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-destructive h-7 w-7 ml-2"
                              onClick={() => removeItem(itemKey)}
                              aria-label={tCart('removeItemSpecific', { productName: displayName })}
                          >
                            <_X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
  
                      {/* Total Price for Item Line - for sm screens and up */}
                      <div className="text-sm text-right flex flex-col justify-end min-w-[90px] hidden sm:flex">
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="line-through text-xs text-gray-500 dark:text-gray-400">
                            {item.currencySymbol}{(item.originalPrice * item.quantity).toFixed(2)}
                          </span>
                        )}
                        <span className="font-semibold text-foreground">
                          {item.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <SheetFooter className="px-4 py-4 border-t border-amber-300 dark:border-amber-700 flex flex-col">
              <div className="w-full flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-amber-700 dark:text-amber-300">{tCart('total')}:</span>
                    {originalTotalPrice && originalTotalPrice > totalPrice ? (
                      <span className={originalTotalPrice && originalTotalPrice > totalPrice ? 'text-destructive dark:text-destructive-foreground' : ''}>
                        <span className="line-through text-sm text-muted-foreground mr-1.5">
                          {currentCurrencySymbol}{originalTotalPrice.toFixed(2)}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                          {currentCurrencySymbol}{totalPrice.toFixed(2)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        {currentCurrencySymbol}{totalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {originalTotalPrice && originalTotalPrice > totalPrice && (
                    <div className="flex justify-between text-sm font-semibold text-green-600 dark:text-green-400 border-t pt-2 mt-2 border-dashed">
                      <span>{tCart('youSave')}:</span>
                      <span>
                        {currentCurrencySymbol}{(originalTotalPrice - totalPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-3">
                  <SheetClose asChild>
                      <Button className="group w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 text-xl sm:text-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] focus:scale-[1.02] active:scale-100" asChild> 
                          <Link href={`/${locale}/checkout`} className="flex items-center justify-center">
                             <span className="flex items-center justify-center gap-2 sm:gap-2.5 animate-pulse-text">
                               <span>{tCart('checkoutNow')}</span>
                               <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-200 ease-in-out group-hover:translate-x-1" />
                             </span>
                          </Link>
                      </Button>
                  </SheetClose>

                  {/* Secure Payments Image */}
                  <div className="flex justify-center pt-2">
                    <Image 
                      src="/icons/payment.svg" 
                      alt={tCart('securePayments')} // Add a translation for alt text
                      width={200} // Specify appropriate width
                      height={30} // Specify appropriate height, adjust as needed for aspect ratio
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
} 