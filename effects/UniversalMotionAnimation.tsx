import React from "react";
import { Easing, useCurrentFrame } from "remotion";

export type UnifiedAnimationName = "auto" | "none" | "fade" | "slide-up" | "slide-left" | "zoom" | "tilt";

export const UNIFIED_ANIMATION_DEFAULTS = { enterAnimation: "auto", exitAnimation: "auto" } as const;
export const UNIFIED_ANIMATION_SCHEMA = {
  enterAnimation: { type: "select", label: "入场动画", default: "auto", options: [{ label: "保持组件原有", value: "auto" }, { label: "无动画", value: "none" }, { label: "淡入", value: "fade" }, { label: "向上滑入", value: "slide-up" }, { label: "向左滑入", value: "slide-left" }, { label: "缩放进入", value: "zoom" }, { label: "3D 倾斜进入", value: "tilt" }] },
  exitAnimation: { type: "select", label: "出场动画", default: "auto", options: [{ label: "保持组件原有", value: "auto" }, { label: "淡出", value: "fade" }, { label: "向下滑出", value: "slide-up" }, { label: "向右滑出", value: "slide-left" }, { label: "缩放退出", value: "zoom" }, { label: "3D 倾斜退出", value: "tilt" }] },
} as const;

type Props = { children: React.ReactNode; enterAnimation?: UnifiedAnimationName; exitAnimation?: UnifiedAnimationName; durationInFrames: number };
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const UnifiedMotionAnimation: React.FC<Props> = ({ children, enterAnimation = "auto", exitAnimation = "auto", durationInFrames }) => {
  const frame = useCurrentFrame();
  if ((enterAnimation === "auto" || enterAnimation === "none") && exitAnimation === "auto") return <>{children}</>;
  const enter = clamp(frame / 18);
  const exitFrames = Math.min(18, Math.max(12, Math.round(durationInFrames * .2)));
  const exit = clamp((frame - (durationInFrames - exitFrames)) / exitFrames);
  const easeEnter = 1 - Math.pow(1 - enter, 3);
  const easeExit = 1 - Math.pow(1 - exit, 3);
  const enterTransform = enterAnimation === "slide-up" ? "translateY(" + (38 * (1 - easeEnter)) + "px)" : enterAnimation === "slide-left" ? "translateX(" + (-38 * (1 - easeEnter)) + "px)" : enterAnimation === "zoom" ? "scale(" + (.86 + .14 * easeEnter) + ")" : enterAnimation === "tilt" ? "perspective(1200px) rotateY(-12deg) rotateX(6deg) scale(" + (.92 + .08 * easeEnter) + ")" : "";
  const exitTransform = exitAnimation === "slide-up" ? " translateY(" + (38 * easeExit) + "px)" : exitAnimation === "slide-left" ? " translateX(" + (38 * easeExit) + "px)" : exitAnimation === "zoom" ? " scale(" + (1 - .12 * easeExit) + ")" : exitAnimation === "tilt" ? " perspective(1200px) rotateY(12deg) rotateX(-5deg) scale(" + (1 - .06 * easeExit) + ")" : "";
  const opacity = (enterAnimation === "auto" || enterAnimation === "none" ? 1 : easeEnter) * (exitAnimation === "auto" ? 1 : 1 - easeExit);
  return <div data-unified-motion-animation style={{ width: "100%", height: "100%", opacity, transform: enterTransform + exitTransform, transformOrigin: "center center", willChange: "transform, opacity", pointerEvents: "none", backfaceVisibility: "hidden" }}>{children}</div>;
};
