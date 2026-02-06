import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
}

const AnimatedCounter = ({ value, className = "", duration = 0.5 }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isIncreasing, setIsIncreasing] = useState(true);

  useEffect(() => {
    setIsIncreasing(value > displayValue);
    setDisplayValue(value);
  }, [value]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: isIncreasing ? 20 : -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: isIncreasing ? -20 : 20, opacity: 0 }}
          transition={{ duration, type: "spring", stiffness: 300, damping: 30 }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default AnimatedCounter;
