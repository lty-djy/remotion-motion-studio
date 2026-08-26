#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyAvoidanceLayout,
  createKnownAvoidanceRegions,
  rectanglesOverlap,
} from "../avoidance-layout-planner.mjs";
import { buildSemanticSrtArrangement } from "../semantic-srt-arranger.mjs";
import { PORTRAIT_ROUTE_COMPONENT_IDS } from "../portrait-semantic-routes.mjs";
import { loadRuntimeRegistry } from "./load-runtime-registry.mjs";
import { REGISTERED_CARDS } from "./registry-meta.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const resourceIndex = JSON.parse(
  await readFile(join(here, "..", "..", "public", "input", "resource-index.json"), "utf8"),
);
const runtimeCards = await loadRuntimeRegistry();
const definitions = new Map(runtimeCards.map((card) => [card.id, card]));
const validateCanvas = (canvas) => {
  const timeline = buildSemanticSrtArrangement({
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
    availableComponentIds:
      canvas.orientation === "portrait"
        ? PORTRAIT_ROUTE_COMPONENT_IDS
        : REGISTERED_CARDS.map((card) => card.id),
    resourceIndex,
  });
  const arranged = applyAvoidanceLayout({
    timeline,
    canvas,
    componentDefinitions: runtimeCards,
    includeFace: true,
    includeCaptions: true,
  });
  if (arranged.layoutSummary.unresolvedCount !== 0) {
    throw new Error(
      `${canvas.orientation} 仍有 ${arranged.layoutSummary.unresolvedCount} 个视觉项未避开安全区`,
    );
  }
  const obstacles = createKnownAvoidanceRegions({
    canvas,
    includeFace: true,
    includeCaptions: true,
  });
  const visuals = arranged.motionTimeline.map((item) => {
    const definition = definitions.get(item.componentId);
    return {
      id: item.componentId,
      startFrame: item.startFrame,
      endFrame: item.startFrame + item.durationInFrames,
      rect: {
        x: item.position.x + definition.bounds.x * item.position.scale,
        y: item.position.y + definition.bounds.y * item.position.scale,
        width: definition.bounds.width * item.position.scale,
        height: definition.bounds.height * item.position.scale,
      },
    };
  });
  for (const track of arranged.resourceTracks.filter((item) => item.kind !== "sfx")) {
    visuals.push({
      id: track.resourceId,
      startFrame: track.startFrame,
      endFrame: track.startFrame + track.durationInFrames,
      rect: {
        x: track.position.x,
        y: track.position.y,
        width: track.position.width * track.position.scale,
        height: track.position.height * track.position.scale,
      },
    });
  }
  for (const visual of visuals) {
    if (obstacles.some((obstacle) => rectanglesOverlap(visual.rect, obstacle))) {
      throw new Error(
        `${canvas.orientation} 的 ${visual.id} 仍与人物或字幕安全区重叠`,
      );
    }
    if (
      visual.rect.x < 0 ||
      visual.rect.y < 0 ||
      visual.rect.x + visual.rect.width > canvas.width ||
      visual.rect.y + visual.rect.height > canvas.height
    ) {
      throw new Error(`${canvas.orientation} 的 ${visual.id} 超出画布边界`);
    }
  }
  for (let leftIndex = 0; leftIndex < visuals.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < visuals.length; rightIndex += 1) {
      const left = visuals[leftIndex];
      const right = visuals[rightIndex];
      const overlapsInTime =
        left.startFrame < right.endFrame && right.startFrame < left.endFrame;
      if (overlapsInTime && rectanglesOverlap(left.rect, right.rect)) {
        throw new Error(
          `${canvas.orientation} 的 ${left.id} 与 ${right.id} 同时出现且位置重叠`,
        );
      }
    }
  }
  if (arranged.qualityControl.status !== "pending") {
    throw new Error("布局规划不能提前把自动质检标记为通过");
  }
  return arranged.layoutSummary;
};

const portrait = validateCanvas({
  width: 1080,
  height: 1920,
  orientation: "portrait",
});
const landscape = validateCanvas({
  width: 1920,
  height: 1080,
  orientation: "landscape",
});

process.stdout.write(
  `✓ 自动避让布局通过：portrait=${portrait.visualCount}/${portrait.unresolvedCount} landscape=${landscape.visualCount}/${landscape.unresolvedCount}\n`,
);
