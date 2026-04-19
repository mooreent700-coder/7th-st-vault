import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { fullName, businessName, email, password } = body;

    if (!email || !password || !businessName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Create user
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (signUpError) {
      return NextResponse.json(
        { success: false, message: signUpError.message },
        { status: 400 }
      );
    }

    // 2. Sign in user
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      return NextResponse.json(
        { success: false, message: signInError.message },
        { status: 400 }
      );
    }

    const user = signInData.user;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found after signup' },
        { status: 400 }
      );
    }

    // 3. Create restaurant
    const slug = generateSlug(businessName);

    const { error: insertError } = await supabase
      .from('restaurants')
      .insert({
        owner_id: user.id,
        owner_email: email,
        name: businessName,
        slug,
      });

    if (insertError) {
      return NextResponse.json(
        { success: false, message: insertError.message },
        { status: 400 }
      );
    }

    // 4. Success
    return NextResponse.json({
      success: true,
      redirect: '/dashboard/owner',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}