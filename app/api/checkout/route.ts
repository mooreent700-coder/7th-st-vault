import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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
};

type NormalizedCartItem = {
  itemId: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitTotal: number;
  total: number;
};

function moneyToCents(value: unknown): number {
  return Math.max(50, Math.round(Number(value || 0) * 100));
}

function safeText(value: unknown, fallback: string): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeHttpsImage(value: unknown): string | undefined {
  const url = String(value || '').trim();
  if (!url.startsWith('https://')) return undefined;
  return url;
}

function getOrigin(req: Request): string {
  const origin = req.headers.get('origin');
  if (origin) return origin.replace(/\/$/, '');

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://ordadirect.com';

  return site.replace(/\/$/, '');
}

function normalizeCartItem(item: CartItem): NormalizedCartItem {
  const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
  const unitTotal = Number(item.unitTotal || item.total || 0);

  return {
    itemId: safeText(item.itemId, ''),
    name: safeText(item.name || item.itemName, 'ORDA Item').slice(0, 120),
    imageUrl: safeHttpsImage(item.imageUrl || item.image_url || item.itemImage),
    quantity,
    unitTotal,
    total: unitTotal * quantity,
  };
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY on Vercel.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const body = await req.json();

    const restaurantId = safeText(body.restaurantId, '');
    const slug = safeText(body.slug, '');

    const cart: NormalizedCartItem[] = Array.isArray(body.cart)
      ? body.cart
          .map((item: CartItem): NormalizedCartItem => normalizeCartItem(item))
          .filter((item: NormalizedCartItem): boolean => item.quantity > 0 && item.unitTotal > 0)
      : [];

    if (!cart.length) {
      return NextResponse.json(
        { error: 'Cart is empty or item price is missing.' },
        { status: 400 }
      );
    }

    const origin = getOrigin(req);

    const subtotal = Number(
      body.subtotal ??
        cart.reduce((sum: number, item: NormalizedCartItem): number => sum + item.total, 0)
    );

    const deliveryFee = Number(body.deliveryFee ?? body.delivery_fee ?? 0);
    const discount = Number(body.discount ?? 0);
    const total = Number(body.total ?? Math.max(0, subtotal + deliveryFee - discount));

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map(
      (item: NormalizedCartItem): Stripe.Checkout.SessionCreateParams.LineItem => {
        const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
          name: item.name,
          metadata: {
            itemId: item.itemId,
          },
        };

        if (item.imageUrl) {
          productData.images = [item.imageUrl];
        }

        return {
          quantity: item.quantity,
          price_data: {
            currency: 'usd',
            unit_amount: moneyToCents(item.unitTotal),
            product_data: productData,
          },
        };
      }
    );

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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/store/${slug}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store/${slug}?canceled=true`,
      metadata: {
        restaurantId,
        slug,
        orderType: safeText(body.orderType, 'pickup'),
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

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout failed.';
    console.error('CHECKOUT ERROR:', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}