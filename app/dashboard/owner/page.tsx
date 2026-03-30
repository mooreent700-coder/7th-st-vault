'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
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
type OrderLanguage = 'EN' | 'ES';

type OrderItem = {
  id: string;
  customer: string;
  summary: string;
  amount: string;
  time: string;
  status: 'Almost Ready' | 'Ready' | 'Cancelled' | 'Preparing';
};

const chartSets: Record<RangeKey, { label: string; data: { day: string; value: number }[] }> = {
  week: {
    label: 'This Week',
    data: [
      { day: 'Mon', value: 55 },
      { day: 'Tue', value: 78 },
      { day: 'Wed', value: 48 },
      { day: 'Thu', value: 82 },
      { day: 'Fri', value: 176 },
      { day: 'Sat', value: 201 },
      { day: 'Sun', value: 275 },
    ],
  },
  lastWeek: {
    label: 'Last Week',
    data: [
      { day: 'Mon', value: 34 },
      { day: 'Tue', value: 52 },
      { day: 'Wed', value: 61 },
      { day: 'Thu', value: 70 },
      { day: 'Fri', value: 118 },
      { day: 'Sat', value: 146 },
      { day: 'Sun', value: 181 },
    ],
  },
  month: {
    label: 'This Month',
    data: [
      { day: 'W1', value: 420 },
      { day: 'W2', value: 585 },
      { day: 'W3', value: 530 },
      { day: 'W4', value: 742 },
    ],
  },
  lastMonth: {
    label: 'Last Month',
    data: [
      { day: 'W1', value: 355 },
      { day: 'W2', value: 490 },
      { day: 'W3', value: 518 },
      { day: 'W4', value: 640 },
    ],
  },
};

const liveOrders: OrderItem[] = [
  {
    id: 'MF-1024',
    customer: 'Andrea',
    summary: '2x Chicken Pitas · 1x Lemonade',
    amount: '$38',
    time: '1:02 PM',
    status: 'Almost Ready',
  },
  {
    id: 'MF-1025',
    customer: 'Jayleen',
    summary: '2x Chicken Pitas · 1x Fries',
    amount: '$25',
    time: '11:05 AM',
    status: 'Preparing',
  },
];

const billingOrders: OrderItem[] = [
  {
    id: 'MF-1024',
    customer: 'Andrea',
    summary: '2x Chicken Pitas · 1x Fries',
    amount: '$38',
    time: '11:14 AM',
    status: 'Cancelled',
  },
];

const cancelledOrders: OrderItem[] = [
  {
    id: 'MF-1023',
    customer: 'Jayleen',
    summary: '2x Chicken Pitas · 1x Fries',
    amount: '$25',
    time: '11:45 AM',
    status: 'Cancelled',
  },
];

function getStatusClass(status: OrderItem['status']): string {
  switch (status) {
    case 'Almost Ready':
      return 'status-yellow';
    case 'Ready':
      return 'status-green';
    case 'Cancelled':
      return 'status-red';
    case 'Preparing':
      return 'status-neutral';
    default:
      return 'status-neutral';
  }
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
      <div className="tooltipValue">${payload[0].value}</div>
      <div className="tooltipLabel">{label}</div>
      <style jsx>{`
        .tooltipCard {
          background: #62c7c7;
          color: #ffffff;
          border-radius: 12px;
          padding: 8px 12px;
          box-shadow: 0 12px 30px rgba(63, 92, 117, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.45);
        }

        .tooltipValue {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1;
        }

        .tooltipLabel {
          margin-top: 4px;
          font-size: 0.78rem;
          opacity: 0.95;
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>('week');
  const [orderLanguage, setOrderLanguage] = useState<OrderLanguage>('EN');
  const [orderFilter, setOrderFilter] = useState<'All' | 'New' | 'Yellow' | 'Green'>('All');
  const [billingFilter, setBillingFilter] = useState<'All' | 'New' | 'Yellow' | 'Green'>('All');

  const chartData = useMemo(() => chartSets[range].data, [range]);

  return (
    <div className="pageShell">
      <aside className="sidebar">
        <div className="brandCard">
          <div className="brandMark">M</div>
          <div className="brandText">
            <div className="brandName">MenuFlow</div>
          </div>
        </div>

        <div className="sidebarDivider" />

        <nav className="sidebarNav">
          <Link href="/dashboard" className="navItem navItemActive">
            <NavIcon />
            <span>Dashboard</span>
          </Link>

          <Link href="/dashboard/orders" className="navItem">
            <OrdersIcon />
            <span>Live Orders</span>
          </Link>

          <Link href="/dashboard/builder" className="navItem">
            <BuilderIcon />
            <span>Menu Builder</span>
          </Link>

          <Link href="/dashboard/payments" className="navItem">
            <PaymentsIcon />
            <span>Payments</span>
          </Link>

          <Link href="/dashboard/owner-info" className="navItem">
            <OwnerIcon />
            <span>Owner Info</span>
          </Link>

          <Link href="/dashboard/settings" className="navItem">
            <SettingsIcon />
            <span>Store Settings</span>
          </Link>
        </nav>

        <div className="sidebarFooter">
          <Link href="/store/hot-dogs" className="storefrontButton">
            <StorefrontIcon />
            <span>Open Storefront</span>
          </Link>
        </div>
      </aside>

      <main className="mainArea">
        <header className="desktopTopbar">
          <div className="topbarLeft">
            <button className="ownerControlButton" type="button">
              <span>Owner Control</span>
              <ChevronDownIcon />
            </button>
          </div>

          <div className="topbarRight">
            <div className="pillGroup" aria-label="Order language">
              <button
                type="button"
                className={`pillButton ${orderLanguage === 'EN' ? 'pillButtonActive' : ''}`}
                onClick={() => setOrderLanguage('EN')}
              >
                EN
              </button>
              <button
                type="button"
                className={`pillButton ${orderLanguage === 'ES' ? 'pillButtonActive' : ''}`}
                onClick={() => setOrderLanguage('ES')}
              >
                ES
              </button>
            </div>

            <label className="searchField" htmlFor="dashboard-search">
              <SearchIcon />
              <input id="dashboard-search" type="text" placeholder="Search" />
            </label>

            <Link href="/dashboard/builder" className="topActionButton">
              Open Builder
            </Link>
            <Link href="/store/hot-dogs" className="topActionButton">
              View Store
            </Link>
          </div>
        </header>

        <header className="mobileHeader">
          <div className="mobileHeaderTop">
            <button className="iconButton" type="button" aria-label="Menu">
              <MenuIcon />
            </button>

            <div className="mobileBrand">
              <div className="mobileBrandMark">M</div>
              <span>MenuFlow</span>
            </div>

            <button className="iconButton" type="button" aria-label="Notifications">
              <BellIcon />
            </button>
          </div>

          <div className="mobileControlRow">
            <div className="pillGroup" aria-label="Order language mobile">
              <button
                type="button"
                className={`pillButton ${orderLanguage === 'EN' ? 'pillButtonActive' : ''}`}
                onClick={() => setOrderLanguage('EN')}
              >
                EN
              </button>
              <button
                type="button"
                className={`pillButton ${orderLanguage === 'ES' ? 'pillButtonActive' : ''}`}
                onClick={() => setOrderLanguage('ES')}
              >
                ES
              </button>
            </div>

            <Link href="/dashboard/builder" className="topActionButton compactActionButton">
              Builder
            </Link>
            <Link href="/store/hot-dogs" className="topActionButton compactActionButton">
              Store
            </Link>
          </div>
        </header>

        <section className="contentGrid">
          <div className="overviewHeading">
            <h1>Overview</h1>
            <p>Quick Actions</p>
          </div>

          <div className="statsRow">
            <StatCard title="Today&apos;s Sales" value="$215" />
            <StatCard title="Today&apos;s Orders" value="6" />
            <StatCard title="Menu Items" value="4" />
            <StatCard
              title="Revenue Trend"
              value="38.2%"
              accent="trend"
              suffix="This Week"
            />
          </div>

          <section className="card chartCard">
            <div className="cardHeader chartHeader">
              <h2>Sales Overview</h2>

              <div className="tabGroup" aria-label="Chart range">
                <button
                  type="button"
                  className={range === 'week' ? 'tabButton tabButtonActive' : 'tabButton'}
                  onClick={() => setRange('week')}
                >
                  This Week
                </button>
                <button
                  type="button"
                  className={range === 'lastWeek' ? 'tabButton tabButtonActive' : 'tabButton'}
                  onClick={() => setRange('lastWeek')}
                >
                  Last Week
                </button>
                <button
                  type="button"
                  className={range === 'month' ? 'tabButton tabButtonActive' : 'tabButton'}
                  onClick={() => setRange('month')}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className={range === 'lastMonth' ? 'tabButton tabButtonActive' : 'tabButton'}
                  onClick={() => setRange('lastMonth')}
                >
                  Last Month
                </button>
              </div>
            </div>

            <div className="chartWrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 18, right: 12, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7ed5d3" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#7ed5d3" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} stroke="#eef1f5" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#7b8492', fontSize: 13 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#9aa3af', fontSize: 12 }}
                    tickFormatter={(value: number) => `$${value}`}
                    width={48}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#dce6eb', strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#66c7c4"
                    strokeWidth={3}
                    fill="url(#revenueFill)"
                    dot={{ stroke: '#9adfdc', fill: '#ffffff', r: 4, strokeWidth: 2 }}
                    activeDot={{ fill: '#66c7c4', stroke: '#ffffff', r: 6, strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="bottomGrid">
            <section className="card">
              <div className="cardHeader">
                <h2>Live Orders</h2>
                <button type="button" className="viewAllButton">
                  View All
                </button>
              </div>

              <div className="filterRow">
                {(['All', 'New', 'Yellow', 'Green'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={orderFilter === filter ? 'filterButton filterButtonActive' : 'filterButton'}
                    onClick={() => setOrderFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="orderList">
                {liveOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>

              <div className="panelFooter">
                <button type="button" className="viewAllButton">
                  View All
                </button>
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <h2>Billing</h2>
              </div>

              <div className="filterRow">
                {(['All', 'New', 'Yellow', 'Green'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={billingFilter === filter ? 'filterButton filterButtonActive' : 'filterButton'}
                    onClick={() => setBillingFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="billingStatusBlock">
                <h3>Stripe Status</h3>
                <div className="connectedRow">
                  <div className="connectedPill">
                    <span className="connectedDot" />
                    Connected
                  </div>
                  <div className="connectedPill">
                    <span className="connectedDot" />
                    Connected
                  </div>
                </div>
              </div>

              <div className="orderList">
                {billingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          </div>

          <section className="card cancelledCard">
            <div className="cardHeader">
              <h2>Cancelled Orders</h2>
            </div>

            <div className="orderList">
              {cancelledOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>

          <section className="mobileDashboard">
            <div className="mobileSectionTitle">Overview</div>

            <div className="mobileCard mobileSalesCard">
              <div>
                <div className="mobileLabel">Today&apos;s Sales</div>
                <div className="mobileSubtle">
                  <span className="tinyDot" />
                  This Week
                </div>
              </div>
              <div className="mobileValue">$215</div>
            </div>

            <div className="mobileMiniStats">
              <div className="mobileMiniCard">
                <div className="mobileLabel">Today&apos;s Orders</div>
                <div className="mobileMiniValue">6</div>
                <div className="mobileMiniArrow">›</div>
              </div>

              <div className="mobileMiniCard">
                <div className="mobileLabel">Menu</div>
                <div className="mobileMiniValue">4</div>
                <div className="mobileMiniArrow">›</div>
              </div>
            </div>

            <div className="mobileCard mobileRevenueCard">
              <div>
                <div className="mobileLabel">Revenue</div>
                <div className="mobileRevenuePill">
                  <span className="tinyDot tinyDotGreen" />
                  + 38.2%
                </div>
              </div>
              <div className="mobileValue">$942</div>
            </div>

            <div className="mobileCard">
              <div className="mobileCardHeader">
                <span>Live Orders</span>
                <button type="button" className="mobileViewAll">
                  View All
                </button>
              </div>

              {liveOrders.map((order) => (
                <div key={`mobile-${order.id}`} className="mobileOrderCard">
                  <div className="mobileOrderTop">
                    <div className="mobileOrderId">{order.id}</div>
                    <div className="mobileOrderAmount">{order.amount}</div>
                  </div>

                  <div className="mobileOrderMiddle">
                    <div className="mobileOrderCustomer">{order.customer}</div>
                    <div className="mobileOrderSummary">{order.summary}</div>
                  </div>

                  <div className="mobileOrderBottom">
                    <span className={`statusPill ${getStatusClass(order.status)}`}>{order.status}</span>
                    <span className="mobileOrderTime">{order.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          padding: 0;
          background: #efeff2;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          color: #111827;
        }

        :global(*) {
          box-sizing: border-box;
        }

        :global(a) {
          text-decoration: none;
          color: inherit;
        }

        .pageShell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(255, 255, 255, 0.82), rgba(240, 241, 244, 0.92));
          padding: 28px;
        }

        .sidebar {
          position: fixed;
          top: 36px;
          left: 36px;
          bottom: 36px;
          width: 212px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid #e8ebef;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(20, 23, 28, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .brandCard {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 22px 20px 18px;
        }

        .brandMark,
        .mobileBrandMark {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: #0f172a;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.05rem;
          letter-spacing: 0.02em;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
          flex-shrink: 0;
        }

        .brandName {
          font-size: 1.08rem;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }

        .sidebarDivider {
          height: 1px;
          background: #edf0f3;
        }

        .sidebarNav {
          padding: 16px 12px;
          display: grid;
          gap: 6px;
        }

        .navItem {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          padding: 0 14px;
          border-radius: 14px;
          color: #4b5563;
          font-size: 1rem;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .navItem:hover {
          background: #f8fafb;
        }

        .navItemActive {
          background: #f1f4f7;
          color: #111827;
          box-shadow: inset 1px 0 0 #111827;
        }

        .sidebarFooter {
          margin-top: auto;
          padding: 14px;
        }

        .storefrontButton {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 52px;
          border: 1px solid #e8ebef;
          border-radius: 16px;
          background: #ffffff;
          color: #365f6f;
          font-weight: 600;
          box-shadow: 0 12px 26px rgba(20, 23, 28, 0.04);
        }

        .mainArea {
          margin-left: 236px;
          padding-left: 24px;
        }

        .desktopTopbar {
          height: 72px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e8ebef;
          border-radius: 24px 24px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          box-shadow: 0 10px 30px rgba(20, 23, 28, 0.04);
        }

        .topbarLeft,
        .topbarRight {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ownerControlButton,
        .topActionButton,
        .pillButton,
        .filterButton,
        .tabButton,
        .viewAllButton,
        .iconButton,
        .mobileViewAll {
          border: 0;
          background: transparent;
          cursor: pointer;
          font: inherit;
        }

        .ownerControlButton {
          min-height: 42px;
          padding: 0 10px 0 0;
          color: #505866;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .pillGroup {
          display: inline-flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid #e5e9ee;
          border-radius: 12px;
          padding: 3px;
          box-shadow: 0 8px 20px rgba(20, 23, 28, 0.03);
        }

        .pillButton {
          min-width: 42px;
          height: 36px;
          border-radius: 10px;
          color: #606977;
          font-weight: 600;
          padding: 0 14px;
        }

        .pillButtonActive {
          background: #f2f6f8;
          color: #111827;
        }

        .searchField {
          height: 42px;
          min-width: 224px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          background: #ffffff;
          border: 1px solid #e5e9ee;
          border-radius: 12px;
          color: #9aa3af;
        }

        .searchField input {
          border: 0;
          outline: 0;
          width: 100%;
          font: inherit;
          background: transparent;
          color: #111827;
        }

        .searchField input::placeholder {
          color: #9aa3af;
        }

        .topActionButton {
          height: 42px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e9ee;
          border-radius: 12px;
          background: #ffffff;
          color: #111827;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(20, 23, 28, 0.03);
        }

        .mobileHeader {
          display: none;
        }

        .contentGrid {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid #e8ebef;
          border-top: 0;
          border-radius: 0 0 24px 24px;
          padding: 18px;
          box-shadow: 0 20px 60px rgba(20, 23, 28, 0.04);
        }

        .overviewHeading {
          margin-bottom: 14px;
        }

        .overviewHeading h1,
        .cardHeader h2,
        .mobileSectionTitle {
          margin: 0;
          color: #111827;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .overviewHeading h1 {
          font-size: 2rem;
          line-height: 1;
        }

        .overviewHeading p {
          margin: 6px 0 0;
          color: #7b8492;
          font-size: 0.96rem;
        }

        .statsRow {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .statCard,
        .card,
        .mobileCard,
        .mobileMiniCard {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #e8ebef;
          border-radius: 18px;
          box-shadow: 0 14px 34px rgba(20, 23, 28, 0.04);
        }

        .statCard {
          min-height: 92px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
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
        }

        .statValue {
          font-size: 1.02rem;
          font-weight: 700;
          color: #111827;
        }

        .statValueLarge {
          font-size: 1.18rem;
        }

        .trendArrow {
          color: #66c7c4;
          font-size: 1.2rem;
          line-height: 1;
          transform: translateY(1px);
        }

        .statSuffix {
          color: #606977;
          font-size: 0.96rem;
          font-weight: 500;
        }

        .chartCard {
          padding: 14px 16px 12px;
        }

        .card {
          padding: 16px;
        }

        .cardHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .cardHeader h2 {
          font-size: 1.18rem;
        }

        .chartHeader {
          margin-bottom: 6px;
        }

        .tabGroup,
        .filterRow {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tabButton,
        .filterButton,
        .viewAllButton,
        .mobileViewAll {
          min-height: 36px;
          padding: 0 14px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #e8ebef;
          color: #6b7280;
          font-weight: 500;
        }

        .tabButtonActive,
        .filterButtonActive {
          background: #eff6f5;
          color: #4f7f7e;
          border-color: #dce9e8;
        }

        .chartWrap {
          height: 280px;
          width: 100%;
        }

        .bottomGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: 14px;
          margin-top: 14px;
        }

        .orderList {
          display: grid;
          gap: 12px;
        }

        .orderCard {
          border: 1px solid #e8ebef;
          border-radius: 16px;
          background: #ffffff;
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

        .panelFooter {
          margin-top: 10px;
          display: flex;
          justify-content: flex-end;
        }

        .billingStatusBlock h3 {
          margin: 0 0 12px;
          color: #111827;
          font-size: 1rem;
        }

        .connectedRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .connectedPill {
          min-height: 38px;
          padding: 0 14px;
          border-radius: 12px;
          background: #f5fbfb;
          border: 1px solid #dfeded;
          color: #4f7f7e;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .connectedDot,
        .tinyDot,
        .tinyDotGreen {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          display: inline-block;
          background: #9bc8c7;
        }

        .tinyDotGreen {
          background: #76c9a0;
        }

        .cancelledCard {
          margin-top: 14px;
        }

        .mobileDashboard {
          display: none;
        }

        .mobileSectionTitle {
          font-size: 1.65rem;
          margin-bottom: 12px;
        }

        .mobileCard {
          padding: 14px;
        }

        .mobileSalesCard,
        .mobileRevenueCard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .mobileMiniStats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin: 10px 0;
        }

        .mobileMiniCard {
          position: relative;
          min-height: 96px;
          padding: 14px;
        }

        .mobileMiniArrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8a93a0;
          font-size: 1.3rem;
        }

        .mobileLabel {
          color: #5f6774;
          font-size: 0.98rem;
          font-weight: 500;
        }

        .mobileSubtle {
          margin-top: 8px;
          color: #8a93a0;
          font-size: 0.86rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mobileValue {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }

        .mobileMiniValue {
          margin-top: 10px;
          color: #111827;
          font-weight: 700;
          font-size: 2rem;
          line-height: 1;
        }

        .mobileRevenuePill {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          background: #edf5f2;
          color: #568d72;
          font-size: 0.86rem;
          font-weight: 600;
        }

        .mobileCardHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          color: #111827;
          font-weight: 700;
          font-size: 1.55rem;
          letter-spacing: -0.03em;
        }

        .mobileOrderCard {
          border: 1px solid #e8ebef;
          border-radius: 16px;
          padding: 12px;
          background: #ffffff;
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

        @media (max-width: 1180px) {
          .pageShell {
            padding: 18px;
          }

          .sidebar {
            width: 196px;
            left: 18px;
            top: 18px;
            bottom: 18px;
          }

          .mainArea {
            margin-left: 214px;
            padding-left: 18px;
          }

          .statsRow {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .topbarRight {
            flex-wrap: wrap;
            justify-content: flex-end;
          }
        }

        @media (max-width: 900px) {
          .sidebar,
          .desktopTopbar,
          .overviewHeading,
          .statsRow,
          .chartCard,
          .bottomGrid,
          .cancelledCard {
            display: none;
          }

          .mainArea {
            margin-left: 0;
            padding-left: 0;
          }

          .contentGrid {
            padding: 0;
            border: 0;
            background: transparent;
            box-shadow: none;
          }

          .mobileHeader {
            display: block;
            margin-bottom: 16px;
          }

          .mobileHeaderTop {
            height: 68px;
            padding: 0 14px;
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid #e8ebef;
            box-shadow: 0 12px 30px rgba(20, 23, 28, 0.04);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .mobileBrand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 1.35rem;
            color: #111827;
            letter-spacing: -0.03em;
          }

          .iconButton {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: #ffffff;
            border: 1px solid #e8ebef;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #111827;
            box-shadow: 0 8px 20px rgba(20, 23, 28, 0.03);
          }

          .mobileControlRow {
            margin-top: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .compactActionButton {
            height: 40px;
            padding: 0 14px;
          }

          .mobileDashboard {
            display: block;
          }
        }

        @media (max-width: 560px) {
          .pageShell {
            padding: 12px;
          }

          .mobileHeaderTop {
            padding: 0 10px;
          }

          .mobileBrand {
            font-size: 1.2rem;
            gap: 8px;
          }

          .mobileBrandMark {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            font-size: 0.98rem;
          }

          .mobileControlRow {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .pillGroup {
            width: 100%;
            justify-content: center;
            grid-column: 1 / -1;
          }

          .compactActionButton {
            width: 100%;
          }

          .mobileMiniStats {
            grid-template-columns: 1fr 1fr;
          }

          .mobileSalesCard,
          .mobileRevenueCard {
            align-items: flex-start;
            flex-direction: column;
          }

          .mobileValue {
            font-size: 1.85rem;
          }

          .mobileCardHeader {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent,
  suffix,
}: {
  title: string;
  value: string;
  accent?: 'trend';
  suffix?: string;
}) {
  return (
    <div className="statCard">
      <div className="statTitle">{title}</div>

      <div className="statValueRow">
        {accent === 'trend' ? <span className="trendArrow">↑</span> : null}
        <span className={`statValue ${accent === 'trend' ? 'statValueLarge' : 'statValueLarge'}`}>
          {value}
        </span>
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

        .statValue {
          color: #111827;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .statValueLarge {
          font-size: 1.18rem;
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

function OrderCard({ order }: { order: OrderItem }) {
  return (
    <div className="orderCard">
      <div className="orderTop">
        <div className="orderLeft">
          <div className="orderIdLine">
            <span className="orderId">{order.id}</span>
            <span className="orderCustomer">{order.customer}</span>
          </div>
          <div className="orderSummary">{order.summary}</div>
        </div>

        <div className="orderRight">
          <div className="orderAmount">{order.amount}</div>
          <div className="orderTime">{order.time}</div>
        </div>
      </div>

      <div className="orderBottom">
        <span className={`statusPill ${getStatusClass(order.status)}`}>{order.status}</span>
      </div>

      <style jsx>{`
        .orderCard {
          border: 1px solid #e8ebef;
          border-radius: 16px;
          background: #ffffff;
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

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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