import { Suspense, lazy, useEffect, useState } from 'react';
import { FullPageLoader } from './components/Loader';
import Shell from './Shell';
import { warmPrivy, warmPrivyApp } from './warm';

const PrivyApp = lazy(() => import('./PrivyApp'));

export default function App() {
  const [showPrivyApp, setShowPrivyApp] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (window.location.pathname !== '/') return true;
    return Boolean(window.localStorage.getItem('token'));
  });
  const [warming, setWarming] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const warm = async () => {
      try {
        await Promise.all([warmPrivy(), warmPrivyApp()]);
      } finally {
        setWarming(false);
      }
    };

    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
        .requestIdleCallback(() => {
          void warm();
        }, { timeout: 1500 });
    } else {
      setTimeout(() => void warm(), 0);
    }
  }, []);

  if (!showPrivyApp) {
    return (
      <Shell
        warming={warming}
        onConnect={() => {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('gta:auto-open-login', '1');
          }
          void warmPrivy();
          void warmPrivyApp();
          setShowPrivyApp(true);
        }}
      />
    );
  }

  return (
    <Suspense fallback={<FullPageLoader />}>
      <PrivyApp />
    </Suspense>
  );
}
