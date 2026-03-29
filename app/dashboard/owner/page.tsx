'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Lang = 'en' | 'es';

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

type StripeStatus = {
  connected?: boolean;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  platformFeePercent?: number | null;
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
  payment_status?: string | null;
  customer_name?: string | null;
};

const COPY = {
  en: {
    loading: 'Loading owner panel...',
    noRestaurant: 'No restaurant found.',
    ownerPanel: 'MenuFlow Owner Panel',
    welcome: 'Welcome back',
    subtitle:
      'Manage your business, storefront, menu, Stripe, and live orders from one place.',
    signedInAs: 'Signed in as',
    businessStatus: 'Business Status',
    active: 'Active',
    liveProfile: 'Your store profile is active in the system.',
    stripePayments: 'Stripe Payments',
    stripePaymentsSub:
      'Connect Stripe to receive payouts and let MenuFlow take the correct platform fee automatically.',
    stripeNotConnected: 'Stripe not connected',
    stripeConnected: 'Stripe connected',
    onboardingComplete: 'Onboarding complete',
    onboardingIncomplete: 'Onboarding incomplete',
    chargesEnabled: 'Charges enabled',
    payoutsEnabled: 'Payouts enabled',
    platformFee: 'Platform fee',
    connectStripe: 'Connect Stripe',
    resumeOnboarding: 'Resume Stripe Onboarding',
    refreshStripe: 'Refresh Stripe Status',
    stripeLoading: 'Loading Stripe status...',
    stripeReady: 'Ready to receive direct payouts.',
    stripeNeedsAttention: 'Finish Stripe setup to accept live payments.',
    stripeCreateFailed: 'Could not create Stripe account.',
    stripeLinkFailed: 'Could not open Stripe onboarding.',
    saveBusinessInformation: 'Save Business Information',
    businessInformation: 'Business Information',
    businessName: 'Business Name',
    storeSlug: 'Store Slug',
    phoneNumber: 'Phone Number',
    address: 'Address',
    hours: 'Hours',
    todaysSales: "Today's Sales",
    basedOnOrderTotals: 'Based on order totals.',
    menuItems: 'Menu Items',
    todaysOrders: "Today's Orders",
    ordersCreatedToday: 'Orders created today.',
    noOrdersYet: 'No orders yet.',
    liveOrders: 'Live Orders',
    storePreview: 'Store Preview',
    allMenuItems: 'All Menu Items',
    total: 'total',
    openMenuBuilder: 'Open Menu Builder',
    viewStore: 'View Store',
    saving: 'Saving...',
    couldNotLoadStripe: 'Could not load Stripe status.',
    couldNotSaveBusiness: 'Could not save business information.',
    saved: 'Saved.',
    storefront: 'Storefront',
    menu: 'Menu',
    orders: 'Orders',
    luxuryMode: 'Luxury control center',
    placeholderHero: 'Your hero image and storefront preview will show here.',
  },
  es: {
    loading: 'Cargando panel del dueño...',
    noRestaurant: 'No se encontró restaurante.',
    ownerPanel: 'Panel del Dueño MenuFlow',
    welcome: 'Bienvenido de nuevo',
    subtitle:
      'Administra tu negocio, storefront, menú, Stripe y órdenes en vivo desde un solo lugar.',
    signedInAs: 'Sesión iniciada como',
    businessStatus: 'Estado del negocio',
    active: 'Activo',
    liveProfile: 'Tu perfil de tienda está activo en el sistema.',
    stripePayments: 'Pagos con Stripe',
    stripePaymentsSub:
      'Conecta Stripe para recibir pagos y dejar que MenuFlow tome automáticamente la tarifa correcta.',
    stripeNotConnected: 'Stripe no conectado',
    stripeConnected: 'Stripe conectado',
    onboardingComplete: 'Onboarding completo',
    onboardingIncomplete: 'Onboarding incompleto',
    chargesEnabled: 'Cobros habilitados',
    payoutsEnabled: 'Pagos habilitados',
    platformFee: 'Tarifa de plataforma',
    connectStripe: 'Conectar Stripe',
    resumeOnboarding: 'Continuar activación de Stripe',
    refreshStripe: 'Actualizar estado de Stripe',
    stripeLoading: 'Cargando estado de Stripe...',
    stripeReady: 'Listo para recibir pagos directos.',
    stripeNeedsAttention: 'Termina Stripe para aceptar pagos en vivo.',
    stripeCreateFailed: 'No se pudo crear la cuenta de Stripe.',
    stripeLinkFailed: 'No se pudo abrir la activación de Stripe.',
    saveBusinessInformation: 'Guardar información del negocio',
    businessInformation: 'Información del negocio',
    businessName: 'Nombre del negocio',
    storeSlug: 'Slug de tienda',
    phoneNumber: 'Número de teléfono',
    address: 'Dirección',
    hours: 'Horario',
    todaysSales: 'Ventas de hoy',
    basedOnOrderTotals: 'Basado en totales de órdenes.',
    menuItems: 'Artículos del menú',
    todaysOrders: 'Órdenes de hoy',
    ordersCreatedToday: 'Órdenes creadas hoy.',
    noOrdersYet: 'Todavía no hay órdenes.',
    liveOrders: 'Órdenes en vivo',
    storePreview: 'Vista previa de tienda',
    allMenuItems: 'Todos los artículos',
    total: 'total',
    openMenuBuilder: 'Abrir constructor de menú',
    viewStore: 'Ver tienda',
    saving: 'Guardando...',
    couldNotLoadStripe: 'No se pudo cargar el estado de Stripe.',
    couldNotSaveBusiness: 'No se pudo guardar la información del negocio.',
    saved: 'Guardado.',
    storefront: 'Tienda',
    menu: 'Menú',
    orders: 'Órdenes',
    luxuryMode: 'Centro de control premium',
    placeholderHero: 'Tu imagen hero y vista previa del storefront aparecerán aquí.',
  },
} as const;

function makeLocalDateKey(dateInput: string) {
  const date = new Date(dateInput);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const t = COPY[lang];

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeActionLoading, setStripeActionLoading] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);

  const [userEmail, setUserEmail] = useState('');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [businessName, setBusinessName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessHours, setBusinessHours] = useState('');

  async function loadDashboard() {
    try {
      setLoading(true);
      setMessage('');

      const authRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const authPayload = await authRes.json().catch(() => ({}));

      if (!authRes.ok || !authPayload?.user?.email) {
        throw new Error('Could not load authenticated user.');
      }

      const email = String(authPayload.user.email || '');
      setUserEmail(email);

      const restaurantRes = await fetch(
        `/api/restaurants/by-owner-email?email=${encodeURIComponent(email)}`,
        { cache: 'no-store' }
      );
      const restaurantPayload = await restaurantRes.json().catch(() => ({}));

      if (!restaurantRes.ok || !restaurantPayload?.restaurant) {
        setRestaurant(null);
        setMenuItems([]);
        setOrders([]);
        setStripeStatus(null);
        setMessage(t.noRestaurant);
        setLoading(false);
        return;
      }

      const currentRestaurant = restaurantPayload.restaurant as Restaurant;
      setRestaurant(currentRestaurant);
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
    } catch (err: any) {
      setLoading(false);
      setMessage(err?.message || t.loading);
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

      setStripeStatus(payload as StripeStatus);

      if (payload?.stripe_account_id && restaurant) {
        setRestaurant({
          ...restaurant,
          stripe_account_id: payload.stripe_account_id,
        });
      }
    } catch (err: any) {
      setMessage(err?.message || t.couldNotLoadStripe);
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
          throw new Error(createPayload?.error || t.stripeCreateFailed);
        }

        accountId = String(createPayload.accountId || '');

        setRestaurant((current) =>
          current
            ? {
                ...current,
                stripe_account_id: accountId,
              }
            : current
        );
      }

      const linkResponse = await fetch('/api/connect/create-onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const linkPayload = await linkResponse.json().catch(() => ({}));

      if (!linkResponse.ok) {
        throw new Error(linkPayload?.error || t.stripeLinkFailed);
      }

      if (!linkPayload?.url) {
        throw new Error(t.stripeLinkFailed);
      }

      window.location.href = linkPayload.url;
    } catch (err: any) {
      setMessage(err?.message || t.stripeLinkFailed);
    } finally {
      setStripeActionLoading(false);
    }
  }

  async function handleSaveBusinessInformation() {
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
    } catch (err: any) {
      setMessage(err?.message || t.couldNotSaveBusiness);
    } finally {
      setSavingBusiness(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const storeLink = useMemo(() => {
    if (!restaurant?.slug) return '#';
    return `/store/${restaurant.slug}`;
  }, [restaurant?.slug]);

  const todaysSales = useMemo(() => {
    const today = makeLocalDateKey(new Date().toISOString());
    return orders.reduce((sum, order) => {
      if (!order.created_at) return sum;
      if (makeLocalDateKey(order.created_at) !== today) return sum;
      return sum + Number(order.total || 0);
    }, 0);
  }, [orders]);

  const todaysOrders = useMemo(() => {
    const today = makeLocalDateKey(new Date().toISOString());
    return orders.filter(
      (order) => order.created_at && makeLocalDateKey(order.created_at) === today
    ).length;
  }, [orders]);

  if (loading) {
    return <div style={loadingWrap}>{t.loading}</div>;
  }

  return (
    <div style={page}>
      <div style={ambientOne} />
      <div style={ambientTwo} />

      <div style={shell}>
        <div style={layout}>
          <aside style={sidebar}>
            <div style={brand}>MF</div>

            <button style={navButtonActive} onClick={() => router.push('/dashboard/owner')}>
              ⌂
            </button>

            <button
              style={navButton}
              onClick={() => router.push('/dashboard/owner/builder')}
            >
              ☰
            </button>

            <button
              style={navButton}
              onClick={() => {
                if (storeLink !== '#') window.location.href = storeLink;
              }}
            >
              ⊡
            </button>

            <button style={navButton} onClick={() => void loadDashboard()}>
              ↻
            </button>
          </aside>

          <main style={main}>
            <section style={heroCard}>
              <div style={eyebrow}>{t.ownerPanel}</div>

              <div style={topRow}>
                <div style={{ maxWidth: 760 }}>
                  <div style={luxuryBadge}>{t.luxuryMode}</div>
                  <h1 style={heroTitle}>
                    {t.welcome}, {restaurant?.name || 'Owner'}.
                  </h1>
                  <p style={heroText}>{t.subtitle}</p>
                  <div style={emailLine}>
                    {t.signedInAs}: <span style={emailStrong}>{userEmail}</span>
                  </div>
                </div>

                <div style={langToggle}>
                  <button
                    style={lang === 'en' ? langButtonActive : langButton}
                    onClick={() => setLang('en')}
                  >
                    EN
                  </button>
                  <button
                    style={lang === 'es' ? langButtonActive : langButton}
                    onClick={() => setLang('es')}
                  >
                    ES
                  </button>
                </div>
              </div>

              <div style={actionGrid}>
                <button
                  style={goldButton}
                  onClick={() => router.push('/dashboard/owner/builder')}
                >
                  {t.openMenuBuilder}
                </button>

                <button
                  style={outlineGoldButton}
                  onClick={() => {
                    if (storeLink !== '#') window.location.href = storeLink;
                  }}
                >
                  {t.viewStore}
                </button>
              </div>
            </section>

            <section style={statsGrid}>
              <div style={statCard}>
                <div style={statLabel}>{t.businessStatus}</div>
                <div style={statValue}>{t.active}</div>
                <div style={statSub}>{t.liveProfile}</div>
              </div>

              <div style={statCard}>
                <div style={statLabel}>{t.stripePayments}</div>
                <div style={statValueSmall}>
                  {stripeStatus?.connected ? t.stripeConnected : t.stripeNotConnected}
                </div>
                <div style={statSub}>
                  {stripeStatus?.connected ? t.stripeReady : t.stripeNeedsAttention}
                </div>
              </div>

              <div style={statCard}>
                <div style={statLabel}>{t.menuItems}</div>
                <div style={statValue}>{menuItems.length}</div>
                <div style={statSub}>{t.menu}</div>
              </div>

              <div style={statCard}>
                <div style={statLabel}>{t.todaysOrders}</div>
                <div style={statValue}>{todaysOrders}</div>
                <div style={statSub}>{t.ordersCreatedToday}</div>
              </div>

              <div style={statCardWide}>
                <div style={statLabel}>{t.todaysSales}</div>
                <div style={statValue}>${todaysSales.toFixed(2)}</div>
                <div style={statSub}>{t.basedOnOrderTotals}</div>
              </div>
            </section>

            <section style={contentGrid}>
              <div style={leftColumn}>
                <div style={card}>
                  <h2 style={cardTitle}>{t.businessInformation}</h2>

                  <label style={fieldLabel}>{t.businessName}</label>
                  <input
                    style={input}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />

                  <label style={fieldLabel}>{t.storeSlug}</label>
                  <input
                    style={input}
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value)}
                  />

                  <label style={fieldLabel}>{t.phoneNumber}</label>
                  <input
                    style={input}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />

                  <label style={fieldLabel}>{t.address}</label>
                  <input
                    style={input}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                  />

                  <label style={fieldLabel}>{t.hours}</label>
                  <input
                    style={input}
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                  />

                  <button style={goldButtonFull} onClick={() => void handleSaveBusinessInformation()}>
                    {savingBusiness ? t.saving : t.saveBusinessInformation}
                  </button>
                </div>

                <div style={card}>
                  <h2 style={cardTitle}>{t.stripePayments}</h2>
                  <p style={subText}>{t.stripePaymentsSub}</p>

                  <div style={stripeStatsGrid}>
                    <div style={stripeStat}>
                      <div style={stripeStatLabel}>{t.platformFee}</div>
                      <div style={stripeStatValue}>
                        {typeof stripeStatus?.platformFeePercent === 'number'
                          ? `${stripeStatus.platformFeePercent}%`
                          : '--'}
                      </div>
                    </div>

                    <div style={stripeStat}>
                      <div style={stripeStatLabel}>{t.onboardingComplete}</div>
                      <div style={stripeStatValue}>
                        {stripeStatus?.onboardingComplete
                          ? t.onboardingComplete
                          : t.onboardingIncomplete}
                      </div>
                    </div>

                    <div style={stripeStat}>
                      <div style={stripeStatLabel}>{t.chargesEnabled}</div>
                      <div style={stripeStatValue}>
                        {stripeStatus?.chargesEnabled ? 'Yes' : '--'}
                      </div>
                    </div>

                    <div style={stripeStat}>
                      <div style={stripeStatLabel}>{t.payoutsEnabled}</div>
                      <div style={stripeStatValue}>
                        {stripeStatus?.payoutsEnabled ? 'Yes' : '--'}
                      </div>
                    </div>
                  </div>

                  <div style={stripeButtons}>
                    <button
                      style={goldButtonFull}
                      onClick={() => void handleConnectStripe()}
                      disabled={stripeActionLoading || !restaurant?.id}
                    >
                      {stripeActionLoading
                        ? t.saving
                        : stripeStatus?.connected
                        ? t.resumeOnboarding
                        : t.connectStripe}
                    </button>

                    <button
                      style={outlineGoldButtonFull}
                      onClick={() => void refreshStripeStatus()}
                      disabled={stripeLoading || !restaurant?.id}
                    >
                      {stripeLoading ? t.stripeLoading : t.refreshStripe}
                    </button>
                  </div>
                </div>

                <div style={card}>
                  <div style={cardHeaderRow}>
                    <h2 style={cardTitle}>{t.allMenuItems}</h2>
                    <div style={smallCount}>
                      {menuItems.length} {t.total}
                    </div>
                  </div>

                  {menuItems.length === 0 ? (
                    <div style={emptyBox}>No menu items yet.</div>
                  ) : (
                    <div style={menuList}>
                      {menuItems.map((item) => (
                        <div key={item.id} style={menuCard}>
                          <div style={menuThumbWrap}>
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name || 'item'} style={menuThumb} />
                            ) : (
                              <div style={menuThumbPlaceholder} />
                            )}
                          </div>

                          <div style={menuCardText}>
                            <div style={menuName}>{item.name || 'Item'}</div>
                            <div style={menuPrice}>
                              ${Number(item.price || 0).toFixed(2)}
                            </div>
                            <div style={menuDesc}>{item.description || ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={rightColumn}>
                <div style={cardTall}>
                  <div style={cardHeaderRow}>
                    <h2 style={cardTitle}>{t.storePreview}</h2>
                    <div style={storePath}>{storeLink}</div>
                  </div>

                  <div style={previewCard}>
                    <div style={previewEyebrow}>{t.storefront}</div>
                    <div style={previewName}>{restaurant?.name || 'Store'}</div>
                    <div style={previewHeroPlaceholder}>{t.placeholderHero}</div>
                  </div>
                </div>

                <div style={card}>
                  <div style={cardHeaderRow}>
                    <h2 style={cardTitle}>{t.liveOrders}</h2>
                    <div style={smallCount}>{orders.length} loaded</div>
                  </div>

                  {orders.length === 0 ? (
                    <div style={emptyBox}>{t.noOrdersYet}</div>
                  ) : (
                    <div style={orderList}>
                      {orders.map((order) => (
                        <div key={order.id} style={orderRow}>
                          <div>
                            <div style={orderId}>{order.customer_name || order.id.slice(0, 8)}</div>
                            <div style={orderMeta}>
                              {order.payment_status || 'paid'} •{' '}
                              {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                            </div>
                          </div>
                          <div style={orderTotal}>${Number(order.total || 0).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {message ? <div style={messageBox}>{message}</div> : null}
          </main>
        </div>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(212,175,55,0.08), transparent 30%), radial-gradient(circle at bottom right, rgba(212,175,55,0.06), transparent 34%), #05060a',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
};

const ambientOne: CSSProperties = {
  position: 'fixed',
  top: '-120px',
  left: '-120px',
  width: '320px',
  height: '320px',
  borderRadius: '999px',
  background: 'rgba(212,175,55,0.06)',
  filter: 'blur(60px)',
  pointerEvents: 'none',
};

const ambientTwo: CSSProperties = {
  position: 'fixed',
  bottom: '-140px',
  right: '-120px',
  width: '360px',
  height: '360px',
  borderRadius: '999px',
  background: 'rgba(212,175,55,0.05)',
  filter: 'blur(70px)',
  pointerEvents: 'none',
};

const shell: CSSProperties = {
  maxWidth: '1480px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
};

const layout: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '104px 1fr',
  gap: '24px',
  alignItems: 'start',
};

const sidebar: CSSProperties = {
  background: 'rgba(15,16,24,0.96)',
  border: '1px solid rgba(212,175,55,0.14)',
  borderRadius: '34px',
  padding: '18px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  alignItems: 'center',
  minHeight: '720px',
  boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
};

const brand: CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '16px',
  background: 'linear-gradient(180deg, #d4af37 0%, #9f7a14 100%)',
  color: '#11131a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '20px',
};

const navButton: CSSProperties = {
  width: '58px',
  height: '58px',
  borderRadius: '16px',
  border: '1px solid rgba(212,175,55,0.14)',
  background: 'rgba(255,255,255,0.02)',
  color: '#d4af37',
  fontSize: '20px',
};

const navButtonActive: CSSProperties = {
  ...navButton,
  background: 'rgba(212,175,55,0.12)',
  border: '1px solid rgba(212,175,55,0.28)',
};

const main: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const heroCard: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(18,19,28,0.98) 0%, rgba(10,11,18,0.98) 100%)',
  border: '1px solid rgba(212,175,55,0.16)',
  borderRadius: '34px',
  padding: '32px 34px',
  boxShadow: '0 28px 70px rgba(0,0,0,0.42)',
};

const eyebrow: CSSProperties = {
  color: '#d4af37',
  fontWeight: 800,
  letterSpacing: '0.22em',
  fontSize: '14px',
  textTransform: 'uppercase',
  marginBottom: '10px',
};

const luxuryBadge: CSSProperties = {
  display: 'inline-block',
  color: '#11131a',
  background: '#d4af37',
  borderRadius: '999px',
  padding: '10px 16px',
  fontWeight: 900,
  fontSize: '13px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: '16px',
};

const topRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
};

const heroTitle: CSSProperties = {
  margin: 0,
  fontSize: '58px',
  lineHeight: 1,
  color: '#f8f6ef',
  fontWeight: 900,
  letterSpacing: '-0.05em',
};

const heroText: CSSProperties = {
  margin: '16px 0 10px',
  color: '#aaafba',
  fontSize: '18px',
  maxWidth: '760px',
  lineHeight: 1.65,
};

const emailLine: CSSProperties = {
  color: '#9ca3af',
  fontWeight: 700,
  fontSize: '16px',
};

const emailStrong: CSSProperties = {
  color: '#f3e7b0',
};

const langToggle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(212,175,55,0.08)',
  border: '1px solid rgba(212,175,55,0.18)',
  borderRadius: '20px',
  padding: '6px',
};

const langButton: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#c3b47a',
  borderRadius: '14px',
  padding: '14px 18px',
  fontWeight: 900,
};

const langButtonActive: CSSProperties = {
  ...langButton,
  background: '#d4af37',
  color: '#11131a',
};

const actionGrid: CSSProperties = {
  marginTop: '26px',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: '14px',
  maxWidth: '520px',
};

const goldButton: CSSProperties = {
  border: 'none',
  borderRadius: '20px',
  background: '#d4af37',
  color: '#11131a',
  fontWeight: 900,
  fontSize: '18px',
  padding: '20px 22px',
};

const outlineGoldButton: CSSProperties = {
  border: '1px solid rgba(212,175,55,0.24)',
  borderRadius: '20px',
  background: 'rgba(212,175,55,0.04)',
  color: '#f3e7b0',
  fontWeight: 900,
  fontSize: '18px',
  padding: '20px 22px',
};

const goldButtonFull: CSSProperties = {
  ...goldButton,
  width: '100%',
  marginTop: '20px',
};

const outlineGoldButtonFull: CSSProperties = {
  ...outlineGoldButton,
  width: '100%',
};

const statsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '20px',
};

const statCard: CSSProperties = {
  background: 'rgba(15,16,24,0.96)',
  borderRadius: '30px',
  padding: '24px',
  minHeight: '220px',
  border: '1px solid rgba(212,175,55,0.12)',
  boxShadow: '0 18px 50px rgba(0,0,0,0.34)',
};

const statCardWide: CSSProperties = {
  ...statCard,
  minHeight: '180px',
};

const statLabel: CSSProperties = {
  color: '#8f958f',
  fontWeight: 700,
  fontSize: '16px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const statValue: CSSProperties = {
  color: '#f8f6ef',
  fontSize: '56px',
  fontWeight: 900,
  lineHeight: 1,
  margin: '16px 0',
  letterSpacing: '-0.06em',
};

const statValueSmall: CSSProperties = {
  color: '#f8f6ef',
  fontSize: '32px',
  fontWeight: 900,
  lineHeight: 1.12,
  margin: '16px 0',
};

const statSub: CSSProperties = {
  color: '#9ba1ac',
  fontSize: '15px',
  lineHeight: 1.6,
};

const contentGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 430px)',
  gap: '22px',
  alignItems: 'start',
};

const leftColumn: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '22px',
};

const rightColumn: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '22px',
};

const card: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(16,17,24,0.98) 0%, rgba(10,11,18,0.98) 100%)',
  borderRadius: '30px',
  padding: '28px',
  border: '1px solid rgba(212,175,55,0.12)',
  boxShadow: '0 18px 50px rgba(0,0,0,0.32)',
};

const cardTall: CSSProperties = {
  ...card,
  minHeight: '520px',
};

const cardTitle: CSSProperties = {
  margin: 0,
  color: '#f8f6ef',
  fontSize: '34px',
  fontWeight: 900,
  letterSpacing: '-0.04em',
};

const subText: CSSProperties = {
  color: '#9ba1ac',
  fontSize: '16px',
  lineHeight: 1.7,
  marginTop: '12px',
  marginBottom: '20px',
};

const fieldLabel: CSSProperties = {
  display: 'block',
  color: '#f3e7b0',
  fontWeight: 800,
  fontSize: '16px',
  marginTop: '18px',
  marginBottom: '10px',
};

const input: CSSProperties = {
  width: '100%',
  height: '62px',
  borderRadius: '18px',
  border: '1px solid rgba(212,175,55,0.12)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f8f6ef',
  padding: '0 18px',
  fontSize: '17px',
  boxSizing: 'border-box',
};

const stripeStatsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '14px',
  marginTop: '16px',
};

const stripeStat: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(212,175,55,0.12)',
  borderRadius: '18px',
  padding: '18px',
  minHeight: '110px',
};

const stripeStatLabel: CSSProperties = {
  color: '#8f958f',
  fontWeight: 800,
  fontSize: '15px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const stripeStatValue: CSSProperties = {
  color: '#f8f6ef',
  fontWeight: 900,
  fontSize: '20px',
  marginTop: '10px',
  lineHeight: 1.35,
};

const stripeButtons: CSSProperties = {
  display: 'flex',
  gap: '14px',
  marginTop: '18px',
  flexWrap: 'wrap',
};

const cardHeaderRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
};

const smallCount: CSSProperties = {
  color: '#b39b45',
  fontSize: '16px',
  fontWeight: 800,
};

const previewCard: CSSProperties = {
  border: '1px solid rgba(212,175,55,0.12)',
  borderRadius: '24px',
  padding: '22px',
  background: 'rgba(255,255,255,0.02)',
  marginTop: '16px',
};

const previewEyebrow: CSSProperties = {
  color: '#d4af37',
  fontWeight: 800,
  fontSize: '14px',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
};

const previewName: CSSProperties = {
  color: '#f8f6ef',
  fontWeight: 900,
  fontSize: '34px',
  marginTop: '8px',
};

const previewHeroPlaceholder: CSSProperties = {
  marginTop: '18px',
  minHeight: '220px',
  borderRadius: '22px',
  border: '1px dashed rgba(212,175,55,0.16)',
  background: 'rgba(212,175,55,0.03)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: '#9ba1ac',
  fontSize: '18px',
  padding: '18px',
};

const storePath: CSSProperties = {
  color: '#9ba1ac',
  fontWeight: 700,
  fontSize: '14px',
};

const emptyBox: CSSProperties = {
  marginTop: '16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(212,175,55,0.1)',
  borderRadius: '18px',
  padding: '22px',
  color: '#9ba1ac',
  fontWeight: 700,
};

const menuList: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  marginTop: '16px',
};

const menuCard: CSSProperties = {
  display: 'flex',
  gap: '14px',
  padding: '14px',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(212,175,55,0.1)',
};

const menuThumbWrap: CSSProperties = {
  width: '92px',
  height: '92px',
  borderRadius: '18px',
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.06)',
  flexShrink: 0,
};

const menuThumb: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const menuThumbPlaceholder: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'rgba(255,255,255,0.06)',
};

const menuCardText: CSSProperties = {
  minWidth: 0,
};

const menuName: CSSProperties = {
  color: '#f8f6ef',
  fontWeight: 900,
  fontSize: '18px',
};

const menuPrice: CSSProperties = {
  color: '#d4af37',
  fontWeight: 900,
  fontSize: '18px',
  marginTop: '6px',
};

const menuDesc: CSSProperties = {
  color: '#9ba1ac',
  fontSize: '15px',
  marginTop: '6px',
  lineHeight: 1.5,
};

const orderList: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '16px',
};

const orderRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(212,175,55,0.1)',
  borderRadius: '16px',
  padding: '14px 16px',
};

const orderId: CSSProperties = {
  color: '#f8f6ef',
  fontWeight: 800,
};

const orderMeta: CSSProperties = {
  color: '#8e95a3',
  fontSize: '13px',
  marginTop: '4px',
};

const orderTotal: CSSProperties = {
  color: '#d4af37',
  fontWeight: 900,
};

const loadingWrap: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '22px',
  fontWeight: 800,
  color: '#f8f6ef',
  background: '#05060a',
};

const messageBox: CSSProperties = {
  background: 'rgba(212,175,55,0.08)',
  color: '#f3e7b0',
  border: '1px solid rgba(212,175,55,0.18)',
  borderRadius: '18px',
  padding: '16px 18px',
  fontWeight: 700,
};