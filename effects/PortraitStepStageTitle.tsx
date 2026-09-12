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
  accentColor?: string;
  textColor?: string;
  eyebrowFontSize?: number;
  titleFontSize?: number;
  subtitleFontSize?: number;
  animationSeconds?: number;
};

export const PortraitStepStageTitle: React.FC<Props> = ({
  enabled = true,
  eyebrow = "成片之后",
  title = "再做高清增强",
  subtitle = "完成片，再高清放大",
  accentColor = "#168CFF",
  textColor = "#FFFFFF",
  eyebrowFontSize = 20,
  titleFontSize = 42,
  subtitleFontSize = 18,
  animationSeconds = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(14, Math.round(animationSeconds * fps));

  if (!enabled) return null;

  return (
    <Interactive.Div
      name="步骤阶段标题"
      data-effect="PortraitStepStageTitle"
      style={{
        position: "relative",
        width: 470,
        height: 118,
        textAlign: "left",
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
        textShadow: "0 5px 17px rgba(0, 0, 0, 0.86)",
        opacity: interpolate(frame, [0, enterFrames * 0.56], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [0, enterFrames * 0.56],
          ["34px 0px", "0px 0px"],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: accentColor,
          fontSize: eyebrowFontSize,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: 0.8,
        }}
      >
        <span
          style={{
            display: "block",
            width: 42,
            height: 4,
            borderRadius: 999,
            backgroundColor: accentColor,
            boxShadow: `0 0 15px color-mix(in srgb, ${accentColor} 62%, transparent)`,
          }}
        />
        {eyebrow}
      </div>
      <div
        style={{
          marginTop: 10,
          overflow: "hidden",
          color: textColor,
          fontSize: titleFontSize,
          fontWeight: 950,
          lineHeight: 1.08,
          letterSpacing: -1.6,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 9,
          overflow: "hidden",
          color: "rgba(255, 255, 255, 0.72)",
          fontSize: subtitleFontSize,
          fontWeight: 700,
          lineHeight: 1.2,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {subtitle}
      </div>
    </Interactive.Div>
  );
};

export const PortraitStepStageTitleEffectDef: EffectDef = {
  id: "PortraitStepStageTitle",
  name: "步骤阶段标题",
  description:
    "阶段引导词 + 阶段标题 + 阶段说明的组合标题块，用于步骤清单或流程段落开头的结论提示；编号步骤清单已拆分为独立的 PortraitStepNumberList 组件。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "阶",
  placement: "top",
  component: PortraitStepStageTitle as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 120,
  bounds: { x: 0, y: 0, width: 470, height: 118 },
  defaultPosition: { x: 545, y: 252, scale: 1 },
  defaultProps: {
    enabled: true,
    eyebrow: "成片之后",
    title: "再做高清增强",
    subtitle: "完成片，再高清放大",
    accentColor: "#168CFF",
    textColor: "#FFFFFF",
    eyebrowFontSize: 20,
    titleFontSize: 42,
    subtitleFontSize: 18,
    animationSeconds: 1,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示步骤阶段标题", default: true },
    eyebrow: { type: "text", label: "阶段引导词" },
    title: { type: "text", label: "阶段标题" },
    subtitle: { type: "text", label: "阶段说明" },
    accentColor: { type: "color", label: "引导词颜色", default: "#168CFF" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    eyebrowFontSize: { type: "number", label: "引导词字号(px)", default: 20, min: 10, max: 64, step: 1 },
    titleFontSize: { type: "number", label: "标题字号(px)", default: 42, min: 16, max: 96, step: 1 },
    subtitleFontSize: { type: "number", label: "说明字号(px)", default: 18, min: 10, max: 64, step: 1 },
    animationSeconds: { type: "number", label: "入场时长(秒)", default: 1, min: 0.4, max: 2, step: 0.1 },
  },
};
