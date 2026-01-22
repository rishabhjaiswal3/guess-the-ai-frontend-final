import { useCallback, useEffect, useState } from 'react';

import { usePrivy, type User } from '@privy-io/react-auth';
import { login as backendLogin } from '../api/auth';
import LoginModal from './LoginModal';
import { Loader } from './Loader';
import logo2 from '../assets/Logo2.png';
import './WalletConnect.css';

type WalletAccount = {
  type?: string;
  address?: string;
};

const getWalletAddress = (user?: User | null) => {
  if (!user) return '';
  if (user.wallet?.address) {
    return user.wallet.address;
  }
  const linkedWallet = (user.linkedAccounts as WalletAccount[] | undefined)?.find(
    (account: WalletAccount) =>
      account.type === 'wallet' && Boolean(account.address),
  );
  return linkedWallet?.address ?? '';
};

const WalletConnect = () => {
  const { ready, authenticated, user } = usePrivy();
  // const { isIframeSession, isWalletSession, hasToken } = useSessionSource();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debug: Log component mount and OAuth state on EVERY render
  useEffect(() => {
    const isOAuthCallback =
      (typeof window !== 'undefined') &&
      (window.location.search.includes('privy_oauth_state') || window.location.hash.includes('privy_oauth_state'));

    console.log('[WalletConnect] ===== RENDER =====', {
      ready,
      authenticated,
      hasUser: !!user,
      userId: user?.id,
      isOAuthCallback,
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      searchParams: typeof window !== 'undefined' ? window.location.search : 'N/A',
      hashParams: typeof window !== 'undefined' ? window.location.hash : 'N/A',
    });
  });

  const [localToken, setLocalToken] = useState<string | null>(localStorage.getItem('token'));

  // Listen for token changes dispatched from auth.ts or other components
  useEffect(() => {
    const handleTokenChange = (e: CustomEvent<string>) => {
      setLocalToken(e.detail);
      // Close modal if we got a token
      if (e.detail) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('presence:token-change', handleTokenChange as EventListener);
    return () => {
      window.removeEventListener('presence:token-change', handleTokenChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Log entry into effect
    console.log('[WalletConnect] ===== AUTO-OPEN EFFECT =====', {
      ready,
      authenticated,
      localToken: !!localToken,
      flag: window.sessionStorage.getItem('gta:auto-open-login'),
      url: window.location.href
    });

    if (authenticated || localToken) {
      if (window.sessionStorage.getItem('gta:auto-open-login')) {
        console.log('[WalletConnect] Already logged in, clearing auto-open flag');
        window.sessionStorage.removeItem('gta:auto-open-login');
      }
      return;
    }
    const shouldAutoOpen = window.sessionStorage.getItem('gta:auto-open-login') === '1';

    if (!shouldAutoOpen) {
      console.log('[WalletConnect] No auto-open flag, skipping modal auto-open');
      return;
    }

    if (!ready) {
      console.log('[WalletConnect] Auto-open pending: Privy not ready');
      return;
    }

    console.log('[WalletConnect] ✅ Triggering Auto-Open Modal');
    window.sessionStorage.removeItem('gta:auto-open-login');
    setIsModalOpen(true);
  }, [ready, authenticated, localToken]);

  // Retry logic state
  const [retryCount, setRetryCount] = useState(0);

  const loginUser = useCallback(async () => {
    // Debug logs to trace wallet-based login flow
    // eslint-disable-next-line no-console
    console.log('[WalletConnect] ===== loginUser() CALLED =====', {
      authenticated,
      hasUser: !!user,
      userId: user?.id,
      retryCount,
      hasLocalToken: !!localStorage.getItem('token'),
      timestamp: new Date().toISOString()
    });

    if (!authenticated) {
      // eslint-disable-next-line no-console
      console.log('[WalletConnect] ❌ Skipping backend login – not authenticated');
      return;
    }

    const address = getWalletAddress(user);


    // --- DETAILED MEMBER LOGGING ---
    const activeWallet = user?.wallet;
    const emailObj = user?.email;
    const linked = user?.linkedAccounts || [];

    console.log('[WalletConnect] === USER PROFILE DUMP ===');
    console.log('[WalletConnect] User ID:', user?.id);
    console.log('[WalletConnect] Active Wallet:', {
      address: activeWallet?.address || 'None',
      connectorType: activeWallet?.connectorType || 'Unknown', // e.g. 'injected', 'embedded', 'wallet_connect'
      walletClientType: activeWallet?.walletClientType || 'Unknown', // e.g. 'metamask', 'phantom'
      chainId: activeWallet?.chainId
    });
    console.log('[WalletConnect] Email:', emailObj?.address || 'None');
    console.log('[WalletConnect] Linked Accounts:', linked.map(acc => ({
      type: acc.type,
      // dynamically grab relevant identifier based on type
      identifier: (acc as any).address || (acc as any).email || (acc as any).username || (acc as any).subject || 'N/A',
      verifiedAt: acc.verifiedAt
    })));
    console.log('[WalletConnect] =========================');

    // eslint-disable-next-line no-console
    console.log('[WalletConnect] Resolved wallet address from Privy user', {
      address,
      linkedAccountsCount: user?.linkedAccounts?.length ?? 0,
      linkedAccountTypes: user?.linkedAccounts?.map(a => a.type) ?? [],
    });

    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');

    if (!address && !token) {
      // If we are authenticated but have no address AND no token,
      // it might be an embedded wallet provisioning delay.
      console.warn(
        '[WalletConnect] No wallet address found on Privy user and no local token. Waiting for wallet creation...',
        {
          id: user?.id,
          linkedAccounts: user?.linkedAccounts,
          wallet: user?.wallet,
          typesFound: user?.linkedAccounts?.map(a => a.type)
        }
      );
      // Reduced retries to 5 before falling back to email-only login
      if (retryCount < 5) {
        console.log(`[WalletConnect] Scheduling retry #${retryCount + 1} in 1000ms...`);
        setTimeout(() => setRetryCount(c => c + 1), 1000);
        return; // Return here to wait for the next retry
      } else {
        console.warn('[WalletConnect] FINAL FAILURE: Could not find wallet address after 5 seconds. Proceeding to fallback login with Email/ID only.');
        // We DO NOT return here; we fall through to the login logic below with address=""
      }
    }

    console.log('[WalletConnect] Checking existing token before calling backend login', {
      hasTokenInLocalStorage: !!token,
      tokenPreview: token ? token.slice(0, 10) : 'null'
    });

    if (!token) {
      // eslint-disable-next-line no-console
      console.log('[WalletConnect] No existing JWT token; calling backend /user/login', {
        walletAddress: address || '(fallback: empty)',
        email: emailObj?.address,
      });

      // --- CONSTRUCT METADATA ---
      const discordAccount = linked.find(a => a.type === 'discord_oauth');
      const discordUsername = (discordAccount as any)?.username || (discordAccount as any)?.email || (discordAccount as any)?.subject;

      let loginType = activeWallet?.walletClientType || 'unknown';
      if (loginType === 'privy') {
        if (linked.some(a => a.type === 'discord_oauth')) loginType = 'discord';
        else if (linked.some(a => a.type === 'google_oauth')) loginType = 'google';
        else if (linked.some(a => a.type === 'email')) loginType = 'email';
      }

      // Prepare payload
      const payload: any = {
        walletAddress: address || '', // Send empty string if no address found
        privyMetaData: {
          address: address || '',
          discord: discordUsername,
          email: emailObj?.address || '',
          type: loginType,
          privyUserId: user?.id || ''
        }
      };

      try {
        const res = await backendLogin(payload);
        // eslint-disable-next-line no-console
        console.log('[WalletConnect] Backend login response', res);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[WalletConnect] Backend login threw an error', err);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('[WalletConnect] JWT token already present; skipping backend login', {
        tokenPreview: token.slice(0, 12),
      });
    }
  }, [authenticated, user, retryCount]);

  useEffect(() => {
    // eslint-disable-next-line no-con  useEffect(() => {
    console.log('[WalletConnect] ===== AUTH STATE EFFECT =====', {
      authenticated,
      ready,
      hasUser: !!user,
      localToken: !!localToken,
      retryCount,
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });

    // Check for OAuth callback param
    const isOAuthCallback =
      (typeof window !== 'undefined') &&
      (window.location.search.includes('privy_oauth_state') || window.location.hash.includes('privy_oauth_state'));

    if (isOAuthCallback) {
      console.log('[WalletConnect] 🔵 OAuth callback detected in URL');
    }

    if (authenticated) {
      console.log('[WalletConnect] ✅ User is authenticated, calling loginUser()');
      loginUser();
    } else if (isOAuthCallback && ready) {
      // If we are back from OAuth but not authenticated yet, we simply wait for Privy to flip 'authenticated' to true.
      // But we log it to be sure.
      console.log('[WalletConnect] ⏳ OAuth callback present, waiting for Privy authentication...');
    } else if (!localToken) {
      console.log('[WalletConnect] ❌ Not authenticated, no local token');
      // If not authenticated and no local token, we might want to clear session
      // console.log('Not authenticated and no local token – clearing session storage');
      // clearSessionStorage();
    }
  }, [authenticated, loginUser, localToken, retryCount, ready]);

  // Dedicated OAuth callback handler - triggers login immediately when OAuth completes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isOAuthCallback =
      window.location.search.includes('privy_oauth_state') ||
      window.location.hash.includes('privy_oauth_state');

    console.log('[WalletConnect] ===== OAUTH DEDICATED EFFECT =====', {
      isOAuthCallback,
      ready,
      authenticated,
      localToken: !!localToken,
      url: window.location.href
    });

    if (!isOAuthCallback) {
      console.log('[WalletConnect] No OAuth callback, skipping dedicated handler');
      return;
    }

    // If we detect OAuth callback and Privy is authenticated, ensure login is triggered
    if (ready && authenticated && !localToken) {
      console.log('[WalletConnect] 🚀 OAuth callback - forcing immediate login attempt');
      loginUser();
    } else {
      console.log('[WalletConnect] OAuth callback detected but conditions not met:', {
        ready,
        authenticated,
        hasLocalToken: !!localToken
      });
    }
  }, [ready, authenticated, localToken, loginUser]);

  const shouldHideConnect = authenticated || !!localToken;

  // Log why we are showing/hiding the button
  if (authenticated || !!localToken) {
    console.log('[WalletConnect] Render decision:', {
      shouldHideConnect,
      reason: { authenticated, localToken: !!localToken }
    });
  }

  return (
    <>
      <div
        className="wallet-connect-wrap"
        style={{ display: shouldHideConnect ? 'none' : 'block', minWidth: "300px" }}
      >
        <button
          type="button"
          className="connect-wallet-button"
          onClick={() => setIsModalOpen(true)}
          style={{ minWidth: "260px" }}
          disabled={!ready}
        >
          {ready ? 'Connect' : <Loader size="sm" label="Loading" />}
        </button>
      </div>
      <LoginModal
        open={isModalOpen && ready && !shouldHideConnect}
        onClose={() => setIsModalOpen(false)}
        logoSrc={logo2}
      />
    </>
  );
};

export default WalletConnect;
