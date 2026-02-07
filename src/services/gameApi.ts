import { apiRequest } from "@/lib/apiClient";
import { buildImageUrl } from "@/lib/imageUrl";

export type GameImageResponse = {
  hash: string;
  imageId?: string;
  url: string;
};

export type GameImageWithUrl = GameImageResponse & {
  imageUrl: string;
};

export type GameBatchResponse = {
  image_list: GameImageResponse[];
};

/**
 * Transform API response to include built image URL
 */
export const withImageUrl = (image: GameImageResponse): GameImageWithUrl => ({
  ...image,
  imageUrl: buildImageUrl(image.hash),
});

export type SubmitAnswerResponse = {
  correct?: boolean;
  isCorrect?: boolean;
  truth?: "ai" | "human" | null;
  profile?: {
    correctAnswers?: number;
    currentStreak?: number;
    streak?: number;
  };
  gateStats?: Record<string, unknown> | null;
  onchain?: { transactionHash?: string } | null;
};

export type SessionResponse = {
  success: boolean;
  data: {
    sessionId: string;
    startedAt: string;
    totalGuesses?: number;
    correctGuesses?: number;
  };
  message?: string;
};

export type EndSessionResponse = {
  success: boolean;
  data: {
    sessionId: string;
    startedAt: string;
    totalGuesses?: number;
    correctGuesses?: number;
    totals?: {
      correctAnswers?: number;
      currentStreak?: number;
    };
    onchain?: { transactionHash: string } | null;
  };
  message?: string;
};

export const getNextImage = async (): Promise<GameImageResponse | null> => {
  return apiRequest<GameImageResponse | null>("/game/next", {
    method: "POST",
    body: {},
  });
};

export const getNext10Images = async (): Promise<GameBatchResponse> => {
  return apiRequest<GameBatchResponse>("/game/next10");
};

/**
 * Fetch next 10 images with built URLs
 */
export const getNext10ImagesWithUrls = async (): Promise<GameImageWithUrl[]> => {
  const response = await getNext10Images();
  if (!response?.image_list?.length) {
    return [];
  }
  return response.image_list.map(withImageUrl);
};

export const submitAnswer = async (
  hash: string,
  guess: "ai" | "human",
  isBackup = false
): Promise<SubmitAnswerResponse> => {
  return apiRequest<SubmitAnswerResponse>("/game/ans", {
    method: "POST",
    body: { hash, guess, isBackup },
  });
};

export const startSession = async (): Promise<SessionResponse> => {
  return apiRequest<SessionResponse>("/game/session/start", {
    method: "POST",
    body: {},
  });
};

export const endSession = async (sessionId: string, completed = true): Promise<EndSessionResponse> => {
  return apiRequest<EndSessionResponse>("/game/session/end", {
    method: "POST",
    body: { sessionId, completed },
  });
};
