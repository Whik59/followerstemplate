import { NextResponse } from 'next/server';
// IMPORT from the new Redis store
import { 
  getAbandonedCart,
  // type LoggedAbandonedCart // Already implicitly typed by getAbandonedCart return
} from '@/lib/redis-abandoned-cart-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
  }
  
  if (!process.env.REDIS_URL) {
    console.error('[RetrieveCart API] REDIS_URL not set. Aborting.');
    return NextResponse.json({ error: "Configuration error: REDIS_URL not set."}, { status: 500 });
  }

  console.log('[RetrieveCart API] Requested email:', email);

  try {
    const foundCart = await getAbandonedCart(email);

    if (process.env.NODE_ENV === 'development') {
      console.log('[RetrieveCart API] Cart data from Redis for email ', email, ':', JSON.stringify(foundCart, null, 2));
    }

    // Ensure cart is found and not fully processed or converted
    if (foundCart && foundCart.status !== 'email_4_sent_completed' && foundCart.status !== 'converted') {
      console.log('[RetrieveCart API] Active cart found for email:', email);
      // Return only necessary cart data for security and privacy
      return NextResponse.json({
        cartItems: foundCart.cartItems,
        locale: foundCart.locale,
        currency: foundCart.currency, 
        // Do NOT return the full cart object, especially sensitive parts or full status history like 'status' or 'loggedAt'/'updatedAt'
      });
    } else {
      if (foundCart) {
        console.log('[RetrieveCart API] Cart found for email ', email, ' but its status (', foundCart.status, ') means it is not considered active for retrieval.');
      } else {
        console.log('[RetrieveCart API] No cart found in Redis for email:', email);
      }
      return NextResponse.json({ error: 'No active abandoned cart found for this email' }, { status: 404 });
    }
  } catch (error) {
    console.error('[RetrieveCart API] Error fetching cart from Redis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve cart data';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 