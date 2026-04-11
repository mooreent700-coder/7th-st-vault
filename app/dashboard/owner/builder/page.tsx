'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';
type SectionKey =
  | 'store'
  | 'branding'
  | 'controls'
  | 'hours'
  | 'categories'
  | 'items'
  | 'options'
  | 'preview';

type HoursDayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type HoursRow = {
  isOpen: boolean;
  open: string;
  close: string;
};

type HoursState = Record<HoursDayKey, HoursRow>;

type RestaurantRow = {
  id: string;
  owner_id?: string | null;
  name?: string | null;
  slug?: string | null;
  phone?: string | null;
  address?: string | null;
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
  hours?: string | null;
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

type BuilderChoice = {
  id: string;
  name: string;
  price: string;
};

type BuilderGroupType =
  | 'combo_type'
  | 'protein'
  | 'patty'
  | 'size'
  | 'drink'
  | 'side'
  | 'extras'
  | 'removals'
  | 'custom';

type BuilderGroup = {
  id: string;
  name: string;
  type: BuilderGroupType;
  required: boolean;
  selection: 'single' | 'multiple';
  choices: BuilderChoice[];
};

type BuilderItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: string;
  imageUrl: string;
  availability: Availability;
  groups: BuilderGroup[];
};

type BuilderCategory = {
  id: string;
  name: string;
  sortOrder: number;
  items: BuilderItem[];
};

type CopyBlock = {
  appTitle: string;
  subtitle: string;
  loading: string;
  saving: string;
  save: string;
  saveSection: string;
  saveSuccess: string;
  saveFail: string;
  quickTools: string;
  dashboard: string;
  storefront: string;
  settings: string;
  flyers: string;
  storeSetup: string;
  branding: string;
  storeControls: string;
  operatingHours: string;
  categories: string;
  itemBuilder: string;
  optionGroups: string;
  storefrontReflection: string;
  storeName: string;
  storeUrl: string;
  phone: string;
  address: string;
  uploadHero: string;
  removeHero: string;
  uploadLogo: string;
  removeLogo: string;
  uploadItemImage: string;
  removeItemImage: string;
  storefrontTheme: string;
  storefrontLanguage: string;
  ownerLanguage: string;
  light: string;
  dark: string;
  english: string;
  spanish: string;
  pickupOn: string;
  pickupOff: string;
  deliveryOn: string;
  deliveryOff: string;
  deliveryFee: string;
  deliveryRadius: string;
  deliveryMinimum: string;
  addCategory: string;
  categoryName: string;
  deleteCategory: string;
  addItem: string;
  itemName: string;
  description: string;
  basePrice: string;
  available: string;
  soldOut: string;
  deleteItem: string;
  comboType: string;
  protein: string;
  patty: string;
  size: string;
  drink: string;
  side: string;
  extras: string;
  removals: string;
  custom: string;
  required: string;
  optional: string;
  single: string;
  multiple: string;
  addChoice: string;
  choiceName: string;
  noCategories: string;
  noItems: string;
  noOptions: string;
  noImage: string;
  addToCart: string;
  chooseCategory: string;
  chooseItem: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  openLabel: string;
  closeLabel: string;
  open: string;
  closed: string;
  fullCombo: string;
  familyCombo: string;
  itemOnly: string;
  previewPopup: string;
};

const COPY: Record<LanguageMode, CopyBlock> = {
  en: {
    appTitle: 'MENUFLOW BUILDER',
    subtitle:
      'Owner control center for store setup, branding, hours, combo-first menu building, and storefront reflection.',
    loading: 'Loading builder...',
    saving: 'Saving...',
    save: 'Save',
    saveSection: 'Save Section',
    saveSuccess: 'Builder saved.',
    saveFail: 'Could not save builder.',
    quickTools: 'Quick Tools',
    dashboard: 'Dashboard',
    storefront: 'Storefront',
    settings: 'Settings',
    flyers: 'Flyers',
    storeSetup: 'Store Setup',
    branding: 'Branding',
    storeControls: 'Store Controls',
    operatingHours: 'Operating Hours',
    categories: 'Categories',
    itemBuilder: 'Item Builder',
    optionGroups: 'Option Boxes',
    storefrontReflection: 'Storefront Reflection',
    storeName: 'Store Name',
    storeUrl: 'Store URL',
    phone: 'Phone',
    address: 'Address',
    uploadHero: 'Upload Hero Image',
    removeHero: 'Remove Hero',
    uploadLogo: 'Upload Logo',
    removeLogo: 'Remove Logo',
    uploadItemImage: 'Upload Item Image',
    removeItemImage: 'Remove Item Image',
    storefrontTheme: 'Storefront Theme',
    storefrontLanguage: 'Storefront Language',
    ownerLanguage: 'Owner Language',
    light: 'Light',
    dark: 'Dark',
    english: 'EN',
    spanish: 'ES',
    pickupOn: 'Pickup On',
    pickupOff: 'Pickup Off',
    deliveryOn: 'Delivery On',
    deliveryOff: 'Delivery Off',
    deliveryFee: 'Delivery Fee',
    deliveryRadius: 'Delivery Radius',
    deliveryMinimum: 'Delivery Minimum',
    addCategory: 'Add Category',
    categoryName: 'Category Name',
    deleteCategory: 'Delete Category',
    addItem: 'Add Item',
    itemName: 'Item Name',
    description: 'Description',
    basePrice: 'Base Price',
    available: 'Available',
    soldOut: 'Sold Out',
    deleteItem: 'Delete Item',
    comboType: 'Combo Type',
    protein: 'Protein',
    patty: 'Patty',
    size: 'Size',
    drink: 'Drink',
    side: 'Side',
    extras: 'Extras',
    removals: 'Removals',
    custom: 'Custom',
    required: 'Required',
    optional: 'Optional',
    single: 'Single',
    multiple: 'Multiple',
    addChoice: 'Add Choice',
    choiceName: 'Choice Name',
    noCategories: 'No categories yet.',
    noItems: 'No items yet.',
    noOptions: 'No option boxes yet.',
    noImage: 'No Image',
    addToCart: 'Add to Cart',
    chooseCategory: 'Choose Category',
    chooseItem: 'Choose Item',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    openLabel: 'Open',
    closeLabel: 'Close',
    open: 'Open',
    closed: 'Closed',
    fullCombo: 'Full Combo',
    familyCombo: 'Family Combo',
    itemOnly: 'Item Only',
    previewPopup: 'Popup Preview',
  },
  es: {
    appTitle: 'MENUFLOW BUILDER',
    subtitle:
      'Centro de control del dueño para tienda, branding, horario, menú combo-first y reflejo de tienda.',
    loading: 'Cargando builder...',
    saving: 'Guardando...',
    save: 'Guardar',
    saveSection: 'Guardar Sección',
    saveSuccess: 'Builder guardado.',
    saveFail: 'No se pudo guardar el builder.',
    quickTools: 'Accesos',
    dashboard: 'Dashboard',
    storefront: 'Tienda',
    settings: 'Ajustes',
    flyers: 'Flyers',
    storeSetup: 'Configuración',
    branding: 'Branding',
    storeControls: 'Controles',
    operatingHours: 'Horario',
    categories: 'Categorías',
    itemBuilder: 'Editor de Producto',
    optionGroups: 'Cajas de Opciones',
    storefrontReflection: 'Reflejo de la Tienda',
    storeName: 'Nombre',
    storeUrl: 'URL de Tienda',
    phone: 'Teléfono',
    address: 'Dirección',
    uploadHero: 'Subir Hero',
    removeHero: 'Quitar Hero',
    uploadLogo: 'Subir Logo',
    removeLogo: 'Quitar Logo',
    uploadItemImage: 'Subir Imagen',
    removeItemImage: 'Quitar Imagen',
    storefrontTheme: 'Tema de Tienda',
    storefrontLanguage: 'Idioma de Tienda',
    ownerLanguage: 'Idioma del Dueño',
    light: 'Claro',
    dark: 'Oscuro',
    english: 'EN',
    spanish: 'ES',
    pickupOn: 'Recoger Sí',
    pickupOff: 'Recoger No',
    deliveryOn: 'Entrega Sí',
    deliveryOff: 'Entrega No',
    deliveryFee: 'Costo de Entrega',
    deliveryRadius: 'Radio de Entrega',
    deliveryMinimum: 'Mínimo de Entrega',
    addCategory: 'Agregar Categoría',
    categoryName: 'Nombre de Categoría',
    deleteCategory: 'Eliminar Categoría',
    addItem: 'Agregar Producto',
    itemName: 'Nombre del Producto',
    description: 'Descripción',
    basePrice: 'Precio Base',
    available: 'Disponible',
    soldOut: 'Agotado',
    deleteItem: 'Eliminar Producto',
    comboType: 'Tipo de Combo',
    protein: 'Proteína',
    patty: 'Carne',
    size: 'Tamaño',
    drink: 'Bebida',
    side: 'Acompañamiento',
    extras: 'Extras',
    removals: 'Quitar',
    custom: 'Personalizado',
    required: 'Requerido',
    optional: 'Opcional',
    single: 'Una',
    multiple: 'Múltiples',
    addChoice: 'Agregar Opción',
    choiceName: 'Nombre de Opción',
    noCategories: 'Todavía no hay categorías.',
    noItems: 'Todavía no hay productos.',
    noOptions: 'Todavía no hay cajas de opciones.',
    noImage: 'Sin Imagen',
    addToCart: 'Agregar al Carrito',
    chooseCategory: 'Elegir Categoría',
    chooseItem: 'Elegir Producto',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
    openLabel: 'Abrir',
    closeLabel: 'Cerrar',
    open: 'Abierto',
    closed: 'Cerrado',
    fullCombo: 'Combo Completo',
    familyCombo: 'Combo Familiar',
    itemOnly: 'Solo Producto',
    previewPopup: 'Vista del Popup',
  },
};

const DAY_KEYS: HoursDayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DEFAULT_HOURS: HoursState = {
  monday: { isOpen: false, open: '09:00', close: '17:00' },
  tuesday: { isOpen: false, open: '09:00', close: '17:00' },
  wednesday: { isOpen: false, open: '09:00', close: '17:00' },
  thursday: { isOpen: false, open: '09:00', close: '17:00' },
  friday: { isOpen: false, open: '09:00', close: '17:00' },
  saturday: { isOpen: false, open: '09:00', close: '17:00' },
  sunday: { isOpen: false, open: '09:00', close: '17:00' },
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});

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
  taco: 'mexican',
  tacos: 'mexican',
};

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function makeUuid() {
  return crypto.randomUUID();
}

function makeTempId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-');
}

function sanitizeNumber(value: string) {
  return value.replace(/[^0-9.]/g, '');
}

function serializeHours(hours: HoursState) {
  return JSON.stringify(hours);
}

function parseHours(value: string | null | undefined): HoursState {
  if (!value) return DEFAULT_HOURS;

  try {
    const parsed = JSON.parse(value) as Partial<HoursState>;
    return {
      monday: parsed.monday ?? DEFAULT_HOURS.monday,
      tuesday: parsed.tuesday ?? DEFAULT_HOURS.tuesday,
      wednesday: parsed.wednesday ?? DEFAULT_HOURS.wednesday,
      thursday: parsed.thursday ?? DEFAULT_HOURS.thursday,
      friday: parsed.friday ?? DEFAULT_HOURS.friday,
      saturday: parsed.saturday ?? DEFAULT_HOURS.saturday,
      sunday: parsed.sunday ?? DEFAULT_HOURS.sunday,
    };
  } catch {
    return DEFAULT_HOURS;
  }
}

function normalizeCategoryFolder(name: string) {
  const key = name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, ' ');
  return CATEGORY_FOLDER_MAP[key] || CATEGORY_FOLDER_MAP[key.replace(/s$/, '')] || null;
}

function pickDeterministic(items: string[], seed: string) {
  if (!items.length) return '';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return items[hash % items.length];
}

function formatMoney(value: string) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return '$0';
  return `$${numeric.toFixed(2).replace(/\\.00$/, '')}`;
}

function defaultGroup(type: BuilderGroupType, copy: CopyBlock): BuilderGroup {
  const id = makeTempId('group');

  if (type === 'combo_type') {
    return {
      id,
      name: copy.comboType,
      type,
      required: true,
      selection: 'single',
      choices: [
        { id: makeTempId('choice'), name: copy.itemOnly, price: '0' },
        { id: makeTempId('choice'), name: copy.fullCombo, price: '3' },
        { id: makeTempId('choice'), name: copy.familyCombo, price: '8' },
      ],
    };
  }

  if (type === 'protein') {
    return {
      id,
      name: copy.protein,
      type,
      required: false,
      selection: 'single',
      choices: [
        { id: makeTempId('choice'), name: 'Chicken', price: '0' },
        { id: makeTempId('choice'), name: 'Beef', price: '0' },
        { id: makeTempId('choice'), name: 'Shrimp', price: '2' },
      ],
    };
  }

  if (type === 'patty') {
    return {
      id,
      name: copy.patty,
      type,
      required: false,
      selection: 'single',
      choices: [
        { id: makeTempId('choice'), name: 'Single Patty', price: '0' },
        { id: makeTempId('choice'), name: 'Double Patty', price: '2' },
      ],
    };
  }

  if (type === 'size') {
    return {
      id,
      name: copy.size,
      type,
      required: false,
      selection: 'single',
      choices: [
        { id: makeTempId('choice'), name: 'Small', price: '0' },
        { id: makeTempId('choice'), name: 'Medium', price: '2' },
        { id: makeTempId('choice'), name: 'Large', price: '4' },
      ],
    };
  }

  if (type === 'drink') {
    return {
      id,
      name: copy.drink,
      type,
      required: false,
      selection: 'single',
      choices: [
        { id: makeTempId('choice'), name: 'Coke', price: '0' },
        { id: makeTempId('choice'), name: 'Sprite', price: '0' },
        { id: makeTempId('choice'), name: 'Water', price: '0' },
      ],
    };
  }

  if (type === 'side') {
    return {
      id,
      name: copy.side,
      type,
      required: false,
      selection: 'single',
      choices: [
        { id: makeTempId('choice'), name: 'Fries', price: '0' },
        { id: makeTempId('choice'), name: 'Onion Rings', price: '1' },
      ],
    };
  }

  if (type === 'extras') {
    return {
      id,
      name: copy.extras,
      type,
      required: false,
      selection: 'multiple',
      choices: [
        { id: makeTempId('choice'), name: 'Extra Cheese', price: '1' },
        { id: makeTempId('choice'), name: 'Extra Sauce', price: '1' },
      ],
    };
  }

  if (type === 'removals') {
    return {
      id,
      name: copy.removals,
      type,
      required: false,
      selection: 'multiple',
      choices: [
        { id: makeTempId('choice'), name: 'No Onion', price: '0' },
        { id: makeTempId('choice'), name: 'No Tomato', price: '0' },
      ],
    };
  }

  return {
    id,
    name: copy.custom,
    type,
    required: false,
    selection: 'single',
    choices: [{ id: makeTempId('choice'), name: 'Option 1', price: '0' }],
  };
}

export default function BuilderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [builderLanguage, setBuilderLanguage] = useState<LanguageMode>('en');

  const copy = COPY[builderLanguage];

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState<HoursState>(DEFAULT_HOURS);

  const [heroImage, setHeroImage] = useState('');
  const [logoImage, setLogoImage] = useState('');

  const [theme, setTheme] = useState<ThemeMode>('light');
  const [storefrontLanguage, setStorefrontLanguage] = useState<LanguageMode>('en');
  const [ownerLanguage, setOwnerLanguage] = useState<LanguageMode>('en');

  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryRadius, setDeliveryRadius] = useState('5');
  const [deliveryMinimum, setDeliveryMinimum] = useState('0');

  const [categories, setCategories] = useState<BuilderCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [previewCategoryId, setPreviewCategoryId] = useState('');
  const [previewItemId, setPreviewItemId] = useState('');
  const [openSection, setOpenSection] = useState<SectionKey>('store');

  const [heroUploading, setHeroUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [itemUploadingId, setItemUploadingId] = useState<string | null>(null);

  const [placeholderMap, setPlaceholderMap] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const computedSlug = useMemo(() => slugify(name), [name]);
  const allItems = useMemo(() => categories.flatMap((category) => category.items), [categories]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const selectedItem = useMemo(
    () => allItems.find((item) => item.id === selectedItemId) || allItems[0] || null,
    [allItems, selectedItemId]
  );

  const previewCategory = useMemo(
    () => categories.find((category) => category.id === previewCategoryId) || categories[0] || null,
    [categories, previewCategoryId]
  );

  const previewItem = useMemo(() => {
    const items = previewCategory?.items || [];
    return items.find((item) => item.id === previewItemId) || items[0] || null;
  }, [previewCategory, previewItemId]);

  const dayLabels = useMemo(
    () => ({
      monday: copy.monday,
      tuesday: copy.tuesday,
      wednesday: copy.wednesday,
      thursday: copy.thursday,
      friday: copy.friday,
      saturday: copy.saturday,
      sunday: copy.sunday,
    }),
    [copy]
  );

  useEffect(() => {
    let mounted = true;

    async function loadBuilder() {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          router.replace('/login');
          return;
        }

        if (!mounted) return;
        setOwnerId(user.id);

        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select(
            'id, owner_id, name, slug, phone, address, hero_image, logo_image, storefront_theme, storefront_language, order_language, pickup_enabled, delivery_enabled, delivery_fee, delivery_radius, delivery_minimum, hours'
          )
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        let currentRestaurantId: string | null = null;

        if (restaurantData) {
          const restaurant = restaurantData as RestaurantRow;
          currentRestaurantId = restaurant.id;

          setRestaurantId(restaurant.id);
          setName(restaurant.name || '');
          setSlug(restaurant.slug || '');
          setPhone(restaurant.phone || '');
          setAddress(restaurant.address || '');
          setHeroImage(restaurant.hero_image || '');
          setLogoImage(restaurant.logo_image || '');
          setTheme((restaurant.storefront_theme as ThemeMode) || 'light');
          setStorefrontLanguage((restaurant.storefront_language || 'en').toLowerCase() === 'es' ? 'es' : 'en');
          setOwnerLanguage((restaurant.order_language || 'en').toLowerCase() === 'es' ? 'es' : 'en');
          setPickupEnabled(restaurant.pickup_enabled ?? true);
          setDeliveryEnabled(restaurant.delivery_enabled ?? false);
          setDeliveryFee(String(restaurant.delivery_fee ?? 0));
          setDeliveryRadius(String(restaurant.delivery_radius ?? 5));
          setDeliveryMinimum(String(restaurant.delivery_minimum ?? 0));
          setHours(parseHours(restaurant.hours));
        }

        if (currentRestaurantId) {
          const { data: categoryRows, error: categoryError } = await supabase
            .from('menu_categories')
            .select('id, restaurant_id, name, sort_order')
            .eq('restaurant_id', currentRestaurantId)
            .order('sort_order', { ascending: true });

          if (categoryError) throw categoryError;

          const { data: itemRows, error: itemError } = await supabase
            .from('menu_items')
            .select('id, restaurant_id, category_id, name, description, price, base_price, image_url, availability, is_available, sort_order')
            .eq('restaurant_id', currentRestaurantId)
            .order('sort_order', { ascending: true });

          if (itemError) throw itemError;

          const loadedItems = safeArray(itemRows) as ItemRow[];
          const itemIds = loadedItems.map((item) => item.id);

          let groupRows: OptionGroupRow[] = [];
          let choiceRows: OptionChoiceRow[] = [];

          if (itemIds.length) {
            const { data: rawGroups, error: groupError } = await supabase
              .from('menu_option_groups')
              .select('id, item_id, name, is_required, is_multiple, selection_mode, sort_order')
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

          const builtCategories: BuilderCategory[] = safeArray(categoryRows).map((category, categoryIndex) => ({
            id: category.id,
            name: category.name || `Category ${categoryIndex + 1}`,
            sortOrder: category.sort_order ?? categoryIndex,
            items: loadedItems
              .filter((item) => item.category_id === category.id)
              .map((item) => ({
                id: item.id,
                categoryId: category.id,
                name: item.name || '',
                description: item.description || '',
                basePrice: String(item.base_price ?? item.price ?? 0),
                imageUrl: item.image_url || '',
                availability:
                  item.availability === 'sold_out' || item.is_available === false ? 'sold_out' : 'available',
                groups: groupRows
                  .filter((group) => group.item_id === item.id)
                  .map((group) => ({
                    id: group.id,
                    name: group.name || copy.custom,
                    required: !!group.is_required,
                    selection: group.selection_mode === 'multiple' || group.is_multiple ? 'multiple' : 'single',
                    type: 'custom',
                    choices: choiceRows
                      .filter((choice) => choice.option_group_id === group.id)
                      .map((choice) => ({
                        id: choice.id,
                        name: choice.name || '',
                        price: String(choice.price_delta ?? choice.price ?? 0),
                      })),
                  })),
              })),
          }));

          if (mounted) {
            setCategories(builtCategories);

            const firstCategory = builtCategories[0] || null;
            const firstItem = firstCategory?.items[0] || null;

            setSelectedCategoryId(firstCategory?.id || '');
            setSelectedItemId(firstItem?.id || '');
            setPreviewCategoryId(firstCategory?.id || '');
            setPreviewItemId(firstItem?.id || '');
          }
        } else {
          const categoryId = makeTempId('cat');
          const itemId = makeTempId('item');

          const starter: BuilderCategory[] = [
            {
              id: categoryId,
              name: 'Featured',
              sortOrder: 0,
              items: [
                {
                  id: itemId,
                  categoryId,
                  name: 'New Item',
                  description: '',
                  basePrice: '0',
                  imageUrl: '',
                  availability: 'available',
                  groups: [],
                },
              ],
            },
          ];

          if (mounted) {
            setCategories(starter);
            setSelectedCategoryId(categoryId);
            setSelectedItemId(itemId);
            setPreviewCategoryId(categoryId);
            setPreviewItemId(itemId);
          }
        }
      } catch (err: any) {
        setError(err?.message || copy.saveFail);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadBuilder();

    return () => {
      mounted = false;
    };
  }, [router, copy.custom, copy.saveFail]);

  useEffect(() => {
    let mounted = true;

    async function loadPlaceholderBuckets() {
      const folders = Array.from(new Set(Object.values(CATEGORY_FOLDER_MAP)));
      const nextMap: Record<string, string[]> = {};

      for (const folder of folders) {
        const { data, error: listError } = await supabase.storage
          .from('menu-images')
          .list(folder, { limit: 100, sortBy: { column: 'name', order: 'asc' } });

        if (listError) {
          nextMap[folder] = [];
          continue;
        }

        nextMap[folder] = safeArray(data)
          .filter((file) => file.name && !file.name.startsWith('.'))
          .map((file) => {
            const { data: urlData } = supabase.storage
              .from('menu-images')
              .getPublicUrl(`${folder}/${file.name}`);
            return urlData.publicUrl;
          });
      }

      if (mounted) setPlaceholderMap(nextMap);
    }

    void loadPlaceholderBuckets();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!slug && computedSlug) {
      setSlug(computedSlug);
    }
  }, [computedSlug, slug]);

  function getPlaceholderForCategory(categoryName: string, seed: string) {
    const folder = normalizeCategoryFolder(categoryName);
    if (!folder) return '';
    return pickDeterministic(placeholderMap[folder] || [], seed);
  }

  function getResolvedImage(item: BuilderItem | null, categoryName: string) {
    if (!item) return '';
    if (item.imageUrl) return item.imageUrl;
    return getPlaceholderForCategory(categoryName, `${categoryName}_${item.id}`);
  }

  async function uploadImage(file: File, bucket: 'heroes' | 'logos' | 'menu-items', folder: string) {
    const ext = file.name.split('.').pop() || 'jpg';
    const owner = ownerId || 'owner';
    const filePath = `${owner}/${folder}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleHeroUpload(file: File | null) {
    if (!file) return;

    try {
      setHeroUploading(true);
      setError('');
      const url = await uploadImage(file, 'heroes', 'hero');
      setHeroImage(url);
    } catch (err: any) {
      setError(err?.message || copy.saveFail);
    } finally {
      setHeroUploading(false);
    }
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) return;

    try {
      setLogoUploading(true);
      setError('');
      const url = await uploadImage(file, 'logos', 'logo');
      setLogoImage(url);
    } catch (err: any) {
      setError(err?.message || copy.saveFail);
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleItemUpload(itemId: string, file: File | null) {
    if (!file) return;

    try {
      setItemUploadingId(itemId);
      setError('');
      const url = await uploadImage(file, 'menu-items', 'item');

      setCategories((current) =>
        current.map((category) => ({
          ...category,
          items: category.items.map((item) => (item.id === itemId ? { ...item, imageUrl: url } : item)),
        }))
      );
    } catch (err: any) {
      setError(err?.message || copy.saveFail);
    } finally {
      setItemUploadingId(null);
    }
  }

  function updateHours(day: HoursDayKey, patch: Partial<HoursRow>) {
    setHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        ...patch,
      },
    }));
  }

  function addCategory() {
    const categoryId = makeTempId('cat');
    const itemId = makeTempId('item');

    const nextCategory: BuilderCategory = {
      id: categoryId,
      name: 'New Category',
      sortOrder: categories.length,
      items: [
        {
          id: itemId,
          categoryId,
          name: 'New Item',
          description: '',
          basePrice: '0',
          imageUrl: '',
          availability: 'available',
          groups: [],
        },
      ],
    };

    setCategories((current) => [...current, nextCategory]);
    setSelectedCategoryId(categoryId);
    setSelectedItemId(itemId);
    setPreviewCategoryId(categoryId);
    setPreviewItemId(itemId);
    setOpenSection('categories');
  }

  function updateCategory(categoryId: string, nameValue: string) {
    setCategories((current) =>
      current.map((category) => (category.id === categoryId ? { ...category, name: nameValue } : category))
    );
  }

  function deleteCategory(categoryId: string) {
    const next = categories.filter((category) => category.id !== categoryId);

    setCategories(next);

    const firstCategory = next[0] || null;
    const firstItem = firstCategory?.items[0] || null;

    setSelectedCategoryId(firstCategory?.id || '');
    setSelectedItemId(firstItem?.id || '');
    setPreviewCategoryId(firstCategory?.id || '');
    setPreviewItemId(firstItem?.id || '');
  }

  function addItem(categoryId: string) {
    const itemId = makeTempId('item');

    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  id: itemId,
                  categoryId,
                  name: 'New Item',
                  description: '',
                  basePrice: '0',
                  imageUrl: '',
                  availability: 'available',
                  groups: [],
                },
              ],
            }
          : category
      )
    );

    setSelectedCategoryId(categoryId);
    setSelectedItemId(itemId);
    setPreviewCategoryId(categoryId);
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
    const next = categories.map((category) =>
      category.id === categoryId
        ? { ...category, items: category.items.filter((item) => item.id !== itemId) }
        : category
    );

    setCategories(next);

    const category = next.find((entry) => entry.id === categoryId && entry.items.length) || next[0] || null;
    const item = category?.items[0] || null;

    setSelectedCategoryId(category?.id || '');
    setSelectedItemId(item?.id || '');
    setPreviewCategoryId(category?.id || '');
    setPreviewItemId(item?.id || '');
  }

  function addGroup(itemId: string, type: BuilderGroupType) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId ? { ...item, groups: [...item.groups, defaultGroup(type, copy)] } : item
        ),
      }))
    );
  }

  function updateGroup(itemId: string, groupId: string, patch: Partial<BuilderGroup>) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                groups: item.groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
              }
            : item
        ),
      }))
    );
  }

  function deleteGroup(itemId: string, groupId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId ? { ...item, groups: item.groups.filter((group) => group.id !== groupId) } : item
        ),
      }))
    );
  }

  function addChoice(itemId: string, groupId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                groups: item.groups.map((group) =>
                  group.id === groupId
                    ? {
                        ...group,
                        choices: [...group.choices, { id: makeTempId('choice'), name: 'New Choice', price: '0' }],
                      }
                    : group
                ),
              }
            : item
        ),
      }))
    );
  }

  function updateChoice(itemId: string, groupId: string, choiceId: string, patch: Partial<BuilderChoice>) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                groups: item.groups.map((group) =>
                  group.id === groupId
                    ? {
                        ...group,
                        choices: group.choices.map((choice) =>
                          choice.id === choiceId ? { ...choice, ...patch } : choice
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

  function deleteChoice(itemId: string, groupId: string, choiceId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                groups: item.groups.map((group) =>
                  group.id === groupId
                    ? { ...group, choices: group.choices.filter((choice) => choice.id !== choiceId) }
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
      if (!ownerId) {
        setError(copy.saveFail);
        return;
      }

      setSaving(true);
      setError('');
      setSuccess('');

      const finalSlug = slugify(slug || name);

      const restaurantPayload = {
        owner_id: ownerId,
        name: name.trim() || null,
        slug: finalSlug || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        hero_image: heroImage.trim() || null,
        logo_image: logoImage.trim() || null,
        storefront_theme: theme,
        storefront_language: storefrontLanguage,
        order_language: ownerLanguage,
        pickup_enabled: pickupEnabled,
        delivery_enabled: deliveryEnabled,
        delivery_fee: Number(deliveryFee || 0),
        delivery_radius: Number(deliveryRadius || 0),
        delivery_minimum: Number(deliveryMinimum || 0),
        hours: serializeHours(hours),
      };

      let currentRestaurantId = restaurantId;

      if (restaurantId && isUuid(restaurantId)) {
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

      if (!currentRestaurantId) throw new Error(copy.saveFail);

      const categoryIdMap = new Map<string, string>();
      const itemIdMap = new Map<string, string>();
      const groupIdMap = new Map<string, string>();

      categories.forEach((category) => {
        categoryIdMap.set(category.id, isUuid(category.id) ? category.id : makeUuid());
      });

      categories.forEach((category) => {
        category.items.forEach((item) => {
          itemIdMap.set(item.id, isUuid(item.id) ? item.id : makeUuid());
          item.groups.forEach((group) => {
            groupIdMap.set(group.id, isUuid(group.id) ? group.id : makeUuid());
          });
        });
      });

      const { data: existingCategories, error: existingCategoryError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', currentRestaurantId);

      if (existingCategoryError) throw existingCategoryError;

      const existingCategoryIds = safeArray(existingCategories).map((row: { id: string }) => row.id);

      let existingItemIds: string[] = [];

      if (existingCategoryIds.length) {
        const { data: existingItems, error: existingItemError } = await supabase
          .from('menu_items')
          .select('id')
          .in('category_id', existingCategoryIds);

        if (existingItemError) throw existingItemError;
        existingItemIds = safeArray(existingItems).map((row: { id: string }) => row.id);
      }

      if (existingItemIds.length) {
        const { data: existingGroups, error: existingGroupError } = await supabase
          .from('menu_option_groups')
          .select('id')
          .in('item_id', existingItemIds);

        if (existingGroupError) throw existingGroupError;

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

      const categoryRows = categories.map((category, index) => ({
        id: categoryIdMap.get(category.id)!,
        restaurant_id: currentRestaurantId,
        name: category.name.trim() || `Category ${index + 1}`,
        sort_order: index,
      }));

      if (categoryRows.length) {
        const { error: insertCategoryError } = await supabase.from('menu_categories').insert(categoryRows);
        if (insertCategoryError) throw insertCategoryError;
      }

      const itemRows = categories.flatMap((category, categoryIndex) =>
        category.items.map((item, itemIndex) => ({
          id: itemIdMap.get(item.id)!,
          restaurant_id: currentRestaurantId,
          category_id: categoryIdMap.get(category.id)!,
          name: item.name.trim() || 'New Item',
          description: item.description.trim() || null,
          price: Number(item.basePrice || 0),
          base_price: Number(item.basePrice || 0),
          image_url:
            item.imageUrl || getPlaceholderForCategory(category.name, `${category.name}_${item.id}`) || null,
          availability: item.availability,
          is_available: item.availability === 'available',
          sort_order: categoryIndex * 100 + itemIndex,
        }))
      );

      if (itemRows.length) {
        const { error: insertItemError } = await supabase.from('menu_items').insert(itemRows);
        if (insertItemError) throw insertItemError;
      }

      const groupRows = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.groups.map((group, groupIndex) => ({
            id: groupIdMap.get(group.id)!,
            item_id: itemIdMap.get(item.id)!,
            name: group.name.trim() || copy.custom,
            is_required: group.required,
            is_multiple: group.selection === 'multiple',
            selection_mode: group.selection,
            sort_order: groupIndex,
          }))
        )
      );

      if (groupRows.length) {
        const { error: insertGroupError } = await supabase.from('menu_option_groups').insert(groupRows);
        if (insertGroupError) throw insertGroupError;
      }

      const choiceRows = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.groups.flatMap((group) =>
            group.choices.map((choice, choiceIndex) => ({
              id: isUuid(choice.id) ? choice.id : makeUuid(),
              option_group_id: groupIdMap.get(group.id)!,
              name: choice.name.trim() || 'New Choice',
              price: Number(choice.price || 0),
              price_delta: Number(choice.price || 0),
              sort_order: choiceIndex,
            }))
          )
        )
      );

      if (choiceRows.length) {
        const { error: insertChoiceError } = await supabase.from('menu_option_choices').insert(choiceRows);
        if (insertChoiceError) throw insertChoiceError;
      }

      setSlug(finalSlug);
      setSuccess(copy.saveSuccess);
    } catch (err: any) {
      setError(err?.message || copy.saveFail);
      setSuccess('');
    } finally {
      setSaving(false);
    }
  }
  
    if (loading) {
    return (
      <main className="builder-page">
        <div className="builder-shell">
          <div className="loading-card">{copy.loading}</div>
          <style jsx>{styles}</style>
        </div>
      </main>
    );
  }

  return (
    <main className="builder-page">
      <div className="builder-shell">
        <header className="builder-header">
          <h1>{copy.appTitle}</h1>

          <div className="header-actions">
            <button
              type="button"
              className="lang-button"
              onClick={() => setBuilderLanguage(builderLanguage === 'en' ? 'es' : 'en')}
            >
              {builderLanguage.toUpperCase()}
            </button>

            <button type="button" className="save-button" onClick={handleSave} disabled={saving}>
              {saving ? copy.saving : copy.save}
            </button>
          </div>
        </header>

        <section className="quick-tools-card">
          <div className="quick-tools-title">{copy.quickTools}</div>

          <div className="quick-tools-grid">
            <Link href="/dashboard/owner" className="tool-button">
              {copy.dashboard}
            </Link>

            <Link
              href={(slug || computedSlug) ? `/store/${slug || computedSlug}` : '#'}
              className={`tool-button ${!(slug || computedSlug) ? 'disabled' : ''}`}
            >
              {copy.storefront}
            </Link>

            <Link href="/dashboard/owner/settings" className="tool-button">
              {copy.settings}
            </Link>

            <Link href="/dashboard/owner/flyers" className="tool-button">
              {copy.flyers}
            </Link>
          </div>
        </section>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <section className="hero-preview">
          <div className="hero-image-wrap">
            {heroImage ? <img src={heroImage} alt="hero" className="hero-image" /> : <div className="hero-fallback" />}

            <div className="hero-overlay">
              <div className="hero-brand">
                {logoImage ? (
                  <img src={logoImage} alt="logo" className="hero-logo" />
                ) : (
                  <div className="hero-logo-fallback">{(name || 'M').charAt(0).toUpperCase()}</div>
                )}

                <div>
                  <div className="hero-name">{name || 'Your Store'}</div>
                  <div className="hero-meta">
                    <span>{address || '123 Main St'}</span>
                    <span>{phone || '323 555 1212'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="intro-card">
          <h2>Build Your Store</h2>
          <p>{copy.subtitle}</p>
        </section>

        <section className="accordion-card">
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('store')}>
            <span>01</span>
            <strong>{copy.storeSetup}</strong>
            <em>›</em>
          </button>

          {openSection === 'store' ? (
            <div className="accordion-body">
              <label>
                <span>{copy.storeName}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <label>
                <span>{copy.storeUrl}</span>
                <input value={`/${slug || computedSlug ? `store/${slug || computedSlug}` : 'store/your-store'}`} readOnly />
              </label>

              <label>
                <span>{copy.phone}</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>

              <label>
                <span>{copy.address}</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>

              <button type="button" className="black-button" onClick={handleSave} disabled={saving}>
                {saving ? copy.saving : copy.saveSection}
              </button>
            </div>
          ) : null}
        </section>

        <section className="accordion-card">
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('branding')}>
            <span>02</span>
            <strong>{copy.branding}</strong>
            <em>›</em>
          </button>

          {openSection === 'branding' ? (
            <div className="accordion-body">
              <div className="upload-block">
                <div className="upload-title">{copy.uploadHero}</div>

                <label className="black-button">
                  {heroUploading ? copy.saving : copy.uploadHero}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => void handleHeroUpload(e.target.files?.[0] || null)}
                  />
                </label>

                <button type="button" className="white-button" onClick={() => setHeroImage('')}>
                  {copy.removeHero}
                </button>

                {heroImage ? (
                  <img src={heroImage} alt="hero" className="upload-preview" />
                ) : (
                  <div className="upload-empty">{copy.noImage}</div>
                )}
              </div>

              <div className="upload-block">
                <div className="upload-title">{copy.uploadLogo}</div>

                <label className="black-button">
                  {logoUploading ? copy.saving : copy.uploadLogo}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => void handleLogoUpload(e.target.files?.[0] || null)}
                  />
                </label>

                <button type="button" className="white-button" onClick={() => setLogoImage('')}>
                  {copy.removeLogo}
                </button>

                {logoImage ? (
                  <img src={logoImage} alt="logo" className="upload-preview logo-preview" />
                ) : (
                  <div className="upload-empty">{copy.noImage}</div>
                )}
              </div>

              <button type="button" className="black-button" onClick={handleSave} disabled={saving}>
                {saving ? copy.saving : copy.saveSection}
              </button>
            </div>
          ) : null}
        </section>

        <section className="accordion-card">
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('controls')}>
            <span>03</span>
            <strong>{copy.storeControls}</strong>
            <em>›</em>
          </button>

          {openSection === 'controls' ? (
            <div className="accordion-body">
              <div className="field-label">{copy.storefrontTheme}</div>
              <div className="chip-row">
                <button type="button" className={`chip ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                  {copy.light}
                </button>
                <button type="button" className={`chip ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                  {copy.dark}
                </button>
              </div>

              <div className="field-label">{copy.storefrontLanguage}</div>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${storefrontLanguage === 'en' ? 'active' : ''}`}
                  onClick={() => setStorefrontLanguage('en')}
                >
                  {copy.english}
                </button>
                <button
                  type="button"
                  className={`chip ${storefrontLanguage === 'es' ? 'active' : ''}`}
                  onClick={() => setStorefrontLanguage('es')}
                >
                  {copy.spanish}
                </button>
              </div>

              <div className="field-label">{copy.ownerLanguage}</div>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${ownerLanguage === 'en' ? 'active' : ''}`}
                  onClick={() => setOwnerLanguage('en')}
                >
                  {copy.english}
                </button>
                <button
                  type="button"
                  className={`chip ${ownerLanguage === 'es' ? 'active' : ''}`}
                  onClick={() => setOwnerLanguage('es')}
                >
                  {copy.spanish}
                </button>
              </div>

              <div className="field-label">Pickup</div>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${pickupEnabled ? 'active' : ''}`}
                  onClick={() => setPickupEnabled(true)}
                >
                  {copy.pickupOn}
                </button>
                <button
                  type="button"
                  className={`chip ${!pickupEnabled ? 'active' : ''}`}
                  onClick={() => setPickupEnabled(false)}
                >
                  {copy.pickupOff}
                </button>
              </div>

              <div className="field-label">Delivery</div>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${deliveryEnabled ? 'active' : ''}`}
                  onClick={() => setDeliveryEnabled(true)}
                >
                  {copy.deliveryOn}
                </button>
                <button
                  type="button"
                  className={`chip ${!deliveryEnabled ? 'active' : ''}`}
                  onClick={() => setDeliveryEnabled(false)}
                >
                  {copy.deliveryOff}
                </button>
              </div>

              <label>
                <span>{copy.deliveryFee}</span>
                <input value={deliveryFee} onChange={(e) => setDeliveryFee(sanitizeNumber(e.target.value))} />
              </label>

              <label>
                <span>{copy.deliveryRadius}</span>
                <input value={deliveryRadius} onChange={(e) => setDeliveryRadius(sanitizeNumber(e.target.value))} />
              </label>

              <label>
                <span>{copy.deliveryMinimum}</span>
                <input value={deliveryMinimum} onChange={(e) => setDeliveryMinimum(sanitizeNumber(e.target.value))} />
              </label>

              <button type="button" className="black-button" onClick={handleSave} disabled={saving}>
                {saving ? copy.saving : copy.saveSection}
              </button>
            </div>
          ) : null}
        </section>

        <section className="accordion-card">
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('hours')}>
            <span>04</span>
            <strong>{copy.operatingHours}</strong>
            <em>›</em>
          </button>

          {openSection === 'hours' ? (
            <div className="accordion-body">
              {DAY_KEYS.map((day) => (
                <div key={day} className="hours-row">
                  <div className="hours-day">{dayLabels[day]}</div>

                  <button
                    type="button"
                    className={`chip ${hours[day].isOpen ? 'active' : ''}`}
                    onClick={() => updateHours(day, { isOpen: !hours[day].isOpen })}
                  >
                    {hours[day].isOpen ? copy.open : copy.closed}
                  </button>

                  <select
                    value={hours[day].open}
                    disabled={!hours[day].isOpen}
                    onChange={(e) => updateHours(day, { open: e.target.value })}
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>

                  <select
                    value={hours[day].close}
                    disabled={!hours[day].isOpen}
                    onChange={(e) => updateHours(day, { close: e.target.value })}
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <button type="button" className="black-button" onClick={handleSave} disabled={saving}>
                {saving ? copy.saving : copy.saveSection}
              </button>
            </div>
          ) : null}
        </section>

        <section className="accordion-card">
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('categories')}>
            <span>05</span>
            <strong>{copy.categories}</strong>
            <em>›</em>
          </button>

          {openSection === 'categories' ? (
            <div className="accordion-body">
              <button type="button" className="black-button" onClick={addCategory}>
                {copy.addCategory}
              </button>

              {!categories.length ? <div className="empty-block">{copy.noCategories}</div> : null}

              {categories.map((category) => (
                <div key={category.id} className="nested-card">
                  <label>
                    <span>{copy.categoryName}</span>
                    <input value={category.name} onChange={(e) => updateCategory(category.id, e.target.value)} />
                  </label>

                  <div className="nested-actions">
                    <button type="button" className="black-button" onClick={() => addItem(category.id)}>
                      {copy.addItem}
                    </button>

                    <button type="button" className="danger-button" onClick={() => deleteCategory(category.id)}>
                      {copy.deleteCategory}
                    </button>
                  </div>

                  <div className="item-list">
                    {category.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`item-pill ${selectedItemId === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setSelectedItemId(item.id);
                          setPreviewCategoryId(category.id);
                          setPreviewItemId(item.id);
                          setOpenSection('items');
                        }}
                      >
                        <span>{item.name || 'New Item'}</span>
                        <strong>{formatMoney(item.basePrice)}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button type="button" className="black-button" onClick={handleSave} disabled={saving}>
                {saving ? copy.saving : copy.saveSection}
              </button>
            </div>
          ) : null}
        </section>

        <section className="accordion-card">
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('items')}>
            <span>06</span>
            <strong>{copy.itemBuilder}</strong>
            <em>›</em>
          </button>

          {openSection === 'items' ? (
            <div className="accordion-body">
              {!selectedItem ? (
                <div className="empty-block">{copy.noItems}</div>
              ) : (
                <>
                  <div className="preview-card">
                    {getResolvedImage(selectedItem, selectedCategory?.name || '') ? (
                      <img
                        src={getResolvedImage(selectedItem, selectedCategory?.name || '')}
                        alt="item"
                        className="item-preview-image"
                      />
                    ) : (
                      <div className="upload-empty">{copy.noImage}</div>
                    )}

                    <div className="item-preview-bar">
                      <span>{selectedItem.name || 'New Item'}</span>
                      <strong>{formatMoney(selectedItem.basePrice)}</strong>
                    </div>
                  </div>

                  <div className="upload-block">
                    <div className="upload-title">{copy.uploadItemImage}</div>

                    <label className="black-button">
                      {itemUploadingId === selectedItem.id ? copy.saving : copy.uploadItemImage}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => void handleItemUpload(selectedItem.id, e.target.files?.[0] || null)}
                      />
                    </label>

                    <button
                      type="button"
                      className="white-button"
                      onClick={() => updateItem(selectedItem.id, { imageUrl: '' })}
                    >
                      {copy.removeItemImage}
                    </button>
                  </div>

                  <label>
                    <span>{copy.itemName}</span>
                    <input
                      value={selectedItem.name}
                      onChange={(e) => updateItem(selectedItem.id, { name: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>{copy.description}</span>
                    <textarea
                      value={selectedItem.description}
                      onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>{copy.basePrice}</span>
                    <input
                      value={selectedItem.basePrice}
                      onChange={(e) => updateItem(selectedItem.id, { basePrice: sanitizeNumber(e.target.value) })}
                    />
                  </label>

                  <div className="chip-row">
                    <button
                      type="button"
                      className={`chip ${selectedItem.availability === 'available' ? 'active' : ''}`}
                      onClick={() => updateItem(selectedItem.id, { availability: 'available' })}
                    >
                      {copy.available}
                    </button>

                    <button
                      type="button"
                      className={`chip ${selectedItem.availability === 'sold_out' ? 'active' : ''}`}
                      onClick={() => updateItem(selectedItem.id, { availability: 'sold_out' })}
                    >
                      {copy.soldOut}
                    </button>
                  </div>

                  {selectedCategory ? (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => deleteItem(selectedCategory.id, selectedItem.id)}
                    >
                      {copy.deleteItem}
                    </button>
                  ) : null}

                  <button type="button" className="black-button" onClick={handleSave} disabled={saving}>
                    {saving ? copy.saving : copy.saveSection}
                  </button>
                </>
              )}
            </div>
          ) : null}
        </section>

        <section className="accordion-card">
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('options')}>
            <span>07</span>
            <strong>{copy.optionGroups}</strong>
            <em>›</em>
          </button>

          {openSection === 'options' ? (
            <div className="accordion-body">
              {!selectedItem ? (
                <div className="empty-block">{copy.chooseItem}</div>
              ) : (
                <>
                  <div className="chip-grid">
                    <button type="button" className="chip" onClick={() => addGroup(selectedItem.id, 'combo_type')}>
                      {copy.comboType}
                    </button>
                    <button type="button" className="chip" onClick={() => addGroup(selectedItem.id, 'protein')}>
                      {copy.protein}
                    </button>
                    <button type="button" className="chip" onClick={() => addGroup(selectedItem.id, 'patty')}>
                      {copy.patty}
                    </button>
                    <button type="button" className="chip" onClick={() => addGroup(selectedItem.id, 'size')}>
                      {copy.size}
                    </button>
                    <button type="button" className="chip" onClick={() => addGroup(selectedItem.id, 'drink')}>
                      {copy.drink}
                    </button>
                    <button type="button" className="chip" onClick={() => addGroup(selectedItem.id, 'side')}>
                      {copy.side}
                    </button>
                    <button type="button" className="chip" onClick={() => addGroup(selectedItem.id, 'extras')}>
                      {copy.extras}
                    </button>
                    <button type="button" className="chip" onClick={() => addGroup(selectedItem.id, 'removals')}>
                      {copy.removals}
                    </button>
                    <button type="button" className="chip" onClick={() => addGroup(selectedItem.id, 'custom')}>
                      {copy.custom}
                    </button>
                  </div>

                  {!selectedItem.groups.length ? <div className="empty-block">{copy.noOptions}</div> : null}

                  {selectedItem.groups.map((group) => (
                    <div key={group.id} className="nested-card">
                      <label>
                        <span>{copy.optionGroups}</span>
                        <input
                          value={group.name}
                          onChange={(e) => updateGroup(selectedItem.id, group.id, { name: e.target.value })}
                        />
                      </label>

                      <div className="chip-row">
                        <button
                          type="button"
                          className={`chip ${group.required ? 'active' : ''}`}
                          onClick={() => updateGroup(selectedItem.id, group.id, { required: !group.required })}
                        >
                          {group.required ? copy.required : copy.optional}
                        </button>

                        <button
                          type="button"
                          className={`chip ${group.selection === 'single' ? 'active' : ''}`}
                          onClick={() => updateGroup(selectedItem.id, group.id, { selection: 'single' })}
                        >
                          {copy.single}
                        </button>

                        <button
                          type="button"
                          className={`chip ${group.selection === 'multiple' ? 'active' : ''}`}
                          onClick={() => updateGroup(selectedItem.id, group.id, { selection: 'multiple' })}
                        >
                          {copy.multiple}
                        </button>
                      </div>

                      {group.choices.map((choice) => (
                        <div key={choice.id} className="choice-row">
                          <input
                            value={choice.name}
                            onChange={(e) =>
                              updateChoice(selectedItem.id, group.id, choice.id, { name: e.target.value })
                            }
                            placeholder={copy.choiceName}
                          />

                          <input
                            value={choice.price}
                            onChange={(e) =>
                              updateChoice(selectedItem.id, group.id, choice.id, {
                                price: sanitizeNumber(e.target.value),
                              })
                            }
                            placeholder="0"
                          />

                          <button
                            type="button"
                            className="choice-delete"
                            onClick={() => deleteChoice(selectedItem.id, group.id, choice.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <div className="nested-actions">
                        <button type="button" className="black-button" onClick={() => addChoice(selectedItem.id, group.id)}>
                          {copy.addChoice}
                        </button>

                        <button type="button" className="danger-button" onClick={() => deleteGroup(selectedItem.id, group.id)}>
                          {copy.deleteCategory}
                        </button>
                      </div>
                    </div>
                  ))}

                  <button type="button" className="black-button" onClick={handleSave} disabled={saving}>
                    {saving ? copy.saving : copy.saveSection}
                  </button>
                </>
              )}
            </div>
          ) : null}
        </section>

        <section className="accordion-card">
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('preview')}>
            <span>08</span>
            <strong>{copy.storefrontReflection}</strong>
            <em>›</em>
          </button>

          {openSection === 'preview' ? (
            <div className="accordion-body">
              <div className={`reflection-shell ${theme}`}>
                <div className="reflection-hero">
                  {heroImage ? (
                    <img src={heroImage} alt="hero preview" className="reflection-hero-image" />
                  ) : (
                    <div className="reflection-hero-fallback" />
                  )}

                  <div className="reflection-hero-overlay">
                    {logoImage ? (
                      <img src={logoImage} alt="logo preview" className="reflection-logo" />
                    ) : (
                      <div className="reflection-logo-fallback">{(name || 'M').charAt(0).toUpperCase()}</div>
                    )}

                    <div className="reflection-copy">
                      <h3>{name || 'Your Store'}</h3>
                      <p>{(slug || computedSlug) ? `/store/${slug || computedSlug}` : '/store/your-store'}</p>
                    </div>
                  </div>
                </div>

                <div className="reflection-toolbar">
                  <button type="button" className={storefrontLanguage === 'en' ? 'active' : ''}>EN</button>
                  <button type="button" className={storefrontLanguage === 'es' ? 'active' : ''}>ES</button>
                </div>

                <div className="reflection-info-card">
                  <div className="info-row">
                    <span>{copy.address}</span>
                    <strong>{address || '—'}</strong>
                  </div>
                  <div className="info-row">
                    <span>{copy.phone}</span>
                    <strong>{phone || '—'}</strong>
                  </div>
                  <div className="info-row">
                    <span>Pickup</span>
                    <strong>{pickupEnabled ? 'On' : 'Off'}</strong>
                  </div>
                  <div className="info-row">
                    <span>Delivery</span>
                    <strong>{deliveryEnabled ? 'On' : 'Off'}</strong>
                  </div>
                </div>

                <div className="hours-preview-card">
                  {DAY_KEYS.map((day) => (
                    <div key={day} className="hours-preview-row">
                      <span>{dayLabels[day]}</span>
                      <strong>
                        {hours[day].isOpen ? `${hours[day].open} - ${hours[day].close}` : copy.closed}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="reflection-tabs">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={previewCategory?.id === category.id ? 'active' : ''}
                      onClick={() => {
                        setPreviewCategoryId(category.id);
                        setPreviewItemId(category.items[0]?.id || '');
                      }}
                    >
                      {category.name || 'Category'}
                    </button>
                  ))}
                </div>

                <div className="reflection-grid">
                  {(previewCategory?.items || []).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="reflection-item-card"
                      onClick={() => setPreviewItemId(item.id)}
                    >
                      {getResolvedImage(item, previewCategory?.name || '') ? (
                        <img
                          src={getResolvedImage(item, previewCategory?.name || '')}
                          alt={item.name}
                          className="reflection-item-image"
                        />
                      ) : (
                        <div className="reflection-no-image">{copy.noImage}</div>
                      )}

                      <div className="reflection-item-copy">
                        <div>
                          <h4>{item.name || 'New Item'}</h4>
                          <p>{item.description || ''}</p>
                        </div>
                        <strong>{formatMoney(item.basePrice)}</strong>
                      </div>
                    </button>
                  ))}
                </div>

                {previewItem ? (
                  <div className="popup-preview">
                    {getResolvedImage(previewItem, previewCategory?.name || '') ? (
                      <img
                        src={getResolvedImage(previewItem, previewCategory?.name || '')}
                        alt={previewItem.name}
                        className="popup-image"
                      />
                    ) : null}

                    <div className="popup-copy">
                      <div className="popup-head">
                        <h4>{previewItem.name || 'New Item'}</h4>
                        <strong>{formatMoney(previewItem.basePrice)}</strong>
                      </div>

                      <p>{previewItem.description || ''}</p>

                      {previewItem.groups.length ? (
                        <div className="popup-groups">
                          {previewItem.groups.map((group) => (
                            <div key={group.id} className="popup-group-box">
                              <div className="popup-group-name">
                                {group.name}
                                {group.required ? ' *' : ''}
                              </div>

                              <div className="popup-choice-list">
                                {group.choices.map((choice) => (
                                  <div key={choice.id} className="popup-choice-pill">
                                    <span>{choice.name}</span>
                                    <strong>{Number(choice.price) > 0 ? `+${formatMoney(choice.price)}` : '$0'}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <button type="button" className="popup-button">
                        {copy.addToCart}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <style jsx>{styles}</style>
      </div>
    </main>
  );
}

const styles = `
  .builder-page {
    min-height: 100vh;
    background: #f2f2ee;
    padding: 24px 14px 60px;
  }

  .builder-shell {
    max-width: 860px;
    margin: 0 auto;
  }

  .loading-card,
  .quick-tools-card,
  .intro-card,
  .accordion-card {
    background: #fff;
    border: 1px solid #e8e8e2;
    border-radius: 28px;
    padding: 20px;
    margin-bottom: 18px;
  }

  .builder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .builder-header h1 {
    margin: 0;
    font-size: 42px;
    line-height: 1;
    font-weight: 900;
    color: #111;
    letter-spacing: -0.04em;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .lang-button,
  .save-button,
  .tool-button,
  .black-button,
  .white-button,
  .chip,
  .accordion-toggle,
  .item-pill,
  .choice-delete,
  .reflection-tabs button,
  .reflection-toolbar button,
  .reflection-item-card,
  .popup-button,
  .danger-button {
    border: none;
    outline: none;
    cursor: pointer;
    text-decoration: none;
    transition: 0.2s ease;
  }

  .lang-button,
  .save-button {
    min-width: 96px;
    height: 64px;
    border-radius: 22px;
    font-size: 20px;
    font-weight: 900;
  }

  .lang-button {
    background: #fff;
    border: 1px solid #e5e5df;
    color: #111;
  }

  .save-button {
    background: #111;
    color: #fff;
  }

  .quick-tools-title {
    font-size: 18px;
    font-weight: 900;
    color: #7d7d79;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .quick-tools-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .tool-button {
    min-height: 64px;
    border-radius: 20px;
    background: #fff;
    border: 1px solid #e5e5df;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111;
    font-size: 18px;
    font-weight: 900;
  }

  .tool-button.disabled {
    pointer-events: none;
    opacity: 0.45;
  }

  .message {
    border-radius: 24px;
    padding: 18px 20px;
    font-size: 18px;
    font-weight: 900;
    margin-bottom: 18px;
  }

  .message.error {
    background: #f8dddd;
    color: #9f2f2f;
  }

  .message.success {
    background: #e5f5e7;
    color: #22603a;
  }

  .hero-preview {
    background: #fff;
    border: 1px solid #e8e8e2;
    border-radius: 28px;
    padding: 14px;
    margin-bottom: 18px;
  }

  .hero-image-wrap {
    position: relative;
    min-height: 320px;
    border-radius: 28px;
    overflow: hidden;
    background: #e8e8e2;
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
    background: linear-gradient(135deg, #d8d8d2 0%, #ecece7 100%);
  }

  .hero-overlay {
    position: relative;
    z-index: 1;
    min-height: 320px;
    display: flex;
    align-items: flex-end;
    padding: 24px;
    background: linear-gradient(180deg, rgba(0,0,0,0.05) 10%, rgba(0,0,0,0.72) 100%);
  }

  .hero-brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .hero-logo,
  .hero-logo-fallback {
    width: 92px;
    height: 92px;
    border-radius: 24px;
    object-fit: cover;
    background: #fff;
    flex-shrink: 0;
  }

  .hero-logo-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    font-weight: 900;
    color: #111;
  }

  .hero-name {
    color: #fff;
    font-size: 54px;
    line-height: 1;
    font-weight: 900;
    margin-bottom: 8px;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    color: #fff;
    font-size: 20px;
    font-weight: 800;
  }

  .intro-card h2 {
    margin: 0 0 10px;
    font-size: 56px;
    line-height: 0.95;
    font-weight: 900;
    color: #101019;
    letter-spacing: -0.05em;
  }

  .intro-card p {
    margin: 0;
    font-size: 24px;
    line-height: 1.35;
    color: #6a6a72;
    font-weight: 800;
  }

  .accordion-toggle {
    width: 100%;
    background: transparent;
    display: grid;
    grid-template-columns: 56px 1fr 32px;
    align-items: center;
    gap: 12px;
    padding: 0;
    color: #111;
  }

  .accordion-toggle span {
    font-size: 18px;
    color: #8d8d88;
    font-weight: 900;
  }

  .accordion-toggle strong {
    text-align: left;
    font-size: 32px;
    line-height: 1;
    font-weight: 900;
  }

  .accordion-toggle em {
    font-style: normal;
    font-size: 42px;
    line-height: 1;
    text-align: right;
    color: #111;
  }

  .accordion-body {
    margin-top: 20px;
    display: grid;
    gap: 18px;
  }

  .accordion-body label {
    display: grid;
    gap: 10px;
  }

  .accordion-body label span,
  .field-label,
  .upload-title {
    color: #7d7d79;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .accordion-body input,
  .accordion-body textarea,
  .accordion-body select {
    width: 100%;
    border: 1px solid #e5e5df;
    background: #fff;
    color: #111;
    border-radius: 22px;
    padding: 18px 20px;
    font-size: 20px;
    font-weight: 800;
    outline: none;
  }

  .accordion-body textarea {
    min-height: 130px;
    resize: vertical;
  }

  .black-button,
  .white-button,
  .chip,
  .danger-button {
    min-height: 62px;
    border-radius: 22px;
    padding: 0 20px;
    font-size: 20px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .black-button {
    background: #111;
    color: #fff;
  }

  .white-button {
    background: #fff;
    color: #111;
    border: 1px solid #e5e5df;
  }

  .danger-button {
    background: #f8dddd;
    color: #9f2f2f;
  }

  .upload-block,
  .nested-card,
  .preview-card {
    background: #fff;
    border: 1px solid #ecece6;
    border-radius: 24px;
    padding: 18px;
    display: grid;
    gap: 14px;
  }

  .upload-preview,
  .upload-empty,
  .item-preview-image {
    width: 100%;
    border-radius: 24px;
    background: #f1f1ec;
    min-height: 220px;
    object-fit: cover;
  }

  .logo-preview {
    object-fit: contain;
    padding: 12px;
    background: #fff;
  }

  .upload-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #777;
    font-size: 22px;
    font-weight: 900;
  }

  .nested-actions,
  .chip-row,
  .chip-grid,
  .item-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .chip-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .chip {
    background: #fff;
    color: #111;
    border: 1px solid #e5e5df;
  }

  .chip.active,
  .item-pill.active,
  .reflection-tabs button.active,
  .reflection-toolbar button.active {
    background: #111;
    color: #fff;
  }

  .item-pill {
    background: #fff;
    color: #111;
    border: 1px solid #e5e5df;
    border-radius: 18px;
    padding: 14px 16px;
    min-width: 180px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 18px;
    font-weight: 900;
  }

  .empty-block {
    background: #f5f5f0;
    border: 1px dashed #d6d6cf;
    color: #6f6f69;
    border-radius: 20px;
    padding: 20px;
    font-size: 20px;
    font-weight: 800;
    text-align: center;
  }

  .preview-card {
    overflow: hidden;
    padding: 0;
  }

  .item-preview-image {
    min-height: 300px;
    border-radius: 24px 24px 0 0;
  }

  .item-preview-bar {
    background: #111;
    color: #fff;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    font-size: 20px;
    font-weight: 900;
  }

  .choice-row {
    display: grid;
    grid-template-columns: 1fr 120px 62px;
    gap: 10px;
  }

  .choice-delete {
    background: #f8dddd;
    color: #9f2f2f;
    border-radius: 18px;
    font-size: 30px;
    font-weight: 900;
  }

  .hours-row {
    display: grid;
    grid-template-columns: 1.2fr 140px 1fr 1fr;
    gap: 10px;
    align-items: center;
  }

  .hours-day {
    font-size: 18px;
    font-weight: 900;
    color: #111;
  }

  .reflection-shell {
    border-radius: 28px;
    overflow: hidden;
    border: 1px solid #ecece4;
  }

  .reflection-shell.light {
    background: #fff;
    color: #111;
  }

  .reflection-shell.dark {
    background: #0b0b0d;
    color: #fff;
  }

  .reflection-hero {
    position: relative;
    min-height: 280px;
    background: #dbdbd5;
  }

  .reflection-hero-image,
  .reflection-hero-fallback {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .reflection-hero-image {
    object-fit: cover;
  }

  .reflection-hero-fallback {
    background: linear-gradient(135deg, #dcdcd7 0%, #ededeb 100%);
  }

  .reflection-hero-overlay {
    position: relative;
    z-index: 1;
    min-height: 280px;
    display: flex;
    align-items: flex-end;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%);
  }

  .reflection-logo,
  .reflection-logo-fallback {
    width: 82px;
    height: 82px;
    border-radius: 22px;
    background: #fff;
    object-fit: cover;
    flex-shrink: 0;
  }

  .reflection-logo-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111;
    font-size: 36px;
    font-weight: 900;
  }

  .reflection-copy h3 {
    margin: 0 0 8px;
    font-size: 44px;
    line-height: 1;
    font-weight: 900;
    color: #fff;
  }

  .reflection-copy p {
    margin: 0;
    color: #fff;
    font-size: 20px;
    font-weight: 800;
  }

  .reflection-toolbar,
  .reflection-tabs {
    display: flex;
    gap: 12px;
    padding: 18px;
    flex-wrap: wrap;
  }

  .reflection-toolbar button,
  .reflection-tabs button {
    min-height: 58px;
    border-radius: 18px;
    padding: 0 22px;
    border: 1px solid #e3e3dc;
    background: #fff;
    color: #111;
    font-size: 18px;
    font-weight: 900;
  }

  .reflection-info-card {
    margin: 0 18px 18px;
    background: #fff;
    border: 1px solid #ecece5;
    border-radius: 22px;
    overflow: hidden;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px;
    border-bottom: 1px solid #efefe9;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-row span {
    color: #111;
    font-size: 18px;
    font-weight: 900;
  }

  .info-row strong {
    color: #767680;
    font-size: 18px;
    font-weight: 800;
    text-align: right;
  }

  .hours-preview-card {
    margin: 0 18px 18px;
    background: #fff;
    border: 1px solid #ecece5;
    border-radius: 22px;
    overflow: hidden;
  }

  .hours-preview-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #efefe9;
  }

  .hours-preview-row:last-child {
    border-bottom: none;
  }

  .hours-preview-row span {
    color: #111;
    font-size: 18px;
    font-weight: 900;
  }

  .hours-preview-row strong {
    color: #767680;
    font-size: 18px;
    font-weight: 800;
    text-align: right;
  }

  .reflection-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding: 0 18px 18px;
  }

  .reflection-item-card {
    background: #fff;
    border: 1px solid #ecece5;
    border-radius: 22px;
    overflow: hidden;
    text-align: left;
  }

  .reflection-item-image,
  .reflection-no-image {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    background: #efefea;
  }

  .reflection-no-image {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #787878;
    font-size: 20px;
    font-weight: 900;
  }

  .reflection-item-copy {
    padding: 16px;
    display: grid;
    gap: 12px;
  }

  .reflection-item-copy h4 {
    margin: 0;
    font-size: 22px;
    font-weight: 900;
    color: #111;
  }

  .reflection-item-copy p {
    margin: 8px 0 0;
    font-size: 16px;
    line-height: 1.4;
    color: #666;
    font-weight: 700;
  }

  .reflection-item-copy strong {
    font-size: 22px;
    font-weight: 900;
    color: #111;
  }

  .popup-preview {
    margin: 0 18px 18px;
    background: #fff;
    border: 1px solid #ecece5;
    border-radius: 24px;
    overflow: hidden;
  }

  .popup-image {
    width: 100%;
    max-height: 340px;
    object-fit: cover;
    display: block;
  }

  .popup-copy {
    padding: 20px;
    display: grid;
    gap: 14px;
  }

  .popup-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .popup-head h4 {
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    color: #111;
  }

  .popup-head strong {
    font-size: 24px;
    font-weight: 900;
    color: #111;
  }

  .popup-copy p {
    margin: 0;
    font-size: 18px;
    line-height: 1.45;
    color: #666;
    font-weight: 700;
  }

  .popup-groups {
    display: grid;
    gap: 12px;
  }

  .popup-group-box {
    border: 1px solid #ecece4;
    border-radius: 18px;
    padding: 14px;
    background: #fafaf8;
  }

  .popup-group-name {
    font-size: 16px;
    font-weight: 900;
    color: #111;
    margin-bottom: 10px;
  }

  .popup-choice-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .popup-choice-pill {
    border-radius: 16px;
    padding: 10px 12px;
    background: #fff;
    border: 1px solid #e6e6df;
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 14px;
    font-weight: 800;
    color: #111;
  }

  .popup-button {
    min-height: 62px;
    border-radius: 20px;
    background: #111;
    color: #fff;
    font-size: 20px;
    font-weight: 900;
  }

  @media (max-width: 760px) {
    .builder-page {
      padding: 14px 10px 50px;
    }

    .builder-header {
      flex-direction: column;
      align-items: stretch;
    }

    .builder-header h1 {
      font-size: 32px;
    }

    .header-actions {
      justify-content: flex-end;
    }

    .quick-tools-grid,
    .reflection-grid,
    .chip-grid {
      grid-template-columns: 1fr;
    }

    .intro-card h2 {
      font-size: 34px;
    }

    .intro-card p {
      font-size: 18px;
    }

    .hero-name {
      font-size: 32px;
    }

    .hero-meta {
      font-size: 16px;
    }

    .accordion-toggle strong {
      font-size: 22px;
    }

    .choice-row,
    .hours-row {
      grid-template-columns: 1fr;
    }
  }
\`;
