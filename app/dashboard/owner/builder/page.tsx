'use client';

import { useState } from 'react';

export default function BuilderPage() {
  const [loading, setLoading] = useState(false);

  const handleStripeConnect = async () => {
    try {
      setLoading(true);

      const create = await fetch('/api/connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const createData = await create.json();

      if (!create.ok) {
        throw new Error(createData?.error || 'Failed to create Stripe account');
      }

      const accountId = String(createData.accountId || '').trim();

      const link = await fetch('/api/connect/create-onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const linkData = await link.json();

      if (!link.ok) {
        throw new Error(linkData?.error || 'Failed to create onboarding link');
      }

      const url = String(linkData.url || '').trim();

      if (!url) throw new Error('Invalid onboarding link');

      window.location.href = url;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>MenuFlow Builder</h1>

      {/* BUSINESS INFO */}
      <div style={{ marginTop: 20 }}>
        <h2>Business Info</h2>

        <input
          placeholder="Store Name"
          style={inputStyle}
        />

        {/* 🔥 PHONE FIX (number pad) */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Phone Number"
          style={inputStyle}
        />

        <input
          placeholder="Address"
          style={inputStyle}
        />
      </div>

      {/* HOURS FIX */}
      <div style={{ marginTop: 20 }}>
        <h2>Business Hours</h2>

        <input type="time" style={inputStyle} />
        <input type="time" style={inputStyle} />
      </div>

      {/* MENU */}
      <div style={{ marginTop: 20 }}>
        <h2>Menu</h2>

        <input placeholder="Item Name" style={inputStyle} />

        {/* 🔥 PRICE FIX (number pad) */}
        <input
          type="number"
          inputMode="decimal"
          placeholder="Price"
          style={inputStyle}
        />

        <textarea placeholder="Description" style={inputStyle} />
      </div>

      {/* STRIPE */}
      <div style={{ marginTop: 30 }}>
        <h2>Payments</h2>

        <button
          onClick={handleStripeConnect}
          style={buttonStyle}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect Stripe'}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 12,
  marginTop: 10,
  borderRadius: 10,
  border: '1px solid #ccc',
};

const buttonStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 15,
  width: '100%',
  borderRadius: 12,
  background: 'black',
  color: 'white',
  fontWeight: 'bold',
  border: 'none',
};