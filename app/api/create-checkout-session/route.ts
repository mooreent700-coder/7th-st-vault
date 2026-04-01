import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeSecretKey);

type CartItem = {
  id?: string;
  name?: string;
  quantity?: number;
  price?: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cart = Array.isArray(body?.cart) ? body.cart : [];
    const slug =
      typeof body?.slug === 'string' && body.slug
        ? body.slug
        : '';

    if (!cart.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ error: 'Missing store slug' }, { status: 400 });
    }

    const line_items = cart.map((item: CartItem) => ({
      quantity: Math.max(1, Number(item.quantity || 1)),
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(Number(item.price || 0) * 100),
        product_data: {
          name: item.name || 'Item',
        },
      },
    }));

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}/store/${slug}?success=true`,
      cancel_url: `${origin}/store/${slug}?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      { error: err.message || 'Stripe error' },
      { status: 500 }
    );
  }
}