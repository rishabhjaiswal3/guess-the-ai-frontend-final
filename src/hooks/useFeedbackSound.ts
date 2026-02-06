import { useMemo } from "react";
import { playTone, setSoundEnabled, isSoundEnabled } from "@/lib/sound";

type SoundType = "success" | "fail" | "back" | "click";

const SOUND_MAP: Record<SoundType, number | number[]> = {
  success: [640, 880],
  fail: [220, 180],
  back: 340,
  click: 520,
};

export function useFeedbackSound() {
  return useMemo(() => {
    const play = (type: SoundType) => {
      const f = SOUND_MAP[type];
      if (Array.isArray(f)) {
        f.forEach((freq, idx) => setTimeout(() => playTone(freq, 0.14), idx * 40));
      } else {
        playTone(f as number, type === "click" ? 0.08 : 0.14);
      }
    };
    return {
      playClick: () => play("click"),
      playBack: () => play("back"),
      playSuccess: () => play("success"),
      playFail: () => play("fail"),
      setSoundEnabled,
      isSoundEnabled,
    };
  }, []);
}
