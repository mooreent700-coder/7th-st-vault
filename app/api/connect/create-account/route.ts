import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey) throw new Error('Missing STRIPE_SECRET_KEY');
if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseServiceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

const stripe = new Stripe(stripeSecretKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const restaurantId =
      typeof body?.restaurantId === 'string' && body.restaurantId.trim()
        ? body.restaurantId.trim()
        : null;

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing restaurantId.' },
        { status: 400 }
      );
    }

    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('id, name, owner_email, stripe_account_id')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restaurantError) {
      return NextResponse.json(
        { error: restaurantError.message },
        { status: 500 }
      );
    }

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found.' },
        { status: 404 }
      );
    }

    let stripeAccountId = restaurant.stripe_account_id as string | null;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: restaurant.owner_email || undefined,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: restaurant.name || 'ORDA Restaurant',
          product_description: 'Restaurant direct online ordering.',
        },
      });

      stripeAccountId = account.id;

      const { error: updateError } = await supabaseAdmin
        .from('restaurants')
        .update({
          stripe_account_id: stripeAccountId,
          stripe_connected: false,
          stripe_charges_enabled: false,
          stripe_payouts_enabled: false,
        })
        .eq('id', restaurant.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      accountId: stripeAccountId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Could not create Stripe account.' },
      { status: 500 }
    );
  }
}