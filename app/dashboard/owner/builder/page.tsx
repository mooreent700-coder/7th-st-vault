
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';
type SectionKey = 'store' | 'branding' | 'theme' | 'menu' | 'item' | 'options';
type ExpandedSection = SectionKey | null;

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
  storefront_language?: string | null;
  order_language?: string | null;
  pickup_enabled?: boolean | null;
  delivery_enabled?: boolean | null;
  delivery_fee?: number | null;
  delivery_radius?: number | null;
  delivery_minimum?: number | null;
};

type CategoryRow = {
  id: string;
  restaurant_id?: string | null;
  name?: string | null;
  sort_order?: number | null;
};

type ItemRow = {
  id: string;
  restaurant_id?: string | null;
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

type BuilderOption = {
  id: string;
  name: string;
  price: string;
};

type BuilderOptionGroup = {
  id: string;
  name: string;
  presetType: 'protein' | 'size' | 'drink' | 'extras' | 'removals' | 'custom';
  required: boolean;
  selection: 'single' | 'multiple';
  options: BuilderOption[];
};

type BuilderItem = {
  id: string;
  category_id: string;
  name: string;
  base_price: string;
  description: string;
  image_url: string;
  availability: Availability;
  option_groups: BuilderOptionGroup[];
};

type BuilderCategory = {
  id: string;
  name: string;
  sort_order: number;
  items: BuilderItem[];
};

type CopyBlock = {
  builderWord: string;
  title: string;
  subtitle: string;
  loading: string;
  builderSaved: string;
  couldNotLoad: string;
  couldNotSave: string;
  couldNotUploadHero: string;
  couldNotUploadLogo: string;
  couldNotUploadItem: string;
  storeSetup: string;
  branding: string;
  theme: string;
  menu: string;
  itemBuilder: string;
  optionGroups: string;
  previewStore: string;
  save: string;
  saving: string;
  liveUrl: string;
  storeName: string;
  phone: string;
  address: string;
  builderLanguage: string;
  storefrontLanguage: string;
  orderLanguage: string;
  english: string;
  spanish: string;
  light: string;
  dark: string;
  pickupOn: string;
  pickupOff: string;
  deliveryOn: string;
  deliveryOff: string;
  deliveryFee: string;
  deliveryRadius: string;
  deliveryMinimum: string;
  uploadHeroImage: string;
  uploadLogo: string;
  uploadItemImage: string;
  removeImage: string;
  heroPreview: string;
  logoPreview: string;
  itemPreview: string;
  addCategory: string;
  addItem: string;
  categoryName: string;
  itemName: string;
  itemNameFallback: string;
  basePrice: string;
  description: string;
  describeItem: string;
  availability: string;
  available: string;
  soldOut: string;
  delete: string;
  deleteItem: string;
  protein: string;
  size: string;
  drink: string;
  extras: string;
  removals: string;
  custom: string;
  required: string;
  optional: string;
  singleChoice: string;
  multipleChoice: string;
  choiceName: string;
  addChoice: string;
  newChoice: string;
  noOptionGroups: string;
  categoriesAndItems: string;
  heroAndLogoImages: string;
  dashboard: string;
  builder: string;
  preview: string;
  flyers: string;
  orders: string;
  more: string;
};

const COPY: Record<LanguageMode, CopyBlock> = {
  en: {
    builderWord: 'BUILDER',
    title: 'Build Your Store',
    subtitle: 'Upload branding, build your menu, go live.',
    loading: 'Loading builder...',
    builderSaved: 'Builder saved.',
    couldNotLoad: 'Could not load builder.',
    couldNotSave: 'Could not save builder.',
    couldNotUploadHero: 'Could not upload hero image.',
    couldNotUploadLogo: 'Could not upload logo image.',
    couldNotUploadItem: 'Could not upload item image.',
    storeSetup: 'Store Setup',
    branding: 'Branding',
    theme: 'Theme',
    menu: 'Menu',
    itemBuilder: 'Item Builder',
    optionGroups: 'Option Groups',
    previewStore: 'Preview Store',
    save: 'Save',
    saving: 'Saving...',
    liveUrl: 'Live URL',
    storeName: 'Store Name',
    phone: 'Phone',
    address: 'Address',
    builderLanguage: 'Builder Language',
    storefrontLanguage: 'Storefront Language',
    orderLanguage: 'Order Language',
    english: 'English',
    spanish: 'Spanish',
    light: 'Light',
    dark: 'Dark',
    pickupOn: 'Pickup On',
    pickupOff: 'Pickup Off',
    deliveryOn: 'Delivery On',
    deliveryOff: 'Delivery Off',
    deliveryFee: 'Delivery Fee',
    deliveryRadius: 'Delivery Radius',
    deliveryMinimum: 'Delivery Minimum',
    uploadHeroImage: 'Upload Hero Image',
    uploadLogo: 'Upload Logo',
    uploadItemImage: 'Upload Item Image',
    removeImage: 'Remove Image',
    heroPreview: 'Hero Preview',
    logoPreview: 'Logo Preview',
    itemPreview: 'Item Preview',
    addCategory: 'Add Category',
    addItem: 'Add Item',
    categoryName: 'Category Name',
    itemName: 'Item Name',
    itemNameFallback: 'Item Name',
    basePrice: 'Base Price',
    description: 'Description',
    describeItem: 'Describe the item...',
    availability: 'Availability',
    available: 'Available',
    soldOut: 'Sold Out',
    delete: 'Delete',
    deleteItem: 'Delete Item',
    protein: 'Protein',
    size: 'Size',
    drink: 'Drink',
    extras: 'Extras',
    removals: 'Removals',
    custom: 'Custom',
    required: 'Required',
    optional: 'Optional',
    singleChoice: 'Single',
    multipleChoice: 'Multiple',
    choiceName: 'Choice Name',
    addChoice: 'Add Choice',
    newChoice: 'New Choice',
    noOptionGroups: 'No option groups yet.',
    categoriesAndItems: 'Categories & Items',
    heroAndLogoImages: 'Hero & Logo Images',
    dashboard: 'Dashboard',
    builder: 'Builder',
    preview: 'Preview',
    flyers: 'Flyers',
    orders: 'Orders',
    more: 'More',
  },
  es: {
    builderWord: 'BUILDER',
    title: 'Construye Tu Tienda',
    subtitle: 'Sube branding, crea tu menú y publícalo.',
    loading: 'Cargando constructor...',
    builderSaved: 'Constructor guardado.',
    couldNotLoad: 'No se pudo cargar el constructor.',
    couldNotSave: 'No se pudo guardar el constructor.',
    couldNotUploadHero: 'No se pudo subir la imagen hero.',
    couldNotUploadLogo: 'No se pudo subir el logo.',
    couldNotUploadItem: 'No se pudo subir la imagen del producto.',
    storeSetup: 'Configuración',
    branding: 'Branding',
    theme: 'Tema',
    menu: 'Menú',
    itemBuilder: 'Producto',
    optionGroups: 'Grupos de Opciones',
    previewStore: 'Vista Tienda',
    save: 'Guardar',
    saving: 'Guardando...',
    liveUrl: 'URL en vivo',
    storeName: 'Nombre del Negocio',
    phone: 'Teléfono',
    address: 'Dirección',
    builderLanguage: 'Idioma del Constructor',
    storefrontLanguage: 'Idioma de la Tienda',
    orderLanguage: 'Idioma del Pedido',
    english: 'Inglés',
    spanish: 'Español',
    light: 'Claro',
    dark: 'Oscuro',
    pickupOn: 'Recogida Activada',
    pickupOff: 'Recogida Desactivada',
    deliveryOn: 'Entrega Activada',
    deliveryOff: 'Entrega Desactivada',
    deliveryFee: 'Costo de Entrega',
    deliveryRadius: 'Radio de Entrega',
    deliveryMinimum: 'Mínimo de Entrega',
    uploadHeroImage: 'Subir Hero',
    uploadLogo: 'Subir Logo',
    uploadItemImage: 'Subir Imagen',
    removeImage: 'Quitar Imagen',
    heroPreview: 'Vista previa hero',
    logoPreview: 'Vista previa logo',
    itemPreview: 'Vista previa del producto',
    addCategory: 'Agregar Categoría',
    addItem: 'Agregar Producto',
    categoryName: 'Nombre de Categoría',
    itemName: 'Nombre del Producto',
    itemNameFallback: 'Nombre del producto',
    basePrice: 'Precio Base',
    description: 'Descripción',
    describeItem: 'Describe el producto...',
    availability: 'Disponibilidad',
    available: 'Disponible',
    soldOut: 'Agotado',
    delete: 'Eliminar',
    deleteItem: 'Eliminar Producto',
    protein: 'Proteína',
    size: 'Tamaño',
    drink: 'Bebida',
    extras: 'Extras',
    removals: 'Quitar',
    custom: 'Personalizado',
    required: 'Requerido',
    optional: 'Opcional',
    singleChoice: 'Una',
    multipleChoice: 'Múltiple',
    choiceName: 'Nombre de Opción',
    addChoice: 'Agregar Opción',
    newChoice: 'Nueva Opción',
    noOptionGroups: 'Todavía no hay grupos de opciones.',
    categoriesAndItems: 'Categorías y Productos',
    heroAndLogoImages: 'Hero y Logo',
    dashboard: 'Panel',
    builder: 'Builder',
    preview: 'Vista',
    flyers: 'Flyers',
    orders: 'Pedidos',
    more: 'Más',
  },
};

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

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

function sanitizeNumberInput(value: string) {
  return value.replace(/[^0-9.]/g, '');
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

function normalizeAvailability(item: ItemRow): Availability {
  if (item.availability === 'sold_out' || item.is_available === false) return 'sold_out';
  return 'available';
}

function normalizeSelectionMode(group: OptionGroupRow): 'single' | 'multiple' {
  if (group.selection_mode === 'multiple' || group.is_multiple) return 'multiple';
  return 'single';
}

function getEmptyStarter(copy: CopyBlock): BuilderCategory[] {
  const categoryId = uid('cat');
  const itemId = uid('item');

  return [
    {
      id: categoryId,
      name: 'Featured',
      sort_order: 0,
      items: [
        {
          id: itemId,
          category_id: categoryId,
          name: copy.itemNameFallback,
          base_price: '12',
          description: copy.describeItem,
          image_url: '',
          availability: 'available',
          option_groups: [],
        },
      ],
    },
  ];
}

function MiniIcon({ children }: { children: ReactNode }) {
  return <span className="miniIcon">{children}</span>;
}

export default function BuilderPage() {
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

  const [builderLanguage, setBuilderLanguage] = useState<LanguageMode>('en');
  const [storefrontLanguage, setStorefrontLanguage] = useState<LanguageMode>('en');
  const [orderLanguage, setOrderLanguage] = useState<LanguageMode>('en');
  const [theme, setTheme] = useState<ThemeMode>('light');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [logoImage, setLogoImage] = useState('');

  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryRadius, setDeliveryRadius] = useState('5');
  const [deliveryMinimum, setDeliveryMinimum] = useState('0');

  const [categories, setCategories] = useState<BuilderCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [expanded, setExpanded] = useState<ExpandedSection>(null);

  const copy = COPY[builderLanguage];
  const normalizedSlug = useMemo(() => slugify(name), [name]);
  const previewLink = normalizedSlug ? `/store/${normalizedSlug}` : '';

  useEffect(() => {
    setSlug(normalizedSlug);
  }, [normalizedSlug]);

  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? window.localStorage.getItem('menuflow_builder_language') : null;
    if (stored === 'en' || stored === 'es') setBuilderLanguage(stored);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('menuflow_builder_language', builderLanguage);
    }
  }, [builderLanguage]);

  useEffect(() => {
    let active = true;

    async function loadBuilderData() {
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
          .select(`
            id,
            owner_id,
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
            delivery_minimum
          `)
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
          setSlug(row.slug || slugify(row.name || ''));
          setPhone(row.phone || '');
          setAddress(row.address || '');
          setHeroImage(row.hero_image || '');
          setLogoImage(row.logo_image || '');
          setTheme((row.storefront_theme as ThemeMode) || 'light');
          setStorefrontLanguage((row.storefront_language || 'en') === 'es' ? 'es' : 'en');
          setOrderLanguage((row.order_language || 'EN').toString().toUpperCase() === 'ES' ? 'es' : 'en');
          setPickupEnabled(row.pickup_enabled ?? true);
          setDeliveryEnabled(row.delivery_enabled ?? false);
          setDeliveryFee(String(row.delivery_fee ?? 0));
          setDeliveryRadius(String(row.delivery_radius ?? 5));
          setDeliveryMinimum(String(row.delivery_minimum ?? 0));
        }

        if (currentRestaurantId) {
          await loadMenuBuilder(currentRestaurantId, active);
        } else {
          const starter = getEmptyStarter(copy);
          setCategories(starter);
          setSelectedCategoryId(starter[0].id);
          setSelectedItemId(starter[0].items[0].id);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : copy.couldNotLoad;
        setError(message || copy.couldNotLoad);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBuilderData();

    return () => {
      active = false;
    };
  }, [router, copy.couldNotLoad]);

  async function loadMenuBuilder(currentRestaurantId: string, active = true) {
    const { data: categoryData, error: categoryError } = await supabase
      .from('menu_categories')
      .select('id, restaurant_id, name, sort_order')
      .eq('restaurant_id', currentRestaurantId)
      .order('sort_order', { ascending: true });

    if (categoryError) throw categoryError;

    const { data: itemData, error: itemError } = await supabase
      .from('menu_items')
      .select(
        'id, restaurant_id, category_id, name, description, price, base_price, image_url, availability, is_available, sort_order'
      )
      .eq('restaurant_id', currentRestaurantId)
      .order('sort_order', { ascending: true });

    if (itemError) throw itemError;

    const itemRows = safeArray(itemData) as ItemRow[];
    const itemIds = itemRows.map((item) => item.id);

    let groupData: OptionGroupRow[] = [];
    let choiceData: OptionChoiceRow[] = [];

    if (itemIds.length) {
      const { data: groups, error: groupError } = await supabase
        .from('menu_option_groups')
        .select('id, item_id, name, is_required, is_multiple, selection_mode, sort_order')
        .in('item_id', itemIds)
        .order('sort_order', { ascending: true });

      if (groupError) throw groupError;
      groupData = safeArray(groups) as OptionGroupRow[];

      const groupIds = groupData.map((group) => group.id);

      if (groupIds.length) {
        const { data: choices, error: choiceError } = await supabase
          .from('menu_option_choices')
          .select('id, option_group_id, name, price, price_delta, sort_order')
          .in('option_group_id', groupIds)
          .order('sort_order', { ascending: true });

        if (choiceError) throw choiceError;
        choiceData = safeArray(choices) as OptionChoiceRow[];
      }
    }

    if (!active) return;

    const mappedCategories: BuilderCategory[] = safeArray(categoryData).map((category, categoryIndex) => {
      const row = category as CategoryRow;

      const categoryItems: BuilderItem[] = itemRows
        .filter((item) => item.category_id === row.id)
        .map((item) => ({
          id: item.id,
          category_id: row.id,
          name: item.name || '',
          base_price: String(item.base_price ?? item.price ?? 0),
          description: item.description || '',
          image_url: item.image_url || '',
          availability: normalizeAvailability(item),
          option_groups: groupData
            .filter((group) => group.item_id === item.id)
            .map((group) => ({
              id: group.id,
              name: group.name || copy.optionGroups,
              presetType: 'custom',
              required: !!group.is_required,
              selection: normalizeSelectionMode(group),
              options: choiceData
                .filter((choice) => choice.option_group_id === group.id)
                .map((choice) => ({
                  id: choice.id,
                  name: choice.name || copy.newChoice,
                  price: String(choice.price_delta ?? choice.price ?? 0),
                })),
            })),
        }));

      return {
        id: row.id,
        name: row.name || `${copy.menu} ${categoryIndex + 1}`,
        sort_order: row.sort_order ?? categoryIndex,
        items: categoryItems,
      };
    });

    if (mappedCategories.length) {
      setCategories(mappedCategories);
      setSelectedCategoryId(mappedCategories[0].id);
      setSelectedItemId(mappedCategories[0].items[0]?.id || '');
    } else {
      const starter = getEmptyStarter(copy);
      setCategories(starter);
      setSelectedCategoryId(starter[0].id);
      setSelectedItemId(starter[0].items[0].id);
    }
  }

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const selectedItem = useMemo(() => {
    const allItems = categories.flatMap((category) => category.items);
    return allItems.find((item) => item.id === selectedItemId) || allItems[0] || null;
  }, [categories, selectedItemId]);

  function toggleSection(section: SectionKey) {
    setExpanded((current) => (current === section ? null : section));
  }

  function selectCategory(categoryId: string) {
    const category = categories.find((entry) => entry.id === categoryId);
    setSelectedCategoryId(categoryId);
    setSelectedItemId(category?.items[0]?.id || '');
    setExpanded('menu');
  }

  function selectItem(itemId: string) {
    setSelectedItemId(itemId);
    setExpanded('item');
  }

  async function uploadToBucket(file: File, bucket: 'heroes' | 'logos' | 'menu-items') {
    const ext = file.name.split('.').pop() || 'jpg';
    const safeOwnerId = ownerId || 'owner';
    const path = `${safeOwnerId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

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
      setSuccess('');
      const url = await uploadToBucket(file, 'heroes');
      setHeroImage(url);
      setExpanded('branding');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.couldNotUploadHero;
      setError(message || copy.couldNotUploadHero);
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError('');
      setSuccess('');
      const url = await uploadToBucket(file, 'logos');
      setLogoImage(url);
      setExpanded('branding');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.couldNotUploadLogo;
      setError(message || copy.couldNotUploadLogo);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleItemImageUpload(itemId: string, file: File | null) {
    if (!file) return;

    try {
      setUploadingItemId(itemId);
      setError('');
      setSuccess('');
      const url = await uploadToBucket(file, 'menu-items');

      setCategories((current) =>
        current.map((category) => ({
          ...category,
          items: category.items.map((item) => (item.id === itemId ? { ...item, image_url: url } : item)),
        }))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.couldNotUploadItem;
      setError(message || copy.couldNotUploadItem);
    } finally {
      setUploadingItemId(null);
    }
  }

  function removeHeroImage() {
    setHeroImage('');
  }

  function removeLogoImage() {
    setLogoImage('');
  }

  function removeItemImage(itemId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) => (item.id === itemId ? { ...item, image_url: '' } : item)),
      }))
    );
  }

  function addCategory() {
    const newCategoryId = uid('cat');
    const newItemId = uid('item');

    const newCategory: BuilderCategory = {
      id: newCategoryId,
      name: 'Featured',
      sort_order: categories.length,
      items: [
        {
          id: newItemId,
          category_id: newCategoryId,
          name: copy.itemNameFallback,
          base_price: '12',
          description: copy.describeItem,
          image_url: '',
          availability: 'available',
          option_groups: [],
        },
      ],
    };

    setCategories((current) => [...current, newCategory]);
    setSelectedCategoryId(newCategoryId);
    setSelectedItemId(newItemId);
    setExpanded('menu');
  }

  function updateCategory(categoryId: string, value: string) {
    setCategories((current) =>
      current.map((category) => (category.id === categoryId ? { ...category, name: value } : category))
    );
  }

  function deleteCategory(categoryId: string) {
    const next = categories.filter((category) => category.id !== categoryId);
    setCategories(next);
    setSelectedCategoryId(next[0]?.id || '');
    setSelectedItemId(next[0]?.items[0]?.id || '');
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
                  name: copy.itemNameFallback,
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
    setExpanded('item');
  }

  function updateItem(itemId: string, patch: Partial<BuilderItem>) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      }))
    );
  }

  function deleteItem(categoryId: string, itemId: string) {
    const nextCategories = categories.map((category) =>
      category.id === categoryId ? { ...category, items: category.items.filter((item) => item.id !== itemId) } : category
    );

    setCategories(nextCategories);

    const nextCategory = nextCategories.find((category) => category.items.length) || null;
    setSelectedCategoryId(nextCategory?.id || '');
    setSelectedItemId(nextCategory?.items[0]?.id || '');
  }

  function addOptionGroup(itemId: string, presetType: BuilderOptionGroup['presetType']) {
    const groupId = uid('group');

    const labelMap: Record<BuilderOptionGroup['presetType'], string> = {
      protein: copy.protein,
      size: copy.size,
      drink: copy.drink,
      extras: copy.extras,
      removals: copy.removals,
      custom: copy.custom,
    };

    const group: BuilderOptionGroup = {
      id: groupId,
      name: labelMap[presetType],
      presetType,
      required: false,
      selection: presetType === 'extras' || presetType === 'removals' ? 'multiple' : 'single',
      options: getPresetOptions(presetType).map((option, index) => ({
        id: `${groupId}_opt_${index}`,
        name: option.name,
        price: option.price,
      })),
    };

    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId ? { ...item, option_groups: [...item.option_groups, group] } : item
        ),
      }))
    );

    setExpanded('options');
  }

  function updateOptionGroup(itemId: string, groupId: string, patch: Partial<BuilderOptionGroup>) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
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
            ? { ...item, option_groups: item.option_groups.filter((group) => group.id !== groupId) }
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
                    ? { ...group, options: [...group.options, { id: optionId, name: copy.newChoice, price: '0' }] }
                    : group
                ),
              }
            : item
        ),
      }))
    );
  }

  function updateOptionChoice(itemId: string, groupId: string, optionId: string, patch: Partial<BuilderOption>) {
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
                        options: group.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option)),
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
                    ? { ...group, options: group.options.filter((option) => option.id !== optionId) }
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
        slug: slugify(name) || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        hero_image: heroImage.trim() || null,
        logo_image: logoImage.trim() || null,
        storefront_theme: theme,
        storefront_language: storefrontLanguage,
        order_language: orderLanguage === 'es' ? 'ES' : 'EN',
        pickup_enabled: pickupEnabled,
        delivery_enabled: deliveryEnabled,
        delivery_fee: Number(deliveryFee || 0),
        delivery_radius: Number(deliveryRadius || 0),
        delivery_minimum: Number(deliveryMinimum || 0),
      };

      let currentRestaurantId = restaurantId;

      if (restaurantId) {
        const { error: updateError } = await supabase.from('restaurants').update(restaurantPayload).eq('id', restaurantId);
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

      const { data: existingCategories, error: existingCategoriesError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', currentRestaurantId);

      if (existingCategoriesError) throw existingCategoriesError;

      const { data: existingItems, error: existingItemsError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('restaurant_id', currentRestaurantId);

      if (existingItemsError) throw existingItemsError;

      const existingCategoryIds = safeArray(existingCategories).map((row: { id: string }) => row.id);
      const existingItemIds = safeArray(existingItems).map((row: { id: string }) => row.id);

            if (existingItemIds.length) {
        const { data: existingGroups, error: existingGroupsError } = await supabase
          .from('menu_option_groups')
          .select('id')
          .in('item_id', existingItemIds);

        if (existingGroupsError) throw existingGroupsError;

        const existingGroupIds = safeArray(existingGroups).map((row: { id: string }) => row.id);

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

        const { error: deleteItemsError } = await supabase
          .from('menu_items')
          .delete()
          .in('id', existingItemIds);

        if (deleteItemsError) throw deleteItemsError;
      }

      if (existingCategoryIds.length) {
        const { error: deleteCategoriesError } = await supabase
          .from('menu_categories')
          .delete()
          .in('id', existingCategoryIds);

        if (deleteCategoriesError) throw deleteCategoriesError;
      }

      const allCategories = categories.map((category, categoryIndex) => ({
        id: category.id,
        restaurant_id: currentRestaurantId,
        name: category.name.trim() || `Category ${categoryIndex + 1}`,
        sort_order: categoryIndex,
      }));

      if (allCategories.length) {
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
          name: item.name.trim() || 'Item',
          base_price: Number(item.base_price || 0),
          price: Number(item.base_price || 0),
          description: item.description.trim() || null,
          image_url: item.image_url || null,
          availability: item.availability,
          is_available: item.availability === 'available',
          sort_order: itemIndex + categoryIndex * 100,
        }))
      );

      if (allItems.length) {
        const { error: itemInsertError } = await supabase
          .from('menu_items')
          .insert(allItems);

        if (itemInsertError) throw itemInsertError;
      }

      const allOptionGroups = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.option_groups.map((group, groupIndex) => ({
            id: group.id,
            item_id: item.id,
            name: group.name.trim() || 'Options',
            is_required: group.required,
            is_multiple: group.selection === 'multiple',
            selection_mode: group.selection,
            sort_order: groupIndex,
          }))
        )
      );

      if (allOptionGroups.length) {
        const { error: groupInsertError } = await supabase
          .from('menu_option_groups')
          .insert(allOptionGroups);

        if (groupInsertError) throw groupInsertError;
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

      setSuccess(copy.builderSaved);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.couldNotSave;
      setError(message || copy.couldNotSave);
    } finally {
      setSaving(false);
    }
  }

  function handleGoLive() {
    setError('');
    setSuccess('');

    if (!stripeConnected) {
      setError(copy.stripeNeeded);
      return;
    }

    setSuccess('Store ready to go live.');
  }

  const qrValue =
    typeof window !== 'undefined' && slug
      ? `${window.location.origin}/store/${slug}`
      : `/store/${slug || 'your-store'}`;

  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrValue)}`;

  const currentFee = getPlanFee(plan);

  if (loading) {
    return (
      <main className="page">
        <div className="shell">
          <div className="notch" />
          <div className="loadingCard">{copy.loading}</div>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            background: #eef1f5;
            padding: 16px 12px 28px;
            display: grid;
            place-items: start center;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .shell {
            width: min(100%, 430px);
            background: #ffffff;
            border: 1px solid rgba(15, 23, 42, 0.08);
            border-radius: 34px;
            box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
            padding: 14px;
          }
          .notch {
            width: 122px;
            height: 8px;
            border-radius: 999px;
            background: #0f172a;
            margin: 2px auto 16px;
          }
          .loadingCard {
            border-radius: 18px;
            padding: 20px;
            background: #f8fafc;
            border: 1px solid rgba(15, 23, 42, 0.08);
            color: #111827;
            font-size: 18px;
            font-weight: 900;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell">
        <div className="notch" />

        <div className="topBar">
          <div className="brand">
            <span className="brandStrong">MENUFLOW</span>
            <span className="brandSoft"> BUILDER</span>
          </div>

          <div className="topActions">
            <button
              type="button"
              className="langButton"
              onClick={() => setBuilderLanguage(builderLanguage === 'en' ? 'es' : 'en')}
            >
              {builderLanguage.toUpperCase()}
            </button>

            <button type="button" className="saveButton" onClick={handleSave} disabled={saving}>
              {saving ? copy.saving : copy.save}
            </button>
          </div>
        </div>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <section className="hero">
          {heroImage ? <img src={heroImage} alt="Hero" className="heroImage" /> : <div className="heroImage heroFallback" />}
          <div className="heroOverlay" />

          <div className="heroContent">
            <div className="heroIdentity">
              {logoImage ? (
                <img src={logoImage} alt="Logo" className="heroLogo" />
              ) : (
                <div className="heroLogo heroLogoFallback">{(name.trim() || 'M').charAt(0).toUpperCase()}</div>
              )}

              <div>
                <div className="heroName">{name.trim() || 'Your Store'}</div>
                <div className="heroStatus">
                  {stripeConnected ? copy.stripeConnected : copy.stripeNeeded}
                </div>
              </div>
            </div>

            <div className="heroMeta">
              <span>{address.trim() || '123 Main St, Los Angeles, CA'}</span>
              <span>{phone.trim() || '323-555-1234'}</span>
            </div>
          </div>
        </section>

        <section className="intro">
          <h1 className="title">{copy.title}</h1>
          <p className="subtitle">{copy.subtitle}</p>

          <div className="topButtons">
            {previewLink ? (
              <Link href={previewLink} target="_blank" className="previewButton">
                {copy.previewStore}
              </Link>
            ) : (
              <button type="button" className="previewButton" disabled>
                {copy.previewStore}
              </button>
            )}

            <button type="button" className="goLiveButton" onClick={handleGoLive}>
              {copy.goLive}
            </button>
          </div>
        </section>

        <div className="sectionTabs">
          <BuilderSectionButton active={tab === 'store'} onClick={() => setTab('store')} icon="⌂" label={copy.storeSetup} />
          <BuilderSectionButton active={tab === 'branding'} onClick={() => setTab('branding')} icon="▣" label={copy.branding} />
          <BuilderSectionButton active={tab === 'settings'} onClick={() => setTab('settings')} icon="◐" label={copy.settings} />
          <BuilderSectionButton active={tab === 'menu'} onClick={() => setTab('menu')} icon="▦" label={copy.menuBuilder} />
          <BuilderSectionButton active={tab === 'flyers'} onClick={() => setTab('flyers')} icon="✦" label={copy.flyers} />
        </div>

        {tab === 'store' ? (
          <section className="card">
            <div className="cardHeader">
              <div className="cardTitleWrap">
                <MiniIcon>⌂</MiniIcon>
                <h2 className="cardTitle">{copy.storeSetup}</h2>
              </div>
            </div>

            <div className="fieldGrid">
              <label className="field">
                <span className="label">{copy.storeName}</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <div className="infoCard">
                <span className="label">{copy.liveUrl}</span>
                <strong>{slug ? `/store/${slug}` : '/store/your-store'}</strong>
              </div>

              <label className="field">
                <span className="label">{copy.phone}</span>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>

              <label className="field">
                <span className="label">{copy.address}</span>
                <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
            </div>
          </section>
        ) : null}

        {tab === 'branding' ? (
          <section className="card">
            <div className="cardHeader">
              <div className="cardTitleWrap">
                <MiniIcon>▣</MiniIcon>
                <h2 className="cardTitle">{copy.branding}</h2>
              </div>
            </div>

            <div className="fieldGrid">
              <div className="uploadCard">
                <div className="uploadTitle">{copy.uploadHeroImage}</div>
                <label className="primaryButton">
                  {uploadingHero ? copy.saving : copy.uploadHeroImage}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => void handleHeroUpload(e.target.files?.[0] || null)}
                  />
                </label>
                <button type="button" className="secondaryButton" onClick={() => setHeroImage('')}>
                  {copy.removeImage}
                </button>
                {heroImage ? (
                  <img src={heroImage} alt="Hero" className="uploadPreview" />
                ) : (
                  <div className="uploadPreviewPlaceholder">{copy.uploadHeroImage}</div>
                )}
              </div>

              <div className="uploadCard">
                <div className="uploadTitle">{copy.uploadLogo}</div>
                <label className="primaryButton">
                  {uploadingLogo ? copy.saving : copy.uploadLogo}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => void handleLogoUpload(e.target.files?.[0] || null)}
                  />
                </label>
                <button type="button" className="secondaryButton" onClick={() => setLogoImage('')}>
                  {copy.removeImage}
                </button>
                {logoImage ? (
                  <img src={logoImage} alt="Logo" className="uploadPreview" />
                ) : (
                  <div className="uploadPreviewPlaceholder">{copy.uploadLogo}</div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'settings' ? (
          <section className="card">
            <div className="cardHeader">
              <div className="cardTitleWrap">
                <MiniIcon>◐</MiniIcon>
                <h2 className="cardTitle">{copy.settings}</h2>
              </div>
            </div>

            <div className="fieldGrid">
              <div className="field">
                <span className="label">{copy.theme}</span>
                <div className="chipRow">
                  <button type="button" className={theme === 'light' ? 'chip chipActive' : 'chip'} onClick={() => setTheme('light')}>
                    {copy.light}
                  </button>
                  <button type="button" className={theme === 'dark' ? 'chip chipActive' : 'chip'} onClick={() => setTheme('dark')}>
                    {copy.dark}
                  </button>
                </div>
              </div>

              <div className="field">
                <span className="label">{copy.storefrontLanguage}</span>
                <div className="chipRow">
                  <button
                    type="button"
                    className={storefrontLanguage === 'en' ? 'chip chipActive' : 'chip'}
                    onClick={() => setStorefrontLanguage('en')}
                  >
                    {copy.english}
                  </button>
                  <button
                    type="button"
                    className={storefrontLanguage === 'es' ? 'chip chipActive' : 'chip'}
                    onClick={() => setStorefrontLanguage('es')}
                  >
                    {copy.spanish}
                  </button>
                </div>
              </div>

              <div className="field">
                <span className="label">{copy.orderLanguage}</span>
                <div className="chipRow">
                  <button
                    type="button"
                    className={orderLanguage === 'en' ? 'chip chipActive' : 'chip'}
                    onClick={() => setOrderLanguage('en')}
                  >
                    {copy.english}
                  </button>
                  <button
                    type="button"
                    className={orderLanguage === 'es' ? 'chip chipActive' : 'chip'}
                    onClick={() => setOrderLanguage('es')}
                  >
                    {copy.spanish}
                  </button>
                </div>
              </div>

              <div className="field">
                <span className="label">{copy.pickup} / {copy.delivery}</span>
                <div className="chipRow">
                  <button type="button" className={pickupEnabled ? 'chip chipActive' : 'chip'} onClick={() => setPickupEnabled((v) => !v)}>
                    {copy.pickup}
                  </button>
                  <button type="button" className={deliveryEnabled ? 'chip chipActive' : 'chip'} onClick={() => setDeliveryEnabled((v) => !v)}>
                    {copy.delivery}
                  </button>
                </div>
              </div>

              <label className="field">
                <span className="label">{copy.deliveryFee}</span>
                <input className="input" value={deliveryFee} onChange={(e) => setDeliveryFee(sanitizeNumberInput(e.target.value))} />
              </label>

              <label className="field">
                <span className="label">{copy.deliveryRadius}</span>
                <input className="input" value={deliveryRadius} onChange={(e) => setDeliveryRadius(sanitizeNumberInput(e.target.value))} />
              </label>

              <label className="field">
                <span className="label">{copy.deliveryMinimum}</span>
                <input className="input" value={deliveryMinimum} onChange={(e) => setDeliveryMinimum(sanitizeNumberInput(e.target.value))} />
              </label>

              <div className="field">
                <span className="label">{copy.plan}</span>
                <div className="planStack">
                  <button type="button" className={plan === 'starter' ? 'planCard planCardActive' : 'planCard'} onClick={() => setPlan('starter')}>
                    <strong>{copy.starter}</strong>
                    <span>{copy.starterMeta}</span>
                  </button>
                  <button type="button" className={plan === 'growth' ? 'planCard planCardActive' : 'planCard'} onClick={() => setPlan('growth')}>
                    <strong>{copy.growth}</strong>
                    <span>{copy.growthMeta}</span>
                  </button>
                  <button type="button" className={plan === 'premium' ? 'planCard planCardActive' : 'planCard'} onClick={() => setPlan('premium')}>
                    <strong>{copy.premium}</strong>
                    <span>{copy.premiumMeta}</span>
                  </button>
                </div>
              </div>

              <div className="infoCard">
                <span className="label">{copy.placeholderLimitTitle}</span>
                <strong>{plan === 'starter' ? copy.placeholderLimitStarter : copy.placeholderLimitUnlimited}</strong>
              </div>

              <div className="infoCard">
                <span className="label">{copy.placeholderUsed}</span>
                <strong>{placeholderCount}{plan === 'starter' ? '/6' : ''}</strong>
              </div>

              <div className="infoCard">
                <span className="label">MenuFlow Fee</span>
                <strong>{currentFee.percent} per order • {currentFee.monthly}</strong>
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'menu' ? (
          <section className="card">
            <div className="cardHeader spaceBetween">
              <div className="cardTitleWrap">
                <MiniIcon>▦</MiniIcon>
                <h2 className="cardTitle">{copy.menuBuilder}</h2>
              </div>
              <button type="button" className="primaryButton" onClick={addCategory}>
                {copy.addCategory}
              </button>
            </div>

            <div className="categoryStack">
              {categories.map((category) => (
                <div key={category.id} className="categoryCard">
                  <div className="categoryTop">
                    <input
                      className="input compactInput"
                      value={category.name}
                      onChange={(e) =>
                        setCategories((current) =>
                          current.map((entry) =>
                            entry.id === category.id ? { ...entry, name: e.target.value } : entry
                          )
                        )
                      }
                      placeholder={copy.categoryName}
                    />
                    <button
                      type="button"
                      className="dangerButton"
                      onClick={() =>
                        setCategories((current) => current.filter((entry) => entry.id !== category.id))
                      }
                    >
                      {copy.deleteCategory}
                    </button>
                  </div>

                  <button type="button" className="primaryWide" onClick={() => addItem(category.id)}>
                    {copy.addItem}
                  </button>

                  <div className="itemStack">
                    {category.items.map((item) => (
                      <div key={item.id} className="itemCard">
                        <div className="itemPreviewWrap">
                          <img
                            src={item.image_url || getFallbackImage(category.name, item.id)}
                            alt={item.name || copy.itemName}
                            className="itemPreview"
                          />
                        </div>

                        <label className="field">
                          <span className="label">{copy.itemName}</span>
                          <input
                            className="input compactInput"
                            value={item.name}
                            onChange={(e) =>
                              setCategories((current) =>
                                current.map((entry) => ({
                                  ...entry,
                                  items: entry.items.map((entryItem) =>
                                    entryItem.id === item.id ? { ...entryItem, name: e.target.value } : entryItem
                                  ),
                                }))
                              )
                            }
                          />
                        </label>

                        <label className="field">
                          <span className="label">{copy.basePrice}</span>
                          <input
                            className="input compactInput"
                            value={item.base_price}
                            onChange={(e) =>
                              setCategories((current) =>
                                current.map((entry) => ({
                                  ...entry,
                                  items: entry.items.map((entryItem) =>
                                    entryItem.id === item.id
                                      ? { ...entryItem, base_price: sanitizeNumberInput(e.target.value) }
                                      : entryItem
                                  ),
                                }))
                              )
                            }
                          />
                        </label>

                        <label className="field">
                          <span className="label">{copy.description}</span>
                          <textarea
                            className="textarea"
                            value={item.description}
                            onChange={(e) =>
                              setCategories((current) =>
                                current.map((entry) => ({
                                  ...entry,
                                  items: entry.items.map((entryItem) =>
                                    entryItem.id === item.id ? { ...entryItem, description: e.target.value } : entryItem
                                  ),
                                }))
                              )
                            }
                          />
                        </label>

                        <div className="field">
                          <span className="label">{copy.availability}</span>
                          <div className="chipRow">
                            <button
                              type="button"
                              className={item.availability === 'available' ? 'chip chipActive' : 'chip'}
                              onClick={() =>
                                setCategories((current) =>
                                  current.map((entry) => ({
                                    ...entry,
                                    items: entry.items.map((entryItem) =>
                                      entryItem.id === item.id ? { ...entryItem, availability: 'available' } : entryItem
                                    ),
                                  }))
                                )
                              }
                            >
                              {copy.available}
                            </button>
                            <button
                              type="button"
                              className={item.availability === 'sold_out' ? 'chip chipActive' : 'chip'}
                              onClick={() =>
                                setCategories((current) =>
                                  current.map((entry) => ({
                                    ...entry,
                                    items: entry.items.map((entryItem) =>
                                      entryItem.id === item.id ? { ...entryItem, availability: 'sold_out' } : entryItem
                                    ),
                                  }))
                                )
                              }
                            >
                              {copy.soldOut}
                            </button>
                          </div>
                        </div>

                        <div className="imageButtons">
                          <label className="primaryButton">
                            {uploadingItemId === item.id ? copy.saving : copy.uploadItemImage}
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => void handleItemUpload(item.id, e.target.files?.[0] || null)}
                            />
                          </label>

                          <button type="button" className="secondaryButton" onClick={() => usePlaceholderForItem(item.id)}>
                            {copy.usePlaceholder}
                          </button>
                        </div>

                        <div className="optionArea">
                          <div className="optionAreaTop">
                            <strong>{copy.optionGroups}</strong>
                            <button type="button" className="secondaryButton" onClick={() => addOptionGroup(item.id)}>
                              {copy.addOptionGroup}
                            </button>
                          </div>

                          {item.option_groups.map((group) => (
                            <div key={group.id} className="optionGroupCard">
                              <input
                                className="input compactInput"
                                value={group.name}
                                onChange={(e) =>
                                  setCategories((current) =>
                                    current.map((entry) => ({
                                      ...entry,
                                      items: entry.items.map((entryItem) =>
                                        entryItem.id === item.id
                                          ? {
                                              ...entryItem,
                                              option_groups: entryItem.option_groups.map((entryGroup) =>
                                                entryGroup.id === group.id ? { ...entryGroup, name: e.target.value } : entryGroup
                                              ),
                                            }
                                          : entryItem
                                      ),
                                    }))
                                  )
                                }
                                placeholder={copy.optionGroupName}
                              />

                              <div className="chipRow">
                                <button
                                  type="button"
                                  className={group.required ? 'chip chipActive' : 'chip'}
                                  onClick={() =>
                                    setCategories((current) =>
                                      current.map((entry) => ({
                                        ...entry,
                                        items: entry.items.map((entryItem) =>
                                          entryItem.id === item.id
                                            ? {
                                                ...entryItem,
                                                option_groups: entryItem.option_groups.map((entryGroup) =>
                                                  entryGroup.id === group.id
                                                    ? { ...entryGroup, required: !entryGroup.required }
                                                    : entryGroup
                                                ),
                                              }
                                            : entryItem
                                        ),
                                      }))
                                    )
                                  }
                                >
                                  {group.required ? copy.required : copy.optional}
                                </button>

                                <button
                                  type="button"
                                  className={group.selection === 'single' ? 'chip chipActive' : 'chip'}
                                  onClick={() =>
                                    setCategories((current) =>
                                      current.map((entry) => ({
                                        ...entry,
                                        items: entry.items.map((entryItem) =>
                                          entryItem.id === item.id
                                            ? {
                                                ...entryItem,
                                                option_groups: entryItem.option_groups.map((entryGroup) =>
                                                  entryGroup.id === group.id
                                                    ? { ...entryGroup, selection: 'single' }
                                                    : entryGroup
                                                ),
                                              }
                                            : entryItem
                                        ),
                                      }))
                                    )
                                  }
                                >
                                  {copy.single}
                                </button>

                                <button
                                  type="button"
                                  className={group.selection === 'multiple' ? 'chip chipActive' : 'chip'}
                                  onClick={() =>
                                    setCategories((current) =>
                                      current.map((entry) => ({
                                        ...entry,
                                        items: entry.items.map((entryItem) =>
                                          entryItem.id === item.id
                                            ? {
                                                ...entryItem,
                                                option_groups: entryItem.option_groups.map((entryGroup) =>
                                                  entryGroup.id === group.id
                                                    ? { ...entryGroup, selection: 'multiple' }
                                                    : entryGroup
                                                ),
                                              }
                                            : entryItem
                                        ),
                                      }))
                                    )
                                  }
                                >
                                  {copy.multiple}
                                </button>

                                <button
                                  type="button"
                                  className="dangerButton"
                                  onClick={() =>
                                    setCategories((current) =>
                                      current.map((entry) => ({
                                        ...entry,
                                        items: entry.items.map((entryItem) =>
                                          entryItem.id === item.id
                                            ? {
                                                ...entryItem,
                                                option_groups: entryItem.option_groups.filter((entryGroup) => entryGroup.id !== group.id),
                                              }
                                            : entryItem
                                        ),
                                      }))
                                    )
                                  }
                                >
                                  {copy.delete}
                                </button>
                              </div>

                              <div className="choiceStack">
                                {group.options.map((choice) => (
                                  <div key={choice.id} className="choiceRow">
                                    <input
                                      className="input compactInput choiceName"
                                      value={choice.name}
                                      onChange={(e) =>
                                        setCategories((current) =>
                                          current.map((entry) => ({
                                            ...entry,
                                            items: entry.items.map((entryItem) =>
                                              entryItem.id === item.id
                                                ? {
                                                    ...entryItem,
                                                    option_groups: entryItem.option_groups.map((entryGroup) =>
                                                      entryGroup.id === group.id
                                                        ? {
                                                            ...entryGroup,
                                                            options: entryGroup.options.map((entryChoice) =>
                                                              entryChoice.id === choice.id
                                                                ? { ...entryChoice, name: e.target.value }
                                                                : entryChoice
                                                            ),
                                                          }
                                                        : entryGroup
                                                    ),
                                                  }
                                                : entryItem
                                            ),
                                          }))
                                        )
                                      }
                                      placeholder={copy.choiceName}
                                    />

                                    <input
                                      className="input compactInput choicePrice"
                                      value={choice.price}
                                      onChange={(e) =>
                                        setCategories((current) =>
                                          current.map((entry) => ({
                                            ...entry,
                                            items: entry.items.map((entryItem) =>
                                              entryItem.id === item.id
                                                ? {
                                                    ...entryItem,
                                                    option_groups: entryItem.option_groups.map((entryGroup) =>
                                                      entryGroup.id === group.id
                                                        ? {
                                                            ...entryGroup,
                                                            options: entryGroup.options.map((entryChoice) =>
                                                              entryChoice.id === choice.id
                                                                ? { ...entryChoice, price: sanitizeNumberInput(e.target.value) }
                                                                : entryChoice
                                                            ),
                                                          }
                                                        : entryGroup
                                                    ),
                                                  }
                                                : entryItem
                                            ),
                                          }))
                                        )
                                      }
                                      placeholder={copy.choicePrice}
                                    />

                                    <button
                                      type="button"
                                      className="dangerButton"
                                      onClick={() =>
                                        setCategories((current) =>
                                          current.map((entry) => ({
                                            ...entry,
                                            items: entry.items.map((entryItem) =>
                                              entryItem.id === item.id
                                                ? {
                                                    ...entryItem,
                                                    option_groups: entryItem.option_groups.map((entryGroup) =>
                                                      entryGroup.id === group.id
                                                        ? {
                                                            ...entryGroup,
                                                            options: entryGroup.options.filter((entryChoice) => entryChoice.id !== choice.id),
                                                          }
                                                        : entryGroup
                                                    ),
                                                  }
                                                : entryItem
                                            ),
                                          }))
                                        )
                                      }
                                    >
                                      {copy.delete}
                                    </button>
                                  </div>
                                ))}

                                <button type="button" className="secondaryButton" onClick={() => addChoice(item.id, group.id)}>
                                  {copy.addChoice}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="dangerWide"
                          onClick={() =>
                            setCategories((current) =>
                              current.map((entry) => ({
                                ...entry,
                                items: entry.items.filter((entryItem) => entryItem.id !== item.id),
                              }))
                            )
                          }
                        >
                          {copy.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === 'flyers' ? (
          <section className="card">
            <div className="cardHeader">
              <div className="cardTitleWrap">
                <MiniIcon>✦</MiniIcon>
                <h2 className="cardTitle">{copy.flyersTitle}</h2>
              </div>
            </div>

            <p className="flyerSub">{copy.flyersSubtitle}</p>

            <div className="freeFlyerCard">
              <div className="freeFlyerLeft">
                <div className="freeFlyerLabel">{copy.freeFlyer}</div>
                <p>{copy.freeFlyerText}</p>
                <button type="button" className="primaryButton">
                  {copy.downloadFlyer}
                </button>
              </div>

              <div className="qrPreview">
                <img src={qrImage} alt="QR Code" className="qrImage" />
              </div>
            </div>

            <div className="customFlyersHeader">
              <h3>{copy.customFlyers}</h3>
              <p>{copy.customFlyersText}</p>
            </div>

            <div className="flyerPackageStack">
              <button
                type="button"
                className={selectedFlyerPackage === '100' ? 'flyerPackageCard flyerPackageCardActive' : 'flyerPackageCard'}
                onClick={() => setSelectedFlyerPackage('100')}
              >
                <strong>{copy.package100}</strong>
                <span>{copy.package100Text}</span>
              </button>

              <button
                type="button"
                className={selectedFlyerPackage === '250' ? 'flyerPackageCard flyerPackageCardActive' : 'flyerPackageCard'}
                onClick={() => setSelectedFlyerPackage('250')}
              >
                <strong>{copy.package250}</strong>
                <span>{copy.package250Text}</span>
              </button>

              <button
                type="button"
                className={selectedFlyerPackage === '500' ? 'flyerPackageCard flyerPackageCardBest flyerPackageCardActive' : 'flyerPackageCard flyerPackageCardBest'}
                onClick={() => setSelectedFlyerPackage('500')}
              >
                <div className="bestValueTag">{copy.bestValue}</div>
                <strong>{copy.package500}</strong>
                <span>{copy.package500Text}</span>
              </button>
            </div>

            <div className="benefitsCard">
              <h3>{copy.benefitsTitle}</h3>
              <div className="benefitList">
                <span>✔ {copy.benefit1}</span>
                <span>✔ {copy.benefit2}</span>
                <span>✔ {copy.benefit3}</span>
                <span>✔ {copy.benefit4}</span>
                <span>✔ {copy.benefit5}</span>
              </div>
            </div>

            <button type="button" className="orderFlyersButton">
              {copy.selectPackage}
            </button>
          </section>
        ) : null}

        <nav className="bottomNav">
          <button type="button" className="navItem" onClick={() => router.push('/dashboard/owner')}>
            <span className="navDot" />
            <span>{copy.dashboard}</span>
          </button>
          <button type="button" className="navItem navItemActive" onClick={() => setTab('store')}>
            <span className="navDot" />
            <span>{copy.builder}</span>
          </button>
          <button type="button" className="navItem" onClick={() => previewLink && router.push(previewLink)}>
            <span className="navDot" />
            <span>{copy.preview}</span>
          </button>
          <button type="button" className="navItem" onClick={() => setTab('flyers')}>
            <span className="navDot" />
            <span>{copy.flyers}</span>
          </button>
          <button type="button" className="navItem" onClick={() => router.push('/dashboard/owner/orders')}>
            <span className="navDot" />
            <span>{copy.orders}</span>
          </button>
          <button type="button" className="navItem" onClick={() => router.push('/dashboard/owner/settings')}>
            <span className="navDot" />
            <span>{copy.more}</span>
          </button>
        </nav>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #eef1f5;
          padding: 16px 12px 28px;
          display: grid;
          place-items: start center;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .shell {
          width: min(100%, 430px);
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 34px;
          box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
          padding: 14px 14px 96px;
          position: relative;
          overflow: hidden;
        }

        .notch {
          width: 122px;
          height: 8px;
          border-radius: 999px;
          background: #0f172a;
          margin: 2px auto 16px;
        }

        .topBar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .brand {
          white-space: nowrap;
          min-width: 0;
          color: #111827;
          font-size: 19px;
          line-height: 1;
        }

        .brandStrong {
          font-weight: 900;
          letter-spacing: 0.02em;
        }

        .brandSoft {
          color: #6b7280;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .topActions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .langButton,
        .saveButton,
        .primaryButton,
        .secondaryButton,
        .primaryWide,
        .dangerButton,
        .dangerWide,
        .chip,
        .builderSectionTab,
        .planCard,
        .flyerPackageCard,
        .orderFlyersButton,
        .goLiveButton,
        .previewButton {
          min-height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          padding: 0 14px;
          background: #ffffff;
          color: #111827;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 800;
        }

        .saveButton,
        .primaryButton,
        .primaryWide,
        .goLiveButton,
        .orderFlyersButton {
          background: #0f172a;
          border-color: #0f172a;
          color: #ffffff;
        }

        .primaryWide,
        .dangerWide,
        .orderFlyersButton {
          width: 100%;
        }

        .secondaryButton {
          background: #f8fafc;
        }

        .dangerButton,
        .dangerWide {
          background: #f7e3e3;
          border-color: transparent;
          color: #a12e2e;
        }

        .message {
          margin-bottom: 12px;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 14px;
          font-weight: 800;
        }

        .error {
          color: #991b1b;
          background: #fbeaea;
          border: 1px solid rgba(153, 27, 27, 0.12);
        }

        .success {
          color: #166534;
          background: #ebf7ee;
          border: 1px solid rgba(22, 101, 52, 0.12);
        }

        .hero {
          position: relative;
          min-height: 188px;
          overflow: hidden;
          margin: 0 -14px;
          background: #111827;
        }

        .heroImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .heroFallback {
          background: linear-gradient(135deg, #1f2937 0%, #475569 100%);
        }

        .heroOverlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.64) 100%);
        }

        .heroContent {
          position: relative;
          z-index: 2;
          min-height: 188px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 14px 16px;
        }

        .heroIdentity {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .heroLogo {
          width: 58px;
          height: 58px;
          border-radius: 999px;
          background: #ffffff;
          object-fit: cover;
          flex-shrink: 0;
        }

        .heroLogoFallback {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111827;
          font-size: 24px;
          font-weight: 900;
        }

        .heroName {
          color: #ffffff;
          font-size: 24px;
          font-weight: 900;
        }

        .heroStatus {
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          font-weight: 700;
        }

        .heroMeta {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          color: rgba(255, 255, 255, 0.96);
          font-size: 14px;
          font-weight: 700;
        }

        .intro {
          padding: 18px 2px 14px;
        }

        .title {
          margin: 0;
          color: #111827;
          font-size: 26px;
          font-weight: 900;
        }

        .subtitle {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 15px;
          font-weight: 600;
        }

        .topButtons {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .sectionTabs {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }

        .builderSectionTab {
          min-height: 58px;
          flex-direction: column;
          padding: 8px 6px;
          font-size: 12px;
          border-radius: 14px;
        }

        .builderSectionTabActive {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        .miniIcon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #f3f4f6;
          color: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .builderSectionTabActive .miniIcon {
          background: rgba(255, 255, 255, 0.14);
        }

        .card {
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
          padding: 14px;
          display: grid;
          gap: 14px;
        }

        .cardHeader {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .spaceBetween {
          justify-content: space-between;
        }

        .cardTitleWrap {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .cardTitle {
          margin: 0;
          color: #111827;
          font-size: 18px;
          font-weight: 900;
        }

        .fieldGrid,
        .categoryStack,
        .itemStack,
        .planStack,
        .flyerPackageStack,
        .choiceStack {
          display: grid;
          gap: 12px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .label {
          color: #6b7280;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .infoCard {
          border-radius: 12px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid rgba(15, 23, 42, 0.08);
          display: grid;
          gap: 4px;
        }

        .infoCard strong {
          color: #111827;
          font-size: 16px;
          font-weight: 900;
          word-break: break-word;
        }

        .input,
        .textarea {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #ffffff;
          color: #111827;
          font-size: 16px;
          font-weight: 700;
          outline: none;
        }

        .input {
          min-height: 52px;
          padding: 0 14px;
        }

        .compactInput {
          min-height: 46px;
        }

        .textarea {
          min-height: 120px;
          padding: 14px;
          resize: vertical;
        }

        .chipRow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chip {
          padding: 0 18px;
        }

        .chipActive {
          background: #0f172a;
          border-color: #0f172a;
          color: #ffffff;
        }

        .uploadCard,
        .categoryCard,
        .itemCard,
        .optionGroupCard,
        .freeFlyerCard,
        .benefitsCard {
          border-radius: 14px;
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          display: grid;
          gap: 12px;
        }

        .uploadTitle,
        .flyerSub,
        .customFlyersHeader p {
          color: #111827;
          font-size: 15px;
          font-weight: 700;
          margin: 0;
        }

        .uploadPreview,
        .uploadPreviewPlaceholder,
        .itemPreview,
        .qrImage {
          width: 100%;
          border-radius: 14px;
          display: block;
        }

        .uploadPreview,
        .uploadPreviewPlaceholder {
          height: 180px;
          object-fit: cover;
        }

        .uploadPreviewPlaceholder {
          background: #eef1f5;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .categoryTop,
        .optionAreaTop,
        .choiceRow {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .itemPreviewWrap {
          width: 100%;
          aspect-ratio: 1.35 / 1;
          background: #eef1f5;
          border-radius: 14px;
          overflow: hidden;
        }

        .itemPreview {
          height: 100%;
          object-fit: cover;
        }

        .imageButtons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .optionArea {
          display: grid;
          gap: 12px;
        }

        .choiceName {
          flex: 1 1 auto;
        }

        .choicePrice {
          width: 110px;
          flex: 0 0 auto;
        }

        .freeFlyerCard {
          grid-template-columns: 1.1fr 0.9fr;
          align-items: center;
        }

        .freeFlyerLabel,
        .customFlyersHeader h3,
        .benefitsCard h3 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 900;
        }

        .freeFlyerLeft p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
        }

        .qrPreview {
          border-radius: 16px;
          background: #f8fafc;
          padding: 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .flyerPackageCard {
          width: 100%;
          text-align: left;
          justify-content: flex-start;
          min-height: 84px;
          padding: 14px;
          flex-direction: column;
          align-items: flex-start;
        }

        .flyerPackageCard strong {
          font-size: 18px;
        }

        .flyerPackageCard span {
          color: #6b7280;
          font-size: 14px;
          font-weight: 700;
        }

        .flyerPackageCardActive {
          border-color: #0f172a;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        }

        .flyerPackageCardBest {
          position: relative;
          background: linear-gradient(180deg, #fff8e8 0%, #ffffff 100%);
          border-color: rgba(194, 141, 24, 0.28);
        }

        .bestValueTag {
          position: absolute;
          top: -10px;
          right: 14px;
          background: #0f172a;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          border-radius: 999px;
          padding: 6px 10px;
        }

        .benefitList {
          display: grid;
          gap: 8px;
          color: #111827;
          font-size: 15px;
          font-weight: 700;
        }

        .bottomNav {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 14px;
          min-height: 72px;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.96);
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 4px;
          padding: 8px 6px;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(12px);
        }

        .navItem {
          min-height: 56px;
          border-radius: 12px;
          color: #6b7280;
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          background: transparent;
        }

        .navItemActive {
          background: #0f172a;
          color: #ffffff;
        }

        .navDot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          background: currentColor;
          display: inline-block;
        }
      `}</style>
    </main>
  );
}