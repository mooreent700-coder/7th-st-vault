'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const rewardTypes = [
  'Points System',
  'Buy 5 Get 1 Free',
  'VIP Customers',
  'Spend $100 Get Free Combo',
  'Birthday Reward',
  'Double Points Day',
];

export default function RewardsPage() {
  const [restaurantId, setRestaurantId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [type, setType] = useState(rewardTypes[0]);
  const [rewardName, setRewardName] = useState('ORDA Rewards');
  const [rule, setRule] = useState('Customers earn 1 point for every $1 spent.');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOwnerStore() {
      const { data: { user } } = await supabase.auth.getUser();
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

  async function saveReward() {
    setError('');
    setSaved(false);

    if (!restaurantId || !ownerId) {
      setError('Store not loaded yet. Refresh and try again.');
      return;
    }

    const { error } = await supabase.from('reward_programs').insert({
      restaurant_id: restaurantId,
      owner_id: ownerId,
      reward_type: type,
      reward_name: rewardName,
      reward_rule: rule,
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
        <Link href="/dashboard/owner" className="back">← Back to Dashboard</Link>
        <h1>Rewards</h1>
        <p>Create loyalty offers like points, buy 5 get 1, birthday rewards, and VIP perks.</p>

        <div className="grid">
          {rewardTypes.map((item) => (
            <button
              key={item}
              className={type === item ? 'reward active' : 'reward'}
              onClick={() => setType(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="builder">
          <label>Reward Name</label>
          <input value={rewardName} onChange={(e) => setRewardName(e.target.value)} />

          <label>Reward Rule</label>
          <textarea value={rule} onChange={(e) => setRule(e.target.value)} />

          {error ? <div className="error">{error}</div> : null}
          {saved ? <div className="success">Reward saved to Supabase.</div> : null}

          <button className="btn" onClick={saveReward}>Save Reward Program</button>
        </div>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
.page{min-height:100vh;background:#0b0c10;padding:24px;font-family:Inter,sans-serif;color:white}
.card{max-width:1150px;margin:auto;background:#111217;border:1px solid #252936;border-radius:28px;padding:28px}
.back{color:white;font-weight:900;text-decoration:none}
h1{font-size:52px;margin:24px 0 10px;font-weight:950}
p{font-size:18px;color:#a5adbd;font-weight:750}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:28px}
.reward{min-height:76px;border:1px solid #2b3040;border-radius:20px;background:#0e1015;color:white;font-size:17px;font-weight:950}
.reward.active{background:#f5c542;color:#111827;border-color:#f5c542}
.builder{margin-top:24px;display:grid;gap:14px}
label{font-weight:950}
input,textarea{border-radius:18px;border:1px solid #2b3040;background:#0e1015;color:white;padding:16px;font-size:17px}
textarea{min-height:120px}
.btn{height:64px;border:0;border-radius:18px;background:#f5c542;color:#111827;font-size:20px;font-weight:950}
.success{color:#4ade80;font-weight:900}.error{color:#ff4d4f;font-weight:900}
@media(max-width:800px){.grid{grid-template-columns:1fr}h1{font-size:40px}}
`;
