'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';

const OWNER_LANG_KEY = '7sv_owner_language';

const FALLBACK_FASHION_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%2305040a'/%3E%3Cstop offset='.55' stop-color='%23311b68'/%3E%3Cstop offset='1' stop-color='%2328f5dc'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='900' fill='url(%23g)'/%3E%3Ccircle cx='920' cy='220' r='250' fill='%23ffffff' fill-opacity='.12'/%3E%3Ctext x='78' y='455' fill='%23ffffff' font-size='90' font-family='Arial' font-weight='900'%3E7TH ST VAULT%3C/text%3E%3Ctext x='84' y='535' fill='%23c7fff7' font-size='42' font-family='Arial' font-weight='800'%3EFASHION DROP%3C/text%3E%3C/svg%3E";

const visuals = {
  hero: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=90',
  sneaker: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=90',
  jewelry: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1000&q=90',
  streetwear: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1000&q=90',
};

const copy = {
  en: {
    badge: 'Street • Luxury • Kids • Sneakers',
    title: 'Log In To Your 7TH ST VAULT Seller Account',
    welcome: 'Welcome Back',
    subhead: 'Manage drops, products, orders, and customers from one clean seller dashboard.',
    email: 'Email Address',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    remember: 'Remember me',
    forgot: 'Forgot password?',
    login: 'Log In',
    loggingIn: 'Logging In...',
    google: 'Continue with Google',
    noAccount: 'Need a seller account?',
    signup: 'Create Account',
    invalid: 'Enter your email and password.',
    cards: ['Sneakers', 'Jewelry', 'Streetwear'],
  },
  es: {
    badge: 'Street • Lujo • Niños • Sneakers',
    title: 'Entra A Tu Cuenta De Vendedor 7TH ST VAULT',
    welcome: 'Bienvenido',
    subhead: 'Maneja drops, productos, pedidos y clientes desde un solo dashboard.',
    email: 'Correo Electrónico',
    emailPlaceholder: 'Escribe tu correo',
    password: 'Contraseña',
    passwordPlaceholder: 'Escribe tu contraseña',
    remember: 'Recordarme',
    forgot: '¿Olvidaste tu contraseña?',
    login: 'Iniciar Sesión',
    loggingIn: 'Entrando...',
    google: 'Continuar con Google',
    noAccount: '¿Necesitas cuenta de vendedor?',
    signup: 'Crear Cuenta',
    invalid: 'Escribe tu correo y contraseña.',
    cards: ['Sneakers', 'Joyería', 'Streetwear'],
  },
} as const;

function isLang(value: string | null): value is Lang {
  return value === 'en' || value === 'es';
}

function saveOwnerLanguage(nextLang: Lang) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(OWNER_LANG_KEY, nextLang);
  window.localStorage.setItem('7sv_language', nextLang);
  document.cookie = `7sv_owner_language=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
}

function FashionImg(props: { className?: string; src: string; alt: string }) {
  return (
    <img
      className={props.className}
      src={props.src}
      alt={props.alt}
      onError={(event) => {
        event.currentTarget.src = FALLBACK_FASHION_IMAGE;
      }}
    />
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>('en');
  const t = copy[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const destination = useMemo(() => searchParams.get('next') || '/dashboard/owner', [searchParams]);

  useEffect(() => {
    const queryLang = searchParams.get('lang');
    if (isLang(queryLang)) {
      setLang(queryLang);
      saveOwnerLanguage(queryLang);
      return;
    }

    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(OWNER_LANG_KEY) || window.localStorage.getItem('7sv_language');
      const lastEmail = window.localStorage.getItem('7sv_last_email');
      if (isLang(saved)) {
        setLang(saved);
        saveOwnerLanguage(saved);
      }
      if (lastEmail) setEmail(lastEmail);
    }
  }, [searchParams]);

  function changeLanguage(nextLang: Lang) {
    setLang(nextLang);
    saveOwnerLanguage(nextLang);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setMessage(t.invalid);
      return;
    }

    setLoading(true);

    try {
      saveOwnerLanguage(lang);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (remember && typeof window !== 'undefined') {
        window.localStorage.setItem('7sv_last_email', email.trim().toLowerCase());
      }

      router.push(destination);
      router.refresh();
    } catch (error: any) {
      setMessage(error?.message || 'Could not log in. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginShell">
      <section className="visualPanel">
        <div className="brandMark">
          <span className="vaultRing" />
          <div>
            <strong>7TH ST VAULT</strong>
            <small>{t.badge}</small>
          </div>
        </div>

        <div className="loginCollage">
          <FashionImg className="mainShot" src={visuals.hero} alt="Fashion seller dashboard visual" />
          <article className="miniCard sneaker"><FashionImg src={visuals.sneaker} alt="Sneaker drop" /><span>{t.cards[0]}</span></article>
          <article className="miniCard jewelry"><FashionImg src={visuals.jewelry} alt="Premium jewelry" /><span>{t.cards[1]}</span></article>
          <article className="miniCard street"><FashionImg src={visuals.streetwear} alt="Streetwear outfit" /><span>{t.cards[2]}</span></article>
          <div className="welcomeText"><h1>{t.welcome}</h1><p>{t.subhead}</p></div>
        </div>
      </section>

      <section className="formPanel">
        <div className="loginCard">
          <div className="langSwitch">
            <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}>EN</button>
            <button type="button" className={lang === 'es' ? 'active' : ''} onClick={() => changeLanguage('es')}>ES</button>
          </div>

          <h2>{t.title.split('7TH ST VAULT')[0]}<span>7TH ST VAULT</span>{t.title.split('7TH ST VAULT')[1]}</h2>

          <form onSubmit={handleSubmit}>
            <label>{t.email}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.emailPlaceholder} required /></label>
            <label>{t.password}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordPlaceholder} required /></label>

            <div className="rowBetween">
              <label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> {t.remember}</label>
              <Link href="/auth/reset-password">{t.forgot}</Link>
            </div>

            {message && <div className="message">{message}</div>}

            <button className="primaryBtn" type="submit" disabled={loading}>{loading ? t.loggingIn : t.login} <span>→</span></button>
          </form>

          <div className="divider">or</div>
          <button className="googleBtn" type="button">G&nbsp; {t.google}</button>
          <p className="switchAuth">{t.noAccount} <Link href="/auth/signup">{t.signup}</Link></p>
        </div>
      </section>

      <style jsx>{`
        :global(body) { margin: 0; background: #05040a; }
        .loginShell { min-height: 100vh; display: grid; grid-template-columns: 1.05fr .95fr; background: radial-gradient(circle at 20% 5%, rgba(112, 59, 255, .25), transparent 32%), linear-gradient(135deg, #05040a, #0b0715 58%, #05040a); color: #fff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; }
        .visualPanel, .formPanel { min-height: 100vh; position: relative; padding: 42px clamp(24px, 5vw, 74px); box-sizing: border-box; }
        .visualPanel { border-right: 1px solid rgba(255,255,255,.08); }
        .brandMark { display: flex; align-items: center; gap: 16px; letter-spacing: .14em; text-transform: uppercase; position: relative; z-index: 3; }
        .vaultRing { width: 56px; height: 56px; border-radius: 50%; border: 8px solid #b9a7ff; box-shadow: 0 0 28px rgba(185,167,255,.75), inset 0 0 18px rgba(255,255,255,.24); background: radial-gradient(circle, #111 45%, transparent 48%); }
        .brandMark strong { display: block; font-size: 28px; }
        .brandMark small { display: block; margin-top: 6px; color: #c7bfff; font-weight: 900; font-size: 12px; }
        .loginCollage { position: relative; height: calc(100vh - 150px); min-height: 620px; margin-top: 34px; }
        .mainShot { width: 63%; height: 68%; object-fit: cover; border-radius: 38px; border: 1px solid rgba(255,255,255,.2); box-shadow: 0 34px 85px rgba(0,0,0,.58); display: block; }
        .miniCard { position: absolute; overflow: hidden; border-radius: 26px; border: 1px solid rgba(255,255,255,.22); background: rgba(10,10,18,.8); box-shadow: 0 24px 60px rgba(0,0,0,.5); }
        .miniCard img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .miniCard span { position: absolute; left: 16px; bottom: 16px; padding: 9px 14px; border-radius: 999px; background: linear-gradient(135deg, #b9a7ff, #38f5d3); color: #05040a; font-size: 13px; font-weight: 1000; }
        .sneaker { right: 14%; top: 6%; width: 245px; height: 170px; }
        .jewelry { right: 24%; top: 34%; width: 225px; height: 160px; }
        .street { right: 4%; bottom: 18%; width: 235px; height: 180px; }
        .welcomeText { position: absolute; left: 0; bottom: 7%; width: min(620px, 86%); padding: 32px; border-radius: 30px; background: linear-gradient(135deg, rgba(9,7,18,.88), rgba(185,167,255,.18)); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(12px); }
        .welcomeText h1 { margin: 0; font-size: clamp(50px, 7vw, 98px); line-height: .9; letter-spacing: -.07em; }
        .welcomeText p { margin: 18px 0 0; color: rgba(255,255,255,.86); font-weight: 900; font-size: 20px; line-height: 1.4; }
        .formPanel { display: flex; align-items: center; justify-content: center; }
        .loginCard { width: min(590px, 100%); position: relative; border-radius: 34px; border: 1px solid rgba(255,255,255,.14); background: rgba(8, 8, 16, .74); box-shadow: 0 30px 80px rgba(0,0,0,.56); padding: 42px; backdrop-filter: blur(18px); }
        .langSwitch { position: absolute; top: 28px; right: 28px; display: flex; gap: 8px; }
        .langSwitch button { border: 1px solid rgba(255,255,255,.18); color: white; background: rgba(255,255,255,.07); border-radius: 999px; padding: 9px 12px; font-weight: 1000; cursor: pointer; }
        .langSwitch button.active { background: #b9a7ff; color: #06040d; }
        .loginCard h2 { margin: 0 104px 32px 0; font-size: clamp(40px, 4.6vw, 66px); line-height: .95; letter-spacing: -.07em; }
        .loginCard h2 span { color: #b9a7ff; text-shadow: 0 0 26px rgba(185,167,255,.55); }
        form { display: grid; gap: 18px; }
        label { display: grid; gap: 8px; color: white; font-weight: 1000; font-size: 14px; }
        input { width: 100%; min-height: 60px; box-sizing: border-box; border-radius: 16px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.06); color: #fff; padding: 0 16px; font-size: 16px; font-weight: 800; outline: none; }
        input:focus { border-color: #b9a7ff; box-shadow: 0 0 0 4px rgba(185,167,255,.18); }
        .rowBetween { display: flex; justify-content: space-between; gap: 18px; align-items: center; }
        .remember { display: flex; align-items: center; gap: 10px; }
        .remember input { width: 22px; min-height: 22px; accent-color: #b9a7ff; }
        a { color: #38f5d3; font-weight: 1000; text-decoration: none; }
        .message { border-radius: 16px; padding: 15px 16px; font-weight: 1000; border: 1px solid rgba(255,92,122,.4); background: rgba(255,92,122,.13); color: #ffd6df; }
        .primaryBtn, .googleBtn { width: 100%; min-height: 62px; border-radius: 999px; border: 0; font-weight: 1000; font-size: 17px; cursor: pointer; }
        .primaryBtn { color: #06040d; background: linear-gradient(135deg, #ffffff, #b9a7ff 52%, #38f5d3); box-shadow: 0 18px 42px rgba(185,167,255,.32); }
        .primaryBtn:disabled { opacity: .65; cursor: wait; }
        .divider { display: flex; align-items: center; gap: 14px; color: rgba(255,255,255,.55); margin: 22px 0; font-weight: 900; }
        .divider:before, .divider:after { content: ''; height: 1px; flex: 1; background: rgba(255,255,255,.12); }
        .googleBtn { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.13); color: white; }
        .switchAuth { text-align: center; color: rgba(255,255,255,.7); font-weight: 800; }
        @media (max-width: 980px) { .loginShell { grid-template-columns: 1fr; } .visualPanel, .formPanel { min-height: auto; } .visualPanel { border-right: 0; border-bottom: 1px solid rgba(255,255,255,.08); } }
        @media (max-width: 640px) { .visualPanel, .formPanel { padding: 26px 18px; } .loginCard { padding: 24px; } .loginCard h2 { margin-right: 0; padding-top: 42px; } .mainShot { width: 82%; } .miniCard { transform: scale(.78); transform-origin: top right; } }
      `}</style>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', background: '#05040a', color: '#fff' }} />}>
      <LoginContent />
    </Suspense>
  );
}
