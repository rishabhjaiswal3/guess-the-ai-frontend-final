import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Link2, CreditCard, ArrowUpRight, Shield, Coins, Gift, Zap, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import { useAuth } from "@/context/AuthContext";
import networkConfig from "@/lib/networkConfig";
import { getGameTransactions, type GameTransactionRecord } from "@/lib/gameTransactions";
import { getStoredSource } from "@/lib/session";
import VerifyManifest0gSection from "@/components/game/VerifyManifest0gSection";

const WalletScreen = () => {
  const { openLogin, token, profile, logout } = useAuth();
  const [showTransactions, setShowTransactions] = useState(false);
  const [gameTransactions, setGameTransactions] = useState<GameTransactionRecord[]>([]);
  const [walletCopied, setWalletCopied] = useState(false);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const handleCopyWallet = () => {
    if (!profile?.walletAddress) return;
    navigator.clipboard.writeText(profile.walletAddress).then(() => {
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    });
  };

  const handleCopyContract = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedContract(address);
    setTimeout(() => setCopiedContract(null), 1000);
  };
  const shouldHideLogout = getStoredSource() === "browser";

  useEffect(() => {
    if (!showTransactions) return;
    setGameTransactions(getGameTransactions());
  }, [showTransactions, token]);

  const explorer = networkConfig.blockExplorers?.default?.url || "https://chainscan.0g.ai";
  const allowedModeLabels: Record<string, string> = {
    classic: "Classic Mode",
    multiselect: "Multi Select",
    duel: "Dual Mode",
    oddoneout: "Odd One Out",
  };
  const filteredGameTransactions = gameTransactions.filter((tx) => {
    const normalizedMode = String(tx.mode || "").toLowerCase().replace(/[\s_-]/g, "");
    return Boolean(allowedModeLabels[normalizedMode]);
  });
  const features = [
    { icon: "🏆", lucideIcon: Shield, title: "Compete Globally", desc: "Join the leaderboard and compete with players worldwide", color: "text-primary" },
    { icon: "🎁", lucideIcon: Gift, title: "Earn Rewards", desc: "Win tokens and NFTs for your achievements", color: "text-secondary" },
    { icon: "📊", lucideIcon: Coins, title: "Track Progress", desc: "Your stats are saved securely on-chain", color: "text-accent" },
    { icon: "⚡", lucideIcon: Zap, title: "Instant Payouts", desc: "Withdraw your earnings anytime", color: "text-yellow" },
  ];

  return (
    <div className="px-4">
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Wallet Connection & Features */}
          <div className="lg:col-span-5 space-y-6">
            {/* Main Wallet Card */}
            <GlowingBorder glowColor="rainbow" intensity="high" className="rounded-3xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01 }}
                className="glass-3d glass-3d-hover rounded-3xl p-8 text-center relative overflow-hidden group"
              >
                {/* Animated Wallet Icon */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotateY: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative inline-block mb-8"
                >
                  <div className="w-32 h-32 rounded-3xl glass flex items-center justify-center glow-cyan shadow-2xl">
                    <Wallet className="w-16 h-16 text-primary" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-3 rounded-3xl border-2 border-dashed border-secondary/40"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="w-5 h-5 text-secondary-foreground" />
                  </motion.div>
                </motion.div>

                <motion.h1
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="text-4xl font-black mb-4"
                  style={{
                    background: "linear-gradient(90deg, #6b8cff, #6f63ff, #b477ff, #6b8cff)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {token ? "Assets Secured" : "Web3 Identity"}
                </motion.h1>
                
                <div className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  {token && profile?.walletAddress ? (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-60">Connected Address</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-mono text-sm text-foreground">
                          {profile.walletAddress.slice(0, 8)}...{profile.walletAddress.slice(-8)}
                        </span>
                        <button
                          onClick={handleCopyWallet}
                          className="p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          {walletCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-primary" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium leading-relaxed">
                      Connect your wallet to enable on-chain rewards, global rankings, and permanent progress tracking.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full h-16 btn-gradient text-primary-foreground text-lg font-black relative overflow-hidden shadow-xl"
                      onClick={openLogin}
                      disabled={Boolean(token)}
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        <Link2 className="w-6 h-6" />
                        {token ? "Wallet Linked" : "Connect Wallet"}
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </Button>
                  </motion.div>

                  {token && !shouldHideLogout && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="w-full h-14 glass text-destructive border-destructive/20 hover:bg-destructive/10 font-black tracking-wide"
                        onClick={logout}
                      >
                        Disconnect Session
                      </Button>
                    </motion.div>
                  )}
                </div>

                {token && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-green-400 font-bold uppercase tracking-widest bg-green-400/5 py-2 px-4 rounded-full border border-green-400/10">
                    <Shield className="w-3 h-3" />
                    Secure On-Chain Connection Active
                  </div>
                )}
              </motion.div>
            </GlowingBorder>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="glass-3d glass-3d-hover rounded-3xl p-5 group cursor-default border border-white/10"
                >
                  <div className={`w-12 h-12 rounded-2xl glass flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color} bg-white/5`}>
                    <feature.lucideIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-sm text-foreground mb-1">{feature.title}</h3>
                  <p className="text-[10px] text-muted-foreground font-medium leading-snug">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Transaction History & Verification */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Verification Section */}
            <VerifyManifest0gSection className="flex-1" />

            {/* 0G Transaction Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.005 }}
              className="glass-3d glass-3d-hover rounded-3xl p-8 border border-white/10 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-magenta/10">
                  <CreditCard className="w-6 h-6 text-magenta" />
                </div>
                <h2 className="text-2xl font-black text-foreground">0G Transaction Activity</h2>
              </div>

              <div className="space-y-8">
                {/* Recent Game Transactions */}
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">Recent Game Transactions</h3>
                  {filteredGameTransactions.length > 0 && (
                    <div className="space-y-3">
                      {filteredGameTransactions.slice(0, 3).map((tx) => {
                        const normalizedMode = String(tx.mode || "").toLowerCase().replace(/[\s_-]/g, "");
                        const modeLabel = allowedModeLabels[normalizedMode] || tx.mode;
                        const shortHash = `${tx.hash.slice(0, 10)}...${tx.hash.slice(-10)}`;
                        return (
                          <div key={tx.hash} className="flex items-center justify-between p-4 rounded-xl glass border border-white/10 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{modeLabel}</p>
                                <p className="text-[10px] text-muted-foreground font-mono opacity-50">{shortHash}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-[10px] font-bold text-primary hover:bg-primary/10"
                              onClick={() => window.open(`${explorer}/tx/${tx.hash}`, "_blank")}
                            >
                              EXPLORER
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="h-px bg-white/10" />

                {/* Core Contracts */}
                <div className="space-y-4">
                  {[
                    { label: "Core Game Contract", address: "0x4aCfb1a2Dc270846A7913757189543e4C18F7826" },
                    { label: "Answer Submissions", address: "0x73d377634F906fD24fE342fd95182c3c80bCFe49" },
                    { label: "Leaderboard", address: "0x9663dA1163842cfbac83D382Bdf331227d012114" },
                  ].map((entry) => (
                    <div 
                      key={entry.address} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-all group gap-4 sm:gap-0"
                    >
                      <div className="text-left">
                        <p className="text-lg font-black text-foreground mb-1 group-hover:text-magenta transition-colors">{entry.label}</p>
                        <p className="text-xs text-muted-foreground font-mono opacity-60">
                          {entry.address.slice(0, 8)}...{entry.address.slice(-6)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-6 text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-300",
                            copiedContract === entry.address 
                              ? "bg-green-500/10 border-green-500/50 text-green-500" 
                              : "border-magenta/30 text-magenta hover:bg-magenta/10"
                          )}
                          onClick={() => handleCopyContract(entry.address)}
                        >
                          {copiedContract === entry.address ? "Copied!" : "Copy"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none border-magenta/30 text-magenta hover:bg-magenta/10 h-9 sm:h-10 px-3 sm:px-6 text-[10px] sm:text-xs font-bold rounded-xl"
                          onClick={() => window.open(`${explorer}/address/${entry.address}`, "_blank")}
                        >
                          View <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletScreen;
