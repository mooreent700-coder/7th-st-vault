'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type OrderRow = {
  id: string;
  restaurant_id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  customer_email: string | null;
  amount_subtotal: number;
  amount_total: number;
  application_fee_amount: number;
  status: string;
  currency: string;
  created_at: string;
};

type RestaurantRow = {
  id: string;
  name: string | null;
};

function money(cents: number) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}

export default function OwnerOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [restaurantMap, setRestaurantMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError('');

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error('You must be logged in.');
        }

        const { data: restaurants, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('owner_id', user.id);

        if (restaurantError) {
          throw restaurantError;
        }

        const ownedRestaurants = (restaurants || []) as RestaurantRow[];
        const restaurantIds = ownedRestaurants.map((item) => item.id);

        const map: Record<string, string> = {};
        ownedRestaurants.forEach((item) => {
          map[item.id] = item.name || 'Untitled store';
        });

        if (!mounted) return;
        setRestaurantMap(map);

        if (!restaurantIds.length) {
          setOrders([]);
          return;
        }

        const { data: orderRows, error: orderError } = await supabase
          .from('orders')
          .select(
            'id, restaurant_id, stripe_session_id, stripe_payment_intent_id, customer_email, amount_subtotal, amount_total, application_fee_amount, status, currency, created_at'
          )
          .in('restaurant_id', restaurantIds)
          .order('created_at', { ascending: false });

        if (orderError) {
          throw orderError;
        }

        if (!mounted) return;
        setOrders((orderRows || []) as OrderRow[]);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Could not load orders.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const paid = orders.filter((item) => item.status === 'paid');
    return {
      orders: orders.length,
      revenue: paid.reduce((sum, item) => sum + Number(item.amount_total || 0), 0),
      fees: paid.reduce((sum, item) => sum + Number(item.application_fee_amount || 0), 0),
    };
  }, [orders]);

  return (
    <main className="page">
      <section className="shell">
        <div className="topRow">
          <div>
            <div className="eyebrow">MenuFlow Owner</div>
            <h1>Orders</h1>
            <p>Track paid, pending, failed, and expired orders.</p>
          </div>

          <Link href="/dashboard/owner" className="backLink">
            Back
          </Link>
        </div>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Total Orders</div>
            <div className="statValue">{totals.orders}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Paid Revenue</div>
            <div className="statValue">{money(totals.revenue)}</div>
          </div>

          <div className="statCard">
            <div className="statLabel">Platform Fees</div>
            <div className="statValue">{money(totals.fees)}</div>
          </div>
        </div>

        {loading ? <div className="panel">Loading orders...</div> : null}
        {error ? <div className="panel error">{error}</div> : null}

        {!loading && !error ? (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Fee</th>
                  <th>Email</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.length ? (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td>{restaurantMap[order.restaurant_id] || 'Store'}</td>
                      <td>
                        <span className={`status status-${order.status}`}>{order.status}</span>
                      </td>
                      <td>{money(order.amount_total)}</td>
                      <td>{money(order.application_fee_amount)}</td>
                      <td>{order.customer_email || '—'}</td>
                      <td>{formatDate(order.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>No orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
          padding: 24px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .shell {
          max-width: 1200px;
          margin: 0 auto;
        }
        .topRow {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 16px;
          margin-bottom: 20px;
        }
        .eyebrow {
          color: #718096;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }
        h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(34px, 6vw, 60px);
          line-height: 0.94;
          letter-spacing: -0.05em;
          font-weight: 900;
        }
        p {
          margin: 12px 0 0;
          color: #566274;
          font-size: 18px;
          line-height: 1.5;
          font-weight: 700;
        }
        .backLink {
          display: inline-flex;
          min-height: 52px;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          border-radius: 16px;
          background: #0f172a;
          color: #fff;
          font-size: 16px;
          font-weight: 900;
          text-decoration: none;
        }
        .statsGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }
        .statCard,
        .panel,
        .tableWrap {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 24px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
        }
        .statCard {
          padding: 20px;
        }
        .statLabel {
          color: #718096;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .statValue {
          margin-top: 10px;
          color: #0f172a;
          font-size: 36px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
        }
        .panel {
          padding: 18px 20px;
          margin-bottom: 14px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 800;
        }
        .error {
          color: #991b1b;
          background: rgba(220, 38, 38, 0.08);
          border-color: rgba(220, 38, 38, 0.15);
        }
        .tableWrap {
          overflow: hidden;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        .table th,
        .table td {
          padding: 16px 18px;
          text-align: left;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          color: #0f172a;
          font-size: 15px;
          font-weight: 700;
          vertical-align: top;
        }
        .table th {
          background: #f8fbff;
          color: #718096;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .status {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .status-paid {
          background: rgba(22, 163, 74, 0.12);
          color: #166534;
        }
        .status-pending {
          background: rgba(234, 179, 8, 0.12);
          color: #854d0e;
        }
        .status-failed,
        .status-expired {
          background: rgba(220, 38, 38, 0.12);
          color: #991b1b;
        }
        @media (max-width: 900px) {
          .statsGrid {
            grid-template-columns: 1fr;
          }
          .tableWrap {
            overflow-x: auto;
          }
          .table {
            min-width: 760px;
          }
        }
        @media (max-width: 640px) {
          .page {
            padding: 16px;
          }
          .topRow {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}