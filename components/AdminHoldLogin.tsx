'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  children: React.ReactNode;
};

export default function AdminHoldLogin({ children }: Props) {
  const router = useRouter();
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');

  const ADMIN_PASSWORD = 'Bitch5562';

  const startHold = () => {
    clearHold();
    holdTimerRef.current = setTimeout(() => {
      setShowLogin(true);
    }, 2000);
  };

  const clearHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setShowLogin(false);
      setPassword('');
      router.push('/dashboard/admin');
      return;
    }

    alert('Wrong password');
  };

  return (
    <>
      <div
        onMouseDown={startHold}
        onMouseUp={clearHold}
        onMouseLeave={clearHold}
        onTouchStart={startHold}
        onTouchEnd={clearHold}
        onTouchCancel={clearHold}
        style={{ display: 'inline-flex' }}
      >
        {children}
      </div>

      {showLogin ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#ffffff',
              borderRadius: 20,
              padding: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: 24,
                fontWeight: 800,
                color: '#111111',
              }}
            >
              Admin Login
            </h3>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 12,
                border: '1px solid #d0d0d0',
                padding: '0 14px',
                fontSize: 16,
                outline: 'none',
                marginBottom: 12,
              }}
            />

            <button
              type="button"
              onClick={handleLogin}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 12,
                border: 'none',
                background: '#111111',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              Enter
            </button>

            <button
              type="button"
              onClick={() => {
                setShowLogin(false);
                setPassword('');
              }}
              style={{
                width: '100%',
                height: 46,
                borderRadius: 12,
                border: '1px solid #d0d0d0',
                background: '#ffffff',
                color: '#111111',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}