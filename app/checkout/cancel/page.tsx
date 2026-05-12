'use client';

import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <main className="cancelPage">
      <section className="cancelCard">
        <div className="cancelIcon">×</div>

        <h1>Checkout Cancelled</h1>

        <p>Your payment was not completed. You can go back and try again.</p>

        <div className="actions">
          <Link href="/dashboard/owner" className="primaryBtn">
            Go to Dashboard
          </Link>

          <Link href="/dashboard/owner/builder" className="secondaryBtn">
            Open Builder
          </Link>
        </div>
      </section>

      <style jsx>{`
        .cancelPage {
          min-height: 100vh;
          background: #f6f7f8;
          display: grid;
          place-items: center;
          padding: 24px;
        }

        .cancelCard {
          width: 100%;
          max-width: 560px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 28px;
          padding: 34px;
          text-align: center;
        }

        .cancelIcon {
          width: 70px;
          height: 70px;
          border-radius: 999px;
          background: #fff1f2;
          color: #e11d48;
          display: grid;
          place-items: center;
          margin: 0 auto 20px;
          font-size: 42px;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          color: #111827;
          font-size: 40px;
          font-weight: 900;
        }

        p {
          margin: 16px auto 0;
          max-width: 430px;
          color: #64748b;
          font-size: 17px;
          line-height: 1.6;
          font-weight: 600;
        }

        .actions {
          margin-top: 26px;
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .primaryBtn,
        .secondaryBtn {
          min-height: 50px;
          border-radius: 14px;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 15px;
          font-weight: 900;
        }

        .primaryBtn {
          background: #111827;
          color: #ffffff;
        }

        .secondaryBtn {
          background: #ffffff;
          color: #111827;
          border: 1px solid #dbe2ea;
        }
      `}</style>
    </main>
  );
}