'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OwnerDashboard() {
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    // TEMP MOCK (replace later with Supabase)
    setRestaurant({
      name: 'My Restaurant',
      slug: 'demo-store',
    });
  }, []);

  const card = {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    width: '100%',
  };

  const grid = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '24px',
  };

  const btnPrimary = {
    background: '#2563eb',
    color: '#fff',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    width: '100%',
    fontWeight: '600',
  };

  const btnSecondary = {
    background: '#f1f5f9',
    color: '#111',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    width: '100%',
    fontWeight: '600',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <h1 style={{ fontSize: '26px', fontWeight: '700' }}>
        Welcome back 👋
      </h1>
      <p style={{ color: '#666', marginTop: '4px' }}>
        Manage your business in one place
      </p>

      {/* Cards */}
      <div style={grid}>
        <div style={card}>
          <p>Sales</p>
          <h2>$0.00</h2>
        </div>

        <div style={card}>
          <p>Orders</p>
          <h2>0</h2>
        </div>

        <div style={card}>
          <p>Menu Items</p>
          <h2>0</h2>
        </div>

        <div style={card}>
          <p>Stripe</p>
          <h2>Not Connected</h2>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
        
        <button
          style={btnPrimary}
          onClick={() => router.push('/dashboard/builder')}
        >
          Open Menu Builder
        </button>

        <button
          style={btnSecondary}
          onClick={() => {
            if (!restaurant?.slug) {
              alert('No store yet');
              return;
            }
            router.push(`/store/${restaurant.slug}`);
          }}
        >
          View Store
        </button>

      </div>

      {/* Orders Section */}
      <div style={{ marginTop: '40px' }}>
        <h3>Recent Orders</h3>
        <div style={card}>
          No orders yet
        </div>
      </div>

    </div>
  );
}