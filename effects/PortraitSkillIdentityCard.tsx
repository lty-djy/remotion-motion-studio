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
  backgroundOpacity?: number;
  sequenceText?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  updateText?: string;
  sequenceFontSize?: number;
  titleFontSize?: number;
  subtitleFontSize?: number;
  badgeFontSize?: number;
  updateFontSize?: number;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitSkillIdentityCard: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  sequenceText = "01",
  title = "我自己做的 Skill",
  subtitle = "UI 审美 · 全流程规范",
  badge = "C 位",
  updateText = "持续更新中 · 新规则滚动迭代",
  sequenceFontSize = 24,
  titleFontSize = 34,
  subtitleFontSize = 18,
  badgeFontSize = 14,
  updateFontSize = 14,
  accentColor = "#17D9E8",
  panelColor = "#071017",
  textColor = "#F5F7FA",
  animationSeconds = 3.7,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const totalFrames = Math.max(75, Math.round(animationSeconds * fps));
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div
      name="Skill 身份卡"
      data-effect="PortraitSkillIdentityCard"
      style={{
        position: "relative",
        width: 900,
        height: 260,
        overflow: "hidden",
        boxSizing: "border-box",
        border:
          bgFactor > 0
            ? `1px solid color-mix(in srgb, ${accentColor} 18%, transparent)`
            : "1px solid transparent",
        borderRadius: 28,
        color: textColor,
        backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(94 * bgFactor)}%, transparent)`,
        boxShadow:
          bgFactor > 0
            ? `0 24px 70px rgba(0, 0, 0, 0.42), inset 0 0 50px color-mix(in srgb, ${accentColor} 5%, transparent)`
            : "none",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
        opacity: interpolate(frame, [0, totalFrames * 0.16], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [0, totalFrames * 0.18],
          ["-26px 0px", "0px 0px"],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 50,
          left: 36,
          width: 132,
          height: 132,
          borderRadius: "50%",
          background: `radial-gradient(circle, color-mix(in srgb, ${accentColor} 20%, transparent) 0%, transparent 66%)`,
          filter: "blur(8px)",
          opacity: interpolate(frame, [0, totalFrames * 0.3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      <Interactive.Div
        name="Skill 编号"
        data-skill-sequence={sequenceText}
        style={{
          position: "absolute",
          top: 67,
          left: 54,
          display: "grid",
          width: 82,
          height: 82,
          placeItems: "center",
          border: `2px solid color-mix(in srgb, ${accentColor} 76%, transparent)`,
          borderRadius: "50%",
          color: accentColor,
          backgroundColor: `color-mix(in srgb, ${accentColor} 9%, rgba(4, 16, 23, 0.9))`,
          boxShadow: `0 0 28px color-mix(in srgb, ${accentColor} 27%, transparent), inset 0 0 20px color-mix(in srgb, ${accentColor} 10%, transparent)`,
          fontFamily: '"SFMono-Regular", Consolas, monospace',
          fontSize: sequenceFontSize,
          fontWeight: 850,
          lineHeight: 1,
          scale: interpolate(
            frame,
            [0, totalFrames * 0.12, totalFrames * 0.24],
            [0.72, 1.08, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              output: "perceptual-scale",
            },
          ),
        }}
      >
        {sequenceText}
      </Interactive.Div>

      <Interactive.Div
        name="Skill 主标题"
        style={{
          position: "absolute",
          top: 64,
          left: 168,
          maxWidth: 540,
          color: textColor,
          fontSize: titleFontSize,
          fontWeight: 900,
          lineHeight: 1.14,
          letterSpacing: -0.7,
          textShadow: "0 6px 24px rgba(0, 0, 0, 0.72)",
          opacity: interpolate(
            frame,
            [totalFrames * 0.08, totalFrames * 0.27],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [totalFrames * 0.08, totalFrames * 0.27],
            ["0px 13px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {title}
      </Interactive.Div>

      <Interactive.Div
        name="Skill 副标题"
        style={{
          position: "absolute",
          top: 116,
          left: 168,
          color: accentColor,
          fontSize: subtitleFontSize,
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: 0.3,
          opacity: interpolate(
            frame,
            [totalFrames * 0.16, totalFrames * 0.35],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {subtitle}
      </Interactive.Div>

      <Interactive.Div
        name="Skill 徽标"
        style={{
          position: "absolute",
          top: 82,
          right: 58,
          display: "grid",
          minWidth: 68,
          minHeight: 34,
          height: Math.max(34, Math.round(badgeFontSize * 1.6)),
          padding: `0 ${Math.max(13, Math.round(badgeFontSize * 0.45))}px`,
          placeItems: "center",
          boxSizing: "border-box",
          border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
          borderRadius: 999,
          color: accentColor,
          backgroundColor: `color-mix(in srgb, ${accentColor} 11%, rgba(4, 16, 23, 0.84))`,
          fontSize: badgeFontSize,
          fontWeight: 850,
          lineHeight: 1,
          opacity: interpolate(
            frame,
            [totalFrames * 0.22, totalFrames * 0.4],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          scale: interpolate(
            frame,
            [totalFrames * 0.22, totalFrames * 0.4],
            [0.86, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              output: "perceptual-scale",
            },
          ),
        }}
      >
        {badge}
      </Interactive.Div>

      <Interactive.Div
        name="持续更新说明"
        style={{
          position: "absolute",
          top: 163,
          left: 168,
          display: "flex",
          alignItems: "center",
          minHeight: 34,
          padding: "0 16px",
          border: `1px solid color-mix(in srgb, ${accentColor} 29%, transparent)`,
          borderRadius: 17,
          color: "rgba(245, 247, 250, 0.66)",
          backgroundColor: `color-mix(in srgb, ${accentColor} 7%, rgba(4, 16, 23, 0.76))`,
          fontSize: updateFontSize,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: 0.2,
          opacity: interpolate(
            frame,
            [totalFrames * 0.3, totalFrames * 0.52],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [totalFrames * 0.3, totalFrames * 0.52],
            ["-12px 0px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            marginRight: 9,
            borderRadius: "50%",
            backgroundColor: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
        {updateText}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitSkillIdentityCardEffectDef: EffectDef = {
  id: "PortraitSkillIdentityCard",
  name: "竖屏口播·Skill 身份卡",
  description:
    "复刻参考视频 26.966–30.650 秒：用自动编号、身份标题、C 位徽标和持续更新胶囊介绍第一个 Skill。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "01",
  placement: "top",
  component:
    PortraitSkillIdentityCard as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 111,
  bounds: { x: 0, y: 0, width: 900, height: 260 },
  defaultPosition: { x: 90, y: 150, scale: 1 },
  defaultProps: {
    enabled: true,
    sequenceText: "01",
    title: "我自己做的 Skill",
    subtitle: "UI 审美 · 全流程规范",
    badge: "C 位",
    updateText: "持续更新中 · 新规则滚动迭代",
    sequenceFontSize: 24,
    titleFontSize: 34,
    subtitleFontSize: 18,
    badgeFontSize: 14,
    updateFontSize: 14,
    accentColor: "#17D9E8",
    panelColor: "#071017",
    textColor: "#F5F7FA",
    animationSeconds: 3.7,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示 Skill 身份卡", default: true },
    sequenceText: { type: "text", label: "Skill 编号" },
    title: { type: "text", label: "Skill 主标题" },
    subtitle: { type: "text", label: "Skill 副标题" },
    badge: { type: "text", label: "Skill 徽标" },
    updateText: { type: "text", label: "持续更新说明" },
    sequenceFontSize: { type: "number", label: "Skill 编号字号(px)", default: 24, min: 10, max: 56, step: 1 },
    titleFontSize: { type: "number", label: "Skill 主标题字号(px)", default: 34, min: 16, max: 72, step: 1 },
    subtitleFontSize: { type: "number", label: "Skill 副标题字号(px)", default: 18, min: 10, max: 46, step: 1 },
    badgeFontSize: { type: "number", label: "Skill 徽标字号(px)", default: 14, min: 8, max: 96, step: 1 },
    updateFontSize: { type: "number", label: "持续更新说明字号(px)", default: 14, min: 8, max: 36, step: 1 },
    accentColor: { type: "color", label: "身份卡强调色", default: "#17D9E8" },
    panelColor: { type: "color", label: "身份卡底板颜色", default: "#071017" },
    textColor: { type: "color", label: "身份卡文字颜色", default: "#F5F7FA" },
    animationSeconds: { type: "number", label: "完整入场时长(秒)", default: 3.7, min: 2.4, max: 6, step: 0.1 },
  },
};
