import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, UserRound, Timer, Zap, Heart, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import AnimatedCounter from "@/components/effects/AnimatedCounter";
import ScreenShake from "@/components/effects/ScreenShake";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import GameRulesDialog from "@/components/game/GameRulesDialog";
import HintBadge from "@/components/game/HintBadge";
import { useGameProfileStats } from "@/hooks/useGameProfileStats";
import { useHint } from "@/hooks/useHint";
import confetti from "canvas-confetti";
import {
  getRapidFireQuestion,
  submitRapidFireAnswer,
  type ModeQuestionImage,
} from "@/services/gameModesApi";
import VerifyHashEyeButton from "@/components/game/VerifyHashEyeButton";

interface RapidFireGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number, streak: number, bestStreak: number) => void;
}

const RapidFireGame = ({ onBack, onScoreUpdate }: RapidFireGameProps) => {
  const [currentImage, setCurrentImage] = useState<ModeQuestionImage | null>(null);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameActive, setIsGameActive] = useState(false);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [combo, setCombo] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [scanMessage, setScanMessage] = useState("Analyzing response...");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { score, streak, bestStreak, applyProfileStats, refreshProfile } = useGameProfileStats();
  const { hint, loading: hintLoading } = useHint(roundId);

  const loadNextImage = useCallback(async () => {
    setIsLoading(true);
    setRoundId(null);
    try {
      const question = await getRapidFireQuestion();
      setCurrentImage(question.images?.[0] || null);
      setRoundId(question.roundId || null);
    } catch {
      setCurrentImage(null);
    } finally {
      setTimeout(() => setIsLoading(false), 200);
    }
  }, []);

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    setIsGameActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!isGameActive || gameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameActive, gameOver, handleGameOver]);

  const handleStart = () => {
    setLives(3);
    setTimeLeft(30);
    setCombo(0);
    setTotalAnswered(0);
    setCorrectAnswers(0);
    setGameOver(false);
    setShowResult(null);
    setIsGameActive(true);
    loadNextImage();
  };

  const handleGuess = async (guessedAI: boolean) => {
    if (!currentImage || showResult || gameOver) return;

    setTotalAnswered((prev) => prev + 1);

    let isCorrect = false;
    let points = 0;

    setIsSubmittingAnswer(true);
    setScanMessage("Analyzing response...");
    const scanInterval = setInterval(() => {
      setScanMessage(prev => {
        if (prev === "Analyzing response...") return "Pattern detected...";
        if (prev === "Pattern detected...") return `Confidence score: ${Math.floor(Math.random() * 20 + 80)}%`;
        return prev;
      });
    }, 200); // Faster for Rapid Fire

    try {
      const response = await submitRapidFireAnswer({
        hash: currentImage.hash,
        guess: guessedAI ? "ai" : "human",
        combo,
      });

      // Shorter artificial delay for "Rapid Fire"
      await new Promise(resolve => setTimeout(resolve, 600));
      clearInterval(scanInterval);
      setIsSubmittingAnswer(false);
      isCorrect = Boolean(response?.results?.[0]?.isCorrect);
      points = Number(response?.score?.delta || 0);
      const nextStats = applyProfileStats(response?.profile, {
        score: score + Math.max(0, points),
        streak: isCorrect ? streak + 1 : 0,
        bestStreak: isCorrect ? Math.max(bestStreak, streak + 1) : bestStreak,
      });
      onScoreUpdate(nextStats.score, nextStats.streak, nextStats.bestStreak);
      refreshProfile().catch(() => {});
    } catch {
      isCorrect = false;
      points = 0;
    }

    if (isCorrect) {
      setShowResult("correct");
      const newCombo = combo + 1;
      setCombo(newCombo);
      setCorrectAnswers((prev) => prev + 1);

      if (newCombo % 5 === 0) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#FFD700", "#FF00FF", "#00FFFF"],
        });
      }
    } else {
      setShowResult("wrong");
      setCombo(0);
      const newLives = lives - 1;
      setLives(newLives);
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 400);

      if (newLives <= 0) {
        setTimeout(() => handleGameOver(), 300);
        return;
      }
    }

    setTimeout(() => {
      setShowResult(null);
      loadNextImage();
    }, 300);
  };

  if (!isGameActive && !gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-4 pb-6">


        <GlowingBorder glowColor="rainbow" intensity="high" className="rounded-3xl w-full max-w-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-3xl p-8 text-center">
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-6xl mb-4">
              ⚡
            </motion.div>

            <h2 className="text-4xl font-black gradient-text mb-2">RAPID FIRE</h2>
            <p className="text-muted-foreground mb-6">How fast can you spot AI?</p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="glass rounded-xl p-4">
                <Timer className="w-7 h-7 text-yellow mx-auto mb-2" />
                <div className="font-bold text-foreground">30s</div>
                <div className="text-xs text-muted-foreground">Timer</div>
              </div>
              <div className="glass rounded-xl p-4">
                <Heart className="w-7 h-7 text-destructive mx-auto mb-2" />
                <div className="font-bold text-foreground">3</div>
                <div className="text-xs text-muted-foreground">Lives</div>
              </div>
              <div className="glass rounded-xl p-4">
                <Zap className="w-7 h-7 text-primary mx-auto mb-2" />
                <div className="font-bold text-foreground">Fast</div>
                <div className="text-xs text-muted-foreground">Pace</div>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleStart} className="w-full h-16 text-xl font-black btn-gradient text-primary-foreground">
                <Zap className="w-6 h-6 mr-2" />
                START RAPID FIRE
              </Button>
            </motion.div>
          </motion.div>
        </GlowingBorder>
      </div>
    );
  }

  if (gameOver) {
    const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-4 pb-6">
        <GlowingBorder glowColor="magenta" intensity="high" className="rounded-3xl w-full max-w-md">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-3xl p-8 text-center">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }} className="text-6xl mb-4">
              {lives <= 0 ? "💀" : "⏰"}
            </motion.div>

            <h2 className="text-3xl font-black mb-2 text-destructive">{lives <= 0 ? "OUT OF LIVES!" : "TIME'S UP!"}</h2>

            <div className="glass rounded-2xl p-6 mb-6">
              <div className="text-5xl font-black gradient-text mb-1">{score}</div>
              <div className="text-muted-foreground text-sm">Final Score</div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-2xl font-bold text-green-400">{correctAnswers}</div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">{totalAnswered - correctAnswers}</div>
                  <div className="text-xs text-muted-foreground">Wrong</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow">{accuracy}%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">

              <Button onClick={handleStart} className="flex-1 btn-gradient text-primary-foreground h-12">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </div>
          </motion.div>
        </GlowingBorder>
      </div>
    );
  }

  return (
    <>
      <ScreenShake trigger={shakeScreen} intensity={15}>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-4 pb-6">
          <ClassicStatsBar streak={streak} score={score} onBack={handleGameOver} onRules={() => setRulesOpen(true)} />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-end gap-3 w-full max-w-md mb-4">
          <div className={`glass px-3 py-1.5 rounded-full flex items-center gap-1.5 ${timeLeft <= 10 ? "text-destructive animate-pulse" : timeLeft <= 20 ? "text-yellow" : "text-primary"}`}>
            <Timer className="w-4 h-4" />
            <span className="font-bold text-sm w-5 text-center"><AnimatedCounter value={timeLeft} /></span>
          </div>

          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} animate={i >= lives ? { scale: 0.6, opacity: 0.2 } : { scale: 1, opacity: 1 }} className="text-xl">❤️</motion.span>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {combo >= 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="mb-3 text-center">
              <span className="text-xl font-black text-yellow">🔥 {combo}x COMBO!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-3xl p-4 w-full max-w-md">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-muted/30 border-2 border-border">
            <AnimatePresence mode="wait">
              {currentImage && !isLoading && (
                <motion.div key={currentImage.hash} initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }} transition={{ duration: 0.2 }} className="relative w-full h-full">
                  <img
                    src={currentImage.imageUrl || currentImage.url}
                    alt="Guess"
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      const fallbackUrl = currentImage.fallbackImageUrl;
                      if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                        event.currentTarget.src = fallbackUrl;
                      }
                    }}
                  />
                  {currentImage && !!showResult ? (
                    <VerifyHashEyeButton hash={currentImage.hash} visible className="top-3 right-3" />
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center rounded-2xl">
                 <div className="relative w-12 h-12 mb-4">
                    <motion.div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full"
                    />
                  </div>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[10px] font-mono text-cyan-300 tracking-wider uppercase font-bold"
                  >
                    Generating Challenge...
                  </motion.div>
              </div>
            )}

            <AnimatePresence>
              {isSubmittingAnswer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-2xl"
                >
                  <div className="relative w-12 h-12 mb-3">
                    <motion.div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full"
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={scanMessage}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-xs font-bold text-cyan-400 tracking-wider"
                    >
                      {scanMessage}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showResult && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 flex items-center justify-center ${showResult === "correct" ? "bg-success-overlay" : "bg-error-overlay"}`}>
                  <span className="text-7xl">{showResult === "correct" ? "✓" : "✗"}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <HintBadge hint={hint} loading={hintLoading} />

          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => handleGuess(true)} disabled={!!showResult || isLoading} className="w-full h-16 text-xl font-black bg-muted hover:bg-muted/80 text-foreground border-2 border-border hover:border-cyan/50 hover:shadow-[0_0_20px_rgba(107,140,255,0.22)] transition-all">
                <Bot className="w-6 h-6 mr-2" />
                AI
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => handleGuess(false)} disabled={!!showResult || isLoading} className="w-full h-16 text-xl font-black btn-gradient text-primary-foreground hover:shadow-[0_0_20px_rgba(139,93,255,0.3)]">
                <UserRound className="w-6 h-6 mr-2" />
                HUMAN
              </Button>
            </motion.div>
          </div>

          <div className="mt-3 text-center text-xs text-muted-foreground">Answered: {totalAnswered} | Combo: {combo}x</div>
        </motion.div>
        </div>
      </ScreenShake>
      <GameRulesDialog mode="rapidfire" open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  );
};

export default RapidFireGame;
