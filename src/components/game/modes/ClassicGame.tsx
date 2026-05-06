import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Zap } from "lucide-react";
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
import VerifyHashEyeButton from "@/components/game/VerifyHashEyeButton";

type ProofStatus = "idle" | "verifying" | "verified" | "stored";

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

const STREAK_MESSAGES: Record<number, string> = {
  3: "🔥 3-game streak — you're on a roll!",
  5: "🔥 5 streak — your accuracy is improving",
  10: "🔥 10 streak — you're a legend!",
  20: "🔥 20 streak — absolutely unstoppable!",
};

function getStreakToast(streak: number): string | null {
  if (STREAK_MESSAGES[streak]) return STREAK_MESSAGES[streak];
  if (streak > 10 && streak % 5 === 0) return `🔥 ${streak} streak — keep it going!`;
  return null;
}

const ProofStatusBar = ({ status }: { status: ProofStatus }) => {
  if (status === "idle") return null;

  const states = {
    verifying: { dot: "bg-yellow-400", text: "Verifying on 0G...", pulse: true },
    verified:  { dot: "bg-cyan-400",   text: "✓ Verified on 0G",   pulse: false },
    stored:    { dot: "bg-emerald-400", text: "✓ Stored on 0G DA",  pulse: false },
  };

  const s = states[status];

  return (
    <AnimatePresence>
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-background/60 backdrop-blur-sm text-xs font-medium text-foreground/80"
      >
        <span className={`w-2 h-2 rounded-full ${s.dot} ${s.pulse ? "animate-pulse" : ""}`} />
        {s.text}
      </motion.div>
    </AnimatePresence>
  );
};

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
  const [proofStatus, setProofStatus] = useState<ProofStatus>("idle");
  const [answerTimestamp, setAnswerTimestamp] = useState<string | null>(null);

  const gameCardRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const preloadedHashesRef = useRef<Set<string>>(new Set());
  const proofTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playClick, playBack, playSuccess, playFail } = useFeedbackSound();

  const { hint, loading: hintLoading } = useHint(currentImage?.hash || null);

  const preloadNextImage = useCallback(async (nextImage: GameImageWithUrl | null | undefined) => {
    if (!nextImage) return;
    if (preloadedHashesRef.current.has(nextImage.hash)) return;
    preloadedHashesRef.current.add(nextImage.hash);
    await preloadImages([nextImage.imageUrl]);
  }, []);

  const fetchImageBatch = useCallback(async (forceReplace = false) => {
    if (prefetching && !forceReplace) return;
    setPrefetching(true);
    try {
      const batch = await getNext10ImagesWithUrls();
      if (!batch.length) {
        if (forceReplace) setProgressMessage("No images available right now. Try again soon.");
        return;
      }
      if (forceReplace || !currentImage) {
        await preloadImages([batch[0].imageUrl]);
        preloadedHashesRef.current.add(batch[0].hash);
        const [first, ...rest] = batch;
        setCurrentImage(first);
        setImageQueue(rest);
      } else {
        setImageQueue((prev) => [...prev, ...batch]);
      }
    } catch (err) {
      console.error("Error fetching images:", err);
      if (forceReplace) setProgressMessage("Unable to load images. Please retry.");
    } finally {
      setPrefetching(false);
    }
  }, [prefetching, currentImage]);

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
      await preloadImages([batch[0].imageUrl]);
      preloadedHashesRef.current.add(batch[0].hash);
      const [first, ...rest] = batch;
      setCurrentImage(first);
      setImageQueue(rest);
    } catch (err) {
      console.error("Error loading initial images:", err);
      setCurrentImage(null);
      setProgressMessage("Unable to load images. Please retry.");
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  }, []);

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
    if (rest.length <= PREFETCH_THRESHOLD) fetchImageBatch();
  }, [imageQueue, fetchImageBatch]);

  useEffect(() => {
    loadInitialImages();
  }, [loadInitialImages]);

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
          setScore(correctAnswersValue);
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
        if (mounted && sessionId) sessionIdRef.current = sessionId;
      })
      .catch(() => {});
    return () => {
      mounted = false;
      const sessionId = sessionIdRef.current;
      if (sessionId) endSession(sessionId, true).catch(() => {});
      if (proofTimerRef.current) clearTimeout(proofTimerRef.current);
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

  const advanceProofStatus = (toStatus: ProofStatus, thenStoredAfterMs?: number) => {
    setProofStatus(toStatus);
    if (proofTimerRef.current) clearTimeout(proofTimerRef.current);
    if (thenStoredAfterMs) {
      proofTimerRef.current = setTimeout(() => {
        setProofStatus("stored");
        proofTimerRef.current = setTimeout(() => setProofStatus("idle"), 5000);
      }, thenStoredAfterMs);
    }
  };

  const handleGuess = async (guessedAI: boolean | null) => {
    if (!currentImage || showResult) return;
    if (isSubmittingAnswer) return;
    playClick();
    setTotalGames((prev) => prev + 1);
    setIsSubmittingAnswer(true);
    setLastTxHash(null);
    const ts = new Date().toISOString();
    setAnswerTimestamp(ts);
    advanceProofStatus("verifying");

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
      apiCurrentStreak = typeof response?.profile?.currentStreak === "number" ? response.profile.currentStreak : undefined;
      apiBestStreak = typeof response?.profile?.streak === "number" ? response.profile.streak : undefined;
      apiCorrectAnswers = typeof response?.profile?.correctAnswers === "number" ? response.profile.correctAnswers : undefined;

      const txHash = response?.onchain?.transactionHash;
      if (txHash) {
        setLastTxHash(txHash);
        addGameTransaction(txHash, "Classic");
        advanceProofStatus("verified", 2000);
        const explorerBase = networkConfig.blockExplorers?.default?.url;
        toast.success("Permanently recorded on 0G", {
          description: `${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
          duration: 8000,
          action: explorerBase
            ? { label: "View on 0G", onClick: () => window.open(`${explorerBase}/tx/${txHash}`, "_blank") }
            : undefined,
        });
      } else {
        advanceProofStatus("idle");
      }
    } catch {
      isCorrect = false;
      advanceProofStatus("idle");
    } finally {
      setIsSubmittingAnswer(false);
    }

    setTruthLabel(truth);
    void preloadNextImage(imageQueue[0]);

    if (isCorrect) {
      setShowResult("correct");
      playSuccess();

      const newStreak = typeof apiCurrentStreak === "number" ? apiCurrentStreak : streak + 1;
      const newCombo = Math.min(combo + 1, 5);
      const newBestStreak = typeof apiBestStreak === "number" ? apiBestStreak : Math.max(bestStreak, newStreak);
      const newCorrectAnswers = typeof apiCorrectAnswers === "number" ? apiCorrectAnswers : correctAnswers + 1;
      const newScore = newCorrectAnswers;

      setStreak(newStreak);
      setCombo(newCombo);
      setBestStreak(newBestStreak);
      setScore(newScore);
      setCorrectAnswers(newCorrectAnswers);
      onScoreUpdate(newScore, newStreak, newBestStreak);

      if (newBestStreak > bestStreak) {
        setProgressMessage(`New best streak! ${newBestStreak} 🏆`);
      }

      // Streak milestone toasts
      const streakMsg = getStreakToast(newStreak);
      if (streakMsg) {
        toast(streakMsg, { duration: 3500 });
      }

      addScorePopup(1, "score");
      if (newCombo > 1) setTimeout(() => addScorePopup(newCombo, "combo"), 200);
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
      if (typeof apiCorrectAnswers === "number") setCorrectAnswers(apiCorrectAnswers);
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

      <ScreenShake trigger={shakeScreen} intensity={15}>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-4 pb-6">
          <ClassicStatsBar
            streak={streak}
            score={score}
            onBack={() => { playBack(); onBack(); }}
          />

          {/* Last tx pill */}
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

          <GlowingBorder glowColor={getComboGlow()} intensity={combo >= 3 ? "high" : "medium"} className="rounded-3xl w-full max-w-lg">
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
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl md:text-4xl font-black gradient-text"
                >
                  AI or Human?
                </motion.h2>
                {combo >= 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-2 -right-2">
                    <Crown className="w-8 h-8 text-yellow drop-shadow-[0_0_10px_gold]" />
                  </motion.div>
                )}
              </div>

              <div
                className="relative rounded-2xl overflow-hidden mb-4 bg-muted/30 border-2 border-border w-full"
                style={{ aspectRatio: "4/3", maxHeight: "55vh" }}
              >
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
                          onError={(event) => {
                            const fallbackUrl = currentImage.fallbackImageUrl;
                            if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                              event.currentTarget.src = fallbackUrl;
                              return;
                            }
                            setImageError(true);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center text-muted-foreground/80 text-lg font-semibold">
                          Image unavailable
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-transparent to-magenta/10 mix-blend-overlay" />
                      {currentImage && !!showResult ? (
                        <VerifyHashEyeButton
                          hash={currentImage.hash}
                          visible
                          txHash={lastTxHash}
                          timestamp={answerTimestamp}
                          className="top-3 right-3"
                        />
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Initial loading spinner */}
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

                {/* Analyzing shimmer overlay */}
                <AnimatePresence>
                  {isSubmittingAnswer && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/80 border border-cyan-400/30 shadow-lg">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          <Zap className="w-4 h-4 text-cyan-400" />
                        </motion.div>
                        <span className="text-sm font-semibold text-cyan-200">Analyzing...</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground/70">Checking authenticity</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Result overlay */}
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

              {/* Proof status bar */}
              <div className="flex justify-center mb-2">
                <ProofStatusBar status={proofStatus} />
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

              {/* Trust Signal Badge */}
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">
                  Powered by 0G — Verifiable Gameplay
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
            </motion.div>
          </GlowingBorder>
        </div>
      </ScreenShake>
    </>
  );
};

export default ClassicGame;
