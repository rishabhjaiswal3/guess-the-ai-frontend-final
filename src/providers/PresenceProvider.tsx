import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import usePresenceTracker from '../hooks/usePresenceTracker';

type PresenceContextValue = {
  token: string;
};

export const PresenceContext = createContext<PresenceContextValue>({ token: '' });

type PresenceProviderProps = {
  children: ReactNode;
};

export default function PresenceProvider({ children }: PresenceProviderProps) {
  const [token, setToken] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''));

  useEffect(() => {
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === 'token') setToken(event.newValue ?? '');
    };
    const syncFromEvent = (event: Event) => {
      if ('detail' in event) {
        setToken(((event as CustomEvent<string>).detail ?? ''));
      }
    };
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('presence:token-change', syncFromEvent);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('presence:token-change', syncFromEvent);
    };
  }, []);

  usePresenceTracker(token);

  const value = useMemo(() => ({ token }), [token]);
  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}
