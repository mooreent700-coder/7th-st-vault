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
  | 'mexican'
  | 'soul_food'
  | 'pollo'
  | 'coffee';

type FlyerStyle =
  | 'generic'
  | 'hibachi'
  | 'dessert'
  | 'hotdog'
  | 'seafood'
  | 'tacos'
  | 'snacks'
  | 'bbq'
  | 'soul_food'
  | 'pollo'
  | 'coffee';

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
    | 'combo'
    | 'protein'
    | 'size'
    | 'drink'
    | 'sides'
    | 'extras'
    | 'removals'
    | 'custom';
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

type PlaceholderImage = {
  id: string;
  category: PlaceholderCategory;
  name: string;
  url: string;
};

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
  combo: string;
  protein: string;
  size: string;
  drink: string;
  sides: string;
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
  selectCategory: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  openTime: string;
  closeTime: string;
  openClosed: string;
};

const COPY: Record<LanguageMode, CopyBlock> = {
  en: {
    builderWord: 'BUILDER',
    loading: 'Loading builder...',
    saving: 'Saving...',
    save: 'Save',
    title: 'Build Your Store',
    subtitle: 'Upload branding, build your menu, go live.',
    previewStore: 'Preview Store',
    storeSetup: 'Store Setup',
    storeName: 'Store Name',
    phone: 'Phone',
    address: 'Address',
    liveUrl: 'Live URL',
    hours: 'Hours',
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
    combo: 'Combo',
    protein: 'Protein',
    size: 'Size',
    drink: 'Drink',
    sides: 'Sides',
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
    flyerPreviewOnly: 'PREVIEW ONLY',
    flyerQrUnlock: 'QR becomes live after flyer purchase.',
    freeQrLive: 'Free white flyer QR is live with signup.',
    selectCategory: 'Select Category',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    openTime: 'Open',
    closeTime: 'Close',
    openClosed: 'Open / Closed',
  },
  es: {
    builderWord: 'BUILDER',
    loading: 'Cargando builder...',
    saving: 'Guardando...',
    save: 'Guardar',
    title: 'Construye Tu Tienda',
    subtitle: 'Sube tu marca, arma tu menú y sal en vivo.',
    previewStore: 'Vista Previa',
    storeSetup: 'Configuración',
    storeName: 'Nombre del Negocio',
    phone: 'Teléfono',
    address: 'Dirección',
    liveUrl: 'URL En Vivo',
    hours: 'Horario',
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
    combo: 'Combo',
    protein: 'Proteína',
    size: 'Tamaño',
    drink: 'Bebida',
    sides: 'Acompañamientos',
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
    flyerPreviewOnly: 'SOLO PREVIA',
    flyerQrUnlock: 'El QR se activa después de la compra del flyer.',
    freeQrLive: 'El flyer blanco gratis tiene QR activo al registrarte.',
    selectCategory: 'Elegir Categoría',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
    openTime: 'Abrir',
    closeTime: 'Cerrar',
    openClosed: 'Abierto / Cerrado',
  },
};

const DEFAULT_HOURS: HoursState = {
  monday: { isOpen: false, open: '09:00', close: '18:00' },
  tuesday: { isOpen: false, open: '09:00', close: '18:00' },
  wednesday: { isOpen: false, open: '09:00', close: '18:00' },
  thursday: { isOpen: false, open: '09:00', close: '18:00' },
  friday: { isOpen: false, open: '09:00', close: '18:00' },
  saturday: { isOpen: false, open: '09:00', close: '18:00' },
  sunday: { isOpen: false, open: '09:00', close: '18:00' },
};

const TIME_OPTIONS = [
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
];

const DAY_ORDER: HoursDayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const PLACEHOLDER_IMAGES: PlaceholderImage[] = [
  { id: 'drinks_1', category: 'drinks', name: 'Soda Flight', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80' },
  { id: 'drinks_2', category: 'drinks', name: 'Soft Drinks', url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80' },
  { id: 'drinks_3', category: 'drinks', name: 'Cold Drinks', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80' },

  { id: 'tacos_1', category: 'tacos', name: 'Street Tacos', url: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1200&q=80' },
  { id: 'tacos_2', category: 'tacos', name: 'Birria Tacos', url: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80' },
  { id: 'tacos_3', category: 'tacos', name: 'Taco Plate', url: 'https://images.unsplash.com/photo-1604467715878-83e57e8bc129?auto=format&fit=crop&w=1200&q=80' },

  { id: 'burgers_1', category: 'burgers', name: 'Burger Combo', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80' },
  { id: 'burgers_2', category: 'burgers', name: 'Loaded Burger', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80' },
  { id: 'burgers_3', category: 'burgers', name: 'Burger Basket', url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=80' },

  { id: 'pizza_1', category: 'pizza', name: 'Pizza Slice', url: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80' },
  { id: 'pizza_2', category: 'pizza', name: 'Whole Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80' },

  { id: 'wings_1', category: 'wings', name: 'Hot Wings', url: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=1200&q=80' },
  { id: 'wings_2', category: 'wings', name: 'Wing Basket', url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1200&q=80' },

  { id: 'plates_1', category: 'plates', name: 'Plate Lunch', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80' },
  { id: 'plates_2', category: 'plates', name: 'Dinner Plate', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80' },

  { id: 'desserts_1', category: 'desserts', name: 'Dessert', url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80' },
  { id: 'desserts_2', category: 'desserts', name: 'Donuts', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80' },
  { id: 'desserts_3', category: 'desserts', name: 'Ice Cream', url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80' },

  { id: 'seafood_1', category: 'seafood', name: 'Seafood Plate', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80' },
  { id: 'seafood_2', category: 'seafood', name: 'Shrimp Plate', url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=1200&q=80' },
  { id: 'seafood_3', category: 'seafood', name: 'Seafood Boil', url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80' },

  { id: 'breakfast_1', category: 'breakfast', name: 'Breakfast Plate', url: 'https://images.unsplash.com/photo-1533089860892-a9c7f0a88666?auto=format&fit=crop&w=1200&q=80' },
  { id: 'breakfast_2', category: 'breakfast', name: 'Pancakes', url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80' },
  { id: 'breakfast_3', category: 'breakfast', name: 'Breakfast Burrito', url: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80' },

  { id: 'hotdogs_1', category: 'hotdogs', name: 'Hotdog Combo', url: 'https://images.unsplash.com/photo-1612392062798-968bf07a7f02?auto=format&fit=crop&w=1200&q=80' },
  { id: 'hotdogs_2', category: 'hotdogs', name: 'Loaded Hotdog', url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1200&q=80' },

  { id: 'sandwiches_1', category: 'sandwiches', name: 'Sandwich Combo', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80' },
  { id: 'sandwiches_2', category: 'sandwiches', name: 'Club Sandwich', url: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=1200&q=80' },

  { id: 'chicken_1', category: 'chicken', name: 'Chicken Plate', url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80' },
  { id: 'chicken_2', category: 'chicken', name: 'Fried Chicken', url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=1200&q=80' },

  { id: 'bbq_1', category: 'bbq', name: 'BBQ Plate', url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=80' },
  { id: 'bbq_2', category: 'bbq', name: 'Ribs Combo', url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80' },
  { id: 'bbq_3', category: 'bbq', name: 'Brisket Tray', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80' },

  { id: 'snacks_1', category: 'snacks', name: 'Snack Cup', url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80' },
  { id: 'snacks_2', category: 'snacks', name: 'Loaded Snack', url: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80' },

  { id: 'catering_1', category: 'catering', name: 'Catering Tray', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80' },
  { id: 'catering_2', category: 'catering', name: 'Family Pack', url: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80' },

  { id: 'mexican_1', category: 'mexican', name: 'Mexican Plate', url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80' },
  { id: 'mexican_2', category: 'mexican', name: 'Burrito Combo', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80' },

  { id: 'soul_food_1', category: 'soul_food', name: 'Soul Food Plate', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80' },
  { id: 'soul_food_2', category: 'soul_food', name: 'Mac & Cheese Plate', url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=1200&q=80' },
  { id: 'soul_food_3', category: 'soul_food', name: 'Baked Chicken Plate', url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80' },

  { id: 'pollo_1', category: 'pollo', name: 'Pollo Plate', url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80' },
  { id: 'pollo_2', category: 'pollo', name: 'Grilled Pollo', url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80' },

  { id: 'coffee_1', category: 'coffee', name: 'Coffee Drink', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80' },
  { id: 'coffee_2', category: 'coffee', name: 'Iced Coffee', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80' },
];

const CATEGORY_PRESETS: Record<
  PlaceholderCategory,
  {
    itemNames: string[];
    comboOptions: string[];
    proteinOptions?: string[];
    sideOptions?: string[];
    drinkOptions?: string[];
  }
> = {
  drinks: {
    itemNames: ['Drink Combo', 'Large Drink', 'Bottle Drink'],
    comboOptions: ['Drink only', 'Drink + chips', 'Drink + snack'],
    drinkOptions: ['Coke', 'Pepsi', 'Sprite', 'Water'],
  },
  tacos: {
    itemNames: ['Taco Combo', 'Street Tacos', 'Taco Plate'],
    comboOptions: ['Combo', 'Item only', 'Item + side', 'Family pack'],
    proteinOptions: ['Chicken', 'Beef', 'Shrimp', 'Birria'],
    sideOptions: ['Rice', 'Beans', 'Fries'],
    drinkOptions: ['Coke', 'Sprite', 'Horchata', 'Jamaica'],
  },
  burgers: {
    itemNames: ['Burger Combo', 'Loaded Burger', 'Cheese Burger Combo'],
    comboOptions: ['Combo', 'Item only', 'Item + side'],
    sideOptions: ['Fries', 'Onion Rings'],
    drinkOptions: ['Coke', 'Pepsi', 'Sprite', 'Water'],
  },
  pizza: {
    itemNames: ['Pizza Combo', 'Whole Pizza', 'Slice Combo'],
    comboOptions: ['Combo', 'Item only', 'Item + side'],
    drinkOptions: ['Coke', 'Sprite', 'Water'],
  },
  wings: {
    itemNames: ['Wing Combo', 'Hot Wings', 'Wing Plate'],
    comboOptions: ['Combo', 'Item only', 'Item + side', 'Family pack'],
    sideOptions: ['Fries', 'Veggies'],
    drinkOptions: ['Coke', 'Sprite', 'Water'],
  },
  plates: {
    itemNames: ['Plate Lunch', 'Dinner Plate', 'Combo Plate'],
    comboOptions: ['Combo', 'Item only', 'Large plate'],
    sideOptions: ['Rice', 'Beans', 'Mac & Cheese', 'Greens'],
    drinkOptions: ['Coke', 'Water', 'Tea'],
  },
  desserts: {
    itemNames: ['Dessert Combo', 'Cake Slice', 'Ice Cream Cup'],
    comboOptions: ['Item only', 'Item + drink', 'Dessert duo'],
    drinkOptions: ['Coffee', 'Water'],
  },
  seafood: {
    itemNames: ['Seafood Combo', 'Seafood Plate', 'Shrimp Plate'],
    comboOptions: ['Combo', 'Item only', 'Item + side', 'Family tray'],
    proteinOptions: ['Shrimp', 'Fish', 'Mixed Seafood'],
    sideOptions: ['Rice', 'Fries', 'Corn'],
    drinkOptions: ['Water', 'Coke', 'Jamaica'],
  },
  breakfast: {
    itemNames: ['Breakfast Combo', 'Pancakes', 'Breakfast Plate'],
    comboOptions: ['Combo', 'Item only', 'Item + side'],
    sideOptions: ['Eggs', 'Bacon', 'Potatoes'],
    drinkOptions: ['Coffee', 'Orange Juice', 'Water'],
  },
  hotdogs: {
    itemNames: ['Hotdog Combo', 'Loaded Hotdog', 'Big Dog Combo'],
    comboOptions: ['Combo', 'Item only', 'Item + side'],
    sideOptions: ['Fries', 'Chili Fries'],
    drinkOptions: ['Coke', 'Pepsi', 'Sprite'],
  },
  sandwiches: {
    itemNames: ['Sandwich Combo', 'Club Sandwich', 'Chicken Sandwich Combo'],
    comboOptions: ['Combo', 'Item only', 'Item + side'],
    sideOptions: ['Chips', 'Fries'],
    drinkOptions: ['Coke', 'Water', 'Tea'],
  },
  chicken: {
    itemNames: ['Chicken Plate', 'Fried Chicken Combo', 'Baked Chicken Plate'],
    comboOptions: ['Combo', 'Item only', 'Item + side', 'Family pack'],
    proteinOptions: ['Fried Chicken', 'Baked Chicken', 'Smothered Chicken'],
    sideOptions: ['Mac & Cheese', 'Greens', 'Candy Yams', 'Rice'],
    drinkOptions: ['Tea', 'Water', 'Coke'],
  },
  bbq: {
    itemNames: ['BBQ Combo', 'Ribs Combo', 'Brisket Tray'],
    comboOptions: ['Combo', 'Item only', 'Item + side', 'Family pack'],
    proteinOptions: ['Ribs', 'Brisket', 'Links', 'Chicken'],
    sideOptions: ['Mac & Cheese', 'Beans', 'Potato Salad', 'Fries', 'Cornbread'],
    drinkOptions: ['Tea', 'Lemonade', 'Coke'],
  },
  snacks: {
    itemNames: ['Snack Cup', 'Loaded Snack', 'Sweet Snack Combo'],
    comboOptions: ['Item only', 'Item + drink', 'Large snack'],
    drinkOptions: ['Water', 'Soda'],
  },
  catering: {
    itemNames: ['Catering Tray', 'Family Pack', 'Party Pack'],
    comboOptions: ['Half tray', 'Full tray', 'Tray + drinks'],
    sideOptions: ['Rice', 'Beans', 'Salad', 'Bread'],
    drinkOptions: ['Soda pack', 'Water pack'],
  },
  mexican: {
    itemNames: ['Mexican Plate', 'Burrito Combo', 'Quesadilla Combo'],
    comboOptions: ['Combo', 'Item only', 'Item + side', 'Family pack'],
    proteinOptions: ['Chicken', 'Beef', 'Shrimp', 'Carnitas'],
    sideOptions: ['Rice', 'Beans', 'Fries'],
    drinkOptions: ['Horchata', 'Jamaica', 'Coke'],
  },
  soul_food: {
    itemNames: ['Soul Food Plate', 'Mac & Cheese Plate', 'Homestyle Combo'],
    comboOptions: ['Combo', 'Item only', 'Item + side', 'Large plate'],
    proteinOptions: ['Fried Chicken', 'Baked Chicken', 'Turkey Wings', 'Oxtails'],
    sideOptions: ['Mac & Cheese', 'Collard Greens', 'Candy Yams', 'Cornbread'],
    drinkOptions: ['Sweet Tea', 'Water', 'Coke'],
  },
  pollo: {
    itemNames: ['Pollo Plate', 'Grilled Pollo', 'Chicken Family Meal'],
    comboOptions: ['Combo', 'Item only', 'Item + side', 'Family meal'],
    proteinOptions: ['Pollo Asado', 'Grilled Chicken', 'Rotisserie Chicken'],
    sideOptions: ['Rice', 'Beans', 'Fries', 'Tortillas'],
    drinkOptions: ['Horchata', 'Jamaica', 'Coke'],
  },
  coffee: {
    itemNames: ['Coffee Drink', 'Iced Coffee', 'Coffee Combo'],
    comboOptions: ['Drink only', 'Drink + pastry', 'Drink + snack'],
    drinkOptions: ['Latte', 'Mocha', 'Cold Brew', 'Frappe'],
  },
};

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

function getPlanFee(plan: BuilderPlan) {
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

function toDisplayTime(value: string) {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return value;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, '0');
  return `${hour12}:${mm} ${suffix}`;
}

function serializeHours(row: HoursRow) {
  if (!row.isOpen) return 'Closed';
  return `${row.open}-${row.close}`;
}

function parseHours(value: string | null | undefined): HoursRow {
  if (!value || value === 'Closed') {
    return { isOpen: false, open: '09:00', close: '18:00' };
  }

  const [open, close] = value.split('-');
  return {
    isOpen: true,
    open: open || '09:00',
    close: close || '18:00',
  };
}

function getPresetOptions(
  type: BuilderOptionGroup['presetType'],
  preset?: {
    comboOptions?: string[];
    proteinOptions?: string[];
    sideOptions?: string[];
    drinkOptions?: string[];
  }
) {
  if (type === 'combo') {
    const values = preset?.comboOptions?.length
      ? preset.comboOptions
      : ['Combo', 'Item only', 'Item + side'];
    return values.map((name) => ({ name, price: '0' }));
  }

  if (type === 'protein') {
    const values = preset?.proteinOptions?.length
      ? preset.proteinOptions
      : ['Chicken', 'Beef', 'Shrimp'];
    return values.map((name) => ({ name, price: '0' }));
  }

  if (type === 'size') {
    return [
      { name: 'Small', price: '0' },
      { name: 'Medium', price: '2' },
      { name: 'Large', price: '4' },
    ];
  }

  if (type === 'drink') {
    const values = preset?.drinkOptions?.length
      ? preset.drinkOptions
      : ['Coke', 'Sprite', 'Water'];
    return values.map((name) => ({ name, price: '0' }));
  }

  if (type === 'sides') {
    const values = preset?.sideOptions?.length
      ? preset.sideOptions
      : ['Fries', 'Rice', 'Beans'];
    return values.map((name) => ({ name, price: '0' }));
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
  const [hours, setHours] = useState<HoursState>(DEFAULT_HOURS);

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

  const [flyerStyle, setFlyerStyle] = useState<FlyerStyle>('generic');
  const [flyerPack, setFlyerPack] = useState<FlyerPack>('500');
  const [flyerBusinessName, setFlyerBusinessName] = useState('');
  const [flyerHeadline, setFlyerHeadline] = useState('');
  const [flyerSubheadline, setFlyerSubheadline] = useState('');
  const [flyerPromoLine, setFlyerPromoLine] = useState('');
  const [flyerInstagram, setFlyerInstagram] = useState('');
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

  // =========================
  // LOAD DATA (FIXED)
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;

        if (!user) {
          router.push('/login');
          return;
        }

        setOwnerId(user.id);

        // GET RESTAURANT
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (!restaurant) {
          setLoading(false);
          return;
        }

        setRestaurantId(restaurant.id);

        setName(restaurant.name || '');
        setPhone(restaurant.phone || '');
        setAddress(restaurant.address || '');
        setHeroImage(restaurant.hero_image || '');
        setLogoImage(restaurant.logo_image || '');
        setTheme((restaurant.storefront_theme as ThemeMode) || 'light');
        setStorefrontLanguage((restaurant.storefront_language as LanguageMode) || 'en');
        setOrderLanguage((restaurant.order_language as LanguageMode) || 'en');
        setPlan((restaurant.plan as BuilderPlan) || 'starter');
        setStripeConnected(!!restaurant.stripe_connected);

        setHours({
          monday: parseHours(restaurant.hours_monday),
          tuesday: parseHours(restaurant.hours_tuesday),
          wednesday: parseHours(restaurant.hours_wednesday),
          thursday: parseHours(restaurant.hours_thursday),
          friday: parseHours(restaurant.hours_friday),
          saturday: parseHours(restaurant.hours_saturday),
          sunday: parseHours(restaurant.hours_sunday),
        });

        // LOAD CATEGORIES
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('sort_order');

        const { data: items } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurant.id);

        const built: BuilderCategory[] = (cats || []).map((cat) => ({
          id: cat.id,
          name: cat.name || '',
          sort_order: cat.sort_order || 0,
          items:
            (items || [])
              .filter((i) => i.category_id === cat.id)
              .map((i) => ({
                id: i.id,
                category_id: cat.id,
                name: i.name || '',
                base_price: String(i.base_price || 0),
                description: i.description || '',
                image_url: i.image_url || '',
                availability: normalizeAvailability(i),
                option_groups: [],
              })) || [],
        }));

        setCategories(built);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  // =========================
  // SAVE (FIXED)
  // =========================
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!restaurantId) {
        setError(copy.couldNotSave);
        return;
      }

      const slug = slugifyValue(name);

      // UPDATE RESTAURANT
      const { error: rError } = await supabase
        .from('restaurants')
        .update({
          name,
          slug,
          phone,
          address,
          hero_image: heroImage,
          logo_image: logoImage,
          storefront_theme: theme,
          storefront_language: storefrontLanguage,
          order_language: orderLanguage,
          hours_monday: serializeHours(hours.monday),
          hours_tuesday: serializeHours(hours.tuesday),
          hours_wednesday: serializeHours(hours.wednesday),
          hours_thursday: serializeHours(hours.thursday),
          hours_friday: serializeHours(hours.friday),
          hours_saturday: serializeHours(hours.saturday),
          hours_sunday: serializeHours(hours.sunday),
        })
        .eq('id', restaurantId);

      if (rError) throw rError;

      // RESET
      await supabase.from('categories').delete().eq('restaurant_id', restaurantId);
      await supabase.from('menu_items').delete().eq('restaurant_id', restaurantId);

      // INSERT FRESH
      for (const cat of categories) {
        const { data: newCat } = await supabase
          .from('categories')
          .insert({
            restaurant_id: restaurantId,
            name: cat.name,
            sort_order: cat.sort_order,
          })
          .select()
          .single();

        for (const item of cat.items) {
          await supabase.from('menu_items').insert({
            restaurant_id: restaurantId,
            category_id: newCat.id,
            name: item.name,
            base_price: Number(item.base_price || 0),
            description: item.description,
            image_url: item.image_url,
            availability: item.availability,
          });
        }
      }

      setSuccess(copy.builderSaved);
    } catch (err) {
      console.error(err);
      setError(copy.couldNotSave);
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // ADD CATEGORY (PRESET FIXED)
  // =========================
  const addCategory = (presetKey?: PlaceholderCategory) => {
    const preset = presetKey ? CATEGORY_PRESETS[presetKey] : null;

    const newCategory: BuilderCategory = {
      id: uid('cat'),
      name: preset ? preset.itemNames[0] : 'New Category',
      sort_order: categories.length,
      items: [],
    };

    setCategories([...categories, newCategory]);
  };

  // =========================
  // ADD ITEM (COMBO FIRST FIXED)
  // =========================
  const addItem = (categoryId: string, presetKey?: PlaceholderCategory) => {
    const preset = presetKey ? CATEGORY_PRESETS[presetKey] : null;

    const newItem: BuilderItem = {
      id: uid('item'),
      category_id: categoryId,
      name: preset ? preset.itemNames[0] : 'New Item',
      base_price: '10',
      description: '',
      image_url: '',
      availability: 'available',
      option_groups: [
        {
          id: uid('grp'),
          name: 'Combo Options',
          required: true,
          selection: 'single',
          presetType: 'combo',
          options: getPresetOptions('combo', preset).map((opt) => ({
  id: uid('opt'),
  ...opt,
}))
        },
      ],
    };

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: [...cat.items, newItem] }
          : cat
      )
    );

    setSelectedItemId(newItem.id);
  };

  // =========================
  // UI
  // =========================
  if (loading) {
    return <div className="p-6">{copy.loading}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">MENUFLOW BUILDER</h1>

        <div className="flex gap-2">
          <button
            onClick={() =>
              setBuilderLanguage(builderLanguage === 'en' ? 'es' : 'en')
            }
            className="px-3 py-1 border rounded"
          >
            {builderLanguage === 'en' ? 'EN' : 'ES'}
          </button>

          <button
            onClick={handleSave}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {saving ? copy.saving : copy.save}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded">
          {success}
        </div>
      )}

      {/* STORE */}
      <div className="bg-white rounded-xl p-4 shadow space-y-3">
        <h2 className="font-bold">{copy.storeSetup}</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={copy.storeName}
          className="w-full border p-2 rounded"
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={copy.phone}
          className="w-full border p-2 rounded"
        />

        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={copy.address}
          className="w-full border p-2 rounded"
        />

        <div className="text-sm">
          {copy.liveUrl}: {previewLink}
        </div>
      </div>

      {/* HOURS (AUTO SYSTEM) */}
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="font-bold mb-2">{copy.hours}</h2>

        {DAY_ORDER.map((day) => (
          <div key={day} className="flex gap-2 items-center mb-2">
            <span className="w-24 capitalize">{copy[day]}</span>

            <input
              type="checkbox"
              checked={hours[day].isOpen}
              onChange={(e) =>
                setHours({
                  ...hours,
                  [day]: { ...hours[day], isOpen: e.target.checked },
                })
              }
            />

            {hours[day].isOpen && (
              <>
                <select
                  value={hours[day].open}
                  onChange={(e) =>
                    setHours({
                      ...hours,
                      [day]: { ...hours[day], open: e.target.value },
                    })
                  }
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                <select
                  value={hours[day].close}
                  onChange={(e) =>
                    setHours({
                      ...hours,
                      [day]: { ...hours[day], close: e.target.value },
                    })
                  }
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        ))}
      </div>

      {/* MENU */}
      <div className="bg-white rounded-xl p-4 shadow space-y-3">
        <h2 className="font-bold">{copy.menu}</h2>

        <button
          onClick={() => addCategory()}
          className="bg-black text-white px-3 py-2 rounded"
        >
          {copy.addCategory}
        </button>

        {categories.map((cat) => (
          <div key={cat.id} className="border p-3 rounded space-y-2">
            <input
              value={cat.name}
              onChange={(e) =>
                setCategories((prev) =>
                  prev.map((c) =>
                    c.id === cat.id ? { ...c, name: e.target.value } : c
                  )
                )
              }
              className="border p-2 w-full rounded"
            />

            <button
              onClick={() => addItem(cat.id)}
              className="bg-black text-white px-2 py-1 rounded"
            >
              {copy.addItem}
            </button>

            {cat.items.map((item) => (
              <div key={item.id} className="border p-2 rounded">
                <input
                  value={item.name}
                  onChange={(e) =>
                    setCategories((prev) =>
                      prev.map((c) =>
                        c.id === cat.id
                          ? {
                              ...c,
                              items: c.items.map((i) =>
                                i.id === item.id
                                  ? { ...i, name: e.target.value }
                                  : i
                              ),
                            }
                          : c
                      )
                    )
                  }
                  className="border p-2 w-full rounded"
                />

                <input
                  value={item.base_price}
                  onChange={(e) =>
                    setCategories((prev) =>
                      prev.map((c) =>
                        c.id === cat.id
                          ? {
                              ...c,
                              items: c.items.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      base_price: sanitizeNumberInput(
                                        e.target.value
                                      ),
                                    }
                                  : i
                              ),
                            }
                          : c
                      )
                    )
                  }
                  className="border p-2 w-full rounded mt-2"
                />

                {/* OPTION BOX (YOU ASKED FOR THIS) */}
                <div className="mt-2 p-2 border rounded bg-gray-50">
                  <strong>Options</strong>
                  {item.option_groups.map((grp) => (
                    <div key={grp.id}>
                      {grp.options.map((opt) => (
                        <div key={opt.id}>{opt.name}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* GO LIVE */}
      <div className="bg-white p-4 rounded-xl shadow space-y-2">
        <h2 className="font-bold">{copy.goLiveReady}</h2>

        <button className="border px-4 py-2 rounded">
          {copy.connectStripe}
        </button>

        <button className="bg-black text-white px-4 py-2 rounded">
          {copy.goLive}
        </button>
      </div>
    </div>
  );
}

