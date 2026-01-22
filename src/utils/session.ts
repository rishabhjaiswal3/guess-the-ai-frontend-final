export const clearSessionStorage = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  localStorage.removeItem('presence.pendingMs');
  localStorage.removeItem('presence.pendingSec');
  // Trigger event to notify other components (e.g. WalletConnect)
  window.dispatchEvent(new CustomEvent('presence:token-change', { detail: '' }));
};
