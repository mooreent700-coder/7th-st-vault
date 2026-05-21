'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import AdminHoldLogin from '@/components/AdminHoldLogin';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';
type HeroMediaType = 'image' | 'video';
type LandingTheme = 'light' | 'dark';

type InfoCard = { title: string; text: string };
type StepCard = { title: string; text: string };
type PlatformSettingRow = {
  key?: string | null;
  value?: unknown;
  updated_at?: string | null;
  [key: string]: unknown;
};

const OWNER_LANG_KEY = 'vault_seller_language';

const content = {
  en: {
    navHow: 'How it works',
    navPricing: 'Pricing',
    navDiscover: 'Discover Fashion',
    navCreate: 'Start Selling',
    pill: 'Built for fashion sellers, streetwear brands, boutiques, and creators',
    heroTitle: '',
    heroText: '',
    startFree: 'Start Selling',
    builtTitle: 'Built for real fashion sellers',
    builtText: 'A direct-shopping platform that feels premium, alive, and made for clothing brands, shoe sellers, jewelry brands, boutiques, pop-ups, and fashion creators that want customers shopping directly.',
    systemTitle: 'Your system, fully built for you.',
    systemText: 'Everything you need to sell products, present your brand, upload photos/videos, and run your fashion business — already built, clean, mobile-first, and ready to go.',
    discoverEyebrow: '7th St Vault Discover',
    discoverTitle: 'A public fashion feed where customers discover brands, products, looks, drops, and seller storefronts.',
    discoverText: 'Clothing brands, shoe sellers, jewelry brands, boutiques, kids fashion shops, and pop-up sellers can show real product photos and videos in one public discovery page built for scrolling, sharing, and direct shopping.',
    discoverBtn: 'Explore 7th St Vault Discover',
    discoverSellerBtn: 'Create Your Fashion Store',
    discoverOne: 'Video-first fashion discovery',
    discoverTwo: 'Public traffic to your fashion storefront',
    discoverThree: 'Built for real seller uploads',
    pricingEyebrow: 'Pricing',
    pricingTitle: 'Simple pricing that grows with your brand',
    starter: 'Starter',
    starterTop: 'First 3 months free',
    starterPrice: 'Then $19/month',
    starterFee: '10% platform fee',
    growth: 'Growth',
    growthTop: '$49/month',
    growthFee: '5% platform fee',
    premium: 'Premium',
    premiumTop: '$99/month',
    premiumFee: '3% platform fee',
    mostPopular: 'Most Popular',
    getStarted: 'Get Started',
    chooseGrowth: 'Choose Growth',
    goPremium: 'Go Premium',
    showcaseEyebrow: 'Made to feel premium',
    showcaseTitle: 'A fashion storefront that feels like a real brand, not a basic page.',
    showcaseText: '7th St Vault gives sellers, boutiques, streetwear brands, shoe sellers, and jewelry brands a cleaner, stronger online presence with direct shopping built in.',
    cards: [
      { title: 'Brand-ready presentation', text: 'Clean visuals, strong branding, and a premium first impression for customers shopping clothing, shoes, jewelry, and accessories.' },
      { title: 'Perfect for pop-ups and online sellers', text: 'Give customers one clean link to shop fast, find your drops, and trust your brand from their phone.' },
      { title: 'Built for drops and repeat customers', text: 'Present your products, collections, videos, and checkout in a way that feels professional and ready to scale.' },
    ] as InfoCard[],
    howEyebrow: 'How it works',
    howTitle: 'You enter the info. 7th St Vault generates the rest.',
    steps: [
      { title: 'Enter your seller information', text: 'Add your brand name, products, photos, videos, phone number, location, policies, and brand details.' },
      { title: '7th St Vault generates your storefront', text: 'Your products, collections, presentation, checkout, and direct-shopping flow are created for you automatically.' },
      { title: 'Start selling direct', text: 'Share your link and start accepting fashion sales through your own branded system.' },
    ] as StepCard[],
    finalTitle: 'Launch your fashion selling system without building it yourself.',
    finalText: '7th St Vault turns your products into a clean, premium shopping experience in minutes for clothing brands, shoe sellers, jewelry brands, boutiques, and pop-ups.',
  },
  es: {
    navHow: 'Cómo funciona',
    navPricing: 'Precios',
    navDiscover: 'Descubrir Moda',
    navCreate: 'Empezar a Vender',
    pill: 'Hecho para vendedores de moda, streetwear, boutiques y creadores',
    heroTitle: '',
    heroText: '',
    startFree: 'Empieza a Vender',
    builtTitle: 'Hecho para vendedores reales de moda',
    builtText: 'Una plataforma de compras directas que se siente premium, viva y hecha para marcas de ropa, vendedores de zapatos, joyería, boutiques, pop-ups y creadores de moda que quieren vender directamente.',
    systemTitle: 'Tu sistema, completamente hecho para ti.',
    systemText: 'Todo lo que necesitas para vender productos, presentar tu marca, subir fotos/videos y operar tu negocio de moda — ya construido, limpio, mobile-first y listo.',
    discoverEyebrow: '7th St Vault Discover',
    discoverTitle: 'Una página pública donde clientes pueden descubrir marcas, productos, looks, drops y tiendas de vendedores.',
    discoverText: 'Marcas de ropa, vendedores de zapatos, joyería, boutiques, moda para niños y pop-ups pueden mostrar fotos y videos reales de productos en una página pública hecha para explorar, compartir y comprar directo.',
    discoverBtn: 'Explorar 7th St Vault Discover',
    discoverSellerBtn: 'Crear Tu Tienda de Moda',
    discoverOne: 'Descubrimiento de moda con videos',
    discoverTwo: 'Tráfico público hacia tu tienda de moda',
    discoverThree: 'Hecho para contenido real de vendedores',
    pricingEyebrow: 'Precios',
    pricingTitle: 'Precios simples que crecen contigo',
    starter: 'Starter',
    starterTop: 'Primeros 3 meses gratis',
    starterPrice: 'Después $19/mes',
    starterFee: 'Tarifa de plataforma de 10%',
    growth: 'Growth',
    growthTop: '$49/mes',
    growthFee: 'Tarifa de plataforma de 5%',
    premium: 'Premium',
    premiumTop: '$99/mes',
    premiumFee: 'Tarifa de plataforma de 3%',
    mostPopular: 'Más Popular',
    getStarted: 'Comenzar',
    chooseGrowth: 'Elegir Growth',
    goPremium: 'Ir Premium',
    showcaseEyebrow: 'Hecho para sentirse real',
    showcaseTitle: 'Una tienda de moda que se siente como una marca real, no una página básica.',
    showcaseText: '7th St Vault les da a vendedores, boutiques, streetwear, zapatos y joyería una presencia online más limpia y fuerte con compras directas integradas.',
    cards: [
      { title: 'Presentación lista para marca', text: 'Visuales limpios, marca fuerte y una primera impresión premium para clientes comprando ropa, zapatos, joyería y accesorios.' },
      { title: 'Perfecto para pop-ups y vendedores online', text: 'Dales a los clientes un solo enlace limpio para comprar rápido, encontrar tus drops y confiar en la marca desde su teléfono.' },
      { title: 'Hecho para drops y clientes repetidos', text: 'Presenta tus productos, colecciones, videos y checkout de una manera profesional y lista para crecer.' },
    ] as InfoCard[],
    howEyebrow: 'Cómo funciona',
    howTitle: 'Tú ingresas la información. 7th St Vault genera lo demás.',
    steps: [
      { title: 'Ingresa la información de tu tienda', text: 'Agrega el nombre de tu marca, productos, fotos, videos, teléfono, ubicación, políticas y detalles de tu marca.' },
      { title: '7th St Vault genera tu tienda', text: 'Tus productos, colecciones, presentación, checkout y flujo de compra directa se crean automáticamente.' },
      { title: 'Empieza a vender directo', text: 'Comparte tu enlace y empieza a aceptar pedidos de moda a través de tu propio sistema de marca.' },
    ] as StepCard[],
    finalTitle: 'Lanza tu sistema de venta de moda sin construirlo tú mismo.',
    finalText: '7th St Vault convierte tus productos en una experiencia de compra limpia y premium en minutos para ropa, zapatos, joyería, boutiques y pop-ups.',
  },
} as const;

const defaultHeroImage = ''; // Keep empty unless admin uploads a hero. The landing page will read the saved Supabase URL.
const defaultHeroTitle = '';
const defaultHeroText = '';

const showcaseImages = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=90',
];

const discoverImages = [
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=90',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=90',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=90',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=90',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=90',
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=90',
];

function isLang(value: string | null): value is Lang {
  return value === 'en' || value === 'es';
}

function isLandingTheme(value: string | null): value is LandingTheme {
  const clean = String(value || '').trim().toLowerCase();
  return clean === 'light' || clean === 'dark';
}

function normalizeLandingTheme(value: string | null | undefined): LandingTheme | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();

  if (lower === 'dark' || lower === 'black' || lower === 'black landing page' || lower === 'dark landing page') {
    return 'dark';
  }

  if (lower === 'light' || lower === 'white' || lower === 'white landing page' || lower === 'light landing page') {
    return 'light';
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const possible =
      parsed.landing_theme ||
      parsed.landingTheme ||
      parsed.theme ||
      parsed.mode ||
      parsed.landing_page_theme ||
      parsed.landingPageTheme;

    if (typeof possible === 'string') return normalizeLandingTheme(possible);
  } catch {
    // Not JSON. Keep using normal string checks.
  }

  if (lower.includes('dark') || lower.includes('black')) return 'dark';
  if (lower.includes('light') || lower.includes('white')) return 'light';

  return null;
}

function getSavedLandingTheme(): LandingTheme | null {
  if (typeof window === 'undefined') return null;

  const saved =
    window.localStorage.getItem('landing_theme') ||
    window.localStorage.getItem('landing_page_theme') ||
    window.localStorage.getItem('vault_landing_theme') ||
    window.localStorage.getItem('platform_landing_theme');

  return normalizeLandingTheme(saved);
}

function applyLandingThemeToDocument(theme: LandingTheme) {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.landingTheme = theme;
  document.body.dataset.landingTheme = theme;
  document.body.classList.toggle('landing-dark', theme === 'dark');
  document.body.classList.toggle('landing-light', theme === 'light');
}

function isVideoUrl(value: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(value);
}

function saveSellerLanguage(nextLang: Lang) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(OWNER_LANG_KEY, nextLang);
  window.localStorage.setItem('vault_language', nextLang);
  window.localStorage.setItem('vault_order_language', nextLang);
  document.cookie = `vault_seller_language=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `vault_order_language=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
}

function getSavedSellerLanguage(): Lang {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  const queryLang = params.get('lang');
  if (isLang(queryLang)) {
    saveSellerLanguage(queryLang);
    return queryLang;
  }
  const saved = window.localStorage.getItem(OWNER_LANG_KEY);
  return isLang(saved) ? saved : 'en';
}

function normalizeSettingValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === 'string') return parsed.trim();
      if (parsed && typeof parsed === 'object') return normalizeSettingValue(parsed);
    } catch {
      // Normal plain string value.
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const clean = normalizeSettingValue(item);
      if (clean) return clean;
    }
    return '';
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const possibleKeys = [
      'url',
      'src',
      'href',
      'publicUrl',
      'public_url',
      'signedUrl',
      'signed_url',
      'media_url',
      'mediaUrl',
      'image_url',
      'imageUrl',
      'video_url',
      'videoUrl',
      'value',
      'landing_hero_url',
      'landing_hero_media_url',
      'landing_page_hero_url',
      'landing_hero_image_url',
      'landing_hero_video_url',
      'landing_hero_image',
      'landing_hero_video',
      'landing_theme',
      'landing_page_theme',
      'theme',
      'mode',
      'text',
      'title',
      'description',
      'color',
    ];

    for (const key of possibleKeys) {
      const clean = normalizeSettingValue(record[key]);
      if (clean) return clean;
    }
  }

  return '';
}

function extractSpecificSettingValue(value: unknown, keys: string[], depth = 0): string {
  if (value === null || value === undefined || depth > 8) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '{}' || trimmed === '[]' || trimmed.toLowerCase() === 'null') return '';

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object') {
        const nested = extractSpecificSettingValue(parsed, keys, depth + 1);
        if (nested) return nested;
      }
    } catch {
      // Plain text saved directly as the row value.
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractSpecificSettingValue(item, keys, depth + 1);
      if (found) return found;
    }
    return '';
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    for (const key of keys) {
      const exact = normalizeSettingValue(record[key]);
      if (exact) return exact;
    }

    const normalizedTargets = keys.map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, ''));
    for (const [rawKey, rawValue] of Object.entries(record)) {
      const normalizedKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedTargets.includes(normalizedKey)) {
        const exact = normalizeSettingValue(rawValue);
        if (exact) return exact;
      }
    }

    for (const rawValue of Object.values(record)) {
      if (rawValue && typeof rawValue === 'object') {
        const nested = extractSpecificSettingValue(rawValue, keys, depth + 1);
        if (nested) return nested;
      }
    }
  }

  return '';
}

function readSetting(rows: PlatformSettingRow[], keys: string[]) {
  // 1. Exact key/value rows like: { key: 'landing_hero_title', value: '...' }
  for (const key of keys) {
    const row = rows.find((item) => String(item.key || '').trim() === key);
    if (!row) continue;

    const specific = extractSpecificSettingValue(row.value, keys);
    if (specific) return specific;

    const direct = normalizeSettingValue(row.value);
    if (direct) return direct;
  }

  // 2. Column-style rows OR JSON config rows saved by admin.
  for (const row of rows) {
    const rowRecord = row as Record<string, unknown>;

    const fromColumns = extractSpecificSettingValue(rowRecord, keys);
    if (fromColumns) return fromColumns;

    const fromJsonValue = extractSpecificSettingValue(rowRecord.value, keys);
    if (fromJsonValue) return fromJsonValue;
  }

  // 3. Browser fallback only if Supabase is slow.
  if (typeof window !== 'undefined') {
    for (const key of keys) {
      const local =
        window.localStorage.getItem(key) ||
        window.localStorage.getItem(`platform_settings:${key}`) ||
        window.localStorage.getItem(`7sv:${key}`);
      const clean = normalizeSettingValue(local);
      if (clean) return clean;
    }
  }

  return '';
}

function readMediaSetting(rows: PlatformSettingRow[], keys: string[]) {
  const value = readSetting(rows, keys);
  if (!value) return '';

  const clean = value.trim();
  if (!clean || clean === '{}' || clean === '[]' || clean.toLowerCase() === 'null') return '';

  return clean;
}

function getSavedHeroMedia() {
  if (typeof window === 'undefined') return { url: '', type: 'image' as HeroMediaType };

  const savedType = window.localStorage.getItem('landing_hero_media_type');
  const type: HeroMediaType = savedType === 'video' ? 'video' : 'image';
  const url =
    window.localStorage.getItem('landing_hero_url') ||
    window.localStorage.getItem('landing_hero_media_url') ||
    window.localStorage.getItem(type === 'video' ? 'landing_hero_video_url' : 'landing_hero_image_url') ||
    window.localStorage.getItem('platform_settings:landing_hero_url') ||
    window.localStorage.getItem('platform_settings:landing_hero_media_url') ||
    window.localStorage.getItem(type === 'video' ? 'platform_settings:landing_hero_video_url' : 'platform_settings:landing_hero_image_url') ||
    '';

  return { url: normalizeSettingValue(url), type };
}

function getSavedHeroCopy() {
  if (typeof window === 'undefined') return { title: '', text: '' };

  const title =
    window.localStorage.getItem('landing_hero_title') ||
    window.localStorage.getItem('landing_page_hero_title') ||
    window.localStorage.getItem('hero_title') ||
    window.localStorage.getItem('platform_settings:landing_hero_title') ||
    '';

  const text =
    window.localStorage.getItem('landing_hero_text') ||
    window.localStorage.getItem('landing_hero_subtitle') ||
    window.localStorage.getItem('landing_hero_description') ||
    window.localStorage.getItem('landing_page_hero_text') ||
    window.localStorage.getItem('landing_page_hero_subtitle') ||
    window.localStorage.getItem('hero_text') ||
    window.localStorage.getItem('hero_subtitle') ||
    window.localStorage.getItem('hero_description') ||
    window.localStorage.getItem('platform_settings:landing_hero_text') ||
    '';

  return {
    title: normalizeSettingValue(title),
    text: normalizeSettingValue(text),
  };
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('en');
  const [landingTheme, setLandingTheme] = useState<LandingTheme>('light');
  const [heroMediaUrl, setHeroMediaUrl] = useState('');
  const [heroMediaType, setHeroMediaType] = useState<HeroMediaType>('image');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroText, setHeroText] = useState('');
  const [heroTitleColor, setHeroTitleColor] = useState('#ffffff');
  const [heroTextColor, setHeroTextColor] = useState('#ffffff');
  const [heroReady, setHeroReady] = useState(false);
  const [heroMediaLoaded, setHeroMediaLoaded] = useState(false);
  const landingLoadedOnceRef = useRef(false);
  const landingRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = getSavedSellerLanguage();
    const savedTheme = getSavedLandingTheme();

    setLang(saved);
    saveSellerLanguage(saved);

    if (savedTheme) {
      setLandingTheme(savedTheme);
      applyLandingThemeToDocument(savedTheme);
    }
  }, []);

  useEffect(() => {
    applyLandingThemeToDocument(landingTheme);
  }, [landingTheme]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (!event.key) return;
      if (!['landing_theme', 'landing_page_theme', 'vault_landing_theme', 'platform_landing_theme'].includes(event.key)) return;

      const nextTheme = normalizeLandingTheme(event.newValue);
      if (!nextTheme) return;

      setLandingTheme(nextTheme);
      applyLandingThemeToDocument(nextTheme);
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadLandingHero() {
      if (!landingLoadedOnceRef.current) {
        setHeroReady(false);
      }

      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!active) return;

      if (error) {
        const fallbackTheme = getSavedLandingTheme() || 'light';
        const savedHero = getSavedHeroMedia();
        const savedCopy = getSavedHeroCopy();
        setLandingTheme(fallbackTheme);
        applyLandingThemeToDocument(fallbackTheme);
        setHeroMediaUrl(savedHero.url || defaultHeroImage);
        setHeroMediaType(savedHero.type);
        setHeroTitle(savedCopy.title || defaultHeroTitle);
        setHeroText(savedCopy.text || defaultHeroText);
        setHeroTitleColor('#ffffff');
        setHeroTextColor('#ffffff');
        landingLoadedOnceRef.current = true;
        setHeroReady(true);
        return;
      }

      const rows = (data || []) as PlatformSettingRow[];
      const themeValue = readSetting(rows, [
        'landing_theme',
        'landing_page_theme',
        'landing_mode',
        'landing_color_mode',
        'landing_theme_mode',
        'landing_page_mode',
        'landing_display_mode',
        'site_theme',
        'site_mode',
        'theme',
        'mode',
        'public_landing_theme',
        'public_landing_mode',
      ]);
      const finalLandingTheme = normalizeLandingTheme(themeValue) || getSavedLandingTheme() || 'light';
      const explicitType = readSetting(rows, ['landing_hero_type', 'landing_hero_media_type']).toLowerCase();
      const videoUrl = readMediaSetting(rows, ['landing_hero_video_url', 'landing_hero_video', 'hero_video_url', 'hero_video', 'landing_video_url', 'landing_video']);
      const imageUrl = readMediaSetting(rows, ['landing_hero_image_url', 'landing_hero_image', 'hero_image_url', 'hero_image', 'landing_image_url', 'landing_image', 'landing_hero_photo_url', 'landing_hero_photo']);
      const mediaUrl = readMediaSetting(rows, ['landing_hero_url', 'landing_hero_media_url', 'landing_page_hero_url', 'hero_media_url', 'hero_url', 'landing_media_url', 'landing_page_media_url']);
      const title = readSetting(rows, ['landing_hero_title', 'landing_page_hero_title', 'landing_title', 'landing_page_title', 'hero_title', 'hero_headline', 'headline', 'title']);
      const text = readSetting(rows, ['landing_hero_text', 'landing_hero_subtitle', 'landing_hero_description', 'landing_page_hero_text', 'landing_page_hero_subtitle', 'landing_page_hero_description', 'landing_subtitle', 'landing_description', 'hero_text', 'hero_subtitle', 'hero_description', 'subtitle', 'description']);
      const titleColor = readSetting(rows, ['landing_hero_title_color', 'landing_page_hero_title_color', 'hero_title_color']);
      const textColor = readSetting(rows, ['landing_hero_text_color', 'landing_hero_description_color', 'landing_page_hero_text_color', 'landing_page_hero_description_color', 'hero_text_color', 'hero_description_color']);
      const preferredMediaUrl = mediaUrl || videoUrl || imageUrl;
      const finalType: HeroMediaType = explicitType === 'video' || isVideoUrl(preferredMediaUrl) || (!explicitType && Boolean(videoUrl)) ? 'video' : 'image';
      const finalUrl = finalType === 'video'
        ? (videoUrl || (isVideoUrl(mediaUrl) ? mediaUrl : '') || preferredMediaUrl || '')
        : (imageUrl || (!isVideoUrl(mediaUrl) ? mediaUrl : '') || (!isVideoUrl(preferredMediaUrl) ? preferredMediaUrl : '') || defaultHeroImage);

      if (typeof window !== 'undefined') {
        if (finalUrl) {
          window.localStorage.setItem('landing_hero_url', finalUrl);
          window.localStorage.setItem('landing_hero_media_url', finalUrl);
          window.localStorage.setItem(finalType === 'video' ? 'landing_hero_video_url' : 'landing_hero_image_url', finalUrl);
        }
        window.localStorage.setItem('landing_hero_media_type', finalType);
        if (title) {
          window.localStorage.setItem('landing_hero_title', title);
          window.localStorage.setItem('landing_page_hero_title', title);
          window.localStorage.setItem('hero_title', title);
        }
        if (text) {
          window.localStorage.setItem('landing_hero_text', text);
          window.localStorage.setItem('landing_hero_subtitle', text);
          window.localStorage.setItem('landing_page_hero_text', text);
          window.localStorage.setItem('hero_text', text);
        }
      }

      setLandingTheme(finalLandingTheme);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('landing_theme', finalLandingTheme);
        window.localStorage.setItem('landing_page_theme', finalLandingTheme);
        window.localStorage.setItem('vault_landing_theme', finalLandingTheme);
        window.localStorage.setItem('platform_landing_theme', finalLandingTheme);
      }

      applyLandingThemeToDocument(finalLandingTheme);

      setHeroMediaUrl((currentUrl) => {
        if (currentUrl !== finalUrl) setHeroMediaLoaded(false);
        return finalUrl;
      });
      setHeroMediaType(finalType);
      setHeroTitle(title || defaultHeroTitle);
      setHeroText(text || defaultHeroText);
      setHeroTitleColor(titleColor || '#ffffff');
      setHeroTextColor(textColor || '#ffffff');
      landingLoadedOnceRef.current = true;
      setHeroReady(true);
    }

    void loadLandingHero();

    const channel = supabase
      .channel('vault-landing-page-settings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => {
        if (landingRefreshTimerRef.current) clearTimeout(landingRefreshTimerRef.current);
        landingRefreshTimerRef.current = setTimeout(() => {
          void loadLandingHero();
        }, 250);
      })
      .subscribe();

    return () => {
      active = false;
      if (landingRefreshTimerRef.current) clearTimeout(landingRefreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const t = content[lang];

  const links = useMemo(() => {
    const query = `lang=${lang}&seller_language=${lang}&order_language=${lang}`;
    return {
      signupStarter: `/auth/signup?plan=starter&${query}`,
      signupBase: `/auth/signup?${query}`,
      checkoutGrowth: `/auth/checkout?plan=growth&${query}`,
      checkoutPremium: `/auth/checkout?plan=premium&${query}`,
      discover: '/discover',
    };
  }, [lang]);

  function changeLanguage(nextLang: Lang) {
    setLang(nextLang);
    saveSellerLanguage(nextLang);
  }

  return (
    <main className={`page landing-${landingTheme}`}>
      <header className="header">
        <div className="headerInner">
          <div className="logoArea">
            <AdminHoldLogin>
              <Link href="/" className="logoWrap" aria-label="7th St Vault home">
                <img src="/7sv-logo.png" alt="7th St Vault" className="logoImage" />
              </Link>
            </AdminHoldLogin>
          </div>

          <nav className="headerRight" aria-label="Main navigation">
            <a href="#how" className="navLink">{t.navHow}</a>
            <a href="#pricing" className="navLink">{t.navPricing}</a>
            <div className="langWrap" aria-label="Language switcher">
              <button type="button" onClick={() => changeLanguage('en')} className={lang === 'en' ? 'langButton active' : 'langButton'}>EN</button>
              <button type="button" onClick={() => changeLanguage('es')} className={lang === 'es' ? 'langButton active' : 'langButton'}>ES</button>
            </div>
            <Link href={links.signupBase} className="navButton" onClick={() => saveSellerLanguage(lang)}>{t.navCreate}</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="heroBlackBg" />
        {heroReady && heroMediaType === 'video' && heroMediaUrl ? (
          <video
            key={heroMediaUrl}
            src={heroMediaUrl}
            className={heroMediaLoaded ? 'heroImage heroVideo mediaReady' : 'heroImage heroVideo'}
            autoPlay
            muted
            playsInline
            preload="auto"
            poster=""
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              video.muted = true;
              video.currentTime = 0;
              video.play().catch(() => null);
            }}
            onCanPlay={(event) => {
              const video = event.currentTarget;
              video.muted = true;
              if (video.currentTime === 0 || video.paused) video.play().catch(() => null);
              setHeroMediaLoaded(true);
            }}
            onEnded={(event) => {
              const video = event.currentTarget;
              video.pause();
              video.currentTime = video.duration || video.currentTime;
            }}
          />
        ) : heroReady && heroMediaUrl ? (
          <img src={heroMediaUrl} alt="Premium fashion storefront visual" className={heroMediaLoaded ? 'heroImage mediaReady' : 'heroImage'} onLoad={() => setHeroMediaLoaded(true)} onError={() => { setHeroMediaLoaded(false); }} />
        ) : null}
        <div className="heroOverlay" />
        <div className="heroShadow" />
        <div className={heroReady ? 'heroContent ready' : 'heroContent'}>
          <div className="pill">{t.pill}</div>
          {heroReady ? (
            <>
              {heroTitle ? <h1 className="heroTitle" style={{ color: heroTitleColor }}>{heroTitle}</h1> : null}
              {heroText ? <p className="heroText" style={{ color: heroTextColor }}>{heroText}</p> : null}
            </>
          ) : <div className="heroTextSkeleton" />}
          <div className="heroButtons">
            <Link href={links.signupStarter} className="primaryBtn" onClick={() => saveSellerLanguage(lang)}>
              <span>{t.startFree}</span><span className="arrow">›</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="introBand">
        <div className="container introGrid">
          <article className="introItem"><div className="introIcon">▤</div><div><h2 className="introTitle">{t.builtTitle}</h2><p className="introText">{t.builtText}</p></div></article>
          <article className="introItem bordered"><div className="introIcon">⌁</div><div><h2 className="introTitle">{t.systemTitle}</h2><p className="introText">{t.systemText}</p></div></article>
        </div>
      </section>

      <section className="discoverSection">
        <div className="container discoverGrid">
          <div className="discoverCopy">
            <div className="eyebrow">{t.discoverEyebrow}</div>
            <h2 className="discoverTitle">{t.discoverTitle}</h2>
            <p className="discoverText">{t.discoverText}</p>
            <div className="discoverCtaGrid">
              <div className="discoverInfoPanel">
                <div className="discoverCleanPoint"><span className="discoverCleanIcon">▶</span><div><strong>{t.discoverOne}</strong><small>Real product videos, lookbook clips, and fashion posts customers can scroll.</small></div></div>
                <div className="discoverCleanPoint"><span className="discoverCleanIcon">↗</span><div><strong>{t.discoverTwo}</strong><small>Every post sends people straight to the seller storefront.</small></div></div>
                <div className="discoverCleanPoint"><span className="discoverCleanIcon">⬆</span><div><strong>{t.discoverThree}</strong><small>Photos and videos come from real seller uploads.</small></div></div>
              </div>
              <div className="discoverButtonStack" />
            </div>
          </div>

          <Link href={links.discover} className="discoverVisual" aria-label={t.discoverBtn}>
            <div className="phoneMock">
              <div className="phoneTop"><span>7SV</span><b>Discover</b></div>
              <div className="miniExplore">
                {discoverImages.map((src, index) => (
                  <div key={src} className={index === 0 || index === 4 ? 'miniTile largeMiniTile' : 'miniTile'}>
                    <img src={src} alt="7th St Vault fashion discovery preview" />
                    <div className="miniShade" />
                    {index === 1 || index === 3 ? <i>▶</i> : null}
                  </div>
                ))}
              </div>
            </div>
          </Link>

          <div className="discoverPictureButtonRow">
            <Link href="/discover" className="discoverFashionButton" aria-label="Open 7th St Vault Discover page">
              <span className="discoverFashionArrow">↗</span><span className="discoverFashionText">Click to go to<br />Fashion Discover</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricingSection">
        <div className="container">
          <div className="smallCenter"><div className="eyebrow">{t.pricingEyebrow}</div><h2 className="sectionTitle">{t.pricingTitle}</h2></div>
          <div className="pricingGrid">
            <article className="priceCard"><div className="priceBody"><h3 className="priceName">{t.starter}</h3><div className="priceTop">{t.starterTop}</div><div className="priceSub">{t.starterPrice}</div><div className="priceDivider" /><div className="priceFee">{t.starterFee}</div></div><Link href={links.signupStarter} className="cardBtn" onClick={() => saveSellerLanguage(lang)}>{t.getStarted}</Link></article>
            <article className="priceCard featured silverGrowthCard"><div className="priceBody"><div className="badge">{t.mostPopular}</div><h3 className="priceName featuredText">{t.growth}</h3><div className="priceTop featuredText">{t.growthTop}</div><div className="priceDivider silverLine" /><div className="priceFee featuredText mutedSilver">{t.growthFee}</div></div><Link href={links.checkoutGrowth} className="cardBtnGrowth" onClick={() => saveSellerLanguage(lang)}>{t.chooseGrowth}</Link></article>
            <article className="priceCard"><div className="priceBody"><h3 className="priceName">{t.premium}</h3><div className="priceTop">{t.premiumTop}</div><div className="priceDivider" /><div className="priceFee">{t.premiumFee}</div></div><Link href={links.checkoutPremium} className="cardBtn" onClick={() => saveSellerLanguage(lang)}>{t.goPremium}</Link></article>
          </div>
        </div>
      </section>

      <section className="showcaseSection">
        <div className="container">
          <div className="smallCenter"><div className="eyebrow">{t.showcaseEyebrow}</div><h2 className="sectionTitle">{t.showcaseTitle}</h2><p className="sectionText">{t.showcaseText}</p></div>
          <div className="imageGrid">
            {showcaseImages.map((src, index) => (
              <article key={src} className="imageCard"><img src={src} alt={t.cards[index].title} className="imageCardImg" /><div className="imageCardBody"><h3 className="imageCardTitle">{t.cards[index].title}</h3><p className="imageCardText">{t.cards[index].text}</p></div></article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="howSection">
        <div className="container">
          <div className="smallCenter"><div className="eyebrow">{t.howEyebrow}</div><h2 className="sectionTitle">{t.howTitle}</h2></div>
          <div className="stepGrid">
            {t.steps.map((step, index) => (
              <article key={step.title} className="stepCard"><div className="stepNumber">{index + 1}</div><div className="stepContent"><h3 className="stepTitle">{step.title}</h3><p className="stepText">{step.text}</p></div></article>
            ))}
          </div>
        </div>
      </section>

      <section className="finalSection">
        <div className="container">
          <div className="finalCard"><div><h2 className="finalTitle">{t.finalTitle}</h2><p className="finalText">{t.finalText}</p></div><Link href={links.signupStarter} className="finalBtn" onClick={() => saveSellerLanguage(lang)}><span>{t.startFree}</span><span className="arrow">›</span></Link></div>
        </div>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
.page{background:#f8f8f5;color:#111827;min-height:100vh;overflow-x:hidden;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.page.landing-dark{background:#05070a;color:#f8fafc}.header{position:sticky;top:0;z-index:50;background:rgba(248,248,245,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(17,24,39,.08)}.landing-dark .header{background:rgba(5,7,10,.9);border-bottom:1px solid rgba(255,255,255,.1)}.headerInner{width:100%;max-width:1240px;margin:0 auto;padding:6px 18px;display:flex;align-items:center;justify-content:space-between;gap:18px}.logoArea{display:flex;align-items:center;flex-shrink:0;min-width:270px;min-height:64px}.logoWrap{display:inline-flex;align-items:center;text-decoration:none;cursor:pointer}.logoImage{width:260px;max-width:260px;height:auto;display:block;object-fit:contain}.vaultLogo{display:grid;line-height:.9;color:#111827;text-decoration:none;letter-spacing:-.04em}.landing-dark .vaultLogo{color:#fff}.vaultLogo span{font-size:13px;font-weight:1000;letter-spacing:.22em}.vaultLogo b{font-size:34px;font-weight:1000;letter-spacing:-.08em}.headerRight{display:flex;align-items:center;justify-content:flex-end;gap:22px;flex-wrap:wrap}.navLink{text-decoration:none;color:#1f2937;font-size:15px;font-weight:750;letter-spacing:-.01em}.landing-dark .navLink{color:#e5e7eb}.navLink:hover{color:#000}.landing-dark .navLink:hover{color:#fff}.langWrap{display:inline-flex;align-items:center;gap:3px;padding:4px;background:rgba(255,255,255,.85);border:1px solid rgba(17,24,39,.12);border-radius:14px;box-shadow:0 8px 20px rgba(15,23,42,.05)}.landing-dark .langWrap{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14)}.langButton{appearance:none;border:none;min-width:44px;height:34px;border-radius:10px;background:transparent;color:#1f2937;font-size:14px;font-weight:850;cursor:pointer}.landing-dark .langButton{color:#f8fafc}.langButton.active{background:#101820;color:#fff;box-shadow:0 10px 18px rgba(15,23,42,.16)}.landing-dark .langButton.active{background:#fff;color:#101820}.navButton,.primaryBtn,.cardBtn,.cardBtnGrowth,.finalBtn{text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:10px;font-weight:850;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}.navButton{min-height:38px;padding:0 18px;border-radius:12px;background:#fff;color:#111827;border:1px solid rgba(17,24,39,.12);box-shadow:0 10px 22px rgba(15,23,42,.08)}.landing-dark .navButton{background:#111827;color:#fff;border-color:rgba(255,255,255,.14)}.navButton:hover{transform:translateY(-1px)}.hero{position:relative;width:100%;aspect-ratio:16/9;min-height:auto;max-height:calc(100vh - 72px);display:flex;align-items:center;overflow:hidden;background:#05070a}.heroImage,.heroBlackBg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;background:#05070a}.heroImage{opacity:1}.heroImage.mediaReady{opacity:1}.heroOverlay{position:absolute;inset:0;background:radial-gradient(circle at 76% 40%,rgba(255,255,255,.06),transparent 26%),linear-gradient(90deg,rgba(0,0,0,.7) 0%,rgba(0,0,0,.44) 46%,rgba(0,0,0,.12) 100%),linear-gradient(180deg,rgba(0,0,0,.08) 0%,rgba(0,0,0,.68) 100%)}.heroShadow{position:absolute;inset:auto 0 0;height:36%;background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,.78) 100%)}.heroContent{position:relative;z-index:2;width:100%;max-width:1240px;height:100%;margin:0 auto;padding:clamp(78px,7vw,112px) 22px clamp(38px,5vw,68px);color:#fff;display:flex;flex-direction:column;justify-content:flex-end}.heroContent:not(.ready){opacity:0}.pill{display:inline-flex;align-items:center;width:fit-content;min-height:38px;padding:0 16px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.28);color:#fff;font-size:14px;font-weight:800;backdrop-filter:blur(10px)}.heroTitle{margin:18px 0 0;max-width:670px;font-size:clamp(38px,5.1vw,72px);line-height:.94;font-weight:950;letter-spacing:-.06em;text-wrap:balance;text-shadow:0 2px 22px rgba(0,0,0,.28)}.heroText{margin:17px 0 0;max-width:560px;font-size:clamp(16px,1.5vw,20px);line-height:1.48;color:rgba(255,255,255,.92);text-shadow:0 2px 16px rgba(0,0,0,.24)}.heroTextSkeleton{min-height:260px}.heroButtons{margin-top:22px;display:flex}.primaryBtn{min-height:54px;padding:0 28px;border-radius:12px;background:#fff;color:#111827;box-shadow:0 18px 36px rgba(0,0,0,.22)}.primaryBtn:hover,.finalBtn:hover,.cardBtn:hover,.cardBtnGrowth:hover{transform:translateY(-2px)}.arrow{font-size:28px;line-height:1;transform:translateY(-1px)}.container{width:100%;max-width:1140px;margin:0 auto;padding:0 18px}.introBand{background:#f8f8f5;border-bottom:1px solid rgba(17,24,39,.08)}.landing-dark .introBand{background:#080b10;border-bottom-color:rgba(255,255,255,.09)}.introGrid{display:grid;grid-template-columns:1fr 1fr;gap:0}.introItem{min-height:180px;display:grid;grid-template-columns:84px 1fr;gap:26px;align-items:center;padding:34px 34px 34px 0}.introItem.bordered{border-left:1px solid rgba(17,24,39,.14);padding-left:34px;padding-right:0}.landing-dark .introItem.bordered{border-left-color:rgba(255,255,255,.12)}.introIcon{width:72px;height:72px;border-radius:999px;display:grid;place-items:center;background:#0f1720;color:#d8b177;font-size:30px;font-weight:900;box-shadow:0 16px 34px rgba(15,23,42,.14)}.introTitle{margin:0;color:#111827;font-size:24px;line-height:1.16;font-weight:900;letter-spacing:-.03em}.landing-dark .introTitle{color:#f9fafb}.introText{margin:10px 0 0;color:#374151;font-size:16px;line-height:1.65}.landing-dark .introText{color:#cbd5e1}.discoverSection{padding:74px 0;background:radial-gradient(circle at 84% 20%,rgba(37,99,235,.18),transparent 26%),linear-gradient(135deg,#07090d 0%,#111827 50%,#050608 100%);color:#fff;overflow:hidden}.discoverGrid{display:grid;grid-template-columns:minmax(0,.95fr) minmax(340px,.85fr);gap:44px;align-items:center}.eyebrow{color:#bd8b50;font-size:13px;line-height:1;font-weight:950;letter-spacing:.19em;text-transform:uppercase}.discoverCopy .eyebrow{color:#2563eb}.discoverTitle{margin:14px 0 0;font-size:clamp(34px,5.5vw,62px);line-height:.95;font-weight:950;letter-spacing:-.06em}.discoverText{margin:18px 0 0;color:rgba(255,255,255,.8);font-size:18px;line-height:1.7;max-width:620px}.discoverCtaGrid{margin-top:30px;display:grid;grid-template-columns:minmax(320px,430px) minmax(320px,430px);gap:30px;align-items:center;width:min(100%,910px);position:relative;z-index:6}.discoverInfoPanel{padding:18px;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.045));border:1px solid rgba(255,255,255,.14);display:grid;gap:12px}.discoverCleanPoint{min-height:74px;display:grid;grid-template-columns:48px 1fr;gap:14px;align-items:center;padding:13px 15px;border-radius:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10)}.discoverCleanIcon{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-size:19px;font-weight:1000}.discoverCleanPoint strong{display:block;color:#fff;font-size:17px;line-height:1.15;font-weight:950}.discoverCleanPoint small{display:block;margin-top:5px;color:rgba(255,255,255,.68);font-size:13px;line-height:1.35}.discoverVisual{display:block;text-decoration:none;color:inherit}.discoverPictureButtonRow{width:100%;display:flex;justify-content:center;align-items:center;margin-top:24px;position:relative;z-index:50;grid-column:2}.discoverFashionButton{position:relative;min-height:72px;min-width:280px;padding:0 24px;border-radius:22px;display:inline-flex;align-items:center;justify-content:center;gap:14px;text-decoration:none;overflow:hidden;border:2px solid rgba(255,255,255,.62);background:radial-gradient(circle at 18% 18%,rgba(255,255,255,.42),transparent 24%),linear-gradient(135deg,#2563eb 0%,#1d4ed8 50%,#1e40af 100%);box-shadow:0 0 20px rgba(37,99,235,.95),0 0 46px rgba(37,99,235,.85),0 0 84px rgba(37,99,235,.55),0 14px 34px rgba(0,0,0,.35);animation:discoverBubbleGlow 1.9s ease-in-out infinite}.discoverFashionButton::before{content:'';position:absolute;inset:0;background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,.48) 42%,transparent 74%);transform:translateX(-135%);animation:discoverBubbleShine 3s infinite}.discoverFashionArrow{position:relative;z-index:3;color:#fff;font-size:38px;font-weight:1000;line-height:1;transform:rotate(-12deg) translateY(-1px)}.discoverFashionText{position:relative;z-index:3;color:#fff;font-size:20px;font-weight:950;line-height:1.05;letter-spacing:-.035em;text-align:left}@keyframes discoverBubbleGlow{0%,100%{box-shadow:0 0 20px rgba(37,99,235,.88),0 0 46px rgba(37,99,235,.74),0 0 84px rgba(37,99,235,.46),0 14px 34px rgba(0,0,0,.35)}50%{box-shadow:0 0 30px rgba(37,99,235,1),0 0 76px rgba(37,99,235,1),0 0 128px rgba(37,99,235,.72),0 18px 44px rgba(0,0,0,.4)}}@keyframes discoverBubbleShine{0%{transform:translateX(-135%)}100%{transform:translateX(165%)}}.phoneMock{width:min(100%,440px);margin-left:auto;border-radius:38px;padding:14px;background:#05070b;border:1px solid rgba(255,255,255,.14);box-shadow:0 34px 90px rgba(0,0,0,.36),0 0 70px rgba(37,99,235,.16);transform:rotate(2deg)}.phoneTop{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 8px 12px;color:#fff}.phoneTop span{color:#2563eb;font-size:22px;font-weight:950;letter-spacing:.14em}.phoneTop b{font-size:12px;text-transform:uppercase;letter-spacing:.16em}.miniExplore{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:118px;gap:5px;overflow:hidden;border-radius:26px}.miniTile{position:relative;overflow:hidden;background:#111827}.largeMiniTile{grid-column:span 2;grid-row:span 2}.miniTile img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(1.08) contrast(1.05)}.miniShade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.46),transparent 58%)}.miniTile i{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:999px;background:rgba(0,0,0,.56);color:#fff;display:grid;place-items:center;font-size:12px;font-style:normal}.pricingSection,.showcaseSection,.howSection,.finalSection{padding:64px 0;background:#f8f8f5}.landing-dark .pricingSection,.landing-dark .howSection{background:#05070a}.showcaseSection,.finalSection{background:#f1f2ef}.landing-dark .showcaseSection,.landing-dark .finalSection{background:#080b10}.smallCenter{max-width:900px;margin:0 auto;text-align:center}.sectionTitle{margin:12px 0 0;color:#111827;font-size:clamp(32px,5vw,50px);line-height:1.05;font-weight:950;letter-spacing:-.05em;text-wrap:balance}.landing-dark .sectionTitle{color:#f9fafb}.sectionText{margin:16px auto 0;max-width:820px;color:#374151;font-size:17px;line-height:1.75}.landing-dark .sectionText{color:#cbd5e1}.pricingGrid{margin-top:34px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;align-items:stretch}.priceCard{min-height:298px;padding:28px;border-radius:20px;background:rgba(255,255,255,.94);border:1px solid rgba(17,24,39,.1);box-shadow:0 18px 44px rgba(15,23,42,.06);display:flex;flex-direction:column;justify-content:space-between;gap:24px}.landing-dark .priceCard{background:rgba(17,24,39,.92);border-color:rgba(255,255,255,.1);box-shadow:0 22px 54px rgba(0,0,0,.32)}.priceBody{display:flex;flex-direction:column}.priceName{margin:0;color:#111827;font-size:26px;line-height:1.1;font-weight:950;letter-spacing:-.035em}.landing-dark .priceName{color:#f9fafb}.priceTop{margin-top:14px;color:#111827;font-size:clamp(31px,4vw,42px);line-height:1.03;font-weight:950;letter-spacing:-.055em}.landing-dark .priceTop{color:#f9fafb}.priceSub{margin-top:8px;color:#374151;font-size:17px;font-weight:650}.landing-dark .priceSub,.landing-dark .priceFee{color:#cbd5e1}.priceDivider{width:100%;height:1px;background:rgba(17,24,39,.1);margin:22px 0 0}.landing-dark .priceDivider{background:rgba(255,255,255,.12)}.priceFee{margin-top:18px;color:#374151;font-size:16px;line-height:1.5;font-weight:700}.cardBtn,.cardBtnGrowth{width:100%;min-height:48px;border-radius:8px;padding:0 16px;font-size:15px}.cardBtn{background:#0f1720;color:#fff}.landing-dark .cardBtn{background:#fff;color:#0f1720}.cardBtnGrowth{background:linear-gradient(145deg,#fff 0%,#f3f4f6 45%,#e5e7eb 100%);color:#111827;border:1px solid rgba(17,24,39,.12)}.landing-dark .cardBtnGrowth{background:linear-gradient(145deg,#ffffff 0%,#f3f4f6 45%,#d1d5db 100%);color:#111827;border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 30px rgba(0,0,0,.25)}.featured{transform:translateY(-10px)}.silverGrowthCard{background:radial-gradient(circle at 18% 12%,rgba(255,255,255,.9),transparent 24%),linear-gradient(145deg,#fff 0%,#eef0f2 18%,#c9ced4 35%,#8f98a3 52%,#d7dbe0 72%,#fff 100%);border:1px solid rgba(115,125,137,.65);color:#111827;box-shadow:inset 0 2px 4px rgba(255,255,255,.92),inset 0 -4px 10px rgba(0,0,0,.16),0 24px 54px rgba(15,23,42,.15)}.landing-dark .silverGrowthCard{background:radial-gradient(circle at 18% 12%,rgba(255,255,255,.16),transparent 24%),linear-gradient(145deg,#f8fafc 0%,#e5e7eb 24%,#cbd5e1 48%,#94a3b8 72%,#f8fafc 100%);border:1px solid rgba(255,255,255,.22)}.featuredText{color:#111827!important}.landing-dark .featuredText{color:#0f172a!important;text-shadow:none!important;opacity:1!important;visibility:visible!important}.mutedSilver{color:#1f2937!important}.landing-dark .mutedSilver{color:#111827!important;opacity:1!important;visibility:visible!important}.silverLine{background:rgba(17,24,39,.18)!important}.landing-dark .silverLine{background:rgba(15,23,42,.24)!important}.landing-dark .silverGrowthCard,.landing-dark .silverGrowthCard *{color:#0f172a!important}.landing-dark .silverGrowthCard .badge{background:rgba(255,255,255,.78)!important;color:#0f172a!important;border-color:rgba(15,23,42,.14)!important}.landing-dark .silverGrowthCard .cardBtnGrowth{background:linear-gradient(145deg,#ffffff 0%,#f3f4f6 45%,#d1d5db 100%)!important;color:#111827!important;border:1px solid rgba(15,23,42,.14)!important;box-shadow:0 10px 30px rgba(0,0,0,.25)!important}.badge{width:fit-content;display:inline-flex;min-height:32px;align-items:center;justify-content:center;padding:0 14px;border-radius:999px;background:rgba(255,255,255,.72);color:#111827;border:1px solid rgba(17,24,39,.08);font-size:12px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px}.imageGrid{margin-top:34px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px}.imageCard{overflow:hidden;border-radius:18px;background:#fff;border:1px solid rgba(17,24,39,.1);box-shadow:0 18px 42px rgba(15,23,42,.07)}.landing-dark .imageCard{background:#111827;border-color:rgba(255,255,255,.1)}.imageCardImg{width:100%;height:188px;object-fit:cover;object-position:center;display:block}.imageCardBody{padding:18px}.imageCardTitle{margin:0;color:#111827;font-size:18px;line-height:1.25;font-weight:900;letter-spacing:-.025em}.landing-dark .imageCardTitle{color:#f9fafb}.imageCardText{margin:10px 0 0;color:#374151;font-size:15px;line-height:1.62}.landing-dark .imageCardText{color:#cbd5e1}.stepGrid{margin-top:38px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;align-items:start}.stepCard{position:relative;display:grid;grid-template-columns:56px 1fr;gap:16px;align-items:start}.stepCard:not(:last-child)::after{content:'';position:absolute;top:28px;right:-16px;width:28px;height:1px;background:rgba(17,24,39,.22)}.landing-dark .stepCard:not(:last-child)::after{background:rgba(255,255,255,.18)}.stepNumber{width:52px;height:52px;border-radius:999px;display:grid;place-items:center;background:#0f1720;color:#fff;font-size:19px;font-weight:950;box-shadow:0 16px 34px rgba(15,23,42,.14)}.landing-dark .stepNumber{background:#fff;color:#0f1720}.stepTitle{margin:0;color:#111827;font-size:17px;line-height:1.24;font-weight:950;letter-spacing:-.025em}.landing-dark .stepTitle{color:#f9fafb}.stepText{margin:8px 0 0;color:#374151;font-size:14px;line-height:1.65}.landing-dark .stepText{color:#cbd5e1}.finalCard{min-height:188px;border-radius:20px;padding:34px 54px;background:radial-gradient(circle at 82% 20%,rgba(255,255,255,.08),transparent 24%),linear-gradient(135deg,#0a0f14 0%,#111827 50%,#06080b 100%);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:34px;box-shadow:0 24px 56px rgba(15,23,42,.18)}.finalTitle{margin:0;max-width:580px;font-size:clamp(30px,4vw,42px);line-height:1.05;font-weight:950;letter-spacing:-.045em}.finalText{margin:12px 0 0;max-width:590px;color:rgba(255,255,255,.86);font-size:16px;line-height:1.6}.finalBtn{flex-shrink:0;min-width:196px;min-height:58px;padding:0 26px;border-radius:10px;background:#fff;color:#111827;box-shadow:0 18px 36px rgba(0,0,0,.24)}@media(max-width:980px){.headerInner{align-items:center;flex-direction:row}.headerRight{width:auto;justify-content:flex-end;gap:10px}.introGrid,.discoverGrid{grid-template-columns:1fr}.phoneMock{margin:0 auto;transform:none}.discoverPictureButtonRow{width:100%;margin:20px auto 0;grid-column:1}.discoverFashionButton{width:100%;min-width:0;min-height:70px}.discoverFashionText{font-size:18px}.discoverFashionArrow{font-size:34px}.introItem,.introItem.bordered{border-left:none;padding:30px 0}.introItem.bordered{border-top:1px solid rgba(17,24,39,.1)}.landing-dark .introItem.bordered{border-top-color:rgba(255,255,255,.12)}.pricingGrid,.imageGrid,.stepGrid{grid-template-columns:1fr}.featured{transform:none}.stepCard:not(:last-child)::after{display:none}.finalCard{flex-direction:column;align-items:flex-start;padding:30px}.finalBtn{width:100%}}@media(max-width:640px){.header{position:static}.logoArea{min-width:auto}.logoImage{width:210px;max-width:210px}.vaultLogo b{font-size:28px}.vaultLogo span{font-size:11px}.headerRight{display:grid;grid-template-columns:1fr 1fr;align-items:center}.navLink{min-height:42px;display:inline-flex;align-items:center}.langWrap{grid-column:1/-1;width:100%}.langButton{flex:1}.navButton{grid-column:1/-1;width:100%}.hero{aspect-ratio:4/3;min-height:auto;max-height:none}.heroOverlay{background:linear-gradient(90deg,rgba(0,0,0,.58),rgba(0,0,0,.26)),linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.72))}.heroContent{height:100%;padding:20px 18px 12px;justify-content:flex-end}.pill{min-height:22px;padding:0 9px;font-size:9px;margin-bottom:5px}.heroTitle{margin-top:0;max-width:195px;font-size:clamp(15px,4.8vw,21px);line-height:.92;letter-spacing:-.05em}.heroText{margin-top:5px;max-width:215px;font-size:10px;line-height:1.18}.heroTextSkeleton{min-height:70px}.heroButtons{margin-top:8px;display:grid;width:100%;max-width:150px}.primaryBtn{width:100%;max-width:150px;min-height:32px;padding:0 12px;border-radius:8px;font-size:11px}.arrow{font-size:22px}.introItem{grid-template-columns:1fr;gap:16px}.discoverSection{padding:42px 0 44px;overflow-x:hidden}.discoverSection .container{max-width:100%;padding-left:16px;padding-right:16px;overflow:hidden}.discoverGrid{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;overflow:hidden}.discoverCopy{min-width:0;max-width:100%;overflow:hidden}.discoverTitle{max-width:100%;font-size:clamp(27px,8.5vw,40px);line-height:.98;letter-spacing:-.055em}.discoverText{max-width:100%;font-size:15px;line-height:1.48}.discoverCtaGrid{width:100%;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:22px}.discoverInfoPanel{width:100%;max-width:100%;padding:12px;border-radius:22px}.discoverCleanPoint{min-height:64px;grid-template-columns:42px minmax(0,1fr);gap:12px;padding:11px 12px;border-radius:18px}.discoverCleanIcon{width:42px;height:42px;border-radius:14px;font-size:17px}.discoverCleanPoint strong{font-size:15px;line-height:1.12}.discoverCleanPoint small{font-size:12px;line-height:1.25}.discoverVisual{width:100%;max-width:100%;overflow:hidden;display:flex;justify-content:center}.phoneMock{width:min(78vw,318px);max-width:318px;margin:0 auto;padding:10px;border-radius:30px;transform:none}.phoneTop{height:42px;padding:0 6px 8px}.phoneTop span{font-size:18px}.phoneTop b{font-size:10px}.miniExplore{grid-auto-rows:78px;gap:4px;border-radius:20px}.discoverPictureButtonRow{width:100%;max-width:100%;margin:18px auto 0;grid-column:1;justify-content:center;overflow:hidden}.discoverFashionButton{width:100%;max-width:100%;min-width:0;min-height:58px;padding:0 16px;border-radius:20px;gap:11px}.discoverFashionText{font-size:16px;line-height:1.04;white-space:normal}.discoverFashionArrow{font-size:30px;flex-shrink:0}.pricingSection,.showcaseSection,.howSection,.finalSection{padding:52px 0}.priceCard{padding:24px}.finalCard{padding:26px 20px}}@media(max-width:430px){.logoArea{min-width:auto}.heroContent{padding:14px 16px 10px}.pill{font-size:8.5px;min-height:21px}.heroTitle{max-width:180px;font-size:clamp(14px,4.5vw,19px)}.heroText{max-width:200px;font-size:9.5px}.heroButtons{max-width:142px}.primaryBtn{min-height:30px;max-width:142px}.logoImage{width:190px;max-width:190px}.vaultLogo b{font-size:25px}.vaultLogo span{font-size:10px}.discoverSection{padding:36px 0 40px}.discoverSection .container{padding-left:14px;padding-right:14px}.discoverTitle{font-size:clamp(25px,8vw,36px)}.discoverText{font-size:14px}.phoneMock{width:min(80vw,298px);max-width:298px;margin-left:auto;margin-right:auto}.miniExplore{grid-auto-rows:72px}.discoverFashionButton{min-height:54px}.discoverFashionText{font-size:15px}.discoverFashionArrow{font-size:28px}}
`;
