'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
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
  video_url?: string | null;
  video_file?: string | null;
  item_video?: string | null;
  menu_video?: string | null;
  media_type?: string | null;
  price: number | null;
  base_price: number | null;
  availability: string | null;
  is_available: boolean | null;
  sort_order: number | null;
};

type GroupRow = { id: string; item_id: string | null; name: string | null; is_required: boolean | null; selection_mode: string | null; sort_order: number | null };
type ChoiceRow = { id: string; option_group_id: string | null; name: string | null; price: number | null; price_delta: number | null; sort_order: number | null };

type PromoRow = { id: string; restaurant_id?: string | null; title?: string | null; name?: string | null; description?: string | null; details?: string | null; code?: string | null; promo_code?: string | null; discount_type?: string | null; value?: number | null; discount_value?: number | null; minimum_order?: number | null; min_order?: number | null; active?: boolean | null; is_active?: boolean | null; starts_at?: string | null; ends_at?: string | null; expires_at?: string | null };
type RewardRow = { id: string; restaurant_id?: string | null; title?: string | null; name?: string | null; description?: string | null; details?: string | null; points_required?: number | null; visits_required?: number | null; active?: boolean | null; is_active?: boolean | null; expires_at?: string | null };

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
  isVideoMenu: boolean;
  posterUrl: string;
};
type CartSelection = { groupName: string; choiceNames: string[]; priceDelta: number };
type CartLine = { id: string; itemId: string; name: string; itemName: string; imageUrl: string; image_url: string; itemImage: string; item_image: string; videoUrl?: string; video_url?: string; mediaType: 'image' | 'video'; quantity: number; selections: CartSelection[]; unitTotal: number; total: number };
type StoreHour = { day: string; open: string; close: string; closed: boolean };
type OpenStatus = { open: boolean; text: string; nextText: string };

const BUCKET = 'menu-images';
const FALLBACK_FOOD = 'universal/1.jpg';
const FALLBACK_HERO = 'hero/1.jpg';
const MENU_VIDEO_LIMIT_SECONDS = 10;
const VIDEO_MENU_AVAILABILITY = 'video_menu';

const COPY = {
  en: { menu: 'Menu', promos: 'Promos', rewards: 'Rewards', hours: 'HOURS', social: 'SOCIAL', pickup: 'PICKUP', delivery: 'DELIVERY', allItems: 'ALL ITEMS', customize: 'Customize', location: 'YOUR LOCATION', directions: 'GET DIRECTIONS', storeDetails: 'STORE DETAILS', pickupAvailable: 'Pickup Available', deliveryAvailable: 'Delivery Available', deliveryFee: 'Delivery Fee', deliveryRadius: 'Delivery Radius', minimumOrder: 'Minimum Order', required: 'Required', optional: 'Optional', quantity: 'Quantity', addToCart: 'ADD TO CART', cart: 'View Cart', checkout: 'CHECKOUT', subtotal: 'SUBTOTAL', discount: 'DISCOUNT', total: 'TOTAL', empty: 'Your cart is empty.', basePrice: 'Base Price', finalPrice: 'Final Price', soldOut: 'Sold Out', openNow: 'Open Now', closedNow: 'Closed Now', closes: 'Closes', opens: 'Opens', remove: 'Remove', apply: 'Apply', usePromo: 'Use Promo', promoCode: 'Promo code', promoApplied: 'Promo applied.', promoNotFound: 'Promo not found.', startOrder: 'START YOUR ORDER', limitedOffer: 'LIMITED TIME OFFER', nextOrder: 'YOUR NEXT ORDER', applyCode: 'APPLY CODE', pointsAvailable: 'POINTS AVAILABLE', nextReward: 'Next Reward', viewRewards: 'VIEW REWARDS', items: 'ITEMS', noPhone: 'Phone number not added yet', noItems: 'No menu items yet.', noItemsSub: 'Add items in the ORDA builder and they will show here.', orderType: 'Order Type', working: 'WORKING...', callStore: 'Call Store', directTagline: 'Order direct. Fresh food.', followUs: 'Follow Us', videos: 'VIDEOS', playVideo: 'Play Video' },
  es: { menu: 'Menú', promos: 'Promos', rewards: 'Recompensas', hours: 'HORARIO', social: 'REDES', pickup: 'RECOGER', delivery: 'ENTREGA', allItems: 'TODO', customize: 'Personalizar', location: 'TU UBICACIÓN', directions: 'CÓMO LLEGAR', storeDetails: 'DETALLES', pickupAvailable: 'Pickup Disponible', deliveryAvailable: 'Entrega Disponible', deliveryFee: 'Costo de Entrega', deliveryRadius: 'Radio de Entrega', minimumOrder: 'Orden Mínima', required: 'Requerido', optional: 'Opcional', quantity: 'Cantidad', addToCart: 'AGREGAR', cart: 'Ver Carrito', checkout: 'PAGAR', subtotal: 'SUBTOTAL', discount: 'DESCUENTO', total: 'TOTAL', empty: 'Tu carrito está vacío.', basePrice: 'Precio Base', finalPrice: 'Precio Final', soldOut: 'Agotado', openNow: 'Abierto', closedNow: 'Cerrado', closes: 'Cierra', opens: 'Abre', remove: 'Quitar', apply: 'Aplicar', usePromo: 'Usar Promo', promoCode: 'Código promo', promoApplied: 'Promo aplicada.', promoNotFound: 'Promo no encontrada.', startOrder: 'EMPEZAR ORDEN', limitedOffer: 'OFERTA POR TIEMPO LIMITADO', nextOrder: 'TU PRÓXIMA ORDEN', applyCode: 'APLICAR CÓDIGO', pointsAvailable: 'PUNTOS DISPONIBLES', nextReward: 'Próxima Recompensa', viewRewards: 'VER RECOMPENSAS', items: 'ARTÍCULOS', noPhone: 'Número no agregado todavía', noItems: 'No hay artículos todavía.', noItemsSub: 'Agrega artículos en ORDA builder y aparecerán aquí.', orderType: 'Tipo de Orden', working: 'TRABAJANDO...', callStore: 'Llamar', directTagline: 'Ordena directo. Comida fresca.', followUs: 'Síguenos', videos: 'VIDEOS', playVideo: 'Ver Video' },
};

const OWNER_TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: { pickup: 'Pickup', delivery: 'Delivery', subtotal: 'Subtotal', deliveryFee: 'Delivery Fee', discount: 'Discount', total: 'Total', promo: 'Promo', noSelections: 'No options selected', quantity: 'Qty' },
  es: { pickup: 'Recoger', delivery: 'Entrega', subtotal: 'Subtotal', deliveryFee: 'Costo de Entrega', discount: 'Descuento', total: 'Total', promo: 'Promo', noSelections: 'Sin opciones', quantity: 'Cant.' },
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
function publicStorageUrl(path: string) { const { data } = supabase.storage.from(BUCKET).getPublicUrl(String(path || '').replace(/^\/+/, '')); return data.publicUrl; }
function resolveStorageUrl(value?: string | null) { const raw = String(value || '').trim(); if (!raw) return ''; if (isFullUrl(raw)) return raw; if (raw.startsWith('/')) return raw; if (raw.startsWith('menu-images/')) return publicStorageUrl(raw.replace(/^menu-images\//, '')); if (raw.startsWith(`${BUCKET}/`)) return publicStorageUrl(raw.replace(`${BUCKET}/`, '')); return publicStorageUrl(raw); }
function categoryFromName(categoryName?: string | null, itemName?: string | null) { const text = cleanKey(`${categoryName || ''} ${itemName || ''}`); if (text.includes('wing')) return 'wings'; if (text.includes('burger')) return 'burgers'; if (text.includes('taco') || text.includes('birria')) return 'tacos'; if (text.includes('mexican') || text.includes('burrito') || text.includes('quesadilla') || text.includes('nacho')) return 'mexican'; if (text.includes('seafood') || text.includes('shrimp') || text.includes('fish') || text.includes('crab')) return 'seafood'; if (text.includes('bbq') || text.includes('barbecue') || text.includes('rib') || text.includes('brisket')) return 'bbq'; if (text.includes('pasta') || text.includes('alfredo')) return 'pasta'; if (text.includes('chicken')) return 'chicken'; if (text.includes('coffee')) return 'coffee'; if (text.includes('smoothie')) return 'smoothies'; if (text.includes('shake')) return 'milkshake'; if (text.includes('sandwich')) return 'sandwiches'; if (text.includes('hot_dog') || text.includes('hotdog')) return 'hot_dog'; if (text.includes('fries') || text.includes('fry')) return 'fries'; if (text.includes('breakfast')) return 'breakfast'; if (text.includes('dessert') || text.includes('cake')) return 'desserts'; if (text.includes('drink') || text.includes('soda') || text.includes('juice') || text.includes('water')) return 'drinks'; if (text.includes('side')) return 'sides'; if (text.includes('combo')) return 'combos'; return 'universal'; }
function fallbackImage(categoryName?: string | null, itemName?: string | null) { return publicStorageUrl(`${categoryFromName(categoryName, itemName)}/1.jpg`); }
function fallbackForImageElement(event: SyntheticEvent<HTMLImageElement, Event>, categoryName?: string, itemName?: string) { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage(categoryName, itemName || FALLBACK_FOOD); }
function parseHourMinute(value: string) { const raw = String(value || '').trim(); const twentyFour = raw.match(/^(\d{1,2}):(\d{2})$/); if (twentyFour) { const hour = Number(twentyFour[1]); const minute = Number(twentyFour[2]); if (hour > 23 || minute > 59) return null; return hour * 60 + minute; } const match = raw.toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/); if (!match) return null; let hour = Number(match[1]); const minute = Number(match[2] || 0); const meridian = match[3]; if (meridian === 'PM' && hour !== 12) hour += 12; if (meridian === 'AM' && hour === 12) hour = 0; if (hour > 23 || minute > 59) return null; return hour * 60 + minute; }
function formatHour(value: string) { const minutes = parseHourMinute(value); if (minutes === null) return value || '--'; const hour24 = Math.floor(minutes / 60); const minute = minutes % 60; const suffix = hour24 >= 12 ? 'PM' : 'AM'; const hour12 = hour24 % 12 || 12; return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`; }
function normalizeHours(raw: any): StoreHour[] { if (!raw) return DEFAULT_HOURS; let value = raw; if (typeof raw === 'string') { try { value = JSON.parse(raw); } catch { return DEFAULT_HOURS; } } if (Array.isArray(value)) return DEFAULT_HOURS.map((fallback, index) => { const found = value[index] || value.find((hour: any) => String(hour?.day || '').toLowerCase() === fallback.day.toLowerCase()) || {}; return { day: found.day || fallback.day, open: String(found.open || found.open_time || fallback.open), close: String(found.close || found.close_time || fallback.close), closed: Boolean(found.closed || found.is_closed || found.open === false || found.isOpen === false) }; }); if (typeof value === 'object') return DAYS.map(([key, label]) => { const found = value[key] || value[label] || value[label.toLowerCase()] || {}; return { day: label, open: String(found.open || found.open_time || DEFAULT_HOURS.find((hour) => hour.day === label)?.open || '11:00 AM'), close: String(found.close || found.close_time || DEFAULT_HOURS.find((hour) => hour.day === label)?.close || '10:00 PM'), closed: Boolean(found.closed || found.is_closed || found.open === false || found.isOpen === false) }; }); return DEFAULT_HOURS; }
function getOpenStatus(hoursRaw: any, copy: typeof COPY.en): OpenStatus { const hours = normalizeHours(hoursRaw); const now = new Date(); const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; const today = hours[dayIndex] || DEFAULT_HOURS[dayIndex]; const current = now.getHours() * 60 + now.getMinutes(); const openMinutes = parseHourMinute(today.open); const closeMinutes = parseHourMinute(today.close); if (!today.closed && openMinutes !== null && closeMinutes !== null) { const overnight = closeMinutes < openMinutes; const open = overnight ? current >= openMinutes || current <= closeMinutes : current >= openMinutes && current <= closeMinutes; if (open) return { open: true, text: copy.openNow, nextText: `${copy.closes} ${formatHour(today.close)}` }; } const nextOpen = hours.find((row, offset) => offset === 0 ? !row.closed && current < (parseHourMinute(row.open) || 0) : !row.closed); return { open: false, text: copy.closedNow, nextText: `${copy.opens} ${formatHour(nextOpen?.open || today.open)}` }; }
function isActiveRecord(row: any) { if (!row) return false; if (row.active === false || row.is_active === false) return false; const now = new Date(); if (row.starts_at) { const start = new Date(row.starts_at); if (!Number.isNaN(start.getTime()) && start > now) return false; } const endValue = row.ends_at || row.expires_at; if (endValue) { const end = new Date(endValue); if (!Number.isNaN(end.getTime()) && end < now) return false; } return true; }
function isLiveMenuItem(row: ItemRow) { const availability = String(row.availability || '').toLowerCase().trim(); if (row.is_available === false) return false; if (['deleted', 'delete', 'removed', 'remove', 'hidden', 'inactive', 'archived', 'draft', 'sold_out'].includes(availability)) return false; if (!String(row.name || '').trim()) return false; return true; }
function isVideoMenuRow(row: ItemRow) { const video = resolveStorageUrl(row.video_file || row.item_video || row.menu_video || row.video_url || ''); return String(row.availability || '').toLowerCase().trim() === VIDEO_MENU_AVAILABILITY || String(row.media_type || '').toLowerCase().includes('video') || isVideoUrl(video); }
function promoTitle(promo: PromoRow) { return prettyName(promo.title || promo.name || 'Special Offer'); }
function promoDescription(promo: PromoRow) { return String(promo.description || promo.details || '').trim(); }
function promoCodeValue(promo: PromoRow) { return String(promo.code || promo.promo_code || '').trim(); }
function promoValueText(promo: PromoRow) { const type = String(promo.discount_type || '').toLowerCase(); const value = Number(promo.discount_value ?? promo.value ?? 0); if (!value && !type.includes('free')) return 'MEMBER PERK'; if (type.includes('percent')) return `${value}% OFF`; if (type.includes('free')) return 'FREE ITEM'; return `${money(value)} OFF`; }
function promoDiscountAmount(promo: PromoRow | null, subtotal: number) { if (!promo) return 0; const minimum = Number(promo.minimum_order ?? promo.min_order ?? 0); if (minimum > 0 && subtotal < minimum) return 0; const type = String(promo.discount_type || '').toLowerCase(); const value = Number(promo.discount_value ?? promo.value ?? 0); if (!value) return 0; if (type.includes('percent')) return Math.min(subtotal, subtotal * (value / 100)); return Math.min(subtotal, value); }
function rewardTitle(reward: RewardRow) { return prettyName(reward.title || reward.name || 'Loyalty Reward'); }
function rewardDescription(reward: RewardRow) { return String(reward.description || reward.details || '').trim(); }
async function fetchOptionalRows<T>(tableNames: string[], restaurantId: string) { for (const table of tableNames) { const { data, error } = await supabase.from(table).select('*').eq('restaurant_id', restaurantId).limit(25); if (!error && Array.isArray(data)) return data as T[]; } return [] as T[]; }
function choices(names: Array<string | [string, number]>): Choice[] { return names.map((entry) => { const name = Array.isArray(entry) ? entry[0] : entry; const priceDelta = Array.isArray(entry) ? entry[1] : 0; return { id: cleanKey(name), name, priceDelta }; }); }
function isVideoMenuItemFromItem(item: Item) { return item.isVideoMenu || cleanKey(item.categoryName).includes('video_menu') || isVideoUrl(resolveStorageUrl(item.videoUrl)); }
function defaultGroups(item: Item): Group[] { const key = cleanKey(`${item.categoryName} ${item.name}`); if (key.includes('burger') || key.includes('sandwich') || key.includes('hot_dog') || key.includes('hotdog')) return [{ id: `${item.id}_remove`, name: 'Remove Items', required: false, mode: 'multiple', choices: choices(['No Pickles', 'No Onions', 'No Tomato', 'No Lettuce', 'No Sauce']) }, { id: `${item.id}_addons`, name: 'Add Ons', required: false, mode: 'multiple', choices: choices([['Add Cheese', 1], ['Add Bacon', 2], ['Extra Patty', 4], ['Avocado', 2]]) }]; if (key.includes('taco') || key.includes('mexican') || key.includes('burrito') || key.includes('quesadilla') || key.includes('nacho')) return [{ id: `${item.id}_protein`, name: 'Protein', required: false, mode: 'single', choices: choices(['Asada', 'Chicken', 'Al Pastor', 'Carnitas', 'Birria', 'Shrimp']) }, { id: `${item.id}_toppings`, name: 'Toppings', required: false, mode: 'multiple', choices: choices(['Sour Cream', 'Cilantro', 'Onions', 'Cheese', 'Lettuce', 'Pico de Gallo', ['Guacamole', 2], ['Queso', 1.5]]) }, { id: `${item.id}_salsa`, name: 'Salsa', required: false, mode: 'single', choices: choices(['Mild Salsa', 'Medium Salsa', 'Hot Salsa', 'Salsa Verde', 'Salsa Roja', 'No Salsa']) }]; if (key.includes('wing')) return [{ id: `${item.id}_flavor`, name: 'Wing Flavor', required: true, mode: 'single', choices: choices(['Fried', 'Buffalo', 'BBQ', 'Lemon Pepper', 'Garlic Parmesan', 'Honey Hot', 'Hot']) }, { id: `${item.id}_wing_style`, name: 'Wing Style', required: false, mode: 'multiple', choices: choices(['Extra Crispy', 'Sauce On Side', ['All Flats', 2], ['All Drums', 1]]) }, { id: `${item.id}_dip`, name: 'Dipping Sauce', required: false, mode: 'multiple', choices: choices(['Ranch', 'Blue Cheese', ['Extra Ranch', 0.75], ['Extra Blue Cheese', 0.75]]) }]; return [{ id: `${item.id}_special`, name: 'Special Instructions', required: false, mode: 'multiple', choices: choices([['Extra Sauce', 0.75], 'No Sauce', ['Extra Cheese', 1.5], 'No Onions', 'No Vegetables']) }]; }
function buildOwnerSummary(cart: CartLine[], values: { orderType: OrderType; subtotal: number; deliveryFee: number; discount: number; total: number; promo?: string | null }, lang: Lang) { const c = OWNER_TRANSLATIONS[lang]; const lines: string[] = []; lines.push(`${lang === 'es' ? 'Tipo de orden' : 'Order Type'}: ${values.orderType === 'delivery' ? c.delivery : c.pickup}`); lines.push(''); cart.forEach((line, index) => { lines.push(`${index + 1}. ${line.quantity}x ${line.name} — ${money(line.total)}`); lines.push(`   Item ID: ${line.itemId}`); if (line.imageUrl) lines.push(`   Image: ${line.imageUrl}`); if (line.videoUrl) lines.push(`   Video: ${line.videoUrl}`); if (line.selections.length) line.selections.forEach((selection) => lines.push(`   ${selection.groupName}: ${selection.choiceNames.join(', ')}`)); else lines.push(`   ${c.noSelections}`); }); lines.push(''); lines.push(`${c.subtotal}: ${money(values.subtotal)}`); if (values.deliveryFee > 0) lines.push(`${c.deliveryFee}: ${money(values.deliveryFee)}`); if (values.discount > 0) lines.push(`${c.discount}: -${money(values.discount)}`); if (values.promo) lines.push(`${c.promo}: ${values.promo}`); lines.push(`${c.total}: ${money(values.total)}`); return lines.join('\n'); }
function normalizeSocialUrl(kind: SocialKind, value?: string | null) { const raw = String(value || '').trim(); if (!raw) return ''; if (/^https?:\/\//i.test(raw)) return raw; const clean = raw.replace(/^@/, '').replace(/^\/+/, ''); if (!clean) return ''; if (kind === 'instagram') return `https://instagram.com/${clean}`; if (kind === 'facebook') return `https://facebook.com/${clean}`; if (kind === 'tiktok') return `https://www.tiktok.com/@${clean}`; return clean.startsWith('@') ? `https://youtube.com/${clean}` : `https://youtube.com/@${clean}`; }
function getSocialLinks(restaurant: RestaurantRow | null) { if (!restaurant) return []; const links = [{ key: 'instagram' as SocialKind, label: 'Instagram', icon: 'IG', url: normalizeSocialUrl('instagram', restaurant.instagram_url || restaurant.instagram) }, { key: 'facebook' as SocialKind, label: 'Facebook', icon: 'f', url: normalizeSocialUrl('facebook', restaurant.facebook_url || restaurant.facebook) }, { key: 'tiktok' as SocialKind, label: 'TikTok', icon: '♪', url: normalizeSocialUrl('tiktok', restaurant.tiktok_url || restaurant.tiktok) }, { key: 'youtube' as SocialKind, label: 'YouTube', icon: '▶', url: normalizeSocialUrl('youtube', restaurant.youtube_url || restaurant.youtube) }]; return links.filter((link) => link.url); }
function posterForItem(item: Item | null) { if (!item) return ''; const savedImage = resolveStorageUrl(item.imageUrl); if (savedImage) return savedImage; if (item.posterUrl) return item.posterUrl; if (item.autoImageUrl) return item.autoImageUrl; return fallbackImage(item.categoryName, item.name); }

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

  return <video key={src} ref={videoRef} className={className} src={src} poster={poster || undefined} autoPlay muted loop={!limitSeconds} playsInline preload="auto" controls={controls} disablePictureInPicture onLoadedMetadata={playVideo} onLoadedData={playVideo} onCanPlay={playVideo} onPlaying={() => null} onPause={() => { if (!controls) window.setTimeout(playVideo, 150); }} onEnded={(event) => { event.currentTarget.currentTime = 0; playVideo(); }} onTimeUpdate={(event) => { const video = event.currentTarget; if (limitSeconds && video.currentTime >= limitSeconds) { video.currentTime = 0; playVideo(); } }} />;
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
  return <div className="videoCoverBox" aria-label={title}>{autoPlay && src ? <SmoothVideo src={src} poster={safePoster} className="videoCoverStill" limitSeconds={MENU_VIDEO_LIMIT_SECONDS} /> : <StaticVideoThumb src={src} poster={safePoster} title={title} className="videoCoverStill" />}<div className="videoCoverShade" /><span className="videoCoverBadge">▶ Video</span></div>;
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
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoRow | null>(null);
  const [promoMessage, setPromoMessage] = useState('');

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

    const [{ data: catRows }, { data: itemRows }, { data: groupRows }, { data: choiceRows }, promoRows, rewardRows] = await Promise.all([
      supabase.from('menu_categories').select('id,restaurant_id,name,sort_order').eq('restaurant_id', restaurantRow.id).order('sort_order', { ascending: true }),
      supabase.from('menu_items').select('*').eq('restaurant_id', restaurantRow.id).order('sort_order', { ascending: true }).limit(250),
      supabase.from('menu_option_groups').select('id,item_id,name,is_required,selection_mode,sort_order').order('sort_order', { ascending: true }).limit(500),
      supabase.from('menu_option_choices').select('id,option_group_id,name,price,price_delta,sort_order').order('sort_order', { ascending: true }).limit(1000),
      fetchOptionalRows<PromoRow>(['promos', 'restaurant_promos', 'promotions', 'store_promos'], restaurantRow.id),
      fetchOptionalRows<RewardRow>(['rewards', 'restaurant_rewards', 'loyalty_rewards', 'store_rewards'], restaurantRow.id),
    ]);

    const liveRows = ((itemRows || []) as ItemRow[]).filter(isLiveMenuItem);
    const ownerPromo: PromoRow | null = restaurantRow.promo_enabled === false ? null : { id: `restaurant_${restaurantRow.id}_promo`, restaurant_id: restaurantRow.id, title: restaurantRow.promo_title || `${Number(restaurantRow.promo_percent || 15)}% OFF`, description: restaurantRow.promo_text || 'YOUR NEXT ORDER', code: restaurantRow.promo_code || 'ORDA15', discount_type: 'percent', discount_value: Number(restaurantRow.promo_percent || 15), active: true };
    setPromos([...(ownerPromo ? [ownerPromo] : []), ...((promoRows || []).filter(isActiveRecord))]);
    setRewards((rewardRows || []).filter(isActiveRecord));

    const itemCategoryIds = Array.from(new Set(liveRows.map((row) => row.category_id).filter(Boolean))) as string[];
    const baseCats: Category[] = ((catRows || []) as CategoryRow[]).filter((cat) => itemCategoryIds.includes(cat.id)).map((cat, index) => ({ id: cat.id, name: prettyName(cat.name || `Category ${index + 1}`), sortOrder: cat.sort_order ?? index }));
    const missingCategoryRows = itemCategoryIds.filter((categoryId) => !baseCats.some((cat) => cat.id === categoryId)).map((categoryId, index) => ({ id: categoryId, name: 'Menu', sortOrder: baseCats.length + index }));
    const mappedCats = [...baseCats, ...missingCategoryRows].sort((a, b) => a.sortOrder - b.sortOrder);
    setCategories(mappedCats);

    const groupList = (groupRows || []) as GroupRow[];
    const choiceList = (choiceRows || []) as ChoiceRow[];
    const mappedItems: Item[] = liveRows.map((row: ItemRow, index: number) => {
      const rawVideo = row.video_file || row.item_video || row.menu_video || row.video_url || '';
      const resolvedVideo = resolveStorageUrl(rawVideo);
      const isVideoMenu = isVideoMenuRow(row);
      const cat = mappedCats.find((candidate) => candidate.id === row.category_id);
      const categoryName = isVideoMenu ? 'Video Menu' : cat?.name || 'Menu';
      const dbGroups = groupList.filter((group) => group.item_id === row.id).map((group) => ({ id: group.id, name: group.name || 'Options', required: !!group.is_required, mode: group.selection_mode === 'multiple' ? 'multiple' : 'single', choices: choiceList.filter((choice) => choice.option_group_id === group.id).map((choice) => ({ id: choice.id, name: choice.name || 'Choice', priceDelta: Number(choice.price_delta ?? choice.price ?? 0) })) })) as Group[];
      const rawImage = row.image_file || row.item_image || row.image_url || '';
      const resolvedImage = resolveStorageUrl(rawImage);
      const realFallback = fallbackImage(isVideoMenu ? categoryFromName('', row.name) : categoryName, row.name || 'video');
      const posterUrl = resolvedImage || realFallback;
      const item: Item = { id: row.id, categoryId: isVideoMenu ? 'VIDEO_MENU' : row.category_id || `uncategorized_${index}`, categoryName, name: row.name || 'Menu Item', description: row.description || '', imageUrl: rawImage, videoUrl: rawVideo || resolvedVideo, autoImageUrl: posterUrl, basePrice: Number(row.base_price ?? row.price ?? 0), available: true, groups: [], isVideoMenu, posterUrl };
      item.groups = dbGroups.length ? dbGroups : defaultGroups(item);
      return item;
    });

    setItems(mappedItems);
    setActiveCategory((current) => current === 'ALL' || current === 'VIDEO_MENU' || mappedCats.some((cat) => cat.id === current) ? current : 'ALL');
    setLoading(false);
    supabase.from('store_views').insert({ restaurant_id: restaurantRow.id, slug: restaurantRow.slug, viewed_at: new Date().toISOString() }).then(() => null);
  }, [slug]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!restaurant?.id) return; const channel = supabase.channel(`orda-store-${restaurant.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurant.id}` }, () => void load()).on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurant.id}` }, () => void load()).on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories', filter: `restaurant_id=eq.${restaurant.id}` }, () => void load()).subscribe(); return () => { void supabase.removeChannel(channel); }; }, [restaurant?.id, load]);

  const videoItems = useMemo(() => items.filter((item) => isVideoMenuItemFromItem(item)), [items]);
  const photoItems = useMemo(() => items.filter((item) => !isVideoMenuItemFromItem(item)), [items]);
  const visibleItems = useMemo(() => { if (activeCategory === 'VIDEO_MENU') return videoItems; if (activeCategory === 'ALL') return [...photoItems, ...videoItems]; return photoItems.filter((item) => item.categoryId === activeCategory); }, [activeCategory, photoItems, videoItems]);
  const activeCategoryName = useMemo(() => activeCategory === 'VIDEO_MENU' ? 'Video Menu' : activeCategory === 'ALL' ? visibleItems[0]?.categoryName || categories[0]?.name || 'universal' : categories.find((category) => category.id === activeCategory)?.name || 'universal', [activeCategory, categories, visibleItems]);
  const categoryHeroItem = visibleItems[0] || items[0] || null;
  const sidePromoImage = useMemo(() => categoryHeroItem ? getImage(categoryHeroItem) : fallbackImage(activeCategoryName, activeCategoryName), [activeCategoryName, categoryHeroItem, getImage]);
  const selectedTotal = useMemo(() => { if (!selectedItem) return 0; let extra = 0; selectedItem.groups.forEach((group) => { const ids = picked[group.id] || []; group.choices.forEach((choice) => { if (ids.includes(choice.id)) extra += choice.priceDelta; }); }); return (selectedItem.basePrice + extra) * qty; }, [selectedItem, picked, qty]);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartSubtotal = cart.reduce((sum, line) => sum + line.total, 0);
  const promoDiscount = promoDiscountAmount(appliedPromo, cartSubtotal);
  const deliveryFee = orderType === 'delivery' ? Number(restaurant?.delivery_fee || 0) : 0;
  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - promoDiscount);

  function scrollToMenu() { document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }
  function openItem(item: Item) { const start: Record<string, string[]> = {}; item.groups.forEach((group) => { start[group.id] = []; }); setPicked(start); setQty(1); setSelectedItem(item); }
  function toggleChoice(group: Group, choice: Choice) { setPicked((current) => { const existing = current[group.id] || []; if (group.mode === 'single') return { ...current, [group.id]: existing.includes(choice.id) ? [] : [choice.id] }; return { ...current, [group.id]: existing.includes(choice.id) ? existing.filter((id) => id !== choice.id) : [...existing, choice.id] }; }); }
  function canAdd() { if (!selectedItem) return false; return selectedItem.groups.every((group) => !group.required || (picked[group.id] || []).length > 0); }
  function addToCart() { if (!selectedItem || !canAdd()) return; const selections = selectedItem.groups.map((group) => { const ids = picked[group.id] || []; const selectedChoices = group.choices.filter((choice) => ids.includes(choice.id)); return { groupName: group.name, choiceNames: selectedChoices.map((choice) => (choice.priceDelta > 0 ? `${choice.name} +${money(choice.priceDelta)}` : choice.name)), priceDelta: selectedChoices.reduce((sum, choice) => sum + choice.priceDelta, 0) }; }).filter((selection) => selection.choiceNames.length); const unitTotal = selectedItem.basePrice + selections.reduce((sum, selection) => sum + selection.priceDelta, 0); const poster = getPoster(selectedItem) || fallbackImage(selectedItem.categoryName, selectedItem.name); const video = resolveStorageUrl(selectedItem.videoUrl); const mediaType = isVideoMenuItemFromItem(selectedItem) ? 'video' : 'image'; setCart((current) => [...current, { id: makeId('cart'), itemId: selectedItem.id, name: selectedItem.name, itemName: selectedItem.name, imageUrl: poster, image_url: poster, itemImage: poster, item_image: poster, videoUrl: video, video_url: video, mediaType, quantity: qty, selections, unitTotal, total: unitTotal * qty }]); setSelectedItem(null); setCartOpen(true); }
  function removeCartLine(lineId: string) { setCart((current) => current.filter((line) => line.id !== lineId)); }
  function updateCartQty(lineId: string, nextQty: number) { if (nextQty <= 0) { removeCartLine(lineId); return; } setCart((current) => current.map((line) => (line.id === lineId ? { ...line, quantity: nextQty, total: line.unitTotal * nextQty } : line))); }
  function applyPromoByCode(codeValue?: string) { const code = String(codeValue || promoInput).trim().toLowerCase(); if (!code) { setAppliedPromo(null); setPromoMessage(''); return; } const found = promos.find((promo) => promoCodeValue(promo).toLowerCase() === code || promoTitle(promo).toLowerCase() === code); if (!found) { setAppliedPromo(null); setPromoMessage(copy.promoNotFound); setCartOpen(true); return; } setAppliedPromo(found); setPromoInput(promoCodeValue(found) || promoTitle(found)); setPromoMessage(`${promoValueText(found)} ${copy.promoApplied}`); setCartOpen(true); }
  function useReward(reward: RewardRow) { setPromoMessage(`${rewardTitle(reward)} selected. Add your items and checkout direct.`); setCartOpen(true); scrollToMenu(); }
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
  const promoCode = featuredPromo ? promoCodeValue(featuredPromo) : 'ORDA15';
  const promoBig = featuredPromo ? promoValueText(featuredPromo) : `${Number(restaurant.promo_percent || 15)}% OFF`;
  const promoSmall = featuredPromo ? promoTitle(featuredPromo) : restaurant.promo_title || copy.nextOrder;
  const promoDesc = featuredPromo && promoDescription(featuredPromo) ? promoDescription(featuredPromo) : restaurant.promo_text || `${copy.usePromo}: ${promoCode}`;
  const rewardPoints = Number(featuredReward?.points_required || featuredReward?.visits_required || restaurant.rewards_points || 320);
  const rewardText = featuredReward && rewardDescription(featuredReward) ? rewardDescription(featuredReward) : restaurant.rewards_text || '$10 OFF YOUR ORDER';
  const socialLinks = getSocialLinks(restaurant);

  return <main className={`page ${theme} accent-${accent}`}>
    <div className="topNotice"><span>ORDA DIRECT</span><nav><button type="button" onClick={scrollToMenu}>{copy.menu}</button><button type="button" onClick={() => document.getElementById('side-promos')?.scrollIntoView({ behavior: 'smooth' })}>{copy.promos}</button><button type="button" onClick={() => document.getElementById('side-rewards')?.scrollIntoView({ behavior: 'smooth' })}>{copy.rewards}</button><button type="button" onClick={() => document.getElementById('hours')?.scrollIntoView({ behavior: 'smooth' })}>{copy.hours}</button></nav><div className="language"><button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button><button type="button" className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button><button type="button" className="cartBtn" onClick={() => setCartOpen(true)}>🛒<b>{cartCount}</b></button></div></div>

    <section className="hero cleanHero">{heroVideo && isVideoUrl(heroVideo) ? <SmoothVideo className="heroMedia" src={heroVideo} poster={heroImage} /> : <img className="heroMedia" src={heroImage} alt={storeName} loading="eager" decoding="async" onError={(event) => fallbackForImageElement(event, 'hero', storeName)} />}<div className="heroShade" /><div className="heroContent cleanHeroContent"><div className="heroLockup">{logoImage ? <img className="heroLogo" src={logoImage} alt={storeName} loading="eager" decoding="async" onError={(event) => fallbackForImageElement(event, 'logo', storeName)} /> : <div className="heroLogo brandFallback">ORDA</div>}<div className="heroText"><small>PREMIUM DIRECT STORE</small><h1>{heroTitle}</h1><p>{heroTagline}</p></div></div></div></section>

    <section className="storeInfoBelowHero"><div className="infoLines"><p>📍 {address}</p><p>☎ {phone || copy.noPhone}</p><p className={openStatus.open ? 'openLine isOpen' : 'openLine isClosed'}><span /> {openStatus.text} <em>•</em> {openStatus.nextText}</p></div><div className="serviceActions">{restaurant.pickup_enabled !== false ? <button type="button" className={orderType === 'pickup' ? 'activeService' : ''} onClick={() => setOrderType('pickup')}>🛍 {copy.pickup}</button> : null}{restaurant.delivery_enabled ? <button type="button" className={orderType === 'delivery' ? 'activeService' : ''} onClick={() => setOrderType('delivery')}>🚘 {copy.delivery}</button> : null}<small>⏱ 30-45 MIN</small></div>{socialLinks.length ? <div className="socialStrip" aria-label={copy.followUs}><strong>{copy.followUs}</strong><div>{socialLinks.map((link) => <a key={link.key} className={`socialLink ${link.key}`} href={link.url} target="_blank" rel="noreferrer" aria-label={link.label}><span>{link.icon}</span><b>{link.label}</b></a>)}</div></div> : null}</section>

    {videoItems.length ? <section className="videoMenuSection"><div className="sectionHeader"><small>ORDA VIDEO MENU</small><h2>{copy.videos}</h2></div><div className="videoRail">{videoItems.map((item) => { const videoUrl = resolveStorageUrl(item.videoUrl); const poster = getPoster(item); return <button type="button" key={item.id} className="videoCard" onClick={() => openItem(item)}>{videoUrl ? <SmoothVideo src={videoUrl} poster={poster || undefined} limitSeconds={MENU_VIDEO_LIMIT_SECONDS} /> : <img src={poster} alt={item.name} onError={(event) => fallbackForImageElement(event, item.categoryName, item.name)} />}<span>▶</span><strong>{item.name}</strong><b>{money(item.basePrice)}</b></button>; })}</div></section> : null}

    <section className="layout" id="menu"><div className="mainCol"><div className="categories"><button type="button" className={activeCategory === 'ALL' ? 'active' : ''} onClick={() => setActiveCategory('ALL')}>▦ {copy.allItems}</button>{categories.map((cat) => <button type="button" key={cat.id} className={activeCategory === cat.id ? 'active' : ''} onClick={() => setActiveCategory(cat.id)}>{cat.name}</button>)}{videoItems.length ? <button type="button" className={activeCategory === 'VIDEO_MENU' ? 'active' : ''} onClick={() => setActiveCategory('VIDEO_MENU')}>▶ {copy.videos}</button> : null}</div><h3 className="sectionTitle">{activeCategory === 'VIDEO_MENU' ? copy.videos : activeCategory === 'ALL' ? copy.allItems : categories.find((category) => category.id === activeCategory)?.name}</h3><div className="menuGrid">{visibleItems.length ? visibleItems.map((item) => { const itemImage = getImage(item); const itemVideo = resolveStorageUrl(item.videoUrl); const hasVideo = itemVideo && isVideoUrl(itemVideo); const poster = getPoster(item); return <button type="button" key={item.id} className={hasVideo ? 'itemCard videoItemCard' : 'itemCard'} onClick={() => item.available && openItem(item)}><div className="imageBox">{hasVideo ? <VideoCover src={itemVideo} poster={poster || undefined} title={item.name} autoPlay={false} /> : itemImage ? <img src={itemImage} alt={item.name} loading="lazy" decoding="async" onError={(event) => fallbackForImageElement(event, item.categoryName, item.name)} /> : <img src={fallbackImage(item.categoryName, item.name)} alt={item.name} onError={(event) => fallbackForImageElement(event, item.categoryName, item.name)} />}{!item.available ? <em>{copy.soldOut}</em> : null}</div><div className="itemCopy"><h4>{item.name}</h4><p>{item.description || (hasVideo ? 'Fresh food video item.' : 'Fresh made item from this ORDA storefront.')}</p><strong className="itemPrice">{money(item.basePrice)}</strong><span>⚙ {copy.customize}</span></div></button>; }) : <div className="noItems"><strong>{copy.noItems}</strong><span>{copy.noItemsSub}</span></div>}</div></div>
      <aside className="sideCol"><section className="sideBox mapBox"><h3>📍 {copy.location}</h3><p>{address}</p><iframe title="Store map" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`} /><a className="goldFull" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">➤ {copy.directions}</a></section>{restaurant.promo_enabled !== false ? <section className="sidePromoVisual" id="side-promos"><div className="sidePromoCopy"><small>{copy.limitedOffer}</small><h3>{promoBig}</h3><strong>{promoSmall}</strong><p>{promoDesc}</p><button type="button" onClick={() => applyPromoByCode(promoCode)}>{copy.applyCode}</button></div><img src={sidePromoImage} alt={`${activeCategoryName} promo`} loading="lazy" decoding="async" onError={(event) => fallbackForImageElement(event, activeCategoryName, activeCategoryName)} /></section> : null}{restaurant.rewards_enabled !== false ? <section className="sideRewardVisual" id="side-rewards"><div><small>👑 {featuredReward ? rewardTitle(featuredReward) : 'ORDA REWARDS'}</small><h3>{rewardPoints}</h3><strong>{copy.pointsAvailable}</strong><p>{featuredReward ? rewardText : `${copy.nextReward}: ${rewardText}`}</p><button type="button" onClick={() => (featuredReward ? useReward(featuredReward) : scrollToMenu())}>{copy.viewRewards} →</button></div><img src={sidePromoImage} alt={`${activeCategoryName} rewards`} loading="lazy" decoding="async" onError={(event) => fallbackForImageElement(event, activeCategoryName, activeCategoryName)} /></section> : null}<section className="sideBox"><h3>🔗 {copy.storeDetails}</h3><p>{restaurant.pickup_enabled !== false ? '✅' : '❌'} {copy.pickupAvailable}</p><p>{restaurant.delivery_enabled ? '✅' : '❌'} {copy.deliveryAvailable}</p><p>🚚 {copy.deliveryFee}: {money(Number(restaurant.delivery_fee || 0))}</p><p>🚚 {copy.deliveryRadius}: {Number(restaurant.delivery_radius || 5)} Miles</p><p>⏱ {copy.minimumOrder}: {money(Number(restaurant.delivery_minimum || 0))}</p></section>{socialLinks.length ? <section className="sideBox sideSocialBox"><h3>📲 {copy.social}</h3><div className="sideSocialGrid">{socialLinks.map((link) => <a key={link.key} className={`socialLink ${link.key}`} href={link.url} target="_blank" rel="noreferrer" aria-label={link.label}><span>{link.icon}</span><b>{link.label}</b></a>)}</div></section> : null}<section className="sideBox" id="hours"><h3>🕒 {copy.hours}</h3>{hourRows.map((row) => <div className="hour" key={row.day}><span>{row.day}</span><b>{row.closed ? 'Closed' : `${formatHour(row.open)} - ${formatHour(row.close)}`}</b></div>)}<p className={openStatus.open ? 'green statusNow' : 'red statusNow'}>● {openStatus.text} • {openStatus.nextText}</p></section></aside>
    </section>

    {selectedItem ? <div className="modalBackdrop" onClick={() => setSelectedItem(null)}><section className="modal" onClick={(event) => event.stopPropagation()}><button type="button" className="close" onClick={() => setSelectedItem(null)}>×</button>{resolveStorageUrl(selectedItem.videoUrl) && isVideoUrl(resolveStorageUrl(selectedItem.videoUrl)) ? <SmoothVideo className="modalImg" src={resolveStorageUrl(selectedItem.videoUrl)} poster={getPoster(selectedItem) || undefined} limitSeconds={MENU_VIDEO_LIMIT_SECONDS} controls playWhenVisible={false} /> : getImage(selectedItem) ? <img className="modalImg" src={getImage(selectedItem)} alt={selectedItem.name} onError={(event) => fallbackForImageElement(event, selectedItem.categoryName, selectedItem.name)} /> : null}<div className="modalBody"><div className="modalTop"><div><h2>{selectedItem.name}</h2><p>{selectedItem.description}</p></div><div className="priceBox"><small>{copy.basePrice}</small><strong>{money(selectedItem.basePrice)}</strong><small>{copy.finalPrice}</small><b>{money(selectedTotal)}</b></div></div>{selectedItem.groups.map((group) => <section className="optionGroup" key={group.id}><header><h3>{group.name}</h3><span>{group.required ? copy.required : copy.optional}</span></header><div className="choiceList">{group.choices.map((choice) => { const active = (picked[group.id] || []).includes(choice.id); return <button type="button" key={choice.id} className={active ? 'choice active' : 'choice'} onClick={() => toggleChoice(group, choice)}><span>{choice.name}</span><b>{choice.priceDelta > 0 ? `+${money(choice.priceDelta)}` : '$0.00'}</b><i>{active ? '✓' : ''}</i></button>; })}</div></section>)}<div className="qtyRow"><strong>{copy.quantity}</strong><div><button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button type="button" onClick={() => setQty(qty + 1)}>+</button></div></div><button type="button" className="addBtn" disabled={!canAdd()} onClick={addToCart}>{copy.addToCart} • {money(selectedTotal)}</button></div></section></div> : null}

    <section className="stickyCart"><div className="cartLeft"><span>🛒</span><b>{cartCount}</b></div><div><strong>{cartCount} {copy.items}</strong><p>{copy.cart}</p></div><div className="cartMini">{cart.slice(-3).map((line) => <CartLineMedia key={line.id} line={line} fallbackName={line.name} />)}</div><div className="total"><small>{copy.total}</small><strong>{money(cartTotal)}</strong></div><button type="button" onClick={() => setCartOpen(true)}>{copy.cart} →</button></section>
    {cartOpen ? <div className="cartOverlay" onClick={() => setCartOpen(false)}><aside className="cartPanel" onClick={(event) => event.stopPropagation()}><header><h2>{copy.cart}</h2><button type="button" onClick={() => setCartOpen(false)}>×</button></header><div className="orderTypeBox"><small>{copy.orderType}</small><div><button type="button" className={orderType === 'pickup' ? 'active' : ''} disabled={restaurant.pickup_enabled === false} onClick={() => setOrderType('pickup')}>{copy.pickup}</button><button type="button" className={orderType === 'delivery' ? 'active' : ''} disabled={!restaurant.delivery_enabled} onClick={() => setOrderType('delivery')}>{copy.delivery}</button></div></div>{!cart.length ? <p className="empty">{copy.empty}</p> : null}{cart.map((line) => <div className="cartLine" key={line.id}><CartLineMedia line={line} fallbackName={line.name} /><div className="cartLineBody"><div className="cartLineTop"><h4>{line.name}</h4><button className="removeLine" type="button" onClick={() => removeCartLine(line.id)}>{copy.remove}</button></div>{line.selections.map((selection, index) => <p key={index}>{selection.groupName}: {selection.choiceNames.join(', ')}</p>)}<div className="cartEditRow"><div className="cartQty"><button type="button" onClick={() => updateCartQty(line.id, line.quantity - 1)}>−</button><span>{line.quantity}</span><button type="button" onClick={() => updateCartQty(line.id, line.quantity + 1)}>+</button></div><strong>{money(line.total)}</strong></div></div></div>)}<div className="promoApply"><div><input value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder={copy.promoCode} /><button type="button" onClick={() => applyPromoByCode()}>{copy.apply}</button></div>{promoMessage ? <p>{promoMessage}</p> : null}</div><div className="cartTotals"><div><span>{copy.subtotal}</span><b>{money(cartSubtotal)}</b></div>{deliveryFee > 0 ? <div><span>{copy.deliveryFee}</span><b>{money(deliveryFee)}</b></div> : null}{promoDiscount > 0 ? <div className="discountLine"><span>{copy.discount}</span><b>-{money(promoDiscount)}</b></div> : null}<div className="grandTotal"><span>{copy.total}</span><b>{money(cartTotal)}</b></div></div><button type="button" className="addBtn" onClick={checkout} disabled={!cart.length || checkingOut}>{checkingOut ? copy.working : `${copy.checkout} • ${money(cartTotal)}`}</button></aside></div> : null}
    <style jsx global>{styles}</style>
  </main>;
}

const styles = `
html,body{margin:0;padding:0;width:100%;max-width:100vw;overflow-x:hidden}*{box-sizing:border-box}button{font:inherit}.page{--accent:#d8bf91;--accentText:#16110b;--accentGlow:rgba(216,191,145,.28);--accentSoft:rgba(216,191,145,.18);--accentSofter:rgba(216,191,145,.08);min-height:100vh;width:100%;max-width:100vw;overflow-x:hidden;background:#080807;color:#f7f1e6;font-family:Inter,system-ui,sans-serif;padding-bottom:118px}.page.accent-silver{--accent:#cbd5e1;--accentText:#111827;--accentGlow:rgba(148,163,184,.32);--accentSoft:rgba(148,163,184,.22);--accentSofter:rgba(148,163,184,.09)}.page.accent-gold{--accent:#d8bf91;--accentText:#16110b;--accentGlow:rgba(216,191,145,.28);--accentSoft:rgba(216,191,145,.18);--accentSofter:rgba(216,191,145,.08)}.page.accent-orange{--accent:#f97316;--accentText:#fff;--accentGlow:rgba(249,115,22,.32);--accentSoft:rgba(249,115,22,.22);--accentSofter:rgba(249,115,22,.09)}.page.accent-red{--accent:#dc2626;--accentText:#fff;--accentGlow:rgba(220,38,38,.32);--accentSoft:rgba(220,38,38,.22);--accentSofter:rgba(220,38,38,.09)}.page.accent-blue{--accent:#2563eb;--accentText:#fff;--accentGlow:rgba(37,99,235,.32);--accentSoft:rgba(37,99,235,.22);--accentSofter:rgba(37,99,235,.09)}.page.accent-purple{--accent:#7c3aed;--accentText:#fff;--accentGlow:rgba(124,58,237,.32);--accentSoft:rgba(124,58,237,.22);--accentSofter:rgba(124,58,237,.09)}.page.accent-lime{--accent:#84cc16;--accentText:#111;--accentGlow:rgba(132,204,22,.34);--accentSoft:rgba(132,204,22,.24);--accentSofter:rgba(132,204,22,.1)}.page.accent-pink{--accent:#ec4899;--accentText:#fff;--accentGlow:rgba(236,72,153,.34);--accentSoft:rgba(236,72,153,.24);--accentSofter:rgba(236,72,153,.1)}.page.accent-mono{--accent:#111827;--accentText:#fff;--accentGlow:rgba(17,24,39,.28);--accentSoft:rgba(17,24,39,.22);--accentSofter:rgba(17,24,39,.09)}.loader{min-height:100vh;display:grid;place-items:center;font-weight:900}.page.light{background:#f5efe2;color:#171411}.page.light .topNotice{background:rgba(255,251,242,.94);color:#171411;border-bottom:1px solid #dfd3bb}.page.light .topNotice button{color:#171411}.page.light .categories,.page.light .itemCard,.page.light .sideBox,.page.light .stickyCart,.page.light .cartPanel,.page.light .modal,.page.light .storeInfoBelowHero,.page.light .noItems{background:#fffaf0;color:#171411;border-color:#dfd3bb}.page.light .itemCopy p,.page.light .modalBody p{color:#4a4034}.page.light .choice{background:#fff6e4;color:#171411;border-color:#dfd3bb}.page.light .choice.active{background:#f7ebd0;border-color:var(--accent)}.page.light .priceBox{background:#fff6e4;border-color:#dfd3bb}.topNotice{height:64px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 clamp(14px,3vw,34px);background:rgba(8,8,7,.92);backdrop-filter:blur(18px);border-bottom:1px solid var(--accentSoft);position:sticky;top:0;z-index:30}.topNotice span{font-weight:950;white-space:nowrap;color:var(--accent);letter-spacing:.16em}.topNotice nav{display:flex;gap:28px}.topNotice nav button{font-weight:850;color:#f7f1e6;background:transparent;border:0;cursor:pointer}.topNotice nav button:hover{color:var(--accent)}.language{display:flex;justify-content:flex-end;align-items:center;gap:8px}.language button{height:40px;padding:0 16px;border-radius:12px;background:#171715;color:#f7f1e6;border:1px solid var(--accentSoft);font-weight:900;cursor:pointer}.language .on{background:var(--accent);color:var(--accentText);border-color:var(--accent);box-shadow:0 10px 22px var(--accentGlow)}.cartBtn{position:relative}.cartBtn b{position:absolute;right:-8px;top:-8px;background:var(--accent);color:var(--accentText);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px}.hero{height:clamp(520px,62vw,780px);width:100%;position:relative;overflow:hidden;background:#000}.heroMedia{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(1.08) contrast(1.1)}.heroShade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.86),rgba(0,0,0,.38),rgba(0,0,0,.54)),linear-gradient(0deg,rgba(8,8,7,1),rgba(8,8,7,.08) 46%,rgba(8,8,7,.28))}.page.light .heroShade{background:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.30),rgba(0,0,0,.50)),linear-gradient(0deg,rgba(245,239,226,1),rgba(0,0,0,.06) 50%,rgba(0,0,0,.25))}.heroContent{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:flex-start;padding:clamp(26px,6vw,78px)}.heroLockup{max-width:940px;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:clamp(14px,2.8vw,28px);padding-top:18px;color:#fff}.heroLogo,.brandFallback{width:clamp(78px,10vw,132px);height:clamp(78px,10vw,132px);border-radius:28px;object-fit:cover;background:var(--accent);color:var(--accentText);display:grid;place-items:center;font-weight:1000;box-shadow:0 18px 50px rgba(0,0,0,.48),0 0 0 5px var(--accentSoft);border:3px solid rgba(255,255,255,.76);flex:0 0 auto}.heroText small{display:block;margin-bottom:6px;color:var(--accent);font-size:clamp(12px,1.4vw,18px);font-weight:1000;letter-spacing:.26em;text-shadow:0 8px 24px rgba(0,0,0,.85)}.heroText h1{margin:0;color:#fff;font-size:clamp(46px,8vw,118px);line-height:.82;font-weight:1000;letter-spacing:-.08em;text-transform:uppercase;text-shadow:0 4px 0 rgba(0,0,0,.18),0 12px 46px rgba(0,0,0,.9)}.heroText p{margin:14px 0 0;max-width:690px;color:#fff;font-size:clamp(19px,2.7vw,36px);font-weight:1000;letter-spacing:-.03em;line-height:1.05;text-shadow:0 8px 28px rgba(0,0,0,.78)}.storeInfoBelowHero{width:min(100% - 40px,1400px);margin:-38px auto 0;background:rgba(14,14,12,.96);border:1px solid var(--accentSoft);border-radius:28px;padding:24px;color:#f7f1e6;position:relative;z-index:5;box-shadow:0 24px 80px rgba(0,0,0,.35)}.infoLines{display:grid;gap:8px}.infoLines p{margin:0;font-size:17px;font-weight:850}.openLine{display:flex;align-items:center;gap:9px}.openLine span{width:17px;height:17px;border-radius:999px;display:inline-block}.openLine.isOpen span{background:#79d45c}.openLine.isClosed span{background:#ef4444}.openLine em{font-style:normal;opacity:.65}.serviceActions{display:flex;gap:12px;margin-top:22px;align-items:center;flex-wrap:wrap}.serviceActions button{height:56px;padding:0 30px;border-radius:14px;border:1px solid var(--accentSoft);background:#191916;color:#f7f1e6;font-weight:1000}.serviceActions button.activeService{background:var(--accent);color:var(--accentText);border-color:var(--accent);box-shadow:0 12px 30px var(--accentGlow)}.serviceActions small{font-weight:900;color:inherit}.socialStrip{margin-top:20px;padding-top:18px;border-top:1px solid var(--accentSoft);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.socialStrip>strong{font-weight:1000;color:var(--accent);letter-spacing:.08em;text-transform:uppercase}.socialStrip>div,.sideSocialGrid{display:flex;gap:10px;flex-wrap:wrap}.socialLink{height:46px;display:inline-flex;align-items:center;gap:9px;border-radius:999px;padding:0 14px;text-decoration:none;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);font-weight:1000}.socialLink span{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:1000}.socialLink.instagram span{background:radial-gradient(circle at 30% 107%,#fdf497 0,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285aeb 90%)}.socialLink.facebook span{background:#1877f2;font-size:20px;font-family:Arial,sans-serif}.socialLink.tiktok span{background:#000;text-shadow:2px 0 #25f4ee,-2px 0 #fe2c55}.socialLink.youtube span{background:#ff0000}.videoMenuSection{max-width:1460px;margin:26px auto 0;padding:0 20px}.sectionHeader{display:flex;align-items:end;justify-content:space-between;margin-bottom:12px}.sectionHeader small{color:var(--accent);font-weight:1000;letter-spacing:.18em}.sectionHeader h2{margin:0;font-size:34px;letter-spacing:-.05em}.videoRail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.videoCard{position:relative;min-height:260px;border:1px solid var(--accentSoft);border-radius:22px;overflow:hidden;background:#111;color:#fff;text-align:left;padding:0;box-shadow:0 18px 45px rgba(0,0,0,.22)}.videoCard video,.videoCard img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.videoCard:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.86),rgba(0,0,0,.18))}.videoCard span,.videoCard strong,.videoCard b{position:absolute;z-index:2}.videoCard span{top:14px;right:14px;width:46px;height:46px;border-radius:999px;background:var(--accent);color:var(--accentText);display:grid;place-items:center;font-weight:1000}.videoCard strong{left:16px;bottom:46px;font-size:20px;line-height:1.05}.videoCard b{left:16px;bottom:18px;color:var(--accent);font-size:19px}.layout{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:24px;padding:0 20px 40px;max-width:1460px;margin:26px auto 0;width:100%}.mainCol{min-width:0;width:100%}.sideCol{padding-top:20px;width:100%;max-width:390px;min-width:0}.categories{display:flex;overflow-x:auto;background:#10100e;border:1px solid var(--accentSoft);border-radius:18px;padding:10px;position:sticky;top:74px;z-index:20;max-width:100%;scrollbar-width:none}.categories::-webkit-scrollbar{display:none}.categories button{flex:0 0 auto;height:54px;padding:0 24px;background:transparent;color:inherit;border:0;border-right:1px solid var(--accentSoft);font-weight:1000;text-transform:uppercase;white-space:nowrap;cursor:pointer}.categories .active{color:var(--accent);border-bottom:4px solid var(--accent)}.sectionTitle{font-size:34px;margin:28px 0 16px;text-transform:uppercase;letter-spacing:-.04em}.menuGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;width:100%;align-items:start}.itemCard{text-align:left;padding:0;background:#11110f;color:inherit;border:1px solid var(--accentSoft);border-radius:20px;overflow:hidden;cursor:pointer;min-width:0;transition:.18s ease}.itemCard:hover{transform:translateY(-3px);border-color:var(--accent);box-shadow:0 20px 50px rgba(0,0,0,.28),0 0 0 1px var(--accentSoft)}.videoItemCard{border-color:rgba(239,68,68,.38)}.imageBox{height:190px;position:relative;background:#111;overflow:hidden}.imageBox img,.imageBox video{width:100%;height:100%;object-fit:cover}.videoCoverBox{position:absolute;inset:0;background:#111;overflow:hidden}.videoCoverBox img,.videoCoverBox video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.1) contrast(1.05)}.videoCoverShade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.44),rgba(0,0,0,.02) 55%,rgba(0,0,0,.28))}.videoCoverBadge,.videoPill{position:absolute;left:10px;top:10px;background:rgba(0,0,0,.72);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:7px 10px;font-size:12px;font-weight:1000;z-index:2}.missingImage{width:100%;height:100%;background:linear-gradient(135deg,#1b1b1b,#050505)}.imageBox em{position:absolute;top:10px;right:10px;background:#000;padding:6px 10px;border-radius:20px;font-style:normal}.itemCopy{padding:16px}.itemCopy h4{font-size:21px;line-height:1.05;margin:0;text-transform:uppercase}.itemCopy p{font-size:14px;line-height:1.35;color:#c8bfae;min-height:50px}.itemPrice{display:block;color:var(--accent);font-size:25px;margin:8px 0;font-weight:1000}.itemCopy span{display:block;color:var(--accent);font-weight:900}.noItems{grid-column:1/-1;min-height:220px;border:1px dashed var(--accentSoft);border-radius:18px;background:#11110f;color:#fff;display:grid;place-items:center;text-align:center;padding:30px}.sideBox{background:#11110f;border:1px solid var(--accentSoft);border-radius:20px;margin-bottom:14px;padding:18px;overflow:hidden}.sideBox h3{font-size:20px;margin:0 0 14px;text-transform:uppercase}.sideBox p{margin:8px 0}.sideBox iframe{width:100%;height:210px;border:0;border-radius:14px;filter:grayscale(.45)}.goldFull{display:block;text-align:center;background:var(--accent);color:var(--accentText);text-decoration:none;font-weight:1000;padding:14px;border-radius:14px;margin-top:12px;box-shadow:0 12px 30px var(--accentGlow)}.sidePromoVisual,.sideRewardVisual{position:relative;min-height:252px;border-radius:22px;overflow:hidden;margin-bottom:14px;border:1px solid var(--accentSoft);background:#071018;box-shadow:0 18px 55px rgba(0,0,0,.25)}.sidePromoVisual:before,.sideRewardVisual:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,8,12,.95),rgba(5,8,12,.82) 50%,rgba(5,8,12,.15)),radial-gradient(circle at 20% 20%,var(--accentGlow),transparent 35%);z-index:1}.sidePromoVisual img,.sideRewardVisual img{position:absolute;right:-22px;top:18px;width:190px;height:190px;object-fit:cover;border-radius:999px;z-index:0;filter:saturate(1.12) contrast(1.08);box-shadow:0 20px 50px rgba(0,0,0,.55)}.sidePromoCopy,.sideRewardVisual>div{position:relative;z-index:2;padding:24px;max-width:255px}.sidePromoVisual small,.sideRewardVisual small{display:block;color:#fff;font-weight:1000;letter-spacing:.08em;opacity:.9}.sidePromoVisual h3,.sideRewardVisual h3{margin:10px 0 2px;color:#fff;font-size:50px;line-height:.9;font-weight:1000;letter-spacing:-.06em}.sideRewardVisual h3{color:var(--accent)}.sidePromoVisual strong,.sideRewardVisual strong{display:block;color:var(--accent);font-size:15px;font-weight:1000;text-transform:uppercase}.sidePromoVisual p,.sideRewardVisual p{margin:14px 0 16px;color:#f7f1e6;font-weight:800}.sidePromoVisual button,.sideRewardVisual button{height:48px;border:1px solid var(--accent);border-radius:12px;background:var(--accent);color:var(--accentText);font-weight:1000;padding:0 22px;cursor:pointer;box-shadow:0 12px 30px var(--accentGlow)}.sideRewardVisual button{background:transparent;color:var(--accent)}.hour{display:flex;justify-content:space-between;font-size:14px;margin:8px 0;gap:10px}.green{color:#79d45c!important}.red{color:#ef4444!important}.statusNow{font-weight:950}.modalBackdrop,.cartOverlay{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:80;display:flex;align-items:center;justify-content:center;padding:18px}.modal,.cartPanel{width:min(100%,720px);max-height:92vh;overflow:auto;background:#11110f;border:1px solid var(--accentSoft);border-radius:24px;position:relative}.close{position:absolute;right:16px;top:14px;background:#000;color:#fff;border:0;border-radius:50%;width:42px;height:42px;font-size:28px;z-index:2;cursor:pointer}.modalImg{width:100%;height:310px;object-fit:cover;background:#090909}.modalBody{padding:24px}.modalTop{display:grid;grid-template-columns:minmax(0,1fr) 170px;gap:20px;align-items:start}.modalBody h2{font-size:34px;margin:0}.modalBody p{color:#c8bfae}.priceBox{background:#171713;border:1px solid var(--accentSoft);border-radius:14px;padding:16px;text-align:right}.priceBox small{display:block;color:#a99f8e;font-weight:900;text-transform:uppercase;font-size:11px}.priceBox strong{display:block;color:var(--accent);font-size:24px;margin-bottom:12px}.priceBox b{display:block;color:var(--accent);font-size:32px}.optionGroup{margin-top:20px}.optionGroup header{display:flex;justify-content:space-between;align-items:center;gap:14px}.optionGroup h3{margin:0;text-transform:uppercase}.optionGroup span{color:var(--accent);font-weight:900}.choiceList{display:grid;gap:10px;margin-top:12px}.choice{display:grid;grid-template-columns:minmax(0,1fr) auto 26px;gap:12px;align-items:center;background:#171713;color:#f7f1e6;border:1px solid var(--accentSoft);border-radius:12px;padding:16px;text-align:left;cursor:pointer}.choice.active{border-color:var(--accent);background:var(--accentSofter)}.choice b{color:var(--accent)}.choice i{font-style:normal;color:var(--accent);font-weight:1000}.qtyRow{display:flex;justify-content:space-between;align-items:center;margin:26px 0}.qtyRow div{display:flex;align-items:center;gap:14px;background:#171713;border-radius:30px;padding:6px}.qtyRow button{width:38px;height:38px;border:0;border-radius:50%;background:#27241d;color:#f7f1e6;font-size:22px;cursor:pointer}.addBtn{width:100%;height:62px;border:0;border-radius:14px;background:var(--accent);color:var(--accentText);font-weight:1000;font-size:17px;cursor:pointer;box-shadow:0 12px 30px var(--accentGlow)}.addBtn:disabled{opacity:.4}.stickyCart{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);width:calc(100% - 24px);max-width:1100px;min-height:86px;background:rgba(247,241,230,.94);color:#171411;border:1px solid var(--accentSoft);border-radius:18px;z-index:50;display:grid;grid-template-columns:62px 140px minmax(0,1fr) 150px 240px;gap:16px;align-items:center;padding:12px 16px;backdrop-filter:blur(14px);box-shadow:0 20px 60px rgba(0,0,0,.3)}.cartLeft{position:relative;font-size:36px;color:#171411}.cartLeft b{position:absolute;top:-8px;right:2px;background:var(--accent);color:var(--accentText);border-radius:50%;font-size:14px;width:26px;height:26px;display:grid;place-items:center}.stickyCart strong{font-size:19px}.stickyCart p{margin:4px 0 0}.cartMini{display:flex;gap:10px;overflow:hidden;min-width:0}.cartMini img,.cartMini video{width:72px;height:54px;object-fit:cover;border-radius:10px;background:#111}.total small{display:block;color:#857b6c}.total strong{font-size:31px}.stickyCart>button{height:60px;border:0;border-radius:14px;background:var(--accent);color:var(--accentText);font-size:20px;font-weight:1000;cursor:pointer;box-shadow:0 12px 30px var(--accentGlow)}.cartPanel{padding:22px}.cartPanel header{display:flex;justify-content:space-between;align-items:center}.cartPanel header button{background:transparent;border:0;color:inherit;font-size:34px;cursor:pointer}.empty{color:#a99f8e}.orderTypeBox{background:rgba(255,255,255,.04);border:1px solid var(--accentSoft);border-radius:16px;padding:12px;margin-bottom:16px}.orderTypeBox small{display:block;color:#a99f8e;font-weight:1000;margin-bottom:8px}.orderTypeBox div{display:grid;grid-template-columns:1fr 1fr;gap:8px}.orderTypeBox button{height:46px;border:0;border-radius:12px;background:#1a1915;color:#f7f1e6;font-weight:1000;cursor:pointer}.orderTypeBox button.active{background:var(--accent);color:var(--accentText)}.orderTypeBox button:disabled{opacity:.35;cursor:not-allowed}.cartLine{display:grid;grid-template-columns:90px 1fr;gap:14px;border-bottom:1px solid var(--accentSoft);padding:14px 0}.cartLine img,.cartLine video,.cartLine>div:first-child{width:90px;height:76px;border-radius:10px;object-fit:cover;background:#111}.cartLineBody{min-width:0}.cartLineTop{display:flex;align-items:start;justify-content:space-between;gap:12px}.cartLine h4{margin:0}.cartLine p{margin:4px 0;color:#a99f8e;font-size:13px}.cartLine strong{color:var(--accent)}.removeLine{border:0;background:#fff1f1;color:#991b1b;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:1000;cursor:pointer}.cartEditRow{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px}.cartQty{display:flex;align-items:center;gap:10px;background:var(--accentSofter);border-radius:999px;padding:5px}.cartQty button{width:28px;height:28px;border:0;border-radius:999px;background:var(--accent);color:var(--accentText);font-weight:1000;cursor:pointer}.cartQty span{min-width:22px;text-align:center;font-weight:1000}.promoApply{margin:16px 0;background:var(--accentSofter);border:1px solid var(--accentSoft);border-radius:16px;padding:12px}.promoApply div{display:grid;grid-template-columns:1fr 100px;gap:8px}.promoApply input{height:46px;border:0;border-radius:12px;padding:0 14px;font-weight:900}.promoApply button{border:0;border-radius:12px;background:var(--accent);color:var(--accentText);font-weight:1000}.promoApply p{margin:8px 0 0;color:var(--accent);font-weight:900}.cartTotals{border-top:1px solid var(--accentSoft);margin-top:16px;padding-top:14px;display:grid;gap:8px}.cartTotals div{display:flex;justify-content:space-between;align-items:center}.cartTotals span{color:#a99f8e;font-weight:900}.cartTotals b{font-size:18px}.discountLine b,.discountLine span{color:#79d45c}.grandTotal{border-top:1px solid var(--accentSoft);padding-top:12px;margin-top:4px}.grandTotal b{font-size:30px;color:var(--accent)}@media(max-width:1180px){.layout{grid-template-columns:1fr;padding:0 16px 40px}.sideCol{max-width:100%;padding-top:0}.menuGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.stickyCart{grid-template-columns:54px 1fr 140px 210px}.cartMini{display:none}.topNotice{grid-template-columns:1fr auto}.topNotice nav{display:none}.sidePromoVisual,.sideRewardVisual{min-height:230px}.sidePromoVisual img,.sideRewardVisual img{right:20px}.videoRail{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:720px){.topNotice{height:56px;padding:0 12px}.topNotice span{font-size:11px}.language button:not(.cartBtn){padding:0 10px}.hero{height:520px}.heroContent{align-items:flex-start;justify-content:flex-start;padding:22px 18px}.heroLockup{grid-template-columns:auto 1fr;gap:12px;width:100%;padding-top:4px}.heroLogo,.brandFallback{width:74px;height:74px;border-radius:18px}.heroText small{font-size:10px;letter-spacing:.18em;margin-bottom:5px}.heroText h1{font-size:43px;line-height:.88}.heroText p{font-size:20px;margin-top:8px;line-height:1.08}.storeInfoBelowHero{width:calc(100% - 24px);padding:18px;border-radius:18px;margin-top:-28px}.infoLines p{font-size:14px}.serviceActions button{height:50px;padding:0 17px}.socialStrip{display:grid}.socialStrip>div{display:grid;grid-template-columns:1fr 1fr}.socialLink{justify-content:center}.categories{top:56px}.categories button{height:50px;padding:0 18px}.sectionTitle{font-size:26px}.menuGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.imageBox{height:112px}.itemCopy{padding:10px}.itemCopy h4{font-size:13px}.itemCopy p{font-size:11px;min-height:38px}.itemPrice{font-size:17px}.itemCopy span{font-size:11px}.modalBackdrop{align-items:flex-end;padding:0}.modal{border-radius:22px 22px 0 0;max-height:94vh}.modalImg{height:210px}.modalTop{grid-template-columns:1fr}.priceBox{text-align:left}.stickyCart{bottom:8px;width:calc(100% - 12px);grid-template-columns:44px 1fr 118px;min-height:74px;padding:10px}.stickyCart .total{display:none}.stickyCart strong{font-size:16px}.stickyCart p{font-size:12px}.stickyCart>button{height:52px;font-size:14px}.cartLine{grid-template-columns:72px 1fr}.cartLine img,.cartLine video,.cartLine>div:first-child{width:72px;height:66px}.sidePromoVisual h3,.sideRewardVisual h3{font-size:42px}.sidePromoVisual img,.sideRewardVisual img{width:160px;height:160px;right:-20px}.videoRail{display:flex;overflow-x:auto;padding-bottom:8px}.videoCard{flex:0 0 260px;min-height:330px}.sectionHeader h2{font-size:28px}}@media(max-width:420px){.menuGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.imageBox{height:155px}.heroText h1{font-size:38px}.heroText p{font-size:18px}.sidePromoVisual img,.sideRewardVisual img{opacity:.5}.sidePromoCopy,.sideRewardVisual>div{max-width:100%}}
`;
