import { NextResponse } from 'next/server';
// IMPORT from the new Redis store
import { 
  upsertAbandonedCart, 
  getAbandonedCart,
  type LoggedAbandonedCart, 
  type LoggedCartItem 
} from '@/lib/redis-abandoned-cart-store';
import type { CurrencyInfo } from '@/types/currency';

// REMOVE interface definitions - they are now imported
// interface LoggedCartItem { ... }
// interface LoggedAbandonedCart { ... }

// REMOVE loggedCarts definition - it's now imported
// let loggedCarts: LoggedAbandonedCart[] = [];

export async function POST(request: Request) {
  console.log('[LogAPI POST /api/abandoned-cart/log] Received request');
  try {
    const body = await request.json();
    const { email, cartItems, locale, currency, totalValueAtAbandonment } = body as {
       email: string, 
       cartItems: LoggedCartItem[],
       locale: string,
       currency?: CurrencyInfo,
       totalValueAtAbandonment?: number
    }; 

    console.log('[LogAPI] Received email:', email);
    // console.log('[LogAPI] Received cartItems (first item sample):', cartItems && cartItems.length > 0 ? cartItems[0] : 'No items');
    // console.log('[LogAPI] Received locale:', locale);

    if (!email || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0 || !locale) {
      console.warn('[LogAPI] Validation failed: Missing email, cart items, or locale.');
      return NextResponse.json({ message: 'Missing email, cart items, or locale.' }, { status: 400 });
    }

    const validCartItems = cartItems.every(
      (item: LoggedCartItem) => 
        item.productName && 
        typeof item.quantity === 'number' && 
        typeof item.price === 'number'
    );

    if (!validCartItems) {
      console.warn('[LogAPI] Validation failed: Invalid cart item structure.');
      return NextResponse.json({ message: 'Invalid cart item structure.' }, { status: 400 });
    }

    const existingCart = await getAbandonedCart(email);
    const now = new Date();
    // Check if cart was updated in the last 5 minutes to prevent rapid re-logging if user is active on checkout
    const fiveMinutesAgo = now.getTime() - (5 * 60 * 1000);

    if (existingCart && new Date(existingCart.updatedAt).getTime() > fiveMinutesAgo) {
        console.log(`[LogAPI] Abandoned cart for ${email} already logged/updated recently. Updating timestamp and potentially items.`);
        // Update existing cart details
        existingCart.cartItems = cartItems.map((item: LoggedCartItem): LoggedCartItem => ({
          productId: item.productId || item.variantId || 'unknown',
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          productImage: item.productImage || item.imagePath, 
          productUrl: item.productUrl,
          variantId: item.variantId,
          originalPrice: item.originalPrice,
          currencyCode: item.currencyCode,
          imagePath: item.imagePath,
          productNameCanonical: item.productNameCanonical,
          productNameWithVariant: item.productNameWithVariant,
          localizedShortTitle: item.localizedShortTitle,
          slugOverride: item.slugOverride,
        }));
        existingCart.locale = locale; // Update locale if it changed
        existingCart.currency = currency; // Update currency
        existingCart.totalValueAtAbandonment = totalValueAtAbandonment; // Update total value
        existingCart.updatedAt = now.toISOString();
        // existingCart.status remains unchanged unless specifically re-evaluating
        
        await upsertAbandonedCart(existingCart);
        console.log('[LogAPI Debug] Updated existing cart in Redis for:', email);
        return NextResponse.json({ message: 'Cart activity updated.', cartId: email }, { status: 200 });
    }

    // If cart doesn't exist or is old, create a new one
    const newLoggedCart: LoggedAbandonedCart = {
      email,
      cartItems: cartItems.map((item: LoggedCartItem): LoggedCartItem => ({
        productId: item.productId || item.variantId || 'unknown',
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        productImage: item.productImage || item.imagePath,
        productUrl: item.productUrl,
        variantId: item.variantId,
        originalPrice: item.originalPrice,
        currencyCode: item.currencyCode,
        imagePath: item.imagePath,
        productNameCanonical: item.productNameCanonical,
        productNameWithVariant: item.productNameWithVariant,
        localizedShortTitle: item.localizedShortTitle,
        slugOverride: item.slugOverride,
      })),
      loggedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'pending_email_1',
      locale,
      currency: currency,
      totalValueAtAbandonment: totalValueAtAbandonment,
    };

    await upsertAbandonedCart(newLoggedCart);
    console.log('[LogAPI] Logged NEW abandoned cart in Redis for:', email);

    return NextResponse.json({ message: 'Cart logged successfully.', cartId: email }, { status: 201 });

  } catch (error: unknown) {
    console.error('[LogAPI POST /api/abandoned-cart/log] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: 'Error logging cart', error: errorMessage }, { status: 500 });
  }
}

// The GET handler for debugging in-memory store can be removed or adapted for Redis if needed.
// For now, let's comment it out to keep focus on POST.
/*
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (process.env.NODE_ENV === 'development' && email) {
        console.log(`[LogAPI GET /api/abandoned-cart/log] Fetching cart for ${email} from Redis:`);
        try {
            const cart = await getAbandonedCart(email);
            if (cart) {
                return NextResponse.json(cart);
            } else {
                return NextResponse.json({ message: 'Cart not found in Redis' }, { status: 404 });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error fetching from Redis';
            return NextResponse.json({ message: 'Error fetching cart', error: errorMessage }, { status: 500 });
        }
    }
    return NextResponse.json({ message: 'Access denied or email parameter missing' }, { status: 403 });
} 
*/ 