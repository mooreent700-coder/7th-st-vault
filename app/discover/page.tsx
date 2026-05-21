'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { supabase } from '@/lib/supabase';

type StoreRow = {
  id: string;
  name: string | null;
  slug: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  category?: string | null;
  business_type?: string | null;
  store_type?: string | null;
  hero_image?: string | null;
  logo_image?: string | null;
  cover_image?: string | null;
  cover_video?: string | null;
  hero_video?: string | null;
  hero_video_url?: string | null;
  hero_video_file?: string | null;
  public_visible?: boolean | null;
  featured?: boolean | null;
  views?: number | null;
  created_at?: string | null;
  photo_url?: string | null;
  thumbnail_url?: string | null;
  thumbnail?: string | null;
  image?: string | null;
  photo?: string | null;
  file_url?: string | null;
  upload_url?: string | null;
  public_url?: string | null;
  video?: string | null;
  product_media?: string | null;
  media_file?: string | null;
  media_path?: string | null;
  item_media?: string | null;
};

type ProductRow = {
  id: string;
  restaurant_id: string | null;
  category_id?: string | null;
  name: string | null;
  description?: string | null;
  image_url?: string | null;
  image_file?: string | null;
  item_image?: string | null;
  product_image?: string | null;
  product_photo?: string | null;
  media_url?: string | null;
  video_url?: string | null;
  video_file?: string | null;
  item_video?: string | null;
  menu_video?: string | null;
  product_video?: string | null;
  media_type?: string | null;
  price?: number | null;
  base_price?: number | null;
  availability?: string | null;
  is_available?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
  item_video_url?: string | null;
  item_video_file?: string | null;
  product_video_url?: string | null;
  product_video_file?: string | null;
  product_video_path?: string | null;
  menu_video_url?: string | null;
  menu_video_file?: string | null;
  video_path?: string | null;
  video_storage_path?: string | null;
  video_public_url?: string | null;
  product_video_public_url?: string | null;
  media_video?: string | null;
  media_video_url?: string | null;
  media_video_file?: string | null;
  photo_url?: string | null;
  thumbnail_url?: string | null;
  thumbnail?: string | null;
  image?: string | null;
  photo?: string | null;
  file_url?: string | null;
  upload_url?: string | null;
  public_url?: string | null;
  video?: string | null;
  product_media?: string | null;
  media_file?: string | null;
  media_path?: string | null;
  item_media?: string | null;
};

type CollectionRow = {
  id: string;
  restaurant_id: string | null;
  name: string | null;
  sort_order?: number | null;
};

type MediaRow = {
  id: string;
  restaurant_id: string | null;
  media_type: string | null;
  media_url: string | null;
  caption: string | null;
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

type LikeRow = {
  source_table: string;
  source_id: string;
  device_id?: string | null;
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
const CUSTOMER_SIGNUP_PATH = '/customer/signup';
const SELLER_SIGNUP_PATH = '/auth/signup';
const INITIAL_VISIBLE_COUNT = 30;
const LOAD_MORE_COUNT = 18;

const STYLE_TABS = [
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
  'Sale',
  'Customer Posts',
];

const FASHION_FALLBACKS = [
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
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
  const { data } = supabase.storage.from(bucket).getPublicUrl(clean);
  return data.publicUrl;
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
  const raw = String(value || '').trim();
  if (!raw || raw === 'null' || raw === 'undefined') return '';
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw;
  if (isFullUrl(raw)) return raw;
  if (raw.startsWith('/')) return raw;

  const decoded = decodeURIComponent(raw);
  const cleaned = decoded
    .replace(/^public\//, '')
    .replace(/^storage\/v1\/object\/public\//, '')
    .replace(/^object\/public\//, '')
    .replace(/^\/+/, '');

  const lower = cleaned.toLowerCase();

  // CRITICAL:
  // Product videos from the builder/storefront are saved in bucket "product-videos"
  // and the object path may also start with "product-videos/...".
  // The storefront keeps that folder in the object path. Discovery must do the same.
  if (bucket === VIDEO_BUCKET || bucket === 'product-videos') {
    return bucketUrl(cleaned, VIDEO_BUCKET);
  }

  if (bucket === IMAGE_BUCKET || bucket === 'product-images') {
    if (lower.startsWith('product-images/')) return bucketUrl(cleaned.slice('product-images/'.length), IMAGE_BUCKET);
    return bucketUrl(cleaned, IMAGE_BUCKET);
  }

  if (lower.startsWith('branding/')) return bucketUrl(cleaned.slice('branding/'.length), BRANDING_BUCKET);
  if (lower.startsWith('store-media/')) return bucketUrl(cleaned.slice('store-media/'.length), STORE_MEDIA_BUCKET);
  if (lower.startsWith('menu-images/')) return bucketUrl(cleaned.slice('menu-images/'.length), 'menu-images');
  if (lower.startsWith('customer-posts/')) return bucketUrl(cleaned.slice('customer-posts/'.length), CUSTOMER_POST_BUCKET);

  const knownBucketMatch = cleaned.match(/^(product-images|branding|store-media|restaurant-media|seller-media|product-media|7sv-media|vault-media)\/(.+)$/);
  if (knownBucketMatch) return bucketUrl(knownBucketMatch[2], knownBucketMatch[1]);

  return bucketUrl(cleaned, bucket);
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

  // CRITICAL: video bucket keeps the full path, same as storefront.
  if (bucket === VIDEO_BUCKET || bucket === 'product-videos') {
    add(bucketUrl(cleaned, VIDEO_BUCKET));

    if (!/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(cleaned)) {
      ['mp4', 'webm', 'mov', 'm4v'].forEach((ext) => add(bucketUrl(`${cleaned}.${ext}`, VIDEO_BUCKET)));
    }

    // Backup only: if DB saved path without bucket prefix.
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

  if (lower.startsWith('branding/')) {
    add(bucketUrl(cleaned.slice('branding/'.length), BRANDING_BUCKET));
    return list;
  }

  if (lower.startsWith('store-media/')) {
    add(bucketUrl(cleaned.slice('store-media/'.length), STORE_MEDIA_BUCKET));
    return list;
  }

  if (lower.startsWith('customer-posts/')) {
    add(bucketUrl(cleaned.slice('customer-posts/'.length), CUSTOMER_POST_BUCKET));
    return list;
  }

  add(bucketUrl(cleaned, bucket));
  return list;
}

function firstResolved(values: Array<string | null | undefined>, bucket = STORAGE_BUCKET) {
  for (const value of values) {
    const urls = mediaCandidates(value, bucket);
    if (urls.length) return urls[0];
  }
  return '';
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


function productImageValues(product: ProductRow) {
  const row = product as ProductRow & Record<string, string | null | undefined>;

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

function productVideoValues(product: ProductRow) {
  const row = product as ProductRow & Record<string, string | null | undefined>;
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

function productImageUrl(product: ProductRow) {
  return firstResolved(productImageValues(product), IMAGE_BUCKET);
}

function productImageCandidates(product: ProductRow) {
  return firstCandidateList(productImageValues(product), IMAGE_BUCKET);
}

function productVideoUrl(product: ProductRow) {
  return firstResolved(productVideoValues(product), VIDEO_BUCKET);
}

function productVideoCandidates(product: ProductRow) {
  return firstCandidateList(productVideoValues(product), VIDEO_BUCKET);
}

function hasProductVideo(product: ProductRow) {
  return productVideoValues(product).length > 0;
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

function fallbackFashionImage(key: string) {
  return FASHION_FALLBACKS[stableNumberSeed(key, 0, FASHION_FALLBACKS.length - 1)];
}

function svgFallback(label?: string | null, sublabel?: string | null) {
  const safeLabel = encodeURIComponent(cleanText(label, '7TH ST VAULT').slice(0, 32));
  const safeSub = encodeURIComponent(cleanText(sublabel, 'SELLER MEDIA').slice(0, 34));
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2302060d'/%3E%3Cstop offset='0.55' stop-color='%230b111d'/%3E%3Cstop offset='1' stop-color='%230f1e3a'/%3E%3C/linearGradient%3E%3CradialGradient id='b' cx='70%25' cy='24%25' r='60%25'%3E%3Cstop offset='0' stop-color='%231f6bff' stop-opacity='.32'/%3E%3Cstop offset='.55' stop-color='%231f6bff' stop-opacity='.08'/%3E%3Cstop offset='1' stop-color='%231f6bff' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='900' fill='url(%23g)'/%3E%3Crect width='1200' height='900' fill='url(%23b)'/%3E%3Ccircle cx='185' cy='160' r='58' fill='none' stroke='%231f6bff' stroke-width='15' opacity='.8'/%3E%3Ctext x='80' y='500' fill='white' font-family='Arial Black, Arial' font-size='82' font-weight='900' letter-spacing='4'%3E${safeLabel}%3C/text%3E%3Ctext x='84' y='585' fill='%237aa7ff' font-family='Arial, sans-serif' font-size='34' font-weight='800' letter-spacing='8'%3E${safeSub}%3C/text%3E%3Ctext x='84' y='665' fill='%23aeb8cc' font-family='Arial, sans-serif' font-size='26' font-weight='700'%3EUpload product image or video%3C/text%3E%3C/svg%3E`;
}

function isLiveProduct(row: ProductRow) {
  const availability = String(row.availability || '').toLowerCase().trim();
  if (row.is_available === false) return false;
  if (!String(row.name || '').trim()) return false;
  if (['deleted', 'delete', 'removed', 'hidden', 'inactive', 'archived', 'draft', 'sold_out'].includes(availability)) return false;
  return true;
}

function getDisplayCity(store: StoreRow) {
  const city = cleanText(store.city);
  if (city) return city;
  const address = cleanText(store.address);
  if (!address) return 'Online';
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2].replace(/\d+/g, '').trim() || 'Online';
  return address;
}

function getSellerType(store: StoreRow) {
  const typeText = normalizeText(`${store.business_type || ''} ${store.store_type || ''} ${store.category || ''} ${store.name || ''}`);
  if (typeText.includes('jewelry')) return 'Jewelry Seller';
  if (typeText.includes('shoe') || typeText.includes('sneaker')) return 'Shoe Seller';
  if (typeText.includes('boutique')) return 'Boutique';
  if (typeText.includes('kid')) return 'Kids Fashion';
  if (typeText.includes('luxury')) return 'Luxury Seller';
  if (typeText.includes('street')) return 'Streetwear Brand';
  return 'Fashion Seller';
}

function tileMatchesSearch(tile: FeedTile, queryText: string) {
  const query = normalizeText(queryText);
  if (!query) return true;
  const combined = normalizeText(`${tile.city} ${tile.state} ${tile.address} ${tile.storeName} ${tile.collection} ${tile.title} ${tile.subtitle} ${tile.sellerType}`);
  return combined.includes(query);
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

function safeTileFallback(tile: Pick<FeedTile, 'collection' | 'title' | 'storeName' | 'posterUrl'>) {
  return tile.posterUrl || svgFallback(tile.title, tile.storeName);
}

function AutoVideo({ src, poster, candidates = [], posterCandidates = [] }: { src: string; poster: string; candidates?: string[]; posterCandidates?: string[] }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const urls = useMemo(() => {
    const seen = new Set<string>();
    return [src, ...candidates]
      .map((url) => String(url || '').trim())
      .filter(Boolean)
      .filter((url) => {
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      });
  }, [src, candidates]);

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const activeSrc = urls[index] || '';

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [src, candidates]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !activeSrc || failed) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;

    const play = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.play().catch(() => null);
    };

    const timer = window.setTimeout(play, 120);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) play();
        else video.pause();
      },
      { rootMargin: '360px 0px', threshold: 0.05 }
    );

    observer.observe(video);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      video.pause();
    };
  }, [activeSrc, failed]);

  if (!activeSrc || failed) {
    return <SafeImage src={poster || posterCandidates[0] || ''} fallback={poster || posterCandidates[0] || ''} alt="Product video preview" candidates={posterCandidates} />;
  }

  return (
    <video
      ref={ref}
      key={activeSrc}
      src={activeSrc}
      poster={poster || posterCandidates[0] || undefined}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className="tileMedia"
      controls={false}
      disablePictureInPicture
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.play().catch(() => null);
      }}
      onCanPlay={(event) => {
        const video = event.currentTarget;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.play().catch(() => null);
      }}
      onError={() => {
        if (index < urls.length - 1) setIndex((current) => current + 1);
        else setFailed(true);
      }}
    />
  );
}

function SafeImage({ src, fallback, alt, candidates = [] }: { src: string; fallback: string; alt: string; candidates?: string[] }) {
  const finalFallback = fallback || svgFallback(alt, '7th St Vault');
  const allCandidates = useMemo(() => {
    const seen = new Set<string>();
    return [src, ...candidates, finalFallback, svgFallback(alt, '7th St Vault')].filter(Boolean).filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, [src, candidates, finalFallback, alt]);
  const [index, setIndex] = useState(0);
  const currentSrc = allCandidates[index] || finalFallback;
  useEffect(() => setIndex(0), [src, finalFallback]);
  return (
    <img
      src={currentSrc || finalFallback}
      alt={alt}
      className="tileMedia"
      loading="lazy"
      decoding="async"
      onError={() => {
        setIndex((current) => Math.min(current + 1, allCandidates.length - 1));
      }}
    />
  );
}

export default function DiscoverPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [mediaRows, setMediaRows] = useState<MediaRow[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPostRow[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedLikeCounts, setSavedLikeCounts] = useState<Record<string, number>>({});
  const [deviceId, setDeviceId] = useState('');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      let id = window.localStorage.getItem('vault_discover_device_id');
      if (!id) {
        id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `vault-device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.localStorage.setItem('vault_discover_device_id', id);
      }
      setDeviceId(id);
    } catch {
      setDeviceId(`vault-device-${Date.now()}`);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [storeResult, categoryResult, productResult, mediaResult, postResult, likeResult] = await Promise.all([
        supabase.from('restaurants').select('*').or('public_visible.is.null,public_visible.eq.true').not('slug', 'is', null).limit(300),
        supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }).limit(700),
        supabase.from('menu_items').select('*').order('sort_order', { ascending: true }).limit(900),
        supabase.from('restaurant_media').select('*').order('created_at', { ascending: false }).limit(700),
        supabase.from('customer_posts').select('id,customer_id,customer_name,caption,media_url,media_type,likes,likes_count,views,comments_count,created_at').order('created_at', { ascending: false }).limit(700),
        supabase.from('discover_likes').select('source_table,source_id,device_id').limit(7000),
      ]);

      if (storeResult.error) console.error('7th St Vault stores load error:', storeResult.error);
      if (categoryResult.error) console.error('7th St Vault collections load error:', categoryResult.error);
      if (productResult.error) console.error('7th St Vault products load error:', productResult.error);
      if (mediaResult.error) console.error('7th St Vault media load error:', mediaResult.error);
      if (postResult.error) console.error('7th St Vault customer posts load error:', postResult.error);
      if (likeResult.error) console.error('7th St Vault likes load error:', likeResult.error);

      const nextSavedLikeCounts: Record<string, number> = {};
      const nextLikedPosts: Record<string, boolean> = {};

      ((likeResult.data || []) as LikeRow[]).forEach((row) => {
        const sourceTable = String(row.source_table || '').trim();
        const sourceId = String(row.source_id || '').trim();
        if (!sourceTable || !sourceId) return;
        const metricKey = `${sourceTable}:${sourceId}`;
        nextSavedLikeCounts[metricKey] = Number(nextSavedLikeCounts[metricKey] || 0) + 1;
        if (row.device_id && row.device_id === deviceId) nextLikedPosts[`like:${metricKey}`] = true;
      });

      setStores((storeResult.data || []) as StoreRow[]);
      setCollections((categoryResult.data || []) as CollectionRow[]);
      setProducts((productResult.data || []) as ProductRow[]);
      setMediaRows((mediaResult.data || []) as MediaRow[]);
      setCustomerPosts((postResult.data || []) as CustomerPostRow[]);
      setSavedLikeCounts(nextSavedLikeCounts);
      setLikedPosts(nextLikedPosts);
      setLoading(false);
    }

    void load();

    const channel = supabase
      .channel('vault-discover-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_media' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => void load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'discover_likes' }, (payload) => {
        const inserted = payload.new as LikeRow;
        const sourceTable = String(inserted.source_table || '').trim();
        const sourceId = String(inserted.source_id || '').trim();
        if (!sourceTable || !sourceId) return;
        const metricKey = `${sourceTable}:${sourceId}`;
        setSavedLikeCounts((current) => ({ ...current, [metricKey]: Number(current[metricKey] || 0) + 1 }));
        if (inserted.device_id && inserted.device_id === deviceId) setLikedPosts((current) => ({ ...current, [`like:${metricKey}`]: true }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const collectionById = useMemo(() => {
    const map = new Map<string, CollectionRow>();
    collections.forEach((collection) => map.set(collection.id, collection));
    return map;
  }, [collections]);

  const feed = useMemo<FeedTile[]>(() => {
    const storeById = new Map<string, StoreRow>();
    stores.forEach((store) => storeById.set(store.id, store));

    const tiles: FeedTile[] = [];

    products.filter(isLiveProduct).forEach((product) => {
      if (!product.restaurant_id) return;
      const store = storeById.get(product.restaurant_id);
      if (!store?.slug) return;

      const collectionName = cleanText(collectionById.get(product.category_id || '')?.name, collectionFromText(`${store.category || ''} ${product.name || ''} ${product.description || ''}`));
      const imageUrl = productImageUrl(product);
      const imageCandidates = productImageCandidates(product);
      const videoCandidates = productVideoCandidates(product);
      const videoUrl = videoCandidates[0] || '';
      const hasVideo = productVideoValues(product).length > 0 && videoCandidates.length > 0;
      const mediaUrl = hasVideo ? videoUrl : imageUrl;
      const posterUrl = imageUrl || imageCandidates[0] || '';

      tiles.push({
        id: `product_${product.id}`,
        sourceTable: 'menu_items',
        rawId: product.id,
        storeId: store.id,
        slug: store.slug,
        storeName: cleanText(store.name, '7th St Vault Seller'),
        logoUrl: firstResolved([store.logo_image], BRANDING_BUCKET),
        collection: collectionName,
        city: getDisplayCity(store),
        state: cleanText(store.state),
        address: cleanText(store.address),
        sellerType: getSellerType(store),
        mediaType: hasVideo ? 'video' : 'image',
        mediaUrl: mediaUrl || posterUrl,
        mediaCandidates: hasVideo ? videoCandidates : imageCandidates,
        posterUrl,
        posterCandidates: imageCandidates,
        title: cleanText(product.name, 'Fashion Product'),
        subtitle: cleanText(product.description, 'Fashion product ready for customers to shop.'),
        price: Number(product.base_price ?? product.price ?? 0),
        likes: 0,
        views: Number(store.views || 0),
        featured: Boolean(store.featured),
        createdAt: product.created_at || store.created_at || '',
        isCustomerPost: false,
      });
    });

    mediaRows.forEach((media) => {
      if (!media.restaurant_id || !media.media_url) return;
      const store = storeById.get(media.restaurant_id);
      if (!store?.slug) return;
      const mediaUrl = resolveStorageUrl(media.media_url);
      if (!mediaUrl) return;
      const type = String(media.media_type || '').toLowerCase().includes('video') || isVideoUrl(mediaUrl) ? 'video' : 'image';
      const collection = collectionFromText(`${store.category || ''} ${media.caption || ''}`);
      const poster = firstResolved([store.cover_image, store.hero_image], STORE_MEDIA_BUCKET) || firstResolved([store.logo_image], BRANDING_BUCKET) || svgFallback(media.caption, store.name);

      tiles.push({
        id: `media_${media.id}`,
        sourceTable: 'restaurant_media',
        rawId: media.id,
        storeId: store.id,
        slug: store.slug,
        storeName: cleanText(store.name, '7th St Vault Seller'),
        logoUrl: firstResolved([store.logo_image], BRANDING_BUCKET),
        collection,
        city: getDisplayCity(store),
        state: cleanText(store.state),
        address: cleanText(store.address),
        sellerType: getSellerType(store),
        mediaType: type,
        mediaUrl,
        mediaCandidates: mediaCandidates(media.media_url, STORE_MEDIA_BUCKET),
        posterUrl: type === 'image' ? mediaUrl : poster,
        posterCandidates: type === 'image' ? mediaCandidates(media.media_url, STORE_MEDIA_BUCKET) : firstCandidateList([store.cover_image, store.hero_image], STORE_MEDIA_BUCKET).concat(firstCandidateList([store.logo_image], BRANDING_BUCKET)),
        title: cleanText(media.caption, cleanText(store.name, 'Seller Upload')),
        subtitle: `${cleanText(store.name, 'Vault Seller')} • ${collection}`,
        price: 0,
        likes: Number(media.likes || 0),
        views: Number(media.views || store.views || 0),
        featured: Boolean(store.featured),
        createdAt: media.created_at || store.created_at || '',
        isCustomerPost: false,
      });
    });

    customerPosts.forEach((post) => {
      const mediaUrl = resolveStorageUrl(post.media_url, CUSTOMER_POST_BUCKET);
      if (!mediaUrl && !post.caption) return;
      const caption = cleanText(post.caption, 'Fashion community post');
      const customerName = cleanText(post.customer_name, 'Vault Customer');
      const collection = collectionFromText(caption);
      const type = String(post.media_type || '').toLowerCase().includes('video') || isVideoUrl(mediaUrl) ? 'video' : 'image';

      tiles.push({
        id: `customer_${post.id}`,
        sourceTable: 'customer_posts',
        rawId: post.id,
        storeId: '',
        slug: '',
        storeName: customerName,
        logoUrl: '',
        collection,
        city: 'Community',
        state: '',
        address: '',
        sellerType: 'Customer Post',
        mediaType: type,
        mediaUrl: mediaUrl || svgFallback(caption, customerName),
        mediaCandidates: mediaCandidates(post.media_url, CUSTOMER_POST_BUCKET),
        posterUrl: svgFallback(caption, customerName),
        posterCandidates: mediaCandidates(post.media_url, CUSTOMER_POST_BUCKET),
        title: caption,
        subtitle: `${customerName} • 7th St Vault Community`,
        price: 0,
        likes: Number(post.likes ?? post.likes_count ?? 0),
        views: Number(post.views || 0),
        featured: false,
        createdAt: post.created_at || '',
        isCustomerPost: true,
      });
    });

    stores
      .filter((store) => store.slug)
      .filter((store) => !tiles.some((tile) => tile.storeId === store.id))
      .forEach((store) => {
        const heroVideo = firstResolved([store.cover_video, store.hero_video, store.hero_video_url, store.hero_video_file], STORE_MEDIA_BUCKET);
        const heroImage = firstResolved([store.cover_image, store.hero_image], STORE_MEDIA_BUCKET) || firstResolved([store.logo_image], BRANDING_BUCKET) || svgFallback(store.name, getSellerType(store));
        const type = isVideoUrl(heroVideo) ? 'video' : 'image';
        const collection = collectionFromText(`${store.category || ''} ${store.name || ''}`);
        tiles.push({
          id: `store_${store.id}`,
          sourceTable: 'restaurants',
          rawId: store.id,
          storeId: store.id,
          slug: store.slug || '',
          storeName: cleanText(store.name, '7th St Vault Seller'),
          logoUrl: firstResolved([store.logo_image], BRANDING_BUCKET),
          collection,
          city: getDisplayCity(store),
          state: cleanText(store.state),
          address: cleanText(store.address),
          sellerType: getSellerType(store),
          mediaType: type,
          mediaUrl: type === 'video' ? heroVideo : heroImage,
          mediaCandidates: type === 'video' ? firstCandidateList([store.cover_video, store.hero_video, store.hero_video_url, store.hero_video_file], STORE_MEDIA_BUCKET) : firstCandidateList([store.cover_image, store.hero_image], STORE_MEDIA_BUCKET).concat(firstCandidateList([store.logo_image], BRANDING_BUCKET)),
          posterUrl: heroImage,
          posterCandidates: firstCandidateList([store.cover_image, store.hero_image], STORE_MEDIA_BUCKET).concat(firstCandidateList([store.logo_image], BRANDING_BUCKET)),
          title: cleanText(store.name, 'Fashion Brand'),
          subtitle: [getSellerType(store), getDisplayCity(store)].filter(Boolean).join(' • '),
          price: 0,
          likes: 0,
          views: Number(store.views || 0),
          featured: Boolean(store.featured),
          createdAt: store.created_at || '',
          isCustomerPost: false,
        });
      });

    return tiles.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [collectionById, customerPosts, mediaRows, products, stores]);

  const matchingStores = useMemo(() => {
    const query = normalizeText(search);
    if (!query) return [];
    const map = new Map<string, { slug: string; name: string; location: string }>();
    feed.forEach((tile) => {
      if (!tile.slug || !tileMatchesSearch(tile, query)) return;
      map.set(tile.slug, {
        slug: tile.slug,
        name: cleanText(tile.storeName, 'Open Store'),
        location: cleanText(tile.address) || [tile.city, tile.state].filter(Boolean).join(', ') || tile.city,
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 16);
  }, [feed, search]);

  function engagementKey(tile: FeedTile) {
    return `${tile.sourceTable}:${tile.rawId}`;
  }

  function likeKey(tile: FeedTile) {
    return `like:${engagementKey(tile)}`;
  }

  function liveLikes(tile: FeedTile) {
    if (tile.isCustomerPost) return Number(tile.likes || 0);
    return Number(tile.likes || 0) + Number(savedLikeCounts[engagementKey(tile)] || 0) + stableNumberSeed(`${tile.id}:likes`, 18, 180);
  }

  function liveViews(tile: FeedTile) {
    if (tile.isCustomerPost) return Number(tile.views || 0);
    return Number(tile.views || 0) + stableNumberSeed(`${tile.id}:views`, 140, 980);
  }

  const filteredFeed = useMemo(() => {
    return feed.filter((tile) => {
      const searchHit = tileMatchesSearch(tile, search);
      const tab = activeTab.toLowerCase();
      const tabHit =
        activeTab === 'All' ||
        (activeTab === 'Customer Posts' && tile.isCustomerPost) ||
        (activeTab === 'Videos' && tile.mediaType === 'video') ||
        (activeTab === 'Trending' && (liveViews(tile) > 250 || liveLikes(tile) > 25 || tile.featured)) ||
        (activeTab === 'Featured' && tile.featured) ||
        normalizeText(tile.collection).includes(tab) ||
        normalizeText(tile.title).includes(tab) ||
        normalizeText(tile.subtitle).includes(tab) ||
        normalizeText(tile.sellerType).includes(tab);
      return searchHit && tabHit;
    });
  }, [activeTab, feed, search, savedLikeCounts]);

  const visibleFeed = filteredFeed.slice(0, visibleCount);
  const searchActive = search.trim().length > 0;
  const featuredTiles = filteredFeed.slice(0, 4);
  const heroTile = filteredFeed.find((tile) => normalizeText(tile.collection).includes('men')) || filteredFeed[0];
  const womenTiles = filteredFeed.filter((tile) => normalizeText(tile.collection).includes('women')).slice(0, 4);
  const lowerTiles = womenTiles.length ? womenTiles : filteredFeed.slice(4, 8);

  function tileHref(tile: FeedTile) {
    return tile.slug ? `/store/${tile.slug}` : CUSTOMER_SIGNUP_PATH;
  }

  async function handleTileLike(tile: FeedTile, event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!deviceId) return;
    const key = likeKey(tile);
    const metricKey = engagementKey(tile);
    if (likedPosts[key]) return;

    setLikedPosts((current) => ({ ...current, [key]: true }));
    setSavedLikeCounts((current) => ({ ...current, [metricKey]: Number(current[metricKey] || 0) + 1 }));

    const { error } = await supabase.from('discover_likes').insert({
      source_table: tile.sourceTable,
      source_id: tile.rawId,
      device_id: deviceId,
    });

    if (error && error.code !== '23505') {
      console.error('7th St Vault like save error:', error);
      setLikedPosts((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setSavedLikeCounts((current) => ({ ...current, [metricKey]: Math.max(0, Number(current[metricKey] || 0) - 1) }));
    }
  }

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeTab, search]);

  function ProductCard({ tile }: { tile: FeedTile }) {
    const fallback = tile.mediaType === 'video' ? (tile.posterUrl || tile.posterCandidates?.[0] || '') : safeTileFallback(tile);
    return (
      <Link href={tileHref(tile)} className="productCard">
        <div className="productImage">
          {tile.mediaType === 'video' && tile.mediaCandidates.length ? <AutoVideo src={tile.mediaUrl} poster={fallback} candidates={tile.mediaCandidates} posterCandidates={tile.posterCandidates} /> : <SafeImage src={tile.mediaUrl || fallback} fallback={fallback} alt={tile.title} candidates={tile.mediaCandidates.length ? tile.mediaCandidates : tile.posterCandidates} />}
        </div>
        <div className="productInfo">
          <strong>{tile.title}</strong>
          <em>{money(tile.price)}</em>
          <small>{tile.storeName} <span>◆</span></small>
        </div>
      </Link>
    );
  }

  function FeaturePanel({ tile }: { tile: FeedTile }) {
    const fallback = tile.mediaType === 'video' ? (tile.posterUrl || tile.posterCandidates?.[0] || '') : safeTileFallback(tile);
    return (
      <Link href={tileHref(tile)} className="featurePanel">
        <div className="featureMedia">
          {tile.mediaType === 'video' && tile.mediaCandidates.length ? <AutoVideo src={tile.mediaUrl} poster={fallback} candidates={tile.mediaCandidates} posterCandidates={tile.posterCandidates} /> : <SafeImage src={tile.mediaUrl || fallback} fallback={fallback} alt={tile.title} candidates={tile.mediaCandidates.length ? tile.mediaCandidates : tile.posterCandidates} />}
        </div>
        <div className="featureBody">
          <div>
            <h3>{tile.collection}</h3>
            <span>{tile.collection}</span>
          </div>
          <p>{tile.subtitle || 'Fashion products ready for customers to shop.'}</p>
          <b>Browse {tile.collection} →</b>
        </div>
      </Link>
    );
  }

  return (
    <main className="discoverPage">
      <header className="topBar">
        <Link href="/" className="brandMark" aria-label="7th St Vault Home">
          <strong>7SV</strong>
          <span>7TH ST VAULT</span>
        </Link>

        <div className="topActions">
          <Link href={CUSTOMER_SIGNUP_PATH} prefetch className="customerSignupButton">
            <span>⌾</span>
            Customer Create Free Account
          </Link>

          <Link href={SELLER_SIGNUP_PATH} prefetch className="ownerSignupButton">
            <span>▢</span>
            Fashion Seller Sign Up For Free
          </Link>
        </div>

        <button type="button" className="bellButton" aria-label="Notifications">⌁</button>
        <Link href="/" className="miniMark" aria-label="7th St Vault">7SV</Link>
      </header>

      <section className="heroSearch">
        <h1>
          Search <span>Fashion Brands</span>
        </h1>
        <p>Discover <b>streetwear</b>, luxury, sneakers, denim, jewelry & more</p>

        <div className="searchBox">
          <span>⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search streetwear, sneakers, denim, jewelry, kids fashion..." aria-label="Search 7th St Vault" />
          {searchActive ? <button type="button" onClick={() => setSearch('')}>Clear</button> : <i>☷</i>}
        </div>

        {searchActive && matchingStores.length > 0 ? (
          <div className="storeChips" aria-label="Matching fashion sellers">
            {matchingStores.map((store) => (
              <Link key={store.slug} href={`/store/${store.slug}`} className="storeChip">
                <span>{store.name}</span>
                <small>{store.location}</small>
                <b>Open Store →</b>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="resultLine">
          Showing <b>{filteredFeed.length}</b> fashion products, videos, sellers, and customer posts
        </div>
      </section>

      <nav className="tabs">
        {STYLE_TABS.map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {loading ? (
        <section className="status">Loading 7th St Vault Discover...</section>
      ) : filteredFeed.length === 0 ? (
        <section className="status">
          <h1>No fashion posts found yet.</h1>
          <p>Seller products, product videos, lookbook media, and customer posts will appear here.</p>
          {searchActive ? <button type="button" className="emptyButton" onClick={() => setSearch('')}>Show all posts</button> : null}
        </section>
      ) : (
        <>
          <section className="premiumLayout">
            <div className="sectionBlock fashionPreview">
              <div className="sectionHead">
                <div>
                  <h2>Fashion <span>Preview</span></h2>
                  <b>Fashion</b>
                </div>
                <Link href="/discover">View All →</Link>
              </div>

              <div className="productStrip">
                {featuredTiles.map((tile) => (
                  <ProductCard key={tile.id} tile={tile} />
                ))}
              </div>
            </div>

            {heroTile ? (
              <aside className="sideStack">
                <FeaturePanel tile={heroTile} />
                <div className="cultureCard">
                  <strong>7SV</strong>
                  <span>7TH ST VAULT</span>
                  <p>Discover. Shop. Support. <b>The Culture.</b></p>
                  <Link href="/discover">Explore All →</Link>
                </div>
              </aside>
            ) : null}

            <div className="sectionBlock lowerBlock">
              <div className="sectionHead">
                <div>
                  <h2>Women</h2>
                  <b>Women</b>
                </div>
                <Link href="/discover">View All →</Link>
              </div>

              <div className="productStrip">
                {lowerTiles.map((tile) => (
                  <ProductCard key={tile.id} tile={tile} />
                ))}
              </div>
            </div>
          </section>

          <section className="exploreSection">
            <div className="sectionHead wide">
              <div>
                <h2>Latest Drops</h2>
                <p>Fresh uploads from fashion sellers and customer posts.</p>
              </div>
            </div>

            <div className="exploreGrid">
              {visibleFeed.map((tile, index) => {
                const fallback = tile.mediaType === 'video' ? (tile.posterUrl || tile.posterCandidates?.[0] || '') : safeTileFallback(tile);
                return (
                  <Link href={tileHref(tile)} key={tile.id} className={`tile ${tile.mediaType === 'video' ? 'videoTile' : ''} ${index % 11 === 0 ? 'bigTile' : ''} ${tile.isCustomerPost ? 'customerTile' : ''}`}>
                    {tile.mediaType === 'video' && tile.mediaCandidates.length ? <AutoVideo src={tile.mediaUrl} poster={fallback} candidates={tile.mediaCandidates} posterCandidates={tile.posterCandidates} /> : <SafeImage src={tile.mediaUrl || fallback} fallback={fallback} alt={tile.title || tile.storeName} candidates={tile.mediaCandidates.length ? tile.mediaCandidates : tile.posterCandidates} />}
                    <div className="tileShade" />

                    <div className="topMeta">
                      {tile.logoUrl ? <img src={tile.logoUrl} alt={tile.storeName} onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <b>{tile.storeName.slice(0, 1)}</b>}
                      <span>{tile.collection}</span>
                      {tile.featured ? <span>Featured</span> : null}
                    </div>

                    <div className="bottomMeta">
                      <strong>{tile.title}</strong>
                      <small>{tile.subtitle || tile.storeName} {timeAgo(tile.createdAt) ? `• ${timeAgo(tile.createdAt)}` : ''}</small>
                      {tile.price > 0 ? <em>{money(tile.price)}</em> : null}

                      <div className="tileStats" aria-label="Post engagement">
                        <button type="button" className={`likeStat likeButton ${likedPosts[likeKey(tile)] ? 'liked' : ''}`} onClick={(event) => handleTileLike(tile, event)}>
                          ♥ {displayCount(liveLikes(tile))}
                        </button>
                        <span className="viewStat">👁 {displayCount(liveViews(tile))}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {visibleCount < filteredFeed.length ? (
            <div className="loadMoreWrap">
              <button type="button" onClick={() => setVisibleCount((current) => current + LOAD_MORE_COUNT)}>Load more fashion</button>
            </div>
          ) : null}
        </>
      )}

      <nav className="bottomNav" aria-label="7th St Vault navigation">
        <Link href="/discover" className="active">⌂ <span>Home</span></Link>
        <Link href="/discover">⌕ <span>Discover</span></Link>
        <Link href={CUSTOMER_SIGNUP_PATH}>⊕ <span>Post</span></Link>
        <Link href={SELLER_SIGNUP_PATH}>▤ <span>Sell</span></Link>
        <Link href="/customer/login">◎ <span>Profile</span></Link>
      </nav>

      <style jsx global>{`
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;background:#020308;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        a{text-decoration:none;color:inherit}
        button,input{font:inherit}
        :root{
          --vault-bg:#020308;
          --vault-panel:#080b12;
          --vault-card:#0d111a;
          --vault-line:rgba(255,255,255,.14);
          --vault-soft:rgba(255,255,255,.68);
          --vault-blue:#1f6bff;
          --vault-blue2:#0047c7;
          --vault-silver:#dce5f5;
        }
        .discoverPage{min-height:100vh;background:radial-gradient(circle at 50% -18%,rgba(31,107,255,.17),transparent 34%),linear-gradient(180deg,#020308 0%,#05070d 42%,#030409 100%);overflow-x:hidden;padding:22px clamp(18px,3vw,44px) 42px}
        .topBar{min-height:88px;border-bottom:1px solid rgba(255,255,255,.08);display:grid;grid-template-columns:190px 1fr 48px 58px;align-items:center;gap:22px;max-width:1500px;margin:0 auto 34px}
        .brandMark{display:flex;flex-direction:column;justify-content:center;border-right:1px solid rgba(255,255,255,.13);min-height:68px}
        .brandMark strong{font-size:43px;line-height:.82;font-weight:1000;letter-spacing:-.13em;font-style:italic;background:linear-gradient(180deg,#fff,#8c95a6 55%,#f5f7fb);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 14px 30px rgba(255,255,255,.08)}
        .brandMark span{font-size:14px;font-weight:900;letter-spacing:.12em;color:#aeb8cc;margin-top:4px}
        .topActions{display:grid;grid-template-columns:minmax(270px,480px) minmax(310px,540px);gap:18px;align-items:center}
        .customerSignupButton,.ownerSignupButton{height:76px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(135deg,var(--vault-blue2),var(--vault-blue));display:flex;align-items:center;justify-content:center;gap:14px;color:#fff;font-size:16px;font-weight:1000;text-transform:uppercase;letter-spacing:.01em;box-shadow:0 20px 48px rgba(31,107,255,.18),inset 0 1px 0 rgba(255,255,255,.16)}
        .ownerSignupButton{background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.015));box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
        .customerSignupButton span,.ownerSignupButton span{font-size:25px;color:#dbe7ff}
        .bellButton,.miniMark{height:48px;width:48px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.02);color:#dce5f5;display:grid;place-items:center;font-weight:1000}
        .miniMark{border-color:rgba(31,107,255,.72);box-shadow:0 0 22px rgba(31,107,255,.18)}
        .heroSearch{max-width:1080px;margin:0 auto;text-align:center;padding:0 0 26px}
        .heroSearch h1{margin:0;font-size:42px;line-height:1;font-weight:1000;text-transform:uppercase;letter-spacing:.08em}
        .heroSearch h1 span{color:#2f7bff;text-shadow:0 0 26px rgba(47,123,255,.24)}
        .heroSearch p{margin:14px 0 22px;color:#a7afbf;text-transform:uppercase;letter-spacing:.18em;font-size:14px;font-weight:800}.heroSearch p b{color:#fff}
        .searchBox{height:76px;border-radius:14px;background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.015));border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;gap:18px;padding:0 22px;box-shadow:0 18px 50px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.08)}
        .searchBox span,.searchBox i{font-style:normal;font-size:31px;color:#dce5f5;opacity:.96}.searchBox i{font-size:22px}
        .searchBox input{flex:1;height:74px;border:0;outline:0;background:transparent;color:#fff;font-size:18px;font-weight:700}.searchBox input::placeholder{color:rgba(255,255,255,.48)}
        .searchBox:focus-within{border-color:rgba(31,107,255,.72);box-shadow:0 0 0 4px rgba(31,107,255,.1),0 18px 50px rgba(0,0,0,.35)}
        .searchBox button,.emptyButton{border:0;border-radius:999px;background:linear-gradient(135deg,#083d9c,#1f6bff);color:#fff;font-size:13px;font-weight:1000;padding:10px 14px;cursor:pointer}
        .resultLine{margin-top:22px;color:rgba(255,255,255,.62);font-size:14px;font-weight:700}.resultLine b{color:#2f7bff}
        .storeChips{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding-top:12px}.storeChips::-webkit-scrollbar{display:none}.storeChip{min-width:220px;max-width:320px;min-height:58px;flex:0 0 auto;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);border-radius:14px;padding:10px 14px;display:grid;gap:2px}.storeChip span{font-size:14px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.storeChip small{font-size:11px;font-weight:800;color:rgba(255,255,255,.66);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.storeChip b{width:fit-content;margin-top:2px;color:#2f7bff;font-size:10px;font-weight:1000;text-transform:uppercase}
        .tabs{max-width:1500px;margin:0 auto 26px;display:flex;gap:10px;overflow-x:auto;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}.tabs button{height:48px;flex:0 0 auto;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.025);color:#fff;padding:0 28px;font-size:14px;font-weight:1000;text-transform:uppercase;cursor:pointer}.tabs button.active{background:linear-gradient(135deg,#063d9f,#1f6bff);border-color:rgba(31,107,255,.9);box-shadow:0 14px 32px rgba(31,107,255,.2)}
        .premiumLayout{max-width:1500px;margin:0 auto;display:grid;grid-template-columns:2fr minmax(340px,.95fr);gap:18px}
        .sectionBlock,.featurePanel,.cultureCard{border:1px solid rgba(255,255,255,.14);border-radius:14px;background:linear-gradient(135deg,rgba(255,255,255,.035),rgba(255,255,255,.012));box-shadow:0 24px 70px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.06)}
        .sectionBlock{padding:26px}.lowerBlock{grid-column:1/2}
        .sectionHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.sectionHead h2{margin:0;color:#fff;font-size:25px;line-height:1;font-weight:1000;text-transform:uppercase}.sectionHead h2 span{color:#2f7bff}.sectionHead b{display:inline-flex;margin-top:8px;background:linear-gradient(135deg,#0641a7,#1f6bff);border-radius:999px;padding:8px 12px;font-size:12px;line-height:1;text-transform:uppercase}.sectionHead a{height:44px;border:1px solid rgba(255,255,255,.22);border-radius:10px;padding:0 18px;display:flex;align-items:center;font-size:12px;text-transform:uppercase;font-weight:1000}
        .productStrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.productCard{border:1px solid rgba(255,255,255,.14);border-radius:12px;background:#080a10;overflow:hidden;display:flex;flex-direction:column;min-height:330px}.productImage{height:225px;position:relative;overflow:hidden;background:linear-gradient(135deg,#080b12,#101827)}.productInfo{padding:15px;display:grid;gap:9px}.productInfo strong{font-size:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.productInfo em{font-style:normal;color:#2f7bff;font-size:16px;font-weight:1000}.productInfo small{color:#c6cede;font-weight:800}.productInfo small span{color:#2f7bff}
        .sideStack{display:grid;gap:18px;grid-row:span 2}.featurePanel{overflow:hidden;padding:14px}.featureMedia{height:320px;position:relative;border-radius:10px;overflow:hidden;background:linear-gradient(135deg,#080b12,#101827)}.featureBody{padding:18px 10px 0}.featureBody h3{margin:0;color:#2f7bff;font-size:25px;font-weight:1000}.featureBody span{display:inline-flex;margin-left:8px;background:#0a55dd;border-radius:999px;padding:6px 11px;font-size:12px;text-transform:uppercase;font-weight:1000}.featureBody p{color:#bec6d5;line-height:1.45;font-weight:700}.featureBody b{height:54px;border:1px solid rgba(31,107,255,.9);border-radius:9px;display:flex;align-items:center;justify-content:center;color:#2f7bff;text-transform:uppercase}
        .cultureCard{min-height:270px;padding:34px;text-align:center;display:grid;place-items:center;align-content:center;gap:12px}.cultureCard strong{font-size:48px;font-weight:1000;font-style:italic;letter-spacing:-.12em;background:linear-gradient(180deg,#fff,#8390a5,#fff);-webkit-background-clip:text;background-clip:text;color:transparent}.cultureCard span{font-weight:900;color:#c4cede;letter-spacing:.1em}.cultureCard p{color:#b8c0cd;text-transform:uppercase;letter-spacing:.18em;line-height:1.5}.cultureCard p b{color:#2f7bff}.cultureCard a{height:54px;width:100%;border:1px solid rgba(31,107,255,.9);border-radius:9px;display:flex;align-items:center;justify-content:center;color:#2f7bff;text-transform:uppercase;font-weight:1000}
        .exploreSection{max-width:1500px;margin:22px auto 0}.sectionHead.wide{margin:0 0 14px}.sectionHead.wide p{margin:8px 0 0;color:#aeb7c8}
        .exploreGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:315px;gap:12px}.tile{position:relative;display:block;overflow:hidden;background:#111;border-radius:14px;min-width:0;isolation:isolate;border:1px solid rgba(255,255,255,.11)}.tile.bigTile{grid-column:span 2;grid-row:span 2}.tileMedia{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform .28s ease;filter:saturate(1.05) contrast(1.06)}.tile:hover .tileMedia,.productCard:hover .tileMedia,.featurePanel:hover .tileMedia{transform:scale(1.04)}.tileShade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.83),transparent 48%,rgba(0,0,0,.16));z-index:1}
        .topMeta{position:absolute;top:10px;left:10px;right:10px;z-index:4;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.topMeta img,.topMeta b{width:34px;height:34px;border-radius:999px;object-fit:cover;background:#1f6bff;display:grid;place-items:center;font-weight:1000;text-transform:uppercase;border:1px solid rgba(255,255,255,.24)}.topMeta span{background:rgba(31,107,255,.92);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:.08em}
        .bottomMeta{position:absolute;left:14px;right:14px;bottom:14px;z-index:4;text-shadow:0 6px 20px rgba(0,0,0,.8)}.bottomMeta strong{display:block;font-size:20px;line-height:1.05;font-weight:1000;letter-spacing:-.04em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bigTile .bottomMeta strong{font-size:34px}.bottomMeta small{display:block;margin-top:6px;color:rgba(255,255,255,.86);font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bottomMeta em{display:inline-flex;margin-top:8px;border-radius:999px;background:#1f6bff;color:#fff;padding:8px 12px;font-style:normal;font-size:13px;font-weight:1000}
        .tileStats{display:flex;align-items:center;gap:8px;margin-top:8px}.tileStats span,.tileStats button{border-radius:999px;background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.12);padding:5px 10px;font-size:12px;font-weight:1000;line-height:1;color:inherit}.tileStats .likeStat{color:#5c93ff}.tileStats .viewStat{color:#fff}.likeButton{cursor:pointer;appearance:none;-webkit-appearance:none}.likeButton.liked{background:rgba(31,107,255,.22);border-color:rgba(31,107,255,.58)}
        .status{min-height:60vh;display:grid;place-items:center;text-align:center;padding:40px;color:rgba(255,255,255,.72);font-weight:900}.status h1{margin:0;color:#fff;font-size:36px}.status p{margin:10px auto 0;max-width:680px;line-height:1.5}.loadMoreWrap{display:grid;place-items:center;padding:28px}.loadMoreWrap button{height:58px;border:0;border-radius:999px;background:linear-gradient(135deg,#063d9f,#1f6bff);color:#fff;padding:0 26px;font-weight:1000;cursor:pointer}
        .bottomNav{position:sticky;left:auto;bottom:18px;transform:none;z-index:120;width:min(980px,calc(100vw - 36px));height:78px;border-radius:18px;border:1px solid rgba(255,255,255,.16);background:rgba(7,9,14,.92);backdrop-filter:blur(22px);display:flex;align-items:center;justify-content:center;gap:18px;box-shadow:0 24px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.07);margin:34px auto 0}.bottomNav a{height:54px;min-width:120px;display:flex;align-items:center;justify-content:center;gap:10px;color:#aeb7c8;font-weight:1000;text-transform:uppercase}.bottomNav a.active{color:#2f7bff}.bottomNav a:first-child{font-size:24px}.bottomNav span{font-size:13px}
        @media(max-width:1180px){.topBar{grid-template-columns:150px 1fr 44px 52px}.brandMark strong{font-size:36px}.topActions{grid-template-columns:1fr 1fr}.premiumLayout{grid-template-columns:1fr}.sideStack{grid-row:auto;grid-template-columns:1fr 1fr}.lowerBlock{grid-column:auto}.productStrip{grid-template-columns:repeat(2,minmax(0,1fr))}.exploreGrid{grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:280px}}
        @media(max-width:760px){.discoverPage{padding:12px 10px 42px}.topBar{grid-template-columns:1fr 44px;gap:10px;margin-bottom:22px}.brandMark{border-right:0}.topActions{grid-column:1/3;grid-row:2;gap:10px}.bellButton{display:none}.miniMark{grid-column:2;grid-row:1}.customerSignupButton,.ownerSignupButton{height:58px;font-size:12px;line-height:1.1;padding:0 10px}.heroSearch h1{font-size:30px}.heroSearch p{font-size:11px}.searchBox{height:62px;border-radius:13px}.searchBox input{height:60px;font-size:14px}.tabs{gap:8px}.tabs button{height:44px;padding:0 17px;font-size:12px}.premiumLayout{gap:14px}.sectionBlock{padding:16px}.productStrip{grid-template-columns:1fr 1fr;gap:10px}.productCard{min-height:240px}.productImage{height:150px}.sideStack{grid-template-columns:1fr}.featureMedia{height:260px}.exploreGrid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:220px;gap:9px}.tile.bigTile{grid-column:span 2;grid-row:span 1}.bottomNav{height:70px;gap:2px}.bottomNav a{min-width:62px;gap:4px;flex-direction:column}.bottomNav span{font-size:10px}}
        @media(max-width:480px){.topActions{grid-template-columns:1fr}.heroSearch h1{font-size:25px}.productStrip{grid-template-columns:1fr}.exploreGrid{grid-auto-rows:170px}.bottomMeta strong{font-size:15px}.bottomMeta small{display:none}.bottomNav a{min-width:54px}.brandMark strong{font-size:34px}}
      `}</style>
    </main>
  );
}
