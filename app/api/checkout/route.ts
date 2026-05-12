import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

type CartItem = {
  itemId?: string;
  itemName?: string;
  name?: string;
  imageUrl?: string;
  quantity?: number;
  total?: number;
  unitTotal?: number;
};

function moneyToCents(value: unknown) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

function getOrigin(req: Request) {
  return (
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://ordadirect.com'
  );
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

    const cart: CartItem[] = Array.isArray(body.cart)
      ? body.cart
      : [];

    if (!cart.length) {
      return NextResponse.json(
        { error: 'Cart is empty.' },
        { status: 400 }
      );
    }

    const origin = getOrigin(req);

    const subtotal = Number(
      body.subtotal ??
        cart.reduce(
          (sum: number, item: CartItem) =>
            sum + Number(item.total || 0),
          0
        )
    );

    const deliveryFee = Number(
      body.deliveryFee ??
      body.delivery_fee ??
      0
    );

    const discount = Number(
      body.discount ?? 0
    );

    const total = Number(
      body.total ??
      Math.max(0, subtotal + deliveryFee - discount)
    );

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.map((item: CartItem) => ({
        quantity: Number(item.quantity || 1),

        price_data: {
          currency: 'usd',

          unit_amount: moneyToCents(
            item.unitTotal ||
            item.total ||
            0
          ),

          product_data: {
            name: String(
              item.name ||
              item.itemName ||
              'ORDA Item'
            ).slice(0, 120),

            images: item.imageUrl
              ? [String(item.imageUrl)]
              : undefined,

            metadata: {
              itemId: String(item.itemId || ''),
            },
          },
        },
      }));

    const session =
      await stripe.checkout.sessions.create({
        mode: 'payment',

        line_items,

        success_url: `${origin}/store/${body.slug || ''}?success=true`,

        cancel_url: `${origin}/store/${body.slug || ''}?canceled=true`,

        metadata: {
          restaurantId: String(body.restaurantId || ''),
          slug: String(body.slug || ''),
          orderType: String(body.orderType || 'pickup'),
          subtotal: String(subtotal),
          deliveryFee: String(deliveryFee),
          discount: String(discount),
          total: String(total),
        },
      });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('CHECKOUT ERROR:', error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Checkout failed.',
      },
      {
        status: 500,
      }
    );
  }
}