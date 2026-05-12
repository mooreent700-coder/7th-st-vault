'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function OwnerInfoPage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  // LOAD
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
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
      }

      setLoading(false);
    }

    load();
  }, []);

  // 🔒 CHECK SLUG AVAILABILITY
  async function checkSlug(value: string) {
    const { data } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', value)
      .maybeSingle();

    if (!data) {
      setSlugAvailable(true);
    } else if (restaurant && data.id === restaurant.id) {
      setSlugAvailable(true);
    } else {
      setSlugAvailable(false);
    }
  }

  // HANDLE NAME CHANGE
  function handleNameChange(value: string) {
    setName(value);

    const newSlug = generateSlug(value);
    setSlug(newSlug);

    checkSlug(newSlug);
  }

  // SAVE
  async function save() {
    if (!restaurant) return;

    if (!slugAvailable) {
      alert('Name already taken');
      return;
    }

    const { error } = await supabase
      .from('restaurants')
      .update({
        name,
        slug,
      })
      .eq('id', restaurant.id);

    if (error) {
      alert('Error saving');
    } else {
      alert('Saved!');
    }
  }

  const fullLink = `https://ORDA-app-mu.vercel.app/store/${slug}`;

  if (loading) return <div className="center">Loading...</div>;

  return (
    <main className="page">
      <div className="card">
        <h1>Business Setup</h1>
        <p className="sub">This is your ordering link customers will use</p>

        {/* BUSINESS NAME */}
        <div className="field">
          <label>Business Name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="TT Foods"
          />
        </div>

        {/* LINK PREVIEW */}
        <div className="field">
          <label>Your Live Ordering Link</label>
          <div className="linkBox">{fullLink}</div>

          {!slugAvailable && (
            <div className="error">
              Name already taken — try something else
            </div>
          )}
        </div>

        {/* QR CODE */}
        <div className="qrBox">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullLink)}`}
          />
          <p>Scan to order</p>
        </div>

        <button onClick={save} className="saveBtn">
          Save
        </button>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 20px;
          display: flex;
          justify-content: center;
          background: #f4f4f6;
          font-family: Inter;
        }

        .card {
          width: 100%;
          max-width: 500px;
          background: white;
          padding: 24px;
          border-radius: 20px;
        }

        h1 {
          font-size: 22px;
          font-weight: 800;
        }

        .sub {
          color: #6b7280;
          margin-bottom: 20px;
        }

        .field {
          margin-bottom: 16px;
        }

        input {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          border: 1px solid #ddd;
          padding: 0 12px;
        }

        .linkBox {
          background: #f1f5f9;
          padding: 12px;
          border-radius: 10px;
          font-weight: 600;
          word-break: break-all;
        }

        .error {
          color: red;
          font-size: 13px;
          margin-top: 6px;
        }

        .qrBox {
          text-align: center;
          margin: 20px 0;
        }

        .qrBox img {
          border-radius: 12px;
        }

        .saveBtn {
          width: 100%;
          height: 48px;
          background: black;
          color: white;
          border-radius: 12px;
          font-weight: 700;
        }

        .center {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
      `}</style>
    </main>
  );
}