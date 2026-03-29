const checkout = async () => {
  if (!cart || cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  try {
    setCheckoutLoading(true);

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cart,
        restaurantId: data?.id,
        slug: data?.slug,
      }),
    });

    const dataRes = await res.json();

    if (!res.ok) {
      console.error("Stripe error:", dataRes);
      alert(dataRes?.error || "Checkout failed");
      return;
    }

    if (dataRes?.url) {
      window.location.href = dataRes.url;
    } else {
      alert("No checkout URL returned");
    }

  } catch (err) {
    console.error("Checkout crash:", err);
    alert("Something went wrong");
  } finally {
    setCheckoutLoading(false);
  }
};