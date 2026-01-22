import { ReactNode, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PrivyProvider, type PrivyClientConfig } from '@privy-io/react-auth';
import PresenceProvider from './providers/PresenceProvider';

import BottomNav from './components/BottomNav';
import TopBrandBar from './components/TopBrandBar';
import Home from './screens/home/home';
import Leaderboard from './screens/leaderboard/leaderboard';
import Profile from './screens/profile/profile';
import GamePage from './screens/game/GamePage';

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: 'dark',
    walletChainType: 'ethereum-only',
  },
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },
  loginMethods: ['email', 'sms', 'wallet', 'google', 'discord'],
  intl: {
    defaultCountry: 'US',
  },
};

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  // useIframeBootstrap();
  const noPad = location.pathname === '/';

  // Debug logging
  useEffect(() => {
    console.log('[Layout] ===== LAYOUT RENDER =====', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      fullUrl: window.location.href,
      noPad,
      timestamp: new Date().toISOString()
    });
  });

  // Experimental: try to remove trailing / from hash at root if user finds it ugly 'extra'
  useEffect(() => {
    // Don't clean up URL if we have OAuth callback parameters
    const hasOAuthParams =
      window.location.search.includes('privy_oauth_state') ||
      window.location.search.includes('jwt') ||
      window.location.hash.includes('privy_oauth_state') ||
      window.location.hash.includes('jwt');

    if (hasOAuthParams) {
      console.log('[Layout] Preserving URL with OAuth/JWT parameters:', window.location.href);
      return;
    }

    if (window.location.hash === '#/') {
      // visual cleanup: replace #/ with just # or nothing if possible, keeping functionality
      // This removes the hash from the address bar visual, but HashRouter can still work if it re-reads it?
      // Actually, removing it makes HashRouter think we are at root.
      window.history.replaceState(null, '', ' ');
    }
  }, [location]);

  return (
    <div className="app-layout">
      <TopBrandBar />
      <main className={`main-content${noPad ? ' no-pad' : ''}`}>{children}</main>
      <BottomNav />
    </div>
  );
};

export default function PrivyApp() {
  if (!privyAppId) {
    throw new Error('Missing VITE_PRIVY_APP_ID environment variable');
  }

  return (
    <PrivyProvider appId={privyAppId} config={privyConfig}>
      <PresenceProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={(
                <Layout>
                  <Home />
                </Layout>
              )}
            />
            <Route
              path="/leaderboard"
              element={(
                <Layout>
                  <Leaderboard />
                </Layout>
              )}
            />
            <Route
              path="/profile"
              element={(
                <Layout>
                  <Profile />
                </Layout>
              )}
            />
            <Route
              path="/game"
              element={(
                <Layout>
                  <GamePage />
                </Layout>
              )}
            />
          </Routes>
        </Router>
      </PresenceProvider>
    </PrivyProvider>
  );
}
