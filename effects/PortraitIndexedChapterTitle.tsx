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
  chapterNumber?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  numberFontSize?: number;
  eyebrowFontSize?: number;
  titleFontSize?: number;
  subtitleFontSize?: number;
  titleOffsetX?: number;
  revealDelaySeconds?: number;
  animationSeconds?: number;
};

export const PortraitIndexedChapterTitle: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  chapterNumber = "01",
  eyebrow = "HEAVY FOOTAGE",
  title = "剪辑痛点",
  subtitle = "拍过 VLOG 的都知道",
  accentColor = "#F4A13B",
  titleColor = "#F7F6F2",
  subtitleColor = "#E8E6E2",
  numberFontSize = 142,
  eyebrowFontSize = 22,
  titleFontSize = 56,
  subtitleFontSize = 29,
  titleOffsetX = 0,
  revealDelaySeconds = 0.65,
  animationSeconds = 2.2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.max(0, revealDelaySeconds * fps);
  const revealFrames = Math.max(18, animationSeconds * fps);
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  if (!enabled) return null;

  return (
    <Interactive.Div
      name="编号章节标题"
      data-effect="PortraitIndexedChapterTitle"
      style={{
        position: "relative",
        width: 760,
        height: 300,
        boxSizing: "border-box",
        padding: "0 18px",
        overflow: "hidden",
        border: bgFactor > 0 ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid transparent",
        borderRadius: 24,
        backgroundColor: `color-mix(in srgb, #0B0D12 ${Math.round(82 * bgFactor)}%, transparent)`,
        boxShadow: bgFactor > 0 ? `0 18px 44px rgba(0, 0, 0, ${0.42 * bgFactor})` : "none",
        backdropFilter: bgFactor > 0 ? "blur(14px)" : undefined,
        color: titleColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <Interactive.Div
        name="章节编号"
        style={{
          position: "absolute",
          top: 36,
          left: 18,
          width: 218,
          overflow: "hidden",
          color: accentColor,
          fontSize: numberFontSize,
          fontWeight: 850,
          lineHeight: 0.9,
          letterSpacing: -5,
          textShadow: "0 4px 18px rgba(0, 0, 0, 0.28)",
          opacity: interpolate(
            frame,
            [startFrame, startFrame + revealFrames * 0.28],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [startFrame, startFrame + revealFrames * 0.28],
            ["-22px 0px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          filter: `blur(${interpolate(
            frame,
            [startFrame, startFrame + revealFrames * 0.22],
            [8, 0],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )}px)`,
        }}
      >
        {chapterNumber}
      </Interactive.Div>

      <Interactive.Div
        name="章节眉题"
        style={{
          position: "absolute",
          top: 44,
          left: 242 + titleOffsetX,
          display: "flex",
          alignItems: "center",
          maxWidth: 510,
          overflow: "hidden",
          color: accentColor,
          fontSize: eyebrowFontSize,
          fontWeight: 760,
          lineHeight: 1,
          letterSpacing: 7,
          whiteSpace: "nowrap",
          textShadow: "0 3px 14px rgba(0, 0, 0, 0.28)",
          opacity: interpolate(
            frame,
            [startFrame + revealFrames * 0.06, startFrame + revealFrames * 0.34],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [startFrame + revealFrames * 0.06, startFrame + revealFrames * 0.34],
            ["18px 0px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          filter: `blur(${interpolate(
            frame,
            [startFrame + revealFrames * 0.06, startFrame + revealFrames * 0.28],
            [7, 0],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )}px)`,
        }}
      >
        <Interactive.Div
          name="眉题强调线"
          style={{
            width: 6,
            height: 25,
            marginRight: 14,
            flex: "0 0 auto",
            backgroundColor: accentColor,
            scale: interpolate(
              frame,
              [startFrame, startFrame + revealFrames * 0.24],
              [0, 1],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
            transformOrigin: "50% 50%",
          }}
        />
        {eyebrow}
      </Interactive.Div>

      <Interactive.Div
        name="章节主标题"
        style={{
          position: "absolute",
          top: 86,
          left: 242 + titleOffsetX,
          maxWidth: 520,
          overflow: "hidden",
          color: titleColor,
          fontSize: titleFontSize,
          fontWeight: 850,
          lineHeight: 1.12,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          textShadow: "0 5px 18px rgba(0, 0, 0, 0.52)",
          opacity: interpolate(
            frame,
            [startFrame + revealFrames * 0.18, startFrame + revealFrames * 0.5],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [startFrame + revealFrames * 0.18, startFrame + revealFrames * 0.5],
            ["24px 0px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          filter: `blur(${interpolate(
            frame,
            [startFrame + revealFrames * 0.18, startFrame + revealFrames * 0.44],
            [9, 0],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )}px)`,
        }}
      >
        {title}
      </Interactive.Div>

      <Interactive.Div
        name="章节副标题"
        style={{
          position: "absolute",
          top: 172,
          left: 242 + titleOffsetX,
          maxWidth: 520,
          overflow: "hidden",
          color: subtitleColor,
          fontSize: subtitleFontSize,
          fontWeight: 520,
          lineHeight: 1.28,
          letterSpacing: 0.5,
          whiteSpace: "nowrap",
          textShadow: "0 4px 16px rgba(0, 0, 0, 0.52)",
          opacity: interpolate(
            frame,
            [startFrame + revealFrames * 0.48, startFrame + revealFrames * 0.82],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [startFrame + revealFrames * 0.48, startFrame + revealFrames * 0.82],
            ["0px 16px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          filter: `blur(${interpolate(
            frame,
            [startFrame + revealFrames * 0.48, startFrame + revealFrames * 0.76],
            [7, 0],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )}px)`,
        }}
      >
        {subtitle}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitIndexedChapterTitleEffectDef: EffectDef = {
  id: "PortraitIndexedChapterTitle",
  name: "编号章节标题",
  description:
    "参考视频复刻的编号章节标题：大号橙色序号、英文眉题、中文主标题与副标题按三拍由虚到实入场。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "01",
  placement: "top",
  component: PortraitIndexedChapterTitle as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 180,
  bounds: { x: 0, y: 0, width: 760, height: 300 },
  defaultPosition: { x: 76, y: 300, scale: 1 },
  defaultProps: {
    enabled: true,
    chapterNumber: "01",
    eyebrow: "HEAVY FOOTAGE",
    title: "剪辑痛点",
    subtitle: "拍过 VLOG 的都知道",
    accentColor: "#F4A13B",
    titleColor: "#F7F6F2",
    subtitleColor: "#E8E6E2",
    numberFontSize: 142,
    eyebrowFontSize: 22,
    titleFontSize: 56,
    subtitleFontSize: 29,
    titleOffsetX: 0,
    revealDelaySeconds: 0.65,
    animationSeconds: 2.2,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示编号章节标题", default: true },
    chapterNumber: { type: "text", label: "章节编号" },
    eyebrow: { type: "text", label: "英文眉题" },
    title: { type: "text", label: "主标题" },
    subtitle: { type: "text", label: "副标题" },
    accentColor: { type: "color", label: "编号与眉题颜色", default: "#F4A13B" },
    titleColor: { type: "color", label: "主标题颜色", default: "#F7F6F2" },
    subtitleColor: { type: "color", label: "副标题颜色", default: "#E8E6E2" },
    numberFontSize: {
      type: "number",
      label: "编号字号(px)",
      default: 142,
      min: 48,
      max: 240,
      step: 1,
    },
    eyebrowFontSize: {
      type: "number",
      label: "眉题字号(px)",
      default: 22,
      min: 10,
      max: 64,
      step: 1,
    },
    titleFontSize: {
      type: "number",
      label: "主标题字号(px)",
      default: 56,
      min: 24,
      max: 120,
      step: 1,
    },
    subtitleFontSize: {
      type: "number",
      label: "副标题字号(px)",
      default: 29,
      min: 14,
      max: 72,
      step: 1,
    },
    titleOffsetX: {
      type: "number",
      label: "标题区水平位置(px)",
      default: 0,
      min: -160,
      max: 300,
      step: 1,
    },
    revealDelaySeconds: {
      type: "number",
      label: "入场等待(秒)",
      default: 0.65,
      min: 0,
      max: 4,
      step: 0.05,
    },
    animationSeconds: {
      type: "number",
      label: "分段入场时长(秒)",
      default: 2.2,
      min: 0.6,
      max: 6,
      step: 0.1,
    },
  },
};
