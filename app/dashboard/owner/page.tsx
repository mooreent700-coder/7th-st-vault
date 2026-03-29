'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Lang = 'en' | 'es';
type Theme = 'light' | 'dark';

export default function OwnerDashboard() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<Theme>('dark');

  // Persist theme
  useEffect(() => {
    const saved = localStorage.getItem('mf_theme') as Theme;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('mf_theme', theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg,#0a0f1f,#0d1b3d)'
          : '#f5f7fb',
        color: isDark ? '#fff' : '#111',
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: '240px',
          padding: '24px',
          background: isDark ? '#0f172a' : '#fff',
          borderRight: isDark ? '1px solid #1e293b' : '1px solid #e5e7eb',
        }}
      >
        <h2 style={{ marginBottom: '32px' }}>MenuFlow</h2>

        {['Dashboard', 'Builder', 'Orders', 'Payments', 'Store'].map(
          (item) => (
            <div
              key={item}
              style={{
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '10px',
                cursor: 'pointer',
                background: 'transparent',
              }}
              onClick={() => {
                if (item === 'Builder') router.push('/dashboard/builder');
                if (item === 'Store') router.push('/store/test');
              }}
            >
              {item}
            </div>
          )
        )}

        <div style={{ marginTop: '40px', opacity: 0.6 }}>Logout</div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: '32px' }}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '32px' }}>Welcome back 👋</h1>
            <p style={{ opacity: 0.7 }}>
              Run your business from one place
            </p>
          </div>

          {/* TOGGLES */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setLang('en')}
              style={toggleStyle(lang === 'en', isDark)}
            >
              EN
            </button>
            <button
              onClick={() => setLang('es')}
              style={toggleStyle(lang === 'es', isDark)}
            >
              ES
            </button>

            <button
              onClick={() => setTheme('light')}
              style={toggleStyle(theme === 'light', isDark)}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              style={toggleStyle(theme === 'dark', isDark)}
            >
              Dark
            </button>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
          <button
            style={primaryBtn}
            onClick={() => router.push('/dashboard/builder')}
          >
            Open Menu Builder
          </button>

          <button
            style={secondaryBtn(isDark)}
            onClick={() => router.push('/store/test')}
          >
            View Store
          </button>
        </div>

        {/* STATS */}
        <div
          style={{
            marginTop: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: '16px',
          }}
        >
          {['Sales', 'Orders', 'Menu Items', 'Stripe'].map((t) => (
            <div key={t} style={card(isDark)}>
              <p style={{ opacity: 0.6 }}>{t}</p>
              <h2>
                {t === 'Sales'
                  ? '$0.00'
                  : t === 'Stripe'
                  ? 'Not Connected'
                  : '0'}
              </h2>
            </div>
          ))}
        </div>

        {/* PAYMENTS */}
        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={card(isDark)}>
            <h3>Business Info</h3>
            <p>Name: --</p>
            <p>Slug: --</p>
            <p>Phone: --</p>
          </div>

          <div style={card(isDark)}>
            <h3>Payments</h3>
            <p>Onboarding: Incomplete</p>
            <button style={primaryBtn}>Connect Stripe</button>
            <button style={secondaryBtn(isDark)}>Refresh</button>
          </div>
        </div>

        {/* ORDERS */}
        <div style={{ marginTop: '32px' }}>
          <div style={card(isDark)}>
            <h3>Recent Orders</h3>
            <p>No orders yet</p>
          </div>
        </div>

        {/* STORE */}
        <div style={{ marginTop: '32px' }}>
          <div style={card(isDark)}>
            <h3>Live Store Preview</h3>
            <p>/store/test</p>
            <button
              style={secondaryBtn(isDark)}
              onClick={() => router.push('/store/test')}
            >
              View Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* STYLES */

const card = (dark: boolean) => ({
  padding: '20px',
  borderRadius: '16px',
  background: dark ? '#111827' : '#fff',
  border: dark ? '1px solid #1f2937' : '1px solid #e5e7eb',
});

const primaryBtn = {
  padding: '14px 20px',
  borderRadius: '12px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
};

const secondaryBtn = (dark: boolean) => ({
  padding: '14px 20px',
  borderRadius: '12px',
  background: dark ? '#1f2937' : '#e5e7eb',
  border: 'none',
  cursor: 'pointer',
});

const toggleStyle = (active: boolean, dark: boolean) => ({
  padding: '10px 14px',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  background: active ? '#3b82f6' : dark ? '#1f2937' : '#e5e7eb',
  color: active ? '#fff' : dark ? '#fff' : '#000',
});