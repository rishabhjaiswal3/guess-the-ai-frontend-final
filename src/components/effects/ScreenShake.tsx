import { motion } from "framer-motion";

interface ScreenShakeProps {
  trigger: boolean;
  children: React.ReactNode;
  intensity?: number;
}

const ScreenShake = ({ trigger, children, intensity = 10 }: ScreenShakeProps) => {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -intensity, intensity, -intensity, intensity, 0],
        y: [0, intensity, -intensity, intensity, -intensity, 0],
      } : {}}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
};

export default ScreenShake;
