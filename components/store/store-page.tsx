'use client';

import { useState } from 'react';

type MenuItem = {
  id: string;
  name: string;
  price: number;
};

type StoreData = {
  id: string;
  slug: string;
  name: string;
  items: MenuItem[];
};

export default function StorePage({ data }: { data: StoreData }) {
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => [...prev, item]);
  };

  const checkout = async () => {
    if (!cart.length) {
      alert("Cart empty");
      return;
    }

    try {
      setCheckoutLoading(true);

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, restaurantId: data.id, slug: data.slug }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || 'Checkout failed');
        return;
      }

      window.location.href = json.url;
    } catch (err) {
      console.error(err);
      alert('Error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{data.name}</h1>

      {data.items?.map((item) => (
        <div key={item.id} style={{ marginBottom: 10 }}>
          <span>{item.name} - ${item.price}</span>
          <button onClick={() => addToCart(item)}>Add</button>
        </div>
      ))}

      <hr />

      <h3>Cart ({cart.length})</h3>

      <button onClick={checkout} disabled={checkoutLoading}>
        {checkoutLoading ? 'Loading...' : 'Checkout'}
      </button>
    </div>
  );
}