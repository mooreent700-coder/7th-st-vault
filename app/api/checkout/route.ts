import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CartItem = {
  itemId?: string;
  itemName?: string;
  name?: string;
  imageUrl?: string;
  image_url?: string;
  itemImage?: string;
  quantity?: number;
  total?: number;
  unitTotal?: number;
  selections?: unknown;
};

function cents(value: unknown) {
  return Math.max(50, Math.round(Number(value || 0) * 100));
}

function safeText(value: unknown, fallback: string) {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeQty(value: unknown) {
  return Math.max(1, Math.round(Number(value || 1)));
}

function safeImage(value: unknown) {
  const url = String(value || '').trim();
  if (!url) return undefined;
  if (!/^https:\/\//i.test(url)) return undefined;
  return url;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cart = Array.isArray(body.cart) ? (body.cart as CartItem[]) : [];
    const restaurantId = safeText(body.restaurantId, '');
    const slug = safeText(body.slug, '');
    const orderType = safeText(body.orderType, 'pickup');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Missing restaurantId.' }, { status: 400 });
    }

    if (!cart.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeKey) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY.' }, { status: 500 });
    }

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing Supabase server env keys.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    const subtotal = Number(body.subtotal || 0);
    const deliveryFee = Number(body.deliveryFee || 0);
    const discount = Number(body.discount || 0);
    const total = Number(body.total || subtotal + deliveryFee - discount);

    const itemsSummary =
      safeText(body.owner_items_summary, '') ||
      safeText(body.items_summary, '') ||
      cart
        .map((item) => `${safeQty(item.quantity)}x ${safeText(item.itemName || item.name, 'Item')}`)
        .join(' · ');

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        status: 'new',
        order_type: orderType,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        amount_total: total,
        items_summary: itemsSummary,
        owner_items_summary: safeText(body.owner_items_summary, itemsSummary),
        customer_items_summary: safeText(body.customer_items_summary, itemsSummary),
        items: cart,
        order_items: cart,
        order_media: body.order_media || null,
        promo: body.promo || null,
        customer_language: safeText(body.customerLanguage, 'en'),
        owner_language: safeText(body.ownerLanguage || body.orderLanguage, 'en'),
        slug,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map((item) => {
      const name = safeText(item.itemName || item.name, 'ORDA Item');
      const qty = safeQty(item.quantity);
      const unitAmount = cents(item.unitTotal || Number(item.total || 0) / qty || 0);
      const image = safeImage(item.imageUrl || item.image_url || item.itemImage);

      return {
        quantity: qty,
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: {
            name,
            images: image ? [image] : undefined,
          },
        },
      };
    });

    if (deliveryFee > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: cents(deliveryFee),
          product_data: {
            name: 'Delivery Fee',
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${appUrl}/store/${slug}?success=1&order=${order.id}`,
      cancel_url: `${appUrl}/store/${slug}?cancelled=1`,
      metadata: {
        order_id: order.id,
        restaurant_id: restaurantId,
        slug,
        order_type: orderType,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe checkout URL was not created.' }, { status: 500 });
    }

    await supabaseAdmin
      .from('orders')
      .update({
        stripe_checkout_session_id: session.id,
        checkout_url: session.url,
      })
      .eq('id', order.id);

    return NextResponse.json({
      url: session.url,
      orderId: order.id,
      sessionId: session.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Checkout failed.' },
      { status: 500 }
    );
  }
}