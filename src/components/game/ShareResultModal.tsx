import { motion, AnimatePresence } from "framer-motion";
import { Twitter, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  totalGames: number;
  accuracy: number;
  level: number;
}

export default function ShareResultModal({ isOpen, onClose, score, totalGames, accuracy, level }: ShareResultModalProps) {
  const shareText = `I just reached Rank ${level} in Guess the AI! 🤖🔍\nMy accuracy: ${accuracy}%\nCan you beat my AI detection score?\n\nPlay now: https://guesstheai.kult.games`;
  
  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleTelegramShare = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent("https://guesstheai.kult.games")}&text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm glass-strong rounded-3xl p-6 border border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-magenta to-yellow-400" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6 mt-2">
              <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold tracking-wider uppercase mb-3 border border-cyan-500/20">
                Milestone Reached
              </span>
              <h2 className="text-2xl font-black text-foreground mb-1">Rank {level} Achieved!</h2>
              <p className="text-sm text-muted-foreground">You've played {totalGames} rounds.</p>
            </div>

            <div className="bg-background/50 rounded-2xl p-4 border border-border/50 mb-6 flex justify-between items-center text-center">
               <div>
                 <p className="text-[10px] uppercase text-muted-foreground font-bold">Score</p>
                 <p className="text-xl font-black text-cyan-400">{score}</p>
               </div>
               <div className="w-px h-8 bg-border/50" />
               <div>
                 <p className="text-[10px] uppercase text-muted-foreground font-bold">Accuracy</p>
                 <p className="text-xl font-black text-magenta">{accuracy}%</p>
               </div>
            </div>

            <p className="text-center text-sm text-foreground/80 font-medium mb-4">
              Challenge your friends to beat your detection score!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleTwitterShare}
                className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white border-none h-12 rounded-xl flex items-center justify-center gap-2 font-bold"
              >
                <Twitter className="w-5 h-5 fill-current" />
                Share
              </Button>
              <Button 
                onClick={handleTelegramShare}
                className="w-full bg-[#229ED9] hover:bg-[#1d88bb] text-white border-none h-12 rounded-xl flex items-center justify-center gap-2 font-bold"
              >
                <Send className="w-5 h-5" />
                Share
              </Button>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Continue Playing
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
