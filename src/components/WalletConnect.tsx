import { useCallback, useEffect } from 'react';
import { usePrivy, type PrivyUser } from '@privy-io/react-auth';
import { login as backendLogin } from '../api/auth';
import useSessionSource from '../hooks/useSessionSource';
import { clearSessionStorage } from '../utils/session';
import './WalletConnect.css';

type WalletAccount = {
  type?: string;
  address?: string;
};

const getWalletAddress = (user?: PrivyUser | null) => {
  if (!user) return '';
  if (user.wallet?.address) {
    return user.wallet.address;
  }
  const linkedWallet = user.linkedAccounts?.find(
    (account) => (account as WalletAccount).type === 'wallet' && Boolean((account as WalletAccount).address),
  ) as WalletAccount | undefined;
  return linkedWallet?.address ?? '';
};

const WalletConnect = () => {
  const { ready, authenticated, login: openPrivyLogin, user } = usePrivy();
  const { isIframeSession } = useSessionSource();

  const loginUser = useCallback(async () => {
    if (!authenticated) return;
    const address = getWalletAddress(user);
    if (!address) return;
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      await backendLogin(address);
    }
  }, [authenticated, user]);

  useEffect(() => {
    if (authenticated) {
      loginUser();
    } else if (!isIframeSession) {
      clearSessionStorage();
    }
  }, [authenticated, loginUser, isIframeSession]);

  const shouldHideConnect = authenticated || isIframeSession;

  return (
    <div className="wallet-connect-wrap" style={{ display: shouldHideConnect ? 'none' : 'block' }}>
      <button
        type="button"
        className="connect-wallet-button"
        onClick={() => openPrivyLogin()}
        disabled={!ready}
      >
        {ready ? 'Connect' : 'Loading...'}
      </button>
    </div>
  );
};

export default WalletConnect;
