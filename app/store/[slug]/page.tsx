'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type SyntheticEvent } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';
type Theme = 'dark' | 'light';
type StoreAccent = 'gold' | 'orange' | 'red' | 'blue' | 'purple' | 'lime' | 'pink' | 'mono' | 'silver';
type OrderType = 'pickup' | 'delivery';
type SocialKind = 'instagram' | 'facebook' | 'tiktok' | 'youtube';

type RestaurantRow = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hero_image: string | null;
  logo_image: string | null;
  hero_video?: string | null;
  hero_video_url?: string | null;
  hero_video_file?: string | null;
  hero_media_type?: string | null;
  description?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
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
  promo_enabled?: boolean | null;
  promo_percent?: number | null;
  promo_code?: string | null;
  promo_title?: string | null;
  promo_text?: string | null;
  rewards_enabled?: boolean | null;
  rewards_points?: number | null;
  rewards_text?: string | null;
  instagram_url?: string | null;
  instagram?: string | null;
  facebook_url?: string | null;
  facebook?: string | null;
  tiktok_url?: string | null;
  tiktok?: string | null;
  youtube_url?: string | null;
  youtube?: string | null;
};

type CategoryRow = { id: string; restaurant_id: string | null; name: string | null; sort_order: number | null };

type ItemRow = {
  id: string;
  restaurant_id: string | null;
  category_id: string | null;
  name: string | null;
  description: string | null;
  image_url: string | null;
  image_file?: string | null;
  item_image?: string | null;
  image?: string | null;
  product_image?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  image?: string | null;
  product_image?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  video_url?: string | null;
  video_file?: string | null;
  item_video?: string | null;
  menu_video?: string | null;
  product_video?: string | null;
  product_video_url?: string | null;
  video?: string | null;
  product_video?: string | null;
  product_video_url?: string | null;
  video?: string | null;
  media_type?: string | null;
  price: number | null;
  base_price: number | null;
  availability: string | null;
  is_available: boolean | null;
  sort_order: number | null;
};

type GroupRow = { id: string; item_id: string | null; name: string | null; is_required: boolean | null; selection_mode: string | null; sort_order: number | null };
type ChoiceRow = { id: string; option_group_id: string | null; name: string | null; price: number | null; price_delta: number | null; sort_order: number | null };

type PromoRow = { id: string; restaurant_id?: string | null; owner_id?: string | null; title?: string | null; name?: string | null; promo_type?: string | null; campaign_type?: string | null; description?: string | null; details?: string | null; message?: string | null; code?: string | null; promo_code?: string | null; discount_code?: string | null; discount_type?: string | null; value?: number | string | null; discount_value?: number | string | null; minimum_order?: number | null; min_order?: number | null; cta_text?: string | null; button_text?: string | null; media_url?: string | null; media_type?: string | null; store_url?: string | null; active?: boolean | null; is_active?: boolean | null; status?: string | null; starts_at?: string | null; ends_at?: string | null; expires_at?: string | null; created_at?: string | null };
type RewardRow = { id: string; restaurant_id?: string | null; title?: string | null; name?: string | null; description?: string | null; details?: string | null; points_required?: number | null; visits_required?: number | null; active?: boolean | null; is_active?: boolean | null; expires_at?: string | null };
type ReviewRow = { id: string; restaurant_id?: string | null; store_slug?: string | null; customer_name?: string | null; rating?: number | null; comment?: string | null; media_url?: string | null; media_type?: 'video' | 'photo' | string | null; instagram?: string | null; facebook?: string | null; tiktok?: string | null; youtube?: string | null; approved?: boolean | null; verified_order?: boolean | null; created_at?: string | null };

type Choice = { id: string; name: string; priceDelta: number };
type Group = { id: string; name: string; required: boolean; mode: 'single' | 'multiple'; choices: Choice[] };
type Category = { id: string; name: string; sortOrder: number };
type Item = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  autoImageUrl: string;
  basePrice: number;
  available: boolean;
  groups: Group[];
  isVideoShop: boolean;
  posterUrl: string;
};
type CartSelection = { groupName: string; choiceNames: string[]; priceDelta: number };
type CartLine = { id: string; itemId: string; name: string; itemName: string; imageUrl: string; image_url: string; itemImage: string; item_image: string; videoUrl?: string; video_url?: string; mediaType: 'image' | 'video'; quantity: number; selections: CartSelection[]; unitTotal: number; total: number };
type StoreHour = { day: string; open: string; close: string; closed: boolean };
type OpenStatus = { open: boolean; text: string; nextText: string };

const BUCKET = 'menu-images'; // 7th St Vault uses the ORDA blueprint storage schema while the UI is converted to fashion.
const FALLBACK_FOOD = 'universal/1.jpg';
const FALLBACK_HERO = 'hero/1.jpg';
const MENU_VIDEO_LIMIT_SECONDS = 10;
const VIDEO_MENU_AVAILABILITY = 'video_menu'; // kept for database compatibility; displayed as Product Videos.

const COPY = {
  en: { menu: 'Shop', promos: 'Ofertas', rewards: 'Vault Rewards', hours: 'HOURS', social: 'SOCIAL', pickup: 'PICKUP', delivery: 'SHIPPING', allItems: 'ALL PRODUCTS', customize: 'Select Options', location: 'BRAND LOCATION', directions: 'GET DIRECTIONS', storeDetails: 'BRAND DETAILS', pickupAvailable: 'Local Pickup Available', deliveryAvailable: 'Shipping Available', deliveryFee: 'Shipping Fee', deliveryRadius: 'Shipping Radius', minimumOrder: 'Minimum Purchase', required: 'Required', optional: 'Optional', quantity: 'Quantity', addToCart: 'ADD TO CART', cart: 'View Cart', checkout: 'CHECKOUT', subtotal: 'SUBTOTAL', discount: 'DISCOUNT', total: 'TOTAL', empty: 'Your cart is empty.', basePrice: 'Base Price', finalPrice: 'Final Price', soldOut: 'Sold Out', openNow: 'Open Now', closedNow: 'Closed Now', closes: 'Closes', opens: 'Opens', remove: 'Remove', apply: 'Apply', usePromo: 'Use Promo', promoCode: 'Promo code', promoApplied: 'Promo applied.', promoNotFound: 'Promo not found.', startOrder: 'START SHOPPING', limitedOffer: 'LIMITED DROP', nextOrder: 'YOUR NEXT PURCHASE', applyCode: 'APPLY CODE', pointsAvailable: 'VAULT POINTS', nextReward: 'Next Reward', viewRewards: 'VIEW REWARDS', items: 'ITEMS', noPhone: 'Phone number not added yet', noItems: 'No products yet.', noItemsSub: 'Add products in the 7th St Vault builder and they will show here.', orderType: 'Fulfillment', working: 'WORKING...', callStore: 'Contact Brand', directTagline: 'Shop direct. Streetwear, luxury, and everyday fashion.', followUs: 'Follow Us', videos: 'VIDEOS DE PRODUCTO', playVideo: 'Watch Product Video' },
  es: { menu: 'Tienda', promos: 'Ofertas', rewards: 'Recompensas Vault', hours: 'HORARIO', social: 'REDES', pickup: 'RECOGER', delivery: 'ENVÍO', allItems: 'PRODUCTOS', customize: 'Elegir Opciones', location: 'UBICACIÓN DE MARCA', directions: 'CÓMO LLEGAR', storeDetails: 'DETALLES DE MARCA', pickupAvailable: 'Pickup Disponible', deliveryAvailable: 'Envío Disponible', deliveryFee: 'Costo de Envío', deliveryRadius: 'Radio de Entrega', minimumOrder: 'Compra Mínima', required: 'Requerido', optional: 'Opcional', quantity: 'Cantidad', addToCart: 'AGREGAR', cart: 'Ver Carrito', checkout: 'PAGAR', subtotal: 'SUBTOTAL', discount: 'DESCUENTO', total: 'TOTAL', empty: 'Tu carrito está vacío.', basePrice: 'Precio Base', finalPrice: 'Precio Final', soldOut: 'Agotado', openNow: 'Abierto', closedNow: 'Cerrado', closes: 'Cierra', opens: 'Abre', remove: 'Quitar', apply: 'Aplicar', usePromo: 'Usar Promo', promoCode: 'Código promo', promoApplied: 'Promo aplicada.', promoNotFound: 'Promo no encontrada.', startOrder: 'EMPEZAR COMPRA', limitedOffer: 'DROP LIMITADO', nextOrder: 'TU PRÓXIMA COMPRA', applyCode: 'APLICAR CÓDIGO', pointsAvailable: 'PUNTOS VAULT', nextReward: 'Próxima Recompensa', viewRewards: 'VER RECOMPENSAS', items: 'ARTÍCULOS', noPhone: 'Número no agregado todavía', noItems: 'No hay productos todavía.', noItemsSub: 'Agrega productos en el builder de 7th St Vault y aparecerán aquí.', orderType: 'Entrega', working: 'TRABAJANDO...', callStore: 'Contactar', directTagline: 'Compra directo. Moda, estilo y drops exclusivos.', followUs: 'Síguenos', videos: 'VIDEOS DE PRODUCTO', playVideo: 'Ver Video de Producto' },
};

const OWNER_TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: { pickup: 'Pickup', delivery: 'Shipping', subtotal: 'Subtotal', deliveryFee: 'Shipping Fee', discount: 'Discount', total: 'Total', promo: 'Promo', noSelections: 'No options selected', quantity: 'Qty' },
  es: { pickup: 'Recoger', delivery: 'Envío', subtotal: 'Subtotal', deliveryFee: 'Costo de Envío', discount: 'Descuento', total: 'Total', promo: 'Promo', noSelections: 'Sin opciones', quantity: 'Cant.' },
};

const DAYS = [['monday', 'Monday'], ['tuesday', 'Tuesday'], ['wednesday', 'Wednesday'], ['thursday', 'Thursday'], ['friday', 'Friday'], ['saturday', 'Saturday'], ['sunday', 'Sunday']] as const;
const DEFAULT_HOURS: StoreHour[] = DAYS.map(([, day]) => ({ day, open: '11:00 AM', close: '10:00 PM', closed: false }));

function money(value: number) { return `$${Number(value || 0).toFixed(2)}`; }
function cleanKey(value?: string | null) { return String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
function prettyName(value?: string | null) { return String(value || '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase()); }
function makeId(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function getTheme(value?: string | null): Theme { return String(value || '').toLowerCase() === 'light' ? 'light' : 'dark'; }
function getAccent(value?: string | null): StoreAccent { const clean = String(value || 'gold').toLowerCase(); return ['gold', 'orange', 'red', 'blue', 'purple', 'lime', 'pink', 'mono', 'silver'].includes(clean) ? clean as StoreAccent : 'gold'; }
function getLang(value?: string | null): Lang { return String(value || '').toLowerCase() === 'es' ? 'es' : 'en'; }
function isFullUrl(value?: string | null) { return !!value && /^https?:\/\//i.test(value); }
function isVideoUrl(value?: string | null) { return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(value || '').trim()); }
function publicStorageUrl(path: string, bucket = BUCKET) {
  const cleanPath = String(path || '').trim().replace(/^\/+/, '');
  if (!cleanPath) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  return data.publicUrl;
}

function resolveStorageUrl(value?: string | null, preferredBucket = BUCKET) {
  const raw = String(value || '').trim();
  if (!raw || raw === 'null' || raw === 'undefined') return '';
  if (/^(blob:|data:|https?:\/\/|\/)/i.test(raw)) return raw;

  const clean = raw.replace(/^\/+/, '');
  const lower = clean.toLowerCase();

  // IMPORTANT:
  // Builder product videos are uploaded to bucket "product-videos"
  // with object path "product-videos/{restaurantId}/product-video..."
  // Do NOT strip the first product-videos/ folder or the video URL points to the wrong file.
  if (preferredBucket === 'product-videos') {
    return publicStorageUrl(clean, 'product-videos');
  }

  if (preferredBucket === 'product-images') {
    return publicStorageUrl(clean, 'product-images');
  }

  if (lower.startsWith('branding/')) return publicStorageUrl(clean.slice('branding/'.length), 'branding');
  if (lower.startsWith('store-media/')) return publicStorageUrl(clean.slice('store-media/'.length), 'store-media');
  if (lower.startsWith('menu-images/')) return publicStorageUrl(clean.slice('menu-images/'.length), 'menu-images');

  if (lower.startsWith('product-images/')) return publicStorageUrl(clean.slice('product-images/'.length), 'product-images');

  // Only use this when the value is truly bucket-prefixed and no preferred bucket was supplied.
  if (lower.startsWith('product-videos/')) return publicStorageUrl(clean, 'product-videos');

  return publicStorageUrl(clean, preferredBucket);
}

function firstMediaUrl(values: Array<string | null | undefined>, bucket: string) {
  for (const value of values) {
    const url = resolveStorageUrl(value, bucket);
    if (url) return url;
  }
  return '';
}

function categoryFromName(categoryName?: string | null, itemName?: string | null) {
  const text = `${categoryName || ''} ${itemName || ''}`.toLowerCase();

  if (text.includes('wing')) return 'wings';
  if (text.includes('taco') || text.includes('birria')) return 'tacos';
  if (text.includes('burger')) return 'burgers';
  if (text.includes('burrito') || text.includes('quesadilla') || text.includes('fajita') || text.includes('mexican')) return 'mexican';
  if (text.includes('shrimp') || text.includes('seafood') || text.includes('fish')) return 'seafood';
  if (text.includes('bbq') || text.includes('barbecue') || text.includes('brisket')) return 'bbq';
  if (text.includes('pasta') || text.includes('noodle')) return 'pasta';
  if (text.includes('coffee')) return 'coffee';
  if (text.includes('chicken')) return 'chicken';
  if (text.includes('shake')) return 'milkshake';
  if (text.includes('smoothie')) return 'smoothies';
  if (text.includes('hot_dog') || text.includes('hot dog')) return 'hot-dogs';
  if (text.includes('breakfast')) return 'breakfast';
  if (text.includes('sandwich')) return 'sandwiches';
  if (text.includes('fry') || text.includes('fries')) return 'fries';
  if (text.includes('cake') || text.includes('dessert')) return 'desserts';
  if (text.includes('juice') || text.includes('water') || text.includes('drinks')) return 'drinks';
  if (text.includes('combo')) return 'combos';

  return 'universal';
}

function fallbackImage(categoryName?: string | null, itemName?: string | null) {
  return '/vault-product-placeholder.jpg';
}

function fallbackForImageElement(event: SyntheticEvent<HTMLImageElement, Event>, categoryName?: string | null, itemName?: string | null) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallbackImage(categoryName, itemName);
}

function parseHourMinute(value: string) { const raw = String(value || '').trim(); const twentyFour = raw.match(/^(\d{1,2}):(\d{2})$/); if (twentyFour) { const hour = Number(twentyFour[1]); const minute = Number(twentyFour[2]); if (hour > 23 || minute > 59) return null; return hour * 60 + minute; } const match = raw.toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/); if (!match) return null; let hour = Number(match[1]); const minute = Number(match[2] || 0); const meridian = match[3]; if (meridian === 'PM' && hour !== 12) hour += 12; if (meridian === 'AM' && hour === 12) hour = 0; if (hour > 23 || minute > 59) return null; return hour * 60 + minute; }
function formatHour(value: string) { const minutes = parseHourMinute(value); if (minutes === null) return value || '--'; const hour24 = Math.floor(minutes / 60); const minute = minutes % 60; const suffix = hour24 >= 12 ? 'PM' : 'AM'; const hour12 = hour24 % 12 || 12; return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`; }
function normalizeHours(raw: any): StoreHour[] { if (!raw) return DEFAULT_HOURS; let value = raw; if (typeof raw === 'string') { try { value = JSON.parse(raw); } catch { return DEFAULT_HOURS; } } if (Array.isArray(value)) return DEFAULT_HOURS.map((fallback, index) => { const found = value[index] || value.find((hour: any) => String(hour?.day || '').toLowerCase() === fallback.day.toLowerCase()) || {}; return { day: found.day || fallback.day, open: String(found.open || found.open_time || fallback.open), close: String(found.close || found.close_time || fallback.close), closed: Boolean(found.closed || found.is_closed || found.open === false || found.isOpen === false) }; }); if (typeof value === 'object') return DAYS.map(([key, label]) => { const found = value[key] || value[label] || value[label.toLowerCase()] || {}; return { day: label, open: String(found.open || found.open_time || DEFAULT_HOURS.find((hour) => hour.day === label)?.open || '11:00 AM'), close: String(found.close || found.close_time || DEFAULT_HOURS.find((hour) => hour.day === label)?.close || '10:00 PM'), closed: Boolean(found.closed || found.is_closed || found.open === false || found.isOpen === false) }; }); return DEFAULT_HOURS; }
function getOpenStatus(hoursRaw: any, copy: typeof COPY.en): OpenStatus { const hours = normalizeHours(hoursRaw); const now = new Date(); const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; const today = hours[dayIndex] || DEFAULT_HOURS[dayIndex]; const current = now.getHours() * 60 + now.getMinutes(); const openMinutes = parseHourMinute(today.open); const closeMinutes = parseHourMinute(today.close); if (!today.closed && openMinutes !== null && closeMinutes !== null) { const overnight = closeMinutes < openMinutes; const open = overnight ? current >= openMinutes || current <= closeMinutes : current >= openMinutes && current <= closeMinutes; if (open) return { open: true, text: copy.openNow, nextText: `${copy.closes} ${formatHour(today.close)}` }; } const nextOpen = hours.find((row, offset) => offset === 0 ? !row.closed && current < (parseHourMinute(row.open) || 0) : !row.closed); return { open: false, text: copy.closedNow, nextText: `${copy.opens} ${formatHour(nextOpen?.open || today.open)}` }; }
function isActiveRecord(row: any) { if (!row) return false; if (row.active === false || row.is_active === false) return false; const now = new Date(); if (row.starts_at) { const start = new Date(row.starts_at); if (!Number.isNaN(start.getTime()) && start > now) return false; } const endValue = row.ends_at || row.expires_at; if (endValue) { const end = new Date(endValue); if (!Number.isNaN(end.getTime()) && end < now) return false; } return true; }
function isLiveShopItem(row: ItemRow) { const availability = String(row.availability || '').toLowerCase().trim(); if (row.is_available === false) return false; if (['deleted', 'delete', 'removed', 'remove', 'hidden', 'inactive', 'archived', 'draft', 'sold_out'].includes(availability)) return false; if (!String(row.name || '').trim()) return false; return true; }
function isVideoShopRow(row: ItemRow) {
  const video = firstMediaUrl([row.video_url, row.video_file, row.item_video, row.menu_video, row.product_video, row.product_video_url, row.video], 'product-videos');
  return Boolean(video) || String(row.availability || '').toLowerCase() === VIDEO_MENU_AVAILABILITY || String(row.media_type || '').toLowerCase().includes('video');
}
function promoTitle(promo: PromoRow) { return prettyName(promo.title || promo.name || promo.promo_type || promo.campaign_type || 'Drop Campaign'); }
function promoDescription(promo: PromoRow) { return String(promo.description || promo.details || promo.message || '').trim(); }
function promoCodeValue(promo: PromoRow) { return String(promo.discount_code || promo.code || promo.promo_code || '').trim(); }
function promoButtonText(promo: PromoRow | null, copy: typeof COPY.en) { return String(promo?.cta_text || promo?.button_text || copy.applyCode || 'Shop Drop').trim(); }
function promoMediaUrl(promo: PromoRow | null) { const raw = String(promo?.media_url || '').trim(); if (!raw) return ''; return resolveStorageUrl(raw, 'campaign-media') || raw; }
function promoMediaType(promo: PromoRow | null) { const rawType = String(promo?.media_type || '').toLowerCase(); const url = promoMediaUrl(promo); return rawType.includes('video') || isVideoUrl(url) ? 'video' : 'image'; }
function promoValueText(promo: PromoRow) {
  const rawDiscount = String(promo.discount_value ?? promo.value ?? '').trim();
  const type = String(promo.discount_type || '').toLowerCase();
  const numericValue = Number(rawDiscount.replace(/[^0-9.]/g, ''));
  if (rawDiscount && Number.isNaN(Number(rawDiscount))) return rawDiscount.toUpperCase();
  if (rawDiscount && rawDiscount.includes('%')) return rawDiscount.toUpperCase();
  if (numericValue && type.includes('percent')) return `${numericValue}% OFF`;
  if (numericValue && type.includes('free')) return 'FREE PERK';
  if (numericValue) return `${money(numericValue)} OFF`;
  return String(promo.promo_type || promo.campaign_type || 'LIMITED DROP').toUpperCase();
}
function promoDiscountAmount(promo: PromoRow | null, subtotal: number) { if (!promo) return 0; const minimum = Number(promo.minimum_order ?? promo.min_order ?? 0); if (minimum > 0 && subtotal < minimum) return 0; const type = String(promo.discount_type || '').toLowerCase(); const value = Number(String(promo.discount_value ?? promo.value ?? 0).replace(/[^0-9.]/g, '')); if (!value) return 0; if (type.includes('percent') || String(promo.discount_value ?? promo.value ?? '').includes('%')) return Math.min(subtotal, subtotal * (value / 100)); return Math.min(subtotal, value); }
function rewardTitle(reward: RewardRow) { return prettyName(reward.title || reward.name || 'Loyalty Reward'); }
function rewardDescription(reward: RewardRow) { return String(reward.description || reward.details || '').trim(); }

function reviewName(review: ReviewRow) { return String(review.customer_name || 'ORDA Customer').trim(); }
function reviewComment(review: ReviewRow) { return String(review.comment || '').trim(); }
function reviewSocials(review: ReviewRow) { return [{ key: 'instagram', label: 'Instagram', value: review.instagram }, { key: 'facebook', label: 'Facebook', value: review.facebook }, { key: 'tiktok', label: 'TikTok', value: review.tiktok }, { key: 'youtube', label: 'YouTube', value: review.youtube }].filter((item) => String(item.value || '').trim()); }
function reviewRating(review: ReviewRow) { const value = Number(review.rating || 5); return Math.max(1, Math.min(5, Number.isFinite(value) ? value : 5)); }
function reviewMediaUrl(review: ReviewRow) { return resolveStorageUrl(String(review.media_url || '').trim()); }
function reviewMediaType(review: ReviewRow) { const url = reviewMediaUrl(review); const type = String(review.media_type || '').toLowerCase(); return type.includes('video') || isVideoUrl(url) ? 'video' : 'photo'; }
function reviewDate(review: ReviewRow) { if (!review.created_at) return ''; const date = new Date(review.created_at); return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }

async function fetchOptionalRows<T>(tableNames: string[], restaurantId: string) { for (const table of tableNames) { const { data, error } = await supabase.from(table).select('*').eq('restaurant_id', restaurantId).limit(25); if (!error && Array.isArray(data)) return data as T[]; } return [] as T[]; }
async function fetchCampaignRows(restaurantId: string) {
  const { data: dropRows, error: dropError } = await supabase
    .from('drop_campaigns')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (!dropError && Array.isArray(dropRows) && dropRows.length) return dropRows as PromoRow[];

  return fetchOptionalRows<PromoRow>(['promos', 'restaurant_promos', 'promotions', 'store_promos'], restaurantId);
}
function choices(names: Array<string | [string, number]>): Choice[] { return names.map((entry) => { const name = Array.isArray(entry) ? entry[0] : entry; const priceDelta = Array.isArray(entry) ? entry[1] : 0; return { id: cleanKey(name), name, priceDelta }; }); }
function isVideoShopItemFromItem(item: Item) { return item.isVideoShop || cleanKey(item.categoryName).includes('video_menu') || isVideoUrl(resolveStorageUrl(item.videoUrl)); }
function defaultGroups(item: Item): Group[] {
  const key = cleanKey(`${item.categoryName} ${item.name}`);

  if (key.includes('shoe') || key.includes('sneaker') || key.includes('boot') || key.includes('slide')) {
    return [
      { id: `${item.id}_size`, name: 'Shoe Size', required: true, mode: 'single', choices: choices(['5', '6', '7', '8', '9', '10', '11', '12', '13']) },
      { id: `${item.id}_color`, name: 'Color', required: false, mode: 'single', choices: choices(['Black', 'White', 'Red', 'Blue', 'Brown', 'Grey', 'Cream']) },
      { id: `${item.id}_condition`, name: 'Condition', required: false, mode: 'single', choices: choices(['New', 'Like New', 'Vintage', 'Custom']) },
    ];
  }

  if (key.includes('kid') || key.includes('baby') || key.includes('infant') || key.includes('newborn')) {
    return [
      { id: `${item.id}_kids_size`, name: 'Size', required: true, mode: 'single', choices: choices(['Newborn', '0-3M', '3-6M', '6-12M', '12-18M', '2T', '3T', '4T', '5/6', '7/8', '10/12']) },
      { id: `${item.id}_color`, name: 'Color', required: false, mode: 'single', choices: choices(['Black', 'White', 'Pink', 'Blue', 'Tan', 'Grey', 'Mixed']) },
    ];
  }

  if (key.includes('jewel') || key.includes('chain') || key.includes('ring') || key.includes('watch') || key.includes('bracelet')) {
    return [
      { id: `${item.id}_finish`, name: 'Finish', required: false, mode: 'single', choices: choices(['Gold', 'Silver', 'Rose Gold', 'Black', 'Custom']) },
      { id: `${item.id}_length`, name: 'Length / Size', required: false, mode: 'single', choices: choices(['Small', 'Medium', 'Large', '16 in', '18 in', '20 in', '22 in', 'Custom']) },
    ];
  }

  return [
    { id: `${item.id}_size`, name: 'Size', required: true, mode: 'single', choices: choices(['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'One Size']) },
    { id: `${item.id}_color`, name: 'Color', required: false, mode: 'single', choices: choices(['Black', 'White', 'Grey', 'Red', 'Blue', 'Brown', 'Cream', 'Custom']) },
    { id: `${item.id}_style`, name: 'Style Options', required: false, mode: 'multiple', choices: choices([['Gift Wrap', 3], ['Rush Handling', 5], 'No Tags', 'Leave Tags On']) },
  ];
}
function buildOwnerSummary(cart: CartLine[], values: { orderType: OrderType; subtotal: number; deliveryFee: number; discount: number; total: number; promo?: string | null }, lang: Lang) { const c = OWNER_TRANSLATIONS[lang]; const lines: string[] = []; lines.push(`${lang === 'es' ? 'Tipo de orden' : 'Order Type'}: ${values.orderType === 'delivery' ? c.delivery : c.pickup}`); lines.push(''); cart.forEach((line, index) => { lines.push(`${index + 1}. ${line.quantity}x ${line.name} — ${money(line.total)}`); lines.push(`   Item ID: ${line.itemId}`); if (line.imageUrl) lines.push(`   Image: ${line.imageUrl}`); if (line.videoUrl) lines.push(`   Video: ${line.videoUrl}`); if (line.selections.length) line.selections.forEach((selection) => lines.push(`   ${selection.groupName}: ${selection.choiceNames.join(', ')}`)); else lines.push(`   ${c.noSelections}`); }); lines.push(''); lines.push(`${c.subtotal}: ${money(values.subtotal)}`); if (values.deliveryFee > 0) lines.push(`${c.deliveryFee}: ${money(values.deliveryFee)}`); if (values.discount > 0) lines.push(`${c.discount}: -${money(values.discount)}`); if (values.promo) lines.push(`${c.promo}: ${values.promo}`); lines.push(`${c.total}: ${money(values.total)}`); return lines.join('\n'); }
function normalizeSocialUrl(kind: SocialKind, value?: string | null) { const raw = String(value || '').trim(); if (!raw) return ''; if (/^https?:\/\//i.test(raw)) return raw; const clean = raw.replace(/^@/, '').replace(/^\/+/, ''); if (!clean) return ''; if (kind === 'instagram') return `https://instagram.com/${clean}`; if (kind === 'facebook') return `https://facebook.com/${clean}`; if (kind === 'tiktok') return `https://www.tiktok.com/@${clean}`; return clean.startsWith('@') ? `https://youtube.com/${clean}` : `https://youtube.com/@${clean}`; }
function getSocialLinks(restaurant: RestaurantRow | null) { if (!restaurant) return []; const links = [{ key: 'instagram' as SocialKind, label: 'Instagram', icon: 'IG', url: normalizeSocialUrl('instagram', restaurant.instagram_url || restaurant.instagram) }, { key: 'facebook' as SocialKind, label: 'Facebook', icon: 'f', url: normalizeSocialUrl('facebook', restaurant.facebook_url || restaurant.facebook) }, { key: 'tiktok' as SocialKind, label: 'TikTok', icon: '♪', url: normalizeSocialUrl('tiktok', restaurant.tiktok_url || restaurant.tiktok) }, { key: 'youtube' as SocialKind, label: 'YouTube', icon: '▶', url: normalizeSocialUrl('youtube', restaurant.youtube_url || restaurant.youtube) }]; return links.filter((link) => link.url); }
function posterForItem(item: Item | null) {
  if (!item) return '';
  const savedImage = getMediaImage(item);
  if (savedImage) return savedImage;
  if (item.posterUrl) return item.posterUrl;
  if (item.autoImageUrl) return item.autoImageUrl;
  return fallbackImage(item.categoryName, item.name);
}

function getMediaVideo(item: Item) {
  return item.videoUrl?.startsWith('http') || item.videoUrl?.startsWith('blob:') || item.videoUrl?.startsWith('data:')
    ? item.videoUrl
    : resolveStorageUrl(item.videoUrl, 'product-videos');
}

function getMediaImage(item: Item) {
  return item.imageUrl?.startsWith('http') || item.imageUrl?.startsWith('blob:') || item.imageUrl?.startsWith('data:')
    ? item.imageUrl
    : resolveStorageUrl(item.imageUrl, 'product-images');
}

function SmoothVideo({ src, poster, className = '', limitSeconds, controls = false, playWhenVisible = true }: { src: string; poster?: string; className?: string; limitSeconds?: number; controls?: boolean; playWhenVisible?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    const promise = video.play();
    if (promise && typeof promise.catch === 'function') promise.catch(() => null);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.load();
    const t1 = window.setTimeout(playVideo, 80);
    const t2 = window.setTimeout(playVideo, 400);
    const t3 = window.setTimeout(playVideo, 1000);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, [playVideo, src]);

  useEffect(() => {
    if (!playWhenVisible || typeof IntersectionObserver === 'undefined') return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) playVideo(); else if (!controls) video.pause(); }, { threshold: 0.15 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [controls, playVideo, playWhenVisible]);

  return <video key={src} ref={videoRef} className={className} src={src} poster={poster || undefined} autoPlay muted loop playsInline preload="auto" controls={controls} disablePictureInPicture onLoadedMetadata={playVideo} onLoadedData={playVideo} onCanPlay={playVideo} onPlaying={() => null} onPause={() => { if (!controls) window.setTimeout(playVideo, 150); }} onEnded={(event) => { event.currentTarget.currentTime = 0; playVideo(); }} onTimeUpdate={(event) => { const video = event.currentTarget; if (limitSeconds && video.currentTime >= limitSeconds) { video.currentTime = 0; playVideo(); } }} />;
}

function StaticVideoThumb({ src, poster, title, className = '' }: { src: string; poster?: string; title: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [posterFailed, setPosterFailed] = useState(false);
  const safePoster = !posterFailed && poster ? poster : undefined;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let cancelled = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const revealStill = () => {
      if (cancelled) return;
      try {
        const duration = Number(video.duration || 0);
        const target = duration && Number.isFinite(duration) ? Math.min(1.1, Math.max(duration * 0.12, 0.25)) : 0.35;
        if (Number.isFinite(target)) video.currentTime = target;
        video.pause();
      } catch {}
    };

    video.addEventListener('loadedmetadata', revealStill);
    video.addEventListener('loadeddata', revealStill);
    video.addEventListener('canplay', revealStill);
    video.load();

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', revealStill);
      video.removeEventListener('loadeddata', revealStill);
      video.removeEventListener('canplay', revealStill);
    };
  }, [src]);

  if (!src && poster) return <img className={className} src={poster} alt={title} onError={(event) => fallbackForImageElement(event, 'universal', title)} />;

  return <video ref={videoRef} className={className} src={src} poster={safePoster} muted playsInline preload="metadata" controls={false} onError={() => setPosterFailed(true)} aria-label={title} />;
}

function VideoCover({ src, poster, title, autoPlay = false }: { src: string; poster?: string; title: string; autoPlay?: boolean }) {
  const safePoster = poster || fallbackImage('universal', title);
  return <div className="videoCoverBox" aria-label={title}>{autoPlay && src ? <SmoothVideo src={src} poster={safePoster} className="videoCoverStill" limitSeconds={MENU_VIDEO_LIMIT_SECONDS} /> : <StaticVideoThumb src={src} poster={safePoster} title={title} className="videoCoverStill" />}<div className="videoCoverShade" /></div>;
}

function CartLineMedia({ line, fallbackName }: { line: CartLine; fallbackName: string }) {
  const image = line.imageUrl || line.image_url || line.itemImage || line.item_image;
  const video = line.videoUrl || line.video_url || '';
  if (video && isVideoUrl(video)) return <StaticVideoThumb src={video} poster={image || undefined} title={line.name || fallbackName} className="cartVideoStill" />;
  if (image) return <img src={image} alt={line.name} onError={(event) => fallbackForImageElement(event, undefined, fallbackName)} />;
  return <img src={fallbackImage(undefined, fallbackName)} alt={line.name} onError={(event) => fallbackForImageElement(event, undefined, fallbackName)} />;
}

export default function StorefrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || '';
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [lang, setLang] = useState<Lang>('en');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [showStickyCart, setShowStickyCart] = useState(false);
  const stickyCartVisible = showStickyCart && !cartOpen && !selectedItem;

  const heroRef = useRef<HTMLElement | null>(null);

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoRow | null>(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewNameInput, setReviewNameInput] = useState('');
  const [reviewRatingInput, setReviewRatingInput] = useState(5);
  const [reviewCommentInput, setReviewCommentInput] = useState('');
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [reviewUploadPreviewUrl, setReviewUploadPreviewUrl] = useState('');
  const [reviewInstagramInput, setReviewInstagramInput] = useState('');
  const [reviewFacebookInput, setReviewFacebookInput] = useState('');
  const [reviewTiktokInput, setReviewTiktokInput] = useState('');
  const [reviewYoutubeInput, setReviewYoutubeInput] = useState('');
  const [reviewMode, setReviewMode] = useState<'live' | 'upload'>('live');
  const [livePreviewUrl, setLivePreviewUrl] = useState('');
  const [liveRecordingBlob, setLiveRecordingBlob] = useState<Blob | null>(null);
  const [liveRecording, setLiveRecording] = useState(false);
  const [liveCameraReady, setLiveCameraReady] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveChunksRef = useRef<Blob[]>([]);


  const copy = COPY[lang];
  const ownerLang = useMemo<Lang>(() => getLang(restaurant?.order_language || restaurant?.owner_language || 'en'), [restaurant?.order_language, restaurant?.owner_language]);
  const getImage = useCallback((item: Item | null) => posterForItem(item), []);
  const getPoster = useCallback((item: Item | null) => posterForItem(item), []);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const { data: store, error: storeError } = await supabase.from('restaurants').select('*').eq('slug', slug).maybeSingle();
    if (storeError) console.error(storeError);
    if (!store) { setRestaurant(null); setLoading(false); return; }
    const restaurantRow = store as RestaurantRow;
    setRestaurant(restaurantRow);
    setLang(restaurantRow.storefront_language === 'es' ? 'es' : 'en');
    setOrderType(restaurantRow.delivery_enabled && restaurantRow.pickup_enabled === false ? 'delivery' : 'pickup');

    const [{ data: catRows }, { data: itemRows }, { data: groupRows }, { data: choiceRows }, promoRows, rewardRows, reviewRows] = await Promise.all([
      supabase.from('menu_categories').select('id,restaurant_id,name,sort_order').eq('restaurant_id', restaurantRow.id).order('sort_order', { ascending: true }),
      supabase.from('menu_items').select('*').eq('restaurant_id', restaurantRow.id).order('sort_order', { ascending: true }).limit(250),
      supabase.from('menu_option_groups').select('id,item_id,name,is_required,selection_mode,sort_order').order('sort_order', { ascending: true }).limit(500),
      supabase.from('menu_option_choices').select('id,option_group_id,name,price,price_delta,sort_order').order('sort_order', { ascending: true }).limit(1000),
      fetchCampaignRows(restaurantRow.id),
      fetchOptionalRows<RewardRow>(['rewards', 'restaurant_rewards', 'loyalty_rewards', 'store_rewards'], restaurantRow.id),
      fetchOptionalRows<ReviewRow>(['store_reviews', 'restaurant_reviews', 'reviews'], restaurantRow.id),
    ]);

    const liveRows = ((itemRows || []) as ItemRow[]).filter(isLiveShopItem);
    setPromos((promoRows || []).filter(isActiveRecord));
    setRewards((rewardRows || []).filter(isActiveRecord));
    setReviews((reviewRows || []).filter((review) => review.approved !== false).slice(0, 24));

    const itemCategoryIds = Array.from(new Set(liveRows.map((row) => row.category_id).filter(Boolean))) as string[];
    const baseCats: Category[] = ((catRows || []) as CategoryRow[]).filter((cat) => itemCategoryIds.includes(cat.id)).map((cat, index) => ({ id: cat.id, name: prettyName(cat.name || `Category ${index + 1}`), sortOrder: cat.sort_order ?? index }));
    const missingCategoryRows = itemCategoryIds.filter((categoryId) => !baseCats.some((cat) => cat.id === categoryId)).map((categoryId, index) => ({ id: categoryId, name: 'Shop', sortOrder: baseCats.length + index }));
    const mappedCats = [...baseCats, ...missingCategoryRows].sort((a, b) => a.sortOrder - b.sortOrder);
    setCategories(mappedCats);

    const groupList = (groupRows || []) as GroupRow[];
    const choiceList = (choiceRows || []) as ChoiceRow[];
    const mappedItems: Item[] = liveRows.map((row: ItemRow, index: number) => {
      const rawVideo = row.video_url || row.video_file || row.item_video || row.menu_video || row.product_video || row.product_video_url || row.video || '';
      const resolvedVideo = firstMediaUrl([row.video_url, row.video_file, row.item_video, row.menu_video, row.product_video, row.product_video_url, row.video], 'product-videos');
      const isVideoShop = isVideoShopRow(row);
      const cat = mappedCats.find((candidate) => candidate.id === row.category_id);
      const categoryName = isVideoShop ? 'Product Videos' : cat?.name || 'Collection';
      const dbGroups = groupList.filter((group) => group.item_id === row.id).map((group) => ({ id: group.id, name: group.name || 'Options', required: !!group.is_required, mode: group.selection_mode === 'multiple' ? 'multiple' : 'single', choices: choiceList.filter((choice) => choice.option_group_id === group.id).map((choice) => ({ id: choice.id, name: choice.name || 'Choice', priceDelta: Number(choice.price_delta ?? choice.price ?? 0) })) })) as Group[];
      const rawImage = row.image_url || row.image_file || row.item_image || row.image || row.product_image || row.photo_url || row.photo || '';
      const resolvedImage = firstMediaUrl([row.image_url, row.image_file, row.item_image, row.image, row.product_image, row.photo_url, row.photo], 'product-images');
      const realFallback = fallbackImage(isVideoShop ? categoryFromName('', row.name) : categoryName, row.name || 'video');
      const posterUrl = resolvedImage || realFallback;
      const item: Item = {
        id: row.id,
        categoryId: isVideoShop ? 'VIDEO_MENU' : row.category_id || `uncategorized_${index}`,
        categoryName,
        name: row.name || 'Product',
        description: row.description || '',
        imageUrl: resolvedImage || rawImage,
        videoUrl: resolvedVideo || rawVideo,
        autoImageUrl: posterUrl,
        basePrice: Number(row.base_price ?? row.price ?? 0),
        available: true,
        groups: [],
        isVideoShop,
        posterUrl
      };
      item.groups = dbGroups.length ? dbGroups : defaultGroups(item);
      return item;
    });

    setItems(mappedItems);
    setActiveCategory((current) => current === 'ALL' || current === 'VIDEO_MENU' || mappedCats.some((cat) => cat.id === current) ? current : 'ALL');
    setLoading(false);
    supabase.from('store_views').insert({ restaurant_id: restaurantRow.id, slug: restaurantRow.slug, viewed_at: new Date().toISOString() }).then(() => null);
  }, [slug]);

  useEffect(() => {
    const updateStickyCart = () => {
      const hero = heroRef.current;
      if (!hero) {
        setShowStickyCart(false);
        return;
      }

      setShowStickyCart(hero.getBoundingClientRect().bottom <= 8);
    };

    updateStickyCart();
    window.addEventListener('scroll', updateStickyCart, { passive: true });
    window.addEventListener('resize', updateStickyCart);

    return () => {
      window.removeEventListener('scroll', updateStickyCart);
      window.removeEventListener('resize', updateStickyCart);
    };
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!restaurant?.id) return; const channel = supabase.channel(`orda-store-${restaurant.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurant.id}` }, () => void load()).on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurant.id}` }, () => void load()).on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories', filter: `restaurant_id=eq.${restaurant.id}` }, () => void load()).subscribe(); return () => { void supabase.removeChannel(channel); }; }, [restaurant?.id, load]);

  const videoItems = useMemo(() => items.filter((item) => isVideoShopItemFromItem(item)), [items]);
  const photoItems = useMemo(() => items.filter((item) => !isVideoShopItemFromItem(item)), [items]);
  const visibleItems = useMemo(() => { if (activeCategory === 'VIDEO_MENU') return videoItems; if (activeCategory === 'ALL') return [...photoItems, ...videoItems]; return photoItems.filter((item) => item.categoryId === activeCategory); }, [activeCategory, photoItems, videoItems]);
  const activeCategoryName = useMemo(() => activeCategory === 'VIDEO_MENU' ? 'Video Shop' : activeCategory === 'ALL' ? visibleItems[0]?.categoryName || categories[0]?.name || 'universal' : categories.find((category) => category.id === activeCategory)?.name || 'universal', [activeCategory, categories, visibleItems]);
  const categoryHeroItem = visibleItems[0] || items[0] || null;
  const sidePromoImage = useMemo(() => categoryHeroItem ? getImage(categoryHeroItem) : fallbackImage(activeCategoryName, activeCategoryName), [activeCategoryName, categoryHeroItem, getImage]);
  const selectedTotal = useMemo(() => { if (!selectedItem) return 0; let extra = 0; selectedItem.groups.forEach((group) => { const ids = picked[group.id] || []; group.choices.forEach((choice) => { if (ids.includes(choice.id)) extra += choice.priceDelta; }); }); return (selectedItem.basePrice + extra) * qty; }, [selectedItem, picked, qty]);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartSubtotal = cart.reduce((sum, line) => sum + line.total, 0);
  const promoDiscount = promoDiscountAmount(appliedPromo, cartSubtotal);
  const deliveryFee = orderType === 'delivery' ? Number(restaurant?.delivery_fee || 0) : 0;
  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - promoDiscount);

  function scrollToShop() { document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }
  function openItem(item: Item) { const start: Record<string, string[]> = {}; item.groups.forEach((group) => { start[group.id] = []; }); setPicked(start); setQty(1); setSelectedItem(item); }
  function toggleChoice(group: Group, choice: Choice) { setPicked((current) => { const existing = current[group.id] || []; if (group.mode === 'single') return { ...current, [group.id]: existing.includes(choice.id) ? [] : [choice.id] }; return { ...current, [group.id]: existing.includes(choice.id) ? existing.filter((id) => id !== choice.id) : [...existing, choice.id] }; }); }
  function canAdd() { if (!selectedItem) return false; return selectedItem.groups.every((group) => !group.required || (picked[group.id] || []).length > 0); }
  function addToCart() { if (!selectedItem || !canAdd()) return; const selections = selectedItem.groups.map((group) => { const ids = picked[group.id] || []; const selectedChoices = group.choices.filter((choice) => ids.includes(choice.id)); return { groupName: group.name, choiceNames: selectedChoices.map((choice) => (choice.priceDelta > 0 ? `${choice.name} +${money(choice.priceDelta)}` : choice.name)), priceDelta: selectedChoices.reduce((sum, choice) => sum + choice.priceDelta, 0) }; }).filter((selection) => selection.choiceNames.length); const unitTotal = selectedItem.basePrice + selections.reduce((sum, selection) => sum + selection.priceDelta, 0); const poster = getPoster(selectedItem) || fallbackImage(selectedItem.categoryName, selectedItem.name); const video = resolveStorageUrl(selectedItem.videoUrl); const mediaType = isVideoShopItemFromItem(selectedItem) ? 'video' : 'image'; setCart((current) => [...current, { id: makeId('cart'), itemId: selectedItem.id, name: selectedItem.name, itemName: selectedItem.name, imageUrl: poster, image_url: poster, itemImage: poster, item_image: poster, videoUrl: video, video_url: video, mediaType, quantity: qty, selections, unitTotal, total: unitTotal * qty }]); setSelectedItem(null); setCartOpen(true); }
  function removeCartLine(lineId: string) { setCart((current) => current.filter((line) => line.id !== lineId)); }
  function updateCartQty(lineId: string, nextQty: number) { if (nextQty <= 0) { removeCartLine(lineId); return; } setCart((current) => current.map((line) => (line.id === lineId ? { ...line, quantity: nextQty, total: line.unitTotal * nextQty } : line))); }
  function applyPromoByCode(codeValue?: string) { const code = String(codeValue || promoInput).trim().toLowerCase(); if (!code) { setAppliedPromo(null); setPromoMessage(''); return; } const found = promos.find((promo) => promoCodeValue(promo).toLowerCase() === code || promoTitle(promo).toLowerCase() === code); if (!found) { setAppliedPromo(null); setPromoMessage(copy.promoNotFound); setCartOpen(true); return; } setAppliedPromo(found); setPromoInput(promoCodeValue(found) || promoTitle(found)); setPromoMessage(`${promoValueText(found)} ${copy.promoApplied}`); setCartOpen(true); }
  function useReward(reward: RewardRow) { setPromoMessage(`${rewardTitle(reward)} selected. Add your items and checkout direct.`); setCartOpen(true); scrollToShop(); }
  async function checkout() { if (!restaurant || !cart.length) return; setCheckingOut(true); const promoLabel = appliedPromo ? promoCodeValue(appliedPromo) || promoTitle(appliedPromo) : null; const ownerItemsSummary = buildOwnerSummary(cart, { orderType, subtotal: cartSubtotal, deliveryFee, discount: promoDiscount, total: cartTotal, promo: promoLabel }, ownerLang); const customerItemsSummary = buildOwnerSummary(cart, { orderType, subtotal: cartSubtotal, deliveryFee, discount: promoDiscount, total: cartTotal, promo: promoLabel }, lang); const checkoutCart = cart.map((line) => ({ ...line, image: line.imageUrl, imageUrl: line.imageUrl, image_url: line.imageUrl, itemImage: line.imageUrl, item_image: line.imageUrl, videoUrl: line.videoUrl || '', video_url: line.videoUrl || '', itemVideo: line.videoUrl || '', item_video: line.videoUrl || '', mediaType: line.mediaType, itemId: line.itemId, itemName: line.name })); try { const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: checkoutCart, restaurantId: restaurant.id, slug: restaurant.slug, orderType, subtotal: cartSubtotal, deliveryFee, discount: promoDiscount, total: cartTotal, customerLanguage: lang, ownerLanguage: ownerLang, orderLanguage: ownerLang, items_summary: ownerItemsSummary, owner_items_summary: ownerItemsSummary, customer_items_summary: customerItemsSummary, order_media: checkoutCart.map((line) => ({ item_id: line.itemId, name: line.name, image_url: line.imageUrl, video_url: line.videoUrl, media_type: line.mediaType, quantity: line.quantity })), promo: appliedPromo ? { id: appliedPromo.id, code: promoCodeValue(appliedPromo), title: promoTitle(appliedPromo), discount: promoDiscount } : null }) }); const data = await response.json(); if (!response.ok) { alert(data?.error || 'Checkout failed'); return; } if (data?.url) window.location.href = data.url; else alert('Stripe checkout URL missing'); } catch (error: any) { alert(error?.message || 'Checkout crashed'); } finally { setCheckingOut(false); } }

  if (loading) return <main className="page dark"><div className="loader">Loading ORDA...</div><style jsx global>{styles}</style></main>;
  if (!restaurant) return <main className="page dark"><div className="loader">Store not found.</div><style jsx global>{styles}</style></main>;

  const storeName = restaurant.name || 'ORDA Store';
  const address = restaurant.address || 'Store address';
  const phone = restaurant.phone || '';
  const theme: Theme = getTheme(restaurant.storefront_theme);
  const accent: StoreAccent = getAccent(restaurant.storefront_accent);
  const heroTitle = restaurant.hero_title || storeName;
  const heroTagline = restaurant.hero_subtitle || restaurant.description || COPY[lang].directTagline;
  const hourRows = normalizeHours(restaurant.hours);
  const openStatus = getOpenStatus(restaurant.hours, copy);
  const heroImage = resolveStorageUrl(restaurant.hero_image) || publicStorageUrl(FALLBACK_HERO);
  const rawHeroVideo = restaurant.hero_video || restaurant.hero_video_url || restaurant.hero_video_file || '';
  const heroVideo = resolveStorageUrl(rawHeroVideo);
  const logoImage = resolveStorageUrl(restaurant.logo_image);
  const featuredPromo = promos[0] || null;
  const featuredReward = rewards[0] || null;
  const promoCode = featuredPromo ? promoCodeValue(featuredPromo) : '';
  const promoBig = featuredPromo ? promoValueText(featuredPromo) : '';
  const promoSmall = featuredPromo ? promoTitle(featuredPromo) : '';
  const promoDesc = featuredPromo ? promoDescription(featuredPromo) : '';
  const promoButton = promoButtonText(featuredPromo, copy);
  const campaignMedia = promoMediaUrl(featuredPromo);
  const campaignMediaIsVideo = featuredPromo ? promoMediaType(featuredPromo) === 'video' : false;
  const rewardPoints = Number(featuredReward?.points_required || featuredReward?.visits_required || restaurant.rewards_points || 320);
  const rewardText = featuredReward && rewardDescription(featuredReward) ? rewardDescription(featuredReward) : restaurant.rewards_text || '$10 OFF YOUR ORDER';
  const socialLinks = getSocialLinks(restaurant);


  function stopLiveTracks() {
    liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    liveStreamRef.current = null;
    setLiveCameraReady(false);
  }

  async function startLiveCamera() {
    setReviewMessage('');
    setReviewMode('live');
    setLiveRecordingBlob(null);
    if (livePreviewUrl) URL.revokeObjectURL(livePreviewUrl);
    setLivePreviewUrl('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setReviewMessage('Live camera is not available in this browser. Use upload instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      liveStreamRef.current = stream;
      setLiveCameraReady(true);
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.muted = true;
        liveVideoRef.current.playsInline = true;
        await liveVideoRef.current.play().catch(() => null);
      }
    } catch {
      setReviewMessage('Camera permission is needed for a live video review.');
    }
  }

  function startLiveRecording() {
    const stream = liveStreamRef.current;
    if (!stream || liveRecording) return;
    setReviewMessage('');
    liveChunksRef.current = [];

    const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm' });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) liveChunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(liveChunksRef.current, { type: 'video/webm' });
      setLiveRecordingBlob(blob);
      const nextUrl = URL.createObjectURL(blob);
      setLivePreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
      stopLiveTracks();
      setLiveRecording(false);
    };
    recorder.start();
    setLiveRecording(true);
  }

  function stopLiveRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  function redoLiveRecording() {
    setLiveRecordingBlob(null);
    if (livePreviewUrl) URL.revokeObjectURL(livePreviewUrl);
    setLivePreviewUrl('');
    void startLiveCamera();
  }

  function onReviewFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setReviewMode('upload');
    setReviewFile(file);
    setReviewUploadPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : '';
    });
    setLiveRecordingBlob(null);
    if (livePreviewUrl) URL.revokeObjectURL(livePreviewUrl);
    setLivePreviewUrl('');
    stopLiveTracks();
    setReviewMessage('');
  }

  async function submitReview() {
    if (!restaurant || reviewSubmitting) return;
    const cleanName = reviewNameInput.trim() || 'Anonymous Customer';
    const cleanComment = reviewCommentInput.trim();
    const selectedMedia = reviewMode === 'live' && liveRecordingBlob
      ? new File([liveRecordingBlob], `live-review-${Date.now()}.webm`, { type: liveRecordingBlob.type || 'video/webm' })
      : reviewFile;

    if (!cleanComment) {
      setReviewMessage('Add a comment under your video or photo review.');
      return;
    }
    if (!selectedMedia) {
      setReviewMessage('Record a live video review or upload a video/photo first.');
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage('');

    try {
      const fileExt = selectedMedia.name.split('.').pop()?.toLowerCase() || (reviewMode === 'live' ? 'webm' : 'mp4');
      const mediaType = selectedMedia.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'ogg'].includes(fileExt) ? 'video' : 'photo';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${restaurant.id}/${safeName}`;
      const upload = await supabase.storage.from('review-media').upload(filePath, selectedMedia, { cacheControl: '3600', upsert: false });

      if (upload.error) {
        setReviewMessage('Review media could not upload. Make sure the review-media bucket exists.');
        return;
      }

      const { data: publicData } = supabase.storage.from('review-media').getPublicUrl(filePath);
      const mediaUrl = publicData.publicUrl;

      const reviewInsert = {
        restaurant_id: restaurant.id,
        store_slug: restaurant.slug || slug,
        customer_name: cleanName,
        rating: reviewRatingInput,
        comment: cleanComment,
        media_url: mediaUrl,
        media_type: mediaType,
        instagram: reviewInstagramInput.trim(),
        facebook: reviewFacebookInput.trim(),
        tiktok: reviewTiktokInput.trim(),
        youtube: reviewYoutubeInput.trim(),
        approved: true,
        verified_order: false,
      };

      const { data, error } = await supabase.from('store_reviews').insert(reviewInsert).select('*').single();

      if (error) {
        setReviewMessage('Review could not save. Make sure the store_reviews table exists.');
        return;
      }

      setReviews((current) => [data as ReviewRow, ...current].slice(0, 24));
      setReviewNameInput('');
      setReviewRatingInput(5);
      setReviewCommentInput('');
      setReviewInstagramInput('');
      setReviewFacebookInput('');
      setReviewTiktokInput('');
      setReviewYoutubeInput('');
      setReviewFile(null);
      setReviewUploadPreviewUrl((current) => { if (current) URL.revokeObjectURL(current); return ''; });
      setLiveRecordingBlob(null);
      if (livePreviewUrl) URL.revokeObjectURL(livePreviewUrl);
      setLivePreviewUrl('');
      stopLiveTracks();
      setReviewMode('live');
      setReviewMessage('Review posted. Thank you for supporting this brand.');
    } finally {
      setReviewSubmitting(false);
    }
  }


  function storefrontShareText() {
    const storeUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : `/store/${slug}`;
    return {
      storeUrl,
      caption: `Shop this brand: ${storeName}\nOrder direct here: ${storeUrl}`,
    };
  }

  async function shareStorefrontReview() {
    if (typeof window === 'undefined') return;

    const { storeUrl, caption } = storefrontShareText();
    await navigator.clipboard?.writeText(caption).catch(() => null);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Shop this brand: ${storeName}`,
          text: caption,
          url: storeUrl,
        });
        setReviewMessage('Brand link copied. Paste it into the caption or link sticker.');
        return;
      }

      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}&quote=${encodeURIComponent(caption)}`, '_blank', 'noopener,noreferrer');
      setReviewMessage('Brand link copied. Paste it into the caption or link sticker.');
    } catch {
      setReviewMessage('Brand link copied. Paste it into the caption or link sticker.');
    }
  }

  return <main className={`page ${theme} accent-${accent}`}>
    <div className="topNotice"><span>7TH ST VAULT</span><nav><button type="button" onClick={scrollToShop}>{copy.menu}</button><button type="button" onClick={() => document.getElementById('side-promos')?.scrollIntoView({ behavior: 'smooth' })}>{copy.promos}</button><button type="button" onClick={() => document.getElementById('side-rewards')?.scrollIntoView({ behavior: 'smooth' })}>{copy.rewards}</button><button type="button" onClick={() => document.getElementById('hours')?.scrollIntoView({ behavior: 'smooth' })}>{copy.hours}</button></nav><div className="language"><button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button><button type="button" className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button><button type="button" className="discoverBtn" onClick={() => window.location.href = '/discover'}>Discover Fashion</button><button type="button" className="cartBtn" onClick={() => setCartOpen(true)}>🛒<b>{cartCount}</b></button></div></div>

    <section ref={heroRef} className="hero cleanHero">{heroVideo && isVideoUrl(heroVideo) ? <SmoothVideo className="heroMedia" src={heroVideo} poster={heroImage} /> : <img className="heroMedia" src={heroImage} alt={storeName} loading="eager" decoding="async" onError={(event) => fallbackForImageElement(event, 'hero', storeName)} />}<div className="heroShade" /><div className="heroContent cleanHeroContent"><div className="heroLockup">{logoImage ? <img className="heroLogo" src={logoImage} alt={storeName} loading="eager" decoding="async" onError={(event) => fallbackForImageElement(event, 'logo', storeName)} /> : <div className="heroLogo brandFallback">ORDA</div>}<div className="heroText"><small>7TH ST VAULT BRAND</small><h1>{heroTitle}</h1><p>{heroTagline}</p></div></div></div></section>

    <section className="storeInfoBelowHero"><div className="infoLines"><p>📍 {address}</p><p>☎ {phone || copy.noPhone}</p><p className={openStatus.open ? 'openLine isOpen' : 'openLine isClosed'}><span /> {openStatus.text} <em>•</em> {openStatus.nextText}</p></div><div className="serviceActions">{restaurant.pickup_enabled !== false ? <button type="button" className={orderType === 'pickup' ? 'activeService' : ''} onClick={() => setOrderType('pickup')}>🛍 {copy.pickup}</button> : null}{restaurant.delivery_enabled ? <button type="button" className={orderType === 'delivery' ? 'activeService' : ''} onClick={() => setOrderType('delivery')}>🚘 {copy.delivery}</button> : null}<small>⏱ 30-45 MIN</small></div>{socialLinks.length ? <div className="socialStrip" aria-label={copy.followUs}><strong>{copy.followUs}</strong><div>{socialLinks.map((link) => <a key={link.key} className={`socialLink ${link.key}`} href={link.url} target="_blank" rel="noreferrer" aria-label={link.label}><span>{link.icon}</span><b>{link.label}</b></a>)}</div></div> : null}</section>

    {videoItems.length ? <section className="videoShopSection"><div className="sectionHeader"><small>7TH ST VAULT PRODUCT VIDEOS</small><h2>{copy.videos}</h2></div><div className="videoRail">{videoItems.map((item) => { const videoUrl = getMediaVideo(item); const poster = getPoster(item); return <button type="button" key={item.id} className="videoCard" onClick={() => openItem(item)}>{videoUrl ? <SmoothVideo src={videoUrl} poster={poster || undefined} className="productCardVideo" /> : <img src={poster} alt={item.name} onError={(event) => fallbackForImageElement(event, item.categoryName, item.name)} />}<strong>{item.name}</strong><b>{money(item.basePrice)}</b></button>; })}</div></section> : null}

    <section className="layout" id="menu"><div className="mainCol"><div className="categories"><button type="button" className={activeCategory === 'ALL' ? 'active' : ''} onClick={() => setActiveCategory('ALL')}>▦ {copy.allItems}</button>{categories.map((cat) => <button type="button" key={cat.id} className={activeCategory === cat.id ? 'active' : ''} onClick={() => setActiveCategory(cat.id)}>{cat.name}</button>)}{videoItems.length ? <button type="button" className={activeCategory === 'VIDEO_MENU' ? 'active' : ''} onClick={() => setActiveCategory('VIDEO_MENU')}>▶ {copy.videos}</button> : null}</div><h3 className="sectionTitle">{activeCategory === 'VIDEO_MENU' ? copy.videos : activeCategory === 'ALL' ? copy.allItems : categories.find((category) => category.id === activeCategory)?.name}</h3><div className="menuGrid">{visibleItems.length ? visibleItems.map((item) => { const itemImage = getMediaImage(item) || getImage(item); const itemVideo = getMediaVideo(item); const hasVideo = Boolean(itemVideo); const poster = getPoster(item); return <button type="button" key={item.id} className={hasVideo ? 'itemCard videoItemCard' : 'itemCard'} onClick={() => item.available && openItem(item)}><div className="imageBox">{hasVideo ? <SmoothVideo src={itemVideo} poster={poster || undefined} className="productCardVideo" /> : itemImage ? <img src={itemImage} alt={item.name} loading="lazy" decoding="async" onError={(event) => fallbackForImageElement(event, item.categoryName, item.name)} /> : <img src={fallbackImage(item.categoryName, item.name)} alt={item.name} onError={(event) => fallbackForImageElement(event, item.categoryName, item.name)} />}{!item.available ? <em>{copy.soldOut}</em> : null}</div><div className="itemCopy"><h4>{item.name}</h4><p>{item.description || (hasVideo ? 'Watch the product in motion.' : 'Fashion product from this 7th St Vault brand.')}</p><strong className="itemPrice">{money(item.basePrice)}</strong><span>⚙ {copy.customize}</span></div></button>; }) : <div className="noItems"><strong>{copy.noItems}</strong><span>{copy.noItemsSub}</span></div>}</div></div>
          <section className="reviewSection" id="reviews">
      <div className="reviewShell">
        <div className="reviewIconBubble">🎥</div>
        <div className="reviewCopy">
          <small>REAL CUSTOMER REVIEWS</small>
          <h2>Watch customer fit reviews</h2>
          <p>Customers can leave honest fit videos, product reviews, and style feedback with their comment under the video.</p>
        </div>
        <div className="reviewActions">
          <button type="button" className="reviewPrimary" onClick={() => setReviewsOpen(true)}>▶ Watch Reviews</button>
          <button type="button" className="reviewSecondary" onClick={() => setReviewsOpen(true)}>＋ Leave Video Review</button>
        </div>
      </div>
      {reviews.length ? <div className="reviewPreviewRail">{reviews.slice(0, 3).map((review) => {
        const mediaUrl = reviewMediaUrl(review);
        const mediaType = reviewMediaType(review);
        return <button type="button" key={review.id} className="reviewPreviewCard" onClick={() => setReviewsOpen(true)}>{mediaUrl ? (mediaType === 'video' ? <video src={mediaUrl} muted playsInline preload="metadata" /> : <img src={mediaUrl} alt={reviewName(review)} />) : <div className="reviewNoMedia">★</div>}<div><strong>{'★'.repeat(reviewRating(review))}</strong><b>{reviewName(review)}</b><p>{reviewComment(review) || 'Real customer review.'}</p></div></button>;
      })}</div> : <button type="button" className="reviewEmptyPreview" onClick={() => setReviewsOpen(true)}><span>🎬</span><strong>Be the first customer to leave a fit review.</strong><b>Tap to upload a video and comment</b></button>}
    </section>

      <aside className="sideCol"><section className="sideBox mapBox"><h3>📍 {copy.location}</h3><p>{address}</p><iframe title="Brand map" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`} /><a className="goldFull" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">➤ {copy.directions}</a></section>{featuredPromo ? <section className="sidePromoVisual" id="side-promos"><div className="sidePromoCopy"><small>{featuredPromo?.promo_type || copy.limitedOffer}</small><h3>{promoBig}</h3><strong>{promoSmall}</strong><p>{promoDesc}</p><button type="button" onClick={() => applyPromoByCode(promoCode)}>{promoButton}</button></div>{campaignMedia ? (campaignMediaIsVideo ? <SmoothVideo src={campaignMedia} poster={sidePromoImage} className="campaignMediaThumb" limitSeconds={MENU_VIDEO_LIMIT_SECONDS} /> : <img src={campaignMedia} alt={`${promoSmall} campaign`} loading="lazy" decoding="async" onError={(event) => fallbackForImageElement(event, activeCategoryName, activeCategoryName)} />) : <img src={sidePromoImage} alt={`${activeCategoryName} promo`} loading="lazy" decoding="async" onError={(event) => fallbackForImageElement(event, activeCategoryName, activeCategoryName)} />}</section> : null}{featuredReward ? <section className="sideRewardVisual" id="side-rewards"><div><small>👑 {featuredReward ? rewardTitle(featuredReward) : 'ORDA REWARDS'}</small><h3>{rewardPoints}</h3><strong>{copy.pointsAvailable}</strong><p>{featuredReward ? rewardText : `${copy.nextReward}: ${rewardText}`}</p><button type="button" onClick={() => (featuredReward ? useReward(featuredReward) : scrollToShop())}>{copy.viewRewards} →</button></div><img src={sidePromoImage} alt={`${activeCategoryName} rewards`} loading="lazy" decoding="async" onError={(event) => fallbackForImageElement(event, activeCategoryName, activeCategoryName)} /></section> : null}<section className="sideBox"><h3>🔗 {copy.storeDetails}</h3><p>{restaurant.pickup_enabled !== false ? '✅' : '❌'} {copy.pickupAvailable}</p><p>{restaurant.delivery_enabled ? '✅' : '❌'} {copy.deliveryAvailable}</p><p>🚚 {copy.deliveryFee}: {money(Number(restaurant.delivery_fee || 0))}</p><p>🚚 {copy.deliveryRadius}: {Number(restaurant.delivery_radius || 5)} Miles</p><p>⏱ {copy.minimumOrder}: {money(Number(restaurant.delivery_minimum || 0))}</p></section>{socialLinks.length ? <section className="sideBox sideSocialBox"><h3>📲 {copy.social}</h3><div className="sideSocialGrid">{socialLinks.map((link) => <a key={link.key} className={`socialLink ${link.key}`} href={link.url} target="_blank" rel="noreferrer" aria-label={link.label}><span>{link.icon}</span><b>{link.label}</b></a>)}</div></section> : null}<section className="sideBox" id="hours"><h3>🕒 {copy.hours}</h3>{hourRows.map((row) => <div className="hour" key={row.day}><span>{row.day}</span><b>{row.closed ? 'Closed' : `${formatHour(row.open)} - ${formatHour(row.close)}`}</b></div>)}<p className={openStatus.open ? 'green statusNow' : 'red statusNow'}>● {openStatus.text} • {openStatus.nextText}</p></section></aside>
    </section>

    {reviewsOpen ? <div className="modalBackdrop reviewBackdrop" onClick={() => { stopLiveTracks(); setReviewsOpen(false); }}><section className="reviewModal" onClick={(event) => event.stopPropagation()}><button type="button" className="close" onClick={() => { stopLiveTracks(); setReviewsOpen(false); }}>×</button><div className="reviewModalHead"><small>ORDA CUSTOMER REVIEWS</small><h2>Real reviews for {storeName}</h2><p>Live video reviews are preferred. Customers can record a real reaction, preview it, redo it, then post it with a comment under the video.</p></div><div className="reviewModalGrid"><div className="reviewList">{reviews.length ? reviews.map((review) => { const mediaUrl = reviewMediaUrl(review); const mediaType = reviewMediaType(review); const socials = reviewSocials(review); return <article key={review.id} className="reviewCard">{mediaUrl ? mediaType === 'video' ? <video src={mediaUrl} controls playsInline preload="metadata" /> : <img src={mediaUrl} alt={reviewName(review)} /> : <div className="reviewNoMedia big">No media</div>}<div className="reviewCardBody"><div className="reviewStars">{'★'.repeat(reviewRating(review))}<span>{review.verified_order ? 'Verified Order' : 'Customer Review'}</span></div><h3>{reviewName(review)}</h3>{socials.length ? <div className="reviewSocials">{socials.map((social) => <span key={social.key}>{social.label}: {String(social.value)}</span>)}</div> : null}<p>{reviewComment(review) || 'Great food and service.'}</p>{reviewDate(review) ? <small>{reviewDate(review)}</small> : null}</div></article>; }) : <div className="reviewNoReviews"><span>🎥</span><strong>No reviews yet.</strong><p>Leave the first honest video review for this storefront.</p></div>}</div><aside className="reviewForm"><h3>Leave a Fit Review</h3><p>Name is optional. Live fit videos are preferred, but customers can still upload a video or photo.</p><div className="reviewModeTabs"><button type="button" className={reviewMode === 'live' ? 'active' : ''} onClick={() => { setReviewMode('live'); setReviewFile(null); setReviewUploadPreviewUrl((current) => { if (current) URL.revokeObjectURL(current); return ''; }); }}>Live Fit Review</button><button type="button" className={reviewMode === 'upload' ? 'active' : ''} onClick={() => { setReviewMode('upload'); stopLiveTracks(); }}>Upload</button></div>{reviewMode === 'live' ? <div className="liveReviewBox"><div className="sharePreviewFrame">{livePreviewUrl ? <video className="livePreview" src={livePreviewUrl} controls playsInline /> : <video className="livePreview" ref={liveVideoRef} autoPlay muted playsInline />}<a className="suggestedStoreOverlay forceShopOverlay" href={typeof window !== 'undefined' ? window.location.href.split('#')[0] : `/store/${slug}`} target="_blank" rel="noreferrer" onClick={(event) => { event.stopPropagation(); }}><span>Shop this brand</span><b>{storeName}</b><em>›</em></a></div><div className="liveButtons">{!liveCameraReady && !liveRecording && !livePreviewUrl ? <button type="button" onClick={startLiveCamera}>Start Camera</button> : null}{liveCameraReady && !liveRecording ? <button type="button" onClick={startLiveRecording}>Start Recording</button> : null}{liveRecording ? <button type="button" className="danger" onClick={stopLiveRecording}>Stop Recording</button> : null}{livePreviewUrl ? <button type="button" onClick={redoLiveRecording}>Redo Video</button> : null}</div><small>{livePreviewUrl ? 'Preview your live review. Post it or redo it.' : 'Record a live reaction. You can preview it before posting.'}</small></div> : <div className="uploadReviewBox"><label>Upload Product Video or Photo<input type="file" accept="video/*,image/*" onChange={onReviewFileChange} /></label>{reviewUploadPreviewUrl ? <div className="sharePreviewFrame uploadPreviewFrame">{reviewFile?.type.startsWith('video/') ? <video className="livePreview" src={reviewUploadPreviewUrl} controls playsInline /> : <img className="livePreview uploadPreviewImage" src={reviewUploadPreviewUrl} alt="Review upload preview" />}<a className="suggestedStoreOverlay forceShopOverlay" href={typeof window !== 'undefined' ? window.location.href.split('#')[0] : `/store/${slug}`} target="_blank" rel="noreferrer" onClick={(event) => { event.stopPropagation(); }}><span>Shop this brand</span><b>{storeName}</b><em>›</em></a></div> : <div className="uploadEmptyPreview"><span>📸</span><b>Upload a video or photo to preview the storefront button.</b></div>}</div>}<a className="reviewStoreLinkBadge clickableStoreBadge forceShopBadge" href={typeof window !== 'undefined' ? window.location.href.split('#')[0] : `/store/${slug}`} target="_blank" rel="noreferrer"><span>Shop this brand</span><strong>{storeName}</strong><small>{typeof window !== 'undefined' ? window.location.href.split('#')[0] : `/store/${slug}`}</small><em>Paste this copied link into the caption or Instagram/Facebook link sticker.</em></a><label>Your Name <span>(optional)</span><input value={reviewNameInput} onChange={(event) => setReviewNameInput(event.target.value)} placeholder="Anonymous Customer" /></label><div className="reviewSocialGrid"><label>Instagram <span>(optional)</span><input value={reviewInstagramInput} onChange={(event) => setReviewInstagramInput(event.target.value)} placeholder="@yourname" /></label><label>Facebook <span>(optional)</span><input value={reviewFacebookInput} onChange={(event) => setReviewFacebookInput(event.target.value)} placeholder="Facebook name" /></label><label>TikTok <span>(optional)</span><input value={reviewTiktokInput} onChange={(event) => setReviewTiktokInput(event.target.value)} placeholder="@yourname" /></label><label>YouTube <span>(optional)</span><input value={reviewYoutubeInput} onChange={(event) => setReviewYoutubeInput(event.target.value)} placeholder="@channel" /></label></div><label>Star Rating<select value={reviewRatingInput} onChange={(event) => setReviewRatingInput(Number(event.target.value))}><option value={5}>★★★★★ 5</option><option value={4}>★★★★ 4</option><option value={3}>★★★ 3</option><option value={2}>★★ 2</option><option value={1}>★ 1</option></select></label><label>Comment<textarea value={reviewCommentInput} onChange={(event) => setReviewCommentInput(event.target.value)} placeholder="Write your honest comment under your video review..." /></label>{reviewFile ? <div className="reviewPicked">Selected: {reviewFile.name}</div> : null}{reviewMessage ? <p className="reviewMessage">{reviewMessage}</p> : null}<button type="button" className="addBtn" onClick={submitReview} disabled={reviewSubmitting || liveRecording}>{reviewSubmitting ? 'Posting...' : 'Post Review'}</button><div className="reviewShareBox"><strong>Share this brand review</strong><p>One simple button copies the storefront link and opens the share sheet.</p><div className="shareSimpleCard"><strong>Share this brand review</strong><p>Tap once. 7th St Vault copies the brand link so you can paste it into the caption or link sticker.</p><button type="button" className="shareOneBtn" onClick={shareStorefrontReview}>Share Brand Link</button></div></div></aside></div></section></div> : null}

    {selectedItem ? <div className="modalBackdrop" onClick={() => setSelectedItem(null)}><section className="modal" onClick={(event) => event.stopPropagation()}><button type="button" className="close" onClick={() => setSelectedItem(null)}>×</button>{resolveStorageUrl(selectedItem.videoUrl) && isVideoUrl(resolveStorageUrl(selectedItem.videoUrl)) ? <SmoothVideo className="modalImg" src={resolveStorageUrl(selectedItem.videoUrl)} poster={getPoster(selectedItem) || undefined} limitSeconds={MENU_VIDEO_LIMIT_SECONDS} controls playWhenVisible={false} /> : getImage(selectedItem) ? <img className="modalImg" src={getImage(selectedItem)} alt={selectedItem.name} onError={(event) => fallbackForImageElement(event, selectedItem.categoryName, selectedItem.name)} /> : null}<div className="modalBody"><div className="modalTop"><div><h2>{selectedItem.name}</h2><p>{selectedItem.description}</p></div><div className="priceBox"><small>{copy.basePrice}</small><strong>{money(selectedItem.basePrice)}</strong><small>{copy.finalPrice}</small><b>{money(selectedTotal)}</b></div></div>{selectedItem.groups.map((group) => <section className="optionGroup" key={group.id}><header><h3>{group.name}</h3><span>{group.required ? copy.required : copy.optional}</span></header><div className="choiceList">{group.choices.map((choice) => { const active = (picked[group.id] || []).includes(choice.id); return <button type="button" key={choice.id} className={active ? 'choice active' : 'choice'} onClick={() => toggleChoice(group, choice)}><span>{choice.name}</span><b>{choice.priceDelta > 0 ? `+${money(choice.priceDelta)}` : '$0.00'}</b><i>{active ? '✓' : ''}</i></button>; })}</div></section>)}<div className="qtyRow"><strong>{copy.quantity}</strong><div><button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button type="button" onClick={() => setQty(qty + 1)}>+</button></div></div><button type="button" className="addBtn" disabled={!canAdd()} onClick={addToCart}>{copy.addToCart} • {money(selectedTotal)}</button></div></section></div> : null}

    {stickyCartVisible ? <section className="stickyCart"><div className="cartLeft"><span>🛒</span><b>{cartCount}</b></div><div><strong>{cartCount} {copy.items}</strong><p>{copy.cart}</p></div><div className="cartMini">{cart.slice(-3).map((line) => <CartLineMedia key={line.id} line={line} fallbackName={line.name} />)}</div><div className="total"><small>{copy.total}</small><strong>{money(cartTotal)}</strong></div><button type="button" onClick={() => setCartOpen(true)}>{copy.cart} →</button></section> : null}
    {cartOpen ? <div className="cartOverlay" onClick={() => setCartOpen(false)}><aside className="cartPanel" onClick={(event) => event.stopPropagation()}><header><h2>{copy.cart}</h2><button type="button" onClick={() => setCartOpen(false)}>×</button></header><div className="orderTypeBox"><small>{copy.orderType}</small><div><button type="button" className={orderType === 'pickup' ? 'active' : ''} disabled={restaurant.pickup_enabled === false} onClick={() => setOrderType('pickup')}>{copy.pickup}</button><button type="button" className={orderType === 'delivery' ? 'active' : ''} disabled={!restaurant.delivery_enabled} onClick={() => setOrderType('delivery')}>{copy.delivery}</button></div></div>{!cart.length ? <p className="empty">{copy.empty}</p> : null}{cart.map((line) => <div className="cartLine" key={line.id}><CartLineMedia line={line} fallbackName={line.name} /><div className="cartLineBody"><div className="cartLineTop"><h4>{line.name}</h4><button className="removeLine" type="button" onClick={() => removeCartLine(line.id)}>{copy.remove}</button></div>{line.selections.map((selection, index) => <p key={index}>{selection.groupName}: {selection.choiceNames.join(', ')}</p>)}<div className="cartEditRow"><div className="cartQty"><button type="button" onClick={() => updateCartQty(line.id, line.quantity - 1)}>−</button><span>{line.quantity}</span><button type="button" onClick={() => updateCartQty(line.id, line.quantity + 1)}>+</button></div><strong>{money(line.total)}</strong></div></div></div>)}<div className="promoApply"><div><input value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder={copy.promoCode} /><button type="button" onClick={() => applyPromoByCode()}>{copy.apply}</button></div>{promoMessage ? <p>{promoMessage}</p> : null}</div><div className="cartTotals"><div><span>{copy.subtotal}</span><b>{money(cartSubtotal)}</b></div>{deliveryFee > 0 ? <div><span>{copy.deliveryFee}</span><b>{money(deliveryFee)}</b></div> : null}{promoDiscount > 0 ? <div className="discountLine"><span>{copy.discount}</span><b>-{money(promoDiscount)}</b></div> : null}<div className="grandTotal"><span>{copy.total}</span><b>{money(cartTotal)}</b></div></div><button type="button" className="addBtn" onClick={checkout} disabled={!cart.length || checkingOut}>{checkingOut ? copy.working : `${copy.checkout} • ${money(cartTotal)}`}</button></aside></div> : null}
    <style jsx global>{styles}</style>
  </main>;
}

const styles = `
html,body{margin:0;padding:0;width:100%;max-width:100vw;overflow-x:hidden}*{box-sizing:border-box}button{font:inherit}.page{--accent:#d8bf91;--accentText:#16110b;--accentGlow:rgba(216,191,145,.28);--accentSoft:rgba(216,191,145,.18);--accentSofter:rgba(216,191,145,.08);min-height:100vh;width:100%;max-width:100vw;overflow-x:hidden;background:#080807;color:#f7f1e6;font-family:Inter,system-ui,sans-serif;padding-bottom:118px}.page.accent-silver{--accent:#cbd5e1;--accentText:#111827;--accentGlow:rgba(148,163,184,.32);--accentSoft:rgba(148,163,184,.22);--accentSofter:rgba(148,163,184,.09)}.page.accent-gold{--accent:#d8bf91;--accentText:#16110b;--accentGlow:rgba(216,191,145,.28);--accentSoft:rgba(216,191,145,.18);--accentSofter:rgba(216,191,145,.08)}.page.accent-orange{--accent:#f97316;--accentText:#fff;--accentGlow:rgba(249,115,22,.32);--accentSoft:rgba(249,115,22,.22);--accentSofter:rgba(249,115,22,.09)}.page.accent-red{--accent:#dc2626;--accentText:#fff;--accentGlow:rgba(220,38,38,.32);--accentSoft:rgba(220,38,38,.22);--accentSofter:rgba(220,38,38,.09)}.page.accent-blue{--accent:#2563eb;--accentText:#fff;--accentGlow:rgba(37,99,235,.32);--accentSoft:rgba(37,99,235,.22);--accentSofter:rgba(37,99,235,.09)}.page.accent-purple{--accent:#7c3aed;--accentText:#fff;--accentGlow:rgba(124,58,237,.32);--accentSoft:rgba(124,58,237,.22);--accentSofter:rgba(124,58,237,.09)}.page.accent-lime{--accent:#84cc16;--accentText:#111;--accentGlow:rgba(132,204,22,.34);--accentSoft:rgba(132,204,22,.24);--accentSofter:rgba(132,204,22,.1)}.page.accent-pink{--accent:#ec4899;--accentText:#fff;--accentGlow:rgba(236,72,153,.34);--accentSoft:rgba(236,72,153,.24);--accentSofter:rgba(236,72,153,.1)}.page.accent-mono{--accent:#111827;--accentText:#fff;--accentGlow:rgba(17,24,39,.28);--accentSoft:rgba(17,24,39,.22);--accentSofter:rgba(17,24,39,.09)}.loader{min-height:100vh;display:grid;place-items:center;font-weight:900}.page.light{background:#f5efe2;color:#171411}.page.light .topNotice{background:rgba(255,251,242,.94);color:#171411;border-bottom:1px solid #dfd3bb}.page.light .topNotice button{color:#171411}.page.light .categories,.page.light .itemCard,.page.light .sideBox,.page.light .stickyCart,.page.light .cartPanel,.page.light .modal,.page.light .storeInfoBelowHero,.page.light .noItems{background:#fffaf0;color:#171411;border-color:#dfd3bb}.page.light .itemCopy p,.page.light .modalBody p{color:#4a4034}.page.light .choice{background:#fff6e4;color:#171411;border-color:#dfd3bb}.page.light .choice.active{background:#f7ebd0;border-color:var(--accent)}.page.light .priceBox{background:#fff6e4;border-color:#dfd3bb}.topNotice{height:64px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 clamp(14px,3vw,34px);background:rgba(8,8,7,.92);backdrop-filter:blur(18px);border-bottom:1px solid var(--accentSoft);position:sticky;top:0;z-index:30}.topNotice span{font-weight:950;white-space:nowrap;color:var(--accent);letter-spacing:.16em}.topNotice nav{display:flex;gap:28px}.topNotice nav button{font-weight:850;color:#f7f1e6;background:transparent;border:0;cursor:pointer}.topNotice nav button:hover{color:var(--accent)}.language{display:flex;justify-content:flex-end;align-items:center;gap:8px}.language button{height:40px;padding:0 16px;border-radius:12px;background:#171715;color:#f7f1e6;border:1px solid var(--accentSoft);font-weight:900;cursor:pointer}.language .on{background:var(--accent);color:var(--accentText);border-color:var(--accent);box-shadow:0 10px 22px var(--accentGlow)}.cartBtn{position:relative}.cartBtn b{position:absolute;right:-8px;top:-8px;background:var(--accent);color:var(--accentText);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px}.hero{height:clamp(520px,62vw,780px);width:100%;position:relative;overflow:hidden;background:#000}.heroMedia{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(1.08) contrast(1.1)}.heroShade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.86),rgba(0,0,0,.38),rgba(0,0,0,.54)),linear-gradient(0deg,rgba(8,8,7,1),rgba(8,8,7,.08) 46%,rgba(8,8,7,.28))}.page.light .heroShade{background:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.30),rgba(0,0,0,.50)),linear-gradient(0deg,rgba(245,239,226,1),rgba(0,0,0,.06) 50%,rgba(0,0,0,.25))}.heroContent{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:flex-start;padding:clamp(26px,6vw,78px)}.heroLockup{max-width:940px;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:clamp(14px,2.8vw,28px);padding-top:18px;color:#fff}.heroLogo,.brandFallback{width:clamp(78px,10vw,132px);height:clamp(78px,10vw,132px);border-radius:28px;object-fit:cover;background:var(--accent);color:var(--accentText);display:grid;place-items:center;font-weight:1000;box-shadow:0 18px 50px rgba(0,0,0,.48),0 0 0 5px var(--accentSoft);border:3px solid rgba(255,255,255,.76);flex:0 0 auto}.heroText small{display:block;margin-bottom:6px;color:var(--accent);font-size:clamp(12px,1.4vw,18px);font-weight:1000;letter-spacing:.26em;text-shadow:0 8px 24px rgba(0,0,0,.85)}.heroText h1{margin:0;color:#fff;font-size:clamp(46px,8vw,118px);line-height:.82;font-weight:1000;letter-spacing:-.08em;text-transform:uppercase;text-shadow:0 4px 0 rgba(0,0,0,.18),0 12px 46px rgba(0,0,0,.9)}.heroText p{margin:14px 0 0;max-width:690px;color:#fff;font-size:clamp(19px,2.7vw,36px);font-weight:1000;letter-spacing:-.03em;line-height:1.05;text-shadow:0 8px 28px rgba(0,0,0,.78)}.storeInfoBelowHero{width:min(100% - 40px,1400px);margin:-38px auto 0;background:rgba(14,14,12,.96);border:1px solid var(--accentSoft);border-radius:28px;padding:24px;color:#f7f1e6;position:relative;z-index:5;box-shadow:0 24px 80px rgba(0,0,0,.35)}.infoLines{display:grid;gap:8px}.infoLines p{margin:0;font-size:17px;font-weight:850}.openLine{display:flex;align-items:center;gap:9px}.openLine span{width:17px;height:17px;border-radius:999px;display:inline-block}.openLine.isOpen span{background:#79d45c}.openLine.isClosed span{background:#ef4444}.openLine em{font-style:normal;opacity:.65}.serviceActions{display:flex;gap:12px;margin-top:22px;align-items:center;flex-wrap:wrap}.serviceActions button{height:56px;padding:0 30px;border-radius:14px;border:1px solid var(--accentSoft);background:#191916;color:#f7f1e6;font-weight:1000}.serviceActions button.activeService{background:var(--accent);color:var(--accentText);border-color:var(--accent);box-shadow:0 12px 30px var(--accentGlow)}.serviceActions small{font-weight:900;color:inherit}.socialStrip{margin-top:20px;padding-top:18px;border-top:1px solid var(--accentSoft);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.socialStrip>strong{font-weight:1000;color:var(--accent);letter-spacing:.08em;text-transform:uppercase}.socialStrip>div,.sideSocialGrid{display:flex;gap:10px;flex-wrap:wrap}.socialLink{height:46px;display:inline-flex;align-items:center;gap:9px;border-radius:999px;padding:0 14px;text-decoration:none;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);font-weight:1000}.socialLink span{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:1000}.socialLink.instagram span{background:radial-gradient(circle at 30% 107%,#fdf497 0,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285aeb 90%)}.socialLink.facebook span{background:#1877f2;font-size:20px;font-family:Arial,sans-serif}.socialLink.tiktok span{background:#000;text-shadow:2px 0 #25f4ee,-2px 0 #fe2c55}.socialLink.youtube span{background:#ff0000}.videoShopSection{max-width:1460px;margin:26px auto 0;padding:0 20px}.sectionHeader{display:flex;align-items:end;justify-content:space-between;margin-bottom:12px}.sectionHeader small{color:var(--accent);font-weight:1000;letter-spacing:.18em}.sectionHeader h2{margin:0;font-size:34px;letter-spacing:-.05em}.videoRail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.videoCard{position:relative;min-height:260px;border:1px solid var(--accentSoft);border-radius:22px;overflow:hidden;background:#111;color:#fff;text-align:left;padding:0;box-shadow:0 18px 45px rgba(0,0,0,.22)}.videoCard video,.videoCard img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.videoCard:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.86),rgba(0,0,0,.18))}.videoCard span,.videoCard strong,.videoCard b{position:absolute;z-index:2}.videoCard span{top:14px;right:14px;width:46px;height:46px;border-radius:999px;background:var(--accent);color:var(--accentText);display:grid;place-items:center;font-weight:1000}.videoCard strong{left:16px;bottom:46px;font-size:20px;line-height:1.05}.videoCard b{left:16px;bottom:18px;color:var(--accent);font-size:19px}.layout{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:24px;padding:0 20px 40px;max-width:1460px;margin:26px auto 0;width:100%}.mainCol{min-width:0;width:100%}.sideCol{padding-top:20px;width:100%;max-width:390px;min-width:0}.categories{display:flex;overflow-x:auto;background:#10100e;border:1px solid var(--accentSoft);border-radius:18px;padding:10px;position:sticky;top:74px;z-index:20;max-width:100%;scrollbar-width:none}.categories::-webkit-scrollbar{display:none}.categories button{flex:0 0 auto;height:54px;padding:0 24px;background:transparent;color:inherit;border:0;border-right:1px solid var(--accentSoft);font-weight:1000;text-transform:uppercase;white-space:nowrap;cursor:pointer}.categories .active{color:var(--accent);border-bottom:4px solid var(--accent)}.sectionTitle{font-size:34px;margin:28px 0 16px;text-transform:uppercase;letter-spacing:-.04em}.menuGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;width:100%;align-items:start}.itemCard{text-align:left;padding:0;background:#11110f;color:inherit;border:1px solid var(--accentSoft);border-radius:20px;overflow:hidden;cursor:pointer;min-width:0;transition:.18s ease}.itemCard:hover{transform:translateY(-3px);border-color:var(--accent);box-shadow:0 20px 50px rgba(0,0,0,.28),0 0 0 1px var(--accentSoft)}.videoItemCard{border-color:rgba(239,68,68,.38)}.imageBox{height:190px;position:relative;background:#111;overflow:hidden}.imageBox img,.imageBox video{width:100%;height:100%;object-fit:cover}.videoCoverBox{position:absolute;inset:0;background:#111;overflow:hidden}.videoCoverBox img,.videoCoverBox video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.1) contrast(1.05)}.videoCoverShade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.44),rgba(0,0,0,.02) 55%,rgba(0,0,0,.28))}.videoCoverBadge,.videoPill{position:absolute;left:10px;top:10px;background:rgba(0,0,0,.72);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:7px 10px;font-size:12px;font-weight:1000;z-index:2}.missingImage{width:100%;height:100%;background:linear-gradient(135deg,#1b1b1b,#050505)}.imageBox em{position:absolute;top:10px;right:10px;background:#000;padding:6px 10px;border-radius:20px;font-style:normal}.itemCopy{padding:16px}.itemCopy h4{font-size:21px;line-height:1.05;margin:0;text-transform:uppercase}.itemCopy p{font-size:14px;line-height:1.35;color:#c8bfae;min-height:50px}.itemPrice{display:block;color:var(--accent);font-size:25px;margin:8px 0;font-weight:1000}.itemCopy span{display:block;color:var(--accent);font-weight:900}.noItems{grid-column:1/-1;min-height:220px;border:1px dashed var(--accentSoft);border-radius:18px;background:#11110f;color:#fff;display:grid;place-items:center;text-align:center;padding:30px}.sideBox{background:#11110f;border:1px solid var(--accentSoft);border-radius:20px;margin-bottom:14px;padding:18px;overflow:hidden}.sideBox h3{font-size:20px;margin:0 0 14px;text-transform:uppercase}.sideBox p{margin:8px 0}.sideBox iframe{width:100%;height:210px;border:0;border-radius:14px;filter:grayscale(.45)}.goldFull{display:block;text-align:center;background:var(--accent);color:var(--accentText);text-decoration:none;font-weight:1000;padding:14px;border-radius:14px;margin-top:12px;box-shadow:0 12px 30px var(--accentGlow)}.sidePromoVisual,.sideRewardVisual{position:relative;min-height:252px;border-radius:22px;overflow:hidden;margin-bottom:14px;border:1px solid var(--accentSoft);background:#071018;box-shadow:0 18px 55px rgba(0,0,0,.25)}.sidePromoVisual:before,.sideRewardVisual:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,8,12,.95),rgba(5,8,12,.82) 50%,rgba(5,8,12,.15)),radial-gradient(circle at 20% 20%,var(--accentGlow),transparent 35%);z-index:1}.sidePromoVisual img,.sidePromoVisual video,.sideRewardVisual img{position:absolute;right:-22px;top:18px;width:190px;height:190px;object-fit:cover;border-radius:999px;z-index:0;filter:saturate(1.12) contrast(1.08);box-shadow:0 20px 50px rgba(0,0,0,.55);background:#05070d}.sidePromoCopy,.sideRewardVisual>div{position:relative;z-index:2;padding:24px;max-width:255px}.sidePromoVisual small,.sideRewardVisual small{display:block;color:#fff;font-weight:1000;letter-spacing:.08em;opacity:.9}.sidePromoVisual h3,.sideRewardVisual h3{margin:10px 0 2px;color:#fff;font-size:50px;line-height:.9;font-weight:1000;letter-spacing:-.06em}.sideRewardVisual h3{color:var(--accent)}.sidePromoVisual strong,.sideRewardVisual strong{display:block;color:var(--accent);font-size:15px;font-weight:1000;text-transform:uppercase}.sidePromoVisual p,.sideRewardVisual p{margin:14px 0 16px;color:#f7f1e6;font-weight:800}.sidePromoVisual button,.sideRewardVisual button{height:48px;border:1px solid var(--accent);border-radius:12px;background:var(--accent);color:var(--accentText);font-weight:1000;padding:0 22px;cursor:pointer;box-shadow:0 12px 30px var(--accentGlow)}.sideRewardVisual button{background:transparent;color:var(--accent)}.hour{display:flex;justify-content:space-between;font-size:14px;margin:8px 0;gap:10px}.green{color:#79d45c!important}.red{color:#ef4444!important}.statusNow{font-weight:950}.modalBackdrop,.cartOverlay{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:80;display:flex;align-items:center;justify-content:center;padding:18px}.modal,.cartPanel{width:min(100%,720px);max-height:92vh;overflow:auto;background:#11110f;border:1px solid var(--accentSoft);border-radius:24px;position:relative}.close{position:absolute;right:16px;top:14px;background:#000;color:#fff;border:0;border-radius:50%;width:42px;height:42px;font-size:28px;z-index:2;cursor:pointer}.modalImg{width:100%;height:310px;object-fit:cover;background:#090909}.modalBody{padding:24px}.modalTop{display:grid;grid-template-columns:minmax(0,1fr) 170px;gap:20px;align-items:start}.modalBody h2{font-size:34px;margin:0}.modalBody p{color:#c8bfae}.priceBox{background:#171713;border:1px solid var(--accentSoft);border-radius:14px;padding:16px;text-align:right}.priceBox small{display:block;color:#a99f8e;font-weight:900;text-transform:uppercase;font-size:11px}.priceBox strong{display:block;color:var(--accent);font-size:24px;margin-bottom:12px}.priceBox b{display:block;color:var(--accent);font-size:32px}.optionGroup{margin-top:20px}.optionGroup header{display:flex;justify-content:space-between;align-items:center;gap:14px}.optionGroup h3{margin:0;text-transform:uppercase}.optionGroup span{color:var(--accent);font-weight:900}.choiceList{display:grid;gap:10px;margin-top:12px}.choice{display:grid;grid-template-columns:minmax(0,1fr) auto 26px;gap:12px;align-items:center;background:#171713;color:#f7f1e6;border:1px solid var(--accentSoft);border-radius:12px;padding:16px;text-align:left;cursor:pointer}.choice.active{border-color:var(--accent);background:var(--accentSofter)}.choice b{color:var(--accent)}.choice i{font-style:normal;color:var(--accent);font-weight:1000}.qtyRow{display:flex;justify-content:space-between;align-items:center;margin:26px 0}.qtyRow div{display:flex;align-items:center;gap:14px;background:#171713;border-radius:30px;padding:6px}.qtyRow button{width:38px;height:38px;border:0;border-radius:50%;background:#27241d;color:#f7f1e6;font-size:22px;cursor:pointer}.addBtn{width:100%;height:62px;border:0;border-radius:14px;background:var(--accent);color:var(--accentText);font-weight:1000;font-size:17px;cursor:pointer;box-shadow:0 12px 30px var(--accentGlow)}.addBtn:disabled{opacity:.4}.stickyCart{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);width:calc(100% - 24px);max-width:1100px;min-height:86px;background:rgba(247,241,230,.94);color:#171411;border:1px solid var(--accentSoft);border-radius:18px;z-index:50;display:grid;grid-template-columns:62px 140px minmax(0,1fr) 150px 240px;gap:16px;align-items:center;padding:12px 16px;backdrop-filter:blur(14px);box-shadow:0 20px 60px rgba(0,0,0,.3)}.cartLeft{position:relative;font-size:36px;color:#171411}.cartLeft b{position:absolute;top:-8px;right:2px;background:var(--accent);color:var(--accentText);border-radius:50%;font-size:14px;width:26px;height:26px;display:grid;place-items:center}.stickyCart strong{font-size:19px}.stickyCart p{margin:4px 0 0}.cartMini{display:flex;gap:10px;overflow:hidden;min-width:0}.cartMini img,.cartMini video{width:72px;height:54px;object-fit:cover;border-radius:10px;background:#111}.total small{display:block;color:#857b6c}.total strong{font-size:31px}.stickyCart>button{height:60px;border:0;border-radius:14px;background:var(--accent);color:var(--accentText);font-size:20px;font-weight:1000;cursor:pointer;box-shadow:0 12px 30px var(--accentGlow)}.cartPanel{padding:22px}.cartPanel header{display:flex;justify-content:space-between;align-items:center}.cartPanel header button{background:transparent;border:0;color:inherit;font-size:34px;cursor:pointer}.empty{color:#a99f8e}.orderTypeBox{background:rgba(255,255,255,.04);border:1px solid var(--accentSoft);border-radius:16px;padding:12px;margin-bottom:16px}.orderTypeBox small{display:block;color:#a99f8e;font-weight:1000;margin-bottom:8px}.orderTypeBox div{display:grid;grid-template-columns:1fr 1fr;gap:8px}.orderTypeBox button{height:46px;border:0;border-radius:12px;background:#1a1915;color:#f7f1e6;font-weight:1000;cursor:pointer}.orderTypeBox button.active{background:var(--accent);color:var(--accentText)}.orderTypeBox button:disabled{opacity:.35;cursor:not-allowed}.cartLine{display:grid;grid-template-columns:90px 1fr;gap:14px;border-bottom:1px solid var(--accentSoft);padding:14px 0}.cartLine img,.cartLine video,.cartLine>div:first-child{width:90px;height:76px;border-radius:10px;object-fit:cover;background:#111}.cartLineBody{min-width:0}.cartLineTop{display:flex;align-items:start;justify-content:space-between;gap:12px}.cartLine h4{margin:0}.cartLine p{margin:4px 0;color:#a99f8e;font-size:13px}.cartLine strong{color:var(--accent)}.removeLine{border:0;background:#fff1f1;color:#991b1b;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:1000;cursor:pointer}.cartEditRow{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px}.cartQty{display:flex;align-items:center;gap:10px;background:var(--accentSofter);border-radius:999px;padding:5px}.cartQty button{width:28px;height:28px;border:0;border-radius:999px;background:var(--accent);color:var(--accentText);font-weight:1000;cursor:pointer}.cartQty span{min-width:22px;text-align:center;font-weight:1000}.promoApply{margin:16px 0;background:var(--accentSofter);border:1px solid var(--accentSoft);border-radius:16px;padding:12px}.promoApply div{display:grid;grid-template-columns:1fr 100px;gap:8px}.promoApply input{height:46px;border:0;border-radius:12px;padding:0 14px;font-weight:900}.promoApply button{border:0;border-radius:12px;background:var(--accent);color:var(--accentText);font-weight:1000}.promoApply p{margin:8px 0 0;color:var(--accent);font-weight:900}.cartTotals{border-top:1px solid var(--accentSoft);margin-top:16px;padding-top:14px;display:grid;gap:8px}.cartTotals div{display:flex;justify-content:space-between;align-items:center}.cartTotals span{color:#a99f8e;font-weight:900}.cartTotals b{font-size:18px}.discountLine b,.discountLine span{color:#79d45c}.grandTotal{border-top:1px solid var(--accentSoft);padding-top:12px;margin-top:4px}.grandTotal b{font-size:30px;color:var(--accent)}@media(max-width:1180px){.layout{grid-template-columns:1fr;padding:0 16px 40px}.sideCol{max-width:100%;padding-top:0}.menuGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.stickyCart{grid-template-columns:54px 1fr 140px 210px}.cartMini{display:none}.topNotice{grid-template-columns:1fr auto}.topNotice nav{display:none}.sidePromoVisual,.sideRewardVisual{min-height:230px}.sidePromoVisual img,.sideRewardVisual img{right:20px}.videoRail{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:720px){.topNotice{height:56px;padding:0 12px}.topNotice span{font-size:11px}.language button:not(.cartBtn){padding:0 10px}.hero{height:520px}.heroContent{align-items:flex-start;justify-content:flex-start;padding:22px 18px}.heroLockup{grid-template-columns:auto 1fr;gap:12px;width:100%;padding-top:4px}.heroLogo,.brandFallback{width:74px;height:74px;border-radius:18px}.heroText small{font-size:10px;letter-spacing:.18em;margin-bottom:5px}.heroText h1{font-size:43px;line-height:.88}.heroText p{font-size:20px;margin-top:8px;line-height:1.08}.storeInfoBelowHero{width:calc(100% - 24px);padding:18px;border-radius:18px;margin-top:-28px}.infoLines p{font-size:14px}.serviceActions button{height:50px;padding:0 17px}.socialStrip{display:grid}.socialStrip>div{display:grid;grid-template-columns:1fr 1fr}.socialLink{justify-content:center}.categories{top:56px}.categories button{height:50px;padding:0 18px}.sectionTitle{font-size:26px}.menuGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.imageBox{height:112px}.itemCopy{padding:10px}.itemCopy h4{font-size:13px}.itemCopy p{font-size:11px;min-height:38px}.itemPrice{font-size:17px}.itemCopy span{font-size:11px}.modalBackdrop{align-items:flex-end;padding:0}.modal{border-radius:22px 22px 0 0;max-height:94vh}.modalImg{height:210px}.modalTop{grid-template-columns:1fr}.priceBox{text-align:left}.stickyCart{bottom:8px;width:calc(100% - 12px);grid-template-columns:44px 1fr 118px;min-height:74px;padding:10px}.stickyCart .total{display:none}.stickyCart strong{font-size:16px}.stickyCart p{font-size:12px}.stickyCart>button{height:52px;font-size:14px}.cartLine{grid-template-columns:72px 1fr}.cartLine img,.cartLine video,.cartLine>div:first-child{width:72px;height:66px}.sidePromoVisual h3,.sideRewardVisual h3{font-size:42px}.sidePromoVisual img,.sideRewardVisual img{width:160px;height:160px;right:-20px}.videoRail{display:flex;overflow-x:auto;padding-bottom:8px}.videoCard{flex:0 0 260px;min-height:330px}.sectionHeader h2{font-size:28px}}@media(max-width:420px){.menuGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.imageBox{height:155px}.heroText h1{font-size:38px}.heroText p{font-size:18px}.sidePromoVisual img,.sideRewardVisual img{opacity:.5}.sidePromoCopy,.sideRewardVisual>div{max-width:100%}}

.reviewSection{position:relative!important;z-index:8!important;width:min(1120px,calc(100% - 36px))!important;margin:42px auto 36px!important;padding:30px!important;border-radius:34px!important;background:radial-gradient(circle at 14% 8%,var(--accentSoft),transparent 32%),linear-gradient(135deg,rgba(18,24,38,.98),rgba(3,7,18,.98))!important;border:1px solid var(--border)!important;box-shadow:0 22px 70px rgba(0,0,0,.38)!important;color:#fff!important;display:block!important;clear:both!important}.reviewShell{display:grid!important;grid-template-columns:76px minmax(0,1fr) auto!important;gap:20px!important;align-items:center!important}.reviewIconBubble{width:72px!important;height:72px!important;border-radius:22px!important;display:grid!important;place-items:center!important;background:var(--accent)!important;color:var(--accentText)!important;font-size:34px!important;box-shadow:0 18px 38px var(--accentGlow)!important}.reviewCopy small,.reviewModalHead small{display:block!important;color:var(--accent)!important;font-size:12px!important;font-weight:950!important;letter-spacing:.18em!important;text-transform:uppercase!important}.reviewCopy h2,.reviewModalHead h2{margin:8px 0 0!important;color:#fff!important;font-size:clamp(28px,4vw,46px)!important;line-height:.98!important;font-weight:950!important;letter-spacing:-.055em!important}.reviewCopy p,.reviewModalHead p{margin:12px 0 0!important;color:rgba(255,255,255,.78)!important;font-size:16px!important;line-height:1.55!important;max-width:640px!important}.reviewActions{display:flex!important;gap:12px!important;flex-wrap:wrap!important;justify-content:flex-end!important}.reviewPrimary,.reviewSecondary{appearance:none!important;min-height:56px!important;border-radius:999px!important;padding:0 24px!important;font-size:15px!important;font-weight:950!important;cursor:pointer!important;text-decoration:none!important;opacity:1!important;visibility:visible!important}.reviewPrimary{border:1px solid transparent!important;background:var(--accent)!important;color:var(--accentText)!important;box-shadow:0 18px 40px var(--accentGlow)!important}.reviewSecondary{border:1px solid rgba(255,255,255,.22)!important;background:rgba(255,255,255,.1)!important;color:#fff!important}.reviewPreviewRail{margin-top:24px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important}.reviewPreviewCard{appearance:none!important;text-align:left!important;border:1px solid rgba(255,255,255,.12)!important;background:rgba(255,255,255,.08)!important;border-radius:24px!important;overflow:hidden!important;color:#fff!important;display:grid!important;grid-template-columns:122px 1fr!important;min-height:122px!important;cursor:pointer!important;padding:0!important}.reviewPreviewCard video,.reviewPreviewCard img{width:122px!important;height:122px!important;object-fit:cover!important;background:#05070a!important;display:block!important}.reviewPreviewCard div:last-child{padding:14px!important}.reviewPreviewCard strong{display:block!important;color:var(--accent)!important;letter-spacing:.04em!important}.reviewPreviewCard b{display:block!important;margin-top:5px!important;font-size:15px!important;color:#fff!important}.reviewPreviewCard p{margin:6px 0 0!important;color:rgba(255,255,255,.72)!important;font-size:13px!important;line-height:1.35!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}.reviewEmptyPreview{appearance:none!important;width:100%!important;margin-top:22px!important;min-height:98px!important;border:1px dashed rgba(255,255,255,.24)!important;border-radius:24px!important;display:flex!important;align-items:center!important;gap:16px!important;text-align:left!important;padding:20px!important;background:rgba(255,255,255,.07)!important;color:#fff!important;cursor:pointer!important}.reviewEmptyPreview span{font-size:38px!important}.reviewEmptyPreview strong{display:block!important;font-size:18px!important;color:#fff!important}.reviewEmptyPreview b{display:block!important;margin-top:4px!important;color:var(--accent)!important;font-size:13px!important}.reviewBackdrop{z-index:1000!important}.reviewModal{position:relative!important;width:min(1120px,calc(100vw - 24px))!important;max-height:92vh!important;overflow:auto!important;border-radius:32px!important;background:#070b12!important;color:#fff!important;border:1px solid rgba(255,255,255,.12)!important;box-shadow:0 30px 120px rgba(0,0,0,.62)!important}.reviewModalHead{padding:28px 76px 18px 28px!important}.reviewModalGrid{display:grid!important;grid-template-columns:minmax(0,1fr) 360px!important;gap:18px!important;padding:0 24px 24px!important}.reviewList{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important;align-content:start!important}.reviewCard{overflow:hidden!important;border-radius:24px!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.1)!important}.reviewCard video,.reviewCard img{width:100%!important;aspect-ratio:4/5!important;object-fit:cover!important;background:#020617!important;display:block!important}.reviewCardBody{padding:16px!important}.reviewStars{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;color:var(--accent)!important;font-size:14px!important;font-weight:950!important}.reviewStars span{color:rgba(255,255,255,.7)!important;font-size:11px!important;text-transform:uppercase!important;letter-spacing:.1em!important}.reviewCard h3{margin:9px 0 0!important;font-size:18px!important;line-height:1.15!important;color:#fff!important}.reviewCard p{margin:8px 0 0!important;color:rgba(255,255,255,.82)!important;font-size:14px!important;line-height:1.5!important}.reviewCard small{display:block!important;margin-top:10px!important;color:rgba(255,255,255,.48)!important}.reviewForm{position:sticky!important;top:0!important;align-self:start!important;border-radius:24px!important;padding:20px!important;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.06))!important;border:1px solid rgba(255,255,255,.12)!important}.reviewForm h3{margin:0!important;font-size:22px!important;letter-spacing:-.03em!important;color:#fff!important}.reviewForm p{margin:8px 0 14px!important;color:rgba(255,255,255,.72)!important;line-height:1.45!important}.reviewForm label{display:grid!important;gap:7px!important;color:rgba(255,255,255,.8)!important;font-size:13px!important;font-weight:800!important;margin-top:12px!important}.reviewForm input,.reviewForm select,.reviewForm textarea{width:100%!important;border-radius:14px!important;border:1px solid rgba(255,255,255,.14)!important;background:rgba(0,0,0,.28)!important;color:#fff!important;padding:12px 13px!important;outline:none!important}.reviewForm textarea{min-height:116px!important;resize:vertical!important}.reviewPicked,.reviewMessage{margin-top:12px!important;color:rgba(255,255,255,.8)!important;font-size:13px!important;line-height:1.4!important}.reviewNoMedia{display:grid!important;place-items:center!important;background:rgba(255,255,255,.08)!important;color:var(--accent)!important;font-size:28px!important;font-weight:950!important}.reviewNoMedia.big,.reviewNoReviews{min-height:240px!important}.reviewNoReviews{grid-column:1/-1!important;border-radius:24px!important;background:rgba(255,255,255,.07)!important;border:1px dashed rgba(255,255,255,.15)!important;display:grid!important;place-items:center!important;text-align:center!important;padding:30px!important}.reviewNoReviews span{font-size:44px!important}.reviewNoReviews strong{font-size:24px!important;color:#fff!important}.reviewNoReviews p{margin:0!important;color:rgba(255,255,255,.72)!important}@media(max-width:980px){.reviewShell{grid-template-columns:1fr!important}.reviewActions{width:100%!important;justify-content:flex-start!important}.reviewPreviewRail{grid-template-columns:1fr!important}.reviewModalGrid{grid-template-columns:1fr!important}.reviewForm{position:relative!important}.reviewList{grid-template-columns:1fr!important}}@media(max-width:640px){.reviewSection{width:calc(100% - 22px)!important;margin:26px auto 24px!important;padding:20px!important;border-radius:26px!important}.reviewActions{display:grid!important;grid-template-columns:1fr!important;width:100%!important}.reviewPrimary,.reviewSecondary{width:100%!important}.reviewModal{width:calc(100vw - 16px)!important;border-radius:24px!important}.reviewModalHead{padding:24px 58px 14px 18px!important}.reviewModalGrid{padding:0 14px 14px!important}.reviewCopy h2,.reviewModalHead h2{font-size:30px!important}.reviewPreviewCard{grid-template-columns:96px 1fr!important}.reviewPreviewCard video,.reviewPreviewCard img{width:96px!important;height:112px!important}}


.reviewForm label span{color:rgba(255,255,255,.55)!important;font-weight:750!important}.reviewModeTabs{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin:14px 0!important}.reviewModeTabs button{min-height:44px!important;border-radius:14px!important;border:1px solid rgba(255,255,255,.14)!important;background:rgba(0,0,0,.24)!important;color:#fff!important;font-weight:950!important;cursor:pointer!important}.reviewModeTabs button.active{background:var(--accent)!important;color:var(--accentText)!important;border-color:transparent!important;box-shadow:0 12px 30px var(--accentGlow)!important}.liveReviewBox{border:1px solid rgba(255,255,255,.14)!important;border-radius:20px!important;background:rgba(0,0,0,.25)!important;padding:12px!important;margin:12px 0!important}.livePreview{width:100%!important;aspect-ratio:4/5!important;max-height:300px!important;border-radius:16px!important;background:#020617!important;object-fit:cover!important;display:block!important}.liveButtons{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;margin-top:10px!important}.liveButtons button{min-height:42px!important;border-radius:12px!important;border:1px solid rgba(255,255,255,.14)!important;background:rgba(255,255,255,.1)!important;color:#fff!important;font-weight:950!important;cursor:pointer!important}.liveButtons button.danger{background:#ef4444!important;color:#fff!important}.liveReviewBox small{display:block!important;margin-top:9px!important;color:rgba(255,255,255,.65)!important;line-height:1.35!important}.reviewSocialGrid{display:grid!important;grid-template-columns:1fr!important;gap:0!important}.reviewSocials{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:8px!important}.reviewSocials span{display:inline-flex!important;align-items:center!important;border-radius:999px!important;background:rgba(255,255,255,.09)!important;border:1px solid rgba(255,255,255,.12)!important;color:rgba(255,255,255,.78)!important;font-size:11px!important;font-weight:850!important;padding:5px 8px!important}


.reviewShareBox{margin-top:14px!important;border:1px solid rgba(255,255,255,.14)!important;background:rgba(255,255,255,.07)!important;border-radius:18px!important;padding:14px!important}.reviewShareBox strong{display:block!important;color:#fff!important;font-size:14px!important}.reviewShareBox p{margin:5px 0 10px!important;color:rgba(255,255,255,.66)!important;font-size:12px!important;line-height:1.35!important}.reviewShareBox div{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:7px!important}.reviewShareBox button{min-height:38px!important;border-radius:12px!important;border:1px solid rgba(255,255,255,.14)!important;background:rgba(0,0,0,.28)!important;color:#fff!important;font-size:12px!important;font-weight:950!important;cursor:pointer!important}@media(max-width:640px){.reviewShareBox div{grid-template-columns:1fr!important}}


.reviewShareBox .shareAllBtn{width:100%!important;min-height:46px!important;border-radius:14px!important;border:1px solid transparent!important;background:var(--accent)!important;color:var(--accentText)!important;font-size:14px!important;font-weight:950!important;cursor:pointer!important;box-shadow:0 12px 28px var(--accentGlow)!important}


.reviewStoreLinkBadge{margin:12px 0!important;padding:12px 13px!important;border-radius:16px!important;background:rgba(183,255,0,.12)!important;border:1px solid rgba(183,255,0,.32)!important}.reviewStoreLinkBadge span{display:block!important;color:var(--accent)!important;font-size:11px!important;font-weight:950!important;text-transform:uppercase!important;letter-spacing:.09em!important}.reviewStoreLinkBadge strong{display:block!important;margin-top:5px!important;color:#fff!important;font-size:12px!important;line-height:1.35!important;word-break:break-all!important}.reviewStoreLinkBadge small{display:block!important;margin-top:5px!important;color:rgba(255,255,255,.68)!important;font-size:11px!important;line-height:1.3!important}





/* DESKTOP REVIEW POSITION FIX */
@media(min-width:981px){
  .layout{display:grid!important;grid-template-columns:minmax(0,1fr) 330px!important;align-items:start!important;gap:26px!important}
  .mainCol{grid-column:1!important;grid-row:1!important;width:100%!important}
  .reviewSection{grid-column:1!important;grid-row:2!important;width:100%!important;margin:28px 0 110px!important;align-self:start!important}
  .sideCol{grid-column:2!important;grid-row:1 / span 2!important;width:100%!important;display:flex!important;flex-direction:column!important}
  .sideCol #hours{order:99!important}
}
@media(max-width:980px){
  .layout{display:flex!important;flex-direction:column!important}
  .mainCol{order:1!important;width:100%!important}
  .reviewSection{order:2!important;width:100%!important;margin:26px 0 24px!important}
  .sideCol{order:3!important;width:100%!important;display:flex!important;flex-direction:column!important}
  .sideCol #hours{order:99!important;margin-top:22px!important}
}
@media(max-width:640px){
  .reviewSection{margin:22px 0 24px!important}
}


/* SUGGESTED STORE SHARE OVERLAY */
.sharePreviewFrame{position:relative!important;width:100%!important}
.suggestedStoreOverlay{position:absolute!important;top:14px!important;left:50%!important;transform:translateX(-50%)!important;z-index:8!important;width:min(88%,360px)!important;min-height:58px!important;padding:10px 14px!important;border-radius:999px!important;background:rgba(10,15,20,.78)!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:0 14px 36px rgba(0,0,0,.35),0 0 0 1px rgba(183,255,0,.12)!important;color:#fff!important;text-decoration:none!important;display:grid!important;grid-template-columns:1fr auto!important;gap:2px 12px!important;align-items:center!important;backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important}
.suggestedStoreOverlay span{grid-column:1!important;color:#b7ff00!important;font-size:11px!important;font-weight:950!important;text-transform:uppercase!important;letter-spacing:.12em!important}
.suggestedStoreOverlay b{grid-column:1!important;color:#fff!important;font-size:16px!important;line-height:1!important;font-weight:1000!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.suggestedStoreOverlay em{grid-column:2!important;grid-row:1 / span 2!important;font-style:normal!important;color:#fff!important;background:rgba(255,255,255,.12)!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:999px!important;padding:8px 10px!important;font-size:12px!important;font-weight:950!important;white-space:nowrap!important}
.clickableStoreBadge{display:block!important;text-decoration:none!important;cursor:pointer!important}
.clickableStoreBadge strong{font-size:15px!important}
.clickableStoreBadge small{word-break:break-all!important}


.clickableStoreBadge em{display:block!important;margin-top:6px!important;color:#b7ff00!important;font-size:11px!important;font-style:normal!important;font-weight:900!important;line-height:1.25!important}


/* ORDA DISCOVER + CLICKABLE SHOP OVERLAY FIX */
.discoverBtn{min-height:42px!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:999px!important;padding:0 16px!important;background:var(--accent)!important;color:var(--accentText)!important;font-size:13px!important;font-weight:950!important;box-shadow:0 12px 28px var(--accentGlow)!important;white-space:nowrap!important}
.sharePreviewFrame{position:relative!important;width:100%!important}
.forceShopOverlay{position:absolute!important;top:14px!important;left:50%!important;transform:translateX(-50%)!important;z-index:999999!important;width:min(88%,360px)!important;min-height:60px!important;padding:9px 12px!important;border-radius:999px!important;background:rgba(18,24,30,.82)!important;border:2px solid rgba(183,255,0,.75)!important;box-shadow:0 0 0 1px rgba(255,255,255,.16),0 0 22px rgba(183,255,0,.55),0 16px 38px rgba(0,0,0,.45)!important;color:#fff!important;text-decoration:none!important;display:grid!important;grid-template-columns:46px 1fr 28px!important;grid-template-rows:auto auto!important;gap:1px 10px!important;align-items:center!important;pointer-events:auto!important;cursor:pointer!important;backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important}
.forceShopOverlay:before{content:'🏪'!important;grid-column:1!important;grid-row:1 / span 2!important;width:44px!important;height:44px!important;border-radius:999px!important;background:#b7ff00!important;color:#111827!important;display:grid!important;place-items:center!important;font-size:22px!important;box-shadow:0 8px 20px rgba(183,255,0,.38)!important}
.forceShopOverlay span{grid-column:2!important;grid-row:1!important;color:#fff!important;font-size:16px!important;font-weight:1000!important;line-height:1!important;letter-spacing:-.02em!important;text-transform:none!important}
.forceShopOverlay b{grid-column:2!important;grid-row:2!important;color:rgba(255,255,255,.76)!important;font-size:13px!important;font-weight:850!important;line-height:1.1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.forceShopOverlay em{grid-column:3!important;grid-row:1 / span 2!important;font-style:normal!important;color:#fff!important;font-size:32px!important;font-weight:500!important;line-height:1!important;background:transparent!important;border:0!important;padding:0!important}
.forceShopBadge{display:block!important;text-decoration:none!important;cursor:pointer!important;background:rgba(183,255,0,.12)!important;border:1px solid rgba(183,255,0,.32)!important}
.forceShopBadge span{display:block!important;color:#b7ff00!important;font-size:11px!important;font-weight:950!important;text-transform:uppercase!important;letter-spacing:.09em!important}
.forceShopBadge strong{display:block!important;margin-top:4px!important;color:#fff!important;font-size:15px!important}
.forceShopBadge small{display:block!important;margin-top:4px!important;color:rgba(255,255,255,.8)!important;word-break:break-all!important}
.forceShopBadge em{display:block!important;margin-top:6px!important;color:#b7ff00!important;font-size:11px!important;font-style:normal!important;font-weight:900!important;line-height:1.25!important}
@media(max-width:720px){.discoverBtn{padding:0 12px!important;font-size:12px!important}.forceShopOverlay{top:12px!important;width:min(86%,330px)!important}}


/* UPLOAD REVIEW SHOP BUTTON PREVIEW FIX */
.uploadReviewBox{display:grid!important;gap:12px!important;margin:12px 0!important}
.uploadPreviewFrame{position:relative!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:20px!important;background:rgba(0,0,0,.25)!important;padding:12px!important;overflow:hidden!important}
.uploadPreviewImage{width:100%!important;aspect-ratio:4/5!important;max-height:300px!important;border-radius:16px!important;background:#020617!important;object-fit:cover!important;display:block!important}
.uploadEmptyPreview{min-height:170px!important;border:1px dashed rgba(255,255,255,.18)!important;border-radius:20px!important;background:rgba(0,0,0,.22)!important;color:#fff!important;display:grid!important;place-items:center!important;text-align:center!important;padding:18px!important}
.uploadEmptyPreview span{font-size:34px!important}
.uploadEmptyPreview b{font-size:14px!important;line-height:1.35!important;color:rgba(255,255,255,.78)!important}


/* FINAL SHARE CONTROLS / CLICKABLE LINK SHARE FIX */
.shareButtonStack{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;margin-top:12px!important}
.shareButtonStack .shareAllBtn,.shareButtonStack .shareLinkBtn{width:100%!important;min-height:48px!important;border-radius:15px!important;font-size:14px!important;font-weight:1000!important;cursor:pointer!important}
.shareButtonStack .shareAllBtn{border:1px solid transparent!important;background:var(--accent)!important;color:var(--accentText)!important;box-shadow:0 12px 28px var(--accentGlow)!important}
.shareButtonStack .shareLinkBtn{border:1px solid rgba(183,255,0,.35)!important;background:rgba(183,255,0,.12)!important;color:#fff!important}
.uploadReviewBox{display:grid!important;gap:12px!important;margin:12px 0!important}
.uploadPreviewFrame{position:relative!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:20px!important;background:rgba(0,0,0,.25)!important;padding:12px!important;overflow:hidden!important}
.uploadPreviewImage{width:100%!important;aspect-ratio:4/5!important;max-height:300px!important;border-radius:16px!important;background:#020617!important;object-fit:cover!important;display:block!important}
.uploadEmptyPreview{min-height:170px!important;border:1px dashed rgba(255,255,255,.18)!important;border-radius:20px!important;background:rgba(0,0,0,.22)!important;color:#fff!important;display:grid!important;place-items:center!important;text-align:center!important;padding:18px!important}
.uploadEmptyPreview span{font-size:34px!important}
.uploadEmptyPreview b{font-size:14px!important;line-height:1.35!important;color:rgba(255,255,255,.78)!important}


/* RELIABLE 3 STEP SOCIAL SHARE FLOW */
.shareGuideCard{margin-top:14px!important;padding:14px!important;border-radius:18px!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.14)!important;color:#fff!important}
.shareGuideCard strong{display:block!important;font-size:17px!important;font-weight:1000!important;margin-bottom:8px!important}
.shareGuideCard ol{margin:0 0 12px 18px!important;padding:0!important;color:rgba(255,255,255,.82)!important;font-size:13px!important;line-height:1.45!important}
.shareGuideCard p{margin:10px 0 0!important;color:rgba(255,255,255,.66)!important;font-size:12px!important;line-height:1.35!important}
.shareButtonStack{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:12px!important}
.shareButtonStack button{min-height:48px!important;border-radius:15px!important;font-size:13px!important;font-weight:1000!important;cursor:pointer!important}
.shareButtonStack .shareAllBtn{grid-column:1 / -1!important;border:1px solid transparent!important;background:var(--accent)!important;color:var(--accentText)!important;box-shadow:0 12px 28px var(--accentGlow)!important}
.shareButtonStack .shareCopyBtn,.shareButtonStack .shareLinkBtn{border:1px solid rgba(183,255,0,.35)!important;background:rgba(183,255,0,.12)!important;color:#fff!important}
.shareButtonStack .sharePlatformBtn{border:1px solid rgba(255,255,255,.15)!important;background:rgba(255,255,255,.08)!important;color:#fff!important}
@media(max-width:640px){.shareButtonStack{grid-template-columns:1fr!important}}


/* SIMPLE ONE BUTTON SHARE FIX */
.shareGuideCard,.shareButtonStack{display:none!important}
.shareSimpleCard{margin-top:14px!important;padding:16px!important;border-radius:18px!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.14)!important;color:#fff!important}
.shareSimpleCard strong{display:block!important;font-size:18px!important;font-weight:1000!important;margin-bottom:7px!important}
.shareSimpleCard p{margin:0 0 13px!important;color:rgba(255,255,255,.72)!important;font-size:13px!important;line-height:1.35!important}
.shareOneBtn{width:100%!important;min-height:54px!important;border:0!important;border-radius:16px!important;background:var(--accent)!important;color:var(--accentText)!important;box-shadow:0 14px 30px var(--accentGlow)!important;font-size:16px!important;font-weight:1000!important;cursor:pointer!important}





/* ORDA FINAL REAL STICKY CART
   The cart does not render on the hero.
   It appears only after the hero is passed and then follows the customer. */
.stickyCart{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  top:auto!important;
  bottom:18px!important;
  transform:translateX(-50%)!important;
  width:min(1100px,calc(100vw - 24px))!important;
  max-width:1100px!important;
  margin:0!important;
  z-index:9999!important;
}

.hero .stickyCart,
.cleanHero .stickyCart,
.hero.cleanHero .stickyCart{
  display:none!important;
}

/* Remove the giant empty bottom space from the old hard-coded cart fix */
.page{
  padding-bottom:118px!important;
}
.layout{
  padding-bottom:32px!important;
  margin-bottom:0!important;
}
.reviewSection{
  margin-bottom:34px!important;
}
.sideCol{
  padding-bottom:0!important;
}

/* Store name spacing */
.heroText h1,
.cleanHero h1,
.hero h1{
  letter-spacing:-0.035em!important;
  word-spacing:0.04em!important;
  line-height:0.94!important;
}

@media(min-width:981px){
  .stickyCart{
    bottom:34px!important;
    width:min(1060px,calc(100vw - 96px))!important;
  }
}

@media(max-width:720px){
  .stickyCart{
    bottom:8px!important;
    width:calc(100vw - 12px)!important;
    max-width:calc(100vw - 12px)!important;
  }

  .page{
    padding-bottom:96px!important;
  }

  .layout{
    padding-bottom:24px!important;
  }

  .heroText h1,
  .cleanHero h1,
  .hero h1{
    letter-spacing:-0.025em!important;
    word-spacing:0.035em!important;
    line-height:0.96!important;
  }
}


/* ORDA FINAL: hide sticky cart while customer is choosing item options */
.itemModal .stickyCart,
.itemDrawer .stickyCart,
.optionDrawer .stickyCart,
.cartModal .stickyCart,
.modal .stickyCart,
.drawer .stickyCart,
[role="dialog"] .stickyCart{
  display:none!important;
}

/* Hide the floating sticky cart when an item-buy drawer/modal is open */
body:has(.itemModal) .stickyCart,
body:has(.itemDrawer) .stickyCart,
body:has(.optionDrawer) .stickyCart,
body:has(.modal) .stickyCart,
body:has(.drawer) .stickyCart,
body:has([role="dialog"]) .stickyCart{
  display:none!important;
}

/* Keep purchase/add-to-cart area clear on mobile */
.itemModal,
.itemDrawer,
.optionDrawer,
.modal,
.drawer,
[role="dialog"]{
  padding-bottom:calc(env(safe-area-inset-bottom, 0px) + 18px)!important;
}

@media(max-width:720px){
  body:has(.itemModal) .stickyCart,
  body:has(.itemDrawer) .stickyCart,
  body:has(.optionDrawer) .stickyCart,
  body:has(.modal) .stickyCart,
  body:has(.drawer) .stickyCart,
  body:has([role="dialog"]) .stickyCart{
    display:none!important;
  }
}


/* ORDA FINAL: sticky cart must never cover View Cart / checkout / payment panel */
body:has(.cartDrawer) .stickyCart,
body:has(.cartPanel) .stickyCart,
body:has(.cartSheet) .stickyCart,
body:has(.checkoutPanel) .stickyCart,
body:has(.checkoutDrawer) .stickyCart,
body:has(.orderPanel) .stickyCart,
body:has(.cartOpen) .stickyCart,
body:has([data-cart-open="true"]) .stickyCart{
  display:none!important;
}

/* keep checkout money/payment area clear */
.cartDrawer,
.cartPanel,
.cartSheet,
.checkoutPanel,
.checkoutDrawer,
.orderPanel{
  padding-bottom:calc(env(safe-area-inset-bottom, 0px) + 24px)!important;
}


/* 7TH ST VAULT FINAL FULL-FILE FASHION CONVERSION
   This keeps the complete ORDA blueprint storefront file intact, but changes the public storefront layer to fashion. */
.videoCoverBadge,
.videoCard > span,
.playVideo,
.videoPill{
  display:none!important;
}
.videoCard video,
.videoCoverBox video,
.heroMedia,
.modalImg{
  object-fit:cover!important;
}
.itemCard video::-webkit-media-controls,
.videoCard video::-webkit-media-controls,
.videoCoverBox video::-webkit-media-controls,
.hero video::-webkit-media-controls{
  display:none!important;
}


/* Media visibility repair */
.productCardVideo,
.videoCard video,
.itemCard video,
.imageBox video {
  width:100%!important;
  height:100%!important;
  min-height:220px!important;
  object-fit:cover!important;
  display:block!important;
  background:#111827!important;
}
.videoCard .productCardVideo {
  min-height:260px!important;
}
.imageBox img,
.videoCard img,
.itemCard img {
  width:100%!important;
  height:100%!important;
  object-fit:cover!important;
  display:block!important;
}
.imageBox {
  background:#111827!important;
  overflow:hidden!important;
}


/* final media display fix */
.productCardVideo,
.videoCard video,
.itemCard video,
.imageBox video {
  width:100%!important;
  height:100%!important;
  min-height:220px!important;
  object-fit:cover!important;
  display:block!important;
  background:#11131a!important;
}
.videoCard .productCardVideo { min-height:260px!important; }
.imageBox img,.videoCard img,.itemCard img {
  width:100%!important;
  height:100%!important;
  object-fit:cover!important;
  display:block!important;
}
.imageBox,.videoCard {
  background:#11131a!important;
  overflow:hidden!important;
}


/* Storefront product media final repair */
.productCardVideo,.modalProductVideo,.videoCard video,.itemCard video,.imageBox video{
  width:100%!important;height:100%!important;min-height:240px!important;object-fit:cover!important;display:block!important;background:#11131a!important;
}
.modalProductVideo{min-height:420px!important}
.imageBox img,.videoCard img,.itemCard img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
.imageBox,.videoCard{background:#11131a!important;overflow:hidden!important}

`;
