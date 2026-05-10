import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Flame, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedCounter from "@/components/effects/AnimatedCounter";
import { cn } from "@/lib/utils";

interface ClassicStatsBarProps {
  streak: number;
  score: number;
  onBack: () => void;
  onRules?: () => void;
  className?: string;
}

const ClassicStatsBar = ({
  streak,
  score,
  onBack,
  onRules,
  className,
}: ClassicStatsBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mb-3 flex w-full max-w-full items-center gap-2",
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onBack}
        className="glass h-10 shrink-0 rounded-full border-border/60 px-3 text-xs font-semibold text-foreground/80 hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back
      </Button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2">
        <div className="glass flex items-center gap-2 rounded-full px-3 py-2 sm:px-4">
          <Flame className="h-5 w-5 shrink-0 text-orange" />
          <AnimatedCounter value={streak} className="font-bold text-lg" />
        </div>
        <div className="glass flex items-center gap-2 rounded-full px-3 py-2 sm:px-4">
          <Star className="h-5 w-5 shrink-0 fill-secondary text-secondary" />
          <AnimatedCounter value={score} className="font-bold text-lg" />
        </div>
      </div>

      {onRules ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRules}
          className="glass h-10 shrink-0 rounded-full border-border/60 px-3 text-xs font-semibold text-cyan hover:text-cyan-200"
        >
          <BookOpen className="mr-1.5 h-4 w-4" />
          Rules
        </Button>
      ) : (
        <div className="h-10 w-[4.5rem] shrink-0 sm:w-24" aria-hidden />
      )}
    </motion.div>
  );
};

export default ClassicStatsBar;
