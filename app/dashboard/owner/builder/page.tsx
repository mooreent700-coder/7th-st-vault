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
  }, [router, copy.couldNotLoad, copy]);
  

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


>{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <section className="hero">
          {heroImage ? <img src={heroImage} alt="Hero" className="heroImage" /> : <div className="heroImage heroFallback" />}
          <div className="heroOverlay" />
          <div className="heroContent">
            <div className="heroIdentity">
              {logoImage ? <img src={logoImage} alt="Logo" className="heroLogo" /> : <div className="heroLogo heroLogoFallback">{(name.trim() || 'M').charAt(0).toUpperCase()}</div>}
              <div className="heroName">{name.trim() || 'Your Store'}</div>
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
          {previewLink ? <Link href={previewLink} target="_blank" className="previewButton">{copy.previewStore}</Link> : <button type="button" className="previewButton" disabled>{copy.previewStore}</button>}
        </section>

        <div className="stack">
          <SectionCard section="store" icon="⌂" title={copy.storeSetup} right="✎" summary={<div className="simpleSummary"><strong>{name.trim() || 'Your Store'}</strong><span>{phone.trim() || '323-555-1234'}</span><span>{address.trim() || '123 Main St, Los Angeles, CA'}</span></div>} />
          {expanded === 'store' ? <div className="panel">
            <label className="field"><span className="label">{copy.storeName}</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
            <div className="infoCard"><span className="label">{copy.liveUrl}</span><strong>{slug ? `/store/${slug}` : '/store/your-store'}</strong></div>
            <label className="field"><span className="label">{copy.phone}</span><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label className="field"><span className="label">{copy.address}</span><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          </div> : null}

          <SectionCard section="branding" icon="▣" title={copy.branding} right={copy.heroAndLogoImages} />
          {expanded === 'branding' ? <div className="panel">
            <div className="uploadCard">
              <div className="uploadTitle">{copy.uploadHeroImage}</div>
              <label className="primaryButton">
                {uploadingHero ? copy.saving : copy.uploadHeroImage}
                <input type="file" accept="image/*" hidden onChange={(e) => { void handleHeroUpload(e.target.files?.[0] || null); }} />
              </label>
              <button type="button" className="secondaryWide" onClick={removeHeroImage}>{copy.removeImage}</button>
              {heroImage ? <img src={heroImage} alt="Hero" className="uploadPreview" /> : <div className="uploadPreviewPlaceholder">{copy.heroPreview}</div>}
            </div>

            <div className="uploadCard">
              <div className="uploadTitle">{copy.uploadLogo}</div>
              <label className="primaryButton">
                {uploadingLogo ? copy.saving : copy.uploadLogo}
                <input type="file" accept="image/*" hidden onChange={(e) => { void handleLogoUpload(e.target.files?.[0] || null); }} />
              </label>
              <button type="button" className="secondaryWide" onClick={removeLogoImage}>{copy.removeImage}</button>
              {logoImage ? <img src={logoImage} alt="Logo" className="uploadPreview" /> : <div className="uploadPreviewPlaceholder">{copy.logoPreview}</div>}
            </div>
          </div> : null}

          <SectionCard section="theme" icon="◐" title={copy.theme} right={theme === 'light' ? copy.light : copy.dark} />
          {expanded === 'theme' ? <div className="panel">
            <div className="chipRow">
              <button type="button" className={theme === 'light' ? 'chip chipActive' : 'chip'} onClick={() => setTheme('light')}>{copy.light}</button>
              <button type="button" className={theme === 'dark' ? 'chip chipActive' : 'chip'} onClick={() => setTheme('dark')}>{copy.dark}</button>
            </div>
            <div className="chipRow">
              <button type="button" className={storefrontLanguage === 'en' ? 'chip chipActive' : 'chip'} onClick={() => setStorefrontLanguage('en')}>EN</button>
              <button type="button" className={storefrontLanguage === 'es' ? 'chip chipActive' : 'chip'} onClick={() => setStorefrontLanguage('es')}>ES</button>
            </div>
            <div className="chipRow">
              <button type="button" className={pickupEnabled ? 'chip chipActive' : 'chip'} onClick={() => setPickupEnabled((v) => !v)}>{pickupEnabled ? copy.pickupOn : copy.pickupOff}</button>
              <button type="button" className={deliveryEnabled ? 'chip chipActive' : 'chip'} onClick={() => setDeliveryEnabled((v) => !v)}>{deliveryEnabled ? copy.deliveryOn : copy.deliveryOff}</button>
            </div>
            <label className="field"><span className="label">{copy.deliveryFee}</span><input className="input" value={deliveryFee} onChange={(e) => setDeliveryFee(sanitizeNumberInput(e.target.value))} /></label>
            <label className="field"><span className="label">{copy.deliveryRadius}</span><input className="input" value={deliveryRadius} onChange={(e) => setDeliveryRadius(sanitizeNumberInput(e.target.value))} /></label>
            <label className="field"><span className="label">{copy.deliveryMinimum}</span><input className="input" value={deliveryMinimum} onChange={(e) => setDeliveryMinimum(sanitizeNumberInput(e.target.value))} /></label>
          </div> : null}

          <SectionCard section="menu" icon="▦" title={copy.menu} right={copy.categoriesAndItems} />
          {expanded === 'menu' ? <div className="panel">
            <button type="button" className="primaryWide" onClick={addCategory}>{copy.addCategory}</button>
            <div className="categoryStack">
              {categories.map((category) => (
                <div key={category.id} className="categoryCard">
                  <button type="button" className="categoryHeader" onClick={() => selectCategory(category.id)}>
                    <span>{category.name || 'Featured'}</span>
                    <span className="categoryCount">{category.items.length}</span>
                  </button>
                  <input className="input compactInput" value={category.name} onChange={(e) => updateCategory(category.id, e.target.value)} />
                  <button type="button" className="dangerWide" onClick={() => deleteCategory(category.id)}>{copy.delete}</button>
                </div>
              ))}
            </div>

            {selectedCategory ? <>
              <button type="button" className="primaryWide" onClick={() => addItem(selectedCategory.id)}>{copy.addItem}</button>
              <div className="itemList">
                {selectedCategory.items.map((item) => (
                  <button type="button" key={item.id} className="itemCard" onClick={() => selectItem(item.id)}>
                    <div className="itemImageWrap">
                      {item.image_url ? <img src={item.image_url} alt={item.name || copy.itemNameFallback} className="itemImage" /> : <div className="itemImagePlaceholder" />}
                    </div>
                    <div className="itemInfo">
                      <strong>{item.name || copy.itemNameFallback}</strong>
                      <span>{money(item.base_price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </> : null}
          </div> : null}

          {selectedItem ? <>
            <SectionCard section="item" icon="▣" title={copy.itemBuilder} />
            {expanded === 'item' ? <div className="panel">
              <button type="button" className="dangerWide" onClick={() => deleteItem(selectedItem.category_id, selectedItem.id)}>{copy.deleteItem}</button>
              <div className="uploadCard">
                <div className="uploadTitle">{copy.uploadItemImage}</div>
                <label className="primaryButton">
                  {uploadingItemId === selectedItem.id ? copy.saving : copy.uploadItemImage}
                  <input type="file" accept="image/*" hidden onChange={(e) => { void handleItemImageUpload(selectedItem.id, e.target.files?.[0] || null); }} />
                </label>
                <button type="button" className="secondaryWide" onClick={() => removeItemImage(selectedItem.id)}>{copy.removeImage}</button>
                {selectedItem.image_url ? <img src={selectedItem.image_url} alt={selectedItem.name || copy.itemNameFallback} className="uploadPreview" /> : <div className="uploadPreviewPlaceholder">{copy.itemPreview}</div>}
              </div>

              <label className="field"><span className="label">{copy.itemName}</span><input className="input" value={selectedItem.name} onChange={(e) => updateItem(selectedItem.id, { name: e.target.value })} /></label>
              <label className="field"><span className="label">{copy.basePrice}</span><input className="input" value={selectedItem.base_price} onChange={(e) => updateItem(selectedItem.id, { base_price: sanitizeNumberInput(e.target.value) })} /></label>
              <label className="field"><span className="label">{copy.description}</span><textarea className="textarea" value={selectedItem.description} onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })} /></label>
              <div className="chipRow">
                <button type="button" className={selectedItem.availability === 'available' ? 'chip chipActive' : 'chip'} onClick={() => updateItem(selectedItem.id, { availability: 'available' })}>{copy.available}</button>
                <button type="button" className={selectedItem.availability === 'sold_out' ? 'chip chipActive' : 'chip'} onClick={() => updateItem(selectedItem.id, { availability: 'sold_out' })}>{copy.soldOut}</button>
              </div>
            </div> : null}

            <SectionCard section="options" icon="⋯" title={copy.optionGroups} />
            {expanded === 'options' ? <div className="panel">
              <div className="presetGrid">
                <button type="button" className="presetButton" onClick={() => addOptionGroup(selectedItem.id, 'protein')}>{copy.protein}</button>
                <button type="button" className="presetButton" onClick={() => addOptionGroup(selectedItem.id, 'size')}>{copy.size}</button>
                <button type="button" className="presetButton" onClick={() => addOptionGroup(selectedItem.id, 'drink')}>{copy.drink}</button>
                <button type="button" className="presetButton" onClick={() => addOptionGroup(selectedItem.id, 'extras')}>{copy.extras}</button>
                <button type="button" className="presetButton" onClick={() => addOptionGroup(selectedItem.id, 'removals')}>{copy.removals}</button>
                <button type="button" className="presetButton" onClick={() => addOptionGroup(selectedItem.id, 'custom')}>{copy.custom}</button>
              </div>

              {selectedItem.option_groups.length ? <div className="optionStack">
                {selectedItem.option_groups.map((group) => (
                  <div key={group.id} className="optionCard">
                    <input className="input compactInput" value={group.name} onChange={(e) => updateOptionGroup(selectedItem.id, group.id, { name: e.target.value })} />
                    <div className="chipRow">
                      <button type="button" className={group.required ? 'chip chipActive' : 'chip'} onClick={() => updateOptionGroup(selectedItem.id, group.id, { required: !group.required })}>{group.required ? copy.required : copy.optional}</button>
                      <button type="button" className={group.selection === 'single' ? 'chip chipActive' : 'chip'} onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'single' })}>{copy.singleChoice}</button>
                      <button type="button" className={group.selection === 'multiple' ? 'chip chipActive' : 'chip'} onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'multiple' })}>{copy.multipleChoice}</button>
                    </div>

                    <div className="choiceStack">
                      {group.options.map((option) => (
                        <div key={option.id} className="choiceRow">
                          <input className="input compactInput choiceName" value={option.name} onChange={(e) => updateOptionChoice(selectedItem.id, group.id, option.id, { name: e.target.value })} />
                          <input className="input compactInput choicePrice" value={option.price} onChange={(e) => updateOptionChoice(selectedItem.id, group.id, option.id, { price: sanitizeNumberInput(e.target.value) })} />
                          <button type="button" className="miniDanger" onClick={() => deleteOptionChoice(selectedItem.id, group.id, option.id)}>{copy.delete}</button>
                        </div>
                      ))}
                    </div>

                    <button type="button" className="secondaryWide" onClick={() => addOptionChoice(selectedItem.id, group.id)}>{copy.addChoice}</button>
                    <button type="button" className="dangerWide" onClick={() => deleteOptionGroup(selectedItem.id, group.id)}>{copy.delete}</button>
                  </div>
                ))}
              </div> : <div className="emptyState">{copy.noOptionGroups}</div>}
            </div> : null}
          </> : null}
        </div>

        <nav className="bottomNav">
          <button type="button" className="navItem"><span className="navDot" /><span>{copy.dashboard}</span></button>
          <button type="button" className="navItem navItemActive"><span className="navDot" /><span>{copy.builder}</span></button>
          <button type="button" className="navItem"><span className="navDot" /><span>{copy.preview}</span></button>
          <button type="button" className="navItem"><span className="navDot" /><span>{copy.flyers}</span></button>
          <button type="button" className="navItem"><span className="navDot" /><span>{copy.orders}</span></button>
          <button type="button" className="navItem"><span className="navDot" /><span>{copy.more}</span></button>
        </nav>
      </div>

      <style jsx global>{`
        .page { min-height: 100vh; background: #eef1f5; padding: 16px 12px 28px; display: grid; place-items: start center; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .shell { width: min(100%, 430px); background: #ffffff; border: 1px solid rgba(15,23,42,.08); border-radius: 34px; box-shadow: 0 24px 50px rgba(15,23,42,.08); padding: 14px 14px 92px; position: relative; overflow: hidden; }
        .notch { width: 122px; height: 8px; border-radius: 999px; background: #0f172a; margin: 2px auto 16px; }
        .topBar { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
        .brand { white-space: nowrap; min-width: 0; color: #111827; font-size: 19px; line-height: 1; }
        .brandStrong { font-weight: 900; }
        .brandSoft { color: #6b7280; font-weight: 500; }
        .topActions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .langButton,.saveButton,.primaryButton,.primaryWide,.secondaryWide,.dangerWide,.chip,.presetButton,.miniDanger { min-height: 42px; border-radius: 10px; border: 1px solid rgba(15,23,42,.12); padding: 0 14px; background: #fff; color: #111827; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px; font-weight: 800; cursor: pointer; }
        .saveButton,.primaryButton,.primaryWide { background: #0f172a; border-color: #0f172a; color: #fff; }
        .secondaryWide { background: #f8fafc; }
        .dangerWide,.miniDanger { background: #f7e3e3; border-color: transparent; color: #a12e2e; }
        .message { margin-bottom: 12px; border-radius: 14px; padding: 12px 14px; font-size: 14px; font-weight: 800; }
        .error { color: #991b1b; background: #fbeaea; }
        .success { color: #166534; background: #ebf7ee; }
        .hero { position: relative; min-height: 188px; overflow: hidden; margin: 0 -14px; background: #111827; }
        .heroImage { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .heroFallback { background: linear-gradient(135deg, #1f2937 0%, #475569 100%); }
        .heroOverlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.64) 100%); }
        .heroContent { position: relative; z-index: 2; min-height: 188px; display: flex; flex-direction: column; justify-content: flex-end; padding: 14px 16px; }
        .heroIdentity { display: flex; align-items: center; gap: 10px; }
        .heroLogo { width: 58px; height: 58px; border-radius: 999px; background: #fff; object-fit: cover; flex-shrink: 0; }
        .heroLogoFallback { display: flex; align-items: center; justify-content: center; color: #111827; font-size: 24px; font-weight: 900; }
        .heroName { color: #fff; font-size: 24px; font-weight: 900; }
        .heroMeta { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 12px; color: rgba(255,255,255,.96); font-size: 14px; font-weight: 700; }
        .intro { padding: 18px 2px 14px; }
        .title { margin: 0; color: #111827; font-size: 26px; font-weight: 900; }
        .subtitle { margin: 8px 0 0; color: #6b7280; font-size: 15px; font-weight: 600; }
        .previewButton { width: 100%; margin-top: 16px; min-height: 52px; border-radius: 10px; border: 1px solid rgba(17,24,39,.18); background: linear-gradient(180deg, #1d2430 0%, #10131a 100%); color: #fff; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; font-size: 17px; font-weight: 900; }
        .stack { display: grid; gap: 12px; }
        .sectionCard,.panel { width: 100%; border-radius: 14px; border: 1px solid rgba(15,23,42,.1); background: #fff; box-shadow: 0 4px 14px rgba(15,23,42,.04); }
        .sectionCard { padding: 16px; text-align: left; display: grid; gap: 12px; cursor: pointer; }
        .sectionCardTop { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .sectionCardLeft { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .miniIcon { width: 28px; height: 28px; border-radius: 8px; background: #f3f4f6; color: #111827; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 900; }
        .sectionCardTitle { color: #111827; font-size: 18px; font-weight: 900; }
        .sectionCardRight { display: flex; align-items: center; gap: 8px; }
        .sectionCardMeta { color: #6b7280; font-size: 14px; font-weight: 700; }
        .sectionCardArrow { color: #6b7280; font-size: 22px; }
        .simpleSummary { display: grid; gap: 4px; font-size: 14px; font-weight: 600; }
        .simpleSummary strong { color: #111827; font-size: 17px; font-weight: 900; }
        .panel { padding: 14px; display: grid; gap: 12px; }
        .field { display: grid; gap: 8px; }
        .label { color: #6b7280; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .12em; }
        .infoCard { border-radius: 12px; padding: 12px 14px; background: #f8fafc; border: 1px solid rgba(15,23,42,.08); display: grid; gap: 4px; }
        .input,.textarea { width: 100%; border-radius: 12px; border: 1px solid rgba(15,23,42,.12); background: #fff; color: #111827; font-size: 16px; font-weight: 700; outline: none; }
        .input { min-height: 56px; padding: 0 14px; }
        .compactInput { min-height: 48px; }
        .textarea { min-height: 140px; padding: 14px; resize: vertical; }
        .uploadCard,.categoryCard,.optionCard { border-radius: 14px; padding: 14px; border: 1px solid rgba(15,23,42,.1); background: #fff; display: grid; gap: 12px; }
        .uploadTitle { color: #111827; font-size: 16px; font-weight: 900; }
        .uploadPreview,.uploadPreviewPlaceholder { width: 100%; height: 190px; border-radius: 14px; display: block; }
        .uploadPreview { object-fit: cover; }
        .uploadPreviewPlaceholder { background: #eef1f5; color: #6b7280; font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
        .chipRow,.presetGrid,.categoryStack,.itemList,.optionStack,.choiceStack { display: grid; gap: 12px; }
        .itemCard { border-radius: 14px; border: 1px solid rgba(15,23,42,.1); background: #fff; text-align: left; overflow: hidden; cursor: pointer; }
        .categoryHeader { width: 100%; display: flex; align-items: center; justify-content: space-between; color: #111827; font-size: 18px; font-weight: 900; cursor: pointer; }
        .categoryCount { min-width: 36px; min-height: 36px; border-radius: 999px; background: #f3f4f6; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; }
        .itemImageWrap { width: 100%; aspect-ratio: 1.35 / 1; background: #eef1f5; }
        .itemImage,.itemImagePlaceholder { width: 100%; height: 100%; display: block; object-fit: cover; }
        .itemImagePlaceholder { background: linear-gradient(135deg, #e7ebf0 0%, #d8dee7 100%); }
        .itemInfo { padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .choiceRow { display: flex; gap: 10px; align-items: center; }
        .choiceName { flex: 1 1 auto; }
        .choicePrice { width: 92px; }
        .emptyState { border-radius: 14px; border: 1px dashed rgba(15,23,42,.14); padding: 24px 16px; text-align: center; color: #6b7280; font-size: 16px; font-weight: 900; background: #fafafa; }
        .bottomNav { position: absolute; left: 14px; right: 14px; bottom: 14px; min-height: 72px; border-radius: 18px; border: 1px solid rgba(15,23,42,.08); background: rgba(255,255,255,.96); display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; padding: 8px 6px; }
        .navItem { min-height: 56px; border-radius: 12px; color: #6b7280; display: grid; justify-items: center; align-content: center; gap: 6px; font-size: 11px; font-weight: 800; cursor: pointer; }
        .navItemActive { background: #0f172a; color: #fff; }
        .navDot { width: 12px; height: 12px; border-radius: 3px; background: currentColor; display: inline-block; }
      `}</style>
    </main>
  );
}
 