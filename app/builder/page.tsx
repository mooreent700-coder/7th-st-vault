'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MenuItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
};

export default function BuilderPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [slug, setSlug] = useState('');

  const [hero, setHero] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // LOAD DATA
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setRestaurantId(data.id);
        setName(data.name || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setSlug(data.slug || '');
        setHero(data.hero_url);
        setLogo(data.logo_url);
        setTheme(data.storefront_theme || 'light');

        const items = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', data.id);

        setMenu(items.data || []);
      }

      setLoading(false);
    };

    load();
  }, []);

  // SAVE BUILDER
  const saveBuilder = async () => {
    if (!restaurantId) return;

    await supabase.from('restaurants').update({
      name,
      phone,
      address,
      slug,
      hero_url: hero,
      logo_url: logo,
      storefront_theme: theme
    }).eq('id', restaurantId);

    alert('Saved');
  };

  // UPLOAD IMAGE
  const uploadImage = async (file: File, type: 'hero' | 'logo') => {
    const filePath = `${Date.now()}-${file.name}`;

    await supabase.storage.from('images').upload(filePath, file);

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);

    if (type === 'hero') setHero(data.publicUrl);
    if (type === 'logo') setLogo(data.publicUrl);
  };

  // ADD ITEM
  const addItem = async () => {
    if (!restaurantId) return;

    const { data } = await supabase.from('menu_items').insert({
      restaurant_id: restaurantId,
      name: 'New Item',
      price: 0
    }).select().single();

    setMenu([...menu, data]);
  };

  // UPDATE ITEM
  const updateItem = async (id: string, field: string, value: any) => {
    await supabase.from('menu_items').update({
      [field]: value
    }).eq('id', id);

    setMenu(menu.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // REMOVE ITEM
  const removeItem = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id);
    setMenu(menu.filter(i => i.id !== id));
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{
      display: 'flex',
      gap: 30,
      padding: 30,
      background: '#f6f7fb',
      minHeight: '100vh'
    }}>

      {/* LEFT PANEL */}
      <div style={{ flex: 1, maxWidth: 520 }}>

        <h2 style={{ fontSize: 28, marginBottom: 10 }}>Store Builder</h2>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={saveBuilder}
            style={{
              background: '#0b1a33',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none'
            }}
          >
            Save Builder
          </button>

          <a href={`/store/${slug}`} target="_blank">
            <button style={{
              padding: '12px 20px',
              borderRadius: 10
            }}>
              Preview Store →
            </button>
          </a>
        </div>

        {/* STORE INFO */}
        <div style={card}>
          <h3>Store Info</h3>

          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={input} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" style={input} />
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" style={input} />
        </div>

        {/* BRANDING */}
        <div style={card}>
          <h3>Branding</h3>

          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <p>Hero</p>
              {hero && <img src={hero} style={{ width: 200, borderRadius: 10 }} />}
              <input type="file" onChange={e => {
                if (e.target.files?.[0]) uploadImage(e.target.files[0], 'hero');
              }} />
            </div>

            <div>
              <p>Logo</p>
              {logo && <img src={logo} style={{ width: 80, borderRadius: 10 }} />}
              <input type="file" onChange={e => {
                if (e.target.files?.[0]) uploadImage(e.target.files[0], 'logo');
              }} />
            </div>
          </div>
        </div>

        {/* THEME */}
        <div style={card}>
          <h3>Theme</h3>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setTheme('light')}>Light</button>
            <button onClick={() => setTheme('dark')}>Dark</button>
          </div>
        </div>

        {/* MENU */}
        <div style={card}>
          <h3>Menu</h3>

          {menu.map(item => (
            <div key={item.id} style={{ marginBottom: 10 }}>
              <input
                value={item.name}
                onChange={e => updateItem(item.id, 'name', e.target.value)}
                style={input}
              />

              <input
                value={item.price}
                onChange={e => updateItem(item.id, 'price', Number(e.target.value))}
                style={input}
              />

              <button onClick={() => removeItem(item.id)}>Remove</button>
            </div>
          ))}

          <button onClick={addItem}>+ Add Item</button>
        </div>

      </div>

      {/* RIGHT PREVIEW */}
      <div style={{ flex: 1 }}>
        <h3>Live Preview</h3>

        <div style={{
          background: theme === 'dark' ? '#111' : '#fff',
          color: theme === 'dark' ? '#fff' : '#000',
          padding: 20,
          borderRadius: 15
        }}>

          {hero && <img src={hero} style={{ width: '100%', borderRadius: 10 }} />}

          <h2>{name}</h2>
          <p>{address}</p>
          <p>{phone}</p>

          {menu.map(item => (
            <div key={item.id}>
              <p>{item.name} - ${item.price}</p>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 15,
  marginBottom: 20
};

const input = {
  width: '100%',
  padding: 10,
  marginBottom: 10,
  borderRadius: 10,
  border: '1px solid #ddd'
};