'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type AdminTab =
  | 'dashboard'
  | 'records'
  | 'landing'
  | 'stores'
  | 'orders'
  | 'flyers'
  | 'messages'
  | 'reviews'
  | 'payments'
  | 'plans'
  | 'settings'
  | 'customers'
  | 'ownerFiles'
  | 'customerFiles'
  | 'orderFiles'
  | 'agreements';

type StoreFilterKey = 'ALL' | 'ACTIVE' | 'PAUSED' | 'PAST_DUE' | 'STRIPE_CONNECTED' | 'STRIPE_INCOMPLETE';
type OrderFilterKey = 'ALL' | 'NEW' | 'IN_PROGRESS' | 'READY' | 'DONE' | 'CANCELLED';
type MessageFilterKey = 'ALL' | 'UNREAD' | 'OWNER' | 'ADMIN' | 'PAYMENT';
type HeroMediaType = 'image' | 'video';
type LandingTheme = 'light' | 'dark';

type StoreReviewRow = { id: string; restaurant_id?: string | null; customer_name?: string | null; comment?: string | null; media_url?: string | null; media_type?: string | null; rating?: number | null; approved?: boolean | null; created_at?: string | null; instagram?: string | null; facebook?: string | null; tiktok?: string | null; youtube?: string | null };

type StoreRecord = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  name: string | null;
  slug: string | null;
  plan?: string | null;
  plan_key?: string | null;
  plan_name?: string | null;
  monthly_price?: number | null;
  platform_fee_percent?: number | null;
  phone?: string | null;
  address?: string | null;
  logo_image?: string | null;
  hero_image?: string | null;
  stripe_account_id?: string | null;
  stripe_connected?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  billing_status?: string | null;
  billing_note?: string | null;
  paused?: boolean | null;
  pause_reason?: string | null;
  subscription_started_at?: string | null;
  subscription_start_date?: string | null;
  billing_start_date?: string | null;
  billing_due_date?: string | null;
  subscription_due_date?: string | null;
  next_payment_date?: string | null;
  last_payment_at?: string | null;
  overdue_days?: number | null;
  auto_pause_after_days?: number | null;
  created_at?: string | null;
};

type OrderRow = {
  id: string;
  restaurant_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  total?: number | null;
  amount_total?: number | null;
  status?: string | null;
  created_at?: string | null;
  items_summary?: string | null;
  items?: unknown;
  order_items?: unknown;
};

type MenuItemRow = {
  id: string;
  restaurant_id?: string | null;
  category_id?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  base_price?: number | null;
  image_url?: string | null;
  image_file?: string | null;
  image_path?: string | null;
  product_image?: string | null;
  product_photo?: string | null;
  video_url?: string | null;
  video_file?: string | null;
  video_path?: string | null;
  product_video?: string | null;
  product_video_file?: string | null;
  media_url?: string | null;
  media_file?: string | null;
  media_type?: string | null;
  is_available?: boolean | null;
  availability?: string | null;
  created_at?: string | null;
};
type StoreViewRow = { id: string; restaurant_id?: string | null; created_at?: string | null };
type CategoryRow = { id: string; restaurant_id?: string | null; name?: string | null; sort_order?: number | null };
type RestaurantMediaRow = { id: string; restaurant_id?: string | null; media_url?: string | null; image_url?: string | null; video_url?: string | null; media_type?: string | null; caption?: string | null; created_at?: string | null; views?: number | null; likes?: number | null };
type CustomerPostRow = { id: string; customer_id?: string | null; customer_name?: string | null; caption?: string | null; media_url?: string | null; media_type?: string | null; created_at?: string | null; views?: number | null; likes?: number | null; likes_count?: number | null };


type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  storeName: string;
  totalOrders: number;
  totalSpent: number;
  latestOrder: string;
  source: string;
};

type AgreementRecord = {
  id: string;
  ownerName: string;
  ownerEmail: string;
  storeName: string;
  storeSlug: string;
  status: string;
  acceptedAt: string;
  ipAddress: string;
  source: string;
};

type OwnerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  stripeStatus: string;
};


type FlyerOrderRow = {
  id: string;
  restaurant_id?: string | null;
  owner_id?: string | null;
  store_name?: string | null;
  flyer_category?: string | null;
  flyer_style?: string | null;
  package_quantity?: number | null;
  package_price?: number | null;
  notes?: string | null;
  status?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
};

type AdminMessageRow = {
  id: string;
  restaurant_id?: string | null;
  owner_id?: string | null;
  store_name?: string | null;
  sender?: string | null;
  sender_role?: string | null;
  subject?: string | null;
  message?: string | null;
  admin_reply?: string | null;
  message_type?: string | null;
  status?: string | null;
  read_by_owner?: boolean | null;
  read_by_admin?: boolean | null;
  admin_read?: boolean | null;
  owner_read?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PlatformPlan = {
  key: 'starter' | 'growth' | 'premium';
  name: string;
  price: number;
  platformFee: number;
  description: string;
  features: string[];
};

type Conversation = {
  key: string;
  store: StoreRecord | null;
  restaurantId: string | null;
  ownerId: string | null;
  storeName: string;
  messages: AdminMessageRow[];
  lastMessageAt: string | null;
  unreadAdminCount: number;
};

const ADMIN_EMAILS = [process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''].filter(Boolean);
const FALLBACK_LOGO = '/7sv-logo.png';
const LANDING_DEFAULT_HERO = '/7sv-hero-fashion.png';
const STORAGE_BUCKET = 'branding';
const PRODUCT_IMAGE_BUCKET = 'product-images';
const PRODUCT_VIDEO_BUCKET = 'product-videos';
const STORE_MEDIA_BUCKET = 'store-media';
const CUSTOMER_POST_BUCKET = 'customer-posts';
const MAX_HERO_VIDEO_SECONDS = 25;

const PLATFORM_PLANS: PlatformPlan[] = [
  { key: 'starter', name: 'Starter', price: 19, platformFee: 10, description: 'First 3 months free, then $19/month plus 10% platform fee.', features: ['First 3 months free', '$19 monthly billing', '10% platform fee', 'Storefront', 'Menu Builder', 'Basic Dashboard'] },
  { key: 'growth', name: 'Growth', price: 49, platformFee: 5, description: '$49/month plus 5% platform fee for growing stores.', features: ['$49 monthly billing', '5% platform fee', 'Flyers', 'Advanced Dashboard', 'Stripe Connect'] },
  { key: 'premium', name: 'Premium', price: 99, platformFee: 3, description: '$99/month plus 3% platform fee for premium operators.', features: ['$99 monthly billing', '3% platform fee', 'Priority Support', 'Marketing Tools', 'Premium Setup'] },
];

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


async function fetchOptionalAdminRows(tableNames: string[], limit = 1000) {
  for (const table of tableNames) {
    try {
      const ordered = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(limit);
      if (!ordered.error && Array.isArray(ordered.data)) return ordered.data as Record<string, any>[];

      const plain = await supabase.from(table).select('*').limit(limit);
      if (!plain.error && Array.isArray(plain.data)) return plain.data as Record<string, any>[];
    } catch {}
  }

  return [] as Record<string, any>[];
}

function pickText(row: Record<string, any> | null | undefined, keys: string[], fallback = '') {
  if (!row) return fallback;
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return fallback;
}

function findIdentityRow(identityRows: Record<string, any>[], ids: Array<string | null | undefined>) {
  const cleanIds = ids.map((id) => String(id || '').trim()).filter(Boolean);
  if (!cleanIds.length) return null;

  return identityRows.find((row) => {
    const rowIds = [row.id, row.user_id, row.owner_id, row.auth_user_id, row.profile_id].map((id) => String(id || '').trim()).filter(Boolean);
    return rowIds.some((id) => cleanIds.includes(id));
  }) || null;
}

function getOrderAmount(order: OrderRow) {
  return Number(order.total ?? order.amount_total ?? 0);
}


function storageUrlFromBuckets(value?: string | null, buckets: string[] = [STORE_MEDIA_BUCKET, PRODUCT_IMAGE_BUCKET, PRODUCT_VIDEO_BUCKET, STORAGE_BUCKET, CUSTOMER_POST_BUCKET]) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  const clean = raw
    .replace(/^public\//, '')
    .replace(/^storage\/v1\/object\/public\//, '')
    .replace(/^object\/public\//, '')
    .replace(/^\/+/, '');

  const lowered = clean.toLowerCase();
  for (const bucket of buckets) {
    const prefix = `${bucket}/`;
    const path = lowered.startsWith(prefix) ? clean.slice(prefix.length) : clean;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (data?.publicUrl) return data.publicUrl;
  }

  return '';
}

function safeStoreAssetUrl(value?: string | null) {
  return storageUrlFromBuckets(value) || FALLBACK_LOGO;
}

function getStoreName(store: StoreRecord | null | undefined) {
  return store?.name?.trim() || 'Unnamed Store';
}

function getStoreSlug(store: StoreRecord | null | undefined) {
  const raw = store?.slug?.trim() || getStoreName(store);
  return raw.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'store';
}

function getStoreUrl(store: StoreRecord | null | undefined) {
  const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
  return `${base}/store/${getStoreSlug(store)}`;
}

function getPlan(store: StoreRecord | null | undefined) {
  const key = (store?.plan_key || store?.plan || 'starter').toLowerCase();
  const found = PLATFORM_PLANS.find((p) => p.key === key);
  return found || PLATFORM_PLANS[0];
}

function getStoreStatus(store: StoreRecord) {
  const status = String(store.billing_status || '').toLowerCase();
  if (store.paused || status.includes('paused')) return 'paused';
  if (status.includes('past_due') || status.includes('unpaid')) return 'past_due';
  return 'active';
}

function getStripeState(store: StoreRecord | null | undefined) {
  if (!store?.stripe_account_id && !store?.stripe_subscription_id) return 'not_connected';
  if (store.stripe_connected && store.stripe_charges_enabled && store.stripe_payouts_enabled) return 'connected';
  if (store.stripe_subscription_id) return 'subscription';
  return 'incomplete';
}

function getStripeLabel(store: StoreRecord | null | undefined) {
  const state = getStripeState(store);
  if (state === 'connected') return 'Connected';
  if (state === 'subscription') return 'Subscription';
  if (state === 'incomplete') return 'Incomplete';
  return 'Not Connected';
}

function getStatusKey(status?: string | null) {
  const s = String(status || '').toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('complete')) return 'completed';
  if (s.includes('ready')) return 'ready';
  if (s.includes('progress') || s.includes('accepted')) return 'in_progress';
  if (s.includes('new') || s.includes('pending')) return 'new';
  return 'new';
}

function getStatusLabel(status?: string | null) {
  const key = getStatusKey(status);
  if (key === 'cancelled') return 'Cancelled';
  if (key === 'completed') return 'Completed';
  if (key === 'ready') return 'Almost Ready';
  if (key === 'in_progress') return 'In Progress';
  return 'New';
}

function statusMatchesFilter(status: string | null | undefined, filter: OrderFilterKey) {
  const key = getStatusKey(status);
  if (filter === 'ALL') return true;
  if (filter === 'NEW') return key === 'new';
  if (filter === 'IN_PROGRESS') return key === 'in_progress';
  if (filter === 'READY') return key === 'ready';
  if (filter === 'DONE') return key === 'completed';
  if (filter === 'CANCELLED') return key === 'cancelled';
  return true;
}

function storeMatchesFilter(store: StoreRecord, filter: StoreFilterKey) {
  const status = getStoreStatus(store);
  if (filter === 'ALL') return true;
  if (filter === 'ACTIVE') return status === 'active';
  if (filter === 'PAUSED') return status === 'paused';
  if (filter === 'PAST_DUE') return status === 'past_due';
  if (filter === 'STRIPE_CONNECTED') return getStripeState(store) === 'connected' || getStripeState(store) === 'subscription';
  if (filter === 'STRIPE_INCOMPLETE') return getStripeState(store) !== 'connected' && getStripeState(store) !== 'subscription';
  return true;
}

function normalizeOrderItemsSummary(order: OrderRow) {
  if (order.items_summary && order.items_summary.trim()) return order.items_summary.trim();
  const source = order.items ?? order.order_items;
  if (Array.isArray(source)) {
    const text = source.map((item: any) => {
      if (!item) return '';
      const qty = Number(item.quantity ?? item.qty ?? 1);
      const name = item.name ?? item.item_name ?? item.title ?? item.menu_item_name ?? item.menu_items?.name ?? 'Item';
      return `${qty}x ${name}`;
    }).filter(Boolean).join(' · ');
    if (text) return text;
  }
  if (typeof source === 'string' && source.trim()) return source.trim();
  return 'No order summary yet';
}

function minutesAgo(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day ago`;
}

function isToday(value?: string | null) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function parseLocalDate(value?: string | null) {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function getBillingStartDateValue(store: StoreRecord | null | undefined) {
  return store?.subscription_started_at || store?.subscription_start_date || store?.billing_start_date || store?.created_at || null;
}

function getBillingDueDateValue(store: StoreRecord | null | undefined) {
  if (!store) return null;
  const direct = store.billing_due_date || store.subscription_due_date || store.next_payment_date || null;
  if (direct) return direct;
  const start = parseLocalDate(getBillingStartDateValue(store));
  if (start) return isoDateOnly(addDays(start, 30));
  return null;
}

function dateInputValue(value?: string | null) {
  return value ? String(value).slice(0, 10) : '';
}

function safeDate(value?: string | null) {
  const d = parseLocalDate(value);
  if (!d) return 'No due date';
  return d.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function safeLongDate(value?: string | null) {
  const d = parseLocalDate(value);
  if (!d) return 'No due date';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysPastDue(value?: string | null) {
  const d = parseLocalDate(value);
  if (!d) return 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= today) return 0;
  return Math.floor((today.getTime() - d.getTime()) / 86400000);
}

function getStoreBilling(store: StoreRecord) {
  const start = getBillingStartDateValue(store);
  const due = getBillingDueDateValue(store);
  return {
    start,
    due,
    startInput: dateInputValue(start),
    dueInput: dateInputValue(due),
    startLabel: start ? safeDate(start) : 'No start date',
    dueLabel: due ? safeDate(due) : 'No due date',
    dueLongLabel: due ? safeLongDate(due) : 'No due date',
    overdueDays: daysPastDue(due),
  };
}

function initials(value?: string | null) {
  if (!value) return 'OR';
  return value.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'OR';
}

function planLabel(store: StoreRecord) {
  const p = getPlan(store);
  return `${p.name} $${p.price} + ${p.platformFee}%`;
}

function messageRole(message: AdminMessageRow) {
  const raw = String(message.sender_role || message.sender || '').toLowerCase();
  if (raw.includes('admin')) return 'admin';
  if (raw.includes('system')) return 'system';
  return 'owner';
}

function messageText(message: AdminMessageRow) {
  return message.message || message.admin_reply || '';
}

function storagePublicUrl(path: string) {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function cleanFileName(name: string) {
  return String(name || 'hero')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number(video.duration || 0));
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read this video file. Try another video.'));
    };
    video.src = objectUrl;
  });
}

function saveSettingFallback(key: string, value: string) {
  if (typeof window === 'undefined') return;
  const cleanKey = String(key || '').trim();
  const cleanValue = String(value || '');
  if (!cleanKey) return;
  window.localStorage.setItem(cleanKey, cleanValue);
  window.localStorage.setItem(`platform_settings:${cleanKey}`, cleanValue);
}

function readSettingFallback(key: string) {
  if (typeof window === 'undefined') return '';
  return (
    window.localStorage.getItem(key) ||
    window.localStorage.getItem(`platform_settings:${key}`) ||
    ''
  );
}

function fallbackRowsForKeys(keys: string[]) {
  return keys
    .map((key) => ({ key, value: readSettingFallback(key) }))
    .filter((row) => String(row.value || '').trim()) as Array<{ key: string; value: unknown }>;
}

async function upsertSetting(key: string, value: string) {
  const cleanKey = String(key || '').trim();
  const cleanValue = String(value || '');
  if (!cleanKey) return;

  saveSettingFallback(cleanKey, cleanValue);

  const { error } = await supabase
    .from('platform_settings')
    .upsert(
      { key: cleanKey, value: cleanValue },
      { onConflict: 'key' }
    );

  if (error) {
    if (isPlatformSettingsSchemaError(error)) {
      console.warn('7SV platform_settings REST cache not ready. Saved locally and will stay after refresh on this device.', error);
      return;
    }
    throw error;
  }
}

async function upsertSettingAliases(keys: string[], value: string) {
  await Promise.all(keys.map((key) => upsertSetting(key, value)));
}

function readSettingValue(map: Map<string, string>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = map.get(key)?.trim();
    if (value) return value;
  }
  return fallback;
}

function isPlatformSettingsSchemaError(error: unknown) {
  const message = String(
    (error as { message?: string })?.message ||
      (error as { details?: string })?.details ||
      (error as { hint?: string })?.hint ||
      error ||
      ''
  ).toLowerCase();

  return (
    message.includes('platform_settings') &&
    (message.includes('schema cache') ||
      message.includes('could not find the table') ||
      message.includes('does not exist') ||
      message.includes('pgrst205'))
  );
}

function settingValueToString(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.value === 'string') return record.value;
    if (typeof record.text === 'string') return record.text;
    if (typeof record.url === 'string') return record.url;
  }
  return String(value || '');
}

async function loadPlatformSettingsRows(keys: string[]) {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('key,value')
    .in('key', keys);

  if (error) {
    if (isPlatformSettingsSchemaError(error)) {
      console.warn('7SV platform_settings REST cache not ready. Loading saved local fallback values.', error);
      return fallbackRowsForKeys(keys);
    }
    throw error;
  }

  const rows = (data || []) as Array<{ key: string; value: unknown }>;
  const fallbackRows = fallbackRowsForKeys(keys);
  const merged = new Map<string, { key: string; value: unknown }>();
  fallbackRows.forEach((row) => merged.set(row.key, row));
  rows.forEach((row) => merged.set(row.key, row));
  return Array.from(merged.values());
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const landingImageRef = useRef<HTMLInputElement | null>(null);
  const landingVideoRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [storeViews, setStoreViews] = useState<StoreViewRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [restaurantMedia, setRestaurantMedia] = useState<RestaurantMediaRow[]>([]);
  const [customerPosts, setCustomerPosts] = useState<CustomerPostRow[]>([]);
  const [discoverLikes, setDiscoverLikes] = useState<Record<string, any>[]>([]);
  const [flyerOrders, setFlyerOrders] = useState<FlyerOrderRow[]>([]);
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);
  const [reviews, setReviews] = useState<StoreReviewRow[]>([]);
  const [customerRows, setCustomerRows] = useState<Record<string, any>[]>([]);
  const [identityRows, setIdentityRows] = useState<Record<string, any>[]>([]);
  const [agreementRows, setAgreementRows] = useState<Record<string, any>[]>([]);

  const customers = useMemo<CustomerRecord[]>(() => {
    const map = new Map<string, CustomerRecord>();

    const saveCustomer = (input: {
      id?: string;
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      storeName?: string;
      totalOrders?: number;
      totalSpent?: number;
      latestOrder?: string;
      source?: string;
    }) => {
      const name = String(input.name || 'Unknown Customer').trim() || 'Unknown Customer';
      const email = String(input.email || '').trim();
      const phone = String(input.phone || '').trim();
      const address = String(input.address || '').trim();
      const key = (email || phone || name || input.id || `customer-${map.size}`).toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          id: input.id || key,
          name,
          email,
          phone,
          address,
          storeName: input.storeName || '',
          totalOrders: 0,
          totalSpent: 0,
          latestOrder: input.latestOrder || '',
          source: input.source || 'orders',
        });
      }

      const existing = map.get(key)!;
      if (name && existing.name === 'Unknown Customer') existing.name = name;
      if (!existing.email && email) existing.email = email;
      if (!existing.phone && phone) existing.phone = phone;
      if (!existing.address && address) existing.address = address;
      if (!existing.storeName && input.storeName) existing.storeName = input.storeName;
      existing.totalOrders += Number(input.totalOrders || 0);
      existing.totalSpent += Number(input.totalSpent || 0);
      if ((input.latestOrder || '') > existing.latestOrder) existing.latestOrder = input.latestOrder || existing.latestOrder;
      if (input.source && !existing.source.includes(input.source)) existing.source = `${existing.source}, ${input.source}`;
    };

    customerRows.forEach((row) => {
      saveCustomer({
        id: pickText(row, ['id', 'customer_id', 'user_id', 'auth_user_id']),
        name: pickText(row, ['name', 'full_name', 'customer_name', 'display_name', 'first_name'], 'Unknown Customer'),
        email: pickText(row, ['email', 'customer_email', 'email_address']),
        phone: pickText(row, ['phone', 'phone_number', 'customer_phone', 'mobile']),
        address: pickText(row, ['address', 'customer_address', 'delivery_address', 'street_address']),
        storeName: pickText(row, ['store_name', 'restaurant_name', 'business_name']),
        totalOrders: Number(row.total_orders || row.order_count || 0),
        totalSpent: Number(row.total_spent || row.lifetime_value || 0),
        latestOrder: pickText(row, ['latest_order', 'last_order_at', 'updated_at', 'created_at']),
        source: 'customer table',
      });
    });

    orders.forEach((order) => {
      const row = order as OrderRow & Record<string, any>;
      const store = stores.find((storeRow) => storeRow.id === row.restaurant_id);
      const storeName = store ? getStoreName(store) : pickText(row, ['store_name', 'restaurant_name', 'business_name'], 'Unknown Store');

      saveCustomer({
        id: pickText(row, ['customer_id', 'user_id', 'profile_id', 'id']),
        name: pickText(row, ['customer_name', 'name', 'full_name', 'customer_full_name'], 'Unknown Customer'),
        email: pickText(row, ['customer_email', 'email', 'customerEmail', 'payer_email', 'receipt_email', 'billing_email']),
        phone: pickText(row, ['customer_phone', 'phone', 'customerPhone', 'phone_number', 'billing_phone']),
        address: pickText(row, ['customer_address', 'address', 'delivery_address', 'deliveryAddress', 'shipping_address']),
        storeName,
        totalOrders: 1,
        totalSpent: Number(row.total || row.amount_total || row.order_total || 0),
        latestOrder: row.created_at || '',
        source: 'orders',
      });
    });

    reviews.forEach((review) => {
      const row = review as StoreReviewRow & Record<string, any>;
      const store = stores.find((storeRow) => storeRow.id === row.restaurant_id);
      saveCustomer({
        id: pickText(row, ['customer_id', 'user_id', 'id']),
        name: pickText(row, ['customer_name', 'name'], 'Unknown Customer'),
        email: pickText(row, ['customer_email', 'email']),
        phone: pickText(row, ['customer_phone', 'phone']),
        address: pickText(row, ['customer_address', 'address']),
        storeName: store ? getStoreName(store) : '',
        latestOrder: row.created_at || '',
        source: 'reviews',
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [customerRows, orders, reviews, stores]);

  const ownerRecords = useMemo<OwnerRecord[]>(() => {
    return stores
      .map((store) => {
        const row = store as StoreRecord & Record<string, any>;
        const identity = findIdentityRow(identityRows, [row.owner_id, row.user_id, row.id]);
        const email = pickText(row, ['owner_email', 'email', 'contact_email', 'business_email', 'user_email']) || pickText(identity, ['email', 'owner_email', 'user_email', 'contact_email']);

        return {
          id: row.id,
          name: getStoreName(store),
          email,
          phone: pickText(row, ['phone', 'business_phone', 'owner_phone']) || pickText(identity, ['phone', 'phone_number', 'owner_phone']),
          address: pickText(row, ['address', 'business_address', 'store_address']),
          slug: String(row.slug || '').trim(),
          plan: planLabel(store),
          status: row.paused ? 'Paused' : String(row.billing_status || 'Active'),
          createdAt: String(row.created_at || ''),
          stripeStatus: row.stripe_charges_enabled && row.stripe_payouts_enabled ? 'Stripe Ready' : row.stripe_account_id ? 'Stripe Incomplete' : 'No Stripe',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [identityRows, stores]);

  const agreementRecords = useMemo<AgreementRecord[]>(() => {
    const directAgreementRows = agreementRows.map((row) => {
      const storeId = pickText(row, ['restaurant_id', 'store_id']);
      const ownerId = pickText(row, ['owner_id', 'user_id', 'auth_user_id']);
      const store = stores.find((storeRow) => storeRow.id === storeId || storeRow.owner_id === ownerId || storeRow.user_id === ownerId) || null;
      const identity = findIdentityRow(identityRows, [ownerId, store?.owner_id, store?.user_id]);
      return {
        id: pickText(row, ['id']) || `${storeId}-${ownerId}`,
        ownerName: pickText(row, ['owner_name', 'name', 'full_name']) || getStoreName(store),
        ownerEmail: pickText(row, ['owner_email', 'email', 'user_email']) || pickText(identity, ['email', 'owner_email', 'user_email']),
        storeName: pickText(row, ['store_name', 'restaurant_name', 'business_name']) || getStoreName(store),
        storeSlug: pickText(row, ['store_slug', 'slug']) || getStoreSlug(store),
        status: pickText(row, ['status']) || (row.accepted === false ? 'Not Accepted' : 'Accepted'),
        acceptedAt: pickText(row, ['accepted_at', 'terms_accepted_at', 'created_at', 'updated_at']),
        ipAddress: pickText(row, ['ip_address', 'ip']),
        source: 'agreement table',
      };
    });

    const storeAgreementRows = stores.map((store) => {
      const row = store as StoreRecord & Record<string, any>;
      const identity = findIdentityRow(identityRows, [row.owner_id, row.user_id, row.id]);
      const accepted = Boolean(row.terms_accepted || row.owner_terms_accepted || row.agreement_accepted);
      return {
        id: row.id,
        ownerName: getStoreName(store),
        ownerEmail: pickText(row, ['owner_email', 'email', 'contact_email', 'business_email', 'user_email']) || pickText(identity, ['email', 'owner_email', 'user_email']),
        storeName: getStoreName(store),
        storeSlug: getStoreSlug(store),
        status: accepted ? 'Accepted' : 'Not Accepted',
        acceptedAt: pickText(row, ['terms_accepted_at', 'owner_terms_accepted_at', 'agreement_accepted_at']),
        ipAddress: pickText(row, ['terms_ip', 'agreement_ip', 'ip_address']),
        source: 'restaurants',
      };
    });

    const combined = [...directAgreementRows, ...storeAgreementRows];
    const unique = new Map<string, AgreementRecord>();
    combined.forEach((record) => {
      const key = `${record.storeSlug}-${record.ownerEmail}-${record.source}`.toLowerCase();
      unique.set(key, record);
    });

    return Array.from(unique.values()).sort((a, b) => (b.acceptedAt || '').localeCompare(a.acceptedAt || ''));
  }, [agreementRows, identityRows, stores]);


  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState<StoreFilterKey>('ALL');
  const [orderFilter, setOrderFilter] = useState<OrderFilterKey>('ALL');
  const [messageFilter, setMessageFilter] = useState<MessageFilterKey>('ALL');
  const [savingId, setSavingId] = useState('');
  const [copied, setCopied] = useState('');
  const [selectedConversationKey, setSelectedConversationKey] = useState<string>('');
  const [replyDraft, setReplyDraft] = useState('');
  const [messageDraft, setMessageDraft] = useState<Record<string, string>>({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [landingHeroType, setLandingHeroType] = useState<HeroMediaType>('image');
  const [landingTheme, setLandingTheme] = useState<LandingTheme>('light');
  const [landingHeroImage, setLandingHeroImage] = useState(LANDING_DEFAULT_HERO);
  const [landingHeroVideo, setLandingHeroVideo] = useState('');
  const [landingHeroTitle, setLandingHeroTitle] = useState('7th St Vault helps fashion sellers turn products, photos, and videos into a live storefront');
  const [landingHeroText, setLandingHeroText] = useState('Made for fashion sellers, boutiques, sneaker resellers, jewelry sellers, kids brands, and streetwear stores that want a cleaner direct-shopping experience.');
  const [landingHeroTitleColor, setLandingHeroTitleColor] = useState('#ffffff');
  const [landingHeroTextColor, setLandingHeroTextColor] = useState('#ffffff');
  const [landingHeroUpdatedAt, setLandingHeroUpdatedAt] = useState<string | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroSelectedFile, setHeroSelectedFile] = useState('');

  const showSuccess = useCallback((value: string) => {
    setSuccess(value);
    window.setTimeout(() => setSuccess(''), 2200);
  }, []);

  const loadLandingHero = useCallback(async () => {
    try {
      const data = await loadPlatformSettingsRows([
        'landing_theme',
        'landing_page_theme',
        'landing_color_theme',
        'public_landing_theme',
        'landing_mode',
        'landing_page_mode',
        'site_theme',
        'site_mode',
        'landing_hero_media_type',
        'landing_hero_type',
        'landing_hero_url',
        'landing_hero_media_url',
        'landing_page_hero_url',
        'landing_hero_image_url',
        'landing_hero_image',
        'landing_hero_video_url',
        'landing_hero_video',
        'landing_hero_title',
        'landing_page_hero_title',
        'hero_title',
        'landing_hero_text',
        'landing_hero_description',
        'landing_page_hero_text',
        'landing_page_hero_description',
        'hero_text',
        'hero_description',
        'landing_hero_title_color',
        'landing_page_hero_title_color',
        'hero_title_color',
        'landing_hero_text_color',
        'landing_hero_description_color',
        'landing_page_hero_text_color',
        'landing_page_hero_description_color',
        'hero_text_color',
        'hero_description_color',
        'landing_hero_updated_at',
      ]);

      const map = new Map<string, string>();
      data.forEach((row) => map.set(row.key, settingValueToString(row.value)));

      const themeValue = readSettingValue(map, ['landing_theme', 'landing_page_theme', 'landing_color_theme', 'public_landing_theme', 'landing_mode', 'landing_page_mode', 'site_theme', 'site_mode'], 'light').toLowerCase();
      const mediaTypeValue = readSettingValue(map, ['landing_hero_media_type', 'landing_hero_type'], 'image');
      const videoUrl = readSettingValue(map, ['landing_hero_video_url', 'landing_hero_video']);
      const imageUrl = readSettingValue(map, ['landing_hero_image_url', 'landing_hero_image'], LANDING_DEFAULT_HERO);
      const sharedUrl = readSettingValue(map, ['landing_hero_url', 'landing_hero_media_url', 'landing_page_hero_url']);
      const mediaType: HeroMediaType = mediaTypeValue === 'video' || Boolean(videoUrl && sharedUrl === videoUrl) ? 'video' : 'image';

      setLandingTheme(themeValue === 'dark' ? 'dark' : 'light');
      setLandingHeroType(mediaType);
      setLandingHeroImage(imageUrl || LANDING_DEFAULT_HERO);
      setLandingHeroVideo(videoUrl || '');
      setLandingHeroTitle(readSettingValue(map, ['landing_hero_title', 'landing_page_hero_title', 'hero_title'], '7th St Vault helps fashion sellers turn products, photos, and videos into a live storefront'));
      setLandingHeroText(readSettingValue(map, ['landing_hero_text', 'landing_hero_description', 'landing_page_hero_text', 'landing_page_hero_description', 'hero_text', 'hero_description'], 'Made for fashion sellers, boutiques, sneaker resellers, jewelry sellers, kids brands, and streetwear stores that want a cleaner direct-shopping experience.'));
      setLandingHeroTitleColor(readSettingValue(map, ['landing_hero_title_color', 'landing_page_hero_title_color', 'hero_title_color'], '#ffffff'));
      setLandingHeroTextColor(readSettingValue(map, ['landing_hero_text_color', 'landing_hero_description_color', 'landing_page_hero_text_color', 'landing_page_hero_description_color', 'hero_text_color', 'hero_description_color'], '#ffffff'));
      setLandingHeroUpdatedAt(readSettingValue(map, ['landing_hero_updated_at']) || null);
    } catch (error) {
      if (isPlatformSettingsSchemaError(error)) {
        console.warn('7SV landing hero settings skipped while Supabase cache refreshes.', error);
        return;
      }
      throw error;
    }
  }, []);


  const storeById = useMemo(() => {
    const map = new Map<string, StoreRecord>();
    stores.forEach((store) => map.set(store.id, store));
    return map;
  }, [stores]);

  const sevenVaultLiveStats = useMemo(() => ({
    stores: stores.length,
    products: menuItems.length,
    categories: categories.length,
    sellerMedia: restaurantMedia.length,
    customerPosts: customerPosts.length,
    discoverLikes: discoverLikes.length,
    orders: orders.length,
    customers: customerRows.length,
  }), [categories.length, customerPosts.length, customerRows.length, discoverLikes.length, menuItems.length, orders.length, restaurantMedia.length, stores.length]);


  const refreshData = useCallback(async () => {
    try {
      setError('');
      const [restaurantRes, orderRes, menuRes, categoryRes, mediaRes, postRes, likeRows, viewRes, flyerRes, messageRes, reviewRes] = await Promise.all([
        supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('menu_items').select('*').order('created_at', { ascending: false }).limit(1500),
        supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }).limit(1000),
        supabase.from('restaurant_media').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('customer_posts').select('*').order('created_at', { ascending: false }).limit(1000),
        fetchOptionalAdminRows(['discover_likes', 'likes', 'post_likes'], 5000),
        supabase.from('store_views').select('id, restaurant_id, created_at').limit(5000),
        supabase.from('flyer_orders').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('admin_messages').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('store_reviews').select('*').order('created_at', { ascending: false }).limit(500),
      ]);

      if (restaurantRes.error) throw restaurantRes.error;
      if (orderRes.error) throw orderRes.error;
      if (menuRes.error) throw menuRes.error;

      const loadedStores = ((restaurantRes.data || []) as StoreRecord[]).map((store) => {
        const start = getBillingStartDateValue(store) || new Date().toISOString();
        const due = getBillingDueDateValue(store) || isoDateOnly(addDays(parseLocalDate(start) || new Date(), 30));
        return {
          ...store,
          subscription_started_at: store.subscription_started_at || start,
          billing_due_date: store.billing_due_date || due,
          auto_pause_after_days: store.auto_pause_after_days ?? 7,
          billing_status: store.billing_status || 'active',
          plan: store.plan || store.plan_key || 'starter',
          plan_key: store.plan_key || store.plan || 'starter',
        };
      });

      setStores(loadedStores);
      setOrders((orderRes.data || []) as OrderRow[]);
      setMenuItems((menuRes.data || []) as MenuItemRow[]);
      setCategories(categoryRes.error ? [] : ((categoryRes.data || []) as CategoryRow[]));
      setRestaurantMedia(mediaRes.error ? [] : ((mediaRes.data || []) as RestaurantMediaRow[]));
      setCustomerPosts(postRes.error ? [] : ((postRes.data || []) as CustomerPostRow[]));
      setDiscoverLikes(Array.isArray(likeRows) ? likeRows : []);
      setStoreViews(viewRes.error ? [] : ((viewRes.data || []) as StoreViewRow[]));
      setFlyerOrders(flyerRes.error ? [] : ((flyerRes.data || []) as FlyerOrderRow[]));
      setMessages(messageRes.error ? [] : ((messageRes.data || []) as AdminMessageRow[]));
      setReviews(reviewRes.error ? [] : ((reviewRes.data || []) as StoreReviewRow[]));

      const [loadedCustomerRows, loadedIdentityRows, loadedAgreementRows] = await Promise.all([
        fetchOptionalAdminRows(['customer_profiles', 'customers', 'customer_records', 'profiles', 'customer_accounts'], 1000),
        fetchOptionalAdminRows(['owner_profiles', 'profiles', 'users', 'account_profiles', 'seller_profiles'], 1000),
        fetchOptionalAdminRows(['owner_agreements', 'terms_agreements', 'agreements', 'terms_acceptances', 'owner_terms', 'seller_agreements'], 1000),
      ]);

      setCustomerRows(loadedCustomerRows);
      setIdentityRows(loadedIdentityRows);
      setAgreementRows(loadedAgreementRows);

      const missingBillingStores = loadedStores.filter((store) => {
        const original = (restaurantRes.data || []).find((row: any) => row.id === store.id) as StoreRecord | undefined;
        return original && (!original.subscription_started_at || !original.billing_due_date || !original.auto_pause_after_days || !original.billing_status || !original.plan_key);
      });

      if (missingBillingStores.length) {
        await Promise.all(missingBillingStores.map((store) => supabase.from('restaurants').update({
          subscription_started_at: store.subscription_started_at,
          billing_due_date: store.billing_due_date,
          auto_pause_after_days: store.auto_pause_after_days,
          billing_status: store.billing_status,
          plan: store.plan,
          plan_key: store.plan_key,
          monthly_price: store.monthly_price ?? getPlan(store).price,
          platform_fee_percent: store.platform_fee_percent ?? getPlan(store).platformFee,
        }).eq('id', store.id)));
      }

      await loadLandingHero();
    } catch (err: any) {
      if (isPlatformSettingsSchemaError(err)) {
        console.warn('7SV platform_settings cache still refreshing while loading admin data.', err);
        setError('');
        return;
      }
      setError(err?.message || 'Could not load admin data.');
    }
  }, [loadLandingHero]);

  useEffect(() => {
    let active = true;
    let orderChannel: ReturnType<typeof supabase.channel> | null = null;
    let restaurantChannel: ReturnType<typeof supabase.channel> | null = null;
    let viewChannel: ReturnType<typeof supabase.channel> | null = null;
    let flyerChannel: ReturnType<typeof supabase.channel> | null = null;
    let messageChannel: ReturnType<typeof supabase.channel> | null = null;
    let settingsChannel: ReturnType<typeof supabase.channel> | null = null;
    let reviewChannel: ReturnType<typeof supabase.channel> | null = null;
    let categoryChannel: ReturnType<typeof supabase.channel> | null = null;
    let menuItemChannel: ReturnType<typeof supabase.channel> | null = null;
    let mediaChannel: ReturnType<typeof supabase.channel> | null = null;
    let customerPostChannel: ReturnType<typeof supabase.channel> | null = null;
    let customerProfileChannel: ReturnType<typeof supabase.channel> | null = null;
    let discoverLikeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function boot() {
      try {
        setLoading(true);
        setError('');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) {
          router.push('/sign-in');
          return;
        }

        const adminEmail = user.email || '';
        const emailIsAdmin = ADMIN_EMAILS.length ? ADMIN_EMAILS.includes(adminEmail) : true;
        if (!emailIsAdmin) {
          setAuthorized(false);
          router.push('/dashboard/owner');
          return;
        }

        if (!active) return;
        setAuthorized(true);
        await refreshData();

        orderChannel = supabase.channel('7sv-admin-orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void refreshData()).subscribe();
        restaurantChannel = supabase.channel('7sv-admin-stores-live').on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => void refreshData()).subscribe();
        viewChannel = supabase.channel('7sv-admin-store-views-live').on('postgres_changes', { event: '*', schema: 'public', table: 'store_views' }, () => void refreshData()).subscribe();
        flyerChannel = supabase.channel('7sv-admin-flyer-orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'flyer_orders' }, () => void refreshData()).subscribe();
        messageChannel = supabase.channel('7sv-admin-messages-live').on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages' }, () => void refreshData()).subscribe();
        settingsChannel = supabase.channel('7sv-admin-platform-settings-live').on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => void loadLandingHero()).subscribe();
        reviewChannel = supabase.channel('7sv-admin-reviews-live').on('postgres_changes', { event: '*', schema: 'public', table: 'store_reviews' }, () => void refreshData()).subscribe();
        categoryChannel = supabase.channel('7sv-admin-categories-live').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => void refreshData()).subscribe();
        menuItemChannel = supabase.channel('7sv-admin-products-live').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => void refreshData()).subscribe();
        mediaChannel = supabase.channel('7sv-admin-seller-media-live').on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_media' }, () => void refreshData()).subscribe();
        customerPostChannel = supabase.channel('7sv-admin-customer-posts-live').on('postgres_changes', { event: '*', schema: 'public', table: 'customer_posts' }, () => void refreshData()).subscribe();
        customerProfileChannel = supabase.channel('7sv-admin-customer-profiles-live').on('postgres_changes', { event: '*', schema: 'public', table: 'customer_profiles' }, () => void refreshData()).subscribe();
        discoverLikeChannel = supabase.channel('7sv-admin-discover-likes-live').on('postgres_changes', { event: '*', schema: 'public', table: 'discover_likes' }, () => void refreshData()).subscribe();
      } catch (err: any) {
        if (!active) return;
        if (isPlatformSettingsSchemaError(err)) return;
        setError(err?.message || 'Could not load admin panel.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void boot();

    return () => {
      active = false;
      if (orderChannel) supabase.removeChannel(orderChannel);
      if (restaurantChannel) supabase.removeChannel(restaurantChannel);
      if (viewChannel) supabase.removeChannel(viewChannel);
      if (flyerChannel) supabase.removeChannel(flyerChannel);
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (settingsChannel) supabase.removeChannel(settingsChannel);
      if (reviewChannel) supabase.removeChannel(reviewChannel);
      if (categoryChannel) supabase.removeChannel(categoryChannel);
      if (menuItemChannel) supabase.removeChannel(menuItemChannel);
      if (mediaChannel) supabase.removeChannel(mediaChannel);
      if (customerPostChannel) supabase.removeChannel(customerPostChannel);
      if (customerProfileChannel) supabase.removeChannel(customerProfileChannel);
      if (discoverLikeChannel) supabase.removeChannel(discoverLikeChannel);
    };
  }, [loadLandingHero, refreshData, router]);

  async function uploadLandingHero(file: File, type: HeroMediaType) {
    try {
      setError('');
      setHeroUploading(true);
      setSavingId('landing-hero');

      if (type === 'image' && !file.type.startsWith('image/')) throw new Error('Upload a valid image file.');
      if (type === 'video' && !file.type.startsWith('video/')) throw new Error('Upload a valid video file.');

      if (type === 'video') {
        const duration = await getVideoDuration(file);
        if (duration > MAX_HERO_VIDEO_SECONDS) {
          throw new Error(`Video is too long. Hero video must be ${MAX_HERO_VIDEO_SECONDS} seconds or less. This file is ${Math.round(duration)} seconds.`);
        }
      }

      const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
      const path = `landing/${type === 'video' ? 'hero-videos' : 'hero-images'}/${Date.now()}-${cleanFileName(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined,
      });

      if (uploadError) throw uploadError;

      const url = storagePublicUrl(path);
      const now = new Date().toISOString();

      await upsertSettingAliases(['landing_hero_media_type', 'landing_hero_type'], type);
      await upsertSettingAliases(['landing_hero_url', 'landing_hero_media_url', 'landing_page_hero_url'], url);
      if (type === 'video') {
        await upsertSettingAliases(['landing_hero_video_url', 'landing_hero_video'], url);
      } else {
        await upsertSettingAliases(['landing_hero_image_url', 'landing_hero_image'], url);
      }
      await upsertSetting('landing_hero_updated_at', now);

      setLandingHeroType(type);
      if (type === 'video') setLandingHeroVideo(url);
      else setLandingHeroImage(url);
      setLandingHeroUpdatedAt(now);
      setHeroSelectedFile(file.name);
      showSuccess(type === 'video' ? 'Landing hero video saved.' : 'Landing hero photo saved.');
    } catch (err: any) {
      if (isPlatformSettingsSchemaError(err)) {
        console.warn('7SV platform_settings cache still refreshing during hero upload.', err);
        setError('');
        showSuccess('Supabase cache is refreshing. Restart npm run dev, then try upload again.');
      } else {
        setError(err?.message || 'Could not upload landing hero.');
      }
    } finally {
      setHeroUploading(false);
      setSavingId('');
    }
  }

  async function handleLandingHeroFile(event: ChangeEvent<HTMLInputElement>, type: HeroMediaType) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await uploadLandingHero(file, type);
  }

  async function switchLandingHero(type: HeroMediaType) {
    try {
      setError('');
      setSavingId('landing-hero-switch');

      if (type === 'video' && !landingHeroVideo) throw new Error('Upload a hero video first.');
      if (type === 'image' && !landingHeroImage) throw new Error('Upload a hero photo first.');

      const now = new Date().toISOString();
      const activeUrl = type === 'video' ? landingHeroVideo : landingHeroImage;
      await upsertSettingAliases(['landing_hero_media_type', 'landing_hero_type'], type);
      await upsertSettingAliases(['landing_hero_url', 'landing_hero_media_url', 'landing_page_hero_url'], activeUrl);
      await upsertSetting('landing_hero_updated_at', now);

      setLandingHeroType(type);
      setLandingHeroUpdatedAt(now);
      showSuccess(type === 'video' ? 'Landing page hero set to video.' : 'Landing page hero set to photo.');
    } catch (err: any) {
      setError(err?.message || 'Could not switch landing hero.');
    } finally {
      setSavingId('');
    }
  }

  async function saveLandingTheme(nextTheme?: LandingTheme) {
    const theme = nextTheme || landingTheme;
    try {
      setError('');
      setSavingId('landing-theme');
      const now = new Date().toISOString();

      setLandingTheme(theme);
      setLandingHeroUpdatedAt(now);

      saveSettingFallback('landing_theme', theme);
      saveSettingFallback('landing_page_theme', theme);
      saveSettingFallback('landing_color_theme', theme);
      saveSettingFallback('public_landing_theme', theme);
      saveSettingFallback('landing_mode', theme);
      saveSettingFallback('landing_page_mode', theme);
      saveSettingFallback('site_theme', theme);
      saveSettingFallback('site_mode', theme);
      saveSettingFallback('landing_hero_updated_at', now);

      await upsertSettingAliases([
        'landing_theme',
        'landing_page_theme',
        'landing_color_theme',
        'public_landing_theme',
        'landing_mode',
        'landing_page_mode',
        'site_theme',
        'site_mode',
      ], theme);
      await upsertSetting('landing_hero_updated_at', now);

      showSuccess(`Landing page ${theme} theme saved.`);
      await loadLandingHero();
    } catch (err: any) {
      if (isPlatformSettingsSchemaError(err)) {
        setError('');
        showSuccess('Landing theme saved locally. Restart npm run dev once so Supabase REST cache can see platform_settings.');
      } else {
        setError(err?.message || 'Could not save landing page theme.');
      }
    } finally {
      setSavingId('');
    }
  }

  async function resetLandingHero() {
    try {
      setError('');
      setSavingId('landing-hero-reset');
      const now = new Date().toISOString();
      await upsertSettingAliases(['landing_hero_media_type', 'landing_hero_type'], 'image');
      await upsertSettingAliases(['landing_hero_url', 'landing_hero_media_url', 'landing_page_hero_url'], LANDING_DEFAULT_HERO);
      await upsertSettingAliases(['landing_hero_image_url', 'landing_hero_image'], LANDING_DEFAULT_HERO);
      await upsertSetting('landing_hero_updated_at', now);
      setLandingHeroType('image');
      setLandingHeroImage(LANDING_DEFAULT_HERO);
      setLandingHeroUpdatedAt(now);
      showSuccess('Landing hero reset.');
    } catch (err: any) {
      setError(err?.message || 'Could not reset landing hero.');
    } finally {
      setSavingId('');
    }
  }

  async function saveLandingHeroText() {
    try {
      setError('');
      setSavingId('landing-hero-text');

      const title = landingHeroTitle.trim();
      const text = landingHeroText.trim();

      if (!title) throw new Error('Hero title cannot be empty.');
      if (!text) throw new Error('Hero description cannot be empty.');

      const now = new Date().toISOString();
      await upsertSettingAliases(['landing_hero_title', 'landing_page_hero_title', 'hero_title'], title);
      await upsertSettingAliases(['landing_hero_text', 'landing_hero_description', 'landing_page_hero_text', 'landing_page_hero_description', 'hero_text', 'hero_description'], text);
      await upsertSettingAliases(['landing_hero_title_color', 'landing_page_hero_title_color', 'hero_title_color'], landingHeroTitleColor || '#ffffff');
      await upsertSettingAliases(['landing_hero_text_color', 'landing_hero_description_color', 'landing_page_hero_text_color', 'landing_page_hero_description_color', 'hero_text_color', 'hero_description_color'], landingHeroTextColor || '#ffffff');
      await upsertSetting('landing_hero_updated_at', now);

      setLandingHeroUpdatedAt(now);
      showSuccess('Landing hero writing saved.');
    } catch (err: any) {
      if (isPlatformSettingsSchemaError(err)) {
        console.warn('7SV platform_settings cache still refreshing during hero writing save.', err);
        setError('');
        showSuccess('Supabase cache is refreshing. Restart npm run dev, then save again.');
      } else {
        setError(err?.message || 'Could not save landing hero writing.');
      }
    } finally {
      setSavingId('');
    }
  }

  async function updateStorePatch(store: StoreRecord, patch: Partial<StoreRecord>) {
    try {
      setSavingId(store.id);
      setError('');
      const finalPatch = { ...patch };
      if (!getBillingStartDateValue({ ...store, ...finalPatch })) finalPatch.subscription_started_at = new Date().toISOString();
      if (!getBillingDueDateValue({ ...store, ...finalPatch })) finalPatch.billing_due_date = isoDateOnly(addDays(new Date(), 30));
      const { data, error: updateError } = await supabase.from('restaurants').update(finalPatch).eq('id', store.id).select('*').maybeSingle();
      if (updateError) throw updateError;
      setStores((prev) => prev.map((row) => (row.id === store.id ? ({ ...row, ...(data || finalPatch) } as StoreRecord) : row)));
      showSuccess('Store updated.');
    } catch (err: any) {
      setError(err?.message || 'Could not update store.');
    } finally {
      setSavingId('');
    }
  }

  async function pauseStore(store: StoreRecord) {
    await updateStorePatch(store, {
      paused: true,
      billing_status: 'paused',
            pause_reason: 'Paused by admin.',
      billing_note: 'Store paused by admin.'
    });

    setStores((current) =>
      current.map((item) =>
        item.id === store.id
          ? {
              ...item,
              paused: true,
              billing_status: 'paused',
                            pause_reason: 'Paused by admin.',
            }
          : item
      )
    );

    await sendSystemMessage(
      store,
      'Account paused',
      'Your 7th St Vault account is currently paused. Please contact 7th St Vault support or complete payment to reactivate your store.',
      'account_status'
    );

    showSuccess('Store paused successfully.');
  }

  async function unpauseStore(store: StoreRecord) {
    await updateStorePatch(store, {
      paused: false,
      billing_status: 'active',
            pause_reason: null,
      overdue_days: 0,
      billing_note: 'Store unpaused by admin.'
    });

    setStores((current) =>
      current.map((item) =>
        item.id === store.id
          ? {
              ...item,
              paused: false,
              billing_status: 'active',
                            pause_reason: null,
              overdue_days: 0,
            }
          : item
      )
    );

    await sendSystemMessage(
      store,
      'Account reactivated',
      'Your 7th St Vault account has been reactivated. Your store is live again.',
      'account_status'
    );

    showSuccess('Store unpaused successfully.');
  }

  async function markPastDue(store: StoreRecord) {
    const billing = getStoreBilling(store);
    await updateStorePatch(store, { billing_status: 'past_due', overdue_days: Math.max(1, billing.overdueDays), billing_note: 'Marked past due by admin.' });
    await sendSystemMessage(store, 'Monthly payment past due', 'Your 7th St Vault monthly payment is past due. Please update payment to avoid account pause.', 'payment_warning');
  }

  async function markPaid(store: StoreRecord) {
    const currentDue = parseLocalDate(getBillingDueDateValue(store)) || new Date();
    const next = addMonths(currentDue, 1);
    await updateStorePatch(store, {
      paused: false,
      billing_status: 'active',
      pause_reason: null,
      overdue_days: 0,
      last_payment_at: new Date().toISOString(),
      billing_due_date: isoDateOnly(next),
      billing_note: 'Payment marked paid by admin.',
    });
    await sendSystemMessage(store, 'Payment received', `Payment received. Your next 7th St Vault payment due date is ${safeLongDate(isoDateOnly(next))}.`, 'payment_received');
  }

  async function updateStorePlan(store: StoreRecord, planKey: PlatformPlan['key']) {
    const plan = PLATFORM_PLANS.find((item) => item.key === planKey) || PLATFORM_PLANS[0];
    await updateStorePatch(store, {
      plan_key: plan.key,
      plan_name: plan.name,
      plan: plan.key,
      monthly_price: plan.price,
      platform_fee_percent: plan.platformFee,
      subscription_started_at: getBillingStartDateValue(store) || new Date().toISOString(),
      billing_due_date: getBillingDueDateValue(store) || isoDateOnly(addDays(new Date(), 30)),
      billing_note: `Plan changed to ${plan.name}.`,
    });
  }

  async function sendSystemMessage(store: StoreRecord, subject: string, message: string, type = 'general') {
    const { error: insertError } = await supabase.from('admin_messages').insert({
      restaurant_id: store.id,
      owner_id: store.owner_id || store.user_id || null,
      store_name: getStoreName(store),
      sender: 'admin',
      sender_role: 'admin',
      subject,
      message,
      message_type: type,
      status: 'sent',
      read_by_owner: false,
      read_by_admin: true,
      owner_read: false,
      admin_read: true,
    });
    if (insertError) setError(insertError.message);
  }

  async function sendAdminMessage(store: StoreRecord, subject?: string, message?: string, type = 'general') {
    const body = (message || messageDraft[store.id] || '').trim();
    if (!body) {
      setError('Type a message first.');
      return;
    }

    try {
      setSavingId(store.id);
      setError('');
      const { error: insertError } = await supabase.from('admin_messages').insert({
        restaurant_id: store.id,
        owner_id: store.owner_id || store.user_id || null,
        store_name: getStoreName(store),
        sender: 'admin',
        sender_role: 'admin',
        subject: subject || 'Message from 7th St Vault Admin',
        message: body,
        message_type: type,
        status: 'sent',
        read_by_owner: false,
        read_by_admin: true,
        owner_read: false,
        admin_read: true,
      });
      if (insertError) throw insertError;
      setMessageDraft((prev) => ({ ...prev, [store.id]: '' }));
      await refreshData();
      showSuccess('Message sent.');
    } catch (err: any) {
      setError(err?.message || 'Could not send message.');
    } finally {
      setSavingId('');
    }
  }

  async function replyToConversation(conversation: Conversation | null) {
    if (!conversation) return;
    const body = replyDraft.trim();
    if (!body) {
      setError('Type your reply first.');
      return;
    }

    try {
      setSavingId(conversation.key);
      setError('');
      const store = conversation.store;
      const lastOwnerMessage = [...conversation.messages].reverse().find((message) => messageRole(message) === 'owner');
      const { error: insertError } = await supabase.from('admin_messages').insert({
        restaurant_id: conversation.restaurantId,
        owner_id: conversation.ownerId || store?.owner_id || store?.user_id || null,
        store_name: conversation.storeName,
        sender: 'admin',
        sender_role: 'admin',
        subject: lastOwnerMessage?.subject ? `Re: ${lastOwnerMessage.subject.replace(/^Re:\s*/i, '')}` : 'Reply from 7th St Vault Admin',
        message: body,
        message_type: 'admin_reply',
        status: 'sent',
        read_by_owner: false,
        read_by_admin: true,
        owner_read: false,
        admin_read: true,
      });
      if (insertError) throw insertError;

      const unreadIds = conversation.messages.filter((message) => messageRole(message) === 'owner' && !message.read_by_admin && !message.admin_read).map((message) => message.id);
      if (unreadIds.length) await supabase.from('admin_messages').update({ read_by_admin: true, admin_read: true }).in('id', unreadIds);

      setReplyDraft('');
      await refreshData();
      showSuccess('Reply sent to owner.');
    } catch (err: any) {
      setError(err?.message || 'Could not send reply.');
    } finally {
      setSavingId('');
    }
  }

  async function markConversationRead(conversation: Conversation | null) {
    if (!conversation) return;
    const ids = conversation.messages.filter((message) => messageRole(message) === 'owner' && !message.read_by_admin && !message.admin_read).map((message) => message.id);
    if (!ids.length) return;
    try {
      setSavingId(conversation.key);
      const { error: updateError } = await supabase.from('admin_messages').update({ read_by_admin: true, admin_read: true }).in('id', ids);
      if (updateError) throw updateError;
      await refreshData();
      showSuccess('Conversation marked read.');
    } catch (err: any) {
      setError(err?.message || 'Could not mark messages read.');
    } finally {
      setSavingId('');
    }
  }

  async function updateFlyerOrder(id: string, status: string) {
    try {
      setSavingId(id);
      setError('');
      const { error: updateError } = await supabase.from('flyer_orders').update({ status }).eq('id', id);
      if (updateError) throw updateError;
      setFlyerOrders((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
      showSuccess('Flyer order updated.');
    } catch (err: any) {
      setError(err?.message || 'Could not update flyer order.');
    } finally {
      setSavingId('');
    }
  }

  async function copyLink(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setCopied('');
    }
  }

  async function runBillingCheck() {
    try {
      setError('');
      const res = await fetch('/api/admin/billing-check', { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Billing check failed.');
      await refreshData();
      showSuccess(`Billing check complete. Checked: ${data.checked || 0}, Paused: ${data.paused || 0}.`);
    } catch (err: any) {
      setError(err?.message || 'Billing check failed.');
    }
  }

  async function startSubscription(store: StoreRecord, planKey?: string) {
    try {
      setSavingId(store.id);
      setError('');
      const res = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: store.id, planKey: planKey || getPlan(store).key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not start subscription checkout.');
      if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      else throw new Error('Stripe checkout link was not returned.');
    } catch (err: any) {
      setError(err?.message || 'Could not start subscription checkout.');
    } finally {
      setSavingId('');
    }
  }

  async function openOwnerDashboard(store: StoreRecord) {
    router.push(`/dashboard/admin?store=${store.id}`);
  }

  const searchedStores = useMemo(() => {
    let list = [...stores];
    if (storeFilter !== 'ALL') list = list.filter((store) => storeMatchesFilter(store, storeFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((store) =>
        getStoreName(store).toLowerCase().includes(q) ||
        (store.slug || '').toLowerCase().includes(q) ||
        (store.phone || '').toLowerCase().includes(q) ||
        (store.address || '').toLowerCase().includes(q) ||
        (store.plan || '').toLowerCase().includes(q) ||
        (store.billing_status || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, storeFilter, stores]);

  const searchedOrders = useMemo(() => {
    let list = [...orders];
    if (orderFilter !== 'ALL') list = list.filter((order) => statusMatchesFilter(order.status, orderFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((order) => {
        const store = order.restaurant_id ? storeById.get(order.restaurant_id) : null;
        return order.id.toLowerCase().includes(q) ||
          (order.customer_name || '').toLowerCase().includes(q) ||
          (order.customer_phone || '').toLowerCase().includes(q) ||
          getStoreName(store).toLowerCase().includes(q) ||
          normalizeOrderItemsSummary(order).toLowerCase().includes(q);
      });
    }
    return list;
  }, [orderFilter, orders, search, storeById]);

  const searchedFlyers = useMemo(() => {
    let list = [...flyerOrders];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((order) => (order.store_name || '').toLowerCase().includes(q) || (order.flyer_category || '').toLowerCase().includes(q) || (order.flyer_style || '').toLowerCase().includes(q) || (order.status || '').toLowerCase().includes(q));
    }
    return list;
  }, [flyerOrders, search]);

  const conversations = useMemo(() => {
    const map = new Map<string, Conversation>();
    const sorted = [...messages].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    for (const message of sorted) {
      const store = message.restaurant_id ? storeById.get(message.restaurant_id) || null : null;
      const key = message.restaurant_id || message.owner_id || message.store_name || message.id;
      const existing = map.get(key) || {
        key,
        store,
        restaurantId: message.restaurant_id || null,
        ownerId: message.owner_id || store?.owner_id || store?.user_id || null,
        storeName: getStoreName(store) !== 'Unnamed Store' ? getStoreName(store) : (message.store_name || 'Unknown Store'),
        messages: [],
        lastMessageAt: null,
        unreadAdminCount: 0,
      };
      existing.messages.push(message);
      existing.lastMessageAt = message.created_at || existing.lastMessageAt;
      existing.unreadAdminCount = existing.messages.filter((item) => messageRole(item) === 'owner' && !item.read_by_admin && !item.admin_read).length;
      map.set(key, existing);
    }

    let list = Array.from(map.values()).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

    if (messageFilter === 'UNREAD') list = list.filter((conversation) => conversation.unreadAdminCount > 0);
    if (messageFilter === 'OWNER') list = list.filter((conversation) => conversation.messages.some((message) => messageRole(message) === 'owner'));
    if (messageFilter === 'ADMIN') list = list.filter((conversation) => conversation.messages.some((message) => messageRole(message) === 'admin'));
    if (messageFilter === 'PAYMENT') list = list.filter((conversation) => conversation.messages.some((message) => String(message.message_type || '').includes('payment')));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((conversation) => conversation.storeName.toLowerCase().includes(q) || conversation.messages.some((message) =>
        (message.subject || '').toLowerCase().includes(q) ||
        messageText(message).toLowerCase().includes(q) ||
        (message.message_type || '').toLowerCase().includes(q)
      ));
    }
    return list;
  }, [messageFilter, messages, search, storeById]);

  const selectedConversation = useMemo(() => conversations.find((conversation) => conversation.key === selectedConversationKey) || conversations[0] || null, [conversations, selectedConversationKey]);

  useEffect(() => {
    if (!selectedConversationKey && conversations[0]) setSelectedConversationKey(conversations[0].key);
    if (selectedConversationKey && conversations.length && !conversations.some((conversation) => conversation.key === selectedConversationKey)) setSelectedConversationKey(conversations[0].key);
  }, [conversations, selectedConversationKey]);

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + getOrderAmount(order), 0), [orders]);
  const todayOrders = useMemo(() => orders.filter((order) => isToday(order.created_at)).length, [orders]);
  const todayRevenue = useMemo(() => orders.filter((order) => isToday(order.created_at)).reduce((sum, order) => sum + getOrderAmount(order), 0), [orders]);
  const activeStores = useMemo(() => stores.filter((store) => getStoreStatus(store) === 'active').length, [stores]);
  const pausedStores = useMemo(() => stores.filter((store) => getStoreStatus(store) === 'paused').length, [stores]);
  const pastDueStores = useMemo(() => stores.filter((store) => getStoreStatus(store) === 'past_due').length, [stores]);
  const trialStores = useMemo(() => stores.filter((store) => !store.stripe_subscription_id && !store.last_payment_at).length, [stores]);
  const flyerRevenue = useMemo(() => flyerOrders.reduce((sum, order) => sum + Number(order.package_price || 0), 0), [flyerOrders]);
  const newFlyerOrders = useMemo(() => flyerOrders.filter((order) => String(order.status || 'new').toLowerCase() === 'new').length, [flyerOrders]);
  const newOrdersCount = useMemo(() => orders.filter((order) => getStatusKey(order.status) === 'new').length, [orders]);
  const unreadMessages = useMemo(() => messages.filter((message) => messageRole(message) === 'owner' && !message.read_by_admin && !message.admin_read).length, [messages]);

  const menuCountByStore = useMemo(() => {
    const map = new Map<string, number>();
    menuItems.forEach((item) => {
      if (!item.restaurant_id) return;
      map.set(item.restaurant_id, (map.get(item.restaurant_id) || 0) + 1);
    });
    return map;
  }, [menuItems]);

  const orderStatsByStore = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    orders.forEach((order) => {
      if (!order.restaurant_id) return;
      const current = map.get(order.restaurant_id) || { count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += getOrderAmount(order);
      map.set(order.restaurant_id, current);
    });
    return map;
  }, [orders]);

  const viewsByStore = useMemo(() => {
    const map = new Map<string, number>();
    storeViews.forEach((view) => {
      if (!view.restaurant_id) return;
      map.set(view.restaurant_id, (map.get(view.restaurant_id) || 0) + 1);
    });
    return map;
  }, [storeViews]);

  const salesSeries = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const current = new Date();
    const day = current.getDay();
    const mondayOffset = (day + 6) % 7;
    const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - mondayOffset);
    return labels.map((label, index) => {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const revenue = orders.reduce((sum, order) => {
        if (!order.created_at) return sum;
        const d = new Date(order.created_at);
        return d >= dayStart && d < dayEnd ? sum + getOrderAmount(order) : sum;
      }, 0);
      return { label, revenue };
    });
  }, [orders]);

  const chartMax = useMemo(() => Math.max(600, Math.ceil((Math.max(...salesSeries.map((item) => item.revenue), 0) + 100) / 100) * 100), [salesSeries]);
  const chartPath = useMemo(() => salesSeries.map((point, index) => {
    const x = 36 + index * 78;
    const y = 180 - (point.revenue / chartMax) * 132;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' '), [chartMax, salesSeries]);
  const areaPath = useMemo(() => `${chartPath} L 504 180 L 36 180 Z`, [chartPath]);

  const billingSegments = useMemo(() => {
    const total = Math.max(1, stores.length);
    return [
      { label: 'Active', value: activeStores, percent: Math.round((activeStores / total) * 100), className: 'green' },
      { label: 'Past Due', value: pastDueStores, percent: Math.round((pastDueStores / total) * 100), className: 'orange' },
      { label: 'Paused', value: pausedStores, percent: Math.round((pausedStores / total) * 100), className: 'red' },
      { label: 'Trial', value: trialStores, percent: Math.round((trialStores / total) * 100), className: 'gray' },
    ];
  }, [activeStores, pastDueStores, pausedStores, stores.length, trialStores]);

  const landingHeroUrl = landingHeroType === 'video' ? landingHeroVideo : landingHeroImage || LANDING_DEFAULT_HERO;


  async function sendBillingNotice(store: StoreRecord, kind: 'due' | 'past_due' | 'stripe_ready' | 'stripe_issue' | 'stripe_not_connected' | 'payment_issue') {
    const billing = getStoreBilling(store);
    const stripeState = getStripeState(store);
    const notices = {
      due: {
        subject: '7th St Vault payment due notice',
        message: `Your 7th St Vault payment is due on ${billing.dueLongLabel}. Please make sure your payment is completed to keep your storefront active.`,
        type: 'payment_due',
      },
      past_due: {
        subject: '7th St Vault payment past due',
        message: `Your 7th St Vault payment is past due by ${billing.overdueDays} day(s). Please update payment to avoid account pause.`,
        type: 'payment_warning',
      },
      stripe_ready: {
        subject: 'Stripe is ready',
        message: 'Your Stripe account is connected and ready to accept payments on 7th St Vault.',
        type: 'stripe_ready',
      },
      stripe_issue: {
        subject: 'Stripe account issue',
        message: 'Your Stripe account needs attention. Please finish Stripe setup so your storefront can keep accepting payments.',
        type: 'stripe_issue',
      },
      stripe_not_connected: {
        subject: 'Stripe not connected',
        message: 'Your Stripe account is not connected yet. Please connect Stripe to accept payments through 7th St Vault.',
        type: 'stripe_not_connected',
      },
      payment_issue: {
        subject: '7th St Vault payment issue',
        message: `There is a payment issue on your 7th St Vault account. Current Stripe status: ${getStripeLabel(store)}. Please update billing or contact support.`,
        type: 'payment_issue',
      },
    }[kind];

    await sendSystemMessage(store, notices.subject, notices.message, notices.type);
    showSuccess('Owner notice sent.');
  }

  async function runAutoOwnerNotices(store: StoreRecord) {
    const billing = getStoreBilling(store);
    const stripeState = getStripeState(store);
    if (billing.overdueDays > 0 || getStoreStatus(store) === 'past_due') await sendBillingNotice(store, 'past_due');
    else await sendBillingNotice(store, 'due');
    if (stripeState === 'connected' || stripeState === 'subscription') await sendBillingNotice(store, 'stripe_ready');
    else if (stripeState === 'incomplete') await sendBillingNotice(store, 'stripe_issue');
    else await sendBillingNotice(store, 'stripe_not_connected');
  }

  async function deleteReview(review: StoreReviewRow) {
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Delete this review permanently?');
    if (!confirmed) return;
    if (review.media_url) {
      const mediaPath = review.media_url.split('/review-media/')[1];
      if (mediaPath) await supabase.storage.from('review-media').remove([mediaPath]);
    }
    await supabase.from('store_reviews').delete().eq('id', review.id);
    setReviews((current) => current.filter((item) => item.id !== review.id));
    showSuccess('Review deleted.');
  }

  async function toggleReview(review: StoreReviewRow) {
    const next = !review.approved;
    await supabase.from('store_reviews').update({ approved: next }).eq('id', review.id);
    setReviews((current) => current.map((item) => item.id === review.id ? { ...item, approved: next } : item));
  }

  function goTab(tab: AdminTab) {
    setActiveTab(tab);
    setMobileNavOpen(false);
  }

  if (loading) {
    return <main className="adminLoading"><div className="loadingCard">Loading 7th St Vault Admin...</div><style jsx global>{adminStyles}</style></main>;
  }

  if (!authorized) {
    return <main className="adminLoading"><div className="loadingCard">Checking admin access...</div><style jsx global>{adminStyles}</style></main>;
  }

  return (
    <main className="adminPage">
      <aside className={mobileNavOpen ? 'adminSidebar open' : 'adminSidebar'}>
        <div className="adminBrand"><img src="/orda-logo.png" alt="7th St Vault Admin" /><strong>ADMIN</strong></div>
        <nav className="adminNav">
          {([
            ['dashboard', '⌂', 'Dashboard'],
            ['records', '🗂', 'Seller / Customer Files'],
            ['landing', '▣', 'Landing Hero'],
            ['stores', '▥', 'Stores'],
            ['orders', '☰', 'Orders'],
            ['flyers', '⚑', 'Flyers'],
            ['messages', '●●●', 'Messages'],
            ['reviews', '★', 'Reviews'],
            ['customers', '👥', 'Customers'],
            ['ownerFiles', '📁', 'Seller Files'],
            ['customerFiles', '🧾', 'Customer Files'],
            ['orderFiles', '🛒', 'Order Files'],
            ['agreements', '📜', 'Agreements'],
            ['payments', '▣', 'Payments'],
            ['plans', '◇', 'Plans'],
            ['settings', '⚙', 'Settings'],
          ] as [AdminTab, string, string][]).map(([tab, icon, label]) => (
            <button key={tab} type="button" className={activeTab === tab ? 'adminNavBtn active' : 'adminNavBtn'} onClick={() => goTab(tab)}>
              <span>{icon}</span><b>{label}</b>{tab === 'orders' && newOrdersCount ? <em>{newOrdersCount}</em> : null}{tab === 'flyers' && newFlyerOrders ? <em>{newFlyerOrders}</em> : null}{tab === 'messages' && unreadMessages ? <em>{unreadMessages}</em> : null}
            </button>
          ))}
        </nav>
        <section className="sidebarMiniCard"><span>Platform Revenue</span><strong>{formatMoney(totalRevenue + flyerRevenue)}</strong><small>{orders.length} orders · {flyerOrders.length} flyer orders</small></section>
        <section className="quickPanel"><small>QUICK ACTIONS</small><button type="button" onClick={runBillingCheck}>Run Billing Check</button><button type="button" onClick={() => goTab('records')}>Open Seller / Customer Files</button><button type="button" onClick={() => goTab('landing')}>Edit Landing Hero</button><button type="button" onClick={() => goTab('messages')}>Open Messenger</button><button type="button" onClick={refreshData}>Refresh Live Data</button></section>
      </aside>

      <section className="adminMain">
        <header className="adminTopbar">
          <button className="mobileMenu" type="button" onClick={() => setMobileNavOpen((open) => !open)}>☰</button>
          <div className="topTitle"><strong>{activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'landing' ? 'Landing Hero' : activeTab === 'records' ? 'Seller / Customer Files' : activeTab === 'ownerFiles' ? 'Seller Files' : activeTab === 'customerFiles' ? 'Customer Files' : activeTab === 'orderFiles' ? 'Order Files' : activeTab === 'agreements' ? 'Agreements' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</strong><span>Live 7th St Vault control center</span></div>
          <div className="adminSearch"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sellers, orders, media, customers..." /></div>
          <button type="button" className="iconBadge" onClick={() => goTab('messages')}>🔔{unreadMessages ? <b>{unreadMessages}</b> : null}</button>
          <button type="button" className="refreshBtn" onClick={refreshData}>Refresh</button>
        </header>

        <section className="adminHero">
          <div><span className="eyebrow">7TH ST VAULT CONTROL CENTER</span><h1>{activeTab === 'dashboard' ? '7th St Vault Dashboard' : activeTab === 'landing' ? 'Landing Page Hero' : activeTab === 'records' ? 'Owner / Customer Saved Files' : activeTab === 'ownerFiles' ? 'Seller Information Files' : activeTab === 'customerFiles' ? 'Customer Information Files' : activeTab === 'orderFiles' ? 'Order Information Files' : activeTab === 'agreements' ? 'Terms & Agreement Files' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1><p>Manage stores, customers, orders, flyers, billing, plans, messenger support, account status, landing page hero, and live platform operations.</p></div>
          <div className="heroStatus"><i /> Real-time connected</div>
        </section>

        {error ? <div className="adminError">{error}</div> : null}
        {success ? <div className="adminSuccess">{success}</div> : null}

        {activeTab === 'landing' && (
          <section className="adminPanel landingHeroPanel">
            <div className="panelHeader">
              <div>
                <h2>Landing Page Control</h2>
                <p>Control the full public landing page theme, hero image, hero video, and writing from admin.</p>
              </div>
              <button type="button" className="softBtn" onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}>View Landing Page</button>
            </div>

            <div className="landingHeroGrid">
              <section className="landingPreviewCard">
                <div className={`landingPreview ${landingTheme === 'dark' ? 'darkLandingPreview' : 'lightLandingPreview'}`}>
                  {landingHeroType === 'video' && landingHeroVideo ? (
                    <video src={landingHeroUrl} className="landingPreviewMedia" autoPlay muted loop playsInline controls />
                  ) : (
                    <img src={landingHeroUrl || LANDING_DEFAULT_HERO} alt="Landing page hero" className="landingPreviewMedia" />
                  )}
                  <div className="landingPreviewShade" />
                  <div className="landingThemeBadge">{landingTheme === 'dark' ? 'DARK LANDING PAGE' : 'LIGHT LANDING PAGE'}</div>
                  <div className="landingPreviewText">
                    <span>LIVE HERO PREVIEW</span>
                    <strong style={{ color: landingHeroTitleColor }}>{landingHeroTitle}</strong>
                    <small style={{ color: landingHeroTextColor }}>{landingHeroText}</small>
                  </div>
                </div>

                <div className="landingHeroMeta">
                  <div><span>Current Hero</span><strong>{landingHeroType === 'video' ? 'Video' : 'Image'}</strong></div>
                  <div><span>Landing Theme</span><strong>{landingTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong></div>
                  <div><span>Updated</span><strong>{landingHeroUpdatedAt ? minutesAgo(landingHeroUpdatedAt) : 'Not saved yet'}</strong></div>
                </div>
              </section>

              <section className="landingControlCard">
                <input ref={landingImageRef} type="file" accept="image/*" hidden onChange={(event) => handleLandingHeroFile(event, 'image')} />
                <input ref={landingVideoRef} type="file" accept="video/*" hidden onChange={(event) => handleLandingHeroFile(event, 'video')} />

                <article className="themeControlBox">
                  <div>
                    <h3>Landing Page Theme</h3>
                    <p>This saves the full public landing page light/dark mode into platform_settings.</p>
                  </div>
                  <div className="themeModeGrid">
                    <button type="button" className={landingTheme === 'light' ? 'themeModeBtn active' : 'themeModeBtn'} onClick={() => void saveLandingTheme('light')} disabled={savingId === 'landing-theme'}>
                      <span>Light</span>
                      <b>White Landing Page</b>
                    </button>
                    <button type="button" className={landingTheme === 'dark' ? 'themeModeBtn active dark' : 'themeModeBtn dark'} onClick={() => void saveLandingTheme('dark')} disabled={savingId === 'landing-theme'}>
                      <span>Dark</span>
                      <b>Black Landing Page</b>
                    </button>
                  </div>
                  <button type="button" className="saveLandingSettingsButton" onClick={() => void saveLandingTheme(landingTheme)} disabled={savingId === 'landing-theme'}>
                    {savingId === 'landing-theme' ? 'Saving...' : 'Save New Settings'}
                  </button>
                </article>

                <article className="heroUploadBox">
                  <div className="uploadIcon">▧</div>
                  <div>
                    <h3>Hero Photo</h3>
                    <p>Dashboard hero preview stays 16:9. Mobile landing preview is controlled by landing page CSS at 4:3.</p>
                  </div>
                  <button type="button" disabled={heroUploading} onClick={() => landingImageRef.current?.click()}>{heroUploading ? 'Saving...' : 'Upload Photo'}</button>
                </article>

                <article className="heroUploadBox video">
                  <div className="uploadIcon">▶</div>
                  <div>
                    <h3>Hero Video</h3>
                    <p>Upload a hero video. 7th St Vault blocks videos longer than 25 seconds.</p>
                  </div>
                  <button type="button" disabled={heroUploading} onClick={() => landingVideoRef.current?.click()}>{heroUploading ? 'Checking...' : 'Upload Video'}</button>
                </article>

                <article className="heroTextEditor">
                  <div className="heroTextHeader">
                    <div>
                      <h3>Hero Writing</h3>
                      <p>Edit the main words on the public landing page hero.</p>
                    </div>
                    <button type="button" onClick={saveLandingHeroText} disabled={savingId === 'landing-hero-text'}>
                      {savingId === 'landing-hero-text' ? 'Saving...' : 'Save Writing'}
                    </button>
                  </div>

                  <label>
                    Hero Big Title
                    <textarea
                      value={landingHeroTitle}
                      onChange={(event) => setLandingHeroTitle(event.target.value)}
                      rows={3}
                      placeholder="Write your big hero headline..."
                    />
                  </label>

                  <label>
                    Hero Description
                    <textarea
                      value={landingHeroText}
                      onChange={(event) => setLandingHeroText(event.target.value)}
                      rows={4}
                      placeholder="Write your hero description..."
                    />
                  </label>

                  <div className="heroColorGrid">
                    <label>
                      Title Font Color
                      <input type="color" value={landingHeroTitleColor} onChange={(event) => setLandingHeroTitleColor(event.target.value)} />
                    </label>

                    <label>
                      Description Font Color
                      <input type="color" value={landingHeroTextColor} onChange={(event) => setLandingHeroTextColor(event.target.value)} />
                    </label>
                  </div>
                </article>

                <div className="heroModeGrid">
                  <button type="button" className={landingHeroType === 'image' ? 'modeBtn active' : 'modeBtn'} onClick={() => switchLandingHero('image')} disabled={savingId === 'landing-hero-switch'}>
                    <span>Use Photo</span>
                    <b>Image Hero</b>
                  </button>
                  <button type="button" className={landingHeroType === 'video' ? 'modeBtn active' : 'modeBtn'} onClick={() => switchLandingHero('video')} disabled={savingId === 'landing-hero-switch'}>
                    <span>Use Video</span>
                    <b>Video Hero</b>
                  </button>
                </div>

                <div className="heroRules">
                  <strong>Settings Saved For Landing Page</strong>
                  <ul>
                    <li>Theme keys: landing_theme, landing_page_theme, landing_color_theme.</li>
                    <li>Hero photo and video save to Supabase Storage.</li>
                    <li>Active hero URL saves to shared landing hero keys.</li>
                    <li>Dashboard preview is 16:9. Mobile landing page should render hero at 4:3.</li>
                  </ul>
                </div>

                <div className="actionRow">
                  <button type="button" onClick={resetLandingHero} disabled={savingId === 'landing-hero-reset'}>Reset Hero</button>
                  <button type="button" onClick={loadLandingHero}>Reload Settings</button>
                </div>
              </section>
            </div>
          </section>
        )}

        {activeTab === 'records' && (
          <section className="adminPanel">
            <div className="panelHeader">
              <div>
                <h2>Owner / Customer Saved Files</h2>
                <p>One organized place for owner records and customer records. Everything is alphabetical, separated, and open/close for taxes, legal records, support, and future reference.</p>
              </div>
              <button className="refreshBtn" type="button" onClick={refreshData}>Refresh Records</button>
            </div>

            <div className="statsGrid">
              <div className="statCard"><span>Seller Files</span><strong>{ownerRecords.length}</strong><small>A-Z saved owner records</small></div>
              <div className="statCard"><span>Customer Files</span><strong>{customers.length}</strong><small>A-Z saved customer records</small></div>
              <div className="statCard"><span>Total Orders Linked</span><strong>{orders.length}</strong><small>Connected to customer files</small></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }} className="recordsGrid">
              <section className="adminPanel" style={{ margin: 0 }}>
                <div className="panelHeader">
                  <div>
                    <h2>Seller Information Files</h2>
                    <p>Business owner/store records from the owner side.</p>
                  </div>
                </div>

                <div className="ordersTableWrap">
                  {ownerRecords.length ? ownerRecords.map((owner) => (
                    <details key={owner.id} className="orderCard">
                      <summary style={{ cursor: 'pointer', fontWeight: 900, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span>{owner.name}</span>
                        <b>{owner.status}</b>
                      </summary>

                      <div style={{ paddingTop: 14 }}>
                        <div className="metaGrid">
                          <div><span>Email</span><strong>{owner.email || 'No email saved'}</strong></div>
                          <div><span>Phone</span><strong>{owner.phone || 'No phone saved'}</strong></div>
                          <div><span>Address</span><strong>{owner.address || 'No address saved'}</strong></div>
                          <div><span>Store URL</span><strong>{owner.slug ? `/store/${owner.slug}` : 'No slug'}</strong></div>
                          <div><span>Plan</span><strong>{owner.plan}</strong></div>
                          <div><span>Stripe</span><strong>{owner.stripeStatus}</strong></div>
                          <div><span>Created</span><strong>{owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : 'N/A'}</strong></div>
                        </div>
                      </div>
                    </details>
                  )) : <div className="emptyState">No owner records found yet.</div>}
                </div>
              </section>

              <section className="adminPanel" style={{ margin: 0 }}>
                <div className="panelHeader">
                  <div>
                    <h2>Customer Information Files</h2>
                    <p>Customer records from orders and customer activity.</p>
                  </div>
                </div>

                <div className="ordersTableWrap">
                  {customers.length ? customers.map((customer) => (
                    <details key={`${customer.name}-${customer.email}-${customer.phone}`} className="orderCard">
                      <summary style={{ cursor: 'pointer', fontWeight: 900, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span>{customer.name}</span>
                        <b>{customer.totalOrders} orders</b>
                      </summary>

                      <div style={{ paddingTop: 14 }}>
                        <div className="metaGrid">
                          <div><span>Email</span><strong>{customer.email || 'No email saved'}</strong></div>
                          <div><span>Phone</span><strong>{customer.phone || 'No phone saved'}</strong></div>
                          <div><span>Address</span><strong>{customer.address || 'No address saved'}</strong></div>
                          <div><span>Store</span><strong>{customer.storeName || 'No store linked'}</strong></div>
                          <div><span>Total Orders</span><strong>{customer.totalOrders}</strong></div>
                          <div><span>Total Spent</span><strong>{formatMoney(customer.totalSpent)}</strong></div>
                          <div><span>Latest Order</span><strong>{customer.latestOrder ? new Date(customer.latestOrder).toLocaleDateString() : 'N/A'}</strong></div>
                        </div>
                      </div>
                    </details>
                  )) : <div className="emptyState">No customer records found yet.</div>}
                </div>
              </section>
            </div>
          </section>
        )}

        {activeTab === 'ownerFiles' && (
          <section className="adminPanel">
            <div className="panelHeader">
              <div>
                <h2>Seller Information Files</h2>
                <p>Real-time owner records from stores, owner profiles, Stripe status, plans, and agreement fields. Organized A-Z.</p>
              </div>
              <button className="refreshBtn" type="button" onClick={refreshData}>Refresh Seller Files</button>
            </div>
            <div className="ordersTableWrap">
              {ownerRecords.length ? ownerRecords.map((owner) => (
                <details key={owner.id} className="orderCard">
                  <summary style={{ cursor: 'pointer', fontWeight: 900, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>{owner.name}</span>
                    <b>{owner.email || 'No email saved'}</b>
                  </summary>
                  <div style={{ paddingTop: 14 }}>
                    <div className="metaGrid">
                      <div><span>Owner Email</span><strong>{owner.email || 'No email saved'}</strong></div>
                      <div><span>Phone</span><strong>{owner.phone || 'No phone saved'}</strong></div>
                      <div><span>Address</span><strong>{owner.address || 'No address saved'}</strong></div>
                      <div><span>Store URL</span><strong>{owner.slug ? `/store/${owner.slug}` : 'No slug'}</strong></div>
                      <div><span>Plan</span><strong>{owner.plan}</strong></div>
                      <div><span>Status</span><strong>{owner.status}</strong></div>
                      <div><span>Stripe</span><strong>{owner.stripeStatus}</strong></div>
                      <div><span>Created</span><strong>{owner.createdAt ? new Date(owner.createdAt).toLocaleString() : 'N/A'}</strong></div>
                    </div>
                  </div>
                </details>
              )) : <div className="emptyState">No owner records found yet.</div>}
            </div>
          </section>
        )}

        {activeTab === 'customerFiles' && (
          <section className="adminPanel">
            <div className="panelHeader">
              <div>
                <h2>Customer Information Files</h2>
                <p>Real-time customer records from orders, customer tables, profiles, and customer activity. Organized A-Z.</p>
              </div>
              <button className="refreshBtn" type="button" onClick={refreshData}>Refresh Customer Files</button>
            </div>
            <div className="ordersTableWrap">
              {customers.length ? customers.map((customer) => (
                <details key={`${customer.id}-${customer.email}-${customer.phone}`} className="orderCard">
                  <summary style={{ cursor: 'pointer', fontWeight: 900, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>{customer.name}</span>
                    <b>{customer.email || customer.phone || 'No contact saved'}</b>
                  </summary>
                  <div style={{ paddingTop: 14 }}>
                    <div className="metaGrid">
                      <div><span>Customer Email</span><strong>{customer.email || 'No email saved'}</strong></div>
                      <div><span>Phone</span><strong>{customer.phone || 'No phone saved'}</strong></div>
                      <div><span>Address</span><strong>{customer.address || 'No address saved'}</strong></div>
                      <div><span>Store</span><strong>{customer.storeName || 'No store linked'}</strong></div>
                      <div><span>Total Orders</span><strong>{customer.totalOrders}</strong></div>
                      <div><span>Total Spent</span><strong>{formatMoney(customer.totalSpent)}</strong></div>
                      <div><span>Latest Activity</span><strong>{customer.latestOrder ? new Date(customer.latestOrder).toLocaleString() : 'N/A'}</strong></div>
                      <div><span>Source</span><strong>{customer.source}</strong></div>
                    </div>
                  </div>
                </details>
              )) : <div className="emptyState">No customer records found yet.</div>}
            </div>
          </section>
        )}

        {activeTab === 'orderFiles' && (
          <section className="adminPanel">
            <div className="panelHeader">
              <div>
                <h2>Order Information Files</h2>
                <p>Every order file across 7th St Vault, newest to oldest, with customer contact, order total, payment/status, and item summary.</p>
              </div>
              <button className="refreshBtn" type="button" onClick={refreshData}>Refresh Order Files</button>
            </div>
            <div className="ordersTableWrap">
              {orders.length ? orders.map((order) => {
                const row = order as OrderRow & Record<string, any>;
                const store = row.restaurant_id ? storeById.get(row.restaurant_id) : null;
                return (
                  <details key={row.id} className="orderCard">
                    <summary style={{ cursor: 'pointer', fontWeight: 900, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span>Order #{String(row.id || '').slice(0, 8).toUpperCase()}</span>
                      <b>{formatMoney(getOrderAmount(order))}</b>
                    </summary>
                    <div style={{ paddingTop: 14 }}>
                      <div className="metaGrid">
                        <div><span>Customer</span><strong>{pickText(row, ['customer_name', 'name'], 'Customer')}</strong></div>
                        <div><span>Email</span><strong>{pickText(row, ['customer_email', 'email', 'payer_email', 'receipt_email', 'billing_email'], 'No email saved')}</strong></div>
                        <div><span>Phone</span><strong>{pickText(row, ['customer_phone', 'phone', 'phone_number'], 'No phone saved')}</strong></div>
                        <div><span>Address</span><strong>{pickText(row, ['customer_address', 'address', 'delivery_address', 'shipping_address'], 'No address saved')}</strong></div>
                        <div><span>Store</span><strong>{getStoreName(store)}</strong></div>
                        <div><span>Status</span><strong>{getStatusLabel(row.status)}</strong></div>
                        <div><span>Total</span><strong>{formatMoney(getOrderAmount(order))}</strong></div>
                        <div><span>Created</span><strong>{row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'}</strong></div>
                      </div>
                      <div className="emptyBox" style={{ marginTop: 14 }}>{normalizeOrderItemsSummary(order)}</div>
                    </div>
                  </details>
                );
              }) : <div className="emptyState">No order records found yet.</div>}
            </div>
          </section>
        )}

        {activeTab === 'agreements' && (
          <section className="adminPanel">
            <div className="panelHeader">
              <div>
                <h2>Terms & Agreement Files</h2>
                <p>Owner policy and agreement records from newest to oldest. Pulls from agreement tables when present and from restaurant agreement fields.</p>
              </div>
              <button className="refreshBtn" type="button" onClick={refreshData}>Refresh Agreement Files</button>
            </div>
            <div className="ordersTableWrap">
              {agreementRecords.length ? agreementRecords.map((agreement) => (
                <details key={`${agreement.id}-${agreement.source}`} className="orderCard">
                  <summary style={{ cursor: 'pointer', fontWeight: 900, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>{agreement.storeName}</span>
                    <b>{agreement.status}</b>
                  </summary>
                  <div style={{ paddingTop: 14 }}>
                    <div className="metaGrid">
                      <div><span>Owner / Store</span><strong>{agreement.ownerName}</strong></div>
                      <div><span>Owner Email</span><strong>{agreement.ownerEmail || 'No email saved'}</strong></div>
                      <div><span>Store URL</span><strong>{agreement.storeSlug ? `/store/${agreement.storeSlug}` : 'No slug'}</strong></div>
                      <div><span>Agreement Status</span><strong>{agreement.status}</strong></div>
                      <div><span>Accepted Date</span><strong>{agreement.acceptedAt ? new Date(agreement.acceptedAt).toLocaleString() : 'N/A'}</strong></div>
                      <div><span>IP Address</span><strong>{agreement.ipAddress || 'N/A'}</strong></div>
                      <div><span>Source</span><strong>{agreement.source}</strong></div>
                    </div>
                  </div>
                </details>
              )) : <div className="emptyState">No agreement records found yet.</div>}
            </div>
          </section>
        )}


        {activeTab === 'dashboard' && (
          <>
            <section className="adminKpis">
              <div className="adminKpi"><span className="kpiIcon purple">▥</span><div><small>Total Stores</small><strong>{stores.length}</strong><em>{activeStores} active · {pausedStores} paused</em></div></div>
              <div className="adminKpi"><span className="kpiIcon green">☰</span><div><small>Total Orders</small><strong>{orders.length}</strong><em>{todayOrders} today</em></div></div>
              <div className="adminKpi"><span className="kpiIcon blue">$</span><div><small>Total Revenue</small><strong>{formatMoney(totalRevenue)}</strong><em>{formatMoney(todayRevenue)} today</em></div></div>
              <div className="adminKpi"><span className="kpiIcon orange">⚑</span><div><small>Flyer Orders</small><strong>{flyerOrders.length}</strong><em>{newFlyerOrders} new · {formatMoney(flyerRevenue)}</em></div></div>
              <div className="adminKpi"><span className="kpiIcon red">!</span><div><small>Past Due Stores</small><strong>{pastDueStores}</strong><em>{pausedStores} paused · auto-check ready</em></div></div>
            </section>

            <section className="dashboardGrid">
              <section className="adminChartPanel">
                <div className="panelHeader"><div><h2>Revenue Overview</h2><p>Weekly revenue from live orders.</p></div><button type="button" className="softBtn">This Week</button></div>
                <div className="chartShell"><div className="chartYAxis"><span>${Math.round(chartMax)}</span><span>${Math.round(chartMax * 0.66)}</span><span>${Math.round(chartMax * 0.33)}</span><span>$0</span></div><div className="chartArea"><svg viewBox="0 0 540 206" preserveAspectRatio="none" className="chartSvg"><defs><linearGradient id="adminRevenueGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgba(111,63,245,0.3)" /><stop offset="100%" stopColor="rgba(111,63,245,0.04)" /></linearGradient></defs>{[34, 74, 114, 154, 180].map((y) => <line key={y} x1="36" y1={y} x2="504" y2={y} stroke="#e9edf3" strokeWidth="1" />)}<path d={areaPath} fill="url(#adminRevenueGradient)" /><path d={chartPath} fill="none" stroke="#6f3ff5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{salesSeries.map((point, index) => { const x = 36 + index * 78; const y = 180 - (point.revenue / chartMax) * 132; return <circle key={point.label} cx={x} cy={y} r="5" fill="#6f3ff5" stroke="#ffffff" strokeWidth="2" />; })}</svg><div className="chartDays">{salesSeries.map((point) => <span key={point.label}>{point.label}</span>)}</div></div></div>
              </section>

              <section className="billingPanel">
                <div className="panelHeader"><div><h2>Billing Status</h2><p>Automatic pause and payment health.</p></div></div>
                <div className="billingDonut"><div className="donutRing"><strong>{stores.length}</strong><span>Total Stores</span></div><div className="billingLegend">{billingSegments.map((item) => <div key={item.label}><i className={item.className} /><span>{item.label}</span><strong>{item.value} ({item.percent}%)</strong></div>)}</div></div>
                <button type="button" className="fullSoftBtn" onClick={() => goTab('stores')}>View All Stores</button>
              </section>

              <section className="messagePanelMini">
                <div className="panelHeader"><div><h2>Messages <b>{unreadMessages}</b></h2><p>Owner support inbox.</p></div></div>
                <div className="miniMessages">{conversations.slice(0, 5).map((conversation) => <button key={conversation.key} type="button" onClick={() => { setSelectedConversationKey(conversation.key); goTab('messages'); }}><span>{initials(conversation.storeName)}</span><div><strong>{conversation.storeName}</strong><small>{conversation.messages.at(-1)?.subject || messageText(conversation.messages.at(-1) as AdminMessageRow) || 'Message'}</small></div><em>{minutesAgo(conversation.lastMessageAt)}</em>{conversation.unreadAdminCount ? <b /> : null}</button>)}</div>
                <button type="button" className="primaryBtn" onClick={() => goTab('messages')}>Open All Messages</button>
              </section>

              <section className="systemPanel"><h2>System Status</h2><div className="systemRows"><span><i /> Website <b>Operational</b></span><span><i /> Stripe <b>Operational</b></span><span><i /> Database <b>Operational</b></span><span><i /> Messenger <b>Live</b></span></div></section>
            </section>
          </>
        )}

        {(activeTab === 'stores' || activeTab === 'dashboard') && (
          <details className="adminPanel storesManagementPanel">
            <summary className="storeManagementSummary">
              <div>
                <small>STORE CONTROL</small>
                <h2>Stores Management</h2>
                <p>Control every storefront, plan, due date, payment status, Stripe status, owner notices, pause state, and direct message.</p>
              </div>
              <div className="storeManagementSummaryRight"><span>{searchedStores.length} Stores</span><b>Open Section +</b></div>
            </summary>

            <div className="storeManagementBody">
              <div className="filterRow storeFilterRow">{([['ALL','All'],['ACTIVE','Active'],['PAUSED','Paused'],['PAST_DUE','Past Due'],['STRIPE_CONNECTED','Stripe Ready'],['STRIPE_INCOMPLETE','Stripe Issues']] as [StoreFilterKey,string][]).map(([key,label]) => <button key={key} type="button" className={storeFilter === key ? 'filterBtn active' : 'filterBtn'} onClick={() => setStoreFilter(key)}>{label}</button>)}</div>

              <div className="storeCards">
                {searchedStores.length ? searchedStores.map((store) => {
                  const stats = orderStatsByStore.get(store.id) || { count: 0, revenue: 0 };
                  const status = getStoreStatus(store);
                  const billing = getStoreBilling(store);
                  const stripeState = getStripeState(store);
                  return (
                    <details key={store.id} className="storeManageCard storeNativeCard">
                      <summary className="storeNativeSummary">
                        <img src={safeStoreAssetUrl(store.logo_image)} alt={getStoreName(store)} onError={(event) => { event.currentTarget.src = FALLBACK_LOGO; }} />
                        <div className="storeNativeTitle"><strong>{getStoreName(store)}</strong><span>/store/{getStoreSlug(store)}</span><small>{planLabel(store)}</small></div>
                        <div className="storeMiniStats"><b>{stats.count} Orders</b><b>{formatMoney(stats.revenue)}</b><b>{viewsByStore.get(store.id) || 0} Views</b></div>
                        <em>Open +</em>
                      </summary>

                      <div className="storeManageInside">
                        <div className="storeDetailStrip">
                          <div><span>Store Name</span><strong>{getStoreName(store)}</strong></div>
                          <div><span>Storefront</span><strong>/store/{getStoreSlug(store)}</strong></div>
                          <div><span>Plan</span><strong>{planLabel(store)}</strong></div>
                          <div><span>Status</span><strong>{status === 'paused' ? 'Paused' : status === 'past_due' ? 'Past Due' : 'Active'}</strong></div>
                          <div><span>Stripe</span><strong>{getStripeLabel(store)}</strong></div>
                          <div><span>Billing Start</span><strong>{billing.startLabel}</strong></div>
                          <div><span>Due Date</span><strong>{billing.dueLongLabel}</strong></div>
                          <div><span>Overdue</span><strong>{billing.overdueDays} days</strong></div>
                          <div><span>Orders</span><strong>{stats.count}</strong></div>
                          <div><span>Revenue</span><strong>{formatMoney(stats.revenue)}</strong></div>
                          <div><span>Views</span><strong>{viewsByStore.get(store.id) || 0}</strong></div>
                          <div><span>Menu Items</span><strong>{menuCountByStore.get(store.id) || 0}</strong></div>
                        </div>

                        <div className="storeEditGrid">
                          <label>Plan<select value={getPlan(store).key} onChange={(e) => updateStorePlan(store, e.target.value as PlatformPlan['key'])}>{PLATFORM_PLANS.map((plan) => <option key={plan.key} value={plan.key}>{plan.name} ${plan.price} + {plan.platformFee}%</option>)}</select></label>
                          <label>Billing Start Date<input type="date" value={billing.startInput} onChange={(e) => updateStorePatch(store, { subscription_started_at: e.target.value })} /></label>
                          <label>Monthly Due Date<input type="date" value={billing.dueInput} onChange={(e) => updateStorePatch(store, { billing_due_date: e.target.value })} /></label>
                          <label>Auto Pause After Days<input type="number" value={Number(store.auto_pause_after_days || 7)} onChange={(e) => updateStorePatch(store, { auto_pause_after_days: Number(e.target.value || 7) })} /></label>
                        </div>

                        <div className="storeManageQuickActions">
                          <button type="button" onClick={() => window.open(getStoreUrl(store), '_blank', 'noopener,noreferrer')}>Visit Storefront ↗</button>
                          <button type="button" onClick={() => copyLink(getStoreUrl(store), store.id)}>{copied === store.id ? 'Copied' : 'Copy Storefront Link'}</button>
                          <button type="button" onClick={() => runAutoOwnerNotices(store)} disabled={savingId === store.id}>Send Auto Notices</button>
                        </div>

                        <div className="autoNoticeGrid">
                          <button type="button" onClick={() => sendBillingNotice(store, 'due')}>Send Due Date Notice</button>
                          <button type="button" onClick={() => sendBillingNotice(store, 'past_due')}>Send Past Due Notice</button>
                          <button type="button" onClick={() => sendBillingNotice(store, stripeState === 'connected' || stripeState === 'subscription' ? 'stripe_ready' : stripeState === 'incomplete' ? 'stripe_issue' : 'stripe_not_connected')}>{stripeState === 'connected' || stripeState === 'subscription' ? 'Send Stripe Ready' : stripeState === 'incomplete' ? 'Send Stripe Issue' : 'Send Stripe Not Connected'}</button>
                          <button type="button" onClick={() => sendBillingNotice(store, 'payment_issue')}>Send Payment Issue</button>
                        </div>

                        <div className="messageInline"><input value={messageDraft[store.id] || ''} onChange={(e) => setMessageDraft((prev) => ({ ...prev, [store.id]: e.target.value }))} placeholder="Message owner about payment, account, menu, or issue..." /><button type="button" onClick={() => sendAdminMessage(store)} disabled={savingId === store.id}>Send</button></div>

                        <div className="actionRow">
                          {status === 'paused' ? <button type="button" onClick={() => unpauseStore(store)} disabled={savingId === store.id}>Unpause Account</button> : <button type="button" onClick={() => pauseStore(store)} disabled={savingId === store.id}>Pause Account</button>}
                          <button type="button" onClick={() => markPastDue(store)} disabled={savingId === store.id}>Mark Past Due</button>
                          <button type="button" onClick={() => markPaid(store)} disabled={savingId === store.id}>Mark Paid</button>
                          <button type="button" onClick={() => startSubscription(store)} disabled={savingId === store.id}>Stripe Billing</button>
                          <button type="button" onClick={() => openOwnerDashboard(store)}>Open Record</button>
                        </div>
                      </div>
                    </details>
                  );
                }) : <div className="emptyStateCard">No stores match this filter.</div>}
              </div>
            </div>
          </details>
        )}

        {activeTab === 'orders' && (
          <section className="adminPanel"><div className="panelHeader"><div><h2>Global Orders</h2><p>Every order across the platform, updating live.</p></div><div className="filterRow">{([['ALL','All'],['NEW','New'],['IN_PROGRESS','In Progress'],['READY','Ready'],['DONE','Completed'],['CANCELLED','Cancelled']] as [OrderFilterKey,string][]).map(([key,label]) => <button key={key} className={orderFilter === key ? 'filterBtn active' : 'filterBtn'} onClick={() => setOrderFilter(key)}>{label}</button>)}</div></div><div className="orderList">{searchedOrders.length ? searchedOrders.map((order) => { const store = order.restaurant_id ? storeById.get(order.restaurant_id) : null; const key = getStatusKey(order.status); return <article key={order.id} className="orderCard"><strong>#{order.id.slice(0, 6).toUpperCase()}</strong><span>{getStoreName(store)}</span><span>{order.customer_name || 'Customer'}<small>{order.customer_phone || ''}</small></span><span>{normalizeOrderItemsSummary(order)}</span><b>{formatMoney(getOrderAmount(order))}</b><em className={`orderPill ${key}`}>{getStatusLabel(order.status)}</em><small>{minutesAgo(order.created_at)}</small></article>; }) : <div className="emptyBox">No orders found.</div>}</div></section>
        )}

        {activeTab === 'flyers' && (
          <section className="adminPanel"><div className="panelHeader"><div><h2>Flyer Orders</h2><p>Track flyer category, style, quantity, price, and production status.</p></div><strong>{formatMoney(flyerRevenue)}</strong></div><div className="flyerGrid">{searchedFlyers.length ? searchedFlyers.map((order) => { const store = order.restaurant_id ? storeById.get(order.restaurant_id) : null; return <article key={order.id} className="flyerCard"><div className="flyerTop"><div className="flagIcon">⚑</div><div><strong>{order.store_name || getStoreName(store)}</strong><span>{order.flyer_category || 'No category'} · {order.flyer_style || 'No style'}</span></div></div><div className="flyerStats"><div><span>Quantity</span><strong>{order.package_quantity || 0}</strong></div><div><span>Price</span><strong>{formatMoney(Number(order.package_price || 0))}</strong></div><div><span>Payment</span><strong>{order.payment_status || 'unpaid'}</strong></div></div><p>{order.notes || 'No notes.'}</p><div className="actionRow">{['new','in_progress','ordered','completed','cancelled'].map((status) => <button key={status} type="button" onClick={() => updateFlyerOrder(order.id, status)}>{status}</button>)}</div></article>; }) : <div className="emptyBox">No flyer orders found.</div>}</div></section>
        )}

        {activeTab === 'messages' && (
          <section className="messengerShell">
            <aside className="conversationList">
              <div className="panelHeader"><div><h2>Messenger</h2><p>Owner and admin communication.</p></div><b>{unreadMessages}</b></div>
              <div className="filterRow messageFilters">{([['ALL','All'],['UNREAD','Unread'],['OWNER','Owner'],['ADMIN','Admin'],['PAYMENT','Payment']] as [MessageFilterKey,string][]).map(([key,label]) => <button key={key} type="button" className={messageFilter === key ? 'filterBtn active' : 'filterBtn'} onClick={() => setMessageFilter(key)}>{label}</button>)}</div>
              <div className="conversationButtons">{conversations.length ? conversations.map((conversation) => <button key={conversation.key} type="button" className={selectedConversation?.key === conversation.key ? 'conversationBtn active' : 'conversationBtn'} onClick={() => setSelectedConversationKey(conversation.key)}><span>{initials(conversation.storeName)}</span><div><strong>{conversation.storeName}</strong><small>{conversation.messages.at(-1)?.subject || messageText(conversation.messages.at(-1) as AdminMessageRow) || 'Message'}</small></div><em>{minutesAgo(conversation.lastMessageAt)}</em>{conversation.unreadAdminCount ? <b>{conversation.unreadAdminCount}</b> : null}</button>) : <div className="emptyBox">No messages yet.</div>}</div>
            </aside>
            <section className="chatWindow">
              {selectedConversation ? <>
                <header className="chatHeader"><div className="messageAvatar">{initials(selectedConversation.storeName)}</div><div><strong>{selectedConversation.storeName}</strong><span>{selectedConversation.messages.length} messages · {selectedConversation.unreadAdminCount} unread</span></div><button type="button" onClick={() => markConversationRead(selectedConversation)} disabled={savingId === selectedConversation.key}>Mark Read</button>{selectedConversation.store ? <button type="button" onClick={() => window.open(getStoreUrl(selectedConversation.store), '_blank', 'noopener,noreferrer')}>View Store</button> : null}</header>
                <div className="chatMessages">{selectedConversation.messages.map((message) => { const role = messageRole(message); return <article key={message.id} className={role === 'admin' ? 'chatBubble admin' : role === 'system' ? 'chatBubble system' : 'chatBubble owner'}><div><strong>{role === 'admin' ? '7th St Vault Admin' : role === 'system' ? 'System' : selectedConversation.storeName}</strong><small>{minutesAgo(message.created_at)}</small></div>{message.subject ? <em>{message.subject}</em> : null}<p>{messageText(message)}</p></article>; })}</div>
                <div className="replyBox"><textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder="Reply to seller inside 7th St Vault messenger..." /><button type="button" onClick={() => replyToConversation(selectedConversation)} disabled={savingId === selectedConversation.key}>Send Reply</button></div>
              </> : <div className="emptyBox">No conversation selected.</div>}
            </section>
          </section>
        )}

        {activeTab === 'reviews' ? (
          <section className="adminPanel">
            <div className="panelHeader"><div><h2>Customer Reviews</h2><p>Hide or delete customer comments, videos, and photos from storefront reviews.</p></div></div>
            <div className="reviewAdminGrid">
              {reviews.length ? reviews.map((review) => (
                <article key={review.id} className="reviewAdminCard">
                  <div className="reviewAdminMedia">{String(review.media_type || '').includes('video') ? <video src={String(review.media_url || '')} controls playsInline /> : review.media_url ? <img src={String(review.media_url)} alt="Review media" /> : <div className="reviewAdminEmpty">No Media</div>}</div>
                  <div className="reviewAdminBody"><div className="reviewAdminTop"><strong>{review.customer_name || 'Anonymous Customer'}</strong><span>{review.approved === false ? 'Hidden' : 'Live'}</span></div><p>{review.comment || 'No comment added.'}</p><div className="reviewAdminSocials">{review.instagram ? <small>Instagram: {review.instagram}</small> : null}{review.facebook ? <small>Facebook: {review.facebook}</small> : null}{review.tiktok ? <small>TikTok: {review.tiktok}</small> : null}{review.youtube ? <small>YouTube: {review.youtube}</small> : null}</div><div className="reviewAdminActions"><button type="button" onClick={() => toggleReview(review)}>{review.approved === false ? 'Approve Review' : 'Hide Review'}</button><button type="button" className="dangerBtn" onClick={() => deleteReview(review)}>Delete Review</button></div></div>
                </article>
              )) : <div className="emptyStateCard">No customer reviews yet.</div>}
            </div>
          </section>
        ) : null}


        {activeTab === 'payments' && (
          <section className="adminPanel"><div className="panelHeader"><div><h2>Payments & Stripe</h2><p>Monthly billing, subscription IDs, due dates, overdue status, and auto-pause control.</p></div><button className="refreshBtn" onClick={runBillingCheck}>Run Billing Check</button></div><div className="paymentsGrid">{stores.map((store) => { const billing = getStoreBilling(store); return <article key={store.id} className="paymentCard"><div className="paymentTop"><img src={safeStoreAssetUrl(store.logo_image)} alt={getStoreName(store)} onError={(event) => { event.currentTarget.src = FALLBACK_LOGO; }} /><div><strong>{getStoreName(store)}</strong><span>{store.stripe_subscription_id || 'No subscription yet'}</span></div></div><div className="stripeRows"><div><span>Plan</span><b>{planLabel(store)}</b></div><div><span>Start Date</span><b>{billing.startLabel}</b></div><div><span>Due Date</span><b>{billing.dueLabel}</b></div><div><span>Overdue</span><b>{billing.overdueDays} days</b></div><div><span>Status</span><b>{store.billing_status || 'active'}</b></div></div><button type="button" className="primaryBtn" onClick={() => startSubscription(store)}>Open Stripe Billing</button></article>; })}</div></section>
        )}

        {activeTab === 'plans' && (
          <section className="adminPanel"><div className="panelHeader"><div><h2>Plans Control</h2><p>Locked 7th St Vault pricing structure.</p></div></div><div className="plansGrid">{PLATFORM_PLANS.map((plan) => <article key={plan.key} className="planCard"><span>{plan.name}</span><strong>${plan.price}/mo</strong><p>{plan.description}</p><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></article>)}</div></section>
        )}

        
        {activeTab === 'customers' && (
          <section className="adminPanel">
            <div className="panelHeader">
              <div>
                <h2>Customer Records</h2>
                <p>Organized customer information for taxes, legal records, future marketing, and order history.</p>
              </div>
            </div>

            <div className="statsGrid">
              <div className="statCard">
                <span>Total Customers</span>
                <strong>{customers.length}</strong>
              </div>
            </div>

            <div className="ordersTableWrap">
              {customers.map((customer) => (
                <details key={customer.name} className="orderCard" open={false}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                    {customer.name}
                  </summary>

                  <div style={{ paddingTop: 12 }}>
                    <div className="metaGrid">
                      <div>
                        <span>Email</span>
                        <strong>{customer.email || 'No email saved'}</strong>
                      </div>

                      <div>
                        <span>Phone</span>
                        <strong>{customer.phone || 'No phone number'}</strong>
                      </div>

                      <div>
                        <span>Address</span>
                        <strong>{customer.address || 'No address saved'}</strong>
                      </div>

                      <div>
                        <span>Total Orders</span>
                        <strong>{customer.totalOrders}</strong>
                      </div>

                      <div>
                        <span>Total Spent</span>
                        <strong>{formatMoney(customer.totalSpent)}</strong>
                      </div>

                      <div>
                        <span>Latest Order</span>
                        <strong>{customer.latestOrder ? new Date(customer.latestOrder).toLocaleDateString() : 'N/A'}</strong>
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}


        {activeTab === 'settings' && (
          <section className="adminPanel"><div className="panelHeader"><div><h2>Admin Settings</h2><p>Locked 7th St Vault admin setup and route health.</p></div></div><div className="settingsGrid"><div><span>Platform</span><strong>7th St Vault</strong></div><div><span>Admin Route</span><strong>/dashboard/admin</strong></div><div><span>Landing Theme Keys</span><strong>landing_theme</strong></div><div><span>Landing Hero Bucket</span><strong>menu-images/landing</strong></div><div><span>Daily Billing Check</span><strong>/api/admin/billing-check</strong></div><div><span>Stripe Webhook</span><strong>/api/stripe/webhook</strong></div><div><span>Messenger Table</span><strong>admin_messages</strong></div><div><span>Platform Settings</span><strong>platform_settings</strong></div></div></section>
        )}
      </section>
      <style jsx global>{adminStyles}</style>
    </main>
  );
}

const adminStyles = `
:root{color-scheme:light}*{box-sizing:border-box}html,body{margin:0;background:#f6f7fb;color:#101827;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-x:hidden}button,input,select,textarea{font-family:inherit}button{cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}.adminLoading,.adminPage{min-height:100vh;width:100%;background:radial-gradient(circle at top left,#fff 0,#f7f8fc 44%,#eef2f7 100%)}.adminLoading{display:grid;place-items:center;padding:24px}.loadingCard{width:min(100%,720px);padding:26px;border-radius:22px;background:#fff;border:1px solid #e3e8f0;box-shadow:0 20px 60px rgba(15,23,42,.1);font-weight:1000;text-align:center}.adminPage{padding:16px;display:grid;grid-template-columns:292px minmax(0,1fr);gap:22px}.adminSidebar,.adminPanel,.adminChartPanel,.adminKpi,.sidebarMiniCard,.paymentCard,.planCard,.storeManageCard,.flyerCard,.messageCard,.billingPanel,.messagePanelMini,.systemPanel,.messengerShell,.conversationList,.chatWindow{background:rgba(255,255,255,.95);border:1px solid #e0e6ef;box-shadow:0 16px 38px rgba(15,23,42,.055)}.adminSidebar{position:sticky;top:16px;height:calc(100vh - 32px);border-radius:26px;padding:18px;display:grid;grid-template-rows:auto auto auto auto;gap:18px;overflow:auto;background:linear-gradient(180deg,#071124 0%,#0b1530 100%);border-color:#17213a;color:#fff}.adminBrand{display:grid;gap:8px;justify-items:center}.adminBrand img{width:100%;max-height:88px;object-fit:contain;filter:drop-shadow(0 18px 35px rgba(111,63,245,.35))}.adminBrand strong{font-size:13px;letter-spacing:.22em;font-weight:1000;color:#aeb8cc}.adminNav{display:grid;gap:10px}.adminNavBtn{min-height:56px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.04);display:flex;align-items:center;gap:14px;padding:0 16px;color:#eaf0ff;text-align:left}.adminNavBtn.active,.adminNavBtn:hover{background:linear-gradient(135deg,#7c3aed,#5b21b6);border-color:rgba(255,255,255,.2);box-shadow:0 16px 30px rgba(93,33,182,.35)}.adminNavBtn span{width:28px;color:#cdd6ea;font-weight:950}.adminNavBtn b{font-size:15px;font-weight:950}.adminNavBtn em,.iconBadge b{margin-left:auto;min-width:27px;height:27px;border-radius:999px;background:#7c3aed;color:#fff;display:grid;place-items:center;padding:0 8px;font-size:12px;font-style:normal;font-weight:1000}.sidebarMiniCard{border-radius:20px;padding:18px;background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1);box-shadow:none}.sidebarMiniCard span,.sidebarMiniCard small{display:block;color:#b9c5dc;font-weight:850}.sidebarMiniCard strong{display:block;margin:8px 0;font-size:27px;font-weight:1000}.quickPanel{display:grid;gap:10px;border-top:1px solid rgba(255,255,255,.08);padding-top:18px}.quickPanel small{color:#aeb8cc;font-weight:1000;letter-spacing:.08em}.quickPanel button{min-height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-weight:900;text-align:left;padding:0 14px}.adminMain{min-width:0;display:grid;gap:20px}.adminTopbar{height:66px;border-radius:22px;border:1px solid #e2e8f0;background:rgba(255,255,255,.92);box-shadow:0 14px 34px rgba(15,23,42,.05);display:grid;grid-template-columns:46px 190px minmax(280px,1fr) 56px 112px;gap:14px;align-items:center;padding:10px 14px;position:sticky;top:10px;z-index:20;backdrop-filter:blur(18px)}.mobileMenu,.iconBadge,.refreshBtn,.softBtn,.filterBtn,.actionRow button,.fullSoftBtn,.storeManageTop button{min-height:44px;border-radius:14px;border:1px solid #e0e6ef;background:#fff;color:#111827;font-weight:950}.topTitle{display:grid}.topTitle strong{font-size:17px;font-weight:1000}.topTitle span{font-size:12px;color:#64748b;font-weight:850}.adminSearch{min-height:46px;border-radius:14px;border:1px solid #e0e6ef;background:#fff;display:flex;align-items:center;gap:12px;padding:0 16px;color:#64748b}.adminSearch input{width:100%;border:0;outline:0;background:transparent;font-size:15px;font-weight:800}.iconBadge{position:relative;font-size:20px}.iconBadge b{position:absolute;right:-8px;top:-8px}.adminHero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end}.eyebrow{color:#66758d;font-weight:1000;letter-spacing:.14em;font-size:13px}.adminHero h1{margin:8px 0 6px;font-size:48px;line-height:.95;font-weight:1000;letter-spacing:-.045em}.adminHero p{margin:0;color:#66758d;font-size:18px;font-weight:850;max-width:900px}.heroStatus{height:44px;border-radius:999px;background:#ecfdf3;color:#166534;border:1px solid #bbf7d0;font-weight:1000;display:flex;align-items:center;gap:9px;padding:0 16px}.heroStatus i{width:10px;height:10px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 6px rgba(34,197,94,.14)}.adminError,.adminSuccess{border-radius:18px;padding:15px 18px;font-weight:950}.adminError{border:1px solid #fecdd3;background:#fff1f2;color:#9f1239}.adminSuccess{border:1px solid #bbf7d0;background:#ecfdf3;color:#166534}.adminKpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}.adminKpi{min-height:132px;border-radius:22px;padding:20px;display:grid;grid-template-columns:62px minmax(0,1fr);gap:16px;align-items:center}.kpiIcon{width:62px;height:62px;border-radius:20px;display:grid;place-items:center;font-size:28px;font-weight:1000}.kpiIcon.purple{background:#ede9fe;color:#7c3aed}.kpiIcon.green{background:#dcfce7;color:#16a34a}.kpiIcon.blue{background:#dbeafe;color:#2563eb}.kpiIcon.orange{background:#ffedd5;color:#f97316}.kpiIcon.red{background:#ffe4e6;color:#e11d48}.adminKpi small,.adminKpi em{display:block;color:#66758d;font-style:normal;font-weight:850}.adminKpi strong{display:block;margin:7px 0 9px;font-size:29px;line-height:1;font-weight:1000}.dashboardGrid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(330px,.85fr) minmax(310px,.72fr);gap:18px;align-items:start}.adminPanel,.adminChartPanel,.billingPanel,.messagePanelMini,.systemPanel{border-radius:24px;padding:20px;min-width:0}.panelHeader{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.panelHeader h2{margin:0;font-size:22px;font-weight:1000}.panelHeader p{margin:6px 0 0;color:#66758d;font-weight:850}.panelHeader>b,.messagePanelMini h2 b{min-width:30px;height:30px;border-radius:999px;background:#ede9fe;color:#6d28d9;display:inline-grid;place-items:center;font-size:13px}.panelHeader>strong{font-size:26px;font-weight:1000;color:#16a34a}.landingHeroGrid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr);gap:20px;align-items:start}.landingPreviewCard,.landingControlCard{border:1px solid #e8edf4;background:#fff;border-radius:24px;padding:18px;box-shadow:0 16px 38px rgba(15,23,42,.04)}.landingPreview{position:relative;aspect-ratio:16/9;min-height:0;border-radius:24px;overflow:hidden;background:#05070b}.landingPreviewMedia{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.landingPreviewShade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.28)),linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.64))}.landingPreview.lightLandingPreview{background:#f8fafc}.landingPreview.lightLandingPreview .landingPreviewShade{background:linear-gradient(90deg,rgba(0,0,0,.52),rgba(0,0,0,.16)),linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.36))}.landingThemeBadge{position:absolute;top:18px;right:18px;border:1px solid rgba(255,255,255,.25);border-radius:999px;background:rgba(255,255,255,.12);backdrop-filter:blur(12px);color:#fff;font-size:12px;font-weight:1000;letter-spacing:.1em;padding:9px 12px}.landingPreviewText{position:absolute;left:26px;right:26px;bottom:26px;color:#fff;display:grid;gap:10px}.landingPreviewText span{width:fit-content;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:8px 12px;background:rgba(255,255,255,.08);font-weight:1000;letter-spacing:.12em;font-size:12px}.landingPreviewText strong{max-width:740px;font-size:clamp(32px,5vw,62px);line-height:.94;letter-spacing:-.06em;font-weight:1000;text-shadow:0 12px 32px rgba(0,0,0,.4);display:block}.landingPreviewText small{font-size:16px;font-weight:900;color:rgba(255,255,255,.85);display:block;max-width:560px;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.35}.landingHeroMeta{margin-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.landingHeroMeta div{border:1px solid #e8edf4;background:#f8fafc;border-radius:16px;padding:14px}.landingHeroMeta span{display:block;color:#66758d;font-size:12px;font-weight:900}.landingHeroMeta strong{display:block;margin-top:6px;font-size:14px;font-weight:1000;word-break:break-word}.landingControlCard{display:grid;gap:14px}.themeControlBox{border:1px solid #e8edf4;background:linear-gradient(135deg,#fff,#f8fafc);border-radius:22px;padding:18px;display:grid;gap:14px}.themeControlBox h3{margin:0;font-size:20px;font-weight:1000}.themeControlBox p{margin:5px 0 0;color:#66758d;font-weight:850;line-height:1.4}.themeModeGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.themeModeBtn{min-height:70px;border-radius:18px;border:1px solid #e0e6ef;background:#fff;color:#111827;padding:14px;text-align:left;display:grid;gap:4px;font-weight:1000}.themeModeBtn.dark{background:#111827;color:#fff;border-color:#111827}.themeModeBtn.active{outline:4px solid rgba(124,58,237,.15);border-color:#7c3aed}.themeModeBtn span{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.75}.themeModeBtn b{font-size:16px}.saveLandingSettingsButton{width:100%;min-height:48px;border:0;border-radius:16px;background:#111827;color:#fff;font-weight:1000;font-size:15px;box-shadow:0 14px 30px rgba(15,23,42,.16)}.saveLandingSettingsButton:hover{transform:translateY(-1px)}.saveLandingSettingsButton:disabled{opacity:.6;cursor:not-allowed}.heroUploadBox{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:14px;align-items:center;border:1px solid #e8edf4;border-radius:20px;padding:16px;background:#fff}.heroUploadBox.video{background:linear-gradient(135deg,#fff,#f5f3ff)}.uploadIcon{width:58px;height:58px;border-radius:18px;background:#ede9fe;color:#7c3aed;display:grid;place-items:center;font-size:28px;font-weight:1000}.heroUploadBox h3{margin:0;font-size:18px;font-weight:1000}.heroUploadBox p{margin:5px 0 0;color:#66758d;font-weight:800;line-height:1.4}.heroUploadBox button,.modeBtn{min-height:48px;border:0;border-radius:14px;background:#111827;color:#fff;font-weight:1000;padding:0 16px}.heroModeGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.modeBtn{background:#fff;color:#111827;border:1px solid #e0e6ef;text-align:left;padding:14px;display:grid}.modeBtn.active{background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border-color:#7c3aed;box-shadow:0 18px 34px rgba(124,58,237,.22)}.modeBtn span{font-size:12px;font-weight:900;opacity:.75}.modeBtn b{font-size:17px;font-weight:1000}.heroRules{border:1px solid #e8edf4;background:#f8fafc;border-radius:18px;padding:16px}.heroRules strong{font-size:16px;font-weight:1000}.heroRules ul{margin:10px 0 0;padding-left:18px;color:#475569;font-weight:850;line-height:1.5}.heroTextEditor{border:1px solid #e8edf4;background:#fff;border-radius:22px;padding:18px;display:grid;gap:14px}.heroTextHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.heroTextHeader h3{margin:0;font-size:20px;font-weight:1000}.heroTextHeader p{margin:5px 0 0;color:#66758d;font-weight:850}.heroTextHeader button{min-height:44px;border:0;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;font-weight:1000;padding:0 16px}.heroTextEditor label{display:grid;gap:8px;color:#66758d;font-weight:950}.heroTextEditor textarea{width:100%;border:1px solid #e0e6ef;border-radius:14px;padding:12px 14px;background:#fff;color:#111827;font-weight:850;line-height:1.45;resize:vertical;outline:none}.heroTextEditor textarea:focus{border-color:#7c3aed;box-shadow:0 0 0 4px rgba(124,58,237,.1)}.heroColorGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.heroColorGrid input{width:100%;height:46px;border:1px solid #e0e6ef;border-radius:14px;background:#fff;padding:4px}.chartShell{width:100%;min-height:290px;display:grid;grid-template-columns:64px minmax(0,1fr);gap:14px}.chartYAxis{display:flex;flex-direction:column;justify-content:space-between;padding:12px 0 34px;color:#66758d;font-size:13px;font-weight:900}.chartArea{min-width:0;display:grid;grid-template-rows:1fr auto;overflow:hidden}.chartSvg{width:100%;height:270px;display:block}.chartDays{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));text-align:center;color:#66758d;font-weight:900;font-size:13px;margin-top:8px}.billingDonut{display:grid;grid-template-columns:160px minmax(0,1fr);gap:18px;align-items:center}.donutRing{width:160px;height:160px;border-radius:999px;background:conic-gradient(#22c55e 0 62%,#f59e0b 62% 78%,#f43f5e 78% 90%,#cbd5e1 90% 100%);display:grid;place-items:center;position:relative}.donutRing:before{content:'';position:absolute;inset:28px;border-radius:999px;background:#fff}.donutRing strong,.donutRing span{position:relative;z-index:1}.donutRing strong{font-size:32px;font-weight:1000}.donutRing span{margin-top:42px;color:#66758d;font-weight:850;font-size:12px}.billingLegend{display:grid;gap:12px}.billingLegend div,.systemRows span{display:flex;align-items:center;gap:10px;color:#4b5563;font-weight:850}.billingLegend i,.systemRows i{width:10px;height:10px;border-radius:999px;background:#94a3b8}.billingLegend i.green,.systemRows i{background:#22c55e}.billingLegend i.orange{background:#f59e0b}.billingLegend i.red{background:#f43f5e}.billingLegend strong,.systemRows b{margin-left:auto;color:#111827}.fullSoftBtn,.primaryBtn{width:100%;min-height:48px;margin-top:18px;border-radius:14px;border:1px solid #e0e6ef;background:#fff;font-weight:1000}.primaryBtn{background:linear-gradient(135deg,#7c3aed,#5b21b6);border-color:#7c3aed;color:#fff}.miniMessages{display:grid;gap:8px}.miniMessages button{min-height:64px;border:0;background:#fff;border-bottom:1px solid #eef2f7;display:grid;grid-template-columns:42px minmax(0,1fr) 38px 8px;gap:10px;align-items:center;text-align:left}.miniMessages span,.conversationBtn span{width:42px;height:42px;border-radius:999px;background:#eef2ff;color:#3730a3;display:grid;place-items:center;font-weight:1000}.miniMessages strong,.conversationBtn strong{display:block;font-weight:1000}.miniMessages small,.conversationBtn small{display:block;color:#66758d;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.miniMessages em,.conversationBtn em{font-style:normal;color:#66758d;font-size:12px}.miniMessages b{width:8px;height:8px;border-radius:999px;background:#7c3aed}.systemRows{display:grid;gap:14px;margin-top:18px}.filterRow{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.filterBtn{padding:0 15px;font-size:13px}.filterBtn.active{background:#ede9fe;color:#6d28d9;border-color:#d8b4fe}.storeCards{display:grid;gap:14px}.storeManageCard{border-radius:22px;padding:18px;display:grid;gap:16px}.storeManageTop,.paymentTop,.flyerTop{display:flex;align-items:center;gap:12px;min-width:0}.storeManageTop img,.paymentTop img{width:58px;height:58px;object-fit:cover;border-radius:16px;border:1px solid #e6ebf2;background:#f8fafc}.storeManageTop strong,.paymentTop strong,.flyerTop strong{display:block;font-weight:1000;font-size:18px}.storeManageTop span,.storeManageTop small,.paymentTop span,.flyerTop span{display:block;margin-top:4px;color:#66758d;font-weight:800;word-break:break-word}.storeManageTop button{margin-left:auto;padding:0 13px}.storeManageGrid{display:grid;grid-template-columns:minmax(180px,1fr) minmax(160px,.9fr) minmax(180px,1fr) 150px repeat(6,minmax(96px,.6fr));gap:12px;align-items:end}.storeManageGrid label{display:grid;gap:8px;color:#66758d;font-weight:900}.storeManageGrid input,.storeManageGrid select,.messageInline input,.replyBox textarea{width:100%;min-height:44px;border:1px solid #e0e6ef;border-radius:13px;padding:0 12px;background:#fff;font-weight:850;color:#111827;outline:none}.storeManageGrid label small{color:#66758d}.metricBox{min-height:58px;border:1px solid #e8edf4;background:#fff;border-radius:14px;padding:10px 12px}.metricBox span{display:block;color:#66758d;font-weight:850;font-size:12px}.metricBox strong{display:block;margin-top:4px;font-weight:1000}.statusPill,.stripePill,.orderPill{min-height:36px;padding:0 12px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:1000;white-space:nowrap}.statusPill.active,.stripePill.ok,.orderPill.completed{background:#ecfdf3;color:#16a34a}.statusPill.paused,.orderPill.ready,.stripePill.warn{background:#fff7ed;color:#b45309}.statusPill.pastDue,.orderPill.new{background:#fff1f2;color:#be123c}.stripePill.off,.orderPill.cancelled{background:#f1f5f9;color:#66758d}.orderPill.progress{background:#eff6ff;color:#2563eb}.messageInline{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:10px}.messageInline button{border:0;border-radius:13px;background:#111827;color:#fff;font-weight:1000}.actionRow{display:flex;flex-wrap:wrap;gap:8px}.actionRow button{padding:0 12px;min-height:40px;font-size:13px}.emptyBox{border:1px dashed #dbe2ea;border-radius:18px;padding:24px;text-align:center;color:#66758d;font-size:15px;font-weight:850}.orderList{display:grid;gap:12px}.orderCard{min-height:84px;border-radius:18px;border:1px solid #e8edf4;background:#fff;display:grid;grid-template-columns:110px minmax(150px,.8fr) minmax(160px,.8fr) minmax(220px,1.2fr) 100px 130px 100px;gap:12px;align-items:center;padding:12px 14px}.orderCard span,.orderCard small{color:#66758d;font-weight:800}.orderCard b{font-weight:1000}.orderPill{font-style:normal}.flyerGrid,.paymentsGrid,.plansGrid,.settingsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.flyerCard,.paymentCard,.planCard{border-radius:22px;padding:18px}.flagIcon{width:50px;height:50px;display:grid;place-items:center;border-radius:14px;background:#ede9fe;color:#7c3aed;font-size:24px}.flyerStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.flyerStats div,.settingsGrid div{border:1px solid #e8edf4;background:#fff;border-radius:16px;padding:14px}.flyerStats span,.settingsGrid span{display:block;color:#66758d;font-weight:850;font-size:12px}.flyerStats strong,.settingsGrid strong{display:block;margin-top:6px;font-size:18px;font-weight:1000}.flyerCard p{color:#66758d;font-weight:800}.messengerShell{border-radius:26px;padding:0;display:grid;grid-template-columns:380px minmax(0,1fr);min-height:720px;overflow:hidden}.conversationList{border:0;border-right:1px solid #e0e6ef;border-radius:0;box-shadow:none;padding:18px;overflow:auto}.messageFilters{justify-content:flex-start;margin-bottom:14px}.conversationButtons{display:grid;gap:8px}.conversationBtn{min-height:74px;border:1px solid #edf1f6;background:#fff;border-radius:16px;display:grid;grid-template-columns:44px minmax(0,1fr) 42px 26px;gap:10px;align-items:center;text-align:left;padding:10px}.conversationBtn.active{border-color:#c4b5fd;background:#f5f3ff}.conversationBtn b{width:26px;height:26px;border-radius:999px;background:#ef4444;color:#fff;display:grid;place-items:center;font-size:12px}.chatWindow{border:0;border-radius:0;box-shadow:none;display:grid;grid-template-rows:auto 1fr auto;min-height:720px;background:linear-gradient(180deg,#fff,#fbfcff)}.chatHeader{min-height:82px;border-bottom:1px solid #e0e6ef;display:flex;align-items:center;gap:12px;padding:16px}.messageAvatar{width:54px;height:54px;border-radius:999px;display:grid;place-items:center;background:#eef2ff;color:#3730a3;font-weight:1000;flex-shrink:0}.chatHeader strong{display:block;font-size:18px;font-weight:1000}.chatHeader span{display:block;color:#66758d;font-weight:850}.chatHeader button{min-height:42px;border-radius:13px;border:1px solid #e0e6ef;background:#fff;font-weight:950;padding:0 14px;margin-left:auto}.chatHeader button+button{margin-left:0}.chatMessages{padding:20px;display:flex;flex-direction:column;gap:12px;overflow:auto}.chatBubble{max-width:76%;border-radius:20px;padding:14px 16px;border:1px solid #e0e6ef;background:#fff;box-shadow:0 10px 25px rgba(15,23,42,.045)}.chatBubble.admin{align-self:flex-end;background:linear-gradient(135deg,#7c3aed,#5b21b6);border-color:#7c3aed;color:#fff}.chatBubble.owner{align-self:flex-start}.chatBubble.system{align-self:center;background:#fff7ed;color:#9a3412}.chatBubble div{display:flex;justify-content:space-between;gap:12px}.chatBubble strong{font-weight:1000}.chatBubble small{opacity:.75;font-weight:850}.chatBubble em{display:block;margin-top:8px;font-style:normal;font-weight:1000}.chatBubble p{margin:8px 0 0;font-weight:750;line-height:1.45}.replyBox{border-top:1px solid #e0e6ef;padding:16px;display:grid;grid-template-columns:minmax(0,1fr) 140px;gap:12px;background:#fff}.replyBox textarea{min-height:72px;padding:14px;resize:vertical;line-height:1.4}.replyBox button{border:0;border-radius:14px;background:#111827;color:#fff;font-weight:1000}.stripeRows{display:grid;gap:10px;margin:16px 0}.stripeRows div{display:flex;justify-content:space-between;gap:12px;color:#66758d;font-weight:850}.stripeRows b{color:#111827}.planCard span{color:#66758d;font-weight:1000;text-transform:uppercase;letter-spacing:.06em}.planCard strong{display:block;margin-top:8px;font-size:38px;font-weight:1000}.planCard p{color:#66758d;font-weight:850;line-height:1.45}.planCard ul{margin:14px 0 0;padding:0;list-style:none;display:grid;gap:8px;font-weight:850}@media(max-width:1600px){.adminKpis{grid-template-columns:repeat(3,minmax(0,1fr))}.dashboardGrid{grid-template-columns:1fr 1fr}.messagePanelMini{grid-column:span 2}.storeManageGrid{grid-template-columns:1fr 1fr 1fr 150px repeat(3,minmax(110px,.7fr))}.storeManageGrid .stripePill,.storeManageGrid .statusPill{min-height:44px}}@media(max-width:1250px){.adminPage{grid-template-columns:1fr}.adminSidebar{position:fixed;left:12px;top:12px;bottom:12px;width:292px;height:auto;z-index:80;transform:translateX(-110%);transition:transform .2s ease}.adminSidebar.open{transform:translateX(0)}.adminTopbar{grid-template-columns:46px 150px minmax(0,1fr) 56px 100px}.dashboardGrid,.messengerShell,.landingHeroGrid{grid-template-columns:1fr}.messagePanelMini{grid-column:auto}.adminKpis,.flyerGrid,.paymentsGrid,.plansGrid,.settingsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.storeManageGrid,.orderCard{grid-template-columns:1fr 1fr}.orderCard>*{min-width:0}.conversationList{border-right:0;border-bottom:1px solid #e0e6ef}.chatWindow{min-height:620px}}@media(max-width:760px){.heroTextHeader{display:grid}.heroColorGrid,.themeModeGrid{grid-template-columns:1fr}.adminPage{padding:10px}.adminTopbar{height:auto;grid-template-columns:44px minmax(0,1fr) 50px;gap:10px}.adminSearch{grid-column:1/4}.refreshBtn{display:none}.adminHero{grid-template-columns:1fr}.adminHero h1{font-size:39px}.adminHero p{font-size:16px}.adminKpis,.flyerGrid,.paymentsGrid,.plansGrid,.settingsGrid,.storeManageGrid,.orderCard,.billingDonut,.landingHeroMeta,.heroUploadBox,.heroModeGrid{grid-template-columns:1fr}.adminPanel,.adminChartPanel,.billingPanel,.messagePanelMini,.systemPanel{padding:16px}.panelHeader{display:grid}.filterRow{justify-content:flex-start}.chartShell{grid-template-columns:1fr}.chartYAxis{display:none}.chartSvg{height:240px}.flyerStats{grid-template-columns:1fr}.actionRow button{flex:1 1 auto}.storeManageTop{display:grid}.storeManageTop button{margin-left:0}.messageInline,.replyBox{grid-template-columns:1fr}.chatHeader{display:grid}.chatHeader button{margin-left:0}.chatBubble{max-width:94%}.messengerShell{min-height:auto}.conversationBtn{grid-template-columns:44px minmax(0,1fr) 34px}.conversationBtn b{grid-column:1/4}.adminSidebar{width:min(92vw,292px)}.landingPreview{aspect-ratio:4/3}.landingPreviewText strong{font-size:35px}.heroUploadBox button{min-height:52px;width:100%}}

.storesManagementPanel{padding:0!important;overflow:hidden}.storeManagementSummary{list-style:none;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:20px;cursor:pointer}.storeManagementSummary::-webkit-details-marker,.storeNativeSummary::-webkit-details-marker{display:none}.storeManagementSummary:hover{background:rgba(112,72,232,.045)}.storeManagementSummary small{display:block;color:#7048e8;font-weight:1000;letter-spacing:.13em;font-size:12px}.storeManagementSummary h2{margin:6px 0;color:#111827;font-size:28px;line-height:1;font-weight:1000;letter-spacing:-.04em}.storeManagementSummary p{margin:0;max-width:740px;color:#475569;font-weight:700;line-height:1.45}.storeManagementSummaryRight{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end}.storeManagementSummaryRight span{padding:10px 13px;border-radius:999px;background:#f1f5f9;color:#111827;font-weight:950}.storeManagementSummaryRight b{padding:13px 18px;border-radius:999px;background:#b7ff00;color:#111827;font-weight:1000;white-space:nowrap}.storesManagementPanel[open] .storeManagementSummaryRight b{font-size:0}.storesManagementPanel[open] .storeManagementSummaryRight b::after{content:'Close Section −';font-size:14px}.storeManagementBody{padding:0 24px 24px}.storeFilterRow{justify-content:flex-start;margin-bottom:18px}.storeNativeCard{padding:0!important;overflow:hidden}.storeNativeSummary{list-style:none;display:flex;align-items:center;gap:14px;padding:16px 18px;cursor:pointer}.storeNativeSummary:hover{background:rgba(183,255,0,.08)}.storeNativeSummary img{width:54px;height:54px;border-radius:14px;object-fit:cover}.storeNativeTitle{display:grid;gap:4px}.storeNativeTitle strong{color:#111827;font-size:18px;font-weight:1000}.storeNativeTitle span{color:#334155;font-size:14px;font-weight:850}.storeNativeTitle small{color:#64748b;font-size:12px;font-weight:850}.storeMiniStats{margin-left:auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.storeMiniStats b{padding:8px 10px;border-radius:999px;background:#f3f7ec;color:#111827;font-size:12px;font-weight:950}.storeNativeSummary em{font-style:normal;min-width:92px;text-align:center;padding:10px 14px;border-radius:999px;background:#b7ff00;color:#111827;font-weight:1000}.storeNativeCard[open] .storeNativeSummary em{font-size:0}.storeNativeCard[open] .storeNativeSummary em::after{content:'Close −';font-size:14px}.storeManageInside{padding:18px;border-top:1px solid #e2e8f0;background:#fff}.storeDetailStrip{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin-bottom:14px}.storeDetailStrip div{padding:14px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0}.storeDetailStrip span{display:block;color:#64748b;font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.storeDetailStrip strong{display:block;margin-top:5px;color:#111827;font-size:15px;font-weight:1000}.storeEditGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:14px 0}.storeEditGrid label{display:grid;gap:7px;color:#334155;font-size:12px;font-weight:950}.storeEditGrid input,.storeEditGrid select{min-height:42px;border-radius:12px;border:1px solid #dbe3ef;padding:0 12px;font-weight:850}.storeManageQuickActions,.autoNoticeGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:14px 0}.storeManageQuickActions button,.autoNoticeGrid button{min-height:44px;border:0;border-radius:14px;background:#111827;color:#fff;font-weight:950;cursor:pointer}.storeManageQuickActions button:first-child{background:#b7ff00;color:#111827}.autoNoticeGrid button{background:#eef2ff;color:#111827}.reviewAdminGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px}.reviewAdminCard{overflow:hidden;border-radius:26px;background:#10141f;border:1px solid rgba(255,255,255,.08)}.reviewAdminMedia video,.reviewAdminMedia img{width:100%;aspect-ratio:4/5;object-fit:cover;background:#000;display:block}.reviewAdminEmpty{display:grid;place-items:center;aspect-ratio:4/5;background:#0b0f18;color:#fff}.reviewAdminBody{padding:16px}.reviewAdminTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.reviewAdminTop strong{color:#fff;font-size:18px}.reviewAdminTop span{padding:6px 10px;border-radius:999px;background:#b7ff00;color:#111827;font-size:11px;font-weight:900}.reviewAdminBody p{margin:12px 0;color:rgba(255,255,255,.76);line-height:1.5}.reviewAdminSocials{display:grid;gap:6px;margin-bottom:14px}.reviewAdminSocials small{color:rgba(255,255,255,.62)}.reviewAdminActions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.reviewAdminActions button{min-height:46px;border:none;border-radius:14px;background:#b7ff00;color:#111827;font-weight:900;cursor:pointer}.reviewAdminActions .dangerBtn{background:#ef4444;color:#fff}@media(max-width:900px){.storeManagementSummary{display:grid;grid-template-columns:1fr}.storeManagementSummaryRight{justify-content:flex-start}.storeNativeSummary{display:grid;grid-template-columns:54px 1fr}.storeMiniStats{grid-column:1/-1;margin-left:0}.storeNativeSummary em{grid-column:1/-1;width:100%}}

.storeStatusBadge{display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border-radius:999px;font-size:11px;font-weight:1000;letter-spacing:.08em}
.storeStatusBadge.active{background:#dcfce7;color:#166534}
.storeStatusBadge.paused{background:#fee2e2;color:#991b1b}
.storeStatusBadge.pastDue{background:#fef3c7;color:#92400e}
@media(max-width:1180px){.recordsGrid{grid-template-columns:1fr!important}}

`;
