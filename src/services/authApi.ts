import { apiRequest } from "@/lib/apiClient";

export type LoginPayload = {
  token: string;
  username?: string;
  nameUpdated?: boolean;
  user?: Record<string, unknown>;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
  code?: string;
  data: LoginPayload;
};

export type PrivyMetaData = {
  address?: string;
  walletAddress?: string;
  embeddedWalletAddress?: string;
  discord?: string;
  discordUserId?: string;
  email?: string;
  type?: string;
  privyUserId?: string;
  otherId?: string;
  otherIds?: string[];
  chainId?: string | number;
  providerName?: string;
};

export type LoginRequest = {
  walletAddress?: string | null;
  jwt?: string;
  sessionWallet?: string;
  source?: string;
  email?: string;
  privyUserId?: string;
  discord?: string;
  discordUserId?: string;
  otherId?: string;
  otherIds?: string[];
  privyMetaData?: PrivyMetaData;
};

export type ProfilePayload = {
  username?: string;
  walletAddress?: string;
  rank?: string | number;
  streak?: number;
  currentStreak?: number;
  correctAnswers?: number;
  dungeonTitle?: string;
  campaign?: Record<string, unknown>;
};

export type ProfileResponse = {
  success: boolean;
  data: ProfilePayload;
  message?: string;
};

export type UpdateUsernameResult = {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

export type WalletChallengeResponse = {
  success: boolean;
  data: {
    walletAddress: string;
    challengeMessage: string;
    nonce: string;
    issuedAt: string;
    expiresAt: string;
    expiresInSec: number;
  };
};

export type SiweLoginResponse = {
  success: boolean;
  data: {
    token: string;
    username?: string;
    walletAddress: string;
    authMethod: string;
  };
  message?: string;
};

export const getWalletChallenge = async (
  walletAddress: string
): Promise<WalletChallengeResponse> => {
  return apiRequest<WalletChallengeResponse>("/auth/challenge", {
    method: "POST",
    body: { walletAddress },
    auth: false,
  });
};

export const siweWalletLogin = async (
  message: string,
  signature: string
): Promise<SiweLoginResponse> => {
  return apiRequest<SiweLoginResponse>("/auth/wallet-login", {
    method: "POST",
    body: { message, signature },
    auth: false,
  });
};

export const loginV2 = async (payload: LoginRequest): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>("/v2/login", {
    method: "POST",
    body: payload,
    auth: false,
  });
};

export const getProfile = async (): Promise<ProfileResponse> => {
  return apiRequest<ProfileResponse>("/user/profile");
};

export const updateUsername = async (username: string): Promise<UpdateUsernameResult> => {
  return apiRequest<UpdateUsernameResult>("/user/updateUsername", {
    method: "PUT",
    body: { username },
  });
};
