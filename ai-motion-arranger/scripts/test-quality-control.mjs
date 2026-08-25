#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyAvoidanceLayout, createKnownAvoidanceRegions } from "../avoidance-layout-planner.mjs";
import { runTimelineQualityControl } from "../quality-control.mjs";
import { buildSemanticSrtArrangement } from "../semantic-srt-arranger.mjs";
import { REGISTERED_CARDS } from "./registry-meta.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const resourceIndex = JSON.parse(
  await readFile(
    join(here, "..", "..", "public", "input", "resource-index.json"),
    "utf8",
  ),
);
const canvas = { width: 1080, height: 1920, orientation: "portrait" };
const baseTimeline = buildSemanticSrtArrangement({
  entries: [
    {
      index: 1,
      startMs: 0,
      endMs: 5000,
      text: "性能提升42%，然后用代码自动生成编排并插入时间线。",
    },
  ],
  fps: 30,
  durationInFrames: 180,
  canvas,
  availableComponentIds: REGISTERED_CARDS.map((card) => card.id),
  resourceIndex,
});
const arranged = applyAvoidanceLayout({
  timeline: baseTimeline,
  canvas,
  componentDefinitions: REGISTERED_CARDS,
  includeFace: true,
  includeCaptions: true,
});
const checked = runTimelineQualityControl({
  timeline: arranged,
  canvas,
  componentDefinitions: REGISTERED_CARDS,
  resourceIndex,
  includeFace: true,
  includeCaptions: true,
});

if (checked.qualityControl.status !== "passed") {
  throw new Error(`安全编排应通过质检，实际为 ${checked.qualityControl.status}`);
}
if (
  checked.qualityControl.checks.length !== 5 ||
  checked.qualityControlSummary.passedCount !== 5
) {
  throw new Error("安全编排必须包含并通过全部 5 项质检");
}

const pending = runTimelineQualityControl({
  timeline: arranged,
  canvas,
  componentDefinitions: REGISTERED_CARDS,
  resourceIndex,
  includeFace: false,
  includeCaptions: true,
});
const pendingFace = pending.qualityControl.checks.find(
  (check) => check.type === "face-occlusion",
);
if (
  pending.qualityControl.status !== "pending" ||
  pendingFace?.status !== "pending"
) {
  throw new Error("未启用人物占位时，人物遮挡检查必须诚实标记为待检查");
}

const unsafe = structuredClone(arranged);
const definitions = new Map(REGISTERED_CARDS.map((card) => [card.id, card]));
const regions = createKnownAvoidanceRegions({
  canvas,
  includeFace: true,
  includeCaptions: true,
});
const faceRegion = regions.find((region) => region.kind === "face");
const captionRegion = regions.find((region) => region.kind === "captions");
const placeInRegion = (item, region) => {
  const definition = definitions.get(item.componentId);
  const scale = 0.2;
  item.position = {
    x: region.x - definition.bounds.x * scale,
    y: region.y - definition.bounds.y * scale,
    scale,
  };
};
placeInRegion(unsafe.motionTimeline[0], faceRegion);
placeInRegion(unsafe.motionTimeline[1], captionRegion);
unsafe.resourceTracks[0].resourceId = "missing-resource";
const loudSfx = unsafe.resourceTracks.find((track) => track.kind === "sfx");
loudSfx.volume = 1;
loudSfx.voiceDucking = 0;
unsafe.resourceTracks.at(-1).startFrame = unsafe.project.durationInFrames - 1;
unsafe.resourceTracks.at(-1).durationInFrames = 8;

const failed = runTimelineQualityControl({
  timeline: unsafe,
  canvas,
  componentDefinitions: REGISTERED_CARDS,
  resourceIndex,
  includeFace: true,
  includeCaptions: true,
});
if (
  failed.qualityControl.status !== "failed" ||
  failed.qualityControlSummary.failedCount !== 5
) {
  throw new Error(
    `异常编排应使 5 项质检全部失败，实际失败 ${failed.qualityControlSummary.failedCount} 项`,
  );
}
for (const check of failed.qualityControl.checks) {
  if (check.status !== "failed" || check.affectedExpressionIds.length === 0) {
    throw new Error(`${check.type} 未返回失败项的稳定表达 ID`);
  }
}

process.stdout.write(
  `✓ 自动质检通过：安全=5/5 待定=${pending.qualityControlSummary.pendingCount} 异常失败=${failed.qualityControlSummary.failedCount}/5\n`,
);
