import { useCallback, useEffect, useState } from 'react';
import { Loader } from '../../components/Loader';
import './leaderboard.css';
import LeaderboardLogo from '../../assets/Leaderboard-logo.png';
import {
  getGateLeaderboard,
  getLeaderboard,
  type LeaderboardEntry,
} from '../../api/auth';

type LeaderboardType = 'alltime' | 'campaign';

const LEADERBOARD_CONFIG: Record<
  LeaderboardType,
  {
    title: string;
    description: string;
    buttonLabel: string;
  }
> = {
  alltime: {
    title: 'All-Time Legends',
    description: '',
    buttonLabel: 'Show all-time stats',
  },
  campaign: {
    title: 'Gate Campaign Champion',
    description: '',
    buttonLabel: 'Focus on champion board',
  },
};

const Leaderboard = () => {
  const [leaderboards, setLeaderboards] = useState<
    Record<LeaderboardType, LeaderboardEntry[]>
  >({
    alltime: [],
    campaign: [],
  });
  const [loadingState, setLoadingState] = useState<Record<LeaderboardType, boolean>>({
    alltime: true,
    campaign: true,
  });
  const [errorState, setErrorState] = useState<Record<LeaderboardType, string>>({
    alltime: '',
    campaign: '',
  });
  const [activeBoard, setActiveBoard] = useState<LeaderboardType>('alltime');

  const fetchLeaderboard = useCallback(
    async (type: LeaderboardType) => {
      setLoadingState((prev) => ({ ...prev, [type]: true }));
      setErrorState((prev) => ({ ...prev, [type]: '' }));

      const fetcher =
        type === 'campaign' ? getGateLeaderboard : getLeaderboard;

      try {
        const response = await fetcher();
        if (!response.success) {
          throw new Error(response.message || 'Unknown error');
        }
        setLeaderboards((prev) => ({ ...prev, [type]: response.data || [] }));
      } catch (error) {
        console.error(
          `[leaderboard] Failed to load ${type} leaderboard`,
          error,
        );
        setErrorState((prev) => ({
          ...prev,
          [type]:
            (error as Error).message ||
            'Failed to load leaderboard. Try again later.',
        }));
      } finally {
        setLoadingState((prev) => ({ ...prev, [type]: false }));
      }
    },
    [],
  );

  useEffect(() => {
    fetchLeaderboard('alltime');
    fetchLeaderboard('campaign');
  }, [fetchLeaderboard]);

  const getUserName = (userName?: string) => {
    const name = userName ?? '';
    if (name.length <= 10) {
      return name;
    }
    return `${name.slice(0, 9)}...`;
  };

  const champion = leaderboards.campaign[0];

  const renderEntries = (entries: LeaderboardEntry[]) =>
    entries.map((player, index) => (
      <div key={`${player.username}-${player.rank}`} className="leaderboard-item">
        <span>{index + 1}</span>
        <span>{getUserName(player.username)}</span>
        <span>{player.correctAnswers} pts</span>
        <span>{player.currentStreak}</span>
        <span>{player.streak}</span>
        <span className="rank-badge small">{player.rank}</span>
      </div>
    ));

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <div className="leaderboard-header">
        <div className="leaderboard-hero">
          <img
            src={LeaderboardLogo}
            alt="Leaderboard banner"
            className="leaderboard-hero-logo"
          />
          <div className="leaderboard-hero-text">
            <div>
              <h1>Leaderboards</h1>
              <p className="leaderboard-description">
                Track active champions and the all-time legends together.
              </p>
            </div>
            <div >
              <strong>Gate campaign stats refresh every 2 mins Reload the board when you need the latest snapshot.</strong>
            </div>
          </div>
        </div>
        <div className="leaderboard-tabs">
          {(Object.keys(LEADERBOARD_CONFIG) as LeaderboardType[]).map(
            (type) => (
              <button
                key={type}
                className={`leaderboard-tab ${
                  activeBoard === type ? 'active' : ''
                }`}
                onClick={() => setActiveBoard(type)}
              >
                {type === 'campaign'
                  ? 'Gate Champion'
                  : 'All-Time Legends'}
              </button>
            ),
          )}
        </div>
        </div>

       
        <div className="leaderboard-grid">
          {(Object.keys(LEADERBOARD_CONFIG) as LeaderboardType[]).map(
            (type) => {
              const entries = leaderboards[type];
              const loading = loadingState[type];
              const error = errorState[type];

              return (
                <section
                  key={type}
                  className={`leaderboard-panel ${
                    activeBoard === type ? 'active' : ''
                  }`}
                >
                  <header className="leaderboard-panel-header">
                    <div>
                      <h2>{LEADERBOARD_CONFIG[type].title}</h2>
                      <p>{LEADERBOARD_CONFIG[type].description}</p>
                    </div>
                    {/* <button
                      className="leaderboard-panel-switch"
                      onClick={() => setActiveBoard(type)}
                    >
                      {LEADERBOARD_CONFIG[type].buttonLabel}
                    </button> */}
                  </header>
                  <div className="leaderboard-panel-body">
                    {loading ? (
                      <div
                        className="lb-loader-wrap"
                        role="status"
                        aria-live="polite"
                        aria-label={`Loading ${type} leaderboard`}
                      >
                        <Loader size="lg" label="Loading leaderboard" />
                      </div>
                    ) : error ? (
                      <div className="leaderboard-panel-error">
                        <span>{error}</span>
                        <button
                          className="lb-retry"
                          onClick={() => fetchLeaderboard(type)}
                        >
                          Retry
                        </button>
                      </div>
                    ) : entries.length === 0 ? (
                      <div className="leaderboard-panel-empty">
                        No entries to show yet.
                      </div>
                    ) : (
                      <div className="leaderboard-list">
                        <div className="leaderboard-item leaderboard-header">
                          <span>Rank</span>
                          <span>Players</span>
                          <span>Correct</span>
                          <span>Streak</span>
                          <span>Best</span>
                          <span>Level</span>
                        </div>
                        {renderEntries(entries)}
                      </div>
                    )}
                  </div>
                </section>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
