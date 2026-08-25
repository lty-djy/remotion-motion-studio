import type { MotionComponentDefinition } from "./local-protocol";

import { GlobalExpeditionEffectDef } from "./effects/GlobalExpedition";
import { SrtSemanticCaptionsEffectDef } from "./effects/SrtSemanticCaptions";
import { SrtCueTextEffectDef } from "./effects/SrtCueText";


import { FlowPipelineEffectDef } from "./effects/FlowPipeline";

import { TerminalPanelEffectDef } from "./effects/TerminalPanel";
import { TerminalStepHeroEffectDef } from "./effects/TerminalStepHero";
import { SoftTeachingStepRailEffectDef } from "./effects/SoftTeachingStepRail";
import { SoftTeachingGlassPanelEffectDef } from "./effects/SoftTeachingGlassPanel";
import { SoftTeachingLibraryGridEffectDef } from "./effects/SoftTeachingLibraryGrid";
import { SoftTeachingIncrementBadgeEffectDef } from "./effects/SoftTeachingIncrementBadge";
import { PortraitChapterRailEffectDef } from "./effects/PortraitChapterRail";
import { PortraitKeywordBurstEffectDef } from "./effects/PortraitKeywordBurst";
import { PortraitInfoCalloutEffectDef } from "./effects/PortraitInfoCallout";
import { PortraitMetricDecisionEffectDef } from "./effects/PortraitMetricDecision";
import { PortraitDecisionTagStackEffectDef } from "./effects/PortraitDecisionTagStack";
import { PortraitStepChecklistEffectDef } from "./effects/PortraitStepChecklist";
import { PortraitRiskWarningEffectDef } from "./effects/PortraitRiskWarning";

import { LEGACY_EFFECT_DEFS } from "./legacy-effects";

export type EffectDef = MotionComponentDefinition & {
  catalogGroup: string;
  placement: "left" | "right" | "top" | "bottom";
  arranger?: {
    compiler: "legacy-metric";
  };
};

export const EFFECT_REGISTRY: EffectDef[] = [

  GlobalExpeditionEffectDef,

  SrtSemanticCaptionsEffectDef,

  SrtCueTextEffectDef,

  FlowPipelineEffectDef,

  TerminalPanelEffectDef,

  TerminalStepHeroEffectDef,

  SoftTeachingStepRailEffectDef,

  SoftTeachingGlassPanelEffectDef,

  SoftTeachingLibraryGridEffectDef,

  SoftTeachingIncrementBadgeEffectDef,

  PortraitChapterRailEffectDef,

  PortraitKeywordBurstEffectDef,

  PortraitInfoCalloutEffectDef,

  PortraitMetricDecisionEffectDef,

  PortraitDecisionTagStackEffectDef,

  PortraitStepChecklistEffectDef,

  PortraitRiskWarningEffectDef,

  ...LEGACY_EFFECT_DEFS,
];

export const EFFECT_REGISTRY_BY_ID = new Map(
  EFFECT_REGISTRY.map((definition) => [definition.id, definition]),
);

export const AI_ARRANGEABLE_COMPONENT_IDS = EFFECT_REGISTRY.filter(
  (definition) => definition.arranger,
).map((definition) => definition.id);
