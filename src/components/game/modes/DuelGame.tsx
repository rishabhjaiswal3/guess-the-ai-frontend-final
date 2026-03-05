import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Swords, CheckCircle, XCircle, RotateCcw, Zap, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import confetti from "canvas-confetti";
import {
  getDuelQuestion,
  submitDuelAnswer,
  type ModeQuestionImage,
} from "@/services/gameModesApi";

interface DuelGameProps {
  onBack: () => void;
  onScoreUpdate: (points: number) => void;
}

type DuelMode = "normal" | "speed";

const DuelGame = ({ onBack, onScoreUpdate }: DuelGameProps) => {
  const [gameMode, setGameMode] = useState<DuelMode | null>(null);
  const [images, setImages] = useState<[ModeQuestionImage | null, ModeQuestionImage | null]>([null, null]);
  const [targetLabel, setTargetLabel] = useState<"ai" | "human">("ai");
  const [promptText, setPromptText] = useState<string>("Two images. Pick the right one!");
  const [correctPosition, setCorrectPosition] = useState<0 | 1>(0);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [lastRoundPoints, setLastRoundPoints] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadNewRound = async () => {
    if (!gameMode) return;

    setIsLoading(true);
    setSelectedPosition(null);
    setShowResult(false);
    setLastRoundPoints(0);
    if (gameMode === "speed") setTimeLeft(3);

    try {
      const question = await getDuelQuestion(gameMode);
      const nextImages = question.images || [];
      setImages([nextImages[0] || null, nextImages[1] || null]);
      setTargetLabel((question.askingFor || "ai") as "ai" | "human");
      setPromptText(question.questionText || "Choose the correct image");
    } catch {
      setImages([null, null]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (gameMode) {
      loadNewRound();
      if (gameMode === "speed") {
        setLives(3);
        setGameOver(false);
      }
    }
  }, [gameMode]);

  useEffect(() => {
    if (gameMode === "speed" && !isLoading && !showResult && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setSelectedPosition(null);
            setShowResult(true);
            setStreak(0);
            const nextLives = lives - 1;
            setLives(nextLives);
            if (nextLives <= 0) setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameMode, isLoading, showResult, round, gameOver, lives]);

  const handleSelect = async (position: number) => {
    if (showResult || gameOver) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const selectedImage = images[position];
    if (!selectedImage || !images[0] || !images[1]) return;

    setSelectedPosition(position);

    try {
      const response = await submitDuelAnswer({
        hashes: [images[0].hash, images[1].hash],
        selectedHash: selectedImage.hash,
        askingFor: targetLabel,
        variant: gameMode || "normal",
      });

      const results = response.results || [];
      const correctHash = results.find((item) => item.truth === targetLabel)?.hash;
      const nextCorrectPosition = correctHash === images[0].hash ? 0 : 1;
      setCorrectPosition(nextCorrectPosition as 0 | 1);

      const selectedResult = results.find((item) => item.hash === selectedImage.hash);
      const isCorrect = Boolean(selectedResult?.isCorrect);
      const points = Number(response?.score?.delta || 0);
      setLastRoundPoints(points);

      setShowResult(true);

      if (isCorrect) {
        setScore((prev) => prev + points);
        setStreak((prev) => prev + 1);
        onScoreUpdate(points);

        if ((streak + 1) % 3 === 0) {
          confetti({
            particleCount: 50,
            spread: 45,
            origin: { y: 0.6 },
            colors: ["#00FFFF", "#FF00FF"],
          });
        }
      } else {
        setScore((prev) => prev + points);
        onScoreUpdate(points);
        setStreak(0);
        if (gameMode === "speed") {
          const nextLives = lives - 1;
          setLives(nextLives);
          if (nextLives <= 0) setGameOver(true);
        }
      }
    } catch {
      setShowResult(false);
    }
  };

  const handleNextRound = () => {
    setRound((prev) => prev + 1);
    loadNewRound();
  };

  const handleRestart = () => {
    setScore(0);
    setStreak(0);
    setRound(1);
    setLives(3);
    setGameOver(false);
    loadNewRound();
  };

  const isCorrect = selectedPosition !== null && selectedPosition === correctPosition;

  if (!gameMode) {
    return (
      <div className="min-h-[calc(100vh-200px)] px-4 pt-16 pb-28">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </motion.div>

          <GlowingBorder glowColor="cyan" intensity="medium" className="rounded-3xl mb-8">
            <div className="glass-strong rounded-3xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Swords className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-black gradient-text">DUEL MODE</h2>
                <Swords className="w-8 h-8 text-primary transform scale-x-[-1]" />
              </div>
              <p className="text-muted-foreground">Choose your challenge</p>
            </div>
          </GlowingBorder>

          <div className="grid grid-cols-1 gap-4">
            <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setGameMode("normal")} className="glass-strong rounded-2xl p-6 text-left group hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Timer className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">Normal Mode</h3>
                  <p className="text-sm text-muted-foreground">Take your time, no pressure</p>
                </div>
                <span className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </motion.button>

            <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setGameMode("speed")} className="glass-strong rounded-2xl p-6 text-left group hover:border-secondary/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow to-orange-500 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">Speed Blitz</h3>
                  <p className="text-sm text-muted-foreground">3 seconds only! 3 lives!</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-destructive/20 text-destructive">Expert</span>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="min-h-[calc(100vh-200px)] px-4 pt-16 pb-28">
        <div className="max-w-lg mx-auto">
          <GlowingBorder glowColor="magenta" intensity="high" className="rounded-3xl">
            <div className="glass-strong rounded-3xl p-8 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4">💀</motion.div>
              <h2 className="text-3xl font-black text-destructive mb-2">GAME OVER</h2>
              <p className="text-muted-foreground mb-6">You ran out of lives!</p>

              <div className="glass rounded-xl p-4 mb-6">
                <div className="text-4xl font-black gradient-text">{score}</div>
                <div className="text-muted-foreground">Final Score</div>
                <div className="text-sm text-muted-foreground mt-2">Rounds: {round} | Best Streak: {streak}</div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setGameMode(null)} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleRestart} className="flex-1 btn-gradient text-primary-foreground">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </GlowingBorder>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] px-4 pt-16 pb-28">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => setGameMode(null)} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            {gameMode === "speed" && (
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className={`text-lg ${i < lives ? "" : "opacity-30"}`}>❤️</span>
                ))}
              </div>
            )}
            <span className="text-orange font-bold">🔥 {streak}</span>
            <div className="glass px-4 py-2 rounded-full font-bold text-primary">Score: {score}</div>
          </div>
        </motion.div>

        <GlowingBorder glowColor={gameMode === "speed" ? "rainbow" : "cyan"} intensity="medium" className="rounded-3xl mb-6">
          <div className="glass-strong rounded-3xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              {gameMode === "speed" ? <Zap className="w-8 h-8 text-yellow" /> : <Swords className="w-8 h-8 text-primary" />}
              <h2 className="text-2xl font-black gradient-text">{gameMode === "speed" ? "SPEED BLITZ" : "DUEL MODE"}</h2>
              {gameMode === "speed" ? <Zap className="w-8 h-8 text-yellow" /> : <Swords className="w-8 h-8 text-primary transform scale-x-[-1]" />}
            </div>
            {gameMode === "speed" && !isLoading && !showResult && (
              <motion.div key={timeLeft} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`text-4xl font-black ${timeLeft <= 1 ? "text-destructive" : "text-yellow"}`}>
                {timeLeft}
              </motion.div>
            )}
            {gameMode === "normal" && <p className="text-muted-foreground">{promptText}</p>}
          </div>
        </GlowingBorder>

        <div className="relative mb-6">
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((position) => (
              <motion.div
                key={position}
                initial={{ opacity: 0, x: position === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: position * 0.2 }}
                onClick={() => !showResult && handleSelect(position)}
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedPosition === position
                    ? "ring-4 ring-secondary scale-[0.98]"
                    : showResult
                      ? "opacity-70"
                      : "hover:scale-[1.02] hover:ring-2 hover:ring-primary/50"
                }`}
              >
                {isLoading ? (
                  <ImageSkeleton className="absolute inset-0 rounded-none" aspectRatio="portrait" />
                ) : images[position] ? (
                  <img src={images[position]!.imageUrl || images[position]!.url} alt={`Image ${position + 1}`} className="w-full h-full object-cover" />
                ) : null}

                <div className="absolute top-3 left-3 w-10 h-10 rounded-full glass flex items-center justify-center font-black text-lg text-foreground">
                  {position === 0 ? "A" : "B"}
                </div>

                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`absolute inset-0 flex items-center justify-center ${
                        position === correctPosition ? "bg-secondary/80" : selectedPosition === position ? "bg-error-overlay" : ""
                      }`}
                    >
                      {position === correctPosition && (
                        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="text-center">
                          <span className="text-5xl block mb-2">{targetLabel === "ai" ? "🤖" : "👤"}</span>
                          <span className="text-xl font-black text-foreground">{targetLabel.toUpperCase()}!</span>
                        </motion.div>
                      )}
                      {position !== correctPosition && selectedPosition === position && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                          <span className="text-5xl block mb-2">❌</span>
                          <span className="text-sm font-bold text-foreground">Wrong</span>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center font-black text-xl text-foreground shadow-lg">VS</div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showResult && !gameOver && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className={`glass-strong rounded-xl p-4 text-center ${isCorrect ? "border-primary" : "border-destructive"}`}>
                {selectedPosition !== null && isCorrect ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-black text-primary">Correct! +{lastRoundPoints}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <XCircle className="w-8 h-8 text-destructive" />
                    <span className="text-xl font-bold text-destructive">{selectedPosition === null ? "Time's up!" : "Wrong choice!"}</span>
                  </div>
                )}
              </div>

              <Button onClick={handleNextRound} className="w-full h-14 btn-gradient text-primary-foreground text-lg font-bold">
                <RotateCcw className="w-5 h-5 mr-2" />
                Next Duel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!showResult && !isLoading && (
          <p className="text-center text-muted-foreground text-sm">Tap the image you think is {targetLabel.toUpperCase()}</p>
        )}
      </div>
    </div>
  );
};

export default DuelGame;
