'use client';

import Link from 'next/link';

export default function CustomersPage() {
  return (
    <main className="page">
      <section className="card">
        <Link href="/dashboard/owner" className="back">← Back to Dashboard</Link>
        <h1>Customer CRM</h1>
        <p>Track repeat customers, order history, favorites, loyalty points, and VIP status.</p>

        <div className="grid">
          <div className="box"><span>Total Customers</span><strong>0</strong></div>
          <div className="box"><span>Repeat Customers</span><strong>0</strong></div>
          <div className="box"><span>VIP Customers</span><strong>0</strong></div>
        </div>

        <div className="empty">No customer data yet. Customers will appear here after orders are placed.</div>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
.page{min-height:100vh;background:#f4f6fa;padding:24px;font-family:Inter,sans-serif;color:#111827}
.card{max-width:1100px;margin:auto;background:white;border:1px solid #dfe5ee;border-radius:28px;padding:28px;box-shadow:0 20px 50px rgba(15,23,42,.08)}
.back{color:#111827;font-weight:900;text-decoration:none}
h1{font-size:48px;margin:24px 0 10px;font-weight:950}
p{font-size:18px;color:#64748b;font-weight:750;line-height:1.5}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:26px}
.box{border:1px solid #dfe5ee;border-radius:22px;padding:22px;background:#f8fafc}
.box span{display:block;color:#64748b;font-weight:850}
.box strong{display:block;font-size:38px;margin-top:8px}
.empty{margin-top:26px;border:2px dashed #dfe5ee;border-radius:24px;padding:50px;text-align:center;color:#64748b;font-weight:900}
@media(max-width:700px){.grid{grid-template-columns:1fr}h1{font-size:38px}}
`;
