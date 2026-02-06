import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMixedImages, GameImage } from "@/data/sampleImages";
import GlowingBorder from "@/components/effects/GlowingBorder";
import ImageSkeleton from "@/components/ui/ImageSkeleton";
import confetti from "canvas-confetti";

interface MultiSelectGameProps {
  onBack: () => void;
  onScoreUpdate: (points: number) => void;
}

const MultiSelectGame = ({ onBack, onScoreUpdate }: MultiSelectGameProps) => {
  const [images, setImages] = useState<GameImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadNewRound = () => {
    setIsLoading(true);
    setSelectedIds(new Set());
    setShowResult(false);
    // Random number of AI images (2-4 out of 6)
    const aiCount = Math.floor(Math.random() * 3) + 2;
    const newImages = getMixedImages(6, aiCount);
    setImages(newImages);
    setTimeout(() => setIsLoading(false), 500);
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

  const handleSubmit = () => {
    if (showResult) return;
    
    setShowResult(true);
    
    // Calculate score
    let correct = 0;
    let wrong = 0;
    
    images.forEach(img => {
      const isSelected = selectedIds.has(img.id);
      if (img.isAI && isSelected) correct++;
      else if (!img.isAI && isSelected) wrong++;
      else if (img.isAI && !isSelected) wrong++;
    });
    
    const points = Math.max(0, (correct * 20) - (wrong * 10));
    setRoundScore(points);
    setTotalScore(prev => prev + points);
    onScoreUpdate(points);
    
    if (points > 50) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#00FFFF", "#FF00FF", "#8B5CF6"],
      });
    }
  };

  const handleNextRound = () => {
    setRound(prev => prev + 1);
    loadNewRound();
  };

  const aiCount = images.filter(img => img.isAI).length;

  return (
    <div className="min-h-[calc(100vh-200px)] px-4 pt-16 pb-28">
      <div className="max-w-2xl mx-auto">
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
            <span className="text-muted-foreground">Round {round}</span>
            <div className="glass px-4 py-2 rounded-full font-bold text-primary">
              Score: {totalScore}
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <GlowingBorder glowColor="purple" intensity="medium" className="rounded-3xl mb-6">
          <div className="glass-strong rounded-3xl p-6 text-center">
            <span className="text-4xl mb-2 block">🎪</span>
            <h2 className="text-2xl font-black gradient-text-accent mb-2">
              Multi-Select Challenge
            </h2>
            <p className="text-muted-foreground">
              Select ALL the AI-generated images ({showResult ? aiCount : "?"} total)
            </p>
          </div>
        </GlowingBorder>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <ImageSkeleton key={i} aspectRatio="square" />
            ))
          ) : (
            images.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => toggleSelect(img.id)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedIds.has(img.id) 
                    ? "ring-4 ring-primary scale-95" 
                    : "hover:scale-[1.02]"
                }`}
              >
                <img
                  src={img.url}
                  alt="Game image"
                  className="w-full h-full object-cover"
                />
                
                {/* Selection overlay */}
                <AnimatePresence>
                  {selectedIds.has(img.id) && !showResult && (
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

                {/* Result overlay */}
                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`absolute inset-0 flex items-center justify-center ${
                        img.isAI 
                          ? (selectedIds.has(img.id) ? "bg-success-overlay" : "bg-error-overlay")
                          : (selectedIds.has(img.id) ? "bg-error-overlay" : "")
                      }`}
                    >
                      {img.isAI && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-center"
                        >
                          {selectedIds.has(img.id) ? (
                            <CheckCircle className="w-8 h-8 text-foreground mx-auto" />
                          ) : (
                            <XCircle className="w-8 h-8 text-foreground mx-auto" />
                          )}
                          <span className="text-xs text-foreground font-bold block mt-1">AI</span>
                        </motion.div>
                      )}
                      {!img.isAI && selectedIds.has(img.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-center"
                        >
                          <XCircle className="w-8 h-8 text-foreground mx-auto" />
                          <span className="text-xs text-foreground font-bold block mt-1">Human!</span>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Label badge */}
                {showResult && (
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                    img.isAI ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                  }`}>
                    {img.isAI ? "AI" : "Human"}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedIds.size === 0}
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
              <Button
                onClick={handleNextRound}
                className="flex-1 h-14 btn-gradient text-primary-foreground text-lg font-bold"
              >
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
