import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAccount } from 'wagmi';
import { SESSION_CHANGE_EVENT, SESSION_SOURCES, getSessionSource } from '../utils/session';

const FRONT_BUFFER_MS = Number(import.meta.env.VITE_PRESENCE_FRONT_BUFFER_MS ?? 10_000);
const FLUSH_QUANTUM_SEC = Number(import.meta.env.VITE_PRESENCE_QUANTUM_SEC ?? 60);
const STORAGE_KEY = 'presence.pendingSec';
const TICK_SEC = Number(import.meta.env.VITE_PRESENCE_TICK_SEC ?? 10);
const LEGACY_STORAGE_KEY = 'presence.pendingMs';

type PresenceAck = {
  ok?: boolean;
};

const readPending = () => {
  if (typeof window === 'undefined') return 0;
  const legacy = Number(localStorage.getItem(LEGACY_STORAGE_KEY)) || 0;
  if (legacy) {
    const converted = Math.floor(legacy / 1000);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, String(converted));
    return converted;
  }
  return Number(localStorage.getItem(STORAGE_KEY)) || 0;
};

export default function usePresenceTracker(token?: string | null) {
  const { isConnected } = useAccount();
  const socketRef = useRef<Socket | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frontTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(readPending());
  const [allowWithoutWallet, setAllowWithoutWallet] = useState(() => {
    if (typeof window === 'undefined') return false;
    return getSessionSource() === SESSION_SOURCES.IFRAME;
  });

  const writePending = (next: number) => {
    pendingRef.current = next;
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const flushIfReady = () => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    const pending = pendingRef.current;
    if (pending < FLUSH_QUANTUM_SEC || inFlightRef.current) return;
    inFlightRef.current = true;
    socket.emit('presence:add', { deltaMs: FLUSH_QUANTUM_SEC * 1000 }, (ack: PresenceAck) => {
      if (ack?.ok) {
        writePending(Math.max(0, pendingRef.current - FLUSH_QUANTUM_SEC));
      }
      inFlightRef.current = false;
      // If more time accumulated while we waited, queue another flush.
      flushIfReady();
    });
  };

  const ensureSocket = () => {
    if (socketRef.current?.connected) return socketRef.current;
    if (typeof window === 'undefined') return null;
    const rawBase = import.meta.env.VITE_PUBLIC_URL ?? window.location.origin;
    const base = String(rawBase).replace(/\/+$/, '');
    socketRef.current = io(base, {
      path: '/ws',
      transports: ['websocket'],
      auth: { token },
      autoConnect: !!(token && (isConnected || allowWithoutWallet)),
    });
    socketRef.current.on('connect', () => {
      flushIfReady();
    });
    socketRef.current.on('disconnect', () => {
      inFlightRef.current = false;
    });
    return socketRef.current;
  };

  useEffect(() => {
    function handleStorage(evt: StorageEvent) {
      if (evt.key === STORAGE_KEY) {
        pendingRef.current = readPending();
      }
    }

    function cleanup() {
      if (frontTimerRef.current) clearTimeout(frontTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      frontTimerRef.current = null;
      tickTimerRef.current = null;
      inFlightRef.current = false;
      pendingRef.current = readPending();
      window.removeEventListener('storage', handleStorage);
      socketRef.current?.disconnect();
      socketRef.current = null;
    }

    if (!token || (!isConnected && !allowWithoutWallet)) {
      cleanup();
      return undefined;
    }

    const socket = ensureSocket();
    if (socket && !socket.connected) socket.connect();

    frontTimerRef.current = setTimeout(() => {
      if (!inFlightRef.current) {
        writePending(pendingRef.current + TICK_SEC);
        flushIfReady();
      }
      tickTimerRef.current = setInterval(() => {
        if (inFlightRef.current) return;
        writePending(pendingRef.current + TICK_SEC);
        flushIfReady();
      }, TICK_SEC * 1000);
    }, FRONT_BUFFER_MS);

    window.addEventListener('storage', handleStorage);

    return cleanup;
  }, [token, isConnected, allowWithoutWallet]);

  useEffect(() => {
    const handleSessionChange = () => {
      if (typeof window === 'undefined') return;
      setAllowWithoutWallet(getSessionSource() === SESSION_SOURCES.IFRAME);
    };
    window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
    window.addEventListener('presence:token-change', handleSessionChange);
    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
      window.removeEventListener('presence:token-change', handleSessionChange);
    };
  }, []);
}
