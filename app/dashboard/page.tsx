'use client';

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type RangeKey = 'week' | 'lastWeek' | 'month' | 'lastMonth';
type OrderFilter = 'ALL' | 'NEW' | 'YELLOW' | 'GREEN';
type OrderLanguage = 'EN' | 'ES';

type RestaurantRecord = {
  id: string;
  name: string | null;
  slug: string | null;
  owner_id?: string | null;
  user_id?: string | null;
  owner_order_language?: string | null;
  order_language?: string | null;
  stripe_account_id?: string | null;
  stripe_connected?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
};

type OrderRow = {
  id: string;
  created_at: string;
  total?: number | string | null;
  amount_total?: number | string | null;
  status?: string | null;
  customer_name?: string | null;
  customer?: string | null;
  summary?: string | null;
  items_summary?: string | null;
  line_items_summary?: string | null;
};

type ProfileRow = {
  name?: string | null;
  full_name?: string | null;
  business_name?: string | null;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function currency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function safeNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatTime(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function statusTone(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return 'red';
  if (s.includes('ready')) return 'yellow';
  if (s.includes('prepar') || s.includes('new') || s.includes('pending')) return 'green';
  if (s.includes('complete')) return 'green';
  return 'neutral';
}

function displayStatus(status?: string | null) {
  if (!status) return 'New';
  const s = status.toLowerCase();
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('ready')) return 'Almost Ready';
  if (s.includes('prepar')) return 'Preparing';
  if (s.includes('complete')) return 'Completed';
  if (s.includes('new')) return 'New';
  return status;
}

function filterOrders(list: OrderRow[], filter: OrderFilter) {
  if (filter === 'ALL') return list;
  if (filter === 'NEW') {
    return list.filter((item) => {
      const s = displayStatus(item.status).toLowerCase();
      return s === 'new' || s === 'preparing';
    });
  }
  if (filter === 'YELLOW') {
    return list.filter((item) => statusTone(item.status) === 'yellow');
  }
  if (filter === 'GREEN') {
    return list.filter((item) => statusTone(item.status) === 'green');
  }
  return list;
}

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="tooltipCard">
      <div className="tooltipValue">{currency(payload[0].value)}</div>
      <div className="tooltipLabel">{label}</div>

      <style jsx>{`
        .tooltipCard {
          background: #66c8c6;
          color: #fff;
          border-radius: 12px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 0 14px 28px rgba(60, 91, 111, 0.16);
        }
        .tooltipValue {
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1;
        }
        .tooltipLabel {
          margin-top: 4px;
          font-size: 0.78rem;
          opacity: 0.96;
        }
      `}</style>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent,
  prefix,
  suffix,
}: {
  title: string;
  value: string;
  accent?: 'trend';
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="statCard">
      <div className="statTitle">{title}</div>
      <div className="statValueRow">
        {accent === 'trend' ? (
          <span className={`trendArrow ${prefix === '↓' ? 'trendNegative' : ''}`}>
            {prefix || '↑'}
          </span>
        ) : null}
        <span className="statValue">{value}</span>
        {suffix ? <span className="statSuffix">{suffix}</span> : null}
      </div>

      <style jsx>{`
        .statCard {
          min-height: 92px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #e8ebef;
          border-radius: 18px;
          box-shadow: 0 14px 34px rgba(20, 23, 28, 0.04);
        }
        .statTitle {
          color: #5e6674;
          font-size: 0.98rem;
          font-weight: 500;
        }
        .statValueRow {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }
        .trendArrow {
          color: #66c7c4;
          font-size: 1.2rem;
          line-height: 1;
          transform: translateY(1px);
        }
        .trendNegative {
          color: #c98282;
        }
        .statValue {
          color: #111827;
          font-weight: 700;
          font-size: 1.2rem;
          letter-spacing: -0.02em;
        }
        .statSuffix {
          color: #606977;
          font-size: 0.96rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="emptyState">
      {text}
      <style jsx>{`
        .emptyState {
          min-height: 92px;
          border: 1px solid #e8ebef;
          border-radius: 16px;
          background: #fff;
          color: #7b8594;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const customer = order.customer_name || order.customer || 'Customer';
  const summary =
    order.summary || order.items_summary || order.line_items_summary || 'Order received';
  const amount = currency(safeNumber(order.total ?? order.amount_total ?? 0));
  const status = displayStatus(order.status);

  return (
    <div className="orderCard">
      <div className="orderTop">
        <div className="orderLeft">
          <div className="orderIdLine">
            <span className="orderId">{order.id}</span>
            <span className="orderCustomer">{customer}</span>
          </div>
          <div className="orderSummary">{summary}</div>
        </div>

        <div className="orderRight">
          <div className="orderAmount">{amount}</div>
          <div className="orderTime">{formatTime(order.created_at)}</div>
        </div>
      </div>

      <div className="orderBottom">
        <span className={`statusPill ${getStatusClass(status)}`}>{status}</span>
      </div>

      <style jsx>{`
        .orderCard {
          border: 1px solid #e8ebef;
          border-radius: 16px;
          background: #fff;
          padding: 14px 14px 12px;
        }
        .orderTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .orderLeft {
          min-width: 0;
        }
        .orderIdLine {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .orderId {
          color: #3a404a;
          font-weight: 700;
          font-size: 0.98rem;
        }
        .orderCustomer {
          color: #111827;
          font-weight: 700;
          font-size: 1.02rem;
        }
        .orderSummary {
          margin-top: 6px;
          color: #636c79;
          font-size: 0.95rem;
        }
        .orderRight {
          text-align: right;
          flex-shrink: 0;
        }
        .orderAmount {
          color: #111827;
          font-weight: 800;
          font-size: 1.06rem;
        }
        .orderTime {
          margin-top: 6px;
          color: #7f8795;
          font-size: 0.9rem;
        }
        .orderBottom {
          margin-top: 12px;
        }
        .statusPill {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 0.92rem;
          font-weight: 600;
          border: 1px solid transparent;
        }
        .status-yellow {
          background: #f4ead0;
          color: #8a6a28;
          border-color: #ecddb8;
        }
        .status-green {
          background: #ddf3e7;
          color: #377b59;
          border-color: #cfead9;
        }
        .status-red {
          background: #f9d9dc;
          color: #b44c57;
          border-color: #f2c4ca;
        }
        .status-neutral {
          background: #eef2f5;
          color: #64707d;
          border-color: #dbe3e9;
        }
      `}</style>
    </div>
  );
}

function MobileOrderCard({ order }: { order: OrderRow }) {
  const customer = order.customer_name || order.customer || 'Customer';
  const summary =
    order.summary || order.items_summary || order.line_items_summary || 'Order received';
  const amount = currency(safeNumber(order.total ?? order.amount_total ?? 0));
  const status = displayStatus(order.status);

  return (
    <div className="mobileOrderCard">
      <div className="mobileOrderTop">
        <div className="mobileOrderId">{order.id}</div>
        <div className="mobileOrderAmount">{amount}</div>
      </div>

      <div className="mobileOrderMiddle">
        <div className="mobileOrderCustomer">{customer}</div>
        <div className="mobileOrderSummary">{summary}</div>
      </div>

      <div className="mobileOrderBottom">
        <span className={`statusPill ${getStatusClass(status)}`}>{status}</span>
        <span className="mobileOrderTime">{formatTime(order.created_at)}</span>
      </div>

      <style jsx>{`
        .mobileOrderCard {
          border: 1px solid #e8ebef;
          border-radius: 16px;
          padding: 12px;
          background: #fff;
        }
        .mobileOrderCard + .mobileOrderCard {
          margin-top: 10px;
        }
        .mobileOrderTop,
        .mobileOrderBottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .mobileOrderId {
          color: #3a404a;
          font-weight: 700;
          font-size: 0.96rem;
        }
        .mobileOrderAmount {
          color: #111827;
          font-weight: 800;
          font-size: 1rem;
        }
        .mobileOrderMiddle {
          margin: 8px 0 12px;
        }
        .mobileOrderCustomer {
          color: #111827;
          font-weight: 700;
          font-size: 1rem;
        }
        .mobileOrderSummary {
          margin-top: 5px;
          color: #68727f;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        .mobileOrderTime {
          color: #7f8795;
          font-size: 0.86rem;
        }
        .statusPill {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 0.92rem;
          font-weight: 600;
          border: 1px solid transparent;
        }
        .status-yellow {
          background: #f4ead0;
          color: #8a6a28;
          border-color: #ecddb8;
        }
        .status-green {
          background: #ddf3e7;
          color: #377b59;
          border-color: #cfead9;
        }
        .status-red {
          background: #f9d9dc;
          color: #b44c57;
          border-color: #f2c4ca;
        }
        .status-neutral {
          background: #eef2f5;
          color: #64707d;
          border-color: #dbe3e9;
        }
      `}</style>
    </div>
  );
}

function NavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BuilderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 17.5V6.5A2.5 2.5 0 0 1 6.5 4h7L20 10.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 4v6.5H19" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 15.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PaymentsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v10M8.5 10.5H14a2 2 0 1 1 0 4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OwnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 12a7 7 0 0 0-.08-1l2-1.56-2-3.44-2.4.8a7.2 7.2 0 0 0-1.7-.98L14.5 3h-5l-.32 2.82c-.6.23-1.16.56-1.68.98l-2.42-.8-2 3.44L5.08 11a7 7 0 0 0 0 2l-2 1.56 2 3.44 2.42-.8c.52.42 1.08.75 1.68.98L9.5 21h5l.32-2.82c.6-.23 1.16-.56 1.68-.98l2.42.8 2-3.44-2-1.56c.05-.33.08-.66.08-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function StorefrontIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5h16v7A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 10.5 6.5 5h11L19 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 14.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18H9m9-1V11a6 6 0 1 0-12 0v6l-2 2h16l-2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}