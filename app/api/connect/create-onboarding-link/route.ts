import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Create onboarding link route is ready.',
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const restaurantId = String(body?.restaurantId || '').trim();

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: 'Missing restaurantId.' },
        { status: 400 }
      );
    }

    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('id, stripe_account_id')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: restaurantError?.message || 'Restaurant not found.',
        },
        { status: 404 }
      );
    }

    if (!restaurant.stripe_account_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Restaurant does not have a Stripe connected account yet.',
        },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;

    const accountLink = await stripe.accountLinks.create({
      account: restaurant.stripe_account_id,
      refresh_url: `${origin}/dashboard/owner`,
      return_url: `${origin}/dashboard/owner`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || 'Could not create Stripe onboarding link.',
      },
      { status: 500 }
    );
  }
}