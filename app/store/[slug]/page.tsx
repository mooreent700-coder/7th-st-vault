'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';

type RestaurantRow = {
  id: string;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hero_image: string | null;
  logo_image: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  description?: string | null;
  storefront_theme?: string | null;
  storefront_language?: string | null;
  pickup_enabled?: boolean | null;
  delivery_enabled?: boolean | null;
  delivery_fee?: number | null;
  delivery_radius?: number | null;
  delivery_minimum?: number | null;
  pickup_message?: string | null;
  published?: boolean | null;
  hours?: string | null;
};

type CategoryRow = {
  id: string;
  restaurant_id: string | null;
  name: string | null;
  sort_order: number | null;
};

type ItemRow = {
  id: string;
  restaurant_id: string | null;
  category_id: string | null;
  name: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  base_price: number | null;
  availability: string | null;
  is_available: boolean | null;
  sort_order: number | null;
};

type OptionGroupRow = {
  id: string;
  item_id: string | null;
  name: string | null;
  is_required: boolean | null;
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

type MenuChoice = {
  id: string;
  name: string;
  priceDelta: number;
};

type MenuGroup = {
  id: string;
  name: string;
  required: boolean;
  selectionMode: 'single' | 'multiple';
  choices: MenuChoice[];
};

type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  availability: Availability;
  groups: MenuGroup[];
};

type MenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

type CartSelection = {
  groupId: string;
  groupName: string;
  choiceIds: string[];
  choiceLabels: string[];
  priceDelta: number;
};

type CartLine = {
  id: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  basePrice: number;
  quantity: number;
  selections: CartSelection[];
  total: number;
};

type CopyBlock = {
  loading: string;
  storeNotFound: string;
  orderDirect: string;
  noFees: string;
  storeDetails: string;
  address: string;
  phone: string;
  menu: string;
  orderNow: string;
  categories: string;
  noMenuItems: string;
  soldOut: string;
  chooseOptions: string;
  quantity: string;
  addToCart: string;
  added: string;
  required: string;
  optional: string;
  yourCart: string;
  emptyCart: string;
  subtotal: string;
  close: string;
  pickup: string;
  delivery: string;
};

const COPY: Record<LanguageMode, CopyBlock> = {
  en: {
    loading: 'Loading store...',
    storeNotFound: 'Store not found.',
    orderDirect: 'Order direct.',
    noFees: 'No fees.',
    storeDetails: 'Store Details',
    address: 'Address',
    phone: 'Phone',
    menu: 'Menu',
    orderNow: 'Order now',
    categories: 'Categories',
    noMenuItems: 'No menu items yet.',
    soldOut: 'Sold Out',
    chooseOptions: 'Choose your options',
    quantity: 'Quantity',
    addToCart: 'Add to Cart',
    added: 'Added',
    required: 'Required',
    optional: 'Optional',
    yourCart: 'Your Cart',
    emptyCart: 'Your cart is empty.',
    subtotal: 'Subtotal',
    close: 'Close',
    pickup: 'Pickup',
    delivery: 'Delivery',
  },
  es: {
    loading: 'Cargando tienda...',
    storeNotFound: 'Tienda no encontrada.',
    orderDirect: 'Ordena directo.',
    noFees: 'Sin fees.',
    storeDetails: 'Detalles de la Tienda',
    address: 'Dirección',
    phone: 'Teléfono',
    menu: 'Menú',
    orderNow: 'Ordena ahora',
    categories: 'Categorías',
    noMenuItems: 'Todavía no hay productos.',
    soldOut: 'Agotado',
    chooseOptions: 'Elige tus opciones',
    quantity: 'Cantidad',
    addToCart: 'Agregar al Carrito',
    added: 'Agregado',
    required: 'Requerido',
    optional: 'Opcional',
    yourCart: 'Tu Carrito',
    emptyCart: 'Tu carrito está vacío.',
    subtotal: 'Subtotal',
    close: 'Cerrar',
    pickup: 'Recoger',
    delivery: 'Entrega',
  },
};

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseTheme(value: string | null | undefined): ThemeMode {
  return value?.toLowerCase() === 'dark' ? 'dark' : 'light';
}

function parseLanguage(value: string | null | undefined): LanguageMode {
  return value?.toLowerCase() === 'es' ? 'es' : 'en';
}

function clampQuantity(value: number) {
  if (value < 1) return 1;
  if (value > 99) return 99;
  return value;
}

function getChoicePrice(choice: OptionChoiceRow) {
  const raw = choice.price_delta ?? choice.price ?? 0;
  return Number.isFinite(Number(raw)) ? Number(raw) : 0;
}

function getItemPrice(item: ItemRow) {
  const raw = item.base_price ?? item.price ?? 0;
  return Number.isFinite(Number(raw)) ? Number(raw) : 0;
}

export default function StorefrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [language, setLanguage] = useState<LanguageMode>('en');
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const copy = COPY[language];
  const theme = parseTheme(restaurant?.storefront_theme);

  useEffect(() => {
    let mounted = true;

    async function loadStore() {
      try {
        setLoading(true);
        setError('');

        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select(
            'id, name, slug, phone, address, hero_image, logo_image, hero_title, hero_subtitle, description, storefront_theme, storefront_language, pickup_enabled, delivery_enabled, delivery_fee, delivery_radius, delivery_minimum, pickup_message, published, hours'
          )
          .eq('slug', slug)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        if (!restaurantData) {
          if (!mounted) return;
          setRestaurant(null);
          setCategories([]);
          setItems([]);
          return;
        }

        const store = restaurantData as RestaurantRow;

        const { data: categoryRows, error: categoryError } = await supabase
          .from('menu_categories')
          .select('id, restaurant_id, name, sort_order')
          .eq('restaurant_id', store.id)
          .order('sort_order', { ascending: true });

        if (categoryError) throw categoryError;

        const { data: itemRows, error: itemError } = await supabase
          .from('menu_items')
          .select(
            'id, restaurant_id, category_id, name, description, image_url, price, base_price, availability, is_available, sort_order'
          )
          .eq('restaurant_id', store.id)
          .order('sort_order', { ascending: true });

        if (itemError) throw itemError;

        const rawItems = safeArray(itemRows) as ItemRow[];
        const itemIds = rawItems.map((item) => item.id);

        let groupRows: OptionGroupRow[] = [];
        let choiceRows: OptionChoiceRow[] = [];

        if (itemIds.length) {
          const { data: rawGroups, error: groupError } = await supabase
            .from('menu_option_groups')
            .select('id, item_id, name, is_required, selection_mode, sort_order')
            .in('item_id', itemIds)
            .order('sort_order', { ascending: true });

          if (groupError) throw groupError;
          groupRows = safeArray(rawGroups) as OptionGroupRow[];

          const groupIds = groupRows.map((group) => group.id);

          if (groupIds.length) {
            const { data: rawChoices, error: choiceError } = await supabase
              .from('menu_option_choices')
              .select('id, option_group_id, name, price, price_delta, sort_order')
              .in('option_group_id', groupIds)
              .order('sort_order', { ascending: true });

            if (choiceError) throw choiceError;
            choiceRows = safeArray(rawChoices) as OptionChoiceRow[];
          }
        }

        const mappedCategories: MenuCategory[] = safeArray(categoryRows).map((category, index) => ({
          id: category.id,
          name: category.name?.trim() || `Category ${index + 1}`,
          sortOrder: category.sort_order ?? index,
        }));

        const mappedItems: MenuItem[] = rawItems.map((item) => ({
          id: item.id,
          categoryId: item.category_id || '',
          name: item.name?.trim() || 'Untitled Item',
          description: item.description?.trim() || '',
          imageUrl: item.image_url || '',
          basePrice: getItemPrice(item),
          availability:
            item.availability === 'sold_out' || item.is_available === false ? 'sold_out' : 'available',
          groups: groupRows
            .filter((group) => group.item_id === item.id)
            .map((group, groupIndex) => ({
              id: group.id,
              name: group.name?.trim() || `Options ${groupIndex + 1}`,
              required: !!group.is_required,
              selectionMode: group.selection_mode === 'multiple' ? 'multiple' : 'single',
              choices: choiceRows
                .filter((choice) => choice.option_group_id === group.id)
                .map((choice, choiceIndex) => ({
                  id: choice.id,
                  name: choice.name?.trim() || `Choice ${choiceIndex + 1}`,
                  priceDelta: getChoicePrice(choice),
                })),
            })),
        }));

        if (!mounted) return;

        setRestaurant(store);
        setCategories(mappedCategories);
        setItems(mappedItems);
        setLanguage(parseLanguage(store.storefront_language));
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load store.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (slug) {
      void loadStore();
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!categories.length) return;

    const firstCategoryId = categories[0]?.id ?? '';

    setActiveCategory((current) => {
      if (!current) return firstCategoryId;
      const stillExists = categories.some((category) => category.id === current);
      return stillExists ? current : firstCategoryId;
    });
  }, [categories]);

  useEffect(() => {
    if (!selectedItem) return;

    const next: Record<string, string[]> = {};

    selectedItem.groups.forEach((group) => {
      if (group.selectionMode === 'single') {
        next[group.id] = [];
      } else {
        next[group.id] = [];
      }
    });

    setSelectedChoices(next);
    setQuantity(1);
  }, [selectedItem]);

  const resolvedCategoryId = useMemo(() => {
    if (activeCategory && categories.some((category) => category.id === activeCategory)) {
      return activeCategory;
    }
    return categories[0]?.id ?? '';
  }, [activeCategory, categories]);

  const visibleItems = useMemo(() => {
    if (!resolvedCategoryId) return [];
    return items.filter((item) => item.categoryId === resolvedCategoryId);
  }, [items, resolvedCategoryId]);

  const cartCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.total, 0),
    [cart]
  );

  const selectedItemTotal = useMemo(() => {
    if (!selectedItem) return 0;

    const extras = selectedItem.groups.reduce((sum, group) => {
      const ids = selectedChoices[group.id] || [];
      const picked = group.choices.filter((choice) => ids.includes(choice.id));
      return sum + picked.reduce((inner, choice) => inner + choice.priceDelta, 0);
    }, 0);

    return (selectedItem.basePrice + extras) * quantity;
  }, [selectedChoices, selectedItem, quantity]);

  function isChoiceSelected(groupId: string, choiceId: string) {
    return (selectedChoices[groupId] || []).includes(choiceId);
  }

  function toggleChoice(group: MenuGroup, choice: MenuChoice) {
    setSelectedChoices((current) => {
      const existing = current[group.id] || [];

      if (group.selectionMode === 'single') {
        return {
          ...current,
          [group.id]: existing.includes(choice.id) ? [] : [choice.id],
        };
      }

      return {
        ...current,
        [group.id]: existing.includes(choice.id)
          ? existing.filter((id) => id !== choice.id)
          : [...existing, choice.id],
      };
    });
  }

  function canAddSelectedItem() {
    if (!selectedItem) return false;

    return selectedItem.groups.every((group) => {
      if (!group.required) return true;
      return (selectedChoices[group.id] || []).length > 0;
    });
  }

  function addSelectedItemToCart() {
    if (!selectedItem || !canAddSelectedItem()) return;

    const selections: CartSelection[] = selectedItem.groups
      .map((group) => {
        const ids = selectedChoices[group.id] || [];
        const picked = group.choices.filter((choice) => ids.includes(choice.id));

        return {
          groupId: group.id,
          groupName: group.name,
          choiceIds: picked.map((choice) => choice.id),
          choiceLabels: picked.map((choice) =>
            choice.priceDelta > 0 ? `${choice.name} (+${money(choice.priceDelta)})` : choice.name
          ),
          priceDelta: picked.reduce((sum, choice) => sum + choice.priceDelta, 0),
        };
      })
      .filter((selection) => selection.choiceIds.length > 0);

    const lineTotal = (selectedItem.basePrice + selections.reduce((sum, selection) => sum + selection.priceDelta, 0)) * quantity;

    const nextLine: CartLine = {
      id: makeId('line'),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemImage: selectedItem.imageUrl,
      basePrice: selectedItem.basePrice,
      quantity,
      selections,
      total: lineTotal,
    };

    setCart((current) => [...current, nextLine]);
    setSelectedItem(null);
    setSelectedChoices({});
    setQuantity(1);
    setCartOpen(true);
  }

  function updateCartQuantity(lineId: string, nextQuantity: number) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.id !== lineId) return line;

          const safeQuantity = clampQuantity(nextQuantity);
          const unitTotal = line.total / line.quantity;

          return {
            ...line,
            quantity: safeQuantity,
            total: unitTotal * safeQuantity,
          };
        })
        .filter((line) => line.quantity > 0)
    );
  }

  function removeCartLine(lineId: string) {
    setCart((current) => current.filter((line) => line.id !== lineId));
  }

  if (loading) {
    return (
      <main className="store-page">
        <div className="status-card">{copy.loading}</div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="store-page">
        <div className="status-card">{copy.storeNotFound}</div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className={`store-page ${theme}`}>
      <section className="hero-shell">
        <div className="hero-media">
          {restaurant.hero_image ? (
            <img src={restaurant.hero_image} alt={restaurant.name || 'Store hero'} className="hero-image" />
          ) : (
            <div className="hero-fallback" />
          )}
          <div className="hero-overlay">
            <div className="brand-row">
              {restaurant.logo_image ? (
                <img src={restaurant.logo_image} alt={restaurant.name || 'Store logo'} className="brand-logo" />
              ) : (
                <div className="brand-logo-fallback">{(restaurant.name || 'M').charAt(0).toUpperCase()}</div>
              )}

              <div className="brand-copy">
                <h1>{restaurant.hero_title?.trim() || restaurant.name || 'Store'}</h1>
                <p>{restaurant.hero_subtitle?.trim() || `${copy.orderDirect} ${copy.noFees}`}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell">
        <div className="toolbar-row">
          <div className="language-toggle">
            <button
              type="button"
              className={language === 'en' ? 'active' : ''}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={language === 'es' ? 'active' : ''}
              onClick={() => setLanguage('es')}
            >
              ES
            </button>
          </div>

          <button type="button" className="cart-button" onClick={() => setCartOpen(true)}>
            Cart
            {cartCount ? <span>{cartCount}</span> : null}
          </button>
        </div>

        <section className="details-card">
          <div className="section-kicker">{copy.storeDetails}</div>

          <div className="details-grid">
            <div className="detail-box">
              <div className="detail-label">{copy.address}</div>
              <div className="detail-value">{restaurant.address || '—'}</div>
            </div>

            <div className="detail-box">
              <div className="detail-label">{copy.phone}</div>
              <div className="detail-value">{restaurant.phone || '—'}</div>
            </div>
          </div>
        </section>

        <section className="menu-shell">
          <h2>{copy.menu}</h2>
          <p className="menu-subtitle">{copy.orderNow}</p>

          <div className="category-kicker">{copy.categories}</div>

          <div className="category-row">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`category-pill ${resolvedCategoryId === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {!visibleItems.length ? (
            <div className="empty-card">{copy.noMenuItems}</div>
          ) : null}

          <div className="menu-grid">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="menu-card"
                onClick={() => item.availability === 'available' && setSelectedItem(item)}
                disabled={item.availability === 'sold_out'}
              >
                <div className="menu-card-image-wrap">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="menu-card-image" />
                  ) : (
                    <div className="menu-card-fallback" />
                  )}

                  {item.availability === 'sold_out' ? (
                    <div className="sold-out-badge">{copy.soldOut}</div>
                  ) : null}
                </div>

                <div className="menu-card-copy">
                  <div className="menu-card-head">
                    <h3>{item.name}</h3>
                    <strong>{money(item.basePrice)}</strong>
                  </div>
                  <p>{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </section>

      {selectedItem ? (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-top">
              {selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="modal-image" />
              ) : (
                <div className="modal-image-fallback" />
              )}

              <button type="button" className="close-button" onClick={() => setSelectedItem(null)}>
                {copy.close}
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-head">
                <div>
                  <h3>{selectedItem.name}</h3>
                  <p>{selectedItem.description}</p>
                </div>
                <strong>{money(selectedItem.basePrice)}</strong>
              </div>

              {selectedItem.groups.length ? (
                <div className="group-stack">
                  {selectedItem.groups.map((group) => (
                    <div key={group.id} className="group-card">
                      <div className="group-head">
                        <h4>{group.name}</h4>
                        <span>{group.required ? copy.required : copy.optional}</span>
                      </div>

                      <div className="choice-stack">
                        {group.choices.map((choice) => (
                          <button
                            key={choice.id}
                            type="button"
                            className={`choice-pill ${isChoiceSelected(group.id, choice.id) ? 'active' : ''}`}
                            onClick={() => toggleChoice(group, choice)}
                          >
                            <span>{choice.name}</span>
                            <strong>{choice.priceDelta > 0 ? `+${money(choice.priceDelta)}` : '$0.00'}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="quantity-row">
                <div className="quantity-label">{copy.quantity}</div>
                <div className="qty-controls">
                  <button type="button" onClick={() => setQuantity((current) => clampQuantity(current - 1))}>
                    −
                  </button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((current) => clampQuantity(current + 1))}>
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="add-button"
                disabled={!canAddSelectedItem()}
                onClick={addSelectedItemToCart}
              >
                {copy.addToCart} • {money(selectedItemTotal)}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="cart-backdrop" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="cart-head">
              <h3>{copy.yourCart}</h3>
              <button type="button" className="close-button small" onClick={() => setCartOpen(false)}>
                {copy.close}
              </button>
            </div>

            {!cart.length ? <div className="empty-card">{copy.emptyCart}</div> : null}

            <div className="cart-stack">
              {cart.map((line) => (
                <div key={line.id} className="cart-line">
                  <div className="cart-line-top">
                    <div>
                      <h4>{line.itemName}</h4>
                      <p>{money(line.total)}</p>
                    </div>

                    <button type="button" className="remove-line" onClick={() => removeCartLine(line.id)}>
                      ×
                    </button>
                  </div>

                  {line.selections.length ? (
                    <div className="selection-stack">
                      {line.selections.map((selection) => (
                        <div key={selection.groupId} className="selection-row">
                          <strong>{selection.groupName}</strong>
                          <span>{selection.choiceLabels.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="qty-controls small">
                    <button type="button" onClick={() => updateCartQuantity(line.id, line.quantity - 1)}>
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => updateCartQuantity(line.id, line.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="subtotal-row">
                <span>{copy.subtotal}</span>
                <strong>{money(cartSubtotal)}</strong>
              </div>

              <button
  type="button"
  className="add-button"
  disabled={!cart.length}
  onClick={async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart,
          restaurantId: restaurant?.id,
          slug: restaurant?.slug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Checkout failed.');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned.');
      }

      window.location.href = data.url;
    } catch (err: any) {
      alert(err?.message || 'Checkout failed.');
    }
  }}
>
  Checkout • {money(cartSubtotal)}
</button>
            </div>
          </aside>
        </div>
      ) : null}

      {error ? (
        <div className="error-toast">{error}</div>
      ) : null}

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .store-page {
    min-height: 100vh;
    background: #edf1f6;
    color: #0b1735;
  }

  .store-page.dark {
    background: #08090d;
    color: #ffffff;
  }

  .status-card,
  .empty-card {
    margin: 24px auto;
    max-width: 720px;
    background: #ffffff;
    border: 1px solid #dde3ec;
    border-radius: 28px;
    padding: 24px;
    font-size: 24px;
    font-weight: 900;
    text-align: center;
  }

  .hero-shell {
    position: relative;
    width: 100%;
  }

  .hero-media {
    position: relative;
    min-height: 440px;
    background: #cbd3df;
    overflow: hidden;
  }

  .hero-image,
  .hero-fallback {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .hero-image {
    object-fit: cover;
  }

  .hero-fallback {
    background: linear-gradient(135deg, #cad2de 0%, #eef2f7 100%);
  }

  .hero-overlay {
    position: relative;
    z-index: 1;
    min-height: 440px;
    display: flex;
    align-items: flex-start;
    padding: 28px 24px 110px;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.55) 100%);
  }

  .brand-row {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    max-width: 720px;
  }

  .brand-logo,
  .brand-logo-fallback {
    width: 86px;
    height: 86px;
    border-radius: 24px;
    object-fit: cover;
    background: #ffffff;
    flex-shrink: 0;
  }

  .brand-logo-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0b1735;
    font-size: 38px;
    font-weight: 900;
  }

  .brand-copy h1 {
    margin: 0;
    color: #ffffff;
    font-size: 84px;
    line-height: 0.95;
    font-weight: 900;
    letter-spacing: -0.06em;
  }

  .brand-copy p {
    margin: 10px 0 0;
    color: #ffffff;
    font-size: 28px;
    line-height: 1.1;
    font-weight: 900;
  }

  .page-shell {
    max-width: 1120px;
    margin: -68px auto 0;
    padding: 0 18px 48px;
    position: relative;
    z-index: 2;
  }

  .toolbar-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .language-toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 26px;
    background: rgba(17, 19, 31, 0.78);
    backdrop-filter: blur(16px);
  }

  .language-toggle button,
  .cart-button,
  .category-pill,
  .menu-card,
  .choice-pill,
  .add-button,
  .close-button,
  .qty-controls button,
  .remove-line {
    border: none;
    outline: none;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .language-toggle button {
    min-width: 120px;
    min-height: 84px;
    border-radius: 26px;
    background: transparent;
    color: rgba(255, 255, 255, 0.78);
    font-size: 24px;
    font-weight: 900;
  }

  .language-toggle button.active {
    background: #ffffff;
    color: #0b1735;
  }

  .cart-button {
    min-height: 58px;
    border-radius: 18px;
    padding: 0 18px;
    background: #0b1735;
    color: #ffffff;
    font-size: 18px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .cart-button span {
    min-width: 28px;
    height: 28px;
    border-radius: 999px;
    background: #ffffff;
    color: #0b1735;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 900;
  }

  .details-card,
  .menu-shell {
    background: #f7f7f8;
    border: 1px solid #dde3ec;
    border-radius: 34px;
    padding: 28px;
  }

  .details-card {
    margin-bottom: 20px;
  }

  .section-kicker,
  .category-kicker {
    color: #6f7f9f;
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 18px;
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .detail-box {
    border: 1px solid #d9e0ea;
    background: #eef1f5;
    border-radius: 30px;
    padding: 22px;
  }

  .detail-label {
    color: #6f7f9f;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .detail-value {
    color: #0b1735;
    font-size: 28px;
    line-height: 1.1;
    font-weight: 900;
    word-break: break-word;
  }

  .menu-shell h2 {
    margin: 0;
    color: #06133a;
    font-size: 78px;
    line-height: 0.95;
    font-weight: 900;
    letter-spacing: -0.06em;
  }

  .menu-subtitle {
    margin: 10px 0 24px;
    color: #6f7f9f;
    font-size: 28px;
    font-weight: 800;
  }

  .category-row {
    display: flex;
    gap: 12px;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 6px;
    margin-bottom: 24px;
    -webkit-overflow-scrolling: touch;
  }

  .category-row::-webkit-scrollbar {
    height: 6px;
  }

  .category-pill {
    white-space: nowrap;
    min-height: 56px;
    border-radius: 999px;
    padding: 0 20px;
    background: #ffffff;
    border: 1px solid #d6dce7;
    color: #0b1735;
    font-size: 18px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .category-pill.active {
    background: #0b1735;
    color: #ffffff;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .menu-card {
    background: #ffffff;
    border: 1px solid #dde3ec;
    border-radius: 28px;
    overflow: hidden;
    text-align: left;
    padding: 0;
    color: inherit;
  }

  .menu-card:disabled {
    opacity: 0.75;
    cursor: not-allowed;
  }

  .menu-card-image-wrap {
    position: relative;
  }

  .menu-card-image,
  .menu-card-fallback {
    width: 100%;
    aspect-ratio: 1 / 1;
    display: block;
    object-fit: cover;
    background: #dfe5ee;
  }

  .menu-card-fallback {
    background: linear-gradient(135deg, #d6dce7 0%, #eef2f6 100%);
  }

  .sold-out-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    border-radius: 999px;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.82);
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .menu-card-copy {
    padding: 18px;
  }

  .menu-card-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .menu-card-head h3 {
    margin: 0;
    color: #0b1735;
    font-size: 26px;
    line-height: 1.02;
    font-weight: 900;
  }

  .menu-card-head strong {
    color: #0b1735;
    font-size: 22px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .menu-card-copy p {
    margin: 10px 0 0;
    color: #6b7384;
    font-size: 16px;
    line-height: 1.45;
    font-weight: 700;
  }

  .modal-backdrop,
  .cart-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(9, 12, 22, 0.58);
    backdrop-filter: blur(10px);
    z-index: 50;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 18px;
  }

  .modal-card {
    width: min(760px, 100%);
    max-height: calc(100vh - 36px);
    overflow: auto;
    background: #ffffff;
    border-radius: 30px;
    border: 1px solid #dde3ec;
  }

  .modal-top {
    position: relative;
  }

  .modal-image,
  .modal-image-fallback {
    width: 100%;
    max-height: 360px;
    object-fit: cover;
    display: block;
    background: #dfe5ee;
  }

  .modal-image-fallback {
    min-height: 220px;
  }

  .close-button {
    position: absolute;
    top: 14px;
    right: 14px;
    min-height: 44px;
    border-radius: 999px;
    padding: 0 16px;
    background: rgba(255, 255, 255, 0.92);
    color: #0b1735;
    font-size: 15px;
    font-weight: 900;
  }

  .close-button.small {
    position: static;
  }

  .modal-body {
    padding: 20px;
    display: grid;
    gap: 18px;
  }

  .modal-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .modal-head h3 {
    margin: 0;
    color: #0b1735;
    font-size: 34px;
    line-height: 1;
    font-weight: 900;
  }

  .modal-head p {
    margin: 10px 0 0;
    color: #6b7384;
    font-size: 16px;
    line-height: 1.45;
    font-weight: 700;
  }

  .modal-head strong {
    color: #0b1735;
    font-size: 24px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .group-stack,
  .choice-stack,
  .cart-stack {
    display: grid;
    gap: 14px;
  }

  .group-card,
  .cart-line {
    border: 1px solid #dde3ec;
    background: #f8f9fb;
    border-radius: 22px;
    padding: 16px;
  }

  .group-head,
  .cart-line-top,
  .subtotal-row,
  .quantity-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .group-head h4,
  .cart-line-top h4 {
    margin: 0;
    color: #0b1735;
    font-size: 20px;
    font-weight: 900;
  }

  .group-head span,
  .cart-line-top p,
  .selection-row span,
  .quantity-label {
    color: #6b7384;
    font-size: 14px;
    font-weight: 800;
  }

  .cart-line-top p {
    margin: 6px 0 0;
  }

  .choice-pill {
    width: 100%;
    min-height: 58px;
    border-radius: 18px;
    padding: 12px 14px;
    background: #ffffff;
    border: 1px solid #dce2ec;
    color: #0b1735;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    text-align: left;
    font-size: 15px;
    font-weight: 900;
  }

  .choice-pill.active {
    background: #0b1735;
    color: #ffffff;
    border-color: #0b1735;
  }

  .qty-controls {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    border: 1px solid #dce2ec;
    border-radius: 999px;
    padding: 6px;
    background: #ffffff;
  }

  .qty-controls.small {
    margin-top: 14px;
  }

  .qty-controls button {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    background: #0b1735;
    color: #ffffff;
    font-size: 24px;
    font-weight: 900;
  }

  .qty-controls span {
    min-width: 28px;
    text-align: center;
    color: #0b1735;
    font-size: 18px;
    font-weight: 900;
  }

  .add-button {
    width: 100%;
    min-height: 64px;
    border-radius: 20px;
    background: #0b1735;
    color: #ffffff;
    font-size: 20px;
    font-weight: 900;
  }

  .add-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .cart-drawer {
    width: min(480px, 100%);
    max-height: calc(100vh - 36px);
    overflow: auto;
    background: #ffffff;
    border-radius: 28px;
    border: 1px solid #dde3ec;
    padding: 18px;
  }

  .cart-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
  }

  .cart-head h3 {
    margin: 0;
    color: #0b1735;
    font-size: 28px;
    font-weight: 900;
  }

  .selection-stack {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }

  .selection-row {
    display: grid;
    gap: 4px;
  }

  .selection-row strong {
    color: #0b1735;
    font-size: 14px;
    font-weight: 900;
  }

  .remove-line {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: #f3d6db;
    color: #8e2740;
    font-size: 24px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .cart-footer {
    position: sticky;
    bottom: 0;
    background: #ffffff;
    padding-top: 16px;
    margin-top: 16px;
  }

  .subtotal-row {
    margin-bottom: 14px;
  }

  .subtotal-row span,
  .subtotal-row strong {
    color: #0b1735;
    font-size: 20px;
    font-weight: 900;
  }

  .error-toast {
    position: fixed;
    left: 18px;
    right: 18px;
    bottom: 18px;
    z-index: 70;
    background: #ffe2e2;
    color: #8d3030;
    border: 1px solid #f1c0c0;
    border-radius: 20px;
    padding: 16px 18px;
    font-size: 15px;
    font-weight: 900;
  }

  @media (max-width: 900px) {
    .brand-copy h1 {
      font-size: 62px;
    }

    .brand-copy p {
      font-size: 22px;
    }

    .details-grid,
    .menu-grid {
      grid-template-columns: 1fr;
    }

    .menu-shell h2 {
      font-size: 62px;
    }
  }

  @media (max-width: 640px) {
    .hero-media,
    .hero-overlay {
      min-height: 380px;
    }

    .hero-overlay {
      padding: 18px 18px 96px;
    }

    .brand-row {
      gap: 14px;
      max-width: 100%;
    }

    .brand-logo,
    .brand-logo-fallback {
      width: 72px;
      height: 72px;
      border-radius: 20px;
    }

    .brand-copy h1 {
      font-size: 52px;
    }

    .brand-copy p {
      font-size: 18px;
    }

    .page-shell {
      margin-top: -46px;
      padding: 0 12px 34px;
    }

    .language-toggle {
      width: 100%;
      justify-content: stretch;
    }

    .language-toggle button {
      flex: 1;
      min-width: 0;
      min-height: 72px;
      font-size: 22px;
    }

    .toolbar-row {
      align-items: stretch;
    }

    .cart-button {
      width: 100%;
      justify-content: center;
    }

    .details-card,
    .menu-shell {
      padding: 18px;
      border-radius: 26px;
    }

    .section-kicker,
    .category-kicker {
      font-size: 16px;
      margin-bottom: 14px;
    }

    .detail-box {
      padding: 18px;
      border-radius: 24px;
    }

    .detail-value {
      font-size: 24px;
    }

    .menu-shell h2 {
      font-size: 48px;
    }

    .menu-subtitle {
      font-size: 18px;
      margin-bottom: 18px;
    }

    .category-row {
      margin-bottom: 18px;
    }

    .category-pill {
      min-height: 50px;
      padding: 0 16px;
      font-size: 16px;
    }

    .menu-card-head h3 {
      font-size: 22px;
    }

    .modal-backdrop,
    .cart-backdrop {
      padding: 10px;
      align-items: flex-end;
    }

    .modal-card,
    .cart-drawer {
      border-radius: 24px;
    }

    .modal-head {
      display: grid;
      gap: 8px;
    }

    .modal-head strong {
      font-size: 22px;
    }
  }
`;