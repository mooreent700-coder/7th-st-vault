
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Language = 'EN' | 'ES';
type OrderStatusKey = 'NEW' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';
type OrderFilter = 'ALL' | OrderStatusKey;
type RangeKey = 'WEEK' | 'TODAY' | 'MONTH';

type StoreRecord = {
  id: string;
  name: string | null;
  slug: string | null;
  owner_id?: string | null;
  user_id?: string | null;
  plan?: string | null;
  stripe_connected?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  phone?: string | null;
  address?: string | null;
  hero_image?: string | null;
  logo_image?: string | null;
  [key: string]: any;
};

type OrderRow = {
  id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  total?: number | null;
  amount_total?: number | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  items_summary?: string | null;
  summary?: string | null;
  order_items?: any;
  items?: any;
  line_items?: any;
  [key: string]: any;
};

type MenuItemRow = {
  id: string;
  name?: string | null;
  price?: number | null;
  [key: string]: any;
};

type StorefrontViewRow = {
  id: string;
  created_at?: string | null;
  restaurant_id?: string | null;
  store_slug?: string | null;
  slug?: string | null;
  [key: string]: any;
};

type ChartPoint = {
  label: string;
  total: number;
};

const COPY = {
  EN: {
    sidebarTitle: 'OWNER PANEL',
    welcome: 'Welcome back',
    headline: 'Your Store is Live',
    subheadline: 'All systems operational and accepting orders',
    dashboard: 'Dashboard',
    liveOrders: 'Live Orders',
    menuBuilder: 'Menu Builder',
    payments: 'Payments',
    customers: 'Customers',
    marketing: 'Marketing',
    settings: 'Store Settings',
    integrations: 'Integrations',
    upgradePlan: 'Upgrade Plan',
    unlockMore: 'Unlock more features and grow your business.',
    upgradeNow: 'Upgrade Now',
    search: 'Search orders, customers, items...',
    openBuilder: 'Open Builder',
    viewStore: 'View Store',
    todaysSales: "Today's Sales",
    todaysOrders: "Today's Orders",
    newOrders: 'New Orders',
    completionRate: 'Completion Rate',
    vsPrev: 'vs previous period',
    needsAction: 'Needs action',
    viewAllOrders: 'View all orders',
    all: 'All',
    new: 'New',
    inProgress: 'In Progress',
    almostReady: 'Almost Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
    accept: 'Accept',
    decline: 'Decline',
    markReady: 'Mark Ready',
    complete: 'Complete',
    viewDetails: 'View Details',
    storeStatus: 'Store Status',
    storeLive: 'Your store is live and online',
    stripeStatus: 'Stripe Status',
    manage: 'Manage',
    account: 'Account',
    charges: 'Charges',
    payouts: 'Payouts',
    connected: 'Connected',
    enabled: 'Enabled',
    notConnected: 'Not Connected',
    pending: 'Pending',
    nextPayout: 'Next Payout',
    noPayoutData: 'No payout data yet',
    boostSales: 'Boost your sales',
    flyerCopy: 'Create stunning flyers in seconds and grow your business.',
    createFlyers: 'Create Flyers',
    quickActions: 'Quick Actions',
    buildMenu: 'Build Menu',
    editMenu: 'Edit your menu',
    previewStore: 'Preview Store',
    seeStore: 'See how it looks',
    goLiveStripe: 'Go Live / Stripe',
    connectPayments: 'Connect payments',
    storefrontLink: 'Your Storefront Link',
    shareStore: 'Share your store with customers',
    openStorefront: 'Open Storefront',
    copyLink: 'Copy Link',
    copied: 'Copied',
    salesOverview: 'Sales Overview',
    topMetrics: 'View full analytics',
    totalOrders: 'Total Orders',
    avgOrderValue: 'Avg. Order Value',
    newCustomers: 'New Customers',
    returningCustomers: 'Returning Customers',
    noOrders: 'No orders yet.',
    noStore: 'No store found for this account.',
    noSummary: 'Order received',
    loading: 'Loading owner dashboard...',
    thisWeek: 'This Week',
    today: 'Today',
    thisMonth: 'This Month',
    active: 'Active',
    starterPlan: 'Starter Plan',
    customer: 'Customer',
    owner: 'Owner',
    orderDetails: 'Order Details',
    close: 'Close',
    orderId: 'Order ID',
    status: 'Status',
    time: 'Time',
    amount: 'Amount',
    items: 'Items',
    storeViews: 'Store Views',
  },
  ES: {
    sidebarTitle: 'PANEL DEL DUEÑO',
    welcome: 'Bienvenido de nuevo',
    headline: 'Tu Tienda Está Activa',
    subheadline: 'Todos los sistemas operando y aceptando pedidos',
    dashboard: 'Panel',
    liveOrders: 'Pedidos en Vivo',
    menuBuilder: 'Constructor',
    payments: 'Pagos',
    customers: 'Clientes',
    marketing: 'Marketing',
    settings: 'Configuración',
    integrations: 'Integraciones',
    upgradePlan: 'Mejorar Plan',
    unlockMore: 'Desbloquea más funciones y haz crecer tu negocio.',
    upgradeNow: 'Mejorar Ahora',
    search: 'Buscar pedidos, clientes, artículos...',
    openBuilder: 'Abrir Constructor',
    viewStore: 'Ver Tienda',
    todaysSales: 'Ventas de Hoy',
    todaysOrders: 'Pedidos de Hoy',
    newOrders: 'Pedidos Nuevos',
    completionRate: 'Tasa Completada',
    vsPrev: 'vs periodo anterior',
    needsAction: 'Necesita acción',
    viewAllOrders: 'Ver todos los pedidos',
    all: 'Todos',
    new: 'Nuevo',
    inProgress: 'En Proceso',
    almostReady: 'Casi Listo',
    completed: 'Completado',
    cancelled: 'Cancelado',
    accept: 'Aceptar',
    decline: 'Rechazar',
    markReady: 'Marcar Listo',
    complete: 'Completar',
    viewDetails: 'Ver Detalles',
    storeStatus: 'Estado de la Tienda',
    storeLive: 'Tu tienda está activa y en línea',
    stripeStatus: 'Estado de Stripe',
    manage: 'Administrar',
    account: 'Cuenta',
    charges: 'Cobros',
    payouts: 'Pagos',
    connected: 'Conectado',
    enabled: 'Activado',
    notConnected: 'No Conectado',
    pending: 'Pendiente',
    nextPayout: 'Próximo Pago',
    noPayoutData: 'Aún no hay datos de pago',
    boostSales: 'Aumenta tus ventas',
    flyerCopy: 'Crea volantes impactantes en segundos y haz crecer tu negocio.',
    createFlyers: 'Crear Volantes',
    quickActions: 'Acciones Rápidas',
    buildMenu: 'Crear Menú',
    editMenu: 'Edita tu menú',
    previewStore: 'Vista Previa',
    seeStore: 'Mira cómo se ve',
    goLiveStripe: 'Activar / Stripe',
    connectPayments: 'Conectar pagos',
    storefrontLink: 'Enlace de Tu Tienda',
    shareStore: 'Comparte tu tienda con clientes',
    openStorefront: 'Abrir Tienda',
    copyLink: 'Copiar Enlace',
    copied: 'Copiado',
    salesOverview: 'Resumen de Ventas',
    topMetrics: 'Ver analítica completa',
    totalOrders: 'Pedidos Totales',
    avgOrderValue: 'Promedio por Pedido',
    newCustomers: 'Clientes Nuevos',
    returningCustomers: 'Clientes Recurrentes',
    noOrders: 'Aún no hay pedidos.',
    noStore: 'No se encontró tienda para esta cuenta.',
    noSummary: 'Pedido recibido',
    loading: 'Cargando panel del dueño...',
    thisWeek: 'Esta Semana',
    today: 'Hoy',
    thisMonth: 'Este Mes',
    active: 'Activa',
    starterPlan: 'Plan Inicial',
    customer: 'Cliente',
    owner: 'Dueño',
    orderDetails: 'Detalles del Pedido',
    close: 'Cerrar',
    orderId: 'ID del Pedido',
    status: 'Estado',
    time: 'Hora',
    amount: 'Monto',
    items: 'Artículos',
    storeViews: 'Vistas de la Tienda',
  },
} as const;

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatShortMoney(value: number) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isToday(value?: string | null) {
  const d = safeDate(value);
  if (!d) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isThisWeek(value?: string | null) {
  const d = safeDate(value);
  if (!d) return false;
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = (day + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset, 0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

function isThisMonth(value?: string | null) {
  const d = safeDate(value);
  if (!d) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function getStoreName(store: StoreRecord | null) {
  return store?.name?.trim() || 'MenuFlow Store';
}

function getStoreSlug(store: StoreRecord | null) {
  const raw = store?.slug?.trim() || getStoreName(store);
  return raw.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function getStoreUrl(store: StoreRecord | null) {
  const slug = getStoreSlug(store);
  if (typeof window !== 'undefined' && window.location?.origin) return `${window.location.origin}/store/${slug}`;
  return `/store/${slug}`;
}

function getOrderAmount(order: OrderRow) {
  return Number(order.total ?? order.amount_total ?? 0);
}

function getStatusKey(status?: string | null): OrderStatusKey {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return 'CANCELLED';
  if (s.includes('complete')) return 'COMPLETED';
  if (s.includes('ready')) return 'READY';
  if (s.includes('progress') || s.includes('accept')) return 'IN_PROGRESS';
  return 'NEW';
}

function getStatusLabel(status: OrderStatusKey, lang: Language) {
  const t = COPY[lang];
  if (status === 'NEW') return t.new;
  if (status === 'IN_PROGRESS') return t.inProgress;
  if (status === 'READY') return t.almostReady;
  if (status === 'COMPLETED') return t.completed;
  return t.cancelled;
}

function getStatusTheme(status: OrderStatusKey) {
  if (status === 'NEW') return { bg: '#fff1f2', text: '#ef4444', border: '#ef4444' };
  if (status === 'IN_PROGRESS') return { bg: '#eff6ff', text: '#2563eb', border: '#3b82f6' };
  if (status === 'READY') return { bg: '#fff7ed', text: '#d97706', border: '#f59e0b' };
  if (status === 'COMPLETED') return { bg: '#ecfdf3', text: '#16a34a', border: '#22c55e' };
  return { bg: '#f1f5f9', text: '#64748b', border: '#94a3b8' };
}

function getOrderSummary(order: OrderRow, fallback: string) {
  const direct = [order.items_summary, order.summary].find(Boolean);
  if (direct) return String(direct);

  const source = order.line_items || order.order_items || order.items;
  if (Array.isArray(source) && source.length) {
    return source
      .slice(0, 2)
      .map((item: any) => `${item?.quantity || 1}x ${item?.name || 'Item'}`)
      .join(' • ');
  }

  return fallback;
}

function initials(name?: string | null) {
  return ((name || 'Customer').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')) || 'CU';
}

function timeAgo(value?: string | null, lang: Language = 'EN') {
  const d = safeDate(value);
  if (!d) return '--';
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (lang === 'ES') {
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} h`;
    return `${Math.floor(hrs / 24)} d`;
  }
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day ago`;
}

function formatTime(value?: string | null) {
  const d = safeDate(value);
  if (!d) return '--';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatOrderCode(id: string) {
  return `#${String(id).slice(0, 5).toUpperCase()}`;
}

function pointLabel(label: string, lang: Language) {
  if (!label) return '';
  if (label.startsWith('W')) return `${lang === 'ES' ? 'Semana' : 'Week'} ${label.slice(1)}`;
  return label;
}

function buildSeries(orders: OrderRow[], range: RangeKey, lang: Language): ChartPoint[] {
  if (range === 'TODAY') {
    const labels = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
    const buckets = labels.map((label) => ({ label, total: 0 }));
    orders.forEach((order) => {
      const d = safeDate(order.created_at);
      if (!d || !isToday(order.created_at)) return;
      const bucket = Math.min(7, Math.floor(d.getHours() / 3));
      buckets[bucket].total += getOrderAmount(order);
    });
    return buckets;
  }

  if (range === 'MONTH') {
    const labels = ['W1', 'W2', 'W3', 'W4'];
    const buckets = labels.map((label) => ({ label, total: 0 }));
    orders.forEach((order) => {
      if (!isThisMonth(order.created_at)) return;
      const d = safeDate(order.created_at);
      if (!d) return;
      const bucket = Math.min(3, Math.floor((d.getDate() - 1) / 7));
      buckets[bucket].total += getOrderAmount(order);
    });
    return buckets;
  }

  const labels = lang === 'ES' ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = (day + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset, 0, 0, 0, 0);

  return labels.map((label, index) => {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    let total = 0;
    orders.forEach((order) => {
      const d = safeDate(order.created_at);
      if (d && d >= dayStart && d < dayEnd) total += getOrderAmount(order);
    });

    return { label, total };
  });
}

function makePath(points: ChartPoint[], width: number, height: number, max: number) {
  if (!points.length) return '';
  return points
    .map((point, index) => {
      const x = 24 + (index * (width - 48)) / Math.max(points.length - 1, 1);
      const y = height - 28 - (point.total / Math.max(max, 1)) * (height - 56);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function makeArea(points: ChartPoint[], width: number, height: number, max: number) {
  if (!points.length) return '';
  return `${makePath(points, width, height, max)} L ${width - 24} ${height - 16} L 24 ${height - 16} Z`;
}

function statDelta(current: number, previous: number) {
  if (previous <= 0 && current > 0) return 100;
  if (previous <= 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

function MiniSparkline({ points, stroke }: { points: ChartPoint[]; stroke: string }) {
  const values = points.length ? points : [{ label: 'A', total: 0 }];
  const max = Math.max(100, ...values.map((p) => p.total), 1);
  const width = 110;
  const height = 42;

  const path = values
    .map((point, index) => {
      const x = 4 + (index * (width - 8)) / Math.max(values.length - 1, 1);
      const y = height - 6 - (point.total / max) * (height - 12);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="miniSpark">
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  variant,
}: {
  label: string;
  count: number;
  active?: boolean;
  onClick: () => void;
  variant: 'dark' | 'red' | 'blue' | 'orange' | 'green';
}) {
  return (
    <button type="button" className={`filterChip ${variant} ${active ? 'active' : ''}`} onClick={onClick}>
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

function QuickActionCard({
  title,
  sub,
  onClick,
}: {
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="quickActionCard" onClick={onClick}>
      <div className="quickActionIcon" />
      <div>
        <div className="quickActionTitle">{title}</div>
        <div className="quickActionSub">{sub}</div>
      </div>
    </button>
  );
}

function MetricItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="metricItem">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Language>('EN');
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [storefrontViews, setStorefrontViews] = useState<StorefrontViewRow[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OrderFilter>('ALL');
  const [range, setRange] = useState<RangeKey>('WEEK');
  const [updatingId, setUpdatingId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const t = COPY[lang];

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('owner_dashboard_lang') : null;
    if (saved === 'EN' || saved === 'ES') setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('owner_dashboard_lang', lang);
    }
  }, [lang]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          if (active) setLoading(false);
          return;
        }

        const { data: storeRows, error: storeError } = await supabase
          .from('restaurants')
          .select('*')
          .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
          .limit(1);

        if (storeError) throw storeError;

        const currentStore = ((storeRows || [])[0] || null) as StoreRecord | null;

        let fetchedOrders: OrderRow[] = [];
        let fetchedMenuItems: MenuItemRow[] = [];
        let fetchedStorefrontViews: StorefrontViewRow[] = [];

        if (currentStore?.id) {
          const { data: orderRows, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', currentStore.id)
            .order('created_at', { ascending: false })
            .limit(150);

          if (orderError) throw orderError;

          const { data: itemRows, error: itemError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', currentStore.id)
            .limit(200);

          if (itemError) throw itemError;

          const viewsByRestaurant = await supabase
            .from('storefront_views')
            .select('id,created_at,restaurant_id,store_slug,slug')
            .eq('restaurant_id', currentStore.id)
            .order('created_at', { ascending: false })
            .limit(5000);

          if (viewsByRestaurant.error && currentStore.slug) {
            const viewsBySlug = await supabase
              .from('storefront_views')
              .select('id,created_at,restaurant_id,store_slug,slug')
              .or(`store_slug.eq.${currentStore.slug},slug.eq.${currentStore.slug}`)
              .order('created_at', { ascending: false })
              .limit(5000);

            if (!viewsBySlug.error) {
              fetchedStorefrontViews = (viewsBySlug.data || []) as StorefrontViewRow[];
            }
          } else if (!viewsByRestaurant.error) {
            fetchedStorefrontViews = (viewsByRestaurant.data || []) as StorefrontViewRow[];
          }

          fetchedOrders = (orderRows || []) as OrderRow[];
          fetchedMenuItems = (itemRows || []) as MenuItemRow[];
        }

        if (!active) return;
        setStore(currentStore);
        setOrders(fetchedOrders);
        setMenuItems(fetchedMenuItems);
        setStorefrontViews(fetchedStorefrontViews);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Could not load dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const storeUrl = useMemo(() => getStoreUrl(store), [store]);
  const storeName = useMemo(() => getStoreName(store), [store]);
  const totalStoreViews = storefrontViews.length;

  const searchedOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const summary = getOrderSummary(order, t.noSummary).toLowerCase();
      return (
        String(order.id).toLowerCase().includes(q) ||
        String(order.customer_name || '').toLowerCase().includes(q) ||
        summary.includes(q)
      );
    });
  }, [orders, search, t.noSummary]);

  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return searchedOrders;
    return searchedOrders.filter((order) => getStatusKey(order.status) === filter);
  }, [searchedOrders, filter]);

  const todayOrders = useMemo(() => orders.filter((o) => isToday(o.created_at)), [orders]);
  const weekOrders = useMemo(() => orders.filter((o) => isThisWeek(o.created_at)), [orders]);

  const todaySales = useMemo(() => todayOrders.reduce((sum, o) => sum + getOrderAmount(o), 0), [todayOrders]);
  const todayCount = todayOrders.length;
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + getOrderAmount(o), 0), [orders]);
  const weekSales = useMemo(() => weekOrders.reduce((sum, o) => sum + getOrderAmount(o), 0), [weekOrders]);
  const avgOrderValue = useMemo(() => (orders.length ? totalRevenue / orders.length : 0), [orders.length, totalRevenue]);

  const newOrdersCount = useMemo(() => orders.filter((o) => getStatusKey(o.status) === 'NEW').length, [orders]);
  const inProgressCount = useMemo(() => orders.filter((o) => getStatusKey(o.status) === 'IN_PROGRESS').length, [orders]);
  const readyCount = useMemo(() => orders.filter((o) => getStatusKey(o.status) === 'READY').length, [orders]);
  const completedCount = useMemo(() => orders.filter((o) => getStatusKey(o.status) === 'COMPLETED').length, [orders]);
  const completionRate = useMemo(() => (orders.length ? Math.round((completedCount / orders.length) * 100) : 0), [completedCount, orders.length]);

  const thisWeekSeries = useMemo(() => buildSeries(orders, 'WEEK', lang), [orders, lang]);
  const chartSeries = useMemo(() => buildSeries(orders, range, lang), [orders, range, lang]);
  const chartMax = useMemo(() => Math.max(600, ...chartSeries.map((p) => p.total), 1), [chartSeries]);
  const linePath = useMemo(() => makePath(chartSeries, 680, 240, chartMax), [chartSeries, chartMax]);
  const areaPath = useMemo(() => makeArea(chartSeries, 680, 240, chartMax), [chartSeries, chartMax]);
  const resolvedActiveChartIndex = activeChartIndex ?? (chartSeries.length ? chartSeries.length - 1 : null);
  const activeChartPoint = resolvedActiveChartIndex !== null ? chartSeries[resolvedActiveChartIndex] : null;

  const previousWeekTotal = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = (day + 6) % 7;
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset, 0, 0, 0, 0);
    const prevWeekStart = new Date(thisWeekStart);
    prevWeekStart.setDate(thisWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(thisWeekStart);

    return orders.reduce((sum, order) => {
      const d = safeDate(order.created_at);
      if (d && d >= prevWeekStart && d < prevWeekEnd) return sum + getOrderAmount(order);
      return sum;
    }, 0);
  }, [orders]);

  const prevDaySales = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    return orders.reduce((sum, order) => {
      const d = safeDate(order.created_at);
      if (d && d >= start && d < end) return sum + getOrderAmount(order);
      return sum;
    }, 0);
  }, [orders]);

  const prevDayOrderCount = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    return orders.filter((order) => {
      const d = safeDate(order.created_at);
      return !!d && d >= start && d < end;
    }).length;
  }, [orders]);

  const salesDelta = statDelta(todaySales, prevDaySales);
  const ordersDelta = statDelta(todayCount, prevDayOrderCount);
  const revenueDelta = statDelta(weekSales, previousWeekTotal);

  const customerCounts = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((order) => {
      const key = String(order.customer_name || '').trim().toLowerCase();
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });

    let newCustomers = 0;
    let returningCustomers = 0;

    map.forEach((count) => {
      if (count > 1) returningCustomers += 1;
      else newCustomers += 1;
    });

    return { newCustomers, returningCustomers };
  }, [orders]);

  async function updateOrder(order: OrderRow, next: 'accept' | 'ready' | 'complete' | 'cancel') {
    try {
      setUpdatingId(order.id);
      const status =
        next === 'accept' ? 'in_progress' :
        next === 'ready' ? 'ready' :
        next === 'complete' ? 'completed' :
        'cancelled';

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id);

      if (updateError) throw updateError;

      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? { ...item, status, updated_at: new Date().toISOString() } : item))
      );

      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status, updated_at: new Date().toISOString() });
      }
    } catch (err: any) {
      setError(err?.message || 'Could not update order.');
    } finally {
      setUpdatingId('');
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  if (loading) {
    return (
      <main className="ownerPage loadingPage">
        <div className="loadingText">{t.loading}</div>
        <style jsx global>{styles}</style>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="ownerPage loadingPage">
        <div className="loadingText">{t.noStore}</div>
        <style jsx global>{styles}</style>
      </main>
    );
  }

  return (
    <main className="ownerPage">
      <div className="dashboardShell">
        <aside className="sidebar">
          <div className="brandWrap">
            <div className="brandLogo">M</div>
            <div>
              <div className="brandName">MenuFlow</div>
              <div className="brandSub">{t.sidebarTitle}</div>
            </div>
          </div>

          <nav className="sidebarNav">
            <button className="navItem active" type="button"><span className="navIcon">▣</span><span>{t.dashboard}</span></button>
            <button className="navItem" type="button" onClick={() => document.getElementById('live-orders-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="navIcon">☰</span><span>{t.liveOrders}</span>{newOrdersCount > 0 ? <span className="alertCount">{newOrdersCount}</span> : null}
            </button>
            <button className="navItem" type="button" onClick={() => router.push('/dashboard/owner/builder')}>
              <span className="navIcon">✎</span><span>{t.menuBuilder}</span>
            </button>
            <button className="navItem" type="button" onClick={() => document.getElementById('store-status-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="navIcon">◫</span><span>{t.payments}</span>
            </button>
            <button className="navItem" type="button" onClick={() => document.getElementById('storefront-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="navIcon">⌁</span><span>{t.customers}</span>
            </button>
            <button className="navItem" type="button" onClick={() => router.push('/dashboard/owner/flyers')}>
              <span className="navIcon">⚑</span><span>{t.marketing}</span><span className="marketingNew">New</span>
            </button>
            <button className="navItem" type="button" onClick={() => document.getElementById('quick-actions-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="navIcon">⚙</span><span>{t.settings}</span>
            </button>
            <button className="navItem" type="button" onClick={() => document.getElementById('sales-overview-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="navIcon">⌘</span><span>{t.integrations}</span>
            </button>
          </nav>

          <div className="sidebarStoreCard">
            <div className="sidebarStoreThumb" />
            <div className="sidebarStoreTop">
              <div className="sidebarStoreName">{getStoreSlug(store)}</div>
              <div className="sidebarLivePill">{t.active}</div>
            </div>
            <div className="sidebarStorePlan">{store.plan || t.starterPlan}</div>

            <div className="sidebarStoreMetrics">
              <div className="sidebarMetricRow"><span>{t.totalOrders}</span><strong>{orders.length}</strong></div>
              <div className="sidebarMetricRow"><span>{lang === 'ES' ? 'Artículos del Menú' : 'Menu Items'}</span><strong>{menuItems.length}</strong></div>
              <div className="sidebarMetricRow"><span>{t.storeViews}</span><strong>{totalStoreViews}</strong></div>
            </div>

            <button type="button" className="sidebarPrimaryButton" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
              {t.openStorefront}<span>↗</span>
            </button>
          </div>

          <div className="upgradeCard">
            <div className="upgradeTitle">{t.upgradePlan}</div>
            <div className="upgradeSub">{t.unlockMore}</div>
            <button type="button" className="upgradeButton">{t.upgradeNow}</button>
          </div>

          <div className="sidebarFooterProfile">
            <div className="footerAvatar" />
            <div>
              <div className="footerName">{getStoreSlug(store)}</div>
              <div className="footerRole">{t.owner}</div>
            </div>
            <span className="footerChevron">⌄</span>
          </div>
        </aside>

        <section className="mainPanel">
          <header className="topHeader">
            <div>
              <div className="welcomeText">{t.welcome}, {getStoreSlug(store)} 👋</div>
              <h1 className="heroTitle">{t.headline}<span className="heroLiveDot" /></h1>
              <p className="heroSub">{t.subheadline}</p>
            </div>

            <div className="topHeaderActions">
              <div className="searchWrap">
                <span className="searchIcon">⌕</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
              </div>

              <button type="button" className="bellButton">
                <span>🔔</span>
                {newOrdersCount > 0 ? <span className="bellCount">{newOrdersCount}</span> : null}
              </button>

              <div className="langToggle">
                <button type="button" className={lang === 'EN' ? 'langButton active' : 'langButton'} onClick={() => setLang('EN')}>EN</button>
                <button type="button" className={lang === 'ES' ? 'langButton active' : 'langButton'} onClick={() => setLang('ES')}>ES</button>
              </div>

              <button type="button" className="headerButton secondary" onClick={() => router.push('/dashboard/owner/builder')}>
                {t.openBuilder}
              </button>

              <button type="button" className="headerButton primary" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                {t.viewStore}<span>→</span>
              </button>
            </div>
          </header>

          {error ? <div className="errorBanner">{error}</div> : null}

          <section className="topStatsGrid">
            <div className="topStatCard">
              <div className="topStatIcon green">$</div>
              <div className="topStatBody">
                <div className="topStatLabel">{t.todaysSales}</div>
                <div className="topStatValue">{formatMoney(todaySales)}</div>
                <div className="topStatMeta positive">↗ {salesDelta}% {t.vsPrev}</div>
              </div>
              <MiniSparkline points={thisWeekSeries} stroke="#22c55e" />
            </div>

            <div className="topStatCard">
              <div className="topStatIcon blue">◫</div>
              <div className="topStatBody">
                <div className="topStatLabel">{t.todaysOrders}</div>
                <div className="topStatValue">{todayCount}</div>
                <div className="topStatMeta positive">↗ {ordersDelta}% {t.vsPrev}</div>
              </div>
              <MiniSparkline points={thisWeekSeries} stroke="#3b82f6" />
            </div>

            <div className="topStatCard">
              <div className="topStatIcon orange">▤</div>
              <div className="topStatBody">
                <div className="topStatLabel">{t.newOrders}</div>
                <div className="topStatValue">{newOrdersCount}</div>
                <div className="topStatMeta danger">{t.needsAction}</div>
              </div>
              <div className="topStatActionIcon">⌁</div>
            </div>

            <div className="topStatCard">
              <div className="topStatIcon purple">◔</div>
              <div className="topStatBody">
                <div className="topStatLabel">{t.completionRate}</div>
                <div className="topStatValue">{completionRate}%</div>
                <div className="topStatMeta positive">↗ {completionRate}% {t.vsPrev}</div>
              </div>
              <MiniSparkline points={thisWeekSeries} stroke="#7c3aed" />
            </div>
          </section>

          <section className="contentGrid">
            <div className="centerColumn">
              <section className="panelCard liveOrdersPanel" id="live-orders-section">
                <div className="sectionHead">
                  <div className="sectionHeadLeft">
                    <h2>{t.liveOrders}</h2>
                    {newOrdersCount > 0 ? <span className="inlineBadge">{newOrdersCount} {t.new}</span> : null}
                  </div>
                  <button type="button" className="sectionLink">{t.viewAllOrders} →</button>
                </div>

                <div className="filterChips">
                  <FilterChip label={t.all} count={orders.length} variant="dark" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                  <FilterChip label={t.new} count={newOrdersCount} variant="red" active={filter === 'NEW'} onClick={() => setFilter('NEW')} />
                  <FilterChip label={t.inProgress} count={inProgressCount} variant="blue" active={filter === 'IN_PROGRESS'} onClick={() => setFilter('IN_PROGRESS')} />
                  <FilterChip label={t.almostReady} count={readyCount} variant="orange" active={filter === 'READY'} onClick={() => setFilter('READY')} />
                  <FilterChip label={t.completed} count={completedCount} variant="green" active={filter === 'COMPLETED'} onClick={() => setFilter('COMPLETED')} />
                </div>

                <div className="ordersTable">
                  {filteredOrders.length ? filteredOrders.slice(0, 5).map((order) => {
                    const status = getStatusKey(order.status);
                    const theme = getStatusTheme(status);
                    const primaryLabel =
                      status === 'NEW' ? t.accept :
                      status === 'IN_PROGRESS' ? t.markReady :
                      status === 'READY' ? t.complete :
                      '';

                    return (
                      <div key={order.id} className="orderRowCard" style={{ borderLeftColor: theme.border }}>
                        <div className="orderCodeBlock">
                          <div className="orderCodeTop">
                            <span className="orderCode">{formatOrderCode(order.id)}</span>
                            <span className="tinyStatus" style={{ background: theme.bg, color: theme.text }}>
                              {getStatusLabel(status, lang)}
                            </span>
                          </div>
                          <div className="orderTimeAgo">{timeAgo(order.created_at, lang)}</div>
                        </div>

                        <div className="avatarCircle" style={{ background: theme.bg, color: theme.text }}>
                          {initials(order.customer_name)}
                        </div>

                        <div className="customerBlock">
                          <div className="customerName">{order.customer_name || t.customer}</div>
                          <div className="customerPhone">{order.customer_phone || store.phone || '—'}</div>
                        </div>

                        <div className="summaryBlock">{getOrderSummary(order, t.noSummary)}</div>

                        <div className="amountBlock">{formatMoney(getOrderAmount(order))}</div>

                        <div className="statusChipWrap">
                          <span className="statusChip" style={{ background: theme.bg, color: theme.text }}>
                            {getStatusLabel(status, lang)}
                          </span>
                        </div>

                        <div className="actionButtons">
                          {status === 'NEW' || status === 'IN_PROGRESS' || status === 'READY' ? (
                            <>
                              <button
                                type="button"
                                className="primaryActionBtn"
                                onClick={() => updateOrder(order, status === 'NEW' ? 'accept' : status === 'IN_PROGRESS' ? 'ready' : 'complete')}
                                disabled={updatingId === order.id}
                              >
                                {updatingId === order.id ? '...' : primaryLabel}
                              </button>

                              <button
                                type="button"
                                className="secondaryActionBtn"
                                onClick={() => status === 'NEW' ? updateOrder(order, 'cancel') : setSelectedOrder(order)}
                              >
                                {status === 'NEW' ? t.decline : status === 'READY' || status === 'IN_PROGRESS' ? t.cancelled : t.viewDetails}
                              </button>
                            </>
                          ) : (
                            <button type="button" className="secondaryActionBtn" onClick={() => setSelectedOrder(order)}>
                              {t.viewDetails}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }) : <div className="emptyState">{t.noOrders}</div>}
                </div>

                <button type="button" className="loadMoreBtn">Load more orders ⌄</button>
              </section>

              <section className="panelCard salesPanel" id="sales-overview-section">
                <div className="sectionHead">
                  <div>
                    <h2>{t.salesOverview}</h2>
                    <div className="salesHeadlineRow">
                      <div className="salesBig">{formatMoney(range === 'TODAY' ? todaySales : range === 'MONTH' ? totalRevenue : weekSales)}</div>
                      <div className="salesGrowth">↗ {revenueDelta}% {t.vsPrev}</div>
                      {activeChartPoint ? <div className="salesTouchHint">{pointLabel(activeChartPoint.label, lang)} · {formatShortMoney(activeChartPoint.total)}</div> : null}
                    </div>
                  </div>

                  <div className="rangeSelectWrap">
                    <button type="button" className={range === 'TODAY' ? 'rangeBtn active' : 'rangeBtn'} onClick={() => setRange('TODAY')}>{t.today}</button>
                    <button type="button" className={range === 'WEEK' ? 'rangeBtn active' : 'rangeBtn'} onClick={() => setRange('WEEK')}>{t.thisWeek}</button>
                    <button type="button" className={range === 'MONTH' ? 'rangeBtn active' : 'rangeBtn'} onClick={() => setRange('MONTH')}>{t.thisMonth}</button>
                  </div>
                </div>

                <div className="salesBottom">
                  <div className="chartPanel">
                    <div className="chartYAxis">
                      <span>{formatShortMoney(chartMax)}</span>
                      <span>{formatShortMoney(chartMax * 0.66)}</span>
                      <span>{formatShortMoney(chartMax * 0.33)}</span>
                      <span>$0</span>
                    </div>

                    <div className="chartArea">
                      <svg viewBox="0 0 680 240" preserveAspectRatio="none" className="mainChartSvg">
                        <defs>
                          <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(34,197,94,0.30)" />
                            <stop offset="100%" stopColor="rgba(34,197,94,0.03)" />
                          </linearGradient>
                        </defs>

                        {[40, 92, 144, 196].map((y) => (
                          <line key={y} x1="24" y1={y} x2="656" y2={y} stroke="#eef2f7" strokeWidth="1" />
                        ))}

                        <path d={areaPath} fill="url(#salesFill)" />
                        <path d={linePath} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                        {chartSeries.map((point, index) => {
                          const x = 24 + (index * (680 - 48)) / Math.max(chartSeries.length - 1, 1);
                          const y = 240 - 28 - (point.total / Math.max(chartMax, 1)) * (240 - 56);
                          const isActive = resolvedActiveChartIndex === index;
                          return (
                            <g
                              key={point.label}
                              onMouseEnter={() => setActiveChartIndex(index)}
                              onMouseLeave={() => setActiveChartIndex(null)}
                              onTouchStart={() => setActiveChartIndex(index)}
                              style={{ cursor: 'pointer' }}
                            >
                              <line x1={x} y1={24} x2={x} y2={224} stroke={isActive ? 'rgba(15,23,42,.14)' : 'transparent'} strokeWidth="1.5" />
                              <circle cx={x} cy={y} r={isActive ? '8' : '5'} fill="#ffffff" stroke="#16a34a" strokeWidth={isActive ? '4' : '3'} />
                              <circle cx={x} cy={y} r="18" fill="transparent" />
                              {isActive ? (
                                <g>
                                  <rect x={Math.max(16, x - 48)} y={Math.max(12, y - 56)} width="96" height="42" rx="12" fill="#ffffff" stroke="#dbe5ef" />
                                  <text x={x} y={Math.max(30, y - 30)} textAnchor="middle" fontSize="13" fontWeight="900" fill="#0f172a">
                                    {formatShortMoney(point.total)}
                                  </text>
                                  <text x={x} y={Math.max(44, y - 15)} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#64748b">
                                    {point.label}
                                  </text>
                                </g>
                              ) : null}
                            </g>
                          );
                        })}
                      </svg>

                      <div className="chartXAxis" style={{ gridTemplateColumns: `repeat(${chartSeries.length},1fr)` }}>
                        {chartSeries.map((point) => <span key={point.label}>{point.label}</span>)}
                      </div>
                    </div>
                  </div>

                  <div className="metricCardsCol">
                    <MetricItem label={t.totalOrders} value={orders.length} />
                    <MetricItem label={t.avgOrderValue} value={formatMoney(avgOrderValue)} />
                    <MetricItem label={t.newCustomers} value={customerCounts.newCustomers} />
                    <MetricItem label={t.returningCustomers} value={customerCounts.returningCustomers} />
                    <MetricItem label={t.storeViews} value={totalStoreViews} />
                    <button type="button" className="analyticsLinkBtn">{t.topMetrics} →</button>
                  </div>
                </div>
              </section>
            </div>

            <aside className="rightColumn">
              <section className="panelCard compactCard" id="store-status-section">
                <div className="storeStatusTitle">{t.storeStatus}</div>
                <div className="storeStatusOnline"><span className="onlineDot" /><span>{t.storeLive}</span></div>

                <div className="stripeCard">
                  <div className="stripeCardHeader">
                    <strong>{t.stripeStatus}</strong>
                    <button type="button" className="manageBtn" onClick={() => router.push('/dashboard/owner/builder')}>{t.manage}</button>
                  </div>

                  <div className="stripeRows">
                    <div className="stripeRowItem"><span>{t.account}</span><strong className={store.stripe_connected ? 'positiveText' : ''}>{store.stripe_connected ? t.connected : t.notConnected}</strong></div>
                    <div className="stripeRowItem"><span>{t.charges}</span><strong className={store.stripe_charges_enabled ? 'positiveText' : ''}>{store.stripe_charges_enabled ? t.enabled : t.pending}</strong></div>
                    <div className="stripeRowItem"><span>{t.payouts}</span><strong className={store.stripe_payouts_enabled ? 'positiveText' : ''}>{store.stripe_payouts_enabled ? t.enabled : t.pending}</strong></div>
                  </div>
                </div>

                <div className="payoutRow">
                  <div>
                    <div className="payoutLabel">{t.nextPayout}</div>
                    <div className="payoutAmount">{store.stripe_payouts_enabled ? formatMoney(weekSales) : t.noPayoutData}</div>
                  </div>
                  <div className="payoutDate">Est. Apr 25, 2025</div>
                </div>
              </section>

              <section className="promoCard">
                <div className="promoContent">
                  <div className="promoTitle">{t.boostSales}</div>
                  <div className="promoSub">{t.flyerCopy}</div>
                  <button type="button" className="promoButton" onClick={() => router.push('/dashboard/owner/flyers')}>{t.createFlyers}</button>
                </div>
                <div className="promoPosterWrap" aria-hidden="true">
                  <div className="promoPoster">
                    <div className="promoPosterBadge">HOT</div>
                    <div className="promoPosterHeadline">BURGER COMBO</div>
                    <div className="promoPosterPrice">20% OFF</div>
                  </div>
                </div>
              </section>

              <section className="panelCard compactCard" id="quick-actions-section">
                <div className="compactTitle">{t.quickActions}</div>
                <div className="quickActionGrid">
                  <QuickActionCard title={t.buildMenu} sub={t.editMenu} onClick={() => router.push('/dashboard/owner/builder')} />
                  <QuickActionCard title={t.createFlyers} sub={t.boostSales} onClick={() => router.push('/dashboard/owner/flyers')} />
                  <QuickActionCard title={t.previewStore} sub={t.seeStore} onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')} />
                  <QuickActionCard title={t.goLiveStripe} sub={t.connectPayments} onClick={() => router.push('/dashboard/owner/builder')} />
                </div>
              </section>

              <section className="panelCard compactCard" id="storefront-section">
                <div className="compactTitle">{t.storefrontLink}</div>
                <div className="compactSub">{t.shareStore}</div>

                <div className="storefrontInputWrap">
                  <span>{storeUrl}</span>
                  <button type="button" className="copyMiniBtn" onClick={copyLink}>{copied ? '✓' : '⧉'}</button>
                </div>

                <button type="button" className="openStorefrontWide" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                  {t.openStorefront} ↗
                </button>
              </section>
            </aside>
          </section>
        </section>
      </div>

      {selectedOrder ? (
        <div className="modalOverlay" onClick={() => setSelectedOrder(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <h3>{t.orderDetails}</h3>
              <button type="button" className="modalCloseBtn" onClick={() => setSelectedOrder(null)}>{t.close}</button>
            </div>

            <div className="modalBody">
              <div className="modalRow"><span>{t.orderId}</span><strong>{formatOrderCode(selectedOrder.id)}</strong></div>
              <div className="modalRow"><span>{t.customer}</span><strong>{selectedOrder.customer_name || t.customer}</strong></div>
              <div className="modalRow"><span>{t.status}</span><strong>{getStatusLabel(getStatusKey(selectedOrder.status), lang)}</strong></div>
              <div className="modalRow"><span>{t.time}</span><strong>{formatTime(selectedOrder.created_at)}</strong></div>
              <div className="modalRow"><span>{t.amount}</span><strong>{formatMoney(getOrderAmount(selectedOrder))}</strong></div>
              <div className="modalRow vertical"><span>{t.items}</span><strong>{getOrderSummary(selectedOrder, t.noSummary)}</strong></div>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{styles}</style>
    </main>
  );
}

const styles = `
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;background:#f7f9fc}
  .ownerPage{min-height:100vh;background:#f7f9fc;color:#111827;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .loadingPage{display:grid;place-items:center}
  .loadingText{font-size:24px;font-weight:900}
  .dashboardShell{width:min(1580px,calc(100vw - 20px));margin:10px auto;display:grid;grid-template-columns:240px minmax(0,1fr);gap:20px}
  .sidebar{background:#ffffff;border:1px solid #edf1f5;border-radius:24px;padding:18px 16px;display:flex;flex-direction:column;gap:18px;min-height:calc(100vh - 20px);position:sticky;top:10px;overflow:hidden}
  .brandWrap{display:flex;align-items:center;gap:12px;padding:2px 4px 8px}
  .brandLogo{width:46px;height:46px;border-radius:14px;background:#0f172a;color:#fff;display:grid;place-items:center;font-size:24px;font-weight:900}
  .brandName{font-size:18px;font-weight:900;line-height:1.05}
  .brandSub{margin-top:4px;font-size:12px;color:#64748b;font-weight:800;letter-spacing:.08em}
  .sidebarNav{display:grid;gap:6px}
  .navItem{height:46px;border:none;background:transparent;border-radius:14px;padding:0 12px;display:flex;align-items:center;gap:12px;color:#1f2937;font-size:15px;font-weight:700;cursor:pointer;text-align:left}
  .navItem.active{background:#eef2ff;color:#1d4ed8}
  .navIcon{width:22px;text-align:center;color:#64748b;flex-shrink:0}
  .alertCount{margin-left:auto;min-width:24px;height:24px;border-radius:999px;background:#ef4444;color:#fff;font-size:12px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;padding:0 7px}
  .marketingNew{margin-left:auto;height:24px;padding:0 10px;border-radius:999px;background:#ecfdf3;color:#22c55e;font-size:12px;font-weight:900;display:inline-flex;align-items:center}
  .sidebarStoreCard{border:1px solid #edf1f5;border-radius:20px;background:#fff;padding:14px;display:grid;gap:10px}
  .sidebarStoreThumb{width:44px;height:44px;border-radius:12px;background:url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80') center/cover no-repeat;box-shadow:0 8px 18px rgba(0,0,0,.12)}
  .sidebarStoreTop{display:flex;align-items:center;gap:10px}
  .sidebarStoreName{font-size:18px;font-weight:900}
  .sidebarLivePill{margin-left:auto;height:24px;padding:0 10px;border-radius:999px;background:#ecfdf3;color:#16a34a;font-size:12px;font-weight:900;display:inline-flex;align-items:center}
  .sidebarStorePlan{font-size:14px;color:#64748b;font-weight:700}
  .sidebarStoreMetrics{display:grid;gap:8px;margin-top:4px}
  .sidebarMetricRow{display:flex;justify-content:space-between;gap:10px;font-size:14px;color:#64748b}
  .sidebarMetricRow strong{color:#111827;font-weight:900}
  .sidebarPrimaryButton{margin-top:4px;height:44px;border:none;border-radius:14px;background:#0f172a;color:#fff;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}
  .upgradeCard{border:1px solid #edf1f5;border-radius:20px;background:#fff;padding:16px 14px;display:grid;gap:10px}
  .upgradeTitle{font-size:18px;font-weight:900}
  .upgradeSub{font-size:14px;color:#64748b;line-height:1.45}
  .upgradeButton{height:42px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:14px;font-weight:800;color:#111827;cursor:pointer}
  .sidebarFooterProfile{margin-top:auto;display:flex;align-items:center;gap:12px;padding:12px 10px 6px}
  .footerAvatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#111827,#374151)}
  .footerName{font-size:16px;font-weight:900}
  .footerRole{margin-top:2px;font-size:13px;color:#64748b;font-weight:700}
  .footerChevron{margin-left:auto;color:#64748b;font-size:18px}
  .mainPanel{min-width:0;display:grid;gap:14px;align-content:start}
  .topHeader{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:8px 4px 0}
  .welcomeText{font-size:16px;color:#64748b;font-weight:800}
  .heroTitle{margin:6px 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:30px;line-height:1;letter-spacing:-.04em;font-weight:900}
  .heroSub{margin:0;font-size:15px;color:#64748b;font-weight:700}
  .heroLiveDot{width:12px;height:12px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 5px rgba(34,197,94,.12);display:inline-block}
  .topHeaderActions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end}
  .searchWrap{width:330px;height:48px;border:1px solid #e5e7eb;background:#fff;border-radius:14px;display:flex;align-items:center;gap:10px;padding:0 14px;color:#64748b}
  .searchWrap input{width:100%;border:none;outline:none;background:transparent;font-size:14px;color:#111827}
  .bellButton{width:48px;height:48px;border:1px solid #e5e7eb;background:#fff;border-radius:14px;position:relative;cursor:pointer;color:#64748b;font-size:18px}
  .bellCount{position:absolute;right:-2px;top:-2px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#ef4444;color:#fff;font-size:11px;font-weight:900;display:inline-flex;align-items:center;justify-content:center}
  .langToggle{display:flex;align-items:center;border:1px solid #e5e7eb;background:#fff;border-radius:14px;overflow:hidden}
  .langButton{width:52px;height:48px;border:none;background:#fff;color:#64748b;font-size:14px;font-weight:900;cursor:pointer}
  .langButton.active{background:#0f172a;color:#fff}
  .headerButton{height:48px;padding:0 18px;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
  .headerButton.secondary{border:1px solid #e5e7eb;background:#fff;color:#111827}
  .headerButton.primary{border:none;background:#0f172a;color:#fff}
  .errorBanner{padding:14px 16px;border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;border-radius:16px;font-size:14px;font-weight:800}
  .topStatsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .topStatCard{min-height:116px;border:1px solid #edf1f5;background:#fff;border-radius:20px;padding:14px;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center}
  .topStatIcon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:24px;font-weight:900}
  .topStatIcon.green{background:#dcfce7;color:#16a34a}
  .topStatIcon.blue{background:#dbeafe;color:#2563eb}
  .topStatIcon.orange{background:#ffedd5;color:#f59e0b}
  .topStatIcon.purple{background:#ede9fe;color:#7c3aed}
  .topStatBody{min-width:0}
  .topStatLabel{font-size:14px;color:#64748b;font-weight:800}
  .topStatValue{margin-top:6px;font-size:22px;font-weight:900;line-height:1.1}
  .topStatMeta{margin-top:10px;font-size:13px;font-weight:800}
  .topStatMeta.positive{color:#16a34a}
  .topStatMeta.danger{color:#dc2626}
  .topStatActionIcon{width:42px;height:42px;border-radius:14px;background:#fef3c7;color:#f59e0b;display:grid;place-items:center;font-size:20px;font-weight:900}
  .miniSpark{width:110px;height:42px;display:block}
  .contentGrid{display:grid;grid-template-columns:minmax(0,1.35fr) 360px;gap:14px;align-items:start}
  .centerColumn,.rightColumn{display:grid;gap:18px;align-content:start}
  .panelCard{border:1px solid #edf1f5;background:#fff;border-radius:24px;padding:16px}
  .compactCard{padding:18px}
  .sectionHead{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .sectionHead h2{margin:0;font-size:20px;font-weight:900;letter-spacing:-.03em}
  .sectionHeadLeft{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .inlineBadge{min-height:28px;padding:0 12px;border-radius:999px;background:#fff1f2;color:#ef4444;font-size:13px;font-weight:900;display:inline-flex;align-items:center}
  .sectionLink{border:none;background:transparent;color:#64748b;font-size:14px;font-weight:800;cursor:pointer}
  .filterChips{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}
  .filterChip{min-height:32px;padding:0 12px;border:none;border-radius:12px;font-size:14px;font-weight:800;display:inline-flex;align-items:center;gap:10px;cursor:pointer}
  .filterChip strong{font-size:13px;font-weight:900}
  .filterChip.dark{background:#0f172a;color:#fff}
  .filterChip.red{background:#fff1f2;color:#ef4444}
  .filterChip.blue{background:#eff6ff;color:#2563eb}
  .filterChip.orange{background:#fff7ed;color:#d97706}
  .filterChip.green{background:#ecfdf3;color:#16a34a}
  .filterChip.active{box-shadow:inset 0 0 0 2px rgba(15,23,42,.08)}
  .ordersTable{margin-top:18px;display:grid;gap:12px}
  .orderRowCard{border:1px solid #edf1f5;border-left:4px solid #e5e7eb;border-radius:18px;background:#fff;padding:14px 14px 14px 12px;display:grid;grid-template-columns:120px 44px 1fr 1.15fr 110px 120px 170px;gap:12px;align-items:center}
  .orderCodeBlock{min-width:0}
  .orderCodeTop{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .orderCode{font-size:16px;font-weight:900;letter-spacing:-.02em}
  .tinyStatus{min-height:24px;padding:0 10px;border-radius:999px;font-size:11px;font-weight:900;display:inline-flex;align-items:center}
  .orderTimeAgo{margin-top:8px;font-size:13px;color:#64748b;font-weight:700}
  .avatarCircle{width:42px;height:42px;border-radius:999px;display:grid;place-items:center;font-size:18px;font-weight:900}
  .customerBlock{min-width:0}
  .customerName{font-size:15px;font-weight:900;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .customerPhone{margin-top:6px;font-size:14px;color:#64748b;font-weight:700}
  .summaryBlock{font-size:14px;line-height:1.45;color:#475569;font-weight:700}
  .amountBlock{font-size:18px;font-weight:900;color:#111827;white-space:nowrap}
  .statusChipWrap{display:flex;justify-content:flex-start}
  .statusChip{min-height:32px;padding:0 14px;border-radius:999px;font-size:13px;font-weight:900;display:inline-flex;align-items:center;white-space:nowrap}
  .actionButtons{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
  .primaryActionBtn{min-width:88px;height:42px;border:none;border-radius:12px;background:#0f172a;color:#fff;font-size:14px;font-weight:800;cursor:pointer;padding:0 14px}
  .secondaryActionBtn{min-width:88px;height:42px;border:1px solid #dbe2ea;border-radius:12px;background:#fff;color:#475569;font-size:14px;font-weight:800;cursor:pointer;padding:0 14px}
  .loadMoreBtn{margin-top:12px;width:100%;height:38px;border:none;background:transparent;color:#64748b;font-size:14px;font-weight:800;cursor:pointer}
  .salesPanel{display:grid;gap:18px}
  .salesHeadlineRow{margin-top:8px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  .salesBig{font-size:38px;font-weight:900;letter-spacing:-.04em;line-height:1}
  .salesGrowth{font-size:14px;font-weight:800;color:#16a34a}.salesTouchHint{font-size:12px;font-weight:800;color:#64748b;padding:6px 10px;border-radius:999px;background:#f8fafc;border:1px solid #e5e7eb}
  .rangeSelectWrap{display:flex;gap:8px;flex-wrap:wrap}
  .rangeBtn{min-width:86px;height:38px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;color:#64748b;font-size:14px;font-weight:800;cursor:pointer;padding:0 14px}
  .rangeBtn.active{background:#f3f4f6;color:#111827}
  .salesBottom{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:16px;align-items:start}
  .chartPanel{display:grid;grid-template-columns:56px 1fr;gap:8px}
  .chartYAxis{display:flex;flex-direction:column;justify-content:space-between;padding:12px 0 18px;color:#64748b;font-size:13px;font-weight:700}
  .chartArea{min-width:0}
  .mainChartSvg{width:100%;height:240px;display:block}
  .chartXAxis{display:grid;gap:8px;margin-top:4px;color:#64748b;font-size:13px;font-weight:800;text-align:center}
  .metricCardsCol{border:1px solid #edf1f5;border-radius:18px;padding:12px;display:grid;gap:10px;background:#fff;align-content:start}
  .metricItem{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:36px;font-size:14px;color:#64748b;font-weight:700}
  .metricItem strong{color:#111827;font-weight:900}
  .analyticsLinkBtn{margin-top:6px;height:38px;border:none;background:transparent;color:#64748b;font-size:14px;font-weight:800;cursor:pointer;text-align:left}
  .storeStatusTitle,.compactTitle{font-size:18px;font-weight:900}
  .storeStatusOnline{margin-top:8px;display:flex;align-items:center;gap:10px;font-size:14px;color:#64748b;font-weight:700}
  .onlineDot{width:8px;height:8px;border-radius:999px;background:#16a34a}
  .stripeCard{margin-top:16px;border:1px solid #edf1f5;border-radius:18px;padding:14px}
  .stripeCardHeader{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .stripeCardHeader strong{font-size:16px;font-weight:900}
  .manageBtn{height:34px;padding:0 14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;color:#475569;font-size:13px;font-weight:800;cursor:pointer}
  .stripeRows{margin-top:14px;display:grid;gap:12px}
  .stripeRowItem{display:flex;justify-content:space-between;gap:12px;font-size:14px;color:#64748b;font-weight:700}
  .stripeRowItem strong{color:#111827;font-weight:900}
  .positiveText{color:#16a34a!important}
  .payoutRow{margin-top:14px;border:1px solid #edf1f5;border-radius:18px;padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:center}
  .payoutLabel{font-size:13px;color:#64748b;font-weight:700}
  .payoutAmount{margin-top:6px;font-size:20px;font-weight:900}
  .payoutDate{min-height:38px;padding:0 12px;border-radius:12px;background:#f8fafc;color:#64748b;font-size:13px;font-weight:800;display:inline-flex;align-items:center}
  .promoCard{position:relative;overflow:hidden;border:1px solid #f3e8c3;background:linear-gradient(135deg,#faf3d8 0%,#f8edd0 100%);border-radius:24px;padding:18px;min-height:180px;display:flex;align-items:stretch;justify-content:space-between;gap:16px}
  .promoContent{display:flex;flex-direction:column;justify-content:center;position:relative;z-index:2;max-width:220px}.promoTitle{font-size:18px;font-weight:900;max-width:200px}
  .promoSub{margin-top:8px;font-size:14px;color:#6b7280;line-height:1.45;max-width:210px}
  .promoButton{margin-top:16px;height:42px;padding:0 18px;border:none;border-radius:14px;background:#0f172a;color:#fff;font-size:14px;font-weight:800;cursor:pointer}
  .promoPosterWrap{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;min-width:140px;position:relative;z-index:2}.promoPoster{position:relative;width:138px;height:138px;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,0)), url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80') center/cover no-repeat;transform:rotate(8deg);box-shadow:0 16px 26px rgba(0,0,0,.16);border:4px solid rgba(255,255,255,.7);display:flex;flex-direction:column;justify-content:space-between;padding:12px}.promoPosterBadge{align-self:flex-start;min-height:24px;padding:0 10px;border-radius:999px;background:#0f172a;color:#fff;font-size:11px;font-weight:900;display:inline-flex;align-items:center}.promoPosterHeadline{font-size:20px;line-height:1;font-weight:900;color:#fff;text-shadow:0 3px 10px rgba(0,0,0,.45);max-width:90px}.promoPosterPrice{align-self:flex-end;min-height:28px;padding:0 10px;border-radius:999px;background:#ef4444;color:#fff;font-size:12px;font-weight:900;display:inline-flex;align-items:center}
  .compactSub{margin-top:6px;font-size:14px;color:#64748b;font-weight:700}
  .quickActionGrid{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .quickActionCard{min-height:84px;border:1px solid #edf1f5;background:#fff;border-radius:18px;padding:14px;display:flex;align-items:flex-start;gap:12px;cursor:pointer;text-align:left}
  .quickActionIcon{width:34px;height:34px;border-radius:12px;background:linear-gradient(135deg,#dcfce7,#dbeafe);flex-shrink:0}
  .quickActionTitle{font-size:14px;font-weight:900;color:#111827}
  .quickActionSub{margin-top:4px;font-size:13px;color:#64748b;font-weight:700;line-height:1.35}
  .storefrontInputWrap{margin-top:14px;min-height:56px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;padding:0 12px 0 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;overflow:hidden}
  .storefrontInputWrap span{font-size:14px;font-weight:700;color:#111827;word-break:break-word}
  .copyMiniBtn{width:36px;height:36px;border:1px solid #e5e7eb;background:#fff;border-radius:10px;color:#475569;font-size:16px;font-weight:900;cursor:pointer;flex-shrink:0}
  .openStorefrontWide{margin-top:14px;width:100%;height:46px;border:none;border-radius:14px;background:#0f172a;color:#fff;font-size:15px;font-weight:800;cursor:pointer}
  .emptyState{min-height:110px;border:1px dashed #dbe2ea;border-radius:18px;display:grid;place-items:center;color:#64748b;font-size:14px;font-weight:800}
  .modalOverlay{position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;padding:18px;z-index:60}
  .modalCard{width:min(100%,540px);border:1px solid #edf1f5;background:#fff;border-radius:24px;padding:18px;box-shadow:0 28px 80px rgba(15,23,42,.18)}
  .modalHead{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .modalHead h3{margin:0;font-size:22px;font-weight:900}
  .modalCloseBtn{height:38px;padding:0 14px;border:1px solid #e5e7eb;background:#fff;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer}
  .modalBody{margin-top:18px;display:grid;gap:12px}
  .modalRow{display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:flex-start;font-size:14px}
  .modalRow.vertical{grid-template-columns:1fr}
  .modalRow span{color:#64748b;font-weight:700}
  .modalRow strong{color:#111827;font-weight:900;word-break:break-word}

  @media (max-width:1380px){
    .dashboardShell{grid-template-columns:220px minmax(0,1fr)}
    .contentGrid{grid-template-columns:1fr}
    .rightColumn{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  }

  @media (max-width:1180px){
    .topStatsGrid{grid-template-columns:1fr 1fr}
    .salesBottom{grid-template-columns:1fr}
    .rightColumn{grid-template-columns:1fr}
    .orderRowCard{grid-template-columns:1fr;gap:10px;align-items:flex-start}
    .actionButtons{justify-content:flex-start}
    .statusChipWrap{justify-content:flex-start}
    .topHeader{flex-direction:column;align-items:flex-start}
    .topHeaderActions{width:100%;justify-content:flex-start}
    .searchWrap{width:100%}
  }

  @media (max-width:920px){
    .dashboardShell{width:min(100vw - 12px,1580px);margin:6px auto;display:flex;flex-direction:column-reverse;gap:8px}
    .sidebar{position:relative;top:0;min-height:auto;padding:10px;gap:10px;border-radius:18px}
    .brandWrap{padding:0 2px 2px}
    .brandLogo{width:40px;height:40px;border-radius:12px;font-size:20px}
    .brandName{font-size:16px}
    .brandSub{font-size:11px}
    .sidebarNav{grid-template-columns:1fr 1fr;gap:4px}
    .navItem{height:38px;font-size:13px;padding:0 10px;border-radius:12px}
    .navIcon{width:18px}
    .sidebarStoreCard{padding:10px;gap:6px;border-radius:16px}
    .sidebarStoreThumb{width:38px;height:38px;border-radius:10px}
    .sidebarStoreTop{gap:8px}
    .sidebarStoreName{font-size:16px}
    .sidebarStorePlan{font-size:13px}
    .sidebarStoreMetrics{gap:6px}
    .sidebarMetricRow{font-size:13px}
    .sidebarPrimaryButton{height:40px;font-size:14px;border-radius:12px}
    .sidebarFooterProfile{display:none}
    .upgradeCard{display:none}
    .mainPanel{gap:10px}
    .topHeader{gap:10px;padding:6px 2px 0}
    .topHeaderActions{width:100%;justify-content:flex-start;gap:8px}
    .contentGrid,.centerColumn,.rightColumn{gap:10px}
    .panelCard,.compactCard{padding:12px;border-radius:18px}
    .topStatsGrid{gap:10px}
    .topStatCard{min-height:94px;padding:12px;border-radius:18px;gap:10px}
    .topStatIcon{width:40px;height:40px;border-radius:12px;font-size:20px}
    .topStatLabel{font-size:13px}
    .topStatValue{font-size:20px}
    .topStatMeta{margin-top:6px;font-size:12px}
    .salesPanel{gap:10px}
    .promoCard{min-height:128px;padding:12px;border-radius:18px}
    .quickActionGrid{grid-template-columns:1fr;gap:10px}
    .quickActionCard{min-height:74px;padding:12px;border-radius:16px}
    .quickActionIcon{width:28px;height:28px;border-radius:10px}
    .storefrontInputWrap{min-height:auto;padding:10px 12px}
    .openStorefrontWide{height:42px;border-radius:12px}
  }

  @media (max-width:700px){
    .dashboardShell{width:min(100vw - 10px,1580px);gap:6px}
    .sidebar{padding:8px;gap:8px;border-radius:16px}
    .sidebarNav{grid-template-columns:1fr}
    .navItem{height:36px;font-size:12px}
    .sidebarStoreCard{padding:8px;gap:4px}
    .sidebarStoreThumb{width:34px;height:34px}
    .sidebarStoreName{font-size:15px}
    .sidebarStorePlan{font-size:12px}
    .sidebarMetricRow{font-size:12px}
    .sidebarPrimaryButton{height:38px;font-size:13px}
    .topStatsGrid{grid-template-columns:1fr}
    .topStatCard{grid-template-columns:auto 1fr;min-height:86px;padding:10px}
    .miniSpark,.topStatActionIcon{display:none}
    .heroTitle{font-size:24px}
    .heroSub,.welcomeText{font-size:13px}
    .sectionHead{flex-direction:column;align-items:flex-start;gap:6px}
    .sectionHead h2,.storeStatusTitle,.compactTitle{font-size:18px}
    .chartPanel{grid-template-columns:1fr}
    .chartYAxis{display:none}
    .mainChartSvg{height:140px}
    .chartXAxis{font-size:11px;margin-top:0}
    .salesBig{font-size:26px}
    .salesGrowth{font-size:12px}
    .salesTouchHint{font-size:11px;padding:4px 8px}
    .rangeSelectWrap{width:100%;gap:6px}
    .rangeBtn{flex:1;min-width:0;height:36px;font-size:13px;padding:0 8px}
    .metricCardsCol{padding:10px;gap:8px}
    .metricItem{min-height:30px;font-size:13px}
    .storefrontInputWrap{flex-direction:column;align-items:flex-start;padding:10px;min-height:auto}
    .storefrontInputWrap span{font-size:13px;line-height:1.35}
    .topHeaderActions{flex-direction:column;align-items:stretch;gap:8px}
    .searchWrap{height:40px;width:100%}
    .bellButton,.langToggle,.headerButton.secondary,.headerButton.primary{width:100%;height:40px}
    .langToggle{justify-content:center}
    .langButton{height:40px}
    .modalRow{grid-template-columns:1fr}
    .panelCard,.compactCard{padding:10px;border-radius:16px}
    .promoCard{min-height:112px;gap:8px}
    .promoTitle{font-size:16px}
    .promoContent{max-width:120px}
    .promoSub{font-size:11px;max-width:120px;line-height:1.2;margin-top:6px}
    .promoPosterWrap{min-width:92px}
    .promoPoster{width:88px;height:88px;padding:8px;transform:none}
    .promoPosterHeadline{font-size:13px;max-width:58px}
    .promoPosterBadge{min-height:20px;padding:0 8px;font-size:10px}
    .promoPosterPrice{min-height:22px;padding:0 8px;font-size:10px}
    .promoButton{margin-top:8px;height:32px;padding:0 12px;font-size:12px;border-radius:10px}
    .filterChips{margin-top:10px;gap:6px}
    .filterChip{min-height:30px;padding:0 10px;font-size:13px;gap:8px}
    .ordersTable{margin-top:10px;gap:8px}
    .emptyState{min-height:84px;border-radius:14px;font-size:13px}
    .loadMoreBtn{display:none}
    .payoutRow{padding:12px;align-items:flex-start;flex-direction:column}
    .payoutAmount{font-size:18px}
    .payoutDate{min-height:34px;font-size:12px}
    .stripeCard{padding:12px}
    .stripeRowItem{font-size:13px}
    .quickActionCard{min-height:68px}
    .quickActionTitle{font-size:13px}
    .quickActionSub{font-size:12px}
  }
    .topStatCard{grid-template-columns:auto 1fr;min-height:88px;padding:10px}
    .miniSpark,.topStatActionIcon{display:none}
    .heroTitle{font-size:24px}
    .heroSub,.welcomeText{font-size:13px}
    .sectionHead{flex-direction:column;align-items:flex-start;gap:8px}
    .chartPanel{grid-template-columns:1fr}
    .chartYAxis{display:none}
    .mainChartSvg{height:156px}
    .storefrontInputWrap{flex-direction:column;align-items:flex-start;padding:10px;min-height:auto}
    .topHeaderActions{flex-direction:column;align-items:stretch;gap:8px}
    .bellButton,.langToggle,.headerButton.secondary,.headerButton.primary{width:100%;height:42px}
    .langToggle{justify-content:center}
    .modalRow{grid-template-columns:1fr}
    .searchWrap{height:42px}
    .panelCard,.compactCard{padding:10px}
    .promoCard{min-height:118px;gap:8px}
    .promoContent{max-width:128px}
    .promoSub{font-size:11px;max-width:128px;line-height:1.25}
    .promoPosterWrap{min-width:98px}
    .promoPoster{width:96px;height:96px;padding:8px;transform:none}
    .promoPosterHeadline{font-size:14px;max-width:64px}
    .promoButton{margin-top:8px;height:34px;padding:0 12px;font-size:12px}
    .sidebarNav{grid-template-columns:1fr}
    .sidebarStoreThumb,.footerAvatar{width:34px;height:34px}
    .sidebarStoreName,.footerName{font-size:14px}
    .sidebarFooterProfile{display:none}
    .upgradeTitle{font-size:16px}
    .upgradeSub{font-size:13px}
    .topStatValue{font-size:20px}
    .salesBig{font-size:28px}
    .filterChips{margin-top:12px;gap:8px}
    .ordersTable{margin-top:12px;gap:10px}
    .loadMoreBtn{margin-top:6px}
  }
`;
