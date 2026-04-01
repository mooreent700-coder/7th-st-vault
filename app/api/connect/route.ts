import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 🔐 STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

// 🔐 SUPABASE (SERVER ROLE)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const restaurantId = body?.restaurantId;

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing restaurantId' },
        { status: 400 }
      );
    }

    // 1. CHECK IF ALREADY CONNECTED
    const { data: existing } = await supabase
      .from('restaurants')
      .select('stripe_account_id')
      .eq('id', restaurantId)
      .single();

    let accountId = existing?.stripe_account_id;

    // 2. CREATE STRIPE ACCOUNT IF NONE EXISTS
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      accountId = account.id;

      // SAVE TO DB
      await supabase
        .from('restaurants')
        .update({
          stripe_account_id: accountId,
        })
        .eq('id', restaurantId);
    }

    // 3. CREATE ONBOARDING LINK
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
    });

  } catch (error: any) {
    console.error('STRIPE CONNECT ERROR:', error);

    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}