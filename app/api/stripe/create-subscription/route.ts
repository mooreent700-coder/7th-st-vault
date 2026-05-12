import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const PLAN_CONFIG: Record<string, {
  name: string;
  priceEnv: string;
  monthlyPrice: number;
  platformFeePercent: number;
}> = {
  starter: {
    name: 'Starter',
    priceEnv: 'STRIPE_PRICE_STARTER_MONTHLY',
    monthlyPrice: 19,
    platformFeePercent: 10,
  },
  growth: {
    name: 'Growth',
    priceEnv: 'STRIPE_PRICE_GROWTH_MONTHLY',
    monthlyPrice: 49,
    platformFeePercent: 5,
  },
  premium: {
    name: 'Premium',
    priceEnv: 'STRIPE_PRICE_PREMIUM_MONTHLY',
    monthlyPrice: 99,
    platformFeePercent: 3,
  },
};

function getBaseUrl(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY.' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const restaurantId = String(body.restaurantId || '');
    const planKey = String(body.planKey || 'starter').toLowerCase();

    const plan = PLAN_CONFIG[planKey];
    if (!restaurantId || !plan) {
      return NextResponse.json({ error: 'Missing restaurantId or invalid planKey.' }, { status: 400 });
    }

    const priceId = process.env[plan.priceEnv];
    if (!priceId) {
      return NextResponse.json({ error: `Missing ${plan.priceEnv}.` }, { status: 500 });
    }

    const { data: store, error: storeError } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .maybeSingle();

    if (storeError) throw storeError;
    if (!store) return NextResponse.json({ error: 'Store not found.' }, { status: 404 });

    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: store.stripe_customer_id || undefined,
      customer_email: store.owner_email || undefined,
      success_url: `${baseUrl}/dashboard/owner?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/owner?billing=cancelled`,
      subscription_data: {
        trial_period_days: planKey === 'starter' ? 30 : undefined,
        metadata: {
          restaurant_id: restaurantId,
          plan_key: planKey,
        },
      },
      metadata: {
        restaurant_id: restaurantId,
        plan_key: planKey,
      },
    });

    await supabaseAdmin
      .from('restaurants')
      .update({
        plan_key: planKey,
        plan_name: plan.name,
        monthly_price: plan.monthlyPrice,
        platform_fee_percent: plan.platformFeePercent,
        stripe_price_id: priceId,
        billing_status: 'checkout_started',
        billing_note: 'Stripe subscription checkout started.',
      })
      .eq('id', restaurantId);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Could not create subscription checkout.' }, { status: 500 });
  }
}
