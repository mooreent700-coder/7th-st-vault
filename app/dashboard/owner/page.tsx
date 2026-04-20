'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type StoreRecord = {
  id: string;
  name: string | null;
  slug: string | null;
  plan?: string | null;
  stripe_connected?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  phone?: string | null;
  address?: string | null;
};

type OrderRow = {
  id: string;
  customer_name?: string | null;
  total?: number | null;
  amount_total?: number | null;
  status?: string | null;
  created_at?: string | null;
  items_summary?: string | null;
};

type MenuItemRow = {
  id: string;
  name?: string | null;
};

type OwnerAction =
  | 'accept'
  | 'ready'
  | 'complete'
  | 'cancel';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://menuflow-app-mu.vercel.app';

const BG = '#f6f7fb';
const CARD = '#ffffff';
const BORDER = '#e7e8ee';
const TEXT = '#111827';
const MUTED = '#6b7280';
const NAVY = '#111827';
const TEAL = '#5da9a6';
const GREEN = '#16a34a';
const RED = '#e56f73';
const YELLOW = '#d8b45c';

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getStoreName(store: StoreRecord | null) {
  return store?.name?.trim() || 'MenuFlow Store';
}

function getStoreSlug(store: StoreRecord | null) {
  const raw = store?.slug?.trim() || getStoreName(store);
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-');
}

function getStoreUrl(store: StoreRecord | null) {
  const slug = getStoreSlug(store);
  return `${BASE_URL}/store/${slug}`;
}

function formatTime(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDate(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function isToday(value?: string | null) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(value?: string | null) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = (day + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset, 0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

function getOrderAmount(order: OrderRow) {
  return Number(order.total ?? order.amount_total ?? 0);
}

function getStatusKey(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('complete')) return 'completed';
  if (s.includes('ready')) return 'ready';
  if (s.includes('progress') || s.includes('accepted')) return 'in_progress';
  if (s.includes('new') || s.includes('pending')) return 'new';
  return 'new';
}

function getStatusLabel(status?: string | null) {
  const key = getStatusKey(status);
  if (key === 'cancelled') return 'Cancelled';
  if (key === 'completed') return 'Completed';
  if (key === 'ready') return 'Almost Ready';
  if (key === 'in_progress') return 'In Progress';
  return 'New';
}

function getStatusTone(status?: string | null) {
  const key = getStatusKey(status);
  if (key === 'cancelled') return 'red';
  if (key === 'completed') return 'green';
  if (key === 'ready') return 'yellow';
  if (key === 'in_progress') return 'blue';
  return 'neutral';
}

function initialsFromName(value: string) {
  return (
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'M'
  );
}

function getNextStatusValue(action: OwnerAction) {
  if (action === 'accept') return 'in_progress';
  if (action === 'ready') return 'ready';
  if (action === 'complete') return 'completed';
  return 'cancelled';
}

function getPrimaryAction(status?: string | null): { label: string; action: OwnerAction } | null {
  const key = getStatusKey(status);
  if (key === 'new') return { label: 'Accept Order', action: 'accept' };
  if (key === 'in_progress') return { label: 'Mark Ready', action: 'ready' };
  if (key === 'ready') return { label: 'Complete Order', action: 'complete' };
  return null;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="statCard">
      <div className="statLabel">{label}</div>
      <div className="statValue" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub ? <div className="statSub">{sub}</div> : null}
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'neutral' | 'green' | 'yellow' | 'red' | 'blue';
}) {
  return <span className={`pill ${tone}`}>{label}</span>;
}

export default function OwnerDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'NEW' | 'YELLOW' | 'GREEN'>('ALL');
  const [billingFilter, setBillingFilter] = useState<'ALL' | 'NEW' | 'YELLOW' | 'GREEN'>('ALL');
  const [updatingOrderId, setUpdatingOrderId] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          if (!active) return;
          setLoading(false);
          return;
        }

        const { data: restaurantRows, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id,name,slug,plan,stripe_connected,stripe_charges_enabled,stripe_payouts_enabled,phone,address')
          .eq('owner_id', user.id)
          .limit(1);

        if (restaurantError) throw restaurantError;

        const restaurant = ((restaurantRows || [])[0] || null) as StoreRecord | null;

        let orderRows: OrderRow[] = [];
        let itemRows: MenuItemRow[] = [];

        if (restaurant?.id) {
          const { data: fetchedOrders } = await supabase
            .from('orders')
            .select('id,customer_name,total,amount_total,status,created_at,items_summary')
            .eq('restaurant_id', restaurant.id)
            .order('created_at', { ascending: false })
            .limit(50);

          const { data: fetchedItems } = await supabase
            .from('menu_items')
            .select('id,name')
            .eq('restaurant_id', restaurant.id)
            .limit(100);

          orderRows = (fetchedOrders || []) as OrderRow[];
          itemRows = (fetchedItems || []) as MenuItemRow[];
        }

        if (!active) return;

        setStore(restaurant);
        setOrders(orderRows);
        setMenuItems(itemRows);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Could not load owner dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  async function updateOrderStatus(orderId: string, action: OwnerAction) {
    try {
      setUpdatingOrderId(orderId);
      const nextStatus = getNextStatusValue(action);

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: nextStatus,
              }
            : order
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Could not update order.');
    } finally {
      setUpdatingOrderId('');
    }
  }

  const storeName = useMemo(() => getStoreName(store), [store]);
  const storeUrl = useMemo(() => getStoreUrl(store), [store]);

  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (order) =>
          order.id?.toLowerCase().includes(q) ||
          order.customer_name?.toLowerCase().includes(q) ||
          order.items_summary?.toLowerCase().includes(q)
      );
    }

    if (orderFilter === 'NEW') list = list.filter((o) => getStatusLabel(o.status) === 'New');
    if (orderFilter === 'YELLOW') list = list.filter((o) => getStatusLabel(o.status) === 'Almost Ready');
    if (orderFilter === 'GREEN') list = list.filter((o) => getStatusLabel(o.status) === 'Completed');

    return list;
  }, [orders, search, orderFilter]);

  const billingOrders = useMemo(() => {
    let list = [...orders];
    if (billingFilter === 'NEW') list = list.filter((o) => getStatusLabel(o.status) === 'New');
    if (billingFilter === 'YELLOW') list = list.filter((o) => getStatusLabel(o.status) === 'Almost Ready');
    if (billingFilter === 'GREEN') list = list.filter((o) => getStatusLabel(o.status) === 'Completed');
    return list.slice(0, 4);
  }, [orders, billingFilter]);

  const todaysSales = useMemo(
    () => orders.filter((o) => isToday(o.created_at)).reduce((sum, o) => sum + getOrderAmount(o), 0),
    [orders]
  );

  const todaysOrders = useMemo(() => orders.filter((o) => isToday(o.created_at)).length, [orders]);

  const weekSales = useMemo(
    () => orders.filter((o) => isThisWeek(o.created_at)).reduce((sum, o) => sum + getOrderAmount(o), 0),
    [orders]
  );

  const revenueTotal = useMemo(() => orders.reduce((sum, o) => sum + getOrderAmount(o), 0), [orders]);

  const newOrdersCount = useMemo(
    () => orders.filter((order) => getStatusKey(order.status) === 'new').length,
    [orders]
  );

  const salesSeries = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = (day + 6) % 7;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);

    return labels.map((label, index) => {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const total = orders.reduce((sum, order) => {
        if (!order.created_at) return sum;
        const d = new Date(order.created_at);
        return d >= dayStart && d < dayEnd ? sum + getOrderAmount(order) : sum;
      }, 0);

      return { label, total };
    });
  }, [orders]);

  const chartMax = useMemo(() => Math.max(300, ...salesSeries.map((item) => item.total), 1), [salesSeries]);

  if (loading) {
    return (
      <main className="ownerPage loadingPage">
        <div className="loadingText">Loading owner dashboard...</div>
        <style jsx global>{`
          .ownerPage{min-height:100vh;background:${BG};font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
          .loadingPage{display:grid;place-items:center}
          .loadingText{font-size:24px;font-weight:900;color:${TEXT}}
        `}</style>
      </main>
    );
  }

  return (
    <main className="ownerPage">
      <div className="shell">
        <aside className="sidebar">
          <div className="brandRow">
            <div className="brandIcon">M</div>
            <div className="brandText">MenuFlow</div>
          </div>

          <button type="button" className="sideLink active">
            <span>▣</span>
            <span>Dashboard</span>
          </button>

          <button type="button" className="sideLink" onClick={() => router.push('/dashboard/owner')}>
            <span>☰</span>
            <span>Live Orders</span>
          </button>

          <button type="button" className="sideLink" onClick={() => router.push('/dashboard/owner/builder')}>
            <span>✎</span>
            <span>Menu Builder</span>
          </button>

          <button type="button" className="sideLink" onClick={() => router.push('/dashboard/owner/builder')}>
            <span>◔</span>
            <span>Payments</span>
          </button>

          <button type="button" className="sideLink" onClick={() => router.push('/dashboard/owner/flyers')}>
            <span>◡</span>
            <span>Flyers</span>
          </button>

          <button type="button" className="sideLink" onClick={() => router.push('/dashboard/owner/builder')}>
            <span>⚙</span>
            <span>Store Settings</span>
          </button>

          <button type="button" className="openStorefrontBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
            <span>◫</span>
            <span>Open Storefront</span>
          </button>
        </aside>

        <section className="mainArea">
          <header className="topbar">
            <div className="controlLabel">Owner Control</div>

            <div className="topActions">
              <div className="langGroup">
                <button type="button" className="langBtn active">EN</button>
                <button type="button" className="langBtn">ES</button>
              </div>

              <div className="searchShell">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders"
                />
              </div>

              <button type="button" className="ghostBtn" onClick={() => router.push('/dashboard/owner/builder')}>
                Open Builder
              </button>

              <button type="button" className="ghostBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                View Store
              </button>
            </div>
          </header>

          <div className="content">
            <section className="hero">
              <div>
                <h1>{storeName}</h1>
                <p>Owner Dashboard Overview</p>
              </div>

              <div className="heroSearchWrap">
                <div className="heroSearch">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search orders..."
                  />
                </div>

                <div className="heroImageCard">
                  <div className="heroMiniInfo">
                    <span className="heroMiniLabel">Storefront</span>
                    <strong>Live</strong>
                  </div>
                </div>
              </div>
            </section>

            {error ? <div className="errorBanner">{error}</div> : null}

            <section className="statsGrid">
              <StatCard label="Today's Sales" value={formatMoney(todaysSales)} />
              <StatCard label="Today's Orders" value={`${todaysOrders}`} />
              <StatCard label="Menu Items" value={`${menuItems.length}`} />
              <StatCard label="New Orders" value={`${newOrdersCount}`} sub="Needs action" accent={TEAL} />
            </section>

            <section className="salesCard">
              <div className="cardHeader">
                <h2>Sales Overview</h2>
                <div className="salesMeta">
                  <span className="salesMetaLabel">This Week</span>
                  <strong>{formatMoney(weekSales)}</strong>
                </div>
              </div>

              <div className="chartWrap">
                <div className="yAxis">
                  <span>$300</span>
                  <span>$200</span>
                  <span>$100</span>
                  <span>$0</span>
                </div>

                <div className="chart">
                  <svg viewBox="0 0 760 220" preserveAspectRatio="none" className="chartSvg">
                    <defs>
                      <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(93,169,166,0.35)" />
                        <stop offset="100%" stopColor="rgba(93,169,166,0.02)" />
                      </linearGradient>
                    </defs>

                    <g>
                      {[0, 1, 2, 3].map((line) => (
                        <line
                          key={line}
                          x1="0"
                          y1={20 + line * 50}
                          x2="760"
                          y2={20 + line * 50}
                          stroke="#e8edf0"
                          strokeWidth="1"
                        />
                      ))}
                    </g>

                    <path
                      d={salesSeries
                        .map((point, index) => {
                          const x = 20 + index * 120;
                          const y = 180 - (point.total / chartMax) * 150;
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke={TEAL}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d={`${salesSeries
                        .map((point, index) => {
                          const x = 20 + index * 120;
                          const y = 180 - (point.total / chartMax) * 150;
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')} L 740 200 L 20 200 Z`}
                      fill="url(#lineFill)"
                      stroke="none"
                    />

                    {salesSeries.map((point, index) => {
                      const x = 20 + index * 120;
                      const y = 180 - (point.total / chartMax) * 150;
                      return (
                        <g key={point.label}>
                          <circle cx={x} cy={y} r="5" fill="#fff" stroke={TEAL} strokeWidth="3" />
                          {index === 5 ? (
                            <>
                              <rect x={x - 34} y={y - 50} width="68" height="28" rx="8" fill={TEAL} />
                              <text x={x} y={y - 31} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">
                                {formatMoney(point.total || 275)}
                              </text>
                            </>
                          ) : null}
                        </g>
                      );
                    })}
                  </svg>

                  <div className="xAxis">
                    {salesSeries.map((point) => (
                      <span key={point.label}>{point.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="middleGrid">
              <div className="card liveOrdersCard">
                <div className="cardHeader">
                  <h2>Live Orders</h2>
                  <button type="button" className="viewLink" onClick={() => router.push('/dashboard/owner')}>
                    View All
                  </button>
                </div>

                <div className="filterRow">
                  <button type="button" className={orderFilter === 'ALL' ? 'miniFilter active' : 'miniFilter'} onClick={() => setOrderFilter('ALL')}>All</button>
                  <button type="button" className={orderFilter === 'NEW' ? 'miniFilter active' : 'miniFilter'} onClick={() => setOrderFilter('NEW')}>New</button>
                  <button type="button" className={orderFilter === 'YELLOW' ? 'miniFilter active' : 'miniFilter'} onClick={() => setOrderFilter('YELLOW')}>Ready</button>
                  <button type="button" className={orderFilter === 'GREEN' ? 'miniFilter active' : 'miniFilter'} onClick={() => setOrderFilter('GREEN')}>Done</button>
                </div>

                <div className="ordersList">
                  {filteredOrders.slice(0, 6).map((order) => {
                    const primaryAction = getPrimaryAction(order.status);

                    return (
                      <div key={order.id} className="orderCard">
                        <div className="orderTop">
                          <div className="orderIdentity">
                            <div className="avatarCircle">
                              {initialsFromName(order.customer_name || 'Customer')}
                            </div>

                            <div>
                              <div className="orderCode">{order.customer_name || 'Customer'}</div>
                              <div className="orderMetaLine">
                                #{order.id.slice(0, 7)} · {formatDate(order.created_at)} · {formatTime(order.created_at)}
                              </div>
                            </div>
                          </div>

                          <div className="orderMoney">{formatMoney(getOrderAmount(order))}</div>
                        </div>

                        <div className="orderItems">{order.items_summary || 'No order summary added yet.'}</div>

                        <div className="orderBottom">
                          <StatusPill
                            label={getStatusLabel(order.status)}
                            tone={getStatusTone(order.status) as 'neutral' | 'green' | 'yellow' | 'red' | 'blue'}
                          />

                          <div className="orderActionRow">
                            {primaryAction ? (
                              <button
                                type="button"
                                className="actionBtn primaryActionBtn"
                                disabled={updatingOrderId === order.id}
                                onClick={() => updateOrderStatus(order.id, primaryAction.action)}
                              >
                                {updatingOrderId === order.id ? 'Updating...' : primaryAction.label}
                              </button>
                            ) : null}

                            {getStatusKey(order.status) !== 'completed' && getStatusKey(order.status) !== 'cancelled' ? (
                              <button
                                type="button"
                                className="actionBtn cancelBtn"
                                disabled={updatingOrderId === order.id}
                                onClick={() => updateOrderStatus(order.id, 'cancel')}
                              >
                                Cancel
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {!filteredOrders.length ? <div className="emptyBox">No orders yet.</div> : null}
                </div>
              </div>

              <div className="card billingCard">
                <div className="cardHeader">
                  <h2>Billing + Store</h2>
                </div>

                <div className="filterRow">
                  <button type="button" className={billingFilter === 'ALL' ? 'miniFilter active' : 'miniFilter'} onClick={() => setBillingFilter('ALL')}>All</button>
                  <button type="button" className={billingFilter === 'NEW' ? 'miniFilter active' : 'miniFilter'} onClick={() => setBillingFilter('NEW')}>New</button>
                  <button type="button" className={billingFilter === 'YELLOW' ? 'miniFilter active' : 'miniFilter'} onClick={() => setBillingFilter('YELLOW')}>Ready</button>
                  <button type="button" className={billingFilter === 'GREEN' ? 'miniFilter active' : 'miniFilter'} onClick={() => setBillingFilter('GREEN')}>Done</button>
                </div>

                <div className="stripeStatusCard">
                  <div className="stripeTitle">Stripe Status</div>
                  <div className="stripeRow">
                    <StatusPill label={store?.stripe_connected ? 'Connected' : 'Not Connected'} tone={store?.stripe_connected ? 'green' : 'neutral'} />
                    <StatusPill label={store?.stripe_charges_enabled ? 'Charges Enabled' : 'Charges Pending'} tone={store?.stripe_charges_enabled ? 'green' : 'yellow'} />
                    <StatusPill label={store?.stripe_payouts_enabled ? 'Payouts Enabled' : 'Payouts Pending'} tone={store?.stripe_payouts_enabled ? 'green' : 'yellow'} />
                  </div>
                </div>

                <div className="statusList compact">
                  <div className="statusRow"><span>Store Name</span><strong>{storeName}</strong></div>
                  <div className="statusRow"><span>Plan</span><strong>{store?.plan || 'Starter'}</strong></div>
                  <div className="statusRow"><span>Phone</span><strong>{store?.phone || 'Add your business phone'}</strong></div>
                  <div className="statusRow"><span>Address</span><strong>{store?.address || 'Add your business address'}</strong></div>
                </div>

                <div className="billingList">
                  {billingOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="billingOrder">
                      <div className="orderTop">
                        <div>
                          <div className="orderCode">{order.customer_name || 'Customer'}</div>
                          <div className="orderItems">#{order.id.slice(0, 7)} · {formatDate(order.created_at)}</div>
                        </div>
                        <div className="orderMoney">{formatMoney(getOrderAmount(order))}</div>
                      </div>

                      <div className="orderBottom">
                        <StatusPill
                          label={getStatusLabel(order.status)}
                          tone={getStatusTone(order.status) as 'neutral' | 'green' | 'yellow' | 'red' | 'blue'}
                        />
                        <span className="orderTime">{formatTime(order.created_at)}</span>
                      </div>
                    </div>
                  ))}

                  {!billingOrders.length ? <div className="emptyBox">No billing activity yet.</div> : null}
                </div>
              </div>
            </section>

            <section className="bottomGrid">
              <div className="card">
                <div className="cardHeader">
                  <h2>Quick Actions</h2>
                </div>
                <div className="quickGrid">
                  <button type="button" className="quickBtn" onClick={() => router.push('/dashboard/owner/builder')}>Open Builder</button>
                  <button type="button" className="quickBtn" onClick={() => router.push('/dashboard/owner/flyers')}>Open Flyers</button>
                  <button type="button" className="quickBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>Preview Store</button>
                  <button type="button" className="quickBtn" onClick={() => router.push('/dashboard/owner/builder')}>Go Live / Stripe</button>
                </div>
              </div>

              <div className="card">
                <div className="cardHeader">
                  <h2>Performance</h2>
                </div>
                <div className="statusList">
                  <div className="statusRow"><span>This Week Sales</span><strong>{formatMoney(weekSales)}</strong></div>
                  <div className="statusRow"><span>Revenue</span><strong>{formatMoney(revenueTotal)}</strong></div>
                  <div className="statusRow"><span>Total Orders</span><strong>{orders.length}</strong></div>
                  <div className="statusRow"><span>Menu Items</span><strong>{menuItems.length}</strong></div>
                </div>
              </div>

              <div className="card">
                <div className="cardHeader">
                  <h2>Storefront</h2>
                </div>
                <div className="storefrontCard">
                  <div className="storefrontLabel">Live Store URL</div>
                  <div className="storefrontLink">{storeUrl}</div>
                  <div className="storefrontActions">
                    <button
                      type="button"
                      className="smallActionBtn"
                      onClick={() => navigator.clipboard.writeText(storeUrl)}
                    >
                      Copy Link
                    </button>
                    <button
                      type="button"
                      className="smallActionBtn dark"
                      onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}
                    >
                      Open Store
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <aside className="mobilePreview">
          <div className="phoneShell">
            <div className="phoneTop">
              <span>☰</span>
              <div className="phoneBrand">
                <div className="phoneBrandIcon">M</div>
                <span>MenuFlow</span>
              </div>
              <span>◔</span>
            </div>

            <div className="phoneSectionTitle">Overview</div>

            <div className="phoneCard">
              <div className="phoneMiniLabel">Today's Sales</div>
              <div className="phoneBigValue">{formatMoney(todaysSales)}</div>
              <div className="phoneMiniSub">This Week</div>
            </div>

            <div className="phoneStatsRow">
              <div className="phoneSmallCard">
                <div className="phoneMiniLabel">Today's Orders</div>
                <div className="phoneBigValue">{todaysOrders}</div>
              </div>
              <div className="phoneSmallCard">
                <div className="phoneMiniLabel">Menu</div>
                <div className="phoneBigValue">{menuItems.length}</div>
              </div>
            </div>

            <div className="phoneCard">
              <div className="phoneMiniLabel">Revenue</div>
              <div className="phoneRevenueRow">
                <StatusPill label="+ Live" tone="green" />
                <strong>{formatMoney(revenueTotal)}</strong>
              </div>
            </div>

            <div className="phoneCard">
              <div className="cardHeader phoneHeader">
                <h3>Live Orders</h3>
                <button type="button" className="viewLink small" onClick={() => router.push('/dashboard/owner')}>
                  View All
                </button>
              </div>

              {filteredOrders.slice(0, 1).map((order) => (
                <div key={order.id} className="phoneOrder">
                  <div className="orderTop">
                    <div>
                      <div className="orderCode">{order.customer_name || 'Customer'}</div>
                      <div className="orderItems">{order.items_summary || 'No summary yet.'}</div>
                    </div>
                    <div className="orderMoney">{formatMoney(getOrderAmount(order))}</div>
                  </div>

                  <div className="orderBottom">
                    <StatusPill
                      label={getStatusLabel(order.status)}
                      tone={getStatusTone(order.status) as 'neutral' | 'green' | 'yellow' | 'red' | 'blue'}
                    />
                    <span className="orderTime">{formatTime(order.created_at)}</span>
                  </div>
                </div>
              ))}

              {!filteredOrders.length ? <div className="emptyBox phoneEmpty">No orders yet.</div> : null}
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .ownerPage{min-height:100vh;background:${BG};color:${TEXT};font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        .shell{width:min(1280px,calc(100vw - 40px));margin:40px auto;display:grid;grid-template-columns:220px minmax(0,1fr) 290px;border:1px solid ${BORDER};border-radius:28px;overflow:hidden;background:rgba(255,255,255,.54);box-shadow:0 20px 80px rgba(15,23,42,.08);backdrop-filter:blur(8px)}
        .sidebar{background:rgba(255,255,255,.78);border-right:1px solid ${BORDER};padding:18px;display:flex;flex-direction:column;gap:10px}
        .brandRow{display:flex;align-items:center;gap:12px;padding:6px 6px 18px}
        .brandIcon{width:38px;height:38px;border-radius:999px;background:${NAVY};color:#fff;display:grid;place-items:center;font-weight:900;font-size:22px}
        .brandText{font-size:20px;font-weight:900;letter-spacing:-.03em}
        .sideLink{height:46px;border:none;border-radius:14px;background:transparent;display:flex;align-items:center;gap:12px;padding:0 12px;color:#4b5563;font-size:15px;font-weight:700;cursor:pointer;text-align:left}
        .sideLink.active{background:#eef0f4;color:${TEXT};box-shadow:inset 2px 0 0 ${NAVY}}
        .openStorefrontBtn{margin-top:auto;height:52px;border:1px solid ${BORDER};border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font-size:15px;font-weight:800;color:${TEXT};cursor:pointer}
        .mainArea{min-width:0;background:rgba(255,255,255,.68)}
        .topbar{height:68px;border-bottom:1px solid ${BORDER};padding:0 18px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .controlLabel{font-size:15px;color:#4b5563;font-weight:700}
        .topActions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .langGroup{display:flex;align-items:center;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;background:#fff}
        .langBtn{height:34px;padding:0 12px;border:none;background:#fff;color:#4b5563;font-size:14px;font-weight:800;cursor:pointer}
        .langBtn.active{background:#eef4f4;color:${TEXT}}
        .searchShell,.heroSearch{height:40px;border:1px solid ${BORDER};background:#fff;border-radius:12px;display:flex;align-items:center;gap:8px;padding:0 12px;color:#6b7280}
        .searchShell input,.heroSearch input{border:none;outline:none;background:transparent;font-size:14px;width:160px;color:${TEXT}}
        .ghostBtn{height:40px;padding:0 16px;border:1px solid ${BORDER};border-radius:12px;background:#fff;color:${TEXT};font-size:14px;font-weight:800;cursor:pointer}
        .content{padding:18px}
        .hero{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
        .hero h1{margin:0;font-size:42px;line-height:1;font-weight:900;letter-spacing:-.05em}
        .hero p{margin:6px 0 0;color:${MUTED};font-size:15px}
        .heroSearchWrap{display:flex;align-items:center;gap:14px}
        .heroImageCard{width:190px;height:68px;border:1px solid ${BORDER};border-radius:14px;background:linear-gradient(135deg,rgba(17,24,39,.06),rgba(93,169,166,.12));position:relative;overflow:hidden}
        .heroImageCard::after{content:'';position:absolute;inset:14px;background:linear-gradient(90deg,rgba(255,255,255,.9),rgba(255,255,255,.25));border-radius:10px}
        .heroMiniInfo{position:absolute;right:14px;top:14px;z-index:2;display:flex;flex-direction:column;align-items:flex-end}
        .heroMiniLabel{font-size:11px;color:${MUTED};font-weight:800;letter-spacing:.05em;text-transform:uppercase}
        .errorBanner{margin-top:14px;border:1px solid #f2c8cd;background:#fff0f1;color:#a12639;border-radius:14px;padding:12px 14px;font-size:14px;font-weight:800}
        .statsGrid{margin-top:16px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .statCard{border:1px solid ${BORDER};border-radius:18px;background:${CARD};padding:16px}
        .statLabel{font-size:14px;color:#374151;font-weight:700}
        .statValue{margin-top:8px;font-size:34px;line-height:1;font-weight:900;letter-spacing:-.04em}
        .statSub{margin-top:6px;font-size:13px;color:${MUTED};font-weight:700}
        .salesCard,.card{margin-top:14px;border:1px solid ${BORDER};border-radius:20px;background:${CARD};padding:16px}
        .cardHeader{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .cardHeader h2,.cardHeader h3{margin:0;font-size:22px;line-height:1;font-weight:900;letter-spacing:-.03em}
        .salesMeta{display:flex;align-items:center;gap:10px}
        .salesMetaLabel{font-size:13px;color:${MUTED};font-weight:800}
        .chartWrap{margin-top:12px;display:grid;grid-template-columns:56px 1fr;gap:10px;align-items:stretch}
        .yAxis{display:flex;flex-direction:column;justify-content:space-between;padding:6px 0 18px;color:#8b93a3;font-size:12px}
        .chart{position:relative}
        .chartSvg{width:100%;height:220px;display:block}
        .xAxis{display:grid;grid-template-columns:repeat(7,1fr);margin-top:4px;color:#6b7280;font-size:14px;text-align:center}
        .middleGrid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.95fr);gap:14px}
        .filterRow{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
        .miniFilter{height:32px;padding:0 16px;border:1px solid ${BORDER};border-radius:10px;background:#fff;color:#6b7280;font-size:14px;font-weight:700;cursor:pointer}
        .miniFilter.active{background:#e8f3f2;color:${TEXT}}
        .viewLink{border:none;background:transparent;color:#6b7280;font-size:14px;font-weight:700;cursor:pointer}
        .viewLink.small{font-size:13px}
        .ordersList{display:grid;gap:12px;margin-top:14px}
        .orderCard,.billingOrder,.phoneOrder{border:1px solid ${BORDER};border-radius:16px;background:#fff;padding:14px}
        .orderTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
        .orderIdentity{display:flex;align-items:flex-start;gap:12px}
        .avatarCircle{width:44px;height:44px;border-radius:999px;background:#eef2ff;color:${NAVY};display:grid;place-items:center;font-size:14px;font-weight:900;flex-shrink:0}
        .orderCode{font-size:17px;font-weight:900;letter-spacing:-.02em}
        .orderMetaLine{margin-top:4px;font-size:13px;color:#6b7280;font-weight:700}
        .orderItems{margin-top:10px;font-size:14px;color:#4b5563;line-height:1.45}
        .orderMoney{font-size:18px;font-weight:900}
        .orderBottom{margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .orderTime{font-size:13px;color:#6b7280;font-weight:700}
        .orderActionRow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .actionBtn{height:34px;padding:0 14px;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer}
        .primaryActionBtn{background:${NAVY};color:#fff}
        .cancelBtn{background:#fff0f1;color:#a12639;border:1px solid #f2c8cd}
        .pill{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 14px;border-radius:999px;font-size:14px;font-weight:800}
        .pill.neutral{background:#eef0f4;color:#4b5563}
        .pill.green{background:#e7f7ec;color:${GREEN}}
        .pill.yellow{background:#fbf1d7;color:#8d6b12}
        .pill.red{background:#fde4e6;color:#b53d46}
        .pill.blue{background:#e8eefc;color:#3452b6}
        .stripeStatusCard{margin-top:14px;border:1px solid ${BORDER};border-radius:16px;padding:14px}
        .stripeTitle{font-size:15px;font-weight:900}
        .stripeRow{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
        .billingList{display:grid;gap:12px;margin-top:14px}
        .bottomGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .statusList{display:grid;gap:12px;margin-top:12px}
        .statusList.compact{margin-top:14px}
        .statusRow{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;font-size:14px}
        .statusRow span{color:#6b7280;font-weight:700}
        .statusRow strong{color:${TEXT};text-align:right}
        .quickGrid{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .quickBtn{height:46px;border:1px solid ${BORDER};border-radius:12px;background:#fff;color:${TEXT};font-size:14px;font-weight:800;cursor:pointer}
        .storefrontCard{margin-top:12px;border:1px solid ${BORDER};border-radius:16px;padding:14px;background:#fff}
        .storefrontLabel{font-size:13px;color:${MUTED};font-weight:800;text-transform:uppercase;letter-spacing:.05em}
        .storefrontLink{margin-top:8px;font-size:14px;font-weight:800;word-break:break-word}
        .storefrontActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
        .smallActionBtn{height:38px;padding:0 14px;border:1px solid ${BORDER};border-radius:10px;background:#fff;color:${TEXT};font-size:13px;font-weight:800;cursor:pointer}
        .smallActionBtn.dark{background:${NAVY};border-color:${NAVY};color:#fff}
        .emptyBox{border:1px dashed ${BORDER};border-radius:14px;padding:18px;text-align:center;color:#6b7280;font-size:14px;font-weight:700}
        .mobilePreview{padding:18px;border-left:1px solid ${BORDER};background:rgba(255,255,255,.72)}
        .phoneShell{width:100%;max-width:248px;margin:140px auto 0;background:#fff;border:1px solid ${BORDER};border-radius:34px;padding:16px;box-shadow:0 14px 34px rgba(17,24,39,.12)}
        .phoneTop{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .phoneBrand{display:flex;align-items:center;gap:8px;font-weight:900;font-size:16px}
        .phoneBrandIcon{width:34px;height:34px;border-radius:12px;background:${NAVY};display:grid;place-items:center;color:#fff;font-weight:900}
        .phoneSectionTitle{margin-top:18px;font-size:18px;font-weight:900}
        .phoneCard,.phoneSmallCard{margin-top:12px;border:1px solid ${BORDER};border-radius:16px;padding:14px;background:#fff}
        .phoneStatsRow{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .phoneMiniLabel{font-size:13px;color:#6b7280;font-weight:700}
        .phoneBigValue{margin-top:6px;font-size:22px;font-weight:900;letter-spacing:-.03em}
        .phoneMiniSub{margin-top:6px;font-size:12px;color:#94a3b8;font-weight:700}
        .phoneRevenueRow{margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .phoneHeader h3{font-size:16px}
        .phoneEmpty{margin-top:12px}
        @media (max-width:1180px){.shell{grid-template-columns:220px 1fr}.mobilePreview{display:none}}
        @media (max-width:920px){.shell{width:min(100vw - 20px,1280px);margin:10px auto;grid-template-columns:1fr}.sidebar{border-right:none;border-bottom:1px solid ${BORDER}}.statsGrid,.middleGrid,.bottomGrid{grid-template-columns:1fr}.topbar,.hero{flex-direction:column;align-items:flex-start}.topActions,.heroSearchWrap{width:100%}.searchShell,.heroSearch{width:100%}.searchShell input,.heroSearch input{width:100%}.heroImageCard{display:none}.quickGrid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}