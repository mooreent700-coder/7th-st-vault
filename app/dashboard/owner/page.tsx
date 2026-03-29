'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Lang = 'en' | 'es';
type StoreTheme = 'light' | 'dark';
type BillingState = 'good' | 'warning' | 'overdue';
type OrderStage = 'placed' | 'preparing' | 'ready' | 'cancelled';

type AuthPayload = {
  user?: {
    email?: string;
  };
};

type Restaurant = {
  id: string;
  name?: string | null;
  slug?: string | null;
  phone?: string | null;
  address?: string | null;
  hours?: string | null;
  stripe_account_id?: string | null;
  billing_due_date?: string | null;
  billing_paid?: boolean | null;
  order_language?: Lang | null;
  store_theme?: StoreTheme | null;
};

type MenuItem = {
  id: string;
  name?: string | null;
  price?: number | string | null;
  description?: string | null;
  image_url?: string | null;
};

type RawOrderRow = {
  id: string;
  total?: number | string | null;
  created_at?: string | null;
  customer_name?: string | null;
  payment_status?: string | null;
  status?: string | null;
  items?: unknown;
};

type OrderRow = {
  id: string;
  total: number;
  created_at?: string | null;
  customer_name: string;
  payment_status?: string | null;
  status: OrderStage;
  items: Array<{ name: string; quantity: number }>;
};

type StripeStatus = {
  connected?: boolean;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  platformFeePercent?: number | null;
};

const copy = {
  en: {
    brand: 'MenuFlow',
    dashboard: 'Owner Dashboard',
    welcome: 'Welcome back',
    subtitle: 'Manage your menu, live orders, billing, and store settings in one place.',
    signedInAs: 'Signed in as',
    loading: 'Loading dashboard...',
    noRestaurant: 'No restaurant found for this account yet.',
    noSlug: 'Save your store slug first to open the live store.',
    couldNotLoadDashboard: 'Could not load dashboard.',
    couldNotLoadStripe: 'Could not load Stripe status.',
    couldNotSaveBusiness: 'Could not save business information.',
    saved: 'Saved.',
    saving: 'Saving...',
    navDashboard: 'Dashboard',
    navBuilder: 'Builder',
    navOrders: 'Orders',
    navPayments: 'Payments',
    navStore: 'Store',
    navRefresh: 'Refresh',
    navLogout: 'Logout',
    openBuilder: 'Open Menu Builder',
    viewStore: 'View Store',
    liveOrders: 'Live Orders',
    sendReadyNotice: 'When an order turns green, the customer gets a ready notification.',
    placed: 'Placed',
    preparing: 'Almost Ready',
    ready: 'Ready To Go',
    cancelled: 'Cancelled',
    startOrder: 'Start Order',
    markReady: 'Mark Ready',
    remove: 'Remove',
    yourMenu: 'Your Menu',
    noItems: 'No menu items yet.',
    recentOrders: 'Recent Orders',
    noOrders: 'No orders yet.',
    businessInfo: 'Business Information',
    businessName: 'Business Name',
    storeSlug: 'Store Slug',
    phoneNumber: 'Phone Number',
    address: 'Address',
    hours: 'Hours',
    saveBusiness: 'Save Business Information',
    settings: 'Owner Settings',
    orderLanguage: 'Order Language',
    english: 'English',
    spanish: 'Spanish',
    storeTheme: 'Store Theme',
    light: 'Light',
    dark: 'Dark',
    todaySales: "Today's Sales",
    todayOrders: "Today's Orders",
    menuItems: 'Menu Items',
    stripeStatus: 'Stripe Status',
    connected: 'Connected',
    notConnected: 'Not Connected',
    payments: 'Payments',
    paymentsText: 'Connect Stripe to keep direct ordering live.',
    refreshStripe: 'Refresh Stripe Status',
    stripeLoading: 'Loading Stripe...',
    billing: 'MenuFlow Billing',
    paymentRequired: 'Payment required to continue',
    cancelledOrders: 'Cancelled Orders',
    platformFee: 'Platform Fee',
    onboarding: 'Onboarding',
    chargesEnabled: 'Charges Enabled',
    payoutsEnabled: 'Payouts Enabled',
    liveStorePreview: 'Live Store Preview',
    paidGood: 'Paid / Active',
    dueSoon: '7 days before due date',
    dueNow: 'Payment Due',
    goToPayment: 'Go To Payment',
    lockedOut: 'Dashboard locked until MenuFlow payment is completed.',
  },
  es: {
    brand: 'MenuFlow',
    dashboard: 'Panel del Dueño',
    welcome: 'Bienvenido de nuevo',
    subtitle: 'Administra tu menú, órdenes en vivo, facturación y configuración de tienda en un solo lugar.',
    signedInAs: 'Sesión iniciada como',
    loading: 'Cargando panel...',
    noRestaurant: 'Todavía no se encontró un restaurante para esta cuenta.',
    noSlug: 'Primero guarda el slug de tu tienda para abrirla en vivo.',
    couldNotLoadDashboard: 'No se pudo cargar el panel.',
    couldNotLoadStripe: 'No se pudo cargar el estado de Stripe.',
    couldNotSaveBusiness: 'No se pudo guardar la información del negocio.',
    saved: 'Guardado.',
    saving: 'Guardando...',
    navDashboard: 'Panel',
    navBuilder: 'Constructor',
    navOrders: 'Órdenes',
    navPayments: 'Pagos',
    navStore: 'Tienda',
    navRefresh: 'Actualizar',
    navLogout: 'Salir',
    openBuilder: 'Abrir Constructor de Menú',
    viewStore: 'Ver Tienda',
    liveOrders: 'Órdenes en Vivo',
    sendReadyNotice: 'Cuando una orden se pone verde, el cliente recibe notificación.',
    placed: 'Recibido',
    preparing: 'Casi Listo',
    ready: 'Listo',
    cancelled: 'Cancelado',
    startOrder: 'Iniciar Pedido',
    markReady: 'Marcar Listo',
    remove: 'Eliminar',
    yourMenu: 'Tu Menú',
    noItems: 'Todavía no hay artículos.',
    recentOrders: 'Órdenes Recientes',
    noOrders: 'Todavía no hay órdenes.',
    businessInfo: 'Información del Negocio',
    businessName: 'Nombre del Negocio',
    storeSlug: 'Slug de Tienda',
    phoneNumber: 'Número de Teléfono',
    address: 'Dirección',
    hours: 'Horario',
    saveBusiness: 'Guardar Información del Negocio',
    settings: 'Configuración del Dueño',
    orderLanguage: 'Idioma de Pedidos',
    english: 'Inglés',
    spanish: 'Español',
    storeTheme: 'Tema de Tienda',
    light: 'Claro',
    dark: 'Oscuro',
    todaySales: 'Ventas de Hoy',
    todayOrders: 'Órdenes de Hoy',
    menuItems: 'Artículos del Menú',
    stripeStatus: 'Estado de Stripe',
    connected: 'Conectado',
    notConnected: 'No Conectado',
    payments: 'Pagos',
    paymentsText: 'Conecta Stripe para mantener pedidos directos en vivo.',
    refreshStripe: 'Actualizar Estado Stripe',
    stripeLoading: 'Cargando Stripe...',
    billing: 'Facturación MenuFlow',
    paymentRequired: 'Pago requerido para continuar',
    cancelledOrders: 'Órdenes Canceladas',
    platformFee: 'Tarifa de Plataforma',
    onboarding: 'Onboarding',
    chargesEnabled: 'Cobros Habilitados',
    payoutsEnabled: 'Pagos Habilitados',
    liveStorePreview: 'Vista Previa de la Tienda',
    paidGood: 'Pagado / Activo',
    dueSoon: 'Faltan 7 días',
    dueNow: 'Pago Vencido',
    goToPayment: 'Ir al Pago',
    lockedOut: 'Panel bloqueado hasta que el pago de MenuFlow sea completado.',
  },
} as const;

function dayKey(value: string) {
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseItems(items: unknown): Array<{ name: string; quantity: number }> {
  if (Array.isArray(items)) {
    return items.map((item: any) => ({
      name: String(item?.name || item?.title || 'Item'),
      quantity: Math.max(1, Number(item?.quantity || item?.qty || 1)),
    }));
  }
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          name: String(item?.name || item?.title || 'Item'),
          quantity: Math.max(1, Number(item?.quantity || item?.qty || 1)),
        }));
      }
    } catch {}
  }
  return [];
}

function normalizeStatus(raw?: string | null): OrderStage {
  const value = String(raw || '').toLowerCase();
  if (['ready', 'complete', 'completed', 'done', 'green'].includes(value)) return 'ready';
  if (['preparing', 'in_progress', 'in progress', 'almost_ready', 'almost ready', 'yellow'].includes(value)) return 'preparing';
  if (['cancelled', 'canceled'].includes(value)) return 'cancelled';
  return 'placed';
}

function billingState(restaurant: Restaurant | null): BillingState {
  if (restaurant?.billing_paid) return 'good';
  if (!restaurant?.billing_due_date) return 'good';
  const due = new Date(restaurant.billing_due_date);
  if (Number.isNaN(due.getTime())) return 'good';
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.ceil((due.getTime() - start.getTime()) / 86400000);
  if (diffDays <= 0) return 'overdue';
  if (diffDays <= 7) return 'warning';
  return 'good';
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const t = copy[lang];
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [orderLanguage, setOrderLanguage] = useState<Lang>('en');
  const [storeTheme, setStoreTheme] = useState<StoreTheme>('light');

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      setMessage('');

      const authRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const authPayload: AuthPayload = await authRes.json().catch(() => ({}));
      const email = authPayload?.user?.email || '';
      setUserEmail(email);

      if (!email) {
        throw new Error(t.couldNotLoadDashboard);
      }

      const restaurantRes = await fetch(`/api/restaurants/by-owner-email?email=${encodeURIComponent(email)}`, {
        cache: 'no-store',
      });
      const restaurantPayload = await restaurantRes.json().catch(() => ({}));
      const currentRestaurant: Restaurant | null = restaurantPayload?.restaurant || null;
      setRestaurant(currentRestaurant);

      if (!currentRestaurant?.id) {
        setLoading(false);
        setMessage(t.noRestaurant);
        return;
      }

      setBusinessName(currentRestaurant.name || '');
      setStoreSlug(currentRestaurant.slug || '');
      setPhoneNumber(currentRestaurant.phone || '');
      setBusinessAddress(currentRestaurant.address || '');
      setBusinessHours(currentRestaurant.hours || '');
      setOrderLanguage(currentRestaurant.order_language || 'en');
      setStoreTheme(currentRestaurant.store_theme || 'light');

      const [menuRes, ordersRes] = await Promise.all([
        fetch(`/api/menu-items/by-restaurant?restaurantId=${encodeURIComponent(currentRestaurant.id)}`, { cache: 'no-store' }),
        fetch(`/api/orders/by-restaurant?restaurantId=${encodeURIComponent(currentRestaurant.id)}`, { cache: 'no-store' }),
      ]);

      const menuPayload = await menuRes.json().catch(() => ({}));
      const ordersPayload = await ordersRes.json().catch(() => ({}));

      setMenuItems(Array.isArray(menuPayload?.items) ? menuPayload.items : []);

      const normalizedOrders: OrderRow[] = Array.isArray(ordersPayload?.orders)
        ? ordersPayload.orders.map((order: RawOrderRow) => ({
            id: order.id,
            total: Number(order.total || 0),
            created_at: order.created_at,
            customer_name: String(order.customer_name || 'Guest'),
            payment_status: order.payment_status || undefined,
            status: normalizeStatus(order.status || order.payment_status),
            items: parseItems(order.items),
          }))
        : [];

      setOrders(normalizedOrders);

      await refreshStripeStatus(currentRestaurant.id);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      setMessage(error?.message || t.couldNotLoadDashboard);
    }
  }

  async function refreshStripeStatus(restaurantIdOverride?: string) {
    const restaurantId = restaurantIdOverride || restaurant?.id;
    if (!restaurantId) return;
    try {
      setStripeLoading(true);
      const response = await fetch('/api/connect/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || t.couldNotLoadStripe);
      setStripeStatus(payload);
    } catch (error: any) {
      setMessage(error?.message || t.couldNotLoadStripe);
    } finally {
      setStripeLoading(false);
    }
  }

  async function handleSaveBusiness() {
    if (!restaurant?.id) return;
    try {
      setSavingBusiness(true);
      setMessage('');

      const body = {
        id: restaurant.id,
        name: businessName,
        slug: storeSlug,
        phone: phoneNumber,
        address: businessAddress,
        hours: businessHours,
        order_language: orderLanguage,
        store_theme: storeTheme,
      };

      const response = await fetch('/api/restaurants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || t.couldNotSaveBusiness);
      }

      setRestaurant((current) =>
        current
          ? {
              ...current,
              name: businessName,
              slug: storeSlug,
              phone: phoneNumber,
              address: businessAddress,
              hours: businessHours,
              order_language: orderLanguage,
              store_theme: storeTheme,
            }
          : current
      );
      setMessage(t.saved);
    } catch (error: any) {
      setMessage(error?.message || t.couldNotSaveBusiness);
    } finally {
      setSavingBusiness(false);
    }
  }

  async function updateOrderStage(orderId: string, stage: OrderStage) {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: stage } : order))
    );

    if (stage === 'ready') {
      const readyMessage =
        orderLanguage === 'es'
          ? '¡Tu pedido está listo para recoger! 🎉'
          : 'Your order is ready for pickup! 🎉';
      setMessage(readyMessage);
    }

    try {
      await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: stage }),
      });
    } catch {}
  }

  function removeMenuItem(itemId: string) {
    setMenuItems((current) => current.filter((item) => item.id !== itemId));
  }

  function handleViewStore() {
    const slug = restaurant?.slug || storeSlug;
    if (!slug) {
      setMessage(t.noSlug);
      return;
    }
    router.push(`/store/${slug}`);
  }

  const billing = billingState(restaurant);
  const dashboardLocked = billing === 'overdue';

  const todaySales = useMemo(() => {
    const today = dayKey(new Date().toISOString());
    return orders.reduce((sum, order) => {
      if (!order.created_at) return sum;
      if (dayKey(order.created_at) !== today) return sum;
      return sum + Number(order.total || 0);
    }, 0);
  }, [orders]);

  const todayOrders = useMemo(() => {
    const today = dayKey(new Date().toISOString());
    return orders.filter((order) => order.created_at && dayKey(order.created_at) === today).length;
  }, [orders]);

  const liveOrders = orders.filter((order) => order.status !== 'cancelled');
  const cancelledOrders = orders.filter((order) => order.status === 'cancelled');

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <main className="mf-page">
      <div className="mf-wrap">
        <header className="mf-header">
          <div>
            <div className="mf-brand">{t.brand}</div>
            <h1>{t.welcome}</h1>
            <p>{t.subtitle}</p>
            <small>{t.signedInAs}: <strong>{userEmail || '--'}</strong></small>
          </div>

          <div className="mf-actions">
            <div className="mf-toggleRow">
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
              <button className={lang === 'es' ? 'active' : ''} onClick={() => setLang('es')}>ES</button>
            </div>
            <div className="mf-toggleRow">
              <button onClick={() => router.push('/dashboard/owner/builder')}>{t.openBuilder}</button>
              <button onClick={handleViewStore}>{t.viewStore}</button>
            </div>
          </div>
        </header>

        <section className="mf-statGrid">
          <div className="mf-stat"><span>{t.todaySales}</span><strong>${todaySales.toFixed(2)}</strong></div>
          <div className="mf-stat"><span>{t.todayOrders}</span><strong>{todayOrders}</strong></div>
          <div className="mf-stat"><span>{t.menuItems}</span><strong>{menuItems.length}</strong></div>
          <div className="mf-stat"><span>{t.stripeStatus}</span><strong>{stripeStatus?.connected ? t.connected : t.notConnected}</strong></div>
        </section>

        <section className="mf-grid">
          <div className="mf-card">
            <h2>{t.liveOrders}</h2>
            <p className="mf-help">{t.sendReadyNotice}</p>

            {dashboardLocked ? (
              <div className="mf-lockBox mf-red">
                <strong>{t.paymentRequired}</strong>
                <p>{t.lockedOut}</p>
                <button>{t.goToPayment}</button>
              </div>
            ) : liveOrders.length === 0 ? (
              <div className="mf-empty">{t.noOrders}</div>
            ) : (
              <div className="mf-list">
                {liveOrders.map((order) => (
                  <div className={`mf-order ${statusClass(order.status)}`} key={order.id}>
                    <div className="mf-orderTop">
                      <div>
                        <strong>#{order.id.slice(0, 8)} • {order.customer_name}</strong>
                        <div className="mf-orderItems">
                          {order.items.length
                            ? order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')
                            : 'Items not available'}
                        </div>
                      </div>
                      <div className="mf-orderRight">
                        <div className="mf-orderTotal">${order.total.toFixed(2)}</div>
                        <div className="mf-statusText">
                          {order.status === 'placed'
                            ? t.placed
                            : order.status === 'preparing'
                            ? t.preparing
                            : order.status === 'ready'
                            ? t.ready
                            : t.cancelled}
                        </div>
                      </div>
                    </div>

                    <div className="mf-orderButtons">
                      {order.status === 'placed' && (
                        <button className="mf-yellowBtn" onClick={() => void updateOrderStage(order.id, 'preparing')}>
                          {t.startOrder}
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button className="mf-greenBtn" onClick={() => void updateOrderStage(order.id, 'ready')}>
                          {t.markReady}
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <span className="mf-readyTag">{t.ready}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mf-stack">
            <div className="mf-card">
              <h2>{t.businessInfo}</h2>
              <div className="mf-fields">
                <label><span>{t.businessName}</span><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></label>
                <label><span>{t.storeSlug}</span><input value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} /></label>
                <label><span>{t.phoneNumber}</span><input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></label>
                <label><span>{t.address}</span><input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} /></label>
                <label><span>{t.hours}</span><input value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} /></label>
              </div>
              <button className="mf-blackBtn" onClick={() => void handleSaveBusiness()}>
                {savingBusiness ? t.saving : t.saveBusiness}
              </button>
            </div>

            <div className="mf-card">
              <h2>{t.settings}</h2>
              <div className="mf-settingRow">
                <span>{t.orderLanguage}</span>
                <div className="mf-toggleRow">
                  <button className={orderLanguage === 'en' ? 'active' : ''} onClick={() => setOrderLanguage('en')}>
                    {t.english}
                  </button>
                  <button className={orderLanguage === 'es' ? 'active' : ''} onClick={() => setOrderLanguage('es')}>
                    {t.spanish}
                  </button>
                </div>
              </div>

              <div className="mf-settingRow">
                <span>{t.storeTheme}</span>
                <div className="mf-toggleRow">
                  <button className={storeTheme === 'light' ? 'active' : ''} onClick={() => setStoreTheme('light')}>
                    {t.light}
                  </button>
                  <button className={storeTheme === 'dark' ? 'active' : ''} onClick={() => setStoreTheme('dark')}>
                    {t.dark}
                  </button>
                </div>
              </div>

              <div className={`mf-billing ${billing === 'good' ? 'mf-green' : billing === 'warning' ? 'mf-yellow' : 'mf-red'}`}>
                <strong>{t.billing}</strong>
                <p>
                  {billing === 'good'
                    ? t.paidGood
                    : billing === 'warning'
                    ? t.dueSoon
                    : t.dueNow}
                </p>
              </div>
            </div>

            <div className="mf-card">
              <h2>{t.payments}</h2>
              <p className="mf-help">{t.paymentsText}</p>
              <div className="mf-miniStats">
                <div><span>{t.platformFee}</span><strong>{typeof stripeStatus?.platformFeePercent === 'number' ? `${stripeStatus.platformFeePercent}%` : '--'}</strong></div>
                <div><span>{t.onboarding}</span><strong>{stripeStatus?.onboardingComplete ? t.connected : t.notConnected}</strong></div>
                <div><span>{t.chargesEnabled}</span><strong>{stripeStatus?.chargesEnabled ? t.connected : '--'}</strong></div>
                <div><span>{t.payoutsEnabled}</span><strong>{stripeStatus?.payoutsEnabled ? t.connected : '--'}</strong></div>
              </div>
              <button className="mf-blackBtn" onClick={() => void refreshStripeStatus()}>
                {stripeLoading ? t.stripeLoading : t.refreshStripe}
              </button>
            </div>

            <div className="mf-card">
              <h2>{t.yourMenu}</h2>
              {menuItems.length === 0 ? (
                <div className="mf-empty">{t.noItems}</div>
              ) : (
                <div className="mf-list">
                  {menuItems.map((item) => (
                    <div className="mf-menuRow" key={item.id}>
                      <div>
                        <strong>{item.name || 'Item'}</strong>
                        <div className="mf-menuMeta">${Number(item.price || 0).toFixed(2)}</div>
                      </div>
                      <button className="mf-redBtn" onClick={() => removeMenuItem(item.id)}>
                        {t.remove}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cancelledOrders.length > 0 && (
              <div className="mf-card">
                <h2>{t.cancelledOrders}</h2>
                <div className="mf-list">
                  {cancelledOrders.map((order) => (
                    <div className="mf-order mf-status-red" key={order.id}>
                      <strong>#{order.id.slice(0, 8)} • {order.customer_name}</strong>
                      <div className="mf-orderMeta">${order.total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mf-card">
              <h2>{t.liveStorePreview}</h2>
              <p className="mf-help">/store/{restaurant?.slug || storeSlug || '--'}</p>
              <button className="mf-blackBtn" onClick={handleViewStore}>{t.viewStore}</button>
            </div>
          </div>
        </section>

        {message ? <div className="mf-message">{message}</div> : null}
      </div>

      <style jsx>{`
        .mf-page {
          min-height: 100vh;
          background: #f3f1eb;
          color: #111111;
          padding: 18px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .mf-wrap {
          max-width: 1280px;
          margin: 0 auto;
        }
        .mf-header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
          background: #ffffff;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
        .mf-brand {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.02em;
        }
        h1 {
          margin: 10px 0 0 0;
          font-size: clamp(36px, 6vw, 60px);
          line-height: 0.98;
        }
        p {
          margin: 10px 0 0 0;
        }
        small {
          display: block;
          margin-top: 12px;
          color: #666;
        }
        .mf-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 260px;
        }
        .mf-toggleRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .mf-toggleRow button,
        .mf-blackBtn,
        .mf-redBtn,
        .mf-yellowBtn,
        .mf-greenBtn,
        .mf-lockBox button {
          appearance: none;
          border: none;
          border-radius: 16px;
          padding: 14px 18px;
          font-weight: 800;
          cursor: pointer;
        }
        .mf-toggleRow button {
          background: #ebe7de;
          color: #111;
        }
        .mf-toggleRow button.active {
          background: #111;
          color: #fff;
        }
        .mf-blackBtn {
          width: 100%;
          background: #111;
          color: #fff;
        }
        .mf-redBtn {
          background: #d92d20;
          color: #fff;
        }
        .mf-yellowBtn {
          background: #f4b400;
          color: #111;
        }
        .mf-greenBtn {
          background: #159947;
          color: #fff;
        }
        .mf-statGrid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .mf-stat {
          background: #ffffff;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
        .mf-stat span {
          display: block;
          color: #666;
          font-size: 14px;
          font-weight: 700;
        }
        .mf-stat strong {
          display: block;
          margin-top: 12px;
          font-size: 30px;
          line-height: 1.05;
        }
        .mf-grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
        }
        .mf-stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .mf-card {
          background: #ffffff;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
        .mf-card h2 {
          margin: 0 0 14px 0;
          font-size: 28px;
          line-height: 1.05;
        }
        .mf-help {
          color: #666;
          line-height: 1.6;
        }
        .mf-fields {
          display: grid;
          gap: 12px;
          margin-bottom: 14px;
        }
        .mf-fields label span {
          display: block;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .mf-fields input {
          width: 100%;
          box-sizing: border-box;
          height: 52px;
          border-radius: 14px;
          border: 1px solid #ddd6cb;
          background: #faf8f3;
          padding: 0 14px;
          font-size: 16px;
        }
        .mf-settingRow {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          margin-bottom: 14px;
        }
        .mf-billing {
          border-radius: 18px;
          padding: 16px;
          font-weight: 700;
        }
        .mf-green {
          background: #eaf7ee;
          color: #116b31;
        }
        .mf-yellow {
          background: #fff6d9;
          color: #8a6300;
        }
        .mf-red {
          background: #fdecea;
          color: #8f1d18;
        }
        .mf-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mf-order,
        .mf-menuRow {
          border-radius: 18px;
          padding: 14px;
          background: #faf8f3;
          border: 1px solid #ebe4da;
        }
        .mf-status-red {
          border-left: 8px solid #d92d20;
        }
        .mf-status-yellow {
          border-left: 8px solid #f4b400;
        }
        .mf-status-green {
          border-left: 8px solid #159947;
        }
        .mf-orderTop {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }
        .mf-orderItems,
        .mf-orderMeta,
        .mf-menuMeta {
          color: #666;
          margin-top: 6px;
          line-height: 1.5;
        }
        .mf-orderTotal {
          font-weight: 900;
        }
        .mf-statusText {
          font-weight: 900;
          margin-top: 6px;
        }
        .mf-orderButtons {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .mf-readyTag {
          display: inline-block;
          background: #eaf7ee;
          color: #116b31;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 900;
        }
        .mf-menuRow {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
        }
        .mf-empty {
          background: #faf8f3;
          border: 1px solid #ebe4da;
          border-radius: 18px;
          padding: 16px;
          color: #666;
          font-weight: 700;
        }
        .mf-miniStats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }
        .mf-miniStats div {
          background: #faf8f3;
          border: 1px solid #ebe4da;
          border-radius: 18px;
          padding: 14px;
        }
        .mf-miniStats span {
          display: block;
          color: #666;
          font-size: 13px;
          font-weight: 700;
        }
        .mf-miniStats strong {
          display: block;
          margin-top: 8px;
        }
        .mf-lockBox {
          border-radius: 18px;
          padding: 16px;
        }
        .mf-lockBox p {
          margin-top: 8px;
          margin-bottom: 12px;
        }
        .mf-message {
          margin-top: 18px;
          background: #111;
          color: #fff;
          border-radius: 18px;
          padding: 14px 16px;
          font-weight: 700;
        }
        @media (max-width: 1024px) {
          .mf-statGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .mf-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 680px) {
          .mf-page {
            padding: 12px;
          }
          .mf-header {
            flex-direction: column;
            padding: 22px;
          }
          .mf-actions {
            width: 100%;
            min-width: 0;
          }
          .mf-statGrid,
          .mf-miniStats {
            grid-template-columns: 1fr;
          }
          .mf-settingRow,
          .mf-orderTop,
          .mf-menuRow {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="mf-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

