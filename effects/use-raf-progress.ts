import { useEffect, useState } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const useRafProgress = (durationSeconds: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const targetProgress = clamp01(
    frame / Math.max(1, Number(durationSeconds || 0.8) * fps),
  );
  const [progress, setProgress] = useState(targetProgress);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setProgress(targetProgress);
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [targetProgress]);

  return progress;
};
