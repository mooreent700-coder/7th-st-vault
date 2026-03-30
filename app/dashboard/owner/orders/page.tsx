'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

type Lang = 'en' | 'es';
type FilterKey = 'all' | 'new' | 'yellow' | 'green';

type RestaurantRecord = {
  id: string;
  slug: string | null;
  owner_order_language?: string | null;
  order_language?: string | null;
};

type MenuItemRecord = {
  id: string;
  name: string | null;
  image_url: string | null;
};

type OrderRecord = {
  id: string;
  customer_name?: string | null;
  total?: number | string | null;
  status?: string | null;
  created_at?: string | null;
  items_summary?: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const copy = {
  en: {
    title: 'Live Orders',
    subtitle: 'All active and recent orders in one place',
    back: 'Back to Dashboard',
    all: 'All',
    new: 'New',
    yellow: 'Yellow',
    green: 'Green',
    noOrders: 'No orders found',
    loading: 'Loading orders...',
    viewStore: 'View Store',
    customer: 'Customer',
    orderReceived: 'Order received',
    liveNow: 'Live now',
    connected: 'Realtime connected',
  },
  es: {
    title: 'Pedidos activos',
    subtitle: 'Todos los pedidos activos y recientes en un solo lugar',
    back: 'Volver al Dashboard',
    all: 'Todo',
    new: 'Nuevo',
    yellow: 'Amarillo',
    green: 'Verde',
    noOrders: 'No se encontraron pedidos',
    loading: 'Cargando pedidos...',
    viewStore: 'Ver tienda',
    customer: 'Cliente',
    orderReceived: 'Pedido recibido',
    liveNow: 'En vivo',
    connected: 'Tiempo real conectado',
  },
} as const;

function safeNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function displayStatus(status?: string | null) {
  if (!status) return 'New';
  const s = status.toLowerCase();
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('ready')) return 'Almost Ready';
  if (s.includes('prep') || s.includes('almost')) return 'Preparing';
  if (s.includes('complete')) return 'Completed';
  if (s.includes('new')) return 'New';
  return status;
}

function parseStatusTone(status?: string | null) {
  const s = displayStatus(status).toLowerCase();
  if (s.includes('cancel')) return 'red';
  if (s.includes('ready')) return 'yellow';
  if (s.includes('prep') || s.includes('new') || s.includes('complete')) return 'green';
  return 'neutral';
}

function shortTime(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fallbackImage(label: string) {
  const safeLabel = label || 'MenuFlow';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
      <rect width="100%" height="100%" rx="24" fill="#eef2f5"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="24" font-weight="700">${safeLabel}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function findOrderImage(order: OrderRecord, menuItems: MenuItemRecord[]) {
  const summary = (order.items_summary || '').toLowerCase();
  const matched = menuItems.find((item) => {
    const name = (item.name || '').toLowerCase();
    return !!name && summary.includes(name);
  });

  return matched?.image_url || fallbackImage(matched?.name || order.customer_name || 'Order');
}

function sortOrdersNewest(list: OrderRecord[]) {
  return [...list].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

export default function OwnerOrdersPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantRecord | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const t = copy[lang];

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, slug, owner_order_language, order_language')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        const r = restaurantData as RestaurantRecord | null;

        if (mounted) {
          setRestaurant(r);
          const savedLang =
            (r?.owner_order_language || r?.order_language || 'en').toString().toLowerCase() ===
            'es'
              ? 'es'
              : 'en';
          setLang(savedLang);
        }

        if (r?.id) {
          const [ordersRes, itemsRes] = await Promise.all([
            supabase
              .from('orders')
              .select('id, customer_name, total, status, created_at, items_summary')
              .eq('restaurant_id', r.id)
              .order('created_at', { ascending: false })
              .limit(200),
            supabase.from('menu_items').select('id, name, image_url').eq('restaurant_id', r.id),
          ]);

          if (!ordersRes.error && mounted) {
            setOrders(sortOrdersNewest((ordersRes.data || []) as OrderRecord[]));
          }

          if (!itemsRes.error && mounted) {
            setMenuItems((itemsRes.data || []) as MenuItemRecord[]);
          }

          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }

          const channel = supabase
            .channel(`owner-orders-${r.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `restaurant_id=eq.${r.id}`,
              },
              async (payload) => {
                const eventType = payload.eventType;

                if (eventType === 'INSERT') {
                  const inserted = payload.new as OrderRecord;
                  setOrders((prev) => {
                    const exists = prev.some((item) => item.id === inserted.id);
                    if (exists) {
                      return sortOrdersNewest(
                        prev.map((item) => (item.id === inserted.id ? { ...item, ...inserted } : item))
                      );
                    }
                    return sortOrdersNewest([inserted, ...prev]);
                  });
                  return;
                }

                if (eventType === 'UPDATE') {
                  const updated = payload.new as OrderRecord;
                  setOrders((prev) =>
                    sortOrdersNewest(
                      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
                    )
                  );
                  return;
                }

                if (eventType === 'DELETE') {
                  const deleted = payload.old as OrderRecord;
                  setOrders((prev) => prev.filter((item) => item.id !== deleted.id));
                  return;
                }

                const refresh = await supabase
                  .from('orders')
                  .select('id, customer_name, total, status, created_at, items_summary')
                  .eq('restaurant_id', r.id)
                  .order('created_at', { ascending: false })
                  .limit(200);

                if (!refresh.error) {
                  setOrders(sortOrdersNewest((refresh.data || []) as OrderRecord[]));
                }
              }
            )
            .subscribe();

          channelRef.current = channel;
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [router]);

  const filteredOrders = useMemo(() => {
    let list = orders.filter(
      (order) => !displayStatus(order.status).toLowerCase().includes('cancelled')
    );

    if (filter === 'new') {
      list = list.filter((item) => {
        const s = displayStatus(item.status).toLowerCase();
        return s === 'new' || s === 'preparing';
      });
    } else if (filter !== 'all') {
      list = list.filter((item) => parseStatusTone(item.status) === filter);
    }

    return list;
  }, [orders, filter]);

  if (loading) {
    return (
      <main className="loadingShell">
        <span>{t.loading}</span>

        <style jsx>{`
          .loadingShell {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f4f4f6;
            color: #111827;
            font-family: Inter, sans-serif;
            font-weight: 700;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="topbar">
        <div>
          <div className="liveBadgeRow">
            <span className="liveBadge">{t.liveNow}</span>
            <span className="liveText">{t.connected}</span>
          </div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="topActions">
          <Link href="/dashboard/owner" className="ghostBtn">
            {t.back}
          </Link>

          <Link
            href={restaurant?.slug ? `/store/${restaurant.slug}` : '/dashboard/owner'}
            className="darkBtn"
          >
            {t.viewStore}
          </Link>
        </div>
      </div>

      <div className="filters">
        {([
          { key: 'all', label: t.all },
          { key: 'new', label: t.new },
          { key: 'yellow', label: t.yellow },
          { key: 'green', label: t.green },
        ] as const).map((item) => (
          <button
            key={item.key}
            type="button"
            className={filter === item.key ? 'chip chipActive' : 'chip'}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="ordersGrid">
        {filteredOrders.length ? (
          filteredOrders.map((order) => (
            <article key={order.id} className="orderCard">
              <img
                src={findOrderImage(order, menuItems)}
                alt={order.items_summary || order.customer_name || 'Order image'}
                className="thumb"
              />

              <div className="cardBody">
                <div className="cardTop">
                  <div>
                    <div className="orderId">{order.id}</div>
                    <div className="customer">{order.customer_name || t.customer}</div>
                  </div>

                  <div className="amountBlock">
                    <strong>{currency(safeNumber(order.total || 0))}</strong>
                    <span>{shortTime(order.created_at)}</span>
                  </div>
                </div>

                <div className="summary">{order.items_summary || t.orderReceived}</div>

                <div className="footer">
                  <span className={`status status-${parseStatusTone(order.status)}`}>
                    {displayStatus(order.status)}
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">{t.noOrders}</div>
        )}
      </section>

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          padding: 0;
          background: #efeff2;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }

        .page {
          min-height: 100vh;
          padding: 24px 24px 110px;
          background: radial-gradient(circle at top, rgba(255, 255, 255, 0.86), rgba(240, 241, 244, 0.94));
        }

        .topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .liveBadgeRow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .liveBadge {
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          background: #e8fbf5;
          color: #0f766e;
          border: 1px solid #ccefe3;
          display: inline-flex;
          align-items: center;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .liveText {
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .topbar h1 {
          margin: 0;
          font-size: 2rem;
          color: #111827;
          letter-spacing: -0.04em;
        }

        .topbar p {
          margin: 6px 0 0;
          color: #6b7280;
          font-weight: 600;
        }

        .topActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ghostBtn,
        .darkBtn {
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-weight: 700;
          background: #fff;
          color: #111827;
        }

        .darkBtn {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }

        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .chip {
          min-height: 38px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #6b7280;
          font-weight: 700;
          cursor: pointer;
        }

        .chipActive {
          background: #eff6f5;
          color: #2f6463;
          border-color: #dce9e8;
        }

        .ordersGrid {
          display: grid;
          gap: 14px;
        }

        .orderCard {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 14px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e8ebef;
          border-radius: 22px;
          padding: 14px;
          box-shadow: 0 14px 34px rgba(20, 23, 28, 0.04);
        }

        .thumb {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 18px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
        }

        .cardBody {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .cardTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .orderId {
          color: #6b7280;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .customer {
          margin-top: 6px;
          color: #111827;
          font-size: 1.12rem;
          font-weight: 800;
        }

        .amountBlock {
          text-align: right;
          display: grid;
          gap: 6px;
        }

        .amountBlock strong {
          color: #111827;
          font-size: 1.05rem;
        }

        .amountBlock span {
          color: #6b7280;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .summary {
          margin-top: 14px;
          color: #4b5563;
          font-size: 0.96rem;
          line-height: 1.45;
        }

        .footer {
          margin-top: 14px;
        }

        .status {
          min-height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          font-size: 0.9rem;
          font-weight: 700;
          border: 1px solid transparent;
        }

        .status-yellow {
          background: #f4ead0;
          color: #8a6a28;
          border-color: #ecddb8;
        }

        .status-green {
          background: #ddf3e7;
          color: #377b59;
          border-color: #cfead9;
        }

        .status-red {
          background: #f9d9dc;
          color: #b44c57;
          border-color: #f2c4ca;
        }

        .status-neutral {
          background: #eef2f5;
          color: #64707d;
          border-color: #dbe3e9;
        }

        .empty {
          min-height: 140px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          border: 1px solid #e8ebef;
          background: #fff;
          color: #6b7280;
          font-weight: 700;
        }

        @media (max-width: 720px) {
          .page {
            padding: 16px 12px 110px;
          }

          .topbar {
            flex-direction: column;
          }

          .orderCard {
            grid-template-columns: 88px 1fr;
            gap: 12px;
          }

          .thumb {
            width: 88px;
            height: 88px;
            border-radius: 14px;
          }

          .customer {
            font-size: 1rem;
          }
        }
      `}</style>
    </main>
  );
}