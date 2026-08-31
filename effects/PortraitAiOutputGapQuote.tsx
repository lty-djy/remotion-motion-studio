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
  showAccentLine?: boolean;
  leadText?: string;
  bodyText?: string;
  leadFontSize?: number;
  bodyFontSize?: number;
  leadColor?: string;
  bodyColor?: string;
  accentColor?: string;
  panelColor?: string;
  leadEnterSeconds?: number;
  bodyEnterSeconds?: number;
  animationSeconds?: number;
};

export const PortraitAiOutputGapQuote: React.FC<Props> = ({
  enabled = true,
  showAccentLine = true,
  leadText = "同样一个 AI，",
  bodyText = "做出来的东西却差了一整个档次。",
  leadFontSize = 30,
  bodyFontSize = 30,
  leadColor = "#A9A7B4",
  bodyColor = "#777887",
  accentColor = "#1FD9E8",
  panelColor = "#071017",
  leadEnterSeconds = 0.4,
  bodyEnterSeconds = 0.75,
  animationSeconds = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!enabled) return null;

  return (
    <Interactive.Div
      name="同样一个 AI 引用卡"
      data-effect="PortraitAiOutputGapQuote"
      style={{
        position: "relative",
        width: 700,
        height: 190,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        borderRadius: 22,
        padding: "28px 36px 28px 60px",
        backgroundColor: `color-mix(in srgb, ${panelColor} 38%, transparent)`,
        fontFamily: '"Songti SC", "SimSun", serif',
        opacity: interpolate(frame, [0, fps * 0.28], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {showAccentLine ? (
        <Interactive.Div
          name="引用竖线"
          style={{
            position: "absolute",
            left: 28,
            top: 28,
            width: 4,
            height: interpolate(
              frame,
              [0, fps * Math.max(0.1, leadEnterSeconds)],
              [0, 134],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
            borderRadius: 999,
            backgroundColor: accentColor,
            boxShadow: `0 0 18px color-mix(in srgb, ${accentColor} 30%, transparent)`,
          }}
        />
      ) : null}
      <Interactive.Div
        name="引用文字"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          lineHeight: 1.25,
          letterSpacing: 0.2,
        }}
      >
        <Interactive.Div
          name="同样一个 AI"
          style={{
            color: leadColor,
            fontSize: leadFontSize,
            fontWeight: 760,
            opacity: interpolate(
              frame,
              [0, fps * Math.max(0.1, leadEnterSeconds)],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
            translate: interpolate(
              frame,
              [0, fps * Math.max(0.1, leadEnterSeconds)],
              ["18px 0px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
          }}
        >
          {leadText}
        </Interactive.Div>
        <Interactive.Div
          name="输出档次差距"
          style={{
            color: bodyColor,
            fontSize: bodyFontSize,
            fontWeight: 720,
            opacity: interpolate(
              frame,
              [fps * 0.12, fps * Math.max(0.25, bodyEnterSeconds)],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
            translate: interpolate(
              frame,
              [fps * 0.12, fps * Math.max(0.25, bodyEnterSeconds)],
              ["18px 0px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
          }}
        >
          {bodyText}
        </Interactive.Div>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitAiOutputGapQuoteEffectDef: EffectDef = {
  id: "PortraitAiOutputGapQuote",
  name: "竖屏口播·同样 AI 输出差距引用",
  description: "三段拆分中的第 2 个组件：同样一个 AI，却产生不同输出档次的双行引用。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "AI",
  placement: "left",
  component: PortraitAiOutputGapQuote as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 120,
  bounds: { x: 0, y: 0, width: 700, height: 190 },
  defaultPosition: { x: 80, y: 610, scale: 1 },
  defaultProps: {
    enabled: true,
    showAccentLine: true,
    leadText: "同样一个 AI，",
    bodyText: "做出来的东西却差了一整个档次。",
    leadFontSize: 30,
    bodyFontSize: 30,
    leadColor: "#A9A7B4",
    bodyColor: "#777887",
    accentColor: "#1FD9E8",
    panelColor: "#071017",
    leadEnterSeconds: 0.4,
    bodyEnterSeconds: 0.75,
    animationSeconds: 4,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示 AI 输出差距引用", default: true },
    showAccentLine: { type: "boolean", label: "显示引用竖线", default: true },
    leadText: { type: "text", label: "第一行文字" },
    bodyText: { type: "text", label: "第二行文字" },
    leadFontSize: { type: "number", label: "第一行字号(px)", default: 30, min: 8, max: 120, step: 1 },
    bodyFontSize: { type: "number", label: "第二行字号(px)", default: 30, min: 8, max: 120, step: 1 },
    leadColor: { type: "color", label: "第一行颜色", default: "#A9A7B4" },
    bodyColor: { type: "color", label: "第二行颜色", default: "#777887" },
    accentColor: { type: "color", label: "引用竖线颜色", default: "#1FD9E8" },
    panelColor: { type: "color", label: "底板颜色", default: "#071017" },
    leadEnterSeconds: { type: "number", label: "第一行入场时间(秒)", default: 0.4, min: 0.1, max: 120, step: 0.1 },
    bodyEnterSeconds: { type: "number", label: "第二行入场时间(秒)", default: 0.75, min: 0.1, max: 120, step: 0.1 },
    animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 4, min: 1, max: 120, step: 0.1 },
  },
};
