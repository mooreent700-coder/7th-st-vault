'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';
type ThemeMode = 'light' | 'dark';

type RestaurantRow = {
  id: string;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hero_url: string | null;
  logo_url: string | null;
  storefront_theme: ThemeMode | null;
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
    direct: 'Order direct. No fees.',
    item: 'item',
    items: 'items',
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
    direct: 'Ordena directo. Sin tarifas.',
    item: 'producto',
    items: 'productos',
    details: 'Detalles de la tienda',
  },
} as const;

function safeNumber(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
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
          .select('id, name, slug, phone, address, hero_url, logo_url, storefront_theme')
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

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartLabel = itemCount === 1 ? t.item : t.items;
  const isDark = (restaurant?.storefront_theme || 'light') === 'dark';

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
    <main className={isDark ? 'page pageDark' : 'page pageLight'}>
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
          <div className="brandWrap">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name || 'Store logo'}
                className="heroLogo"
              />
            ) : (
              <div className="heroLogoFallback">
                {(restaurant.name?.trim() || 'M').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="heroText">
              <h1>{restaurant.name || ''}</h1>
              <p>{t.direct}</p>
            </div>
          </div>

          <div className="langToggle">
            <button
              type="button"
              className={lang === 'en' ? 'langButton activeLang' : 'langButton'}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={lang === 'es' ? 'langButton activeLang' : 'langButton'}
              onClick={() => setLang('es')}
            >
              ES
            </button>
          </div>
        </div>
      </section>

      <section className="contentWrap">
        <section className="infoPanel">
          <div className="panelTitle">{t.details}</div>

          <div className="infoGrid">
            <div className="infoCard">
              <div className="infoLabel">{t.address}</div>
              <div className="infoValue">{restaurant.address || '—'}</div>
            </div>

            <div className="infoCard">
              <div className="infoLabel">{t.phone}</div>
              <div className="infoValue">{restaurant.phone || '—'}</div>
            </div>
          </div>
        </section>

        <section className="menuSection">
          <div className="menuHeader">
            <h2>{t.menu}</h2>
            <div className="menuSub">{t.orderNow}</div>
          </div>

          <div className="menuList">
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
                    <div className="menuInfo">
                      <h3>{name}</h3>
                      <p>{item.description?.trim() || ''}</p>
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
            {t.orderNow} ({itemCount} {cartLabel})
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
          padding-bottom: 110px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .pageLight {
          background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
          color: #0f172a;
        }

        .pageDark {
          background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
          color: #fff;
        }

        .heroSection {
          position: relative;
          min-height: 430px;
          height: 58vh;
          max-height: 720px;
          overflow: hidden;
        }

        .heroImage,
        .heroFallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
        }

        .heroOverlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(2, 6, 23, 0.08) 0%, rgba(2, 6, 23, 0.65) 100%);
        }

        .heroContent {
          position: relative;
          z-index: 2;
          max-width: 1180px;
          height: 100%;
          margin: 0 auto;
          padding: 22px 16px 26px;
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .brandWrap {
          display: flex;
          align-items: end;
          gap: 16px;
        }

        .heroLogo,
        .heroLogoFallback {
          width: 86px;
          height: 86px;
          border-radius: 24px;
          object-fit: cover;
          background: rgba(255, 255, 255, 0.96);
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          font-weight: 900;
        }

        .heroText h1 {
          margin: 0;
          color: #fff;
          font-size: clamp(42px, 8vw, 88px);
          line-height: 0.92;
          letter-spacing: -0.06em;
          font-weight: 900;
        }

        .heroText p {
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.92);
          font-size: clamp(18px, 2vw, 24px);
          line-height: 1.2;
          font-weight: 800;
        }

        .langToggle {
          display: inline-flex;
          gap: 6px;
          padding: 6px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
        }

        .langButton {
          min-width: 62px;
          min-height: 46px;
          border: none;
          border-radius: 16px;
          background: transparent;
          color: rgba(255, 255, 255, 0.72);
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .activeLang {
          background: #fff;
          color: #0f172a;
        }

        .contentWrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 18px 16px 0;
        }

        .infoPanel {
          margin-top: -40px;
          position: relative;
          z-index: 3;
          border-radius: 28px;
          padding: 20px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
        }

        .pageLight .infoPanel,
        .pageLight .menuCard,
        .pageLight .cartSheet {
          background: rgba(255, 255, 255, 0.96);
        }

        .pageDark .infoPanel,
        .pageDark .menuCard,
        .pageDark .cartSheet {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .panelTitle {
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }

        .pageLight .panelTitle,
        .pageLight .infoLabel {
          color: #718096;
        }

        .pageDark .panelTitle,
        .pageDark .infoLabel {
          color: rgba(255, 255, 255, 0.65);
        }

        .infoGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .infoCard {
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .pageLight .infoCard {
          background: #f8fbff;
        }

        .pageDark .infoCard {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .infoLabel {
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .infoValue {
          margin-top: 8px;
          font-size: 22px;
          line-height: 1.3;
          font-weight: 900;
          word-break: break-word;
        }

        .menuSection {
          margin-top: 20px;
        }

        .menuHeader {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 12px;
          margin-bottom: 14px;
        }

        .menuHeader h2 {
          margin: 0;
          font-size: clamp(34px, 5vw, 54px);
          line-height: 1;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .menuSub {
          font-size: 18px;
          font-weight: 900;
        }

        .pageLight .menuSub {
          color: #738093;
        }

        .pageDark .menuSub {
          color: rgba(255, 255, 255, 0.72);
        }

        .menuList {
          display: grid;
          gap: 18px;
        }

        .menuCard {
          overflow: hidden;
          border-radius: 30px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 20px 44px rgba(15, 23, 42, 0.06);
        }

        .menuImageWrap {
          width: 100%;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #111827;
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
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
        }

        .menuInfo {
          min-width: 0;
        }

        .menuInfo h3 {
          margin: 0;
          font-size: 30px;
          line-height: 1.02;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .menuInfo p {
          margin: 10px 0 0;
          font-size: 16px;
          line-height: 1.55;
          font-weight: 700;
        }

        .pageLight .menuInfo p {
          color: #566274;
        }

        .pageDark .menuInfo p {
          color: rgba(255, 255, 255, 0.72);
        }

        .menuPrice {
          margin-top: 12px;
          font-size: 24px;
          font-weight: 900;
        }

        .addButton {
          min-width: 132px;
          min-height: 54px;
          border: none;
          border-radius: 18px;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          flex-shrink: 0;
        }

        .pageLight .addButton {
          background: #0f172a;
          color: #fff;
        }

        .pageDark .addButton {
          background: #fff;
          color: #0f172a;
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
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.24);
        }

        .pageLight .stickyCart {
          background: #0f172a;
          color: #fff;
        }

        .pageDark .stickyCart {
          background: #fff;
          color: #0f172a;
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
          border-radius: 30px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 22px 52px rgba(15, 23, 42, 0.24);
        }

        .cartHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 20px 12px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        }

        .cartHeader h3 {
          margin: 0;
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
          font-size: 18px;
          font-weight: 800;
          padding: 20px 0;
        }

        .cartItem {
          display: grid;
          grid-template-columns: 84px 1fr;
          gap: 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
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
          font-size: 22px;
          font-weight: 900;
          cursor: pointer;
        }

        .pageLight .qtyButton {
          background: #0f172a;
          color: #fff;
        }

        .pageDark .qtyButton {
          background: #fff;
          color: #0f172a;
        }

        .dangerQty {
          background: #e11d48 !important;
          color: #fff !important;
        }

        .cartFooter {
          padding: 16px 20px 20px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
        }

        .subtotalRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .checkoutButton {
          width: 100%;
          min-height: 60px;
          border: none;
          border-radius: 18px;
          font-size: 20px;
          font-weight: 900;
          cursor: pointer;
        }

        .pageLight .checkoutButton {
          background: #000;
          color: #fff;
        }

        .pageDark .checkoutButton {
          background: #fff;
          color: #0f172a;
        }

        .checkoutButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .menuBody {
            flex-direction: column;
            align-items: stretch;
          }

          .addButton {
            width: 100%;
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

          .heroLogo,
          .heroLogoFallback {
            width: 76px;
            height: 76px;
            border-radius: 22px;
            font-size: 30px;
          }

          .heroText h1 {
            font-size: clamp(34px, 12vw, 56px);
          }

          .heroText p {
            font-size: 16px;
          }

          .contentWrap {
            padding: 14px 12px 0;
          }

          .infoPanel {
            margin-top: -34px;
            padding: 18px;
            border-radius: 24px;
          }

          .infoGrid {
            grid-template-columns: 1fr;
          }

          .infoValue {
            font-size: 18px;
          }

          .menuHeader h2 {
            font-size: clamp(30px, 9vw, 44px);
          }

          .menuSub {
            font-size: 16px;
          }

          .menuInfo h3 {
            font-size: 24px;
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