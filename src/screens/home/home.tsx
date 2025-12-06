import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy, useCreateWallet } from '@privy-io/react-auth';
import WalletConnect from '../../components/WalletConnect';
import './home.css';
import { updateUserName } from '../../api/auth';
import useSessionSource from '../../hooks/useSessionSource';
import clips from '../../assets/Clip.png';
import Clipup from '../../assets/ClipUp.png';
import logo2 from '../../assets/Logo2.png';
import og from '../../assets/og.png';

const Home = () => {
  const { authenticated, user } = usePrivy();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isIframeSession, hasToken } = useSessionSource();
  const isSessionActive = authenticated || isIframeSession || hasToken;
  const { createWallet } = useCreateWallet();
  
  // Check and create wallet for new email users
  useEffect(() => {
    const checkAndCreateWallet = async () => {
      if (authenticated && user && createWallet) {
        // Check if user has a wallet
        const hasWallet = user.wallet?.address || 
          (user.linkedAccounts || []).some(acc => acc.type === 'wallet');
        
        if (!hasWallet) {
          try {
            // Create a wallet for the user
            await createWallet();
            console.log('Wallet created successfully');
          } catch (error) {
            console.error('Error creating wallet:', error);
          }
        }
      }
    };

    checkAndCreateWallet();
  }, [authenticated, user, createWallet]);

  // Load name from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedName = localStorage.getItem('username');
    if (savedName) {
      setName(savedName);
    }
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
          localStorage.setItem('userName', name.trim());
        }
        setSuccess('Username updated Successfully !!');
        setError('');
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
      // localStorage.setItem('userName', defaultName);
      // setSuccess('');
      // // Redirect to game page after a short delay to show the success message
      setTimeout(() => {
        navigate('/game');
      }, 500);
    }
  };

  // styles moved to CSS classes in home.css

  return (
    <div 
        className={`home-container ${isSessionActive ? '' : 'home-bg'}`}
      >
        <img src={clips} alt="Decor bottom" className="decor-bottom" />
        <div className="content-wrap">
          <img src={logo2} alt="" className="logo-circle"/>
          <div className="hero-title">
            <img src={Clipup} alt="Decor top" className="decor-top" />
            GUESS THE AI
          </div>
          <div>
            <WalletConnect />
          </div>
          {
            isSessionActive &&
            <div className="name-input-container">
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
                 <svg 
                   width="24" 
                   height="24" 
                   viewBox="0 0 24 24" 
                   fill="none" 
                   xmlns="http://www.w3.org/2000/svg"
                 >
                   <path 
                     d="M5 12H19M19 12L12 5M19 12L12 19" 
                     stroke="currentColor" 
                     strokeWidth="2" 
                     strokeLinecap="round" 
                     strokeLinejoin="round"
                   />
                 </svg>
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
            width:'100%',
            marginTop:'10px',
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
                Skip
              </button>
            </div>
      
          </div>
          }
          <div>
            <img src={og} alt="" style={{height:"40px",border:'1px solid #ffffff',padding:"8px",borderRadius:'10px',marginTop:"20px"}} />
          </div>
        </div>
      </div>
  )
  // return (
  //   <div 
  //     className="home-container"
  //     style={isConnected ? {} :containerStyle}
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
  //      <div>
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
  //           {error && <span style={{color:'red',fontSize:'12px'}}>{error}</span>}
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
