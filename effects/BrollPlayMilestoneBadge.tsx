import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

const SANS = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';

type Props = {
  badgeTop?: number;
  badgeWidth?: number;
  rotationDegrees?: number;
  badgeEnterSeconds?: number;
  badgeKicker?: string;
  badgePrefix?: string;
  badgeNumber?: string;
  accentColor?: string;
  floatAmplitude?: number;
};

export const BrollPlayMilestoneBadge: React.FC<Props> = ({
  badgeTop = 725,
  badgeWidth = 520,
  rotationDegrees = 0,
  badgeEnterSeconds = 0.45,
  badgeKicker = "2 EPISODES · 两期视频",
  badgePrefix = "播放破",
  badgeNumber = "500万",
  accentColor = "#F5C15C",
  floatAmplitude = 8,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const isPortrait = height > width;
  const stageWidth = isPortrait ? 1080 : 1920;
  const stageHeight = isPortrait ? 1920 : 1080;
  const stageScale = Math.max(width / stageWidth, height / stageHeight);
  const safeRotationDegrees = Math.max(-180, Math.min(180, Number(rotationDegrees) || 0));
  const safeBadgeWidth = Math.min(
    Math.max(320, Number(badgeWidth) || 520),
    stageWidth - 80,
  );
  // Keep the saved Y position proportional when the canvas switches orientation.
  // The control remains expressed in the familiar 1920x1080 coordinate system,
  // while portrait output receives the equivalent position in its 1080x1920 stage.
  const normalizedBadgeTop = ((Number(badgeTop) || 725) / 1080) * stageHeight;
  const safeBadgeTop = Math.max(
    40,
    Math.min(normalizedBadgeTop, stageHeight - 220),
  );
  const badgeDelay = 0;
  const badgeEnter = spring({
    frame: frame - badgeDelay,
    fps,
    durationInFrames: Math.max(8, Math.round(badgeEnterSeconds * fps)),
    config: { damping: 12, stiffness: 160, mass: 0.9 },
  });
  const bob =
    frame > badgeDelay
      ? Math.sin((frame / fps) * 1.1) * (floatAmplitude * 0.5)
      : 0;
  const glowOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      data-effect="BrollPlayMilestoneBadge"
      style={{ overflow: "hidden", pointerEvents: "none" }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: stageWidth,
          height: stageHeight,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
          transformOrigin: "center center",
          fontFamily: SANS,
        }}
      >
        <div
          data-effect-part="play-badge"
          style={{
            position: "absolute",
            left: "50%",
            top: safeBadgeTop,
            transform: `translateX(-50%) translateY(${bob}px) rotate(${safeRotationDegrees}deg) scale(${0.5 + badgeEnter * 0.5})`,
            transformOrigin: "center center",
            width: safeBadgeWidth,
            boxSizing: "border-box",
            padding: "18px 44px",
            borderRadius: 18,
            border: `2px solid ${accentColor}`,
            backgroundColor: "rgba(16,13,7,0.92)",
            boxShadow: `0 0 ${34 * glowOpacity}px color-mix(in srgb, ${accentColor} 28%, transparent), 0 20px 44px rgba(0,0,0,0.45)`,
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

export const BrollPlayMilestoneBadgeEffectDef: EffectDef = {
  id: "BrollPlayMilestoneBadge",
  name: "播放量里程碑卡",
  description:
    "横屏/竖屏口播 b-roll：以金色边框徽章突出两期内容、播放量或阶段成绩，适合展示数据成果与里程碑。",
  category: "metric",
  catalogGroup: "数字与指标",
  glyph: "MILE",
  placement: "full",
  component: BrollPlayMilestoneBadge as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 180,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: {
    badgeTop: 725,
    badgeWidth: 520,
    rotationDegrees: 0,
    badgeEnterSeconds: 0.45,
    badgeKicker: "2 EPISODES · 两期视频",
    badgePrefix: "播放破",
    badgeNumber: "500万",
    accentColor: "#F5C15C",
    floatAmplitude: 8,
  },
  propsSchema: {
    badgeTop: { type: "number", label: "徽章位置Y(px)", default: 725, min: 300, max: 960, step: 1 },
    badgeWidth: { type: "number", label: "徽章宽度(px)", default: 520, min: 320, max: 900, step: 10 },
    rotationDegrees: { type: "number", label: "旋转角度(°)", default: 0, min: -180, max: 180, step: 1 },
    badgeEnterSeconds: { type: "number", label: "入场动画时长(秒)", default: 0.45, min: 0.1, max: 3, step: 0.05 },
    badgeKicker: { type: "text", label: "徽章小字" },
    badgePrefix: { type: "text", label: "徽章前缀" },
    badgeNumber: { type: "text", label: "徽章数字" },
    accentColor: { type: "color", label: "强调色", default: "#F5C15C" },
    floatAmplitude: { type: "number", label: "悬浮幅度(px)", default: 8, min: 0, max: 30, step: 1 },
  },
};
