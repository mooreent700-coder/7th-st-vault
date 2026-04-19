import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { action, restaurantId, ownerId, message, reason } = body;

    // PAUSE ACCOUNT
    if (action === 'pause') {
      await supabase.from('restaurants').update({
        account_status: 'paused',
        payment_status: 'past_due',
        pause_reason: reason || 'No payment',
        paused_at: new Date().toISOString()
      }).eq('id', restaurantId);

      await supabase.from('support_messages').insert({
        restaurant_id: restaurantId,
        owner_id: ownerId,
        sender_role: 'admin',
        message: `Your account has been paused: ${reason}`
      });

      return NextResponse.json({ success: true });
    }

    // UNPAUSE ACCOUNT
    if (action === 'unpause') {
      await supabase.from('restaurants').update({
        account_status: 'active',
        payment_status: 'active',
        pause_reason: null,
        paused_at: null
      }).eq('id', restaurantId);

      return NextResponse.json({ success: true });
    }

    // SEND MESSAGE
    if (action === 'message') {
      await supabase.from('support_messages').insert({
        restaurant_id: restaurantId,
        owner_id: ownerId,
        sender_role: 'admin',
        message
      });

      return NextResponse.json({ success: true });
    }

    // PAYMENT REMINDER
    if (action === 'reminder') {
      await supabase.from('restaurants').update({
        payment_status: 'past_due'
      }).eq('id', restaurantId);

      await supabase.from('support_messages').insert({
        restaurant_id: restaurantId,
        owner_id: ownerId,
        sender_role: 'admin',
        message: 'Your payment is late. Please pay to keep your account active.'
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Admin action failed' },
      { status: 500 }
    );
  }
}