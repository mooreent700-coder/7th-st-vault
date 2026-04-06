'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stripeReady, setStripeReady] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStripe() {
      try {
        const res = await fetch('/api/connect/status');
        const data = await res.json();

        if (data?.connected) {
          setStripeReady(true);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    checkStripe();
  }, []);

  const handleConnectStripe = async () => {
    try {
      setCheckingStripe(true);

      const res = await fetch('/api/connect/create-account', {
        method: 'POST',
      });

      const data = await res.json();

      if (!data?.url) throw new Error('Stripe failed');

      window.location.href = data.url;
    } catch (err: any) {
      setCheckingStripe(false);
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Owner Dashboard</h1>

      {!stripeReady && (
        <button onClick={handleConnectStripe}>
          Connect Stripe
        </button>
      )}

      <br /><br />

      <Link href="/dashboard/owner/builder">
        Go to Builder
      </Link>

      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}
    </main>
  );
}