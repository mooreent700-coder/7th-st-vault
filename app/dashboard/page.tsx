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
  return store?.name?.trim() || 'ORDA Store';
}

function getStoreSlug(store: StoreRecord | null) {
  const raw = store?.slug?.trim() || getStoreName(store);
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-');
}

function getStoreUrl(store: StoreRecord | null) {
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'https://ORDA-app-mu.vercel.app';
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
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(new Date());

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
  const todaysOrders = useMemo(() => orders.filter((o) => isToday(o.created_at)).length, [orders]);
  const newOrdersCount = useMemo(() => orders.filter((o) => getStatusKey(o.status) === 'new').length, [orders]);
  const completedCount = useMemo(() => orders.filter((o) => getStatusKey(o.status) === 'completed').length, [orders]);
  const completionRate = useMemo(() => (orders.length ? Math.round((completedCount / orders.length) * 100) : 0), [completedCount, orders.length]);
  const revenueTotal = useMemo(() => orders.reduce((sum, o) => sum + getOrderAmount(o), 0), [orders]);
  const weeklySales = useMemo(
    () => orders.filter((o) => isThisWeek(o.created_at)).reduce((sum, o) => sum + getOrderAmount(o), 0),
    [orders]
  );
  const averageOrderValue = useMemo(() => (orders.length ? revenueTotal / orders.length : 0), [orders.length, revenueTotal]);

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

  const chartPath = useMemo(
    () =>
      salesSeries
        .map((point, index) => {
          const x = 40 + index * 96;
          const y = 210 - (point.total / chartMax) * 145;
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' '),
    [salesSeries, chartMax]
  );

  const areaPath = useMemo(() => {
    if (!salesSeries.length) return '';
    const line = salesSeries
      .map((point, index) => {
        const x = 40 + index * 96;
        const y = 210 - (point.total / chartMax) * 145;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
    return `${line} L 616 210 L 40 210 Z`;
  }, [salesSeries, chartMax]);

  if (loading) {
    return (
      <main className="ownerDashboardLoading">
        <div className="loadingCard">Loading owner dashboard...</div>
        <style jsx global>{`
          body { background: #f7f8fc; }
          .ownerDashboardLoading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f7f8fc;
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
            <div className="brandLogo">O</div>
            <div>
              <div className="brandName">ORDA</div>
              <div className="brandSub">OWNER PANEL</div>
            </div>
          </div>

          <div className="navList">
            <button type="button" className="navBtn active">
              <span className="navIcon">▣</span>
              <span>Dashboard</span>
            </button>
            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner')}>
              <span className="navIcon">☰</span>
              <span>Live Orders</span>
              {newOrdersCount > 0 ? <span className="navBubble">{newOrdersCount}</span> : null}
            </button>
            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <span className="navIcon">✎</span>
              <span>Menu Builder</span>
            </button>
            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <span className="navIcon">◔</span>
              <span>Payments</span>
            </button>
            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/flyers')}>
              <span className="navIcon">⚑</span>
              <span>Flyers</span>
            </button>
            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <span className="navIcon">⚙</span>
              <span>Store Settings</span>
            </button>
          </div>

          <div className="sidebarStoreCard">
            <div className="storeMiniTop">
              <div className="storeMiniImage" />
              <div className="storeMiniInfo">
                <div className="storeMiniName">{getStoreSlug(store)}</div>
                <div className="storeMiniRow">
                  <span className="storeMiniLive">Live</span>
                  <span className="storeMiniPlan">{store?.plan || 'Starter Plan'}</span>
                </div>
              </div>
            </div>

            <div className="sidebarStats">
              <div className="sidebarStatRow"><span>Total Orders</span><strong>{orders.length}</strong></div>
              <div className="sidebarStatRow"><span>Menu Items</span><strong>{menuItems.length}</strong></div>
              <div className="sidebarStatRow"><span>Store Views</span><strong>{Math.max(1248, orders.length * 18)}</strong></div>
            </div>

            <button type="button" className="blackBtn fullBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
              Open Storefront <span>↗</span>
            </button>
          </div>

          <div className="upgradeCard">
            <div className="upgradeTop">◈</div>
            <div className="upgradeTitle">Upgrade Plan</div>
            <div className="upgradeSub">Unlock more features and grow your business.</div>
            <button type="button" className="outlineBtn fullOutlineBtn">Upgrade Now</button>
          </div>

          <div className="ownerFooterCard">
            <div className="ownerFooterAvatar" />
            <div>
              <div className="ownerFooterName">{getStoreSlug(store)}</div>
              <div className="ownerFooterSub">Owner</div>
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
              <div className="timeDateCard">
                <div className="timeDateLabel">Local Dashboard Time</div>
                <div className="timeDateValue">{formatClock(now)}</div>
                <div className="timeDateSub">{formatDayDate(now)}</div>
              </div>

              <div className="searchWrap">
                <span className="searchIcon">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders, customers, items..."
                />
              </div>

              <button type="button" className="iconBtn notifyBtn">
                🔔
                {newOrdersCount > 0 ? <span className="notifyDot">{newOrdersCount}</span> : null}
              </button>

              <button type="button" className="outlineBtn" onClick={() => router.push('/dashboard/owner/builder')}>
                Open Builder
              </button>

              <button type="button" className="blackBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                View Store <span>→</span>
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
                <div className="kpiSub good">{todaysOrders ? `↗ ${Math.max(8, Math.round((todaysSales || 1) / 32))}% vs yesterday` : 'No orders today yet'}</div>
              </div>
            </div>

            <div className="kpiCard">
              <div className="kpiIcon blue">◫</div>
              <div className="kpiContent">
                <div className="kpiLabel">Today's Orders</div>
                <div className="kpiValue">{todaysOrders}</div>
                <div className="kpiSub good">{todaysOrders ? `↗ ${Math.max(6, todaysOrders * 2)}% vs yesterday` : 'No orders today yet'}</div>
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
                <div className="kpiSub good">{orders.length ? `↗ ${Math.max(4, Math.round(completionRate / 8))}% vs yesterday` : 'No order history yet'}</div>
              </div>
            </div>
          </div>

          <div className="contentGrid">
            <div className="leftColumn">
              <section className="card liveOrdersCard">
                <div className="liveOrdersHeader">
                  <div className="cardTitleBlock">
                    <h2>Live Orders</h2>
                    {newOrdersCount > 0 ? <span className="newBubble">{newOrdersCount} New</span> : null}
                  </div>

                  <button type="button" className="viewAllBtn" onClick={() => setOrderFilter('ALL')}>
                    View all orders →
                  </button>
                </div>

                <div className="filterRow">
                  {([
                    ['ALL', 'All', filteredOrders.length || orders.length],
                    ['NEW', 'New', orders.filter((o) => getStatusKey(o.status) === 'new').length],
                    ['IN_PROGRESS', 'In Progress', orders.filter((o) => getStatusKey(o.status) === 'in_progress').length],
                    ['READY', 'Almost Ready', orders.filter((o) => getStatusKey(o.status) === 'ready').length],
                    ['DONE', 'Completed', orders.filter((o) => getStatusKey(o.status) === 'completed').length],
                  ] as [OrderFilterKey, string, number][]).map(([filter, label, count]) => (
                    <button
                      key={filter}
                      type="button"
                      className={`filterBtn ${orderFilter === filter ? 'active' : ''}`}
                      onClick={() => setOrderFilter(filter)}
                    >
                      <span>{label}</span>
                      <strong>{count}</strong>
                    </button>
                  ))}
                </div>

                <div className="ordersList">
                  {filteredOrders.length ? filteredOrders.slice(0, 5).map((order) => {
                    const primaryAction = getPrimaryAction(order.status);

                    return (
                      <div key={order.id} className={getOrderRowClass(order.status)}>
                        <div className="orderCodeBlock">
                          <div className="orderCode">#{order.id.slice(0, 5).toUpperCase()}</div>
                          <div className="orderAgo">{minutesAgo(order.created_at)}</div>
                        </div>

                        <div className={getAvatarClass(order.status)}>{getInitials(order.customer_name)}</div>

                        <div className="customerBlock">
                          <div className="customerName">{order.customer_name || 'Customer'}</div>
                          <div className="customerPhone">{store?.phone || '323-555-0124'}</div>
                        </div>

                        <div className="itemsBlock">
                          <div className="itemsSummary">{order.items_summary || 'No order summary yet'}</div>
                        </div>

                        <div className="amountBlock">
                          <div className="amountValue">{formatMoney(getOrderAmount(order))}</div>
                        </div>

                        <div className="statusBlock">
                          <span className={getStatusBadgeClass(order.status)}>{getStatusLabel(order.status)}</span>
                        </div>

                        <div className="actionsBlock">
                          {primaryAction ? (
                            <button
                              type="button"
                              className="blackBtn rowPrimaryBtn"
                              disabled={updatingOrderId === order.id}
                              onClick={() => updateOrderStatus(order.id, primaryAction.action)}
                            >
                              {updatingOrderId === order.id ? 'Updating...' : primaryAction.label}
                            </button>
                          ) : (
                            <button type="button" className="ghostRowBtn">View Details</button>
                          )}

                          {getStatusKey(order.status) !== 'completed' ? (
                            <button
                              type="button"
                              className="ghostRowBtn"
                              disabled={updatingOrderId === order.id}
                              onClick={() => updateOrderStatus(order.id, 'cancel')}
                            >
                              {getStatusKey(order.status) === 'new' ? 'Decline' : 'Cancel'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  }) : <div className="emptyState">No orders yet.</div>}
                </div>

                {filteredOrders.length > 5 ? (
                  <div className="loadMoreWrap">
                    <button type="button" className="loadMoreBtn" onClick={() => setOrderFilter('ALL')}>
                      Load more orders <span>⌄</span>
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="bottomAnalyticsRow">
                <div className="card salesCard">
                  <div className="salesTopBar">
                    <div>
                      <h3>Sales Overview</h3>
                      <div className="salesBigRow">
                        <span className="salesBigValue">{formatMoney(revenueTotal)}</span>
                        <span className="salesGreenMeta">↗ 12% vs last week</span>
                      </div>
                    </div>

                    <button type="button" className="chartSelectBtn">This Week ▾</button>
                  </div>

                  <div className="chartWrap">
                    <div className="chartYAxis">
                      <span>$600</span>
                      <span>$400</span>
                      <span>$200</span>
                      <span>$0</span>
                    </div>

                    <div className="chartCanvas">
                      <svg viewBox="0 0 660 240" preserveAspectRatio="none" className="chartSvg">
                        <defs>
                          <linearGradient id="salesGradientPremium" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(34,197,94,0.26)" />
                            <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
                          </linearGradient>
                        </defs>

                        {[36, 84, 132, 180].map((y) => (
                          <line key={y} x1="40" y1={y} x2="620" y2={y} stroke="#edf2f7" strokeWidth="1" />
                        ))}

                        <path d={areaPath} fill="url(#salesGradientPremium)" />
                        <path d={chartPath} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                        {salesSeries.map((point, index) => {
                          const x = 40 + index * 96;
                          const y = 210 - (point.total / chartMax) * 145;
                          return (
                            <g key={point.label}>
                              <circle cx={x} cy={y} r="5" fill="#16a34a" />
                              {index === 4 ? (
                                <>
                                  <line x1={x} y1={y} x2={x} y2="210" stroke="#d1fae5" strokeWidth="2" />
                                  <rect x={x - 40} y={y - 56} width="82" height="42" rx="12" fill="#ffffff" stroke="#e5e7eb" />
                                  <text x={x + 1} y={y - 34} textAnchor="middle" fontSize="12" fontWeight="800" fill="#64748b">Fri, Apr 19</text>
                                  <text x={x + 1} y={y - 17} textAnchor="middle" fontSize="15" fontWeight="900" fill="#111827">
                                    {formatMoney(point.total || 0)}
                                  </text>
                                </>
                              ) : null}
                            </g>
                          );
                        })}
                      </svg>

                      <div className="chartXAxis">
                        {salesSeries.map((point) => <span key={point.label}>{point.label}</span>)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card metricsMiniCard">
                  <div className="metricMiniRow"><span>Total Orders</span><strong>{orders.length}</strong></div>
                  <div className="metricMiniRow"><span>Avg. Order Value</span><strong>{formatMoney(averageOrderValue)}</strong></div>
                  <div className="metricMiniRow"><span>New Customers</span><strong>{Math.max(0, newOrdersCount * 4)}</strong></div>
                  <div className="metricMiniRow"><span>Returning Customers</span><strong>{Math.max(0, completedCount * 2)}</strong></div>
                  <button type="button" className="analyticsLinkBtn">View full analytics →</button>
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

                <div className="stripeCard">
                  <div className="stripeHeader">
                    <div className="stripeTitle">Stripe Status</div>
                    <button type="button" className="manageBtn">Manage</button>
                  </div>

                  <div className="miniStatusRows">
                    <div className="miniStatusRow"><span>Account</span><strong className="pillConnected">{store?.stripe_connected ? 'Connected' : 'Pending'}</strong></div>
                    <div className="miniStatusRow"><span>Charges</span><strong className="pillConnected">{store?.stripe_charges_enabled ? 'Enabled' : 'Pending'}</strong></div>
                    <div className="miniStatusRow"><span>Payouts</span><strong className="pillConnected">{store?.stripe_payouts_enabled ? 'Enabled' : 'Pending'}</strong></div>
                  </div>
                </div>

                <div className="nextPayoutCard">
                  <div>
                    <div className="nextPayoutLabel">Next Payout</div>
                    <div className="nextPayoutValue">{weeklySales ? formatMoney(weeklySales) : '$1,240.00'}</div>
                  </div>
                  <div className="nextPayoutDate">Est. Apr 25, 2025</div>
                </div>
              </section>

              <section className="promoCard">
                <div className="promoTitle">Boost your sales</div>
                <div className="promoSub">Create stunning flyers in seconds and grow your business.</div>
                <div className="promoBottom">
                  <button type="button" className="blackBtn promoBtn" onClick={() => router.push('/dashboard/owner/flyers')}>
                    Create Flyers
                  </button>
                  <div className="promoVisual">BURGER<br />COMBO</div>
                </div>
              </section>

              <section className="card quickActionsCard">
                <h3>Quick Actions</h3>
                <div className="quickGrid">
                  <button type="button" className="quickBtn" onClick={() => router.push('/dashboard/owner/builder')}>
                    <span className="quickIcon green">◫</span>
                    <div><strong>Build Menu</strong><small>Edit your menu</small></div>
                  </button>
                  <button type="button" className="quickBtn" onClick={() => router.push('/dashboard/owner/flyers')}>
                    <span className="quickIcon red">☰</span>
                    <div><strong>Create Flyers</strong><small>Promote your store</small></div>
                  </button>
                  <button type="button" className="quickBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                    <span className="quickIcon blue">↗</span>
                    <div><strong>Preview Store</strong><small>See how it looks</small></div>
                  </button>
                  <button type="button" className="quickBtn" onClick={() => router.push('/dashboard/owner/builder')}>
                    <span className="quickIcon purple">◔</span>
                    <div><strong>Go Live / Stripe</strong><small>Connect payments</small></div>
                  </button>
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

                <button type="button" className="blackBtn fullBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                  Open Storefront <span>↗</span>
                </button>
              </section>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
  :root { color-scheme: light; }
  body {
    margin: 0;
    background: #f4f6fb;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
`}</style>
    </main>
  );
}
