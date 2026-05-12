'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';

const OWNER_LANG_KEY = 'orda_owner_language';

function isLang(value: string | null): value is Lang {
  return value === 'en' || value === 'es';
}

function saveOwnerLanguage(nextLang: Lang) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(OWNER_LANG_KEY, nextLang);
  window.localStorage.setItem('orda_language', nextLang);
  window.localStorage.setItem('orda_order_language', nextLang);

  document.cookie = `orda_owner_language=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `orda_order_language=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
}

function getStartupLanguage(searchParams: URLSearchParams): Lang {
  const queryLang = searchParams.get('lang') || searchParams.get('owner_language') || searchParams.get('order_language');

  if (isLang(queryLang)) {
    saveOwnerLanguage(queryLang);
    return queryLang;
  }

  if (typeof window !== 'undefined') {
    const saved =
      window.localStorage.getItem(OWNER_LANG_KEY) ||
      window.localStorage.getItem('orda_language') ||
      window.localStorage.getItem('orda_order_language');

    if (isLang(saved)) return saved;
  }

  return 'en';
}

function generateSlug(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || `store-${Date.now()}`
  );
}

const copy = {
  en: {
    brand: 'ORDA',
    heroTitle: 'Create your ORDA account and start building your restaurant storefront.',
    heroText: 'Set up your business profile, choose your plan, and move straight into your ORDA dashboard.',
    builder: 'Storefront Builder',
    builderText: 'Create your hero section, menu, pricing, phone, and map in one place.',
    checkout: 'Checkout Ready',
    checkoutText: 'Move from setup to customer orders with a direct ORDA checkout experience.',
    title: 'Create Account',
    subtitle: 'Start your ORDA setup and build your storefront.',
    selected: 'Selected plan:',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Your full name',
    businessName: 'Business Name',
    businessNamePlaceholder: 'Restaurant or business name',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: 'Create a password',
    create: 'Create Account',
    creating: 'Creating account...',
    already: 'Already have an account?',
    signIn: 'Sign in',
    signupFailed: 'Signup failed',
    createStoreFailed: 'Failed to create store',
  },
  es: {
    brand: 'ORDA',
    heroTitle: 'Crea tu cuenta de ORDA y empieza a construir la tienda de tu restaurante.',
    heroText: 'Configura el perfil de tu negocio, elige tu plan y entra directamente a tu panel de ORDA.',
    builder: 'Constructor de Tienda',
    builderText: 'Crea tu portada, menú, precios, teléfono y mapa en un solo lugar.',
    checkout: 'Listo para Checkout',
    checkoutText: 'Pasa de la configuración a los pedidos de clientes con una experiencia de checkout directo de ORDA.',
    title: 'Crear Cuenta',
    subtitle: 'Comienza tu configuración de ORDA y crea tu tienda.',
    selected: 'Plan seleccionado:',
    fullName: 'Nombre Completo',
    fullNamePlaceholder: 'Tu nombre completo',
    businessName: 'Nombre del Negocio',
    businessNamePlaceholder: 'Nombre del restaurante o negocio',
    email: 'Correo Electrónico',
    emailPlaceholder: 'tu@ejemplo.com',
    password: 'Contraseña',
    passwordPlaceholder: 'Crea una contraseña',
    create: 'Crear Cuenta',
    creating: 'Creando cuenta...',
    already: '¿Ya tienes una cuenta?',
    signIn: 'Iniciar sesión',
    signupFailed: 'Error al crear cuenta',
    createStoreFailed: 'No se pudo crear la tienda',
  },
} as const;

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'starter';

  const [lang, setLang] = useState<Lang>('en');
  const t = copy[lang];

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const nextLang = getStartupLanguage(searchParams);
    setLang(nextLang);
    saveOwnerLanguage(nextLang);
  }, [searchParams]);

  function changeLanguage(nextLang: Lang) {
    setLang(nextLang);
    saveOwnerLanguage(nextLang);
  }

  const ensureRestaurantRow = async (userId: string) => {
    const { data: existing, error: existingError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.id) {
      await supabase
        .from('restaurants')
        .update({
          owner_language: lang,
          order_language: lang,
        })
        .eq('id', existing.id);

      return;
    }

    const slug = generateSlug(businessName) || generateSlug(fullName);

    const { error: insertError } = await supabase.from('restaurants').insert({
      owner_id: userId,
      user_id: userId,
      owner_email: email.trim(),
      name: businessName.trim(),
      slug,
      plan: selectedPlan,
      phone: null,
      address: null,
      hours: null,
      hero_image: null,
      logo_image: null,
      storefront_theme: 'dark',
      storefront_accent: 'gold',
      storefront_language: 'en',
      owner_language: lang,
      order_language: lang,
      pickup_enabled: true,
      delivery_enabled: false,
      delivery_fee: 0,
      delivery_radius: 5,
      delivery_minimum: 0,
    });

    if (insertError) throw insertError;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    saveOwnerLanguage(lang);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            business_name: businessName.trim(),
            plan: selectedPlan,
            owner_language: lang,
            order_language: lang,
          },
        },
      });

      if (signUpError) {
        alert(signUpError.message);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        alert(signInError.message);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert(userError?.message || t.signupFailed);
        return;
      }

      await ensureRestaurantRow(user.id);

      router.push('/dashboard/owner');
    } catch (error: any) {
      alert(error?.message || t.createStoreFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-slate-200 bg-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_38%)]" />

          <div className="relative flex h-full w-full flex-col justify-between p-10">
            <div>
              <div className="mb-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => changeLanguage('en')}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                    lang === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => changeLanguage('es')}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                    lang === 'es' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  ES
                </button>
              </div>

              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
                {t.brand}
              </div>

              <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight text-slate-950">
                {t.heroTitle}
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">{t.heroText}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-lg font-bold text-slate-950">{t.builder}</p>
                <p className="mt-2 text-sm text-slate-600">{t.builderText}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-lg font-bold text-slate-950">{t.checkout}</p>
                <p className="mt-2 text-sm text-slate-600">{t.checkoutText}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full max-w-xl">
            <div className="mb-4 flex gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                  lang === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('es')}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                  lang === 'es' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                ES
              </button>
            </div>

            <div className="mb-8 lg:hidden">
              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
                {t.brand}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70 sm:p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">{t.title}</h2>
                <p className="mt-2 text-sm text-slate-600 sm:text-base">{t.subtitle}</p>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {t.selected}{' '}
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                    {selectedPlan.toUpperCase()}
                  </span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">{t.fullName}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">{t.businessName}</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={t.businessNamePlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">{t.email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">{t.password}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? t.creating : t.create}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                {t.already}{' '}
                <Link href={`/auth/login?lang=${lang}`} className="font-semibold text-blue-700 hover:text-blue-800">
                  {t.signIn}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SignupPageContent />
    </Suspense>
  );
}