import { supabase } from '@/lib/supabase';

export type OrdaImageCatalog = Record<string, string[]>;

const BUCKET = 'menu-images';

function clean(value?: string | null) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[_-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function publicUrl(path: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function getCategoryKey(itemName?: string | null, categoryName?: string | null) {
  const text = `${clean(itemName)} ${clean(categoryName)}`;

  if (text.includes('cheeseburger') || text.includes('burger')) return 'burgers';
  if (text.includes('wing')) return 'wings';
  if (text.includes('tender')) return 'tenders';
  if (text.includes('hot dog') || text.includes('hotdog')) return 'hot_dogs';
  if (text.includes('sandwich')) return 'sandwiches';
  if (text.includes('taco') || text.includes('birria')) return 'tacos';
  if (text.includes('burrito')) return 'burritos';
  if (text.includes('quesadilla')) return 'quesadillas';
  if (text.includes('nacho')) return 'nachos';
  if (text.includes('pizza')) return 'pizza';
  if (text.includes('pasta') || text.includes('alfredo')) return 'pasta';
  if (text.includes('shrimp')) return 'shrimp';
  if (text.includes('crab')) return 'crab';
  if (text.includes('fish')) return 'fish';
  if (text.includes('seafood')) return 'seafood';
  if (text.includes('bbq') || text.includes('rib') || text.includes('brisket')) return 'bbq';
  if (text.includes('fries')) return 'fries';
  if (text.includes('onion ring')) return 'onion_rings';
  if (text.includes('mac')) return 'mac_and_cheese';
  if (text.includes('banana pudding')) return 'banana_pudding';
  if (text.includes('cake')) return 'custom_cakes';
  if (text.includes('cheesecake')) return 'cheesecake';
  if (text.includes('cookie')) return 'cookies';
  if (text.includes('donut')) return 'donuts';
  if (text.includes('smoothie') || text.includes('shake')) return 'smoothies';
  if (text.includes('coffee')) return 'coffee';
  if (text.includes('drink') || text.includes('soda') || text.includes('water') || text.includes('juice') || text.includes('lemonade') || text.includes('tea')) return 'drinks';
  if (text.includes('breakfast') || text.includes('pancake') || text.includes('waffle')) return 'breakfast';
  if (text.includes('brunch')) return 'brunch';
  if (text.includes('combo')) return 'combos';

  return clean(categoryName).replace(/\s+/g, '_') || 'universal';
}

function isImage(name: string) {
  return /\.(jpg|jpeg|png|webp|avif)$/i.test(name);
}

export async function loadImageCatalog() {
  const folders = [
    'burgers','wings','tenders','hot_dogs','sandwiches',
    'tacos','burritos','quesadillas','nachos','mexican',
    'pizza','pasta','bbq','combos','drinks','seafood',
    'shrimp','crab','fish','fries','onion_rings',
    'mac_and_cheese','banana_pudding','custom_cakes',
    'cheesecake','cookies','donuts','smoothies','coffee',
    'breakfast','brunch','universal'
  ];

  const catalog: OrdaImageCatalog = {};

  for (const folder of folders) {
    const { data } = await supabase.storage.from(BUCKET).list(folder, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });

    catalog[folder] = (data || [])
      .filter((file) => isImage(file.name))
      .map((file) => publicUrl(`${folder}/${file.name}`));
  }

  return catalog;
}

export function getImage({
  catalog,
  itemName,
  categoryName,
  imageUrl,
  index = 0,
}: {
  catalog: OrdaImageCatalog;
  itemName?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  index?: number;
}) {
  if (imageUrl?.trim()) return imageUrl.trim();

  const key = getCategoryKey(itemName, categoryName);

  const list =
    catalog[key] ||
    catalog[getCategoryKey(null, categoryName)] ||
    catalog.universal ||
    [];

  if (!list.length) return '';

  return list[Math.abs(index) % list.length];
}

export function getImageOptions({
  catalog,
  itemName,
  categoryName,
}: {
  catalog: OrdaImageCatalog;
  itemName?: string | null;
  categoryName?: string | null;
}) {
  const key = getCategoryKey(itemName, categoryName);
  const list = catalog[key] || catalog.universal || [];

  return list.slice(0, 6).map((url, index) => ({
    url,
    label: `${key.replace(/_/g, ' ')} ${index + 1}`,
    category: key,
  }));
}