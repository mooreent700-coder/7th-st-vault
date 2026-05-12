import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

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

export async function GET(req: Request) {
  try {
    const { stripeSecretKey, appUrl, supabaseUrl, supabaseServiceRoleKey } = getEnv();
    const stripe = new Stripe(stripeSecretKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account')?.trim();

    if (!accountId) {
      return NextResponse.redirect(`${appUrl}/dashboard/owner?stripe=missing-account`);
    }

    const account = await stripe.accounts.retrieve(accountId);

    await supabaseAdmin
      .from('restaurants')
      .update({
        stripe_connected: Boolean(account.details_submitted),
        stripe_charges_enabled: Boolean(account.charges_enabled),
        stripe_payouts_enabled: Boolean(account.payouts_enabled),
      })
      .eq('stripe_account_id', accountId);

    return NextResponse.redirect(`${appUrl}/dashboard/owner?stripe=connected`);
  } catch {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');
    if (appUrl) {
      return NextResponse.redirect(`${appUrl}/dashboard/owner?stripe=refresh-error`);
    }
    return NextResponse.json({ error: 'Could not refresh Stripe account.' }, { status: 500 });
  }
}
