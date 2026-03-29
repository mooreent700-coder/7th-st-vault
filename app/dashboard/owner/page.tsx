
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Lang = 'en' | 'es';

type AuthPayload = {
  user?: {
    id?: string;
    email?: string;
  };
};

type Restaurant = {
  id: string;
  owner_email?: string | null;
  name?: string | null;
  slug?: string | null;
  phone?: string | null;
  address?: string | null;
  hours?: string | null;
  stripe_account_id?: string | null;
};

type MenuItem = {
  id: string;
  name?: string | null;
  price?: number | string | null;
  description?: string | null;
  image_url?: string | null;
};

type OrderRow = {
  id: string;
  total?: number | string | null;
  created_at?: string | null;
  customer_name?: string | null;
  payment_status?: string | null;
};

type StripeStatus = {
  connected?: boolean;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  platformFeePercent?: number | null;
  stripe_account_id?: string | null;
};

const copy = {
  en: {
    brand: 'MenuFlow',
    eyebrow: 'Owner Dashboard',
    welcome: 'Welcome back',
    subtitle: 'Run your business, menu, payments, and live orders from one place.',
    signedInAs: 'Signed in as',
    loading: 'Loading dashboard...',
    noRestaurant: 'No restaurant found for this account yet.',
    noSlug: 'Save your store slug first to open your live store.',
    couldNotLoadDashboard: 'Could not load dashboard.',
    couldNotLoadStripe: 'Could not load Stripe status.',
    couldNotSaveBusiness: 'Could not save business information.',
    couldNotCreateStripe: 'Could not create Stripe account.',
    couldNotOpenStripe: 'Could not open Stripe onboarding.',
    saved: 'Saved.',
    saving: 'Saving...',
    stripeLoading: 'Loading Stripe...',
    navDashboard: 'Dashboard',
    navBuilder: 'Builder',
    navOrders: 'Orders',
    navPayments: 'Payments',
    navStore: 'Store',
    navRefresh: 'Refresh',
    navLogout: 'Logout',
    openBuilder: 'Open Menu Builder',
    viewStore: 'View Store',
    todaySales: "Today's Sales",
    todayOrders: "Today's Orders",
    menuItems: 'Menu Items',
    stripeStatus: 'Stripe Status',
    connected: 'Connected',
    notConnected: 'Not Connected',
    businessInfo: 'Business Information',
    businessName: 'Business Name',
    storeSlug: 'Store Slug',
    phoneNumber: 'Phone Number',
    address: 'Address',
    hours: 'Hours',
    saveBusiness: 'Save Business Information',
    payments: 'Payments',
    paymentsText:
      'Connect Stripe to accept live payments and keep MenuFlow ready for direct ordering.',
    connectStripe: 'Connect Stripe',
    resumeStripe: 'Resume Stripe',
    refreshStripe: 'Refresh Stripe Status',
    onboarding: 'Onboarding',
    chargesEnabled: 'Charges Enabled',
    payoutsEnabled: 'Payouts Enabled',
    platformFee: 'Platform Fee',
    complete: 'Complete',
    incomplete: 'Incomplete',
    yourMenu: 'Your Menu',
    noItems: 'No menu items yet.',
    recentOrders: 'Recent Orders',
    noOrders: 'No orders yet.',
    liveStorePreview: 'Live Store Preview',
    previewText:
      'Open your live store from here once your business slug is set.',
    pending: 'pending',
  },
  es: {
    brand: 'MenuFlow',
    eyebrow: 'Panel del Dueño',
    welcome: 'Bienvenido de nuevo',
    subtitle: 'Administra tu negocio, menú, pagos y órdenes en vivo desde un solo lugar.',
    signedInAs: 'Sesión iniciada como',
    loading: 'Cargando panel...',
    noRestaurant: 'Todavía no se encontró un restaurante para esta cuenta.',
    noSlug: 'Primero guarda el slug de tu tienda para abrirla en vivo.',
    couldNotLoadDashboard: 'No se pudo cargar el panel.',
    couldNotLoadStripe: 'No se pudo cargar el estado de Stripe.',
    couldNotSaveBusiness: 'No se pudo guardar la información del negocio.',
    couldNotCreateStripe: 'No se pudo crear la cuenta de Stripe.',
    couldNotOpenStripe: 'No se pudo abrir Stripe.',
    saved: 'Guardado.',
    saving: 'Guardando...',
    stripeLoading: 'Cargando Stripe...',
    navDashboard: 'Panel',
    navBuilder: 'Constructor',
    navOrders: 'Órdenes',
    navPayments: 'Pagos',
    navStore: 'Tienda',
    navRefresh: 'Actualizar',
    navLogout: 'Salir',
    openBuilder: 'Abrir Constructor de Menú',
    viewStore: 'Ver Tienda',
    todaySales: 'Ventas de Hoy',
    todayOrders: 'Órdenes de Hoy',
    menuItems: 'Artículos del Menú',
    stripeStatus: 'Estado de Stripe',
    connected: 'Conectado',
    notConnected: 'No Conectado',
    businessInfo: 'Información del Negocio',
    businessName: 'Nombre del Negocio',
    storeSlug: 'Slug de Tienda',
    phoneNumber: 'Número de Teléfono',
    address: 'Dirección',
    hours: 'Horario',
    saveBusiness: 'Guardar Información del Negocio',
    payments: 'Pagos',
    paymentsText:
      'Conecta Stripe para aceptar pagos en vivo y mantener MenuFlow listo para órdenes directas.',
    connectStripe: 'Conectar Stripe',
    resumeStripe: 'Continuar Stripe',
    refreshStripe: 'Actualizar Estado Stripe',
    onboarding: 'Onboarding',
    chargesEnabled: 'Cobros Habilitados',
    payoutsEnabled: 'Pagos Habilitados',
    platformFee: 'Tarifa de Plataforma',
    complete: 'Completo',
    incomplete: 'Incompleto',
    yourMenu: 'Tu Menú',
    noItems: 'Todavía no hay artículos.',
    recentOrders: 'Órdenes Recientes',
    noOrders: 'Todavía no hay órdenes.',
    liveStorePreview: 'Vista Previa de la Tienda',
    previewText:
      'Abre tu tienda en vivo desde aquí cuando el slug de tu negocio ya esté guardado.',
    pending: 'pendiente',
  },
} as const;

function dayKey(value: string) {
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeActionLoading, setStripeActionLoading] = useState(false);

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

      const restaurantRes = await fetch(
        `/api/restaurants/by-owner-email?email=${encodeURIComponent(email)}`,
        { cache: 'no-store' }
      );
      const restaurantPayload = await restaurantRes.json().catch(() => ({}));
      const currentRestaurant: Restaurant | null = restaurantPayload?.restaurant || null;

      setRestaurant(currentRestaurant);

      if (!currentRestaurant?.id) {
        setMenuItems([]);
        setOrders([]);
        setStripeStatus(null);
        setLoading(false);
        setMessage(t.noRestaurant);
        return;
      }

      setBusinessName(currentRestaurant.name || '');
      setStoreSlug(currentRestaurant.slug || '');
      setPhoneNumber(currentRestaurant.phone || '');
      setBusinessAddress(currentRestaurant.address || '');
      setBusinessHours(currentRestaurant.hours || '');

      const [menuRes, ordersRes] = await Promise.all([
        fetch(
          `/api/menu-items/by-restaurant?restaurantId=${encodeURIComponent(currentRestaurant.id)}`,
          { cache: 'no-store' }
        ),
        fetch(
          `/api/orders/by-restaurant?restaurantId=${encodeURIComponent(currentRestaurant.id)}`,
          { cache: 'no-store' }
        ),
      ]);

      const menuPayload = await menuRes.json().catch(() => ({}));
      const ordersPayload = await ordersRes.json().catch(() => ({}));

      setMenuItems(Array.isArray(menuPayload?.items) ? menuPayload.items : []);
      setOrders(Array.isArray(ordersPayload?.orders) ? ordersPayload.orders : []);

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

      if (!response.ok) {
        throw new Error(payload?.error || t.couldNotLoadStripe);
      }

      setStripeStatus(payload);

      if (payload?.stripe_account_id) {
        setRestaurant((current) =>
          current ? { ...current, stripe_account_id: payload.stripe_account_id } : current
        );
      }
    } catch (error: any) {
      setMessage(error?.message || t.couldNotLoadStripe);
    } finally {
      setStripeLoading(false);
    }
  }

  async function handleConnectStripe() {
    if (!restaurant?.id) {
      setMessage(t.noRestaurant);
      return;
    }

    try {
      setStripeActionLoading(true);
      setMessage('');

      let accountId = restaurant.stripe_account_id || '';

      if (!accountId) {
        const createResponse = await fetch('/api/connect/create-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            email: userEmail,
            businessName: restaurant.name,
          }),
        });

        const createPayload = await createResponse.json().catch(() => ({}));

        if (!createResponse.ok) {
          throw new Error(createPayload?.error || t.couldNotCreateStripe);
        }

        accountId = String(createPayload?.accountId || '');

        setRestaurant((current) =>
          current ? { ...current, stripe_account_id: accountId } : current
        );
      }

      const linkResponse = await fetch('/api/connect/create-onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const linkPayload = await linkResponse.json().catch(() => ({}));

      if (!linkResponse.ok || !linkPayload?.url) {
        throw new Error(linkPayload?.error || t.couldNotOpenStripe);
      }

      window.location.href = linkPayload.url;
    } catch (error: any) {
      setMessage(error?.message || t.couldNotOpenStripe);
    } finally {
      setStripeActionLoading(false);
    }
  }

  async function handleSaveBusiness() {
    if (!restaurant?.id) {
      setMessage(t.noRestaurant);
      return;
    }

    try {
      setSavingBusiness(true);
      setMessage('');

      const response = await fetch('/api/restaurants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restaurant.id,
          name: businessName,
          slug: storeSlug,
          phone: phoneNumber,
          address: businessAddress,
          hours: businessHours,
        }),
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

  function handleOpenBuilder() {
    router.push('/dashboard/owner/builder');
  }

  function handleViewStore() {
    const slug = restaurant?.slug || storeSlug;

    if (!slug) {
      setMessage(t.noSlug);
      return;
    }

    router.push(`/store/${slug}`);
  }

  function scrollToSection(id: string) {
    if (typeof window === 'undefined') return;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    return orders.filter(
      (order) => order.created_at && dayKey(order.created_at) === today
    ).length;
  }, [orders]);

  return (
    <main className="mf-page">
      <div className="mf-shell">
        <aside className="mf-sidebar">
          <div className="mf-brandBlock">
            <div className="mf-logo">MF</div>
            <div>
              <div className="mf-brand">{t.brand}</div>
              <div className="mf-eyebrow">{t.eyebrow}</div>
            </div>
          </div>

          <nav className="mf-nav">
            <button className="mf-navItem active" onClick={() => scrollToSection('dashboard-top')}>
              {t.navDashboard}
            </button>
            <button className="mf-navItem" onClick={handleOpenBuilder}>
              {t.navBuilder}
            </button>
            <button className="mf-navItem" onClick={() => scrollToSection('recent-orders')}>
              {t.navOrders}
            </button>
            <button className="mf-navItem" onClick={() => scrollToSection('payments')}>
              {t.navPayments}
            </button>
            <button className="mf-navItem" onClick={handleViewStore}>
              {t.navStore}
            </button>
            <button className="mf-navItem" onClick={() => void loadDashboard()}>
              {t.navRefresh}
            </button>
          </nav>

          <div className="mf-sidebarFooter">
            <button className="mf-logout" onClick={() => router.push('/login')}>
              {t.navLogout}
            </button>
          </div>
        </aside>

        <section className="mf-main" id="dashboard-top">
          <div className="mf-topbar">
            <div>
              <div className="mf-top-eyebrow">{t.eyebrow}</div>
              <h1 className="mf-title">{t.welcome}</h1>
              <p className="mf-subtitle">{t.subtitle}</p>
              <p className="mf-email">
                {t.signedInAs}: <span>{userEmail || '--'}</span>
              </p>
            </div>

            <div className="mf-top-actions">
              <div className="mf-langSwitch">
                <button
                  type="button"
                  className={lang === 'en' ? 'mf-lang active' : 'mf-lang'}
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={lang === 'es' ? 'mf-lang active' : 'mf-lang'}
                  onClick={() => setLang('es')}
                >
                  ES
                </button>
              </div>

              <div className="mf-actionButtons">
                <button type="button" className="mf-btn mf-btn-primary" onClick={handleOpenBuilder}>
                  {t.openBuilder}
                </button>
                <button
                  type="button"
                  className="mf-btn mf-btn-secondary"
                  onClick={handleViewStore}
                  disabled={!(restaurant?.slug || storeSlug)}
                >
                  {t.viewStore}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mf-loadingCard">{t.loading}</div>
          ) : (
            <>
              <section className="mf-statGrid">
                <StatCard label={t.todaySales} value={`$${todaySales.toFixed(2)}`} />
                <StatCard label={t.todayOrders} value={String(todayOrders)} />
                <StatCard label={t.menuItems} value={String(menuItems.length)} />
                <StatCard
                  label={t.stripeStatus}
                  value={stripeStatus?.connected ? t.connected : t.notConnected}
                />
              </section>

              <section className="mf-contentGrid">
                <div className="mf-column">
                  <CardShell title={t.businessInfo} id="business-info">
                    <div className="mf-fieldGrid">
                      <Field label={t.businessName} value={businessName} onChange={setBusinessName} />
                      <Field label={t.storeSlug} value={storeSlug} onChange={setStoreSlug} />
                      <Field label={t.phoneNumber} value={phoneNumber} onChange={setPhoneNumber} />
                      <Field label={t.address} value={businessAddress} onChange={setBusinessAddress} />
                      <Field label={t.hours} value={businessHours} onChange={setBusinessHours} />
                    </div>

                    <button
                      type="button"
                      className="mf-btn mf-btn-primary"
                      onClick={handleSaveBusiness}
                      disabled={savingBusiness}
                    >
                      {savingBusiness ? t.saving : t.saveBusiness}
                    </button>
                  </CardShell>

                  <CardShell title={t.yourMenu} id="menu-items">
                    {menuItems.length === 0 ? (
                      <div className="mf-empty">{t.noItems}</div>
                    ) : (
                      <div className="mf-list">
                        {menuItems.map((item) => (
                          <div className="mf-menuRow" key={item.id}>
                            <div className="mf-menuThumb">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name || 'Menu item'}
                                  className="mf-menuThumbImg"
                                />
                              ) : (
                                <div className="mf-menuThumbBlank" />
                              )}
                            </div>
                            <div className="mf-menuInfo">
                              <div className="mf-menuName">{item.name || 'Item'}</div>
                              <div className="mf-menuPrice">
                                ${Number(item.price || 0).toFixed(2)}
                              </div>
                              <div className="mf-menuDesc">{item.description || ''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardShell>
                </div>

                <div className="mf-column">
                  <CardShell title={t.payments} id="payments">
                    <p className="mf-body">{t.paymentsText}</p>

                    <div className="mf-miniGrid">
                      <MiniStat
                        label={t.platformFee}
                        value={
                          typeof stripeStatus?.platformFeePercent === 'number'
                            ? `${stripeStatus.platformFeePercent}%`
                            : '--'
                        }
                      />
                      <MiniStat
                        label={t.onboarding}
                        value={
                          stripeStatus?.onboardingComplete ? t.complete : t.incomplete
                        }
                      />
                      <MiniStat
                        label={t.chargesEnabled}
                        value={stripeStatus?.chargesEnabled ? t.connected : '--'}
                      />
                      <MiniStat
                        label={t.payoutsEnabled}
                        value={stripeStatus?.payoutsEnabled ? t.connected : '--'}
                      />
                    </div>

                    <div className="mf-stackButtons">
                      <button
                        type="button"
                        className="mf-btn mf-btn-primary"
                        onClick={handleConnectStripe}
                        disabled={stripeActionLoading}
                      >
                        {stripeActionLoading
                          ? t.saving
                          : stripeStatus?.connected
                          ? t.resumeStripe
                          : t.connectStripe}
                      </button>

                      <button
                        type="button"
                        className="mf-btn mf-btn-secondary"
                        onClick={() => void refreshStripeStatus()}
                        disabled={stripeLoading}
                      >
                        {stripeLoading ? t.stripeLoading : t.refreshStripe}
                      </button>
                    </div>
                  </CardShell>

                  <CardShell title={t.recentOrders} id="recent-orders">
                    {orders.length === 0 ? (
                      <div className="mf-empty">{t.noOrders}</div>
                    ) : (
                      <div className="mf-list">
                        {orders.map((order) => (
                          <div className="mf-orderRow" key={order.id}>
                            <div>
                              <div className="mf-orderId">#{order.id.slice(0, 8)}</div>
                              <div className="mf-orderMeta">
                                {order.customer_name || 'Guest'} •{' '}
                                {order.payment_status || t.pending}
                              </div>
                            </div>
                            <div className="mf-orderTotal">
                              ${Number(order.total || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardShell>

                  <CardShell title={t.liveStorePreview} id="store-preview">
                    <p className="mf-body">{t.previewText}</p>
                    <div className="mf-preview">
                      <div className="mf-previewName">
                        {restaurant?.name || businessName || '--'}
                      </div>
                      <div className="mf-previewSlug">
                        /store/{restaurant?.slug || storeSlug || '--'}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mf-btn mf-btn-secondary"
                      onClick={handleViewStore}
                      disabled={!(restaurant?.slug || storeSlug)}
                    >
                      {t.viewStore}
                    </button>
                  </CardShell>
                </div>
              </section>
            </>
          )}

          {message ? <div className="mf-message">{message}</div> : null}
        </section>
      </div>

      <style jsx>{`
        .mf-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(36, 99, 235, 0.16), transparent 28%),
            radial-gradient(circle at bottom left, rgba(36, 99, 235, 0.14), transparent 24%),
            linear-gradient(135deg, #081120 0%, #0b1426 45%, #111a31 100%);
          padding: 18px;
          color: #eff4ff;
        }

        .mf-shell {
          max-width: 1440px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .mf-sidebar {
          position: sticky;
          top: 18px;
          min-height: calc(100vh - 36px);
          background: linear-gradient(180deg, rgba(18, 29, 56, 0.92), rgba(11, 18, 34, 0.96));
          border: 1px solid rgba(132, 160, 225, 0.16);
          border-radius: 28px;
          padding: 24px 18px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
          display: flex;
          flex-direction: column;
        }

        .mf-brandBlock {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 30px;
        }

        .mf-logo {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #2d66ec, #5c90ff);
          color: white;
          font-weight: 900;
          font-size: 22px;
          box-shadow: 0 14px 30px rgba(45, 102, 236, 0.35);
        }

        .mf-brand {
          font-size: 26px;
          font-weight: 900;
          line-height: 1;
          color: #ffffff;
        }

        .mf-eyebrow {
          margin-top: 8px;
          color: #8da0c5;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .mf-nav {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mf-navItem,
        .mf-logout {
          appearance: none;
          border: 1px solid rgba(132, 160, 225, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: #dce7ff;
          border-radius: 18px;
          padding: 14px 16px;
          font-size: 15px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .mf-navItem:hover,
        .mf-logout:hover,
        .mf-navItem.active {
          background: rgba(45, 102, 236, 0.18);
          border-color: rgba(85, 129, 255, 0.28);
          color: #ffffff;
        }

        .mf-sidebarFooter {
          margin-top: auto;
          padding-top: 18px;
        }

        .mf-main {
          min-width: 0;
        }

        .mf-topbar {
          background: linear-gradient(180deg, rgba(15, 25, 48, 0.94), rgba(13, 23, 42, 0.9));
          border: 1px solid rgba(132, 160, 225, 0.14);
          border-radius: 32px;
          padding: 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
          display: flex;
          justify-content: space-between;
          gap: 22px;
          align-items: flex-start;
        }

        .mf-top-eyebrow {
          color: #8da0c5;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mf-title {
          margin: 12px 0 0 0;
          font-size: 68px;
          line-height: 0.95;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.04em;
        }

        .mf-subtitle {
          margin: 18px 0 0 0;
          font-size: 20px;
          line-height: 1.6;
          color: #b1bfdc;
          max-width: 720px;
          font-weight: 500;
        }

        .mf-email {
          margin: 16px 0 0 0;
          color: #8da0c5;
          font-size: 14px;
          font-weight: 600;
        }

        .mf-email span {
          color: #ffffff;
          font-weight: 800;
        }

        .mf-top-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-end;
          min-width: 260px;
        }

        .mf-langSwitch {
          display: flex;
          gap: 10px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(132, 160, 225, 0.12);
          border-radius: 20px;
        }

        .mf-lang {
          appearance: none;
          border: none;
          background: transparent;
          color: #c4d3f3;
          border-radius: 14px;
          padding: 12px 16px;
          font-weight: 800;
          cursor: pointer;
        }

        .mf-lang.active {
          background: linear-gradient(135deg, #2d66ec, #5c90ff);
          color: white;
          box-shadow: 0 10px 24px rgba(45, 102, 236, 0.26);
        }

        .mf-actionButtons {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 12px;
        }

        .mf-btn {
          appearance: none;
          border: none;
          border-radius: 18px;
          padding: 16px 20px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .mf-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .mf-btn-primary {
          background: linear-gradient(135deg, #2d66ec, #5c90ff);
          color: white;
          box-shadow: 0 14px 28px rgba(45, 102, 236, 0.28);
        }

        .mf-btn-secondary {
          background: rgba(255, 255, 255, 0.9);
          color: #101a30;
          border: 1px solid rgba(132, 160, 225, 0.16);
        }

        .mf-loadingCard,
        .mf-message {
          margin-top: 18px;
          border-radius: 24px;
          padding: 18px 20px;
          font-size: 16px;
          font-weight: 700;
        }

        .mf-loadingCard {
          background: rgba(255, 255, 255, 0.08);
          color: #dce7ff;
          border: 1px solid rgba(132, 160, 225, 0.12);
        }

        .mf-message {
          background: rgba(255, 196, 104, 0.14);
          border: 1px solid rgba(255, 196, 104, 0.28);
          color: #ffd89a;
        }

        .mf-statGrid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .mf-statCard {
          background: rgba(255, 255, 255, 0.92);
          color: #101a30;
          border-radius: 24px;
          padding: 22px;
          min-width: 0;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
        }

        .mf-statLabel {
          color: #7282a1;
          font-size: 14px;
          font-weight: 700;
        }

        .mf-statValue {
          margin-top: 14px;
          font-size: 38px;
          line-height: 1.05;
          font-weight: 900;
          color: #101a30;
          word-break: break-word;
        }

        .mf-contentGrid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1.15fr 0.95fr;
          gap: 18px;
        }

        .mf-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }

        .mf-card {
          background: rgba(255, 255, 255, 0.94);
          color: #101a30;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
          min-width: 0;
        }

        .mf-cardTitle {
          margin: 0 0 16px 0;
          font-size: 24px;
          line-height: 1.1;
          font-weight: 900;
          color: #101a30;
        }

        .mf-fieldGrid {
          display: grid;
          gap: 14px;
          margin-bottom: 16px;
        }

        .mf-fieldLabel {
          display: block;
        }

        .mf-fieldText {
          display: block;
          font-size: 14px;
          color: #6e7d9a;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .mf-input {
          width: 100%;
          box-sizing: border-box;
          height: 52px;
          border-radius: 14px;
          border: 1px solid #dbe4f0;
          background: #f7faff;
          padding: 0 14px;
          color: #101a30;
          font-size: 16px;
        }

        .mf-body {
          margin: 0 0 16px 0;
          color: #60708d;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 500;
        }

        .mf-miniGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .mf-miniStat {
          background: #f7faff;
          border: 1px solid #e1e8f4;
          border-radius: 18px;
          padding: 16px;
          min-width: 0;
        }

        .mf-miniLabel {
          color: #7282a1;
          font-size: 13px;
          font-weight: 700;
        }

        .mf-miniValue {
          margin-top: 8px;
          color: #101a30;
          font-size: 18px;
          line-height: 1.35;
          font-weight: 900;
          word-break: break-word;
        }

        .mf-stackButtons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mf-empty {
          background: #f7faff;
          border: 1px solid #e1e8f4;
          color: #7282a1;
          border-radius: 18px;
          padding: 18px;
          font-weight: 700;
        }

        .mf-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mf-menuRow,
        .mf-orderRow {
          background: #f7faff;
          border: 1px solid #e1e8f4;
          border-radius: 18px;
          padding: 14px;
        }

        .mf-menuRow {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .mf-menuThumb {
          width: 78px;
          height: 78px;
          border-radius: 18px;
          overflow: hidden;
          background: #e4ebf8;
          flex-shrink: 0;
        }

        .mf-menuThumbImg,
        .mf-menuThumbBlank {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: #e4ebf8;
        }

        .mf-menuInfo {
          min-width: 0;
        }

        .mf-menuName {
          color: #101a30;
          font-size: 17px;
          font-weight: 900;
        }

        .mf-menuPrice {
          color: #2d66ec;
          font-size: 15px;
          font-weight: 900;
          margin-top: 5px;
        }

        .mf-menuDesc {
          color: #7282a1;
          font-size: 14px;
          line-height: 1.6;
          margin-top: 6px;
        }

        .mf-orderRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .mf-orderId {
          color: #101a30;
          font-size: 16px;
          font-weight: 900;
        }

        .mf-orderMeta {
          color: #7282a1;
          font-size: 14px;
          margin-top: 6px;
        }

        .mf-orderTotal {
          color: #101a30;
          font-size: 16px;
          font-weight: 900;
          text-align: right;
        }

        .mf-preview {
          background: #f7faff;
          border: 1px solid #e1e8f4;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 14px;
        }

        .mf-previewName {
          color: #101a30;
          font-size: 20px;
          font-weight: 900;
        }

        .mf-previewSlug {
          color: #7282a1;
          font-size: 14px;
          font-weight: 700;
          margin-top: 8px;
        }

        @media (max-width: 1200px) {
          .mf-title {
            font-size: 56px;
          }

          .mf-shell {
            grid-template-columns: 240px minmax(0, 1fr);
          }
        }

        @media (max-width: 980px) {
          .mf-page {
            padding: 14px;
          }

          .mf-shell {
            grid-template-columns: 1fr;
          }

          .mf-sidebar {
            position: static;
            min-height: auto;
            padding: 16px;
          }

          .mf-brandBlock {
            margin-bottom: 18px;
          }

          .mf-nav {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .mf-sidebarFooter {
            margin-top: 14px;
            padding-top: 0;
          }

          .mf-topbar {
            padding: 22px;
            flex-direction: column;
          }

          .mf-top-actions {
            align-items: stretch;
            min-width: 0;
            width: 100%;
          }

          .mf-title {
            font-size: 48px;
          }

          .mf-statGrid,
          .mf-contentGrid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 700px) {
          .mf-nav {
            grid-template-columns: 1fr 1fr;
          }

          .mf-title {
            font-size: 40px;
          }

          .mf-subtitle {
            font-size: 18px;
          }

          .mf-statGrid,
          .mf-contentGrid,
          .mf-miniGrid {
            grid-template-columns: 1fr;
          }

          .mf-menuRow,
          .mf-orderRow {
            flex-direction: column;
            align-items: flex-start;
          }

          .mf-orderTotal {
            text-align: left;
          }
        }

        @media (max-width: 480px) {
          .mf-page {
            padding: 12px;
          }

          .mf-topbar,
          .mf-card,
          .mf-sidebar,
          .mf-statCard {
            border-radius: 22px;
          }

          .mf-brand {
            font-size: 22px;
          }

          .mf-title {
            font-size: 34px;
          }

          .mf-langSwitch {
            width: 100%;
            justify-content: space-between;
          }

          .mf-lang {
            flex: 1;
          }
        }
      `}</style>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="mf-statCard">
      <div className="mf-statLabel">{label}</div>
      <div className="mf-statValue">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mf-miniStat">
      <div className="mf-miniLabel">{label}</div>
      <div className="mf-miniValue">{value}</div>
    </div>
  );
}

function CardShell({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mf-card" id={id}>
      <h2 className="mf-cardTitle">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mf-fieldLabel">
      <span className="mf-fieldText">{label}</span>
      <input
        className="mf-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
