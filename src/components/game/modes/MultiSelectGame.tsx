import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Send, RotateCcw, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import GameRulesDialog from "@/components/game/GameRulesDialog";
import { useGameProfileStats } from "@/hooks/useGameProfileStats";
import confetti from "canvas-confetti";
import {
  getMultiSelectQuestion,
  submitMultiSelectAnswer,
  type ModeQuestionImage,
  type ModeAnswerResult,
} from "@/services/gameModesApi";
import GameImageBox from "@/components/game/GameImageBox";

interface MultiSelectGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number, streak: number, bestStreak: number) => void;
}

const MultiSelectGame = ({ onBack, onScoreUpdate }: MultiSelectGameProps) => {
  const [images, setImages] = useState<ModeQuestionImage[]>([]);
  const [askingFor, setAskingFor] = useState<"ai" | "human">("ai");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resultMap, setResultMap] = useState<Record<string, ModeAnswerResult>>({});
  const [showResult, setShowResult] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
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
    setSelectedIds(new Set());
    setShowResult(false);
    setResultMap({});
    setAiReviewRevealed(false);
    setShowAIReviewLoader(false);
    setLoadedImagesCount(0);

    try {
      const question = await getMultiSelectQuestion();
      setImages(question.images || []);
      setAskingFor((question.askingFor || "ai") as "ai" | "human");
    } catch {
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNewRound();
  }, []);

  const toggleSelect = (id: string) => {
    if (showResult) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

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

  const handleSubmit = async () => {
    if (showResult || images.length === 0) return;

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
      const response = await submitMultiSelectAnswer({
        hashes: images.map((img) => img.hash),
        selectedHashes: Array.from(selectedIds),
        askingFor,
      });

      // Artificial delay for "juiciness"
      await new Promise(resolve => setTimeout(resolve, 1500));
      clearInterval(scanInterval);
      setIsSubmittingAnswer(false);

      const nextResultMap: Record<string, ModeAnswerResult> = {};
      (response.results || []).forEach((result) => {
        nextResultMap[result.hash] = result;
      });
      setResultMap(nextResultMap);

      const points = Math.max(0, Number(response?.score?.delta || 0));
      const isSuccessfulRound = points > 0;
      const nextStats = applyProfileStats(response?.profile, {
        score: score + points,
        streak: isSuccessfulRound ? streak + 1 : 0,
        bestStreak: isSuccessfulRound ? Math.max(bestStreak, streak + 1) : bestStreak,
      });
      setRoundScore(points);
      onScoreUpdate(nextStats.score, nextStats.streak, nextStats.bestStreak);
      setShowResult(true);
      refreshProfile().catch(() => { });

      if (points > 50) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
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

  const targetCount = Object.values(resultMap).filter((item) => item.shouldSelect).length;

  return (
    <div className="min-h-screen px-4 pt-4 pb-6">
      <div className="max-w-2xl mx-auto">
        <ClassicStatsBar streak={streak} score={score} onBack={onBack} onRules={() => setRulesOpen(true)} />

        <GlowingBorder glowColor="purple" intensity="medium" className="rounded-3xl mb-6">
          <div className="glass-strong rounded-3xl py-3 px-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-2xl">🎪</span>
              <h2 className="text-xl font-black gradient-text-accent">Multi-Select Challenge</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Select ALL the {askingFor.toUpperCase()} images ({showResult ? targetCount : "?"} total)
            </p>
          </div>
        </GlowingBorder>



        <div className="relative mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => <ImageSkeleton key={i} aspectRatio="square" />)
          ) : (
            images.map((img, index) => {
              const result = resultMap[img.hash];
              const isSelected = selectedIds.has(img.hash);
              const shouldSelect = Boolean(result?.shouldSelect);
              const truth = result?.truth;

              return (
                <motion.div
                  key={img.hash}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => toggleSelect(img.hash)}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${isSelected ? "ring-4 ring-primary scale-95" : "hover:scale-[1.02]"
                    }`}
                >
                  <GameImageBox
                    src={img.imageUrl || img.url}
                    alt="Game image"
                    skeletonAspect="square"
                    onLoad={() => setLoadedImagesCount((prev) => prev + 1)}
                    onImageError={(event) => {
                      const fallbackUrl = img.fallbackImageUrl;
                      if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                        event.currentTarget.src = fallbackUrl;
                      }
                    }}
                  />

                  {img.percentage !== undefined && aiReviewRevealed && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] md:text-xs font-mono font-bold flex items-center gap-1 z-10 border border-white/20">
                      <span>{img.percentage}%</span>
                    </div>
                  )}

                  <AnimatePresence>
                    {isSelected && !showResult && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-primary/30"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`absolute inset-0 z-20 flex items-center justify-center ${shouldSelect ? (isSelected ? "bg-success-overlay" : "bg-error-overlay") : isSelected ? "bg-error-overlay" : ""
                          }`}
                      >
                        {shouldSelect && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                            {isSelected ? (
                              <CheckCircle className="w-8 h-8 text-foreground mx-auto" />
                            ) : (
                              <XCircle className="w-8 h-8 text-foreground mx-auto" />
                            )}
                            <span className="text-xs text-foreground font-bold block mt-1">{(truth || askingFor).toUpperCase()}</span>
                          </motion.div>
                        )}
                        {!shouldSelect && isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                            <XCircle className="w-8 h-8 text-foreground mx-auto" />
                            <span className="text-xs text-foreground font-bold block mt-1">Wrong</span>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {showResult && (
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${truth === "ai" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                        }`}
                    >
                      {(truth || "?").toUpperCase()}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
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

        {(!isLoading && images.length > 0 && loadedImagesCount >= images.length) && !showResult && (
          <div className="flex justify-end mb-3">
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

        <div className="flex gap-4">
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedIds.size === 0 || isLoading || images.length === 0}
              className="flex-1 h-14 btn-gradient text-primary-foreground text-lg font-bold"
            >
              <Send className="w-5 h-5 mr-2" />
              Submit ({selectedIds.size} selected)
            </Button>
          ) : (
            <>
              <div className="flex-1 glass rounded-xl p-4 text-center">
                <span className="text-3xl font-black text-primary">+{roundScore}</span>
                <span className="text-muted-foreground block text-sm">points this round</span>
              </div>
              <Button onClick={handleNextRound} className="flex-1 h-14 btn-gradient text-primary-foreground text-lg font-bold">
                <RotateCcw className="w-5 h-5 mr-2" />
                Next Round
              </Button>
            </>
          )}
        </div>
      </div>
      <GameRulesDialog mode="multiselect" open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
};

export default MultiSelectGame;
