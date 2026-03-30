'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Restaurant = {
  id: string;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
};

export default function OwnerSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (data) {
        setRestaurant(data);
        setName(data.name || '');
        setSlug(data.slug || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setHours(data.hours || '');
      }

      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSave() {
    if (!restaurant) return;

    await supabase
      .from('restaurants')
      .update({
        name,
        slug,
        phone,
        address,
        hours,
      })
      .eq('id', restaurant.id);

    alert('Saved ✅');
  }

  if (loading) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center'
      }}>
        Loading...
      </main>
    );
  }

  return (
    <main className="page">
      <div className="card">
        <h1>Owner Settings</h1>
        <p className="sub">Update your business info</p>

        <div className="form">
          <label>
            Business Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label>
            Slug (URL)
            <input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </label>

          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>

          <label>
            Address
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>

          <label>
            Hours
            <input value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>

          <button onClick={handleSave} className="saveBtn">
            Save Changes
          </button>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 20px;
          background: #f4f4f6;
          display: flex;
          justify-content: center;
        }

        .card {
          width: 100%;
          max-width: 500px;
          background: white;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
        }

        h1 {
          font-size: 1.6rem;
          font-weight: 700;
        }

        .sub {
          color: #6b7280;
          margin-bottom: 20px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        label {
          display: flex;
          flex-direction: column;
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
        }

        input {
          margin-top: 6px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          padding: 0 12px;
          font-size: 0.95rem;
        }

        .saveBtn {
          margin-top: 10px;
          height: 46px;
          border-radius: 12px;
          background: #111827;
          color: white;
          font-weight: 600;
          border: none;
        }
      `}</style>
    </main>
  );
}