import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";
import {
  HF_BASE,
  HF_DIM,
  backOut,
  clamp01,
  matchSemantics,
  mixColor,
  pow1InOut,
  pow2Out,
  resolveAccent,
  resolveCues,
  withAlpha,
} from "./captionKit";

type SrtKaraokeLineProps = {
  enabled?: boolean;
  fontSize?: number;
  baseColor?: string;
  dimColor?: string;
  accentMode?: string;
  accentColor?: string;
  timeOffset?: number;
  cuesJson?: string;
};

const glowPulse = (age: number) => clamp01((age - 0.35) / 0.45);

export const SrtKaraokeLine: React.FC<SrtKaraokeLineProps> = ({
  enabled = true,
  fontSize = 64,
  baseColor = HF_BASE,
  dimColor = HF_DIM,
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
  const cue = cues.find((c) => t >= c.start && t < c.end) ?? null;

  if (!cue) {
    return (
      <div
        data-effect="SrtKaraokeLine"
        style={{ width: 1080, height: 260, position: "relative", background: "transparent" }}
      />
    );
  }

  const semantic = matchSemantics(cue.text);
  const accent = resolveAccent(accentMode, accentColor, semantic.tag);
  const fs = Math.max(30, Math.min(120, fontSize));

  const age = t - cue.start;
  const dur = Math.max(0.2, cue.end - cue.start);
  const enterP = pow2Out(age / 0.3);
  const remain = cue.end - t;
  const exitFade = remain < 0.16 ? clamp01(remain / 0.16) : 1;
  const opacity = enterP * exitFade;

  const chars = [...cue.text];
  const kwAt = semantic.keyword ? cue.text.indexOf(semantic.keyword) : -1;
  const kwCharStart = kwAt >= 0 ? [...cue.text.slice(0, kwAt)].length : -1;
  const kwCharEnd =
    kwAt >= 0 ? kwCharStart + [...semantic.keyword].length : -1;

  const sweepP = clamp01(age / dur);
  const underlineW = pow1InOut(sweepP);

  return (
    <div
      data-effect="SrtKaraokeLine"
      style={{
        width: 1080,
        height: 260,
        position: "relative",
        background: "transparent",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "5%",
          right: "5%",
          top: "50%",
          transform: `translateY(calc(-50% + ${((1 - enterP) * 20).toFixed(2)}px))`,
          textAlign: "center",
          opacity,
        }}
      >
        <div
          style={{
            fontSize: fs,
            fontWeight: 700,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {chars.map((ch, i) => {
            const isKw = i >= kwCharStart && i < kwCharEnd;
            const target = isKw ? accent : baseColor;
            const local = clamp01((sweepP * (chars.length + 3) - i) / 3);
            const color = local <= 0 ? dimColor : mixColor(dimColor, target, local);
            const bounce = Math.sin(Math.PI * clamp01(local)) * -6;
            const pop = isKw && local >= 1 ? backOut(clamp01((age - 0.15) / 0.4), 1.6) : 1;
            return (
              <span
                key={`${i}-${ch}`}
                style={{
                  display: "inline-block",
                  color,
                  transform: `translateY(${bounce.toFixed(2)}px) scale(${(
                    (isKw ? pop : 1) +
                    Math.sin(Math.PI * clamp01(local)) * 0.06
                  ).toFixed(3)})`,
                  textShadow:
                    isKw && local > 0.9
                      ? `0 0 ${(Math.sin(Math.PI * glowPulse(age)) * 18).toFixed(
                          1,
                        )}px ${withAlpha(accent, 0.5)}`
                      : undefined,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 16,
            height: 6,
            borderRadius: 3,
            background: "rgba(255,255,255,0.12)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(underlineW * 100).toFixed(1)}%`,
              height: "100%",
              borderRadius: 3,
              background: accent,
              boxShadow: `0 0 12px ${withAlpha(accent, 0.6)}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const SrtKaraokeLineEffectDef: EffectDef = {
  id: "SrtKaraokeLine",
  name: "卡拉OK扫色字幕",
  description: "整句逐字扫色点亮，语义关键词扫过后过冲放大＋辉光，底部进度下划线同步推进",
  category: "captions",
  catalogGroup: "字幕与台词",
  glyph: "K",
  placement: "bottom",
  component: SrtKaraokeLine as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 582,
  bounds: { x: 0, y: 0, width: 1080, height: 260 },
  defaultPosition: { x: 0, y: 1500, scale: 1 },
  defaultProps: {
    enabled: true,
    fontSize: 64,
    baseColor: "#F5F7FA",
    dimColor: "#8C9BAE",
    accentMode: "auto",
    accentColor: "#FFC400",
    timeOffset: 0,
    cuesJson: "",
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示扫色字幕", default: true },
    fontSize: { type: "number", label: "字号(px)", default: 64, min: 30, max: 120, step: 2 },
    baseColor: { type: "color", label: "已读颜色", default: "#F5F7FA" },
    dimColor: { type: "color", label: "未读颜色", default: "#8C9BAE" },
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
