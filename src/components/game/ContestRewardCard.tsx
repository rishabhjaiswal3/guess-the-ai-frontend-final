import { motion } from "framer-motion";
import { CheckCircle2, LockKeyhole, CarFront, Trophy, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  resolveContestRewardDetails,
  type ContestRewardPayload,
} from "@/lib/highwayHustleContest";

interface ContestRewardCardProps {
  reward?: ContestRewardPayload | null;
  bestStreak?: number;
  compact?: boolean;
  className?: string;
}

const statusStyles = {
  locked: {
    pill: "border-white/10 bg-white/6 text-foreground/80",
    label: "Locked",
  },
  eligible: {
    pill: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    label: "Ready",
  },
  granted: {
    pill: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    label: "Owned",
  },
} as const;

const ContestRewardCard = ({
  reward,
  bestStreak = 0,
  compact = false,
  className,
}: ContestRewardCardProps) => {
  const details = resolveContestRewardDetails(reward, bestStreak);
  const styles = statusStyles[details.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-[#050816]/90 text-white shadow-[0_22px_80px_rgba(5,8,22,0.55)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,194,58,0.2),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(46,214,255,0.18),transparent_34%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

      <div className={cn("relative grid gap-5 p-5", compact ? "md:grid-cols-[1.1fr_140px]" : "md:grid-cols-[1.15fr_220px] md:p-6")}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-200/70">
                Contest Reward
              </p>
              <h3 className={cn("mt-2 font-black text-white", compact ? "text-2xl" : "text-3xl")}>
                {details.title}
              </h3>
              <p className="mt-1 text-sm text-white/65">Cross-game garage unlock</p>
            </div>

            <span className={cn("rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]", styles.pill)}>
              {styles.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-white/80">
            <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1">
              Highway Hustle car
            </span>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1">
              Best streak {details.targetStreak}
            </span>
          </div>

          <p className={cn("max-w-xl text-white/72", compact ? "text-sm" : "text-[15px]")}>
            {compact
              ? `Hit a best streak of ${details.targetStreak} to add this car to your Highway Hustle garage.`
              : `Push your best streak to ${details.targetStreak} in Guess The AI. The same wallet gets this car unlocked in Highway Hustle the moment you qualify.`}
          </p>

          <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                <Trophy className="h-4 w-4 text-amber-300" />
                Progress
              </div>
              <p className="mt-2 text-2xl font-black text-white">
                {Math.min(details.currentBestStreak, details.targetStreak)}/{details.targetStreak}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                {details.granted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : (
                  <LockKeyhole className="h-4 w-4 text-cyan-200" />
                )}
                Status
              </div>
              <p className="mt-2 text-lg font-black text-white">
                {details.granted ? "Garage ready" : details.unlocked ? "Wallet syncing" : "Keep climbing"}
              </p>
            </div>

            {!compact && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                  {details.granted ? (
                    <ShieldCheck className="h-4 w-4 text-fuchsia-200" />
                  ) : (
                    <Zap className="h-4 w-4 text-fuchsia-200" />
                  )}
                  Wallet Sync
                </div>
                <p className="mt-2 text-lg font-black text-white">
                  {details.granted ? "Attached" : "Same wallet"}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${details.progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-amber-300 to-fuchsia-400"
              />
            </div>
            <p className="text-xs text-white/60">{details.note}</p>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-amber-300/18 via-transparent to-cyan-300/14 blur-2xl" />
          <div className="relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))] p-4">
            <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
              <span>Reward car</span>
              <span>{details.granted ? "Unlocked" : "Preview"}</span>
            </div>

            <img
              src={details.image}
              alt={`${details.title} reward car`}
              className={cn(
                "mx-auto w-full object-contain drop-shadow-[0_22px_36px_rgba(255,197,72,0.36)]",
                compact ? "h-28" : "h-40"
              )}
            />

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
              <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/55">
                <span>Vehicle</span>
                <span>{details.rewardId}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">Muscle-class reward</p>
                <CarFront className="h-5 w-5 text-amber-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContestRewardCard;
