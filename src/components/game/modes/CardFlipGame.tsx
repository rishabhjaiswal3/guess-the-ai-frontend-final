import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, UserRound, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ScreenShake from "@/components/effects/ScreenShake";
import ClassicStatsBar from "@/components/game/classic/ClassicStatsBar";
import GameRulesDialog from "@/components/game/GameRulesDialog";
import { useGameProfileStats } from "@/hooks/useGameProfileStats";
import confetti from "canvas-confetti";
import {
  getCardFlipDeck,
  submitCardFlipAnswer,
  type ModeQuestionImage,
} from "@/services/gameModesApi";
import GameImageBox from "@/components/game/GameImageBox";

interface CardState {
  id: string;
  image: ModeQuestionImage;
  isFlipped: boolean;
  isAnswered: boolean;
  guessedCorrectly: boolean | null;
}

interface CardFlipGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number, streak: number, bestStreak: number) => void;
}

const CardFlipGame = ({ onBack, onScoreUpdate }: CardFlipGameProps) => {
  const [cards, setCards] = useState<CardState[]>([]);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isShuffling, setIsShuffling] = useState(true);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [aiReviewRevealed, setAiReviewRevealed] = useState(false);
  const [showAIReviewLoader, setShowAIReviewLoader] = useState(false);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState("Analyzing response...");
  const { score, streak, bestStreak, applyProfileStats, refreshProfile } = useGameProfileStats();

  const initGame = useCallback(async () => {
    setIsShuffling(true);
    setShowFinalScore(false);
    setActiveCard(null);
    setAnsweredCount(0);
    setCorrectCount(0);
    setAiReviewRevealed(false);
    setShowAIReviewLoader(false);
    setLoadedImagesCount(0);

    try {
      const question = await getCardFlipDeck();
      const images = question.images || [];
      const newCards: CardState[] = images.map((img, i) => ({
        id: `card-${i}`,
        image: img,
        isFlipped: false,
        isAnswered: false,
        guessedCorrectly: null,
      }));
      setCards(newCards);
    } catch {
      setCards([]);
    } finally {
      setTimeout(() => setIsShuffling(false), 1500);
    }
  }, []);

  useEffect(() => {
    initGame();
  }, []);

  const handleCardTap = (cardId: string) => {
    if (isShuffling || activeCard) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isAnswered) return;

    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)));
    setActiveCard(cardId);
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

  const handleGuess = async (guessedAI: boolean) => {
    if (!activeCard) return;
    const card = cards.find((c) => c.id === activeCard);
    if (!card) return;

    let isCorrect = false;
    let awardedPoints = 0;
    try {
      const response = await submitCardFlipAnswer({
        hash: card.image.hash,
        guess: guessedAI ? "ai" : "human",
      });
      isCorrect = Boolean(response?.results?.[0]?.isCorrect);
      awardedPoints = Number(response?.score?.delta || 0);
      const nextStats = applyProfileStats(response?.profile, {
        score: score + Math.max(0, awardedPoints),
        streak: isCorrect ? streak + 1 : 0,
        bestStreak: isCorrect ? Math.max(bestStreak, streak + 1) : bestStreak,
      });
      onScoreUpdate(nextStats.score, nextStats.streak, nextStats.bestStreak);
      refreshProfile().catch(() => { });
    } catch {
      isCorrect = false;
      awardedPoints = 0;
    }

    const newAnswered = answeredCount + 1;

    setCards((prev) =>
      prev.map((c) =>
        c.id === activeCard ? { ...c, isAnswered: true, guessedCorrectly: isCorrect } : c
      )
    );

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);

      if ((correctCount + 1) % 5 === 0) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#FF00FF", "#00FFFF", "#8B5CF6"],
        });
      }
    } else {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 400);
    }

    setAnsweredCount(newAnswered);
    setActiveCard(null);

    if (newAnswered === cards.length && cards.length > 0) {
      setTimeout(() => {
        setShowFinalScore(true);
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 },
          colors: ["#FF00FF", "#00FFFF", "#FFD700", "#8B5CF6"],
        });
      }, 800);
    }
  };

  const activeCardData = useMemo(() => cards.find((c) => c.id === activeCard), [cards, activeCard]);

  if (showFinalScore) {
    const totalCards = cards.length || 20;
    const accuracy = Math.round((correctCount / totalCards) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-4 pb-6">
        <GlowingBorder glowColor="magenta" intensity="high" className="rounded-3xl w-full max-w-md">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-3xl p-8 text-center">
            <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">
              {accuracy >= 80 ? "🏆" : accuracy >= 60 ? "⭐" : "🃏"}
            </motion.div>

            <h2 className="text-3xl font-black gradient-text mb-2">All Cards Revealed!</h2>

            <div className="glass rounded-2xl p-6 mb-6">
              <div className="text-5xl font-black gradient-text mb-1">{score}</div>
              <div className="text-muted-foreground text-sm">score</div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">{totalCards - correctCount}</div>
                  <div className="text-xs text-muted-foreground">Wrong</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow">{accuracy}%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">

              <Button onClick={initGame} className="flex-1 btn-gradient text-primary-foreground h-12">
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
      <ScreenShake trigger={shakeScreen} intensity={10}>
        <div className="flex flex-col items-center px-3 pt-4 pb-6">
          <div className="w-full max-w-2xl">
            <ClassicStatsBar streak={streak} score={score} onBack={onBack} onRules={() => setRulesOpen(true)} />
          </div>

          <div className="flex justify-between items-center w-full max-w-2xl mb-3">
            {(cards.length > 0 && loadedImagesCount >= cards.length && !showFinalScore && !aiReviewRevealed) ? (
              <Button 
                onClick={handleTakeAiReview}
                disabled={showAIReviewLoader || isShuffling}
                variant="outline"
                className="h-8 glass text-cyan-400 border-cyan-500/30 font-semibold"
              >
                {showAIReviewLoader ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Take AI Review
                  </span>
                )}
              </Button>
            ) : (
              <div />
            )}
            <div className="glass px-3 py-1.5 rounded-full text-sm">
              <span className="text-muted-foreground">{answeredCount}</span>
              <span className="text-muted-foreground">/{cards.length || 20}</span>
            </div>
          </div>

          <div className="relative grid grid-cols-4 md:grid-cols-5 gap-2 w-full max-w-[90vw] lg:max-w-2xl mb-4">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={isShuffling ? { scale: 0, rotate: -180, opacity: 0 } : {}}
                animate={isShuffling ? { scale: 0, rotate: -180, opacity: 0 } : { scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: isShuffling ? 0 : index * 0.04, duration: 0.5, ease: "backOut" }}
                className="aspect-square cursor-pointer"
                style={{ perspective: 800 }}
                onClick={() => handleCardTap(card.id)}
              >
                <motion.div
                  animate={{ rotateY: card.isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative w-full h-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0 rounded-xl glass-strong border-2 border-magenta/30 flex items-center justify-center overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                    <span className="text-2xl md:text-3xl">🃏</span>
                    <motion.div className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-magenta/10 to-purple/10" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
                  </div>

                  <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-border" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <GameImageBox
                      src={card.image.imageUrl || card.image.url}
                      alt="Guess"
                      skeletonAspect="square"
                      onLoad={() => setLoadedImagesCount((prev) => prev + 1)}
                      onImageError={(event) => {
                        const fallbackUrl = card.image.fallbackImageUrl;
                        if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                          event.currentTarget.src = fallbackUrl;
                        }
                      }}
                    />
                    {card.image.percentage !== undefined && aiReviewRevealed && (
                      <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md text-white px-1.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-mono font-bold z-[15] border border-white/20">
                        <span>{card.image.percentage}%</span>
                      </div>
                    )}
                    {card.isAnswered && (
                      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className={`absolute inset-0 flex items-center justify-center ${card.guessedCorrectly ? "bg-green-500/60" : "bg-destructive/60"}`}>
                        {card.guessedCorrectly ? <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" /> : <XCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}

            <AnimatePresence>
              {showAIReviewLoader && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -inset-3 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-2xl pointer-events-none"
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
              {isShuffling && (
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
            {activeCard && activeCardData && !activeCardData.isAnswered && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-md">
                <div className="glass-strong rounded-2xl p-4">
                  <p className="text-center text-sm text-muted-foreground mb-3">Is this image AI or Human?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => handleGuess(true)} className="w-full h-14 text-lg font-black bg-muted hover:bg-muted/80 text-foreground border-2 border-border hover:border-cyan/50 hover:shadow-[0_0_20px_rgba(107,140,255,0.22)] transition-all">
                        <Bot className="w-5 h-5 mr-2" />
                        AI
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => handleGuess(false)} className="w-full h-14 text-lg font-black btn-gradient text-primary-foreground hover:shadow-[0_0_20px_rgba(139,93,255,0.3)]">
                        <UserRound className="w-5 h-5 mr-2" />
                        HUMAN
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScreenShake>
      <GameRulesDialog mode="cardflip" open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  );
};

export default CardFlipGame;
