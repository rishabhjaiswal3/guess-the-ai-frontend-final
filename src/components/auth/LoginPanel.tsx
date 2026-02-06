import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const LoginPanel = () => {
  const { openLogin, loading, error, isPrivyReady } = useAuth();

  return (
    <div className="min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-24 pb-24 lg:pb-16">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-8 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan/30 to-magenta/30 mb-4"
          >
            <ShieldCheck className="w-8 h-8 text-primary" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-black gradient-text mb-3">Connect to Play</h1>
          <p className="text-muted-foreground mb-6">
            Login with Privy to start guessing, earn streaks, and climb the leaderboard.
          </p>

          <Button
            onClick={openLogin}
            disabled={!isPrivyReady || loading}
            className="btn-gradient text-primary-foreground h-12 px-6 text-lg font-bold"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? "Connecting..." : "Connect Account"}
          </Button>

          {error && (
            <div className="mt-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            Your wallet stays secure with Privy.
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPanel;
