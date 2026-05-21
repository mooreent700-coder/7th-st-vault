'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';

type SignupForm = {
  fullName: string;
  brandName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  fashionCategory: string;
  city: string;
};

const OWNER_LANG_KEY = '7sv_owner_language';
const AGREEMENT_VERSION = '7th-st-vault-seller-v1';

const FASHION_CATEGORIES = [
  'Streetwear Brand',
  'Sneaker Seller',
  'Jewelry Brand',
  'Kids Fashion',
  'Luxury Fashion',
  'Vintage Seller',
  'Accessories',
  "Men's Fashion",
  "Women's Fashion",
  'Custom Apparel',
  'Designer Resale',
  'Hats & Caps',
  'Denim Brand',
  'Other',
];

const FALLBACK_FASHION_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%2305040a'/%3E%3Cstop offset='.55' stop-color='%23311b68'/%3E%3Cstop offset='1' stop-color='%2328f5dc'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='900' fill='url(%23g)'/%3E%3Ccircle cx='920' cy='220' r='250' fill='%23ffffff' fill-opacity='.12'/%3E%3Ctext x='78' y='455' fill='%23ffffff' font-size='90' font-family='Arial' font-weight='900'%3E7TH ST VAULT%3C/text%3E%3Ctext x='84' y='535' fill='%23c7fff7' font-size='42' font-family='Arial' font-weight='800'%3EFASHION DROP%3C/text%3E%3C/svg%3E";

const visuals = {
  hero: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=90',
  sneakers: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=90',
  jewelry: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1000&q=90',
  luxury: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=90',
};

const copy = {
  en: {
    plan: 'Selected plan:',
    badge: 'Street • Luxury • Kids • Sneakers',
    subhead: 'Build your fashion storefront for streetwear, sneakers, jewelry, kids fashion, luxury drops, and boutique brands.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    brandName: 'Brand Name',
    brandNamePlaceholder: 'Enter your fashion brand name',
    email: 'Email Address',
    emailPlaceholder: 'Enter your email',
    phone: 'Phone Number',
    phonePlaceholder: '(555) 123-4567',
    password: 'Password',
    passwordPlaceholder: 'Create a strong password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    category: 'Fashion Category',
    categoryPlaceholder: 'Select your fashion category',
    city: 'City',
    cityPlaceholder: 'Enter your city',
    terms: 'I agree to the 7th St Vault Terms of Service and Privacy Policy.',
    create: 'Create My Account',
    creating: 'Creating Account...',
    google: 'Sign up with Google',
    already: 'Already have an account?',
    login: 'Sign In',
    passwordMismatch: 'Passwords do not match.',
    weakPassword: 'Password must be at least 8 characters and include a number.',
    termsRequired: 'Please agree to the 7th St Vault terms before continuing.',
    success: 'Account created. Check your email to confirm, then log in.',
    liveDrop: 'Live Drop',
    newCollection: 'New Collection',
    salesOverview: 'Brand sales overview',
    features: ['Real-Time Sales', 'Keep 100%', 'Built For Sellers'],
  },
  es: {
    plan: 'Plan seleccionado:',
    badge: 'Street • Lujo • Niños • Sneakers',
    subhead: 'Crea tu tienda de moda para streetwear, sneakers, joyería, moda de niños, drops de lujo y marcas boutique.',
    fullName: 'Nombre Completo',
    fullNamePlaceholder: 'Escribe tu nombre completo',
    brandName: 'Nombre De La Marca',
    brandNamePlaceholder: 'Escribe el nombre de tu marca',
    email: 'Correo Electrónico',
    emailPlaceholder: 'Escribe tu correo',
    phone: 'Número De Teléfono',
    phonePlaceholder: '(555) 123-4567',
    password: 'Contraseña',
    passwordPlaceholder: 'Crea una contraseña segura',
    confirmPassword: 'Confirmar Contraseña',
    confirmPasswordPlaceholder: 'Confirma tu contraseña',
    category: 'Categoría De Moda',
    categoryPlaceholder: 'Selecciona tu categoría',
    city: 'Ciudad',
    cityPlaceholder: 'Escribe tu ciudad',
    terms: 'Acepto los Términos de Servicio y la Política de Privacidad de 7th St Vault.',
    create: 'Crear Mi Cuenta',
    creating: 'Creando Cuenta...',
    google: 'Registrarme con Google',
    already: '¿Ya tienes una cuenta?',
    login: 'Iniciar Sesión',
    passwordMismatch: 'Las contraseñas no coinciden.',
    weakPassword: 'La contraseña debe tener mínimo 8 caracteres e incluir un número.',
    termsRequired: 'Acepta los términos de 7th St Vault antes de continuar.',
    success: 'Cuenta creada. Confirma tu correo y luego inicia sesión.',
    liveDrop: 'Drop En Vivo',
    newCollection: 'Nueva Colección',
    salesOverview: 'Resumen de ventas',
    features: ['Ventas En Vivo', 'Quédate 100%', 'Hecho Para Vendedores'],
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

function slugify(value: string) {
  const base =
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'brand';

  return `${base}-${Date.now().toString(36).slice(-5)}`;
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

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'starter';

  const [lang, setLang] = useState<Lang>('en');
  const t = copy[lang];
  const [form, setForm] = useState<SignupForm>({
    fullName: '',
    brandName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fashionCategory: '',
    city: '',
  });
  const [termsChecked, setTermsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  const appUrl = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.origin;
    return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }, []);

  useEffect(() => {
    const queryLang = searchParams.get('lang') || searchParams.get('owner_language');
    if (isLang(queryLang)) {
      setLang(queryLang);
      saveOwnerLanguage(queryLang);
      return;
    }

    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(OWNER_LANG_KEY) || window.localStorage.getItem('7sv_language');
      if (isLang(saved)) {
        setLang(saved);
        saveOwnerLanguage(saved);
      }
    }
  }, [searchParams]);

  function updateForm(key: keyof SignupForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeLanguage(nextLang: Lang) {
    setLang(nextLang);
    saveOwnerLanguage(nextLang);
  }

  async function ensureBrandRow(userId: string) {
    const normalizedEmail = form.email.trim().toLowerCase();
    const brandName = form.brandName.trim();

    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('restaurants')
        .update({
          name: brandName,
          owner_email: normalizedEmail,
          phone: form.phone.trim() || null,
          city: form.city.trim() || null,
          category: form.fashionCategory || null,
          business_type: form.fashionCategory || null,
          store_type: 'fashion',
          owner_language: lang,
          order_language: lang,
          terms_accepted: true,
          owner_terms_accepted: true,
          agreement_accepted: true,
          agreement_version: AGREEMENT_VERSION,
        })
        .eq('id', existing.id);
      return existing.id as string;
    }

    const { data: created, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id: userId,
        user_id: userId,
        owner_email: normalizedEmail,
        name: brandName,
        slug: slugify(brandName),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        category: form.fashionCategory || null,
        business_type: form.fashionCategory || null,
        store_type: 'fashion',
        plan: selectedPlan,
        public_visible: true,
        pickup_enabled: false,
        delivery_enabled: true,
        owner_language: lang,
        order_language: lang,
        terms_accepted: true,
        owner_terms_accepted: true,
        agreement_accepted: true,
        agreement_version: AGREEMENT_VERSION,
      })
      .select('id')
      .single();

    if (error) throw error;
    return created?.id as string;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setMessageType('error');

    if (form.password !== form.confirmPassword) {
      setMessage(t.passwordMismatch);
      return;
    }

    if (form.password.length < 8 || !/\d/.test(form.password)) {
      setMessage(t.weakPassword);
      return;
    }

    if (!termsChecked) {
      setMessage(t.termsRequired);
      return;
    }

    setLoading(true);

    try {
      saveOwnerLanguage(lang);
      const email = form.email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          emailRedirectTo: `${appUrl}/auth/login`,
          data: {
            full_name: form.fullName.trim(),
            brand_name: form.brandName.trim(),
            business_name: form.brandName.trim(),
            fashion_category: form.fashionCategory,
            city: form.city.trim(),
            phone: form.phone.trim(),
            platform: '7th-st-vault',
            owner_language: lang,
          },
        },
      });

      if (error) throw error;

      if (data.user?.id) {
        try {
          await ensureBrandRow(data.user.id);
        } catch (brandError) {
          console.warn('Brand row will be completed after login:', brandError);
        }
      }

      setMessageType('success');
      setMessage(t.success);

      if (data.session) {
        router.push('/dashboard/owner');
      }
    } catch (error: any) {
      setMessage(error?.message || 'Could not create account. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="signupShell">
      <section className="visualPanel">
        <div className="brandMark">
          <span className="vaultRing" />
          <div>
            <strong>7TH ST VAULT</strong>
            <small>{t.badge}</small>
          </div>
        </div>

        <div className="heroCopy">
          <h1>
            {lang === 'en' ? 'Your ' : 'Tu '}
            <span>7TH ST VAULT</span>
            <br />
            {lang === 'en' ? 'Seller Account' : 'Cuenta De Vendedor'}
          </h1>
          <p>{t.subhead}</p>
        </div>

        <div className="fashionCollage" aria-label="7th St Vault fashion visuals">
          <FashionImg className="mainShot" src={visuals.hero} alt="Streetwear fashion model" />
          <article className="floatingCard sneakerCard">
            <FashionImg src={visuals.sneakers} alt="Modern sneaker drop" />
            <span>Sneakers</span>
          </article>
          <article className="floatingCard jewelryCard">
            <FashionImg src={visuals.jewelry} alt="Premium jewelry and accessories" />
            <span>Jewelry</span>
          </article>
          <article className="floatingCard luxuryCard">
            <FashionImg src={visuals.luxury} alt="Luxury fashion boutique style" />
            <span>Luxury</span>
          </article>
          <div className="dropCard">
            <b>{t.newCollection}</b>
            <span>{t.liveDrop}</span>
          </div>
          <div className="salesCard">
            <small>{t.salesOverview}</small>
            <b>$8,642.75</b>
            <em>+8.4%</em>
          </div>
        </div>

        <div className="featureGrid">
          {t.features.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      </section>

      <section className="formPanel">
        <div className="formCard">
          <div className="langSwitch">
            <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}>EN</button>
            <button type="button" className={lang === 'es' ? 'active' : ''} onClick={() => changeLanguage('es')}>ES</button>
          </div>

          <h2>
            {lang === 'en' ? 'Create Your ' : 'Crea Tu '}
            <span>7TH ST VAULT</span>
            <br />
            {lang === 'en' ? 'Seller Account' : 'Cuenta De Vendedor'}
          </h2>

          <div className="planPill">{t.plan} <strong>{selectedPlan.toUpperCase()}</strong></div>

          <form onSubmit={handleSubmit}>
            <div className="gridTwo">
              <label>{t.fullName}<input value={form.fullName} onChange={(event) => updateForm('fullName', event.target.value)} placeholder={t.fullNamePlaceholder} required /></label>
              <label>{t.brandName}<input value={form.brandName} onChange={(event) => updateForm('brandName', event.target.value)} placeholder={t.brandNamePlaceholder} required /></label>
              <label>{t.email}<input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder={t.emailPlaceholder} required /></label>
              <label>{t.phone}<input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder={t.phonePlaceholder} required /></label>
              <label>{t.password}<input type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} placeholder={t.passwordPlaceholder} required /></label>
              <label>{t.confirmPassword}<input type="password" value={form.confirmPassword} onChange={(event) => updateForm('confirmPassword', event.target.value)} placeholder={t.confirmPasswordPlaceholder} required /></label>
              <label>{t.category}<select value={form.fashionCategory} onChange={(event) => updateForm('fashionCategory', event.target.value)} required><option value="">{t.categoryPlaceholder}</option>{FASHION_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <label>{t.city}<input value={form.city} onChange={(event) => updateForm('city', event.target.value)} placeholder={t.cityPlaceholder} required /></label>
            </div>

            <label className="checkRow"><input type="checkbox" checked={termsChecked} onChange={(event) => setTermsChecked(event.target.checked)} /> <span>{t.terms}</span></label>

            {message && <div className={`message ${messageType}`}>{message}</div>}

            <button className="primaryBtn" type="submit" disabled={loading}>{loading ? t.creating : t.create} <span>→</span></button>
          </form>

          <div className="divider">or</div>
          <button className="googleBtn" type="button">G&nbsp; {t.google}</button>
          <p className="switchAuth">{t.already} <Link href="/auth/login">{t.login}</Link></p>
        </div>
      </section>

      <style jsx>{`
        :global(body) { margin: 0; background: #05040a; }
        .signupShell { min-height: 100vh; display: grid; grid-template-columns: 1.05fr .95fr; background: radial-gradient(circle at top left, rgba(112, 59, 255, .22), transparent 32%), linear-gradient(135deg, #05040a 0%, #0b0715 52%, #05040a 100%); color: #fff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; }
        .visualPanel, .formPanel { min-height: 100vh; position: relative; padding: 42px clamp(24px, 5vw, 74px); box-sizing: border-box; }
        .visualPanel { border-right: 1px solid rgba(255,255,255,.08); }
        .brandMark { display: flex; align-items: center; gap: 16px; letter-spacing: .14em; text-transform: uppercase; }
        .vaultRing { width: 56px; height: 56px; border-radius: 50%; border: 8px solid #b9a7ff; box-shadow: 0 0 28px rgba(185,167,255,.8), inset 0 0 18px rgba(255,255,255,.25); background: radial-gradient(circle, #111 45%, transparent 48%); }
        .brandMark strong { display: block; font-size: 28px; }
        .brandMark small { display: block; margin-top: 6px; color: #c7bfff; font-weight: 900; font-size: 12px; }
        .heroCopy h1 { margin: 58px 0 16px; font-size: clamp(46px, 6.4vw, 92px); line-height: .9; letter-spacing: -.07em; }
        .heroCopy h1 span, .formCard h2 span { color: #b9a7ff; text-shadow: 0 0 26px rgba(185,167,255,.55); }
        .heroCopy p { max-width: 780px; color: rgba(255,255,255,.85); font-size: 20px; line-height: 1.45; font-weight: 800; }
        .fashionCollage { position: relative; height: 540px; margin-top: 30px; }
        .mainShot { width: 58%; height: 86%; object-fit: cover; border-radius: 34px; border: 1px solid rgba(255,255,255,.2); box-shadow: 0 30px 80px rgba(0,0,0,.55); display: block; }
        .floatingCard { position: absolute; overflow: hidden; border-radius: 26px; border: 1px solid rgba(255,255,255,.22); background: rgba(10,10,18,.8); box-shadow: 0 24px 60px rgba(0,0,0,.5); }
        .floatingCard img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .floatingCard span { position: absolute; left: 18px; bottom: 18px; padding: 9px 14px; border-radius: 999px; background: linear-gradient(135deg, #b9a7ff, #38f5d3); color: #05040a; font-size: 13px; font-weight: 1000; }
        .sneakerCard { right: 6%; top: 18px; width: 235px; height: 160px; }
        .jewelryCard { right: 30%; bottom: 56px; width: 210px; height: 155px; }
        .luxuryCard { right: 3%; bottom: 135px; width: 220px; height: 170px; }
        .dropCard, .salesCard { position: absolute; border-radius: 28px; background: rgba(11, 8, 22, .86); border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(12px); box-shadow: 0 20px 50px rgba(0,0,0,.5); }
        .dropCard { left: 26px; bottom: 30px; padding: 22px 26px; min-width: 250px; }
        .dropCard b { display: block; font-size: 28px; letter-spacing: -.04em; }
        .dropCard span { display: inline-block; margin-top: 12px; padding: 9px 14px; border-radius: 999px; background: #38f5d3; color: #04040a; font-size: 12px; font-weight: 1000; text-transform: uppercase; letter-spacing: .14em; }
        .salesCard { right: 12%; bottom: 0; padding: 18px 22px; min-width: 210px; }
        .salesCard small { color: #d2ccff; font-weight: 900; }
        .salesCard b { display: block; margin-top: 8px; font-size: 34px; }
        .salesCard em { color: #38f5d3; font-style: normal; font-weight: 1000; }
        .featureGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }
        .featureGrid div { padding: 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); font-weight: 1000; }
        .formPanel { display: flex; align-items: center; justify-content: center; }
        .formCard { width: min(670px, 100%); position: relative; border-radius: 34px; border: 1px solid rgba(255,255,255,.14); background: rgba(8, 8, 16, .74); box-shadow: 0 30px 80px rgba(0,0,0,.56); padding: 38px; backdrop-filter: blur(18px); }
        .langSwitch { position: absolute; top: 28px; right: 28px; display: flex; gap: 8px; }
        .langSwitch button { border: 1px solid rgba(255,255,255,.18); color: white; background: rgba(255,255,255,.07); border-radius: 999px; padding: 9px 12px; font-weight: 1000; cursor: pointer; }
        .langSwitch button.active { background: #b9a7ff; color: #06040d; }
        .formCard h2 { margin: 0 110px 18px 0; font-size: clamp(38px, 4.3vw, 62px); line-height: .95; letter-spacing: -.07em; }
        .planPill { display: inline-flex; gap: 8px; align-items: center; padding: 10px 14px; border: 1px solid rgba(255,255,255,.14); border-radius: 999px; background: rgba(255,255,255,.05); color: #c7bfff; font-weight: 1000; margin-bottom: 22px; }
        .gridTwo { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        label { display: grid; gap: 8px; color: white; font-weight: 1000; font-size: 14px; }
        input, select { width: 100%; min-height: 56px; box-sizing: border-box; border-radius: 16px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.06); color: #fff; padding: 0 16px; font-size: 16px; font-weight: 800; outline: none; }
        select option { color: #111; }
        input:focus, select:focus { border-color: #b9a7ff; box-shadow: 0 0 0 4px rgba(185,167,255,.18); }
        .checkRow { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
        .checkRow input { width: 26px; min-height: 26px; accent-color: #b9a7ff; }
        .message { border-radius: 16px; padding: 15px 16px; margin-bottom: 16px; font-weight: 1000; }
        .message.error { border: 1px solid rgba(255,92,122,.4); background: rgba(255,92,122,.13); color: #ffd6df; }
        .message.success { border: 1px solid rgba(56,245,211,.45); background: rgba(56,245,211,.13); color: #d6fff8; }
        .primaryBtn, .googleBtn { width: 100%; min-height: 62px; border-radius: 999px; border: 0; font-weight: 1000; font-size: 17px; cursor: pointer; }
        .primaryBtn { color: #06040d; background: linear-gradient(135deg, #ffffff, #b9a7ff 52%, #38f5d3); box-shadow: 0 18px 42px rgba(185,167,255,.32); }
        .primaryBtn:disabled { opacity: .65; cursor: wait; }
        .primaryBtn span { margin-left: 12px; }
        .divider { display: flex; align-items: center; gap: 14px; color: rgba(255,255,255,.55); margin: 20px 0; font-weight: 900; }
        .divider:before, .divider:after { content: ''; height: 1px; flex: 1; background: rgba(255,255,255,.12); }
        .googleBtn { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.13); color: white; }
        .switchAuth { text-align: center; color: rgba(255,255,255,.7); font-weight: 800; }
        .switchAuth a { color: #38f5d3; text-decoration: none; font-weight: 1000; }
        @media (max-width: 980px) { .signupShell { grid-template-columns: 1fr; } .visualPanel, .formPanel { min-height: auto; } .visualPanel { border-right: 0; border-bottom: 1px solid rgba(255,255,255,.08); } .fashionCollage { height: 470px; } }
        @media (max-width: 640px) { .visualPanel, .formPanel { padding: 26px 18px; } .gridTwo, .featureGrid { grid-template-columns: 1fr; } .formCard { padding: 24px; } .formCard h2 { margin-right: 0; padding-top: 42px; } .mainShot { width: 82%; } .sneakerCard, .jewelryCard, .luxuryCard { transform: scale(.78); transform-origin: top right; } }
      `}</style>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', background: '#05040a', color: '#fff' }} />}>
      <SignupContent />
    </Suspense>
  );
}
