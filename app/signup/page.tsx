'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedPlan = searchParams.get('plan') || 'starter';

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. SIGN UP
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
          },
        },
      });

      if (signUpError) {
        alert(signUpError.message);
        return;
      }

      // 2. SIGN IN
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        alert(signInError.message);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('User not found');
        return;
      }

      const slug = generateSlug(businessName);

      // 3. CHECK IF RESTAURANT EXISTS
      const { data: existing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!existing) {
        // 4. CREATE RESTAURANT (ONLY ONCE)
        const { error: insertError } = await supabase.from('restaurants').insert({
          owner_id: user.id,
          owner_email: email,
          name: businessName,
          slug,
          plan: selectedPlan,
          phone: '',
          address: '',
          hours: '',
          hero_url: '',
          logo_url: '',
          stripe_connected: false,
          stripe_charges_enabled: false,
          stripe_payouts_enabled: false,
        });

        if (insertError) {
          console.error(insertError);
          alert('Failed to create store');
          return;
        }
      }

      // 5. GO TO DASHBOARD
      router.push('/dashboard/owner');
    } catch (error: any) {
      alert(error?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full mb-4 p-3 border rounded-xl"
          required
        />

        <input
          type="text"
          placeholder="Business Name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full mb-4 p-3 border rounded-xl"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 border rounded-xl"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-3 border rounded-xl"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>

        <p className="mt-4 text-sm text-center">
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}