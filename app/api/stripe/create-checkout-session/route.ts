import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { CartItem } from '@/types/cart'; // Ensure this path is correct

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil', // User updated this
  typescript: true,
});

interface RequestBody {
  items: CartItem[];
  currency: string; // Added: global currency for the order
  locale?: string; 
  profileLink?: string; // legacy, can be removed later
  productLinks?: Record<string, string>; // ADDED: per-product links
}

// Define a type for allowed Stripe locales to satisfy the SDK
type StripeLocale = Stripe.Checkout.SessionCreateParams.Locale;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { items, currency, locale, profileLink, productLinks } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided for checkout.' }, { status: 400 });
    }
    if (!currency || typeof currency !== 'string' || currency.length !== 3) {
        return NextResponse.json({ error: 'Invalid currency code provided.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error('Stripe Checkout Error: NEXT_PUBLIC_BASE_URL is not set.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const lineItems = items.map((item) => {
      const unitAmount = Math.round(item.price * 100);
      return {
        price_data: {
          currency: currency.toLowerCase(), 
          product_data: {
            name: 'Social Media Service', // Always use a generic name for Stripe
            metadata: {
              productSlug: item.slugOverride || ''
            }
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    // Validate and cast locale for Stripe
    const validStripeLocales: StripeLocale[] = ['auto', 'bg', 'cs', 'da', 'de', 'el', 'en', 'en-GB', 'es', 'es-419', 'et', 'fi', 'fr', 'fr-CA', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv', 'ms', 'mt', 'nb', 'nl', 'pl', 'pt', 'pt-BR', 'ro', 'ru', 'sk', 'sl', 'sv', 'th', 'tr', 'vi', 'zh', 'zh-HK', 'zh-TW'];
    const stripeSessionLocale = locale && validStripeLocales.includes(locale as StripeLocale) 
                                ? locale as StripeLocale 
                                : 'auto';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${locale || 'en'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${locale || 'en'}/payment-cancelled`,
      locale: stripeSessionLocale,
      metadata: {
        locale: locale || 'en',
        profileLink: profileLink || '', // legacy, can be removed later
        productLinks: productLinks ? JSON.stringify(productLinks) : '', // ADDED: per-product links
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Could not create Stripe session.' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : String(error);
    console.error('Stripe Checkout Session Error:', message);
    return NextResponse.json({ error: `Error creating Stripe checkout session: ${message}` }, { status: 500 });
  }
} 