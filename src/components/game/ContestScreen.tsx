import { motion } from "framer-motion";
import { ArrowRight, CarFront, CheckCircle2, LockKeyhole, Trophy } from "lucide-react";
import GlowingBorder from "@/components/effects/GlowingBorder";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { resolveContestRewardDetails } from "@/lib/highwayHustleContest";

const openGameTab = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("gta:reset-game"));
  window.dispatchEvent(new CustomEvent("gta:set-tab", { detail: "game" }));
};

const ContestScreen = () => {
  const { profile } = useAuth();
  const bestStreak = Math.max(profile?.streak ?? 0, 0);
  const reward = resolveContestRewardDetails(profile?.contestReward, bestStreak);
  const progress = Math.min(reward.currentBestStreak, reward.targetStreak);
  const remaining = Math.max(reward.targetStreak - progress, 0);
  const statusLabel = reward.granted ? "Reward unlocked" : reward.unlocked ? "Ready to claim" : "Still climbing";

  return (
    <div className="px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-6"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">
            Streak To Win
          </p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Contest
          </h1>
        </motion.div>

        <GlowingBorder glowColor="cyan" intensity="medium" className="rounded-[32px]">
          <section className="glass-3d rounded-[32px] p-5 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_360px] lg:items-start">
              <motion.div
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                    <Trophy className="h-4 w-4" />
                    Cross-Game Reward
                  </div>

                  <div className="max-w-2xl space-y-3">
                    <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                      Make a streak of {reward.targetStreak} and claim the car reward.
                    </h2>
                    <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                      Hit the target here in Guess The AI, then log into Highway Hustle with the same wallet and the reward car will be waiting in your garage.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Progress</p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {progress}
                      <span className="text-lg text-slate-400">/{reward.targetStreak}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Reward</p>
                    <p className="mt-2 text-base font-bold text-white">{reward.title}</p>
                    <p className="mt-1 text-sm text-slate-400">Muscle car unlock</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Wallet</p>
                    <p className="mt-2 text-base font-bold text-white">Same wallet</p>
                    <p className="mt-1 text-sm text-slate-400">Use it in both games</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-3 overflow-hidden rounded-full bg-white/8">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${reward.progressPercent}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-300">
                      {reward.granted
                        ? "Your wallet already qualified for this reward."
                        : remaining > 0
                          ? `${remaining} more streak point${remaining === 1 ? "" : "s"} to unlock it.`
                          : "You reached the target. Open Highway Hustle with the same wallet."}
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
                        {reward.granted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <LockKeyhole className="h-4 w-4 text-amber-200" />
                        )}
                        {statusLabel}
                      </div>
                      <Button
                        onClick={openGameTab}
                        className="rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100"
                      >
                        Play Now
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="lg:justify-self-end"
              >
                <div className="relative ml-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                  <div className="absolute inset-x-6 top-0 h-24 rounded-full bg-amber-300/10 blur-3xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/80">
                        Reward Card
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-white">{reward.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">Claim in Highway Hustle</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <CarFront className="h-5 w-5 text-amber-200" />
                    </div>
                  </div>

                  <div className="relative mt-5 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/80 to-slate-950 p-4">
                    <div className="absolute inset-x-10 top-3 h-16 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="relative flex items-center justify-center">
                      <img
                        src={reward.image}
                        alt={`${reward.title} reward car`}
                        className="h-36 w-auto object-contain drop-shadow-[0_18px_26px_rgba(0,0,0,0.5)] sm:h-40"
                      />
                    </div>
                  </div>

                  <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Target</p>
                      <p className="mt-2 text-lg font-bold text-white">{reward.targetStreak} best streak</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Status</p>
                      <p className="mt-2 text-lg font-bold text-white">{reward.granted ? "Unlocked" : "Locked"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </GlowingBorder>
      </div>
    </div>
  );
};

export default ContestScreen;
