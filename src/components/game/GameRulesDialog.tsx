import { GAME_MODES, GameModeType } from "@/data/gameModes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const POINTS_RULES: Record<GameModeType, string[]> = {
  classic: ["Correct answer: +1", "Wrong answer: 0"],
  multiselect: [
    "Per image: +1 if correctly selected / correctly left unselected",
    "Per image: 0 if wrong",
    "If any wrong image is selected, round score becomes 0",
    "Round score = total correct images",
  ],
  duel: ["Normal: correct +1, wrong 0", "Speed: correct +2, wrong -1"],
  oddoneout: ["Correct answer: +5", "Wrong answer: 0"],
  cardflip: ["Per card correct: +1", "Per card wrong: 0"],
  rapidfire: ["Every correct answer: +3", "Every wrong answer: -1"],
};

interface GameRulesDialogProps {
  mode: GameModeType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GameRulesDialog = ({ mode, open, onOpenChange }: GameRulesDialogProps) => {
  const modeName = GAME_MODES.find((item) => item.id === mode)?.name || "Game";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{modeName} Rules</DialogTitle>
          <DialogDescription>Point system for this mode.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm text-foreground">
          {POINTS_RULES[mode].map((line) => (
            <div key={line} className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              {line}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameRulesDialog;
