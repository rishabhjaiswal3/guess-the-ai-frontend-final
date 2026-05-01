import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeImageHashInput } from "@/lib/imageHashInput";
import { getDirect0gVerifyConfig, verifyLabelFromIndexer } from "@/lib/verifyManifest0g";
import { verifyImageLabel, verifyErrorMessage, type VerifyManifestPayload } from "@/services/verifyApi";
import { GTA_PENDING_VERIFY_HASH_KEY } from "@/lib/gtaWalletVerify";

const VerifyManifest0gSection = () => {
  const [verifyHashInput, setVerifyHashInput] = useState("");
  const [verifyGuess, setVerifyGuess] = useState<"ai" | "human">("ai");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyManifestPayload | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const direct0g = getDirect0gVerifyConfig();
  const [verifyPreferDirect, setVerifyPreferDirect] = useState(() => direct0g.ready);

  useEffect(() => {
    const pending = sessionStorage.getItem(GTA_PENDING_VERIFY_HASH_KEY);
    if (pending) {
      setVerifyHashInput(pending);
      sessionStorage.removeItem(GTA_PENDING_VERIFY_HASH_KEY);
    }
  }, []);

  const handleVerifyManifest = async () => {
    setVerifyError(null);
    setVerifyNotice(null);
    setVerifyResult(null);
    const normalized = normalizeImageHashInput(verifyHashInput);
    if (!/^0x[a-f0-9]{64}$/u.test(normalized)) {
      setVerifyError("Enter a 32-byte image root (0x + 64 hex), or paste a full 0G indexer URL with ?root=…");
      return;
    }
    const allowServerFallback =
      String(import.meta.env.VITE_VERIFY_MANIFEST_FALLBACK_SERVER ?? "true").toLowerCase() !== "false";

    setVerifyLoading(true);
    let directIndexerFailed = false;
    try {
      if (verifyPreferDirect && direct0g.ready) {
        try {
          const data = await verifyLabelFromIndexer(normalized, verifyGuess);
          setVerifyResult(data);
          return;
        } catch (directErr) {
          if (!allowServerFallback) {
            setVerifyError(verifyErrorMessage(directErr));
            return;
          }
          directIndexerFailed = true;
          console.warn("[verify] direct indexer failed:", directErr);
        }
      }

      const data = await verifyImageLabel(normalized, verifyGuess);
      setVerifyResult(data);
      if (directIndexerFailed) {
        setVerifyNotice(
          "Direct indexer fetch failed in the browser (often CORS). Used your API instead — same IMAGE_LABEL_MANIFEST_STORAGE_ROOT blob."
        );
      }
    } catch (e) {
      setVerifyError(verifyErrorMessage(e));
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-strong rounded-3xl p-6 border border-primary/15"
    >
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-5 h-5 text-secondary" />
        <h2 className="text-lg font-bold text-foreground">Verify with 0G manifest</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Paste the image <span className="text-foreground/90">root hash</span> from the game (use the eye icon after you answer), or a full{" "}
        <span className="font-mono text-[10px]">indexer…/file?root=…</span> link.
        Prefer <strong className="text-foreground font-semibold">Direct 0G</strong> below so your browser pulls the manifest from the indexer; otherwise the backend resolves it (same blob).
      </p>
      {direct0g.ready && (
        <label className="flex items-center gap-2 mb-4 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={verifyPreferDirect}
            onChange={(e) => setVerifyPreferDirect(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          <span>Verify directly from 0G indexer in this browser (set VITE_LABEL_MANIFEST_STORAGE_ROOT)</span>
        </label>
      )}
      <input
        value={verifyHashInput}
        onChange={(e) => setVerifyHashInput(e.target.value)}
        className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3"
        placeholder="0x… or https://indexer-storage-turbo.0g.ai/file?root=0x…"
        autoComplete="off"
        spellCheck={false}
      />
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground w-full sm:w-auto">Your guess:</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={verifyGuess === "ai" ? "default" : "outline"}
            size="sm"
            className={cn(verifyGuess === "ai" && "btn-gradient text-primary-foreground")}
            onClick={() => setVerifyGuess("ai")}
          >
            AI
          </Button>
          <Button
            type="button"
            variant={verifyGuess === "human" ? "default" : "outline"}
            size="sm"
            className={cn(verifyGuess === "human" && "btn-gradient text-primary-foreground")}
            onClick={() => setVerifyGuess("human")}
          >
            Human
          </Button>
        </div>
      </div>
      <Button
        type="button"
        onClick={handleVerifyManifest}
        disabled={verifyLoading}
        className="w-full btn-gradient text-primary-foreground h-11"
      >
        {verifyLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying…
          </>
        ) : (
          "Verify"
        )}
      </Button>
      {direct0g.manifestRoot === "" && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Tip: add <span className="font-mono">VITE_LABEL_MANIFEST_STORAGE_ROOT</span> matching{" "}
          <span className="font-mono">IMAGE_LABEL_MANIFEST_STORAGE_ROOT</span> on the backend for decentralized verify.
        </p>
      )}
      {verifyNotice && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">{verifyNotice}</p>
      )}
      {verifyError && (
        <p className="text-xs text-destructive mt-3">{verifyError}</p>
      )}
      {verifyResult && (
        <div
          className={cn(
            "mt-4 rounded-xl border p-4 text-sm",
            verifyResult.resolved
              ? verifyResult.userWasCorrect
                ? "border-green-500/40 bg-green-500/10"
                : "border-amber-500/40 bg-amber-500/10"
              : "border-border bg-muted/20"
          )}
        >
          {verifyResult.resolved ? (
            <>
              <p className="font-bold text-foreground mb-1">
                Official label: <span className="uppercase text-primary">{verifyResult.correctLabel}</span>
              </p>
              <p className="text-muted-foreground text-xs mb-2">
                You guessed <span className="text-foreground font-medium">{verifyResult.userGuess}</span>
                {" — "}
                {verifyResult.userWasCorrect ? (
                  <span className="text-green-600 dark:text-green-400">Correct</span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-400">Not quite</span>
                )}
              </p>
              {(verifyResult.verificationMode || verifyResult.verifiedAgainstRoot) && (
                <p className="text-[10px] font-mono text-muted-foreground break-all opacity-90 mt-1">
                  Mode:{" "}
                  <span className="text-secondary">
                    {verifyResult.verificationMode === "0g-browser" ? "0G indexer (browser)" : "API"}
                  </span>
                  {verifyResult.verifiedAgainstRoot ? ` · Root ${verifyResult.verifiedAgainstRoot}` : ""}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">{verifyResult.message || "Hash not found in manifest."}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-1 opacity-90">
                Mode: {verifyResult.verificationMode === "0g-browser" ? "0G indexer (browser)" : verifyResult.verificationMode === "api" ? "API" : "—"}
              </p>
              {verifyResult.reason === "unknown_hash" && (
                <p className="text-xs text-muted-foreground mt-1">
                  This image is not in the published label list, or the hash was mistyped.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default VerifyManifest0gSection;
