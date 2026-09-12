import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  badgeText?: string;
  fontSize?: number;
  accentColor?: string;
  enterDurationSeconds?: number;
};

export const PortraitHeatBadge: React.FC<Props> = ({
  enabled = true,
  badgeText = "★ 26K",
  fontSize = 20,
  accentColor = "#42E589",
  enterDurationSeconds = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  return (
    <Interactive.Div name="热度徽标" data-effect="PortraitHeatBadge" style={{ position: "relative", display: "inline-flex", alignItems: "center", width: "fit-content", boxSizing: "border-box", padding: `${Math.round(fontSize * 0.55)}px ${Math.round(fontSize * 1.1)}px`, border: `1px solid color-mix(in srgb, ${accentColor} 48%, transparent)`, borderRadius: 999, color: accentColor, backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`, fontSize, fontWeight: 950, lineHeight: 1.2, whiteSpace: "nowrap", fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', pointerEvents: "none", opacity: interpolate(frame, [0, Math.max(1, enterDurationSeconds * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [0, Math.max(1, enterDurationSeconds * fps)], ["28px 0px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
      {badgeText}
    </Interactive.Div>
  );
};

export const PortraitHeatBadgeEffectDef: EffectDef = {
  id: "PortraitHeatBadge",
  name: "热度徽标",
  description: "胶囊形热度/数据徽标：展示 star 数、点赞数、人气或评分等热度信息，常与编号标题条搭配出现在标题右侧。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "★",
  placement: "top",
  component: PortraitHeatBadge as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 120,
  bounds: { x: 0, y: 0, width: 200, height: 60 },
  defaultPosition: { x: 790, y: 135, scale: 1 },
  defaultProps: {
    enabled: true, badgeText: "★ 26K", fontSize: 20,
    accentColor: "#42E589", enterDurationSeconds: 0.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示热度徽标", default: true },
    badgeText: { type: "text", label: "徽标文字" },
    fontSize: { type: "number", label: "徽标字号(px)", default: 20, min: 8, max: 96, step: 1 },
    accentColor: { type: "color", label: "徽标强调色", default: "#42E589" },
    enterDurationSeconds: { type: "number", label: "徽标入场时长(秒)", default: 0.8, min: 0.1, step: 0.1 },
  },
};
