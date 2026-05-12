ORDA STRIPE CONNECT FIXES

What was updated:
1. api/create-checkout-session/route.ts
   - Now creates destination-charge Checkout Sessions for restaurant orders.
   - ORDA fee is applied automatically by restaurant plan:
     starter/free = 10%
     growth = 5%
     premium = 3%

2. New routes added:
   - api/connect/create-account/route.ts
   - api/connect/account-link/route.ts
   - api/connect/status/route.ts
   - api/stripe/webhook/route.ts

3. auth(0)/agreement/page.tsx
   - Terms updated for Stripe Connect and platform fees.

4. dashboard(0)/owner/page.tsx
   - Added Stripe status card.
   - Added Connect Stripe / Resume Stripe Onboarding button.
   - Added Refresh Stripe Status button.

5. stripe_connect_setup.sql
   - Run this in Supabase SQL editor before testing.

Required environment variables:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_APP_URL

Important:
- Restaurants must complete Stripe onboarding before order checkout will work.
- Your storefront checkout must continue sending restaurantId or slug into /api/create-checkout-session.
- If you want paid ORDA plans to use backend Checkout Sessions instead of your current payment links, that is a separate upgrade.
