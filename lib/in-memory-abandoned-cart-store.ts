// lib/in-memory-abandoned-cart-store.ts

// IMPORTANT: This is an in-memory store for demonstration purposes ONLY.
// In a production environment, you MUST use a persistent database.

export interface LoggedCartItem {
  productId: string | number;
  productName: string;
  quantity: number;
  price: number;
  productImage?: string;
  productUrl?: string;
}

export interface LoggedAbandonedCart {
  email: string;
  cartItems: LoggedCartItem[];
  loggedAt: Date;
  // Expanded statuses to track email sequence progress
  status: 'pending_email_1' | 'email_1_sent_pending_email_2' | 'email_2_sent_pending_email_3' | 'email_3_sent_pending_email_4' | 'email_4_sent_completed'; 
  locale: string; 
}

// This is our in-memory array acting as a temporary database.
// lib/in-memory-abandoned-cart-store.ts

// IMPORTANT: This is an in-memory store for demonstration purposes ONLY.
// In a production environment, you MUST use a persistent database.

export interface LoggedCartItem {
  productId: string | number;
  productName: string;
  quantity: number;
  price: number;
  productImage?: string;
  productUrl?: string;
}

export interface LoggedAbandonedCart {
  email: string;
  cartItems: LoggedCartItem[];
  loggedAt: Date;
  // Expanded statuses to track email sequence progress
  status: 'pending_email_1' | 'email_1_sent_pending_email_2' | 'email_2_sent_pending_email_3' | 'email_3_sent_pending_email_4' | 'email_4_sent_completed'; 
  locale: string; 
}

// Augment the global type to include our store for development
declare global {
  // eslint-disable-next-line no-var
  var __loggedCarts: LoggedAbandonedCart[] | undefined;
}

let loggedCartsStore: LoggedAbandonedCart[];

if (process.env.NODE_ENV === 'production') {
  loggedCartsStore = []; 
  console.log('[ACart Store PROD] Initialized new in-memory loggedCarts array for production (not recommended).');
} else {
  // In development, use the global object to persist across HMR
  if (!global.__loggedCarts) {
    global.__loggedCarts = [];
    console.log('[ACart Store DEV] Initialized loggedCarts on global object.');
  }
  loggedCartsStore = global.__loggedCarts;
}

export { loggedCartsStore as loggedCarts };

// Optional: A function to clear the store, useful for testing in development
export function clearInMemoryStore() {
  if (process.env.NODE_ENV !== 'production') {
    if (global.__loggedCarts) {
      global.__loggedCarts = [];
      console.log('[ACart Store DEV] Cleared loggedCarts from global object.');
    }
    // Ensure the exported variable is also updated if it was already imported elsewhere
    loggedCartsStore = global.__loggedCarts || [];
  } else {
    // For production, if using this in-memory approach (again, not recommended)
    loggedCartsStore = [];
    console.log('[ACart Store PROD] Cleared in-memory loggedCarts array for production.');
  }
} 
