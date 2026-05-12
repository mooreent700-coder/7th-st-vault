'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';
type OrderStatus = 'new' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
type OrderTab = 'NEW' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'ALL';
type WorkerNav = 'orders' | 'messages' | 'status' | 'timeclock' | 'help';
type WorkerRole = 'manager' | 'cashier' | 'kitchen' | 'runner' | 'worker';
type AccessState = 'checking' | 'signed_out' | 'no_access' | 'ready';
type TimeStatus = 'working' | 'on_lunch' | 'clocked_out';

type StoreRecord = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  name: string | null;
  slug: string | null;
  phone?: string | null;
  address?: string | null;
  logo_image?: string | null;
  hero_image?: string | null;
  owner_language?: string | null;
  order_language?: string | null;
  storefront_language?: string | null;
  pickup_enabled?: boolean | null;
  delivery_enabled?: boolean | null;
  hours?: unknown;
};

type WorkerRecord = {
  id?: string | null;
  restaurant_id?: string | null;
  owner_id?: string | null;
  worker_email?: string | null;
  worker_name?: string | null;
  role?: string | null;
  active?: boolean | null;
  created_at?: string | null;
};

type WorkerTimeLogRow = {
  id: string;
  restaurant_id?: string | null;
  worker_id?: string | null;
  worker_email?: string | null;
  worker_name?: string | null;
  clock_in_at?: string | null;
  lunch_start_at?: string | null;
  lunch_end_at?: string | null;
  clock_out_at?: string | null;
  status?: TimeStatus | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type OrderRow = {
  id: string;
  restaurant_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  order_type?: string | null;
  fulfillment_type?: string | null;
  type?: string | null;
  delivery_address?: string | null;
  customer_address?: string | null;
  notes?: string | null;
  customer_notes?: string | null;
  status?: string | null;
  total?: number | null;
  amount_total?: number | null;
  subtotal?: number | null;
  delivery_fee?: number | null;
  discount?: number | null;
  items_summary?: string | null;
  owner_items_summary?: string | null;
  customer_items_summary?: string | null;
  items?: unknown;
  order_items?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id?: string | null;
  name?: string | null;
  image_url?: string | null;
  image?: string | null;
  image_file?: string | null;
  item_image?: string | null;
};

type MessageRow = {
  id: string;
  restaurant_id?: string | null;
  owner_id?: string | null;
  store_name?: string | null;
  subject?: string | null;
  message?: string | null;
  admin_reply?: string | null;
  reply?: string | null;
  status?: string | null;
  read_by_owner?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const OWNER_LANG_KEY = 'orda_owner_language';
const WORKER_LANG_KEY = 'orda_worker_language';
const BUCKET = 'menu-images';
const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=85';
const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1400&q=85';
const SIGN_IN_PATH = '/sign-in';

const COPY = {
  en: {
    loading:'Loading worker dashboard...',
    noAccess:'Worker access was not found for this account.',
    noAccessSub:'The owner must add this worker email to the worker access list and connect it to the store.',
    signInRequired:'Worker sign in required.',
    signInSub:'Sign in with the worker email approved by the owner for this store.',
    signIn:'Sign In',
    dashboard:'Worker Dashboard',
    shift:'Shift Mode',
    live:'Live',
    orders:'Orders',
    messages:'Messages',
    storeStatus:'Store Status',
    help:'Help',
    timeClock:'Time Clock',
    clockIn:'Clock In',
    clockOut:'Clock Out',
    startLunch:'Start Lunch',
    endLunch:'End Lunch',
    working:'Working',
    onLunch:'On Lunch',
    clockedOut:'Clocked Out',
    notClockedIn:'Not clocked in',
    clockInTime:'Clock In Time',
    lunchStart:'Lunch Start',
    lunchEnd:'Lunch End',
    clockOutTime:'Clock Out Time',
    todayShift:'Today Shift',
    timeUpdated:'Time clock updated.',
    timeError:'Could not update time clock.',
    new:'New',
    preparing:'Preparing',
    ready:'Ready',
    completed:'Completed',
    all:'All',
    cancelled:'Cancelled',
    pickup:'Pickup',
    delivery:'Delivery',
    customer:'Customer',
    address:'Address',
    notes:'Notes',
    noNotes:'No notes',
    noPhone:'No phone',
    noAddress:'No address',
    noOrders:'No orders in this section.',
    noMessages:'No messages yet.',
    noSummary:'No order summary yet',
    accept:'Accept Order',
    markReady:'Mark Ready',
    complete:'Complete Order',
    cancel:'Cancel',
    updating:'Updating...',
    total:'Total',
    received:'Received',
    liveOrders:'Live Orders',
    today:'Today',
    newOrders:'New Orders',
    readyOrders:'Ready Orders',
    completedToday:'Completed Today',
    search:'Search customer, phone, item, order number...',
    viewStore:'View Store',
    signOut:'Sign Out',
    worker:'Worker',
    role:'Role',
    storeOpen:'Store is online',
    pickupEnabled:'Pickup enabled',
    deliveryEnabled:'Delivery enabled',
    supportTitle:'Message ORDA Admin',
    supportSub:'Use this if an order, login, customer, or dashboard issue needs help.',
    subject:'Subject',
    message:'Explain the issue...',
    send:'Send Message',
    sending:'Sending...',
    sent:'Message sent.',
    required:'Add a subject and message first.',
    errorLoad:'Could not load worker dashboard.',
    errorUpdate:'Could not update this order.',
    errorSupport:'Could not send support message.',
    justNow:'just now',
    minAgo:'min ago',
    hrAgo:'hr ago',
    dayAgo:'day ago'
  },
  es: {
    loading:'Cargando panel del trabajador...',
    noAccess:'No se encontró acceso de trabajador para esta cuenta.',
    noAccessSub:'El dueño debe agregar este email de trabajador a la lista de trabajadores y conectarlo a la tienda.',
    signInRequired:'El trabajador debe iniciar sesión.',
    signInSub:'Inicia sesión con el email de trabajador aprobado por el dueño.',
    signIn:'Iniciar Sesión',
    dashboard:'Panel de Trabajador',
    shift:'Modo Turno',
    live:'En Vivo',
    orders:'Pedidos',
    messages:'Mensajes',
    storeStatus:'Estado de Tienda',
    help:'Ayuda',
    timeClock:'Reloj',
    clockIn:'Entrada',
    clockOut:'Salida',
    startLunch:'Iniciar Lonche',
    endLunch:'Terminar Lonche',
    working:'Trabajando',
    onLunch:'En Lonche',
    clockedOut:'Salió',
    notClockedIn:'No ha entrado',
    clockInTime:'Hora Entrada',
    lunchStart:'Inicio Lonche',
    lunchEnd:'Fin Lonche',
    clockOutTime:'Hora Salida',
    todayShift:'Turno de Hoy',
    timeUpdated:'Reloj actualizado.',
    timeError:'No se pudo actualizar el reloj.',
    new:'Nuevo',
    preparing:'Preparando',
    ready:'Listo',
    completed:'Completado',
    all:'Todo',
    cancelled:'Cancelado',
    pickup:'Recoger',
    delivery:'Entrega',
    customer:'Cliente',
    address:'Dirección',
    notes:'Notas',
    noNotes:'Sin notas',
    noPhone:'Sin teléfono',
    noAddress:'Sin dirección',
    noOrders:'No hay pedidos en esta sección.',
    noMessages:'Todavía no hay mensajes.',
    noSummary:'Todavía no hay resumen',
    accept:'Aceptar Pedido',
    markReady:'Marcar Listo',
    complete:'Completar Pedido',
    cancel:'Cancelar',
    updating:'Actualizando...',
    total:'Total',
    received:'Recibido',
    liveOrders:'Pedidos en Vivo',
    today:'Hoy',
    newOrders:'Pedidos Nuevos',
    readyOrders:'Pedidos Listos',
    completedToday:'Completados Hoy',
    search:'Buscar cliente, teléfono, producto, orden...',
    viewStore:'Ver Tienda',
    signOut:'Salir',
    worker:'Trabajador',
    role:'Rol',
    storeOpen:'La tienda está en línea',
    pickupEnabled:'Pickup activo',
    deliveryEnabled:'Entrega activa',
    supportTitle:'Mensaje a ORDA Admin',
    supportSub:'Usa esto si un pedido, login, cliente o panel necesita ayuda.',
    subject:'Asunto',
    message:'Explica el problema...',
    send:'Enviar Mensaje',
    sending:'Enviando...',
    sent:'Mensaje enviado.',
    required:'Agrega asunto y mensaje primero.',
    errorLoad:'No se pudo cargar el panel.',
    errorUpdate:'No se pudo actualizar este pedido.',
    errorSupport:'No se pudo enviar el mensaje.',
    justNow:'ahora',
    minAgo:'min atrás',
    hrAgo:'hr atrás',
    dayAgo:'día atrás'
  },
};

function isLang(value?: string | null): value is Lang {
  return value === 'en' || value === 'es';
}

function getSavedLanguage(): Lang {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(WORKER_LANG_KEY) || window.localStorage.getItem(OWNER_LANG_KEY) || window.localStorage.getItem('orda_language');
  return isLang(saved) ? saved : 'en';
}

function saveLanguage(lang: Lang) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WORKER_LANG_KEY, lang);
  window.localStorage.setItem(OWNER_LANG_KEY, lang);
  window.localStorage.setItem('orda_language', lang);
  document.cookie = `orda_worker_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
}

function money(value?: number | null) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pretty(value?: string | null) {
  return String(value || '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}

function cleanSlug(value?: string | null) {
  return String(value || 'store').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'store';
}

function getStoreName(store: StoreRecord | null) {
  return store?.name?.trim() || 'ORDA Store';
}

function getWorkerName(worker: WorkerRecord | null, email?: string | null) {
  return worker?.worker_name?.trim() || email?.split('@')[0] || 'Worker';
}

function getWorkerEmail(worker: WorkerRecord | null, fallback?: string | null) {
  return worker?.worker_email?.trim().toLowerCase() || fallback?.trim().toLowerCase() || '';
}

function getWorkerRole(worker: WorkerRecord | null): WorkerRole {
  const raw = String(worker?.role || 'worker').toLowerCase();
  if (raw.includes('manager')) return 'manager';
  if (raw.includes('cashier')) return 'cashier';
  if (raw.includes('kitchen') || raw.includes('cook') || raw.includes('chef')) return 'kitchen';
  if (raw.includes('runner') || raw.includes('driver')) return 'runner';
  return 'worker';
}

function getStoreUrl(store: StoreRecord | null) {
  const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
  return `${base}/store/${cleanSlug(store?.slug || store?.name)}`;
}

function cleanDisplayUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function getImageUrl(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw;
  const path = raw.replace(/^menu-images\//, '').replace(/^\/+/, '');
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function getHeroImage(store: StoreRecord | null, menuItems: MenuItemRow[]) {
  const hero = getImageUrl(store?.hero_image);
  if (hero) return hero;
  const item = menuItems.find(row => row.image_url || row.image || row.image_file || row.item_image);
  return getImageUrl(item?.image_url || item?.image || item?.image_file || item?.item_image) || DEFAULT_HERO_IMAGE;
}

function getLogoImage(store: StoreRecord | null) {
  return getImageUrl(store?.logo_image) || '/orda-logo.png';
}

function getOrderAmount(order: OrderRow) {
  return Number(order.total ?? order.amount_total ?? 0);
}

function getOrderType(order: OrderRow): 'pickup' | 'delivery' {
  const raw = String(order.order_type || order.fulfillment_type || order.type || '').toLowerCase();
  return raw.includes('deliver') ? 'delivery' : 'pickup';
}

function getStatusKey(status?: string | null): OrderStatus {
  const raw = String(status || '').toLowerCase();
  if (raw.includes('cancel') || raw.includes('decline')) return 'cancelled';
  if (raw.includes('complete') || raw.includes('done')) return 'completed';
  if (raw.includes('ready')) return 'ready';
  if (raw.includes('progress') || raw.includes('accept') || raw.includes('prep') || raw.includes('working')) return 'in_progress';
  return 'new';
}

function getStatusText(status: string | null | undefined, t: typeof COPY.en) {
  const key = getStatusKey(status);
  if (key === 'in_progress') return t.preparing;
  if (key === 'ready') return t.ready;
  if (key === 'completed') return t.completed;
  if (key === 'cancelled') return t.cancelled;
  return t.new;
}

function statusMatchesTab(status: string | null | undefined, tab: OrderTab) {
  const key = getStatusKey(status);
  return tab === 'ALL' || (tab === 'NEW' && key === 'new') || (tab === 'IN_PROGRESS' && key === 'in_progress') || (tab === 'READY' && key === 'ready') || (tab === 'COMPLETED' && key === 'completed');
}

function nextStatusFor(status?: string | null): { value: OrderStatus; labelKey: 'accept' | 'markReady' | 'complete' } | null {
  const key = getStatusKey(status);
  if (key === 'new') return { value: 'in_progress', labelKey: 'accept' };
  if (key === 'in_progress') return { value: 'ready', labelKey: 'markReady' };
  if (key === 'ready') return { value: 'completed', labelKey: 'complete' };
  return null;
}

function normalizeOrderSummary(order: OrderRow, t: typeof COPY.en) {
  if (order.owner_items_summary?.trim()) return order.owner_items_summary.trim();
  if (order.items_summary?.trim()) return order.items_summary.trim();
  if (order.customer_items_summary?.trim()) return order.customer_items_summary.trim();
  const source = order.items ?? order.order_items;
  if (Array.isArray(source)) {
    const text = source.map((item: any) => {
      if (!item) return '';
      const quantity = Number(item.quantity ?? item.qty ?? 1);
      const name = item.name ?? item.item_name ?? item.title ?? item.menu_item_name ?? item.menu_items?.name ?? 'Item';
      const options = Array.isArray(item.options) ? ` (${item.options.join(', ')})` : '';
      return `${quantity}x ${name}${options}`;
    }).filter(Boolean).join(' · ');
    if (text) return text;
  }
  if (typeof source === 'string' && source.trim()) return source.trim();
  return t.noSummary;
}

function getOrderImage(order: OrderRow, menuItems: MenuItemRow[]) {
  const summary = normalizeOrderSummary(order, COPY.en).toLowerCase();
  const match = menuItems.find(item => item.name && summary.includes(item.name.toLowerCase()) && (item.image_url || item.image || item.image_file || item.item_image));
  const fallback = menuItems.find(item => item.image_url || item.image || item.image_file || item.item_image);
  return getImageUrl(match?.image_url || match?.image || match?.image_file || match?.item_image) || getImageUrl(fallback?.image_url || fallback?.image || fallback?.image_file || fallback?.item_image) || DEFAULT_FOOD_IMAGE;
}

function isToday(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function minutesAgo(value?: string | null, t = COPY.en) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return `${minutes} ${t.minAgo}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${t.hrAgo}`;
  return `${Math.floor(hours / 24)} ${t.dayAgo}`;
}

function getShiftDayKey() {
  return new Date().toDateString();
}

function timeOnly(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function statusClass(status?: string | null) {
  return `statusPill ${getStatusKey(status)}`;
}

function isLogFromToday(log: WorkerTimeLogRow | null) {
  if (!log?.created_at && !log?.clock_in_at) return false;
  const d = new Date(log.clock_in_at || log.created_at || '');
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function getTimeStatus(log: WorkerTimeLogRow | null, t: typeof COPY.en) {
  if (!log?.clock_in_at) return t.notClockedIn;
  if (log.status === 'on_lunch') return t.onLunch;
  if (log.status === 'clocked_out' || log.clock_out_at) return t.clockedOut;
  return t.working;
}

async function tryFindWorkerStore(userId: string, email?: string | null): Promise<{ store: StoreRecord | null; worker: WorkerRecord | null }> {
  const workerEmail = String(email || '').trim().toLowerCase();
  if (!workerEmail) return { store: null, worker: null };

  try {
    const { data: workerRows } = await supabase
      .from('restaurant_workers')
      .select('*')
      .eq('worker_email', workerEmail)
      .eq('active', true)
      .limit(1);

    const worker = Array.isArray(workerRows) ? (workerRows[0] as WorkerRecord | undefined) : null;

    if (worker?.restaurant_id) {
      const { data: store } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', worker.restaurant_id)
        .maybeSingle();

      if (store) return { store: store as StoreRecord, worker };
    }
  } catch {}

  try {
    const { data: ownedRows } = await supabase
      .from('restaurants')
      .select('*')
      .or(`owner_id.eq.${userId},user_id.eq.${userId}`)
      .limit(1);

    if (Array.isArray(ownedRows) && ownedRows[0]) {
      return {
        store: ownedRows[0] as StoreRecord,
        worker: {
          id: userId,
          restaurant_id: ownedRows[0].id,
          worker_email: workerEmail,
          role: 'manager',
          worker_name: 'Owner / Manager',
          active: true
        }
      };
    }
  } catch {}

  return { store: null, worker: null };
}

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const t = COPY[lang];
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState<AccessState>('checking');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [worker, setWorker] = useState<WorkerRecord | null>(null);
  const [timeLog, setTimeLog] = useState<WorkerTimeLogRow | null>(null);
  const [updatingTime, setUpdatingTime] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [activeTab, setActiveTab] = useState<OrderTab>('NEW');
  const [activeNav, setActiveNav] = useState<WorkerNav>('orders');
  const [search, setSearch] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const saved = getSavedLanguage();
    setLang(saved);
    saveLanguage(saved);
  }, []);

  const loadOrders = useCallback(async (restaurantId: string) => {
    const { data, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(150);

    if (orderError) throw orderError;
    return (data || []) as OrderRow[];
  }, []);

  const loadMenuItems = useCallback(async (restaurantId: string) => {
    try {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .limit(150);

      return (data || []) as MenuItemRow[];
    } catch {
      return [];
    }
  }, []);

  const loadMessages = useCallback(async (restaurantId: string) => {
    try {
      const { data } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(30);

      return (data || []) as MessageRow[];
    } catch {
      return [];
    }
  }, []);

  const loadTodayTimeLog = useCallback(async (restaurantId: string, workerRecord: WorkerRecord | null, email?: string | null) => {
    const workerEmail = getWorkerEmail(workerRecord, email);
    if (!workerEmail) return null;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    try {
      const { data, error } = await supabase
        .from('worker_time_logs')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('worker_email', workerEmail)
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return (Array.isArray(data) && data[0] ? data[0] : null) as WorkerTimeLogRow | null;
    } catch {
      return null;
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    let cancelled = false;

    try {
      setLoading(true);
      setAccessState('checking');
      setError('');

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData.user;

      if (!user) {
        if (!cancelled) {
          setStore(null);
          setWorker(null);
          setCurrentUserEmail(null);
          setAccessState('signed_out');
        }
        return;
      }

      setCurrentUserEmail(user.email || null);

      const found = await tryFindWorkerStore(user.id, user.email || null);

      if (cancelled) return;

      if (!found.store?.id) {
        setStore(null);
        setWorker(null);
        setAccessState('no_access');
        return;
      }

      setStore(found.store);
      setWorker(found.worker);
      setAccessState('ready');

      const dbLang = found.store.order_language || found.store.owner_language || found.store.storefront_language;
      if (isLang(dbLang)) {
        setLang(dbLang);
        saveLanguage(dbLang);
      }

      const [nextOrders, nextItems, nextMessages, nextTimeLog] = await Promise.all([
        loadOrders(found.store.id),
        loadMenuItems(found.store.id),
        loadMessages(found.store.id),
        loadTodayTimeLog(found.store.id, found.worker, user.email || null),
      ]);

      if (cancelled) return;

      setOrders(nextOrders);
      setMenuItems(nextItems);
      setMessages(nextMessages);
      setTimeLog(nextTimeLog);
    } catch (err: any) {
      if (!cancelled) {
        setAccessState('no_access');
        setError(err?.message || COPY[getSavedLanguage()].errorLoad);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [loadMenuItems, loadMessages, loadOrders, loadTodayTimeLog]);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (active) await loadDashboard();
    })();
    return () => {
      active = false;
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!store?.id || accessState !== 'ready') return;

    const orderChannel = supabase
      .channel(`worker-orders-${store.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${store.id}` }, async () => {
        try {
          setOrders(await loadOrders(store.id));
        } catch {}
      })
      .subscribe();

    const messageChannel = supabase
      .channel(`worker-messages-${store.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages', filter: `restaurant_id=eq.${store.id}` }, async () => {
        setMessages(await loadMessages(store.id));
      })
      .subscribe();

    const timeChannel = supabase
      .channel(`worker-time-${store.id}-${getWorkerEmail(worker, currentUserEmail)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_time_logs', filter: `restaurant_id=eq.${store.id}` }, async () => {
        setTimeLog(await loadTodayTimeLog(store.id, worker, currentUserEmail));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(orderChannel);
      void supabase.removeChannel(messageChannel);
      void supabase.removeChannel(timeChannel);
    };
  }, [accessState, currentUserEmail, loadMessages, loadOrders, loadTodayTimeLog, store?.id, worker]);


  useEffect(() => {
    if (!store?.id || accessState !== 'ready') return;

    let live = true;
    let currentDay = getShiftDayKey();

    async function refreshWorkerLiveData() {
      if (!store?.id || !live) return;

      const nextDay = getShiftDayKey();
      const dayChanged = nextDay !== currentDay;

      try {
        const [nextOrders, nextMessages, nextTimeLog] = await Promise.all([
          loadOrders(store.id),
          loadMessages(store.id),
          loadTodayTimeLog(store.id, worker, currentUserEmail),
        ]);

        if (!live) return;

        setOrders(nextOrders);
        setMessages(nextMessages);
        setTimeLog(nextTimeLog);

        if (dayChanged) {
          currentDay = nextDay;
          setActiveTab('NEW');
          setSearch('');
          setSuccess('');
          setError('');
        }
      } catch {}
    }

    const timer = window.setInterval(refreshWorkerLiveData, 60000);
    const midnightTimer = window.setInterval(() => {
      const nextDay = getShiftDayKey();
      if (nextDay !== currentDay) {
        currentDay = nextDay;
        void refreshWorkerLiveData();
      }
    }, 300000);

    return () => {
      live = false;
      window.clearInterval(timer);
      window.clearInterval(midnightTimer);
    };
  }, [
    accessState,
    currentUserEmail,
    loadMessages,
    loadOrders,
    loadTodayTimeLog,
    store?.id,
    worker
  ]);

  function changeLanguage(next: Lang) {
    setLang(next);
    saveLanguage(next);
  }

  function goToSignIn() {
    router.push(SIGN_IN_PATH);
  }

  async function updateTimeClock(action: 'clock_in' | 'lunch_start' | 'lunch_end' | 'clock_out') {
    if (!store?.id || !worker) return;

    const workerEmail = getWorkerEmail(worker, currentUserEmail);
    const workerName = getWorkerName(worker, currentUserEmail);
    const now = new Date().toISOString();

    if (!workerEmail) {
      setError(t.noAccess);
      return;
    }

    try {
      setUpdatingTime(true);
      setError('');
      setSuccess('');

      let currentLog = todaysTimeLog;

      if (!currentLog || action === 'clock_in') {
        const payload = {
          restaurant_id: store.id,
          worker_id: worker.id || null,
          worker_email: workerEmail,
          worker_name: workerName,
          clock_in_at: now,
          lunch_start_at: null,
          lunch_end_at: null,
          clock_out_at: null,
          status: 'working',
        };

        const { data, error: insertError } = await supabase
          .from('worker_time_logs')
          .insert(payload)
          .select('*')
          .maybeSingle();

        if (insertError) throw insertError;
        currentLog = data as WorkerTimeLogRow;
      } else {
        const patch: Partial<WorkerTimeLogRow> = { updated_at: now };

        if (action === 'lunch_start') {
          patch.lunch_start_at = now;
          patch.status = 'on_lunch';
        }

        if (action === 'lunch_end') {
          patch.lunch_end_at = now;
          patch.status = 'working';
        }

        if (action === 'clock_out') {
          patch.clock_out_at = now;
          patch.status = 'clocked_out';
        }

        const { data, error: updateError } = await supabase
          .from('worker_time_logs')
          .update(patch)
          .eq('id', currentLog.id)
          .select('*')
          .maybeSingle();

        if (updateError) throw updateError;
        currentLog = data as WorkerTimeLogRow;
      }

      setTimeLog(currentLog);
      setSuccess(t.timeUpdated);
      window.setTimeout(() => setSuccess(''), 2200);
    } catch (err: any) {
      setError(err?.message || t.timeError);
    } finally {
      setUpdatingTime(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      setUpdatingOrderId(orderId);
      setError('');

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrders(current => current.map(order => order.id === orderId ? { ...order, status } : order));
    } catch (err: any) {
      setError(err?.message || t.errorUpdate);
    } finally {
      setUpdatingOrderId('');
    }
  }

  async function sendSupportMessage() {
    if (!store?.id) return;

    const subject = supportSubject.trim();
    const message = supportMessage.trim();

    if (!subject || !message) {
      setError(t.required);
      return;
    }

    try {
      setSendingSupport(true);
      setSupportSent(false);
      setError('');

      const workerName = getWorkerName(worker, currentUserEmail);

      const { error: insertError } = await supabase
        .from('admin_messages')
        .insert({
          restaurant_id: store.id,
          owner_id: store.owner_id || store.user_id || worker?.owner_id || null,
          store_name: getStoreName(store),
          subject: `[Worker] ${subject}`,
          message: `${workerName}: ${message}`,
          status: 'new',
          read_by_owner: false
        });

      if (insertError) throw insertError;

      setSupportSubject('');
      setSupportMessage('');
      setSupportSent(true);
      setMessages(await loadMessages(store.id));
      window.setTimeout(() => setSupportSent(false), 2800);
    } catch (err: any) {
      setError(err?.message || t.errorSupport);
    } finally {
      setSendingSupport(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setStore(null);
    setWorker(null);
    setAccessState('signed_out');
    router.push(SIGN_IN_PATH);
  }

  const storeName = useMemo(() => getStoreName(store), [store]);
  const storeUrl = useMemo(() => getStoreUrl(store), [store]);
  const heroImage = useMemo(() => getHeroImage(store, menuItems), [store, menuItems]);
  const logoImage = useMemo(() => getLogoImage(store), [store]);
  const workerName = useMemo(() => getWorkerName(worker, currentUserEmail), [worker, currentUserEmail]);
  const workerRole = useMemo(() => getWorkerRole(worker), [worker]);
  const todaysTimeLog = useMemo(() => isLogFromToday(timeLog) ? timeLog : null, [timeLog]);
  const timeStatus = useMemo(() => getTimeStatus(todaysTimeLog, t), [todaysTimeLog, t]);

  const searchedOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter(order => {
      const summary = normalizeOrderSummary(order, t).toLowerCase();
      return order.id.toLowerCase().includes(query) ||
        String(order.customer_name || '').toLowerCase().includes(query) ||
        String(order.customer_phone || '').toLowerCase().includes(query) ||
        summary.includes(query);
    });
  }, [orders, search, t]);

  const filteredOrders = useMemo(() => searchedOrders.filter(order => statusMatchesTab(order.status, activeTab)), [searchedOrders, activeTab]);
  const newOrders = useMemo(() => orders.filter(order => getStatusKey(order.status) === 'new').length, [orders]);
  const preparingOrders = useMemo(() => orders.filter(order => getStatusKey(order.status) === 'in_progress').length, [orders]);
  const readyOrders = useMemo(() => orders.filter(order => getStatusKey(order.status) === 'ready').length, [orders]);
  const completedToday = useMemo(() => orders.filter(order => getStatusKey(order.status) === 'completed' && isToday(order.created_at)).length, [orders]);

  const tabCounts: Record<OrderTab, number> = {
    NEW: newOrders,
    IN_PROGRESS: preparingOrders,
    READY: readyOrders,
    COMPLETED: orders.filter(order => getStatusKey(order.status) === 'completed').length,
    ALL: orders.length
  };

  const activeOrdersForColumn = useMemo(() => ({
    new: searchedOrders.filter(order => getStatusKey(order.status) === 'new').slice(0, 14),
    in_progress: searchedOrders.filter(order => getStatusKey(order.status) === 'in_progress').slice(0, 14),
    ready: searchedOrders.filter(order => getStatusKey(order.status) === 'ready').slice(0, 14),
    completed: searchedOrders.filter(order => getStatusKey(order.status) === 'completed').slice(0, 14)
  }), [searchedOrders]);

  const canClockIn = !todaysTimeLog?.clock_in_at || !!todaysTimeLog?.clock_out_at;
  const canStartLunch = !!todaysTimeLog?.clock_in_at && !todaysTimeLog?.lunch_start_at && !todaysTimeLog?.clock_out_at;
  const canEndLunch = !!todaysTimeLog?.lunch_start_at && !todaysTimeLog?.lunch_end_at && !todaysTimeLog?.clock_out_at;
  const canClockOut = !!todaysTimeLog?.clock_in_at && !todaysTimeLog?.clock_out_at && !canEndLunch;

  const OrderCard = ({ order, compact = false }: { order: OrderRow; compact?: boolean }) => {
    const status = getStatusKey(order.status);
    const next = nextStatusFor(order.status);
    const orderType = getOrderType(order);
    const deliveryAddress = order.delivery_address || order.customer_address || '';
    const notes = order.notes || order.customer_notes || '';
    const image = getOrderImage(order, menuItems);

    return (
      <article className={`workerOrderCard ${status} ${compact ? 'compact' : ''}`}>
        <div className="orderImageWrap">
          <img src={image} alt="Order" onError={event => { event.currentTarget.src = DEFAULT_FOOD_IMAGE; }} />
          <span className={orderType === 'delivery' ? 'typeBadge delivery' : 'typeBadge pickup'}>{orderType === 'delivery' ? t.delivery : t.pickup}</span>
        </div>

        <div className="orderMain">
          <div className="orderTopLine">
            <strong>#ORD-{order.id.slice(0, 5).toUpperCase()}</strong>
            <span className={statusClass(order.status)}>{getStatusText(order.status, t)}</span>
          </div>

          <div className="customerLine">
            <b>{order.customer_name || t.customer}</b>
            <span>{order.customer_phone || t.noPhone}</span>
          </div>

          <p className="summaryText">{normalizeOrderSummary(order, t)}</p>

          {!compact ? (
            <div className="orderDetailsGrid">
              <span><small>{t.received}</small><b>{timeOnly(order.created_at)} · {minutesAgo(order.created_at, t)}</b></span>
              <span><small>{t.total}</small><b>{money(getOrderAmount(order))}</b></span>
              <span><small>{t.address}</small><b>{orderType === 'delivery' ? deliveryAddress || t.noAddress : t.pickup}</b></span>
              <span><small>{t.notes}</small><b>{notes || t.noNotes}</b></span>
            </div>
          ) : null}

          <div className="orderActions">
            {next ? (
              <button type="button" className="primaryAction" disabled={updatingOrderId === order.id} onClick={() => updateOrderStatus(order.id, next.value)}>
                {updatingOrderId === order.id ? t.updating : t[next.labelKey]}
              </button>
            ) : (
              <button type="button" className="secondaryAction" onClick={() => setActiveTab('ALL')}>{t.completed}</button>
            )}

            {status !== 'completed' && status !== 'cancelled' ? (
              <button type="button" className="dangerAction" disabled={updatingOrderId === order.id} onClick={() => updateOrderStatus(order.id, 'cancelled')}>{t.cancel}</button>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  const TimeClockPanel = () => (
    <article className="infoPanel timeClockPanel" id="timeclock">
      <div className="timeClockHeader">
        <div>
          <h3>{t.timeClock}</h3>
          <p>{t.todayShift} · Owner sees these times live</p>
        </div>
        <span className={`timeStatus ${String(timeLog?.status || '').replace('_', '-') || 'none'}`}>{timeStatus}</span>
      </div>

      <div className="timeGrid">
        <span><small>{t.clockInTime}</small><b>{timeOnly(todaysTimeLog?.clock_in_at)}</b></span>
        <span><small>{t.lunchStart}</small><b>{timeOnly(todaysTimeLog?.lunch_start_at)}</b></span>
        <span><small>{t.lunchEnd}</small><b>{timeOnly(todaysTimeLog?.lunch_end_at)}</b></span>
        <span><small>{t.clockOutTime}</small><b>{timeOnly(todaysTimeLog?.clock_out_at)}</b></span>
      </div>

      <div className="timeActions">
        <button type="button" className="clockInBtn" disabled={updatingTime || !canClockIn} onClick={() => updateTimeClock('clock_in')}>{t.clockIn}</button>
        <button type="button" className="lunchBtn" disabled={updatingTime || !canStartLunch} onClick={() => updateTimeClock('lunch_start')}>{t.startLunch}</button>
        <button type="button" className="lunchBtn" disabled={updatingTime || !canEndLunch} onClick={() => updateTimeClock('lunch_end')}>{t.endLunch}</button>
        <button type="button" className="clockOutBtn" disabled={updatingTime || !canClockOut} onClick={() => updateTimeClock('clock_out')}>{t.clockOut}</button>
      </div>
    </article>
  );

  if (loading) {
    return (
      <main className="workerPage loadingPage">
        <section className="loadingCard">{t.loading}</section>
        <style jsx global>{workerStyles}</style>
      </main>
    );
  }

  if (accessState === 'signed_out') {
    return (
      <main className="workerPage accessPage">
        <section className="accessCard">
          <img src="/orda-logo.png" alt="ORDA" />
          <h1>{t.dashboard}</h1>
          <p>{t.signInRequired}</p>
          <small>{t.signInSub}</small>
          <button type="button" onClick={goToSignIn}>{t.signIn}</button>
        </section>
        <style jsx global>{workerStyles}</style>
      </main>
    );
  }

  if (accessState === 'no_access' || !store) {
    return (
      <main className="workerPage accessPage">
        <section className="accessCard">
          <img src="/orda-logo.png" alt="ORDA" />
          <h1>{t.dashboard}</h1>
          <p>{error || t.noAccess}</p>
          <small>{t.noAccessSub}</small>
          <div className="accessActions">
            <button type="button" onClick={goToSignIn}>{t.signIn}</button>
            <button type="button" className="lightAccessBtn" onClick={signOut}>{t.signOut}</button>
          </div>
        </section>
        <style jsx global>{workerStyles}</style>
      </main>
    );
  }

  return (
    <main className="workerPage">
      <header className="workerTopbar">
        <div className="brandSide">
          <img src="/orda-logo.png" alt="ORDA" />
          <div>
            <small>{t.shift}</small>
            <strong>{t.dashboard}</strong>
          </div>
        </div>

        <div className="topActions">
          <div className="langSwitch">
            <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}>EN</button>
            <button type="button" className={lang === 'es' ? 'active' : ''} onClick={() => changeLanguage('es')}>ES</button>
          </div>
          <button type="button" className="storeViewBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>{t.viewStore} ↗</button>
          <button type="button" className="signOutBtn" onClick={signOut}>{t.signOut}</button>
        </div>
      </header>

      <section className="workerHero" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,7,12,.94), rgba(5,7,12,.76) 48%, rgba(5,7,12,.28)), url(${heroImage})` }}>
        <div className="heroLeft">
          <img src={logoImage} alt={storeName} onError={event => { event.currentTarget.src = '/orda-logo.png'; }} />
          <div>
            <span className="livePill"><i /> {t.live}</span>
            <h1>{storeName}</h1>
            <p>{cleanDisplayUrl(storeUrl)}</p>
          </div>
        </div>

        <div className="workerIdentity">
          <small>{t.worker}</small>
          <strong>{workerName}</strong>
          <span>{t.role}: {pretty(workerRole)}</span>
          <em>{t.timeClock}: {timeStatus}</em>
        </div>
      </section>

      {error ? <div className="errorBanner">{error}</div> : null}
      {success ? <div className="successBanner">{success}</div> : null}

      <section className="workerKpis">
        <article><span>{t.newOrders}</span><strong>{newOrders}</strong><em>{t.liveOrders}</em></article>
        <article><span>{t.preparing}</span><strong>{preparingOrders}</strong><em>{t.updating}</em></article>
        <article><span>{t.readyOrders}</span><strong>{readyOrders}</strong><em>{t.ready}</em></article>
        <article><span>{t.timeClock}</span><strong>{timeStatus}</strong><em>{timeOnly(todaysTimeLog?.clock_in_at)}</em></article>
      </section>

      <section className="searchSection">
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder={t.search} />
      </section>

      <section className="mobileTimeClock">
        <TimeClockPanel />
      </section>

      <section className="mobileTabs">
        {([['NEW', t.new], ['IN_PROGRESS', t.preparing], ['READY', t.ready], ['COMPLETED', t.completed], ['ALL', t.all]] as [OrderTab, string][]).map(([tab, label]) => (
          <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            <span>{label}</span>
            <b>{tabCounts[tab]}</b>
          </button>
        ))}
      </section>

      <section className="mobileOrderList">
        {filteredOrders.length ? filteredOrders.map(order => <OrderCard key={order.id} order={order} />) : <div className="emptyState">{t.noOrders}</div>}
      </section>

      <section className="desktopBoard">
        <div className="boardColumn new">
          <header><h2>{t.new}</h2><b>{newOrders}</b></header>
          {activeOrdersForColumn.new.length ? activeOrdersForColumn.new.map(order => <OrderCard key={order.id} order={order} compact />) : <div className="emptyState">{t.noOrders}</div>}
        </div>

        <div className="boardColumn inProgress">
          <header><h2>{t.preparing}</h2><b>{preparingOrders}</b></header>
          {activeOrdersForColumn.in_progress.length ? activeOrdersForColumn.in_progress.map(order => <OrderCard key={order.id} order={order} compact />) : <div className="emptyState">{t.noOrders}</div>}
        </div>

        <div className="boardColumn ready">
          <header><h2>{t.ready}</h2><b>{readyOrders}</b></header>
          {activeOrdersForColumn.ready.length ? activeOrdersForColumn.ready.map(order => <OrderCard key={order.id} order={order} compact />) : <div className="emptyState">{t.noOrders}</div>}
        </div>

        <div className="boardColumn completed">
          <header><h2>{t.completed}</h2><b>{tabCounts.COMPLETED}</b></header>
          {activeOrdersForColumn.completed.length ? activeOrdersForColumn.completed.map(order => <OrderCard key={order.id} order={order} compact />) : <div className="emptyState">{t.noOrders}</div>}
        </div>
      </section>

      <section className="workerBottomPanels">
        <TimeClockPanel />

        <article className="infoPanel" id="status">
          <h3>{t.storeStatus}</h3>
          <p><i className="greenDot" /> {t.storeOpen}</p>
          <div className="storeFacts">
            <span>{store.pickup_enabled === false ? '✕' : '✓'} {t.pickupEnabled}</span>
            <span>{store.delivery_enabled ? '✓' : '✕'} {t.deliveryEnabled}</span>
            <span>{store.phone || t.noPhone}</span>
            <span>{store.address || t.noAddress}</span>
          </div>
        </article>

        <article className="infoPanel" id="messages">
          <h3>{t.messages}</h3>
          <div className="messageList">
            {messages.length ? messages.slice(0, 5).map(message => (
              <div className="messageBubble" key={message.id}>
                <strong>{message.subject || t.messages}</strong>
                <small>{minutesAgo(message.created_at, t)}</small>
                <p>{message.message}</p>
                {message.admin_reply || message.reply ? <em>{message.admin_reply || message.reply}</em> : null}
              </div>
            )) : <div className="emptyState">{t.noMessages}</div>}
          </div>
        </article>

        <article className="infoPanel supportPanel" id="help">
          <h3>{t.supportTitle}</h3>
          <p>{t.supportSub}</p>
          <input value={supportSubject} onChange={event => setSupportSubject(event.target.value)} placeholder={t.subject} />
          <textarea value={supportMessage} onChange={event => setSupportMessage(event.target.value)} placeholder={t.message} />
          {supportSent ? <div className="sentBox">{t.sent}</div> : null}
          <button type="button" disabled={sendingSupport} onClick={sendSupportMessage}>{sendingSupport ? t.sending : t.send}</button>
        </article>
      </section>

      <nav className="workerMobileNav">
        <button type="button" className={activeNav === 'orders' ? 'active' : ''} onClick={() => { setActiveNav('orders'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>☰<span>{t.orders}</span>{newOrders ? <b>{newOrders}</b> : null}</button>
        <button type="button" className={activeNav === 'timeclock' ? 'active' : ''} onClick={() => { setActiveNav('timeclock'); document.getElementById('timeclock')?.scrollIntoView({ behavior: 'smooth' }); }}>◷<span>{t.timeClock}</span></button>
        <button type="button" className={activeNav === 'messages' ? 'active' : ''} onClick={() => { setActiveNav('messages'); document.getElementById('messages')?.scrollIntoView({ behavior: 'smooth' }); }}>✉<span>{t.messages}</span></button>
        <button type="button" className={activeNav === 'help' ? 'active' : ''} onClick={() => { setActiveNav('help'); document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' }); }}>?<span>{t.help}</span></button>
      </nav>

      <style jsx global>{workerStyles}</style>
    </main>
  );
}

const workerStyles = `
:root{color-scheme:light}*{box-sizing:border-box}html,body{margin:0;background:#f4f6fa;color:#0b0f17;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-x:hidden}button,input,textarea{font-family:inherit}button{cursor:pointer}button:disabled{opacity:.56;cursor:not-allowed}.workerPage{min-height:100vh;background:radial-gradient(circle at top,#ffffff 0,#f4f6fa 42%,#e9eef7 100%);padding:14px 14px 110px}.loadingPage,.accessPage{display:grid;place-items:center;padding:24px}.loadingCard,.accessCard{width:min(100%,640px);background:#fff;border:1px solid #dfe5ee;border-radius:28px;box-shadow:0 28px 90px rgba(15,23,42,.14);padding:26px;text-align:center;font-weight:1000}.accessCard img{width:210px;max-width:80%;display:block;margin:0 auto 12px}.accessCard h1{margin:0 0 8px;font-size:34px;letter-spacing:-.05em}.accessCard p{color:#111827;font-weight:950;margin:8px 0}.accessCard small{display:block;color:#64748b;font-weight:850;line-height:1.45;margin:0 auto 18px;max-width:440px}.accessCard button{height:52px;border:0;border-radius:14px;background:#111827;color:#fff;font-weight:1000;padding:0 20px}.accessActions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}.accessCard .lightAccessBtn{background:#fff;color:#111827;border:1px solid #dfe5ee}.workerTopbar{height:72px;position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(18px);border:1px solid #dfe5ee;border-radius:22px;box-shadow:0 12px 34px rgba(15,23,42,.06);display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 14px;margin-bottom:14px}.brandSide{display:flex;align-items:center;gap:12px;min-width:0}.brandSide img{width:90px;height:auto}.brandSide small{display:block;color:#64748b;font-size:11px;font-weight:1000;letter-spacing:.14em}.brandSide strong{display:block;font-size:17px;font-weight:1000}.topActions{display:flex;align-items:center;gap:8px}.langSwitch{display:grid;grid-template-columns:1fr 1fr;gap:4px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;padding:4px}.langSwitch button{border:0;border-radius:10px;background:#f1f5f9;font-size:12px;font-weight:1000;width:42px;height:34px}.langSwitch button.active{background:#111827;color:#fff}.storeViewBtn,.signOutBtn{height:42px;border-radius:13px;font-weight:1000;padding:0 14px}.storeViewBtn{border:0;background:#111827;color:#fff}.signOutBtn{border:1px solid #e5e7eb;background:#fff;color:#111827}.workerHero{min-height:250px;border-radius:28px;background-size:cover;background-position:center;border:1px solid rgba(255,255,255,.4);box-shadow:0 28px 80px rgba(15,23,42,.16);padding:24px;display:flex;justify-content:space-between;gap:18px;align-items:flex-end;color:#fff;overflow:hidden}.heroLeft{display:flex;align-items:center;gap:16px;min-width:0}.heroLeft>img{width:90px;height:90px;border-radius:24px;background:#fff;object-fit:cover;border:3px solid rgba(255,255,255,.8);box-shadow:0 18px 45px rgba(0,0,0,.32)}.livePill{display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,.16);border:1px solid rgba(134,239,172,.44);color:#bbf7d0;border-radius:999px;padding:8px 12px;font-weight:1000}.livePill i,.greenDot{width:10px;height:10px;border-radius:999px;background:#22c55e;display:inline-block;box-shadow:0 0 0 5px rgba(34,197,94,.16)}.heroLeft h1{font-size:clamp(36px,6vw,72px);letter-spacing:-.07em;line-height:.9;margin:10px 0 8px;font-weight:1000;text-transform:uppercase}.heroLeft p{margin:0;color:#dbeafe;font-weight:900}.workerIdentity{min-width:230px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(14px);border-radius:22px;padding:18px;text-align:right}.workerIdentity small{display:block;color:#cbd5e1;font-weight:1000;text-transform:uppercase;letter-spacing:.12em}.workerIdentity strong{display:block;font-size:24px;font-weight:1000;margin-top:6px}.workerIdentity span,.workerIdentity em{display:block;color:#e2e8f0;font-weight:900;margin-top:4px;font-style:normal}.errorBanner{margin:14px 0;padding:14px 16px;background:#fff1f2;color:#be123c;border:1px solid #fecdd3;border-radius:16px;font-weight:950}.successBanner{margin:14px 0;padding:14px 16px;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;border-radius:16px;font-weight:950}.workerKpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}.workerKpis article{background:#fff;border:1px solid #dfe5ee;border-radius:22px;padding:18px;box-shadow:0 14px 36px rgba(15,23,42,.055)}.workerKpis span{display:block;color:#64748b;font-weight:950;font-size:13px}.workerKpis strong{display:block;font-size:26px;letter-spacing:-.05em;margin-top:8px;font-weight:1000}.workerKpis em{display:block;font-style:normal;color:#16a34a;font-weight:900;margin-top:8px;font-size:13px}.searchSection{margin-top:14px}.searchSection input{width:100%;height:58px;border:1px solid #dfe5ee;border-radius:18px;background:#fff;padding:0 18px;font-size:16px;font-weight:850;outline:none;box-shadow:0 12px 28px rgba(15,23,42,.045)}.mobileTimeClock{margin-top:14px}.mobileTabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:14px;position:sticky;top:86px;z-index:40}.mobileTabs button{min-height:54px;border:1px solid #dfe5ee;border-radius:16px;background:rgba(255,255,255,.94);display:grid;place-items:center;gap:2px;font-weight:1000;color:#475569;box-shadow:0 8px 22px rgba(15,23,42,.04)}.mobileTabs button.active{background:#111827;color:#fff;border-color:#111827}.mobileTabs span{font-size:12px}.mobileTabs b{font-size:16px}.mobileOrderList{display:grid;gap:12px;margin-top:14px}.workerOrderCard{background:#fff;border:1px solid #dfe5ee;border-radius:22px;box-shadow:0 14px 38px rgba(15,23,42,.065);overflow:hidden;display:grid;grid-template-columns:150px minmax(0,1fr);position:relative}.workerOrderCard:before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px}.workerOrderCard.new:before{background:#f97316}.workerOrderCard.in_progress:before{background:#2563eb}.workerOrderCard.ready:before{background:#16a34a}.workerOrderCard.completed:before{background:#64748b}.workerOrderCard.cancelled:before{background:#ef4444}.orderImageWrap{position:relative;min-height:170px;background:#111}.orderImageWrap img{width:100%;height:100%;object-fit:cover;display:block}.typeBadge{position:absolute;left:12px;top:12px;border-radius:999px;padding:7px 10px;color:#fff;font-size:12px;font-weight:1000;box-shadow:0 8px 20px rgba(0,0,0,.22)}.typeBadge.pickup{background:#111827}.typeBadge.delivery{background:#2563eb}.orderMain{padding:16px;min-width:0}.orderTopLine{display:flex;justify-content:space-between;align-items:center;gap:10px}.orderTopLine strong{font-size:20px;font-weight:1000;letter-spacing:-.03em}.statusPill{height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:0 12px;font-size:12px;font-weight:1000;white-space:nowrap}.statusPill.new{background:#fff7ed;color:#c2410c}.statusPill.in_progress{background:#eff6ff;color:#2563eb}.statusPill.ready{background:#dcfce7;color:#15803d}.statusPill.completed{background:#f1f5f9;color:#475569}.statusPill.cancelled{background:#fee2e2;color:#b91c1c}.customerLine{display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap}.customerLine b{font-size:17px}.customerLine span{color:#64748b;font-weight:850}.summaryText{margin:12px 0;color:#1f2937;font-weight:850;line-height:1.42}.orderDetailsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.orderDetailsGrid span{border:1px solid #e5e7eb;background:#f8fafc;border-radius:14px;padding:10px;min-width:0}.orderDetailsGrid small{display:block;color:#64748b;font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:.08em}.orderDetailsGrid b{display:block;color:#111827;font-size:13px;margin-top:4px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.orderActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.primaryAction,.secondaryAction,.dangerAction{height:46px;border-radius:14px;font-weight:1000;padding:0 16px}.primaryAction{border:0;background:#111827;color:#fff;box-shadow:0 12px 26px rgba(15,23,42,.18)}.secondaryAction{border:1px solid #dfe5ee;background:#f8fafc;color:#111827}.dangerAction{border:1px solid #fecdd3;background:#fff1f2;color:#be123c}.desktopBoard{display:none;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px;align-items:start}.boardColumn{background:rgba(255,255,255,.75);border:1px solid #dfe5ee;border-radius:24px;padding:12px;min-height:440px;display:grid;gap:10px;align-content:start}.boardColumn header{display:flex;justify-content:space-between;align-items:center;padding:8px 8px 12px}.boardColumn h2{margin:0;font-size:18px;font-weight:1000}.boardColumn header b{min-width:32px;height:32px;border-radius:999px;background:#111827;color:#fff;display:grid;place-items:center}.workerOrderCard.compact{grid-template-columns:1fr;border-radius:18px}.workerOrderCard.compact .orderImageWrap{min-height:110px}.workerOrderCard.compact .orderTopLine{align-items:flex-start}.workerOrderCard.compact .orderTopLine strong{font-size:16px}.workerOrderCard.compact .summaryText{font-size:13px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.workerOrderCard.compact .orderDetailsGrid{display:none}.workerOrderCard.compact .customerLine{font-size:13px}.workerOrderCard.compact .primaryAction,.workerOrderCard.compact .secondaryAction,.workerOrderCard.compact .dangerAction{height:40px;font-size:13px;padding:0 12px}.emptyState{border:1px dashed #cbd5e1;background:rgba(255,255,255,.72);color:#64748b;border-radius:18px;padding:24px;text-align:center;font-weight:900}.workerBottomPanels{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;margin-top:16px}.infoPanel{background:#fff;border:1px solid #dfe5ee;border-radius:24px;box-shadow:0 14px 36px rgba(15,23,42,.055);padding:18px}.infoPanel h3{margin:0 0 10px;font-size:20px;font-weight:1000}.infoPanel p{color:#475569;font-weight:850;line-height:1.45}.storeFacts{display:grid;gap:8px;margin-top:12px}.storeFacts span{background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:12px;font-weight:900;color:#111827}.messageList{display:grid;gap:10px}.messageBubble{border:1px solid #e5e7eb;background:#f8fafc;border-radius:16px;padding:12px}.messageBubble strong{display:block;font-size:14px}.messageBubble small{display:block;color:#64748b;font-weight:850;margin-top:3px}.messageBubble p{margin:8px 0 0;color:#334155;font-weight:750;line-height:1.35}.messageBubble em{display:block;margin-top:10px;background:#fff;border-radius:12px;padding:10px;color:#111827;font-style:normal;font-weight:850}.supportPanel input,.supportPanel textarea{width:100%;border:1px solid #dfe5ee;background:#fff;border-radius:14px;padding:0 14px;font-size:15px;font-weight:850;outline:none;margin-top:10px}.supportPanel input{height:52px}.supportPanel textarea{min-height:128px;padding-top:14px;resize:vertical;line-height:1.4}.supportPanel button{width:100%;height:52px;border:0;border-radius:14px;background:#111827;color:#fff;font-weight:1000;margin-top:12px}.sentBox{margin-top:10px;padding:12px;border-radius:14px;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;font-weight:1000}.timeClockPanel{scroll-margin-top:90px}.timeClockHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.timeClockHeader p{margin:0;color:#64748b}.timeStatus{border-radius:999px;padding:8px 12px;background:#f1f5f9;color:#475569;font-size:12px;font-weight:1000;white-space:nowrap}.timeStatus.working{background:#dcfce7;color:#166534}.timeStatus.on-lunch{background:#fef3c7;color:#92400e}.timeStatus.clocked-out{background:#fee2e2;color:#991b1b}.timeGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:16px}.timeGrid span{border:1px solid #e5e7eb;background:#f8fafc;border-radius:14px;padding:12px}.timeGrid small{display:block;color:#64748b;font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:.08em}.timeGrid b{display:block;margin-top:5px;font-size:15px;font-weight:1000;color:#111827}.timeActions{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:16px}.timeActions button{height:50px;border-radius:14px;font-weight:1000}.clockInBtn{border:0;background:#16a34a;color:#fff}.lunchBtn{border:1px solid #f59e0b;background:#fffbeb;color:#92400e}.clockOutBtn{border:0;background:#111827;color:#fff}.workerMobileNav{position:fixed;left:0;right:0;bottom:0;height:88px;background:rgba(255,255,255,.96);border-top:1px solid #dfe5ee;backdrop-filter:blur(18px);z-index:70;display:grid;grid-template-columns:repeat(4,1fr);padding:8px 8px 12px;box-shadow:0 -18px 45px rgba(15,23,42,.08)}.workerMobileNav button{border:0;background:transparent;position:relative;display:grid;place-items:center;align-content:center;gap:4px;color:#64748b;font-size:22px;font-weight:1000}.workerMobileNav button.active{color:#111827}.workerMobileNav span{font-size:12px}.workerMobileNav b{position:absolute;top:4px;right:22%;min-width:21px;height:21px;background:#ef4444;color:#fff;border-radius:999px;display:grid;place-items:center;font-size:11px;padding:0 6px}@media(min-width:1100px){.workerPage{padding:18px 18px 42px}.mobileTabs,.mobileOrderList,.workerMobileNav,.mobileTimeClock{display:none}.desktopBoard{display:grid}.workerTopbar{border-radius:26px}.searchSection input{height:64px}.workerBottomPanels{padding-bottom:20px}}@media(max-width:1300px){.workerBottomPanels{grid-template-columns:1fr 1fr}}@media(max-width:900px){.topActions{gap:6px}.storeViewBtn,.signOutBtn{display:none}.brandSide img{width:78px}.workerHero{min-height:300px;align-items:flex-start;display:grid}.heroLeft{align-items:flex-start}.heroLeft>img{width:76px;height:76px;border-radius:20px}.workerIdentity{text-align:left;min-width:0;width:100%}.workerKpis{grid-template-columns:repeat(2,minmax(0,1fr))}.workerBottomPanels{grid-template-columns:1fr}.workerOrderCard{grid-template-columns:112px minmax(0,1fr)}.orderImageWrap{min-height:100%}.orderDetailsGrid{grid-template-columns:1fr}.orderTopLine{display:grid}.statusPill{justify-self:start}.summaryText{font-size:14px}.orderActions{display:grid;grid-template-columns:1fr 104px}.primaryAction,.secondaryAction,.dangerAction{height:48px;padding:0 10px}.mobileTabs{overflow-x:auto;scrollbar-width:none}.mobileTabs::-webkit-scrollbar{display:none}.mobileTabs button{min-width:92px}}@media(max-width:520px){.workerPage{padding-left:10px;padding-right:10px}.workerTopbar{height:66px;border-radius:18px}.brandSide strong{font-size:15px}.brandSide small{font-size:9px}.langSwitch button{width:35px}.workerHero{border-radius:22px;padding:18px}.heroLeft{display:grid}.heroLeft h1{font-size:34px}.workerKpis{gap:8px}.workerKpis article{padding:14px;border-radius:18px}.workerKpis strong{font-size:24px}.mobileTabs{top:78px}.workerOrderCard{grid-template-columns:1fr}.orderImageWrap{height:170px}.orderMain{padding:14px}.customerLine{display:grid;gap:3px}.orderActions{grid-template-columns:1fr}.dangerAction{height:42px}.workerBottomPanels{gap:10px}.infoPanel{border-radius:20px}.timeGrid,.timeActions{grid-template-columns:1fr}}
`;
