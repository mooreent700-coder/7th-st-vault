'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type SupportMessage = {
  id: string;
  restaurant_id: string;
  owner_id: string;
  sender_role: 'owner' | 'admin' | string;
  message: string;
  created_at: string;
};

type RestaurantRow = {
  id: string;
  owner_id: string;
  name: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  logo_image: string | null;
  hero_image: string | null;
  stripe_connected?: boolean | null;
  stripe_account_id?: string | null;
  account_status?: string | null;
  payment_status?: string | null;
  pause_reason?: string | null;
  paused_at?: string | null;
  total_orders?: number;
  total_revenue?: number;
  flyer_orders?: number;
  unread_messages?: number;
  messages?: SupportMessage[];
};

type DashboardResponse = {
  summary: {
    total_restaurants: number;
    total_orders: number;
    total_revenue: number;
    active: number;
    past_due: number;
    paused: number;
    pending_flyers: number;
    unread_messages: number;
  };
  restaurants: RestaurantRow[];
};

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getPlatformFeePercent(planOrSlug?: string | null) {
  const raw = String(planOrSlug || '').toLowerCase();
  if (raw.includes('premium')) return 3;
  if (raw.includes('growth')) return 5;
  return 10;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<DashboardResponse['summary']>({
    total_restaurants: 0,
    total_orders: 0,
    total_revenue: 0,
    active: 0,
    past_due: 0,
    paused: 0,
    pending_flyers: 0,
    unread_messages: 0,
  });
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [workingKey, setWorkingKey] = useState('');
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [pauseReasons, setPauseReasons] = useState<Record<string, string>>({});

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/admin/dashboard', {
        method: 'GET',
        cache: 'no-store',
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load admin dashboard.');
      }

      setSummary(json.summary || {});
      setRestaurants(json.restaurants || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function runAction(
    restaurant: RestaurantRow,
    action: 'pause' | 'unpause' | 'message' | 'reminder'
  ) {
    try {
      if (!restaurant.id || !restaurant.owner_id) {
        alert('Missing restaurant or owner id.');
        return;
      }

      const working = `${restaurant.id}:${action}`;
      setWorkingKey(working);

      const payload: Record<string, unknown> = {
        action,
        restaurantId: restaurant.id,
        ownerId: restaurant.owner_id,
      };

      if (action === 'message') {
        const msg = (messageDrafts[restaurant.id] || '').trim();
        if (!msg) {
          alert('Type a message first.');
          return;
        }
        payload.message = msg;
      }

      if (action === 'pause') {
        payload.reason =
          (pauseReasons[restaurant.id] || '').trim() || 'Late payment or non-payment.';
      }

      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Action failed.');
      }

      setMessageDrafts((prev) => ({ ...prev, [restaurant.id]: '' }));
      await loadDashboard();
      setExpandedId(restaurant.id);
    } catch (err: any) {
      alert(err?.message || 'Action failed.');
    } finally {
      setWorkingKey('');
    }
  }

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restaurants;

    return restaurants.filter((r) => {
      return (
        String(r.name || '').toLowerCase().includes(q) ||
        String(r.slug || '').toLowerCase().includes(q) ||
        String(r.phone || '').toLowerCase().includes(q) ||
        String(r.address || '').toLowerCase().includes(q) ||
        String(r.payment_status || '').toLowerCase().includes(q) ||
        String(r.account_status || '').toLowerCase().includes(q)
      );
    });
  }, [restaurants, search]);

  const heroRevenue = useMemo(() => money(summary.total_revenue || 0), [summary.total_revenue]);

  if (loading) {
    return (
      <main className="page">
        <div className="shell">
          <div className="loadingCard">Loading admin dashboard...</div>
          <style jsx>{styles}</style>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="glow glowOne" />
      <div className="glow glowTwo" />
      <div className="glow glowThree" />

      <div className="shell">
        <section className="hero">
          <div className="heroLeft">
            <div className="eyebrow">MenuFlow Admin</div>
            <h1>Command Center</h1>
            <p>
              Payments, owner support, pause control, store health, flyer activity, and order
              visibility in one tight premium admin.
            </p>

            <div className="heroActions">
              <Link href="/" className="heroBtn ghost">
                Landing Page
              </Link>
              <Link href="/dashboard/owner" className="heroBtn solid">
                Owner Dashboard
              </Link>
            </div>
          </div>

          <div className="heroRight">
            <div className="heroMetric large">
              <span>Total Revenue</span>
              <strong>{heroRevenue}</strong>
              <small>Live from current stored orders</small>
            </div>

            <div className="heroMetricRow">
              <div className="heroMetric small">
                <span>Unread Messages</span>
                <strong>{summary.unread_messages || 0}</strong>
              </div>

              <div className="heroMetric small">
                <span>Pending Flyers</span>
                <strong>{summary.pending_flyers || 0}</strong>
              </div>
            </div>
          </div>
        </section>

        {error ? <div className="errorBanner">{error}</div> : null}

        <section className="statsRow">
          <div className="statCard">
            <span>Restaurants</span>
            <strong>{summary.total_restaurants || 0}</strong>
          </div>

          <div className="statCard">
            <span>Orders</span>
            <strong>{summary.total_orders || 0}</strong>
          </div>

          <div className="statCard">
            <span>Revenue</span>
            <strong>{money(summary.total_revenue || 0)}</strong>
          </div>

          <div className="statCard">
            <span>Active</span>
            <strong>{summary.active || 0}</strong>
          </div>

          <div className="statCard warning">
            <span>Past Due</span>
            <strong>{summary.past_due || 0}</strong>
          </div>

          <div className="statCard paused">
            <span>Paused</span>
            <strong>{summary.paused || 0}</strong>
          </div>
        </section>

        <section className="panel">
          <div className="panelTop">
            <div>
              <div className="panelEyebrow">Restaurant Control</div>
              <h2>Owners, Billing, Messages</h2>
              <p>
                Tighter, cleaner, higher-end control layout with fast actions and less scrolling.
              </p>
            </div>

            <input
              className="search"
              placeholder="Search store, slug, phone, address, or status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!filteredRestaurants.length ? (
            <div className="emptyState">No restaurants found.</div>
          ) : (
            <div className="restaurantGrid">
              {filteredRestaurants.map((restaurant) => {
                const expanded = expandedId === restaurant.id;
                const brandImage = restaurant.logo_image || restaurant.hero_image || '';
                const unread = restaurant.unread_messages || 0;
                const revenue = Number(restaurant.total_revenue || 0);
                const orderCount = Number(restaurant.total_orders || 0);
                const flyerCount = Number(restaurant.flyer_orders || 0);
                const feePercent = getPlatformFeePercent(restaurant.slug || restaurant.name);
                const yourFees = (revenue * feePercent) / 100;

                const statusClass =
                  restaurant.account_status === 'paused'
                    ? 'paused'
                    : restaurant.payment_status === 'past_due'
                    ? 'past_due'
                    : 'active';

                const latestMessage = restaurant.messages?.[0];

                return (
                  <article key={restaurant.id} className="restaurantCard">
                    <div className="cardHead">
                      <div className="brandWrap">
                        {brandImage ? (
                          <img src={brandImage} alt={restaurant.name || 'Store'} className="brandImage" />
                        ) : (
                          <div className="brandFallback">
                            {(restaurant.name || 'M').charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="brandCopy">
                          <h3>{restaurant.name || 'Unnamed Restaurant'}</h3>
                          <p>Slug: {restaurant.slug || '—'}</p>
                          <p>{restaurant.phone || '—'}</p>
                        </div>
                      </div>

                      <div className="topRight">
                        <span className={`statusPill ${statusClass}`}>
                          {restaurant.account_status === 'paused'
                            ? 'PAUSED'
                            : restaurant.payment_status === 'past_due'
                            ? 'PAST DUE'
                            : 'ACTIVE'}
                        </span>

                        {unread > 0 ? <span className="unreadPill">{unread} unread</span> : null}
                      </div>
                    </div>

                    <div className="compactGrid">
                      <div className="miniBox">
                        <span>Monthly</span>
                        <strong>$19</strong>
                      </div>

                      <div className="miniBox">
                        <span>Platform Fee</span>
                        <strong>{feePercent}%</strong>
                      </div>

                      <div className="miniBox">
                        <span>Stripe</span>
                        <strong>
                          {restaurant.stripe_connected || restaurant.stripe_account_id
                            ? 'Connected'
                            : 'Not Connected'}
                        </strong>
                      </div>

                      <div className="miniBox">
                        <span>Orders</span>
                        <strong>{orderCount}</strong>
                      </div>

                      <div className="miniBox">
                        <span>Revenue</span>
                        <strong>{money(revenue)}</strong>
                      </div>

                      <div className="miniBox">
                        <span>Your Fees</span>
                        <strong>{money(yourFees)}</strong>
                      </div>

                      <div className="miniBox">
                        <span>Flyers</span>
                        <strong>{flyerCount}</strong>
                      </div>

                      <div className="miniBox">
                        <span>Paused Reason</span>
                        <strong>{restaurant.pause_reason || '—'}</strong>
                      </div>
                    </div>

                    <div className="actionRow">
                      <button
                        className="actionBtn soft"
                        disabled={workingKey === `${restaurant.id}:reminder`}
                        onClick={() => runAction(restaurant, 'reminder')}
                      >
                        {workingKey === `${restaurant.id}:reminder` ? 'Sending...' : 'Send Reminder'}
                      </button>

                      <button
                        className={`actionBtn ${restaurant.account_status === 'paused' ? 'good' : 'danger'}`}
                        disabled={
                          workingKey === `${restaurant.id}:pause` ||
                          workingKey === `${restaurant.id}:unpause`
                        }
                        onClick={() =>
                          runAction(
                            restaurant,
                            restaurant.account_status === 'paused' ? 'unpause' : 'pause'
                          )
                        }
                      >
                        {restaurant.account_status === 'paused'
                          ? workingKey === `${restaurant.id}:unpause`
                            ? 'Saving...'
                            : 'Unpause'
                          : workingKey === `${restaurant.id}:pause`
                          ? 'Saving...'
                          : 'Pause'}
                      </button>

                      <button
                        className="actionBtn solid"
                        onClick={() => setExpandedId(expanded ? null : restaurant.id)}
                      >
                        {expanded ? 'Hide' : 'Open'}
                      </button>
                    </div>

                    {expanded ? (
                      <div className="expanded">
                        <div className="expandedGrid">
                          <div className="messageComposer">
                            <div className="sectionLabel">Message Owner</div>
                            <textarea
                              className="textarea"
                              placeholder="Send a message to the owner..."
                              value={messageDrafts[restaurant.id] || ''}
                              onChange={(e) =>
                                setMessageDrafts((prev) => ({
                                  ...prev,
                                  [restaurant.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              className="wideBtn"
                              disabled={workingKey === `${restaurant.id}:message`}
                              onClick={() => runAction(restaurant, 'message')}
                            >
                              {workingKey === `${restaurant.id}:message` ? 'Sending...' : 'Send Message'}
                            </button>
                          </div>

                          <div className="pauseComposer">
                            <div className="sectionLabel">Pause Reason</div>
                            <textarea
                              className="textarea small"
                              placeholder="Why are you pausing this account?"
                              value={pauseReasons[restaurant.id] || ''}
                              onChange={(e) =>
                                setPauseReasons((prev) => ({
                                  ...prev,
                                  [restaurant.id]: e.target.value,
                                }))
                              }
                            />
                            <div className="helpText">
                              Saved to the restaurant and shown to the owner when paused.
                            </div>
                            <div className="detailStack">
                              <div className="detailRow">
                                <span>Address</span>
                                <strong>{restaurant.address || '—'}</strong>
                              </div>
                              <div className="detailRow">
                                <span>Owner ID</span>
                                <strong>{restaurant.owner_id || '—'}</strong>
                              </div>
                              <div className="detailRow">
                                <span>Paused At</span>
                                <strong>{formatDateTime(restaurant.paused_at)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="threadPanel">
                          <div className="threadHeader">
                            <div className="sectionLabel">Support Thread</div>
                            {latestMessage ? (
                              <div className="latestMeta">
                                Last: {formatDateTime(latestMessage.created_at)}
                              </div>
                            ) : null}
                          </div>

                          {!restaurant.messages || restaurant.messages.length === 0 ? (
                            <div className="emptyThread">No messages yet.</div>
                          ) : (
                            <div className="threadList">
                              {restaurant.messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`threadBubble ${
                                    msg.sender_role === 'admin' ? 'adminBubble' : 'ownerBubble'
                                  }`}
                                >
                                  <div className="bubbleMeta">
                                    <span>{msg.sender_role === 'admin' ? 'MenuFlow Admin' : 'Owner'}</span>
                                    <small>{formatDateTime(msg.created_at)}</small>
                                  </div>
                                  <p>{msg.message}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <style jsx>{styles}</style>
      </div>
    </main>
  );
}

const styles = `
  .page {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(40, 80, 255, 0.18), transparent 24%),
      radial-gradient(circle at top right, rgba(0, 180, 255, 0.10), transparent 22%),
      linear-gradient(180deg, #05060b 0%, #070911 48%, #090b12 100%);
    color: #ffffff;
    padding: 12px 10px 30px;
  }

  .glow {
    position: absolute;
    border-radius: 999px;
    filter: blur(90px);
    opacity: 0.22;
    pointer-events: none;
  }

  .glowOne {
    width: 260px;
    height: 260px;
    background: #284fff;
    top: -100px;
    left: -100px;
  }

  .glowTwo {
    width: 220px;
    height: 220px;
    background: #00b9ff;
    top: 90px;
    right: -100px;
  }

  .glowThree {
    width: 180px;
    height: 180px;
    background: #6b45ff;
    bottom: 120px;
    left: -90px;
  }

  .shell {
    position: relative;
    z-index: 1;
    max-width: 1460px;
    margin: 0 auto;
    display: grid;
    gap: 12px;
  }

  .hero,
  .panel,
  .loadingCard,
  .errorBanner {
    border-radius: 26px;
    border: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, rgba(16,18,28,0.92) 0%, rgba(8,10,18,0.96) 100%);
    box-shadow: 0 20px 70px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04);
    backdrop-filter: blur(14px);
  }

  .hero {
    padding: 18px;
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 12px;
  }

  .heroLeft {
    display: grid;
    gap: 12px;
  }

  .eyebrow,
  .panelEyebrow,
  .sectionLabel {
    color: #9db2ff;
    font-size: 11px;
    letter-spacing: 0.22em;
    font-weight: 950;
    text-transform: uppercase;
  }

  .hero h1 {
    margin: 0;
    font-size: 48px;
    line-height: 0.92;
    font-weight: 950;
    letter-spacing: -0.06em;
  }

  .hero p {
    margin: 0;
    color: rgba(255,255,255,0.72);
    font-size: 17px;
    line-height: 1.45;
    font-weight: 700;
    max-width: 760px;
  }

  .heroActions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .heroBtn {
    min-height: 48px;
    padding: 0 16px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-weight: 900;
    font-size: 14px;
  }

  .heroBtn.solid {
    background: #ffffff;
    color: #111111;
  }

  .heroBtn.ghost {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.10);
    color: #ffffff;
  }

  .heroRight {
    display: grid;
    gap: 10px;
  }

  .heroMetricRow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .heroMetric {
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    display: grid;
    gap: 8px;
  }

  .heroMetric.large {
    min-height: 118px;
    padding: 16px;
    align-content: center;
  }

  .heroMetric.small {
    min-height: 92px;
    padding: 14px;
    align-content: center;
  }

  .heroMetric span {
    color: rgba(255,255,255,0.56);
    font-size: 10px;
    font-weight: 950;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .heroMetric strong {
    font-size: 30px;
    line-height: 1;
    font-weight: 950;
    letter-spacing: -0.04em;
  }

  .heroMetric small {
    color: rgba(255,255,255,0.44);
    font-size: 12px;
    font-weight: 700;
  }

  .errorBanner,
  .loadingCard {
    padding: 16px;
    font-size: 15px;
    font-weight: 800;
  }

  .errorBanner {
    color: #ffb7b7;
    background: linear-gradient(180deg, rgba(101,18,30,0.48) 0%, rgba(72,10,17,0.65) 100%);
  }

  .statsRow {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .statCard {
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    min-height: 88px;
    padding: 14px;
    display: grid;
    align-content: space-between;
  }

  .statCard span {
    color: rgba(255,255,255,0.54);
    font-size: 10px;
    font-weight: 950;
    letter-spacing: 0.20em;
    text-transform: uppercase;
  }

  .statCard strong {
    font-size: 24px;
    line-height: 1;
    font-weight: 950;
  }

  .statCard.warning {
    box-shadow: inset 0 0 0 1px rgba(255, 92, 92, 0.12);
  }

  .statCard.paused {
    box-shadow: inset 0 0 0 1px rgba(159, 102, 255, 0.12);
  }

  .panel {
    padding: 16px;
  }

  .panelTop {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .panelTop h2 {
    margin: 6px 0 6px;
    font-size: 30px;
    line-height: 0.96;
    font-weight: 950;
    letter-spacing: -0.05em;
  }

  .panelTop p {
    margin: 0;
    color: rgba(255,255,255,0.66);
    font-size: 15px;
    line-height: 1.45;
    font-weight: 700;
  }

  .search {
    width: 100%;
    max-width: 420px;
    min-height: 50px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.03);
    color: #ffffff;
    padding: 0 15px;
    font-size: 14px;
    font-weight: 700;
    outline: none;
  }

  .search::placeholder {
    color: rgba(255,255,255,0.34);
  }

  .emptyState,
  .emptyThread {
    min-height: 120px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.02);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.70);
    font-size: 20px;
    font-weight: 900;
    text-align: center;
  }

  .restaurantGrid {
    display: grid;
    gap: 12px;
  }

  .restaurantCard {
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%);
    padding: 14px;
    display: grid;
    gap: 12px;
  }

  .cardHead {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .brandWrap {
    display: flex;
    gap: 12px;
    align-items: center;
    min-width: 0;
  }

  .brandImage,
  .brandFallback {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .brandFallback {
    background: linear-gradient(135deg, #1b2d68 0%, #0d1736 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 950;
  }

  .brandCopy h3 {
    margin: 0 0 4px;
    font-size: 22px;
    line-height: 1;
    font-weight: 950;
  }

  .brandCopy p {
    margin: 0;
    color: rgba(255,255,255,0.56);
    font-size: 12px;
    line-height: 1.4;
    font-weight: 700;
    word-break: break-word;
  }

  .topRight {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .statusPill,
  .unreadPill {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-weight: 950;
    white-space: nowrap;
  }

  .statusPill.active {
    background: rgba(25,137,83,0.16);
    color: #9df0bc;
    border: 1px solid rgba(85,223,143,0.22);
  }

  .statusPill.past_due {
    background: rgba(164,47,47,0.18);
    color: #ffb3b3;
    border: 1px solid rgba(255,110,110,0.20);
  }

  .statusPill.paused {
    background: rgba(112, 64, 181, 0.20);
    color: #d0b4ff;
    border: 1px solid rgba(168, 122, 255, 0.20);
  }

  .unreadPill {
    background: rgba(255,255,255,0.06);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.08);
  }

  .compactGrid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .miniBox {
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.02);
    padding: 12px;
    display: grid;
    gap: 6px;
  }

  .miniBox span {
    color: rgba(255,255,255,0.52);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-weight: 950;
  }

  .miniBox strong {
    font-size: 16px;
    line-height: 1.35;
    font-weight: 900;
    word-break: break-word;
  }

  .actionRow {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .actionBtn,
  .wideBtn {
    min-height: 42px;
    padding: 0 14px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 900;
  }

  .actionBtn.soft {
    background: rgba(255,255,255,0.08);
    color: #ffffff;
  }

  .actionBtn.danger {
    background: rgba(164,47,47,0.18);
    color: #ffb8b8;
    border: 1px solid rgba(255,110,110,0.16);
  }

  .actionBtn.good {
    background: rgba(35,145,84,0.20);
    color: #adffd0;
    border: 1px solid rgba(85,223,143,0.16);
  }

  .actionBtn.solid,
  .wideBtn {
    background: #ffffff;
    color: #111111;
  }

  .wideBtn {
    width: 100%;
  }

  .expanded {
    padding-top: 8px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: grid;
    gap: 12px;
  }

  .expandedGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .messageComposer,
  .pauseComposer,
  .threadPanel {
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.02);
    padding: 12px;
    display: grid;
    gap: 10px;
  }

  .textarea {
    width: 100%;
    min-height: 110px;
    resize: vertical;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.03);
    color: #ffffff;
    padding: 12px;
    font-size: 14px;
    font-weight: 700;
    outline: none;
  }

  .textarea.small {
    min-height: 88px;
  }

  .textarea::placeholder {
    color: rgba(255,255,255,0.34);
  }

  .helpText,
  .latestMeta {
    color: rgba(255,255,255,0.48);
    font-size: 12px;
    font-weight: 700;
  }

  .detailStack {
    display: grid;
    gap: 8px;
  }

  .detailRow {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
    border-radius: 14px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    padding: 10px 12px;
  }

  .detailRow span {
    color: rgba(255,255,255,0.52);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-weight: 950;
  }

  .detailRow strong {
    font-size: 13px;
    font-weight: 900;
    text-align: right;
    word-break: break-word;
  }

  .threadHeader {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .threadList {
    display: grid;
    gap: 10px;
  }

  .threadBubble {
    border-radius: 16px;
    padding: 12px;
    display: grid;
    gap: 8px;
  }

  .adminBubble {
    background: rgba(60, 89, 255, 0.12);
    border: 1px solid rgba(96, 126, 255, 0.16);
  }

  .ownerBubble {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
  }

  .bubbleMeta {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .bubbleMeta span {
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.10em;
  }

  .bubbleMeta small {
    color: rgba(255,255,255,0.48);
    font-size: 11px;
    font-weight: 700;
  }

  .threadBubble p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: rgba(255,255,255,0.88);
    font-weight: 700;
  }

  @media (max-width: 1180px) {
    .statsRow {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .compactGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .expandedGrid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .panelTop,
    .cardHead {
      display: grid;
    }

    .heroMetricRow,
    .statsRow {
      grid-template-columns: 1fr 1fr;
      display: grid;
    }

    .search {
      max-width: none;
    }

    .topRight {
      justify-content: flex-start;
    }
  }

  @media (max-width: 560px) {
    .hero h1 {
      font-size: 40px;
    }

    .heroActions,
    .heroMetricRow,
    .statsRow,
    .compactGrid,
    .actionRow {
      display: grid;
      grid-template-columns: 1fr;
    }

    .heroBtn,
    .actionBtn {
      width: 100%;
    }
  }
`;