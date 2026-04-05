'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';

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

type ExpandedSection = 'store' | 'branding' | 'theme' | 'menu' | 'item' | 'options' | null;

type CopyBlock = {
  builder: string;
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
  openStore: string;
  save: string;
  saving: string;
  liveUrl: string;
  storeName: string;
  phone: string;
  address: string;
  builderLanguage: string;
  storefrontLanguage: string;
  orderLanguage: string;
  storefrontTheme: string;
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
  dashboard: string;
  flyers: string;
  orders: string;
  more: string;
  categoriesAndItems: string;
  heroAndLogoImages: string;
};

const COPY: Record<LanguageMode, CopyBlock> = {
  en: {
    builder: 'BUILDER',
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
    openStore: 'Open Store',
    save: 'Save',
    saving: 'Saving...',
    liveUrl: 'Live URL',
    storeName: 'Store Name',
    phone: 'Phone',
    address: 'Address',
    builderLanguage: 'Builder Language',
    storefrontLanguage: 'Storefront Language',
    orderLanguage: 'Order Language',
    storefrontTheme: 'Storefront Theme',
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
    dashboard: 'Dashboard',
    flyers: 'Flyers',
    orders: 'Orders',
    more: 'More',
    categoriesAndItems: 'Categories & Items',
    heroAndLogoImages: 'Hero & Logo Images',
  },
  es: {
    builder: 'BUILDER',
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
    openStore: 'Abrir Tienda',
    save: 'Guardar',
    saving: 'Guardando...',
    liveUrl: 'URL en vivo',
    storeName: 'Nombre del Negocio',
    phone: 'Teléfono',
    address: 'Dirección',
    builderLanguage: 'Idioma del Constructor',
    storefrontLanguage: 'Idioma de la Tienda',
    orderLanguage: 'Idioma del Pedido',
    storefrontTheme: 'Tema de la Tienda',
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
    dashboard: 'Panel',
    flyers: 'Flyers',
    orders: 'Pedidos',
    more: 'Más',
    categoriesAndItems: 'Categorías y Productos',
    heroAndLogoImages: 'Hero y Logo',
  },
};

const PLACEHOLDER_BUCKET = 'menu-images';

const CATEGORY_FOLDER_MAP: Record<string, string> = {
  bbq: 'bbq',
  breakfast: 'breakfast',
  combo: 'combos',
  combos: 'combos',
  dessert: 'desserts',
  desserts: 'desserts',
  drink: 'drinks',
  drinks: 'drinks',
  hero: 'hero',
  logo: 'logo',
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

function normalizeAvailability(item: ItemRow): Availability {
  if (item.availability === 'sold_out' || item.is_available === false) return 'sold_out';
  return 'available';
}

function normalizeSelectionMode(group: OptionGroupRow): 'single' | 'multiple' {
  if (group.selection_mode === 'multiple' || group.is_multiple) return 'multiple';
  return 'single';
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

function IconStore() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 9.5 5.4 4h13.2L20 9.5M4 9.5h16M4 9.5v7.8A1.7 1.7 0 0 0 5.7 19h12.6a1.7 1.7 0 0 0 1.7-1.7V9.5M8 19v-5.1h8V19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.2 6.2A2.2 2.2 0 0 1 6.4 4h11.2a2.2 2.2 0 0 1 2.2 2.2v11.6a2.2 2.2 0 0 1-2.2 2.2H6.4a2.2 2.2 0 0 1-2.2-2.2Zm0 9.8 4.3-4.3a1.6 1.6 0 0 1 2.2 0l2.3 2.3 2.3-2.3a1.6 1.6 0 0 1 2.2 0l2.3 2.3M9 9.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5c-4.9 0-8.9 3.5-8.9 7.8 0 2 1 3.6 2.7 4.7 1 .6 1.4 1.4 1.2 2.2-.3 1.1.6 2 1.7 1.8.7-.1 1.4-.4 2.1-.4h1.1c4.9 0 8.9-3.5 8.9-7.8S16.9 3.5 12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.8" cy="10" r="1.1" fill="currentColor" />
      <circle cx="10.8" cy="7.9" r="1.1" fill="currentColor" />
      <circle cx="14.6" cy="8" r="1.1" fill="currentColor" />
      <circle cx="16.8" cy="11" r="1.1" fill="currentColor" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m9 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m4 20 4.2-1 9.1-9.1a1.9 1.9 0 0 0-2.7-2.7L5.5 16.3 4 20Zm9.8-12.8 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.4 12s3.4-5.8 9.6-5.8 9.6 5.8 9.6 5.8-3.4 5.8-9.6 5.8S2.4 12 2.4 12Zm9.6 2.9A2.9 2.9 0 1 0 12 9a2.9 2.9 0 0 0 0 5.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDots() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.9" fill="currentColor" />
      <circle cx="12" cy="12" r="1.9" fill="currentColor" />
      <circle cx="19" cy="12" r="1.9" fill="currentColor" />
    </svg>
  );
}

function IconDash() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Page() {
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
  const [placeholderMap, setPlaceholderMap] = useState<Record<string, string[]>>({});

  const copy = COPY[builderLanguage];
  const normalizedSlug = useMemo(() => slugify(name), [name]);
  const previewLink = normalizedSlug ? `/store/${normalizedSlug}` : '';

  useEffect(() => {
    setSlug(normalizedSlug);
  }, [normalizedSlug]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('menuflow_builder_language') : null;
    if (stored === 'en' || stored === 'es') setBuilderLanguage(stored);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('menuflow_builder_language', builderLanguage);
    }
  }, [builderLanguage]);

  useEffect(() => {
    let active = true;

    async function loadPlaceholderMap() {
      try {
        const folders = Array.from(new Set(Object.values(CATEGORY_FOLDER_MAP)));
        const nextMap: Record<string, string[]> = {};

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
            const { data: publicUrlData } = supabase.storage.from(PLACEHOLDER_BUCKET).getPublicUrl(`${folder}/${file.name}`);
            if (publicUrlData?.publicUrl) urls.push(publicUrlData.publicUrl);
          }

          nextMap[folder] = urls;
        }

        if (!active) return;
        setPlaceholderMap(nextMap);
      } catch {
        if (!active) return;
      }
    }

    void loadPlaceholderMap();

    return () => {
      active = false;
    };
  }, []);

  async function loadBuilderData(activeOverride = true) {
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

      if (!activeOverride) return;

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
      if (!activeOverride) return;

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
        await loadMenuBuilder(currentRestaurantId, activeOverride);
      } else {
        const starter = getEmptyStarter(copy);
        if (!activeOverride) return;
        setCategories(starter);
        setSelectedCategoryId(starter[0].id);
        setSelectedItemId(starter[0].items[0].id);
      }
    } catch (err: any) {
      setError(err?.message || copy.couldNotLoad);
    } finally {
      if (activeOverride) setLoading(false);
    }
  }

  async function loadMenuBuilder(currentRestaurantId: string, activeOverride = true) {
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

    if (!activeOverride) return;

    const mappedCategories: BuilderCategory[] = safeArray(categoryData).map((category, categoryIndex) => {
      const categoryItems: BuilderItem[] = itemRows
        .filter((item) => item.category_id === category.id)
        .map((item) => {
          const groups: BuilderOptionGroup[] = groupData
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
            }));

          return {
            id: item.id,
            category_id: category.id,
            name: item.name || '',
            base_price: String(item.base_price ?? item.price ?? 0),
            description: item.description || '',
            image_url: item.image_url || '',
            availability: normalizeAvailability(item),
            option_groups: groups,
          };
        });

      return {
        id: category.id,
        name: category.name || `${copy.menu} ${categoryIndex + 1}`,
        sort_order: category.sort_order ?? categoryIndex,
        items: categoryItems,
      };
    });

    if (mappedCategories.length) {
      setCategories(mappedCategories);
      const firstCategory = mappedCategories[0];
      const firstItem = firstCategory.items[0] || null;
      setSelectedCategoryId(firstCategory.id);
      setSelectedItemId(firstItem?.id || '');
    } else {
      const starter = getEmptyStarter(copy);
      setCategories(starter);
      setSelectedCategoryId(starter[0].id);
      setSelectedItemId(starter[0].items[0].id);
    }
  }

  useEffect(() => {
    let active = true;
    void loadBuilderData(active);
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!categories.length) return;

    const selectedCategoryStillExists = categories.some((category) => category.id === selectedCategoryId);
    const allItems = categories.flatMap((category) => category.items);
    const selectedItemStillExists = allItems.some((item) => item.id === selectedItemId);

    if (!selectedCategoryStillExists) {
      const firstCategory = categories[0];
      setSelectedCategoryId(firstCategory.id);
      setSelectedItemId(firstCategory.items[0]?.id || '');
      return;
    }

    if (!selectedItemStillExists) {
      const currentCategory = categories.find((category) => category.id === selectedCategoryId) || categories[0];
      setSelectedItemId(currentCategory.items[0]?.id || '');
    }
  }, [categories, selectedCategoryId, selectedItemId]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const selectedItem = useMemo(() => {
    const allItems = categories.flatMap((category) => category.items);
    return allItems.find((item) => item.id === selectedItemId) || allItems[0] || null;
  }, [categories, selectedItemId]);

  function getCategoryNameById(categoryId: string) {
    return categories.find((category) => category.id === categoryId)?.name || '';
  }

  function getPlaceholderForItem(item: BuilderItem) {
    const categoryName = getCategoryNameById(item.category_id);
    const folder = normalizeCategoryNameToFolder(categoryName);
    if (!folder) return '';
    const urls = placeholderMap[folder] || [];
    return pickDeterministicImage(urls, item.id || item.name || folder);
  }

  function getResolvedItemImage(item: BuilderItem | null) {
    if (!item) return '';
    if (item.image_url?.trim()) return item.image_url;
    return getPlaceholderForItem(item);
  }

  function setOpen(section: ExpandedSection) {
    setExpanded((current) => (current === section ? null : section));
  }

  function selectCategory(categoryId: string) {
    const category = categories.find((entry) => entry.id === categoryId);
    setSelectedCategoryId(categoryId);
    setSelectedItemId(category?.items[0]?.id || '');
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
      const url = await uploadToBucket(file, 'heroes');
      setHeroImage(url);
      setExpanded('branding');
    } catch (err: any) {
      setError(err?.message || copy.couldNotUploadHero);
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
      setExpanded('branding');
    } catch (err: any) {
      setError(err?.message || copy.couldNotUploadLogo);
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
    } catch (err: any) {
      setError(err?.message || copy.couldNotUploadItem);
    } finally {
      setUploadingItemId(null);
    }
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
    const nextCategory = next[0] || null;
    setSelectedCategoryId(nextCategory?.id || '');
    setSelectedItemId(nextCategory?.items[0]?.id || '');
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

    const nextCategory =
      nextCategories.find((category) => category.id === categoryId && category.items.length) ||
      nextCategories.find((category) => category.items.length) ||
      nextCategories[0] ||
      null;

    const nextItem = nextCategory?.items[0] || null;
    setSelectedCategoryId(nextCategory?.id || '');
    setSelectedItemId(nextItem?.id || '');
  }

  function addOptionGroup(itemId: string, presetType: BuilderOptionGroup['presetType']) {
    const groupId = uid('group');
    const optionSeed = getPresetOptions(presetType);

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
                        options: [...group.options, { id: optionId, name: copy.newChoice, price: '0' }],
                      }
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

      const existingCategoryIds = safeArray(existingCategories).map((row: any) => row.id);
      const existingItemIds = safeArray(existingItems).map((row: any) => row.id);

      let existingGroupIds: string[] = [];

      if (existingItemIds.length) {
        const { data: existingGroups, error: existingGroupsError } = await supabase
          .from('menu_option_groups')
          .select('id')
          .in('item_id', existingItemIds);

        if (existingGroupsError) throw existingGroupsError;
        existingGroupIds = safeArray(existingGroups).map((row: any) => row.id);
      }

      if (existingGroupIds.length) {
        const { error: deleteChoicesError } = await supabase
          .from('menu_option_choices')
          .delete()
          .in('option_group_id', existingGroupIds);

        if (deleteChoicesError) throw deleteChoicesError;
      }

      if (existingItemIds.length) {
        const { error: deleteGroupsError } = await supabase
          .from('menu_option_groups')
          .delete()
          .in('item_id', existingItemIds);

        if (deleteGroupsError) throw deleteGroupsError;
      }

      if (existingItemIds.length) {
        const { error: deleteItemsError } = await supabase.from('menu_items').delete().in('id', existingItemIds);
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
        name: category.name.trim() || `${copy.menu} ${categoryIndex + 1}`,
        sort_order: categoryIndex,
      }));

      if (allCategories.length) {
        const { error: categoryInsertError } = await supabase.from('menu_categories').insert(allCategories);
        if (categoryInsertError) throw categoryInsertError;
      }

      const allItems = categories.flatMap((category, categoryIndex) =>
        category.items.map((item, itemIndex) => ({
          id: item.id,
          restaurant_id: currentRestaurantId,
          category_id: category.id,
          name: item.name.trim() || copy.itemNameFallback,
          base_price: Number(item.base_price || 0),
          price: Number(item.base_price || 0),
          description: item.description.trim() || null,
          image_url: item.image_url || getResolvedItemImage(item) || null,
          availability: item.availability,
          is_available: item.availability === 'available',
          sort_order: itemIndex + categoryIndex * 100,
        }))
      );

      if (allItems.length) {
        const { error: itemInsertError } = await supabase.from('menu_items').insert(allItems);
        if (itemInsertError) throw itemInsertError;
      }

      const allOptionGroups = categories.flatMap((category) =>
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

      if (allOptionGroups.length) {
        const { error: groupInsertError } = await supabase.from('menu_option_groups').insert(allOptionGroups);
        if (groupInsertError) throw groupInsertError;
      }

      const allChoices = categories.flatMap((category) =>
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

      if (allChoices.length) {
        const { error: choiceInsertError } = await supabase.from('menu_option_choices').insert(allChoices);
        if (choiceInsertError) throw choiceInsertError;
      }

      await loadBuilderData(true);
      setSuccess(copy.builderSaved);
    } catch (err: any) {
      setError(err?.message || copy.couldNotSave);
    } finally {
      setSaving(false);
    }
  }

  const categoryPreviewImage = selectedCategory?.items?.[0] ? getResolvedItemImage(selectedCategory.items[0]) : '';
  const selectedItemImage = getResolvedItemImage(selectedItem);

  function SummaryCard({
    icon,
    title,
    summary,
    rightLabel,
    section,
  }: {
    icon: ReactNode;
    title: string;
    summary?: ReactNode;
    rightLabel?: ReactNode;
    section: ExpandedSection;
  }) {
    return (
      <div className="summaryWrap">
        <button type="button" className="summaryCard" onClick={() => setOpen(section)}>
          <div className="summaryRow">
            <div className="summaryLeft">
              <span className="iconBox">{icon}</span>
              <span className="summaryTitle">{title}</span>
            </div>

            <div className="summaryRight">
              {rightLabel ? <span className="summaryMetaLabel">{rightLabel}</span> : null}
              <span className="summaryChevron">
                <IconChevron />
              </span>
            </div>
          </div>

          {summary ? <div className="summaryBody">{summary}</div> : null}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="page">
        <div className="appShell loadingShell">
          <div className="topNotch" />
          <div className="loadingCard">{copy.loading}</div>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            background: #eef0f4;
            padding: 18px 12px 28px;
            display: grid;
            place-items: start center;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .appShell {
            width: min(100%, 430px);
            border-radius: 34px;
            background: #ffffff;
            border: 1px solid rgba(15, 23, 42, 0.08);
            box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
            padding: 14px;
          }
          .loadingShell {
            min-height: 200px;
          }
          .topNotch {
            width: 122px;
            height: 8px;
            border-radius: 999px;
            background: #111827;
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
      <div className="appShell">
        <div className="topNotch" />

        <div className="topBar">
          <div className="brand">
            <span className="brandStrong">MENUFLOW</span>
            <span className="brandSoft"> {copy.builder}</span>
          </div>

          <div className="topBarActions">
            <button
              type="button"
              className="langButton"
              onClick={() => setBuilderLanguage(builderLanguage === 'en' ? 'es' : 'en')}
            >
              {builderLanguage.toUpperCase()}
              <span className="langCaret">⌄</span>
            </button>

            <button type="button" className="saveButton" onClick={handleSave} disabled={saving}>
              {saving ? copy.saving : copy.save}
            </button>
          </div>
        </div>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <section className="heroWrap">
          {heroImage ? <img src={heroImage} alt="Hero" className="heroImage" /> : <div className="heroImage heroFallback" />}
          <div className="heroShade" />

          <div className="heroContent">
            <div className="heroIdentity">
              {logoImage ? (
                <img src={logoImage} alt="Logo" className="heroLogo" />
              ) : (
                <div className="heroLogo heroLogoFallback">{(name.trim() || 'M').charAt(0).toUpperCase()}</div>
              )}

              <div className="heroName">{name.trim() || 'Your Store'}</div>
            </div>

            <div className="heroMeta">
              <span>{address.trim() || '123 Main St, Los Angeles, CA'}</span>
              <span>{phone.trim() || '323-555-1234'}</span>
            </div>
          </div>
        </section>

        <section className="introCard">
          <h1 className="title">{copy.title}</h1>
          <p className="subtitle">{copy.subtitle}</p>

          {previewLink ? (
            <Link href={previewLink} target="_blank" className="previewStoreButton">
              <span className="previewIcon">
                <IconEye />
              </span>
              {copy.previewStore}
            </Link>
          ) : (
            <button type="button" className="previewStoreButton" disabled>
              <span className="previewIcon">
                <IconEye />
              </span>
              {copy.previewStore}
            </button>
          )}
        </section>

        <section className="stack">
          <SummaryCard
            section="store"
            icon={<IconStore />}
            title={copy.storeSetup}
            rightLabel={<IconEdit />}
            summary={
              <div className="simpleSummary">
                <div className="simpleSummaryTitle">{name.trim() || 'Your Store'}</div>
                <div>{phone.trim() || '323-555-1234'}</div>
                <div>{address.trim() || '123 Main St, Los Angeles, CA'}</div>
              </div>
            }
          />

          {expanded === 'store' ? (
            <div className="panel">
              <label className="field">
                <span className="fieldLabel">{copy.storeName}</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Fiesta Grill" />
              </label>

              <div className="miniInfoCard">
                <span className="fieldLabel">{copy.liveUrl}</span>
                <strong>{slug ? `/store/${slug}` : '/store/your-store'}</strong>
              </div>

              <label className="field">
                <span className="fieldLabel">{copy.phone}</span>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="323-555-1234" />
              </label>

              <label className="field">
                <span className="fieldLabel">{copy.address}</span>
                <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Los Angeles, CA" />
              </label>
            </div>
          ) : null}

          <SummaryCard
            section="branding"
            icon={<IconImage />}
            title={copy.branding}
            rightLabel={copy.heroAndLogoImages}
          />

          {expanded === 'branding' ? (
            <div className="panel">
              <div className="uploadCard">
                <div className="uploadCardTitle">{copy.uploadHeroImage}</div>
                <label className="primaryAction">
                  {uploadingHero ? copy.saving : copy.uploadHeroImage}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      void handleHeroUpload(e.target.files?.[0] || null);
                    }}
                  />
                </label>

                {heroImage ? (
                  <img src={heroImage} alt="Hero" className="uploadPreview" />
                ) : (
                  <div className="uploadPreviewPlaceholder">{copy.heroPreview}</div>
                )}
              </div>

              <div className="uploadCard">
                <div className="uploadCardTitle">{copy.uploadLogo}</div>
                <label className="primaryAction">
                  {uploadingLogo ? copy.saving : copy.uploadLogo}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      void handleLogoUpload(e.target.files?.[0] || null);
                    }}
                  />
                </label>

                {logoImage ? (
                  <img src={logoImage} alt="Logo" className="logoPreview" />
                ) : (
                  <div className="uploadPreviewPlaceholder">{copy.logoPreview}</div>
                )}
              </div>
            </div>
          ) : null}

          <SummaryCard
            section="theme"
            icon={<IconPalette />}
            title={copy.theme}
            rightLabel={
              <div className="inlineToggle" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={theme === 'light' ? 'inlineToggleButton inlineToggleButtonActive' : 'inlineToggleButton'}
                  onClick={() => setTheme('light')}
                >
                  {copy.light}
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'inlineToggleButton inlineToggleButtonActive' : 'inlineToggleButton'}
                  onClick={() => setTheme('dark')}
                >
                  {copy.dark}
                </button>
              </div>
            }
          />

          {expanded === 'theme' ? (
            <div className="panel">
              <div className="field">
                <span className="fieldLabel">{copy.builderLanguage}</span>
                <div className="chipRow">
                  <button
                    type="button"
                    className={builderLanguage === 'en' ? 'chip chipActive' : 'chip'}
                    onClick={() => setBuilderLanguage('en')}
                  >
                    {copy.english}
                  </button>
                  <button
                    type="button"
                    className={builderLanguage === 'es' ? 'chip chipActive' : 'chip'}
                    onClick={() => setBuilderLanguage('es')}
                  >
                    {copy.spanish}
                  </button>
                </div>
              </div>

              <div className="field">
                <span className="fieldLabel">{copy.storefrontLanguage}</span>
                <div className="chipRow">
                  <button
                    type="button"
                    className={storefrontLanguage === 'en' ? 'chip chipActive' : 'chip'}
                    onClick={() => setStorefrontLanguage('en')}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={storefrontLanguage === 'es' ? 'chip chipActive' : 'chip'}
                    onClick={() => setStorefrontLanguage('es')}
                  >
                    ES
                  </button>
                </div>
              </div>

              <div className="field">
                <span className="fieldLabel">{copy.orderLanguage}</span>
                <div className="chipRow">
                  <button
                    type="button"
                    className={orderLanguage === 'en' ? 'chip chipActive' : 'chip'}
                    onClick={() => setOrderLanguage('en')}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={orderLanguage === 'es' ? 'chip chipActive' : 'chip'}
                    onClick={() => setOrderLanguage('es')}
                  >
                    ES
                  </button>
                </div>
              </div>

              <div className="field">
                <span className="fieldLabel">
                  {copy.pickupOn.replace(' On', '').replace(' Activada', '')} / {copy.deliveryOn.replace(' On', '').replace(' Activada', '')}
                </span>
                <div className="chipRow">
                  <button
                    type="button"
                    className={pickupEnabled ? 'chip chipActive wideChip' : 'chip wideChip'}
                    onClick={() => setPickupEnabled((current) => !current)}
                  >
                    {pickupEnabled ? copy.pickupOn : copy.pickupOff}
                  </button>
                  <button
                    type="button"
                    className={deliveryEnabled ? 'chip chipActive wideChip' : 'chip wideChip'}
                    onClick={() => setDeliveryEnabled((current) => !current)}
                  >
                    {deliveryEnabled ? copy.deliveryOn : copy.deliveryOff}
                  </button>
                </div>
              </div>

              <label className="field">
                <span className="fieldLabel">{copy.deliveryFee}</span>
                <input className="input" value={deliveryFee} onChange={(e) => setDeliveryFee(sanitizeNumberInput(e.target.value))} placeholder="0" />
              </label>

              <label className="field">
                <span className="fieldLabel">{copy.deliveryRadius}</span>
                <input className="input" value={deliveryRadius} onChange={(e) => setDeliveryRadius(sanitizeNumberInput(e.target.value))} placeholder="5" />
              </label>

              <label className="field">
                <span className="fieldLabel">{copy.deliveryMinimum}</span>
                <input className="input" value={deliveryMinimum} onChange={(e) => setDeliveryMinimum(sanitizeNumberInput(e.target.value))} placeholder="0" />
              </label>
            </div>
          ) : null}

          <SummaryCard
            section="menu"
            icon={<IconGrid />}
            title={copy.menu}
            rightLabel={copy.categoriesAndItems}
            summary={
              <div className="menuSummary">
                <div className="menuThumb">
                  {categoryPreviewImage ? <img src={categoryPreviewImage} alt="Menu preview" className="menuThumbImage" /> : <div className="menuThumbPlaceholder" />}
                </div>

                <div className="menuSummaryText">
                  <div className="menuSummaryHeadline">
                    {(selectedCategory?.name || 'Featured') + (categories.length > 1 ? ` +${categories.length - 1} more` : '')}
                  </div>

                  <div className="menuMiniList">
                    {safeArray(selectedCategory?.items).slice(0, 2).map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="menuMiniListItem"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectItem(item.id);
                        }}
                      >
                        <span>{item.name || copy.itemNameFallback}</span>
                        <span className="menuMiniArrow">
                          <IconChevron />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            }
          />

          {expanded === 'menu' ? (
            <div className="panel">
              <button type="button" className="primaryWide" onClick={addCategory}>
                {copy.addCategory}
              </button>

              <div className="categoryStack">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={category.id === selectedCategoryId ? 'categoryCard categoryCardActive' : 'categoryCard'}
                  >
                    <button type="button" className="categoryHeader" onClick={() => selectCategory(category.id)}>
                      <span>{category.name || 'Featured'}</span>
                      <span className="categoryCount">{category.items.length}</span>
                    </button>

                    <input
                      className="input slimInput"
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, e.target.value)}
                      placeholder={copy.categoryName}
                    />

                    <button type="button" className="dangerWide" onClick={() => deleteCategory(category.id)}>
                      {copy.delete}
                    </button>
                  </div>
                ))}
              </div>

              {selectedCategory ? (
                <>
                  <button type="button" className="primaryWide" onClick={() => addItem(selectedCategory.id)}>
                    {copy.addItem}
                  </button>

                  <div className="itemList">
                    {selectedCategory.items.map((item) => {
                      const itemImage = getResolvedItemImage(item);
                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={item.id === selectedItemId ? 'itemCard itemCardActive' : 'itemCard'}
                          onClick={() => selectItem(item.id)}
                        >
                          <div className="itemCardImageWrap">
                            {itemImage ? <img src={itemImage} alt={item.name} className="itemCardImage" /> : <div className="itemCardImagePlaceholder" />}
                          </div>

                          <div className="itemCardInfo">
                            <strong>{item.name || copy.itemNameFallback}</strong>
                            <span>{money(item.base_price)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {selectedItem ? (
            <>
              <SummaryCard
                section="item"
                icon={<IconGrid />}
                title={copy.itemBuilder}
                summary={
                  <div className="simpleSummary">
                    <div className="simpleSummaryTitle">{selectedItem.name || copy.itemNameFallback}</div>
                    <div>{money(selectedItem.base_price)}</div>
                  </div>
                }
              />

              {expanded === 'item' ? (
                <div className="panel">
                  <button type="button" className="dangerWide" onClick={() => deleteItem(selectedItem.category_id, selectedItem.id)}>
                    {copy.deleteItem}
                  </button>

                  <div className="uploadCard">
                    <div className="uploadCardTitle">{copy.uploadItemImage}</div>
                    <label className="primaryAction">
                      {uploadingItemId === selectedItem.id ? copy.saving : copy.uploadItemImage}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          void handleItemImageUpload(selectedItem.id, e.target.files?.[0] || null);
                        }}
                      />
                    </label>

                    {selectedItemImage ? (
                      <img src={selectedItemImage} alt={selectedItem.name} className="uploadPreview" />
                    ) : (
                      <div className="uploadPreviewPlaceholder">{copy.itemPreview}</div>
                    )}
                  </div>

                  <label className="field">
                    <span className="fieldLabel">{copy.itemName}</span>
                    <input className="input" value={selectedItem.name} onChange={(e) => updateItem(selectedItem.id, { name: e.target.value })} />
                  </label>

                  <label className="field">
                    <span className="fieldLabel">{copy.basePrice}</span>
                    <input
                      className="input"
                      value={selectedItem.base_price}
                      onChange={(e) => updateItem(selectedItem.id, { base_price: sanitizeNumberInput(e.target.value) })}
                    />
                  </label>

                  <label className="field">
                    <span className="fieldLabel">{copy.description}</span>
                    <textarea
                      className="textarea"
                      value={selectedItem.description}
                      onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })}
                    />
                  </label>

                  <div className="field">
                    <span className="fieldLabel">{copy.availability}</span>
                    <div className="chipRow">
                      <button
                        type="button"
                        className={selectedItem.availability === 'available' ? 'chip chipActive wideChip' : 'chip wideChip'}
                        onClick={() => updateItem(selectedItem.id, { availability: 'available' })}
                      >
                        {copy.available}
                      </button>
                      <button
                        type="button"
                        className={selectedItem.availability === 'sold_out' ? 'chip chipActive wideChip' : 'chip wideChip'}
                        onClick={() => updateItem(selectedItem.id, { availability: 'sold_out' })}
                      >
                        {copy.soldOut}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <SummaryCard
                section="options"
                icon={<IconGrid />}
                title={copy.optionGroups}
                summary={
                  <div className="simpleSummary">
                    <div>{selectedItem.option_groups.length ? `${selectedItem.option_groups.length} groups` : copy.noOptionGroups}</div>
                  </div>
                }
              />

              {expanded === 'options' ? (
                <div className="panel">
                  <div className="presetGrid">
                    <button type="button" className="presetChip" onClick={() => addOptionGroup(selectedItem.id, 'protein')}>
                      {copy.protein}
                    </button>
                    <button type="button" className="presetChip" onClick={() => addOptionGroup(selectedItem.id, 'size')}>
                      {copy.size}
                    </button>
                    <button type="button" className="presetChip" onClick={() => addOptionGroup(selectedItem.id, 'drink')}>
                      {copy.drink}
                    </button>
                    <button type="button" className="presetChip" onClick={() => addOptionGroup(selectedItem.id, 'extras')}>
                      {copy.extras}
                    </button>
                    <button type="button" className="presetChip" onClick={() => addOptionGroup(selectedItem.id, 'removals')}>
                      {copy.removals}
                    </button>
                    <button type="button" className="presetChip" onClick={() => addOptionGroup(selectedItem.id, 'custom')}>
                      {copy.custom}
                    </button>
                  </div>

                  {selectedItem.option_groups.length ? (
                    <div className="optionGroupStack">
                      {selectedItem.option_groups.map((group) => (
                        <div key={group.id} className="optionGroupCard">
                          <input
                            className="input slimInput"
                            value={group.name}
                            onChange={(e) => updateOptionGroup(selectedItem.id, group.id, { name: e.target.value })}
                          />

                          <div className="chipRow">
                            <button
                              type="button"
                              className={group.required ? 'chip chipActive' : 'chip'}
                              onClick={() => updateOptionGroup(selectedItem.id, group.id, { required: !group.required })}
                            >
                              {group.required ? copy.required : copy.optional}
                            </button>

                            <button
                              type="button"
                              className={group.selection === 'single' ? 'chip chipActive' : 'chip'}
                              onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'single' })}
                            >
                              {copy.singleChoice}
                            </button>

                            <button
                              type="button"
                              className={group.selection === 'multiple' ? 'chip chipActive' : 'chip'}
                              onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'multiple' })}
                            >
                              {copy.multipleChoice}
                            </button>
                          </div>

                          <div className="choiceStack">
                            {group.options.map((option) => (
                              <div key={option.id} className="choiceRow">
                                <input
                                  className="input slimInput choiceNameInput"
                                  value={option.name}
                                  onChange={(e) =>
                                    updateOptionChoice(selectedItem.id, group.id, option.id, { name: e.target.value })
                                  }
                                  placeholder={copy.choiceName}
                                />
                                <input
                                  className="input slimInput choicePriceInput"
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
                                  className="miniDanger"
                                  onClick={() => deleteOptionChoice(selectedItem.id, group.id, option.id)}
                                >
                                  {copy.delete}
                                </button>
                              </div>
                            ))}
                          </div>

                          <button type="button" className="secondaryWide" onClick={() => addOptionChoice(selectedItem.id, group.id)}>
                            {copy.addChoice}
                          </button>

                          <button type="button" className="dangerWide" onClick={() => deleteOptionGroup(selectedItem.id, group.id)}>
                            {copy.delete}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="emptyState">{copy.noOptionGroups}</div>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        <nav className="bottomNav">
          <button type="button" className="navItem">
            <span className="navIcon" />
            <span>{copy.dashboard}</span>
          </button>
          <button type="button" className="navItem">
            <span className="navIcon" />
            <span>{copy.builder}</span>
          </button>
          <button type="button" className="navItem navItemActive">
            <span className="navIcon" />
            <span>{copy.previewStore.split(' ')[0]}</span>
          </button>
          <button type="button" className="navItem">
            <span className="navIcon" />
            <span>{copy.flyers}</span>
          </button>
          <button type="button" className="navItem">
            <span className="navIcon" />
            <span>{copy.orders}</span>
          </button>
          <button type="button" className="navItem">
            <span className="navIcon" />
            <span>{copy.more}</span>
          </button>
        </nav>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #eef0f4;
          padding: 18px 12px 28px;
          display: grid;
          place-items: start center;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .appShell {
          width: min(100%, 430px);
          border-radius: 34px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
          padding: 14px 14px 92px;
          position: relative;
          overflow: hidden;
        }

        .topNotch {
          width: 122px;
          height: 8px;
          border-radius: 999px;
          background: #111827;
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
          min-width: 0;
          white-space: nowrap;
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

        .topBarActions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }

        .langButton,
        .saveButton {
          min-height: 42px;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 800;
          background: #ffffff;
          color: #111827;
        }

        .saveButton {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        .saveButton:disabled {
          opacity: 0.65;
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

        .heroWrap {
          position: relative;
          margin: 0 -14px;
          min-height: 188px;
          overflow: hidden;
          background: #111827;
        }

        .heroImage,
        .heroFallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .heroFallback {
          background: linear-gradient(135deg, #1f2937 0%, #475569 100%);
        }

        .heroShade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.62) 100%);
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
          object-fit: cover;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
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
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
        }

        .heroMeta {
          margin-top: 12px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          color: rgba(255, 255, 255, 0.96);
          font-size: 14px;
          font-weight: 700;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
        }

        .introCard {
          padding: 18px 2px 14px;
        }

        .title {
          margin: 0;
          color: #111827;
          font-size: 26px;
          line-height: 1.04;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .subtitle {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 15px;
          line-height: 1.45;
          font-weight: 600;
        }

        .previewStoreButton {
          width: 100%;
          margin-top: 16px;
          min-height: 52px;
          border-radius: 10px;
          background: linear-gradient(180deg, #1e2430 0%, #10131a 100%);
          border: 1px solid rgba(17, 24, 39, 0.18);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          font-size: 17px;
          font-weight: 900;
        }

        .previewStoreButton:disabled {
          opacity: 0.55;
        }

        .previewIcon {
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .stack {
          display: grid;
          gap: 12px;
        }

        .summaryWrap,
        .panel {
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        .summaryCard {
          width: 100%;
          border: none;
          background: transparent;
          text-align: left;
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .summaryRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .summaryLeft {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .iconBox {
          width: 22px;
          height: 22px;
          color: #111827;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .summaryTitle {
          color: #111827;
          font-size: 18px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .summaryRight {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .summaryMetaLabel {
          color: #6b7280;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .summaryChevron {
          width: 16px;
          height: 16px;
          color: #6b7280;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .summaryBody {
          color: #374151;
        }

        .simpleSummary {
          display: grid;
          gap: 4px;
          font-size: 14px;
          font-weight: 600;
        }

        .simpleSummaryTitle {
          color: #111827;
          font-size: 17px;
          font-weight: 900;
        }

        .menuSummary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: start;
        }

        .menuThumb {
          aspect-ratio: 1.25 / 1;
          border-radius: 12px;
          overflow: hidden;
          background: #e5e7eb;
        }

        .menuThumbImage,
        .menuThumbPlaceholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .menuThumbPlaceholder {
          background: linear-gradient(135deg, #e7ebf0 0%, #d8dee7 100%);
        }

        .menuSummaryText {
          display: grid;
          gap: 8px;
        }

        .menuSummaryHeadline {
          color: #111827;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 900;
        }

        .menuMiniList {
          display: grid;
          gap: 6px;
        }

        .menuMiniListItem {
          min-height: 42px;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          padding: 0 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #374151;
          font-size: 14px;
          font-weight: 700;
        }

        .menuMiniArrow {
          width: 16px;
          height: 16px;
          color: #6b7280;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .panel {
          padding: 14px;
          display: grid;
          gap: 12px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .fieldLabel {
          color: #6b7280;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .miniInfoCard {
          border-radius: 12px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid rgba(15, 23, 42, 0.08);
          display: grid;
          gap: 4px;
        }

        .miniInfoCard strong {
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
          min-height: 56px;
          padding: 0 14px;
        }

        .slimInput {
          min-height: 48px;
        }

        .textarea {
          min-height: 140px;
          padding: 14px;
          resize: vertical;
        }

        .uploadCard {
          border-radius: 14px;
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          display: grid;
          gap: 12px;
        }

        .uploadCardTitle {
          color: #111827;
          font-size: 16px;
          font-weight: 900;
        }

        .primaryAction,
        .primaryWide,
        .secondaryWide,
        .dangerWide,
        .chip,
        .presetChip,
        .miniDanger {
          min-height: 52px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 900;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #ffffff;
          color: #111827;
        }

        .primaryAction,
        .primaryWide {
          background: #111827;
          border-color: #111827;
          color: #ffffff;
        }

        .secondaryWide {
          background: #f8fafc;
        }

        .dangerWide,
        .miniDanger {
          background: #f7e3e3;
          border-color: transparent;
          color: #a12e2e;
        }

        .primaryWide,
        .secondaryWide,
        .dangerWide {
          width: 100%;
        }

        .uploadPreview,
        .logoPreview,
        .uploadPreviewPlaceholder {
          width: 100%;
          height: 190px;
          border-radius: 14px;
          display: block;
        }

        .uploadPreview {
          object-fit: cover;
        }

        .logoPreview {
          object-fit: contain;
          padding: 18px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .uploadPreviewPlaceholder {
          background: #eef1f5;
          color: #6b7280;
          font-size: 16px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .inlineToggle {
          display: inline-flex;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #f3f4f6;
        }

        .inlineToggleButton {
          min-height: 34px;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 800;
          background: transparent;
          color: #374151;
        }

        .inlineToggleButtonActive {
          background: #111827;
          color: #ffffff;
        }

        .chipRow,
        .presetGrid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chip {
          padding: 0 18px;
        }

        .chipActive {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        .wideChip {
          min-width: 128px;
        }

        .presetChip {
          min-width: calc(50% - 5px);
          padding: 0 14px;
        }

        .categoryStack,
        .itemList,
        .optionGroupStack {
          display: grid;
          gap: 12px;
        }

        .categoryCard,
        .optionGroupCard {
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          padding: 12px;
          background: #ffffff;
          display: grid;
          gap: 10px;
        }

        .categoryCardActive {
          border-color: rgba(17, 24, 39, 0.24);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .categoryHeader {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #111827;
          font-size: 18px;
          font-weight: 900;
        }

        .categoryCount {
          min-width: 36px;
          min-height: 36px;
          border-radius: 999px;
          background: #f3f4f6;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
        }

        .itemCard {
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          text-align: left;
          overflow: hidden;
        }

        .itemCardActive {
          border-color: rgba(17, 24, 39, 0.24);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .itemCardImageWrap {
          width: 100%;
          aspect-ratio: 1.35 / 1;
          background: #eef1f5;
        }

        .itemCardImage,
        .itemCardImagePlaceholder {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .itemCardImagePlaceholder {
          background: linear-gradient(135deg, #e7ebf0 0%, #d8dee7 100%);
        }

        .itemCardInfo {
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .itemCardInfo strong {
          color: #111827;
          font-size: 16px;
          font-weight: 900;
        }

        .itemCardInfo span {
          color: #111827;
          font-size: 15px;
          font-weight: 800;
          white-space: nowrap;
        }

        .choiceStack {
          display: grid;
          gap: 10px;
        }

        .choiceRow {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .choiceNameInput {
          flex: 1 1 auto;
        }

        .choicePriceInput {
          width: 92px;
          flex: 0 0 auto;
        }

        .emptyState {
          border-radius: 14px;
          border: 1px dashed rgba(15, 23, 42, 0.14);
          padding: 24px 16px;
          text-align: center;
          color: #6b7280;
          font-size: 16px;
          font-weight: 900;
          background: #fafafa;
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
          border-radius: 12px;
          color: #6b7280;
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          min-height: 56px;
        }

        .navItemActive {
          background: #111827;
          color: #ffffff;
        }

        .navIcon {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          background: currentColor;
          display: inline-block;
        }

        .iconBox :global(svg),
        .summaryChevron :global(svg),
        .summaryMetaLabel :global(svg),
        .previewIcon :global(svg),
        .menuMiniArrow :global(svg) {
          width: 100%;
          height: 100%;
          display: block;
        }

        .summaryMetaLabel :global(svg) {
          width: 18px;
          height: 18px;
        }
      `}</style>
    </main>
  );
}