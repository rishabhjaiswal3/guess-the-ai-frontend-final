import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";

interface ReplayModalProps {
  blob: Blob | null;
  onClose: () => void;
}

const ReplayModal = ({ blob, onClose }: ReplayModalProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [blob]);

  if (!blob || !videoUrl) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `replay-${Date.now()}.webm`;
    a.click();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl"
        >
          <GlowingBorder glowColor="rainbow" intensity="high" className="rounded-3xl">
            <div className="glass-strong rounded-3xl p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-3xl font-black gradient-text">GAME REPLAY</h2>
                <p className="text-muted-foreground text-sm">Review your detection skills!</p>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-primary/30 bg-black mb-6 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 h-12 glass border-primary/40 text-primary"
                  onClick={handleDownload}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Save Replay
                </Button>
                <Button
                  className="flex-1 h-12 btn-gradient text-primary-foreground"
                  onClick={() => alert("Ready to upload to DO Spaces!")}
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Confirm & Share
                </Button>
              </div>
            </div>
          </GlowingBorder>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReplayModal;
