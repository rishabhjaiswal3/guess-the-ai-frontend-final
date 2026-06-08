import { apiRequest } from "@/lib/apiClient";
import { buildImageUrl, buildFallbackImageUrl } from "@/lib/imageUrl";
import {
  maybeDispatchContestRewardUnlocked,
  type ContestRewardPayload,
} from "@/lib/highwayHustleContest";

export type ModeQuestionImage = {
  id: string;
  hash: string;
  url: string;
  imageUrl: string;
  fallbackImageUrl?: string;
  percentage?: number;
  percentageLabel?: string;
};

export type ModeQuestionResponse = {
  mode: string;
  roundId?: string | null;
  templateKey?: string | null;
  questionText?: string | null;
  questionSubtext?: string | null;
  variant?: string | null;
  askingFor?: "ai" | "human" | null;
  imageCount?: number;
  config?: {
    timeLimitSec?: number | null;
    lives?: number | null;
  } | null;
  images: ModeQuestionImage[];
};

type ApiSuccess<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type ModeAnswerResult = {
  hash: string;
  truth?: "ai" | "human" | null;
  selected?: boolean;
  shouldSelect?: boolean;
  isCorrect?: boolean;
};

export type ModeAnswerResponse = {
  mode: string;
  results: ModeAnswerResult[];
  score?: {
    delta?: number;
    correctCount?: number;
    wrongCount?: number;
  };
  profile?: {
    correctAnswers?: number;
    currentStreak?: number;
    streak?: number;
  } | null;
  askingFor?: "ai" | "human";
  selectedHash?: string;
  oddHash?: string;
  variant?: string;
  comboUsed?: number;
  contestReward?: ContestRewardPayload | null;
};

const withImageUrl = (question: Omit<ModeQuestionResponse, "images"> & { images?: Array<{ id?: string; hash?: string; url?: string; percentage?: number; percentageLabel?: string }> }): ModeQuestionResponse => {
  const images = (question.images || [])
    .filter((item) => item && typeof item.hash === "string")
    .map((item) => {
      const hash = item.hash as string;
      return {
        id: item.id || hash,
        hash,
        url: item.url || buildImageUrl(hash),
        imageUrl: buildImageUrl(hash) || item.url || "",
        fallbackImageUrl: buildFallbackImageUrl(hash),
        ...(item.percentage !== undefined ? { percentage: item.percentage } : {}),
        ...(item.percentageLabel ? { percentageLabel: item.percentageLabel } : {})
      };
    });

  return {
    ...question,
    images,
  };
};

const unwrap = async <T>(path: string, options?: Parameters<typeof apiRequest<ApiSuccess<T>>>[1]): Promise<T> => {
  const response = await apiRequest<ApiSuccess<T>>(path, options);
  return response?.data as T;
};

const submitModeAnswer = async <T extends ModeAnswerResponse>(path: string, body: unknown) => {
  const response = await unwrap<T>(path, {
    method: "POST",
    body,
  });
  maybeDispatchContestRewardUnlocked(response?.contestReward);
  return response;
};

export const getMultiSelectQuestion = async () => {
  const data = await unwrap<ModeQuestionResponse>("/game/multiselect/question");
  return withImageUrl(data);
};

export const submitMultiSelectAnswer = async (payload: {
  hashes: string[];
  selectedHashes: string[];
  askingFor?: "ai" | "human";
}) => {
  return submitModeAnswer<ModeAnswerResponse>("/game/multiselect/answer", payload);
};

export const getDuelQuestion = async (variant: "normal" | "speed") => {
  const data = await unwrap<ModeQuestionResponse>(`/game/duel/question?variant=${encodeURIComponent(variant)}`);
  return withImageUrl(data);
};

export const submitDuelAnswer = async (payload: {
  hashes: string[];
  selectedHash: string;
  askingFor?: "ai" | "human";
  variant?: "normal" | "speed";
}) => {
  return submitModeAnswer<ModeAnswerResponse>("/game/duel/answer", payload);
};

export const getOddOneOutQuestion = async () => {
  const data = await unwrap<ModeQuestionResponse>("/game/oddoneout/question");
  return withImageUrl(data);
};

export const submitOddOneOutAnswer = async (payload: {
  hashes: string[];
  selectedHash: string;
  askingFor?: "ai" | "human";
}) => {
  return submitModeAnswer<ModeAnswerResponse>("/game/oddoneout/answer", payload);
};

export const getCardFlipDeck = async () => {
  const data = await unwrap<ModeQuestionResponse>("/game/cardflip/deck");
  return withImageUrl(data);
};

export const submitCardFlipAnswer = async (payload: {
  hash: string;
  guess: "ai" | "human";
}) => {
  return submitModeAnswer<ModeAnswerResponse>("/game/cardflip/answer", payload);
};

export const getRapidFireQuestion = async () => {
  const data = await unwrap<ModeQuestionResponse>("/game/rapidfire/question");
  return withImageUrl(data);
};

export const submitRapidFireAnswer = async (payload: {
  hash: string;
  guess: "ai" | "human";
  combo: number;
}) => {
  return submitModeAnswer<ModeAnswerResponse>("/game/rapidfire/answer", payload);
};

export type HintResponse = {
  ready: boolean;
  hint?: string;
};

export const pollHint = async (roundId: string): Promise<HintResponse> => {
  return unwrap<HintResponse>(`/game/hint/${roundId}`);
};
