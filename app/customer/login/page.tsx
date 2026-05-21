'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type AuthState = 'idle' | 'loading' | 'error' | 'success';

const LOGIN_HERO_IMAGE =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=90&w=1800&auto=format&fit=crop';

function cleanLogin(value: string) {
  return value.trim().toLowerCase();
}

function authMessage(error: unknown) {
  if (!error) return 'Login failed. Please try again.';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message || 'Login failed. Please try again.');
  return 'Login failed. Please try again.';
}

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [message, setMessage] = useState('');

  const nextUrl = useMemo(() => {
    const next = searchParams.get('next');
    return next && next.startsWith('/') ? next : '/customer';
  }, [searchParams]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const email = cleanLogin(loginId);

    if (!email || !email.includes('@')) {
      setAuthState('error');
      setMessage('Enter the email connected to your 7th St Vault customer account.');
      return;
    }

    if (!password) {
      setAuthState('error');
      setMessage('Enter your password.');
      return;
    }

    setAuthState('loading');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState('error');
      setMessage(authMessage(error));
      return;
    }

    if (rememberMe && typeof window !== 'undefined') {
      window.localStorage.setItem('vault_customer_email', email);
    }

    setAuthState('success');
    setMessage('Welcome back to 7th St Vault.');
    window.setTimeout(() => router.push(nextUrl), 450);
  }

  async function sendResetEmail() {
    const email = cleanLogin(loginId);

    if (!email || !email.includes('@')) {
      setAuthState('error');
      setMessage('Enter your email first, then tap reset password.');
      return;
    }

    setAuthState('loading');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/customer/login` : undefined,
    });

    if (error) {
      setAuthState('error');
      setMessage(authMessage(error));
      return;
    }

    setAuthState('success');
    setMessage('Password reset link sent. Check your email.');
  }

  return (
    <main className="loginPage">
      <section className="visualPanel">
        <div className="visualImage" />
        <div className="visualShade" />

        <nav className="topBar">
          <Link href="/" className="brand">
            <span>7SV</span>
            <b>7th St Vault</b>
          </Link>

          <div className="topLinks">
            <Link href="/discover">Discover</Link>
            <Link href="/customer/signup">Create Account</Link>
          </div>
        </nav>

        <div className="visualCopy">
          <div className="eyebrow">CUSTOMER LOGIN</div>
          <h1>Get back to your vault.</h1>
          <p>Sign in to save fashion brands, track orders, like product videos, and continue shopping direct from 7th St Vault sellers.</p>

          <div className="quickTags">
            <span>Saved Brands</span>
            <span>Orders</span>
            <span>Favorites</span>
            <span>Style Feed</span>
          </div>
        </div>
      </section>

      <section className="loginPanel">
        <div className="loginCard">
          <div className="cardHeader">
            <p>WELCOME BACK</p>
            <h2>Customer Login</h2>
            <span>Use your customer email to access your 7th St Vault account.</span>
          </div>

          <form onSubmit={handleLogin} className="loginForm">
            <label>
              Email
              <input
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                placeholder="you@email.com"
                type="email"
                autoComplete="email"
              />
            </label>

            <label>
              Password
              <div className="passwordField">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <div className="formOptions">
              <label className="rememberRow">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                <span>Remember me</span>
              </label>

              <button type="button" className="resetButton" onClick={sendResetEmail} disabled={authState === 'loading'}>
                Reset password
              </button>
            </div>

            {message ? <div className={`message ${authState}`}>{message}</div> : null}

            <button type="submit" className="submitButton" disabled={authState === 'loading'}>
              {authState === 'loading' ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <div className="signupLine">
            New customer? <Link href="/customer/signup">Create a free account</Link>
          </div>
        </div>

        <div className="miniCards">
          <article>
            <b>Shop smarter</b>
            <p>Keep track of fashion sellers, saved products, and product videos.</p>
          </article>
          <article>
            <b>Direct to seller</b>
            <p>Open storefronts, place orders, and support independent fashion brands.</p>
          </article>
        </div>
      </section>

      <style jsx global>{`
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;background:#02040a;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        a{text-decoration:none;color:inherit}
        button,input{font:inherit}
        .loginPage{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,540px);background:radial-gradient(circle at 88% 12%,rgba(25,97,255,.24),transparent 38%),#02040a}
        .visualPanel{position:relative;min-height:100vh;padding:30px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
        .visualImage{position:absolute;inset:0;background-image:url('${LOGIN_HERO_IMAGE}');background-size:cover;background-position:center;filter:saturate(1.05) contrast(1.04)}
        .visualShade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,4,10,.94),rgba(2,4,10,.64),rgba(2,4,10,.24)),linear-gradient(0deg,rgba(2,4,10,.9),transparent 56%)}
        .topBar,.visualCopy{position:relative;z-index:2}
        .topBar{display:flex;align-items:center;justify-content:space-between;gap:18px}
        .brand{display:flex;align-items:center;gap:12px}
        .brand span{width:58px;height:58px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(135deg,#1b63ff,#003baf);border:1px solid rgba(255,255,255,.18);box-shadow:0 18px 45px rgba(27,99,255,.28);font-weight:1000}
        .brand b{text-transform:uppercase;letter-spacing:.12em;font-size:13px}
        .topLinks{display:flex;gap:10px}
        .topLinks a{height:44px;padding:0 16px;border-radius:999px;display:flex;align-items:center;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);font-weight:900}
        .visualCopy{max-width:760px;padding-bottom:62px}
        .eyebrow{width:max-content;border-radius:999px;background:rgba(27,99,255,.18);border:1px solid rgba(72,140,255,.38);color:#68a0ff;padding:9px 14px;font-weight:1000;letter-spacing:.16em;font-size:12px}
        .visualCopy h1{margin:18px 0 12px;font-size:clamp(54px,7vw,108px);line-height:.88;letter-spacing:-.08em;text-transform:uppercase}
        .visualCopy p{max-width:620px;margin:0;color:rgba(255,255,255,.78);font-size:19px;line-height:1.45;font-weight:700}
        .quickTags{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
        .quickTags span{border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);padding:10px 14px;font-weight:1000}
        .loginPanel{min-height:100vh;padding:28px;display:flex;flex-direction:column;justify-content:center;gap:16px;background:linear-gradient(180deg,rgba(6,10,20,.94),rgba(3,5,12,.98));border-left:1px solid rgba(255,255,255,.1)}
        .loginCard{border-radius:34px;background:rgba(255,255,255,.96);color:#07111f;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.38)}
        .cardHeader p{margin:0 0 8px;color:#1b63ff;font-size:12px;font-weight:1000;letter-spacing:.16em}
        .cardHeader h2{margin:0;font-size:40px;line-height:1;letter-spacing:-.05em}
        .cardHeader span{display:block;margin-top:8px;color:#5b6472;font-weight:800}
        .loginForm{display:grid;gap:15px;margin-top:24px}
        label{display:grid;gap:7px;font-size:13px;font-weight:1000;color:#162033}
        input{width:100%;height:54px;border-radius:17px;border:1px solid rgba(7,17,31,.16);background:#f8fafc;color:#07111f;padding:0 15px;outline:none;font-weight:900}
        input:focus{border-color:#1b63ff;box-shadow:0 0 0 4px rgba(27,99,255,.12)}
        .passwordField{display:flex;align-items:center;gap:8px;height:54px;border-radius:17px;border:1px solid rgba(7,17,31,.16);background:#f8fafc;padding:0 8px 0 0}
        .passwordField input{border:0;box-shadow:none;background:transparent}
        .passwordField button{height:38px;border:0;border-radius:13px;background:#07111f;color:#fff;padding:0 12px;font-weight:1000;cursor:pointer}
        .formOptions{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .rememberRow{display:flex;align-items:center;gap:8px;color:#5b6472}
        .rememberRow input{width:18px;height:18px}
        .resetButton{border:0;background:transparent;color:#1b63ff;font-weight:1000;cursor:pointer}
        .message{border-radius:16px;padding:12px 14px;font-weight:900}
        .message.error{background:#fee2e2;color:#991b1b}
        .message.success{background:#dcfce7;color:#166534}
        .submitButton{height:58px;border:0;border-radius:18px;background:linear-gradient(135deg,#1b63ff,#003baf);color:#fff;font-weight:1000;cursor:pointer;box-shadow:0 18px 38px rgba(27,99,255,.3)}
        .submitButton:disabled{opacity:.55;cursor:not-allowed}
        .signupLine{text-align:center;margin-top:16px;color:#5b6472;font-weight:900}
        .signupLine a{color:#1b63ff}
        .miniCards{display:grid;gap:10px}
        .miniCards article{border-radius:24px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.07);padding:18px}
        .miniCards b{display:block;font-size:18px}
        .miniCards p{margin:6px 0 0;color:rgba(255,255,255,.68);line-height:1.4;font-weight:700}
        @media(max-width:980px){.loginPage{grid-template-columns:1fr}.visualPanel{min-height:500px}.loginPanel{min-height:auto;border-left:0}.visualCopy{padding-bottom:20px}}
        @media(max-width:640px){.visualPanel,.loginPanel{padding:16px}.topBar{align-items:flex-start}.topLinks{flex-direction:column}.visualCopy h1{font-size:54px}.loginCard{padding:20px;border-radius:26px}.formOptions{align-items:flex-start;flex-direction:column}.cardHeader h2{font-size:34px}}
      `}</style>
    </main>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<main className="loginPage"><div className="fallback">Loading customer login...</div></main>}>
      <CustomerLoginContent />
    </Suspense>
  );
}
