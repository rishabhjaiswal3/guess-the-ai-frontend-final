import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Star, User, LogOut, Edit, X, Trophy, Target, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RANK_COLORS } from "@/data/mockData";
import { cn } from "@/lib/utils";
import GlowingBorder from "@/components/effects/GlowingBorder";
import AnimatedCounter from "@/components/effects/AnimatedCounter";
import { useAuth } from "@/context/AuthContext";

interface ProfileScreenProps {
  score: number;
  streak: number;
  bestStreak: number;
}

const ACHIEVEMENTS = [
  { id: "first_win", icon: "🎯", name: "First Blood", desc: "Get your first correct guess", unlocked: true },
  { id: "streak_5", icon: "🔥", name: "On Fire", desc: "Reach a 5 streak", unlocked: true },
  { id: "streak_10", icon: "💎", name: "Diamond Eyes", desc: "Reach a 10 streak", unlocked: false },
  { id: "score_100", icon: "💯", name: "Centurion", desc: "Score 100 points", unlocked: true },
  { id: "score_500", icon: "🏆", name: "Champion", desc: "Score 500 points", unlocked: false },
  { id: "perfect_10", icon: "⭐", name: "Perfect 10", desc: "10 correct in a row", unlocked: false },
];

const LEVEL_THRESHOLDS = [
  { level: "NEWBIE", minScore: 0, color: "from-slate-500 to-slate-600" },
  { level: "ROOKIE", minScore: 50, color: "from-green-500 to-emerald-600" },
  { level: "HUNTER", minScore: 150, color: "from-blue-500 to-cyan-600" },
  { level: "EXPERT", minScore: 300, color: "from-purple-500 to-violet-600" },
  { level: "MASTER", minScore: 500, color: "from-orange-500 to-amber-600" },
  { level: "LEGEND", minScore: 1000, color: "from-yellow via-amber-400 to-yellow" },
];

const ProfileScreen = ({ score, streak, bestStreak }: ProfileScreenProps) => {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { profile, username, logout, updateProfileUsername } = useAuth();
  
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

  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.unlocked).length;

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
    setShowAccountModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-20 pb-24 lg:pb-16">
      <div className="max-w-lg mx-auto space-y-6 mb-12">
        {/* Main Profile Card */}
        <GlowingBorder glowColor="magenta" intensity="medium" className="rounded-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-3xl p-6"
          >
            {/* Header with Avatar */}
            <div className="flex items-start gap-4 mb-6">
              {/* Animated Avatar */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(255,0,255,0.5)",
                    "0 0 40px rgba(0,255,255,0.5)",
                    "0 0 20px rgba(255,0,255,0.5)",
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative"
              >
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center text-5xl border-4 border-secondary`}>
                  🎮
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-1 rounded-2xl border-2 border-dashed border-primary/50"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
              </motion.div>

              <div className="flex-1">
                <motion.h1 
                  className="text-2xl font-black gradient-text mb-1"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {user.username}
                </motion.h1>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px] mb-3">
                  {walletAddress
                    ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`
                    : "No wallet linked"}
                </p>
                
                {/* Level Badge */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${currentLevel.color} text-foreground font-bold text-sm`}
                >
                  <Award className="w-4 h-4" />
                  {currentLevel.level}
                </motion.div>
              </div>

              {/* Rank */}
              <div className="text-right">
                <span className="text-xs text-muted-foreground block mb-1">RANK</span>
                <motion.span
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={cn(
                    "inline-flex w-12 h-12 rounded-xl items-center justify-center font-black text-2xl",
                    RANK_COLORS[user.rank] || "bg-muted"
                  )}
                >
                  {user.rank}
                </motion.span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Progress to {nextLevel.level}</span>
                <span className="text-primary font-bold">{Math.round(progressToNext)}%</span>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                <span>{user.correctAnswers} XP</span>
                <span>{nextLevel.minScore} XP</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass rounded-xl p-4 text-center border border-transparent hover:border-yellow/30 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] bg-gradient-to-b from-yellow/5 to-transparent transition-all"
              >
                <Zap className="w-6 h-6 text-yellow mx-auto mb-2" />
                <span className="text-2xl font-black text-foreground block">
                  <AnimatedCounter value={user.bestStreak} />
                </span>
                <span className="text-xs text-muted-foreground">Best Streak</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass rounded-xl p-4 text-center border border-transparent hover:border-orange/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] bg-gradient-to-b from-orange/5 to-transparent transition-all"
              >
                <Flame className="w-6 h-6 text-orange mx-auto mb-2" />
                <span className="text-2xl font-black text-foreground block">
                  <AnimatedCounter value={user.currentStreak} />
                </span>
                <span className="text-xs text-muted-foreground">Current</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass rounded-xl p-4 text-center border border-transparent hover:border-secondary/30 hover:shadow-[0_0_20px_rgba(255,0,255,0.1)] bg-gradient-to-b from-secondary/5 to-transparent transition-all"
              >
                <Star className="w-6 h-6 text-secondary fill-secondary mx-auto mb-2" />
                <span className="text-2xl font-black text-foreground block">
                  <AnimatedCounter value={user.correctAnswers} />
                </span>
                <span className="text-xs text-muted-foreground">Score</span>
              </motion.div>
            </div>
          </motion.div>
        </GlowingBorder>

        {/* Update Username */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-strong rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Update Username</h2>
          </div>
          <div className="flex gap-3">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Enter new username"
            />
            <Button
              onClick={handleSaveUsername}
              disabled={isSaving}
              className="btn-gradient text-primary-foreground"
            >
              {isSaving ? "Saving" : "Save"}
            </Button>
          </div>
          {editError && (
            <p className="text-xs text-destructive mt-2">{editError}</p>
          )}
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Achievements
            </h2>
            <span className="text-sm text-muted-foreground">
              {unlockedAchievements}/{ACHIEVEMENTS.length}
            </span>
          </div>


          <div className="grid grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={achievement.unlocked ? { scale: 1.15, rotate: 8 } : {}}
                className={cn(
                  "relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all",
                  achievement.unlocked
                    ? "glass border-primary/50 shadow-[0_0_15px_rgba(0,255,255,0.15)] hover:shadow-[0_0_25px_rgba(0,255,255,0.3)]"
                    : "bg-muted/30 opacity-40 grayscale"
                )}
              >
                <span className="text-3xl mb-1">{achievement.icon}</span>
                <span className="text-[10px] text-center text-muted-foreground font-medium leading-tight">
                  {achievement.name}
                </span>
                {!achievement.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl opacity-50">🔒</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>


        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-strong rounded-3xl p-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <span className="text-2xl font-black text-foreground">73%</span>
                <span className="text-xs text-muted-foreground block">Accuracy</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
                <Trophy className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <span className="text-2xl font-black text-foreground">#42</span>
                <span className="text-xs text-muted-foreground block">Global Rank</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Button */}
        {/* <Button
          onClick={openAccountModal}
          className="w-full glass text-foreground hover:bg-muted/50 h-14"
          variant="outline"
        >
          <User className="w-5 h-5 mr-2" />
          Account Settings
        </Button> */}
      </div>
    </div>
  );
};

export default ProfileScreen;
