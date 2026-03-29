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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage('Enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      router.push('/dashboard/owner');
      router.refresh();
    } catch (error: any) {
      setMessage(error?.message || 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={page}>
      <div style={card}>
        <div style={eyebrow}>LOGIN</div>

        <h1 style={title}>Welcome back.</h1>

        <p style={subtitle}>
          Sign in to manage your MenuFlow dashboard, Stripe setup, storefront, and orders.
        </p>

        <form onSubmit={handleLogin} style={form}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={input}
          />

          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={input}
          />

          <button type="submit" disabled={loading} style={button}>
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        {message ? <div style={messageBox}>{message}</div> : null}

        <div style={footerText}>
          Need an account?{' '}
          <Link href="/signup" style={link}>
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#05060a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: '760px',
  background:
    'linear-gradient(180deg, rgba(15,16,24,0.98) 0%, rgba(10,11,18,0.98) 100%)',
  border: '1px solid rgba(214, 177, 55, 0.18)',
  borderRadius: '34px',
  padding: '38px',
  boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
};

const eyebrow: React.CSSProperties = {
  color: '#d4af37',
  letterSpacing: '0.3em',
  fontWeight: 800,
  fontSize: '18px',
  marginBottom: '24px',
};

const title: React.CSSProperties = {
  margin: 0,
  color: '#f5f7fb',
  fontWeight: 900,
  fontSize: '64px',
  lineHeight: 1,
};

const subtitle: React.CSSProperties = {
  marginTop: '18px',
  marginBottom: '28px',
  color: '#a7acb8',
  fontSize: '20px',
  lineHeight: 1.55,
  maxWidth: '620px',
};

const form: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
};

const input: React.CSSProperties = {
  width: '100%',
  height: '96px',
  borderRadius: '22px',
  border: '1px solid rgba(212, 175, 55, 0.18)',
  background: '#e6efac',
  color: '#11131a',
  fontSize: '24px',
  fontWeight: 700,
  padding: '0 24px',
  boxSizing: 'border-box',
  outline: 'none',
};

const button: React.CSSProperties = {
  width: '100%',
  height: '96px',
  border: 'none',
  borderRadius: '24px',
  background: '#d4af37',
  color: '#11131a',
  fontWeight: 900,
  fontSize: '28px',
  cursor: 'pointer',
  marginTop: '8px',
};

const footerText: React.CSSProperties = {
  marginTop: '26px',
  color: '#a7acb8',
  fontSize: '20px',
};

const link: React.CSSProperties = {
  color: '#d4af37',
  textDecoration: 'none',
  fontWeight: 800,
};

const messageBox: React.CSSProperties = {
  marginTop: '18px',
  background: 'rgba(255, 214, 102, 0.12)',
  border: '1px solid rgba(255, 214, 102, 0.35)',
  color: '#ffd666',
  borderRadius: '18px',
  padding: '16px 18px',
  fontWeight: 700,
  fontSize: '16px',
};