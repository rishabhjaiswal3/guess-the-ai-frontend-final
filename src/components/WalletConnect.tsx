import { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain } from 'wagmi';
import { login } from '../api/auth';
import useSessionSource from '../hooks/useSessionSource';
import { clearSessionStorage } from '../utils/session';
import './WalletConnect.css';

const WalletConnect = () => {
  const { isConnected, address } = useAccount();
  const { switchChain } = useSwitchChain();
  const { isIframeSession } = useSessionSource();

  const loginUser = async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token && address) {
      await login(address);
    }
  };

  // Store wallet address in local storage when connected
  useEffect(() => {
    if (isConnected && address) {
      loginUser();
    } else if (!isIframeSession) {
      clearSessionStorage();
    }
  }, [isConnected, address, isIframeSession]);

  useEffect(() => {
    const switchToOgGalileo = async () => {
      const chainId = Number(import.meta.env.VITE_CHAIN_ID);
      if (isConnected) {
        try {
          if (Number.isFinite(chainId)) {
            await switchChain({ chainId });
          }
        } catch (error) {
          console.error('Failed to switch to 0G Galileo Testnet:', error);
        }
      }
    };

    switchToOgGalileo();
  }, [isConnected, switchChain]);

  const shouldHideConnect = isConnected || isIframeSession;

  return (
    <div className="wallet-connect-wrap" style={{display:shouldHideConnect?'none':'block'}}>
      <ConnectButton 
        label="Connect Wallet"
        showBalance={false}
        accountStatus="none"
        chainStatus="none"
        showNetworkModal={false}
      >
        {({ account, chain, openConnectModal, mounted }) => {
          return (
            <div
              {...(!mounted && {
                'aria-hidden': true,
                style: {
                  background:'yellow',
                  color:'green'
                  // opacity: 0,
                  // pointerEvents: 'none',
                  // userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!mounted || !account || !chain) {
                  return (
                    <button 
                      onClick={openConnectModal} 
                      type="button"
                      className="connect-wallet-button"
                    >
                      Connect
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          );
        }}
      </ConnectButton>
    </div>
  );
};

export default WalletConnect;
