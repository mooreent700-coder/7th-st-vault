'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      setMessage('Enter your email');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setSuccess(false);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'http://localhost:3000/auth/reset-password',
        }
      );

      if (error) throw error;

      setSuccess(true);
      setMessage('Password reset email sent.');
    } catch (err: any) {
      setMessage(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="forgotPage">
      <section className="forgotCard">
        <div className="brand">ORDA</div>

        <h1>Forgot password</h1>

        <p className="subtitle">
          Enter your email to receive a password reset link.
        </p>

        <form onSubmit={handleReset} className="forgotForm">
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        {message ? (
          <div className={success ? 'successMessage' : 'errorMessage'}>
            {message}
          </div>
        ) : null}

        <Link href="/auth/login" className="backLink">
          Back to login
        </Link>
      </section>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          background: #0b0c10;
          color: #ffffff;
          font-family: Inter, sans-serif;
        }

        .forgotPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #0b0c10;
        }

        .forgotCard {
          width: 100%;
          max-width: 430px;
          padding: 32px;
          border-radius: 22px;
          background: #111217;
          border: 1px solid #1f222a;
        }

        .brand {
          font-size: 20px;
          font-weight: 900;
          margin-bottom: 20px;
        }

        h1 {
          margin: 0;
          font-size: 48px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .subtitle {
          margin-top: 14px;
          color: #9ca3af;
          line-height: 1.5;
          font-size: 16px;
          font-weight: 600;
        }

        .forgotForm {
          display: grid;
          gap: 14px;
          margin-top: 24px;
        }

        .forgotForm input {
          width: 100%;
          height: 56px;
          border-radius: 14px;
          border: 1px solid #2a2e38;
          background: #0e1015;
          color: #ffffff;
          padding: 0 16px;
          font-size: 16px;
          outline: none;
        }

        .forgotForm input::placeholder {
          color: #9ca3af;
        }

        .forgotForm input:focus {
          border-color: #ffffff;
        }

        .forgotForm button {
          width: 100%;
          height: 56px;
          border-radius: 14px;
          border: none;
          background: #ffffff;
          color: #000000;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .forgotForm button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .errorMessage {
          margin-top: 18px;
          color: #ff4d4f;
          font-weight: 800;
        }

        .successMessage {
          margin-top: 18px;
          color: #22c55e;
          font-weight: 800;
        }

        .backLink {
          display: inline-block;
          margin-top: 20px;
          color: #ffffff;
          font-weight: 900;
          text-decoration: none;
        }

        .backLink:hover {
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}