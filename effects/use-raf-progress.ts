import { useCurrentFrame, useVideoConfig } from "remotion";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

// 动画进度完全由帧时钟驱动（帧号 / 时长），不依赖 requestAnimationFrame
// 或墙钟。这样逐帧渲染时每一帧的进度都精确对应帧号，
// 不会因 rAF 在截图后才触发而导致动画卡在初始帧。
export const useRafProgress = (durationSeconds: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return clamp01(frame / Math.max(1, Number(durationSeconds || 0.8) * fps));
};
