import type { MotionComponentDefinition } from "./local-protocol";
import {
  EFFECT_SEMANTIC_CAPABILITIES,
  type EffectSemanticCapabilities,
} from "./effect-semantic-capabilities";
export {
  SEMANTIC_INTENT_DEFINITIONS,
  semanticIntentIdsFor,
} from "./effect-semantic-capabilities";

import { GlobalExpeditionEffectDef } from "./effects/GlobalExpedition";
import { SrtSemanticCaptionsEffectDef } from "./effects/SrtSemanticCaptions";
import { SrtCueTextEffectDef } from "./effects/SrtCueText";


import { TerminalPanelEffectDef } from "./effects/TerminalPanel";

import { SoftTeachingGlassPanelEffectDef } from "./effects/SoftTeachingGlassPanel";


import { PortraitChapterRailEffectDef } from "./effects/PortraitChapterRail";
import { PortraitIndexedChapterTitleEffectDef } from "./effects/PortraitIndexedChapterTitle";
import { PortraitInfoCalloutEffectDef } from "./effects/PortraitInfoCallout";
import { PortraitMetricDecisionEffectDef } from "./effects/PortraitMetricDecision";
import { PortraitDecisionTagStackEffectDef } from "./effects/PortraitDecisionTagStack";
import { PortraitStepChecklistEffectDef } from "./effects/PortraitStepChecklist";
import { PortraitStaggeredToolListEffectDef } from "./effects/PortraitStaggeredToolList";
import { PortraitPromptMistakeDiagnosisEffectDef } from "./effects/PortraitPromptMistakeDiagnosis";
import { PortraitWorkflowPrerequisiteEffectDef } from "./effects/PortraitWorkflowPrerequisite";
import { PortraitSkillIdentityCardEffectDef } from "./effects/PortraitSkillIdentityCard";
import { PortraitSkillSourceFusionEffectDef } from "./effects/PortraitSkillSourceFusion";
import { PortraitDesignRuleChecklistEffectDef } from "./effects/PortraitDesignRuleChecklist";
import { PortraitSkillResultComparisonEffectDef } from "./effects/PortraitSkillResultComparison";
import { PortraitPromptIterationShowcaseEffectDef } from "./effects/PortraitPromptIterationShowcase";
import { PortraitGsapSkillShowcaseEffectDef } from "./effects/PortraitGsapSkillShowcase";
import { PortraitSkillIdentityHeaderBarEffectDef } from "./effects/PortraitSkillIdentityHeaderBar";
import { PortraitCodeDecisionChecklistEffectDef } from "./effects/PortraitCodeDecisionChecklist";
import { PortraitBrowserRepairLoopEffectDef } from "./effects/PortraitBrowserRepairLoop";
import { PortraitAgentBrowserMediaEffectDef } from "./effects/PortraitAgentBrowserMedia";
import { PortraitMediaPosterRevealEffectDef } from "./effects/PortraitMediaPosterReveal";
import { PortraitSkillStepGridEffectDef } from "./effects/PortraitSkillStepGrid";
import { PortraitGapHeadlineEffectDef } from "./effects/PortraitGapHeadline";
import { PortraitAiOutputGapQuoteEffectDef } from "./effects/PortraitAiOutputGapQuote";
import { PortraitAiOutputGapComparisonEffectDef } from "./effects/PortraitAiOutputGapComparison";
import { PortraitRiskWarningEffectDef } from "./effects/PortraitRiskWarning";
import { PortraitNextEpisodeCtaEffectDef } from "./effects/PortraitNextEpisodeCta";
import { QuickSetupProofEffectDef } from "./effects/QuickSetupProof";
import { LegacyModelEliminationWarningEffectDef } from "./effects/LegacyModelEliminationWarning";
import { MediaSpotlightCardEffectDef } from "./effects/MediaSpotlightCard";
import { MaterialCardEffectDef } from "./effects/MaterialCard";

import { LEGACY_EFFECT_DEFS } from "./legacy-effects";

export type EffectDef = MotionComponentDefinition & {
  catalogGroup: string;
  placement: "left" | "right" | "top" | "bottom";
  semantic?: EffectSemanticCapabilities;
  arranger?: {
    compiler: "legacy-metric";
  };
};

export type RegisteredEffectDef = EffectDef & {
  semantic: EffectSemanticCapabilities;
};

const EFFECT_DEFINITIONS: EffectDef[] = [

  GlobalExpeditionEffectDef,
  SrtSemanticCaptionsEffectDef,
  SrtCueTextEffectDef,
  TerminalPanelEffectDef,
  SoftTeachingGlassPanelEffectDef,
  PortraitChapterRailEffectDef,
  PortraitIndexedChapterTitleEffectDef,

  PortraitInfoCalloutEffectDef,

  PortraitMetricDecisionEffectDef,

  PortraitDecisionTagStackEffectDef,

  PortraitStepChecklistEffectDef,

  PortraitStaggeredToolListEffectDef,

  PortraitPromptMistakeDiagnosisEffectDef,

  PortraitWorkflowPrerequisiteEffectDef,

  PortraitSkillIdentityCardEffectDef,

  PortraitSkillSourceFusionEffectDef,

  PortraitDesignRuleChecklistEffectDef,

  PortraitSkillResultComparisonEffectDef,

  PortraitPromptIterationShowcaseEffectDef,

  PortraitGsapSkillShowcaseEffectDef,

  PortraitSkillIdentityHeaderBarEffectDef,

  PortraitCodeDecisionChecklistEffectDef,
  PortraitBrowserRepairLoopEffectDef,
  PortraitAgentBrowserMediaEffectDef,
  PortraitMediaPosterRevealEffectDef,
  PortraitSkillStepGridEffectDef,
  PortraitGapHeadlineEffectDef,
  PortraitAiOutputGapQuoteEffectDef,
  PortraitAiOutputGapComparisonEffectDef,

  PortraitRiskWarningEffectDef,

  PortraitNextEpisodeCtaEffectDef,

  QuickSetupProofEffectDef,

  LegacyModelEliminationWarningEffectDef,

  MediaSpotlightCardEffectDef,

  MaterialCardEffectDef,

  ...LEGACY_EFFECT_DEFS,
];

const registeredIds = new Set(EFFECT_DEFINITIONS.map((definition) => definition.id));
const missingSemanticIds = EFFECT_DEFINITIONS.filter(
  (definition) => !EFFECT_SEMANTIC_CAPABILITIES[definition.id],
).map((definition) => definition.id);
const staleSemanticIds = Object.keys(EFFECT_SEMANTIC_CAPABILITIES).filter(
  (componentId) => !registeredIds.has(componentId),
);

if (missingSemanticIds.length > 0 || staleSemanticIds.length > 0) {
  throw new Error(
    [
      missingSemanticIds.length > 0
        ? `组件缺少语义能力：${missingSemanticIds.join(", ")}`
        : "",
      staleSemanticIds.length > 0
        ? `语义能力引用了不存在的组件：${staleSemanticIds.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("；"),
  );
}

export const EFFECT_REGISTRY: RegisteredEffectDef[] = EFFECT_DEFINITIONS.map(
  (definition) => ({
    ...definition,
    semantic: EFFECT_SEMANTIC_CAPABILITIES[definition.id],
  }),
);

export const EFFECT_REGISTRY_BY_ID = new Map(
  EFFECT_REGISTRY.map((definition) => [definition.id, definition]),
);

export const AI_ARRANGEABLE_COMPONENT_IDS = EFFECT_REGISTRY.filter(
  (definition) => definition.arranger,
).map((definition) => definition.id);
