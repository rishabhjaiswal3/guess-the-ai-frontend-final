import { motion, AnimatePresence } from "framer-motion";

interface ScorePopup {
  id: string;
  value: number;
  x: number;
  y: number;
  type: "score" | "combo" | "bonus";
}

interface FloatingScorePopupProps {
  popups: ScorePopup[];
  onComplete: (id: string) => void;
}

const FloatingScorePopup = ({ popups, onComplete }: FloatingScorePopupProps) => {
  const getPopupStyle = (type: ScorePopup["type"]) => {
    switch (type) {
      case "combo":
        return "text-secondary text-3xl font-black";
      case "bonus":
        return "text-yellow text-2xl font-bold";
      default:
        return "text-primary text-xl font-semibold";
    }
  };

  const getPopupText = (popup: ScorePopup) => {
    switch (popup.type) {
      case "combo":
        return `${popup.value}x COMBO!`;
      case "bonus":
        return `+${popup.value} BONUS!`;
      default:
        return `+${popup.value}`;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            initial={{ 
              x: popup.x, 
              y: popup.y, 
              scale: 0.5, 
              opacity: 0 
            }}
            animate={{ 
              y: popup.y - 100, 
              scale: 1.2, 
              opacity: 1 
            }}
            exit={{ 
              y: popup.y - 200, 
              scale: 0.8, 
              opacity: 0 
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            onAnimationComplete={() => onComplete(popup.id)}
            className={`absolute ${getPopupStyle(popup.type)} drop-shadow-[0_0_10px_currentColor]`}
            style={{ left: popup.x, top: popup.y }}
          >
            {getPopupText(popup)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingScorePopup;
