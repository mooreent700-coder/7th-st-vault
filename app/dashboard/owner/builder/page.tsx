'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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