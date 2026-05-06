import { clearStoredSession, getStoredToken } from "@/lib/session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const withBaseUrl = (path: string) => {
  if (!API_BASE_URL) return path;
  return API_BASE_URL.replace(/\/$/, "") + path;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  retry?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (status?: number) => {
  if (!status) return true;
  return status >= 500 && status < 600;
};

const isLoginPath = (path: string) => /\/v?\d*\/?login(?:\/|$)/i.test(path);

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { method = "GET", body, headers = {}, auth = true, retry = 3 } = options;
  // Safety: never attach Authorization header to login endpoints.
  const authEnabled = isLoginPath(path) ? false : auth;
  const token = authEnabled ? getStoredToken() : "";

  let attempt = 0;
  let lastError: unknown = null;
  const maxAttempts = Math.max(1, retry + 1);

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const response = await fetch(withBaseUrl(path), {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 204) {
        return null as T;
      }

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        if (
          (!isLoginPath(path) && response.status === 401) ||
          (payload && typeof payload === "object" && (payload as any).message === "Invalid token or token expired. Please log in again.")
        ) {
          clearStoredSession();
        }

        if (attempt < maxAttempts && shouldRetry(response.status)) {
          await sleep(250 * attempt);
          continue;
        }

        throw new ApiError("Request failed", response.status, payload);
      }

      return payload as T;
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) break;
      await sleep(250 * attempt);
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError("Request failed", 0, lastError);
};
