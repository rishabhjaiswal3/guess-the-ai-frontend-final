import { motion } from "framer-motion";
import { Gamepad2, Trophy, User, Wallet, Sparkles, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabType = "game" | "contest" | "leaderboard" | "profile" | "wallet";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "game" as TabType, icon: Gamepad2, label: "Game", activeColor: "text-primary" },
  { id: "contest" as TabType, icon: Gift, label: "Contest", activeColor: "text-amber-300" },
  { id: "leaderboard" as TabType, icon: Trophy, label: "Leaderboard", activeColor: "text-secondary" },
  { id: "profile" as TabType, icon: User, label: "Profile", activeColor: "text-accent" },
  { id: "wallet" as TabType, icon: Wallet, label: "Wallet", activeColor: "text-yellow" },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="max-w-lg mx-auto px-4 pb-4">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="glass-strong rounded-2xl px-2 py-2 flex items-center justify-between relative overflow-hidden shadow-[0_-4px_30px_rgba(107,140,255,0.14)]"
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan/5 via-magenta/5 to-cyan/5"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{ backgroundSize: "200% 100%" }}
          />

          {/* Top edge glow */}
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />

          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 z-10",
                  isActive
                    ? tab.activeColor
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-t from-primary/25 via-primary/10 to-transparent rounded-xl border border-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 left-1/2 -translate-x-1/2"
                    >
                      <Sparkles className="w-3 h-3 text-primary" />
                    </motion.div>
                  </>
                )}
                
                <motion.div
                  animate={isActive ? { 
                    y: [0, -2, 0],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <tab.icon className={cn("w-6 h-6 relative z-10", isActive && "drop-shadow-[0_0_8px_currentColor]")} />
                </motion.div>
                
                <span className={cn(
                  "text-xs font-medium relative z-10",
                  isActive && "font-bold"
                )}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </nav>
  );
};

export default BottomNav;
