import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import {
  useConnectWallet,
  useLoginWithEmail,
  useLoginWithOAuth,
  usePrivy,
} from '@privy-io/react-auth';
import { login as backendLogin } from '../api/auth';
import {
  connectGateWallet,
  getGateWalletCurrentNetwork,
  getPrimaryGateWalletAddress,
  isGateWalletAvailable,
  switchGateWalletNetwork,
  type NetworkInfo,
} from '../lib/gateWallet';

type LoginModalProps = {
  open: boolean;
  onClose?: () => void;
  logoSrc?: string;
};

const WalletIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.75 7.5h13.5a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V9.75a2.25 2.25 0 0 1 2.25-2.25Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M18.75 12.75h-2.25a1.5 1.5 0 1 0 0 3h2.25a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75Z"
      fill="currentColor"
    />
    <path
      d="M17.25 5.25H6a2.25 2.25 0 0 0-2.25 2.25v1.5"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const MailIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.6 6.6h16.8a1.8 1.8 0 0 1 1.8 1.8v7.2a1.8 1.8 0 0 1-1.8 1.8H3.6A1.8 1.8 0 0 1 1.8 15.6V8.4A1.8 1.8 0 0 1 3.6 6.6Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="m3 8 8.4 5.4L19.8 8"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 48 48"
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303C33.115 32.091 28.905 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.803 0 5.367 1.059 7.313 2.787l5.657-5.657C33.91 6.053 29.173 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917Z"
    />
    <path
      fill="#FF3D00"
      d="m6.306 14.691 6.571 4.818C14.655 16.104 18.961 13 24 13c2.803 0 5.367 1.059 7.313 2.787l5.657-5.657C33.91 6.053 29.173 4 24 4c-7.837 0-14.426 4.497-17.694 10.691Z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c4.81 0 9.204-1.844 12.543-4.857l-5.792-4.894C28.909 35.188 26.571 36 24 36c-4.877 0-9.055-2.885-11.045-7.055l-6.6 5.081C9.584 39.411 16.319 44 24 44Z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083 43.6 20 42 20H24v8h11.303a11.996 11.996 0 0 1-4.103 5.249l.003-.002 5.792 4.894C36.67 38.366 44 34 44 24c0-1.341-.138-2.651-.389-3.917Z"
    />
  </svg>
);

const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 127.14 96.36"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#5865F2"
      d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.82,105.82,0,0,0,126.6,80.22c2.36-24.44-2.54-48.4-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
    />
  </svg>
);

const GateWalletIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="12" fill="white" />
    <path
      d="M7 12L10 15L17 8"
      stroke="#a940ff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const theme = {
  bg: 'var(--theme-bg-deep)',
  surface: 'var(--theme-card-bg)',
  panel: 'var(--theme-card-surface)',
  text: 'var(--theme-text)',
  subtext: 'var(--theme-text-soft)',
  primary: 'var(--theme-accent-magenta)',
  primaryDark: 'var(--theme-accent-violet)',
  ring: 'rgba(210,75,255,0.45)',
} as const;

const styles: Record<string, CSSProperties> = {
  dialog: {
    padding: 0,
    border: 'none',
    borderRadius: 16,
    maxWidth: 460,
    width: '92vw',
    boxShadow:
      '0 28px 80px rgba(0,0,0,0.75), 0 0 36px rgba(210,75,255,0.4)',
    overflow: 'hidden',
  },
  container: {
    position: 'relative',
    padding: 22,
    background: theme.surface,
    color: theme.text,
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontSize: 15,
    lineHeight: 1.45,
  },
  close: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(3,3,12,0.8)',
    color: theme.subtext,
    fontSize: 20,
    lineHeight: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  hero: {
    textAlign: 'center',
    padding: '30px 10px 22px',
    background:
      'radial-gradient(1200px 600px at 10% 0%, rgba(210, 75, 255, 0.3), transparent 60%), radial-gradient(900px 500px at 90% 100%, rgba(99, 208, 255, 0.22), transparent 60%), linear-gradient(135deg, #14092c 0%, #1b0d3d 40%, #2a1154 72%, #0b0418 100%)',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    inset: -60,
    background:
      'radial-gradient(800px 180px at 50% -20%, rgba(210, 75, 255, 0.2), transparent)',
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: 'contain',
    borderRadius: 12,
    border: '1px solid var(--theme-card-border)',
  },
  title: {
    margin: '14px 0 4px',
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: 0.6,
    background: 'var(--theme-title-gradient)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 22px rgba(210, 75, 255, 0.35)',
  },
  subtitle: {
    margin: '2px 0 0',
    color: theme.subtext,
    fontSize: 14,
  },
  btnIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: 8,
  },
  primary: {
    padding: '14px 18px',
    borderRadius: 12,
    border: '1px solid var(--theme-card-border-strong)',
    background: 'var(--theme-accent-gradient)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow:
      '0 10px 30px rgba(0,0,0,0.55), 0 8px 24px rgba(210,75,255,0.45)',
    letterSpacing: 0.2,
    transition: 'transform .08s ease, box-shadow .2s ease',
  },
  primaryAlt: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid var(--theme-card-border)',
    background: 'var(--theme-card-surface)',
    color: theme.text,
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform .08s ease, box-shadow .2s ease',
  },
  divider: {
    margin: '10px 0 8px',
    height: 1,
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
  },
  oauthRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  oauth: {
    flex: 1,
    minWidth: 130,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--theme-card-border)',
    background: 'rgba(12, 6, 28, 0.9)',
    color: theme.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 14,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 6,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    textAlign: 'left',
  },
  labelText: {
    fontSize: 14,
    fontWeight: 600,
  },
  input: {
    padding: '11px 12px',
    borderRadius: 10,
    border: `1px solid ${theme.ring}`,
    background: theme.bg,
    color: theme.text,
    outline: 'none',
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: theme.subtext,
  },
  actionsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  },
  ghost: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'transparent',
    color: theme.subtext,
    cursor: 'pointer',
    fontWeight: 600,
  },
  gateBtn: {
    padding: '14px 18px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(180deg, #a940ff 0%, rgba(107, 0, 194, 0.55) 100%)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px -5px rgba(169, 64, 255, 0.4)',
    letterSpacing: 0.2,
    transition: 'transform .08s ease, box-shadow .2s ease',
    width: '100%',
    marginTop: '10px',
    position: 'relative',
    overflow: 'hidden',
  },
  error: {
    margin: '12px 0 6px',
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(255,77,77,0.08)',
    color: '#ff7a7a',
    fontSize: 13,
    textAlign: 'left',
    border: '1px solid rgba(255,77,77,0.45)',
  },
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
};

const normalizeAccountType = (value?: string | null) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase();
  return trimmed;
};

const resolveWalletAccountType = (wallet?: {
  walletClientType?: string;
  connectorType?: string;
  type?: string;
}) => {
  const walletClientType = normalizeAccountType(wallet?.walletClientType);
  if (walletClientType) return walletClientType;
  const connectorType = normalizeAccountType(wallet?.connectorType);
  if (connectorType) return connectorType;
  return normalizeAccountType(wallet?.type);
};



const allowedChain = {
  caip2: 'eip155:16661',
  decimalChainId: 16661,
  hexChainId: '0x4115',
  chainName: '0G Mainnet',
  rpcUrls: ['https://evmrpc.0g.ai'],
  blockExplorerUrls: ['https://chainscan.0g.ai'],
};

function normalizeChainId(chainId?: string) {
  if (!chainId) return undefined;
  if (chainId.startsWith('0x')) {
    const parsed = Number.parseInt(chainId, 16);
    return Number.isFinite(parsed) ? String(parsed) : chainId;
  }
  return chainId;
}

function getNetworkLabel(network: NetworkInfo | null | undefined) {
  if (network === null) return 'All Networks';
  if (!network) return 'Unknown';
  return network.name || network.chainId;
}

function LoginModal({ open, onClose, logoSrc }: LoginModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  type EmailStep = 'enter-email' | 'enter-code';
  const [emailStep, setEmailStep] = useState<EmailStep>('enter-email');
  const [error, setError] = useState('');
  const [gateConnecting, setGateConnecting] = useState(false);
  const { user } = usePrivy();

  const { connectWallet } = useConnectWallet({
    onSuccess: async (wallet) => {
      // eslint-disable-next-line no-console
      console.log('[LoginModal] connectWallet success', wallet);
      const address = (wallet as { address?: string }).address;
      if (!address) {
        // eslint-disable-next-line no-console
        console.warn('[LoginModal] Wallet connect succeeded but no address found on wallet object');
        setError('Connected wallet has no address. Please try again.');
        return;
      }
      try {
        // eslint-disable-next-line no-console
        console.log('[LoginModal] Calling backendLogin from wallet connect', {
          walletAddress: address,
        });

        const walletType = resolveWalletAccountType(
          wallet as { walletClientType?: string; connectorType?: string; type?: string }
        );
        const payload: any = { walletAddress: address };
        if (walletType) {
          payload.privyMetaData = { type: walletType };
        }

        const res = await backendLogin(payload);
        // eslint-disable-next-line no-console
        console.log('[LoginModal] backendLogin result (wallet)', res);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[LoginModal] backendLogin failed from wallet connect', err);
        setError('Wallet login failed. Please try again.');
        return;
      }
      onClose?.();
    },
    onError: (err) => {
      // eslint-disable-next-line no-console
      console.error('[LoginModal] connectWallet error', err);
      setError(getErrorMessage(err, 'Failed to connect wallet'));
    },
  });

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onComplete: () => onClose?.(),
    onError: (err) => setError(getErrorMessage(err, 'OAuth error')),
  });

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onError: (err) => setError(getErrorMessage(err, 'Email login error')),
  });

  useEffect(() => {
    setError('');
    setEmail('');
    setCode('');
    setEmailStep('enter-email');
  }, [open]);

  useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
    if (!open && dialogRef.current?.open) {
      dialogRef.current.close();
    }
    let styleTag: HTMLStyleElement | undefined;
    if (typeof document !== 'undefined') {
      styleTag = document.createElement('style');
      styleTag.setAttribute('data-login-modal-backdrop', 'true');
      styleTag.innerHTML =
        'dialog::backdrop{background:rgba(10,10,18,.6);backdrop-filter:saturate(1.2) blur(4px);}';
      document.head.appendChild(styleTag);
    }
    return () => {
      if (styleTag && styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
  }, [open]);

  const handleConnectWallet = () => {
    // eslint-disable-next-line no-console
    console.log('[LoginModal] Connect wallet button clicked');
    try {
      if (dialogRef.current?.open) dialogRef.current.close();
    } catch {
      // ignore
    }
    onClose?.();
    setTimeout(() => {
      try {
        connectWallet();
      } catch {
        // ignore
      }
    }, 50);
  };

  const handleGateConnect = async () => {
    if (gateConnecting) return;
    setError('');
    setGateConnecting(true);

    try {
      if (!isGateWalletAvailable()) {
        throw new Error('Gate Wallet not detected. Please install or enable it.');
      }

      // 1. Connect first
      const accountInfo = await connectGateWallet();
      const address = getPrimaryGateWalletAddress(accountInfo);

      if (!address) {
        throw new Error('Gate Wallet did not return an address.');
      }

      // 2. Check Network
      let network = await getGateWalletCurrentNetwork().catch(() => undefined);

      const normalized = normalizeChainId(network?.chainId);
      const allowed = String(allowedChain.decimalChainId);

      // If network is null (All Networks) or mismatch, try to switch
      if (network === null || (normalized && normalized !== allowed)) {
        try {
          await switchGateWalletNetwork(allowedChain.hexChainId);
          // Re-check network after switch
          network = await getGateWalletCurrentNetwork().catch(() => undefined);
        } catch (switchError) {
          console.warn('Failed to auto-switch network:', switchError);
        }
      }

      // 3. Verify Final Network State
      const finalNormalized = normalizeChainId(network?.chainId);
      if (network === null) {
        throw new Error(
          'Gate Wallet is set to All Networks. Please select 0G Mainnet manually.'
        );
      }

      if (!finalNormalized || finalNormalized !== allowed) {
        throw new Error(
          `Gate Wallet is on ${getNetworkLabel(network)}. Please switch to ${allowedChain.chainName}.`
        );
      }

      // 4. Proceed to Backend Login
      console.log('[LoginModal] Logging in with Gate Wallet address:', address);

      const payload: any = {
        walletAddress: address,
        sessionWallet: 'VERIFIED',
        privyMetaData: { type: 'gate_wallet' }
      };

      const res = await backendLogin(payload);
      console.log('[LoginModal] Gate Wallet backend login result', res);

      localStorage.setItem('sessionWallet', 'VERIFIED');
      onClose?.();
    } catch (err: any) {
      console.error('Gate wallet connection error:', err);
      setError(err?.message || 'Failed to connect Gate Wallet.');
    } finally {
      setGateConnecting(false);
    }
  };

  const onEmailSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    setError('');
    sendCode({ email })
      .then(() => {
        setEmailStep('enter-code');
      })
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && 'message' in err) {
          setError(String((err as { message?: unknown }).message));
        } else {
          setError('Failed to send code');
        }
      });
  };

  const onCodeSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    setError('');
    try {
      await loginWithCode({ code });
      const trimmedEmail = email.trim();
      const payload: any = {};
      if (trimmedEmail) payload.email = trimmedEmail;
      if (user?.id) payload.privyUserId = user.id;
      payload.privyMetaData = { ...(payload.privyMetaData ?? {}), type: 'email' };
      const res = await backendLogin(payload);
      if (res?.success === false) {
        setError(res.message || 'Login failed');
        return;
      }
      onClose?.();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError(String((err as { message?: unknown }).message));
      } else {
        setError('Invalid code');
      }
    }
  };

  const isSendingCode = emailState?.status === 'sending-code';
  const isSubmittingCode = emailState?.status === 'submitting-code';

  return (
    <dialog
      ref={dialogRef}
      style={styles.dialog}
      onCancel={onClose}
      aria-modal="true"
    >
      <div style={styles.container}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={styles.close}
          type="button"
        >
          ×
        </button>

        <div style={styles.hero}>
          <div style={styles.heroGlow} />
          {logoSrc && (
            <img src={logoSrc} alt="Logo" style={{ height: '120px', width: '120px', background: 'black', borderRadius: "100px", padding: "10px" }} />
          )}
          <h2 style={styles.title}>GUESS THE AI</h2>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form
          style={styles.form}
          onSubmit={emailStep === 'enter-email' ? onEmailSubmit : onCodeSubmit}
        >
          {emailStep === 'enter-email' ? (
            <>
              <label style={styles.label}>
                <span style={styles.labelText}>Email address</span>
                <input
                  type="email"
                  required
                  placeholder="Enter email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  style={styles.input}
                // Always allow editing the email
                />
                <small style={styles.hint}>
                  We&apos;ll email you a 6‑digit OTP.
                </small>
              </label>
              <div style={styles.actionsRow}>
                <button
                  type="submit"
                  style={{ ...styles.primary, width: '100%' }}
                  disabled={isSendingCode}
                >
                  {isSendingCode ? 'Sending…' : 'Send OTP'}
                </button>
              </div>
            </>
          ) : (
            <>
              <label style={styles.label}>
                <span style={styles.labelText}>Enter 6‑digit code</span>
                <input
                  type="text"
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  style={styles.input}
                />
                <small style={styles.hint}>
                  Didn&apos;t get it? Check spam or resend after a moment.
                </small>
              </label>
              <div style={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => {
                    setCode('');
                    setEmail('');
                    setEmailStep('enter-email');
                  }}
                  style={styles.ghost}
                >
                  Edit email
                </button>
                <button
                  type="submit"
                  style={{ ...styles.primary, width: '100%' }}
                  disabled={isSubmittingCode}
                >
                  {isSubmittingCode ? 'Verifying…' : 'Verify & continue'}
                </button>
              </div>
            </>
          )}
        </form>

        <div style={{ marginTop: 14 }}>
          <button
            style={styles.gateBtn}
            onClick={handleGateConnect}
            disabled={gateConnecting}
            type="button"
          >
            {gateConnecting ? (
              <span style={styles.btnIcon}>
                <GateWalletIcon />
              </span>
            ) : (
              <span style={styles.btnIcon}>
                <GateWalletIcon />
              </span>
            )}
            <span>{gateConnecting ? 'Connecting...' : 'Connect Gate Wallet'}</span>
          </button>
        </div>

        <div style={{ marginTop: 14, display: 'flex' }}>
          <button
            style={{ ...styles.primary, width: '100%' }}
            onClick={handleConnectWallet}
            type="button"
          >
            <span style={styles.btnIcon}>
              <WalletIcon />
            </span>
            <span>Connect wallet</span>
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={styles.divider} />
          <div style={styles.oauthRow}>
            <button
              style={styles.oauth}
              disabled={oauthLoading}
              onClick={() => initOAuth({ provider: 'google' })}
              aria-label="Continue with Google"
              type="button"
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <GoogleIcon />
                <span style={{ marginLeft: 8 }}>Google</span>
              </div>
            </button>

            
            <button
              style={styles.oauth}
              disabled={oauthLoading}
              onClick={() => initOAuth({ provider: 'discord' })}
              aria-label="Continue with Discord"
              type="button"
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DiscordIcon />
                <span style={{ marginLeft: 8 }}>Discord</span>
              </div>
            </button>
           
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default LoginModal;
