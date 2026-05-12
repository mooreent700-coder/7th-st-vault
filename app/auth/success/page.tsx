'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type PlanKey = 'starter' | 'growth' | 'premium';

function normalizePlan(value: string | null): PlanKey {
  if (value === 'growth' || value === 'premium') return value;
  return 'starter';
}

const planCopy: Record<
  PlanKey,
  {
    title: string;
    detail: string;
    button: string;
  }
> = {
  starter: {
    title: 'Starter plan confirmed',
    detail: 'Your first month is free. Continue to create your account and start building your ORDA setup.',
    button: 'Continue to Account Setup',
  },
  growth: {
    title: 'Growth plan payment received',
    detail: 'Your Growth plan payment was successful. Continue to create your account and move into your ORDA onboarding flow.',
    button: 'Continue to Account Setup',
  },
  premium: {
    title: 'Premium plan payment received',
    detail: 'Your Premium plan payment was successful. Continue to create your account and move into your ORDA onboarding flow.',
    button: 'Continue to Account Setup',
  },
};

export default function SuccessPage() {
  const [plan, setPlan] = useState<PlanKey>('starter');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPlan(normalizePlan(params.get('plan')));
    setReady(true);
  }, []);

  const handleContinue = () => {
    window.location.href = `/auth/signup?plan=${plan}&paid=true`;
  };

  if (!ready) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f8f5',
          color: '#142132',
          padding: '24px',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '540px',
            background: '#ffffff',
            border: '1px solid rgba(20,33,50,0.08)',
            borderRadius: '24px',
            padding: '28px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: '18px',
            boxShadow: '0 18px 42px rgba(15,23,42,0.08)',
          }}
        >
          Loading success page...
        </div>
      </main>
    );
  }

  const current = planCopy[plan];

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8f8f5',
        color: '#142132',
        padding: '24px',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#ffffff',
          border: '1px solid rgba(20,33,50,0.08)',
          borderRadius: '28px',
          padding: '28px',
          boxSizing: 'border-box',
          boxShadow: '0 22px 50px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: '8px 12px',
            borderRadius: '999px',
            background: '#eef1ee',
            border: '1px solid rgba(20,33,50,0.08)',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Payment successful
        </div>

        <h1
          style={{
            margin: '18px 0 0',
            fontSize: 'clamp(34px, 7vw, 52px)',
            lineHeight: 1.05,
            fontWeight: 900,
            letterSpacing: '-0.04em',
          }}
        >
          {current.title}
        </h1>

        <p
          style={{
            marginTop: '14px',
            fontSize: '18px',
            lineHeight: 1.75,
            color: '#526171',
            maxWidth: '620px',
          }}
        >
          {current.detail}
        </p>

        <div
          style={{
            marginTop: '24px',
            border: '1px solid rgba(20,33,50,0.08)',
            borderRadius: '20px',
            padding: '20px',
            background: '#f8f8f5',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#8a744f',
            }}
          >
            Next step
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '24px',
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            Create your ORDA account
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '16px',
              lineHeight: 1.7,
              color: '#526171',
            }}
          >
            Your plan is selected already. Continue into account setup, agreement, and your dashboard flow.
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          style={{
            width: '100%',
            minHeight: '56px',
            marginTop: '24px',
            border: 'none',
            borderRadius: '16px',
            background: '#142132',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {current.button}
        </button>

        <div style={{ marginTop: '18px' }}>
          <Link
            href="/"
            style={{
              color: '#526171',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
