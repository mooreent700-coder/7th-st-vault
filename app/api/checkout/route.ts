import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia',
});

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )
    : null;

function moneyToCents(value: unknown) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.round(number * 100));
}

function cleanText(value: unknown, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function cleanUrl(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) return '';
  return raw;
}

function getOrigin(req: Request) {
  const headerOrigin = req.headers.get('origin');
  const host = req.headers.get('host');

  if (headerOrigin) return headerOrigin.replace(/\/$/, '');
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (host) return `https://${host}`;

  return 'https://ordadirect.com';
}

function normalizeCartItem(item: any) {
  const quantity = Math.max(1, Math.floor(Number(item?.quantity || 1)));
  const unitTotal = Number(item?.unitTotal ?? 0);
  const lineTotal = Number(item?.total ?? 0);
  const price = unitTotal > 0 ? unitTotal : quantity > 0 && lineTotal > 0 ? lineTotal / quantity : 0;

  const image =
    cleanUrl(item?.imageUrl) ||
    cleanUrl(item?.image_url) ||
    cleanUrl(item?.itemImage) ||
    cleanUrl(item?.item_image) ||
    cleanUrl(item?.image);

  const video =
    cleanUrl(item?.videoUrl) ||
    cleanUrl(item?.video_url) ||
    cleanUrl(item?.itemVideo) ||
    cleanUrl(item?.item_video);

  return {
    id: cleanText(item?.id),
    itemId: cleanText(item?.itemId || item?.item_id),
    name: cleanText(item?.name || item?.itemName || item?.item_name, 'ORDA Item').slice(0, 120),
    quantity,
    unitTotal: price,
    total: price * quantity,
    image,
    video,
    mediaType: cleanText(item?.mediaType || item?.media_type || (video ? 'video' : 'image'), 'image'),
    selections: Array.isArray(item?.selections) ? item.selections : [],
  };
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY on Vercel.' },
        { status: 500 }
      );
    }

    const body = await req.json();

    const restaurantId = cleanText(body.restaurantId || body.restaurant_id);
    const slug = cleanText(body.slug, 'store');
    const orderType = cleanText(body.orderType || body.order_type, 'pickup');

    const cart = Array.isArray(body.cart)
      ? body.cart.map(normalizeCartItem).filter((item: any) => item.quantity > 0 && moneyToCents(item.unitTotal) > 0)
      : [];

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing restaurantId.' },
        { status: 400 }
      );
    }

    if (!cart.length) {
      return NextResponse.json(
        { error: 'Cart is empty or prices are invalid.' },
        { status: 400 }
      );
    }

    const origin = getOrigin(req);
    const subtotal = Number(body.subtotal ?? cart.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0));
    const deliveryFee = Number(body.deliveryFee ?? body.delivery_fee ?? 0);
    const discount = Number(body.discount ?? 0);
    const total = Number(body.total ?? Math.max(0, subtotal + deliveryFee - discount));

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map((item: any) => ({
      const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
        name: item.name,
        metadata: {
          itemId: item.itemId,
          mediaType: item.mediaType,
          videoUrl: item.video,
        },
      };

      if (item.image) productData.images = [item.image];

      return {
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: moneyToCents(item.unitTotal),
          product_data: productData,
        },
      };
    });

    if (deliveryFee > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: moneyToCents(deliveryFee),
          product_data: {
            name: 'Delivery Fee',
          },
        },
      });
    }

    const orderInsert = {
      restaurant_id: restaurantId,
      status: 'new',
      order_type: orderType,
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total,
      amount_total: total,
      items: cart,
      order_items: cart,
      items_summary: cleanText(body.items_summary || body.owner_items_summary),
      owner_items_summary: cleanText(body.owner_items_summary || body.items_summary),
      customer_items_summary: cleanText(body.customer_items_summary || body.items_summary),
      order_media: Array.isArray(body.order_media) ? body.order_media : [],
      promo: body.promo || null,
      customer_language: cleanText(body.customerLanguage || body.customer_language, 'en'),
      owner_language: cleanText(body.ownerLanguage || body.owner_language || body.orderLanguage || body.order_language, 'en'),
      order_language: cleanText(body.orderLanguage || body.order_language || body.ownerLanguage || body.owner_language, 'en'),
      created_at: new Date().toISOString(),
    };

    let orderId = '';

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert(orderInsert)
        .select('id')
        .maybeSingle();

      if (!error && data?.id) orderId = String(data.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/store/${encodeURIComponent(slug)}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store/${encodeURIComponent(slug)}?canceled=true`,
      metadata: {
        orderId,
        restaurantId,
        slug,
        orderType,
        subtotal: String(subtotal),
        deliveryFee: String(deliveryFee),
        discount: String(discount),
        total: String(total),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL.' },
        { status: 500 }
      );
    }

    if (supabaseAdmin && orderId) {
      await supabaseAdmin
        .from('orders')
        .update({
          stripe_session_id: session.id,
          checkout_url: session.url,
        })
        .eq('id', orderId);
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Checkout failed.' },
      { status: 500 }
    );
  }
}