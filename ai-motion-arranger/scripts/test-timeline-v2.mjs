#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { convertVisualScriptToTimeline } from "./visual-script-to-timeline.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const script = JSON.parse(
  await readFile(join(here, "..", "examples", "sample-visual-script-v2.json"), "utf8"),
);
const timeline = convertVisualScriptToTimeline(script);

if (timeline.motionTimeline.length !== 3) {
  throw new Error(`预期 3 个动效轨道项，实际 ${timeline.motionTimeline.length}`);
}
if (timeline.resourceTracks.length !== 2) {
  throw new Error(`预期 2 个资源轨道项，实际 ${timeline.resourceTracks.length}`);
}
const kinds = new Set(timeline.resourceTracks.map((track) => track.kind));
for (const kind of ["icon", "sfx"]) {
  if (!kinds.has(kind)) throw new Error(`缺少 ${kind} 资源轨道`);
}
if (!timeline.motionTimeline.every((item) => item.position && item.props)) {
  throw new Error("动效轨道缺少确定性位置或 props");
}
if (!timeline.resourceTracks.every((track) => track.url.startsWith("/input/"))) {
  throw new Error("资源轨道没有解析为固定 /input/ URL");
}
const sfxTrack = timeline.resourceTracks.find((track) => track.kind === "sfx");
if (!sfxTrack || sfxTrack.durationInFrames > sfxTrack.sourceDurationInFrames) {
  throw new Error("一次性音效时长不能超过资源本身时长");
}

process.stdout.write(
  `✓ timeline v2 转换通过：motion=${timeline.motionTimeline.length} resources=${timeline.resourceTracks.length}\n`,
);
