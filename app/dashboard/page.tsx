'use client';

import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type RangeKey = 'week' | 'lastWeek' | 'month' | 'lastMonth';
type OrderFilter = 'ALL' | 'NEW' | 'YELLOW' | 'GREEN';
type OrderLanguage = 'EN' | 'ES';

type RestaurantRecord = {
  id: string;
  name: string | null;
  slug: string | null;
  owner_id?: string | null;
  user_id?: string | null;
  theme?: string | null;
  owner_order_language?: string | null;
  order_language?: string | null;
  stripe_account_id?: string | null;
  stripe_connected?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
};

type OrderRow = {
  id: string;
  created_at: string;
  total?: number | string | null;
  amount_total?: number | string | null;
  status?: string | null;
  customer_name?: string | null;
  customer?: string | null;
  summary?: string | null;
  items_summary?: string | null;
  line_items_summary?: string | null;
};

type MenuRow = {
  id: string;
};

type ProfileRow = {
  name?: string | null;
  full_name?: string | null;
  business_name?: string | null;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function currency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function safeNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatTime(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function statusTone(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return 'red';
  if (s.includes('ready')) return 'yellow';
  if (s.includes('prepar') || s.includes('new') || s.includes('pending')) return 'green';
  if (s.includes('complete')) return 'green';
  return 'neutral';
}

function displayStatus(status?: string | null) {
  if (!status) return 'New';
  const s = status.toLowerCase();
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('ready')) return 'Almost Ready';
  if (s.includes('prepar')) return 'Preparing';
  if (s.includes('complete')) return 'Completed';
  if (s.includes('new')) return 'New';
  return status;
}

function filterOrders(list: OrderRow[], filter: OrderFilter) {
  if (filter === 'ALL') return list;
  if (filter === 'NEW') {
    return list.filter((item) => {
      const s = displayStatus(item.status).toLowerCase();
      return s === 'new' || s === 'preparing';
    });
  }
  if (filter === 'YELLOW') {
    return list.filter((item) => statusTone(item.status) === 'yellow');
  }
  if (filter === 'GREEN') {
    return list.filter((item) => statusTone(item.status) === 'green');
  }
  return list;
}

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="tooltipCard">
      <div className="tooltipValue">{currency(payload[0].value)}</div>
      <div className="tooltipLabel">{label}</div>

      <style jsx>{`
        .tooltipCard {
          background: #66c8c6;
          color: #fff;
          border-radius: 12px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 0 14px 28px rgba(60, 91, 111, 0.16);
        }

        .tooltipValue {
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1;
        }

        .tooltipLabel {
          margin-top: 4px;
          font-size: 0.78rem;
          opacity: 0.96;
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('Owner');
  const [restaurant, setRestaurant] = useState<RestaurantRecord | null>(null);
  const [menuCount, setMenuCount] = useState(0);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [range, setRange] = useState<RangeKey>('week');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('ALL');
  const [billingFilter, setBillingFilter] = useState<OrderFilter>('ALL');
  const [orderLanguage, setOrderLanguage] = useState<OrderLanguage>('EN');
  const [savingLanguage, setSavingLanguage] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, full_name, business_name')
        .eq('id', user.id)
        .maybeSingle();

      const profileRow = profile as ProfileRow | null;
      const welcomeName =
        profileRow?.business_name ||
        profileRow?.name ||
        profileRow?.full_name ||
        'Owner';

      const { data: restaurantByOwner } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      const { data: restaurantByUser } =
        restaurantByOwner
          ? { data: null }
          : await supabase
              .from('restaurants')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

      const currentRestaurant = (restaurantByOwner || restaurantByUser) as RestaurantRecord | null;

      let currentOrders: OrderRow[] = [];
      let currentMenuCount = 0;

      if (currentRestaurant?.id) {
        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('id')
          .eq('restaurant_id', currentRestaurant.id);

        currentMenuCount = (menuItems as MenuRow[] | null)?.length || 0;

        const { data: orderRows } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', currentRestaurant.id)
          .order('created_at', { ascending: false });

        currentOrders = (orderRows as OrderRow[] | null) || [];
      }

      if (mounted) {
        setOwnerName(welcomeName);
        setRestaurant(currentRestaurant);
        setMenuCount(currentMenuCount);
        setOrders(currentOrders);
        const savedLang =
          (currentRestaurant?.owner_order_language ||
            currentRestaurant?.order_language ||
            'en')
            .toString()
            .toUpperCase() === 'ES'
            ? 'ES'
            : 'EN';
        setOrderLanguage(savedLang);
        setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const storeHref = useMemo(() => {
    if (restaurant?.slug) return `/store/${restaurant.slug}`;
    return '/dashboard/owner/builder';
  }, [restaurant?.slug]);

  const salesOverview = useMemo(() => {
    const today = startOfDay(new Date());

    const currentWeekStart = addDays(today, -6);
    const previousWeekStart = addDays(today, -13);
    const previousWeekEnd = addDays(today, -7);

    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    let todaySales = 0;
    let todayOrders = 0;
    let weekSales = 0;
    let prevWeekSales = 0;
    let monthSales = 0;
    let prevMonthSales = 0;

    const weekMap = new Map<string, number>();
    const prevWeekMap = new Map<string, number>();

    const monthWeekMap = new Map<string, number>([
      ['W1', 0],
      ['W2', 0],
      ['W3', 0],
      ['W4', 0],
      ['W5', 0],
    ]);
    const prevMonthWeekMap = new Map<string, number>([
      ['W1', 0],
      ['W2', 0],
      ['W3', 0],
      ['W4', 0],
      ['W5', 0],
    ]);

    for (let i = 0; i < 7; i += 1) {
      const d = addDays(currentWeekStart, i);
      weekMap.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, 0);
    }

    for (let i = 0; i < 7; i += 1) {
      const d = addDays(previousWeekStart, i);
      prevWeekMap.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, 0);
    }

    orders.forEach((order) => {
      const amount = safeNumber(order.total ?? order.amount_total ?? 0);
      const created = order.created_at ? new Date(order.created_at) : null;
      if (!created || Number.isNaN(created.getTime())) return;

      const createdDay = startOfDay(created);

      if (createdDay.getTime() === today.getTime()) {
        todaySales += amount;
        todayOrders += 1;
      }

      if (createdDay >= currentWeekStart && createdDay <= today) {
        weekSales += amount;
        const key = `${createdDay.getFullYear()}-${createdDay.getMonth()}-${createdDay.getDate()}`;
        weekMap.set(key, (weekMap.get(key) || 0) + amount);
      }

      if (createdDay >= previousWeekStart && createdDay <= previousWeekEnd) {
        prevWeekSales += amount;
        const key = `${createdDay.getFullYear()}-${createdDay.getMonth()}-${createdDay.getDate()}`;
        prevWeekMap.set(key, (prevWeekMap.get(key) || 0) + amount);
      }

      if (createdDay >= currentMonthStart && createdDay <= today) {
        monthSales += amount;
        const weekIndex = Math.min(5, Math.ceil(createdDay.getDate() / 7));
        monthWeekMap.set(`W${weekIndex}`, (monthWeekMap.get(`W${weekIndex}`) || 0) + amount);
      }

      if (createdDay >= previousMonthStart && createdDay <= previousMonthEnd) {
        prevMonthSales += amount;
        const weekIndex = Math.min(5, Math.ceil(createdDay.getDate() / 7));
        prevMonthWeekMap.set(`W${weekIndex}`, (prevMonthWeekMap.get(`W${weekIndex}`) || 0) + amount);
      }
    });

    const weekData = Array.from({ length: 7 }).map((_, index) => {
      const d = addDays(currentWeekStart, index);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      return {
        day: DAY_LABELS[d.getDay()],
        value: weekMap.get(key) || 0,
      };
    });

    const lastWeekData = Array.from({ length: 7 }).map((_, index) => {
      const d = addDays(previousWeekStart, index);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      return {
        day: DAY_LABELS[d.getDay()],
        value: prevWeekMap.get(key) || 0,
      };
    });

    const monthData = ['W1', 'W2', 'W3', 'W4', 'W5'].map((label) => ({
      day: label,
      value: monthWeekMap.get(label) || 0,
    }));

    const lastMonthData = ['W1', 'W2', 'W3', 'W4', 'W5'].map((label) => ({
      day: label,
      value: prevMonthWeekMap.get(label) || 0,
    }));

    const revenueChange =
      prevWeekSales <= 0
        ? weekSales > 0
          ? 100
          : 0
        : ((weekSales - prevWeekSales) / prevWeekSales) * 100;

    return {
      todaySales,
      todayOrders,
      weekSales,
      prevWeekSales,
      monthSales,
      prevMonthSales,
      revenueChange,
      weekData,
      lastWeekData,
      monthData,
      lastMonthData,
    };
  }, [orders]);

  const chartData = useMemo(() => {
    if (range === 'week') return salesOverview.weekData;
    if (range === 'lastWeek') return salesOverview.lastWeekData;
    if (range === 'month') return salesOverview.monthData;
    return salesOverview.lastMonthData;
  }, [range, salesOverview]);

  const liveOrders = useMemo(
    () =>
      orders.filter((item) => {
        const status = displayStatus(item.status).toLowerCase();
        return status !== 'cancelled' && status !== 'completed';
      }),
    [orders],
  );

  const billingOrders = useMemo(
    () =>
      orders.filter((item) => {
        const status = displayStatus(item.status).toLowerCase();
        return status === 'cancelled' || status === 'completed' || status === 'new' || status === 'preparing';
      }),
    [orders],
  );

  const cancelledOrders = useMemo(
    () =>
      orders.filter((item) => displayStatus(item.status).toLowerCase() === 'cancelled'),
    [orders],
  );

  const filteredLiveOrders = useMemo(
    () => filterOrders(liveOrders, orderFilter).slice(0, 6),
    [liveOrders, orderFilter],
  );

  const filteredBillingOrders = useMemo(
    () => filterOrders(billingOrders, billingFilter).slice(0, 4),
    [billingOrders, billingFilter],
  );

  const stripeConnected =
    !!restaurant?.stripe_connected ||
    !!restaurant?.stripe_charges_enabled ||
    !!restaurant?.stripe_payouts_enabled ||
    !!restaurant?.stripe_account_id;

  async function saveOrderLanguage(nextLanguage: OrderLanguage) {
    if (!restaurant?.id) {
      setOrderLanguage(nextLanguage);
      return;
    }

    setOrderLanguage(nextLanguage);
    setSavingLanguage(true);

    const lower = nextLanguage.toLowerCase();

    const firstTry = await supabase
      .from('restaurants')
      .update({ owner_order_language: lower })
      .eq('id', restaurant.id);

    if (firstTry.error) {
      await supabase
        .from('restaurants')
        .update({ order_language: lower })
        .eq('id', restaurant.id);
    }

    setSavingLanguage(false);
  }

  return (
    <div className="pageShell">
      <aside className="sidebar">
        <div className="brandCard">
          <div className="brandMark">M</div>
          <div className="brandName">MenuFlow</div>
        </div>

        <div className="sidebarDivider" />

        <nav className="sidebarNav">
          <Link href="/dashboard" className="navItem navItemActive">
            <NavIcon />
            <span>Dashboard</span>
          </Link>

          <Link href="/dashboard/orders" className="navItem">
            <OrdersIcon />
            <span>Live Orders</span>
          </Link>

          <Link href="/dashboard/owner/builder" className="navItem">
            <BuilderIcon />
            <span>Menu Builder</span>
          </Link>

          <Link href="/dashboard/payments" className="navItem">
            <PaymentsIcon />
            <span>Payments</span>
          </Link>

          <Link href="/dashboard/owner-info" className="navItem">
            <OwnerIcon />
            <span>Owner Info</span>
          </Link>

          <Link href="/dashboard/settings" className="navItem">
            <SettingsIcon />
            <span>Store Settings</span>
          </Link>
        </nav>

        <div className="sidebarFooter">
          <Link href={storeHref} className="storefrontButton">
            <StorefrontIcon />
            <span>Open Storefront</span>
          </Link>
        </div>
      </aside>

      <main className="mainArea">
        <header className="desktopTopbar">
          <div className="topbarLeft">
            <div className="ownerControlBlock">
              <div className="ownerControlLabel">Owner Control</div>
              <div className="ownerWelcome">
                Welcome back, {ownerName}
              </div>
            </div>
          </div>

          <div className="topbarRight">
            <label className="languageControl">
              <span className="languageLabel">Order Language</span>
              <select
                className="languageSelect"
                value={orderLanguage}
                onChange={(e) => saveOrderLanguage(e.target.value as OrderLanguage)}
                disabled={savingLanguage}
              >
                <option value="EN">English</option>
                <option value="ES">Spanish</option>
              </select>
            </label>

            <label className="searchField" htmlFor="dashboard-search">
              <SearchIcon />
              <input id="dashboard-search" type="text" placeholder="Search" />
            </label>

            <Link href="/dashboard/owner/builder" className="topActionButton">
              Open Builder
            </Link>
            <Link href={storeHref} className="topActionButton">
              View Store
            </Link>
          </div>
        </header>

        <div className="contentGrid">
          <section className="desktopOnly">
            <div className="overviewHeading">
              <h1>Overview</h1>
              <p>Quick Actions</p>
            </div>

            <div className="statsRow">
              <StatCard title="Today's Sales" value={currency(salesOverview.todaySales)} />
              <StatCard title="Today's Orders" value={`${salesOverview.todayOrders}`} />
              <StatCard title="Menu Items" value={`${menuCount}`} />
              <StatCard
                title="Revenue Trend"
                value={`${Math.abs(salesOverview.revenueChange).toFixed(1)}%`}
                accent="trend"
                prefix={salesOverview.revenueChange >= 0 ? '↑' : '↓'}
                suffix="This Week"
              />
            </div>

            <section className="card chartCard">
              <div className="cardHeader chartHeader">
                <h2>Sales Overview</h2>

                <div className="tabGroup" aria-label="Chart range">
                  <button
                    type="button"
                    className={range === 'week' ? 'tabButton tabButtonActive' : 'tabButton'}
                    onClick={() => setRange('week')}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    className={range === 'lastWeek' ? 'tabButton tabButtonActive' : 'tabButton'}
                    onClick={() => setRange('lastWeek')}
                  >
                    Last Week
                  </button>
                  <button
                    type="button"
                    className={range === 'month' ? 'tabButton tabButtonActive' : 'tabButton'}
                    onClick={() => setRange('month')}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    className={range === 'lastMonth' ? 'tabButton tabButtonActive' : 'tabButton'}
                    onClick={() => setRange('lastMonth')}
                  >
                    Last Month
                  </button>
                </div>
              </div>

              <div className="chartWrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 14, right: 16, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFillDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#84d7d2" stopOpacity={0.34} />
                        <stop offset="100%" stopColor="#84d7d2" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid vertical={false} stroke="#edf0f4" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#7e8897', fontSize: 13 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#9aa4b0', fontSize: 12 }}
                      tickFormatter={(value: number) => `$${value}`}
                      width={48}
                    />
                    <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#d7e4e6', strokeDasharray: '4 4' }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#63c9c6"
                      strokeWidth={3}
                      fill="url(#revenueFillDesktop)"
                      dot={{ stroke: '#9adfdc', fill: '#ffffff', r: 4, strokeWidth: 2 }}
                      activeDot={{ fill: '#63c9c6', stroke: '#ffffff', r: 6, strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="bottomGrid">
              <section className="card">
                <div className="cardHeader">
                  <h2>Live Orders</h2>
                  <button type="button" className="viewAllButton">
                    View All
                  </button>
                </div>

                <div className="filterRow">
                  {([
                    { key: 'ALL', label: 'All' },
                    { key: 'NEW', label: 'New' },
                    { key: 'YELLOW', label: 'Yellow' },
                    { key: 'GREEN', label: 'Green' },
                  ] as const).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={orderFilter === item.key ? 'filterButton filterButtonActive' : 'filterButton'}
                      onClick={() => setOrderFilter(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="orderList">
                  {filteredLiveOrders.length ? (
                    filteredLiveOrders.map((order) => <OrderCard key={order.id} order={order} />)
                  ) : (
                    <EmptyState text="No live orders yet" />
                  )}
                </div>

                <div className="panelFooter">
                  <Link href="/dashboard/orders" className="viewAllButton">
                    View All
                  </Link>
                </div>
              </section>

              <section className="card">
                <div className="cardHeader">
                  <h2>Billing</h2>
                </div>

                <div className="filterRow">
                  {([
                    { key: 'ALL', label: 'All' },
                    { key: 'NEW', label: 'New' },
                    { key: 'YELLOW', label: 'Yellow' },
                    { key: 'GREEN', label: 'Green' },
                  ] as const).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={billingFilter === item.key ? 'filterButton filterButtonActive' : 'filterButton'}
                      onClick={() => setBillingFilter(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="billingStatusBlock">
                  <h3>Stripe Status</h3>
                  <div className="connectedRow">
                    <div className={`connectedPill ${stripeConnected ? '' : 'connectedPillMuted'}`}>
                      <span className="connectedDot" />
                      {stripeConnected ? 'Connected' : 'Incomplete'}
                    </div>
                    <div className={`connectedPill ${restaurant?.stripe_payouts_enabled ? '' : 'connectedPillMuted'}`}>
                      <span className="connectedDot" />
                      {restaurant?.stripe_payouts_enabled ? 'Payouts enabled' : 'Payouts incomplete'}
                    </div>
                  </div>
                </div>

                <div className="orderList">
                  {filteredBillingOrders.length ? (
                    filteredBillingOrders.map((order) => <OrderCard key={order.id} order={order} />)
                  ) : (
                    <EmptyState text="No billing activity yet" />
                  )}
                </div>
              </section>
            </div>

            <section className="card cancelledCard">
              <div className="cardHeader">
                <h2>Cancelled Orders</h2>
              </div>

              <div className="orderList">
                {cancelledOrders.length ? (
                  cancelledOrders.slice(0, 4).map((order) => <OrderCard key={order.id} order={order} />)
                ) : (
                  <EmptyState text="No cancelled orders" />
                )}
              </div>
            </section>
          </section>

          <section className="mobileOnly">
            <header className="mobileHeader">
              <div className="mobileHeaderTop">
                <button className="iconButton" type="button" aria-label="Menu">
                  <MenuIcon />
                </button>

                <div className="mobileBrand">
                  <div className="mobileBrandMark">M</div>
                  <span>MenuFlow</span>
                </div>

                <button className="iconButton" type="button" aria-label="Notifications">
                  <BellIcon />
                </button>
              </div>
            </header>

            <div className="mobileGreetingCard">
              <div className="mobileGreetingLabel">Owner Control</div>
              <div className="mobileGreetingName">Welcome back, {ownerName}</div>
            </div>

            <div className="mobileControlBar">
              <label className="mobileLanguageControl">
                <span>Order Language</span>
                <select
                  className="languageSelect mobileSelect"
                  value={orderLanguage}
                  onChange={(e) => saveOrderLanguage(e.target.value as OrderLanguage)}
                  disabled={savingLanguage}
                >
                  <option value="EN">English</option>
                  <option value="ES">Spanish</option>
                </select>
              </label>

              <div className="mobileTopButtons">
                <Link href="/dashboard/owner/builder" className="mobileActionButton">
                  Open Builder
                </Link>
                <Link href={storeHref} className="mobileActionButton">
                  View Store
                </Link>
              </div>
            </div>

            <div className="mobileOverviewHeading">
              <h1>Overview</h1>
            </div>

            <div className="mobileSalesCard mobileCard">
              <div className="mobileSalesTop">
                <div className="mobileLabel">Today&apos;s Sales</div>
                <div className="mobileValue">{currency(salesOverview.todaySales)}</div>
              </div>

              <div className="mobileSalesSubtle">
                <span className="tinyDot" />
                This Week
              </div>
            </div>

            <div className="mobileMiniStats">
              <div className="mobileMiniCard">
                <div className="mobileLabel">Today&apos;s Orders</div>
                <div className="mobileMiniValue">{salesOverview.todayOrders}</div>
              </div>

              <div className="mobileMiniCard">
                <div className="mobileLabel">Menu</div>
                <div className="mobileMiniValue">{menuCount}</div>
              </div>
            </div>

            <div className="mobileRevenueCard mobileCard">
              <div className="mobileRevenueTop">
                <div className="mobileLabel">Revenue</div>
                <div className="mobileValue">{currency(salesOverview.weekSales)}</div>
              </div>

              <div className="mobileRevenuePill">
                <span className="tinyDot tinyDotGreen" />
                {salesOverview.revenueChange >= 0 ? '+' : '-'}
                {Math.abs(salesOverview.revenueChange).toFixed(1)}%
              </div>
            </div>

            <section className="mobileGraphCard mobileCard">
              <div className="mobileGraphHeader">
                <h2>Sales Overview</h2>
                <button type="button" className="mobileGraphTab">
                  This Week
                </button>
              </div>

              <div className="mobileChartWrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesOverview.weekData} margin={{ top: 10, right: 0, left: -26, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFillMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#84d7d2" stopOpacity={0.34} />
                        <stop offset="100%" stopColor="#84d7d2" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid vertical={false} stroke="#edf0f4" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#7e8897', fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#d7e4e6', strokeDasharray: '4 4' }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#63c9c6"
                      strokeWidth={3}
                      fill="url(#revenueFillMobile)"
                      dot={{ stroke: '#9adfdc', fill: '#ffffff', r: 4, strokeWidth: 2 }}
                      activeDot={{ fill: '#63c9c6', stroke: '#ffffff', r: 6, strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="mobileCard">
              <div className="mobileCardHeader">
                <span>Live Orders</span>
                <Link href="/dashboard/orders" className="mobileViewAll">
                  View All
                </Link>
              </div>

              {liveOrders.length ? (
                liveOrders.slice(0, 4).map((order) => (
                  <MobileOrderCard key={`mobile-${order.id}`} order={order} />
                ))
              ) : (
                <EmptyState text="No live orders yet" />
              )}
            </section>

            <section className="mobileCard">
              <div className="mobileCardHeader">
                <span>Billing</span>
              </div>

              <div className="mobileBillingStatus">Stripe Status</div>

              <div className="mobileConnectedRow">
                <div className={`connectedPill ${stripeConnected ? '' : 'connectedPillMuted'}`}>
                  <span className="connectedDot" />
                  {stripeConnected ? 'Connected' : 'Incomplete'}
                </div>
                <div className={`connectedPill ${restaurant?.stripe_payouts_enabled ? '' : 'connectedPillMuted'}`}>
                  <span className="connectedDot" />
                  {restaurant?.stripe_payouts_enabled ? 'Payouts enabled' : 'Payouts incomplete'}
                </div>
              </div>

              {billingOrders.length ? (
                billingOrders.slice(0, 3).map((order) => (
                  <MobileOrderCard key={`mobile-billing-${order.id}`} order={order} />
                ))
              ) : (
                <EmptyState text="No billing activity yet" />
              )}
            </section>

            <section className="mobileCard">
              <div className="mobileCardHeader">
                <span>Cancelled Orders</span>
              </div>

              {cancelledOrders.length ? (
                cancelledOrders.slice(0, 3).map((order) => (
                  <MobileOrderCard key={`mobile-cancelled-${order.id}`} order={order} />
                ))
              ) : (
                <EmptyState text="No cancelled orders" />
              )}
            </section>
          </section>
        </div>

        {loading ? <div className="loadingOverlay">Loading dashboard…</div> : null}
      </main>

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          padding: 0;
          background: #efeff2;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          color: #111827;
        }

        :global(*) {
          box-sizing: border-box;
        }

        :global(a) {
          text-decoration: none;
          color: inherit;
        }

        .pageShell {
          min-height: 100vh;
          background: radial-gradient(circle at top, rgba(255, 255, 255, 0.86), rgba(240, 241, 244, 0.94));
          padding: 28px;
        }

        .sidebar {
          position: fixed;
          top: 36px;
          left: 36px;
          bottom: 36px;
          width: 212px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px);
          border: 1px solid #e8ebef;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(20, 23, 28, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .brandCard {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 22px 20px 18px;
        }

        .brandMark,
        .mobileBrandMark {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: #0f172a;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.05rem;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
          flex-shrink: 0;
        }

        .brandName {
          font-size: 1.08rem;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }

        .sidebarDivider {
          height: 1px;
          background: #edf0f3;
        }

        .sidebarNav {
          padding: 16px 12px;
          display: grid;
          gap: 6px;
        }

        .navItem {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          padding: 0 14px;
          border-radius: 14px;
          color: #4b5563;
          font-size: 1rem;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .navItem:hover {
          background: #f8fafb;
        }

        .navItemActive {
          background: #f1f4f7;
          color: #111827;
          box-shadow: inset 1px 0 0 #111827;
        }

        .sidebarFooter {
          margin-top: auto;
          padding: 14px;
        }

        .storefrontButton {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 52px;
          border: 1px solid #e8ebef;
          border-radius: 16px;
          background: #fff;
          color: #365f6f;
          font-weight: 600;
          box-shadow: 0 12px 26px rgba(20, 23, 28, 0.04);
        }

        .mainArea {
          position: relative;
          margin-left: 236px;
          padding-left: 24px;
        }

        .desktopTopbar {
          min-height: 84px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e8ebef;
          border-radius: 24px 24px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          box-shadow: 0 10px 30px rgba(20, 23, 28, 0.04);
          gap: 18px;
        }

        .topbarLeft,
        .topbarRight {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topbarRight {
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .ownerControlBlock {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ownerControlLabel {
          font-size: 0.92rem;
          color: #727b89;
          font-weight: 600;
        }

        .ownerWelcome {
          font-size: 2rem;
          line-height: 1;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.04em;
        }

        .languageControl {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .languageLabel {
          font-size: 0.82rem;
          color: #6d7684;
          font-weight: 600;
        }

        .languageSelect {
          min-width: 168px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid #e5e9ee;
          background: #fff;
          padding: 0 14px;
          font: inherit;
          color: #111827;
          outline: none;
          box-shadow: 0 8px 20px rgba(20, 23, 28, 0.03);
        }

        .searchField {
          height: 42px;
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          background: #fff;
          border: 1px solid #e5e9ee;
          border-radius: 12px;
          color: #9aa3af;
        }

        .searchField input {
          border: 0;
          outline: 0;
          width: 100%;
          font: inherit;
          background: transparent;
          color: #111827;
        }

        .searchField input::placeholder {
          color: #9aa3af;
        }

        .topActionButton,
        .mobileActionButton,
        .viewAllButton,
        .mobileViewAll,
        .tabButton,
        .filterButton,
        .iconButton,
        .mobileGraphTab {
          border: 0;
          background: transparent;
          cursor: pointer;
          font: inherit;
        }

        .topActionButton,
        .mobileActionButton {
          height: 42px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e9ee;
          border-radius: 12px;
          background: #fff;
          color: #111827;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(20, 23, 28, 0.03);
          white-space: nowrap;
        }

        .contentGrid {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid #e8ebef;
          border-top: 0;
          border-radius: 0 0 24px 24px;
          padding: 18px;
          box-shadow: 0 20px 60px rgba(20, 23, 28, 0.04);
        }

        .overviewHeading {
          margin-bottom: 14px;
        }

        .overviewHeading h1,
        .cardHeader h2,
        .mobileOverviewHeading h1,
        .mobileCardHeader span,
        .mobileGraphHeader h2 {
          margin: 0;
          color: #111827;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .overviewHeading h1 {
          font-size: 2rem;
          line-height: 1;
        }

        .overviewHeading p {
          margin: 6px 0 0;
          color: #7b8492;
          font-size: 0.96rem;
        }

        .statsRow {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .card,
        .mobileCard,
        .mobileGreetingCard,
        .mobileControlBar,
        .mobileMiniCard {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e8ebef;
          border-radius: 18px;
          box-shadow: 0 14px 34px rgba(20, 23, 28, 0.04);
        }

        .card {
          padding: 16px;
        }

        .chartCard {
          padding: 14px 16px 12px;
        }

        .cardHeader,
        .mobileCardHeader,
        .mobileGraphHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .cardHeader {
          margin-bottom: 12px;
        }

        .cardHeader h2 {
          font-size: 1.18rem;
        }

        .chartHeader {
          margin-bottom: 6px;
        }

        .tabGroup,
        .filterRow {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tabButton,
        .filterButton,
        .viewAllButton,
        .mobileViewAll,
        .mobileGraphTab {
          min-height: 36px;
          padding: 0 14px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #e8ebef;
          color: #6b7280;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .tabButtonActive,
        .filterButtonActive {
          background: #eff6f5;
          color: #4f7f7e;
          border-color: #dce9e8;
        }

        .chartWrap {
          height: 280px;
          width: 100%;
        }

        .bottomGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: 14px;
          margin-top: 14px;
        }

        .orderList {
          display: grid;
          gap: 12px;
        }

        .billingStatusBlock h3,
        .mobileBillingStatus {
          margin: 0 0 12px;
          color: #111827;
          font-size: 1rem;
          font-weight: 700;
        }

        .connectedRow,
        .mobileConnectedRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .connectedPill {
          min-height: 38px;
          padding: 0 14px;
          border-radius: 12px;
          background: #f5fbfb;
          border: 1px solid #dfeded;
          color: #4f7f7e;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .connectedPillMuted {
          background: #f6f7f9;
          border-color: #e5e8ed;
          color: #7b8594;
        }

        .connectedDot,
        .tinyDot,
        .tinyDotGreen {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          display: inline-block;
          background: #9bc8c7;
        }

        .tinyDotGreen {
          background: #76c9a0;
        }

        .cancelledCard {
          margin-top: 14px;
        }

        .panelFooter {
          margin-top: 10px;
          display: flex;
          justify-content: flex-end;
        }

        .desktopOnly {
          display: block;
        }

        .mobileOnly {
          display: none;
        }

        .mobileHeader {
          margin-bottom: 14px;
        }

        .mobileHeaderTop {
          height: 74px;
          padding: 0 16px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e8ebef;
          box-shadow: 0 12px 30px rgba(20, 23, 28, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .iconButton {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #fff;
          border: 1px solid #e8ebef;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #111827;
          box-shadow: 0 8px 20px rgba(20, 23, 28, 0.03);
        }

        .mobileBrand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 1.25rem;
          color: #111827;
          letter-spacing: -0.03em;
        }

        .mobileGreetingCard,
        .mobileControlBar {
          padding: 16px;
          margin-bottom: 12px;
        }

        .mobileGreetingLabel {
          font-size: 0.9rem;
          color: #757e8c;
          font-weight: 600;
        }

        .mobileGreetingName {
          margin-top: 6px;
          font-size: 1.75rem;
          line-height: 1.08;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.04em;
        }

        .mobileLanguageControl {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
          color: #6d7684;
          font-size: 0.86rem;
          font-weight: 600;
        }

        .mobileSelect {
          width: 100%;
          box-shadow: none;
        }

        .mobileTopButtons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .mobileOverviewHeading {
          margin-bottom: 12px;
        }

        .mobileOverviewHeading h1 {
          font-size: 2rem;
          line-height: 1;
        }

        .mobileCard {
          padding: 16px;
        }

        .mobileSalesCard,
        .mobileRevenueCard,
        .mobileGraphCard {
          margin-bottom: 12px;
        }

        .mobileSalesTop,
        .mobileRevenueTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .mobileMiniStats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .mobileMiniCard {
          min-height: 118px;
          padding: 16px;
        }

        .mobileLabel {
          color: #5f6774;
          font-size: 0.98rem;
          font-weight: 500;
        }

        .mobileSalesSubtle {
          margin-top: 10px;
          color: #8a93a0;
          font-size: 0.86rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mobileValue {
          font-size: 2.05rem;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }

        .mobileMiniValue {
          margin-top: 22px;
          color: #111827;
          font-weight: 700;
          font-size: 2.15rem;
          line-height: 1;
        }

        .mobileRevenuePill {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          background: #edf5f2;
          color: #568d72;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .mobileGraphHeader {
          margin-bottom: 8px;
        }

        .mobileGraphHeader h2 {
          font-size: 1.12rem;
        }

        .mobileChartWrap {
          height: 220px;
          width: 100%;
        }

        .mobileOrderCard {
          border: 1px solid #e8ebef;
          border-radius: 16px;
          padding: 12px;
          background: #fff;
        }

        .mobileOrderCard + .mobileOrderCard {
          margin-top: 10px;
        }

        .mobileOrderTop,
        .mobileOrderBottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .mobileOrderId {
          color: #3a404a;
          font-weight: 700;
          font-size: 0.96rem;
        }

        .mobileOrderAmount {
          color: #111827;
          font-weight: 800;
          font-size: 1rem;
        }

        .mobileOrderMiddle {
          margin: 8px 0 12px;
        }

        .mobileOrderCustomer {
          color: #111827;
          font-weight: 700;
          font-size: 1rem;
        }

        .mobileOrderSummary {
          margin-top: 5px;
          color: #68727f;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .mobileOrderTime {
          color: #7f8795;
          font-size: 0.86rem;
        }

        .loadingOverlay {
          position: fixed;
          right: 18px;
          bottom: 18px;
          background: rgba(17, 24, 39, 0.92);
          color: #fff;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.92rem;
          font-weight: 600;
          box-shadow: 0 16px 30px rgba(17, 24, 39, 0.2);
        }

        @media (max-width: 1180px) {
          .pageShell {
            padding: 18px;
          }

          .sidebar {
            width: 196px;
            left: 18px;
            top: 18px;
            bottom: 18px;
          }

          .mainArea {
            margin-left: 214px;
            padding-left: 18px;
          }

          .statsRow {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .pageShell {
            padding: 16px;
          }

          .sidebar,
          .desktopTopbar,
          .desktopOnly {
            display: none;
          }

          .mainArea {
            margin-left: 0;
            padding-left: 0;
          }

          .contentGrid {
            padding: 0;
            border: 0;
            background: transparent;
            box-shadow: none;
          }

          .mobileOnly {
            display: block;
          }
        }

        @media (max-width: 560px) {
          .pageShell {
            padding: 12px;
          }

          .mobileHeaderTop {
            height: 70px;
            padding: 0 12px;
          }

          .mobileBrand {
            font-size: 1.15rem;
            gap: 10px;
          }

          .mobileBrandMark {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            font-size: 1rem;
          }

          .mobileGreetingName {
            font-size: 1.55rem;
          }

          .mobileOverviewHeading h1 {
            font-size: 1.95rem;
          }

          .mobileValue {
            font-size: 1.9rem;
          }

          .mobileMiniValue {
            font-size: 2rem;
          }

          .mobileTopButtons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent,
  prefix,
  suffix,
}: {
  title: string;
  value: string;
  accent?: 'trend';
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="statCard">
      <div className="statTitle">{title}</div>

      <div className="statValueRow">
        {accent === 'trend' ? (
          <span className={`trendArrow ${prefix === '-' ? 'trendNegative' : ''}`}>
            {prefix === '-' ? '↓' : '↑'}
          </span>
        ) : null}
        <span className="statValue">
          {accent === 'trend' && prefix === '-' ? '-' : ''}
          {value}
        </span>
        {suffix ? <span className="statSuffix">{suffix}</span> : null}
      </div>

      <style jsx>{`
        .statCard {
          min-height: 92px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #e8ebef;
          border-radius: 18px;
          box-shadow: 0 14px 34px rgba(20, 23, 28, 0.04);
        }

        .statTitle {
          color: #5e6674;
          font-size: 0.98rem;
          font-weight: 500;
        }

        .statValueRow {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }

        .trendArrow {
          color: #66c7c4;
          font-size: 1.2rem;
          line-height: 1;
          transform: translateY(1px);
        }

        .trendNegative {
          color: #c98282;
        }

        .statValue {
          color: #111827;
          font-weight: 700;
          font-size: 1.2rem;
          letter-spacing: -0.02em;
        }

        .statSuffix {
          color: #606977;
          font-size: 0.96rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const customer = order.customer_name || order.customer || 'Customer';
  const summary =
    order.summary ||
    order.items_summary ||
    order.line_items_summary ||
    'Order received';
  const amount = currency(safeNumber(order.total ?? order.amount_total ?? 0));
  const status = displayStatus(order.status);

  return (
    <div className="orderCard">
      <div className="orderTop">
        <div className="orderLeft">
          <div className="orderIdLine">
            <span className="orderId">{order.id}</span>
            <span className="orderCustomer">{customer}</span>
          </div>
          <div className="orderSummary">{summary}</div>
        </div>

        <div className="orderRight">
          <div className="orderAmount">{amount}</div>
          <div className="orderTime">{formatTime(order.created_at)}</div>
        </div>
      </div>

      <div className="orderBottom">
        <span className={`statusPill ${getStatusClass(status)}`}>{status}</span>
      </div>

      <style jsx>{`
        .orderCard {
          border: 1px solid #e8ebef;
          border-radius: 16px;
          background: #fff;
          padding: 14px 14px 12px;
        }

        .orderTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .orderLeft {
          min-width: 0;
        }

        .orderIdLine {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }

        .orderId {
          color: #3a404a;
          font-weight: 700;
          font-size: 0.98rem;
        }

        .orderCustomer {
          color: #111827;
          font-weight: 700;
          font-size: 1.02rem;
        }

        .orderSummary {
          margin-top: 6px;
          color: #636c79;
          font-size: 0.95rem;
        }

        .orderRight {
          text-align: right;
          flex-shrink: 0;
        }

        .orderAmount {
          color: #111827;
          font-weight: 800;
          font-size: 1.06rem;
        }

        .orderTime {
          margin-top: 6px;
          color: #7f8795;
          font-size: 0.9rem;
        }

        .orderBottom {
          margin-top: 12px;
        }

        .statusPill {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 0.92rem;
          font-weight: 600;
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
      `}</style>
    </div>
  );
}

function MobileOrderCard({ order }: { order: OrderRow }) {
  const customer = order.customer_name || order.customer || 'Customer';
  const summary =
    order.summary ||
    order.items_summary ||
    order.line_items_summary ||
    'Order received';
  const amount = currency(safeNumber(order.total ?? order.amount_total ?? 0));
  const status = displayStatus(order.status);

  return (
    <div className="mobileOrderCard">
      <div className="mobileOrderTop">
        <div className="mobileOrderId">{order.id}</div>
        <div className="mobileOrderAmount">{amount}</div>
      </div>

      <div className="mobileOrderMiddle">
        <div className="mobileOrderCustomer">{customer}</div>
        <div className="mobileOrderSummary">{summary}</div>
      </div>

      <div className="mobileOrderBottom">
        <span className={`statusPill ${getStatusClass(status)}`}>{status}</span>
        <span className="mobileOrderTime">{formatTime(order.created_at)}</span>
      </div>

      <style jsx>{`
        .mobileOrderCard {
          border: 1px solid #e8ebef;
          border-radius: 16px;
          padding: 12px;
          background: #fff;
        }

        .mobileOrderCard + .mobileOrderCard {
          margin-top: 10px;
        }

        .mobileOrderTop,
        .mobileOrderBottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .mobileOrderId {
          color: #3a404a;
          font-weight: 700;
          font-size: 0.96rem;
        }

        .mobileOrderAmount {
          color: #111827;
          font-weight: 800;
          font-size: 1rem;
        }

        .mobileOrderMiddle {
          margin: 8px 0 12px;
        }

        .mobileOrderCustomer {
          color: #111827;
          font-weight: 700;
          font-size: 1rem;
        }

        .mobileOrderSummary {
          margin-top: 5px;
          color: #68727f;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .mobileOrderTime {
          color: #7f8795;
          font-size: 0.86rem;
        }

        .statusPill {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 0.92rem;
          font-weight: 600;
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
      `}</style>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="emptyState">
      {text}
      <style jsx>{`
        .emptyState {
          min-height: 92px;
          border: 1px solid #e8ebef;
          border-radius: 16px;
          background: #fff;
          color: #7b8594;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}

function NavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BuilderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 17.5V6.5A2.5 2.5 0 0 1 6.5 4h7L20 10.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 4v6.5H19" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 15.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PaymentsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v10M8.5 10.5H14a2 2 0 1 1 0 4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OwnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 12a7 7 0 0 0-.08-1l2-1.56-2-3.44-2.4.8a7.2 7.2 0 0 0-1.7-.98L14.5 3h-5l-.32 2.82c-.6.23-1.16.56-1.68.98l-2.42-.8-2 3.44L5.08 11a7 7 0 0 0 0 2l-2 1.56 2 3.44 2.42-.8c.52.42 1.08.75 1.68.98L9.5 21h5l.32-2.82c.6-.23 1.16-.56 1.68-.98l2.42.8 2-3.44-2-1.56c.05-.33.08-.66.08-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function StorefrontIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5h16v7A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 10.5 6.5 5h11L19 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 14.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18H9m9-1V11a6 6 0 1 0-12 0v6l-2 2h16l-2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}