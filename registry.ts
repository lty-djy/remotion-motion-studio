import type { MotionComponentDefinition } from "./local-protocol";
import { ChapterBarEffectDef } from "./effects/ChapterBar";
import { GlobalExpeditionEffectDef } from "./effects/GlobalExpedition";
import { SrtSemanticCaptionsEffectDef } from "./effects/SrtSemanticCaptions";
import { SrtCueTextEffectDef } from "./effects/SrtCueText";

import { SrtProgressRailEffectDef } from "./effects/SrtProgressRail";

import { FlowPipelineEffectDef } from "./effects/FlowPipeline";

import { TerminalPanelEffectDef } from "./effects/TerminalPanel";
import { TerminalStepHeroEffectDef } from "./effects/TerminalStepHero";
import { SoftTeachingStepRailEffectDef } from "./effects/SoftTeachingStepRail";
import { SoftTeachingGlassPanelEffectDef } from "./effects/SoftTeachingGlassPanel";
import { SoftTeachingLibraryGridEffectDef } from "./effects/SoftTeachingLibraryGrid";
import { SoftTeachingIncrementBadgeEffectDef } from "./effects/SoftTeachingIncrementBadge";

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

  SrtProgressRailEffectDef,

  FlowPipelineEffectDef,

  TerminalPanelEffectDef,

  TerminalStepHeroEffectDef,

  SoftTeachingStepRailEffectDef,

  SoftTeachingGlassPanelEffectDef,

  SoftTeachingLibraryGridEffectDef,

  SoftTeachingIncrementBadgeEffectDef,

  ...LEGACY_EFFECT_DEFS,
];

export const EFFECT_REGISTRY_BY_ID = new Map(
  EFFECT_REGISTRY.map((definition) => [definition.id, definition]),
);
