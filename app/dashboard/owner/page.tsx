
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Lang = 'en' | 'es';
type OwnerOrderLanguage = 'en' | 'es';
type FilterKey = 'all' | 'new' | 'yellow' | 'green';
type RangeKey = 'week' | 'lastWeek' | 'month' | 'lastMonth';

type RestaurantRecord = {
  id: string;
  name: string | null;
  slug: string | null;
  plan: string | null;
  owner_email?: string | null;
  stripe_account_id?: string | null;
  theme?: string | null;
  owner_order_language?: string | null;
  order_language?: string | null;
};

type MenuItemRecord = {
  id: string;
  restaurant_id: string;
  name: string | null;
  price: number | string | null;
  description: string | null;
  image_url: string | null;
  created_at?: string | null;
};

type OrderRecord = {
  id: string;
  restaurant_id?: string | null;
  customer_name?: string | null;
  total?: number | string | null;
  status?: string | null;
  created_at?: string | null;
  items_summary?: string | null;
};

type StripeState = {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
};

type ChartPoint = {
  day: string;
  value: number;
};

const copy = {
  en: {
    ownerControl: 'Owner Control',
    welcome: 'Welcome back',
    overview: 'Overview',
    quickActions: 'Quick Actions',
    openBuilder: 'Open Builder',
    viewStore: 'View Store',
    dashboard: 'Dashboard',
    liveOrders: 'Live Orders',
    menuBuilder: 'Menu Builder',
    payments: 'Payments',
    ownerInfo: 'Owner Info',
    storeSettings: 'Store Settings',
    openStorefront: 'Open Storefront',
    todaySales: "Today's Sales",
    todayOrders: "Today's Orders",
    menuItems: 'Menu Items',
    revenueTrend: 'Revenue Trend',
    weekRevenue: 'Revenue This Week',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    salesOverview: 'Sales Overview',
    billing: 'Billing',
    cancelledOrders: 'Cancelled Orders',
    stripeStatus: 'Stripe Status',
    connected: 'Connected',
    incomplete: 'Incomplete',
    payoutsEnabled: 'Payouts enabled',
    payoutsIncomplete: 'Payouts incomplete',
    all: 'All',
    new: 'New',
    yellow: 'Yellow',
    green: 'Green',
    viewAll: 'View All',
    loading: 'Loading dashboard...',
    signOut: 'Sign Out',
    orderLanguage: 'Order Language',
    noLiveOrders: 'No live orders yet',
    noBilling: 'No billing activity yet',
    noCancelled: 'No cancelled orders',
  },
  es: {
    ownerControl: 'Control del dueño',
    welcome: 'Bienvenido de nuevo',
    overview: 'Resumen',
    quickActions: 'Acciones rápidas',
    openBuilder: 'Abrir Builder',
    viewStore: 'Ver tienda',
    dashboard: 'Dashboard',
    liveOrders: 'Pedidos activos',
    menuBuilder: 'Creador de menú',
    payments: 'Pagos',
    ownerInfo: 'Info del dueño',
    storeSettings: 'Configuración',
    openStorefront: 'Abrir tienda',
    todaySales: 'Ventas de hoy',
    todayOrders: 'Pedidos de hoy',
    menuItems: 'Productos',
    revenueTrend: 'Tendencia',
    weekRevenue: 'Ingresos de esta semana',
    thisWeek: 'Esta semana',
    lastWeek: 'Semana pasada',
    thisMonth: 'Este mes',
    lastMonth: 'Mes pasado',
    salesOverview: 'Resumen de ventas',
    billing: 'Facturación',
    cancelledOrders: 'Pedidos cancelados',
    stripeStatus: 'Estado de Stripe',
    connected: 'Conectado',
    incomplete: 'Incompleto',
    payoutsEnabled: 'Pagos habilitados',
    payoutsIncomplete: 'Pagos incompletos',
    all: 'Todo',
    new: 'Nuevo',
    yellow: 'Amarillo',
    green: 'Verde',
    viewAll: 'Ver todo',
    loading: 'Cargando dashboard...',
    signOut: 'Cerrar sesión',
    orderLanguage: 'Idioma de pedidos',
    noLiveOrders: 'Todavía no hay pedidos activos',
    noBilling: 'Todavía no hay actividad de facturación',
    noCancelled: 'No hay pedidos cancelados',
  },
} as const;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
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

function filterOrders(list: OrderRecord[], filter: FilterKey) {
  if (filter === 'all') return list;
  if (filter === 'new') {
    return list.filter((item) => {
      const s = displayStatus(item.status).toLowerCase();
      return s === 'new' || s === 'preparing';
    });
  }
  return list.filter((item) => parseStatusTone(item.status) === filter);
}

function RevenueTooltip(props: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  const { active, payload, label } = props;
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="tooltipCard">
      <div className="tooltipValue">{currency(safeNumber(payload[0]?.value ?? 0))}</div>
      <div className="tooltipLabel">{label}</div>

      <style jsx>{`
        .tooltipCard {
          background: #67c9c6;
          color: #fff;
          border-radius: 12px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.42);
          box-shadow: 0 14px 30px rgba(43, 77, 83, 0.18);
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

function StatCard(props: {
  title: string;
  value: string;
  accent?: 'trend';
  prefix?: string;
  suffix?: string;
}) {
  const { title, value, accent, prefix, suffix } = props;

  return (
    <div className="statCard">
      <div className="statTitle">{title}</div>
      <div className="statValueRow">
        {accent === 'trend' ? (
          <span className={`trendArrow ${prefix === '↓' ? 'trendNegative' : ''}`}>
            {prefix || '↑'}
          </span>
        ) : null}
        <span className="statValue">{value}</span>
        {suffix ? <span className="statSuffix">{suffix}</span> : null}
      </div>

      <style jsx>{`
        .statCard {
          min-height: 94px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e7eaef;
          border-radius: 18px;
          box-shadow: 0 14px 34px rgba(20, 23, 28, 0.04);
        }
        .statTitle {
          color: #5e6674;
          font-size: 0.96rem;
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
          color: #cf8686;
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

function EmptyState(props: { text: string }) {
  return (
    <div className="emptyState">
      {props.text}
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

function OrderCard({ order }: { order: OrderRecord }) {
  const customer = order.customer_name || 'Customer';
  const summary = order.items_summary || 'Order received';
  const amount = currency(safeNumber(order.total || 0));
  const status = displayStatus(order.status);
  const tone = parseStatusTone(order.status);

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
          <div className="orderTime">{shortTime(order.created_at)}</div>
        </div>
      </div>

      <div className="orderBottom">
        <span className={`statusPill status-${tone}`}>{status}</span>
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

function MobileOrderCard({ order }: { order: OrderRecord }) {
  const customer = order.customer_name || 'Customer';
  const summary = order.items_summary || 'Order received';
  const amount = currency(safeNumber(order.total || 0));
  const status = displayStatus(order.status);
  const tone = parseStatusTone(order.status);

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
        <span className={`statusPill status-${tone}`}>{status}</span>
        <span className="mobileOrderTime">{shortTime(order.created_at)}</span>
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

export default function DashboardPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>('en');
  const [orderLanguage, setOrderLanguage] = useState<OwnerOrderLanguage>('en');
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('Owner');
  const [restaurant, setRestaurant] = useState<RestaurantRecord | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [stripe, setStripe] = useState<StripeState>({
    connected: false,
    onboardingComplete: false,
    chargesEnabled: false,
    payoutsEnabled: false,
  });
  const [liveFilter, setLiveFilter] = useState<FilterKey>('all');
  const [billingFilter, setBillingFilter] = useState<FilterKey>('all');
  const [range, setRange] = useState<RangeKey>('week');
  const [savingLanguage, setSavingLanguage] = useState(false);

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

        const metaName = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '';
        const metaBusiness =
          typeof user.user_metadata?.business_name === 'string' ? user.user_metadata.business_name : '';

        if (mounted) setOwnerName(metaName || metaBusiness || 'Owner');

        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select(
            'id, name, slug, plan, owner_email, stripe_account_id, theme, owner_order_language, order_language'
          )
          .eq('owner_id', user.id)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        const r = restaurantData as RestaurantRecord | null;
        if (mounted) {
          setRestaurant(r);
          const savedLang =
            (r?.owner_order_language || r?.order_language || 'en').toString().toLowerCase() === 'es'
              ? 'es'
              : 'en';
          setOrderLanguage(savedLang);
        }

        if (r?.id) {
          const [itemsRes, ordersRes, stripeRes] = await Promise.all([
            supabase
              .from('menu_items')
              .select('id, restaurant_id, name, price, description, image_url, created_at')
              .eq('restaurant_id', r.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('orders')
              .select('id, restaurant_id, customer_name, total, status, created_at, items_summary')
              .eq('restaurant_id', r.id)
              .order('created_at', { ascending: false })
              .limit(50),
            fetch(`/api/connect/status?restaurantId=${r.id}`)
              .then(async (res) => (res.ok ? res.json() : null))
              .catch(() => null),
          ]);

          if (!itemsRes.error && mounted) setMenuItems((itemsRes.data || []) as MenuItemRecord[]);
          if (!ordersRes.error && mounted) setOrders((ordersRes.data || []) as OrderRecord[]);
          if (stripeRes && mounted) {
            setStripe({
              connected: !!stripeRes.connected,
              onboardingComplete: !!stripeRes.onboardingComplete,
              chargesEnabled: !!stripeRes.chargesEnabled,
              payoutsEnabled: !!stripeRes.payoutsEnabled,
            });
          }
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
    };
  }, [router]);

  const today = startOfDay(new Date());

  const salesOverview = useMemo(() => {
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
      const amount = safeNumber(order.total || 0);
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
        const weekIndex = Math.min(5, Math.ceil(createdDay.getDate() / 7));
        monthWeekMap.set(`W${weekIndex}`, (monthWeekMap.get(`W${weekIndex}`) || 0) + amount);
      }

      if (createdDay >= previousMonthStart && createdDay <= previousMonthEnd) {
        const weekIndex = Math.min(5, Math.ceil(createdDay.getDate() / 7));
        prevMonthWeekMap.set(`W${weekIndex}`, (prevMonthWeekMap.get(`W${weekIndex}`) || 0) + amount);
      }
    });

    const weekData: ChartPoint[] = Array.from({ length: 7 }).map((_, index) => {
      const d = addDays(currentWeekStart, index);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      return { day: DAY_LABELS[d.getDay()], value: weekMap.get(key) || 0 };
    });

    const lastWeekData: ChartPoint[] = Array.from({ length: 7 }).map((_, index) => {
      const d = addDays(previousWeekStart, index);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      return { day: DAY_LABELS[d.getDay()], value: prevWeekMap.get(key) || 0 };
    });

    const monthData: ChartPoint[] = ['W1', 'W2', 'W3', 'W4', 'W5'].map((label) => ({
      day: label,
      value: monthWeekMap.get(label) || 0,
    }));

    const lastMonthData: ChartPoint[] = ['W1', 'W2', 'W3', 'W4', 'W5'].map((label) => ({
      day: label,
      value: prevMonthWeekMap.get(label) || 0,
    }));

    const revenueChange =
      prevWeekSales <= 0 ? (weekSales > 0 ? 100 : 0) : ((weekSales - prevWeekSales) / prevWeekSales) * 100;

    return {
      todaySales,
      todayOrders,
      weekSales,
      revenueChange,
      weekData,
      lastWeekData,
      monthData,
      lastMonthData,
    };
  }, [orders, today]);

  const chartData = useMemo(() => {
    if (range === 'week') return salesOverview.weekData;
    if (range === 'lastWeek') return salesOverview.lastWeekData;
    if (range === 'month') return salesOverview.monthData;
    return salesOverview.lastMonthData;
  }, [range, salesOverview]);

  const liveOrders = useMemo(() => {
    return orders.filter((item) => {
      const status = displayStatus(item.status).toLowerCase();
      return status !== 'cancelled' && status !== 'completed';
    });
  }, [orders]);

  const billingOrders = useMemo(() => {
    return orders.filter((item) => {
      const status = displayStatus(item.status).toLowerCase();
      return status === 'cancelled' || status === 'completed' || status === 'new' || status === 'preparing';
    });
  }, [orders]);

  const cancelledOrders = useMemo(() => {
    return orders.filter((item) => displayStatus(item.status).toLowerCase() === 'cancelled');
  }, [orders]);

  const filteredLiveOrders = useMemo(() => {
    return filterOrders(liveOrders, liveFilter).slice(0, 6);
  }, [liveOrders, liveFilter]);

  const filteredBillingOrders = useMemo(() => {
    return filterOrders(billingOrders, billingFilter).slice(0, 4);
  }, [billingOrders, billingFilter]);

  const storeLink = restaurant?.slug ? `/store/${restaurant.slug}` : '/dashboard/owner/builder';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  async function handleSetOrderLanguage(next: OwnerOrderLanguage) {
    setOrderLanguage(next);
    if (!restaurant?.id) return;

    setSavingLanguage(true);
    const tryOwnerField = await supabase
      .from('restaurants')
      .update({ owner_order_language: next })
      .eq('id', restaurant.id);

    if (tryOwnerField.error) {
      await supabase.from('restaurants').update({ order_language: next }).eq('id', restaurant.id);
    }

    setSavingLanguage(false);
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f4f4f6',
          fontFamily: 'Inter, sans-serif',
          color: '#111827',
          fontWeight: 700,
        }}
      >
        {t.loading}
      </main>
    );
  }

  return (
    <main className="pageShell">
      <aside className="sidebar">
        <div className="brandCard">
          <div className="brandMark">M</div>
          <div className="brandName">MenuFlow</div>
        </div>

        <div className="sidebarDivider" />

        <nav className="sidebarNav">
          <Link href="/dashboard/owner" className="navItem navItemActive">
            <NavIcon />
            <span>{t.dashboard}</span>
          </Link>

          <Link href="/dashboard/owner/orders" className="navItem">
            <OrdersIcon />
            <span>{t.liveOrders}</span>
          </Link>

          <Link href="/dashboard/owner/builder" className="navItem">
            <BuilderIcon />
            <span>{t.menuBuilder}</span>
          </Link>

          <a href="#billing" className="navItem">
            <PaymentsIcon />
            <span>{t.payments}</span>
          </a>

          <a href="#owner-info" className="navItem">
            <OwnerIcon />
            <span>{t.ownerInfo}</span>
          </a>

          <Link href="/dashboard/owner/settings" className="navItem">
            <SettingsIcon />
            <span>{t.storeSettings}</span>
          </Link>
        </nav>

        <div className="sidebarFooter">
          <Link href={storeLink} className="storefrontButton">
            <StorefrontIcon />
            <span>{t.openStorefront}</span>
          </Link>

          <button className="signOutBtn" onClick={handleSignOut}>
            {t.signOut}
          </button>
        </div>
      </aside>

      <section className="mainArea">
        <header className="desktopTopbar">
          <div className="topbarLeft">
            <div className="ownerControlBlock">
              <div className="ownerControlLabel">{t.ownerControl}</div>
              <div className="ownerWelcome">
                {t.welcome}, {ownerName}
              </div>
            </div>
          </div>

          <div className="topbarRight">
            <label className="languageControl">
              <span className="languageLabel">{t.orderLanguage}</span>
              <select
                className="languageSelect"
                value={orderLanguage}
                onChange={(e) => {
                  void handleSetOrderLanguage(e.target.value as OwnerOrderLanguage);
                }}
                disabled={savingLanguage}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
              </select>
            </label>

            <Link href="/dashboard/owner/builder" className="topActionButton topActionPrimary">
              {t.openBuilder}
            </Link>

            <Link href={storeLink} className="topActionButton">
              {t.viewStore}
            </Link>
          </div>
        </header>

        <div className="contentGrid">
          <section className="desktopOnly">
            <div className="overviewHeading">
              <h1>{t.overview}</h1>
              <p>{t.quickActions}</p>
            </div>

            <div className="statsRow">
              <StatCard title={t.todaySales} value={currency(salesOverview.todaySales)} />
              <StatCard title={t.todayOrders} value={`${salesOverview.todayOrders}`} />
              <StatCard title={t.menuItems} value={`${menuItems.length}`} />
              <StatCard
                title={t.revenueTrend}
                value={`${Math.abs(salesOverview.revenueChange).toFixed(1)}%`}
                accent="trend"
                prefix={salesOverview.revenueChange >= 0 ? '↑' : '↓'}
                suffix={t.thisWeek}
              />
            </div>

            <section className="card chartCard">
              <div className="cardHeader chartHeader">
                <h2>{t.salesOverview}</h2>

                <div className="tabGroup">
                  <button
                    type="button"
                    className={range === 'week' ? 'tabButton tabButtonActive' : 'tabButton'}
                    onClick={() => setRange('week')}
                  >
                    {t.thisWeek}
                  </button>
                  <button
                    type="button"
                    className={range === 'lastWeek' ? 'tabButton tabButtonActive' : 'tabButton'}
                    onClick={() => setRange('lastWeek')}
                  >
                    {t.lastWeek}
                  </button>
                  <button
                    type="button"
                    className={range === 'month' ? 'tabButton tabButtonActive' : 'tabButton'}
                    onClick={() => setRange('month')}
                  >
                    {t.thisMonth}
                  </button>
                  <button
                    type="button"
                    className={range === 'lastMonth' ? 'tabButton tabButtonActive' : 'tabButton'}
                    onClick={() => setRange('lastMonth')}
                  >
                    {t.lastMonth}
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
                    <Tooltip
                      content={<RevenueTooltip />}
                      cursor={{ stroke: '#d7e4e6', strokeDasharray: '4 4' }}
                    />
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
                  <h2>{t.liveOrders}</h2>
                  <Link href="/dashboard/owner/orders" className="viewAllButton">
                    {t.viewAll}
                  </Link>
                </div>

                <div className="filterRow">
                  {([
                    { key: 'all', label: t.all },
                    { key: 'new', label: t.new },
                    { key: 'yellow', label: t.yellow },
                    { key: 'green', label: t.green },
                  ] as const).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={liveFilter === item.key ? 'filterButton filterButtonActive' : 'filterButton'}
                      onClick={() => setLiveFilter(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="orderList">
                  {filteredLiveOrders.length ? (
                    filteredLiveOrders.map((order) => <OrderCard key={order.id} order={order} />)
                  ) : (
                    <EmptyState text={t.noLiveOrders} />
                  )}
                </div>

                <div className="panelFooter">
                  <Link href="/dashboard/owner/orders" className="viewAllButton">
                    {t.viewAll}
                  </Link>
                </div>
              </section>

              <section id="billing" className="card">
                <div className="cardHeader">
                  <h2>{t.billing}</h2>
                </div>

                <div className="filterRow">
                  {([
                    { key: 'all', label: t.all },
                    { key: 'new', label: t.new },
                    { key: 'yellow', label: t.yellow },
                    { key: 'green', label: t.green },
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
                  <h3>{t.stripeStatus}</h3>
                  <div className="connectedRow">
                    <div className={`connectedPill ${stripe.connected ? '' : 'connectedPillMuted'}`}>
                      <span className="connectedDot" />
                      {stripe.connected ? t.connected : t.incomplete}
                    </div>
                    <div className={`connectedPill ${stripe.payoutsEnabled ? '' : 'connectedPillMuted'}`}>
                      <span className="connectedDot" />
                      {stripe.payoutsEnabled ? t.payoutsEnabled : t.payoutsIncomplete}
                    </div>
                  </div>
                </div>

                <div className="orderList">
                  {filteredBillingOrders.length ? (
                    filteredBillingOrders.map((order) => <OrderCard key={order.id} order={order} />)
                  ) : (
                    <EmptyState text={t.noBilling} />
                  )}
                </div>
              </section>
            </div>

            <section id="owner-info" className="card cancelledCard">
              <div className="cardHeader">
                <h2>{t.cancelledOrders}</h2>
              </div>

              <div className="orderList">
                {cancelledOrders.length ? (
                  cancelledOrders.slice(0, 4).map((order) => <OrderCard key={order.id} order={order} />)
                ) : (
                  <EmptyState text={t.noCancelled} />
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

            <section className="mobileHeroCard">
              <div className="mobileHeroLeft">
                <div className="mobileHeroLabel">{t.ownerControl}</div>
                <h1 className="mobileHeroTitle">
                  {t.welcome}, {ownerName}
                </h1>
              </div>

              <div className="mobileHeroRight">
                <label className="mobileLanguageControl">
                  <span>{t.orderLanguage}</span>
                  <select
                    className="languageSelect mobileSelect"
                    value={orderLanguage}
                    onChange={(e) => {
                      void handleSetOrderLanguage(e.target.value as OwnerOrderLanguage);
                    }}
                    disabled={savingLanguage}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                  </select>
                </label>

                <div className="mobileTopButtons">
                  <Link href="/dashboard/owner/builder" className="mobileActionButton mobileActionPrimary">
                    {t.openBuilder}
                  </Link>
                  <Link href={storeLink} className="mobileActionButton">
                    {t.viewStore}
                  </Link>
                </div>
              </div>
            </section>

            <section className="mobileSalesHero">
              <div className="mobileSalesHeroTop">
                <div>
                  <div className="mobileHeroMiniLabel">{t.todaySales}</div>
                  <div className="mobileHeroValue">{currency(salesOverview.todaySales)}</div>
                </div>

                <div className="mobileHeroTrend">
                  <span className={`trendArrow ${salesOverview.revenueChange < 0 ? 'trendNegative' : ''}`}>
                    {salesOverview.revenueChange >= 0 ? '↑' : '↓'}
                  </span>
                  <div className="mobileHeroTrendText">
                    <strong>{Math.abs(salesOverview.revenueChange).toFixed(1)}%</strong>
                    <span>{t.thisWeek}</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="mobileMiniStatsPremium">
              <div className="mobileMiniStatCard">
                <span className="mobileMiniStatLabel">{t.todayOrders}</span>
                <strong>{salesOverview.todayOrders}</strong>
              </div>
              <div className="mobileMiniStatCard">
                <span className="mobileMiniStatLabel">{t.menuItems}</span>
                <strong>{menuItems.length}</strong>
              </div>
              <div className="mobileMiniStatCard mobileMiniStatWide">
                <span className="mobileMiniStatLabel">{t.weekRevenue}</span>
                <strong>{currency(salesOverview.weekSales)}</strong>
              </div>
            </div>

            <section className="mobileCard mobileGraphCard">
              <div className="mobileGraphHeader premiumGraphHeader">
                <h2>{t.salesOverview}</h2>
                <div className="mobileTabRow">
                  <button
                    type="button"
                    className={range === 'week' ? 'mobileTabButton mobileTabButtonActive' : 'mobileTabButton'}
                    onClick={() => setRange('week')}
                  >
                    {lang === 'en' ? 'Week' : 'Semana'}
                  </button>
                  <button
                    type="button"
                    className={range === 'lastWeek' ? 'mobileTabButton mobileTabButtonActive' : 'mobileTabButton'}
                    onClick={() => setRange('lastWeek')}
                  >
                    {lang === 'en' ? 'Last' : 'Pasada'}
                  </button>
                  <button
                    type="button"
                    className={range === 'month' ? 'mobileTabButton mobileTabButtonActive' : 'mobileTabButton'}
                    onClick={() => setRange('month')}
                  >
                    {lang === 'en' ? 'Month' : 'Mes'}
                  </button>
                  <button
                    type="button"
                    className={range === 'lastMonth' ? 'mobileTabButton mobileTabButtonActive' : 'mobileTabButton'}
                    onClick={() => setRange('lastMonth')}
                  >
                    {lang === 'en' ? 'Prev' : 'Anterior'}
                  </button>
                </div>
              </div>

              <div className="mobileChartWrapPremium">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
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
                    <Tooltip
                      content={<RevenueTooltip />}
                      cursor={{ stroke: '#d7e4e6', strokeDasharray: '4 4' }}
                    />
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

            <section className="mobileCard mobileOrdersCard">
              <div className="mobileCardHeader">
                <span>{t.liveOrders}</span>
                <Link href="/dashboard/owner/orders" className="mobileViewAll">
                  {t.viewAll}
                </Link>
              </div>

              <div className="filterRow mobileFilterRow">
                {([
                  { key: 'all', label: t.all },
                  { key: 'new', label: t.new },
                  { key: 'yellow', label: t.yellow },
                  { key: 'green', label: t.green },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={liveFilter === item.key ? 'filterButton filterButtonActive' : 'filterButton'}
                    onClick={() => setLiveFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {filteredLiveOrders.length ? (
                filteredLiveOrders.slice(0, 4).map((order) => (
                  <MobileOrderCard key={`mobile-${order.id}`} order={order} />
                ))
              ) : (
                <EmptyState text={t.noLiveOrders} />
              )}
            </section>

            <section className="mobileCard mobileBillingCard">
              <div className="mobileCardHeader">
                <span>{t.billing}</span>
              </div>

              <div className="mobileBillingStatus">{t.stripeStatus}</div>

              <div className="mobileConnectedRow">
                <div className={`connectedPill ${stripe.connected ? '' : 'connectedPillMuted'}`}>
                  <span className="connectedDot" />
                  {stripe.connected ? t.connected : t.incomplete}
                </div>
                <div className={`connectedPill ${stripe.payoutsEnabled ? '' : 'connectedPillMuted'}`}>
                  <span className="connectedDot" />
                  {stripe.payoutsEnabled ? t.payoutsEnabled : t.payoutsIncomplete}
                </div>
              </div>

              <div className="filterRow mobileFilterRow">
                {([
                  { key: 'all', label: t.all },
                  { key: 'new', label: t.new },
                  { key: 'yellow', label: t.yellow },
                  { key: 'green', label: t.green },
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

              {filteredBillingOrders.length ? (
                filteredBillingOrders.slice(0, 3).map((order) => (
                  <MobileOrderCard key={`mobile-billing-${order.id}`} order={order} />
                ))
              ) : (
                <EmptyState text={t.noBilling} />
              )}
            </section>

            <section className="mobileCard">
              <div className="mobileCardHeader">
                <span>{t.cancelledOrders}</span>
              </div>

              {cancelledOrders.length ? (
                cancelledOrders.slice(0, 3).map((order) => (
                  <MobileOrderCard key={`mobile-cancelled-${order.id}`} order={order} />
                ))
              ) : (
                <EmptyState text={t.noCancelled} />
              )}
            </section>
          </section>
        </div>
      </section>

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
          display: grid;
          gap: 10px;
        }

        .storefrontButton,
        .signOutBtn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 48px;
          border: 1px solid #e8ebef;
          border-radius: 16px;
          background: #fff;
          color: #365f6f;
          font-weight: 600;
          box-shadow: 0 12px 26px rgba(20, 23, 28, 0.04);
        }

        .signOutBtn {
          color: #111827;
          cursor: pointer;
        }

        .mainArea {
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
          height: 44px;
          border-radius: 14px;
          border: 1px solid #e5e9ee;
          background: #fff;
          padding: 0 14px;
          font: inherit;
          color: #111827;
          outline: none;
          box-shadow: 0 8px 20px rgba(20, 23, 28, 0.03);
        }

        .topActionButton,
        .mobileActionButton,
        .viewAllButton,
        .mobileViewAll,
        .tabButton,
        .filterButton,
        .iconButton {
          border: 0;
          background: transparent;
          cursor: pointer;
          font: inherit;
        }

        .topActionButton,
        .mobileActionButton {
          height: 44px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e9ee;
          border-radius: 14px;
          background: #fff;
          color: #111827;
          font-weight: 700;
          box-shadow: 0 8px 20px rgba(20, 23, 28, 0.03);
          white-space: nowrap;
        }

        .topActionPrimary,
        .mobileActionPrimary {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
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
        .mobileHeroCard,
        .mobileSalesHero,
        .mobileMiniStatCard {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e8ebef;
          border-radius: 22px;
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
        .mobileTabButton {
          min-height: 36px;
          padding: 0 14px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #e8ebef;
          color: #6b7280;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .tabButtonActive,
        .filterButtonActive,
        .mobileTabButtonActive {
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
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .connectedPillMuted {
          background: #f6f7f9;
          border-color: #e5e8ed;
          color: #7b8594;
        }

        .connectedDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          display: inline-block;
          background: #9bc8c7;
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

        .mobileHeroCard {
          padding: 18px;
          margin-bottom: 14px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .mobileHeroLabel {
          font-size: 0.92rem;
          color: #6f7887;
          font-weight: 700;
        }

        .mobileHeroTitle {
          margin: 8px 0 0;
          font-size: 2rem;
          line-height: 1.04;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: #111827;
        }

        .mobileHeroRight {
          display: grid;
          gap: 12px;
        }

        .mobileLanguageControl {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #6d7684;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .mobileSelect {
          width: 100%;
          min-width: 100%;
        }

        .mobileTopButtons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .mobileSalesHero {
          padding: 18px;
          margin-bottom: 14px;
          background: linear-gradient(180deg, #ffffff 0%, #f7fafb 100%);
        }

        .mobileSalesHeroTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .mobileHeroMiniLabel {
          color: #67707f;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .mobileHeroValue {
          margin-top: 8px;
          font-size: 2.45rem;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: #111827;
        }

        .mobileHeroTrend {
          min-width: 116px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 16px;
          background: #f3f9f8;
          border: 1px solid #deeceb;
        }

        .mobileHeroTrendText {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.1;
        }

        .mobileHeroTrendText strong {
          font-size: 1rem;
          color: #111827;
        }

        .mobileHeroTrendText span {
          margin-top: 4px;
          font-size: 0.78rem;
          color: #6d7684;
          font-weight: 700;
        }

        .trendArrow {
          color: #66c7c4;
          font-size: 1.25rem;
          line-height: 1;
        }

        .trendNegative {
          color: #cf8686;
        }

        .mobileMiniStatsPremium {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .mobileMiniStatCard {
          min-height: 118px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .mobileMiniStatWide {
          grid-column: 1 / -1;
          min-height: 108px;
        }

        .mobileMiniStatLabel {
          color: #66707d;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .mobileMiniStatCard strong {
          font-size: 2rem;
          line-height: 1;
          color: #111827;
          letter-spacing: -0.04em;
        }

        .mobileCard {
          padding: 16px;
        }

        .mobileGraphCard,
        .mobileOrdersCard,
        .mobileBillingCard {
          margin-bottom: 14px;
        }

        .premiumGraphHeader {
          align-items: flex-start;
          flex-direction: column;
          gap: 10px;
        }

        .premiumGraphHeader h2 {
          font-size: 1.18rem;
        }

        .mobileTabRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mobileTabButton {
          min-height: 34px;
          padding: 0 14px;
        }

        .mobileChartWrapPremium {
          margin-top: 8px;
          height: 260px;
          width: 100%;
        }

        .mobileCardHeader {
          margin-bottom: 12px;
        }

        .mobileCardHeader span {
          font-size: 1.18rem;
        }

        .mobileFilterRow {
          margin-bottom: 12px;
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

          .mobileHeroCard,
          .mobileSalesHero,
          .mobileCard,
          .mobileMiniStatCard {
            border-radius: 20px;
          }

          .mobileHeroTitle {
            font-size: 1.8rem;
          }

          .mobileHeroValue {
            font-size: 2.2rem;
          }

          .mobileTopButtons {
            grid-template-columns: 1fr 1fr;
          }

          .mobileChartWrapPremium {
            height: 240px;
          }
        }

        @media (max-width: 420px) {
          .mobileTopButtons {
            grid-template-columns: 1fr;
          }

          .mobileSalesHeroTop {
            flex-direction: column;
            align-items: flex-start;
          }

          .mobileHeroTrend {
            width: 100%;
            justify-content: flex-start;
          }

          .mobileMiniStatsPremium {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  );
}
