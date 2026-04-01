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
    add: 'Add',
    remove: 'Remove',
    viewCart: 'View Cart',
    yourOrder: 'Your Order',
    emptyCart: 'Your cart is empty.',
    subtotal: 'Subtotal',
    textToOrder: 'Text to Order',
    close: 'Close',
    orderNow: 'Order now',
    menu: 'Menu',
    address: 'Address',
    phone: 'Phone',
    hours: 'Hours',
    qty: 'Qty',
    item: 'item',
    items: 'items',
    orderMessageIntro: 'Hi, I want to place an order:',
    orderMessageName: 'Name:',
    orderMessagePickup: 'Pickup or delivery:',
    orderMessageNotes: 'Notes:',
    total: 'Total',
    noDescription: 'Fresh made with care.',
    storeClosed: 'Closed',
    noHours: 'Hours not available',
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
    textToOrder: 'Pedir por texto',
    close: 'Cerrar',
    orderNow: 'Ordena ahora',
    menu: 'Menú',
    address: 'Dirección',
    phone: 'Teléfono',
    hours: 'Horario',
    qty: 'Cant.',
    item: 'producto',
    items: 'productos',
    orderMessageIntro: 'Hola, quiero hacer un pedido:',
    orderMessageName: 'Nombre:',
    orderMessagePickup: 'Recoger o entrega:',
    orderMessageNotes: 'Notas:',
    total: 'Total',
    noDescription: 'Hecho fresco con cuidado.',
    storeClosed: 'Cerrado',
    noHours: 'Horario no disponible',
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

function formatHours(hours: HoursState | null, lang: Lang, noHours: string, closed: string) {
  if (!hours) return noHours;

  const rows = DAY_ORDER.filter((day) => hours[day].enabled).map((day) => {
    const row = hours[day];
    return `${DAY_LABELS[lang][day]} ${toDisplayTime(row.open)} - ${toDisplayTime(row.close)}`;
  });

  return rows.length ? rows.join(' • ') : closed;
}

function normalizePhone(phone: string | null) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits || '';
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

  const hoursText = useMemo(
    () => formatHours(parseHours(restaurant?.hours || null), lang, t.noHours, t.storeClosed),
    [restaurant?.hours, lang, t.noHours, t.storeClosed]
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

  function openSmsCheckout() {
    if (!restaurant) return;
    if (!cart.length) return;

    const phone = normalizePhone(restaurant.phone);
    if (!phone) {
      alert(lang === 'en' ? 'Phone number not set for this store yet.' : 'Todavía no hay teléfono configurado para esta tienda.');
      return;
    }

    const lines: string[] = [];
    lines.push(t.orderMessageIntro);
    lines.push('');

    cart.forEach((item) => {
      lines.push(`${item.quantity}x ${item.name} - ${money(item.price * item.quantity)}`);
      if (item.description) {
        lines.push(item.description);
      }
    });

    lines.push('');
    lines.push(`${t.total}: ${money(subtotal)}`);
    lines.push('');
    lines.push(`${t.orderMessageName}`);
    lines.push(`${t.orderMessagePickup}`);
    lines.push(`${t.orderMessageNotes}`);

    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `sms:${phone}?body=${body}`;
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
      </section>

      <section className="contentWrap">
        <header className="headerCard">
          <div className="brandRow">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name || 'Store logo'} className="logo" />
            ) : (
              <div className="logoFallback">
                {restaurant.name?.trim()?.charAt(0).toUpperCase() || 'M'}
              </div>
            )}

            <div className="brandInfo">
              <h1 className="storeName">{restaurant.name || ''}</h1>
              <div className="metaStack">
                {restaurant.address ? (
                  <div className="metaRow">
                    <span className="metaLabel">{t.address}</span>
                    <span className="metaValue">{restaurant.address}</span>
                  </div>
                ) : null}

                {restaurant.phone ? (
                  <div className="metaRow">
                    <span className="metaLabel">{t.phone}</span>
                    <span className="metaValue">{restaurant.phone}</span>
                  </div>
                ) : null}

                <div className="metaRow">
                  <span className="metaLabel">{t.hours}</span>
                  <span className="metaValue">{hoursText}</span>
                </div>
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
          <span>{t.viewCart} ({itemCount} {cartLabel})</span>
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
                        <button type="button" className="qtyButton" onClick={() => addToCart(item as unknown as MenuItemRow)}>
                          +
                        </button>
                        <button type="button" className="qtyButton dangerQty" onClick={() => removeFromCart(item.id)}>
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
                disabled={!cart.length}
                onClick={openSmsCheckout}
              >
                {t.textToOrder}
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
          width: 100%;
          height: 45vh;
          min-height: 280px;
          max-height: 520px;
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
        .contentWrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 18px 16px 0;
        }
        .headerCard {
          margin-top: 16px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(20, 33, 50, 0.08);
          border-radius: 28px;
          padding: 20px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
        }
        .brandRow {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 16px;
          align-items: start;
        }
        .logo,
        .logoFallback {
          width: 86px;
          height: 86px;
          border-radius: 22px;
          object-fit: cover;
          flex-shrink: 0;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          font-weight: 900;
        }
        .storeName {
          margin: 0;
          color: #142132;
          font-size: clamp(32px, 5vw, 54px);
          line-height: 0.96;
          letter-spacing: -0.05em;
          font-weight: 900;
          word-break: break-word;
        }
        .metaStack {
          margin-top: 12px;
          display: grid;
          gap: 8px;
        }
        .metaRow {
          display: grid;
          gap: 4px;
        }
        .metaLabel {
          color: #738093;
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .metaValue {
          color: #1e293b;
          font-size: 16px;
          line-height: 1.45;
          font-weight: 700;
        }
        .langToggle {
          display: inline-flex;
          align-self: start;
          gap: 6px;
          padding: 5px;
          border-radius: 18px;
          border: 1px solid rgba(20, 33, 50, 0.1);
          background: #fff;
        }
        .langButton {
          border: none;
          min-width: 64px;
          min-height: 46px;
          border-radius: 14px;
          background: transparent;
          color: #6b7686;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }
        .langActive {
          background: #0f172a;
          color: #fff;
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
          background: rgba(255, 255, 255, 0.94);
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
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 900px) {
          .menuGrid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .heroSection {
            height: 34vh;
            min-height: 240px;
          }
          .contentWrap {
            padding: 14px 12px 0;
          }
          .headerCard {
            padding: 18px;
            border-radius: 24px;
          }
          .brandRow {
            grid-template-columns: 1fr;
          }
          .langToggle {
            width: fit-content;
          }
          .logo,
          .logoFallback {
            width: 74px;
            height: 74px;
            border-radius: 18px;
          }
          .storeName {
            font-size: clamp(30px, 10vw, 44px);
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
