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
    "LegacyModelEliminationWarning",
  ].includes(id),
)) {
  if (!portraitComponentIds.has(componentId)) {
    throw new Error(`竖屏语义编排没有生成 ${componentId}`);
  }
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
  eliminationItem?.componentId !== "LegacyModelEliminationWarning" ||
  eliminationItem.props.title !== "单纯卖货" ||
  eliminationItem.props.stampText !== "市场淘汰" ||
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
if (!variantComponents.get(1)?.includes("LegacyModelEliminationWarning")) {
  throw new Error("旧方案过时的同义表达没有选择淘汰警告动画");
}
if (
  !variantComponents.get(2)?.includes("PortraitRiskWarning") ||
  variantComponents.get(2)?.includes("LegacyModelEliminationWarning")
) {
  throw new Error("一般风险提醒没有继续使用原风险卡");
}
const generalRiskCue = riskVariantResult.semanticAnalysis.cueAnalyses.find(
  (cue) => cue.cueIndex === 2,
);
const generalRiskCandidates = allDetectedIntents(generalRiskCue)
  .find((intent) => intent.id.endsWith("risk-boundary"))
  ?.componentCandidates.map((candidate) => candidate.componentId);
if (generalRiskCandidates?.includes("LegacyModelEliminationWarning")) {
  throw new Error("一般风险语义不应把淘汰警告列为候选组件");
}
if (
  variantComponents.get(3)?.includes("LegacyModelEliminationWarning") ||
  variantComponents.get(4)?.includes("LegacyModelEliminationWarning")
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
