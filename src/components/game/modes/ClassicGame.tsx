import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";
import confetti from "canvas-confetti";
import { getNext10ImagesWithUrls, submitAnswer, startSession, endSession, type GameImageWithUrl } from "@/services/gameApi";
import { getProfile } from "@/services/authApi";
import { preloadImages } from "@/lib/imageUrl";
import GlowingBorder from "@/components/effects/GlowingBorder";
import FloatingScorePopup from "@/components/effects/FloatingScorePopup";
import ScreenShake from "@/components/effects/ScreenShake";
import HintBadge from "@/components/game/HintBadge";
import { useFeedbackSound } from "@/hooks/useFeedbackSound";
import { useHint } from "@/hooks/useHint";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import ClassicGuessButtons from "@/components/game/classic/ClassicGuessButtons";
import networkConfig from "@/lib/networkConfig";
import { addGameTransaction } from "@/lib/gameTransactions";
import { toast } from "@/components/ui/sonner";

interface ScorePopup {
  id: string;
  value: number;
  x: number;
  y: number;
  type: "score" | "combo" | "bonus";
}

interface ClassicGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number, streak: number, bestStreak: number) => void;
}

const RESULT_DELAY_MS = 1400;
const PREFETCH_THRESHOLD = Number(import.meta.env.VITE_PREFETCH_THRESHOLD || 6);
const PREFETCH_AHEAD = 4;

const ClassicGame = ({ onBack, onScoreUpdate }: ClassicGameProps) => {
  const [imageQueue, setImageQueue] = useState<GameImageWithUrl[]>([]);
  const [currentImage, setCurrentImage] = useState<GameImageWithUrl | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [totalGames, setTotalGames] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [truthLabel, setTruthLabel] = useState<"ai" | "human" | null>(null);
  const [prefetching, setPrefetching] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const gameCardRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const preloadedHashesRef = useRef<Set<string>>(new Set());
  const { playClick, playBack, playSuccess, playFail } = useFeedbackSound();

  // Use the current image hash as the hint key
  // Backend fires batch hint gen for all 10 images when /next10 is called
  const { hint, loading: hintLoading } = useHint(currentImage?.hash || null);

  // Preload images from the queue
  const preloadQueueImages = useCallback(async (images: GameImageWithUrl[]) => {
    const urlsToPreload = images
      .slice(0, PREFETCH_AHEAD)
      .filter((img) => !preloadedHashesRef.current.has(img.hash))
      .map((img) => {
        preloadedHashesRef.current.add(img.hash);
        return img.imageUrl;
      });

    if (urlsToPreload.length > 0) {
      await preloadImages(urlsToPreload);
    }
  }, []);

  // Fetch batch of images
  const fetchImageBatch = useCallback(async (forceReplace = false) => {
    if (prefetching && !forceReplace) return;

    setPrefetching(true);
    try {
      const batch = await getNext10ImagesWithUrls();
      if (!batch.length) {
        if (forceReplace) {
          setProgressMessage("No images available right now. Try again soon.");
        }
        return;
      }

      if (forceReplace || !currentImage) {
        // Preload first image before displaying
        await preloadImages([batch[0].imageUrl]);
        preloadedHashesRef.current.add(batch[0].hash);

        const [first, ...rest] = batch;
        setCurrentImage(first);
        setImageQueue(rest);
        // Preload upcoming images in background
        preloadQueueImages(rest);
      } else {
        setImageQueue((prev) => {
          const newQueue = [...prev, ...batch];
          preloadQueueImages(newQueue);
          return newQueue;
        });
      }
    } catch (err) {
      console.error("Error fetching images:", err);
      if (forceReplace) {
        setProgressMessage("Unable to load images. Please retry.");
      }
    } finally {
      setPrefetching(false);
    }
  }, [prefetching, currentImage, preloadQueueImages]);

  // Initial load
  const loadInitialImages = useCallback(async () => {
    setIsLoading(true);
    setImageError(false);
    setProgressMessage(null);
    setTruthLabel(null);

    try {
      const batch = await getNext10ImagesWithUrls();
      if (!batch.length) {
        setCurrentImage(null);
        setProgressMessage("No images available right now. Try again soon.");
        return;
      }

      // Preload first few images BEFORE setting current image
      await preloadImages(batch.slice(0, PREFETCH_AHEAD).map((img) => img.imageUrl));
      batch.slice(0, PREFETCH_AHEAD).forEach((img) => preloadedHashesRef.current.add(img.hash));

      // Now set the current image (already preloaded)
      const [first, ...rest] = batch;
      setCurrentImage(first);
      setImageQueue(rest);
    } catch (err) {
      console.error("Error loading initial images:", err);
      setCurrentImage(null);
      setProgressMessage("Unable to load images. Please retry.");
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, []);

  // Advance to next image
  const advanceToNextImage = useCallback(() => {
    setImageError(false);
    setTruthLabel(null);

    if (imageQueue.length === 0) {
      setCurrentImage(null);
      fetchImageBatch(true);
      return;
    }

    const [next, ...rest] = imageQueue;
    setCurrentImage(next);
    setImageQueue(rest);

    // Check if we need to prefetch more
    if (rest.length <= PREFETCH_THRESHOLD) {
      fetchImageBatch();
    }

    // Preload upcoming images
    preloadQueueImages(rest);

  }, [imageQueue, fetchImageBatch, preloadQueueImages]);

  useEffect(() => {
    loadInitialImages();
  }, [loadInitialImages]);

  // Load user profile to get initial stats (streak, bestStreak, correctAnswers)
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await getProfile();
        const data = response?.data;
        if (data) {
          const currentStreakValue = Number(data.currentStreak) || 0;
          const bestStreakValue = Number(data.streak) || 0;
          const correctAnswersValue = Number(data.correctAnswers) || 0;

          setStreak(currentStreakValue);
          setBestStreak(bestStreakValue);
          setCorrectAnswers(correctAnswersValue);
          setScore(correctAnswersValue); // Score = correctAnswers (same as old frontend)

          // Sync with parent component
          onScoreUpdate(correctAnswersValue, currentStreakValue, bestStreakValue);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    };

    loadUserProfile();
  }, [onScoreUpdate]);

  useEffect(() => {
    let mounted = true;
    startSession()
      .then((response) => {
        const sessionId = response?.data?.sessionId;
        if (mounted && sessionId) {
          sessionIdRef.current = sessionId;
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        endSession(sessionId, true).catch(() => {});
      }
    };
  }, []);

  const addScorePopup = (value: number, type: ScorePopup["type"]) => {
    const rect = gameCardRef.current?.getBoundingClientRect();
    const popup: ScorePopup = {
      id: `${Date.now()}-${Math.random()}`,
      value,
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      type,
    };
    setScorePopups((prev) => [...prev, popup]);
  };

  const removeScorePopup = (id: string) => {
    setScorePopups((prev) => prev.filter((p) => p.id !== id));
  };

  const handleGuess = async (guessedAI: boolean | null) => {
    if (!currentImage || showResult) return;
    if (isSubmittingAnswer) return;
    playClick();
    setTotalGames((prev) => prev + 1);
    setIsSubmittingAnswer(true);

    const guessLabel: "ai" | "human" = guessedAI === null
      ? (Math.random() > 0.5 ? "ai" : "human")
      : guessedAI ? "ai" : "human";

    let isCorrect = false;
    let truth: "ai" | "human" | null = null;
    let apiCurrentStreak: number | undefined;
    let apiBestStreak: number | undefined;
    let apiCorrectAnswers: number | undefined;

    try {
      const response = await submitAnswer(currentImage.hash, guessLabel);
      isCorrect = Boolean(response?.isCorrect ?? response?.correct);
      truth = response?.truth ?? null;
      apiCurrentStreak = typeof response?.profile?.currentStreak === "number" ? response?.profile?.currentStreak : undefined;
      apiBestStreak = typeof response?.profile?.streak === "number" ? response?.profile?.streak : undefined;
      apiCorrectAnswers = typeof response?.profile?.correctAnswers === "number" ? response?.profile?.correctAnswers : undefined;
      const txHash = response?.onchain?.transactionHash;
      if (txHash) {
        setLastTxHash(txHash);
        addGameTransaction(txHash, "Classic");
        const explorerBase = networkConfig.blockExplorers?.default?.url;
        toast("Answer recorded on-chain", {
          description: `Transaction Hash: ${txHash}`,
          duration: 10000,
          action: explorerBase
            ? {
                label: "View",
                onClick: () => window.open(`${explorerBase}/tx/${txHash}`, "_blank")
              }
            : undefined
        });
      }
    } catch {
      isCorrect = false;
    } finally {
      setIsSubmittingAnswer(false);
    }

    setTruthLabel(truth);

    if (isCorrect) {
      setShowResult("correct");
      playSuccess();

      const newStreak = typeof apiCurrentStreak === "number" ? apiCurrentStreak : streak + 1;
      const newCombo = Math.min(combo + 1, 5);
      const newBestStreak = typeof apiBestStreak === "number"
        ? apiBestStreak
        : Math.max(bestStreak, newStreak);
      // Score = correctAnswers (increments by 1, same as old frontend)
      const newCorrectAnswers = typeof apiCorrectAnswers === "number" ? apiCorrectAnswers : correctAnswers + 1;
      const newScore = newCorrectAnswers;

      setStreak(newStreak);
      setCombo(newCombo);
      setBestStreak(newBestStreak);
      setScore(newScore);
      setCorrectAnswers(newCorrectAnswers);
      onScoreUpdate(newScore, newStreak, newBestStreak);

      if (newBestStreak > bestStreak) {
        setProgressMessage(`New best streak! Rookie progress: ${newBestStreak}`);
      }

      addScorePopup(1, "score"); // Show +1 instead of combo-based points
      if (newCombo > 1) {
        setTimeout(() => addScorePopup(newCombo, "combo"), 200);
      }
      if (newStreak % 5 === 0) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#00FFFF", "#FF00FF", "#8B5CF6", "#FFD700"],
        });
      }
    } else {
      setShowResult("wrong");
      playFail();
      setStreak(typeof apiCurrentStreak === "number" ? apiCurrentStreak : 0);
      setCombo(1);
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);
      const resolvedBestStreak = typeof apiBestStreak === "number" ? apiBestStreak : bestStreak;
      if (typeof apiCorrectAnswers === "number") {
        setCorrectAnswers(apiCorrectAnswers);
      }
      onScoreUpdate(score, 0, resolvedBestStreak);
    }

    setTimeout(() => {
      setShowResult(null);
      advanceToNextImage();
    }, RESULT_DELAY_MS);
  };

  const getComboGlow = () => {
    if (combo >= 5) return "rainbow";
    if (combo >= 3) return "magenta";
    return "cyan";
  };

  const accuracy = totalGames > 0 ? Math.round((correctAnswers / totalGames) * 100) : 0;

  return (
    <>
      <FloatingScorePopup popups={scorePopups} onComplete={removeScorePopup} />

      <ScreenShake trigger={shakeScreen} intensity={15} >
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-[4.5rem] pb-20 lg:pb-16">
          <ClassicStatsBar
            streak={streak}
            score={score}
            onBack={() => { playBack(); onBack(); }}
          />
          {lastTxHash ? (
            <div className="mt-3 flex items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-200/90">
              <span className="font-semibold">Latest Tx</span>
              <span className="font-mono">{`${lastTxHash.slice(0, 8)}...${lastTxHash.slice(-6)}`}</span>
              {networkConfig.blockExplorers?.default?.url ? (
                <a
                  className="ml-auto rounded-full border border-cyan-400/40 px-2 py-0.5 text-[11px] text-cyan-200 hover:border-cyan-300 hover:text-cyan-100"
                  href={`${networkConfig.blockExplorers.default.url}/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              ) : null}
            </div>
          ) : null}

          <GlowingBorder glowColor={getComboGlow()} intensity={combo >= 3 ? "high" : "medium"} className="rounded-3xl">
            <motion.div
              ref={gameCardRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-strong rounded-3xl p-7 w-full max-w-4xl"
            >
              <div className="relative text-center mb-3" >
                <motion.h2
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(0,255,255,0.5)",
                      "0 0 40px rgba(255,0,255,0.5)",
                      "0 0 20px rgba(0,255,255,0.5)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl md:text-4xl font-black gradient-text"
                >
                  AI or Human?
                </motion.h2>
                {combo >= 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Crown className="w-8 h-8 text-yellow drop-shadow-[0_0_10px_gold]" />
                  </motion.div>
                )}
              </div>

              <div className="relative rounded-2xl overflow-hidden mb-4 bg-muted/30 border-2 border-border min-w-[340px] min-h-[300px]">
                <div className="w-full" style={{ paddingBottom: '75%' }} />

                <AnimatePresence mode="wait">
                  {currentImage && !isLoading && (
                    <motion.div
                      key={currentImage.hash}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      {!imageError ? (
                        <img
                          src={currentImage.imageUrl}
                          alt="Guess if this is AI or Human made"
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center text-muted-foreground/80 text-lg font-semibold">
                          Image unavailable
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-transparent to-magenta/10 mix-blend-overlay" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {isLoading && (
                  <div className="absolute inset-0 bg-muted/30 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}

                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.5 }}
                      className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm ${
                        showResult === "correct" ? "bg-success-overlay" : "bg-error-overlay"
                      }`}
                    >
                      {showResult === "correct" ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="text-center"
                        >
                          <span className="text-6xl block mb-2">✓</span>
                          <span className="text-3xl font-black text-foreground drop-shadow-lg">CORRECT!</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="text-center"
                        >
                          <span className="text-6xl block mb-2">✗</span>
                          <span className="text-3xl font-black text-foreground drop-shadow-lg">WRONG!</span>
                          {truthLabel && (
                            <span className="block text-lg text-foreground/80 mt-2">
                              It was <span className="font-bold">{truthLabel === "ai" ? "AI" : "Human"}</span>
                            </span>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {progressMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass px-4 py-2 rounded-xl text-sm text-center text-secondary font-semibold mb-3"
                >
                  {progressMessage}
                </motion.div>
              )}

              {isSubmittingAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="glass px-4 py-2 rounded-xl text-sm text-center text-cyan-200/90 font-semibold mb-3"
                >
                  Submitting answer... please wait
                </motion.div>
              )}

              {!showResult && (
                <HintBadge hint={hint} loading={hintLoading} />
              )}

              <ClassicGuessButtons
                disabled={!!showResult || isLoading || !currentImage || isSubmittingAnswer}
                onGuess={(isAi) => handleGuess(isAi)}
              />

              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span>Games: {totalGames}</span>
                <span>Best: {bestStreak} 🔥</span>
                <span>Accuracy: {accuracy}%</span>
              </div>
            </motion.div>
          </GlowingBorder>
        </div>
      </ScreenShake>
    </>
  );
};

export default ClassicGame;
