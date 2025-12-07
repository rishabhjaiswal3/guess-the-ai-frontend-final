import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { iframeLogin } from '../api/auth';
import { SESSION_SOURCES, setSessionSource } from '../utils/session';

type BootstrapStatus =
  | { status: 'idle'; error: null }
  | { status: 'pending'; error: null }
  | { status: 'success'; error: null }
  | { status: 'skipped'; error: null }
  | { status: 'error'; error: string };

type PathArgs = {
  pathname: string;
  hash?: string;
};

const buildPath = (location: PathArgs, params: URLSearchParams) => {
  const search = params.toString();
  const hash = location.hash || '';
  return `${location.pathname}${search ? `?${search}` : ''}${hash}`;
};

export default function useIframeBootstrap() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<BootstrapStatus>({ status: 'idle', error: null });

  useEffect(() => {
    const { pathname, search, hash } = location;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(search);
    const incomingToken = params.get('jwt');
    if (!incomingToken) {
      setState((prev) => (prev.status === 'idle' ? { status: 'skipped', error: null } : prev));
      return;
    }

    const source = params.get('source') || 'browser';
    let isActive = true;
    setState({ status: 'pending', error: null });

    iframeLogin(incomingToken, source)
      .then((response) => {
        if (!isActive) return;
        const payload = response?.data?.data;
        if (!response?.data?.success || !payload?.token) {
          const message = response?.data?.message || 'iframe login failed';
          throw new Error(message);
        }
        const token = payload.token;
        localStorage.setItem('token', token);
        if (payload.username) {
          localStorage.setItem('username', payload.username);
          localStorage.setItem('userName', payload.username);
        }
        setSessionSource(SESSION_SOURCES.IFRAME);
        window.dispatchEvent(new CustomEvent('presence:token-change', { detail: token }));
        setState({ status: 'success', error: null });

        // If backend indicates the name is already set, go straight to game.
        if (payload.nameUpdated) {
          navigate('/game', { replace: true });
          return;
        }

        params.delete('jwt');
        params.delete('source');
        navigate(buildPath({ pathname, hash }, params), { replace: true });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const message =
          (typeof error === 'object' && error && 'response' in error &&
            (error as { response?: { data?: { message?: string } } }).response?.data?.message) ||
          (error instanceof Error ? error.message : 'iframe login failed');
        setState({ status: 'error', error: message ?? 'iframe login failed' });
      });

    return () => {
      isActive = false;
    };
  }, [location.pathname, location.search, location.hash, navigate]);

  return state;
}
