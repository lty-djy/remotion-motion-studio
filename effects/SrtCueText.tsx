import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";
import {
  HF_BASE,
  HF_DIM,
  HF_LINK,
  backOut,
  clamp01,
  matchSemantics,
  mixColor,
  pow2Out,
  resolveAccent,
  resolveCues,
  withAlpha,
} from "./captionKit";

type SrtCueTextProps = {
  enabled?: boolean;
  fontSize?: number;
  baseColor?: string;
  dimColor?: string;
  accentMode?: string;
  accentColor?: string;
  sweep?: boolean;
  showTagChip?: boolean;
  timeOffset?: number;
  cuesJson?: string;
};

export const SrtCueText: React.FC<SrtCueTextProps> = ({
  enabled = true,
  fontSize = 56,
  baseColor = HF_BASE,
  dimColor = HF_DIM,
  accentMode = "auto",
  accentColor = "#FFC400",
  sweep = false,
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
  const cue = cues.find((c) => t >= c.start && t < c.end) ?? null;

  if (!cue) {
    return (
      <div
        data-effect="SrtCueText"
        style={{ width: 1080, height: 220, position: "relative", background: "transparent" }}
      />
    );
  }

  const semantic = matchSemantics(cue.text);
  const accent = resolveAccent(accentMode, accentColor, semantic.tag);
  const fs = Math.max(28, Math.min(110, fontSize));

  const age = t - cue.start;
  const dur = Math.max(0.2, cue.end - cue.start);
  const enterP = pow2Out(age / 0.35);
  const remain = cue.end - t;
  const exitFade = remain < 0.18 ? clamp01(remain / 0.18) : 1;
  const opacity = enterP * exitFade;
  const translateY = (1 - enterP) * 24 - (remain < 0.18 ? (1 - exitFade) * 14 : 0);

  const kwAt = semantic.keyword ? cue.text.indexOf(semantic.keyword) : -1;
  const pre = kwAt >= 0 ? cue.text.slice(0, kwAt) : cue.text;
  const kw = kwAt >= 0 ? semantic.keyword : "";
  const post = kwAt >= 0 ? cue.text.slice(kwAt + kw.length) : "";

  const kwPop = kw ? backOut(clamp01((age - 0.12) / 0.4), 1.7) : 1;
  const glowPhase = clamp01((age - 0.45) / 0.4);
  const glow = kw ? Math.sin(Math.PI * glowPhase) * 22 : 0;

  const allChars = [...cue.text];
  const kwCharStart = kwAt >= 0 ? [...pre].length : -1;
  const kwCharEnd = kwAt >= 0 ? kwCharStart + [...kw].length : -1;
  const sweepP = clamp01(age / dur);

  return (
    <div
      data-effect="SrtCueText"
      style={{
        width: 1080,
        height: 220,
        position: "relative",
        background: "transparent",
        fontFamily:
          'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "6%",
          right: "6%",
          bottom: 34,
          textAlign: "center",
          opacity,
          transform: `translateY(${translateY.toFixed(2)}px)`,
        }}
      >
        {showTagChip && semantic.tag ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              padding: "4px 14px",
              borderRadius: 999,
              background: "rgba(0,122,255,0.15)",
              color: HF_LINK,
              fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
              fontSize: Math.round(fs * 0.3),
              fontWeight: 700,
              letterSpacing: 4,
              opacity: enterP,
            }}
          >
            {`${semantic.tag.toUpperCase()} · 语义匹配`}
          </div>
        ) : null}
        <div
          style={{
            fontSize: fs,
            lineHeight: 1.35,
            fontWeight: 600,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          {sweep
            ? allChars.map((ch, i) => {
                const isKw = i >= kwCharStart && i < kwCharEnd;
                const target = isKw ? accent : baseColor;
                const local = clamp01((sweepP * (allChars.length + 3) - i) / 3);
                const color =
                  local <= 0 ? dimColor : mixColor(dimColor, target, local);
                return (
                  <span key={`${i}-${ch}`} style={{ color }}>
                    {ch}
                  </span>
                );
              })
            : [
                <span key="pre" style={{ color: baseColor }}>
                  {pre}
                </span>,
                kw ? (
                  <span
                    key="kw"
                    style={{
                      display: "inline-block",
                      color: accent,
                      fontWeight: 850,
                      transform: `scale(${kwPop.toFixed(3)})`,
                      transformOrigin: "50% 80%",
                      textShadow: `0 0 ${glow.toFixed(1)}px ${withAlpha(
                        accent,
                        0.55,
                      )}`,
                    }}
                  >
                    {kw}
                  </span>
                ) : null,
                <span key="post" style={{ color: baseColor }}>
                  {post}
                </span>,
              ]}
        </div>
      </div>
    </div>
  );
};

export const SrtCueTextEffectDef: EffectDef = {
  id: "SrtCueText",
  name: "主字幕·关键词条",
  description: "GSAP 风格底部主字幕：逐句滑入，语义关键词过冲弹入＋琥珀辉光脉冲，可开逐字扫色",
  category: "captions",
  catalogGroup: "口播HUD常驻卡",
  glyph: "字",
  placement: "bottom",
  component: SrtCueText as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 582,
  bounds: { x: 0, y: 0, width: 1080, height: 220 },
  defaultPosition: { x: 0, y: 1560, scale: 1 },
  defaultProps: {
    enabled: true,
    fontSize: 56,
    baseColor: "#F5F7FA",
    dimColor: "#8C9BAE",
    accentMode: "auto",
    accentColor: "#FFC400",
    sweep: false,
    showTagChip: true,
    timeOffset: 0,
    cuesJson: "",
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示主字幕", default: true },
    fontSize: { type: "number", label: "字号(px)", default: 56, min: 28, max: 110, step: 2 },
    baseColor: { type: "color", label: "正文颜色", default: "#F5F7FA" },
    dimColor: { type: "color", label: "扫色起始色", default: "#8C9BAE" },
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
    sweep: { type: "boolean", label: "逐字扫色", default: false },
    showTagChip: { type: "boolean", label: "显示语义标签", default: true },
    timeOffset: { type: "number", label: "时间偏移(秒)", default: 0, min: -10, max: 10, step: 0.05 },
    cuesJson: { type: "text", label: "自定义台词JSON(start/end/text)", default: "" },
  },
};

