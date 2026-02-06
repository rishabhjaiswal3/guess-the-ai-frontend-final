/**
 * Image URL builder utility
 * Builds image URLs based on VITE_USE_INDEXER_IMAGE environment variable
 */

const USE_INDEXER = import.meta.env.VITE_USE_INDEXER_IMAGE === "true";
const INDEXER_BASE_URL = import.meta.env.VITE_INDEXER_BASE_URL ?? "";
const DIGITAL_OCEAN_BASE_URL = import.meta.env.VITE_DIGITAL_OCEAN_BASE_URL ?? "";

/**
 * Get the base URL for image fetching based on environment config
 */
export const getImageBaseUrl = (): string => {
  return USE_INDEXER ? INDEXER_BASE_URL : DIGITAL_OCEAN_BASE_URL;
};

/**
 * Build a full image URL from a hash
 * @param hash - The image hash from the API
 * @returns Full URL to the image
 */
export const buildImageUrl = (hash: string): string => {
  if (!hash) return "";
  const baseUrl = getImageBaseUrl();
  if (!baseUrl) {
    console.warn("[imageUrl] No base URL configured for images");
    return "";
  }
  // For indexer: hash.jpg, for digital ocean/0g: hash.jpg
  return `${baseUrl}${encodeURIComponent(hash)}.jpg`;
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
  useIndexer: USE_INDEXER,
  indexerBaseUrl: INDEXER_BASE_URL,
  digitalOceanBaseUrl: DIGITAL_OCEAN_BASE_URL,
} as const;
