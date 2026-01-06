import { useEffect, useRef, useState } from 'react';
import ai from '../../assets/Ai-button.png';
import human from '../../assets/Human-button.png';
import { getGameData, getGameBatch, setAnswer, getProfile } from '../../api/auth';
import StreakWinnerModel from '../../components/StreakWinnerModel';
import './GamePage.css';

type GameImage = {
  hash?: string;
  imageId?: string;
  url?: string;
  sourceType?: 'backup';
  imageDataUrl?: string;
  [key: string]: unknown;
};

type ImageState = {
  current: GameImage | null;
  queue: GameImage[];
};

type Scores = {
  streak: number;
  score: number;
};

type PrefetchOptions = {
  forceReplace?: boolean;
};

type AnswerResult = 'correct' | 'incorrect' | null;
type AnswerGuess = 'ai' | 'human';

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read backup image blob'));
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });

const GamePage = () => {
  const PREFETCH_THRESHOLD = Number(import.meta.env.VITE_PREFETCH_THRESHOLD || 6);
  const PREFETCH_AHEAD = Number(import.meta.env.VITE_PREFETCH_AHEAD || 4);
  const MAX_IMAGE_FETCH_RETRIES = Number(import.meta.env.VITE_INDEXER_FETCH_RETRIES || 3);
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const [imageState, setImageState] = useState<ImageState>({ current: null, queue: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);
  const [error, setError] = useState('');
  const [scores, setScores] = useState<Scores>({ streak: 0, score: 0 });
  const [imageBoxHeight, setImageBoxHeight] = useState(300);
  const [prefetching, setPrefetching] = useState(false);
  const [displaySrc, setDisplaySrc] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [initialPreloadProgress, setInitialPreloadProgress] = useState({ total: 0, completed: 0 });
  const [showStreakModal, setShowStreakModal] = useState(false);

  const checkStreakModalEligibility = () => {

    // if (typeof window === 'undefined') return false;
    const sessionWallet = localStorage.getItem('sessionWallet');
    const source = localStorage.getItem('sessionSource');
    const isEligible = sessionWallet === 'VERIFIED' && source === 'iframe';
    console.log("is Eligible ", isEligible, source, sessionWallet);
    return isEligible;
  };
  const imgRef = useRef<HTMLImageElement | null>(null);
  const forcedLoaderRef = useRef(false);
  const objectUrlRef = useRef<string | null>(null);
  const preloadedHashesRef = useRef<Set<string>>(new Set());
  const imageBlobUrlCacheRef = useRef<Map<string, string>>(new Map());
  const indexerBaseUrl = import.meta.env.VITE_INDEXER_BASE_URL ?? 'https://indexer-storage-turbo.0g.ai/file?root=';
  const current = imageState.current;

  const clampImageHeight = (rawHeight: number | undefined | null) => {
    const base = rawHeight && rawHeight > 0 ? rawHeight : 300;
    if (typeof window === 'undefined') return base;
    const vh = window.innerHeight || 640;
    const vw = window.innerWidth || 1024;
    let maxFraction: number;
    if (vw <= 600) {
      // compact image on small phones
      maxFraction = 0.33;
    } else if (vw <= 1024) {
      // slightly smaller image on tablet / 1024px width to avoid vertical overflow
      maxFraction = 0.30;
    } else {
      // larger desktops can afford a bit more height
      maxFraction = 0.40;
    }
    const max = Math.max(200, Math.floor(vh * maxFraction));
    const min = 180;
    return Math.min(Math.max(base, min), max);
  };

  const buildApiUrl = (path?: string) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (!API_BASE_URL) return normalized;
    try {
      const base = API_BASE_URL.replace(/\/+$/, '');
      const baseUrl = new URL(base);
      const basePath = baseUrl.pathname.replace(/\/+$/, '') || '';
      let finalPath = normalized;
      if (basePath && normalized.startsWith(basePath)) {
        finalPath = normalized.slice(basePath.length) || '/';
      }
      return `${base}${finalPath}`;
    } catch (err) {
      console.warn('Invalid API base URL, falling back to relative path:', err);
      return normalized;
    }
  };

  const fetchBackupImageFromApi = async (): Promise<GameImage | null> => {
    try {
      const backupMeta = await getGameData({ isBackup: true });
      if (!backupMeta?.imageId || !backupMeta?.url) {
        return null;
      }
      const targetUrl = buildApiUrl(backupMeta.url);
      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }
      const response = await fetch(targetUrl, {
        headers,
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`backup image fetch failed with status ${response.status}`);
      }
      const blob = await response.blob();
      if (!blob || !blob.size) {
        throw new Error('backup image payload empty');
      }
      const imageDataUrl = await blobToDataUrl(blob);
      return { ...backupMeta, imageDataUrl } as GameImage;
    } catch (err) {
      console.error('Backup image fetch failed:', err);
      return null;
    }
  };

  const cleanupObjectUrl = () => {
    const currentUrl = objectUrlRef.current;
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      const cache = imageBlobUrlCacheRef.current;
      for (const [hash, url] of cache.entries()) {
        if (url === currentUrl) {
          cache.delete(hash);
          break;
        }
      }
      objectUrlRef.current = null;
    }
  };

  const resolveImageSrc = (item?: GameImage | null) => {
    if (!item) {
      return '';
    }
    if (item.sourceType === 'backup' && item.imageDataUrl) {
      return item.imageDataUrl;
    }
    return '';
  };

  const fetchImageBatch = async (): Promise<GameImage[]> => {
    try {
      const response = await getGameBatch();
      if (response?.image_list?.length) {
        return response.image_list;
      }
    } catch (error) {
      console.error('Error fetching image batch:', error);
    }
    try {
      const fallback = await getGameData();
      if (fallback?.hash) {
        return [fallback];
      }
    } catch (fallbackError) {
      console.error('Error fetching fallback image:', fallbackError);
    }
    return [];
  };

  const preloadHashes = async (
    hashes: string[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<void> => {
    if (typeof window === 'undefined') return;
    const preloaded = preloadedHashesRef.current;
    const unique: string[] = [];
    hashes.forEach((hash) => {
      if (!hash) return;
      if (preloaded.has(hash)) return;
      if (imageBlobUrlCacheRef.current.has(hash)) {
        preloaded.add(hash);
        return;
      }
      preloaded.add(hash);
      unique.push(hash);
    });
    if (!unique.length) return;

    const total = unique.length;
    let completed = 0;

    await Promise.all(unique.map(async (hash) => {
      let lastError: unknown = null;
      for (let attempt = 0; attempt < MAX_IMAGE_FETCH_RETRIES; attempt += 1) {
        try {
          const url = `${indexerBaseUrl}${encodeURIComponent(hash)}.jpg`;
          const response = await fetch(url, { cache: 'default' });
          if (!response.ok) {
            throw new Error(`indexer status ${response.status}`);
          }
          const contentType = response.headers.get('content-type') ?? '';
          const isImage = contentType.toLowerCase().includes('image/');
          if (!isImage) {
            throw new Error(`unexpected content-type ${contentType}`);
          }
          const blob = await response.blob();
          if (!blob || !blob.size) {
            throw new Error('empty image payload');
          }
          const objectUrl = URL.createObjectURL(blob);
          imageBlobUrlCacheRef.current.set(hash, objectUrl);
          completed += 1;
          if (onProgress) {
            onProgress(completed, total);
          }
          return;
        } catch (err) {
          lastError = err;
        }
      }
      completed += 1;
      if (onProgress) {
        onProgress(completed, total);
      }
      console.error('Error preloading image after retries:', lastError);
    }));
  };

  const loadInitialImages = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      const batch = await fetchImageBatch();
      if (!batch.length) {
        setImageState({ current: null, queue: [] });
        setError('Failed to load image. Please try again.');
        return;
      }
      setImageState({ current: batch[0] ?? null, queue: batch.slice(1) });
      const hashes = batch
        .slice(1, 1 + PREFETCH_AHEAD)
        .map((item) => item.hash)
        .filter((hash): hash is string => Boolean(hash));
      if (hashes.length) {
        setInitialPreloadProgress({ total: hashes.length, completed: 0 });
        preloadHashes(hashes, (completed, total) => {
          setInitialPreloadProgress({ total, completed });
        }).catch((err) => {
          console.error('Error preloading initial images:', err);
        });
      }
    } catch (error) {
      console.error('Error initializing images:', error);
      setError('Failed to load image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const prefetchImages = async ({ forceReplace = false }: PrefetchOptions = {}) => {
    if (forceReplace) {
      forcedLoaderRef.current = true;
      setIsLoading(true);
    }
    if (prefetching) {
      return;
    }
    setPrefetching(true);
    try {
      const batch = await fetchImageBatch();
      if (!batch.length) return;
      setImageState((prev) => {
        if (forceReplace || !prev.current) {
          const [first, ...rest] = batch;
          return { current: first ?? null, queue: rest };
        }
        return { current: prev.current, queue: [...prev.queue, ...batch] };
      });
    } catch (error) {
      console.error('Error prefetching images:', error);
      if (forceReplace) {
        setError('Failed to load image. Please try again.');
      }
    } finally {
      setPrefetching(false);
      if (forcedLoaderRef.current) {
        forcedLoaderRef.current = false;
        setIsLoading(false);
      }
    }
  };

  const advanceImage = () => {
    setImageState((prev) => {
      if (!prev.queue.length) {
        return { current: null, queue: [] };
      }
      const [next, ...rest] = prev.queue;
      return { current: next, queue: rest };
    });
  };

  const getUserProfile = async () => {
    try {
      const profile = await getProfile();
      const data = profile.data?.data;
      if (data) {
        const currentStreak = Number(data.currentStreak) || 0;
        setScores({
          streak: currentStreak,
          score: Number(data.correctAnswers) || 0,
        });
        if (currentStreak === 5 && checkStreakModalEligibility()) {
          setShowStreakModal(true);
        }
      }
    } catch (profileError) {
      console.error('Failed to load profile', profileError);
    }
  };

  const handleSubmit = async (guess: AnswerGuess) => {
    if (!current) return;
    try {
      setProcessing(true);
      const hashToSend = current.sourceType === 'backup'
        ? (current.imageId || current.hash)
        : current.hash;
      if (!hashToSend) {
        throw new Error('missing image identifier');
      }
      const extraPayload = current.sourceType === 'backup' ? { isBackup: true } : undefined;
      const response = await setAnswer(hashToSend, guess, extraPayload);
      const updatedProfile = response?.profile;
      if (updatedProfile) {
        const newStreak = Number(updatedProfile.currentStreak) || 0;
        setScores({
          score: Number(updatedProfile.correctAnswers) || 0,
          streak: newStreak,
        });
        if (newStreak === 5 && checkStreakModalEligibility()) {
          setShowStreakModal(true);
        }
      }
      const corr = response && (response.isCorrect ?? response.correct ?? response?.data?.isCorrect ?? response?.data?.correct);
      if (typeof corr !== 'undefined') {
        setAnswerResult(corr ? 'correct' : 'incorrect');
      }
      await new Promise((resolve) => setTimeout(resolve, 900));
      const queueSizeBeforeAdvance = imageState.queue.length;
      advanceImage();
      if (queueSizeBeforeAdvance === 0) {
        prefetchImages({ forceReplace: true });
      } else if (queueSizeBeforeAdvance <= PREFETCH_THRESHOLD) {
        prefetchImages();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setProcessing(false);
      setTimeout(() => setAnswerResult(null), 250);
    }
  };

  useEffect(() => {
    getUserProfile();
    loadInitialImages();
  }, []);

  useEffect(() => {
    const hashes = imageState.queue
      .slice(0, PREFETCH_AHEAD)
      .map((item) => item.hash)
      .filter((hash): hash is string => Boolean(hash));
    if (!hashes.length) return;
    preloadHashes(hashes).catch((err) => {
      console.error('Error preloading queue images:', err);
    });
  }, [imageState.queue, indexerBaseUrl]);

  useEffect(() => {
    let cancelled = false;

    const fetchIndexerImage = async (hash: string): Promise<string> => {
      const url = `${indexerBaseUrl}${encodeURIComponent(hash)}.jpg`;
      const response = await fetch(url, { cache: 'default' });
      if (!response.ok) {
        throw new Error(`indexer status ${response.status}`);
      }
      const contentType = response.headers.get('content-type') ?? '';
      const isImage = contentType.toLowerCase().includes('image/');
      if (!isImage) {
        throw new Error(`unexpected content-type ${contentType}`);
      }
      const blob = await response.blob();
      if (!blob || !blob.size) {
        throw new Error('empty image payload');
      }
      return URL.createObjectURL(blob);
    };

    const ensureImage = async () => {
      cleanupObjectUrl();
      if (!current?.hash) {
        setDisplaySrc('');
        setImageLoading(false);
        return;
      }

      if (current?.sourceType === 'backup' && current?.imageDataUrl) {
        setDisplaySrc(current.imageDataUrl);
        setImageLoading(true);
        setError('');
        return;
      }

      setImageLoading(true);
      const cachedObjectUrl = imageBlobUrlCacheRef.current.get(current.hash);
      if (cachedObjectUrl) {
        objectUrlRef.current = cachedObjectUrl;
        setDisplaySrc(cachedObjectUrl);
        setError('');
        return;
      }
      let lastError: unknown = null;
      for (let attempt = 0; attempt < MAX_IMAGE_FETCH_RETRIES; attempt += 1) {
        try {
          const objectUrl = await fetchIndexerImage(current.hash);
          if (cancelled) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            return;
          }
          imageBlobUrlCacheRef.current.set(current.hash, objectUrl);
          objectUrlRef.current = objectUrl;
          setDisplaySrc(objectUrl);
          setError('');
          return;
        } catch (err) {
          lastError = err;
        }
      }
      const backupImage = await fetchBackupImageFromApi();
      if (cancelled) return;
      if (backupImage?.imageDataUrl) {
        setImageState((prev) => ({
          ...prev,
          current: {
            hash: backupImage.imageId,
            imageId: backupImage.imageId,
            url: backupImage.url,
            sourceType: 'backup',
            imageDataUrl: backupImage.imageDataUrl,
          },
        }));
        setDisplaySrc(backupImage.imageDataUrl);
        setError('');
        return;
      }
      if (!cancelled) {
        setError('Failed to load image. Please try again.');
        setImageLoading(false);
        console.error('Image load failure:', lastError);
      }
    };

    ensureImage();

    return () => {
      cancelled = true;
    };
  }, [current?.hash, current?.sourceType, current?.imageDataUrl, indexerBaseUrl]);

  useEffect(() => () => {
    cleanupObjectUrl();
    imageBlobUrlCacheRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    imageBlobUrlCacheRef.current.clear();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (imgRef.current) {
        const h = imgRef.current.getBoundingClientRect().height || 300;
        setImageBoxHeight(clampImageHeight(h));
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="game-page">
      <div className="game-container">
        <div className="game-card">
          <div className="game-card-header">
            <div className="game-title">
              AI or Human?
            </div>

          </div>
          <div className="game-stats" style={{ marginBottom: "6px" }}>
            <div className="stat" style={{ display: 'flex', justifyContent: 'center' }}>
              <span className="stat-icon" aria-hidden>🔥</span>
              <div className="stat-label">Streak: {scores.streak}</div>
            </div>
            <div className="stat" style={{ display: 'flex', justifyContent: 'center' }}>
              <span className="stat-icon" aria-hidden>★</span>
              <div className="stat-label">Score: {scores.score}</div>
            </div>
          </div>

          <div className={`image-wrap ${(isLoading || processing || imageLoading) && current ? 'processing' : ''}`} style={{ height: imageBoxHeight }}>
            {current && (displaySrc || resolveImageSrc(current)) ? (
              <img
                src={displaySrc || resolveImageSrc(current)}
                alt="AI or Human?"
                className="game-image"
                ref={imgRef}
                onLoad={(e) => {
                  const h = e.currentTarget.getBoundingClientRect().height;
                  setImageBoxHeight(clampImageHeight(h));
                  setImageLoading(false);
                }}
                onError={() => {
                  setImageLoading(false);
                  setError('Failed to load image. Please try again.');
                }}
              />
            ) : (
              <div className="game-loader" role="status" aria-live="polite">
              </div>
            )}
            {(isLoading || processing || imageLoading) && current && (
              <div className="image-overlay" aria-hidden>
                <div className="spinner" />
              </div>
            )}
            {answerResult && (
              <div className={`result-badge ${answerResult}`} aria-live="polite">
                {answerResult === 'correct' ? '👍' : '🙁'}
              </div>
            )}
          </div>

          <div className="guess-buttons" style={{ marginTop: "20px", paddingBottom: "0px" }}>
            <button onClick={() => handleSubmit('ai')} disabled={isLoading || processing || imageLoading} className="guess-button">
              <img src={ai} alt="ai" className="btn-image" />
            </button>
            <button onClick={() => handleSubmit('human')} disabled={isLoading || processing || imageLoading} className="guess-button">
              <img src={human} alt="human" className="btn-image" />
            </button>
          </div>
          {error && <div className="game-error">{error}</div>}
        </div>
      </div>
      <StreakWinnerModel
        visible={showStreakModal}
        onClose={() => setShowStreakModal(false)}
      />
    </div>
  );
};

export default GamePage;
