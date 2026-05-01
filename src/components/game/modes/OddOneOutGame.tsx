import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import { useGameProfileStats } from "@/hooks/useGameProfileStats";
import confetti from "canvas-confetti";
import {
  getOddOneOutQuestion,
  submitOddOneOutAnswer,
  type ModeQuestionImage,
} from "@/services/gameModesApi";
import VerifyHashEyeButton from "@/components/game/VerifyHashEyeButton";

interface OddOneOutGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number, streak: number, bestStreak: number) => void;
}

const OddOneOutGame = ({ onBack, onScoreUpdate }: OddOneOutGameProps) => {
  const [images, setImages] = useState<ModeQuestionImage[]>([]);
  const [oddIndex, setOddIndex] = useState<number>(0);
  const [askingFor, setAskingFor] = useState<"ai" | "human">("human");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [roundPoints, setRoundPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { score, streak, bestStreak, applyProfileStats, refreshProfile } = useGameProfileStats();

  const loadNewRound = async () => {
    setIsLoading(true);
    setSelectedIndex(null);
    setShowResult(false);
    setRoundPoints(0);

    try {
      const question = await getOddOneOutQuestion();
      setImages(question.images || []);
      setAskingFor((question.askingFor || "human") as "ai" | "human");
      setOddIndex(0);
    } catch {
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNewRound();
  }, []);

  const handleSelect = async (index: number) => {
    if (showResult || !images[index]) return;

    setSelectedIndex(index);

    try {
      const response = await submitOddOneOutAnswer({
        hashes: images.map((img) => img.hash),
        selectedHash: images[index].hash,
        askingFor,
      });

      const oddHash = response.oddHash;
      const resolvedOddIndex = images.findIndex((img) => img.hash === oddHash);
      const nextOddIndex = resolvedOddIndex >= 0 ? resolvedOddIndex : 0;
      setOddIndex(nextOddIndex);

      const isCorrect = index === nextOddIndex;
      const points = Number(response?.score?.delta || 0);
      const nextStats = applyProfileStats(response?.profile, {
        score: score + Math.max(0, points),
        streak: isCorrect ? streak + 1 : 0,
        bestStreak: isCorrect ? Math.max(bestStreak, streak + 1) : bestStreak,
      });
      setRoundPoints(points);
      setShowResult(true);
      onScoreUpdate(nextStats.score, nextStats.streak, nextStats.bestStreak);
      refreshProfile().catch(() => {});

      if (isCorrect) {
        confetti({
          particleCount: 70,
          spread: 55,
          origin: { y: 0.6 },
          colors: ["#00FFFF", "#FF00FF", "#8B5CF6"],
        });
      }
    } catch {
      setShowResult(false);
    }
  };

  const handleNextRound = () => {
    setRound((prev) => prev + 1);
    loadNewRound();
  };

  const isCorrect = selectedIndex === oddIndex;
  const majorityLabel = askingFor === "ai" ? "Human" : "AI";
  const oddLabel = askingFor === "ai" ? "AI" : "Human";

  return (
    <div className="min-h-[calc(100vh-200px)] px-4 pt-16 pb-28">
      <div className="max-w-lg mx-auto">
        <ClassicStatsBar streak={streak} score={score} onBack={onBack} />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-end">
          <div className="glass px-4 py-2 rounded-full text-sm text-muted-foreground">
            Round {round}
          </div>
        </motion.div>

        <GlowingBorder glowColor="purple" intensity="medium" className="rounded-3xl mb-6">
          <div className="glass-strong rounded-3xl p-6 text-center">
            <motion.span className="text-4xl mb-2 block" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              🎭
            </motion.span>
            <h2 className="text-2xl font-black gradient-text-accent mb-2">Odd One Out</h2>
            <p className="text-muted-foreground">4 are {majorityLabel}, find the 1 {oddLabel}!</p>
          </div>
        </GlowingBorder>

        <div className="relative mb-6">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelect(index)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedIndex === index
                    ? "ring-4 ring-secondary scale-95"
                    : showResult && index === oddIndex
                      ? "ring-4 ring-primary"
                      : showResult
                        ? "opacity-50"
                        : "hover:scale-[1.03]"
                }`}
              >
                {isLoading ? (
                  <ImageSkeleton className="absolute inset-0 rounded-none" />
                ) : images[index] ? (
                  <img
                    src={images[index].imageUrl || images[index].url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      const fallbackUrl = images[index].fallbackImageUrl;
                      if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                        event.currentTarget.src = fallbackUrl;
                      }
                    }}
                  />
                ) : null}

                <AnimatePresence>
                  {showResult && index === oddIndex && (
                    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-primary/80 flex items-center justify-center">
                      <div className="text-center">
                        <Eye className="w-8 h-8 text-primary-foreground mx-auto" />
                        <span className="text-xs font-bold text-primary-foreground">ODD!</span>
                      </div>
                    </motion.div>
                  )}
                  {showResult && selectedIndex === index && index !== oddIndex && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-error-overlay flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
                {images[index] ? (
                  <VerifyHashEyeButton hash={images[index].hash} visible={showResult} className="bottom-2 right-2 z-[55] h-8 w-8 min-w-8" />
                ) : null}
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div />
            {[3, 4].map((index, i) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelect(index)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedIndex === index
                    ? "ring-4 ring-secondary scale-95"
                    : showResult && index === oddIndex
                      ? "ring-4 ring-primary"
                      : showResult
                        ? "opacity-50"
                        : "hover:scale-[1.03]"
                } ${i === 1 ? "col-start-3" : "col-start-2"}`}
              >
                {isLoading ? (
                  <ImageSkeleton className="absolute inset-0 rounded-none" />
                ) : images[index] ? (
                  <img
                    src={images[index].imageUrl || images[index].url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      const fallbackUrl = images[index].fallbackImageUrl;
                      if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                        event.currentTarget.src = fallbackUrl;
                      }
                    }}
                  />
                ) : null}

                <AnimatePresence>
                  {showResult && index === oddIndex && (
                    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-primary/80 flex items-center justify-center">
                      <div className="text-center">
                        <Eye className="w-8 h-8 text-primary-foreground mx-auto" />
                        <span className="text-xs font-bold text-primary-foreground">ODD!</span>
                      </div>
                    </motion.div>
                  )}
                  {showResult && selectedIndex === index && index !== oddIndex && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-error-overlay flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
                {images[index] ? (
                  <VerifyHashEyeButton hash={images[index].hash} visible={showResult} className="bottom-2 right-2 z-[55] h-8 w-8 min-w-8" />
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className={`glass-strong rounded-xl p-4 text-center ${isCorrect ? "border-primary" : "border-destructive"}`}>
                {isCorrect ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-8 h-8 text-primary" />
                    <div>
                      <span className="text-2xl font-black text-primary block">+{roundPoints} Points!</span>
                      <span className="text-sm text-muted-foreground">You found the {oddLabel}!</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <XCircle className="w-8 h-8 text-destructive" />
                    <span className="text-xl font-bold text-destructive">That wasn't it!</span>
                  </div>
                )}
              </div>

              <Button onClick={handleNextRound} className="w-full h-14 btn-gradient text-primary-foreground text-lg font-bold">
                <RotateCcw className="w-5 h-5 mr-2" />
                Next Round
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!showResult && !isLoading && (
          <p className="text-center text-muted-foreground text-sm">Find the {oddLabel} among the {majorityLabel} images</p>
        )}
      </div>
    </div>
  );
};

export default OddOneOutGame;
