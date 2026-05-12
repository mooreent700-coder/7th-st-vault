'use client';

import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <main className="successPage">
      <section className="successCard">
        <div className="successIcon">✓</div>

        <h1>Payment Successful</h1>

        <p>
          Your checkout was completed. You can go back to your dashboard and keep working on your store.
        </p>

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
        .successPage {
          min-height: 100vh;
          background: #f6f7f8;
          display: grid;
          place-items: center;
          padding: 24px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            'Segoe UI', sans-serif;
        }

        .successCard {
          width: 100%;
          max-width: 560px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 28px;
          padding: 34px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
        }

        .successIcon {
          width: 70px;
          height: 70px;
          border-radius: 999px;
          background: #ecfdf3;
          color: #16a34a;
          display: grid;
          place-items: center;
          margin: 0 auto 20px;
          font-size: 36px;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          color: #111827;
          font-size: 40px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
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

        @media (max-width: 520px) {
          .successCard {
            padding: 26px 20px;
          }

          h1 {
            font-size: 32px;
          }

          .primaryBtn,
          .secondaryBtn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}