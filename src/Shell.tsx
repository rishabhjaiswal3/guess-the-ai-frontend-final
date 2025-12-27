import './components/WalletConnect.css';
import './screens/home/home.css';
import { useEffect, useState } from 'react';
import BgImage from './assets/bg.webp';
import GifBg from './assets/Guesstheaibg.webm';
import logo2 from './assets/Logo2.png';
import og from './assets/og.png';
import { Loader } from './components/Loader';

type ShellProps = {
  onConnect: () => void;
  connecting?: boolean;
};

export default function Shell({ onConnect, connecting }: ShellProps) {
  const [gifLoaded, setGifLoaded] = useState(false);
  const [showVideoBg, setShowVideoBg] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 600);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isMobile) return;
    const enableVideo = () => setShowVideoBg(true);
    const timeoutId = setTimeout(enableVideo, 1200);
    window.addEventListener('pointerdown', enableVideo, { once: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('pointerdown', enableVideo);
    };
  }, [isMobile]);

  return (
    <div className="home-page">

      <div className="background-container">
        {!isMobile && (
          <>
            <img
              src={BgImage}
              alt="Background"
              className={`background-image ${gifLoaded ? 'fade-out' : 'fade-in'}`}
              draggable={false}
            />

            {showVideoBg && (
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                poster={BgImage}
                className={`video-bg ${gifLoaded ? 'fade-in' : 'fade-out'}`}
                onLoadedData={() => setGifLoaded(true)}
              >
                <source src={GifBg} type="video/webm" />
              </video>
            )}
          </>
        )}
      </div>

      <div className="content-container">
        <div className="content-wrap">
          <img src={logo2} alt="" className="logo-circle" />
          <div className="hero-title">GUESS THE AI</div>

          <div className="wallet-connect-wrap" style={{ minWidth: '300px' }}>
            <button
              type="button"
              className="connect-wallet-button"
              onClick={onConnect}
              style={{ minWidth: '260px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <Loader size="sm" label="Preparing login" />
                  Preparing…
                </>
              ) : (
                'Connect'
              )}
            </button>
          </div>

          <div>
            <img
              src={og}
              alt=""
              style={{
                height: '40px',
                border: '1px solid #ffffff',
                padding: '8px',
                borderRadius: '10px',
                marginBottom: '30px',
              }}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
}
