'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';
type ThemeMode = 'light' | 'dark';
type Availability = 'available' | 'sold_out';

type RestaurantRow = {
  id: string;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hero_image: string | null;
  logo_image: string | null;
  storefront_theme: ThemeMode | null;
  storefront_language: Lang | null;
};

type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string | null;
  sort_order: number | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string | null;
  price: number | string | null;
  base_price: number | string | null;
  description: string | null;
  image_url: string | null;
  availability: string | null;
  is_available: boolean | null;
  sort_order: number | null;
};

type OptionGroupRow = {
  id: string;
  item_id: string | null;
  name: string | null;
  is_required: boolean | null;
  is_multiple: boolean | null;
  selection_mode: string | null;
  sort_order: number | null;
};

type OptionChoiceRow = {
  id: string;
  option_group_id: string | null;
  name: string | null;
  price: number | null;
  price_delta: number | null;
  sort_order: number | null;
};

type Choice = {
  id: string;
  name: string;
  price: number;
};

type OptionGroup = {
  id: string;
  name: string;
  required: boolean;
  selection: 'single' | 'multiple';
  choices: Choice[];
};

type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  availability: Availability;
  sort_order: number;
  option_groups: OptionGroup[];
};

type Category = {
  id: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
};

type PopupSelections = Record<string, string[]>;

type CartOptionSelection = {
  group_id: string;
  group_name: string;
  required: boolean;
  choices: Array<{
    id: string;
    name: string;
    price: number;
  }>;
};

type CartItem = {
  line_id: string;
  item_id: string;
  name: string;
  description: string;
  image_url: string | null;
  quantity: number;
  base_price: number;
  unit_price: number;
  line_total: number;
  selections: CartOptionSelection[];
};

const COPY = {
  en: {
    loading: 'Loading store...',
    notFound: 'Store not found.',
    menu: 'Menu',
    orderNow: 'Order now',
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
    required: 'Required',
    optional: 'Optional',
    soldOut: 'Sold Out',
    addToOrder: 'Add to Order',
    added: 'Added to your order',
    categories: 'Categories',
    quantity: 'Quantity',
    chooseOne: 'Choose one',
    chooseAny: 'Choose any',
    missingRequired: 'Please select all required options.',
    noDescription: 'Customize this item before adding it to your order.',
    viewCart: 'View Cart',
  },
  es: {
    loading: 'Cargando tienda...',
    notFound: 'No se encontró la tienda.',
    menu: 'Menú',
    orderNow: 'Ordena ahora',
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
    required: 'Requerido',
    optional: 'Opcional',
    soldOut: 'Agotado',
    addToOrder: 'Agregar al pedido',
    added: 'Agregado a tu pedido',
    categories: 'Categorías',
    quantity: 'Cantidad',
    chooseOne: 'Elige una',
    chooseAny: 'Elige las que quieras',
    missingRequired: 'Selecciona todas las opciones requeridas.',
    noDescription: 'Personaliza este producto antes de agregarlo a tu pedido.',
    viewCart: 'Ver carrito',
  },
} as const;

function safeNumber(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function normalizeAvailability(item: MenuItemRow): Availability {
  if (item.availability === 'sold_out' || item.is_available === false) return 'sold_out';
  return 'available';
}

function normalizeSelectionMode(group: OptionGroupRow): 'single' | 'multiple' {
  if (group.selection_mode === 'multiple' || group.is_multiple) return 'multiple';
  return 'single';
}

function buildLineId(itemId: string, selections: CartOptionSelection[]) {
  const signature = selections
    .map((group) => `${group.group_id}:${group.choices.map((choice) => choice.id).sort().join(',')}`)
    .sort()
    .join('|');

  return `${itemId}__${signature || 'plain'}`;
}

export default function StorefrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [lang, setLang] = useState<Lang>('en');
  const t = COPY[lang];

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [popupSelections, setPopupSelections] = useState<PopupSelections>({});
  const [popupQuantity, setPopupQuantity] = useState(1);
  const [popupError, setPopupError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadStore() {
      if (!slug) return;

      try {
        setLoading(true);

        const restaurantRes = await supabase
          .from('restaurants')
          .select('id, name, slug, phone, address, hero_image, logo_image, storefront_theme, storefront_language')
          .eq('slug', slug)
          .maybeSingle();

        if (restaurantRes.error) throw restaurantRes.error;

        if (!restaurantRes.data) {
          if (mounted) {
            setRestaurant(null);
            setCategories([]);
          }
          return;
        }

        const restaurantData = restaurantRes.data as RestaurantRow;

        const [categoryRes, itemRes] = await Promise.all([
          supabase
            .from('menu_categories')
            .select('id, restaurant_id, name, sort_order')
            .eq('restaurant_id', restaurantData.id)
            .order('sort_order', { ascending: true }),
          supabase
            .from('menu_items')
            .select(
              'id, restaurant_id, category_id, name, price, base_price, description, image_url, availability, is_available, sort_order'
            )
            .eq('restaurant_id', restaurantData.id)
            .order('sort_order', { ascending: true }),
        ]);

        if (categoryRes.error) throw categoryRes.error;
        if (itemRes.error) throw itemRes.error;

        const itemRows = (itemRes.data || []) as MenuItemRow[];
        const itemIds = itemRows.map((item) => item.id);

        let optionGroups: OptionGroupRow[] = [];
        let optionChoices: OptionChoiceRow[] = [];

        if (itemIds.length) {
          const groupRes = await supabase
            .from('menu_option_groups')
            .select('id, item_id, name, is_required, is_multiple, selection_mode, sort_order')
            .in('item_id', itemIds)
            .order('sort_order', { ascending: true });

          if (groupRes.error) throw groupRes.error;
          optionGroups = (groupRes.data || []) as OptionGroupRow[];

          const groupIds = optionGroups.map((group) => group.id);

          if (groupIds.length) {
            const choiceRes = await supabase
              .from('menu_option_choices')
              .select('id, option_group_id, name, price, price_delta, sort_order')
              .in('option_group_id', groupIds)
              .order('sort_order', { ascending: true });

            if (choiceRes.error) throw choiceRes.error;
            optionChoices = (choiceRes.data || []) as OptionChoiceRow[];
          }
        }

        const builtCategories = ((categoryRes.data || []) as CategoryRow[]).map((category, index) => {
          const categoryItems = itemRows
            .filter((item) => item.category_id === category.id)
            .map((item): MenuItem => {
              const groups = optionGroups
                .filter((group) => group.item_id === item.id)
                .map((group): OptionGroup => ({
                  id: group.id,
                  name: group.name || 'Options',
                  required: !!group.is_required,
                  selection: normalizeSelectionMode(group),
                  choices: optionChoices
                    .filter((choice) => choice.option_group_id === group.id)
                    .map((choice): Choice => ({
                      id: choice.id,
                      name: choice.name || 'Choice',
                      price: safeNumber(choice.price_delta ?? choice.price ?? 0),
                    })),
                }));

              return {
                id: item.id,
                restaurant_id: item.restaurant_id,
                category_id: item.category_id,
                name: item.name?.trim() || 'Untitled Item',
                price: safeNumber(item.base_price ?? item.price),
                description: item.description?.trim() || '',
                image_url: item.image_url || null,
                availability: normalizeAvailability(item),
                sort_order: item.sort_order ?? 0,
                option_groups: groups,
              };
            });

          return {
            id: category.id,
            name: category.name?.trim() || `Category ${index + 1}`,
            sort_order: category.sort_order ?? index,
            items: categoryItems,
          };
        });

        const firstCategoryId = builtCategories.find((category) => category.items.length)?.id || builtCategories[0]?.id || '';

        if (mounted) {
          setRestaurant(restaurantData);
          setCategories(builtCategories);
          setSelectedCategoryId(firstCategoryId);
          setLang(restaurantData.storefront_language === 'es' ? 'es' : 'en');
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setRestaurant(null);
          setCategories([]);
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

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.line_total, 0), [cart]);
  const cartLabel = itemCount === 1 ? t.item : t.items;
  const isDark = (restaurant?.storefront_theme || 'light') === 'dark';

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ||
    categories.find((category) => category.items.length) ||
    categories[0] ||
    null;

  const activeItem =
    selectedCategory?.items.find((item) => item.id === activeItemId) ||
    categories.flatMap((category) => category.items).find((item) => item.id === activeItemId) ||
    null;

  const popupSelectionsSummary = useMemo(() => {
    if (!activeItem) return [];
    return activeItem.option_groups.map((group) => {
      const selectedIds = popupSelections[group.id] || [];
      const selectedChoices = group.choices.filter((choice) => selectedIds.includes(choice.id));
      return { ...group, selectedChoices };
    });
  }, [activeItem, popupSelections]);

  const popupUnitPrice = useMemo(() => {
    if (!activeItem) return 0;
    const extras = popupSelectionsSummary.reduce(
      (sum, group) => sum + group.selectedChoices.reduce((groupSum, choice) => groupSum + choice.price, 0),
      0
    );
    return activeItem.price + extras;
  }, [activeItem, popupSelectionsSummary]);

  const popupTotal = popupUnitPrice * popupQuantity;

  function openItemPopup(item: MenuItem) {
    if (item.availability === 'sold_out') return;
    setActiveItemId(item.id);
    setPopupSelections({});
    setPopupQuantity(1);
    setPopupError('');
  }

  function closeItemPopup() {
    setActiveItemId(null);
    setPopupSelections({});
    setPopupQuantity(1);
    setPopupError('');
  }

  function toggleChoice(group: OptionGroup, choice: Choice) {
    setPopupSelections((current) => {
      const selected = current[group.id] || [];

      if (group.selection === 'single') {
        return { ...current, [group.id]: [choice.id] };
      }

      const exists = selected.includes(choice.id);
      return {
        ...current,
        [group.id]: exists ? selected.filter((id) => id !== choice.id) : [...selected, choice.id],
      };
    });
    setPopupError('');
  }

  function addToCartFromPopup() {
    if (!activeItem) return;

    const missingRequired = activeItem.option_groups.some(
      (group) => group.required && !(popupSelections[group.id] || []).length
    );

    if (missingRequired) {
      setPopupError(t.missingRequired);
      return;
    }

    const selections: CartOptionSelection[] = activeItem.option_groups
      .map((group) => {
        const selectedIds = popupSelections[group.id] || [];
        const selectedChoices = group.choices.filter((choice) => selectedIds.includes(choice.id));
        return {
          group_id: group.id,
          group_name: group.name,
          required: group.required,
          choices: selectedChoices.map((choice) => ({
            id: choice.id,
            name: choice.name,
            price: choice.price,
          })),
        };
      })
      .filter((group) => group.choices.length > 0);

    const lineId = buildLineId(activeItem.id, selections);
    const unitPrice = popupUnitPrice;

    setCart((prev) => {
      const existing = prev.find((entry) => entry.line_id === lineId);

      if (existing) {
        return prev.map((entry) =>
          entry.line_id === lineId
            ? {
                ...entry,
                quantity: entry.quantity + popupQuantity,
                line_total: unitPrice * (entry.quantity + popupQuantity),
              }
            : entry
        );
      }

      return [
        ...prev,
        {
          line_id: lineId,
          item_id: activeItem.id,
          name: activeItem.name,
          description: activeItem.description,
          image_url: activeItem.image_url,
          quantity: popupQuantity,
          base_price: activeItem.price,
          unit_price: unitPrice,
          line_total: unitPrice * popupQuantity,
          selections,
        },
      ];
    });

    setNotice(t.added);
    closeItemPopup();
  }

  function increaseCartItem(lineId: string) {
    setCart((prev) =>
      prev.map((item) =>
        item.line_id === lineId
          ? { ...item, quantity: item.quantity + 1, line_total: item.unit_price * (item.quantity + 1) }
          : item
      )
    );
  }

  function decreaseCartItem(lineId: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.line_id === lineId
            ? { ...item, quantity: item.quantity - 1, line_total: item.unit_price * (item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function openCheckout() {
    try {
      if (!slug || !cart.length) return;

      setCheckoutLoading(true);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          language: lang,
          cart: cart.map((item) => ({
            id: item.item_id,
            line_id: item.line_id,
            name: item.name,
            quantity: item.quantity,
            price: item.unit_price,
            base_price: item.base_price,
            line_total: item.line_total,
            selections: item.selections,
          })),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) throw new Error(data?.error || 'Checkout failed');
      if (!data?.url) throw new Error('Checkout link was not created.');

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
        {restaurant.hero_image ? (
          <img src={restaurant.hero_image} alt={restaurant.name || 'Store hero'} className="heroImage" />
        ) : (
          <div className="heroFallback" />
        )}

        <div className="heroOverlay" />

        <div className="heroContent">
          <div className="brandWrap">
            {restaurant.logo_image ? (
              <img src={restaurant.logo_image} alt={restaurant.name || 'Store logo'} className="heroLogo" />
            ) : (
              <div className="heroLogoFallback">{(restaurant.name?.trim() || 'M').charAt(0).toUpperCase()}</div>
            )}

            <div className="heroText">
              <h1>{restaurant.name || ''}</h1>
              <p>{t.direct}</p>
            </div>
          </div>

          <div className="heroActions">
            <div className="langToggle">
              <button type="button" className={lang === 'en' ? 'langButton activeLang' : 'langButton'} onClick={() => setLang('en')}>
                EN
              </button>
              <button type="button" className={lang === 'es' ? 'langButton activeLang' : 'langButton'} onClick={() => setLang('es')}>
                ES
              </button>
            </div>

            {itemCount > 0 ? (
              <button type="button" className="heroCartButton" onClick={() => setCartOpen(true)}>
                {t.viewCart} • {itemCount}
              </button>
            ) : null}
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
            <div>
              <h2>{t.menu}</h2>
              <div className="menuSub">{t.orderNow}</div>
            </div>
          </div>

          {categories.length ? (
            <>
              <div className="categorySectionTitle">{t.categories}</div>

              <div className="categoryTabs">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={category.id === selectedCategory?.id ? 'categoryTab categoryTabActive' : 'categoryTab'}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <div className="menuGrid">
            {(selectedCategory?.items || []).map((item) => (
              <button
                type="button"
                key={item.id}
                className="menuGridCard"
                onClick={() => openItemPopup(item)}
                disabled={item.availability === 'sold_out'}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="menuGridImage" />
                ) : (
                  <div className="menuGridFallback" />
                )}

                {item.availability === 'sold_out' ? <div className="soldOutPill">{t.soldOut}</div> : null}
              </button>
            ))}
          </div>
        </section>
      </section>

      {itemCount > 0 ? (
        <button type="button" className="stickyCart" onClick={() => setCartOpen(true)}>
          <span>
            {t.orderNow} ({itemCount} {cartLabel})
          </span>
          <span>{money(subtotal)}</span>
        </button>
      ) : null}

      {activeItem ? (
        <div className="itemOverlay" onClick={closeItemPopup}>
          <div className="itemSheet" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="popupClose" onClick={closeItemPopup}>
              {t.close}
            </button>

            <div className="popupImageWrap">
              {activeItem.image_url ? (
                <img src={activeItem.image_url} alt={activeItem.name} className="popupImage" />
              ) : (
                <div className="popupImage popupImageFallback" />
              )}
            </div>

            <div className="popupBody">
              <div className="popupNameRow">
                <h3>{activeItem.name}</h3>
                <div className="popupPrice">{money(activeItem.price)}</div>
              </div>

              <p className="popupDescription">{activeItem.description || t.noDescription}</p>

              {popupSelectionsSummary.length ? (
                <div className="popupGroups">
                  {popupSelectionsSummary.map((group) => (
                    <section key={group.id} className="popupGroup">
                      <div className="popupGroupHeader">
                        <div className="popupGroupTitle">{group.name}</div>
                        <div className="popupGroupMeta">
                          {group.required ? `${t.required} • ${t.chooseOne}` : `${t.optional} • ${t.chooseAny}`}
                        </div>
                      </div>

                      <div className="choiceButtons">
                        {group.choices.map((choice) => {
                          const selected = group.selectedChoices.some((entry) => entry.id === choice.id);

                          return (
                            <button
                              key={choice.id}
                              type="button"
                              className={selected ? 'choiceButton choiceButtonActive' : 'choiceButton'}
                              onClick={() => toggleChoice(group, choice)}
                            >
                              <span>{choice.name}</span>
                              <span>{choice.price > 0 ? `+${money(choice.price)}` : money(0)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}

              <div className="popupQuantityRow">
                <div className="popupQuantityLabel">{t.quantity}</div>

                <div className="popupQtyControls">
                  <button type="button" className="popupQtyButton" onClick={() => setPopupQuantity((current) => Math.max(1, current - 1))}>
                    -
                  </button>
                  <div className="popupQtyValue">{popupQuantity}</div>
                  <button type="button" className="popupQtyButton" onClick={() => setPopupQuantity((current) => current + 1)}>
                    +
                  </button>
                </div>
              </div>

              {popupError ? <div className="popupError">{popupError}</div> : null}
            </div>

            <div className="popupFooter">
              <button type="button" className="popupAddButton" onClick={addToCartFromPopup}>
                {t.addToOrder} • {money(popupTotal)}
              </button>
            </div>
          </div>
        </div>
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
                  <div key={item.line_id} className="cartItem">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="cartThumb" /> : <div className="cartThumb cartThumbFallback" />}

                    <div className="cartItemInfo">
                      <div className="cartItemTop">
                        <div className="cartItemName">{item.name}</div>
                        <div className="cartItemPrice">{money(item.line_total)}</div>
                      </div>

                      {item.selections.length ? (
                        <div className="cartSelections">
                          {item.selections.map((group) => (
                            <div key={group.group_id} className="cartSelectionGroup">
                              <span className="cartSelectionName">{group.group_name}:</span>{' '}
                              <span className="cartSelectionValue">{group.choices.map((choice) => choice.name).join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="cartItemMeta">{t.quantity}: {item.quantity}</div>

                      <div className="cartActions">
                        <button type="button" className="qtyButton" onClick={() => increaseCartItem(item.line_id)}>
                          +
                        </button>
                        <button type="button" className="qtyButton dangerQty" onClick={() => decreaseCartItem(item.line_id)}>
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

              <button type="button" className="checkoutButton" disabled={!cart.length || checkoutLoading} onClick={openCheckout}>
                {checkoutLoading ? t.openingCheckout : t.payNow}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? <div className="noticeToast">{notice}</div> : null}

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
        .heroActions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
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
        .heroCartButton {
          min-height: 58px;
          padding: 0 18px;
          border: none;
          border-radius: 18px;
          background: #fff;
          color: #0f172a;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.22);
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
        .pageLight .cartSheet,
        .pageLight .itemSheet {
          background: rgba(255, 255, 255, 0.96);
        }
        .pageDark .infoPanel,
        .pageDark .cartSheet,
        .pageDark .itemSheet {
          background: rgba(17, 24, 39, 0.96);
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
          margin-top: 6px;
          font-size: 18px;
          font-weight: 900;
        }
        .pageLight .menuSub {
          color: #738093;
        }
        .pageDark .menuSub {
          color: rgba(255, 255, 255, 0.72);
        }
        .categorySectionTitle {
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }
        .pageLight .categorySectionTitle {
          color: #718096;
        }
        .pageDark .categorySectionTitle {
          color: rgba(255, 255, 255, 0.65);
        }
        .categoryTabs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 10px;
          margin-bottom: 16px;
        }
        .categoryTab {
          flex: 0 0 auto;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: transparent;
          color: inherit;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }
        .pageDark .categoryTab {
          border-color: rgba(255, 255, 255, 0.14);
        }
        .categoryTabActive {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }
        .pageDark .categoryTabActive {
          background: #fff;
          color: #0f172a;
          border-color: #fff;
        }
        .menuGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .menuGridCard {
          position: relative;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
        }
        .menuGridCard:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        .menuGridImage,
        .menuGridFallback {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 24px;
          object-fit: cover;
          display: block;
          background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
        }
        .soldOutPill {
          position: absolute;
          top: 12px;
          right: 12px;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(225, 29, 72, 0.92);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
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
        .itemOverlay,
        .cartOverlay {
          position: fixed;
          inset: 0;
          z-index: 70;
          background: rgba(15, 23, 42, 0.58);
          display: flex;
          align-items: end;
          justify-content: center;
          padding: 12px;
        }
        .itemSheet,
        .cartSheet {
          width: 100%;
          max-width: 760px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          border-radius: 30px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 22px 52px rgba(15, 23, 42, 0.24);
        }
        .popupClose {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 4;
          min-height: 44px;
          padding: 0 14px;
          border: none;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.8);
          color: #fff;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }
        .popupImageWrap {
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background: #0f172a;
          position: relative;
        }
        .popupImage,
        .popupImageFallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .popupBody {
          padding: 18px 18px 12px;
          overflow: auto;
        }
        .popupNameRow {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 12px;
        }
        .popupNameRow h3 {
          margin: 0;
          font-size: 34px;
          line-height: 0.96;
          letter-spacing: -0.05em;
          font-weight: 900;
        }
        .popupPrice {
          font-size: 24px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .popupDescription {
          margin: 12px 0 0;
          font-size: 15px;
          line-height: 1.6;
          font-weight: 700;
        }
        .pageLight .popupDescription {
          color: #566274;
        }
        .pageDark .popupDescription {
          color: rgba(255, 255, 255, 0.72);
        }
        .popupGroups {
          margin-top: 18px;
          display: grid;
          gap: 14px;
        }
        .popupGroup {
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 22px;
          padding: 14px;
        }
        .pageDark .popupGroup {
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
        }
        .popupGroupHeader {
          margin-bottom: 10px;
        }
        .popupGroupTitle {
          font-size: 18px;
          font-weight: 900;
        }
        .popupGroupMeta {
          margin-top: 5px;
          font-size: 13px;
          font-weight: 800;
        }
        .pageLight .popupGroupMeta {
          color: #64748b;
        }
        .pageDark .popupGroupMeta {
          color: rgba(255, 255, 255, 0.65);
        }
        .choiceButtons {
          display: grid;
          gap: 10px;
        }
        .choiceButton {
          min-height: 54px;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: transparent;
          color: inherit;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 16px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }
        .pageDark .choiceButton {
          border-color: rgba(255, 255, 255, 0.12);
        }
        .choiceButtonActive {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }
        .pageDark .choiceButtonActive {
          background: #fff;
          color: #0f172a;
          border-color: #fff;
        }
        .popupQuantityRow {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .popupQuantityLabel {
          font-size: 18px;
          font-weight: 900;
        }
        .popupQtyControls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .popupQtyButton {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 14px;
          font-size: 22px;
          font-weight: 900;
          cursor: pointer;
        }
        .pageLight .popupQtyButton {
          background: #0f172a;
          color: #fff;
        }
        .pageDark .popupQtyButton {
          background: #fff;
          color: #0f172a;
        }
        .popupQtyValue {
          min-width: 40px;
          text-align: center;
          font-size: 18px;
          font-weight: 900;
        }
        .popupError {
          margin-top: 14px;
          border-radius: 16px;
          padding: 12px 14px;
          background: rgba(225, 29, 72, 0.12);
          color: #be123c;
          font-size: 14px;
          font-weight: 900;
        }
        .popupFooter {
          padding: 14px 18px 18px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          background: inherit;
        }
        .popupAddButton {
          width: 100%;
          min-height: 60px;
          border: none;
          border-radius: 18px;
          font-size: 20px;
          font-weight: 900;
          cursor: pointer;
        }
        .pageLight .popupAddButton {
          background: #0f172a;
          color: #fff;
        }
        .pageDark .popupAddButton {
          background: #fff;
          color: #0f172a;
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
        .pageDark .cartItem {
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
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
        .cartSelections {
          margin-top: 8px;
          display: grid;
          gap: 4px;
        }
        .cartSelectionGroup {
          font-size: 13px;
          line-height: 1.4;
          font-weight: 700;
        }
        .pageLight .cartSelectionGroup {
          color: #566274;
        }
        .pageDark .cartSelectionGroup {
          color: rgba(255, 255, 255, 0.7);
        }
        .cartSelectionName {
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
        .noticeToast {
          position: fixed;
          left: 50%;
          bottom: 94px;
          transform: translateX(-50%);
          z-index: 80;
          min-height: 48px;
          padding: 0 16px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          color: #fff;
          font-size: 15px;
          font-weight: 900;
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.24);
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
          .menuGrid {
            gap: 12px;
          }
          .stickyCart {
            font-size: 16px;
            min-height: 62px;
          }
          .itemSheet,
          .cartSheet {
            border-radius: 24px;
          }
          .popupNameRow h3 {
            font-size: 28px;
          }
          .cartHeader h3 {
            font-size: 24px;
          }
        }
      `}</style>
    </main>
  );
}
