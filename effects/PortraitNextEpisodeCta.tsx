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
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  cta?: string;
  icon?: string;
  accentColor?: string;
  secondaryColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitNextEpisodeCta: React.FC<Props> = ({
  backgroundOpacity = 0,
  enabled = true,
  eyebrow = "下期",
  title = "Codex",
  subtitle = "自动剪辑",
  cta = "点个关注",
  icon = "✦",
  accentColor = "#168CFF",
  secondaryColor = "#14E6A1",
  panelColor = "#111318",
  textColor = "#FFFFFF",
  animationSeconds = 0.9,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(14, Math.round(animationSeconds * fps));

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div
      name="竖屏下集预告卡"
      data-effect="PortraitNextEpisodeCta"
      style={{
        position: "relative",
        width: 390,
        height: 270,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
      }}
    >

      <Interactive.Div
        name="下集预告标题"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 370,
          minHeight: 170,
          padding: "4px 0 5px 24px",
          boxSizing: "border-box",
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
            fontSize: 25,
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
            fontSize: 58,
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
            fontSize: 32,
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

      <Interactive.Div
        name="关注按钮"
        data-cta-button="true"
        style={{
          position: "absolute",
          top: 185,
          left: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          width: 280,
          height: 64,
          boxSizing: "border-box",
          overflow: "hidden",
          border: bgFactor > 0 ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid transparent",
          borderRadius: 15,
          color: textColor,
          backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(90 * bgFactor)}%, transparent)`,
          boxShadow: bgFactor > 0 ? "0 15px 28px rgba(0, 0, 0, 0.42)" : "none",
          backdropFilter: bgFactor > 0 ? "blur(14px)" : undefined,
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
    </Interactive.Div>
  );
};

export const PortraitNextEpisodeCtaEffectDef: EffectDef = {
  id: "PortraitNextEpisodeCta",
  name: "竖屏口播·下集预告卡",
  description: "参考竖屏口播结尾：右上展示下期主题、醒目关键词和关注按钮，适合预告下一集与引导关注。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "NEXT",
  placement: "right",
  component: PortraitNextEpisodeCta as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 390, height: 270 },
  defaultPosition: { x: 640, y: 285, scale: 1 },
  defaultProps: {
    enabled: true,
    eyebrow: "下期",
    title: "Codex",
    subtitle: "自动剪辑",
    cta: "点个关注",
    icon: "✦",
    accentColor: "#168CFF",
    secondaryColor: "#14E6A1",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    animationSeconds: 0.9,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示下集预告", default: true },
    eyebrow: { type: "text", label: "预告引导语" },
    title: { type: "text", label: "核心关键词" },
    subtitle: { type: "text", label: "下集主题" },
    cta: { type: "text", label: "行动按钮" },
    icon: { type: "text", label: "按钮图标" },
    accentColor: { type: "color", label: "主题色", default: "#168CFF" },
    secondaryColor: { type: "color", label: "按钮强调色", default: "#14E6A1" },
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
