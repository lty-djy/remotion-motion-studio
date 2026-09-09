import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

const SANS = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';

type Props = {
  enabled?: boolean;
  dimOpacity?: number;
  poster1Url?: string;
  poster2Url?: string;
  posterWidth?: number;
  tiltDeg?: number;
  badgeKicker?: string;
  badgePrefix?: string;
  badgeNumber?: string;
  accentColor?: string;
  floatAmplitude?: number;
};

const Poster: React.FC<{
  url: string;
  width: number;
  left: number;
  top: number;
  tilt: number;
  rotate: number;
  phase: number;
  delay: number;
  floatAmplitude: number;
}> = ({ url, width, left, top, tilt, rotate, phase, delay, floatAmplitude }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.9 },
  });
  const settled = frame > delay;
  const bob = settled ? Math.sin((frame / fps) * 1.2 + phase) * floatAmplitude : 0;

  return (
    <div
      data-effect-part="poster"
      style={{
        position: "absolute",
        left,
        top,
        width,
        height: Math.round(width * (4 / 3)),
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.22)",
        backgroundColor: "#121319",
        boxShadow: "0 34px 80px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)",
        opacity: enter,
        transform: `perspective(1500px) translateY(${(1 - enter) * 200 + bob}px) rotateY(${tilt}deg) rotate(${rotate}deg) scale(${0.94 + enter * 0.06})`,
        transformOrigin: "center center",
      }}
    >
      {url ? (
        <Img
          src={url}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background:
              "radial-gradient(circle at 50% 34%, rgba(255,255,255,0.08), transparent 40%), linear-gradient(150deg, #20222C 0%, #0E0F14 100%)",
            color: "rgba(255,255,255,0.45)",
            fontFamily: SANS,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          上传海报图片
        </div>
      )}
    </div>
  );
};

export const BrollEpisodePosterDuo: React.FC<Props> = ({
  enabled = true,
  dimOpacity = 0.55,
  poster1Url = "",
  poster2Url = "",
  posterWidth = 420,
  tiltDeg = 12,
  badgeKicker = "2 EPISODES · 两期视频",
  badgePrefix = "播放破",
  badgeNumber = "500万",
  accentColor = "#F5C15C",
  floatAmplitude = 8,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  if (!enabled) return null;

  const stageScale = Math.max(width / 1920, height / 1080);
  const posterHeight = Math.round(posterWidth * (4 / 3));
  const pairGap = Math.round(posterWidth * 0.16);
  const pairWidth = posterWidth * 2 + pairGap;
  const leftPosterLeft = Math.round((1920 - pairWidth) / 2);
  const posterTop = Math.max(96, Math.round((830 - posterHeight) / 2));

  const badgeDelay = Math.round(fps * 1.05);
  const badgeEnter = spring({
    frame: frame - badgeDelay,
    fps,
    config: { damping: 12, stiffness: 160, mass: 0.9 },
  });
  const bob = frame > badgeDelay ? Math.sin((frame / fps) * 1.1) * (floatAmplitude * 0.5) : 0;

  const dim = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill data-effect="BrollEpisodePosterDuo" style={{ overflow: "hidden", pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(5,6,10,0.66) 0%, rgba(5,6,10,0.38) 50%, rgba(5,6,10,0.66) 100%)",
          opacity: dim * Math.min(1, Math.max(0, dimOpacity)),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 1920,
          height: 1080,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
          transformOrigin: "center center",
          fontFamily: SANS,
        }}
      >
        <Poster
          url={poster1Url}
          width={posterWidth}
          left={leftPosterLeft}
          top={posterTop}
          tilt={tiltDeg}
          rotate={-1.5}
          phase={0}
          delay={Math.round(fps * 0.15)}
          floatAmplitude={floatAmplitude}
        />
        <Poster
          url={poster2Url}
          width={posterWidth}
          left={leftPosterLeft + posterWidth + pairGap}
          top={posterTop + 22}
          tilt={-tiltDeg}
          rotate={1.5}
          phase={1.9}
          delay={Math.round(fps * 0.3)}
          floatAmplitude={floatAmplitude}
        />

        <div
          data-effect-part="play-badge"
          style={{
            position: "absolute",
            left: "50%",
            top: posterTop + posterHeight + 30,
            transform: `translateX(-50%) translateY(${bob}px) scale(${0.5 + badgeEnter * 0.5})`,
            transformOrigin: "center center",
            minWidth: 520,
            boxSizing: "border-box",
            padding: "18px 44px",
            borderRadius: 18,
            border: `2px solid ${accentColor}`,
            backgroundColor: "rgba(16,13,7,0.92)",
            boxShadow: `0 0 34px color-mix(in srgb, ${accentColor} 28%, transparent), 0 20px 44px rgba(0,0,0,0.45)`,
            textAlign: "center",
            opacity: badgeEnter,
          }}
        >
          {badgeKicker ? (
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 6,
                color: "rgba(255,255,255,0.82)",
              }}
            >
              {badgeKicker}
            </div>
          ) : null}
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 34, fontWeight: 800, color: "#FFFFFF" }}>
              {badgePrefix}
            </span>
            <span
              style={{
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 1.05,
                backgroundImage: `linear-gradient(180deg, #FFE9BC 8%, ${accentColor} 58%, #D98F2B 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {badgeNumber}
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const BrollEpisodePosterDuoEffectDef: EffectDef = {
  id: "BrollEpisodePosterDuo",
  name: "往期海报回顾",
  description:
    "横屏口播 b-roll：背景压暗，两张竖版海报带 3D 倾斜先后升入并悬浮，随后金色播放量徽章弹出，适合回顾往期内容或展示成绩。",
  category: "media",
  catalogGroup: "媒体展示组件",
  glyph: "DUO",
  placement: "full",
  component: BrollEpisodePosterDuo as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 180,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: {
    enabled: true,
    dimOpacity: 0.55,
    poster1Url: "",
    poster2Url: "",
    posterWidth: 420,
    tiltDeg: 12,
    badgeKicker: "2 EPISODES · 两期视频",
    badgePrefix: "播放破",
    badgeNumber: "500万",
    accentColor: "#F5C15C",
    floatAmplitude: 8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示往期海报回顾", default: true },
    dimOpacity: { type: "number", label: "背景压暗强度", default: 0.55, min: 0, max: 0.9, step: 0.05 },
    poster1Url: { type: "text", label: "左海报图片" },
    poster2Url: { type: "text", label: "右海报图片" },
    posterWidth: { type: "number", label: "海报宽度(px)", default: 420, min: 220, max: 560, step: 10 },
    tiltDeg: { type: "number", label: "3D 倾斜角度(度)", default: 12, min: 0, max: 30, step: 1 },
    badgeKicker: { type: "text", label: "徽章小字" },
    badgePrefix: { type: "text", label: "徽章前缀" },
    badgeNumber: { type: "text", label: "徽章数字" },
    accentColor: { type: "color", label: "金色强调色", default: "#F5C15C" },
    floatAmplitude: { type: "number", label: "悬浮幅度(px)", default: 8, min: 0, max: 30, step: 1 },
  },
};
