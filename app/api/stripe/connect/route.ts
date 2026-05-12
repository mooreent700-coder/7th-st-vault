import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type ConnectRequestBody = {
  restaurantId?: string;
};

type RestaurantRow = {
  id: string;
  name: string | null;
  slug: string | null;
  stripe_account_id: string | null;
  stripe_connected: boolean | null;
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getEnv() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) throw new Error('Missing STRIPE_SECRET_KEY');
  if (!appUrl) throw new Error('Missing NEXT_PUBLIC_APP_URL');
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  return {
    stripeSecretKey,
    appUrl: appUrl.replace(/\/+$/, ''),
    supabaseUrl,
    supabaseServiceRoleKey,
  };
}

export async function POST(req: Request) {
  try {
    const { stripeSecretKey, appUrl, supabaseUrl, supabaseServiceRoleKey } = getEnv();
    const stripe = new Stripe(stripeSecretKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = (await req.json()) as ConnectRequestBody;
    const restaurantId = body?.restaurantId?.trim();

    if (!restaurantId) {
      return jsonError('Missing restaurantId');
    }

    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select(
        'id,name,slug,stripe_account_id,stripe_connected,stripe_charges_enabled,stripe_payouts_enabled'
      )
      .eq('id', restaurantId)
      .single<RestaurantRow>();

    if (restaurantError || !restaurant) {
      return jsonError('Restaurant not found', 404);
    }

    let stripeAccountId = restaurant.stripe_account_id;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        business_type: 'company',
        metadata: {
          restaurant_id: restaurant.id,
          restaurant_slug: restaurant.slug ?? '',
          restaurant_name: restaurant.name ?? '',
        },
      });

      stripeAccountId = account.id;

      const { error: saveAccountError } = await supabaseAdmin
        .from('restaurants')
        .update({
          stripe_account_id: stripeAccountId,
          stripe_connected: false,
          stripe_charges_enabled: false,
          stripe_payouts_enabled: false,
        })
        .eq('id', restaurant.id);

      if (saveAccountError) {
        return jsonError(saveAccountError.message, 500);
      }
    }

    const refreshUrl = `${appUrl}/dashboard/owner?stripe=refresh`;
    const returnUrl = `${appUrl}/api/stripe/refresh?account=${encodeURIComponent(stripeAccountId)}`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: stripeAccountId,
    });
  } catch (error: any) {
    return jsonError(error?.message || 'Could not create Stripe onboarding link.', 500);
  }
}
