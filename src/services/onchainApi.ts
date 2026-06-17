import { apiRequest } from "@/lib/apiClient";
import {
  DEFAULT_ONCHAIN_CONFIG,
  mergeOnchainConfig,
  type OnchainPublicConfig,
} from "@/lib/onchainConfig";

let cachedConfig: OnchainPublicConfig | null = null;
let inflight: Promise<OnchainPublicConfig> | null = null;

export async function fetchOnchainConfig(): Promise<OnchainPublicConfig> {
  if (cachedConfig) return cachedConfig;
  if (inflight) return inflight;

  inflight = apiRequest<{ success?: boolean; data?: OnchainPublicConfig }>(
    "/onchain/config",
    { auth: false }
  )
    .then((response) => {
      const payload = response?.data ?? response;
      cachedConfig = mergeOnchainConfig(payload as OnchainPublicConfig);
      return cachedConfig;
    })
    .catch(() => {
      cachedConfig = DEFAULT_ONCHAIN_CONFIG;
      return cachedConfig;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
