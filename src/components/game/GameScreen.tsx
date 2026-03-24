import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameModeType } from "@/data/gameModes";
import GameModeSelector from "./GameModeSelector";
import ClassicGame from "./modes/ClassicGame";
import MultiSelectGame from "./modes/MultiSelectGame";
import DuelGame from "./modes/DuelGame";
import OddOneOutGame from "./modes/OddOneOutGame";
import CardFlipGame from "./modes/CardFlipGame";
import RapidFireGame from "./modes/RapidFireGame";

interface GameScreenProps {
  onScoreUpdate: (score: number, streak: number, bestStreak: number) => void;
}

const GameScreen = ({ onScoreUpdate }: GameScreenProps) => {
  const [selectedMode, setSelectedMode] = useState<GameModeType | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [totalStreak, setTotalStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const handleModeSelect = (mode: GameModeType) => {
    setSelectedMode(mode);
  };

  const handleBack = () => {
    setSelectedMode(null);
  };

  const handleScoreUpdate = useCallback((newScore: number, newStreak: number, newBestStreak: number) => {
    setTotalScore(newScore);
    setTotalStreak(newStreak);
    setBestStreak(newBestStreak);
    onScoreUpdate(newScore, newStreak, newBestStreak);
  }, [onScoreUpdate]);

  const renderGameMode = () => {
    switch (selectedMode) {
      case "classic":
        return (
          <ClassicGame 
            onBack={handleBack} 
            onScoreUpdate={handleScoreUpdate}
          />
        );
      case "multiselect":
        return (
          <MultiSelectGame 
            onBack={handleBack} 
            onScoreUpdate={handleScoreUpdate}
          />
        );
      case "duel":
        return (
          <DuelGame 
            onBack={handleBack} 
            onScoreUpdate={handleScoreUpdate}
          />
        );
      case "oddoneout":
        return (
          <OddOneOutGame
            onBack={handleBack}
            onScoreUpdate={handleScoreUpdate}
          />
        );
      case "cardflip":
        return (
          <CardFlipGame
            onBack={handleBack}
            onScoreUpdate={handleScoreUpdate}
          />
        );
      case "rapidfire":
        return (
          <RapidFireGame
            onBack={handleBack}
            onScoreUpdate={handleScoreUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {selectedMode ? (
        <motion.div
          key={selectedMode}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {renderGameMode()}
        </motion.div>
      ) : (
        <motion.div
          key="selector"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3 }}
        >
          <GameModeSelector 
            onSelectMode={handleModeSelect}
            onBack={() => {}}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameScreen;
