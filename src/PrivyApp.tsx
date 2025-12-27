import { ReactNode, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PrivyProvider, type PrivyClientConfig } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PresenceProvider from './providers/PresenceProvider';
import useIframeBootstrap from './hooks/useIframeBootstrap';
import BottomNav from './components/BottomNav';
import TopBrandBar from './components/TopBrandBar';

const Home = lazy(() => import('./screens/home/home'));
const Leaderboard = lazy(() => import('./screens/leaderboard/leaderboard'));
const Profile = lazy(() => import('./screens/profile/profile'));
const GamePage = lazy(() => import('./screens/game/GamePage'));

const queryClient = new QueryClient();

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: 'dark',
    walletChainType: 'ethereum-only',
  },
  embeddedWallets: {
    createOnLogin: 'off',
  },
  loginMethods: ['email', 'sms', 'wallet', 'google'],
  intl: {
    defaultCountry: 'US',
  },
};

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  useIframeBootstrap();
  const noPad = location.pathname === '/';
  return (
    <div className="app-layout">
      <TopBrandBar />
      <main className={`main-content${noPad ? ' no-pad' : ''}`}>{children}</main>
      <BottomNav />
    </div>
  );
};

const PageFallback = () => (
  <div className="page-fallback" role="status" aria-live="polite">
    Loading...
  </div>
);

export default function PrivyApp() {
  if (!privyAppId) {
    throw new Error('Missing VITE_PRIVY_APP_ID environment variable');
  }

  return (
    <PrivyProvider appId={privyAppId} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <PresenceProvider>
          <Router>
            <Routes>
              <Route
                path="/"
                element={(
                  <Layout>
                    <Suspense fallback={<PageFallback />}>
                      <Home />
                    </Suspense>
                  </Layout>
                )}
              />
              <Route
                path="/leaderboard"
                element={(
                  <Layout>
                    <Suspense fallback={<PageFallback />}>
                      <Leaderboard />
                    </Suspense>
                  </Layout>
                )}
              />
              <Route
                path="/profile"
                element={(
                  <Layout>
                    <Suspense fallback={<PageFallback />}>
                      <Profile />
                    </Suspense>
                  </Layout>
                )}
              />
              <Route
                path="/game"
                element={(
                  <Layout>
                    <Suspense fallback={<PageFallback />}>
                      <GamePage />
                    </Suspense>
                  </Layout>
                )}
              />
            </Routes>
          </Router>
        </PresenceProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

