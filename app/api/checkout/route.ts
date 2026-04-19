import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

const stripe = new Stripe(stripeSecretKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

type RawCartItem = {
  id?: string;
  name?: string;
  itemName?: string;
  price?: number | string | null;
  basePrice?: number | string | null;
  total?: number | string | null;
  quantity?: number | string | null;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  selectedOptions?: Array<{ name?: string; price?: number | string | null }>;
  selections?: Array<{ name?: string; price?: number | string | null }>;
};

type NormalizedCartItem = {
  name: string;
  price: number;
  quantity: number;
  image: string | null;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCart(cart: RawCartItem[]): NormalizedCartItem[] {
  return (Array.isArray(cart) ? cart : []).map((item) => {
    const quantity = Math.max(1, Math.floor(toNumber(item.quantity || 1)));

    const directPrice = toNumber(item.price);
    const basePrice = toNumber(item.basePrice);
    const total = toNumber(item.total);

    let price = directPrice;

    if (price <= 0 && basePrice > 0) {
      price = basePrice;
    }

    if (price <= 0 && total > 0 && quantity > 0) {
      price = total / quantity;
    }

    const optionSets = [
      ...(Array.isArray(item.selectedOptions) ? item.selectedOptions : []),
      ...(Array.isArray(item.selections) ? item.selections : []),
    ];

    const optionsTotal = optionSets.reduce((sum, option) => {
      return sum + toNumber(option?.price);
    }, 0);

    if (price <= 0 && optionsTotal > 0) {
      price = optionsTotal;
    }

    return {
      name: String(item.name || item.itemName || 'Item').trim() || 'Item',
      price,
      quantity,
      image: item.image || item.imageUrl || item.image_url || null,
    };
  });
}

function getPlatformFeePercent(plan: string | null | undefined): number {
  const normalized = String(plan || '').toLowerCase();

  if (normalized === 'premium') return 3;
  if (normalized === 'growth') return 5;
  return 10;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const rawCart: RawCartItem[] = Array.isArray(body?.cart) ? body.cart : [];
    const restaurantId =
      typeof body?.restaurantId === 'string' && body.restaurantId.trim()
        ? body.restaurantId.trim()
        : null;
    const slug =
      typeof body?.slug === 'string' && body.slug.trim() ? body.slug.trim() : null;

    if (!rawCart.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    if (!restaurantId && !slug) {
      return NextResponse.json(
        { error: 'Missing restaurantId or slug.' },
        { status: 400 }
      );
    }

    let restaurantQuery = supabaseAdmin
      .from('restaurants')
      .select('id, slug, name, stripe_account_id, plan')
      .limit(1);

    if (restaurantId) {
      restaurantQuery = restaurantQuery.eq('id', restaurantId);
    } else if (slug) {
      restaurantQuery = restaurantQuery.eq('slug', slug);
    }

    const { data: restaurant, error: restaurantError } =
      await restaurantQuery.maybeSingle();

    if (restaurantError) {
      return NextResponse.json(
        {
          error: 'Restaurant lookup failed.',
          details: restaurantError.message,
        },
        { status: 500 }
      );
    }

    if (!restaurant) {
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 });
    }

    const normalizedCart = normalizeCart(rawCart);

    const invalidItem = normalizedCart.find(
      (item) =>
        !item.name ||
        !Number.isFinite(item.price) ||
        item.price <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    );

    if (invalidItem) {
      return NextResponse.json(
        {
          error: 'Invalid cart item.',
          invalidItem,
          normalizedCart,
        },
        { status: 400 }
      );
    }

    const subtotalCents = normalizedCart.reduce((sum, item) => {
      return sum + Math.round(item.price * 100) * item.quantity;
    }, 0);

    if (!Number.isInteger(subtotalCents) || subtotalCents <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid total.',
          subtotalCents,
          normalizedCart,
        },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;
    const finalSlug = restaurant.slug || slug || 'store';
    const feePercent = getPlatformFeePercent(restaurant.plan);
    const applicationFeeAmount = Math.round(subtotalCents * (feePercent / 100));

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: normalizedCart.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
      })),
      success_url: `${origin}/store/${finalSlug}?success=true`,
      cancel_url: `${origin}/store/${finalSlug}?canceled=true`,
      metadata: {
        restaurant_id: restaurant.id,
        restaurant_slug: finalSlug,
        subtotal_cents: String(subtotalCents),
        fee_percent: String(feePercent),
      },
    };

    if (restaurant.stripe_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: restaurant.stripe_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Checkout failed.',
      },
      { status: 500 }
    );
  }
}