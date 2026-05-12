'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';
type BuilderPlan = 'starter' | 'growth' | 'premium';
type SectionKey = 'store' | 'branding' | 'theme' | 'menu' | 'item' | 'options' | 'flyers';
type HoursKey =
  | 'hours_monday'
  | 'hours_tuesday'
  | 'hours_wednesday'
  | 'hours_thursday'
  | 'hours_friday'
  | 'hours_saturday'
  | 'hours_sunday';

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
  plan?: BuilderPlan | null;
  stripe_account_id?: string | null;
  stripe_connected?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  hours_monday?: string | null;
  hours_tuesday?: string | null;
  hours_wednesday?: string | null;
  hours_thursday?: string | null;
  hours_friday?: string | null;
  hours_saturday?: string | null;
  hours_sunday?: string | null;
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
  selection_mode?: 'single' | 'multiple' | null;
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

type BuilderOptionChoice = {
  id: string;
  name: string;
  price: string;
};

type BuilderOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  selection: 'single' | 'multiple';
  presetType:
    | 'protein'
    | 'size'
    | 'drink'
    | 'extras'
    | 'removals'
    | 'custom'
    | 'toppings'
    | 'sauces';
  options: BuilderOptionChoice[];
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

type PlaceholderCategory =
  | 'drinks'
  | 'tacos'
  | 'burgers'
  | 'pizza'
  | 'wings'
  | 'plates'
  | 'desserts'
  | 'seafood'
  | 'breakfast'
  | 'hotdogs'
  | 'sandwiches'
  | 'chicken'
  | 'bbq'
  | 'snacks'
  | 'catering'
  | 'mexican';

type PlaceholderImage = {
  id: string;
  category: PlaceholderCategory;
  name: string;
  url: string;
};

type FlyerStyleKey =
  | 'hibachi'
  | 'dessert'
  | 'hotdog'
  | 'seafood'
  | 'tacos'
  | 'snacks'
  | 'generic';

type FlyerPack = '100' | '250' | '500';

type CopyBlock = {
  builderWord: string;
  loading: string;
  saving: string;
  save: string;
  title: string;
  subtitle: string;
  previewStore: string;
  storeSetup: string;
  storeName: string;
  phone: string;
  address: string;
  liveUrl: string;
  hours: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  branding: string;
  heroAndLogoImages: string;
  uploadHeroImage: string;
  uploadLogo: string;
  removeImage: string;
  heroPreview: string;
  logoPreview: string;
  theme: string;
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
  menu: string;
  categoriesAndItems: string;
  categoryName: string;
  addCategory: string;
  addItem: string;
  itemBuilder: string;
  uploadItemImage: string;
  itemPreview: string;
  itemName: string;
  basePrice: string;
  description: string;
  available: string;
  soldOut: string;
  deleteItem: string;
  optionGroups: string;
  protein: string;
  size: string;
  drink: string;
  extras: string;
  removals: string;
  custom: string;
  toppings: string;
  sauces: string;
  required: string;
  optional: string;
  singleChoice: string;
  multipleChoice: string;
  choiceName: string;
  addChoice: string;
  newChoice: string;
  noOptionGroups: string;
  dashboard: string;
  builder: string;
  preview: string;
  flyers: string;
  orders: string;
  more: string;
  builderSaved: string;
  couldNotSave: string;
  itemNameFallback: string;
  describeItem: string;
  stripeNeeded: string;
  goLive: string;
  goLiveReady: string;
  connectStripe: string;
  starterPlan: string;
  growthPlan: string;
  premiumPlan: string;
  firstMonthFree: string;
  perOrder: string;
  freeFlyer: string;
  customFlyers: string;
  chooseFlyerPack: string;
  bestValue: string;
  included: string;
  upgradeRequired: string;
  placeholderGallery: string;
  placeholdersUsed: string;
  starterLimitReached: string;
  flyerStyle: string;
  flyerBusinessName: string;
  flyerHeadline: string;
  flyerSubheadline: string;
  flyerPromoLine: string;
  flyerInstagram: string;
  flyerHours: string;
  flyerPreviewOnly: string;
  flyerQrUnlock: string;
  freeQrLive: string;
};

const COPY: Record<LanguageMode, CopyBlock> = {
  en: {
    builderWord: 'BUILDER',
    loading: 'Loading builder...',
    saving: 'Saving...',
    save: 'Save',
    title: 'Build Your Store',
    subtitle: 'Upload branding, build your menu, flyers, and go live.',
    previewStore: 'Preview Store',
    storeSetup: 'Store Setup',
    storeName: 'Store Name',
    phone: 'Phone',
    address: 'Address',
    liveUrl: 'Live URL',
    hours: 'Hours of Operation',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    branding: 'Branding',
    heroAndLogoImages: 'Hero & Logo Images',
    uploadHeroImage: 'Upload Hero Image',
    uploadLogo: 'Upload Logo',
    removeImage: 'Remove Image',
    heroPreview: 'Hero Preview',
    logoPreview: 'Logo Preview',
    theme: 'Theme',
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
    menu: 'Menu',
    categoriesAndItems: 'Categories & Items',
    categoryName: 'Category Name',
    addCategory: 'Add Category',
    addItem: 'Add Item',
    itemBuilder: 'Item Builder',
    uploadItemImage: 'Upload Item Image',
    itemPreview: 'Item Preview',
    itemName: 'Item Name',
    basePrice: 'Base Price',
    description: 'Description',
    available: 'Available',
    soldOut: 'Sold Out',
    deleteItem: 'Delete Item',
    optionGroups: 'Option Groups',
    protein: 'Protein',
    size: 'Size',
    drink: 'Drink',
    extras: 'Extras',
    removals: 'Removals',
    custom: 'Custom',
    toppings: 'Toppings',
    sauces: 'Sauces',
    required: 'Required',
    optional: 'Optional',
    singleChoice: 'Single',
    multipleChoice: 'Multiple',
    choiceName: 'Choice Name',
    addChoice: 'Add Choice',
    newChoice: 'New Choice',
    noOptionGroups: 'No option groups yet.',
    dashboard: 'Dashboard',
    builder: 'Builder',
    preview: 'Preview',
    flyers: 'Flyers',
    orders: 'Orders',
    more: 'More',
    builderSaved: 'Builder saved.',
    couldNotSave: 'Could not save builder.',
    itemNameFallback: 'Item Name',
    describeItem: 'Describe your item...',
    stripeNeeded: 'Connect Stripe before going live.',
    goLive: 'Go Live',
    goLiveReady: 'Ready to Go Live',
    connectStripe: 'Connect Stripe',
    starterPlan: 'Starter',
    growthPlan: 'Growth',
    premiumPlan: 'Premium',
    firstMonthFree: 'First month free',
    perOrder: 'per order',
    freeFlyer: 'Free Digital QR Flyer',
    customFlyers: 'Custom QR Flyer Upgrade',
    chooseFlyerPack: 'Choose Flyer Pack',
    bestValue: 'Best Value',
    included: 'Included',
    upgradeRequired: 'Upgrade required for more placeholders.',
    placeholderGallery: 'Placeholder Food Images',
    placeholdersUsed: 'Placeholders used',
    starterLimitReached: 'Starter plan includes up to 6 placeholder images.',
    flyerStyle: 'Flyer Style',
    flyerBusinessName: 'Business Name',
    flyerHeadline: 'Headline',
    flyerSubheadline: 'Subheadline',
    flyerPromoLine: 'Promo Line',
    flyerInstagram: 'Instagram',
    flyerHours: 'Hours',
    flyerPreviewOnly: 'Preview Only',
    flyerQrUnlock: 'QR becomes live after flyer purchase.',
    freeQrLive: 'Free white flyer QR is live with signup.',
  },
  es: {
    builderWord: 'BUILDER',
    loading: 'Cargando builder...',
    saving: 'Guardando...',
    save: 'Guardar',
    title: 'Construye Tu Tienda',
    subtitle: 'Sube tu marca, arma tu menú, flyers y sal en vivo.',
    previewStore: 'Vista Previa',
    storeSetup: 'Configuración',
    storeName: 'Nombre del Negocio',
    phone: 'Teléfono',
    address: 'Dirección',
    liveUrl: 'URL En Vivo',
    hours: 'Horario',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
    branding: 'Branding',
    heroAndLogoImages: 'Hero y Logo',
    uploadHeroImage: 'Subir Hero',
    uploadLogo: 'Subir Logo',
    removeImage: 'Quitar Imagen',
    heroPreview: 'Vista Hero',
    logoPreview: 'Vista Logo',
    theme: 'Tema',
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
    menu: 'Menú',
    categoriesAndItems: 'Categorías y Productos',
    categoryName: 'Nombre de Categoría',
    addCategory: 'Agregar Categoría',
    addItem: 'Agregar Producto',
    itemBuilder: 'Editor de Producto',
    uploadItemImage: 'Subir Imagen',
    itemPreview: 'Vista del Producto',
    itemName: 'Nombre del Producto',
    basePrice: 'Precio Base',
    description: 'Descripción',
    available: 'Disponible',
    soldOut: 'Agotado',
    deleteItem: 'Eliminar Producto',
    optionGroups: 'Grupos de Opciones',
    protein: 'Proteína',
    size: 'Tamaño',
    drink: 'Bebida',
    extras: 'Extras',
    removals: 'Quitar',
    custom: 'Personalizado',
    toppings: 'Toppings',
    sauces: 'Salsas',
    required: 'Requerido',
    optional: 'Opcional',
    singleChoice: 'Una',
    multipleChoice: 'Múltiple',
    choiceName: 'Nombre de Opción',
    addChoice: 'Agregar Opción',
    newChoice: 'Nueva Opción',
    noOptionGroups: 'Todavía no hay grupos de opciones.',
    dashboard: 'Panel',
    builder: 'Builder',
    preview: 'Vista',
    flyers: 'Flyers',
    orders: 'Pedidos',
    more: 'Más',
    builderSaved: 'Builder guardado.',
    couldNotSave: 'No se pudo guardar el builder.',
    itemNameFallback: 'Producto',
    describeItem: 'Describe tu producto...',
    stripeNeeded: 'Conecta Stripe antes de salir en vivo.',
    goLive: 'Salir En Vivo',
    goLiveReady: 'Listo para Salir',
    connectStripe: 'Conectar Stripe',
    starterPlan: 'Starter',
    growthPlan: 'Growth',
    premiumPlan: 'Premium',
    firstMonthFree: 'Primer mes gratis',
    perOrder: 'por pedido',
    freeFlyer: 'Flyer QR Digital Gratis',
    customFlyers: 'Upgrade Flyer QR Personalizado',
    chooseFlyerPack: 'Elige Paquete',
    bestValue: 'Mejor Valor',
    included: 'Incluido',
    upgradeRequired: 'Necesitas subir de plan para más placeholders.',
    placeholderGallery: 'Imágenes Placeholder',
    placeholdersUsed: 'Placeholders usados',
    starterLimitReached: 'Starter incluye hasta 6 imágenes placeholder.',
    flyerStyle: 'Estilo de Flyer',
    flyerBusinessName: 'Nombre del Negocio',
    flyerHeadline: 'Título',
    flyerSubheadline: 'Subtítulo',
    flyerPromoLine: 'Línea Promo',
    flyerInstagram: 'Instagram',
    flyerHours: 'Horario',
    flyerPreviewOnly: 'Solo Vista Previa',
    flyerQrUnlock: 'El QR se activa después de la compra del flyer.',
    freeQrLive: 'El flyer blanco gratis tiene QR activo al registrarte.',
  },
};

const PLACEHOLDER_IMAGES: PlaceholderImage[] = [
  { id: 'ph_drink_1', category: 'drinks', name: 'Coke', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_drink_2', category: 'drinks', name: 'Sprite', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_drink_3', category: 'drinks', name: 'Water', url: 'https://images.unsplash.com/photo-1564419439288-bd5042d1f9c4?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_drink_4', category: 'drinks', name: 'Horchata', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6cf7?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_drink_5', category: 'drinks', name: 'Jamaica', url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_taco_1', category: 'tacos', name: 'Street Tacos', url: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_taco_2', category: 'tacos', name: 'Birria Tacos', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_taco_3', category: 'tacos', name: 'Shrimp Tacos', url: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_burger_1', category: 'burgers', name: 'Burger Combo', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_burger_2', category: 'burgers', name: 'Cheese Burger', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_burger_3', category: 'burgers', name: 'Loaded Burger', url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_pizza_1', category: 'pizza', name: 'Pizza Slice', url: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_pizza_2', category: 'pizza', name: 'Whole Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_wings_1', category: 'wings', name: 'Hot Wings', url: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_wings_2', category: 'wings', name: 'Wing Combo', url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_plate_1', category: 'plates', name: 'Plate Lunch', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_plate_2', category: 'plates', name: 'Dinner Plate', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_dessert_1', category: 'desserts', name: 'Cake', url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_dessert_2', category: 'desserts', name: 'Cookies', url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_dessert_3', category: 'desserts', name: 'Ice Cream', url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_seafood_1', category: 'seafood', name: 'Seafood Plate', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_seafood_2', category: 'seafood', name: 'Shrimp Tray', url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_breakfast_1', category: 'breakfast', name: 'Breakfast Plate', url: 'https://images.unsplash.com/photo-1533089860892-a9c7f0a88666?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_breakfast_2', category: 'breakfast', name: 'Pancakes', url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_hotdog_1', category: 'hotdogs', name: 'Hot Dog', url: 'https://images.unsplash.com/photo-1612392062798-968bf07a7f02?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_hotdog_2', category: 'hotdogs', name: 'Loaded Dog', url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_sandwich_1', category: 'sandwiches', name: 'Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_sandwich_2', category: 'sandwiches', name: 'Club Sandwich', url: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_chicken_1', category: 'chicken', name: 'Fried Chicken', url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_chicken_2', category: 'chicken', name: 'Chicken Plate', url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_bbq_1', category: 'bbq', name: 'BBQ Plate', url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_bbq_2', category: 'bbq', name: 'Ribs', url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_snack_1', category: 'snacks', name: 'Snack Cup', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_snack_2', category: 'snacks', name: 'Loaded Snack', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_catering_1', category: 'catering', name: 'Catering Tray', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_catering_2', category: 'catering', name: 'Party Tray', url: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80' },

  { id: 'ph_mexican_1', category: 'mexican', name: 'Mexican Plate', url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80' },
  { id: 'ph_mexican_2', category: 'mexican', name: 'Burrito Plate', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80' },
];

const DAY_FIELDS: { key: HoursKey; labelKey: keyof CopyBlock }[] = [
  { key: 'hours_monday', labelKey: 'monday' },
  { key: 'hours_tuesday', labelKey: 'tuesday' },
  { key: 'hours_wednesday', labelKey: 'wednesday' },
  { key: 'hours_thursday', labelKey: 'thursday' },
  { key: 'hours_friday', labelKey: 'friday' },
  { key: 'hours_saturday', labelKey: 'saturday' },
  { key: 'hours_sunday', labelKey: 'sunday' },
];

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugifyValue(value: string) {
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

function getPlanFee(plan: 'starter' | 'growth' | 'premium') {
  if (plan === 'starter') {
    return { percent: '10%', monthly: '$19/mo' };
  }

  if (plan === 'growth') {
    return { percent: '5%', monthly: '$39/mo' };
  }

  return { percent: '3%', monthly: '$99/mo' };
}

function getPlaceholderLimit(plan: BuilderPlan) {
  if (plan === 'starter') return 6;
  return Number.POSITIVE_INFINITY;
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
      { name: 'Pepsi', price: '0' },
      { name: 'Sprite', price: '0' },
      { name: 'Water', price: '0' },
      { name: 'Horchata', price: '1' },
      { name: 'Jamaica', price: '1' },
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

  if (type === 'toppings') {
    return [
      { name: 'Cheese', price: '1' },
      { name: 'Jalapeños', price: '1' },
      { name: 'Bacon', price: '2' },
    ];
  }

  if (type === 'sauces') {
    return [
      { name: 'Ranch', price: '0' },
      { name: 'BBQ', price: '0' },
      { name: 'Hot Sauce', price: '0' },
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

function MiniIcon({ children }: { children: ReactNode }) {
  return <span className="miniIcon">{children}</span>;
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
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [storefrontLanguage, setStorefrontLanguage] = useState<LanguageMode>('en');
  const [orderLanguage, setOrderLanguage] = useState<LanguageMode>('en');
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryRadius, setDeliveryRadius] = useState('5');
  const [deliveryMinimum, setDeliveryMinimum] = useState('0');

  const [hours, setHours] = useState<Record<HoursKey, string>>({
    hours_monday: '',
    hours_tuesday: '',
    hours_wednesday: '',
    hours_thursday: '',
    hours_friday: '',
    hours_saturday: '',
    hours_sunday: '',
  });

  const [plan, setPlan] = useState<BuilderPlan>('starter');
  const [stripeConnected, setStripeConnected] = useState(false);

  const [categories, setCategories] = useState<BuilderCategory[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<SectionKey | null>('store');

  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [placeholderUsedCount, setPlaceholderUsedCount] = useState(0);
  const [selectedPlaceholderCategory, setSelectedPlaceholderCategory] = useState<PlaceholderCategory>('drinks');

  const [flyerStyle, setFlyerStyle] = useState<FlyerStyleKey>('generic');
  const [flyerPack, setFlyerPack] = useState<FlyerPack>('500');
  const [flyerBusinessName, setFlyerBusinessName] = useState('');
  const [flyerHeadline, setFlyerHeadline] = useState('');
  const [flyerSubheadline, setFlyerSubheadline] = useState('');
  const [flyerPromoLine, setFlyerPromoLine] = useState('');
  const [flyerInstagram, setFlyerInstagram] = useState('');
  const [flyerHours, setFlyerHours] = useState('');
  const [flyerPaid, setFlyerPaid] = useState(false);

  const previewLink = useMemo(() => {
    const slug = slugifyValue(name || '');
    if (!slug) return '';
    return `/store/${slug}`;
  }, [name]);

  const currentFee = useMemo(() => getPlanFee(plan), [plan]);

  const selectedCategory = useMemo(() => {
    for (const category of categories) {
      const match = category.items.find((item) => item.id === selectedItemId);
      if (match) return category;
    }
    return null;
  }, [categories, selectedItemId]);

  const selectedItem = useMemo(() => {
    for (const category of categories) {
      const match = category.items.find((item) => item.id === selectedItemId);
      if (match) return match;
    }
    return null;
  }, [categories, selectedItemId]);

  const filteredPlaceholderImages = useMemo(
    () => PLACEHOLDER_IMAGES.filter((item) => item.category === selectedPlaceholderCategory),
    [selectedPlaceholderCategory]
  );

  const freeFlyerQrUrl = useMemo(() => {
    const target =
      typeof window !== 'undefined'
        ? `${window.location.origin}${previewLink || '/store/your-store'}`
        : previewLink || '/store/your-store';

    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(target)}`;
  }, [previewLink]);

  const customFlyerPreviewQrUrl = useMemo(() => {
    const target =
      typeof window !== 'undefined'
        ? `${window.location.origin}/flyer-preview-only`
        : '/flyer-preview-only';

    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(target)}`;
  }, []);

  useEffect(() => {
    const loadBuilder = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setOwnerId(user.id);

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle<RestaurantRow>();

      if (restaurant) {
        setRestaurantId(restaurant.id);
        setName(restaurant.name || '');
        setPhone(restaurant.phone || '');
        setAddress(restaurant.address || '');
        setHeroImage(restaurant.hero_image || '');
        setLogoImage(restaurant.logo_image || '');
        setTheme((restaurant.storefront_theme as ThemeMode) || 'light');
        setStorefrontLanguage(((restaurant.storefront_language || 'en').toLowerCase() as LanguageMode) || 'en');
        setOrderLanguage(((restaurant.order_language || 'EN').toLowerCase() as LanguageMode) || 'en');
        setPickupEnabled(Boolean(restaurant.pickup_enabled ?? true));
        setDeliveryEnabled(Boolean(restaurant.delivery_enabled ?? false));
        setDeliveryFee(String(restaurant.delivery_fee ?? 0));
        setDeliveryRadius(String(restaurant.delivery_radius ?? 5));
        setDeliveryMinimum(String(restaurant.delivery_minimum ?? 0));
        setPlan((restaurant.plan as BuilderPlan) || 'starter');
        setStripeConnected(
          Boolean(
            restaurant.stripe_connected ||
              (restaurant.stripe_account_id && restaurant.stripe_charges_enabled && restaurant.stripe_payouts_enabled)
          )
        );

        setHours({
          hours_monday: restaurant.hours_monday || '',
          hours_tuesday: restaurant.hours_tuesday || '',
          hours_wednesday: restaurant.hours_wednesday || '',
          hours_thursday: restaurant.hours_thursday || '',
          hours_friday: restaurant.hours_friday || '',
          hours_saturday: restaurant.hours_saturday || '',
          hours_sunday: restaurant.hours_sunday || '',
        });

        const { data: categoryRows } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('sort_order', { ascending: true });

        const { data: itemRows } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('sort_order', { ascending: true });

        const itemIds = safeArray(itemRows).map((item) => item.id);

        let optionGroupRows: OptionGroupRow[] = [];
        let optionChoiceRows: OptionChoiceRow[] = [];

        if (itemIds.length) {
          const { data: groups } = await supabase
            .from('menu_option_groups')
            .select('*')
            .in('item_id', itemIds)
            .order('sort_order', { ascending: true });

          optionGroupRows = safeArray(groups);

          const groupIds = optionGroupRows.map((group) => group.id);

          if (groupIds.length) {
            const { data: choices } = await supabase
              .from('menu_option_choices')
              .select('*')
              .in('option_group_id', groupIds)
              .order('sort_order', { ascending: true });

            optionChoiceRows = safeArray(choices);
          }
        }

        const groupsByItem = new Map<string, BuilderOptionGroup[]>();

        for (const group of optionGroupRows) {
          const options = optionChoiceRows
            .filter((choice) => choice.option_group_id === group.id)
            .map((choice) => ({
              id: choice.id,
              name: choice.name || '',
              price: String(choice.price_delta ?? choice.price ?? 0),
            }));

          const normalizedGroup: BuilderOptionGroup = {
            id: group.id,
            name: group.name || '',
            required: Boolean(group.is_required),
            selection: normalizeSelectionMode(group),
            presetType: 'custom',
            options,
          };

          const key = group.item_id || '';
          const existing = groupsByItem.get(key) || [];
          existing.push(normalizedGroup);
          groupsByItem.set(key, existing);
        }

        const normalizedCategories: BuilderCategory[] = safeArray(categoryRows).map((category, categoryIndex) => ({
          id: category.id,
          name: category.name || '',
          sort_order: category.sort_order ?? categoryIndex,
          items: safeArray(itemRows)
            .filter((item) => item.category_id === category.id)
            .map((item) => ({
              id: item.id,
              category_id: category.id,
              name: item.name || '',
              base_price: String(item.base_price ?? item.price ?? 0),
              description: item.description || '',
              image_url: item.image_url || '',
              availability: normalizeAvailability(item),
              option_groups: groupsByItem.get(item.id) || [],
            })),
        }));

        setCategories(normalizedCategories);
        setSelectedItemId(normalizedCategories[0]?.items[0]?.id || null);

        const placeholderCount = normalizedCategories
          .flatMap((category) => category.items)
          .filter((item) => PLACEHOLDER_IMAGES.some((ph) => ph.url === item.image_url)).length;

        setPlaceholderUsedCount(placeholderCount);
      } else {
        const categoryId = uid('cat');
        const itemId = uid('item');

        setCategories([
          {
            id: categoryId,
            name: 'Featured',
            sort_order: 0,
            items: [
              {
                id: itemId,
                category_id: categoryId,
                name: '',
                base_price: '12',
                description: '',
                image_url: '',
                availability: 'available',
                option_groups: [],
              },
            ],
          },
        ]);
        setSelectedItemId(itemId);
      }

      setLoading(false);
    };

    void loadBuilder();
  }, [router]);

  function toggleSection(section: SectionKey) {
    setExpanded((current) => (current === section ? null : section));
  }

  function updateHours(day: HoursKey, value: string) {
    setHours((current) => ({ ...current, [day]: value }));
  }

  function updateCategory(categoryId: string, nextName: string) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId ? { ...category, name: nextName } : category
      )
    );
  }

  function addCategory() {
    const categoryId = uid('cat');
    const itemId = uid('item');

    setCategories((current) => [
      ...current,
      {
        id: categoryId,
        name: `${copy.menu} ${current.length + 1}`,
        sort_order: current.length,
        items: [
          {
            id: itemId,
            category_id: categoryId,
            name: '',
            base_price: '0',
            description: '',
            image_url: '',
            availability: 'available',
            option_groups: [],
          },
        ],
      },
    ]);

    setSelectedItemId(itemId);
    setExpanded('menu');
  }

  function addItem(categoryId: string) {
    const newItemId = uid('item');

    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  id: newItemId,
                  category_id: categoryId,
                  name: '',
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

    setSelectedItemId(newItemId);
    setExpanded('item');
  }

  function selectItem(itemId: string) {
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
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? { ...category, items: category.items.filter((item) => item.id !== itemId) }
          : category
      )
    );

    setSelectedItemId((current) => (current === itemId ? null : current));
  }

  function addOptionGroup(itemId: string, presetType: BuilderOptionGroup['presetType']) {
    const groupId = uid('group');

    const nextGroup: BuilderOptionGroup = {
      id: groupId,
      name: presetType === 'custom' ? copy.optionGroups : copy[presetType],
      required: false,
      selection: presetType === 'extras' || presetType === 'toppings' ? 'multiple' : 'single',
      presetType,
      options: getPresetOptions(presetType).map((option) => ({
        id: uid('choice'),
        name: option.name,
        price: option.price,
      })),
    };

    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? { ...item, option_groups: [...item.option_groups, nextGroup] }
            : item
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
                        options: [
                          ...group.options,
                          { id: uid('choice'), name: copy.newChoice, price: '0' },
                        ],
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
    patch: Partial<BuilderOptionChoice>
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

  function countPlaceholderUsage(nextCategories: BuilderCategory[]) {
    return nextCategories
      .flatMap((category) => category.items)
      .filter((item) => PLACEHOLDER_IMAGES.some((ph) => ph.url === item.image_url)).length;
  }

  function applyPlaceholderToSelectedItem(url: string) {
    if (!selectedItemId) return;

    setCategories((current) => {
      const next = current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === selectedItemId ? { ...item, image_url: url } : item
        ),
      }));

      const usage = countPlaceholderUsage(next);
      const limit = getPlaceholderLimit(plan);

      if (usage > limit) {
        setError(copy.starterLimitReached);
        return current;
      }

      setPlaceholderUsedCount(usage);
      setError('');
      return next;
    });
  }

  async function uploadImageToSupabase(file: File, folder: string) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('restaurant-images').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleHeroUpload(file: File | null) {
    if (!file) return;
    try {
      setUploadingHero(true);
      const publicUrl = await uploadImageToSupabase(file, 'hero');
      setHeroImage(publicUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.couldNotSave;
      setError(message);
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) return;
    try {
      setUploadingLogo(true);
      const publicUrl = await uploadImageToSupabase(file, 'logo');
      setLogoImage(publicUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.couldNotSave;
      setError(message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleItemImageUpload(itemId: string, file: File | null) {
    if (!file) return;
    try {
      setUploadingItemId(itemId);
      const publicUrl = await uploadImageToSupabase(file, 'items');
      updateItem(itemId, { image_url: publicUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.couldNotSave;
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
    updateItem(itemId, { image_url: '' });

    setCategories((current) => {
      const usage = countPlaceholderUsage(current);
      setPlaceholderUsedCount(usage);
      return current;
    });
  }

  async function handleSave() {
    try {
      if (!ownerId) {
        setError('User not authenticated.');
        return;
      }

      setSaving(true);
      setError('');
      setSuccess('');

      const generatedSlug = slugifyValue(name);

      const restaurantPayload = {
        owner_id: ownerId,
        name: name.trim() || null,
        slug: generatedSlug || null,
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
        plan,
        stripe_connected: stripeConnected,
        hours_monday: hours.hours_monday.trim() || null,
        hours_tuesday: hours.hours_tuesday.trim() || null,
        hours_wednesday: hours.hours_wednesday.trim() || null,
        hours_thursday: hours.hours_thursday.trim() || null,
        hours_friday: hours.hours_friday.trim() || null,
        hours_saturday: hours.hours_saturday.trim() || null,
        hours_sunday: hours.hours_sunday.trim() || null,
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

      if (!currentRestaurantId) {
        throw new Error('Missing restaurant id.');
      }

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
        name: category.name.trim() || `${copy.menu} ${categoryIndex + 1}`,
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
          name: item.name.trim() || copy.itemNameFallback,
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
            name: group.name.trim() || copy.optionGroups,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : copy.couldNotSave;
      setError(message || copy.couldNotSave);
    } finally {
      setSaving(false);
    }
  }

  async function handleGoLive() {
    if (!stripeConnected) {
      setError(copy.stripeNeeded);
      return;
    }

    await handleSave();
    setSuccess(copy.goLiveReady);
  }

  function SectionCard({
    section,
    icon,
    title,
    right,
    summary,
  }: {
    section: SectionKey;
    icon: ReactNode;
    title: string;
    right?: ReactNode;
    summary?: ReactNode;
  }) {
    return (
      <button type="button" className="sectionCard" onClick={() => toggleSection(section)}>
        <div className="sectionCardTop">
          <div className="sectionCardLeft">
            <MiniIcon>{icon}</MiniIcon>
            <span className="sectionCardTitle">{title}</span>
          </div>
          <div className="sectionCardRight">
            {right ? <span className="sectionCardMeta">{right}</span> : null}
            <span className="sectionCardArrow">›</span>
          </div>
        </div>
        {summary ? <div className="sectionCardSummary">{summary}</div> : null}
      </button>
    );
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
            <span className="brandSoft"> {copy.builderWord}</span>
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

        <section className="heroCard">
          <div className="heroWrap">
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
          </div>
        </section>

        <section className="introCard">
          <h1 className="title">{copy.title}</h1>
          <p className="subtitle">{copy.subtitle}</p>

          <Link href={previewLink || '#'} className={`previewButton ${!previewLink ? 'isDisabled' : ''}`}>
            {copy.previewStore}
          </Link>
        </section>

        <div className="sectionStack">
          <SectionCard
            section="store"
            icon="⌂"
            title={copy.storeSetup}
            summary={
              <div className="summaryLines">
                <strong>{name || copy.storeName}</strong>
                <span>{phone || copy.phone}</span>
                <span>{address || copy.address}</span>
              </div>
            }
          />

          {expanded === 'store' ? (
            <section className="panelCard">
              <div className="field">
                <label className="label">{copy.storeName}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="field">
                <label className="label">{copy.liveUrl}</label>
                <div className="urlPill">{previewLink || '/store/your-store'}</div>
              </div>

              <div className="field">
                <label className="label">{copy.phone}</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="field">
                <label className="label">{copy.address}</label>
                <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="hoursGrid">
                {DAY_FIELDS.map((day) => (
                  <div key={day.key} className="field">
                    <label className="label">{copy[day.labelKey]}</label>
                    <input
                      className="input"
                      value={hours[day.key]}
                      onChange={(e) => updateHours(day.key, e.target.value)}
                      placeholder="9am - 6pm / Closed"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <SectionCard
            section="branding"
            icon="▣"
            title={copy.branding}
            right={copy.heroAndLogoImages}
          />

          {expanded === 'branding' ? (
            <section className="panelCard">
              <div className="uploadBlock">
                <div className="uploadTitle">{copy.uploadHeroImage}</div>
                <label className="primaryButton fullWidth">
                  {uploadingHero ? copy.saving : copy.uploadHeroImage}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => void handleHeroUpload(e.target.files?.[0] || null)}
                  />
                </label>
                <button type="button" className="secondaryButton fullWidth" onClick={removeHeroImage}>
                  {copy.removeImage}
                </button>
                {heroImage ? (
                  <img src={heroImage} alt={copy.heroPreview} className="uploadPreview" />
                ) : (
                  <div className="imagePlaceholder">{copy.heroPreview}</div>
                )}
              </div>

              <div className="uploadBlock">
                <div className="uploadTitle">{copy.uploadLogo}</div>
                <label className="primaryButton fullWidth">
                  {uploadingLogo ? copy.saving : copy.uploadLogo}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => void handleLogoUpload(e.target.files?.[0] || null)}
                  />
                </label>
                <button type="button" className="secondaryButton fullWidth" onClick={removeLogoImage}>
                  {copy.removeImage}
                </button>
                {logoImage ? (
                  <img src={logoImage} alt={copy.logoPreview} className="uploadPreview logoPreview" />
                ) : (
                  <div className="imagePlaceholder">{copy.logoPreview}</div>
                )}
              </div>
            </section>
          ) : null}

          <SectionCard
            section="theme"
            icon="◐"
            title={copy.theme}
            right={theme === 'dark' ? copy.dark : copy.light}
          />

          {expanded === 'theme' ? (
            <section className="panelCard">
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

              <div className="chipRow">
                <button
                  type="button"
                  className={`chip ${orderLanguage === 'en' ? 'chipActive' : ''}`}
                  onClick={() => setOrderLanguage('en')}
                >
                  {copy.english}
                </button>
                <button
                  type="button"
                  className={`chip ${orderLanguage === 'es' ? 'chipActive' : ''}`}
                  onClick={() => setOrderLanguage('es')}
                >
                  {copy.spanish}
                </button>
              </div>

              <div className="chipRow">
                <button
                  type="button"
                  className={`chip ${pickupEnabled ? 'chipActive' : ''}`}
                  onClick={() => setPickupEnabled((value) => !value)}
                >
                  {pickupEnabled ? copy.pickupOn : copy.pickupOff}
                </button>
                <button
                  type="button"
                  className={`chip ${deliveryEnabled ? 'chipActive' : ''}`}
                  onClick={() => setDeliveryEnabled((value) => !value)}
                >
                  {deliveryEnabled ? copy.deliveryOn : copy.deliveryOff}
                </button>
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

              <div className="planRow">
                <button
                  type="button"
                  className={`planCard ${plan === 'starter' ? 'planCardActive' : ''}`}
                  onClick={() => setPlan('starter')}
                >
                  <strong>{copy.starterPlan}</strong>
                  <span>{copy.firstMonthFree} • 10% {copy.perOrder}</span>
                </button>

                <button
                  type="button"
                  className={`planCard ${plan === 'growth' ? 'planCardActive' : ''}`}
                  onClick={() => setPlan('growth')}
                >
                  <strong>{copy.growthPlan}</strong>
                  <span>$39/mo • 5% {copy.perOrder}</span>
                </button>

                <button
                  type="button"
                  className={`planCard ${plan === 'premium' ? 'planCardActive' : ''}`}
                  onClick={() => setPlan('premium')}
                >
                  <strong>{copy.premiumPlan}</strong>
                  <span>$99/mo • 3% {copy.perOrder}</span>
                </button>
              </div>
            </section>
          ) : null}

          <SectionCard
            section="menu"
            icon="▦"
            title={copy.menu}
            right={copy.categoriesAndItems}
          />

          {expanded === 'menu' ? (
            <section className="panelCard">
              <button type="button" className="primaryButton fullWidth" onClick={addCategory}>
                {copy.addCategory}
              </button>

              <div className="categoryList">
                {categories.map((category) => (
                  <div key={category.id} className="categoryCard">
                    <div className="field">
                      <label className="label">{copy.categoryName}</label>
                      <input
                        className="input"
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, e.target.value)}
                      />
                    </div>

                    <button type="button" className="secondaryButton fullWidth" onClick={() => addItem(category.id)}>
                      {copy.addItem}
                    </button>

                    {category.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`itemListButton ${selectedItemId === item.id ? 'itemListButtonActive' : ''}`}
                        onClick={() => selectItem(item.id)}
                      >
                        <span>{item.name || copy.itemNameFallback}</span>
                        <strong>{money(item.base_price)}</strong>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <SectionCard section="item" icon="□" title={copy.itemBuilder} />

          {expanded === 'item' && selectedItem ? (
            <section className="panelCard">
              <div className="uploadBlock">
                <div className="uploadTitle">{copy.uploadItemImage}</div>
                <label className="primaryButton fullWidth">
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
                  className="secondaryButton fullWidth"
                  onClick={() => removeItemImage(selectedItem.id)}
                >
                  {copy.removeImage}
                </button>

                {selectedItem.image_url ? (
                  <img src={selectedItem.image_url} alt={copy.itemPreview} className="uploadPreview" />
                ) : (
                  <div className="imagePlaceholder">{copy.itemPreview}</div>
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
                  onChange={(e) => updateItem(selectedItem.id, { base_price: sanitizeNumberInput(e.target.value) })}
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
                <label className="label">{copy.placeholderGallery}</label>
                <div className="placeholderCategoryRow">
                  {[
                    'drinks',
                    'tacos',
                    'burgers',
                    'pizza',
                    'wings',
                    'plates',
                    'desserts',
                    'seafood',
                    'breakfast',
                    'hotdogs',
                    'sandwiches',
                    'chicken',
                    'bbq',
                    'snacks',
                    'catering',
                    'mexican',
                  ].map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`chip ${selectedPlaceholderCategory === category ? 'chipActive' : ''}`}
                      onClick={() => setSelectedPlaceholderCategory(category as PlaceholderCategory)}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="placeholderMeta">
                  {copy.placeholdersUsed}: {placeholderUsedCount}
                </div>

                <div className="placeholderGrid">
                  {filteredPlaceholderImages.map((placeholder) => (
                    <button
                      key={placeholder.id}
                      type="button"
                      className="placeholderCard"
                      onClick={() => applyPlaceholderToSelectedItem(placeholder.url)}
                    >
                      <img src={placeholder.url} alt={placeholder.name} className="placeholderImage" />
                      <span className="placeholderName">{placeholder.name}</span>
                    </button>
                  ))}
                </div>

                {plan === 'starter' ? <div className="limitNote">{copy.starterLimitReached}</div> : null}
              </div>

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

              {selectedCategory ? (
                <button
                  type="button"
                  className="dangerWide"
                  onClick={() => deleteItem(selectedCategory.id, selectedItem.id)}
                >
                  {copy.deleteItem}
                </button>
              ) : null}
            </section>
          ) : null}

          <SectionCard section="options" icon="⋯" title={copy.optionGroups} />

          {expanded === 'options' && selectedItem ? (
            <section className="panelCard">
              <div className="chipRow">
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.id, 'protein')}>
                  {copy.protein}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.id, 'size')}>
                  {copy.size}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.id, 'drink')}>
                  {copy.drink}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.id, 'extras')}>
                  {copy.extras}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.id, 'removals')}>
                  {copy.removals}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.id, 'toppings')}>
                  {copy.toppings}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.id, 'sauces')}>
                  {copy.sauces}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.id, 'custom')}>
                  {copy.custom}
                </button>
              </div>

              {selectedItem.option_groups.length ? (
                <div className="optionGroupList">
                  {selectedItem.option_groups.map((group) => (
                    <div key={group.id} className="optionGroupCard">
                      <div className="field">
                        <label className="label">{copy.optionGroups}</label>
                        <input
                          className="input"
                          value={group.name}
                          onChange={(e) => updateOptionGroup(selectedItem.id, group.id, { name: e.target.value })}
                        />
                      </div>

                      <div className="chipRow">
                        <button
                          type="button"
                          className={`chip ${group.required ? 'chipActive' : ''}`}
                          onClick={() => updateOptionGroup(selectedItem.id, group.id, { required: !group.required })}
                        >
                          {group.required ? copy.required : copy.optional}
                        </button>

                        <button
                          type="button"
                          className={`chip ${group.selection === 'single' ? 'chipActive' : ''}`}
                          onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'single' })}
                        >
                          {copy.singleChoice}
                        </button>

                        <button
                          type="button"
                          className={`chip ${group.selection === 'multiple' ? 'chipActive' : ''}`}
                          onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'multiple' })}
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
                              className="dangerButton"
                              onClick={() => deleteOptionChoice(selectedItem.id, group.id, option.id)}
                            >
                              {copy.more}
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="secondaryButton fullWidth"
                          onClick={() => addOptionChoice(selectedItem.id, group.id)}
                        >
                          {copy.addChoice}
                        </button>
                      </div>

                      <button
                        type="button"
                        className="dangerWide"
                        onClick={() => deleteOptionGroup(selectedItem.id, group.id)}
                      >
                        {copy.more}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyState">{copy.noOptionGroups}</div>
              )}
            </section>
          ) : null}

          <SectionCard
            section="flyers"
            icon="⌁"
            title={copy.flyers}
            right={copy.customFlyers}
            summary={
              <div className="summaryLines">
                <strong>{copy.freeFlyer}</strong>
                <span>{copy.freeQrLive}</span>
              </div>
            }
          />

          {expanded === 'flyers' ? (
            <section className="panelCard">
              <div className="flyerBox">
                <div className="flyerTitle">{copy.freeFlyer}</div>
                <div className="flyerSub">{copy.freeQrLive}</div>
                <div className="qrCard">
                  <img src={freeFlyerQrUrl} alt="QR code" className="qrImage" />
                </div>
              </div>

              <div className="flyerBox">
                <div className="flyerTitle">{copy.customFlyers}</div>
                <div className="flyerSub">{copy.flyerQrUnlock}</div>

                <div className="field">
                  <label className="label">{copy.flyerStyle}</label>
                  <div className="flyerStyleGrid">
                    {(['generic', 'hibachi', 'dessert', 'hotdog', 'seafood', 'tacos', 'snacks'] as FlyerStyleKey[]).map((style) => (
                      <button
                        key={style}
                        type="button"
                        className={`chip ${flyerStyle === style ? 'chipActive' : ''}`}
                        onClick={() => setFlyerStyle(style)}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="label">{copy.flyerBusinessName}</label>
                  <input className="input" value={flyerBusinessName} onChange={(e) => setFlyerBusinessName(e.target.value)} />
                </div>

                <div className="field">
                  <label className="label">{copy.flyerHeadline}</label>
                  <input className="input" value={flyerHeadline} onChange={(e) => setFlyerHeadline(e.target.value)} />
                </div>

                <div className="field">
                  <label className="label">{copy.flyerSubheadline}</label>
                  <input className="input" value={flyerSubheadline} onChange={(e) => setFlyerSubheadline(e.target.value)} />
                </div>

                <div className="field">
                  <label className="label">{copy.flyerPromoLine}</label>
                  <input className="input" value={flyerPromoLine} onChange={(e) => setFlyerPromoLine(e.target.value)} />
                </div>

                <div className="field">
                  <label className="label">{copy.flyerInstagram}</label>
                  <input className="input" value={flyerInstagram} onChange={(e) => setFlyerInstagram(e.target.value)} />
                </div>

                <div className="field">
                  <label className="label">{copy.flyerHours}</label>
                  <input className="input" value={flyerHours} onChange={(e) => setFlyerHours(e.target.value)} />
                </div>

                <div className="customFlyerPreview">
                  <div className={`customFlyerCanvas flyerStyle-${flyerStyle}`}>
                    <div className="customFlyerHeader">
                      <div className="customFlyerBusiness">{flyerBusinessName || name || 'Business Name'}</div>
                      <div className="customFlyerHeadline">{flyerHeadline || 'SCAN TO ORDER'}</div>
                      <div className="customFlyerSubheadline">{flyerSubheadline || flyerPromoLine || 'Fresh food. Fast pickup.'}</div>
                    </div>

                    <div className="customFlyerQrWrap">
                      <img
                        src={flyerPaid ? freeFlyerQrUrl : customFlyerPreviewQrUrl}
                        alt="Custom flyer QR"
                        className={`customFlyerQr ${flyerPaid ? '' : 'qrPreviewOnly'}`}
                      />
                      {!flyerPaid ? <div className="previewWatermark">{copy.flyerPreviewOnly}</div> : null}
                    </div>

                    <div className="customFlyerFooter">
                      <div>{address || '123 Main St'}</div>
                      <div>{phone || '323-555-1212'}</div>
                      <div>{flyerInstagram || '@yourbusiness'}</div>
                      <div>{flyerHours || 'Mon-Sun 10am-8pm'}</div>
                    </div>
                  </div>
                </div>

                <div className="pricingGrid">
                  <button type="button" className={`priceCard ${flyerPack === '100' ? 'priceCardActive' : ''}`} onClick={() => setFlyerPack('100')}>
                    <strong>100</strong>
                    <span>$120</span>
                  </button>

                  <button type="button" className={`priceCard ${flyerPack === '250' ? 'priceCardActive' : ''}`} onClick={() => setFlyerPack('250')}>
                    <strong>250</strong>
                    <span>$250</span>
                  </button>

                  <button type="button" className={`priceCard bestValueCard ${flyerPack === '500' ? 'priceCardActive' : ''}`} onClick={() => setFlyerPack('500')}>
                    <em>{copy.bestValue}</em>
                    <strong>500</strong>
                    <span>$450</span>
                  </button>
                </div>

                <div className="goLiveActions">
                  <button type="button" className="secondaryButton" onClick={() => setFlyerPaid(true)}>
                    Unlock Custom Flyer QR
                  </button>
                </div>
              </div>

              <div className="goLiveBox">
                <div className="goLiveTitle">{copy.goLiveReady}</div>
                <div className="goLiveSub">
                  {plan === 'starter' ? copy.starterPlan : plan === 'growth' ? copy.growthPlan : copy.premiumPlan}
                  {' • '}
                  {plan === 'starter' ? copy.firstMonthFree : currentFee.monthly}
                  {' • '}
                  {currentFee.percent} {copy.perOrder}
                </div>

                <div className="goLiveActions">
                  <button type="button" className="secondaryButton" onClick={() => setStripeConnected(true)}>
                    {copy.connectStripe}
                  </button>
                  <button type="button" className="primaryButton" onClick={handleGoLive}>
                    {copy.goLive}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <nav className="bottomNav">
            <Link href="/dashboard/owner" className="navItem">
              <span className="navDot" />
              <span>{copy.dashboard}</span>
            </Link>
            <Link href="/dashboard/owner/builder" className="navItem navItemActive">
              <span className="navDot" />
              <span>{copy.builder}</span>
            </Link>
            <Link href={previewLink || '#'} className={`navItem ${!previewLink ? 'isDisabled' : ''}`}>
              <span className="navDot" />
              <span>{copy.preview}</span>
            </Link>
            <button type="button" className="navItem" onClick={() => setExpanded('flyers')}>
              <span className="navDot" />
              <span>{copy.flyers}</span>
            </button>
            <Link href="/dashboard/owner/orders" className="navItem">
              <span className="navDot" />
              <span>{copy.orders}</span>
            </Link>
            <Link href="/dashboard/owner/settings" className="navItem">
              <span className="navDot" />
              <span>{copy.more}</span>
            </Link>
          </nav>
        </div>

        <style jsx global>{`
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
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
          }

          .brand {
            color: #111827;
            font-size: 18px;
            line-height: 1;
            white-space: nowrap;
          }

          .brandStrong {
            font-weight: 900;
            letter-spacing: 0.02em;
          }

          .brandSoft {
            color: #6b7280;
            font-weight: 700;
            letter-spacing: 0.02em;
          }

          .topActions {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .langButton,
          .saveButton,
          .primaryButton,
          .secondaryButton,
          .dangerButton,
          .chip,
          .previewButton,
          .itemListButton,
          .priceCard {
            min-height: 44px;
            border-radius: 14px;
            border: 1px solid rgba(15, 23, 42, 0.12);
            background: #ffffff;
            color: #111827;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 14px;
            font-size: 15px;
            font-weight: 800;
            text-decoration: none;
          }

          .saveButton,
          .primaryButton,
          .previewButton {
            background: #0f172a;
            border-color: #0f172a;
            color: #ffffff;
          }

          .secondaryButton {
            background: #f8fafc;
          }

          .dangerButton,
          .dangerWide {
            background: #f7e2e2;
            border-color: transparent;
            color: #9f2f2f;
          }

          .fullWidth,
          .dangerWide {
            width: 100%;
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

          .heroCard {
            margin: 0 -14px;
            overflow: hidden;
          }

          .heroWrap {
            position: relative;
            min-height: 190px;
            background: #111827;
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
            background: linear-gradient(135deg, #111827 0%, #334155 100%);
          }

          .heroOverlay {
            position: relative;
            min-height: 190px;
            display: flex;
            align-items: flex-end;
            padding: 16px;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.64) 100%);
          }

          .heroIdentity {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }

          .heroLogo,
          .heroLogoFallback {
            width: 60px;
            height: 60px;
            border-radius: 999px;
            flex-shrink: 0;
            background: #ffffff;
          }

          .heroLogo {
            object-fit: cover;
          }

          .heroLogoFallback {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #111827;
            font-size: 24px;
            font-weight: 900;
          }

          .heroText {
            min-width: 0;
          }

          .heroName {
            color: #ffffff;
            font-size: 22px;
            font-weight: 900;
          }

          .heroMetaRow {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 6px;
            color: rgba(255, 255, 255, 0.94);
            font-size: 14px;
            font-weight: 700;
          }

          .introCard {
            padding: 18px 2px 14px;
            display: grid;
            gap: 8px;
          }

          .title {
            margin: 0;
            color: #111827;
            font-size: 28px;
            font-weight: 900;
          }

          .subtitle {
            margin: 0;
            color: #6b7280;
            font-size: 15px;
            font-weight: 600;
          }

          .previewButton {
            margin-top: 10px;
            width: 100%;
          }

          .isDisabled {
            pointer-events: none;
            opacity: 0.5;
          }

          .sectionStack {
            display: grid;
            gap: 12px;
          }

          .sectionCard,
          .panelCard,
          .categoryCard,
          .optionGroupCard,
          .flyerBox,
          .goLiveBox {
            width: 100%;
            border-radius: 18px;
            border: 1px solid rgba(15, 23, 42, 0.1);
            background: #ffffff;
          }

          .sectionCard {
            padding: 14px;
            text-align: left;
          }

          .sectionCardTop {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .sectionCardLeft,
          .sectionCardRight {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .sectionCardTitle {
            color: #111827;
            font-size: 18px;
            font-weight: 900;
          }

          .sectionCardMeta,
          .sectionCardArrow,
          .sectionCardSummary {
            color: #6b7280;
            font-size: 14px;
            font-weight: 700;
          }

          .sectionCardSummary {
            margin-top: 10px;
          }

          .summaryLines {
            display: grid;
            gap: 4px;
          }

          .summaryLines strong {
            color: #111827;
            font-size: 16px;
            font-weight: 900;
          }

          .panelCard,
          .categoryCard,
          .optionGroupCard,
          .flyerBox,
          .goLiveBox {
            padding: 14px;
            display: grid;
            gap: 12px;
          }

          .field,
          .uploadBlock,
          .categoryList,
          .optionGroupList,
          .choiceList {
            display: grid;
            gap: 10px;
          }

          .hoursGrid {
            display: grid;
            gap: 10px;
          }

          .label {
            color: #6b7280;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .input,
          .textarea,
          .urlPill {
            width: 100%;
            border-radius: 14px;
            border: 1px solid rgba(15, 23, 42, 0.12);
            background: #ffffff;
            color: #111827;
            font-size: 16px;
            font-weight: 700;
            min-height: 52px;
            padding: 0 14px;
          }

          .textarea {
            min-height: 120px;
            padding: 14px;
            resize: vertical;
          }

          .urlPill {
            display: flex;
            align-items: center;
            background: #f8fafc;
            word-break: break-word;
          }

          .uploadTitle,
          .flyerTitle,
          .goLiveTitle {
            color: #111827;
            font-size: 15px;
            font-weight: 800;
          }

          .flyerSub,
          .goLiveSub,
          .placeholderMeta,
          .limitNote {
            color: #6b7280;
            font-size: 14px;
            font-weight: 700;
          }

          .uploadPreview,
          .imagePlaceholder {
            width: 100%;
            border-radius: 16px;
            min-height: 180px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eef1f5;
            color: #6b7280;
            font-size: 15px;
            font-weight: 900;
          }

          .uploadPreview {
            object-fit: cover;
          }

          .logoPreview {
            max-height: 240px;
            object-fit: contain;
            background: #ffffff;
            border: 1px solid rgba(15, 23, 42, 0.08);
          }

          .chipRow,
          .placeholderCategoryRow,
          .flyerStyleGrid,
          .goLiveActions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .chip {
            background: #ffffff;
          }

          .chipActive,
          .planCardActive,
          .priceCardActive {
            background: #0f172a;
            color: #ffffff;
            border-color: #0f172a;
          }

          .itemListButton {
            justify-content: space-between;
            width: 100%;
            background: #ffffff;
            color: #111827;
          }

          .itemListButtonActive {
            background: #0f172a;
            color: #ffffff;
            border-color: #0f172a;
          }

          .choiceRow {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .choiceName {
            flex: 1 1 auto;
          }

          .choicePrice {
            width: 96px;
          }

          .emptyState {
            border-radius: 14px;
            border: 1px dashed rgba(15, 23, 42, 0.14);
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 16px;
            font-weight: 800;
            background: #fafafa;
          }

          .miniIcon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: #f3f4f6;
            color: #111827;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 900;
            flex-shrink: 0;
          }

          .placeholderGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .placeholderCard {
            border-radius: 14px;
            overflow: hidden;
            border: 1px solid rgba(15, 23, 42, 0.1);
            background: #ffffff;
            padding: 0;
          }

          .placeholderImage {
            width: 100%;
            aspect-ratio: 1.1 / 1;
            object-fit: cover;
            display: block;
          }

          .placeholderName {
            display: block;
            padding: 10px;
            color: #111827;
            font-size: 13px;
            font-weight: 800;
            text-align: left;
          }

          .planRow {
            display: grid;
            gap: 10px;
          }

          .planCard {
            min-height: 70px;
            border-radius: 16px;
            border: 1px solid rgba(15, 23, 42, 0.1);
            background: #ffffff;
            color: #111827;
            padding: 12px;
            display: grid;
            gap: 4px;
            text-align: left;
          }

          .planCard strong {
            font-size: 16px;
            font-weight: 900;
          }

          .planCard span {
            font-size: 13px;
            font-weight: 700;
            color: inherit;
          }

          .qrCard {
            border-radius: 18px;
            background: #ffffff;
            border: 1px solid rgba(15, 23, 42, 0.08);
            padding: 14px;
            display: grid;
            place-items: center;
          }

          .qrImage,
          .customFlyerQr {
            width: 220px;
            max-width: 100%;
            border-radius: 12px;
            display: block;
          }

          .pricingGrid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .priceCard {
            display: grid;
            gap: 6px;
            justify-items: center;
            padding: 12px;
          }

          .priceCard strong {
            color: inherit;
            font-size: 18px;
            font-weight: 900;
          }

          .priceCard span,
          .bestValueCard em {
            color: inherit;
            font-size: 13px;
            font-weight: 800;
          }

          .bestValueCard {
            background: #fff7ed;
            border-color: rgba(249, 115, 22, 0.18);
          }

          .customFlyerPreview {
            width: 100%;
          }

          .customFlyerCanvas {
            border-radius: 18px;
            padding: 18px;
            min-height: 420px;
            display: grid;
            gap: 18px;
            align-content: start;
            border: 1px solid rgba(15, 23, 42, 0.08);
            background: linear-gradient(180deg, #111827 0%, #1f2937 100%);
            color: #ffffff;
            position: relative;
            overflow: hidden;
          }

          .flyerStyle-hibachi { background: linear-gradient(180deg, #0f172a 0%, #7c2d12 100%); }
          .flyerStyle-dessert { background: linear-gradient(180deg, #7c2d12 0%, #f59e0b 100%); }
          .flyerStyle-hotdog { background: linear-gradient(180deg, #7f1d1d 0%, #b45309 100%); }
          .flyerStyle-seafood { background: linear-gradient(180deg, #0c4a6e 0%, #1d4ed8 100%); }
          .flyerStyle-tacos { background: linear-gradient(180deg, #14532d 0%, #ca8a04 100%); }
          .flyerStyle-snacks { background: linear-gradient(180deg, #6d28d9 0%, #db2777 100%); }

          .customFlyerHeader {
            display: grid;
            gap: 6px;
            text-align: center;
          }

          .customFlyerBusiness {
            font-size: 28px;
            font-weight: 900;
            line-height: 1.05;
          }

          .customFlyerHeadline {
            font-size: 32px;
            font-weight: 900;
            line-height: 1;
          }

          .customFlyerSubheadline {
            font-size: 15px;
            font-weight: 700;
            opacity: 0.95;
          }

          .customFlyerQrWrap {
            position: relative;
            display: grid;
            place-items: center;
          }

          .previewWatermark {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            font-size: 18px;
            font-weight: 900;
            color: rgba(255,255,255,0.92);
            background: rgba(0,0,0,0.25);
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .qrPreviewOnly {
            filter: blur(1.4px) opacity(0.75);
          }

          .customFlyerFooter {
            display: grid;
            gap: 6px;
            font-size: 14px;
            font-weight: 800;
            text-align: center;
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
            border: 0;
            text-decoration: none;
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

          @media (max-width: 390px) {
            .pricingGrid,
            .placeholderGrid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </main>
  );
}

     