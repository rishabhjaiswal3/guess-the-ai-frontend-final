import muscleRewardImage from "@highway-hustle/assets/cars/muscle.png";

export type ContestRewardStatus = "locked" | "eligible" | "granted";

export type ContestRewardPayload = {
  id?: string;
  title?: string;
  targetStreak?: number;
  currentBestStreak?: number;
  rewardId?: string;
  rewardType?: string;
  destinationGame?: string;
  unlocked?: boolean;
  granted?: boolean;
  justGranted?: boolean;
  status?: ContestRewardStatus;
  note?: string;
};

export type ContestRewardDetails = {
  id: string;
  title: string;
  subtitle: string;
  label: string;
  rewardId: string;
  rewardType: string;
  destinationGame: string;
  targetStreak: number;
  currentBestStreak: number;
  unlocked: boolean;
  granted: boolean;
  justGranted: boolean;
  status: ContestRewardStatus;
  note: string;
  progressPercent: number;
  image: string;
};

export const HIGHWAY_HUSTLE_CONTEST_EVENT = "gta:contest-reward-unlocked";

const DEFAULT_TARGET_STREAK = 10;
const DEFAULT_REWARD_NOTE = "Use the same wallet in Highway Hustle and this reward appears in your garage.";

const toSafeNumber = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.trunc(numeric));
};

export const resolveContestRewardDetails = (
  reward?: ContestRewardPayload | null,
  fallbackBestStreak = 0
): ContestRewardDetails => {
  const targetStreak = Math.max(1, toSafeNumber(reward?.targetStreak || DEFAULT_TARGET_STREAK));
  const currentBestStreak = toSafeNumber(
    reward?.currentBestStreak ?? fallbackBestStreak
  );
  const granted = Boolean(reward?.granted);
  const unlocked = Boolean(
    reward?.unlocked ?? (currentBestStreak >= targetStreak || granted)
  );
  const status = (reward?.status ||
    (granted ? "granted" : unlocked ? "eligible" : "locked")) as ContestRewardStatus;
  const progressPercent = Math.min(
    100,
    Math.round((Math.min(currentBestStreak, targetStreak) / targetStreak) * 100)
  );

  return {
    id: reward?.id || "highway_hustle_muscle_streak_10",
    title: reward?.title || "Muscle Monster",
    subtitle: "Highway Hustle Reward",
    label: "Epic vehicle unlock",
    rewardId: reward?.rewardId || "muscle",
    rewardType: reward?.rewardType || "vehicle",
    destinationGame: reward?.destinationGame || "highway_hustle",
    targetStreak,
    currentBestStreak,
    unlocked,
    granted,
    justGranted: Boolean(reward?.justGranted),
    status,
    note: reward?.note || DEFAULT_REWARD_NOTE,
    progressPercent,
    image: muscleRewardImage,
  };
};

export const maybeDispatchContestRewardUnlocked = (
  reward?: ContestRewardPayload | null
) => {
  if (typeof window === "undefined" || !reward?.justGranted) return;

  window.dispatchEvent(
    new CustomEvent(HIGHWAY_HUSTLE_CONTEST_EVENT, {
      detail: reward,
    })
  );
};
