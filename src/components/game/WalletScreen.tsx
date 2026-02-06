import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Link2, CreditCard, ArrowUpRight, Shield, Coins, Gift, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingBorder from "@/components/effects/GlowingBorder";
import { useAuth } from "@/context/AuthContext";
import networkConfig from "@/lib/networkConfig";

const WalletScreen = () => {
  const { openLogin, token, profile } = useAuth();
  const [showTransactions, setShowTransactions] = useState(false);
  const features = [
    { icon: "🏆", lucideIcon: Shield, title: "Compete Globally", desc: "Join the leaderboard and compete with players worldwide", color: "text-primary" },
    { icon: "🎁", lucideIcon: Gift, title: "Earn Rewards", desc: "Win tokens and NFTs for your achievements", color: "text-secondary" },
    { icon: "📊", lucideIcon: Coins, title: "Track Progress", desc: "Your stats are saved securely on-chain", color: "text-accent" },
    { icon: "⚡", lucideIcon: Zap, title: "Instant Payouts", desc: "Withdraw your earnings anytime", color: "text-yellow" },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-20 pb-24 lg:pb-16">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Main Wallet Card */}
        <GlowingBorder glowColor="rainbow" intensity="high" className="rounded-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-3xl p-8 text-center"
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
              <div className="w-24 h-24 rounded-3xl glass flex items-center justify-center glow-cyan">
                <Wallet className="w-12 h-12 text-primary" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-3xl border-2 border-dashed border-secondary/50"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center"
              >
                <span className="text-xs">✨</span>
              </motion.div>
            </motion.div>

            <motion.h1
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="text-4xl font-black mb-3"
              style={{
                background: "linear-gradient(90deg, #00ffff, #ff00ff, #8b5cf6, #00ffff)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {token ? "Wallet Connected" : "Connect Wallet"}
            </motion.h1>
            
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              {token
                ? `Connected as ${profile?.walletAddress || "wallet"}`
                : "Link your wallet to save progress, compete on leaderboards, and earn crypto rewards!"}
            </p>

            {/* Action Buttons */}
            <div className="space-y-4 mb-8">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-16 btn-gradient text-primary-foreground text-lg font-bold relative overflow-hidden"
                  onClick={openLogin}
                  disabled={Boolean(token)}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Link2 className="w-6 h-6" />
                    {token ? "Wallet Connected" : "Connect Wallet"}
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-14 glass text-foreground hover:bg-muted/50 font-semibold"
                  onClick={() => setShowTransactions((prev) => !prev)}
                >
                  <CreditCard className="w-5 h-5 mr-3" />
                  View Transaction History
                </Button>
              </motion.div>
                {/* Transactions */}
              <AnimatePresence>
                {showTransactions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass-strong rounded-3xl p-6"
                  >
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-secondary" />
                      0G Transaction Activity
                    </h2>
                    <div className="space-y-3">
                {[
                  {
                    label: "Core Game Contract",
                    address: "0x4aCfb1a2Dc270846A7913757189543e4C18F7826",
                  },
                        {
                          label: "Answer Submissions",
                          address: "0x73d377634F906fD24fE342fd95182c3c80bCFe49",
                        },
                        {
                          label: "Leaderboard",
                          address: "0x9663dA1163842cfbac83D382Bdf331227d012114",
                        },
                ].map((entry) => {
                  const shortAddress = `${entry.address.slice(0, 10)}...${entry.address.slice(-10)}`;
                  return (
                  <div
                    key={entry.address}
                    className="flex items-center justify-between p-3 rounded-xl glass"
                  >
                    <div   style={{textAlign:'left'}}>
                      <p className="font-medium text-foreground">{entry.label}</p>
                      <p className="text-xs text-muted-foreground">{shortAddress}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-secondary text-secondary hover:bg-secondary/10"
                        onClick={() => {
                          navigator.clipboard.writeText(entry.address).catch(() => {});
                        }}
                      >
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-secondary text-secondary hover:bg-secondary/10"
                        onClick={() => {
                          const explorer = networkConfig.blockExplorers?.default?.url || "https://chainscan.0g.ai";
                          const url = `${explorer}/address/${entry.address}`;
                          window.open(url, "_blank", "noopener,noreferrer");
                        }}
                      >
                        View
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
                })}
              </div>
            </motion.div>
          )}
              </AnimatePresence>
            </div>

            {token ? (
              <div className="text-xs text-muted-foreground">
                Wallet linked. You are ready to play and claim rewards.
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Supports MetaMask, Phantom, Coinbase & more
              </p>
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
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass rounded-2xl p-4"
            >
              <div className={`w-10 h-10 rounded-xl glass flex items-center justify-center mb-3 ${feature.color}`}>
                <feature.lucideIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

      
        {/* Rewards Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-strong rounded-3xl p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-secondary" />
            Available Rewards
          </h2>
          
          <div className="space-y-3">
            {[
              { name: "GALXE 0g CHALLENGE", reward: "Play Classic", icon: "🌌", available: true },
              { name: "GATE WALLET CHALLENGE", reward: "Play Classic", icon: "🛡️", available: true },
              { name: "STREAK MASTER NFT", reward: "Rare NFT", icon: "🔥", available: false },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 5 }}
                className={`flex items-center justify-between p-3 rounded-xl ${item.available ? "glass" : "bg-muted/30 opacity-50"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-primary font-semibold">{item.reward}</p>
                  </div>
                </div>
                {item.available ? (
                  <Button
                    size="sm"
                    className="btn-gradient text-primary-foreground"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("gta:set-tab", { detail: "game" }));
                    }}
                  >
                    Claim
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">🔒 Locked</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WalletScreen;
