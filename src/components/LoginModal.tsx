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
} from '@privy-io/react-auth';
import { login as backendLogin } from '../api/auth';

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

function LoginModal({ open, onClose, logoSrc }: LoginModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  type EmailStep = 'enter-email' | 'enter-code';
  const [emailStep, setEmailStep] = useState<EmailStep>('enter-email');
  const [error, setError] = useState('');

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
        const res = await backendLogin({ walletAddress: address });
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
    onComplete: () => onClose?.(),
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

  const onCodeSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    setError('');
    loginWithCode({ code }).catch((err: unknown) => {
      if (err && typeof err === 'object' && 'message' in err) {
        setError(String((err as { message?: unknown }).message));
      } else {
        setError('Invalid code');
      }
    });
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
              <GoogleIcon />
              <span style={{ marginLeft: 8 }}>Google</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default LoginModal;
