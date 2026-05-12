'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function OwnerBuilder() {
  const [lang, setLang] = useState<'en' | 'es'>('en');

  const [data, setData] = useState({
    name_en: '',
    name_es: '',
    description_en: '',
    description_es: '',
    phone: '',
    logo: '',
    hero: '',
    slug: '',
  });

  const [items, setItems] = useState<any[]>([]);

  const [item, setItem] = useState({
    name_en: '',
    name_es: '',
    description_en: '',
    description_es: '',
    price: '',
    category: '',
    image: '',
  });

  const update = (field: string, value: any) => {
    setData((p) => ({ ...p, [field]: value }));
  };

  const updateItem = (field: string, value: any) => {
    setItem((p) => ({ ...p, [field]: value }));
  };

  const addItem = () => {
    if (!item.name_en || !item.price) return;

    setItems([
      ...items,
      {
        ...item,
        id: crypto.randomUUID(),
        price: Number(item.price),
      },
    ]);

    setItem({
      name_en: '',
      name_es: '',
      description_en: '',
      description_es: '',
      price: '',
      category: '',
      image: '',
    });
  };

  const save = async () => {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .upsert({
        ...data,
        slug: data.slug || data.name_en.toLowerCase().replace(/\s+/g, '-'),
      })
      .select()
      .single();

    if (!restaurant) return;

    await supabase
      .from('menu_items')
      .delete()
      .eq('restaurant_id', restaurant.id);

    await supabase.from('menu_items').insert(
      items.map((i) => ({
        ...i,
        restaurant_id: restaurant.id,
      }))
    );

    alert('Saved!');
  };

  return (
    <div className="p-6 text-white bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]gradient-to-b from-gray-200 to-gray-400 text-black border border-gray-300 shadow-md min-h-screen">

      {/* LANGUAGE TOGGLE */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setLang('en')}>EN</button>
        <button onClick={() => setLang('es')}>ES</button>
      </div>

      {/* RESTAURANT */}
      <input
        placeholder={lang === 'en' ? 'Name (EN)' : 'Nombre (ES)'}
        value={lang === 'en' ? data.name_en : data.name_es}
        onChange={(e) =>
          update(lang === 'en' ? 'name_en' : 'name_es', e.target.value)
        }
      />

      <input
        placeholder="Phone"
        value={data.phone}
        onChange={(e) => update('phone', e.target.value)}
      />

      {/* ITEM */}
      <input
        placeholder={lang === 'en' ? 'Item Name' : 'Nombre del Item'}
        value={lang === 'en' ? item.name_en : item.name_es}
        onChange={(e) =>
          updateItem(lang === 'en' ? 'name_en' : 'name_es', e.target.value)
        }
      />

      <input
        placeholder="Price"
        value={item.price}
        onChange={(e) => updateItem('price', e.target.value)}
      />

      <button onClick={addItem}>Add Item</button>

      <button onClick={save} className="mt-6 bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]green-500 px-4 py-2">
        Save
      </button>
    </div>
  );
}