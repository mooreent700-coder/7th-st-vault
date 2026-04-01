import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CartItem = {
  id?: string;
  name?: string;
  quantity?: number;
  price?: number;
};

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(req.url).origin;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY' },
        { status: 500 }
      );
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_SUPABASE_URL' },
        { status: 500 }
      );
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();

    const cart = Array.isArray(body?.cart) ? body.cart : [];
    const slug =
      typeof body?.slug === 'string' && body.slug.trim()
        ? body.slug.trim()
        : '';

    if (!cart.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing store slug' },
        { status: 400 }
      );
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, slug, stripe_account_id, plan')
      .eq('slug', slug)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (!restaurant.stripe_account_id) {
      return NextResponse.json(
        { error: 'Checkout is not available for this store yet.' },
        { status: 400 }
      );
    }

    let feePercent = 0.1;

    if (restaurant.plan === 'starter') feePercent = 0.1;
    if (restaurant.plan === 'growth') feePercent = 0.05;
    if (restaurant.plan === 'premium') feePercent = 0.03;

    const normalizedCart = cart.map((item: CartItem) => ({
      name: item.name || 'Item',
      quantity: Math.max(1, Number(item.quantity || 1)),
      price: Math.max(0, Number(item.price || 0)),
    }));

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      normalizedCart.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
          },
        },
      }));

    const totalAmount = normalizedCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const applicationFeeAmount = Math.round(totalAmount * feePercent * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${siteUrl}/store/${slug}?success=true`,
      cancel_url: `${siteUrl}/store/${slug}?canceled=true`,
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: restaurant.stripe_account_id,
        },
        metadata: {
          restaurant_id: restaurant.id,
          restaurant_slug: restaurant.slug || '',
          restaurant_name: restaurant.name || '',
          restaurant_plan: restaurant.plan || '',
        },
      },
      metadata: {
        restaurant_id: restaurant.id,
        restaurant_slug: restaurant.slug || '',
        restaurant_name: restaurant.name || '',
        restaurant_plan: restaurant.plan || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('CHECKOUT ERROR:', err);

    return NextResponse.json(
      { error: err?.message || 'Stripe error' },
      { status: 500 }
    );
  }
}