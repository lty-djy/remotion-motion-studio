import {
  createKnownAvoidanceRegions,
  rectanglesOverlap,
} from "./avoidance-layout-planner.mjs";

const CHECK_TYPES = [
  "face-occlusion",
  "caption-occlusion",
  "asset-availability",
  "voice-masking",
  "timeline-bounds",
];

const stableExpressionId = (value, fallback) => {
  const text = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(text) ? text : fallback;
};

const unique = (values) => [...new Set(values)];

const result = (type, status, message, affectedExpressionIds = []) => ({
  type,
  status,
  message,
  affectedExpressionIds: unique(affectedExpressionIds),
});

const motionRect = (item, definition) => {
  if (!definition?.bounds) return null;
  const defaultPosition = definition.defaultPosition ?? {
    x: 0,
    y: 0,
    scale: 1,
  };
  const position = item.position ?? defaultPosition;
  const scale = Number.isFinite(position.scale) ? position.scale : 1;
  return {
    x: (Number.isFinite(position.x) ? position.x : 0) +
      definition.bounds.x * scale,
    y: (Number.isFinite(position.y) ? position.y : 0) +
      definition.bounds.y * scale,
    width: definition.bounds.width * scale,
    height: definition.bounds.height * scale,
  };
};

const resourceRect = (track) => {
  if (track.kind === "sfx" || !track.position) return null;
  const scale = Number.isFinite(track.position.scale)
    ? track.position.scale
    : 1;
  return {
    x: track.position.x,
    y: track.position.y,
    width: track.position.width * scale,
    height: track.position.height * scale,
  };
};

const collectVisuals = (timeline, definitions) => [
  ...timeline.motionTimeline.flatMap((item, index) => {
    const rect = motionRect(item, definitions.get(item.componentId));
    return rect
      ? [{
          expressionId: stableExpressionId(
            item.sourceExpressionId,
            `motion-qc-${String(index + 1).padStart(3, "0")}`,
          ),
          rect,
        }]
      : [];
  }),
  ...timeline.resourceTracks.flatMap((track, index) => {
    const rect = resourceRect(track);
    return rect
      ? [{
          expressionId: stableExpressionId(
            track.sourceExpressionId,
            `resource-qc-${String(index + 1).padStart(3, "0")}`,
          ),
          rect,
        }]
      : [];
  }),
];

const checkOcclusion = ({
  type,
  kind,
  label,
  enabled,
  visuals,
  canvas,
}) => {
  if (!enabled) {
    return result(
      type,
      "pending",
      `${label}未启用，无法执行该项遮挡检查。`,
    );
  }
  const region = createKnownAvoidanceRegions({
    canvas,
    includeFace: kind === "face",
    includeCaptions: kind === "captions",
  }).find((candidate) => candidate.kind === kind);
  const affected = region
    ? visuals
        .filter((visual) => rectanglesOverlap(visual.rect, region))
        .map((visual) => visual.expressionId)
    : [];
  return affected.length > 0
    ? result(
        type,
        "failed",
        `${affected.length} 个视觉项与${label}重叠。`,
        affected,
      )
    : result(type, "passed", `未发现视觉项遮挡${label}。`);
};

const resourceLibrary = (kind) =>
  kind === "icon" ? "icons" : kind === "material" ? "materials" : "sfx";

const checkAssets = (timeline, definitions, resourceIndex) => {
  const affected = [];
  timeline.motionTimeline.forEach((item, index) => {
    if (!definitions.has(item.componentId)) {
      affected.push(
        stableExpressionId(
          item.sourceExpressionId,
          `motion-qc-${String(index + 1).padStart(3, "0")}`,
        ),
      );
    }
  });
  timeline.resourceTracks.forEach((track, index) => {
    const entries = resourceIndex?.libraries?.[resourceLibrary(track.kind)];
    const indexed = Array.isArray(entries)
      ? entries.find((entry) => entry?.id === track.resourceId)
      : null;
    if (
      !indexed ||
      indexed.url !== track.url ||
      indexed.mimeType !== track.mimeType
    ) {
      affected.push(
        stableExpressionId(
          track.sourceExpressionId,
          `resource-qc-${String(index + 1).padStart(3, "0")}`,
        ),
      );
    }
  });
  return affected.length > 0
    ? result(
        "asset-availability",
        "failed",
        `${affected.length} 项组件或固定资源引用无效。`,
        affected,
      )
    : result(
        "asset-availability",
        "passed",
        "组件与固定资源 ID、URL、类型均有效。",
      );
};

const checkVoiceMasking = (timeline) => {
  const affected = timeline.resourceTracks.flatMap((track, index) => {
    if (track.kind !== "sfx") return [];
    const volume = Number.isFinite(track.volume) ? track.volume : 1;
    const ducking = Number.isFinite(track.voiceDucking)
      ? track.voiceDucking
      : 0;
    const effectiveVolume = volume * (1 - ducking);
    const risky = effectiveVolume > 0.35 || (volume > 0.45 && ducking < 0.5);
    return risky
      ? [
          stableExpressionId(
            track.sourceExpressionId,
            `resource-qc-${String(index + 1).padStart(3, "0")}`,
          ),
        ]
      : [];
  });
  return affected.length > 0
    ? result(
        "voice-masking",
        "failed",
        `${affected.length} 条音效按混音参数存在盖住人声的风险。`,
        affected,
      )
    : result(
        "voice-masking",
        "passed",
        "音效音量与人声闪避参数处于安全范围。",
      );
};

const checkTimelineBounds = (timeline, canvas, visuals) => {
  const durationInFrames = Number(timeline.project?.durationInFrames);
  const affected = [];
  const timedItems = [
    ...timeline.motionTimeline.map((item, index) => ({
      item,
      expressionId: stableExpressionId(
        item.sourceExpressionId,
        `motion-qc-${String(index + 1).padStart(3, "0")}`,
      ),
    })),
    ...timeline.resourceTracks.map((item, index) => ({
      item,
      expressionId: stableExpressionId(
        item.sourceExpressionId,
        `resource-qc-${String(index + 1).padStart(3, "0")}`,
      ),
    })),
  ];
  timedItems.forEach(({ item, expressionId }) => {
    const start = Number(item.startFrame);
    const duration = Number(item.durationInFrames);
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(duration) ||
      start < 0 ||
      duration < 3 ||
      !Number.isFinite(durationInFrames) ||
      start + duration > durationInFrames
    ) {
      affected.push(expressionId);
    }
  });
  visuals.forEach((visual) => {
    const { rect } = visual;
    if (
      !Number.isFinite(rect.x) ||
      !Number.isFinite(rect.y) ||
      !Number.isFinite(rect.width) ||
      !Number.isFinite(rect.height) ||
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.x < 0 ||
      rect.y < 0 ||
      rect.x + rect.width > canvas.width ||
      rect.y + rect.height > canvas.height
    ) {
      affected.push(visual.expressionId);
    }
  });
  const uniqueAffected = unique(affected);
  return uniqueAffected.length > 0
    ? result(
        "timeline-bounds",
        "failed",
        `${uniqueAffected.length} 项超出项目时长或画布边界。`,
        uniqueAffected,
      )
    : result(
        "timeline-bounds",
        "passed",
        "全部项目均在项目时长与画布边界内。",
      );
};

export const runTimelineQualityControl = ({
  timeline,
  canvas,
  componentDefinitions,
  resourceIndex,
  includeFace = true,
  includeCaptions = true,
}) => {
  const definitions = new Map(
    componentDefinitions.map((definition) => [definition.id, definition]),
  );
  const visuals = collectVisuals(timeline, definitions);
  const checks = [
    checkOcclusion({
      type: "face-occlusion",
      kind: "face",
      label: "人物占位区",
      enabled: includeFace,
      visuals,
      canvas,
    }),
    checkOcclusion({
      type: "caption-occlusion",
      kind: "captions",
      label: "字幕安全区",
      enabled: includeCaptions,
      visuals,
      canvas,
    }),
    checkAssets(timeline, definitions, resourceIndex),
    checkVoiceMasking(timeline),
    checkTimelineBounds(timeline, canvas, visuals),
  ];
  const failedCount = checks.filter((check) => check.status === "failed").length;
  const pendingCount = checks.filter((check) => check.status === "pending").length;
  const passedCount = checks.filter((check) => check.status === "passed").length;
  const status = failedCount > 0 ? "failed" : pendingCount > 0 ? "pending" : "passed";
  return {
    ...timeline,
    qualityControl: { status, checks },
    qualityControlSummary: {
      checkCount: CHECK_TYPES.length,
      passedCount,
      failedCount,
      pendingCount,
    },
  };
};
