'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !password) {
      setMessage('Enter email and password');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard/owner');
    } catch (err: any) {
      setMessage(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={page}>
      <div style={card}>
        <div style={logo}>MENUFLOW</div>

        <h1 style={title}>Welcome back</h1>

        <p style={subtitle}>
          Sign in to manage your store, orders, and payouts
        </p>

        <form onSubmit={handleLogin} style={form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />

          <button type="submit" disabled={loading} style={button}>
            {loading ? 'Loading...' : 'Log in'}
          </button>
        </form>

        {message && <div style={error}>{message}</div>}

        <div style={footer}>
          No account?{' '}
          <Link href="/signup" style={link}>
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ===== STYLES ===== */

const page: React.CSSProperties = {
  height: '100vh',
  width: '100%',
  background: '#0b0c10',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  padding: '32px',
  borderRadius: '20px',
  background: '#111217',
  border: '1px solid #1f222a',
};

const logo: React.CSSProperties = {
  color: '#fff',
  fontWeight: 900,
  fontSize: '20px',
  marginBottom: '20px',
};

const title: React.CSSProperties = {
  color: '#fff',
  fontSize: '36px',
  fontWeight: 800,
  margin: 0,
};

const subtitle: React.CSSProperties = {
  color: '#888',
  marginBottom: '20px',
};

const form: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const input: React.CSSProperties = {
  height: '55px',
  borderRadius: '12px',
  border: '1px solid #2a2e38',
  background: '#0e1015',
  color: '#fff',
  padding: '0 14px',
  fontSize: '16px',
};

const button: React.CSSProperties = {
  height: '55px',
  borderRadius: '12px',
  border: 'none',
  background: '#ffffff',
  color: '#000',
  fontWeight: 800,
  cursor: 'pointer',
};

const error: React.CSSProperties = {
  marginTop: '12px',
  color: '#ff4d4f',
};

const footer: React.CSSProperties = {
  marginTop: '16px',
  color: '#888',
};

const link: React.CSSProperties = {
  color: '#fff',
  fontWeight: 700,
};