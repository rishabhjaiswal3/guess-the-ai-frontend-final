import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import WalletConnect from '../../components/WalletConnect';
import './home.css';
import { updateUserName, login } from '../../api/auth';
import { clearSessionStorage } from '../../utils/session';

import logo2 from '../../assets/Logo2.png';
import og from '../../assets/og.png';
// import Base from '../../assets/Base.png';
// import Icon from '../../assets/Icon.png';
// import SearchIcon from '../../assets/SearchIcon.png';

const Home = () => {
  const { authenticated } = usePrivy();
  // const isConnected = authenticated;
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localToken, setLocalToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  );

  useEffect(() => {
    const handleTokenChange = (e: CustomEvent<string>) => {
      setLocalToken(e.detail);
    };
    const handleUsernameChange = (e: CustomEvent<string>) => {
      const nextName = (e.detail || '').trim();
      if (nextName) {
        setName(nextName);
      }
    };
    window.addEventListener('presence:token-change', handleTokenChange as EventListener);
    window.addEventListener('presence:username-change', handleUsernameChange as EventListener);
    return () => {
      window.removeEventListener('presence:token-change', handleTokenChange as EventListener);
      window.removeEventListener('presence:username-change', handleUsernameChange as EventListener);
    };
  }, []);

  const isSessionActive = authenticated || !!localToken;

  // Load name from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedName = localStorage.getItem('username');
    if (savedName) {
      setName(savedName);
    }
  }, []);

  // Log every render to debug OAuth redirect issue
  useEffect(() => {
    const isOAuthCallback =
      window.location.search.includes('privy_oauth_state') ||
      window.location.hash.includes('privy_oauth_state');

    console.log('[Home] ===== COMPONENT RENDER =====', {
      authenticated,
      hasLocalToken: !!localToken,
      isSessionActive,
      isOAuthCallback,
      url: window.location.href,
      searchParams: window.location.search,
      hashParams: window.location.hash,
      timestamp: new Date().toISOString()
    });
  });

  // Auto-login logic moved from WalletConnect
  useEffect(() => {
    console.log('[Home] Auto-login effect running');
    console.log('[Home] Window location:', {
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    });

    if (typeof window === 'undefined') return;
    const queryParams = new URLSearchParams(window.location.search);
    // manually parse hash search if needed, though usually window.location.search is enough if params are before hash
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');

    const incomingToken = queryParams.get('jwt') || hashParams.get('jwt');
    console.log('[Home] Extracted token:', incomingToken);

    if (!incomingToken) {
      console.log('[Home] No token found in URL, skipping auto-login');
      return;
    }

    if (localStorage.getItem('token')) {
      console.log('[Home] Found URL JWT with existing session, clearing session to force new login');
      clearSessionStorage();
    }

    const sessionWallet = queryParams.get('sessionWallet') || hashParams.get('sessionWallet');
    const source = queryParams.get('source') || hashParams.get('source');
    if (sessionWallet) {
      localStorage.setItem('sessionWallet', sessionWallet);
    }

    if (source) {
      localStorage.setItem('source', source);
    }

    // const source = queryParams.get('source') || hashParams.get('source') || 'browser';
    // console.log('[Home] Found login params in URL', { jwt: incomingToken, source });

    let loginPayoad: any = { jwt: incomingToken, source, sessionWallet: '' };
    // if(localStorage.getItem("sessionWallet")){
    loginPayoad.sessionWallet = queryParams.get('sessionWallet') || hashParams.get('sessionWallet') || localStorage.getItem("sessionWallet");
    // }

    login(loginPayoad)
      .then((response) => {
        console.log('[Home] Auto-login response', response);
        const payload = response?.data;
        if (response?.success && payload?.token) {
          // Cleanup URL
          if (queryParams.get('jwt')) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('jwt');
            newUrl.searchParams.delete('source');
            window.history.replaceState({}, '', newUrl.toString());
          } else if (hashParams.get('jwt')) {
            // If it was in hash, we might just want to navigate to clean route
            // or let the replace below handle it if it doesn't affect hash params?
            // Simplest is to just proceed.
          }

          if (payload?.nameUpdated) {
            navigate('/game', { replace: true });
          } else {
            // If name not updated, maybe stay here or reload? 
            // If params were in hash, refreshing to '/' effectively cleans them.
            navigate('/', { replace: true });
          }
        }
      })
      .catch((err) => {
        console.error('[Home] Auto-login failed', err);
      });
  }, []);

  const navigateToGame = async () => {
    setError('');
    setSuccess('');
    console.log('my username is', name);

    try {
      const res = await updateUserName(name);
      if (res.success) {
        if (typeof window !== 'undefined' && name.trim() && isSessionActive) {
          localStorage.setItem('username', name.trim());
        }
        setSuccess('Username updated Successfully !!');
        setError('');
        // After successful save, navigate to game
        navigate('/game');
      } else {
        // Handle specific error messages from the server
        const errorMessage = res.message?.toLowerCase() || 'internal error';
        if (errorMessage.includes('internal error')) {
          setError('username already exist or Please choose a different one.');
        } else {
          setError(res.message || 'Failed to update username');
        }
        setSuccess('');
      }
    } catch (err) {
      console.error('Error updating username:', err);
      setError('An error occurred while updating your username. Please try again.');
      setSuccess('');
    }
  };

  // Save name to localStorage when it changes
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
  };

  const navigate = useNavigate();

  // Handle skip name entry
  const skipForNow = () => {
    if (isSessionActive) {
      // const defaultName = 'Player' + Math.floor(Math.random() * 1000);
      // setName(defaultName);
      // localStorage.setItem('username', defaultName);
      // setSuccess('');
      // // Redirect to game page after a short delay to show the success message
      setTimeout(() => {
        navigate('/game');
      }, 500);
    }
  };

  // styles moved to CSS classes in home.css
  // const containerStyle = {
  //   background: 'linear-gradient(135deg, #1B003F 0%, #0A001F 100%)',
  //   minHeight: '100vh',
  //   display: 'flex',
  //   flexDirection: 'column',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   padding: '20px',
  //   boxSizing: 'border-box'
  // };

  return (
    <div className="home-page">
      <div className={`content-container ${isSessionActive ? 'session-active' : ''}`}>
        <div className="content-wrap" >
          <img src={logo2} alt="" className="logo-circle" />
          <div className="hero-title">GUESS THE AI</div>
          <div>
            <WalletConnect />
          </div>
          {
            isSessionActive &&
            <div className="name-input-container" >
              <div className="input-label">Enter user name here</div>
              <div>
              </div>
              <div className="input-with-button">
                <span className="input-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.761 0 5-2.686 5-6s-2.239-6-5-6-5 2.686-5 6 2.239 6 5 6zm0 2c-4.337 0-8 3.134-8 7v1h16v-1c0-3.866-3.663-7-8-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && name.trim()) {
                      navigateToGame();
                    }
                  }}
                  className="name-input"
                  maxLength={50}
                  placeholder="Type your name"
                  autoFocus
                />

                <button
                  className="enter-button"
                  onClick={() => name.trim() && navigateToGame()}
                  disabled={!name.trim()}
                >
                  Save &amp; continue
                </button>
              </div>

              <div className="status-row">
                {success && (
                  <span className="status success">{success}</span>
                )}
                {!success && error && (
                  <span className="status error">{error}</span>
                )}
              </div>
              <div style={{
                width: '100%',
                textAlign: 'center'
              }}>
                <button
                  onClick={skipForNow}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textDecoration: 'underline',
                    padding: '5px 10px',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    //  opacity: 0.8,
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  Skip for now
                </button>
              </div>

            </div>
          }
          <div >
            <img
              src={og}
              alt=""
              style={{
                height: '40px',
                border: '1px solid #ffffff',
                padding: '8px',
                borderRadius: '10px',
                marginBottom: '30px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
  // return (
  //   <div 
  //     className="home-container"
  //     style={isConnected ? {} : containerStyle}
  //   >
  //     {
  //       !isConnected &&
  //       <div style={{
  //         position: 'fixed',
  //         top: '50%',
  //         left: '50%',
  //         transform: 'translate(-50%, -50%)',
  //         textAlign: 'center',
  //         zIndex: 1
  //       }}
  //       className='base-image'
  //       >
  //         <div style={{ position: 'relative', display: 'inline-block' }}>
  //           <img 
  //             src={Base} 
  //             alt="Base" 
  //             style={{
  //               maxWidth: '100%',
  //               height: 'auto',
  //               display: 'block'
  //             }}
  //           />
  //           <img 
  //             src={Icon} 
  //             alt="Icon" 
  //             style={{
  //               position: 'absolute',
  //               top: '50%',
  //               left: '50%',
  //               transform: 'translate(-50%, -50%)',
  //               maxWidth: '60%',
  //               maxHeight: '60%'
  //             }}
  //           />
  //         </div>
  //       </div>
  //     }
  //     <div>
  //       <WalletConnect />
  //     </div>
  //     {isConnected && (
  //       <>
  //         <div className="search-icon-container">
  //           <img 
  //             src={SearchIcon} 
  //             alt="Search" 
  //             className="search-icon"
  //           />
  //         </div>
  //         <div className="name-input-container">
  //           <div className="input-label">Enter user name here</div>
  //           <div>
  //             {error && <span style={{color:'red',fontSize:'12px'}}>{error}</span>}
  //           </div>
  //           <div className="input-with-button">
  //             <input
  //               type="text"
  //               value={name}
  //               onChange={handleNameChange}
  //               onKeyDown={(e) => {
  //                 if (e.key === 'Enter' && name.trim()) {
  //                   navigateToGame();
  //                 }
  //               }}
  //               className="name-input"
  //               maxLength={50}
  //               placeholder="Type your name"
  //               autoFocus
  //             />
  //             <button 
  //               className="enter-button" 
  //               onClick={() => name.trim() && navigateToGame()}
  //               disabled={!name.trim()}
  //             >
  //               <svg 
  //                 width="24" 
  //                 height="24" 
  //                 viewBox="0 0 24 24" 
  //                 fill="none" 
  //                 xmlns="http://www.w3.org/2000/svg"
  //               >
  //                 <path 
  //                   d="M5 12H19M19 12L12 5M19 12L12 19" 
  //                   stroke="currentColor" 
  //                   strokeWidth="2" 
  //                   strokeLinecap="round" 
  //                   strokeLinejoin="round"
  //                 />
  //               </svg>
  //             </button>
  //           </div>
  //         </div>
  //       </>
  //     )}
  //   </div>
  // );
};

export default Home;
