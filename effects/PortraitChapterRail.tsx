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
  index?: string;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  textColor?: string;
  cardWidth?: number;
  indexFontSize?: number;
  titleFontSize?: number;
  subtitleFontSize?: number;
  animationSeconds?: number;
};

export const PortraitChapterRail: React.FC<Props> = ({
  backgroundOpacity = 0,
  enabled = true,
  index = "01",
  title = "卫浴行业",
  subtitle = "未来 3 年门店趋势",
  accentColor = "#168CFF",
  textColor = "#FFFFFF",
  cardWidth = 520,
  indexFontSize = 21,
  titleFontSize = 46,
  subtitleFontSize = 22,
  animationSeconds = 0.7,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(8, Math.round(animationSeconds * fps));

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  // 内容区可用宽度 = 卡片宽 - 左侧竖线留白(28) - 内容缩进(20) - 右侧内边距(24)。
  const contentMaxWidth = Math.max(120, cardWidth - 72);

  const barScaleY = interpolate(frame, [0, enterFrames * 0.6], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const indexOpacity = interpolate(
    frame,
    [enterFrames * 0.05, enterFrames * 0.5],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const indexTranslate = interpolate(
    frame,
    [enterFrames * 0.05, enterFrames * 0.5],
    [-16, 0],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const titleRise = interpolate(
    frame,
    [enterFrames * 0.12, enterFrames * 0.7],
    ["108%", "0%"],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const subtitleOpacity = interpolate(
    frame,
    [enterFrames * 0.35, enterFrames * 0.85],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const subtitleRise = interpolate(
    frame,
    [enterFrames * 0.35, enterFrames * 0.85],
    ["14px", "0px"],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <Interactive.Div
      name="竖屏章节条"
      data-effect="PortraitChapterRail"
      style={{
        position: "relative",
        width: cardWidth,
        minHeight: 150,
        boxSizing: "border-box",
        padding: "20px 24px 20px 28px",
        borderRadius: 20,
        border:
          bgFactor > 0 ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid transparent",
        backgroundColor:
          bgFactor > 0
            ? `color-mix(in srgb, #14161f ${Math.round(86 * bgFactor)}%, transparent)`
            : "transparent",
        boxShadow: bgFactor > 0 ? "0 16px 32px rgba(0, 0, 0, 0.36)" : "none",
        backdropFilter: bgFactor > 0 ? "blur(14px)" : undefined,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        opacity: interpolate(frame, [0, enterFrames * 0.3], [0, 1], {
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
          top: 24,
          left: 0,
          width: 4,
          height: 102,
          borderRadius: 999,
          background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor} 46%, transparent 100%)`,
          boxShadow: `0 0 14px ${accentColor}`,
          scale: `1 ${barScaleY}`,
          transformOrigin: "50% 0%",
        }}
      />

      <Interactive.Div
        name="章节编号"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginLeft: 20,
          color: accentColor,
          fontSize: indexFontSize,
          fontWeight: 850,
          lineHeight: 1.15,
          letterSpacing: 2,
          fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
          opacity: indexOpacity,
          translate: `${indexTranslate}px 0px`,
        }}
      >
        {index}
        <Interactive.Div
          name="章节编号线"
          style={{
            width: 22,
            height: 2,
            borderRadius: 999,
            backgroundColor: accentColor,
            opacity: 0.65,
          }}
        />
      </Interactive.Div>

      <Interactive.Div
        name="章节标题遮罩"
        style={{
          position: "relative",
          marginTop: 8,
          marginLeft: 20,
          maxWidth: contentMaxWidth,
          overflow: "hidden",
        }}
      >
        <Interactive.Div
          name="章节标题"
          style={{
            color: textColor,
            fontSize: titleFontSize,
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: -0.5,
            textShadow: "0 6px 18px rgba(0, 0, 0, 0.78)",
            translate: `0px ${titleRise}`,
          }}
        >
          {title}
        </Interactive.Div>
      </Interactive.Div>

      <Interactive.Div
        name="章节说明"
        style={{
          marginTop: 7,
          marginLeft: 20,
          maxWidth: contentMaxWidth,
          overflow: "hidden",
          color: textColor,
          fontSize: subtitleFontSize,
          fontWeight: 640,
          lineHeight: 1.35,
          letterSpacing: 0.3,
          textShadow: "0 4px 12px rgba(0, 0, 0, 0.85)",
          opacity: subtitleOpacity < 0.74 ? subtitleOpacity : 0.74,
          translate: `0px ${subtitleRise}`,
        }}
      >
        {subtitle}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitChapterRailEffectDef: EffectDef = {
  id: "PortraitChapterRail",
  name: "竖屏口播·章节条",
  description:
    "左上章节标签：强调竖线先立起，章节编号随后滑入，主标题以遮罩上升揭示，说明文字最后轻浮上来。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "CH",
  placement: "top",
  component: PortraitChapterRail as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 180,
  bounds: { x: 0, y: 0, width: 520, height: 150 },
  defaultPosition: { x: 68, y: 86, scale: 1 },
  defaultProps: {
    enabled: true,
    cardWidth: 520,
    index: "01",
    title: "卫浴行业",
    subtitle: "未来 3 年门店趋势",
    accentColor: "#168CFF",
    textColor: "#FFFFFF",
    indexFontSize: 21,
    titleFontSize: 46,
    subtitleFontSize: 22,
    animationSeconds: 0.7,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示章节条", default: true },
    // 走 FontSizeStepper 步进控件（local-main-v2 中按组件+字段名匹配），可直接输入或加减调节。
    cardWidth: { type: "number", label: "卡片宽度(px)", default: 520, min: 120, max: 1920, step: 1 },
    index: { type: "text", label: "章节编号" },
    title: { type: "text", label: "章节标题" },
    subtitle: { type: "text", label: "章节说明" },
    accentColor: { type: "color", label: "强调色", default: "#168CFF" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    indexFontSize: { type: "number", label: "编号字号(px)", default: 21, min: 8, max: 96, step: 1 },
    titleFontSize: { type: "number", label: "标题字号(px)", default: 46, min: 10, max: 120, step: 1 },
    subtitleFontSize: { type: "number", label: "说明字号(px)", default: 22, min: 10, max: 96, step: 1 },
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
