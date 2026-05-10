import { motion } from "framer-motion";
import { LogOut, UserCircle2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { setSoundEnabled, isSoundEnabled } from "@/lib/sound";
import { getStoredSource } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

import { Gamepad2, Trophy, User, Wallet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabType } from "@/components/BottomNav";

interface HeaderProps {
  onLogoClick?: () => void;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

const Header = ({ onLogoClick, activeTab, onTabChange }: HeaderProps) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const { token, username, logout } = useAuth();
  const shouldHideLogout = getStoredSource() === "browser";

  const tabs = [
    { id: "game" as TabType, icon: Gamepad2, label: "Game", activeColor: "text-primary" },
    { id: "leaderboard" as TabType, icon: Trophy, label: "Leaderboard", activeColor: "text-secondary" },
    { id: "profile" as TabType, icon: User, label: "Profile", activeColor: "text-accent" },
    { id: "wallet" as TabType, icon: Wallet, label: "Wallet", activeColor: "text-yellow" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 bg-background/60 backdrop-blur-xl border-b border-border/30">
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={onLogoClick}
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 20px rgba(107,140,255,0.45)",
                "0 0 30px rgba(139,93,255,0.45)",
                "0 0 20px rgba(107,140,255,0.45)",
              ]
            }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
            <div className="w-10 h-10 rounded-lg glass-strong flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Guess The AI logo"
                className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(107,140,255,0.55)]"
              />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-0.5 rounded-lg border border-dashed border-primary/40"
            />
          </motion.div>

          <div className="min-w-0">
            <motion.span
              className="block truncate text-base font-black leading-none sm:text-lg"
              style={{
                background: "linear-gradient(90deg, #27e7ff 0%, #5f9cff 34%, #9b64ff 68%, #f02cff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              GUESS THE AI
            </motion.span>
            <span className="mt-0.2 block truncate text-[11px] text-muted-foreground sm:text-xs">AI vs Human</span>
          </div>
        </motion.div>

        {/* Desktop Navigation */}
        {token && (
          <div className="hidden md:flex items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300",
                    isActive
                      ? "glass-strong " + tab.activeColor
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktopActiveTab"
                      className="absolute inset-0 bg-gradient-to-t from-primary/25 via-primary/10 to-transparent rounded-xl border border-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon className={cn("w-4 h-4 relative z-10", isActive && "drop-shadow-[0_0_8px_currentColor]")} />
                  <span className={cn("text-sm font-medium relative z-10", isActive && "font-bold")}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right side controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >


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
            className="w-9 h-9 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
