-- ORDA billing, pause, admin messages, and flyer orders system
-- Run this whole file in Supabase SQL Editor.

alter table restaurants
  add column if not exists paused boolean default false,
  add column if not exists pause_reason text,
  add column if not exists billing_status text default 'trial',
  add column if not exists plan_key text default 'starter',
  add column if not exists plan_name text default 'Starter',
  add column if not exists monthly_price numeric default 19,
  add column if not exists platform_fee_percent numeric default 10,
  add column if not exists subscription_started_at timestamptz,
  add column if not exists payment_due_date date,
  add column if not exists last_payment_at timestamptz,
  add column if not exists overdue_days integer default 0,
  add column if not exists auto_pause_after_days integer default 7,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists billing_note text;

update restaurants
set
  plan_key = coalesce(plan_key, 'starter'),
  plan_name = coalesce(plan_name, 'Starter'),
  monthly_price = coalesce(monthly_price, 19),
  platform_fee_percent = coalesce(platform_fee_percent, 10),
  billing_status = coalesce(billing_status, 'trial'),
  payment_due_date = coalesce(payment_due_date, (now() + interval '30 days')::date),
  subscription_started_at = coalesce(subscription_started_at, now()),
  auto_pause_after_days = coalesce(auto_pause_after_days, 7),
  paused = coalesce(paused, false);

create table if not exists admin_messages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid,
  owner_id uuid,
  sender text not null default 'admin',
  subject text,
  message text not null,
  message_type text default 'general',
  status text default 'sent',
  read_by_owner boolean default false,
  read_by_admin boolean default true,
  created_at timestamptz default now()
);

create table if not exists flyer_orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid,
  owner_id uuid,
  store_name text,
  flyer_category text,
  flyer_style text,
  package_quantity integer default 0,
  package_price numeric default 0,
  notes text,
  status text default 'new',
  stripe_session_id text,
  payment_status text default 'unpaid',
  created_at timestamptz default now()
);

alter table admin_messages enable row level security;
alter table flyer_orders enable row level security;

drop policy if exists "admin_messages_allow_all_for_now" on admin_messages;
create policy "admin_messages_allow_all_for_now"
on admin_messages
for all
using (true)
with check (true);

drop policy if exists "flyer_orders_allow_all_for_now" on flyer_orders;
create policy "flyer_orders_allow_all_for_now"
on flyer_orders
for all
using (true)
with check (true);
