import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Flame,
  Star,
  Trophy,
  Target,
  Award,
  Sparkles,
  Pencil,
  Check,
  X,
  Loader2,
  Settings,
  ZapOff,
  CarFront,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { useGraphicsSettings } from "@/hooks/useGraphicsSettings";
import { RANK_COLORS } from "@/data/mockData";
import { cn } from "@/lib/utils";
import GlowingBorder from "@/components/effects/GlowingBorder";
import AnimatedCounter from "@/components/effects/AnimatedCounter";
import { useAuth } from "@/context/AuthContext";
import { resolveContestRewardDetails } from "@/lib/highwayHustleContest";
interface ProfileScreenProps {
  score: number;
  streak: number;
  bestStreak: number;
}

const LEVEL_THRESHOLDS = [
  { level: "NEWBIE", minScore: 0, color: "from-slate-500 to-slate-600" },
  { level: "ROOKIE", minScore: 50, color: "from-green-500 to-emerald-600" },
  { level: "HUNTER", minScore: 150, color: "from-blue-500 to-cyan-600" },
  { level: "EXPERT", minScore: 300, color: "from-purple-500 to-violet-600" },
  { level: "MASTER", minScore: 500, color: "from-orange-500 to-amber-600" },
  { level: "LEGEND", minScore: 1000, color: "from-yellow via-amber-400 to-yellow" },
];

const buildAchievements = (correctAnswers: number, bestStreak: number, rewardGranted: boolean) => ([
  { id: "first_win", icon: "🎯", name: "First Blood", desc: "Get your first correct guess", unlocked: correctAnswers >= 1 },
  { id: "streak_5", icon: "🔥", name: "On Fire", desc: "Reach a 5 best streak", unlocked: bestStreak >= 5 },
  { id: "streak_10", icon: "💎", name: "Diamond Eyes", desc: "Reach a 10 best streak", unlocked: bestStreak >= 10 },
  { id: "score_100", icon: "💯", name: "Centurion", desc: "Score 100 total correct guesses", unlocked: correctAnswers >= 100 },
  { id: "score_500", icon: "🏆", name: "Champion", desc: "Score 500 total correct guesses", unlocked: correctAnswers >= 500 },
  { id: "highway_reward", icon: "🏎️", name: "Cross-Game Drop", desc: "Send the Muscle Monster reward to Highway Hustle", unlocked: rewardGranted },
]);

const ProfileScreen = ({ score, streak, bestStreak }: ProfileScreenProps) => {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { profile, username, logout, updateProfileUsername } = useAuth();
  const { lowGraphics, toggleLowGraphics } = useGraphicsSettings();
  
  const user = {
    ...profile,
    username: profile?.username || username || "Player",
    walletAddress: profile?.walletAddress || "",
    correctAnswers: profile?.correctAnswers ?? score ?? 0,
    currentStreak: profile?.currentStreak ?? streak ?? 0,
    bestStreak: Math.max(profile?.streak ?? bestStreak ?? 0, 0),
    rank: profile?.rank ?? "D",
  };
  const walletAddress = user.walletAddress || "";

  // Calculate level based on score
  const currentLevel = LEVEL_THRESHOLDS.reduce((acc, level) => 
    user.correctAnswers >= level.minScore ? level : acc
  , LEVEL_THRESHOLDS[0]);

  const nextLevel = LEVEL_THRESHOLDS.find(l => l.minScore > user.correctAnswers) || currentLevel;
  const progressToNext = nextLevel.minScore > currentLevel.minScore 
    ? ((user.correctAnswers - currentLevel.minScore) / (nextLevel.minScore - currentLevel.minScore)) * 100
    : 100;
  const remainingLevelXp = Math.max(0, nextLevel.minScore - user.correctAnswers);

  const contestReward = resolveContestRewardDetails(profile?.contestReward, user.bestStreak);
  const achievements = buildAchievements(
    user.correctAnswers,
    user.bestStreak,
    contestReward.granted
  );

  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;

  const openAccountModal = () => {
    setEditName(user.username || "");
    setEditError(null);
    setShowAccountModal(true);
  };

  const handleSaveUsername = async () => {
    if (!editName.trim()) {
      setEditError("Username cannot be empty.");
      return;
    }
    setIsSaving(true);
    setEditError(null);
    const ok = await updateProfileUsername(editName.trim());
    setIsSaving(false);
    if (!ok) {
      setEditError("Unable to update username.");
      return;
    }
    setIsEditing(false);
    setShowAccountModal(false);
  };

  return (
    <div className="px-4">
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Main Identity & Quick Stats */}
          <div className="lg:col-span-5 space-y-6">
            {/* Main Profile Card */}
            <GlowingBorder glowColor="magenta" intensity="medium" className="rounded-3xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.005 }}
                className="glass-3d glass-3d-hover rounded-3xl p-8 relative overflow-hidden group"
              >
                {/* Header with Avatar */}
                <div className="flex flex-col items-center text-center mb-8">
                  {/* Animated Avatar */}
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        "0 0 30px rgba(139,93,255,0.48)",
                        "0 0 60px rgba(107,140,255,0.48)",
                        "0 0 30px rgba(139,93,255,0.48)",
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="relative mb-6"
                  >
                    <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center text-6xl border-4 border-secondary/50 shadow-2xl`}>
                      🎮
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-2 rounded-3xl border-2 border-dashed border-primary/40"
                    />
                    <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </motion.div>

                  <div className="w-full">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveUsername();
                            if (e.key === "Escape") {
                              setIsEditing(false);
                              setEditError(null);
                            }
                          }}
                          className="bg-muted/40 border border-primary/50 rounded-xl px-4 py-2 text-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full max-w-[200px] text-center"
                          disabled={isSaving}
                        />
                        {isSaving ? (
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        ) : (
                          <div className="flex gap-1">
                            <button onClick={handleSaveUsername} className="text-green-400 hover:text-green-300 transition-colors p-2 bg-green-400/10 rounded-lg">
                              <Check className="w-5 h-5" />
                            </button>
                            <button onClick={() => { setIsEditing(false); setEditError(null); }} className="text-destructive hover:text-red-400 transition-colors p-2 bg-destructive/10 rounded-lg">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 mb-2 group">
                        <motion.h1 
                          className="text-3xl font-black gradient-text"
                          animate={{ opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {user.username}
                        </motion.h1>
                        <button 
                          onClick={() => {
                            setEditName(user.username);
                            setIsEditing(true);
                            setEditError(null);
                          }}
                          className="transition-opacity p-2 text-muted-foreground hover:text-primary bg-muted/50 hover:bg-primary/20 rounded-full shadow-sm"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {editError && <p className="text-sm text-destructive mb-3 font-medium">{editError}</p>}
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[280px] mx-auto mb-6 bg-white/5 py-1 px-3 rounded-full">
                      {walletAddress
                        ? `${walletAddress.slice(0, 12)}...${walletAddress.slice(-10)}`
                        : "No wallet linked"}
                    </p>
                    
                    <div className="flex justify-center gap-4">
                      {/* Level Badge */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r ${currentLevel.color} text-foreground font-black text-sm shadow-lg`}
                      >
                        <Award className="w-4 h-4" />
                        {currentLevel.level}
                      </motion.div>

                      {/* Rank Badge */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={cn(
                          "inline-flex w-10 h-10 rounded-xl items-center justify-center font-black text-xl shadow-lg border border-white/10",
                          RANK_COLORS[user.rank] || "bg-muted"
                        )}
                      >
                        {user.rank}
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid Integrated */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                  <div className="text-center">
                    <Zap className="w-6 h-6 text-yellow mx-auto mb-2 opacity-80" />
                    <span className="text-xl font-black text-foreground block">
                      <AnimatedCounter value={user.bestStreak} />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Best Streak</span>
                  </div>

                  <div className="text-center">
                    <Flame className="w-6 h-6 text-orange mx-auto mb-2 opacity-80" />
                    <span className="text-xl font-black text-foreground block">
                      <AnimatedCounter value={user.currentStreak} />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Current</span>
                  </div>

                  <div className="text-center">
                    <Star className="w-6 h-6 text-secondary fill-secondary mx-auto mb-2 opacity-80" />
                    <span className="text-xl font-black text-foreground block">
                      <AnimatedCounter value={user.correctAnswers} />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Score</span>
                  </div>
                </div>
              </motion.div>
            </GlowingBorder>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-3d glass-3d-hover rounded-3xl p-6 flex flex-col items-center text-center group transition-colors cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <span className="text-2xl font-black text-foreground">
                  {contestReward.currentBestStreak}/{contestReward.targetStreak}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Contest Goal</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-3d glass-3d-hover rounded-3xl p-6 flex flex-col items-center text-center group transition-colors cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {contestReward.granted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                  ) : contestReward.unlocked ? (
                    <CarFront className="w-6 h-6 text-amber-300" />
                  ) : (
                    <LockKeyhole className="w-6 h-6 text-secondary" />
                  )}
                </div>
                <span className="text-2xl font-black text-foreground">
                  {contestReward.granted ? "LIVE" : contestReward.unlocked ? "READY" : "LOCKED"}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Reward Status</span>
              </motion.div>
            </div>

            {/* Settings Card - Moved here for balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-3d rounded-3xl p-8"
            >
              <h2 className="text-xl font-black text-foreground flex items-center gap-3 mb-6">
                <span className="p-2 rounded-lg bg-cyan-400/10">
                  <Settings className="w-5 h-5 text-cyan-400" />
                </span>
                Game Settings
              </h2>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowGraphics ? 'bg-yellow/20 text-yellow' : 'bg-cyan-400/20 text-cyan-400'}`}>
                    {lowGraphics ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Battery Saver Mode</h3>
                    <p className="text-xs text-muted-foreground">Disables background animations</p>
                  </div>
                </div>
                
                <button 
                  onClick={toggleLowGraphics}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    lowGraphics ? "bg-cyan-400" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      lowGraphics ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Achievements & Progression */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* XP Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.005 }}
              className="glass-3d glass-3d-hover rounded-3xl p-8 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-primary/10">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                  </span>
                  Level Progression
                </h2>
                <div className="text-right">
                  <span className="text-sm font-black text-primary block">Next: {nextLevel.level}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Target: {nextLevel.minScore} XP</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-foreground">
                    {Math.round(progressToNext)}% <span className="text-sm font-medium text-muted-foreground">Complete</span>
                  </span>
                </div>
                
                <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden border border-white/5 p-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-y-1 left-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                  <span>Current: {user.correctAnswers} XP</span>
                  <span>Gap: {remainingLevelXp} XP</span>
                </div>
              </div>
            </motion.div>
            {/* Achievements Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.005 }}
              className="glass-3d glass-3d-hover rounded-3xl p-8 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-yellow/10">
                      <Trophy className="w-6 h-6 text-yellow" />
                    </span>
                    Trophy Room
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Unlock badges by reaching game milestones</p>
                </div>
                <div className="text-center px-4 py-2 glass rounded-2xl border border-white/5">
                  <span className="text-2xl font-black text-primary block">{unlockedAchievements}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Unlocked</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={achievement.unlocked ? { scale: 1.05, y: -5 } : {}}
                    className={cn(
                      "relative rounded-3xl flex flex-col items-center justify-center p-6 transition-all border",
                      achievement.unlocked
                        ? "glass border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-[0_10px_30px_rgba(107,140,255,0.1)]"
                        : "bg-muted/20 opacity-40 grayscale border-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center mb-4 text-4xl shadow-inner",
                      achievement.unlocked ? "bg-white/5" : "bg-black/10"
                    )}>
                      {achievement.icon}
                    </div>
                    <span className="text-sm font-black text-foreground text-center mb-1">
                      {achievement.name}
                    </span>
                    <span className="text-[10px] text-center text-muted-foreground font-medium px-2 leading-tight">
                      {achievement.desc}
                    </span>
                    {!achievement.unlocked && (
                      <div className="absolute top-3 right-3 opacity-50">
                        <span className="text-lg">🔒</span>
                      </div>
                    )}
                    {achievement.unlocked && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="w-4 h-4 text-yellow shadow-glow" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
