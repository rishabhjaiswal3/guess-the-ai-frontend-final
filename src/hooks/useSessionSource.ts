import { useEffect, useState } from 'react';
import {
  SESSION_CHANGE_EVENT,
  SESSION_SOURCES,
  getSessionSource,
  type SessionSource,
} from '../utils/session';

type SessionState = {
  token: string;
  source: SessionSource | '';
  hasToken: boolean;
};

const readSessionState = (): SessionState => {
  if (typeof window === 'undefined') {
    return { token: '', source: '', hasToken: false };
  }
  const token = localStorage.getItem('token') || '';
  const source = getSessionSource();
  return {
    token,
    source,
    hasToken: !!token,
  };
};

export default function useSessionSource() {
  const [state, setState] = useState<SessionState>(() => readSessionState());

  useEffect(() => {
    const syncState = () => setState(readSessionState());
    window.addEventListener('storage', syncState);
    window.addEventListener('presence:token-change', syncState);
    window.addEventListener(SESSION_CHANGE_EVENT, syncState);
    return () => {
      window.removeEventListener('storage', syncState);
      window.removeEventListener('presence:token-change', syncState);
      window.removeEventListener(SESSION_CHANGE_EVENT, syncState);
    };
  }, []);

  const isIframeSession = state.hasToken && state.source === SESSION_SOURCES.IFRAME;
  const isWalletSession = state.hasToken && state.source === SESSION_SOURCES.WALLET;

  return {
    ...state,
    isIframeSession,
    isWalletSession,
  };
}
