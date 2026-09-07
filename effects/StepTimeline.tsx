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
  steps?: string;
  revealed?: number;
  side?: string;
  accentColor?: string;
  textColor?: string;
  speed?: number;
  offsetX?: number;
  offsetY?: number;
};

const FONT_STACK = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
const EASE_LAND = Easing.bezier(0.22, 1, 0.36, 1);
/** 章节卡循环配色:蓝→青→紫 一组和谐冷色(同饱和度档) */
const CHIP_CYCLE = ["#5fa0fa", "#45c6cf", "#8f86ea"];
const STAGGER_MS = 240;
const STEP_MOVE_MS = 560;
const NODE_SCALE_MS = 460;
const TITLE_FADE_MS = 640;
const BAR_SCALE_MS = 560;
const MAX_STEPS = 6;

/** 把 "两套*不一样*的打法" 里的 *...* 渲染成强调色高亮 */
const renderTitle = (title: string, accentColor: string) =>
  title.split(/(\*[^*]+\*)/).map((segment, index) =>
    segment.startsWith("*") && segment.endsWith("*") && segment.length > 2 ? (
      <span style={{ color: accentColor }} key={index}>
        {segment.slice(1, -1)}
      </span>
    ) : (
      <span key={index}>{segment}</span>
    ),
  );

/**
 * 步骤时间线卡:标题 + 竖向虚线导轨,章节chip逐句冒出;
 * 还没讲到的章节留空的淡色轮廓,观众随时知道讲到了第几步。
 */
export const StepTimeline: React.FC<Props> = ({
  title = "《本期*章节*大纲》",
  steps = "开场钩子|干货主体|结尾升华",
  revealed = 2,
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
  const labels = steps
    .split("|")
    .map((text) => text.trim())
    .filter(Boolean)
    .slice(0, MAX_STEPS);
  const safeRevealed = Math.min(
    labels.length,
    Math.max(0, Math.round(Number(revealed) || 0)),
  );
  const slideFrom = side === "left" ? -48 : 48;
  const safeOffsetX = Math.min(900, Math.max(-900, Number(offsetX) || 0));
  const safeOffsetY = Math.min(600, Math.max(-600, Number(offsetY) || 0));

  const titleFade = interpolate(t, [0, TITLE_FADE_MS], [0, 1], {
    easing: EASE_LAND,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleRise = interpolate(t, [0, TITLE_FADE_MS], [14, 0], {
    easing: EASE_LAND,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barScale = interpolate(t, [0, BAR_SCALE_MS], [0, 1], {
    easing: EASE_LAND,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Interactive.Div
      name="步骤时间线卡"
      data-effect="StepTimeline"
      style={{
        position: "relative",
        width: 760,
        display: "flex",
        flexDirection: "column",
        color: textColor,
        fontFamily: FONT_STACK,
        transform: `translate(${safeOffsetX}px, ${safeOffsetY}px)`,
        pointerEvents: "none",
      }}
    >
      <Interactive.Div
        name="章节大纲标题"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 52,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
          marginBottom: 34,
          textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
          opacity: titleFade,
          translate: `0px ${titleRise}px`,
        }}
      >
        <span
          style={{
            display: "block",
            width: 6,
            height: "1.05em",
            borderRadius: 3,
            backgroundColor: accentColor,
            flex: "none",
            transform: `scaleY(${barScale})`,
            transformOrigin: "top",
          }}
        />
        <span>{renderTitle(title, accentColor)}</span>
      </Interactive.Div>

      <Interactive.Div
        name="章节导轨"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 11,
            top: 18,
            bottom: 18,
            borderLeft: "2px dotted rgba(255, 255, 255, 0.16)",
          }}
        />
        {labels.map((label, index) => {
          const isEmpty = index >= safeRevealed;
          const startMs = index * STAGGER_MS;
          const stepFade = interpolate(t, [startMs, startMs + STEP_MOVE_MS], [0, 1], {
            easing: EASE_LAND,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const nodeScale = interpolate(t, [startMs, startMs + NODE_SCALE_MS], [0, 1], {
            easing: EASE_LAND,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const chipColor = CHIP_CYCLE[index % CHIP_CYCLE.length];
          return (
            <Interactive.Div
              name={`章节 ${index + 1}`}
              data-step={index + 1}
              key={`${index}-${label}`}
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "24px 1fr",
                gap: 24,
                alignItems: "center",
                opacity: stepFade,
                translate: `${slideFrom * (1 - stepFade)}px 0px`,
              }}
            >
              <span
                style={{
                  boxSizing: "border-box",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: `2px solid ${chipColor}`,
                  backgroundColor: "#12121a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${nodeScale})`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: chipColor,
                  }}
                />
              </span>
              <Interactive.Div
                name={`章节条 ${index + 1}`}
                style={{
                  boxSizing: "border-box",
                  minWidth: 320,
                  minHeight: 74,
                  padding: "16px 30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 15,
                  border: isEmpty
                    ? "2px solid rgba(255, 255, 255, 0.22)"
                    : `2px solid ${chipColor}`,
                  background:
                    "linear-gradient(160deg, rgba(24, 24, 34, 0.78), rgba(14, 14, 20, 0.62))",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow:
                    "0 30px 70px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                  opacity: isEmpty ? 0.5 : 1,
                }}
              >
                {isEmpty ? "" : label}
              </Interactive.Div>
            </Interactive.Div>
          );
        })}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const StepTimelineEffectDef: EffectDef = {
  id: "StepTimeline",
  name: "步骤时间线卡",
  description:
    "章节大纲沿竖向导轨逐句冒出，未讲到的章节留空轮廓，标题支持 *关键词* 高亮。",
  category: "hud-overlay",
  catalogGroup: "口播HUD常驻卡",
  glyph: "STEP",
  placement: "right",
  component: StepTimeline as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 760, height: 680 },
  defaultPosition: { x: 1040, y: 200, scale: 1 },
  defaultProps: {
    title: "《本期*章节*大纲》",
    steps: "开场钩子|干货主体|结尾升华",
    revealed: 2,
    side: "right",
    accentColor: "#5fa0fa",
    textColor: "#FFFFFF",
    speed: 1,
    offsetX: 0,
    offsetY: 0,
  },
  propsSchema: {
    title: { type: "text", label: "标题(*关键词*高亮)" },
    steps: { type: "text", label: "章节(|分隔)" },
    revealed: { type: "number", label: "已讲到第几章", default: 2, min: 0, max: 6, step: 1 },
    speed: { type: "number", label: "动画速度", default: 1, min: 0.5, max: 2, step: 0.1, unit: "×" },
    accentColor: { type: "color", label: "标题强调色", default: "#5fa0fa" },
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
