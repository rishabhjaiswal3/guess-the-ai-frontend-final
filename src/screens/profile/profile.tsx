import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import clips from '../../assets/Clip.png';
import DemonImage from '../../assets/Demon .png';
import { getProfile } from '../../api/auth';
import './profile.css';
import useSessionSource from '../../hooks/useSessionSource';

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
  return (
    <div className="profile-page profile-bg">
      <img src={clips} alt="Decor bottom" className="profile-decor-bottom" />
      <div className="profile-container">
        <header className="profile-header">
          <div className="player-info">
            <h1 className="player-name">{profileData?.username ?? "USER"}</h1>
            <p className="wallet" style={{ wordBreak: 'break-all' }}>
              {isSessionActive ? profileData?.walletAddress : "Not Connected"}
            </p>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'6px'}}>
            <span className="rank-text">RANK</span>
            <span className="rank-badge">{profileData?.rank}</span>
          </div>
        </header>

        <section className="profile-card" style={{ marginTop: "30px" }}>
          <div className="stats">
             <div className="stat" style={{ minWidth: "300px", width: "100%", display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="icon">⚡</span>
                <span className="label" style={{ marginRight: '10px', margin: "auto", textAlign: "center" }}>Best STREAK</span>
              </div>
              <h2>{profileData?.streak || 0}</h2>
            </div>
            <hr/>
            <div className="stat" style={{ minWidth: "300px", width: "100%", display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="icon">⚡</span>
                <span className="label" style={{ marginRight: '10px', margin: "auto", textAlign: "center" }}>CURRENT STREAK</span>
              </div>
              <h2>{profileData?.currentStreak || 0}</h2>
            </div>
            <hr />
            <div className="stat" style={{ minWidth: "300px", width: "100%", display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="rank-badge small">B</span>
                <span className="label" style={{ marginRight: '10px', margin: "auto", textAlign: "center" }}>CORRECT ANSWERS</span>
              </div>
              <h2>{ profileData?.correctAnswers || 0}</h2>
            </div>
          </div>

          <div className="badge" style={{ marginTop: '20px' }}>
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
