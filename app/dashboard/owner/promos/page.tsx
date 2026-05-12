'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const promoTypes = [
  '20% Off',
  'Happy Hour',
  'Free Drink',
  'Free Delivery',
  'First-Time Customer',
  'Combo Deal',
  'Weekend Special',
  'Late Night Deal',
];

export default function PromosPage() {
  const [restaurantId, setRestaurantId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [promo, setPromo] = useState(promoTypes[0]);
  const [title, setTitle] = useState('20% OFF Today');
  const [details, setDetails] = useState(
    'Customers get 20% off when they order direct today.'
  );

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOwnerStore() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setOwnerId(user.id);

      const { data } = await supabase
        .from('restaurants')
        .select('id')
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .limit(1)
        .single();

      if (data?.id) setRestaurantId(data.id);
    }

    loadOwnerStore();
  }, []);

  async function savePromo() {
    setSaved(false);
    setError('');

    if (!restaurantId || !ownerId) {
      setError('Store not loaded yet.');
      return;
    }

    const { error } = await supabase.from('promo_codes').insert({
      restaurant_id: restaurantId,
      owner_id: ownerId,
      promo_type: promo,
      title,
      details,
      active: true,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
  }

  return (
    <main className="page">
      <section className="card">
        <Link href="/dashboard/owner" className="back">
          ← Back to Dashboard
        </Link>

        <h1>Promos</h1>

        <p>
          Create discounts, promo banners, coupon codes, and featured deals.
        </p>

        <div className="grid">
          {promoTypes.map((item) => (
            <button
              key={item}
              className={promo === item ? 'promo active' : 'promo'}
              onClick={() => {
                setPromo(item);
                setTitle(item);
                setDetails(
                  `Customers can use this ${item.toLowerCase()} promo when ordering direct.`
                );
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="builder">
          <label>Promo Title</label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label>Promo Details</label>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />

          {error ? <div className="error">{error}</div> : null}

          {saved ? (
            <div className="success">
              Promo saved to Supabase.
            </div>
          ) : null}

          <button className="btn" onClick={savePromo}>
            Save Promo
          </button>
        </div>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
.page{
min-height:100vh;
background:#f4f6fa;
padding:24px;
font-family:Inter,sans-serif;
color:#111827
}
.card{
max-width:1150px;
margin:auto;
background:white;
border:1px solid #dfe5ee;
border-radius:28px;
padding:28px;
box-shadow:0 20px 50px rgba(15,23,42,.08)
}
.back{
color:#111827;
font-weight:900;
text-decoration:none
}
h1{
font-size:52px;
margin:24px 0 10px;
font-weight:950
}
p{
font-size:18px;
color:#64748b;
font-weight:750
}
.grid{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:14px;
margin-top:28px
}
.promo{
min-height:76px;
border:1px solid #dfe5ee;
border-radius:20px;
background:#f8fafc;
color:#111827;
font-size:17px;
font-weight:950
}
.promo.active{
background:#111827;
color:white
}
.builder{
margin-top:24px;
display:grid;
gap:14px
}
label{
font-weight:950
}
input,textarea{
border-radius:18px;
border:1px solid #dfe5ee;
background:white;
color:#111827;
padding:16px;
font-size:17px
}
textarea{
min-height:120px
}
.btn{
height:64px;
border:0;
border-radius:18px;
background:#111827;
color:white;
font-size:20px;
font-weight:950
}
.success{
color:#16a34a;
font-weight:900
}
.error{
color:#ef4444;
font-weight:900
}
@media(max-width:900px){
.grid{
grid-template-columns:1fr 1fr
}
}
@media(max-width:600px){
.grid{
grid-template-columns:1fr
}
h1{
font-size:40px
}
}
`;
