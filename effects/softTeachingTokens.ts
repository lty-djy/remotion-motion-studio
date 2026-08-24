// 人物口播 + 信息解释层：柔和教学紫设计令牌。
// 仅定义共用视觉与节奏；未来效果组件按需 import，不直接注册到效果库。
export const SOFT_TEACHING = {
  overlay: "rgba(20, 18, 31, 0.46)",
  overlayDeep: "rgba(14, 13, 23, 0.68)",
  glass: "rgba(132, 122, 214, 0.12)",
  glassStrong: "rgba(139, 130, 230, 0.27)",
  violet: "#A99AFF",
  violetSoft: "#C9C1FF",
  violetDim: "#7771B9",
  text: "#FBFAFF",
  textMuted: "#C4C0D3",
  textQuiet: "#9691A9",
  line: "rgba(224, 218, 255, 0.30)",
  lineQuiet: "rgba(224, 218, 255, 0.14)",
  radius: { panel: 26, card: 14, chip: 999 },
  spacing: { xs: 8, sm: 12, md: 18, lg: 28, xl: 42 },
  type: {
    display: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
    meta: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
  motion: {
    enterFrames: 12,
    staggerFrames: 6,
    lineDrawFrames: 16,
    highlightFrames: 10,
    enterOffsetY: 12,
  },
} as const;

export const softClamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const softEaseOut = (value: number) => {
  const p = softClamp01(value);
  return 1 - (1 - p) ** 3;
};
export const softReveal = (frame: number, start = 0, span = SOFT_TEACHING.motion.enterFrames) =>
  softEaseOut((frame - start) / Math.max(1, span));
