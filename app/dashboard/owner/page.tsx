'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Lang = 'en' | 'es';
type OwnerOrderLanguage = 'en' | 'es';
type FilterKey = 'all' | 'new' | 'yellow' | 'green';

type RestaurantRecord = {
  id: string;
  name: string | null;
  slug: string | null;
  plan: string | null;
  owner_email?: string | null;
  stripe_account_id?: string | null;
  theme?: string | null;
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

const copy = {
  en: {
    ownerControl: 'Owner Control',
    welcome: 'Welcome back',
    overview: 'Overview',
    quickActions: 'Quick Actions',
    search: 'Search',
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
    all: 'All',
    new: 'New',
    yellow: 'Yellow',
    green: 'Green',
    viewAll: 'View All',
    loading: 'Loading dashboard...',
    noStore: 'Store not found yet',
    signOut: 'Sign Out',
  },
  es: {
    ownerControl: 'Control del dueño',
    welcome: 'Bienvenido de nuevo',
    overview: 'Resumen',
    quickActions: 'Acciones rápidas',
    search: 'Buscar',
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
    all: 'Todo',
    new: 'Nuevo',
    yellow: 'Amarillo',
    green: 'Verde',
    viewAll: 'Ver todo',
    loading: 'Cargando dashboard...',
    noStore: 'Todavía no hay tienda',
    signOut: 'Cerrar sesión',
  },
} as const;

function currency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function parseStatusTone(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return 'red';
  if (s.includes('ready')) return 'green';
  if (s.includes('prep') || s.includes('almost')) return 'yellow';
  return 'neutral';
}

function shortTime(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function DashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const [orderLanguage, setOrderLanguage] = useState<OwnerOrderLanguage>('en');
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [restaurant, setRestaurant] = useState<RestaurantRecord | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [stripe, setStripe] = useState({ connected: false, onboardingComplete: false, chargesEnabled: false, payoutsEnabled: false });
  const [liveFilter, setLiveFilter] = useState<FilterKey>('all');
  const [billingFilter, setBillingFilter] = useState<FilterKey>('all');
  const t = copy[lang];

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          router.push('/auth/login');
          return;
        }
        const metaName = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '';
        const metaBusiness = typeof user.user_metadata?.business_name === 'string' ? user.user_metadata.business_name : '';
        if (mounted) setOwnerName(metaName || metaBusiness || 'Owner');

        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name, slug, plan, owner_email, stripe_account_id, theme')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (restaurantError) throw restaurantError;
        const r = restaurantData as RestaurantRecord | null;
        if (mounted) setRestaurant(r);

        if (r?.id) {
          const [itemsRes, ordersRes, stripeRes] = await Promise.all([
            supabase.from('menu_items').select('id, restaurant_id, name, price, description, image_url, created_at').eq('restaurant_id', r.id).order('created_at', { ascending: false }),
            supabase.from('orders').select('id, restaurant_id, customer_name, total, status, created_at, items_summary').eq('restaurant_id', r.id).order('created_at', { ascending: false }).limit(50),
            fetch(`/api/connect/status?restaurantId=${r.id}`).then(async (res) => res.ok ? res.json() : null).catch(() => null),
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
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [router]);

  const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const todaySales = orders
    .filter((o) => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    })
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const todayOrders = orders.filter((o) => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const byDay = new Map<string, number>();
  const chartSource = orders.slice().reverse();
  chartSource.forEach((order) => {
    const d = order.created_at ? new Date(order.created_at) : new Date();
    const key = d.toLocaleDateString('en-US', { weekday: 'short' });
    byDay.set(key, (byDay.get(key) || 0) + Number(order.total || 0));
  });
  const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const chartData = weekdays.map((day) => ({ day, value: byDay.get(day) || 0 }));
  const revenueTrend = chartData.length > 1 ? (() => {
    const first = chartData[0].value || 1;
    const last = chartData[chartData.length - 1].value || 0;
    return (((last - first) / first) * 100);
  })() : 0;

  const liveOrders = orders.filter((order) => {
    const tone = parseStatusTone(order.status);
    if ((order.status || '').toLowerCase().includes('cancel')) return false;
    if (liveFilter === 'all' || liveFilter === 'new') return true;
    return tone === liveFilter;
  }).slice(0, 6);

  const billingOrders = orders.filter((order) => {
    const tone = parseStatusTone(order.status);
    if (billingFilter === 'all' || billingFilter === 'new') return true;
    return tone === billingFilter;
  }).slice(0, 4);

  const cancelledOrders = orders.filter((order) => (order.status || '').toLowerCase().includes('cancel')).slice(0, 4);

  const storeLink = restaurant?.slug ? `/store/${restaurant.slug}` : '#';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  async function handleSetOrderLanguage(next: OwnerOrderLanguage) {
    setOrderLanguage(next);
    if (!restaurant?.id) return;
    await supabase.from('restaurants').update({ order_language: next }).eq('id', restaurant.id);
  }

  if (loading) {
    return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f4f4f6',fontFamily:'Inter, sans-serif',color:'#111827',fontWeight:700}}>{t.loading}</main>;
  }

  return (
    <main className="page">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">M</div><div className="brandName">MenuFlow</div></div>
        <nav className="nav">
          <Link href="/dashboard" className="navItem active">{t.dashboard}</Link>
          <Link href="/dashboard/owner/orders" className="navItem">{t.liveOrders}</Link>
          <Link href="/dashboard/owner/builder" className="navItem">{t.menuBuilder}</Link>
          <a href="#billing" className="navItem">{t.payments}</a>
          <a href="#owner-info" className="navItem">{t.ownerInfo}</a>
          <Link href="/dashboard/owner/settings" className="navItem">{t.storeSettings}</Link>
        </nav>
        <div className="sidebarBottom">
          <Link href={storeLink} className="storeBtn">{t.openStorefront}</Link>
          <button className="signOutBtn" onClick={handleSignOut}>{t.signOut}</button>
        </div>
      </aside>

      <section className="shell">
        <header className="topbar">
          <div>
            <div className="ownerControl">{t.ownerControl}</div>
            <div className="welcome">{t.welcome}, {ownerName}</div>
          </div>
          <div className="controls">
            <div className="pillGroup">
              <button className={lang==='en'?'active':''} onClick={()=>setLang('en')}>EN</button>
              <button className={lang==='es'?'active':''} onClick={()=>setLang('es')}>ES</button>
            </div>
            <div className="pillGroup">
              <button className={orderLanguage==='en'?'active':''} onClick={()=>handleSetOrderLanguage('en')}>EN</button>
              <button className={orderLanguage==='es'?'active':''} onClick={()=>handleSetOrderLanguage('es')}>ES</button>
            </div>
            <input className="search" placeholder={t.search} />
            <Link href="/dashboard/owner/builder" className="actionBtn">{t.openBuilder}</Link>
            <Link href={storeLink} className="actionBtn">{t.viewStore}</Link>
          </div>
        </header>

        <section className="content">
          <div className="heading"><h1>{t.overview}</h1><p>{t.quickActions}</p></div>
          <div className="stats">
            <Stat label={t.todaySales} value={currency(todaySales)} />
            <Stat label={t.todayOrders} value={String(todayOrders)} />
            <Stat label={t.menuItems} value={String(menuItems.length)} />
            <Stat label={t.revenueTrend} value={`${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`} suffix={t.thisWeek} accent />
          </div>

          <section className="card chartCard">
            <div className="cardHeader"><h2>{t.salesOverview}</h2><div className="tabs"><button className="tab active">{t.thisWeek}</button><button className="tab">{t.lastWeek}</button><button className="tab">{t.thisMonth}</button><button className="tab">{t.lastMonth}</button></div></div>
            <div className="chartWrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top:10,right:16,left:-18,bottom:0}}>
                  <defs><linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#84d7d2" stopOpacity={0.34}/><stop offset="100%" stopColor="#84d7d2" stopOpacity={0.02}/></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#edf0f4" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fill:'#7e8897',fontSize:13}} />
                  <YAxis tickLine={false} axisLine={false} tick={{fill:'#9aa4b0',fontSize:12}} tickFormatter={(v:number)=>`$${v}`} width={48} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#63c9c6" strokeWidth={3} fill="url(#fillRev)" dot={{stroke:'#9adfdc',fill:'#fff',r:4,strokeWidth:2}} activeDot={{fill:'#63c9c6',stroke:'#fff',r:6,strokeWidth:3}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="bottomGrid">
            <section className="card">
              <div className="cardHeader"><h2>{t.liveOrders}</h2><Link href="/dashboard/owner/orders" className="smallBtn">{t.viewAll}</Link></div>
              <div className="filterRow">{['all','new','yellow','green'].map((k)=> <button key={k} className={`filterBtn ${liveFilter===k?'active':''}`} onClick={()=>setLiveFilter(k as FilterKey)}>{t[k as keyof typeof t]}</button>)}</div>
              <div className="list">{liveOrders.map((order)=> <OrderCard key={order.id} order={order} />)}</div>
            </section>
            <section id="billing" className="card">
              <div className="cardHeader"><h2>{t.billing}</h2></div>
              <div className="filterRow">{['all','new','yellow','green'].map((k)=> <button key={k} className={`filterBtn ${billingFilter===k?'active':''}`} onClick={()=>setBillingFilter(k as FilterKey)}>{t[k as keyof typeof t]}</button>)}</div>
              <div className="billingBlock"><div className="billingTitle">{t.stripeStatus}</div><div className="connectedRow"><span className="connectedPill">{stripe.connected ? t.connected : t.incomplete}</span><span className="connectedPill">{stripe.payoutsEnabled ? t.connected : t.incomplete}</span></div></div>
              <div className="list">{billingOrders.map((order)=> <OrderCard key={order.id} order={order} />)}</div>
            </section>
          </div>

          <section id="owner-info" className="card cancelCard">
            <div className="cardHeader"><h2>{t.cancelledOrders}</h2></div>
            <div className="list">{cancelledOrders.map((order)=> <OrderCard key={order.id} order={order} />)}</div>
            {!cancelledOrders.length && <div className="empty">No cancelled orders</div>}
          </section>
        </section>
      </section>

      <style jsx>{`
        :global(html), :global(body) { margin:0; padding:0; background:#efeff2; font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827; }
        :global(*) { box-sizing:border-box; }
        :global(a) { text-decoration:none; color:inherit; }
        .page { min-height:100vh; background:radial-gradient(circle at top, rgba(255,255,255,.86), rgba(240,241,244,.94)); padding:28px; }
        .sidebar { position:fixed; top:36px; left:36px; bottom:36px; width:212px; background:rgba(255,255,255,.9); backdrop-filter:blur(10px); border:1px solid #e8ebef; border-radius:24px; box-shadow:0 20px 60px rgba(20,23,28,.05); display:flex; flex-direction:column; overflow:hidden; }
        .brand { display:flex; align-items:center; gap:12px; padding:22px 20px 18px; }
        .brandMark { width:38px; height:38px; border-radius:14px; background:#0f172a; color:#fff; display:grid; place-items:center; font-weight:700; font-size:1.05rem; }
        .brandName { font-size:1.08rem; font-weight:700; color:#111827; }
        .nav { padding:16px 12px; display:grid; gap:6px; }
        .navItem { display:flex; align-items:center; min-height:48px; padding:0 14px; border-radius:14px; color:#4b5563; font-size:1rem; font-weight:500; }
        .navItem:hover { background:#f8fafb; }
        .navItem.active { background:#f1f4f7; color:#111827; box-shadow: inset 1px 0 0 #111827; }
        .sidebarBottom { margin-top:auto; padding:14px; display:grid; gap:10px; }
        .storeBtn, .signOutBtn { display:flex; align-items:center; justify-content:center; gap:10px; min-height:48px; border:1px solid #e8ebef; border-radius:16px; background:#fff; color:#365f6f; font-weight:600; }
        .signOutBtn { color:#111827; cursor:pointer; }
        .shell { margin-left:236px; padding-left:24px; }
        .topbar { min-height:72px; background:rgba(255,255,255,.9); border:1px solid #e8ebef; border-radius:24px 24px 0 0; display:flex; align-items:center; justify-content:space-between; padding:0 24px; box-shadow:0 10px 30px rgba(20,23,28,.04); gap:16px; }
        .ownerControl { color:#505866; font-size:.95rem; font-weight:600; }
        .welcome { color:#111827; font-size:1.4rem; font-weight:700; letter-spacing:-.03em; margin-top:4px; }
        .controls { display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
        .pillGroup { display:inline-flex; align-items:center; background:#fff; border:1px solid #e5e9ee; border-radius:12px; padding:3px; box-shadow:0 8px 20px rgba(20,23,28,.03); }
        .pillGroup button { min-width:42px; height:36px; border-radius:10px; color:#606977; font-weight:600; padding:0 14px; border:0; background:transparent; cursor:pointer; }
        .pillGroup button.active { background:#f2f6f8; color:#111827; }
        .search { height:42px; min-width:200px; padding:0 14px; background:#fff; border:1px solid #e5e9ee; border-radius:12px; }
        .actionBtn { height:42px; padding:0 16px; display:inline-flex; align-items:center; justify-content:center; border:1px solid #e5e9ee; border-radius:12px; background:#fff; color:#111827; font-weight:600; box-shadow:0 8px 20px rgba(20,23,28,.03); }
        .content { background:rgba(255,255,255,.72); border:1px solid #e8ebef; border-top:0; border-radius:0 0 24px 24px; padding:18px; box-shadow:0 20px 60px rgba(20,23,28,.04); }
        .heading { margin-bottom:14px; }
        .heading h1 { margin:0; font-size:2rem; line-height:1; letter-spacing:-.03em; }
        .heading p { margin:6px 0 0; color:#7b8492; font-size:.96rem; }
        .stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:14px; }
        .card { background:rgba(255,255,255,.88); border:1px solid #e8ebef; border-radius:18px; box-shadow:0 14px 34px rgba(20,23,28,.04); padding:16px; }
        .chartCard { padding:14px 16px 12px; }
        .cardHeader { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
        .cardHeader h2 { margin:0; font-size:1.18rem; letter-spacing:-.03em; }
        .tabs, .filterRow { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .tab, .smallBtn, .filterBtn { min-height:36px; padding:0 14px; border-radius:12px; background:#fff; border:1px solid #e8ebef; color:#6b7280; font-weight:500; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; }
        .tab.active, .filterBtn.active { background:#eff6f5; color:#4f7f7e; border-color:#dce9e8; }
        .chartWrap { height:280px; width:100%; }
        .bottomGrid { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr); gap:14px; margin-top:14px; }
        .billingTitle { margin:0 0 12px; color:#111827; font-size:1rem; font-weight:700; }
        .connectedRow { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
        .connectedPill { min-height:38px; padding:0 14px; border-radius:12px; background:#f5fbfb; border:1px solid #dfeded; color:#4f7f7e; font-weight:600; display:inline-flex; align-items:center; gap:8px; }
        .list { display:grid; gap:12px; }
        .cancelCard { margin-top:14px; }
        .empty { color:#7f8795; font-size:.95rem; }
        @media (max-width: 1180px) { .page { padding:18px; } .sidebar { width:196px; left:18px; top:18px; bottom:18px; } .shell { margin-left:214px; padding-left:18px; } .stats { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width: 900px) { .sidebar { display:none; } .shell { margin-left:0; padding-left:0; } .topbar { border-radius:24px; } .content { border-top:1px solid #e8ebef; border-radius:24px; margin-top:12px; } .stats { grid-template-columns:repeat(2,minmax(0,1fr)); } .bottomGrid { grid-template-columns:1fr; } .welcome { font-size:1.15rem; } }
        @media (max-width: 560px) { .page { padding:12px; } .topbar { padding:14px; align-items:flex-start; } .search { min-width:0; width:100%; } .controls { width:100%; justify-content:flex-start; } .stats { grid-template-columns:1fr 1fr; } }
      `}</style>
    </main>
  );
}

function Stat({ label, value, suffix, accent }: { label:string; value:string; suffix?:string; accent?:boolean }) {
  return (
    <div className="statCard">
      <div className="statTitle">{label}</div>
      <div className="statValueRow">{accent ? <span className="trendArrow">↑</span> : null}<span className="statValue">{value}</span>{suffix ? <span className="statSuffix">{suffix}</span> : null}</div>
      <style jsx>{`
        .statCard { min-height:92px; padding:16px 18px; display:flex; flex-direction:column; justify-content:space-between; background:rgba(255,255,255,.88); border:1px solid #e8ebef; border-radius:18px; box-shadow:0 14px 34px rgba(20,23,28,.04); }
        .statTitle { color:#5e6674; font-size:.98rem; font-weight:500; }
        .statValueRow { display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
        .trendArrow { color:#66c7c4; font-size:1.2rem; line-height:1; transform:translateY(1px); }
        .statValue { color:#111827; font-weight:700; font-size:1.2rem; letter-spacing:-.02em; }
        .statSuffix { color:#606977; font-size:.96rem; font-weight:500; }
      `}</style>
    </div>
  );
}

function OrderCard({ order }: { order: OrderRecord }) {
  const tone = parseStatusTone(order.status);
  return (
    <div className="orderCard">
      <div className="orderTop"><div className="orderLeft"><div className="orderIdLine"><span className="orderId">{order.id}</span><span className="orderCustomer">{order.customer_name || 'Customer'}</span></div><div className="orderSummary">{order.items_summary || 'Order received'}</div></div><div className="orderRight"><div className="orderAmount">{currency(Number(order.total || 0))}</div><div className="orderTime">{shortTime(order.created_at)}</div></div></div>
      <div className="orderBottom"><span className={`statusPill status-${tone}`}>{order.status || 'Pending'}</span></div>
      <style jsx>{`
        .orderCard { border:1px solid #e8ebef; border-radius:16px; background:#fff; padding:14px 14px 12px; }
        .orderTop { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .orderLeft { min-width:0; }
        .orderIdLine { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
        .orderId { color:#3a404a; font-weight:700; font-size:.98rem; }
        .orderCustomer { color:#111827; font-weight:700; font-size:1.02rem; }
        .orderSummary { margin-top:6px; color:#636c79; font-size:.95rem; }
        .orderRight { text-align:right; flex-shrink:0; }
        .orderAmount { color:#111827; font-weight:800; font-size:1.06rem; }
        .orderTime { margin-top:6px; color:#7f8795; font-size:.9rem; }
        .orderBottom { margin-top:12px; }
        .statusPill { display:inline-flex; align-items:center; min-height:32px; padding:0 14px; border-radius:999px; font-size:.92rem; font-weight:600; border:1px solid transparent; }
        .status-yellow { background:#f4ead0; color:#8a6a28; border-color:#ecddb8; }
        .status-green { background:#ddf3e7; color:#377b59; border-color:#cfead9; }
        .status-red { background:#f9d9dc; color:#b44c57; border-color:#f2c4ca; }
        .status-neutral { background:#eef2f5; color:#64707d; border-color:#dbe3e9; }
      `}</style>
    </div>
  );
}
