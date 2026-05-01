import { useState } from "react";
import type { MouseEvent } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { normalizeImageHashInput } from "@/lib/imageHashInput";
import { goToWalletWithVerifyHash } from "@/lib/gtaWalletVerify";

interface VerifyHashEyeButtonProps {
  hash: string;
  /** Shown only after the user has submitted an answer for this image. */
  visible: boolean;
  className?: string;
}

const VerifyHashEyeButton = ({ hash, visible, className }: VerifyHashEyeButtonProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!visible) return null;

  const onEyeClick = async (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const normalized = normalizeImageHashInput(hash);
    try {
      await navigator.clipboard.writeText(normalized);
      toast.success("Root hash copied");
      setConfirmOpen(true);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={cn(
          "absolute z-[60] h-9 w-9 min-w-9 rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur-sm hover:bg-background",
          className
        )}
        onClick={onEyeClick}
        aria-label="Copy image root hash and verify on Wallet"
      >
        <Eye className="h-4 w-4" />
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify this image?</AlertDialogTitle>
            <AlertDialogDescription>
              The root hash is on your clipboard. Open Wallet to check it against the 0G label manifest.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Not now</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="btn-gradient text-primary-foreground"
              onClick={() => {
                goToWalletWithVerifyHash(hash);
                setConfirmOpen(false);
              }}
            >
              Open Wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VerifyHashEyeButton;
