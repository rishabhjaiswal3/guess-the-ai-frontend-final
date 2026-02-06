import { motion } from "framer-motion";
import { Trophy, Crown, Medal, Flame, TrendingUp, Star, Shield, ChevronLeft, ChevronRight, User } from "lucide-react";
import { RANK_COLORS } from "@/data/mockData";
import { cn } from "@/lib/utils";
import GlowingBorder from "@/components/effects/GlowingBorder";
import { useEffect, useState, useCallback } from "react";
import { getLeaderboardAllTime, getLeaderboardGateUsers, type LeaderboardEntry, type PaginationInfo } from "@/services/leaderboardApi";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const LeaderboardScreen = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "gate">("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    const params = {
      page,
      limit: 10,
      wallet: profile?.walletAddress || undefined,
    };

    try {
      const fetchData = activeTab === "all" ? getLeaderboardAllTime : getLeaderboardGateUsers;
      const response = await fetchData(params);
      setEntries(response.data ?? []);
      setPagination(response.pagination ?? null);
      setCurrentUserRank(response.currentUserRank ?? null);
    } catch {
      setError("Unable to load leaderboard right now.");
      setEntries([]);
      setPagination(null);
      setCurrentUserRank(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, profile?.walletAddress]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchLeaderboard(currentPage);
  }, [currentPage, fetchLeaderboard]);

  const handlePrevPage = () => {
    if (pagination?.hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const dataset = entries;
  const topThree = currentPage === 1 ? dataset.slice(0, 3) : [];

  const getPodiumColor = (rank: number) => {
    switch (rank) {
      case 1: return "from-yellow via-amber-400 to-yellow";
      case 2: return "from-slate-300 via-slate-200 to-slate-300";
      case 3: return "from-amber-700 via-amber-600 to-amber-700";
      default: return "from-muted to-muted";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-8 h-8 text-yellow drop-shadow-[0_0_10px_gold]" />;
      case 2: return <Medal className="w-7 h-7 text-slate-300" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return null;
    }
  };

  const getDisplayRank = (index: number) => {
    return (currentPage - 1) * 10 + index + 1;
  };

  return (
    <div className="min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-20 pb-32 lg:pb-28">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              rotateY: [0, 10, -10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mx-auto glow-cyan">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black gradient-text mb-2">LEADERBOARDS</h1>
          <p className="text-muted-foreground">
            The greatest AI detectors of all time
          </p>
        </motion.div>

        {/* Current User Rank Banner */}
        {currentUserRank && profile?.walletAddress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="glass-strong rounded-xl p-4 flex items-center justify-between border border-primary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Position</p>
                  <p className="font-bold text-foreground">
                    {profile?.username || "You"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black gradient-text">#{currentUserRank}</p>
                <p className="text-xs text-muted-foreground">
                  out of {pagination?.totalCount || "..."} players
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Podium Section - Only on first page */}
        {currentPage === 1 && topThree.length > 0 && (
          <GlowingBorder glowColor="rainbow" intensity="high" className="rounded-3xl mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-strong rounded-3xl p-6 pb-0 overflow-hidden"
            >
              <div className="flex items-end justify-center gap-4 h-64">
                {/* 2nd Place */}
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative mb-2"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-2xl border-4 border-slate-300">
                      🥈
                    </div>
                    <div className="absolute -top-2 -right-2">
                      {getRankIcon(2)}
                    </div>
                  </motion.div>
                  <span className="font-bold text-foreground text-sm mb-2 truncate max-w-[80px]">
                    {topThree[1]?.username}
                  </span>
                  <span className="text-xs text-muted-foreground mb-2">{topThree[1]?.correctAnswers ?? 0} pts</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "6rem" }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className={`w-20 bg-gradient-to-t ${getPodiumColor(2)} rounded-t-lg flex items-end justify-center pb-2`}
                  >
                    <span className="text-2xl font-black text-slate-700">2</span>
                  </motion.div>
                </motion.div>

                {/* 1st Place */}
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                      boxShadow: [
                        "0 0 20px rgba(255,215,0,0.5)",
                        "0 0 40px rgba(255,215,0,0.8)",
                        "0 0 20px rgba(255,215,0,0.5)",
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative mb-2"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow via-amber-400 to-yellow flex items-center justify-center text-3xl border-4 border-yellow">
                      👑
                    </div>
                    <motion.div
                      className="absolute -top-4 left-1/2 -translate-x-1/2"
                      animate={{ rotate: [-5, 5, -5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {getRankIcon(1)}
                    </motion.div>
                  </motion.div>
                  <span className="font-bold text-foreground mb-2 truncate max-w-[100px]">
                    {topThree[0]?.username}
                  </span>
                  <span className="text-sm text-yellow font-semibold mb-2">{topThree[0]?.correctAnswers ?? 0} pts</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "8rem" }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className={`w-24 bg-gradient-to-t ${getPodiumColor(1)} rounded-t-lg flex items-end justify-center pb-2 relative overflow-hidden`}
                  >
                    <span className="text-3xl font-black text-amber-800 relative z-10">1</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/30 to-white/0"
                      animate={{ y: ["100%", "-100%"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </motion.div>

                {/* 3rd Place */}
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative mb-2"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xl border-4 border-amber-600">
                      🥉
                    </div>
                    <div className="absolute -top-2 -right-2">
                      {getRankIcon(3)}
                    </div>
                  </motion.div>
                  <span className="font-bold text-foreground text-sm mb-2 truncate max-w-[80px]">
                    {topThree[2]?.username}
                  </span>
                  <span className="text-xs text-muted-foreground mb-2">{topThree[2]?.correctAnswers ?? 0} pts</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "5rem" }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className={`w-16 bg-gradient-to-t ${getPodiumColor(3)} rounded-t-lg flex items-end justify-center pb-2`}
                  >
                    <span className="text-xl font-black text-amber-900">3</span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </GlowingBorder>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3 mb-6"
        >
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-6 py-2.5 rounded-full font-bold flex items-center gap-2 border transition-all",
              activeTab === "all"
                ? "btn-gradient text-primary-foreground border-transparent"
                : "glass text-muted-foreground hover:text-foreground hover:border-primary/30"
            )}
          >
            <Star className="w-4 h-4" />
            All Time Legends
          </button>
          <button
            onClick={() => setActiveTab("gate")}
            className={cn(
              "px-6 py-2.5 rounded-full font-bold flex items-center gap-2 border transition-all",
              activeTab === "gate"
                ? "bg-cyan/20 text-cyan-100 border-cyan/50 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                : "glass text-muted-foreground hover:text-foreground hover:border-cyan/30"
            )}
          >
            <Shield className="w-4 h-4" />
            Gate Wallet Users
          </button>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-strong rounded-2xl overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 px-6 py-4 text-sm font-bold text-muted-foreground border-b border-border bg-muted/30">
            <div>RANK</div>
            <div>PLAYER</div>
            <div className="text-center">SCORE</div>
            <div className="text-center">STREAK</div>
            <div className="text-center">BEST</div>
            <div className="text-center">LEVEL</div>
          </div>

          {/* Table Rows */}
          {loading && (
            <div className="px-6 py-12 flex flex-col items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
              <span className="text-muted-foreground text-sm">Loading leaderboard...</span>
            </div>
          )}
          {!loading && error && (
            <div className="px-6 py-6 text-center text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && dataset.length === 0 && (
            <div className="px-6 py-6 text-center text-muted-foreground">
              {currentPage === 1 ? "No users found." : "No more entries."}
            </div>
          )}
          {!loading && !error && dataset.map((entry, index) => {
            const displayRank = getDisplayRank(index);
            const isCurrentUser = profile?.walletAddress &&
              entry.walletAddress?.toLowerCase() === profile.walletAddress.toLowerCase();
            return (
            <motion.div
              key={`${entry.username}-${displayRank}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.03 }}
              whileHover={{ backgroundColor: "rgba(0,255,255,0.08)", x: 4 }}
              className={cn(
                "grid grid-cols-6 gap-4 px-6 py-4 items-center border-b border-border/30 transition-all cursor-pointer",
                index % 2 === 0 ? "bg-muted/5" : "bg-transparent",
                displayRank <= 3 && "border-l-2 border-l-primary/40",
                isCurrentUser && "bg-primary/10 border-l-2 border-l-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg",
                    displayRank <= 3
                      ? `bg-gradient-to-br ${getPodiumColor(displayRank)} text-primary-foreground`
                      : "glass text-foreground"
                  )}
                >
                  {displayRank}
                </motion.div>
                {displayRank <= 3 && <TrendingUp className="w-4 h-4 text-primary" />}
              </div>

              <div className="font-semibold text-foreground truncate flex items-center gap-2">
                <span className="text-lg">{displayRank <= 8 ? ["👑", "🥈", "🥉", "🎮", "🎯", "🎲", "🎪", "🎭"][displayRank - 1] : "🎮"}</span>
                {entry.username}
                {isCurrentUser && <span className="text-xs text-primary">(You)</span>}
              </div>

              <div className="text-center">
                <span className="text-foreground font-bold">{entry.correctAnswers}</span>
                <span className="text-muted-foreground text-sm"> pts</span>
              </div>

              <div className="text-center flex items-center justify-center gap-1">
                {entry.currentStreak > 0 && <Flame className="w-4 h-4 text-orange" />}
                <span className="text-muted-foreground">{entry.currentStreak}</span>
              </div>

              <div className="text-center text-muted-foreground font-medium">{entry.streak}</div>

              <div className="flex justify-center">
                <motion.span
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-black",
                    RANK_COLORS[entry.rank] || "bg-muted text-muted-foreground"
                  )}
                >
                  {entry.rank}
                </motion.span>
              </div>
            </motion.div>
          );
          })}
        </motion.div>

        {/* Pagination Controls */}
        {pagination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-between mt-6"
          >
            <div className="text-sm text-muted-foreground">
              {/* Showing {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, pagination.totalCount)} of {pagination.totalCount} */}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!pagination.hasPrevPage || loading}
                className="glass"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <div className="px-4 py-2 glass rounded-lg text-sm font-medium">
                Page {currentPage} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.hasNextPage || loading}
                className="glass"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;
