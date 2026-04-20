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
  created_at?: string | null;
};

type OrderFilterKey = 'ALL' | 'NEW' | 'IN_PROGRESS' | 'READY' | 'DONE';
type OwnerAction = 'accept' | 'ready' | 'complete' | 'cancel';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://menuflow-app-mu.vercel.app';

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMoneyNoCents(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
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
  return `${BASE_URL}/store/${getStoreSlug(store)}`;
}

function formatTime(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
            .select('id,name,created_at')
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

      const { error: updateError } = await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);

      if (updateError) throw updateError;

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          return { ...order, status: nextStatus };
        })
      );
    } catch (err: any) {
      setError(err?.message || 'Could not update order.');
    } finally {
      setUpdatingOrderId('');
    }
  }

  function goToSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const totalOrdersCount = orders.length;

  const averageOrderValue = useMemo(() => {
    if (!orders.length) return 0;
    return revenueTotal / orders.length;
  }, [orders.length, revenueTotal]);

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
        itemMap.set(name, {
          name,
          qty: (existing?.qty || 0) + qty,
        });
      }
    }

    const fromOrders = Array.from(itemMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);

    if (fromOrders.length) return fromOrders;

    return (menuItems || [])
      .slice(0, 4)
      .map((item, index) => ({
        name: item.name?.trim() || `Menu Item ${index + 1}`,
        qty: Math.max(1, 4 - index),
      }));
  }, [orders, menuItems]);

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
            <button type="button" className="navBtn active" onClick={() => goToSection('dashboard-top')}>
              <span className="navIcon">▣</span>
              <span>Dashboard</span>
            </button>

            <button type="button" className="navBtn" onClick={() => goToSection('live-orders')}>
              <span className="navIcon">☰</span>
              <span>Live Orders</span>
              {newOrdersCount > 0 ? <span className="navCount">{newOrdersCount}</span> : null}
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <span className="navIcon">✎</span>
              <span>Menu Builder</span>
            </button>

            <button type="button" className="navBtn" onClick={() => goToSection('payments-section')}>
              <span className="navIcon">◔</span>
              <span>Payments</span>
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/flyers')}>
              <span className="navIcon">⚑</span>
              <span>Flyers</span>
            </button>

            <button type="button" className="navBtn" onClick={() => goToSection('storefront-section')}>
              <span className="navIcon">⌘</span>
              <span>Customers</span>
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/flyers')}>
              <span className="navIcon">✦</span>
              <span>Marketing</span>
              <span className="navMiniTag">New</span>
            </button>

            <button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}>
              <span className="navIcon">⚙</span>
              <span>Store Settings</span>
            </button>

            <button type="button" className="navBtn" onClick={() => goToSection('payments-section')}>
              <span className="navIcon">⌁</span>
              <span>Integrations</span>
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
              <div className="sidebarStatRow">
                <span>Total Orders</span>
                <strong>{totalOrdersCount}</strong>
              </div>
              <div className="sidebarStatRow">
                <span>Menu Items</span>
                <strong>{menuItems.length}</strong>
              </div>
              <div className="sidebarStatRow">
                <span>Store Views</span>
                <strong>{Math.max(totalOrdersCount * 12, 1248)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="blackBtn sidebarOpenBtn"
              onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}
            >
              Open Storefront
              <span>↗</span>
            </button>
          </div>

          <div className="sidebarUpgradeCard">
            <div className="upgradeIcon">◈</div>
            <div className="upgradeTitle">Upgrade Plan</div>
            <div className="upgradeText">Unlock more features and grow your business.</div>
            <button type="button" className="ghostUpgradeBtn" onClick={() => goToSection('payments-section')}>
              Upgrade Now
            </button>
          </div>

          <div className="sidebarBottomOwner">
            <div className="ownerAvatar">b</div>
            <div>
              <div className="ownerName">{getStoreSlug(store)}</div>
              <div className="ownerRole">Owner</div>
            </div>
          </div>
        </aside>

        <section className="mainArea" id="dashboard-top">
          <header className="topBar">
            <div className="topWelcome">
              <div className="topWelcomeLine">Welcome back, {getStoreSlug(store)} 👋</div>
              <h1>Your Store is Live <span className="liveDot" /></h1>
              <div className="topSub">All systems operational and accepting orders</div>
            </div>

            <div className="topBarRight">
              <div className="searchWrap">
                <span className="searchIcon">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders, customers, items..."
                />
              </div>

              <button type="button" className="notificationBtn" onClick={() => goToSection('live-orders')}>
                <span>◔</span>
                {newOrdersCount > 0 ? <span className="notificationCount">{newOrdersCount}</span> : null}
              </button>

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
                <div className="kpiSub good">↗ 18% vs yesterday</div>
              </div>
              <div className="miniSpark greenSpark" />
            </div>

            <div className="kpiCard">
              <div className="kpiIcon blue">◫</div>
              <div className="kpiContent">
                <div className="kpiLabel">Today's Orders</div>
                <div className="kpiValue">{todaysOrders}</div>
                <div className="kpiSub good">↗ 14% vs yesterday</div>
              </div>
              <div className="miniSpark blueSpark" />
            </div>

            <div className="kpiCard">
              <div className="kpiIcon orange">☰</div>
              <div className="kpiContent">
                <div className="kpiLabel">New Orders</div>
                <div className="kpiValue">{newOrdersCount}</div>
                <div className="kpiSub danger">Needs action</div>
              </div>
              <div className="miniSignal orangeSignal" />
            </div>

            <div className="kpiCard">
              <div className="kpiIcon purple">◔</div>
              <div className="kpiContent">
                <div className="kpiLabel">Completion Rate</div>
                <div className="kpiValue">{completionRate}%</div>
                <div className="kpiSub good">↗ 8% vs yesterday</div>
              </div>
              <div className="miniSpark greenSpark" />
            </div>
          </div>

          <div className="contentGrid">
            <div className="leftColumn">
              <section className="card liveOrdersCard" id="live-orders">
                <div className="cardHeader">
                  <div className="cardTitleBlock">
                    <h2>Live Orders</h2>
                    {newOrdersCount > 0 ? <span className="newBubble">{newOrdersCount} New</span> : null}
                  </div>

                  <button type="button" className="viewAllBtn" onClick={() => goToSection('sales-section')}>
                    View all orders <span>→</span>
                  </button>
                </div>

                <div className="filterRow">
                  <button
                    type="button"
                    className={`filterBtn ${orderFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setOrderFilter('ALL')}
                  >
                    All
                    <span>{searchedOrders.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`filterBtn ${orderFilter === 'NEW' ? 'active' : ''}`}
                    onClick={() => setOrderFilter('NEW')}
                  >
                    New
                    <span>{orders.filter((o) => getStatusKey(o.status) === 'new').length}</span>
                  </button>

                  <button
                    type="button"
                    className={`filterBtn ${orderFilter === 'IN_PROGRESS' ? 'active' : ''}`}
                    onClick={() => setOrderFilter('IN_PROGRESS')}
                  >
                    In Progress
                    <span>{orders.filter((o) => getStatusKey(o.status) === 'in_progress').length}</span>
                  </button>

                  <button
                    type="button"
                    className={`filterBtn ${orderFilter === 'READY' ? 'active' : ''}`}
                    onClick={() => setOrderFilter('READY')}
                  >
                    Almost Ready
                    <span>{orders.filter((o) => getStatusKey(o.status) === 'ready').length}</span>
                  </button>

                  <button
                    type="button"
                    className={`filterBtn ${orderFilter === 'DONE' ? 'active' : ''}`}
                    onClick={() => setOrderFilter('DONE')}
                  >
                    Completed
                    <span>{orders.filter((o) => getStatusKey(o.status) === 'completed').length}</span>
                  </button>
                </div>

                <div className="ordersList">
                  {filteredOrders.slice(0, 5).map((order) => {
                    const primaryAction = getPrimaryAction(order.status);

                    return (
                      <div key={order.id} className={getOrderRowClass(order.status)}>
                        <div className="orderCol orderMetaCol">
                          <div className="orderNumber">#{order.id.slice(0, 5).toUpperCase()}</div>
                          <div className="orderAgo">{minutesAgo(order.created_at)}</div>
                        </div>

                        <div className={getAvatarClass(order.status)}>
                          {getInitials(order.customer_name)}
                        </div>

                        <div className="orderCol customerCol">
                          <div className="customerName">{order.customer_name || 'Customer'}</div>
                          <div className="customerPhone">{store?.phone || '323-555-0124'}</div>
                        </div>

                        <div className="orderCol itemsCol">
                          <div className="itemsSummary">{order.items_summary || '1x Item'}</div>
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
                          ) : (
                            <button
                              type="button"
                              className="secondaryActionBtn"
                              onClick={() => goToSection('storefront-section')}
                            >
                              View Details
                            </button>
                          )}

                          {getStatusKey(order.status) !== 'completed' && getStatusKey(order.status) !== 'cancelled' ? (
                            <button
                              type="button"
                              className="secondaryActionBtn"
                              disabled={updatingOrderId === order.id}
                              onClick={() => updateOrderStatus(order.id, 'cancel')}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {!filteredOrders.length ? (
                    <div className="emptyState">No orders yet.</div>
                  ) : null}
                </div>

                {filteredOrders.length > 5 ? (
                  <button type="button" className="loadMoreBtn" onClick={() => goToSection('sales-section')}>
                    Load more orders <span>⌄</span>
                  </button>
                ) : null}
              </section>

              <section className="bottomAnalyticsRow" id="sales-section">
                <div className="card salesCard">
                  <div className="salesHeader">
                    <div>
                      <h3>Sales Overview</h3>
                      <div className="salesBigValue">{formatMoney(revenueTotal)}</div>
                      <div className="salesTrend">↗ 12% vs last week</div>
                    </div>

                    <button type="button" className="rangeBtn" onClick={() => goToSection('payments-section')}>
                      This Week <span>⌄</span>
                    </button>
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
                          <line
                            key={y}
                            x1="40"
                            y1={y}
                            x2="760"
                            y2={y}
                            stroke="#edf2f7"
                            strokeWidth="1"
                          />
                        ))}

                        <path d={areaPath} fill="url(#salesGradient)" />
                        <path
                          d={chartPath}
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {salesSeries.map((point, index) => {
                          const x = 40 + index * 120;
                          const y = 220 - (point.total / chartMax) * 150;

                          return (
                            <g key={point.label}>
                              <circle cx={x} cy={y} r="5" fill="#16a34a" />
                              <circle cx={x} cy={y} r="10" fill="rgba(22,163,74,0.10)" />
                              {index === 4 ? (
                                <>
                                  <rect x={x - 42} y={y - 56} width="84" height="42" rx="10" fill="#ffffff" stroke="#e5e7eb" />
                                  <text x={x} y={y - 36} textAnchor="middle" fontSize="12" fontWeight="700" fill="#6b7280">
                                    {formatDateShort(new Date().toISOString())}
                                  </text>
                                  <text x={x} y={y - 18} textAnchor="middle" fontSize="16" fontWeight="900" fill="#111827">
                                    {formatMoneyNoCents(point.total)}
                                  </text>
                                </>
                              ) : null}
                            </g>
                          );
                        })}
                      </svg>

                      <div className="chartXAxis">
                        {salesSeries.map((point) => (
                          <span key={point.label}>{point.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card topItemsCard">
                  <div className="miniCardHeader">
                    <h3>Top Items</h3>
                    <button type="button" className="rangeBtn smallRange" onClick={() => router.push('/dashboard/owner/builder')}>
                      This Week <span>⌄</span>
                    </button>
                  </div>

                  <div className="topItemsList">
                    {topItems.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="topItemRow">
                        <div className="topItemLeft">
                          <div className="rankDot">{index + 1}</div>
                          <span>{item.name}</span>
                        </div>
                        <div className="topItemRight">
                          <span>{item.qty} sold</span>
                          <strong>{formatMoneyNoCents(item.qty * Math.max(8, averageOrderValue))}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="analyticsLinkBtn" onClick={() => router.push('/dashboard/owner/builder')}>
                    View full analytics <span>→</span>
                  </button>
                </div>
              </section>
            </div>

            <div className="rightColumn">
              <section className="card statusCard" id="payments-section">
                <h3>Store Status</h3>
                <div className="storeLiveLine">
                  <span className="smallGreenDot" />
                  <span>Your store is live and online</span>
                </div>

                <div className="miniStatusPanel">
                  <div className="miniStatusHeader">
                    <span>Stripe</span>
                    <button type="button" className="manageBtn" onClick={() => router.push('/dashboard/owner/builder')}>
                      Manage
                    </button>
                  </div>

                  <div className="miniStatusRows">
                    <div className="miniStatusRow">
                      <span>Account</span>
                      <strong className={store?.stripe_connected ? 'greenText' : 'mutedPill'}>
                        {store?.stripe_connected ? 'Connected' : 'Pending'}
                      </strong>
                    </div>
                    <div className="miniStatusRow">
                      <span>Charges</span>
                      <strong className={store?.stripe_charges_enabled ? 'greenText' : 'mutedPill'}>
                        {store?.stripe_charges_enabled ? 'Enabled' : 'Pending'}
                      </strong>
                    </div>
                    <div className="miniStatusRow">
                      <span>Payouts</span>
                      <strong className={store?.stripe_payouts_enabled ? 'greenText' : 'mutedPill'}>
                        {store?.stripe_payouts_enabled ? 'Enabled' : 'Pending'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="nextPayoutCard">
                  <div>
                    <div className="nextPayoutLabel">Next Payout</div>
                    <div className="nextPayoutValue">{formatMoney(weeklySales || 1240)}</div>
                  </div>
                  <div className="nextPayoutDate">Est. Apr 25, 2025</div>
                </div>
              </section>

              <section className="promoCard">
                <div className="promoText">
                  <div className="promoTitle">Boost your sales</div>
                  <div className="promoSub">Create stunning flyers in seconds and grow your business.</div>
                  <button type="button" className="blackBtn promoBtn" onClick={() => router.push('/dashboard/owner/flyers')}>
                    Create Flyers
                  </button>
                </div>
                <div className="promoArt">🍔</div>
              </section>

              <section className="card quickActionsCard">
                <h3>Quick Actions</h3>

                <div className="quickGrid">
                  <button type="button" className="quickCard" onClick={() => router.push('/dashboard/owner/builder')}>
                    <span className="quickIcon greenBg">◫</span>
                    <div>
                      <div className="quickTitle">Build Menu</div>
                      <div className="quickSub">Edit your menu</div>
                    </div>
                  </button>

                  <button type="button" className="quickCard" onClick={() => router.push('/dashboard/owner/flyers')}>
                    <span className="quickIcon redBg">▤</span>
                    <div>
                      <div className="quickTitle">Create Flyers</div>
                      <div className="quickSub">Promote your store</div>
                    </div>
                  </button>

                  <button type="button" className="quickCard" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                    <span className="quickIcon blueBg">⌕</span>
                    <div>
                      <div className="quickTitle">Preview Store</div>
                      <div className="quickSub">See live storefront</div>
                    </div>
                  </button>

                  <button type="button" className="quickCard" onClick={() => router.push('/dashboard/owner/builder')}>
                    <span className="quickIcon grayBg">◔</span>
                    <div>
                      <div className="quickTitle">Go Live / Stripe</div>
                      <div className="quickSub">Connect payments</div>
                    </div>
                  </button>
                </div>
              </section>

              <section className="card storefrontCard" id="storefront-section">
                <h3>Your Storefront Link</h3>
                <div className="storefrontSub">Share your store with customers</div>

                <div className="storefrontLinkBox">
                  <span>{storeUrl}</span>
                  <button type="button" className="copyIconBtn" onClick={copyStoreLink}>
                    {copied ? '✓' : '⧉'}
                  </button>
                </div>

                <button
                  type="button"
                  className="blackBtn storefrontOpenBtn"
                  onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}
                >
                  Open Storefront
                  <span>↗</span>
                </button>
              </section>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        :root {
          color-scheme: light;
        }

        body {
          margin: 0;
          background: #f8fafc;
        }

        .ownerPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(218, 231, 255, 0.35), transparent 28%),
            linear-gradient(180deg, #fafcff 0%, #f7f9fc 100%);
          color: #111827;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .dashboardShell {
          width: min(1500px, calc(100vw - 28px));
          margin: 14px auto;
          display: grid;
          grid-template-columns: 238px minmax(0, 1fr);
          gap: 18px;
        }

        .sidebar {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #e8edf4;
          border-radius: 24px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
          position: sticky;
          top: 14px;
          height: calc(100vh - 28px);
          overflow: auto;
        }

        .brandBlock {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 2px 6px;
        }

        .brandLogo {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #ffffff;
          display: grid;
          place-items: center;
          font-size: 22px;
          font-weight: 900;
        }

        .brandName {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .brandSub {
          margin-top: 2px;
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .navList {
          display: grid;
          gap: 6px;
        }

        .navBtn {
          height: 48px;
          border: none;
          border-radius: 14px;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 14px;
          font-size: 15px;
          font-weight: 800;
          color: #1f2937;
          cursor: pointer;
          text-align: left;
        }

        .navBtn.active {
          background: #edf3ff;
          color: #173b8f;
        }

        .navBtn:hover {
          background: #f3f6fb;
        }

        .navIcon {
          width: 20px;
          text-align: center;
          color: #64748b;
          flex-shrink: 0;
        }

        .navCount {
          margin-left: auto;
          min-width: 24px;
          height: 24px;
          padding: 0 7px;
          border-radius: 999px;
          background: #ef4444;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
        }

        .navMiniTag {
          margin-left: auto;
          min-width: 50px;
          height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          background: #ecfdf3;
          color: #16a34a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
        }

        .sidebarStoreCard,
        .sidebarUpgradeCard,
        .sidebarBottomOwner,
        .card,
        .promoCard,
        .kpiCard {
          border: 1px solid #e6ebf2;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.04);
        }

        .sidebarStoreCard {
          border-radius: 18px;
          padding: 14px;
        }

        .storeMiniTop {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .storeMiniImage {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background:
            linear-gradient(135deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.04)),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' fill='%23111827'/%3E%3Crect x='18' y='55' width='124' height='70' rx='10' fill='%23334155'/%3E%3Crect x='28' y='65' width='104' height='16' rx='4' fill='%23f59e0b'/%3E%3Crect x='30' y='95' width='22' height='22' fill='%23f8fafc'/%3E%3Crect x='58' y='95' width='22' height='22' fill='%23f8fafc'/%3E%3Crect x='86' y='95' width='22' height='22' fill='%23f8fafc'/%3E%3Crect x='114' y='95' width='14' height='22' fill='%23f8fafc'/%3E%3C/svg%3E")
              center/cover no-repeat;
          flex-shrink: 0;
        }

        .storeMiniInfo {
          display: grid;
          gap: 4px;
        }

        .storeMiniName {
          font-size: 16px;
          font-weight: 900;
          line-height: 1;
        }

        .storeMiniLive {
          width: fit-content;
          min-width: 48px;
          height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          background: #ecfdf3;
          color: #16a34a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
        }

        .sidebarStats {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }

        .sidebarStatRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 14px;
          color: #64748b;
        }

        .sidebarStatRow strong {
          color: #111827;
          font-weight: 900;
        }

        .blackBtn,
        .outlineBtn,
        .ghostUpgradeBtn,
        .manageBtn,
        .viewAllBtn,
        .filterBtn,
        .secondaryActionBtn,
        .loadMoreBtn,
        .rangeBtn,
        .quickCard,
        .copyIconBtn,
        .notificationBtn {
          appearance: none;
          border: none;
          outline: none;
          cursor: pointer;
          font-family: inherit;
        }

        .blackBtn {
          height: 48px;
          padding: 0 18px;
          border-radius: 14px;
          background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.14);
        }

        .sidebarOpenBtn {
          width: 100%;
          margin-top: 14px;
          height: 46px;
        }

        .outlineBtn {
          height: 48px;
          padding: 0 18px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #dbe2ea;
          color: #111827;
          font-size: 15px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .sidebarUpgradeCard {
          border-radius: 18px;
          padding: 16px;
        }

        .upgradeIcon {
          font-size: 20px;
          color: #1d4ed8;
          margin-bottom: 8px;
        }

        .upgradeTitle {
          font-size: 16px;
          font-weight: 900;
        }

        .upgradeText {
          margin-top: 8px;
          font-size: 14px;
          color: #64748b;
          line-height: 1.45;
        }

        .ghostUpgradeBtn {
          margin-top: 14px;
          width: 100%;
          height: 40px;
          border-radius: 12px;
          border: 1px solid #dbe2ea;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          font-weight: 900;
        }

        .sidebarBottomOwner {
          margin-top: auto;
          border-radius: 18px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ownerAvatar {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #ffffff;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 900;
        }

        .ownerName {
          font-size: 15px;
          font-weight: 900;
        }

        .ownerRole {
          margin-top: 2px;
          font-size: 13px;
          color: #64748b;
          font-weight: 700;
        }

        .mainArea {
          display: grid;
          gap: 18px;
        }

        .topBar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 8px 6px 0;
        }

        .topWelcomeLine {
          font-size: 16px;
          color: #64748b;
          font-weight: 800;
        }

        .topBar h1 {
          margin: 10px 0 6px;
          font-size: 34px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topSub {
          font-size: 15px;
          color: #64748b;
          font-weight: 700;
        }

        .liveDot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #22c55e;
          display: inline-block;
          box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
        }

        .topBarRight {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .searchWrap {
          width: 330px;
          height: 48px;
          border: 1px solid #dbe2ea;
          border-radius: 14px;
          background: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          color: #64748b;
        }

        .searchWrap input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          font-size: 14px;
          color: #111827;
        }

        .notificationBtn {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #dbe2ea;
          color: #111827;
          position: relative;
          display: grid;
          place-items: center;
          font-weight: 900;
        }

        .notificationCount {
          position: absolute;
          top: -6px;
          right: -4px;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 999px;
          background: #ef4444;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
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
          gap: 18px;
        }

        .kpiCard {
          border-radius: 20px;
          padding: 18px;
          display: grid;
          grid-template-columns: 54px minmax(0, 1fr) 88px;
          gap: 14px;
          align-items: center;
        }

        .kpiIcon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 26px;
          font-weight: 900;
        }

        .kpiIcon.green { background: #dcfce7; color: #16a34a; }
        .kpiIcon.blue { background: #dbeafe; color: #2563eb; }
        .kpiIcon.orange { background: #ffedd5; color: #f97316; }
        .kpiIcon.purple { background: #ede9fe; color: #7c3aed; }

        .kpiLabel {
          font-size: 14px;
          color: #64748b;
          font-weight: 800;
        }

        .kpiValue {
          margin-top: 6px;
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .kpiSub {
          margin-top: 8px;
          font-size: 13px;
          font-weight: 800;
        }

        .kpiSub.good { color: #16a34a; }
        .kpiSub.danger { color: #ef4444; }

        .miniSpark,
        .miniSignal {
          width: 88px;
          height: 44px;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .greenSpark {
          background:
            radial-gradient(circle at 100% 0%, rgba(34,197,94,0.12), transparent 46%),
            linear-gradient(180deg, rgba(34,197,94,0.08), rgba(34,197,94,0.01));
        }

        .greenSpark::after {
          content: '';
          position: absolute;
          inset: 8px 8px 10px;
          background: linear-gradient(135deg, transparent 0 18%, #22c55e 18% 24%, transparent 24% 36%, #22c55e 36% 44%, transparent 44% 58%, #22c55e 58% 66%, transparent 66% 100%);
          opacity: 0.7;
        }

        .blueSpark {
          background:
            radial-gradient(circle at 100% 0%, rgba(37,99,235,0.12), transparent 46%),
            linear-gradient(180deg, rgba(37,99,235,0.08), rgba(37,99,235,0.01));
        }

        .blueSpark::after {
          content: '';
          position: absolute;
          inset: 8px 8px 10px;
          background: linear-gradient(135deg, transparent 0 18%, #3b82f6 18% 24%, transparent 24% 36%, #3b82f6 36% 44%, transparent 44% 58%, #3b82f6 58% 66%, transparent 66% 100%);
          opacity: 0.7;
        }

        .orangeSignal {
          background:
            radial-gradient(circle at 80% 50%, rgba(249,115,22,0.18), transparent 40%),
            linear-gradient(180deg, rgba(249,115,22,0.08), rgba(249,115,22,0.01));
        }

        .orangeSignal::after {
          content: '◔';
          position: absolute;
          right: 12px;
          top: 7px;
          font-size: 26px;
          color: #f97316;
          opacity: 0.88;
        }

        .contentGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(300px, 360px);
          gap: 18px;
          align-items: start;
        }

        .leftColumn,
        .rightColumn {
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .card,
        .promoCard {
          border-radius: 22px;
          padding: 18px;
        }

        .liveOrdersCard {
          padding-bottom: 12px;
        }

        .cardHeader,
        .salesHeader,
        .miniCardHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .cardTitleBlock {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .card h2,
        .card h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .newBubble {
          min-width: 64px;
          height: 28px;
          padding: 0 12px;
          border-radius: 999px;
          background: #fff1f2;
          color: #ef4444;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
        }

        .viewAllBtn {
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .filterRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .filterBtn {
          min-width: 78px;
          height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          background: #f7fafc;
          border: 1px solid #e6ebf2;
          color: #111827;
          font-size: 14px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .filterBtn span {
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.06);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
        }

        .filterBtn.active {
          background: #eff6ff;
          border-color: #dbeafe;
          color: #173b8f;
        }

        .ordersList {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .orderRow {
          min-height: 82px;
          border: 1px solid #e8edf4;
          border-radius: 18px;
          background: #ffffff;
          display: grid;
          grid-template-columns: 100px 54px 1.1fr 1.2fr 120px 120px 182px;
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

        .orderRow.new::before { background: #ef4444; }
        .orderRow.progress::before { background: #2563eb; }
        .orderRow.ready::before { background: #f59e0b; }
        .orderRow.completed::before { background: #16a34a; }
        .orderRow.cancelled::before { background: #94a3b8; }

        .orderCol {
          min-width: 0;
        }

        .orderNumber {
          font-size: 14px;
          font-weight: 900;
          color: #111827;
        }

        .orderAgo {
          margin-top: 8px;
          font-size: 13px;
          color: #64748b;
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

        .avatar.new { background: #ffe4e6; color: #ef4444; }
        .avatar.progress { background: #dbeafe; color: #2563eb; }
        .avatar.ready { background: #ffedd5; color: #f59e0b; }
        .avatar.completed { background: #dcfce7; color: #16a34a; }
        .avatar.cancelled { background: #e2e8f0; color: #64748b; }

        .customerName {
          font-size: 15px;
          font-weight: 900;
          color: #111827;
        }

        .customerPhone {
          margin-top: 6px;
          font-size: 14px;
          color: #64748b;
          font-weight: 700;
        }

        .itemsSummary {
          font-size: 14px;
          line-height: 1.45;
          color: #475569;
          font-weight: 700;
        }

        .amountValue {
          font-size: 15px;
          font-weight: 900;
          color: #111827;
        }

        .statusBadge {
          min-width: 92px;
          height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
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
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .smallBlackBtn {
          height: 42px;
          min-width: 92px;
          padding: 0 16px;
          border-radius: 12px;
          font-size: 14px;
        }

        .secondaryActionBtn {
          height: 42px;
          min-width: 92px;
          padding: 0 16px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #dbe2ea;
          color: #475569;
          font-size: 14px;
          font-weight: 900;
        }

        .emptyState {
          border: 1px dashed #dbe2ea;
          border-radius: 18px;
          padding: 22px;
          text-align: center;
          color: #64748b;
          font-size: 15px;
          font-weight: 800;
        }

        .loadMoreBtn {
          margin: 14px auto 0;
          height: 40px;
          padding: 0 16px;
          border-radius: 12px;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bottomAnalyticsRow {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(290px, 360px);
          gap: 18px;
        }

        .salesHeader {
          align-items: flex-start;
        }

        .salesBigValue {
          margin-top: 8px;
          font-size: 18px;
          font-weight: 900;
          color: #111827;
        }

        .salesTrend {
          margin-top: 8px;
          font-size: 13px;
          color: #16a34a;
          font-weight: 900;
        }

        .rangeBtn {
          height: 36px;
          padding: 0 14px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #dbe2ea;
          color: #475569;
          font-size: 14px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .smallRange {
          height: 34px;
          font-size: 13px;
        }

        .chartWrap {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 8px;
          margin-top: 16px;
        }

        .chartYAxis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px 0 24px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .chartCanvas {
          min-width: 0;
        }

        .chartSvg {
          width: 100%;
          height: 240px;
          display: block;
        }

        .chartXAxis {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          text-align: center;
        }

        .topItemsList {
          display: grid;
          gap: 14px;
          margin-top: 16px;
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
        }

        .topItemLeft span {
          font-size: 14px;
          font-weight: 800;
          color: #111827;
        }

        .topItemRight span {
          font-size: 13px;
          color: #64748b;
          font-weight: 700;
        }

        .topItemRight strong {
          font-size: 14px;
          color: #111827;
          font-weight: 900;
          margin-left: 8px;
        }

        .analyticsLinkBtn {
          margin-top: 18px;
          width: 100%;
          height: 42px;
          border-radius: 12px;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #dbe2ea;
        }

        .storeLiveLine {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        .smallGreenDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
        }

        .miniStatusPanel {
          margin-top: 16px;
          border: 1px solid #e6ebf2;
          border-radius: 18px;
          padding: 16px;
          background: #ffffff;
        }

        .miniStatusHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .miniStatusHeader span {
          font-size: 16px;
          font-weight: 900;
          color: #111827;
        }

        .manageBtn {
          min-width: 72px;
          height: 32px;
          padding: 0 14px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #dbe2ea;
          color: #475569;
          font-size: 13px;
          font-weight: 900;
        }

        .miniStatusRows {
          display: grid;
          gap: 14px;
          margin-top: 16px;
        }

        .miniStatusRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 14px;
          color: #475569;
          font-weight: 700;
        }

        .greenText {
          color: #16a34a;
          font-weight: 900;
        }

        .mutedPill {
          color: #64748b;
          font-weight: 900;
        }

        .nextPayoutCard {
          margin-top: 14px;
          border: 1px solid #e6ebf2;
          border-radius: 18px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          background: #ffffff;
        }

        .nextPayoutLabel {
          font-size: 13px;
          color: #64748b;
          font-weight: 800;
        }

        .nextPayoutValue {
          margin-top: 6px;
          font-size: 18px;
          font-weight: 900;
        }

        .nextPayoutDate {
          min-width: 120px;
          height: 42px;
          padding: 0 14px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e6ebf2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 13px;
          font-weight: 900;
          text-align: center;
        }

        .promoCard {
          border-radius: 22px;
          padding: 18px;
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: 14px;
          align-items: center;
          background:
            radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 35%),
            linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%);
        }

        .promoTitle {
          font-size: 18px;
          font-weight: 900;
          color: #111827;
        }

        .promoSub {
          margin-top: 8px;
          font-size: 14px;
          line-height: 1.45;
          color: #475569;
          font-weight: 700;
        }

        .promoBtn {
          margin-top: 14px;
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
        }

        .promoArt {
          font-size: 58px;
          text-align: center;
        }

        .quickGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }

        .quickCard {
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #e6ebf2;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .quickIcon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 20px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .greenBg { background: #dcfce7; color: #16a34a; }
        .redBg { background: #fee2e2; color: #ef4444; }
        .blueBg { background: #dbeafe; color: #2563eb; }
        .grayBg { background: #e5e7eb; color: #475569; }

        .quickTitle {
          font-size: 14px;
          font-weight: 900;
          color: #111827;
        }

        .quickSub {
          margin-top: 4px;
          font-size: 13px;
          color: #64748b;
          font-weight: 700;
        }

        .storefrontSub {
          margin-top: 8px;
          font-size: 14px;
          color: #64748b;
          font-weight: 700;
        }

        .storefrontLinkBox {
          margin-top: 16px;
          min-height: 48px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #dbe2ea;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 12px 0 14px;
        }

        .storefrontLinkBox span {
          font-size: 14px;
          color: #111827;
          font-weight: 800;
          word-break: break-word;
        }

        .copyIconBtn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #dbe2ea;
          color: #475569;
          font-size: 15px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .storefrontOpenBtn {
          width: 100%;
          margin-top: 16px;
        }

        @media (max-width: 1260px) {
          .dashboardShell {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: relative;
            top: 0;
            height: auto;
          }

          .contentGrid,
          .bottomAnalyticsRow {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 980px) {
          .kpiGrid {
            grid-template-columns: 1fr 1fr;
          }

          .topBar {
            flex-direction: column;
            align-items: stretch;
          }

          .topBarRight {
            justify-content: stretch;
          }

          .searchWrap {
            width: 100%;
          }

          .orderRow {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 14px;
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
        }

        @media (max-width: 640px) {
          .dashboardShell {
            width: min(100vw - 14px, 1500px);
            margin: 7px auto;
          }

          .kpiGrid,
          .quickGrid {
            grid-template-columns: 1fr;
          }

          .kpiCard {
            grid-template-columns: 54px 1fr;
          }

          .miniSpark,
          .miniSignal {
            display: none;
          }

          .promoCard {
            grid-template-columns: 1fr;
          }

          .topBar h1 {
            font-size: 28px;
          }

          .sidebar {
            padding: 14px;
          }

          .mainArea {
            gap: 14px;
          }
        }
      `}</style>
    </main>
  );
}