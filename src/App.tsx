import { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, zora } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import networkConfig from './utils/networkConfig';
import PresenceProvider from './providers/PresenceProvider';
import useIframeBootstrap from './hooks/useIframeBootstrap';
// Components
import Home from './screens/home/home';
import Leaderboard from './screens/leaderboard/leaderboard';
import Profile from './screens/profile/profile';
import GamePage from './screens/game/GamePage';
import BottomNav from './components/BottomNav';
import TopBrandBar from './components/TopBrandBar';

// 0G Galileo Testnet configuration
const ogGalileoTestnet = networkConfig;

// Configure chains & providers
const config = getDefaultConfig({
  appName: 'Guess The AI',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [ogGalileoTestnet, mainnet, polygon, optimism, arbitrum, base, zora],
  ssr: false, // If your app uses server-side rendering, set this to true
});

// Create a client
const queryClient = new QueryClient();

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
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#7b3fe4',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <PresenceProvider>
          <Router>
            <Routes>
              <Route path="/" element={
                <Layout>
                  <Home />
                </Layout>
              } />
              <Route path="/leaderboard" element={
                <Layout>
                  <Leaderboard />
                </Layout>
              } />
              <Route path="/profile" element={
                <Layout>
                  <Profile />
                </Layout>
              } />
              <Route path="/game" element={
                <Layout>
                  <GamePage />
                </Layout>
              } />
            </Routes>
          </Router>
          </PresenceProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
