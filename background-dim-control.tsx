import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BackgroundDimMode, MotionInstance } from "./local-protocol";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothStep = (value: number) => {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
};

/**
 * These layers are intentionally independent of the background dim system:
 * ChapterBar is a persistent chapter marker and SrtSemanticCaptions is the
 * subtitle track. Neither should make the video behind it darker.
 */
export const isBackgroundDimExcludedInstance = (
  instance: Pick<MotionInstance, "componentId">,
) =>
  instance.componentId === "ChapterBar" ||
  instance.componentId === "SrtSemanticCaptions";

const getInstanceDimOpacity = (instance: MotionInstance, frame: number) => {
  // 全局开关负责总启停；卡片开关是单独关闭该卡片的例外，旧时间线缺少字段时默认参与。
  if (
    instance.visible === false ||
    instance.backgroundDimEnabled === false ||
    isBackgroundDimExcludedInstance(instance)
  ) {
    return 0;
  }
  const localFrame = frame - Math.max(0, Math.round(instance.startFrame));
  const duration = Math.max(3, Math.round(instance.durationInFrames));
  if (localFrame < 0 || localFrame >= duration) return 0;

  // 背景跟随卡片出现和退出；时间较短的卡片会自动缩短过渡，避免前后淡化重叠。
  const fadeFrames = Math.min(12, Math.max(3, Math.floor(duration / 2)));
  const entering = smoothStep((localFrame + 1) / fadeFrames);
  const exiting = smoothStep((duration - localFrame) / fadeFrames);
  return Math.min(entering, exiting);
};

const getBackground = (strength: number, mode: BackgroundDimMode) => {
  const black = `rgba(0, 0, 0, ${strength.toFixed(3)})`;
  if (mode === "left") {
    return `linear-gradient(90deg, ${black} 0%, ${black} 42%, transparent 100%)`;
  }
  if (mode === "right") {
    return `linear-gradient(270deg, ${black} 0%, ${black} 42%, transparent 100%)`;
  }
  return black;
};

export const BackgroundDimLayer = ({
  enabled,
  strength,
  mode,
  instances,
  hasBackground = true,
}: {
  enabled: boolean;
  strength: number;
  mode: BackgroundDimMode;
  instances: MotionInstance[];
  hasBackground?: boolean;
}) => {
  const frame = useCurrentFrame();
  if (!enabled || !hasBackground) return null;
  const activity = instances.reduce(
    (maximum, instance) => Math.max(maximum, getInstanceDimOpacity(instance, frame)),
    0,
  );
  if (activity <= 0) return null;
  const opacity = clamp01(strength) * activity;
  return (
    <AbsoluteFill
      aria-hidden="true"
      data-background-dim-layer
      style={{
        zIndex: 10,
        pointerEvents: "none",
        background: getBackground(opacity, mode),
      }}
    />
  );
};
