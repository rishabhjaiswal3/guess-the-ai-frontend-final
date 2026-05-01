import { normalizeImageHashInput } from "@/lib/imageHashInput";

export const GTA_PENDING_VERIFY_HASH_KEY = "gta:pendingVerifyHash";

/** Stores normalized hash and switches bottom nav to Wallet (verification UI reads sessionStorage on mount). */
export function goToWalletWithVerifyHash(hash: string): void {
  const normalized = normalizeImageHashInput(hash);
  sessionStorage.setItem(GTA_PENDING_VERIFY_HASH_KEY, normalized);
  window.dispatchEvent(new CustomEvent("gta:set-tab", { detail: "wallet" }));
}
