import type { MotionComponentDefinition } from "./local-protocol";

import { GlobalExpeditionEffectDef } from "./effects/GlobalExpedition";
import { SrtSemanticCaptionsEffectDef } from "./effects/SrtSemanticCaptions";
import { SrtCueTextEffectDef } from "./effects/SrtCueText";



import { TerminalPanelEffectDef } from "./effects/TerminalPanel";

import { SoftTeachingGlassPanelEffectDef } from "./effects/SoftTeachingGlassPanel";


import { PortraitChapterRailEffectDef } from "./effects/PortraitChapterRail";
import { PortraitInfoCalloutEffectDef } from "./effects/PortraitInfoCallout";
import { PortraitMetricDecisionEffectDef } from "./effects/PortraitMetricDecision";
import { PortraitDecisionTagStackEffectDef } from "./effects/PortraitDecisionTagStack";
import { PortraitStepChecklistEffectDef } from "./effects/PortraitStepChecklist";
import { PortraitRiskWarningEffectDef } from "./effects/PortraitRiskWarning";
import { PortraitNextEpisodeCtaEffectDef } from "./effects/PortraitNextEpisodeCta";
import { QuickSetupProofEffectDef } from "./effects/QuickSetupProof";
import { LegacyModelEliminationWarningEffectDef } from "./effects/LegacyModelEliminationWarning";
import { MediaSpotlightCardEffectDef } from "./effects/MediaSpotlightCard";
import { MaterialCardEffectDef } from "./effects/MaterialCard";
import { WORKBUDDY_EFFECT_DEFS } from "./effects/WorkBuddyCards";

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
  TerminalPanelEffectDef,
  SoftTeachingGlassPanelEffectDef,
  PortraitChapterRailEffectDef,

  PortraitInfoCalloutEffectDef,

  PortraitMetricDecisionEffectDef,

  PortraitDecisionTagStackEffectDef,

  PortraitStepChecklistEffectDef,

  PortraitRiskWarningEffectDef,

  PortraitNextEpisodeCtaEffectDef,

  QuickSetupProofEffectDef,

  LegacyModelEliminationWarningEffectDef,

  MediaSpotlightCardEffectDef,

  MaterialCardEffectDef,

  ...WORKBUDDY_EFFECT_DEFS,

  ...LEGACY_EFFECT_DEFS,
];

export const EFFECT_REGISTRY_BY_ID = new Map(
  EFFECT_REGISTRY.map((definition) => [definition.id, definition]),
);

export const AI_ARRANGEABLE_COMPONENT_IDS = EFFECT_REGISTRY.filter(
  (definition) => definition.arranger,
).map((definition) => definition.id);
