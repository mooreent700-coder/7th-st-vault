
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';
type StoreTheme = 'light' | 'dark';
type StoreAccent = 'silver' | 'gold' | 'orange' | 'red' | 'blue' | 'purple' | 'lime' | 'mono' | 'pink';
type SaveState = 'Saved' | 'Saving' | 'Error';
type BuilderPanelId = 'store' | 'branding' | 'controls' | 'hours' | 'menu' | 'videos' | '';
type ControlPanelId = 'colors' | 'order' | 'delivery' | 'language' | '';
type DeleteMode = 'item' | 'category';
type HeroMediaType = 'image' | 'video';

type Restaurant = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  name: string | null;
  slug: string | null;
  phone?: string | null;
  address?: string | null;
  logo_image?: string | null;
  hero_image?: string | null;
  hero_video?: string | null;
  hero_video_url?: string | null;
  hero_video_file?: string | null;
  hero_media_type?: string | null;
  description?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  website_url?: string | null;
  storefront_theme?: string | null;
  storefront_accent?: string | null;
  storefront_language?: string | null;
  order_language?: string | null;
  owner_language?: string | null;
  pickup_enabled?: boolean | null;
  delivery_enabled?: boolean | null;
  delivery_fee?: number | null;
  delivery_radius?: number | null;
  delivery_minimum?: number | null;
  hours?: any;
  plan?: string | null;
};

type Category = { id: string; restaurant_id?: string | null; name: string; sort_order?: number | null };

type MenuItem = {
  id: string;
  restaurant_id?: string | null;
  category_id?: string | null;
  name: string;
  description?: string | null;
  base_price?: number | null;
  price?: number | null;
  image_url?: string | null;
  image_file?: string | null;
  item_image?: string | null;
  video_url?: string | null;
  video_file?: string | null;
  item_video?: string | null;
  menu_video?: string | null;
  sort_order?: number | null;
  availability?: string | null;
  is_available?: boolean | null;
};

type HoursRow = { isOpen: boolean; open: string; close: string };
type Hours = Record<string, HoursRow>;
type ImageOption = { label: string; category: string; url: string; path: string };

const BRANDING_BUCKET = 'branding';
const STORE_MEDIA_BUCKET = 'store-media';
const PRODUCT_IMAGES_BUCKET = 'product-images';
const PRODUCT_VIDEOS_BUCKET = 'product-videos';
const VIDEO_MENU_AVAILABILITY = 'video_menu';
const MENU_VIDEO_MAX_SECONDS = 10;
const MAX_MENU_VIDEO_MB = 250;
const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='720' viewBox='0 0 900 720'%3E%3Crect width='900' height='720' rx='58' fill='%2305050b'/%3E%3Ccircle cx='128' cy='124' r='50' fill='none' stroke='%23a78bfa' stroke-width='18'/%3E%3Ccircle cx='128' cy='124' r='24' fill='%2305050b'/%3E%3Ctext x='78' y='335' fill='white' font-family='Arial' font-size='72' font-weight='900' letter-spacing='7'%3E7TH ST%3C/text%3E%3Ctext x='78' y='425' fill='%23c4b5fd' font-family='Arial' font-size='86' font-weight='900' letter-spacing='8'%3EVAULT%3C/text%3E%3C/svg%3E";
const BUILDER_LANG_KEY = 'vault_builder_language';
const OWNER_LANG_KEY = 'vault_seller_language';

const ACCENTS: { key: StoreAccent; label: string; sub: string }[] = [
  { key: 'silver', label: 'Premium Silver', sub: 'Clean Vault chrome' },
  { key: 'mono', label: 'Black / White', sub: 'Minimal premium' },
  { key: 'gold', label: 'Luxury Gold', sub: 'Premium black + gold' },
  { key: 'orange', label: 'Classic Amber', sub: 'Premium fashion glow' },
  { key: 'red', label: 'Cherry Red', sub: 'Bold high energy' },
  { key: 'blue', label: 'Ocean Blue', sub: 'Clean modern tech' },
  { key: 'purple', label: 'Purple Night', sub: 'Luxury nightlife' },
  { key: 'pink', label: 'Neon Pink', sub: 'Dark luxury pink glow' },
  { key: 'lime', label: 'Electric Lime', sub: 'Fashion-tech pop' },
];

const COPY = {
  en: {
    title: 'SELLER BUILDER',
    subtitle: 'Fast fashion seller builder. Build your storefront, collections, products, videos, and brand style.',
    saveAll: 'Save All Changes',
    saving: 'Saving...',
    dashboard: 'Dashboard',
    openStore: 'Open Storefront',
    uploadLogo: 'Upload Logo',
    uploadHero: 'Upload Hero Image',
    uploadHeroVideo: 'Upload Hero Video',
    useHeroImage: 'Use Image',
    useHeroVideo: 'Use Video',
    socialLinks: 'Social Links',
    socialHelp: 'Optional. Add your social handles. 7th St Vault turns them into links on the storefront.',
    heroMedia: 'Hero Media',
    heroHelp: 'Upload or replace one hero video. 7th St Vault syncs every hero video field so only one hero video shows.',
    uploadItem: 'Upload Product Photo',
    storeSetup: 'Store Setup',
    branding: 'Branding',
    styleControls: 'Storefront Style + Controls',
    hours: 'Operating Hours',
    menu: 'Products + Collections',
    preview: 'Live Store Preview',
    storeName: 'Brand / Store Name',
    storeUrl: 'Fashion Store URL',
    phone: 'Business Phone',
    address: 'Business / Shipping Address',
    instagram: 'Instagram @name',
    facebook: 'Facebook page name',
    youtube: 'YouTube channel name',
    tiktok: 'TikTok @name',
    pickup: 'Pickup',
    delivery: 'Shipping',
    light: 'Light',
    dark: 'Dark',
    deliveryFee: 'Shipping Fee',
    deliveryMin: 'Free Shipping Minimum',
    radius: 'Shipping Zone Miles',
    saveSection: 'Save Section',
    close: 'Close',
    saveClose: 'Save & Close',
    itemName: 'Product Name',
    basePrice: 'Product Price',
    description: 'Description',
    delete: 'Delete',
    pickImage: 'Upload Product Media',
    pickImageText: 'Fashion sellers should use their own real product photos and videos. No preset gallery is used.',
    saved: 'Saved',
    error: 'Error',
    open: 'Open',
    closed: 'Closed',
    loading: 'Loading 7th St Vault Builder...',
    noStore: 'Could not load your store.',
    uploadFailed: 'Upload failed.',
    saveFailed: 'Save failed.',
    orderNow: 'Shop Now',
    promo: 'NEW DROP LIVE',
    fresh: 'Shop the latest pieces from this seller.',
    cart: 'View Cart',
    categories: 'Collections',
    videos: 'Product Videos',
    chooseMenuCategory: 'Choose a fashion collection',
    chooseMenuCategoryText: 'Tap one collection. Add/edit products, upload real seller photos/videos, save, close, then choose another collection.',
    existingCategory: 'Live Collection',
    presetCategory: 'Starter Collection',
    orderControls: 'Pickup / Shipping',
    deliveryControls: 'Shipping Settings',
    languageControls: 'Language',
    storeColors: 'Store Colors',
    hasItems: 'products',
    manage: 'Manage',
    createManage: 'Create / Manage',
    emptyCategory: 'No products in this collection yet.',
    livePreviewNote: 'Preview updates instantly from products, collections, and product videos.',
    addCustomItem: '+ Add Custom Product',
    deleteItem: 'Delete Selected Product',
    deleteCategory: 'Delete Whole Collection',
    deleteHelp: 'Pick a product card first to delete only that product. Choose collection to delete the whole section.',
    languageSaved: 'Language saved',
  },
  es: {
    title: 'CONSTRUCTOR',
    subtitle: 'Constructor rápido. Elige una sección, edita, guarda, cierra y sigue.',
    saveAll: 'Guardar Todo',
    saving: 'Guardando...',
    dashboard: 'Panel',
    openStore: 'Abrir Tienda',
    uploadLogo: 'Subir Logo',
    uploadHero: 'Subir Imagen Principal',
    uploadHeroVideo: 'Subir Video Principal',
    useHeroImage: 'Usar Imagen',
    useHeroVideo: 'Usar Video',
    socialLinks: 'Redes Sociales',
    socialHelp: 'Opcional. Agrega tus redes. 7th St Vault las convierte en links.',
    heroMedia: 'Hero Media',
    heroHelp: 'Sube o reemplaza un solo video principal. 7th St Vault sincroniza el video para que solo aparezca uno.',
    uploadItem: 'Subir Foto del Producto',
    storeSetup: 'Configuración',
    branding: 'Marca',
    styleControls: 'Estilo + Controles',
    hours: 'Horario',
    menu: 'Productos + Colecciones',
    preview: 'Vista en Teléfono',
    storeName: 'Nombre',
    storeUrl: 'URL',
    phone: 'Teléfono',
    address: 'Dirección',
    instagram: 'Instagram @name',
    facebook: 'Nombre de Facebook',
    youtube: 'Canal de YouTube',
    tiktok: 'TikTok @name',
    pickup: 'Recoger',
    delivery: 'Envío',
    light: 'Claro',
    dark: 'Oscuro',
    deliveryFee: 'Costo Envío',
    deliveryMin: 'Mínimo Envío',
    radius: 'Millas',
    saveSection: 'Guardar Sección',
    close: 'Cerrar',
    saveClose: 'Guardar y Cerrar',
    itemName: 'Nombre del Producto',
    basePrice: 'Precio del Producto',
    description: 'Descripción',
    delete: 'Eliminar',
    pickImage: 'Elegir Imagen',
    pickImageText: 'Fotos vienen de la carpeta correcta de Supabase Storage.',
    saved: 'Guardado',
    error: 'Error',
    open: 'Abierto',
    closed: 'Cerrado',
    loading: 'Cargando 7th St Vault Builder...',
    noStore: 'No se pudo cargar tu tienda.',
    uploadFailed: 'Falló la subida.',
    saveFailed: 'Falló el guardado.',
    orderNow: 'Comprar',
    promo: '20% DESCUENTO',
    fresh: 'Compra las nuevas piezas de este vendedor.',
    cart: 'Ver Carrito',
    categories: 'Colecciones',
    videos: 'Product Videos',
    chooseMenuCategory: 'Elige una colección',
    chooseMenuCategoryText: 'Toca una categoría. Se abre sola. Agrega/edita, guarda y cierra.',
    existingCategory: 'Colección Activa',
    presetCategory: 'Categoría Lista',
    orderControls: 'Recoger / Envío',
    deliveryControls: 'Configuración de Envío',
    languageControls: 'Idioma',
    storeColors: 'Colores',
    hasItems: 'artículos',
    manage: 'Manejar',
    createManage: 'Crear / Manejar',
    emptyCategory: 'No hay artículos en esta categoría.',
    livePreviewNote: 'La vista se actualiza con fotos y videos.',
    addCustomItem: '+ Agregar Producto',
    deleteItem: 'Eliminar Artículo',
    deleteCategory: 'Eliminar Categoría',
    deleteHelp: 'Elige un artículo para eliminarlo. Elige categoría para borrar todo.',
    languageSaved: 'Idioma guardado',
  },
} as const;

const DEFAULT_HOURS: Hours = {
  monday: { isOpen: true, open: '09:00', close: '21:00' },
  tuesday: { isOpen: true, open: '09:00', close: '21:00' },
  wednesday: { isOpen: true, open: '09:00', close: '21:00' },
  thursday: { isOpen: true, open: '09:00', close: '21:00' },
  friday: { isOpen: true, open: '09:00', close: '22:00' },
  saturday: { isOpen: true, open: '09:00', close: '22:00' },
  sunday: { isOpen: false, open: '10:00', close: '18:00' },
};

const DAYS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
] as const;

const OWNER_CATEGORY_CHOICES = [
  { key: 'new_arrivals', label: 'New Arrivals', emoji: '✨', items: ['New Drop Hoodie', 'Statement Jacket', 'Fresh Arrival Set'] },
  { key: 'men', label: 'Men', emoji: '👔', items: ["Men's Premium Tee", "Men's Hoodie", "Men's Denim Fit"] },
  { key: 'women', label: 'Women', emoji: '👗', items: ["Women's Two Piece Set", "Statement Dress", "Everyday Luxe Fit"] },
  { key: 'kids', label: 'Kids', emoji: '🧒', items: ['Kids Graphic Tee', 'Kids Hoodie Set', 'Kids Sneaker Fit'] },
  { key: 'newborn', label: 'Newborn / Infant', emoji: '🍼', items: ['Infant Outfit Set', 'Newborn Onesie', 'Baby Gift Set'] },
  { key: 'sneakers', label: 'Sneakers', emoji: '👟', items: ['Signature Sneaker', 'Limited Sneaker Drop', 'Everyday Runner'] },
  { key: 'streetwear', label: 'Streetwear', emoji: '🧢', items: ['Oversized Hoodie', 'Graphic Tee', 'Cargo Set'] },
  { key: 'luxury', label: 'Luxury', emoji: '💎', items: ['Luxury Jacket', 'Premium Set', 'Designer Inspired Fit'] },
  { key: 'jewelry', label: 'Jewelry', emoji: '💍', items: ['Gold Chain', 'Bracelet Set', 'Statement Ring'] },
  { key: 'accessories', label: 'Accessories', emoji: '👜', items: ['Luxury Bag', 'Fashion Hat', 'Statement Shades'] },
  { key: 'hoodies', label: 'Hoodies', emoji: '🧥', items: ['Premium Hoodie', 'Zip Hoodie', 'Oversized Hoodie'] },
  { key: 'denim', label: 'Denim', emoji: '👖', items: ['Stacked Denim', 'Denim Jacket', 'Denim Set'] },
  { key: 'dresses', label: 'Dresses', emoji: '👗', items: ['Evening Dress', 'Casual Dress', 'Statement Dress'] },
  { key: 'sets', label: 'Sets', emoji: '🧵', items: ['Two Piece Set', 'Jogger Set', 'Matching Set'] },
  { key: 'vintage', label: 'Vintage', emoji: '📦', items: ['Vintage Jacket', 'Vintage Tee', 'Rare Find'] },
  { key: 'sale', label: 'Sale', emoji: '🏷️', items: ['Sale Product', 'Limited Deal', 'Clearance Item'] },
];

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function isLang(value?: string | null): value is Lang {
  return value === 'en' || value === 'es';
}

function saveBuilderLanguageLocal(lang: Lang) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BUILDER_LANG_KEY, lang);
  window.localStorage.setItem(OWNER_LANG_KEY, lang);
  window.localStorage.setItem('vault_language', lang);
  window.localStorage.setItem('vault_order_language', lang);
  document.cookie = `vault_builder_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `vault_seller_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `vault_storefront_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
}

function getSavedBuilderLanguage(): Lang {
  if (typeof window === 'undefined') return 'en';
  const saved =
    window.localStorage.getItem(BUILDER_LANG_KEY) ||
    window.localStorage.getItem('vault_storefront_language') ||
    window.localStorage.getItem(OWNER_LANG_KEY) ||
    window.localStorage.getItem('vault_language');
  return isLang(saved) ? saved : 'en';
}

function slugify(value: string) {
  return ((value || 'your-store').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')) || 'your-store';
}
function money(value?: number | null) { return `$${Number(value || 0).toFixed(2)}`; }
function normalize(value?: string | null) { return String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[_-]/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim(); }
function pretty(value?: string | null) { return String(value || 'universal').replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }

function categoryKey(value?: string | null) {
  const clean = normalize(value);
  if (!clean) return 'product_images';
  if (clean.includes('new arrival') || clean.includes('drop')) return 'new_arrivals';
  if (clean.includes('men') || clean.includes('mens')) return 'men';
  if (clean.includes('women') || clean.includes('womens')) return 'women';
  if (clean.includes('kid')) return 'kids';
  if (clean.includes('newborn') || clean.includes('infant') || clean.includes('baby')) return 'newborn';
  if (clean.includes('sneaker') || clean.includes('shoe')) return 'sneakers';
  if (clean.includes('jewelry') || clean.includes('chain') || clean.includes('ring') || clean.includes('bracelet')) return 'jewelry';
  if (clean.includes('accessor') || clean.includes('bag') || clean.includes('hat') || clean.includes('shade')) return 'accessories';
  if (clean.includes('street')) return 'streetwear';
  if (clean.includes('luxury') || clean.includes('designer')) return 'luxury';
  if (clean.includes('hoodie')) return 'hoodies';
  if (clean.includes('denim') || clean.includes('jean')) return 'denim';
  if (clean.includes('dress')) return 'dresses';
  if (clean.includes('set')) return 'sets';
  if (clean.includes('vintage')) return 'vintage';
  if (clean.includes('sale') || clean.includes('clearance')) return 'sale';
  return clean.replace(/ /g, '_') || 'product_images';
}

function normalizeHours(raw: any): Hours {
  if (!raw) return DEFAULT_HOURS;
  let value = raw;
  if (typeof raw === 'string') {
    try { value = JSON.parse(raw); } catch { return DEFAULT_HOURS; }
  }
  if (!value || typeof value !== 'object') return DEFAULT_HOURS;
  const next: Hours = { ...DEFAULT_HOURS };
  for (const [key] of DAYS) {
    const row = value[key];
    next[key] = {
      isOpen: typeof row?.isOpen === 'boolean' ? row.isOpen : DEFAULT_HOURS[key].isOpen,
      open: String(row?.open || row?.open_time || DEFAULT_HOURS[key].open),
      close: String(row?.close || row?.close_time || DEFAULT_HOURS[key].close),
    };
  }
  return next;
}

function fileExt(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
  return ext.replace(/[^a-z0-9]/g, '') || 'jpg';
}

function bucketUrl(path: string, bucket = PRODUCT_IMAGES_BUCKET) {
  const cleanPath = String(path || 'universal/1.jpg').replace(/^\/+/, '');
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  return data.publicUrl;
}

function isImageFile(name: string) { return /\.(jpg|jpeg|png|webp|avif|gif|heic|heif)$/i.test(name); }
function isVideoFile(name: string) { return /\.(mp4|webm|mov|m4v|ogg)$/i.test(name); }
function isVideoUrl(value?: string | null) { return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(String(value || '').trim()); }

function resolveUrl(url?: string | null, fallbackBucket = PRODUCT_IMAGES_BUCKET) {
  const clean = String(url || '').trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('/')) return clean;
  if (clean.startsWith('branding/')) return bucketUrl(clean.replace(/^branding\//, ''), BRANDING_BUCKET);
  if (clean.startsWith('store-media/')) return bucketUrl(clean.replace(/^store-media\//, ''), STORE_MEDIA_BUCKET);
  if (clean.startsWith('product-images/')) return bucketUrl(clean.replace(/^product-images\//, ''), PRODUCT_IMAGES_BUCKET);
  if (clean.startsWith('product-videos/')) return bucketUrl(clean.replace(/^product-videos\//, ''), PRODUCT_VIDEOS_BUCKET);
  if (clean.includes('/')) return bucketUrl(clean, fallbackBucket);
  return '';
}

function resolveBrandingUrl(url?: string | null) { return resolveUrl(url, BRANDING_BUCKET); }
function resolveStoreMediaUrl(url?: string | null) { return resolveUrl(url, STORE_MEDIA_BUCKET); }
function resolveProductVideoUrl(url?: string | null) { return resolveUrl(url, PRODUCT_VIDEOS_BUCKET); }

function getAccent(value?: string | null): StoreAccent {
  const clean = String(value || 'silver').toLowerCase();
  return ['silver', 'gold', 'orange', 'red', 'blue', 'purple', 'lime', 'mono', 'pink'].includes(clean) ? clean as StoreAccent : 'silver';
}
function getHeroMediaType(value?: string | null): HeroMediaType { return value === 'video' ? 'video' : 'image'; }

function cleanSocialHandle(value?: string | null) {
  let raw = String(value || '').trim();
  if (!raw) return '';
  raw = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  raw = raw.replace(/^instagram\.com\//i, '').replace(/^facebook\.com\//i, '').replace(/^youtube\.com\//i, '').replace(/^youtu\.be\//i, '').replace(/^tiktok\.com\/@?/i, '');
  raw = raw.split(/[?#]/)[0].replace(/^@+/, '').replace(/\/+$/, '').trim();
  return raw;
}

function savedItemImage(item?: MenuItem | null) { return resolveUrl(item?.image_file || item?.item_image || item?.image_url, PRODUCT_IMAGES_BUCKET); }
function savedItemVideo(item?: MenuItem | null) { return resolveProductVideoUrl(item?.video_file || item?.item_video || item?.menu_video || item?.video_url); }
function fallbackImage(categoryName?: string | null, itemName?: string | null, index = 0) { const label = encodeURIComponent(pretty(categoryName || itemName || 'Upload Product Media')); return `data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='1100' viewBox='0 0 900 1100'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%23070a12'/><stop offset='1' stop-color='%231f2937'/></linearGradient></defs><rect width='900' height='1100' fill='url(%23g)'/><circle cx='450' cy='420' r='150' fill='%23ffffff' opacity='.08'/><text x='450' y='535' text-anchor='middle' fill='%23ffffff' font-family='Arial' font-size='44' font-weight='800'>7th St Vault</text><text x='450' y='595' text-anchor='middle' fill='%23d1d5db' font-family='Arial' font-size='28'>${label}</text><text x='450' y='650' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='22'>Upload real product photo or video</text></svg>`; }
function getItemImage(item?: MenuItem | null, categoryName?: string | null, index = 0) { const saved = savedItemImage(item); return saved || fallbackImage(categoryName, item?.name, index); }
function getItemVideo(item?: MenuItem | null) { return savedItemVideo(item); }
function handleBrokenImage(event: SyntheticEvent<HTMLImageElement, Event>) { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage('7th St Vault', 'Upload Media'); }
function handleMenuImageError(event: SyntheticEvent<HTMLImageElement, Event>, item?: MenuItem | null, categoryName?: string | null, index = 0) { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage(categoryName, item?.name, index); }
function isVideoMenuItem(item?: MenuItem | null) { return String(item?.availability || '').toLowerCase() === VIDEO_MENU_AVAILABILITY || !!savedItemVideo(item); }
function isVideoMenuCategory(category?: Category | null) { return normalize(category?.name).includes('vault product videos') || normalize(category?.name).includes('video menu'); }
function isActiveItem(item: MenuItem) {
  const availability = String(item.availability || 'available').toLowerCase();
  return item.is_available !== false && !['deleted', 'delete', 'hidden', 'inactive', 'archived', 'draft', 'removed'].includes(availability);
}
function keepVideoPlaying(event: SyntheticEvent<HTMLVideoElement, Event>) {
  const video = event.currentTarget;
  video.muted = true;
  video.playsInline = true;
  const promise = video.play();
  if (promise && typeof promise.catch === 'function') promise.catch(() => null);
}
function stopAtMenuVideoLimit(event: SyntheticEvent<HTMLVideoElement, Event>) {
  const video = event.currentTarget;
  video.muted = true;
  video.playsInline = true;
  if (video.ended) {
    video.currentTime = 0;
    const promise = video.play();
    if (promise && typeof promise.catch === 'function') promise.catch(() => null);
  }
}
function replayPreviewVideo(event: SyntheticEvent<HTMLVideoElement, Event>) {
  const video = event.currentTarget;
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  const promise = video.play();
  if (promise && typeof promise.catch === 'function') promise.catch(() => null);
}

async function safeUpdate(table: string, id: string, patch: any, restaurantId?: string) {
  let query = supabase.from(table).update(patch).eq('id', id);
  if (restaurantId) query = query.eq('restaurant_id', restaurantId);
  return await query.select('*').maybeSingle();
}

async function updateFirstWorkingColumn(table: string, id: string, restaurantId: string | undefined, columnPatches: any[]) {
  let lastError: any = null;
  for (const patch of columnPatches) {
    const { data, error } = await safeUpdate(table, id, patch, restaurantId);
    if (!error) return { data, error: null };
    lastError = error;
  }
  return { data: null, error: lastError };
}

async function updateEveryExistingColumn(table: string, id: string, restaurantId: string | undefined, patches: any[]) {
  let mergedData: any = null;
  let successCount = 0;
  let lastError: any = null;
  for (const patch of patches) {
    const { data, error } = await safeUpdate(table, id, patch, restaurantId);
    if (!error) {
      successCount += 1;
      mergedData = { ...(mergedData || {}), ...(data || {}), ...patch };
    } else {
      lastError = error;
    }
  }
  return { data: mergedData, error: successCount > 0 ? null : lastError };
}

async function insertFirstWorkingPayload(table: string, payloads: any[]) {
  let lastError: any = null;
  for (const payload of payloads) {
    const { data, error } = await supabase.from(table).insert(payload).select('*').single();
    if (!error) return { data, error: null };
    lastError = error;
  }
  return { data: null, error: lastError };
}

function getStoreLangFromStore(store: Restaurant | null): Lang {
  const saved = getSavedBuilderLanguage();
  if (isLang(store?.storefront_language)) return store.storefront_language;
  if (isLang(store?.order_language)) return store.order_language;
  if (isLang(store?.owner_language)) return store.owner_language;
  return saved;
}

export default function OwnerBuilderPage() {
  const router = useRouter();
  const fileHeroRef = useRef<HTMLInputElement | null>(null);
  const fileHeroVideoRef = useRef<HTMLInputElement | null>(null);
  const fileLogoRef = useRef<HTMLInputElement | null>(null);
  const fileItemRef = useRef<HTMLInputElement | null>(null);
  const fileItemVideoRef = useRef<HTMLInputElement | null>(null);
  const videoUploadTargetIdRef = useRef<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('Saved');
  const [lastSaved, setLastSaved] = useState('Not saved yet');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [storeTheme, setStoreTheme] = useState<StoreTheme>('light');
  const [storeAccent, setStoreAccent] = useState<StoreAccent>('silver');
  const [storeLang, setStoreLang] = useState<Lang>('en');
  const [hours, setHours] = useState<Hours>(DEFAULT_HOURS);
  const [openPanel, setOpenPanel] = useState<BuilderPanelId>('');
  const [menuWorkspaceKey, setMenuWorkspaceKey] = useState('');
  const [activeControl, setActiveControl] = useState<ControlPanelId>('');
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('item');
  const [heroMediaType, setHeroMediaType] = useState<HeroMediaType>('image');
  const [bucketImageOptions, setBucketImageOptions] = useState<ImageOption[]>([]);
  const [bucketImagesLoading, setBucketImagesLoading] = useState(false);
  const [localHeroPreview, setLocalHeroPreview] = useState('');
  const [localHeroVideoPreview, setLocalHeroVideoPreview] = useState('');
  const [localLogoPreview, setLocalLogoPreview] = useState('');
  const [localItemImagePreviews, setLocalItemImagePreviews] = useState<Record<string, string>>({});
  const [localItemVideoPreviews, setLocalItemVideoPreviews] = useState<Record<string, string>>({});

  const t = COPY[storeLang];
  const storeName = restaurant?.name?.trim() || 'Your Store';
  const storeSlug = slugify(restaurant?.slug || storeName);
  const storeUrl = `/store/${storeSlug}`;
  const logo = resolveBrandingUrl(restaurant?.logo_image || restaurant?.logo_url) || FALLBACK_LOGO;
  const hero = resolveBrandingUrl(restaurant?.hero_image || restaurant?.hero_image_url) || bucketUrl('hero/1.jpg', BRANDING_BUCKET);
  const heroVideo = resolveStoreMediaUrl(restaurant?.hero_video_url || restaurant?.hero_video || restaurant?.hero_video_file || '');

  const regularCategories = useMemo(() => categories.filter((category) => !isVideoMenuCategory(category)), [categories]);
  const regularItems = useMemo(() => items.filter((item) => !isVideoMenuItem(item)), [items]);
  const videoItems = useMemo(() => items.filter((item) => isVideoMenuItem(item)), [items]);
  const previewItems = useMemo(() => {
    if (activeCategoryId === 'VIDEO_MENU') return videoItems;
    if (activeCategoryId === 'all') return [...regularItems, ...videoItems];
    return regularItems.filter((item) => item.category_id === activeCategoryId);
  }, [activeCategoryId, regularItems, videoItems]);
  const selectedItem = useMemo(() => regularItems.find((item) => item.id === selectedItemId) || null, [regularItems, selectedItemId]);
  const selectedVideoItem = useMemo(() => videoItems.find((item) => item.id === selectedVideoId) || videoItems[0] || null, [videoItems, selectedVideoId]);
  const selectedCategory = useMemo(() => regularCategories.find((category) => category.id === selectedItem?.category_id) || null, [regularCategories, selectedItem?.category_id]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    regularItems.forEach((item) => {
      if (item.category_id) map.set(item.category_id, (map.get(item.category_id) || 0) + 1);
    });
    return map;
  }, [regularItems]);

  const workspaceCategory = useMemo(() => regularCategories.find((cat) => cat.id === menuWorkspaceKey) || null, [regularCategories, menuWorkspaceKey]);
  const workspacePreset = useMemo(() => {
    const direct = OWNER_CATEGORY_CHOICES.find((choice) => choice.key === menuWorkspaceKey);
    if (direct) return direct;
    const category = regularCategories.find((cat) => cat.id === menuWorkspaceKey);
    if (!category) return null;
    return OWNER_CATEGORY_CHOICES.find((choice) => categoryKey(choice.key) === categoryKey(category.name) || normalize(choice.key) === normalize(category.name)) || null;
  }, [regularCategories, menuWorkspaceKey]);
  const workspaceItems = useMemo(() => (workspaceCategory ? regularItems.filter((item) => item.category_id === workspaceCategory.id) : []), [regularItems, workspaceCategory]);
  const galleryOptions = useMemo(() => bucketImageOptions, [bucketImageOptions]);

  function bucketFoldersForCategory(categoryName?: string | null) {
    const key = categoryKey(categoryName || 'universal');
    const aliases: Record<string, string[]> = {
      new_arrivals: ['new_arrivals', 'new-arrivals', 'drops'],
      men: ['men', 'mens', 'menswear'],
      women: ['women', 'womens', 'womenswear'],
      kids: ['kids', 'children', 'youth'],
      newborn: ['newborn', 'infant', 'baby'],
      sneakers: ['sneakers', 'shoes', 'footwear'],
      streetwear: ['streetwear', 'street-style'],
      luxury: ['luxury', 'designer', 'premium'],
      jewelry: ['jewelry', 'chains', 'rings'],
      accessories: ['accessories', 'bags', 'hats'],
      hoodies: ['hoodies', 'sweaters'],
      denim: ['denim', 'jeans'],
      dresses: ['dresses'],
      sets: ['sets', 'matching-sets'],
      vintage: ['vintage', 'rare-finds'],
      sale: ['sale', 'clearance'],
      universal: ['product-images', 'products'],
    };
    return Array.from(new Set([...(aliases[key] || [key]), key, key.replace(/_/g, '-'), key.replace(/_/g, ' ')])).filter(Boolean);
  }

  const loadBucketImagesForCategory = useCallback(async (categoryName?: string | null) => {
    const key = categoryKey(categoryName || 'universal');
    setBucketImageOptions([]);
    setBucketImagesLoading(true);
    try {
      for (const folder of bucketFoldersForCategory(categoryName)) {
        const { data, error: listError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).list(folder, { limit: 80, sortBy: { column: 'name', order: 'asc' } });
        if (listError || !data?.length) continue;
        const files = data.filter((file) => isImageFile(file.name)).slice(0, 30);
        if (!files.length) continue;
        setBucketImageOptions(files.map((file, index) => ({
          category: key,
          label: pretty(file.name.replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]?/, '')) || `${pretty(key)} Photo ${index + 1}`,
          url: bucketUrl(`${folder}/${file.name}`),
          path: `${folder}/${file.name}`,
        })));
        return;
      }
      setBucketImageOptions([]);
    } finally {
      setBucketImagesLoading(false);
    }
  }, []);

  const markSaved = useCallback((label?: string) => {
    setSaveState('Saved');
    setLastSaved(label || new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData.user;
      if (!user) {
        router.push('/sign-in');
        return;
      }

      const { data: storeRows, error: storeError } = await supabase.from('restaurants').select('*').or(`owner_id.eq.${user.id},user_id.eq.${user.id}`).limit(1);
      if (storeError) throw storeError;

      let store = (storeRows?.[0] || null) as Restaurant | null;
      if (!store) {
        const savedLang = getSavedBuilderLanguage();
        const { data: created, error: createError } = await supabase.from('restaurants').insert({
          id: makeId(),
          owner_id: user.id,
          user_id: user.id,
          name: 'Your Store',
          slug: `store-${user.id.slice(0, 6)}`,
          storefront_theme: 'light',
          storefront_accent: 'silver',
          storefront_language: savedLang,
          order_language: savedLang,
          owner_language: savedLang,
          pickup_enabled: true,
          delivery_enabled: false,
          delivery_fee: 0,
          delivery_radius: 5,
          delivery_minimum: 0,
          hours: DEFAULT_HOURS,
          plan: 'Starter Plan',
          hero_media_type: 'image',
        }).select('*').single();
        if (createError) throw createError;
        store = created as Restaurant;
      }

      const resolvedLang = getStoreLangFromStore(store);
      saveBuilderLanguageLocal(resolvedLang);
      setRestaurant(store);
      setStoreTheme(store.storefront_theme === 'dark' ? 'dark' : 'light');
      setStoreAccent(getAccent(store.storefront_accent));
      setStoreLang(resolvedLang);
      setHeroMediaType(getHeroMediaType(store.hero_media_type));
      setHours(normalizeHours(store.hours));

      const [catRes, itemRes] = await Promise.all([
        supabase.from('menu_categories').select('id, restaurant_id, name, sort_order').eq('restaurant_id', store.id).order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*').eq('restaurant_id', store.id).order('sort_order', { ascending: true }).limit(400),
      ]);
      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;

      const liveItems = ((itemRes.data || []) as MenuItem[]).filter(isActiveItem);
      const firstRegular = liveItems.find((item) => !isVideoMenuItem(item));
      const firstVideo = liveItems.find((item) => isVideoMenuItem(item));
      setCategories((catRes.data || []) as Category[]);
      setItems(liveItems);
      setActiveCategoryId('all');
      setSelectedItemId(firstRegular?.id || '');
      setSelectedVideoId(firstVideo?.id || '');
      markSaved();
    } catch (err: any) {
      setSaveState('Error');
      setError(err?.message || COPY[getSavedBuilderLanguage()].noStore);
    } finally {
      setLoading(false);
    }
  }, [markSaved, router]);

  useEffect(() => {
    const saved = getSavedBuilderLanguage();
    setStoreLang(saved);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (openPanel !== 'menu' || !menuWorkspaceKey) {
      setBucketImageOptions([]);
      return;
    }
    const categoryName = workspaceCategory?.name || workspacePreset?.key || menuWorkspaceKey || selectedCategory?.name || 'universal';
    void loadBucketImagesForCategory(categoryName);
  }, [loadBucketImagesForCategory, menuWorkspaceKey, openPanel, selectedCategory?.name, workspaceCategory?.name, workspacePreset?.key]);

  async function saveRestaurantPatch(patch: Partial<Restaurant>) {
    if (!restaurant?.id) return;
    setSaving(true);
    setSaveState('Saving');
    setError('');
    try {
      const { data, error: saveError } = await supabase.from('restaurants').update(patch).eq('id', restaurant.id).select('*').single();
      if (saveError) throw saveError;
      const nextStore = data as Restaurant;
      const resolvedLang = getStoreLangFromStore(nextStore);
      setRestaurant(nextStore);
      setStoreTheme(nextStore.storefront_theme === 'dark' ? 'dark' : 'light');
      setStoreAccent(getAccent(nextStore.storefront_accent));
      setStoreLang(resolvedLang);
      setHeroMediaType(getHeroMediaType(nextStore.hero_media_type));
      saveBuilderLanguageLocal(resolvedLang);
      markSaved();
    } catch (err: any) {
      setSaveState('Error');
      setError(err?.message || COPY[storeLang].saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function setBuilderLanguage(nextLang: Lang, shouldSave = true) {
    setError('');
    setStoreLang(nextLang);
    saveBuilderLanguageLocal(nextLang);
    setRestaurant((current) => current ? { ...current, storefront_language: nextLang, order_language: nextLang, owner_language: nextLang } : current);

    if (!shouldSave || !restaurant?.id) {
      markSaved(COPY[nextLang].languageSaved);
      return;
    }

    setSaving(true);
    setSaveState('Saving');
    try {
      const patch = { storefront_language: nextLang, order_language: nextLang, owner_language: nextLang };
      const { data, error: updateError } = await supabase.from('restaurants').update(patch).eq('id', restaurant.id).select('*').single();
      if (updateError) throw updateError;
      setRestaurant((data as Restaurant) || { ...restaurant, ...patch });
      setStoreLang(nextLang);
      saveBuilderLanguageLocal(nextLang);
      markSaved(COPY[nextLang].languageSaved);
    } catch (err: any) {
      setSaveState('Error');
      setError(err?.message || COPY[nextLang].saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function toggleBuilderLanguage() {
    await setBuilderLanguage(storeLang === 'en' ? 'es' : 'en', true);
  }

  async function saveStoreSection(close = false) {
    await saveRestaurantPatch({
      name: restaurant?.name || 'Your Store',
      slug: slugify(restaurant?.slug || restaurant?.name || 'your-store'),
      phone: restaurant?.phone || '',
      address: restaurant?.address || '',
      instagram_url: cleanSocialHandle(restaurant?.instagram_url),
      facebook_url: cleanSocialHandle(restaurant?.facebook_url),
      youtube_url: cleanSocialHandle(restaurant?.youtube_url),
      tiktok_url: cleanSocialHandle(restaurant?.tiktok_url),
    });
    if (close) closePanelFully();
  }

  async function saveBrandingSection(close = false) {
    const currentHeroVideo = restaurant?.hero_video || restaurant?.hero_video_file || restaurant?.hero_video_url || '';
    await saveRestaurantPatch({ logo_image: restaurant?.logo_image || '', hero_image: restaurant?.hero_image || '', hero_media_type: heroMediaType, hero_video: currentHeroVideo });
    if (close) closePanelFully();
  }

  async function saveControlsSection(closeControl = false) {
    await saveRestaurantPatch({
      pickup_enabled: Boolean(restaurant?.pickup_enabled),
      delivery_enabled: Boolean(restaurant?.delivery_enabled),
      delivery_fee: Number(restaurant?.delivery_fee || 0),
      delivery_radius: Number(restaurant?.delivery_radius || 5),
      delivery_minimum: Number(restaurant?.delivery_minimum || 0),
      storefront_theme: storeTheme,
      storefront_accent: storeAccent,
      storefront_language: storeLang,
      order_language: storeLang,
      owner_language: storeLang,
    });
    if (closeControl) closePanelFully();
  }

  async function saveHoursSection(close = false) {
    await saveRestaurantPatch({ hours });
    if (close) closePanelFully();
  }

  async function saveAllChanges() {
    await saveRestaurantPatch({
      name: restaurant?.name || 'Your Store',
      slug: slugify(restaurant?.slug || restaurant?.name || 'your-store'),
      phone: restaurant?.phone || '',
      address: restaurant?.address || '',
      instagram_url: cleanSocialHandle(restaurant?.instagram_url),
      facebook_url: cleanSocialHandle(restaurant?.facebook_url),
      youtube_url: cleanSocialHandle(restaurant?.youtube_url),
      tiktok_url: cleanSocialHandle(restaurant?.tiktok_url),
      logo_image: restaurant?.logo_image || '',
      hero_image: restaurant?.hero_image || '',
      hero_video: restaurant?.hero_video || restaurant?.hero_video_file || restaurant?.hero_video_url || '',
      hero_media_type: heroMediaType,
      pickup_enabled: Boolean(restaurant?.pickup_enabled),
      delivery_enabled: Boolean(restaurant?.delivery_enabled),
      delivery_fee: Number(restaurant?.delivery_fee || 0),
      delivery_radius: Number(restaurant?.delivery_radius || 5),
      delivery_minimum: Number(restaurant?.delivery_minimum || 0),
      storefront_theme: storeTheme,
      storefront_accent: storeAccent,
      storefront_language: storeLang,
      order_language: storeLang,
      owner_language: storeLang,
      hours,
    });
  }

  
async function withUploadTimeout<T>(promise: Promise<T>, timeoutMs = 900000): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error('Upload is taking longer than expected. Compress the video or try again with a stronger connection.')),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function uploadMedia(file: File, kind: 'hero' | 'logo' | 'item' | 'heroVideo' | 'itemVideo') {
    if (!restaurant?.id) return;
    setSaving(true);
    setSaveState('Saving');
    setError('');
    try {
      if ((kind === 'heroVideo' || kind === 'itemVideo') && !isVideoFile(file.name)) throw new Error('Use an MP4, MOV, M4V, WEBM, or OGG video file.');
      if ((kind === 'hero' || kind === 'logo' || kind === 'item') && !isImageFile(file.name)) throw new Error('Use an image file.');
      if (kind === 'heroVideo' || kind === 'itemVideo') {
        const mb = file.size / 1024 / 1024;
        if (mb > MAX_MENU_VIDEO_MB) {
          throw new Error(
            `This video is too large. Keep it under ${MAX_MENU_VIDEO_MB} MB.`
          );
        }
      }

      const localPreviewUrl = URL.createObjectURL(file);
      if (kind === 'logo') setLocalLogoPreview(localPreviewUrl);
      if (kind === 'hero') setLocalHeroPreview(localPreviewUrl);
      if (kind === 'heroVideo') {
        setLocalHeroVideoPreview(localPreviewUrl);
        setHeroMediaType('video');
      }

      const videoUploadTargetId = videoUploadTargetIdRef.current || selectedVideoId;
      const videoTargetItem = openPanel === 'videos' ? (items.find((item) => item.id === videoUploadTargetId) || selectedVideoItem) : selectedItem;
      if (kind === 'item' && selectedItem) setLocalItemImagePreviews((prev) => ({ ...prev, [selectedItem.id]: localPreviewUrl }));
      if (kind === 'itemVideo' && videoTargetItem) setLocalItemVideoPreviews((prev) => ({ ...prev, [videoTargetItem.id]: localPreviewUrl }));
      const uploadBucket =
        kind === 'logo' || kind === 'hero'
          ? BRANDING_BUCKET
          : kind === 'heroVideo'
            ? STORE_MEDIA_BUCKET
            : kind === 'itemVideo'
              ? PRODUCT_VIDEOS_BUCKET
              : PRODUCT_IMAGES_BUCKET;

      const uploadFolder =
        kind === 'logo'
          ? `logos/${restaurant.id}`
          : kind === 'hero'
            ? `hero-images/${restaurant.id}`
            : kind === 'heroVideo'
              ? `hero-videos/${restaurant.id}`
              : kind === 'itemVideo'
                ? `product-videos/${restaurant.id}`
                : `products/${categoryKey(workspaceCategory?.name || selectedCategory?.name || workspacePreset?.key || 'products')}`;

      const prefix = kind === 'heroVideo' ? 'hero-video' : kind === 'itemVideo' ? 'product-video' : kind;
      const path = `${uploadFolder}/${prefix}-${Date.now()}.${fileExt(file.name)}`;
      const { error: uploadError } = await withUploadTimeout(supabase.storage.from(uploadBucket).upload(path, file, { upsert: true, contentType: file.type || undefined, cacheControl: '3600' }), 900000);
      if (uploadError) throw uploadError;
      const publicUrl = bucketUrl(path, uploadBucket);

      if (kind === 'hero') await saveRestaurantPatch({ hero_image: `branding/${path}`, hero_image_url: publicUrl, hero_media_type: 'image' });
      if (kind === 'logo') await saveRestaurantPatch({ logo_image: `branding/${path}`, logo_url: publicUrl });
      if (kind === 'heroVideo') {
        const storedVideoPath = `store-media/${path}`;
        const videoPatches: any[] = [
          { hero_video_url: publicUrl },
          { hero_video: publicUrl },
          { hero_video_file: storedVideoPath },
          { hero_media_type: 'video' },
        ];
        const { data, error: videoError } = await updateEveryExistingColumn('restaurants', restaurant.id, undefined, videoPatches);
        if (videoError) throw videoError;
        setRestaurant({ ...restaurant, ...(data as Restaurant), hero_video: publicUrl, hero_video_url: publicUrl, hero_video_file: storedVideoPath, hero_media_type: 'video' });
        setHeroMediaType('video');
        markSaved();
      }
      if (kind === 'item' && selectedItem) {
        const { data, error: imageError } = await updateFirstWorkingColumn('menu_items', selectedItem.id, restaurant.id, [
          { image_file: path, image_url: path },
          { image_file: path },
          { image_url: path },
          { image_file: publicUrl, image_url: publicUrl },
          { image_file: publicUrl },
          { image_url: publicUrl },
        ]);
        if (imageError) throw imageError;
        const patched = (data as MenuItem) || { ...selectedItem, image_file: path, image_url: path };
        setItems((prev) => prev.map((item) => (item.id === selectedItem.id ? { ...item, ...patched, image_file: patched.image_file || path, image_url: patched.image_url || path } : item)));
        markSaved();
      }
      if (kind === 'itemVideo' && videoTargetItem) {
        const { data, error: itemVideoError } = await updateFirstWorkingColumn('menu_items', videoTargetItem.id, restaurant.id, [
          { video_file: path, video_url: path },
          { video_file: path },
          { video_url: path },
          { menu_video: path },
          { item_video: path },
          { video_file: publicUrl, video_url: publicUrl },
          { video_file: publicUrl },
          { video_url: publicUrl },
          { menu_video: publicUrl },
          { item_video: publicUrl },
        ]);
        if (itemVideoError) throw itemVideoError;
        const patched = (data as MenuItem) || { ...videoTargetItem, video_file: path, video_url: path };
        setItems((prev) => prev.map((item) => (item.id === videoTargetItem.id ? { ...item, ...patched, video_file: patched.video_file || path, video_url: patched.video_url || path, availability: VIDEO_MENU_AVAILABILITY, is_available: true } : item)));
        setSelectedVideoId(videoTargetItem.id);
        setActiveCategoryId('VIDEO_MENU');
        videoUploadTargetIdRef.current = '';
        markSaved();
      }
    } catch (err: any) {
      setSaveState('Error');
      setError(err?.message || t.uploadFailed);
    } finally {
      setSaving(false);
    }
  }

  async function addCategory(name = `Category ${categories.length + 1}`) {
    if (!restaurant?.id) return null;
    setSaving(true);
    setSaveState('Saving');
    setError('');
    try {
      const existing = regularCategories.find((cat) => normalize(cat.name) === normalize(name) || categoryKey(cat.name) === categoryKey(name));
      if (existing) {
        setActiveCategoryId(existing.id);
        setMenuWorkspaceKey(existing.id);
        markSaved();
        return existing;
      }
      const newCategory = { id: makeId(), restaurant_id: restaurant.id, name: categoryKey(name), sort_order: regularCategories.length + 1 };
      const { data, error: insertError } = await supabase.from('menu_categories').insert(newCategory).select('*').single();
      if (insertError) throw insertError;
      const savedCategory = data as Category;
      setCategories((prev) => [...prev, savedCategory]);
      setActiveCategoryId(savedCategory.id);
      setMenuWorkspaceKey(savedCategory.id);
      markSaved();
      return savedCategory;
    } catch (err: any) {
      setSaveState('Error');
      setError(err?.message || t.saveFailed);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function openCategoryWorkspace(key: string) {
    const existing = regularCategories.find((cat) => cat.id === key || normalize(cat.name) === normalize(key) || categoryKey(cat.name) === categoryKey(key));
    if (existing) {
      setMenuWorkspaceKey(existing.id);
      setActiveCategoryId(existing.id);
      const firstItem = regularItems.find((item) => item.category_id === existing.id);
      setSelectedItemId(firstItem?.id || '');
      setDeleteMode('item');
      return;
    }
    setMenuWorkspaceKey(key);
    setActiveCategoryId('all');
    setSelectedItemId('');
    setDeleteMode('item');
  }

  async function saveCategory(id: string, patch: Partial<Category>) {
    if (!restaurant?.id) return;
    setSaving(true);
    setSaveState('Saving');
    setError('');
    try {
      const cleanPatch = patch.name ? { ...patch, name: categoryKey(patch.name) } : patch;
      const { data, error: updateError } = await supabase.from('menu_categories').update(cleanPatch).eq('id', id).eq('restaurant_id', restaurant.id).select('*').maybeSingle();
      if (updateError) throw updateError;
      setCategories((prev) => prev.map((cat) => (cat.id === id ? ({ ...cat, ...(data || cleanPatch) } as Category) : cat)));
      markSaved();
    } catch (err: any) {
      setSaveState('Error');
      setError(err?.message || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!restaurant?.id) return;
    if (!confirm('Delete this whole category and every item inside it?')) return;
    setSaving(true);
    setSaveState('Saving');
    setError('');
    const oldCategories = categories;
    const oldItems = items;
    try {
      const itemIds = items.filter((item) => item.category_id === id).map((item) => item.id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      setItems((prev) => prev.filter((item) => item.category_id !== id));
      setActiveCategoryId('all');
      setMenuWorkspaceKey('');
      setSelectedItemId('');
      if (itemIds.length) {
        const { error: hideError } = await supabase.from('menu_items').update({ is_available: false, availability: 'deleted', sort_order: 999999 }).in('id', itemIds).eq('restaurant_id', restaurant.id);
        if (hideError) throw hideError;
      }
      const { error: deleteError } = await supabase.from('menu_categories').delete().eq('id', id).eq('restaurant_id', restaurant.id);
      if (deleteError) throw deleteError;
      markSaved();
    } catch (err: any) {
      setCategories(oldCategories);
      setItems(oldItems);
      setSaveState('Error');
      setError(err?.message || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function addItem(itemName?: string, categoryName?: string) {
    if (!restaurant?.id) return;
    setSaving(true);
    setSaveState('Saving');
    setError('');
    try {
      let category = categoryName ? regularCategories.find((cat) => normalize(cat.name) === normalize(categoryName) || categoryKey(cat.name) === categoryKey(categoryName)) : workspaceCategory || regularCategories.find((cat) => cat.id === activeCategoryId) || null;
      if (!category) {
        const createdCategory = await addCategory(categoryName || workspacePreset?.key || menuWorkspaceKey || 'new_arrivals');
        if (!createdCategory) return;
        category = createdCategory;
      }
      const finalName = itemName || pretty(category.name);
      const firstPhoto = bucketImageOptions[0]?.path || '';
      const newItem = {
        id: makeId(),
        restaurant_id: restaurant.id,
        category_id: category.id,
        name: finalName,
        description: 'Fashion product ready for customers to shop direct.',
        base_price: 0,
        price: 0,
        image_url: firstPhoto,
        image_file: firstPhoto,
        sort_order: regularItems.length + 1,
        availability: 'available',
        is_available: true,
      };
      const { data, error: insertError } = await supabase.from('menu_items').insert(newItem).select('*').single();
      if (insertError) throw insertError;
      const savedItem = data as MenuItem;
      setItems((prev) => [...prev, savedItem]);
      setActiveCategoryId(category.id);
      setSelectedItemId(savedItem.id);
      setMenuWorkspaceKey(category.id);
      setDeleteMode('item');
      markSaved();
    } catch (err: any) {
      setSaveState('Error');
      setError(err?.message || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function saveItem(id: string, patch: Partial<MenuItem>) {
    if (!restaurant?.id) return;
    setSaving(true);
    setSaveState('Saving');
    setError('');
    const currentItem = items.find((item) => item.id === id);
    const mergedItem = currentItem ? { ...currentItem, ...patch } : patch;
    const nextPrice = Number(mergedItem.base_price ?? mergedItem.price ?? 0);
    const dbPatch: any = { ...patch };
    if ('base_price' in dbPatch || 'price' in dbPatch) {
      dbPatch.base_price = nextPrice;
      dbPatch.price = nextPrice;
    }
    if ('image_url' in dbPatch && !dbPatch.image_file) dbPatch.image_file = dbPatch.image_url;
    delete dbPatch.item_image;
    try {
      const { data, error: updateError } = await supabase.from('menu_items').update(dbPatch).eq('id', id).eq('restaurant_id', restaurant.id).select('*').maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error('This item could not be updated.');
      setItems((prev) => prev.map((item) => (item.id === id ? (data as MenuItem) : item)));
      if (!isVideoMenuItem(data as MenuItem)) setSelectedItemId(id);
      else {
        setSelectedVideoId(id);
        setActiveCategoryId('VIDEO_MENU');
      }
      markSaved();
    } catch (err: any) {
      setSaveState('Error');
      setError(err?.message || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    if (!restaurant?.id) return;
    if (!confirm('Delete this item from the menu and storefront?')) return;
    setSaving(true);
    setSaveState('Saving');
    setError('');
    const oldItems = items;
    const deletedItem = items.find((item) => item.id === id);
    const nextItems = items.filter((item) => item.id !== id);
    const nextItem = nextItems.find((item) => item.category_id === deletedItem?.category_id && !isVideoMenuItem(item)) || null;
    const nextVideo = nextItems.find((item) => isVideoMenuItem(item)) || null;
    setItems(nextItems);
    setSelectedItemId(nextItem?.id || '');
    setSelectedVideoId(nextVideo?.id || '');
    try {
      const { error: hideError } = await supabase.from('menu_items').update({ is_available: false, availability: 'deleted', sort_order: 999999 }).eq('id', id).eq('restaurant_id', restaurant.id);
      if (hideError) throw hideError;
      markSaved();
    } catch (err: any) {
      setItems(oldItems);
      setSelectedItemId(id);
      setSaveState('Error');
      setError(err?.message || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function addVideoItem() {
    if (!restaurant?.id) return;
    setSaving(true);
    setSaveState('Saving');
    setError('');
    try {
      const id = makeId();
      const basePayload = {
        id,
        restaurant_id: restaurant.id,
        category_id: null,
        name: `Product Videos Item ${videoItems.length + 1}`,
        description: 'Product video ready for customers to shop direct.',
        base_price: 0,
        price: 0,
        image_url: '',
        image_file: '',
        video_file: '',
        video_url: '',
        sort_order: items.length + 1,
        availability: VIDEO_MENU_AVAILABILITY,
        is_available: true,
      };
      const { data, error: insertError } = await insertFirstWorkingPayload('menu_items', [
        basePayload,
        { ...basePayload, video_file: undefined },
        { ...basePayload, video_url: undefined },
        { ...basePayload, video_file: undefined, video_url: undefined },
      ]);
      if (insertError) throw insertError;
      const savedVideo = (data || basePayload) as MenuItem;
      setItems((prev) => [...prev, savedVideo]);
      setSelectedVideoId(savedVideo.id);
      setActiveCategoryId('VIDEO_MENU');
      markSaved();
    } catch (err: any) {
      setSaveState('Error');
      setError(err?.message || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function deleteVideoItem(id: string) { await deleteItem(id); }

  async function runOneDeleteButton() {
    if (deleteMode === 'category' && workspaceCategory) {
      await deleteCategory(workspaceCategory.id);
      return;
    }
    const itemToDelete = workspaceItems.find((item) => item.id === selectedItemId) || workspaceItems[0];
    if (itemToDelete) await deleteItem(itemToDelete.id);
  }

  async function saveMenuWorkspaceAndClose() {
    markSaved();
    setMenuWorkspaceKey('');
    setActiveCategoryId('all');
    setSelectedItemId('');
    setDeleteMode('item');
    closePanelFully();
  }

  function switchPanel(nextPanel: BuilderPanelId) {
    setOpenPanel((current) => {
      const next = current === nextPanel ? '' : nextPanel;
      if (next !== 'menu') {
        setMenuWorkspaceKey('');
        setSelectedItemId('');
        setDeleteMode('item');
      }
      if (next !== 'videos' && activeCategoryId === 'VIDEO_MENU') setActiveCategoryId('all');
      if (next === 'videos') setActiveCategoryId('VIDEO_MENU');
      if (next !== 'controls') setActiveControl('');
      return next;
    });
  }

  function closePanelFully() {
    setOpenPanel('');
    setActiveControl('');
    setMenuWorkspaceKey('');
    if (activeCategoryId === 'VIDEO_MENU') setActiveCategoryId('all');
    setSelectedItemId('');
    setDeleteMode('item');
  }

  function onHeroUpload(e: ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (file) void uploadMedia(file, 'hero'); e.target.value = ''; }
  function onHeroVideoUpload(e: ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (file) void uploadMedia(file, 'heroVideo'); e.target.value = ''; }
  function onLogoUpload(e: ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (file) void uploadMedia(file, 'logo'); e.target.value = ''; }
  function onItemUpload(e: ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (file) void uploadMedia(file, 'item'); e.target.value = ''; }
  function onItemVideoUpload(e: ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (file) void uploadMedia(file, 'itemVideo'); e.target.value = ''; }


  function currentStoreName() {
    return storeName;
  }

  function currentStoreSlug() {
    return storeSlug;
  }

  function currentStoreHeroImage() {
    return String(restaurant?.hero_image || '').trim();
  }

  function currentStoreLogoImage() {
    return String(restaurant?.logo_image || '').trim();
  }

  function currentAccentClass() {
    return storeAccent;
  }

  function storefrontPromoLink() {
    if (typeof window === 'undefined') return storeUrl;
    return `${window.location.origin}${storeUrl}`;
  }

  function promoCaption(type: 'storefront' | 'menu' | 'rewards' | 'review') {
    const liveUrl = storefrontPromoLink();

    const captions: Record<typeof type, string> = {
      storefront: `Shop direct from ${currentStoreName()} on 7th St Vault. ${liveUrl}`,
      menu: `Shop the latest products from ${currentStoreName()} on 7th St Vault. ${liveUrl}`,
      rewards: `New rewards are live at ${currentStoreName()} on 7th St Vault. ${liveUrl}`,
      review: `Watch real customer reviews for ${currentStoreName()} on 7th St Vault. ${liveUrl}`,
    };

    return captions[type] || captions.storefront;
  }

  async function copyPromoCaption(type: 'storefront' | 'menu' | 'rewards' | 'review') {
    const textToCopy = promoCaption(type);
    await navigator.clipboard?.writeText(textToCopy).catch(() => null);
    markSaved('Storefront link and caption copied.');
  }

  async function shareStorefrontPromo(type: 'storefront' | 'menu' | 'rewards' | 'review') {
    const liveUrl = storefrontPromoLink();
    const shareText = promoCaption(type);

    await navigator.clipboard?.writeText(shareText).catch(() => null);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${currentStoreName()} | 7th St Vault`,
          text: shareText,
          url: liveUrl,
        });
        markSaved('Share opened. Storefront link copied.');
        return;
      }
    } catch {
      markSaved('Storefront link copied.');
      return;
    }

    markSaved('Storefront link copied. Paste it into Instagram, Facebook, TikTok, YouTube, or your caption.');
  }


  if (loading) {
    return <main className="ordaBuilderPage"><div className="loadingBox">{t.loading}</div><style jsx global>{styles}</style></main>;
  }

  return (
    <main className="ordaBuilderPage">
      <input ref={fileHeroRef} type="file" accept="image/*" hidden onChange={onHeroUpload} />
      <input ref={fileHeroVideoRef} type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.ogg" hidden onChange={onHeroVideoUpload} />
      <input ref={fileLogoRef} type="file" accept="image/*" hidden onChange={onLogoUpload} />
      <input ref={fileItemRef} type="file" accept="image/*" hidden onChange={onItemUpload} />
      <input ref={fileItemVideoRef} type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.ogg" hidden onChange={onItemVideoUpload} />

      <header className="builderHeader">
        <div className="brandRow">
          <img src={logo} alt="7th St Vault" className="ordaLogo" onError={handleBrokenImage} />
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
        <div className="headerActions">
          <button type="button" className="ghostBtn" onClick={() => router.push('/dashboard/owner')}>{t.dashboard}</button>
          <button type="button" className="ghostBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>{t.openStore}</button>
          <div className="headerLangSwitch" aria-label="Builder language">
            <button type="button" className={storeLang === 'en' ? 'active' : ''} disabled={saving} onClick={() => setBuilderLanguage('en', true)}>EN</button>
            <button type="button" className={storeLang === 'es' ? 'active' : ''} disabled={saving} onClick={() => setBuilderLanguage('es', true)}>ES</button>
          </div>
          <button type="button" className="ghostBtn languageToggleBtn" disabled={saving} onClick={toggleBuilderLanguage}>{storeLang === 'en' ? 'ES' : 'EN'}</button>
          <button type="button" className="mainBtn" disabled={saving} onClick={saveAllChanges}>{saving ? t.saving : t.saveAll}</button>
        </div>
      </header>

      {error ? <div className="errorBanner">{error}</div> : null}

      <section className="builderLayout">
        <aside className="leftEditor">
          <section className="quickPickBar workingGlow">
            <button type="button" className={openPanel === 'store' ? 'active' : ''} onClick={() => switchPanel('store')}>Store</button>
            <button type="button" className={openPanel === 'branding' ? 'active' : ''} onClick={() => switchPanel('branding')}>Branding</button>
            <button type="button" className={openPanel === 'controls' ? 'active' : ''} onClick={() => switchPanel('controls')}>Style</button>
            <button type="button" className={openPanel === 'hours' ? 'active' : ''} onClick={() => switchPanel('hours')}>Hours</button>
            <button type="button" className={openPanel === 'menu' ? 'active' : ''} onClick={() => switchPanel('menu')}>{t.menu}</button>
            <button type="button" className={openPanel === 'videos' ? 'active' : ''} onClick={() => switchPanel('videos')}>Product Videos</button>
          </section>

          <Panel id="store" title={t.storeSetup} openPanel={openPanel} setOpenPanel={closePanelFully} state={saveState}>
            <div className="twoGrid">
              <label>{t.storeName}<input value={restaurant?.name || ''} onChange={(e) => setRestaurant((current) => current ? { ...current, name: e.target.value, slug: slugify(e.target.value) } : current)} /></label>
              <label>{t.storeUrl}<input value={restaurant?.slug || ''} onChange={(e) => setRestaurant((current) => current ? { ...current, slug: slugify(e.target.value) } : current)} /><small>/store/{storeSlug}</small></label>
            </div>
            <label>{t.phone}<input value={restaurant?.phone || ''} onChange={(e) => setRestaurant((current) => current ? { ...current, phone: e.target.value } : current)} /></label>
            <label>{t.address}<input value={restaurant?.address || ''} onChange={(e) => setRestaurant((current) => current ? { ...current, address: e.target.value } : current)} /></label>
            <section className="socialBox">
              <h3>{t.socialLinks}</h3>
              <p>{t.socialHelp}</p>
              <div className="socialInputGrid">
                <label><span>◎ {t.instagram}</span><input value={restaurant?.instagram_url || ''} onChange={(e) => setRestaurant((current) => current ? { ...current, instagram_url: cleanSocialHandle(e.target.value) } : current)} /></label>
                <label><span>f {t.facebook}</span><input value={restaurant?.facebook_url || ''} onChange={(e) => setRestaurant((current) => current ? { ...current, facebook_url: cleanSocialHandle(e.target.value) } : current)} /></label>
                <label><span>▶ {t.youtube}</span><input value={restaurant?.youtube_url || ''} onChange={(e) => setRestaurant((current) => current ? { ...current, youtube_url: cleanSocialHandle(e.target.value) } : current)} /></label>
                <label><span>♪ {t.tiktok}</span><input value={restaurant?.tiktok_url || ''} onChange={(e) => setRestaurant((current) => current ? { ...current, tiktok_url: cleanSocialHandle(e.target.value) } : current)} /></label>
              </div>
            </section>
            <div className="buttonRow">
              <button type="button" className="sectionSave" onClick={() => saveStoreSection(false)}>{t.saveSection}</button>
              <button type="button" className="ghostBtn" onClick={() => saveStoreSection(true)}>{t.saveClose}</button>
            </div>
          </Panel>

          <Panel id="branding" title={t.branding} openPanel={openPanel} setOpenPanel={closePanelFully} state={saveState}>
            <section className="heroMediaBox">
              <div><h3>{t.heroMedia}</h3><p>{t.heroHelp}</p></div>
              <div className="buttonRow">
                <button type="button" className={heroMediaType === 'image' ? 'choiceBtn active' : 'choiceBtn'} onClick={() => { setHeroMediaType('image'); setRestaurant((current) => current ? { ...current, hero_media_type: 'image' } : current); }}>{t.useHeroImage}</button>
                <button type="button" className={heroMediaType === 'video' ? 'choiceBtn active' : 'choiceBtn'} onClick={() => { setHeroMediaType('video'); setRestaurant((current) => current ? { ...current, hero_media_type: 'video' } : current); }}>{t.useHeroVideo}</button>
              </div>
            </section>
            <div className="uploadGrid">
              <div className="uploadCard"><img src={logo} alt="Logo preview" onError={handleBrokenImage} /><button type="button" className="mainBtn" onClick={() => fileLogoRef.current?.click()}>{t.uploadLogo}</button></div>
              <div className="uploadCard"><img src={hero} alt="Hero preview" onError={handleBrokenImage} /><button type="button" className="mainBtn" onClick={() => fileHeroRef.current?.click()}>{t.uploadHero}</button></div>
            </div>
            <div className="videoPreviewCard">{heroVideo ? <video key={heroVideo} src={heroVideo} autoPlay muted loop playsInline controls={false} preload="auto" onLoadedData={replayPreviewVideo} onCanPlay={replayPreviewVideo} onLoadedMetadata={replayPreviewVideo} /> : <div className="videoEmpty">No hero video uploaded yet.</div>}<button type="button" className="mainBtn" onClick={() => fileHeroVideoRef.current?.click()}>{t.uploadHeroVideo}</button></div>
            <div className="buttonRow"><button type="button" className="sectionSave" onClick={() => saveBrandingSection(false)}>{t.saveSection}</button><button type="button" className="ghostBtn" onClick={() => saveBrandingSection(true)}>{t.saveClose}</button></div>
          </Panel>

          <Panel id="controls" title={t.styleControls} openPanel={openPanel} setOpenPanel={closePanelFully} state={saveState}>
            <div className="controlChoiceGrid">
              {[
                { id: 'colors', title: t.storeColors, sub: ACCENTS.find((a) => a.key === storeAccent)?.label || 'Color' },
                { id: 'order', title: t.orderControls, sub: `${restaurant?.pickup_enabled ? 'Pickup ON' : 'Pickup OFF'} · ${restaurant?.delivery_enabled ? 'Delivery ON' : 'Delivery OFF'}` },
                { id: 'delivery', title: t.deliveryControls, sub: `${money(restaurant?.delivery_fee)} fee · ${restaurant?.delivery_radius || 5} miles` },
                { id: 'language', title: t.languageControls, sub: `${storeLang.toUpperCase()} · ${storeTheme}` },
              ].map((card) => <button key={card.id} type="button" className={activeControl === card.id ? 'controlCard active' : 'controlCard'} onClick={() => setActiveControl(activeControl === card.id ? '' : card.id as ControlPanelId)}><strong>{card.title}</strong><span>{card.sub}</span><b>{activeControl === card.id ? t.close : t.open}</b></button>)}
            </div>

            {activeControl === 'colors' ? <section className="styleBox">
              <div className="accentGrid">{ACCENTS.map((accent) => <button type="button" key={accent.key} className={storeAccent === accent.key ? `accentCard accent-${accent.key} active` : `accentCard accent-${accent.key}`} onClick={() => { setStoreAccent(accent.key); setRestaurant((current) => current ? { ...current, storefront_accent: accent.key } : current); }}><i /><strong>{accent.label}</strong><small>{accent.sub}</small></button>)}</div>
              <div className="buttonRow"><button type="button" className="sectionSave" onClick={() => saveControlsSection(false)}>{t.saveSection}</button><button type="button" className="ghostBtn" onClick={() => saveControlsSection(true)}>{t.saveClose}</button></div>
            </section> : null}

            {activeControl === 'order' ? <section className="miniControlPanel">
              <div className="buttonRow">
                <button type="button" className={restaurant?.pickup_enabled ? 'choiceBtn active' : 'choiceBtn'} onClick={() => setRestaurant((current) => current ? { ...current, pickup_enabled: !current.pickup_enabled } : current)}>{t.pickup}: {restaurant?.pickup_enabled ? 'ON' : 'OFF'}</button>
                <button type="button" className={restaurant?.delivery_enabled ? 'choiceBtn active' : 'choiceBtn'} onClick={() => setRestaurant((current) => current ? { ...current, delivery_enabled: !current.delivery_enabled } : current)}>{t.delivery}: {restaurant?.delivery_enabled ? 'ON' : 'OFF'}</button>
              </div>
              <div className="buttonRow"><button type="button" className="sectionSave" onClick={() => saveControlsSection(false)}>{t.saveSection}</button><button type="button" className="ghostBtn" onClick={() => saveControlsSection(true)}>{t.saveClose}</button></div>
            </section> : null}

            {activeControl === 'delivery' ? <section className="miniControlPanel">
              <div className="threeGrid">
                <label>{t.deliveryFee}<input type="number" value={restaurant?.delivery_fee ?? 0} onChange={(e) => setRestaurant((current) => current ? { ...current, delivery_fee: Number(e.target.value) } : current)} /></label>
                <label>{t.deliveryMin}<input type="number" value={restaurant?.delivery_minimum ?? 0} onChange={(e) => setRestaurant((current) => current ? { ...current, delivery_minimum: Number(e.target.value) } : current)} /></label>
                <label>{t.radius}<input type="number" value={restaurant?.delivery_radius ?? 5} onChange={(e) => setRestaurant((current) => current ? { ...current, delivery_radius: Number(e.target.value) } : current)} /></label>
              </div>
              <div className="buttonRow"><button type="button" className="sectionSave" onClick={() => saveControlsSection(false)}>{t.saveSection}</button><button type="button" className="ghostBtn" onClick={() => saveControlsSection(true)}>{t.saveClose}</button></div>
            </section> : null}

            {activeControl === 'language' ? <section className="miniControlPanel languagePanelFixed">
              <div className="buttonRow">
                <button type="button" className={storeTheme === 'light' ? 'choiceBtn active' : 'choiceBtn'} onClick={() => setStoreTheme('light')}>{t.light}</button>
                <button type="button" className={storeTheme === 'dark' ? 'choiceBtn active' : 'choiceBtn'} onClick={() => setStoreTheme('dark')}>{t.dark}</button>
              </div>
              <div className="builderLangButtons">
                <button type="button" className={storeLang === 'en' ? 'active' : ''} disabled={saving} onClick={() => setBuilderLanguage('en', true)}>English</button>
                <button type="button" className={storeLang === 'es' ? 'active' : ''} disabled={saving} onClick={() => setBuilderLanguage('es', true)}>Español</button>
              </div>
              <div className="buttonRow"><button type="button" className="sectionSave" onClick={() => saveControlsSection(false)}>{t.saveSection}</button><button type="button" className="ghostBtn" onClick={() => saveControlsSection(true)}>{t.saveClose}</button></div>
            </section> : null}
          </Panel>

          <Panel id="hours" title={t.hours} openPanel={openPanel} setOpenPanel={closePanelFully} state={saveState}>
            <div className="hoursGrid">
              {DAYS.map(([key, label]) => <div key={key} className="hourRow"><strong>{label}</strong><button type="button" className={hours[key].isOpen ? 'choiceBtn active' : 'choiceBtn'} onClick={() => setHours((current) => ({ ...current, [key]: { ...current[key], isOpen: !current[key].isOpen } }))}>{hours[key].isOpen ? t.open : t.closed}</button><input type="time" value={hours[key].open} onChange={(e) => setHours((current) => ({ ...current, [key]: { ...current[key], open: e.target.value } }))} /><input type="time" value={hours[key].close} onChange={(e) => setHours((current) => ({ ...current, [key]: { ...current[key], close: e.target.value } }))} /></div>)}
            </div>
            <div className="buttonRow"><button type="button" className="sectionSave" onClick={() => saveHoursSection(false)}>{t.saveSection}</button><button type="button" className="ghostBtn" onClick={() => saveHoursSection(true)}>{t.saveClose}</button></div>
          </Panel>

          <Panel id="menu" title={t.menu} openPanel={openPanel} setOpenPanel={closePanelFully} state={saveState}>
            {!menuWorkspaceKey ? <>
              <section className="sectionIntro"><h3>{t.chooseMenuCategory}</h3><p>{t.chooseMenuCategoryText}</p></section>
              <div className="categoryChoiceGrid">{OWNER_CATEGORY_CHOICES.map((choice) => {
                const existing = regularCategories.find((cat) => categoryKey(cat.name) === categoryKey(choice.key) || normalize(cat.name) === normalize(choice.key));
                const count = existing ? categoryCounts.get(existing.id) || 0 : 0;
                return <button key={choice.key} type="button" className={existing ? 'menuPickCard live' : 'menuPickCard'} onClick={() => openCategoryWorkspace(existing?.id || choice.key)}><span>{choice.emoji}</span><strong>{choice.label}</strong><small>{existing ? t.existingCategory : t.presetCategory}</small><b>{count} {t.hasItems}</b><em>{existing ? t.manage : t.createManage}</em></button>;
              })}</div>
              {regularCategories.filter((cat) => !OWNER_CATEGORY_CHOICES.some((choice) => categoryKey(choice.key) === categoryKey(cat.name))).length ? <>
                <h3 className="customCategoryTitle">Custom Collections</h3>
                <div className="categoryChoiceGrid">{regularCategories.filter((cat) => !OWNER_CATEGORY_CHOICES.some((choice) => categoryKey(choice.key) === categoryKey(cat.name))).map((cat) => <button key={cat.id} type="button" className="menuPickCard live" onClick={() => openCategoryWorkspace(cat.id)}><span>🍽️</span><strong>{pretty(cat.name)}</strong><small>{t.existingCategory}</small><b>{categoryCounts.get(cat.id) || 0} {t.hasItems}</b><em>{t.manage}</em></button>)}</div>
              </> : null}
            </> : null}

            {menuWorkspaceKey ? <section className="menuWorkspace">
              <div className="workspaceTop"><div><small>{workspaceCategory ? t.existingCategory : t.presetCategory}</small><h3>{pretty(workspaceCategory?.name || workspacePreset?.label || menuWorkspaceKey)}</h3><p>{workspaceCategory ? `${workspaceItems.length} ${t.hasItems}` : 'Create this collection and add products.'}</p></div><button type="button" className="ghostBtn" onClick={() => { setMenuWorkspaceKey(''); setActiveCategoryId('all'); setSelectedItemId(''); }}>{t.close}</button></div>
              {workspaceCategory ? <div className="miniEditCard categoryNameOnly"><label>Collection Name<input value={workspaceCategory.name} onChange={(e) => setCategories((prev) => prev.map((c) => c.id === workspaceCategory.id ? { ...c, name: e.target.value } : c))} onBlur={(e) => saveCategory(workspaceCategory.id, { name: e.target.value })} /></label></div> : null}
              <div className="presetQuickAdd">{(workspacePreset?.items || [pretty(menuWorkspaceKey)]).map((itemName) => <button key={itemName} type="button" onClick={() => addItem(itemName, workspaceCategory?.name || workspacePreset?.key || menuWorkspaceKey)}>+ {itemName}</button>)}<button type="button" onClick={() => addItem(pretty(workspaceCategory?.name || workspacePreset?.key || menuWorkspaceKey), workspaceCategory?.name || workspacePreset?.key || menuWorkspaceKey)}>{t.addCustomItem}</button></div>
              {workspaceCategory ? <>
                {workspaceItems.length ? <div className="itemList drawerList">{workspaceItems.map((item, index) => <button key={item.id} type="button" className={selectedItemId === item.id ? 'itemCard active' : 'itemCard'} onClick={() => { setSelectedItemId(item.id); setDeleteMode('item'); }}><div className="itemMediaPreview"><img src={getItemImage(item, workspaceCategory.name, index)} alt={item.name} onError={(event) => handleMenuImageError(event, item, workspaceCategory.name, index)} /></div><strong>{item.name}</strong><span>{money(item.base_price ?? item.price)}</span></button>)}</div> : <div className="emptyBox">{t.emptyCategory}</div>}
                {selectedItem && selectedItem.category_id === workspaceCategory.id ? <EditItemBox t={t} selectedItem={selectedItem} selectedCategory={workspaceCategory} galleryOptions={galleryOptions} bucketImagesLoading={bucketImagesLoading} fileItemRef={fileItemRef} setItems={setItems} saveItem={saveItem} /> : null}
                <div className="deleteControlBox"><div><strong>{t.delete}</strong><p>{t.deleteHelp}</p></div><div className="deleteToggle"><button type="button" className={deleteMode === 'item' ? 'on' : ''} onClick={() => setDeleteMode('item')}>{t.deleteItem}</button><button type="button" className={deleteMode === 'category' ? 'on' : ''} onClick={() => setDeleteMode('category')}>{t.deleteCategory}</button></div><button type="button" className="dangerBtn oneDeleteButton" onClick={runOneDeleteButton} disabled={saving || (deleteMode === 'item' && !workspaceItems.length)}>{t.delete}</button></div>
                <div className="buttonRow"><button type="button" className="sectionSave" onClick={saveMenuWorkspaceAndClose}>{saving ? t.saving : t.saveClose}</button></div>
              </> : null}
            </section> : null}
          </Panel>

          <Panel id="videos" title="Product Videos" openPanel={openPanel} setOpenPanel={closePanelFully} state={saveState}>
            <section className="videoManagerHero"><div><small>PRODUCT VIDEO BUILDER</small><h3>Upload, price, edit, and delete product videos</h3><p>Videos show inside the Live Store Preview under Product Videos and All Products.</p></div><button type="button" className="menuVideoUploadButton" onClick={addVideoItem} disabled={saving}>+ Add Product Video</button></section>
            {videoItems.length ? <section className="videoManagerGrid">{videoItems.map((videoItem) => {
              const active = selectedVideoItem?.id === videoItem.id;
              const videoUrl = localItemVideoPreviews[videoItem.id] || savedItemVideo(videoItem);
              const posterImage = localItemImagePreviews[videoItem.id] || getItemImage(videoItem, 'universal');
              return <article key={videoItem.id} className={active ? 'videoManagerCard active' : 'videoManagerCard'}><button type="button" className="videoPreviewButton" onClick={() => { setSelectedVideoId(videoItem.id); setActiveCategoryId('VIDEO_MENU'); }}>{videoUrl ? <video key={videoUrl} src={videoUrl} poster={posterImage} autoPlay muted loop playsInline controls={false} preload="auto" onLoadedData={replayPreviewVideo} onCanPlay={replayPreviewVideo} onLoadedMetadata={replayPreviewVideo} onError={(event) => { event.currentTarget.load(); }} /> : <div className="videoUploadPlaceholder">No product video uploaded yet</div>}</button><div className="videoEditFields"><label>Product Name<input value={videoItem.name || ''} onChange={(e) => setItems((prev) => prev.map((item) => item.id === videoItem.id ? { ...item, name: e.target.value } : item))} onBlur={(e) => saveItem(videoItem.id, { name: e.target.value, availability: VIDEO_MENU_AVAILABILITY })} /></label><label>Product Price<input type="number" value={videoItem.base_price ?? videoItem.price ?? 0} onChange={(e) => setItems((prev) => prev.map((item) => item.id === videoItem.id ? { ...item, base_price: Number(e.target.value), price: Number(e.target.value) } : item))} onBlur={(e) => saveItem(videoItem.id, { base_price: Number(e.target.value), price: Number(e.target.value), availability: VIDEO_MENU_AVAILABILITY })} /></label><label>Description<textarea value={videoItem.description || ''} onChange={(e) => setItems((prev) => prev.map((item) => item.id === videoItem.id ? { ...item, description: e.target.value } : item))} onBlur={(e) => saveItem(videoItem.id, { description: e.target.value, availability: VIDEO_MENU_AVAILABILITY })} /></label></div><div className="videoManagerActions"><button type="button" className="mainBtn videoBtn" onClick={() => { videoUploadTargetIdRef.current = videoItem.id; setSelectedVideoId(videoItem.id); setActiveCategoryId('VIDEO_MENU'); setTimeout(() => fileItemVideoRef.current?.click(), 0); }}>🎥 Upload / Replace Product Video</button><button type="button" className="dangerBtn" onClick={() => deleteVideoItem(videoItem.id)}>Delete Product Video</button></div></article>;
            })}</section> : <section className="emptyVideoMenu"><h3>No product videos yet</h3><p>Tap Add Product Video. Then name it, price it, upload the video, and it will show in the Live Store Preview.</p><button type="button" className="menuVideoUploadButton" onClick={addVideoItem} disabled={saving}>+ Add First Product Video</button></section>}
          </Panel>
        </aside>

        <aside className="rightPreview">
          <StorePhonePreview
            t={t}
            storeName={storeName}
            logo={logo}
            hero={hero}
            heroVideo={heroVideo}
            heroMediaType={heroMediaType}
            restaurant={restaurant}
            categories={regularCategories}
            activeCategoryId={activeCategoryId}
            setActiveCategoryId={setActiveCategoryId}
            items={previewItems}
            selectedItem={selectedItem}
            selectedVideoItem={selectedVideoItem}
            setSelectedItemId={setSelectedItemId}
            setSelectedVideoId={setSelectedVideoId}
            storeTheme={storeTheme}
            storeAccent={storeAccent}
            videoCount={videoItems.length}
            localItemImagePreviews={localItemImagePreviews}
            localItemVideoPreviews={localItemVideoPreviews}
          />
        </aside>
      </section>

      <footer className="saveFooter"><span className={`saveDot ${saveState.toLowerCase()}`} /><strong>{saveState === 'Saved' ? t.saved : saveState === 'Saving' ? t.saving : t.error}</strong><em>{lastSaved}</em></footer>

      <section className={`promoStorefrontSection promoAccent-${currentAccentClass()}`}>
        <div className="promoStorefrontCard">
          <div className="promoTop">
            <div>
              <small>PROMOTE</small>
              <h2>Promote Storefront</h2>
              <p>Share your real storefront, menu, rewards, and reviews using the store data already saved in Builder.</p>
            </div>

            <a
              className="promoVisitBtn"
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
            >
              Visit Storefront
            </a>
          </div>

          <div className="promoPreview">
            {(currentStoreHeroImage() || currentStoreLogoImage()) ? (
              <img
                src={resolveUrl(currentStoreHeroImage() || currentStoreLogoImage())}
                alt="Storefront preview"
                onError={handleBrokenImage}
              />
            ) : (
              <div className="promoPlaceholder">
                <strong>{currentStoreName()}</strong>
              </div>
            )}

            <div className="promoPreviewShade" />

            <div className="promoPreviewOverlay">
              <span>Shop this store</span>
              <strong>{currentStoreName()}</strong>
              <em>{storefrontPromoLink()}</em>
            </div>
          </div>

          <div className="promoCaptionBox">
            <span>Ready-to-post caption</span>
            <p>{promoCaption('storefront')}</p>
          </div>

          <div className="promoButtonGrid">
            <button type="button" className="promoActionBtn" onClick={() => shareStorefrontPromo('storefront')}>
              Share Storefront
            </button>

            <button type="button" className="promoActionBtn" onClick={() => shareStorefrontPromo('menu')}>
              Share Products
            </button>

            <button type="button" className="promoActionBtn" onClick={() => shareStorefrontPromo('rewards')}>
              Share Rewards
            </button>

            <button type="button" className="promoActionBtn" onClick={() => shareStorefrontPromo('review')}>
              Share Reviews
            </button>

            <button type="button" className="promoCopyBtn" onClick={() => copyPromoCaption('storefront')}>
              Copy Store Link
            </button>
          </div>

          <p className="promoShareNote">
            Social apps control what appears in the Mac/iPhone share sheet. 7th St Vault always copies the exact storefront link and caption so it can be pasted anywhere.
          </p>
        </div>
      </section>

      <style jsx global>{styles}</style>
    </main>
  );
}

function EditItemBox({
  t,
  selectedItem,
  selectedCategory,
  galleryOptions,
  bucketImagesLoading,
  fileItemRef,
  setItems,
  saveItem,
}: {
  t: (typeof COPY)[Lang];
  selectedItem: MenuItem;
  selectedCategory: Category | null;
  galleryOptions: ImageOption[];
  bucketImagesLoading: boolean;
  fileItemRef: React.RefObject<HTMLInputElement | null>;
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  saveItem: (id: string, patch: Partial<MenuItem>) => Promise<void>;
}) {
  const image = getItemImage(selectedItem, selectedCategory?.name);
  return (
    <div className="editItemBox">
      <div className="selectedPreview">
        <img src={image} alt={selectedItem.name} onError={(event) => handleMenuImageError(event, selectedItem, selectedCategory?.name)} />
        <div><small>SELECTED PHOTO ITEM</small><h3>{selectedItem.name}</h3><p>{money(selectedItem.base_price ?? selectedItem.price)}</p><div className="buttonRow"><button type="button" className="mainBtn" onClick={() => fileItemRef.current?.click()}>{t.uploadItem}</button></div></div>
      </div>
      <div className="imagePicker">
        <div><h3>{t.pickImage}</h3><p>{t.pickImageText}</p></div>
        <div className="emptyBox">7th St Vault uses seller-uploaded fashion photos and product videos only. Use the upload button above to add the real product media for this item.</div>
      </div>
      <div className="twoGrid">
        <label>{t.itemName}<input value={selectedItem.name} onChange={(e) => setItems((prev) => prev.map((item) => item.id === selectedItem.id ? { ...item, name: e.target.value } : item))} onBlur={(e) => saveItem(selectedItem.id, { name: e.target.value })} /></label>
        <label>{t.basePrice}<input type="number" value={selectedItem.base_price ?? selectedItem.price ?? 0} onChange={(e) => setItems((prev) => prev.map((item) => item.id === selectedItem.id ? { ...item, base_price: Number(e.target.value), price: Number(e.target.value) } : item))} onBlur={(e) => saveItem(selectedItem.id, { base_price: Number(e.target.value), price: Number(e.target.value) })} /></label>
      </div>
      <label>{t.description}<textarea value={selectedItem.description || ''} onChange={(e) => setItems((prev) => prev.map((item) => item.id === selectedItem.id ? { ...item, description: e.target.value } : item))} onBlur={(e) => saveItem(selectedItem.id, { description: e.target.value })} /></label>
    </div>
  );
}

function Panel({
  id,
  title,
  openPanel,
  setOpenPanel,
  state,
  children,
}: {
  id: BuilderPanelId;
  title: string;
  openPanel: BuilderPanelId;
  setOpenPanel: (value?: BuilderPanelId) => void;
  state: SaveState;
  children: ReactNode;
}) {
  if (openPanel !== id) return null;
  return <section className="builderPanel openOnlyPanel"><div className="openPanelTop"><div><strong>{title}</strong><small>Pick it, edit it, save it, close it, then move to the next section.</small></div><span className={`panelState ${state.toLowerCase()}`}>{state}</span><button type="button" className="closePanelBtn" onClick={() => setOpenPanel('')}>Close</button></div><div className="panelBody">{children}</div></section>;
}

function StorePhonePreview({
  t,
  storeName,
  logo,
  hero,
  heroVideo,
  heroMediaType,
  restaurant,
  categories,
  activeCategoryId,
  setActiveCategoryId,
  items,
  selectedItem,
  selectedVideoItem,
  setSelectedItemId,
  setSelectedVideoId,
  storeTheme,
  storeAccent,
  videoCount,
  localItemImagePreviews = {},
  localItemVideoPreviews = {},
}: {
  t: (typeof COPY)[Lang];
  storeName: string;
  logo: string;
  hero: string;
  heroVideo: string;
  heroMediaType: HeroMediaType;
  restaurant: Restaurant | null;
  categories: Category[];
  activeCategoryId: string;
  setActiveCategoryId: (value: string) => void;
  items: MenuItem[];
  selectedItem: MenuItem | null;
  selectedVideoItem: MenuItem | null;
  setSelectedItemId: (value: string) => void;
  setSelectedVideoId: (value: string) => void;
  storeTheme: StoreTheme;
  storeAccent: StoreAccent;
  videoCount: number;
  localItemImagePreviews?: Record<string, string>;
  localItemVideoPreviews?: Record<string, string>;
}) {
  return <section className={`previewShell accent-${storeAccent}`}><div className="previewHeader"><div><h2>{t.preview}</h2><p>{t.livePreviewNote}</p></div></div><div className={`phoneFrame ${storeTheme}`}><div className="phoneScreen"><div className="phoneTop"><button type="button">☰</button><img src={logo} alt={storeName} onError={handleBrokenImage} /><button type="button">🛒</button></div><section className="phoneHero">{heroMediaType === 'video' && heroVideo ? <video key={heroVideo} className="phoneHeroVideo" src={heroVideo} autoPlay muted loop playsInline controls={false} preload="auto" onLoadedData={replayPreviewVideo} onCanPlay={replayPreviewVideo} onLoadedMetadata={replayPreviewVideo} /> : <img className="phoneHeroImage" src={hero} alt={storeName} onError={handleBrokenImage} />}<div className="phoneHeroShade" /><div className="phoneHeroCopy"><small>{t.promo}</small><h3>{storeName}</h3><p>{restaurant?.address || t.fresh}</p><button type="button">{t.orderNow} →</button></div></section><section className="phoneChips"><span>{t.pickup}: {restaurant?.pickup_enabled ? 'ON' : 'OFF'}</span><span>{t.delivery}: {restaurant?.delivery_enabled ? 'ON' : 'OFF'}</span><span>{money(restaurant?.delivery_fee)} Fee</span></section><h4 className="phoneSectionTitle">{t.categories}</h4><section className="phoneTabs"><button type="button" className={activeCategoryId === 'all' ? 'active' : ''} onClick={() => setActiveCategoryId('all')}>All</button>{categories.map((cat) => <button key={cat.id} type="button" className={activeCategoryId === cat.id ? 'active' : ''} onClick={() => setActiveCategoryId(cat.id)}>{pretty(cat.name)}</button>)}{videoCount > 0 ? <button type="button" className={activeCategoryId === 'VIDEO_MENU' ? 'active videoTab' : 'videoTab'} onClick={() => setActiveCategoryId('VIDEO_MENU')}>▶ {t.videos}</button> : null}</section><section className="phoneItems">{items.length ? items.map((item, index) => { const cat = categories.find((category) => category.id === item.category_id); const image = getItemImage(item, cat?.name || 'universal', index); const video = localItemVideoPreviews[item.id] || getItemVideo(item); const videoItem = isVideoMenuItem(item) && !!video; return <button key={item.id} type="button" className={(selectedItem?.id === item.id || selectedVideoItem?.id === item.id) ? 'phoneItem active' : videoItem ? 'phoneItem videoPhoneItem' : 'phoneItem'} onClick={() => videoItem ? setSelectedVideoId(item.id) : setSelectedItemId(item.id)}>{videoItem ? <div className="phoneVideoThumb"><video key={video} src={video} poster={image} autoPlay muted loop playsInline controls={false} preload="auto" onLoadedData={replayPreviewVideo} onCanPlay={replayPreviewVideo} onLoadedMetadata={replayPreviewVideo} /><span>▶</span></div> : <img src={image} alt={item.name} onError={(event) => handleMenuImageError(event, item, cat?.name, index)} />}<div><strong>{item.name}</strong><p>{item.description || t.fresh}</p><span>{money(item.base_price ?? item.price)}</span></div></button>; }) : <div className="phoneEmptyMenu">No products yet. Add a product.</div>}</section><div className="phoneCart"><div><strong>0 products</strong><span>{t.cart}</span></div><button type="button">{t.cart} →</button></div></div></div></section>;
}

const styles = `
:root{--bg:#07080d;--card:#11131a;--ink:#f4f4f6;--muted:#a6abb8;--line:rgba(180,185,200,.20);--vault-dark:#07080d;--vault-violet:#7c8092;--vault-wave:linear-gradient(135deg,#05060a 0%,#11131a 44%,#252936 78%,#4b5567 100%);--vault-soft:linear-gradient(135deg,rgba(180,185,200,.13),rgba(75,85,103,.11))}*{box-sizing:border-box}html,body{margin:0;background:#05050b;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-x:hidden}button,input,select,textarea{font:inherit}button{cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}img{max-width:100%}.ordaBuilderPage{min-height:100vh;padding:22px;background:radial-gradient(circle at 18% 0%,rgba(120,126,145,.20),transparent 32%),radial-gradient(circle at 84% 4%,rgba(36,41,54,.28),transparent 30%),linear-gradient(180deg,#05050b 0%,#0b0d18 52%,#05050b 100%)}.loadingBox,.errorBanner{max-width:1200px;margin:40px auto;padding:18px 22px;border-radius:20px;background:#fff;border:1px solid var(--line);font-weight:950}.errorBanner{margin:0 auto 18px;color:#9f1239;background:#fff1f2;border-color:#fecdd3}.builderHeader{max-width:1580px;margin:0 auto 20px;display:flex;justify-content:space-between;align-items:center;gap:18px}.brandRow{display:flex;align-items:center;gap:18px;min-width:0}.ordaLogo{width:210px;height:auto;object-fit:contain;flex-shrink:0}.builderHeader h1{margin:0;font-size:42px;line-height:1;font-weight:950;letter-spacing:-.05em;color:#64748b;text-shadow:0 1px 0 #fff,0 3px 0 #b9c1cf,0 8px 18px rgba(15,23,42,.16)}.builderHeader p{margin:7px 0 0;color:var(--muted);font-weight:800;max-width:760px}.headerActions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;align-items:center}.headerLangSwitch{height:50px;display:grid;grid-template-columns:1fr 1fr;gap:5px;border:1px solid var(--line);background:#fff;border-radius:16px;padding:5px;box-shadow:0 10px 20px rgba(15,23,42,.045)}.headerLangSwitch button{min-width:54px;border:0;border-radius:12px;background:#f1f5f9;color:#111827;font-weight:1000}.headerLangSwitch button.active{background:var(--vault-wave);color:#fff}.languageToggleBtn{min-width:60px}.builderLangButtons{display:grid;grid-template-columns:1fr 1fr;gap:12px}.builderLangButtons button{min-height:64px;border:1px solid var(--line);border-radius:18px;background:#fff;color:#111827;font-size:20px;font-weight:1000}.builderLangButtons button.active{background:var(--vault-wave);color:#fff;border-color:rgba(120,126,145,.55);box-shadow:0 0 0 5px rgba(184,189,201,.16)}.mainBtn,.ghostBtn,.sectionSave,.dangerBtn,.choiceBtn{min-height:50px;border-radius:16px;border:1px solid var(--line);padding:0 18px;font-weight:950}.mainBtn,.sectionSave{background:var(--vault-wave);color:#fff;border-color:rgba(120,126,145,.45);box-shadow:0 18px 36px rgba(184,189,201,.18),0 10px 28px rgba(15,23,42,.18)}.ghostBtn{background:#fff;color:#111827}.dangerBtn{background:linear-gradient(180deg,#fff1f2,#ffe4e6);color:#be123c;border-color:#fb7185;box-shadow:0 0 0 5px rgba(244,63,94,.12),0 18px 34px rgba(190,18,60,.22);font-weight:1000}.choiceBtn{background:rgba(255,255,255,.08);color:#f8fafc;border-color:rgba(255,255,255,.14)}.choiceBtn.active{background:linear-gradient(135deg,#121722,#252c3a,#3d4658);color:#fff;border-color:rgba(255,255,255,.22)}.builderLayout{max-width:1580px;margin:0 auto;display:grid;grid-template-columns:minmax(0,760px) minmax(390px,1fr);gap:22px;align-items:start}.leftEditor{display:grid;gap:16px;min-width:0}.rightPreview{position:sticky;top:14px;min-width:0}.quickPickBar{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;background:rgba(255,255,255,.93);border:1px solid var(--line);border-radius:24px;padding:12px;box-shadow:0 18px 45px rgba(15,23,42,.055);position:sticky;top:10px;z-index:40}.workingGlow{box-shadow:0 0 0 3px rgba(86,93,112,.12),0 0 38px rgba(86,93,112,.20),0 18px 45px rgba(15,23,42,.08);border-color:rgba(86,93,112,.28)}.quickPickBar button{min-height:50px;border-radius:16px;border:1px solid var(--line);background:#fff;font-weight:950;box-shadow:0 8px 20px rgba(15,23,42,.04)}.quickPickBar button.active{background:linear-gradient(180deg,#111827,#050505);color:#fff;border-color:#111827;box-shadow:0 14px 30px rgba(15,23,42,.18),0 0 0 4px rgba(86,93,112,.18)}.builderPanel,.previewShell,.saveFooter{background:rgba(255,255,255,.9);border:1px solid var(--line);border-radius:24px;box-shadow:0 18px 45px rgba(15,23,42,.055);overflow:hidden}.panelState{border-radius:999px;padding:8px 13px;font-size:12px;font-weight:950;background:#ecfdf3;color:#16a34a}.panelState.saving{background:#eff6ff;color:#2563eb}.panelState.error{background:#fff1f2;color:#be123c}.openOnlyPanel{overflow:hidden}.openPanelTop{min-height:82px;padding:18px 20px;border-bottom:1px solid var(--line);background:#fff;display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center}.openPanelTop strong{display:block;font-size:24px;font-weight:1000;letter-spacing:-.03em}.openPanelTop small{display:block;margin-top:5px;color:#64748b;font-weight:850}.closePanelBtn{min-height:44px;border-radius:14px;border:1px solid var(--line);background:#111827;color:#fff;font-weight:950;padding:0 16px}.panelBody{padding:20px;display:grid;gap:16px}.twoGrid,.uploadGrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.threeGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}label{display:grid;gap:8px;color:#111827;font-weight:950}input,select,textarea{width:100%;border:1px solid #dce3ed;border-radius:16px;background:#fff;color:#0f172a;padding:15px 16px;font-weight:800;outline:none}input:focus,select:focus,textarea:focus{border-color:#64748b;box-shadow:0 0 0 4px rgba(100,116,139,.12)}textarea{min-height:110px;resize:vertical}small{color:#64748b;font-weight:800}.uploadCard,.videoPreviewCard,.socialBox,.heroMediaBox{border:1px solid var(--line);border-radius:20px;background:#fff;padding:14px;display:grid;gap:12px}.uploadCard img{width:100%;height:170px;border-radius:16px;object-fit:cover;background:#e2e8f0}.videoPreviewCard video,.videoEmpty{width:100%;height:220px;border-radius:16px;object-fit:cover;background:#0f172a;color:#fff;display:grid;place-items:center;font-weight:1000}.socialBox h3,.heroMediaBox h3{margin:0;font-size:22px;font-weight:1000}.socialBox p,.heroMediaBox p{margin:0;color:#64748b;font-weight:850;line-height:1.4}.buttonRow{display:flex;gap:10px;flex-wrap:wrap}.videoBtn{background:linear-gradient(180deg,#fff 0%,#fbcfe8 45%,#565d70 100%)}.controlChoiceGrid{border:2px solid #f9a8d4;background:linear-gradient(135deg,#fff,#fdf2f8);border-radius:24px;padding:18px;display:grid;gap:14px;box-shadow:0 16px 42px rgba(219,39,119,.12),0 0 0 6px rgba(244,114,182,.10)}.categoryChoiceGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.controlCard,.menuPickCard{border:1px solid var(--line);border-radius:20px;background:#fff;padding:18px;text-align:left;display:grid;gap:8px;min-height:130px}.controlCard.active,.menuPickCard.live{border-color:#565d70;box-shadow:0 0 0 4px rgba(86,93,112,.12)}.controlCard strong,.menuPickCard strong{font-size:20px;font-weight:1000}.controlCard span,.menuPickCard small{color:#64748b;font-weight:850}.controlCard b,.menuPickCard em{justify-self:start;border-radius:999px;background:#f1f5f9;padding:8px 12px;font-style:normal;font-weight:950}.menuPickCard span{font-size:36px}.menuPickCard b{color:#565d70;font-weight:1000}.sectionIntro{border:1px solid var(--line);border-radius:20px;background:linear-gradient(135deg,#fff,#f8fafc);padding:18px}.sectionIntro h3,.customCategoryTitle{margin:0;font-size:24px;font-weight:1000}.sectionIntro p{margin:8px 0 0;color:#64748b;font-weight:850;line-height:1.4}.styleBox,.miniControlPanel,.menuWorkspace{border:1px solid var(--line);background:linear-gradient(135deg,#fff,#f8fafc);border-radius:22px;padding:18px;display:grid;gap:16px}.workspaceTop{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.workspaceTop h3{margin:0;font-size:38px;font-weight:950}.workspaceTop p{margin:7px 0 0;color:var(--muted);font-weight:800;line-height:1.4;font-size:20px}.workspaceTop small{font-size:16px}.accentGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.accentCard{min-height:94px;border:1px solid var(--line);border-radius:18px;background:#fff;padding:14px;text-align:left;display:grid;grid-template-columns:44px 1fr;gap:3px 12px;align-items:center}.accentCard i{grid-row:1/3;width:44px;height:44px;border-radius:15px;background:var(--accent);box-shadow:0 12px 25px var(--glow)}.accentCard strong{font-size:14px;font-weight:950}.accentCard small{font-size:12px}.accentCard.active{outline:4px solid var(--glow);border-color:var(--accent)}.accent-silver{--accent:#cbd5e1;--accentText:#111827;--glow:rgba(148,163,184,.32)}.accent-gold{--accent:#d6a54b;--accentText:#111827;--glow:rgba(214,165,75,.32)}.accent-orange{--accent:#f97316;--accentText:#fff;--glow:rgba(249,115,22,.32)}.accent-red{--accent:#dc2626;--accentText:#fff;--glow:rgba(220,38,38,.32)}.accent-blue{--accent:#2563eb;--accentText:#fff;--glow:rgba(37,99,235,.32)}.accent-purple{--accent:#565d70;--accentText:#fff;--glow:rgba(86,93,112,.32)}.accent-lime{--accent:#84cc16;--accentText:#111827;--glow:rgba(132,204,22,.34)}.accent-mono{--accent:#111827;--accentText:#fff;--glow:rgba(17,24,39,.25)}.accent-pink{--accent:#ff2d95;--accentText:#fff;--glow:rgba(255,45,149,.35)}.hoursGrid{display:grid;gap:12px}.hourRow{display:grid;grid-template-columns:1fr 112px 118px 118px;gap:10px;align-items:center;border:1px solid rgba(255,255,255,.11);background:linear-gradient(135deg,rgba(13,16,24,.98),rgba(24,28,38,.94));border-radius:20px;padding:12px 14px;box-shadow:0 14px 32px rgba(0,0,0,.24);color:#f8fafc}.presetQuickAdd{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}.presetQuickAdd button{min-height:64px;border:1px solid var(--line);border-radius:20px;background:#fff;font-weight:950;padding:0 24px;width:100%;text-align:left;font-size:22px}.miniEditCard,.editItemBox,.imagePicker,.selectedPreview{border:1px solid var(--line);border-radius:20px;background:#fff;padding:14px}.categoryNameOnly{padding:22px}.itemList{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.drawerList{max-height:none;overflow:visible;padding:3px}.itemCard{border:1px solid var(--line);border-radius:20px;background:#fff;overflow:hidden;text-align:left;display:grid}.itemCard.active{outline:4px solid rgba(86,93,112,.22);border-color:#565d70}.itemMediaPreview{height:170px;position:relative;background:#e2e8f0}.itemMediaPreview img,.itemMediaPreview video{width:100%;height:100%;object-fit:cover;display:block}.itemCard strong,.itemCard span{padding:10px 14px;font-weight:950}.itemCard span{color:#64748b;padding-top:0}.emptyBox{border:1px dashed var(--line);border-radius:18px;color:var(--muted);padding:24px;text-align:center;font-weight:900}.editItemBox{display:grid;gap:14px;padding:20px}.selectedPreview{display:grid;grid-template-columns:190px 1fr;gap:14px;align-items:center}.selectedPreview img,.selectedPreview video{width:100%;height:165px;border-radius:16px;object-fit:cover;background:#0f172a}.selectedPreview h3{margin:0;font-size:32px;font-weight:950}.selectedPreview p{font-size:28px;color:#6d28d9;font-weight:1000;margin:8px 0 14px}.selectedPreview small{display:block;color:#565d70;font-weight:1000;letter-spacing:.12em;text-transform:uppercase}.imagePicker{display:grid;gap:12px}.imagePicker h3{margin:0;font-size:22px;font-weight:950}.imagePicker p{margin:6px 0 0;color:var(--muted);font-weight:800}.imageOptionGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.imageOptionGrid button{border:1px solid var(--line);border-radius:15px;background:#fff;overflow:hidden;text-align:left;padding:0}.imageOptionGrid button:hover,.imageOptionGrid button:focus{outline:4px solid rgba(86,93,112,.18);border-color:#565d70}.imageOptionGrid img{width:100%;height:150px;object-fit:cover;background:#e2e8f0}.imageOptionGrid strong{display:block;padding:9px;font-size:12px}.menuVideoUploadButton{min-height:68px;border:0;border-radius:20px;background:linear-gradient(180deg,#f9a8d4,#565d70);color:#fff;padding:0 24px;font-weight:1000;font-size:18px;box-shadow:0 18px 40px rgba(219,39,119,.28)}.deleteControlBox{border:1px solid #fecdd3;background:#fff1f2;border-radius:22px;padding:18px;display:grid;gap:14px;box-shadow:0 0 0 5px rgba(244,63,94,.08)}.deleteControlBox strong{font-size:22px;font-weight:1000;color:#9f1239}.deleteControlBox p{margin:6px 0 0;color:#9f1239;font-weight:850}.deleteToggle{display:grid;grid-template-columns:1fr 1fr;gap:10px}.deleteToggle button{min-height:50px;border-radius:15px;border:1px solid #fecdd3;background:#fff;color:#9f1239;font-weight:950}.deleteToggle button.on{background:#9f1239;color:#fff;border-color:#9f1239}.oneDeleteButton{min-height:62px;font-size:20px}.menuWorkspace{padding:26px;min-height:520px}.previewShell{padding:18px;overflow:visible}.previewHeader h2{margin:0;font-size:28px;font-weight:950;letter-spacing:-.03em}.previewHeader p{margin:5px 0 14px;color:var(--muted);font-weight:850}.phoneFrame{width:100%;max-width:430px;height:760px;margin:0 auto;border:12px solid #0f172a;border-radius:50px;overflow:hidden;background:#fff;position:relative;box-shadow:0 26px 70px rgba(15,23,42,.22)}.phoneScreen{height:100%;overflow-y:auto;overflow-x:hidden;background:#f8fafc;position:relative;-webkit-overflow-scrolling:touch}.phoneFrame.dark .phoneScreen{background:#05070a;color:#fff}.phoneTop{height:74px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 18px;position:sticky;top:0;z-index:30;border-bottom:1px solid #e2e8f0}.phoneFrame.dark .phoneTop{background:#0f172a;border-color:#1f2937}.phoneTop img{width:46px;height:46px;border-radius:999px;object-fit:cover;background:#e2e8f0}.phoneTop button{width:44px;height:44px;border:0;border-radius:999px;background:#f1f5f9;font-size:21px}.phoneHero{min-height:350px;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:34px 24px;position:relative;overflow:hidden;background:#0f172a}.phoneHeroImage,.phoneHeroVideo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.phoneHeroShade{position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.64));z-index:2}.phoneHeroCopy{position:relative;z-index:3}.phoneHero small{color:var(--accent);font-size:16px;letter-spacing:.06em;font-weight:950}.phoneHero h3{margin:14px 0 10px;font-size:46px;line-height:.95;letter-spacing:-.06em;font-weight:950}.phoneHero p{margin:0;max-width:310px;font-size:18px;line-height:1.35;font-weight:850}.phoneHero button{margin-top:24px;width:210px;min-height:62px;border:0;border-radius:22px;background:var(--accent);color:var(--accentText);font-size:22px;font-weight:950}.phoneChips{display:flex;flex-wrap:wrap;gap:10px;padding:16px;background:#fff}.phoneFrame.dark .phoneChips{background:#0f172a}.phoneChips span{border-radius:999px;background:#f1f5f9;color:#111827;padding:10px 13px;font-size:13px;font-weight:950}.phoneFrame.dark .phoneChips span{background:#1f2937;color:#fff}.phoneSectionTitle{padding:0 16px;margin:18px 0 10px;font-size:21px;font-weight:950}.phoneTabs{display:flex;gap:10px;overflow-x:auto;padding:0 16px 14px}.phoneTabs button{flex:0 0 auto;min-height:43px;border:0;border-radius:999px;background:#fff;color:#111827;padding:0 18px;font-weight:950;white-space:nowrap}.phoneTabs button.active{background:var(--accent);color:var(--accentText)}.phoneTabs .videoTab{background:#fdf2f8;color:#be185d}.phoneFrame.dark .phoneTabs button{background:#1f2937;color:#fff}.phoneFrame.dark .phoneTabs button.active{background:var(--accent);color:var(--accentText)}.phoneItems{display:grid;gap:12px;padding:0 16px 96px}.phoneItem{min-height:124px;display:grid;grid-template-columns:112px 1fr;gap:12px;text-align:left;border:1px solid #e2e8f0;border-radius:22px;padding:10px;background:#fff;color:#111827}.phoneFrame.dark .phoneItem{background:#0f172a;color:#fff;border-color:#1f2937}.phoneItem.active{outline:4px solid var(--glow);border-color:var(--accent)}.phoneItem img{width:112px;height:104px;border-radius:18px;object-fit:cover;background:#e2e8f0}.phoneVideoThumb{width:112px;height:104px;border-radius:18px;overflow:hidden;background:#111;position:relative}.phoneVideoThumb video{width:100%;height:100%;object-fit:cover;display:block}.phoneVideoThumb span{position:absolute;right:8px;bottom:8px;width:32px;height:32px;border-radius:999px;background:var(--accent);color:var(--accentText);display:grid;place-items:center;font-weight:1000;box-shadow:0 10px 22px rgba(0,0,0,.25)}.videoPhoneItem{border-color:rgba(219,39,119,.32)}.phoneItem strong{display:block;font-size:17px;font-weight:950}.phoneItem p{margin:6px 0;color:#64748b;font-size:13px;font-weight:800;line-height:1.25}.phoneItem span{display:block;color:var(--accent);font-size:19px;font-weight:950}.phoneEmptyMenu{border:1px dashed #cbd5e1;border-radius:18px;background:#fff;color:#64748b;padding:18px;text-align:center;font-weight:900}.phoneCart{position:sticky;bottom:0;z-index:20;margin:0;min-height:78px;padding:12px 16px;background:rgba(255,255,255,.94);backdrop-filter:blur(18px);border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:12px}.phoneCart strong,.phoneCart span{display:block}.phoneCart button{min-height:50px;border:0;border-radius:18px;padding:0 18px;background:var(--accent);color:var(--accentText);font-weight:950}.saveFooter{max-width:1580px;margin:18px auto 0;padding:16px 18px;display:flex;align-items:center;gap:10px}.saveDot{width:12px;height:12px;border-radius:999px;background:#16a34a}.saveDot.saving{background:#2563eb}.saveDot.error{background:#be123c}.saveFooter strong{font-weight:950}.saveFooter em{color:var(--muted);font-style:normal;font-weight:800}.socialInputGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.socialInputGrid label span{display:flex;align-items:center;gap:10px}.videoManagerHero{border:2px solid #f9a8d4;background:linear-gradient(135deg,#fff,#fdf2f8);border-radius:26px;padding:22px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;box-shadow:0 18px 44px rgba(219,39,119,.12),0 0 0 6px rgba(244,114,182,.10)}.videoManagerHero small{display:block;color:#565d70;font-weight:1000;letter-spacing:.12em;text-transform:uppercase;margin-bottom:7px}.videoManagerHero h3{margin:0;color:#9d174d;font-size:32px;font-weight:1000;letter-spacing:-.04em;line-height:1.02}.videoManagerHero p{margin:9px 0 0;color:#9d174d;font-weight:850;line-height:1.35}.videoManagerGrid{display:grid;gap:18px}.videoManagerCard{border:1px solid var(--line);background:#fff;border-radius:26px;padding:18px;display:grid;grid-template-columns:220px minmax(0,1fr);gap:16px;align-items:start;box-shadow:0 16px 34px rgba(15,23,42,.06)}.videoManagerCard.active{border-color:#565d70;box-shadow:0 0 0 5px rgba(219,39,119,.12),0 16px 34px rgba(15,23,42,.08)}.videoPreviewButton{border:0;background:transparent;padding:0;text-align:left}.videoPreviewButton video,.videoUploadPlaceholder{width:100%;height:190px;border-radius:20px;background:#111827;color:#fff;object-fit:cover;display:grid;place-items:center;font-weight:1000;text-align:center;padding:16px}.videoEditFields{display:grid;grid-template-columns:1fr 160px;gap:12px}.videoEditFields label:nth-child(3){grid-column:1/-1}.videoEditFields textarea{min-height:86px}.videoManagerActions{grid-column:1/-1;display:grid;grid-template-columns:1fr 180px;gap:12px}.emptyVideoMenu{border:1px dashed #f9a8d4;background:#fff7fb;border-radius:24px;padding:26px;display:grid;gap:12px;color:#9d174d}.emptyVideoMenu h3{margin:0;font-size:28px;font-weight:1000}.emptyVideoMenu p{margin:0;font-weight:850}@media(max-width:1180px){.builderLayout{grid-template-columns:1fr}.rightPreview{position:relative;top:auto;order:-1}.phoneFrame{max-width:430px}}@media(max-width:760px){.videoManagerHero,.videoManagerCard,.videoManagerActions{grid-template-columns:1fr}.videoEditFields{grid-template-columns:1fr}.videoPreviewButton video,.videoUploadPlaceholder{height:230px}.ordaBuilderPage{padding:12px}.builderHeader{display:grid;gap:14px}.brandRow{display:grid;gap:8px}.ordaLogo{width:230px}.builderHeader h1{font-size:34px}.headerActions{display:grid;grid-template-columns:1fr 1fr}.headerLangSwitch{grid-column:1/-1}.builderLayout{gap:14px}.quickPickBar{grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;padding:8px}.quickPickBar button{font-size:12px;min-height:46px;padding:0 4px}.previewShell{padding:12px;border-radius:22px}.previewHeader h2{font-size:24px}.phoneFrame{max-width:100%;height:690px;border-width:8px;border-radius:40px;box-shadow:0 16px 40px rgba(15,23,42,.18)}.phoneTop{height:62px}.phoneHero{min-height:330px;padding:26px 20px}.phoneHero h3{font-size:42px}.twoGrid,.threeGrid,.uploadGrid,.categoryChoiceGrid,.controlChoiceGrid,.socialInputGrid,.itemList,.accentGrid,.imageOptionGrid{grid-template-columns:1fr}.selectedPreview{grid-template-columns:1fr}.selectedPreview img,.selectedPreview video{height:210px}.hourRow{grid-template-columns:1fr}.openPanelTop{grid-template-columns:1fr auto}.openPanelTop .panelState{display:none}.deleteToggle,.builderLangButtons{grid-template-columns:1fr}}@media(max-width:420px){.phoneFrame{height:650px;border-radius:34px}.phoneItem{grid-template-columns:96px 1fr}.phoneItem img,.phoneVideoThumb{width:96px}}

/* PROMOTE STOREFRONT FINAL FIX */
.promoStorefrontSection{margin:30px 0!important}
.promoStorefrontCard{border:1px solid rgba(15,23,42,.12)!important;background:rgba(255,255,255,.78)!important;border-radius:30px!important;padding:22px!important;box-shadow:0 24px 70px rgba(15,23,42,.10)!important}
.promoTop{display:flex!important;justify-content:space-between!important;gap:16px!important;align-items:center!important;margin-bottom:18px!important}
.promoTop small{display:block!important;font-size:12px!important;font-weight:1000!important;letter-spacing:.16em!important;color:var(--storeAccent,#cbd5e1)!important;margin-bottom:6px!important}
.promoTop h2{font-size:clamp(26px,3vw,38px)!important;font-weight:1000!important;color:#111827!important;margin:0 0 6px!important;letter-spacing:-.04em!important}
.promoTop p{margin:0!important;color:rgba(17,24,39,.62)!important;font-weight:750!important}
.promoVisitBtn{min-height:46px!important;padding:0 18px!important;border-radius:999px!important;background:var(--storeAccent,#cbd5e1)!important;color:var(--storeAccentText,#111827)!important;display:flex!important;align-items:center!important;justify-content:center!important;text-decoration:none!important;font-weight:1000!important;white-space:nowrap!important}
.promoPreview{position:relative!important;height:300px!important;border-radius:26px!important;overflow:hidden!important;background:linear-gradient(135deg,#08111f,#152033)!important;margin-bottom:18px!important;border:1px solid rgba(255,255,255,.12)!important}
.promoPreview img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
.promoPreviewShade{position:absolute!important;inset:0!important;background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.16),rgba(0,0,0,.62))!important;z-index:1!important}
.promoPlaceholder{width:100%!important;height:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#fff!important;font-size:34px!important;font-weight:1000!important}
.promoPreviewOverlay{position:absolute!important;top:18px!important;left:18px!important;right:18px!important;z-index:3!important;padding:14px 18px!important;border-radius:24px!important;background:rgba(9,15,28,.82)!important;border:1px solid var(--storeAccent,#cbd5e1)!important;backdrop-filter:blur(14px)!important}
.promoPreviewOverlay span{display:block!important;color:var(--storeAccent,#cbd5e1)!important;font-size:11px!important;font-weight:1000!important;text-transform:uppercase!important;letter-spacing:.12em!important}
.promoPreviewOverlay strong{display:block!important;color:#fff!important;font-size:22px!important;font-weight:1000!important;margin-top:3px!important}
.promoPreviewOverlay em{display:block!important;color:rgba(255,255,255,.70)!important;font-size:12px!important;font-style:normal!important;margin-top:4px!important;word-break:break-all!important}
.promoCaptionBox{border:1px solid rgba(15,23,42,.10)!important;border-radius:20px!important;background:rgba(255,255,255,.52)!important;padding:14px 16px!important;margin-bottom:16px!important}
.promoCaptionBox span{display:block!important;font-size:11px!important;font-weight:1000!important;color:var(--storeAccent,#cbd5e1)!important;text-transform:uppercase!important;letter-spacing:.1em!important;margin-bottom:6px!important}
.promoCaptionBox p{margin:0!important;color:#111827!important;font-weight:850!important;line-height:1.45!important;word-break:break-word!important}
.promoButtonGrid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))!important;gap:12px!important}
.promoActionBtn,.promoCopyBtn{min-height:52px!important;border-radius:18px!important;border:0!important;font-size:15px!important;font-weight:1000!important;cursor:pointer!important}
.promoActionBtn{background:var(--storeAccent,#cbd5e1)!important;color:var(--storeAccentText,#111827)!important}
.promoCopyBtn{background:rgba(15,23,42,.08)!important;color:#111827!important;border:1px solid rgba(15,23,42,.12)!important}
.promoShareNote{margin:14px 0 0!important;font-size:12px!important;line-height:1.4!important;color:rgba(100,116,139,.95)!important;font-weight:800!important}
.promoAccent-silver{--storeAccent:#cbd5e1;--storeAccentText:#111827}
.promoAccent-gold{--storeAccent:#d8bd7a;--storeAccentText:#111827}
.promoAccent-orange{--storeAccent:#fb923c;--storeAccentText:#111827}
.promoAccent-red{--storeAccent:#ef4444;--storeAccentText:#fff}
.promoAccent-blue{--storeAccent:#60a5fa;--storeAccentText:#07111f}
.promoAccent-purple{--storeAccent:#b8bdc9;--storeAccentText:#111827}
.promoAccent-pink{--storeAccent:#f472b6;--storeAccentText:#111827}
.promoAccent-lime{--storeAccent:#8be600;--storeAccentText:#111827}
.promoAccent-mono{--storeAccent:#111827;--storeAccentText:#fff}
@media(max-width:760px){.promoTop{flex-direction:column!important;align-items:flex-start!important}.promoVisitBtn{width:100%!important}.promoPreview{height:230px!important}.promoButtonGrid{grid-template-columns:1fr!important}}


/* 7th St Vault small safe dark-mode/color fix */
.builderHeader h1,.builderHeader p,.leftEditor,.rightPreview{color:#f8fafc!important}
.builderHeader h1{text-shadow:0 0 24px rgba(184,189,201,.38),0 4px 0 rgba(86,93,112,.24)!important}
.builderHeader p{color:#e2e4ea!important}
.panel,.editorCard,.storeForm,.videoManagerCard,.emptyVideoMenu,.promoStorefrontCard,.bucketGallery,.mediaCard,.menuWorkspace,.controlPanel,.panelBody,.panelContent,.builderPanel,.formCard,.previewCard,.quickPickBar{background:rgba(17,19,33,.94)!important;border-color:rgba(184,189,201,.24)!important;color:#f8fafc!important;box-shadow:0 22px 70px rgba(0,0,0,.32)!important}
.mainBtn,.sectionSave,.menuVideoUploadButton,.videoBtn{background:var(--vault-wave)!important;color:#fff!important;border-color:rgba(184,189,201,.55)!important;box-shadow:0 16px 34px rgba(120,126,145,.24)!important}
.ghostBtn,.choiceBtn{background:rgba(255,255,255,.07)!important;color:#f8fafc!important;border-color:rgba(184,189,201,.22)!important}
input,textarea,select{background:rgba(255,255,255,.07)!important;color:#f8fafc!important;border-color:rgba(184,189,201,.24)!important}
label,.fieldLabel,.videoEditFields label{color:#e2e4ea!important}
.ordaLogo{object-fit:cover!important;background:#070814!important;border:1px solid rgba(184,189,201,.28)!important;border-radius:24px!important}


/* 7th St Vault subtle rich color pass */
.mainBtn,.sectionSave,.menuVideoUploadButton,.videoBtn{
  background:linear-gradient(135deg,#05060a 0%,#11131a 46%,#252936 78%,#4b5567 100%)!important;
  color:#fff!important;
  border-color:rgba(184,189,201,.34)!important;
  box-shadow:0 16px 34px rgba(0,0,0,.28),0 0 0 1px rgba(184,189,201,.10)!important;
}
.builderHeader h1{
  color:#f7f7f8!important;
  text-shadow:0 2px 0 rgba(255,255,255,.05),0 18px 42px rgba(0,0,0,.36)!important;
}
.builderHeader p{color:#c8ccd6!important}
.headerLangSwitch button.active,.choiceBtn.active,.builderLangButtons button.active{
  background:linear-gradient(135deg,#0b0c12,#252936,#4b5567)!important;
  color:#fff!important;
  border-color:rgba(184,189,201,.36)!important;
  box-shadow:0 10px 28px rgba(0,0,0,.26)!important;
}
.videoManagerHero,.productVideoHero,.videoBuilderHero,.videoMenuHero{
  border-color:rgba(184,189,201,.24)!important;
  background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(238,240,245,.92))!important;
}
.videoManagerHero small,.productVideoHero small,.videoBuilderHero small,.videoMenuHero small{
  color:#565d70!important;
}
.videoManagerHero h3,.productVideoHero h3,.videoBuilderHero h3,.videoMenuHero h3{
  color:#303544!important;
}
.videoManagerHero p,.productVideoHero p,.videoBuilderHero p,.videoMenuHero p{
  color:#596174!important;
}
.ordaLogo{
  border-color:rgba(184,189,201,.24)!important;
  box-shadow:0 18px 44px rgba(0,0,0,.22)!important;
}


/* 7th St Vault builder clean polish only */
.rightPreview,
.previewShell,
.livePreviewCard,
.phonePreview,
.storePreview,
.previewPanel {
  border-color:rgba(255,255,255,.08)!important;
  box-shadow:none!important;
}

.rightPreview {
  background:rgba(10,12,19,.72)!important;
}

.previewShell,
.phonePreview,
.storePreview {
  outline:none!important;
}

.previewPhone,
.phoneFrame,
.previewDevice {
  border-color:rgba(255,255,255,.10)!important;
  box-shadow:0 22px 60px rgba(0,0,0,.28)!important;
}

.rightPreview h2,
.rightPreview h3,
.rightPreview p,
.rightPreview small,
.previewPanel h2,
.previewPanel h3,
.previewPanel p,
.previewPanel small,
.promoStorefrontCard h2,
.promoStorefrontCard p,
.promoStorefrontCard small,
.promoTop h2,
.promoTop p,
.promoTop small {
  opacity:1!important;
  visibility:visible!important;
}

.rightPreview h2,
.previewPanel h2,
.promoStorefrontCard h2,
.promoTop h2 {
  color:#f8fafc!important;
  text-shadow:0 12px 28px rgba(0,0,0,.45)!important;
}

.rightPreview p,
.previewPanel p,
.promoStorefrontCard p,
.promoTop p {
  color:#d7dbe6!important;
}

.rightPreview small,
.previewPanel small,
.promoStorefrontCard small,
.promoTop small,
.promoStorefrontCard .eyebrow,
.promoTop .eyebrow {
  color:#c8cedd!important;
  letter-spacing:.14em!important;
}

.promoStorefrontCard,
.promoTop,
.promoteCard {
  background:linear-gradient(135deg,rgba(15,17,27,.96),rgba(20,24,35,.92))!important;
  border:1px solid rgba(255,255,255,.10)!important;
}

.sharePreviewFrame,
.promoPreviewFrame,
.storefrontPromoImage {
  border-color:rgba(255,255,255,.10)!important;
}

.builderTabs,
.tabRail {
  background:rgba(255,255,255,.06)!important;
  border-color:rgba(255,255,255,.10)!important;
  box-shadow:none!important;
}

.tabButton,
.builderTabs button,
.tabRail button {
  background:rgba(255,255,255,.08)!important;
  color:#eef1f7!important;
  border-color:rgba(255,255,255,.08)!important;
}

.tabButton.active,
.builderTabs button.active,
.tabRail button.active {
  background:linear-gradient(135deg,#0a0c13,#1d2330,#394150)!important;
  color:#ffffff!important;
  border-color:rgba(255,255,255,.14)!important;
}

.editorCard,
.panel,
.storeForm,
.videoManagerCard,
.mediaCard,
.menuWorkspace,
.controlPanel {
  background:rgba(12,14,22,.92)!important;
  border-color:rgba(255,255,255,.08)!important;
}

input::placeholder,
textarea::placeholder {
  color:rgba(230,235,245,.54)!important;
}

.statusBar,
.saveStatus {
  background:rgba(255,255,255,.08)!important;
  border-color:rgba(255,255,255,.08)!important;
  color:#f4f6fb!important;
}


/* Final visibility polish: preview, hours pills, social section */
.rightPreview,
.livePreviewCard,
.previewPanel,
.previewShell {
  background:rgba(8,10,16,.88)!important;
  border:1px solid rgba(255,255,255,.08)!important;
  box-shadow:0 24px 70px rgba(0,0,0,.34)!important;
}

.rightPreview h2,
.livePreviewCard h2,
.previewPanel h2,
.rightPreview .sectionTitle {
  color:#ffffff!important;
  opacity:1!important;
  visibility:visible!important;
  text-shadow:0 12px 26px rgba(0,0,0,.55)!important;
}

.rightPreview p,
.livePreviewCard p,
.previewPanel p,
.rightPreview .muted,
.rightPreview .subtext {
  color:#d9dee9!important;
  opacity:1!important;
  visibility:visible!important;
}

.phonePreview,
.previewPhone,
.phoneFrame,
.previewDevice,
.storePreview {
  background:transparent!important;
  border:0!important;
  outline:0!important;
  box-shadow:none!important;
}

.phonePreview::before,
.phonePreview::after,
.previewPhone::before,
.previewPhone::after,
.phoneFrame::before,
.phoneFrame::after,
.previewDevice::before,
.previewDevice::after {
  display:none!important;
  content:none!important;
}

.previewPhoneInner,
.phoneScreen,
.previewScreen {
  background:#f5f3ed!important;
  border:0!important;
  box-shadow:0 22px 54px rgba(0,0,0,.30)!important;
}

/* Make pickup / shipping / hours readable */
.previewPill,
.storefrontPill,
.deliveryPill,
.pickupPill,
.hourPill,
.hoursPill,
.previewHours,
.previewMeta span,
.previewBadges span,
.storeBadge,
.statusPill {
  background:rgba(255,255,255,.94)!important;
  color:#1b2430!important;
  border:1px solid rgba(15,23,42,.10)!important;
  opacity:1!important;
  text-shadow:none!important;
  font-weight:900!important;
}

/* Social media section visibility */
.socialCard,
.socialPanel,
.socialSection,
.socialHandles,
.socialGrid,
.storeSocials,
.storeForm .socialCard {
  background:rgba(15,17,25,.96)!important;
  border:1px solid rgba(255,255,255,.12)!important;
  color:#f8fafc!important;
}

.socialCard h3,
.socialCard p,
.socialPanel h3,
.socialPanel p,
.socialSection h3,
.socialSection p,
.socialHandles h3,
.socialHandles p,
.storeSocials h3,
.storeSocials p {
  color:#f8fafc!important;
  opacity:1!important;
}

.socialCard label,
.socialPanel label,
.socialSection label,
.socialHandles label,
.storeSocials label {
  color:#d9dee9!important;
  opacity:1!important;
  font-weight:800!important;
}

.socialCard input,
.socialPanel input,
.socialSection input,
.socialHandles input,
.storeSocials input,
input[name*="instagram"],
input[name*="facebook"],
input[name*="youtube"],
input[name*="tiktok"] {
  background:rgba(255,255,255,.08)!important;
  color:#ffffff!important;
  border:1px solid rgba(255,255,255,.16)!important;
  opacity:1!important;
}

.socialCard input::placeholder,
.socialPanel input::placeholder,
.socialSection input::placeholder,
.socialHandles input::placeholder,
.storeSocials input::placeholder,
input[name*="instagram"]::placeholder,
input[name*="facebook"]::placeholder,
input[name*="youtube"]::placeholder,
input[name*="tiktok"]::placeholder {
  color:rgba(238,242,247,.70)!important;
}

/* Save bar readable */
.statusBar,
.saveStatus,
.savedBar {
  background:rgba(15,17,25,.92)!important;
  color:#f8fafc!important;
  border:1px solid rgba(255,255,255,.10)!important;
}


/* Final fix: lower product/collection rows section */
.collectionRow,
.collectionItem,
.productRow,
.productListRow,
.menuItemRow,
.itemEditorRow,
.videoListRow,
.productEditorRow,
.accordionRow,
.sectionRow {
  background:linear-gradient(135deg,rgba(14,16,24,.96),rgba(20,24,34,.92))!important;
  border:1px solid rgba(255,255,255,.10)!important;
  color:#f8fafc!important;
  min-height:78px!important;
  padding:14px 16px!important;
  border-radius:22px!important;
  box-shadow:0 16px 34px rgba(0,0,0,.22)!important;
}

.collectionRow + .collectionRow,
.collectionItem + .collectionItem,
.productRow + .productRow,
.productListRow + .productListRow,
.menuItemRow + .menuItemRow,
.itemEditorRow + .itemEditorRow,
.videoListRow + .videoListRow,
.productEditorRow + .productEditorRow,
.accordionRow + .accordionRow,
.sectionRow + .sectionRow {
  margin-top:12px!important;
}

.collectionRow h3,
.collectionRow h4,
.collectionRow p,
.collectionRow span,
.collectionItem h3,
.collectionItem h4,
.collectionItem p,
.collectionItem span,
.productRow h3,
.productRow h4,
.productRow p,
.productRow span,
.productListRow h3,
.productListRow h4,
.productListRow p,
.productListRow span,
.menuItemRow h3,
.menuItemRow h4,
.menuItemRow p,
.menuItemRow span,
.itemEditorRow h3,
.itemEditorRow h4,
.itemEditorRow p,
.itemEditorRow span,
.videoListRow h3,
.videoListRow h4,
.videoListRow p,
.videoListRow span,
.productEditorRow h3,
.productEditorRow h4,
.productEditorRow p,
.productEditorRow span,
.accordionRow h3,
.accordionRow h4,
.accordionRow p,
.accordionRow span,
.sectionRow h3,
.sectionRow h4,
.sectionRow p,
.sectionRow span {
  color:#f8fafc!important;
  opacity:1!important;
  visibility:visible!important;
  text-shadow:none!important;
}

.collectionRow small,
.collectionItem small,
.productRow small,
.productListRow small,
.menuItemRow small,
.itemEditorRow small,
.videoListRow small,
.productEditorRow small,
.accordionRow small,
.sectionRow small {
  color:#c7cedb!important;
  opacity:1!important;
}

.collectionRow input,
.collectionItem input,
.productRow input,
.productListRow input,
.menuItemRow input,
.itemEditorRow input,
.videoListRow input,
.productEditorRow input,
.accordionRow input,
.sectionRow input,
.collectionRow textarea,
.collectionItem textarea,
.productRow textarea,
.productListRow textarea,
.menuItemRow textarea,
.itemEditorRow textarea,
.videoListRow textarea,
.productEditorRow textarea,
.accordionRow textarea,
.sectionRow textarea {
  background:rgba(255,255,255,.075)!important;
  color:#ffffff!important;
  border:1px solid rgba(255,255,255,.14)!important;
  opacity:1!important;
  min-height:44px!important;
}

.collectionRow input::placeholder,
.collectionItem input::placeholder,
.productRow input::placeholder,
.productListRow input::placeholder,
.menuItemRow input::placeholder,
.itemEditorRow input::placeholder,
.videoListRow input::placeholder,
.productEditorRow input::placeholder,
.accordionRow input::placeholder,
.sectionRow input::placeholder {
  color:rgba(238,242,247,.62)!important;
}

.collectionRow button,
.collectionItem button,
.productRow button,
.productListRow button,
.menuItemRow button,
.itemEditorRow button,
.videoListRow button,
.productEditorRow button,
.accordionRow button,
.sectionRow button {
  background:#252b36!important;
  color:#ffffff!important;
  border:1px solid rgba(255,255,255,.12)!important;
  border-radius:16px!important;
  min-height:42px!important;
  padding:0 22px!important;
  box-shadow:none!important;
}

.collectionRow button:hover,
.collectionItem button:hover,
.productRow button:hover,
.productListRow button:hover,
.menuItemRow button:hover,
.itemEditorRow button:hover,
.videoListRow button:hover,
.productEditorRow button:hover,
.accordionRow button:hover,
.sectionRow button:hover {
  background:#303846!important;
}

/* Catch the exact washed-out lower editor area */
.productsList,
.collectionsList,
.menuItemsList,
.videoItemsList,
.itemList,
.accordionList,
.productsPanel,
.collectionsPanel {
  background:transparent!important;
  border-color:rgba(255,255,255,.08)!important;
}

.productsList > div,
.collectionsList > div,
.menuItemsList > div,
.videoItemsList > div,
.itemList > div,
.accordionList > div {
  background:linear-gradient(135deg,rgba(14,16,24,.96),rgba(20,24,34,.92))!important;
  border:1px solid rgba(255,255,255,.10)!important;
  color:#f8fafc!important;
  border-radius:22px!important;
  min-height:78px!important;
  margin-bottom:12px!important;
  box-shadow:0 16px 34px rgba(0,0,0,.22)!important;
}

.productsList > div *,
.collectionsList > div *,
.menuItemsList > div *,
.videoItemsList > div *,
.itemList > div *,
.accordionList > div * {
  color:inherit;
  opacity:1!important;
}

.productsList > div input,
.collectionsList > div input,
.menuItemsList > div input,
.videoItemsList > div input,
.itemList > div input,
.accordionList > div input {
  background:rgba(255,255,255,.075)!important;
  color:#fff!important;
  border-color:rgba(255,255,255,.14)!important;
}

/* Keep right preview connected but clean */
.rightPreview {
  background:rgba(8,10,16,.82)!important;
  border:1px solid rgba(255,255,255,.08)!important;
}


/* REAL HOURS ROW SECTION FIX */
.hoursGrid {
  display:grid!important;
  gap:12px!important;
}

.hoursGrid .hourRow,
.panelBody .hoursGrid .hourRow,
.builderPanel .hoursGrid .hourRow {
  background:linear-gradient(135deg,rgba(13,16,24,.98),rgba(24,28,38,.94))!important;
  border:1px solid rgba(255,255,255,.12)!important;
  color:#f8fafc!important;
  border-radius:20px!important;
  min-height:66px!important;
  padding:12px 14px!important;
  box-shadow:0 14px 32px rgba(0,0,0,.24)!important;
}

.hoursGrid .hourRow strong,
.panelBody .hoursGrid .hourRow strong,
.builderPanel .hoursGrid .hourRow strong {
  color:#ffffff!important;
  opacity:1!important;
  font-weight:950!important;
}

.hoursGrid .hourRow input[type="time"],
.panelBody .hoursGrid .hourRow input[type="time"],
.builderPanel .hoursGrid .hourRow input[type="time"] {
  background:rgba(255,255,255,.08)!important;
  color:#ffffff!important;
  border:1px solid rgba(255,255,255,.16)!important;
  border-radius:15px!important;
  height:44px!important;
  opacity:1!important;
}

.hoursGrid .hourRow .choiceBtn,
.panelBody .hoursGrid .hourRow .choiceBtn,
.builderPanel .hoursGrid .hourRow .choiceBtn {
  background:rgba(255,255,255,.08)!important;
  color:#f8fafc!important;
  border:1px solid rgba(255,255,255,.16)!important;
  border-radius:15px!important;
  height:44px!important;
  min-height:44px!important;
  padding:0 16px!important;
  box-shadow:none!important;
}

.hoursGrid .hourRow .choiceBtn.active,
.panelBody .hoursGrid .hourRow .choiceBtn.active,
.builderPanel .hoursGrid .hourRow .choiceBtn.active {
  background:linear-gradient(135deg,#111827,#273142,#475166)!important;
  color:#ffffff!important;
  border-color:rgba(255,255,255,.24)!important;
}

/* remove washed-out boxes inside hour rows */
.hoursGrid .hourRow *,
.panelBody .hoursGrid .hourRow *,
.builderPanel .hoursGrid .hourRow * {
  opacity:1!important;
  visibility:visible!important;
}

/* mobile/tablet stays clean */
@media(max-width:900px){
  .hoursGrid .hourRow,
  .panelBody .hoursGrid .hourRow,
  .builderPanel .hoursGrid .hourRow {
    grid-template-columns:1fr!important;
  }
}


/* BUILDER VISIBILITY FIX */
.ordaBuilderPage input,
.ordaBuilderPage textarea,
.ordaBuilderPage select {
  color:#07111f!important;
  background:rgba(255,255,255,.98)!important;
  border:2px solid rgba(7,17,31,.18)!important;
  opacity:1!important;
  -webkit-text-fill-color:#07111f!important;
}
.ordaBuilderPage input::placeholder,
.ordaBuilderPage textarea::placeholder {
  color:rgba(7,17,31,.58)!important;
  opacity:1!important;
  -webkit-text-fill-color:rgba(7,17,31,.58)!important;
}
.ordaBuilderPage label,
.ordaBuilderPage .label,
.ordaBuilderPage .fieldLabel,
.ordaBuilderPage .formLabel,
.ordaBuilderPage .inputLabel,
.ordaBuilderPage .muted,
.ordaBuilderPage small {
  color:#334155!important;
  opacity:1!important;
  text-shadow:none!important;
}
.ordaBuilderPage .sectionCard,
.ordaBuilderPage .formCard,
.ordaBuilderPage .builderCard,
.ordaBuilderPage .panelCard,
.ordaBuilderPage .productCard,
.ordaBuilderPage .productEditor,
.ordaBuilderPage .languageCard,
.ordaBuilderPage .settingsCard {
  color:#07111f!important;
}
.ordaBuilderPage .sectionCard h1,
.ordaBuilderPage .sectionCard h2,
.ordaBuilderPage .sectionCard h3,
.ordaBuilderPage .sectionCard h4,
.ordaBuilderPage .formCard h1,
.ordaBuilderPage .formCard h2,
.ordaBuilderPage .formCard h3,
.ordaBuilderPage .formCard h4,
.ordaBuilderPage .builderCard h1,
.ordaBuilderPage .builderCard h2,
.ordaBuilderPage .builderCard h3,
.ordaBuilderPage .builderCard h4,
.ordaBuilderPage .productEditor h1,
.ordaBuilderPage .productEditor h2,
.ordaBuilderPage .productEditor h3,
.ordaBuilderPage .productEditor h4 {
  color:#07111f!important;
  opacity:1!important;
  text-shadow:none!important;
}
.ordaBuilderPage .sectionCard p,
.ordaBuilderPage .formCard p,
.ordaBuilderPage .builderCard p,
.ordaBuilderPage .productEditor p,
.ordaBuilderPage .helpText,
.ordaBuilderPage .smallText {
  color:#334155!important;
  opacity:1!important;
  text-shadow:none!important;
}
.ordaBuilderPage .themeButton,
.ordaBuilderPage .languageButton,
.ordaBuilderPage .pillButton,
.ordaBuilderPage .segmentedButton,
.ordaBuilderPage .toggleButton {
  color:#07111f!important;
  background:rgba(255,255,255,.95)!important;
  border:2px solid rgba(7,17,31,.16)!important;
  text-shadow:none!important;
  opacity:1!important;
  -webkit-text-fill-color:#07111f!important;
}
.ordaBuilderPage .themeButton.active,
.ordaBuilderPage .languageButton.active,
.ordaBuilderPage .pillButton.active,
.ordaBuilderPage .segmentedButton.active,
.ordaBuilderPage .toggleButton.active,
.ordaBuilderPage button.active {
  color:#fff!important;
  background:#07111f!important;
  border-color:#07111f!important;
  -webkit-text-fill-color:#fff!important;
}
.ordaBuilderPage .saveButton,
.ordaBuilderPage .primaryButton,
.ordaBuilderPage .blackButton,
.ordaBuilderPage .darkButton {
  color:#fff!important;
  background:#07111f!important;
  -webkit-text-fill-color:#fff!important;
}
.ordaBuilderPage .statusBar,
.ordaBuilderPage .saveStatus {
  color:#07111f!important;
  opacity:1!important;
}

`;
