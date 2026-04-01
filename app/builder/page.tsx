'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Builder() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    phone: '',
    address: '',
    hero_url: '',
    logo_url: '',
    theme: 'light'
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setRestaurant(data);
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          phone: data.phone || '',
          address: data.address || '',
          hero_url: data.hero_url || '',
          logo_url: data.logo_url || '',
          theme: data.storefront_theme || 'light'
        });

        const { data: items } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', data.id);

        setMenuItems(items || []);
      }

      setLoading(false);
    };

    load();
  }, []);

  const uploadImage = async (file: File, type: string) => {
    const path = `${restaurant.id}/${type}-${Date.now()}`;

    const { error } = await supabase.storage
      .from('menuflow')
      .upload(path, file);

    if (error) return null;

    const { data } = supabase.storage
      .from('menuflow')
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const saveBuilder = async () => {
    setSaving(true);

    await supabase
      .from('restaurants')
      .update({
        ...form,
        storefront_theme: form.theme
      })
      .eq('id', restaurant.id);

    for (const item of menuItems) {
      if (item.id) {
        await supabase.from('menu_items').update(item).eq('id', item.id);
      } else {
        await supabase.from('menu_items').insert({
          ...item,
          restaurant_id: restaurant.id
        });
      }
    }

    setSaving(false);
  };

  const addItem = () => {
    setMenuItems([...menuItems, { name: '', price: '', image_url: '' }]);
  };

  const updateItem = (i: number, key: string, value: any) => {
    const updated = [...menuItems];
    updated[i][key] = value;
    setMenuItems(updated);
  };

  const deleteItem = async (id: string) => {
    if (id) await supabase.from('menu_items').delete().eq('id', id);
    setMenuItems(menuItems.filter(i => i.id !== id));
  };

  if (loading) return <div className="center">Loading...</div>;

  return (
    <div className={`app ${form.theme}`}>
      
      {/* LEFT PANEL */}
      <div className="builder">

        <div className="header">
          <div>
            <h2>MENUFLOW</h2>
            <h1>Store Builder</h1>
          </div>

          <div className="actions">
            <button className="save" onClick={saveBuilder} disabled={saving}>
              {saving ? 'Saving...' : 'Save Builder'}
            </button>

            <button className="preview" onClick={() => window.open(`/store/${form.slug}`)}>
              Preview →
            </button>
          </div>
        </div>

        {/* STORE */}
        <div className="card">
          <h3>Store Info</h3>

          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Store Name" />
          <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Slug" />
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" />
        </div>

        {/* BRANDING */}
        <div className="card">
          <h3>Branding</h3>

          <label className="upload">
            Upload Hero
            <input type="file" hidden onChange={async e => {
              const url = await uploadImage(e.target.files![0], 'hero');
              if (url) setForm({ ...form, hero_url: url });
            }} />
          </label>

          {form.hero_url && <img src={form.hero_url} className="hero" />}

          <label className="upload">
            Upload Logo
            <input type="file" hidden onChange={async e => {
              const url = await uploadImage(e.target.files![0], 'logo');
              if (url) setForm({ ...form, logo_url: url });
            }} />
          </label>

          {form.logo_url && <img src={form.logo_url} className="logo" />}
        </div>

        {/* MENU */}
        <div className="card">
          <h3>Menu</h3>

          {menuItems.map((item, i) => (
            <div key={i} className="menuItem">
              <input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Item name" />
              <input value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="Price" />

              <label className="upload small">
                Image
                <input type="file" hidden onChange={async e => {
                  const url = await uploadImage(e.target.files![0], 'item');
                  if (url) updateItem(i, 'image_url', url);
                }} />
              </label>

              <button className="delete" onClick={() => deleteItem(item.id)}>
                Remove
              </button>
            </div>
          ))}

          <button className="add" onClick={addItem}>+ Add Item</button>
        </div>

        {/* THEME */}
        <div className="card">
          <h3>Theme</h3>
          <div className="themeSwitch">
            <button onClick={() => setForm({ ...form, theme: 'light' })}>Light</button>
            <button onClick={() => setForm({ ...form, theme: 'dark' })}>Dark</button>
          </div>
        </div>

      </div>

      {/* RIGHT PREVIEW */}
      <div className="previewPanel">
        {form.hero_url && <img src={form.hero_url} className="hero" />}

        <h2>{form.name}</h2>
        <p>{form.address}</p>

        {menuItems.map((item, i) => (
          <div key={i} className="previewItem">
            {item.image_url && <img src={item.image_url} />}
            <div>
              <p>{item.name}</p>
              <span>${item.price}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .app {
          display: flex;
          min-height: 100vh;
          font-family: system-ui;
        }

        .builder {
          flex: 1;
          padding: 20px;
          background: #f6f7f9;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .actions button {
          margin-left: 10px;
          padding: 10px 14px;
          border-radius: 10px;
        }

        .save {
          background: #0b1a33;
          color: white;
        }

        .preview {
          background: white;
          border: 1px solid #ddd;
        }

        .card {
          background: white;
          padding: 20px;
          border-radius: 14px;
          margin-top: 20px;
        }

        input {
          width: 100%;
          margin-top: 10px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #ddd;
        }

        .upload {
          display: block;
          margin-top: 10px;
          background: #eee;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
          cursor: pointer;
        }

        .hero {
          width: 100%;
          border-radius: 10px;
          margin-top: 10px;
        }

        .logo {
          width: 80px;
          margin-top: 10px;
        }

        .menuItem {
          border: 1px solid #eee;
          padding: 10px;
          border-radius: 10px;
          margin-top: 10px;
        }

        .add {
          margin-top: 10px;
          width: 100%;
          padding: 12px;
          background: #0b1a33;
          color: white;
          border-radius: 10px;
        }

        .delete {
          margin-top: 10px;
          background: red;
          color: white;
          padding: 8px;
          border-radius: 8px;
        }

        .previewPanel {
          width: 320px;
          background: white;
          padding: 20px;
        }

        .previewItem {
          margin-top: 10px;
          display: flex;
          gap: 10px;
        }

        .previewItem img {
          width: 60px;
          border-radius: 8px;
        }
      `}</style>

    </div>
  );
}