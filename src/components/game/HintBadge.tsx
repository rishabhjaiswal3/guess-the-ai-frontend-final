import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Zap } from "lucide-react";

interface HintBadgeProps {
  hint: string | null;
  loading: boolean;
}

const HintBadge = ({ hint, loading }: HintBadgeProps) => {
  const [revealed, setRevealed] = useState(false);

  if (!loading && !hint) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mt-3 mb-1"
      >
        {loading && !hint ? (
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-400/20">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </motion.div>
            <span className="text-xs text-amber-300/80 font-medium">Generating hint via 0G Compute...</span>
          </div>
        ) : hint && !revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-400/30 hover:bg-amber-500/20 hover:border-amber-400/50 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300 font-semibold">Show AI Hint</span>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-400/60">
              <Zap className="w-3 h-3" />
              0G Compute
            </span>
          </button>
        ) : hint && revealed ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col gap-1.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-400/20 overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-200/90 leading-snug min-w-0">{hint}</p>
            </div>
            <div className="flex items-center gap-1 ml-6">
              <Zap className="w-3 h-3 text-amber-400/50" />
              <span className="text-[10px] text-amber-400/50 font-medium">Generated via 0G Compute</span>
            </div>
          </motion.div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
};

export default HintBadge;
