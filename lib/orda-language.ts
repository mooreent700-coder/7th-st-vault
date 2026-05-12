export type OrdaLang = 'en' | 'es';

export const ORDA_OWNER_LANG_KEY = 'orda_owner_language';

export function isOrdaLang(value: string | null | undefined): value is OrdaLang {
  return value === 'en' || value === 'es';
}

export function saveOrdaOwnerLanguage(lang: OrdaLang) {
  if (typeof window === 'undefined') return;

  localStorage.setItem('orda_owner_language', lang);
  localStorage.setItem('orda_language', lang);
  localStorage.setItem('orda_order_language', lang);

  document.cookie = `orda_owner_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `orda_order_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
}

export function getOrdaOwnerLanguage(fallback: OrdaLang = 'en'): OrdaLang {
  if (typeof window === 'undefined') return fallback;

  const saved =
    localStorage.getItem('orda_owner_language') ||
    localStorage.getItem('orda_language') ||
    localStorage.getItem('orda_order_language');

  return isOrdaLang(saved) ? saved : fallback;
}