import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Not configured yet',
  });
}

export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Not configured yet',
  });
}
