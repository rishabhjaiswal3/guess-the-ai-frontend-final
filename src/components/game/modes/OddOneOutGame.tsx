import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRandomAIImages, getRandomHumanImages, GameImage } from "@/data/sampleImages";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import confetti from "canvas-confetti";

interface OddOneOutGameProps {
  onBack: () => void;
  onScoreUpdate: (points: number) => void;
}

const OddOneOutGame = ({ onBack, onScoreUpdate }: OddOneOutGameProps) => {
  const [images, setImages] = useState<GameImage[]>([]);
  const [oddIndex, setOddIndex] = useState<number>(0);
  const [majorityIsAI, setMajorityIsAI] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadNewRound = () => {
    setIsLoading(true);
    setSelectedIndex(null);
    setShowResult(false);
    
    // Randomly decide if majority is AI or Human
    const isAIMajority = Math.random() > 0.5;
    setMajorityIsAI(isAIMajority);
    
    let majorityImages: GameImage[];
    let oddImage: GameImage;
    
    if (isAIMajority) {
      majorityImages = getRandomAIImages(4);
      oddImage = getRandomHumanImages(1)[0];
    } else {
      majorityImages = getRandomHumanImages(4);
      oddImage = getRandomAIImages(1)[0];
    }
    
    // Random position for the odd one
    const oddPosition = Math.floor(Math.random() * 5);
    setOddIndex(oddPosition);
    
    // Insert odd one at random position
    const allImages = [...majorityImages];
    allImages.splice(oddPosition, 0, oddImage);
    setImages(allImages);
    
    setTimeout(() => setIsLoading(false), 500);
  };

  useEffect(() => {
    loadNewRound();
  }, []);

  const handleSelect = (index: number) => {
    if (showResult) return;
    
    setSelectedIndex(index);
    setShowResult(true);
    
    const isCorrect = index === oddIndex;
    
    if (isCorrect) {
      const points = 30 + (streak * 10);
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      onScoreUpdate(points);
      
      confetti({
        particleCount: 70,
        spread: 55,
        origin: { y: 0.6 },
        colors: ["#00FFFF", "#FF00FF", "#8B5CF6"],
      });
    } else {
      setStreak(0);
    }
  };

  const handleNextRound = () => {
    setRound(prev => prev + 1);
    loadNewRound();
  };

  const isCorrect = selectedIndex === oddIndex;

  return (
    <div className="min-h-[calc(100vh-200px)] px-4 pt-16 pb-28">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-orange font-bold">🔥 {streak}</span>
            <div className="glass px-4 py-2 rounded-full font-bold text-primary">
              Score: {score}
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <GlowingBorder glowColor="purple" intensity="medium" className="rounded-3xl mb-6">
          <div className="glass-strong rounded-3xl p-6 text-center">
            <motion.span 
              className="text-4xl mb-2 block"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎭
            </motion.span>
            <h2 className="text-2xl font-black gradient-text-accent mb-2">
              Odd One Out
            </h2>
            <p className="text-muted-foreground">
              4 are {majorityIsAI ? "AI" : "Human"}, find the 1 {majorityIsAI ? "Human" : "AI"}!
            </p>
          </div>
        </GlowingBorder>

        {/* Image Grid - Creative layout */}
        <div className="relative mb-6">
          {/* Top row - 3 images */}
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
                ) : (
                  images[index] && (
                    <img
                      src={images[index].url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )
                )}

                <AnimatePresence>
                  {showResult && index === oddIndex && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-primary/80 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Eye className="w-8 h-8 text-primary-foreground mx-auto" />
                        <span className="text-xs font-bold text-primary-foreground">ODD!</span>
                      </div>
                    </motion.div>
                  )}
                  {showResult && selectedIndex === index && index !== oddIndex && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-error-overlay flex items-center justify-center"
                    >
                      <XCircle className="w-8 h-8 text-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Bottom row - 2 images centered */}
          <div className="grid grid-cols-3 gap-2">
            <div /> {/* Empty spacer */}
            {[3, 4].map((index, i) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index) * 0.1 }}
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
                ) : (
                  images[index] && (
                    <img
                      src={images[index].url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )
                )}

                <AnimatePresence>
                  {showResult && index === oddIndex && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-primary/80 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Eye className="w-8 h-8 text-primary-foreground mx-auto" />
                        <span className="text-xs font-bold text-primary-foreground">ODD!</span>
                      </div>
                    </motion.div>
                  )}
                  {showResult && selectedIndex === index && index !== oddIndex && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-error-overlay flex items-center justify-center"
                    >
                      <XCircle className="w-8 h-8 text-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Result / Next */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`glass-strong rounded-xl p-4 text-center ${
                isCorrect ? "border-primary" : "border-destructive"
              }`}>
                {isCorrect ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-8 h-8 text-primary" />
                    <div>
                      <span className="text-2xl font-black text-primary block">
                        +{30 + ((streak - 1) * 10)} Points!
                      </span>
                      <span className="text-sm text-muted-foreground">
                        You found the {majorityIsAI ? "Human" : "AI"}!
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <XCircle className="w-8 h-8 text-destructive" />
                    <span className="text-xl font-bold text-destructive">
                      That wasn't it!
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleNextRound}
                className="w-full h-14 btn-gradient text-primary-foreground text-lg font-bold"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Next Round
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!showResult && !isLoading && (
          <p className="text-center text-muted-foreground text-sm">
            Find the {majorityIsAI ? "Human" : "AI"} among the {majorityIsAI ? "AI" : "Human"} images
          </p>
        )}
      </div>
    </div>
  );
};

export default OddOneOutGame;
