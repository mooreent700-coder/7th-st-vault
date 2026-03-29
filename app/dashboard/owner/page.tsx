'use client';

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
};

const COPY = {
  en: {
    loading: 'Loading owner panel...',
    noRestaurant: 'No restaurant found.',
    businessStatus: 'Business Status',
    active: 'Active',
    liveProfile: 'Your store profile is live in the system',
    stripePayments: 'Stripe Payments',
    stripePaymentsSub:
      'Connect your Stripe account to receive payouts and let MenuFlow take the correct platform fee automatically.',
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
    stripeReady: 'Ready to take direct payouts',
    stripeNeedsAttention: 'Finish Stripe setup to accept live payments',
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
    basedOnOrderTotals: 'Based on order totals',
    menuItems: 'Menu Items',
    todaysOrders: "Today's Orders",
    ordersCreatedToday: 'Orders created today',
    noOrdersYet: 'No orders yet.',
    liveOrders: 'Live Orders',
    storePreview: 'Store Preview',
    allMenuItems: 'All Menu Items',
    total: 'total',
    openMenuBuilder: 'Open Menu Builder',
    viewStore: 'View Store',
    saving: 'Saving...',
    ownerPanel: 'MenuFlow Owner Panel',
    signedInAs: 'Signed in as',
    couldNotLoadStripe: 'Could not load Stripe status.',
    couldNotSaveBusiness: 'Could not save business information.',
    saved: 'Saved.',
  },
  es: {
    loading: 'Cargando panel del dueño...',
    noRestaurant: 'No se encontró restaurante.',
    businessStatus: 'Estado del negocio',
    active: 'Activo',
    liveProfile: 'Tu perfil de tienda está activo en el sistema',
    stripePayments: 'Pagos con Stripe',
    stripePaymentsSub:
      'Conecta tu cuenta de Stripe para recibir pagos y dejar que MenuFlow tome automáticamente el porcentaje correcto.',
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
    stripeReady: 'Listo para recibir pagos directos',
    stripeNeedsAttention: 'Termina la configuración de Stripe para aceptar pagos en vivo',
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
    basedOnOrderTotals: 'Basado en totales de órdenes',
    menuItems: 'Artículos del menú',
    todaysOrders: 'Órdenes de hoy',
    ordersCreatedToday: 'Órdenes creadas hoy',
    noOrdersYet: 'Todavía no hay órdenes.',
    liveOrders: 'Órdenes en vivo',
    storePreview: 'Vista previa de tienda',
    allMenuItems: 'Todos los artículos',
    total: 'total',
    openMenuBuilder: 'Abrir constructor de menú',
    viewStore: 'Ver tienda',
    saving: 'Guardando...',
    ownerPanel: 'Panel del dueño MenuFlow',
    signedInAs: 'Sesión iniciada como',
    couldNotLoadStripe: 'No se pudo cargar el estado de Stripe.',
    couldNotSaveBusiness: 'No se pudo guardar la información del negocio.',
    saved: 'Guardado.',
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

      const restaurantRes = await fetch(`/api/restaurants/by-owner-email?email=${encodeURIComponent(email)}`, {
        cache: 'no-store',
      });
      const restaurantPayload = await restaurantRes.json().catch(() => ({}));

      if (!restaurantRes.ok || !restaurantPayload?.restaurant) {
        setRestaurant(null);
        setMenuItems([]);
        setOrders([]);
        setStripeStatus(null);
        setLoading(false);
        setMessage(t.noRestaurant);
        return;
      }

      const currentRestaurant = restaurantPayload.restaurant as Restaurant;
      setRestaurant(currentRestaurant);
      setBusinessName(currentRestaurant.name || '');
      setStoreSlug(currentRestaurant.slug || '');
      setPhoneNumber(currentRestaurant.phone || '');
      setBusinessAddress(currentRestaurant.address || '');
      setBusinessHours(currentRestaurant.hours || '');

      if (currentRestaurant.id) {
        const [menuRes, ordersRes] = await Promise.all([
          fetch(`/api/menu-items/by-restaurant?restaurantId=${encodeURIComponent(currentRestaurant.id)}`, {
            cache: 'no-store',
          }),
          fetch(`/api/orders/by-restaurant?restaurantId=${encodeURIComponent(currentRestaurant.id)}`, {
            cache: 'no-store',
          }),
        ]);

        const menuPayload = await menuRes.json().catch(() => ({}));
        const ordersPayload = await ordersRes.json().catch(() => ({}));

        setMenuItems(Array.isArray(menuPayload?.items) ? menuPayload.items : []);
        setOrders(Array.isArray(ordersPayload?.orders) ? ordersPayload.orders : []);

        await refreshStripeStatus(currentRestaurant.id);
      }

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
          headers: {
            'Content-Type': 'application/json',
          },
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
        }),
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
    return orders.filter((order) => order.created_at && makeLocalDateKey(order.created_at) === today).length;
  }, [orders]);

  if (loading) {
    return <div style={loadingWrap}>{t.loading}</div>;
  }

  return (
    <div style={page}>
      <div style={shell}>
        <div style={layout}>
          <aside style={sidebar}>
            <div style={brand}>MF</div>

            <button style={navButtonActive} onClick={() => router.push('/dashboard/owner')}>
              ⌂
            </button>

            <button style={navButton} onClick={() => router.push('/dashboard/owner/builder')}>
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
                <div>
                  <h1 style={heroTitle}>Good Morning, {restaurant?.name || 'Owner'} 👋</h1>
                  <p style={heroText}>Manage your business profile, menu, orders, and live storefront from one place.</p>
                  <div style={emailLine}>{userEmail}</div>
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

              <div style={actionBox}>
                <button style={primaryButton} onClick={() => router.push('/dashboard/owner/builder')}>
                  {t.openMenuBuilder}
                </button>
                <button
                  style={primaryButton}
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
                <div style={statValueSmall}>{stripeStatus?.connected ? t.stripeConnected : t.stripeNotConnected}</div>
                <div style={statSub}>{stripeStatus?.connected ? t.stripeReady : t.stripeNeedsAttention}</div>
              </div>

              <div style={statCard}>
                <div style={statLabel}>{t.menuItems}</div>
                <div style={statValue}>{menuItems.length}</div>
                <div style={statSub}>Everything from builder shows here</div>
              </div>

              <div style={statCard}>
                <div style={statLabel}>{t.todaysOrders}</div>
                <div style={statValue}>{todaysOrders}</div>
                <div style={statSub}>{t.ordersCreatedToday}</div>
              </div>

              <div style={statCardSmall}>
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
                  <input style={input} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />

                  <label style={fieldLabel}>{t.storeSlug}</label>
                  <input style={input} value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} />

                  <label style={fieldLabel}>{t.phoneNumber}</label>
                  <input style={input} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />

                  <label style={fieldLabel}>{t.address}</label>
                  <input style={input} value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />

                  <label style={fieldLabel}>{t.hours}</label>
                  <input style={input} value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} />

                  <button style={saveButton} onClick={() => void handleSaveBusinessInformation()}>
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
                        {stripeStatus?.onboardingComplete ? t.onboardingComplete : t.onboardingIncomplete}
                      </div>
                    </div>

                    <div style={stripeStat}>
                      <div style={stripeStatLabel}>{t.chargesEnabled}</div>
                      <div style={stripeStatValue}>{stripeStatus?.chargesEnabled ? 'Yes' : '--'}</div>
                    </div>

                    <div style={stripeStat}>
                      <div style={stripeStatLabel}>{t.payoutsEnabled}</div>
                      <div style={stripeStatValue}>{stripeStatus?.payoutsEnabled ? 'Yes' : '--'}</div>
                    </div>
                  </div>

                  <div style={stripeButtons}>
                    <button
                      style={saveButton}
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
                      style={secondaryButton}
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
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image_url} alt={item.name || 'item'} style={menuThumb} />
                            ) : (
                              <div style={menuThumbPlaceholder} />
                            )}
                          </div>
                          <div style={menuCardText}>
                            <div style={menuName}>{item.name || 'Item'}</div>
                            <div style={menuPrice}>${Number(item.price || 0).toFixed(2)}</div>
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
                    <div style={previewEyebrow}>MenuFlow Store</div>
                    <div style={previewName}>{restaurant?.name || 'Store'}</div>
                    <div style={previewHeroPlaceholder}>Hero image will show here after upload.</div>
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
                          <div style={orderId}>{order.id.slice(0, 8)}</div>
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

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#eef1f7',
  padding: '24px',
};

const shell: React.CSSProperties = {
  maxWidth: '1400px',
  margin: '0 auto',
};

const layout: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '104px 1fr',
  gap: '24px',
  alignItems: 'start',
};

const sidebar: React.CSSProperties = {
  background: '#f8fafc',
  borderRadius: '34px',
  padding: '18px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  alignItems: 'center',
  minHeight: '720px',
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
};

const brand: React.CSSProperties = {
  width: '52px',
  height: '52px',
  borderRadius: '16px',
  background: '#5c88f6',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '20px',
};

const navButton: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '16px',
  border: '1px solid #d9e1f2',
  background: '#fff',
  color: '#4563a5',
  fontSize: '20px',
};

const navButtonActive: React.CSSProperties = {
  ...navButton,
  background: '#eef4ff',
  border: '1px solid #b7caf7',
};

const main: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const heroCard: React.CSSProperties = {
  background: '#f8fafc',
  borderRadius: '34px',
  padding: '28px 34px',
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
};

const eyebrow: React.CSSProperties = {
  color: '#5c88f6',
  fontWeight: 700,
  marginBottom: '10px',
};

const topRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
};

const heroTitle: React.CSSProperties = {
  margin: 0,
  fontSize: '56px',
  lineHeight: 1,
  color: '#17233f',
  fontWeight: 900,
};

const heroText: React.CSSProperties = {
  margin: '14px 0 8px',
  color: '#5f6b82',
  fontSize: '18px',
  maxWidth: '700px',
  lineHeight: 1.5,
};

const emailLine: React.CSSProperties = {
  fontWeight: 800,
  color: '#17233f',
  fontSize: '18px',
};

const langToggle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: '#edf2fb',
  border: '1px solid #c8d6f5',
  borderRadius: '20px',
  padding: '6px',
};

const langButton: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#6f7b92',
  borderRadius: '14px',
  padding: '14px 18px',
  fontWeight: 800,
};

const langButtonActive: React.CSSProperties = {
  ...langButton,
  background: '#5c88f6',
  color: '#fff',
};

const actionBox: React.CSSProperties = {
  marginTop: '22px',
  maxWidth: '340px',
  background: '#fff',
  borderRadius: '26px',
  padding: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
};

const primaryButton: React.CSSProperties = {
  background: '#5c88f6',
  color: '#fff',
  border: 'none',
  borderRadius: '18px',
  padding: '20px',
  fontWeight: 800,
  fontSize: '18px',
};

const statsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '20px',
};

const statCard: React.CSSProperties = {
  background: '#f8fafc',
  borderRadius: '30px',
  padding: '24px',
  minHeight: '220px',
  boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
};

const statCardSmall: React.CSSProperties = {
  ...statCard,
  minHeight: '170px',
};

const statLabel: React.CSSProperties = {
  color: '#707b8f',
  fontWeight: 700,
  fontSize: '18px',
};

const statValue: React.CSSProperties = {
  color: '#17233f',
  fontSize: '58px',
  fontWeight: 900,
  lineHeight: 1,
  margin: '16px 0',
};

const statValueSmall: React.CSSProperties = {
  color: '#17233f',
  fontSize: '34px',
  fontWeight: 900,
  lineHeight: 1.1,
  margin: '16px 0',
};

const statSub: React.CSSProperties = {
  color: '#707b8f',
  fontSize: '16px',
  lineHeight: 1.5,
};

const contentGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 420px)',
  gap: '22px',
  alignItems: 'start',
};

const leftColumn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '22px',
};

const rightColumn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '22px',
};

const card: React.CSSProperties = {
  background: '#f8fafc',
  borderRadius: '30px',
  padding: '28px',
  boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
};

const cardTall: React.CSSProperties = {
  ...card,
  minHeight: '520px',
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  color: '#17233f',
  fontSize: '36px',
  fontWeight: 900,
};

const subText: React.CSSProperties = {
  color: '#707b8f',
  fontSize: '16px',
  lineHeight: 1.7,
  marginTop: '12px',
  marginBottom: '20px',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  color: '#17233f',
  fontWeight: 800,
  fontSize: '18px',
  marginTop: '20px',
  marginBottom: '10px',
};

const input: React.CSSProperties = {
  width: '100%',
  height: '64px',
  borderRadius: '18px',
  border: '1px solid #d6dce8',
  background: '#fff',
  padding: '0 18px',
  fontSize: '18px',
  color: '#17233f',
  boxSizing: 'border-box',
};

const saveButton: React.CSSProperties = {
  marginTop: '22px',
  background: '#54a84f',
  color: '#fff',
  border: 'none',
  borderRadius: '18px',
  padding: '20px 22px',
  fontWeight: 900,
  fontSize: '18px',
};

const secondaryButton: React.CSSProperties = {
  background: '#eef4ff',
  color: '#4b6dd9',
  border: '1px solid #bfd0f6',
  borderRadius: '18px',
  padding: '20px 22px',
  fontWeight: 900,
  fontSize: '18px',
};

const stripeStatsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '14px',
  marginTop: '16px',
};

const stripeStat: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dce4f3',
  borderRadius: '18px',
  padding: '18px',
  minHeight: '110px',
};

const stripeStatLabel: React.CSSProperties = {
  color: '#707b8f',
  fontWeight: 800,
  fontSize: '16px',
};

const stripeStatValue: React.CSSProperties = {
  color: '#17233f',
  fontWeight: 900,
  fontSize: '20px',
  marginTop: '10px',
  lineHeight: 1.3,
};

const stripeButtons: React.CSSProperties = {
  display: 'flex',
  gap: '14px',
  marginTop: '18px',
  flexWrap: 'wrap',
};

const cardHeaderRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
};

const smallCount: React.CSSProperties = {
  color: '#707b8f',
  fontSize: '18px',
  fontWeight: 800,
};

const previewCard: React.CSSProperties = {
  border: '1px solid #d7e0f4',
  borderRadius: '24px',
  padding: '22px',
  background: '#fff',
  marginTop: '16px',
};

const previewEyebrow: React.CSSProperties = {
  color: '#5c88f6',
  fontWeight: 800,
  fontSize: '16px',
};

const previewName: React.CSSProperties = {
  color: '#17233f',
  fontWeight: 900,
  fontSize: '34px',
  marginTop: '8px',
};

const previewHeroPlaceholder: React.CSSProperties = {
  marginTop: '18px',
  minHeight: '220px',
  borderRadius: '22px',
  border: '1px dashed #d6dfef',
  background: '#f6f8fd',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: '#96a3bb',
  fontSize: '18px',
  padding: '18px',
};

const storePath: React.CSSProperties = {
  color: '#707b8f',
  fontWeight: 700,
  fontSize: '16px',
};

const emptyBox: React.CSSProperties = {
  marginTop: '16px',
  background: '#f3f5f9',
  border: '1px solid #dce2ec',
  borderRadius: '18px',
  padding: '22px',
  color: '#707b8f',
  fontWeight: 700,
};

const menuList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  marginTop: '16px',
};

const menuCard: React.CSSProperties = {
  display: 'flex',
  gap: '14px',
  padding: '14px',
  borderRadius: '18px',
  background: '#fff',
  border: '1px solid #dde5f2',
};

const menuThumbWrap: React.CSSProperties = {
  width: '92px',
  height: '92px',
  borderRadius: '18px',
  overflow: 'hidden',
  background: '#eef2f8',
  flexShrink: 0,
};

const menuThumb: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const menuThumbPlaceholder: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: '#eef2f8',
};

const menuCardText: React.CSSProperties = {
  minWidth: 0,
};

const menuName: React.CSSProperties = {
  color: '#17233f',
  fontWeight: 900,
  fontSize: '18px',
};

const menuPrice: React.CSSProperties = {
  color: '#5c88f6',
  fontWeight: 900,
  fontSize: '18px',
  marginTop: '6px',
};

const menuDesc: React.CSSProperties = {
  color: '#707b8f',
  fontSize: '15px',
  marginTop: '6px',
  lineHeight: 1.5,
};

const orderList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '16px',
};

const orderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#fff',
  border: '1px solid #dde5f2',
  borderRadius: '16px',
  padding: '14px 16px',
};

const orderId: React.CSSProperties = {
  color: '#17233f',
  fontWeight: 800,
};

const orderTotal: React.CSSProperties = {
  color: '#5c88f6',
  fontWeight: 900,
};

const loadingWrap: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '22px',
  fontWeight: 800,
  color: '#17233f',
  background: '#eef1f7',
};

const messageBox: React.CSSProperties = {
  background: '#fff8e8',
  color: '#7a5b00',
  border: '1px solid #f3df9e',
  borderRadius: '18px',
  padding: '16px 18px',
  fontWeight: 700,
};