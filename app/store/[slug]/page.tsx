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
  stripe_account_id?: string | null;
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
    add: 'Add',
    remove: 'Remove',
    viewCart: 'View Cart',
    yourOrder: 'Your Order',
    emptyCart: 'Your cart is empty.',
    subtotal: 'Subtotal',
    checkout: 'Pay Now',
    checkoutLoading: 'Opening checkout...',
    close: 'Close',
    orderNow: 'Order now',
    menu: 'Menu',
    address: 'Address',
    phone: 'Phone',
    hours: 'Hours',
    qty: 'Qty',
    item: 'item',
    items: 'items',
    noDescription: 'Fresh made with care.',
    storeClosed: 'Closed',
    noHours: 'Hours not available',
    checkoutUnavailable: 'Checkout is not available for this store yet.',
    checkoutFailed: 'Could not open checkout.',
  },
  es: {
    loading: 'Cargando tienda...',
    notFound: 'No se encontró la tienda.',
    add: 'Agregar',
    remove: 'Eliminar',
    viewCart: 'Ver carrito',
    yourOrder: 'Tu pedido',
    emptyCart: 'Tu carrito está vacío.',
    subtotal: 'Subtotal',
    checkout: 'Pagar ahora',
    checkoutLoading: 'Abriendo checkout...',
    close: 'Cerrar',
    orderNow: 'Ordena ahora',
    menu: 'Menú',
    address: 'Dirección',
    phone: 'Teléfono',
    hours: 'Horario',
    qty: 'Cant.',
    item: 'producto',
    items: 'productos',
    noDescription: 'Hecho fresco con cuidado.',
    storeClosed: 'Cerrado',
    noHours: 'Horario no disponible',
    checkoutUnavailable: 'El checkout todavía no está disponible para esta tienda.',
    checkoutFailed: 'No se pudo abrir el checkout.',
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

function buildHourGroups(hours: HoursState | null, lang: Lang, noHours: string, closedText: string) {
  if (!hours) return [noHours];

  const enabledDays = DAY_ORDER.filter((day) => hours[day].enabled);
  if (!enabledDays.length) return [closedText];

  const groups: Array<{ days: Array<keyof HoursState>; open: string; close: string }> = [];

  for (const day of enabledDays) {
    const row = hours[day];
    const last = groups[groups.length - 1];

    if (last && last.open === row.open && last.close === row.close) {
      last.days.push(day);
    } else {
      groups.push({
        days: [day],
        open: row.open,
        close: row.close,
      });
    }
  }

  return groups.map((group) => {
    const first = group.days[0];
    const last = group.days[group.days.length - 1];
    const dayText =
      group.days.length === 1
        ? DAY_LABELS[lang][first]
        : `${DAY_LABELS[lang][first]}–${DAY_LABELS[lang][last]}`;

    return `${dayText}: ${toDisplayTime(group.open)}–${toDisplayTime(group.close)}`;
  });
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
          .select('id, name, slug, phone, address, hours, hero_url, logo_url, stripe_account_id')
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

  const hourLines = useMemo(
    () => buildHourGroups(parseHours(restaurant?.hours || null), lang, t.noHours, t.storeClosed),
    [restaurant?.hours, lang, t.noHours, t.storeClosed]
  );

  const itemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartLabel = itemCount === 1 ? t.item : t.items;

  function addToCart(item: MenuItemRow) {
    const name = item.name?.trim() || '';
    if (!name) return;

    setCart((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);

      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
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
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  async function openStripeCheckout() {
    if (!restaurant || !cart.length) return;

    try {
      setCheckoutLoading(true);

      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          slug: restaurant.slug,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          lang,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || t.checkoutUnavailable);
      }

      window.location.href = data.url;
    } catch (error: any) {
      alert(error?.message || t.checkoutFailed);
    } finally {
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
            background: #f6f8fc;
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
            background: #f6f8fc;
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
          <img src={restaurant.hero_url} alt={restaurant.name || 'Store hero'} className="heroImage" />
        ) : (
          <div className="heroFallback" />
        )}

        <div className="heroOverlay" />

        <div className="heroContent">
          <div className="heroBrand">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name || 'Store logo'} className="heroLogo" />
            ) : (
              <div className="heroLogoFallback">
                {restaurant.name?.trim()?.charAt(0).toUpperCase() || 'M'}
              </div>
            )}

            <div className="heroTextWrap">
              <h1 className="heroName">{restaurant.name || ''}</h1>
              <p className="heroTagline">
                {lang === 'en' ? 'Order direct. No fees.' : 'Ordena directo. Sin tarifas.'}
              </p>
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
      </section>

      <section className="contentWrap">
        <header className="infoCard">
          <div className="infoRow">
            <div className="infoLabel">{t.address}</div>
            <div className="infoValue">{restaurant.address || '—'}</div>
          </div>

          <div className="infoDivider" />

          <div className="infoRow">
            <div className="infoLabel">{t.phone}</div>
            <div className="infoValue">{restaurant.phone || '—'}</div>
          </div>

          <div className="infoDivider" />

          <div className="infoRow">
            <div className="infoLabel">{t.hours}</div>
            <div className="hoursStack">
              {hourLines.map((line) => (
                <div key={line} className="infoValue">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </header>

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

                    <button type="button" className="addButton" onClick={() => addToCart(item)}>
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
        <button type="button" className="stickyCart" onClick={() => setCartOpen(true)}>
          <span>
            {t.viewCart} ({itemCount} {cartLabel})
          </span>
          <span>{money(subtotal)}</span>
        </button>
      ) : null}

      {cartOpen ? (
        <div className="cartOverlay" onClick={() => setCartOpen(false)}>
          <div className="cartSheet" onClick={(e) => e.stopPropagation()}>
            <div className="cartHeader">
              <h3>{t.yourOrder}</h3>
              <button type="button" className="closeButton" onClick={() => setCartOpen(false)}>
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
                        <div className="cartItemPrice">{money(item.price * item.quantity)}</div>
                      </div>

                      <div className="cartItemMeta">
                        {t.qty}: {item.quantity}
                      </div>

                      <div className="cartActions">
                        <button
                          type="button"
                          className="qtyButton"
                          onClick={() =>
                            addToCart({
                              id: item.id,
                              restaurant_id: restaurant.id,
                              name: item.name,
                              price: item.price,
                              description: item.description,
                              image_url: item.image_url,
                            })
                          }
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
                onClick={() => void openStripeCheckout()}
              >
                {checkoutLoading ? t.checkoutLoading : t.checkout}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #ffffff 0%, #f5f8fc 100%);
          color: #142132;
          padding-bottom: 110px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .heroSection {
          position: relative;
          width: 100%;
          height: 44vh;
          min-height: 300px;
          max-height: 540px;
          overflow: hidden;
        }

        .heroImage,
        .heroFallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: #eef2f8;
        }

        .heroOverlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.58) 100%);
        }

        .heroContent {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px 16px 18px;
        }

        .heroBrand {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .heroLogo,
        .heroLogoFallback {
          width: 76px;
          height: 76px;
          border-radius: 20px;
          object-fit: cover;
          flex-shrink: 0;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.25);
        }

        .heroTextWrap {
          min-width: 0;
        }

        .heroName {
          margin: 0;
          color: #fff;
          font-size: clamp(34px, 6vw, 64px);
          line-height: 0.95;
          letter-spacing: -0.05em;
          font-weight: 900;
          word-break: break-word;
          text-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
        }

        .heroTagline {
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.94);
          font-size: clamp(16px, 2vw, 22px);
          line-height: 1.2;
          font-weight: 700;
          text-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }

        .langToggle {
          display: inline-flex;
          gap: 6px;
          padding: 5px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .langButton {
          border: none;
          min-width: 62px;
          min-height: 42px;
          border-radius: 14px;
          background: transparent;
          color: rgba(255, 255, 255, 0.78);
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }

        .langActive {
          background: #fff;
          color: #111827;
        }

        .contentWrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 18px 16px 0;
        }

        .infoCard {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 28px;
          padding: 18px 20px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
        }

        .infoRow {
          display: grid;
          gap: 8px;
        }

        .infoLabel {
          color: #7a8595;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .infoValue {
          color: #142132;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 800;
          word-break: break-word;
        }

        .hoursStack {
          display: grid;
          gap: 4px;
        }

        .infoDivider {
          height: 1px;
          background: rgba(20, 33, 50, 0.08);
          margin: 16px 0;
        }

        .menuSection {
          margin-top: 18px;
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
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 900;
        }

        .sectionSubtitle {
          color: #738093;
          font-size: 16px;
          font-weight: 800;
        }

        .menuGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .menuCard {
          overflow: hidden;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(20, 33, 50, 0.08);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
        }

        .menuImageWrap {
          width: 100%;
          aspect-ratio: 16 / 11;
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

        .menuName {
          margin: 0;
          color: #142132;
          font-size: 24px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .menuDescription {
          margin: 10px 0 0;
          color: #556173;
          font-size: 16px;
          line-height: 1.55;
          font-weight: 700;
        }

        .menuPrice {
          color: #142132;
          font-size: 22px;
          line-height: 1;
          font-weight: 900;
          white-space: nowrap;
        }

        .addButton {
          margin-top: 16px;
          width: 100%;
          min-height: 58px;
          border: none;
          border-radius: 18px;
          background: #000;
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
          z-index: 40;
          min-height: 66px;
          border: none;
          border-radius: 22px;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          font-size: 18px;
          font-weight: 900;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.28);
          cursor: pointer;
        }

        .cartOverlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: rgba(15, 23, 42, 0.5);
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
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
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
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .menuGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .heroSection {
            height: 38vh;
            min-height: 280px;
          }

          .heroContent {
            padding: 18px 12px 16px;
            align-items: end;
            gap: 12px;
          }

          .heroBrand {
            align-items: end;
          }

          .heroLogo,
          .heroLogoFallback {
            width: 68px;
            height: 68px;
            border-radius: 18px;
          }

          .heroName {
            font-size: clamp(28px, 12vw, 44px);
          }

          .heroTagline {
            font-size: 15px;
          }

          .contentWrap {
            padding: 16px 12px 0;
          }

          .infoCard {
            padding: 18px;
            border-radius: 24px;
          }

          .langToggle {
            position: absolute;
            right: 12px;
            top: 12px;
          }

          .langButton {
            min-width: 54px;
            min-height: 38px;
            font-size: 14px;
          }

          .menuBody {
            padding: 16px;
          }

          .menuTop {
            grid-template-columns: 1fr;
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