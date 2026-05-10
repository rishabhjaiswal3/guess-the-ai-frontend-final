import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Flame, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedCounter from "@/components/effects/AnimatedCounter";

interface ClassicStatsBarProps {
  streak: number;
  score: number;
  onBack: () => void;
  onRules?: () => void;
}

const ClassicStatsBar = ({
  streak,
  score,
  onBack,
  onRules,
}: ClassicStatsBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 mb-3 w-full max-w-md"
    >
      {onRules ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRules}
          className="glass h-10 rounded-full border-border/60 px-3 text-xs font-semibold text-cyan hover:text-cyan mr-auto"
        >
          <BookOpen className="w-4 h-4 mr-1.5" />
          Rules
        </Button>
      ) : <div className="mr-auto" />}

      <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange" />
        <AnimatedCounter value={streak} className="font-bold text-lg" />
      </div>
      <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
        <Star className="w-5 h-5 text-secondary fill-secondary" />
        <AnimatedCounter value={score} className="font-bold text-lg" />
      </div>
    </motion.div>
  );
};

export default ClassicStatsBar;
