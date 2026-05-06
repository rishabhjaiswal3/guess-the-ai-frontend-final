import { useState, useCallback, useEffect } from "react";
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
  onGameActiveChange?: (active: boolean) => void;
}

const GameScreen = ({ onScoreUpdate, onGameActiveChange }: GameScreenProps) => {
  const [selectedMode, setSelectedMode] = useState<GameModeType | null>(null);

  useEffect(() => {
    onGameActiveChange?.(selectedMode !== null);
  }, [selectedMode, onGameActiveChange]);

  const handleModeSelect = (mode: GameModeType) => setSelectedMode(mode);

  const handleBack = () => setSelectedMode(null);

  const handleScoreUpdate = useCallback((newScore: number, newStreak: number, newBestStreak: number) => {
    onScoreUpdate(newScore, newStreak, newBestStreak);
  }, [onScoreUpdate]);

  const renderGameMode = () => {
    switch (selectedMode) {
      case "classic":
        return <ClassicGame onBack={handleBack} onScoreUpdate={handleScoreUpdate} />;
      case "multiselect":
        return <MultiSelectGame onBack={handleBack} onScoreUpdate={handleScoreUpdate} />;
      case "duel":
        return <DuelGame onBack={handleBack} onScoreUpdate={handleScoreUpdate} />;
      case "oddoneout":
        return <OddOneOutGame onBack={handleBack} onScoreUpdate={handleScoreUpdate} />;
      case "cardflip":
        return <CardFlipGame onBack={handleBack} onScoreUpdate={handleScoreUpdate} />;
      case "rapidfire":
        return <RapidFireGame onBack={handleBack} onScoreUpdate={handleScoreUpdate} />;
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
          <GameModeSelector onSelectMode={handleModeSelect} onBack={() => {}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameScreen;
