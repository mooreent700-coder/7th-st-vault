import { supabase } from './supabase';

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not logged in');
  return data.user;
}

/**
 * 🔒 CORE RULE:
 * ONE USER = ONE RESTAURANT
 */
export async function ensureOwnerRestaurant() {
  const user = await getUser();

  // 1. Try to find existing restaurant
  const { data: existing, error: findError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (findError) throw findError;

  // 2. If exists → return it
  if (existing) return existing;

  // 3. If NOT → create it ONCE
  const baseName =
    user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9\s]/g, '') || 'my-store';

  const baseSlug = sanitizeSlug(baseName);

  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      owner_id: user.id,
      name: baseName,
      slug: baseSlug,
      storefront_theme: 'light',
      storefront_language: 'en',
      order_language: 'en',
      pickup_enabled: true,
      delivery_enabled: false,
      published: false,
    })
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

/**
 * 🔒 SAFE SAVE (NO DUPLICATES EVER)
 */
export async function saveRestaurant(updates: any) {
  const user = await getUser();

  const { data: restaurant, error: findError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (findError) throw findError;

  const { data, error } = await supabase
    .from('restaurants')
    .update({
      ...updates,
      owner_id: user.id,
    })
    .eq('id', restaurant.id)
    .eq('owner_id', user.id)
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

/**
 * 🔒 GET STORE URL (FOR QR)
 */
export function getStoreUrl(slug: string) {
  if (!slug) return '';

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/store/${slug}`;
  }

  return `/store/${slug}`;
}

/**
 * 🔒 QR CODE GENERATOR (ALWAYS CORRECT SLUG)
 */
export function getQrUrl(slug: string) {
  const url = getStoreUrl(slug);

  return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&data=${encodeURIComponent(
    url
  )}`;
}