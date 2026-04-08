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
  hero_url?: string | null;
  logo_image?: string | null;
  logo_url?: string | null;
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
  image?: string | null;
  availability?: string | null;
  available?: boolean | null;
  is_available?: boolean | null;
  sort_order?: number | null;
  position?: number | null;
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
  id?: string;
  temp_id: string;
  name: string;
  price: string;
};

type BuilderOptionGroup = {
  id?: string;
  temp_id: string;
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
  id?: string;
  temp_id: string;
  category_id?: string;
  category_temp_id: string;
  name: string;
  base_price: string;
  description: string;
  image_url: string;
  availability: Availability;
  option_groups: BuilderOptionGroup[];
};

type BuilderCategory = {
  id?: string;
  temp_id: string;
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
  unlockCustomQr: string;
  liveAfterPurchase: string;
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
    unlockCustomQr: 'Unlock Custom Flyer QR',
    liveAfterPurchase: 'Custom flyer QR turns live only after payment.',
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
    openClosed: 'Abrir / Cerrar',
    unlockCustomQr: 'Activar QR Personalizado',
    liveAfterPurchase: 'El QR del flyer personalizado solo se activa después del pago.',
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
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00',
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

const STORAGE_BUCKETS = {
  hero: 'heroes',
  logo: 'logos',
  item: 'menu-images',
} as const;

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
  if (plan === 'starter') return { percent: '10%', monthly: '$19/mo' };
  if (plan === 'growth') return { percent: '5%', monthly: '$39/mo' };
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
  if (item.availability === 'sold_out' || item.is_available === false || item.available === false) {
    return 'sold_out';
  }
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
  const [selectedPlaceholderCategory, setSelectedPlaceholderCategory] =
    useState<PlaceholderCategory>('drinks');

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
      const match = category.items.find((item) => item.temp_id === selectedItemId);
      if (match) return category;
    }
    return null;
  }, [categories, selectedItemId]);

  const selectedItem = useMemo(() => {
    for (const category of categories) {
      const match = category.items.find((item) => item.temp_id === selectedItemId);
      if (match) return match;
    }
    return null;
  }, [categories, selectedItemId]);

  const filteredPlaceholderImages = useMemo(() => {
    return PLACEHOLDER_IMAGES.filter((image) => image.category === selectedPlaceholderCategory);
  }, [selectedPlaceholderCategory]);

  const freeFlyerQrUrl = useMemo(() => {
    const target =
      typeof window !== 'undefined'
        ? `${window.location.origin}${previewLink || '/store/your-store'}`
        : previewLink || '/store/your-store';

    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(target)}`;
  }, [previewLink]);

  const customFlyerPreviewQrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
      'preview-only-menuflow-custom-flyer'
    )}`;
  }, []);

  const flyerHoursText = useMemo(() => {
    const openDays = DAY_ORDER.filter((day) => hours[day].isOpen);
    if (!openDays.length) return 'Closed';

    const lines = openDays.map((day) => {
      const row = hours[day];
      return `${COPY.en[day]} ${toDisplayTime(row.open)}-${toDisplayTime(row.close)}`;
    });

    return lines.join(' • ');
  }, [hours]);

  useEffect(() => {
    const loadBuilder = async () => {
      try {
        setLoading(true);
        setError('');

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          router.push('/auth/login');
          return;
        }

        setOwnerId(user.id);

        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle<RestaurantRow>();

        if (restaurantError) throw restaurantError;

        if (restaurant) {
          setRestaurantId(restaurant.id);
          setName(restaurant.name || '');
          setPhone(restaurant.phone || '');
          setAddress(restaurant.address || '');
          setHeroImage(restaurant.hero_image || restaurant.hero_url || '');
          setLogoImage(restaurant.logo_image || restaurant.logo_url || '');
          setTheme((restaurant.storefront_theme as ThemeMode) || 'light');
          setStorefrontLanguage(
            ((restaurant.storefront_language || 'en').toLowerCase() as LanguageMode) || 'en'
          );
          setOrderLanguage(
            ((restaurant.order_language || 'EN').toLowerCase() as LanguageMode) || 'en'
          );
          setPickupEnabled(Boolean(restaurant.pickup_enabled ?? true));
          setDeliveryEnabled(Boolean(restaurant.delivery_enabled ?? false));
          setDeliveryFee(String(restaurant.delivery_fee ?? 0));
          setDeliveryRadius(String(restaurant.delivery_radius ?? 5));
          setDeliveryMinimum(String(restaurant.delivery_minimum ?? 0));
          setPlan((restaurant.plan as BuilderPlan) || 'starter');
          setStripeConnected(
            Boolean(
              restaurant.stripe_connected ||
                (restaurant.stripe_account_id &&
                  restaurant.stripe_charges_enabled &&
                  restaurant.stripe_payouts_enabled)
            )
          );

          setHours({
            monday: parseHours((restaurant as any).hours_monday),
            tuesday: parseHours((restaurant as any).hours_tuesday),
            wednesday: parseHours((restaurant as any).hours_wednesday),
            thursday: parseHours((restaurant as any).hours_thursday),
            friday: parseHours((restaurant as any).hours_friday),
            saturday: parseHours((restaurant as any).hours_saturday),
            sunday: parseHours((restaurant as any).hours_sunday),
          });

          setFlyerBusinessName(restaurant.name || '');

          const { data: categoryRows, error: categoryError } = await supabase
            .from('menu_categories')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .order('sort_order', { ascending: true });

          if (categoryError) throw categoryError;

          const { data: itemRows, error: itemError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .order('sort_order', { ascending: true });

          if (itemError) throw itemError;

          const itemIds = safeArray(itemRows).map((item) => item.id).filter(Boolean) as string[];

          let optionGroupRows: OptionGroupRow[] = [];
          let optionChoiceRows: OptionChoiceRow[] = [];

          if (itemIds.length) {
            const { data: groups, error: groupsError } = await supabase
              .from('menu_option_groups')
              .select('*')
              .in('item_id', itemIds)
              .order('sort_order', { ascending: true });

            if (groupsError) throw groupsError;
            optionGroupRows = safeArray(groups);

            const groupIds = optionGroupRows.map((group) => group.id).filter(Boolean) as string[];

            if (groupIds.length) {
              const { data: choices, error: choicesError } = await supabase
                .from('menu_option_choices')
                .select('*')
                .in('option_group_id', groupIds)
                .order('sort_order', { ascending: true });

              if (choicesError) throw choicesError;
              optionChoiceRows = safeArray(choices);
            }
          }

          const groupsByItem = new Map<string, BuilderOptionGroup[]>();

          for (const group of optionGroupRows) {
            const options: BuilderOptionChoice[] = optionChoiceRows
              .filter((choice) => choice.option_group_id === group.id)
              .map((choice) => ({
                id: choice.id,
                temp_id: uid('choice'),
                name: choice.name || '',
                price: String(choice.price_delta ?? choice.price ?? 0),
              }));

            const normalizedGroup: BuilderOptionGroup = {
              id: group.id,
              temp_id: uid('group'),
              name: group.name || '',
              required: Boolean(group.is_required),
              selection: normalizeSelectionMode(group),
              presetType: 'custom',
              options,
            };

            const itemKey = group.item_id || '';
            const existing = groupsByItem.get(itemKey) || [];
            existing.push(normalizedGroup);
            groupsByItem.set(itemKey, existing);
          }

          const normalizedCategories: BuilderCategory[] = safeArray(categoryRows)
            .map((category, categoryIndex) => ({
              id: category.id,
              temp_id: uid('cat'),
              name: category.name || '',
              sort_order: category.sort_order ?? categoryIndex,
              items: safeArray(itemRows)
                .filter((item) => item.category_id === category.id)
                .map((item) => ({
                  id: item.id,
                  temp_id: uid('item'),
                  category_id: category.id,
                  category_temp_id: '',
                  name: item.name || '',
                  base_price: String(item.base_price ?? item.price ?? 0),
                  description: item.description || '',
                  image_url: item.image_url || item.image || '',
                  availability: normalizeAvailability(item),
                  option_groups: groupsByItem.get(item.id || '') || [],
                })),
            }))
            .map((category) => ({
              ...category,
              items: category.items.map((item) => ({
                ...item,
                category_temp_id: category.temp_id,
              })),
            }));

          setCategories(normalizedCategories);
          setSelectedItemId(normalizedCategories[0]?.items[0]?.temp_id || null);

          const placeholderCount = normalizedCategories
            .flatMap((category) => category.items)
            .filter((item) => PLACEHOLDER_IMAGES.some((ph) => ph.url === item.image_url)).length;

          setPlaceholderUsedCount(placeholderCount);
        } else {
          const categoryTempId = uid('cat');
          const itemTempId = uid('item');

          setCategories([
            {
              temp_id: categoryTempId,
              name: 'Featured',
              sort_order: 0,
              items: [
                {
                  temp_id: itemTempId,
                  category_temp_id: categoryTempId,
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

          setSelectedItemId(itemTempId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : COPY.en.couldNotSave;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadBuilder();
  }, [router]);

  function updateHours(day: HoursDayKey, patch: Partial<HoursRow>) {
    setHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        ...patch,
      },
    }));
  }

  function toggleSection(section: SectionKey) {
    setExpanded((current) => (current === section ? null : section));
  }

  function updateCategory(categoryTempId: string, nextName: string) {
    setCategories((current) =>
      current.map((category) =>
        category.temp_id === categoryTempId ? { ...category, name: nextName } : category
      )
    );
  }

  function addCategory() {
    const categoryTempId = uid('cat');
    const itemTempId = uid('item');

    setCategories((current) => [
      ...current,
      {
        temp_id: categoryTempId,
        name: `${copy.menu} ${current.length + 1}`,
        sort_order: current.length,
        items: [
          {
            temp_id: itemTempId,
            category_temp_id: categoryTempId,
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

    setSelectedItemId(itemTempId);
    setExpanded('menu');
  }

  function addItem(categoryTempId: string) {
    const itemTempId = uid('item');

    setCategories((current) =>
      current.map((category) =>
        category.temp_id === categoryTempId
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  temp_id: itemTempId,
                  category_temp_id: categoryTempId,
                  category_id: category.id,
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

    setSelectedItemId(itemTempId);
    setExpanded('item');
  }

  function selectItem(itemTempId: string) {
    setSelectedItemId(itemTempId);
    setExpanded('item');
  }

  function updateItem(itemTempId: string, patch: Partial<BuilderItem>) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.temp_id === itemTempId ? { ...item, ...patch } : item
        ),
      }))
    );
  }

  function deleteItem(categoryTempId: string, itemTempId: string) {
    setCategories((current) =>
      current.map((category) =>
        category.temp_id === categoryTempId
          ? { ...category, items: category.items.filter((item) => item.temp_id !== itemTempId) }
          : category
      )
    );

    setSelectedItemId((current) => (current === itemTempId ? null : current));
  }

  function addOptionGroup(itemTempId: string, presetType: BuilderOptionGroup['presetType']) {
    const groupTempId = uid('group');
    const preset = CATEGORY_PRESETS[selectedPlaceholderCategory];

    const nextGroup: BuilderOptionGroup = {
      temp_id: groupTempId,
      name:
        presetType === 'custom'
          ? copy.optionGroups
          : presetType === 'combo'
            ? copy.combo
            : presetType === 'protein'
              ? copy.protein
              : presetType === 'size'
                ? copy.size
                : presetType === 'drink'
                  ? copy.drink
                  : presetType === 'sides'
                    ? copy.sides
                    : presetType === 'extras'
                      ? copy.extras
                      : copy.removals,
      required: presetType === 'combo',
      selection: presetType === 'extras' || presetType === 'removals' ? 'multiple' : 'single',
      presetType,
      options: getPresetOptions(presetType, preset).map((option) => ({
        temp_id: uid('choice'),
        name: option.name,
        price: option.price,
      })),
    };

    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.temp_id === itemTempId
            ? { ...item, option_groups: [...item.option_groups, nextGroup] }
            : item
        ),
      }))
    );

    setExpanded('options');
  }

  function updateOptionGroup(
    itemTempId: string,
    groupTempId: string,
    patch: Partial<BuilderOptionGroup>
  ) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.temp_id === itemTempId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.temp_id === groupTempId ? { ...group, ...patch } : group
                ),
              }
            : item
        ),
      }))
    );
  }

  function deleteOptionGroup(itemTempId: string, groupTempId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.temp_id === itemTempId
            ? {
                ...item,
                option_groups: item.option_groups.filter(
                  (group) => group.temp_id !== groupTempId
                ),
              }
            : item
        ),
      }))
    );
  }

  function addOptionChoice(itemTempId: string, groupTempId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.temp_id === itemTempId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.temp_id === groupTempId
                    ? {
                        ...group,
                        options: [
                          ...group.options,
                          { temp_id: uid('choice'), name: copy.newChoice, price: '0' },
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
    itemTempId: string,
    groupTempId: string,
    optionTempId: string,
    patch: Partial<BuilderOptionChoice>
  ) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.temp_id === itemTempId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.temp_id === groupTempId
                    ? {
                        ...group,
                        options: group.options.map((option) =>
                          option.temp_id === optionTempId ? { ...option, ...patch } : option
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

  function deleteOptionChoice(itemTempId: string, groupTempId: string, optionTempId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.temp_id === itemTempId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.temp_id === groupTempId
                    ? {
                        ...group,
                        options: group.options.filter(
                          (option) => option.temp_id !== optionTempId
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
          item.temp_id === selectedItemId ? { ...item, image_url: url } : item
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

  function applyCategoryPreset(categoryType: PlaceholderCategory) {
    setSelectedPlaceholderCategory(categoryType);

    if (!selectedItemId) return;

    const preset = CATEGORY_PRESETS[categoryType];
    const firstImage = PLACEHOLDER_IMAGES.find((item) => item.category === categoryType);

    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) => {
          if (item.temp_id !== selectedItemId) return item;

          const comboGroup: BuilderOptionGroup = {
            temp_id: uid('group'),
            name: copy.combo,
            required: true,
            selection: 'single',
            presetType: 'combo',
            options: getPresetOptions('combo', preset).map((option) => ({
              temp_id: uid('choice'),
              name: option.name,
              price: option.price,
            })),
          };

          const drinkGroup: BuilderOptionGroup = {
            temp_id: uid('group'),
            name: copy.drink,
            required: false,
            selection: 'single',
            presetType: 'drink',
            options: getPresetOptions('drink', preset).map((option) => ({
              temp_id: uid('choice'),
              name: option.name,
              price: option.price,
            })),
          };

          const sideGroup: BuilderOptionGroup = {
            temp_id: uid('group'),
            name: copy.sides,
            required: false,
            selection: 'single',
            presetType: 'sides',
            options: getPresetOptions('sides', preset).map((option) => ({
              temp_id: uid('choice'),
              name: option.name,
              price: option.price,
            })),
          };

          const proteinGroup: BuilderOptionGroup | null = preset.proteinOptions?.length
            ? {
                temp_id: uid('group'),
                name: copy.protein,
                required: false,
                selection: 'single',
                presetType: 'protein',
                options: getPresetOptions('protein', preset).map((option) => ({
                  temp_id: uid('choice'),
                  name: option.name,
                  price: option.price,
                })),
              }
            : null;

          return {
            ...item,
            name: preset.itemNames[0] || item.name,
            description: item.description || copy.describeItem,
            image_url: firstImage?.url || item.image_url,
            option_groups: [
              comboGroup,
              ...(proteinGroup ? [proteinGroup] : []),
              sideGroup,
              drinkGroup,
            ],
          };
        }),
      }))
    );

    setExpanded('item');
  }

  async function uploadImageToSupabase(
    file: File,
    bucket: keyof typeof STORAGE_BUCKETS,
    folder: string
  ) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bucketName = STORAGE_BUCKETS[bucket];

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('Could not get uploaded image URL.');
    return data.publicUrl;
  }

  async function handleHeroUpload(file: File | null) {
    if (!file) return;
    try {
      setUploadingHero(true);
      setError('');
      const publicUrl = await uploadImageToSupabase(file, 'hero', 'builder');
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
      setError('');
      const publicUrl = await uploadImageToSupabase(file, 'logo', 'builder');
      setLogoImage(publicUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.couldNotSave;
      setError(message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleItemImageUpload(itemTempId: string, file: File | null) {
    if (!file) return;
    try {
      setUploadingItemId(itemTempId);
      setError('');
      const publicUrl = await uploadImageToSupabase(file, 'item', 'builder');
      updateItem(itemTempId, { image_url: publicUrl });
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

  function removeItemImage(itemTempId: string) {
    updateItem(itemTempId, { image_url: '' });

    setCategories((current) => {
      const usage = countPlaceholderUsage(current);
      setPlaceholderUsedCount(usage);
      return current;
    });
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

      const restaurantPayload: Record<string, unknown> = {
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
        hours_monday: serializeHours(hours.monday),
        hours_tuesday: serializeHours(hours.tuesday),
        hours_wednesday: serializeHours(hours.wednesday),
        hours_thursday: serializeHours(hours.thursday),
        hours_friday: serializeHours(hours.friday),
        hours_saturday: serializeHours(hours.saturday),
        hours_sunday: serializeHours(hours.sunday),
      };

      let currentRestaurantId = restaurantId;

      if (restaurantId) {
        const { error: updateError } = await supabase
          .from('restaurants')
          .update(restaurantPayload)
          .eq('id', restaurantId);

        if (updateError) throw updateError;
      } else {
        const { data: insertedRestaurant, error: insertRestaurantError } = await supabase
          .from('restaurants')
          .insert(restaurantPayload)
          .select('id')
          .single();

        if (insertRestaurantError) throw insertRestaurantError;
        currentRestaurantId = insertedRestaurant.id;
        setRestaurantId(insertedRestaurant.id);
      }

      if (!currentRestaurantId) {
        throw new Error('Restaurant ID missing after save.');
      }

      const { data: existingCategories, error: existingCategoriesError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', currentRestaurantId);

      if (existingCategoriesError) throw existingCategoriesError;

      const existingCategoryIds = safeArray(existingCategories).map((row: { id: string }) => row.id);

      const { data: existingItems, error: existingItemsError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('restaurant_id', currentRestaurantId);

      if (existingItemsError) throw existingItemsError;

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

      const insertedCategoryMap = new Map<string, string>();
      const insertedItemMap = new Map<string, string>();
      const insertedGroupMap = new Map<string, string>();

      for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
        const category = categories[categoryIndex];

        const { data: insertedCategory, error: insertCategoryError } = await supabase
          .from('menu_categories')
          .insert({
            restaurant_id: currentRestaurantId,
            name: category.name.trim() || `${copy.menu} ${categoryIndex + 1}`,
            sort_order: categoryIndex,
          })
          .select('id')
          .single();

        if (insertCategoryError) throw insertCategoryError;
        insertedCategoryMap.set(category.temp_id, insertedCategory.id);
      }

      for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
        const category = categories[categoryIndex];
        const dbCategoryId = insertedCategoryMap.get(category.temp_id);

        if (!dbCategoryId) {
          throw new Error('Could not map category while saving items.');
        }

        for (let itemIndex = 0; itemIndex < category.items.length; itemIndex += 1) {
          const item = category.items[itemIndex];

          const { data: insertedItem, error: insertItemError } = await supabase
            .from('menu_items')
            .insert({
              restaurant_id: currentRestaurantId,
              category_id: dbCategoryId,
              name: item.name.trim() || copy.itemNameFallback,
              base_price: Number(item.base_price || 0),
              price: Number(item.base_price || 0),
              description: item.description.trim() || null,
              image_url: item.image_url || null,
              availability: item.availability,
              is_available: item.availability === 'available',
              sort_order: categoryIndex * 100 + itemIndex,
            })
            .select('id')
            .single();

          if (insertItemError) throw insertItemError;
          insertedItemMap.set(item.temp_id, insertedItem.id);
        }
      }

      for (const category of categories) {
        for (const item of category.items) {
          const dbItemId = insertedItemMap.get(item.temp_id);

          if (!dbItemId) {
            throw new Error('Could not map item while saving option groups.');
          }

          for (let groupIndex = 0; groupIndex < item.option_groups.length; groupIndex += 1) {
            const group = item.option_groups[groupIndex];

            const { data: insertedGroup, error: insertGroupError } = await supabase
              .from('menu_option_groups')
              .insert({
                item_id: dbItemId,
                name: group.name.trim() || copy.optionGroups,
                is_required: group.required,
                is_multiple: group.selection === 'multiple',
                selection_mode: group.selection,
                sort_order: groupIndex,
              })
              .select('id')
              .single();

            if (insertGroupError) throw insertGroupError;
            insertedGroupMap.set(group.temp_id, insertedGroup.id);
          }
        }
      }

      for (const category of categories) {
        for (const item of category.items) {
          for (const group of item.option_groups) {
            const dbGroupId = insertedGroupMap.get(group.temp_id);

            if (!dbGroupId) {
              throw new Error('Could not map option group while saving choices.');
            }

            if (!group.options.length) continue;

            const choicesPayload = group.options.map((option, optionIndex) => ({
              option_group_id: dbGroupId,
              name: option.name.trim() || copy.newChoice,
              price: Number(option.price || 0),
              price_delta: Number(option.price || 0),
              sort_order: optionIndex,
            }));

            const { error: insertChoicesError } = await supabase
              .from('menu_option_choices')
              .insert(choicesPayload);

            if (insertChoicesError) throw insertChoicesError;
          }
        }
      }

      setSuccess(copy.builderSaved);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.couldNotSave;
      setError(message);
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
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
              sans-serif;
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
            {heroImage ? (
              <img src={heroImage} alt={copy.heroPreview} className="heroImage" />
            ) : (
              <div className="heroFallback" />
            )}

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

              <div className="hoursBlock">
                <label className="label">{copy.hours}</label>
                <div className="hoursGrid">
                  {DAY_ORDER.map((day) => (
                    <div key={day} className="hoursRow">
                      <div className="hoursDay">{copy[day]}</div>

                      <button
                        type="button"
                        className={`chip ${hours[day].isOpen ? 'chipActive' : ''}`}
                        onClick={() => updateHours(day, { isOpen: !hours[day].isOpen })}
                      >
                        {hours[day].isOpen ? copy.openTime : copy.openClosed.split(' / ')[1]}
                      </button>

                      <div className="timeScroller">
                        <select
                          className="select"
                          value={hours[day].open}
                          disabled={!hours[day].isOpen}
                          onChange={(e) => updateHours(day, { open: e.target.value })}
                        >
                          {TIME_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {toDisplayTime(time)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="timeScroller">
                        <select
                          className="select"
                          value={hours[day].close}
                          disabled={!hours[day].isOpen}
                          onChange={(e) => updateHours(day, { close: e.target.value })}
                        >
                          {TIME_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {toDisplayTime(time)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
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

              <div className="field">
                <label className="label">{copy.selectCategory}</label>
                <div className="placeholderCategoryRow">
                  {(Object.keys(CATEGORY_PRESETS) as PlaceholderCategory[]).map((categoryType) => (
                    <button
                      key={categoryType}
                      type="button"
                      className={`chip ${selectedPlaceholderCategory === categoryType ? 'chipActive' : ''}`}
                      onClick={() => applyCategoryPreset(categoryType)}
                    >
                      {categoryType.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="categoryList">
                {categories.map((category) => (
                  <div key={category.temp_id} className="categoryCard">
                    <div className="field">
                      <label className="label">{copy.categoryName}</label>
                      <input
                        className="input"
                        value={category.name}
                        onChange={(e) => updateCategory(category.temp_id, e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="secondaryButton fullWidth"
                      onClick={() => addItem(category.temp_id)}
                    >
                      {copy.addItem}
                    </button>

                    {category.items.map((item) => (
                      <button
                        key={item.temp_id}
                        type="button"
                        className={`itemListButton ${selectedItemId === item.temp_id ? 'itemListButtonActive' : ''}`}
                        onClick={() => selectItem(item.temp_id)}
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
                  {uploadingItemId === selectedItem.temp_id ? copy.saving : copy.uploadItemImage}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => void handleItemImageUpload(selectedItem.temp_id, e.target.files?.[0] || null)}
                  />
                </label>
                <button
                  type="button"
                  className="secondaryButton fullWidth"
                  onClick={() => removeItemImage(selectedItem.temp_id)}
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
                  onChange={(e) => updateItem(selectedItem.temp_id, { name: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">{copy.basePrice}</label>
                <input
                  className="input"
                  value={selectedItem.base_price}
                  onChange={(e) =>
                    updateItem(selectedItem.temp_id, { base_price: sanitizeNumberInput(e.target.value) })
                  }
                />
              </div>

              <div className="field">
                <label className="label">{copy.description}</label>
                <textarea
                  className="textarea"
                  value={selectedItem.description}
                  onChange={(e) => updateItem(selectedItem.temp_id, { description: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">{copy.placeholderGallery}</label>

                <div className="placeholderCategoryRow">
                  {(Object.keys(CATEGORY_PRESETS) as PlaceholderCategory[]).map((categoryType) => (
                    <button
                      key={categoryType}
                      type="button"
                      className={`chip ${selectedPlaceholderCategory === categoryType ? 'chipActive' : ''}`}
                      onClick={() => setSelectedPlaceholderCategory(categoryType)}
                    >
                      {categoryType.replace(/_/g, ' ')}
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
                  onClick={() => updateItem(selectedItem.temp_id, { availability: 'available' })}
                >
                  {copy.available}
                </button>
                <button
                  type="button"
                  className={`chip ${selectedItem.availability === 'sold_out' ? 'chipActive' : ''}`}
                  onClick={() => updateItem(selectedItem.temp_id, { availability: 'sold_out' })}
                >
                  {copy.soldOut}
                </button>
              </div>

              {selectedCategory ? (
                <button
                  type="button"
                  className="dangerWide"
                  onClick={() => deleteItem(selectedCategory.temp_id, selectedItem.temp_id)}
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
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.temp_id, 'combo')}>
                  {copy.combo}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.temp_id, 'protein')}>
                  {copy.protein}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.temp_id, 'size')}>
                  {copy.size}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.temp_id, 'drink')}>
                  {copy.drink}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.temp_id, 'sides')}>
                  {copy.sides}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.temp_id, 'extras')}>
                  {copy.extras}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.temp_id, 'removals')}>
                  {copy.removals}
                </button>
                <button type="button" className="chip" onClick={() => addOptionGroup(selectedItem.temp_id, 'custom')}>
                  {copy.custom}
                </button>
              </div>

              {selectedItem.option_groups.length ? (
                <div className="optionGroupList">
                  {selectedItem.option_groups.map((group) => (
                    <div key={group.temp_id} className="optionGroupCard">
                      <div className="field">
                        <label className="label">{copy.optionGroups}</label>
                        <input
                          className="input"
                          value={group.name}
                          onChange={(e) => updateOptionGroup(selectedItem.temp_id, group.temp_id, { name: e.target.value })}
                        />
                      </div>

                      <div className="chipRow">
                        <button
                          type="button"
                          className={`chip ${group.required ? 'chipActive' : ''}`}
                          onClick={() =>
                            updateOptionGroup(selectedItem.temp_id, group.temp_id, { required: !group.required })
                          }
                        >
                          {group.required ? copy.required : copy.optional}
                        </button>

                        <button
                          type="button"
                          className={`chip ${group.selection === 'single' ? 'chipActive' : ''}`}
                          onClick={() =>
                            updateOptionGroup(selectedItem.temp_id, group.temp_id, { selection: 'single' })
                          }
                        >
                          {copy.singleChoice}
                        </button>

                        <button
                          type="button"
                          className={`chip ${group.selection === 'multiple' ? 'chipActive' : ''}`}
                          onClick={() =>
                            updateOptionGroup(selectedItem.temp_id, group.temp_id, { selection: 'multiple' })
                          }
                        >
                          {copy.multipleChoice}
                        </button>
                      </div>

                      <div className="choiceList">
                        {group.options.map((option) => (
                          <div key={option.temp_id} className="choiceRow">
                            <input
                              className="input choiceName"
                              value={option.name}
                              onChange={(e) =>
                                updateOptionChoice(selectedItem.temp_id, group.temp_id, option.temp_id, {
                                  name: e.target.value,
                                })
                              }
                            />
                            <input
                              className="input choicePrice"
                              value={option.price}
                              onChange={(e) =>
                                updateOptionChoice(selectedItem.temp_id, group.temp_id, option.temp_id, {
                                  price: sanitizeNumberInput(e.target.value),
                                })
                              }
                            />
                            <button
                              type="button"
                              className="dangerButton"
                              onClick={() =>
                                deleteOptionChoice(selectedItem.temp_id, group.temp_id, option.temp_id)
                              }
                            >
                              {copy.more}
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="secondaryButton fullWidth"
                          onClick={() => addOptionChoice(selectedItem.temp_id, group.temp_id)}
                        >
                          {copy.addChoice}
                        </button>
                      </div>

                      <button
                        type="button"
                        className="dangerWide"
                        onClick={() => deleteOptionGroup(selectedItem.temp_id, group.temp_id)}
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
                <div className="flyerSub">{copy.liveAfterPurchase}</div>

                <div className="field">
                  <label className="label">{copy.flyerStyle}</label>
                  <div className="flyerStyleGrid">
                    {(
                      [
                        'generic',
                        'hibachi',
                        'dessert',
                        'hotdog',
                        'seafood',
                        'tacos',
                        'snacks',
                        'bbq',
                        'soul_food',
                        'pollo',
                        'coffee',
                      ] as FlyerStyle[]
                    ).map((style) => (
                      <button
                        key={style}
                        type="button"
                        className={`chip ${flyerStyle === style ? 'chipActive' : ''}`}
                        onClick={() => setFlyerStyle(style)}
                      >
                        {style.replace(/_/g, ' ')}
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
                  <input className="input" value={flyerHoursText} readOnly />
                </div>

                <div className={`customFlyerPreview flyer-${flyerStyle}`}>
                  <div className="customFlyerPreviewInner">
                    <div className="customFlyerBusinessName">{flyerBusinessName || name || 'Business Name'}</div>
                    <div className="customFlyerHeadline">{flyerHeadline || 'SCAN TO ORDER'}</div>
                    <div className="customFlyerSubheadline">
                      {flyerSubheadline || flyerPromoLine || 'Fresh food. Fast pickup.'}
                    </div>

                    <div className="customFlyerQrWrap">
                      <img
                        src={flyerPaid ? freeFlyerQrUrl : customFlyerPreviewQrUrl}
                        alt="Custom flyer qr"
                        className={`customFlyerQr ${flyerPaid ? '' : 'customFlyerQrPreviewOnly'}`}
                      />
                      {!flyerPaid ? <div className="customFlyerPreviewLabel">{copy.flyerPreviewOnly}</div> : null}
                    </div>

                    <div className="customFlyerFooter">
                      <div>{address || '123 Main St'}</div>
                      <div>{phone || '323-555-1212'}</div>
                      <div>{flyerInstagram || '@yourbusiness'}</div>
                      <div>{flyerHoursText}</div>
                    </div>
                  </div>
                </div>

                <div className="pricingGrid">
                  <button
                    type="button"
                    className={`priceCard ${flyerPack === '100' ? 'priceCardActive' : ''}`}
                    onClick={() => setFlyerPack('100')}
                  >
                    <strong>100</strong>
                    <span>$120</span>
                  </button>

                  <button
                    type="button"
                    className={`priceCard ${flyerPack === '250' ? 'priceCardActive' : ''}`}
                    onClick={() => setFlyerPack('250')}
                  >
                    <strong>250</strong>
                    <span>$250</span>
                  </button>

                  <button
                    type="button"
                    className={`priceCard bestValueCard ${flyerPack === '500' ? 'priceCardActive' : ''}`}
                    onClick={() => setFlyerPack('500')}
                  >
                    <em>{copy.bestValue}</em>
                    <strong>500</strong>
                    <span>$500</span>
                  </button>
                </div>

                <button type="button" className="secondaryButton fullWidth" onClick={() => setFlyerPaid(true)}>
                  {copy.unlockCustomQr}
                </button>
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
          .choiceList,
          .hoursBlock {
            display: grid;
            gap: 10px;
          }

          .hoursGrid {
            display: grid;
            gap: 10px;
          }

          .hoursRow {
            display: grid;
            grid-template-columns: 1fr 110px 1fr 1fr;
            gap: 10px;
            align-items: center;
          }

          .hoursDay {
            color: #111827;
            font-size: 14px;
            font-weight: 800;
            text-transform: capitalize;
          }

          .timeScroller {
            overflow: hidden;
            border-radius: 14px;
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
          .urlPill,
          .select {
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

          .chipActive,
          .itemListButtonActive,
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

          .qrCard {
            border-radius: 18px;
            background: #ffffff;
            border: 1px solid rgba(15, 23, 42, 0.08);
            padding: 14px;
            display: grid;
            place-items: center;
          }

          .qrImage {
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
            border-radius: 22px;
            padding: 18px;
            min-height: 520px;
            color: #ffffff;
            border: 1px solid rgba(15, 23, 42, 0.08);
          }

          .customFlyerPreviewInner {
            display: grid;
            gap: 18px;
            justify-items: center;
            text-align: center;
          }

          .customFlyerBusinessName {
            font-size: 28px;
            font-weight: 900;
            line-height: 1.05;
          }

          .customFlyerHeadline {
            font-size: 48px;
            line-height: 0.95;
            font-weight: 900;
          }

          .customFlyerSubheadline {
            font-size: 18px;
            font-weight: 800;
          }

          .customFlyerQrWrap {
            position: relative;
            width: 100%;
            display: grid;
            place-items: center;
          }

          .customFlyerQr {
            width: min(100%, 260px);
            border-radius: 16px;
            background: #ffffff;
            padding: 8px;
          }

          .customFlyerQrPreviewOnly {
            filter: blur(2px) saturate(0.9);
          }

          .customFlyerPreviewLabel {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            font-size: 22px;
            font-weight: 900;
            letter-spacing: 0.08em;
          }

          .customFlyerFooter {
            display: grid;
            gap: 8px;
            font-size: 15px;
            font-weight: 800;
          }

          .flyer-generic {
            background: linear-gradient(180deg, #7c2d12 0%, #b45309 100%);
          }

          .flyer-hibachi {
            background: linear-gradient(180deg, #111111 0%, #7f1d1d 100%);
          }

          .flyer-dessert {
            background: linear-gradient(180deg, #ec4899 0%, #f9a8d4 100%);
          }

          .flyer-hotdog {
            background: linear-gradient(180deg, #991b1b 0%, #f59e0b 100%);
          }

          .flyer-seafood {
            background: linear-gradient(180deg, #0c4a6e 0%, #2563eb 100%);
          }

          .flyer-tacos {
            background: linear-gradient(180deg, #14532d 0%, #ca8a04 100%);
          }

          .flyer-snacks {
            background: linear-gradient(180deg, #7c3aed 0%, #db2777 100%);
          }

          .flyer-bbq {
            background: linear-gradient(180deg, #7f1d1d 0%, #ea580c 100%);
          }

          .flyer-soul_food {
            background: linear-gradient(180deg, #78350f 0%, #d97706 100%);
          }

          .flyer-pollo {
            background: linear-gradient(180deg, #854d0e 0%, #facc15 100%);
          }

          .flyer-coffee {
            background: linear-gradient(180deg, #3f2a1d 0%, #8b5e3c 100%);
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
            .pricingGrid {
              grid-template-columns: 1fr;
            }

            .hoursRow {
              grid-template-columns: 1fr;
            }

            .placeholderGrid {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>
      </div>
    </main>
  );
}