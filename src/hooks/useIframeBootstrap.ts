import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
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
    const hashParams = new URLSearchParams(search);
    const queryParams = new URLSearchParams(window.location.search);

    const incomingToken = hashParams.get('jwt') || queryParams.get('jwt');

    if (!incomingToken) {
      setState((prev) => (prev.status === 'idle' ? { status: 'skipped', error: null } : prev));
      return;
    }

    const source = hashParams.get('source') || queryParams.get('source') || 'browser';
    let isActive = true;
    setState({ status: 'pending', error: null });

    login({ jwt: incomingToken, source })
      .then((response) => {
        if (!isActive) return;
        const payload = response?.data;
        // Check for success (the login function returns {success:true, data:...} on success)
        if (!response?.success || !payload?.token) {
          const message = response?.message || 'iframe login failed';
          throw new Error(message);
        }

        // Note: The login() function already handles session storage and dispatching events.
        // We just need to handle navigation.

        setState({ status: 'success', error: null });

        // If backend indicates the name is already set, go straight to game.
        if (payload.nameUpdated) {
          navigate('/game', { replace: true });
          return;
        }

        // Clean up params from HashRouter search
        hashParams.delete('jwt');
        hashParams.delete('source');

        // Use history API to clean up window.location.search if present, without reloading
        if (queryParams.get('jwt') || queryParams.get('source')) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('jwt');
          newUrl.searchParams.delete('source');
          window.history.replaceState({}, '', newUrl.toString());
        }

        navigate(buildPath({ pathname, hash }, hashParams), { replace: true });
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
