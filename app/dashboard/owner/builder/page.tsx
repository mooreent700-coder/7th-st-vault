'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';
type OwnerPlan = 'starter' | 'growth' | 'premium';
type SectionKey =
  | 'store'
  | 'branding'
  | 'controls'
  | 'categories'
  | 'items'
  | 'options'
  | 'preview';

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
  plan?: OwnerPlan | null;
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
  appName: string;
  title: string;
  subtitle: string;
  loading: string;
  saving: string;
  save: string;
  saveSection: string;
  builderSaved: string;
  couldNotLoad: string;
  couldNotSave: string;
  couldNotUploadHero: string;
  couldNotUploadLogo: string;
  couldNotUploadItem: string;
  sectionTools: string;
  dashboard: string;
  storefront: string;
  settings: string;
  flyers: string;
  storeSetup: string;
  branding: string;
  controls: string;
  categories: string;
  itemBuilder: string;
  optionGroups: string;
  livePreview: string;
  storeName: string;
  slug: string;
  phone: string;
  address: string;
  liveUrl: string;
  uploadHeroImage: string;
  uploadLogo: string;
  uploadItemImage: string;
  removeHeroImage: string;
  removeLogoImage: string;
  removeItemImage: string;
  heroPreview: string;
  logoPreview: string;
  itemPreview: string;
  storefrontLanguage: string;
  ownerLanguage: string;
  storefrontTheme: string;
  ownerPlan: string;
  starter: string;
  growth: string;
  premium: string;
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
  addCategory: string;
  categoryName: string;
  addItem: string;
  itemName: string;
  itemNameFallback: string;
  basePrice: string;
  description: string;
  describeItem: string;
  availability: string;
  available: string;
  soldOut: string;
  deleteCategory: string;
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
  optionsEmpty: string;
  categoriesEmpty: string;
  itemsEmpty: string;
  openStore: string;
  noImage: string;
  itemDetails: string;
  addToCart: string;
};

const COPY: Record<LanguageMode, CopyBlock> = {
  en: {
    appName: 'MENUFLOW BUILDER',
    title: 'Build Your Store',
    subtitle: 'Owner control center for store setup, branding, menu, and preview.',
    loading: 'Loading builder...',
    saving: 'Saving...',
    save: 'Save',
    saveSection: 'Save Section',
    builderSaved: 'Builder saved.',
    couldNotLoad: 'Could not load builder.',
    couldNotSave: 'Could not save builder.',
    couldNotUploadHero: 'Could not upload hero image.',
    couldNotUploadLogo: 'Could not upload logo.',
    couldNotUploadItem: 'Could not upload item image.',
    sectionTools: 'Quick Tools',
    dashboard: 'Dashboard',
    storefront: 'Storefront',
    settings: 'Settings',
    flyers: 'Flyers & QR Codes',
    storeSetup: 'Store Setup',
    branding: 'Branding',
    controls: 'Store Controls',
    categories: 'Categories',
    itemBuilder: 'Item Builder',
    optionGroups: 'Option Groups',
    livePreview: 'Storefront Reflection',
    storeName: 'Store Name',
    slug: 'Slug',
    phone: 'Phone',
    address: 'Address',
    liveUrl: 'Live URL',
    uploadHeroImage: 'Upload Hero Image',
    uploadLogo: 'Upload Logo',
    uploadItemImage: 'Upload Item Image',
    removeHeroImage: 'Remove Hero',
    removeLogoImage: 'Remove Logo',
    removeItemImage: 'Remove Item Image',
    heroPreview: 'Hero Preview',
    logoPreview: 'Logo Preview',
    itemPreview: 'Item Preview',
    storefrontLanguage: 'Storefront Language',
    ownerLanguage: 'Owner Language',
    storefrontTheme: 'Storefront Theme',
    ownerPlan: 'Plan',
    starter: 'Starter',
    growth: 'Growth',
    premium: 'Premium',
    english: 'EN',
    spanish: 'ES',
    light: 'Light',
    dark: 'Dark',
    pickupOn: 'Pickup On',
    pickupOff: 'Pickup Off',
    deliveryOn: 'Delivery On',
    deliveryOff: 'Delivery Off',
    deliveryFee: 'Delivery Fee',
    deliveryRadius: 'Delivery Radius',
    deliveryMinimum: 'Delivery Minimum',
    addCategory: 'Add Category',
    categoryName: 'Category Name',
    addItem: 'Add Item',
    itemName: 'Item Name',
    itemNameFallback: 'New Item',
    basePrice: 'Base Price',
    description: 'Description',
    describeItem: 'Describe the item...',
    availability: 'Availability',
    available: 'Available',
    soldOut: 'Sold Out',
    deleteCategory: 'Delete Category',
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
    optionsEmpty: 'No option groups yet.',
    categoriesEmpty: 'No categories yet.',
    itemsEmpty: 'No items yet.',
    openStore: 'Open Store',
    noImage: 'No Image',
    itemDetails: 'Item Details',
    addToCart: 'Add to Cart',
  },
  es: {
    appName: 'MENUFLOW BUILDER',
    title: 'Construye Tu Tienda',
    subtitle: 'Centro de control del dueño para tienda, branding, menú y vista previa.',
    loading: 'Cargando builder...',
    saving: 'Guardando...',
    save: 'Guardar',
    saveSection: 'Guardar Sección',
    builderSaved: 'Builder guardado.',
    couldNotLoad: 'No se pudo cargar el builder.',
    couldNotSave: 'No se pudo guardar el builder.',
    couldNotUploadHero: 'No se pudo subir la imagen hero.',
    couldNotUploadLogo: 'No se pudo subir el logo.',
    couldNotUploadItem: 'No se pudo subir la imagen del producto.',
    sectionTools: 'Herramientas',
    dashboard: 'Dashboard',
    storefront: 'Tienda',
    settings: 'Ajustes',
    flyers: 'Flyers y QR',
    storeSetup: 'Configuración',
    branding: 'Branding',
    controls: 'Controles',
    categories: 'Categorías',
    itemBuilder: 'Producto',
    optionGroups: 'Opciones',
    livePreview: 'Reflejo de Tienda',
    storeName: 'Nombre del Negocio',
    slug: 'Slug',
    phone: 'Teléfono',
    address: 'Dirección',
    liveUrl: 'URL En Vivo',
    uploadHeroImage: 'Subir Hero',
    uploadLogo: 'Subir Logo',
    uploadItemImage: 'Subir Imagen',
    removeHeroImage: 'Quitar Hero',
    removeLogoImage: 'Quitar Logo',
    removeItemImage: 'Quitar Imagen',
    heroPreview: 'Vista Hero',
    logoPreview: 'Vista Logo',
    itemPreview: 'Vista del Producto',
    storefrontLanguage: 'Idioma de Tienda',
    ownerLanguage: 'Idioma del Dueño',
    storefrontTheme: 'Tema de Tienda',
    ownerPlan: 'Plan',
    starter: 'Starter',
    growth: 'Growth',
    premium: 'Premium',
    english: 'EN',
    spanish: 'ES',
    light: 'Claro',
    dark: 'Oscuro',
    pickupOn: 'Recoger Sí',
    pickupOff: 'Recoger No',
    deliveryOn: 'Entrega Sí',
    deliveryOff: 'Entrega No',
    deliveryFee: 'Costo de Entrega',
    deliveryRadius: 'Radio de Entrega',
    deliveryMinimum: 'Mínimo de Entrega',
    addCategory: 'Agregar Categoría',
    categoryName: 'Nombre de Categoría',
    addItem: 'Agregar Producto',
    itemName: 'Nombre del Producto',
    itemNameFallback: 'Nuevo Producto',
    basePrice: 'Precio Base',
    description: 'Descripción',
    describeItem: 'Describe el producto...',
    availability: 'Disponibilidad',
    available: 'Disponible',
    soldOut: 'Agotado',
    deleteCategory: 'Eliminar Categoría',
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
    multipleChoice: 'Múltiples',
    choiceName: 'Nombre de Opción',
    addChoice: 'Agregar Opción',
    newChoice: 'Nueva Opción',
    optionsEmpty: 'Todavía no hay grupos de opciones.',
    categoriesEmpty: 'Todavía no hay categorías.',
    itemsEmpty: 'Todavía no hay productos.',
    openStore: 'Abrir Tienda',
    noImage: 'Sin Imagen',
    itemDetails: 'Detalles del Producto',
    addToCart: 'Agregar al Carrito',
  },
};

const PLACEHOLDER_BUCKET = 'menu-images';

const CATEGORY_FOLDER_MAP: Record<string, string> = {
  bbq: 'bbq',
  breakfast: 'breakfast',
  burger: 'singles',
  burgers: 'singles',
  combo: 'combos',
  combos: 'combos',
  dessert: 'desserts',
  desserts: 'desserts',
  drink: 'drinks',
  drinks: 'drinks',
  mexican: 'mexican',
  pasta: 'pasta',
  sandwich: 'sandwiches',
  sandwiches: 'sandwiches',
  seafood: 'seafood',
  side: 'sides',
  sides: 'sides',
  single: 'singles',
  singles: 'singles',
  wing: 'wings',
  wings: 'wings',
};

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function makeUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
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

function normalizeAvailability(item: ItemRow): Availability {
  if (item.availability === 'sold_out' || item.is_available === false) return 'sold_out';
  return 'available';
}

function normalizeSelectionMode(group: OptionGroupRow): 'single' | 'multiple' {
  if (group.selection_mode === 'multiple' || group.is_multiple) return 'multiple';
  return 'single';
}

function inferPresetType(name: string): BuilderOptionGroup['presetType'] {
  const v = name.trim().toLowerCase();
  if (v.includes('protein')) return 'protein';
  if (v.includes('size')) return 'size';
  if (v.includes('drink')) return 'drink';
  if (v.includes('extra')) return 'extras';
  if (v.includes('remove')) return 'removals';
  return 'custom';
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

function normalizeCategoryNameToFolder(name: string | null | undefined) {
  const normalized = (name || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return CATEGORY_FOLDER_MAP[normalized] || CATEGORY_FOLDER_MAP[normalized.replace(/s$/, '')] || null;
}

function pickDeterministicImage(urls: string[], seed: string) {
  if (!urls.length) return '';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return urls[hash % urls.length];
}

export default function OwnerBuilderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [builderLanguage, setBuilderLanguage] = useState<LanguageMode>('en');
  const [storefrontLanguage, setStorefrontLanguage] = useState<LanguageMode>('en');
  const [ownerLanguage, setOwnerLanguage] = useState<LanguageMode>('en');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [ownerPlan, setOwnerPlan] = useState<OwnerPlan>('starter');

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
  const [previewItemId, setPreviewItemId] = useState('');
  const [openSection, setOpenSection] = useState<SectionKey>('store');

  const [placeholderMap, setPlaceholderMap] = useState<Record<string, string[]>>({});
  const [genericPlaceholderPool, setGenericPlaceholderPool] = useState<string[]>([]);

  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const copy = COPY[builderLanguage];

  const derivedSlug = useMemo(() => slugify(name), [name]);
  const previewHref = derivedSlug ? `/store/${derivedSlug}` : '#';

  const allItems = useMemo(() => categories.flatMap((category) => category.items), [categories]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const selectedItem = useMemo(
    () => allItems.find((item) => item.id === selectedItemId) || allItems[0] || null,
    [allItems, selectedItemId]
  );

  const previewItem = useMemo(
    () => allItems.find((item) => item.id === previewItemId) || selectedItem || null,
    [allItems, previewItemId, selectedItem]
  );

  useEffect(() => {
    setSlug(derivedSlug);
  }, [derivedSlug]);

  useEffect(() => {
    let active = true;

    async function loadPlaceholderMap() {
      try {
        const folders = Array.from(new Set(Object.values(CATEGORY_FOLDER_MAP)));
        const nextMap: Record<string, string[]> = {};
        const genericPool: string[] = [];

        for (const folder of folders) {
          const { data, error: listError } = await supabase.storage.from(PLACEHOLDER_BUCKET).list(folder, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' },
          });

          if (listError) {
            nextMap[folder] = [];
            continue;
          }

          const urls: string[] = [];

          for (const file of safeArray(data)) {
            if (!file.name || file.name.startsWith('.')) continue;
            const { data: publicUrlData } = supabase.storage
              .from(PLACEHOLDER_BUCKET)
              .getPublicUrl(`${folder}/${file.name}`);

            if (publicUrlData?.publicUrl) {
              urls.push(publicUrlData.publicUrl);
              genericPool.push(publicUrlData.publicUrl);
            }
          }

          nextMap[folder] = urls;
        }

        if (!active) return;
        setPlaceholderMap(nextMap);
        setGenericPlaceholderPool(genericPool);
      } catch {
        if (!active) return;
      }
    }

    void loadPlaceholderMap();

    return () => {
      active = false;
    };
  }, []);

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
            storefront_language,
            order_language,
            pickup_enabled,
            delivery_enabled,
            delivery_fee,
            delivery_radius,
            delivery_minimum,
            plan
          `
          )
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        if (restaurant) {
          const row = restaurant as RestaurantRow;
          setRestaurantId(row.id);
          setName(row.name || '');
          setSlug(row.slug || '');
          setPhone(row.phone || '');
          setAddress(row.address || '');
          setHeroImage(row.hero_image || '');
          setLogoImage(row.logo_image || '');
          setTheme((row.storefront_theme as ThemeMode) || 'light');
          setStorefrontLanguage((row.storefront_language || 'en').toLowerCase() === 'es' ? 'es' : 'en');
          setOwnerLanguage((row.order_language || 'EN').toLowerCase() === 'es' ? 'es' : 'en');
          setPickupEnabled(row.pickup_enabled ?? true);
          setDeliveryEnabled(row.delivery_enabled ?? false);
          setDeliveryFee(String(row.delivery_fee ?? 0));
          setDeliveryRadius(String(row.delivery_radius ?? 5));
          setDeliveryMinimum(String(row.delivery_minimum ?? 0));
          setOwnerPlan((row.plan as OwnerPlan) || 'starter');

          await loadMenuBuilder(row.id, active);
        } else {
          const categoryId = makeUuid();
          const itemId = makeUuid();

          const starterCategories: BuilderCategory[] = [
            {
              id: categoryId,
              name: 'Featured',
              sort_order: 0,
              items: [
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
            },
          ];

          if (!active) return;
          setCategories(starterCategories);
          setSelectedCategoryId(categoryId);
          setSelectedItemId(itemId);
          setPreviewItemId(itemId);
        }
      } catch (err: unknown) {
        if (!active) return;
        const message = err instanceof Error ? err.message : copy.couldNotLoad;
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBuilder();

    return () => {
      active = false;
    };
  }, [router, copy.couldNotLoad, copy.itemNameFallback]);

  async function loadMenuBuilder(currentRestaurantId: string, active: boolean) {
    const { data: categoryData, error: categoryError } = await supabase
      .from('menu_categories')
      .select('id, restaurant_id, name, sort_order')
      .eq('restaurant_id', currentRestaurantId)
      .order('sort_order', { ascending: true });

    if (categoryError) throw categoryError;

    const { data: itemData, error: itemError } = await supabase
      .from('menu_items')
      .select('id, restaurant_id, category_id, name, description, price, base_price, image_url, availability, is_available, sort_order')
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

    const loadedCategories: BuilderCategory[] = safeArray(categoryData).map((category, categoryIndex) => ({
      id: category.id,
      name: category.name || `${copy.categories} ${categoryIndex + 1}`,
      sort_order: category.sort_order ?? categoryIndex,
      items: itemRows
        .filter((item) => item.category_id === category.id)
        .map((item) => ({
          id: item.id,
          category_id: category.id,
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
              presetType: inferPresetType(group.name || ''),
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
        })),
    }));

    if (loadedCategories.length) {
      setCategories(loadedCategories);
      setSelectedCategoryId(loadedCategories[0].id);
      setSelectedItemId(loadedCategories[0].items[0]?.id || '');
      setPreviewItemId(loadedCategories[0].items[0]?.id || '');
    } else {
      const categoryId = makeUuid();
      const itemId = makeUuid();

      const starterCategories: BuilderCategory[] = [
        {
          id: categoryId,
          name: 'Featured',
          sort_order: 0,
          items: [
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
        },
      ];

      setCategories(starterCategories);
      setSelectedCategoryId(categoryId);
      setSelectedItemId(itemId);
      setPreviewItemId(itemId);
    }
  }

  function getCategoryNameById(categoryId: string) {
    return categories.find((category) => category.id === categoryId)?.name || '';
  }

  function getPlaceholderForCategory(categoryName: string, seed: string) {
    const folder = normalizeCategoryNameToFolder(categoryName);

    if (folder) {
      const urls = placeholderMap[folder] || [];
      const picked = pickDeterministicImage(urls, seed);
      if (picked) return picked;
    }

    return pickDeterministicImage(genericPlaceholderPool, seed);
  }

  function getResolvedItemImage(item: BuilderItem | null) {
    if (!item) return '';
    if (item.image_url?.trim()) return item.image_url;
    return getPlaceholderForCategory(getCategoryNameById(item.category_id), `${item.category_id}-${item.id}`);
  }

  function selectCategory(categoryId: string) {
    const category = categories.find((entry) => entry.id === categoryId);
    setSelectedCategoryId(categoryId);
    setSelectedItemId(category?.items[0]?.id || '');
    setPreviewItemId(category?.items[0]?.id || '');
  }

  function selectItem(itemId: string) {
    setSelectedItemId(itemId);
    setPreviewItemId(itemId);
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
      const url = await uploadToBucket(file, 'heroes');
      setHeroImage(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.couldNotUploadHero;
      setError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.couldNotUploadLogo;
      setError(message);
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
          items: category.items.map((item) => (item.id === itemId ? { ...item, image_url: url } : item)),
        }))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.couldNotUploadItem;
      setError(message);
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
    const categoryId = makeUuid();
    const itemId = makeUuid();

    const nextCategory: BuilderCategory = {
      id: categoryId,
      name: `${copy.categories} ${categories.length + 1}`,
      sort_order: categories.length,
      items: [
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
    };

    setCategories((current) => [...current, nextCategory]);
    setSelectedCategoryId(categoryId);
    setSelectedItemId(itemId);
    setPreviewItemId(itemId);
    setOpenSection('categories');
  }

  function updateCategory(categoryId: string, value: string) {
    setCategories((current) =>
      current.map((category) => (category.id === categoryId ? { ...category, name: value } : category))
    );
  }

  function deleteCategory(categoryId: string) {
    const next = categories.filter((category) => category.id !== categoryId);
    setCategories(next);

    const firstCategory = next[0] || null;
    const firstItem = firstCategory?.items[0] || null;

    setSelectedCategoryId(firstCategory?.id || '');
    setSelectedItemId(firstItem?.id || '');
    setPreviewItemId(firstItem?.id || '');
  }

  function addItem(categoryId: string) {
    const itemId = makeUuid();

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
    setPreviewItemId(itemId);
    setOpenSection('items');
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
    const groupId = makeUuid();

    const presetMap: Record<BuilderOptionGroup['presetType'], string> = {
      protein: copy.protein,
      size: copy.size,
      drink: copy.drink,
      extras: copy.extras,
      removals: copy.removals,
      custom: copy.custom,
    };

    const group: BuilderOptionGroup = {
      id: groupId,
      name: presetMap[presetType],
      presetType,
      required: false,
      selection: presetType === 'extras' || presetType === 'removals' ? 'multiple' : 'single',
      options: getPresetOptions(presetType).map((option) => ({
        id: makeUuid(),
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
          item.id === itemId ? { ...item, option_groups: item.option_groups.filter((group) => group.id !== groupId) } : item
        ),
      }))
    );
  }

  function addOptionChoice(itemId: string, groupId: string) {
    const optionId = makeUuid();

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
                    ? { ...group, options: group.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option)) }
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

  async function saveRestaurantOnly() {
    if (!ownerId) throw new Error('User not authenticated.');

    const payload = {
      owner_id: ownerId,
      name: name.trim() || null,
      slug: slugify(name) || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      hero_image: heroImage.trim() || null,
      logo_image: logoImage.trim() || null,
      storefront_theme: theme,
      storefront_language: storefrontLanguage,
      order_language: ownerLanguage === 'es' ? 'ES' : 'EN',
      pickup_enabled: pickupEnabled,
      delivery_enabled: deliveryEnabled,
      delivery_fee: Number(deliveryFee || 0),
      delivery_radius: Number(deliveryRadius || 0),
      delivery_minimum: Number(deliveryMinimum || 0),
      plan: ownerPlan,
    };

    let currentRestaurantId = restaurantId;

    if (restaurantId) {
      const { error: updateError } = await supabase.from('restaurants').update(payload).eq('id', restaurantId);
      if (updateError) throw updateError;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('restaurants')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) throw insertError;
      currentRestaurantId = inserted.id;
      setRestaurantId(inserted.id);
    }

    return currentRestaurantId as string;
  }

  async function handleSave(section: SectionKey) {
    try {
      setSavingSection(section);
      setError('');
      setSuccess('');

      const currentRestaurantId = await saveRestaurantOnly();

      const { data: existingCategories, error: existingCategoriesError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', currentRestaurantId);

      if (existingCategoriesError) throw existingCategoriesError;

      const existingCategoryIds = safeArray(existingCategories).map((row: { id: string }) => row.id);

      let existingItemIds: string[] = [];

      if (existingCategoryIds.length) {
        const { data: existingItems, error: existingItemsError } = await supabase
          .from('menu_items')
          .select('id')
          .in('category_id', existingCategoryIds);

        if (existingItemsError) throw existingItemsError;
        existingItemIds = safeArray(existingItems).map((row: { id: string }) => row.id);
      }

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

      const categoryRows = categories.map((category, categoryIndex) => ({
        id: category.id,
        restaurant_id: currentRestaurantId,
        name: category.name.trim() || `${copy.categories} ${categoryIndex + 1}`,
        sort_order: categoryIndex,
      }));

      if (categoryRows.length) {
        const { error: categoryInsertError } = await supabase.from('menu_categories').insert(categoryRows);
        if (categoryInsertError) throw categoryInsertError;
      }

      const itemRowsBase = categories.flatMap((category, categoryIndex) =>
        category.items.map((item, itemIndex) => ({
          id: item.id,
          restaurant_id: currentRestaurantId,
          category_id: category.id,
          name: item.name.trim() || copy.itemNameFallback,
          description: item.description.trim() || null,
          availability: item.availability,
          is_available: item.availability === 'available',
          sort_order: itemIndex + categoryIndex * 100,
          base_price: Number(item.base_price || 0),
          price: Number(item.base_price || 0),
          image_url:
            item.image_url ||
            getPlaceholderForCategory(category.name, `${category.name}_${item.id}`) ||
            null,
        }))
      );

      if (itemRowsBase.length) {
        let itemInsertError: unknown = null;
        let inserted = false;

        const itemPayloadVariants = [
          itemRowsBase.map(({ price, ...rest }) => rest),
          itemRowsBase.map(({ base_price, ...rest }) => rest),
          itemRowsBase,
        ];

        for (const payload of itemPayloadVariants) {
          const { error: insertError } = await supabase.from('menu_items').insert(payload);
          if (!insertError) {
            inserted = true;
            itemInsertError = null;
            break;
          }
          itemInsertError = insertError;
        }

        if (!inserted && itemInsertError) throw itemInsertError;
      }

      const optionGroupRows = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.option_groups.map((group, groupIndex) => ({
            id: group.id,
            item_id: item.id,
            name: group.name.trim() || copy.optionGroups,
            is_required: group.required,
            is_multiple: group.selection === 'multiple',
            selection_mode: group.selection,
            sort_order: groupIndex,
          }))
        )
      );

      if (optionGroupRows.length) {
        const { error: groupInsertError } = await supabase.from('menu_option_groups').insert(optionGroupRows);
        if (groupInsertError) throw groupInsertError;
      }

      const optionChoiceRows = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.option_groups.flatMap((group) =>
            group.options.map((option, optionIndex) => ({
              id: option.id,
              option_group_id: group.id,
              name: option.name.trim() || copy.newChoice,
              price: Number(option.price || 0),
              price_delta: Number(option.price || 0),
              sort_order: optionIndex,
            }))
          )
        )
      );

      if (optionChoiceRows.length) {
        const { error: choiceInsertError } = await supabase.from('menu_option_choices').insert(optionChoiceRows);
        if (choiceInsertError) throw choiceInsertError;
      }

      await loadMenuBuilder(currentRestaurantId, true);
      setSuccess(copy.builderSaved);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.couldNotSave;
      setError(message || copy.couldNotSave);
    } finally {
      setSavingSection(null);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="shell">
          <div className="notch" />
          <div className="loadingCard">{copy.loading}</div>
        </div>

        <style jsx global>{`
          .page {
            min-height: 100vh;
            background: #f1f2ee;
            padding: 18px 12px 32px;
            display: grid;
            place-items: start center;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          .shell {
            width: min(100%, 430px);
            background: #fafaf7;
            border: 1px solid rgba(17, 17, 17, 0.08);
            border-radius: 34px;
            box-shadow: 0 18px 44px rgba(0, 0, 0, 0.08);
            padding: 16px;
          }

          .notch {
            width: 124px;
            height: 10px;
            border-radius: 999px;
            background: #111111;
            margin: 2px auto 18px;
          }

          .loadingCard {
            border-radius: 22px;
            padding: 24px;
            background: #ffffff;
            border: 1px solid rgba(17, 17, 17, 0.08);
            color: #111111;
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
          <div className="brand">{copy.appName}</div>

          <div className="topBarActions">
            <button
              type="button"
              className="langButton"
              onClick={() => setBuilderLanguage(builderLanguage === 'en' ? 'es' : 'en')}
            >
              {builderLanguage.toUpperCase()}
            </button>

            <button
              type="button"
              className="mainSaveButton"
              onClick={() => void handleSave(openSection)}
              disabled={!!savingSection}
            >
              {savingSection ? copy.saving : copy.save}
            </button>
          </div>
        </div>

        <div className="quickToolsCard">
          <div className="quickToolsTitle">{copy.sectionTools}</div>

          <div className="quickToolsGrid">
            <Link href="/dashboard/owner" className="quickToolButton">
              {copy.dashboard}
            </Link>

            <Link href={previewHref} className={`quickToolButton ${previewHref === '#' ? 'isDisabled' : ''}`}>
              {copy.storefront}
            </Link>

            <Link href="/dashboard/owner/settings" className="quickToolButton">
              {copy.settings}
            </Link>

            <Link href="/dashboard/owner/flyers" className="quickToolButton">
              {copy.flyers}
            </Link>
          </div>
        </div>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <section className="heroCard">
          {heroImage ? <img src={heroImage} alt={copy.heroPreview} className="heroImage" /> : <div className="heroFallback" />}

          <div className="heroOverlay">
            <div className="heroIdentity">
              {logoImage ? (
                <img src={logoImage} alt={copy.logoPreview} className="heroLogo" />
              ) : (
                <div className="heroLogoFallback">{(name || 'M').charAt(0).toUpperCase()}</div>
              )}

              <div className="heroText">
                <div className="heroName">{name || 'Your Store'}</div>
                <div className="heroMetaRow">
                  <span>{address || '123 Main St'}</span>
                  <span>{phone || '323 555 1212'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="introCard">
          <h1 className="title">{copy.title}</h1>
          <p className="subtitle">{copy.subtitle}</p>
        </section>

        <div className="builderGrid">
          <div className="builderControls">
            <section className="sectionCard">
              <button type="button" className="sectionHeader" onClick={() => setOpenSection('store')}>
                <div>
                  <div className="sectionNumber">01</div>
                  <div className="sectionTitle">{copy.storeSetup}</div>
                </div>
                <span className="sectionChevron">›</span>
              </button>

              {openSection === 'store' ? (
                <div className="sectionBody">
                  <div className="field">
                    <label className="label">{copy.storeName}</label>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  <div className="field">
                    <label className="label">{copy.slug}</label>
                    <input className="input" value={slug ? `/store/${slug}` : '/store/your-store'} readOnly />
                  </div>

                  <div className="field">
                    <label className="label">{copy.phone}</label>
                    <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  <div className="field">
                    <label className="label">{copy.address}</label>
                    <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>

                  <button
                    type="button"
                    className="sectionSaveButton"
                    onClick={() => void handleSave('store')}
                    disabled={!!savingSection}
                  >
                    {savingSection === 'store' ? copy.saving : copy.saveSection}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="sectionCard">
              <button type="button" className="sectionHeader" onClick={() => setOpenSection('branding')}>
                <div>
                  <div className="sectionNumber">02</div>
                  <div className="sectionTitle">{copy.branding}</div>
                </div>
                <span className="sectionChevron">›</span>
              </button>

              {openSection === 'branding' ? (
                <div className="sectionBody">
                  <div className="uploadBlock">
                    <div className="uploadTitle">{copy.uploadHeroImage}</div>

                    <label className="blackButton">
                      {uploadingHero ? copy.saving : copy.uploadHeroImage}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => void handleHeroUpload(e.target.files?.[0] || null)}
                      />
                    </label>

                    <button type="button" className="softButton" onClick={removeHeroImage}>
                      {copy.removeHeroImage}
                    </button>

                    {heroImage ? (
                      <img src={heroImage} alt={copy.heroPreview} className="uploadPreview" />
                    ) : (
                      <div className="emptyImageBox">{copy.heroPreview}</div>
                    )}
                  </div>

                  <div className="uploadBlock">
                    <div className="uploadTitle">{copy.uploadLogo}</div>

                    <label className="blackButton">
                      {uploadingLogo ? copy.saving : copy.uploadLogo}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => void handleLogoUpload(e.target.files?.[0] || null)}
                      />
                    </label>

                    <button type="button" className="softButton" onClick={removeLogoImage}>
                      {copy.removeLogoImage}
                    </button>

                    {logoImage ? (
                      <img src={logoImage} alt={copy.logoPreview} className="uploadPreview logoPreview" />
                    ) : (
                      <div className="emptyImageBox">{copy.logoPreview}</div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="sectionSaveButton"
                    onClick={() => void handleSave('branding')}
                    disabled={!!savingSection}
                  >
                    {savingSection === 'branding' ? copy.saving : copy.saveSection}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="sectionCard">
              <button type="button" className="sectionHeader" onClick={() => setOpenSection('controls')}>
                <div>
                  <div className="sectionNumber">03</div>
                  <div className="sectionTitle">{copy.controls}</div>
                </div>
                <span className="sectionChevron">›</span>
              </button>

              {openSection === 'controls' ? (
                <div className="sectionBody">
                  <div className="field">
                    <label className="label">{copy.ownerPlan}</label>
                    <div className="chipRow">
                      <button
                        type="button"
                        className={`chip ${ownerPlan === 'starter' ? 'chipActive' : ''}`}
                        onClick={() => setOwnerPlan('starter')}
                      >
                        {copy.starter}
                      </button>

                      <button
                        type="button"
                        className={`chip ${ownerPlan === 'growth' ? 'chipActive' : ''}`}
                        onClick={() => setOwnerPlan('growth')}
                      >
                        {copy.growth}
                      </button>

                      <button
                        type="button"
                        className={`chip ${ownerPlan === 'premium' ? 'chipActive' : ''}`}
                        onClick={() => setOwnerPlan('premium')}
                      >
                        {copy.premium}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">{copy.storefrontTheme}</label>
                    <div className="chipRow">
                      <button
                        type="button"
                        className={`chip ${theme === 'light' ? 'chipActive' : ''}`}
                        onClick={() => setTheme('light')}
                      >
                        {copy.light}
                      </button>

                      <button
                        type="button"
                        className={`chip ${theme === 'dark' ? 'chipActive' : ''}`}
                        onClick={() => setTheme('dark')}
                      >
                        {copy.dark}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">{copy.storefrontLanguage}</label>
                    <div className="chipRow">
                      <button
                        type="button"
                        className={`chip ${storefrontLanguage === 'en' ? 'chipActive' : ''}`}
                        onClick={() => setStorefrontLanguage('en')}
                      >
                        {copy.english}
                      </button>

                      <button
                        type="button"
                        className={`chip ${storefrontLanguage === 'es' ? 'chipActive' : ''}`}
                        onClick={() => setStorefrontLanguage('es')}
                      >
                        {copy.spanish}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">{copy.ownerLanguage}</label>
                    <div className="chipRow">
                      <button
                        type="button"
                        className={`chip ${ownerLanguage === 'en' ? 'chipActive' : ''}`}
                        onClick={() => setOwnerLanguage('en')}
                      >
                        {copy.english}
                      </button>

                      <button
                        type="button"
                        className={`chip ${ownerLanguage === 'es' ? 'chipActive' : ''}`}
                        onClick={() => setOwnerLanguage('es')}
                      >
                        {copy.spanish}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">{copy.pickupOn} / {copy.pickupOff}</label>
                    <div className="chipRow">
                      <button
                        type="button"
                        className={`chip ${pickupEnabled ? 'chipActive' : ''}`}
                        onClick={() => setPickupEnabled(true)}
                      >
                        {copy.pickupOn}
                      </button>

                      <button
                        type="button"
                        className={`chip ${!pickupEnabled ? 'chipActive' : ''}`}
                        onClick={() => setPickupEnabled(false)}
                      >
                        {copy.pickupOff}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">{copy.deliveryOn} / {copy.deliveryOff}</label>
                    <div className="chipRow">
                      <button
                        type="button"
                        className={`chip ${deliveryEnabled ? 'chipActive' : ''}`}
                        onClick={() => setDeliveryEnabled(true)}
                      >
                        {copy.deliveryOn}
                      </button>

                      <button
                        type="button"
                        className={`chip ${!deliveryEnabled ? 'chipActive' : ''}`}
                        onClick={() => setDeliveryEnabled(false)}
                      >
                        {copy.deliveryOff}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">{copy.deliveryFee}</label>
                    <input
                      className="input"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(sanitizeNumberInput(e.target.value))}
                    />
                  </div>

                  <div className="field">
                    <label className="label">{copy.deliveryRadius}</label>
                    <input
                      className="input"
                      value={deliveryRadius}
                      onChange={(e) => setDeliveryRadius(sanitizeNumberInput(e.target.value))}
                    />
                  </div>

                  <div className="field">
                    <label className="label">{copy.deliveryMinimum}</label>
                    <input
                      className="input"
                      value={deliveryMinimum}
                      onChange={(e) => setDeliveryMinimum(sanitizeNumberInput(e.target.value))}
                    />
                  </div>

                  <button
                    type="button"
                    className="sectionSaveButton"
                    onClick={() => void handleSave('controls')}
                    disabled={!!savingSection}
                  >
                    {savingSection === 'controls' ? copy.saving : copy.saveSection}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="sectionCard">
              <button type="button" className="sectionHeader" onClick={() => setOpenSection('categories')}>
                <div>
                  <div className="sectionNumber">04</div>
                  <div className="sectionTitle">{copy.categories}</div>
                </div>
                <span className="sectionChevron">›</span>
              </button>

              {openSection === 'categories' ? (
                <div className="sectionBody">
                  <button type="button" className="blackButton fullWidth" onClick={addCategory}>
                    {copy.addCategory}
                  </button>

                  {categories.length ? (
                    categories.map((category) => (
                      <div key={category.id} className="miniCard">
                        <div className="miniCardTop">
                          <button
                            type="button"
                            className={`categoryTabButton ${selectedCategoryId === category.id ? 'categoryTabButtonActive' : ''}`}
                            onClick={() => selectCategory(category.id)}
                          >
                            {category.name || copy.categories}
                          </button>

                          <div className="miniCardMeta">{category.items.length}</div>
                        </div>

                        <div className="field">
                          <label className="label">{copy.categoryName}</label>
                          <input
                            className="input"
                            value={category.name}
                            onChange={(e) => updateCategory(category.id, e.target.value)}
                          />
                        </div>

                        <div className="rowButtons">
                          <button type="button" className="blackButton halfWidth" onClick={() => addItem(category.id)}>
                            {copy.addItem}
                          </button>

                          <button type="button" className="softButton halfWidth" onClick={() => deleteCategory(category.id)}>
                            {copy.deleteCategory}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="emptyState">{copy.categoriesEmpty}</div>
                  )}

                  <button
                    type="button"
                    className="sectionSaveButton"
                    onClick={() => void handleSave('categories')}
                    disabled={!!savingSection}
                  >
                    {savingSection === 'categories' ? copy.saving : copy.saveSection}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="sectionCard">
              <button type="button" className="sectionHeader" onClick={() => setOpenSection('items')}>
                <div>
                  <div className="sectionNumber">05</div>
                  <div className="sectionTitle">{copy.itemBuilder}</div>
                </div>
                <span className="sectionChevron">›</span>
              </button>

              {openSection === 'items' ? (
                <div className="sectionBody">
                  {selectedCategory ? (
                    <>
                      <div className="itemStrip">
                        {selectedCategory.items.map((item) => {
                          const itemImage = getResolvedItemImage(item);

                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={`itemCardButton ${selectedItemId === item.id ? 'itemCardButtonActive' : ''}`}
                              onClick={() => selectItem(item.id)}
                            >
                              {itemImage ? (
                                <img src={itemImage} alt={item.name || copy.itemNameFallback} className="itemThumb" />
                              ) : (
                                <div className="itemThumbFallback">{copy.noImage}</div>
                              )}

                              <div className="itemCardMeta">
                                <span>{item.name || copy.itemNameFallback}</span>
                                <strong>{money(item.base_price)}</strong>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {selectedItem ? (
                        <div className="itemEditor">
                          <div className="uploadBlock">
                            <div className="uploadTitle">{copy.uploadItemImage}</div>

                            <label className="blackButton">
                              {uploadingItemId === selectedItem.id ? copy.saving : copy.uploadItemImage}
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => void handleItemImageUpload(selectedItem.id, e.target.files?.[0] || null)}
                              />
                            </label>

                            <button
                              type="button"
                              className="softButton"
                              onClick={() => removeItemImage(selectedItem.id)}
                            >
                              {copy.removeItemImage}
                            </button>

                            {getResolvedItemImage(selectedItem) ? (
                              <img
                                src={getResolvedItemImage(selectedItem)}
                                alt={copy.itemPreview}
                                className="uploadPreview"
                              />
                            ) : (
                              <div className="emptyImageBox">{copy.itemPreview}</div>
                            )}
                          </div>

                          <div className="field">
                            <label className="label">{copy.itemName}</label>
                            <input
                              className="input"
                              value={selectedItem.name}
                              onChange={(e) => updateItem(selectedItem.id, { name: e.target.value })}
                            />
                          </div>

                          <div className="field">
                            <label className="label">{copy.basePrice}</label>
                            <input
                              className="input"
                              value={selectedItem.base_price}
                              onChange={(e) =>
                                updateItem(selectedItem.id, { base_price: sanitizeNumberInput(e.target.value) })
                              }
                            />
                          </div>

                          <div className="field">
                            <label className="label">{copy.description}</label>
                            <textarea
                              className="textarea"
                              value={selectedItem.description}
                              onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })}
                            />
                          </div>

                          <div className="field">
                            <label className="label">{copy.availability}</label>
                            <div className="chipRow">
                              <button
                                type="button"
                                className={`chip ${selectedItem.availability === 'available' ? 'chipActive' : ''}`}
                                onClick={() => updateItem(selectedItem.id, { availability: 'available' })}
                              >
                                {copy.available}
                              </button>

                              <button
                                type="button"
                                className={`chip ${selectedItem.availability === 'sold_out' ? 'chipActive' : ''}`}
                                onClick={() => updateItem(selectedItem.id, { availability: 'sold_out' })}
                              >
                                {copy.soldOut}
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="softButton fullWidth"
                            onClick={() => deleteItem(selectedItem.category_id, selectedItem.id)}
                          >
                            {copy.deleteItem}
                          </button>
                        </div>
                      ) : (
                        <div className="emptyState">{copy.itemsEmpty}</div>
                      )}
                    </>
                  ) : (
                    <div className="emptyState">{copy.categoriesEmpty}</div>
                  )}

                  <button
                    type="button"
                    className="sectionSaveButton"
                    onClick={() => void handleSave('items')}
                    disabled={!!savingSection}
                  >
                    {savingSection === 'items' ? copy.saving : copy.saveSection}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="sectionCard">
              <button type="button" className="sectionHeader" onClick={() => setOpenSection('options')}>
                <div>
                  <div className="sectionNumber">06</div>
                  <div className="sectionTitle">{copy.optionGroups}</div>
                </div>
                <span className="sectionChevron">›</span>
              </button>

              {openSection === 'options' ? (
                <div className="sectionBody">
                  {selectedItem ? (
                    <>
                      <div className="chipRow">
                        <button
                          type="button"
                          className="chip"
                          onClick={() => addOptionGroup(selectedItem.id, 'protein')}
                        >
                          {copy.protein}
                        </button>

                        <button
                          type="button"
                          className="chip"
                          onClick={() => addOptionGroup(selectedItem.id, 'size')}
                        >
                          {copy.size}
                        </button>

                        <button
                          type="button"
                          className="chip"
                          onClick={() => addOptionGroup(selectedItem.id, 'drink')}
                        >
                          {copy.drink}
                        </button>

                        <button
                          type="button"
                          className="chip"
                          onClick={() => addOptionGroup(selectedItem.id, 'extras')}
                        >
                          {copy.extras}
                        </button>

                        <button
                          type="button"
                          className="chip"
                          onClick={() => addOptionGroup(selectedItem.id, 'removals')}
                        >
                          {copy.removals}
                        </button>

                        <button
                          type="button"
                          className="chip"
                          onClick={() => addOptionGroup(selectedItem.id, 'custom')}
                        >
                          {copy.custom}
                        </button>
                      </div>

                      {selectedItem.option_groups.length ? (
                        <div className="optionGroupList">
                          {selectedItem.option_groups.map((group) => (
                            <div key={group.id} className="miniCard">
                              <div className="field">
                                <label className="label">{copy.optionGroups}</label>
                                <input
                                  className="input"
                                  value={group.name}
                                  onChange={(e) =>
                                    updateOptionGroup(selectedItem.id, group.id, { name: e.target.value })
                                  }
                                />
                              </div>

                              <div className="chipRow">
                                <button
                                  type="button"
                                  className={`chip ${group.required ? 'chipActive' : ''}`}
                                  onClick={() =>
                                    updateOptionGroup(selectedItem.id, group.id, { required: !group.required })
                                  }
                                >
                                  {group.required ? copy.required : copy.optional}
                                </button>

                                <button
                                  type="button"
                                  className={`chip ${group.selection === 'single' ? 'chipActive' : ''}`}
                                  onClick={() =>
                                    updateOptionGroup(selectedItem.id, group.id, { selection: 'single' })
                                  }
                                >
                                  {copy.singleChoice}
                                </button>

                                <button
                                  type="button"
                                  className={`chip ${group.selection === 'multiple' ? 'chipActive' : ''}`}
                                  onClick={() =>
                                    updateOptionGroup(selectedItem.id, group.id, { selection: 'multiple' })
                                  }
                                >
                                  {copy.multipleChoice}
                                </button>
                              </div>

                              <div className="choiceList">
                                {group.options.map((option) => (
                                  <div key={option.id} className="choiceRow">
                                    <input
                                      className="input choiceName"
                                      value={option.name}
                                      onChange={(e) =>
                                        updateOptionChoice(selectedItem.id, group.id, option.id, { name: e.target.value })
                                      }
                                    />

                                    <input
                                      className="input choicePrice"
                                      value={option.price}
                                      onChange={(e) =>
                                        updateOptionChoice(selectedItem.id, group.id, option.id, {
                                          price: sanitizeNumberInput(e.target.value),
                                        })
                                      }
                                    />

                                    <button
                                      type="button"
                                      className="tinySoftButton"
                                      onClick={() => deleteOptionChoice(selectedItem.id, group.id, option.id)}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  className="softButton fullWidth"
                                  onClick={() => addOptionChoice(selectedItem.id, group.id)}
                                >
                                  {copy.addChoice}
                                </button>
                              </div>

                              <button
                                type="button"
                                className="softButton fullWidth"
                                onClick={() => deleteOptionGroup(selectedItem.id, group.id)}
                              >
                                {copy.deleteItem}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="emptyState">{copy.optionsEmpty}</div>
                      )}
                    </>
                  ) : (
                    <div className="emptyState">{copy.itemsEmpty}</div>
                  )}

                  <button
                    type="button"
                    className="sectionSaveButton"
                    onClick={() => void handleSave('options')}
                    disabled={!!savingSection}
                  >
                    {savingSection === 'options' ? copy.saving : copy.saveSection}
                  </button>
                </div>
              ) : null}
            </section>
          </div>

          <div className="previewColumn">
            <section className="previewCard">
              <div className="previewTitle">{copy.livePreview}</div>

              <div className={`previewStore ${theme === 'dark' ? 'previewStoreDark' : ''}`}>
                <div className="previewHero">
                  {heroImage ? (
                    <img src={heroImage} alt={copy.heroPreview} className="previewHeroImage" />
                  ) : (
                    <div className="previewHeroFallback" />
                  )}

                  <div className="previewHeroOverlay">
                    {logoImage ? (
                      <img src={logoImage} alt={copy.logoPreview} className="previewHeroLogo" />
                    ) : (
                      <div className="previewHeroLogoFallback">{(name || 'M').charAt(0).toUpperCase()}</div>
                    )}

                    <div className="previewHeroText">
                      <h3>{name || 'Your Store'}</h3>
                      <p>{address || '123 Main St'}</p>
                      <p>{phone || '323 555 1212'}</p>
                    </div>
                  </div>
                </div>

                <div className="previewLanguageRow">
                  <button type="button" className={`previewLang ${storefrontLanguage === 'en' ? 'previewLangActive' : ''}`}>
                    EN
                  </button>
                  <button type="button" className={`previewLang ${storefrontLanguage === 'es' ? 'previewLangActive' : ''}`}>
                    ES
                  </button>
                </div>

                <div className="previewInfoGrid">
                  <div className="previewInfoBox">
                    <span>{copy.address}</span>
                    <strong>{address || '—'}</strong>
                  </div>

                  <div className="previewInfoBox">
                    <span>{copy.phone}</span>
                    <strong>{phone || '—'}</strong>
                  </div>

                  <div className="previewInfoBox">
                    <span>{copy.pickupOn.split(' ')[0]}</span>
                    <strong>{pickupEnabled ? copy.pickupOn : copy.pickupOff}</strong>
                  </div>

                  <div className="previewInfoBox">
                    <span>{copy.deliveryOn.split(' ')[0]}</span>
                    <strong>{deliveryEnabled ? copy.deliveryOn : copy.deliveryOff}</strong>
                  </div>
                </div>

                <div className="categoryTabs">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`categoryTab ${selectedCategoryId === category.id ? 'categoryTabActive' : ''}`}
                      onClick={() => selectCategory(category.id)}
                    >
                      {category.name || copy.categories}
                    </button>
                  ))}
                </div>

                <div className="previewMenuGrid">
                  {(selectedCategory?.items || []).map((item) => {
                    const itemImage = getResolvedItemImage(item);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`previewMenuCard ${previewItemId === item.id ? 'previewMenuCardActive' : ''}`}
                        onClick={() => setPreviewItemId(item.id)}
                      >
                        {itemImage ? (
                          <img src={itemImage} alt={item.name || copy.itemNameFallback} className="previewMenuThumb" />
                        ) : (
                          <div className="previewMenuThumbFallback">{copy.noImage}</div>
                        )}

                        <div className="previewMenuMeta">
                          <strong>{item.name || copy.itemNameFallback}</strong>
                          <span>{money(item.base_price)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {previewItem ? (
                  <div className="previewPopup">
                    <div className="previewPopupHeader">{copy.itemDetails}</div>

                    {getResolvedItemImage(previewItem) ? (
                      <img
                        src={getResolvedItemImage(previewItem)}
                        alt={previewItem.name || copy.itemNameFallback}
                        className="previewPopupImage"
                      />
                    ) : (
                      <div className="previewPopupImageFallback">{copy.noImage}</div>
                    )}

                    <div className="previewPopupBody">
                      <h4>{previewItem.name || copy.itemNameFallback}</h4>
                      <div className="previewPopupPrice">{money(previewItem.base_price)}</div>
                      <p>{previewItem.description || copy.describeItem}</p>
                      <button type="button" className="blackButton fullWidth">
                        {copy.addToCart}
                      </button>
                    </div>
                  </div>
                ) : null}

                <Link href={previewHref} className={`blackButton fullWidth ${previewHref === '#' ? 'isDisabled' : ''}`}>
                  {copy.openStore}
                </Link>
              </div>
            </section>
          </div>
        </div>

        <style jsx global>{`
          .page {
            min-height: 100vh;
            background: #efefe9;
            padding: 18px 12px 32px;
            display: grid;
            place-items: start center;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          .shell {
            width: min(100%, 1280px);
            background: #f8f7f2;
            border: 1px solid rgba(17, 17, 17, 0.08);
            border-radius: 34px;
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.08);
            padding: 16px;
          }

          .notch {
            width: 124px;
            height: 10px;
            border-radius: 999px;
            background: #111111;
            margin: 2px auto 18px;
          }

          .topBar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .brand {
            color: #111111;
            font-size: 34px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: -0.04em;
          }

          .topBarActions {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .langButton,
          .mainSaveButton,
          .blackButton,
          .softButton,
          .sectionSaveButton,
          .chip,
          .quickToolButton,
          .categoryTabButton,
          .itemCardButton,
          .tinySoftButton,
          .previewLang,
          .categoryTab,
          .previewMenuCard {
            border: 1px solid rgba(17, 17, 17, 0.1);
            border-radius: 18px;
            min-height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-weight: 900;
            font-size: 15px;
            transition: 0.2s ease;
          }

          .langButton,
          .softButton,
          .quickToolButton,
          .chip,
          .categoryTabButton,
          .itemCardButton,
          .tinySoftButton,
          .previewLang,
          .categoryTab,
          .previewMenuCard {
            background: #ffffff;
            color: #111111;
          }

          .mainSaveButton,
          .blackButton,
          .sectionSaveButton {
            background: #111111;
            color: #ffffff;
            border-color: #111111;
          }

          .mainSaveButton,
          .langButton {
            min-width: 88px;
            padding: 0 18px;
          }

          .mainSaveButton:disabled,
          .sectionSaveButton:disabled {
            opacity: 0.6;
          }

          .quickToolsCard,
          .sectionCard,
          .previewCard,
          .miniCard {
            background: #ffffff;
            border: 1px solid rgba(17, 17, 17, 0.08);
            border-radius: 26px;
          }

          .quickToolsCard {
            padding: 16px;
            margin-bottom: 14px;
          }

          .quickToolsTitle {
            color: #7b7b73;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            margin-bottom: 12px;
          }

          .quickToolsGrid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .quickToolButton {
            padding: 0 10px;
          }

          .message {
            border-radius: 20px;
            padding: 14px 16px;
            margin-bottom: 14px;
            font-size: 16px;
            font-weight: 900;
          }

          .error {
            background: #f8dfdf;
            color: #a03636;
          }

          .success {
            background: #e6f2e6;
            color: #22643a;
          }

          .heroCard {
            position: relative;
            min-height: 260px;
            border-radius: 28px;
            overflow: hidden;
            margin-bottom: 14px;
            background: #111111;
          }

          .heroImage,
          .heroFallback {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
          }

          .heroImage {
            object-fit: cover;
          }

          .heroFallback {
            background: linear-gradient(135deg, #181818 0%, #444444 100%);
          }

          .heroOverlay {
            position: relative;
            min-height: 260px;
            display: flex;
            align-items: flex-end;
            padding: 18px;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.7) 100%);
          }

          .heroIdentity {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .heroLogo,
          .heroLogoFallback {
            width: 84px;
            height: 84px;
            border-radius: 22px;
            background: #ffffff;
            object-fit: cover;
            flex-shrink: 0;
          }

          .heroLogoFallback {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            color: #111111;
            font-weight: 900;
          }

          .heroText {
            color: #ffffff;
          }

          .heroName {
            font-size: 56px;
            font-weight: 900;
            line-height: 0.95;
            letter-spacing: -0.05em;
          }

          .heroMetaRow {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            margin-top: 10px;
            font-size: 18px;
            font-weight: 800;
          }

          .introCard {
            margin-bottom: 14px;
          }

          .title {
            margin: 0;
            color: #111111;
            font-size: 34px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: -0.04em;
          }

          .subtitle {
            margin: 10px 0 0;
            color: #6f6f67;
            font-size: 18px;
            font-weight: 700;
          }

          .builderGrid {
            display: grid;
            grid-template-columns: minmax(0, 1.02fr) minmax(360px, 0.98fr);
            gap: 14px;
            align-items: start;
          }

          .builderControls,
          .previewColumn {
            display: grid;
            gap: 14px;
          }

          .sectionCard {
            overflow: hidden;
          }

          .sectionHeader {
            width: 100%;
            border: 0;
            background: transparent;
            padding: 16px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            text-align: left;
          }

          .sectionNumber {
            color: #8a8a84;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.16em;
            margin-bottom: 6px;
          }

          .sectionTitle {
            color: #111111;
            font-size: 22px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -0.04em;
          }

          .sectionChevron {
            color: #111111;
            font-size: 34px;
            line-height: 1;
          }

          .sectionBody {
            padding: 0 18px 18px;
            display: grid;
            gap: 14px;
          }

          .field,
          .uploadBlock,
          .itemEditor,
          .optionGroupList,
          .choiceList {
            display: grid;
            gap: 10px;
          }

          .label {
            color: #8a8a84;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.16em;
          }

          .input,
          .textarea {
            width: 100%;
            min-height: 56px;
            border-radius: 18px;
            border: 1px solid rgba(17, 17, 17, 0.1);
            background: #fbfbf8;
            color: #111111;
            padding: 0 16px;
            font-size: 18px;
            font-weight: 800;
          }

          .textarea {
            min-height: 128px;
            padding: 16px;
            resize: vertical;
          }

          .uploadTitle {
            color: #111111;
            font-size: 16px;
            font-weight: 900;
          }

          .uploadPreview,
          .emptyImageBox {
            width: 100%;
            min-height: 210px;
            border-radius: 22px;
            background: #f2f3ef;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #7f7f76;
            font-size: 20px;
            font-weight: 900;
            object-fit: cover;
            overflow: hidden;
          }

          .logoPreview {
            object-fit: contain;
            padding: 12px;
            background: #ffffff;
          }

          .blackButton,
          .softButton,
          .sectionSaveButton,
          .quickToolButton,
          .itemCardButton,
          .categoryTabButton {
            padding: 0 16px;
          }

          .fullWidth {
            width: 100%;
          }

          .halfWidth {
            width: 100%;
          }

          .chipRow,
          .rowButtons,
          .itemStrip,
          .categoryTabs,
          .previewLanguageRow,
          .previewInfoGrid,
          .previewMenuGrid,
          .quickToolsGrid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .chip {
            padding: 0 16px;
          }

          .chipActive,
          .categoryTabButtonActive,
          .previewLangActive,
          .categoryTabActive,
          .previewMenuCardActive,
          .itemCardButtonActive {
            background: #111111;
            color: #ffffff;
            border-color: #111111;
          }

          .miniCard {
            padding: 14px;
            display: grid;
            gap: 12px;
          }

          .miniCardTop {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .miniCardMeta {
            color: #7f7f76;
            font-size: 14px;
            font-weight: 900;
          }

          .itemStrip {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .itemCardButton {
            width: 100%;
            min-height: unset;
            padding: 0;
            overflow: hidden;
            display: grid;
            text-align: left;
          }

          .itemThumb,
          .itemThumbFallback {
            width: 100%;
            aspect-ratio: 1 / 0.84;
            object-fit: cover;
            background: #eef0ea;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #80807a;
            font-size: 14px;
            font-weight: 900;
          }

          .itemCardMeta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 12px;
            font-size: 14px;
            font-weight: 900;
          }

          .choiceRow {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 110px 52px;
            gap: 10px;
            align-items: center;
          }

          .choiceName,
          .choicePrice {
            min-height: 52px;
          }

          .tinySoftButton {
            min-width: 52px;
            padding: 0;
            font-size: 24px;
          }

          .emptyState {
            border-radius: 20px;
            border: 1px dashed rgba(17, 17, 17, 0.16);
            padding: 20px;
            text-align: center;
            color: #7d7d76;
            font-size: 16px;
            font-weight: 800;
            background: #fbfbf8;
          }

          .previewCard {
            padding: 16px;
            position: sticky;
            top: 18px;
          }

          .previewTitle {
            color: #111111;
            font-size: 18px;
            font-weight: 900;
            margin-bottom: 12px;
          }

          .previewStore {
            border-radius: 26px;
            border: 1px solid rgba(17, 17, 17, 0.08);
            background: #ffffff;
            overflow: hidden;
            padding-bottom: 16px;
          }

          .previewStoreDark {
            background: #111111;
            color: #ffffff;
          }

          .previewHero {
            position: relative;
            min-height: 260px;
            background: #111111;
          }

          .previewHeroImage,
          .previewHeroFallback {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
          }

          .previewHeroImage {
            object-fit: cover;
          }

          .previewHeroFallback {
            background: linear-gradient(135deg, #181818 0%, #444444 100%);
          }

          .previewHeroOverlay {
            position: relative;
            min-height: 260px;
            display: flex;
            align-items: flex-end;
            gap: 12px;
            padding: 16px;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.68) 100%);
          }

          .previewHeroLogo,
          .previewHeroLogoFallback {
            width: 70px;
            height: 70px;
            border-radius: 18px;
            background: #ffffff;
            object-fit: cover;
            flex-shrink: 0;
          }

          .previewHeroLogoFallback {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #111111;
            font-size: 24px;
            font-weight: 900;
          }

          .previewHeroText {
            color: #ffffff;
          }

          .previewHeroText h3 {
            margin: 0;
            font-size: 44px;
            font-weight: 900;
            line-height: 0.95;
            letter-spacing: -0.05em;
          }

          .previewHeroText p {
            margin: 8px 0 0;
            font-size: 16px;
            font-weight: 800;
          }

          .previewLanguageRow,
          .previewInfoGrid,
          .categoryTabs,
          .previewMenuGrid {
            padding: 14px 16px 0;
          }

          .previewLang,
          .categoryTab {
            min-width: 84px;
            padding: 0 14px;
          }

          .previewInfoGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .previewInfoBox {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(17, 17, 17, 0.08);
            border-radius: 18px;
            padding: 16px;
            display: grid;
            gap: 6px;
          }

          .previewStoreDark .previewInfoBox {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.08);
          }

          .previewInfoBox span {
            color: #8a8a84;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-weight: 900;
          }

          .previewStoreDark .previewInfoBox span {
            color: rgba(255, 255, 255, 0.7);
          }

          .previewInfoBox strong {
            color: #111111;
            font-size: 16px;
            font-weight: 900;
          }

          .previewStoreDark .previewInfoBox strong {
            color: #ffffff;
          }

          .previewMenuGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .previewMenuCard {
            width: 100%;
            min-height: unset;
            display: grid;
            padding: 0;
            overflow: hidden;
            text-align: left;
          }

          .previewMenuThumb,
          .previewMenuThumbFallback {
            width: 100%;
            aspect-ratio: 1 / 0.84;
            object-fit: cover;
            background: #ecefe8;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #7e7e77;
            font-size: 14px;
            font-weight: 900;
          }

          .previewMenuMeta {
            display: grid;
            gap: 4px;
            padding: 12px;
          }

          .previewMenuMeta strong {
            font-size: 16px;
          }

          .previewMenuMeta span {
            color: #6e6e67;
            font-size: 15px;
            font-weight: 900;
          }

          .previewStoreDark .previewMenuMeta span {
            color: rgba(255, 255, 255, 0.72);
          }

          .previewPopup {
            margin: 14px 16px 0;
            border-radius: 22px;
            border: 1px solid rgba(17, 17, 17, 0.08);
            background: #ffffff;
            overflow: hidden;
          }

          .previewStoreDark .previewPopup {
            background: #171717;
            border-color: rgba(255, 255, 255, 0.08);
          }

          .previewPopupHeader {
            padding: 14px 16px 0;
            color: #7f7f76;
            font-size: 12px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            font-weight: 900;
          }

          .previewStoreDark .previewPopupHeader {
            color: rgba(255, 255, 255, 0.72);
          }

          .previewPopupImage,
          .previewPopupImageFallback {
            width: calc(100% - 32px);
            margin: 14px 16px 0;
            border-radius: 20px;
            aspect-ratio: 1.25 / 1;
            object-fit: cover;
            background: #ecefe8;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #7e7e77;
            font-size: 18px;
            font-weight: 900;
          }

          .previewPopupBody {
            padding: 16px;
            display: grid;
            gap: 10px;
          }

          .previewPopupBody h4 {
            margin: 0;
            font-size: 30px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: -0.04em;
          }

          .previewPopupPrice {
            color: #111111;
            font-size: 22px;
            font-weight: 900;
          }

          .previewStoreDark .previewPopupPrice,
          .previewStoreDark .previewPopupBody h4,
          .previewStoreDark .previewPopupBody p {
            color: #ffffff;
          }

          .previewPopupBody p {
            margin: 0;
            color: #6e6e67;
            font-size: 16px;
            font-weight: 700;
          }

          .previewStore .blackButton {
            margin: 14px 16px 0;
            width: calc(100% - 32px);
          }

          .isDisabled {
            pointer-events: none;
            opacity: 0.5;
          }

          @media (max-width: 1100px) {
            .builderGrid {
              grid-template-columns: 1fr;
            }

            .previewCard {
              position: static;
            }
          }

          @media (max-width: 680px) {
            .shell {
              padding: 14px;
              border-radius: 28px;
            }

            .brand {
              font-size: 24px;
            }

            .topBar {
              flex-direction: column;
              align-items: stretch;
            }

            .topBarActions {
              justify-content: flex-end;
            }

            .quickToolsGrid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .heroCard,
            .heroOverlay {
              min-height: 220px;
            }

            .heroName {
              font-size: 34px;
            }

            .title {
              font-size: 28px;
            }

            .itemStrip,
            .previewMenuGrid,
            .previewInfoGrid {
              grid-template-columns: 1fr;
            }

            .choiceRow {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </main>
  );
}