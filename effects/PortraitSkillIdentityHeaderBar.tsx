import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  backgroundOpacity?: number;
  sequenceText?: string;
  title?: string;
  subtitle?: string;
  sequenceFontSize?: number;
  titleFontSize?: number;
  subtitleFontSize?: number;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  enterDurationSeconds?: number;
};

export const PortraitSkillIdentityHeaderBar: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  sequenceText = "02",
  title = "GSAP Skills",
  subtitle = "动效引擎 · 高级动画",
  sequenceFontSize = 42,
  titleFontSize = 34,
  subtitleFontSize = 21,
  accentColor = "#42E589",
  panelColor = "#081118",
  textColor = "#F6F7F8",
  enterDurationSeconds = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div name="编号标题条" data-effect="PortraitSkillIdentityHeaderBar" style={{ position: "relative", width: 620, height: 150, display: "flex", alignItems: "center", boxSizing: "border-box", padding: "22px 28px", overflow: "hidden", border: bgFactor > 0 ? `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)` : "1px solid transparent", borderRadius: 22, color: textColor, backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(96 * bgFactor)}%, transparent)`, boxShadow: bgFactor > 0 ? `0 22px 64px rgba(0,0,0,${0.44 * bgFactor})` : "none", fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', pointerEvents: "none", opacity: interpolate(frame, [0, Math.max(1, enterDurationSeconds * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [0, Math.max(1, enterDurationSeconds * fps)], ["-28px 0px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
      <Interactive.Div name="编号" style={{ display: "grid", width: 96, height: 96, flex: "0 0 auto", placeItems: "center", border: `2px solid ${accentColor}`, borderRadius: "50%", color: accentColor, boxShadow: `0 0 28px color-mix(in srgb, ${accentColor} 32%, transparent)`, fontSize: sequenceFontSize, fontWeight: 950 }}>{sequenceText}</Interactive.Div>
      <Interactive.Div name="标题组" style={{ marginLeft: 24 }}><div style={{ fontSize: titleFontSize, fontWeight: 950, lineHeight: 1.05 }}>{title}</div><div style={{ marginTop: 9, color: accentColor, fontSize: subtitleFontSize, fontWeight: 850 }}>{subtitle}</div></Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitSkillIdentityHeaderBarEffectDef: EffectDef = {
  id: "PortraitSkillIdentityHeaderBar",
  name: "编号标题条",
  description: "编号圆圈 + 主标题 + 副标题的横向标题条，用于介绍一个带序号的技能、章节或条目；热度徽标已拆分为独立的 PortraitHeatBadge 组件。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "ID",
  placement: "top",
  component: PortraitSkillIdentityHeaderBar as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 120,
  bounds: { x: 0, y: 0, width: 620, height: 150 },
  defaultPosition: { x: 90, y: 90, scale: 1 },
  defaultProps: {
    enabled: true, sequenceText: "02", title: "GSAP Skills", subtitle: "动效引擎 · 高级动画",
    sequenceFontSize: 42, titleFontSize: 34, subtitleFontSize: 21,
    accentColor: "#42E589", panelColor: "#081118", textColor: "#F6F7F8", enterDurationSeconds: 0.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示编号标题条", default: true },
    sequenceText: { type: "text", label: "编号" }, title: { type: "text", label: "主标题" }, subtitle: { type: "text", label: "副标题" },
    sequenceFontSize: { type: "number", label: "编号字号(px)", default: 42, min: 8, max: 120, step: 1 }, titleFontSize: { type: "number", label: "主标题字号(px)", default: 34, min: 12, max: 120, step: 1 }, subtitleFontSize: { type: "number", label: "副标题字号(px)", default: 21, min: 10, max: 96, step: 1 },
    accentColor: { type: "color", label: "标题条强调色", default: "#42E589" }, panelColor: { type: "color", label: "标题条底色", default: "#081118" }, textColor: { type: "color", label: "标题条文字颜色", default: "#F6F7F8" }, enterDurationSeconds: { type: "number", label: "标题条入场时长(秒)", default: 0.8, min: 0.1, step: 0.1 },
  },
};
