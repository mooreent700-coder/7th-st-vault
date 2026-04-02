'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type RestaurantRow = {
  id: string;
  name: string | null;
  slug: string | null;
  stripe_account_id: string | null;
};

type StripeStatusResponse = {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  stripeAccountId: string | null;
  error?: string;
};

export default function OwnerDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [checkingStripe, setCheckingStripe] = useState(false);
  const [error, setError] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [stripeReady, setStripeReady] = useState(false);

  const autoStartedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadOwner() {
      try {
        setLoading(true);
        setError('');
        setStripeReady(false);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace('/login');
          return;
        }

        if (!active) return;
        setOwnerEmail(user.email || '');

        const { data: restaurantRow } = await supabase
          .from('restaurants')
          .select('id, name, slug, stripe_account_id')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!restaurantRow) {
          router.replace('/dashboard/owner/builder');
          return;
        }

        if (!active) return;

        const typedRestaurant: RestaurantRow = {
          id: restaurantRow.id,
          name: restaurantRow.name,
          slug: restaurantRow.slug,
          stripe_account_id: restaurantRow.stripe_account_id,
        };

        setRestaurant(typedRestaurant);

        if (!typedRestaurant.stripe_account_id) {
          setLoading(false);
          return;
        }

        const statusResponse = await fetch(
          `/api/connect/status?restaurantId=${typedRestaurant.id}`,
          { cache: 'no-store' }
        );

        const statusData: StripeStatusResponse = await statusResponse.json();

        if (!active) return;

        const fullyReady =
          statusData.connected &&
          statusData.onboardingComplete &&
          statusData.chargesEnabled &&
          statusData.payoutsEnabled;

        if (fullyReady) {
          setStripeReady(true);
          return; // ✅ stay on owner dashboard
        }

        setStripeReady(false);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Error loading dashboard');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOwner();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (loading || !restaurant || stripeReady || checkingStripe) return;
    if (autoStartedRef.current) return;

    autoStartedRef.current = true;
    handleConnectStripe(restaurant.id);
  }, [loading, restaurant, stripeReady, checkingStripe]);

  async function handleConnectStripe(restaurantId: string) {
    try {
      setCheckingStripe(true);
      setError('');

      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });

      const data = await res.json();

      if (!data?.url) throw new Error('Stripe failed');

      window.location.href = data.url;
    } catch (err: any) {
      setCheckingStripe(false);
      setError(err.message);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
  <main>
    <h1>Owner Dashboard</h1>

    {!stripeReady && (
      <button onClick={() => handleConnectStripe()}>
        Connect Stripe
      </button>
    )}

    <Link href="/dashboard/owner/builder">
      Go to Builder
    </Link>
  </main>
  );
}
