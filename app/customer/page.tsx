'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type TabKey = 'home' | 'discover' | 'orders' | 'favorites' | 'posts' | 'profile';

type CustomerProfileRow = {
  id?: string | null;
  user_id?: string | null;
  customer_id?: string | null;
  name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RestaurantRow = {
  id: string;
  name: string | null;
  slug: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  category?: string | null;
  business_type?: string | null;
  store_type?: string | null;
  description?: string | null;
  logo_image?: string | null;
  logo_url?: string | null;
  hero_image?: string | null;
  hero_url?: string | null;
  cover_image?: string | null;
  cover_url?: string | null;
  cover_video?: string | null;
  hero_video?: string | null;
  hero_video_url?: string | null;
  hero_video_file?: string | null;
  public_visible?: boolean | null;
  featured?: boolean | null;
  views?: number | null;
  created_at?: string | null;
};

type CategoryRow = {
  id: string;
  restaurant_id: string | null;
  name: string | null;
  sort_order?: number | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string | null;
  category_id?: string | null;
  name: string | null;
  description?: string | null;
  image_url?: string | null;
  image_file?: string | null;
  image_path?: string | null;
  image?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  item_image?: string | null;
  item_image_url?: string | null;
  product_image?: string | null;
  product_image_url?: string | null;
  product_photo?: string | null;
  product_photo_url?: string | null;
  media_url?: string | null;
  media_file?: string | null;
  media_path?: string | null;
  public_url?: string | null;
  upload_url?: string | null;
  file_url?: string | null;
  video_url?: string | null;
  video_file?: string | null;
  video_path?: string | null;
  video_storage_path?: string | null;
  video_public_url?: string | null;
  video?: string | null;
  item_video?: string | null;
  item_video_file?: string | null;
  item_video_url?: string | null;
  menu_video?: string | null;
  menu_video_file?: string | null;
  menu_video_url?: string | null;
  product_video?: string | null;
  product_video_file?: string | null;
  product_video_url?: string | null;
  product_video_path?: string | null;
  media_video?: string | null;
  media_video_file?: string | null;
  media_video_url?: string | null;
  media_type?: string | null;
  product_media?: unknown;
  item_media?: unknown;
  gallery?: unknown;
  images?: unknown;
  videos?: unknown;
  media?: unknown;
  metadata?: unknown;
  data?: unknown;
  price?: number | null;
  base_price?: number | null;
  availability?: string | null;
  is_available?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
};

type RestaurantMediaRow = {
  id: string;
  restaurant_id: string | null;
  media_type?: string | null;
  media_url?: string | null;
  media_file?: string | null;
  media_path?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  public_url?: string | null;
  upload_url?: string | null;
  file_url?: string | null;
  source_url?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  poster?: string | null;
  poster_url?: string | null;
  gallery?: unknown;
  images?: unknown;
  videos?: unknown;
  media?: unknown;
  metadata?: unknown;
  data?: unknown;
  caption?: string | null;
  likes?: number | null;
  views?: number | null;
  created_at?: string | null;
};

type CustomerPostRow = {
  id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  caption?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  likes?: number | null;
  likes_count?: number | null;
  views?: number | null;
  comments_count?: number | null;
  created_at?: string | null;
};

type OrderRow = {
  id: string;
  restaurant_id?: string | null;
  customer_id?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
  status?: string | null;
  total?: number | null;
  subtotal?: number | null;
  created_at?: string | null;
  restaurants?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
    logo_image?: string | null;
    hero_image?: string | null;
    cover_image?: string | null;
  } | null;
};

type FavoriteRow = {
  id: string;
  customer_id?: string | null;
  customer_email?: string | null;
  restaurant_id?: string | null;
  store_id?: string | null;
  restaurants?: RestaurantRow | null;
};

type FeedTile = {
  id: string;
  sourceTable: 'menu_items' | 'restaurant_media' | 'restaurants' | 'customer_posts';
  rawId: string;
  storeId: string;
  slug: string;
  storeName: string;
  logoUrl: string;
  collection: string;
  city: string;
  state: string;
  address: string;
  sellerType: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaCandidates: string[];
  posterUrl: string;
  posterCandidates: string[];
  title: string;
  subtitle: string;
  price: number;
  likes: number;
  views: number;
  featured: boolean;
  createdAt: string;
  isCustomerPost: boolean;
};

const STORAGE_BUCKET = 'product-images';
const IMAGE_BUCKET = 'product-images';
const VIDEO_BUCKET = 'product-videos';
const BRANDING_BUCKET = 'branding';
const STORE_MEDIA_BUCKET = 'store-media';
const CUSTOMER_POST_BUCKET = 'customer-posts';
const PROFILE_BUCKET = 'customer-posts';
const CUSTOMER_LOGIN_PATH = '/customer/login';

const FILTERS = [
  'All',
  'Videos',
  'Trending',
  'Featured',
  'Streetwear',
  'Luxury',
  'Sneakers',
  'Denim',
  'Hoodies',
  'Women',
  'Men',
  'Kids',
  'Newborn',
  'Jewelry',
  'Accessories',
  'Vintage',
  'Customer Posts',
];

const NAV_ITEMS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'discover', label: 'Discover', icon: '⌕' },
  { key: 'orders', label: 'Orders', icon: '▣' },
  { key: 'favorites', label: 'Saved', icon: '♥' },
  { key: 'posts', label: 'Posts', icon: '◉' },
  { key: 'profile', label: 'Profile', icon: '○' },
];

function stableNumberSeed(value: string, min: number, max: number) {
  const clean = String(value || 'vault').trim() || 'vault';
  let hash = 0;
  for (let index = 0; index < clean.length; index += 1) hash = (hash * 31 + clean.charCodeAt(index)) >>> 0;
  return min + (hash % Math.max(1, max - min + 1));
}

function displayCount(value: number) {
  if (value >= 1000) {
    const compact = value / 1000;
    return `${compact.toFixed(compact >= 10 ? 0 : 1)}k`;
  }
  return String(value);
}

function money(value?: number | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function cleanText(value?: string | null, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function normalizeText(value?: string | null) {
  return String(value || '')
    .toLowerCase()
    .replace(/[.,#]/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bucketUrl(path: string, bucket = STORAGE_BUCKET) {
  const clean = String(path || '').replace(/^\/+/, '');
  if (!clean) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(clean);
  return data?.publicUrl || '';
}

function isFullUrl(value?: string | null) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function isVideoUrl(value?: string | null) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(value || '').trim());
}

function isImageUrl(value?: string | null) {
  return /\.(jpg|jpeg|png|webp|avif|gif)(\?.*)?$/i.test(String(value || '').trim());
}

function resolveStorageUrl(value?: string | null, bucket = STORAGE_BUCKET) {
  return mediaCandidates(value, bucket)[0] || '';
}

function mediaCandidates(value?: string | null, bucket = STORAGE_BUCKET) {
  const raw = String(value || '').trim();
  if (!raw || raw === 'null' || raw === 'undefined') return [];

  const list: string[] = [];
  const seen = new Set<string>();

  const add = (url: string) => {
    const clean = String(url || '').trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    list.push(clean);
  };

  if (raw.startsWith('blob:') || raw.startsWith('data:') || isFullUrl(raw) || raw.startsWith('/')) {
    add(raw);
    return list;
  }

  const decoded = decodeURIComponent(raw);
  const cleaned = decoded
    .replace(/^public\//, '')
    .replace(/^storage\/v1\/object\/public\//, '')
    .replace(/^object\/public\//, '')
    .replace(/^\/+/, '');

  const lower = cleaned.toLowerCase();

  if (bucket === VIDEO_BUCKET || bucket === 'product-videos') {
    add(bucketUrl(cleaned, VIDEO_BUCKET));

    if (!/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(cleaned)) {
      ['mp4', 'webm', 'mov', 'm4v'].forEach((ext) => add(bucketUrl(`${cleaned}.${ext}`, VIDEO_BUCKET)));
    }

    if (lower.startsWith('product-videos/')) {
      const stripped = cleaned.slice('product-videos/'.length);
      add(bucketUrl(stripped, VIDEO_BUCKET));
      if (!/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(stripped)) {
        ['mp4', 'webm', 'mov', 'm4v'].forEach((ext) => add(bucketUrl(`${stripped}.${ext}`, VIDEO_BUCKET)));
      }
    }

    return list;
  }

  if (bucket === IMAGE_BUCKET || bucket === 'product-images') {
    if (lower.startsWith('product-images/')) add(bucketUrl(cleaned.slice('product-images/'.length), IMAGE_BUCKET));
    add(bucketUrl(cleaned, IMAGE_BUCKET));
    return list;
  }

  if (bucket === BRANDING_BUCKET || bucket === 'branding') {
    if (lower.startsWith('branding/')) add(bucketUrl(cleaned.slice('branding/'.length), BRANDING_BUCKET));
    add(bucketUrl(cleaned, BRANDING_BUCKET));
    return list;
  }

  if (bucket === STORE_MEDIA_BUCKET || bucket === 'store-media') {
    if (lower.startsWith('store-media/')) add(bucketUrl(cleaned.slice('store-media/'.length), STORE_MEDIA_BUCKET));
    add(bucketUrl(cleaned, STORE_MEDIA_BUCKET));
    return list;
  }

  if (bucket === CUSTOMER_POST_BUCKET || bucket === 'customer-posts') {
    if (lower.startsWith('customer-posts/')) add(bucketUrl(cleaned.slice('customer-posts/'.length), CUSTOMER_POST_BUCKET));
    add(bucketUrl(cleaned, CUSTOMER_POST_BUCKET));
    return list;
  }

  if (lower.startsWith('product-videos/')) return mediaCandidates(cleaned.slice('product-videos/'.length), VIDEO_BUCKET);
  if (lower.startsWith('product-images/')) return mediaCandidates(cleaned.slice('product-images/'.length), IMAGE_BUCKET);
  if (lower.startsWith('branding/')) return mediaCandidates(cleaned.slice('branding/'.length), BRANDING_BUCKET);
  if (lower.startsWith('store-media/')) return mediaCandidates(cleaned.slice('store-media/'.length), STORE_MEDIA_BUCKET);
  if (lower.startsWith('customer-posts/')) return mediaCandidates(cleaned.slice('customer-posts/'.length), CUSTOMER_POST_BUCKET);

  add(bucketUrl(cleaned, bucket));
  return list;
}

function firstCandidateList(values: Array<string | null | undefined>, bucket = STORAGE_BUCKET) {
  const list: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    mediaCandidates(value, bucket).forEach((url) => {
      if (!seen.has(url)) {
        seen.add(url);
        list.push(url);
      }
    });
  });

  return list;
}


function firstResolved(values: Array<string | null | undefined>, bucket = STORAGE_BUCKET) {
  for (const value of values) {
    const url = resolveStorageUrl(value, bucket);
    if (url) return url;
  }
  return '';
}

function collectMediaStrings(value: unknown, output: string[] = []) {
  if (value === null || value === undefined) return output;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return output;

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        collectMediaStrings(JSON.parse(trimmed), output);
        return output;
      } catch {
        // Keep raw string.
      }
    }

    output.push(trimmed);
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectMediaStrings(item, output));
    return output;
  }

  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      const lower = key.toLowerCase();
      if (
        lower.includes('url') ||
        lower.includes('image') ||
        lower.includes('photo') ||
        lower.includes('video') ||
        lower.includes('media') ||
        lower.includes('file') ||
        lower.includes('path') ||
        lower.includes('thumbnail') ||
        lower.includes('poster') ||
        lower.includes('gallery')
      ) {
        collectMediaStrings(item, output);
      }
    });
  }

  return output;
}

function videoCandidate(value?: string | null, mediaType?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const resolved = resolveStorageUrl(raw);
  if (!resolved) return '';

  const type = normalizeText(mediaType);
  const rawLower = raw.toLowerCase();
  const resolvedLower = resolved.toLowerCase();

  if (
    type.includes('video') ||
    isVideoUrl(raw) ||
    isVideoUrl(resolved) ||
    rawLower.includes('product-videos') ||
    rawLower.includes('video') ||
    resolvedLower.includes('product-videos') ||
    resolvedLower.includes('video')
  ) {
    return resolved;
  }

  return '';
}

function imageCandidate(value?: string | null, mediaType?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const resolved = resolveStorageUrl(raw);
  if (!resolved) return '';

  const type = normalizeText(mediaType);
  if (
    type.includes('image') ||
    type.includes('photo') ||
    isImageUrl(raw) ||
    isImageUrl(resolved) ||
    (!isVideoUrl(raw) && !normalizeText(raw).includes('video'))
  ) {
    return resolved;
  }

  return '';
}

function rowMediaStrings(row: unknown) {
  return Array.from(new Set(collectMediaStrings(row)));
}

function rowVideoUrl(row: unknown, mediaType?: string | null) {
  const value = rowMediaStrings(row).find((item) => videoCandidate(item, mediaType));
  return value ? videoCandidate(value, mediaType) : '';
}

function rowImageUrl(row: unknown, mediaType?: string | null) {
  const value = rowMediaStrings(row).find((item) => imageCandidate(item, mediaType) && !videoCandidate(item, mediaType));
  if (value) return imageCandidate(value, mediaType);
  const fallback = rowMediaStrings(row).find((item) => imageCandidate(item, mediaType));
  return fallback ? imageCandidate(fallback, mediaType) : '';
}

function collectionFromText(value?: string | null) {
  const text = normalizeText(value);
  if (text.includes('sneaker') || text.includes('shoe') || text.includes('runner')) return 'Sneakers';
  if (text.includes('denim') || text.includes('jean') || text.includes('stacked')) return 'Denim';
  if (text.includes('hoodie') || text.includes('sweatshirt')) return 'Hoodies';
  if (text.includes('street')) return 'Streetwear';
  if (text.includes('luxury') || text.includes('designer') || text.includes('premium')) return 'Luxury';
  if (text.includes('women') || text.includes('dress')) return 'Women';
  if (text.includes('men')) return 'Men';
  if (text.includes('kid')) return 'Kids';
  if (text.includes('newborn') || text.includes('infant') || text.includes('baby')) return 'Newborn';
  if (text.includes('jewelry') || text.includes('chain') || text.includes('bracelet') || text.includes('ring')) return 'Jewelry';
  if (text.includes('accessor') || text.includes('bag') || text.includes('hat') || text.includes('shade')) return 'Accessories';
  if (text.includes('vintage')) return 'Vintage';
  if (text.includes('sale') || text.includes('clearance')) return 'Sale';
  return 'Fashion';
}

function sellerType(store: RestaurantRow) {
  const typeText = normalizeText(`${store.business_type || ''} ${store.store_type || ''} ${store.category || ''} ${store.name || ''}`);
  if (typeText.includes('jewelry')) return 'Jewelry Seller';
  if (typeText.includes('shoe') || typeText.includes('sneaker')) return 'Shoe Seller';
  if (typeText.includes('boutique')) return 'Boutique';
  if (typeText.includes('kid')) return 'Kids Fashion';
  if (typeText.includes('luxury')) return 'Luxury Seller';
  if (typeText.includes('street')) return 'Streetwear Brand';
  return 'Fashion Seller';
}

function getDisplayCity(store: RestaurantRow) {
  const city = cleanText(store.city);
  if (city) return city;
  const address = cleanText(store.address);
  if (!address) return 'Online';
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2].replace(/\d+/g, '').trim() || 'Online';
  return address;
}

function isLiveProduct(row: MenuItemRow) {
  const availability = normalizeText(row.availability);
  if (row.is_available === false) return false;
  if (!cleanText(row.name)) return false;
  if (['deleted', 'delete', 'removed', 'hidden', 'inactive', 'archived', 'draft', 'sold_out'].includes(availability)) return false;
  return true;
}

function productImageValues(product: MenuItemRow) {
  const row = product as MenuItemRow & Record<string, string | null | undefined>;

  return [
    row.item_image,
    row.product_image,
    row.product_photo,
    row.photo_url,
    row.thumbnail_url,
    row.thumbnail,
    row.image,
    row.photo,
    row.image_file,
    row.image_url,
    row.product_media && isImageUrl(row.product_media) ? row.product_media : '',
    row.media_file && isImageUrl(row.media_file) ? row.media_file : '',
    row.media_path && isImageUrl(row.media_path) ? row.media_path : '',
    row.item_media && isImageUrl(row.item_media) ? row.item_media : '',
    row.file_url && isImageUrl(row.file_url) ? row.file_url : '',
    row.upload_url && isImageUrl(row.upload_url) ? row.upload_url : '',
    row.public_url && isImageUrl(row.public_url) ? row.public_url : '',
    row.media_url && isImageUrl(row.media_url) ? row.media_url : '',
    row.media_url && !isVideoUrl(row.media_url) ? row.media_url : '',
  ].filter((value): value is string => String(value || '').trim().length > 0);
}

function productVideoValues(product: MenuItemRow) {
  const row = product as MenuItemRow & Record<string, string | null | undefined>;
  const mediaType = normalizeText(row.media_type);
  const mediaLooksLikeVideo = mediaType.includes('video');

  return [
    row.video_file,
    row.video_url,
    row.item_video,
    row.item_video_file,
    row.item_video_url,
    row.product_video,
    row.product_video_file,
    row.product_video_url,
    row.product_video_path,
    row.menu_video,
    row.menu_video_file,
    row.menu_video_url,
    row.video_path,
    row.video_storage_path,
    row.video_public_url,
    row.video,
    row.media_video,
    row.media_video_file,
    row.media_video_url,
    row.media_url && (mediaLooksLikeVideo || isVideoUrl(row.media_url)) ? row.media_url : '',
    row.product_media && (mediaLooksLikeVideo || isVideoUrl(row.product_media)) ? row.product_media : '',
    row.media_file && (mediaLooksLikeVideo || isVideoUrl(row.media_file)) ? row.media_file : '',
    row.media_path && (mediaLooksLikeVideo || isVideoUrl(row.media_path)) ? row.media_path : '',
    row.item_media && (mediaLooksLikeVideo || isVideoUrl(row.item_media)) ? row.item_media : '',
    row.file_url && (mediaLooksLikeVideo || isVideoUrl(row.file_url)) ? row.file_url : '',
    row.upload_url && (mediaLooksLikeVideo || isVideoUrl(row.upload_url)) ? row.upload_url : '',
    row.public_url && (mediaLooksLikeVideo || isVideoUrl(row.public_url)) ? row.public_url : '',
  ].filter((value): value is string => String(value || '').trim().length > 0);
}

function productImageUrl(product: MenuItemRow) {
  return firstResolved(productImageValues(product), IMAGE_BUCKET);
}

function productImageCandidates(product: MenuItemRow) {
  return firstCandidateList(productImageValues(product), IMAGE_BUCKET);
}

function productVideoUrl(product: MenuItemRow) {
  return firstResolved(productVideoValues(product), VIDEO_BUCKET);
}

function productVideoCandidates(product: MenuItemRow) {
  return firstCandidateList(productVideoValues(product), VIDEO_BUCKET);
}

function hasProductVideo(product: MenuItemRow) {
  return productVideoValues(product).length > 0;
}


function mediaUrl(row: RestaurantMediaRow) {
  return firstResolved([
    row.media_url,
    row.media_file,
    row.media_path,
    row.video_url,
    row.image_url,
    row.public_url,
    row.upload_url,
    row.file_url,
    row.source_url,
  ], STORE_MEDIA_BUCKET);
}

function mediaCandidateList(row: RestaurantMediaRow) {
  return firstCandidateList([
    row.media_url,
    row.media_file,
    row.media_path,
    row.video_url,
    row.image_url,
    row.public_url,
    row.upload_url,
    row.file_url,
    row.source_url,
  ], STORE_MEDIA_BUCKET);
}


function mediaIsVideo(row: RestaurantMediaRow, url: string) {
  return normalizeText(row.media_type).includes('video') || isVideoUrl(url);
}

function postMediaUrl(row: CustomerPostRow) {
  return resolveStorageUrl(row.media_url, CUSTOMER_POST_BUCKET);
}

function postIsVideo(row: CustomerPostRow, url: string) {
  return normalizeText(row.media_type).includes('video') || isVideoUrl(url);
}

function tileMatchesSearch(tile: FeedTile, queryText: string) {
  const query = normalizeText(queryText);
  if (!query) return true;
  const combined = normalizeText(`${tile.city} ${tile.state} ${tile.address} ${tile.storeName} ${tile.collection} ${tile.title} ${tile.subtitle} ${tile.sellerType}`);
  return combined.includes(query);
}

function tileMatchesFilter(tile: FeedTile, filter: string) {
  const tab = filter.toLowerCase();
  if (filter === 'All') return true;
  if (filter === 'Customer Posts') return tile.isCustomerPost;
  if (filter === 'Videos') return tile.mediaType === 'video';
  if (filter === 'Trending') return tile.views > 250 || tile.likes > 25 || tile.featured;
  if (filter === 'Featured') return tile.featured;
  return (
    normalizeText(tile.collection).includes(tab) ||
    normalizeText(tile.title).includes(tab) ||
    normalizeText(tile.subtitle).includes(tab) ||
    normalizeText(tile.sellerType).includes(tab)
  );
}

function timeAgo(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function statusLabel(status?: string | null) {
  const clean = normalizeText(status);
  if (!clean) return 'Pending';
  if (clean === 'new') return 'New';
  if (clean === 'in_progress') return 'Processing';
  if (clean === 'ready') return 'Ready';
  if (clean === 'completed' || clean === 'done') return 'Completed';
  if (clean === 'cancelled' || clean === 'canceled') return 'Cancelled';
  return clean.replace(/\b\w/g, (char) => char.toUpperCase());
}

function SafeImage({ src, candidates = [], alt, className }: { src: string; candidates?: string[]; alt: string; className: string }) {
  const resolvedCandidates = useMemo(() => {
    const list = [src, ...candidates].filter(Boolean);
    return Array.from(new Set(list));
  }, [src, candidates]);

  const [index, setIndex] = useState(0);
  const current = resolvedCandidates[index] || '';

  useEffect(() => setIndex(0), [src, candidates]);

  if (!current) {
    return (
      <div className={`mediaBlank ${className}`}>
        <span>7SV</span>
        <b>{alt}</b>
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setIndex((currentIndex) => currentIndex + 1)}
    />
  );
}

function AutoVideo({ src, candidates = [], poster, posterCandidates = [], className, title }: { src: string; candidates?: string[]; poster: string; posterCandidates?: string[]; className: string; title: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const videoCandidates = useMemo(() => Array.from(new Set([src, ...candidates].filter(Boolean))), [src, candidates]);
  const posterList = useMemo(() => Array.from(new Set([poster, ...posterCandidates].filter(Boolean))), [poster, posterCandidates]);
  const [videoIndex, setVideoIndex] = useState(0);
  const currentVideo = videoCandidates[videoIndex] || '';

  useEffect(() => setVideoIndex(0), [src, candidates]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !currentVideo) return;

    let cancelled = false;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('preload', 'auto');

    const playNow = () => {
      if (cancelled) return;
      video.muted = true;
      video.defaultMuted = true;
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          window.setTimeout(() => {
            if (!cancelled) video.play().catch(() => null);
          }, 350);
        });
      }
    };

    try {
      video.load();
    } catch {
      // Safari can throw if load is interrupted.
    }

    playNow();
    const t1 = window.setTimeout(playNow, 120);
    const t2 = window.setTimeout(playNow, 650);
    const t3 = window.setTimeout(playNow, 1400);

    const onReady = () => playNow();
    const onVisible = () => {
      if (document.visibilityState === 'visible') playNow();
    };

    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('canplay', onReady);
    video.addEventListener('canplaythrough', onReady);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('canplaythrough', onReady);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [currentVideo]);

  if (!currentVideo) return <SafeImage src={posterList[0] || ''} candidates={posterList} alt={title} className={className} />;

  return (
    <video
      ref={ref}
      key={currentVideo}
      src={currentVideo}
      poster={posterList[0] || undefined}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={className}
      controls={false}
      disablePictureInPicture
      onLoadedMetadata={() => ref.current?.play().catch(() => null)}
      onLoadedData={() => ref.current?.play().catch(() => null)}
      onCanPlay={() => ref.current?.play().catch(() => null)}
      onPlaying={() => null}
      onError={() => setVideoIndex((currentIndex) => currentIndex + 1)}
    />
  );
}


function TileMedia({ tile, className }: { tile: FeedTile; className: string }) {
  if (tile.mediaType === 'video') {
    return (
      <AutoVideo
        src={tile.mediaUrl}
        candidates={tile.mediaCandidates}
        poster={tile.posterUrl}
        posterCandidates={tile.posterCandidates}
        className={className}
        title={tile.title}
      />
    );
  }

  return <SafeImage src={tile.mediaUrl || tile.posterUrl} candidates={tile.mediaCandidates.concat(tile.posterCandidates)} alt={tile.title || tile.storeName} className={className} />;
}

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="sectionTitle">
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
      </div>
      {action ? <div className="sectionAction">{action}</div> : null}
    </div>
  );
}


function customerLocalKey(userId: string) {
  return `7sv_customer_profile_${userId}`;
}

function readLocalCustomerProfile(userId: string) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = window.localStorage.getItem(customerLocalKey(userId));
    return raw ? (JSON.parse(raw) as CustomerProfileRow) : null;
  } catch {
    return null;
  }
}

function writeLocalCustomerProfile(userId: string, profile: CustomerProfileRow) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(customerLocalKey(userId), JSON.stringify(profile));
  } catch {
    // local fallback unavailable
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function CustomerPage() {
  const router = useRouter();
  const profileFileRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadNote, setLoadNote] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<CustomerProfileRow | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<MenuItemRow[]>([]);
  const [restaurantMedia, setRestaurantMedia] = useState<RestaurantMediaRow[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPostRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadNote('');

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user?.id) {
        setLoading(false);
        router.push(CUSTOMER_LOGIN_PATH);
        return;
      }

      const uid = user.id;
      const email = user.email || '';
      setUserId(uid);
      setUserEmail(email);

      const [
        profileResult,
        storeResult,
        categoryResult,
        productResult,
        mediaResult,
        postResult,
        orderResult,
        favoriteResult,
      ] = await Promise.all([
        supabase.from('customer_profiles').select('*').or(`user_id.eq.${uid},customer_id.eq.${uid},id.eq.${uid},email.eq.${email}`).maybeSingle(),
        supabase.from('restaurants').select('*').or('public_visible.is.null,public_visible.eq.true').not('slug', 'is', null).limit(300),
        supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }).limit(700),
        supabase.from('menu_items').select('*').order('sort_order', { ascending: true }).limit(900),
        supabase.from('restaurant_media').select('*').order('created_at', { ascending: false }).limit(700),
        supabase.from('customer_posts').select('id,customer_id,customer_name,caption,media_url,media_type,likes,likes_count,views,comments_count,created_at').order('created_at', { ascending: false }).limit(700),
        supabase.from('orders').select('*,restaurants(id,name,slug,logo_image,hero_image,cover_image)').or(`customer_id.eq.${uid},customer_email.eq.${email}`).order('created_at', { ascending: false }).limit(80),
        supabase.from('customer_favorites').select('*,restaurants(id,name,slug,logo_image,hero_image,cover_image,category,city,state,address,business_type,store_type,featured,views,created_at)').or(`customer_id.eq.${uid},customer_email.eq.${email}`).limit(150),
      ]);

      if (profileResult.error) console.warn('7SV customer profile:', profileResult.error);
      if (storeResult.error) console.warn('7SV stores:', storeResult.error);
      if (categoryResult.error) console.warn('7SV categories:', categoryResult.error);
      if (productResult.error) console.warn('7SV products:', productResult.error);
      if (mediaResult.error) console.warn('7SV media:', mediaResult.error);
      if (postResult.error) console.warn('7SV customer posts:', postResult.error);
      if (orderResult.error) console.warn('7SV orders:', orderResult.error);
      if (favoriteResult.error) console.warn('7SV favorites:', favoriteResult.error);

      const metadataProfile = {
        user_id: uid,
        customer_id: uid,
        email,
        name: cleanText(user.user_metadata?.name || user.user_metadata?.full_name || user.user_metadata?.display_name),
        full_name: cleanText(user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name),
        display_name: cleanText(user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name),
        phone: cleanText(user.user_metadata?.phone),
        avatar_url: cleanText(user.user_metadata?.avatar_url || user.user_metadata?.picture),
        image_url: cleanText(user.user_metadata?.avatar_url || user.user_metadata?.picture),
      } as CustomerProfileRow;

      const localProfile = readLocalCustomerProfile(uid);
      const nextProfile = ((profileResult.data || localProfile || metadataProfile || null) as CustomerProfileRow | null);
      setProfile(nextProfile);
      setProfileName(cleanText(nextProfile?.display_name || nextProfile?.full_name || nextProfile?.name, email.split('@')[0] || 'Vault Customer'));
      setProfilePhone(cleanText(nextProfile?.phone));
      setRestaurants((storeResult.data || []) as RestaurantRow[]);
      setCategories((categoryResult.data || []) as CategoryRow[]);
      setProducts(((productResult.data || []) as MenuItemRow[]).filter(isLiveProduct));
      setRestaurantMedia((mediaResult.data || []) as RestaurantMediaRow[]);
      setCustomerPosts((postResult.data || []) as CustomerPostRow[]);
      setOrders((orderResult.data || []) as OrderRow[]);
      setFavorites((favoriteResult.data || []) as FavoriteRow[]);
    } catch (error) {
      console.error('7SV customer dashboard load failed:', error);
      setLoadNote('Dashboard loaded with limited data. Check Supabase policies if media is missing.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();

    const channel = supabase
      .channel('7sv-customer-dashboard-live-discovery')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_media' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_posts' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void loadDashboard())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  const customerName = cleanText(profileName, userEmail ? userEmail.split('@')[0] : 'Vault Customer');
  const avatarUrl = firstResolved([profile?.avatar_url, profile?.image_url], PROFILE_BUCKET);

  const storeById = useMemo(() => {
    const map = new Map<string, RestaurantRow>();
    restaurants.forEach((store) => map.set(store.id, store));
    return map;
  }, [restaurants]);

  const categoryById = useMemo(() => {
    const map = new Map<string, CategoryRow>();
    categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [categories]);

  const feed = useMemo<FeedTile[]>(() => {
    const tiles: FeedTile[] = [];

    products.forEach((product) => {
      const store = storeById.get(product.restaurant_id || '');
      if (!store?.slug) return;

      const category = cleanText(categoryById.get(product.category_id || '')?.name, collectionFromText(`${store.category || ''} ${product.name || ''} ${product.description || ''}`));
      const imageUrl = productImageUrl(product, store);
      const videoUrl = productVideoUrl(product);
      const hasVideo = Boolean(videoUrl);
      const finalMedia = hasVideo ? videoUrl : imageUrl;
      if (!finalMedia) return;

      tiles.push({
        id: `product_${product.id}`,
        sourceTable: 'menu_items',
        rawId: product.id,
        storeId: store.id,
        slug: store.slug,
        storeName: cleanText(store.name, '7th St Vault Seller'),
        logoUrl: firstResolved([store.logo_url, store.logo_image], BRANDING_BUCKET),
        collection: category,
        city: getDisplayCity(store),
        state: cleanText(store.state),
        address: cleanText(store.address),
        sellerType: sellerType(store),
        mediaType: hasVideo ? 'video' : 'image',
        mediaUrl: finalMedia,
        mediaCandidates: hasVideo ? productVideoCandidates(product) : productImageCandidates(product),
        posterUrl: imageUrl || productImageCandidates(product)[0] || firstResolved([store.cover_url, store.cover_image, store.hero_url, store.hero_image], STORE_MEDIA_BUCKET) || firstResolved([store.logo_url, store.logo_image], BRANDING_BUCKET),
        posterCandidates: productImageCandidates(product),
        title: cleanText(product.name, 'Fashion Product'),
        subtitle: cleanText(product.description, `${cleanText(store.name, 'Vault Seller')} • ${category}`),
        price: Number(product.base_price ?? product.price ?? 0),
        likes: stableNumberSeed(`${product.id}:likes`, 18, 180),
        views: Number(store.views || 0) + stableNumberSeed(`${product.id}:views`, 140, 980),
        featured: Boolean(store.featured),
        createdAt: product.created_at || store.created_at || '',
        isCustomerPost: false,
      });
    });

    restaurantMedia.forEach((media) => {
      const store = storeById.get(media.restaurant_id || '');
      if (!store?.slug) return;

      const url = mediaUrl(media);
      if (!url) return;

      const type = mediaIsVideo(media, url) ? 'video' : 'image';
      const poster = type === 'image' ? url : firstResolved([media.thumbnail_url, media.poster_url, media.thumbnail, media.poster, store.cover_url, store.cover_image, store.hero_url, store.hero_image, store.logo_url, store.logo_image]);
      const category = collectionFromText(`${store.category || ''} ${media.caption || ''}`);

      tiles.push({
        id: `media_${media.id}`,
        sourceTable: 'restaurant_media',
        rawId: media.id,
        storeId: store.id,
        slug: store.slug,
        storeName: cleanText(store.name, '7th St Vault Seller'),
        logoUrl: firstResolved([store.logo_url, store.logo_image], BRANDING_BUCKET),
        collection: category,
        city: getDisplayCity(store),
        state: cleanText(store.state),
        address: cleanText(store.address),
        sellerType: sellerType(store),
        mediaType: type,
        mediaUrl: url,
        mediaCandidates: mediaCandidateList(media),
        posterUrl: poster,
        posterCandidates: type === 'image' ? mediaCandidateList(media) : firstCandidateList([store.cover_url, store.cover_image, store.hero_url, store.hero_image], STORE_MEDIA_BUCKET).concat(firstCandidateList([store.logo_url, store.logo_image], BRANDING_BUCKET)),
        title: cleanText(media.caption, cleanText(store.name, 'Seller Upload')),
        subtitle: `${cleanText(store.name, 'Vault Seller')} • ${category}`,
        price: 0,
        likes: Number(media.likes || 0),
        views: Number(media.views || store.views || 0),
        featured: Boolean(store.featured),
        createdAt: media.created_at || store.created_at || '',
        isCustomerPost: false,
      });
    });

    customerPosts.forEach((post) => {
      const url = postMediaUrl(post);
      if (!url && !post.caption) return;

      const title = cleanText(post.caption, 'Fashion community post');
      const type = postIsVideo(post, url) ? 'video' : 'image';

      tiles.push({
        id: `customer_${post.id}`,
        sourceTable: 'customer_posts',
        rawId: post.id,
        storeId: '',
        slug: '',
        storeName: cleanText(post.customer_name, 'Vault Customer'),
        logoUrl: '',
        collection: collectionFromText(title),
        city: 'Community',
        state: '',
        address: '',
        sellerType: 'Customer Post',
        mediaType: type,
        mediaUrl: url,
        mediaCandidates: mediaCandidates(post.media_url, CUSTOMER_POST_BUCKET),
        posterUrl: '',
        posterCandidates: mediaCandidates(post.media_url, CUSTOMER_POST_BUCKET),
        title,
        subtitle: `${cleanText(post.customer_name, 'Vault Customer')} • Community`,
        price: 0,
        likes: Number(post.likes ?? post.likes_count ?? 0),
        views: Number(post.views || 0),
        featured: false,
        createdAt: post.created_at || '',
        isCustomerPost: true,
      });
    });

    return tiles
      .filter((tile) => Boolean(tile.mediaUrl))
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [categoryById, customerPosts, products, restaurantMedia, storeById]);

  const filteredFeed = useMemo(() => {
    return feed.filter((tile) => tileMatchesSearch(tile, search) && tileMatchesFilter(tile, activeFilter));
  }, [activeFilter, feed, search]);

  const productDrops = useMemo(() => feed.filter((tile) => tile.sourceTable === 'menu_items').sort((a, b) => Number(b.mediaType === 'video') - Number(a.mediaType === 'video')).slice(0, 12), [feed]);
  const videos = useMemo(() => feed.filter((tile) => tile.mediaType === 'video').slice(0, 10), [feed]);
  const trending = useMemo(() => feed.filter((tile) => tile.views > 250 || tile.likes > 25 || tile.featured).slice(0, 12), [feed]);

  const favoriteStores = useMemo(() => {
    const map = new Map<string, RestaurantRow>();
    favorites.forEach((favorite) => {
      const store = favorite.restaurants || storeById.get(favorite.restaurant_id || favorite.store_id || '');
      if (store?.id) map.set(store.id, store);
    });
    return Array.from(map.values());
  }, [favorites, storeById]);

  const customerOwnPosts = useMemo(() => customerPosts.filter((post) => post.customer_id === userId), [customerPosts, userId]);
  const totalSpent = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total ?? order.subtotal ?? 0), 0), [orders]);
  const activeOrders = useMemo(() => orders.filter((order) => !['completed', 'done', 'cancelled', 'canceled'].includes(normalizeText(order.status))).length, [orders]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push(CUSTOMER_LOGIN_PATH);
  }

  async function saveProfile() {
    if (!userId || !userEmail) return;
    setProfileSaving(true);
    setProfileMessage('');

    const nextProfile = {
      ...(profile || {}),
      user_id: userId,
      customer_id: userId,
      email: userEmail,
      name: cleanText(profileName, customerName),
      full_name: cleanText(profileName, customerName),
      display_name: cleanText(profileName, customerName),
      phone: cleanText(profilePhone),
      avatar_url: profile?.avatar_url || profile?.image_url || '',
      image_url: profile?.image_url || profile?.avatar_url || '',
      updated_at: new Date().toISOString(),
    } as CustomerProfileRow;

    try {
      writeLocalCustomerProfile(userId, nextProfile);
      setProfile(nextProfile);

      await supabase.auth.updateUser({
        data: {
          name: nextProfile.name,
          full_name: nextProfile.full_name,
          display_name: nextProfile.display_name,
          phone: nextProfile.phone,
          avatar_url: nextProfile.avatar_url || nextProfile.image_url || '',
        },
      });

      const attempts = [
        () => supabase.from('customer_profiles').upsert(nextProfile, { onConflict: 'user_id' }).select('*').maybeSingle(),
        () => supabase.from('customer_profiles').upsert(nextProfile, { onConflict: 'customer_id' }).select('*').maybeSingle(),
        () => supabase.from('customer_profiles').upsert(nextProfile, { onConflict: 'email' }).select('*').maybeSingle(),
      ];

      for (const attempt of attempts) {
        const result = await attempt();
        if (!result.error && result.data) {
          const saved = result.data as CustomerProfileRow;
          setProfile(saved);
          writeLocalCustomerProfile(userId, saved);
          setProfileMessage('Profile saved.');
          setProfileSaving(false);
          return;
        }
      }

      setProfileMessage('Profile saved on this account.');
    } catch (error) {
      console.warn('7SV profile table save blocked, using safe customer fallback:', error);
      writeLocalCustomerProfile(userId, nextProfile);
      setProfile(nextProfile);
      setProfileMessage('Profile saved on this account.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function uploadProfilePhoto(file?: File | null) {
    if (!file || !userId || !userEmail) return;
    setProfileUploading(true);
    setProfileMessage('');

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `profiles/${userId}/${Date.now()}.${ext}`;

      let avatarUrl = '';
      const uploadBuckets = [PROFILE_BUCKET, CUSTOMER_POST_BUCKET, BRANDING_BUCKET];

      for (const bucket of uploadBuckets) {
        const upload = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

        if (!upload.error) {
          avatarUrl = bucketUrl(path, bucket);
          break;
        }
      }

      if (!avatarUrl) {
        avatarUrl = await fileToDataUrl(file);
      }

      const nextProfile = {
        ...(profile || {}),
        user_id: userId,
        customer_id: userId,
        email: userEmail,
        name: cleanText(profileName, customerName),
        full_name: cleanText(profileName, customerName),
        display_name: cleanText(profileName, customerName),
        phone: cleanText(profilePhone),
        avatar_url: avatarUrl,
        image_url: avatarUrl,
        updated_at: new Date().toISOString(),
      } as CustomerProfileRow;

      writeLocalCustomerProfile(userId, nextProfile);
      setProfile(nextProfile);

      await supabase.auth.updateUser({
        data: {
          name: nextProfile.name,
          full_name: nextProfile.full_name,
          display_name: nextProfile.display_name,
          phone: nextProfile.phone,
          avatar_url: avatarUrl,
          picture: avatarUrl,
        },
      });

      const attempts = [
        () => supabase.from('customer_profiles').upsert(nextProfile, { onConflict: 'user_id' }).select('*').maybeSingle(),
        () => supabase.from('customer_profiles').upsert(nextProfile, { onConflict: 'customer_id' }).select('*').maybeSingle(),
        () => supabase.from('customer_profiles').upsert(nextProfile, { onConflict: 'email' }).select('*').maybeSingle(),
      ];

      for (const attempt of attempts) {
        const result = await attempt();
        if (!result.error && result.data) {
          const saved = result.data as CustomerProfileRow;
          setProfile(saved);
          writeLocalCustomerProfile(userId, saved);
          setProfileMessage('Profile photo updated.');
          setProfileUploading(false);
          return;
        }
      }

      setProfileMessage('Profile photo updated.');
    } catch (error) {
      console.warn('7SV profile photo fallback error:', error);
      setProfileMessage('Photo could not upload. Try a smaller image.');
    } finally {
      setProfileUploading(false);
    }
  }

  const statCards = [
    { label: 'Live Media', value: String(feed.length), sub: 'From Discovery' },
    { label: 'Videos', value: String(feed.filter((tile) => tile.mediaType === 'video').length), sub: 'Product reels' },
    { label: 'Orders', value: String(orders.length), sub: `${activeOrders} active` },
    { label: 'Spent', value: money(totalSpent), sub: 'Shopping total' },
  ];

  if (loading) {
    return (
      <main className="vaultCustomerPage">
        <section className="loadingShell">
          <div className="vaultMark">7SV</div>
          <h1>Loading your vault</h1>
          <p>Connecting live Discovery photos, videos, products, orders, and profile data.</p>
        </section>
        <style jsx global>{styles}</style>
      </main>
    );
  }

  return (
    <main className="vaultCustomerPage">
      <header className="topBar">
        <Link href="/discover" className="brandLockup">
          <span>7SV</span>
          <div>
            <b>7th St Vault</b>
            <small>Customer Dashboard</small>
          </div>
        </Link>

        <div className="searchBox">
          <span>⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search drops, sellers, videos, sneakers..." />
          {search ? <button type="button" onClick={() => setSearch('')}>Clear</button> : null}
        </div>

        <div className="topActions">
          <Link href="/discover">Open Discover</Link>
          <button type="button" onClick={signOut}>Sign Out</button>
        </div>
      </header>

      <section className="heroSection">
        <article className="heroCard">
          <div className="heroGlow" />
          <div className="heroContent">
            <small>Live Customer Vault</small>
            <h1>Welcome back, {customerName}</h1>
            <p>Live photos, videos, product drops, seller uploads, and community posts pulled from the same backend as Discovery.</p>
            <div className="heroButtons">
              <button type="button" className="primaryBtn" onClick={() => { setActiveTab('discover'); setActiveFilter('All'); }}>View Live Feed</button>
              <button type="button" className="secondaryBtn" onClick={() => { setActiveTab('discover'); setActiveFilter('Videos'); }}>Watch Videos</button>
            </div>
          </div>

          <div className="profilePanel">
            <button type="button" className="avatar avatarButton" onClick={() => profileFileRef.current?.click()}>
              {avatarUrl ? <SafeImage src={avatarUrl} alt={customerName} className="avatarImage" /> : <span>{customerName.slice(0, 1).toUpperCase()}</span>}
            </button>
            <b>{customerName}</b>
            <small>{userEmail || 'Customer account'}</small>
          </div>
        </article>

        <div className="statsGrid">
          {statCards.map((stat) => (
            <article key={stat.label} className="statCard">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.sub}</small>
            </article>
          ))}
        </div>
      </section>

      {loadNote ? <div className="loadNote">{loadNote}</div> : null}

      <nav className="tabBar">
        {NAV_ITEMS.map((item) => (
          <button key={item.key} type="button" className={activeTab === item.key ? 'active' : ''} onClick={() => setActiveTab(item.key)}>
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {activeTab === 'home' ? (
        <>
          <section className="sectionBlock">
            <SectionTitle eyebrow="Live Discovery" title="Latest Drops" action={<button type="button" onClick={() => { setActiveTab('discover'); setActiveFilter('All'); }}>View all →</button>} />
            {productDrops.length ? <TileGrid tiles={productDrops} /> : <EmptyLiveMedia />}
          </section>

          <section className="twoColumn">
            <section className="sectionBlock compact">
              <SectionTitle eyebrow="Videos" title="Product Reels" action={<button type="button" onClick={() => { setActiveTab('discover'); setActiveFilter('Videos'); }}>Watch all →</button>} />
              {videos.length ? <VideoStack tiles={videos} /> : <EmptyLiveMedia />}
            </section>

            <section className="sectionBlock compact">
              <SectionTitle eyebrow="Trending" title="Popular Now" action={<button type="button" onClick={() => { setActiveTab('discover'); setActiveFilter('Trending'); }}>Open →</button>} />
              {trending.length ? <MiniStack tiles={trending.slice(0, 6)} /> : <EmptyLiveMedia />}
            </section>
          </section>
        </>
      ) : null}

      {activeTab === 'discover' ? (
        <section className="sectionBlock">
          <SectionTitle eyebrow="Discovery Feed" title="Live Photos & Videos" action={<Link href="/discover">Open full Discovery →</Link>} />

          <div className="filterRail">
            {FILTERS.map((filter) => (
              <button key={filter} type="button" className={activeFilter === filter ? 'active' : ''} onClick={() => setActiveFilter(filter)}>
                {filter}
              </button>
            ))}
          </div>

          {filteredFeed.length ? <DiscoverGrid tiles={filteredFeed} /> : <EmptyLiveMedia />}
        </section>
      ) : null}

      {activeTab === 'orders' ? (
        <section className="sectionBlock">
          <SectionTitle eyebrow="Shopping" title="Order History" />
          {orders.length ? (
            <div className="ordersList">
              {orders.map((order) => <OrderCard key={order.id} order={order} />)}
            </div>
          ) : (
            <EmptyBlock title="No orders yet." text="When customers shop from a seller, order history will show here." action={<Link href="/discover">Start shopping</Link>} />
          )}
        </section>
      ) : null}

      {activeTab === 'favorites' ? (
        <section className="sectionBlock">
          <SectionTitle eyebrow="Saved" title="Favorite Sellers" />
          {favoriteStores.length ? (
            <div className="storeGrid">
              {favoriteStores.map((store) => <StoreCard key={store.id} store={store} />)}
            </div>
          ) : (
            <EmptyBlock title="No saved sellers yet." text="Favorite sellers will show here after customers save brands." />
          )}
        </section>
      ) : null}

      {activeTab === 'posts' ? (
        <section className="sectionBlock">
          <SectionTitle eyebrow="Community" title="Your Posts" action={<Link href="/discover">Open Discovery →</Link>} />
          {customerOwnPosts.length ? (
            <div className="postGrid">
              {customerOwnPosts.map((post) => <CustomerPostCard key={post.id} post={post} />)}
            </div>
          ) : (
            <EmptyBlock title="No customer posts yet." text="Customer outfit videos, photos, and reviews will show here." />
          )}
        </section>
      ) : null}

      {activeTab === 'profile' ? (
        <section className="sectionBlock">
          <SectionTitle eyebrow="Account" title="Edit Profile" />

          <div className="profileGrid">
            <div className="profileInfoCard">
              <button type="button" className="avatar large avatarButton" onClick={() => profileFileRef.current?.click()}>
                {avatarUrl ? <SafeImage src={avatarUrl} alt={customerName} className="avatarImage" /> : <span>{customerName.slice(0, 1).toUpperCase()}</span>}
              </button>
              <h2>{customerName}</h2>
              <p>{userEmail}</p>
              <button type="button" className="uploadPhotoBtn" onClick={() => profileFileRef.current?.click()}>
                {profileUploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>

            <div className="profileFields">
              <input ref={profileFileRef} type="file" accept="image/*" hidden onChange={(event: ChangeEvent<HTMLInputElement>) => void uploadProfilePhoto(event.target.files?.[0])} />

              <label>
                Name
                <input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Your name" />
              </label>

              <label>
                Email
                <input value={userEmail} readOnly />
              </label>

              <label>
                Phone
                <input value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} placeholder="Add phone number" />
              </label>

              <button type="button" className="saveProfileBtn" onClick={() => void saveProfile()} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>

              {profileMessage ? <div className="noticeBox">{profileMessage}</div> : null}
            </div>
          </div>
        </section>
      ) : null}

      <nav className="mobileNav">
        {NAV_ITEMS.filter((item) => item.key !== 'posts').map((item) => (
          <button key={item.key} type="button" className={activeTab === item.key ? 'active' : ''} onClick={() => setActiveTab(item.key)}>
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <style jsx global>{styles}</style>
    </main>
  );
}

function EmptyLiveMedia() {
  return (
    <EmptyBlock
      title="No live Discovery media found."
      text="This section only shows real uploaded photos and videos from menu_items, restaurant_media, and customer_posts."
      action={<Link href="/discover">Open Discovery</Link>}
    />
  );
}

function EmptyBlock({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="emptyBlock">
      <b>{title}</b>
      <p>{text}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function TileGrid({ tiles }: { tiles: FeedTile[] }) {
  return (
    <div className="productGrid">
      {tiles.map((tile) => (
        <Link href={tile.slug ? `/store/${tile.slug}` : '/discover'} key={tile.id} className="productCard">
          <TileMedia tile={tile} className="productMedia" />
          <div className="productBody">
            <span>{tile.collection}</span>
            <strong>{tile.title}</strong>
            <small>{tile.storeName}</small>
            {tile.price > 0 ? <b>{money(tile.price)}</b> : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function DiscoverGrid({ tiles }: { tiles: FeedTile[] }) {
  return (
    <div className="discoverGrid">
      {tiles.map((tile) => (
        <Link href={tile.slug ? `/store/${tile.slug}` : '/discover'} key={tile.id} className={`feedCard ${tile.mediaType === 'video' ? 'video' : ''}`}>
          <TileMedia tile={tile} className="feedMedia" />
          <div className="feedShade" />
          <div className="feedTop">
            {tile.logoUrl ? <SafeImage src={tile.logoUrl} alt={tile.storeName} className="tinyLogo" /> : <span className="tinyLogoText">{tile.storeName.slice(0, 1)}</span>}
            <b>{tile.collection}</b>
          </div>
          <div className="feedBottom">
            <strong>{tile.title}</strong>
            <small>{tile.subtitle}</small>
            <div>
              {tile.price > 0 ? <em>{money(tile.price)}</em> : null}
              <span>♥ {displayCount(tile.likes)}</span>
              <span>👁 {displayCount(tile.views)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function VideoStack({ tiles }: { tiles: FeedTile[] }) {
  return (
    <div className="videoStack">
      {tiles.map((tile) => (
        <Link href={tile.slug ? `/store/${tile.slug}` : '/discover'} key={tile.id} className="videoRow">
          <TileMedia tile={tile} className="videoThumb" />
          <div>
            <strong>{tile.title}</strong>
            <span>{tile.storeName}</span>
            <small>{timeAgo(tile.createdAt) || tile.collection}</small>
          </div>
        </Link>
      ))}
    </div>
  );
}

function MiniStack({ tiles }: { tiles: FeedTile[] }) {
  return (
    <div className="miniStoreList">
      {tiles.map((tile) => (
        <Link href={tile.slug ? `/store/${tile.slug}` : '/discover'} key={tile.id} className="miniStore">
          <TileMedia tile={tile} className="miniStoreImage" />
          <div>
            <strong>{tile.title}</strong>
            <span>{tile.collection}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function StoreCard({ store }: { store: RestaurantRow }) {
  const image = firstResolved([store.cover_url, store.cover_image, store.hero_url, store.hero_image, store.logo_url, store.logo_image]);
  return (
    <Link href={`/store/${store.slug}`} className="storeCard">
      <SafeImage src={image} alt={cleanText(store.name, 'Fashion seller')} className="storeImage" />
      <div>
        <strong>{cleanText(store.name, 'Fashion Seller')}</strong>
        <span>{sellerType(store)}</span>
        <small>{[store.city, store.state].filter(Boolean).join(', ') || 'Online'}</small>
      </div>
    </Link>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const store = order.restaurants;
  const image = firstResolved([store?.cover_image, store?.hero_image, store?.logo_image]);
  const href = store?.slug ? `/store/${store.slug}` : '/discover';
  return (
    <article className="orderCard">
      <div className="orderBrand">
        <SafeImage src={image} alt={cleanText(store?.name, 'Seller')} className="orderLogo" />
        <div>
          <strong>{cleanText(store?.name, '7th St Vault Seller')}</strong>
          <span>{timeAgo(order.created_at) || 'Recently'}</span>
        </div>
      </div>
      <div className="orderMeta">
        <span>{statusLabel(order.status)}</span>
        <b>{money(order.total ?? order.subtotal)}</b>
        <Link href={href}>Open Brand</Link>
      </div>
    </article>
  );
}

function CustomerPostCard({ post }: { post: CustomerPostRow }) {
  const url = postMediaUrl(post);
  const tile: FeedTile = {
    id: post.id,
    sourceTable: 'customer_posts',
    rawId: post.id,
    storeId: '',
    slug: '',
    storeName: cleanText(post.customer_name, 'Vault Customer'),
    logoUrl: '',
    collection: collectionFromText(post.caption),
    city: 'Community',
    state: '',
    address: '',
    sellerType: 'Customer Post',
    mediaType: postIsVideo(post, url) ? 'video' : 'image',
    mediaUrl: url,
    mediaCandidates: mediaCandidates(post.media_url, CUSTOMER_POST_BUCKET),
    posterUrl: '',
    posterCandidates: mediaCandidates(post.media_url, CUSTOMER_POST_BUCKET),
    title: cleanText(post.caption, 'Fashion community post'),
    subtitle: cleanText(post.customer_name, 'Vault Customer'),
    price: 0,
    likes: Number(post.likes ?? post.likes_count ?? 0),
    views: Number(post.views || 0),
    featured: false,
    createdAt: post.created_at || '',
    isCustomerPost: true,
  };

  return (
    <article className="postCard">
      <TileMedia tile={tile} className="postMedia" />
      <div>
        <strong>{tile.title}</strong>
        <span>{timeAgo(post.created_at)}</span>
        <small>♥ {displayCount(tile.likes)} · 👁 {displayCount(tile.views)}</small>
      </div>
    </article>
  );
}

const styles = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#02040a;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body{overflow-x:hidden}
a{text-decoration:none;color:inherit}
button,input{font:inherit}
button{cursor:pointer}
img,video{max-width:100%}
.vaultCustomerPage{min-height:100vh;background:radial-gradient(circle at 10% -6%,rgba(31,111,255,.28),transparent 28%),radial-gradient(circle at 88% 2%,rgba(255,255,255,.13),transparent 22%),linear-gradient(180deg,#060913 0%,#03050b 48%,#020308 100%);padding-bottom:118px}
.topBar{position:sticky;top:0;z-index:100;display:grid;grid-template-columns:auto minmax(280px,1fr) auto;gap:16px;align-items:center;padding:14px clamp(14px,3vw,38px);background:rgba(3,5,11,.9);border-bottom:1px solid rgba(255,255,255,.1);backdrop-filter:blur(24px);box-shadow:0 18px 70px rgba(0,0,0,.34)}
.brandLockup{display:flex;align-items:center;gap:12px;min-width:220px}.brandLockup span,.vaultMark{width:58px;height:58px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(135deg,#f8fbff 0%,#9aa6bc 38%,#151b28 100%);color:#030409;font-weight:1000;letter-spacing:-.05em;box-shadow:0 16px 42px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.65)}.brandLockup b{display:block;font-size:18px;text-transform:uppercase;letter-spacing:.04em;line-height:1}.brandLockup small{display:block;margin-top:4px;color:#8eb4ff;font-weight:900;font-size:12px}
.searchBox{min-height:58px;border-radius:22px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.055));display:flex;align-items:center;gap:10px;padding:0 16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 12px 34px rgba(0,0,0,.18)}.searchBox span{color:#8eb4ff;font-size:22px}.searchBox input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-weight:850}.searchBox input::placeholder{color:rgba(255,255,255,.54)}.searchBox button{border:0;border-radius:999px;padding:8px 12px;background:#1f6fff;color:#fff;font-weight:1000}
.topActions{display:flex;align-items:center;gap:10px}.topActions a,.topActions button,.primaryBtn,.secondaryBtn,.sectionAction a,.sectionAction button,.emptyBlock a,.emptyBlock button,.uploadPhotoBtn,.saveProfileBtn{min-height:50px;border-radius:17px;display:inline-grid;place-items:center;padding:0 18px;font-weight:1000;border:0}.topActions a,.primaryBtn,.saveProfileBtn,.uploadPhotoBtn{background:linear-gradient(135deg,#1f6fff,#0f4fd6);color:#fff;box-shadow:0 16px 38px rgba(31,111,255,.24)}.topActions button,.secondaryBtn,.sectionAction a,.sectionAction button,.emptyBlock button{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.075);color:#fff}
.heroSection{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;padding:24px clamp(14px,3vw,38px) 14px}.heroCard{position:relative;overflow:hidden;min-height:375px;border-radius:38px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.03));box-shadow:0 28px 90px rgba(0,0,0,.42);display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:24px;padding:34px}.heroGlow{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.8),rgba(0,0,0,.22)),radial-gradient(circle at 78% 18%,rgba(31,111,255,.36),transparent 34%),linear-gradient(135deg,#0b1020,#05060b 56%,#121826)}.heroContent,.profilePanel{position:relative;z-index:2}.heroContent{align-self:end}.heroContent small,.sectionTitle small{display:inline-flex;color:#8eb4ff;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.16em}.heroContent h1{margin:12px 0 0;max-width:820px;font-size:clamp(46px,6vw,88px);line-height:.86;letter-spacing:-.085em}.heroContent p{margin:18px 0 0;max-width:760px;color:rgba(255,255,255,.78);font-size:18px;line-height:1.46;font-weight:850}.heroButtons{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
.profilePanel{align-self:center;min-height:262px;border-radius:30px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.055));display:grid;place-items:center;align-content:center;text-align:center;padding:24px;box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 18px 55px rgba(0,0,0,.24)}.avatar{width:102px;height:102px;border-radius:32px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,#1f6fff,#081225);border:1px solid rgba(255,255,255,.2);font-size:38px;font-weight:1000;box-shadow:0 16px 40px rgba(31,111,255,.22);color:#fff}.avatar.large{width:132px;height:132px;border-radius:38px;margin:auto}.avatarImage{width:100%;height:100%;object-fit:cover}.avatarButton{cursor:pointer}.profilePanel b{margin-top:15px;font-size:22px}.profilePanel small{color:rgba(255,255,255,.64);font-weight:850}
.statsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.statCard{border-radius:26px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.078),rgba(255,255,255,.038));padding:20px;box-shadow:0 18px 52px rgba(0,0,0,.22)}.statCard span{color:rgba(255,255,255,.62);font-weight:950}.statCard strong{display:block;margin-top:8px;font-size:clamp(28px,4vw,42px);line-height:1;letter-spacing:-.065em}.statCard small{display:block;margin-top:8px;color:#8eb4ff;font-weight:1000}.loadNote{margin:0 clamp(14px,3vw,38px) 14px;border-radius:18px;border:1px solid rgba(255,190,80,.28);background:rgba(255,190,80,.12);color:#ffe1a6;font-weight:900;padding:14px 16px}
.tabBar{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding:4px clamp(14px,3vw,38px) 18px}.tabBar::-webkit-scrollbar,.filterRail::-webkit-scrollbar{display:none}.tabBar button,.filterRail button{flex:0 0 auto;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.062);color:#fff;min-height:52px;padding:0 20px;font-weight:1000;display:flex;align-items:center;gap:8px}.tabBar button.active,.filterRail button.active{background:linear-gradient(135deg,#1f6fff,#0f4fd6);border-color:#1f6fff;box-shadow:0 16px 38px rgba(31,111,255,.24)}
.sectionBlock{margin:0 clamp(14px,3vw,38px) 18px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.078),rgba(255,255,255,.032));border-radius:34px;padding:24px;box-shadow:0 24px 74px rgba(0,0,0,.28)}.sectionBlock.compact{margin:0}.sectionTitle{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:18px}.sectionTitle h2{margin:7px 0 0;font-size:clamp(30px,4vw,50px);line-height:.92;letter-spacing:-.07em}.sectionAction{color:#8eb4ff}
.productGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.productCard{border-radius:26px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.038));display:grid;grid-template-rows:250px auto;min-height:410px;transition:.18s ease;box-shadow:0 18px 50px rgba(0,0,0,.18)}.productCard:hover,.feedCard:hover,.storeCard:hover,.miniStore:hover,.videoRow:hover{transform:translateY(-3px);border-color:rgba(142,180,255,.52);box-shadow:0 22px 60px rgba(0,0,0,.3)}.productMedia,.feedMedia,.storeImage,.postMedia,.videoThumb,.miniStoreImage{width:100%;height:100%;object-fit:cover;display:block;background:#0d1322}.productBody{padding:15px;display:grid;gap:6px}.productBody span{color:#8eb4ff;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.1em}.productBody strong{font-size:20px;line-height:1.08;letter-spacing:-.025em}.productBody small{color:rgba(255,255,255,.66);font-weight:850}.productBody b{color:#66a0ff;font-size:24px}

video.productMedia,video.feedMedia,video.postMedia,video.videoThumb,video.miniStoreImage{display:block;object-fit:cover;background:#05070d;transform:translateZ(0);backface-visibility:hidden;will-change:transform}
.twoColumn{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.82fr);gap:18px;margin:0 clamp(14px,3vw,38px) 18px}.videoStack,.miniStoreList,.ordersList{display:grid;gap:12px}.videoRow,.miniStore,.orderCard{border-radius:24px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.078),rgba(255,255,255,.04));padding:12px}.videoRow,.miniStore{display:grid;grid-template-columns:116px minmax(0,1fr);gap:13px;align-items:center}.videoThumb,.miniStoreImage,.orderLogo{width:116px;height:88px;border-radius:19px;object-fit:cover;overflow:hidden}.videoRow strong,.miniStore strong{display:block;line-height:1.12;font-size:18px}.videoRow span,.miniStore span{display:block;margin-top:5px;color:rgba(255,255,255,.68);font-weight:850}.videoRow small{display:block;margin-top:7px;color:#8eb4ff;font-weight:1000}
.filterRail{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin-bottom:18px}.discoverGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.feedCard{position:relative;min-height:380px;border-radius:28px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:#0d1322;isolation:isolate;transition:.18s ease}.feedMedia{position:absolute;inset:0}.feedShade{position:absolute;inset:0;z-index:1;background:linear-gradient(0deg,rgba(0,0,0,.9),transparent 50%,rgba(0,0,0,.22))}.feedTop{position:absolute;z-index:2;top:12px;left:12px;right:12px;display:flex;gap:8px;align-items:center}.tinyLogo,.tinyLogoText{width:38px;height:38px;border-radius:999px;overflow:hidden;object-fit:cover;display:grid;place-items:center;background:#1f6fff;border:1px solid rgba(255,255,255,.24);font-weight:1000}.feedTop b{border-radius:999px;background:rgba(31,111,255,.94);padding:7px 10px;font-size:11px;font-weight:1000;text-transform:uppercase}.feedBottom{position:absolute;z-index:2;left:14px;right:14px;bottom:14px;text-shadow:0 8px 24px rgba(0,0,0,.78)}.feedBottom strong{display:block;font-size:24px;line-height:1.03;letter-spacing:-.04em}.feedBottom small{display:block;color:rgba(255,255,255,.8);font-weight:850;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.feedBottom div{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}.feedBottom em,.feedBottom span{border-radius:999px;background:rgba(0,0,0,.66);border:1px solid rgba(255,255,255,.12);padding:6px 10px;font-size:12px;font-weight:1000;font-style:normal}.feedBottom em{background:#1f6fff}
.storeGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.storeCard{overflow:hidden;border-radius:28px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.078),rgba(255,255,255,.038));display:grid;grid-template-columns:150px minmax(0,1fr);min-height:164px;box-shadow:0 18px 54px rgba(0,0,0,.18)}.storeImage{width:150px;height:164px}.storeCard div{padding:16px;display:grid;align-content:center;gap:7px}.storeCard strong{font-size:22px;line-height:1.06;letter-spacing:-.035em}.storeCard span{color:#8eb4ff;font-weight:1000}.storeCard small{color:rgba(255,255,255,.64);font-weight:850}
.orderCard{display:flex;align-items:center;justify-content:space-between;gap:16px}.orderBrand{display:flex;align-items:center;gap:12px;min-width:0}.orderLogo{width:72px;height:72px;flex:0 0 auto}.orderBrand strong{display:block;font-size:19px}.orderBrand span{display:block;margin-top:4px;color:rgba(255,255,255,.64);font-weight:850}.orderMeta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}.orderMeta span{border-radius:999px;background:#1f6fff;padding:8px 12px;font-size:12px;font-weight:1000}.orderMeta b{font-size:22px}.orderMeta a{color:#8eb4ff;font-weight:1000}
.postGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.postCard{border-radius:26px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.078),rgba(255,255,255,.038))}.postMedia{height:250px}.postCard div{padding:14px;display:grid;gap:5px}.postCard strong{line-height:1.12}.postCard span{color:rgba(255,255,255,.64);font-weight:850}.postCard small{color:#8eb4ff;font-weight:1000}
.profileGrid{display:grid;grid-template-columns:320px minmax(0,1fr);gap:18px}.profileInfoCard,.profileFields{border-radius:28px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.078),rgba(255,255,255,.038));padding:22px}.profileInfoCard{text-align:center}.profileInfoCard h2{margin:16px 0 6px}.profileInfoCard p{margin:0;color:rgba(255,255,255,.64);font-weight:850}.profileFields{display:grid;gap:14px}.profileFields label{display:grid;gap:8px;color:#8eb4ff;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.12em}.profileFields input{width:100%;min-height:56px;border:1px solid rgba(255,255,255,.15);border-radius:17px;background:rgba(255,255,255,.085);color:#fff;padding:0 14px;font-size:16px;font-weight:900}.noticeBox,.emptyBlock{border-radius:24px;border:1px solid rgba(142,180,255,.24);background:linear-gradient(180deg,rgba(31,111,255,.13),rgba(255,255,255,.045));padding:18px;color:rgba(255,255,255,.78);font-weight:850}.emptyBlock{min-height:230px;display:grid;place-items:center;text-align:center;align-content:center}.emptyBlock b{font-size:25px;color:#fff}.emptyBlock p{margin:8px auto 0;max-width:560px}.emptyBlock div{margin-top:16px}
.mediaBlank{width:100%;height:100%;min-height:120px;display:grid;place-items:center;align-content:center;gap:8px;text-align:center;background:radial-gradient(circle at 32% 24%,rgba(31,111,255,.48),transparent 34%),linear-gradient(135deg,#101827,#05070d);color:#fff;padding:14px}.mediaBlank span{width:48px;height:48px;border-radius:17px;display:grid;place-items:center;background:linear-gradient(135deg,#1f6fff,#0f4fd6);font-weight:1000}.mediaBlank b{max-width:90%;font-size:14px;line-height:1.15;color:rgba(255,255,255,.86)}
.loadingShell{min-height:100vh;display:grid;place-items:center;align-content:center;gap:12px;text-align:center;padding:30px}.loadingShell .vaultMark{margin:auto}.loadingShell h1{margin:12px 0 0;font-size:clamp(34px,6vw,62px);letter-spacing:-.06em}.loadingShell p{margin:0;max-width:560px;color:rgba(255,255,255,.68);font-weight:850}
.mobileNav{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:120;width:min(760px,calc(100% - 24px));height:78px;border-radius:26px;border:1px solid rgba(255,255,255,.15);background:rgba(6,8,15,.94);backdrop-filter:blur(24px);display:grid;grid-template-columns:repeat(5,1fr);padding:8px;box-shadow:0 24px 80px rgba(0,0,0,.46)}.mobileNav button{border:0;background:transparent;color:rgba(255,255,255,.64);border-radius:19px;font-size:11px;font-weight:1000;display:grid;place-items:center;gap:2px}.mobileNav button span{font-size:18px}.mobileNav button.active{color:#fff;background:linear-gradient(135deg,rgba(31,111,255,.78),rgba(31,111,255,.38))}
@media(max-width:1180px){.productGrid,.discoverGrid,.postGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.storeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:900px){.topBar{grid-template-columns:1fr}.brandLockup{min-width:0}.topActions{display:grid;grid-template-columns:1fr 1fr}.heroCard{grid-template-columns:1fr}.profilePanel{min-height:205px}.statsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.twoColumn{grid-template-columns:1fr}.profileGrid{grid-template-columns:1fr}}
@media(max-width:680px){.vaultCustomerPage{padding-bottom:104px}.heroSection{padding-top:14px}.heroCard{border-radius:30px;padding:24px;min-height:485px}.heroContent h1{font-size:42px}.heroContent p{font-size:16px}.statsGrid{grid-template-columns:1fr 1fr}.sectionBlock{border-radius:26px;padding:18px}.productGrid,.discoverGrid,.postGrid,.storeGrid{grid-template-columns:1fr}.productCard{grid-template-rows:260px auto}.storeCard{grid-template-columns:118px minmax(0,1fr)}.storeImage{width:118px;height:148px}.orderCard{align-items:flex-start;flex-direction:column}.orderMeta{justify-content:flex-start}.mobileNav{height:72px;bottom:10px}}
@media(max-width:420px){.statsGrid{grid-template-columns:1fr}.topActions{grid-template-columns:1fr}.heroButtons{display:grid}}
`;
