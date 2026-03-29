'use client';

export default function OwnerDashboardPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '24px', background: '#f6f4ef' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '12px', color: '#172033' }}>
          MenuFlow Dashboard
        </h1>
        <p style={{ fontSize: '18px', color: '#5b6475', marginBottom: '24px' }}>
          Dashboard reset is working. Next step is the full redesign.
        </p>

        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px' }}>
            <h2 style={{ margin: 0, color: '#172033' }}>Today&apos;s Sales</h2>
            <p style={{ fontSize: '32px', fontWeight: 700, marginTop: '12px' }}>$0.00</p>
          </div>

          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px' }}>
            <h2 style={{ margin: 0, color: '#172033' }}>Orders</h2>
            <p style={{ fontSize: '32px', fontWeight: 700, marginTop: '12px' }}>0</p>
          </div>

          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px' }}>
            <h2 style={{ margin: 0, color: '#172033' }}>Menu Items</h2>
            <p style={{ fontSize: '32px', fontWeight: 700, marginTop: '12px' }}>0</p>
          </div>

          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px' }}>
            <h2 style={{ margin: 0, color: '#172033' }}>Stripe</h2>
            <p style={{ fontSize: '24px', fontWeight: 700, marginTop: '12px' }}>Not Connected</p>
          </div>
        </div>
      </div>
    </main>
  );
}
