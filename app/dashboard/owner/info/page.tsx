'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'es';

export default function OwnerInfoPage() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('en');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const text = {
    en: {
      title: 'Owner Info',
      subtitle: 'Update your business details',
      name: 'Business Name',
      phone: 'Phone Number',
      address: 'Address',
      save: 'Save Changes',
    },
    es: {
      title: 'Información del dueño',
      subtitle: 'Actualiza los detalles de tu negocio',
      name: 'Nombre del negocio',
      phone: 'Número de teléfono',
      address: 'Dirección',
      save: 'Guardar cambios',
    },
  };

  const t = text[lang];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) return;

      const { data } = await supabase
        .from('restaurants')
        .select('name, phone, address')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (data) {
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) return;

      await supabase
        .from('restaurants')
        .update({
          name: form.name,
          phone: form.phone,
          address: form.address,
        })
        .eq('owner_id', user.id);

      alert('Saved ✅');
    } catch (err) {
      console.error(err);
      alert('Error saving');
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 20, fontWeight: 600 }}>
        Loading...
      </div>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 20,
          border: '1px solid #eee',
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t.title}</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>{t.subtitle}</p>

        {/* Language Toggle */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={() => setLang('en')}>English</button>
          <button onClick={() => setLang('es')}>Español</button>
        </div>

        {/* Form */}
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            placeholder={t.name}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder={t.phone}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            placeholder={t.address}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <button onClick={handleSave}>{t.save}</button>
        </div>
      </div>
    </main>
  );
}