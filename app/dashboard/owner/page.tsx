'use client';

import { useRouter } from 'next/navigation';

export default function OwnerDashboardPage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: '100vh', background: '#f7f8fa', padding: '24px' }}>
      
      {/* Container */}
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>MenuFlow</h1>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={btnLight}>EN</button>
            <button style={btnLight}>ES</button>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '8px' }}>
            Welcome back 👋
          </h2>
          <p style={{ color: '#6b7280' }}>
            Manage your business in one place
          </p>
        </div>

        {/* Cards */}
        <div style={grid}>
          <Card title="Sales" value="$0.00" />
          <Card title="Orders" value="0" />
          <Card title="Menu Items" value="0" />
          <Card title="Stripe" value="Not Connected" />
        </div>

        {/* Actions */}
        <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
          
          <button
            style={btnPrimary}
            onClick={() => router.push('/dashboard/builder')}
          >
            Open Menu Builder
          </button>

          <button
            style={btnSecondary}
            onClick={() => router.push('/store/test')}
          >
            View Store
          </button>

        </div>

        {/* Orders Section */}
        <div style={{ marginTop: '48px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>
            Recent Orders
          </h3>
          <div style={card}>
            No orders yet
          </div>
        </div>

      </div>
    </main>
  );
}

/* ---------- Components ---------- */

function Card({ title, value }: any) {
  return (
    <div style={card}>
      <p style={{ color: '#6b7280', marginBottom: '8px' }}>{title}</p>
      <h3 style={{ fontSize: '28px', fontWeight: '700' }}>{value}</h3>
    </div>
  );
}

/* ---------- Styles ---------- */

const grid = {
  display: 'grid',
  gap: '16px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const card = {
  background: '#fff',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
};

const btnPrimary = {
  background: '#2563eb',
  color: '#fff',
  padding: '14px 20px',
  borderRadius: '12px',
  border: 'none',
  fontWeight: '600',
  cursor: 'pointer',
};

const btnSecondary = {
  background: '#e5e7eb',
  color: '#111',
  padding: '14px 20px',
  borderRadius: '12px',
  border: 'none',
  fontWeight: '600',
  cursor: 'pointer',
};

const btnLight = {
  background: '#f1f5f9',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
};