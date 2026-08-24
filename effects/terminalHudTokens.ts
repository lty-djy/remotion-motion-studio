export const TERMINAL_HUD = {
  canvas: "#05070b",
  panel: "rgba(10, 15, 23, 0.86)",
  panelStrong: "rgba(8, 12, 19, 0.94)",
  line: "rgba(128, 160, 184, 0.20)",
  lineStrong: "rgba(100, 220, 255, 0.50)",
  text: "#EAF5F8",
  muted: "#7E93A0",
  cyan: "#55E6FF",
  violet: "#A879FF",
  amber: "#FFBD59",
  green: "#75F0B4",
  mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  sans: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
} as const;

export const hudClamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export const hudEaseOut = (value: number) => {
  const p = hudClamp(value);
  return 1 - (1 - p) * (1 - p) * (1 - p);
};

export const hudAccent = (value?: string) =>
  value && value.trim() ? value : TERMINAL_HUD.cyan;

export const hudReveal = (frame: number, start: number, span = 12) =>
  hudEaseOut((frame - start) / Math.max(1, span));
