import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type StatsProfile = {
  correctAnswers?: number;
  currentStreak?: number;
  streak?: number;
} | null | undefined;

type StatsSnapshot = {
  score: number;
  streak: number;
  bestStreak: number;
};

const toSnapshot = (profile?: StatsProfile, fallback?: Partial<StatsSnapshot>): StatsSnapshot => ({
  score:
    typeof profile?.correctAnswers === "number"
      ? profile.correctAnswers
      : fallback?.score ?? 0,
  streak:
    typeof profile?.currentStreak === "number"
      ? profile.currentStreak
      : fallback?.streak ?? 0,
  bestStreak:
    typeof profile?.streak === "number"
      ? profile.streak
      : fallback?.bestStreak ?? 0,
});

export const useGameProfileStats = () => {
  const { profile, refreshProfile } = useAuth();
  const [stats, setStats] = useState<StatsSnapshot>(() => toSnapshot(profile));

  useEffect(() => {
    setStats((prev) => toSnapshot(profile, prev));
  }, [profile?.correctAnswers, profile?.currentStreak, profile?.streak]);

  const applyProfileStats = useCallback((nextProfile?: StatsProfile, fallback?: Partial<StatsSnapshot>) => {
    const resolved = toSnapshot(nextProfile, {
      score: fallback?.score ?? stats.score,
      streak: fallback?.streak ?? stats.streak,
      bestStreak: fallback?.bestStreak ?? stats.bestStreak,
    });
    setStats(resolved);
    return resolved;
  }, [stats]);

  return {
    score: stats.score,
    streak: stats.streak,
    bestStreak: stats.bestStreak,
    applyProfileStats,
    refreshProfile,
  };
};
