import './components/WalletConnect.css';
import './screens/home/home.css';
import BgImage from './assets/bg.webp';
import logo2 from './assets/Logo2.png';
import og from './assets/og.png';
import { Loader } from './components/Loader';

type ShellProps = {
  onConnect: () => void;
  warming?: boolean;
};

export default function Shell({ onConnect, warming }: ShellProps) {
  return (
    <div className="home-page">
      <div className="background-container">
        <img src={BgImage} alt="Background" className="background-image fade-in" draggable={false} />
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
            >
              {warming ? <Loader size="sm" label="Preparing login" /> : 'Connect'}
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
