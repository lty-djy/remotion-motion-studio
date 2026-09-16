import type React from "react";

export type MotionPropType =
  | "text"
  | "number"
  | "color"
  | "boolean"
  | "select";

export type MotionPropSchema = {
  type: MotionPropType;
  label?: string;
  default?: unknown;
  min?: number;
  max?: number;
  step?: number;
  /** 数值单位(仅展示,如 "px"/"ms") */
  unit?: string;
  options?: Array<string | { label: string; value: string }>;
  /** 颜色行的行内开关:指向同组件的 boolean 参数键(如 "showRingColor"),
   *  关 = 该颜色不生效(渲染层自行决定降级样式) */
  toggleKey?: string;
};

export type MotionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MotionPosition = {
  x: number;
  y: number;
  scale: number;
};

export type CardMaskSettings = {
  enabled: boolean;
  strength: number;
  opacity: number;
  feather: number;
  rangeTop: number;
  rangeRight: number;
  rangeBottom: number;
  rangeLeft: number;
  offsetX: number;
  offsetY: number;
};

export type BackgroundDimMode = "full" | "left" | "right";

export type MotionComponentDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  glyph: string;
  component: React.ComponentType<Record<string, unknown>>;
  durationInFrames: number;
  bounds: MotionBounds;
  defaultPosition: MotionPosition;
  defaultProps: Record<string, unknown>;
  propsSchema: Record<string, MotionPropSchema>;
};

export type MotionInstance = {
  soundMode?: "none" | "auto" | "manual";
  soundDensity?: "subtle" | "balanced" | "emphatic";
  id: string;
  laneId: string;
  trackOrder: number;
  componentId: string;
  visible: boolean;
  muted?: boolean;
  sourceStartFrame: number;
  startFrame: number;
  durationInFrames: number;
  position: MotionPosition;
  cardBackgroundEnabled: boolean;
  backgroundOpacity: number;
  /** 当前卡片出现时是否请求压暗画面背景；全局总开关关闭时不生效。 */
  backgroundDimEnabled: boolean;
  cardMask: CardMaskSettings;
  props: Record<string, unknown>;
  sourceExpressionId?: string;
  sourceIntentId?: string;
  /** AI 编排识别到的当前语义，保留在实例上供右侧检查器显示。 */
  semanticLabel?: string;
  semanticType?: string;
  arrangementBatchId?: string;
  arrangementBatchName?: string;
};

export type MotionTimelinePreset = {
  componentId: string;
  startFrame?: number;
  durationInFrames?: number;
  position?: Partial<MotionPosition>;
  cardBackgroundEnabled?: boolean;
  backgroundOpacity?: number;
  backgroundDimEnabled?: boolean;
  cardMask?: Partial<CardMaskSettings>;
  props?: Record<string, unknown>;
};

export type VideoTrack = {
  id: string;
  laneId: string;
  trackOrder: number;
  name: string;
  url: string;
  sourceStartFrame: number;
  sourceDurationInFrames: number;
  startFrame: number;
  durationInFrames: number;
  visible: boolean;
  muted?: boolean;
};

export type ResourceTrackKind = "icon" | "material" | "sfx";

/** 音效片段归属于一个组件实例；偏移以组件在时间线上的入场帧为基准。 */
export type ComponentSoundBinding = {
  instanceId: string;
  offsetFrames: number;
  /** 多步骤组件中的稳定事件 ID；省略时表示传统的单音效绑定。 */
  cueId?: string;
  cueIndex?: number;
  cueLabel?: string;
  /** 创建 cue 时的项目帧率，用于组件参数变化后重新计算事件帧。 */
  cueFps?: number;
  /** 用户对整组步骤音效施加的统一微调。 */
  nudgeFrames?: number;
};

export type ResourceTrack = {
  soundBinding?: ComponentSoundBinding;
  id: string;
  laneId: string;
  trackOrder: number;
  kind: ResourceTrackKind;
  resourceId: string;
  name: string;
  url: string;
  mimeType: string;
  sourceStartFrame: number;
  sourceDurationInFrames: number;
  startFrame: number;
  durationInFrames: number;
  visible: boolean;
  muted?: boolean;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    zIndex: number;
  };
  volume: number;
  voiceDucking: number;
  sourceExpressionId?: string;
  sourceIntentId?: string;
  arrangementBatchId?: string;
  arrangementBatchName?: string;
};

export type MotionModule = Record<string, unknown> & {
  default?: React.ComponentType<Record<string, unknown>>;
  MOTION_COMPONENTS?: unknown;
  MOTION_TIMELINE?: unknown;
};

const toFiniteNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const cleanId = (value: unknown, fallback: string) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text && /^[A-Za-z][A-Za-z0-9_-]*$/.test(text) ? text : fallback;
};

export const getNumberExport = (
  module: MotionModule,
  names: string[],
  fallback: number,
) => {
  for (const name of names) {
    const value = module[name];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return fallback;
};

export const getMotionComponents = (
  module: MotionModule,
  fallbackDurationInFrames: number,
): MotionComponentDefinition[] => {
  const rawManifest = Array.isArray(module.MOTION_COMPONENTS)
    ? module.MOTION_COMPONENTS
    : [];
  const manifestDefinitions = rawManifest.flatMap((rawEntry, index) => {
    const entry = toRecord(rawEntry);
    const exportName =
      typeof entry.exportName === "string" ? entry.exportName : "";
    const renderable =
      typeof entry.component === "function"
        ? entry.component
        : exportName && typeof module[exportName] === "function"
          ? module[exportName]
          : null;
    if (!renderable) return [];
    const id = cleanId(entry.id, `MotionComponent${index + 1}`);
    const bounds = toRecord(entry.bounds);
    const position = toRecord(entry.defaultPosition);
    return [
      {
        id,
        name:
          typeof entry.name === "string" && entry.name.trim()
            ? entry.name
            : id,
        description:
          typeof entry.description === "string"
            ? entry.description
            : "Remotion 动效组件",
        category:
          typeof entry.category === "string" ? entry.category : "custom",
        glyph:
          typeof entry.glyph === "string" && entry.glyph
            ? entry.glyph.slice(0, 8)
            : "FX",
        component: renderable as React.ComponentType<Record<string, unknown>>,
        durationInFrames: Math.max(
          3,
          Math.round(
            toFiniteNumber(entry.durationInFrames, fallbackDurationInFrames),
          ),
        ),
        bounds: {
          x: toFiniteNumber(bounds.x, 0),
          y: toFiniteNumber(bounds.y, 0),
          width: Math.max(1, toFiniteNumber(bounds.width, 640)),
          height: Math.max(1, toFiniteNumber(bounds.height, 360)),
        },
        defaultPosition: {
          x: toFiniteNumber(position.x, 0),
          y: toFiniteNumber(position.y, 0),
          scale: Math.max(0.05, toFiniteNumber(position.scale, 1)),
        },
        defaultProps: toRecord(entry.defaultProps),
        propsSchema: toRecord(entry.propsSchema) as Record<
          string,
          MotionPropSchema
        >,
      },
    ];
  });

  if (manifestDefinitions.length > 0) return manifestDefinitions;

  const fallbackRenderable =
    typeof module.default === "function"
      ? module.default
      : (Object.entries(module).find(
          ([name, value]) =>
            typeof value === "function" &&
            /^[A-Z]/.test(name) &&
            !["AbsoluteFill", "Sequence"].includes(name),
        )?.[1] as React.ComponentType<Record<string, unknown>> | undefined);

  if (!fallbackRenderable) return [];
  return [
    {
      id: "LegacyComponent",
      name: "导入动效",
      description: "兼容旧版单组件 TSX",
      category: "legacy",
      glyph: "FX",
      component: fallbackRenderable,
      durationInFrames: Math.max(3, fallbackDurationInFrames),
      bounds: { x: 72, y: 68, width: 520, height: 300 },
      defaultPosition: { x: 0, y: 0, scale: 1 },
      defaultProps: { metric: "87%", caption: "关键指标" },
      propsSchema: {
        metric: { type: "text", label: "核心数字", default: "87%" },
        caption: { type: "text", label: "说明文字", default: "关键指标" },
      },
    },
  ];
};

export const getMotionTimeline = (
  module: MotionModule,
): MotionTimelinePreset[] =>
  Array.isArray(module.MOTION_TIMELINE)
    ? module.MOTION_TIMELINE.flatMap((item) => {
        const record = toRecord(item);
        return typeof record.componentId === "string"
          ? [
              {
                componentId: record.componentId,
                startFrame: toFiniteNumber(record.startFrame, 0),
                durationInFrames: toFiniteNumber(
                  record.durationInFrames,
                  0,
                ),
                position: toRecord(record.position),
                cardBackgroundEnabled: record.cardBackgroundEnabled !== false,
                backgroundOpacity: toFiniteNumber(
                  record.backgroundOpacity,
                  0,
                ),
                backgroundDimEnabled: record.backgroundDimEnabled !== false,
                cardMask: toRecord(record.cardMask),
                props: toRecord(record.props),
              },
            ]
          : [];
      })
    : [];
