#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSemanticSrtArrangement } from "../semantic-srt-arranger.mjs";
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

process.stdout.write(
  `✓ SRT 语义编排通过：cues=${first.semanticAnalysis.cueCount} intents=${first.semanticAnalysis.intentCount} motion=${first.motionTimeline.length} resources=${first.resourceTracks.length} skipped=${first.semanticAnalysis.skippedCueCount}\n`,
);
