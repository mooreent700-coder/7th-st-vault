import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 🔹 GET RESTAURANTS
    const { data: restaurants, error: rError } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (rError) throw rError;

    const ids = restaurants.map(r => r.id);

    // 🔹 GET ORDERS
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .in('restaurant_id', ids);

    // 🔹 GET FLYER ORDERS (safe if missing)
    const { data: flyerOrders, error: fError } = await supabase
      .from('flyer_orders')
      .select('*')
      .in('restaurant_id', ids);

    const safeFlyers = fError ? [] : flyerOrders;

    // 🔹 GET MESSAGES
    const { data: messages } = await supabase
      .from('support_messages')
      .select('*')
      .in('restaurant_id', ids)
      .order('created_at', { ascending: false });

    // 🔹 BUILD ENRICHED DATA
    const enriched = restaurants.map(r => {
      const rOrders = (orders || []).filter(o => o.restaurant_id === r.id);
      const rFlyers = (safeFlyers || []).filter(f => f.restaurant_id === r.id);
      const rMessages = (messages || []).filter(m => m.restaurant_id === r.id);

      const revenue = rOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      return {
        ...r,
        total_orders: rOrders.length,
        total_revenue: revenue,
        flyer_orders: rFlyers.length,
        unread_messages: rMessages.filter(m => m.sender_role === 'owner').length,
        messages: rMessages.slice(0, 5)
      };
    });

    // 🔹 SUMMARY STATS
    const summary = {
      total_restaurants: enriched.length,
      total_orders: enriched.reduce((s, r) => s + r.total_orders, 0),
      total_revenue: enriched.reduce((s, r) => s + r.total_revenue, 0),

      active: enriched.filter(r => r.payment_status === 'active').length,
      past_due: enriched.filter(r => r.payment_status === 'past_due').length,
      paused: enriched.filter(r => r.account_status === 'paused').length,

      pending_flyers: enriched.reduce((s, r) => s + r.flyer_orders, 0),
      unread_messages: enriched.reduce((s, r) => s + r.unread_messages, 0)
    };

    return NextResponse.json({
      summary,
      restaurants: enriched
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Dashboard failed' },
      { status: 500 }
    );
  }
}