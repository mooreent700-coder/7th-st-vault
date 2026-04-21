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

type OrderFilterKey = 'ALL' | 'NEW' | 'IN_PROGRESS' | 'READY' | 'DONE';
type OwnerAction = 'accept' | 'ready' | 'complete' | 'cancel';

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getOrderAmount(order: OrderRow) {
  return Number(order.total ?? order.amount_total ?? 0);
}

function getStoreName(store: StoreRecord | null) {
  return store?.name?.trim() || 'MenuFlow Store';
}

function getStoreSlug(store: StoreRecord | null) {
  const raw = store?.slug?.trim() || getStoreName(store);
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getStoreUrl(store: StoreRecord | null) {
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || 'https://menuflow-app-mu.vercel.app');
  return `${base}/store/${getStoreSlug(store)}`;
}

function formatDateShort(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatClock(value: Date) {
  return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function formatDayDate(value: Date) {
  return value.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function minutesAgo(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day ago`;
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

function statusMatchesFilter(status: string | null | undefined, filter: OrderFilterKey) {
  const key = getStatusKey(status);
  if (filter === 'ALL') return true;
  if (filter === 'NEW') return key === 'new';
  if (filter === 'IN_PROGRESS') return key === 'in_progress';
  if (filter === 'READY') return key === 'ready';
  if (filter === 'DONE') return key === 'completed';
  return true;
}

function getStatusBadgeClass(status?: string | null) {
  const key = getStatusKey(status);
  if (key === 'completed') return 'statusBadge completed';
  if (key === 'ready') return 'statusBadge ready';
  if (key === 'in_progress') return 'statusBadge progress';
  if (key === 'cancelled') return 'statusBadge cancelled';
  return 'statusBadge new';
}

function getOrderRowClass(status?: string | null) {
  const key = getStatusKey(status);
  if (key === 'completed') return 'orderRow completed';
  if (key === 'ready') return 'orderRow ready';
  if (key === 'in_progress') return 'orderRow progress';
  if (key === 'cancelled') return 'orderRow cancelled';
  return 'orderRow new';
}

function getInitials(value?: string | null) {
  if (!value) return 'CU';
  return (
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'CU'
  );
}

function getAvatarClass(status?: string | null) {
  const key = getStatusKey(status);
  if (key === 'completed') return 'avatar completed';
  if (key === 'ready') return 'avatar ready';
  if (key === 'in_progress') return 'avatar progress';
  if (key === 'cancelled') return 'avatar cancelled';
  return 'avatar new';
}

function getNextStatusValue(action: OwnerAction) {
  if (action === 'accept') return 'in_progress';
  if (action === 'ready') return 'ready';
  if (action === 'complete') return 'completed';
  return 'cancelled';
}

function getPrimaryAction(status?: string | null): { label: string; action: OwnerAction } | null {
  const key = getStatusKey(status);
  if (key === 'new') return { label: 'Accept', action: 'accept' };
  if (key === 'in_progress') return { label: 'Mark Ready', action: 'ready' };
  if (key === 'ready') return { label: 'Complete', action: 'complete' };
  return null;
}

export default function OwnerDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<OrderFilterKey>('ALL');
  const [updatingOrderId, setUpdatingOrderId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
      setError('');
      const nextStatus = getNextStatusValue(action);

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
      );
    } catch (err: any) {
      setError(err?.message || 'Could not update order.');
    } finally {
      setUpdatingOrderId('');
    }
  }

  async function copyStoreLink() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const storeName = useMemo(() => getStoreName(store), [store]);
  const storeUrl = useMemo(() => getStoreUrl(store), [store]);

  const searchedOrders = useMemo(() => {
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
    return list;
  }, [orders, search]);

  const filteredOrders = useMemo(
    () => searchedOrders.filter((order) => statusMatchesFilter(order.status, orderFilter)),
    [searchedOrders, orderFilter]
  );

  const todaysSales = useMemo(
    () => orders.filter((o) => isToday(o.created_at)).reduce((sum, o) => sum + getOrderAmount(o), 0),
    [orders]
  );

  const todaysOrders = useMemo(
    () => orders.filter((o) => isToday(o.created_at)).length,
    [orders]
  );

  const newOrdersCount = useMemo(
    () => orders.filter((o) => getStatusKey(o.status) === 'new').length,
    [orders]
  );

  const completedCount = useMemo(
    () => orders.filter((o) => getStatusKey(o.status) === 'completed').length,
    [orders]
  );

  const completionRate = useMemo(() => {
    if (!orders.length) return 0;
    return Math.round((completedCount / orders.length) * 100);
  }, [completedCount, orders.length]);

  const revenueTotal = useMemo(
    () => orders.reduce((sum, o) => sum + getOrderAmount(o), 0),
    [orders]
  );

  const weeklySales = useMemo(
    () => orders.filter((o) => isThisWeek(o.created_at)).reduce((sum, o) => sum + getOrderAmount(o), 0),
    [orders]
  );

  const averageOrderValue = useMemo(() => {
    if (!orders.length) return 0;
    return revenueTotal / orders.length;
  }, [orders.length, revenueTotal]);

  const salesSeries = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const current = new Date();
    const day = current.getDay();
    const mondayOffset = (day + 6) % 7;
    const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - mondayOffset);

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

  const chartMax = useMemo(() => {
    const max = Math.max(...salesSeries.map((item) => item.total), 0);
    return Math.max(600, max + 100);
  }, [salesSeries]);

  const chartPath = useMemo(() => {
    return salesSeries
      .map((point, index) => {
        const x = 40 + index * 120;
        const y = 220 - (point.total / chartMax) * 150;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [salesSeries, chartMax]);

  const areaPath = useMemo(() => {
    if (!salesSeries.length) return '';
    const line = salesSeries
      .map((point, index) => {
        const x = 40 + index * 120;
        const y = 220 - (point.total / chartMax) * 150;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
    return `${line} L 760 220 L 40 220 Z`;
  }, [salesSeries, chartMax]);

  const topItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; qty: number }>();

    for (const order of orders) {
      const raw = order.items_summary || '';
      const parts = raw.split(/[·,]/).map((part) => part.trim()).filter(Boolean);

      for (const part of parts) {
        const qtyMatch = part.match(/^(\d+)x?\s+/i);
        const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
        const name = part.replace(/^(\d+)x?\s+/i, '').trim() || part.trim();
        if (!name) continue;
        const existing = itemMap.get(name);
        itemMap.set(name, { name, qty: (existing?.qty || 0) + qty });
      }
    }

    return Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 4);
  }, [orders]);

  if (loading) {
    return (
      <main className="ownerDashboardLoading">
        <div className="loadingCard">Loading owner dashboard...</div>
        <style jsx global>{`
          body { background: #f8fafc; }
          .ownerDashboardLoading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f8fafc;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .loadingCard {
            padding: 24px 28px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 22px;
            font-size: 20px;
            font-weight: 800;
            color: #111827;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="ownerPage">
      <div className="dashboardShell">
        <aside className="sidebar">
          <div className="brandBlock">
            <div className="brandLogo">M</div>
            <div>
              <div className="brandName">MenuFlow</div>
              <div className="brandSub">OWNER PANEL</div>
            </div>
          </div>

          <div className="navList">
            <button type="button" className="navBtn active">
              <span className="navIcon">▣</span>
              <span>Dashboard</span>
            </button>
            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <span className="navIcon">✎</span>
              <span>Menu Builder</span>
            </button>
            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/flyers')}>
              <span className="navIcon">⚑</span>
              <span>Flyers</span>
            </button>
            <button type="button" className="navBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
              <span className="navIcon">↗</span>
              <span>Open Storefront</span>
            </button>
          </div>

          <div className="sidebarStoreCard">
            <div className="storeMiniTop">
              <div className="storeMiniImage" />
              <div className="storeMiniInfo">
                <div className="storeMiniName">{storeName}</div>
                <div className="storeMiniLive">Live</div>
              </div>
            </div>

            <div className="sidebarStats">
              <div className="sidebarStatRow"><span>Total Orders</span><strong>{orders.length}</strong></div>
              <div className="sidebarStatRow"><span>Menu Items</span><strong>{menuItems.length}</strong></div>
              <div className="sidebarStatRow"><span>Plan</span><strong>{store?.plan || 'Starter'}</strong></div>
            </div>
          </div>
        </aside>

        <section className="mainArea">
          <header className="topBar">
            <div className="topWelcome">
              <div className="topWelcomeLine">Welcome back, {getStoreSlug(store)} 👋</div>
              <h1>Your Store is Live <span className="liveDot" /></h1>
              <div className="topSub">All systems operational and accepting orders</div>
            </div>

            <div className="topBarRight">
              <div className="timeCard">
                <div className="timeLabel">Local Dashboard Time</div>
                <div className="timeValue">{formatClock(now)}</div>
                <div className="dateValue">{formatDayDate(now)}</div>
              </div>

              <div className="searchWrap">
                <span className="searchIcon">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders, customers, items..."
                />
              </div>

              <button type="button" className="outlineBtn" onClick={() => router.push('/dashboard/owner/builder')}>
                Open Builder
              </button>

              <button type="button" className="blackBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                View Store
                <span>→</span>
              </button>
            </div>
          </header>

          {error ? <div className="errorBanner">{error}</div> : null}

          <div className="kpiGrid">
            <div className="kpiCard">
              <div className="kpiIcon green">$</div>
              <div className="kpiContent">
                <div className="kpiLabel">Today's Sales</div>
                <div className="kpiValue">{formatMoney(todaysSales)}</div>
                <div className="kpiSub good">{todaysOrders ? `From ${todaysOrders} order${todaysOrders === 1 ? '' : 's'}` : 'No orders today yet'}</div>
              </div>
            </div>

            <div className="kpiCard">
              <div className="kpiIcon blue">◫</div>
              <div className="kpiContent">
                <div className="kpiLabel">Today's Orders</div>
                <div className="kpiValue">{todaysOrders}</div>
                <div className="kpiSub good">{weeklySales ? `${formatMoney(weeklySales)} this week` : 'No weekly sales yet'}</div>
              </div>
            </div>

            <div className="kpiCard">
              <div className="kpiIcon orange">☰</div>
              <div className="kpiContent">
                <div className="kpiLabel">New Orders</div>
                <div className="kpiValue">{newOrdersCount}</div>
                <div className="kpiSub danger">{newOrdersCount ? 'Needs action' : 'No new orders right now'}</div>
              </div>
            </div>

            <div className="kpiCard">
              <div className="kpiIcon purple">◔</div>
              <div className="kpiContent">
                <div className="kpiLabel">Completion Rate</div>
                <div className="kpiValue">{completionRate}%</div>
                <div className="kpiSub good">{orders.length ? `${completedCount} completed` : 'No order history yet'}</div>
              </div>
            </div>
          </div>

          <div className="contentGrid">
            <div className="leftColumn">
              <section className="card liveOrdersCard">
                <div className="cardHeader">
                  <div className="cardTitleBlock">
                    <h2>Live Orders</h2>
                    {newOrdersCount > 0 ? <span className="newBubble">{newOrdersCount} New</span> : null}
                  </div>
                </div>

                <div className="filterRow">
                  {(['ALL','NEW','IN_PROGRESS','READY','DONE'] as OrderFilterKey[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`filterBtn ${orderFilter === filter ? 'active' : ''}`}
                      onClick={() => setOrderFilter(filter)}
                    >
                      {filter === 'IN_PROGRESS' ? 'In Progress' : filter === 'DONE' ? 'Completed' : filter === 'READY' ? 'Almost Ready' : filter}
                    </button>
                  ))}
                </div>

                <div className="ordersList">
                  {filteredOrders.length ? filteredOrders.slice(0, 6).map((order) => {
                    const primaryAction = getPrimaryAction(order.status);

                    return (
                      <div key={order.id} className={getOrderRowClass(order.status)}>
                        <div className="orderCol orderMetaCol">
                          <div className="orderNumber">#{order.id.slice(0, 5).toUpperCase()}</div>
                          <div className="orderAgo">{minutesAgo(order.created_at)}</div>
                        </div>

                        <div className={getAvatarClass(order.status)}>{getInitials(order.customer_name)}</div>

                        <div className="orderCol customerCol">
                          <div className="customerName">{order.customer_name || 'Customer'}</div>
                          <div className="customerPhone">{formatDateShort(order.created_at)}</div>
                        </div>

                        <div className="orderCol itemsCol">
                          <div className="itemsSummary">{order.items_summary || 'No order summary yet'}</div>
                        </div>

                        <div className="orderCol amountCol">
                          <div className="amountValue">{formatMoney(getOrderAmount(order))}</div>
                        </div>

                        <div className="orderCol statusCol">
                          <span className={getStatusBadgeClass(order.status)}>{getStatusLabel(order.status)}</span>
                        </div>

                        <div className="orderCol actionsCol">
                          {primaryAction ? (
                            <button
                              type="button"
                              className="blackBtn smallBlackBtn"
                              disabled={updatingOrderId === order.id}
                              onClick={() => updateOrderStatus(order.id, primaryAction.action)}
                            >
                              {updatingOrderId === order.id ? 'Updating...' : primaryAction.label}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  }) : <div className="emptyState">No orders yet.</div>}
                </div>
              </section>

              <section className="bottomAnalyticsRow">
                <div className="card salesCard">
                  <div className="salesHeader">
                    <div>
                      <h3>Sales Overview</h3>
                      <div className="salesBigValue">{formatMoney(revenueTotal)}</div>
                      <div className="salesTrend">{weeklySales ? `${formatMoney(weeklySales)} this week` : 'No weekly sales data yet'}</div>
                    </div>
                  </div>

                  <div className="chartWrap">
                    <div className="chartYAxis">
                      <span>$600</span>
                      <span>$400</span>
                      <span>$200</span>
                      <span>$0</span>
                    </div>

                    <div className="chartCanvas">
                      <svg viewBox="0 0 800 260" preserveAspectRatio="none" className="chartSvg">
                        <defs>
                          <linearGradient id="salesGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(34,197,94,0.26)" />
                            <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
                          </linearGradient>
                        </defs>

                        {[40, 90, 140, 190].map((y) => (
                          <line key={y} x1="40" y1={y} x2="760" y2={y} stroke="#edf2f7" strokeWidth="1" />
                        ))}

                        <path d={areaPath} fill="url(#salesGradient)" />
                        <path d={chartPath} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                        {salesSeries.map((point, index) => {
                          const x = 40 + index * 120;
                          const y = 220 - (point.total / chartMax) * 150;
                          return <circle key={point.label} cx={x} cy={y} r="5" fill="#16a34a" />;
                        })}
                      </svg>

                      <div className="chartXAxis">
                        {salesSeries.map((point) => <span key={point.label}>{point.label}</span>)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card topItemsCard">
                  <div className="miniCardHeader">
                    <h3>Top Items</h3>
                  </div>

                  <div className="topItemsList">
                    {topItems.length ? topItems.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="topItemRow">
                        <div className="topItemLeft">
                          <div className="rankDot">{index + 1}</div>
                          <span>{item.name}</span>
                        </div>
                        <div className="topItemRight">
                          <span>{item.qty} sold</span>
                          <strong>{averageOrderValue ? formatMoney(item.qty * averageOrderValue) : '--'}</strong>
                        </div>
                      </div>
                    )) : <div className="emptyState">No top-item data yet.</div>}
                  </div>
                </div>
              </section>
            </div>

            <div className="rightColumn">
              <section className="card statusCard">
                <h3>Store Status</h3>
                <div className="storeLiveLine">
                  <span className="smallGreenDot" />
                  <span>Your store is live and online</span>
                </div>

                <div className="miniStatusPanel">
                  <div className="miniStatusRows">
                    <div className="miniStatusRow"><span>Plan</span><strong>{store?.plan || 'Starter'}</strong></div>
                    <div className="miniStatusRow"><span>Phone</span><strong>{store?.phone || 'Not added yet'}</strong></div>
                    <div className="miniStatusRow"><span>Address</span><strong>{store?.address || 'Not added yet'}</strong></div>
                  </div>
                </div>
              </section>

              <section className="card storefrontCard">
                <h3>Your Storefront Link</h3>
                <div className="storefrontSub">Share your store with customers</div>
                <div className="storefrontLinkBox">
                  <span>{storeUrl}</span>
                  <button type="button" className="copyIconBtn" onClick={copyStoreLink}>
                    {copied ? '✓' : '⧉'}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        :root { color-scheme: light; }
        body { margin: 0; background: #f8fafc; }
        .ownerPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(218,231,255,0.35), transparent 28%),
            linear-gradient(180deg, #fafcff 0%, #f7f9fc 100%);
          color: #111827;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .dashboardShell { width: min(1500px, calc(100vw - 28px)); margin: 14px auto; display: grid; grid-template-columns: 238px minmax(0, 1fr); gap: 18px; }
        .sidebar, .card, .kpiCard, .sidebarStoreCard {
          border: 1px solid #e6ebf2; background: rgba(255,255,255,0.96); box-shadow: 0 14px 34px rgba(15,23,42,0.04);
        }
        .sidebar { border-radius: 24px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .brandBlock { display:flex; align-items:center; gap:12px; padding:8px 2px 6px; }
        .brandLogo { width:44px; height:44px; border-radius:14px; background:#111827; color:#fff; display:grid; place-items:center; font-size:22px; font-weight:900; }
        .brandName { font-size:18px; font-weight:900; }
        .brandSub { font-size:12px; color:#64748b; font-weight:800; letter-spacing:.08em; }
        .navList { display:grid; gap:6px; }
        .navBtn { height:48px; border:none; border-radius:14px; background:transparent; display:flex; align-items:center; gap:12px; padding:0 14px; font-size:15px; font-weight:800; cursor:pointer; text-align:left; }
        .navBtn.active { background:#edf3ff; color:#173b8f; }
        .navIcon { width:20px; text-align:center; color:#64748b; }
        .sidebarStoreCard { border-radius:18px; padding:14px; }
        .storeMiniTop { display:flex; align-items:center; gap:12px; }
        .storeMiniImage { width:56px; height:56px; border-radius:14px; background:#e5e7eb; }
        .storeMiniName { font-size:16px; font-weight:900; }
        .storeMiniLive { font-size:12px; font-weight:900; color:#16a34a; margin-top:4px; }
        .sidebarStats { display:grid; gap:8px; margin-top:14px; }
        .sidebarStatRow { display:flex; justify-content:space-between; gap:10px; font-size:14px; color:#64748b; }
        .sidebarStatRow strong { color:#111827; font-weight:900; }
        .mainArea { display:grid; gap:18px; }
        .topBar { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; padding:8px 6px 0; }
        .topWelcomeLine { font-size:16px; color:#64748b; font-weight:800; }
        .topBar h1 { margin:10px 0 6px; font-size:34px; font-weight:900; display:flex; align-items:center; gap:10px; }
        .liveDot { width:12px; height:12px; border-radius:999px; background:#22c55e; display:inline-block; box-shadow:0 0 0 5px rgba(34,197,94,0.12); }
        .topSub { font-size:15px; color:#64748b; font-weight:700; }
        .topBarRight { display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:flex-end; }
        .timeCard { min-width:240px; height:84px; padding:12px 16px; border-radius:18px; background:#fff; border:1px solid #dbe2ea; display:flex; flex-direction:column; justify-content:center; box-shadow:0 10px 24px rgba(15,23,42,0.04); }
        .timeLabel { font-size:11px; font-weight:900; color:#64748b; letter-spacing:.08em; text-transform:uppercase; }
        .timeValue { margin-top:6px; font-size:24px; font-weight:900; color:#111827; line-height:1; }
        .dateValue { margin-top:6px; font-size:13px; font-weight:700; color:#64748b; }
        .searchWrap { width:330px; height:48px; border:1px solid #dbe2ea; border-radius:14px; background:#fff; display:flex; align-items:center; gap:10px; padding:0 14px; color:#64748b; }
        .searchWrap input { border:none; outline:none; background:transparent; width:100%; font-size:14px; color:#111827; }
        .blackBtn, .outlineBtn, .copyIconBtn, .filterBtn {
          appearance:none; border:none; outline:none; cursor:pointer; font-family:inherit;
        }
        .blackBtn { height:48px; padding:0 18px; border-radius:14px; background:#111827; color:#fff; font-size:15px; font-weight:900; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
        .outlineBtn { height:48px; padding:0 18px; border-radius:14px; background:#fff; border:1px solid #dbe2ea; color:#111827; font-size:15px; font-weight:900; display:inline-flex; align-items:center; justify-content:center; }
        .errorBanner { padding:14px 16px; border-radius:16px; background:#fff0f1; border:1px solid #f5c9ce; color:#a12639; font-size:14px; font-weight:800; }
        .kpiGrid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:18px; }
        .kpiCard { border-radius:20px; padding:18px; display:grid; grid-template-columns:54px 1fr; gap:14px; align-items:center; }
        .kpiIcon { width:54px; height:54px; border-radius:16px; display:grid; place-items:center; font-size:26px; font-weight:900; }
        .kpiIcon.green { background:#dcfce7; color:#16a34a; }
        .kpiIcon.blue { background:#dbeafe; color:#2563eb; }
        .kpiIcon.orange { background:#ffedd5; color:#f97316; }
        .kpiIcon.purple { background:#ede9fe; color:#7c3aed; }
        .kpiLabel { font-size:14px; color:#64748b; font-weight:800; }
        .kpiValue { margin-top:6px; font-size:24px; font-weight:900; }
        .kpiSub { margin-top:8px; font-size:13px; font-weight:800; }
        .kpiSub.good { color:#16a34a; }
        .kpiSub.danger { color:#ef4444; }
        .contentGrid { display:grid; grid-template-columns:minmax(0,1.45fr) minmax(300px,360px); gap:18px; align-items:start; }
        .leftColumn, .rightColumn { display:grid; gap:18px; }
        .card { border-radius:22px; padding:18px; }
        .cardHeader, .salesHeader, .miniCardHeader { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .cardTitleBlock { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .card h2, .card h3 { margin:0; font-size:18px; font-weight:900; }
        .newBubble { min-width:64px; height:28px; padding:0 12px; border-radius:999px; background:#fff1f2; color:#ef4444; display:inline-flex; align-items:center; justify-content:center; font-size:13px; font-weight:900; }
        .filterRow { display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; }
        .filterBtn { min-width:78px; height:36px; padding:0 14px; border-radius:999px; background:#f7fafc; border:1px solid #e6ebf2; color:#111827; font-size:14px; font-weight:900; }
        .filterBtn.active { background:#eff6ff; border-color:#dbeafe; color:#173b8f; }
        .ordersList { display:grid; gap:12px; margin-top:18px; }
        .orderRow { min-height:82px; border:1px solid #e8edf4; border-radius:18px; background:#fff; display:grid; grid-template-columns:100px 54px 1.1fr 1.2fr 120px 120px 140px; gap:12px; align-items:center; padding:12px 14px; position:relative; overflow:hidden; }
        .orderRow::before { content:''; position:absolute; left:0; top:12px; bottom:12px; width:4px; border-radius:999px; }
        .orderRow.new::before { background:#ef4444; }
        .orderRow.progress::before { background:#2563eb; }
        .orderRow.ready::before { background:#f59e0b; }
        .orderRow.completed::before { background:#16a34a; }
        .orderRow.cancelled::before { background:#94a3b8; }
        .orderNumber { font-size:14px; font-weight:900; }
        .orderAgo { margin-top:8px; font-size:13px; color:#64748b; font-weight:700; }
        .avatar { width:42px; height:42px; border-radius:999px; display:grid; place-items:center; font-size:18px; font-weight:900; }
        .avatar.new { background:#ffe4e6; color:#ef4444; }
        .avatar.progress { background:#dbeafe; color:#2563eb; }
        .avatar.ready { background:#ffedd5; color:#f59e0b; }
        .avatar.completed { background:#dcfce7; color:#16a34a; }
        .avatar.cancelled { background:#e2e8f0; color:#64748b; }
        .customerName { font-size:15px; font-weight:900; }
        .customerPhone { margin-top:6px; font-size:14px; color:#64748b; font-weight:700; }
        .itemsSummary { font-size:14px; line-height:1.45; color:#475569; font-weight:700; }
        .amountValue { font-size:15px; font-weight:900; }
        .statusBadge { min-width:92px; height:32px; padding:0 14px; border-radius:999px; display:inline-flex; align-items:center; justify-content:center; font-size:13px; font-weight:900; white-space:nowrap; }
        .statusBadge.new { background:#fff1f2; color:#ef4444; }
        .statusBadge.progress { background:#eff6ff; color:#2563eb; }
        .statusBadge.ready { background:#fff7ed; color:#f59e0b; }
        .statusBadge.completed { background:#ecfdf3; color:#16a34a; }
        .statusBadge.cancelled { background:#f1f5f9; color:#64748b; }
        .smallBlackBtn { height:42px; min-width:92px; padding:0 16px; border-radius:12px; font-size:14px; }
        .bottomAnalyticsRow { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(290px,360px); gap:18px; }
        .salesBigValue { margin-top:8px; font-size:18px; font-weight:900; }
        .salesTrend { margin-top:8px; font-size:13px; color:#16a34a; font-weight:900; }
        .chartWrap { display:grid; grid-template-columns:56px 1fr; gap:8px; margin-top:16px; }
        .chartYAxis { display:flex; flex-direction:column; justify-content:space-between; padding:12px 0 24px; color:#64748b; font-size:13px; font-weight:700; }
        .chartSvg { width:100%; height:240px; display:block; }
        .chartXAxis { display:grid; grid-template-columns:repeat(7, 1fr); margin-top:4px; color:#64748b; font-size:13px; font-weight:800; text-align:center; }
        .topItemsList { display:grid; gap:14px; margin-top:16px; }
        .topItemRow { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .topItemLeft, .topItemRight { display:flex; align-items:center; gap:10px; }
        .rankDot { width:22px; height:22px; border-radius:999px; background:#f1f5f9; color:#64748b; display:grid; place-items:center; font-size:12px; font-weight:900; }
        .topItemLeft span { font-size:14px; font-weight:800; }
        .topItemRight span { font-size:13px; color:#64748b; font-weight:700; }
        .topItemRight strong { font-size:14px; font-weight:900; }
        .storeLiveLine { margin-top:8px; display:flex; align-items:center; gap:10px; color:#64748b; font-size:14px; font-weight:700; }
        .smallGreenDot { width:8px; height:8px; border-radius:999px; background:#22c55e; }
        .miniStatusPanel, .storefrontLinkBox { margin-top:16px; border:1px solid #e6ebf2; border-radius:18px; padding:16px; background:#fff; }
        .miniStatusRows { display:grid; gap:14px; }
        .miniStatusRow { display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:14px; color:#475569; font-weight:700; }
        .storefrontSub { margin-top:8px; font-size:14px; color:#64748b; font-weight:700; }
        .storefrontLinkBox { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:0 12px 0 14px; min-height:48px; }
        .storefrontLinkBox span { font-size:14px; font-weight:800; word-break:break-word; }
        .copyIconBtn { width:36px; height:36px; border-radius:10px; background:#f8fafc; border:1px solid #dbe2ea; color:#475569; font-size:15px; font-weight:900; }
        .emptyState { border:1px dashed #dbe2ea; border-radius:18px; padding:22px; text-align:center; color:#64748b; font-size:15px; font-weight:800; }
        @media (max-width: 1260px) {
          .dashboardShell { grid-template-columns: 1fr; }
          .contentGrid, .bottomAnalyticsRow { grid-template-columns: 1fr; }
        }
        @media (max-width: 980px) {
          .kpiGrid { grid-template-columns: 1fr 1fr; }
          .topBar { flex-direction: column; align-items: stretch; }
          .topBarRight { justify-content: stretch; }
          .searchWrap { width: 100%; }
          .orderRow { grid-template-columns: 1fr; gap: 10px; }
          .chartWrap { grid-template-columns: 1fr; }
          .chartYAxis { display: none; }
        }
        @media (max-width: 640px) {
          .dashboardShell { width: min(100vw - 14px, 1500px); margin: 7px auto; }
          .kpiGrid { grid-template-columns: 1fr; }
          .topBar h1 { font-size: 28px; }
          .timeCard { width: 100%; min-width: 0; }
        }
      `}</style>
    </main>
  );
}
