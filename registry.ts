import type { MotionComponentDefinition, MotionPosition } from "./local-protocol";
import {
  EFFECT_SEMANTIC_CAPABILITIES,
  type EffectSemanticCapabilities,
} from "./effect-semantic-capabilities";
export {
  SEMANTIC_INTENT_DEFINITIONS,
  semanticIntentIdsFor,
} from "./effect-semantic-capabilities";

import { GlobalExpeditionEffectDef } from "./effects/GlobalExpedition";
import { ChapterBarEffectDef } from "./effects/ChapterBar";

import { FocusCamMoveEffectDef } from "./effects/FocusCamMove";
import { SrtSemanticCaptionsEffectDef } from "./effects/SrtSemanticCaptions";
import { SrtCueTextEffectDef } from "./effects/SrtCueText";


import { TerminalPanelEffectDef } from "./effects/TerminalPanel";
import { Terminal3DEffectDef } from "./effects/Terminal3D";
import { UNIFIED_ANIMATION_DEFAULTS, UNIFIED_ANIMATION_SCHEMA } from "./effects/UniversalMotionAnimation";


import { PortraitChapterRailEffectDef } from "./effects/PortraitChapterRail";
import { PortraitIndexedChapterTitleEffectDef } from "./effects/PortraitIndexedChapterTitle";
import { PortraitInfoCalloutEffectDef } from "./effects/PortraitInfoCallout";
import { PortraitMetricDecisionEffectDef } from "./effects/PortraitMetricDecision";
import { PortraitDecisionTagStackEffectDef } from "./effects/PortraitDecisionTagStack";
import { PortraitStepStageTitleEffectDef } from "./effects/PortraitStepStageTitle";
import { PortraitStepNumberListEffectDef } from "./effects/PortraitStepNumberList";
import { PortraitStaggeredToolListEffectDef } from "./effects/PortraitStaggeredToolList";
import { PortraitToolBadgeListEffectDef } from "./effects/PortraitToolBadgeList";
import { PortraitToolListTitleEffectDef } from "./effects/PortraitToolListTitle";
import { PortraitPromptMistakeDiagnosisEffectDef } from "./effects/PortraitPromptMistakeDiagnosis";
import { PortraitWorkflowPrerequisiteEffectDef } from "./effects/PortraitWorkflowPrerequisite";
import { PortraitSkillSourceFusionEffectDef } from "./effects/PortraitSkillSourceFusion";
import { PortraitDesignRuleChecklistEffectDef } from "./effects/PortraitDesignRuleChecklist";
import { PortraitSkillResultComparisonEffectDef } from "./effects/PortraitSkillResultComparison";
import { PortraitPromptIterationShowcaseEffectDef } from "./effects/PortraitPromptIterationShowcase";
import { PortraitSkillIdentityHeaderBarEffectDef } from "./effects/PortraitSkillIdentityHeaderBar";
import { PortraitHeatBadgeEffectDef } from "./effects/PortraitHeatBadge";
import { PortraitPillTextEffectDef } from "./effects/PortraitPillText";
import { PortraitCodeDecisionChecklistEffectDef } from "./effects/PortraitCodeDecisionChecklist";
import { PortraitBrowserRepairLoopEffectDef } from "./effects/PortraitBrowserRepairLoop";
import { PortraitAgentBrowserMediaEffectDef } from "./effects/PortraitAgentBrowserMedia";
import { PortraitMediaPosterRevealEffectDef } from "./effects/PortraitMediaPosterReveal";
import { PortraitSkillStepGridEffectDef } from "./effects/PortraitSkillStepGrid";
import { PortraitGapHeadlineEffectDef } from "./effects/PortraitGapHeadline";
import { PortraitAiOutputGapComparisonEffectDef } from "./effects/PortraitAiOutputGapComparison";
import { PortraitRiskWarningEffectDef } from "./effects/PortraitRiskWarning";
import { PortraitNextEpisodeTitleEffectDef } from "./effects/PortraitNextEpisodeTitle";
import { PortraitFollowCtaEffectDef } from "./effects/PortraitFollowCta";
import { QuickSetupProofEffectDef } from "./effects/QuickSetupProof";

import { LegacyEliminationPanelEffectDef } from "./effects/LegacyEliminationPanel";
import { MarketEliminationStampEffectDef } from "./effects/MarketEliminationStamp";
import { MaterialCardEffectDef } from "./effects/MaterialCard";
import { PhoneRecordingFrameNeutralEffectDef } from "./effects/PhoneRecordingFrameNeutral";
import { GigHourlyTitleEffectDef } from "./effects/GigHourlyTitle";
import { BrollGigCardFloatEffectDef } from "./effects/BrollGigCardFloat";
import { BrollEpisodePosterDuoEffectDef } from "./effects/BrollEpisodePosterDuo";
import { ComparisonProgressBarsEffectDef } from "./effects/ComparisonProgressBars";
import { MilestoneFollowerProgressEffectDef } from "./effects/MilestoneFollowerProgress";
import { CaseStudySidebarEffectDef } from "./effects/CaseStudySidebar";
import { BrandLogoEffectDef } from "./effects/BrandLogo";
import { TeamAttributionCardEffectDef } from "./effects/TeamAttributionCard";

import { PinBoardEffectDef } from "./effects/PinBoard";
import { StepTimelineEffectDef } from "./effects/StepTimeline";
import { TermCardEffectDef } from "./effects/TermCard";

import { LEGACY_EFFECT_DEFS } from "./legacy-effects";

export type EffectDef = MotionComponentDefinition & {
  catalogGroup: string;
  placement: "left" | "right" | "top" | "bottom" | "full";
  semantic?: EffectSemanticCapabilities;
  arranger?: {
    compiler: "legacy-metric";
  };
};

export type RegisteredEffectDef = EffectDef & {
  semantic: EffectSemanticCapabilities;
};

/** 固定锚定的效果：画布不可拖拽缩放，"独立大小与位置"面板不开放。
 *  ChapterBar 贴顶全宽（与画幅联动）。FocusCamMove 铺满画布做运镜，
 *  位置由组件内 camDX/camDY 参数控制，拖动反而会让底色盘偏离画布。 */
export const ANCHORED_EFFECT_IDS = new Set<string>(["ChapterBar", "FocusCamMove"]);

/** 锚定效果的唯一落位：贴顶、全宽。所有渲染入口（预览/弹窗/导出）共用。
 *  placement 为 "full" 的全屏卡例外：scale 恒为 1，直接铺满画布。 */
export const getAnchoredEffectPosition = (
  definition: MotionComponentDefinition,
  canvasWidth: number,
): MotionPosition => {
  if (definition.placement === "full") {
    return { x: 0, y: 0, scale: 1 };
  }
  return {
    x: 0,
    y: 0,
    scale:
      definition.bounds.width > 0 ? canvasWidth / definition.bounds.width : 1,
  };
};

const EFFECT_DEFINITIONS: EffectDef[] = [

  GlobalExpeditionEffectDef,
  ChapterBarEffectDef,
  FocusCamMoveEffectDef,
  SrtSemanticCaptionsEffectDef,
  SrtCueTextEffectDef,
  TerminalPanelEffectDef,
  Terminal3DEffectDef,

  PortraitChapterRailEffectDef,
  PortraitIndexedChapterTitleEffectDef,

  PortraitInfoCalloutEffectDef,

  PortraitMetricDecisionEffectDef,

  PortraitDecisionTagStackEffectDef,

  PortraitStepStageTitleEffectDef,

  PortraitStepNumberListEffectDef,

  PortraitStaggeredToolListEffectDef,

  PortraitToolBadgeListEffectDef,

  PortraitToolListTitleEffectDef,

  PortraitPromptMistakeDiagnosisEffectDef,

  PortraitWorkflowPrerequisiteEffectDef,

  PortraitSkillSourceFusionEffectDef,

  PortraitDesignRuleChecklistEffectDef,

  PortraitSkillResultComparisonEffectDef,

  PortraitPromptIterationShowcaseEffectDef,

  PortraitSkillIdentityHeaderBarEffectDef,
  PortraitHeatBadgeEffectDef,
  PortraitPillTextEffectDef,

  PortraitCodeDecisionChecklistEffectDef,
  PortraitBrowserRepairLoopEffectDef,
  PortraitAgentBrowserMediaEffectDef,
  PortraitMediaPosterRevealEffectDef,
  PortraitSkillStepGridEffectDef,
  PortraitGapHeadlineEffectDef,
  PortraitAiOutputGapComparisonEffectDef,

  PortraitRiskWarningEffectDef,

  PortraitNextEpisodeTitleEffectDef,

  PortraitFollowCtaEffectDef,

  QuickSetupProofEffectDef,

  LegacyEliminationPanelEffectDef,
  MarketEliminationStampEffectDef,

  MaterialCardEffectDef,
  PhoneRecordingFrameNeutralEffectDef,
  BrollGigCardFloatEffectDef,
  GigHourlyTitleEffectDef,
  BrollEpisodePosterDuoEffectDef,
  ComparisonProgressBarsEffectDef,
  MilestoneFollowerProgressEffectDef,
  CaseStudySidebarEffectDef,
  BrandLogoEffectDef,
  TeamAttributionCardEffectDef,

  PinBoardEffectDef,
  StepTimelineEffectDef,
  TermCardEffectDef,

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
    defaultProps: { ...UNIFIED_ANIMATION_DEFAULTS, ...definition.defaultProps },
    propsSchema: { ...UNIFIED_ANIMATION_SCHEMA, ...definition.propsSchema },
    semantic: EFFECT_SEMANTIC_CAPABILITIES[definition.id],
  }),
);

export const EFFECT_REGISTRY_BY_ID = new Map(
  EFFECT_REGISTRY.map((definition) => [definition.id, definition]),
);

export const AI_ARRANGEABLE_COMPONENT_IDS = EFFECT_REGISTRY.filter(
  (definition) => definition.arranger,
).map((definition) => definition.id);







