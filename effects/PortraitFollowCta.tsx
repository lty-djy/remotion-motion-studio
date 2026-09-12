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
  cta?: string;
  icon?: string;
  backgroundOpacity?: number;
  secondaryColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitFollowCta: React.FC<Props> = ({
  enabled = true,
  cta = "点个关注",
  icon = "✦",
  backgroundOpacity = 0,
  secondaryColor = "#14E6A1",
  panelColor = "#111318",
  textColor = "#FFFFFF",
  animationSeconds = 0.9,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(14, Math.round(animationSeconds * fps));

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  if (!enabled) {
    return null;
  }

  return (
    <Interactive.Div
      name="图标文字"
      data-effect="PortraitFollowCta"
      data-cta-button="true"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        width: 280,
        height: 64,
        boxSizing: "border-box",
        overflow: "hidden",
        border:
          bgFactor > 0
            ? "1px solid rgba(255, 255, 255, 0.12)"
            : "1px solid transparent",
        borderRadius: 15,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(90 * bgFactor)}%, transparent)`,
        boxShadow: bgFactor > 0 ? "0 15px 28px rgba(0, 0, 0, 0.42)" : "none",
        backdropFilter: bgFactor > 0 ? "blur(14px)" : undefined,
        pointerEvents: "none",
        opacity: interpolate(
          frame,
          [enterFrames * 0.42, enterFrames * 1.12],
          [0, 1],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
        translate: interpolate(
          frame,
          [enterFrames * 0.42, enterFrames * 1.12],
          ["32px 0px", "0px 0px"],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
        scale: interpolate(
          frame,
          [enterFrames * 0.42, enterFrames, enterFrames * 1.12],
          [0.86, 1.04, 1],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
        transformOrigin: "0% 50%",
      }}
    >
      <span
        style={{
          color: secondaryColor,
          filter: `drop-shadow(0 0 8px color-mix(in srgb, ${secondaryColor} 72%, transparent))`,
          fontSize: 30,
          fontWeight: 950,
          lineHeight: 1,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          overflow: "hidden",
          fontSize: 27,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: 0.2,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {cta}
      </span>
    </Interactive.Div>
  );
};

export const PortraitFollowCtaEffectDef: EffectDef = {
  id: "PortraitFollowCta",
  name: "图标文字",
  description:
    "竖屏口播结尾的图标文字：强调色发光图标搭配行动文案，可与「下集预告标题」自由组合，也可单独用于点赞、收藏等引导。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "FOLLOW",
  placement: "right",
  component: PortraitFollowCta as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 280, height: 64 },
  defaultPosition: { x: 6, y: 492, scale: 1.69 },
  defaultProps: {
    enabled: true,
    cta: "点个关注",
    icon: "✦",
    backgroundOpacity: 0,
    secondaryColor: "#14E6A1",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    animationSeconds: 0.9,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示关注按钮", default: true },
    cta: { type: "text", label: "行动按钮" },
    icon: { type: "text", label: "按钮图标" },
    backgroundOpacity: {
      type: "number",
      label: "背景不透明度",
      default: 0,
      min: 0,
      max: 1,
      step: 0.05,
    },
    secondaryColor: { type: "color", label: "图标强调色", default: "#14E6A1" },
    panelColor: { type: "color", label: "按钮底色", default: "#111318" },
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
