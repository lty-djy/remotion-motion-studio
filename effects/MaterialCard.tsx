import React from "react";
import type { EffectDef } from "../registry";
import {
  MediaSpotlightCard,
  MediaSpotlightCardEffectDef,
  type MediaSpotlightCardProps,
} from "./MediaSpotlightCard";

const hiddenMaterialCardProps = new Set([
  "caption",
  "eyebrow",
  "accentColor",
  "textColor",
]);

const omitMaterialCardChromeProps = <T extends Record<string, unknown>>(
  record: T,
) =>
  Object.fromEntries(
    Object.entries(record).filter(([key]) => !hiddenMaterialCardProps.has(key)),
  );

export const MaterialCard: React.FC<MediaSpotlightCardProps> = (props) => (
  <MediaSpotlightCard
    {...props}
    showCaption={false}
    showEyebrow={false}
    showAccentMarker={false}
  />
);

export const MaterialCardEffectDef: EffectDef = {
  ...MediaSpotlightCardEffectDef,
  id: "MaterialCard",
  name: "素材卡",
  description: "纯图片或视频素材卡，支持自由调整裁剪位置。",
  component: MaterialCard as React.ComponentType<Record<string, unknown>>,
  defaultProps: omitMaterialCardChromeProps(
    MediaSpotlightCardEffectDef.defaultProps,
  ),
  propsSchema: omitMaterialCardChromeProps(
    MediaSpotlightCardEffectDef.propsSchema,
  ),
};
