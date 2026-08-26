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
  "PortraitKeywordBurst",
  "PortraitInfoCallout",
  "PortraitMetricDecision",
  "PortraitDecisionTagStack",
  "PortraitStepChecklist",
  "PortraitRiskWarning",
  "LegacyModelEliminationWarning",
  "PortraitNextEpisodeCta",
];
const allowedAnchors = new Set([
  "left-top",
  "center-top",
  "right-top",
  "left-center",
  "right-center",
]);

if (PORTRAIT_SEMANTIC_ROUTES.length !== 7) {
  throw new Error("竖屏语义路由必须保持 7 类明确语义。");
}
if (new Set(PORTRAIT_SEMANTIC_ROUTES.map((route) => route.id)).size !== 7) {
  throw new Error("竖屏语义路由 id 重复。");
}
if (
  JSON.stringify([...PORTRAIT_ROUTE_COMPONENT_IDS].sort()) !==
  JSON.stringify([...expectedComponentIds].sort())
) {
  throw new Error("竖屏语义路由没有完整覆盖 8 个参考组件。");
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
    const allowedGroups = new Set(["竖屏口播信息层", "风险提醒"]);
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
  ["keyword-emphasis", "这里最核心的就是自动化。"],
  ["info-callout", "比如可以使用这个增强工具。"],
  ["metric-decision", "1K 的速度更快，成本也更低。"],
  ["process-steps", "首先导入字幕，然后生成编排，最后插入时间线。"],
  ["risk-boundary", "但是要注意，它不能修复错误口型。"],
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
if (
  metricRoute?.components[0]?.componentId !== "PortraitMetricDecision" ||
  !metricRoute.components.some(
    (component) =>
      component.componentId === "PortraitDecisionTagStack" &&
      component.role === "supporting",
  )
) {
  throw new Error("数字决策路由必须支持主数据卡与辅助标签组组合。");
}

const riskRoute = PORTRAIT_SEMANTIC_ROUTES.find(
  (route) => route.id === "risk-boundary",
);
if (
  riskRoute?.components[0]?.componentId !== "PortraitRiskWarning" ||
  riskRoute.components[0]?.activation !== "unless-elimination-warning" ||
  !riskRoute.components.some(
    (component) =>
      component.componentId === "LegacyModelEliminationWarning" &&
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
  PORTRAIT_ROUTING_POLICY.baseCaptionTrack !== "forbidden" ||
  PORTRAIT_ROUTING_POLICY.bgm !== "forbidden"
) {
  throw new Error("竖屏路由不得生成基础字幕轨道或 BGM。");
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
  `✓ 竖屏语义路由通过：routes=${PORTRAIT_SEMANTIC_ROUTES.length} components=${PORTRAIT_ROUTE_COMPONENT_IDS.length} multiIntent=on captions=forbidden bgm=forbidden`,
);
