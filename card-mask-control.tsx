import React from "react";
import type { CardMaskSettings, MotionBounds, MotionPosition } from "./local-protocol";

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

export const DEFAULT_CARD_MASK: CardMaskSettings = {
  enabled: true,
  strength: 0.32,
  opacity: 1,
  feather: 0.16,
  rangeTop: 0.42,
  rangeRight: 0.42,
  rangeBottom: 0.42,
  rangeLeft: 0.42,
  offsetX: 0,
  offsetY: 0,
};

export const normalizeCardMask = (
  value?: Partial<CardMaskSettings> | null,
): CardMaskSettings => ({
  enabled: value?.enabled !== false,
  strength: clamp(value?.strength, 0, 1, DEFAULT_CARD_MASK.strength),
  opacity: clamp(value?.opacity, 0, 1, DEFAULT_CARD_MASK.opacity),
  feather: clamp(value?.feather, 0, 1, DEFAULT_CARD_MASK.feather),
  rangeTop: clamp(value?.rangeTop, 0, 1, DEFAULT_CARD_MASK.rangeTop),
  rangeRight: clamp(value?.rangeRight, 0, 1, DEFAULT_CARD_MASK.rangeRight),
  rangeBottom: clamp(value?.rangeBottom, 0, 1, DEFAULT_CARD_MASK.rangeBottom),
  rangeLeft: clamp(value?.rangeLeft, 0, 1, DEFAULT_CARD_MASK.rangeLeft),
  offsetX: clamp(value?.offsetX, -1, 1, DEFAULT_CARD_MASK.offsetX),
  offsetY: clamp(value?.offsetY, -1, 1, DEFAULT_CARD_MASK.offsetY),
});

export const CardMaskLayer = ({
  settings,
  bounds,
  position,
  scaleMultiplier = 1,
}: {
  settings?: Partial<CardMaskSettings> | null;
  bounds: MotionBounds;
  position: MotionPosition;
  scaleMultiplier?: number;
}) => {
  const mask = normalizeCardMask(settings);
  if (!mask.enabled) return null;
  const cardWidth = bounds.width * position.scale * scaleMultiplier;
  const cardHeight = bounds.height * position.scale * scaleMultiplier;
  const top = cardHeight * mask.rangeTop;
  const right = cardWidth * mask.rangeRight;
  const bottom = cardHeight * mask.rangeBottom;
  const left = cardWidth * mask.rangeLeft;
  const width = cardWidth + left + right;
  const height = cardHeight + top + bottom;
  const featherX = width * mask.feather * 0.35;
  const featherY = height * mask.feather * 0.35;
  const featherMask = mask.feather > 0
    ? `linear-gradient(to right, transparent 0, #000 ${featherX}px, #000 calc(100% - ${featherX}px), transparent 100%), linear-gradient(to bottom, transparent 0, #000 ${featherY}px, #000 calc(100% - ${featherY}px), transparent 100%)`
    : undefined;

  return (
    <div
      data-card-mask-layer
      aria-hidden="true"
      style={{
        position: "absolute",
        left: position.x - left + cardWidth * mask.offsetX,
        top: position.y - top + cardHeight * mask.offsetY,
        width,
        height,
        backgroundColor: `rgba(0, 0, 0, ${mask.strength * mask.opacity})`,
        WebkitMaskImage: featherMask,
        WebkitMaskComposite: featherMask ? "source-in" : undefined,
        maskImage: featherMask,
        maskComposite: featherMask ? "intersect" : undefined,
        transform: "translateZ(0)",
      }}
    />
  );
};
