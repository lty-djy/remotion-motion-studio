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
  title?: string;
  subtitle?: string;
  accentColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitChapterRail: React.FC<Props> = ({
  backgroundOpacity = 0,
  enabled = true,
  title = "卫浴行业",
  subtitle = "未来 3 年门店趋势",
  accentColor = "#168CFF",
  textColor = "#FFFFFF",
  animationSeconds = 0.7,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(8, Math.round(animationSeconds * fps));

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div
      name="竖屏章节条"
      data-effect="PortraitChapterRail"
      style={{
        position: "relative",
        width: 520,
        height: 116,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        opacity: interpolate(frame, [0, enterFrames], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >

      <Interactive.Div
        name="章节强调线"
        style={{
          position: "absolute",
          top: 5,
          left: 0,
          width: 6,
          height: 82,
          borderRadius: 999,
          backgroundColor: accentColor,
          boxShadow: `0 0 18px ${accentColor}`,
          scale: interpolate(frame, [0, enterFrames], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transformOrigin: "50% 0%",
        }}
      />
      <Interactive.Div
        name="章节标题"
        style={{
          position: "absolute",
          top: 0,
          left: 28,
          maxWidth: 470,
          overflow: "hidden",
          color: accentColor,
          fontSize: 30,
          fontWeight: 850,
          lineHeight: 1.15,
          letterSpacing: 0.5,
          textShadow: "0 4px 12px rgba(0, 0, 0, 0.72)",
          opacity: interpolate(frame, [2, enterFrames], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [2, enterFrames], ["-24px 0px", "0px 0px"], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="章节说明"
        style={{
          position: "absolute",
          top: 46,
          left: 28,
          maxWidth: 475,
          overflow: "hidden",
          color: textColor,
          fontSize: 22,
          fontWeight: 720,
          lineHeight: 1.35,
          letterSpacing: 0.2,
          textShadow: "0 4px 12px rgba(0, 0, 0, 0.9)",
          opacity: interpolate(frame, [enterFrames * 0.25, enterFrames], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [enterFrames * 0.25, enterFrames],
            ["-18px 0px", "0px 0px"],
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
        name="章节尾线"
        style={{
          position: "absolute",
          top: 88,
          left: 28,
          width: interpolate(frame, [enterFrames * 0.45, enterFrames], [0, 142], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 2,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          opacity: 0.72,
        }}
      />
    </Interactive.Div>
  );
};

export const PortraitChapterRailEffectDef: EffectDef = {
  id: "PortraitChapterRail",
  name: "竖屏口播·章节条",
  description: "参考竖屏口播视频提炼的左上章节标签：强调竖线、蓝色标题和白色说明分层滑入。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "CH",
  placement: "top",
  component: PortraitChapterRail as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 180,
  bounds: { x: 0, y: 0, width: 520, height: 116 },
  defaultPosition: { x: 68, y: 86, scale: 1 },
  defaultProps: {
    enabled: true,
    title: "卫浴行业",
    subtitle: "未来 3 年门店趋势",
    accentColor: "#168CFF",
    textColor: "#FFFFFF",
    animationSeconds: 0.7,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示章节条", default: true },
    title: { type: "text", label: "章节标题" },
    subtitle: { type: "text", label: "章节说明" },
    accentColor: { type: "color", label: "强调色", default: "#168CFF" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    animationSeconds: {
      type: "number",
      label: "入场时长(秒)",
      default: 0.7,
      min: 0.3,
      max: 2,
      step: 0.1,
    },
  },
};
