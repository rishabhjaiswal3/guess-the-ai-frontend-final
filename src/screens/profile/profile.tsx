import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import clips from '../../assets/Clip.png';
import DemonImage from '../../assets/Demon .png';
import { getProfile } from '../../api/auth';
import './profile.css';
import useSessionSource from '../../hooks/useSessionSource';
import BgImage from '../../assets/Bg.png';
import GifBg from '../../assets/Guesstheaibg.gif';

type ProfileData = {
  username?: string;
  walletAddress?: string;
  rank?: string | number;
  streak?: number;
  currentStreak?: number;
  correctAnswers?: number;
  dungeonTitle?: string;
};

const Profile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [gifLoaded, setGifLoaded] = useState(false);
  const { authenticated } = usePrivy();
  const { isIframeSession, hasToken } = useSessionSource();
  const isSessionActive = authenticated || (isIframeSession && hasToken);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        setProfileData(profile?.data?.data ?? null);
      } catch (error) {
        console.error('Failed to load profile', error);
        setProfileData(null);
      }
    };

    fetchProfile();
  }, []);

  const displayName = profileData?.username && profileData.username.trim().length
    ? profileData.username
    : 'Player';

  const displayDungeonTitle = profileData?.dungeonTitle && profileData.dungeonTitle.trim().length
    ? profileData.dungeonTitle
    : 'Demon World Runner';

  const displayRank = typeof profileData?.rank !== 'undefined' && profileData?.rank !== null
    ? profileData.rank
    : '--';

  const walletLabel = profileData?.walletAddress
    ? (profileData?.walletAddress || 'Wallet connected')
    : 'Not connected';

  return (
    <div className="profile-page">
      {/* Background with smooth loading */}
      <div className="background-container">
        {/* Static background shown until GIF is loaded */}
        <img
          src={BgImage}
          alt="Background"
          className={`background-image ${gifLoaded ? 'fade-out' : 'fade-in'}`}
          draggable={false}
        />

        {/* Animated GIF background */}
        <img
          src={GifBg}
          alt="Animated Background"
          onLoad={() => setGifLoaded(true)}
          className={`background-gif ${gifLoaded ? 'fade-in' : 'fade-out'}`}
          draggable={false}
        />
      </div>
      {/* <img src={clips} alt="Decor bottom" className="profile-decor-bottom" /> */}
      <div className="profile-container">
        <header className="profile-header">
          {/* <div className="player-avatar-pill" >
            <span className="avatar-initial">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div> */}
          <div style={{width:"100%",marginLeft:"10px"}}>
            <h1 className="player-name">{displayName}</h1>
            <p className="wallet" title={walletLabel} style={{fontSize:'12px'}}>
              {walletLabel}
            </p>
          </div>
          <div className="rank-box" style={{minWidth:"190px",display:'flex',justifyContent:'space-between',padding:"10px"}}>
            <span style={{fontSize:"25px",fontWeight:'bold'}}>RANK :</span>
            <span className="rank-badge">{displayRank}</span>
          </div>
        </header>

        <section className="profile-card" style={{ marginTop: "30px" }}>
          <div className="stats">
            <div className="stat">
              <div className="stat-label-group">
                <span className="icon">⚡</span>
                <span className="label">Best streak</span>
              </div>
              <h2>{profileData?.streak || 0}</h2>
            </div>
            <hr />
            <div className="stat">
              <div className="stat-label-group">
                <span className="icon">🔥</span>
                <span className="label">Current streak</span>
              </div>
              <h2>{profileData?.currentStreak || 0}</h2>
            </div>
            <hr />
            <div className="stat">
              <div className="stat-label-group">
                <span className="rank-badge small">★</span>
                <span className="label">Correct answers</span>
              </div>
              <h2>{profileData?.correctAnswers || 0}</h2>
            </div>
          </div>

          <div className="badge" style={{ marginTop: '0px',padding:"20px 10px" }}>
            <div className="badge-image-container">
              <img
                src={DemonImage}
                alt="Demon World Runner"
                className="badge-img"
                onError={(e) => {
                  console.error('Failed to load Demon image');
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = 'https://i.ibb.co/7yqzP9x/dragon-badge.png';
                }}
                style={{ maxWidth: '100%', height: 'auto', display: 'block'}}
              />
            </div>
            <span className="badge-title" style={{minWidth:"200px"}}>{profileData?.dungeonTitle}</span>
          </div>
        </section>
      </div>
    </div>
  );
};
export default Profile;
