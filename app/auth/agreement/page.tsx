"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AgreementPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      router.push("/auth/login");
      return;
    }

    const { data } = await supabase
      .from("restaurants")
      .select("id, agreed_to_terms")
      .eq("owner_email", user.email)
      .maybeSingle();

    if (!data) {
      router.push("/dashboard/owner");
      return;
    }

    if (data.agreed_to_terms) {
      router.push("/dashboard/owner");
      return;
    }

    setRestaurantId(data.id);
    setLoading(false);
  }

  async function handleAgree() {
    if (!agree || !restaurantId) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("restaurants")
        .update({
          agreed_to_terms: true,
          agreed_to_terms_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/dashboard/owner");
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={wrap}>
        <h2>Loading agreement...</h2>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={title}>ORDA Terms Agreement</h1>
        <p style={sub}>Please read and accept before continuing</p>

        <div style={content}>
          <p>
            ORDA is a technology platform that provides website creation,
            menu hosting, direct online ordering, and Stripe Connect payouts for restaurants and food businesses.
          </p>

          <h3>1. Payments</h3>
          <p>
            Customer payments are processed through Stripe. ORDA may charge a platform fee based on the restaurant plan.
            Restaurants are responsible for completing Stripe onboarding so they can receive payouts.
          </p>

          <h3>2. Business Responsibility</h3>
          <p>
            You are fully responsible for your business operations, orders,
            customer communication, refunds, and fulfillment.
          </p>

          <h3>3. Platform Fees</h3>
          <p>
            ORDA may deduct a platform fee from customer orders based on your selected plan. Current fee structure may include:
            starter/free plan 10%, growth plan 5%, and premium plan 3%.
          </p>

          <h3>4. No Guarantees</h3>
          <p>
            ORDA does not guarantee sales, traffic, or business performance.
          </p>

          <h3>5. Limitation of Liability</h3>
          <p>
            ORDA is not liable for business losses, disputes, chargebacks,
            or damages arising from use of the platform.
          </p>

          <h3>6. Platform Usage</h3>
          <p>
            You agree to use ORDA legally and not for fraudulent or harmful
            activity.
          </p>
        </div>

        <div style={agreeRow}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I have read, understand, and agree to the ORDA Terms
          </span>
        </div>

        <button
          onClick={handleAgree}
          disabled={!agree || submitting}
          style={{
            ...button,
            opacity: !agree ? 0.6 : 1,
            cursor: !agree ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting..." : "Agree & Continue"}
        </button>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f6f8fc",
  padding: "20px",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "700px",
  background: "#ffffff",
  borderRadius: "24px",
  padding: "30px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
};

const title: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 800,
};

const sub: React.CSSProperties = {
  marginTop: "6px",
  color: "#6b7280",
};

const content: React.CSSProperties = {
  marginTop: "20px",
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#374151",
};

const agreeRow: React.CSSProperties = {
  marginTop: "20px",
  display: "flex",
  gap: "10px",
  alignItems: "center",
};

const button: React.CSSProperties = {
  marginTop: "20px",
  width: "100%",
  padding: "16px",
  borderRadius: "14px",
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  fontWeight: 800,
};
