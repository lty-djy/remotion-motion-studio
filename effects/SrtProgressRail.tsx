import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";
import {
  HF_LINK,
  TAG_COLORS,
  TAG_LABELS,
  clamp01,
  matchSemantics,
  pow2Out,
  resolveCues,
} from "./captionKit";

type SrtProgressRailProps = {
  enabled?: boolean;
  accentColor?: string;
  showTagChip?: boolean;
  timeOffset?: number;
  cuesJson?: string;
};

export const SrtProgressRail: React.FC<SrtProgressRailProps> = ({
  enabled = true,
  accentColor = "#FFC400",
  showTagChip = true,
  timeOffset = 0,
  cuesJson = "",
}) => {
  const frame = useCurrentFrame();
  const { fps: rawFps } = useVideoConfig();
  if (!enabled) return null;
  const fps = rawFps > 0 ? rawFps : 30;

  const cues = resolveCues(cuesJson);
  const t = frame / fps + timeOffset;
  const total = Math.max(0.2, cues[cues.length - 1]?.end ?? 1);
  const cue = cues.find((c) => t >= c.start && t < c.end) ?? null;
  const semantic = cue ? matchSemantics(cue.text) : null;

  const bootP = pow2Out(frame / Math.max(1, fps * 0.4));
  const progress = clamp01(t / total);
  const drawIn = pow2Out(Math.min(1, (t + 0.15) / 0.5));
  const fillW = progress * drawIn * 100;

  return (
    <div
      data-effect="SrtProgressRail"
      style={{
        width: 1080,
        height: 120,
        position: "relative",
        background: "transparent",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "6%",
          right: "6%",
          bottom: 26,
          opacity: bootP,
          transform: `translateY(${((1 - bootP) * 18).toFixed(2)}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          {showTagChip && cue && semantic ? (
            <span
              style={{
                padding: "3px 12px",
                borderRadius: 999,
                background: "rgba(0,122,255,0.15)",
                color: HF_LINK,
                fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: 3,
              }}
            >
              {`${semantic.tag.toUpperCase()} · ${TAG_LABELS[semantic.tag]}`}
            </span>
          ) : (
            <span />
          )}
          {cue ? (
            <span
              style={{
                fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
                fontSize: 18,
                color: "rgba(245,247,250,0.6)",
                letterSpacing: 2,
              }}
            >
              {`${String(cue.index).padStart(2, "0")} / ${String(
                cues.length,
              ).padStart(2, "0")}`}
            </span>
          ) : null}
        </div>

        <div
          style={{
            position: "relative",
            height: 8,
            borderRadius: 4,
            background: "rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${fillW.toFixed(2)}%`,
              borderRadius: 4,
              background: accentColor,
              boxShadow: `0 0 14px rgba(255,196,0,0.45)`,
            }}
          />
          {cues.map((c) => {
            const x = clamp01(c.start / total) * 100;
            const past = t >= c.start;
            const active = cue?.index === c.index;
            return (
              <div
                key={`tick-${c.index}`}
                style={{
                  position: "absolute",
                  left: `${x.toFixed(2)}%`,
                  top: -5,
                  bottom: -5,
                  width: active ? 3 : 1.5,
                  borderRadius: 2,
                  background: active
                    ? "#FFFFFF"
                    : past
                      ? "rgba(255,255,255,0.55)"
                      : "rgba(255,255,255,0.22)",
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              left: `${clamp01(progress).toFixed(4)*100}%`,
              top: "50%",
              width: 14,
              height: 14,
              borderRadius: 999,
              transform: "translate(-50%, -50%)",
              background: "#FFFFFF",
              border: `3px solid ${accentColor}`,
              boxShadow: `0 0 ${6 + Math.sin(frame / 4) * 4}px ${
                TAG_COLORS.online
              }`,
              opacity: bootP,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const SrtProgressRailEffectDef: EffectDef = {
  id: "SrtProgressRail",
  name: "台词进度轨",
  description: "底部任务进度条：随播放推进，分段刻度标记每句台词，语义标签胶囊＋呼吸游标",
  category: "captions",
  catalogGroup: "字幕与台词",
  glyph: "▁",
  placement: "bottom",
  component: SrtProgressRail as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 582,
  bounds: { x: 0, y: 0, width: 1080, height: 120 },
  defaultPosition: { x: 0, y: 1740, scale: 1 },
  defaultProps: {
    enabled: true,
    accentColor: "#FFC400",
    showTagChip: true,
    timeOffset: 0,
    cuesJson: "",
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示进度轨", default: true },
    accentColor: { type: "color", label: "进度强调色", default: "#FFC400" },
    showTagChip: { type: "boolean", label: "显示语义标签", default: true },
    timeOffset: { type: "number", label: "时间偏移(秒)", default: 0, min: -10, max: 10, step: 0.05 },
    cuesJson: { type: "text", label: "自定义台词JSON(start/end/text)", default: "" },
  },
};
