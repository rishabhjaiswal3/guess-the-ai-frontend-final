import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { getNext10ImagesWithUrls, submitAnswer, startSession, endSession, type GameImageWithUrl } from "@/services/gameApi";
import { getProfile } from "@/services/authApi";
import { isSoundEnabled } from "@/lib/sound";
import { preloadImages } from "@/lib/imageUrl";
import GlowingBorder from "@/components/effects/GlowingBorder";
import FloatingScorePopup from "@/components/effects/FloatingScorePopup";
import ScreenShake from "@/components/effects/ScreenShake";
import HintBadge from "@/components/game/HintBadge";
import { useFeedbackSound } from "@/hooks/useFeedbackSound";
import { useHint } from "@/hooks/useHint";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import ClassicGuessButtons from "@/components/game/classic/ClassicGuessButtons";
import GameRulesDialog from "@/components/game/GameRulesDialog";
import networkConfig from "@/lib/networkConfig";
import { addGameTransaction } from "@/lib/gameTransactions";
import { toast } from "@/components/ui/sonner";
import VerifyHashEyeButton from "@/components/game/VerifyHashEyeButton";
import GameImageBox from "@/components/game/GameImageBox";
import { useAuth } from "@/context/AuthContext";
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
  const [lastAnsweredImage, setLastAnsweredImage] = useState<{ hash: string; imageUrl: string; fallbackImageUrl: string } | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState("Analyzing response...");

  const gameCardRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const preloadedHashesRef = useRef<Set<string>>(new Set());
  const proofTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playClick, playBack, playSuccess, playFail } = useFeedbackSound();
  const { refreshProfile } = useAuth();

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
        const [first, ...rest] = batch;
        setCurrentImage(first);
        setImageQueue(rest);
        preloadImages([first.imageUrl]).then(() => {
          preloadedHashesRef.current.add(first.hash);
        }).catch(() => {});
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
      const [first, ...rest] = batch;
      setCurrentImage(first);
      setImageQueue(rest);
      preloadImages([first.imageUrl]).then(() => {
        preloadedHashesRef.current.add(first.hash);
      }).catch(() => {});
    } catch (err) {
      console.error("Error loading initial images:", err);
      setCurrentImage(null);
      setProgressMessage("Unable to load images. Please retry.");
    } finally {
      setIsLoading(false);
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
    setScanMessage("KULT: Analyzing response...");
    
    // Cycle messages during scan
    const scanInterval = setInterval(() => {
      setScanMessage(prev => {
        if (prev === "KULT: Analyzing response...") return "KULT: Pattern detected...";
        if (prev === "KULT: Pattern detected...") {
          // Step 4: Voice Synthesis
          if ('speechSynthesis' in window && isSoundEnabled()) {
            const msg = new SpeechSynthesisUtterance("Pattern detected");
            msg.rate = 1.1;
            msg.pitch = 0.5;
            window.speechSynthesis.speak(msg);
          }
          return `KULT: Confidence score: ${Math.floor(Math.random() * 20 + 80)}%`;
        }
        return prev;
      });
    }, 800);

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

      refreshProfile().catch(() => {});
    } catch {
      isCorrect = false;
      advanceProofStatus("idle");
    } finally {
      clearInterval(scanInterval);
      setIsSubmittingAnswer(false);
    }

    setTruthLabel(truth);
    setLastAnsweredImage({
      hash: currentImage.hash,
      imageUrl: currentImage.imageUrl,
      fallbackImageUrl: currentImage.fallbackImageUrl,
    });
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
        <div className="min-h-screen px-4 pt-4 pb-6">
          <div className="mx-auto w-full max-w-lg">
            <ClassicStatsBar
              streak={streak}
              score={score}
              onBack={() => { playBack(); onBack(); }}
              onRules={() => setRulesOpen(true)}
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

          <GlowingBorder glowColor={getComboGlow()} intensity={combo >= 3 ? "high" : "medium"} className="w-full rounded-3xl">
            <motion.div
              ref={gameCardRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-strong w-full rounded-3xl p-7"
            >
              <div className="relative text-center mb-3">
                <motion.h2
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(107,140,255,0.48)",
                      "0 0 40px rgba(139,93,255,0.48)",
                      "0 0 20px rgba(107,140,255,0.48)",
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
                className="relative rounded-2xl mb-4 w-full"
                style={{ aspectRatio: "4/3", maxHeight: "55vh", perspective: "1000px" }}
              >
                <motion.div
                  className="w-full h-full relative"
                  initial={false}
                  animate={{ rotateY: showResult ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* FRONT OF CARD */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-muted/30 border-2 border-border rounded-2xl overflow-hidden shadow-lg"
                    style={{ backfaceVisibility: "hidden" }}
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
                            <GameImageBox
                              src={currentImage.imageUrl}
                              alt="Guess if this is AI or Human made"
                              skeletonAspect="landscape"
                              onImageError={(event) => {
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
                          <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-br from-cyan/10 via-transparent to-magenta/10 mix-blend-overlay" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Initial loading spinner */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-muted/30 flex flex-col items-center justify-center gap-4">
                        <div className="relative w-16 h-16">
                          <motion.div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-4 bg-cyan-400/20 rounded-full blur-md"
                          />
                        </div>
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-sm font-mono text-cyan-300 tracking-wider uppercase"
                        >
                          Generating Challenge...
                        </motion.div>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none"
                          animate={{ y: ["-100%", "100%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
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
                            className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-2xl"
                          >
                            {/* Step 1: Neural Eye Motif */}
                            <div className="relative w-28 h-28 mb-6">
                              {/* Outer rings */}
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-2 border-cyan-500/20 rounded-full border-t-cyan-500/50"
                              />
                              <motion.div 
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 border border-magenta/10 rounded-full border-b-magenta/30"
                              />
                              
                              {/* Pulsating Eye Iris */}
                              <motion.div 
                                animate={{ 
                                  scale: [0.95, 1.05, 0.95],
                                  boxShadow: ["0 0 10px rgba(34,211,238,0.2)", "0 0 30px rgba(34,211,238,0.6)", "0 0 10px rgba(34,211,238,0.2)"]
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-7 bg-cyan-950/50 rounded-full border-2 border-cyan-400 flex items-center justify-center overflow-hidden shadow-[inset_0_0_15px_rgba(34,211,238,0.5)]"
                              >
                                <div className="w-5 h-5 bg-cyan-400 rounded-full blur-[1px]" />
                                <motion.div 
                                  animate={{ height: ["10%", "70%", "10%"] }}
                                  transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 3 }}
                                  className="absolute inset-0 bg-black/80 w-full"
                                />
                              </motion.div>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                              <AnimatePresence mode="wait">
                                <motion.span 
                                  key={scanMessage}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  className="text-xs font-mono font-bold text-cyan-400 tracking-wider"
                                >
                                  {scanMessage}
                                </motion.span>
                              </AnimatePresence>
                              <div className="w-32 h-1 bg-cyan-900/50 rounded-full overflow-hidden mt-1">
                                <motion.div 
                                  className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                                  initial={{ width: "0%" }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 2, ease: "linear" }}
                                />
                              </div>
                            </div>
                          </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* BACK OF CARD (RESULT) */}
                  <div 
                    className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden border-2 shadow-2xl flex flex-col items-center justify-center ${
                      showResult === "correct" 
                        ? "bg-emerald-950/80 border-emerald-500/50" 
                        : "bg-rose-950/80 border-rose-500/50"
                    }`}
                    style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                    
                    {currentImage && (
                      <div className="absolute inset-0 opacity-30 mix-blend-overlay filter blur-sm">
                        <GameImageBox src={currentImage.imageUrl} alt="" skeletonAspect="landscape" />
                      </div>
                    )}

                    <div className="relative z-10 text-center">
                      {showResult === "correct" ? (
                        <>
                          <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-24 h-24 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                          >
                            <span className="text-5xl text-emerald-400 block">✓</span>
                          </motion.div>
                          <span className="text-4xl font-black text-emerald-400 drop-shadow-lg tracking-wider">CORRECT!</span>
                          <p className="text-emerald-200/80 mt-2 font-medium">Pattern successfully identified</p>
                        </>
                      ) : (
                        <>
                          <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-24 h-24 mx-auto bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-400/50 shadow-[0_0_30px_rgba(244,63,94,0.3)]"
                          >
                            <span className="text-5xl text-rose-400 block">✗</span>
                          </motion.div>
                          <span className="text-4xl font-black text-rose-400 drop-shadow-lg tracking-wider">WRONG!</span>
                          {truthLabel && (
                            <span className="block text-xl text-rose-100 mt-3 font-medium">
                              It was actually <span className="font-bold text-white bg-rose-500/30 px-3 py-1 rounded-lg ml-1 border border-rose-400/30">{truthLabel === "ai" ? "AI" : "Human"}</span>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
                
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

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="bg-background/40 border border-border/50 rounded-xl p-2 text-center backdrop-blur-sm">
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Level</span>
                  <span className="text-sm font-black text-cyan-300">Rank {Math.floor(score / 5) + 1}</span>
                </div>
                <div className="bg-background/40 border border-border/50 rounded-xl p-2 text-center backdrop-blur-sm">
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Accuracy</span>
                  <span className="text-sm font-black text-magenta">{accuracy}%</span>
                </div>
                <div className="bg-background/40 border border-border/50 rounded-xl p-2 text-center backdrop-blur-sm">
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Best Streak</span>
                  <span className="text-sm font-black text-yellow-400">{bestStreak} 🔥</span>
                </div>
              </div>

              {/* Proof Record Row — persists after each submission */}
              <div className="mt-4 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-cyan-900/10 border border-cyan-500/20 w-max mx-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-[10px] text-cyan-200/80 font-semibold tracking-wide uppercase">
                  {lastAnsweredImage ? "Last answer proof" : "Verified on 0G"}
                </span>
                {lastAnsweredImage && (
                  <VerifyHashEyeButton
                    hash={lastAnsweredImage.hash}
                    imageUrl={lastAnsweredImage.imageUrl}
                    fallbackImageUrl={lastAnsweredImage.fallbackImageUrl}
                    visible
                    txHash={lastTxHash}
                    timestamp={answerTimestamp}
                    className="h-6 w-6 min-w-6 [&_svg]:h-3 [&_svg]:w-3"
                  />
                )}
              </div>
            </motion.div>
          </GlowingBorder>
          </div>
        </div>
      </ScreenShake>
      <GameRulesDialog mode="classic" open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  );
};

export default ClassicGame;
