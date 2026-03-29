'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Lang = 'en' | 'es';

type UserPayload = {
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
    dashboard: 'Owner Dashboard',
    welcome: 'Welcome back',
    subtitle: 'Manage your business in one place.',
    signedInAs: 'Signed in as',
    openBuilder: 'Open Menu Builder',
    viewStore: 'View Store',
    loading: 'Loading dashboard...',
    noRestaurant: 'No restaurant found for this account yet.',
    noStoreSlug: 'This restaurant does not have a store slug yet.',
    businessInfo: 'Business Information',
    businessName: 'Business Name',
    storeSlug: 'Store Slug',
    phoneNumber: 'Phone Number',
    address: 'Address',
    hours: 'Hours',
    saveBusiness: 'Save Business Information',
    saving: 'Saving...',
    saved: 'Saved.',
    todaySales: "Today's Sales",
    todayOrders: "Today's Orders",
    menuItems: 'Menu Items',
    stripeStatus: 'Stripe Status',
    connected: 'Connected',
    notConnected: 'Not Connected',
    recentOrders: 'Recent Orders',
    noOrders: 'No orders yet',
    yourMenu: 'Your Menu',
    noItems: 'No menu items yet',
    payments: 'Payments',
    paymentsText:
      'Connect Stripe to accept live payments and keep your dashboard ready for direct orders.',
    connectStripe: 'Connect Stripe',
    resumeStripe: 'Resume Stripe',
    refreshStripe: 'Refresh Stripe Status',
    stripeLoading: 'Loading Stripe...',
    onboardingComplete: 'Onboarding Complete',
    onboardingIncomplete: 'Onboarding Incomplete',
    chargesEnabled: 'Charges Enabled',
    payoutsEnabled: 'Payouts Enabled',
    platformFee: 'Platform Fee',
    couldNotLoadDashboard: 'Could not load dashboard.',
    couldNotLoadStripe: 'Could not load Stripe status.',
    couldNotSaveBusiness: 'Could not save business information.',
    couldNotCreateStripe: 'Could not create Stripe account.',
    couldNotOpenStripe: 'Could not open Stripe onboarding.',
    livePreview: 'Live Store Preview',
    previewText:
      'Open your live store from here once your business slug is set.',
  },
  es: {
    brand: 'MenuFlow',
    dashboard: 'Panel del Dueño',
    welcome: 'Bienvenido de nuevo',
    subtitle: 'Administra tu negocio en un solo lugar.',
    signedInAs: 'Sesión iniciada como',
    openBuilder: 'Abrir Constructor de Menú',
    viewStore: 'Ver Tienda',
    loading: 'Cargando panel...',
    noRestaurant: 'Todavía no se encontró un restaurante para esta cuenta.',
    noStoreSlug: 'Este restaurante todavía no tiene slug de tienda.',
    businessInfo: 'Información del Negocio',
    businessName: 'Nombre del Negocio',
    storeSlug: 'Slug de Tienda',
    phoneNumber: 'Número de Teléfono',
    address: 'Dirección',
    hours: 'Horario',
    saveBusiness: 'Guardar Información del Negocio',
    saving: 'Guardando...',
    saved: 'Guardado.',
    todaySales: 'Ventas de Hoy',
    todayOrders: 'Órdenes de Hoy',
    menuItems: 'Artículos del Menú',
    stripeStatus: 'Estado de Stripe',
    connected: 'Conectado',
    notConnected: 'No Conectado',
    recentOrders: 'Órdenes Recientes',
    noOrders: 'Todavía no hay órdenes',
    yourMenu: 'Tu Menú',
    noItems: 'Todavía no hay artículos',
    payments: 'Pagos',
    paymentsText:
      'Conecta Stripe para aceptar pagos en vivo y mantener tu panel listo para órdenes directas.',
    connectStripe: 'Conectar Stripe',
    resumeStripe: 'Continuar Stripe',
    refreshStripe: 'Actualizar Estado Stripe',
    stripeLoading: 'Cargando Stripe...',
    onboardingComplete: 'Onboarding Completo',
    onboardingIncomplete: 'Onboarding Incompleto',
    chargesEnabled: 'Cobros Habilitados',
    payoutsEnabled: 'Pagos Habilitados',
    platformFee: 'Tarifa de Plataforma',
    couldNotLoadDashboard: 'No se pudo cargar el panel.',
    couldNotLoadStripe: 'No se pudo cargar el estado de Stripe.',
    couldNotSaveBusiness: 'No se pudo guardar la información del negocio.',
    couldNotCreateStripe: 'No se pudo crear la cuenta de Stripe.',
    couldNotOpenStripe: 'No se pudo abrir Stripe.',
    livePreview: 'Vista Previa de la Tienda',
    previewText:
      'Abre tu tienda en vivo desde aquí cuando tu negocio ya tenga slug.',
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
      const authPayload: UserPayload = await authRes.json().catch(() => ({}));

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

      const currentRestaurant: Restaurant | null =
        restaurantPayload?.restaurant || null;

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
          current
            ? { ...current, stripe_account_id: payload.stripe_account_id }
            : current
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
      setMessage(t.noStoreSlug);
      return;
    }

    router.push(`/store/${slug}`);
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

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.loading}>{t.loading}</div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.topRow}>
          <div>
            <div style={styles.brand}>{t.brand}</div>
            <div style={styles.eyebrow}>{t.dashboard}</div>
          </div>

          <div style={styles.langSwitch}>
            <button
              type="button"
              onClick={() => setLang('en')}
              style={lang === 'en' ? styles.langButtonActive : styles.langButton}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('es')}
              style={lang === 'es' ? styles.langButtonActive : styles.langButton}
            >
              ES
            </button>
          </div>
        </div>

        <section style={styles.hero}>
          <div>
            <h1 style={styles.heroTitle}>{t.welcome}</h1>
            <p style={styles.heroText}>{t.subtitle}</p>
            <p style={styles.emailLine}>
              {t.signedInAs}: <span style={styles.emailStrong}>{userEmail || '--'}</span>
            </p>
          </div>

          <div style={styles.actionRow}>
            <button type="button" style={styles.primaryButton} onClick={handleOpenBuilder}>
              {t.openBuilder}
            </button>
            <button type="button" style={styles.secondaryButton} onClick={handleViewStore}>
              {t.viewStore}
            </button>
          </div>
        </section>

        <section style={styles.statsGrid}>
          <StatCard label={t.todaySales} value={`$${todaySales.toFixed(2)}`} />
          <StatCard label={t.todayOrders} value={String(todayOrders)} />
          <StatCard label={t.menuItems} value={String(menuItems.length)} />
          <StatCard
            label={t.stripeStatus}
            value={stripeStatus?.connected ? t.connected : t.notConnected}
          />
        </section>

        <section style={styles.mainGrid}>
          <div style={styles.leftColumn}>
            <CardShell title={t.businessInfo}>
              <div style={styles.fieldGrid}>
                <Field
                  label={t.businessName}
                  value={businessName}
                  onChange={setBusinessName}
                />
                <Field label={t.storeSlug} value={storeSlug} onChange={setStoreSlug} />
                <Field
                  label={t.phoneNumber}
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                />
                <Field
                  label={t.address}
                  value={businessAddress}
                  onChange={setBusinessAddress}
                />
                <Field label={t.hours} value={businessHours} onChange={setBusinessHours} />
              </div>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={handleSaveBusiness}
                disabled={savingBusiness}
              >
                {savingBusiness ? t.saving : t.saveBusiness}
              </button>
            </CardShell>

            <CardShell title={t.yourMenu}>
              {menuItems.length === 0 ? (
                <div style={styles.emptyBox}>{t.noItems}</div>
              ) : (
                <div style={styles.listStack}>
                  {menuItems.map((item) => (
                    <div key={item.id} style={styles.menuRow}>
                      <div style={styles.menuImageWrap}>
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.name || 'Menu item'}
                            style={styles.menuImage}
                          />
                        ) : (
                          <div style={styles.menuImageBlank} />
                        )}
                      </div>

                      <div style={styles.menuInfo}>
                        <div style={styles.menuName}>{item.name || 'Item'}</div>
                        <div style={styles.menuPrice}>
                          ${Number(item.price || 0).toFixed(2)}
                        </div>
                        <div style={styles.menuDesc}>{item.description || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardShell>
          </div>

          <div style={styles.rightColumn}>
            <CardShell title={t.payments}>
              <p style={styles.bodyText}>{t.paymentsText}</p>

              <div style={styles.miniStatsGrid}>
                <MiniStat
                  label={t.platformFee}
                  value={
                    typeof stripeStatus?.platformFeePercent === 'number'
                      ? `${stripeStatus.platformFeePercent}%`
                      : '--'
                  }
                />
                <MiniStat
                  label={t.onboardingComplete}
                  value={
                    stripeStatus?.onboardingComplete
                      ? t.onboardingComplete
                      : t.onboardingIncomplete
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

              <div style={styles.buttonStack}>
                <button
                  type="button"
                  style={styles.primaryButton}
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
                  style={styles.secondaryButton}
                  onClick={() => void refreshStripeStatus()}
                  disabled={stripeLoading}
                >
                  {stripeLoading ? t.stripeLoading : t.refreshStripe}
                </button>
              </div>
            </CardShell>

            <CardShell title={t.recentOrders}>
              {orders.length === 0 ? (
                <div style={styles.emptyBox}>{t.noOrders}</div>
              ) : (
                <div style={styles.listStack}>
                  {orders.map((order) => (
                    <div key={order.id} style={styles.orderRow}>
                      <div>
                        <div style={styles.orderId}>#{order.id.slice(0, 8)}</div>
                        <div style={styles.orderMeta}>
                          {order.customer_name || 'Guest'} • {order.payment_status || 'pending'}
                        </div>
                      </div>
                      <div style={styles.orderTotal}>
                        ${Number(order.total || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardShell>

            <CardShell title={t.livePreview}>
              <p style={styles.bodyText}>{t.previewText}</p>
              <div style={styles.previewBox}>
                <div style={styles.previewStoreName}>{restaurant?.name || businessName || '--'}</div>
                <div style={styles.previewSlug}>/store/{restaurant?.slug || storeSlug || '--'}</div>
              </div>
              <button type="button" style={styles.secondaryButton} onClick={handleViewStore}>
                {t.viewStore}
              </button>
            </CardShell>
          </div>
        </section>

        {message ? <div style={styles.message}>{message}</div> : null}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.miniStat}>
      <div style={styles.miniLabel}>{label}</div>
      <div style={styles.miniValue}>{value}</div>
    </div>
  );
}

function CardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.cardShell}>
      <h2 style={styles.cardTitle}>{title}</h2>
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
    <label style={styles.fieldLabel}>
      <span style={styles.fieldText}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    padding: '24px 16px 40px',
  },
  wrap: {
    maxWidth: '1180px',
    margin: '0 auto',
  },
  loading: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#152033',
    paddingTop: '80px',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  brand: {
    fontSize: '18px',
    fontWeight: 900,
    color: '#152033',
  },
  eyebrow: {
    marginTop: '6px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#7a869a',
    letterSpacing: '0.04em',
  },
  langSwitch: {
    display: 'flex',
    gap: '8px',
  },
  langButton: {
    border: '1px solid #d9dfeb',
    background: '#ffffff',
    color: '#152033',
    borderRadius: '12px',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  langButtonActive: {
    border: '1px solid #2463eb',
    background: '#2463eb',
    color: '#ffffff',
    borderRadius: '12px',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  hero: {
    background: '#ffffff',
    borderRadius: '28px',
    padding: '28px',
    boxShadow: '0 10px 40px rgba(17, 24, 39, 0.06)',
    marginBottom: '20px',
  },
  heroTitle: {
    margin: 0,
    color: '#152033',
    fontSize: '48px',
    lineHeight: 1,
    fontWeight: 900,
  },
  heroText: {
    marginTop: '14px',
    marginBottom: '0',
    fontSize: '20px',
    lineHeight: 1.5,
    color: '#5f6b80',
    fontWeight: 500,
  },
  emailLine: {
    marginTop: '14px',
    marginBottom: '0',
    color: '#7a869a',
    fontSize: '15px',
  },
  emailStrong: {
    color: '#152033',
    fontWeight: 700,
  },
  actionRow: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
    marginTop: '22px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '22px',
    boxShadow: '0 10px 40px rgba(17, 24, 39, 0.06)',
  },
  statLabel: {
    color: '#7a869a',
    fontSize: '14px',
    fontWeight: 700,
  },
  statValue: {
    color: '#152033',
    fontSize: '32px',
    fontWeight: 900,
    marginTop: '12px',
    lineHeight: 1.15,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.9fr)',
    gap: '20px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cardShell: {
    background: '#ffffff',
    borderRadius: '28px',
    padding: '24px',
    boxShadow: '0 10px 40px rgba(17, 24, 39, 0.06)',
  },
  cardTitle: {
    margin: 0,
    color: '#152033',
    fontSize: '28px',
    fontWeight: 900,
    marginBottom: '18px',
  },
  fieldGrid: {
    display: 'grid',
    gap: '14px',
    marginBottom: '18px',
  },
  fieldLabel: {
    display: 'block',
  },
  fieldText: {
    display: 'block',
    fontSize: '14px',
    color: '#5f6b80',
    fontWeight: 700,
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    height: '54px',
    borderRadius: '14px',
    border: '1px solid #dce3ef',
    padding: '0 14px',
    fontSize: '16px',
    color: '#152033',
    background: '#fbfcfe',
    boxSizing: 'border-box',
  },
  primaryButton: {
    border: 'none',
    background: '#2463eb',
    color: '#ffffff',
    borderRadius: '16px',
    padding: '16px 20px',
    fontSize: '16px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #dce3ef',
    background: '#eef3ff',
    color: '#152033',
    borderRadius: '16px',
    padding: '16px 20px',
    fontSize: '16px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  bodyText: {
    margin: '0 0 18px 0',
    color: '#5f6b80',
    fontSize: '15px',
    lineHeight: 1.7,
  },
  miniStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    marginBottom: '18px',
  },
  miniStat: {
    background: '#f8fafe',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid #e6ebf5',
  },
  miniLabel: {
    fontSize: '13px',
    color: '#7a869a',
    fontWeight: 700,
  },
  miniValue: {
    marginTop: '8px',
    color: '#152033',
    fontWeight: 800,
    fontSize: '18px',
    lineHeight: 1.3,
  },
  buttonStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyBox: {
    background: '#f8fafe',
    border: '1px solid #e6ebf5',
    color: '#7a869a',
    borderRadius: '18px',
    padding: '18px',
    fontWeight: 700,
  },
  menuRow: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    background: '#f8fafe',
    border: '1px solid #e6ebf5',
    borderRadius: '18px',
    padding: '14px',
  },
  menuImageWrap: {
    width: '74px',
    height: '74px',
    borderRadius: '16px',
    overflow: 'hidden',
    flexShrink: 0,
    background: '#e8edf8',
  },
  menuImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  menuImageBlank: {
    width: '100%',
    height: '100%',
    background: '#e8edf8',
  },
  menuInfo: {
    minWidth: 0,
  },
  menuName: {
    color: '#152033',
    fontWeight: 800,
    fontSize: '17px',
  },
  menuPrice: {
    color: '#2463eb',
    fontWeight: 800,
    fontSize: '16px',
    marginTop: '4px',
  },
  menuDesc: {
    color: '#7a869a',
    fontSize: '14px',
    marginTop: '6px',
    lineHeight: 1.5,
  },
  orderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    background: '#f8fafe',
    border: '1px solid #e6ebf5',
    borderRadius: '18px',
    padding: '14px',
  },
  orderId: {
    color: '#152033',
    fontSize: '16px',
    fontWeight: 800,
  },
  orderMeta: {
    color: '#7a869a',
    fontSize: '14px',
    marginTop: '6px',
  },
  orderTotal: {
    color: '#152033',
    fontSize: '16px',
    fontWeight: 900,
  },
  previewBox: {
    background: '#f8fafe',
    border: '1px solid #e6ebf5',
    borderRadius: '18px',
    padding: '18px',
    marginBottom: '14px',
  },
  previewStoreName: {
    color: '#152033',
    fontSize: '20px',
    fontWeight: 900,
  },
  previewSlug: {
    marginTop: '8px',
    color: '#7a869a',
    fontSize: '14px',
    fontWeight: 700,
  },
  message: {
    marginTop: '18px',
    background: '#fff4e8',
    color: '#8a4b08',
    border: '1px solid #f2d1ac',
    borderRadius: '16px',
    padding: '14px 16px',
    fontWeight: 700,
  },
};