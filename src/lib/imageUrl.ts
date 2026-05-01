/**
 * Image URL builder utility
 * Uses direct 0G fetch first, with DigitalOcean as fallback.
 */

const INDEXER_BASE_URL = import.meta.env.VITE_INDEXER_BASE_URL ?? "";
const DIGITAL_OCEAN_BASE_URL = import.meta.env.VITE_DIGITAL_OCEAN_BASE_URL ?? "";

/**
 * Build a full image URL from a hash
 * @param hash - The image hash from the API
 * @returns Full URL to the image
 */
export const buildImageUrl = (hash: string): string => {
  if (!hash) return "";
  if (!INDEXER_BASE_URL) {
    console.warn("[imageUrl] No 0G indexer base URL configured");
    return "";
  }
  // 0G indexer root lookup uses hash directly (without .jpg suffix).
  return `${INDEXER_BASE_URL}${encodeURIComponent(hash)}`;
};

/**
 * Build DigitalOcean fallback URL from hash
 * @param hash - The image hash from API
 * @returns Full fallback image URL
 */
export const buildFallbackImageUrl = (hash: string): string => {
  if (!hash) return "";
  if (!DIGITAL_OCEAN_BASE_URL) {
    console.warn("[imageUrl] No DigitalOcean fallback base URL configured");
    return "";
  }
  return `${DIGITAL_OCEAN_BASE_URL}${encodeURIComponent(hash)}.jpg`;
};

/**
 * Preload an image by creating an Image object
 * @param url - The image URL to preload
 * @returns Promise that resolves when image is loaded
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    img.src = url;
  });
};

/**
 * Preload multiple images
 * @param urls - Array of image URLs to preload
 * @param onProgress - Optional callback for progress updates
 * @returns Promise that resolves when all images are loaded
 */
export const preloadImages = async (
  urls: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<void> => {
  const total = urls.length;
  let completed = 0;

  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        await preloadImage(url);
      } catch (err) {
        console.warn("[imageUrl] Failed to preload:", url, err);
      } finally {
        completed += 1;
        onProgress?.(completed, total);
      }
    })
  );
};

export const IMAGE_CONFIG = {
  indexerBaseUrl: INDEXER_BASE_URL,
  digitalOceanBaseUrl: DIGITAL_OCEAN_BASE_URL,
} as const;
