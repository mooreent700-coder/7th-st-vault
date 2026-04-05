'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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

type SectionKey = 'store' | 'branding' | 'settings' | 'categories' | 'items' | 'options';

type CopyBlock = {
  eyebrow: string;
  title: string;
  subtitle: string;
  openStore: string;
  saveBuilder: string;
  saving: string;
  loading: string;
  couldNotLoad: string;
  couldNotSave: string;
  builderSaved: string;
  couldNotUploadHero: string;
  couldNotUploadLogo: string;
  couldNotUploadItem: string;
  storeSetup: string;
  branding: string;
  settings: string;
  categoryBuilder: string;
  itemBuilder: string;
  optionGroups: string;
  storeName: string;
  slug: string;
  phone: string;
  address: string;
  liveUrl: string;
  uploadHeroImage: string;
  uploadLogo: string;
  uploadItemImage: string;
  heroPreview: string;
  logoPreview: string;
  itemPreview: string;
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
  delete: string;
  deleteItem: string;
  noOptionGroups: string;
  protein: string;
  size: string;
  drink: string;
  extras: string;
  removals: string;
  custom: string;
  customOptions: string;
  required: string;
  optional: string;
  singleChoice: string;
  multipleChoice: string;
  choiceName: string;
  addChoice: string;
  newChoice: string;
  options: string;
  livePreview: string;
  heroInfoBlock: string;
  storefrontPreview: string;
  sampleItem: string;
  sampleDescription: string;
  newItem: string;
  category: string;
  untitledCategory: string;
  itemsIn: string;
  preview: string;
  builder: string;
  dashboard: string;
  flyers: string;
  orders: string;
};

const COPY: Record<LanguageMode, CopyBlock> = {
  en: {
    eyebrow: 'MENUFLOW BUILDER',
    title: 'Build Your Store',
    subtitle: 'Create the storefront, menu, options, and live experience from one place.',
    openStore: 'Open Store',
    saveBuilder: 'Save Builder',
    saving: 'Saving...',
    loading: 'Loading builder...',
    couldNotLoad: 'Could not load builder.',
    couldNotSave: 'Could not save builder.',
    builderSaved: 'Builder saved.',
    couldNotUploadHero: 'Could not upload hero image.',
    couldNotUploadLogo: 'Could not upload logo image.',
    couldNotUploadItem: 'Could not upload item image.',
    storeSetup: 'Store Setup',
    branding: 'Branding',
    settings: 'Settings',
    categoryBuilder: 'Categories',
    itemBuilder: 'Item Builder',
    optionGroups: 'Option Groups',
    storeName: 'Store Name',
    slug: 'Slug',
    phone: 'Phone',
    address: 'Address',
    liveUrl: 'Live URL',
    uploadHeroImage: 'Upload Hero Image',
    uploadLogo: 'Upload Logo',
    uploadItemImage: 'Upload Item Image',
    heroPreview: 'Hero Preview',
    logoPreview: 'Logo Preview',
    itemPreview: 'Item Preview',
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
    addCategory: 'Add Category',
    categoryName: 'Category Name',
    addItem: 'Add Item',
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
    noOptionGroups: 'No option groups yet.',
    protein: 'Protein',
    size: 'Size',
    drink: 'Drink',
    extras: 'Extras',
    removals: 'Removals',
    custom: 'Custom',
    customOptions: 'Custom Options',
    required: 'Required',
    optional: 'Optional',
    singleChoice: 'Single Choice',
    multipleChoice: 'Multiple Choice',
    choiceName: 'Choice Name',
    addChoice: 'Add Choice',
    newChoice: 'New Choice',
    options: 'Options',
    livePreview: 'Live Preview',
    heroInfoBlock: 'Store Info',
    storefrontPreview: 'Storefront Preview',
    sampleItem: 'Sample Item',
    sampleDescription: 'Tap to edit this item.',
    newItem: 'New Item',
    category: 'Category',
    untitledCategory: 'Untitled Category',
    itemsIn: 'Items in',
    preview: 'Preview',
    builder: 'Builder',
    dashboard: 'Dashboard',
    flyers: 'Flyers',
    orders: 'Orders',
  },
  es: {
    eyebrow: 'CONSTRUCTOR MENUFLOW',
    title: 'Construye Tu Tienda',
    subtitle: 'Crea la tienda, el menú, las opciones y la experiencia en vivo desde un solo lugar.',
    openStore: 'Abrir Tienda',
    saveBuilder: 'Guardar Constructor',
    saving: 'Guardando...',
    loading: 'Cargando constructor...',
    couldNotLoad: 'No se pudo cargar el constructor.',
    couldNotSave: 'No se pudo guardar el constructor.',
    builderSaved: 'Constructor guardado.',
    couldNotUploadHero: 'No se pudo subir la imagen hero.',
    couldNotUploadLogo: 'No se pudo subir el logo.',
    couldNotUploadItem: 'No se pudo subir la imagen del producto.',
    storeSetup: 'Configuración',
    branding: 'Branding',
    settings: 'Ajustes',
    categoryBuilder: 'Categorías',
    itemBuilder: 'Constructor de Producto',
    optionGroups: 'Grupos de Opciones',
    storeName: 'Nombre del Negocio',
    slug: 'Slug',
    phone: 'Teléfono',
    address: 'Dirección',
    liveUrl: 'URL en vivo',
    uploadHeroImage: 'Subir Imagen Hero',
    uploadLogo: 'Subir Logo',
    uploadItemImage: 'Subir Imagen del Producto',
    heroPreview: 'Vista previa hero',
    logoPreview: 'Vista previa logo',
    itemPreview: 'Vista previa del producto',
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
    addCategory: 'Agregar Categoría',
    categoryName: 'Nombre de Categoría',
    addItem: 'Agregar Producto',
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
    noOptionGroups: 'Todavía no hay grupos de opciones.',
    protein: 'Proteína',
    size: 'Tamaño',
    drink: 'Bebida',
    extras: 'Extras',
    removals: 'Quitar',
    custom: 'Personalizado',
    customOptions: 'Opciones Personalizadas',
    required: 'Requerido',
    optional: 'Opcional',
    singleChoice: 'Una Opción',
    multipleChoice: 'Múltiples Opciones',
    choiceName: 'Nombre de Opción',
    addChoice: 'Agregar Opción',
    newChoice: 'Nueva Opción',
    options: 'Opciones',
    livePreview: 'Vista en Vivo',
    heroInfoBlock: 'Información de Tienda',
    storefrontPreview: 'Vista previa de la tienda',
    sampleItem: 'Producto de Ejemplo',
    sampleDescription: 'Toca para editar este producto.',
    newItem: 'Nuevo Producto',
    category: 'Categoría',
    untitledCategory: 'Categoría sin nombre',
    itemsIn: 'Productos en',
    preview: 'Vista',
    builder: 'Constructor',
    dashboard: 'Panel',
    flyers: 'Flyers',
    orders: 'Pedidos',
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
  const starterCategoryId = uid('cat');
  const starterItemId = uid('item');

  return [
    {
      id: starterCategoryId,
      name: 'Featured',
      sort_order: 0,
      items: [
        {
          id: starterItemId,
          category_id: starterCategoryId,
          name: copy.sampleItem,
          base_price: '12',
          description: copy.sampleDescription,
          image_url: '',
          availability: 'available',
          option_groups: [],
        },
      ],
    },
  ];
}

export default function OwnerBuilderPage() {
  const router = useRouter();
  const previewShellRef = useRef<HTMLDivElement | null>(null);

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
  const [previewItemId, setPreviewItemId] = useState('');
  const [mobileView, setMobileView] = useState<'builder' | 'preview'>('builder');
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    store: true,
    branding: true,
    settings: true,
    categories: true,
    items: true,
    options: true,
  });
  const [placeholderMap, setPlaceholderMap] = useState<Record<string, string[]>>({});

  const copy = COPY[builderLanguage];
  const normalizedSlug = useMemo(() => slugify(slug), [slug]);
  const previewLink = normalizedSlug ? `/store/${normalizedSlug}` : '';

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('menuflow_builder_language') : null;
    if (stored === 'en' || stored === 'es') {
      setBuilderLanguage(stored);
    }
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

          for (const file of data || []) {
            if (!file.name || file.name.startsWith('.')) continue;
            const { data: publicUrlData } = supabase.storage.from(PLACEHOLDER_BUCKET).getPublicUrl(`${folder}/${file.name}`);
            if (publicUrlData?.publicUrl) {
              urls.push(publicUrlData.publicUrl);
            }
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
          setSlug(row.slug || '');
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
          await loadMenuBuilder(currentRestaurantId);
        } else {
          const starter = getEmptyStarter(COPY[builderLanguage]);
          if (!active) return;
          setCategories(starter);
          setSelectedCategoryId(starter[0].id);
          setSelectedItemId(starter[0].items[0].id);
          setPreviewItemId(starter[0].items[0].id);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || COPY[builderLanguage].couldNotLoad);
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadMenuBuilder(currentRestaurantId: string) {
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

      const itemRows = (itemData || []) as ItemRow[];
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
        groupData = (groups || []) as OptionGroupRow[];

        const groupIds = groupData.map((group) => group.id);

        if (groupIds.length) {
          const { data: choices, error: choiceError } = await supabase
            .from('menu_option_choices')
            .select('id, option_group_id, name, price, price_delta, sort_order')
            .in('option_group_id', groupIds)
            .order('sort_order', { ascending: true });

          if (choiceError) throw choiceError;
          choiceData = (choices || []) as OptionChoiceRow[];
        }
      }

      if (!active) return;

      const mappedCategories: BuilderCategory[] = ((categoryData || []) as CategoryRow[]).map((category, categoryIndex) => {
        const categoryItems: BuilderItem[] = itemRows
          .filter((item) => item.category_id === category.id)
          .map((item) => {
            const groups: BuilderOptionGroup[] = groupData
              .filter((group) => group.item_id === item.id)
              .map((group) => ({
                id: group.id,
                name: group.name || COPY[builderLanguage].options,
                presetType: 'custom',
                required: !!group.is_required,
                selection: normalizeSelectionMode(group),
                options: choiceData
                  .filter((choice) => choice.option_group_id === group.id)
                  .map((choice) => ({
                    id: choice.id,
                    name: choice.name || COPY[builderLanguage].newChoice,
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
          name: category.name || `${COPY[builderLanguage].category} ${categoryIndex + 1}`,
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
        setPreviewItemId(firstItem?.id || '');
      } else {
        const starter = getEmptyStarter(COPY[builderLanguage]);
        setCategories(starter);
        setSelectedCategoryId(starter[0].id);
        setSelectedItemId(starter[0].items[0].id);
        setPreviewItemId(starter[0].items[0].id);
      }
    }

    void loadBuilder();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!categories.length) return;

    const selectedCategoryStillExists = categories.some((category) => category.id === selectedCategoryId);
    const allItems = categories.flatMap((category) => category.items);
    const selectedItemStillExists = allItems.some((item) => item.id === selectedItemId);
    const previewItemStillExists = allItems.some((item) => item.id === previewItemId);

    if (!selectedCategoryStillExists) {
      const firstCategory = categories[0];
      setSelectedCategoryId(firstCategory.id);
      setSelectedItemId(firstCategory.items[0]?.id || '');
      setPreviewItemId(firstCategory.items[0]?.id || '');
      return;
    }

    if (!selectedItemStillExists) {
      const currentCategory = categories.find((category) => category.id === selectedCategoryId) || categories[0];
      setSelectedItemId(currentCategory.items[0]?.id || '');
    }

    if (!previewItemStillExists) {
      const currentCategory = categories.find((category) => category.id === selectedCategoryId) || categories[0];
      setPreviewItemId(currentCategory.items[0]?.id || '');
    }
  }, [categories, selectedCategoryId, selectedItemId, previewItemId]);

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

  function toggleSection(section: SectionKey) {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

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

  function selectCategory(categoryId: string) {
    const category = categories.find((entry) => entry.id === categoryId);
    setSelectedCategoryId(categoryId);
    const firstItem = category?.items[0] || null;
    setSelectedItemId(firstItem?.id || '');
    setPreviewItemId(firstItem?.id || '');
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
      name: `${copy.category} ${categories.length + 1}`,
      sort_order: categories.length,
      items: [
        {
          id: newItemId,
          category_id: newCategoryId,
          name: copy.newItem,
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
    setExpandedSections((current) => ({ ...current, categories: true, items: true }));
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
                  name: copy.newItem,
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
    setExpandedSections((current) => ({ ...current, items: true }));
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
    const groupId = uid('group');
    const optionSeed = getPresetOptions(presetType);

    const presetMap: Record<BuilderOptionGroup['presetType'], string> = {
      protein: copy.protein,
      size: copy.size,
      drink: copy.drink,
      extras: copy.extras,
      removals: copy.removals,
      custom: copy.customOptions,
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

    setExpandedSections((current) => ({ ...current, options: true }));
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
        slug: normalizedSlug || null,
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

      const existingCategoryIds = (existingCategories || []).map((row) => row.id);
      const existingItemIds = (existingItems || []).map((row) => row.id);

      let existingGroupIds: string[] = [];

      if (existingItemIds.length) {
        const { data: existingGroups, error: existingGroupsError } = await supabase
          .from('menu_option_groups')
          .select('id')
          .in('item_id', existingItemIds);

        if (existingGroupsError) throw existingGroupsError;
        existingGroupIds = (existingGroups || []).map((row) => row.id);
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
        name: category.name.trim() || `${copy.category} ${categoryIndex + 1}`,
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
          image_url: (getResolvedItemImage(item) || '').trim() || null,
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
            name: group.name.trim() || copy.options,
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

      setSuccess(copy.builderSaved);
    } catch (err: any) {
      setError(err?.message || copy.couldNotSave);
    } finally {
      setSaving(false);
    }
  }

  const previewThemeClass = theme === 'dark' ? 'previewPhone previewDark' : 'previewPhone previewLight';

  function BottomNav() {
    return (
      <div className="bottomNav">
        <button type="button" className="bottomNavItem">
          <span className="bottomDot" />
          <span>{copy.dashboard}</span>
        </button>
        <button type="button" className="bottomNavItem bottomNavItemActive">
          <span className="bottomDot" />
          <span>{copy.builder}</span>
        </button>
        <button type="button" className="bottomNavItem" onClick={() => setMobileView('preview')}>
          <span className="bottomDot" />
          <span>{copy.preview}</span>
        </button>
        <button type="button" className="bottomNavItem">
          <span className="bottomDot" />
          <span>{copy.flyers}</span>
        </button>
        <button type="button" className="bottomNavItem">
          <span className="bottomDot" />
          <span>{copy.orders}</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="page">
        <section className="shell">
          <div className="loadingWrap">
            <div className="eyebrow">{copy.eyebrow}</div>
            <h1>{copy.loading}</h1>
          </div>

          <style jsx>{`
            .page {
              min-height: 100vh;
              background: #f3f2ee;
              padding: 18px;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .shell {
              max-width: 1500px;
              margin: 0 auto;
            }
            .loadingWrap {
              background: #ffffff;
              border: 1px solid rgba(14, 23, 43, 0.08);
              border-radius: 34px;
              padding: 28px;
              box-shadow: 0 24px 60px rgba(15, 23, 42, 0.05);
            }
            .eyebrow {
              color: #7d8596;
              font-size: 13px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              margin-bottom: 12px;
            }
            h1 {
              margin: 0;
              color: #0e1730;
              font-size: clamp(34px, 6vw, 64px);
              line-height: 0.96;
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
        <div className="topBar">
          <div className="topBarLeft">
            <div className="eyebrow">{copy.eyebrow}</div>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>

          <div className="topBarRight">
            <div className="languageSwitch">
              <button
                type="button"
                className={builderLanguage === 'en' ? 'langButton langButtonActive' : 'langButton'}
                onClick={() => setBuilderLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={builderLanguage === 'es' ? 'langButton langButtonActive' : 'langButton'}
                onClick={() => setBuilderLanguage('es')}
              >
                ES
              </button>
            </div>

            {previewLink ? (
              <Link href={previewLink} target="_blank" className="ghostButton">
                {copy.openStore}
              </Link>
            ) : (
              <button type="button" className="ghostButton" disabled>
                {copy.openStore}
              </button>
            )}

            <button type="button" className="primaryButton" onClick={handleSave} disabled={saving}>
              {saving ? copy.saving : copy.saveBuilder}
            </button>
          </div>
        </div>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <div className="builderGrid">
          <section className="previewStage">
            <div className="previewStageHeader">
              <div>
                <div className="sectionEyebrow">{copy.livePreview}</div>
                <div className="previewTitle">{name.trim() || 'Your Store'}</div>
              </div>

              <div className="mobileViewSwitch">
                <button
                  type="button"
                  className={mobileView === 'builder' ? 'mobileSwitchButton mobileSwitchButtonActive' : 'mobileSwitchButton'}
                  onClick={() => setMobileView('builder')}
                >
                  {copy.builder}
                </button>
                <button
                  type="button"
                  className={mobileView === 'preview' ? 'mobileSwitchButton mobileSwitchButtonActive' : 'mobileSwitchButton'}
                  onClick={() => setMobileView('preview')}
                >
                  {copy.preview}
                </button>
              </div>
            </div>

            <div className="previewHeroWide">
              {heroImage ? <img src={heroImage} alt="Hero" className="previewHeroWideImage" /> : <div className="previewHeroWideFallback" />}
              <div className="previewHeroShade" />
              <div className="previewHeroWideContent">
                <div className="previewHeroWideBrand">
                  {logoImage ? (
                    <img src={logoImage} alt="Logo" className="previewHeroWideLogo" />
                  ) : (
                    <div className="previewHeroWideLogoFallback">{(name.trim() || 'M').charAt(0).toUpperCase()}</div>
                  )}

                  <div className="previewHeroWideText">
                    <div className="previewHeroWideName">{name.trim() || 'Your Store'}</div>
                    <div className="previewHeroWideSub">{copy.storefrontPreview}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="topWideInfo">
              <div className="topWideInfoCard">
                <span>{copy.address}</span>
                <strong>{address.trim() || '123 Main St'}</strong>
              </div>
              <div className="topWideInfoCard">
                <span>{copy.phone}</span>
                <strong>{phone.trim() || '3235553355'}</strong>
              </div>
              <div className="topWideInfoCard">
                <span>{copy.storefrontTheme}</span>
                <strong>{theme === 'dark' ? copy.dark : copy.light}</strong>
              </div>
            </div>
          </section>

          <div className="contentGrid">
            <section className={mobileView === 'preview' ? 'leftPanel leftPanelHiddenMobile' : 'leftPanel'}>
              <div className="mobileBuilderPhone">
                <div className="phoneChrome">
                  <div className="phoneStatus" />
                  <div className="phoneTop">
                    <div>
                      <div className="phoneEyebrow">{copy.eyebrow}</div>
                      <div className="phoneTitle">{copy.title}</div>
                    </div>
                    <button type="button" className="phoneSave" onClick={handleSave} disabled={saving}>
                      {saving ? copy.saving : copy.saveBuilder}
                    </button>
                  </div>

                  <div className="builderScroll">
                    <section className="builderCard">
                      <button type="button" className="builderCardHeader" onClick={() => toggleSection('store')}>
                        <div>
                          <div className="builderCardEyebrow">01</div>
                          <div className="builderCardTitle">{copy.storeSetup}</div>
                        </div>
                        <div className="builderCardToggle">{expandedSections.store ? '−' : '+'}</div>
                      </button>

                      {expandedSections.store ? (
                        <div className="builderCardBody">
                          <label className="field">
                            <span className="label">{copy.storeName}</span>
                            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Restaurant" />
                          </label>

                          <label className="field">
                            <span className="label">{copy.slug}</span>
                            <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="your-store" />
                            <span className="helpText">
                              {copy.liveUrl}: /store/{normalizedSlug || 'your-store'}
                            </span>
                          </label>

                          <label className="field">
                            <span className="label">{copy.phone}</span>
                            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3235553355" />
                          </label>

                          <label className="field">
                            <span className="label">{copy.address}</span>
                            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
                          </label>
                        </div>
                      ) : null}
                    </section>

                    <section className="builderCard">
                      <button type="button" className="builderCardHeader" onClick={() => toggleSection('branding')}>
                        <div>
                          <div className="builderCardEyebrow">02</div>
                          <div className="builderCardTitle">{copy.branding}</div>
                        </div>
                        <div className="builderCardToggle">{expandedSections.branding ? '−' : '+'}</div>
                      </button>

                      {expandedSections.branding ? (
                        <div className="builderCardBody">
                          <div className="uploadStack">
                            <div className="uploadMiniCard">
                              <div className="uploadMiniTitle">{copy.uploadHeroImage}</div>
                              <label className="uploadButton">
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
                              {heroImage ? <img src={heroImage} alt="Hero" className="uploadPreview" /> : <div className="uploadPlaceholder">{copy.heroPreview}</div>}
                            </div>

                            <div className="uploadMiniCard">
                              <div className="uploadMiniTitle">{copy.uploadLogo}</div>
                              <label className="uploadButton">
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
                              {logoImage ? <img src={logoImage} alt="Logo" className="uploadPreview logoPreview" /> : <div className="uploadPlaceholder">{copy.logoPreview}</div>}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </section>

                    <section className="builderCard">
                      <button type="button" className="builderCardHeader" onClick={() => toggleSection('settings')}>
                        <div>
                          <div className="builderCardEyebrow">03</div>
                          <div className="builderCardTitle">{copy.settings}</div>
                        </div>
                        <div className="builderCardToggle">{expandedSections.settings ? '−' : '+'}</div>
                      </button>

                      {expandedSections.settings ? (
                        <div className="builderCardBody">
                          <div className="controlBlock">
                            <div className="label">{copy.builderLanguage}</div>
                            <div className="toggleRow">
                              <button
                                type="button"
                                className={builderLanguage === 'en' ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setBuilderLanguage('en')}
                              >
                                {copy.english}
                              </button>
                              <button
                                type="button"
                                className={builderLanguage === 'es' ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setBuilderLanguage('es')}
                              >
                                {copy.spanish}
                              </button>
                            </div>
                          </div>

                          <div className="controlBlock">
                            <div className="label">{copy.storefrontLanguage}</div>
                            <div className="toggleRow">
                              <button
                                type="button"
                                className={storefrontLanguage === 'en' ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setStorefrontLanguage('en')}
                              >
                                EN
                              </button>
                              <button
                                type="button"
                                className={storefrontLanguage === 'es' ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setStorefrontLanguage('es')}
                              >
                                ES
                              </button>
                            </div>
                          </div>

                          <div className="controlBlock">
                            <div className="label">{copy.orderLanguage}</div>
                            <div className="toggleRow">
                              <button
                                type="button"
                                className={orderLanguage === 'en' ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setOrderLanguage('en')}
                              >
                                EN
                              </button>
                              <button
                                type="button"
                                className={orderLanguage === 'es' ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setOrderLanguage('es')}
                              >
                                ES
                              </button>
                            </div>
                          </div>

                          <div className="controlBlock">
                            <div className="label">{copy.storefrontTheme}</div>
                            <div className="toggleRow">
                              <button
                                type="button"
                                className={theme === 'light' ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setTheme('light')}
                              >
                                {copy.light}
                              </button>
                              <button
                                type="button"
                                className={theme === 'dark' ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setTheme('dark')}
                              >
                                {copy.dark}
                              </button>
                            </div>
                          </div>

                          <div className="controlBlock">
                            <div className="label">Pickup / Delivery</div>
                            <div className="toggleRow">
                              <button
                                type="button"
                                className={pickupEnabled ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setPickupEnabled((current) => !current)}
                              >
                                {pickupEnabled ? copy.pickupOn : copy.pickupOff}
                              </button>
                              <button
                                type="button"
                                className={deliveryEnabled ? 'toggleButton toggleActive' : 'toggleButton'}
                                onClick={() => setDeliveryEnabled((current) => !current)}
                              >
                                {deliveryEnabled ? copy.deliveryOn : copy.deliveryOff}
                              </button>
                            </div>
                          </div>

                          <div className="fieldGrid">
                            <label className="field">
                              <span className="label">{copy.deliveryFee}</span>
                              <input
                                className="input"
                                value={deliveryFee}
                                onChange={(e) => setDeliveryFee(sanitizeNumberInput(e.target.value))}
                                placeholder="5"
                              />
                            </label>

                            <label className="field">
                              <span className="label">{copy.deliveryRadius}</span>
                              <input
                                className="input"
                                value={deliveryRadius}
                                onChange={(e) => setDeliveryRadius(sanitizeNumberInput(e.target.value))}
                                placeholder="5"
                              />
                            </label>

                            <label className="field">
                              <span className="label">{copy.deliveryMinimum}</span>
                              <input
                                className="input"
                                value={deliveryMinimum}
                                onChange={(e) => setDeliveryMinimum(sanitizeNumberInput(e.target.value))}
                                placeholder="20"
                              />
                            </label>
                          </div>
                        </div>
                      ) : null}
                    </section>

                    <section className="builderCard">
                      <button type="button" className="builderCardHeader" onClick={() => toggleSection('categories')}>
                        <div>
                          <div className="builderCardEyebrow">04</div>
                          <div className="builderCardTitle">{copy.categoryBuilder}</div>
                        </div>
                        <div className="builderCardToggle">{expandedSections.categories ? '−' : '+'}</div>
                      </button>

                      {expandedSections.categories ? (
                        <div className="builderCardBody">
                          <button type="button" className="primaryButton fullWidthButton" onClick={addCategory}>
                            {copy.addCategory}
                          </button>

                          <div className="categoryStack">
                            {categories.map((category) => (
                              <div
                                key={category.id}
                                className={category.id === selectedCategoryId ? 'categoryPillCard categoryPillCardActive' : 'categoryPillCard'}
                              >
                                <button type="button" className="categoryPillSelect" onClick={() => selectCategory(category.id)}>
                                  <span>{category.name || copy.untitledCategory}</span>
                                  <span className="categoryPillCount">{category.items.length}</span>
                                </button>

                                <div className="categoryEditBlock">
                                  <input
                                    className="input compactInput"
                                    value={category.name}
                                    onChange={(e) => updateCategory(category.id, e.target.value)}
                                    placeholder={copy.categoryName}
                                  />
                                  <button type="button" className="dangerButton" onClick={() => deleteCategory(category.id)}>
                                    {copy.delete}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </section>

                    {selectedCategory ? (
                      <section className="builderCard">
                        <button type="button" className="builderCardHeader" onClick={() => toggleSection('items')}>
                          <div>
                            <div className="builderCardEyebrow">05</div>
                            <div className="builderCardTitle">
                              {copy.itemsIn} {selectedCategory.name || copy.category}
                            </div>
                          </div>
                          <div className="builderCardToggle">{expandedSections.items ? '−' : '+'}</div>
                        </button>

                        {expandedSections.items ? (
                          <div className="builderCardBody">
                            <button type="button" className="primaryButton fullWidthButton" onClick={() => addItem(selectedCategory.id)}>
                              {copy.addItem}
                            </button>

                            <div className="visualItemGrid">
                              {selectedCategory.items.map((item) => {
                                const resolvedImage = getResolvedItemImage(item);

                                return (
                                  <button
                                    type="button"
                                    key={item.id}
                                    className={item.id === selectedItemId ? 'visualItemCard visualItemCardActive' : 'visualItemCard'}
                                    onClick={() => selectItem(item.id)}
                                  >
                                    <div className="visualItemImageWrap">
                                      {resolvedImage ? <img src={resolvedImage} alt={item.name} className="visualItemImage" /> : <div className="visualItemFallback" />}
                                    </div>
                                    <div className="visualItemInfo">
                                      <div className="visualItemName">{item.name || copy.itemNameFallback}</div>
                                      <div className="visualItemPrice">{money(item.base_price)}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {selectedItem ? (
                              <div className="itemEditorPanel">
                                <div className="itemEditorTop">
                                  <div className="itemEditorTitle">{copy.itemBuilder}</div>
                                  <button
                                    type="button"
                                    className="dangerButton"
                                    onClick={() => deleteItem(selectedItem.category_id, selectedItem.id)}
                                  >
                                    {copy.deleteItem}
                                  </button>
                                </div>

                                <div className="uploadMiniCard">
                                  <div className="uploadMiniTitle">{copy.uploadItemImage}</div>
                                  <label className="uploadButton">
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

                                  {getResolvedItemImage(selectedItem) ? (
                                    <img src={getResolvedItemImage(selectedItem)} alt={selectedItem.name} className="uploadPreview" />
                                  ) : (
                                    <div className="uploadPlaceholder">{copy.itemPreview}</div>
                                  )}
                                </div>

                                <label className="field">
                                  <span className="label">{copy.itemName}</span>
                                  <input
                                    className="input"
                                    value={selectedItem.name}
                                    onChange={(e) => updateItem(selectedItem.id, { name: e.target.value })}
                                    placeholder={copy.itemName}
                                  />
                                </label>

                                <label className="field">
                                  <span className="label">{copy.basePrice}</span>
                                  <input
                                    className="input"
                                    value={selectedItem.base_price}
                                    onChange={(e) => updateItem(selectedItem.id, { base_price: sanitizeNumberInput(e.target.value) })}
                                    placeholder="12.99"
                                  />
                                </label>

                                <label className="field">
                                  <span className="label">{copy.description}</span>
                                  <textarea
                                    className="textarea"
                                    value={selectedItem.description}
                                    onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })}
                                    placeholder={copy.describeItem}
                                  />
                                </label>

                                <div className="field">
                                  <span className="label">{copy.availability}</span>
                                  <div className="toggleRow">
                                    <button
                                      type="button"
                                      className={selectedItem.availability === 'available' ? 'toggleButton toggleActive' : 'toggleButton'}
                                      onClick={() => updateItem(selectedItem.id, { availability: 'available' })}
                                    >
                                      {copy.available}
                                    </button>
                                    <button
                                      type="button"
                                      className={selectedItem.availability === 'sold_out' ? 'toggleButton toggleActive' : 'toggleButton'}
                                      onClick={() => updateItem(selectedItem.id, { availability: 'sold_out' })}
                                    >
                                      {copy.soldOut}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </section>
                    ) : null}

                    {selectedItem ? (
                      <section className="builderCard">
                        <button type="button" className="builderCardHeader" onClick={() => toggleSection('options')}>
                          <div>
                            <div className="builderCardEyebrow">06</div>
                            <div className="builderCardTitle">{copy.optionGroups}</div>
                          </div>
                          <div className="builderCardToggle">{expandedSections.options ? '−' : '+'}</div>
                        </button>

                        {expandedSections.options ? (
                          <div className="builderCardBody">
                            <div className="optionActionWrap">
                              <button type="button" className="ghostTiny" onClick={() => addOptionGroup(selectedItem.id, 'protein')}>
                                {copy.protein}
                              </button>
                              <button type="button" className="ghostTiny" onClick={() => addOptionGroup(selectedItem.id, 'size')}>
                                {copy.size}
                              </button>
                              <button type="button" className="ghostTiny" onClick={() => addOptionGroup(selectedItem.id, 'drink')}>
                                {copy.drink}
                              </button>
                              <button type="button" className="ghostTiny" onClick={() => addOptionGroup(selectedItem.id, 'extras')}>
                                {copy.extras}
                              </button>
                              <button type="button" className="ghostTiny" onClick={() => addOptionGroup(selectedItem.id, 'removals')}>
                                {copy.removals}
                              </button>
                              <button type="button" className="ghostTiny" onClick={() => addOptionGroup(selectedItem.id, 'custom')}>
                                {copy.custom}
                              </button>
                            </div>

                            <div className="optionGroupList">
                              {selectedItem.option_groups.length ? (
                                selectedItem.option_groups.map((group) => (
                                  <div key={group.id} className="optionGroupCard">
                                    <div className="optionGroupTop">
                                      <input
                                        className="input compactInput"
                                        value={group.name}
                                        onChange={(e) => updateOptionGroup(selectedItem.id, group.id, { name: e.target.value })}
                                        placeholder={copy.options}
                                      />

                                      <button type="button" className="dangerButton" onClick={() => deleteOptionGroup(selectedItem.id, group.id)}>
                                        {copy.delete}
                                      </button>
                                    </div>

                                    <div className="toggleRow">
                                      <button
                                        type="button"
                                        className={group.required ? 'toggleButton toggleActive' : 'toggleButton'}
                                        onClick={() => updateOptionGroup(selectedItem.id, group.id, { required: !group.required })}
                                      >
                                        {group.required ? copy.required : copy.optional}
                                      </button>

                                      <button
                                        type="button"
                                        className={group.selection === 'single' ? 'toggleButton toggleActive' : 'toggleButton'}
                                        onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'single' })}
                                      >
                                        {copy.singleChoice}
                                      </button>

                                      <button
                                        type="button"
                                        className={group.selection === 'multiple' ? 'toggleButton toggleActive' : 'toggleButton'}
                                        onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'multiple' })}
                                      >
                                        {copy.multipleChoice}
                                      </button>
                                    </div>

                                    <div className="choiceList">
                                      {group.options.map((option) => (
                                        <div key={option.id} className="choiceRow">
                                          <input
                                            className="input compactInput"
                                            value={option.name}
                                            onChange={(e) =>
                                              updateOptionChoice(selectedItem.id, group.id, option.id, { name: e.target.value })
                                            }
                                            placeholder={copy.choiceName}
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
                                            {copy.delete}
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    <button type="button" className="primaryButton fullWidthButton" onClick={() => addOptionChoice(selectedItem.id, group.id)}>
                                      {copy.addChoice}
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="emptyBlock">{copy.noOptionGroups}</div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </section>
                    ) : null}
                  </div>

                  <BottomNav />
                </div>
              </div>
            </section>

            <section className={mobileView === 'builder' ? 'rightPanel rightPanelMobileHidden' : 'rightPanel'}>
              <div className="previewDeviceWrap" ref={previewShellRef}>
                <div className="deviceFrame">
                  <div className="deviceNotch" />
                  <div className={previewThemeClass}>
                    <div className="previewHero">
                      {heroImage ? <img src={heroImage} alt="Hero" className="previewHeroImage" /> : <div className="previewHeroFallback" />}
                      <div className="previewOverlay" />
                      <div className="previewHeroContent">
                        <div className="previewBrandRow">
                          {logoImage ? (
                            <img src={logoImage} alt="Logo" className="previewLogo" />
                          ) : (
                            <div className="previewLogoFallback">{(name.trim() || 'M').charAt(0).toUpperCase()}</div>
                          )}

                          <div>
                            <div className="previewName">{name.trim() || 'Your Store'}</div>
                            <div className="previewTag">{copy.storefrontPreview}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="previewInfoBand">
                      <div className="previewInfoTitle">{copy.heroInfoBlock}</div>
                      <div className="previewInfoGrid">
                        <div className="previewInfoCell">
                          <span>{copy.address}</span>
                          <strong>{address.trim() || '123 Main St'}</strong>
                        </div>
                        <div className="previewInfoCell">
                          <span>{copy.phone}</span>
                          <strong>{phone.trim() || '3235553355'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="previewContent">
                      <div className="previewTopMeta">
                        <div className="previewMetaPill">{pickupEnabled ? copy.pickupOn : copy.pickupOff}</div>
                        <div className="previewMetaPill">{deliveryEnabled ? copy.deliveryOn : copy.deliveryOff}</div>
                        <div className="previewMetaPill">{theme === 'dark' ? copy.dark : copy.light}</div>
                      </div>

                      <div className="previewCategoryTabs">
                        {categories.map((category) => (
                          <button
                            type="button"
                            key={category.id}
                            className={category.id === selectedCategoryId ? 'previewCategoryTab previewCategoryTabActive' : 'previewCategoryTab'}
                            onClick={() => selectCategory(category.id)}
                          >
                            {category.name || copy.category}
                          </button>
                        ))}
                      </div>

                      <div className="previewGrid">
                        {(selectedCategory?.items || []).map((item) => {
                          const resolvedImage = getResolvedItemImage(item);

                          return (
                            <button
                              type="button"
                              key={item.id}
                              className={item.id === previewItemId ? 'previewGridCard previewGridCardActive' : 'previewGridCard'}
                              onClick={() => setPreviewItemId(item.id)}
                            >
                              {resolvedImage ? <img src={resolvedImage} alt={item.name} className="previewGridImage" /> : <div className="previewGridFallback" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {previewItem ? (
                      <div className="previewPopup">
                        <div className="previewPopupImageWrap">
                          {getResolvedItemImage(previewItem) ? (
                            <img src={getResolvedItemImage(previewItem)} alt={previewItem.name} className="previewPopupImage" />
                          ) : (
                            <div className="previewPopupFallback" />
                          )}
                        </div>

                        <div className="previewPopupBody">
                          <div className="previewPopupHeaderRow">
                            <div className="previewPopupName">{previewItem.name || copy.itemNameFallback}</div>
                            <div className="previewPopupPrice">{money(previewItem.base_price)}</div>
                          </div>

                          <div className="previewPopupDescription">{previewItem.description || copy.describeItem}</div>

                          {previewItem.option_groups.length ? (
                            <div className="previewOptionsWrap">
                              {previewItem.option_groups.map((group) => (
                                <div key={group.id} className="previewOptionGroup">
                                  <div className="previewOptionHeader">
                                    <span>{group.name}</span>
                                    <span>{group.required ? copy.required : copy.optional}</span>
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

                          <button type="button" className="previewAddToCart">
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f3f2ee;
          padding: 18px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .shell {
          max-width: 1550px;
          margin: 0 auto;
        }

        .topBar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 16px;
        }

        .topBarLeft {
          min-width: 0;
        }

        .eyebrow {
          color: #7d8596;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        h1 {
          margin: 0;
          color: #0e1730;
          font-size: clamp(38px, 7vw, 68px);
          line-height: 0.92;
          letter-spacing: -0.06em;
          font-weight: 900;
        }

        p {
          margin: 14px 0 0;
          color: #667081;
          font-size: 17px;
          line-height: 1.5;
          font-weight: 800;
          max-width: 760px;
        }

        .topBarRight {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .languageSwitch {
          display: inline-flex;
          gap: 8px;
          padding: 6px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.08);
          box-shadow: inset 0 0 0 1px rgba(14, 23, 48, 0.02);
        }

        .langButton {
          min-width: 72px;
          min-height: 46px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: #7a8396;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }

        .langButtonActive {
          background: #000000;
          color: #ffffff;
        }

        .primaryButton,
        .ghostButton,
        .uploadButton,
        .toggleButton,
        .dangerButton,
        .ghostTiny,
        .mobileSwitchButton,
        .phoneSave {
          min-height: 52px;
          border-radius: 18px;
          font-size: 15px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: 0.16s ease;
        }

        .primaryButton {
          padding: 0 20px;
          background: #000000;
          color: #ffffff;
        }

        .ghostButton {
          padding: 0 20px;
          background: #ffffff;
          color: #0e1730;
          border: 1px solid rgba(14, 23, 48, 0.1);
        }

        .ghostButton:disabled,
        .primaryButton:disabled,
        .uploadButton:disabled,
        .phoneSave:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .fullWidthButton {
          width: 100%;
        }

        .message {
          margin-bottom: 14px;
          border-radius: 20px;
          padding: 14px 16px;
          font-size: 15px;
          font-weight: 800;
        }

        .error {
          color: #9a1f1f;
          background: #f8e9e9;
          border: 1px solid rgba(154, 31, 31, 0.12);
        }

        .success {
          color: #165534;
          background: #eaf5ee;
          border: 1px solid rgba(22, 85, 52, 0.1);
        }

        .builderGrid {
          display: grid;
          gap: 18px;
        }

        .previewStage {
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.07);
          border-radius: 34px;
          padding: 18px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.04);
        }

        .previewStageHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .sectionEyebrow {
          color: #7d8596;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .previewTitle {
          color: #0e1730;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .mobileViewSwitch {
          display: inline-flex;
          background: #f3f2ee;
          padding: 6px;
          border-radius: 999px;
          gap: 6px;
        }

        .mobileSwitchButton {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          background: transparent;
          color: #5f6b7d;
        }

        .mobileSwitchButtonActive {
          background: #000000;
          color: #ffffff;
        }

        .previewHeroWide {
          position: relative;
          min-height: 280px;
          border-radius: 28px;
          overflow: hidden;
          background: #0f0f0f;
        }

        .previewHeroWideImage,
        .previewHeroWideFallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: linear-gradient(135deg, #171717 0%, #3b3b3b 100%);
        }

        .previewHeroShade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.68) 100%);
        }

        .previewHeroWideContent {
          position: relative;
          z-index: 2;
          min-height: 280px;
          display: flex;
          align-items: end;
          padding: 20px;
        }

        .previewHeroWideBrand {
          display: flex;
          align-items: end;
          gap: 16px;
        }

        .previewHeroWideLogo,
        .previewHeroWideLogoFallback {
          width: 82px;
          height: 82px;
          border-radius: 24px;
          object-fit: cover;
          background: #ffffff;
          color: #0e1730;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 900;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.15);
        }

        .previewHeroWideName {
          color: #ffffff;
          font-size: clamp(34px, 6vw, 62px);
          line-height: 0.92;
          letter-spacing: -0.06em;
          font-weight: 900;
        }

        .previewHeroWideSub {
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.92);
          font-size: 15px;
          font-weight: 800;
        }

        .topWideInfo {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .topWideInfoCard {
          border-radius: 22px;
          padding: 16px;
          background: #f7f6f2;
          border: 1px solid rgba(14, 23, 48, 0.06);
          display: grid;
          gap: 6px;
        }

        .topWideInfoCard span {
          color: #7d8596;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .topWideInfoCard strong {
          color: #0e1730;
          font-size: 15px;
          font-weight: 900;
          line-height: 1.35;
        }

        .contentGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.95fr);
          gap: 18px;
          align-items: start;
        }

        .leftPanel,
        .rightPanel {
          min-width: 0;
        }

        .mobileBuilderPhone {
          background: transparent;
        }

        .phoneChrome {
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.07);
          border-radius: 36px;
          padding: 14px 14px 94px;
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.05);
          position: relative;
          min-height: 920px;
        }

        .phoneStatus {
          width: 120px;
          height: 8px;
          border-radius: 999px;
          background: #141414;
          margin: 2px auto 14px;
        }

        .phoneTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
          padding: 0 4px;
        }

        .phoneEyebrow {
          color: #7d8596;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .phoneTitle {
          color: #0e1730;
          font-size: 30px;
          line-height: 0.96;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .phoneSave {
          padding: 0 16px;
          background: #000000;
          color: #ffffff;
          min-height: 44px;
          border-radius: 16px;
          flex-shrink: 0;
        }

        .builderScroll {
          display: grid;
          gap: 14px;
          align-content: start;
        }

        .builderCard {
          border-radius: 28px;
          background: #f8f7f3;
          border: 1px solid rgba(14, 23, 48, 0.06);
          overflow: hidden;
        }

        .builderCardHeader {
          width: 100%;
          border: none;
          background: transparent;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          text-align: left;
          cursor: pointer;
        }

        .builderCardEyebrow {
          color: #7d8596;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .builderCardTitle {
          color: #0e1730;
          font-size: 22px;
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 900;
        }

        .builderCardToggle {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.08);
          color: #0e1730;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .builderCardBody {
          padding: 0 18px 18px;
          display: grid;
          gap: 14px;
        }

        .fieldGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .label {
          color: #7d8596;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .input,
        .textarea {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(14, 23, 48, 0.1);
          background: #ffffff;
          padding: 0 16px;
          color: #0e1730;
          font-size: 16px;
          font-weight: 800;
          outline: none;
        }

        .input {
          min-height: 54px;
        }

        .textarea {
          min-height: 126px;
          padding: 16px;
          resize: vertical;
        }

        .compactInput {
          min-height: 48px;
          font-size: 15px;
        }

        .helpText {
          color: #7d8596;
          font-size: 13px;
          font-weight: 800;
        }

        .uploadStack {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .uploadMiniCard {
          border-radius: 24px;
          padding: 14px;
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.08);
          display: grid;
          gap: 12px;
        }

        .uploadMiniTitle {
          color: #0e1730;
          font-size: 15px;
          font-weight: 900;
        }

        .uploadButton {
          padding: 0 18px;
          background: #000000;
          color: #ffffff;
          width: fit-content;
        }

        .uploadPreview,
        .uploadPlaceholder {
          width: 100%;
          height: 190px;
          border-radius: 20px;
          object-fit: cover;
        }

        .uploadPlaceholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef1f5;
          color: #6e788a;
          font-size: 15px;
          font-weight: 900;
        }

        .logoPreview {
          object-fit: contain;
          background: #ffffff;
          padding: 18px;
        }

        .controlBlock {
          display: grid;
          gap: 10px;
        }

        .toggleRow,
        .optionActionWrap {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .toggleButton {
          padding: 0 18px;
          background: #ffffff;
          color: #0e1730;
          border: 1px solid rgba(14, 23, 48, 0.1);
        }

        .toggleActive {
          background: #000000;
          color: #ffffff;
          border-color: #000000;
        }

        .categoryStack,
        .optionGroupList {
          display: grid;
          gap: 12px;
        }

        .categoryPillCard {
          border-radius: 24px;
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.08);
          padding: 12px;
        }

        .categoryPillCardActive {
          border-color: rgba(14, 23, 48, 0.22);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
        }

        .categoryPillSelect {
          width: 100%;
          border: none;
          background: transparent;
          padding: 0;
          text-align: left;
          color: #0e1730;
          font-size: 18px;
          font-weight: 900;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .categoryPillCount {
          min-width: 36px;
          min-height: 36px;
          border-radius: 999px;
          background: #f3f2ee;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
        }

        .categoryEditBlock {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: 12px;
        }

        .dangerButton {
          padding: 0 14px;
          background: #f7e3e3;
          color: #9e2c2c;
          min-height: 48px;
        }

        .visualItemGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .visualItemCard {
          border-radius: 24px;
          padding: 10px;
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.08);
          text-align: left;
          cursor: pointer;
        }

        .visualItemCardActive {
          border-color: rgba(14, 23, 48, 0.22);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .visualItemImageWrap {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 18px;
          overflow: hidden;
          background: #eef1f5;
        }

        .visualItemImage,
        .visualItemFallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: linear-gradient(135deg, #e9edf2 0%, #dfe5ec 100%);
        }

        .visualItemInfo {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          padding: 10px 4px 2px;
        }

        .visualItemName {
          color: #0e1730;
          font-size: 15px;
          font-weight: 900;
          line-height: 1.1;
        }

        .visualItemPrice {
          color: #0e1730;
          font-size: 14px;
          font-weight: 900;
          white-space: nowrap;
        }

        .itemEditorPanel {
          border-radius: 24px;
          padding: 14px;
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.08);
          display: grid;
          gap: 14px;
        }

        .itemEditorTop,
        .optionGroupTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .itemEditorTitle {
          color: #0e1730;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .optionGroupCard {
          border-radius: 22px;
          padding: 14px;
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.08);
          display: grid;
          gap: 12px;
        }

        .choiceList {
          display: grid;
          gap: 10px;
        }

        .choiceRow {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .priceInput {
          max-width: 110px;
        }

        .emptyBlock {
          border: 1px dashed rgba(14, 23, 48, 0.12);
          border-radius: 20px;
          padding: 22px;
          color: #7d8596;
          font-size: 15px;
          font-weight: 800;
          text-align: center;
          background: #ffffff;
        }

        .ghostTiny {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 14px;
          background: #ffffff;
          color: #0e1730;
          border: 1px solid rgba(14, 23, 48, 0.1);
          font-size: 14px;
        }

        .bottomNav {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 14px;
          min-height: 74px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(14, 23, 48, 0.08);
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 6px;
          padding: 8px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(12px);
        }

        .bottomNavItem {
          border: none;
          background: transparent;
          border-radius: 18px;
          color: #6a7588;
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          min-height: 58px;
        }

        .bottomNavItemActive {
          background: #0e1730;
          color: #ffffff;
        }

        .bottomDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: currentColor;
        }

        .previewDeviceWrap {
          position: sticky;
          top: 18px;
        }

        .deviceFrame {
          width: min(100%, 460px);
          margin: 0 auto;
          background: #0d0d0d;
          border-radius: 42px;
          padding: 10px;
          box-shadow: 0 30px 70px rgba(15, 23, 42, 0.22);
        }

        .deviceNotch {
          width: 140px;
          height: 22px;
          border-radius: 0 0 18px 18px;
          background: #0d0d0d;
          margin: 0 auto -8px;
          position: relative;
          z-index: 4;
        }

        .previewPhone {
          min-height: 880px;
          border-radius: 34px;
          overflow: hidden;
          border: 1px solid rgba(14, 23, 48, 0.08);
        }

        .previewLight {
          background: #f8f8f5;
          color: #0e1730;
        }

        .previewDark {
          background: #0a0a0a;
          color: #ffffff;
        }

        .previewHero {
          position: relative;
          height: 280px;
          overflow: hidden;
          background: #111111;
        }

        .previewHeroImage,
        .previewHeroFallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: linear-gradient(135deg, #111111 0%, #2a2a2a 100%);
        }

        .previewOverlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.65) 100%);
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
          width: 74px;
          height: 74px;
          border-radius: 22px;
          object-fit: cover;
          background: #ffffff;
          color: #0e1730;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
        }

        .previewName {
          color: #ffffff;
          font-size: 42px;
          line-height: 0.94;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .previewTag {
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.92);
          font-size: 16px;
          font-weight: 800;
        }

        .previewInfoBand {
          padding: 16px 18px;
          border-bottom: 1px solid rgba(14, 23, 48, 0.08);
          background: inherit;
        }

        .previewInfoTitle {
          color: #7d8596;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        .previewInfoGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .previewInfoCell {
          display: grid;
          gap: 6px;
          border-radius: 18px;
          padding: 14px;
          background: rgba(14, 23, 48, 0.04);
        }

        .previewInfoCell span {
          color: #7d8596;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .previewInfoCell strong {
          color: inherit;
          font-size: 15px;
          font-weight: 900;
          line-height: 1.3;
        }

        .previewDark .previewInfoCell {
          background: rgba(255, 255, 255, 0.08);
        }

        .previewDark .previewInfoCell span {
          color: rgba(255, 255, 255, 0.65);
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
          min-height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(14, 23, 48, 0.08);
          color: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
        }

        .previewDark .previewMetaPill {
          background: rgba(255, 255, 255, 0.1);
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
          min-height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(14, 23, 48, 0.1);
          background: #ffffff;
          color: inherit;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .previewDark .previewCategoryTab {
          background: transparent;
          border-color: rgba(255, 255, 255, 0.16);
        }

        .previewCategoryTabActive {
          background: #000000;
          color: #ffffff;
          border-color: #000000;
        }

        .previewDark .previewCategoryTabActive {
          background: #ffffff;
          color: #0e1730;
          border-color: #ffffff;
        }

        .previewGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .previewGridCard {
          border: 1px solid transparent;
          background: transparent;
          padding: 0;
          border-radius: 22px;
          cursor: pointer;
          overflow: hidden;
        }

        .previewGridCardActive {
          border-color: rgba(14, 23, 48, 0.2);
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.04);
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
          margin: 16px 18px 18px;
          border: 1px solid rgba(14, 23, 48, 0.08);
          border-radius: 28px;
          overflow: hidden;
          background: #ffffff;
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

        .previewPopupHeaderRow {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: start;
        }

        .previewPopupName {
          color: #0e1730;
          font-size: 30px;
          line-height: 0.96;
          letter-spacing: -0.05em;
          font-weight: 900;
        }

        .previewPopupPrice {
          color: #0e1730;
          font-size: 24px;
          font-weight: 900;
          white-space: nowrap;
        }

        .previewPopupDescription {
          margin-top: 12px;
          color: #566274;
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
          border: 1px solid rgba(14, 23, 48, 0.08);
          border-radius: 18px;
          padding: 14px;
        }

        .previewOptionHeader {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #0e1730;
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
          color: #566274;
          font-size: 14px;
          font-weight: 800;
        }

        .previewAddToCart {
          width: 100%;
          min-height: 54px;
          border: none;
          border-radius: 18px;
          background: #000000;
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
          margin-top: 16px;
          cursor: pointer;
        }

        @media (max-width: 1240px) {
          .contentGrid {
            grid-template-columns: 1fr;
          }

          .previewDeviceWrap {
            position: static;
          }

          .deviceFrame {
            width: min(100%, 520px);
          }
        }

        @media (max-width: 900px) {
          .topBar {
            flex-direction: column;
          }

          .topBarRight {
            width: 100%;
            justify-content: flex-start;
          }

          .topWideInfo {
            grid-template-columns: 1fr;
          }

          .fieldGrid {
            grid-template-columns: 1fr;
          }

          .uploadStack {
            grid-template-columns: 1fr;
          }

          .previewGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .page {
            padding: 14px;
          }

          .contentGrid {
            grid-template-columns: 1fr;
          }

          .leftPanelHiddenMobile {
            display: none;
          }

          .rightPanelMobileHidden {
            display: none;
          }

          .phoneChrome {
            min-height: auto;
          }

          .deviceFrame {
            width: 100%;
            max-width: 430px;
          }

          .previewPhone {
            min-height: auto;
          }
        }

        @media (max-width: 640px) {
          .previewHeroWide {
            min-height: 220px;
          }

          .previewHeroWideContent {
            min-height: 220px;
            padding: 16px;
          }

          .previewHeroWideBrand {
            align-items: center;
          }

          .previewHeroWideLogo,
          .previewHeroWideLogoFallback {
            width: 68px;
            height: 68px;
            border-radius: 20px;
          }

          .previewHeroWideName {
            font-size: 34px;
          }

          .languageSwitch {
            width: 100%;
            justify-content: center;
          }

          .ghostButton,
          .primaryButton {
            flex: 1 1 0;
          }

          .topBarRight {
            justify-content: stretch;
          }

          .visualItemGrid {
            grid-template-columns: 1fr;
          }

          .choiceRow,
          .categoryEditBlock,
          .itemEditorTop,
          .optionGroupTop {
            flex-direction: column;
            align-items: stretch;
          }

          .priceInput {
            max-width: none;
          }

          .previewInfoGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}