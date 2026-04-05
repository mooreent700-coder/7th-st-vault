'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type StorefrontLanguage = 'en' | 'es';
type BuilderLanguage = 'en' | 'es';
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
  eyebrow: string;
  title: string;
  subtitle: string;
  openStore: string;
  saveBuilder: string;
  saving: string;
  storeSetup: string;
  storeName: string;
  slug: string;
  liveUrl: string;
  phone: string;
  address: string;
  uploadHeroImage: string;
  uploadLogo: string;
  heroPreview: string;
  logoPreview: string;
  builderLanguage: string;
  storefrontTheme: string;
  storefrontLanguage: string;
  english: string;
  spanish: string;
  light: string;
  dark: string;
  pickupDeliveryControls: string;
  pickupOn: string;
  pickupOff: string;
  deliveryOn: string;
  deliveryOff: string;
  deliveryFee: string;
  deliveryRadius: string;
  deliveryMinimum: string;
  categoryBuilder: string;
  addCategory: string;
  categoryName: string;
  delete: string;
  untitledCategory: string;
  itemsIn: string;
  addItem: string;
  available: string;
  soldOut: string;
  itemBuilder: string;
  deleteItem: string;
  uploadItemImage: string;
  itemPreview: string;
  itemName: string;
  basePrice: string;
  description: string;
  describeItem: string;
  availability: string;
  optionGroups: string;
  protein: string;
  size: string;
  drink: string;
  extras: string;
  removals: string;
  custom: string;
  noOptionGroups: string;
  groupName: string;
  required: string;
  optional: string;
  singleChoice: string;
  multipleChoice: string;
  choiceName: string;
  addChoice: string;
  newItem: string;
  sampleItem: string;
  sampleDescription: string;
  customOptions: string;
  livePreview: string;
  imageOnlyMainGrid: string;
  storefrontPreview: string;
  category: string;
  itemNameFallback: string;
  itemDetailsPlaceholder: string;
  builderSaved: string;
  loadingBuilder: string;
  couldNotLoad: string;
  couldNotSave: string;
  couldNotUploadHero: string;
  couldNotUploadLogo: string;
  couldNotUploadItem: string;
  newChoice: string;
  options: string;
  heroInfoBlock: string;
};

const COPY: Record<BuilderLanguage, CopyBlock> = {
  en: {
    eyebrow: 'MENUFLOW BUILDER',
    title: 'Build Your Store',
    subtitle: 'Upload branding, set delivery rules, build categories and items, then save.',
    openStore: 'Open Store',
    saveBuilder: 'Save Builder',
    saving: 'Saving...',
    storeSetup: 'Store Setup',
    storeName: 'Store Name',
    slug: 'Slug',
    liveUrl: 'Live URL',
    phone: 'Phone',
    address: 'Address',
    uploadHeroImage: 'Upload Hero Image',
    uploadLogo: 'Upload Logo',
    heroPreview: 'Hero Preview',
    logoPreview: 'Logo Preview',
    builderLanguage: 'Builder Language',
    storefrontTheme: 'Storefront Theme',
    storefrontLanguage: 'Storefront Language',
    english: 'English',
    spanish: 'Spanish',
    light: 'Light',
    dark: 'Dark',
    pickupDeliveryControls: 'Pickup / Delivery Controls',
    pickupOn: 'Pickup On',
    pickupOff: 'Pickup Off',
    deliveryOn: 'Delivery On',
    deliveryOff: 'Delivery Off',
    deliveryFee: 'Delivery Fee',
    deliveryRadius: 'Delivery Radius',
    deliveryMinimum: 'Delivery Minimum',
    categoryBuilder: 'Category Builder',
    addCategory: 'Add Category',
    categoryName: 'Category Name',
    delete: 'Delete',
    untitledCategory: 'Untitled Category',
    itemsIn: 'Items in',
    addItem: 'Add Item',
    available: 'Available',
    soldOut: 'Sold Out',
    itemBuilder: 'Item Builder',
    deleteItem: 'Delete Item',
    uploadItemImage: 'Upload Item Image',
    itemPreview: 'Item Preview',
    itemName: 'Item Name',
    basePrice: 'Base Price',
    description: 'Description',
    describeItem: 'Describe the item...',
    availability: 'Availability',
    optionGroups: 'Option Groups',
    protein: 'Protein',
    size: 'Size',
    drink: 'Drink',
    extras: 'Extras',
    removals: 'Removals',
    custom: 'Custom',
    noOptionGroups: 'No option groups yet.',
    groupName: 'Group Name',
    required: 'Required',
    optional: 'Optional',
    singleChoice: 'Single Choice',
    multipleChoice: 'Multiple Choice',
    choiceName: 'Choice Name',
    addChoice: 'Add Choice',
    newItem: 'New Item',
    sampleItem: 'Sample Item',
    sampleDescription: 'Tap to edit this item.',
    customOptions: 'Custom Options',
    livePreview: 'Live Preview',
    imageOnlyMainGrid: 'IMAGE-ONLY MAIN GRID',
    storefrontPreview: 'Storefront Preview',
    category: 'Category',
    itemNameFallback: 'Item Name',
    itemDetailsPlaceholder: 'Item details will show here in the popup preview.',
    builderSaved: 'Builder saved.',
    loadingBuilder: 'Loading builder...',
    couldNotLoad: 'Could not load builder.',
    couldNotSave: 'Could not save builder.',
    couldNotUploadHero: 'Could not upload hero image.',
    couldNotUploadLogo: 'Could not upload logo image.',
    couldNotUploadItem: 'Could not upload item image.',
    newChoice: 'New Choice',
    options: 'Options',
    heroInfoBlock: 'Store Info',
  },
  es: {
    eyebrow: 'CONSTRUCTOR MENUFLOW',
    title: 'Construye Tu Tienda',
    subtitle: 'Sube tu branding, configura entrega, crea categorías y productos, y guarda.',
    openStore: 'Abrir Tienda',
    saveBuilder: 'Guardar Constructor',
    saving: 'Guardando...',
    storeSetup: 'Configuración de Tienda',
    storeName: 'Nombre del Negocio',
    slug: 'Slug',
    liveUrl: 'URL en vivo',
    phone: 'Teléfono',
    address: 'Dirección',
    uploadHeroImage: 'Subir Imagen Hero',
    uploadLogo: 'Subir Logo',
    heroPreview: 'Vista previa hero',
    logoPreview: 'Vista previa logo',
    builderLanguage: 'Idioma del Constructor',
    storefrontTheme: 'Tema de la Tienda',
    storefrontLanguage: 'Idioma de la Tienda',
    english: 'Inglés',
    spanish: 'Español',
    light: 'Claro',
    dark: 'Oscuro',
    pickupDeliveryControls: 'Controles de Recogida / Entrega',
    pickupOn: 'Recogida Activada',
    pickupOff: 'Recogida Desactivada',
    deliveryOn: 'Entrega Activada',
    deliveryOff: 'Entrega Desactivada',
    deliveryFee: 'Costo de Entrega',
    deliveryRadius: 'Radio de Entrega',
    deliveryMinimum: 'Mínimo de Entrega',
    categoryBuilder: 'Constructor de Categorías',
    addCategory: 'Agregar Categoría',
    categoryName: 'Nombre de Categoría',
    delete: 'Eliminar',
    untitledCategory: 'Categoría sin nombre',
    itemsIn: 'Productos en',
    addItem: 'Agregar Producto',
    available: 'Disponible',
    soldOut: 'Agotado',
    itemBuilder: 'Constructor de Producto',
    deleteItem: 'Eliminar Producto',
    uploadItemImage: 'Subir Imagen del Producto',
    itemPreview: 'Vista previa del producto',
    itemName: 'Nombre del Producto',
    basePrice: 'Precio Base',
    description: 'Descripción',
    describeItem: 'Describe el producto...',
    availability: 'Disponibilidad',
    optionGroups: 'Grupos de Opciones',
    protein: 'Proteína',
    size: 'Tamaño',
    drink: 'Bebida',
    extras: 'Extras',
    removals: 'Quitar',
    custom: 'Personalizado',
    noOptionGroups: 'Todavía no hay grupos de opciones.',
    groupName: 'Nombre del Grupo',
    required: 'Requerido',
    optional: 'Opcional',
    singleChoice: 'Una Opción',
    multipleChoice: 'Múltiples Opciones',
    choiceName: 'Nombre de Opción',
    addChoice: 'Agregar Opción',
    newItem: 'Nuevo Producto',
    sampleItem: 'Producto de Ejemplo',
    sampleDescription: 'Toca para editar este producto.',
    customOptions: 'Opciones Personalizadas',
    livePreview: 'Vista en Vivo',
    imageOnlyMainGrid: 'CUADRÍCULA SOLO IMÁGENES',
    storefrontPreview: 'Vista previa de la tienda',
    category: 'Categoría',
    itemNameFallback: 'Nombre del producto',
    itemDetailsPlaceholder: 'Los detalles del producto aparecerán aquí en la vista previa.',
    builderSaved: 'Constructor guardado.',
    loadingBuilder: 'Cargando constructor...',
    couldNotLoad: 'No se pudo cargar el constructor.',
    couldNotSave: 'No se pudo guardar el constructor.',
    couldNotUploadHero: 'No se pudo subir la imagen hero.',
    couldNotUploadLogo: 'No se pudo subir el logo.',
    couldNotUploadItem: 'No se pudo subir la imagen del producto.',
    newChoice: 'Nueva Opción',
    options: 'Opciones',
    heroInfoBlock: 'Información de Tienda',
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

  const [builderLanguage, setBuilderLanguage] = useState<BuilderLanguage>('en');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('light');
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
  const [placeholderMap, setPlaceholderMap] = useState<Record<string, string[]>>({});

  const copy = COPY[builderLanguage];

  useEffect(() => {
    const stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('menuflow_builder_language')
        : null;

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
          const { data, error: listError } = await supabase.storage
            .from(PLACEHOLDER_BUCKET)
            .list(folder, {
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
            const { data: publicUrlData } = supabase.storage
              .from(PLACEHOLDER_BUCKET)
              .getPublicUrl(`${folder}/${file.name}`);
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
            order_language,
            storefront_language,
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

          const inferredBuilderLanguage =
            (row.order_language || 'EN').toString().toUpperCase() === 'ES' ? 'es' : 'en';
          setBuilderLanguage(inferredBuilderLanguage);

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
          const starter: BuilderCategory[] = [
            {
              id: starterCategoryId,
              name: 'Featured',
              sort_order: 0,
              items: [
                {
                  id: starterItemId,
                  category_id: starterCategoryId,
                  name: COPY.en.sampleItem,
                  base_price: '12',
                  description: COPY.en.sampleDescription,
                  image_url: '',
                  availability: 'available',
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
        setError(err?.message || COPY[builderLanguage].couldNotLoad);
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

      const itemRows = (itemData || []) as ItemRow[];
      const itemIds = itemRows.map((item) => item.id);

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

      const mappedCategories: BuilderCategory[] = ((categoryData || []) as CategoryRow[]).map(
        (category, categoryIndex): BuilderCategory => {
          const categoryItems: BuilderItem[] = itemRows
            .filter((item) => item.category_id === category.id)
            .map((item): BuilderItem => {
              const groups: BuilderOptionGroup[] = groupData
                .filter((group) => group.item_id === item.id)
                .map((group): BuilderOptionGroup => ({
                  id: group.id,
                  name: group.name || COPY[builderLanguage].options,
                  presetType: 'custom',
                  required: !!group.is_required,
                  selection: normalizeSelectionMode(group),
                  options: choiceData
                    .filter((choice) => choice.option_group_id === group.id)
                    .map(
                      (choice): BuilderOption => ({
                        id: choice.id,
                        name: choice.name || COPY[builderLanguage].newChoice,
                        price: String(choice.price_delta ?? choice.price ?? 0),
                      })
                    ),
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
        }
      );

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
        const starter: BuilderCategory[] = [
          {
            id: starterCategoryId,
            name: 'Featured',
            sort_order: 0,
            items: [
              {
                id: starterItemId,
                category_id: starterCategoryId,
                name: COPY[builderLanguage].sampleItem,
                base_price: '12',
                description: COPY[builderLanguage].sampleDescription,
                image_url: '',
                availability: 'available',
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
  }, [router, builderLanguage]);

  const normalizedSlug = useMemo(() => slugify(slug), [slug]);

  const previewLink = normalizedSlug ? `/store/${normalizedSlug}` : '/store/demo';

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
          items: category.items.map((item) =>
            item.id === itemId ? { ...item, image_url: url } : item
          ),
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
        storefront_language: storefrontLanguage,
        order_language: builderLanguage === 'es' ? 'ES' : 'EN',
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
        name: category.name.trim() || `${copy.category} ${categoryIndex + 1}`,
        sort_order: categoryIndex,
      }));

      await supabase.from('menu_categories').delete().eq('restaurant_id', currentRestaurantId);

      if (allCategories.length) {
        const { error: categoryInsertError } = await supabase
          .from('menu_categories')
          .insert(allCategories);
        if (categoryInsertError) throw categoryInsertError;
      }

      const allItems = categories.flatMap((category, categoryIndex) =>
        category.items.map((item, itemIndex) => {
          const fallbackImage = getResolvedItemImage(item);
          return {
            id: item.id,
            restaurant_id: currentRestaurantId,
            category_id: category.id,
            name: item.name.trim() || copy.itemNameFallback,
            base_price: Number(item.base_price || 0),
            price: Number(item.base_price || 0),
            description: item.description.trim() || null,
            image_url: fallbackImage || null,
            availability: item.availability,
            is_available: item.availability === 'available',
            sort_order: itemIndex + categoryIndex * 100,
          };
        })
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
            name: group.name.trim() || copy.options,
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
              name: option.name.trim() || copy.newChoice,
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
    } catch (err: any) {
      setError(err?.message || copy.couldNotSave);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <section className="shell">
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1>{copy.loadingBuilder}</h1>

          <style jsx>{`
            .page {
              min-height: 100vh;
              background: #f3f3f0;
              padding: 24px;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
                'Segoe UI', sans-serif;
            }
            .shell {
              max-width: 1420px;
              margin: 0 auto;
              background: #f9f9f6;
              border: 1px solid rgba(14, 23, 43, 0.08);
              border-radius: 36px;
              padding: 28px;
              box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
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
              font-size: clamp(34px, 6vw, 60px);
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
        <div className="topRow">
          <div className="heroCopyCard">
            <div className="eyebrow">{copy.eyebrow}</div>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>

          <div className="topActions">
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

            <Link href={previewLink} className="ghostButton" target="_blank">
              {copy.openStore}
            </Link>

            <button type="button" className="primaryButton" onClick={handleSave} disabled={saving}>
              {saving ? copy.saving : copy.saveBuilder}
            </button>
          </div>
        </div>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <div className="grid">
          <section className="leftColumn">
            <section className="panel">
              <div className="panelTitle">{copy.storeSetup}</div>

              <div className="fieldGrid">
                <label className="field">
                  <span className="label">{copy.storeName}</span>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Restaurant"
                  />
                </label>

                <label className="field">
                  <span className="label">{copy.slug}</span>
                  <input
                    className="input"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="your-store"
                  />
                  <span className="helpText">
                    {copy.liveUrl}: /store/{normalizedSlug || 'your-store'}
                  </span>
                </label>

                <label className="field">
                  <span className="label">{copy.phone}</span>
                  <input
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="3235553355"
                  />
                </label>

                <label className="field">
                  <span className="label">{copy.address}</span>
                  <input
                    className="input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                  />
                </label>
              </div>
            </section>

            <section className="panel">
              <div className="panelTitle">{copy.uploadHeroImage.replace('Upload ', '').replace('Subir ', '')}</div>

              <div className="uploadGrid">
                <div className="uploadCard">
                  <div className="uploadTitle">{copy.uploadHeroImage}</div>
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
                  {heroImage ? (
                    <img src={heroImage} alt="Hero" className="thumbImage" />
                  ) : (
                    <div className="thumbPlaceholder">{copy.heroPreview}</div>
                  )}
                </div>

                <div className="uploadCard">
                  <div className="uploadTitle">{copy.uploadLogo}</div>
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
                  {logoImage ? (
                    <img src={logoImage} alt="Logo" className="thumbImage logoThumb" />
                  ) : (
                    <div className="thumbPlaceholder">{copy.logoPreview}</div>
                  )}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelTitle">{copy.builderLanguage}</div>

              <div className="controlStack">
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
              </div>
            </section>

            <section className="panel">
              <div className="panelTitle">{copy.pickupDeliveryControls}</div>

              <div className="deliveryToggleRow">
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

              <div className="fieldGrid threeCols">
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
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div className="panelTitle noMargin">{copy.categoryBuilder}</div>
                <button type="button" className="primaryButton small" onClick={addCategory}>
                  {copy.addCategory}
                </button>
              </div>

              <div className="categoryList">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={
                      category.id === selectedCategoryId
                        ? 'categoryCard categoryCardActive'
                        : 'categoryCard'
                    }
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
                      <span>{category.name || copy.untitledCategory}</span>
                      <span className="categoryCount">{category.items.length}</span>
                    </button>

                    <div className="categoryEditRow">
                      <input
                        className="input compactInput"
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, e.target.value)}
                        placeholder={copy.categoryName}
                      />

                      <button
                        type="button"
                        className="dangerButton"
                        onClick={() => deleteCategory(category.id)}
                      >
                        {copy.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {selectedCategory ? (
              <section className="panel">
                <div className="panelHeader">
                  <div className="panelTitle noMargin">
                    {copy.itemsIn} {selectedCategory.name || copy.category}
                  </div>
                  <button
                    type="button"
                    className="primaryButton small"
                    onClick={() => addItem(selectedCategory.id)}
                  >
                    {copy.addItem}
                  </button>
                </div>

                <div className="itemCardGrid">
                  {selectedCategory.items.map((item) => {
                    const resolvedImage = getResolvedItemImage(item);

                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={item.id === selectedItemId ? 'itemVisualCard itemVisualCardActive' : 'itemVisualCard'}
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setPreviewItemId(item.id);
                        }}
                      >
                        <div className="itemVisualImageWrap">
                          {resolvedImage ? (
                            <img src={resolvedImage} alt={item.name} className="itemVisualImage" />
                          ) : (
                            <div className="itemVisualFallback" />
                          )}
                        </div>

                        <div className="itemVisualBody">
                          <div className="itemVisualTop">
                            <div className="itemVisualName">{item.name || copy.itemNameFallback}</div>
                            <div className="itemVisualPrice">{money(item.base_price)}</div>
                          </div>
                          <div
                            className={
                              item.availability === 'available'
                                ? 'availability availabilityOn'
                                : 'availability availabilityOff'
                            }
                          >
                            {item.availability === 'available' ? copy.available : copy.soldOut}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {selectedItem ? (
              <section className="panel">
                <div className="panelHeader">
                  <div className="panelTitle noMargin">{copy.itemBuilder}</div>
                  <button
                    type="button"
                    className="dangerButton"
                    onClick={() => deleteItem(selectedItem.category_id, selectedItem.id)}
                  >
                    {copy.deleteItem}
                  </button>
                </div>

                <div className="fieldGrid">
                  <div className="uploadCard fullWidthCard">
                    <div className="uploadTitle">{copy.uploadItemImage}</div>
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
                      <img
                        src={getResolvedItemImage(selectedItem)}
                        alt={selectedItem.name}
                        className="thumbImage itemThumb"
                      />
                    ) : (
                      <div className="thumbPlaceholder itemThumbPlaceholder">{copy.itemPreview}</div>
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
                      onChange={(e) =>
                        updateItem(selectedItem.id, {
                          base_price: sanitizeNumberInput(e.target.value),
                        })
                      }
                      placeholder="12.99"
                    />
                  </label>

                  <label className="field fullWidth">
                    <span className="label">{copy.description}</span>
                    <textarea
                      className="textarea"
                      value={selectedItem.description}
                      onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })}
                      placeholder={copy.describeItem}
                    />
                  </label>

                  <div className="field fullWidth">
                    <span className="label">{copy.availability}</span>
                    <div className="toggleRow">
                      <button
                        type="button"
                        className={
                          selectedItem.availability === 'available'
                            ? 'toggleButton toggleActive'
                            : 'toggleButton'
                        }
                        onClick={() => updateItem(selectedItem.id, { availability: 'available' })}
                      >
                        {copy.available}
                      </button>
                      <button
                        type="button"
                        className={
                          selectedItem.availability === 'sold_out'
                            ? 'toggleButton toggleActive'
                            : 'toggleButton'
                        }
                        onClick={() => updateItem(selectedItem.id, { availability: 'sold_out' })}
                      >
                        {copy.soldOut}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="optionGroupHeader">
                  <div className="panelTitle noMargin">{copy.optionGroups}</div>
                  <div className="optionActionWrap">
                    <button
                      type="button"
                      className="ghostTiny"
                      onClick={() => addOptionGroup(selectedItem.id, 'protein')}
                    >
                      {copy.protein}
                    </button>
                    <button
                      type="button"
                      className="ghostTiny"
                      onClick={() => addOptionGroup(selectedItem.id, 'size')}
                    >
                      {copy.size}
                    </button>
                    <button
                      type="button"
                      className="ghostTiny"
                      onClick={() => addOptionGroup(selectedItem.id, 'drink')}
                    >
                      {copy.drink}
                    </button>
                    <button
                      type="button"
                      className="ghostTiny"
                      onClick={() => addOptionGroup(selectedItem.id, 'extras')}
                    >
                      {copy.extras}
                    </button>
                    <button
                      type="button"
                      className="ghostTiny"
                      onClick={() => addOptionGroup(selectedItem.id, 'removals')}
                    >
                      {copy.removals}
                    </button>
                    <button
                      type="button"
                      className="ghostTiny"
                      onClick={() => addOptionGroup(selectedItem.id, 'custom')}
                    >
                      {copy.custom}
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
                            placeholder={copy.groupName}
                          />

                          <button
                            type="button"
                            className="dangerButton"
                            onClick={() => deleteOptionGroup(selectedItem.id, group.id)}
                          >
                            {copy.delete}
                          </button>
                        </div>

                        <div className="optionMetaRow">
                          <button
                            type="button"
                            className={group.required ? 'toggleButton toggleActive' : 'toggleButton'}
                            onClick={() =>
                              updateOptionGroup(selectedItem.id, group.id, { required: !group.required })
                            }
                          >
                            {group.required ? copy.required : copy.optional}
                          </button>

                          <button
                            type="button"
                            className={
                              group.selection === 'single' ? 'toggleButton toggleActive' : 'toggleButton'
                            }
                            onClick={() =>
                              updateOptionGroup(selectedItem.id, group.id, { selection: 'single' })
                            }
                          >
                            {copy.singleChoice}
                          </button>

                          <button
                            type="button"
                            className={
                              group.selection === 'multiple'
                                ? 'toggleButton toggleActive'
                                : 'toggleButton'
                            }
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
                                className="input compactInput"
                                value={option.name}
                                onChange={(e) =>
                                  updateOptionChoice(selectedItem.id, group.id, option.id, {
                                    name: e.target.value,
                                  })
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

                        <button
                          type="button"
                          className="primaryButton small"
                          onClick={() => addOptionChoice(selectedItem.id, group.id)}
                        >
                          {copy.addChoice}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="emptyBlock">{copy.noOptionGroups}</div>
                  )}
                </div>
              </section>
            ) : null}
          </section>

          <section className="rightColumn">
            <section className="panel stickyPanel">
              <div className="panelHeader">
                <div className="panelTitle noMargin">{copy.livePreview}</div>
                <div className="previewStatus">{copy.imageOnlyMainGrid}</div>
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
                    <div className="previewMetaPill">
                      {pickupEnabled ? copy.pickupOn : copy.pickupOff}
                    </div>
                    <div className="previewMetaPill">
                      {deliveryEnabled ? copy.deliveryOn : copy.deliveryOff}
                    </div>
                    <div className="previewMetaPill">
                      {theme === 'dark' ? copy.dark : copy.light}
                    </div>
                  </div>

                  <div className="previewCategoryTabs">
                    {categories.map((category) => (
                      <button
                        type="button"
                        key={category.id}
                        className={
                          category.id === selectedCategoryId
                            ? 'previewCategoryTab previewCategoryTabActive'
                            : 'previewCategoryTab'
                        }
                        onClick={() => setSelectedCategoryId(category.id)}
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
                          {resolvedImage ? (
                            <img src={resolvedImage} alt={item.name} className="previewGridImage" />
                          ) : (
                            <div className="previewGridFallback" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {previewItem ? (
                <div className="previewPopup">
                  <div className="previewPopupImageWrap">
                    {getResolvedItemImage(previewItem) ? (
                      <img
                        src={getResolvedItemImage(previewItem)}
                        alt={previewItem.name}
                        className="previewPopupImage"
                      />
                    ) : (
                      <div className="previewPopupFallback" />
                    )}
                  </div>

                  <div className="previewPopupBody">
                    <div className="previewPopupHeaderRow">
                      <div className="previewPopupName">
                        {previewItem.name || copy.itemNameFallback}
                      </div>
                      <div className="previewPopupPrice">{money(previewItem.base_price)}</div>
                    </div>

                    <div className="previewPopupDescription">
                      {previewItem.description || copy.itemDetailsPlaceholder}
                    </div>

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
          background: #f2f2ef;
          padding: 24px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            'Segoe UI', sans-serif;
        }

        .shell {
          max-width: 1440px;
          margin: 0 auto;
          background: #f8f8f5;
          border: 1px solid rgba(14, 23, 48, 0.08);
          border-radius: 36px;
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

        .heroCopyCard {
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
          font-size: clamp(36px, 6vw, 64px);
          line-height: 0.94;
          letter-spacing: -0.06em;
          font-weight: 900;
        }

        p {
          margin: 14px 0 0;
          color: #667081;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 800;
          max-width: 760px;
        }

        .topActions {
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
          min-width: 74px;
          min-height: 48px;
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
        .ghostTiny {
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

        .primaryButton.small {
          min-height: 46px;
          padding: 0 16px;
          border-radius: 16px;
        }

        .ghostButton {
          padding: 0 20px;
          background: #ffffff;
          color: #0e1730;
          border: 1px solid rgba(14, 23, 48, 0.1);
        }

        .uploadButton {
          padding: 0 18px;
          background: #000000;
          color: #ffffff;
          width: fit-content;
        }

        .toggleButton {
          padding: 0 20px;
          background: #ffffff;
          color: #0e1730;
          border: 1px solid rgba(14, 23, 48, 0.1);
        }

        .toggleActive {
          background: #000000;
          color: #ffffff;
          border-color: #000000;
        }

        .dangerButton {
          padding: 0 16px;
          background: #f7e3e3;
          color: #9e2c2c;
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

        .primaryButton:disabled,
        .uploadButton:disabled {
          opacity: 0.55;
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
          color: #9a1f1f;
          background: #f8e9e9;
          border: 1px solid rgba(154, 31, 31, 0.12);
        }

        .success {
          color: #165534;
          background: #eaf5ee;
          border: 1px solid rgba(22, 85, 52, 0.1);
        }

        .grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.95fr);
          gap: 20px;
        }

        .leftColumn,
        .rightColumn {
          display: grid;
          gap: 20px;
          align-content: start;
        }

        .panel {
          background: #ffffff;
          border: 1px solid rgba(14, 23, 48, 0.07);
          border-radius: 30px;
          padding: 22px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.03);
        }

        .stickyPanel {
          position: sticky;
          top: 24px;
        }

        .panelTitle {
          color: #0e1730;
          font-size: 22px;
          font-weight: 900;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
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
          color: #7d8596;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .input,
        .textarea {
          width: 100%;
          border-radius: 20px;
          border: 1px solid rgba(14, 23, 48, 0.1);
          background: #fbfbf8;
          padding: 0 18px;
          color: #0e1730;
          font-size: 17px;
          font-weight: 800;
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
        }

        .input {
          min-height: 58px;
        }

        .textarea {
          min-height: 132px;
          padding: 16px 18px;
          resize: vertical;
        }

        .compactInput {
          min-height: 50px;
          font-size: 15px;
        }

        .strongInput {
          min-width: 240px;
        }

        .priceInput {
          max-width: 120px;
        }

        .helpText {
          color: #7d8596;
          font-size: 13px;
          font-weight: 800;
        }

        .uploadGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .uploadCard {
          border: 1px dashed rgba(14, 23, 48, 0.14);
          border-radius: 26px;
          padding: 18px;
          display: grid;
          gap: 14px;
          background: #fcfcfa;
        }

        .uploadTitle {
          color: #0e1730;
          font-size: 16px;
          font-weight: 900;
        }

        .thumbImage,
        .thumbPlaceholder {
          width: 100%;
          height: 200px;
          border-radius: 22px;
          object-fit: cover;
        }

        .thumbPlaceholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef1f5;
          color: #6e788a;
          font-size: 15px;
          font-weight: 900;
        }

        .logoThumb {
          object-fit: contain;
          background: #ffffff;
          padding: 18px;
          border: 1px solid rgba(14, 23, 48, 0.06);
        }

        .itemThumb {
          height: 240px;
        }

        .itemThumbPlaceholder {
          height: 240px;
        }

        .fullWidthCard {
          grid-column: 1 / -1;
        }

        .controlStack {
          display: grid;
          gap: 18px;
        }

        .controlBlock {
          display: grid;
          gap: 10px;
        }

        .toggleRow,
        .deliveryToggleRow,
        .optionActionWrap,
        .optionMetaRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .categoryList,
        .optionGroupList {
          display: grid;
          gap: 14px;
        }

        .categoryCard,
        .optionGroupCard {
          border: 1px solid rgba(14, 23, 48, 0.08);
          border-radius: 24px;
          padding: 16px;
          background: #ffffff;
        }

        .categoryCardActive {
          border-color: rgba(14, 23, 48, 0.22);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
        }

        .categorySelect {
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 0;
          color: #0e1730;
          font-size: 18px;
          font-weight: 900;
        }

        .categoryCount {
          min-width: 38px;
          min-height: 38px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f1f1ef;
          font-size: 13px;
          font-weight: 900;
          color: #0e1730;
        }

        .categoryEditRow {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: 14px;
        }

        .itemCardGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .itemVisualCard {
          border: 1px solid rgba(14, 23, 48, 0.08);
          background: #ffffff;
          border-radius: 24px;
          padding: 10px;
          text-align: left;
          cursor: pointer;
          transition: 0.16s ease;
        }

        .itemVisualCardActive {
          border-color: rgba(14, 23, 48, 0.22);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .itemVisualImageWrap {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          overflow: hidden;
          background: #eef1f5;
        }

        .itemVisualImage,
        .itemVisualFallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: linear-gradient(135deg, #e9edf2 0%, #dfe5ec 100%);
        }

        .itemVisualBody {
          padding: 12px 4px 4px;
          display: grid;
          gap: 10px;
        }

        .itemVisualTop {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 10px;
        }

        .itemVisualName {
          color: #0e1730;
          font-size: 16px;
          font-weight: 900;
          line-height: 1.1;
        }

        .itemVisualPrice {
          color: #0e1730;
          font-size: 15px;
          font-weight: 900;
          white-space: nowrap;
        }

        .availability {
          min-height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
          width: fit-content;
        }

        .availabilityOn {
          background: #ebf6ee;
          color: #2d6c3d;
        }

        .availabilityOff {
          background: #f8e9e9;
          color: #9a1f1f;
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
          border: 1px dashed rgba(14, 23, 48, 0.12);
          border-radius: 20px;
          padding: 22px;
          color: #7d8596;
          font-size: 15px;
          font-weight: 800;
          text-align: center;
          background: #fcfcfa;
        }

        .previewStatus {
          min-height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          background: #efefec;
          color: #0e1730;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .previewShell {
          overflow: hidden;
          border-radius: 30px;
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
          height: 290px;
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
          margin-top: 16px;
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

        @media (max-width: 1180px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .stickyPanel {
            position: static;
          }
        }

        @media (max-width: 900px) {
          .fieldGrid,
          .threeCols,
          .uploadGrid {
            grid-template-columns: 1fr;
          }

          .previewGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 16px;
          }

          .shell {
            padding: 18px;
            border-radius: 28px;
          }

          .topRow {
            flex-direction: column;
          }

          .topActions {
            width: 100%;
            justify-content: stretch;
          }

          .languageSwitch {
            width: 100%;
            justify-content: center;
          }

          .ghostButton,
          .primaryButton {
            flex: 1 1 0;
          }

          .itemCardGrid {
            grid-template-columns: 1fr;
          }

          .choiceRow,
          .categoryEditRow {
            flex-direction: column;
            align-items: stretch;
          }

          .previewHero {
            height: 230px;
          }

          .previewName {
            font-size: 34px;
          }

          .previewPopupImageWrap {
            height: 200px;
          }

          .previewInfoGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
