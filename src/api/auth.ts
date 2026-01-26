import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import axiosRetry from 'axios-retry';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// Debug: log API base URL once on module load
// eslint-disable-next-line no-console
console.log(' ---- [api] Using API_BASE_URL:', API_BASE_URL || '(none)');

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

const API_RETRY_COUNT = Number(import.meta.env.VITE_API_RETRY_COUNT || 3);
axiosRetry(api, {
  retries: API_RETRY_COUNT,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 && status < 600;
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        const headers = config.headers ?? {};
        (headers as any).Authorization = `Bearer ${token}`;
        config.headers = headers;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("My error is ", error);
    if (error.response?.data?.message === 'You are not logged in! Please log in to get access.' || error.response?.data?.message ==
      "Invalid token or token expired. Please log in again.") {
      // Clear auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Redirect to home page which will handle the login flow
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

const apiInterceptor = <T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  api.request<T>({
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
  });

type ApiSuccessResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type LeaderboardEntry = {
  username: string;
  correctAnswers: number;
  currentStreak: number;
  streak: number;
  rank: number;
};

type LeaderboardPayload = ApiSuccessResponse<LeaderboardEntry[]> | LeaderboardEntry[];
type LeaderboardResponse = ApiSuccessResponse<LeaderboardEntry[]>;

const normalizeLeaderboardPayload = (payload: LeaderboardPayload): LeaderboardResponse => {
  if (Array.isArray(payload)) {
    return { success: true, data: payload };
  }

  return {
    success: payload.success !== false,
    message: payload.message,
    data: payload.data ?? [],
  };
};

type LoginPayload = {
  token: string;
  username?: string;
  nameUpdated?: boolean;
  user?: Record<string, unknown>;
};

type LoginResponse = ApiSuccessResponse<LoginPayload> & {
  code?: string;
};

type GameImageResponse = {
  hash?: string;
  imageId?: string;
  url?: string;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

type GameBatchResponse = {
  image_list: GameImageResponse[];
};

type ProfilePayload = {
  username?: string;
  walletAddress?: string;
  rank?: string | number;
  streak?: number;
  currentStreak?: number;
  correctAnswers?: number;
  dungeonTitle?: string;
};

type UpdateUsernameResult = {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

type SetAnswerResponse = {
  isCorrect?: boolean;
  correct?: boolean;
  data?: { isCorrect?: boolean; correct?: boolean };
  profile?: {
    correctAnswers?: number;
    currentStreak?: number;
  };
  [key: string]: unknown;
};

type IsGateUserEligibleResponse = {
  success?: boolean;
  isGateUserEligible?: boolean;
  isGalaxyUserEligible?: boolean;
};

type AwardGateUserResponse = {
  success?: boolean;
};


type PrivyMetaData = {
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
};

type LoginRequest = {
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

const hasNonEmptyString = (value?: unknown) =>
  typeof value === 'string' && value.trim().length > 0;

const hasLoginIdentifiers = (payload?: LoginRequest) => {
  if (!payload) return false;
  if (
    hasNonEmptyString(payload.walletAddress) ||
    hasNonEmptyString(payload.jwt) ||
    hasNonEmptyString(payload.privyUserId) ||
    hasNonEmptyString(payload.email) ||
    hasNonEmptyString(payload.discord) ||
    hasNonEmptyString(payload.discordUserId) ||
    hasNonEmptyString(payload.otherId)
  ) {
    return true;
  }
  if (Array.isArray(payload.otherIds) && payload.otherIds.some(hasNonEmptyString)) {
    return true;
  }
  if (!payload.privyMetaData) return false;
  return Object.values(payload.privyMetaData).some((value) => {
    if (Array.isArray(value)) return value.some(hasNonEmptyString);
    return hasNonEmptyString(value);
  });
};

const login = async (payload?: LoginRequest): Promise<LoginResponse | undefined> => {
  console.log("My payload is ", payload);
  if (!hasLoginIdentifiers(payload)) return undefined;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    // eslint-disable-next-line no-console
    console.log('[api/login] Existing JWT found, redirecting to /game');
    // window.location.href = '/#/game';
    return undefined;
  }
  try {
    // eslint-disable-next-line no-console
    console.log('[api/login] Sending /v2/login request', payload);
    const response = await apiInterceptor<ApiSuccessResponse<LoginPayload>>({
      method: 'post',
      url: '/v2/login',
      data: payload,
    });
    const responsePayload = response.data.data;
    const newToken = responsePayload.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
      const userName = responsePayload?.['username'] ?? "";
      localStorage.setItem('username', userName);

      window.dispatchEvent(new CustomEvent('presence:token-change', { detail: newToken }));
      window.dispatchEvent(new CustomEvent('presence:username-change', { detail: userName }));
      if (responsePayload.nameUpdated) {
        // window.location.href = '/#/game';
      }
    }
    // eslint-disable-next-line no-console
    console.log('[api/login] Login succeeded; token and username stored', {
      hasToken: !!newToken,
      username: responsePayload.username,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string; code?: string }>;
    const responseData = axiosError.response?.data;
    const fallbackPayload: LoginPayload = { token: '' };
    // eslint-disable-next-line no-console
    console.error('[api/login] Login failed', error);
    return {
      success: false,
      message: responseData?.message || 'Login failed',
      code: responseData?.code,
      data: fallbackPayload,
    };
  }
};

const fetchLeaderboard = async (
  endpoint: '/leaderboard/alltime' | '/leaderboard/gateUsers',
): Promise<LeaderboardResponse> => {
  try {
    const response = await apiInterceptor<LeaderboardPayload>({
      method: 'get',
      url: endpoint,
    });
    return normalizeLeaderboardPayload(response.data);
  } catch (error) {
    console.error(`Failed to fetch leaderboard ${endpoint}`, error);
    return {
      success: false,
      message: 'Failed to fetch leaderboard',
      data: [],
    };
  }
};

const getLeaderboard = async (): Promise<LeaderboardResponse> => fetchLeaderboard('/leaderboard/alltime');
const getGateLeaderboard = async (): Promise<LeaderboardResponse> => fetchLeaderboard('/leaderboard/gateUsers');

const getGameData = async (payload: Record<string, unknown> = {}): Promise<GameImageResponse> => {
  try {
    const response = await apiInterceptor<GameImageResponse>({
      method: 'post',
      url: '/game/next',
      data: payload,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch game data', error);
    return { success: false, message: 'Failed to fetch game data' };
  }
};

const getGameBatch = async (): Promise<GameBatchResponse> => {
  try {
    const response = await apiInterceptor<GameBatchResponse>({
      method: 'get',
      url: '/game/next10',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch next 10 images', error);
    return { image_list: [] };
  }
};

const getBackupImage = async (): Promise<GameImageResponse | null> => {
  try {
    const response = await apiInterceptor<GameImageResponse>({
      method: 'get',
      url: '/backup/game/nextimage',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch backup image:', error);
    return null;
  }
};

const setAnswer = async (
  hash: string,
  guess: 'ai' | 'human' = 'ai',
  extraPayload?: Record<string, unknown>,
): Promise<SetAnswerResponse | undefined> => {
  try {
    const response = await apiInterceptor<SetAnswerResponse>({
      method: 'post',
      url: '/game/ans',
      data: { hash, guess, ...(extraPayload ?? {}) },
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    return undefined;
  }
};

const updateUserName = async (username: string): Promise<UpdateUsernameResult> => {
  try {
    const response = await apiInterceptor<UpdateUsernameResult>({
      method: 'put',
      url: '/user/updateUsername',
      data: { username },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<UpdateUsernameResult>;
    if (err.response?.data) {
      return err.response.data;
    }
    console.error('Failed to update username', error);
    return { success: false, message: 'Unknown error' };
  }
};

const isGateUserElligibleForAward = async (): Promise<boolean> => {
  try {
    const response = await apiInterceptor<IsGateUserEligibleResponse>({
      method: 'get',
      url: '/game/isGateUserEligible',
    });
    const isGateUserEligible = response.data?.isGateUserEligible;
    if (typeof isGateUserEligible !== 'boolean') {
      return false;
    }
    return isGateUserEligible;
  } catch (error) {
    console.error('Failed to check eligibility for gate award', error);
    return false;
  }
};

const awardGateUser = async (): Promise<boolean> => {
  try {
    const response = await apiInterceptor<AwardGateUserResponse>({
      method: 'put',
      url: '/game/awardGateUser',
    });
    return Boolean(response.data?.success);
  } catch (error) {
    console.error('Failed to award gate user', error);
    return false;
  }
};

const isGalaxyUserEligible = async (): Promise<boolean> => {
  try {
    const response = await apiInterceptor<IsGateUserEligibleResponse>({
      method: 'get',
      url: '/game/isGalaxyUserEligible',
    });
    const isGalaxyUserEligible = response.data?.isGalaxyUserEligible;
    if (typeof isGalaxyUserEligible !== 'boolean') {
      return false;
    }
    return isGalaxyUserEligible;
  } catch (error) {
    console.error('Failed to check Galaxy user eligibility', error);
    return false;
  }
};



const getProfile = () =>
  apiInterceptor<ApiSuccessResponse<ProfilePayload>>({
    method: 'get',
    url: '/user/profile',
  });



export {
  login,
  getLeaderboard,
  getGateLeaderboard,
  updateUserName,
  getProfile,
  getGameData,
  getGameBatch,
  getBackupImage,
  setAnswer,
  isGateUserElligibleForAward,
  awardGateUser,
  isGalaxyUserEligible,
};
