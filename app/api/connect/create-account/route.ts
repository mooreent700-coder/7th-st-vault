import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, email, businessName, country = "US" } = body || {};

    let restaurant: any = null;

    if (restaurantId) {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }

      restaurant = data;
    } else if (email) {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_email", email)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json(
          { error: "Restaurant not found for this email" },
          { status: 404 }
        );
      }

      restaurant = data;
    } else {
      return NextResponse.json(
        { error: "Missing restaurantId or email" },
        { status: 400 }
      );
    }

    if (restaurant.stripe_account_id) {
      return NextResponse.json({
        accountId: restaurant.stripe_account_id,
        restaurantId: restaurant.id,
        alreadyExists: true,
      });
    }

    const account = await stripe.accounts.create({
      type: "express",
      country,
      email: email || restaurant.owner_email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        product_description: "Restaurant online ordering powered by MenuFlow.",
      },
      metadata: {
        restaurantId: String(restaurant.id),
        restaurantSlug: String(restaurant.slug || ""),
        restaurantName: String(
          businessName || restaurant.name || "MenuFlow Restaurant"
        ),
      },
    });

    const { error: updateError } = await supabase
      .from("restaurants")
      .update({
        stripe_account_id: account.id,
        stripe_connected: false,
        stripe_onboarding_complete: false,
        stripe_charges_enabled: Boolean(account.charges_enabled),
        stripe_payouts_enabled: Boolean(account.payouts_enabled),
      })
      .eq("id", restaurant.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      accountId: account.id,
      restaurantId: restaurant.id,
      alreadyExists: false,
    });
  } catch (error: any) {
    console.error("CREATE CONNECTED ACCOUNT ERROR:", {
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
          "Could not create connected account",
      },
      { status: 500 }
    );
  }
}