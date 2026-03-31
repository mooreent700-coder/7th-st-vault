import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: Request) {
  try {
    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/owner/builder`,
      return_url: `${origin}/dashboard/owner/builder`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (error: any) {
    console.error("STRIPE ONBOARDING LINK ERROR:", {
      message: error?.message,
      rawMessage: error?.raw?.message,
      code: error?.code,
      type: error?.type,
      param: error?.param,
      statusCode: error?.statusCode,
      requestId: error?.requestId,
    });

    return NextResponse.json(
      {
        error:
          error?.raw?.message ||
          error?.message ||
          "Could not create Stripe onboarding link",
      },
      { status: 500 }
    );
  }
}