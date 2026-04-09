'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type OrderLanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';
type FlyerStyle = 'street' | 'clean' | 'seafood' | 'bbq';

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
  storefront_theme: ThemeMode | null;
  storefront_language: LanguageMode | null;
  order_language: OrderLanguageMode | null;
  pickup_enabled: boolean | null;
  delivery_enabled: boolean | null;
  delivery_fee: number | null;
  delivery_radius: number | null;
  delivery_minimum: number | null;
  hours: string | null;
  plan: string | null;
};

type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price: number;
  image_file: string | null;
  availability: Availability;
  sort_order: number;
};

type OptionGroupRow = {
  id: string;
  item_id: string;
  name: string;
  is_required: boolean;
  selection_mode: 'single' | 'multiple';
  sort_order: number;
};

type OptionChoiceRow = {
  id: string;
  option_group_id: string;
  name: string;
  price_delta: number;
  sort_order: number;
};

type ChoiceForm = {
  id: string;
  name: string;
  price_delta: string;
};

type OptionGroupForm = {
  id: string;
  name: string;
  is_required: boolean;
  selection_mode: 'single' | 'multiple';
  choices: ChoiceForm[];
};

type MenuItemForm = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: string;
  image_file: string;
  availability: Availability;
  placeholder_category: string;
  option_groups: OptionGroupForm[];
};

type CategoryForm = {
  id: string;
  name: string;
};

type BuilderState = {
  restaurantId: string;
  storeName: string;
  slug: string;
  phone: string;
  address: string;
  hero_image: string;
  logo_image: string;
  storefront_theme: ThemeMode;
  storefront_language: LanguageMode;
  order_language: OrderLanguageMode;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  delivery_fee: string;
  delivery_radius: string;
  delivery_minimum: string;
  hours: string;
  plan: string;
  flyer_style: FlyerStyle;
  flyer_quantity: '100' | '250' | '500';
  categories: CategoryForm[];
  items: MenuItemForm[];
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type UserRecord = {
  id: string;
};

const PLACEHOLDER_FILES: Record<string, string[]> = {
  tacos: ['tacos/1.jpg', 'tacos/2.jpg', 'tacos/3.jpg'],
  burgers: ['burgers/1.jpg', 'burgers/2.jpg', 'burgers/3.jpg'],
  wings: ['wings/1.jpg', 'wings/2.jpg', 'wings/3.jpg'],
  seafood: ['seafood/1.jpg', 'seafood/2.jpg', 'seafood/3.jpg'],
  bbq: ['bbq/1.jpg', 'bbq/2.jpg', 'bbq/3.jpg'],
  breakfast: ['breakfast/1.jpg', 'breakfast/2.jpg', 'breakfast/3.jpg'],
  pizza: ['pizza/1.jpg', 'pizza/2.jpg', 'pizza/3.jpg'],
  desserts: ['desserts/1.jpg', 'desserts/2.jpg', 'desserts/3.jpg'],
  drinks: ['drinks/1.jpg', 'drinks/2.jpg', 'drinks/3.jpg'],
  pasta: ['pasta/1.jpg', 'pasta/2.jpg', 'pasta/3.jpg'],
};

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getStoragePublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

function getPlaceholderImages(categoryKey: string): string[] {
  return (PLACEHOLDER_FILES[categoryKey] ?? []).map((filePath) => getStoragePublicUrl('menu-images', filePath));
}

const INITIAL_STATE: BuilderState = {
  restaurantId: '',
  storeName: '',
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
  flyer_style: 'street',
  flyer_quantity: '100',
  categories: [{ id: createId(), name: 'Featured' }],
  items: [],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function money(value: string | number): string {
  const amount = typeof value === 'number' ? value : Number(value || 0);
  return `$${amount.toFixed(2)}`;
}

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildPublicPath(bucket: string, filePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

async function uploadImage(bucket: 'heroes' | 'logos' | 'menu-items', file: File, ownerId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(safeName, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw new Error(error.message || `Failed to upload image to ${bucket}.`);
  }

  return buildPublicPath(bucket, safeName);
}

function builderThemeClasses(): string {
  return 'min-h-screen bg-[#f5f7fb] text-[#111827]';
}

function sectionCard(): string {
  return 'rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)]';
}

function inputClass(): string {
  return 'w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-black/30';
}

function labelClass(): string {
  return 'mb-2 block text-sm font-semibold text-[#111827]';
}

function smallMuted(): string {
  return 'text-sm text-[#6b7280]';
}

export default function OwnerBuilderPage() {
  const [state, setState] = useState<BuilderState>(INITIAL_STATE);
  const [owner, setOwner] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [activeSection, setActiveSection] = useState<'store' | 'branding' | 'theme' | 'menu' | 'flyer'>('store');
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const previewItems = useMemo(() => {
    return state.items
      .filter((item) => item.category_id)
      .sort((a, b) => {
        const aCategoryIndex = state.categories.findIndex((category) => category.id === a.category_id);
        const bCategoryIndex = state.categories.findIndex((category) => category.id === b.category_id);
        if (aCategoryIndex !== bCategoryIndex) return aCategoryIndex - bCategoryIndex;
        return a.name.localeCompare(b.name);
      });
  }, [state.categories, state.items]);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    try {
      setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('You must be signed in to use the owner builder.');

      setOwner({ id: user.id });

      const { data: existingRestaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select(
          `
          id,
          owner_id,
          user_id,
          name,
          slug,
          phone,
          address,
          hero_image,
          logo_image,
          storefront_theme,
          storefront_language,
          order_language,
          pickup_enabled,
          delivery_enabled,
          delivery_fee,
          delivery_radius,
          delivery_minimum,
          hours,
          plan
        `,
        )
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle<RestaurantRow>();

      if (restaurantError) throw restaurantError;

      if (!existingRestaurant) {
        setState(INITIAL_STATE);
        setLoading(false);
        return;
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('id, restaurant_id, name, sort_order')
        .eq('restaurant_id', existingRestaurant.id)
        .order('sort_order', { ascending: true })
        .returns<CategoryRow[]>();

      if (categoriesError) throw categoriesError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, restaurant_id, category_id, name, description, base_price, image_file, availability, sort_order')
        .eq('restaurant_id', existingRestaurant.id)
        .order('sort_order', { ascending: true })
        .returns<MenuItemRow[]>();

      if (itemsError) throw itemsError;

      const itemIds = (itemsData ?? []).map((item) => item.id);

      const { data: optionGroupsData, error: optionGroupsError } = itemIds.length
        ? await supabase
            .from('menu_option_groups')
            .select('id, item_id, name, is_required, selection_mode, sort_order')
            .in('item_id', itemIds)
            .order('sort_order', { ascending: true })
            .returns<OptionGroupRow[]>()
        : { data: [] as OptionGroupRow[], error: null };

      if (optionGroupsError) throw optionGroupsError;

      const optionGroupIds = (optionGroupsData ?? []).map((group) => group.id);

      const { data: optionChoicesData, error: optionChoicesError } = optionGroupIds.length
        ? await supabase
            .from('menu_option_choices')
            .select('id, option_group_id, name, price_delta, sort_order')
            .in('option_group_id', optionGroupIds)
            .order('sort_order', { ascending: true })
            .returns<OptionChoiceRow[]>()
        : { data: [] as OptionChoiceRow[], error: null };

      if (optionChoicesError) throw optionChoicesError;

      const nextState: BuilderState = {
        restaurantId: existingRestaurant.id,
        storeName: existingRestaurant.name ?? '',
        slug: existingRestaurant.slug ?? '',
        phone: existingRestaurant.phone ?? '',
        address: existingRestaurant.address ?? '',
        hero_image: existingRestaurant.hero_image ?? '',
        logo_image: existingRestaurant.logo_image ?? '',
        storefront_theme: existingRestaurant.storefront_theme ?? 'light',
        storefront_language: existingRestaurant.storefront_language ?? 'en',
        order_language: existingRestaurant.order_language ?? 'en',
        pickup_enabled: Boolean(existingRestaurant.pickup_enabled ?? true),
        delivery_enabled: Boolean(existingRestaurant.delivery_enabled ?? false),
        delivery_fee: String(existingRestaurant.delivery_fee ?? 0),
        delivery_radius: String(existingRestaurant.delivery_radius ?? 0),
        delivery_minimum: String(existingRestaurant.delivery_minimum ?? 0),
        hours: existingRestaurant.hours ?? '',
        plan: existingRestaurant.plan ?? 'starter',
        flyer_style: 'street',
        flyer_quantity: '100',
        categories:
          categoriesData && categoriesData.length
            ? categoriesData.map((category) => ({
                id: category.id,
                name: category.name,
              }))
            : [{ id: createId(), name: 'Featured' }],
        items: (itemsData ?? []).map((item) => {
          const itemGroups = (optionGroupsData ?? [])
            .filter((group) => group.item_id === item.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          return {
            id: item.id,
            category_id: item.category_id,
            name: item.name,
            description: item.description ?? '',
            base_price: String(item.base_price ?? 0),
            image_file: item.image_file ?? '',
            availability: item.availability ?? 'available',
            placeholder_category: 'tacos',
            option_groups: itemGroups.map((group) => ({
              id: group.id,
              name: group.name,
              is_required: group.is_required,
              selection_mode: group.selection_mode,
              choices: (optionChoicesData ?? [])
                .filter((choice) => choice.option_group_id === group.id)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((choice) => ({
                  id: choice.id,
                  name: choice.name,
                  price_delta: String(choice.price_delta ?? 0),
                })),
            })),
          };
        }),
      };

      setState(nextState);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to load builder data.');
    } finally {
      setLoading(false);
    }
  }

  function setField<K extends keyof BuilderState>(key: K, value: BuilderState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function updateCategory(id: string, name: string) {
    setState((current) => ({
      ...current,
      categories: current.categories.map((category) => (category.id === id ? { ...category, name } : category)),
    }));
  }

  function addCategory() {
    const category = { id: createId(), name: `Category ${state.categories.length + 1}` };
    setState((current) => ({ ...current, categories: [...current.categories, category] }));
  }

  function deleteCategory(id: string) {
    setState((current) => {
      const categories = current.categories.filter((category) => category.id !== id);
      const fallbackCategoryId = categories[0]?.id ?? createId();
      const safeCategories = categories.length ? categories : [{ id: fallbackCategoryId, name: 'Featured' }];
      return {
        ...current,
        categories: safeCategories,
        items: current.items
          .filter((item) => item.category_id !== id)
          .map((item) => ({
            ...item,
            category_id: safeCategories.some((category) => category.id === item.category_id) ? item.category_id : safeCategories[0].id,
          })),
      };
    });
  }

  function addItem() {
    const firstCategoryId = state.categories[0]?.id ?? createId();
    const item: MenuItemForm = {
      id: createId(),
      category_id: firstCategoryId,
      name: '',
      description: '',
      base_price: '0',
      image_file: '',
      availability: 'available',
      placeholder_category: 'tacos',
      option_groups: [],
    };
    setState((current) => ({ ...current, items: [...current.items, item] }));
  }

  function updateItem(id: string, patch: Partial<MenuItemForm>) {
    setState((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function deleteItem(id: string) {
    setState((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
  }

  function addOptionGroup(itemId: string) {
    const group: OptionGroupForm = {
      id: createId(),
      name: 'New option group',
      is_required: false,
      selection_mode: 'single',
      choices: [
        {
          id: createId(),
          name: 'Choice 1',
          price_delta: '0',
        },
      ],
    };

    setState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              option_groups: [...item.option_groups, group],
            }
          : item,
      ),
    }));
  }

  function updateOptionGroup(itemId: string, groupId: string, patch: Partial<OptionGroupForm>) {
    setState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              option_groups: item.option_groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
            }
          : item,
      ),
    }));
  }

  function deleteOptionGroup(itemId: string, groupId: string) {
    setState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              option_groups: item.option_groups.filter((group) => group.id !== groupId),
            }
          : item,
      ),
    }));
  }

  function addChoice(itemId: string, groupId: string) {
    setState((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          option_groups: item.option_groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  choices: [...group.choices, { id: createId(), name: 'New choice', price_delta: '0' }],
                }
              : group,
          ),
        };
      }),
    }));
  }

  function updateChoice(itemId: string, groupId: string, choiceId: string, patch: Partial<ChoiceForm>) {
    setState((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          option_groups: item.option_groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  choices: group.choices.map((choice) => (choice.id === choiceId ? { ...choice, ...patch } : choice)),
                }
              : group,
          ),
        };
      }),
    }));
  }

  function deleteChoice(itemId: string, groupId: string, choiceId: string) {
    setState((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          option_groups: item.option_groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  choices: group.choices.filter((choice) => choice.id !== choiceId),
                }
              : group,
          ),
        };
      }),
    }));
  }

  async function handleHeroUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!owner) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSaveStatus('saving');
      setSaveMessage('Uploading hero image...');
      const publicUrl = await uploadImage('heroes', file, owner.id);
      setField('hero_image', publicUrl);
      setSaveStatus('idle');
      setSaveMessage('Hero image ready to save.');
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Hero upload failed.');
    } finally {
      event.target.value = '';
    }
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!owner) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSaveStatus('saving');
      setSaveMessage('Uploading logo...');
      const publicUrl = await uploadImage('logos', file, owner.id);
      setField('logo_image', publicUrl);
      setSaveStatus('idle');
      setSaveMessage('Logo ready to save.');
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Logo upload failed.');
    } finally {
      event.target.value = '';
    }
  }

  async function handleMenuItemUpload(itemId: string, event: ChangeEvent<HTMLInputElement>) {
    if (!owner) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSaveStatus('saving');
      setSaveMessage('Uploading menu item image...');
      const publicUrl = await uploadImage('menu-items', file, owner.id);
      updateItem(itemId, { image_file: publicUrl });
      setSaveStatus('idle');
      setSaveMessage('Menu item image ready to save.');
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Menu item upload failed.');
    } finally {
      event.target.value = '';
    }
  }

  function applyPlaceholder(itemId: string, categoryKey: string, image: string) {
    updateItem(itemId, { placeholder_category: categoryKey, image_file: image });
  }

  async function handleSave() {
    if (!owner) return;

    try {
      setSaveStatus('saving');
      setSaveMessage('Saving builder data...');

      const finalSlug = slugify(state.slug || state.storeName);
      if (!state.storeName.trim()) throw new Error('Store name is required.');
      if (!finalSlug) throw new Error('A valid store slug is required.');

      const restaurantPayload = {
        owner_id: owner.id,
        user_id: owner.id,
        name: state.storeName.trim(),
        slug: finalSlug,
        phone: state.phone.trim(),
        address: state.address.trim(),
        hero_image: state.hero_image || null,
        logo_image: state.logo_image || null,
        storefront_theme: state.storefront_theme,
        storefront_language: state.storefront_language,
        order_language: state.order_language,
        pickup_enabled: state.pickup_enabled,
        delivery_enabled: state.delivery_enabled,
        delivery_fee: parseNumber(state.delivery_fee),
        delivery_radius: parseNumber(state.delivery_radius),
        delivery_minimum: parseNumber(state.delivery_minimum),
        hours: state.hours.trim(),
        plan: state.plan || 'starter',
      };

      let restaurantId = state.restaurantId;

      if (restaurantId) {
        const { error: updateError } = await supabase.from('restaurants').update(restaurantPayload).eq('id', restaurantId);
        if (updateError) throw updateError;
      } else {
        const { data: insertedRestaurant, error: insertError } = await supabase
          .from('restaurants')
          .insert(restaurantPayload)
          .select('id')
          .single<{ id: string }>();
        if (insertError) throw insertError;
        restaurantId = insertedRestaurant.id;
      }

      const cleanedCategories = state.categories
        .map((category, index) => ({
          id: category.id,
          restaurant_id: restaurantId,
          name: category.name.trim() || `Category ${index + 1}`,
          sort_order: index,
        }))
        .filter((category) => category.name.trim().length > 0);

      const existingCategoryIds = cleanedCategories.map((category) => category.id);
      const existingItemIds = state.items.map((item) => item.id);

      const { data: previousCategories, error: previousCategoriesError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .returns<Array<{ id: string }>>();
      if (previousCategoriesError) throw previousCategoriesError;

      const removedCategoryIds = (previousCategories ?? [])
        .map((category) => category.id)
        .filter((id) => !existingCategoryIds.includes(id));

      if (removedCategoryIds.length) {
        const { data: removedItems, error: removedItemsSelectError } = await supabase
          .from('menu_items')
          .select('id')
          .in('category_id', removedCategoryIds)
          .returns<Array<{ id: string }>>();
        if (removedItemsSelectError) throw removedItemsSelectError;

        const removedItemIds = (removedItems ?? []).map((item) => item.id);
        if (removedItemIds.length) {
          const { data: removedGroups, error: removedGroupsSelectError } = await supabase
            .from('menu_option_groups')
            .select('id')
            .in('item_id', removedItemIds)
            .returns<Array<{ id: string }>>();
          if (removedGroupsSelectError) throw removedGroupsSelectError;

          const removedGroupIds = (removedGroups ?? []).map((group) => group.id);
          if (removedGroupIds.length) {
            const { error: removeChoicesError } = await supabase
              .from('menu_option_choices')
              .delete()
              .in('option_group_id', removedGroupIds);
            if (removeChoicesError) throw removeChoicesError;
          }

          const { error: removeGroupsError } = await supabase.from('menu_option_groups').delete().in('item_id', removedItemIds);
          if (removeGroupsError) throw removeGroupsError;

          const { error: removeItemsError } = await supabase.from('menu_items').delete().in('id', removedItemIds);
          if (removeItemsError) throw removeItemsError;
        }

        const { error: removeCategoriesError } = await supabase.from('menu_categories').delete().in('id', removedCategoryIds);
        if (removeCategoriesError) throw removeCategoriesError;
      }

      if (cleanedCategories.length) {
        const { error: categoryUpsertError } = await supabase.from('menu_categories').upsert(cleanedCategories);
        if (categoryUpsertError) throw categoryUpsertError;
      }

      const { data: previousItems, error: previousItemsError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .returns<Array<{ id: string }>>();
      if (previousItemsError) throw previousItemsError;

      const removedItemIds = (previousItems ?? [])
        .map((item) => item.id)
        .filter((id) => !existingItemIds.includes(id));

      if (removedItemIds.length) {
        const { data: removedGroups, error: removedGroupsSelectError } = await supabase
          .from('menu_option_groups')
          .select('id')
          .in('item_id', removedItemIds)
          .returns<Array<{ id: string }>>();
        if (removedGroupsSelectError) throw removedGroupsSelectError;

        const removedGroupIds = (removedGroups ?? []).map((group) => group.id);
        if (removedGroupIds.length) {
          const { error: removedChoicesError } = await supabase
            .from('menu_option_choices')
            .delete()
            .in('option_group_id', removedGroupIds);
          if (removedChoicesError) throw removedChoicesError;
        }

        const { error: removedGroupsError } = await supabase.from('menu_option_groups').delete().in('item_id', removedItemIds);
        if (removedGroupsError) throw removedGroupsError;

        const { error: deletedItemsError } = await supabase.from('menu_items').delete().in('id', removedItemIds);
        if (deletedItemsError) throw deletedItemsError;
      }

      const cleanedItems = state.items
        .map((item, index) => ({
          id: item.id,
          restaurant_id: restaurantId,
          category_id: item.category_id,
          name: item.name.trim(),
          description: item.description.trim(),
          base_price: parseNumber(item.base_price),
          image_file: item.image_file || null,
          availability: item.availability,
          sort_order: index,
        }))
        .filter((item) => item.name.length > 0 && item.category_id);

      if (cleanedItems.length) {
        const { error: itemsUpsertError } = await supabase.from('menu_items').upsert(cleanedItems);
        if (itemsUpsertError) throw itemsUpsertError;
      }

      const { data: previousGroups, error: previousGroupsError } = await supabase
        .from('menu_option_groups')
        .select('id, item_id')
        .in('item_id', existingItemIds.length ? existingItemIds : ['00000000-0000-0000-0000-000000000000'])
        .returns<Array<{ id: string; item_id: string }>>();
      if (previousGroupsError && existingItemIds.length) throw previousGroupsError;

      const currentGroups = state.items.flatMap((item) =>
        item.option_groups.map((group, groupIndex) => ({
          id: group.id,
          item_id: item.id,
          name: group.name.trim(),
          is_required: group.is_required,
          selection_mode: group.selection_mode,
          sort_order: groupIndex,
        })),
      );

      const currentGroupIds = currentGroups.map((group) => group.id);
      const removedGroupIds = (previousGroups ?? [])
        .map((group) => group.id)
        .filter((id) => !currentGroupIds.includes(id));

      if (removedGroupIds.length) {
        const { error: removedChoicesError } = await supabase.from('menu_option_choices').delete().in('option_group_id', removedGroupIds);
        if (removedChoicesError) throw removedChoicesError;

        const { error: removedGroupsError } = await supabase.from('menu_option_groups').delete().in('id', removedGroupIds);
        if (removedGroupsError) throw removedGroupsError;
      }

      if (currentGroups.length) {
        const { error: groupsUpsertError } = await supabase
          .from('menu_option_groups')
          .upsert(currentGroups.filter((group) => group.name.length > 0));
        if (groupsUpsertError) throw groupsUpsertError;
      }

      const safeGroupIds = currentGroupIds.length ? currentGroupIds : ['00000000-0000-0000-0000-000000000000'];
      const { data: previousChoices, error: previousChoicesError } = await supabase
        .from('menu_option_choices')
        .select('id, option_group_id')
        .in('option_group_id', safeGroupIds)
        .returns<Array<{ id: string; option_group_id: string }>>();
      if (previousChoicesError && currentGroupIds.length) throw previousChoicesError;

      const currentChoices = state.items.flatMap((item) =>
        item.option_groups.flatMap((group) =>
          group.choices.map((choice, choiceIndex) => ({
            id: choice.id,
            option_group_id: group.id,
            name: choice.name.trim(),
            price_delta: parseNumber(choice.price_delta),
            sort_order: choiceIndex,
          })),
        ),
      );

      const currentChoiceIds = currentChoices.map((choice) => choice.id);
      const removedChoiceIds = (previousChoices ?? [])
        .map((choice) => choice.id)
        .filter((id) => !currentChoiceIds.includes(id));

      if (removedChoiceIds.length) {
        const { error: removedChoiceDeleteError } = await supabase.from('menu_option_choices').delete().in('id', removedChoiceIds);
        if (removedChoiceDeleteError) throw removedChoiceDeleteError;
      }

      if (currentChoices.length) {
        const { error: choicesUpsertError } = await supabase
          .from('menu_option_choices')
          .upsert(currentChoices.filter((choice) => choice.name.length > 0));
        if (choicesUpsertError) throw choicesUpsertError;
      }

      setField('restaurantId', restaurantId);
      setField('slug', finalSlug);
      setSaveStatus('saved');
      setSaveMessage('Builder data saved successfully.');

      await bootstrap();
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save builder data.');
    }
  }

  if (loading) {
    return (
      <div className={`${builderThemeClasses()} flex items-center justify-center px-5`}>
        <div className="rounded-[28px] border border-black/5 bg-white px-8 py-7 text-center shadow-[0_10px_30px_rgba(17,24,39,0.06)]">
          <div className="text-lg font-semibold">Loading MenuFlow Builder...</div>
          <p className="mt-2 text-sm text-[#6b7280]">Pulling your saved store data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={builderThemeClasses()}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 pb-12 pt-4 lg:px-6">
        <header className="rounded-[30px] border border-black/5 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)] lg:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">Owner control center</div>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#111827]">MENUFLOW BUILDER</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#6b7280]">
                One trusted source of truth for your store setup, branding, menu, options, and storefront data.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-[#f3f6fb] px-4 py-3 text-sm">
                <div className="font-semibold text-[#111827]">Store URL</div>
                <div className="text-[#6b7280]">/store/{state.slug || slugify(state.storeName) || 'your-store'}</div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="rounded-2xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition hover:translate-y-[-1px]"
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Builder'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['store', 'branding', 'theme', 'menu', 'flyer'] as const).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeSection === section ? 'bg-[#111827] text-white' : 'bg-[#f3f6fb] text-[#111827]'
                }`}
              >
                {section === 'store' && 'Store Setup'}
                {section === 'branding' && 'Branding'}
                {section === 'theme' && 'Theme & Language'}
                {section === 'menu' && 'Menu Builder'}
                {section === 'flyer' && 'Flyers'}
              </button>
            ))}
          </div>

          {saveMessage ? (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                saveStatus === 'error'
                  ? 'bg-[#fef2f2] text-[#991b1b]'
                  : saveStatus === 'saved'
                    ? 'bg-[#ecfdf5] text-[#166534]'
                    : 'bg-[#eff6ff] text-[#1d4ed8]'
              }`}
            >
              {saveMessage}
            </div>
          ) : null}
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-6">
            {activeSection === 'store' && (
              <section className={sectionCard()}>
                <div className="mb-5">
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-[#111827]">Store setup</h2>
                  <p className={`mt-2 ${smallMuted()}`}>
                    This section controls the restaurant row in your final schema. No legacy fields. No URL paste logic.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass()}>Store name</label>
                    <input
                      className={inputClass()}
                      value={state.storeName}
                      onChange={(event) => {
                        const nextName = event.target.value;
                        setState((current) => ({
                          ...current,
                          storeName: nextName,
                          slug: current.slug && current.slug !== slugify(current.storeName) ? current.slug : slugify(nextName),
                        }));
                      }}
                      placeholder="CJ Moore Kitchen"
                    />
                  </div>

                  <div>
                    <label className={labelClass()}>Slug</label>
                    <input
                      className={inputClass()}
                      value={state.slug}
                      onChange={(event) => setField('slug', slugify(event.target.value))}
                      placeholder="cj-moore-kitchen"
                    />
                  </div>

                  <div>
                    <label className={labelClass()}>Phone</label>
                    <input className={inputClass()} value={state.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="(323) 812-7102" />
                  </div>

                  <div>
                    <label className={labelClass()}>Address</label>
                    <input className={inputClass()} value={state.address} onChange={(event) => setField('address', event.target.value)} placeholder="123 Main St, Los Angeles, CA" />
                  </div>

                  <div>
                    <label className={labelClass()}>Delivery fee</label>
                    <input className={inputClass()} type="number" min="0" step="0.01" value={state.delivery_fee} onChange={(event) => setField('delivery_fee', event.target.value)} />
                  </div>

                  <div>
                    <label className={labelClass()}>Delivery radius (miles)</label>
                    <input className={inputClass()} type="number" min="0" step="0.1" value={state.delivery_radius} onChange={(event) => setField('delivery_radius', event.target.value)} />
                  </div>

                  <div>
                    <label className={labelClass()}>Delivery minimum</label>
                    <input className={inputClass()} type="number" min="0" step="0.01" value={state.delivery_minimum} onChange={(event) => setField('delivery_minimum', event.target.value)} />
                  </div>

                  <div>
                    <label className={labelClass()}>Plan</label>
                    <select className={inputClass()} value={state.plan} onChange={(event) => setField('plan', event.target.value)}>
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setField('pickup_enabled', !state.pickup_enabled)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      state.pickup_enabled ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-black/10 bg-white'
                    }`}
                  >
                    <div className="text-sm font-bold">Pickup</div>
                    <div className={`mt-1 ${smallMuted()}`}>{state.pickup_enabled ? 'Enabled' : 'Disabled'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setField('delivery_enabled', !state.delivery_enabled)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      state.delivery_enabled ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-black/10 bg-white'
                    }`}
                  >
                    <div className="text-sm font-bold">Delivery</div>
                    <div className={`mt-1 ${smallMuted()}`}>{state.delivery_enabled ? 'Enabled' : 'Disabled'}</div>
                  </button>
                </div>

                <div className="mt-5">
                  <label className={labelClass()}>Business hours</label>
                  <textarea
                    className={`${inputClass()} min-h-[120px] resize-none`}
                    value={state.hours}
                    onChange={(event) => setField('hours', event.target.value)}
                    placeholder={`Mon-Fri: 8:00 AM - 8:00 PM\nSat-Sun: 9:00 AM - 6:00 PM`}
                  />
                </div>
              </section>
            )}

            {activeSection === 'branding' && (
              <section className={sectionCard()}>
                <div className="mb-5">
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-[#111827]">Branding</h2>
                  <p className={`mt-2 ${smallMuted()}`}>Gallery/file uploads only. No image URLs anywhere in this builder.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-dashed border-black/10 bg-[#f9fafb] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold">Hero image</div>
                        <div className={smallMuted()}>Top storefront image</div>
                      </div>
                      <button type="button" onClick={() => heroInputRef.current?.click()} className="rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                        Upload Hero
                      </button>
                      <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
                    </div>
                    <div className="overflow-hidden rounded-[20px] bg-[#e5e7eb]">
                      {state.hero_image ? (
                        <img src={state.hero_image} alt="Hero preview" className="h-[280px] w-full object-cover" />
                      ) : (
                        <div className="flex h-[280px] items-center justify-center text-sm text-[#6b7280]">Upload a hero image from your device</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-dashed border-black/10 bg-[#f9fafb] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold">Logo</div>
                        <div className={smallMuted()}>Visible on the public storefront</div>
                      </div>
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                        Upload Logo
                      </button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </div>
                    <div className="overflow-hidden rounded-[20px] bg-[#e5e7eb]">
                      {state.logo_image ? (
                        <img src={state.logo_image} alt="Logo preview" className="h-[280px] w-full object-contain bg-white p-6" />
                      ) : (
                        <div className="flex h-[280px] items-center justify-center text-sm text-[#6b7280]">Upload a logo from your device</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'theme' && (
              <section className={sectionCard()}>
                <div className="mb-5">
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-[#111827]">Theme & language</h2>
                  <p className={`mt-2 ${smallMuted()}`}>These controls affect the public storefront and preview, not the admin builder shell.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={labelClass()}>Storefront theme</label>
                    <select className={inputClass()} value={state.storefront_theme} onChange={(event) => setField('storefront_theme', event.target.value as ThemeMode)}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass()}>Storefront default language</label>
                    <select className={inputClass()} value={state.storefront_language} onChange={(event) => setField('storefront_language', event.target.value as LanguageMode)}>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass()}>Owner order language</label>
                    <select className={inputClass()} value={state.order_language} onChange={(event) => setField('order_language', event.target.value as OrderLanguageMode)}>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'menu' && (
              <section className={sectionCard()}>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-[-0.03em] text-[#111827]">Menu builder</h2>
                    <p className={`mt-2 ${smallMuted()}`}>Built to save categories, items, option groups, and choices into the final clean schema.</p>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={addCategory} className="rounded-2xl bg-[#f3f6fb] px-4 py-3 text-sm font-semibold text-[#111827]">
                      Add Category
                    </button>
                    <button type="button" onClick={addItem} className="rounded-2xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white">
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="rounded-[24px] border border-black/5 bg-[#f9fafb] p-4">
                    <div className="mb-3 text-sm font-bold">Categories</div>
                    <div className="grid gap-3">
                      {state.categories.map((category) => (
                        <div key={category.id} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                          <input className={inputClass()} value={category.name} onChange={(event) => updateCategory(category.id, event.target.value)} />
                          <button type="button" onClick={() => deleteCategory(category.id)} className="rounded-2xl bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#be123c]">
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-5">
                    {state.items.map((item, itemIndex) => (
                      <div key={item.id} className="rounded-[26px] border border-black/5 bg-[#f9fafb] p-4 shadow-[0_10px_30px_rgba(17,24,39,0.04)]">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-lg font-black tracking-[-0.03em] text-[#111827]">Item {itemIndex + 1}</div>
                            <div className={smallMuted()}>Saved to menu_items using base_price, image_file, and availability only.</div>
                          </div>
                          <button type="button" onClick={() => deleteItem(item.id)} className="rounded-2xl bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#be123c]">
                            Delete Item
                          </button>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <label className={labelClass()}>Category</label>
                            <select className={inputClass()} value={item.category_id} onChange={(event) => updateItem(item.id, { category_id: event.target.value })}>
                              {state.categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass()}>Availability</label>
                            <select className={inputClass()} value={item.availability} onChange={(event) => updateItem(item.id, { availability: event.target.value as Availability })}>
                              <option value="available">Available</option>
                              <option value="sold_out">Sold Out</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass()}>Item name</label>
                            <input className={inputClass()} value={item.name} onChange={(event) => updateItem(item.id, { name: event.target.value })} placeholder="Shrimp Taco Plate" />
                          </div>
                          <div>
                            <label className={labelClass()}>Base price</label>
                            <input className={inputClass()} type="number" min="0" step="0.01" value={item.base_price} onChange={(event) => updateItem(item.id, { base_price: event.target.value })} />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className={labelClass()}>Description</label>
                          <textarea className={`${inputClass()} min-h-[110px] resize-none`} value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} placeholder="Seasoned shrimp, cabbage, sauce, and handmade tortillas." />
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                          <div className="rounded-[22px] border border-black/5 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-bold">Item image</div>
                                <div className={smallMuted()}>Upload from gallery or files</div>
                              </div>
                              <label className="cursor-pointer rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleMenuItemUpload(item.id, event)} />
                              </label>
                            </div>
                            <div className="overflow-hidden rounded-[18px] bg-[#e5e7eb]">
                              {item.image_file ? (
                                <img src={item.image_file} alt={item.name || 'Menu item'} className="h-[220px] w-full object-cover" />
                              ) : (
                                <div className="flex h-[220px] items-center justify-center text-sm text-[#6b7280]">No item image yet</div>
                              )}
                            </div>
                          </div>

                          <div className="rounded-[22px] border border-black/5 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-bold">Food placeholders</div>
                                <div className={smallMuted()}>Quick fill for demos and starter stores</div>
                              </div>
                              <select className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" value={item.placeholder_category} onChange={(event) => updateItem(item.id, { placeholder_category: event.target.value })}>
                                {Object.keys(PLACEHOLDER_FILES).map((key) => (
                                  <option key={key} value={key}>
                                    {key}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {(getPlaceholderImages(item.placeholder_category)).map((image) => (
                                <button key={image} type="button" onClick={() => applyPlaceholder(item.id, item.placeholder_category, image)} className="overflow-hidden rounded-2xl border border-black/5">
                                  <img src={image} alt="Placeholder option" className="h-[110px] w-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 rounded-[22px] border border-black/5 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold">Option groups</div>
                              <div className={smallMuted()}>Required choices, extras, proteins, removals, sizes, and more.</div>
                            </div>
                            <button type="button" onClick={() => addOptionGroup(item.id)} className="rounded-xl bg-[#f3f6fb] px-4 py-2 text-sm font-semibold text-[#111827]">
                              Add Group
                            </button>
                          </div>

                          <div className="grid gap-4">
                            {item.option_groups.map((group) => (
                              <div key={group.id} className="rounded-[20px] border border-black/5 bg-[#f9fafb] p-4">
                                <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_auto] lg:items-center">
                                  <input className={inputClass()} value={group.name} onChange={(event) => updateOptionGroup(item.id, group.id, { name: event.target.value })} placeholder="Choose your protein" />
                                  <select className={inputClass()} value={group.selection_mode} onChange={(event) => updateOptionGroup(item.id, group.id, { selection_mode: event.target.value as 'single' | 'multiple' })}>
                                    <option value="single">Single select</option>
                                    <option value="multiple">Multi select</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => updateOptionGroup(item.id, group.id, { is_required: !group.is_required })}
                                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                                      group.is_required ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-white text-[#111827] border border-black/10'
                                    }`}
                                  >
                                    {group.is_required ? 'Required' : 'Optional'}
                                  </button>
                                  <button type="button" onClick={() => deleteOptionGroup(item.id, group.id)} className="rounded-2xl bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#be123c]">
                                    Delete
                                  </button>
                                </div>

                                <div className="mt-4 grid gap-3">
                                  {group.choices.map((choice) => (
                                    <div key={choice.id} className="grid gap-3 md:grid-cols-[1fr_160px_auto] md:items-center">
                                      <input className={inputClass()} value={choice.name} onChange={(event) => updateChoice(item.id, group.id, choice.id, { name: event.target.value })} placeholder="Add cheese" />
                                      <input className={inputClass()} type="number" step="0.01" value={choice.price_delta} onChange={(event) => updateChoice(item.id, group.id, choice.id, { price_delta: event.target.value })} placeholder="0.00" />
                                      <button type="button" onClick={() => deleteChoice(item.id, group.id, choice.id)} className="rounded-2xl bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#be123c]">
                                        Delete
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button type="button" onClick={() => addChoice(item.id, group.id)} className="mt-4 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white">
                                  Add Choice
                                </button>
                              </div>
                            ))}

                            {!item.option_groups.length ? <div className={smallMuted()}>No option groups yet.</div> : null}
                          </div>
                        </div>
                      </div>
                    ))}

                    {!state.items.length ? (
                      <div className="rounded-[24px] border border-dashed border-black/10 bg-[#f9fafb] px-5 py-8 text-center text-sm text-[#6b7280]">
                        No menu items yet. Tap <span className="font-semibold text-[#111827]">Add Item</span> to start building the store menu.
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'flyer' && (
              <section className={sectionCard()}>
                <div className="mb-5">
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-[#111827]">Flyers</h2>
                  <p className={`mt-2 ${smallMuted()}`}>Free white QR flyer included. Custom flyer preview reacts to your current store build.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass()}>Flyer style</label>
                    <select className={inputClass()} value={state.flyer_style} onChange={(event) => setField('flyer_style', event.target.value as FlyerStyle)}>
                      <option value="street">Street</option>
                      <option value="clean">Clean</option>
                      <option value="seafood">Seafood</option>
                      <option value="bbq">BBQ</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass()}>Quantity</label>
                    <select className={inputClass()} value={state.flyer_quantity} onChange={(event) => setField('flyer_quantity', event.target.value as '100' | '250' | '500')}>
                      <option value="100">100 - $120</option>
                      <option value="250">250 - $250</option>
                      <option value="500">500 - $500</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_rgba(17,24,39,0.04)]">
                    <div className="mb-3 text-sm font-bold">Free white QR flyer</div>
                    <div className="rounded-[24px] border border-black/10 bg-white p-5">
                      <div className="text-xs font-bold uppercase tracking-[0.28em] text-[#2563eb]">Free included flyer</div>
                      <div className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#111827]">SCAN TO ORDER</div>
                      <div className="mt-2 text-sm text-[#6b7280]">{state.storeName || 'Your Store Name'}</div>
                      <div className="mt-6 flex aspect-square w-[170px] items-center justify-center rounded-[24px] border border-black/10 text-center text-xs text-[#6b7280]">
                        QR Preview
                      </div>
                      <div className="mt-5 text-sm font-semibold text-[#111827]">/store/{state.slug || slugify(state.storeName) || 'your-store'}</div>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[#111827] p-4 text-white shadow-[0_10px_30px_rgba(17,24,39,0.12)]">
                    <div className="mb-3 text-sm font-bold">Custom flyer preview</div>
                    <div className="overflow-hidden rounded-[24px] bg-black/20">
                      {state.hero_image ? <img src={state.hero_image} alt="Flyer hero" className="h-[200px] w-full object-cover" /> : <div className="flex h-[200px] items-center justify-center text-sm text-white/70">Hero preview</div>}
                    </div>
                    <div className="mt-4 text-xs font-bold uppercase tracking-[0.28em] text-[#93c5fd]">{state.flyer_style} flyer</div>
                    <div className="mt-2 text-3xl font-black tracking-[-0.04em]">Scan to order</div>
                    <div className="mt-2 text-white/80">{state.storeName || 'Your restaurant'} • {state.flyer_quantity} flyers</div>
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                      {previewItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="min-w-[120px] overflow-hidden rounded-[18px] bg-white/10">
                          <img src={item.image_file || getPlaceholderImages(item.placeholder_category)?.[0] || ''} alt={item.name} className="h-[95px] w-full object-cover" />
                          <div className="p-3">
                            <div className="text-sm font-semibold">{item.name || 'Menu item'}</div>
                            <div className="mt-1 text-xs text-white/70">{money(item.base_price)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <section className={`${sectionCard()} sticky top-4`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-[#111827]">Storefront preview</h2>
                  <p className={`mt-2 ${smallMuted()}`}>This preview follows storefront theme and language only.</p>
                </div>
                <Link href={`/store/${state.slug || slugify(state.storeName) || 'your-store'}`} className="rounded-2xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white">
                  Open Slug Page
                </Link>
              </div>

              <div className={`overflow-hidden rounded-[30px] border ${state.storefront_theme === 'dark' ? 'border-white/10 bg-[#050816] text-white' : 'border-black/10 bg-white text-[#111827]'}`}>
                <div className="relative h-[240px] w-full overflow-hidden">
                  {state.hero_image ? (
                    <img src={state.hero_image} alt="Store hero" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`flex h-full items-center justify-center ${state.storefront_theme === 'dark' ? 'bg-[#111827]' : 'bg-[#e5e7eb]'} text-sm ${state.storefront_theme === 'dark' ? 'text-white/70' : 'text-[#6b7280]'}`}>
                      Hero image preview
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ${state.storefront_theme === 'dark' ? 'bg-white/10' : 'bg-[#f3f6fb]'}`}>
                        {state.logo_image ? <img src={state.logo_image} alt="Store logo" className="h-full w-full object-contain p-2" /> : <span className="text-xs">Logo</span>}
                      </div>
                      <div>
                        <div className="text-xl font-black tracking-[-0.03em]">{state.storeName || 'Your Store'}</div>
                        <div className={`mt-1 text-sm ${state.storefront_theme === 'dark' ? 'text-white/70' : 'text-[#6b7280]'}`}>{state.address || 'Store address'}</div>
                        <div className={`mt-1 text-sm ${state.storefront_theme === 'dark' ? 'text-white/70' : 'text-[#6b7280]'}`}>{state.phone || 'Store phone'}</div>
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] ${state.storefront_theme === 'dark' ? 'bg-white/10 text-white' : 'bg-[#f3f6fb] text-[#111827]'}`}>
                      {state.storefront_language.toUpperCase()}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {state.categories.map((category) => (
                      <div key={category.id} className={`rounded-full px-3 py-2 text-xs font-semibold ${state.storefront_theme === 'dark' ? 'bg-white/10 text-white' : 'bg-[#f3f6fb] text-[#111827]'}`}>
                        {category.name}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3">
                    {previewItems.slice(0, 4).map((item) => (
                      <div key={item.id} className={`overflow-hidden rounded-[22px] border ${state.storefront_theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/5 bg-[#f9fafb]'}`}>
                        <div className="grid grid-cols-[92px_1fr] gap-0">
                          {item.image_file ? (
                            <img src={item.image_file} alt={item.name} className="h-[92px] w-full object-cover" />
                          ) : (
                            <div className={`flex h-[92px] items-center justify-center text-xs ${state.storefront_theme === 'dark' ? 'bg-white/10 text-white/60' : 'bg-[#e5e7eb] text-[#6b7280]'}`}>
                              No image
                            </div>
                          )}
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-bold">{item.name || 'Menu item'}</div>
                                <div className={`mt-1 line-clamp-2 text-xs ${state.storefront_theme === 'dark' ? 'text-white/70' : 'text-[#6b7280]'}`}>{item.description || 'Item description shows here.'}</div>
                              </div>
                              <div className="text-sm font-bold">{money(item.base_price)}</div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.option_groups.slice(0, 2).map((group) => (
                                <div key={group.id} className={`rounded-full px-2 py-1 text-[10px] font-semibold ${state.storefront_theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white text-[#111827]'}`}>
                                  {group.name}
                                </div>
                              ))}
                              <div className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.availability === 'available' ? 'bg-[#ecfdf5] text-[#166534]' : 'bg-[#fff1f2] text-[#be123c]'}`}>
                                {item.availability === 'available' ? 'Available' : 'Sold Out'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!previewItems.length ? (
                      <div className={`rounded-[22px] border border-dashed p-4 text-sm ${state.storefront_theme === 'dark' ? 'border-white/10 text-white/70' : 'border-black/10 text-[#6b7280]'}`}>
                        Your live storefront preview will populate as soon as you add menu items.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
