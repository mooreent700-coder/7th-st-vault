import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY' },
        { status: 500 }
      );
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_SUPABASE_URL' },
        { status: 500 }
      );
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing restaurantId' },
        { status: 400 }
      );
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, stripe_account_id')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (!restaurant.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        stripeAccountId: null,
      });
    }

    const account = await stripe.accounts.retrieve(restaurant.stripe_account_id);

    return NextResponse.json({
      connected: true,
      onboardingComplete: Boolean(account.details_submitted),
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      stripeAccountId: account.id,
    });
  } catch (error: any) {
    console.error('STRIPE STATUS ERROR:', error);

    return NextResponse.json(
      {
        error: error?.message || 'Could not get Stripe status',
      },
      { status: 500 }
    );
  }
}