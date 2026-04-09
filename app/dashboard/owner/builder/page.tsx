'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';

type StorefrontTheme = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';
type ImageSource = 'empty' | 'upload' | 'placeholder';
type SectionKey = 'store' | 'branding' | 'theme' | 'menu' | 'flyers';

type RestaurantRow = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  name?: string | null;
  slug?: string | null;
  phone?: string | null;
  address?: string | null;
  hero_image?: string | null;
  logo_image?: string | null;
  storefront_theme?: string | null;
  storefront_language?: string | null;
  order_language?: string | null;
  pickup_enabled?: boolean | null;
  delivery_enabled?: boolean | null;
  delivery_fee?: number | null;
  delivery_radius?: number | null;
  delivery_minimum?: number | null;
  hours?: string | null;
  plan?: string | null;
};

type MenuCategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  image_file: string | null;
  availability: string | null;
  sort_order: number | null;
};

type OptionGroupRow = {
  id: string;
  item_id: string;
  name: string;
  is_required: boolean | null;
  selection_mode: string | null;
  sort_order: number | null;
};

type OptionChoiceRow = {
  id: string;
  option_group_id: string;
  name: string;
  price_delta: number | null;
  sort_order: number | null;
};

type BuilderOptionChoice = {
  id: string;
  name: string;
  price_delta: string;
  sort_order: number;
};

type BuilderOptionGroup = {
  id: string;
  name: string;
  is_required: boolean;
  selection_mode: 'single' | 'multiple';
  sort_order: number;
  choices: BuilderOptionChoice[];
};

type BuilderItem = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: string;
  image_file: string;
  image_source: ImageSource;
  availability: Availability;
  sort_order: number;
  option_groups: BuilderOptionGroup[];
};

type BuilderCategory = {
  id: string;
  name: string;
  sort_order: number;
  items: BuilderItem[];
};

type PlaceholderImage = {
  label: string;
  url: string;
};

type UploadTarget = {
  type: 'hero' | 'logo' | 'item';
  categoryId?: string;
  itemId?: string;
};

const sectionLabels: Record<SectionKey, string> = {
  store: 'Store Setup',
  branding: 'Branding',
  theme: 'Theme & Language',
  menu: 'Menu Builder',
  flyers: 'Flyers',
};

const placeholderLibrary: Record<string, PlaceholderImage[]> = {
  tacos: [
    { label: 'Street tacos', url: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=80' },
    { label: 'Birria plate', url: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=900&q=80' },
  ],
  burgers: [
    { label: 'Loaded burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80' },
    { label: 'Fries combo', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80' },
  ],
  bbq: [
    { label: 'BBQ plate', url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80' },
    { label: 'Smoked ribs', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80' },
  ],
  seafood: [
    { label: 'Shrimp tray', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80' },
    { label: 'Seafood boil', url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=900&q=80' },
  ],
  breakfast: [
    { label: 'Breakfast plate', url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80' },
    { label: 'French toast', url: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80' },
  ],
  default: [
    { label: 'Signature dish', url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80' },
    { label: 'Featured meal', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80' },
  ],
};

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const safeNumberString = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const defaultCategory = (): BuilderCategory => ({
  id: newId(),
  name: 'Featured',
  sort_order: 0,
  items: [],
});

const defaultItem = (categoryId: string): BuilderItem => ({
  id: newId(),
  category_id: categoryId,
  name: '',
  description: '',
  base_price: '',
  image_file: '',
  image_source: 'empty',
  availability: 'available',
  sort_order: 0,
  option_groups: [],
});

const defaultGroup = (): BuilderOptionGroup => ({
  id: newId(),
  name: 'Choose one',
  is_required: false,
  selection_mode: 'single',
  sort_order: 0,
  choices: [],
});

const defaultChoice = (): BuilderOptionChoice => ({
  id: newId(),
  name: 'Option',
  price_delta: '0',
  sort_order: 0,
});

export default function OwnerBuilderPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [userId, setUserId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const [storefrontTheme, setStorefrontTheme] = useState<StorefrontTheme>('light');
  const [storefrontLanguage, setStorefrontLanguage] = useState<LanguageMode>('en');
  const [orderLanguage, setOrderLanguage] = useState<LanguageMode>('en');
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryRadius, setDeliveryRadius] = useState('0');
  const [deliveryMinimum, setDeliveryMinimum] = useState('0');
  const [hours, setHours] = useState('');
  const [plan, setPlan] = useState('starter');
  const [categories, setCategories] = useState<BuilderCategory[]>([defaultCategory()]);
  const [uploadingTarget, setUploadingTarget] = useState<string>('');

  const loadBuilder = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('You must be signed in to use the owner builder.');

      setUserId(user.id);

      const { data: restaurantRows, error: restaurantError } = await supabase
        .from('restaurants')
        .select(
          'id, owner_id, user_id, name, slug, phone, address, hero_image, logo_image, storefront_theme, storefront_language, order_language, pickup_enabled, delivery_enabled, delivery_fee, delivery_radius, delivery_minimum, hours, plan'
        )
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('id', { ascending: true })
        .limit(1);

      if (restaurantError) throw restaurantError;

      const restaurant = (restaurantRows?.[0] as RestaurantRow | undefined) ?? null;

      if (!restaurant) {
        setRestaurantId('');
        setStoreName('');
        setSlug('');
        setPhone('');
        setAddress('');
        setHeroImage('');
        setLogoImage('');
        setStorefrontTheme('light');
        setStorefrontLanguage('en');
        setOrderLanguage('en');
        setPickupEnabled(true);
        setDeliveryEnabled(false);
        setDeliveryFee('0');
        setDeliveryRadius('0');
        setDeliveryMinimum('0');
        setHours('');
        setPlan('starter');
        setCategories([defaultCategory()]);
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
      setStoreName(restaurant.name ?? '');
      setSlug(restaurant.slug ?? '');
      setPhone(restaurant.phone ?? '');
      setAddress(restaurant.address ?? '');
      setHeroImage(restaurant.hero_image ?? '');
      setLogoImage(restaurant.logo_image ?? '');
      setStorefrontTheme(restaurant.storefront_theme === 'dark' ? 'dark' : 'light');
      setStorefrontLanguage(restaurant.storefront_language === 'es' ? 'es' : 'en');
      setOrderLanguage(restaurant.order_language === 'es' ? 'es' : 'en');
      setPickupEnabled(Boolean(restaurant.pickup_enabled ?? true));
      setDeliveryEnabled(Boolean(restaurant.delivery_enabled ?? false));
      setDeliveryFee(String(restaurant.delivery_fee ?? 0));
      setDeliveryRadius(String(restaurant.delivery_radius ?? 0));
      setDeliveryMinimum(String(restaurant.delivery_minimum ?? 0));
      setHours(restaurant.hours ?? '');
      setPlan(restaurant.plan ?? 'starter');

      const { data: categoryRows, error: categoryError } = await supabase
        .from('menu_categories')
        .select('id, restaurant_id, name, sort_order')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order', { ascending: true });

      if (categoryError) throw categoryError;

      const { data: itemRows, error: itemError } = await supabase
        .from('menu_items')
        .select('id, restaurant_id, category_id, name, description, base_price, image_file, availability, sort_order')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order', { ascending: true });

      if (itemError) throw itemError;

      const itemIds = ((itemRows as MenuItemRow[] | null) ?? []).map((item) => item.id);

      let groupRows: OptionGroupRow[] = [];
      let choiceRows: OptionChoiceRow[] = [];

      if (itemIds.length) {
        const { data: fetchedGroups, error: groupError } = await supabase
          .from('menu_option_groups')
          .select('id, item_id, name, is_required, selection_mode, sort_order')
          .in('item_id', itemIds)
          .order('sort_order', { ascending: true });

        if (groupError) throw groupError;
        groupRows = (fetchedGroups as OptionGroupRow[] | null) ?? [];

        const groupIds = groupRows.map((group) => group.id);

        if (groupIds.length) {
          const { data: fetchedChoices, error: choiceError } = await supabase
            .from('menu_option_choices')
            .select('id, option_group_id, name, price_delta, sort_order')
            .in('option_group_id', groupIds)
            .order('sort_order', { ascending: true });

          if (choiceError) throw choiceError;
          choiceRows = (fetchedChoices as OptionChoiceRow[] | null) ?? [];
        }
      }

      const nextCategories: BuilderCategory[] = ((categoryRows as MenuCategoryRow[] | null) ?? []).map((category, categoryIndex) => ({
        id: category.id,
        name: category.name ?? 'Category',
        sort_order: category.sort_order ?? categoryIndex,
        items: ((itemRows as MenuItemRow[] | null) ?? [])
          .filter((item) => item.category_id === category.id)
          .map((item, itemIndex) => ({
            id: item.id,
            category_id: category.id,
            name: item.name ?? '',
            description: item.description ?? '',
            base_price: item.base_price != null ? String(item.base_price) : '',
            image_file: item.image_file ?? '',
            image_source: item.image_file ? 'upload' : 'empty',
            availability: item.availability === 'sold_out' ? 'sold_out' : 'available',
            sort_order: item.sort_order ?? itemIndex,
            option_groups: groupRows
              .filter((group) => group.item_id === item.id)
              .map((group, groupIndex) => ({
                id: group.id,
                name: group.name ?? '',
                is_required: Boolean(group.is_required),
                selection_mode: group.selection_mode === 'multiple' ? 'multiple' : 'single',
                sort_order: group.sort_order ?? groupIndex,
                choices: choiceRows
                  .filter((choice) => choice.option_group_id === group.id)
                  .map((choice, choiceIndex) => ({
                    id: choice.id,
                    name: choice.name ?? '',
                    price_delta: choice.price_delta != null ? String(choice.price_delta) : '0',
                    sort_order: choice.sort_order ?? choiceIndex,
                  })),
              })),
          })),
      }));

      setCategories(nextCategories.length ? nextCategories : [defaultCategory()]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load builder data.');
      setCategories([defaultCategory()]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBuilder();
  }, [loadBuilder]);

  useEffect(() => {
    if (!storeName.trim()) return;
    setSlug((current) => (current.trim() ? current : slugify(storeName)));
  }, [storeName]);

  const storeUrl = useMemo(() => `/store/${slug || 'your-store'}`, [slug]);

  const updateCategory = (categoryId: string, patch: Partial<BuilderCategory>) => {
    setCategories((current) =>
      current.map((category) => (category.id === categoryId ? { ...category, ...patch } : category))
    );
  };

  const addCategory = () => {
    setCategories((current) => [
      ...current,
      {
        id: newId(),
        name: `Category ${current.length + 1}`,
        sort_order: current.length,
        items: [],
      },
    ]);
    setActiveSection('menu');
  };

  const removeCategory = (categoryId: string) => {
    setCategories((current) => {
      const next = current.filter((category) => category.id !== categoryId);
      return next.length ? next.map((category, index) => ({ ...category, sort_order: index })) : [defaultCategory()];
    });
  };

  const addItem = (categoryId: string) => {
    setCategories((current) =>
      current.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: [
                ...category.items,
                {
                  ...defaultItem(categoryId),
                  sort_order: category.items.length,
                },
              ],
            }
      )
    );
  };

  const updateItem = (categoryId: string, itemId: string, patch: Partial<BuilderItem>) => {
    setCategories((current) =>
      current.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            }
      )
    );
  };

  const removeItem = (categoryId: string, itemId: string) => {
    setCategories((current) =>
      current.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items
                .filter((item) => item.id !== itemId)
                .map((item, index) => ({ ...item, sort_order: index })),
            }
      )
    );
  };

  const addGroup = (categoryId: string, itemId: string) => {
    setCategories((current) =>
      current.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      option_groups: [
                        ...item.option_groups,
                        {
                          ...defaultGroup(),
                          sort_order: item.option_groups.length,
                        },
                      ],
                    }
              ),
            }
      )
    );
  };

  const updateGroup = (
    categoryId: string,
    itemId: string,
    groupId: string,
    patch: Partial<BuilderOptionGroup>
  ) => {
    setCategories((current) =>
      current.map((category) =>
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
                        group.id === groupId ? { ...group, ...patch } : group
                      ),
                    }
              ),
            }
      )
    );
  };

  const removeGroup = (categoryId: string, itemId: string, groupId: string) => {
    setCategories((current) =>
      current.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      option_groups: item.option_groups
                        .filter((group) => group.id !== groupId)
                        .map((group, index) => ({ ...group, sort_order: index })),
                    }
              ),
            }
      )
    );
  };

  const addChoice = (categoryId: string, itemId: string, groupId: string) => {
    setCategories((current) =>
      current.map((category) =>
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
                              choices: [
                                ...group.choices,
                                {
                                  ...defaultChoice(),
                                  sort_order: group.choices.length,
                                },
                              ],
                            }
                      ),
                    }
              ),
            }
      )
    );
  };

  const updateChoice = (
    categoryId: string,
    itemId: string,
    groupId: string,
    choiceId: string,
    patch: Partial<BuilderOptionChoice>
  ) => {
    setCategories((current) =>
      current.map((category) =>
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
                                choice.id === choiceId ? { ...choice, ...patch } : choice
                              ),
                            }
                      ),
                    }
              ),
            }
      )
    );
  };

  const removeChoice = (categoryId: string, itemId: string, groupId: string, choiceId: string) => {
    setCategories((current) =>
      current.map((category) =>
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
                              choices: group.choices
                                .filter((choice) => choice.id !== choiceId)
                                .map((choice, index) => ({ ...choice, sort_order: index })),
                            }
                      ),
                    }
              ),
            }
      )
    );
  };

  const applyPlaceholder = (categoryId: string, itemId: string, url: string) => {
    updateItem(categoryId, itemId, {
      image_file: url,
      image_source: 'placeholder',
    });
  };

  const uploadImage = async (file: File, target: UploadTarget) => {
    const bucket = target.type === 'hero' ? 'heroes' : target.type === 'logo' ? 'logos' : 'menu-items';
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId || 'owner'}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const targetKey = target.type === 'item' ? `${target.type}:${target.itemId}` : target.type;

    setUploadingTarget(targetKey);
    setError('');
    setSuccess('');

    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      if (target.type === 'hero') setHeroImage(publicUrl);
      if (target.type === 'logo') setLogoImage(publicUrl);
      if (target.type === 'item' && target.categoryId && target.itemId) {
        updateItem(target.categoryId, target.itemId, {
          image_file: publicUrl,
          image_source: 'upload',
        });
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingTarget('');
    }
  };

  const onImageChange = async (event: ChangeEvent<HTMLInputElement>, target: UploadTarget) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadImage(file, target);
    event.target.value = '';
  };

  const saveBuilder = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('You must be signed in to save.');

      const cleanStoreName = storeName.trim();
      const cleanSlug = slugify(slug || storeName);

      if (!cleanStoreName) throw new Error('Store name is required.');
      if (!cleanSlug) throw new Error('Slug is required.');

      const restaurantPayload = {
        owner_id: user.id,
        user_id: user.id,
        name: cleanStoreName,
        slug: cleanSlug,
        phone: phone.trim(),
        address: address.trim(),
        hero_image: heroImage || null,
        logo_image: logoImage || null,
        storefront_theme: storefrontTheme,
        storefront_language: storefrontLanguage,
        order_language: orderLanguage,
        pickup_enabled: pickupEnabled,
        delivery_enabled: deliveryEnabled,
        delivery_fee: safeNumberString(deliveryFee),
        delivery_radius: safeNumberString(deliveryRadius),
        delivery_minimum: safeNumberString(deliveryMinimum),
        hours: hours.trim(),
        plan,
      };

      let nextRestaurantId = restaurantId;

      if (restaurantId) {
        const { error: updateError } = await supabase
          .from('restaurants')
          .update(restaurantPayload)
          .eq('id', restaurantId);

        if (updateError) throw updateError;
      } else {
        const { data: insertRows, error: insertError } = await supabase
          .from('restaurants')
          .insert(restaurantPayload)
          .select('id')
          .limit(1);

        if (insertError) throw insertError;
        nextRestaurantId = insertRows?.[0]?.id ?? '';
        if (!nextRestaurantId) throw new Error('Restaurant row was not created.');
        setRestaurantId(nextRestaurantId);
      }

      const currentCategories = categories.map((category, categoryIndex) => ({
        ...category,
        sort_order: categoryIndex,
        items: category.items.map((item, itemIndex) => ({
          ...item,
          sort_order: itemIndex,
          option_groups: item.option_groups.map((group, groupIndex) => ({
            ...group,
            sort_order: groupIndex,
            choices: group.choices.map((choice, choiceIndex) => ({
              ...choice,
              sort_order: choiceIndex,
            })),
          })),
        })),
      }));

      await supabase.from('menu_option_choices').delete().eq('option_group_id', '__none__');

      const { data: existingItemsRows } = await supabase
        .from('menu_items')
        .select('id')
        .eq('restaurant_id', nextRestaurantId);
      const existingItemIds = (existingItemsRows ?? []).map((row: { id: string }) => row.id);

      if (existingItemIds.length) {
        const { data: existingGroupsRows } = await supabase
          .from('menu_option_groups')
          .select('id')
          .in('item_id', existingItemIds);
        const existingGroupIds = (existingGroupsRows ?? []).map((row: { id: string }) => row.id);

        if (existingGroupIds.length) {
          const { error: deleteChoicesError } = await supabase
            .from('menu_option_choices')
            .delete()
            .in('option_group_id', existingGroupIds);
          if (deleteChoicesError) throw deleteChoicesError;
        }

        const { error: deleteGroupsError } = await supabase
          .from('menu_option_groups')
          .delete()
          .in('item_id', existingItemIds);
        if (deleteGroupsError) throw deleteGroupsError;
      }

      const { error: deleteItemsError } = await supabase
        .from('menu_items')
        .delete()
        .eq('restaurant_id', nextRestaurantId);
      if (deleteItemsError) throw deleteItemsError;

      const { error: deleteCategoriesError } = await supabase
        .from('menu_categories')
        .delete()
        .eq('restaurant_id', nextRestaurantId);
      if (deleteCategoriesError) throw deleteCategoriesError;

      if (currentCategories.length) {
        const categoryPayload = currentCategories.map((category) => ({
          id: category.id,
          restaurant_id: nextRestaurantId,
          name: category.name.trim() || 'Category',
          sort_order: category.sort_order,
        }));

        const { error: categoryInsertError } = await supabase.from('menu_categories').insert(categoryPayload);
        if (categoryInsertError) throw categoryInsertError;

        const itemPayload = currentCategories.flatMap((category) =>
          category.items.map((item) => ({
            id: item.id,
            restaurant_id: nextRestaurantId,
            category_id: category.id,
            name: item.name.trim() || 'Menu Item',
            description: item.description.trim(),
            base_price: safeNumberString(item.base_price),
            image_file: item.image_file || null,
            availability: item.availability,
            sort_order: item.sort_order,
          }))
        );

        if (itemPayload.length) {
          const { error: itemInsertError } = await supabase.from('menu_items').insert(itemPayload);
          if (itemInsertError) throw itemInsertError;
        }

        const groupPayload = currentCategories.flatMap((category) =>
          category.items.flatMap((item) =>
            item.option_groups.map((group) => ({
              id: group.id,
              item_id: item.id,
              name: group.name.trim() || 'Option Group',
              is_required: group.is_required,
              selection_mode: group.selection_mode,
              sort_order: group.sort_order,
            }))
          )
        );

        if (groupPayload.length) {
          const { error: groupInsertError } = await supabase.from('menu_option_groups').insert(groupPayload);
          if (groupInsertError) throw groupInsertError;
        }

        const choicePayload = currentCategories.flatMap((category) =>
          category.items.flatMap((item) =>
            item.option_groups.flatMap((group) =>
              group.choices.map((choice) => ({
                id: choice.id,
                option_group_id: group.id,
                name: choice.name.trim() || 'Choice',
                price_delta: safeNumberString(choice.price_delta) ?? 0,
                sort_order: choice.sort_order,
              }))
            )
          )
        );

        if (choicePayload.length) {
          const { error: choiceInsertError } = await supabase.from('menu_option_choices').insert(choicePayload);
          if (choiceInsertError) throw choiceInsertError;
        }
      }

      setSlug(cleanSlug);
      setSuccess('Builder saved.');
      await loadBuilder();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save builder data.');
    } finally {
      setSaving(false);
    }
  };

  const previewPrimaryItem = useMemo(() => {
    for (const category of categories) {
      if (category.items.length) return category.items[0];
    }
    return null;
  }, [categories]);

  return (
    <div className="min-h-screen bg-[#f3f5fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[34px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#3f74ea]">Owner Control Center</p>
              <h1 className="mt-4 text-5xl font-black tracking-tight text-[#0d1733] sm:text-6xl">MENUFLOW BUILDER</h1>
              <p className="mt-4 max-w-2xl text-xl leading-10 text-[#6b7280]">
                One trusted source of truth for your store setup, branding, menu, options, and storefront data.
              </p>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-[430px]">
              <div className="rounded-[28px] bg-[#f4f5fb] p-5">
                <p className="text-[15px] font-semibold text-[#0d1733]">Store URL</p>
                <p className="mt-2 break-all text-[18px] font-semibold text-[#7a8090]">{storeUrl}</p>
              </div>
              <button
                type="button"
                onClick={saveBuilder}
                disabled={saving || loading}
                className="rounded-[28px] bg-[#2f67eb] px-6 py-5 text-[18px] font-bold text-white shadow-[0_18px_30px_rgba(47,103,235,0.25)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Builder'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {(Object.keys(sectionLabels) as SectionKey[]).map((key) => {
              const active = activeSection === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={`rounded-[24px] px-7 py-4 text-[17px] font-bold transition ${
                    active ? 'bg-[#0a1536] text-white' : 'bg-[#f4f5fb] text-[#111827]'
                  }`}
                >
                  {sectionLabels[key]}
                </button>
              );
            })}
          </div>

          {error ? (
            <div className="mt-6 rounded-[24px] bg-[#fff1f1] px-6 py-5 text-[18px] font-semibold text-[#a52828]">{error}</div>
          ) : null}
          {success ? (
            <div className="mt-6 rounded-[24px] bg-[#eef9f1] px-6 py-5 text-[18px] font-semibold text-[#166534]">{success}</div>
          ) : null}
        </section>

        {activeSection === 'store' ? (
          <section className="rounded-[34px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-8">
            <h2 className="text-4xl font-black tracking-tight text-[#0d1733]">Store setup</h2>
            <p className="mt-4 max-w-3xl text-xl leading-10 text-[#6b7280]">
              This section controls the restaurant row in your final schema. No legacy fields. No URL paste logic.
            </p>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <Field label="Store name" value={storeName} onChange={setStoreName} placeholder="CJ Moore Kitchen" />
              <Field label="Slug" value={slug} onChange={setSlug} placeholder="cj-moore-kitchen" />
              <Field label="Phone" value={phone} onChange={setPhone} placeholder="(323) 812-7102" />
              <Field label="Address" value={address} onChange={setAddress} placeholder="123 Main St, Los Angeles, CA" />
              <Field label="Delivery fee" value={deliveryFee} onChange={setDeliveryFee} placeholder="0" />
              <Field label="Delivery radius (miles)" value={deliveryRadius} onChange={setDeliveryRadius} placeholder="0" />
              <Field label="Delivery minimum" value={deliveryMinimum} onChange={setDeliveryMinimum} placeholder="0" />
              <Field label="Plan" value={plan} onChange={setPlan} placeholder="starter" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ToggleCard title="Pickup" value={pickupEnabled} onClick={() => setPickupEnabled((value) => !value)} />
              <ToggleCard title="Delivery" value={deliveryEnabled} onClick={() => setDeliveryEnabled((value) => !value)} />
            </div>

            <div className="mt-6">
              <label className="mb-3 block text-[18px] font-bold text-[#0d1733]">Business hours</label>
              <textarea
                value={hours}
                onChange={(event) => setHours(event.target.value)}
                placeholder={'Mon-Fri: 8:00 AM - 8:00 PM\nSat-Sun: 9:00 AM - 6:00 PM'}
                className="min-h-[140px] w-full rounded-[26px] border border-[#e7e9f2] bg-white px-6 py-5 text-[18px] font-medium text-[#111827] outline-none transition placeholder:text-[#a0a5b4] focus:border-[#2f67eb]"
              />
            </div>
          </section>
        ) : null}

        {activeSection === 'branding' ? (
          <section className="rounded-[34px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-8">
            <h2 className="text-4xl font-black tracking-tight text-[#0d1733]">Branding</h2>
            <p className="mt-4 text-xl leading-10 text-[#6b7280]">File upload only. Owners pick images from gallery or files. No image URL paste.</p>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <UploadCard
                title="Hero image"
                imageUrl={heroImage}
                uploading={uploadingTarget === 'hero'}
                onChange={(event) => void onImageChange(event, { type: 'hero' })}
              />
              <UploadCard
                title="Logo image"
                imageUrl={logoImage}
                uploading={uploadingTarget === 'logo'}
                onChange={(event) => void onImageChange(event, { type: 'logo' })}
              />
            </div>
          </section>
        ) : null}

        {activeSection === 'theme' ? (
          <section className="rounded-[34px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-8">
            <h2 className="text-4xl font-black tracking-tight text-[#0d1733]">Theme & language</h2>
            <p className="mt-4 text-xl leading-10 text-[#6b7280]">These controls affect the storefront and storefront preview only. The admin builder stays clean and consistent.</p>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <PickerCard
                title="Storefront theme"
                options={[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                ]}
                selected={storefrontTheme}
                onSelect={(value) => setStorefrontTheme(value as StorefrontTheme)}
              />
              <PickerCard
                title="Storefront language"
                options={[
                  { label: 'EN', value: 'en' },
                  { label: 'ES', value: 'es' },
                ]}
                selected={storefrontLanguage}
                onSelect={(value) => setStorefrontLanguage(value as LanguageMode)}
              />
              <PickerCard
                title="Incoming order language"
                options={[
                  { label: 'EN', value: 'en' },
                  { label: 'ES', value: 'es' },
                ]}
                selected={orderLanguage}
                onSelect={(value) => setOrderLanguage(value as LanguageMode)}
              />
            </div>
          </section>
        ) : null}

        {activeSection === 'menu' ? (
          <section className="rounded-[34px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-[#0d1733]">Menu builder</h2>
                <p className="mt-4 text-xl leading-10 text-[#6b7280]">Built to save categories, items, option groups, and choices into the final clean schema.</p>
              </div>
              <button
                type="button"
                onClick={addCategory}
                className="rounded-[24px] bg-[#f4f5fb] px-6 py-4 text-[18px] font-bold text-[#111827]"
              >
                Add Category
              </button>
            </div>

            <div className="mt-8 space-y-6">
              {categories.map((category) => {
                const categoryKey = category.name.toLowerCase();
                const placeholders =
                  Object.entries(placeholderLibrary).find(([key]) => categoryKey.includes(key))?.[1] ?? placeholderLibrary.default;

                return (
                  <div key={category.id} className="rounded-[28px] border border-[#edf0f7] bg-[#fbfcff] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <label className="mb-3 block text-[16px] font-bold text-[#0d1733]">Category name</label>
                        <input
                          value={category.name}
                          onChange={(event) => updateCategory(category.id, { name: event.target.value })}
                          className="w-full rounded-[22px] border border-[#e7e9f2] bg-white px-5 py-4 text-[18px] font-semibold text-[#111827] outline-none focus:border-[#2f67eb]"
                          placeholder="Tacos"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => addItem(category.id)}
                          className="rounded-[22px] bg-[#0a1536] px-5 py-4 text-[16px] font-bold text-white"
                        >
                          Add Item
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCategory(category.id)}
                          className="rounded-[22px] bg-[#fff1f1] px-5 py-4 text-[16px] font-bold text-[#a52828]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 space-y-5">
                      {category.items.map((item) => (
                        <div key={item.id} className="rounded-[26px] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                          <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
                            <div className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                  label="Item name"
                                  value={item.name}
                                  onChange={(value) => updateItem(category.id, item.id, { name: value })}
                                  placeholder="Birria taco"
                                />
                                <Field
                                  label="Price"
                                  value={item.base_price}
                                  onChange={(value) => updateItem(category.id, item.id, { base_price: value })}
                                  placeholder="12.99"
                                />
                              </div>

                              <div>
                                <label className="mb-3 block text-[16px] font-bold text-[#0d1733]">Description</label>
                                <textarea
                                  value={item.description}
                                  onChange={(event) => updateItem(category.id, item.id, { description: event.target.value })}
                                  placeholder="Fresh food made to order"
                                  className="min-h-[120px] w-full rounded-[22px] border border-[#e7e9f2] bg-white px-5 py-4 text-[18px] font-medium text-[#111827] outline-none placeholder:text-[#a0a5b4] focus:border-[#2f67eb]"
                                />
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItem(category.id, item.id, {
                                      availability: item.availability === 'available' ? 'sold_out' : 'available',
                                    })
                                  }
                                  className={`rounded-[18px] px-5 py-3 text-[15px] font-bold ${
                                    item.availability === 'available'
                                      ? 'bg-[#eef7ee] text-[#166534]'
                                      : 'bg-[#fff1f1] text-[#a52828]'
                                  }`}
                                >
                                  {item.availability === 'available' ? 'Available' : 'Sold Out'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addGroup(category.id, item.id)}
                                  className="rounded-[18px] bg-[#f4f5fb] px-5 py-3 text-[15px] font-bold text-[#111827]"
                                >
                                  Add Option Group
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItem(category.id, item.id)}
                                  className="rounded-[18px] bg-[#fff1f1] px-5 py-3 text-[15px] font-bold text-[#a52828]"
                                >
                                  Delete Item
                                </button>
                              </div>
                            </div>

                            <div className="space-y-4 rounded-[24px] bg-[#fbfcff] p-4">
                              <p className="text-[16px] font-bold text-[#0d1733]">Item image</p>
                              <div className="overflow-hidden rounded-[24px] border border-dashed border-[#d7dceb] bg-[#f2f4fa]">
                                {item.image_file ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.image_file} alt={item.name || 'Menu item'} className="h-56 w-full object-cover" />
                                ) : (
                                  <div className="flex h-56 items-center justify-center text-[20px] font-semibold text-[#81889a]">No image yet</div>
                                )}
                              </div>
                              <label className="flex cursor-pointer items-center justify-center rounded-[18px] bg-[#2f67eb] px-5 py-4 text-center text-[16px] font-bold text-white">
                                {uploadingTarget === `item:${item.id}` ? 'Uploading...' : 'Upload item image'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(event) => void onImageChange(event, { type: 'item', categoryId: category.id, itemId: item.id })}
                                />
                              </label>

                              <div>
                                <p className="mb-3 text-[15px] font-semibold text-[#4b5563]">Quick placeholders</p>
                                <div className="grid grid-cols-2 gap-3">
                                  {placeholders.map((placeholder) => (
                                    <button
                                      key={placeholder.url}
                                      type="button"
                                      onClick={() => applyPlaceholder(category.id, item.id, placeholder.url)}
                                      className="overflow-hidden rounded-[18px] border border-[#e7e9f2] bg-white text-left"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={placeholder.url} alt={placeholder.label} className="h-24 w-full object-cover" />
                                      <div className="px-3 py-2 text-[13px] font-semibold text-[#111827]">{placeholder.label}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {item.option_groups.length ? (
                            <div className="mt-5 space-y-4">
                              {item.option_groups.map((group) => (
                                <div key={group.id} className="rounded-[22px] border border-[#edf0f7] bg-[#fbfcff] p-4">
                                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <Field
                                      label="Group name"
                                      value={group.name}
                                      onChange={(value) => updateGroup(category.id, item.id, group.id, { name: value })}
                                      placeholder="Choose a size"
                                    />
                                    <PickerInline
                                      label="Selection"
                                      selected={group.selection_mode}
                                      options={[
                                        { label: 'Single', value: 'single' },
                                        { label: 'Multiple', value: 'multiple' },
                                      ]}
                                      onSelect={(value) => updateGroup(category.id, item.id, group.id, { selection_mode: value as 'single' | 'multiple' })}
                                    />
                                    <ToggleInline
                                      label="Required"
                                      value={group.is_required}
                                      onToggle={() => updateGroup(category.id, item.id, group.id, { is_required: !group.is_required })}
                                    />
                                    <div className="flex items-end">
                                      <button
                                        type="button"
                                        onClick={() => removeGroup(category.id, item.id, group.id)}
                                        className="w-full rounded-[18px] bg-[#fff1f1] px-4 py-4 text-[15px] font-bold text-[#a52828]"
                                      >
                                        Remove group
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-4 space-y-3">
                                    {group.choices.map((choice) => (
                                      <div key={choice.id} className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
                                        <Field
                                          label="Choice"
                                          value={choice.name}
                                          onChange={(value) => updateChoice(category.id, item.id, group.id, choice.id, { name: value })}
                                          placeholder="Large"
                                        />
                                        <Field
                                          label="Price delta"
                                          value={choice.price_delta}
                                          onChange={(value) => updateChoice(category.id, item.id, group.id, choice.id, { price_delta: value })}
                                          placeholder="0"
                                        />
                                        <div className="flex items-end">
                                          <button
                                            type="button"
                                            onClick={() => removeChoice(category.id, item.id, group.id, choice.id)}
                                            className="w-full rounded-[18px] bg-[#f4f5fb] px-4 py-4 text-[15px] font-bold text-[#111827]"
                                          >
                                            Remove choice
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => addChoice(category.id, item.id, group.id)}
                                      className="rounded-[16px] bg-[#0a1536] px-4 py-3 text-[15px] font-bold text-white"
                                    >
                                      Add choice
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}

                      {!category.items.length ? (
                        <div className="rounded-[22px] border border-dashed border-[#d9dfec] px-5 py-8 text-[17px] font-semibold text-[#7a8090]">
                          No items yet in this category.
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeSection === 'flyers' ? (
          <section className="rounded-[34px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-8">
            <h2 className="text-4xl font-black tracking-tight text-[#0d1733]">Flyers</h2>
            <p className="mt-4 text-xl leading-10 text-[#6b7280]">
              Free white digital QR flyer included. Custom flyer previews stay tied to your restaurant branding, category look, and storefront theme.
            </p>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] bg-[#fbfcff] p-6">
                <p className="text-[20px] font-bold text-[#0d1733]">Included digital flyer</p>
                <div className="mt-5 rounded-[28px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-[14px] font-semibold uppercase tracking-[0.28em] text-[#2f67eb]">Scan to order</p>
                  <p className="mt-4 text-3xl font-black text-[#0d1733]">{storeName || 'Your Store'}</p>
                  <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-[22px] border-2 border-dashed border-[#cfd6e8] text-[18px] font-bold text-[#7a8090]">
                    QR
                  </div>
                  <p className="mt-6 text-[16px] font-semibold text-[#6b7280]">{storeUrl}</p>
                </div>
              </div>
              <div className="rounded-[28px] bg-[#0a1536] p-6 text-white">
                <p className="text-[20px] font-bold">Custom flyer upgrade</p>
                <div className="mt-5 space-y-3 text-[17px] font-semibold text-white/85">
                  <p>100 flyers — $120</p>
                  <p>250 flyers — $250</p>
                  <p>500 flyers — $500</p>
                </div>
                <div className="mt-6 rounded-[24px] bg-white/10 p-5 text-[16px] leading-8 text-white/85">
                  Strong food visuals, bold scan-to-order headline, centered QR, brand-first styling, and category-driven flyer themes.
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[34px] bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-[#0d1733]">Storefront preview</h2>
              <p className="mt-4 max-w-2xl text-xl leading-10 text-[#6b7280]">This preview follows storefront theme and language only.</p>
            </div>
            <Link href={storeUrl} className="rounded-[24px] bg-[#0a1536] px-6 py-5 text-[18px] font-bold text-white">
              Open Slug Page
            </Link>
          </div>

          <div className={`mt-8 overflow-hidden rounded-[30px] border ${storefrontTheme === 'dark' ? 'border-[#111827] bg-[#0a1536] text-white' : 'border-[#edf0f7] bg-[#fbfcff] text-[#111827]'}`}>
            <div className="h-72 overflow-hidden bg-[#e5e7eb]">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt="Hero preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[22px] font-semibold text-[#7a8090]">Hero image preview</div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 overflow-hidden rounded-[26px] bg-[#eef1f8]">
                    {logoImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoImage} alt="Logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[18px] font-bold text-[#111827]">Logo</div>
                    )}
                  </div>
                  <div>
                    <p className="text-4xl font-black">{storeName || 'Your Store'}</p>
                    <p className={`mt-2 text-xl ${storefrontTheme === 'dark' ? 'text-white/70' : 'text-[#6b7280]'}`}>{address || 'Store address'}</p>
                    <p className={`text-xl ${storefrontTheme === 'dark' ? 'text-white/70' : 'text-[#6b7280]'}`}>{phone || 'Store phone'}</p>
                  </div>
                </div>
                <div className={`rounded-[20px] px-5 py-3 text-[18px] font-black ${storefrontTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-[#f4f5fb] text-[#0d1733]'}`}>
                  {storefrontLanguage.toUpperCase()}
                </div>
              </div>

              <div className="mt-6 inline-flex rounded-[20px] bg-[#f4f5fb] px-5 py-3 text-[18px] font-bold text-[#111827]">Featured</div>

              {previewPrimaryItem ? (
                <div className={`mt-6 overflow-hidden rounded-[28px] ${storefrontTheme === 'dark' ? 'bg-white/5' : 'bg-white'} border ${storefrontTheme === 'dark' ? 'border-white/10' : 'border-[#edf0f7]'}`}>
                  <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                    <div className="h-56 overflow-hidden bg-[#e5e7eb]">
                      {previewPrimaryItem.image_file ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewPrimaryItem.image_file} alt={previewPrimaryItem.name || 'Preview item'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[18px] font-semibold text-[#7a8090]">Food image</div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-3xl font-black">{previewPrimaryItem.name || 'Your first menu item'}</p>
                          <p className={`mt-3 text-lg leading-8 ${storefrontTheme === 'dark' ? 'text-white/70' : 'text-[#6b7280]'}`}>
                            {previewPrimaryItem.description || 'Your live storefront preview will populate as soon as you add menu items.'}
                          </p>
                        </div>
                        <p className="text-2xl font-black">{previewPrimaryItem.base_price ? `$${previewPrimaryItem.base_price}` : '$0.00'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`mt-6 rounded-[28px] border border-dashed p-8 text-[20px] font-semibold ${storefrontTheme === 'dark' ? 'border-white/15 text-white/70' : 'border-[#d9dfec] text-[#7a8090]'}`}>
                  Your live storefront preview will populate as soon as you add menu items.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {loading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
          <div className="rounded-[24px] bg-white px-6 py-4 text-[18px] font-bold text-[#0d1733] shadow-xl">Loading builder...</div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-3 block text-[16px] font-bold text-[#0d1733]">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[24px] border border-[#e7e9f2] bg-white px-5 py-4 text-[18px] font-medium text-[#111827] outline-none placeholder:text-[#a0a5b4] focus:border-[#2f67eb]"
      />
    </div>
  );
}

function ToggleCard({
  title,
  value,
  onClick,
}: {
  title: string;
  value: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[28px] border px-6 py-5 text-left transition ${
        value ? 'border-[#2f67eb] bg-[#f7f9ff]' : 'border-[#e7e9f2] bg-white'
      }`}
    >
      <p className="text-[18px] font-black text-[#0d1733]">{title}</p>
      <p className="mt-2 text-[18px] font-medium text-[#6b7280]">{value ? 'Enabled' : 'Disabled'}</p>
    </button>
  );
}

function PickerCard({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="rounded-[28px] bg-[#fbfcff] p-5">
      <p className="text-[18px] font-black text-[#0d1733]">{title}</p>
      <div className="mt-5 flex gap-3">
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`flex-1 rounded-[22px] px-5 py-4 text-[18px] font-bold ${
                active ? 'bg-[#2f67eb] text-white' : 'bg-white text-[#6b7280]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadCard({
  title,
  imageUrl,
  uploading,
  onChange,
}: {
  title: string;
  imageUrl: string;
  uploading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="rounded-[28px] bg-[#fbfcff] p-5">
      <p className="text-[20px] font-black text-[#0d1733]">{title}</p>
      <div className="mt-5 overflow-hidden rounded-[28px] bg-[#eef1f8]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-72 w-full object-cover" />
        ) : (
          <div className="flex h-72 items-center justify-center text-[20px] font-semibold text-[#7a8090]">No image selected</div>
        )}
      </div>
      <label className="mt-5 flex cursor-pointer items-center justify-center rounded-[20px] bg-[#2f67eb] px-5 py-4 text-[17px] font-bold text-white">
        {uploading ? 'Uploading...' : 'Choose image'}
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      </label>
    </div>
  );
}

function PickerInline({
  label,
  selected,
  options,
  onSelect,
}: {
  label: string;
  selected: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-3 block text-[16px] font-bold text-[#0d1733]">{label}</label>
      <div className="flex rounded-[18px] bg-[#f4f5fb] p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`flex-1 rounded-[14px] px-4 py-3 text-[14px] font-bold ${
              selected === option.value ? 'bg-[#2f67eb] text-white' : 'text-[#6b7280]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleInline({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-3 block text-[16px] font-bold text-[#0d1733]">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full rounded-[18px] px-4 py-4 text-[15px] font-bold ${
          value ? 'bg-[#eef7ee] text-[#166534]' : 'bg-[#f4f5fb] text-[#6b7280]'
        }`}
      >
        {value ? 'Required' : 'Optional'}
      </button>
    </div>
  );
}

