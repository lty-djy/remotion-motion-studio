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
  titlePrefix?: string;
  titleMain?: string;
  titleEmphasis?: string;
  titleSuffix?: string;
  eyebrowFontSize?: number;
  titlePrefixFontSize?: number;
  titleMainFontSize?: number;
  titleEmphasisFontSize?: number;
  titleSuffixFontSize?: number;
  highlightColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitToolListTitle: React.FC<Props> = ({
  enabled = true,
  eyebrow = "很多人问我",
  titlePrefix = "新手，",
  titleMain = "怎么用 Codex 做出",
  titleEmphasis = "这种审美",
  titleSuffix = "的网页？",
  eyebrowFontSize = 22,
  titlePrefixFontSize = 56,
  titleMainFontSize = 56,
  titleEmphasisFontSize = 56,
  titleSuffixFontSize = 56,
  highlightColor = "#F2D51B",
  textColor = "#F5F7FA",
  animationSeconds = 2.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const enterFrames = Math.max(54, Math.round(animationSeconds * fps));

  return (
    <Interactive.Div
      name="工具列表标题"
      data-effect="PortraitToolListTitle"
      style={{
        position: "relative",
        width: 650,
        height: 280,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
        opacity: interpolate(frame, [0, enterFrames * 0.22], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [0, enterFrames * 0.22],
          ["0px 28px", "0px 0px"],
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
          color: highlightColor,
          fontSize: eyebrowFontSize,
          fontWeight: 900,
          letterSpacing: 4.2,
          lineHeight: 1,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          marginTop: 18,
          color: textColor,
          fontFamily: '"Songti SC", "SimSun", serif',
          fontWeight: 900,
          lineHeight: 1.13,
          letterSpacing: -1.8,
          textShadow: "0 8px 26px rgba(0, 0, 0, 0.72)",
        }}
      >
        <div style={{ fontSize: titlePrefixFontSize }}>{titlePrefix}</div>
        <div style={{ fontSize: titleMainFontSize }}>{titleMain}</div>
        <div>
          <span style={{ color: highlightColor, fontSize: titleEmphasisFontSize }}>{titleEmphasis}</span>
          <span style={{ fontSize: titleSuffixFontSize }}>{titleSuffix}</span>
        </div>
      </div>
      <div
        style={{
          width: interpolate(
            frame,
            [enterFrames * 0.12, enterFrames * 0.34],
            [0, 82],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          height: 4,
          marginTop: 17,
          borderRadius: 999,
          backgroundColor: highlightColor,
          boxShadow: `0 0 18px color-mix(in srgb, ${highlightColor} 42%, transparent)`,
        }}
      />
    </Interactive.Div>
  );
};

export const PortraitToolListTitleEffectDef: EffectDef = {
  id: "PortraitToolListTitle",
  name: "工具列表标题",
  description:
    "顶部引导词 + 三行大标题（含强调词）+ 生长下划线，用于工具列表或列举段落的开篇；错峰工具列表已拆分为独立的 PortraitStaggeredToolList 组件。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "题",
  placement: "top",
  component: PortraitToolListTitle as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 120,
  bounds: { x: 0, y: 0, width: 650, height: 280 },
  defaultPosition: { x: 90, y: 250, scale: 1 },
  defaultProps: {
    enabled: true,
    eyebrow: "很多人问我",
    titlePrefix: "新手，",
    titleMain: "怎么用 Codex 做出",
    titleEmphasis: "这种审美",
    titleSuffix: "的网页？",
    eyebrowFontSize: 22,
    titlePrefixFontSize: 56,
    titleMainFontSize: 56,
    titleEmphasisFontSize: 56,
    titleSuffixFontSize: 56,
    highlightColor: "#F2D51B",
    textColor: "#F5F7FA",
    animationSeconds: 2.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示工具列表标题", default: true },
    eyebrow: { type: "text", label: "顶部引导词" },
    titlePrefix: { type: "text", label: "标题第一行" },
    titleMain: { type: "text", label: "标题第二行" },
    titleEmphasis: { type: "text", label: "标题强调词" },
    titleSuffix: { type: "text", label: "标题强调后缀" },
    eyebrowFontSize: { type: "number", label: "顶部引导词字号(px)", default: 22, min: 10, max: 72, step: 1 },
    titlePrefixFontSize: { type: "number", label: "标题第一行字号(px)", default: 56, min: 24, max: 96, step: 1 },
    titleMainFontSize: { type: "number", label: "标题第二行字号(px)", default: 56, min: 24, max: 96, step: 1 },
    titleEmphasisFontSize: { type: "number", label: "标题强调词字号(px)", default: 56, min: 24, max: 96, step: 1 },
    titleSuffixFontSize: { type: "number", label: "标题强调后缀字号(px)", default: 56, min: 24, max: 96, step: 1 },
    highlightColor: { type: "color", label: "标题强调色", default: "#F2D51B" },
    textColor: { type: "color", label: "文字颜色", default: "#F5F7FA" },
    animationSeconds: { type: "number", label: "入场时长(秒)", default: 2.8, min: 0.8, max: 5, step: 0.1 },
  },
};
