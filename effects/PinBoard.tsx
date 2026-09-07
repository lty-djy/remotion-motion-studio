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
  title?: string;
  subtitle?: string;
  items?: string;
  stepMs?: number;
  speed?: number;
  side?: string;
  accentColor?: string;
  textColor?: string;
  offsetX?: number;
  offsetY?: number;
};

const FONT_STACK = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
/** 常规入场缓动(对应原版 --ease) */
const EASE_LAND = Easing.bezier(0.22, 1, 0.36, 1);
/** 落钉过冲缓动:钉上去的一下带轻微回弹 */
const EASE_POKE = Easing.bezier(0.2, 0.9, 0.3, 1.3);
const TITLE_LAND_MS = 0;
const TITLE_FADE_MS = 420;
const TITLE_MOVE_MS = 460;
const SUB_DELAY_MS = 140;
const FIRST_CHIP_MS = 400;
const CHIP_FADE_MS = 340;
const CHIP_MOVE_MS = 430;
const MAX_CHIPS = 8;

/**
 * 要点钉板:讲过的要点钉在角落全程不消失 —
 * 章节标题 + 强调副题钉住,黑牌要点逐条落钉。
 * 卡片时长应覆盖整段讲述(20-60s),每条落钉间隔对齐口播讲到该条的时刻。
 */
export const PinBoard: React.FC<Props> = ({
  title = "本段主题写这里",
  subtitle = "小标题:",
  items = "要点一|要点二|要点三|要点四",
  stepMs = 4000,
  speed = 1,
  side = "top-right",
  accentColor = "#5fa0fa",
  textColor = "#FFFFFF",
  offsetX = 0,
  offsetY = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // 速度倍率缩放整卡时钟:2× = 所有动画快一倍
  const t = ((frame / fps) * 1000 * Math.min(3, Math.max(0.25, Number(speed) || 1)));
  const chips = items
    .split("|")
    .map((text) => text.trim())
    .filter(Boolean)
    .slice(0, MAX_CHIPS);
  const safeStepMs = Math.min(20000, Math.max(250, Number(stepMs) || 4000));
  const safeOffsetX = Math.min(900, Math.max(-900, Number(offsetX) || 0));
  const safeOffsetY = Math.min(600, Math.max(-600, Number(offsetY) || 0));
  const alignLeft = side === "top-left";

  const fadeProgress = (startMs: number, durationMs: number) =>
    interpolate(t, [startMs, startMs + durationMs], [0, 1], {
      easing: EASE_LAND,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const titleProgress = fadeProgress(TITLE_LAND_MS, TITLE_MOVE_MS);
  const titleFade = fadeProgress(TITLE_LAND_MS, TITLE_FADE_MS);
  const subProgress = fadeProgress(SUB_DELAY_MS, TITLE_MOVE_MS);
  const subFade = fadeProgress(SUB_DELAY_MS, TITLE_FADE_MS);

  return (
    <Interactive.Div
      name="要点钉板"
      data-effect="PinBoard"
      style={{
        position: "relative",
        width: 640,
        display: "flex",
        flexDirection: "column",
        alignItems: alignLeft ? "flex-start" : "flex-end",
        gap: 13,
        color: textColor,
        fontFamily: FONT_STACK,
        transform: `translate(${safeOffsetX}px, ${safeOffsetY}px)`,
        pointerEvents: "none",
      }}
    >
      {title ? (
        <Interactive.Div
          name="章节标题"
          style={{
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: 2,
            lineHeight: 1.2,
            color: textColor,
            textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
            opacity: titleFade,
            translate: `0px ${-18 * (1 - titleProgress)}px`,
          }}
        >
          {title}
        </Interactive.Div>
      ) : null}
      {subtitle ? (
        <Interactive.Div
          name="强调副题"
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 1,
            lineHeight: 1.2,
            color: accentColor,
            textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
            opacity: subFade,
            translate: `0px ${-14 * (1 - subProgress)}px`,
          }}
        >
          {subtitle}
        </Interactive.Div>
      ) : null}
      {chips.map((chip, index) => {
        const startMs = FIRST_CHIP_MS + index * safeStepMs;
        const chipFade = fadeProgress(startMs, CHIP_FADE_MS);
        const chipLand = interpolate(t, [startMs, startMs + CHIP_MOVE_MS], [0, 1], {
          easing: EASE_POKE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <Interactive.Div
            name={`要点 ${index + 1}`}
            data-chip={index + 1}
            key={`${index}-${chip}`}
            style={{
              boxSizing: "border-box",
              maxWidth: "100%",
              padding: "8px 22px",
              borderRadius: 10,
              background: "rgba(15, 13, 21, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.24)",
              color: "rgba(255, 255, 255, 0.95)",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 1,
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              opacity: chipFade,
              translate: `0px ${-16 * (1 - chipLand)}px`,
              scale: `${0.68 + 0.32 * chipLand}`,
            }}
          >
            {chip}
          </Interactive.Div>
        );
      })}
    </Interactive.Div>
  );
};

export const PinBoardEffectDef: EffectDef = {
  id: "PinBoard",
  name: "要点钉板",
  description:
    "章节标题+副题钉在角落，黑牌要点逐条落钉且全程不消失，观众随时知道讲到哪。",
  category: "hud-overlay",
  catalogGroup: "口播HUD常驻卡",
  glyph: "PIN",
  placement: "right",
  component: PinBoard as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 450,
  bounds: { x: 0, y: 0, width: 640, height: 560 },
  defaultPosition: { x: 1160, y: 96, scale: 1 },
  defaultProps: {
    title: "本段主题写这里",
    subtitle: "小标题:",
    items: "要点一|要点二|要点三|要点四",
    stepMs: 4000,
    speed: 1,
    side: "top-right",
    accentColor: "#5fa0fa",
    textColor: "#FFFFFF",
    offsetX: 0,
    offsetY: 0,
  },
  propsSchema: {
    title: { type: "text", label: "章节标题(可空)" },
    subtitle: { type: "text", label: "强调副题(可空)" },
    items: { type: "text", label: "要点(|分隔,逐条落钉)" },
    stepMs: {
      type: "number",
      label: "每条落钉间隔(卡点用)",
      default: 4000,
      min: 500,
      max: 15000,
      step: 250,
      unit: "ms",
    },
    speed: { type: "number", label: "动画速度", default: 1, min: 0.5, max: 2, step: 0.1, unit: "×" },
    accentColor: { type: "color", label: "强调色(副题)", default: "#5fa0fa" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    side: {
      type: "select",
      label: "落位",
      default: "top-right",
      options: [
        { label: "右上角", value: "top-right" },
        { label: "左上角", value: "top-left" },
      ],
    },
    offsetX: { type: "number", label: "水平微调", default: 0, min: -900, max: 900, step: 10, unit: "px" },
    offsetY: { type: "number", label: "垂直微调", default: 0, min: -600, max: 600, step: 10, unit: "px" },
  },
};
