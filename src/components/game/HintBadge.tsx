import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface HintBadgeProps {
  hint: string | null;
  loading: boolean;
}

/**
 * A small inline hint badge. Shows a loading state while the hint
 * is being generated, then reveals the hint text on click/tap.
 */
const HintBadge = ({ hint, loading }: HintBadgeProps) => {
  const [revealed, setRevealed] = useState(false);

  // Nothing to show — 0G not configured or gave up
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
          /* Loading state — pulsing badge */
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-400/20">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </motion.div>
            <span className="text-xs text-amber-300/80 font-medium">Generating hint...</span>
          </div>
        ) : hint && !revealed ? (
          /* Hint ready — tap to reveal */
          <button
            onClick={() => setRevealed(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-400/30 hover:bg-amber-500/20 hover:border-amber-400/50 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300 font-semibold">Show Hint</span>
          </button>
        ) : hint && revealed ? (
          /* Hint revealed */
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-400/20"
          >
            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-200/90 leading-snug">{hint}</p>
          </motion.div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
};

export default HintBadge;
