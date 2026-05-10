import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle, XCircle, RotateCcw, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import GameRulesDialog from "@/components/game/GameRulesDialog";
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
  const [roundPoints, setRoundPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [aiReviewRevealed, setAiReviewRevealed] = useState(false);
  const [showAIReviewLoader, setShowAIReviewLoader] = useState(false);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [scanMessage, setScanMessage] = useState("Analyzing response...");
  const { score, streak, bestStreak, applyProfileStats, refreshProfile } = useGameProfileStats();

  const loadNewRound = async () => {
    setIsLoading(true);
    setSelectedIndex(null);
    setShowResult(false);
    setRoundPoints(0);
    setAiReviewRevealed(false);
    setShowAIReviewLoader(false);
    setLoadedImagesCount(0);

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

  const handleTakeAiReview = () => {
    setShowAIReviewLoader(true);
    setScanMessage("Analyzing response...");
    const scanInterval = setInterval(() => {
      setScanMessage(prev => {
        if (prev === "Analyzing response...") return "Pattern detected...";
        if (prev === "Pattern detected...") return `Confidence score: ${Math.floor(Math.random() * 20 + 80)}%`;
        return prev;
      });
    }, 500);

    setTimeout(() => {
      clearInterval(scanInterval);
      setShowAIReviewLoader(false);
      setAiReviewRevealed(true);
    }, 2000);
  };

  const handleSelect = async (index: number) => {
    if (showResult || !images[index]) return;

    setSelectedIndex(index);
    setIsSubmittingAnswer(true);
    setScanMessage("Analyzing response...");
    const scanInterval = setInterval(() => {
      setScanMessage(prev => {
        if (prev === "Analyzing response...") return "Pattern detected...";
        if (prev === "Pattern detected...") return `Confidence score: ${Math.floor(Math.random() * 20 + 80)}%`;
        return prev;
      });
    }, 500);

    try {
      const response = await submitOddOneOutAnswer({
        hashes: images.map((img) => img.hash),
        selectedHash: images[index].hash,
        askingFor,
      });

      // Artificial delay for "juiciness"
      await new Promise(resolve => setTimeout(resolve, 1500));
      clearInterval(scanInterval);
      setIsSubmittingAnswer(false);

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
      refreshProfile().catch(() => { });

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
    loadNewRound();
  };

  const isCorrect = selectedIndex === oddIndex;
  const majorityLabel = askingFor === "ai" ? "Human" : "AI";
  const oddLabel = askingFor === "ai" ? "AI" : "Human";

  return (
    <div className="min-h-screen px-4 pt-4 pb-6">
      <div className="max-w-lg mx-auto">
        <ClassicStatsBar streak={streak} score={score} onBack={onBack} onRules={() => setRulesOpen(true)} />

        <GlowingBorder glowColor="purple" intensity="medium" className="rounded-3xl mb-6">
          <div className="glass-strong rounded-3xl py-3 px-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-2xl">🎭</span>
              <h2 className="text-xl font-black gradient-text-accent">Odd One Out</h2>
            </div>
            <p className="text-sm text-muted-foreground">{images.length - 1} are {majorityLabel}, find the 1 {oddLabel}!</p>
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
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${selectedIndex === index
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
                  <>
                    <img
                      src={images[index].imageUrl || images[index].url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onLoad={() => setLoadedImagesCount((prev) => prev + 1)}
                      onError={(event) => {
                        const fallbackUrl = images[index].fallbackImageUrl;
                        if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                          event.currentTarget.src = fallbackUrl;
                        }
                      }}
                    />
                    {images[index].percentage !== undefined && aiReviewRevealed && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] md:text-xs font-mono font-bold flex items-center gap-1 z-10 border border-white/20">
                        <span>{images[index].percentage}%</span>
                      </div>
                    )}
                  </>
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
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${selectedIndex === index
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
                  <>
                    <img
                      src={images[index].imageUrl || images[index].url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onLoad={() => setLoadedImagesCount((prev) => prev + 1)}
                      onError={(event) => {
                        const fallbackUrl = images[index].fallbackImageUrl;
                        if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                          event.currentTarget.src = fallbackUrl;
                        }
                      }}
                    />
                    {images[index].percentage !== undefined && aiReviewRevealed && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] md:text-xs font-mono font-bold flex items-center gap-1 z-10 border border-white/20">
                        <span>{images[index].percentage}%</span>
                      </div>
                    )}
                  </>
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

            <AnimatePresence>
              {(showAIReviewLoader || isSubmittingAnswer) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -inset-3 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-2xl"
                >
                  <div className="relative w-14 h-14 mb-4">
                    <motion.div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-3 bg-cyan-400/20 rounded-full blur-md"
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={scanMessage}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="font-bold text-cyan-400 tracking-wider"
                    >
                      {scanMessage}
                    </motion.span>
                  </AnimatePresence>
                  <div className="w-32 h-1 bg-cyan-900/50 rounded-full overflow-hidden mt-3">
                    <motion.div 
                      className="h-full bg-cyan-400"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.8, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center rounded-2xl">
                   <div className="relative w-16 h-16 mb-6">
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
                      className="text-sm font-mono text-cyan-300 tracking-wider uppercase font-bold"
                    >
                      Generating Challenge...
                    </motion.div>
                </div>
              )}
            </AnimatePresence>
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

        {(!isLoading && images.length > 0 && loadedImagesCount >= images.length) && !showResult && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-muted-foreground text-sm">Find the {oddLabel} among the {majorityLabel} images</p>
            
            {!aiReviewRevealed && (
              <Button 
                onClick={handleTakeAiReview}
                disabled={showAIReviewLoader}
                variant="outline"
                className="h-9 glass text-cyan-400 border-cyan-500/30 font-semibold"
              >
                {showAIReviewLoader ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Take AI Review
                  </span>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
      <GameRulesDialog mode="oddoneout" open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
};

export default OddOneOutGame;
