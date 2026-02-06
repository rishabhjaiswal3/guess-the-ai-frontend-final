import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, UserRound, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRandomImages, GameImage } from "@/data/sampleImages";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ScreenShake from "@/components/effects/ScreenShake";
import confetti from "canvas-confetti";

interface CardState {
  id: string;
  image: GameImage;
  isFlipped: boolean;
  isAnswered: boolean;
  guessedCorrectly: boolean | null;
}

interface CardFlipGameProps {
  onBack: () => void;
  onScoreUpdate: (points: number) => void;
}

const CardFlipGame = ({ onBack, onScoreUpdate }: CardFlipGameProps) => {
  const [cards, setCards] = useState<CardState[]>([]);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isShuffling, setIsShuffling] = useState(true);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);

  const initGame = useCallback(() => {
    const images = getRandomImages(20);
    const newCards: CardState[] = images.map((img, i) => ({
      id: `card-${i}`,
      image: img,
      isFlipped: false,
      isAnswered: false,
      guessedCorrectly: null,
    }));
    setCards(newCards);
    setActiveCard(null);
    setScore(0);
    setAnsweredCount(0);
    setCorrectCount(0);
    setShowFinalScore(false);
    setIsShuffling(true);

    setTimeout(() => setIsShuffling(false), 1500);
  }, []);

  useEffect(() => {
    initGame();
  }, []);

  const handleCardTap = (cardId: string) => {
    if (isShuffling || activeCard) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isAnswered) return;

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );
    setActiveCard(cardId);
  };

  const handleGuess = (guessedAI: boolean) => {
    if (!activeCard) return;
    const card = cards.find((c) => c.id === activeCard);
    if (!card) return;

    const isCorrect = guessedAI === card.image.isAI;
    const newAnswered = answeredCount + 1;

    setCards((prev) =>
      prev.map((c) =>
        c.id === activeCard
          ? { ...c, isAnswered: true, guessedCorrectly: isCorrect }
          : c
      )
    );

    if (isCorrect) {
      const points = 15;
      setScore((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);
      onScoreUpdate(points);

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

    if (newAnswered === 20) {
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

  const activeCardData = useMemo(
    () => cards.find((c) => c.id === activeCard),
    [cards, activeCard]
  );

  if (showFinalScore) {
    const accuracy = Math.round((correctCount / 20) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-[4.5rem] pb-20 lg:pb-16">
        <GlowingBorder glowColor="magenta" intensity="high" className="rounded-3xl w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-3xl p-8 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              {accuracy >= 80 ? "🏆" : accuracy >= 60 ? "⭐" : "🃏"}
            </motion.div>

            <h2 className="text-3xl font-black gradient-text mb-2">
              All Cards Revealed!
            </h2>

            <div className="glass rounded-2xl p-6 mb-6">
              <div className="text-5xl font-black gradient-text mb-1">{score}</div>
              <div className="text-muted-foreground text-sm">out of 300 points</div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">{20 - correctCount}</div>
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
    <ScreenShake trigger={shakeScreen} intensity={10}>
      <div className="flex flex-col items-center px-3 pt-[4.5rem] pb-24">
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-2xl mb-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Modes
          </Button>
          <div className="flex items-center gap-3">
            <div className="glass px-3 py-1.5 rounded-full text-sm">
              <span className="text-muted-foreground">{answeredCount}</span>
              <span className="text-muted-foreground">/20</span>
            </div>
            <div className="glass px-3 py-1.5 rounded-full text-sm font-bold gradient-text">
              {score} pts
            </div>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-4 md:grid-cols-5 gap-2 w-full max-w-[90vw] lg:max-w-2xl mb-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={isShuffling ? { scale: 0, rotate: -180, opacity: 0 } : {}}
              animate={
                isShuffling
                  ? { scale: 0, rotate: -180, opacity: 0 }
                  : { scale: 1, rotate: 0, opacity: 1 }
              }
              transition={{
                delay: isShuffling ? 0 : index * 0.04,
                duration: 0.5,
                ease: "backOut",
              }}
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
                {/* Card Back (face-down) */}
                <div
                  className="absolute inset-0 rounded-xl glass-strong border-2 border-magenta/30 flex items-center justify-center overflow-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-2xl md:text-3xl">🃏</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-magenta/10 to-purple/10"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>

                {/* Card Front (face-up) */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden border-2 border-border"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <img
                    src={card.image.url}
                    alt="Guess"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Result overlay */}
                  {card.isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute inset-0 flex items-center justify-center ${
                        card.guessedCorrectly
                          ? "bg-green-500/60"
                          : "bg-destructive/60"
                      }`}
                    >
                      {card.guessedCorrectly ? (
                        <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      ) : (
                        <XCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Guess Buttons - shown when a card is flipped and waiting */}
        <AnimatePresence>
          {activeCard && activeCardData && !activeCardData.isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md"
            >
              <div className="glass-strong rounded-2xl p-4">
                <p className="text-center text-sm text-muted-foreground mb-3">
                  Is this image AI or Human?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleGuess(true)}
                      className="w-full h-14 text-lg font-black bg-muted hover:bg-muted/80 text-foreground border-2 border-border hover:border-cyan/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all"
                    >
                      <Bot className="w-5 h-5 mr-2" />
                      AI
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleGuess(false)}
                      className="w-full h-14 text-lg font-black btn-gradient text-primary-foreground hover:shadow-[0_0_20px_rgba(255,0,255,0.3)]"
                    >
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
  );
};

export default CardFlipGame;
