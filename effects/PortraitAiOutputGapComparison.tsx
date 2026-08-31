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
  showGapLabel?: boolean;
  gapLabel?: string;
  badText?: string;
  goodText?: string;
  badSymbol?: string;
  goodSymbol?: string;
  labelFontSize?: number;
  itemFontSize?: number;
  symbolFontSize?: number;
  labelColor?: string;
  textColor?: string;
  badColor?: string;
  goodColor?: string;
  panelColor?: string;
  labelEnterSeconds?: number;
  firstRowEnterSeconds?: number;
  nextRowEnterIntervalSeconds?: number;
  animationSeconds?: number;
};

export const PortraitAiOutputGapComparison: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  showGapLabel = true,
  gapLabel = "THE GAP",
  badText = "一眼就是 AI 糊的",
  goodText = "能直接上线",
  badSymbol = "×",
  goodSymbol = "✓",
  labelFontSize = 18,
  itemFontSize = 38,
  symbolFontSize = 34,
  labelColor = "#9E9BAC",
  textColor = "#F7F5F2",
  badColor = "#FF7D84",
  goodColor = "#1FD9E8",
  panelColor = "#071017",
  labelEnterSeconds = 0.3,
  firstRowEnterSeconds = 0.6,
  nextRowEnterIntervalSeconds = 0.45,
  animationSeconds = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  if (!enabled) return null;

  return (
    <Interactive.Div
      name="AI 输出差距对比"
      data-effect="PortraitAiOutputGapComparison"
      style={{
        position: "relative",
        width: 640,
        height: 300,
        boxSizing: "border-box",
        overflow: "hidden",
        borderRadius: 24,
        border: bgFactor > 0
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : "1px solid transparent",
        padding: "28px 34px",
        backgroundColor: bgFactor > 0
          ? `color-mix(in srgb, ${panelColor} ${Math.round(92 * bgFactor)}%, transparent)`
          : "transparent",
        boxShadow: bgFactor > 0
          ? `0 22px 60px rgba(0, 0, 0, ${0.42 * bgFactor})`
          : "none",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        opacity: interpolate(frame, [0, fps * 0.25], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {showGapLabel ? (
        <Interactive.Div
          name="THE GAP 标签"
          style={{
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: 850,
            letterSpacing: 5,
            lineHeight: 1,
            opacity: interpolate(
              frame,
              [0, fps * Math.max(0.1, labelEnterSeconds)],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
          }}
        >
          {gapLabel}
        </Interactive.Div>
      ) : null}

      <Interactive.Div
        name="AI 糊的"
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 24,
          color: textColor,
          fontSize: itemFontSize,
          fontWeight: 850,
          lineHeight: 1.1,
          opacity: interpolate(
            frame,
            [fps * 0.12, fps * Math.max(0.25, firstRowEnterSeconds)],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          translate: interpolate(
            frame,
            [fps * 0.12, fps * Math.max(0.25, firstRowEnterSeconds)],
            ["0px 24px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        <Interactive.Div
          name="错误符号"
          style={{
            width: 62,
            height: 62,
            flex: "0 0 62px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            borderRadius: 999,
            border: `2px solid ${badColor}`,
            color: badColor,
            backgroundColor: `color-mix(in srgb, ${badColor} 8%, transparent)`,
            boxShadow: `0 0 24px color-mix(in srgb, ${badColor} 22%, transparent)`,
            fontSize: symbolFontSize,
            fontWeight: 500,
          }}
        >
          {badSymbol}
        </Interactive.Div>
        <span>{badText}</span>
      </Interactive.Div>

      <Interactive.Div
        name="直接上线"
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 24,
          color: textColor,
          fontSize: itemFontSize,
          fontWeight: 850,
          lineHeight: 1.1,
          opacity: interpolate(
            frame,
            [
              fps * Math.max(0.2, firstRowEnterSeconds),
              fps * Math.max(0.35, firstRowEnterSeconds + nextRowEnterIntervalSeconds),
            ],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          translate: interpolate(
            frame,
            [
              fps * Math.max(0.2, firstRowEnterSeconds),
              fps * Math.max(0.35, firstRowEnterSeconds + nextRowEnterIntervalSeconds),
            ],
            ["0px 24px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        <Interactive.Div
          name="正确符号"
          style={{
            width: 62,
            height: 62,
            flex: "0 0 62px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            borderRadius: 999,
            border: `2px solid ${goodColor}`,
            color: goodColor,
            backgroundColor: `color-mix(in srgb, ${goodColor} 8%, transparent)`,
            boxShadow: `0 0 24px color-mix(in srgb, ${goodColor} 22%, transparent)`,
            fontSize: symbolFontSize,
            fontWeight: 600,
          }}
        >
          {goodSymbol}
        </Interactive.Div>
        <span>{goodText}</span>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitAiOutputGapComparisonEffectDef: EffectDef = {
  id: "PortraitAiOutputGapComparison",
  name: "竖屏口播·AI 输出差距对比",
  description: "三段拆分中的第 3 个组件：AI 糊感与可直接上线的正反结果对比。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "GAP",
  placement: "left",
  component: PortraitAiOutputGapComparison as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 120,
  bounds: { x: 0, y: 0, width: 640, height: 300 },
  defaultPosition: { x: 90, y: 850, scale: 1 },
  defaultProps: {
    enabled: true,
    showGapLabel: true,
    gapLabel: "THE GAP",
    badText: "一眼就是 AI 糊的",
    goodText: "能直接上线",
    badSymbol: "×",
    goodSymbol: "✓",
    labelFontSize: 18,
    itemFontSize: 38,
    symbolFontSize: 34,
    labelColor: "#9E9BAC",
    textColor: "#F7F5F2",
    badColor: "#FF7D84",
    goodColor: "#1FD9E8",
    panelColor: "#071017",
    labelEnterSeconds: 0.3,
    firstRowEnterSeconds: 0.6,
    nextRowEnterIntervalSeconds: 0.45,
    animationSeconds: 4,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示 AI 输出差距对比", default: true },
    showGapLabel: { type: "boolean", label: "显示 THE GAP 标签", default: true },
    gapLabel: { type: "text", label: "顶部标签" },
    badText: { type: "text", label: "反面结果文字" },
    goodText: { type: "text", label: "正面结果文字" },
    badSymbol: { type: "text", label: "反面符号" },
    goodSymbol: { type: "text", label: "正面符号" },
    labelFontSize: { type: "number", label: "顶部标签字号(px)", default: 18, min: 8, max: 96, step: 1 },
    itemFontSize: { type: "number", label: "结果文字字号(px)", default: 38, min: 12, max: 120, step: 1 },
    symbolFontSize: { type: "number", label: "符号字号(px)", default: 34, min: 12, max: 96, step: 1 },
    labelColor: { type: "color", label: "顶部标签颜色", default: "#9E9BAC" },
    textColor: { type: "color", label: "结果文字颜色", default: "#F7F5F2" },
    badColor: { type: "color", label: "反面颜色", default: "#FF7D84" },
    goodColor: { type: "color", label: "正面颜色", default: "#1FD9E8" },
    panelColor: { type: "color", label: "底板颜色", default: "#071017" },
    labelEnterSeconds: { type: "number", label: "顶部标签入场时间(秒)", default: 0.3, min: 0.1, max: 120, step: 0.1 },
    firstRowEnterSeconds: { type: "number", label: "第一条入场时间(秒)", default: 0.6, min: 0.1, max: 120, step: 0.1 },
    nextRowEnterIntervalSeconds: { type: "number", label: "下一条入场间隔(秒)", default: 0.45, min: 0, max: 120, step: 0.1 },
    animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 4, min: 1, max: 120, step: 0.1 },
  },
};
