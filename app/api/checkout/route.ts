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

function getFeePercent(plan: string | null | undefined) {
  if (plan === 'growth') return 0.05;
  if (plan === 'premium') return 0.03;
  return 0.1;
}

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
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();

    const cart: CartItem[] = Array.isArray(body?.cart) ? body.cart : [];
    const slug =
      typeof body?.slug === 'string' && body.slug.trim()
        ? body.slug.trim()
        : '';

    if (!cart.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ error: 'Missing store slug' }, { status: 400 });
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, slug, stripe_account_id, plan')
      .eq('slug', slug)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const normalizedCart = cart.map((item: CartItem) => ({
      menu_item_id: item.id || null,
      name: item.name || 'Item',
      quantity: Math.max(1, Number(item.quantity || 1)),
      price: Math.max(0, Number(item.price || 0)),
    }));

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      normalizedCart.map((item: CartItem) => ({
        quantity: Math.max(1, Number(item.quantity || 1)),
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(item.price || 0) * 100),
          product_data: {
            name: item.name || 'Item',
          },
        },
      }));

    const subtotalCents = normalizedCart.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0
    );

    const feePercent = getFeePercent(restaurant.plan);
    const applicationFeeAmount = Math.round(subtotalCents * feePercent);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant.id,
        amount_subtotal: subtotalCents,
        amount_total: subtotalCents,
        application_fee_amount: applicationFeeAmount,
        status: 'pending',
        currency: 'usd',
        source: 'stripe',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
    }

    const orderItemsPayload = normalizedCart.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      unit_price: Math.round(item.price * 100),
      line_total: Math.round(item.price * 100) * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsError) {
      return NextResponse.json({ error: 'Could not create order items' }, { status: 500 });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${siteUrl}/store/${slug}?success=true`,
      cancel_url: `${siteUrl}/store/${slug}?canceled=true`,
      metadata: {
        order_id: order.id,
        restaurant_id: restaurant.id,
        restaurant_slug: restaurant.slug || '',
        restaurant_name: restaurant.name || '',
        restaurant_plan: restaurant.plan || 'starter',
      },
    };

    if (restaurant.stripe_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: restaurant.stripe_account_id,
        },
        metadata: {
          order_id: order.id,
          restaurant_id: restaurant.id,
          restaurant_slug: restaurant.slug || '',
          restaurant_name: restaurant.name || '',
          restaurant_plan: restaurant.plan || 'starter',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await supabase
      .from('orders')
      .update({
        stripe_session_id: session.id,
      })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('CHECKOUT ERROR:', err);

    return NextResponse.json(
      { error: err?.message || 'Stripe error' },
      { status: 500 }
    );
  }
}