import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  titlePrefix?: string;
  titleEmphasis?: string;
  badgeFontSize?: number;
  titlePrefixFontSize?: number;
  titleEmphasisFontSize?: number;
  badgeColor?: string;
  titleColor?: string;
  emphasisColor?: string;
  panelColor?: string;
  badgeEnterSeconds?: number;
  titleEnterSeconds?: number;
  animationSeconds?: number;
};

export const PortraitGapHeadline: React.FC<Props> = ({
  enabled = true,
  showBadge = true,
  badgeText = "最后说一句",
  titlePrefix = "差距不在",
  titleEmphasis = "模型",
  badgeFontSize = 18,
  titlePrefixFontSize = 64,
  titleEmphasisFontSize = 64,
  badgeColor = "#1FD9E8",
  titleColor = "#F7F5F2",
  emphasisColor = "#8A849D",
  panelColor = "#071017",
  badgeEnterSeconds = 0.4,
  titleEnterSeconds = 0.75,
  animationSeconds = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;
  return (
    <Interactive.Div name="差距不在模型结论标题" data-effect="PortraitGapHeadline" style={{ position: "relative", width: 700, height: 260, boxSizing: "border-box", padding: "30px 30px 24px", overflow: "hidden", borderRadius: 24, color: titleColor, backgroundColor: `color-mix(in srgb, ${panelColor} 42%, transparent)`, fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', opacity: interpolate(frame, [0, fps * 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
      {showBadge ? <Interactive.Div name="最后说一句徽标" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 20px", border: `1px solid color-mix(in srgb, ${badgeColor} 48%, transparent)`, borderRadius: 999, color: badgeColor, backgroundColor: `color-mix(in srgb, ${badgeColor} 8%, rgba(4,13,17,.78))`, boxShadow: `0 0 24px color-mix(in srgb, ${badgeColor} 12%, transparent)`, fontSize: badgeFontSize, fontWeight: 850, letterSpacing: 0.4, opacity: interpolate(frame, [0, fps * Math.max(0.1, badgeEnterSeconds)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [0, fps * Math.max(0.1, badgeEnterSeconds)], ["-18px 0px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}><span style={{ marginRight: 9, fontSize: 13 }}>●</span>{badgeText}</Interactive.Div> : null}
      <Interactive.Div name="差距不在模型大标题" style={{ marginTop: 22, display: "flex", alignItems: "baseline", whiteSpace: "nowrap", fontFamily: '"Songti SC", "SimSun", serif', fontWeight: 950, lineHeight: 1.04, letterSpacing: -2.4, opacity: interpolate(frame, [fps * 0.14, fps * Math.max(0.25, titleEnterSeconds)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [fps * 0.14, fps * Math.max(0.25, titleEnterSeconds)], ["0px 30px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
        <span style={{ color: titleColor, fontSize: titlePrefixFontSize }}>{titlePrefix}</span>
        <span style={{ marginLeft: 6, color: emphasisColor, fontSize: titleEmphasisFontSize, textShadow: `0 0 26px color-mix(in srgb, ${emphasisColor} 18%, transparent)` }}>{titleEmphasis}</span>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitGapHeadlineEffectDef: EffectDef = {
  id: "PortraitGapHeadline",
  name: "差距不在模型标题",
  description: "三段拆分中的第 1 个组件：最后说一句徽标与“差距不在模型”大标题。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "GAP",
  placement: "top",
  component: PortraitGapHeadline as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 120,
  bounds: { x: 0, y: 0, width: 700, height: 260 },
  defaultPosition: { x: 80, y: 300, scale: 1 },
  defaultProps: { enabled: true, showBadge: true, badgeText: "最后说一句", titlePrefix: "差距不在", titleEmphasis: "模型", badgeFontSize: 18, titlePrefixFontSize: 64, titleEmphasisFontSize: 64, badgeColor: "#1FD9E8", titleColor: "#F7F5F2", emphasisColor: "#8A849D", panelColor: "#071017", badgeEnterSeconds: 0.4, titleEnterSeconds: 0.75, animationSeconds: 4 },
  propsSchema: {
    enabled: { type: "boolean", label: "显示差距标题", default: true }, showBadge: { type: "boolean", label: "显示最后说一句徽标", default: true }, badgeText: { type: "text", label: "徽标文字" }, titlePrefix: { type: "text", label: "主标题前半句" }, titleEmphasis: { type: "text", label: "主标题强调词" },
    badgeFontSize: { type: "number", label: "徽标字号(px)", default: 18, min: 8, max: 96, step: 1 }, titlePrefixFontSize: { type: "number", label: "主标题前半句字号(px)", default: 64, min: 16, max: 160, step: 1 }, titleEmphasisFontSize: { type: "number", label: "主标题强调词字号(px)", default: 64, min: 16, max: 160, step: 1 },
    badgeColor: { type: "color", label: "徽标颜色", default: "#1FD9E8" }, titleColor: { type: "color", label: "主标题颜色", default: "#F7F5F2" }, emphasisColor: { type: "color", label: "强调词颜色", default: "#8A849D" }, panelColor: { type: "color", label: "底板颜色", default: "#071017" },
    badgeEnterSeconds: { type: "number", label: "徽标入场时间(秒)", default: 0.4, min: 0.1, step: 0.1 }, titleEnterSeconds: { type: "number", label: "主标题入场时间(秒)", default: 0.75, min: 0.1, step: 0.1 }, animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 4, min: 1, max: 120, step: 0.1 },
  },
};
