import { useState, useEffect, useRef } from "react";
import { pollHint } from "@/services/gameModesApi";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 15; // ~45 seconds max (batch 0G can take 20–30s)

/**
 * Polls for a hint by roundId.
 * Returns { hint, loading } — hint is null until ready.
 */
export function useHint(roundId: string | null | undefined) {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset on new roundId
    setHint(null);

    if (!roundId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let attempts = 0;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const result = await pollHint(roundId);
        if (cancelled) return;

        if (result?.ready && result.hint) {
          setHint(result.hint);
          setLoading(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
      } catch {
        // Silently ignore poll errors
      }

      if (attempts >= MAX_ATTEMPTS) {
        setLoading(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    // First poll after a short delay (give 0G time to respond)
    const initialTimeout = setTimeout(() => {
      if (cancelled) return;
      poll();
      intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [roundId]);

  return { hint, loading };
}
