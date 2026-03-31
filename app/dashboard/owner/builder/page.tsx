'use client';

import Link from 'next/link';
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';

type RestaurantRow = {
  id: string;
  owner_id: string;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  hero_url: string | null;
  logo_url: string | null;
  owner_email?: string | null;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  name: string | null;
  price: number | string | null;
  description: string | null;
  image_url: string | null;
  created_at?: string | null;
};

const BUCKETS = {
  hero: 'heroes',
  logo: 'logos',
  menuItem: 'menu-items',
} as const;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function formatPrice(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return '$0.00';
  return `$${numeric.toFixed(2)}`;
}

function createFilePath(prefix: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
}

export default function BuilderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  const [restaurantId, setRestaurantId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');

  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuDescription, setMenuDescription] = useState('');

  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadBuilder = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserEmail(user.email || '');

      let { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      // 🔥 AUTO CREATE RESTAURANT
      if (!restaurant) {
        const defaultName = 'My Business';
        const newSlug = slugify(defaultName);

        const { data: created } = await supabase
          .from('restaurants')
          .insert({
            owner_id: user.id,
            name: defaultName,
            slug: newSlug,
          })
          .select()
          .single();

        restaurant = created;
      }

      if (restaurant) {
        setRestaurantId(restaurant.id);
        setBusinessName(restaurant.name || '');
        setSlug(restaurant.slug || '');
        setPhone(restaurant.phone || '');
        setAddress(restaurant.address || '');
        setHours(restaurant.hours || '');
      }

      if (restaurant?.id) {
        const { data: items } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurant.id);

        setMenuItems(items || []);
      }

      setLoading(false);
    };

    loadBuilder();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSaveBusiness = async (e: FormEvent) => {
    e.preventDefault();
    setSavingBusiness(true);

    const newSlug = slugify(businessName);

    await supabase
      .from('restaurants')
      .update({
        name: businessName,
        slug: newSlug,
        phone,
        address,
        hours,
      })
      .eq('id', restaurantId);

    setSlug(newSlug);
    setSavingBusiness(false);
  };

  const handleAddMenuItem = async (e: FormEvent) => {
    e.preventDefault();
    setAddingItem(true);

    const { data } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: restaurantId,
        name: menuName,
        price: Number(menuPrice),
        description: menuDescription,
      })
      .select();

    setMenuItems((prev) => [...prev, ...(data || [])]);

    setMenuName('');
    setMenuPrice('');
    setMenuDescription('');
    setAddingItem(false);
  };

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Builder</h1>

      <form onSubmit={handleSaveBusiness}>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business Name"
        />
        <button type="submit">
          {savingBusiness ? 'Saving...' : 'Save Business'}
        </button>
      </form>

      <hr />

      <form onSubmit={handleAddMenuItem}>
        <input
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
          placeholder="Item name"
        />
        <input
          value={menuPrice}
          onChange={(e) => setMenuPrice(e.target.value)}
          placeholder="Price"
        />
        <button type="submit">
          {addingItem ? 'Adding...' : 'Add Item'}
        </button>
      </form>

      <div>
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.name} - {formatPrice(item.price)}
          </div>
        ))}
      </div>

      <div>
        <strong>Store:</strong> /store/{slug}
      </div>
    </main>
  );
}