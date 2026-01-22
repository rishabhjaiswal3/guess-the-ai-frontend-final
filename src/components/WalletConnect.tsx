import { useCallback, useEffect, useState } from 'react';

import { usePrivy, type User } from '@privy-io/react-auth';
import { login as backendLogin } from '../api/auth';
import useSessionSource from '../hooks/useSessionSource';
import { clearSessionStorage } from '../utils/session';
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
  const { isIframeSession, isWalletSession, hasToken } = useSessionSource();
  const [isModalOpen, setIsModalOpen] = useState(false);


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
    if (authenticated || hasToken || localToken || isIframeSession || isWalletSession) {
      window.sessionStorage.removeItem('gta:auto-open-login');
      return;
    }
    const shouldAutoOpen = window.sessionStorage.getItem('gta:auto-open-login') === '1';
    if (!shouldAutoOpen) return;
    if (!ready) return;
    window.sessionStorage.removeItem('gta:auto-open-login');
    setIsModalOpen(true);
  }, [ready, authenticated, hasToken, localToken, isIframeSession, isWalletSession]);

  const loginUser = useCallback(async () => {
    // Debug logs to trace wallet-based login flow
    // eslint-disable-next-line no-console
    console.log('[WalletConnect] loginUser invoked', {
      authenticated,
      hasUser: !!user,
    });
    if (!authenticated) {
      // eslint-disable-next-line no-console
      console.log('[WalletConnect] Skipping backend login – not authenticated');
      return;
    }

    const address = getWalletAddress(user);
    // eslint-disable-next-line no-console
    console.log('[WalletConnect] Resolved wallet address from Privy user', {
      address,
      linkedAccountsCount: user?.linkedAccounts?.length ?? 0,
    });

    if (!address) {
      // eslint-disable-next-line no-console
      console.warn(
        '[WalletConnect] No wallet address found on Privy user; backend login will be skipped',
        user,
      );
      return;
    }

    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      // eslint-disable-next-line no-console
      console.log('[WalletConnect] No existing JWT token; calling backend /user/login', {
        walletAddress: address,
      });
      try {
        const res = await backendLogin({ walletAddress: address });
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
  }, [authenticated, user]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('Auth / iframe state changed', {
      authenticated,
      isIframeSession,
      isWalletSession,
      hasToken,
    });

    if (authenticated) {
      loginUser();
    } else if (!isIframeSession && !isWalletSession && !hasToken) {
      // eslint-disable-next-line no-console
      console.log('Not authenticated and not iframe session – clearing session storage');
      clearSessionStorage();
    }
  }, [authenticated, loginUser, isIframeSession, isWalletSession, hasToken]);

  const shouldHideConnect = authenticated || hasToken || !!localToken || isIframeSession || isWalletSession;

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
