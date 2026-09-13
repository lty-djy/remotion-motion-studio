import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  text?: string;
  fontSize?: number;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  enterDurationSeconds?: number;
};

export const PortraitPillText: React.FC<Props> = ({
  enabled = true,
  text = "持续更新中 · 新规则滚动迭代",
  fontSize = 14,
  accentColor = "#17D9E8",
  panelColor = "#080C13",
  textColor = "#B3B7BB",
  enterDurationSeconds = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  return (
    <Interactive.Div name="胶囊状态条" data-effect="PortraitPillText" style={{ position: "relative", display: "inline-flex", alignItems: "center", width: "fit-content", minHeight: Math.max(30, Math.round(fontSize * 2.4)), boxSizing: "border-box", padding: `6px ${Math.max(14, Math.round(fontSize * 1.15))}px`, border: `1px solid color-mix(in srgb, ${accentColor} 29%, transparent)`, borderRadius: 999, color: textColor, backgroundColor: `color-mix(in srgb, ${panelColor} 94%, transparent)`, boxShadow: `0 10px 30px rgba(0, 0, 0, 0.28)`, fontSize, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.2, whiteSpace: "nowrap", fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', pointerEvents: "none", opacity: interpolate(frame, [0, Math.max(1, enterDurationSeconds * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [0, Math.max(1, enterDurationSeconds * fps)], ["-12px 0px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
      <span aria-hidden="true" style={{ width: 7, height: 7, marginRight: 9, flex: "0 0 auto", borderRadius: "50%", backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}` }} />
      {text}
    </Interactive.Div>
  );
};

export const PortraitPillTextEffectDef: EffectDef = {
  id: "PortraitPillText",
  name: "胶囊状态条",
  description: "带发光圆点和实心底色的胶囊状态条：用于展示持续更新、新规则迭代、小提示等补充说明文字，底色参考终端教学面板的稳定深色卡片底。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "药",
  placement: "top",
  component: PortraitPillText as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 120,
  bounds: { x: 0, y: 0, width: 300, height: 44 },
  defaultPosition: { x: 90, y: 620, scale: 1 },
  defaultProps: {
    enabled: true, text: "持续更新中 · 新规则滚动迭代", fontSize: 14,
    accentColor: "#17D9E8", panelColor: "#080C13", textColor: "#B3B7BB", enterDurationSeconds: 0.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示胶囊状态条", default: true },
    text: { type: "text", label: "胶囊状态条内容" },
    fontSize: { type: "number", label: "文字字号(px)", default: 14, min: 8, max: 48, step: 1 },
    accentColor: { type: "color", label: "药丸强调色", default: "#17D9E8" },
    panelColor: { type: "color", label: "药丸底色", default: "#080C13" },
    textColor: { type: "color", label: "胶囊状态条颜色", default: "#B3B7BB" },
    enterDurationSeconds: { type: "number", label: "药丸入场时长(秒)", default: 0.8, min: 0.1, step: 0.1 },
  },
};
