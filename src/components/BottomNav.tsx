import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import GameIcon from '../assets/Game.png';
import LeaderboardIcon from '../assets/Leaderboard.png';
import ProfileIcon from '../assets/Profile.png';
import WalletIcon from '../assets/Wallet.png';
import '../components/BottomNav.css';
import useSessionSource from '../hooks/useSessionSource';
import { clearSessionStorage } from '../utils/session';

type ConfirmationModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
};

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, onEdit }: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(3px)',
      WebkitBackdropFilter: 'blur(3px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        padding: '32px 26px 22px',
        borderRadius: '20px',
        textAlign: 'left',
        color: '#ffffff',
        width: 'clamp(340px, 94vw, 520px)',
        minHeight: '280px',
        maxHeight: '88vh',
        border: '1px solid rgba(157, 107, 255, 0.35)',
        background: 'linear-gradient(135deg, rgba(27,0,63,0.95), rgba(42,0,58,0.95))',
        boxShadow: '0 34px 86px rgba(0, 0, 0, 0.65), 0 0 36px rgba(156, 92, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
        transform: 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)'
        }} />
        <button
          onClick={onCancel}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 0
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.87 0-7 2.24-7 5v2h14v-2c0-2.76-3.13-5-7-5Z" fill="currentColor"/>
            </svg>
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              background: 'linear-gradient(90deg, #FF4D4D, #FFD166 35%, #4BE1EC 70%, #9C5CFF)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 18px rgba(156,92,255,0.35)'
            }}>Account</h3>
          </div>
          <div style={{ fontSize: 13, color: '#cfcfcf', marginTop: 8, textAlign: 'center' }}>Manage your session and profile</div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(157,107,255,0.25)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-hidden>🚪</span> Logout
              </div>
              <div style={{ fontSize: 13, color: '#cfcfcf' }}>Disconnect your wallet and logout from this device.</div>
            </div>
            <button
              onClick={onConfirm}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255,92,92,0.6)',
                background: 'linear-gradient(135deg, #ff4d4d, #ff7a7a)',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 10px 22px rgba(255, 77, 77, 0.35)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
                minWidth: 120
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
            >
              Logout
            </button>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(157,107,255,0.25)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-hidden>🖊️</span> Edit Profile
              </div>
              <div style={{ fontSize: 13, color: '#cfcfcf' }}>Update your profile details like name and avatar.</div>
            </div>
            <button
              onClick={onEdit}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(157,107,255,0.6)',
                background: 'linear-gradient(135deg, #7b3fe4, #9d6bff)',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 10px 22px rgba(123, 63, 228, 0.35)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
                minWidth: 120
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BottomNav = (): JSX.Element | null => {
  const navigate = useNavigate();
  const { authenticated, logout } = usePrivy();
  const [, setShowWalletInfo] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const { isIframeSession, hasToken } = useSessionSource();
  const isSessionActive = authenticated || (isIframeSession && hasToken);

  const handleDisconnect = async () => {
    if (authenticated) {
      await logout();
    }
    clearSessionStorage();
    setShowDisconnectModal(false);
    setShowWalletInfo(false);
    navigate('/');
  };

  const handleEditProfile = () => {
    setShowDisconnectModal(false);
    setShowWalletInfo(false);
    navigate('/');
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (popupRef.current && target && !popupRef.current.contains(target)) {
        // Check if the click is not on any nav icon
        const navIcons = document.querySelectorAll('.nav-icon');
        const clickedOnNavIcon = Array.from(navIcons).some((icon) =>
          icon.contains(target) || icon === target
        );

        if (!clickedOnNavIcon) {
          setShowWalletInfo(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavClick = (index: number) => {
    setShowWalletInfo(false);
    switch(index) {
      case 0: // Game
        navigate('/game');
        break;
      case 1: // Leaderboard
        navigate('/leaderboard');
        break;
      case 2: // Profile
        navigate('/profile');
        break;
      // Wallet case removed as it's now handled directly in the onClick
      default:
        break;
    }
  };


  if (!isSessionActive) return null;

  return (
    <>
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnectModal(false)}
        onEdit={handleEditProfile}
      />
    <div className="bottom-bar">
        <button className="nav-icon" onClick={() => handleNavClick(0)}>
          <img src={GameIcon} alt="Game" className="icon" />
        </button>
        <button className="nav-icon" onClick={() => handleNavClick(1)}>
          <img src={LeaderboardIcon} alt="Leaderboard" className="icon" />
        </button>
        <button className="nav-icon" onClick={() => handleNavClick(2)}>
          <img src={ProfileIcon} alt="Profile" className="icon" />
        </button>
        <div className="wallet-icon-container">
          <button 
            className="nav-icon"
            onClick={() => setShowDisconnectModal(true)}
          >
            <img src={WalletIcon} alt="Wallet" className="icon" />
          </button>
        </div>
    </div>
    </>
  );
};

export default BottomNav;
