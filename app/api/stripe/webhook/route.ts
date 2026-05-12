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

const PLAN_CONFIG: Record<string, { name: string; monthlyPrice: number; platformFeePercent: number }> = {
  starter: { name: 'Starter', monthlyPrice: 19, platformFeePercent: 10 },
  growth: { name: 'Growth', monthlyPrice: 49, platformFeePercent: 5 },
  premium: { name: 'Premium', monthlyPrice: 99, platformFeePercent: 3 },
};

function addOneMonthDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

async function updateStoreBySubscription(subscriptionId: string, patch: Record<string, any>) {
  const { error } = await supabaseAdmin
    .from('restaurants')
    .update(patch)
    .eq('stripe_subscription_id', subscriptionId);

  if (error) throw error;
}

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing Stripe webhook signature or secret.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const restaurantId = String(session.metadata?.restaurant_id || '');
      const planKey = String(session.metadata?.plan_key || 'starter').toLowerCase();
      const plan = PLAN_CONFIG[planKey] || PLAN_CONFIG.starter;

      if (restaurantId) {
        await supabaseAdmin
          .from('restaurants')
          .update({
            plan_key: planKey,
            plan_name: plan.name,
            monthly_price: plan.monthlyPrice,
            platform_fee_percent: plan.platformFeePercent,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
            subscription_started_at: new Date().toISOString(),
            payment_due_date: addOneMonthDate(),
            billing_status: 'active',
            paused: false,
            pause_reason: null,
            overdue_days: 0,
            last_payment_at: new Date().toISOString(),
            billing_note: 'Subscription checkout completed.',
          })
          .eq('id', restaurantId);
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof (invoice as any).subscription === 'string'
          ? (invoice as any).subscription
          : (invoice as any).subscription?.id;

      if (subscriptionId) {
        await updateStoreBySubscription(subscriptionId, {
          billing_status: 'active',
          paused: false,
          pause_reason: null,
          overdue_days: 0,
          last_payment_at: new Date().toISOString(),
          payment_due_date: addOneMonthDate(),
          billing_note: 'Invoice paid. Store active.',
        });
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof (invoice as any).subscription === 'string'
          ? (invoice as any).subscription
          : (invoice as any).subscription?.id;

      if (subscriptionId) {
        await updateStoreBySubscription(subscriptionId, {
          billing_status: 'past_due',
          billing_note: 'Stripe invoice payment failed.',
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await updateStoreBySubscription(subscription.id, {
        billing_status: 'cancelled',
        paused: true,
        pause_reason: 'Subscription cancelled.',
        billing_note: 'Stripe subscription cancelled.',
      });
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        await updateStoreBySubscription(subscription.id, {
          billing_status: subscription.status,
          paused: false,
          pause_reason: null,
          billing_note: `Stripe subscription ${subscription.status}.`,
        });
      }

      if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        await updateStoreBySubscription(subscription.id, {
          billing_status: subscription.status,
          billing_note: `Stripe subscription ${subscription.status}.`,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Webhook handler failed.' }, { status: 500 });
  }
}
