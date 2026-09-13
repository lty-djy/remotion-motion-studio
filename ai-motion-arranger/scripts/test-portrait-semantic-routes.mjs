#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  PORTRAIT_ROUTE_COMPONENT_IDS,
  PORTRAIT_ROUTING_POLICY,
  PORTRAIT_SEMANTIC_ROUTES,
} from "../portrait-semantic-routes.mjs";
import { loadRuntimeRegistry } from "./load-runtime-registry.mjs";

const root = resolve(import.meta.dirname, "..", "..");
const resourceIndex = JSON.parse(
  await readFile(resolve(root, "public", "input", "resource-index.json"), "utf8"),
);
const indexedResources = new Set(
  Object.entries(resourceIndex.libraries).flatMap(([library, entries]) =>
    entries.map((entry) => `${library}:${entry.id}`),
  ),
);
const registry = await loadRuntimeRegistry();
const definitions = new Map(registry.map((definition) => [definition.id, definition]));
const expectedComponentIds = [
  "PortraitChapterRail",
  "PortraitMetricDecision",
  "PortraitStepStageTitle",
  "PortraitStepNumberList",
  "PortraitStaggeredToolList",
  "PortraitToolBadgeList",
  "PortraitToolListTitle",
  "PortraitPromptMistakeDiagnosis",
  "PortraitWorkflowPrerequisite",
  "PortraitSkillSourceFusion",
  "PortraitDesignRuleChecklist",
  "PortraitSkillResultComparison",
  "PortraitPromptIterationShowcase",
  "PortraitCodeDecisionChecklist",
  "PortraitBrowserRepairLoop",
  "PortraitAgentBrowserMedia",
  "PortraitSkillStepGrid",
  "PortraitAiOutputGapComparison",
  "PortraitRiskWarning",
  "LegacyEliminationPanel",
  "PortraitNextEpisodeTitle",
  "PortraitFollowCta",
  "ComparisonProgressBars",
  "MilestoneFollowerProgress",
];
const allowedAnchors = new Set([
  "left-top",
  "center-top",
  "right-top",
  "left-center",
  "right-center",
]);

if (PORTRAIT_SEMANTIC_ROUTES.length !== 22) {
  throw new Error("竖屏语义路由必须覆盖 22 类明确语义。");
}
if (new Set(PORTRAIT_SEMANTIC_ROUTES.map((route) => route.id)).size !== 22) {
  throw new Error("竖屏语义路由 id 重复。");
}
if (
  JSON.stringify([...PORTRAIT_ROUTE_COMPONENT_IDS].sort()) !==
    JSON.stringify([...expectedComponentIds].sort())
) {
  throw new Error("竖屏语义路由没有完整覆盖 26 个参考组件。");
}

for (const route of PORTRAIT_SEMANTIC_ROUTES) {
  if (!route.label || !route.intentType || !Number.isFinite(route.priority)) {
    throw new Error(`${route.id} 缺少可解释的语义标签、类型或优先级。`);
  }
  if (
    !Array.isArray(route.match?.anyKeywords) ||
    route.match.anyKeywords.length === 0 ||
    !Array.isArray(route.match?.patternSources)
  ) {
    throw new Error(`${route.id} 缺少关键词或模式规则。`);
  }
  for (const patternSource of route.match.patternSources) {
    new RegExp(patternSource, "iu");
  }
  if (
    !Number.isFinite(route.match.minimumScore) ||
    route.match.minimumScore < 1
  ) {
    throw new Error(`${route.id} 缺少有效的最低命中分数。`);
  }
  for (const signal of [
    ...(route.match.boosts ?? []),
    ...(route.match.suppressors ?? []),
  ]) {
    new RegExp(signal.patternSource, "iu");
    if (!signal.label || !Number.isFinite(signal.weight) || signal.weight <= 0) {
      throw new Error(`${route.id} 存在无效的加减分信号。`);
    }
  }
  if (route.components.filter((component) => component.role === "primary").length !== 1) {
    throw new Error(`${route.id} 必须且只能有一个主组件。`);
  }
  if (
    !indexedResources.has(`icons:${route.resources?.iconId}`) ||
    !indexedResources.has(`sfx:${route.resources?.sfxId}`)
  ) {
    throw new Error(`${route.id} 引用了固定资源索引之外的图标或音效。`);
  }

  for (const selection of route.components) {
    const definition = definitions.get(selection.componentId);
    if (!definition) {
      throw new Error(`${route.id} 引用了不存在的组件 ${selection.componentId}。`);
    }
    const allowedGroups = new Set(["竖屏口播信息层", "风险提醒", "图表与比较", "数字与指标", "数字", "媒体展示组件"]);
    if (!allowedGroups.has(definition.catalogGroup)) {
      throw new Error(`${selection.componentId} 不属于允许的语义效果分组。`);
    }
    for (const propName of Object.keys(selection.propBindings ?? {})) {
      if (!definition.propsSchema?.[propName]) {
        throw new Error(`${route.id} 向 ${selection.componentId} 写入了不存在的参数 ${propName}。`);
      }
    }
    if (!allowedAnchors.has(selection.layout?.anchor)) {
      throw new Error(`${route.id} 使用了不支持的首选布局锚点。`);
    }
    if (
      !selection.layout.fallbackAnchors.every((anchor) => allowedAnchors.has(anchor))
    ) {
      throw new Error(`${route.id} 使用了不支持的备用布局锚点。`);
    }
    if (
      !Number.isFinite(selection.layout.preferredScale) ||
      selection.layout.preferredScale < 0.3 ||
      selection.layout.preferredScale > 1.2
    ) {
      throw new Error(`${route.id} 的首选缩放不在 0.3–1.2 范围内。`);
    }
  }
}

const representativeCues = new Map([
  ["chapter-transition", "下一步进入制作环节。"],
  ["info-callout", "比如可以使用这个增强工具。"],
  ["evidence-source", "央视检测发现多件样品不达标。"],
  ["enumerated-tool-list", "就是这4个skill，今天我一个一个讲清楚。"],
  ["direct-prompt-mistake", "打开 Codex 就直接问帮我做一个官网。"],
  ["workflow-prerequisite", "动手之前先把这套工作流装好。"],
  ["skill-source-fusion", "它不是凭空来的，审美判断是跟 Taste 学的。"],
  ["design-rule-checklist", "它负责整个网页的设计审美，怎么排版怎么留白。"],
  ["skill-result-comparison", "这是没装它的时候，AI 随手做出来的默认效果。"],
  ["prompt-iteration-showcase", "那具体怎么用，第一句做一个摄影工作室的品牌官网。"],
  ["code-decision-checklist", "让AI先想这个功能真的需要吗。"],
  ["browser-repair-loop", "让agent自己打开浏览器并循环检查。"],
  ["browser-self-check-media", "你现在看到的这一整页就是逐屏自查结果。"],
  ["skill-step-grid", "就是这4个skill，今天我一个一个讲清楚。"],
  ["ai-output-gap-comparison", "有人做出来一眼就是 AI 糊的，有人能直接上线。"],
  ["metric-decision", "1K 的速度更快，成本也更低。"],
  ["process-steps", "首先导入字幕，然后生成编排，最后插入时间线。"],
  ["action-advice", "购买时认准国家标准并去正规店铺。"],
  ["risk-boundary", "但是要注意，它不能修复错误口型。"],
  ["comparison-progress-bars", "过去是短平快内容，现在转向深度中长视频，持续扶持。"],
  ["milestone-follower-progress", "今年的涨粉目标是年底达到50万粉丝。"],
  ["next-episode-cta", "下期介绍自动剪辑，记得关注。"],
]);
const routeMatches = (route, text) =>
  route.match.anyKeywords.some((keyword) => text.includes(keyword)) ||
  route.match.patternSources.some((source) => new RegExp(source, "iu").test(text));
for (const route of PORTRAIT_SEMANTIC_ROUTES) {
  const cue = representativeCues.get(route.id);
  if (!cue || !routeMatches(route, cue)) {
    throw new Error(`${route.id} 的代表字幕无法命中自身路由。`);
  }
}

const metricRoute = PORTRAIT_SEMANTIC_ROUTES.find(
  (route) => route.id === "metric-decision",
);
if (metricRoute?.components[0]?.componentId !== "PortraitMetricDecision") {
  throw new Error("数字决策路由必须保留主数据卡。");
}

const riskRoute = PORTRAIT_SEMANTIC_ROUTES.find(
  (route) => route.id === "risk-boundary",
);
if (
  riskRoute?.components[0]?.componentId !== "PortraitRiskWarning" ||
  riskRoute.components[0]?.activation !== "unless-elimination-warning" ||
  !riskRoute.components.some(
    (component) =>
      component.componentId === "LegacyEliminationPanel" &&
      component.role === "alternative" &&
      component.activation === "when-elimination-warning",
  )
) {
  throw new Error("风险路由没有建立一般风险卡与淘汰警告的互斥分流。");
}

if (
  PORTRAIT_ROUTING_POLICY.orientation !== "portrait" ||
  PORTRAIT_ROUTING_POLICY.maxIntentsPerCue !== 3 ||
  PORTRAIT_ROUTING_POLICY.supportsMultipleIntentsPerCue !== true ||
  PORTRAIT_ROUTING_POLICY.supportsMultipleComponentsPerIntent !== true
) {
  throw new Error("竖屏路由没有保留一句多意图与一意图多组件能力。");
}
if (
  PORTRAIT_ROUTING_POLICY.baseCaptionTrack !== "separate-toggle" ||
  PORTRAIT_ROUTING_POLICY.bgm !== "forbidden"
) {
  throw new Error("竖屏路由必须使用独立字幕开关且不得生成 BGM。");
}
if (
  PORTRAIT_ROUTING_POLICY.captionSafeZone.startRatio !== 0.8 ||
  !PORTRAIT_ROUTING_POLICY.layout.avoid.includes("captions") ||
  !PORTRAIT_ROUTING_POLICY.layout.avoid.includes("face")
) {
  throw new Error("竖屏路由没有保留人物避让与底部字幕安全区。");
}
if (
  PORTRAIT_ROUTING_POLICY.applyPolicy.previewBeforeApply !== true ||
  PORTRAIT_ROUTING_POLICY.applyPolicy.requireUserConfirmation !== true ||
  PORTRAIT_ROUTING_POLICY.applyPolicy.existingTimeline !== "preserve"
) {
  throw new Error("竖屏路由没有强制预览、确认和保留原时间线。");
}

console.log(
  `✓ 竖屏语义路由通过：routes=${PORTRAIT_SEMANTIC_ROUTES.length} components=${PORTRAIT_ROUTE_COMPONENT_IDS.length} multiIntent=on captions=separate-toggle bgm=forbidden`,
);
