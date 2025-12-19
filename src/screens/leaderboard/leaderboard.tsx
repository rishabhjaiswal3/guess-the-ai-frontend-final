import { useEffect, useState, useCallback } from 'react';
import './leaderboard.css';
import clips from '../../assets/Clip.png';
import LeaderboardLogo from '../../assets/Leaderboard-logo.png';
import { getLeaderboard } from '../../api/auth';
import BgImage from '../../assets/Bg.png';
import GifBg from '../../assets/Guesstheaibg.mp4';

type LeaderboardEntry = {
  username: string;
  correctAnswers: number;
  currentStreak: number;
  streak: number;
  rank: number;
};

const Leaderboard = () => {
  const [leaderboard,setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);
 
  const getLeaderboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const leaderboard = await getLeaderboard();
      setLeaderboard(leaderboard.data);
    } catch (err) {
      console.log('Error fetching leaderboard', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=> {
    getLeaderboardData();
  },[getLeaderboardData])

  useEffect(() => {
    const updateIsMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 600);
      }
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);

    return () => {
      window.removeEventListener('resize', updateIsMobile);
    };
  }, []);

  const getUserName = (userName?: string) => {
    const name = userName ?? '';

    if (!isMobile) {
      return name;
    }

    if (name.length <= 10) {
      return name;
    }

    return `${name.slice(0, 9)}...`;
  };

  return (
    <div className="leaderboard-page">
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
        <video
  autoPlay
  muted
  loop
  playsInline
  className="video-bg"
>
  <source src={GifBg} type="video/mp4" />
</video>
      </div>
      
      <div className="leaderboard-container">
        <div className="leaderboard-content">
          <div className="leaderboard-logo-container">
            <img 
              src={LeaderboardLogo} 
              alt="Leaderboard" 
              className="leaderboard-logo"
            />
          </div>
          <div className="leaderboard-list">
            <div className="leaderboard-item leaderboard-header">
              <span>Players</span>
              <span>Correct</span>
              <span>Streak</span>
              <span>Best</span>
              <span>Rank</span>
            </div>
          {loading ? (
            <div className="lb-loader-wrap" role="status" aria-live="polite" aria-label="Loading leaderboard">
              <div className="lb-spinner" />
              <div className="lb-loader-text">Loading leaderboard…</div>
            </div>
          ) : (
            leaderboard.map((player) => (
              <div key={player.rank} className="leaderboard-item">
                <span className="lb-name" title={player.username} data-full={player.username}>{getUserName(player.username)}</span>
                <span>{player.correctAnswers} pts</span>
                <span>{player.currentStreak}</span>
                <span>{player.streak}</span>
                <span className="rank-badge small">{player.rank}</span>
              </div>
            ))
          )}
          </div>
          {error && (
            <div className="lb-error-row">
              <span>{error}</span>
              <button className="lb-retry" onClick={getLeaderboardData}>Retry</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
