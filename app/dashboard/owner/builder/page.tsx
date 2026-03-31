const handleStripeConnect = async () => {
  try {
    if (!restaurantId) {
      alert(t.stripeMissingRestaurant);
      return;
    }

    setStripeLoading(true);

    const createResponse = await fetch('/api/connect/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, email: userEmail, businessName }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(createData?.error || t.stripeCreateFailed);
    }

    const accountId = String(createData?.accountId ?? '').trim();
    if (!accountId) {
      throw new Error(t.stripeCreateFailed);
    }

    const onboardingResponse = await fetch('/api/connect/create-onboarding-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });

    const onboardingData = await onboardingResponse.json();

    if (!onboardingResponse.ok) {
      throw new Error(onboardingData?.error || t.stripeLinkFailed);
    }

    const redirectUrl = String(onboardingData?.url ?? '').trim();

    if (!redirectUrl) {
      throw new Error(t.stripeLinkFailed);
    }

    new URL(redirectUrl);

    window.location.assign(redirectUrl);
  } catch (error: any) {
    alert(error?.message || t.builderFailed);
  } finally {
    setStripeLoading(false);
  }
};