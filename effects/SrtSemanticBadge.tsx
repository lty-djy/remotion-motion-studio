import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";
import {
  HF_BASE,
  backOut,
  clamp01,
  matchSemantics,
  resolveAccent,
  resolveCues,
  withAlpha,
} from "./captionKit";

type SrtSemanticBadgeProps = {
  enabled?: boolean;
  keywordOnly?: boolean;
  accentMode?: string;
  accentColor?: string;
  timeOffset?: number;
  cuesJson?: string;
};

export const SrtSemanticBadge: React.FC<SrtSemanticBadgeProps> = ({
  enabled = true,
  keywordOnly = false,
  accentMode = "auto",
  accentColor = "#FFC400",
  timeOffset = 0,
  cuesJson = "",
}) => {
  const frame = useCurrentFrame();
  const { fps: rawFps } = useVideoConfig();
  if (!enabled) return null;
  const fps = rawFps > 0 ? rawFps : 30;

  const cues = resolveCues(cuesJson);
  const t = frame / fps + timeOffset;
  let cueIdx = -1;
  for (let i = 0; i < cues.length; i++) {
    if (t >= cues[i].start) cueIdx = i;
    else break;
  }
  if (cueIdx < 0) {
    return (
      <div
        data-effect="SrtSemanticBadge"
        style={{ width: 480, height: 180, position: "relative", background: "transparent" }}
      />
    );
  }
  const cue = cues[cueIdx];
  const semantic = matchSemantics(cue.text);
  const accent = resolveAccent(accentMode, accentColor, semantic.tag);

  const age = Math.max(0, t - cue.start);
  const pop = backOut(clamp01(age / 0.45), 1.8);
  const glowPhase = clamp01((age - 0.4) / 0.5);
  const glow = Math.sin(Math.PI * glowPhase);

  const displayText = semantic.keyword || cue.text;

  return (
    <div
      data-effect="SrtSemanticBadge"
      style={{
        width: 480,
        height: 180,
        position: "relative",
        background: "transparent",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${pop.toFixed(3)})`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "22px 44px",
            borderRadius: 24,
            background: "rgba(12,16,24,0.78)",
            border: `1.5px solid ${withAlpha(accent, 0.7)}`,
            boxShadow: `0 0 ${(glow * 46).toFixed(1)}px ${withAlpha(
              accent,
              glow * 0.55,
            )}, inset 0 0 ${(glow * 30).toFixed(1)}px ${withAlpha(
              accent,
              glow * 0.18,
            )}`,
            whiteSpace: "nowrap",
          }}
        >
          {!keywordOnly ? (
            <span
              style={{
                fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 6,
                color: withAlpha(accent, 0.9),
              }}
            >
              {semantic.tag.toUpperCase()}
            </span>
          ) : null}
          <span
            style={{
              fontSize: 52,
              fontWeight: 850,
              letterSpacing: 2,
              color: HF_BASE,
            }}
          >
            {displayText}
          </span>
        </div>
      </div>
    </div>
  );
};

export const SrtSemanticBadgeEffectDef: EffectDef = {
  id: "SrtSemanticBadge",
  name: "语义徽章",
  description: "当前台词的语义关键词大徽章：back.out 过冲弹出＋琥珀辉光脉冲，随语句自动切换",
  category: "captions",
  catalogGroup: "字幕与台词",
  glyph: "◆",
  placement: "left",
  component: SrtSemanticBadge as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 582,
  bounds: { x: 0, y: 0, width: 480, height: 180 },
  defaultPosition: { x: 720, y: 300, scale: 1 },
  defaultProps: {
    enabled: true,
    keywordOnly: false,
    accentMode: "auto",
    accentColor: "#FFC400",
    timeOffset: 0,
    cuesJson: "",
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示语义徽章", default: true },
    keywordOnly: { type: "boolean", label: "仅显示关键词", default: false },
    accentMode: {
      type: "select",
      label: "强调色模式",
      default: "auto",
      options: [
        { label: "按语义自动配色", value: "auto" },
        { label: "统一单色", value: "mono" },
      ],
    },
    accentColor: { type: "color", label: "单色强调色", default: "#FFC400" },
    timeOffset: { type: "number", label: "时间偏移(秒)", default: 0, min: -10, max: 10, step: 0.05 },
    cuesJson: { type: "text", label: "自定义台词JSON(start/end/text)", default: "" },
  },
};
