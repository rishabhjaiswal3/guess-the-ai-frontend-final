import { apiRequest } from "@/lib/apiClient";

export type LeaderboardEntry = {
  username: string;
  correctAnswers: number;
  currentStreak: number;
  streak: number;
  rank: string | number;
  walletAddress?: string;
};

export type PaginationInfo = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type LeaderboardResponse = {
  success: boolean;
  message?: string;
  data: LeaderboardEntry[];
  pagination?: PaginationInfo;
  currentUserRank?: number | null;
};

export type LeaderboardParams = {
  page?: number;
  limit?: number;
  wallet?: string;
  type?: string;
};

const normalize = (payload: LeaderboardResponse | LeaderboardEntry[]): LeaderboardResponse => {
  if (Array.isArray(payload)) {
    return { success: true, data: payload };
  }
  return {
    success: payload.success !== false,
    message: payload.message,
    data: payload.data ?? [],
    pagination: payload.pagination,
    currentUserRank: payload.currentUserRank,
  };
};

export const getLeaderboardAllTime = async (params: LeaderboardParams = {}): Promise<LeaderboardResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.wallet) searchParams.set("wallet", params.wallet);

  const query = searchParams.toString();
  const url = `/leaderboard/alltime${query ? `?${query}` : ""}`;

  const response = await apiRequest<LeaderboardResponse | LeaderboardEntry[]>(url);
  return normalize(response);
};

export const getLeaderboardGateUsers = async (params: LeaderboardParams = {}): Promise<LeaderboardResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set("type", params.type || "gate_wallet");
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.wallet) searchParams.set("wallet", params.wallet);

  const query = searchParams.toString();
  const url = `/leaderboard/gateUsers?${query}`;

  const response = await apiRequest<LeaderboardResponse | LeaderboardEntry[]>(url);
  return normalize(response);
};
