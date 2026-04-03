'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type OrderLanguage = 'EN' | 'ES';
type StorefrontLanguage = 'en' | 'es';

type RestaurantRow = {
  id: string;
  owner_id?: string | null;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hero_image?: string | null;
  logo_image?: string | null;
  storefront_theme?: ThemeMode | null;
  order_language?: string | null;
  storefront_language?: string | null;
  pickup_enabled?: boolean | null;
  delivery_enabled?: boolean | null;
  delivery_fee?: number | null;
  delivery_radius?: number | null;
  delivery_minimum?: number | null;
};

type CategoryRow = {
  id: string;
  restaurant_id?: string;
  name?: string | null;
  sort_order?: number | null;
};

type ItemRow = {
  id: string;
  restaurant_id?: string;
  category_id?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  base_price?: number | null;
  image_url?: string | null;
  availability?: string | null;
  is_available?: boolean | null;
  sort_order?: number | null;
};

type OptionGroupRow = {
  id: string;
  item_id?: string | null;
  name?: string | null;
  is_required?: boolean | null;
  is_multiple?: boolean | null;
  selection_mode?: string | null;
  sort_order?: number | null;
};

type OptionChoiceRow = {
  id: string;
  option_group_id?: string | null;
  name?: string | null;
  price?: number | null;
  price_delta?: number | null;
  sort_order?: number | null;
};

type BuilderCategory = {
  id: string;
  name: string;
  sort_order: number;
  items: BuilderItem[];
};

type BuilderItem = {
  id: string;
  category_id: string;
  name: string;
  base_price: string;
  description: string;
  image_url: string;
  availability: 'available' | 'sold_out';
  option_groups: BuilderOptionGroup[];
};

type BuilderOptionGroup = {
  id: string;
  name: string;
  presetType: 'protein' | 'size' | 'drink' | 'extras' | 'removals' | 'custom';
  required: boolean;
  selection: 'single' | 'multiple';
  options: BuilderOption[];
};

type BuilderOption = {
  id: string;
  name: string;
  price: string;
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function money(value: string | number | null | undefined) {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.replace(/[^0-9.-]/g, ''))
      : 0;

  if (!Number.isFinite(num)) return '$0';
  return `$${num.toFixed(2).replace(/\.00$/, '')}`;
}

function sanitizeNumberInput(value: string) {
  return value.replace(/[^0-9.]/g, '');
}

function getPresetOptions(type: BuilderOptionGroup['presetType']) {
  if (type === 'protein') {
    return [
      { name: 'Chicken', price: '0' },
      { name: 'Beef', price: '0' },
      { name: 'Shrimp', price: '2' },
    ];
  }

  if (type === 'size') {
    return [
      { name: 'Small', price: '0' },
      { name: 'Medium', price: '2' },
      { name: 'Large', price: '4' },
    ];
  }

  if (type === 'drink') {
    return [
      { name: 'Coke', price: '0' },
      { name: 'Sprite', price: '0' },
      { name: 'Water', price: '0' },
    ];
  }

  if (type === 'extras') {
    return [
      { name: 'Extra Cheese', price: '1' },
      { name: 'Extra Sauce', price: '1' },
      { name: 'Avocado', price: '2' },
    ];
  }

  if (type === 'removals') {
    return [
      { name: 'No Onion', price: '0' },
      { name: 'No Tomato', price: '0' },
      { name: 'No Sauce', price: '0' },
    ];
  }

  return [{ name: 'Option 1', price: '0' }];
}

export default function OwnerBuilderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [orderLanguage, setOrderLanguage] = useState<OrderLanguage>('EN');
  const [storefrontLanguage, setStorefrontLanguage] = useState<StorefrontLanguage>('en');

  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryRadius, setDeliveryRadius] = useState('5');
  const [deliveryMinimum, setDeliveryMinimum] = useState('0');

  const [categories, setCategories] = useState<BuilderCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [previewItemId, setPreviewItemId] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function loadBuilder() {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace('/login');
          return;
        }

        if (!active) return;
        setOwnerId(user.id);

        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select(
            `
              id,
              owner_id,
              name,
              slug,
              phone,
              address,
              hero_image,
              logo_image,
              storefront_theme,
              order_language,
              storefront_language,
              pickup_enabled,
              delivery_enabled,
              delivery_fee,
              delivery_radius,
              delivery_minimum
            `
          )
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (restaurantError) throw restaurantError;
        if (!active) return;

        let currentRestaurantId: string | null = null;

        if (restaurant) {
          const row = restaurant as RestaurantRow;
          currentRestaurantId = row.id;
          setRestaurantId(row.id);
          setName(row.name || '');
          setSlug(row.slug || '');
          setPhone(row.phone || '');
          setAddress(row.address || '');
          setHeroImage(row.hero_image || '');
          setLogoImage(row.logo_image || '');
          setTheme((row.storefront_theme as ThemeMode) || 'light');
          setOrderLanguage(
            (row.order_language || 'EN').toString().toUpperCase() === 'ES' ? 'ES' : 'EN'
          );
          setStorefrontLanguage((row.storefront_language || 'en') === 'es' ? 'es' : 'en');
          setPickupEnabled(row.pickup_enabled ?? true);
          setDeliveryEnabled(row.delivery_enabled ?? false);
          setDeliveryFee(String(row.delivery_fee ?? 0));
          setDeliveryRadius(String(row.delivery_radius ?? 5));
          setDeliveryMinimum(String(row.delivery_minimum ?? 0));
        }

        if (currentRestaurantId) {
          await loadMenuBuilder(currentRestaurantId, active);
        } else {
          const starterCategoryId = uid('cat');
          const starterItemId = uid('item');
          const starter = [
            {
              id: starterCategoryId,
              name: 'Featured',
              sort_order: 0,
              items: [
                {
                  id: starterItemId,
                  category_id: starterCategoryId,
                  name: 'Sample Item',
                  base_price: '12',
                  description: 'Tap to edit this item.',
                  image_url: '',
                  availability: 'available' as const,
                  option_groups: [],
                },
              ],
            },
          ];
          setCategories(starter);
          setSelectedCategoryId(starterCategoryId);
          setSelectedItemId(starterItemId);
          setPreviewItemId(starterItemId);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Could not load builder.');
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadMenuBuilder(currentRestaurantId: string, activeState: boolean) {
      const { data: categoryData } = await supabase
        .from('menu_categories')
        .select('id, restaurant_id, name, sort_order')
        .eq('restaurant_id', currentRestaurantId)
        .order('sort_order', { ascending: true });

      const { data: itemData } = await supabase
        .from('menu_items')
        .select(
          'id, restaurant_id, category_id, name, description, price, base_price, image_url, availability, is_available, sort_order'
        )
        .eq('restaurant_id', currentRestaurantId)
        .order('sort_order', { ascending: true });

      const itemIds = ((itemData || []) as ItemRow[]).map((item) => item.id);

      let groupData: OptionGroupRow[] = [];
      let choiceData: OptionChoiceRow[] = [];

      if (itemIds.length) {
        const { data: groups } = await supabase
          .from('menu_option_groups')
          .select('id, item_id, name, is_required, is_multiple, selection_mode, sort_order')
          .in('item_id', itemIds)
          .order('sort_order', { ascending: true });

        groupData = (groups || []) as OptionGroupRow[];

        const groupIds = groupData.map((group) => group.id);

        if (groupIds.length) {
          const { data: choices } = await supabase
            .from('menu_option_choices')
            .select('id, option_group_id, name, price, price_delta, sort_order')
            .in('option_group_id', groupIds)
            .order('sort_order', { ascending: true });

          choiceData = (choices || []) as OptionChoiceRow[];
        }
      }

      if (!activeState) return;

      const mappedCategories = ((categoryData || []) as CategoryRow[]).map((category, categoryIndex) => {
        const categoryItems = ((itemData || []) as ItemRow[])
          .filter((item) => item.category_id === category.id)
          .map((item) => {
            const groups = groupData
              .filter((group) => group.item_id === item.id)
              .map((group) => ({
                id: group.id,
                name: group.name || 'Options',
                presetType: 'custom' as const,
                required: !!group.is_required,
                selection:
                  group.selection_mode === 'multiple' || group.is_multiple ? 'multiple' : 'single',
                options: choiceData
                  .filter((choice) => choice.option_group_id === group.id)
                  .map((choice) => ({
                    id: choice.id,
                    name: choice.name || 'Option',
                    price: String(choice.price_delta ?? choice.price ?? 0),
                  })),
              }));

            return {
              id: item.id,
              category_id: category.id,
              name: item.name || '',
              base_price: String(item.base_price ?? item.price ?? 0),
              description: item.description || '',
              image_url: item.image_url || '',
              availability:
                item.availability === 'sold_out' || item.is_available === false ? 'sold_out' : 'available',
              option_groups: groups,
            };
          });

        return {
          id: category.id,
          name: category.name || `Category ${categoryIndex + 1}`,
          sort_order: category.sort_order ?? categoryIndex,
          items: categoryItems,
        };
      });

      if (mappedCategories.length) {
        setCategories(mappedCategories);
        setSelectedCategoryId(mappedCategories[0].id);
        const firstItem = mappedCategories[0].items[0];
        if (firstItem) {
          setSelectedItemId(firstItem.id);
          setPreviewItemId(firstItem.id);
        }
      } else {
        const starterCategoryId = uid('cat');
        const starterItemId = uid('item');
        const starter = [
          {
            id: starterCategoryId,
            name: 'Featured',
            sort_order: 0,
            items: [
              {
                id: starterItemId,
                category_id: starterCategoryId,
                name: 'Sample Item',
                base_price: '12',
                description: 'Tap to edit this item.',
                image_url: '',
                availability: 'available' as const,
                option_groups: [],
              },
            ],
          },
        ];
        setCategories(starter);
        setSelectedCategoryId(starterCategoryId);
        setSelectedItemId(starterItemId);
        setPreviewItemId(starterItemId);
      }
    }

    void loadBuilder();

    return () => {
      active = false;
    };
  }, [router]);

  const normalizedSlug = useMemo(() => slugify(slug), [slug]);

  const previewLink = normalizedSlug ? `/store/${normalizedSlug}` : '/store/demo';

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const selectedItem = useMemo(() => {
    const allItems = categories.flatMap((category) => category.items);
    return allItems.find((item) => item.id === selectedItemId) || allItems[0] || null;
  }, [categories, selectedItemId]);

  const previewItem = useMemo(() => {
    const allItems = categories.flatMap((category) => category.items);
    return allItems.find((item) => item.id === previewItemId) || null;
  }, [categories, previewItemId]);

  const previewThemeClass =
    theme === 'dark' ? 'previewShell previewDark' : 'previewShell previewLight';

  async function uploadToBucket(file: File, bucket: 'heroes' | 'logos' | 'menu-items') {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${ownerId || 'owner'}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleHeroUpload(file: File | null) {
    if (!file) return;

    try {
      setUploadingHero(true);
      setError('');
      const url = await uploadToBucket(file, 'heroes');
      setHeroImage(url);
    } catch (err: any) {
      setError(err?.message || 'Could not upload hero image.');
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError('');
      const url = await uploadToBucket(file, 'logos');
      setLogoImage(url);
    } catch (err: any) {
      setError(err?.message || 'Could not upload logo image.');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleItemImageUpload(itemId: string, file: File | null) {
    if (!file) return;

    try {
      setUploadingItemId(itemId);
      setError('');
      const url = await uploadToBucket(file, 'menu-items');

      setCategories((current) =>
        current.map((category) => ({
          ...category,
          items: category.items.map((item) =>
            item.id === itemId ? { ...item, image_url: url } : item
          ),
        }))
      );
    } catch (err: any) {
      setError(err?.message || 'Could not upload item image.');
    } finally {
      setUploadingItemId(null);
    }
  }

  function addCategory() {
    const newCategoryId = uid('cat');
    const newItemId = uid('item');

    const newCategory: BuilderCategory = {
      id: newCategoryId,
      name: `Category ${categories.length + 1}`,
      sort_order: categories.length,
      items: [
        {
          id: newItemId,
          category_id: newCategoryId,
          name: 'New Item',
          base_price: '0',
          description: '',
          image_url: '',
          availability: 'available',
          option_groups: [],
        },
      ],
    };

    setCategories((current) => [...current, newCategory]);
    setSelectedCategoryId(newCategoryId);
    setSelectedItemId(newItemId);
    setPreviewItemId(newItemId);
  }

  function updateCategory(categoryId: string, value: string) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId ? { ...category, name: value } : category
      )
    );
  }

  function deleteCategory(categoryId: string) {
    const next = categories.filter((category) => category.id !== categoryId);
    setCategories(next);

    const nextCategory = next[0] || null;
    setSelectedCategoryId(nextCategory?.id || '');
    setSelectedItemId(nextCategory?.items[0]?.id || '');
    setPreviewItemId(nextCategory?.items[0]?.id || '');
  }

  function addItem(categoryId: string) {
    const itemId = uid('item');
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  id: itemId,
                  category_id: categoryId,
                  name: 'New Item',
                  base_price: '0',
                  description: '',
                  image_url: '',
                  availability: 'available',
                  option_groups: [],
                },
              ],
            }
          : category
      )
    );
    setSelectedCategoryId(categoryId);
    setSelectedItemId(itemId);
    setPreviewItemId(itemId);
  }

  function updateItem(itemId: string, patch: Partial<BuilderItem>) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId ? { ...item, ...patch } : item
        ),
      }))
    );
  }

  function deleteItem(categoryId: string, itemId: string) {
    const nextCategories = categories.map((category) =>
      category.id === categoryId
        ? { ...category, items: category.items.filter((item) => item.id !== itemId) }
        : category
    );

    setCategories(nextCategories);

    const nextCategory =
      nextCategories.find((category) => category.id === categoryId && category.items.length) ||
      nextCategories.find((category) => category.items.length) ||
      nextCategories[0] ||
      null;

    const nextItem = nextCategory?.items[0] || null;

    setSelectedCategoryId(nextCategory?.id || '');
    setSelectedItemId(nextItem?.id || '');
    setPreviewItemId(nextItem?.id || '');
  }

  function addOptionGroup(itemId: string, presetType: BuilderOptionGroup['presetType']) {
    const groupId = uid('group');
    const optionSeed = getPresetOptions(presetType);

    const group: BuilderOptionGroup = {
      id: groupId,
      name:
        presetType === 'custom'
          ? 'Custom Options'
          : presetType.charAt(0).toUpperCase() + presetType.slice(1),
      presetType,
      required: false,
      selection: presetType === 'extras' || presetType === 'removals' ? 'multiple' : 'single',
      options: optionSeed.map((option, index) => ({
        id: `${groupId}_opt_${index}`,
        name: option.name,
        price: option.price,
      })),
    };

    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? { ...item, option_groups: [...item.option_groups, group] }
            : item
        ),
      }))
    );
  }

  function updateOptionGroup(
    itemId: string,
    groupId: string,
    patch: Partial<BuilderOptionGroup>
  ) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.id === groupId ? { ...group, ...patch } : group
                ),
              }
            : item
        ),
      }))
    );
  }

  function deleteOptionGroup(itemId: string, groupId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.filter((group) => group.id !== groupId),
              }
            : item
        ),
      }))
    );
  }

  function addOptionChoice(itemId: string, groupId: string) {
    const optionId = uid('choice');

    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.id === groupId
                    ? {
                        ...group,
                        options: [...group.options, { id: optionId, name: 'New Choice', price: '0' }],
                      }
                    : group
                ),
              }
            : item
        ),
      }))
    );
  }

  function updateOptionChoice(
    itemId: string,
    groupId: string,
    optionId: string,
    patch: Partial<BuilderOption>
  ) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.id === groupId
                    ? {
                        ...group,
                        options: group.options.map((option) =>
                          option.id === optionId ? { ...option, ...patch } : option
                        ),
                      }
                    : group
                ),
              }
            : item
        ),
      }))
    );
  }

  function deleteOptionChoice(itemId: string, groupId: string, optionId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.id === groupId
                    ? {
                        ...group,
                        options: group.options.filter((option) => option.id !== optionId),
                      }
                    : group
                ),
              }
            : item
        ),
      }))
    );
  }

  async function handleSave() {
    try {
      if (!ownerId) return;

      setSaving(true);
      setError('');
      setSuccess('');

      const restaurantPayload = {
        owner_id: ownerId,
        name: name.trim() || null,
        slug: normalizedSlug || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        hero_image: heroImage.trim() || null,
        logo_image: logoImage.trim() || null,
        storefront_theme: theme,
        order_language: orderLanguage,
        storefront_language: storefrontLanguage,
        pickup_enabled: pickupEnabled,
        delivery_enabled: deliveryEnabled,
        delivery_fee: Number(deliveryFee || 0),
        delivery_radius: Number(deliveryRadius || 0),
        delivery_minimum: Number(deliveryMinimum || 0),
      };

      let currentRestaurantId = restaurantId;

      if (restaurantId) {
        const { error: updateError } = await supabase
          .from('restaurants')
          .update(restaurantPayload)
          .eq('id', restaurantId);

        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('restaurants')
          .insert(restaurantPayload)
          .select('id')
          .single();

        if (insertError) throw insertError;
        currentRestaurantId = inserted.id;
        setRestaurantId(inserted.id);
      }

      if (!currentRestaurantId) throw new Error('Missing restaurant id.');

      const allCategories = categories.map((category, categoryIndex) => ({
        id: category.id,
        restaurant_id: currentRestaurantId,
        name: category.name.trim() || `Category ${categoryIndex + 1}`,
        sort_order: categoryIndex,
      }));

      const categoryIds = allCategories.map((category) => category.id);

      if (categoryIds.length) {
        await supabase.from('menu_categories').delete().eq('restaurant_id', currentRestaurantId);
        const { error: categoryInsertError } = await supabase
          .from('menu_categories')
          .insert(allCategories);
        if (categoryInsertError) throw categoryInsertError;
      }

      const allItems = categories.flatMap((category, categoryIndex) =>
        category.items.map((item, itemIndex) => ({
          id: item.id,
          restaurant_id: currentRestaurantId,
          category_id: category.id,
          name: item.name.trim() || 'Untitled Item',
          base_price: Number(item.base_price || 0),
          price: Number(item.base_price || 0),
          description: item.description.trim() || null,
          image_url: item.image_url || null,
          availability: item.availability,
          is_available: item.availability === 'available',
          sort_order: itemIndex + categoryIndex * 100,
        }))
      );

      await supabase.from('menu_items').delete().eq('restaurant_id', currentRestaurantId);

      if (allItems.length) {
        const { error: itemInsertError } = await supabase.from('menu_items').insert(allItems);
        if (itemInsertError) throw itemInsertError;
      }

      const allOptionGroups = categories.flatMap((category) =>
        category.items.flatMap((item, groupIndexBase) =>
          item.option_groups.map((group, groupIndex) => ({
            id: group.id,
            item_id: item.id,
            name: group.name.trim() || 'Options',
            is_required: group.required,
            is_multiple: group.selection === 'multiple',
            selection_mode: group.selection,
            sort_order: groupIndex + groupIndexBase * 10,
          }))
        )
      );

      const itemIds = allItems.map((item) => item.id);

      if (itemIds.length) {
        await supabase.from('menu_option_groups').delete().in('item_id', itemIds);
      }

      if (allOptionGroups.length) {
        const { error: groupInsertError } = await supabase
          .from('menu_option_groups')
          .insert(allOptionGroups);
        if (groupInsertError) throw groupInsertError;
      }

      const groupIds = allOptionGroups.map((group) => group.id);

      if (groupIds.length) {
        await supabase.from('menu_option_choices').delete().in('option_group_id', groupIds);
      }

      const allChoices = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.option_groups.flatMap((group) =>
            group.options.map((option, optionIndex) => ({
              id: option.id,
              option_group_id: group.id,
              name: option.name.trim() || 'Choice',
              price: Number(option.price || 0),
              price_delta: Number(option.price || 0),
              sort_order: optionIndex,
            }))
          )
        )
      );

      if (allChoices.length) {
        const { error: choiceInsertError } = await supabase
          .from('menu_option_choices')
          .insert(allChoices);
        if (choiceInsertError) throw choiceInsertError;
      }

      setSuccess('Builder saved.');
    } catch (err: any) {
      setError(err?.message || 'Could not save builder.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <section className="shell">
          <div className="eyebrow">MenuFlow Builder</div>
          <h1>Loading builder...</h1>

          <style jsx>{`
            .page {
              min-height: 100vh;
              background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
              padding: 24px;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .shell {
              max-width: 1320px;
              margin: 0 auto;
              background: #fff;
              border: 1px solid rgba(15, 23, 42, 0.08);
              border-radius: 32px;
              padding: 28px;
              box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
            }
            .eyebrow {
              color: #718096;
              font-size: 13px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              margin-bottom: 12px;
            }
            h1 {
              margin: 0;
              color: #0f172a;
              font-size: clamp(34px, 6vw, 60px);
              line-height: 0.94;
              letter-spacing: -0.05em;
              font-weight: 900;
            }
          `}</style>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="shell">
        <div className="topRow">
          <div>
            <div className="eyebrow">MenuFlow Builder</div>
            <h1>Build Your Store</h1>
            <p>Upload branding, set delivery rules, build categories and items, then save.</p>
          </div>

          <div className="topActions">
            <Link href={previewLink} className="ghostButton" target="_blank">
              Open Store
            </Link>
            <button type="button" className="primaryButton" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Builder'}
            </button>
          </div>
        </div>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <div className="grid">
          <section className="leftColumn">
            <section className="panel">
              <div className="panelTitle">Store Setup</div>

              <div className="fieldGrid">
                <label className="field">
                  <span className="label">Store name</span>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Restaurant"
                  />
                </label>

                <label className="field">
                  <span className="label">Slug</span>
                  <input
                    className="input"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="your-store"
                  />
                  <span className="helpText">Live URL: /store/{normalizedSlug || 'your-store'}</span>
                </label>

                <label className="field">
                  <span className="label">Phone</span>
                  <input
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="3235553355"
                  />
                </label>

                <label className="field">
                  <span className="label">Address</span>
                  <input
                    className="input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                  />
                </label>
              </div>

              <div className="uploadGrid">
                <div className="uploadCard">
                  <div className="uploadTitle">Upload Hero Image</div>
                  <label className="uploadButton">
                    {uploadingHero ? 'Uploading...' : 'Upload Hero Image'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        void handleHeroUpload(e.target.files?.[0] || null);
                      }}
                    />
                  </label>
                  {heroImage ? <img src={heroImage} alt="Hero" className="thumbImage" /> : <div className="thumbPlaceholder">Hero Preview</div>}
                </div>

                <div className="uploadCard">
                  <div className="uploadTitle">Upload Logo</div>
                  <label className="uploadButton">
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        void handleLogoUpload(e.target.files?.[0] || null);
                      }}
                    />
                  </label>
                  {logoImage ? <img src={logoImage} alt="Logo" className="thumbImage logoThumb" /> : <div className="thumbPlaceholder">Logo Preview</div>}
                </div>
              </div>

              <div className="toggleRowWrap">
                <div className="toggleBlock">
                  <div className="label">Storefront theme</div>
                  <div className="themeRow">
                    <button
                      type="button"
                      className={theme === 'light' ? 'themeButton activeTheme' : 'themeButton'}
                      onClick={() => setTheme('light')}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      className={theme === 'dark' ? 'themeButton activeTheme' : 'themeButton'}
                      onClick={() => setTheme('dark')}
                    >
                      Dark
                    </button>
                  </div>
                </div>

                <div className="toggleBlock">
                  <div className="label">Order language</div>
                  <div className="themeRow">
                    <button
                      type="button"
                      className={orderLanguage === 'EN' ? 'themeButton activeTheme' : 'themeButton'}
                      onClick={() => setOrderLanguage('EN')}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      className={orderLanguage === 'ES' ? 'themeButton activeTheme' : 'themeButton'}
                      onClick={() => setOrderLanguage('ES')}
                    >
                      Spanish
                    </button>
                  </div>
                </div>

                <div className="toggleBlock">
                  <div className="label">Storefront language</div>
                  <div className="themeRow">
                    <button
                      type="button"
                      className={storefrontLanguage === 'en' ? 'themeButton activeTheme' : 'themeButton'}
                      onClick={() => setStorefrontLanguage('en')}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      className={storefrontLanguage === 'es' ? 'themeButton activeTheme' : 'themeButton'}
                      onClick={() => setStorefrontLanguage('es')}
                    >
                      ES
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelTitle">Pickup / Delivery Controls</div>

              <div className="deliveryToggleRow">
                <button
                  type="button"
                  className={pickupEnabled ? 'pillToggle activePill' : 'pillToggle'}
                  onClick={() => setPickupEnabled((current) => !current)}
                >
                  Pickup {pickupEnabled ? 'On' : 'Off'}
                </button>

                <button
                  type="button"
                  className={deliveryEnabled ? 'pillToggle activePill' : 'pillToggle'}
                  onClick={() => setDeliveryEnabled((current) => !current)}
                >
                  Delivery {deliveryEnabled ? 'On' : 'Off'}
                </button>
              </div>

              <div className="fieldGrid threeCols">
                <label className="field">
                  <span className="label">Delivery fee</span>
                  <input
                    className="input"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(sanitizeNumberInput(e.target.value))}
                    placeholder="5"
                  />
                </label>

                <label className="field">
                  <span className="label">Delivery radius</span>
                  <input
                    className="input"
                    value={deliveryRadius}
                    onChange={(e) => setDeliveryRadius(sanitizeNumberInput(e.target.value))}
                    placeholder="5"
                  />
                </label>

                <label className="field">
                  <span className="label">Delivery minimum</span>
                  <input
                    className="input"
                    value={deliveryMinimum}
                    onChange={(e) => setDeliveryMinimum(sanitizeNumberInput(e.target.value))}
                    placeholder="20"
                  />
                </label>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div className="panelTitle noMargin">Category Builder</div>
                <button type="button" className="smallAction" onClick={addCategory}>
                  Add Category
                </button>
              </div>

              <div className="categoryList">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={category.id === selectedCategoryId ? 'categoryCard categoryCardActive' : 'categoryCard'}
                  >
                    <button
                      type="button"
                      className="categorySelect"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        const firstItem = category.items[0];
                        if (firstItem) {
                          setSelectedItemId(firstItem.id);
                          setPreviewItemId(firstItem.id);
                        }
                      }}
                    >
                      <span>{category.name || 'Untitled Category'}</span>
                      <span className="categoryCount">{category.items.length}</span>
                    </button>

                    <div className="categoryEditRow">
                      <input
                        className="input compactInput"
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, e.target.value)}
                        placeholder="Category name"
                      />

                      <button type="button" className="dangerButton" onClick={() => deleteCategory(category.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {selectedCategory ? (
              <section className="panel">
                <div className="panelHeader">
                  <div className="panelTitle noMargin">Items in {selectedCategory.name || 'Category'}</div>
                  <button
                    type="button"
                    className="smallAction"
                    onClick={() => addItem(selectedCategory.id)}
                  >
                    Add Item
                  </button>
                </div>

                <div className="itemList">
                  {selectedCategory.items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={item.id === selectedItemId ? 'itemListCard itemListCardActive' : 'itemListCard'}
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setPreviewItemId(item.id);
                      }}
                    >
                      <div>
                        <div className="itemListName">{item.name || 'Untitled Item'}</div>
                        <div className="itemListMeta">{money(item.base_price)}</div>
                      </div>
                      <div className={item.availability === 'available' ? 'availability availabilityOn' : 'availability availabilityOff'}>
                        {item.availability === 'available' ? 'Available' : 'Sold Out'}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {selectedItem ? (
              <section className="panel">
                <div className="panelHeader">
                  <div className="panelTitle noMargin">Item Builder</div>
                  <button
                    type="button"
                    className="dangerButton"
                    onClick={() => deleteItem(selectedItem.category_id, selectedItem.id)}
                  >
                    Delete Item
                  </button>
                </div>

                <div className="fieldGrid">
                  <div className="uploadCard fullWidthCard">
                    <div className="uploadTitle">Upload Item Image</div>
                    <label className="uploadButton">
                      {uploadingItemId === selectedItem.id ? 'Uploading...' : 'Upload Item Image'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          void handleItemImageUpload(selectedItem.id, e.target.files?.[0] || null);
                        }}
                      />
                    </label>

                    {selectedItem.image_url ? (
                      <img src={selectedItem.image_url} alt={selectedItem.name} className="thumbImage itemThumb" />
                    ) : (
                      <div className="thumbPlaceholder itemThumbPlaceholder">Item Preview</div>
                    )}
                  </div>

                  <label className="field">
                    <span className="label">Item name</span>
                    <input
                      className="input"
                      value={selectedItem.name}
                      onChange={(e) => updateItem(selectedItem.id, { name: e.target.value })}
                      placeholder="Item name"
                    />
                  </label>

                  <label className="field">
                    <span className="label">Base price</span>
                    <input
                      className="input"
                      value={selectedItem.base_price}
                      onChange={(e) =>
                        updateItem(selectedItem.id, {
                          base_price: sanitizeNumberInput(e.target.value),
                        })
                      }
                      placeholder="12.99"
                    />
                  </label>

                  <label className="field fullWidth">
                    <span className="label">Description</span>
                    <textarea
                      className="textarea"
                      value={selectedItem.description}
                      onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })}
                      placeholder="Describe the item..."
                    />
                  </label>

                  <div className="field fullWidth">
                    <span className="label">Availability</span>
                    <div className="themeRow">
                      <button
                        type="button"
                        className={selectedItem.availability === 'available' ? 'themeButton activeTheme' : 'themeButton'}
                        onClick={() => updateItem(selectedItem.id, { availability: 'available' })}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        className={selectedItem.availability === 'sold_out' ? 'themeButton activeTheme' : 'themeButton'}
                        onClick={() => updateItem(selectedItem.id, { availability: 'sold_out' })}
                      >
                        Sold Out
                      </button>
                    </div>
                  </div>
                </div>

                <div className="optionGroupHeader">
                  <div className="panelTitle noMargin">Option Groups</div>
                  <div className="optionActionWrap">
                    <button type="button" className="smallAction" onClick={() => addOptionGroup(selectedItem.id, 'protein')}>
                      Protein
                    </button>
                    <button type="button" className="smallAction" onClick={() => addOptionGroup(selectedItem.id, 'size')}>
                      Size
                    </button>
                    <button type="button" className="smallAction" onClick={() => addOptionGroup(selectedItem.id, 'drink')}>
                      Drink
                    </button>
                    <button type="button" className="smallAction" onClick={() => addOptionGroup(selectedItem.id, 'extras')}>
                      Extras
                    </button>
                    <button type="button" className="smallAction" onClick={() => addOptionGroup(selectedItem.id, 'removals')}>
                      Removals
                    </button>
                    <button type="button" className="smallAction" onClick={() => addOptionGroup(selectedItem.id, 'custom')}>
                      Custom
                    </button>
                  </div>
                </div>

                <div className="optionGroupList">
                  {selectedItem.option_groups.length ? (
                    selectedItem.option_groups.map((group) => (
                      <div key={group.id} className="optionGroupCard">
                        <div className="panelHeader optionGroupTop">
                          <input
                            className="input compactInput strongInput"
                            value={group.name}
                            onChange={(e) =>
                              updateOptionGroup(selectedItem.id, group.id, { name: e.target.value })
                            }
                            placeholder="Group name"
                          />

                          <button
                            type="button"
                            className="dangerButton"
                            onClick={() => deleteOptionGroup(selectedItem.id, group.id)}
                          >
                            Delete
                          </button>
                        </div>

                        <div className="optionMetaRow">
                          <button
                            type="button"
                            className={group.required ? 'pillToggle activePill' : 'pillToggle'}
                            onClick={() =>
                              updateOptionGroup(selectedItem.id, group.id, { required: !group.required })
                            }
                          >
                            {group.required ? 'Required' : 'Optional'}
                          </button>

                          <button
                            type="button"
                            className={group.selection === 'single' ? 'pillToggle activePill' : 'pillToggle'}
                            onClick={() =>
                              updateOptionGroup(selectedItem.id, group.id, { selection: 'single' })
                            }
                          >
                            Single Choice
                          </button>

                          <button
                            type="button"
                            className={group.selection === 'multiple' ? 'pillToggle activePill' : 'pillToggle'}
                            onClick={() =>
                              updateOptionGroup(selectedItem.id, group.id, { selection: 'multiple' })
                            }
                          >
                            Multiple Choice
                          </button>
                        </div>

                        <div className="choiceList">
                          {group.options.map((option) => (
                            <div key={option.id} className="choiceRow">
                              <input
                                className="input compactInput"
                                value={option.name}
                                onChange={(e) =>
                                  updateOptionChoice(selectedItem.id, group.id, option.id, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Choice name"
                              />

                              <input
                                className="input compactInput priceInput"
                                value={option.price}
                                onChange={(e) =>
                                  updateOptionChoice(selectedItem.id, group.id, option.id, {
                                    price: sanitizeNumberInput(e.target.value),
                                  })
                                }
                                placeholder="0"
                              />

                              <button
                                type="button"
                                className="dangerButton"
                                onClick={() => deleteOptionChoice(selectedItem.id, group.id, option.id)}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="smallAction"
                          onClick={() => addOptionChoice(selectedItem.id, group.id)}
                        >
                          Add Choice
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="emptyBlock">No option groups yet.</div>
                  )}
                </div>
              </section>
            ) : null}
          </section>

          <section className="rightColumn">
            <section className="panel stickyPanel">
              <div className="panelHeader">
                <div className="panelTitle noMargin">Live Preview</div>
                <div className="previewStatus">Image-only main grid</div>
              </div>

              <div className={previewThemeClass}>
                <div className="previewHero">
                  {heroImage ? (
                    <img src={heroImage} alt="Hero" className="previewHeroImage" />
                  ) : (
                    <div className="previewHeroFallback" />
                  )}

                  <div className="previewOverlay" />

                  <div className="previewHeroContent">
                    <div className="previewBrandRow">
                      {logoImage ? (
                        <img src={logoImage} alt="Logo" className="previewLogo" />
                      ) : (
                        <div className="previewLogoFallback">
                          {(name.trim() || 'M').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="previewName">{name.trim() || 'Your Store'}</div>
                        <div className="previewTag">{address.trim() || 'Storefront Preview'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="previewContent">
                  <div className="previewTopMeta">
                    <div className="previewMetaPill">{pickupEnabled ? 'Pickup On' : 'Pickup Off'}</div>
                    <div className="previewMetaPill">{deliveryEnabled ? 'Delivery On' : 'Delivery Off'}</div>
                    <div className="previewMetaPill">{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</div>
                  </div>

                  <div className="previewCategoryTabs">
                    {categories.map((category) => (
                      <button
                        type="button"
                        key={category.id}
                        className={
                          category.id === selectedCategoryId ? 'previewCategoryTab previewCategoryTabActive' : 'previewCategoryTab'
                        }
                        onClick={() => setSelectedCategoryId(category.id)}
                      >
                        {category.name || 'Category'}
                      </button>
                    ))}
                  </div>

                  <div className="previewGrid">
                    {(selectedCategory?.items || []).map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="previewGridCard"
                        onClick={() => setPreviewItemId(item.id)}
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="previewGridImage" />
                        ) : (
                          <div className="previewGridFallback" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {previewItem ? (
                <div className="previewPopup">
                  <div className="previewPopupImageWrap">
                    {previewItem.image_url ? (
                      <img src={previewItem.image_url} alt={previewItem.name} className="previewPopupImage" />
                    ) : (
                      <div className="previewPopupFallback" />
                    )}
                  </div>

                  <div className="previewPopupBody">
                    <div className="previewPopupName">{previewItem.name || 'Item Name'}</div>
                    <div className="previewPopupPrice">{money(previewItem.base_price)}</div>
                    <div className="previewPopupDescription">
                      {previewItem.description || 'Item details will show here in the popup preview.'}
                    </div>

                    {previewItem.option_groups.length ? (
                      <div className="previewOptionsWrap">
                        {previewItem.option_groups.map((group) => (
                          <div key={group.id} className="previewOptionGroup">
                            <div className="previewOptionHeader">
                              <span>{group.name}</span>
                              <span>{group.required ? 'Required' : 'Optional'}</span>
                            </div>

                            <div className="previewChoiceWrap">
                              {group.options.map((option) => (
                                <div key={option.id} className="previewChoiceRow">
                                  <span>{option.name}</span>
                                  <span>{money(option.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          </section>
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
          padding: 24px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .shell {
          max-width: 1440px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 32px;
          padding: 28px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
        }

        .topRow {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 18px;
          margin-bottom: 20px;
        }

        .eyebrow {
          color: #718096;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(34px, 6vw, 60px);
          line-height: 0.94;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        p {
          margin: 12px 0 0;
          color: #566274;
          font-size: 18px;
          line-height: 1.5;
          font-weight: 700;
        }

        .topActions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primaryButton,
        .ghostButton,
        .smallAction,
        .dangerButton,
        .uploadButton,
        .themeButton,
        .pillToggle {
          min-height: 48px;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: 0.18s ease;
        }

        .primaryButton {
          padding: 0 18px;
          background: #0f172a;
          color: #fff;
        }

        .ghostButton {
          padding: 0 18px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          color: #0f172a;
        }

        .smallAction {
          padding: 0 16px;
          background: #0f172a;
          color: #fff;
        }

        .dangerButton {
          padding: 0 14px;
          background: rgba(220, 38, 38, 0.1);
          color: #991b1b;
        }

        .uploadButton {
          padding: 0 16px;
          background: #0f172a;
          color: #fff;
          width: fit-content;
        }

        .themeButton,
        .pillToggle {
          padding: 0 18px;
          background: #fff;
          color: #0f172a;
          border: 1px solid rgba(15, 23, 42, 0.12);
        }

        .activeTheme,
        .activePill {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }

        .primaryButton:disabled,
        .uploadButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          margin-bottom: 14px;
          border-radius: 18px;
          padding: 14px 16px;
          font-size: 15px;
          font-weight: 800;
        }

        .error {
          color: #991b1b;
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.16);
        }

        .success {
          color: #166534;
          background: rgba(22, 163, 74, 0.08);
          border: 1px solid rgba(22, 163, 74, 0.16);
        }

        .grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(420px, 0.85fr);
          gap: 20px;
        }

        .leftColumn,
        .rightColumn {
          display: grid;
          gap: 20px;
          align-content: start;
        }

        .panel {
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 28px;
          padding: 20px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.04);
        }

        .stickyPanel {
          position: sticky;
          top: 24px;
        }

        .panelTitle {
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .panelHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .noMargin {
          margin: 0;
        }

        .fieldGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .threeCols {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .fullWidth {
          grid-column: 1 / -1;
        }

        .label {
          color: #718096;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .input,
        .textarea {
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          padding: 0 16px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 700;
          outline: none;
        }

        .input {
          min-height: 54px;
        }

        .textarea {
          min-height: 120px;
          padding: 16px;
          resize: vertical;
        }

        .compactInput {
          min-height: 46px;
          font-size: 15px;
        }

        .strongInput {
          min-width: 240px;
        }

        .priceInput {
          max-width: 110px;
        }

        .helpText {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .uploadGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 14px;
        }

        .uploadCard {
          border: 1px dashed rgba(15, 23, 42, 0.16);
          border-radius: 22px;
          padding: 16px;
          display: grid;
          gap: 12px;
          background: #fbfdff;
        }

        .uploadTitle {
          color: #0f172a;
          font-size: 15px;
          font-weight: 900;
        }

        .thumbImage,
        .thumbPlaceholder {
          width: 100%;
          height: 180px;
          border-radius: 18px;
          object-fit: cover;
        }

        .thumbPlaceholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
          color: #475569;
          font-size: 15px;
          font-weight: 900;
        }

        .logoThumb {
          object-fit: contain;
          background: #fff;
          padding: 16px;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .itemThumb {
          height: 220px;
        }

        .itemThumbPlaceholder {
          height: 220px;
        }

        .fullWidthCard {
          grid-column: 1 / -1;
        }

        .toggleRowWrap {
          display: grid;
          gap: 14px;
          margin-top: 14px;
        }

        .toggleBlock {
          display: grid;
          gap: 10px;
        }

        .themeRow,
        .deliveryToggleRow,
        .optionActionWrap,
        .optionMetaRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .categoryList,
        .itemList,
        .optionGroupList {
          display: grid;
          gap: 12px;
        }

        .categoryCard,
        .itemListCard,
        .optionGroupCard {
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 22px;
          padding: 14px;
          background: #fff;
        }

        .categoryCardActive,
        .itemListCardActive {
          border-color: #0f172a;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
        }

        .categorySelect,
        .itemListCard {
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .categorySelect {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 900;
        }

        .categoryCount {
          min-width: 34px;
          min-height: 34px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.08);
          font-size: 13px;
          font-weight: 900;
        }

        .categoryEditRow {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: 12px;
        }

        .itemListCard {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .itemListName {
          color: #0f172a;
          font-size: 16px;
          font-weight: 900;
        }

        .itemListMeta {
          margin-top: 5px;
          color: #475569;
          font-size: 14px;
          font-weight: 800;
        }

        .availability {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
        }

        .availabilityOn {
          background: rgba(22, 163, 74, 0.1);
          color: #166534;
        }

        .availabilityOff {
          background: rgba(220, 38, 38, 0.1);
          color: #991b1b;
        }

        .optionGroupHeader {
          margin-top: 18px;
          display: grid;
          gap: 12px;
        }

        .optionGroupTop {
          margin-bottom: 12px;
        }

        .choiceList {
          display: grid;
          gap: 10px;
          margin: 14px 0;
        }

        .choiceRow {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .emptyBlock {
          border: 1px dashed rgba(15, 23, 42, 0.14);
          border-radius: 18px;
          padding: 20px;
          color: #64748b;
          font-size: 15px;
          font-weight: 800;
          text-align: center;
        }

        .previewStatus {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.08);
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .previewShell {
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(15, 23, 42, 0.1);
        }

        .previewLight {
          background: #f8fbff;
          color: #0f172a;
        }

        .previewDark {
          background: #0f172a;
          color: #fff;
        }

        .previewHero {
          position: relative;
          height: 280px;
          overflow: hidden;
          background: #0f172a;
        }

        .previewHeroImage,
        .previewHeroFallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
        }

        .previewOverlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(2, 6, 23, 0.1) 0%, rgba(2, 6, 23, 0.7) 100%);
        }

        .previewHeroContent {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: end;
          padding: 18px;
        }

        .previewBrandRow {
          display: flex;
          align-items: end;
          gap: 14px;
        }

        .previewLogo,
        .previewLogoFallback {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          object-fit: cover;
          background: #fff;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
        }

        .previewName {
          color: #fff;
          font-size: 40px;
          line-height: 0.94;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .previewTag {
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          font-weight: 800;
        }

        .previewContent {
          padding: 18px;
        }

        .previewTopMeta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .previewMetaPill {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.08);
          color: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
        }

        .previewDark .previewMetaPill {
          background: rgba(255, 255, 255, 0.08);
        }

        .previewCategoryTabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 14px;
        }

        .previewCategoryTab {
          flex: 0 0 auto;
          min-height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: transparent;
          color: inherit;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .previewDark .previewCategoryTab {
          border-color: rgba(255, 255, 255, 0.14);
        }

        .previewCategoryTabActive {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }

        .previewDark .previewCategoryTabActive {
          background: #fff;
          color: #0f172a;
          border-color: #fff;
        }

        .previewGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .previewGridCard {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
        }

        .previewGridImage,
        .previewGridFallback {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 22px;
          object-fit: cover;
          display: block;
          background: linear-gradient(135deg, #1f2937 0%, #0f172a 100%);
        }

        .previewPopup {
          margin-top: 16px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 28px;
          overflow: hidden;
          background: #fff;
        }

        .previewPopupImageWrap {
          width: 100%;
          height: 240px;
          overflow: hidden;
          background: linear-gradient(135deg, #1f2937 0%, #0f172a 100%);
        }

        .previewPopupImage,
        .previewPopupFallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .previewPopupBody {
          padding: 18px;
        }

        .previewPopupName {
          color: #0f172a;
          font-size: 30px;
          line-height: 0.96;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .previewPopupPrice {
          margin-top: 10px;
          color: #0f172a;
          font-size: 24px;
          font-weight: 900;
        }

        .previewPopupDescription {
          margin-top: 10px;
          color: #475569;
          font-size: 15px;
          line-height: 1.55;
          font-weight: 700;
        }

        .previewOptionsWrap {
          margin-top: 16px;
          display: grid;
          gap: 12px;
        }

        .previewOptionGroup {
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          padding: 14px;
        }

        .previewOptionHeader {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .previewChoiceWrap {
          display: grid;
          gap: 8px;
          margin-top: 10px;
        }

        .previewChoiceRow {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #475569;
          font-size: 14px;
          font-weight: 800;
        }

        @media (max-width: 1180px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .stickyPanel {
            position: static;
          }
        }

        @media (max-width: 820px) {
          .fieldGrid,
          .threeCols,
          .uploadGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 16px;
          }

          .shell {
            padding: 18px;
            border-radius: 24px;
          }

          .topRow {
            flex-direction: column;
          }

          .topActions {
            width: 100%;
          }

          .primaryButton,
          .ghostButton {
            flex: 1 1 0;
          }

          .choiceRow,
          .categoryEditRow {
            flex-direction: column;
            align-items: stretch;
          }

          .previewHero {
            height: 220px;
          }

          .previewName {
            font-size: 32px;
          }

          .previewPopupImageWrap {
            height: 200px;
          }

          .previewGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}
