import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function moneyToCents(value: unknown) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY on Vercel.' }, { status: 500 });
    }

    const cart = Array.isArray(body.cart) ? body.cart : [];
    if (!cart.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://ordadirect.com';

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map((item: any) => ({
      quantity: Number(item.quantity || 1),
      price_data: {
        currency: 'usd',
        unit_amount: moneyToCents(item.unitTotal || item.total || 0),
        product_data: {
          name: String(item.name || item.itemName || 'ORDA Item').slice(0, 120),
          images: item.imageUrl ? [String(item.imageUrl)] : undefined,
        },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/store/${body.slug || ''}?success=true`,
      cancel_url: `${origin}/store/${body.slug || ''}?canceled=true`,
      metadata: {
        restaurantId: String(body.restaurantId || ''),
        slug: String(body.slug || ''),
        orderType: String(body.orderType || 'pickup'),
        total: String(body.total || ''),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Checkout failed.' },
      { status: 500 }
    );
  }
}