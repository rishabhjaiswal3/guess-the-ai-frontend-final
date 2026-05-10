import { useState } from "react";
import type { MouseEvent } from "react";
import { Eye, Copy, ExternalLink, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { normalizeImageHashInput } from "@/lib/imageHashInput";
import networkConfig from "@/lib/networkConfig";

const ProofImage = ({ primary, fallback, onFail }: { primary: string; fallback: string | null; onFail: () => void }) => {
  const [src, setSrc] = useState(primary);
  return (
    <div className="rounded-xl overflow-hidden border border-border/60" style={{ aspectRatio: "4/3" }}>
      <img
        src={src}
        alt="Submitted image"
        className="w-full h-full object-cover"
        onError={() => {
          if (fallback && src !== fallback) {
            setSrc(fallback);
          } else {
            onFail();
          }
        }}
      />
    </div>
  );
};

interface VerifyHashEyeButtonProps {
  hash: string;
  visible: boolean;
  txHash?: string | null;
  timestamp?: string | null;
  imageUrl?: string | null;
  fallbackImageUrl?: string | null;
  className?: string;
}

const VerifyHashEyeButton = ({ hash, visible, txHash, timestamp, imageUrl, fallbackImageUrl, className }: VerifyHashEyeButtonProps) => {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!visible) return null;

  const normalized = normalizeImageHashInput(hash);
  const explorerBase = networkConfig.blockExplorers?.default?.url;

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(normalized);
      toast.success("Hash copied to clipboard");
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
          "relative z-[60] h-9 w-9 min-w-9 rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur-sm hover:bg-background",
          className
        )}
        onClick={(e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        aria-label="View proof"
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-md"
          onClick={(e) => e.stopPropagation()}
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-cyan-400" />
              Proof of Record
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-1">
            {/* Image preview */}
            {imageUrl && !imgError && (
              <ProofImage
                primary={imageUrl}
                fallback={fallbackImageUrl ?? null}
                onFail={() => setImgError(true)}
              />
            )}

            {/* Image hash */}
            <div className="rounded-xl bg-muted/40 border border-border/60 p-3">
              <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">Image Hash</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] text-foreground/90 break-all flex-1 leading-relaxed">{normalized}</p>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={copyHash}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Timestamp */}
            {timestamp && (
              <div className="rounded-xl bg-muted/40 border border-border/60 p-3">
                <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">Answered At</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                  <p className="text-xs text-foreground/90">{new Date(timestamp).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* TX hash */}
            {txHash ? (
              <div className="rounded-xl bg-cyan-500/10 border border-cyan-400/30 p-3">
                <p className="text-[10px] text-cyan-400 mb-1.5 font-semibold uppercase tracking-wider">Transaction Hash · 0G Network</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[11px] text-cyan-200/90 break-all flex-1 leading-relaxed">
                    {txHash}
                  </p>
                  {explorerBase && (
                    <a href={`${explorerBase}/tx/${txHash}`} target="_blank" rel="noreferrer" className="shrink-0">
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-cyan-400 hover:text-cyan-300">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/20 border border-border/40 p-3">
                <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">Transaction Hash · 0G Network</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                  <p className="text-xs text-muted-foreground/60 italic">Recording on-chain...</p>
                </div>
              </div>
            )}

            {/* Powered by */}
            <div className="flex items-center justify-center gap-2 pt-1 pb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-[11px] text-muted-foreground font-medium">Secured by 0G Network</p>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerifyHashEyeButton;
