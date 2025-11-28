import { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PrivyProvider, type PrivyClientConfig } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PresenceProvider from './providers/PresenceProvider';
import useIframeBootstrap from './hooks/useIframeBootstrap';
// Components
import Home from './screens/home/home';
import Leaderboard from './screens/leaderboard/leaderboard';
import Profile from './screens/profile/profile';
import GamePage from './screens/game/GamePage';
import BottomNav from './components/BottomNav';
import TopBrandBar from './components/TopBrandBar';

const queryClient = new QueryClient();

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: 'dark',
  },
};

// Layout component to wrap all pages with BottomNav
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
      <main className={`main-content${noPad ? ' no-pad' : ''}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

function App() {
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
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export default App;
