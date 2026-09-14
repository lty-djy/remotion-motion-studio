// local-protocol.ts
var toFiniteNumber = (value, fallback) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
var toRecord = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
var cleanId = (value, fallback) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text && /^[A-Za-z][A-Za-z0-9_-]*$/.test(text) ? text : fallback;
};
var getNumberExport = (module, names, fallback) => {
  for (const name of names) {
    const value = module[name];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return fallback;
};
var getMotionComponents = (module, fallbackDurationInFrames) => {
  const rawManifest = Array.isArray(module.MOTION_COMPONENTS) ? module.MOTION_COMPONENTS : [];
  const manifestDefinitions = rawManifest.flatMap((rawEntry, index) => {
    const entry = toRecord(rawEntry);
    const exportName = typeof entry.exportName === "string" ? entry.exportName : "";
    const renderable = typeof entry.component === "function" ? entry.component : exportName && typeof module[exportName] === "function" ? module[exportName] : null;
    if (!renderable) return [];
    const id = cleanId(entry.id, `MotionComponent${index + 1}`);
    const bounds = toRecord(entry.bounds);
    const position = toRecord(entry.defaultPosition);
    return [
      {
        id,
        name: typeof entry.name === "string" && entry.name.trim() ? entry.name : id,
        description: typeof entry.description === "string" ? entry.description : "Remotion \u52A8\u6548\u7EC4\u4EF6",
        category: typeof entry.category === "string" ? entry.category : "custom",
        glyph: typeof entry.glyph === "string" && entry.glyph ? entry.glyph.slice(0, 8) : "FX",
        component: renderable,
        durationInFrames: Math.max(
          3,
          Math.round(
            toFiniteNumber(entry.durationInFrames, fallbackDurationInFrames)
          )
        ),
        bounds: {
          x: toFiniteNumber(bounds.x, 0),
          y: toFiniteNumber(bounds.y, 0),
          width: Math.max(1, toFiniteNumber(bounds.width, 640)),
          height: Math.max(1, toFiniteNumber(bounds.height, 360))
        },
        defaultPosition: {
          x: toFiniteNumber(position.x, 0),
          y: toFiniteNumber(position.y, 0),
          scale: Math.max(0.05, toFiniteNumber(position.scale, 1))
        },
        defaultProps: toRecord(entry.defaultProps),
        propsSchema: toRecord(entry.propsSchema)
      }
    ];
  });
  if (manifestDefinitions.length > 0) return manifestDefinitions;
  const fallbackRenderable = typeof module.default === "function" ? module.default : Object.entries(module).find(
    ([name, value]) => typeof value === "function" && /^[A-Z]/.test(name) && !["AbsoluteFill", "Sequence"].includes(name)
  )?.[1];
  if (!fallbackRenderable) return [];
  return [
    {
      id: "LegacyComponent",
      name: "\u5BFC\u5165\u52A8\u6548",
      description: "\u517C\u5BB9\u65E7\u7248\u5355\u7EC4\u4EF6 TSX",
      category: "legacy",
      glyph: "FX",
      component: fallbackRenderable,
      durationInFrames: Math.max(3, fallbackDurationInFrames),
      bounds: { x: 72, y: 68, width: 520, height: 300 },
      defaultPosition: { x: 0, y: 0, scale: 1 },
      defaultProps: { metric: "87%", caption: "\u5173\u952E\u6307\u6807" },
      propsSchema: {
        metric: { type: "text", label: "\u6838\u5FC3\u6570\u5B57", default: "87%" },
        caption: { type: "text", label: "\u8BF4\u660E\u6587\u5B57", default: "\u5173\u952E\u6307\u6807" }
      }
    }
  ];
};
var getMotionTimeline = (module) => Array.isArray(module.MOTION_TIMELINE) ? module.MOTION_TIMELINE.flatMap((item) => {
  const record = toRecord(item);
  return typeof record.componentId === "string" ? [
    {
      componentId: record.componentId,
      startFrame: toFiniteNumber(record.startFrame, 0),
      durationInFrames: toFiniteNumber(
        record.durationInFrames,
        0
      ),
      position: toRecord(record.position),
      cardBackgroundEnabled: record.cardBackgroundEnabled !== false,
      backgroundOpacity: toFiniteNumber(
        record.backgroundOpacity,
        0
      ),
      backgroundDimEnabled: record.backgroundDimEnabled !== false,
      cardMask: toRecord(record.cardMask),
      props: toRecord(record.props)
    }
  ] : [];
}) : [];
export {
  getMotionComponents,
  getMotionTimeline,
  getNumberExport
};
