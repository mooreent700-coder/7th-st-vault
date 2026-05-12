'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';
type StoreRecord = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  name: string | null;
  phone?: string | null;
  slug: string | null;
  plan?: string | null;
  address?: string | null;
  logo_image?: string | null;
  hero_image?: string | null;
  flyer_image?: string | null;
  flyer_preview?: string | null;
  owner_language?: string | null;
  order_language?: string | null;
  storefront_language?: string | null;
  stripe_account_id?: string | null;
  stripe_connected?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  terms_accepted?: boolean | null;
  owner_terms_accepted?: boolean | null;
  agreement_accepted?: boolean | null;
  terms_accepted_at?: string | null;
  owner_terms_accepted_at?: string | null;
  agreement_accepted_at?: string | null;
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
  name?: string | null;
  image_url?: string | null;
  image?: string | null;
  image_file?: string | null;
  item_image?: string | null;
};

type AdminMessageRow = {
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

type WorkerRole = 'manager' | 'cashier' | 'kitchen' | 'runner' | 'worker';

type RestaurantWorkerRow = {
  id: string;
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
  status?: 'working' | 'on_lunch' | 'clocked_out' | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type OrderFilterKey = 'ALL' | 'NEW' | 'IN_PROGRESS' | 'READY' | 'DONE';
type OwnerAction = 'accept' | 'ready' | 'complete' | 'cancel';
type StripeState = 'connected' | 'incomplete' | 'not_connected';
type NavTarget = 'dashboard' | 'orders' | 'builder' | 'flyers' | 'support' | 'workers' | 'timecabinet' | 'more';

const OWNER_LANG_KEY = 'orda_owner_language';
const TERMS_LOCAL_KEY = 'orda_owner_terms_accepted';
const BUCKET = 'menu-images';
const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=85';
const DEFAULT_FLYER_IMAGE = 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1000&q=85';

const COPY = {
  en: {
    loading:'Loading owner dashboard...', errorLoad:'Could not load owner dashboard.', dashboard:'Dashboard', storeSettings:'Store Settings', rewards:'Rewards', smsCampaigns:'SMS Campaigns', analytics:'Analytics', customerCrm:'Customers', promos:'Promotions', liveOrders:'Live Orders', menuBuilder:'Builder', connectStripe:'Connect Stripe', stripeConnected:'Stripe Connected', customers:'Customers', marketing:'Flyers', new:'New', openStorefront:'View Store', manageStripe:'Manage Stripe', welcome:'Welcome back, Owner! 👋', todaySubtitle:"Here's what's happening with your store today.", storeLive:'Store Live', openUntil:'Open until 11:00 PM', editStore:'Edit Store', todayGlance:'Today at a glance', today:'Today', searchPlaceholder:'Search orders, customers, items...', openBuilder:'Open Builder', viewStore:'View Store', todaysSales:'Total Sales', todaysOrders:'New Orders', newOrders:'New Orders', completionRate:'Completion Rate', storeViews:'Store Views', stripe:'Stripe', connected:'Connected', payoutsEnabled:'Payouts enabled', liveToday:'↗ Live today', noOrdersToday:'No orders today yet', thisWeekActive:'↗ This week active', noWeeklySales:'No weekly sales yet', needsAction:'Needs action', noNewOrders:'No new orders right now', ordersUpdating:'↗ Orders updating live', noOrderHistory:'No order history yet', viewAllOrders:'View all orders', viewFullAnalytics:'View full analytics', all:'All', inProgress:'In Progress', almostReady:'Almost Ready', completed:'Completed', cancelled:'Cancelled', accept:'Accept Order', markReady:'Mark Ready', complete:'Complete', decline:'Decline', cancel:'Cancel', updating:'Updating...', viewDetails:'View Details', noOrdersYet:'No orders yet.', salesOverview:'Sales Overview', weeklyLiveView:'↗ Live this week', thisWeek:'This Week', topItems:'Top Items', noTopItems:'No top-item data yet.', sold:'sold', storeStatus:'Store Status', liveOnline:'Your store is live and online', stripeStatus:'Stripe Status', finishSetup:'Finish Setup', connect:'Connect Stripe', account:'Account', charges:'Charges', payouts:'Payouts', notConnected:'Not connected', enabled:'Enabled', boostSales:'Boost your sales', flyerText:'Create real food flyers your customers can scan and order from.', createFlyers:'Flyers', customerActivity:'Live customer activity from real orders', uniqueCustomers:'Unique Customers', totalOrders:'Total Orders', quickActions:'Quick Actions', buildMenu:'Builder', editMenu:'Design your store', manageIncoming:'Manage incoming', menuItemsAction:'Menu', manageItems:'Manage items', promoteStore:'Create & manage', seeLooks:'View customers', connectPayouts:'Connect payouts', storefrontLink:'Your Storefront Link', shareStore:'Share your store with customers', copied:'✓', copy:'⧉', live:'Live', language:'Language', justNow:'Just now', minAgo:'min ago', hrAgo:'hr ago', dayAgo:'day ago', noSummary:'No order summary yet', noPhone:'No phone added', customer:'Customer', accountNotReturned:'Stripe onboarding link was not returned.', stripeLinkError:'Could not create Stripe onboarding link.', connectStripeError:'Could not connect Stripe.', updateOrderError:'Could not update order.', supportTitle:'Support Center', supportSub:'Message ORDA admin directly from your dashboard if anything goes wrong with your account.', supportSubject:'Subject', supportMessage:'Explain your issue...', supportSend:'Send Message', supportSending:'Sending...', supportSent:'✓ Message sent to ORDA admin', supportRequired:'Please fill out the support subject and message.', supportError:'Could not send support message.', notifications:'Notifications', messages:'Messages', noMessages:'No support messages yet.', unreadMessages:'Unread Messages', markRead:'Mark Read', adminReply:'Admin Reply', ownerMessage:'Owner Message', workers:'Workers', addWorker:'Add Worker', workerName:'Worker name', workerEmail:'Worker email', workerRole:'Worker role', workerLogin:'Worker login', workerLoginLink:'Worker login link', active:'Active', inactive:'Inactive', deactivate:'Deactivate', savingWorker:'Saving worker...', noWorkers:'No workers added yet.', workerRequired:'Worker name and email are required.', workerAdded:'Worker added.', workerError:'Could not save worker.', workerDeactivateError:'Could not deactivate worker.', manager:'Manager', cashier:'Cashier', kitchen:'Kitchen', runner:'Runner', worker:'Worker', copyLogin:'Copy worker login', manageStaff:'Manage staff', staffAccess:'Staff access', timeClock:'Time Clock', clockIn:'Clock In', clockOut:'Clock Out', lunchStart:'Lunch Start', lunchEnd:'Lunch End', working:'Working', onLunch:'On Lunch', clockedOut:'Clocked Out', noTimeLog:'No time log yet', timeCabinet:'Time Cabinet', workerHistory:'Worker History', selectWorker:'Select worker', selectRange:'Select range', todayRange:'Today', weekRange:'This Week', monthRange:'This Month', allRange:'All', totalHours:'Total Hours', daysWorked:'Days Worked', missedClockOut:'Missed Clock Out', noHistory:'No time history yet', hoursWorked:'Hours Worked', termsTitle:'ORDA Owner Agreement', termsSubtitle:'Before you enter your owner dashboard, accept the platform agreement so your store, orders, Stripe tools, builder, flyers, and support center are protected.', terms1:'I understand ORDA is a direct-order platform for my restaurant, food truck, catering, or pop-up business.', terms2:'I am responsible for accurate menu items, prices, taxes, availability, pickup/delivery settings, customer communication, and order fulfillment.', terms3:'I agree not to upload illegal, harmful, stolen, misleading, or third-party content I do not have rights to use.', terms4:'I understand Stripe handles payment onboarding and payouts, and my Stripe status must be complete before live card payments can work.', terms5:'I understand ORDA may update tools, dashboards, flyers, analytics, and ordering features to keep the platform working properly.', termsCheck:'I have read and agree to the ORDA Owner Agreement.', termsAccept:'Accept Agreement & Continue', termsAccepting:'Saving agreement...', termsRequired:'Check the agreement box to continue.'
  },
  es: {
    loading:'Cargando panel del dueño...', errorLoad:'No se pudo cargar el panel.', dashboard:'Panel', storeSettings:'Configuración', rewards:'Recompensas', smsCampaigns:'Campañas SMS', analytics:'Analíticas', customerCrm:'Clientes', promos:'Promociones', liveOrders:'Pedidos en Vivo', menuBuilder:'Builder', connectStripe:'Conectar Stripe', stripeConnected:'Stripe Conectado', customers:'Clientes', marketing:'Flyers', new:'Nuevo', openStorefront:'Ver Tienda', manageStripe:'Manejar Stripe', welcome:'Bienvenido, Dueño! 👋', todaySubtitle:'Esto está pasando con tu tienda hoy.', storeLive:'Tienda Activa', openUntil:'Abierto hasta 11:00 PM', editStore:'Editar Tienda', todayGlance:'Resumen de hoy', today:'Hoy', searchPlaceholder:'Buscar pedidos, clientes, productos...', openBuilder:'Abrir Builder', viewStore:'Ver Tienda', todaysSales:'Ventas Totales', todaysOrders:'Pedidos Nuevos', newOrders:'Pedidos Nuevos', completionRate:'Tasa Completada', storeViews:'Visitas', stripe:'Stripe', connected:'Conectado', payoutsEnabled:'Depósitos activos', liveToday:'↗ Activo hoy', noOrdersToday:'Todavía no hay pedidos hoy', thisWeekActive:'↗ Semana activa', noWeeklySales:'Todavía no hay ventas esta semana', needsAction:'Necesita acción', noNewOrders:'No hay pedidos nuevos ahora', ordersUpdating:'↗ Pedidos actualizando en vivo', noOrderHistory:'Todavía no hay historial', viewAllOrders:'Ver todos', viewFullAnalytics:'Ver analíticas', all:'Todo', inProgress:'En Proceso', almostReady:'Casi Listo', completed:'Completado', cancelled:'Cancelado', accept:'Aceptar Pedido', markReady:'Marcar Listo', complete:'Completar', decline:'Rechazar', cancel:'Cancelar', updating:'Actualizando...', viewDetails:'Ver Detalles', noOrdersYet:'Todavía no hay pedidos.', salesOverview:'Resumen de Ventas', weeklyLiveView:'↗ Activo esta semana', thisWeek:'Esta Semana', topItems:'Más Vendidos', noTopItems:'Todavía no hay datos.', sold:'vendidos', storeStatus:'Estado de Tienda', liveOnline:'Tu tienda está activa y en línea', stripeStatus:'Estado de Stripe', finishSetup:'Terminar Setup', connect:'Conectar Stripe', account:'Cuenta', charges:'Cobros', payouts:'Depósitos', notConnected:'No conectado', enabled:'Activo', boostSales:'Impulsa tus ventas', flyerText:'Crea flyers reales de comida para que tus clientes ordenen.', createFlyers:'Flyers', customerActivity:'Actividad de clientes desde pedidos reales', uniqueCustomers:'Clientes Únicos', totalOrders:'Pedidos Totales', quickActions:'Acciones Rápidas', buildMenu:'Builder', editMenu:'Diseña tu tienda', manageIncoming:'Maneja pedidos', menuItemsAction:'Menú', manageItems:'Maneja productos', promoteStore:'Crear y manejar', seeLooks:'Ver clientes', connectPayouts:'Conectar depósitos', storefrontLink:'Enlace de tu Tienda', shareStore:'Comparte tu tienda con clientes', copied:'✓', copy:'⧉', live:'Activa', language:'Idioma', justNow:'Ahora mismo', minAgo:'min atrás', hrAgo:'hr atrás', dayAgo:'día atrás', noSummary:'Todavía no hay resumen', noPhone:'Sin teléfono', customer:'Cliente', accountNotReturned:'No se recibió el enlace de Stripe.', stripeLinkError:'No se pudo crear enlace de Stripe.', connectStripeError:'No se pudo conectar Stripe.', updateOrderError:'No se pudo actualizar pedido.', supportTitle:'Centro de Soporte', supportSub:'Envía mensaje a ORDA admin desde tu panel si algo sale mal.', supportSubject:'Asunto', supportMessage:'Explica tu problema...', supportSend:'Enviar Mensaje', supportSending:'Enviando...', supportSent:'✓ Mensaje enviado a ORDA admin', supportRequired:'Completa asunto y mensaje.', supportError:'No se pudo enviar mensaje.', notifications:'Notificaciones', messages:'Mensajes', noMessages:'Todavía no hay mensajes.', unreadMessages:'Mensajes Nuevos', markRead:'Marcar Leído', adminReply:'Respuesta Admin', ownerMessage:'Mensaje del Dueño', workers:'Trabajadores', addWorker:'Agregar Trabajador', workerName:'Nombre del trabajador', workerEmail:'Email del trabajador', workerRole:'Rol', workerLogin:'Login de trabajador', workerLoginLink:'Enlace de login', active:'Activo', inactive:'Inactivo', deactivate:'Desactivar', savingWorker:'Guardando...', noWorkers:'Todavía no hay trabajadores.', workerRequired:'Nombre y email son requeridos.', workerAdded:'Trabajador agregado.', workerError:'No se pudo guardar trabajador.', workerDeactivateError:'No se pudo desactivar trabajador.', manager:'Manager', cashier:'Cajero', kitchen:'Cocina', runner:'Runner', worker:'Trabajador', copyLogin:'Copiar login', manageStaff:'Manejar equipo', staffAccess:'Acceso de equipo', timeClock:'Reloj', clockIn:'Entrada', clockOut:'Salida', lunchStart:'Inicio Lonche', lunchEnd:'Fin Lonche', working:'Trabajando', onLunch:'En Lonche', clockedOut:'Salió', noTimeLog:'Sin registro todavía', timeCabinet:'Archivo de Tiempo', workerHistory:'Historial de Trabajador', selectWorker:'Seleccionar trabajador', selectRange:'Seleccionar rango', todayRange:'Hoy', weekRange:'Esta Semana', monthRange:'Este Mes', allRange:'Todo', totalHours:'Horas Totales', daysWorked:'Días Trabajados', missedClockOut:'Salida Faltante', noHistory:'Todavía no hay historial', hoursWorked:'Horas Trabajadas', termsTitle:'Acuerdo de Dueño ORDA', termsSubtitle:'Antes de entrar al panel, acepta el acuerdo de la plataforma para proteger tu tienda, pedidos, Stripe, builder, flyers y soporte.', terms1:'Entiendo que ORDA es una plataforma de pedidos directos para mi restaurante, food truck, catering o pop-up.', terms2:'Soy responsable por menú, precios, impuestos, disponibilidad, pickup/delivery, comunicación y cumplimiento de pedidos.', terms3:'No subiré contenido ilegal, dañino, robado, engañoso o sin derechos de uso.', terms4:'Entiendo que Stripe maneja onboarding y pagos, y mi Stripe debe estar completo para pagos con tarjeta.', terms5:'Entiendo que ORDA puede actualizar herramientas, paneles, flyers, analíticas y funciones para mantener la plataforma funcionando.', termsCheck:'He leído y acepto el Acuerdo de Dueño ORDA.', termsAccept:'Aceptar Acuerdo y Continuar', termsAccepting:'Guardando acuerdo...', termsRequired:'Marca la casilla para continuar.'
  }
};

function isLang(v?: string | null): v is Lang { return v === 'en' || v === 'es'; }
function getSavedLanguage(): Lang { if (typeof window === 'undefined') return 'en'; const saved = window.localStorage.getItem(OWNER_LANG_KEY) || window.localStorage.getItem('orda_language') || window.localStorage.getItem('orda_order_language'); return isLang(saved) ? saved : 'en'; }
function saveLanguageLocal(lang: Lang) { if (typeof window === 'undefined') return; window.localStorage.setItem(OWNER_LANG_KEY, lang); window.localStorage.setItem('orda_language', lang); window.localStorage.setItem('orda_order_language', lang); document.cookie = `orda_owner_language=${lang}; path=/; max-age=31536000; SameSite=Lax`; document.cookie = `orda_order_language=${lang}; path=/; max-age=31536000; SameSite=Lax`; }
function hasAcceptedAgreement(store: StoreRecord | null) { if (!store) return false; if (store.terms_accepted || store.owner_terms_accepted || store.agreement_accepted || store.terms_accepted_at || store.owner_terms_accepted_at || store.agreement_accepted_at) return true; if (typeof window === 'undefined') return false; return window.localStorage.getItem(`${TERMS_LOCAL_KEY}_${store.id}`) === 'true'; }
function saveAgreementLocal(storeId: string) { if (typeof window === 'undefined') return; window.localStorage.setItem(`${TERMS_LOCAL_KEY}_${storeId}`, 'true'); }
function formatMoney(v: number) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function getOrderAmount(o: OrderRow) { return Number(o.total ?? o.amount_total ?? 0); }
function getStoreName(s: StoreRecord | null) { return s?.name?.trim() || 'ORDA Store'; }
function getStoreSlug(s: StoreRecord | null) { const raw = s?.slug?.trim() || getStoreName(s); return raw.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'store'; }
function getBaseUrl() { return typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''; }
function getStoreUrl(s: StoreRecord | null) { return `${getBaseUrl()}/store/${getStoreSlug(s)}`; }
function getWorkerLoginUrl() { return `${getBaseUrl()}/dashboard/worker`; }
function cleanDisplayUrl(url: string) { return url.replace(/^https?:\/\//, '').replace(/\/$/, ''); }
function formatClock(d: Date) { return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function formatDayDate(d: Date) { return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }); }
function minutesAgo(value?: string | null, t = COPY.en) { if (!value) return '--'; const d = new Date(value); if (Number.isNaN(d.getTime())) return '--'; const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000)); if (mins < 1) return t.justNow; if (mins < 60) return `${mins} ${t.minAgo}`; const h = Math.floor(mins / 60); if (h < 24) return `${h} ${t.hrAgo}`; return `${Math.floor(h / 24)} ${t.dayAgo}`; }
function isToday(v?: string | null) { if (!v) return false; const d = new Date(v), n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); }
function isThisWeek(v?: string | null) { if (!v) return false; const d = new Date(v), n = new Date(), day = n.getDay(), off = (day + 6) % 7, start = new Date(n.getFullYear(), n.getMonth(), n.getDate() - off, 0, 0, 0, 0), end = new Date(start); end.setDate(start.getDate() + 7); return d >= start && d < end; }
function getStatusKey(status?: string | null) { const s = (status || '').toLowerCase(); if (s.includes('cancel')) return 'cancelled'; if (s.includes('complete') || s.includes('done')) return 'completed'; if (s.includes('ready')) return 'ready'; if (s.includes('progress') || s.includes('accepted') || s.includes('prep')) return 'in_progress'; return 'new'; }
function getStatusLabel(status: string | null | undefined, t: typeof COPY.en) { const k = getStatusKey(status); if (k === 'cancelled') return t.cancelled; if (k === 'completed') return t.completed; if (k === 'ready') return t.almostReady; if (k === 'in_progress') return t.inProgress; return t.new; }
function statusMatchesFilter(status: string | null | undefined, f: OrderFilterKey) { const k = getStatusKey(status); return f === 'ALL' || (f === 'NEW' && k === 'new') || (f === 'IN_PROGRESS' && k === 'in_progress') || (f === 'READY' && k === 'ready') || (f === 'DONE' && k === 'completed'); }
function getStatusBadgeClass(status?: string | null) { const k = getStatusKey(status); return `statusBadge ${k === 'in_progress' ? 'progress' : k}`; }
function getInitials(v?: string | null) { return (v || 'OR').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || 'OR'; }
function getNextStatusValue(a: OwnerAction) { if (a === 'accept') return 'in_progress'; if (a === 'ready') return 'ready'; if (a === 'complete') return 'completed'; return 'cancelled'; }
function getPrimaryAction(status: string | null | undefined, t: typeof COPY.en): { label: string; action: OwnerAction } | null { const k = getStatusKey(status); if (k === 'new') return { label: t.accept, action: 'accept' }; if (k === 'in_progress') return { label: t.markReady, action: 'ready' }; if (k === 'ready') return { label: t.complete, action: 'complete' }; return null; }
function getStripeState(s: StoreRecord | null): StripeState { if (!s?.stripe_account_id) return 'not_connected'; if (s.stripe_connected && s.stripe_charges_enabled && s.stripe_payouts_enabled) return 'connected'; return 'incomplete'; }
function getStripeStatusLabel(s: StoreRecord | null, type: 'account' | 'charges' | 'payouts', t: typeof COPY.en) { if (type === 'account') return s?.stripe_account_id && s?.stripe_connected ? t.connected : t.notConnected; if (type === 'charges') return s?.stripe_charges_enabled ? t.enabled : t.notConnected; return s?.stripe_payouts_enabled ? t.enabled : t.notConnected; }
function normalizeOrderItemsSummary(order: OrderRow, t: typeof COPY.en) { if (order.items_summary?.trim()) return order.items_summary.trim(); const src = order.items ?? order.order_items; if (Array.isArray(src)) { const text = src.map((item: any) => { if (!item) return ''; const qty = Number(item.quantity ?? item.qty ?? 1); const name = item.name ?? item.item_name ?? item.title ?? item.menu_item_name ?? item.menu_items?.name ?? 'Item'; return `${qty}x ${name}`; }).filter(Boolean).join(' · '); if (text) return text; } if (typeof src === 'string' && src.trim()) return src.trim(); return t.noSummary; }
function getImageUrl(v?: string | null) { const raw = String(v || '').trim(); if (!raw) return ''; if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw; const { data } = supabase.storage.from(BUCKET).getPublicUrl(raw.replace(/^menu-images\//, '').replace(/^\/+/, '')); return data.publicUrl; }
function getFlyerImage(store: StoreRecord | null, items: MenuItemRow[]) { const f = getImageUrl(store?.flyer_image) || getImageUrl(store?.flyer_preview); if (f) return f; const first = items.find(i => i.image_url || i.image || i.image_file || i.item_image); return getImageUrl(first?.image_url || first?.image || first?.image_file || first?.item_image) || getImageUrl(store?.hero_image) || DEFAULT_FLYER_IMAGE; }
function getHeroImage(store: StoreRecord | null, items: MenuItemRow[]) { const h = getImageUrl(store?.hero_image); if (h) return h; const first = items.find(i => i.image_url || i.image || i.image_file || i.item_image); return getImageUrl(first?.image_url || first?.image || first?.image_file || first?.item_image) || DEFAULT_FOOD_IMAGE; }
function getLogoImage(store: StoreRecord | null) { return getImageUrl(store?.logo_image) || ''; }
function getOrderImage(order: OrderRow, items: MenuItemRow[]) { const summary = normalizeOrderItemsSummary(order, COPY.en).toLowerCase(); const match = items.find(i => i.name && summary.includes(i.name.toLowerCase()) && (i.image_url || i.image || i.image_file || i.item_image)); const fallback = items.find(i => i.image_url || i.image || i.image_file || i.item_image); return getImageUrl(match?.image_url || match?.image || match?.image_file || match?.item_image) || getImageUrl(fallback?.image_url || fallback?.image || fallback?.image_file || fallback?.item_image) || DEFAULT_FOOD_IMAGE; }
function normalizeWorkerName(worker: RestaurantWorkerRow) { return worker.worker_name || worker.worker_email?.split('@')[0] || 'Worker'; }
function normalizeWorkerEmail(worker: RestaurantWorkerRow) { return worker.worker_email || ''; }
function normalizeWorkerRole(worker: RestaurantWorkerRow): WorkerRole { const raw = String(worker.role || 'worker').toLowerCase(); if (raw.includes('manager')) return 'manager'; if (raw.includes('cashier')) return 'cashier'; if (raw.includes('kitchen') || raw.includes('cook') || raw.includes('chef')) return 'kitchen'; if (raw.includes('runner') || raw.includes('driver')) return 'runner'; return 'worker'; }
function isWorkerActive(worker: RestaurantWorkerRow) { return worker.active !== false; }
function formatTimeOnly(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function getWorkerLatestLog(worker: RestaurantWorkerRow, logs: WorkerTimeLogRow[]) {
  const email = normalizeWorkerEmail(worker).toLowerCase();
  const id = worker.id;
  return logs.find(log =>
    (email && String(log.worker_email || '').toLowerCase() === email) ||
    (id && log.worker_id === id)
  ) || null;
}

function getTimeCabinetRangeStart(range: 'today' | 'week' | 'month' | 'all') {
  const now = new Date();
  if (range === 'all') return null;
  if (range === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === 'week') {
    const day = now.getDay();
    const off = (day + 6) % 7;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - off, 0, 0, 0, 0);
    return start;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function formatDateOnly(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function getHoursWorked(log: WorkerTimeLogRow) {
  if (!log.clock_in_at) return 0;
  const start = new Date(log.clock_in_at).getTime();
  const end = log.clock_out_at ? new Date(log.clock_out_at).getTime() : Date.now();
  let lunchMs = 0;
  if (log.lunch_start_at && log.lunch_end_at) {
    lunchMs = Math.max(0, new Date(log.lunch_end_at).getTime() - new Date(log.lunch_start_at).getTime());
  }
  return Math.max(0, (end - start - lunchMs) / 3600000);
}

function formatHours(hours: number) {
  return `${hours.toFixed(2)} hrs`;
}

function isMissedClockOut(log: WorkerTimeLogRow) {
  if (!log.clock_in_at || log.clock_out_at) return false;
  const start = new Date(log.clock_in_at);
  const now = new Date();
  return start.toDateString() !== now.toDateString();
}

function getWorkerTimeStatus(log: WorkerTimeLogRow | null, t: typeof COPY.en) {
  if (!log) return t.noTimeLog;
  if (log.status === 'on_lunch') return t.onLunch;
  if (log.status === 'clocked_out' || log.clock_out_at) return t.clockedOut;
  if (log.clock_in_at) return t.working;
  return t.noTimeLog;
}

async function trySaveAgreement(storeId: string) { const now = new Date().toISOString(); const patches = [{ owner_terms_accepted: true, owner_terms_accepted_at: now }, { terms_accepted: true, terms_accepted_at: now }, { agreement_accepted: true, agreement_accepted_at: now }]; let lastError: any = null; for (const patch of patches) { const { data, error } = await supabase.from('restaurants').update(patch).eq('id', storeId).select('*').maybeSingle(); if (!error) return data as StoreRecord | null; lastError = error; } if (lastError) console.warn('ORDA agreement saved locally only:', lastError.message || lastError); return null; }
function MobileIcon({ name }: { name: string }) { return <span className="miniSvg">{name === 'sales' ? '$' : name === 'orders' || name === 'live' ? '☰' : name === 'views' ? '◉' : name === 'stripe' ? '◫' : name === 'builder' ? '✎' : name === 'flyers' ? '⚑' : name === 'customers' ? '◎' : name === 'workers' ? '☷' : name === 'promos' ? '%' : name === 'rewards' ? '★' : name === 'analytics' ? '◔' : name === 'dashboard' ? '▦' : '•••'}</span>; }

export default function OwnerDashboardPage() {
  const router = useRouter();
  const topRef = useRef<HTMLDivElement | null>(null);
  const liveOrdersRef = useRef<HTMLElement | null>(null);
  const customersRef = useRef<HTMLElement | null>(null);
  const storefrontRef = useRef<HTMLElement | null>(null);
  const workersRef = useRef<HTMLElement | null>(null);
  const timeCabinetRef = useRef<HTMLElement | null>(null);
  const mobileSupportRef = useRef<HTMLElement | null>(null);
  const desktopSupportRef = useRef<HTMLElement | null>(null);

  const [lang, setLang] = useState<Lang>('en');
  const t = COPY[lang];
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [storeViews, setStoreViews] = useState(0);
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);
  const [workers, setWorkers] = useState<RestaurantWorkerRow[]>([]);
  const [workerTimeLogs, setWorkerTimeLogs] = useState<WorkerTimeLogRow[]>([]);
  const [workerHistoryLogs, setWorkerHistoryLogs] = useState<WorkerTimeLogRow[]>([]);
  const [selectedWorkerEmail, setSelectedWorkerEmail] = useState('ALL');
  const [timeCabinetRange, setTimeCabinetRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerRole, setWorkerRole] = useState<WorkerRole>('worker');
  const [savingWorker, setSavingWorker] = useState(false);
  const [updatingWorkerId, setUpdatingWorkerId] = useState('');
  const [workerSaved, setWorkerSaved] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<OrderFilterKey>('ALL');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [copied, setCopied] = useState(false);
  const [workerLoginCopied, setWorkerLoginCopied] = useState(false);
  const [now, setNow] = useState(new Date());
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [activeNav, setActiveNav] = useState<NavTarget>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [acceptingAgreement, setAcceptingAgreement] = useState(false);

  const scrollToRef = (ref: RefObject<HTMLElement | HTMLDivElement | null>, nav?: NavTarget) => { if (nav) setActiveNav(nav); ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const scrollToSupport = (nav?: NavTarget) => { if (nav) setActiveNav(nav); const useDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 901px)').matches; const target = useDesktop ? desktopSupportRef.current : mobileSupportRef.current; target?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  useEffect(() => { const saved = getSavedLanguage(); setLang(saved); saveLanguageLocal(saved); }, []);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);

  const loadOrdersForRestaurant = useCallback(async (id: string) => { const { data, error } = await supabase.from('orders').select('*').eq('restaurant_id', id).order('created_at', { ascending: false }).limit(100); if (error) throw error; return (data || []) as OrderRow[]; }, []);
  const loadMenuItemsForRestaurant = useCallback(async (id: string) => { const { data, error } = await supabase.from('menu_items').select('*').eq('restaurant_id', id).limit(100); if (error) throw error; return (data || []) as MenuItemRow[]; }, []);
  const loadStoreViewsForRestaurant = useCallback(async (id: string) => { try { const { count } = await supabase.from('store_views').select('*', { count: 'exact', head: true }).eq('restaurant_id', id); setStoreViews(count || 0); } catch { setStoreViews(0); } }, []);
  const loadMessagesForRestaurant = useCallback(async (id: string) => { try { const { data, error } = await supabase.from('admin_messages').select('*').eq('restaurant_id', id).order('created_at', { ascending: false }).limit(50); if (error) throw error; return (data || []) as AdminMessageRow[]; } catch { return []; } }, []);
  const loadWorkersForRestaurant = useCallback(async (id: string) => { try { const { data, error } = await supabase.from('restaurant_workers').select('*').eq('restaurant_id', id).order('created_at', { ascending: false }); if (error) throw error; return (data || []) as RestaurantWorkerRow[]; } catch { return []; } }, []);
  const loadWorkerTimeLogsForRestaurant = useCallback(async (id: string) => { try { const start = new Date(); start.setHours(0,0,0,0); const { data, error } = await supabase.from('worker_time_logs').select('*').eq('restaurant_id', id).gte('created_at', start.toISOString()).order('created_at', { ascending: false }); if (error) throw error; return (data || []) as WorkerTimeLogRow[]; } catch { return []; } }, []);
  const loadWorkerHistoryLogsForRestaurant = useCallback(async (id: string, range: 'today' | 'week' | 'month' | 'all') => { try { let query = supabase.from('worker_time_logs').select('*').eq('restaurant_id', id).order('created_at', { ascending: false }).limit(500); const start = getTimeCabinetRangeStart(range); if (start) query = query.gte('created_at', start.toISOString()); const { data, error } = await query; if (error) throw error; return (data || []) as WorkerTimeLogRow[]; } catch { return []; } }, []);

  useEffect(() => {
    let active = true;
    let orderChannel: any = null;
    let viewChannel: any = null;
    let restaurantChannel: any = null;
    let messageChannel: any = null;
    let workersChannel: any = null;
    let workerTimeChannel: any = null;

    async function loadData() {
      try {
        setLoading(true);
        setError('');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const user = session?.user || null;

        if (sessionError || !user) {
          if (active) {
            setError('');
            setStore(null);
            setOrders([]);
            setMenuItems([]);
            setMessages([]);
            setWorkers([]);
            setWorkerTimeLogs([]);
            setWorkerHistoryLogs([]);
            setLoading(false);
            router.replace('/sign-in');
          }
          return;
        }

        const { data: rows, error: restaurantError } = await supabase.from('restaurants').select('*').or(`owner_id.eq.${user.id},user_id.eq.${user.id}`).limit(1);
        if (restaurantError) throw restaurantError;
        const restaurant = ((rows || [])[0] || null) as StoreRecord | null;
        if (!active) return;

        setStore(restaurant);
        setAgreementAccepted(hasAcceptedAgreement(restaurant));

        const dbLang = restaurant?.owner_language || restaurant?.order_language;
        if (isLang(dbLang)) {
          setLang(dbLang);
          saveLanguageLocal(dbLang);
        }

        if (restaurant?.id) {
          const [fetchedOrders, fetchedItems, fetchedMessages, fetchedWorkers, fetchedTimeLogs, fetchedHistoryLogs] = await Promise.all([
            loadOrdersForRestaurant(restaurant.id),
            loadMenuItemsForRestaurant(restaurant.id),
            loadMessagesForRestaurant(restaurant.id),
            loadWorkersForRestaurant(restaurant.id),
            loadWorkerTimeLogsForRestaurant(restaurant.id),
            loadWorkerHistoryLogsForRestaurant(restaurant.id, timeCabinetRange),
            loadStoreViewsForRestaurant(restaurant.id),
          ]);

          if (!active) return;

          setOrders(fetchedOrders);
          setMenuItems(fetchedItems);
          setMessages(fetchedMessages);
          setWorkers(fetchedWorkers);
          setWorkerTimeLogs(fetchedTimeLogs);
          setWorkerHistoryLogs(fetchedHistoryLogs);

          orderChannel = supabase.channel(`owner-dashboard-orders-${restaurant.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` }, async () => { try { const refreshed = await loadOrdersForRestaurant(restaurant.id); if (active) setOrders(refreshed); } catch {} }).subscribe();
          viewChannel = supabase.channel(`owner-dashboard-store-views-${restaurant.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'store_views', filter: `restaurant_id=eq.${restaurant.id}` }, async () => { if (active) await loadStoreViewsForRestaurant(restaurant.id); }).subscribe();
          restaurantChannel = supabase.channel(`owner-dashboard-restaurant-${restaurant.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurant.id}` }, async () => { const { data } = await supabase.from('restaurants').select('*').eq('id', restaurant.id).single(); if (active && data) { setStore(data as StoreRecord); setAgreementAccepted(hasAcceptedAgreement(data as StoreRecord)); } }).subscribe();
          messageChannel = supabase.channel(`owner-dashboard-admin-messages-${restaurant.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages', filter: `restaurant_id=eq.${restaurant.id}` }, async () => { const refreshed = await loadMessagesForRestaurant(restaurant.id); if (active) setMessages(refreshed); }).subscribe();
          workersChannel = supabase.channel(`owner-dashboard-workers-${restaurant.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_workers', filter: `restaurant_id=eq.${restaurant.id}` }, async () => { const refreshed = await loadWorkersForRestaurant(restaurant.id); if (active) setWorkers(refreshed); }).subscribe();
          workerTimeChannel = supabase.channel(`owner-dashboard-worker-time-${restaurant.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'worker_time_logs', filter: `restaurant_id=eq.${restaurant.id}` }, async () => { const refreshed = await loadWorkerTimeLogsForRestaurant(restaurant.id); const history = await loadWorkerHistoryLogsForRestaurant(restaurant.id, timeCabinetRange); if (active) { setWorkerTimeLogs(refreshed); setWorkerHistoryLogs(history); } }).subscribe();
        }
      } catch (err: any) {
        if (active) setError(err?.message || COPY[getSavedLanguage()].errorLoad);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
      [orderChannel, viewChannel, restaurantChannel, messageChannel, workersChannel, workerTimeChannel].forEach(ch => { if (ch) supabase.removeChannel(ch); });
    };
  }, [router, loadOrdersForRestaurant, loadMenuItemsForRestaurant, loadStoreViewsForRestaurant, loadMessagesForRestaurant, loadWorkersForRestaurant, loadWorkerTimeLogsForRestaurant, loadWorkerHistoryLogsForRestaurant, timeCabinetRange]);


  useEffect(() => {
    if (!store?.id) return;

    let live = true;
    let currentDay = new Date().toDateString();

    async function refreshOwnerLiveData() {
      if (!store?.id || !live) return;

      const nextDay = new Date().toDateString();
      const dayChanged = nextDay !== currentDay;

      try {
        const [nextOrders, nextMessages, nextWorkers, nextTimeLogs] = await Promise.all([
          loadOrdersForRestaurant(store.id),
          loadMessagesForRestaurant(store.id),
          loadWorkersForRestaurant(store.id),
          loadWorkerTimeLogsForRestaurant(store.id),
          loadStoreViewsForRestaurant(store.id),
        ]);

        if (!live) return;

        setOrders(nextOrders);
        setMessages(nextMessages);
        setWorkers(nextWorkers);
        setWorkerTimeLogs(nextTimeLogs);

        if (dayChanged) {
          currentDay = nextDay;
          setOrderFilter('ALL');
          setSearch('');
        }
      } catch {}
    }

    const timer = window.setInterval(refreshOwnerLiveData, 60000);
    const midnightTimer = window.setInterval(() => {
      const nextDay = new Date().toDateString();
      if (nextDay !== currentDay) {
        currentDay = nextDay;
        void refreshOwnerLiveData();
      }
    }, 300000);

    return () => {
      live = false;
      window.clearInterval(timer);
      window.clearInterval(midnightTimer);
    };
  }, [
    store?.id,
    loadOrdersForRestaurant,
    loadMessagesForRestaurant,
    loadWorkersForRestaurant,
    loadWorkerTimeLogsForRestaurant,
    loadStoreViewsForRestaurant
  ]);


  useEffect(() => {
    if (!store?.id) return;
    let active = true;

    async function refreshTimeCabinet() {
      if (!store?.id) return;
      const logs = await loadWorkerHistoryLogsForRestaurant(store.id, timeCabinetRange);
      if (active) setWorkerHistoryLogs(logs);
    }

    void refreshTimeCabinet();

    return () => {
      active = false;
    };
  }, [store?.id, timeCabinetRange, loadWorkerHistoryLogsForRestaurant]);

  async function changeOwnerLanguage(next: Lang) { setLang(next); saveLanguageLocal(next); if (!store?.id) return; const { error } = await supabase.from('restaurants').update({ owner_language: next, order_language: next }).eq('id', store.id); if (error) { setError(error.message); return; } setStore(current => current ? { ...current, owner_language: next, order_language: next } : current); }
  async function updateOrderStatus(id: string, action: OwnerAction) { try { setUpdatingOrderId(id); setError(''); const next = getNextStatusValue(action); const { error } = await supabase.from('orders').update({ status: next }).eq('id', id); if (error) throw error; setOrders(prev => prev.map(o => o.id === id ? { ...o, status: next } : o)); } catch (err: any) { setError(err?.message || t.updateOrderError); } finally { setUpdatingOrderId(''); } }
  async function copyStoreLink() { try { await navigator.clipboard.writeText(storeUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch {} }
  async function copyWorkerLogin() { try { await navigator.clipboard.writeText(workerLoginUrl); setWorkerLoginCopied(true); window.setTimeout(() => setWorkerLoginCopied(false), 1500); } catch {} }
  async function handleStripeConnect() { if (!store?.id) return; try { setConnectingStripe(true); setError(''); const res = await fetch('/api/stripe/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restaurantId: store.id }) }); const payload = await res.json().catch(() => ({})); if (!res.ok) throw new Error(payload?.error || t.stripeLinkError); if (payload?.url) { window.location.href = payload.url; return; } throw new Error(t.accountNotReturned); } catch (err: any) { setError(err?.message || t.connectStripeError); } finally { setConnectingStripe(false); } }
  async function acceptAgreement() { if (!store?.id) return; if (!agreementChecked) { setError(t.termsRequired); return; } try { setAcceptingAgreement(true); setError(''); const saved = await trySaveAgreement(store.id); saveAgreementLocal(store.id); if (saved) setStore(saved); else setStore(c => c ? { ...c, owner_terms_accepted: true, owner_terms_accepted_at: new Date().toISOString() } : c); setAgreementAccepted(true); } finally { setAcceptingAgreement(false); } }
  async function sendSupportMessage() { if (!store?.id) return; const subject = supportSubject.trim(), message = supportMessage.trim(); if (!subject || !message) { setError(t.supportRequired); return; } try { setSendingSupport(true); setError(''); setSupportSuccess(false); const { data: { session } } = await supabase.auth.getSession(); const ownerId = store.owner_id || store.user_id || session?.user?.id || null; const row = { restaurant_id: store.id, owner_id: ownerId, store_name: storeName, subject, message, status: 'new', read_by_owner: true }; const { error } = await supabase.from('admin_messages').insert(row); if (error) throw error; setSupportSubject(''); setSupportMessage(''); setSupportSuccess(true); const refreshed = await loadMessagesForRestaurant(store.id); setMessages(refreshed); window.setTimeout(() => setSupportSuccess(false), 3200); } catch (err: any) { setError(err?.message || t.supportError); } finally { setSendingSupport(false); } }
  async function markMessagesRead() { if (!store?.id) return; try { await supabase.from('admin_messages').update({ read_by_owner: true, status: 'read' }).eq('restaurant_id', store.id).or('read_by_owner.is.false,status.eq.replied,status.eq.admin_reply'); const refreshed = await loadMessagesForRestaurant(store.id); setMessages(refreshed); } catch {} }

  async function addWorker() {
    if (!store?.id) return;
    const name = workerName.trim();
    const email = workerEmail.trim().toLowerCase();
    if (!name || !email) {
      setError(t.workerRequired);
      return;
    }

    try {
      setSavingWorker(true);
      setWorkerSaved(false);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      const ownerId = store.owner_id || store.user_id || session?.user?.id || null;
      const payload = {
        restaurant_id: store.id,
        owner_id: ownerId,
        worker_name: name,
        worker_email: email,
        role: workerRole,
        active: true,
      };
      const { error } = await supabase.from('restaurant_workers').insert(payload);
      if (error) throw error;
      setWorkerName('');
      setWorkerEmail('');
      setWorkerRole('worker');
      setWorkerSaved(true);
      const refreshed = await loadWorkersForRestaurant(store.id);
      setWorkers(refreshed);
      window.setTimeout(() => setWorkerSaved(false), 2200);
    } catch (err: any) {
      setError(err?.message || t.workerError);
    } finally {
      setSavingWorker(false);
    }
  }

  async function deactivateWorker(workerId: string) {
    if (!store?.id) return;
    try {
      setUpdatingWorkerId(workerId);
      setError('');
      const { error } = await supabase.from('restaurant_workers').update({ active: false }).eq('id', workerId);
      if (error) throw error;
      const refreshed = await loadWorkersForRestaurant(store.id);
      setWorkers(refreshed);
    } catch (err: any) {
      setError(err?.message || t.workerDeactivateError);
    } finally {
      setUpdatingWorkerId('');
    }
  }

  const storeName = useMemo(() => getStoreName(store), [store]);
  const storeUrl = useMemo(() => getStoreUrl(store), [store]);
  const workerLoginUrl = useMemo(() => getWorkerLoginUrl(), []);
  const stripeState = useMemo(() => getStripeState(store), [store]);
  const flyerImage = useMemo(() => getFlyerImage(store, menuItems), [store, menuItems]);
  const logoImage = useMemo(() => getLogoImage(store), [store]);
  const heroImage = useMemo(() => getHeroImage(store, menuItems), [store, menuItems]);

  const searchedOrders = useMemo(() => { let list = [...orders]; if (search.trim()) { const q = search.toLowerCase(); list = list.filter(o => (o.id || '').toLowerCase().includes(q) || (o.customer_name || '').toLowerCase().includes(q) || normalizeOrderItemsSummary(o, t).toLowerCase().includes(q)); } return list; }, [orders, search, t]);
  const filteredOrders = useMemo(() => searchedOrders.filter(o => statusMatchesFilter(o.status, orderFilter)), [searchedOrders, orderFilter]);
  const todaysSales = useMemo(() => orders.filter(o => isToday(o.created_at)).reduce((s, o) => s + getOrderAmount(o), 0), [orders]);
  const todaysOrders = useMemo(() => orders.filter(o => isToday(o.created_at)).length, [orders]);
  const newOrdersCount = useMemo(() => orders.filter(o => getStatusKey(o.status) === 'new').length, [orders]);
  const inProgressCount = useMemo(() => orders.filter(o => getStatusKey(o.status) === 'in_progress').length, [orders]);
  const readyCount = useMemo(() => orders.filter(o => getStatusKey(o.status) === 'ready').length, [orders]);
  const completedCount = useMemo(() => orders.filter(o => getStatusKey(o.status) === 'completed').length, [orders]);
  const activeWorkersCount = useMemo(() => workers.filter(isWorkerActive).length, [workers]);
  const unreadMessagesCount = useMemo(() => messages.filter(m => m.read_by_owner === false || ['replied', 'admin_reply', 'unread'].includes(String(m.status || '').toLowerCase())).length, [messages]);
  const notificationCount = newOrdersCount + unreadMessagesCount;
  const revenueTotal = useMemo(() => orders.reduce((s, o) => s + getOrderAmount(o), 0), [orders]);
  const weeklySales = useMemo(() => orders.filter(o => isThisWeek(o.created_at)).reduce((s, o) => s + getOrderAmount(o), 0), [orders]);
  const averageOrderValue = useMemo(() => (!orders.length ? 0 : revenueTotal / orders.length), [orders.length, revenueTotal]);

  const salesSeries = useMemo(() => { const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; const cur = new Date(), day = cur.getDay(), off = (day + 6) % 7, start = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - off); return labels.map((label, i) => { const ds = new Date(start); ds.setDate(start.getDate() + i); const de = new Date(ds); de.setDate(ds.getDate() + 1); const total = orders.reduce((sum, o) => { if (!o.created_at) return sum; const d = new Date(o.created_at); return d >= ds && d < de ? sum + getOrderAmount(o) : sum; }, 0); return { label, total }; }); }, [orders]);
  const chartMax = useMemo(() => Math.max(600, Math.ceil((Math.max(...salesSeries.map(i => i.total), 0) + 100) / 100) * 100), [salesSeries]);
  const chartPoints = useMemo(() => salesSeries.map((p, i) => ({ x: 36 + i * 78, y: 180 - (p.total / chartMax) * 132, total: p.total, label: p.label })), [salesSeries, chartMax]);
  const chartPath = useMemo(() => chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '), [chartPoints]);
  const areaPath = useMemo(() => `${chartPath} L ${chartPoints[chartPoints.length - 1]?.x || 504} 190 L 36 190 Z`, [chartPath, chartPoints]);
  const topItems = useMemo(() => { const map = new Map<string, { name: string; qty: number }>(); for (const o of orders) { normalizeOrderItemsSummary(o, t).split(/[·,]/).map(p => p.trim()).filter(Boolean).forEach(part => { const m = part.match(/^(\d+)x?\s+/i); const qty = m ? Number(m[1]) : 1; const name = part.replace(/^(\d+)x?\s+/i, '').trim(); if (!name || name === t.noSummary) return; map.set(name, { name, qty: (map.get(name)?.qty || 0) + qty }); }); } return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5); }, [orders, t]);
  const uniqueCustomers = useMemo(() => { const seen = new Map<string, { name: string; phone: string }>(); for (const o of orders) { const key = `${o.customer_name || ''}-${o.customer_phone || ''}`.trim(); if (key && !seen.has(key)) seen.set(key, { name: o.customer_name || t.customer, phone: o.customer_phone || store?.phone || t.noPhone }); } return Array.from(seen.values()).slice(0, 6); }, [orders, store?.phone, t]);
  const firstTwoOrders = useMemo(() => filteredOrders.slice(0, 2), [filteredOrders]);

  const visibleCabinetLogs = useMemo(() => {
    if (selectedWorkerEmail === 'ALL') return workerHistoryLogs;
    return workerHistoryLogs.filter(log => String(log.worker_email || '').toLowerCase() === selectedWorkerEmail.toLowerCase());
  }, [selectedWorkerEmail, workerHistoryLogs]);

  const cabinetTotalHours = useMemo(() => visibleCabinetLogs.reduce((sum, log) => sum + getHoursWorked(log), 0), [visibleCabinetLogs]);
  const cabinetDaysWorked = useMemo(() => new Set(visibleCabinetLogs.filter(log => log.clock_in_at).map(log => new Date(log.clock_in_at || log.created_at || '').toDateString())).size, [visibleCabinetLogs]);
  const cabinetMissedClockOut = useMemo(() => visibleCabinetLogs.filter(isMissedClockOut).length, [visibleCabinetLogs]);


  const goNav = (target: NavTarget) => {
    setActiveNav(target);
    setMobileMenuOpen(false);
    if (target === 'dashboard') scrollToRef(topRef, 'dashboard');
    if (target === 'orders') scrollToRef(liveOrdersRef, 'orders');
    if (target === 'builder') router.push('/dashboard/owner/builder');
    if (target === 'flyers') router.push('/dashboard/owner/flyers');
    if (target === 'support') scrollToSupport('support');
    if (target === 'workers') scrollToRef(workersRef, 'workers');
    if (target === 'timecabinet') scrollToRef(timeCabinetRef, 'timecabinet');
    if (target === 'more') scrollToRef(storefrontRef, 'more');
  };

  const NotificationBell = ({ mobile = false }: { mobile?: boolean }) => <div className="notificationWrap"><button type="button" className={mobile ? 'bellBtn' : 'notificationBtn'} onClick={() => setNotificationOpen(o => !o)} aria-label="Notifications"><span>🔔</span>{notificationCount > 0 ? <b>{notificationCount}</b> : null}</button>{notificationOpen ? <div className="notificationMenu"><div className="notificationHead"><strong>{t.notifications}</strong><button type="button" onClick={markMessagesRead}>{t.markRead}</button></div><button type="button" className="notificationItem" onClick={() => { setNotificationOpen(false); scrollToRef(liveOrdersRef, 'orders'); }}><span>☰</span><div><strong>{newOrdersCount} {t.newOrders}</strong><small>{newOrdersCount ? t.needsAction : t.noNewOrders}</small></div></button><button type="button" className="notificationItem" onClick={() => { setNotificationOpen(false); scrollToSupport('support'); }}><span>✉</span><div><strong>{unreadMessagesCount} {t.unreadMessages}</strong><small>{messages[0]?.subject || t.noMessages}</small></div></button><button type="button" className="notificationItem" onClick={() => { setNotificationOpen(false); scrollToRef(workersRef, 'workers'); }}><span>☷</span><div><strong>{activeWorkersCount} {t.workers}</strong><small>{t.staffAccess}</small></div></button></div> : null}</div>;

  const renderWorkersPanel = (desktop = false) => <section ref={workersRef} className={desktop ? 'panel workersPanel desktopWorkersPanel' : 'mobileWhitePanel workersPanel'}>
    <div className="workersTop">
      <div>
        <h3>{t.workers}</h3>
        <p className="sectionSub">{t.manageStaff} · {activeWorkersCount} {t.active}</p><p className="sectionSub">Today shift times sync live from worker dashboard.</p>
      </div>
      <button type="button" className="lightLineBtn workerLoginCopy" onClick={copyWorkerLogin}>{workerLoginCopied ? t.copied : t.copyLogin}</button>
    </div>

    <div className="workerLoginBox">
      <span>{t.workerLoginLink}</span>
      <strong>{cleanDisplayUrl(workerLoginUrl)}</strong>
      <small>Workers sign in with the email you approve here.</small>
    </div>

    <div className="workerForm">
      <label className="workerField">
        <span>{t.workerName}</span>
        <input value={workerName} onChange={(e: any) => setWorkerName(e.target.value)} placeholder="Example: Maria Lopez" autoComplete="name" />
      </label>
      <label className="workerField">
        <span>{t.workerEmail}</span>
        <input value={workerEmail} onChange={(e: any) => setWorkerEmail(e.target.value)} placeholder="worker@email.com" autoComplete="email" inputMode="email" />
      </label>
      <label className="workerField">
        <span>{t.workerRole}</span>
        <select value={workerRole} onChange={(e: any) => setWorkerRole(e.target.value as WorkerRole)}>
          <option value="manager">{t.manager}</option>
          <option value="cashier">{t.cashier}</option>
          <option value="kitchen">{t.kitchen}</option>
          <option value="runner">{t.runner}</option>
          <option value="worker">{t.worker}</option>
        </select>
      </label>
      <button type="button" className="linea addWorkerBtn" disabled={savingWorker} onClick={addWorker}>{savingWorker ? t.savingWorker : t.addWorker}</button>
    </div>

    {workerSaved ? <div className="supportSuccess">{t.workerAdded}</div> : null}

    <div className="workersList">
      {workers.length ? workers.map(worker => {
        const active = isWorkerActive(worker);
        return <article key={worker.id} className={`workerRow ${active ? 'active' : 'inactive'}`}>
          <div className="workerAvatar">{getInitials(normalizeWorkerName(worker))}</div>
          <div className="workerInfo">
            <strong>{normalizeWorkerName(worker)}</strong>
            <span>{normalizeWorkerEmail(worker) || t.workerEmail}</span>
            <small>{t.workerRole}: {t[normalizeWorkerRole(worker)]}</small>
          </div>
          <span className={active ? 'workerStatus active' : 'workerStatus inactive'}>{active ? t.active : t.inactive}</span>
          {active ? <button type="button" className="lightLineBtn rowBtn" disabled={updatingWorkerId === worker.id} onClick={() => deactivateWorker(worker.id)}>{updatingWorkerId === worker.id ? t.updating : t.deactivate}</button> : null}
        </article>;
      }) : <div className="emptyBox">{t.noWorkers}</div>}
    </div>
  </section>;


  const renderTimeCabinetPanel = (desktop = false) => <section ref={timeCabinetRef} className={desktop ? 'panel timeCabinetPanel desktopTimeCabinetPanel' : 'mobileWhitePanel timeCabinetPanel'}>
    <div className="workersTop">
      <div>
        <h3>{t.timeCabinet}</h3>
        <p className="sectionSub">{t.workerHistory} · {formatHours(cabinetTotalHours)} · {cabinetDaysWorked} {t.daysWorked}</p>
      </div>
    </div>

    <div className="timeCabinetControls">
      <label>
        <span>{t.selectWorker}</span>
        <select value={selectedWorkerEmail} onChange={(event: any) => setSelectedWorkerEmail(event.target.value)}>
          <option value="ALL">{t.all}</option>
          {workers.map(worker => {
            const email = normalizeWorkerEmail(worker);
            return email ? <option value={email} key={worker.id}>{normalizeWorkerName(worker)} · {email}</option> : null;
          })}
        </select>
      </label>

      <label>
        <span>{t.selectRange}</span>
        <select value={timeCabinetRange} onChange={(event: any) => setTimeCabinetRange(event.target.value as 'today' | 'week' | 'month' | 'all')}>
          <option value="today">{t.todayRange}</option>
          <option value="week">{t.weekRange}</option>
          <option value="month">{t.monthRange}</option>
          <option value="all">{t.allRange}</option>
        </select>
      </label>
    </div>

    <div className="timeCabinetStats">
      <span>{t.totalHours}<b>{formatHours(cabinetTotalHours)}</b></span>
      <span>{t.daysWorked}<b>{cabinetDaysWorked}</b></span>
      <span>{t.missedClockOut}<b>{cabinetMissedClockOut}</b></span>
    </div>

    <div className="timeCabinetList">
      {visibleCabinetLogs.length ? visibleCabinetLogs.map(log => <article key={log.id} className={`timeCabinetRow ${isMissedClockOut(log) ? 'missed' : ''}`}>
        <div className="timeCabinetWorker">
          <strong>{log.worker_name || log.worker_email || t.worker}</strong>
          <span>{log.worker_email}</span>
          <small>{formatDateOnly(log.clock_in_at || log.created_at)}</small>
        </div>
        <div className="timeCabinetTimes">
          <span>{t.clockIn}<b>{formatTimeOnly(log.clock_in_at)}</b></span>
          <span>{t.lunchStart}<b>{formatTimeOnly(log.lunch_start_at)}</b></span>
          <span>{t.lunchEnd}<b>{formatTimeOnly(log.lunch_end_at)}</b></span>
          <span>{t.clockOut}<b>{formatTimeOnly(log.clock_out_at)}</b></span>
          <span>{t.hoursWorked}<b>{formatHours(getHoursWorked(log))}</b></span>
          <span>{isMissedClockOut(log) ? t.missedClockOut : getWorkerTimeStatus(log, t)}<b>{String(log.status || '--').replace('_', ' ')}</b></span>
        </div>
      </article>) : <div className="emptyBox">{t.noHistory}</div>}
    </div>
  </section>;

  const renderSupportPanel = (desktop = false) => <section ref={desktop ? desktopSupportRef : mobileSupportRef} className={desktop ? 'panel supportPanel desktopSupportPanel' : 'mobileWhitePanel supportPanel'}><h3>{t.supportTitle}</h3><p className={desktop ? 'sectionSub' : ''}>{t.supportSub}</p><div className={desktop ? 'supportInputs desktopSupportInputs' : 'supportInputs'}><input value={supportSubject} onChange={(e: any) => setSupportSubject(e.target.value)} onFocus={() => setMobileMenuOpen(false)} placeholder={t.supportSubject} autoComplete="off" /><textarea value={supportMessage} onChange={(e: any) => setSupportMessage(e.target.value)} onFocus={() => setMobileMenuOpen(false)} placeholder={t.supportMessage} autoComplete="off" /></div>{supportSuccess ? <div className="supportSuccess">{t.supportSent}</div> : null}<button type="button" className={desktop ? 'linea supportSendBtn' : 'fullBlackBtn'} disabled={sendingSupport} onClick={sendSupportMessage}>{sendingSupport ? t.supportSending : t.supportSend}</button><div className="messageThread"><div className="messageThreadTop"><strong>{t.messages}</strong><span>{messages.length}</span></div>{messages.length ? messages.slice(0, 6).map(m => <article key={m.id} className={`messageBubble ${m.read_by_owner === false ? 'unread' : ''}`}><div><b>{m.subject || t.ownerMessage}</b><small>{m.created_at ? minutesAgo(m.created_at, t) : ''}</small></div><p>{m.message}</p>{m.admin_reply || m.reply ? <div className="adminReply"><strong>{t.adminReply}</strong><p>{m.admin_reply || m.reply}</p></div> : null}</article>) : <div className="emptyBox">{t.noMessages}</div>}</div></section>;

  if (loading) return <main className="ownerDashboardLoading"><div className="loadingCard">{t.loading}</div><style jsx global>{dashboardStyles}</style></main>;

  if (store && !agreementAccepted) return <main className="ownerAgreementPage"><section className="agreementCard"><img src="/orda-logo.png" alt="ORDA" /><small>OWNER DASHBOARD ACCESS</small><h1>{t.termsTitle}</h1><p>{t.termsSubtitle}</p>{error ? <div className="agreementError">{error}</div> : null}<div className="agreementList"><span>1</span><p>{t.terms1}</p><span>2</span><p>{t.terms2}</p><span>3</span><p>{t.terms3}</p><span>4</span><p>{t.terms4}</p><span>5</span><p>{t.terms5}</p></div><label className="agreementCheck"><input type="checkbox" checked={agreementChecked} onChange={(e: any) => setAgreementChecked(e.target.checked)} /><b>{t.termsCheck}</b></label><button type="button" className="agreementButton" disabled={acceptingAgreement} onClick={acceptAgreement}>{acceptingAgreement ? t.termsAccepting : t.termsAccept}</button><div className="agreementLang"><button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => changeOwnerLanguage('en')}>EN</button><button type="button" className={lang === 'es' ? 'active' : ''} onClick={() => changeOwnerLanguage('es')}>ES</button></div></section><style jsx global>{dashboardStyles}</style></main>;

  return <main className="ownerPage">
    <div className="mobileFrame" ref={topRef}>
      <header className="mobileTopbar"><button type="button" className="hamburgerBtn" onClick={() => setMobileMenuOpen(o => !o)} aria-label="Open menu"><span /><span /><span /></button><img src="/orda-logo.png" alt="ORDA" className="mobileLogo" /><div className="mobileTopActions"><NotificationBell mobile /><button type="button" className="storeAvatarBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}><img src={heroImage} alt={storeName} /></button></div></header>
      {mobileMenuOpen ? <section className="mobileDrawer"><button type="button" onClick={() => goNav('dashboard')}>{t.dashboard}</button><button type="button" onClick={() => goNav('orders')}>{t.liveOrders}</button><button type="button" onClick={() => goNav('workers')}>{t.workers}</button><button type="button" onClick={() => goNav('timecabinet')}>{t.timeCabinet}</button><button type="button" onClick={() => goNav('support')}>{t.supportTitle}</button><button type="button" onClick={() => goNav('builder')}>{t.menuBuilder}</button><button type="button" onClick={() => goNav('flyers')}>{t.createFlyers}</button><button type="button" onClick={handleStripeConnect}>{stripeState === 'connected' ? t.manageStripe : t.connectStripe}</button><div className="drawerLang"><button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => changeOwnerLanguage('en')}>EN</button><button type="button" className={lang === 'es' ? 'active' : ''} onClick={() => changeOwnerLanguage('es')}>ES</button></div></section> : null}
      <section className="mobileIntro"><div><h1>{t.welcome}</h1><p>{t.todaySubtitle}</p></div><button type="button" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>{t.viewStore} <span>↗</span></button></section>
      {error ? <div className="mobileError">{error}</div> : null}
      <section className="storeHeroCard" style={{ backgroundImage: `linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.78) 47%, rgba(255,255,255,.12) 100%), url(${heroImage})` }}><div className="storeHeroContent"><h2>{storeName} <span>✓</span></h2><div className="storeLivePill"><i /> {t.storeLive}</div><p>🔗 {cleanDisplayUrl(storeUrl)}</p><p>◷ {t.openUntil}</p></div><button type="button" className="editStoreBtn" onClick={() => router.push('/dashboard/owner/builder')}>✎ {t.editStore}</button></section>
      <section className="glanceHeader"><h2>{t.todayGlance}</h2><button type="button">{t.today} ▾</button></section>
      <section className="mobileKpis mobilePremiumKpis">
  <article className="mobileKpiCard mobilePremiumKpiCard">
    <div className="premiumThumbWrap mobilePremiumThumbWrap">
      <img className="premiumThumb" src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=800&auto=format&fit=crop" alt="Money" />
    </div>
    <div className="mobilePremiumKpiBody">
      <span>{t.todaysSales}</span>
      <strong>{formatMoney(todaysSales)}</strong>
      <em>{todaysOrders ? t.liveToday : t.noOrdersToday}</em>
    </div>
  </article>

  <article className="mobileKpiCard mobilePremiumKpiCard">
    <div className="premiumThumbWrap mobilePremiumThumbWrap">
      <img className="premiumThumb" src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=800&auto=format&fit=crop" alt="Orders" />
    </div>
    <div className="mobilePremiumKpiBody">
      <span>{t.newOrders}</span>
      <strong>{newOrdersCount}</strong>
      <em>{newOrdersCount ? t.needsAction : t.noNewOrders}</em>
    </div>
  </article>

  <article className="mobileKpiCard mobilePremiumKpiCard">
    <div className="premiumThumbWrap mobilePremiumThumbWrap">
      <img className="premiumThumb" src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800&auto=format&fit=crop" alt="Workers" />
    </div>
    <div className="mobilePremiumKpiBody">
      <span>{t.workers}</span>
      <strong>{activeWorkersCount}</strong>
      <em>{t.staffAccess}</em>
    </div>
  </article>

  <article className="mobileKpiCard mobilePremiumKpiCard">
    <div className="premiumThumbWrap mobilePremiumThumbWrap">
      <img className="premiumThumb" src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800&auto=format&fit=crop" alt="Messages" />
    </div>
    <div className="mobilePremiumKpiBody">
      <span>{t.unreadMessages}</span>
      <strong>{unreadMessagesCount}</strong>
      <em>{messages.length ? t.messages : t.noMessages}</em>
    </div>
  </article>
</section>
      <section className="mobileChartCard"><div className="chartTopMobile"><h2>{t.salesOverview}</h2><button type="button" onClick={() => router.push('/dashboard/owner/analytics')}>{t.viewFullAnalytics} ›</button></div><strong>{formatMoney(weeklySales)}</strong><em>{weeklySales ? t.thisWeekActive : t.noWeeklySales}</em><svg viewBox="0 0 570 216" className="mobileSalesChart" preserveAspectRatio="none"><defs><linearGradient id="ownerMobileArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#111827" stopOpacity="0.18" /><stop offset="100%" stopColor="#111827" stopOpacity="0.02" /></linearGradient></defs><path d={areaPath} fill="url(#ownerMobileArea)" /><path d={chartPath || 'M 36 180 L 114 120 L 192 150 L 270 90 L 348 130 L 426 80 L 504 110'} fill="none" stroke="#050505" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{chartPoints.map(p => <circle key={p.label} cx={p.x} cy={p.y} r="5" fill="#050505" />)}</svg><div className="mobileChartLabels">{salesSeries.map(p => <span key={p.label}>{p.label}</span>)}</div></section>
      <section className="mobileLiveOrders" ref={liveOrdersRef}><div className="sectionTitleRow"><h2>{t.liveOrders} <b>{newOrdersCount}</b></h2><button type="button" onClick={() => setOrderFilter('ALL')}>{t.viewAllOrders} ›</button></div>{firstTwoOrders.length ? firstTwoOrders.map(order => { const primaryAction = getPrimaryAction(order.status, t); return <article className="mobileOrderCard" key={order.id}><img src={getOrderImage(order, menuItems)} alt="Order" /><div className="mobileOrderInfo"><strong>#ORD-{order.id.slice(0, 4).toUpperCase()}</strong><span>{order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--'}</span><em>{normalizeOrderItemsSummary(order, t)} • {formatMoney(getOrderAmount(order))}</em></div><span className={getStatusBadgeClass(order.status)}>{getStatusLabel(order.status, t)}</span>{primaryAction ? <button type="button" className="acceptMobile" disabled={updatingOrderId === order.id} onClick={() => updateOrderStatus(order.id, primaryAction.action)}>{updatingOrderId === order.id ? t.updating : primaryAction.label}</button> : <button type="button" className="acceptMobile">{t.viewDetails}</button>}</article>; }) : <div className="emptyMobile">{t.noOrdersYet}</div>}</section>
      <section className="mobileQuickActions"><h2>{t.quickActions}</h2><div className="mobileActionGrid"><button type="button" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.48)), url(${heroImage})` }} onClick={() => router.push('/dashboard/owner/builder')}><MobileIcon name="builder" /><strong>{t.buildMenu}</strong><span>{t.editMenu}</span><b>›</b></button><button type="button" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.48)), url(${getOrderImage(orders[0] || {} as OrderRow, menuItems)})` }} onClick={() => scrollToRef(liveOrdersRef, 'orders')}><MobileIcon name="live" /><strong>{t.liveOrders}</strong><span>{t.manageIncoming}</span><b>›</b></button><button type="button" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.48)), url(${heroImage})` }} onClick={() => scrollToRef(workersRef, 'workers')}><MobileIcon name="workers" /><strong>{t.workers}</strong><span>{t.manageStaff}</span><b>›</b></button><button type="button" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.48)), url(${heroImage})` }} onClick={() => scrollToRef(timeCabinetRef, 'timecabinet')}><MobileIcon name="analytics" /><strong>{t.timeCabinet}</strong><span>{t.workerHistory}</span><b>›</b></button><button type="button" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.48)), url(${flyerImage})` }} onClick={() => router.push('/dashboard/owner/flyers')}><MobileIcon name="flyers" /><strong>{t.createFlyers}</strong><span>{t.promoteStore}</span><b>›</b></button><button type="button" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.48)), url(${heroImage})` }} onClick={() => router.push('/dashboard/owner/promos')}><MobileIcon name="promos" /><strong>{t.promos}</strong><span>{t.promoteStore}</span><b>›</b></button><button type="button" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.48)), url(${flyerImage})` }} onClick={() => router.push('/dashboard/owner/rewards')}><MobileIcon name="rewards" /><strong>{t.rewards}</strong><span>Loyalty program</span><b>›</b></button></div></section>
      <section className="mobileExtraStack">{renderWorkersPanel()}{renderTimeCabinetPanel()}<section className="mobileWhitePanel"><h3>{t.storeStatus}</h3><p><i className="greenDotMini" /> {t.liveOnline}</p><div className="statusMiniGrid"><span>{t.account}<b>{getStripeStatusLabel(store, 'account', t)}</b></span><span>{t.charges}<b>{getStripeStatusLabel(store, 'charges', t)}</b></span><span>{t.payouts}<b>{getStripeStatusLabel(store, 'payouts', t)}</b></span></div><button type="button" className="fullBlackBtn" onClick={handleStripeConnect} disabled={connectingStripe}>{stripeState === 'connected' ? t.manageStripe : t.connectStripe}</button></section><section className="mobileWhitePanel" ref={customersRef}><h3>{t.customers}</h3><div className="customerMiniStats"><span>{t.uniqueCustomers}<b>{uniqueCustomers.length}</b></span><span>{t.totalOrders}<b>{orders.length}</b></span></div></section><section className="mobileWhitePanel" ref={storefrontRef}><h3>{t.storefrontLink}</h3><p>{cleanDisplayUrl(storeUrl)}</p><button type="button" className="fullBlackBtn" onClick={copyStoreLink}>{copied ? t.copied : t.copy} {t.shareStore}</button></section>{renderSupportPanel()}</section>
      <nav className="mobileBottomNav"><button type="button" className={activeNav === 'dashboard' ? 'active' : ''} onClick={() => goNav('dashboard')}><MobileIcon name="dashboard" /><em>{t.dashboard}</em></button><button type="button" className={activeNav === 'orders' ? 'active' : ''} onClick={() => goNav('orders')}><MobileIcon name="orders" />{newOrdersCount > 0 ? <b>{newOrdersCount}</b> : null}<em>Orders</em></button><button type="button" className={activeNav === 'workers' ? 'active' : ''} onClick={() => goNav('workers')}><MobileIcon name="workers" /><em>{t.workers}</em></button><button type="button" className={activeNav === 'timecabinet' ? 'active' : ''} onClick={() => goNav('timecabinet')}><MobileIcon name="analytics" /><em>{t.timeCabinet}</em></button><button type="button" className={activeNav === 'builder' ? 'active' : ''} onClick={() => goNav('builder')}><MobileIcon name="builder" /><em>{t.menuBuilder}</em></button><button type="button" className={activeNav === 'support' ? 'active' : ''} onClick={() => goNav('support')}><MobileIcon name="promos" />{unreadMessagesCount > 0 ? <b>{unreadMessagesCount}</b> : null}<em>Support</em></button></nav>
    </div>

    <div className="desktopShell"><aside className="sidebar"><div className="brandBlock"><img src="/orda-logo.png" alt="ORDA Owner Panel" className="brandOwnerLogo" /></div><nav className="navList"><button type="button" className="navBtn active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="navGlyph">▦</span><span>{t.dashboard}</span></button><button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/builder')}><span className="navGlyph">⚙</span><span>{t.storeSettings}</span></button><button type="button" className="navBtn" onClick={() => scrollToRef(workersRef, 'workers')}><span className="navGlyph">☷</span><span>{t.workers}</span>{activeWorkersCount > 0 ? <span className="navCount">{activeWorkersCount}</span> : null}</button><button type="button" className="navBtn" onClick={() => scrollToRef(timeCabinetRef, 'timecabinet')}><span className="navGlyph">▤</span><span>{t.timeCabinet}</span></button><button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/rewards')}><span className="navGlyph">★</span><span>{t.rewards}</span></button><button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/campaigns')}><span className="navGlyph">✉</span><span>{t.smsCampaigns}</span></button><button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/analytics')}><span className="navGlyph">◔</span><span>{t.analytics}</span></button><button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/customers')}><span className="navGlyph">◎</span><span>{t.customerCrm}</span></button><button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/promos')}><span className="navGlyph">%</span><span>{t.promos}</span></button><button type="button" className="navBtn" onClick={() => scrollToRef(liveOrdersRef)}><span className="navGlyph">☰</span><span>{t.liveOrders}</span>{newOrdersCount > 0 ? <span className="navCount">{newOrdersCount}</span> : null}</button><button type="button" className="navBtn" onClick={() => scrollToSupport()}><span className="navGlyph">✉</span><span>{t.supportTitle}</span>{unreadMessagesCount > 0 ? <span className="navCount">{unreadMessagesCount}</span> : null}</button><button type="button" className="navBtn" onClick={handleStripeConnect} disabled={connectingStripe}><span className="navGlyph">◫</span><span>{stripeState === 'connected' ? t.stripeConnected : t.connectStripe}</span></button><button type="button" className="navBtn" onClick={() => router.push('/dashboard/owner/flyers')}><span className="navGlyph">⚑</span><span>{t.marketing}</span><span className="newPill">{t.new}</span></button></nav><div className="sidebarStoreCard"><div className="storeCardTop"><img src={logoImage || '/orda-logo.png'} alt={storeName} className="storeThumbImage" /><div className="storeCardInfo"><div className="storeCardName">{storeName}</div><div className="liveMiniPill">{t.live}</div><div className="storeCardPlan">{store?.plan || 'Starter Plan'}</div></div></div><button type="button" className="linea sidebarFullBtn" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>{t.openStorefront} <span>↗</span></button></div></aside>
      <section className="mainArea"><header className="heroRow"><div className="heroCopy"><div className="welcomeLine">{t.welcome}, {storeName}</div><h1>{t.storeLive}<span className="heroLiveDot" /></h1><p>{formatClock(now)} • {formatDayDate(now)}</p></div><div className="heroTools"><div className="headerSearch"><span className="headerSearchIcon">⌕</span><input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder={t.searchPlaceholder} /></div><div className="languageBox"><small>{t.language}</small><div><button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => changeOwnerLanguage('en')}>EN</button><button type="button" className={lang === 'es' ? 'active' : ''} onClick={() => changeOwnerLanguage('es')}>ES</button></div></div><NotificationBell /><button type="button" className="lightBtn" onClick={() => router.push('/dashboard/owner/builder')}>{t.openBuilder}</button><button type="button" className="linea" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>{t.viewStore} <span>→</span></button></div></header>
      {error ? <div className="errorBanner">{error}</div> : null}
      <div className="kpiGrid premiumKpiGrid"><section className="kpiCard premiumKpiCard"><div className="premiumKpiPhoto"><img src="https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=500&q=85" alt="Money and sales" /></div><div className="premiumKpiText"><div className="kpiLabel">{t.todaysSales}</div><div className="kpiValue">{formatMoney(todaysSales)}</div><div className="kpiMeta greenText">{todaysOrders ? t.liveToday : t.noOrdersToday}</div></div></section><section className="kpiCard premiumKpiCard"><div className="premiumKpiPhoto"><img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=500&q=85" alt="Workers helping customers" /></div><div className="premiumKpiText"><div className="kpiLabel">{t.workers}</div><div className="kpiValue">{activeWorkersCount}</div><div className="kpiMeta greenText">{t.staffAccess}</div></div></section><section className="kpiCard premiumKpiCard"><div className="premiumKpiPhoto"><img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=500&q=85" alt="Customer orders" /></div><div className="premiumKpiText"><div className="kpiLabel">{t.newOrders}</div><div className="kpiValue">{newOrdersCount}</div><div className="kpiMeta redText">{newOrdersCount ? t.needsAction : t.noNewOrders}</div></div></section><section className="kpiCard premiumKpiCard"><div className="premiumKpiPhoto"><img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=85" alt="Messages and support" /></div><div className="premiumKpiText"><div className="kpiLabel">{t.unreadMessages}</div><div className="kpiValue">{unreadMessagesCount}</div><div className="kpiMeta greenText">{messages.length ? t.messages : t.noMessages}</div></div></section></div>
      <div className="contentGrid"><div className="primaryColumn"><section className="panel liveOrdersPanel" ref={liveOrdersRef}><div className="panelTop"><div className="panelTitleWrap"><h2>{t.liveOrders}</h2>{newOrdersCount > 0 ? <span className="newOrdersBadge">{newOrdersCount} {t.new}</span> : null}</div><button type="button" className="linkBtn" onClick={() => setOrderFilter('ALL')}>{t.viewAllOrders}</button></div><div className="filters">{([['ALL', t.all, orders.length], ['NEW', t.new, newOrdersCount], ['IN_PROGRESS', t.inProgress, inProgressCount], ['READY', t.almostReady, readyCount], ['DONE', t.completed, completedCount]] as [OrderFilterKey, string, number][]).map(([filter, label, count]) => <button key={filter} type="button" className={`filterChip ${orderFilter === filter ? 'active' : ''}`} onClick={() => setOrderFilter(filter)}><span>{label}</span><strong>{count}</strong></button>)}</div><div className="ordersTable">{filteredOrders.length ? filteredOrders.slice(0, 20).map(order => { const primaryAction = getPrimaryAction(order.status, t); const statusKey = getStatusKey(order.status); return <article key={order.id} className={`orderCard ${statusKey}`}><div className="orderIdBlock"><div className="orderCode">#{order.id.slice(0, 5).toUpperCase()}</div><div className="orderAgoText">{minutesAgo(order.created_at, t)}</div></div><div className="avatar">{getInitials(order.customer_name)}</div><div className="orderCustomerBlock"><div className="orderCustomerName">{order.customer_name || t.customer}</div><div className="orderCustomerPhone">{order.customer_phone || store?.phone || t.noPhone}</div></div><div className="orderItemsBlock"><div className="orderItemsText">{normalizeOrderItemsSummary(order, t)}</div></div><div className="orderAmountBlock"><div className="orderAmount">{formatMoney(getOrderAmount(order))}</div></div><div className="orderStatusBlock"><span className={getStatusBadgeClass(order.status)}>{getStatusLabel(order.status, t)}</span></div><div className="orderActionsBlock">{primaryAction ? <button type="button" className="linea rowBtn" disabled={updatingOrderId === order.id} onClick={() => updateOrderStatus(order.id, primaryAction.action)}>{updatingOrderId === order.id ? t.updating : primaryAction.label}</button> : <button type="button" className="lightLineBtn rowBtn" onClick={() => setSearch(order.customer_name || '')}>{t.viewDetails}</button>}{statusKey !== 'completed' && statusKey !== 'cancelled' ? <button type="button" className="lightLineBtn rowBtn" disabled={updatingOrderId === order.id} onClick={() => updateOrderStatus(order.id, 'cancel')}>{statusKey === 'new' ? t.decline : t.cancel}</button> : null}</div></article>; }) : <div className="emptyBox">{t.noOrdersYet}</div>}</div></section><section className="panel salesPanel"><div className="salesPanelTop"><div><h3>{t.salesOverview}</h3><div className="salesBigRow"><strong>{formatMoney(revenueTotal)}</strong><span>{t.weeklyLiveView}</span></div></div><button type="button" className="selectorBtn">{t.thisWeek}</button></div><div className="chartShell"><div className="chartYAxis"><span>${Math.round(chartMax)}</span><span>${Math.round(chartMax * .66)}</span><span>${Math.round(chartMax * .33)}</span><span>$0</span></div><div className="chartArea"><svg viewBox="0 0 570 216" preserveAspectRatio="none" className="chartSvg"><defs><linearGradient id="desktopArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#111827" stopOpacity="0.16" /><stop offset="100%" stopColor="#111827" stopOpacity="0.02" /></linearGradient></defs><path d={areaPath} fill="url(#desktopArea)" /><path d={chartPath} fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{chartPoints.map(p => <circle key={p.label} cx={p.x} cy={p.y} r="5" fill="#111827" />)}</svg><div className="chartDays">{salesSeries.map(p => <span key={p.label}>{p.label}</span>)}</div></div></div></section></div>
      <div className="secondaryColumn">{renderWorkersPanel(true)}{renderTimeCabinetPanel(true)}<section className="panel"><h3>{t.storeStatus}</h3><div className="statusLiveRow"><span className="greenDot" /><span>{t.liveOnline}</span></div><div className="stripeStatusCard"><div className="stripeStatusTop"><strong>{t.stripeStatus}</strong><button type="button" className="miniManageBtn" onClick={handleStripeConnect} disabled={connectingStripe}>{stripeState === 'connected' ? t.manageStripe : stripeState === 'incomplete' ? t.finishSetup : t.connect}</button></div><div className="stripeStatusRows">{(['account', 'charges', 'payouts'] as const).map(type => <div className="stripeStatusRow" key={type}><span>{type === 'account' ? t.account : type === 'charges' ? t.charges : t.payouts}</span><strong>{getStripeStatusLabel(store, type, t)}</strong></div>)}</div></div></section><section className="promoFlyerCard"><div className="promoFlyerText"><h3>{t.boostSales}</h3><p>{t.flyerText}</p><button type="button" className="linea promoCreateBtn" onClick={() => router.push('/dashboard/owner/flyers')}>{t.createFlyers}</button></div><button type="button" className="promoVisual flyerPreviewButton" onClick={() => router.push('/dashboard/owner/flyers')}><img src={flyerImage} alt="ORDA flyer preview" className="promoFlyerImage" /></button></section><section className="panel promoToolsPanel"><h3>{t.promos} & {t.rewards}</h3><p className="sectionSub">Create promos, rewards, and customer offers from the owner dashboard.</p><div className="promoToolsGrid"><button type="button" className="lightLineBtn rowBtn" onClick={() => router.push('/dashboard/owner/promos')}>{t.promos}</button><button type="button" className="lightLineBtn rowBtn" onClick={() => router.push('/dashboard/owner/rewards')}>{t.rewards}</button><button type="button" className="lightLineBtn rowBtn" onClick={() => router.push('/dashboard/owner/campaigns')}>{t.smsCampaigns}</button></div></section><section className="panel" ref={customersRef}><h3>{t.customers}</h3><p className="sectionSub">{t.customerActivity}</p><div className="customerSummaryRow"><div className="customerSummaryBox"><span>{t.uniqueCustomers}</span><strong>{uniqueCustomers.length}</strong></div><div className="customerSummaryBox"><span>{t.totalOrders}</span><strong>{orders.length}</strong></div></div></section><section className="panel"><h3>{t.topItems}</h3><div className="topItemsList">{topItems.length ? topItems.map((item, index) => <div key={`${item.name}-${index}`} className="topItemRow"><div className="topItemLeft"><div className="topItemRank">{index + 1}</div><span>{item.name}</span></div><div className="topItemRight"><span>{item.qty} {t.sold}</span><strong>{formatMoney(item.qty * averageOrderValue)}</strong></div></div>) : <div className="emptyBox">{t.noTopItems}</div>}</div></section>{renderSupportPanel(true)}</div></div></section></div><style jsx global>{dashboardStyles}</style></main>;
}

const dashboardStyles = `
:root{color-scheme:light}*{box-sizing:border-box}html,body{margin:0;background:#f6f7f9;color:#0c0d10;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-x:hidden}button,input,textarea,select{font-family:inherit}button{cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}.ownerDashboardLoading,.ownerPage{width:100%;min-height:100vh;background:#f6f7f9;overflow-x:hidden}.loadingCard{width:min(100%,720px);margin:80px auto;padding:24px;border-radius:24px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(15,23,42,.08);font-weight:950;text-align:center}.ownerAgreementPage{min-height:100vh;background:radial-gradient(circle at top,#fff 0,#f4f6fa 42%,#e8edf5 100%);display:grid;place-items:center;padding:24px}.agreementCard{width:min(100%,760px);background:rgba(255,255,255,.96);border:1px solid #dfe5ee;border-radius:32px;box-shadow:0 30px 90px rgba(15,23,42,.16);padding:30px}.agreementCard img{width:220px;display:block;margin:0 auto 12px}.agreementCard small{display:block;text-align:center;color:#64748b;font-weight:1000;letter-spacing:.16em}.agreementCard h1{margin:12px 0 8px;text-align:center;font-size:38px;line-height:.95;letter-spacing:-.05em}.agreementCard>p{text-align:center;color:#475569;font-weight:850;line-height:1.45;margin:0 auto 22px;max-width:620px}.agreementList{display:grid;grid-template-columns:34px 1fr;gap:12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:22px;padding:18px}.agreementList span{width:34px;height:34px;border-radius:999px;background:#111827;color:#fff;display:grid;place-items:center;font-weight:1000}.agreementList p{margin:6px 0;color:#1f2937;font-weight:800;line-height:1.35}.agreementCheck{margin-top:18px;display:flex!important;align-items:center;gap:12px;background:#fff;border:1px solid #dfe5ee;border-radius:18px;padding:16px;color:#111827}.agreementCheck input{width:24px;height:24px;accent-color:#111827}.agreementButton{width:100%;height:62px;margin-top:16px;border:0;border-radius:18px;background:linear-gradient(180deg,#111827,#030712);color:#fff;font-size:18px;font-weight:1000;box-shadow:0 18px 38px rgba(15,23,42,.22)}.agreementError{padding:12px 14px;border-radius:14px;background:#fff1f2;color:#be123c;border:1px solid #fecdd3;font-weight:900;margin-bottom:14px}.agreementLang{display:flex;justify-content:center;gap:8px;margin-top:14px}.agreementLang button{width:62px;height:42px;border:1px solid #dfe5ee;border-radius:12px;background:#fff;font-weight:1000}.agreementLang button.active{background:#111827;color:#fff}.desktopShell{display:none}.mobileFrame{display:block;width:100%;min-height:100vh;padding:0 16px 110px;background:#fbfbfc}.mobileTopbar{height:74px;display:grid;grid-template-columns:56px 1fr auto;align-items:center;border-bottom:1px solid #e9eaee;margin:0 -16px;padding:0 16px;background:#fff;position:sticky;top:0;z-index:50}.hamburgerBtn{width:48px;height:48px;border:1px solid #e6e9ee;background:linear-gradient(180deg,#fff,#f5f7fb);border-radius:16px;display:grid;gap:5px;align-content:center;justify-content:center;padding:0;box-shadow:0 8px 22px rgba(15,23,42,.06)}.hamburgerBtn span{width:22px;height:2px;background:#0b0f17;border-radius:999px;display:block}.mobileLogo{height:42px;width:auto;justify-self:center}.mobileTopActions{display:flex;gap:12px;align-items:center}.notificationWrap{position:relative}.bellBtn,.notificationBtn{position:relative;width:46px;height:46px;border:1px solid #e6e9ee;background:linear-gradient(180deg,#fff,#f5f7fb);border-radius:16px;font-size:19px;color:#0b0f17;box-shadow:0 8px 22px rgba(15,23,42,.06)}.notificationBtn{width:56px}.bellBtn b,.notificationBtn b,.mobileBottomNav b{position:absolute;right:-3px;top:-5px;background:#ef4444;color:#fff;border-radius:999px;min-width:21px;height:21px;padding:0 6px;font-size:11px;display:grid;place-items:center}.notificationMenu{position:absolute;right:0;top:58px;width:min(340px,calc(100vw - 32px));background:#fff;border:1px solid #e5e7eb;border-radius:20px;box-shadow:0 24px 90px rgba(15,23,42,.22);z-index:100;padding:12px}.notificationHead{display:flex;justify-content:space-between;align-items:center;padding:8px}.notificationHead strong{font-size:16px;font-weight:1000}.notificationHead button{border:0;background:#f1f5f9;border-radius:999px;padding:8px 10px;font-size:12px;font-weight:950}.notificationItem{width:100%;border:1px solid #edf0f3;background:#fff;border-radius:16px;padding:12px;display:flex;gap:12px;text-align:left;margin-top:8px}.notificationItem>span{width:38px;height:38px;border-radius:12px;background:#111827;color:#fff;display:grid;place-items:center}.notificationItem strong{display:block;font-size:14px}.notificationItem small{display:block;color:#64748b;font-weight:800;margin-top:3px}.storeAvatarBtn{width:44px;height:44px;border:0;padding:0;background:transparent}.storeAvatarBtn img{width:44px;height:44px;border-radius:999px;object-fit:cover}.mobileDrawer{position:fixed;left:16px;right:16px;top:82px;z-index:60;background:#fff;border:1px solid #e5e7eb;border-radius:22px;box-shadow:0 20px 80px rgba(15,23,42,.18);padding:14px;display:grid;gap:8px}.mobileDrawer button{height:48px;border:1px solid #edf0f3;background:#fff;border-radius:14px;font-weight:950;text-align:left;padding:0 14px}.drawerLang{display:grid;grid-template-columns:1fr 1fr;gap:8px}.drawerLang button{text-align:center}.drawerLang button.active{background:#111;color:#fff}.mobileIntro{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:26px 0 18px}.mobileIntro h1{font-size:25px;line-height:1;margin:0;font-weight:1000;letter-spacing:-.04em}.mobileIntro p{margin:8px 0 0;color:#3f4650;font-size:16px;font-weight:650}.mobileIntro button{height:56px;min-width:142px;border:0;border-radius:18px;background:linear-gradient(180deg,#111827 0%,#030712 100%);color:#fff;font-weight:950;font-size:15px;box-shadow:0 18px 36px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.16);letter-spacing:-.01em}.mobileError,.errorBanner{padding:14px;border-radius:16px;background:#fff1f2;color:#be123c;border:1px solid #fecdd3;font-weight:850;margin-bottom:16px}.storeHeroCard{min-height:250px;border-radius:18px;background-size:cover;background-position:center right;border:1px solid #e3e6ea;box-shadow:0 22px 55px rgba(15,23,42,.11)!important;position:relative;overflow:hidden;padding:28px}.storeHeroContent{max-width:58%;position:relative;z-index:2}.storeHeroContent h2{font-size:29px;line-height:1.05;letter-spacing:-.045em;margin:0 0 14px;font-weight:1000}.storeHeroContent h2 span{font-size:18px;background:#050505;color:#fff;border-radius:999px;padding:2px 5px;vertical-align:middle}.storeLivePill{display:inline-flex;align-items:center;gap:8px;border-radius:10px;background:#dcfce7;color:#14532d;font-weight:900;padding:8px 13px;margin-bottom:18px}.storeLivePill i,.greenDotMini{width:10px;height:10px;border-radius:999px;background:#10b981;display:inline-block}.storeHeroContent p{font-size:15px;font-weight:750;color:#2f3742;margin:11px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.editStoreBtn{position:absolute;right:18px;bottom:18px;height:50px;border:1px solid rgba(255,255,255,.65);border-radius:16px;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);color:#050505;font-size:15px;font-weight:1000;padding:0 20px;box-shadow:0 18px 36px rgba(15,23,42,.22),inset 0 1px 0 rgba(255,255,255,.9)}.glanceHeader,.sectionTitleRow{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:26px}.glanceHeader h2,.sectionTitleRow h2,.mobileQuickActions h2{font-size:18px;margin:0;font-weight:1000;letter-spacing:-.02em}.glanceHeader button,.sectionTitleRow button{height:48px;border:1px solid #e3e6ea;background:#fff;border-radius:14px;padding:0 16px;font-weight:850}.mobileKpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}.mobileKpiCard{min-height:146px;border:1px solid #e3e7ee;background:linear-gradient(180deg,#fff 0%,#fbfcff 100%);border-radius:22px;padding:17px;box-shadow:0 14px 34px rgba(15,23,42,.055);display:grid;align-content:start}.iconCircle{width:42px;height:42px;border-radius:16px;background:linear-gradient(180deg,#111827,#030712);color:#fff;display:grid;place-items:center;font-weight:950;margin-bottom:14px;box-shadow:0 12px 28px rgba(15,23,42,.18),inset 0 1px 0 rgba(255,255,255,.14)}.miniSvg{font-size:24px;font-weight:1000}.mobileKpiCard span{font-size:14px;font-weight:850;color:#242a33}.mobileKpiCard strong{font-size:25px;line-height:1;margin:11px 0 8px;font-weight:1000;letter-spacing:-.04em}.mobileKpiCard em{font-style:normal;color:#16a34a;font-size:13px;font-weight:850}.mobileChartCard,.mobileWhitePanel{margin-top:22px;border:1px solid #e4e7ec;background:#fff;border-radius:22px!important;padding:18px;box-shadow:0 16px 36px rgba(15,23,42,.055)!important}.chartTopMobile{display:flex;justify-content:space-between;gap:10px;align-items:center}.chartTopMobile h2{font-size:18px;margin:0;font-weight:1000}.chartTopMobile button{border:0;background:transparent;font-weight:900;font-size:14px}.mobileChartCard>strong{display:block;font-size:25px;margin-top:22px;font-weight:1000}.mobileChartCard>em{display:block;font-style:normal;color:#16a34a;font-size:14px;font-weight:850;margin-top:4px}.mobileSalesChart{width:100%;height:220px;margin-top:10px;filter:drop-shadow(0 12px 20px rgba(15,23,42,.09))}.mobileChartLabels{display:grid;grid-template-columns:repeat(7,1fr);font-size:12px;color:#252a33;font-weight:850;text-align:center;margin-top:-10px;gap:2px}.sectionTitleRow h2 b{display:inline-grid;place-items:center;min-width:26px;height:26px;border-radius:999px;background:#111;color:#fff;font-size:13px;margin-left:6px}.mobileLiveOrders{margin-top:28px}.mobileLiveOrders .sectionTitleRow{margin-top:0}.mobileOrderCard{min-height:110px;background:#fff;border:1px solid #e4e7ec;border-radius:14px;display:grid;grid-template-columns:116px minmax(0,1fr) 88px 146px;gap:16px;align-items:center;padding:12px;margin-top:10px;box-shadow:0 8px 20px rgba(15,23,42,.035)}.mobileOrderCard>img{width:116px;height:86px;border-radius:10px;object-fit:cover}.mobileOrderInfo{min-width:0}.mobileOrderInfo strong{display:block;font-size:18px;font-weight:1000}.mobileOrderInfo span{display:block;font-size:14px;color:#2f3742;font-weight:650;margin-top:5px}.mobileOrderInfo em{display:block;font-style:normal;font-size:14px;color:#2f3742;font-weight:750;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.statusBadge{height:32px;padding:0 14px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;font-size:13px;font-weight:950}.statusBadge.new{background:#fff0d9;color:#8a5a00}.statusBadge.progress{background:#eff6ff;color:#2563eb}.statusBadge.ready{background:#fff7ed;color:#b45309}.statusBadge.completed{background:#ecfdf3;color:#16a34a}.statusBadge.cancelled{background:#f1f5f9;color:#64748b}.acceptMobile{height:48px;border:0;border-radius:15px;background:linear-gradient(180deg,#111827,#030712);color:#fff;font-size:15px;font-weight:1000;box-shadow:0 14px 28px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.15)}.emptyMobile{padding:28px;background:#fff;border:1px dashed #d1d5db;border-radius:16px;color:#64748b;font-weight:850;text-align:center;margin-top:12px}.mobileQuickActions{margin-top:28px}.mobileActionGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}.mobileActionGrid button{height:122px;border:0;border-radius:20px;background-size:cover;background-position:center;color:#fff;text-align:left;padding:18px;position:relative;overflow:hidden;display:grid;align-content:end;box-shadow:0 18px 38px rgba(15,23,42,.16),inset 0 1px 0 rgba(255,255,255,.12);isolation:isolate}.mobileActionGrid button::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.14),rgba(0,0,0,.78));z-index:0}.mobileActionGrid button::after{content:'';position:absolute;inset:0;border:1px solid rgba(255,255,255,.18);border-radius:20px;z-index:1;pointer-events:none}.mobileActionGrid button>*{position:relative;z-index:2}.mobileActionGrid strong{font-size:17px;font-weight:1000}.mobileActionGrid span:not(:first-child){font-size:13px;opacity:.92;font-weight:800}.mobileActionGrid b{position:absolute;right:16px;top:18px;width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,.18);display:grid;place-items:center;font-size:25px;z-index:2}.mobileExtraStack{display:grid;gap:14px;margin-top:24px}.mobileWhitePanel h3{margin:0 0 10px;font-size:18px;font-weight:1000}.mobileWhitePanel p{margin:7px 0;color:#374151;font-weight:750}.statusMiniGrid,.customerMiniStats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.customerMiniStats{grid-template-columns:1fr 1fr}.statusMiniGrid span,.customerMiniStats span{background:#f7f8fa;border:1px solid #edf0f3;border-radius:12px;padding:12px;color:#64748b;font-size:12px;font-weight:850}.statusMiniGrid b,.customerMiniStats b{display:block;margin-top:5px;color:#111;font-size:14px}.fullBlackBtn{width:100%;height:50px;border:0;border-radius:12px;background:#050505;color:#fff;font-weight:950;margin-top:14px}.mobileBottomNav{position:fixed;left:0;right:0;bottom:0;height:88px;background:rgba(255,255,255,.96);backdrop-filter:blur(22px);border-top:1px solid #e5e7eb;display:grid;grid-template-columns:repeat(6,1fr);z-index:80;padding:9px 8px 13px;box-shadow:0 -16px 34px rgba(15,23,42,.08)}.mobileBottomNav button{border:0;background:transparent;position:relative;display:grid;place-items:center;align-content:center;gap:4px;color:#4b5563;font-weight:900}.mobileBottomNav button.active{color:#050505}.mobileBottomNav em{font-style:normal;font-size:12px}.sidebar,.panel,.kpiCard,.promoFlyerCard,.sidebarStoreCard{background:rgba(255,255,255,.9);border:1px solid #dfe5ee;box-shadow:0 12px 30px rgba(15,23,42,.045)}.desktopShell{width:100%;max-width:1880px;margin:0 auto;grid-template-columns:270px minmax(0,1fr);gap:24px;align-items:start;padding:14px}.sidebar{position:sticky;top:12px;width:270px;border-radius:24px;padding:16px;display:grid;gap:16px}.brandBlock{display:flex;justify-content:center}.brandOwnerLogo{width:100%;height:auto;max-height:105px;object-fit:contain}.navList{display:grid;gap:10px}.navBtn{min-height:54px;border:1px solid #dfe5ee;border-radius:16px;background:#fff;display:flex;align-items:center;gap:14px;padding:0 16px;font-size:15px;font-weight:900;color:#111827;text-align:left}.navBtn:hover,.navBtn.active{background:linear-gradient(135deg,#fff,#e7edf6)}.navGlyph{width:22px;text-align:center;color:#64748b}.navCount{margin-left:auto;min-width:26px;height:26px;border-radius:999px;background:#ef4444;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:950}.newPill,.liveMiniPill{border-radius:999px;background:#dcfce7;color:#16a34a;font-size:12px;font-weight:950}.newPill{margin-left:auto;padding:5px 10px}.sidebarStoreCard{border-radius:20px;padding:16px}.storeCardTop{display:flex;align-items:center;gap:14px}.storeThumbImage{width:62px;height:62px;object-fit:cover;border-radius:16px;border:1px solid #dfe5ee;background:#f8fafc}.storeCardName{font-size:18px;font-weight:950;line-height:1.08}.liveMiniPill{display:inline-flex;margin-top:6px;padding:5px 12px}.storeCardPlan{margin-top:6px;color:#64748b;font-weight:800;font-size:13px}.linea,.lightBtn{min-height:50px;border-radius:16px;border:1px solid rgba(255,255,255,.12)!important;font-weight:950;background:linear-gradient(180deg,#111827 0%,#050505 100%)!important;color:#fff!important;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 14px 30px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.14)!important}.lightBtn,.lightLineBtn,.selectorBtn,.filterChip,.miniManageBtn{border:1px solid #dfe4ec!important;background:linear-gradient(180deg,#ffffff,#f7f9fc)!important;color:#111827!important;box-shadow:0 10px 22px rgba(15,23,42,.055),inset 0 1px 0 #fff!important}.sidebarFullBtn{width:100%;margin-top:16px}.mainArea{min-width:0;display:grid;gap:20px}.heroRow{display:grid;grid-template-columns:minmax(0,1fr) minmax(760px,1fr);gap:20px;align-items:start}.welcomeLine{color:#64748b;font-weight:900;font-size:16px}.heroCopy h1{margin:8px 0 6px;font-size:42px;line-height:1;font-weight:950;display:flex;align-items:center;gap:12px}.heroLiveDot,.greenDot{width:13px;height:13px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 7px rgba(34,197,94,.12)}.heroCopy p{margin:0;color:#64748b;font-weight:850;font-size:16px}.heroTools{display:grid;grid-template-columns:minmax(0,1fr) 130px 64px 150px 150px;gap:14px}.headerSearch{min-height:52px;border:1px solid #dfe5ee;border-radius:16px;background:#fff;display:flex;align-items:center;gap:12px;padding:0 16px;color:#64748b}.headerSearch input{width:100%;border:0;outline:0;background:transparent;font-size:15px;font-weight:750;color:#111827}.languageBox{min-height:52px;border:1px solid #dfe5ee;border-radius:16px;background:#fff;padding:6px;display:grid;gap:4px}.languageBox small{color:#64748b;font-size:10px;font-weight:950;text-align:center}.languageBox div{display:grid;grid-template-columns:1fr 1fr;gap:4px}.languageBox button{border:0;border-radius:10px;background:#f1f5f9;font-size:12px;font-weight:950}.languageBox button.active{background:#111827;color:#fff}.kpiGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.kpiCard{min-height:132px;border-radius:22px;padding:22px;display:grid;grid-template-columns:62px minmax(0,1fr);gap:18px;align-items:center}.kpiIcon{width:62px;height:62px;border-radius:18px;font-size:28px;display:grid;place-items:center;font-weight:950}.kpiIcon.green{background:#dcfce7;color:#16a34a}.kpiIcon.blue{background:#dbeafe;color:#2563eb}.kpiIcon.orange{background:#ffedd5;color:#f97316}.kpiIcon.purple{background:#ede9fe;color:#7c3aed}.kpiLabel{color:#64748b;font-weight:900;font-size:14px}.kpiValue{margin-top:6px;font-size:26px;font-weight:950;line-height:1}.kpiMeta{margin-top:10px;font-weight:900;font-size:13px}.greenText{color:#16a34a}.redText{color:#ef4444}.contentGrid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(360px,440px);gap:20px;align-items:start;width:100%}.primaryColumn,.secondaryColumn{min-width:0;display:grid;gap:20px}.panel{border-radius:24px;padding:20px;min-width:0}.panel h2,.panel h3{margin:0;font-size:20px;font-weight:950}.sectionSub{margin:8px 0 0;color:#64748b;font-size:14px;font-weight:800}.panelTop,.salesPanelTop{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.panelTitleWrap{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.newOrdersBadge{height:28px;border-radius:999px;background:#fff1f2;color:#ef4444;display:inline-flex;align-items:center;justify-content:center;padding:0 12px;font-size:13px;font-weight:950}.linkBtn{border:0;background:transparent;color:#64748b;font-size:14px;font-weight:950}.filters{margin-top:18px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.filterChip{min-height:42px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:950}.filterChip.active{background:linear-gradient(180deg,#111827,#050505)!important;color:#fff!important;border-color:#111827!important}.ordersTable{display:grid;gap:12px;margin-top:18px}.orderCard{min-height:84px;border-radius:18px;border:1px solid #e8edf4;background:#fff;display:grid;grid-template-columns:94px 46px minmax(120px,.9fr) minmax(170px,1.15fr) 92px 120px minmax(140px,1fr);gap:12px;align-items:center;padding:12px 14px;position:relative;overflow:hidden}.orderCard::before{content:'';position:absolute;left:0;top:12px;bottom:12px;width:4px;border-radius:999px}.orderCard.new::before{background:#ef4444}.orderCard.in_progress::before{background:#2563eb}.orderCard.ready::before{background:#f59e0b}.orderCard.completed::before{background:#16a34a}.orderCard.cancelled::before{background:#94a3b8}.orderCode{font-size:14px;font-weight:950}.orderAgoText{margin-top:8px;font-size:13px;color:#64748b;font-weight:750}.avatar,.workerAvatar{width:42px;height:42px;border-radius:999px;display:grid;place-items:center;font-size:18px;font-weight:950;background:#f1f5f9;color:#111}.orderCustomerName{font-size:15px;font-weight:950}.orderCustomerPhone,.orderItemsText{margin-top:6px;font-size:14px;color:#64748b;font-weight:750;line-height:1.35}.orderAmount{font-size:15px;font-weight:950}.orderActionsBlock{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}.rowBtn{min-height:42px;padding:0 16px;border-radius:12px;font-size:14px;font-weight:950}.lightLineBtn{border:1px solid #dbe2ea;background:#fff;color:#64748b}.emptyBox{border:1px dashed #dbe2ea;border-radius:18px;padding:24px;text-align:center;color:#64748b;font-size:15px;font-weight:850}.salesPanel{min-height:380px;display:grid;grid-template-rows:auto 1fr}.salesBigRow{margin-top:10px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}.salesBigRow strong{font-size:24px;font-weight:950}.salesBigRow span{color:#16a34a;font-weight:950;font-size:13px}.selectorBtn{min-height:42px;padding:0 16px;border-radius:14px}.chartShell{width:100%;height:100%;min-height:270px;margin-top:18px;display:grid;grid-template-columns:60px minmax(0,1fr);gap:12px;align-items:stretch}.chartYAxis{display:flex;flex-direction:column;justify-content:space-between;padding:10px 0 30px;color:#64748b;font-size:13px;font-weight:900}.chartArea{min-width:0;width:100%;display:grid;grid-template-rows:1fr auto;overflow:hidden}.chartSvg{width:100%;height:250px;display:block;filter:drop-shadow(0 14px 22px rgba(15,23,42,.10))}.chartDays{margin-top:8px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));text-align:center;color:#64748b;font-size:13px;font-weight:900}.stripeStatusCard{margin-top:16px;border:1px solid #dfe5ee;background:#fff;border-radius:18px;padding:16px}.stripeStatusTop,.stripeStatusRow{display:flex;justify-content:space-between;align-items:center;gap:14px}.stripeStatusRows{margin-top:14px;display:grid;gap:12px}.miniManageBtn{min-height:34px;padding:0 12px;border-radius:10px;font-size:13px;font-weight:950}.stripeStatusRow{color:#475569;font-weight:800;font-size:14px}.statusLiveRow{margin-top:12px;display:flex;align-items:center;gap:12px;color:#64748b;font-weight:850}.promoFlyerCard{border-radius:24px;padding:20px;background:linear-gradient(180deg,#fff8df,#fff0bd);display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:18px;align-items:center;border-color:#f3e3b0}.promoFlyerText h3{margin:0;font-size:22px;font-weight:950}.promoFlyerText p{color:#475569;font-weight:850;line-height:1.45}.promoCreateBtn{margin-top:14px}.flyerPreviewButton{padding:0;border:none}.promoVisual{width:100%;height:180px;border-radius:18px;overflow:hidden;background:#111827;box-shadow:0 16px 32px rgba(15,23,42,.18)}.promoFlyerImage{width:100%;height:100%;object-fit:cover}.customerSummaryRow{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.customerSummaryBox{border:1px solid #dfe5ee;background:#fff;border-radius:16px;padding:16px}.customerSummaryBox span{color:#64748b;font-weight:850}.customerSummaryBox strong{display:block;margin-top:8px;font-size:28px;font-weight:950}.topItemsList{display:grid;gap:14px;margin-top:16px}.topItemRow{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e8edf4;border-radius:16px;padding:14px;background:#fff}.topItemLeft,.topItemRight{display:flex;align-items:center;gap:10px;min-width:0}.topItemRank{width:26px;height:26px;border-radius:999px;background:#f1f5f9;color:#64748b;display:grid;place-items:center;font-size:12px;font-weight:950;flex-shrink:0}.topItemLeft span{font-size:14px;font-weight:850;word-break:break-word}.topItemRight{flex-shrink:0}.topItemRight span{font-size:13px;color:#64748b;font-weight:800}.topItemRight strong{font-size:14px;font-weight:950;white-space:nowrap}.supportPanel{margin-top:0}.supportInputs{display:grid;gap:12px;margin-top:14px}.supportInputs input,.supportInputs textarea,.workerForm input,.workerForm select{width:100%;touch-action:manipulation;-webkit-user-select:text;user-select:text;border-radius:14px;border:1px solid #dfe5ee;background:#fff;padding:0 16px;font-size:15px;font-weight:800;outline:none;color:#111827;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)}.supportInputs input,.workerForm input,.workerForm select{height:54px}.supportInputs textarea{min-height:142px;padding:16px;resize:vertical;line-height:1.4}.desktopSupportInputs textarea{min-height:180px}.supportSuccess{margin-top:14px;padding:14px;border-radius:14px;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;font-weight:950}.supportSendBtn{width:100%;margin-top:14px}.promoToolsGrid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:14px}.promoToolsGrid .rowBtn{width:100%;justify-content:center}.messageThread{margin-top:16px;display:grid;gap:10px}.messageThreadTop{display:flex;justify-content:space-between;align-items:center}.messageThreadTop strong{font-size:14px;font-weight:1000}.messageThreadTop span{background:#111827;color:#fff;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:950}.messageBubble{border:1px solid #e8edf4;background:#fff;border-radius:16px;padding:14px}.messageBubble.unread{border-color:#f97316;background:#fff7ed}.messageBubble>div:first-child{display:flex;justify-content:space-between;gap:10px}.messageBubble b{font-size:14px}.messageBubble small{font-size:12px;color:#64748b;font-weight:850}.messageBubble p{margin:8px 0 0;color:#334155;font-size:14px;line-height:1.4}.adminReply{margin-top:12px;background:#f1f5f9;border-radius:14px;padding:12px}.adminReply strong{font-size:12px;color:#111827}.adminReply p{font-weight:800}.workersPanel{scroll-margin-top:90px}.workersTop{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.workerLoginCopy{height:42px;border-radius:12px;padding:0 12px;font-size:13px;font-weight:950}.workerLoginBox{margin-top:14px;border:1px solid #dfe5ee;background:#f8fafc;border-radius:16px;padding:14px;display:grid;gap:6px}.workerLoginBox span{font-size:12px;color:#64748b;font-weight:950;text-transform:uppercase;letter-spacing:.06em}.workerLoginBox strong{font-size:14px;color:#111827;font-weight:950;word-break:break-all}.workerForm{display:grid;grid-template-columns:1fr;gap:12px;margin-top:14px}.workerField{display:grid;gap:8px}.workerField span{font-size:12px;font-weight:1000;color:#64748b;text-transform:uppercase;letter-spacing:.08em}.workerField input,.workerField select{width:100%;height:58px;border-radius:16px!important;border:1px solid #cfd8e3!important;background:#fff!important;color:#111827!important;font-size:16px!important;font-weight:900!important;padding:0 16px!important;box-shadow:0 8px 20px rgba(15,23,42,.045),inset 0 1px 0 rgba(255,255,255,.9)!important}.workerField input::placeholder{color:#94a3b8!important;opacity:1}.addWorkerBtn{width:100%;height:58px;font-size:16px}.workerLoginBox small{color:#64748b;font-weight:850;line-height:1.35}.workersList{display:grid;gap:10px;margin-top:14px}.workerRow{display:grid;grid-template-columns:42px minmax(0,1fr) auto auto;gap:12px;align-items:center;border:1px solid #e8edf4;background:#fff;border-radius:16px;padding:12px}.workerRow.inactive{background:#f8fafc;opacity:.82}.workerInfo strong{display:block;font-size:15px;font-weight:1000}.workerInfo span{display:block;color:#64748b;font-size:13px;font-weight:850;margin-top:3px;word-break:break-all}.workerInfo small{display:block;color:#111827;font-size:12px;font-weight:950;margin-top:4px}.workerTimeMini{margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:9px}.workerTimeMini b{grid-column:1/-1;font-size:12px;color:#111827}.workerTimeMini span{font-size:11px;color:#475569;font-weight:900}.workerTimeMini span strong{display:block;color:#111827;font-size:13px;margin-top:2px}.workerStatus{height:30px;border-radius:999px;padding:0 10px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:1000}.workerStatus.active{background:#dcfce7;color:#166534}.workerStatus.inactive{background:#f1f5f9;color:#64748b}.timeCabinetPanel{scroll-margin-top:90px}.timeCabinetControls{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.timeCabinetControls label{display:grid;gap:7px}.timeCabinetControls span{font-size:11px;color:#64748b;font-weight:1000;text-transform:uppercase;letter-spacing:.08em}.timeCabinetControls select{height:48px;border:1px solid #dfe5ee;background:#fff;border-radius:14px;padding:0 12px;font-weight:900;color:#111827}.timeCabinetStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.timeCabinetStats span{background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:12px;color:#64748b;font-size:12px;font-weight:900}.timeCabinetStats b{display:block;color:#111827;font-size:17px;margin-top:5px}.timeCabinetList{display:grid;gap:10px;margin-top:14px;max-height:520px;overflow:auto;padding-right:4px}.timeCabinetRow{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.4fr);gap:12px;border:1px solid #e8edf4;background:#fff;border-radius:16px;padding:14px}.timeCabinetRow.missed{border-color:#fecdd3;background:#fff7f7}.timeCabinetWorker strong{display:block;font-size:15px;font-weight:1000}.timeCabinetWorker span{display:block;font-size:13px;color:#64748b;font-weight:850;margin-top:4px;word-break:break-word}.timeCabinetWorker small{display:block;font-size:12px;color:#111827;font-weight:950;margin-top:6px}.timeCabinetTimes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.timeCabinetTimes span{border:1px solid #edf0f3;background:#f8fafc;border-radius:12px;padding:9px;font-size:11px;color:#64748b;font-weight:1000}.timeCabinetTimes b{display:block;color:#111827;font-size:13px;margin-top:3px;text-transform:capitalize}@media(min-width:901px){.ownerPage{background:radial-gradient(circle at top,#fff 0,#f4f6fa 42%,#eef2f7 100%);padding:0}.mobileFrame{display:none}.desktopShell{display:grid}}@media(max-width:1180px){.heroRow{grid-template-columns:1fr}.heroTools{grid-template-columns:minmax(0,1fr) 120px 56px 130px 130px}.contentGrid{grid-template-columns:1fr}.secondaryColumn{grid-template-columns:repeat(2,minmax(0,1fr))}.desktopSupportPanel,.desktopWorkersPanel{grid-column:1/-1}}@media(max-width:760px){.timeCabinetControls,.timeCabinetStats,.timeCabinetRow,.timeCabinetTimes{grid-template-columns:1fr}.timeCabinetList{max-height:none}.mobileFrame{padding-left:14px;padding-right:14px}.mobileTopbar{margin-left:-14px;margin-right:-14px}.mobileIntro{align-items:flex-start}.mobileIntro h1{font-size:23px}.mobileIntro p{font-size:15px}.mobileIntro button{min-width:124px;height:52px}.storeHeroCard{min-height:244px;padding:24px}.storeHeroContent{max-width:63%}.storeHeroContent h2{font-size:27px}.mobileKpis{grid-template-columns:repeat(2,minmax(0,1fr))}.mobileOrderCard{grid-template-columns:92px minmax(0,1fr);gap:12px}.mobileOrderCard>img{width:92px;height:82px;grid-row:1/3}.mobileOrderCard .statusBadge{grid-column:2;justify-self:start}.acceptMobile{grid-column:1/3;width:100%}.mobileActionGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.statusMiniGrid{grid-template-columns:1fr}.mobileChartLabels{font-size:11px}.heroTools,.kpiGrid,.contentGrid,.filters,.orderCard{grid-template-columns:1fr}.agreementCard{padding:22px;border-radius:24px}.agreementCard h1{font-size:30px}.agreementList{grid-template-columns:30px 1fr}.agreementCard img{width:190px}.workerForm{grid-template-columns:1fr}.workerRow{grid-template-columns:42px minmax(0,1fr);}.workerRow .workerStatus,.workerRow .rowBtn{grid-column:1/-1;width:100%;justify-content:center}}@media(max-width:420px){.mobileIntro{display:grid}.mobileIntro button{width:100%}.storeHeroContent{max-width:74%}.storeHeroContent h2{font-size:24px}.mobileKpiCard strong{font-size:22px}.mobileActionGrid button{height:112px}.mobileBottomNav em{font-size:11px}}.mobileFrame button,.desktopShell button,.agreementCard button{transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease}.mobileFrame button:active,.desktopShell button:active,.agreementCard button:active{transform:scale(.985)}
/* ORDA picture KPI section - reviewed full-file fix */
.premiumKpiGrid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:18px!important;align-items:stretch!important}.premiumKpiCard{position:relative!important;min-height:132px!important;border-radius:24px!important;padding:16px!important;background:linear-gradient(180deg,#ffffff 0%,#fbfcff 100%)!important;border:1px solid rgba(203,213,225,.92)!important;box-shadow:0 16px 34px rgba(15,23,42,.075),inset 0 1px 0 rgba(255,255,255,.95)!important;display:grid!important;grid-template-columns:78px minmax(0,1fr)!important;gap:16px!important;align-items:center!important;overflow:hidden!important}.premiumKpiCard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,#111827,#94a3b8);opacity:.78}.premiumKpiCard:nth-child(1)::before{background:linear-gradient(180deg,#16a34a,#bbf7d0)}.premiumKpiCard:nth-child(2)::before{background:linear-gradient(180deg,#2563eb,#bfdbfe)}.premiumKpiCard:nth-child(3)::before{background:linear-gradient(180deg,#f97316,#fed7aa)}.premiumKpiCard:nth-child(4)::before{background:linear-gradient(180deg,#7c3aed,#ddd6fe)}.premiumKpiPhoto{width:78px!important;height:78px!important;border-radius:18px!important;overflow:hidden!important;background:#f1f5f9!important;box-shadow:0 10px 24px rgba(15,23,42,.14)!important;position:relative!important}.premiumKpiPhoto::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(0,0,0,.14));pointer-events:none}.premiumKpiPhoto img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}.premiumKpiText{min-width:0!important}.premiumKpiCard .kpiLabel{font-size:12px!important;line-height:1.1!important;letter-spacing:.14em!important;text-transform:uppercase!important;color:#526071!important;font-weight:1000!important}.premiumKpiCard .kpiValue{font-size:31px!important;line-height:1!important;letter-spacing:-.055em!important;color:#050816!important;font-weight:1000!important;margin-top:9px!important}.premiumKpiCard .kpiMeta{display:inline-flex!important;align-items:center!important;gap:7px!important;width:max-content!important;max-width:100%!important;margin-top:10px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;font-size:12px!important;line-height:1.18!important;font-weight:950!important}.premiumKpiCard .kpiMeta::before{content:''!important;width:8px!important;height:8px!important;border-radius:999px!important;background:currentColor!important;box-shadow:0 0 0 5px color-mix(in srgb,currentColor 13%,transparent)!important;flex:0 0 auto!important}@media(max-width:1180px){.premiumKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:760px){.premiumKpiGrid{grid-template-columns:1fr!important}.premiumKpiCard{min-height:118px!important;grid-template-columns:72px minmax(0,1fr)!important;border-radius:22px!important}.premiumKpiPhoto{width:72px!important;height:72px!important}.premiumKpiCard .kpiValue{font-size:28px!important}}



/* ORDA KPI SILVER ACCENT LOCK */
.premiumKpiCard{
  border-left:none!important;
  box-shadow:none!important;
}

.premiumKpiCard::before{
  content:''!important;
  position:absolute!important;
  left:0!important;
  top:18px!important;
  bottom:18px!important;
  width:7px!important;
  border-radius:999px!important;
  background:linear-gradient(180deg,#f8fafc 0%,#cbd5e1 38%,#94a3b8 100%)!important;
  box-shadow:inset 1px 0 0 rgba(255,255,255,.85), 0 0 0 1px rgba(148,163,184,.16)!important;
  pointer-events:none!important;
}

.premiumKpiCard::after{
  display:none!important;
}

.premiumKpiCard:nth-child(1)::before,
.premiumKpiCard:nth-child(2)::before,
.premiumKpiCard:nth-child(3)::before,
.premiumKpiCard:nth-child(4)::before{
  background:linear-gradient(180deg,#ffffff 0%,#d7dde7 46%,#9aa4b2 100%)!important;
}

.kpiCard::before{
  background:linear-gradient(180deg,#ffffff 0%,#d7dde7 46%,#9aa4b2 100%)!important;
}

.kpiCard.green::before,
.kpiCard.blue::before,
.kpiCard.orange::before,
.kpiCard.purple::before{
  background:linear-gradient(180deg,#ffffff 0%,#d7dde7 46%,#9aa4b2 100%)!important;
}



/* ORDA MOBILE KPI PICTURE CARD LOCK */
.mobilePremiumKpis{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:18px!important;
  margin-top:16px!important;
}

.mobilePremiumKpiCard{
  position:relative!important;
  min-height:168px!important;
  padding:18px!important;
  border-radius:28px!important;
  background:#ffffff!important;
  border:1px solid rgba(15,23,42,.08)!important;
  box-shadow:0 12px 28px rgba(15,23,42,.055)!important;
  display:grid!important;
  grid-template-columns:74px minmax(0,1fr)!important;
  align-items:center!important;
  gap:16px!important;
  overflow:hidden!important;
}

.mobilePremiumKpiCard::before{
  content:''!important;
  position:absolute!important;
  left:0!important;
  top:18px!important;
  bottom:18px!important;
  width:7px!important;
  border-radius:999px!important;
  background:linear-gradient(180deg,#ffffff 0%,#d7dde7 46%,#9aa4b2 100%)!important;
  box-shadow:inset 1px 0 0 rgba(255,255,255,.9),0 0 0 1px rgba(148,163,184,.14)!important;
}

.mobilePremiumKpiCard::after{
  display:none!important;
}

.mobilePremiumThumbWrap{
  position:relative!important;
  z-index:1!important;
  width:74px!important;
  height:74px!important;
  border-radius:20px!important;
  overflow:hidden!important;
  box-shadow:none!important;
  background:#f8fafc!important;
  border:1px solid rgba(15,23,42,.06)!important;
}

.mobilePremiumKpiBody{
  position:relative!important;
  z-index:1!important;
  min-width:0!important;
  display:grid!important;
  align-content:center!important;
}

.mobilePremiumKpiBody span{
  display:block!important;
  font-size:13px!important;
  line-height:1.1!important;
  text-transform:uppercase!important;
  letter-spacing:.14em!important;
  color:#475569!important;
  font-weight:1000!important;
  margin:0!important;
}

.mobilePremiumKpiBody strong{
  display:block!important;
  font-size:34px!important;
  line-height:.95!important;
  letter-spacing:-.055em!important;
  color:#020617!important;
  margin:14px 0 10px!important;
  font-weight:1000!important;
}

.mobilePremiumKpiBody em{
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
  padding:0!important;
  width:auto!important;
  color:#16a34a!important;
  font-size:13px!important;
  line-height:1.2!important;
  font-weight:950!important;
  font-style:normal!important;
}

.mobilePremiumKpiBody em::before{
  content:''!important;
  width:9px!important;
  height:9px!important;
  flex:0 0 9px!important;
  border-radius:999px!important;
  background:currentColor!important;
  box-shadow:0 0 0 6px rgba(34,197,94,.10)!important;
}

.mobilePremiumKpiCard:nth-child(2) .mobilePremiumKpiBody em{
  color:#ef4444!important;
}

@media(max-width:420px){
  .mobilePremiumKpis{
    gap:14px!important;
  }
  .mobilePremiumKpiCard{
    min-height:158px!important;
    padding:16px!important;
    grid-template-columns:66px minmax(0,1fr)!important;
    gap:13px!important;
  }
  .mobilePremiumThumbWrap{
    width:66px!important;
    height:66px!important;
    border-radius:18px!important;
  }
  .mobilePremiumKpiBody span{
    font-size:12px!important;
    letter-spacing:.11em!important;
  }
  .mobilePremiumKpiBody strong{
    font-size:30px!important;
  }
  .mobilePremiumKpiBody em{
    font-size:12px!important;
  }
}

`;