'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const STORE_LINK =
  typeof window !== 'undefined'
    ? `${window.location.origin}/store/dadfood`
    : '';

const templates = [
  {
    title: 'Lunch Special',
    message: `Lunch special today 🔥 Order direct here: ${STORE_LINK}`,
  },
  {
    title: '20% Off Today',
    message: `20% OFF today only. Tap to order direct: ${STORE_LINK}`,
  },
  {
    title: 'Late Night Promo',
    message: `Late night orders are open 🌙 Order here: ${STORE_LINK}`,
  },
  {
    title: 'New Item Alert',
    message: `New item just dropped 🔥 Check it out here: ${STORE_LINK}`,
  },
  {
    title: 'We Miss You',
    message: `We miss you 👋 Come back and order direct here: ${STORE_LINK}`,
  },
  {
    title: 'Birthday Deal',
    message: `Birthday reward ready 🎉 Claim it here: ${STORE_LINK}`,
  },
];

export default function CampaignsPage() {
  const [selected, setSelected] = useState(templates[0]);
  const [message, setMessage] = useState(templates[0].message);
  const [copied, setCopied] = useState(false);

  const textLength = useMemo(() => message.length, [message]);

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <main className="page">
      <section className="card">
        <Link href="/dashboard/owner" className="back">← Back to Dashboard</Link>

        <h1>SMS Campaigns</h1>
        <p>Pick a ready-made campaign, edit the message, and send customers straight to your ORDA store link.</p>

        <div className="layout">
          <div className="templates">
            {templates.map((item) => (
              <button
                key={item.title}
                className={selected.title === item.title ? 'template active' : 'template'}
                onClick={() => {
                  setSelected(item);
                  setMessage(item.message);
                }}
              >
                <strong>{item.title}</strong>
                <span>{item.message}</span>
              </button>
            ))}
          </div>

          <div className="composer">
            <label>Campaign Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} />

            <div className="meta">
              <span>{textLength} characters</span>
              <span>Store link included</span>
            </div>

            <button className="primary" onClick={copyMessage}>
              {copied ? 'Copied Message ✓' : 'Copy Campaign Message'}
            </button>

            <a className="sms" href={`sms:?&body=${encodeURIComponent(message)}`}>
              Open Text Message
            </a>
          </div>
        </div>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
.page{min-height:100vh;background:#0b0c10;padding:24px;font-family:Inter,sans-serif;color:white}
.card{max-width:1200px;margin:auto;background:#111217;border:1px solid #252936;border-radius:28px;padding:28px}
.back{color:white;font-weight:900;text-decoration:none}
h1{font-size:52px;margin:24px 0 10px;font-weight:950}
p{font-size:18px;color:#a5adbd;font-weight:750;line-height:1.5}
.layout{display:grid;grid-template-columns:1fr 1.1fr;gap:22px;margin-top:28px}
.templates{display:grid;gap:14px}
.template{text-align:left;border:1px solid #2b3040;background:#0e1015;color:white;border-radius:20px;padding:18px;cursor:pointer}
.template.active{border-color:#f5c542;box-shadow:0 0 0 2px rgba(245,197,66,.2)}
.template strong{display:block;font-size:20px}
.template span{display:block;margin-top:8px;color:#a5adbd;font-weight:700;line-height:1.4}
.composer{display:grid;gap:14px}
label{font-weight:950;font-size:18px}
textarea{min-height:260px;border-radius:20px;border:1px solid #2b3040;background:#0e1015;color:white;padding:18px;font-size:18px}
.meta{display:flex;justify-content:space-between;color:#a5adbd;font-weight:800}
.primary,.sms{height:62px;border:0;border-radius:18px;background:#f5c542;color:#111827;font-size:20px;font-weight:950;display:grid;place-items:center;text-decoration:none}
.sms{background:white}
@media(max-width:800px){.layout{grid-template-columns:1fr}h1{font-size:40px}}
`;
