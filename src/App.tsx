import { Suspense, lazy, useEffect, useState } from 'react';

const PrivyApp = lazy(() => import(/* @vite-ignore */ './PrivyApp'));

const AppFallback = () => (
  <div className="page-fallback" role="status" aria-live="polite">
   .
  </div>
);

export default function App() {
  const [boot, setBoot] = useState(false);

  useEffect(() => {
    const load = () => setBoot(true);
    if (typeof window === 'undefined') return;
    setTimeout(load, 0);
  }, []);

  if (!boot) return <AppFallback />;

  return (
    <Suspense fallback={<AppFallback />}>
      <PrivyApp />
    </Suspense>
  );
}
