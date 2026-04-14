import { motion } from "framer-motion";
import { LogOut, UserCircle2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { setSoundEnabled } from "@/lib/sound";
import { getStoredSource } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header = ({ onLogoClick }: HeaderProps) => {
  const [soundOn, setSoundOn] = useState(true);
  const { token, username, logout } = useAuth();
  const shouldHideLogout = getStoredSource() === "browser";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 bg-background/60 backdrop-blur-xl border-b border-border/30">
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={onLogoClick}
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 20px rgba(0,255,255,0.5)",
                "0 0 30px rgba(255,0,255,0.5)",
                "0 0 20px rgba(0,255,255,0.5)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <div className="w-12 h-12 rounded-xl glass-strong flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Guess The AI logo"
                className="w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(0,255,255,0.55)]"
              />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-0.5 rounded-xl border border-dashed border-primary/30"
            />
          </motion.div>
          
          <div className="hidden sm:block">
            <motion.span 
              className="text-lg font-black"
              style={{
                background: "linear-gradient(90deg, #00ffff, #ff00ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              GUESS THE AI
            </motion.span>
            <span className="text-xs text-muted-foreground block -mt-1">AI vs Human</span>
          </div>
        </motion.div>

        {/* Right side controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {token ? (
            <div className="hidden sm:flex items-center gap-2 glass px-3 py-2 rounded-full">
              <UserCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                {username || "Player"}
              </span>
            </div>
          ) : null}

          {token && !shouldHideLogout ? (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="hidden sm:flex gap-2 border-primary/40 text-primary hover:bg-primary/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          ) : null}

          {/* Sound toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
            }}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </motion.button>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
