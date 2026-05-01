import { ApiError, apiRequest } from "@/lib/apiClient";

export type VerifyManifestPayload = {
  resolved: boolean;
  reason?: string;
  message?: string;
  correctLabel?: "ai" | "human";
  userGuess?: "ai" | "human";
  userWasCorrect?: boolean;
  verifiedAgainstRoot?: string | null;
  localManifest?: boolean;
  /** '0g-browser' = fetched manifest from indexer in this tab; 'api' = backend resolution */
  verificationMode?: "0g-browser" | "api";
};

/** Public: POST /verify/image-label (manifest on 0G, resolved by backend). */
export const verifyImageLabel = async (
  imageHash: string,
  guess: "ai" | "human"
): Promise<VerifyManifestPayload> => {
  const res = await apiRequest<{ success: boolean; data: VerifyManifestPayload }>("/verify/image-label", {
    method: "POST",
    body: { imageHash, guess },
    auth: false
  });
  if (!res?.success || res.data === undefined || res.data === null) {
    throw new Error("Verification failed");
  }
  return { ...res.data, verificationMode: "api" as const };
};

export function verifyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const p = error.payload as { message?: string; code?: string } | undefined;
    if (p?.code === "manifest_not_configured") {
      return "Verification is offline: IMAGE_LABEL_MANIFEST_STORAGE_ROOT is not set on the server.";
    }
    return p?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return "Verification failed";
}
