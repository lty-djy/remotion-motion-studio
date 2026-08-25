#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateVisualScript } from "./validate-visual-script.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const { REGISTERED_CARDS } = await import(
  pathToFileURL(join(here, "registry-meta.mjs")).href
);
const resourceIndex = JSON.parse(
  await readFile(join(here, "..", "..", "public", "input", "resource-index.json"), "utf8"),
);

const COLOR_VALUES = {
  cyan: "#55e6ff",
  violet: "#a879ff",
  amber: "#ffbd66",
  lime: "#8fe388",
  rose: "#ff7e9f",
  teal: "#55d6c2",
  gold: "#e8c56a",
  neutral: "#d7d7d7",
  "support-neutral": "#7a7d84",
  success: "#71d59c",
  warning: "#ffbd66",
  danger: "#ff6b7a",
  info: "#6da7ff",
};
const SIZE_SCALE = { small: 0.55, medium: 0.78, large: 1, "full-width": 1.2 };
const ICON_SIZE = { small: 96, medium: 144, large: 220, "full-width": 360 };
const MATERIAL_WIDTH_RATIO = { small: 0.24, medium: 0.4, large: 0.58, "full-width": 0.88 };

const positionAtAnchor = (anchor, width, height, canvasWidth, canvasHeight) => {
  const margin = Math.round(Math.min(canvasWidth, canvasHeight) * 0.06);
  const centerX = Math.round((canvasWidth - width) / 2);
  const centerY = Math.round((canvasHeight - height) / 2);
  const left = margin;
  const right = Math.max(margin, canvasWidth - width - margin);
  const top = margin;
  const bottom = Math.max(margin, canvasHeight - height - margin);
  const positions = {
    "left-top": { x: left, y: top },
    "center-top": { x: centerX, y: top },
    "right-top": { x: right, y: top },
    "left-center": { x: left, y: centerY },
    "center-stage": { x: centerX, y: centerY },
    "right-center": { x: right, y: centerY },
    "left-bottom": { x: left, y: bottom },
    "bottom-rail": { x: centerX, y: bottom },
    "right-bottom": { x: right, y: bottom },
  };
  return positions[anchor] ?? positions["center-stage"];
};

const resolveMotionPosition = (expression, definition, project) => {
  const scale = SIZE_SCALE[expression.layout.size] ?? 1;
  const width = definition.bounds.width * scale;
  const height = definition.bounds.height * scale;
  const anchor = positionAtAnchor(
    expression.layout.anchor,
    width,
    height,
    project.canvas.width,
    project.canvas.height,
  );
  return {
    x: Math.round(anchor.x - definition.bounds.x * scale),
    y: Math.round(anchor.y - definition.bounds.y * scale),
    scale,
  };
};

const resolveResourcePosition = (expression, project) => {
  const { width: canvasWidth, height: canvasHeight } = project.canvas;
  let width;
  let height;
  if (expression.kind === "icon") {
    width = ICON_SIZE[expression.layout.size] ?? ICON_SIZE.medium;
    height = width;
  } else {
    width = Math.round(
      canvasWidth * (MATERIAL_WIDTH_RATIO[expression.layout.size] ?? 0.4),
    );
    height = Math.round(width * 9 / 16);
  }
  const anchor = positionAtAnchor(
    expression.layout.anchor,
    width,
    height,
    canvasWidth,
    canvasHeight,
  );
  return {
    ...anchor,
    width,
    height,
    scale: 1,
    zIndex: expression.layout.zIndex,
  };
};

const resolveProps = (props) =>
  Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      typeof value === "string" && COLOR_VALUES[value]
        ? COLOR_VALUES[value]
        : value,
    ]),
  );

export const convertVisualScriptToTimeline = (script) => {
  const validation = validateVisualScript(script);
  if (!validation.valid) {
    throw new Error(`Visual Script 未通过校验：\n${validation.errors.join("\n")}`);
  }

  const definitions = new Map(REGISTERED_CARDS.map((entry) => [entry.id, entry]));
  const resources = new Map(
    Object.entries(resourceIndex.libraries).flatMap(([library, entries]) =>
      entries.map((entry) => [`${library}:${entry.id}`, entry]),
    ),
  );
  const motionTimeline = [];
  const resourceTracks = [];
  let trackOrder = 0;

  for (const segment of script.segments) {
    for (const expression of segment.expressions) {
      if (!expression.enabled || expression.kind === "caption") continue;
      const startFrame = expression.timing.startFrame;
      const durationInFrames = expression.timing.endFrame - startFrame;
      if (expression.kind === "effect") {
        const definition = definitions.get(expression.component.componentId);
        motionTimeline.push({
          componentId: expression.component.componentId,
          startFrame,
          durationInFrames,
          laneId: `motion-${expression.id}`,
          trackOrder: trackOrder++,
          visible: true,
          sourceStartFrame: 0,
          position: resolveMotionPosition(expression, definition, script.project),
          backgroundOpacity: 0,
          props: resolveProps(expression.component.props),
          sourceExpressionId: expression.id,
          sourceIntentId: expression.intentId,
        });
        continue;
      }

      const resource = resources.get(
        `${expression.resource.library}:${expression.resource.resourceId}`,
      );
      const audioFrames = resource.media?.durationSeconds
        ? Math.max(3, Math.round(resource.media.durationSeconds * script.project.fps))
        : durationInFrames;
      const isAudio = expression.kind === "sfx" || expression.kind === "bgm";
      const trackDurationInFrames = expression.kind === "sfx"
        ? Math.min(durationInFrames, audioFrames)
        : durationInFrames;
      resourceTracks.push({
        id: `resource-${expression.id}`,
        laneId: `${expression.kind}-${expression.id}`,
        trackOrder: trackOrder++,
        kind: expression.kind,
        resourceId: expression.resource.resourceId,
        name: resource.label,
        url: resource.url,
        mimeType: resource.mimeType,
        sourceStartFrame: 0,
        sourceDurationInFrames: isAudio ? audioFrames : durationInFrames,
        startFrame,
        durationInFrames: trackDurationInFrames,
        visible: true,
        position: isAudio
          ? { x: 0, y: 0, width: 0, height: 0, scale: 1, zIndex: 0 }
          : resolveResourcePosition(expression, script.project),
        volume: expression.audio?.volume ?? 1,
        voiceDucking: expression.audio?.voiceDucking ?? 0,
        loop: expression.kind === "bgm",
        sourceExpressionId: expression.id,
        sourceIntentId: expression.intentId,
      });
    }
  }

  return {
    timelineVersion: "2.0",
    sourceSchemaVersion: script.schemaVersion,
    project: script.project,
    qualityControl: script.qualityControl,
    applyPolicy: script.applyPolicy,
    motionTimeline,
    resourceTracks,
  };
};

const main = async () => {
  const input = process.argv[2];
  const output = process.argv[3];
  if (!input) {
    process.stderr.write(
      "用法：node scripts/visual-script-to-timeline.mjs <visual-script.json> [timeline.json]\n",
    );
    process.exit(2);
  }
  const script = JSON.parse(await readFile(resolve(input), "utf8"));
  const timelineJson = `${JSON.stringify(convertVisualScriptToTimeline(script), null, 2)}\n`;
  if (output) {
    const outputPath = resolve(output);
    await writeFile(outputPath, timelineJson, "utf8");
    process.stdout.write(`✓ 已生成时间线 JSON：${outputPath}\n`);
    return;
  }
  process.stdout.write(timelineJson);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`转换 Visual Script 失败：${error?.message ?? error}\n`);
    process.exit(1);
  });
}
