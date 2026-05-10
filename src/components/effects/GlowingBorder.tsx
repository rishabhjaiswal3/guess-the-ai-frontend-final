import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlowingBorderProps {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "magenta" | "purple" | "rainbow";
  intensity?: "low" | "medium" | "high";
  animated?: boolean;
}

const GlowingBorder = ({
  children,
  className = "",
  glowColor = "cyan",
  intensity = "medium",
  animated = true,
}: GlowingBorderProps) => {
  const borderColors = {
    cyan: "rgba(107,140,255,VAR)",
    magenta: "rgba(139,93,255,VAR)",
    purple: "rgba(111,99,255,VAR)",
    rainbow: "rgba(107,140,255,VAR)",
  };

  const intensityOpacity = {
    low: { border: 0.15, shadow: 0.08 },
    medium: { border: 0.25, shadow: 0.12 },
    high: { border: 0.35, shadow: 0.18 },
  };

  const op = intensityOpacity[intensity];
  const baseColor = borderColors[glowColor];
  const borderColor = baseColor.replace("VAR", String(op.border));
  const shadowColor = baseColor.replace("VAR", String(op.shadow));
  const shadowColorStrong = baseColor.replace("VAR", String(op.shadow * 1.5));

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 12px ${shadowColor}`,
      }}
      animate={animated ? {
        boxShadow: [
          `0 0 12px ${shadowColor}`,
          `0 0 20px ${shadowColorStrong}`,
          `0 0 12px ${shadowColor}`,
        ],
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Shimmer sweep */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none"
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(105deg, transparent 40%, ${baseColor.replace("VAR", "0.06")} 50%, transparent 60%)`,
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          />
        </motion.div>
      )}

      {/* Content */}
      <div className="relative rounded-[inherit]">
        {children}
      </div>
    </motion.div>
  );
};

export default GlowingBorder;
