import { Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContestRewardCard from "@/components/game/ContestRewardCard";
import type { ContestRewardPayload } from "@/lib/highwayHustleContest";

interface ContestRewardUnlockDialogProps {
  open: boolean;
  reward?: ContestRewardPayload | null;
  onOpenChange: (open: boolean) => void;
}

const ContestRewardUnlockDialog = ({
  open,
  reward,
  onOpenChange,
}: ContestRewardUnlockDialogProps) => {
  const openContestTab = () => {
    window.dispatchEvent(new CustomEvent("gta:set-tab", { detail: "contest" }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-white/10 bg-[#050816]/98 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-black">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300/12 text-amber-200">
              <Gift className="h-5 w-5" />
            </span>
            Contest Reward Unlocked
          </DialogTitle>
          <DialogDescription className="text-white/65">
            Your wallet just cleared the contest streak target. The reward is now ready for the same wallet in Highway Hustle.
          </DialogDescription>
        </DialogHeader>

        <ContestRewardCard reward={reward} />

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/72 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-cyan-200" />
            <p>Check the new Contest tab for the event card, then open Highway Hustle with the same wallet to use the reward.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
              onClick={() => onOpenChange(false)}
            >
              Keep Playing
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-cyan-300 to-fuchsia-400 font-black text-slate-950 hover:opacity-95"
              onClick={openContestTab}
            >
              Open Contest
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContestRewardUnlockDialog;
