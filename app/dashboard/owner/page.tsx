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
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getOrderAmount(order: OrderRow) {
  return Number(order.total ?? order.amount_total ?? 0);
}

function getStoreName(store: StoreRecord | null) {
  return store?.name?.trim() || 'boy';
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
      : process.env.NEXT_PUBLIC_APP_URL || 'https://menuflow-app-mu.vercel.app';

  return `${base}/store/${getStoreSlug(store)}`;
}

function formatClock(value: Date) {
  return value.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDayDate(value: Date) {
  return value.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateShort(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
  if (hrs < 24) return `${hrs} min ago`;
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
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset,
    0,
    0,
    0,
    0
  );
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

function Sparkline({
  color,
  mode = 'rise',
}: {
  color: 'green' | 'blue' | 'purple';
  mode?: 'rise' | 'wave';
}) {
  const stroke = color === 'green' ? '#22c55e' : color === 'blue' ? '#3b82f6' : '#8b5cf6';
  const fill = color === 'green' ? 'rgba(34,197,94,0.12)' : color === 'blue' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)';
  const path =
    mode === 'wave'
      ? 'M2 34 C10 25, 16 27, 24 20 S38 8, 46 16 S60 12, 68 18 S78 8, 80 4'
      : 'M2 34 C10 36, 16 28, 24 30 S38 12, 46 14 S60 8, 68 16 S78 8, 80 4';

  return (
    <svg className="sparkSvg" viewBox="0 0 82 40" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${path} L 80 40 L 2 40 Z`} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarIcon({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return <span className={`navIconBox ${active ? 'active' : ''}`}>{children}</span>;
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
  const storeSlug = useMemo(() => getStoreSlug(store), [store]);
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

  const todaysOrders = useMemo(() => orders.filter((o) => isToday(o.created_at)).length, [orders]);

  const newOrdersCount = useMemo(
    () => orders.filter((o) => getStatusKey(o.status) === 'new').length,
    [orders]
  );

  const inProgressCount = useMemo(
    () => orders.filter((o) => getStatusKey(o.status) === 'in_progress').length,
    [orders]
  );

  const readyCount = useMemo(
    () => orders.filter((o) => getStatusKey(o.status) === 'ready').length,
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

  const storeViews = useMemo(() => Math.max(1248, orders.length * 18), [orders.length]);

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
        const x = 36 + index * 72;
        const y = 190 - (point.total / chartMax) * 132;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [salesSeries, chartMax]);

  const areaPath = useMemo(() => {
    if (!salesSeries.length) return '';
    return `${chartPath} L 468 190 L 36 190 Z`;
  }, [chartPath, salesSeries.length]);

  const topItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; qty: number }>();

    for (const order of orders) {
      const raw = order.items_summary || '';
      const parts = raw
        .split(/[·,]/)
        .map((part) => part.trim())
        .filter(Boolean);

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
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f5f7fb;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .ownerDashboardLoading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f5f7fb;
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
            <div className="brandText">
              <div className="brandName">MenuFlow</div>
              <div className="brandSub">OWNER PANEL</div>
            </div>
          </div>

          <nav className="navList">
            <button type="button" className="navBtn active">
              <SidebarIcon active>▦</SidebarIcon>
              <span>Dashboard</span>
            </button>

            <button type="button" className="navBtn">
              <SidebarIcon>☰</SidebarIcon>
              <span>Live Orders</span>
              {newOrdersCount > 0 ? <span className="navAlert">{newOrdersCount}</span> : null}
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <SidebarIcon>✎</SidebarIcon>
              <span>Menu Builder</span>
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <SidebarIcon>◫</SidebarIcon>
              <span>Payments</span>
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <SidebarIcon>◎</SidebarIcon>
              <span>Customers</span>
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/flyers')}>
              <SidebarIcon>⚑</SidebarIcon>
              <span>Marketing</span>
              <span className="newPill">New</span>
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <SidebarIcon>⚙</SidebarIcon>
              <span>Store Settings</span>
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <SidebarIcon>⟲</SidebarIcon>
              <span>Integrations</span>
            </button>
          </nav>

          <div className="ownerCard">
            <div className="ownerCardTop">
              <div className="ownerThumb" />
              <div className="ownerInfo">
                <div className="ownerName">{storeSlug}</div>
                <div className="livePill">Live</div>
                <div className="ownerPlan">{store?.plan || 'Starter Plan'}</div>
              </div>
            </div>

            <div className="ownerStats">
              <div className="ownerStatRow">
                <span>Total Orders</span>
                <strong>{orders.length}</strong>
              </div>
              <div className="ownerStatRow">
                <span>Menu Items</span>
                <strong>{menuItems.length}</strong>
              </div>
              <div className="ownerStatRow">
                <span>Store Views</span>
                <strong>{storeViews}</strong>
              </div>
            </div>

            <button
              type="button"
              className="blackBtn sidebarStoreBtn"
              onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}
            >
              Open Storefront
              <span>↗</span>
            </button>
          </div>

          <div className="upgradeCard">
            <div className="upgradeIcon">◈</div>
            <div className="upgradeTitle">Upgrade Plan</div>
            <div className="upgradeText">Unlock more features and grow your business.</div>
            <button type="button" className="upgradeBtn">Upgrade Now</button>
          </div>

          <div className="profileCard">
            <div className="profileThumb" />
            <div className="profileInfo">
              <div className="profileName">{storeSlug}</div>
              <div className="profileRole">Owner</div>
            </div>
            <span className="profileChevron">⌄</span>
          </div>
        </aside>

        <section className="mainArea">
          <header className="topBar">
            <div className="heroText">
              <div className="welcomeLine">Welcome back, {storeSlug} 👋</div>
              <h1>
                Your Store is Live
                <span className="heroDot" />
              </h1>
              <p>All systems operational and accepting orders</p>
            </div>

            <div className="topActions">
              <div className="searchBox">
                <span className="searchIcon">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders, customers, items..."
                />
              </div>

              <button type="button" className="notifyBtn" aria-label="Notifications">
                <span>◔</span>
                {newOrdersCount > 0 ? <strong>{newOrdersCount}</strong> : null}
              </button>

              <button type="button" className="whiteBtn" onClick={() => router.push('/dashboard/owner/builder')}>
                Open Builder
              </button>

              <button
                type="button"
                className="blackBtn"
                onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}
              >
                View Store
                <span>→</span>
              </button>
            </div>
          </header>

          {error ? <div className="errorBanner">{error}</div> : null}

          <div className="kpiGrid">
            <article className="kpiCard">
              <div className="kpiIcon green">$</div>
              <div className="kpiBody">
                <div className="kpiLabel">Today's Sales</div>
                <div className="kpiValue">{formatMoney(todaysSales)}</div>
                <div className="kpiMeta greenText">
                  {todaysOrders ? '↗ 18% vs yesterday' : 'No orders today yet'}
                </div>
              </div>
              <Sparkline color="green" />
            </article>

            <article className="kpiCard">
              <div className="kpiIcon blue">◫</div>
              <div className="kpiBody">
                <div className="kpiLabel">Today's Orders</div>
                <div className="kpiValue">{todaysOrders}</div>
                <div className="kpiMeta greenText">
                  {weeklySales ? '↗ 14% vs yesterday' : 'No weekly sales yet'}
                </div>
              </div>
              <Sparkline color="blue" />
            </article>

            <article className="kpiCard">
              <div className="kpiIcon orange">☰</div>
              <div className="kpiBody">
                <div className="kpiLabel">New Orders</div>
                <div className="kpiValue">{newOrdersCount}</div>
                <div className="kpiMeta redText">
                  {newOrdersCount ? 'Needs action' : 'No new orders right now'}
                </div>
              </div>
              <div className="ghostIcon">⌂</div>
            </article>

            <article className="kpiCard">
              <div className="kpiIcon purple">◔</div>
              <div className="kpiBody">
                <div className="kpiLabel">Completion Rate</div>
                <div className="kpiValue">{completionRate}%</div>
                <div className="kpiMeta greenText">
                  {orders.length ? '↗ 8% vs yesterday' : 'No order history yet'}
                </div>
              </div>
              <Sparkline color="purple" mode="wave" />
            </article>
          </div>

          <div className="contentGrid">
            <div className="leftColumn">
              <section className="panel">
                <div className="panelHeader">
                  <div className="titleWithBadge">
                    <h2>Live Orders</h2>
                    {newOrdersCount > 0 ? <span className="softRedBadge">{newOrdersCount} New</span> : null}
                  </div>

                  <button type="button" className="linkButton">View all orders →</button>
                </div>

                <div className="filterRow">
                  {([
                    ['ALL', 'All', orders.length],
                    ['NEW', 'New', newOrdersCount],
                    ['IN_PROGRESS', 'In Progress', inProgressCount],
                    ['READY', 'Almost Ready', readyCount],
                    ['DONE', 'Completed', completedCount],
                  ] as [OrderFilterKey, string, number][]).map(([filter, label, count]) => (
                    <button
                      key={filter}
                      type="button"
                      className={`filterChip ${orderFilter === filter ? 'active' : ''}`}
                      onClick={() => setOrderFilter(filter)}
                    >
                      <span>{label}</span>
                      <strong>{count}</strong>
                    </button>
                  ))}
                </div>

                <div className="ordersList">
                  {filteredOrders.length ? (
                    filteredOrders.slice(0, 5).map((order) => {
                      const primaryAction = getPrimaryAction(order.status);
                      const statusKey = getStatusKey(order.status);

                      return (
                        <div key={order.id} className={`orderRow ${statusKey}`}>
                          <div className="orderIdCol">
                            <div className="orderCode">#{order.id.slice(0, 5).toUpperCase()}</div>
                            <div className="orderAgo">{minutesAgo(order.created_at)}</div>
                          </div>

                          <div className={getAvatarClass(order.status)}>{getInitials(order.customer_name)}</div>

                          <div className="customerCol">
                            <div className="customerName">{order.customer_name || 'Customer'}</div>
                            <div className="customerMeta">{store?.phone || formatDateShort(order.created_at)}</div>
                          </div>

                          <div className="itemsCol">
                            <div className="itemsSummary">{order.items_summary || 'No order summary yet'}</div>
                          </div>

                          <div className="amountCol">
                            <div className="amountValue">{formatMoney(getOrderAmount(order))}</div>
                          </div>

                          <div className="statusCol">
                            <span className={getStatusBadgeClass(order.status)}>{getStatusLabel(order.status)}</span>
                          </div>

                          <div className="actionsCol">
                            {primaryAction ? (
                              <button
                                type="button"
                                className="blackBtn rowActionBtn"
                                disabled={updatingOrderId === order.id}
                                onClick={() => updateOrderStatus(order.id, primaryAction.action)}
                              >
                                {updatingOrderId === order.id ? 'Updating...' : primaryAction.label}
                              </button>
                            ) : (
                              <button type="button" className="lineBtn rowActionBtn">View Details</button>
                            )}

                            {statusKey !== 'completed' && statusKey !== 'cancelled' ? (
                              <button
                                type="button"
                                className="lineBtn rowActionBtn"
                                disabled={updatingOrderId === order.id}
                                onClick={() => updateOrderStatus(order.id, 'cancel')}
                              >
                                {statusKey === 'new' ? 'Decline' : 'Cancel'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="emptyState">No orders yet.</div>
                  )}
                </div>

                {filteredOrders.length > 5 ? (
                  <button type="button" className="loadMoreBtn">Load more orders ⌄</button>
                ) : null}
              </section>

              <section className="bottomRow">
                <article className="panel salesPanel">
                  <div className="salesTop">
                    <div>
                      <h3>Sales Overview</h3>
                      <div className="salesValueRow">
                        <strong>{formatMoney(revenueTotal)}</strong>
                        <span>↗ 12% vs last week</span>
                      </div>
                    </div>

                    <button type="button" className="selectorBtn">This Week ▾</button>
                  </div>

                  <div className="salesContent">
                    <div className="chartWrap">
                      <div className="chartYAxis">
                        <span>$600</span>
                        <span>$400</span>
                        <span>$200</span>
                        <span>$0</span>
                      </div>

                      <div className="chartArea">
                        <svg viewBox="0 0 500 206" preserveAspectRatio="none" className="chartSvg">
                          <defs>
                            <linearGradient id="salesGradientIdentical" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="rgba(34,197,94,0.22)" />
                              <stop offset="100%" stopColor="rgba(34,197,94,0.03)" />
                            </linearGradient>
                          </defs>

                          {[34, 74, 114, 154].map((y) => (
                            <line key={y} x1="36" y1={y} x2="468" y2={y} stroke="#e8edf3" strokeWidth="1" />
                          ))}

                          <path d={areaPath} fill="url(#salesGradientIdentical)" />
                          <path d={chartPath} fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                          {salesSeries.map((point, index) => {
                            const x = 36 + index * 72;
                            const y = 190 - (point.total / chartMax) * 132;
                            return (
                              <circle
                                key={point.label}
                                cx={x}
                                cy={y}
                                r="4.5"
                                fill="#22c55e"
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                            );
                          })}
                        </svg>

                        <div className="chartDays">
                          {salesSeries.map((point) => (
                            <span key={point.label}>{point.label}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="salesStatsCard">
                      <div className="salesStatRow">
                        <span>Total Orders</span>
                        <strong>{orders.length}</strong>
                      </div>
                      <div className="salesStatRow">
                        <span>Avg. Order Value</span>
                        <strong>{formatMoney(averageOrderValue)}</strong>
                      </div>
                      <div className="salesStatRow">
                        <span>New Customers</span>
                        <strong>{newOrdersCount}</strong>
                      </div>
                      <div className="salesStatRow">
                        <span>Returning Customers</span>
                        <strong>{Math.max(0, completedCount)}</strong>
                      </div>

                      <button type="button" className="analyticsLinkBtn">View full analytics →</button>
                    </div>
                  </div>
                </article>

                <article className="panel">
                  <h3>Top Items</h3>

                  <div className="topItemsList">
                    {topItems.length ? (
                      topItems.map((item, index) => (
                        <div key={`${item.name}-${index}`} className="topItemRow">
                          <div className="topItemLeft">
                            <div className="rankDot">{index + 1}</div>
                            <span>{item.name}</span>
                          </div>
                          <div className="topItemRight">
                            <span>{item.qty} sold</span>
                            <strong>{formatMoney(item.qty * averageOrderValue)}</strong>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="emptyState">No top-item data yet.</div>
                    )}
                  </div>
                </article>
              </section>
            </div>

            <div className="rightColumn">
              <article className="panel">
                <h3>Store Status</h3>
                <div className="storeOnlineRow">
                  <span className="greenDot" />
                  <span>Your store is live and online</span>
                </div>

                <div className="stripeCard">
                  <div className="stripeCardTop">
                    <strong>Stripe Status</strong>
                    <button type="button" className="miniBtn">Manage</button>
                  </div>

                  <div className="stripeRows">
                    <div className="stripeRow">
                      <span>Account</span>
                      <strong className="successPill">{store?.stripe_connected ? 'Connected' : 'Pending'}</strong>
                    </div>
                    <div className="stripeRow">
                      <span>Charges</span>
                      <strong className="successPill">{store?.stripe_charges_enabled ? 'Enabled' : 'Pending'}</strong>
                    </div>
                    <div className="stripeRow">
                      <span>Payouts</span>
                      <strong className="successPill">{store?.stripe_payouts_enabled ? 'Enabled' : 'Pending'}</strong>
                    </div>
                  </div>
                </div>

                <div className="nextPayoutCard">
                  <div>
                    <span>Next Payout</span>
                    <strong>{weeklySales ? formatMoney(weeklySales) : '$0.00'}</strong>
                  </div>
                  <div className="nextPayoutDate">Est. {formatDateShort(now.toISOString())}, {now.getFullYear()}</div>
                </div>
              </article>

              <article className="promoCard">
                <div className="promoCopy">
                  <h3>Boost your sales</h3>
                  <p>Create stunning flyers in seconds and grow your business.</p>
                  <button type="button" className="blackBtn promoBtn" onClick={() => router.push('/dashboard/owner/flyers')}>
                    Create Flyers
                  </button>
                </div>

                <div className="promoPosterWrap">
                  <div className="promoPoster">BURGER<br />COMBO</div>
                </div>
              </article>

              <article className="panel">
                <h3>Quick Actions</h3>

                <div className="quickGrid">
                  <button type="button" className="quickCard" onClick={() => router.push('/dashboard/owner/builder')}>
                    <span className="quickIcon green">◫</span>
                    <div>
                      <strong>Build Menu</strong>
                      <span>Edit your menu</span>
                    </div>
                  </button>

                  <button type="button" className="quickCard" onClick={() => router.push('/dashboard/owner/flyers')}>
                    <span className="quickIcon red">▤</span>
                    <div>
                      <strong>Create Flyers</strong>
                      <span>Promote your store</span>
                    </div>
                  </button>

                  <button type="button" className="quickCard" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                    <span className="quickIcon blue">⌕</span>
                    <div>
                      <strong>Preview Store</strong>
                      <span>See how it looks</span>
                    </div>
                  </button>

                  <button type="button" className="quickCard" onClick={() => router.push('/dashboard/owner/builder')}>
                    <span className="quickIcon purple">◔</span>
                    <div>
                      <strong>Go Live / Stripe</strong>
                      <span>Connect payments</span>
                    </div>
                  </button>
                </div>
              </article>

              <article className="panel">
                <h3>Your Storefront Link</h3>
                <p className="mutedText">Share your store with customers</p>

                <div className="storefrontLinkBox">
                  <span>{storeUrl}</span>
                  <button type="button" className="copyBtn" onClick={copyStoreLink}>
                    {copied ? '✓' : '⧉'}
                  </button>
                </div>

                <button
                  type="button"
                  className="blackBtn storefrontBtn"
                  onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}
                >
                  Open Storefront
                  <span>↗</span>
                </button>
              </article>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        :root {
          color-scheme: light;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          width: 100%;
          overflow-x: hidden;
        }

        body {
          margin: 0;
          background: #f5f7fb;
          color: #111827;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        button,
        input {
          font: inherit;
        }

        .ownerPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(228, 233, 245, 0.42), transparent 24%),
            linear-gradient(180deg, #f6f8fc 0%, #f4f6fa 100%);
          padding: 14px 0 24px;
        }

        .dashboardShell {
          width: min(1480px, calc(100vw - 28px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: 242px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .sidebar,
        .panel,
        .kpiCard,
        .ownerCard,
        .upgradeCard,
        .profileCard,
        .promoCard {
          background: rgba(255, 255, 255, 0.97);
          border: 1px solid #e5eaf2;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.035);
        }

        .sidebar {
          border-radius: 22px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: sticky;
          top: 14px;
        }

        .brandBlock {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 2px 10px;
        }

        .brandLogo {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #ffffff;
          display: grid;
          place-items: center;
          font-size: 24px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .brandName {
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
        }

        .brandSub {
          margin-top: 6px;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .navList {
          display: grid;
          gap: 7px;
        }

        .navBtn {
          min-height: 44px;
          border: none;
          border-radius: 14px;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          color: #111827;
          font-size: 15px;
          font-weight: 800;
          text-align: left;
          cursor: pointer;
        }

        .navBtn.active {
          background: #eff3fd;
          color: #1e40af;
        }

        .navIconBox {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          background: transparent;
          flex-shrink: 0;
          font-size: 13px;
        }

        .navIconBox.active {
          color: #1e40af;
        }

        .navAlert {
          margin-left: auto;
          min-width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #ef4444;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .newPill {
          margin-left: auto;
          min-width: 44px;
          height: 24px;
          border-radius: 999px;
          background: #dcfce7;
          color: #16a34a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .ownerCard {
          border-radius: 18px;
          padding: 14px;
        }

        .ownerCardTop {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ownerThumb,
        .profileThumb {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05)),
            linear-gradient(180deg, #2b2f39 0%, #1d212b 100%);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        .ownerInfo {
          min-width: 0;
        }

        .ownerName,
        .profileName {
          font-size: 15px;
          font-weight: 900;
          word-break: break-word;
        }

        .livePill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 42px;
          height: 22px;
          margin-top: 4px;
          padding: 0 10px;
          border-radius: 999px;
          background: #ecfdf3;
          color: #16a34a;
          font-size: 12px;
          font-weight: 900;
        }

        .ownerPlan,
        .profileRole {
          margin-top: 6px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .ownerStats {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }

        .ownerStatRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        .ownerStatRow strong {
          color: #111827;
          font-weight: 900;
        }

        .blackBtn,
        .whiteBtn,
        .lineBtn,
        .upgradeBtn,
        .notifyBtn,
        .filterChip,
        .selectorBtn,
        .miniBtn,
        .quickCard,
        .copyBtn,
        .linkButton,
        .loadMoreBtn {
          appearance: none;
          outline: none;
          cursor: pointer;
          font-family: inherit;
        }

        .blackBtn {
          min-height: 46px;
          padding: 0 18px;
          border: 1px solid #0f172a;
          border-radius: 14px;
          background: #081225;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 900;
          white-space: nowrap;
        }

        .sidebarStoreBtn,
        .storefrontBtn {
          width: 100%;
          margin-top: 14px;
        }

        .whiteBtn {
          min-height: 46px;
          padding: 0 18px;
          border: 1px solid #dbe2ea;
          border-radius: 14px;
          background: #ffffff;
          color: #111827;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 900;
          white-space: nowrap;
        }

        .lineBtn {
          min-height: 42px;
          padding: 0 16px;
          border: 1px solid #dbe2ea;
          border-radius: 12px;
          background: #ffffff;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
          white-space: nowrap;
        }

        .upgradeCard,
        .profileCard {
          border-radius: 18px;
          padding: 14px;
        }

        .upgradeIcon {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          color: #4338ca;
          display: grid;
          place-items: center;
          font-size: 14px;
          font-weight: 900;
          background: #eef2ff;
        }

        .upgradeTitle {
          margin-top: 12px;
          font-size: 15px;
          font-weight: 900;
          color: #111827;
        }

        .upgradeText {
          margin-top: 8px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 700;
        }

        .upgradeBtn {
          width: 100%;
          min-height: 40px;
          margin-top: 14px;
          border: 1px solid #dbe2ea;
          border-radius: 12px;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          font-weight: 900;
        }

        .profileCard {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profileInfo {
          min-width: 0;
          flex: 1;
        }

        .profileChevron {
          color: #64748b;
          font-size: 13px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .mainArea {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .topBar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 4px 2px 0;
        }

        .heroText {
          min-width: 0;
        }

        .welcomeLine {
          color: #64748b;
          font-size: 16px;
          font-weight: 800;
        }

        .heroText h1 {
          margin: 10px 0 6px;
          color: #111827;
          font-size: 34px;
          line-height: 1.05;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .heroDot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
          flex-shrink: 0;
        }

        .heroText p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          font-weight: 700;
        }

        .topActions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
          min-width: 0;
        }

        .searchBox {
          width: 328px;
          min-height: 46px;
          border: 1px solid #dbe2ea;
          border-radius: 14px;
          background: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          color: #64748b;
          min-width: 0;
        }

        .searchBox input {
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #111827;
          font-size: 14px;
        }

        .searchIcon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .notifyBtn {
          width: 38px;
          height: 38px;
          border: none;
          border-radius: 999px;
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #64748b;
          flex-shrink: 0;
        }

        .notifyBtn strong {
          position: absolute;
          top: -4px;
          right: -5px;
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #ef4444;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          font-size: 10px;
          font-weight: 900;
        }

        .errorBanner {
          padding: 14px 16px;
          border-radius: 16px;
          background: #fff0f1;
          border: 1px solid #f5c9ce;
          color: #a12639;
          font-size: 14px;
          font-weight: 800;
        }

        .kpiGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .kpiCard {
          min-height: 130px;
          border-radius: 20px;
          padding: 22px 20px;
          display: grid;
          grid-template-columns: 62px 1fr auto;
          align-items: center;
          gap: 16px;
        }

        .kpiIcon {
          width: 62px;
          height: 62px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-size: 28px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .kpiIcon.green {
          background: #dcfce7;
          color: #16a34a;
        }

        .kpiIcon.blue {
          background: #dbeafe;
          color: #2563eb;
        }

        .kpiIcon.orange {
          background: #ffedd5;
          color: #f97316;
        }

        .kpiIcon.purple {
          background: #ede9fe;
          color: #8b5cf6;
        }

        .kpiBody {
          min-width: 0;
        }

        .kpiLabel {
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
        }

        .kpiValue {
          margin-top: 6px;
          color: #111827;
          font-size: 22px;
          line-height: 1;
          font-weight: 900;
        }

        .kpiMeta {
          margin-top: 10px;
          font-size: 13px;
          font-weight: 800;
        }

        .greenText {
          color: #16a34a;
        }

        .redText {
          color: #ef4444;
        }

        .sparkSvg {
          width: 84px;
          height: 42px;
          display: block;
          flex-shrink: 0;
        }

        .ghostIcon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: #fff7ed;
          color: #f59e0b;
          display: grid;
          place-items: center;
          font-size: 22px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .contentGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) 364px;
          gap: 18px;
          align-items: start;
        }

        .leftColumn,
        .rightColumn {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .panel {
          border-radius: 22px;
          padding: 18px;
        }

        .panel h2,
        .panel h3 {
          margin: 0;
          color: #111827;
          font-size: 18px;
          font-weight: 900;
        }

        .panelHeader,
        .salesTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .titleWithBadge {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .softRedBadge {
          min-width: 66px;
          height: 28px;
          border-radius: 999px;
          background: #fff1f2;
          color: #ef4444;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 900;
        }

        .linkButton {
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 900;
        }

        .filterRow {
          margin-top: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .filterChip {
          min-height: 38px;
          padding: 0 14px;
          border: 1px solid #e6ebf2;
          border-radius: 999px;
          background: #f8fafc;
          color: #111827;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 900;
        }

        .filterChip strong {
          font-size: 12px;
        }

        .filterChip.active {
          background: #eef2ff;
          border-color: #dbeafe;
          color: #1e40af;
        }

        .ordersList {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .orderRow {
          min-height: 84px;
          border: 1px solid #e8edf4;
          border-radius: 18px;
          background: #ffffff;
          display: grid;
          grid-template-columns: 90px 44px minmax(120px, 0.9fr) minmax(150px, 1.1fr) 88px 116px minmax(160px, 1fr);
          gap: 12px;
          align-items: center;
          padding: 12px 14px;
          position: relative;
          overflow: hidden;
        }

        .orderRow::before {
          content: '';
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 4px;
          border-radius: 999px;
        }

        .orderRow.new::before {
          background: #ef4444;
        }

        .orderRow.in_progress::before {
          background: #3b82f6;
        }

        .orderRow.ready::before {
          background: #f59e0b;
        }

        .orderRow.completed::before {
          background: #22c55e;
        }

        .orderRow.cancelled::before {
          background: #94a3b8;
        }

        .orderIdCol,
        .customerCol,
        .itemsCol,
        .amountCol,
        .statusCol,
        .actionsCol {
          min-width: 0;
        }

        .orderCode {
          color: #111827;
          font-size: 14px;
          font-weight: 900;
        }

        .orderAgo {
          margin-top: 8px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 900;
        }

        .avatar.new {
          background: #ffe4e6;
          color: #ef4444;
        }

        .avatar.progress {
          background: #dbeafe;
          color: #2563eb;
        }

        .avatar.ready {
          background: #ffedd5;
          color: #f59e0b;
        }

        .avatar.completed {
          background: #dcfce7;
          color: #16a34a;
        }

        .avatar.cancelled {
          background: #e2e8f0;
          color: #64748b;
        }

        .customerName {
          color: #111827;
          font-size: 15px;
          font-weight: 900;
          word-break: break-word;
        }

        .customerMeta {
          margin-top: 6px;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
          word-break: break-word;
        }

        .itemsSummary {
          color: #475569;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 700;
          word-break: break-word;
        }

        .amountValue {
          color: #111827;
          font-size: 15px;
          font-weight: 900;
        }

        .statusBadge {
          min-width: 96px;
          height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 900;
        }

        .statusBadge.new {
          background: #fff1f2;
          color: #ef4444;
        }

        .statusBadge.progress {
          background: #eff6ff;
          color: #2563eb;
        }

        .statusBadge.ready {
          background: #fff7ed;
          color: #f59e0b;
        }

        .statusBadge.completed {
          background: #ecfdf3;
          color: #16a34a;
        }

        .statusBadge.cancelled {
          background: #f1f5f9;
          color: #64748b;
        }

        .actionsCol {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .rowActionBtn {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 900;
          white-space: nowrap;
        }

        .emptyState {
          border: 1px dashed #dbe2ea;
          border-radius: 18px;
          padding: 24px;
          text-align: center;
          color: #64748b;
          font-size: 15px;
          font-weight: 800;
        }

        .loadMoreBtn {
          margin: 12px auto 0;
          display: block;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 900;
        }

        .bottomRow {
          display: grid;
          grid-template-columns: minmax(0, 1.36fr) 1fr;
          gap: 18px;
        }

        .salesPanel {
          min-width: 0;
        }

        .salesValueRow {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .salesValueRow strong {
          color: #111827;
          font-size: 18px;
          font-weight: 900;
        }

        .salesValueRow span {
          color: #16a34a;
          font-size: 13px;
          font-weight: 900;
        }

        .selectorBtn {
          min-height: 38px;
          padding: 0 14px;
          border: 1px solid #dbe2ea;
          border-radius: 12px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 900;
        }

        .salesContent {
          margin-top: 16px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 206px;
          gap: 16px;
          align-items: stretch;
        }

        .chartWrap {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 8px;
          min-width: 0;
        }

        .chartYAxis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 8px 0 24px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .chartArea {
          min-width: 0;
        }

        .chartSvg {
          width: 100%;
          height: 196px;
          display: block;
        }

        .chartDays {
          margin-top: 4px;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .salesStatsCard {
          border: 1px solid #e6ebf2;
          border-radius: 18px;
          background: #ffffff;
          padding: 16px;
          display: grid;
          align-content: start;
          gap: 14px;
        }

        .salesStatRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        .salesStatRow strong {
          color: #111827;
          font-weight: 900;
        }

        .analyticsLinkBtn {
          margin-top: 6px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 900;
          text-align: left;
          padding: 0;
        }

        .topItemsList {
          margin-top: 16px;
          display: grid;
          gap: 14px;
        }

        .topItemRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .topItemLeft,
        .topItemRight {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .rankDot {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #64748b;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .topItemLeft span {
          color: #111827;
          font-size: 14px;
          font-weight: 800;
          word-break: break-word;
        }

        .topItemRight span {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .topItemRight strong {
          color: #111827;
          font-size: 14px;
          font-weight: 900;
          white-space: nowrap;
        }

        .storeOnlineRow {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        .greenDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
          flex-shrink: 0;
        }

        .stripeCard {
          margin-top: 16px;
          border: 1px solid #e6ebf2;
          border-radius: 18px;
          background: #ffffff;
          padding: 14px;
        }

        .stripeCardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .stripeCardTop strong {
          color: #111827;
          font-size: 15px;
          font-weight: 900;
        }

        .miniBtn {
          min-height: 32px;
          padding: 0 12px;
          border: 1px solid #dbe2ea;
          border-radius: 10px;
          background: #ffffff;
          color: #64748b;
          font-size: 13px;
          font-weight: 900;
        }

        .stripeRows {
          margin-top: 14px;
          display: grid;
          gap: 14px;
        }

        .stripeRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #475569;
          font-size: 14px;
          font-weight: 700;
        }

        .successPill {
          min-width: 84px;
          height: 28px;
          border-radius: 999px;
          background: #ecfdf3;
          color: #16a34a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .nextPayoutCard {
          margin-top: 12px;
          border: 1px solid #e6ebf2;
          border-radius: 18px;
          background: #ffffff;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .nextPayoutCard span {
          display: block;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .nextPayoutCard strong {
          display: block;
          margin-top: 6px;
          color: #111827;
          font-size: 16px;
          font-weight: 900;
        }

        .nextPayoutDate {
          max-width: 140px;
          text-align: right;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .promoCard {
          border-radius: 22px;
          padding: 18px;
          display: grid;
          grid-template-columns: 1fr 116px;
          gap: 14px;
          align-items: center;
          background: linear-gradient(180deg, #fff8e5 0%, #fff2cd 100%);
          border-color: #efdfb1;
        }

        .promoCopy h3 {
          margin: 0;
          color: #111827;
          font-size: 16px;
          font-weight: 900;
        }

        .promoCopy p {
          margin: 8px 0 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 700;
        }

        .promoBtn {
          margin-top: 14px;
          width: auto;
        }

        .promoPosterWrap {
          width: 100%;
          height: 118px;
          border-radius: 18px;
          background: linear-gradient(180deg, #fde2a7 0%, #f7b857 100%);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .promoPoster {
          width: 84px;
          height: 104px;
          border-radius: 14px;
          background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 16px;
          line-height: 1.02;
          font-weight: 900;
          transform: rotate(8deg);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.2);
        }

        .quickGrid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .quickCard {
          min-height: 78px;
          border: 1px solid #e6ebf2;
          border-radius: 16px;
          background: #ffffff;
          padding: 14px;
          display: grid;
          grid-template-columns: 42px 1fr;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .quickIcon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .quickIcon.green {
          background: #dcfce7;
          color: #16a34a;
        }

        .quickIcon.red {
          background: #ffe4e6;
          color: #ef4444;
        }

        .quickIcon.blue {
          background: #dbeafe;
          color: #2563eb;
        }

        .quickIcon.purple {
          background: #ede9fe;
          color: #8b5cf6;
        }

        .quickCard strong {
          display: block;
          color: #111827;
          font-size: 14px;
          font-weight: 900;
        }

        .quickCard span:last-child {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .mutedText {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        .storefrontLinkBox {
          margin-top: 16px;
          min-height: 50px;
          border: 1px solid #e6ebf2;
          border-radius: 16px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 12px 0 14px;
        }

        .storefrontLinkBox span {
          color: #111827;
          font-size: 14px;
          font-weight: 800;
          word-break: break-word;
        }

        .copyBtn {
          width: 38px;
          height: 38px;
          border: 1px solid #dbe2ea;
          border-radius: 12px;
          background: #f8fafc;
          color: #64748b;
          display: grid;
          place-items: center;
          font-size: 15px;
          font-weight: 900;
          flex-shrink: 0;
        }

        @media (max-width: 1360px) {
          .contentGrid {
            grid-template-columns: 1fr;
          }

          .rightColumn {
            grid-template-columns: 1fr 1fr;
          }

          .promoCard {
            grid-column: span 2;
          }
        }

        @media (max-width: 1180px) {
          .dashboardShell {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: static;
          }

          .bottomRow {
            grid-template-columns: 1fr;
          }

          .salesContent {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 980px) {
          .topBar {
            flex-direction: column;
            align-items: stretch;
          }

          .topActions {
            justify-content: stretch;
          }

          .searchBox {
            width: 100%;
          }

          .kpiGrid {
            grid-template-columns: 1fr 1fr;
          }

          .orderRow {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .actionsCol {
            justify-content: flex-start;
          }

          .chartWrap {
            grid-template-columns: 1fr;
          }

          .chartYAxis {
            display: none;
          }

          .rightColumn,
          .quickGrid {
            grid-template-columns: 1fr;
          }

          .promoCard {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .ownerPage {
            padding-top: 8px;
          }

          .dashboardShell {
            width: min(100vw - 12px, 1480px);
            gap: 12px;
          }

          .sidebar,
          .panel,
          .kpiCard,
          .ownerCard,
          .upgradeCard,
          .profileCard,
          .promoCard {
            border-radius: 20px;
          }

          .heroText h1 {
            font-size: 28px;
          }

          .kpiGrid {
            grid-template-columns: 1fr;
          }

          .kpiCard {
            grid-template-columns: 62px 1fr;
          }

          .sparkSvg,
          .ghostIcon {
            display: none;
          }

          .blackBtn,
          .whiteBtn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
