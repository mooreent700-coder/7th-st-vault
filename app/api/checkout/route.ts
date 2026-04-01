import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

type CartItem = {
  name: string;
  quantity: number;
  price: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cart: CartItem[] = body.cart || [];
    const slug: string = body.slug;

    if (!cart.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.map((item: CartItem) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
          },
        },
      }));

    const origin =
      process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}/store/${slug}?success=true`,
      cancel_url: `${origin}/store/${slug}?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Stripe error' },
      { status: 500 }
    );
  }
}