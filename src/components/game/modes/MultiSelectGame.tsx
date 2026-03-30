import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import HintBadge from "@/components/game/HintBadge";
import { useGameProfileStats } from "@/hooks/useGameProfileStats";
import { useHint } from "@/hooks/useHint";
import confetti from "canvas-confetti";
import {
  getMultiSelectQuestion,
  submitMultiSelectAnswer,
  type ModeQuestionImage,
  type ModeAnswerResult,
} from "@/services/gameModesApi";

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
  const [round, setRound] = useState(1);
  const [roundScore, setRoundScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [roundId, setRoundId] = useState<string | null>(null);
  const { score, streak, bestStreak, applyProfileStats, refreshProfile } = useGameProfileStats();
  const { hint, loading: hintLoading } = useHint(roundId);

  const loadNewRound = async () => {
    setIsLoading(true);
    setSelectedIds(new Set());
    setShowResult(false);
    setResultMap({});
    setRoundId(null);

    try {
      const question = await getMultiSelectQuestion();
      setImages(question.images || []);
      setAskingFor((question.askingFor || "ai") as "ai" | "human");
      setRoundId(question.roundId || null);
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
      refreshProfile().catch(() => {});

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
    setRound((prev) => prev + 1);
    loadNewRound();
  };

  const targetCount = Object.values(resultMap).filter((item) => item.shouldSelect).length;

  return (
    <div className="min-h-[calc(100vh-200px)] px-4 pt-16 pb-28">
      <div className="max-w-2xl mx-auto">
        <ClassicStatsBar streak={streak} score={score} onBack={onBack} />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-end">
          <div className="glass px-4 py-2 rounded-full text-sm text-muted-foreground">
            Round {round}
          </div>
        </motion.div>

        <GlowingBorder glowColor="purple" intensity="medium" className="rounded-3xl mb-6">
          <div className="glass-strong rounded-3xl p-6 text-center">
            <span className="text-4xl mb-2 block">🎪</span>
            <h2 className="text-2xl font-black gradient-text-accent mb-2">Multi-Select Challenge</h2>
            <p className="text-muted-foreground">
              Select ALL the {askingFor.toUpperCase()} images ({showResult ? targetCount : "?"} total)
            </p>
          </div>
        </GlowingBorder>

        {!showResult && <HintBadge hint={hint} loading={hintLoading} />}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
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
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                    isSelected ? "ring-4 ring-primary scale-95" : "hover:scale-[1.02]"
                  }`}
                >
                  <img src={img.imageUrl || img.url} alt="Game image" className="w-full h-full object-cover" />

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
                        className={`absolute inset-0 flex items-center justify-center ${
                          shouldSelect ? (isSelected ? "bg-success-overlay" : "bg-error-overlay") : isSelected ? "bg-error-overlay" : ""
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
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                        truth === "ai" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
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
