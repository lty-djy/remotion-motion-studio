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
  en?: string;
  term?: string;
  definition?: string;
  side?: string;
  accentColor?: string;
  textColor?: string;
  speed?: number;
  offsetX?: number;
  offsetY?: number;
};

const FONT_STACK = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
const MONO_STACK = '"SFMono-Regular", Consolas, monospace';
const EASE_LAND = Easing.bezier(0.22, 1, 0.36, 1);
const CARD_LAND_MS = 520;

/**
 * 术语解释卡:视频里蹦出新名词时,用一张卡给它下定义 —
 * 英文/拼音小字 + 大号术语 + 一句人话解释,左侧强调色竖条压住卡边。
 */
export const TermCard: React.FC<Props> = ({
  en = "Term Card",
  term = "术语卡",
  definition = "视频里蹦出新名词时,用一句话给它下定义。",
  side = "right",
  accentColor = "#5fa0fa",
  textColor = "#FFFFFF",
  speed = 1,
  offsetX = 0,
  offsetY = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000 * Math.min(3, Math.max(0.25, Number(speed) || 1));
  const cardLand = interpolate(t, [0, CARD_LAND_MS], [0, 1], {
    easing: EASE_LAND,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const safeOffsetX = Math.min(900, Math.max(-900, Number(offsetX) || 0));
  const safeOffsetY = Math.min(600, Math.max(-600, Number(offsetY) || 0));
  const accentBarSide = side === "left" ? "borderLeft" : "borderRight";

  return (
    <Interactive.Div
      name="术语解释卡"
      data-effect="TermCard"
      style={{
        position: "relative",
        width: 660,
        color: textColor,
        fontFamily: FONT_STACK,
        transform: `translate(${safeOffsetX}px, ${safeOffsetY}px)`,
        pointerEvents: "none",
      }}
    >
      <Interactive.Div
        name="术语卡面"
        style={{
          boxSizing: "border-box",
          maxWidth: 620,
          padding: "34px 38px",
          borderRadius: 22,
          background:
            "linear-gradient(160deg, rgba(20, 20, 30, 0.82), rgba(14, 14, 20, 0.66))",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          [accentBarSide]: `5px solid ${accentColor}`,
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
          boxShadow:
            "0 30px 70px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
          opacity: cardLand,
          translate: `0px ${16 * (1 - cardLand)}px`,
          scale: `${0.98 + 0.02 * cardLand}`,
        }}
      >
        {en ? (
          <div
            style={{
              fontFamily: MONO_STACK,
              fontSize: 20,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: `color-mix(in srgb, ${textColor} 66%, transparent)`,
              marginBottom: 10,
            }}
          >
            {en}
          </div>
        ) : null}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            color: accentColor,
          }}
        >
          {term}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 30,
            lineHeight: 1.45,
            color: textColor,
          }}
        >
          {definition}
        </div>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const TermCardEffectDef: EffectDef = {
  id: "TermCard",
  name: "术语解释卡",
  description:
    "名词 + 一句人话定义的玻璃卡，讲到新概念时弹出，强调色竖条压住卡边。",
  category: "hud-overlay",
  catalogGroup: "口播HUD常驻卡",
  glyph: "TERM",
  placement: "right",
  component: TermCard as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 660, height: 340 },
  defaultPosition: { x: 1140, y: 380, scale: 1 },
  defaultProps: {
    en: "Term Card",
    term: "术语卡",
    definition: "视频里蹦出新名词时,用一句话给它下定义。",
    side: "right",
    accentColor: "#5fa0fa",
    textColor: "#FFFFFF",
    speed: 1,
    offsetX: 0,
    offsetY: 0,
  },
  propsSchema: {
    en: { type: "text", label: "英文/拼音(可空)" },
    term: { type: "text", label: "术语" },
    definition: { type: "text", label: "一句话定义" },
    speed: { type: "number", label: "动画速度", default: 1, min: 0.5, max: 2, step: 0.1, unit: "×" },
    accentColor: { type: "color", label: "强调色", default: "#5fa0fa" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    side: {
      type: "select",
      label: "落位",
      default: "right",
      options: [
        { label: "右侧", value: "right" },
        { label: "左侧", value: "left" },
      ],
    },
    offsetX: { type: "number", label: "水平微调", default: 0, min: -900, max: 900, step: 10, unit: "px" },
    offsetY: { type: "number", label: "垂直微调", default: 0, min: -600, max: 600, step: 10, unit: "px" },
  },
};
