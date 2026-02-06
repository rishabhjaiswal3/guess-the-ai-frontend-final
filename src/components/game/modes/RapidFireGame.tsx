import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, UserRound, Timer, Zap, Heart, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRandomImage, GameImage } from "@/data/sampleImages";
import GlowingBorder from "@/components/effects/GlowingBorder";
import AnimatedCounter from "@/components/effects/AnimatedCounter";
import ScreenShake from "@/components/effects/ScreenShake";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import confetti from "canvas-confetti";

interface RapidFireGameProps {
  onBack: () => void;
  onScoreUpdate: (points: number) => void;
}

const RapidFireGame = ({ onBack, onScoreUpdate }: RapidFireGameProps) => {
  const [currentImage, setCurrentImage] = useState<GameImage | null>(null);
  const [usedImageIds, setUsedImageIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadNextImage = useCallback(() => {
    setIsLoading(true);
    const img = getRandomImage(usedImageIds);
    if (img) {
      setCurrentImage(img);
      setUsedImageIds((prev) => [...prev, img.id]);
    } else {
      // Pool exhausted, reset
      const resetImg = getRandomImage([]);
      setCurrentImage(resetImg);
      setUsedImageIds(resetImg ? [resetImg.id] : []);
    }
    setTimeout(() => setIsLoading(false), 200);
  }, [usedImageIds]);

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    setIsGameActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Timer
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
    setScore(0);
    setLives(3);
    setTimeLeft(30);
    setCombo(0);
    setTotalAnswered(0);
    setCorrectAnswers(0);
    setGameOver(false);
    setShowResult(null);
    setUsedImageIds([]);
    setIsGameActive(true);
    loadNextImage();
  };

  const handleGuess = (guessedAI: boolean) => {
    if (!currentImage || showResult || gameOver) return;

    const isCorrect = guessedAI === currentImage.isAI;
    setTotalAnswered((prev) => prev + 1);

    if (isCorrect) {
      setShowResult("correct");
      const newCombo = combo + 1;
      setCombo(newCombo);
      setCorrectAnswers((prev) => prev + 1);

      const points = 10 + newCombo * 2;
      setScore((prev) => prev + points);
      onScoreUpdate(points);

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

  // Start screen
  if (!isGameActive && !gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-[4.5rem] pb-20 lg:pb-16">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground self-start max-w-md w-full mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Modes
        </Button>

        <GlowingBorder glowColor="rainbow" intensity="high" className="rounded-3xl w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-3xl p-8 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              ⚡
            </motion.div>

            <h2 className="text-4xl font-black gradient-text mb-2">RAPID FIRE</h2>
            <p className="text-muted-foreground mb-6">
              How fast can you spot AI?
            </p>

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
              <Button
                onClick={handleStart}
                className="w-full h-16 text-xl font-black btn-gradient text-primary-foreground"
              >
                <Zap className="w-6 h-6 mr-2" />
                START RAPID FIRE
              </Button>
            </motion.div>
          </motion.div>
        </GlowingBorder>
      </div>
    );
  }

  // Game over screen
  if (gameOver) {
    const accuracy =
      totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-[4.5rem] pb-20 lg:pb-16">
        <GlowingBorder glowColor="magenta" intensity="high" className="rounded-3xl w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-3xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-6xl mb-4"
            >
              {lives <= 0 ? "💀" : "⏰"}
            </motion.div>

            <h2 className="text-3xl font-black mb-2 text-destructive">
              {lives <= 0 ? "OUT OF LIVES!" : "TIME'S UP!"}
            </h2>

            <div className="glass rounded-2xl p-6 mb-6">
              <div className="text-5xl font-black gradient-text mb-1">{score}</div>
              <div className="text-muted-foreground text-sm">Final Score</div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {correctAnswers}
                  </div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">
                    {totalAnswered - correctAnswers}
                  </div>
                  <div className="text-xs text-muted-foreground">Wrong</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow">{accuracy}%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={onBack} variant="outline" className="flex-1 glass text-foreground h-12">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Modes
              </Button>
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

  // Active game
  return (
    <ScreenShake trigger={shakeScreen} intensity={15}>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-[4.5rem] pb-20 lg:pb-16">
        {/* Top bar: timer, lives, score */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between w-full max-w-md mb-4"
        >
          <Button variant="ghost" size="sm" onClick={handleGameOver} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quit
          </Button>

          {/* Timer */}
          <div
            className={`glass px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              timeLeft <= 10
                ? "text-destructive animate-pulse"
                : timeLeft <= 20
                ? "text-yellow"
                : "text-primary"
            }`}
          >
            <Timer className="w-4 h-4" />
            <span className="font-bold text-sm w-5 text-center">
              <AnimatedCounter value={timeLeft} />
            </span>
          </div>

          {/* Lives */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={
                  i >= lives
                    ? { scale: 0.6, opacity: 0.2 }
                    : { scale: 1, opacity: 1 }
                }
                className="text-xl"
              >
                ❤️
              </motion.span>
            ))}
          </div>

          {/* Score */}
          <div className="glass px-3 py-2 rounded-full flex items-center gap-1">
            <Star className="w-4 h-4 text-secondary fill-secondary" />
            <AnimatedCounter value={score} className="font-bold text-lg" />
          </div>
        </motion.div>

        {/* Combo indicator */}
        <AnimatePresence>
          {combo >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="mb-3 text-center"
            >
              <span className="text-xl font-black text-yellow">
                🔥 {combo}x COMBO!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main game card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-3xl p-4 w-full max-w-md"
        >
          {/* Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-muted/30 border-2 border-border">
            <AnimatePresence mode="wait">
              {currentImage && !isLoading && (
                <motion.div
                  key={currentImage.id}
                  initial={{ opacity: 0, x: 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -80 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <img
                    src={currentImage.url}
                    alt="Guess"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading && (
              <ImageSkeleton className="absolute inset-0 rounded-none" />
            )}

            {/* Result overlay */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 flex items-center justify-center ${
                    showResult === "correct"
                      ? "bg-success-overlay"
                      : "bg-error-overlay"
                  }`}
                >
                  <span className="text-7xl">
                    {showResult === "correct" ? "✓" : "✗"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleGuess(true)}
                disabled={!!showResult || isLoading}
                className="w-full h-16 text-xl font-black bg-muted hover:bg-muted/80 text-foreground border-2 border-border hover:border-cyan/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all"
              >
                <Bot className="w-6 h-6 mr-2" />
                AI
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleGuess(false)}
                disabled={!!showResult || isLoading}
                className="w-full h-16 text-xl font-black btn-gradient text-primary-foreground hover:shadow-[0_0_20px_rgba(255,0,255,0.3)]"
              >
                <UserRound className="w-6 h-6 mr-2" />
                HUMAN
              </Button>
            </motion.div>
          </div>

          <div className="mt-3 text-center text-xs text-muted-foreground">
            Answered: {totalAnswered} | Combo: {combo}x
          </div>
        </motion.div>
      </div>
    </ScreenShake>
  );
};

export default RapidFireGame;
