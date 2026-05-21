'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToDropCampaigns() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/owner/campaigns');
  }, [router]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#05060c',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 900
    }}>
      Loading Drop Campaigns...
    </main>
  );
}
