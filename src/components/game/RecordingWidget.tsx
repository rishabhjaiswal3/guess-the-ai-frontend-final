import { motion, AnimatePresence } from "framer-motion";
import { Video, Square, Zap, Info } from "lucide-react";
import { ResourceStats } from "@/hooks/useGameRecorder";

interface RecordingWidgetProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  stats: ResourceStats | null;
}

const RecordingWidget = ({ isRecording, onStart, onStop, stats }: RecordingWidgetProps) => {
  return (
    <div className="fixed top-24 right-4 z-[60] flex flex-col items-end gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isRecording ? onStop : onStart}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-lg transition-colors ${
          isRecording 
            ? "bg-red-500 text-white animate-pulse" 
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            <span>STOP REC</span>
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            <span>START REC</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isRecording && stats && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-strong p-3 rounded-2xl text-[10px] font-mono border border-primary/30 flex flex-col gap-1 min-w-[120px]"
          >
            <div className="flex justify-between items-center text-primary">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> FPS:</span>
              <span className="font-bold">{stats.fps}</span>
            </div>
            <div className="flex justify-between items-center text-secondary">
              <span className="flex items-center gap-1"><Info className="w-3 h-3" /> RAM:</span>
              <span className="font-bold">{stats.ram}</span>
            </div>
            <div className="flex justify-between items-center text-cyan-400">
              <span className="flex items-center gap-1"><Video className="w-3 h-3" /> BIT:</span>
              <span className="font-bold">{stats.bitrate}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecordingWidget;
