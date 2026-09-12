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
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  eyebrowFontSize?: number;
  titleFontSize?: number;
  subtitleFontSize?: number;
  accentColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitNextEpisodeTitle: React.FC<Props> = ({
  enabled = true,
  eyebrow = "下期",
  title = "Codex",
  subtitle = "自动剪辑",
  eyebrowFontSize = 25,
  titleFontSize = 58,
  subtitleFontSize = 32,
  accentColor = "#168CFF",
  textColor = "#FFFFFF",
  animationSeconds = 0.9,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(14, Math.round(animationSeconds * fps));

  if (!enabled) {
    return null;
  }

  return (
    <Interactive.Div
      name="下集预告标题"
      data-effect="PortraitNextEpisodeTitle"
      style={{
        position: "relative",
        width: 390,
        height: 170,
        padding: "4px 0 5px 24px",
        boxSizing: "border-box",
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
        opacity: interpolate(frame, [0, enterFrames * 0.68], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [0, enterFrames * 0.68],
          ["38px 0px", "0px 0px"],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
        textShadow: "0 6px 18px rgba(0, 0, 0, 0.92)",
      }}
    >
      <Interactive.Div
        name="预告竖线"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 6,
          height: interpolate(
            frame,
            [0, enterFrames * 0.52],
            [0, 164],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          borderRadius: 999,
          backgroundColor: accentColor,
          boxShadow: `0 0 18px color-mix(in srgb, ${accentColor} 68%, transparent)`,
        }}
      />

      <div
        style={{
          overflow: "hidden",
          color: textColor,
          fontSize: eyebrowFontSize,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: 0.4,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          marginTop: 5,
          overflow: "hidden",
          color: accentColor,
          fontSize: titleFontSize,
          fontWeight: 950,
          lineHeight: 0.98,
          letterSpacing: -2.2,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 5,
          overflow: "hidden",
          color: textColor,
          fontSize: subtitleFontSize,
          fontWeight: 950,
          lineHeight: 1,
          letterSpacing: -0.8,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {subtitle}
      </div>
    </Interactive.Div>
  );
};

export const PortraitNextEpisodeTitleEffectDef: EffectDef = {
  id: "PortraitNextEpisodeTitle",
  name: "下集预告标题",
  description:
    "竖屏口播结尾的下集预告标题：发光竖线搭配预告引导语、醒目关键词与下集主题，可与「图标文字」自由组合。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "NEXT",
  placement: "right",
  component: PortraitNextEpisodeTitle as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 390, height: 170 },
  defaultPosition: { x: 89, y: 261, scale: 1.52 },
  defaultProps: {
    enabled: true,
    eyebrow: "下期",
    title: "Codex",
    subtitle: "自动剪辑",
    eyebrowFontSize: 25,
    titleFontSize: 58,
    subtitleFontSize: 32,
    accentColor: "#168CFF",
    textColor: "#FFFFFF",
    animationSeconds: 0.9,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示预告标题", default: true },
    eyebrow: { type: "text", label: "预告引导语" },
    title: { type: "text", label: "核心关键词" },
    subtitle: { type: "text", label: "下集主题" },
    eyebrowFontSize: { type: "number", label: "引导语字号(px)", default: 25, min: 10, max: 96, step: 1 },
    titleFontSize: { type: "number", label: "关键词字号(px)", default: 58, min: 12, max: 140, step: 1 },
    subtitleFontSize: { type: "number", label: "主题字号(px)", default: 32, min: 10, max: 120, step: 1 },
    accentColor: { type: "color", label: "主题色", default: "#168CFF" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    animationSeconds: {
      type: "number",
      label: "入场时长(秒)",
      default: 0.9,
      min: 0.4,
      max: 2,
      step: 0.05,
    },
  },
};
