import './components/WalletConnect.css';
import './screens/home/home.css';
import logo2 from './assets/Logo2.png';
import og from './assets/og.png';
import { Loader } from './components/Loader';

type ShellProps = {
  onConnect: () => void;
  connecting?: boolean;
};

export default function Shell({ onConnect, connecting }: ShellProps) {

  return (
    <div className="home-page">
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
