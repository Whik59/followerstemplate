import Redis from 'ioredis';
import type { CurrencyInfo } from '@/types/currency'; // Assuming this type definition exists

let redis: Redis;

if (!process.env.REDIS_URL) {
  console.error('[RedisACartStore] FATAL: REDIS_URL environment variable is not set. Redis client cannot be initialized.');
  // In a real app, you might throw an error here or have a fallback, 
  // but for Vercel deployment, this will likely cause issues during build or runtime if not set.
} else {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      // ioredis options if needed, e.g., tls for certain Redis providers if not in URL
      // maxRetriesPerRequest: null, // Can be important for Vercel serverless functions
      // enableReadyCheck: false, // Can be important for Vercel serverless functions
      // showFriendlyErrorStack: process.env.NODE_ENV === 'development',
    });

    redis.on('error', (err) => {
      console.error('[RedisACartStore] Redis Client Error:', err);
    });

    redis.on('connect', () => {
      console.log('[RedisACartStore] Successfully connected to Redis.');
    });

  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("[RedisACartStore] Failed to initialize Redis client:", error.message, "REDIS_URL used:", process.env.REDIS_URL);
    // Depending on policy, you might want to throw error here to halt app startup if Redis is critical.
  }
}

export interface LoggedCartItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  productImage?: string;
  productUrl?: string;
  variantId?: string;
  originalPrice?: number;
  currencyCode?: string;
  imagePath?: string; 
  productNameCanonical?: string;
  productNameWithVariant?: string;
  localizedShortTitle?: { [locale: string]: string };
  slugOverride?: string;
}

export type AbandonedCartStatus =
  | 'pending_email_1'
  | 'email_1_sent_pending_email_2'
  | 'email_2_sent_pending_email_3'
  | 'email_3_sent_pending_email_4'
  | 'email_4_sent_completed'
  | 'converted';

export interface LoggedAbandonedCart {
  email: string;
  cartItems: LoggedCartItem[];
  locale: string;
  currency?: CurrencyInfo; 
  status: AbandonedCartStatus;
  loggedAt: string; // ISO string date
  updatedAt: string; // ISO string date
  totalValueAtAbandonment?: number;
}

const CART_KEY_PREFIX = 'abandoned_cart:';

function getCartKey(email: string): string {
  return `${CART_KEY_PREFIX}${email}`;
}

export async function upsertAbandonedCart(cartData: LoggedAbandonedCart): Promise<void> {
  if (!redis) {
    console.error('[RedisACartStore:upsert] Redis client not initialized.');
    // Potentially throw or return an error status
    return;
  }
  const key = getCartKey(cartData.email);
  try {
    await redis.set(key, JSON.stringify(cartData));
    // Optional: Set a Time-To-Live (TTL) for the cart, e.g., 30 days
    // await redis.expire(key, 30 * 24 * 60 * 60);
    console.log(`[RedisACartStore] Upserted cart for ${cartData.email}`);
  } catch (error) {
    console.error(`[RedisACartStore:upsert] Error upserting cart for ${cartData.email}:`, error);
    throw error; // Re-throw to allow caller to handle
  }
}

export async function getAbandonedCart(email: string): Promise<LoggedAbandonedCart | null> {
  if (!redis) {
    console.error('[RedisACartStore:get] Redis client not initialized.');
    return null;
  }
  const key = getCartKey(email);
  try {
    const cartString = await redis.get(key);
    if (cartString) {
      return JSON.parse(cartString) as LoggedAbandonedCart;
    }
    return null;
  } catch (error) {
    console.error(`[RedisACartStore:get] Error getting cart for ${email}:`, error);
    throw error;
  }
}

export async function getAllActiveAbandonedCarts(): Promise<LoggedAbandonedCart[]> {
  if (!redis) {
    console.error('[RedisACartStore:getAllActive] Redis client not initialized.');
    return [];
  }
  const activeCarts: LoggedAbandonedCart[] = [];
  console.log('[RedisACartStore] Attempting to fetch all active abandoned carts...');
  
  try {
    const stream = redis.scanStream({
      match: `${CART_KEY_PREFIX}*`,
      count: 100, // Number of keys to fetch per iteration
    });

    const keys: string[] = [];
    for await (const keyBatch of stream) {
      keys.push(...(keyBatch as string[]));
    }

    if (keys.length === 0) {
      console.log('[RedisACartStore] No cart keys found during scan.');
      return [];
    }

    const cartStrings = await redis.mget(keys);
    for (const cartString of cartStrings) {
      if (cartString) {
        try {
          const cart = JSON.parse(cartString) as LoggedAbandonedCart;
          if (cart.status !== 'email_4_sent_completed' && cart.status !== 'converted') {
            activeCarts.push(cart);
          }
        } catch (parseError) {
          console.error('[RedisACartStore:getAllActive] Error parsing cart string:', cartString, parseError);
        }
      }
    }
    console.log(`[RedisACartStore] Found ${activeCarts.length} active carts via scan.`);
  } catch (error) {
    console.error('[RedisACartStore:getAllActive] Error scanning for carts:', error);
    // Do not re-throw here, allow returning empty array or partially fetched if needed by design
  }
  return activeCarts;
}

export async function updateCartStatus(email: string, status: AbandonedCartStatus): Promise<LoggedAbandonedCart | null> {
  if (!redis) {
    console.error('[RedisACartStore:updateStatus] Redis client not initialized.');
    return null;
  }
  const key = getCartKey(email);
  try {
    const cart = await getAbandonedCart(email); // Use existing function to get current cart
    if (cart) {
      cart.status = status;
      cart.updatedAt = new Date().toISOString();
      await redis.set(key, JSON.stringify(cart)); // Set the updated cart
      console.log(`[RedisACartStore] Updated status for ${email} to ${status}`);
      return cart;
    }
    console.warn(`[RedisACartStore:updateStatus] Attempted to update status for non-existent cart: ${email}`);
    return null;
  } catch (error) {
    console.error(`[RedisACartStore:updateStatus] Error updating cart status for ${email}:`, error);
    throw error;
  }
}

export async function deleteAbandonedCart(email: string): Promise<void> {
  if (!redis) {
    console.error('[RedisACartStore:delete] Redis client not initialized.');
    return;
  }
  const key = getCartKey(email);
  try {
    await redis.del(key);
    console.log(`[RedisACartStore] Deleted cart for ${email}`);
  } catch (error) {
    console.error(`[RedisACartStore:delete] Error deleting cart for ${email}:`, error);
    throw error;
  }
} 