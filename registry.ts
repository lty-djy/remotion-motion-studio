import type { MotionComponentDefinition } from "./local-protocol";
import { ChapterBarEffectDef } from "./effects/ChapterBar";



import { LEGACY_EFFECT_DEFS } from "./legacy-effects";

export type EffectDef = MotionComponentDefinition & {
  catalogGroup: string;
  placement: "left" | "right" | "top";
};

export const EFFECT_REGISTRY: EffectDef[] = [
  ChapterBarEffectDef,



  ...LEGACY_EFFECT_DEFS,
];

export const EFFECT_REGISTRY_BY_ID = new Map(
  EFFECT_REGISTRY.map((definition) => [definition.id, definition]),
);
