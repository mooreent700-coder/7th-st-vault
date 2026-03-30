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
  { name: 'Sat', value: 200 },
  { name: 'Sun', value: 275 },
];

export default function Dashboard() {
  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">M</div>

        <nav>
          <div className="nav active">Dashboard</div>
          <div className="nav">Live Orders</div>
          <div className="nav">Menu Builder</div>
          <div className="nav">Payments</div>
          <div className="nav">Owner Info</div>
          <div className="nav">Store Settings</div>
        </nav>

        <button className="storeBtn">Open Storefront</button>
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* TOPBAR */}
        <div className="topbar">
          <h2>Overview</h2>

          <div className="actions">
            <input placeholder="Search..." />
            <button className="lang">EN</button>
            <button className="lang">ES</button>
            <button className="primary">Open Builder</button>
            <button className="secondary">View Store</button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats">
          <Card title="Today's Sales" value="$215" />
          <Card title="Today's Orders" value="6" />
          <Card title="Menu Items" value="4" />
          <Card title="Revenue Trend" value="+38.2%" />
        </div>

        {/* GRAPH */}
        <div className="card">
          <div className="cardHeader">
            <h3>Sales Overview</h3>
            <div className="tabs">
              <span className="active">This Week</span>
              <span>Last Week</span>
              <span>This Month</span>
              <span>Last Month</span>
            </div>
          </div>

          <div className="chart">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#999" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="url(#color)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="grid">
          {/* LIVE ORDERS */}
          <div className="card">
            <h3>Live Orders</h3>

            <Order name="Andrea" price="$38" status="yellow" />
            <Order name="Jayleen" price="$25" status="red" />
          </div>

          {/* BILLING */}
          <div className="card">
            <h3>Billing</h3>
            <p className="badge green">Stripe Connected</p>

            <div className="alert">
              7 days before due date
              <button>Go To Payment</button>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .app {
          display: flex;
          background: #f5f6f8;
          min-height: 100vh;
          font-family: -apple-system, sans-serif;
        }

        .sidebar {
          width: 230px;
          background: white;
          padding: 20px;
          border-right: 1px solid #eee;
        }

        .logo {
          font-weight: bold;
          margin-bottom: 20px;
        }

        .nav {
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
        }

        .nav.active {
          background: #e0f2fe;
        }

        .storeBtn {
          margin-top: 20px;
          width: 100%;
          padding: 10px;
        }

        .main {
          flex: 1;
          padding: 25px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        input {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .primary {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .secondary {
          background: #e5e7eb;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .card {
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }

        .cardHeader {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .tabs span {
          margin-left: 10px;
          font-size: 12px;
          cursor: pointer;
        }

        .tabs .active {
          color: #2563eb;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .badge.green {
          background: #dcfce7;
          padding: 6px;
          border-radius: 6px;
        }

        .alert {
          margin-top: 10px;
          background: #fef3c7;
          padding: 10px;
          border-radius: 8px;
        }

        .alert button {
          margin-top: 8px;
          width: 100%;
          background: red;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="card">
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Order({ name, price, status }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
      <div>
        <strong>{name}</strong>
        <p>{price}</p>
      </div>
      <span>{status}</span>
    </div>
  );
}