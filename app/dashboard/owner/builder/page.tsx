'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'es';
type Availability = 'available' | 'sold_out';
type SectionKey = 'store' | 'branding' | 'theme' | 'menu' | 'flyers';
type ExpandedSection = SectionKey | null;
type PlanKey = 'starter' | 'growth' | 'premium';
type FlyerStyle = 'street' | 'clean' | 'seafood' | 'bbq';

type RestaurantRow = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  name?: string | null;
  slug?: string | null;
  phone?: string | null;
  address?: string | null;
  hero_image?: string | null;
  hero_url?: string | null;
  logo_image?: string | null;
  logo_url?: string | null;
  storefront_theme?: string | null;
  storefront_language?: string | null;
  order_language?: string | null;
  pickup_enabled?: boolean | null;
  delivery_enabled?: boolean | null;
  delivery_fee?: number | null;
  delivery_radius?: number | null;
  delivery_minimum?: number | null;
  plan?: string | null;
  created_at?: string | null;
};

type MenuCategoryRow = {
  id: string;
  restaurant_id?: string | null;
  name?: string | null;
  sort_order?: number | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id?: string | null;
  category_id?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  base_price?: number | null;
  image?: string | null;
  image_url?: string | null;
  availability?: string | null;
  is_available?: boolean | null;
  available?: boolean | null;
  sort_order?: number | null;
  position?: number | null;
};

type OptionGroupRow = {
  id: string;
  item_id?: string | null;
  name?: string | null;
  is_required?: boolean | null;
  is_multiple?: boolean | null;
  selection_mode?: string | null;
  sort_order?: number | null;
};

type OptionChoiceRow = {
  id: string;
  option_group_id?: string | null;
  name?: string | null;
  price?: number | null;
  price_delta?: number | null;
  sort_order?: number | null;
};

type BuilderOption = {
  id: string;
  name: string;
  price: string;
};

type BuilderOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  selection: 'single' | 'multiple';
  options: BuilderOption[];
};

type BuilderItem = {
  id: string;
  category_id: string;
  name: string;
  price: string;
  description: string;
  image_url: string;
  image_source: 'upload' | 'placeholder' | 'empty';
  availability: Availability;
  option_groups: BuilderOptionGroup[];
};

type BuilderCategory = {
  id: string;
  name: string;
  sort_order: number;
  items: BuilderItem[];
};

const FLYER_LINKS = {
  '100': 'https://buy.stripe.com/aFacN4dydgbdarf6Pw2wU0c',
  '250': 'https://buy.stripe.com/00w6oG8dTf798j77TA2wU0d',
  '500': 'https://buy.stripe.com/eVqaEWcu95wz6aZb5M2wU0e',
} as const;

const PLAN_LABELS: Record<PlanKey, string> = {
  starter: 'Starter',
  growth: 'Growth',
  premium: 'Premium',
};

const PLAN_COPY: Record<PlanKey, string> = {
  starter: '1st month free • then $19/mo • 10% fee/order • 6 placeholders max',
  growth: '$49/mo • 5% fee/order • unlimited placeholders',
  premium: '$99/mo • 3% fee/order • unlimited placeholders',
};

const PLACEHOLDER_LIBRARY: Record<string, string[]> = {
  bbq: [
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  ],
  breakfast: [
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=1200&q=80',
  ],
  combos: [
    'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
  ],
  desserts: [
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80',
  ],
  drinks: [
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=1200&q=80',
  ],
  mexican: [
    'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565299585323-38174c4a6e0f?auto=format&fit=crop&w=1200&q=80',
  ],
  pasta: [
    'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80',
  ],
  sandwiches: [
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80',
  ],
  seafood: [
    'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
  ],
  sides: [
    'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=1200&q=80',
  ],
  singles: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  ],
  wings: [
    'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=1200&q=80',
  ],
};

const HERO_BUCKET = 'heroes';
const LOGO_BUCKET = 'logos';
const ITEM_BUCKET = 'menu-items';

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function sanitizeNumberInput(value: string) {
  return value.replace(/[^0-9.]/g, '');
}

function money(value: string | number | null | undefined) {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.replace(/[^0-9.-]/g, ''))
      : 0;

  if (!Number.isFinite(num)) return '$0';
  return `$${num.toFixed(2).replace(/\\.00$/, '')}`;
}

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizePlan(value: string | null | undefined): PlanKey {
  const next = String(value || '').toLowerCase();
  if (next === 'growth' || next === 'premium') return next;
  return 'starter';
}

function normalizeLanguage(value: string | null | undefined): LanguageMode {
  return String(value || 'en').toLowerCase() === 'es' ? 'es' : 'en';
}

function normalizeTheme(value: string | null | undefined): ThemeMode {
  return String(value || 'light').toLowerCase() === 'dark' ? 'dark' : 'light';
}

function normalizeAvailability(item: MenuItemRow): Availability {
  if (item.availability === 'sold_out' || item.is_available === false || item.available === false) return 'sold_out';
  return 'available';
}

function normalizeSelectionMode(group: OptionGroupRow): 'single' | 'multiple' {
  if (group.selection_mode === 'multiple' || group.is_multiple) return 'multiple';
  return 'single';
}

function deriveFolderFromCategory(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('seafood')) return 'seafood';
  if (normalized.includes('wing')) return 'wings';
  if (normalized.includes('bbq')) return 'bbq';
  if (normalized.includes('breakfast')) return 'breakfast';
  if (normalized.includes('drink')) return 'drinks';
  if (normalized.includes('dessert')) return 'desserts';
  if (normalized.includes('pasta')) return 'pasta';
  if (normalized.includes('sandwich') || normalized.includes('burger')) return 'sandwiches';
  if (normalized.includes('combo')) return 'combos';
  if (normalized.includes('side')) return 'sides';
  if (normalized.includes('taco') || normalized.includes('mex') || normalized.includes('burrito') || normalized.includes('quesadilla')) return 'mexican';
  return 'singles';
}

function pickFlyerStyle(categories: BuilderCategory[]): FlyerStyle {
  const joined = categories.map((category) => category.name.toLowerCase()).join(' ');
  if (joined.includes('seafood')) return 'seafood';
  if (joined.includes('bbq')) return 'bbq';
  if (joined.includes('street') || joined.includes('taco') || joined.includes('mex')) return 'street';
  return 'clean';
}

function getPlaceholderLimit(plan: PlanKey) {
  if (plan === 'starter') return 6;
  return Number.POSITIVE_INFINITY;
}

function getEmptyBuilderState() {
  const categoryId = uid('cat');
  const itemId = uid('item');

  return [
    {
      id: categoryId,
      name: 'Featured',
      sort_order: 0,
      items: [
        {
          id: itemId,
          category_id: categoryId,
          name: 'New Item',
          price: '0',
          description: '',
          image_url: '',
          image_source: 'empty' as const,
          availability: 'available' as const,
          option_groups: [],
        },
      ],
    },
  ] satisfies BuilderCategory[];
}

function MiniIcon({ children }: { children: ReactNode }) {
  return <span className="miniIcon">{children}</span>;
}

function SectionCard({
  section,
  icon,
  title,
  summary,
  right,
  expanded,
  onToggle,
}: {
  section: SectionKey;
  icon: ReactNode;
  title: string;
  summary?: ReactNode;
  right?: ReactNode;
  expanded: boolean;
  onToggle: (section: SectionKey) => void;
}) {
  return (
    <button type="button" className={expanded ? 'sectionCard sectionCardActive' : 'sectionCard'} onClick={() => onToggle(section)}>
      <div className="sectionHead">
        <div className="sectionLeft">
          <MiniIcon>{icon}</MiniIcon>
          <div className="sectionTitle">{title}</div>
        </div>
        <div className="sectionRight">
          {right ? <span className="sectionMeta">{right}</span> : null}
          <span className="sectionArrow">{expanded ? '−' : '›'}</span>
        </div>
      </div>
      {summary ? <div className="sectionSummary">{summary}</div> : null}
    </button>
  );
}

export default function BuilderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [plan, setPlan] = useState<PlanKey>('starter');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [storefrontLanguage, setStorefrontLanguage] = useState<LanguageMode>('en');
  const [orderLanguage, setOrderLanguage] = useState<LanguageMode>('en');
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryRadius, setDeliveryRadius] = useState('5');
  const [deliveryMinimum, setDeliveryMinimum] = useState('0');

  const [categories, setCategories] = useState<BuilderCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [expanded, setExpanded] = useState<ExpandedSection>('store');

  const [flyerQty, setFlyerQty] = useState<'100' | '250' | '500'>('100');
  const [flyerStyleOverride, setFlyerStyleOverride] = useState<FlyerStyle | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  useEffect(() => {
    setSlug(slugify(name));
  }, [name]);

  useEffect(() => {
    void loadBuilder();
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const selectedItem = useMemo(() => {
    const items = categories.flatMap((category) => category.items);
    return items.find((item) => item.id === selectedItemId) || items[0] || null;
  }, [categories, selectedItemId]);

  const previewSlug = slug || slugify(name);
  const themeClass = theme === 'dark' ? 'themeDark' : 'themeLight';
  const flyerStyle = flyerStyleOverride || pickFlyerStyle(categories);
  const placeholderLimit = getPlaceholderLimit(plan);

  const placeholderCount = useMemo(() => {
    return categories.reduce((count, category) => {
      return count + category.items.filter((item) => item.image_source === 'placeholder' && item.image_url).length;
    }, 0);
  }, [categories]);

  const placeholderChoices = useMemo(() => {
    const folder = deriveFolderFromCategory(selectedCategory?.name || 'singles');
    return PLACEHOLDER_LIBRARY[folder] || PLACEHOLDER_LIBRARY.singles;
  }, [selectedCategory]);

  const flyerTitle = name.trim() || 'Your Store';
  const flyerSub = selectedCategory?.name || 'Custom Flyer';
  const flyerImage = selectedItem?.image_url || heroImage || placeholderChoices[0] || '';

  async function loadBuilder() {
    setLoading(true);
    setError('');
    setSuccess('');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace('/login');
      return;
    }

    setOwnerId(user.id);

    try {
      let restaurant: RestaurantRow | null = null;

      const { data: byOwner } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      restaurant = (byOwner as RestaurantRow | null) || null;

      if (!restaurant) {
        const { data: byUser } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        restaurant = (byUser as RestaurantRow | null) || null;
      }

      if (!restaurant) {
        const { data: created, error: createError } = await supabase
          .from('restaurants')
          .insert({
            owner_id: user.id,
            user_id: user.id,
            name: '',
            slug: '',
            storefront_theme: 'light',
            storefront_language: 'en',
            order_language: 'en',
            pickup_enabled: true,
            delivery_enabled: false,
            delivery_fee: 0,
            delivery_radius: 5,
            delivery_minimum: 0,
            plan: 'starter',
          })
          .select('*')
          .single();

        if (createError) throw createError;
        restaurant = created as RestaurantRow;
      }

      setRestaurantId(restaurant.id);
      setPlan(normalizePlan(restaurant.plan));
      setName(restaurant.name || '');
      setSlug(restaurant.slug || '');
      setPhone(restaurant.phone || '');
      setAddress(restaurant.address || '');
      setHeroImage(restaurant.hero_image || restaurant.hero_url || '');
      setLogoImage(restaurant.logo_image || restaurant.logo_url || '');
      setTheme(normalizeTheme(restaurant.storefront_theme));
      setStorefrontLanguage(normalizeLanguage(restaurant.storefront_language));
      setOrderLanguage(normalizeLanguage(restaurant.order_language));
      setPickupEnabled(restaurant.pickup_enabled ?? true);
      setDeliveryEnabled(restaurant.delivery_enabled ?? false);
      setDeliveryFee(String(restaurant.delivery_fee ?? 0));
      setDeliveryRadius(String(restaurant.delivery_radius ?? 5));
      setDeliveryMinimum(String(restaurant.delivery_minimum ?? 0));

      await loadMenuData(restaurant.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load builder.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMenuData(currentRestaurantId: string) {
    const { data: categoryRows, error: categoryError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', currentRestaurantId)
      .order('sort_order', { ascending: true });

    if (categoryError) throw categoryError;

    const { data: itemRows, error: itemError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', currentRestaurantId)
      .order('sort_order', { ascending: true });

    if (itemError) throw itemError;

    const items = safeArray(itemRows) as MenuItemRow[];
    const itemIds = items.map((item) => item.id);

    let groupRows: OptionGroupRow[] = [];
    let choiceRows: OptionChoiceRow[] = [];

    if (itemIds.length) {
      const { data, error } = await supabase
        .from('menu_option_groups')
        .select('*')
        .in('item_id', itemIds)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      groupRows = safeArray(data) as OptionGroupRow[];

      const groupIds = groupRows.map((group) => group.id);

      if (groupIds.length) {
        const { data: choiceData, error: choiceError } = await supabase
          .from('menu_option_choices')
          .select('*')
          .in('option_group_id', groupIds)
          .order('sort_order', { ascending: true });

        if (choiceError) throw choiceError;
        choiceRows = safeArray(choiceData) as OptionChoiceRow[];
      }
    }

    const nextCategories: BuilderCategory[] = safeArray(categoryRows as MenuCategoryRow[]).map((category, index) => ({
      id: category.id,
      name: category.name || `Category ${index + 1}`,
      sort_order: category.sort_order ?? index,
      items: items
        .filter((item) => item.category_id === category.id)
        .map((item) => ({
          id: item.id,
          category_id: category.id,
          name: item.name || '',
          price: String(item.base_price ?? item.price ?? 0),
          description: item.description || '',
          image_url: item.image_url || item.image || '',
          image_source: item.image_url || item.image ? 'upload' : 'empty',
          availability: normalizeAvailability(item),
          option_groups: groupRows
            .filter((group) => group.item_id === item.id)
            .map((group) => ({
              id: group.id,
              name: group.name || 'Options',
              required: !!group.is_required,
              selection: normalizeSelectionMode(group),
              options: choiceRows
                .filter((choice) => choice.option_group_id === group.id)
                .map((choice) => ({
                  id: choice.id,
                  name: choice.name || 'Choice',
                  price: String(choice.price_delta ?? choice.price ?? 0),
                })),
            })),
        })),
    }));

    const finalCategories = nextCategories.length ? nextCategories : getEmptyBuilderState();
    setCategories(finalCategories);
    setSelectedCategoryId(finalCategories[0]?.id || '');
    setSelectedItemId(finalCategories[0]?.items[0]?.id || '');
  }

  async function uploadFile(file: File, bucket: string) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${ownerId || 'owner'}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleHeroUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingHero(true);
      setError('');
      const url = await uploadFile(file, HERO_BUCKET);
      setHeroImage(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hero upload failed.');
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      setError('');
      const url = await uploadFile(file, LOGO_BUCKET);
      setLogoImage(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Logo upload failed.');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleItemImageUpload(itemId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingItemId(itemId);
      setError('');
      const url = await uploadFile(file, ITEM_BUCKET);
      setCategories((current) =>
        current.map((category) => ({
          ...category,
          items: category.items.map((item) =>
            item.id === itemId ? { ...item, image_url: url, image_source: 'upload' } : item
          ),
        }))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Item image upload failed.');
    } finally {
      setUploadingItemId(null);
    }
  }

  function usePlaceholder(itemId: string, url: string) {
    const nextCategories = categories.map((category) => ({
      ...category,
      items: category.items.map((item) =>
        item.id === itemId ? { ...item, image_url: url, image_source: 'placeholder' } : item
      ),
    }));

    const nextCount = nextCategories.reduce((count, category) => {
      return count + category.items.filter((item) => item.image_source === 'placeholder' && item.image_url).length;
    }, 0);

    if (plan === 'starter' && nextCount > 6) {
      setError('Starter plan placeholder limit reached (6). Upgrade to Growth or Premium for unlimited placeholders.');
      return;
    }

    setCategories(nextCategories);
    setError('');
  }

  function toggleSection(section: SectionKey) {
    setExpanded((current) => (current === section ? null : section));
  }

  function addCategory() {
    const categoryId = uid('cat');
    const next: BuilderCategory = {
      id: categoryId,
      name: 'New Category',
      sort_order: categories.length,
      items: [],
    };

    setCategories((current) => [...current, next]);
    setSelectedCategoryId(categoryId);
    setSelectedItemId('');
    setExpanded('menu');
  }

  function deleteCategory(categoryId: string) {
    const next = categories.filter((category) => category.id !== categoryId);
    if (!next.length) return;
    setCategories(next);
    setSelectedCategoryId(next[0].id);
    setSelectedItemId(next[0].items[0]?.id || '');
  }

  function updateCategory(categoryId: string, nameValue: string) {
    setCategories((current) =>
      current.map((category) => (category.id === categoryId ? { ...category, name: nameValue } : category))
    );
  }

  function addItem(categoryId: string) {
    const itemId = uid('item');
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  id: itemId,
                  category_id: categoryId,
                  name: 'New Item',
                  price: '0',
                  description: '',
                  image_url: '',
                  image_source: 'empty',
                  availability: 'available',
                  option_groups: [],
                },
              ],
            }
          : category
      )
    );
    setSelectedCategoryId(categoryId);
    setSelectedItemId(itemId);
    setExpanded('menu');
  }

  function updateItem(itemId: string, patch: Partial<BuilderItem>) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      }))
    );
  }

  function deleteItem(categoryId: string, itemId: string) {
    const nextCategories = categories.map((category) =>
      category.id === categoryId ? { ...category, items: category.items.filter((item) => item.id !== itemId) } : category
    );
    setCategories(nextCategories);

    const nextCategory = nextCategories.find((category) => category.id === categoryId) || nextCategories[0] || null;
    setSelectedCategoryId(nextCategory?.id || '');
    setSelectedItemId(nextCategory?.items[0]?.id || '');
  }

  function addOptionGroup(itemId: string) {
    const groupId = uid('group');
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: [
                  ...item.option_groups,
                  {
                    id: groupId,
                    name: 'Options',
                    required: false,
                    selection: 'single',
                    options: [{ id: uid('choice'), name: 'Choice 1', price: '0' }],
                  },
                ],
              }
            : item
        ),
      }))
    );
  }

  function updateOptionGroup(itemId: string, groupId: string, patch: Partial<BuilderOptionGroup>) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
              }
            : item
        ),
      }))
    );
  }

  function deleteOptionGroup(itemId: string, groupId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId ? { ...item, option_groups: item.option_groups.filter((group) => group.id !== groupId) } : item
        ),
      }))
    );
  }

  function addChoice(itemId: string, groupId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.id === groupId
                    ? {
                        ...group,
                        options: [...group.options, { id: uid('choice'), name: 'New Choice', price: '0' }],
                      }
                    : group
                ),
              }
            : item
        ),
      }))
    );
  }

  function updateChoice(itemId: string, groupId: string, choiceId: string, patch: Partial<BuilderOption>) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.id === groupId
                    ? { ...group, options: group.options.map((choice) => (choice.id === choiceId ? { ...choice, ...patch } : choice)) }
                    : group
                ),
              }
            : item
        ),
      }))
    );
  }

  function deleteChoice(itemId: string, groupId: string, choiceId: string) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                option_groups: item.option_groups.map((group) =>
                  group.id === groupId ? { ...group, options: group.options.filter((choice) => choice.id !== choiceId) } : group
                ),
              }
            : item
        ),
      }))
    );
  }

  async function saveAll() {
    if (!restaurantId || !ownerId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const currentSlug = slugify(name);

      const restaurantPayload = {
        owner_id: ownerId,
        user_id: ownerId,
        name: name.trim() || null,
        slug: currentSlug || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        hero_image: heroImage || null,
        hero_url: heroImage || null,
        logo_image: logoImage || null,
        logo_url: logoImage || null,
        storefront_theme: theme,
        storefront_language: storefrontLanguage,
        order_language: orderLanguage,
        pickup_enabled: pickupEnabled,
        delivery_enabled: deliveryEnabled,
        delivery_fee: Number(deliveryFee || 0),
        delivery_radius: Number(deliveryRadius || 0),
        delivery_minimum: Number(deliveryMinimum || 0),
        plan,
      };

      const { error: restaurantError } = await supabase.from('restaurants').update(restaurantPayload).eq('id', restaurantId);
      if (restaurantError) throw restaurantError;

      const { data: existingCategoryRows } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', restaurantId);

      const existingCategoryIds = safeArray(existingCategoryRows).map((row: { id: string }) => row.id);

      let existingItemIds: string[] = [];
      if (existingCategoryIds.length) {
        const { data: existingItemRows } = await supabase.from('menu_items').select('id').eq('restaurant_id', restaurantId);
        existingItemIds = safeArray(existingItemRows).map((row: { id: string }) => row.id);
      }

      let existingGroupIds: string[] = [];
      if (existingItemIds.length) {
        const { data: existingGroupRows } = await supabase.from('menu_option_groups').select('id').in('item_id', existingItemIds);
        existingGroupIds = safeArray(existingGroupRows).map((row: { id: string }) => row.id);
      }

      if (existingGroupIds.length) {
        const { error: deleteChoiceError } = await supabase.from('menu_option_choices').delete().in('option_group_id', existingGroupIds);
        if (deleteChoiceError) throw deleteChoiceError;
      }

      if (existingItemIds.length) {
        const { error: deleteGroupError } = await supabase.from('menu_option_groups').delete().in('item_id', existingItemIds);
        if (deleteGroupError) throw deleteGroupError;

        const { error: deleteItemError } = await supabase.from('menu_items').delete().in('id', existingItemIds);
        if (deleteItemError) throw deleteItemError;
      }

      if (existingCategoryIds.length) {
        const { error: deleteCategoryError } = await supabase.from('menu_categories').delete().in('id', existingCategoryIds);
        if (deleteCategoryError) throw deleteCategoryError;
      }

      const categoryPayload = categories.map((category, index) => ({
        id: category.id,
        restaurant_id: restaurantId,
        name: category.name.trim() || `Category ${index + 1}`,
        sort_order: index,
      }));

      if (categoryPayload.length) {
        const { error: categoryError } = await supabase.from('menu_categories').insert(categoryPayload);
        if (categoryError) throw categoryError;
      }

      const itemPayload = categories.flatMap((category, categoryIndex) =>
        category.items.map((item, itemIndex) => ({
          id: item.id,
          restaurant_id: restaurantId,
          category_id: category.id,
          name: item.name.trim() || 'New Item',
          description: item.description.trim() || null,
          price: Number(item.price || 0),
          base_price: Number(item.price || 0),
          image: item.image_url || null,
          image_url: item.image_url || null,
          availability: item.availability,
          is_available: item.availability === 'available',
          available: item.availability === 'available',
          sort_order: itemIndex,
          position: categoryIndex * 100 + itemIndex,
        }))
      );

      if (itemPayload.length) {
        const { error: itemError } = await supabase.from('menu_items').insert(itemPayload);
        if (itemError) throw itemError;
      }

      const groupPayload = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.option_groups.map((group, index) => ({
            id: group.id,
            item_id: item.id,
            name: group.name.trim() || 'Options',
            is_required: group.required,
            is_multiple: group.selection === 'multiple',
            selection_mode: group.selection,
            sort_order: index,
          }))
        )
      );

      if (groupPayload.length) {
        const { error: groupError } = await supabase.from('menu_option_groups').insert(groupPayload);
        if (groupError) throw groupError;
      }

      const choicePayload = categories.flatMap((category) =>
        category.items.flatMap((item) =>
          item.option_groups.flatMap((group) =>
            group.options.map((choice, index) => ({
              id: choice.id,
              option_group_id: group.id,
              name: choice.name.trim() || 'Choice',
              price: Number(choice.price || 0),
              price_delta: Number(choice.price || 0),
              sort_order: index,
            }))
          )
        )
      );

      if (choicePayload.length) {
        const { error: choiceError } = await supabase.from('menu_option_choices').insert(choicePayload);
        if (choiceError) throw choiceError;
      }

      setSuccess('Builder saved.');
      await loadBuilder();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  const qrValue =
    typeof window !== 'undefined' && previewSlug
      ? `${window.location.origin}/store/${previewSlug}`
      : `/store/${previewSlug || 'your-store'}`;

  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrValue)}`;

  function renderFlyerBackgroundClass() {
    if (flyerStyle === 'street') return 'flyerStreet';
    if (flyerStyle === 'seafood') return 'flyerSeafood';
    if (flyerStyle === 'bbq') return 'flyerBbq';
    return 'flyerClean';
  }

  if (loading) {
    return (
      <main className="page">
        <div className="shell">
          <div className="headerBar" />
          <div className="loadingCard">Loading builder...</div>
        </div>
        <style jsx>{baseStyles}</style>
      </main>
    );
  }

  return (
    <main className={`page ${themeClass}`}>
      <div className="shell">
        <div className="headerBar" />

        <div className="topBar">
          <div>
            <div className="brand">MENUFLOW <span>BUILDER</span></div>
            <div className="subBrand">{PLAN_LABELS[plan]} • {PLAN_COPY[plan]}</div>
          </div>

          <div className="topActions">
            <button
              type="button"
              className="toggleMini"
              onClick={() => setOrderLanguage(orderLanguage === 'en' ? 'es' : 'en')}
            >
              {orderLanguage.toUpperCase()}
            </button>

            <button type="button" className="saveButton" onClick={saveAll} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        <section className="hero">
          {heroImage ? <img src={heroImage} alt="Hero" className="heroImage" /> : <div className="heroFallback" />}
          <div className="heroShade" />
          <div className="heroContent">
            {logoImage ? <img src={logoImage} alt="Logo" className="heroLogo" /> : <div className="heroLogo placeholderLogo">{(name || 'M').charAt(0)}</div>}
            <div className="heroText">
              <h1>{name || 'Your Store'}</h1>
              <div>{address || '123 Main St'}</div>
              <div>{phone || '(323) 555-1212'}</div>
            </div>
          </div>
        </section>

        <div className="previewActionRow">
          <Link href={previewSlug ? `/store/${previewSlug}` : '#'} target="_blank" className="previewButton">
            Preview Store
          </Link>
        </div>

        <div className="desktopGrid">
          <div className="leftCol">
            <SectionCard
              section="store"
              icon="⌂"
              title="Store Setup"
              right="One owner = one store"
              expanded={expanded === 'store'}
              onToggle={toggleSection}
              summary={
                <div className="summary">
                  <strong>{name || 'Your Store'}</strong>
                  <span>{previewSlug ? `/store/${previewSlug}` : '/store/your-store'}</span>
                  <span>{phone || 'Phone not set'}</span>
                </div>
              }
            />

            {expanded === 'store' ? (
              <div className="panel">
                <label className="field">
                  <span>Store Name</span>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </label>

                <label className="field">
                  <span>Live URL</span>
                  <div className="readBox">{previewSlug ? `/store/${previewSlug}` : '/store/your-store'}</div>
                </label>

                <label className="field">
                  <span>Phone</span>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>

                <label className="field">
                  <span>Address</span>
                  <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
                </label>
              </div>
            ) : null}

            <SectionCard
              section="branding"
              icon="▣"
              title="Branding"
              right="Hero & logo"
              expanded={expanded === 'branding'}
              onToggle={toggleSection}
              summary={<div className="summary"><span>Uploads persist after save.</span></div>}
            />

            {expanded === 'branding' ? (
              <div className="panel">
                <div className="uploadGrid">
                  <div className="uploadCard">
                    <div className="uploadLabel">Hero Image</div>
                    <label className="uploadButton">
                      {uploadingHero ? 'Uploading...' : 'Upload Hero'}
                      <input hidden type="file" accept="image/*" onChange={handleHeroUpload} />
                    </label>
                    <button type="button" className="ghostButton" onClick={() => setHeroImage('')}>
                      Remove Hero
                    </button>
                    <div className="previewBox">
                      {heroImage ? <img src={heroImage} alt="Hero preview" className="fillImage" /> : <div className="placeholderBox">Hero Preview</div>}
                    </div>
                  </div>

                  <div className="uploadCard">
                    <div className="uploadLabel">Logo Image</div>
                    <label className="uploadButton">
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      <input hidden type="file" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                    <button type="button" className="ghostButton" onClick={() => setLogoImage('')}>
                      Remove Logo
                    </button>
                    <div className="previewBox">
                      {logoImage ? <img src={logoImage} alt="Logo preview" className="containImage" /> : <div className="placeholderBox">Logo Preview</div>}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <SectionCard
              section="theme"
              icon="◐"
              title="Theme & Language"
              right={`${theme} • owner ${orderLanguage.toUpperCase()} • store ${storefrontLanguage.toUpperCase()}`}
              expanded={expanded === 'theme'}
              onToggle={toggleSection}
            />

            {expanded === 'theme' ? (
              <div className="panel">
                <div className="field">
                  <span>Store Theme</span>
                  <div className="chipRow">
                    <button type="button" className={theme === 'light' ? 'chip active' : 'chip'} onClick={() => setTheme('light')}>Light</button>
                    <button type="button" className={theme === 'dark' ? 'chip active' : 'chip'} onClick={() => setTheme('dark')}>Dark</button>
                  </div>
                </div>

                <div className="field">
                  <span>Storefront Default Language</span>
                  <div className="chipRow">
                    <button type="button" className={storefrontLanguage === 'en' ? 'chip active' : 'chip'} onClick={() => setStorefrontLanguage('en')}>EN</button>
                    <button type="button" className={storefrontLanguage === 'es' ? 'chip active' : 'chip'} onClick={() => setStorefrontLanguage('es')}>ES</button>
                  </div>
                </div>

                <div className="field">
                  <span>Owner Order Language</span>
                  <div className="chipRow">
                    <button type="button" className={orderLanguage === 'en' ? 'chip active' : 'chip'} onClick={() => setOrderLanguage('en')}>EN</button>
                    <button type="button" className={orderLanguage === 'es' ? 'chip active' : 'chip'} onClick={() => setOrderLanguage('es')}>ES</button>
                  </div>
                </div>

                <div className="field">
                  <span>Ordering</span>
                  <div className="chipRow">
                    <button type="button" className={pickupEnabled ? 'chip active wide' : 'chip wide'} onClick={() => setPickupEnabled(!pickupEnabled)}>
                      {pickupEnabled ? 'Pickup On' : 'Pickup Off'}
                    </button>
                    <button type="button" className={deliveryEnabled ? 'chip active wide' : 'chip wide'} onClick={() => setDeliveryEnabled(!deliveryEnabled)}>
                      {deliveryEnabled ? 'Delivery On' : 'Delivery Off'}
                    </button>
                  </div>
                </div>

                {deliveryEnabled ? (
                  <div className="tripleGrid">
                    <label className="field">
                      <span>Delivery Fee</span>
                      <input className="input" value={deliveryFee} onChange={(e) => setDeliveryFee(sanitizeNumberInput(e.target.value))} />
                    </label>
                    <label className="field">
                      <span>Delivery Radius</span>
                      <input className="input" value={deliveryRadius} onChange={(e) => setDeliveryRadius(sanitizeNumberInput(e.target.value))} />
                    </label>
                    <label className="field">
                      <span>Delivery Minimum</span>
                      <input className="input" value={deliveryMinimum} onChange={(e) => setDeliveryMinimum(sanitizeNumberInput(e.target.value))} />
                    </label>
                  </div>
                ) : null}

                <div className="field">
                  <span>Plan</span>
                  <div className="chipRow">
                    <button type="button" className={plan === 'starter' ? 'chip active' : 'chip'} onClick={() => setPlan('starter')}>Starter</button>
                    <button type="button" className={plan === 'growth' ? 'chip active' : 'chip'} onClick={() => setPlan('growth')}>Growth</button>
                    <button type="button" className={plan === 'premium' ? 'chip active' : 'chip'} onClick={() => setPlan('premium')}>Premium</button>
                  </div>
                </div>

                <div className="smallNote">
                  Gallery uploads are unlimited on all plans. Starter only limits placeholder images to 6 total.
                </div>
                <div className="smallNote">
                  Placeholder usage: {placeholderCount}{placeholderLimit !== Number.POSITIVE_INFINITY ? `/6` : ' (unlimited)'}
                </div>
              </div>
            ) : null}

            <SectionCard
              section="menu"
              icon="▦"
              title="Menu"
              right="Categories, items, options"
              expanded={expanded === 'menu'}
              onToggle={toggleSection}
              summary={
                <div className="summary">
                  <strong>{categories.length} categories</strong>
                  <span>{categories.flatMap((category) => category.items).length} items</span>
                  <span>Unlimited gallery uploads</span>
                </div>
              }
            />

            {expanded === 'menu' ? (
              <div className="panel">
                <div className="menuTopActions">
                  <button type="button" className="primaryButton" onClick={addCategory}>Add Category</button>
                  {selectedCategory ? (
                    <button type="button" className="secondaryButton" onClick={() => addItem(selectedCategory.id)}>
                      Add Item
                    </button>
                  ) : null}
                </div>

                <div className="desktopMenuGrid">
                  <div className="categoryColumn">
                    {categories.map((category) => (
                      <div key={category.id} className={category.id === selectedCategoryId ? 'categoryCard activeCard' : 'categoryCard'}>
                        <button type="button" className="categorySelect" onClick={() => setSelectedCategoryId(category.id)}>
                          <span>{category.name}</span>
                          <span>{category.items.length}</span>
                        </button>
                        <input className="compactInput" value={category.name} onChange={(e) => updateCategory(category.id, e.target.value)} />
                        <button type="button" className="dangerButton" onClick={() => deleteCategory(category.id)}>Delete Category</button>
                      </div>
                    ))}
                  </div>

                  <div className="itemColumn">
                    {selectedCategory ? (
                      <>
                        <div className="placeholderSection">
                          <div className="editorHeader">
                            <div className="editorTitle">Placeholder Food Choices</div>
                            <div className="smallNote">
                              {plan === 'starter'
                                ? `Starter uses up to 6 placeholders total • currently ${placeholderCount} used`
                                : 'Unlimited placeholders on this plan'}
                            </div>
                          </div>

                          <div className="placeholderGrid">
                            {placeholderChoices.map((url) => (
                              <button
                                type="button"
                                key={url}
                                className={selectedItem?.image_url === url ? 'placeholderChoice activeChoice' : 'placeholderChoice'}
                                onClick={() => selectedItem && usePlaceholder(selectedItem.id, url)}
                              >
                                <img src={url} alt="Placeholder option" className="fillImage" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="itemList">
                          {selectedCategory.items.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className={item.id === selectedItemId ? 'itemTile activeCard' : 'itemTile'}
                              onClick={() => setSelectedItemId(item.id)}
                            >
                              <div className="itemThumb">
                                {item.image_url ? <img src={item.image_url} alt={item.name} className="fillImage" /> : <div className="placeholderBox small">No Image</div>}
                              </div>
                              <div className="itemTileText">
                                <strong>{item.name}</strong>
                                <span>{money(item.price)}</span>
                              </div>
                            </button>
                          ))}
                        </div>

                        {selectedItem ? (
                          <div className="itemEditor">
                            <div className="editorHeader">
                              <div className="editorTitle">Item Editor</div>
                              <div className="editorActions">
                                <button type="button" className="secondaryButton" onClick={() => addItem(selectedCategory.id)}>Save & Add Next</button>
                                <button type="button" className="dangerButton" onClick={() => deleteItem(selectedCategory.id, selectedItem.id)}>Delete Item</button>
                              </div>
                            </div>

                            <div className="itemEditorGrid">
                              <div>
                                <div className="previewBox tall">
                                  {selectedItem.image_url ? <img src={selectedItem.image_url} alt={selectedItem.name} className="fillImage" /> : <div className="placeholderBox">Item Preview</div>}
                                </div>

                                <div className="uploadStack">
                                  <label className="uploadButton">
                                    {uploadingItemId === selectedItem.id ? 'Uploading...' : 'Upload Item Image'}
                                    <input hidden type="file" accept="image/*" onChange={(e) => void handleItemImageUpload(selectedItem.id, e)} />
                                  </label>
                                  <button type="button" className="ghostButton" onClick={() => updateItem(selectedItem.id, { image_url: '', image_source: 'empty' })}>
                                    Remove Image
                                  </button>
                                </div>
                              </div>

                              <div className="editorFields">
                                <label className="field">
                                  <span>Item Name</span>
                                  <input className="input" value={selectedItem.name} onChange={(e) => updateItem(selectedItem.id, { name: e.target.value })} />
                                </label>

                                <label className="field">
                                  <span>Price</span>
                                  <input className="input" value={selectedItem.price} onChange={(e) => updateItem(selectedItem.id, { price: sanitizeNumberInput(e.target.value) })} />
                                </label>

                                <label className="field">
                                  <span>Description</span>
                                  <textarea className="textarea" value={selectedItem.description} onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })} />
                                </label>

                                <div className="field">
                                  <span>Availability</span>
                                  <div className="chipRow">
                                    <button type="button" className={selectedItem.availability === 'available' ? 'chip active' : 'chip'} onClick={() => updateItem(selectedItem.id, { availability: 'available' })}>Available</button>
                                    <button type="button" className={selectedItem.availability === 'sold_out' ? 'chip active' : 'chip'} onClick={() => updateItem(selectedItem.id, { availability: 'sold_out' })}>Sold Out</button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="optionsWrap">
                              <div className="editorHeader">
                                <div className="editorTitle">Option Groups</div>
                                <button type="button" className="secondaryButton" onClick={() => addOptionGroup(selectedItem.id)}>Add Option Group</button>
                              </div>

                              <div className="optionGroupStack">
                                {selectedItem.option_groups.map((group) => (
                                  <div key={group.id} className="optionGroupCard">
                                    <div className="optionGroupTop">
                                      <input className="compactInput" value={group.name} onChange={(e) => updateOptionGroup(selectedItem.id, group.id, { name: e.target.value })} />
                                      <button type="button" className="dangerButton" onClick={() => deleteOptionGroup(selectedItem.id, group.id)}>Delete Group</button>
                                    </div>

                                    <div className="chipRow">
                                      <button type="button" className={group.required ? 'chip active' : 'chip'} onClick={() => updateOptionGroup(selectedItem.id, group.id, { required: !group.required })}>
                                        {group.required ? 'Required' : 'Optional'}
                                      </button>
                                      <button type="button" className={group.selection === 'single' ? 'chip active' : 'chip'} onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'single' })}>Single</button>
                                      <button type="button" className={group.selection === 'multiple' ? 'chip active' : 'chip'} onClick={() => updateOptionGroup(selectedItem.id, group.id, { selection: 'multiple' })}>Multiple</button>
                                    </div>

                                    <div className="choiceStack">
                                      {group.options.map((choice) => (
                                        <div key={choice.id} className="choiceRow">
                                          <input className="compactInput grow" value={choice.name} onChange={(e) => updateChoice(selectedItem.id, group.id, choice.id, { name: e.target.value })} />
                                          <input className="compactInput priceBox" value={choice.price} onChange={(e) => updateChoice(selectedItem.id, group.id, choice.id, { price: sanitizeNumberInput(e.target.value) })} />
                                          <button type="button" className="dangerButton smallDanger" onClick={() => deleteChoice(selectedItem.id, group.id, choice.id)}>Delete</button>
                                        </div>
                                      ))}
                                    </div>

                                    <button type="button" className="secondaryButton" onClick={() => addChoice(selectedItem.id, group.id)}>Add Choice</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <SectionCard
              section="flyers"
              icon="⚡"
              title="Flyers"
              right="Free QR + custom packages"
              expanded={expanded === 'flyers'}
              onToggle={toggleSection}
              summary={
                <div className="summary">
                  <span>Free plain white QR flyer included.</span>
                  <span>Custom flyer packages: 100 / 250 / 500.</span>
                </div>
              }
            />

            {expanded === 'flyers' ? (
              <div className="panel">
                <div className="editorHeader">
                  <div className="editorTitle">Custom Flyer Packages</div>
                  <div className="smallNote">Preview only until purchase.</div>
                </div>

                <div className="chipRow">
                  <button type="button" className={flyerQty === '100' ? 'chip active' : 'chip'} onClick={() => setFlyerQty('100')}>100 Flyers</button>
                  <button type="button" className={flyerQty === '250' ? 'chip active' : 'chip'} onClick={() => setFlyerQty('250')}>250 Flyers</button>
                  <button type="button" className={flyerQty === '500' ? 'chip active' : 'chip'} onClick={() => setFlyerQty('500')}>500 Flyers</button>
                </div>

                <div className="chipRow">
                  <button type="button" className={flyerStyle === 'street' ? 'chip active' : 'chip'} onClick={() => setFlyerStyleOverride('street')}>Street</button>
                  <button type="button" className={flyerStyle === 'clean' ? 'chip active' : 'chip'} onClick={() => setFlyerStyleOverride('clean')}>Clean</button>
                  <button type="button" className={flyerStyle === 'seafood' ? 'chip active' : 'chip'} onClick={() => setFlyerStyleOverride('seafood')}>Seafood</button>
                  <button type="button" className={flyerStyle === 'bbq' ? 'chip active' : 'chip'} onClick={() => setFlyerStyleOverride('bbq')}>BBQ</button>
                </div>

                <div className="freeWhiteFlyer">
                  <div className="editorTitle">Free White QR Flyer</div>
                  <div className="whiteFlyerCard">
                    <div className="whiteFlyerQrBox">
                      <img src={qrImage} alt="QR code" className="whiteFlyerQr" />
                    </div>
                    <div className="whiteFlyerStore">{flyerTitle}</div>
                    <div className="whiteFlyerMeta">{address || '123 Main St'}</div>
                    <div className="whiteFlyerMeta">{phone || '(323) 555-1212'}</div>
                    <div className="whiteFlyerSmall">Scan to order</div>
                  </div>
                </div>

                <div className="flyerGrid">
                  <div className={`flyerCard ${renderFlyerBackgroundClass()}`}>
                    {flyerImage ? <img src={flyerImage} alt="Flyer preview" className="flyerImage" /> : null}
                    <div className="flyerShade" />
                    <div className="flyerContent">
                      <div className="flyerBig">SCAN TO ORDER</div>
                      <div className="flyerQrBox">
                        <div className="fakeQr">QR</div>
                        <div className="qrText">SCAN TO ORDER</div>
                      </div>
                      <div className="flyerStore">{flyerTitle}</div>
                      <div className="flyerSub">{flyerSub}</div>
                      <div className="flyerMeta">{address || '123 Main St'} • {phone || '(323) 555-1212'}</div>
                    </div>
                  </div>

                  <div className="flyerInfo">
                    <div className="flyerPlan">Package: {flyerQty} flyers</div>
                    <div className="flyerPriceCopy">{flyerQty === '100' ? '$120' : flyerQty === '250' ? '$250' : '$500'}</div>
                    <div className="flyerNote">Custom flyer preview only until purchase.</div>

                    <a href={FLYER_LINKS[flyerQty]} target="_blank" rel="noreferrer" className="checkoutButton">
                      Buy {flyerQty} Flyers
                    </a>

                    <div className="whiteFlyerNote">The free plain white digital QR flyer stays included for every owner.</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rightCol">
            <div className="previewPanel">
              <div className="previewHeader">Storefront Reflection</div>
              <div className={`previewPhone ${themeClass}`}>
                <div className={`storeHero ${themeClass}`}>
                  {heroImage ? <img src={heroImage} alt="Store hero" className="fillImage" /> : <div className="heroFallback" />}
                  <div className="heroShade" />
                  <div className="storeHeroContent">
                    {logoImage ? <img src={logoImage} alt="Store logo" className="heroLogo smallLogo" /> : null}
                    <div>
                      <h3>{name || 'Your Store'}</h3>
                      <p>{storefrontLanguage.toUpperCase()} • {theme}</p>
                    </div>
                  </div>
                </div>

                <div className="storeLangBar">
                  <button type="button" className={storefrontLanguage === 'en' ? 'langPill activePill' : 'langPill'}>EN</button>
                  <button type="button" className={storefrontLanguage === 'es' ? 'langPill activePill' : 'langPill'}>ES</button>
                </div>

                <div className="previewInfoList">
                  <div className="infoCardLine"><strong>Address</strong><span>{address || '—'}</span></div>
                  <div className="infoCardLine"><strong>Phone</strong><span>{phone || '—'}</span></div>
                  <div className="infoCardLine"><strong>Pickup</strong><span>{pickupEnabled ? 'On' : 'Off'}</span></div>
                  <div className="infoCardLine"><strong>Delivery</strong><span>{deliveryEnabled ? 'On' : 'Off'}</span></div>
                </div>

                <div className="previewMenu">
                  {categories.map((category) => (
                    <div key={category.id} className="previewCategory">
                      <h4>{category.name}</h4>
                      {category.items.map((item) => (
                        <div key={item.id} className="previewItem">
                          <div className="previewItemLeft">
                            {item.image_url ? <img src={item.image_url} alt={item.name} className="previewTinyImage" /> : null}
                            <div>
                              <strong>{item.name}</strong>
                              <span>{item.description || 'Order now'}</span>
                            </div>
                          </div>
                          <div>{money(item.price)}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="smallPreviewNote">
                Storefront language belongs on the storefront. Owner order language is what the owner receives on the order side.
              </div>
            </div>
          </div>
        </div>

        <nav className="bottomNav">
          <button type="button" className="navItem"><span className="navDot" />Dashboard</button>
          <button type="button" className="navItem navActive"><span className="navDot" />Builder</button>
          <button type="button" className="navItem"><span className="navDot" />Preview</button>
          <button type="button" className="navItem"><span className="navDot" />Flyers</button>
          <button type="button" className="navItem"><span className="navDot" />Orders</button>
          <button type="button" className="navItem"><span className="navDot" />More</button>
        </nav>
      </div>

      <style jsx>{baseStyles}</style>
    </main>
  );
}

const baseStyles = `
  .page {
    min-height: 100vh;
    background: #eef1f5;
    padding: 18px 14px 30px;
    display: grid;
    place-items: start center;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #111827;
  }

  .themeDark {
    --shell-bg: #0f172a;
    --card-bg: #111827;
    --soft-bg: #0b1220;
    --soft-2: #182233;
    --border: rgba(255,255,255,0.08);
    --text: #f8fafc;
    --muted: #cbd5e1;
  }

  .themeLight {
    --shell-bg: #ffffff;
    --card-bg: #ffffff;
    --soft-bg: #f8fafc;
    --soft-2: #f1f5f9;
    --border: rgba(15, 23, 42, 0.1);
    --text: #111827;
    --muted: #6b7280;
  }

  .shell {
    width: min(100%, 1360px);
    background: var(--shell-bg);
    border: 1px solid var(--border);
    border-radius: 34px;
    box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
    padding: 16px 16px 96px;
    position: relative;
    overflow: hidden;
  }

  .headerBar {
    width: 124px;
    height: 8px;
    border-radius: 999px;
    background: #0f172a;
    margin: 4px auto 18px;
  }

  .loadingCard,
  .panel,
  .sectionCard,
  .previewPanel {
    border-radius: 18px;
    border: 1px solid var(--border);
    background: var(--card-bg);
  }

  .loadingCard { padding: 24px; font-size: 20px; font-weight: 900; }
  .topBar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
  .brand { color: var(--text); font-size: 28px; font-weight: 950; letter-spacing: -0.03em; }
  .brand span { color: var(--muted); font-weight: 700; }
  .subBrand { color: var(--muted); font-size: 13px; font-weight: 700; margin-top: 4px; }

  .topActions,
  .menuTopActions,
  .editorHeader,
  .uploadStack,
  .chipRow,
  .optionGroupTop,
  .storeLangBar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .toggleMini,
  .saveButton,
  .uploadButton,
  .primaryButton,
  .secondaryButton,
  .dangerButton,
  .ghostButton,
  .chip,
  .checkoutButton,
  .langPill {
    min-height: 46px;
    border-radius: 12px;
    border: 1px solid var(--border);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    font-size: 15px;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }

  .toggleMini,
  .ghostButton,
  .secondaryButton,
  .chip,
  .langPill {
    background: var(--card-bg);
    color: var(--text);
  }

  .saveButton,
  .uploadButton,
  .primaryButton,
  .checkoutButton {
    background: #0f172a;
    color: #ffffff;
    border-color: #0f172a;
  }

  .dangerButton { background: #fae8e8; color: #a12e2e; border-color: transparent; }
  .chip.active, .activeCard, .activeChoice, .activePill, .sectionCardActive {
    border-color: #0f172a;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  }

  .chip.active, .activePill {
    background: #0f172a;
    color: #ffffff;
  }

  .chip.wide { min-width: 150px; }
  .message { padding: 12px 14px; border-radius: 14px; font-weight: 800; margin-bottom: 12px; }
  .error { background: #fbeaea; color: #991b1b; }
  .success { background: #ebf7ee; color: #166534; }

  .hero { position: relative; min-height: 240px; overflow: hidden; border-radius: 24px; margin-bottom: 16px; background: #111827; }
  .heroImage, .fillImage, .containImage { width: 100%; height: 100%; display: block; }
  .heroImage, .fillImage, .flyerImage { object-fit: cover; }
  .containImage { object-fit: contain; }
  .heroFallback { position: absolute; inset: 0; background: linear-gradient(135deg, #0f172a 0%, #334155 100%); }
  .heroShade, .flyerShade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%); }

  .heroContent, .storeHeroContent {
    position: absolute; left: 18px; right: 18px; bottom: 18px; z-index: 2;
    display: flex; align-items: center; gap: 14px;
  }

  .heroLogo {
    width: 74px; height: 74px; border-radius: 999px; background: #ffffff; object-fit: cover; flex-shrink: 0;
  }

  .placeholderLogo { display: flex; align-items: center; justify-content: center; color: #0f172a; font-size: 28px; font-weight: 950; }
  .smallLogo { width: 52px; height: 52px; }
  .heroText h1, .storeHeroContent h3 { color: #ffffff; margin: 0; font-size: 30px; font-weight: 950; letter-spacing: -0.03em; }
  .heroText div, .storeHeroContent p { color: rgba(255,255,255,0.95); font-weight: 700; margin-top: 4px; }

  .previewActionRow { margin-bottom: 14px; }
  .previewButton {
    width: 100%; min-height: 52px; border-radius: 14px; background: linear-gradient(180deg, #111827 0%, #0b1020 100%);
    color: #ffffff; font-weight: 950; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid rgba(17, 24, 39, 0.18);
  }

  .desktopGrid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.75fr); gap: 16px; align-items: start; }
  .leftCol, .rightCol { display: grid; gap: 12px; }
  .sectionCard { width: 100%; padding: 16px; text-align: left; }
  .sectionHead { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .sectionLeft, .sectionRight { display: flex; align-items: center; gap: 10px; }
  .sectionTitle { color: var(--text); font-size: 20px; font-weight: 950; }
  .sectionMeta, .sectionArrow { color: var(--muted); font-weight: 800; }
  .sectionSummary { margin-top: 10px; }
  .summary { display: grid; gap: 4px; color: var(--muted); font-size: 14px; font-weight: 700; }
  .summary strong { color: var(--text); font-size: 16px; font-weight: 950; }
  .miniIcon {
    width: 30px; height: 30px; border-radius: 10px; background: var(--soft-2); color: var(--text);
    display: inline-flex; align-items: center; justify-content: center; font-weight: 950; flex-shrink: 0;
  }

  .panel { padding: 16px; display: grid; gap: 14px; }
  .field { display: grid; gap: 8px; }
  .field span { color: var(--muted); font-size: 12px; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }

  .input, .compactInput, .textarea, .readBox {
    width: 100%; border-radius: 12px; border: 1px solid var(--border); background: var(--card-bg);
    color: var(--text); font-size: 15px; font-weight: 800; outline: none;
  }

  .input, .readBox { min-height: 54px; padding: 0 14px; display: flex; align-items: center; }
  .compactInput { min-height: 44px; padding: 0 12px; }
  .textarea { min-height: 120px; padding: 12px 14px; resize: vertical; }

  .categoryColumn, .itemColumn, .itemList, .optionGroupStack, .choiceStack { display: grid; gap: 12px; }
  .uploadGrid, .tripleGrid, .flyerGrid, .itemEditorGrid { display: grid; gap: 14px; }
  .uploadGrid, .flyerGrid, .itemEditorGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tripleGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); }

  .uploadCard, .optionGroupCard, .previewInfoList, .previewCategory, .itemEditor, .categoryCard, .itemTile, .flyerInfo, .placeholderSection, .whiteFlyerCard {
    border: 1px solid var(--border); border-radius: 16px; background: var(--card-bg);
  }

  .uploadCard, .flyerInfo, .itemEditor, .categoryCard, .placeholderSection, .whiteFlyerCard { padding: 14px; }
  .uploadLabel, .editorTitle, .previewHeader, .flyerPlan { color: var(--text); font-size: 18px; font-weight: 950; }
  .smallNote, .smallPreviewNote { color: var(--muted); font-size: 13px; font-weight: 700; line-height: 1.45; }

  .previewBox { width: 100%; height: 200px; border-radius: 16px; overflow: hidden; background: var(--soft-2); position: relative; }
  .previewBox.tall { height: 300px; }
  .placeholderBox {
    width: 100%; height: 100%; display: grid; place-items: center; color: var(--muted); font-weight: 900;
    background: linear-gradient(135deg, #e7ebf0 0%, #d8dee7 100%);
  }

  .placeholderBox.small { font-size: 12px; }
  .desktopMenuGrid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 14px; }
  .placeholderGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
  .placeholderChoice { border-radius: 14px; overflow: hidden; border: 1px solid var(--border); background: var(--card-bg); aspect-ratio: 1 / 1; }

  .categorySelect, .itemTile { width: 100%; text-align: left; }
  .categorySelect { display: flex; justify-content: space-between; align-items: center; font-weight: 950; color: var(--text); margin-bottom: 10px; }
  .itemTile { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 12px; padding: 10px; }
  .itemThumb { height: 88px; border-radius: 12px; overflow: hidden; background: var(--soft-2); }
  .itemTileText { display: grid; align-content: center; gap: 4px; color: var(--muted); font-weight: 700; }
  .itemTileText strong { color: var(--text); font-size: 16px; font-weight: 950; }
  .editorFields, .optionsWrap { display: grid; gap: 12px; }
  .optionsWrap { margin-top: 10px; }
  .choiceRow { display: flex; gap: 10px; align-items: center; }
  .grow { flex: 1 1 auto; }
  .priceBox { width: 110px; }
  .smallDanger { min-height: 44px; }

  .previewPanel { padding: 14px; position: sticky; top: 14px; }
  .previewPhone { border-radius: 24px; overflow: hidden; border: 1px solid var(--border); background: var(--soft-bg); }
  .storeHero { position: relative; height: 220px; overflow: hidden; background: #111827; }
  .langPill { min-width: 72px; }
  .previewInfoList { margin: 12px; padding: 0; }
  .infoCardLine {
    padding: 14px; display: flex; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--border);
  }

  .infoCardLine:last-child { border-bottom: 0; }
  .infoCardLine strong, .previewCategory h4, .previewItem strong { color: var(--text); }
  .infoCardLine span, .previewItem span { color: var(--muted); }

  .previewMenu { display: grid; gap: 12px; padding: 12px; }
  .previewCategory { padding: 14px; }
  .previewCategory h4 { margin: 0 0 10px; font-size: 17px; font-weight: 950; }
  .previewItem { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px solid var(--border); }
  .previewItem:first-of-type { border-top: 0; padding-top: 0; }
  .previewItemLeft { display: flex; gap: 10px; align-items: center; }
  .previewTinyImage { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }

  .freeWhiteFlyer { display: grid; gap: 10px; }
  .whiteFlyerCard {
    background: #ffffff;
    color: #0f172a;
    text-align: center;
    display: grid;
    gap: 12px;
    justify-items: center;
  }
  .whiteFlyerQrBox {
    width: 220px;
    height: 220px;
    border-radius: 18px;
    background: #ffffff;
    border: 10px solid #0f172a;
    padding: 12px;
  }
  .whiteFlyerQr { width: 100%; height: 100%; object-fit: contain; display: block; }
  .whiteFlyerStore { font-size: 28px; font-weight: 950; }
  .whiteFlyerMeta { font-size: 16px; font-weight: 800; }
  .whiteFlyerSmall { font-size: 18px; font-weight: 950; color: #c2410c; }

  .flyerCard { position: relative; min-height: 560px; border-radius: 24px; overflow: hidden; background: #0f172a; }
  .flyerImage { position: absolute; inset: 0; width: 100%; height: 100%; }
  .flyerStreet { background: linear-gradient(135deg, #6f1d1b 0%, #bb3e03 100%); }
  .flyerSeafood { background: linear-gradient(135deg, #023e8a 0%, #0096c7 100%); }
  .flyerBbq { background: linear-gradient(135deg, #4a2511 0%, #a44a13 100%); }
  .flyerClean { background: linear-gradient(135deg, #111827 0%, #334155 100%); }

  .flyerContent {
    position: absolute; inset: 0; z-index: 2; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;
  }

  .flyerBig {
    color: #ffffff; font-size: 44px; line-height: 0.95; font-weight: 950; text-align: center; text-shadow: 0 2px 18px rgba(0,0,0,0.35);
  }

  .flyerQrBox {
    width: 72%; margin: 0 auto; padding: 14px; border-radius: 18px; background: rgba(255,255,255,0.96);
    text-align: center; box-shadow: 0 16px 40px rgba(0,0,0,0.25);
  }

  .fakeQr {
    height: 180px; border-radius: 14px; border: 10px solid #111827; display: grid; place-items: center;
    font-size: 48px; font-weight: 950; color: #111827;
  }

  .qrText { margin-top: 10px; color: #c2410c; font-weight: 950; font-size: 24px; }
  .flyerStore, .flyerSub, .flyerMeta {
    text-align: center; color: #ffffff; font-weight: 900; text-shadow: 0 2px 18px rgba(0,0,0,0.35);
  }

  .flyerStore { font-size: 34px; }
  .flyerSub { font-size: 24px; }
  .flyerMeta { font-size: 18px; }
  .flyerInfo { display: grid; gap: 12px; align-content: start; }
  .flyerPriceCopy { color: var(--text); font-size: 28px; font-weight: 950; }
  .flyerNote, .whiteFlyerNote { color: var(--muted); font-weight: 700; line-height: 1.45; }

  .bottomNav {
    position: absolute; left: 16px; right: 16px; bottom: 16px; min-height: 76px; border-radius: 18px; border: 1px solid var(--border);
    background: rgba(255,255,255,0.96); backdrop-filter: blur(12px); display: grid; grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 4px; padding: 8px 6px;
  }

  .navItem {
    min-height: 56px; border-radius: 14px; display: grid; justify-items: center; align-content: center; gap: 6px;
    color: #6b7280; font-size: 11px; font-weight: 900;
  }

  .navActive { background: #0f172a; color: #ffffff; }
  .navDot { width: 12px; height: 12px; border-radius: 3px; background: currentColor; display: inline-block; }

  @media (max-width: 1100px) {
    .desktopGrid { grid-template-columns: 1fr; }
    .previewPanel { position: static; }
  }

  @media (max-width: 820px) {
    .uploadGrid, .flyerGrid, .itemEditorGrid, .tripleGrid, .desktopMenuGrid { grid-template-columns: 1fr; }
    .placeholderGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .topBar { align-items: flex-start; flex-direction: column; }
    .shell { width: min(100%, 430px); padding-bottom: 96px; }
    .brand { font-size: 22px; }
    .flyerBig { font-size: 34px; }
  }
`;
