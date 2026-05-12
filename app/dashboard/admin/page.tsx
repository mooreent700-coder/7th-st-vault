'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type AdminTab = 'dashboard' | 'stores' | 'orders' | 'flyers' | 'messages' | 'payments' | 'plans' | 'settings';
type StoreFilterKey = 'ALL' | 'ACTIVE' | 'PAUSED' | 'PAST_DUE' | 'STRIPE_CONNECTED' | 'STRIPE_INCOMPLETE';
type OrderFilterKey = 'ALL' | 'NEW' | 'IN_PROGRESS' | 'READY' | 'DONE' | 'CANCELLED';
type MessageFilterKey = 'ALL' | 'UNREAD' | 'OWNER' | 'ADMIN' | 'PAYMENT';

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
  payment_due_date?: string | null;
  subscription_due_date?: string | null;
  billing_due_date?: string | null;
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

type MenuItemRow = { id: string; restaurant_id?: string | null };
type StoreViewRow = { id: string; restaurant_id?: string | null; created_at?: string | null };

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
const FALLBACK_LOGO = '/orda-logo.png';

const PLATFORM_PLANS: PlatformPlan[] = [
  { key: 'starter', name: 'Starter', price: 19, platformFee: 10, description: 'Free first month, then $19/month plus 10% platform fee.', features: ['Free first month', '$19 monthly billing', '10% platform fee', 'Storefront', 'Menu Builder', 'Basic Dashboard'] },
  { key: 'growth', name: 'Growth', price: 49, platformFee: 5, description: '$49/month plus 5% platform fee for growing stores.', features: ['$49 monthly billing', '5% platform fee', 'Flyers', 'Advanced Dashboard', 'Stripe Connect'] },
  { key: 'premium', name: 'Premium', price: 99, platformFee: 3, description: '$99/month plus 3% platform fee for premium operators.', features: ['$99 monthly billing', '3% platform fee', 'Priority Support', 'Marketing Tools', 'Premium Setup'] },
];

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getOrderAmount(order: OrderRow) {
  return Number(order.total ?? order.amount_total ?? 0);
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
  const direct = store.payment_due_date || store.subscription_due_date || store.billing_due_date || store.next_payment_date || null;
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

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [storeViews, setStoreViews] = useState<StoreViewRow[]>([]);
  const [flyerOrders, setFlyerOrders] = useState<FlyerOrderRow[]>([]);
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);
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

  const showSuccess = useCallback((value: string) => {
    setSuccess(value);
    window.setTimeout(() => setSuccess(''), 2200);
  }, []);

  const storeById = useMemo(() => {
    const map = new Map<string, StoreRecord>();
    stores.forEach((store) => map.set(store.id, store));
    return map;
  }, [stores]);

  const refreshData = useCallback(async () => {
    try {
      setError('');
      const [restaurantRes, orderRes, menuRes, viewRes, flyerRes, messageRes] = await Promise.all([
        supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('menu_items').select('id, restaurant_id').limit(1000),
        supabase.from('store_views').select('id, restaurant_id, created_at').limit(5000),
        supabase.from('flyer_orders').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('admin_messages').select('*').order('created_at', { ascending: false }).limit(500),
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
          payment_due_date: store.payment_due_date || due,
          auto_pause_after_days: store.auto_pause_after_days ?? 7,
          billing_status: store.billing_status || 'active',
          plan: store.plan || store.plan_key || 'starter',
          plan_key: store.plan_key || store.plan || 'starter',
        };
      });

      setStores(loadedStores);
      setOrders((orderRes.data || []) as OrderRow[]);
      setMenuItems((menuRes.data || []) as MenuItemRow[]);
      setStoreViews(viewRes.error ? [] : ((viewRes.data || []) as StoreViewRow[]));
      setFlyerOrders(flyerRes.error ? [] : ((flyerRes.data || []) as FlyerOrderRow[]));
      setMessages(messageRes.error ? [] : ((messageRes.data || []) as AdminMessageRow[]));

      const missingBillingStores = loadedStores.filter((store) => {
        const original = (restaurantRes.data || []).find((row: any) => row.id === store.id) as StoreRecord | undefined;
        return original && (!original.subscription_started_at || !original.payment_due_date || !original.auto_pause_after_days || !original.billing_status || !original.plan_key);
      });

      if (missingBillingStores.length) {
        await Promise.all(missingBillingStores.map((store) => supabase.from('restaurants').update({
          subscription_started_at: store.subscription_started_at,
          payment_due_date: store.payment_due_date,
          auto_pause_after_days: store.auto_pause_after_days,
          billing_status: store.billing_status,
          plan: store.plan,
          plan_key: store.plan_key,
          monthly_price: store.monthly_price ?? getPlan(store).price,
          platform_fee_percent: store.platform_fee_percent ?? getPlan(store).platformFee,
        }).eq('id', store.id)));
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load admin data.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    let orderChannel: ReturnType<typeof supabase.channel> | null = null;
    let restaurantChannel: ReturnType<typeof supabase.channel> | null = null;
    let viewChannel: ReturnType<typeof supabase.channel> | null = null;
    let flyerChannel: ReturnType<typeof supabase.channel> | null = null;
    let messageChannel: ReturnType<typeof supabase.channel> | null = null;

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

        orderChannel = supabase.channel('orda-admin-orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void refreshData()).subscribe();
        restaurantChannel = supabase.channel('orda-admin-restaurants-live').on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => void refreshData()).subscribe();
        viewChannel = supabase.channel('orda-admin-store-views-live').on('postgres_changes', { event: '*', schema: 'public', table: 'store_views' }, () => void refreshData()).subscribe();
        flyerChannel = supabase.channel('orda-admin-flyer-orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'flyer_orders' }, () => void refreshData()).subscribe();
        messageChannel = supabase.channel('orda-admin-messages-live').on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages' }, () => void refreshData()).subscribe();
      } catch (err: any) {
        if (!active) return;
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
    };
  }, [refreshData, router]);

  async function updateStorePatch(store: StoreRecord, patch: Partial<StoreRecord>) {
    try {
      setSavingId(store.id);
      setError('');
      const finalPatch = { ...patch };
      if (!getBillingStartDateValue({ ...store, ...finalPatch })) finalPatch.subscription_started_at = new Date().toISOString();
      if (!getBillingDueDateValue({ ...store, ...finalPatch })) finalPatch.payment_due_date = isoDateOnly(addDays(new Date(), 30));
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
    await updateStorePatch(store, { paused: true, billing_status: 'paused', pause_reason: 'Paused by admin.', billing_note: 'Store paused by admin.' });
    await sendSystemMessage(store, 'Account paused', 'Your ORDA account is currently paused. Please contact ORDA support or complete payment to reactivate your store.', 'account_status');
  }

  async function unpauseStore(store: StoreRecord) {
    await updateStorePatch(store, { paused: false, billing_status: 'active', pause_reason: null, overdue_days: 0, billing_note: 'Store unpaused by admin.' });
    await sendSystemMessage(store, 'Account reactivated', 'Your ORDA account has been reactivated. Your store is live again.', 'account_status');
  }

  async function markPastDue(store: StoreRecord) {
    const billing = getStoreBilling(store);
    await updateStorePatch(store, { billing_status: 'past_due', overdue_days: Math.max(1, billing.overdueDays), billing_note: 'Marked past due by admin.' });
    await sendSystemMessage(store, 'Monthly payment past due', 'Your ORDA monthly payment is past due. Please update payment to avoid account pause.', 'payment_warning');
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
      payment_due_date: isoDateOnly(next),
      billing_note: 'Payment marked paid by admin.',
    });
    await sendSystemMessage(store, 'Payment received', `Payment received. Your next ORDA payment due date is ${safeLongDate(isoDateOnly(next))}.`, 'payment_received');
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
      payment_due_date: getBillingDueDateValue(store) || isoDateOnly(addDays(new Date(), 30)),
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
        subject: subject || 'Message from ORDA Admin',
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
        subject: lastOwnerMessage?.subject ? `Re: ${lastOwnerMessage.subject.replace(/^Re:\s*/i, '')}` : 'Reply from ORDA Admin',
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
      if (unreadIds.length) {
        await supabase.from('admin_messages').update({ read_by_admin: true, admin_read: true }).in('id', unreadIds);
      }

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

  function goTab(tab: AdminTab) {
    setActiveTab(tab);
    setMobileNavOpen(false);
  }

  if (loading) {
    return <main className="adminLoading"><div className="loadingCard">Loading ORDA Admin...</div><style jsx global>{adminStyles}</style></main>;
  }

  if (!authorized) {
    return <main className="adminLoading"><div className="loadingCard">Checking admin access...</div><style jsx global>{adminStyles}</style></main>;
  }

  return (
    <main className="adminPage">
      <aside className={mobileNavOpen ? 'adminSidebar open' : 'adminSidebar'}>
        <div className="adminBrand"><img src="/orda-logo.png" alt="ORDA Admin" /><strong>ADMIN</strong></div>
        <nav className="adminNav">
          {([
            ['dashboard', '⌂', 'Dashboard'], ['stores', '▥', 'Stores'], ['orders', '☰', 'Orders'], ['flyers', '⚑', 'Flyers'], ['messages', '●●●', 'Messages'], ['payments', '▣', 'Payments'], ['plans', '◇', 'Plans'], ['settings', '⚙', 'Settings'],
          ] as [AdminTab, string, string][]).map(([tab, icon, label]) => (
            <button key={tab} type="button" className={activeTab === tab ? 'adminNavBtn active' : 'adminNavBtn'} onClick={() => goTab(tab)}>
              <span>{icon}</span><b>{label}</b>{tab === 'orders' && newOrdersCount ? <em>{newOrdersCount}</em> : null}{tab === 'flyers' && newFlyerOrders ? <em>{newFlyerOrders}</em> : null}{tab === 'messages' && unreadMessages ? <em>{unreadMessages}</em> : null}
            </button>
          ))}
        </nav>
        <section className="sidebarMiniCard"><span>Platform Revenue</span><strong>{formatMoney(totalRevenue + flyerRevenue)}</strong><small>{orders.length} orders · {flyerOrders.length} flyer orders</small></section>
        <section className="quickPanel"><small>QUICK ACTIONS</small><button type="button" onClick={runBillingCheck}>Run Billing Check</button><button type="button" onClick={() => goTab('messages')}>Open Messenger</button><button type="button" onClick={refreshData}>Refresh Live Data</button></section>
      </aside>

      <section className="adminMain">
        <header className="adminTopbar">
          <button className="mobileMenu" type="button" onClick={() => setMobileNavOpen((open) => !open)}>☰</button>
          <div className="topTitle"><strong>{activeTab === 'dashboard' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</strong><span>Live ORDA control center</span></div>
          <div className="adminSearch"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stores, orders, flyers, customers..." /></div>
          <button type="button" className="iconBadge" onClick={() => goTab('messages')}>🔔{unreadMessages ? <b>{unreadMessages}</b> : null}</button>
          <button type="button" className="refreshBtn" onClick={refreshData}>Refresh</button>
        </header>

        <section className="adminHero">
          <div><span className="eyebrow">ORDA CONTROL CENTER</span><h1>{activeTab === 'dashboard' ? 'Platform Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1><p>Manage stores, orders, flyers, billing, plans, messenger support, account status, and live platform operations.</p></div>
          <div className="heroStatus"><i /> Real-time connected</div>
        </section>

        {error ? <div className="adminError">{error}</div> : null}
        {success ? <div className="adminSuccess">{success}</div> : null}

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
          <section className="adminPanel">
            <div className="panelHeader"><div><h2>Stores Management</h2><p>Control every ORDA storefront, plan, pause state, due date, billing status, and direct message.</p></div><div className="filterRow">{([['ALL','All'],['ACTIVE','Active'],['PAUSED','Paused'],['PAST_DUE','Past Due'],['STRIPE_CONNECTED','Stripe Ready'],['STRIPE_INCOMPLETE','Stripe Issues']] as [StoreFilterKey,string][]).map(([key,label]) => <button key={key} type="button" className={storeFilter === key ? 'filterBtn active' : 'filterBtn'} onClick={() => setStoreFilter(key)}>{label}</button>)}</div></div>
            <div className="storeCards">
              {searchedStores.length ? searchedStores.map((store) => {
                const stats = orderStatsByStore.get(store.id) || { count: 0, revenue: 0 };
                const status = getStoreStatus(store);
                const billing = getStoreBilling(store);
                return (
                  <article key={store.id} className="storeManageCard">
                    <div className="storeManageTop"><img src={store.logo_image || FALLBACK_LOGO} alt={getStoreName(store)} /><div><strong>{getStoreName(store)}</strong><span>/store/{getStoreSlug(store)}</span><small>{planLabel(store)}</small></div><button type="button" onClick={() => window.open(getStoreUrl(store), '_blank', 'noopener,noreferrer')}>View Store ↗</button></div>
                    <div className="storeManageGrid">
                      <label>Plan<select value={getPlan(store).key} onChange={(e) => updateStorePlan(store, e.target.value as PlatformPlan['key'])}>{PLATFORM_PLANS.map((plan) => <option key={plan.key} value={plan.key}>{plan.name} ${plan.price} + {plan.platformFee}%</option>)}</select></label>
                      <label>Billing Start Date<input type="date" value={billing.startInput} onChange={(e) => updateStorePatch(store, { subscription_started_at: e.target.value })} /><small>{billing.startLabel}</small></label>
                      <label>Monthly Due Date<input type="date" value={billing.dueInput} onChange={(e) => updateStorePatch(store, { payment_due_date: e.target.value })} /><small>{billing.dueLongLabel} · {billing.overdueDays} overdue days</small></label>
                      <label>Auto Pause After Days<input type="number" value={Number(store.auto_pause_after_days || 7)} onChange={(e) => updateStorePatch(store, { auto_pause_after_days: Number(e.target.value || 7) })} /></label>
                      <div className="metricBox"><span>Orders</span><strong>{stats.count}</strong></div><div className="metricBox"><span>Revenue</span><strong>{formatMoney(stats.revenue)}</strong></div><div className="metricBox"><span>Views</span><strong>{viewsByStore.get(store.id) || 0}</strong></div><div className="metricBox"><span>Menu Items</span><strong>{menuCountByStore.get(store.id) || 0}</strong></div><div className={getStripeState(store) === 'connected' || getStripeState(store) === 'subscription' ? 'stripePill ok' : getStripeState(store) === 'incomplete' ? 'stripePill warn' : 'stripePill off'}>{getStripeLabel(store)}</div><div className={status === 'paused' ? 'statusPill paused' : status === 'past_due' ? 'statusPill pastDue' : 'statusPill active'}>{status === 'paused' ? 'Paused' : status === 'past_due' ? 'Past Due' : 'Active'}</div>
                    </div>
                    <div className="messageInline"><input value={messageDraft[store.id] || ''} onChange={(e) => setMessageDraft((prev) => ({ ...prev, [store.id]: e.target.value }))} placeholder="Message owner about payment, account, menu, or issue..." /><button type="button" onClick={() => sendAdminMessage(store)} disabled={savingId === store.id}>Send</button></div>
                    <div className="actionRow"><button type="button" onClick={() => copyLink(getStoreUrl(store), store.id)}>{copied === store.id ? 'Copied' : 'Copy Link'}</button>{status === 'paused' ? <button type="button" onClick={() => unpauseStore(store)} disabled={savingId === store.id}>Unpause</button> : <button type="button" onClick={() => pauseStore(store)} disabled={savingId === store.id}>Pause</button>}<button type="button" onClick={() => markPastDue(store)} disabled={savingId === store.id}>Past Due</button><button type="button" onClick={() => markPaid(store)} disabled={savingId === store.id}>Mark Paid</button><button type="button" onClick={() => startSubscription(store)} disabled={savingId === store.id}>Stripe Billing</button><button type="button" onClick={() => openOwnerDashboard(store)}>Open Record</button></div>
                  </article>
                );
              }) : <div className="emptyBox">No stores found.</div>}
            </div>
          </section>
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
                <div className="chatMessages">{selectedConversation.messages.map((message) => { const role = messageRole(message); return <article key={message.id} className={role === 'admin' ? 'chatBubble admin' : role === 'system' ? 'chatBubble system' : 'chatBubble owner'}><div><strong>{role === 'admin' ? 'ORDA Admin' : role === 'system' ? 'System' : selectedConversation.storeName}</strong><small>{minutesAgo(message.created_at)}</small></div>{message.subject ? <em>{message.subject}</em> : null}<p>{messageText(message)}</p></article>; })}</div>
                <div className="replyBox"><textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder="Reply to owner inside ORDA messenger..." /><button type="button" onClick={() => replyToConversation(selectedConversation)} disabled={savingId === selectedConversation.key}>Send Reply</button></div>
              </> : <div className="emptyBox">No conversation selected.</div>}
            </section>
          </section>
        )}

        {activeTab === 'payments' && (
          <section className="adminPanel"><div className="panelHeader"><div><h2>Payments & Stripe</h2><p>Monthly billing, subscription IDs, due dates, overdue status, and auto-pause control.</p></div><button className="refreshBtn" onClick={runBillingCheck}>Run Billing Check</button></div><div className="paymentsGrid">{stores.map((store) => { const billing = getStoreBilling(store); return <article key={store.id} className="paymentCard"><div className="paymentTop"><img src={store.logo_image || FALLBACK_LOGO} alt={getStoreName(store)} /><div><strong>{getStoreName(store)}</strong><span>{store.stripe_subscription_id || 'No subscription yet'}</span></div></div><div className="stripeRows"><div><span>Plan</span><b>{planLabel(store)}</b></div><div><span>Start Date</span><b>{billing.startLabel}</b></div><div><span>Due Date</span><b>{billing.dueLabel}</b></div><div><span>Overdue</span><b>{billing.overdueDays} days</b></div><div><span>Status</span><b>{store.billing_status || 'active'}</b></div></div><button type="button" className="primaryBtn" onClick={() => startSubscription(store)}>Open Stripe Billing</button></article>; })}</div></section>
        )}

        {activeTab === 'plans' && (
          <section className="adminPanel"><div className="panelHeader"><div><h2>Plans Control</h2><p>Locked ORDA pricing structure.</p></div></div><div className="plansGrid">{PLATFORM_PLANS.map((plan) => <article key={plan.key} className="planCard"><span>{plan.name}</span><strong>${plan.price}/mo</strong><p>{plan.description}</p><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></article>)}</div></section>
        )}

        {activeTab === 'settings' && (
          <section className="adminPanel"><div className="panelHeader"><div><h2>Admin Settings</h2><p>Locked ORDA admin setup and route health.</p></div></div><div className="settingsGrid"><div><span>Platform</span><strong>ORDA</strong></div><div><span>Admin Route</span><strong>/dashboard/admin</strong></div><div><span>Daily Billing Check</span><strong>/api/admin/billing-check</strong></div><div><span>Stripe Webhook</span><strong>/api/stripe/webhook</strong></div><div><span>Messenger Table</span><strong>admin_messages</strong></div><div><span>Realtime</span><strong>Enabled</strong></div></div></section>
        )}
      </section>
      <style jsx global>{adminStyles}</style>
    </main>
  );
}

const adminStyles = `
:root{color-scheme:light}*{box-sizing:border-box}html,body{margin:0;background:#f6f7fb;color:#101827;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-x:hidden}button,input,select,textarea{font-family:inherit}button{cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}.adminLoading,.adminPage{min-height:100vh;width:100%;background:radial-gradient(circle at top left,#fff 0,#f7f8fc 44%,#eef2f7 100%)}.adminLoading{display:grid;place-items:center;padding:24px}.loadingCard{width:min(100%,720px);padding:26px;border-radius:22px;background:#fff;border:1px solid #e3e8f0;box-shadow:0 20px 60px rgba(15,23,42,.1);font-weight:1000;text-align:center}.adminPage{padding:16px;display:grid;grid-template-columns:292px minmax(0,1fr);gap:22px}.adminSidebar,.adminPanel,.adminChartPanel,.adminKpi,.sidebarMiniCard,.paymentCard,.planCard,.storeManageCard,.flyerCard,.messageCard,.billingPanel,.messagePanelMini,.systemPanel,.messengerShell,.conversationList,.chatWindow{background:rgba(255,255,255,.95);border:1px solid #e0e6ef;box-shadow:0 16px 38px rgba(15,23,42,.055)}.adminSidebar{position:sticky;top:16px;height:calc(100vh - 32px);border-radius:26px;padding:18px;display:grid;grid-template-rows:auto auto auto auto;gap:18px;overflow:auto;background:linear-gradient(180deg,#071124 0%,#0b1530 100%);border-color:#17213a;color:#fff}.adminBrand{display:grid;gap:8px;justify-items:center}.adminBrand img{width:100%;max-height:88px;object-fit:contain;filter:drop-shadow(0 18px 35px rgba(111,63,245,.35))}.adminBrand strong{font-size:13px;letter-spacing:.22em;font-weight:1000;color:#aeb8cc}.adminNav{display:grid;gap:10px}.adminNavBtn{min-height:56px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.04);display:flex;align-items:center;gap:14px;padding:0 16px;color:#eaf0ff;text-align:left}.adminNavBtn.active,.adminNavBtn:hover{background:linear-gradient(135deg,#7c3aed,#5b21b6);border-color:rgba(255,255,255,.2);box-shadow:0 16px 30px rgba(93,33,182,.35)}.adminNavBtn span{width:28px;color:#cdd6ea;font-weight:950}.adminNavBtn b{font-size:15px;font-weight:950}.adminNavBtn em,.iconBadge b{margin-left:auto;min-width:27px;height:27px;border-radius:999px;background:#7c3aed;color:#fff;display:grid;place-items:center;padding:0 8px;font-size:12px;font-style:normal;font-weight:1000}.sidebarMiniCard{border-radius:20px;padding:18px;background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1);box-shadow:none}.sidebarMiniCard span,.sidebarMiniCard small{display:block;color:#b9c5dc;font-weight:850}.sidebarMiniCard strong{display:block;margin:8px 0;font-size:27px;font-weight:1000}.quickPanel{display:grid;gap:10px;border-top:1px solid rgba(255,255,255,.08);padding-top:18px}.quickPanel small{color:#aeb8cc;font-weight:1000;letter-spacing:.08em}.quickPanel button{min-height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-weight:900;text-align:left;padding:0 14px}.adminMain{min-width:0;display:grid;gap:20px}.adminTopbar{height:66px;border-radius:22px;border:1px solid #e2e8f0;background:rgba(255,255,255,.92);box-shadow:0 14px 34px rgba(15,23,42,.05);display:grid;grid-template-columns:46px 190px minmax(280px,1fr) 56px 112px;gap:14px;align-items:center;padding:10px 14px;position:sticky;top:10px;z-index:20;backdrop-filter:blur(18px)}.mobileMenu,.iconBadge,.refreshBtn,.softBtn,.filterBtn,.actionRow button,.fullSoftBtn,.storeManageTop button{min-height:44px;border-radius:14px;border:1px solid #e0e6ef;background:#fff;color:#111827;font-weight:950}.topTitle{display:grid}.topTitle strong{font-size:17px;font-weight:1000}.topTitle span{font-size:12px;color:#64748b;font-weight:850}.adminSearch{min-height:46px;border-radius:14px;border:1px solid #e0e6ef;background:#fff;display:flex;align-items:center;gap:12px;padding:0 16px;color:#64748b}.adminSearch input{width:100%;border:0;outline:0;background:transparent;font-size:15px;font-weight:800}.iconBadge{position:relative;font-size:20px}.iconBadge b{position:absolute;right:-8px;top:-8px}.adminHero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end}.eyebrow{color:#66758d;font-weight:1000;letter-spacing:.14em;font-size:13px}.adminHero h1{margin:8px 0 6px;font-size:48px;line-height:.95;font-weight:1000;letter-spacing:-.045em}.adminHero p{margin:0;color:#66758d;font-size:18px;font-weight:850;max-width:900px}.heroStatus{height:44px;border-radius:999px;background:#ecfdf3;color:#166534;border:1px solid #bbf7d0;font-weight:1000;display:flex;align-items:center;gap:9px;padding:0 16px}.heroStatus i{width:10px;height:10px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 6px rgba(34,197,94,.14)}.adminError,.adminSuccess{border-radius:18px;padding:15px 18px;font-weight:950}.adminError{border:1px solid #fecdd3;background:#fff1f2;color:#9f1239}.adminSuccess{border:1px solid #bbf7d0;background:#ecfdf3;color:#166534}.adminKpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}.adminKpi{min-height:132px;border-radius:22px;padding:20px;display:grid;grid-template-columns:62px minmax(0,1fr);gap:16px;align-items:center}.kpiIcon{width:62px;height:62px;border-radius:20px;display:grid;place-items:center;font-size:28px;font-weight:1000}.kpiIcon.purple{background:#ede9fe;color:#7c3aed}.kpiIcon.green{background:#dcfce7;color:#16a34a}.kpiIcon.blue{background:#dbeafe;color:#2563eb}.kpiIcon.orange{background:#ffedd5;color:#f97316}.kpiIcon.red{background:#ffe4e6;color:#e11d48}.adminKpi small,.adminKpi em{display:block;color:#66758d;font-style:normal;font-weight:850}.adminKpi strong{display:block;margin:7px 0 9px;font-size:29px;line-height:1;font-weight:1000}.dashboardGrid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(330px,.85fr) minmax(310px,.72fr);gap:18px;align-items:start}.adminPanel,.adminChartPanel,.billingPanel,.messagePanelMini,.systemPanel{border-radius:24px;padding:20px;min-width:0}.panelHeader{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.panelHeader h2{margin:0;font-size:22px;font-weight:1000}.panelHeader p{margin:6px 0 0;color:#66758d;font-weight:850}.panelHeader>b,.messagePanelMini h2 b{min-width:30px;height:30px;border-radius:999px;background:#ede9fe;color:#6d28d9;display:inline-grid;place-items:center;font-size:13px}.panelHeader>strong{font-size:26px;font-weight:1000;color:#16a34a}.chartShell{width:100%;min-height:290px;display:grid;grid-template-columns:64px minmax(0,1fr);gap:14px}.chartYAxis{display:flex;flex-direction:column;justify-content:space-between;padding:12px 0 34px;color:#66758d;font-size:13px;font-weight:900}.chartArea{min-width:0;display:grid;grid-template-rows:1fr auto;overflow:hidden}.chartSvg{width:100%;height:270px;display:block}.chartDays{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));text-align:center;color:#66758d;font-weight:900;font-size:13px;margin-top:8px}.billingDonut{display:grid;grid-template-columns:160px minmax(0,1fr);gap:18px;align-items:center}.donutRing{width:160px;height:160px;border-radius:999px;background:conic-gradient(#22c55e 0 62%,#f59e0b 62% 78%,#f43f5e 78% 90%,#cbd5e1 90% 100%);display:grid;place-items:center;position:relative}.donutRing:before{content:'';position:absolute;inset:28px;border-radius:999px;background:#fff}.donutRing strong,.donutRing span{position:relative;z-index:1}.donutRing strong{font-size:32px;font-weight:1000}.donutRing span{margin-top:42px;color:#66758d;font-weight:850;font-size:12px}.billingLegend{display:grid;gap:12px}.billingLegend div,.systemRows span{display:flex;align-items:center;gap:10px;color:#4b5563;font-weight:850}.billingLegend i,.systemRows i{width:10px;height:10px;border-radius:999px;background:#94a3b8}.billingLegend i.green,.systemRows i{background:#22c55e}.billingLegend i.orange{background:#f59e0b}.billingLegend i.red{background:#f43f5e}.billingLegend strong,.systemRows b{margin-left:auto;color:#111827}.fullSoftBtn,.primaryBtn{width:100%;min-height:48px;margin-top:18px;border-radius:14px;border:1px solid #e0e6ef;background:#fff;font-weight:1000}.primaryBtn{background:linear-gradient(135deg,#7c3aed,#5b21b6);border-color:#7c3aed;color:#fff}.miniMessages{display:grid;gap:8px}.miniMessages button{min-height:64px;border:0;background:#fff;border-bottom:1px solid #eef2f7;display:grid;grid-template-columns:42px minmax(0,1fr) 38px 8px;gap:10px;align-items:center;text-align:left}.miniMessages span,.conversationBtn span{width:42px;height:42px;border-radius:999px;background:#eef2ff;color:#3730a3;display:grid;place-items:center;font-weight:1000}.miniMessages strong,.conversationBtn strong{display:block;font-weight:1000}.miniMessages small,.conversationBtn small{display:block;color:#66758d;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.miniMessages em,.conversationBtn em{font-style:normal;color:#66758d;font-size:12px}.miniMessages b{width:8px;height:8px;border-radius:999px;background:#7c3aed}.systemRows{display:grid;gap:14px;margin-top:18px}.filterRow{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.filterBtn{padding:0 15px;font-size:13px}.filterBtn.active{background:#ede9fe;color:#6d28d9;border-color:#d8b4fe}.storeCards{display:grid;gap:14px}.storeManageCard{border-radius:22px;padding:18px;display:grid;gap:16px}.storeManageTop,.paymentTop,.flyerTop{display:flex;align-items:center;gap:12px;min-width:0}.storeManageTop img,.paymentTop img{width:58px;height:58px;object-fit:cover;border-radius:16px;border:1px solid #e6ebf2;background:#f8fafc}.storeManageTop strong,.paymentTop strong,.flyerTop strong{display:block;font-weight:1000;font-size:18px}.storeManageTop span,.storeManageTop small,.paymentTop span,.flyerTop span{display:block;margin-top:4px;color:#66758d;font-weight:800;word-break:break-word}.storeManageTop button{margin-left:auto;padding:0 13px}.storeManageGrid{display:grid;grid-template-columns:minmax(180px,1fr) minmax(160px,.9fr) minmax(180px,1fr) 150px repeat(6,minmax(96px,.6fr));gap:12px;align-items:end}.storeManageGrid label{display:grid;gap:8px;color:#66758d;font-weight:900}.storeManageGrid input,.storeManageGrid select,.messageInline input,.replyBox textarea{width:100%;min-height:44px;border:1px solid #e0e6ef;border-radius:13px;padding:0 12px;background:#fff;font-weight:850;color:#111827;outline:none}.storeManageGrid label small{color:#66758d}.metricBox{min-height:58px;border:1px solid #e8edf4;background:#fff;border-radius:14px;padding:10px 12px}.metricBox span{display:block;color:#66758d;font-weight:850;font-size:12px}.metricBox strong{display:block;margin-top:4px;font-weight:1000}.statusPill,.stripePill,.orderPill{min-height:36px;padding:0 12px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:1000;white-space:nowrap}.statusPill.active,.stripePill.ok,.orderPill.completed{background:#ecfdf3;color:#16a34a}.statusPill.paused,.orderPill.ready,.stripePill.warn{background:#fff7ed;color:#b45309}.statusPill.pastDue,.orderPill.new{background:#fff1f2;color:#be123c}.stripePill.off,.orderPill.cancelled{background:#f1f5f9;color:#66758d}.orderPill.progress{background:#eff6ff;color:#2563eb}.messageInline{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:10px}.messageInline button{border:0;border-radius:13px;background:#111827;color:#fff;font-weight:1000}.actionRow{display:flex;flex-wrap:wrap;gap:8px}.actionRow button{padding:0 12px;min-height:40px;font-size:13px}.emptyBox{border:1px dashed #dbe2ea;border-radius:18px;padding:24px;text-align:center;color:#66758d;font-size:15px;font-weight:850}.orderList{display:grid;gap:12px}.orderCard{min-height:84px;border-radius:18px;border:1px solid #e8edf4;background:#fff;display:grid;grid-template-columns:110px minmax(150px,.8fr) minmax(160px,.8fr) minmax(220px,1.2fr) 100px 130px 100px;gap:12px;align-items:center;padding:12px 14px}.orderCard span,.orderCard small{color:#66758d;font-weight:800}.orderCard b{font-weight:1000}.orderPill{font-style:normal}.flyerGrid,.paymentsGrid,.plansGrid,.settingsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.flyerCard,.paymentCard,.planCard{border-radius:22px;padding:18px}.flagIcon{width:50px;height:50px;display:grid;place-items:center;border-radius:14px;background:#ede9fe;color:#7c3aed;font-size:24px}.flyerStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.flyerStats div,.settingsGrid div{border:1px solid #e8edf4;background:#fff;border-radius:16px;padding:14px}.flyerStats span,.settingsGrid span{display:block;color:#66758d;font-weight:850;font-size:12px}.flyerStats strong,.settingsGrid strong{display:block;margin-top:6px;font-size:18px;font-weight:1000}.flyerCard p{color:#66758d;font-weight:800}.messengerShell{border-radius:26px;padding:0;display:grid;grid-template-columns:380px minmax(0,1fr);min-height:720px;overflow:hidden}.conversationList{border:0;border-right:1px solid #e0e6ef;border-radius:0;box-shadow:none;padding:18px;overflow:auto}.messageFilters{justify-content:flex-start;margin-bottom:14px}.conversationButtons{display:grid;gap:8px}.conversationBtn{min-height:74px;border:1px solid #edf1f6;background:#fff;border-radius:16px;display:grid;grid-template-columns:44px minmax(0,1fr) 42px 26px;gap:10px;align-items:center;text-align:left;padding:10px}.conversationBtn.active{border-color:#c4b5fd;background:#f5f3ff}.conversationBtn b{width:26px;height:26px;border-radius:999px;background:#ef4444;color:#fff;display:grid;place-items:center;font-size:12px}.chatWindow{border:0;border-radius:0;box-shadow:none;display:grid;grid-template-rows:auto 1fr auto;min-height:720px;background:linear-gradient(180deg,#fff,#fbfcff)}.chatHeader{min-height:82px;border-bottom:1px solid #e0e6ef;display:flex;align-items:center;gap:12px;padding:16px}.messageAvatar{width:54px;height:54px;border-radius:999px;display:grid;place-items:center;background:#eef2ff;color:#3730a3;font-weight:1000;flex-shrink:0}.chatHeader strong{display:block;font-size:18px;font-weight:1000}.chatHeader span{display:block;color:#66758d;font-weight:850}.chatHeader button{min-height:42px;border-radius:13px;border:1px solid #e0e6ef;background:#fff;font-weight:950;padding:0 14px;margin-left:auto}.chatHeader button+button{margin-left:0}.chatMessages{padding:20px;display:flex;flex-direction:column;gap:12px;overflow:auto}.chatBubble{max-width:76%;border-radius:20px;padding:14px 16px;border:1px solid #e0e6ef;background:#fff;box-shadow:0 10px 25px rgba(15,23,42,.045)}.chatBubble.admin{align-self:flex-end;background:linear-gradient(135deg,#7c3aed,#5b21b6);border-color:#7c3aed;color:#fff}.chatBubble.owner{align-self:flex-start}.chatBubble.system{align-self:center;background:#fff7ed;color:#9a3412}.chatBubble div{display:flex;justify-content:space-between;gap:12px}.chatBubble strong{font-weight:1000}.chatBubble small{opacity:.75;font-weight:850}.chatBubble em{display:block;margin-top:8px;font-style:normal;font-weight:1000}.chatBubble p{margin:8px 0 0;font-weight:750;line-height:1.45}.replyBox{border-top:1px solid #e0e6ef;padding:16px;display:grid;grid-template-columns:minmax(0,1fr) 140px;gap:12px;background:#fff}.replyBox textarea{min-height:72px;padding:14px;resize:vertical;line-height:1.4}.replyBox button{border:0;border-radius:14px;background:#111827;color:#fff;font-weight:1000}.stripeRows{display:grid;gap:10px;margin:16px 0}.stripeRows div{display:flex;justify-content:space-between;gap:12px;color:#66758d;font-weight:850}.stripeRows b{color:#111827}.planCard span{color:#66758d;font-weight:1000;text-transform:uppercase;letter-spacing:.06em}.planCard strong{display:block;margin-top:8px;font-size:38px;font-weight:1000}.planCard p{color:#66758d;font-weight:850;line-height:1.45}.planCard ul{margin:14px 0 0;padding:0;list-style:none;display:grid;gap:8px;font-weight:850}@media(max-width:1600px){.adminKpis{grid-template-columns:repeat(3,minmax(0,1fr))}.dashboardGrid{grid-template-columns:1fr 1fr}.messagePanelMini{grid-column:span 2}.storeManageGrid{grid-template-columns:1fr 1fr 1fr 150px repeat(3,minmax(110px,.7fr))}.storeManageGrid .stripePill,.storeManageGrid .statusPill{min-height:44px}}@media(max-width:1250px){.adminPage{grid-template-columns:1fr}.adminSidebar{position:fixed;left:12px;top:12px;bottom:12px;width:292px;height:auto;z-index:80;transform:translateX(-110%);transition:transform .2s ease}.adminSidebar.open{transform:translateX(0)}.adminTopbar{grid-template-columns:46px 150px minmax(0,1fr) 56px 100px}.dashboardGrid,.messengerShell{grid-template-columns:1fr}.messagePanelMini{grid-column:auto}.adminKpis,.flyerGrid,.paymentsGrid,.plansGrid,.settingsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.storeManageGrid,.orderCard{grid-template-columns:1fr 1fr}.orderCard>*{min-width:0}.conversationList{border-right:0;border-bottom:1px solid #e0e6ef}.chatWindow{min-height:620px}}@media(max-width:760px){.adminPage{padding:10px}.adminTopbar{height:auto;grid-template-columns:44px minmax(0,1fr) 50px;gap:10px}.adminSearch{grid-column:1/4}.refreshBtn{display:none}.adminHero{grid-template-columns:1fr}.adminHero h1{font-size:39px}.adminHero p{font-size:16px}.adminKpis,.flyerGrid,.paymentsGrid,.plansGrid,.settingsGrid,.storeManageGrid,.orderCard,.billingDonut{grid-template-columns:1fr}.adminPanel,.adminChartPanel,.billingPanel,.messagePanelMini,.systemPanel{padding:16px}.panelHeader{display:grid}.filterRow{justify-content:flex-start}.chartShell{grid-template-columns:1fr}.chartYAxis{display:none}.chartSvg{height:240px}.flyerStats{grid-template-columns:1fr}.actionRow button{flex:1 1 auto}.storeManageTop{display:grid}.storeManageTop button{margin-left:0}.messageInline,.replyBox{grid-template-columns:1fr}.chatHeader{display:grid}.chatHeader button{margin-left:0}.chatBubble{max-width:94%}.messengerShell{min-height:auto}.conversationBtn{grid-template-columns:44px minmax(0,1fr) 34px}.conversationBtn b{grid-column:1/4}.adminSidebar{width:min(92vw,292px)}}
`;
