'use client';

import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <main className="page">
      <section className="card">
        <Link href="/dashboard/owner" className="back">← Back to Dashboard</Link>
        <h1>Analytics</h1>
        <p>Track sales, top items, busiest hours, repeat customers, average ticket, and conversion data.</p>

        <div className="grid">
          <div className="box"><span>Total Sales</span><strong>$0.00</strong></div>
          <div className="box"><span>Average Ticket</span><strong>$0.00</strong></div>
          <div className="box"><span>Conversion Rate</span><strong>0%</strong></div>
          <div className="box"><span>Top Item</span><strong>None</strong></div>
        </div>

        <div className="chart">Analytics will populate when orders come in.</div>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
.page{min-height:100vh;background:#f4f6fa;padding:24px;font-family:Inter,sans-serif;color:#111827}
.card{max-width:1200px;margin:auto;background:white;border:1px solid #dfe5ee;border-radius:28px;padding:28px;box-shadow:0 20px 50px rgba(15,23,42,.08)}
.back{color:#111827;font-weight:900;text-decoration:none}
h1{font-size:52px;margin:24px 0 10px;font-weight:950}
p{font-size:18px;color:#64748b;font-weight:750}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:28px}
.box{border:1px solid #dfe5ee;border-radius:22px;padding:22px;background:#f8fafc}
.box span{display:block;color:#64748b;font-weight:850}
.box strong{display:block;font-size:30px;margin-top:8px}
.chart{margin-top:28px;min-height:320px;border:2px dashed #dfe5ee;border-radius:24px;display:grid;place-items:center;color:#64748b;font-weight:900}
@media(max-width:900px){.grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.grid{grid-template-columns:1fr}h1{font-size:40px}}
`;
