const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const createKnownAvoidanceRegions = ({
  canvas,
  includeFace = true,
  includeCaptions = true,
}) => {
  const portrait = canvas.orientation === "portrait";
  const regions = [];
  if (includeFace) {
    const widthRatio = portrait ? 0.38 : 0.24;
    const topRatio = portrait ? 0.12 : 0.1;
    const bottomRatio = portrait ? 0.1 : 0.09;
    regions.push({
      id: "known-person-region",
      kind: "face",
      label: "人物占位区",
      x: Math.round(canvas.width * (0.5 - widthRatio / 2)),
      y: Math.round(canvas.height * topRatio),
      width: Math.round(canvas.width * widthRatio),
      height: Math.round(canvas.height * (1 - topRatio - bottomRatio)),
    });
  }
  if (includeCaptions) {
    const sideRatio = portrait ? 0.06 : 0.08;
    const topRatio = portrait ? 0.8 : 0.78;
    const bottomRatio = portrait ? 0.06 : 0.06;
    regions.push({
      id: "srt-caption-safe-region",
      kind: "captions",
      label: "字幕安全区",
      x: Math.round(canvas.width * sideRatio),
      y: Math.round(canvas.height * topRatio),
      width: Math.round(canvas.width * (1 - sideRatio * 2)),
      height: Math.round(canvas.height * (1 - topRatio - bottomRatio)),
    });
  }
  return regions;
};

export const rectanglesOverlap = (left, right, gap = 0) =>
  left.x < right.x + right.width + gap &&
  left.x + left.width + gap > right.x &&
  left.y < right.y + right.height + gap &&
  left.y + left.height + gap > right.y;

const temporalOverlap = (left, right) =>
  left.startFrame < right.endFrame && right.startFrame < left.endFrame;

const motionAnchors = (canvas, width, height) => {
  const portrait = canvas.orientation === "portrait";
  const margin = portrait ? 18 : 64;
  const right = canvas.width - width - margin;
  const center = Math.round((canvas.width - width) / 2);
  const rows = portrait
    ? { top: 300, center: 720, bottom: 1220, rail: 54 }
    : { top: 150, center: 430, bottom: 570, rail: 54 };
  return [
    { anchor: "left-top", x: margin, y: rows.top },
    { anchor: "right-top", x: right, y: rows.top },
    { anchor: "left-center", x: margin, y: rows.center },
    { anchor: "right-center", x: right, y: rows.center },
    { anchor: "left-bottom", x: margin, y: rows.bottom },
    { anchor: "right-bottom", x: right, y: rows.bottom },
    { anchor: "center-top", x: center, y: rows.rail },
  ].filter(
    (candidate) =>
      candidate.x >= 0 &&
      candidate.y >= 0 &&
      candidate.x + width <= canvas.width &&
      candidate.y + height <= canvas.height,
  );
};

const resourceAnchors = (canvas, width, height) => {
  const portrait = canvas.orientation === "portrait";
  const margin = portrait ? 28 : 64;
  const right = canvas.width - width - margin;
  const center = Math.round((canvas.width - width) / 2);
  const rows = portrait
    ? { top: 70, upper: 470, center: 900, bottom: 1320 }
    : { top: 54, upper: 250, center: 470, bottom: 700 };
  return [
    { anchor: "left-top", x: margin, y: rows.top },
    { anchor: "right-top", x: right, y: rows.top },
    { anchor: "left-center", x: margin, y: rows.upper },
    { anchor: "right-center", x: right, y: rows.upper },
    { anchor: "left-bottom", x: margin, y: rows.bottom },
    { anchor: "right-bottom", x: right, y: rows.bottom },
    { anchor: "left-lower", x: margin, y: rows.center },
    { anchor: "right-lower", x: right, y: rows.center },
    { anchor: "center-top", x: center, y: rows.top },
  ].filter(
    (candidate) =>
      candidate.x >= 0 &&
      candidate.y >= 0 &&
      candidate.x + width <= canvas.width &&
      candidate.y + height <= canvas.height,
  );
};

const preferredFirst = (candidates, preferredAnchor) => [
  ...candidates.filter((candidate) => candidate.anchor === preferredAnchor),
  ...candidates.filter((candidate) => candidate.anchor !== preferredAnchor),
];

const collisionCount = (rect, timing, obstacles, placed) =>
  obstacles.filter((obstacle) => rectanglesOverlap(rect, obstacle, 18)).length +
  placed.filter(
    (candidate) =>
      temporalOverlap(timing, candidate) &&
      rectanglesOverlap(rect, candidate.rect, 18),
  ).length;

const choosePlacement = ({
  candidateFactory,
  preferredAnchor,
  scales,
  baseWidth,
  baseHeight,
  timing,
  obstacles,
  placed,
}) => {
  let bestFallback = null;
  for (const scale of scales) {
    const width = Math.round(baseWidth * scale);
    const height = Math.round(baseHeight * scale);
    const candidates = preferredFirst(
      candidateFactory(width, height),
      preferredAnchor,
    );
    for (const candidate of candidates) {
      const rect = { x: candidate.x, y: candidate.y, width, height };
      const conflicts = collisionCount(rect, timing, obstacles, placed);
      if (conflicts === 0) {
        return { ...candidate, rect, scale, conflicts, collisionFree: true };
      }
      if (!bestFallback || conflicts < bestFallback.conflicts) {
        bestFallback = {
          ...candidate,
          rect,
          scale,
          conflicts,
          collisionFree: false,
        };
      }
    }
  }
  return bestFallback;
};

export const applyAvoidanceLayout = ({
  timeline,
  canvas,
  componentDefinitions,
  includeFace = true,
  includeCaptions = true,
}) => {
  const definitions = new Map(
    componentDefinitions.map((definition) => [definition.id, definition]),
  );
  const obstacles = createKnownAvoidanceRegions({
    canvas,
    includeFace,
    includeCaptions,
  });
  const placed = [];
  let repositionedCount = 0;
  let scaledCount = 0;
  let unresolvedCount = 0;

  const motionTimeline = timeline.motionTimeline.map((item) => {
    const definition = definitions.get(item.componentId);
    if (!definition) return item;
    const preferredScale = canvas.orientation === "portrait" ? 0.42 : 0.72;
    const timing = {
      startFrame: item.startFrame,
      endFrame: item.startFrame + item.durationInFrames,
    };
    const placement = choosePlacement({
      candidateFactory: (width, height) =>
        motionAnchors(canvas, width, height),
      preferredAnchor: item.layoutIntent?.anchor ?? "left-center",
      scales: [preferredScale, preferredScale * 0.9, preferredScale * 0.8],
      baseWidth: definition.bounds.width,
      baseHeight: definition.bounds.height,
      timing,
      obstacles,
      placed,
    });
    if (!placement) return item;
    const position = {
      x: Math.round(placement.x - definition.bounds.x * placement.scale),
      y: Math.round(placement.y - definition.bounds.y * placement.scale),
      scale: Number(placement.scale.toFixed(3)),
    };
    const defaultPosition = definition.defaultPosition ?? { x: 0, y: 0, scale: 1 };
    if (
      position.x !== defaultPosition.x ||
      position.y !== defaultPosition.y ||
      position.scale !== defaultPosition.scale
    ) {
      repositionedCount += 1;
    }
    if (position.scale < 0.999) scaledCount += 1;
    if (!placement.collisionFree) unresolvedCount += 1;
    placed.push({ ...timing, rect: placement.rect, id: item.sourceExpressionId });
    return {
      ...item,
      position,
      layoutDecision: {
        anchor: placement.anchor,
        collisionPolicy: "relocate-then-scale",
        collisionFree: placement.collisionFree,
        avoidedRegionIds: obstacles.map((region) => region.id),
      },
    };
  });

  const resourceTracks = timeline.resourceTracks.map((track) => {
    if (track.kind === "sfx") return track;
    const timing = {
      startFrame: track.startFrame,
      endFrame: track.startFrame + track.durationInFrames,
    };
    const baseWidth = Math.max(1, track.position?.width ?? 120);
    const baseHeight = Math.max(1, track.position?.height ?? 120);
    const placement = choosePlacement({
      candidateFactory: (width, height) =>
        resourceAnchors(canvas, width, height),
      preferredAnchor: track.layoutIntent?.anchor ?? "right-top",
      scales: [1, 0.85, 0.72],
      baseWidth,
      baseHeight,
      timing,
      obstacles,
      placed,
    });
    if (!placement) return track;
    const position = {
      ...track.position,
      x: placement.x,
      y: placement.y,
      scale: Number(placement.scale.toFixed(3)),
    };
    if (
      position.x !== track.position?.x ||
      position.y !== track.position?.y ||
      position.scale !== track.position?.scale
    ) {
      repositionedCount += 1;
    }
    if (position.scale < 0.999) scaledCount += 1;
    if (!placement.collisionFree) unresolvedCount += 1;
    placed.push({ ...timing, rect: placement.rect, id: track.sourceExpressionId });
    return {
      ...track,
      position,
      layoutDecision: {
        anchor: placement.anchor,
        collisionPolicy: "relocate-then-scale",
        collisionFree: placement.collisionFree,
        avoidedRegionIds: obstacles.map((region) => region.id),
      },
    };
  });

  return {
    ...timeline,
    motionTimeline,
    resourceTracks,
    layoutSummary: {
      mode: "known-safe-regions",
      obstacleLabels: obstacles.map((region) => region.label),
      visualCount: motionTimeline.length +
        resourceTracks.filter((track) => track.kind !== "sfx").length,
      repositionedCount,
      scaledCount,
      unresolvedCount,
      personRegionSource: includeFace ? "manual-placeholder" : "disabled",
      captionRegionSource: includeCaptions ? "srt-safe-zone" : "disabled",
    },
  };
};
