/**
 * Fetch label manifest JSON directly from the 0G indexer in the browser (no game API required).
 * Manifest must live at IMAGE_LABEL_MANIFEST_STORAGE_ROOT uploaded to Storage; indexer URL matches images.
 */

import type { VerifyManifestPayload } from "@/services/verifyApi";

type ManifestSchema2 = {
  schemaVersion: number;
  name?: string;
  entries: Record<string, string | { label?: string }>;
};

/** In-memory cache: manifest JSON is large (~3MB); load once per session. */
let cacheKey: string | null = null;
let cacheManifest: ManifestSchema2 | null = null;

function normalizeHashStrict(h: string): string {
  let s = h.trim().toLowerCase();
  if (!s.startsWith("0x")) s = `0x${s}`;
  return s;
}

function labelFromEntry(value: ManifestSchema2["entries"][string]): "ai" | "human" | null {
  if (typeof value === "string") {
    const t = value.trim().toLowerCase();
    return t === "ai" || t === "human" ? t : null;
  }
  if (value && typeof value === "object" && value.label != null) {
    const t = String(value.label).trim().toLowerCase();
    return t === "ai" || t === "human" ? t : null;
  }
  return null;
}

export function getDirect0gVerifyConfig(): {
  indexerBase: string;
  manifestRoot: string;
  ready: boolean;
} {
  const manifestRoot = (import.meta.env.VITE_LABEL_MANIFEST_STORAGE_ROOT ?? "").trim();
  const indexerBase =
    (import.meta.env.VITE_INDEXER_BASE_URL ?? "").trim() ||
    "https://indexer-storage-turbo.0g.ai/file?root=";

  const ready =
    Boolean(manifestRoot) &&
    Boolean(indexerBase) &&
    (indexerBase.includes("root=") || indexerBase.includes("root"));

  return { indexerBase, manifestRoot, ready };
}

async function fetchManifest(storageRoot: string, indexerBase: string): Promise<ManifestSchema2> {
  const key = `${indexerBase}::${storageRoot}`;
  if (cacheKey === key && cacheManifest) return cacheManifest;

  const base = indexerBase.endsWith("=") ? indexerBase : `${indexerBase.replace(/\/?$/u, "")}?root=`;
  const url = `${base}${encodeURIComponent(storageRoot)}`;

  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Indexer HTTP ${res.status}: ${text?.slice(0, 140)}`);
  }

  let parsed: ManifestSchema2;
  try {
    parsed = JSON.parse(text) as ManifestSchema2;
  } catch {
    throw new Error("Manifest is not valid JSON (check STORAGE_ROOT matches uploaded file).");
  }

  const ver = parsed.schemaVersion;
  if (ver !== 2 && ver !== 1) {
    throw new Error(`Unsupported manifest schemaVersion: ${String(ver)}`);
  }
  if (!parsed.entries || typeof parsed.entries !== "object") {
    throw new Error("Manifest missing entries");
  }

  cacheKey = key;
  cacheManifest = parsed;
  return parsed;
}

/**
 * Returns same shape as server /verify/image-label plus verificationMode '0g-browser'.
 */
export async function verifyLabelFromIndexer(
  normalizedImageHash: string,
  guess: "ai" | "human"
): Promise<VerifyManifestPayload> {
  const { manifestRoot, indexerBase, ready } = getDirect0gVerifyConfig();
  if (!ready) {
    throw new Error(
      "Set VITE_LABEL_MANIFEST_STORAGE_ROOT and VITE_INDEXER_BASE_URL for direct 0G verification."
    );
  }

  let manifest: ManifestSchema2;
  try {
    manifest = await fetchManifest(manifestRoot, indexerBase);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("fetch") || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      throw new Error(
        `Cannot reach indexer from the browser (${msg}). This is often browser CORS — use server verify or expose indexer CORS.`
      );
    }
    throw e;
  }

  const h = normalizeHashStrict(normalizedImageHash);
  const raw = manifest.entries[h] ?? manifest.entries[normalizedImageHash];
  const truthLabel = raw !== undefined ? labelFromEntry(raw) : null;

  if (!truthLabel) {
    return {
      resolved: false,
      reason: "unknown_hash",
      message: "This image hash is not in the downloaded manifest.",
      verifiedAgainstRoot: manifestRoot,
      verificationMode: "0g-browser"
    };
  }

  return {
    resolved: true,
    correctLabel: truthLabel,
    userGuess: guess,
    userWasCorrect: truthLabel === guess,
    verifiedAgainstRoot: manifestRoot,
    localManifest: false,
    verificationMode: "0g-browser"
  };
}
