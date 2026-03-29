'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Lang = 'en' | 'es';
type StoreTheme = 'light' | 'dark';
type OrderStatus = 'placed' | 'preparing' | 'ready' | 'cancelled';
type BillingStatus = 'good' | 'warning' | 'overdue';

type OrderItem = {
  name: string;
  qty: number;
};

type LiveOrder = {
  id: string;
  customer: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  placedAt: string;
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

const ui = {
  en: {
    brand: 'MenuFlow',
    overview: 'Overview',
    dashboard: 'Dashboard',
    liveOrders: 'Live Orders',
    builder: 'Menu Builder',
    payments: 'Payments',
    ownerInfo: 'Owner Info',
    storeSettings: 'Store Settings',
    logout: 'Logout',
    search: 'Search',
    todaysSales: "Today's Sales",
    todaysOrders: "Today's Orders",
    menuItems: 'Menu Items',
    billingStatus: 'Billing Status',
    stripeStatus: 'Stripe Status',
    connected: 'Connected',
    notConnected: 'Not Connected',
    liveOrdersBoard: 'Live Orders',
    liveOrdersText: 'Manage every order from red to yellow to green inside this dashboard.',
    billing: 'Billing',
    billingText: 'Account status for the MenuFlow platform.',
    topSellingProducts: 'Menu Builder',
    topSellingProductsText: 'Add, edit, remove, and refresh your menu items.',
    ownerInformation: 'Owner Information',
    ownerInformationText: 'Business details used across your owner dashboard and storefront.',
    orderLanguage: 'Order Language',
    storeTheme: 'Store Theme',
    cancelledOrders: 'Cancelled Orders',
    orderPlaced: 'Placed',
    orderPreparing: 'Almost Ready',
    orderReady: 'Ready To Go',
    orderCancelled: 'Cancelled',
    startOrder: 'Start Order',
    markReady: 'Mark Ready',
    notifyReady: 'Customer notified: order is ready for pickup.',
    remove: 'Remove',
    addItem: 'Add Item',
    refreshMenu: 'Refresh Menu',
    saveInfo: 'Save Info',
    businessName: 'Business Name',
    phone: 'Phone',
    address: 'Address',
    hours: 'Hours',
    languageEnglish: 'English',
    languageSpanish: 'Spanish',
    themeLight: 'Light Store',
    themeDark: 'Dark Store',
    dueGood: 'Paid / Active',
    dueWarning: '7 days before due date',
    dueOverdue: 'Payment Due / Dashboard Lock',
    goToPayment: 'Go To Payment',
    dashboardLocked: 'Dashboard locks when payment is overdue until payment is completed.',
    quickActions: 'Quick Actions',
    viewStore: 'View Store',
    openBuilder: 'Open Builder',
    businessSaved: 'Owner information saved.',
  },
  es: {
    brand: 'MenuFlow',
    overview: 'Resumen',
    dashboard: 'Panel',
    liveOrders: 'Pedidos en Vivo',
    builder: 'Constructor',
    payments: 'Pagos',
    ownerInfo: 'Información del Dueño',
    storeSettings: 'Ajustes de Tienda',
    logout: 'Salir',
    search: 'Buscar',
    todaysSales: 'Ventas de Hoy',
    todaysOrders: 'Pedidos de Hoy',
    menuItems: 'Artículos del Menú',
    billingStatus: 'Estado de Facturación',
    stripeStatus: 'Estado de Stripe',
    connected: 'Conectado',
    notConnected: 'No Conectado',
    liveOrdersBoard: 'Pedidos en Vivo',
    liveOrdersText: 'Administra cada pedido de rojo a amarillo a verde dentro de este panel.',
    billing: 'Facturación',
    billingText: 'Estado de tu cuenta para la plataforma MenuFlow.',
    topSellingProducts: 'Constructor de Menú',
    topSellingProductsText: 'Agrega, edita, elimina y actualiza tus artículos del menú.',
    ownerInformation: 'Información del Dueño',
    ownerInformationText: 'Datos del negocio usados en todo tu panel y storefront.',
    orderLanguage: 'Idioma de Pedidos',
    storeTheme: 'Tema de Tienda',
    cancelledOrders: 'Pedidos Cancelados',
    orderPlaced: 'Recibido',
    orderPreparing: 'Casi Listo',
    orderReady: 'Listo',
    orderCancelled: 'Cancelado',
    startOrder: 'Iniciar Pedido',
    markReady: 'Marcar Listo',
    notifyReady: 'Cliente notificado: el pedido está listo para recoger.',
    remove: 'Eliminar',
    addItem: 'Agregar Artículo',
    refreshMenu: 'Actualizar Menú',
    saveInfo: 'Guardar Información',
    businessName: 'Nombre del Negocio',
    phone: 'Teléfono',
    address: 'Dirección',
    hours: 'Horario',
    languageEnglish: 'Ingllés',
    languageSpanish: 'Español',
    themeLight: 'Tienda Clara',
    themeDark: 'Tienda Oscura',
    dueGood: 'Pagado / Activo',
    dueWarning: '7 días antes del vencimiento',
    dueOverdue: 'Pago Vencido / Panel Bloqueado',
    goToPayment: 'Ir al Pago',
    dashboardLocked: 'El panel se bloquea si el pago está vencido hasta que se complete.',
    quickActions: 'Acciones Rápidas',
    viewStore: 'Ver Tienda',
    openBuilder: 'Abrir Constructor',
    businessSaved: 'Información guardada.',
  },
} as const;

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function orderStatusClass(status: OrderStatus) {
  if (status === 'placed' || status === 'cancelled') return 'status-red';
  if (status === 'preparing') return 'status-yellow';
  return 'status-green';
}

function billingClass(status: BillingStatus) {
  if (status === 'good') return 'billing-green';
  if (status === 'warning') return 'billing-yellow';
  return 'billing-red';
}

export default function OwnerDashboardPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>('en');
  const t = ui[lang];

  const [orderLanguage, setOrderLanguage] = useState<Lang>('en');
  const [storeTheme, setStoreTheme] = useState<StoreTheme>('light');
  const [billingStatus, setBillingStatus] = useState<BillingStatus>('warning');
  const [stripeConnected] = useState(true);
  const [message, setMessage] = useState('');

  const [businessName, setBusinessName] = useState('MenuFlow Demo Kitchen');
  const [phone, setPhone] = useState('(323) 555-2010');
  const [address, setAddress] = useState('Compton, CA');
  const [hours, setHours] = useState('Mon–Sun • 10 AM – 8 PM');

  const [orders, setOrders] = useState<LiveOrder[]>([
    {
      id: 'MF-1024',
      customer: 'Andrea',
      total: 38,
      status: 'placed',
      placedAt: '1:02 PM',
      items: [
        { name: 'Chicken Plate', qty: 2 },
        { name: 'Lemonade', qty: 1 },
      ],
    },
    {
      id: 'MF-1025',
      customer: 'Carlos',
      total: 22,
      status: 'preparing',
      placedAt: '1:05 PM',
      items: [{ name: 'Tacos', qty: 3 }],
    },
    {
      id: 'MF-1026',
      customer: 'Maya',
      total: 17,
      status: 'ready',
      placedAt: '1:08 PM',
      items: [
        { name: 'Quesadilla', qty: 1 },
        { name: 'Horchata', qty: 1 },
      ],
    },
    {
      id: 'MF-1027',
      customer: 'Leo',
      total: 12,
      status: 'cancelled',
      placedAt: '1:10 PM',
      items: [{ name: 'Fries', qty: 1 }],
    },
  ]);

  const [items, setItems] = useState<MenuItem[]>([
    {
      id: 'item-1',
      name: 'Chicken Plate',
      price: 14,
      category: 'Plates',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'item-2',
      name: 'Tacos',
      price: 10,
      category: 'Street Food',
      image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'item-3',
      name: 'Loaded Fries',
      price: 11,
      category: 'Sides',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'item-4',
      name: 'Lemonade',
      price: 4,
      category: 'Drinks',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    },
  ]);

  const activeOrders = useMemo(() => orders.filter((order) => order.status !== 'cancelled'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter((order) => order.status === 'cancelled'), [orders]);
  const todaysSales = useMemo(() => activeOrders.reduce((sum, order) => sum + order.total, 0), [activeOrders]);
  const dashboardLocked = billingStatus === 'overdue';

  function handleStart(orderId: string) {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: 'preparing' } : order))
    );
  }

  function handleReady(orderId: string) {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: 'ready' } : order))
    );
    setMessage(t.notifyReady);
  }

  function handleRemove(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  function handleSaveInfo() {
    setMessage(t.businessSaved);
  }

  return (
    <main className="page-shell">
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div className="brand-block">
            <div className="brand-mark">M</div>
            <div>
              <div className="brand-name">MenuFlow</div>
              <div className="brand-sub">Owner Control</div>
            </div>
          </div>

          <nav className="nav">
            <button className="nav-item nav-active">{t.dashboard}</button>
            <button className="nav-item">{t.liveOrders}</button>
            <button className="nav-item" onClick={() => router.push('/dashboard/owner/builder')}>{t.builder}</button>
            <button className="nav-item">{t.payments}</button>
            <button className="nav-item">{t.ownerInfo}</button>
            <button className="nav-item">{t.storeSettings}</button>
          </nav>

          <button className="logout-btn">{t.logout}</button>
        </aside>

        <section className="content">
          <div className="topbar">
            <div>
              <div className="page-title">{t.overview}</div>
              <div className="page-subtitle">{t.quickActions}</div>
            </div>

            <div className="topbar-right">
              <div className="search-box">{t.search}</div>
              <div className="lang-switch">
                <button className={lang === 'en' ? 'switch-active' : ''} onClick={() => setLang('en')}>EN</button>
                <button className={lang === 'es' ? 'switch-active' : ''} onClick={() => setLang('es')}>ES</button>
              </div>
              <button className="ghost-btn" onClick={() => router.push('/dashboard/owner/builder')}>
                {t.openBuilder}
              </button>
              <button className="ghost-btn" onClick={() => router.push('/store/demo-store')}>
                {t.viewStore}
              </button>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">{t.todaysSales}</div>
              <div className="stat-value">{money(todaysSales)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t.todaysOrders}</div>
              <div className="stat-value">{activeOrders.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t.menuItems}</div>
              <div className="stat-value">{items.length}</div>
            </div>
            <div className={`stat-card ${billingClass(billingStatus)}`}>
              <div className="stat-label">{t.billingStatus}</div>
              <div className="stat-value">
                {billingStatus === 'good' ? t.dueGood : billingStatus === 'warning' ? t.dueWarning : t.dueOverdue}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t.stripeStatus}</div>
              <div className="stat-value">{stripeConnected ? t.connected : t.notConnected}</div>
            </div>
          </div>

          <div className="main-grid">
            <div className="left-column">
              <section className="panel live-orders-panel">
                <div className="panel-head">
                  <div>
                    <h2>{t.liveOrdersBoard}</h2>
                    <p>{t.liveOrdersText}</p>
                  </div>
                  <div className="panel-controls">
                    <button className="mini-toggle" onClick={() => setBillingStatus('good')}>Green</button>
                    <button className="mini-toggle" onClick={() => setBillingStatus('warning')}>Yellow</button>
                    <button className="mini-toggle" onClick={() => setBillingStatus('overdue')}>Red</button>
                  </div>
                </div>

                {dashboardLocked ? (
                  <div className="lock-card">
                    <div className="lock-title">{t.dueOverdue}</div>
                    <p>{t.dashboardLocked}</p>
                    <button className="pay-btn">{t.goToPayment}</button>
                  </div>
                ) : (
                  <div className="orders-stack">
                    {activeOrders.map((order) => (
                      <div className={`order-card ${orderStatusClass(order.status)}`} key={order.id}>
                        <div className="order-top">
                          <div>
                            <div className="order-id">{order.id}</div>
                            <div className="order-customer">{order.customer}</div>
                            <div className="order-items">
                              {order.items.map((item) => `${item.qty}x ${item.name}`).join(' • ')}
                            </div>
                          </div>
                          <div className="order-right">
                            <div className="order-total">{money(order.total)}</div>
                            <div className="order-time">{order.placedAt}</div>
                          </div>
                        </div>

                        <div className="order-bottom">
                          <span className={`status-pill ${orderStatusClass(order.status)}`}>
                            {order.status === 'placed'
                              ? t.orderPlaced
                              : order.status === 'preparing'
                              ? t.orderPreparing
                              : order.status === 'ready'
                              ? t.orderReady
                              : t.orderCancelled}
                          </span>

                          <div className="order-actions">
                            {order.status === 'placed' && (
                              <button className="yellow-btn" onClick={() => handleStart(order.id)}>
                                {t.startOrder}
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button className="green-btn" onClick={() => handleReady(order.id)}>
                                {t.markReady}
                              </button>
                            )}
                            {order.status === 'ready' && <span className="ready-copy">{t.notifyReady}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel builder-panel">
                <div className="panel-head">
                  <div>
                    <h2>{t.topSellingProducts}</h2>
                    <p>{t.topSellingProductsText}</p>
                  </div>
                  <div className="panel-controls">
                    <button className="mini-toggle">{t.addItem}</button>
                    <button className="mini-toggle">{t.refreshMenu}</button>
                  </div>
                </div>

                <div className="item-grid">
                  {items.map((item) => (
                    <article className="item-card" key={item.id}>
                      <div className="item-image-wrap">
                        <img src={item.image} alt={item.name} className="item-image" />
                      </div>
                      <div className="item-name">{item.name}</div>
                      <div className="item-meta">
                        <span>{item.category}</span>
                        <span>{money(item.price)}</span>
                      </div>
                      <button className="remove-btn" onClick={() => handleRemove(item.id)}>
                        {t.remove}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="right-column">
              <section className="panel billing-panel">
                <div className="panel-head">
                  <div>
                    <h2>{t.billing}</h2>
                    <p>{t.billingText}</p>
                  </div>
                </div>

                <div className={`billing-box ${billingClass(billingStatus)}`}>
                  <div className="billing-status-line">
                    {billingStatus === 'good'
                      ? t.dueGood
                      : billingStatus === 'warning'
                      ? t.dueWarning
                      : t.dueOverdue}
                  </div>
                  <div className="billing-note">{t.dashboardLocked}</div>
                </div>

                <button className="pay-btn">{t.goToPayment}</button>
              </section>

              <section className="panel owner-panel">
                <div className="panel-head">
                  <div>
                    <h2>{t.ownerInformation}</h2>
                    <p>{t.ownerInformationText}</p>
                  </div>
                </div>

                <div className="info-form">
                  <label>
                    <span>{t.businessName}</span>
                    <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                  </label>
                  <label>
                    <span>{t.phone}</span>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </label>
                  <label>
                    <span>{t.address}</span>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </label>
                  <label>
                    <span>{t.hours}</span>
                    <input value={hours} onChange={(e) => setHours(e.target.value)} />
                  </label>
                </div>

                <button className="save-btn" onClick={handleSaveInfo}>{t.saveInfo}</button>
              </section>

              <section className="panel settings-panel">
                <div className="panel-head">
                  <div>
                    <h2>{t.storeSettings}</h2>
                    <p>{t.ownerInformationText}</p>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-title">{t.orderLanguage}</div>
                  <div className="toggle-group">
                    <button className={orderLanguage === 'en' ? 'switch-active' : ''} onClick={() => setOrderLanguage('en')}>
                      {t.languageEnglish}
                    </button>
                    <button className={orderLanguage === 'es' ? 'switch-active' : ''} onClick={() => setOrderLanguage('es')}>
                      {t.languageSpanish}
                    </button>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-title">{t.storeTheme}</div>
                  <div className="toggle-group">
                    <button className={storeTheme === 'light' ? 'switch-active' : ''} onClick={() => setStoreTheme('light')}>
                      {t.themeLight}
                    </button>
                    <button className={storeTheme === 'dark' ? 'switch-active' : ''} onClick={() => setStoreTheme('dark')}>
                      {t.themeDark}
                    </button>
                  </div>
                </div>
              </section>

              <section className="panel cancelled-panel">
                <div className="panel-head">
                  <div>
                    <h2>{t.cancelledOrders}</h2>
                    <p>Red means the order was cancelled.</p>
                  </div>
                </div>

                <div className="cancelled-list">
                  {cancelledOrders.map((order) => (
                    <div key={order.id} className="cancelled-item">
                      <div>
                        <div className="order-id">{order.id}</div>
                        <div className="order-customer">{order.customer}</div>
                      </div>
                      <div className="order-total">{money(order.total)}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {message ? <div className="message-toast">{message}</div> : null}
        </section>
      </div>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #84ddd0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #2f3531;
        }

        .page-shell {
          min-height: 100vh;
          padding: 28px;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04)),
            radial-gradient(circle at top left, rgba(255,255,255,0.18), transparent 32%),
            linear-gradient(135deg, #78d9ca 0%, #88ddd0 40%, #7fd9cc 100%);
        }

        .dashboard-shell {
          max-width: 1440px;
          margin: 0 auto;
          background: #f1f3f2;
          border-radius: 10px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 244px minmax(0, 1fr);
          box-shadow: 0 16px 60px rgba(35, 53, 49, 0.12);
          min-height: calc(100vh - 56px);
        }

        .sidebar {
          background: #ecefee;
          border-right: 1px solid #d7dddb;
          padding: 26px 0 22px;
          display: flex;
          flex-direction: column;
        }

        .brand-block {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 24px 24px;
          border-bottom: 1px solid #d7dddb;
        }

        .brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #9ce7db;
          display: grid;
          place-items: center;
          font-size: 22px;
          font-weight: 800;
          color: #3c7268;
        }

        .brand-name {
          font-size: 26px;
          font-weight: 800;
          color: #2b332f;
          line-height: 1;
        }

        .brand-sub {
          margin-top: 4px;
          font-size: 13px;
          color: #6f7571;
          font-weight: 600;
        }

        .nav {
          padding: 18px 14px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .nav-item,
        .logout-btn {
          appearance: none;
          border: none;
          background: transparent;
          padding: 14px 16px;
          border-radius: 8px;
          color: #404641;
          font-size: 15px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        .nav-active {
          background: #87e6d7;
          box-shadow: 0 8px 18px rgba(135, 230, 215, 0.35);
        }

        .logout-btn {
          margin-top: auto;
          margin-left: 14px;
          margin-right: 14px;
          border: 1px solid #d7dddb;
          background: #f7f9f8;
        }

        .content {
          padding: 26px 28px 28px;
          min-width: 0;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          margin-bottom: 20px;
        }

        .page-title {
          font-size: 18px;
          font-weight: 800;
          color: #2d3531;
        }

        .page-subtitle {
          margin-top: 4px;
          font-size: 13px;
          color: #7a817d;
          font-weight: 600;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .search-box {
          min-width: 280px;
          height: 38px;
          border-radius: 6px;
          background: #ffffff;
          border: 1px solid #e0e4e2;
          display: flex;
          align-items: center;
          padding: 0 14px;
          color: #a2aaa6;
          font-size: 13px;
        }

        .lang-switch,
        .toggle-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .lang-switch button,
        .toggle-group button,
        .ghost-btn,
        .mini-toggle,
        .pay-btn,
        .save-btn,
        .remove-btn,
        .yellow-btn,
        .green-btn {
          appearance: none;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 700;
        }

        .lang-switch button,
        .toggle-group button,
        .ghost-btn,
        .mini-toggle {
          height: 38px;
          padding: 0 12px;
          background: #ffffff;
          color: #48514c;
          border: 1px solid #dfe4e2;
        }

        .switch-active {
          background: #87e6d7 !important;
          color: #26463e !important;
          border-color: #87e6d7 !important;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #ffffff;
          border-radius: 6px;
          border: 1px solid #e2e6e4;
          padding: 18px 20px;
          min-height: 92px;
        }

        .stat-label {
          font-size: 14px;
          color: #6f7671;
          font-weight: 600;
        }

        .stat-value {
          margin-top: 18px;
          font-size: 28px;
          line-height: 1;
          font-weight: 800;
          color: #2e3531;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr);
          gap: 20px;
        }

        .left-column,
        .right-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }

        .panel {
          background: #ffffff;
          border-radius: 6px;
          border: 1px solid #e2e6e4;
          padding: 18px;
          min-width: 0;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .panel-head h2 {
          margin: 0;
          font-size: 18px;
          color: #2f3531;
        }

        .panel-head p {
          margin: 6px 0 0;
          color: #7b827e;
          font-size: 13px;
          line-height: 1.5;
        }

        .panel-controls {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .orders-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-card {
          border: 1px solid #e2e6e4;
          border-left-width: 6px;
          border-radius: 8px;
          padding: 14px 16px;
          background: #fbfcfc;
        }

        .order-top,
        .order-bottom {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .order-bottom {
          margin-top: 14px;
          align-items: center;
        }

        .order-id {
          font-size: 14px;
          color: #6f7671;
          font-weight: 800;
        }

        .order-customer {
          margin-top: 4px;
          font-size: 18px;
          font-weight: 800;
          color: #2f3531;
        }

        .order-items {
          margin-top: 6px;
          color: #79817d;
          font-size: 13px;
        }

        .order-right {
          text-align: right;
        }

        .order-total {
          font-size: 20px;
          font-weight: 800;
          color: #2f3531;
        }

        .order-time {
          margin-top: 6px;
          font-size: 13px;
          color: #7d847f;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
        }

        .status-red {
          border-left-color: #db524e;
        }

        .status-yellow {
          border-left-color: #d6a42a;
        }

        .status-green {
          border-left-color: #4bb88a;
        }

        .status-pill.status-red {
          background: #fef0ef;
          color: #b43c39;
          border-color: #f5c1be;
        }

        .status-pill.status-yellow {
          background: #fff7e3;
          color: #a5790e;
          border-color: #f3dfad;
        }

        .status-pill.status-green {
          background: #ecfbf5;
          color: #26865f;
          border-color: #bde8d3;
        }

        .order-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .yellow-btn,
        .green-btn,
        .remove-btn,
        .pay-btn,
        .save-btn {
          height: 38px;
          padding: 0 14px;
        }

        .yellow-btn {
          background: #ffe59b;
          color: #745704;
        }

        .green-btn {
          background: #bdf1db;
          color: #20724f;
        }

        .ready-copy {
          color: #2f8b61;
          font-size: 13px;
          font-weight: 700;
        }

        .lock-card {
          border-radius: 8px;
          border: 1px solid #f3c8c6;
          background: #fff2f1;
          padding: 18px;
        }

        .lock-title {
          font-size: 16px;
          font-weight: 800;
          color: #ae3633;
        }

        .lock-card p {
          color: #985350;
          font-size: 13px;
          line-height: 1.55;
          margin: 8px 0 14px;
        }

        .pay-btn {
          background: #db524e;
          color: white;
        }

        .item-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .item-card {
          background: #f9fbfa;
          border: 1px solid #e2e6e4;
          border-radius: 6px;
          padding: 12px;
        }

        .item-image-wrap {
          aspect-ratio: 1 / 1;
          border-radius: 4px;
          overflow: hidden;
          background: #eef2f0;
        }

        .item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .item-name {
          margin-top: 10px;
          font-size: 18px;
          font-weight: 800;
          color: #2f3531;
        }

        .item-meta {
          margin-top: 6px;
          display: flex;
          justify-content: space-between;
          gap: 8px;
          color: #7a817d;
          font-size: 13px;
        }

        .remove-btn {
          margin-top: 10px;
          width: 100%;
          background: #db524e;
          color: white;
        }

        .billing-box {
          border-radius: 8px;
          padding: 16px;
          border: 1px solid transparent;
        }

        .billing-status-line {
          font-size: 17px;
          font-weight: 800;
        }

        .billing-note {
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.55;
        }

        .billing-green {
          background: #eef9f5;
          border-color: #bfe5d4;
        }

        .billing-yellow {
          background: #fff9e9;
          border-color: #f2dfaf;
        }

        .billing-red {
          background: #fff1f0;
          border-color: #f0c3c0;
        }

        .billing-panel .pay-btn {
          margin-top: 14px;
          width: 100%;
        }

        .info-form {
          display: grid;
          gap: 12px;
        }

        .info-form label span {
          display: block;
          font-size: 12px;
          font-weight: 800;
          color: #6f7671;
          margin-bottom: 6px;
        }

        .info-form input {
          width: 100%;
          box-sizing: border-box;
          height: 40px;
          border: 1px solid #dfe4e2;
          border-radius: 6px;
          background: #fbfcfc;
          padding: 0 12px;
          font-size: 14px;
          color: #2f3531;
        }

        .save-btn {
          margin-top: 14px;
          width: 100%;
          background: #87e6d7;
          color: #21443b;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          padding: 10px 0;
          border-top: 1px solid #edf1ef;
        }

        .setting-row:first-of-type {
          border-top: none;
          padding-top: 0;
        }

        .setting-title {
          font-size: 14px;
          font-weight: 700;
          color: #2f3531;
        }

        .cancelled-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cancelled-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          border: 1px solid #f0c8c6;
          background: #fff4f3;
          border-radius: 8px;
          padding: 12px 14px;
        }

        .message-toast {
          position: fixed;
          right: 20px;
          bottom: 20px;
          background: #2f3531;
          color: white;
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 14px 40px rgba(47, 53, 49, 0.2);
          z-index: 10;
        }

        @media (max-width: 1280px) {
          .stats-row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .item-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1080px) {
          .dashboard-shell {
            grid-template-columns: 1fr;
          }

          .sidebar {
            border-right: none;
            border-bottom: 1px solid #d7dddb;
          }

          .nav {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .logout-btn {
            margin-top: 12px;
          }

          .main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .page-shell {
            padding: 12px;
          }

          .content {
            padding: 18px;
          }

          .topbar,
          .order-top,
          .order-bottom,
          .setting-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .topbar-right {
            justify-content: flex-start;
          }

          .search-box {
            min-width: 0;
            width: 100%;
          }

          .stats-row {
            grid-template-columns: 1fr;
          }

          .item-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
