import { useEffect, useState } from 'react';
import DemonImage from '../../assets/demon.webp';
import { getProfile } from '../../api/auth';
import './profile.css';

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

  const displayRank = typeof profileData?.rank !== 'undefined' && profileData?.rank !== null
    ? profileData.rank
    : '--';

  const walletLabel = profileData?.walletAddress
    ? (profileData?.walletAddress || 'Wallet connected')
    : 'Not connected';

  return (
    <div className="profile-page" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="profile-container" style={{padding:"10px"}} >
        <header className="profile-header">
          <div style={{ width: "100%", marginLeft: "10px" }}>
            <h1 className="player-name">{displayName}</h1>
            <p className="wallet" title={walletLabel} style={{ fontSize: '12px' }}>
              {walletLabel}
            </p>
          </div>
          <div className="rank-box" style={{ minWidth: "190px", display: 'flex', justifyContent: 'space-between', padding: "10px" }}>
            <span style={{ fontSize: "25px", fontWeight: 'bold' }}>RANK :</span>
            <span className="rank-badge">{displayRank}</span>
          </div>
        </header>

        <section className="profile-card">
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

          <div className="badge" style={{ marginTop: '0px', padding: "20px 10px" }}>
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
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            <span className="badge-title" style={{ minWidth: "200px" }}>{profileData?.dungeonTitle}</span>
          </div>
        </section>
      </div>
    </div>
  );
};
export default Profile;
