import { motion } from "framer-motion";
import { ArrowLeft, Flame, Star, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedCounter from "@/components/effects/AnimatedCounter";

interface ClassicStatsBarProps {
  timeLeft: number;
  streak: number;
  combo: number;
  score: number;
  onBack: () => void;
  timerColorClass: string;
}

const ClassicStatsBar = ({
  timeLeft,
  streak,
  combo,
  score,
  onBack,
  timerColorClass,
}: ClassicStatsBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 mb-3 w-full max-w-md"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="text-muted-foreground mr-auto"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Modes
      </Button>
      <div className={`glass px-4 py-2 rounded-full flex items-center gap-2 ${timerColorClass}`}>
        <Timer className="w-5 h-5" />
        <span className="font-bold text-lg w-6">
          <AnimatedCounter value={timeLeft} />
        </span>
      </div>

      <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange" />
        <AnimatedCounter value={streak} className="font-bold text-lg" />
      </div>

      {combo > 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="glass px-4 py-2 rounded-full flex items-center gap-2 border-secondary"
        >
          <Zap className="w-5 h-5 text-yellow" />
          <span className="font-bold text-lg text-yellow">{combo}x</span>
        </motion.div>
      )}

      <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
        <Star className="w-5 h-5 text-secondary fill-secondary" />
        <AnimatedCounter value={score} className="font-bold text-lg" />
      </div>
    </motion.div>
  );
};

export default ClassicStatsBar;
