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

export default function OwnerDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [checkingStripe, setCheckingStripe] = useState(false);
  const [error, setError] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);

  const autoStartedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadOwner() {
      try {
        setLoading(true);
        setError('');

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

        const { data: restaurantRow, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name, slug, stripe_account_id')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (restaurantError) {
          throw restaurantError;
        }

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

        if (typedRestaurant.stripe_account_id) {
          router.replace('/dashboard/owner/builder');
          return;
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Could not load owner dashboard.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOwner();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (!restaurant) return;
    if (restaurant.stripe_account_id) return;
    if (autoStartedRef.current) return;

    autoStartedRef.current = true;
    void handleConnectStripe(restaurant.id);
  }, [loading, restaurant]);

  async function handleConnectStripe(restaurantId: string) {
    try {
      setCheckingStripe(true);
      setError('');

      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurantId }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Could not start Stripe onboarding.');
      }

      if (!data?.url) {
        throw new Error('Stripe onboarding link was not created.');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setCheckingStripe(false);
      setError(err?.message || 'Could not connect Stripe.');
    }
  }

  async function refreshRestaurant() {
    try {
      setError('');
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: restaurantRow, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name, slug, stripe_account_id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (restaurantError) {
        throw restaurantError;
      }

      if (!restaurantRow) {
        throw new Error('Restaurant not found.');
      }

      const typedRestaurant: RestaurantRow = {
        id: restaurantRow.id,
        name: restaurantRow.name,
        slug: restaurantRow.slug,
        stripe_account_id: restaurantRow.stripe_account_id,
      };

      setRestaurant(typedRestaurant);

      if (typedRestaurant.stripe_account_id) {
        router.replace('/dashboard/owner/builder');
        return;
      }

      setError('Stripe is still not connected for this store yet.');
    } catch (err: any) {
      setError(err?.message || 'Could not refresh Stripe status.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="card">
          <div className="eyebrow">MenuFlow Owner</div>
          <h1>Loading your dashboard...</h1>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
            padding: 24px;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .card {
            width: 100%;
            max-width: 680px;
            background: #fff;
            border: 1px solid rgba(15, 23, 42, 0.08);
            border-radius: 32px;
            padding: 32px;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
          }
          .eyebrow {
            color: #718096;
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 12px;
          }
          h1 {
            margin: 0;
            color: #0f172a;
            font-size: clamp(32px, 6vw, 56px);
            line-height: 0.96;
            letter-spacing: -0.05em;
            font-weight: 900;
          }
        `}</style>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="page">
        <div className="card">
          <div className="eyebrow">MenuFlow Owner</div>
          <h1>No store found.</h1>
          <p>Create your store first.</p>
          <Link href="/dashboard/owner/builder" className="primaryButton">
            Go to Builder
          </Link>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
            padding: 24px;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .card {
            width: 100%;
            max-width: 680px;
            background: #fff;
            border: 1px solid rgba(15, 23, 42, 0.08);
            border-radius: 32px;
            padding: 32px;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
          }
          .eyebrow {
            color: #718096;
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 12px;
          }
          h1 {
            margin: 0;
            color: #0f172a;
            font-size: clamp(32px, 6vw, 56px);
            line-height: 0.96;
            letter-spacing: -0.05em;
            font-weight: 900;
          }
          p {
            margin: 16px 0 0;
            color: #475569;
            font-size: 18px;
            line-height: 1.5;
            font-weight: 700;
          }
          .primaryButton {
            display: inline-flex;
            margin-top: 24px;
            min-height: 60px;
            align-items: center;
            justify-content: center;
            padding: 0 24px;
            border-radius: 18px;
            background: #000;
            color: #fff;
            font-size: 18px;
            font-weight: 900;
            text-decoration: none;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card">
        <div className="eyebrow">MenuFlow Owner</div>

        <h1>Connect Stripe to start taking payments.</h1>

        <p className="subtext">
          Your store is created, but payouts are not ready until Stripe onboarding is complete.
        </p>

        <div className="detailBox">
          <div className="detailLabel">Store</div>
          <div className="detailValue">{restaurant.name || 'Untitled store'}</div>

          <div className="detailDivider" />

          <div className="detailLabel">Slug</div>
          <div className="detailValue">{restaurant.slug || 'Not set yet'}</div>

          <div className="detailDivider" />

          <div className="detailLabel">Signed in as</div>
          <div className="detailValue">{ownerEmail || 'Owner account'}</div>
        </div>

        {error ? <div className="errorBox">{error}</div> : null}

        <div className="buttonRow">
          <button
            type="button"
            className="primaryButton"
            onClick={() => void handleConnectStripe(restaurant.id)}
            disabled={checkingStripe}
          >
            {checkingStripe ? 'Opening Stripe...' : 'Connect Stripe'}
          </button>

          <button
            type="button"
            className="secondaryButton"
            onClick={() => void refreshRestaurant()}
            disabled={checkingStripe}
          >
            I already connected it
          </button>
        </div>

        <div className="footerNote">
          After Stripe onboarding is complete, you will be sent back and your store can accept payments.
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
          padding: 24px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .card {
          width: 100%;
          max-width: 720px;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 32px;
          padding: 32px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
        }
        .eyebrow {
          color: #718096;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }
        h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(34px, 6vw, 60px);
          line-height: 0.96;
          letter-spacing: -0.05em;
          font-weight: 900;
          max-width: 600px;
        }
        .subtext {
          margin: 18px 0 0;
          color: #475569;
          font-size: 18px;
          line-height: 1.55;
          font-weight: 700;
          max-width: 620px;
        }
        .detailBox {
          margin-top: 24px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 24px;
          background: #f8fbff;
          padding: 22px;
        }
        .detailLabel {
          color: #718096;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .detailValue {
          margin-top: 6px;
          color: #0f172a;
          font-size: 22px;
          line-height: 1.35;
          font-weight: 900;
          word-break: break-word;
        }
        .detailDivider {
          height: 1px;
          background: rgba(15, 23, 42, 0.08);
          margin: 18px 0;
        }
        .errorBox {
          margin-top: 20px;
          border-radius: 20px;
          padding: 16px 18px;
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.18);
          color: #991b1b;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.45;
        }
        .buttonRow {
          margin-top: 24px;
          display: grid;
          gap: 14px;
        }
        .primaryButton,
        .secondaryButton {
          width: 100%;
          min-height: 62px;
          border-radius: 18px;
          font-size: 19px;
          font-weight: 900;
          cursor: pointer;
        }
        .primaryButton {
          border: none;
          background: #000;
          color: #fff;
        }
        .secondaryButton {
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          color: #0f172a;
        }
        .primaryButton:disabled,
        .secondaryButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .footerNote {
          margin-top: 18px;
          color: #64748b;
          font-size: 15px;
          line-height: 1.5;
          font-weight: 700;
        }
        @media (max-width: 640px) {
          .page {
            padding: 16px;
          }
          .card {
            padding: 24px;
            border-radius: 24px;
          }
          .subtext {
            font-size: 17px;
          }
          .detailValue {
            font-size: 20px;
          }
        }
      `}</style>
    </main>
  );
}
