import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { isSoundEnabled } from "@/lib/sound";

interface LabInitializationOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
  agentName?: string;
}

export default function LabInitializationOverlay({ isOpen, onComplete, agentName }: LabInitializationOverlayProps) {
  const [step, setStep] = useState(0);
  
  const steps = useMemo(() => [
    "KULT: Establishing secure link...",
    `KULT: Welcome, Agent ${agentName || "Detective"}`
  ], [agentName]);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      const interval = setInterval(() => {
        setStep(prev => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            // Step 4: Voice Synthesis for welcome
            if ('speechSynthesis' in window && isSoundEnabled()) {
              try {
                const msg = new SpeechSynthesisUtterance(`Welcome, Agent ${agentName || "Detective"}`);
                msg.rate = 0.9;
                msg.pitch = 0.1;
                window.speechSynthesis.speak(msg);
              } catch (e) {
                console.warn("Speech synthesis failed", e);
              }
            }
            setTimeout(() => {
              onComplete();
            }, 1500);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [isOpen, onComplete, steps]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Step 2: Data Stream Background */}
          <div className="absolute inset-0 opacity-10 flex justify-around pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -500 }}
                animate={{ y: 1000 }}
                transition={{ 
                  duration: Math.random() * 2 + 1, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 2
                }}
                className="w-px h-64 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
              />
            ))}
          </div>

          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="mb-8 relative">
              <motion.div 
                animate={{ 
                  boxShadow: ["0 0 20px rgba(34,211,238,0.2)", "0 0 40px rgba(34,211,238,0.5)", "0 0 20px rgba(34,211,238,0.2)"] 
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 rounded-2xl border-2 border-cyan-500/50 flex items-center justify-center bg-cyan-500/10 p-4 overflow-hidden shadow-[0_0_20px_rgba(107,140,255,0.3)]"
              >
                <img 
                  src="/logo.png" 
                  alt="Guess The AI" 
                  className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" 
                />
              </motion.div>
              
              {/* Spinning rings */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 border border-cyan-500/20 rounded-full border-t-cyan-500/60"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-8 border border-magenta/10 rounded-full border-b-magenta/40"
              />
            </div>

            <div className="h-20 flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase font-bold mb-2">
                    {steps[step]}
                  </span>
                  
                  {step < steps.length - 1 && (
                     <div className="w-48 h-1 bg-cyan-900/50 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-cyan-400"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.7, ease: "linear" }}
                        />
                     </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-12 grid grid-cols-4 gap-4 opacity-30">
               {[...Array(4)].map((_, i) => (
                 <motion.div 
                  key={i}
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                  className="w-12 h-1 bg-cyan-500"
                 />
               ))}
            </div>
          </motion.div>
          
          {/* Glitch effect overlay */}
          <motion.div 
            animate={{ opacity: [0, 0.05, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
            className="absolute inset-0 bg-white pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
