const SESSION_SOURCE_KEY = 'sessionSource';
export const SESSION_CHANGE_EVENT = 'session:change';

export const SESSION_SOURCES = {
  WALLET: 'wallet',
  IFRAME: 'iframe',
} as const;

export type SessionSource = (typeof SESSION_SOURCES)[keyof typeof SESSION_SOURCES];

const dispatchSessionChange = (source?: SessionSource | '') => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(SESSION_CHANGE_EVENT, { detail: source || '' })
  );
};

export const getSessionSource = (): SessionSource | '' => {
  if (typeof window === 'undefined') return '';
  return (localStorage.getItem(SESSION_SOURCE_KEY) as SessionSource | '') || '';
};

export const setSessionSource = (source?: SessionSource | '') => {
  if (typeof window === 'undefined') return;
  if (source) {
    localStorage.setItem(SESSION_SOURCE_KEY, source);
  } else {
    localStorage.removeItem(SESSION_SOURCE_KEY);
  }
  dispatchSessionChange(source);
};

export const clearSessionStorage = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('username');

  localStorage.removeItem('token');
  localStorage.removeItem('presence.pendingMs');
  localStorage.removeItem('presence.pendingSec');
  localStorage.removeItem(SESSION_SOURCE_KEY);
  window.dispatchEvent(new CustomEvent('presence:token-change', { detail: '' }));
  dispatchSessionChange('');
};

export const hasIframeSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    (localStorage.getItem(SESSION_SOURCE_KEY) as SessionSource | '') === SESSION_SOURCES.IFRAME &&
    !!localStorage.getItem('token')
  );
};
