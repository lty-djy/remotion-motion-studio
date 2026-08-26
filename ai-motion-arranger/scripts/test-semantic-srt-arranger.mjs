#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSemanticSrtArrangement } from "../semantic-srt-arranger.mjs";
import { PORTRAIT_ROUTE_COMPONENT_IDS } from "../portrait-semantic-routes.mjs";
import { REGISTERED_CARDS } from "./registry-meta.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const resourceIndex = JSON.parse(
  await readFile(join(here, "..", "..", "public", "input", "resource-index.json"), "utf8"),
);
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
  ],
  fps: 30,
  durationInFrames: 600,
  canvas: { width: 1080, height: 1920, orientation: "portrait" },
  availableComponentIds: PORTRAIT_ROUTE_COMPONENT_IDS,
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
for (const componentId of PORTRAIT_ROUTE_COMPONENT_IDS) {
  if (!portraitComponentIds.has(componentId)) {
    throw new Error(`竖屏语义编排没有生成 ${componentId}`);
  }
}
if (
  !portraitFirst.motionTimeline.every((item) =>
    PORTRAIT_ROUTE_COMPONENT_IDS.includes(item.componentId),
  )
) {
  throw new Error("竖屏语义编排混入了横屏旧组件");
}
if (
  portraitFirst.semanticAnalysis.cueAnalyses.some(
    (cue) => cue.intents.length > 3,
  )
) {
  throw new Error("单条竖屏字幕生成了超过 3 个视觉意图");
}
const metricItems = portraitFirst.motionTimeline.filter((item) =>
  ["PortraitMetricDecision", "PortraitDecisionTagStack"].includes(item.componentId),
);
if (
  metricItems.length !== 2 ||
  new Set(metricItems.map((item) => item.sourceIntentId)).size !== 1
) {
  throw new Error("数字决策没有在同一语义意图下组合数据卡与标签组");
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
      text: "未来3年，卫浴店只有这种门店能够赚钱",
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
    cue.intents.map((intent) => intent.id.replace(/^intent-\d+-/u, "")),
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
expectRoutes(1, ["chapter-transition", "keyword-emphasis"], ["metric-decision"]);
expectRoutes(2, ["risk-boundary"]);
expectRoutes(3, ["keyword-emphasis"]);
expectRoutes(4, ["process-steps"]);
expectRoutes(5, ["metric-decision"], ["risk-boundary"]);
expectRoutes(6, ["metric-decision"]);
const firstCueItems = sentencePatternResult.motionTimeline.filter((item) =>
  ["intent-001-chapter-transition", "intent-001-keyword-emphasis"].includes(
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
  `✓ SRT 语义编排通过：landscapeMotion=${first.motionTimeline.length} portraitMotion=${portraitFirst.motionTimeline.length} portraitIntents=${portraitFirst.semanticAnalysis.intentCount} captions=forbidden bgm=forbidden\n`,
);
