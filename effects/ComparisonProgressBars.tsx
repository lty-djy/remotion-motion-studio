import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  baselineLabel?: string;
  baselineStatus?: string;
  improvedLabel?: string;
  improvedStatus?: string;
  baselineProgress?: number;
  improvedProgress?: number;
  accentColor?: string;
  mutedColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const StatusIcon: React.FC<{ kind: "baseline" | "improved"; color: string }> = ({ kind, color }) => (
  <span
    aria-hidden="true"
    style={{
      display: "grid",
      placeItems: "center",
      width: 28,
      height: 28,
      flex: "0 0 auto",
      color,
      fontSize: kind === "baseline" ? 27 : 22,
      fontWeight: 900,
      lineHeight: 1,
    }}
  >
    {kind === "baseline" ? "ϟ" : "▣"}
  </span>
);

const ProgressCard: React.FC<{
  label: string;
  status: string;
  progress: number;
  color: string;
  panelColor: string;
  textColor: string;
  kind: "baseline" | "improved";
  frameProgress: number;
  labelFontSize: number;
  statusFontSize: number;
}> = ({ label, status, progress, color, panelColor, textColor, kind, frameProgress, labelFontSize, statusFontSize }) => {
  const active = kind === "improved";
  const fill = clamp(progress) * frameProgress;
  return (
    <Interactive.Div
      name={active ? "持续方案" : "旧方案"}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: 540,
        height: 126,
        boxSizing: "border-box",
        padding: "20px 22px 16px",
        border: `1px solid ${active ? color : "rgba(255,255,255,.14)"}`,
        borderRadius: 15,
        background: active ? `linear-gradient(110deg, ${panelColor}, rgba(5,16,23,.96))` : "rgba(12,13,18,.78)",
        boxShadow: active ? `0 0 18px ${color}55, inset 0 0 20px ${color}16` : "none",
        opacity: interpolate(frameProgress, [0, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(frameProgress, [0, 1], [active ? 14 : -14, 0], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: active ? textColor : "#A2A3AA", fontSize: labelFontSize, fontWeight: 900, letterSpacing: 0.5 }}>
        <StatusIcon kind={kind} color={active ? color : "#A6A7AF"} />
        <span>{label}</span>
        <span style={{ marginLeft: "auto", color: active ? color : "#F35B62", fontSize: statusFontSize, fontWeight: 800 }}>{status}</span>
      </div>
      <div style={{ height: 17, borderRadius: 99, overflow: "hidden", background: active ? `${color}24` : "rgba(197,198,207,.27)" }}>
        <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 99, background: active ? `linear-gradient(90deg, ${color}AA, ${color})` : "#A4A4AD", boxShadow: active ? `0 0 12px ${color}` : "none" }} />
      </div>
    </Interactive.Div>
  );
};

export const ComparisonProgressBars: React.FC<Props> = ({
  enabled = true,
  baselineLabel = "短平快内容",
  baselineStatus = "×",
  improvedLabel = "深度 · 中长视频",
  improvedStatus = "↗ 持续扶持",
  baselineProgress = 0.34,
  improvedProgress = 0.98,
  accentColor = "#22F3EE",
  mutedColor = "#A4A4AD",
  panelColor = "#06151B",
  textColor = "#F8FEFF",
  labelFontSize = 25,
  statusFontSize = 22,
  animationSeconds = 0.7,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(10, Math.round(animationSeconds * fps));
  const frameProgress = enabled ? interpolate(frame, [0, enterFrames], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  return (
    <Interactive.Div name="对比进度条" data-effect="ComparisonProgressBars" style={{ display: "grid", gap: 14, width: 540, height: 266, color: textColor, fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', pointerEvents: "none" }}>
      <ProgressCard label={baselineLabel} status={baselineStatus} progress={baselineProgress} color={mutedColor} panelColor={panelColor} textColor={textColor} kind="baseline" frameProgress={frameProgress} labelFontSize={labelFontSize} statusFontSize={statusFontSize} />
      <ProgressCard label={improvedLabel} status={improvedStatus} progress={improvedProgress} color={accentColor} panelColor={panelColor} textColor={textColor} kind="improved" frameProgress={frameProgress} labelFontSize={labelFontSize} statusFontSize={statusFontSize} />
    </Interactive.Div>
  );
};

export const ComparisonProgressBarsEffectDef: EffectDef = {
  id: "ComparisonProgressBars",
  name: "对比进度条·持续扶持",
  description: "上下两张状态卡对比旧方案与持续方案，用灰色低进度和青色满进度表达差异。",
  category: "comparison",
  catalogGroup: "图表与比较",
  glyph: "VS",
  placement: "left",
  component: ComparisonProgressBars as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 540, height: 266 },
  defaultPosition: { x: 72, y: 390, scale: 1 },
  defaultProps: {
    enabled: true,
    baselineLabel: "短平快内容",
    baselineStatus: "×",
    improvedLabel: "深度 · 中长视频",
    improvedStatus: "↗ 持续扶持",
    baselineProgress: 0.34,
    improvedProgress: 0.98,
    accentColor: "#22F3EE",
    mutedColor: "#A4A4AD",
    panelColor: "#06151B",
    textColor: "#F8FEFF",
    labelFontSize: 25,
    statusFontSize: 22,
    animationSeconds: 0.7,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示对比进度条", default: true },
    baselineLabel: { type: "text", label: "旧方案标题" },
    baselineStatus: { type: "text", label: "旧方案状态" },
    improvedLabel: { type: "text", label: "新方案标题" },
    improvedStatus: { type: "text", label: "新方案状态" },
    baselineProgress: { type: "number", label: "旧方案进度", default: 0.34, min: 0, max: 1, step: 0.01 },
    improvedProgress: { type: "number", label: "新方案进度", default: 0.98, min: 0, max: 1, step: 0.01 },
    accentColor: { type: "color", label: "强调色", default: "#22F3EE" },
    mutedColor: { type: "color", label: "弱化色", default: "#A4A4AD" },
    panelColor: { type: "color", label: "新方案底色", default: "#06151B" },
    textColor: { type: "color", label: "文字颜色", default: "#F8FEFF" },
    labelFontSize: { type: "number", label: "标题字号(px)", default: 25, min: 10, max: 64, step: 1 },
    statusFontSize: { type: "number", label: "状态字号(px)", default: 22, min: 10, max: 64, step: 1 },
    animationSeconds: { type: "number", label: "入场时长(秒)", default: 0.7, min: 0.2, max: 2, step: 0.05 },
  },
};
