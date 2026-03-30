'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🔥 AUTO SLUG GENERATOR
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function OwnerInfoPage() {
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // LOAD DATA
  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) return;

      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (data) {
        setRestaurant(data);
        setName(data.name || '');
        setSlug(data.slug || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
      }

      setLoading(false);
    }

    load();
  }, []);

  // SAVE
  async function save() {
    if (!restaurant) return;

    const { error } = await supabase
      .from('restaurants')
      .update({
        name,
        slug,
        phone,
        address,
      })
      .eq('id', restaurant.id);

    if (error) {
      console.error(error);
      alert('Save failed');
    } else {
      alert('Saved!');
    }
  }

  if (loading) {
    return (
      <div className="center">
        Loading...
      </div>
    );
  }

  return (
    <main className="page">
      <div className="card">
        <h1>Owner Info</h1>
        <p className="sub">Update your business details</p>

        {/* BUSINESS NAME */}
        <div className="field">
          <label>Business Name</label>
          <input
            value={name}
            onChange={(e) => {
              const value = e.target.value;
              setName(value);
              setSlug(generateSlug(value)); // 🔥 AUTO CREATE SLUG
            }}
            placeholder="TT Foods"
          />
        </div>

        {/* AUTO LINK (NO CONFUSION) */}
        <div className="field">
          <label>Your ordering link</label>
          <div className="linkBox">
            /store/{slug || 'your-business'}
          </div>
        </div>

        {/* PHONE */}
        <div className="field">
          <label>Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="323 555 5555"
          />
        </div>

        {/* ADDRESS */}
        <div className="field">
          <label>Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="3344 Elm St"
          />
        </div>

        <button onClick={save} className="saveBtn">
          Save Changes
        </button>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background: #f4f4f6;
          font-family: Inter, sans-serif;
        }

        .card {
          width: 100%;
          max-width: 500px;
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        h1 {
          font-size: 24px;
          font-weight: 800;
        }

        .sub {
          color: #6b7280;
          margin-bottom: 20px;
        }

        .field {
          margin-bottom: 16px;
        }

        label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
        }

        input {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          padding: 0 12px;
          font-size: 14px;
        }

        .linkBox {
          height: 44px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          background: #f1f5f9;
          border-radius: 10px;
          font-weight: 600;
          color: #111827;
        }

        .saveBtn {
          margin-top: 10px;
          width: 100%;
          height: 48px;
          background: #0f172a;
          color: white;
          border-radius: 12px;
          font-weight: 700;
          border: none;
        }

        .center {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </main>
  );
}