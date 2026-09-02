#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSemanticSrtArrangement } from "../semantic-srt-arranger.mjs";
import { PORTRAIT_ROUTE_COMPONENT_IDS } from "../portrait-semantic-routes.mjs";
import { REGISTERED_CARDS } from "./registry-meta.mjs";
import { loadRuntimeRegistry } from "./load-runtime-registry.mjs";

const allDetectedIntents = (cue) => [
  ...(cue.intents ?? []),
  ...(cue.suppressedIntents ?? []),
];

const here = dirname(fileURLToPath(import.meta.url));
const resourceIndex = JSON.parse(
  await readFile(join(here, "..", "..", "public", "input", "resource-index.json"), "utf8"),
);
const runtimeRegistry = await loadRuntimeRegistry();
const input = {
  entries: [
    {
      index: 1,
      startMs: 0,
      endMs: 5000,
      text: "性能提升42%，然后用代码自动生成编排并插入时间线。",
    },
    {
      index: 2,
      startMs: 5200,
      endMs: 7200,
      text: "大家好，欢迎回来。",
    },
  ],
  fps: 30,
  durationInFrames: 240,
  canvas: { width: 1920, height: 1080, orientation: "landscape" },
  availableComponentIds: REGISTERED_CARDS.map((card) => card.id),
  componentCapabilities: REGISTERED_CARDS.map((card) => ({
    componentId: card.id,
    semantic: card.semantic,
  })),
  resourceIndex,
};

const first = buildSemanticSrtArrangement(input);
const second = buildSemanticSrtArrangement(input);
if (JSON.stringify(first) !== JSON.stringify(second)) {
  throw new Error("相同字幕输入没有生成确定性结果");
}
if (first.semanticAnalysis.intentCount < 2) {
  throw new Error("一句字幕没有拆出多个语义意图");
}
if (first.semanticAnalysis.skippedCueCount !== 1) {
  throw new Error("没有正确跳过不需要视觉强化的普通口播");
}
const registeredIds = new Set(REGISTERED_CARDS.map((card) => card.id));
if (!first.motionTimeline.every((item) => registeredIds.has(item.componentId))) {
  throw new Error("语义编排引用了效果库之外的组件");
}
if (
  !first.semanticAnalysis.cueAnalyses.every((cue) =>
    cue.intents.every(
      (intent) =>
        intent.componentCandidates.length >= 1 &&
        intent.componentCandidates.every(
          (candidate) =>
            registeredIds.has(candidate.componentId) &&
            candidate.reason &&
            candidate.semanticMatch?.strength &&
            candidate.rank >= 1 &&
            candidate.props &&
            typeof candidate.props === "object",
        ),
    ),
  )
) {
  throw new Error("横屏语义意图没有生成可解释的真实组件候选集");
}
const indexedResources = new Set(
  Object.entries(resourceIndex.libraries).flatMap(([library, entries]) =>
    entries.map((entry) => `${library}:${entry.id}`),
  ),
);
if (
  !first.resourceTracks.every((track) =>
    indexedResources.has(`${track.kind === "icon" ? "icons" : track.kind}:${track.resourceId}`),
  )
) {
  throw new Error("语义编排引用了固定资源索引之外的资源");
}
if (first.resourceTracks.some((track) => String(track.kind).toLowerCase() === "bgm")) {
  throw new Error("语义编排不应生成 BGM 轨道");
}
if (
  first.applyPolicy.previewBeforeApply !== true ||
  first.applyPolicy.requireUserConfirmation !== true ||
  first.applyPolicy.existingTimeline !== "preserve"
) {
  throw new Error("语义编排没有强制预览、人工确认和保留原时间线");
}
if (first.qualityControl.status !== "pending") {
  throw new Error("本阶段的自动质检必须保持 pending");
}

const portraitInput = {
  entries: [
    {
      index: 1,
      startMs: 0,
      endMs: 5400,
      text: "接下来进入方案选择，1K速度更快、成本更低，更推荐先做1K。",
    },
    {
      index: 2,
      startMs: 5600,
      endMs: 9800,
      text: "首先完成成片，然后使用增强软件，最后高清放大。",
    },
    {
      index: 3,
      startMs: 10000,
      endMs: 13800,
      text: "但是要注意，高清放大不能修复错误口型、表情失真和细节异常。",
    },
    {
      index: 4,
      startMs: 14000,
      endMs: 16400,
      text: "最核心的就是语义自动编排。",
    },
    {
      index: 5,
      startMs: 16600,
      endMs: 19600,
      text: "下期介绍Codex自动剪辑，记得关注。",
    },
    {
      index: 6,
      startMs: 19800,
      endMs: 22800,
      text: "单纯卖货的门店只会慢慢被市场淘汰。",
    },
  ],
  fps: 30,
  durationInFrames: 720,
  canvas: { width: 1080, height: 1920, orientation: "portrait" },
  availableComponentIds: PORTRAIT_ROUTE_COMPONENT_IDS,
  componentCapabilities: runtimeRegistry.filter((card) =>
    PORTRAIT_ROUTE_COMPONENT_IDS.includes(card.id),
  ).map((card) => ({ componentId: card.id, semantic: card.semantic })),
  resourceIndex,
};
const portraitFirst = buildSemanticSrtArrangement(portraitInput);
const portraitSecond = buildSemanticSrtArrangement(portraitInput);
if (JSON.stringify(portraitFirst) !== JSON.stringify(portraitSecond)) {
  throw new Error("相同竖屏字幕输入没有生成确定性结果");
}
if (portraitFirst.semanticAnalysis.routingProfile !== "portrait-v1") {
  throw new Error("竖屏字幕没有进入新的语义路由表");
}
const learnedPreferenceResult = buildSemanticSrtArrangement({
  ...portraitInput,
  entries: [
    {
      index: 1,
      startMs: 0,
      endMs: 3600,
      text: "接下来进入新的章节，先说明这个方法。",
    },
  ],
  durationInFrames: 120,
  componentPreferenceScores: {
    PortraitInfoCallout: 10,
    PortraitChapterRail: -8,
  },
});
if (
  learnedPreferenceResult.motionTimeline[0]?.componentId !==
  "PortraitInfoCallout"
) {
  throw new Error("已确认的组件偏好没有影响下一次竖屏编排推荐");
}
if (
  portraitFirst.semanticAnalysis.cueCount !== portraitInput.entries.length ||
  portraitFirst.semanticAnalysis.semanticSegmentCount !== portraitInput.entries.length
) {
  throw new Error("互不承接的竖屏字幕不应被错误合并");
}
const portraitComponentIds = new Set(
  portraitFirst.motionTimeline.map((item) => item.componentId),
);
for (const componentId of PORTRAIT_ROUTE_COMPONENT_IDS.filter(
  (id) => ![
    "PortraitDecisionTagStack",
    "PortraitStaggeredToolList",
    "PortraitPromptMistakeDiagnosis",
    "PortraitWorkflowPrerequisite",
    "PortraitSkillIdentityCard",
    "PortraitSkillSourceFusion",
    "PortraitDesignRuleChecklist",
    "PortraitSkillResultComparison",
    "PortraitPromptIterationShowcase",
    "PortraitGsapSkillShowcase",
    "PortraitSkillIdentityHeaderBar",
    "PortraitCodeDecisionChecklist",
    "PortraitBrowserRepairLoop",
    "PortraitAgentBrowserMedia",
    "PortraitSkillStepGrid",
    "PortraitGapHeadline",
    "PortraitAiOutputGapQuote",
    "PortraitAiOutputGapComparison",
    "LegacyEliminationPanel",
    "ComparisonProgressBars",
    "MilestoneFollowerProgress",
  ].includes(id),
)) {
  if (!portraitComponentIds.has(componentId)) {
    throw new Error(`竖屏语义编排没有生成 ${componentId}`);
  }
}

const comparisonProgressResult = buildSemanticSrtArrangement({
  ...portraitInput,
  entries: [{ index: 1, startMs: 0, endMs: 4200, text: "过去是短平快内容，现在转向深度中长视频，持续扶持。" }],
  durationInFrames: 180,
});
if (comparisonProgressResult.motionTimeline[0]?.componentId !== "ComparisonProgressBars") {
  throw new Error("方案差异进度对比没有命中对比进度条组件");
}

const skillListResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 5400,
  availableComponentIds: ["PortraitStaggeredToolList"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitStaggeredToolList")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 1, startMs: 7533, endMs: 9450, text: "你得先把AI的能力准备好" },
    { index: 2, startMs: 9450, endMs: 10683, text: "就是这4个skill" },
    { index: 3, startMs: 10766, endMs: 12250, text: "今天我一个一个讲清楚" },
    { index: 4, startMs: 26966, endMs: 29366, text: "第一个skill是我自己做的UI skill" },
    { index: 5, startMs: 117000, endMs: 120533, text: "第二个skill GSAP负责网页的高级动画" },
    { index: 6, startMs: 136000, endMs: 139400, text: "第三个skill ponyfill负责代码质量" },
    { index: 7, startMs: 178450, endMs: 181050, text: "第四个scale Playright MCP" },
  ],
});
const skillListMotion = skillListResult.motionTimeline.find(
  (item) => item.componentId === "PortraitStaggeredToolList",
);
if (!skillListMotion) {
  throw new Error("4 个 Skill 语义没有生成错峰工具列表。");
}
if (
  skillListMotion.props.item1 !== "我自己做的 Skill" ||
  skillListMotion.props.item2 !== "GSAP Skills" ||
  skillListMotion.props.item3 !== "Ponytail" ||
  skillListMotion.props.item4 !== "Playwright MCP"
) {
  throw new Error("错峰工具列表没有从整份 SRT 提取四项 Skill 名称。");
}
const skillListIntent = skillListResult.semanticAnalysis.cueAnalyses
  .flatMap((cue) => cue.intents)
  .find((intent) => intent.id.endsWith("enumerated-tool-list"));
if (
  !skillListIntent ||
  skillListIntent.type !== "list" ||
  skillListIntent.componentCandidates[0]?.semanticMatch?.strength !== "primary"
) {
  throw new Error("错峰工具列表没有作为列举语义的主要候选。");
}

const promptMistakeResult = buildSemanticSrtArrangement({
  ...portraitInput,
  availableComponentIds: ["PortraitPromptMistakeDiagnosis"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitPromptMistakeDiagnosis")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    {
      index: 1,
      startMs: 12566,
      endMs: 20933,
      text: "你是不是也这样，打开AI就直接说帮我做一个官网，结果代码是有了页面却很普通，问题不在模型，是你少了准备这一步",
    },
  ],
});
const promptMistakeMotion = promptMistakeResult.motionTimeline.find(
  (item) => item.componentId === "PortraitPromptMistakeDiagnosis",
);
if (!promptMistakeMotion) {
  throw new Error("错误提问语义没有生成逐字输入诊断组件。");
}
if (
  promptMistakeMotion.props.prompt !== "帮我做一个官网" ||
  promptMistakeMotion.props.issue1 !== "配色随机" ||
  promptMistakeMotion.props.issue2 !== "动效生硬" ||
  promptMistakeMotion.props.issue3 !== "代码冗余" ||
  promptMistakeMotion.props.conclusionEmphasis !== "少了准备这一步"
) {
  throw new Error("错误提问诊断组件没有按整段 SRT 绑定提问、问题标签和结论。");
}
const promptMistakeIntent = promptMistakeResult.semanticAnalysis.cueAnalyses
  .flatMap((cue) => cue.intents)
  .find((intent) => intent.id.endsWith("direct-prompt-mistake"));
if (
  !promptMistakeIntent ||
  promptMistakeIntent.type !== "warning" ||
  promptMistakeIntent.componentCandidates[0]?.componentId !==
    "PortraitPromptMistakeDiagnosis"
) {
  throw new Error("错误提问诊断没有作为该风险语义的主要候选。");
}

const workflowPrerequisiteResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 1200,
  availableComponentIds: ["PortraitWorkflowPrerequisite"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitWorkflowPrerequisite")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 16, startMs: 20966, endMs: 22566, text: "动手之前先把这套" },
    { index: 17, startMs: 22566, endMs: 23850, text: "Skill工作流装好" },
    { index: 18, startMs: 23850, endMs: 25250, text: "按审美动效工程" },
    { index: 19, startMs: 25250, endMs: 26483, text: "自测这个顺序来" },
  ],
});
const workflowMotion = workflowPrerequisiteResult.motionTimeline.find(
  (item) => item.componentId === "PortraitWorkflowPrerequisite",
);
if (!workflowMotion) {
  throw new Error("工作流前置语义没有生成动态步骤流程组件。");
}
if (
  workflowMotion.props.stepCount !== 4 ||
  workflowMotion.props.step1 !== "审美" ||
  workflowMotion.props.step2 !== "动效" ||
  workflowMotion.props.step3 !== "工程" ||
  workflowMotion.props.step4 !== "自测" ||
  workflowMotion.props.footerEmphasis !== "顺序不能反"
) {
  throw new Error("动态工作流组件没有绑定默认四步数量与文案。");
}
const expectedWorkflowFrames = Math.round(((26483 - 20966) / 1000) * 30);
if (Math.abs(workflowMotion.durationInFrames - expectedWorkflowFrames) > 1) {
  throw new Error("横向工作流组件没有覆盖 20.966–26.483 秒完整 SRT 语义段。");
}
const workflowIntent = workflowPrerequisiteResult.semanticAnalysis.cueAnalyses
  .flatMap((cue) => cue.intents)
  .find((intent) => intent.id.endsWith("workflow-prerequisite"));
if (
  !workflowIntent ||
  workflowIntent.type !== "process" ||
  workflowIntent.componentCandidates[0]?.componentId !==
    "PortraitWorkflowPrerequisite"
) {
  throw new Error("工作流前置组件没有作为该流程语义的主要候选。");
}

const skillIdentityResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 1200,
  availableComponentIds: ["PortraitSkillIdentityCard"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitSkillIdentityCard")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 20, startMs: 26966, endMs: 28000, text: "第一个skill是" },
    { index: 21, startMs: 28000, endMs: 29366, text: "我自己做的UI skill" },
    { index: 22, startMs: 29366, endMs: 30650, text: "一直在持续更新" },
  ],
});
const skillIdentityMotion = skillIdentityResult.motionTimeline.find(
  (item) => item.componentId === "PortraitSkillIdentityCard",
);
if (!skillIdentityMotion) {
  throw new Error("Skill 身份语义没有生成身份卡组件。");
}
if (
  skillIdentityMotion.props.sequenceText !== "01" ||
  skillIdentityMotion.props.title !== "我自己做的 Skill" ||
  skillIdentityMotion.props.badge !== "C 位" ||
  !String(skillIdentityMotion.props.updateText).includes("持续更新")
) {
  throw new Error("Skill 身份卡没有绑定编号、身份标题、徽标与更新说明。");
}
const expectedSkillIdentityFrames = Math.round(((30650 - 26966) / 1000) * 30);
if (Math.abs(skillIdentityMotion.durationInFrames - expectedSkillIdentityFrames) > 1) {
  throw new Error("Skill 身份卡没有覆盖 26.966–30.650 秒完整 SRT 语义段。");
}
const skillSourceFusionResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 1500,
  availableComponentIds: ["PortraitSkillSourceFusion"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitSkillSourceFusion")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 23, startMs: 30883, endMs: 32283, text: "它不是凭空来的" },
    { index: 24, startMs: 32283, endMs: 34166, text: "审美判断是跟taste学的" },
    { index: 25, startMs: 34283, endMs: 35400, text: "反廉价那一套是" },
    { index: 26, startMs: 35400, endMs: 36766, text: "跟Impeccable学的" },
    { index: 27, startMs: 36766, endMs: 38283, text: "再加上我自己攒的经验" },
    { index: 28, startMs: 38283, endMs: 39566, text: "三样拼成一个" },
  ],
});
const skillSourceFusionMotion = skillSourceFusionResult.motionTimeline.find(
  (item) => item.componentId === "PortraitSkillSourceFusion",
);
if (!skillSourceFusionMotion) {
  throw new Error("Skill 来源语义没有生成三来源合成组件。");
}
if (
  skillSourceFusionMotion.props.sourceCount !== 3 ||
  skillSourceFusionMotion.props.source1 !== "TASTE" ||
  skillSourceFusionMotion.props.source2 !== "IMPECCABLE" ||
  skillSourceFusionMotion.props.source3 !== "自己的经验" ||
  "resultText" in skillSourceFusionMotion.props
) {
  throw new Error("Skill 来源组件没有绑定动态数量和三个默认来源，或仍残留合成结论。");
}
const expectedSkillSourceFrames = Math.round(((39566 - 30883) / 1000) * 30);
if (Math.abs(skillSourceFusionMotion.durationInFrames - expectedSkillSourceFrames) > 1) {
  throw new Error("Skill 来源合成组件没有覆盖 30.883–39.566 秒完整 SRT 语义段。");
}
const designRulesResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 1800,
  availableComponentIds: ["PortraitDesignRuleChecklist"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitDesignRuleChecklist")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 29, startMs: 39566, endMs: 41733, text: "它负责整个网页的设计审美" },
    { index: 30, startMs: 41766, endMs: 42733, text: "怎么排版" },
    { index: 31, startMs: 42733, endMs: 43600, text: "怎么留白" },
    { index: 32, startMs: 43600, endMs: 44450, text: "怎么配色" },
    { index: 33, startMs: 44450, endMs: 45400, text: "怎么做层级" },
    { index: 34, startMs: 45800, endMs: 47683, text: "全是他替AI定好的规矩" },
  ],
});
const designRulesMotion = designRulesResult.motionTimeline.find(
  (item) => item.componentId === "PortraitDesignRuleChecklist",
);
if (!designRulesMotion) {
  throw new Error("网页设计审美语义没有生成设计规则清单。");
}
if (
  designRulesMotion.props.ruleCount !== 4 ||
  designRulesMotion.props.rule1 !== "排版网格" ||
  designRulesMotion.props.rule2 !== "留白密度" ||
  designRulesMotion.props.rule3 !== "配色层级" ||
  designRulesMotion.props.rule4 !== "视觉一致性"
) {
  throw new Error("设计规则清单没有绑定四条参考规则。");
}
const expectedDesignRulesFrames = Math.round(((47683 - 39566) / 1000) * 30);
if (Math.abs(designRulesMotion.durationInFrames - expectedDesignRulesFrames) > 1) {
  throw new Error("设计规则清单没有覆盖 39.566–47.683 秒完整 SRT 语义段。");
}
const skillResultComparisonResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 2100,
  availableComponentIds: ["PortraitSkillResultComparison"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitSkillResultComparison")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 35, startMs: 47733, endMs: 49083, text: "这是没装他的时候" },
    { index: 36, startMs: 49166, endMs: 50800, text: "AI随手做出来的默认效果" },
    { index: 37, startMs: 50800, endMs: 51766, text: "这是装了之后" },
    { index: 38, startMs: 51766, endMs: 53250, text: "同一个AI同一句话" },
    { index: 39, startMs: 53250, endMs: 54200, text: "做出来的样子" },
    { index: 40, startMs: 54333, endMs: 55133, text: "换个题材" },
    { index: 41, startMs: 55133, endMs: 55966, text: "换个行业" },
    { index: 42, startMs: 56000, endMs: 56800, text: "他一样稳" },
  ],
});
const skillResultComparisonMotion = skillResultComparisonResult.motionTimeline.find(
  (item) => item.componentId === "PortraitSkillResultComparison",
);
if (!skillResultComparisonMotion) {
  throw new Error("Skill 安装前后语义没有生成效果对比组件。");
}
if (
  skillResultComparisonMotion.props.materialCount !== 3 ||
  skillResultComparisonMotion.props.material1Title !== "没装它" ||
  skillResultComparisonMotion.props.material2Title !== "装了它" ||
  skillResultComparisonMotion.props.material3Title !== "换个行业" ||
  Math.abs(skillResultComparisonMotion.props.firstSwitchSeconds - 3.07) > 0.01 ||
  Math.abs(skillResultComparisonMotion.props.materialIntervalSeconds - 3.53) > 0.01
) {
  throw new Error("Skill 效果对比组件没有绑定动态素材数量、前三个阶段或按 SRT 计算切换间隔。");
}
const expectedSkillResultFrames = Math.round(((56800 - 47733) / 1000) * 30);
if (Math.abs(skillResultComparisonMotion.durationInFrames - expectedSkillResultFrames) > 1) {
  throw new Error("Skill 效果对比组件没有覆盖 47.733–56.800 秒完整 SRT 语义段。");
}
const promptIterationResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 2400,
  availableComponentIds: ["PortraitPromptIterationShowcase"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitPromptIterationShowcase")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 43, startMs: 57933, endMs: 59083, text: "那具体怎么用" },
    { index: 44, startMs: 59083, endMs: 60850, text: "你只要把想要什么讲清楚" },
    { index: 45, startMs: 61000, endMs: 62450, text: "第一句做一个摄影" },
    { index: 46, startMs: 62450, endMs: 63683, text: "工作室的品牌官网" },
    { index: 47, startMs: 63683, endMs: 65250, text: "它直接给你一版能看的" },
    { index: 48, startMs: 65250, endMs: 66250, text: "想换方向" },
    { index: 49, startMs: 66250, endMs: 67050, text: "再说一句" },
    { index: 50, startMs: 67050, endMs: 68933, text: "改成数据后台深色" },
    { index: 51, startMs: 69000, endMs: 70483, text: "整页的排版和配色" },
    { index: 52, startMs: 70483, endMs: 71400, text: "它自己重排" },
    { index: 53, startMs: 71450, endMs: 72250, text: "再来一句" },
    { index: 54, startMs: 72283, endMs: 73683, text: "换成产品落地页" },
    { index: 55, startMs: 73850, endMs: 74800, text: "它照样接得住" },
    { index: 56, startMs: 74800, endMs: 76800, text: "你从头到尾只管说要什么" },
  ],
});
const promptIterationMotion = promptIterationResult.motionTimeline.find(
  (item) => item.componentId === "PortraitPromptIterationShowcase",
);
if (!promptIterationMotion) {
  throw new Error("一句话连续改版语义没有生成提示词迭代组件。");
}
if (
  promptIterationMotion.props.iterationCount !== 3 ||
  promptIterationMotion.props.iteration1Badge !== "品牌官网" ||
  promptIterationMotion.props.iteration2Badge !== "数据后台" ||
  promptIterationMotion.props.iteration3Badge !== "产品落地页" ||
  Math.abs(promptIterationMotion.props.firstResultSeconds - 3.07) > 0.01 ||
  Math.abs(promptIterationMotion.props.iterationIntervalSeconds - 5.64) > 0.01
) {
  throw new Error("一句话连续改版组件没有绑定三次改版内容或按 SRT 计算切换间隔。");
}
const expectedPromptIterationFrames = Math.round(((76800 - 57933) / 1000) * 30);
if (Math.abs(promptIterationMotion.durationInFrames - expectedPromptIterationFrames) > 1) {
  throw new Error("一句话连续改版组件没有覆盖 57.933–76.800 秒完整 SRT 语义段。");
}
const gsapSkillResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 3000,
  availableComponentIds: ["PortraitGsapSkillShowcase", "PortraitSkillIdentityHeaderBar"],
  componentCapabilities: runtimeRegistry
    .filter((card) => ["PortraitGsapSkillShowcase", "PortraitSkillIdentityHeaderBar"].includes(card.id))
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 57, startMs: 77000, endMs: 78883, text: "第二个skill GSAP" },
    { index: 58, startMs: 78933, endMs: 80533, text: "负责网页的高级动画" },
    { index: 59, startMs: 80600, endMs: 82166, text: "很多AI做的网页会动" },
    { index: 60, startMs: 82166, endMs: 83333, text: "但动的不好看" },
    { index: 61, startMs: 83450, endMs: 84283, text: "滚动触发" },
    { index: 62, startMs: 84283, endMs: 85483, text: "时间轴编排" },
    { index: 63, startMs: 85600, endMs: 86450, text: "错峰入场" },
    { index: 64, startMs: 86450, endMs: 87366, text: "什么时候出现" },
    { index: 65, startMs: 87366, endMs: 88366, text: "什么时候结束" },
    { index: 66, startMs: 88450, endMs: 90533, text: "快慢怎么给它全管" },
    { index: 67, startMs: 90566, endMs: 91600, text: "它是配着第一个" },
    { index: 68, startMs: 91600, endMs: 92566, text: "skill一起用的" },
    { index: 69, startMs: 92566, endMs: 94083, text: "一个管页面好不好看" },
    { index: 70, startMs: 94083, endMs: 95733, text: "一个管它动的好不好看" },
  ],
});
const gsapSkillMotion = gsapSkillResult.motionTimeline.find(
  (item) => item.componentId === "PortraitGsapSkillShowcase",
);
if (!gsapSkillMotion) {
  throw new Error("GSAP 高级动画语义没有生成 Skill 能力组件。");
}
const gsapHeaderMotion = gsapSkillResult.motionTimeline.find(
  (item) => item.componentId === "PortraitSkillIdentityHeaderBar",
);
if (!gsapHeaderMotion || gsapHeaderMotion.props.title !== "GSAP Skills") {
  throw new Error("GSAP 高级动画语义没有把独立 Skill 身份条作为第二条动效轨道生成。");
}
if (
  gsapSkillMotion.props.capabilityCount !== 3 ||
  gsapSkillMotion.props.capability1Title !== "ScrollTrigger" ||
  gsapSkillMotion.props.capability2Title !== "Timeline" ||
  gsapSkillMotion.props.capability3Title !== "Stagger" ||
  Math.abs(gsapSkillMotion.props.pairRevealSeconds - 13.57) > 0.01 ||
  Math.abs(gsapSkillMotion.props.conclusionRevealSeconds - 15.57) > 0.01
) {
  throw new Error("GSAP 高级动画组件没有绑定三项能力或按 SRT 计算双 Skill 联动时序。");
}
const expectedGsapSkillFrames = Math.round(((95733 - 77000) / 1000) * 30);
if (Math.abs(gsapSkillMotion.durationInFrames - expectedGsapSkillFrames) > 1) {
  throw new Error("GSAP 高级动画组件没有覆盖 77.000–95.733 秒完整 SRT 语义段。");
}
const codeDecisionResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 3600,
  availableComponentIds: ["PortraitCodeDecisionChecklist"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitCodeDecisionChecklist")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 75, startMs: 102333, endMs: 103483, text: "让AI先想" },
    { index: 76, startMs: 103483, endMs: 104966, text: "这个功能真的需要吗" },
    { index: 77, startMs: 104966, endMs: 106333, text: "现有代码里有没有" },
    { index: 78, startMs: 106333, endMs: 107450, text: "标准库有没有" },
    { index: 79, startMs: 107450, endMs: 109050, text: "实在不行才自己写" },
  ],
});
const codeDecisionMotion = codeDecisionResult.motionTimeline.find(
  (item) => item.componentId === "PortraitCodeDecisionChecklist",
);
if (!codeDecisionMotion) {
  throw new Error("代码决策语义没有生成竖向编号检查清单。");
}
if (
  codeDecisionMotion.props.questionCount !== 6 ||
  codeDecisionMotion.props.question1 !== "这个功能真的需要吗" ||
  codeDecisionMotion.props.question3 !== "标准库有没有" ||
  codeDecisionMotion.props.question6 !== "一行能搞定吗" ||
  Math.abs(codeDecisionMotion.props.firstHighlightSeconds - 1.15) > 0.01 ||
  Math.abs(codeDecisionMotion.props.questionIntervalSeconds - 1.11) > 0.01
) {
  throw new Error("代码决策检查清单没有绑定六个问题或 SRT 点亮间隔。");
}
const expectedCodeDecisionFrames = Math.round(((109050 - 102333) / 1000) * 30);
if (Math.abs(codeDecisionMotion.durationInFrames - expectedCodeDecisionFrames) > 1) {
  throw new Error("代码决策检查清单没有覆盖 102.333–109.050 秒完整 SRT 语义段。");
}
const browserRepairResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 4500,
  availableComponentIds: ["PortraitBrowserRepairLoop"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitBrowserRepairLoop")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 88, startMs: 123050, endMs: 124883, text: "让agent自己打开浏览器" },
    { index: 89, startMs: 124883, endMs: 125566, text: "自己运行" },
    { index: 90, startMs: 125566, endMs: 126166, text: "自己点击" },
    { index: 91, startMs: 126166, endMs: 127250, text: "自己截图检查" },
    { index: 92, startMs: 127333, endMs: 128766, text: "发现问题自己改" },
    { index: 93, startMs: 128766, endMs: 130133, text: "改完再验证一遍" },
    { index: 94, startMs: 130133, endMs: 131083, text: "一直循环" },
    { index: 95, startMs: 131133, endMs: 132850, text: "直到整页真的没问题" },
  ],
});
const browserRepairMotion = browserRepairResult.motionTimeline.find(
  (item) => item.componentId === "PortraitBrowserRepairLoop",
);
if (!browserRepairMotion) {
  throw new Error("浏览器自动测试语义没有生成六步修复闭环。");
}
if (
  browserRepairMotion.props.stepCount !== 6 ||
  browserRepairMotion.props.step1 !== "打开浏览器" ||
  browserRepairMotion.props.step3 !== "自动截图" ||
  browserRepairMotion.props.step6 !== "再验证" ||
  browserRepairMotion.props.centerTitle !== "一直循环" ||
  Math.abs(browserRepairMotion.props.nextNodeHighlightIntervalSeconds - 1.26) > 0.01 ||
  browserRepairMotion.props.loopIntervalSeconds !== 0.5
) {
  throw new Error("浏览器自动修复闭环没有绑定六个节点、中心结论或 SRT 点亮间隔。");
}
const expectedBrowserRepairFrames = Math.round(((132850 - 123050) / 1000) * 30);
if (Math.abs(browserRepairMotion.durationInFrames - expectedBrowserRepairFrames) > 1) {
  throw new Error("浏览器自动修复闭环没有覆盖 123.050–132.850 秒完整 SRT 语义段。");
}
const browserSelfCheckResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 4500,
  availableComponentIds: ["PortraitAgentBrowserMedia"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitAgentBrowserMedia")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 96, startMs: 133083, endMs: 134733, text: "你现在看到的这一整页" },
    { index: 97, startMs: 134733, endMs: 136600, text: "就是这么一遍遍自查过来的" },
  ],
});
const browserSelfCheckMotion = browserSelfCheckResult.motionTimeline.find(
  (item) => item.componentId === "PortraitAgentBrowserMedia",
);
if (!browserSelfCheckMotion) {
  throw new Error("整页自查语义没有生成可上传图片或视频的浏览器组件。");
}
if (
  browserSelfCheckMotion.props.titlePrefix !== "Agent 自己开浏览器，" ||
  browserSelfCheckMotion.props.titleHighlight !== "逐屏自查" ||
  browserSelfCheckMotion.props.browserLabel !== "playwright · headed"
) {
  throw new Error("浏览器逐屏自查组件没有绑定标题或浏览器栏文字。");
}
const expectedBrowserSelfCheckFrames = Math.round(((136600 - 133083) / 1000) * 30);
if (Math.abs(browserSelfCheckMotion.durationInFrames - expectedBrowserSelfCheckFrames) > 1) {
  throw new Error("浏览器逐屏自查组件没有覆盖 133.083–136.600 秒完整 SRT 语义段。");
}
const skillStepGridResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 900,
  availableComponentIds: ["PortraitSkillStepGrid"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitSkillStepGrid")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 7, startMs: 9450, endMs: 10683, text: "就是这4个skill" },
    { index: 8, startMs: 10766, endMs: 12250, text: "今天我一个一个讲清楚" },
  ],
});
const skillStepGridMotion = skillStepGridResult.motionTimeline.find(
  (item) => item.componentId === "PortraitSkillStepGrid",
);
if (!skillStepGridMotion) {
  throw new Error("四步 Skill 语义没有生成横向卡片组件。");
}
if (
  skillStepGridMotion.props.stepCount !== 4 ||
  skillStepGridMotion.props.headerText !== "STEP 1 → 4" ||
  skillStepGridMotion.props.step1Title !== "我自己做的 Skill" ||
  skillStepGridMotion.props.step4Title !== "Playwright MCP"
) {
  throw new Error("四步 Skill 卡片没有绑定标题或四个 Skill 内容。");
}
const expectedSkillStepGridFrames = Math.round(((12250 - 9450) / 1000) * 30);
if (Math.abs(skillStepGridMotion.durationInFrames - expectedSkillStepGridFrames) > 1) {
  throw new Error("四步 Skill 卡片没有覆盖 9.450–12.250 秒完整 SRT 语义段。");
}
const gapHeadlineResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 5400,
  availableComponentIds: ["PortraitGapHeadline"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitGapHeadline")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 118, startMs: 165000, endMs: 166883, text: "其实现在真正拉开差距的" },
    { index: 119, startMs: 166883, endMs: 167966, text: "早就不是模型" },
    { index: 120, startMs: 167966, endMs: 168966, text: "是工作流" },
  ],
});
const gapHeadlineMotion = gapHeadlineResult.motionTimeline.find(
  (item) => item.componentId === "PortraitGapHeadline",
);
if (!gapHeadlineMotion) {
  throw new Error("差距不在模型语义没有生成结论标题组件。");
}
if (
  gapHeadlineMotion.props.badgeText !== "最后说一句" ||
  gapHeadlineMotion.props.titlePrefix !== "差距不在" ||
  gapHeadlineMotion.props.titleEmphasis !== "模型"
) {
  throw new Error("差距结论标题没有绑定徽标或拆分标题文字。");
}
const expectedGapHeadlineFrames = Math.round(((168966 - 165000) / 1000) * 30);
if (Math.abs(gapHeadlineMotion.durationInFrames - expectedGapHeadlineFrames) > 1) {
  throw new Error("差距结论标题没有覆盖 165.000–168.966 秒完整 SRT 语义段。");
}
const aiOutputGapQuoteResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 5400,
  availableComponentIds: ["PortraitAiOutputGapQuote"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitAiOutputGapQuote")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 121, startMs: 169083, endMs: 170000, text: "同样一个AI" },
    { index: 122, startMs: 170000, endMs: 172166, text: "有人做出来一眼就是AI糊的" },
    { index: 123, startMs: 172200, endMs: 173883, text: "有人做出来能直接上线" },
  ],
});
const aiOutputGapQuoteMotion = aiOutputGapQuoteResult.motionTimeline.find(
  (item) => item.componentId === "PortraitAiOutputGapQuote",
);
if (!aiOutputGapQuoteMotion) {
  throw new Error("同样 AI 输出差距语义没有生成双行引用组件。");
}
if (
  aiOutputGapQuoteMotion.props.leadText !== "同样一个 AI，" ||
  aiOutputGapQuoteMotion.props.bodyText !== "做出来的东西却差了一整个档次。"
) {
  throw new Error("同样 AI 输出差距引用没有绑定两行压缩文案。");
}
const expectedAiOutputGapQuoteFrames = Math.round(((173883 - 169083) / 1000) * 30);
if (Math.abs(aiOutputGapQuoteMotion.durationInFrames - expectedAiOutputGapQuoteFrames) > 1) {
  throw new Error("同样 AI 输出差距引用没有覆盖 169.083–173.883 秒完整 SRT 语义段。");
}
const aiOutputGapComparisonResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 5400,
  availableComponentIds: ["PortraitAiOutputGapComparison"],
  componentCapabilities: runtimeRegistry
    .filter((card) => card.id === "PortraitAiOutputGapComparison")
    .map((card) => ({ componentId: card.id, semantic: card.semantic })),
  entries: [
    { index: 122, startMs: 170000, endMs: 172166, text: "有人做出来一眼就是AI糊的" },
    { index: 123, startMs: 172200, endMs: 173883, text: "有人做出来能直接上线" },
  ],
});
const aiOutputGapComparisonMotion = aiOutputGapComparisonResult.motionTimeline.find(
  (item) => item.componentId === "PortraitAiOutputGapComparison",
);
if (!aiOutputGapComparisonMotion) {
  throw new Error("AI 糊与直接上线语义没有生成正反结果对比组件。");
}
if (
  aiOutputGapComparisonMotion.props.gapLabel !== "THE GAP" ||
  aiOutputGapComparisonMotion.props.badText !== "一眼就是 AI 糊的" ||
  aiOutputGapComparisonMotion.props.goodText !== "能直接上线"
) {
  throw new Error("AI 输出差距对比没有绑定标签或正反结果文案。");
}
const expectedAiOutputGapComparisonFrames = Math.round(((173883 - 170000) / 1000) * 30);
if (Math.abs(aiOutputGapComparisonMotion.durationInFrames - expectedAiOutputGapComparisonFrames) > 1) {
  throw new Error("AI 输出差距对比没有覆盖 170.000–173.883 秒完整 SRT 语义段。");
}
if (
  !portraitFirst.motionTimeline.every((item) =>
    PORTRAIT_ROUTE_COMPONENT_IDS.includes(item.componentId),
  )
) {
  throw new Error("竖屏语义编排混入了横屏旧组件");
}
if (
  !portraitFirst.semanticAnalysis.cueAnalyses.every((cue) =>
    cue.intents.every(
      (intent) =>
        intent.componentCandidates.length >= 1 &&
        intent.componentCandidates.every(
          (candidate) =>
            PORTRAIT_ROUTE_COMPONENT_IDS.includes(candidate.componentId) &&
            candidate.reason &&
            candidate.semanticMatch?.strength &&
            candidate.rank >= 1 &&
            candidate.props &&
            typeof candidate.props === "object",
        ),
    ),
  )
) {
  throw new Error("竖屏语义意图没有生成可解释的真实组件候选集");
}
if (
  portraitFirst.semanticAnalysis.cueAnalyses.some(
    (cue) => cue.intents.length > 3,
  )
) {
  throw new Error("单条竖屏字幕生成了超过 3 个视觉意图");
}

const repeatedMetricResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 540,
  entries: [
    { index: 1, startMs: 0, endMs: 2600, text: "第一组数据增长30%，收益更高。" },
    { index: 2, startMs: 3200, endMs: 5800, text: "第二组数据增长42%，效率更高。" },
    { index: 3, startMs: 6400, endMs: 9000, text: "第三组数据增长56%，成本更低。" },
  ],
});
const repeatedMetricPrimaryIds = repeatedMetricResult.semanticAnalysis.cueAnalyses
  .flatMap((cue) => cue.intents)
  .filter((intent) => intent.id.endsWith("metric-decision"))
  .map((intent) => intent.componentIds[0]);
if (
  repeatedMetricPrimaryIds.length !== 3 ||
  repeatedMetricPrimaryIds.some(
    (componentId) => componentId !== "PortraitMetricDecision",
  )
) {
  throw new Error(
    `相邻数字语义为了变化而选择了弱匹配组件：${repeatedMetricPrimaryIds.join(",")}`,
  );
}

const denseCueResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 300,
  entries: [
    {
      index: 1,
      startMs: 0,
      endMs: 7200,
      text: "下一步进入执行流程，首先导入字幕，然后自动编排，最后确认插入，整体效率提升42%。",
    },
  ],
});
const denseCueAnalysis = denseCueResult.semanticAnalysis.cueAnalyses[0];
const denseCueIntentIds = new Set(denseCueAnalysis?.intents.map((intent) => intent.id));
const denseCueDetectedIds = new Set(
  allDetectedIntents(denseCueAnalysis).map((intent) => intent.id),
);
const denseCueMotionCount = denseCueResult.motionTimeline.filter((item) =>
  denseCueIntentIds.has(item.sourceIntentId),
).length;
if (
  denseCueDetectedIds.size !== 3 ||
  denseCueIntentIds.size !== 2 ||
  denseCueAnalysis.suppressedIntents.length !== 1 ||
  denseCueMotionCount > 2 ||
  denseCueResult.semanticAnalysis.detectedIntentCount !== 3 ||
  denseCueResult.semanticAnalysis.intentCount !== 2 ||
  denseCueResult.semanticAnalysis.suppressedIntentCount !== 1 ||
  denseCueResult.semanticAnalysis.densitySummary.motionBudget !== 2 ||
  denseCueAnalysis.suppressedIntents.some(
    (intent) =>
      intent.suppressionReason !== "visual-density-budget" ||
      intent.componentCandidates.length === 0,
  )
) {
  throw new Error(
    `高密度语义没有正确限流：detected=${denseCueDetectedIds.size} preview=${denseCueIntentIds.size} motion=${denseCueMotionCount}`,
  );
}
const metricItems = portraitFirst.motionTimeline.filter((item) =>
  ["PortraitMetricDecision", "PortraitDecisionTagStack"].includes(item.componentId),
);
if (
  metricItems.length !== 1 ||
  new Set(metricItems.map((item) => item.sourceIntentId)).size !== 1
) {
  throw new Error("多意图字幕没有抑制数字决策的辅助动效");
}
const singleMetricCombo = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 210,
  entries: [
    { index: 1, startMs: 0, endMs: 6000, text: "1K速度更快，成本更低，更推荐1K。" },
  ],
});
const singleMetricItems = singleMetricCombo.motionTimeline.filter((item) =>
  ["PortraitMetricDecision", "PortraitDecisionTagStack"].includes(item.componentId),
);
if (
  singleMetricItems.length !== 2 ||
  new Set(singleMetricItems.map((item) => item.sourceIntentId)).size !== 1
) {
  throw new Error("单一数字意图没有保留数据卡与标签组组合能力");
}
if (
  portraitFirst.motionTimeline.some((item) =>
    ["SrtSemanticCaptions", "SrtCueText"].includes(item.componentId),
  ) ||
  portraitFirst.resourceTracks.some((track) =>
    ["caption", "captions", "subtitle", "bgm"].includes(
      String(track.kind).toLowerCase(),
    ),
  )
) {
  throw new Error("竖屏语义编排生成了基础字幕或 BGM");
}
if (
  !portraitFirst.resourceTracks.every((track) =>
    indexedResources.has(`${track.kind === "icon" ? "icons" : track.kind}:${track.resourceId}`),
  )
) {
  throw new Error("竖屏语义编排引用了固定资源索引之外的资源");
}

const mergedContext = buildSemanticSrtArrangement({
  ...portraitInput,
  entries: [
    { index: 1, startMs: 0, endMs: 800, text: "未来3年" },
    { index: 2, startMs: 800, endMs: 1800, text: "卫浴店只有这种" },
    { index: 3, startMs: 1800, endMs: 3000, text: "门店能够赚钱" },
  ],
});
if (
  mergedContext.semanticAnalysis.cueCount !== 3 ||
  mergedContext.semanticAnalysis.semanticSegmentCount !== 1 ||
  JSON.stringify(mergedContext.semanticAnalysis.cueAnalyses[0]?.sourceCueIndices) !==
    JSON.stringify([1, 2, 3])
) {
  throw new Error("竖屏语义编排没有使用相邻字幕合并结果或丢失来源字幕索引");
}

const sentencePatternInput = {
  ...portraitInput,
  durationInFrames: 720,
  entries: [
    {
      index: 1,
      startMs: 0,
      endMs: 3000,
      text: "未来3年，传统门店只会被市场淘汰",
    },
    {
      index: 2,
      startMs: 3600,
      endMs: 6200,
      text: "单纯卖货的门店只会慢慢被市场淘汰",
    },
    {
      index: 3,
      startMs: 6800,
      endMs: 9400,
      text: "线上引流线下成交，才是实体店最终的出路",
    },
    {
      index: 4,
      startMs: 10000,
      endMs: 12600,
      text: "短视频做品牌种草，直播做精准转化",
    },
    {
      index: 5,
      startMs: 13200,
      endMs: 16600,
      text: "客流稳定，客单更高，轻松突破业绩瓶颈",
    },
    {
      index: 6,
      startMs: 17200,
      endMs: 20200,
      text: "紧跟趋势，轻松实现年入百万",
    },
    {
      index: 7,
      startMs: 20600,
      endMs: 23400,
      text: "双人套餐内容很丰富，前者有2份蟹子沙拉",
    },
  ],
};
const sentencePatternResult = buildSemanticSrtArrangement(sentencePatternInput);
const routeIdsByCue = new Map(
  sentencePatternResult.semanticAnalysis.cueAnalyses.map((cue) => [
    cue.cueIndex,
    allDetectedIntents(cue).map((intent) => intent.id.replace(/^intent-\d+-/u, "")),
  ]),
);
const expectRoutes = (cueIndex, expected, forbidden = []) => {
  const actual = routeIdsByCue.get(cueIndex) ?? [];
  for (const routeId of expected) {
    if (!actual.includes(routeId)) {
      throw new Error(`通用句式 ${cueIndex} 没有命中 ${routeId}：${actual.join(",")}`);
    }
  }
  for (const routeId of forbidden) {
    if (actual.includes(routeId)) {
      throw new Error(`通用句式 ${cueIndex} 不应命中 ${routeId}`);
    }
  }
};
expectRoutes(1, ["chapter-transition", "risk-boundary"], ["metric-decision"]);
expectRoutes(2, ["risk-boundary"]);
expectRoutes(3, []);
expectRoutes(4, ["process-steps"]);
expectRoutes(5, ["metric-decision"], ["risk-boundary"]);
expectRoutes(6, ["metric-decision"]);
expectRoutes(7, [], ["metric-decision"]);
const eliminationResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 120,
  entries: [
    { index: 1, startMs: 0, endMs: 3600, text: "单纯卖货的门店只会慢慢被市场淘汰" },
  ],
});
const eliminationItem = eliminationResult.motionTimeline.find(
  (item) => item.sourceIntentId === "intent-001-risk-boundary",
);
if (
  eliminationItem?.componentId !== "LegacyEliminationPanel" ||
  eliminationItem.props.title !== "单纯卖货" ||
  eliminationResult.motionTimeline.some(
    (item) =>
      item.sourceIntentId === "intent-001-risk-boundary" &&
      item.componentId === "PortraitRiskWarning",
  )
) {
  throw new Error("市场淘汰语义没有互斥选择新警告动画或文案提取错误");
}

const riskVariantResult = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 540,
  entries: [
    { index: 1, startMs: 0, endMs: 2600, text: "旧方案已经过时，不再适合现在的市场" },
    { index: 2, startMs: 3000, endMs: 5600, text: "但是要注意，它不能修复错误口型" },
    { index: 3, startMs: 6000, endMs: 8600, text: "为了避免被市场淘汰，我们必须升级服务" },
    { index: 4, startMs: 9000, endMs: 11600, text: "我们已经淘汰旧设备，效率更高" },
  ],
});
const variantComponents = new Map(
  riskVariantResult.semanticAnalysis.cueAnalyses.map((cue) => [
    cue.cueIndex,
    allDetectedIntents(cue).flatMap((intent) =>
      intent.componentIds.length > 0
        ? intent.componentIds
        : intent.componentCandidates.slice(0, 1).map((candidate) => candidate.componentId),
    ),
  ]),
);
if (!variantComponents.get(1)?.includes("LegacyEliminationPanel")) {
  throw new Error("旧方案过时的同义表达没有选择淘汰警告动画");
}
if (
  !variantComponents.get(2)?.includes("PortraitRiskWarning") ||
  variantComponents.get(2)?.includes("LegacyEliminationPanel")
) {
  throw new Error("一般风险提醒没有继续使用原风险卡");
}
const generalRiskCue = riskVariantResult.semanticAnalysis.cueAnalyses.find(
  (cue) => cue.cueIndex === 2,
);
const generalRiskCandidates = allDetectedIntents(generalRiskCue)
  .find((intent) => intent.id.endsWith("risk-boundary"))
  ?.componentCandidates.map((candidate) => candidate.componentId);
if (generalRiskCandidates?.includes("LegacyEliminationPanel")) {
  throw new Error("一般风险语义不应把淘汰警告列为候选组件");
}
if (
  variantComponents.get(3)?.includes("LegacyEliminationPanel") ||
  variantComponents.get(4)?.includes("LegacyEliminationPanel")
) {
  throw new Error("规避淘汰或主动淘汰旧设备时误用了淘汰警告动画");
}

const consumerSafetyCalibration = buildSemanticSrtArrangement({
  ...portraitInput,
  durationInFrames: 600,
  entries: [
    { index: 1, startMs: 0, endMs: 2600, text: "致癌物超标9000多倍" },
    { index: 2, startMs: 3000, endMs: 5600, text: "央视检测发现多件样品不达标" },
    { index: 3, startMs: 6000, endMs: 8600, text: "买首饰认准GB28480国家标准" },
    { index: 4, startMs: 9000, endMs: 11600, text: "新饰品先在手腕试戴24小时" },
    { index: 5, startMs: 12000, endMs: 14600, text: "遇到假货保留证据，打12315投诉" },
  ],
});
const calibrationRoutes = new Map(
  consumerSafetyCalibration.semanticAnalysis.cueAnalyses.map((cue) => [
    cue.cueIndex,
    allDetectedIntents(cue).map((intent) => intent.id.replace(/^intent-\d+-/u, "")),
  ]),
);
const expectCalibrationRoutes = (cueIndex, expected, forbidden = []) => {
  const actual = calibrationRoutes.get(cueIndex) ?? [];
  for (const routeId of expected) {
    if (!actual.includes(routeId)) {
      throw new Error(`消费安全校准 ${cueIndex} 没有命中 ${routeId}：${actual.join(",")}`);
    }
  }
  for (const routeId of forbidden) {
    if (actual.includes(routeId)) {
      throw new Error(`消费安全校准 ${cueIndex} 不应命中 ${routeId}`);
    }
  }
};
expectCalibrationRoutes(1, ["risk-boundary", "metric-decision"]);
expectCalibrationRoutes(2, ["risk-boundary", "evidence-source"]);
expectCalibrationRoutes(3, ["evidence-source", "action-advice"], ["metric-decision"]);
expectCalibrationRoutes(4, ["action-advice"], ["metric-decision"]);
expectCalibrationRoutes(5, ["risk-boundary", "action-advice"], ["metric-decision", "evidence-source"]);
const firstCueItems = sentencePatternResult.motionTimeline.filter((item) =>
  ["intent-001-chapter-transition", "intent-001-risk-boundary"].includes(
    item.sourceIntentId,
  ),
);
if (
  firstCueItems.length !== 2 ||
  firstCueItems[0].startFrame + firstCueItems[0].durationInFrames >
    firstCueItems[1].startFrame
) {
  throw new Error("同一字幕的多个竖屏意图没有按顺序播放");
}
const millionMetric = sentencePatternResult.motionTimeline.find(
  (item) =>
    item.componentId === "PortraitMetricDecision" &&
    item.sourceIntentId === "intent-006-metric-decision",
);
if (millionMetric?.props?.value !== "100" || millionMetric.props.unit !== "万") {
  throw new Error("中文数量级“百万”没有转换成可展示的 100 万指标");
}
if (
  !sentencePatternResult.semanticAnalysis.cueAnalyses.every((cue) =>
    cue.intents.every(
      (intent) =>
        Number.isFinite(intent.score) &&
        intent.score >= intent.minimumScore &&
        intent.signals.length > 0,
    ),
  )
) {
  throw new Error("句式评分没有保留分数、阈值和命中信号");
}

process.stdout.write(
  `✓ SRT 语义编排通过：landscapeMotion=${first.motionTimeline.length} portraitMotion=${portraitFirst.motionTimeline.length} portraitIntents=${portraitFirst.semanticAnalysis.intentCount} captions=separate-toggle bgm=forbidden\n`,
);
