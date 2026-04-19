import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  let event: Stripe.Event;

  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  try {
    // ✅ PAYMENT SUCCESS
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.order_id;
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      if (orderId) {
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: paymentIntentId,
            customer_email:
              session.customer_details?.email ||
              session.customer_email ||
              null,
            amount_total: session.amount_total || 0,
            amount_subtotal: session.amount_subtotal || 0,
            currency: session.currency || 'usd',
          })
          .eq('id', orderId);
      }
    }

    // ❌ EXPIRED
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        await supabase
          .from('orders')
          .update({ status: 'expired' })
          .eq('id', orderId);
      }
    }

    // ❌ FAILED PAYMENT
    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.order_id;

      if (orderId) {
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            stripe_payment_intent_id: intent.id,
          })
          .eq('id', orderId);
      }
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error('🔥 WEBHOOK ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}