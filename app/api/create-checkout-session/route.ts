import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

function getFeePercent(plan: string | null | undefined) {
  const normalized = String(plan || "starter").toLowerCase();

  if (normalized === "growth") return 0.05;
  if (normalized === "premium") return 0.03;

  return 0.1;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, restaurantId, slug, orderId } = body || {};

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: "No cart items" },
        { status: 400 }
      );
    }

    let restaurantQuery = supabase.from("restaurants").select("*");

    if (restaurantId) {
      restaurantQuery = restaurantQuery.eq("id", restaurantId);
    } else if (slug) {
      restaurantQuery = restaurantQuery.eq("slug", slug);
    } else {
      return NextResponse.json(
        { error: "Missing restaurantId or slug" },
        { status: 400 }
      );
    }

    const {
      data: restaurant,
      error: restaurantError,
    } = await restaurantQuery.maybeSingle();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map(
      (item: any) => {
        const name =
          item?.name ||
          item?.name_en ||
          item?.title ||
          "Menu item";

        const description =
          item?.description ||
          item?.description_en ||
          "";

        const priceNumber = Number(item?.price || 0);
        const quantityNumber = Math.max(1, Number(item?.qty || item?.quantity || 1));

        return {
          quantity: quantityNumber,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(priceNumber * 100),
            product_data: {
              name,
              description,
              images: item?.image_url ? [String(item.image_url)] : [],
            },
          },
        };
      }
    );

    const subtotal = cart.reduce((sum: number, item: any) => {
      const price = Number(item?.price || 0);
      const qty = Math.max(1, Number(item?.qty || item?.quantity || 1));
      return sum + Math.round(price * 100) * qty;
    }, 0);

    const feePercent = getFeePercent(restaurant.plan);
    const applicationFeeAmount = Math.max(
      0,
      Math.round(subtotal * feePercent)
    );

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${origin}/checkout/success?slug=${restaurant.slug || slug || ""}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?slug=${restaurant.slug || slug || ""}`,
      metadata: {
        restaurantId: String(restaurant.id || ""),
        restaurantSlug: String(restaurant.slug || slug || ""),
        restaurantPlan: String(restaurant.plan || "starter"),
        menuFlowFeePercent: String(feePercent),
        orderId: String(orderId || ""),
      },
    };

    if (restaurant.stripe_account_id) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: restaurant.stripe_account_id,
        },
        metadata: {
          restaurantId: String(restaurant.id || ""),
          restaurantSlug: String(restaurant.slug || slug || ""),
          restaurantPlan: String(restaurant.plan || "starter"),
          menuFlowFeePercent: String(feePercent),
          orderId: String(orderId || ""),
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      feePercent,
      applicationFeeAmount,
      connectedAccount: restaurant.stripe_account_id || null,
    });
  } catch (error: any) {
    console.error("CHECKOUT ROUTE ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Checkout failed" },
      { status: 500 }
    );
  }
}