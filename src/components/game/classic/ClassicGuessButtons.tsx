import { motion } from "framer-motion";
import { Bot, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassicGuessButtonsProps {
  disabled: boolean;
  onGuess: (isAi: boolean) => void;
}

const ClassicGuessButtons = ({ disabled, onGuess }: ClassicGuessButtonsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={() => onGuess(true)}
          disabled={disabled}
          className="w-full h-14 text-xl font-black bg-muted hover:bg-muted/80 text-foreground border-2 border-border hover:border-cyan/50 hover:shadow-[0_0_20px_rgba(107,140,255,0.22)] transition-all relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Bot className="w-6 h-6" />
            AI
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan/0 via-cyan/20 to-cyan/0"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={() => onGuess(false)}
          disabled={disabled}
          className="w-full h-14 text-xl font-black btn-gradient text-primary-foreground relative overflow-hidden hover:shadow-[0_0_20px_rgba(139,93,255,0.3)]"
        >
          <span className="relative z-10 flex items-center gap-2">
            <UserRound className="w-6 h-6" />
            HUMAN
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </Button>
      </motion.div>
    </div>
  );
};

export default ClassicGuessButtons;
