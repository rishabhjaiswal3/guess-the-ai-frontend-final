import { Suspense, lazy, useEffect, useState } from 'react';
import { FullPageLoader } from './components/Loader';
import AppBackground from './components/AppBackground';
import Shell from './Shell';
import { warmPrivy, warmPrivyApp } from './warm';

const PrivyApp = lazy(() => import('./PrivyApp'));

export default function App() {
  const [connectPending, setConnectPending] = useState(false);
  const [showPrivyApp, setShowPrivyApp] = useState(() => {
    if (typeof window === 'undefined') return true;
    // Check if we have a token in storage
    const hasToken = Boolean(window.localStorage.getItem('token'));
    if (hasToken) return true;

    // Check if we have a JWT in the URL (query or hash)
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const hasJwtParams = queryParams.has('jwt') || hashParams.has('jwt');

    if (hasJwtParams) return true;

    if (window.location.pathname !== '/') return true;
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Start fetching Privy in the background ASAP so Connect is instant.
    setTimeout(() => {
      void warmPrivy();
      void warmPrivyApp();
    }, 0);
  }, []);

  const isRoot = typeof window !== 'undefined' ? window.location.pathname === '/' : false;

  return (
    <>
      <AppBackground />
      {showPrivyApp ? (
        <Suspense fallback={<FullPageLoader />}>
          <PrivyApp />
        </Suspense>
      ) : (
        <Shell
          onConnect={() => {
            setConnectPending(true);
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem('gta:auto-open-login', '1');
            }
            Promise.all([warmPrivy(), warmPrivyApp()])
              .then(() => setShowPrivyApp(true))
              .finally(() => setConnectPending(false));
          }}
          connecting={connectPending}
        />
      )}
    </>
  );
}
