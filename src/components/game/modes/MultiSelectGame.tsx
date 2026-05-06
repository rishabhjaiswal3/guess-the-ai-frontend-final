import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Send, RotateCcw, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import { useGameProfileStats } from "@/hooks/useGameProfileStats";
import confetti from "canvas-confetti";
import {
  getMultiSelectQuestion,
  submitMultiSelectAnswer,
  type ModeQuestionImage,
  type ModeAnswerResult,
} from "@/services/gameModesApi";
import { buildFallbackImageUrl } from "@/lib/imageUrl";
import VerifyHashEyeButton from "@/components/game/VerifyHashEyeButton";

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
    setTimeout(() => {
      setShowAIReviewLoader(false);
      setAiReviewRevealed(true);
    }, 1500);
  };

  const handleSubmit = async () => {
    if (showResult || images.length === 0) return;

    try {
      const response = await submitMultiSelectAnswer({
        hashes: images.map((img) => img.hash),
        selectedHashes: Array.from(selectedIds),
        askingFor,
      });

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
        <ClassicStatsBar streak={streak} score={score} onBack={onBack} />

        <GlowingBorder glowColor="purple" intensity="medium" className="rounded-3xl mb-6">
          <div className="glass-strong rounded-3xl p-6 text-center">
            <span className="text-4xl mb-2 block">🎪</span>
            <h2 className="text-2xl font-black gradient-text-accent mb-2">Multi-Select Challenge</h2>
            <p className="text-muted-foreground">
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
                  <img
                    src={img.imageUrl || img.url}
                    alt="Game image"
                    className="w-full h-full object-cover"
                    onLoad={() => setLoadedImagesCount((prev) => prev + 1)}
                    onError={(event) => {
                      const fallbackUrl = buildFallbackImageUrl(img.hash);
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
                        className="absolute inset-0 bg-primary/30 flex items-center justify-center"
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
                        className={`absolute inset-0 flex items-center justify-center ${shouldSelect ? (isSelected ? "bg-success-overlay" : "bg-error-overlay") : isSelected ? "bg-error-overlay" : ""
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
                  <VerifyHashEyeButton hash={img.hash} visible={showResult} className="bottom-2 left-2 h-8 w-8 min-w-8" />
                </motion.div>
              );
            })
          )}
          </div>

          <AnimatePresence>
            {showAIReviewLoader && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -inset-3 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-2xl"
              >
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                <span className="font-bold text-cyan-400 animate-pulse tracking-wider">AI IS ANALYZING...</span>
              </motion.div>
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
    </div>
  );
};

export default MultiSelectGame;
