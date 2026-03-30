'use client';

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 80 },
  { name: 'Wed', value: 60 },
  { name: 'Thu', value: 120 },
  { name: 'Fri', value: 180 },
  { name: 'Sat', value: 220 },
  { name: 'Sun', value: 275 },
];

export default function Dashboard() {
  return (
    <div style={s.app}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logo}>MenuFlow</div>

        <div style={s.navActive}>Dashboard</div>
        <div style={s.nav}>Live Orders</div>
        <div style={s.nav}>Menu Builder</div>
        <div style={s.nav}>Payments</div>
        <div style={s.nav}>Owner Info</div>
        <div style={s.nav}>Store Settings</div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>
        {/* TOPBAR */}
        <div style={s.topbar}>
          <h2>Overview</h2>

          <div style={s.actions}>
            <input style={s.search} placeholder="Search..." />
            <button style={s.lang}>EN</button>
            <button style={s.lang}>ES</button>
            <button style={s.primary}>Open Builder</button>
            <button style={s.secondary}>View Store</button>
          </div>
        </div>

        {/* STATS */}
        <div style={s.stats}>
          <Stat title="Today's Sales" value="$215" />
          <Stat title="Today's Orders" value="6" />
          <Stat title="Menu Items" value="4" />
          <Stat title="Revenue Trend" value="+38.2%" />
        </div>

        {/* GRAPH */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3>Sales Overview</h3>
            <div style={s.tabs}>
              <span style={s.tabActive}>This Week</span>
              <span>This Month</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#999" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                fill="url(#color)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* BOTTOM */}
        <div style={s.grid}>
          <div style={s.card}>
            <h3>Live Orders</h3>
            <Order name="Andrea" price="$38" status="yellow" />
            <Order name="Jayleen" price="$25" status="red" />
          </div>

          <div style={s.card}>
            <h3>Billing</h3>
            <div style={s.badge}>Stripe Connected</div>

            <div style={s.alert}>
              7 days before due date
              <button style={s.payBtn}>Go To Payment</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ title, value }: any) {
  return (
    <div style={s.stat}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Order({ name, price, status }: any) {
  return (
    <div style={s.order}>
      <div>
        <strong>{name}</strong>
        <p>{price}</p>
      </div>
      <span>{status}</span>
    </div>
  );
}

const s: any = {
  app: { display: 'flex', background: '#f5f6f8', minHeight: '100vh' },
  sidebar: { width: 220, background: '#fff', padding: 20 },
  logo: { fontWeight: 'bold', marginBottom: 20 },
  nav: { padding: 10, opacity: 0.6 },
  navActive: { padding: 10, background: '#e0f2fe', borderRadius: 8 },

  main: { flex: 1, padding: 20 },

  topbar: { display: 'flex', justifyContent: 'space-between' },
  actions: { display: 'flex', gap: 10 },
  search: { padding: 8, border: '1px solid #ddd', borderRadius: 6 },

  primary: { background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 },
  secondary: { background: '#e5e7eb', padding: '8px 12px', borderRadius: 6 },
  lang: { background: '#eee', padding: '6px 10px' },

  stats: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 20 },
  stat: { background: '#fff', padding: 15, borderRadius: 10 },

  card: { background: '#fff', padding: 15, borderRadius: 12, marginTop: 20 },
  cardHeader: { display: 'flex', justifyContent: 'space-between' },

  tabs: { display: 'flex', gap: 10 },
  tabActive: { color: '#2563eb' },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },

  order: { display: 'flex', justifyContent: 'space-between', marginTop: 10 },

  badge: { background: '#dcfce7', padding: 6, borderRadius: 6 },

  alert: { marginTop: 10, background: '#fef3c7', padding: 10, borderRadius: 8 },
  payBtn: { marginTop: 8, width: '100%', background: 'red', color: '#fff', border: 'none', padding: 8 },
};