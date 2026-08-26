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

process.stdout.write(
  `✓ SRT 语义编排通过：landscapeMotion=${first.motionTimeline.length} portraitMotion=${portraitFirst.motionTimeline.length} portraitIntents=${portraitFirst.semanticAnalysis.intentCount} captions=forbidden bgm=forbidden\n`,
);
