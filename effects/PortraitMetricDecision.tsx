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
  lead?: string;
  conclusion?: string;
  metricLabel?: string;
  value?: string;
  unit?: string;
  verdict?: string;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitMetricDecision: React.FC<Props> = ({
  backgroundOpacity = 0,
  enabled = true,
  lead = "推荐方案",
  conclusion = "先 1K，后高清放大",
  metricLabel = "分辨率",
  value = "1",
  unit = "K",
  verdict = "更推荐",
  accentColor = "#14E6A1",
  panelColor = "#111318",
  textColor = "#FFFFFF",
  animationSeconds = 0.9,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(12, Math.round(animationSeconds * fps));

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div
      name="竖屏数据决策卡"
      data-effect="PortraitMetricDecision"
      style={{
        position: "relative",
        width: 410,
        height: 390,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
        opacity: interpolate(frame, [0, enterFrames], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >

      <Interactive.Div
        name="决策结论"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 410,
          paddingLeft: 14,
          borderLeft: `5px solid ${accentColor}`,
          textShadow: "0 4px 16px rgba(0, 0, 0, 0.82)",
          opacity: interpolate(frame, [0, enterFrames * 0.58], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0, enterFrames * 0.58],
            ["-30px 0px", "0px 0px"],
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
            overflow: "hidden",
            color: accentColor,
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: 0.8,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lead}
        </div>
        <div
          style={{
            marginTop: 6,
            overflow: "hidden",
            color: textColor,
            fontSize: 25,
            fontWeight: 800,
            lineHeight: 1.18,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {conclusion}
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="核心数字"
        style={{
          position: "absolute",
          top: 116,
          left: 0,
          width: 300,
          minHeight: 230,
          textShadow: "0 7px 18px rgba(0, 0, 0, 0.88)",
          opacity: interpolate(
            frame,
            [enterFrames * 0.14, enterFrames * 0.82],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [enterFrames * 0.14, enterFrames * 0.82],
            ["-34px 10px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          scale: interpolate(
            frame,
            [enterFrames * 0.14, enterFrames * 0.68, enterFrames],
            [0.76, 1.05, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          transformOrigin: "0% 50%",
        }}
      >
        <div
          style={{
            color: accentColor,
            fontSize: 21,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 1.2,
          }}
        >
          {metricLabel}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            height: 148,
            marginTop: 2,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              color: textColor,
              fontSize: value.length >= 4 ? 98 : value.length >= 3 ? 116 : 148,
              fontWeight: 950,
              lineHeight: 1,
              letterSpacing: -8,
              WebkitTextStroke: "2px rgba(0, 0, 0, 0.2)",
              paintOrder: "stroke fill",
            }}
          >
            {value}
          </span>
          <span
            style={{
              marginLeft: 7,
              color: accentColor,
              fontSize: 86,
              fontWeight: 950,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            {unit}
          </span>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 42,
            padding: "0 16px",
            border: bgFactor > 0 ? `1px solid color-mix(in srgb, ${accentColor} 58%, transparent)` : "1px solid transparent",
            borderRadius: 10,
            color: textColor,
            backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(82 * bgFactor)}%, transparent)`,
            boxShadow: bgFactor > 0 ? "0 10px 22px rgba(0, 0, 0, 0.28)" : "none",
            backdropFilter: bgFactor > 0 ? "blur(12px)" : undefined,
            fontSize: 25,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          {verdict}
        </div>
      </Interactive.Div>

    </Interactive.Div>
  );
};

export const PortraitMetricDecisionEffectDef: EffectDef = {
  id: "PortraitMetricDecision",
  name: "数据决策卡",
  description: "参考竖屏口播视频的 1K / 2K 决策段：突出核心数字、单位与推荐结论。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "1K",
  placement: "left",
  component: PortraitMetricDecision as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 410, height: 390 },
  defaultPosition: { x: 75, y: 245, scale: 1 },
  defaultProps: {
    enabled: true,
    lead: "推荐方案",
    conclusion: "先 1K，后高清放大",
    metricLabel: "分辨率",
    value: "1",
    unit: "K",
    verdict: "更推荐",
    accentColor: "#14E6A1",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    animationSeconds: 0.9,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示决策卡", default: true },
    lead: { type: "text", label: "结论引导词" },
    conclusion: { type: "text", label: "决策结论" },
    metricLabel: { type: "text", label: "指标名称" },
    value: { type: "text", label: "核心数字" },
    unit: { type: "text", label: "数字单位" },
    verdict: { type: "text", label: "数字结论" },
    accentColor: { type: "color", label: "强调色", default: "#14E6A1" },
    panelColor: { type: "color", label: "底板颜色", default: "#111318" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    animationSeconds: {
      type: "number",
      label: "入场时长(秒)",
      default: 0.9,
      min: 0.4,
      max: 2,
      step: 0.1,
    },
  },
};
