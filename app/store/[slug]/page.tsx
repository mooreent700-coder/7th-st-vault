'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';

type RestaurantRow = {
  id: string;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  hero_url: string | null;
  logo_url: string | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  name: string | null;
  price: number | string | null;
  description: string | null;
  image_url: string | null;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  quantity: number;
};

type HoursRow = {
  enabled: boolean;
  open: string;
  close: string;
};

type HoursState = {
  mon: HoursRow;
  tue: HoursRow;
  wed: HoursRow;
  thu: HoursRow;
  fri: HoursRow;
  sat: HoursRow;
  sun: HoursRow;
};

const DAY_ORDER: Array<keyof HoursState> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const COPY = {
  en: {
    loading: 'Loading store...',
    notFound: 'Store not found.',
    menu: 'Menu',
    orderNow: 'Order now',
    add: 'Add',
    qty: 'Qty',
    subtotal: 'Subtotal',
    yourOrder: 'Your Order',
    close: 'Close',
    emptyCart: 'Your cart is empty.',
    payNow: 'Pay Now',
    openingCheckout: 'Opening checkout...',
    address: 'Address',
    phone: 'Phone',
    hours: 'Hours',
    noDescription: 'Fresh made with care.',
    noHours: 'Hours not available',
    closed: 'Closed',
    items: 'items',
    item: 'item',
    direct: 'Order direct. No fees.',
    details: 'Store details',
  },
  es: {
    loading: 'Cargando tienda...',
    notFound: 'No se encontró la tienda.',
    menu: 'Menú',
    orderNow: 'Ordena ahora',
    add: 'Agregar',
    qty: 'Cant.',
    subtotal: 'Subtotal',
    yourOrder: 'Tu pedido',
    close: 'Cerrar',
    emptyCart: 'Tu carrito está vacío.',
    payNow: 'Pagar ahora',
    openingCheckout: 'Abriendo pago...',
    address: 'Dirección',
    phone: 'Teléfono',
    hours: 'Horario',
    noDescription: 'Hecho fresco con cuidado.',
    noHours: 'Horario no disponible',
    closed: 'Cerrado',
    items: 'productos',
    item: 'producto',
    direct: 'Ordena directo. Sin tarifas.',
    details: 'Detalles de la tienda',
  },
} as const;

const DAY_LABELS: Record<Lang, Record<keyof HoursState, string>> = {
  en: {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  },
  es: {
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mié',
    thu: 'Jue',
    fri: 'Vie',
    sat: 'Sáb',
    sun: 'Dom',
  },
};

function safeNumber(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function parseHours(value: string | null): HoursState | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);

    return {
      mon: {
        enabled: Boolean(parsed?.mon?.enabled),
        open: parsed?.mon?.open || '09:00',
        close: parsed?.mon?.close || '17:00',
      },
      tue: {
        enabled: Boolean(parsed?.tue?.enabled),
        open: parsed?.tue?.open || '09:00',
        close: parsed?.tue?.close || '17:00',
      },
      wed: {
        enabled: Boolean(parsed?.wed?.enabled),
        open: parsed?.wed?.open || '09:00',
        close: parsed?.wed?.close || '17:00',
      },
      thu: {
        enabled: Boolean(parsed?.thu?.enabled),
        open: parsed?.thu?.open || '09:00',
        close: parsed?.thu?.close || '17:00',
      },
      fri: {
        enabled: Boolean(parsed?.fri?.enabled),
        open: parsed?.fri?.open || '09:00',
        close: parsed?.fri?.close || '17:00',
      },
      sat: {
        enabled: Boolean(parsed?.sat?.enabled),
        open: parsed?.sat?.open || '09:00',
        close: parsed?.sat?.close || '17:00',
      },
      sun: {
        enabled: Boolean(parsed?.sun?.enabled),
        open: parsed?.sun?.open || '09:00',
        close: parsed?.sun?.close || '17:00',
      },
    };
  } catch {
    return null;
  }
}

function toDisplayTime(value: string) {
  const parts = value.split(':');
  if (parts.length < 2) return value;

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 || 12;

  return `${normalized}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function buildHoursGroups(hours: HoursState | null, lang: Lang) {
  if (!hours) return [];

  const enabledDays = DAY_ORDER.filter((day) => hours[day].enabled);

  if (!enabledDays.length) return [];

  const groups: Array<{ label: string; range: string }> = [];
  let start = enabledDays[0];
  let prev = enabledDays[0];

  for (let i = 1; i <= enabledDays.length; i += 1) {
    const current = enabledDays[i];
    const prevIndex = DAY_ORDER.indexOf(prev);
    const currentIndex = current ? DAY_ORDER.indexOf(current) : -1;
    const prevRow = hours[prev];
    const sameBlock =
      current &&
      currentIndex === prevIndex + 1 &&
      hours[current].open === prevRow.open &&
      hours[current].close === prevRow.close;

    if (sameBlock) {
      prev = current!;
      continue;
    }

    const label =
      start === prev
        ? DAY_LABELS[lang][start]
        : `${DAY_LABELS[lang][start]}–${DAY_LABELS[lang][prev]}`;

    groups.push({
      label,
      range: `${toDisplayTime(prevRow.open)} - ${toDisplayTime(prevRow.close)}`,
    });

    if (current) {
      start = current;
      prev = current;
    }
  }

  return groups;
}

function formatHoursInline(hours: HoursState | null, lang: Lang, noHours: string, closed: string) {
  const groups = buildHoursGroups(hours, lang);
  if (!groups.length) return hours ? closed : noHours;
  return groups.map((group) => `${group.label}: ${group.range}`).join(' • ');
}

function buildInitials(name: string | null) {
  const value = (name || '').trim();
  if (!value) return 'M';
  return value.charAt(0).toUpperCase();
}

function normalizeCartItem(item: CartItem): MenuItemRow {
  return {
    id: item.id,
    restaurant_id: '',
    name: item.name,
    price: item.price,
    description: item.description,
    image_url: item.image_url,
  };
}

export default function StorefrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [lang, setLang] = useState<Lang>('en');
  const t = COPY[lang];

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadStore() {
      if (!slug) return;

      try {
        setLoading(true);

        const restaurantRes = await supabase
          .from('restaurants')
          .select('id, name, slug, phone, address, hours, hero_url, logo_url')
          .eq('slug', slug)
          .maybeSingle();

        if (restaurantRes.error) throw restaurantRes.error;

        if (!restaurantRes.data) {
          if (mounted) {
            setRestaurant(null);
            setMenuItems([]);
          }
          return;
        }

        const itemsRes = await supabase
          .from('menu_items')
          .select('id, restaurant_id, name, price, description, image_url')
          .eq('restaurant_id', restaurantRes.data.id)
          .order('created_at', { ascending: true });

        if (itemsRes.error) throw itemsRes.error;

        if (mounted) {
          setRestaurant(restaurantRes.data as RestaurantRow);
          setMenuItems((itemsRes.data || []) as MenuItemRow[]);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setRestaurant(null);
          setMenuItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadStore();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const parsedHours = useMemo(
    () => parseHours(restaurant?.hours || null),
    [restaurant?.hours]
  );

  const hourGroups = useMemo(
    () => buildHoursGroups(parsedHours, lang),
    [parsedHours, lang]
  );

  const hoursInline = useMemo(
    () => formatHoursInline(parsedHours, lang, t.noHours, t.closed),
    [parsedHours, lang, t.noHours, t.closed]
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartLabel = itemCount === 1 ? t.item : t.items;

  function addToCart(item: MenuItemRow) {
    const name = item.name?.trim() || '';
    if (!name) return;

    setCart((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);

      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }

      return [
        ...prev,
        {
          id: item.id,
          name,
          price: safeNumber(item.price),
          description: item.description?.trim() || '',
          image_url: item.image_url || null,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function openCheckout() {
    try {
      if (!slug) return;
      if (!cart.length) return;

      setCheckoutLoading(true);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          cart: cart.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Checkout failed');
      }

      if (!data?.url) {
        throw new Error('Checkout link was not created.');
      }

      window.location.href = data.url;
    } catch (error: any) {
      alert(error?.message || 'Checkout failed');
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="loadingPage">
        <div className="loadingText">{t.loading}</div>

        <style jsx>{`
          .loadingPage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f4f7fb;
          }
          .loadingText {
            color: #142132;
            font-size: 18px;
            font-weight: 900;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
        `}</style>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="notFoundPage">
        <div className="notFoundCard">{t.notFound}</div>

        <style jsx>{`
          .notFoundPage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f4f7fb;
            padding: 20px;
          }
          .notFoundCard {
            width: 100%;
            max-width: 520px;
            background: #fff;
            border: 1px solid rgba(20, 33, 50, 0.08);
            border-radius: 28px;
            padding: 28px;
            color: #142132;
            font-size: 22px;
            font-weight: 900;
            text-align: center;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="heroSection">
        {restaurant.hero_url ? (
          <img
            src={restaurant.hero_url}
            alt={restaurant.name || 'Store hero'}
            className="heroImage"
          />
        ) : (
          <div className="heroFallback" />
        )}

        <div className="heroOverlay" />

        <div className="heroContent">
          <div className="heroTopRow">
            <div className="heroBrandBlock">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name || 'Store logo'}
                  className="heroLogo"
                />
              ) : (
                <div className="heroLogoFallback">
                  {buildInitials(restaurant.name)}
                </div>
              )}

              <div className="heroTextBlock">
                <h1 className="heroTitle">{restaurant.name || ''}</h1>
                <p className="heroTagline">{t.direct}</p>
              </div>
            </div>

            <div className="langToggle">
              <button
                type="button"
                className={lang === 'en' ? 'langButton langActive' : 'langButton'}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={lang === 'es' ? 'langButton langActive' : 'langButton'}
                onClick={() => setLang('es')}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="contentWrap">
        <section className="infoCard">
          <div className="infoHeader">
            <h2 className="infoTitle">{t.details}</h2>
          </div>

          <div className="infoGrid">
            {restaurant.address ? (
              <div className="infoItem">
                <div className="infoLabel">{t.address}</div>
                <div className="infoValue">{restaurant.address}</div>
              </div>
            ) : null}

            {restaurant.phone ? (
              <div className="infoItem">
                <div className="infoLabel">{t.phone}</div>
                <div className="infoValue">{restaurant.phone}</div>
              </div>
            ) : null}

            <div className="infoItem infoItemFull">
              <div className="infoLabel">{t.hours}</div>

              {hourGroups.length ? (
                <div className="hoursGroupList">
                  {hourGroups.map((group) => (
                    <div key={`${group.label}-${group.range}`} className="hoursRow">
                      <span className="hoursDay">{group.label}</span>
                      <span className="hoursRange">{group.range}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="infoValue">{hoursInline}</div>
              )}
            </div>
          </div>
        </section>

        <section className="menuSection">
          <div className="sectionHead">
            <h2 className="sectionTitle">{t.menu}</h2>
            <div className="sectionSubtitle">{t.orderNow}</div>
          </div>

          <div className="menuGrid">
            {menuItems.map((item) => {
              const name = item.name?.trim() || '';
              if (!name) return null;

              return (
                <article key={item.id} className="menuCard">
                  <div className="menuImageWrap">
                    {item.image_url ? (
                      <img src={item.image_url} alt={name} className="menuImage" />
                    ) : (
                      <div className="menuImageFallback" />
                    )}
                  </div>

                  <div className="menuBody">
                    <div className="menuTop">
                      <div className="menuText">
                        <h3 className="menuName">{name}</h3>
                        <p className="menuDescription">
                          {item.description?.trim() || t.noDescription}
                        </p>
                      </div>

                      <div className="menuPrice">{money(safeNumber(item.price))}</div>
                    </div>

                    <button
                      type="button"
                      className="addButton"
                      onClick={() => addToCart(item)}
                    >
                      {t.add}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      {itemCount > 0 ? (
        <button
          type="button"
          className="stickyCart"
          onClick={() => setCartOpen(true)}
        >
          <span>
            {t.yourOrder} ({itemCount} {cartLabel})
          </span>
          <span>{money(subtotal)}</span>
        </button>
      ) : null}

      {cartOpen ? (
        <div className="cartOverlay" onClick={() => setCartOpen(false)}>
          <div className="cartSheet" onClick={(e) => e.stopPropagation()}>
            <div className="cartHeader">
              <h3>{t.yourOrder}</h3>
              <button
                type="button"
                className="closeButton"
                onClick={() => setCartOpen(false)}
              >
                {t.close}
              </button>
            </div>

            <div className="cartBody">
              {cart.length === 0 ? (
                <div className="emptyCart">{t.emptyCart}</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cartItem">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="cartThumb" />
                    ) : (
                      <div className="cartThumb cartThumbFallback" />
                    )}

                    <div className="cartItemInfo">
                      <div className="cartItemTop">
                        <div className="cartItemName">{item.name}</div>
                        <div className="cartItemPrice">
                          {money(item.price * item.quantity)}
                        </div>
                      </div>

                      <div className="cartItemMeta">
                        {t.qty}: {item.quantity}
                      </div>

                      <div className="cartActions">
                        <button
                          type="button"
                          className="qtyButton"
                          onClick={() => addToCart(normalizeCartItem(item))}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="qtyButton dangerQty"
                          onClick={() => removeFromCart(item.id)}
                        >
                          -
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cartFooter">
              <div className="subtotalRow">
                <span>{t.subtotal}</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <button
                type="button"
                className="checkoutButton"
                disabled={!cart.length || checkoutLoading}
                onClick={openCheckout}
              >
                {checkoutLoading ? t.openingCheckout : t.payNow}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(226, 232, 240, 0.35), transparent 35%),
            linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
          color: #142132;
          padding-bottom: 112px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .heroSection {
          position: relative;
          width: 100%;
          min-height: 430px;
          height: 58vh;
          max-height: 720px;
          overflow: hidden;
          background: #0f172a;
        }

        .heroImage,
        .heroFallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background:
            linear-gradient(135deg, #111827 0%, #0f172a 100%);
        }

        .heroOverlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(2, 6, 23, 0.08) 0%, rgba(2, 6, 23, 0.28) 45%, rgba(2, 6, 23, 0.72) 100%);
        }

        .heroContent {
          position: relative;
          z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: end;
          padding: 24px 18px 28px;
        }

        .heroTopRow {
          width: 100%;
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }

        .heroBrandBlock {
          display: flex;
          align-items: end;
          gap: 18px;
          min-width: 0;
        }

        .heroLogo,
        .heroLogoFallback {
          width: 92px;
          height: 92px;
          border-radius: 26px;
          object-fit: cover;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.98);
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 900;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
        }

        .heroTextBlock {
          min-width: 0;
        }

        .heroTitle {
          margin: 0;
          color: #ffffff;
          font-size: clamp(44px, 8vw, 90px);
          line-height: 0.92;
          letter-spacing: -0.06em;
          font-weight: 900;
          text-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
          word-break: break-word;
        }

        .heroTagline {
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.92);
          font-size: clamp(18px, 2vw, 24px);
          line-height: 1.2;
          font-weight: 800;
          text-shadow: 0 10px 22px rgba(0, 0, 0, 0.2);
        }

        .langToggle {
          display: inline-flex;
          gap: 6px;
          padding: 6px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.18);
        }

        .langButton {
          border: none;
          min-width: 68px;
          min-height: 48px;
          border-radius: 16px;
          background: transparent;
          color: rgba(255, 255, 255, 0.78);
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .langActive {
          background: #ffffff;
          color: #0f172a;
        }

        .contentWrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 22px 16px 0;
        }

        .infoCard {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 32px;
          padding: 24px;
          box-shadow: 0 22px 50px rgba(15, 23, 42, 0.06);
          backdrop-filter: blur(10px);
          margin-top: -46px;
          position: relative;
          z-index: 3;
        }

        .infoHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .infoTitle {
          margin: 0;
          color: #142132;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .infoGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .infoItem {
          min-width: 0;
          border-radius: 24px;
          background: #f8fbff;
          border: 1px solid rgba(20, 33, 50, 0.07);
          padding: 18px;
        }

        .infoItemFull {
          grid-column: span 1;
        }

        .infoLabel {
          color: #758195;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .infoValue {
          margin-top: 8px;
          color: #142132;
          font-size: 22px;
          line-height: 1.32;
          font-weight: 900;
          word-break: break-word;
        }

        .hoursGroupList {
          margin-top: 8px;
          display: grid;
          gap: 10px;
        }

        .hoursRow {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 14px;
          border-top: 1px solid rgba(20, 33, 50, 0.06);
          padding-top: 10px;
        }

        .hoursRow:first-child {
          border-top: none;
          padding-top: 0;
        }

        .hoursDay {
          color: #142132;
          font-size: 16px;
          font-weight: 900;
          white-space: nowrap;
        }

        .hoursRange {
          color: #475569;
          font-size: 15px;
          line-height: 1.4;
          font-weight: 800;
          text-align: right;
        }

        .menuSection {
          margin-top: 22px;
        }

        .sectionHead {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 16px;
          margin-bottom: 14px;
        }

        .sectionTitle {
          margin: 0;
          color: #142132;
          font-size: clamp(34px, 5vw, 54px);
          line-height: 1;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .sectionSubtitle {
          color: #738093;
          font-size: 18px;
          font-weight: 900;
        }

        .menuGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .menuCard {
          overflow: hidden;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(20, 33, 50, 0.08);
          box-shadow: 0 20px 44px rgba(15, 23, 42, 0.06);
        }

        .menuImageWrap {
          width: 100%;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #eef2f8;
        }

        .menuImage,
        .menuImageFallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .menuBody {
          padding: 18px;
        }

        .menuTop {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 14px;
          align-items: start;
        }

        .menuText {
          min-width: 0;
        }

        .menuName {
          margin: 0;
          color: #142132;
          font-size: 28px;
          line-height: 1.02;
          font-weight: 900;
          letter-spacing: -0.04em;
          word-break: break-word;
        }

        .menuDescription {
          margin: 10px 0 0;
          color: #566274;
          font-size: 16px;
          line-height: 1.55;
          font-weight: 700;
        }

        .menuPrice {
          color: #142132;
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
          white-space: nowrap;
        }

        .addButton {
          margin-top: 18px;
          width: 100%;
          min-height: 58px;
          border: none;
          border-radius: 18px;
          background: #0f172a;
          color: #fff;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
        }

        .stickyCart {
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: 12px;
          z-index: 50;
          min-height: 66px;
          border: none;
          border-radius: 22px;
          background: #0f172a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          font-size: 18px;
          font-weight: 900;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.24);
          cursor: pointer;
        }

        .cartOverlay {
          position: fixed;
          inset: 0;
          z-index: 70;
          background: rgba(15, 23, 42, 0.52);
          display: flex;
          align-items: end;
          justify-content: center;
          padding: 12px;
        }

        .cartSheet {
          width: 100%;
          max-width: 760px;
          max-height: 84vh;
          display: flex;
          flex-direction: column;
          background: #fff;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 22px 52px rgba(15, 23, 42, 0.24);
        }

        .cartHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 20px 12px;
          border-bottom: 1px solid rgba(20, 33, 50, 0.08);
        }

        .cartHeader h3 {
          margin: 0;
          color: #142132;
          font-size: 28px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .closeButton {
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .cartBody {
          padding: 12px 20px;
          overflow: auto;
          display: grid;
          gap: 12px;
        }

        .emptyCart {
          color: #64748b;
          font-size: 18px;
          font-weight: 800;
          padding: 20px 0;
        }

        .cartItem {
          display: grid;
          grid-template-columns: 84px 1fr;
          gap: 12px;
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 20px;
          padding: 10px;
        }

        .cartThumb,
        .cartThumbFallback {
          width: 84px;
          height: 84px;
          border-radius: 16px;
          object-fit: cover;
          display: block;
          background: #eef2f8;
        }

        .cartItemInfo {
          min-width: 0;
        }

        .cartItemTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: start;
        }

        .cartItemName,
        .cartItemPrice {
          color: #142132;
          font-size: 18px;
          font-weight: 900;
        }

        .cartItemMeta {
          margin-top: 8px;
          color: #64748b;
          font-size: 15px;
          font-weight: 800;
        }

        .cartActions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }

        .qtyButton {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 14px;
          background: #0f172a;
          color: #fff;
          font-size: 22px;
          font-weight: 900;
          cursor: pointer;
        }

        .dangerQty {
          background: #e11d48;
        }

        .cartFooter {
          padding: 16px 20px 20px;
          border-top: 1px solid rgba(20, 33, 50, 0.08);
          background: #fff;
        }

        .subtotalRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #142132;
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .checkoutButton {
          width: 100%;
          min-height: 60px;
          border: none;
          border-radius: 18px;
          background: #000;
          color: #fff;
          font-size: 20px;
          font-weight: 900;
          cursor: pointer;
        }

        .checkoutButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 980px) {
          .infoGrid {
            grid-template-columns: 1fr 1fr;
          }

          .infoItemFull {
            grid-column: span 2;
          }

          .menuGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .heroSection {
            min-height: 380px;
            height: 54vh;
          }

          .heroContent {
            padding: 18px 12px 18px;
          }

          .heroTopRow {
            align-items: end;
          }

          .heroBrandBlock {
            gap: 14px;
            align-items: end;
          }

          .heroLogo,
          .heroLogoFallback {
            width: 76px;
            height: 76px;
            border-radius: 22px;
            font-size: 30px;
          }

          .heroTitle {
            font-size: clamp(34px, 12vw, 56px);
          }

          .heroTagline {
            margin-top: 10px;
            font-size: 16px;
          }

          .langToggle {
            padding: 5px;
            border-radius: 18px;
          }

          .langButton {
            min-width: 58px;
            min-height: 44px;
            border-radius: 14px;
          }

          .contentWrap {
            padding: 14px 12px 0;
          }

          .infoCard {
            padding: 18px;
            border-radius: 26px;
            margin-top: -34px;
          }

          .infoGrid {
            grid-template-columns: 1fr;
          }

          .infoItemFull {
            grid-column: span 1;
          }

          .infoValue {
            font-size: 18px;
          }

          .hoursRow {
            flex-direction: column;
            gap: 4px;
          }

          .hoursRange {
            text-align: left;
          }

          .sectionTitle {
            font-size: clamp(30px, 9vw, 44px);
          }

          .sectionSubtitle {
            font-size: 16px;
          }

          .menuBody {
            padding: 16px;
          }

          .menuTop {
            grid-template-columns: 1fr;
          }

          .menuName {
            font-size: 24px;
          }

          .menuPrice {
            font-size: 20px;
          }

          .stickyCart {
            font-size: 16px;
            min-height: 62px;
          }

          .cartSheet {
            border-radius: 24px;
          }

          .cartHeader h3 {
            font-size: 24px;
          }
        }
      `}</style>
    </main>
  );
}