import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromDate: string, toDate: string) {
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET || '';

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized billing check.' }, { status: 401 });
    }

    const today = todayDateOnly();

    const { data: stores, error } = await supabaseAdmin
      .from('restaurants')
      .select('id, owner_id, name, payment_due_date, auto_pause_after_days, billing_status, paused')
      .not('payment_due_date', 'is', null);

    if (error) throw error;

    let checked = 0;
    let pastDue = 0;
    let paused = 0;
    let messages = 0;

    for (const store of stores || []) {
      checked += 1;
      const dueDate = String(store.payment_due_date || '');
      if (!dueDate || dueDate > today) continue;

      const overdueDays = daysBetween(dueDate, today);
      const autoPauseAfterDays = Number(store.auto_pause_after_days || 7);
      const shouldPause = overdueDays >= autoPauseAfterDays;
      const status = shouldPause ? 'paused_unpaid' : 'past_due';

      const updatePatch: Record<string, any> = {
        billing_status: status,
        overdue_days: overdueDays,
        billing_note: shouldPause
          ? `Auto-paused after ${overdueDays} overdue days.`
          : `Past due by ${overdueDays} day(s).`,
      };

      if (shouldPause) {
        updatePatch.paused = true;
        updatePatch.pause_reason = 'Auto-paused for unpaid monthly payment.';
        paused += 1;
      } else {
        pastDue += 1;
      }

      await supabaseAdmin.from('restaurants').update(updatePatch).eq('id', store.id);

      await supabaseAdmin.from('admin_messages').insert({
        restaurant_id: store.id,
        owner_id: store.owner_id,
        sender: 'admin',
        subject: shouldPause ? 'Account paused for unpaid monthly payment' : 'Monthly payment past due',
        message: shouldPause
          ? `Your ORDA account is paused because the monthly payment is ${overdueDays} day(s) past due. Please update payment to reactivate.`
          : `Your ORDA monthly payment is ${overdueDays} day(s) past due. Please make payment to avoid pause.`,
        message_type: shouldPause ? 'auto_pause' : 'payment_reminder',
        status: 'sent',
        read_by_owner: false,
        read_by_admin: true,
      });

      messages += 1;
    }

    return NextResponse.json({ checked, pastDue, paused, messages });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Billing check failed.' }, { status: 500 });
  }
}
