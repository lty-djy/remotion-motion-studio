import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  value?: string;
  unit?: string;
  currentLabel?: string;
  goalLabel?: string;
  progress?: number;
  accentColor?: string;
  goalColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const MilestoneFollowerProgress: React.FC<Props> = ({
  enabled = true,
  eyebrow = "MILESTONE",
  title = "涨粉节点",
  value = "200,000",
  unit = "粉丝",
  currentLabel = "200,000",
  goalLabel = "⚑ 年底 500,000",
  progress = 0.4,
  accentColor = "#20F2E9",
  goalColor = "#F5C34E",
  textColor = "#FFFFFF",
  animationSeconds = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(12, Math.round(animationSeconds * fps));
  const reveal = enabled
    ? interpolate(frame, [0, enterFrames], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const fill = Math.max(0, Math.min(1, progress)) * reveal;

  return (
    <Interactive.Div name="里程碑增长指标" data-effect="MilestoneFollowerProgress" style={{ width: 570, height: 390, color: textColor, fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', pointerEvents: "none", opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [18, 0], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)` }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ borderLeft: `5px solid ${accentColor}`, paddingLeft: 16 }}>
          <div style={{ color: accentColor, fontSize: 20, fontWeight: 900, letterSpacing: 4 }}>{eyebrow}</div>
          <div style={{ marginTop: 4, fontSize: 20, fontWeight: 800 }}>{title}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 42, whiteSpace: "nowrap", textShadow: "0 6px 18px rgba(0,0,0,.82)" }}>
        <strong style={{ fontSize: value.length > 7 ? 82 : 100, lineHeight: 0.95, letterSpacing: -3 }}>{value}</strong>
        <span style={{ color: "#D8D9DE", fontSize: 28, fontWeight: 800 }}>{unit}</span>
      </div>
      <div style={{ height: 22, marginTop: 42, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,.18)", boxShadow: "inset 0 1px 5px rgba(0,0,0,.25)" }}>
        <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${accentColor}AA, ${accentColor})`, boxShadow: `0 0 16px ${accentColor}` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, marginTop: 17, fontSize: 22, fontWeight: 800 }}>
        <span style={{ color: accentColor }}>{currentLabel}</span>
        <span style={{ color: goalColor }}>{goalLabel}</span>
      </div>
    </Interactive.Div>
  );
};

export const MilestoneFollowerProgressEffectDef: EffectDef = {
  id: "MilestoneFollowerProgress",
  name: "里程碑增长·粉丝进度",
  description: "用超大核心数值、当前值与年度目标和横向进度条表达增长里程碑。",
  category: "metric",
  catalogGroup: "数字与指标",
  glyph: "GOAL",
  placement: "left",
  component: MilestoneFollowerProgress as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 570, height: 390 },
  defaultPosition: { x: 72, y: 250, scale: 1 },
  defaultProps: { enabled: true, eyebrow: "MILESTONE", title: "涨粉节点", value: "200,000", unit: "粉丝", currentLabel: "200,000", goalLabel: "⚑ 年底 500,000", progress: 0.4, accentColor: "#20F2E9", goalColor: "#F5C34E", textColor: "#FFFFFF", animationSeconds: 0.8 },
  propsSchema: {
    enabled: { type: "boolean", label: "显示里程碑指标", default: true },
    eyebrow: { type: "text", label: "顶部英文标签" },
    title: { type: "text", label: "中文标题" },
    value: { type: "text", label: "核心数值" },
    unit: { type: "text", label: "数值单位" },
    currentLabel: { type: "text", label: "当前值标签" },
    goalLabel: { type: "text", label: "目标值标签" },
    progress: { type: "number", label: "完成比例", default: 0.4, min: 0, max: 1, step: 0.01 },
    accentColor: { type: "color", label: "当前值颜色", default: "#20F2E9" },
    goalColor: { type: "color", label: "目标值颜色", default: "#F5C34E" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    animationSeconds: { type: "number", label: "入场时长(秒)", default: 0.8, min: 0.2, max: 2, step: 0.05 },
  },
};
