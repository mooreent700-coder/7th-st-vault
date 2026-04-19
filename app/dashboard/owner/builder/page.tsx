'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ensureOwnerRestaurant, saveRestaurant, getStoreUrl } from '@/lib/owner-restaurant';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';
type SectionKey = 'store' | 'branding' | 'controls' | 'hours' | 'menu' | 'preview';

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
  menuBuilder: string;
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
  deleteOptionBox: string;
  noCategories: string;
  noItems: string;
  noOptions: string;
  noImage: string;
  addToCart: string;
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
  optionBoxes: string;
};

const COPY: Record<LanguageMode, CopyBlock> = {
  en: {
    appTitle: 'MENUFLOW BUILDER',
    subtitle:
      'Owner control center for store setup, branding, hours, menu building, and storefront reflection.',
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
    menuBuilder: 'Menu Builder',
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
    deleteOptionBox: 'Delete Option Box',
    noCategories: 'No categories yet.',
    noItems: 'No items yet.',
    noOptions: 'No option boxes yet.',
    noImage: 'No Image',
    addToCart: 'Add to Cart',
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
    optionBoxes: 'Option Boxes',
  },
  es: {
    appTitle: 'MENUFLOW BUILDER',
    subtitle:
      'Centro de control del dueño para tienda, branding, horario, menú y reflejo de tienda.',
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
    menuBuilder: 'Menu Builder',
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
    deleteOptionBox: 'Eliminar Caja',
    noCategories: 'Todavía no hay categorías.',
    noItems: 'Todavía no hay productos.',
    noOptions: 'Todavía no hay cajas de opciones.',
    noImage: 'Sin Imagen',
    addToCart: 'Agregar al Carrito',
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
    optionBoxes: 'Cajas de Opciones',
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
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function sanitizeNumber(value: string) {
  return value.replace(/[^0-9.]/g, '');
}

function formatMoney(value: string) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return '$0.00';
  return `$${numeric.toFixed(2)}`;
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
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ');
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
  const resolvedSlug = useMemo(() => slugify(slug || computedSlug || name), [slug, computedSlug, name]);

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

        const restaurant = (await ensureOwnerRestaurant()) as RestaurantRow;
        if (!mounted) return;

        setOwnerId(restaurant.owner_id || null);
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

        const { data: categoryRows, error: categoryError } = await supabase
          .from('menu_categories')
          .select('id, restaurant_id, name, sort_order')
          .eq('restaurant_id', restaurant.id)
          .order('sort_order', { ascending: true });

        if (categoryError) throw categoryError;

        const { data: itemRows, error: itemError } = await supabase
          .from('menu_items')
          .select('id, restaurant_id, category_id, name, description, price, base_price, image_url, availability, is_available, sort_order')
          .eq('restaurant_id', restaurant.id)
          .order('sort_order', { ascending: true });

        if (itemError) throw itemError;

        const loadedItems = safeArray(itemRows) as ItemRow[];
        const itemIds = loadedItems.map((item) => item.id);

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
                  selection: group.selection_mode === 'multiple' ? 'multiple' : 'single',
                  type: 'custom' as BuilderGroupType,
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

        if (!mounted) return;

        if (builtCategories.length) {
          setCategories(builtCategories);
          const firstCategory = builtCategories[0] || null;
          const firstItem = firstCategory?.items[0] || null;
          setPreviewCategoryId(firstCategory?.id || '');
          setPreviewItemId(firstItem?.id || '');
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

          setCategories(starter);
          setPreviewCategoryId(categoryId);
          setPreviewItemId(itemId);
        }
      } catch (err: any) {
        if (!mounted) return;
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

  async function handleItemUpload(categoryId: string, itemId: string, file: File | null) {
    if (!file) return;

    try {
      setItemUploadingId(itemId);
      setError('');
      const url = await uploadImage(file, 'menu-items', 'item');

      setCategories((current) =>
        current.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                items: category.items.map((item) => (item.id === itemId ? { ...item, imageUrl: url } : item)),
              }
            : category
        )
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
  }

  function updateItem(categoryId: string, itemId: string, patch: Partial<BuilderItem>) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            }
          : category
      )
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
    setPreviewCategoryId(category?.id || '');
    setPreviewItemId(item?.id || '');
  }

  function addGroup(categoryId: string, itemId: string, type: BuilderGroupType) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) =>
                item.id === itemId ? { ...item, groups: [...item.groups, defaultGroup(type, copy)] } : item
              ),
            }
          : category
      )
    );
  }

  function updateGroup(categoryId: string, itemId: string, groupId: string, patch: Partial<BuilderGroup>) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      groups: item.groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
                    }
                  : item
              ),
            }
          : category
      )
    );
  }

  function deleteGroup(categoryId: string, itemId: string, groupId: string) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) =>
                item.id === itemId ? { ...item, groups: item.groups.filter((group) => group.id !== groupId) } : item
              ),
            }
          : category
      )
    );
  }

  function addChoice(categoryId: string, itemId: string, groupId: string) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
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
            }
          : category
      )
    );
  }

  function updateChoice(
    categoryId: string,
    itemId: string,
    groupId: string,
    choiceId: string,
    patch: Partial<BuilderChoice>
  ) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
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
            }
          : category
      )
    );
  }

  function deleteChoice(categoryId: string, itemId: string, groupId: string, choiceId: string) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
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
            }
          : category
      )
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

      const updatedRestaurant = (await saveRestaurant({
        name: name.trim() || null,
        slug: resolvedSlug || null,
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
      })) as RestaurantRow;

      const currentRestaurantId = updatedRestaurant.id;
      setRestaurantId(currentRestaurantId);
      setSlug(updatedRestaurant.slug || resolvedSlug);

      const categoryIdMap = new Map<string, string>();
      const itemIdMap = new Map<string, string>();
      const groupIdMap = new Map<string, string>();
      const choiceIdMap = new Map<string, string>();

      categories.forEach((category) => {
        categoryIdMap.set(category.id, isUuid(category.id) ? category.id : makeUuid());
      });

      categories.forEach((category) => {
        category.items.forEach((item) => {
          itemIdMap.set(item.id, isUuid(item.id) ? item.id : makeUuid());
          item.groups.forEach((group) => {
            groupIdMap.set(group.id, isUuid(group.id) ? group.id : makeUuid());
            group.choices.forEach((choice) => {
              choiceIdMap.set(choice.id, isUuid(choice.id) ? choice.id : makeUuid());
            });
          });
        });
      });

      const categoryRows = categories.map((category, index) => ({
        id: categoryIdMap.get(category.id)!,
        restaurant_id: currentRestaurantId,
        name: category.name.trim() || `Category ${index + 1}`,
        sort_order: index,
      }));

      if (categoryRows.length) {
        const { error: categoryUpsertError } = await supabase
          .from('menu_categories')
          .upsert(categoryRows, { onConflict: 'id' });
        if (categoryUpsertError) throw categoryUpsertError;
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
        const { error: itemUpsertError } = await supabase
          .from('menu_items')
          .upsert(itemRows, { onConflict: 'id' });
        if (itemUpsertError) throw itemUpsertError;
      }

      const groupRows = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.groups.map((group, groupIndex) => ({
            id: groupIdMap.get(group.id)!,
            item_id: itemIdMap.get(item.id)!,
            name: group.name.trim() || copy.custom,
            is_required: group.required,
            selection_mode: group.selection,
            sort_order: groupIndex,
          }))
        )
      );

      if (groupRows.length) {
        const { error: groupUpsertError } = await supabase
          .from('menu_option_groups')
          .upsert(groupRows, { onConflict: 'id' });
        if (groupUpsertError) throw groupUpsertError;
      }

      const choiceRows = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.groups.flatMap((group) =>
            group.choices.map((choice, choiceIndex) => ({
              id: choiceIdMap.get(choice.id)!,
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
        const { error: choiceUpsertError } = await supabase
          .from('menu_option_choices')
          .upsert(choiceRows, { onConflict: 'id' });
        if (choiceUpsertError) throw choiceUpsertError;
      }

      const { data: existingCategories, error: existingCategoryError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', currentRestaurantId);
      if (existingCategoryError) throw existingCategoryError;

      const existingCategoryIds = safeArray(existingCategories).map((row: { id: string }) => row.id);
      const currentCategoryIds = categoryRows.map((row) => row.id);

      const { data: existingItems, error: existingItemError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('restaurant_id', currentRestaurantId);
      if (existingItemError) throw existingItemError;

      const existingItemIds = safeArray(existingItems).map((row: { id: string }) => row.id);
      const currentItemIds = itemRows.map((row) => row.id);

      let existingGroupIds: string[] = [];
      if (existingItemIds.length) {
        const { data: existingGroups, error: existingGroupError } = await supabase
          .from('menu_option_groups')
          .select('id')
          .in('item_id', existingItemIds);
        if (existingGroupError) throw existingGroupError;
        existingGroupIds = safeArray(existingGroups).map((row: { id: string }) => row.id);
      }

      const currentGroupIds = groupRows.map((row) => row.id);

      let existingChoiceIds: string[] = [];
      if (existingGroupIds.length) {
        const { data: existingChoices, error: existingChoiceError } = await supabase
          .from('menu_option_choices')
          .select('id')
          .in('option_group_id', existingGroupIds);
        if (existingChoiceError) throw existingChoiceError;
        existingChoiceIds = safeArray(existingChoices).map((row: { id: string }) => row.id);
      }

      const currentChoiceIds = choiceRows.map((row) => row.id);

      const staleChoiceIds = existingChoiceIds.filter((id) => !currentChoiceIds.includes(id));
      const staleGroupIds = existingGroupIds.filter((id) => !currentGroupIds.includes(id));
      const staleItemIds = existingItemIds.filter((id) => !currentItemIds.includes(id));
      const staleCategoryIds = existingCategoryIds.filter((id) => !currentCategoryIds.includes(id));

      if (staleChoiceIds.length) {
        const { error: deleteChoicesError } = await supabase
          .from('menu_option_choices')
          .delete()
          .in('id', staleChoiceIds);
        if (deleteChoicesError) throw deleteChoicesError;
      }

      if (staleGroupIds.length) {
        const { error: deleteGroupsError } = await supabase
          .from('menu_option_groups')
          .delete()
          .in('id', staleGroupIds);
        if (deleteGroupsError) throw deleteGroupsError;
      }

      if (staleItemIds.length) {
        const { error: deleteItemsError } = await supabase
          .from('menu_items')
          .delete()
          .in('id', staleItemIds);
        if (deleteItemsError) throw deleteItemsError;
      }

      if (staleCategoryIds.length) {
        const { error: deleteCategoriesError } = await supabase
          .from('menu_categories')
          .delete()
          .in('id', staleCategoryIds);
        if (deleteCategoriesError) throw deleteCategoriesError;
      }

      setCategories((current) =>
        current.map((category) => ({
          ...category,
          id: categoryIdMap.get(category.id)!,
          items: category.items.map((item) => ({
            ...item,
            id: itemIdMap.get(item.id)!,
            categoryId: categoryIdMap.get(category.id)!,
            groups: item.groups.map((group) => ({
              ...group,
              id: groupIdMap.get(group.id)!,
              choices: group.choices.map((choice) => ({
                ...choice,
                id: choiceIdMap.get(choice.id)!,
              })),
            })),
          })),
        }))
      );

      setSuccess(copy.saveSuccess);
    } catch (err: any) {
      setError(err?.message || copy.saveFail);
      setSuccess('');
    } finally {
      setSaving(false);
    }
  }

  const storeHref = resolvedSlug ? getStoreUrl(resolvedSlug) : '#';

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

            <Link href={storeHref} className={`tool-button ${!resolvedSlug ? 'disabled' : ''}`}>
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
                <input value={resolvedSlug ? `/store/${resolvedSlug}` : '/store/your-store'} readOnly />
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
                <div key={day} className="hours-card">
                  <div className="hours-day">{dayLabels[day]}</div>

                  <div className="hours-actions">
                    <button
                      type="button"
                      className={`chip hours-toggle ${hours[day].isOpen ? 'active' : ''}`}
                      onClick={() => updateHours(day, { isOpen: !hours[day].isOpen })}
                    >
                      {hours[day].isOpen ? copy.open : copy.closed}
                    </button>

                    <div className="time-grid">
                      <label className="time-wrap">
                        <span>{copy.openLabel}</span>
                        <input
                          type="time"
                          value={hours[day].open}
                          disabled={!hours[day].isOpen}
                          onChange={(e) => updateHours(day, { open: e.target.value })}
                        />
                      </label>

                      <label className="time-wrap">
                        <span>{copy.closeLabel}</span>
                        <input
                          type="time"
                          value={hours[day].close}
                          disabled={!hours[day].isOpen}
                          onChange={(e) => updateHours(day, { close: e.target.value })}
                        />
                      </label>
                    </div>
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
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('menu')}>
            <span>05</span>
            <strong>{copy.menuBuilder}</strong>
            <em>›</em>
          </button>

          {openSection === 'menu' ? (
            <div className="accordion-body">
              <div className="menu-builder-actions">
                <button type="button" className="black-button" onClick={addCategory}>
                  {copy.addCategory}
                </button>
              </div>

              {!categories.length ? <div className="empty-block">{copy.noCategories}</div> : null}

              {categories.map((category) => (
                <div key={category.id} className="menu-category-card">
                  <div className="menu-category-head">
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
                  </div>

                  {!category.items.length ? <div className="empty-block">{copy.noItems}</div> : null}

                  <div className="item-stack">
                    {category.items.map((item) => {
                      const resolvedImage = getResolvedImage(item, category.name);

                      return (
                        <div key={item.id} className="menu-item-card">
                          <div className="menu-item-top">
                            <div className="menu-item-preview">
                              {resolvedImage ? (
                                <img src={resolvedImage} alt={item.name} className="item-preview-image" />
                              ) : (
                                <div className="upload-empty">{copy.noImage}</div>
                              )}
                            </div>

                            <div className="menu-item-fields">
                              <label>
                                <span>{copy.itemName}</span>
                                <input
                                  value={item.name}
                                  onChange={(e) => updateItem(category.id, item.id, { name: e.target.value })}
                                />
                              </label>

                              <label>
                                <span>{copy.description}</span>
                                <textarea
                                  value={item.description}
                                  onChange={(e) => updateItem(category.id, item.id, { description: e.target.value })}
                                />
                              </label>

                              <div className="two-col">
                                <label>
                                  <span>{copy.basePrice}</span>
                                  <input
                                    value={item.basePrice}
                                    onChange={(e) =>
                                      updateItem(category.id, item.id, { basePrice: sanitizeNumber(e.target.value) })
                                    }
                                  />
                                </label>

                                <div>
                                  <span className="field-label small-gap">Status</span>
                                  <div className="chip-row">
                                    <button
                                      type="button"
                                      className={`chip ${item.availability === 'available' ? 'active' : ''}`}
                                      onClick={() => updateItem(category.id, item.id, { availability: 'available' })}
                                    >
                                      {copy.available}
                                    </button>

                                    <button
                                      type="button"
                                      className={`chip ${item.availability === 'sold_out' ? 'active' : ''}`}
                                      onClick={() => updateItem(category.id, item.id, { availability: 'sold_out' })}
                                    >
                                      {copy.soldOut}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="nested-actions">
                                <label className="black-button">
                                  {itemUploadingId === item.id ? copy.saving : copy.uploadItemImage}
                                  <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => void handleItemUpload(category.id, item.id, e.target.files?.[0] || null)}
                                  />
                                </label>

                                <button
                                  type="button"
                                  className="white-button"
                                  onClick={() => updateItem(category.id, item.id, { imageUrl: '' })}
                                >
                                  {copy.removeItemImage}
                                </button>

                                <button
                                  type="button"
                                  className="danger-button"
                                  onClick={() => deleteItem(category.id, item.id)}
                                >
                                  {copy.deleteItem}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="option-builder">
                            <div className="option-builder-head">
                              <h4>{copy.optionBoxes}</h4>
                              <div className="chip-grid">
                                <button type="button" className="chip" onClick={() => addGroup(category.id, item.id, 'combo_type')}>
                                  {copy.comboType}
                                </button>
                                <button type="button" className="chip" onClick={() => addGroup(category.id, item.id, 'protein')}>
                                  {copy.protein}
                                </button>
                                <button type="button" className="chip" onClick={() => addGroup(category.id, item.id, 'patty')}>
                                  {copy.patty}
                                </button>
                                <button type="button" className="chip" onClick={() => addGroup(category.id, item.id, 'size')}>
                                  {copy.size}
                                </button>
                                <button type="button" className="chip" onClick={() => addGroup(category.id, item.id, 'drink')}>
                                  {copy.drink}
                                </button>
                                <button type="button" className="chip" onClick={() => addGroup(category.id, item.id, 'side')}>
                                  {copy.side}
                                </button>
                                <button type="button" className="chip" onClick={() => addGroup(category.id, item.id, 'extras')}>
                                  {copy.extras}
                                </button>
                                <button type="button" className="chip" onClick={() => addGroup(category.id, item.id, 'removals')}>
                                  {copy.removals}
                                </button>
                                <button type="button" className="chip" onClick={() => addGroup(category.id, item.id, 'custom')}>
                                  {copy.custom}
                                </button>
                              </div>
                            </div>

                            {!item.groups.length ? <div className="empty-block">{copy.noOptions}</div> : null}

                            <div className="group-stack">
                              {item.groups.map((group) => (
                                <div key={group.id} className="nested-card">
                                  <label>
                                    <span>{copy.optionBoxes}</span>
                                    <input
                                      value={group.name}
                                      onChange={(e) =>
                                        updateGroup(category.id, item.id, group.id, { name: e.target.value })
                                      }
                                    />
                                  </label>

                                  <div className="chip-row">
                                    <button
                                      type="button"
                                      className={`chip ${group.required ? 'active' : ''}`}
                                      onClick={() =>
                                        updateGroup(category.id, item.id, group.id, { required: !group.required })
                                      }
                                    >
                                      {group.required ? copy.required : copy.optional}
                                    </button>

                                    <button
                                      type="button"
                                      className={`chip ${group.selection === 'single' ? 'active' : ''}`}
                                      onClick={() =>
                                        updateGroup(category.id, item.id, group.id, { selection: 'single' })
                                      }
                                    >
                                      {copy.single}
                                    </button>

                                    <button
                                      type="button"
                                      className={`chip ${group.selection === 'multiple' ? 'active' : ''}`}
                                      onClick={() =>
                                        updateGroup(category.id, item.id, group.id, { selection: 'multiple' })
                                      }
                                    >
                                      {copy.multiple}
                                    </button>
                                  </div>

                                  <div className="choice-list">
                                    {group.choices.map((choice) => (
                                      <div key={choice.id} className="choice-row">
                                        <input
                                          value={choice.name}
                                          onChange={(e) =>
                                            updateChoice(category.id, item.id, group.id, choice.id, { name: e.target.value })
                                          }
                                          placeholder={copy.choiceName}
                                        />

                                        <input
                                          value={choice.price}
                                          onChange={(e) =>
                                            updateChoice(category.id, item.id, group.id, choice.id, {
                                              price: sanitizeNumber(e.target.value),
                                            })
                                          }
                                          placeholder="0"
                                        />

                                        <button
                                          type="button"
                                          className="choice-delete"
                                          onClick={() => deleteChoice(category.id, item.id, group.id, choice.id)}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="nested-actions">
                                    <button
                                      type="button"
                                      className="black-button"
                                      onClick={() => addChoice(category.id, item.id, group.id)}
                                    >
                                      {copy.addChoice}
                                    </button>

                                    <button
                                      type="button"
                                      className="danger-button"
                                      onClick={() => deleteGroup(category.id, item.id, group.id)}
                                    >
                                      {copy.deleteOptionBox}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
          <button type="button" className="accordion-toggle" onClick={() => setOpenSection('preview')}>
            <span>06</span>
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
                      <p>{resolvedSlug ? `/store/${resolvedSlug}` : '/store/your-store'}</p>
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

                      <p>{previewItem.description || 'Customize this item before adding it to your order.'}</p>

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
                                    <strong>{Number(choice.price) > 0 ? `+${formatMoney(choice.price)}` : '$0.00'}</strong>
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
    max-width: 980px;
    margin: 0 auto;
  }

  .loading-card,
  .quick-tools-card,
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

  .small-gap {
    display: block;
    margin-bottom: 10px;
  }

  .accordion-body input,
  .accordion-body textarea {
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
    min-height: 120px;
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
  .menu-category-card,
  .menu-item-card {
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

  .menu-builder-actions,
  .nested-actions,
  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .chip-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .chip {
    background: #fff;
    color: #111;
    border: 1px solid #e5e5df;
  }

  .chip.active,
  .reflection-tabs button.active,
  .reflection-toolbar button.active {
    background: #111;
    color: #fff;
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

  .hours-card {
    display: grid;
    gap: 14px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid #ecece6;
    background: #fff;
  }

  .hours-day {
    font-size: 24px;
    font-weight: 900;
    color: #111;
  }

  .hours-actions {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 16px;
    align-items: end;
  }

  .hours-toggle {
    width: 100%;
  }

  .time-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .time-wrap {
    display: grid;
    gap: 10px;
  }

  .time-wrap input[type='time'] {
    min-height: 62px;
    border: 1px solid #e5e5df;
    border-radius: 22px;
    padding: 0 18px;
    font-size: 20px;
    font-weight: 800;
    background: #fff;
    color: #111;
  }

  .menu-category-head {
    display: grid;
    gap: 14px;
  }

  .item-stack,
  .group-stack {
    display: grid;
    gap: 18px;
  }

  .menu-item-top {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 18px;
    align-items: start;
  }

  .menu-item-preview {
    display: grid;
    gap: 12px;
  }

  .menu-item-fields {
    display: grid;
    gap: 14px;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    align-items: end;
  }

  .option-builder {
    display: grid;
    gap: 14px;
    padding-top: 8px;
    border-top: 1px solid #efefe9;
  }

  .option-builder-head {
    display: grid;
    gap: 12px;
  }

  .option-builder-head h4 {
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    color: #111;
  }

  .choice-list {
    display: grid;
    gap: 10px;
  }

  .choice-row {
    display: grid;
    grid-template-columns: 1fr 160px 62px;
    gap: 10px;
  }

  .choice-delete {
    background: #f8dddd;
    color: #9f2f2f;
    border-radius: 18px;
    font-size: 30px;
    font-weight: 900;
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

  @media (max-width: 900px) {
    .menu-item-top {
      grid-template-columns: 1fr;
    }

    .two-col,
    .hours-actions,
    .time-grid {
      grid-template-columns: 1fr;
    }
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

    .hero-name {
      font-size: 32px;
    }

    .hero-meta {
      font-size: 16px;
    }

    .accordion-toggle strong {
      font-size: 22px;
    }

    .choice-row {
      grid-template-columns: 1fr;
    }
  }
`;
