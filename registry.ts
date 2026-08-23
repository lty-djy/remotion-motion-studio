import type { MotionComponentDefinition } from "./local-protocol";
import { ChapterBarEffectDef } from "./effects/ChapterBar";
import { GlobalExpeditionEffectDef } from "./effects/GlobalExpedition";
import { SrtSemanticCaptionsEffectDef } from "./effects/SrtSemanticCaptions";
import { SrtCueTextEffectDef } from "./effects/SrtCueText";
import { SrtKaraokeLineEffectDef } from "./effects/SrtKaraokeLine";
import { SrtProgressRailEffectDef } from "./effects/SrtProgressRail";
import { SrtSemanticBadgeEffectDef } from "./effects/SrtSemanticBadge";
import { FlowPipelineEffectDef } from "./effects/FlowPipeline";



import { LEGACY_EFFECT_DEFS } from "./legacy-effects";

export type EffectDef = MotionComponentDefinition & {
  catalogGroup: string;
  placement: "left" | "right" | "top" | "bottom";
};

export const EFFECT_REGISTRY: EffectDef[] = [
  ChapterBarEffectDef,

  GlobalExpeditionEffectDef,

  SrtSemanticCaptionsEffectDef,

  SrtCueTextEffectDef,

  SrtKaraokeLineEffectDef,

  SrtProgressRailEffectDef,

  SrtSemanticBadgeEffectDef,

  FlowPipelineEffectDef,

  ...LEGACY_EFFECT_DEFS,
];

export const EFFECT_REGISTRY_BY_ID = new Map(
  EFFECT_REGISTRY.map((definition) => [definition.id, definition]),
);
