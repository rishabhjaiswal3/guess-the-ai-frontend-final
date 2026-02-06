import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";
import confetti from "canvas-confetti";
import { getNext10ImagesWithUrls, submitAnswer, startSession, endSession, type GameImageWithUrl } from "@/services/gameApi";
import { preloadImages } from "@/lib/imageUrl";
import GlowingBorder from "@/components/effects/GlowingBorder";
import FloatingScorePopup from "@/components/effects/FloatingScorePopup";
import ScreenShake from "@/components/effects/ScreenShake";
import { useFeedbackSound } from "@/hooks/useFeedbackSound";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import ClassicGuessButtons from "@/components/game/classic/ClassicGuessButtons";

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

const TIMER_DURATION = 10;
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
  const [showResult, setShowResult] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [totalGames, setTotalGames] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [truthLabel, setTruthLabel] = useState<"ai" | "human" | null>(null);
  const [prefetching, setPrefetching] = useState(false);

  const gameCardRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const preloadedHashesRef = useRef<Set<string>>(new Set());
  const { playClick, playBack, playSuccess, playFail } = useFeedbackSound();

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
        setIsTimerRunning(true);
      }, 300);
    }
  }, []);

  // Advance to next image
  const advanceToNextImage = useCallback(() => {
    setImageError(false);
    setTruthLabel(null);
    setTimeLeft(TIMER_DURATION);

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

    setTimeout(() => {
      setIsTimerRunning(true);
    }, 100);
  }, [imageQueue, fetchImageBatch, preloadQueueImages]);

  useEffect(() => {
    loadInitialImages();
  }, [loadInitialImages]);

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

  useEffect(() => {
    if (!isTimerRunning || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGuess(null, true, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, showResult]);

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

  const handleGuess = async (guessedAI: boolean | null, timeout = false, timeRemaining = timeLeft) => {
    if (!currentImage || showResult) return;
    if (!timeout) playClick();

    setIsTimerRunning(false);
    setTotalGames((prev) => prev + 1);

    const guessLabel: "ai" | "human" = guessedAI === null
      ? (Math.random() > 0.5 ? "ai" : "human")
      : guessedAI ? "ai" : "human";

    let isCorrect = false;
    let truth: "ai" | "human" | null = null;

    try {
      const response = await submitAnswer(currentImage.hash, guessLabel);
      isCorrect = Boolean(response?.isCorrect ?? response?.correct);
      truth = response?.truth ?? null;
    } catch {
      isCorrect = false;
    }

    setTruthLabel(truth);

    const resultType = timeout ? "timeout" : isCorrect ? "correct" : "wrong";

    if (isCorrect) {
      setShowResult("correct");
      playSuccess();

      const baseScore = 10;
      const timeBonus = Math.floor(timeRemaining * 2);
      const comboMultiplier = combo;
      const totalPoints = (baseScore + timeBonus) * comboMultiplier;

      const newStreak = streak + 1;
      const newCombo = Math.min(combo + 1, 5);
      const newBestStreak = Math.max(bestStreak, newStreak);
      const newScore = score + totalPoints;

      setStreak(newStreak);
      setCombo(newCombo);
      setBestStreak(newBestStreak);
      setScore(newScore);
      setCorrectAnswers((prev) => prev + 1);
      onScoreUpdate(newScore, newStreak, newBestStreak);

      if (newBestStreak > bestStreak) {
        setProgressMessage(`New best streak! Rookie progress: ${newBestStreak}`);
      }

      addScorePopup(totalPoints, "score");
      if (newCombo > 1) {
        setTimeout(() => addScorePopup(newCombo, "combo"), 200);
      }
      if (timeBonus > 10) {
        setTimeout(() => addScorePopup(timeBonus, "bonus"), 400);
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
      setShowResult(resultType);
      playFail();
      setStreak(0);
      setCombo(1);
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);
      onScoreUpdate(score, 0, bestStreak);
    }

    setTimeout(() => {
      setShowResult(null);
      advanceToNextImage();
    }, RESULT_DELAY_MS);
  };

  const getTimerColor = () => {
    if (timeLeft > 6) return "text-primary";
    if (timeLeft > 3) return "text-yellow";
    return "text-destructive animate-pulse";
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

      <ScreenShake trigger={shakeScreen} intensity={15}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-[4.5rem] pb-20 lg:pb-16">
          <ClassicStatsBar
            timeLeft={timeLeft}
            streak={streak}
            combo={combo}
            score={score}
            onBack={() => { playBack(); onBack(); }}
            timerColorClass={getTimerColor()}
          />

          <GlowingBorder glowColor={getComboGlow()} intensity={combo >= 3 ? "high" : "medium"} className="rounded-3xl">
            <motion.div
              ref={gameCardRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-strong rounded-3xl p-7 w-full max-w-4xl"
            >
              <div className="relative text-center mb-3">
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

              <div className={`relative h-2 bg-muted rounded-full mb-4 overflow-hidden transition-shadow ${
                timeLeft <= 3 ? "shadow-[0_0_10px_rgba(239,68,68,0.5)]" : ""
              }`}>
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    timeLeft > 6
                      ? "bg-gradient-to-r from-primary via-secondary to-primary"
                      : timeLeft > 3
                      ? "bg-gradient-to-r from-yellow via-orange to-yellow"
                      : "bg-gradient-to-r from-destructive via-orange to-destructive"
                  }`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / TIMER_DURATION) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>

              <div className="relative rounded-2xl overflow-hidden mb-4 bg-muted/30 border-2 border-border">
                {/* Aspect ratio placeholder - always rendered to maintain consistent size */}
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
                      ) : showResult === "timeout" ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="text-center"
                        >
                          <span className="text-6xl block mb-2">⏱</span>
                          <span className="text-3xl font-black text-foreground drop-shadow-lg">TIME UP!</span>
                          <span className="block text-sm text-foreground/80 mt-2">Auto-guess submitted.</span>
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

              <ClassicGuessButtons
                disabled={!!showResult || isLoading || !currentImage}
                onGuess={(isAi) => handleGuess(isAi, false)}
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
