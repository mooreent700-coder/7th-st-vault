'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';

type StorefrontTheme = 'light' | 'dark';
type Lang = 'en' | 'es';
type Availability = 'available' | 'sold_out';
type SelectionMode = 'single' | 'multiple';
type ActiveSection = 'store' | 'branding' | 'theme' | 'menu' | 'flyers';

type RestaurantRow = {
  id: string;
  owner_id: string | null;
  user_id: string | null;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hero_image: string | null;
  logo_image: string | null;
  storefront_theme: StorefrontTheme | null;
  storefront_language: Lang | null;
  order_language: Lang | null;
  pickup_enabled: boolean | null;
  delivery_enabled: boolean | null;
  delivery_fee: number | null;
  delivery_radius: number | null;
  delivery_minimum: number | null;
  hours: string | null;
  plan: string | null;
  stripe_account_id?: string | null;
  stripe_connected?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  stripe_onboarding_complete?: boolean | null;
};

type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number | null;
};

type ItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  image_file: string | null;
  availability: Availability | null;
  sort_order: number | null;
};

type OptionGroupRow = {
  id: string;
  item_id: string;
  name: string;
  is_required: boolean | null;
  selection_mode: SelectionMode | null;
  sort_order: number | null;
};

type OptionChoiceRow = {
  id: string;
  option_group_id: string;
  name: string;
  price_delta: number | null;
  sort_order: number | null;
};

type BuilderChoice = {
  id: string;
  name: string;
  price_delta: string;
  sort_order: number;
};

type BuilderGroup = {
  id: string;
  name: string;
  is_required: boolean;
  selection_mode: SelectionMode;
  sort_order: number;
  choices: BuilderChoice[];
};

type BuilderItem = {
  id: string;
  name: string;
  description: string;
  base_price: string;
  image_file: string;
  availability: Availability;
  sort_order: number;
  option_groups: BuilderGroup[];
};

type BuilderCategory = {
  id: string;
  name: string;
  sort_order: number;
  items: BuilderItem[];
};

type BuilderRestaurant = {
  name: string;
  slug: string;
  phone: string;
  address: string;
  hero_image: string;
  logo_image: string;
  storefront_theme: StorefrontTheme;
  storefront_language: Lang;
  order_language: Lang;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  delivery_fee: string;
  delivery_radius: string;
  delivery_minimum: string;
  hours: string;
  plan: string;
};

const DEFAULT_RESTAURANT: BuilderRestaurant = {
  name: '',
  slug: '',
  phone: '',
  address: '',
  hero_image: '',
  logo_image: '',
  storefront_theme: 'light',
  storefront_language: 'en',
  order_language: 'en',
  pickup_enabled: true,
  delivery_enabled: false,
  delivery_fee: '0',
  delivery_radius: '0',
  delivery_minimum: '0',
  hours: '',
  plan: 'starter',
};

const SECTION_LABELS: Record<ActiveSection, string> = {
  store: 'Store Setup',
  branding: 'Branding',
  theme: 'Theme & Language',
  menu: 'Menu Builder',
  flyers: 'Flyers',
};

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function sanitizeMoneyString(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join('')}`;
}

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buttonClass(active: boolean): string {
  return active
    ? 'rounded-full bg-slate-950 px-6 py-4 text-lg font-semibold text-white shadow-sm'
    : 'rounded-full bg-slate-100 px-6 py-4 text-lg font-semibold text-slate-900';
}

function fieldClass(): string {
  return 'w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-lg text-slate-950 outline-none transition focus:border-blue-500';
}

async function uploadImageFile(
  file: File,
  bucket: 'heroes' | 'logos' | 'menu-items',
  ownerId: string,
): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const path = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function emptyChoice(): BuilderChoice {
  return {
    id: uid('choice'),
    name: '',
    price_delta: '0',
    sort_order: 0,
  };
}

function emptyGroup(): BuilderGroup {
  return {
    id: uid('group'),
    name: '',
    is_required: false,
    selection_mode: 'single',
    sort_order: 0,
    choices: [emptyChoice()],
  };
}

function emptyMenuItem(): BuilderItem {
  return {
    id: uid('item'),
    name: '',
    description: '',
    base_price: '0',
    image_file: '',
    availability: 'available',
    sort_order: 0,
    option_groups: [emptyGroup()],
  };
}

function emptyCategory(): BuilderCategory {
  return {
    id: uid('category'),
    name: '',
    sort_order: 0,
    items: [emptyMenuItem()],
  };
}

function StorePreview({
  restaurant,
  categories,
}: {
  restaurant: BuilderRestaurant;
  categories: BuilderCategory[];
}) {
  const categoryTabs = categories.filter((c) => c.name.trim());
  const activeItems = categoryTabs.length > 0 ? categoryTabs[0].items : [];
  const themeClasses =
    restaurant.storefront_theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-slate-950';

  return (
    <div className={`overflow-hidden rounded-[32px] border border-slate-200 ${themeClasses}`}>
      <div className="relative">
        <div className="h-72 w-full overflow-hidden bg-slate-200 md:h-80">
          {restaurant.hero_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Store hero preview"
              className="h-full w-full object-cover"
              src={restaurant.hero_image}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-slate-500">
              Hero image preview
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-6 pb-6 pt-16 text-white">
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-sm font-semibold text-slate-900">
              {restaurant.logo_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Logo preview" className="h-full w-full object-cover" src={restaurant.logo_image} />
              ) : (
                'Logo'
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-4xl font-black leading-none">
                {restaurant.name || 'Your Store'}
              </h3>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-base font-medium text-white/90">
                <span>{restaurant.address || 'Store address'}</span>
                <span>{restaurant.phone || 'Store phone'}</span>
              </div>
            </div>

            <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold uppercase tracking-[0.3em] text-slate-950">
              {restaurant.storefront_language}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80 bg-white text-slate-950">
        <div className="flex flex-wrap gap-3 px-6 py-4">
          {categoryTabs.length > 0 ? (
            categoryTabs.map((category, index) => (
              <button
                key={category.id}
                className={
                  index === 0
                    ? 'rounded-xl bg-slate-950 px-5 py-3 text-base font-semibold text-white'
                    : 'rounded-xl bg-slate-100 px-5 py-3 text-base font-semibold text-slate-900'
                }
                type="button"
              >
                {category.name}
              </button>
            ))
          ) : (
            <div className="rounded-xl bg-slate-100 px-5 py-3 text-base font-semibold text-slate-500">
              Featured
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 px-6 pb-6 md:grid-cols-3">
          {activeItems.length > 0 ? (
            activeItems.slice(0, 6).map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="aspect-[1.1/1] w-full bg-slate-200">
                  {item.image_file ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={item.name || 'Menu item'} className="h-full w-full object-cover" src={item.image_file} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                      Item image
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-4">
                  <div className="truncate text-lg font-bold text-slate-950">
                    {item.name || 'Menu Item'}
                  </div>
                  <div className="text-sm text-slate-500">
                    ${parseNumber(item.base_price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 px-6 py-12 text-lg text-slate-500">
              Your live storefront preview will populate as soon as you add menu items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OwnerBuilderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [activeSection, setActiveSection] = useState<ActiveSection>('store');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<BuilderRestaurant>(DEFAULT_RESTAURANT);
  const [categories, setCategories] = useState<BuilderCategory[]>([]);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const pendingItemFiles = useRef<Record<string, File>>({});

  useEffect(() => {
    void bootstrap();
  }, []);

  const storeUrl = useMemo(() => {
    return restaurant.slug ? `/store/${restaurant.slug}` : '/store/your-store';
  }, [restaurant.slug]);

  async function bootstrap() {
    setLoading(true);
    setLoadError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw authError;
      }

      const user = authData.user;
      if (!user) {
        throw new Error('You must be signed in to load the builder.');
      }

      setOwnerId(user.id);

      const restaurantResult = await supabase
        .from('restaurants')
        .select('*')
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .limit(1)
        .maybeSingle();

      if (restaurantResult.error) {
        throw restaurantResult.error;
      }

      let restaurantRow = restaurantResult.data as RestaurantRow | null;

      if (!restaurantRow) {
        const inserted = await supabase
          .from('restaurants')
          .insert({
            owner_id: user.id,
            user_id: user.id,
            name: '',
            slug: '',
            phone: '',
            address: '',
            hero_image: '',
            logo_image: '',
            storefront_theme: 'light',
            storefront_language: 'en',
            order_language: 'en',
            pickup_enabled: true,
            delivery_enabled: false,
            delivery_fee: 0,
            delivery_radius: 0,
            delivery_minimum: 0,
            hours: '',
            plan: 'starter',
          })
          .select('*')
          .single();

        if (inserted.error) {
          throw inserted.error;
        }

        restaurantRow = inserted.data as RestaurantRow;
      }

      setRestaurantId(restaurantRow.id);

      setRestaurant({
        name: restaurantRow.name || '',
        slug: restaurantRow.slug || '',
        phone: restaurantRow.phone || '',
        address: restaurantRow.address || '',
        hero_image: restaurantRow.hero_image || '',
        logo_image: restaurantRow.logo_image || '',
        storefront_theme: restaurantRow.storefront_theme || 'light',
        storefront_language: restaurantRow.storefront_language || 'en',
        order_language: restaurantRow.order_language || 'en',
        pickup_enabled: Boolean(restaurantRow.pickup_enabled ?? true),
        delivery_enabled: Boolean(restaurantRow.delivery_enabled ?? false),
        delivery_fee: String(restaurantRow.delivery_fee ?? 0),
        delivery_radius: String(restaurantRow.delivery_radius ?? 0),
        delivery_minimum: String(restaurantRow.delivery_minimum ?? 0),
        hours: restaurantRow.hours || '',
        plan: restaurantRow.plan || 'starter',
      });

      const categoryResult = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantRow.id)
        .order('sort_order', { ascending: true });

      if (categoryResult.error) {
        throw categoryResult.error;
      }

      const itemResult = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantRow.id)
        .order('sort_order', { ascending: true });

      if (itemResult.error) {
        throw itemResult.error;
      }

      const itemIds = (itemResult.data || []).map((item) => item.id);
      let optionGroups: OptionGroupRow[] = [];
      let optionChoices: OptionChoiceRow[] = [];

      if (itemIds.length > 0) {
        const groupResult = await supabase
          .from('menu_option_groups')
          .select('*')
          .in('item_id', itemIds)
          .order('sort_order', { ascending: true });

        if (groupResult.error) {
          throw groupResult.error;
        }

        optionGroups = (groupResult.data || []) as OptionGroupRow[];
        const groupIds = optionGroups.map((group) => group.id);

        if (groupIds.length > 0) {
          const choiceResult = await supabase
            .from('menu_option_choices')
            .select('*')
            .in('option_group_id', groupIds)
            .order('sort_order', { ascending: true });

          if (choiceResult.error) {
            throw choiceResult.error;
          }

          optionChoices = (choiceResult.data || []) as OptionChoiceRow[];
        }
      }

      const nextCategories: BuilderCategory[] = ((categoryResult.data || []) as CategoryRow[]).map((category) => {
        const itemsForCategory = ((itemResult.data || []) as ItemRow[])
          .filter((item) => item.category_id === category.id)
          .map((item) => {
            const groupsForItem = optionGroups
              .filter((group) => group.item_id === item.id)
              .map((group) => ({
                id: group.id,
                name: group.name || '',
                is_required: Boolean(group.is_required),
                selection_mode: group.selection_mode || 'single',
                sort_order: group.sort_order ?? 0,
                choices: optionChoices
                  .filter((choice) => choice.option_group_id === group.id)
                  .map((choice) => ({
                    id: choice.id,
                    name: choice.name || '',
                    price_delta: String(choice.price_delta ?? 0),
                    sort_order: choice.sort_order ?? 0,
                  })),
              }));

            return {
              id: item.id,
              name: item.name || '',
              description: item.description || '',
              base_price: String(item.base_price ?? 0),
              image_file: item.image_file || '',
              availability: item.availability || 'available',
              sort_order: item.sort_order ?? 0,
              option_groups: groupsForItem.length > 0 ? groupsForItem : [emptyGroup()],
            };
          });

        return {
          id: category.id,
          name: category.name || '',
          sort_order: category.sort_order ?? 0,
          items: itemsForCategory.length > 0 ? itemsForCategory : [emptyMenuItem()],
        };
      });

      setCategories(nextCategories.length > 0 ? nextCategories : [emptyCategory()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load builder data.';
      setLoadError(message);
      setCategories([emptyCategory()]);
    } finally {
      setLoading(false);
    }
  }

  function updateRestaurant<K extends keyof BuilderRestaurant>(key: K, value: BuilderRestaurant[K]) {
    setRestaurant((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name') {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  function updateCategory(categoryId: string, patch: Partial<BuilderCategory>) {
    setCategories((prev) =>
      prev.map((category) => (category.id === categoryId ? { ...category, ...patch } : category)),
    );
  }

  function updateItem(categoryId: string, itemId: string, patch: Partial<BuilderItem>) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            },
      ),
    );
  }

  function updateGroup(
    categoryId: string,
    itemId: string,
    groupId: string,
    patch: Partial<BuilderGroup>,
  ) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      option_groups: item.option_groups.map((group) =>
                        group.id === groupId ? { ...group, ...patch } : group,
                      ),
                    },
              ),
            },
      ),
    );
  }

  function updateChoice(
    categoryId: string,
    itemId: string,
    groupId: string,
    choiceId: string,
    patch: Partial<BuilderChoice>,
  ) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      option_groups: item.option_groups.map((group) =>
                        group.id !== groupId
                          ? group
                          : {
                              ...group,
                              choices: group.choices.map((choice) =>
                                choice.id === choiceId ? { ...choice, ...patch } : choice,
                              ),
                            },
                      ),
                    },
              ),
            },
      ),
    );
  }

  function addCategory() {
    setCategories((prev) => [...prev, { ...emptyCategory(), sort_order: prev.length }]);
    setActiveSection('menu');
  }

  function removeCategory(categoryId: string) {
    setCategories((prev) => {
      const next = prev.filter((category) => category.id !== categoryId);
      return next.length > 0 ? next.map((category, index) => ({ ...category, sort_order: index })) : [emptyCategory()];
    });
  }

  function addItem(categoryId: string) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: [...category.items, { ...emptyMenuItem(), sort_order: category.items.length }],
            },
      ),
    );
  }

  function removeItem(categoryId: string, itemId: string) {
    delete pendingItemFiles.current[itemId];
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items:
                category.items.filter((item) => item.id !== itemId).length > 0
                  ? category.items
                      .filter((item) => item.id !== itemId)
                      .map((item, index) => ({ ...item, sort_order: index }))
                  : [emptyMenuItem()],
            },
      ),
    );
  }

  function addGroup(categoryId: string, itemId: string) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      option_groups: [...item.option_groups, { ...emptyGroup(), sort_order: item.option_groups.length }],
                    },
              ),
            },
      ),
    );
  }

  function removeGroup(categoryId: string, itemId: string, groupId: string) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      option_groups:
                        item.option_groups.filter((group) => group.id !== groupId).length > 0
                          ? item.option_groups
                              .filter((group) => group.id !== groupId)
                              .map((group, index) => ({ ...group, sort_order: index }))
                          : [emptyGroup()],
                    },
              ),
            },
      ),
    );
  }

  function addChoice(categoryId: string, itemId: string, groupId: string) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      option_groups: item.option_groups.map((group) =>
                        group.id !== groupId
                          ? group
                          : {
                              ...group,
                              choices: [...group.choices, { ...emptyChoice(), sort_order: group.choices.length }],
                            },
                      ),
                    },
              ),
            },
      ),
    );
  }

  function removeChoice(categoryId: string, itemId: string, groupId: string, choiceId: string) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      option_groups: item.option_groups.map((group) =>
                        group.id !== groupId
                          ? group
                          : {
                              ...group,
                              choices:
                                group.choices.filter((choice) => choice.id !== choiceId).length > 0
                                  ? group.choices
                                      .filter((choice) => choice.id !== choiceId)
                                      .map((choice, index) => ({ ...choice, sort_order: index }))
                                  : [emptyChoice()],
                            },
                      ),
                    },
              ),
            },
      ),
    );
  }

  async function onHeroUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setHeroFile(file);
    setRestaurant((prev) => ({ ...prev, hero_image: URL.createObjectURL(file) }));
  }

  async function onLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setRestaurant((prev) => ({ ...prev, logo_image: URL.createObjectURL(file) }));
  }

  async function onItemImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    categoryId: string,
    itemId: string,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    pendingItemFiles.current[itemId] = file;
    updateItem(categoryId, itemId, {
      image_file: URL.createObjectURL(file),
    });
  }

  async function saveBuilder() {
    if (!ownerId) {
      setSaveError('No signed-in owner found.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      let ensuredRestaurantId = restaurantId;

      if (!ensuredRestaurantId) {
        const inserted = await supabase
          .from('restaurants')
          .insert({
            owner_id: ownerId,
            user_id: ownerId,
            name: restaurant.name,
            slug: restaurant.slug,
            phone: restaurant.phone,
            address: restaurant.address,
            hero_image: '',
            logo_image: '',
            storefront_theme: restaurant.storefront_theme,
            storefront_language: restaurant.storefront_language,
            order_language: restaurant.order_language,
            pickup_enabled: restaurant.pickup_enabled,
            delivery_enabled: restaurant.delivery_enabled,
            delivery_fee: parseNumber(restaurant.delivery_fee),
            delivery_radius: parseNumber(restaurant.delivery_radius),
            delivery_minimum: parseNumber(restaurant.delivery_minimum),
            hours: restaurant.hours,
            plan: restaurant.plan,
          })
          .select('*')
          .single();

        if (inserted.error) {
          throw inserted.error;
        }

        ensuredRestaurantId = (inserted.data as RestaurantRow).id;
        setRestaurantId(ensuredRestaurantId);
      }

      let heroUrl = restaurant.hero_image;
      let logoUrl = restaurant.logo_image;

      if (heroFile) {
        heroUrl = await uploadImageFile(heroFile, 'heroes', ownerId);
      }

      if (logoFile) {
        logoUrl = await uploadImageFile(logoFile, 'logos', ownerId);
      }

      const restaurantUpdate = await supabase
        .from('restaurants')
        .update({
          owner_id: ownerId,
          user_id: ownerId,
          name: restaurant.name,
          slug: restaurant.slug,
          phone: restaurant.phone,
          address: restaurant.address,
          hero_image: heroUrl,
          logo_image: logoUrl,
          storefront_theme: restaurant.storefront_theme,
          storefront_language: restaurant.storefront_language,
          order_language: restaurant.order_language,
          pickup_enabled: restaurant.pickup_enabled,
          delivery_enabled: restaurant.delivery_enabled,
          delivery_fee: parseNumber(restaurant.delivery_fee),
          delivery_radius: parseNumber(restaurant.delivery_radius),
          delivery_minimum: parseNumber(restaurant.delivery_minimum),
          hours: restaurant.hours,
          plan: restaurant.plan,
        })
        .eq('id', ensuredRestaurantId);

      if (restaurantUpdate.error) {
        throw restaurantUpdate.error;
      }

      const existingItemsResult = await supabase
        .from('menu_items')
        .select('id')
        .eq('restaurant_id', ensuredRestaurantId);

      if (existingItemsResult.error) {
        throw existingItemsResult.error;
      }

      const existingItemIds = (existingItemsResult.data || []).map((row) => row.id);

      if (existingItemIds.length > 0) {
        const existingGroupsResult = await supabase
          .from('menu_option_groups')
          .select('id')
          .in('item_id', existingItemIds);

        if (existingGroupsResult.error) {
          throw existingGroupsResult.error;
        }

        const existingGroupIds = (existingGroupsResult.data || []).map((row) => row.id);

        if (existingGroupIds.length > 0) {
          const deleteChoices = await supabase
            .from('menu_option_choices')
            .delete()
            .in('option_group_id', existingGroupIds);

          if (deleteChoices.error) {
            throw deleteChoices.error;
          }
        }

        const deleteGroups = await supabase
          .from('menu_option_groups')
          .delete()
          .in('item_id', existingItemIds);

        if (deleteGroups.error) {
          throw deleteGroups.error;
        }

        const deleteItems = await supabase
          .from('menu_items')
          .delete()
          .eq('restaurant_id', ensuredRestaurantId);

        if (deleteItems.error) {
          throw deleteItems.error;
        }
      }

      const deleteCategories = await supabase
        .from('menu_categories')
        .delete()
        .eq('restaurant_id', ensuredRestaurantId);

      if (deleteCategories.error) {
        throw deleteCategories.error;
      }

      for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
        const category = categories[categoryIndex];
        const categoryInsert = await supabase
          .from('menu_categories')
          .insert({
            restaurant_id: ensuredRestaurantId,
            name: category.name || `Category ${categoryIndex + 1}`,
            sort_order: categoryIndex,
          })
          .select('*')
          .single();

        if (categoryInsert.error) {
          throw categoryInsert.error;
        }

        const savedCategory = categoryInsert.data as CategoryRow;

        for (let itemIndex = 0; itemIndex < category.items.length; itemIndex += 1) {
          const item = category.items[itemIndex];
          let itemImage = item.image_file;
          const pendingFile = pendingItemFiles.current[item.id];

          if (pendingFile) {
            itemImage = await uploadImageFile(pendingFile, 'menu-items', ownerId);
          }

          const itemInsert = await supabase
            .from('menu_items')
            .insert({
              restaurant_id: ensuredRestaurantId,
              category_id: savedCategory.id,
              name: item.name || `Item ${itemIndex + 1}`,
              description: item.description,
              base_price: parseNumber(item.base_price),
              image_file: itemImage,
              availability: item.availability,
              sort_order: itemIndex,
            })
            .select('*')
            .single();

          if (itemInsert.error) {
            throw itemInsert.error;
          }

          const savedItem = itemInsert.data as ItemRow;

          for (let groupIndex = 0; groupIndex < item.option_groups.length; groupIndex += 1) {
            const group = item.option_groups[groupIndex];
            const groupInsert = await supabase
              .from('menu_option_groups')
              .insert({
                item_id: savedItem.id,
                name: group.name || `Options ${groupIndex + 1}`,
                is_required: group.is_required,
                selection_mode: group.selection_mode,
                sort_order: groupIndex,
              })
              .select('*')
              .single();

            if (groupInsert.error) {
              throw groupInsert.error;
            }

            const savedGroup = groupInsert.data as OptionGroupRow;

            for (let choiceIndex = 0; choiceIndex < group.choices.length; choiceIndex += 1) {
              const choice = group.choices[choiceIndex];
              const choiceInsert = await supabase.from('menu_option_choices').insert({
                option_group_id: savedGroup.id,
                name: choice.name || `Choice ${choiceIndex + 1}`,
                price_delta: parseNumber(choice.price_delta),
                sort_order: choiceIndex,
              });

              if (choiceInsert.error) {
                throw choiceInsert.error;
              }
            }
          }
        }
      }

      pendingItemFiles.current = {};
      setHeroFile(null);
      setLogoFile(null);
      setSaveSuccess('Builder saved successfully.');
      await bootstrap();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save builder data.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="min-h-screen bg-[#eef1f7] p-4 md:p-8">
      <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 md:px-8">
          <div className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950">
            <span>MENUFLOW</span>
            <span className="font-medium text-slate-500">BUILDER</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-base font-semibold text-slate-700">
              {restaurant.storefront_language.toUpperCase()} | {restaurant.order_language.toUpperCase()}
            </div>
            <Link
              className="rounded-xl bg-slate-950 px-5 py-3 text-base font-semibold text-white"
              href={restaurant.slug ? `/store/${restaurant.slug}` : '#'}
              prefetch={false}
            >
              Open Store
            </Link>
            <button
              className="rounded-xl bg-slate-950 px-5 py-3 text-base font-semibold text-white"
              disabled={saving || loading}
              onClick={() => void saveBuilder()}
              type="button"
            >
              {saving ? 'Saving…' : 'Save Builder'}
            </button>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[720px_minmax(0,1fr)]">
          <div className="border-r border-slate-200">
            <div className="border-b border-slate-200 px-6 py-8 md:px-8">
              <p className="text-lg font-semibold uppercase tracking-[0.35em] text-blue-600">
                Owner Control Center
              </p>
              <h1 className="mt-4 text-5xl font-black leading-none text-slate-950 md:text-7xl">
                MENUFLOW
                <br />
                BUILDER
              </h1>
              <p className="mt-6 max-w-3xl text-2xl leading-relaxed text-slate-500">
                One trusted source of truth for your store setup, branding, menu, options, and storefront data.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1.1fr]">
                <div className="rounded-[28px] bg-slate-100 px-5 py-5">
                  <div className="text-2xl font-black text-slate-950">Store URL</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-500">{storeUrl}</div>
                </div>

                <button
                  className="rounded-[28px] bg-blue-600 px-6 py-5 text-3xl font-bold text-white shadow-lg shadow-blue-600/20"
                  disabled={saving || loading}
                  onClick={() => void saveBuilder()}
                  type="button"
                >
                  {saving ? 'Saving…' : 'Save Builder'}
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                {(Object.keys(SECTION_LABELS) as ActiveSection[]).map((sectionKey) => (
                  <button
                    key={sectionKey}
                    className={buttonClass(activeSection === sectionKey)}
                    onClick={() => setActiveSection(sectionKey)}
                    type="button"
                  >
                    {SECTION_LABELS[sectionKey]}
                  </button>
                ))}
              </div>

              {loadError ? (
                <div className="mt-8 rounded-[28px] bg-red-50 px-5 py-5 text-2xl font-bold text-red-700">
                  {loadError}
                </div>
              ) : null}

              {saveError ? (
                <div className="mt-4 rounded-[28px] bg-red-50 px-5 py-5 text-2xl font-bold text-red-700">
                  {saveError}
                </div>
              ) : null}

              {saveSuccess ? (
                <div className="mt-4 rounded-[28px] bg-emerald-50 px-5 py-5 text-2xl font-bold text-emerald-700">
                  {saveSuccess}
                </div>
              ) : null}
            </div>

            <div className="space-y-8 px-6 py-8 md:px-8">
              {activeSection === 'store' && (
                <div className="rounded-[32px] bg-white">
                  <h2 className="text-6xl font-black text-slate-950">Store setup</h2>
                  <p className="mt-6 text-3xl leading-relaxed text-slate-500">
                    This section controls the restaurant row in your final schema. No legacy fields. No URL paste logic.
                  </p>

                  <div className="mt-10 space-y-6">
                    <div>
                      <label className="mb-3 block text-xl font-bold text-slate-950">Store name</label>
                      <input
                        className={fieldClass()}
                        value={restaurant.name}
                        onChange={(e) => updateRestaurant('name', e.target.value)}
                        placeholder="CJ Moore Kitchen"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-xl font-bold text-slate-950">Slug</label>
                      <input
                        className={fieldClass()}
                        value={restaurant.slug}
                        onChange={(e) => updateRestaurant('slug', slugify(e.target.value))}
                        placeholder="cj-moore-kitchen"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-xl font-bold text-slate-950">Phone</label>
                      <input
                        className={fieldClass()}
                        value={restaurant.phone}
                        onChange={(e) => updateRestaurant('phone', e.target.value)}
                        placeholder="(323) 812-7102"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-xl font-bold text-slate-950">Address</label>
                      <input
                        className={fieldClass()}
                        value={restaurant.address}
                        onChange={(e) => updateRestaurant('address', e.target.value)}
                        placeholder="123 Main St, Los Angeles, CA"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-xl font-bold text-slate-950">Delivery fee</label>
                      <input
                        className={fieldClass()}
                        value={restaurant.delivery_fee}
                        onChange={(e) => updateRestaurant('delivery_fee', sanitizeMoneyString(e.target.value))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-xl font-bold text-slate-950">Delivery radius (miles)</label>
                      <input
                        className={fieldClass()}
                        value={restaurant.delivery_radius}
                        onChange={(e) => updateRestaurant('delivery_radius', sanitizeMoneyString(e.target.value))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-xl font-bold text-slate-950">Delivery minimum</label>
                      <input
                        className={fieldClass()}
                        value={restaurant.delivery_minimum}
                        onChange={(e) => updateRestaurant('delivery_minimum', sanitizeMoneyString(e.target.value))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-xl font-bold text-slate-950">Plan</label>
                      <select
                        className={fieldClass()}
                        value={restaurant.plan}
                        onChange={(e) => updateRestaurant('plan', e.target.value)}
                      >
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <button
                        type="button"
                        className={restaurant.pickup_enabled ? 'rounded-[28px] border border-blue-600 bg-blue-50 px-6 py-6 text-left' : 'rounded-[28px] border border-slate-200 bg-white px-6 py-6 text-left'}
                        onClick={() => updateRestaurant('pickup_enabled', !restaurant.pickup_enabled)}
                      >
                        <div className="text-3xl font-black text-slate-950">Pickup</div>
                        <div className="mt-2 text-xl text-slate-500">
                          {restaurant.pickup_enabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </button>

                      <button
                        type="button"
                        className={restaurant.delivery_enabled ? 'rounded-[28px] border border-blue-600 bg-blue-50 px-6 py-6 text-left' : 'rounded-[28px] border border-slate-200 bg-white px-6 py-6 text-left'}
                        onClick={() => updateRestaurant('delivery_enabled', !restaurant.delivery_enabled)}
                      >
                        <div className="text-3xl font-black text-slate-950">Delivery</div>
                        <div className="mt-2 text-xl text-slate-500">
                          {restaurant.delivery_enabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </button>
                    </div>

                    <div>
                      <label className="mb-3 block text-xl font-bold text-slate-950">Business hours</label>
                      <textarea
                        className={`${fieldClass()} min-h-[160px]`}
                        value={restaurant.hours}
                        onChange={(e) => updateRestaurant('hours', e.target.value)}
                        placeholder={'Mon–Fri: 8:00 AM - 8:00 PM\nSat–Sun: 9:00 AM - 6:00 PM'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'branding' && (
                <div className="rounded-[32px] bg-white">
                  <h2 className="text-6xl font-black text-slate-950">Branding</h2>
                  <p className="mt-6 text-3xl leading-relaxed text-slate-500">
                    Upload from gallery or file picker only. No image URLs.
                  </p>

                  <div className="mt-10 grid gap-6 md:grid-cols-2">
                    <button
                      type="button"
                      className="rounded-[24px] border border-slate-200 px-6 py-5 text-xl font-semibold text-slate-950"
                      onClick={() => heroInputRef.current?.click()}
                    >
                      Upload Hero Image
                    </button>

                    <button
                      type="button"
                      className="rounded-[24px] border border-slate-200 px-6 py-5 text-xl font-semibold text-slate-950"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      Upload Logo
                    </button>

                    <input ref={heroInputRef} hidden type="file" accept="image/*" onChange={onHeroUpload} />
                    <input ref={logoInputRef} hidden type="file" accept="image/*" onChange={onLogoUpload} />
                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="overflow-hidden rounded-[28px] border border-slate-200">
                      <div className="bg-slate-50 px-5 py-4 text-xl font-bold text-slate-950">Hero image</div>
                      <div className="aspect-[1.3/1] bg-slate-100">
                        {restaurant.hero_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="Hero" className="h-full w-full object-cover" src={restaurant.hero_image} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg text-slate-500">
                            No hero image uploaded yet
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[28px] border border-slate-200">
                      <div className="bg-slate-50 px-5 py-4 text-xl font-bold text-slate-950">Logo</div>
                      <div className="aspect-[1.3/1] bg-slate-100">
                        {restaurant.logo_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="Logo" className="h-full w-full object-contain p-8" src={restaurant.logo_image} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg text-slate-500">
                            No logo uploaded yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'theme' && (
                <div className="rounded-[32px] bg-white">
                  <h2 className="text-6xl font-black text-slate-950">Theme & Language</h2>
                  <p className="mt-6 text-3xl leading-relaxed text-slate-500">
                    This affects the storefront and preview only. The admin builder stays clean and consistent.
                  </p>

                  <div className="mt-10 space-y-8">
                    <div>
                      <div className="mb-4 text-xl font-bold text-slate-950">Storefront theme</div>
                      <div className="flex flex-wrap gap-4">
                        <button
                          type="button"
                          className={buttonClass(restaurant.storefront_theme === 'light')}
                          onClick={() => updateRestaurant('storefront_theme', 'light')}
                        >
                          Light
                        </button>
                        <button
                          type="button"
                          className={buttonClass(restaurant.storefront_theme === 'dark')}
                          onClick={() => updateRestaurant('storefront_theme', 'dark')}
                        >
                          Dark
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="mb-4 text-xl font-bold text-slate-950">Storefront language</div>
                      <div className="flex flex-wrap gap-4">
                        <button
                          type="button"
                          className={buttonClass(restaurant.storefront_language === 'en')}
                          onClick={() => updateRestaurant('storefront_language', 'en')}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          className={buttonClass(restaurant.storefront_language === 'es')}
                          onClick={() => updateRestaurant('storefront_language', 'es')}
                        >
                          ES
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="mb-4 text-xl font-bold text-slate-950">Order language received by owner</div>
                      <div className="flex flex-wrap gap-4">
                        <button
                          type="button"
                          className={buttonClass(restaurant.order_language === 'en')}
                          onClick={() => updateRestaurant('order_language', 'en')}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          className={buttonClass(restaurant.order_language === 'es')}
                          onClick={() => updateRestaurant('order_language', 'es')}
                        >
                          ES
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'menu' && (
                <div className="rounded-[32px] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-6xl font-black text-slate-950">Menu builder</h2>
                      <p className="mt-6 text-3xl leading-relaxed text-slate-500">
                        Built to save categories, items, option groups, and choices into the final clean schema.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button
                        type="button"
                        className="rounded-[24px] bg-slate-100 px-6 py-5 text-2xl font-bold text-slate-950"
                        onClick={addCategory}
                      >
                        Add Category
                      </button>
                    </div>
                  </div>

                  <div className="mt-10 space-y-8">
                    {categories.map((category, categoryIndex) => (
                      <div key={category.id} className="rounded-[28px] border border-slate-200 p-6">
                        <div className="flex flex-wrap items-center gap-4">
                          <input
                            className={fieldClass()}
                            value={category.name}
                            onChange={(e) =>
                              updateCategory(category.id, {
                                name: e.target.value,
                                sort_order: categoryIndex,
                              })
                            }
                            placeholder="Category name"
                          />
                          <button
                            type="button"
                            className="rounded-[20px] bg-red-50 px-5 py-4 text-lg font-semibold text-red-700"
                            onClick={() => removeCategory(category.id)}
                          >
                            Remove Category
                          </button>
                          <button
                            type="button"
                            className="rounded-[20px] bg-slate-950 px-5 py-4 text-lg font-semibold text-white"
                            onClick={() => addItem(category.id)}
                          >
                            Add Item
                          </button>
                        </div>

                        <div className="mt-6 space-y-6">
                          {category.items.map((item, itemIndex) => (
                            <div key={item.id} className="rounded-[24px] bg-slate-50 p-5">
                              <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                  <label className="mb-3 block text-lg font-bold text-slate-950">Item name</label>
                                  <input
                                    className={fieldClass()}
                                    value={item.name}
                                    onChange={(e) =>
                                      updateItem(category.id, item.id, {
                                        name: e.target.value,
                                        sort_order: itemIndex,
                                      })
                                    }
                                    placeholder="Chicken Taco"
                                  />
                                </div>

                                <div>
                                  <label className="mb-3 block text-lg font-bold text-slate-950">Base price</label>
                                  <input
                                    className={fieldClass()}
                                    value={item.base_price}
                                    onChange={(e) =>
                                      updateItem(category.id, item.id, {
                                        base_price: sanitizeMoneyString(e.target.value),
                                      })
                                    }
                                    placeholder="12.00"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="mb-3 block text-lg font-bold text-slate-950">Description</label>
                                  <textarea
                                    className={`${fieldClass()} min-h-[120px]`}
                                    value={item.description}
                                    onChange={(e) =>
                                      updateItem(category.id, item.id, {
                                        description: e.target.value,
                                      })
                                    }
                                    placeholder="Grilled chicken, lettuce, pico de gallo, and cheese."
                                  />
                                </div>

                                <div>
                                  <label className="mb-3 block text-lg font-bold text-slate-950">Availability</label>
                                  <div className="flex flex-wrap gap-4">
                                    <button
                                      type="button"
                                      className={buttonClass(item.availability === 'available')}
                                      onClick={() =>
                                        updateItem(category.id, item.id, {
                                          availability: 'available',
                                        })
                                      }
                                    >
                                      Available
                                    </button>
                                    <button
                                      type="button"
                                      className={buttonClass(item.availability === 'sold_out')}
                                      onClick={() =>
                                        updateItem(category.id, item.id, {
                                          availability: 'sold_out',
                                        })
                                      }
                                    >
                                      Sold Out
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-3 block text-lg font-bold text-slate-950">Item image</label>
                                  <input
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-4"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => void onItemImageUpload(e, category.id, item.id)}
                                  />
                                </div>
                              </div>

                              <div className="mt-5 rounded-[20px] border border-slate-200 bg-white p-4">
                                <div className="aspect-[1.4/1] overflow-hidden rounded-[18px] bg-slate-100">
                                  {item.image_file ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      alt={item.name || 'Menu item image'}
                                      className="h-full w-full object-cover"
                                      src={item.image_file}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-base text-slate-500">
                                      No image uploaded yet
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-6 space-y-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                  <div className="text-2xl font-black text-slate-950">Option groups</div>
                                  <button
                                    type="button"
                                    className="rounded-[18px] bg-slate-950 px-5 py-4 text-lg font-semibold text-white"
                                    onClick={() => addGroup(category.id, item.id)}
                                  >
                                    Add Option Group
                                  </button>
                                </div>

                                {item.option_groups.map((group, groupIndex) => (
                                  <div key={group.id} className="rounded-[20px] border border-slate-200 bg-white p-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div>
                                        <label className="mb-2 block text-base font-bold text-slate-950">
                                          Group name
                                        </label>
                                        <input
                                          className={fieldClass()}
                                          value={group.name}
                                          onChange={(e) =>
                                            updateGroup(category.id, item.id, group.id, {
                                              name: e.target.value,
                                              sort_order: groupIndex,
                                            })
                                          }
                                          placeholder="Choose Your Protein"
                                        />
                                      </div>

                                      <div className="flex flex-wrap items-end gap-3">
                                        <button
                                          type="button"
                                          className={buttonClass(group.selection_mode === 'single')}
                                          onClick={() =>
                                            updateGroup(category.id, item.id, group.id, {
                                              selection_mode: 'single',
                                            })
                                          }
                                        >
                                          Single
                                        </button>
                                        <button
                                          type="button"
                                          className={buttonClass(group.selection_mode === 'multiple')}
                                          onClick={() =>
                                            updateGroup(category.id, item.id, group.id, {
                                              selection_mode: 'multiple',
                                            })
                                          }
                                        >
                                          Multiple
                                        </button>
                                        <button
                                          type="button"
                                          className={
                                            group.is_required
                                              ? 'rounded-full bg-blue-600 px-6 py-4 text-lg font-semibold text-white'
                                              : 'rounded-full bg-slate-100 px-6 py-4 text-lg font-semibold text-slate-900'
                                          }
                                          onClick={() =>
                                            updateGroup(category.id, item.id, group.id, {
                                              is_required: !group.is_required,
                                            })
                                          }
                                        >
                                          {group.is_required ? 'Required' : 'Optional'}
                                        </button>
                                        <button
                                          type="button"
                                          className="rounded-full bg-red-50 px-6 py-4 text-lg font-semibold text-red-700"
                                          onClick={() => removeGroup(category.id, item.id, group.id)}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                      {group.choices.map((choice, choiceIndex) => (
                                        <div key={choice.id} className="grid gap-4 md:grid-cols-[1fr_220px_180px]">
                                          <input
                                            className={fieldClass()}
                                            value={choice.name}
                                            onChange={(e) =>
                                              updateChoice(category.id, item.id, group.id, choice.id, {
                                                name: e.target.value,
                                                sort_order: choiceIndex,
                                              })
                                            }
                                            placeholder="Chicken"
                                          />
                                          <input
                                            className={fieldClass()}
                                            value={choice.price_delta}
                                            onChange={(e) =>
                                              updateChoice(category.id, item.id, group.id, choice.id, {
                                                price_delta: sanitizeMoneyString(e.target.value),
                                              })
                                            }
                                            placeholder="0"
                                          />
                                          <button
                                            type="button"
                                            className="rounded-[20px] bg-red-50 px-5 py-4 text-lg font-semibold text-red-700"
                                            onClick={() => removeChoice(category.id, item.id, group.id, choice.id)}
                                          >
                                            Remove Choice
                                          </button>
                                        </div>
                                      ))}

                                      <button
                                        type="button"
                                        className="rounded-[18px] bg-slate-100 px-5 py-4 text-lg font-semibold text-slate-950"
                                        onClick={() => addChoice(category.id, item.id, group.id)}
                                      >
                                        Add Choice
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-6">
                                <button
                                  type="button"
                                  className="rounded-[18px] bg-red-50 px-5 py-4 text-lg font-semibold text-red-700"
                                  onClick={() => removeItem(category.id, item.id)}
                                >
                                  Remove Item
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'flyers' && (
                <div className="rounded-[32px] bg-white">
                  <h2 className="text-6xl font-black text-slate-950">Flyers</h2>
                  <p className="mt-6 text-3xl leading-relaxed text-slate-500">
                    Free white digital QR flyer included. Custom flyer previews stay tied to your restaurant branding, category look, and storefront theme.
                  </p>

                  <div className="mt-10 rounded-[28px] bg-slate-50 p-6">
                    <div className="text-3xl font-black text-slate-950">Included digital flyer</div>
                    <div className="mx-auto mt-6 max-w-[440px] rounded-[32px] bg-white p-6 text-center shadow-sm">
                      <div className="text-2xl font-black uppercase tracking-[0.5em] text-blue-600">Scan to Order</div>
                      <div className="mx-auto mt-6 flex h-64 w-64 items-center justify-center rounded-[28px] border-4 border-dashed border-slate-300 text-5xl font-black text-slate-400">
                        QR
                      </div>
                      <div className="mt-6 text-5xl font-black text-slate-950">
                        {restaurant.name || 'Your Store'}
                      </div>
                      <div className="mt-4 text-3xl font-semibold text-slate-500">{storeUrl}</div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-3">
                    <div className="rounded-[24px] border border-slate-200 p-5">
                      <div className="text-2xl font-black text-slate-950">100 Flyers</div>
                      <div className="mt-2 text-xl text-slate-500">$120</div>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 p-5">
                      <div className="text-2xl font-black text-slate-950">250 Flyers</div>
                      <div className="mt-2 text-xl text-slate-500">$250</div>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 p-5">
                      <div className="text-2xl font-black text-slate-950">500 Flyers</div>
                      <div className="mt-2 text-xl text-slate-500">$500</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#f7f9fc] p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Live Storefront Preview
                </div>
                <div className="mt-2 text-4xl font-black text-slate-950">What your customers will see</div>
              </div>

              <Link
                href={restaurant.slug ? `/store/${restaurant.slug}` : '#'}
                prefetch={false}
                className="rounded-[20px] bg-slate-950 px-5 py-4 text-lg font-semibold text-white"
              >
                Open Slug Page
              </Link>
            </div>

            <div className="mt-6">
              <StorePreview restaurant={restaurant} categories={categories} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
