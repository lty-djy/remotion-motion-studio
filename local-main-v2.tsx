import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { Player, type PlayerRef } from "@remotion/player";
import { AbsoluteFill, Audio, Html5Video, Img, Sequence } from "remotion";
import {
  ArrowCounterClockwise,
  ArrowsInLineVertical,
  ArrowsOutLineVertical,
  CaretDown,
  CheckCircle,
  Code,
  DeviceMobile,
  DownloadSimple,
  Eye,
  EyeSlash,
  FilmSlate,
  FloppyDisk,
  FolderOpen,
  FrameCorners,
  Keyboard,
  MagicWand,
  MagnifyingGlass,
  Minus,
  MoonStars,
  Pause,
  Play,
  Plus,
  SelectionForeground,
  SlidersHorizontal,
  SpeakerHigh,
  SpeakerSlash,
  Sun,
  TextAa,
  Trash,
  UploadSimple,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import {
  getMotionComponents,
  getMotionTimeline,
  getNumberExport,
  type MotionComponentDefinition,
  type MotionInstance,
  type MotionModule,
  type MotionPropSchema,
  type ResourceTrack,
  type VideoTrack,
} from "./local-protocol";
import {
  BUILT_IN_CATALOG,
  BUILT_IN_COMPONENT_IDS,
  isBuiltInDefinition,
  mergeWithBuiltInDefinitions,
} from "./local-builtins";
import {
  AI_ARRANGEABLE_COMPONENT_IDS,
  EFFECT_REGISTRY_BY_ID,
} from "./registry";
import { buildSemanticSrtArrangement } from "./ai-motion-arranger/semantic-srt-arranger.mjs";
import { PORTRAIT_ROUTE_COMPONENT_IDS } from "./ai-motion-arranger/portrait-semantic-routes.mjs";
import {
  applyAvoidanceLayout,
  createKnownAvoidanceRegions,
} from "./ai-motion-arranger/avoidance-layout-planner.mjs";
import { runTimelineQualityControl } from "./ai-motion-arranger/quality-control.mjs";
import {
  createArrangementBatch,
  removeArrangementBatch,
  summarizeArrangementBatch,
} from "./ai-motion-arranger/arrangement-batch.mjs";
import "./local-styles.css";

type Notice = { tone: "ok" | "error" | "info"; text: string } | null;

type ArrangementPreviewDialogGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ArrangementPreviewMinimizedPosition = { x: number; y: number };

type ArrangementPreviewDialogDefaultSize = Pick<
  ArrangementPreviewDialogGeometry,
  "width" | "height"
>;

type ArrangementPreviewResizeDirection =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

const ARRANGEMENT_PREVIEW_RESIZE_DIRECTIONS: Array<{
  direction: ArrangementPreviewResizeDirection;
  label: string;
}> = [
  { direction: "n", label: "拖动上边调整窗口高度" },
  { direction: "s", label: "拖动下边调整窗口高度" },
  { direction: "e", label: "拖动右边调整窗口宽度" },
  { direction: "w", label: "拖动左边调整窗口宽度" },
  { direction: "ne", label: "拖动右上角调整窗口大小" },
  { direction: "nw", label: "拖动左上角调整窗口大小" },
  { direction: "se", label: "拖动右下角调整窗口大小" },
  { direction: "sw", label: "拖动左下角调整窗口大小" },
];

const ARRANGEMENT_PREVIEW_DIALOG_GEOMETRY_STORAGE_KEY =
  "motion-studio-arrangement-preview-dialog-geometry-v1";
const ARRANGEMENT_PREVIEW_DIALOG_DEFAULT_SIZE_STORAGE_KEY =
  "motion-studio-arrangement-preview-dialog-default-size-v1";
const ARRANGEMENT_PREVIEW_POPUP_SIZE_STORAGE_KEY =
  "motion-studio-arrangement-preview-popup-size-v1";
const REALTIME_PREVIEW_POPUP_SIZE_STORAGE_KEY =
  "motion-studio-realtime-preview-popup-size-v1";
const SRT_DIALOG_GEOMETRY_STORAGE_KEY =
  "motion-studio-srt-dialog-geometry-v1";
const SRT_DIALOG_DEFAULT_SIZE_STORAGE_KEY =
  "motion-studio-srt-dialog-default-size-v1";
const ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP = 16;
const ARRANGEMENT_PREVIEW_DIALOG_MIN_WIDTH = 720;
const ARRANGEMENT_PREVIEW_DIALOG_MIN_HEIGHT = 480;
const ARRANGEMENT_PREVIEW_MINIMIZED_WIDTH = 300;
const ARRANGEMENT_PREVIEW_MINIMIZED_HEIGHT = 56;
const ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP = 24;

type PopupWindowSize = { width: number; height: number };

const loadPopupWindowSize = (
  storageKey: string,
  fallback: PopupWindowSize,
): PopupWindowSize => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "null",
    ) as Partial<PopupWindowSize> | null;
    const width = Number(saved?.width);
    const height = Number(saved?.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return fallback;
    return {
      width: Math.max(640, Math.round(width)),
      height: Math.max(480, Math.round(height)),
    };
  } catch {
    return fallback;
  }
};

const rememberPopupWindowSize = (
  storageKey: string,
  previewWindow: Window | null,
) => {
  if (!previewWindow || previewWindow.closed) return;
  const width = Number(previewWindow.outerWidth);
  const height = Number(previewWindow.outerHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return;
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        width: Math.max(640, Math.round(width)),
        height: Math.max(480, Math.round(height)),
      }),
    );
  } catch {
    // Private-mode storage or a browser policy must not prevent the popup closing.
  }
};

const defaultArrangementPreviewDialogGeometry = (): ArrangementPreviewDialogGeometry => {
  const maxWidth = Math.max(
    320,
    window.innerWidth - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP * 2,
  );
  const maxHeight = Math.max(
    320,
    window.innerHeight - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP * 2,
  );
  const width = Math.min(1480, maxWidth);
  const height = Math.min(860, maxHeight);
  return {
    x: Math.max(ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP, (window.innerWidth - width) / 2),
    y: Math.max(ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP, (window.innerHeight - height) / 2),
    width,
    height,
  };
};

const loadArrangementPreviewDialogDefaultSize = (): ArrangementPreviewDialogDefaultSize | null => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(
        ARRANGEMENT_PREVIEW_DIALOG_DEFAULT_SIZE_STORAGE_KEY,
      ) ?? "null",
    ) as Partial<ArrangementPreviewDialogDefaultSize> | null;
    if (!saved) return null;
    const constrained = constrainArrangementPreviewDialogGeometry({
      ...defaultArrangementPreviewDialogGeometry(),
      width: Number(saved.width),
      height: Number(saved.height),
    });
    return { width: constrained.width, height: constrained.height };
  } catch {
    return null;
  }
};

const arrangementPreviewDialogGeometryFromDefaultSize = (): ArrangementPreviewDialogGeometry => {
  const fallback = defaultArrangementPreviewDialogGeometry();
  const savedDefaultSize = loadArrangementPreviewDialogDefaultSize();
  if (!savedDefaultSize) return fallback;
  const width = savedDefaultSize.width;
  const height = savedDefaultSize.height;
  return {
    x: Math.max(ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP, (window.innerWidth - width) / 2),
    y: Math.max(ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP, (window.innerHeight - height) / 2),
    width,
    height,
  };
};

const constrainArrangementPreviewDialogGeometry = (
  geometry: ArrangementPreviewDialogGeometry,
): ArrangementPreviewDialogGeometry => {
  const maxWidth = Math.max(
    320,
    window.innerWidth - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP * 2,
  );
  const maxHeight = Math.max(
    320,
    window.innerHeight - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP * 2,
  );
  const width = clamp(
    Number.isFinite(geometry.width) ? geometry.width : maxWidth,
    Math.min(ARRANGEMENT_PREVIEW_DIALOG_MIN_WIDTH, maxWidth),
    maxWidth,
  );
  const height = clamp(
    Number.isFinite(geometry.height) ? geometry.height : maxHeight,
    Math.min(ARRANGEMENT_PREVIEW_DIALOG_MIN_HEIGHT, maxHeight),
    maxHeight,
  );
  return {
    x: clamp(
      Number.isFinite(geometry.x) ? geometry.x : ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP,
      ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP,
      Math.max(ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP, window.innerWidth - width - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP),
    ),
    y: clamp(
      Number.isFinite(geometry.y) ? geometry.y : ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP,
      ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP,
      Math.max(ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP, window.innerHeight - height - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP),
    ),
    width,
    height,
  };
};

const loadArrangementPreviewDialogGeometry = (): ArrangementPreviewDialogGeometry => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(
        ARRANGEMENT_PREVIEW_DIALOG_GEOMETRY_STORAGE_KEY,
      ) ?? "null",
    ) as Partial<ArrangementPreviewDialogGeometry> | null;
    if (!saved) return defaultArrangementPreviewDialogGeometry();
    return constrainArrangementPreviewDialogGeometry({
      x: Number(saved.x),
      y: Number(saved.y),
      width: Number(saved.width),
      height: Number(saved.height),
    });
  } catch {
    return defaultArrangementPreviewDialogGeometry();
  }
};

const loadSrtDialogGeometry = (): ArrangementPreviewDialogGeometry => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(SRT_DIALOG_GEOMETRY_STORAGE_KEY) ?? "null",
    ) as Partial<ArrangementPreviewDialogGeometry> | null;
    if (!saved) return defaultArrangementPreviewDialogGeometry();
    return constrainArrangementPreviewDialogGeometry({
      x: Number(saved.x),
      y: Number(saved.y),
      width: Number(saved.width),
      height: Number(saved.height),
    });
  } catch {
    return defaultArrangementPreviewDialogGeometry();
  }
};

const srtDialogGeometryFromDefaultSize = (): ArrangementPreviewDialogGeometry => {
  const fallback = defaultArrangementPreviewDialogGeometry();
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(SRT_DIALOG_DEFAULT_SIZE_STORAGE_KEY) ?? "null",
    ) as Partial<ArrangementPreviewDialogDefaultSize> | null;
    if (!saved) return fallback;
    const constrained = constrainArrangementPreviewDialogGeometry({
      ...fallback,
      width: Number(saved.width),
      height: Number(saved.height),
    });
    return {
      ...constrained,
      x: Math.max(ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP, (window.innerWidth - constrained.width) / 2),
      y: Math.max(ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP, (window.innerHeight - constrained.height) / 2),
    };
  } catch {
    return fallback;
  }
};

type IconResource = {
  id: string;
  label: string;
  url: string;
  mimeType: string;
  tags: string[];
  usage: string;
  category: string;
  accent: string;
  source?: string;
};

type IconCategoryGroup = {
  id: string;
  name: string;
  accent: string;
  builtin: boolean;
};

const ICON_CATEGORY_ORDER = [
  "内容与素材",
  "自动化与流程",
  "状态与数据",
  "商务与教育",
  "沟通与传播",
  "表达与强调",
];

const BUILT_IN_ICON_GROUPS: IconCategoryGroup[] = [
  { id: "content", name: "内容与素材", accent: "#2f8cff", builtin: true },
  { id: "automation", name: "自动化与流程", accent: "#27c4e8", builtin: true },
  { id: "status", name: "状态与数据", accent: "#20d7a0", builtin: true },
  { id: "business", name: "商务与教育", accent: "#f2b93d", builtin: true },
  { id: "communication", name: "沟通与传播", accent: "#a776f7", builtin: true },
  { id: "expression", name: "表达与强调", accent: "#4f9dff", builtin: true },
];

type AiArrangementStage =
  | "idle"
  | "reading"
  | "analyzing"
  | "layout"
  | "quality"
  | "preview";

const AI_ARRANGEMENT_STEPS: Array<{
  id: Exclude<AiArrangementStage, "idle">;
  label: string;
}> = [
  { id: "reading", label: "读取字幕" },
  { id: "analyzing", label: "语义分析" },
  { id: "layout", label: "自动布局" },
  { id: "quality", label: "自动质检" },
  { id: "preview", label: "生成预览" },
];

const DEFAULT_CODE_TEMPLATE = `import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const CodeTemplate = ({ title = "代码模板", accent = "#8b5cf6" }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ padding: "32px 42px", borderRadius: 22, color: "white", background: "#14131c", border: \`1px solid \${accent}\` }}>
        <div style={{ color: accent, fontSize: 14, letterSpacing: 4 }}>CODE TEMPLATE</div>
        <div style={{ marginTop: 12, fontSize: 42, fontWeight: 800 }}>{title}</div>
      </div>
    </AbsoluteFill>
  );
};

export const MOTION_COMPONENTS = [{
  id: "code-template",
  name: "代码模板",
  description: "由代码板块新建的 Remotion 效果",
  category: "custom",
  glyph: "CODE",
  exportName: "CodeTemplate",
  durationInFrames: 150,
  bounds: { x: 300, y: 700, width: 1320, height: 420 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: { title: "代码模板", accent: "#8b5cf6" },
  propsSchema: {
    title: { type: "text", label: "标题", default: "代码模板" },
    accent: { type: "color", label: "强调色", default: "#8b5cf6" }
  }
}];

export const MOTION_TIMELINE = [{ componentId: "code-template", startFrame: 0, durationInFrames: 150 }];
`;

type TimelineJsonItem = {
  componentId: string;
  startFrame?: number;
  durationInFrames?: number;
  laneId?: string;
  trackOrder?: number;
  visible?: boolean;
  sourceStartFrame?: number;
  position?: Partial<MotionInstance["position"]>;
  backgroundOpacity?: number;
  props?: Record<string, unknown>;
  sourceExpressionId?: string;
  sourceIntentId?: string;
};

type PendingArrangement = {
  fileName: string;
  batchId: string;
  batchName: string;
  motionInstances: MotionInstance[];
  resourceTracks: ResourceTrack[];
  captionInstance?: MotionInstance;
  selectedKeys: string[];
  lockedSegmentIds: string[];
  componentCandidatesBySegment: Record<
    string,
    ArrangementComponentCandidate[]
  >;
  qualityControlStatus: string;
  qualityControlCheckCount: number;
  qualityControlChecks: Array<{
    type: string;
    status: "pending" | "passed" | "failed";
    message: string;
    affectedExpressionIds: string[];
  }>;
  semanticSummary?: {
    cueCount: number;
    semanticSegmentCount?: number;
    intentCount: number;
    detectedIntentCount?: number;
    suppressedIntentCount?: number;
    motionBudget?: number;
    skippedCueCount: number;
    repeatedAvoidedCount?: number;
    supportingSuppressedCount?: number;
  };
  semanticSourcesBySegment?: Record<
    string,
    {
      text: string;
      sourceCueIndices: number[];
      semanticLabel: string;
    }
  >;
  layoutSummary?: {
    obstacleLabels: string[];
    visualCount: number;
    repositionedCount: number;
    scaledCount: number;
    unresolvedCount: number;
  };
};

type ArrangementComponentCandidate = {
  componentId: string;
  rank: number;
  reason: string;
  props: Record<string, unknown>;
};

type PendingArrangementSegment = {
  id: string;
  motionInstances: MotionInstance[];
  resourceTracks: ResourceTrack[];
  startFrame: number;
  endFrame: number;
};

const SRT_CAPTION_TRACK_ID = "srt-caption-track";

type ArrangementComponentPicker = {
  mode: "replace" | "add";
  segmentId: string;
  instanceId?: string;
};

type ArrangementResourceEntry = {
  id: string;
  label: string;
  url: string;
  mimeType: string;
  tags: string[];
  usage: string;
  category: string;
  accent: string;
  durationSeconds?: number;
  source?: string;
};

type SoundResource = ArrangementResourceEntry & {
  bytes?: number;
};

const formatSoundDuration = (durationSeconds?: number) => {
  const total = Math.max(0, Number(durationSeconds) || 0);
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  const tenths = Math.floor((total % 1) * 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
};

const BUILT_IN_SFX_SECTIONS: IconCategoryGroup[] = [
  { id: "builtin-sfx", name: "内置音效", accent: "#2f8cff", builtin: true },
  { id: "manual-sfx", name: "自定义音效", accent: "#a776f7", builtin: true },
];

const sfxSectionName = (
  sound: Pick<ArrangementResourceEntry, "category" | "source">,
  customGroups: Array<Pick<IconCategoryGroup, "name">>,
) => {
  if (
    sound.category &&
    customGroups.some((group) => group.name === sound.category)
  ) {
    return sound.category;
  }
  return sound.source === "manual" ? "自定义音效" : "内置音效";
};

type ArrangementResourcePicker = {
  mode: "replace" | "add";
  segmentId: string;
  kind: ResourceTrack["kind"];
  trackId?: string;
};

type ArrangementResourceLibrary = Record<
  ResourceTrack["kind"],
  ArrangementResourceEntry[]
>;

const ARRANGEMENT_RESOURCE_RECOMMENDATIONS: Record<
  string,
  Partial<Record<ResourceTrack["kind"], string[]>>
> = {
  "chapter-transition": {
    icon: ["arrow", "title", "timeline"],
    sfx: ["whoosh-soft", "tick"],
  },
  "info-callout": {
    icon: ["code", "lightbulb", "file-text"],
    sfx: ["whoosh-soft", "tick"],
  },
  "metric-decision": {
    icon: ["speed", "chart-bar", "hash"],
    sfx: ["tick", "impact"],
  },
  "process-steps": {
    icon: ["timeline", "list-checks", "route"],
    sfx: ["tick", "whoosh-soft"],
  },
  "risk-boundary": {
    icon: ["warning", "x-circle", "seal-check"],
    sfx: ["impact", "tick"],
  },
  "next-episode-cta": {
    icon: ["megaphone", "bell", "arrow"],
    sfx: ["whoosh-soft", "impact"],
  },
};

const getArrangementRouteId = (segmentId: string) =>
  segmentId.replace(/^intent-\d+-/u, "");

const getArrangementSegmentId = (
  item: Pick<MotionInstance | ResourceTrack, "id" | "sourceIntentId" | "sourceExpressionId">,
) => item.sourceIntentId ?? item.sourceExpressionId ?? item.id;

const markPendingArrangementQualityChecksStale = (
  arrangement: PendingArrangement,
): PendingArrangement => ({
  ...arrangement,
  qualityControlStatus: "pending",
  qualityControlChecks: arrangement.qualityControlChecks.map((check) => ({
    ...check,
    status: "pending",
    message: "当前语义段的组件已修改，插入时间线后请复核此项。",
    affectedExpressionIds: [],
  })),
});

type ArrangementIntentSummary = {
  id: string;
  label: string;
  startFrame: number;
  motionIds: string[];
  resourceIds: string[];
};

type ArrangementBatchSummary = {
  id: string;
  name: string;
  startFrame: number;
  motionIds: string[];
  resourceIds: string[];
  intents: ArrangementIntentSummary[];
};

const QUALITY_CONTROL_LABELS: Record<string, string> = {
  "face-occlusion": "人物遮挡",
  "caption-occlusion": "字幕遮挡",
  "asset-availability": "资源有效性",
  "voice-masking": "声音盖人声",
  "timeline-bounds": "时间线边界",
};

const QUALITY_CONTROL_STATUS_LABELS: Record<string, string> = {
  passed: "通过",
  failed: "未通过",
  pending: "待检查",
};

type ShortcutAction =
  | "undo"
  | "redo"
  | "playPause"
  | "goStart"
  | "previousFrame"
  | "nextFrame"
  | "splitTrack"
  | "trimLeft"
  | "trimRight"
  | "toggleVideoTrack"
  | "duplicate"
  | "delete"
  | "regionIn"
  | "regionOut"
  | "regionClear";

type ShortcutMap = Record<ShortcutAction, string>;

const SHORTCUT_STORAGE_KEY = "overlay-studio-shortcuts-v1";
const PANEL_WIDTH_STORAGE_KEY = "motion-studio-panel-widths-v1";
const CUSTOM_GROUP_STORAGE_KEY = "motion-studio-custom-groups-v1";
const EFFECT_GROUP_STORAGE_KEY = "motion-studio-effect-groups-v1";
const EFFECT_GROUP_NAME_STORAGE_KEY = "motion-studio-effect-group-names-v1";
const EFFECT_GROUP_COLOR_STORAGE_KEY = "motion-studio-effect-group-colors-v1";
const EFFECT_NAME_STORAGE_KEY = "motion-studio-effect-names-v1";
const DEFAULT_LEFT_PANEL_WIDTH = 270;
const DEFAULT_RIGHT_PANEL_WIDTH = 278;
const MIN_LEFT_PANEL_WIDTH = 210;
const MIN_RIGHT_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 480;
const MIN_WORKSPACE_WIDTH = 620;

const readStoredPanelWidths = () => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY) ?? "{}",
    ) as { left?: number; right?: number };
    return {
      left:
        typeof stored.left === "number"
          ? Math.min(MAX_PANEL_WIDTH, Math.max(MIN_LEFT_PANEL_WIDTH, stored.left))
          : DEFAULT_LEFT_PANEL_WIDTH,
      right:
        typeof stored.right === "number"
          ? Math.min(MAX_PANEL_WIDTH, Math.max(MIN_RIGHT_PANEL_WIDTH, stored.right))
          : DEFAULT_RIGHT_PANEL_WIDTH,
    };
  } catch {
    return {
      left: DEFAULT_LEFT_PANEL_WIDTH,
      right: DEFAULT_RIGHT_PANEL_WIDTH,
    };
  }
};

const DEFAULT_SHORTCUTS: ShortcutMap = {
  undo: "Control+Z",
  redo: "Control+Y",
  playPause: "Space",
  goStart: "Home",
  previousFrame: "ArrowLeft",
  nextFrame: "ArrowRight",
  splitTrack: "W",
  trimLeft: "Q",
  trimRight: "E",
  toggleVideoTrack: "V",
  duplicate: "Control+D",
  delete: "S",
  regionIn: "4",
  regionOut: "5",
  regionClear: "Alt+X",
};

const SHORTCUT_DEFINITIONS: Array<{
  action: ShortcutAction;
  label: string;
  description: string;
}> = [
  { action: "undo", label: "撤销", description: "撤销上一次轨道或效果编辑" },
  { action: "redo", label: "重做", description: "恢复上一次被撤销的编辑" },
  { action: "playPause", label: "播放 / 暂停", description: "切换时间轴播放状态" },
  { action: "goStart", label: "回到开头", description: "播放头归零" },
  { action: "previousFrame", label: "上一帧", description: "向左移动一帧" },
  { action: "nextFrame", label: "下一帧", description: "向右移动一帧" },
  { action: "splitTrack", label: "分割轨道", description: "在播放头位置分割当前轨道" },
  { action: "trimLeft", label: "向左裁剪", description: "删除当前轨道中播放头左侧内容" },
  { action: "trimRight", label: "向右裁剪", description: "删除当前轨道中播放头右侧内容" },
  { action: "toggleVideoTrack", label: "显示 / 隐藏轨道", description: "切换当前选中视频或动效轨道的实时预览" },
  { action: "duplicate", label: "复制所选卡片", description: "复制当前选中的轨道卡片" },
  { action: "delete", label: "删除所选片段", description: "删除当前选中的视频或动效片段" },
  { action: "regionIn", label: "区域入点", description: "在播放头位置设置导出区域的入点（键 4）" },
  { action: "regionOut", label: "区域出点", description: "在播放头位置设置导出区域的出点（键 5）" },
  { action: "regionClear", label: "清除区域出入点", description: "取消已设置的区域入点和出点标记" },
];

const loadShortcuts = (): ShortcutMap => {
  try {
    const saved = window.localStorage.getItem(SHORTCUT_STORAGE_KEY);
    if (!saved) return { ...DEFAULT_SHORTCUTS };
    const stored = JSON.parse(saved) as Partial<ShortcutMap>;
    return {
      ...DEFAULT_SHORTCUTS,
      ...stored,
      delete:
        !stored.delete || stored.delete === "Delete"
          ? DEFAULT_SHORTCUTS.delete
          : stored.delete,
    };
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
};

type CustomCatalogGroup = { id: string; name: string };
type PendingGroupDelete = {
  groupId: string;
  groupName: string;
  componentIds: string[];
};
type EffectMoveTarget = {
  componentId: string;
  effectName: string;
  currentGroupId: string;
};
type EffectRenameTarget = {
  componentId: string;
  effectName: string;
};
const loadCustomCatalogGroups = (): CustomCatalogGroup[] => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(CUSTOM_GROUP_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(stored)
      ? stored.filter(
          (group): group is CustomCatalogGroup =>
            Boolean(
              group &&
                typeof group.id === "string" &&
                typeof group.name === "string",
            ),
        )
      : [];
  } catch {
    return [];
  }
};

const loadEffectGroupAssignments = (): Record<string, string> => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(EFFECT_GROUP_STORAGE_KEY) ?? "{}",
    );
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? Object.fromEntries(
          Object.entries(stored).filter(
            ([componentId, groupId]) =>
              Boolean(componentId) && typeof groupId === "string",
          ),
        )
      : {};
  } catch {
    return {};
  }
};

const shortcutFromEvent = (event: KeyboardEvent | React.KeyboardEvent) => {
  const modifierKeys = new Set(["Control", "Shift", "Alt", "Meta"]);
  if (modifierKeys.has(event.key)) return "";
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Control");
  if (event.metaKey) parts.push("Meta");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  const key =
    event.code === "Space"
      ? "Space"
      : event.key.length === 1
        ? event.key.toUpperCase()
        : event.key;
  parts.push(key);
  return parts.join("+");
};

const formatShortcut = (shortcut: string) => {
  if (!shortcut) return "未设置";
  const labels: Record<string, string> = {
    Control: "Ctrl",
    Meta: "Cmd",
    Space: "空格",
    ArrowLeft: "←",
    ArrowRight: "→",
    ArrowUp: "↑",
    ArrowDown: "↓",
    Delete: "Delete",
    Home: "Home",
  };
  return shortcut
    .split("+")
    .map((part) => labels[part] ?? part)
    .join(" + ");
};

type ComponentHistoryItem = {
  id: string;
  name: string;
  importedAt: string;
  sourceIncludesVideo: boolean;
};

type ProjectHistoryItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  videoName: string;
  componentName: string;
  instanceCount: number;
};

type ProjectSnapshot = {
  version: 1;
  name: string;
  activeComponentId?: string;
  componentName?: string;
  sourceIncludesVideo?: boolean;
  videoName?: string;
  videoUrl?: string;
  videoDuration?: number;
  videoTracks?: VideoTrack[];
  resourceTracks?: ResourceTrack[];
  instances: MotionInstance[];
  currentFrame?: number;
  theme?: "dark" | "light";
  timelineHeight?: number;
  trackHeights?: Record<string, number>;
  canvasOrientation?: "landscape" | "portrait";
  safetyGuideVisible?: boolean;
  solidBackgroundEnabled?: boolean;
  soundEnabled?: boolean;
  activeArrangementBatchId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type EditHistorySnapshot = {
  videoTracks: VideoTrack[];
  resourceTracks: ResourceTrack[];
  instances: MotionInstance[];
  soundEnabled: boolean;
};

type TimelineLane =
  | {
      kind: "video";
      laneId: string;
      trackOrder: number;
      clips: VideoTrack[];
    }
  | {
      kind: "motion";
      laneId: string;
      trackOrder: number;
      clips: MotionInstance[];
    }
  | {
      kind: "resource";
      laneId: string;
      trackOrder: number;
      clips: ResourceTrack[];
    };

const cloneEditSnapshot = (snapshot: EditHistorySnapshot): EditHistorySnapshot =>
  JSON.parse(JSON.stringify(snapshot)) as EditHistorySnapshot;

type RenderProgressState = {
  jobId: string;
  status:
    | "queued"
    | "bundling"
    | "preparing"
    | "rendering"
    | "completed"
    | "failed";
  stage: string;
  progress: number;
  renderedFrames: number;
  encodedFrames: number;
  totalFrames: number;
  estimatedRemainingMs: number | null;
};

type ContextMenuState = {
  x: number;
  y: number;
  source:
    | "preview"
    | "timeline"
    | "videoTimeline"
    | "resourceTimeline"
    | "library"
    | "libraryGroup"
    | "libraryRoot"
    | "iconLibrary"
    | "sfxLibrary"
    | "sfxItem";
  instanceIds: string[];
  videoTrackId?: string;
  resourceTrackId?: string;
  componentId?: string;
  iconId?: string;
  groupId?: string;
  groupName?: string;
  iconGroupId?: string;
  groupComponentIds?: string[];
  sfxGroupId?: string;
  soundId?: string;
};

type LaneDropState = {
  draggedLaneId: string;
  targetLaneId: string;
  placement: "before" | "after";
};

type MarqueeRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

let instanceSequence = 0;
let videoTrackSequence = 0;
let resourceTrackSequence = 0;

const createVideoTrackId = () => {
  videoTrackSequence += 1;
  return `video-${Date.now()}-${videoTrackSequence}`;
};

const loadEffectNameOverrides = (): Record<string, string> => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(EFFECT_NAME_STORAGE_KEY) ?? "{}",
    );
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? Object.fromEntries(
          Object.entries(stored).filter(
            ([componentId, name]) =>
              Boolean(componentId) &&
              typeof name === "string" &&
              Boolean(name.trim()),
          ),
        )
      : {};
  } catch {
    return {};
  }
};

const loadEffectGroupNameOverrides = (): Record<string, string> => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(EFFECT_GROUP_NAME_STORAGE_KEY) ?? "{}",
    );
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? Object.fromEntries(
          Object.entries(stored).filter(
            ([id, name]) =>
              typeof id === "string" &&
              typeof name === "string" &&
              name.trim().length > 0,
          ),
        )
      : {};
  } catch {
    return {};
  }
};

const createResourceTrackId = () => {
  resourceTrackSequence += 1;
  return `resource-${Date.now()}-${resourceTrackSequence}`;
};

const isSupportedResourceTrack = (
  track: unknown,
): track is Partial<ResourceTrack> =>
  Boolean(track) &&
  typeof track === "object" &&
  ["icon", "material", "sfx"].includes(
    String((track as { kind?: unknown }).kind),
  );

const restoreVideoTrack = (
  track: Partial<VideoTrack>,
  fallback: { name: string; url: string; durationInFrames: number },
  cacheTimestamp: number,
  fallbackOrder = 0,
): VideoTrack => {
  const id =
    typeof track.id === "string" && track.id ? track.id : createVideoTrackId();
  return {
  id,
  laneId:
    typeof track.laneId === "string" && track.laneId ? track.laneId : id,
  trackOrder: Number.isFinite(Number(track.trackOrder))
    ? Number(track.trackOrder)
    : fallbackOrder,
  name:
    typeof track.name === "string" && track.name ? track.name : fallback.name,
  url: `${String(track.url || fallback.url).split("?")[0]}?t=${cacheTimestamp}`,
  sourceStartFrame: Math.max(
    0,
    Math.round(Number(track.sourceStartFrame) || 0),
  ),
  sourceDurationInFrames: Math.max(
    3,
    Math.round(
      Number(track.sourceDurationInFrames) ||
        Number(track.sourceStartFrame || 0) +
          Number(track.durationInFrames || fallback.durationInFrames),
    ),
  ),
  startFrame: Math.max(0, Math.round(Number(track.startFrame) || 0)),
  durationInFrames: Math.max(
    3,
    Math.round(Number(track.durationInFrames) || fallback.durationInFrames),
  ),
  visible: track.visible !== false,
  };
};

const restoreResourceTrack = (
  track: Partial<ResourceTrack>,
  fallbackOrder = 0,
): ResourceTrack => {
  const id =
    typeof track.id === "string" && track.id
      ? track.id
      : createResourceTrackId();
  const kind = ["icon", "material", "sfx"].includes(
    String(track.kind),
  )
    ? (track.kind as ResourceTrack["kind"])
    : "icon";
  const position = track.position ?? {
    x: 80,
    y: 80,
    width: kind === "icon" ? 144 : 640,
    height: kind === "icon" ? 144 : 360,
    scale: 1,
    zIndex: 20,
  };
  return {
    id,
    laneId:
      typeof track.laneId === "string" && track.laneId ? track.laneId : id,
    trackOrder: Number.isFinite(Number(track.trackOrder))
      ? Number(track.trackOrder)
      : fallbackOrder,
    kind,
    resourceId:
      typeof track.resourceId === "string" ? track.resourceId : "unknown",
    name:
      typeof track.name === "string" && track.name
        ? track.name
        : `资源 ${fallbackOrder + 1}`,
    url:
      typeof track.url === "string" && track.url.startsWith("/input/")
        ? track.url.split("?")[0]
        : "",
    mimeType:
      typeof track.mimeType === "string" ? track.mimeType : "application/octet-stream",
    sourceStartFrame: Math.max(0, Math.round(Number(track.sourceStartFrame) || 0)),
    sourceDurationInFrames: Math.max(
      3,
      Math.round(Number(track.sourceDurationInFrames) || Number(track.durationInFrames) || 3),
    ),
    startFrame: Math.max(0, Math.round(Number(track.startFrame) || 0)),
    durationInFrames: Math.max(3, Math.round(Number(track.durationInFrames) || 3)),
    visible: track.visible !== false,
    position: {
      x: finiteNumber(position.x, 80),
      y: finiteNumber(position.y, 80),
      width: Math.max(1, finiteNumber(position.width, kind === "icon" ? 144 : 640)),
      height: Math.max(1, finiteNumber(position.height, kind === "icon" ? 144 : 360)),
      scale: clamp(finiteNumber(position.scale, 1), 0.1, 4),
      zIndex: Math.round(clamp(finiteNumber(position.zIndex, 20), 0, 100)),
    },
    volume: clamp(finiteNumber(track.volume, 1), 0, 1),
    voiceDucking: clamp(finiteNumber(track.voiceDucking, 0), 0, 1),
    ...(typeof track.sourceExpressionId === "string" && track.sourceExpressionId
      ? { sourceExpressionId: track.sourceExpressionId }
      : {}),
    ...(typeof track.sourceIntentId === "string" && track.sourceIntentId
      ? { sourceIntentId: track.sourceIntentId }
      : {}),
    ...(typeof track.arrangementBatchId === "string" && track.arrangementBatchId
      ? { arrangementBatchId: track.arrangementBatchId }
      : {}),
    ...(typeof track.arrangementBatchName === "string" && track.arrangementBatchName
      ? { arrangementBatchName: track.arrangementBatchName }
      : {}),
  };
};

const ensureUniqueResourceTrackIds = (
  tracks: ResourceTrack[],
  reservedIds: string[] = [],
) => {
  const usedIds = new Set(reservedIds);
  return tracks.map((track) => {
    if (!usedIds.has(track.id)) {
      usedIds.add(track.id);
      return track;
    }
    const id = createResourceTrackId();
    usedIds.add(id);
    return {
      ...track,
      id,
      laneId: track.laneId === track.id ? id : track.laneId,
    };
  });
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
};

const formatRenderRemaining = (milliseconds: number | null) => {
  if (!milliseconds || milliseconds <= 0) return "正在估算剩余时间";
  const totalSeconds = Math.max(1, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0
    ? `预计还需 ${minutes} 分 ${seconds} 秒`
    : `预计还需 ${seconds} 秒`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const finiteNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const preventLaneOverlaps = <
  T extends { id: string; laneId: string; startFrame: number; durationInFrames: number },
>(clips: T[]): T[] => {
  const updates = new Map<string, number>();
  const laneIds = [...new Set(clips.map((clip) => clip.laneId))];
  for (const laneId of laneIds) {
    const laneClips = clips
      .filter((clip) => clip.laneId === laneId)
      .sort((a, b) => a.startFrame - b.startFrame);
    let nextAvailableFrame = 0;
    for (const clip of laneClips) {
      const startFrame = Math.max(clip.startFrame, nextAvailableFrame);
      if (startFrame !== clip.startFrame) updates.set(clip.id, startFrame);
      nextAvailableFrame = startFrame + clip.durationInFrames;
    }
  }
  if (updates.size === 0) return clips;
  return clips.map((clip) => {
    const startFrame = updates.get(clip.id);
    return startFrame === undefined ? clip : { ...clip, startFrame };
  });
};

const appendClipsWithoutMovingExisting = <
  T extends { id: string; laneId: string; startFrame: number; durationInFrames: number },
>(existing: T[], incoming: T[]): T[] => {
  const appended: T[] = [];
  for (const clip of incoming) {
    const laneClips = [...existing, ...appended]
      .filter((candidate) => candidate.laneId === clip.laneId)
      .sort((left, right) => left.startFrame - right.startFrame);
    let startFrame = clip.startFrame;
    while (true) {
      const conflict = laneClips.find(
        (candidate) =>
          candidate.startFrame < startFrame + clip.durationInFrames &&
          candidate.startFrame + candidate.durationInFrames > startFrame,
      );
      if (!conflict) break;
      startFrame = conflict.startFrame + conflict.durationInFrames;
    }
    appended.push(startFrame === clip.startFrame ? clip : { ...clip, startFrame });
  }
  return [...existing, ...appended];
};

const createInstanceId = (componentId: string) => {
  instanceSequence += 1;
  return `${componentId}-${Date.now()}-${instanceSequence}`;
};

const defaultsFromDefinition = (definition: MotionComponentDefinition) => {
  const schemaDefaults = Object.fromEntries(
    Object.entries(definition.propsSchema).map(([key, schema]) => [
      key,
      schema.default,
    ]),
  );
  return { ...schemaDefaults, ...definition.defaultProps };
};

const createInstance = (
  definition: MotionComponentDefinition,
  startFrame: number,
  totalFrames: number,
  overrides: Partial<MotionInstance> = {},
): MotionInstance => {
  const id = createInstanceId(definition.id);
  const safeStart = clamp(
    Math.round(startFrame),
    0,
    Math.max(0, totalFrames - 1),
  );
  const maxDuration = Math.max(3, totalFrames - safeStart);
  return {
    id,
    laneId:
      typeof overrides.laneId === "string" && overrides.laneId
        ? overrides.laneId
        : id,
    trackOrder: Number.isFinite(Number(overrides.trackOrder))
      ? Number(overrides.trackOrder)
      : instanceSequence,
    componentId: definition.id,
    visible: overrides.visible !== false,
    sourceStartFrame: Math.max(
      0,
      Math.round(Number(overrides.sourceStartFrame) || 0),
    ),
    startFrame: safeStart,
    durationInFrames: clamp(
      Math.round(overrides.durationInFrames ?? definition.durationInFrames),
      3,
      maxDuration,
    ),
    position: {
      ...definition.defaultPosition,
      ...(overrides.position ?? {}),
    },
    backgroundOpacity: clamp(overrides.backgroundOpacity ?? 1, 0, 1),
    props: {
      ...defaultsFromDefinition(definition),
      ...(overrides.props ?? {}),
    },
    ...(typeof overrides.sourceExpressionId === "string" &&
    overrides.sourceExpressionId
      ? { sourceExpressionId: overrides.sourceExpressionId }
      : {}),
    ...(typeof overrides.sourceIntentId === "string" && overrides.sourceIntentId
      ? { sourceIntentId: overrides.sourceIntentId }
      : {}),
    ...(typeof overrides.arrangementBatchId === "string" &&
    overrides.arrangementBatchId
      ? { arrangementBatchId: overrides.arrangementBatchId }
      : {}),
    ...(typeof overrides.arrangementBatchName === "string" &&
    overrides.arrangementBatchName
      ? { arrangementBatchName: overrides.arrangementBatchName }
      : {}),
  };
};

const getRegisteredEffectPosition = (
  definition: MotionComponentDefinition,
  orientation: "landscape" | "portrait",
) => {
  const registeredEffect = EFFECT_REGISTRY_BY_ID.get(definition.id);
  if (!registeredEffect) {
    return { ...definition.defaultPosition };
  }
  const canvasWidth = orientation === "portrait" ? 1080 : 1920;
  const canvasHeight = orientation === "portrait" ? 1920 : 1080;
  if (
    orientation === "portrait" &&
    [
      "PortraitChapterRail",
      "PortraitInfoCallout",
      "PortraitMetricDecision",
      "PortraitDecisionTagStack",
      "PortraitStepChecklist",
      "PortraitRiskWarning",
      "PortraitNextEpisodeCta",
      "PortraitMediaPosterReveal",
      "TitleReveal",
      "LineTrend",
      "StepFlow",
      "CompareSplit",
      "BulletStack",
      "BarChart",
      "EndLockup",
    ].includes(definition.id)
  ) {
    return { ...definition.defaultPosition };
  }
  if (registeredEffect.placement === "top") {
    return { x: 0, y: 0, scale: canvasWidth / definition.bounds.width };
  }
  if (registeredEffect.placement === "bottom") {
    // 底部落点：贴画布下缘、水平居中、按画布宽度自适应，横竖屏都可见
    const scale = Math.min(1, canvasWidth / definition.bounds.width);
    const scaledWidth = definition.bounds.width * scale;
    const margin = orientation === "portrait" ? 64 : 44;
    return {
      x: Math.round((canvasWidth - scaledWidth) / 2),
      y: Math.round(
        canvasHeight - definition.bounds.height * scale - margin,
      ),
      scale,
    };
  }
  if (orientation === "landscape") {
    return { ...definition.defaultPosition };
  }
  // 竖屏 9:16：按画布宽度自适应（约 88% 画布宽），水平居中。
  // 固定 0.45 会让 700px 设计宽的卡片只占画布 29%，明显偏小。
  const scale = (1080 * 0.88) / definition.bounds.width;
  const scaledWidth = definition.bounds.width * scale;
  const y =
    definition.id === "QuoteLockup"
      ? 1120
      : definition.id === "CompareSplit"
        ? 650
        : 430;
  return {
    x: Math.round((1080 - scaledWidth) / 2),
    y,
    scale,
  };
};

type SrtEntry = {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
};

const parseSrtTimestamp = (raw: string) => {
  const match = raw
    .trim()
    .match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const millis = Number(match[4].padEnd(3, "0"));
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
};

const parseSrt = (content: string): SrtEntry[] => {
  const blocks = content.replace(/\r\n/g, "\n").trim().split(/\n\s*\n+/);
  const entries: SrtEntry[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    if (lines.length < 2) continue;
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex < 0) continue;
    const [rawStart, rawEnd] = lines[timeLineIndex].split("-->");
    const startMs = parseSrtTimestamp(rawStart ?? "");
    const endMs = parseSrtTimestamp(rawEnd ?? "");
    if (startMs === null || endMs === null || endMs <= startMs) continue;
    const text = lines
      .slice(timeLineIndex + 1)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    entries.push({
      index: entries.length + 1,
      startMs,
      endMs,
      text,
    });
  }
  return entries;
};

type StudioPreviewProps = {
  videoUrl: string;
  includeVideo: boolean;
  sourceIncludesVideo: boolean;
  videoTracks: VideoTrack[];
  resourceTracks: ResourceTrack[];
  definitions: MotionComponentDefinition[];
  instances: MotionInstance[];
  canvasOrientation: "landscape" | "portrait";
  safetyGuideVisible: boolean;
  solidBackgroundEnabled: boolean;
  soundEnabled: boolean;
  globalCardScale: number;
};

const StudioPreviewComposition = ({
  videoUrl,
  includeVideo,
  sourceIncludesVideo,
  videoTracks,
  resourceTracks,
  definitions,
  instances,
  canvasOrientation,
  safetyGuideVisible,
  solidBackgroundEnabled,
  soundEnabled,
  globalCardScale,
}: StudioPreviewProps) => {
  const previewDefinitionMap = useMemo(
    () => new Map(definitions.map((definition) => [definition.id, definition])),
    [definitions],
  );
  const shownVideoTracks = includeVideo
    ? videoTracks.filter((track) => track.visible !== false)
    : [];
  const activeVideoUrl =
    shownVideoTracks[0]?.url || (videoTracks.length === 0 ? videoUrl : "");
  const hasImportedVideo = videoTracks.length > 0 || Boolean(videoUrl);
  const previewCanvas =
    canvasOrientation === "portrait"
      ? { width: 1080, height: 1920, orientation: "portrait" }
      : { width: 1920, height: 1080, orientation: "landscape" };
  const previewAvoidanceRegions = createKnownAvoidanceRegions({
    canvas: previewCanvas,
    includeFace: false,
    includeCaptions: true,
  });
  const orderedLayers = [
    ...shownVideoTracks.map((track) => ({
      kind: "video" as const,
      order: track.trackOrder,
      id: track.id,
      track,
    })),
    ...instances
      .filter((instance) => instance.visible !== false)
      .map((instance) => ({
        kind: "motion" as const,
        order: instance.trackOrder,
        id: instance.id,
        instance,
      })),
    ...resourceTracks
      .filter((track) => track.visible !== false)
      .map((track) => ({
        kind: "resource" as const,
        order: track.trackOrder,
        id: track.id,
        track,
      })),
  ].sort((a, b) => b.order - a.order);

  return (
    <AbsoluteFill>
      {solidBackgroundEnabled ? (
        <AbsoluteFill style={{ backgroundColor: "#05070a" }} />
      ) : null}
      {orderedLayers.map((layer) => {
        if (layer.kind === "video") {
          const track = layer.track;
          return (
          <Sequence
            key={track.id}
            from={Math.max(0, Math.round(track.startFrame))}
            durationInFrames={Math.max(3, Math.round(track.durationInFrames))}
          >
            <Html5Video
              src={track.url}
              trimBefore={Math.max(0, Math.round(track.sourceStartFrame))}
              volume={soundEnabled ? 1 : 0}
              muted={!soundEnabled}
              pauseWhenBuffering
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Sequence>
          );
        }
        if (layer.kind === "resource") {
          const track = layer.track;
          const isAudio = track.kind === "sfx";
          const effectiveVolume = soundEnabled
            ? track.volume * (1 - track.voiceDucking)
            : 0;
          if (isAudio) {
            return (
              <Sequence
                key={track.id}
                from={Math.max(0, Math.round(track.startFrame))}
                durationInFrames={Math.max(3, Math.round(track.durationInFrames))}
              >
                <Audio
                  src={track.url}
                  trimBefore={Math.max(0, Math.round(track.sourceStartFrame))}
                  volume={effectiveVolume}
                  muted={!soundEnabled}
                />
              </Sequence>
            );
          }
          const visualStyle: React.CSSProperties = {
            position: "absolute",
            left: track.position.x,
            top: track.position.y,
            width: track.position.width,
            height: track.position.height,
            transform: `scale(${track.position.scale})`,
            transformOrigin: "0 0",
            objectFit: "contain",
            zIndex: track.position.zIndex,
          };
          return (
            <Sequence
              key={track.id}
              from={Math.max(0, Math.round(track.startFrame))}
              durationInFrames={Math.max(3, Math.round(track.durationInFrames))}
            >
              {track.mimeType.startsWith("video/") ? (
                <Html5Video
                  src={track.url}
                  trimBefore={Math.max(0, Math.round(track.sourceStartFrame))}
                  muted
                  pauseWhenBuffering
                  style={visualStyle}
                />
              ) : (
                <Img src={track.url} style={visualStyle} />
              )}
            </Sequence>
          );
        }
        const instance = layer.instance;
        const definition = previewDefinitionMap.get(instance.componentId);
        if (!definition) return null;
        const Comp = definition.component;
        return (
          <Sequence
            key={instance.id}
            from={instance.startFrame}
            trimBefore={Math.max(0, instance.sourceStartFrame)}
            durationInFrames={Math.max(3, instance.durationInFrames)}
          >
            <AbsoluteFill
              style={{
                transform: `translate(${instance.position.x}px, ${instance.position.y}px) scale(${instance.position.scale * globalCardScale})`,
                transformOrigin: "0 0",
              }}
            >
              <Comp
                {...instance.props}
                instanceDurationInFrames={instance.durationInFrames}
                videoSrc={activeVideoUrl}
                hideVideo={sourceIncludesVideo}
                muted={!soundEnabled}
                muteVideo={!soundEnabled}
                videoVolume={soundEnabled ? 1 : 0}
                backgroundOpacity={instance.backgroundOpacity}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {includeVideo && shownVideoTracks.length === 0 && videoTracks.length === 0 && videoUrl ? (
        <Html5Video
          src={videoUrl}
          volume={soundEnabled ? 1 : 0}
          muted={!soundEnabled}
          pauseWhenBuffering
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : null}
      {includeVideo && sourceIncludesVideo && !hasImportedVideo ? (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            color: "#91a0b2",
            fontFamily: "Inter, PingFang SC, sans-serif",
            fontSize: 48,
          }}
        >
          请先导入这个组件包使用的原视频
        </AbsoluteFill>
      ) : null}
      {safetyGuideVisible ? (
        <div
          data-preview-safety-guide
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          {previewAvoidanceRegions.map((region) => (
            <div
              key={region.id}
              data-avoidance-region={region.kind}
              style={{
                position: "absolute",
                left: region.x,
                top: region.y,
                width: region.width,
                height: region.height,
                boxSizing: "border-box",
                border:
                  region.kind === "face"
                    ? "2px dashed rgba(255,255,255,.24)"
                    : "2px dashed rgba(85,230,255,.34)",
                background:
                  region.kind === "captions"
                    ? "rgba(85,230,255,.035)"
                    : "transparent",
              }}
            >
              {region.kind === "face" ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "13%",
                      width: "24%",
                      aspectRatio: "1",
                      translate: "-50% 0",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,.13)",
                      border: "1px solid rgba(255,255,255,.2)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "31%",
                      bottom: "7%",
                      width: "62%",
                      translate: "-50% 0",
                      background: "rgba(255,255,255,.105)",
                      border: "1px solid rgba(255,255,255,.16)",
                      clipPath:
                        "polygon(23% 0,77% 0,100% 28%,84% 100%,16% 100%,0 28%)",
                    }}
                  />
                </>
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 14,
                  translate: "-50% 0",
                  color:
                    region.kind === "face"
                      ? "rgba(255,255,255,.34)"
                      : "rgba(85,230,255,.48)",
                  fontSize: 16,
                  letterSpacing: ".18em",
                  whiteSpace: "nowrap",
                }}
              >
                {region.label} · 自动避让
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

type ArrangementPreferences = {
  keepStyleConsistent: boolean;
  accentColor: string;
  autoAddIcons: boolean;
  learnFromConfirmedChoices: boolean;
  componentScores: Record<string, number>;
};

type ArrangementStyleRule = ArrangementPreferences & {
  id: string;
  name: string;
};

const ARRANGEMENT_PREFERENCES_STORAGE_KEY =
  "motion-studio-ai-arrangement-preferences-v1";
const ARRANGEMENT_RULES_STORAGE_KEY =
  "motion-studio-ai-arrangement-rules-v1";
const ACTIVE_ARRANGEMENT_RULE_STORAGE_KEY =
  "motion-studio-ai-arrangement-active-rule-v1";
const DEFAULT_ARRANGEMENT_PREFERENCES: ArrangementPreferences = {
  keepStyleConsistent: true,
  accentColor: "#68e8ff",
  autoAddIcons: false,
  learnFromConfirmedChoices: true,
  componentScores: {},
};

const loadArrangementPreferences = (): ArrangementPreferences => {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(ARRANGEMENT_PREFERENCES_STORAGE_KEY) ?? "{}",
    ) as Partial<ArrangementPreferences>;
    return {
      keepStyleConsistent: saved.keepStyleConsistent !== false,
      accentColor:
        typeof saved.accentColor === "string" &&
        /^#[0-9a-f]{6}$/iu.test(saved.accentColor)
          ? saved.accentColor
          : DEFAULT_ARRANGEMENT_PREFERENCES.accentColor,
      autoAddIcons: saved.autoAddIcons === true,
      learnFromConfirmedChoices: saved.learnFromConfirmedChoices !== false,
      componentScores:
        saved.componentScores && typeof saved.componentScores === "object"
          ? Object.fromEntries(
              Object.entries(saved.componentScores).flatMap(([id, score]) =>
                Number.isFinite(Number(score))
                  ? [[id, Math.max(-8, Math.min(12, Number(score)))]]
                  : [],
              ),
            )
          : {},
    };
  } catch {
    return DEFAULT_ARRANGEMENT_PREFERENCES;
  }
};

const normalizeArrangementStyleRules = (
  input: unknown,
  fallback: ArrangementPreferences,
): ArrangementStyleRule[] => {
  const rules = Array.isArray(input)
    ? (input as Array<Partial<ArrangementStyleRule>>).flatMap((rule, index) => {
          if (!rule || typeof rule !== "object") return [];
          const accentColor =
            typeof rule.accentColor === "string" &&
            /^#[0-9a-f]{6}$/iu.test(rule.accentColor)
              ? rule.accentColor
              : fallback.accentColor;
          return [
            {
              id:
                typeof rule.id === "string" && rule.id
                  ? rule.id
                  : `semantic-style-${index + 1}`,
              name:
                typeof rule.name === "string" && rule.name.trim()
                  ? rule.name.trim()
                  : `语义风格 ${index + 1}`,
              keepStyleConsistent: rule.keepStyleConsistent !== false,
              accentColor,
              autoAddIcons: rule.autoAddIcons === true,
              learnFromConfirmedChoices:
                rule.learnFromConfirmedChoices !== false,
              componentScores:
                rule.componentScores && typeof rule.componentScores === "object"
                  ? Object.fromEntries(
                      Object.entries(rule.componentScores).flatMap(
                        ([componentId, score]) =>
                          Number.isFinite(Number(score))
                            ? [
                                [
                                  componentId,
                                  Math.max(-8, Math.min(12, Number(score))),
                                ],
                              ]
                            : [],
                      ),
                    )
                  : {},
            },
          ];
        })
    : [];
  return rules;
};

const loadArrangementStyleRules = (
  fallback: ArrangementPreferences,
): ArrangementStyleRule[] => {
  try {
    const rules = normalizeArrangementStyleRules(
      JSON.parse(
        window.localStorage.getItem(ARRANGEMENT_RULES_STORAGE_KEY) ?? "[]",
      ),
      fallback,
    );
    if (rules.length > 0) return rules;
  } catch {
    // 旧版单条偏好会在下面迁移为第一条语义风格规则。
  }
  return [{ id: "default-semantic-style", name: "我的语义风格", ...fallback }];
};

const loadActiveArrangementPreferences = (): ArrangementPreferences => {
  const fallback = loadArrangementPreferences();
  const rules = loadArrangementStyleRules(fallback);
  const activeId = window.localStorage.getItem(
    ACTIVE_ARRANGEMENT_RULE_STORAGE_KEY,
  );
  const activeRule = rules.find((rule) => rule.id === activeId) ?? rules[0];
  const { id: _id, name: _name, ...preferences } = activeRule;
  return preferences;
};

const applyConsistentAccent = (
  props: Record<string, unknown>,
  accentColor: string,
) => {
  const colorKeys = [
    "accentColor",
    "highlightColor",
    "headerColor",
    "frameColor",
    "lineColor",
    "primaryColor",
  ];
  return colorKeys.reduce<Record<string, unknown>>(
    (next, key) => (key in props ? { ...next, [key]: accentColor } : next),
    props,
  );
};

const EFFECT_GROUP_ACCENTS = [
  "#4f9dff",
  "#27c4e8",
  "#20d7a0",
  "#f2b93d",
  "#a776f7",
  "#ff7c96",
  "#b5f23d",
];

const loadEffectGroupColorOverrides = (): Record<string, string> => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(EFFECT_GROUP_COLOR_STORAGE_KEY) ?? "{}",
    );
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? Object.fromEntries(
          Object.entries(stored).filter(
            ([id, accent]) =>
              typeof id === "string" &&
              typeof accent === "string" &&
              /^#[0-9a-f]{6}$/i.test(accent),
          ),
        )
      : {};
  } catch {
    return {};
  }
};

type FontSizeStepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

const FontSizeStepper = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: FontSizeStepperProps) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (candidate = draft) => {
    const parsed = Number(candidate);
    if (candidate.trim() === "" || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const nextValue = clamp(parsed, min, max);
    setDraft(String(nextValue));
    onChange(nextValue);
  };

  const adjust = (direction: -1 | 1) => {
    const parsed = Number(draft);
    const baseValue =
      draft.trim() !== "" && Number.isFinite(parsed) ? parsed : value;
    commit(String(baseValue + direction * step));
  };

  return (
    <label className="font-size-field">
      <span>{label}</span>
      <div className="font-size-stepper">
        <button
          type="button"
          aria-label={`${label}减小`}
          onClick={() => adjust(-1)}
        >
          −
        </button>
        <div className="font-size-input-wrap">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            aria-label={label}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => commit()}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setDraft(String(value));
                event.currentTarget.blur();
              }
            }}
          />
          <span aria-hidden="true">px</span>
        </div>
        <button
          type="button"
          aria-label={`${label}增大`}
          onClick={() => adjust(1)}
        >
          +
        </button>
      </div>
    </label>
  );
};

type TimingStepperProps = {
  label: string;
  value: number;
  min: number;
  step: number;
  onChange: (value: number) => void;
};

type StepCountStepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  itemNoun?: string;
  onChange: (value: number) => void;
};

const StepCountStepper = ({
  label,
  value,
  min,
  max,
  itemNoun = "步骤",
  onChange,
}: StepCountStepperProps) => (
  <label className="step-count-field">
    <span>{label}</span>
    <div className="step-count-stepper">
      <button
        type="button"
        aria-label={`减少一个${itemNoun}`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1, min, max))}
      >
        −
      </button>
      <output aria-live="polite">{value} 个{itemNoun}</output>
      <button
        type="button"
        aria-label={`增加一个${itemNoun}`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1, min, max))}
      >
        +
      </button>
    </div>
  </label>
);

const TimingStepper = ({
  label,
  value,
  min,
  step,
  onChange,
}: TimingStepperProps) => {
  const format = (nextValue: number) => nextValue.toFixed(1);
  const [draft, setDraft] = useState(format(value));

  useEffect(() => {
    setDraft(format(value));
  }, [value]);

  const commit = (candidate = draft) => {
    const parsed = Number(candidate);
    if (candidate.trim() === "" || !Number.isFinite(parsed)) {
      setDraft(format(value));
      return;
    }
    const nextValue = Math.max(min, parsed);
    setDraft(format(nextValue));
    onChange(nextValue);
  };

  const adjust = (direction: -1 | 1) => {
    const parsed = Number(draft);
    const baseValue =
      draft.trim() !== "" && Number.isFinite(parsed) ? parsed : value;
    commit(String(baseValue + direction * step));
  };

  return (
    <label className="timing-stepper-field">
      <span>{label}</span>
      <div className="timing-stepper">
        <button
          type="button"
          aria-label={`${label}减小`}
          onClick={() => adjust(-1)}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          step={step}
          value={draft}
          aria-label={label}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit()}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              setDraft(format(value));
              event.currentTarget.blur();
            }
          }}
        />
        <button
          type="button"
          aria-label={`${label}增大`}
          onClick={() => adjust(1)}
        >
          +
        </button>
      </div>
    </label>
  );
};

const App = () => {
  const playerRef = useRef<PlayerRef>(null);
  const realtimePreviewPlayerRef = useRef<PlayerRef>(null);
  const realtimePreviewWindowRef = useRef<Window | null>(null);
  const arrangementPreviewPopoutPlayerRef = useRef<PlayerRef>(null);
  const arrangementPreviewWindowRef = useRef<Window | null>(null);
  const arrangementPreviewDialogDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    geometry: ArrangementPreviewDialogGeometry;
  } | null>(null);
  const arrangementPreviewMinimizedDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    position: ArrangementPreviewMinimizedPosition;
    moved: boolean;
  } | null>(null);
  const arrangementPreviewMinimizedSuppressClickRef = useRef(false);
  const arrangementPreviewDialogResizeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    geometry: ArrangementPreviewDialogGeometry;
    direction: ArrangementPreviewResizeDirection;
  } | null>(null);
  const srtDialogDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    geometry: ArrangementPreviewDialogGeometry;
  } | null>(null);
  const srtDialogResizeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    geometry: ArrangementPreviewDialogGeometry;
    direction: ArrangementPreviewResizeDirection;
  } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadDragCleanupRef = useRef<(() => void) | null>(null);
  const sidebarDragCleanupRef = useRef<(() => void) | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const componentInput = useRef<HTMLInputElement>(null);
  const iconImportInput = useRef<HTMLInputElement>(null);
  const iconImportCategoryRef = useRef("内容与素材");
  const sfxImportInput = useRef<HTMLInputElement>(null);
  const sfxLibraryAudioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const timelineJsonInput = useRef<HTMLInputElement>(null);
  const activeComponentIdRef = useRef("");
  const workspaceReadyRef = useRef(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDirDraft, setExportDirDraft] = useState(
    () => localStorage.getItem("export-folder-path") ?? "",
  );
  const [exportFileNameDraft, setExportFileNameDraft] = useState("");
  const [exportDialogError, setExportDialogError] = useState("");
  const [exportPicking, setExportPicking] = useState(false);
  const [exportFileName, setExportFileName] = useState<string | null>(null);
  const [motionModule, setMotionModule] = useState<MotionModule | null>(null);
  const [definitions, setDefinitions] = useState<MotionComponentDefinition[]>(
    [],
  );
  const [instances, setInstances] = useState<MotionInstance[]>([]);
  const [pendingArrangement, setPendingArrangement] =
    useState<PendingArrangement | null>(null);
  const [arrangementPreviewMinimized, setArrangementPreviewMinimized] =
    useState(false);
  const [arrangementPreviewMinimizedPosition, setArrangementPreviewMinimizedPosition] =
    useState<ArrangementPreviewMinimizedPosition>(() => ({
      x: Math.max(
        ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP,
        window.innerWidth - ARRANGEMENT_PREVIEW_MINIMIZED_WIDTH - ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP,
      ),
      y: Math.max(
        ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP,
        window.innerHeight - ARRANGEMENT_PREVIEW_MINIMIZED_HEIGHT - ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP,
      ),
    }));
  const [arrangementPreviewDialogGeometry, setArrangementPreviewDialogGeometry] =
    useState<ArrangementPreviewDialogGeometry>(
      loadArrangementPreviewDialogGeometry,
    );
  const [srtDialogGeometry, setSrtDialogGeometry] = useState<ArrangementPreviewDialogGeometry>(
    loadSrtDialogGeometry,
  );
  const [arrangementPreferences, setArrangementPreferences] =
    useState<ArrangementPreferences>(loadActiveArrangementPreferences);
  const [arrangementRules, setArrangementRules] = useState<
    ArrangementStyleRule[]
  >(() => loadArrangementStyleRules(loadArrangementPreferences()));
  const [activeArrangementRuleId, setActiveArrangementRuleId] = useState(
    () => {
      const saved = window.localStorage.getItem(
        ACTIVE_ARRANGEMENT_RULE_STORAGE_KEY,
      );
      const rules = loadArrangementStyleRules(loadArrangementPreferences());
      return rules.some((rule) => rule.id === saved) ? saved! : rules[0].id;
    },
  );
  const [arrangementRulesFileReady, setArrangementRulesFileReady] =
    useState(false);
  const [arrangementRulesSaveStatus, setArrangementRulesSaveStatus] = useState<
    "loading" | "saving" | "saved" | "error"
  >("loading");
  const [openingArrangementRulesLocation, setOpeningArrangementRulesLocation] =
    useState(false);
  const [newArrangementRuleName, setNewArrangementRuleName] = useState("");
  const [activePendingPreviewSegmentId, setActivePendingPreviewSegmentId] =
    useState("");
  const [selectedPendingPreviewInstanceId, setSelectedPendingPreviewInstanceId] =
    useState("");
  const [arrangementPreviewWindow, setArrangementPreviewWindow] =
    useState<Window | null>(null);
  const [realtimePreviewWindow, setRealtimePreviewWindow] =
    useState<Window | null>(null);
  const [arrangementComponentPicker, setArrangementComponentPicker] =
    useState<ArrangementComponentPicker | null>(null);
  const [arrangementResourcePicker, setArrangementResourcePicker] =
    useState<ArrangementResourcePicker | null>(null);
  const [arrangementResourceSearch, setArrangementResourceSearch] = useState("");
  const arrangementAudioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [activeArrangementBatchId, setActiveArrangementBatchId] =
    useState("");
  const [activeArrangementIntentId, setActiveArrangementIntentId] =
    useState("");
  const [selectedInstanceId, setSelectedInstanceId] = useState("");
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);
  const [componentName, setComponentName] = useState("本地示例动效");
  const [componentHistory, setComponentHistory] = useState<
    ComponentHistoryItem[]
  >([]);
  const [activeComponentId, setActiveComponentIdState] = useState("");
  const [projects, setProjects] = useState<ProjectHistoryItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [projectName, setProjectName] = useState("未命名项目");
  const [draftStatus, setDraftStatus] = useState<
    "loading" | "saving" | "saved" | "error"
  >("loading");
  const [savingProject, setSavingProject] = useState(false);
  const [videoName, setVideoName] = useState("尚未导入视频");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPreviewEnabled, setVideoPreviewEnabled] = useState(false);
  const [videoDuration, setVideoDuration] = useState(6);
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([]);
  const [resourceTracks, setResourceTracks] = useState<ResourceTrack[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedVideoTrackId, setSelectedVideoTrackId] = useState("");
  const [selectedResourceTrackId, setSelectedResourceTrackId] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  const closeArrangementPreviewWindow = useCallback(() => {
    const previewWindow = arrangementPreviewWindowRef.current;
    rememberPopupWindowSize(
      ARRANGEMENT_PREVIEW_POPUP_SIZE_STORAGE_KEY,
      previewWindow,
    );
    arrangementPreviewWindowRef.current = null;
    setArrangementPreviewWindow(null);
    if (previewWindow && !previewWindow.closed) previewWindow.close();
  }, []);

  const openArrangementPreviewWindow = useCallback(
    (segmentId?: string, instanceId?: string) => {
      if (segmentId) setActivePendingPreviewSegmentId(segmentId);
      if (instanceId) setSelectedPendingPreviewInstanceId(instanceId);
      const existingWindow = arrangementPreviewWindowRef.current;
      if (existingWindow && !existingWindow.closed) {
        existingWindow.focus();
        setArrangementPreviewWindow(existingWindow);
        return;
      }
      const previewWindow = window.open(
        "",
        `ai-motion-arrangement-preview-${Date.now()}`,
        (() => {
          const { width, height } = loadPopupWindowSize(
            ARRANGEMENT_PREVIEW_POPUP_SIZE_STORAGE_KEY,
            { width: 1200, height: 900 },
          );
          return `popup=yes,width=${width},height=${height},resizable=yes,scrollbars=yes`;
        })(),
      );
      if (!previewWindow) {
        setNotice({ tone: "error", text: "浏览器阻止了独立预览窗口，请允许此页面打开弹出式窗口后重试。" });
        return;
      }
      previewWindow.document.title = "AI 动效工作台 · 独立编排预览";
      previewWindow.document.documentElement.lang = "zh-CN";
      previewWindow.document.body.className = "arrangement-preview-popout-body";
      document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]').forEach((sourceNode) => {
        const clonedNode = sourceNode.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;
        previewWindow.document.head.appendChild(clonedNode);
      });
      arrangementPreviewWindowRef.current = previewWindow;
      setArrangementPreviewWindow(previewWindow);
      previewWindow.focus();
      const persistPopupSize = () => {
        rememberPopupWindowSize(
          ARRANGEMENT_PREVIEW_POPUP_SIZE_STORAGE_KEY,
          previewWindow,
        );
      };
      previewWindow.addEventListener("resize", persistPopupSize);
      previewWindow.addEventListener("pagehide", persistPopupSize, { once: true });
      previewWindow.addEventListener("beforeunload", () => {
        persistPopupSize();
        if (arrangementPreviewWindowRef.current === previewWindow) {
          arrangementPreviewWindowRef.current = null;
          setArrangementPreviewWindow(null);
        }
      }, { once: true });
    },
    [],
  );

  const closeRealtimePreviewWindow = useCallback(() => {
    const previewWindow = realtimePreviewWindowRef.current;
    rememberPopupWindowSize(
      REALTIME_PREVIEW_POPUP_SIZE_STORAGE_KEY,
      previewWindow,
    );
    realtimePreviewWindowRef.current = null;
    setRealtimePreviewWindow(null);
    if (previewWindow && !previewWindow.closed) previewWindow.close();
  }, []);

  const openRealtimePreviewWindow = useCallback(() => {
    const existingWindow = realtimePreviewWindowRef.current;
    if (existingWindow && !existingWindow.closed) {
      existingWindow.focus();
      setRealtimePreviewWindow(existingWindow);
      return;
    }
    const previewWindow = window.open(
      "",
      `ai-motion-realtime-preview-${Date.now()}`,
      (() => {
        const { width, height } = loadPopupWindowSize(
          REALTIME_PREVIEW_POPUP_SIZE_STORAGE_KEY,
          { width: 1280, height: 900 },
        );
        return `popup=yes,width=${width},height=${height},resizable=yes,scrollbars=yes`;
      })(),
    );
    if (!previewWindow) {
      setNotice({ tone: "error", text: "浏览器阻止了独立预览窗口，请允许弹出式窗口后重试。" });
      return;
    }
    previewWindow.document.title = "AI 动效工作台 · 实时预览";
    previewWindow.document.documentElement.lang = "zh-CN";
    previewWindow.document.body.className = "arrangement-preview-popout-body";
    document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]').forEach((sourceNode) => {
      previewWindow.document.head.appendChild(sourceNode.cloneNode(true));
    });
    realtimePreviewWindowRef.current = previewWindow;
    setRealtimePreviewWindow(previewWindow);
    previewWindow.focus();
    const persistPopupSize = () => {
      rememberPopupWindowSize(
        REALTIME_PREVIEW_POPUP_SIZE_STORAGE_KEY,
        previewWindow,
      );
    };
    previewWindow.addEventListener("resize", persistPopupSize);
    previewWindow.addEventListener("pagehide", persistPopupSize, { once: true });
    previewWindow.addEventListener("beforeunload", () => {
      persistPopupSize();
      if (realtimePreviewWindowRef.current === previewWindow) {
        realtimePreviewWindowRef.current = null;
        setRealtimePreviewWindow(null);
      }
    }, { once: true });
  }, []);

  useEffect(() => {
    if (!pendingArrangement) closeArrangementPreviewWindow();
  }, [closeArrangementPreviewWindow, pendingArrangement]);

  useEffect(() => () => {
    const previewWindow = arrangementPreviewWindowRef.current;
    rememberPopupWindowSize(
      ARRANGEMENT_PREVIEW_POPUP_SIZE_STORAGE_KEY,
      previewWindow,
    );
    arrangementPreviewWindowRef.current = null;
    if (previewWindow && !previewWindow.closed) previewWindow.close();
  }, []);

  useEffect(() => () => {
    const previewWindow = realtimePreviewWindowRef.current;
    rememberPopupWindowSize(
      REALTIME_PREVIEW_POPUP_SIZE_STORAGE_KEY,
      previewWindow,
    );
    realtimePreviewWindowRef.current = null;
    if (previewWindow && !previewWindow.closed) previewWindow.close();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      ARRANGEMENT_PREVIEW_DIALOG_GEOMETRY_STORAGE_KEY,
      JSON.stringify(arrangementPreviewDialogGeometry),
    );
  }, [arrangementPreviewDialogGeometry]);

  useEffect(() => {
    const constrainDialogToViewport = () => {
      setArrangementPreviewDialogGeometry((current) =>
        constrainArrangementPreviewDialogGeometry(current),
      );
      setArrangementPreviewMinimizedPosition((current) =>
        constrainArrangementPreviewMinimizedPosition(current),
      );
    };
    window.addEventListener("resize", constrainDialogToViewport);
    return () => window.removeEventListener("resize", constrainDialogToViewport);
  }, []);

  const resetArrangementPreviewDialogGeometry = () => {
    setArrangementPreviewDialogGeometry(
      arrangementPreviewDialogGeometryFromDefaultSize(),
    );
  };

  const saveArrangementPreviewDialogDefaultSize = () => {
    const { width, height } = arrangementPreviewDialogGeometry;
    window.localStorage.setItem(
      ARRANGEMENT_PREVIEW_DIALOG_DEFAULT_SIZE_STORAGE_KEY,
      JSON.stringify({ width, height }),
    );
    setNotice({ tone: "ok", text: "已将当前窗口大小设为默认大小。" });
  };

  const beginArrangementPreviewDialogDrag = (
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest("button, input, select, textarea")
    ) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    arrangementPreviewDialogDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      geometry: arrangementPreviewDialogGeometry,
    };
  };

  const moveArrangementPreviewDialog = (
    event: React.PointerEvent<HTMLElement>,
  ) => {
    const drag = arrangementPreviewDialogDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setArrangementPreviewDialogGeometry(
      constrainArrangementPreviewDialogGeometry({
        ...drag.geometry,
        x: drag.geometry.x + event.clientX - drag.startX,
        y: drag.geometry.y + event.clientY - drag.startY,
      }),
    );
  };

  const endArrangementPreviewDialogDrag = (
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (arrangementPreviewDialogDragRef.current?.pointerId !== event.pointerId) {
      return;
    }
    arrangementPreviewDialogDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const beginArrangementPreviewDialogResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    direction: ArrangementPreviewResizeDirection,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    arrangementPreviewDialogResizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      geometry: arrangementPreviewDialogGeometry,
      direction,
    };
  };

  const resizeArrangementPreviewDialog = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const resize = arrangementPreviewDialogResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - resize.startX;
    const deltaY = event.clientY - resize.startY;
    const next = { ...resize.geometry };
    const minimumWidth = Math.min(
      ARRANGEMENT_PREVIEW_DIALOG_MIN_WIDTH,
      Math.max(320, window.innerWidth - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP * 2),
    );
    const minimumHeight = Math.min(
      ARRANGEMENT_PREVIEW_DIALOG_MIN_HEIGHT,
      Math.max(320, window.innerHeight - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP * 2),
    );
    const fixedRight = resize.geometry.x + resize.geometry.width;
    const fixedBottom = resize.geometry.y + resize.geometry.height;

    if (resize.direction.includes("e")) {
      next.width = clamp(
        resize.geometry.width + deltaX,
        minimumWidth,
        window.innerWidth - resize.geometry.x - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP,
      );
    }
    if (resize.direction.includes("s")) {
      next.height = clamp(
        resize.geometry.height + deltaY,
        minimumHeight,
        window.innerHeight - resize.geometry.y - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP,
      );
    }
    if (resize.direction.includes("w")) {
      next.width = clamp(
        resize.geometry.width - deltaX,
        minimumWidth,
        fixedRight - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP,
      );
      next.x = fixedRight - next.width;
    }
    if (resize.direction.includes("n")) {
      next.height = clamp(
        resize.geometry.height - deltaY,
        minimumHeight,
        fixedBottom - ARRANGEMENT_PREVIEW_DIALOG_EDGE_GAP,
      );
      next.y = fixedBottom - next.height;
    }
    setArrangementPreviewDialogGeometry(
      constrainArrangementPreviewDialogGeometry(next),
    );
  };

  const endArrangementPreviewDialogResize = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (arrangementPreviewDialogResizeRef.current?.pointerId !== event.pointerId) {
      return;
    }
    arrangementPreviewDialogResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const [globalCardScale, setGlobalCardScale] = useState(() => {
    const saved = localStorage.getItem("motion-studio-global-card-scale");
    const parsed = saved ? Number(saved) : NaN;
    return Number.isFinite(parsed) && parsed >= 0.5 && parsed <= 2
      ? parsed
      : 1;
  });
  const [workspaceZoom, setWorkspaceZoom] = useState(() => {
    const saved = localStorage.getItem("motion-studio-workspace-zoom");
    const parsed = saved ? Number(saved) : NaN;
    return Number.isFinite(parsed) && parsed >= 50 && parsed <= 200
      ? parsed
      : 100;
  });
  const [workspaceZoomInput, setWorkspaceZoomInput] = useState(() =>
    String(workspaceZoom),
  );
  const [srtDialogOpen, setSrtDialogOpen] = useState(false);
  const [srtFileName, setSrtFileName] = useState("");
  const [srtEntries, setSrtEntries] = useState<SrtEntry[]>([]);
  const [srtGenerating, setSrtGenerating] = useState(false);
  const [aiArrangementStage, setAiArrangementStage] =
    useState<AiArrangementStage>("idle");
  const [aiArrangementError, setAiArrangementError] = useState("");
  const [srtResult, setSrtResult] = useState<{
    cueCount: number;
    semanticSegmentCount?: number;
    intentCount: number;
    detectedIntentCount?: number;
    suppressedIntentCount?: number;
    motionBudget?: number;
    motionCount: number;
    resourceCount: number;
    skippedCueCount: number;
    messages: string[];
  } | null>(null);
  const srtInput = useRef<HTMLInputElement>(null);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] =
    useState<RenderProgressState | null>(null);
  const [renderResult, setRenderResult] = useState<{
    fileName: string;
    downloadUrl: string;
    outputLocation: string;
    mode?: "transparent" | "mov" | "mp4";
    codec?: string;
    profile?: string;
    pixelFormat?: string;
    alphaVerified?: boolean;
    width?: number;
    height?: number;
    fps?: number;
    durationInFrames?: number;
    savedTo?: string;
  } | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [canvasOrientation, setCanvasOrientation] = useState<
    "landscape" | "portrait"
  >("landscape");
  const [safetyGuideVisible, setSafetyGuideVisible] = useState(true);
  const [solidBackgroundEnabled, setSolidBackgroundEnabled] =
    useState(true);
  const [initialPanelWidths] = useState(readStoredPanelWidths);
  const [leftPanelWidth, setLeftPanelWidth] = useState(initialPanelWidths.left);
  const [rightPanelWidth, setRightPanelWidth] = useState(initialPanelWidths.right);
  const [resizingSidebar, setResizingSidebar] = useState<"left" | "right" | null>(null);
  const [sourceIncludesVideo, setSourceIncludesVideo] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [manualTimelineEndFrame, setManualTimelineEndFrame] = useState(0);
  const [regionInFrame, setRegionInFrame] = useState<number | null>(null);
  const [regionOutFrame, setRegionOutFrame] = useState<number | null>(null);
  const [exportUseRegion, setExportUseRegion] = useState(true);
  const [globalCardBase, setGlobalCardBase] = useState<"dark" | "light">(
    "dark",
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [shortcutPanelOpen, setShortcutPanelOpen] = useState(false);
  const [recordingShortcut, setRecordingShortcut] =
    useState<ShortcutAction | null>(null);
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(loadShortcuts);
  const [shortcutDraft, setShortcutDraft] = useState<ShortcutMap>(loadShortcuts);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [timelineMarquee, setTimelineMarquee] =
    useState<MarqueeRect | null>(null);
  const [timelineHeight, setTimelineHeight] = useState(230);
  const [trackHeights, setTrackHeights] = useState<Record<string, number>>({});
  const [activeWorkspace, setActiveWorkspace] =
    useState<"editor" | "effects" | "rules" | "icons" | "sfx" | "code">(
      "editor",
    );
  const [codeTemplateName, setCodeTemplateName] = useState("我的代码动效");
  const [codeTemplate, setCodeTemplate] = useState(DEFAULT_CODE_TEMPLATE);
  const [codeEditorHeight, setCodeEditorHeight] = useState(() =>
    Math.max(160, Math.min(440, window.innerHeight - 245)),
  );
  const [effectSearch, setEffectSearch] = useState("");
  const [iconSearch, setIconSearch] = useState("");
  const [sfxSearch, setSfxSearch] = useState("");
  const [previewingSfxId, setPreviewingSfxId] = useState("");
  const [iconResources, setIconResources] = useState<IconResource[]>([]);
  const [arrangementResourceLibrary, setArrangementResourceLibrary] =
    useState<ArrangementResourceLibrary>({
      icon: [],
      material: [],
      sfx: [],
    });
  const [iconLibraryError, setIconLibraryError] = useState("");
  const [openIconCategories, setOpenIconCategories] = useState<string[]>([
    "内容与素材",
    "状态与数据",
  ]);
  const [customIconGroups, setCustomIconGroups] = useState<IconCategoryGroup[]>([]);
  const [iconGroupRenameTarget, setIconGroupRenameTarget] =
    useState<IconCategoryGroup | null>(null);
  const [iconGroupNameDraft, setIconGroupNameDraft] = useState("");
  const [customSfxGroups, setCustomSfxGroups] = useState<IconCategoryGroup[]>([]);
  const [openSfxGroups, setOpenSfxGroups] = useState<string[]>([
    "内置音效",
    "自定义音效",
  ]);
  const [sfxGroupRenameTarget, setSfxGroupRenameTarget] =
    useState<IconCategoryGroup | null>(null);
  const [sfxGroupNameDraft, setSfxGroupNameDraft] = useState("");
  const [customCatalogGroups, setCustomCatalogGroups] = useState(
    loadCustomCatalogGroups,
  );
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [groupRenameTarget, setGroupRenameTarget] =
    useState<CustomCatalogGroup | null>(null);
  const [pendingGroupDelete, setPendingGroupDelete] =
    useState<PendingGroupDelete | null>(null);
  const [effectGroupAssignments, setEffectGroupAssignments] = useState(
    loadEffectGroupAssignments,
  );
  const [effectNameOverrides, setEffectNameOverrides] = useState(
    loadEffectNameOverrides,
  );
  const [effectGroupNameOverrides, setEffectGroupNameOverrides] = useState(
    loadEffectGroupNameOverrides,
  );
  const [effectGroupColorOverrides, setEffectGroupColorOverrides] = useState(
    loadEffectGroupColorOverrides,
  );
  const [effectRenameTarget, setEffectRenameTarget] =
    useState<EffectRenameTarget | null>(null);
  const [effectNameDraft, setEffectNameDraft] = useState("");
  const [effectMoveTarget, setEffectMoveTarget] =
    useState<EffectMoveTarget | null>(null);
  const [openCatalogCategories, setOpenCatalogCategories] = useState<string[]>([
    "practice",
    "navigation",
  ]);
  const draggedLaneIdRef = useRef("");
  const laneReorderPointerRef = useRef<{
    laneId: string;
    pointerId: number;
  } | null>(null);
  // 整条轨道行按下手势：先不判定意图，移动超过阈值后按主方向仲裁
  // 纵向 → 轨道换位（剪映式）；横向 → 交给片段自身的水平拖拽
  const laneGestureRef = useRef<{
    laneId: string;
    pointerId: number;
    startX: number;
    startY: number;
    resolved: "none" | "vertical" | "horizontal";
  } | null>(null);
  const [laneDrop, setLaneDrop] = useState<LaneDropState | null>(null);

  useLayoutEffect(() => {
    const menu = contextMenuRef.current;
    if (!contextMenu || !menu) return;
    const padding = 8;
    const bounds = menu.getBoundingClientRect();
    const x = Math.max(
      padding,
      Math.min(contextMenu.x, window.innerWidth - bounds.width - padding),
    );
    const y = Math.max(
      padding,
      Math.min(contextMenu.y, window.innerHeight - bounds.height - padding),
    );
    if (x === contextMenu.x && y === contextMenu.y) return;
    setContextMenu((current) =>
      current ? { ...current, x, y } : current,
    );
  }, [contextMenu]);
  const historyRef = useRef<{
    past: EditHistorySnapshot[];
    present: EditHistorySnapshot | null;
    future: EditHistorySnapshot[];
  }>({ past: [], present: null, future: [] });
  const pendingHistoryRef = useRef<EditHistorySnapshot | null>(null);
  const historyTimerRef = useRef(0);
  const applyingHistoryRef = useRef(false);

  useEffect(
    () => () => {
      playheadDragCleanupRef.current?.();
      sfxLibraryAudioPreviewRef.current?.pause();
    },
    [],
  );

  useEffect(() => {
    if (activeWorkspace === "sfx") return;
    sfxLibraryAudioPreviewRef.current?.pause();
    sfxLibraryAudioPreviewRef.current = null;
    setPreviewingSfxId("");
  }, [activeWorkspace]);

  useEffect(() => {
    let cancelled = false;
    fetch("/input/resource-index.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("无法读取图标资源索引");
        return response.json();
      })
      .then((index) => {
        if (cancelled) return;
        const icons = Array.isArray(index?.libraries?.icons)
          ? index.libraries.icons
          : [];
        setIconResources(
          icons.filter(
            (icon: unknown): icon is IconResource =>
              Boolean(icon) &&
              typeof icon === "object" &&
              typeof (icon as IconResource).id === "string" &&
              typeof (icon as IconResource).url === "string",
          ),
        );
        const normalizeLibrary = (
          entries: unknown,
          fallbackCategory: string,
        ): ArrangementResourceEntry[] =>
          (Array.isArray(entries) ? entries : []).flatMap((rawEntry) => {
            if (!isRecord(rawEntry)) return [];
            const id = String(rawEntry.id ?? "");
            const url = String(rawEntry.url ?? "");
            if (!id || !url.startsWith("/input/")) return [];
            const media = isRecord(rawEntry.media) ? rawEntry.media : {};
            return [
              {
                id,
                label: String(rawEntry.label ?? id),
                url,
                mimeType: String(
                  rawEntry.mimeType ?? "application/octet-stream",
                ),
                tags: Array.isArray(rawEntry.tags)
                  ? rawEntry.tags.filter(
                      (tag): tag is string => typeof tag === "string",
                    )
                  : [],
                usage: String(rawEntry.usage ?? ""),
                category: String(rawEntry.category ?? fallbackCategory),
                accent: String(rawEntry.accent ?? "#68e8ff"),
                ...(typeof rawEntry.source === "string"
                  ? { source: rawEntry.source }
                  : {}),
                ...(Number.isFinite(Number(media.durationSeconds))
                  ? { durationSeconds: Number(media.durationSeconds) }
                  : {}),
              },
            ];
          });
        setArrangementResourceLibrary({
          icon: normalizeLibrary(index?.libraries?.icons, "图标"),
          material: normalizeLibrary(index?.libraries?.materials, "素材"),
          sfx: normalizeLibrary(index?.libraries?.sfx, "音效"),
        });
        setIconLibraryError("");
      })
      .catch((error) => {
        if (!cancelled) {
          setIconLibraryError(
            error instanceof Error ? error.message : "图标库加载失败",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetch("/api/icon-groups", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload?.ok || !Array.isArray(payload.groups)) return;
        setCustomIconGroups(
          payload.groups.filter(
            (group: unknown): group is IconCategoryGroup =>
              Boolean(group) && typeof group === "object" &&
              typeof (group as IconCategoryGroup).id === "string" &&
              typeof (group as IconCategoryGroup).name === "string" &&
              typeof (group as IconCategoryGroup).accent === "string",
          ),
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch("/api/sfx-groups", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload?.ok || !Array.isArray(payload.groups)) return;
        setCustomSfxGroups(
          payload.groups.filter(
            (group: unknown): group is IconCategoryGroup =>
              Boolean(group) && typeof group === "object" &&
              typeof (group as IconCategoryGroup).id === "string" &&
              typeof (group as IconCategoryGroup).name === "string" &&
              typeof (group as IconCategoryGroup).accent === "string",
          ),
        );
      })
      .catch(() => undefined);
  }, []);

  const setActiveComponentId = useCallback((id: string) => {
    activeComponentIdRef.current = id;
    setActiveComponentIdState(id);
  }, []);

  const fps = motionModule
    ? getNumberExport(
        motionModule,
        ["WECHAT_VIDEO_FPS", "LOCAL_COMPONENT_FPS", "FPS"],
        30,
      )
    : 30;
  const sourceFrames = motionModule
    ? getNumberExport(
        motionModule,
        [
          "WECHAT_VIDEO_DURATION_IN_FRAMES",
          "LOCAL_COMPONENT_DURATION_IN_FRAMES",
          "DURATION_IN_FRAMES",
        ],
        Math.round(videoDuration * fps),
      )
    : Math.round(videoDuration * fps);
  const videoTimelineFrames = videoTracks.reduce(
    (maximum, track) =>
      Math.max(maximum, track.startFrame + track.durationInFrames),
    0,
  );
  const instanceTimelineFrames = instances.reduce(
    (maximum, instance) =>
      Math.max(maximum, instance.startFrame + instance.durationInFrames),
    0,
  );
  const resourceTimelineFrames = resourceTracks.reduce(
    (maximum, track) =>
      Math.max(maximum, track.startFrame + track.durationInFrames),
    0,
  );
  const durationInFrames = Math.max(
    1,
    videoTracks.length > 0
      ? Math.max(
          videoTimelineFrames,
          Math.round(videoDuration * fps),
          instanceTimelineFrames,
          resourceTimelineFrames,
        )
      : videoUrl
        ? Math.max(
            Math.round(videoDuration * fps),
            instanceTimelineFrames,
            resourceTimelineFrames,
          )
        : Math.max(sourceFrames, instanceTimelineFrames, resourceTimelineFrames),
    manualTimelineEndFrame,
  );
  const canvasWidth = canvasOrientation === "portrait" ? 1080 : 1920;
  const canvasHeight = canvasOrientation === "portrait" ? 1920 : 1080;
  const timelineSeconds = durationInFrames / fps;
  const mainVideoVisible =
    videoTracks.length > 0
      ? videoTracks[0].visible !== false
      : Boolean(videoUrl && videoPreviewEnabled);
  const exportTransparent = !mainVideoVisible && !solidBackgroundEnabled;
  const playheadPercent =
    (currentFrame / Math.max(1, durationInFrames - 1)) * 100;

  // 时间轴横向缩放与滚动（剪映式底部滑轨）
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [timelineScroll, setTimelineScroll] = useState(0);
  const timelineTracksRef = useRef<HTMLDivElement | null>(null);
  const [trackViewportWidth, setTrackViewportWidth] = useState(0);
  const [trackOffsetLeft, setTrackOffsetLeft] = useState(84);
  useEffect(() => {
    const element = timelineTracksRef.current;
    if (!element) return;
    const update = () => {
      const body = element.querySelector<HTMLElement>(".track-body");
      setTrackViewportWidth(body ? body.clientWidth : element.clientWidth);
      const container = timelineRef.current;
      if (body && container) {
        setTrackOffsetLeft(
          body.getBoundingClientRect().left - container.getBoundingClientRect().left,
        );
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  const timelineContentWidth = Math.max(
    1,
    Math.round(trackViewportWidth * timelineZoom),
  );
  const timelineMaxScroll = Math.max(
    0,
    timelineContentWidth - trackViewportWidth,
  );
  useEffect(() => {
    setTimelineScroll((current) =>
      clamp(current, 0, Math.max(0, timelineContentWidth - trackViewportWidth)),
    );
  }, [timelineContentWidth, trackViewportWidth]);

  // 默认缩放：视口约显示 12 秒，长视频自动出现可拖动的滑轨；
  // 用户手动点过缩放按钮后不再自动覆盖。
  const autoZoomAppliedRef = useRef(false);
  useEffect(() => {
    if (autoZoomAppliedRef.current || trackViewportWidth <= 0) return;
    const target = durationInFrames / (12 * fps);
    if (target > 1.05) {
      autoZoomAppliedRef.current = true;
      setTimelineZoom(clamp(Number(target.toFixed(3)), 1, 16));
    }
  }, [trackViewportWidth, durationInFrames, fps]);

  const definitionMap = useMemo(
    () =>
      new Map(
        definitions.map((definition) => [
          definition.id,
          effectNameOverrides[definition.id]
            ? { ...definition, name: effectNameOverrides[definition.id] }
            : definition,
        ]),
      ),
    [definitions, effectNameOverrides],
  );
  const arrangementComponentDefinitions = useMemo(() => {
    const allowedIds = new Set(
      canvasOrientation === "portrait"
        ? PORTRAIT_ROUTE_COMPONENT_IDS
        : AI_ARRANGEABLE_COMPONENT_IDS,
    );
    return definitions.filter((definition) => allowedIds.has(definition.id));
  }, [canvasOrientation, definitions]);
  const pendingArrangementSegments = useMemo<PendingArrangementSegment[]>(() => {
    if (!pendingArrangement) return [];
    const segments = new Map<string, PendingArrangementSegment>();
    const ensureSegment = (
      item: MotionInstance | ResourceTrack,
    ): PendingArrangementSegment => {
      const id = getArrangementSegmentId(item);
      const existing = segments.get(id);
      if (existing) return existing;
      const created: PendingArrangementSegment = {
        id,
        motionInstances: [],
        resourceTracks: [],
        startFrame: item.startFrame,
        endFrame: item.startFrame + item.durationInFrames,
      };
      segments.set(id, created);
      return created;
    };
    pendingArrangement.motionInstances.forEach((instance) => {
      const segment = ensureSegment(instance);
      segment.motionInstances.push(instance);
      segment.startFrame = Math.min(segment.startFrame, instance.startFrame);
      segment.endFrame = Math.max(
        segment.endFrame,
        instance.startFrame + instance.durationInFrames,
      );
    });
    pendingArrangement.resourceTracks.forEach((track) => {
      const segment = ensureSegment(track);
      segment.resourceTracks.push(track);
      segment.startFrame = Math.min(segment.startFrame, track.startFrame);
      segment.endFrame = Math.max(
        segment.endFrame,
        track.startFrame + track.durationInFrames,
      );
    });
    return [...segments.values()].sort(
      (left, right) => left.startFrame - right.startFrame,
    );
  }, [pendingArrangement]);
  const activePendingPreviewSegment =
    pendingArrangementSegments.find(
      (segment) => segment.id === activePendingPreviewSegmentId,
    ) ?? pendingArrangementSegments[0] ?? null;
  const activePendingPreviewSemanticSource = activePendingPreviewSegment
    ? pendingArrangement?.semanticSourcesBySegment?.[
        activePendingPreviewSegment.id
      ]
    : undefined;
  const selectedPendingPreviewInstance = pendingArrangement?.motionInstances.find(
    (instance) => instance.id === selectedPendingPreviewInstanceId,
  ) ?? activePendingPreviewSegment?.motionInstances[0] ?? null;
  const selectedInstance =
    instances.find((instance) => instance.id === selectedInstanceId) ?? null;
  const selectedDefinition = selectedInstance
    ? definitionMap.get(selectedInstance.componentId) ?? null
    : null;
  const selectedResourceTrack =
    resourceTracks.find((track) => track.id === selectedResourceTrackId) ?? null;
  const selectedInstanceIdSet = useMemo(
    () => new Set(selectedInstanceIds),
    [selectedInstanceIds],
  );
  const activeArrangementBatch = useMemo<ArrangementBatchSummary | null>(
    () =>
      activeArrangementBatchId
        ? (summarizeArrangementBatch({
            batchId: activeArrangementBatchId,
            motionItems: instances,
            resourceItems: resourceTracks,
          }) as ArrangementBatchSummary | null)
        : null,
    [activeArrangementBatchId, instances, resourceTracks],
  );
  const timelineLanes = useMemo<TimelineLane[]>(() => {
    const lanes = new Map<string, TimelineLane>();
    for (const track of videoTracks) {
      const existing = lanes.get(track.laneId);
      if (existing?.kind === "video") {
        existing.clips.push(track);
        existing.trackOrder = Math.min(existing.trackOrder, track.trackOrder);
      } else {
        lanes.set(track.laneId, {
          kind: "video",
          laneId: track.laneId,
          trackOrder: track.trackOrder,
          clips: [track],
        });
      }
    }
    for (const instance of instances) {
      const existing = lanes.get(instance.laneId);
      if (existing?.kind === "motion") {
        existing.clips.push(instance);
        existing.trackOrder = Math.min(existing.trackOrder, instance.trackOrder);
      } else {
        lanes.set(instance.laneId, {
          kind: "motion",
          laneId: instance.laneId,
          trackOrder: instance.trackOrder,
          clips: [instance],
        });
      }
    }
    for (const track of resourceTracks) {
      const existing = lanes.get(track.laneId);
      if (existing?.kind === "resource") {
        existing.clips.push(track);
        existing.trackOrder = Math.min(existing.trackOrder, track.trackOrder);
      } else {
        lanes.set(track.laneId, {
          kind: "resource",
          laneId: track.laneId,
          trackOrder: track.trackOrder,
          clips: [track],
        });
      }
    }
    return [...lanes.values()]
      .map((lane) => ({
        ...lane,
        clips: [...lane.clips].sort((a, b) => a.startFrame - b.startFrame),
      })) as TimelineLane[];
  }, [instances, resourceTracks, videoTracks]);
  timelineLanes.sort((a, b) => a.trackOrder - b.trackOrder);
  const customDefinitions = useMemo(
    () =>
      definitions.filter(
        (definition) =>
          !BUILT_IN_COMPONENT_IDS.has(definition.id) &&
          !isBuiltInDefinition(definition) &&
          EFFECT_REGISTRY_BY_ID.get(definition.id)?.semantic.systemRole !==
            "caption-track",
      ),
    [definitions],
  );
  const effectCatalog = useMemo(() => {
    const groups = [
      ...BUILT_IN_CATALOG.map((group, index) => ({
        ...group,
        name: effectGroupNameOverrides[group.id] ?? group.name,
        accent:
          effectGroupColorOverrides[group.id] ??
          EFFECT_GROUP_ACCENTS[index % EFFECT_GROUP_ACCENTS.length],
        items: [] as typeof group.items,
      })),
      ...customCatalogGroups.map((group, index) => ({
        ...group,
        accent:
          effectGroupColorOverrides[group.id] ??
          EFFECT_GROUP_ACCENTS[
            (BUILT_IN_CATALOG.length + index) % EFFECT_GROUP_ACCENTS.length
          ],
        items: [],
      })),
    ];
    const availableGroupIds = new Set(groups.map((group) => group.id));
    const sourceByComponentId = new Map<string, string>();
    const items = BUILT_IN_CATALOG.flatMap((group) =>
      group.items
        .filter(
          (item) =>
            definitionMap.has(item.ids[0]) &&
            EFFECT_REGISTRY_BY_ID.get(item.ids[0])?.semantic.systemRole !==
              "caption-track",
        )
        .map((item) => {
          sourceByComponentId.set(item.ids[0], group.id);
          const renamed = effectNameOverrides[item.ids[0]];
          return renamed ? { ...item, name: renamed } : item;
        }),
    );
    for (const item of items) {
      const sourceGroupId = sourceByComponentId.get(item.ids[0]) ?? "";
      const assignedGroupId = effectGroupAssignments[item.ids[0]];
      const targetGroupId = availableGroupIds.has(assignedGroupId)
        ? assignedGroupId
        : sourceGroupId;
      const target = groups.find((group) => group.id === targetGroupId);
      target?.items.push(item);
    }
    for (const definition of customDefinitions) {
      const targetGroupId = effectGroupAssignments[definition.id];
      const target = groups.find((group) => group.id === targetGroupId);
      if (target) {
        target.items.push({
          ids: [definition.id],
          name: effectNameOverrides[definition.id] ?? definition.name,
        });
      }
    }
    return groups;
  }, [
    customCatalogGroups,
    customDefinitions,
    definitionMap,
    effectGroupAssignments,
    effectGroupColorOverrides,
    effectGroupNameOverrides,
    effectNameOverrides,
  ]);
  const catalogDefinitionMap = useMemo(() => {
    const resolved = new Map<string, MotionComponentDefinition>();
    for (const category of effectCatalog) {
      for (const item of category.items) {
        const candidates = item.ids.flatMap((id) => {
          const definition = definitionMap.get(id);
          return definition ? [definition] : [];
        });
        const definition =
          candidates.find((candidate) => !isBuiltInDefinition(candidate)) ??
          candidates[0];
        if (definition) resolved.set(item.ids[0], definition);
      }
    }
    return resolved;
  }, [definitionMap, effectCatalog]);
  const filteredEffectCatalog = useMemo(() => {
    const query = effectSearch.trim().toLocaleLowerCase("zh-CN");
    return effectCatalog.map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          (!query ||
            category.name.toLocaleLowerCase("zh-CN").includes(query) ||
            item.name.toLocaleLowerCase("zh-CN").includes(query)),
      ),
    })).filter((category) => {
      if (category.items.length > 0) return true;
      const isCustomGroup = customCatalogGroups.some(
        (group) => group.id === category.id,
      );
      if (!isCustomGroup) return false;
      return (
        !query || category.name.toLocaleLowerCase("zh-CN").includes(query)
      );
    });
  }, [customCatalogGroups, effectCatalog, effectSearch]);
  const availableEffectMoveGroups = useMemo(
    () =>
      effectCatalog.filter(
        (group) =>
          group.items.length > 0 ||
          customCatalogGroups.some((customGroup) => customGroup.id === group.id),
      ),
    [customCatalogGroups, effectCatalog],
  );
  const visibleBuiltInEffectCount = useMemo(
    () =>
      filteredEffectCatalog.reduce(
        (total, category) => total + category.items.length,
        0,
      ),
    [filteredEffectCatalog],
  );
  const filteredIconCatalog = useMemo(() => {
    const query = iconSearch.trim().toLocaleLowerCase("zh-CN");
    const categories = new Map<string, IconCategoryGroup & { items: IconResource[] }>();
    for (const group of [...BUILT_IN_ICON_GROUPS, ...customIconGroups]) {
      categories.set(group.name, { ...group, items: [] });
    }
    for (const icon of iconResources) {
      const category = icon.category || "表达与强调";
      const searchable = [
        icon.id,
        icon.label,
        icon.usage,
        category,
        ...(Array.isArray(icon.tags) ? icon.tags : []),
      ]
        .join(" ")
        .toLocaleLowerCase("zh-CN");
      if (query && !searchable.includes(query)) continue;
      const group = categories.get(category) ?? {
        id: `unregistered-${category}`,
        name: category,
        accent: icon.accent || "#4f9dff",
        builtin: true,
        items: [],
      };
      group.accent = icon.accent || group.accent;
      group.items.push(icon);
      categories.set(category, group);
    }
    return [...categories.values()].filter(
      (category) => category.items.length > 0 || (!query && !category.builtin),
    );
  }, [iconResources, iconSearch, customIconGroups]);
  const visibleIconCount = useMemo(
    () =>
      filteredIconCatalog.reduce(
        (total, category) => total + category.items.length,
        0,
      ),
    [filteredIconCatalog],
  );
  const sfxCatalog = useMemo(() => {
    const query = sfxSearch.trim().toLocaleLowerCase("zh-CN");
    const sections = new Map<string, IconCategoryGroup & { items: SoundResource[] }>();
    for (const group of [...BUILT_IN_SFX_SECTIONS, ...customSfxGroups]) {
      sections.set(group.name, { ...group, items: [] });
    }
    for (const sound of arrangementResourceLibrary.sfx as SoundResource[]) {
      if (query) {
        const searchable = [sound.id, sound.label, sound.category, sound.usage, ...sound.tags]
          .join(" ")
          .toLocaleLowerCase("zh-CN");
        if (!searchable.includes(query)) continue;
      }
      const section = sections.get(sfxSectionName(sound, customSfxGroups));
      if (section) section.items.push(sound);
    }
    return [...sections.values()].filter(
      (section) => section.items.length > 0 || (!query && !section.builtin),
    );
  }, [arrangementResourceLibrary.sfx, sfxSearch, customSfxGroups]);
  const ungroupedCustomDefinitions = useMemo(() => {
    const groupedIds = new Set(
      effectCatalog.flatMap((group) => group.items.map((item) => item.ids[0])),
    );
    return customDefinitions
      .filter((definition) => !groupedIds.has(definition.id))
      .map((definition) => definitionMap.get(definition.id) ?? definition);
  }, [customDefinitions, definitionMap, effectCatalog]);
  const selectOnlyInstance = useCallback((instanceId: string) => {
    setSelectedInstanceId(instanceId);
    setSelectedInstanceIds(instanceId ? [instanceId] : []);
    if (instanceId) setSelectedVideoTrackId("");
    if (instanceId) setSelectedResourceTrackId("");
  }, []);

  const selectVideoTrack = useCallback((trackId: string) => {
    setSelectedVideoTrackId(trackId);
    setSelectedInstanceId("");
    setSelectedInstanceIds([]);
    if (trackId) setSelectedResourceTrackId("");
  }, []);

  const selectResourceTrack = useCallback((trackId: string) => {
    setSelectedResourceTrackId(trackId);
    setSelectedVideoTrackId("");
    setSelectedInstanceId("");
    setSelectedInstanceIds([]);
  }, []);

  const refreshHistory = useCallback(async () => {
    const response = await fetch("/api/component-history");
    const data = await response.json();
    if (response.ok) setComponentHistory(data.history ?? []);
  }, []);

  const applyModule = useCallback(
    (
      loaded: MotionModule,
      options: {
        sourceIncludesVideo: boolean;
        componentName: string;
        totalFrames: number;
        restoredInstances?: MotionInstance[];
        restoredFrame?: number;
        appendComponentId?: string;
        appendStartFrame?: number;
        appendTrackOrder?: number;
        appendOrientation?: "landscape" | "portrait";
      },
    ) => {
      const loadedFps = getNumberExport(
        loaded,
        ["WECHAT_VIDEO_FPS", "LOCAL_COMPONENT_FPS", "FPS"],
        30,
      );
      const loadedFrames = getNumberExport(
        loaded,
        [
          "WECHAT_VIDEO_DURATION_IN_FRAMES",
          "LOCAL_COMPONENT_DURATION_IN_FRAMES",
          "DURATION_IN_FRAMES",
        ],
        options.totalFrames,
      );
      const totalFrames = Math.max(1, options.totalFrames || loadedFrames);
      const importedDefinitions = getMotionComponents(loaded, loadedFrames);
      const nextDefinitions =
        mergeWithBuiltInDefinitions(importedDefinitions);
      const hasRestoredInstances = Array.isArray(options.restoredInstances);
      const restoredInstances = (options.restoredInstances ?? []).flatMap(
        (savedInstance) => {
          const definition = nextDefinitions.find(
            (candidate) => candidate.id === savedInstance.componentId,
          );
          if (!definition) return [];
          const restored = createInstance(
            definition,
            savedInstance.startFrame,
            totalFrames,
            {
              durationInFrames: savedInstance.durationInFrames,
              visible: savedInstance.visible !== false,
              sourceStartFrame: Number(savedInstance.sourceStartFrame) || 0,
              laneId: savedInstance.laneId,
              trackOrder: savedInstance.trackOrder,
              position: savedInstance.position,
              backgroundOpacity: savedInstance.backgroundOpacity,
              props: savedInstance.props,
              sourceExpressionId: savedInstance.sourceExpressionId,
              sourceIntentId: savedInstance.sourceIntentId,
              arrangementBatchId: savedInstance.arrangementBatchId,
              arrangementBatchName: savedInstance.arrangementBatchName,
            },
          );
          return [
            {
              ...restored,
              id:
                typeof savedInstance.id === "string" && savedInstance.id
                  ? savedInstance.id
                  : restored.id,
            },
          ];
        },
      );
      const presets = getMotionTimeline(loaded);
      const presetInstances = presets.flatMap((preset, presetIndex) => {
        const definition = nextDefinitions.find(
          (candidate) => candidate.id === preset.componentId,
        );
        if (!definition) return [];
        return [
          createInstance(definition, preset.startFrame ?? 0, totalFrames, {
            durationInFrames:
              preset.durationInFrames && preset.durationInFrames > 0
                ? preset.durationInFrames
                : definition.durationInFrames,
            position: {
              ...definition.defaultPosition,
              ...(preset.position ?? {}),
            },
            backgroundOpacity: preset.backgroundOpacity,
            props: preset.props,
            trackOrder: presetIndex + 1,
          }),
        ];
      });
      const appendComponentId = options.appendComponentId?.trim() ?? "";
      const appendingToTimeline = Boolean(appendComponentId);
      const appendedInstances = appendingToTimeline
        ? presetInstances.length > 0
          ? presetInstances
          : (() => {
              const targetDefinition =
                nextDefinitions.find(
                  (candidate) => candidate.id === appendComponentId,
                ) ??
                importedDefinitions[0] ??
                nextDefinitions[0];
              return targetDefinition
                ? [
                    createInstance(
                      targetDefinition,
                      options.appendStartFrame ?? 0,
                      totalFrames,
                      {
                        position: getRegisteredEffectPosition(
                          targetDefinition,
                          options.appendOrientation ?? "landscape",
                        ),
                        trackOrder: options.appendTrackOrder,
                      },
                    ),
                  ]
                : [];
            })()
        : [];
      if (appendingToTimeline) {
        if (appendedInstances.length > 0) {
          setInstances((current) =>
            preventLaneOverlaps([...current, ...appendedInstances]),
          );
          setSelectedInstanceId(appendedInstances[0].id);
          setSelectedInstanceIds([appendedInstances[0].id]);
        }
      } else {
        const nextInstances = preventLaneOverlaps(
          hasRestoredInstances ? restoredInstances : presetInstances,
        ).map((instance) =>
          instance.componentId === "QuickSetupProof" && instance.position.x < 0
            ? {
                ...instance,
                position: { ...instance.position, x: 0 },
              }
            : instance,
        );
        if (
          !hasRestoredInstances &&
          nextInstances.length === 0 &&
          nextDefinitions[0]
        ) {
          nextInstances.push(
            createInstance(nextDefinitions[0], 0, totalFrames, {
              durationInFrames: Math.min(
                nextDefinitions[0].durationInFrames,
                totalFrames,
              ),
            }),
          );
        }
        setInstances(nextInstances);
        setSelectedInstanceId(nextInstances[0]?.id ?? "");
        setSelectedInstanceIds(
          nextInstances[0]?.id ? [nextInstances[0].id] : [],
        );
        setSelectedVideoTrackId("");
      }
      setMotionModule(loaded);
      setDefinitions(nextDefinitions);
      setSourceIncludesVideo(options.sourceIncludesVideo);
      setComponentName(options.componentName);
      setCurrentFrame((frame) =>
        clamp(options.restoredFrame ?? frame, 0, totalFrames - 1),
      );
      if (loadedFps !== fps) playerRef.current?.seekTo(0);
    },
    [fps],
  );

  const loadModuleUrl = useCallback(
    async (
      url: string,
      options: {
        sourceIncludesVideo: boolean;
        componentName: string;
        totalFrames: number;
        restoredInstances?: MotionInstance[];
        restoredFrame?: number;
        appendComponentId?: string;
        appendStartFrame?: number;
        appendTrackOrder?: number;
        appendOrientation?: "landscape" | "portrait";
      },
    ) => {
      const loaded = (await import(/* @vite-ignore */ url)) as MotionModule;
      applyModule(loaded, options);
      return loaded;
    },
    [applyModule],
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/component").then((response) => response.json()),
      fetch("/api/state").then((response) => response.json()),
      fetch("/api/component-history").then((response) => response.json()),
    ])
      .then(async ([component, state, history]) => {
        const draft = state.workspaceDraft as ProjectSnapshot | undefined;
        const canRestoreDraft = Boolean(
          draft &&
            (!draft.activeComponentId ||
              draft.activeComponentId === state.activeComponentId),
        );
        const storedDuration =
          Number(canRestoreDraft ? draft?.videoDuration : state.videoDuration) >
          0
            ? Number(
                canRestoreDraft ? draft?.videoDuration : state.videoDuration,
              )
            : 6;
        const storedVideoName = canRestoreDraft
          ? draft?.videoName
          : state.videoName;
        const storedVideoUrl = canRestoreDraft
          ? draft?.videoUrl
          : state.videoUrl;
        if (storedVideoName) setVideoName(storedVideoName);
        const refreshedVideoUrl = storedVideoUrl
          ? `${String(storedVideoUrl).split("?")[0]}?t=${Date.now()}`
          : "";
        if (storedVideoUrl) {
          setVideoUrl(refreshedVideoUrl);
        }
        setVideoDuration(storedDuration);
        const storedVideoTracks = canRestoreDraft
          ? Array.isArray(draft?.videoTracks)
            ? draft.videoTracks
            : []
          : [];
        const trackTimestamp = Date.now();
        const restoredTracks =
          storedVideoTracks.length > 0
            ? storedVideoTracks.map((track, trackIndex) =>
                restoreVideoTrack(
                  track,
                  {
                    name: String(storedVideoName || "已导入视频"),
                    url: refreshedVideoUrl,
                    durationInFrames: Math.round(storedDuration * 30),
                  },
                  trackTimestamp,
                  trackIndex,
                ),
              )
            : refreshedVideoUrl
              ? [
                  restoreVideoTrack(
                    {},
                    {
                      name: String(storedVideoName || "已导入视频"),
                      url: refreshedVideoUrl,
                      durationInFrames: Math.round(storedDuration * 30),
                    },
                    trackTimestamp,
                    0,
                  ),
                ]
              : [];
        if (restoredTracks.length > 0) {
          setVideoTracks(preventLaneOverlaps(restoredTracks));
          setSelectedVideoTrackId(restoredTracks[0].id);
          setVideoPreviewEnabled(true);
        }
        setComponentHistory(history.history ?? []);
        setProjects(state.projectHistory ?? []);
        setActiveProjectId(state.activeProjectId ?? "");
        setProjectName(
          draft?.name ??
            (state.projectHistory ?? []).find(
              (item: ProjectHistoryItem) =>
                item.id === state.activeProjectId,
            )?.name ??
            "未命名项目",
        );
        if (draft?.theme === "light") setTheme("light");
        setCanvasOrientation(
          draft?.canvasOrientation === "portrait" ? "portrait" : "landscape",
        );
        setSafetyGuideVisible(draft?.safetyGuideVisible !== false);
        setSolidBackgroundEnabled(
          draft?.solidBackgroundEnabled !== false,
        );
        setSoundEnabled(draft?.soundEnabled !== false);
        setActiveArrangementBatchId(
          canRestoreDraft ? (draft?.activeArrangementBatchId ?? "") : "",
        );
        setActiveArrangementIntentId("");
        if (Number(draft?.timelineHeight) >= 180) {
          setTimelineHeight(Number(draft?.timelineHeight));
        }
        setTrackHeights(draft?.trackHeights ?? {});
        setResourceTracks(
          canRestoreDraft && Array.isArray(draft?.resourceTracks)
            ? preventLaneOverlaps(
                ensureUniqueResourceTrackIds(
                  draft.resourceTracks
                    .filter(isSupportedResourceTrack)
                    .map((track, index) =>
                      restoreResourceTrack(track, restoredTracks.length + index),
                    ),
                ),
              )
            : [],
        );
        setActiveComponentId(state.activeComponentId ?? "");
        await loadModuleUrl(component.moduleUrl, {
          sourceIncludesVideo: Boolean(
            (canRestoreDraft
              ? draft?.sourceIncludesVideo
              : state.sourceIncludesVideo) ?? component.sourceIncludesVideo,
          ),
          componentName:
            (canRestoreDraft ? draft?.componentName : state.componentName) ??
            "本地示例动效",
          totalFrames: Math.round(storedDuration * 30),
          restoredInstances: canRestoreDraft ? draft?.instances : undefined,
          restoredFrame: canRestoreDraft ? draft?.currentFrame : undefined,
        });
        workspaceReadyRef.current = true;
        setDraftStatus("saved");
      })
      .catch((error) =>
        setNotice({ tone: "error", text: `加载组件失败：${error.message}` }),
      );
  }, [loadModuleUrl, setActiveComponentId]);

  useEffect(() => {
    window.localStorage.setItem(
      PANEL_WIDTH_STORAGE_KEY,
      JSON.stringify({ left: leftPanelWidth, right: rightPanelWidth }),
    );
  }, [leftPanelWidth, rightPanelWidth]);

  useEffect(() => {
    window.localStorage.setItem(
      "motion-studio-global-card-scale",
      String(globalCardScale),
    );
  }, [globalCardScale]);

  useEffect(() => {
    window.localStorage.setItem(
      "motion-studio-workspace-zoom",
      String(workspaceZoom),
    );
  }, [workspaceZoom]);

  useEffect(() => {
    window.localStorage.setItem(
      ARRANGEMENT_PREFERENCES_STORAGE_KEY,
      JSON.stringify(arrangementPreferences),
    );
  }, [arrangementPreferences]);

  useEffect(() => {
    let cancelled = false;
    const hydrateArrangementRules = async () => {
      try {
        const response = await fetch("/api/arrangement-rules", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !payload.manifest) {
          throw new Error(payload?.error ?? "无法读取项目编排规则清单");
        }
        const fileRules = normalizeArrangementStyleRules(
          payload.manifest.rules,
          DEFAULT_ARRANGEMENT_PREFERENCES,
        );
        if (fileRules.length === 0) throw new Error("项目编排规则清单为空");
        const requestedActiveId = String(payload.manifest.activeRuleId ?? "");
        const nextActiveRule =
          fileRules.find((rule) => rule.id === requestedActiveId) ?? fileRules[0];
        const { id: _id, name: _name, ...preferences } = nextActiveRule;
        if (!cancelled) {
          setArrangementRules(fileRules);
          setActiveArrangementRuleId(nextActiveRule.id);
          setArrangementPreferences(preferences);
        }
        if (!cancelled) {
          setArrangementRulesFileReady(true);
          setArrangementRulesSaveStatus("saved");
        }
      } catch (error) {
        if (!cancelled) {
          setArrangementRulesSaveStatus("error");
          setNotice({
            tone: "error",
            text:
              error instanceof Error
                ? error.message
                : "项目编排规则读取失败",
          });
        }
      }
    };
    void hydrateArrangementRules();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setArrangementRules((current) =>
      current.map((rule) =>
        rule.id === activeArrangementRuleId
          ? { ...rule, ...arrangementPreferences }
          : rule,
      ),
    );
  }, [activeArrangementRuleId, arrangementPreferences]);

  useEffect(() => {
    window.localStorage.setItem(
      ARRANGEMENT_RULES_STORAGE_KEY,
      JSON.stringify(arrangementRules),
    );
  }, [arrangementRules]);

  useEffect(() => {
    window.localStorage.setItem(
      ACTIVE_ARRANGEMENT_RULE_STORAGE_KEY,
      activeArrangementRuleId,
    );
  }, [activeArrangementRuleId]);

  useEffect(() => {
    if (!arrangementRulesFileReady) return;
    setArrangementRulesSaveStatus("saving");
    const timer = window.setTimeout(() => {
      void fetch("/api/arrangement-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: 1,
          activeRuleId: activeArrangementRuleId,
          rules: arrangementRules,
        }),
      })
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok || !payload?.ok) {
            throw new Error(payload?.error ?? "编排规则保存失败");
          }
          setArrangementRulesSaveStatus("saved");
        })
        .catch((error) => {
          setArrangementRulesSaveStatus("error");
          setNotice({
            tone: "error",
            text:
              error instanceof Error ? error.message : "编排规则保存失败",
          });
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [
    activeArrangementRuleId,
    arrangementRules,
    arrangementRulesFileReady,
  ]);

  useEffect(() => {
    setWorkspaceZoomInput(String(workspaceZoom));
  }, [workspaceZoom]);

  useEffect(
    () => () => {
      sidebarDragCleanupRef.current?.();
    },
    [],
  );

  useEffect(() => {
    let stopped = false;
    let timer = 0;
    const pollForImportedComponent = async () => {
      try {
        const state = await fetch("/api/state").then((response) =>
          response.json(),
        );
        if (
          state.activeComponentId &&
          state.activeComponentId !== activeComponentIdRef.current
        ) {
          setActiveComponentId(state.activeComponentId);
          const component = await fetch("/api/component").then((response) =>
            response.json(),
          );
          await loadModuleUrl(component.moduleUrl, {
            sourceIncludesVideo: Boolean(component.sourceIncludesVideo),
            componentName: state.componentName ?? "自动导入组件",
            totalFrames: durationInFrames,
          });
          await refreshHistory();
          setNotice({
            tone: "ok",
            text: `已自动导入 ${state.componentName ?? "Remotion 组件包"}。`,
          });
        }
      } catch {
        // The local service may be restarting; the next poll will retry.
      } finally {
        if (!stopped) {
          timer = window.setTimeout(pollForImportedComponent, 2000);
        }
      }
    };
    timer = window.setTimeout(pollForImportedComponent, 2000);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [
    durationInFrames,
    loadModuleUrl,
    refreshHistory,
    setActiveComponentId,
  ]);

  useEffect(() => {
    setInstances((current) =>
      current.map((instance) => {
        const startFrame = clamp(
          instance.startFrame,
          0,
          Math.max(0, durationInFrames - 1),
        );
        return {
          ...instance,
          startFrame,
          durationInFrames: clamp(
            instance.durationInFrames,
            3,
            Math.max(3, durationInFrames - startFrame),
          ),
        };
      }),
    );
    setCurrentFrame((frame) =>
      clamp(frame, 0, Math.max(0, durationInFrames - 1)),
    );
  }, [durationInFrames]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const updateFrame = (event: { detail: { frame: number } }) => {
      setCurrentFrame(event.detail.frame);
    };
    const markPlaying = () => setIsPlaying(true);
    const markPaused = () => setIsPlaying(false);
    player.addEventListener("frameupdate", updateFrame);
    player.addEventListener("play", markPlaying);
    player.addEventListener("pause", markPaused);
    player.addEventListener("ended", markPaused);
    return () => {
      player.removeEventListener("frameupdate", updateFrame);
      player.removeEventListener("play", markPlaying);
      player.removeEventListener("pause", markPaused);
      player.removeEventListener("ended", markPaused);
    };
  }, [motionModule]);

  useEffect(() => {
    if (!isPlaying || playerRef.current) return;
    let animationFrame = 0;
    let previousTime = performance.now();
    let accumulatedTime = 0;
    const frameDuration = 1000 / fps;
    const advancePlayback = (now: number) => {
      accumulatedTime += now - previousTime;
      previousTime = now;
      const framesToAdvance = Math.floor(accumulatedTime / frameDuration);
      if (framesToAdvance > 0) {
        accumulatedTime -= framesToAdvance * frameDuration;
      }
      setCurrentFrame((frame) => {
        const nextFrame = frame + framesToAdvance;
        if (nextFrame >= durationInFrames - 1) {
          setIsPlaying(false);
          return durationInFrames - 1;
        }
        return nextFrame;
      });
      animationFrame = window.requestAnimationFrame(advancePlayback);
    };
    animationFrame = window.requestAnimationFrame(advancePlayback);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [durationInFrames, fps, isPlaying]);

  // 亮底模式：所有卡片背景透明（backgroundOpacity 归零），暗底保持原值
  const effectiveInstances = useMemo<MotionInstance[]>(
    () =>
      globalCardBase === "light"
        ? instances.map((instance) => ({
            ...instance,
            backgroundOpacity: 0,
            props: { ...instance.props, cardTransparent: true },
          }))
        : instances,
    [instances, globalCardBase],
  );

  const previewInputProps = useMemo<StudioPreviewProps>(
    () => ({
      videoUrl,
      includeVideo: videoPreviewEnabled,
      sourceIncludesVideo,
      videoTracks,
      resourceTracks,
      definitions,
      instances: effectiveInstances,
      canvasOrientation,
      safetyGuideVisible,
      solidBackgroundEnabled,
      soundEnabled,
      globalCardScale,
    }),
    [
      definitions,
      effectiveInstances,
      canvasOrientation,
      safetyGuideVisible,
      solidBackgroundEnabled,
      soundEnabled,
      sourceIncludesVideo,
      videoPreviewEnabled,
      videoUrl,
      videoTracks,
      resourceTracks,
      globalCardScale,
    ],
  );
  const pendingArrangementPreviewInputProps = useMemo<StudioPreviewProps>(() => {
    if (!pendingArrangement) return previewInputProps;
    const selectedKeys = new Set(pendingArrangement.selectedKeys);
    const previewInstances = pendingArrangement.motionInstances.filter((instance) =>
      selectedKeys.has(`motion:${instance.id}`),
    );
    if (
      pendingArrangement.captionInstance &&
      selectedKeys.has(`caption:${pendingArrangement.captionInstance.id}`)
    ) {
      previewInstances.push(pendingArrangement.captionInstance);
    }
    return {
      ...previewInputProps,
      instances:
        globalCardBase === "light"
          ? previewInstances.map((instance) => ({
              ...instance,
              backgroundOpacity: 0,
              props: { ...instance.props, cardTransparent: true },
            }))
          : previewInstances,
      resourceTracks: pendingArrangement.resourceTracks.filter((track) =>
        selectedKeys.has(`resource:${track.id}`),
      ),
      safetyGuideVisible,
    };
  }, [globalCardBase, pendingArrangement, previewInputProps, safetyGuideVisible]);

  useEffect(() => {
    if (!pendingArrangement || pendingArrangementSegments.length === 0) {
      setActivePendingPreviewSegmentId("");
      setSelectedPendingPreviewInstanceId("");
      return;
    }
    const segment =
      pendingArrangementSegments.find(
        (candidate) => candidate.id === activePendingPreviewSegmentId,
      ) ?? pendingArrangementSegments[0];
    if (segment.id !== activePendingPreviewSegmentId) {
      setActivePendingPreviewSegmentId(segment.id);
    }
    if (
      !segment.motionInstances.some(
        (instance) => instance.id === selectedPendingPreviewInstanceId,
      )
    ) {
      setSelectedPendingPreviewInstanceId(segment.motionInstances[0]?.id ?? "");
    }
    const previewFrame = Math.min(
      segment.endFrame - 1,
      segment.startFrame + Math.max(1, Math.round(fps * 0.2)),
    );
    window.requestAnimationFrame(() => {
      const frame = Math.max(0, previewFrame);
      arrangementPreviewPopoutPlayerRef.current?.seekTo(frame);
    });
  }, [
    activePendingPreviewSegmentId,
    fps,
    pendingArrangement,
    pendingArrangementSegments,
    selectedPendingPreviewInstanceId,
  ]);

  useEffect(() => {
    realtimePreviewPlayerRef.current?.seekTo(Math.max(0, currentFrame));
  }, [currentFrame, realtimePreviewWindow]);

  const workspaceSnapshot = useMemo<ProjectSnapshot>(
    () => ({
      version: 1,
      name: projectName.trim() || "未命名项目",
      activeComponentId,
      activeArrangementBatchId,
      componentName,
      sourceIncludesVideo,
      videoName,
      videoUrl: videoUrl ? videoUrl.split("?")[0] : "",
      videoDuration,
      videoTracks: videoTracks.map((track) => ({
        ...track,
        url: track.url.split("?")[0],
      })),
      resourceTracks: resourceTracks.map((track) => ({
        ...track,
        url: track.url.split("?")[0],
      })),
      instances,
      currentFrame,
      theme,
      timelineHeight,
      trackHeights,
      canvasOrientation,
      safetyGuideVisible,
      solidBackgroundEnabled,
      soundEnabled,
    }),
    [
      activeComponentId,
      activeArrangementBatchId,
      canvasOrientation,
      componentName,
      currentFrame,
      instances,
      projectName,
      resourceTracks,
      safetyGuideVisible,
      solidBackgroundEnabled,
      soundEnabled,
      sourceIncludesVideo,
      theme,
      timelineHeight,
      trackHeights,
      videoDuration,
      videoName,
      videoUrl,
      videoTracks,
    ],
  );

  useEffect(() => {
    if (!workspaceReadyRef.current || !motionModule) return;
    setDraftStatus("saving");
    const timer = window.setTimeout(async () => {
      if (!workspaceReadyRef.current) return;
      try {
        const response = await fetch("/api/workspace-draft", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(workspaceSnapshot),
        });
        if (!response.ok) throw new Error("自动草稿保存失败");
        setDraftStatus("saved");
      } catch {
        setDraftStatus("error");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [motionModule, workspaceSnapshot]);

  const commitPendingHistory = useCallback(() => {
    window.clearTimeout(historyTimerRef.current);
    const pending = pendingHistoryRef.current;
    if (!pending) return;
    pendingHistoryRef.current = null;
    const history = historyRef.current;
    if (!history.present) {
      history.present = cloneEditSnapshot(pending);
      return;
    }
    if (JSON.stringify(history.present) === JSON.stringify(pending)) return;
    history.past.push(cloneEditSnapshot(history.present));
    if (history.past.length > 100) history.past.shift();
    history.present = cloneEditSnapshot(pending);
    history.future = [];
  }, []);

  useEffect(() => {
    if (!workspaceReadyRef.current) return;
    const snapshot = cloneEditSnapshot({
      videoTracks,
      resourceTracks,
      instances,
      soundEnabled,
    });
    if (applyingHistoryRef.current) {
      applyingHistoryRef.current = false;
      pendingHistoryRef.current = null;
      historyRef.current.present = snapshot;
      return;
    }
    if (!historyRef.current.present) {
      historyRef.current.present = snapshot;
      return;
    }
    pendingHistoryRef.current = snapshot;
    window.clearTimeout(historyTimerRef.current);
    historyTimerRef.current = window.setTimeout(commitPendingHistory, 220);
    return () => window.clearTimeout(historyTimerRef.current);
  }, [
    commitPendingHistory,
    draftStatus,
    instances,
    resourceTracks,
    soundEnabled,
    videoTracks,
  ]);

  const applyHistorySnapshot = useCallback((snapshot: EditHistorySnapshot) => {
    applyingHistoryRef.current = true;
    setVideoTracks(cloneEditSnapshot(snapshot).videoTracks);
    setResourceTracks(cloneEditSnapshot(snapshot).resourceTracks);
    setInstances(cloneEditSnapshot(snapshot).instances);
    setSoundEnabled(snapshot.soundEnabled);
    setSelectedVideoTrackId("");
    setSelectedResourceTrackId("");
    setSelectedInstanceId("");
    setSelectedInstanceIds([]);
  }, []);

  const undoEdit = useCallback(() => {
    commitPendingHistory();
    const history = historyRef.current;
    const previous = history.past.pop();
    if (!previous || !history.present) {
      setNotice({ tone: "info", text: "没有可以撤销的操作。" });
      return;
    }
    history.future.unshift(cloneEditSnapshot(history.present));
    history.present = cloneEditSnapshot(previous);
    applyHistorySnapshot(previous);
    setNotice({ tone: "ok", text: "已撤销上一次编辑。" });
  }, [applyHistorySnapshot, commitPendingHistory]);

  const redoEdit = useCallback(() => {
    commitPendingHistory();
    const history = historyRef.current;
    const next = history.future.shift();
    if (!next || !history.present) {
      setNotice({ tone: "info", text: "没有可以重做的操作。" });
      return;
    }
    history.past.push(cloneEditSnapshot(history.present));
    history.present = cloneEditSnapshot(next);
    applyHistorySnapshot(next);
    setNotice({ tone: "ok", text: "已重做上一次编辑。" });
  }, [applyHistorySnapshot, commitPendingHistory]);

  const saveProject = async (saveAsNew = false) => {
    const name = projectName.trim();
    if (!name) {
      setNotice({tone: "error", text: "请先填写项目名称。"});
      return;
    }
    setSavingProject(true);
    setNotice({tone: "info", text: "正在保存本地项目…"});
    try {
      const response = await fetch("/api/save-project", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          id: saveAsNew ? undefined : activeProjectId || undefined,
          name,
          snapshot: {...workspaceSnapshot, name},
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "项目保存失败");
      setProjects(data.projects ?? []);
      setActiveProjectId(data.project.id);
      setProjectName(data.project.name);
      setDraftStatus("saved");
      setNotice({
        tone: "ok",
        text: saveAsNew ? `已另存为 ${data.project.name}` : `已保存 ${data.project.name}`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "项目保存失败",
      });
    } finally {
      setSavingProject(false);
    }
  };

  const openProject = async (project: ProjectHistoryItem) => {
    workspaceReadyRef.current = false;
    window.clearTimeout(historyTimerRef.current);
    pendingHistoryRef.current = null;
    applyingHistoryRef.current = false;
    historyRef.current = { past: [], present: null, future: [] };
    setDraftStatus("loading");
    setNotice({tone: "info", text: `正在打开 ${project.name}…`});
    try {
      const response = await fetch("/api/open-project", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: project.id}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "项目打开失败");
      const snapshot = data.snapshot as ProjectSnapshot;
      const restoredDuration =
        Number(snapshot.videoDuration) > 0
          ? Number(snapshot.videoDuration)
          : 6;
      const restoredVideoUrl = snapshot.videoUrl
        ? `${snapshot.videoUrl.split("?")[0]}?t=${Date.now()}`
        : "";
      setActiveProjectId(project.id);
      setProjectName(snapshot.name || project.name);
      setActiveComponentId(data.activeComponentId ?? "");
      setVideoName(snapshot.videoName ?? "尚未导入视频");
      setVideoUrl(restoredVideoUrl);
      setVideoDuration(restoredDuration);
      const restoredVideoTracks = Array.isArray(snapshot.videoTracks)
        ? snapshot.videoTracks
        : [];
      const trackTimestamp = Date.now();
      const normalizedVideoTracks =
        restoredVideoTracks.length > 0
          ? restoredVideoTracks.map((track, trackIndex) =>
              restoreVideoTrack(
                track,
                {
                  name: snapshot.videoName ?? "已导入视频",
                  url: restoredVideoUrl,
                  durationInFrames: Math.round(restoredDuration * 30),
                },
                trackTimestamp,
                trackIndex,
              ),
            )
          : restoredVideoUrl
            ? [
                restoreVideoTrack(
                  {},
                  {
                    name: snapshot.videoName ?? "已导入视频",
                    url: restoredVideoUrl,
                    durationInFrames: Math.round(restoredDuration * 30),
                  },
                  trackTimestamp,
                  0,
                ),
              ]
            : [];
      if (normalizedVideoTracks.length > 0) {
        setVideoTracks(preventLaneOverlaps(normalizedVideoTracks));
        setSelectedVideoTrackId(normalizedVideoTracks[0].id);
        setVideoPreviewEnabled(true);
      } else {
        setVideoTracks([]);
        setSelectedVideoTrackId("");
        setVideoPreviewEnabled(false);
      }
      setTheme(snapshot.theme === "light" ? "light" : "dark");
      setCanvasOrientation(
        snapshot.canvasOrientation === "portrait" ? "portrait" : "landscape",
      );
      setSafetyGuideVisible(snapshot.safetyGuideVisible !== false);
      setSolidBackgroundEnabled(
        snapshot.solidBackgroundEnabled !== false,
      );
      setSoundEnabled(snapshot.soundEnabled !== false);
      setTimelineHeight(
        Number(snapshot.timelineHeight) >= 180
          ? Number(snapshot.timelineHeight)
          : 230,
      );
      setTrackHeights(snapshot.trackHeights ?? {});
      setResourceTracks(
        Array.isArray(snapshot.resourceTracks)
          ? preventLaneOverlaps(
              ensureUniqueResourceTrackIds(
                snapshot.resourceTracks
                  .filter(isSupportedResourceTrack)
                  .map((track, index) =>
                    restoreResourceTrack(
                      track,
                      normalizedVideoTracks.length + index,
                    ),
                  ),
              ),
            )
          : [],
      );
      await loadModuleUrl(data.moduleUrl, {
        sourceIncludesVideo: Boolean(
          data.sourceIncludesVideo ?? snapshot.sourceIncludesVideo,
        ),
        componentName: snapshot.componentName ?? project.componentName,
        totalFrames: Math.round(restoredDuration * 30),
        restoredInstances: snapshot.instances ?? [],
        restoredFrame: snapshot.currentFrame ?? 0,
      });
      const restoredFrame = Math.max(0, Number(snapshot.currentFrame) || 0);
      window.requestAnimationFrame(() =>
        playerRef.current?.seekTo(restoredFrame),
      );
      workspaceReadyRef.current = true;
      setDraftStatus("saved");
      setNotice({tone: "ok", text: `已打开项目 ${snapshot.name}。`});
    } catch (error) {
      workspaceReadyRef.current = true;
      setDraftStatus("error");
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "项目打开失败",
      });
    }
  };

  const updateInstance = useCallback(
    (
      instanceId: string,
      updater: (instance: MotionInstance) => MotionInstance,
    ) => {
      setInstances((current) =>
        current.map((instance) =>
          instance.id === instanceId ? updater(instance) : instance,
        ),
      );
    },
    [],
  );

  const pendingPreviewInspectorInstance =
    arrangementPreviewWindow &&
    !arrangementPreviewWindow.closed &&
    selectedPendingPreviewInstance
      ? selectedPendingPreviewInstance
      : null;
  const inspectorInstance = pendingPreviewInspectorInstance ?? selectedInstance;
  const inspectorDefinition = inspectorInstance
    ? definitionMap.get(inspectorInstance.componentId) ?? null
    : null;
  const updateInspectorInstance = useCallback(
    (
      instanceId: string,
      updater: (instance: MotionInstance) => MotionInstance,
    ) => {
      if (pendingPreviewInspectorInstance?.id === instanceId) {
        setPendingArrangement((current) =>
          current
            ? markPendingArrangementQualityChecksStale({
                ...current,
                motionInstances: current.motionInstances.map((instance) =>
                  instance.id === instanceId ? updater(instance) : instance,
                ),
              })
            : current,
        );
        return;
      }
      updateInstance(instanceId, updater);
    },
    [pendingPreviewInspectorInstance, updateInstance],
  );

  const addInstance = (componentId: string) => {
    const definition = definitionMap.get(componentId);
    if (!definition) return;
    const instance = createInstance(
      definition,
      currentFrame,
      Math.max(durationInFrames, currentFrame + definition.durationInFrames),
      {
        position: getRegisteredEffectPosition(definition, canvasOrientation),
        // 新效果插入到轨道列表最上方（最小序号），同时位于预览图层最前面
        trackOrder:
          Math.min(
            0,
            ...videoTracks.map((track) => track.trackOrder),
            ...instances.map((candidate) => candidate.trackOrder),
            ...resourceTracks.map((track) => track.trackOrder),
          ) - 1,
      },
    );
    setInstances((current) => [...current, instance]);
    setManualTimelineEndFrame((current) =>
      Math.max(current, instance.startFrame + instance.durationInFrames),
    );
    selectOnlyInstance(instance.id);
    setNotice({ tone: "ok", text: `已添加 ${definition.name} 到时间轴。` });
  };

  const addIconResource = (icon: IconResource) => {
    const id = createResourceTrackId();
    const iconSize = canvasOrientation === "portrait" ? 168 : 132;
    const clipDuration = Math.max(3, Math.round(fps * 3));
    const track: ResourceTrack = {
      id,
      laneId: id,
      trackOrder:
        Math.min(
          0,
          ...videoTracks.map((candidate) => candidate.trackOrder),
          ...instances.map((candidate) => candidate.trackOrder),
          ...resourceTracks.map((candidate) => candidate.trackOrder),
        ) - 1,
      kind: "icon",
      resourceId: icon.id,
      name: icon.label,
      url: icon.url,
      mimeType: icon.mimeType || "image/svg+xml",
      sourceStartFrame: 0,
      sourceDurationInFrames: clipDuration,
      startFrame: currentFrame,
      durationInFrames: clipDuration,
      visible: true,
      position: {
        x: Math.round((canvasWidth - iconSize) / 2),
        y: canvasOrientation === "portrait" ? 250 : 110,
        width: iconSize,
        height: iconSize,
        scale: 1,
        zIndex: 20,
      },
      volume: 1,
      voiceDucking: 0,
    };
    setResourceTracks((current) => [...current, track]);
    selectResourceTrack(track.id);
    setManualTimelineEndFrame((current) =>
      Math.max(current, track.startFrame + track.durationInFrames),
    );
    setNotice({ tone: "ok", text: `已添加图标“${icon.label}”到时间轴。` });
  };

  const addSfxResource = (sound: SoundResource) => {
    const id = createResourceTrackId();
    const sourceDurationInFrames = Math.max(
      3,
      Math.round((sound.durationSeconds ?? 1) * fps),
    );
    const track: ResourceTrack = {
      id,
      laneId: id,
      trackOrder:
        Math.min(
          0,
          ...videoTracks.map((candidate) => candidate.trackOrder),
          ...instances.map((candidate) => candidate.trackOrder),
          ...resourceTracks.map((candidate) => candidate.trackOrder),
        ) - 1,
      kind: "sfx",
      resourceId: sound.id,
      name: sound.label,
      url: sound.url,
      mimeType: sound.mimeType || "audio/wav",
      sourceStartFrame: 0,
      sourceDurationInFrames,
      startFrame: currentFrame,
      durationInFrames: sourceDurationInFrames,
      visible: true,
      position: {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        scale: 1,
        zIndex: 0,
      },
      volume: 0.55,
      voiceDucking: 0,
    };
    setResourceTracks((current) => [...current, track]);
    selectResourceTrack(track.id);
    setManualTimelineEndFrame((current) =>
      Math.max(current, track.startFrame + track.durationInFrames),
    );
    setNotice({ tone: "ok", text: `已添加音效“${sound.label}”到时间轴。` });
  };

  const toggleCanvasOrientation = () => {
    const nextOrientation =
      canvasOrientation === "landscape" ? "portrait" : "landscape";
    setCanvasOrientation(nextOrientation);
    setInstances((current) =>
      current.map((instance) => {
        const definition = definitionMap.get(instance.componentId);
        if (!definition || !EFFECT_REGISTRY_BY_ID.has(instance.componentId)) {
          return instance;
        }
        return {
          ...instance,
          position: getRegisteredEffectPosition(definition, nextOrientation),
        };
      }),
    );
  };

  const openVideoPicker = () => videoInput.current?.click();

  const openAiArrangement = () => {
    if (srtGenerating) return;
    setAiArrangementError("");
    setSrtDialogOpen(true);
    if (srtEntries.length === 0) {
      setAiArrangementStage("idle");
      return;
    }
    void generateSrtTimeline(srtEntries, srtFileName);
  };

  const openSrtPicker = () => srtInput.current?.click();

  const handleSrtFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSrtDialogOpen(true);
    setSrtGenerating(true);
    setAiArrangementStage("reading");
    setAiArrangementError("");
    setSrtResult(null);
    try {
      const content = await file.text();
      const entries = parseSrt(content);
      if (entries.length === 0) {
        throw new Error("SRT 解析失败：没有识别到有效字幕条目。");
      }
      setSrtFileName(file.name);
      setSrtEntries(entries);
      setNotice({
        tone: "ok",
        text: `已读取 ${file.name}：${entries.length} 条字幕，正在自动编排。`,
      });
      setSrtGenerating(false);
      await generateSrtTimeline(entries, file.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SRT 文件读取失败";
      setAiArrangementError(message);
      setNotice({
        tone: "error",
        text: message,
      });
      setSrtGenerating(false);
    }
  };

  async function generateSrtTimeline(
    entriesOverride: SrtEntry[] = srtEntries,
    fileNameOverride = srtFileName,
  ) {
    if (entriesOverride.length === 0) {
      setNotice({ tone: "info", text: "请先选择一个 SRT 文件。" });
      return;
    }
    const showStage = async (stage: Exclude<AiArrangementStage, "idle">) => {
      setAiArrangementStage(stage);
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    };
    setSrtDialogOpen(true);
    setSrtGenerating(true);
    setAiArrangementError("");
    setSrtResult(null);
    try {
      await showStage("analyzing");
      const semanticComponentIds =
        canvasOrientation === "portrait"
          ? PORTRAIT_ROUTE_COMPONENT_IDS
          : AI_ARRANGEABLE_COMPONENT_IDS;
      const arrangeableComponentIds = semanticComponentIds.filter(
        (componentId) => definitionMap.has(componentId),
      );
      if (arrangeableComponentIds.length === 0) {
        throw new Error("当前效果库没有已开放给 AI 编排的真实组件。");
      }
      const resourceResponse = await fetch("/input/resource-index.json", {
        cache: "no-store",
      });
      if (!resourceResponse.ok) throw new Error("无法读取固定资源索引。");
      const resourceIndex = await resourceResponse.json();
      const canvas =
        canvasOrientation === "portrait"
          ? { width: 1080, height: 1920, orientation: "portrait" }
          : { width: 1920, height: 1080, orientation: "landscape" };
      const semanticTimeline = buildSemanticSrtArrangement({
        entries: entriesOverride,
        fps,
        durationInFrames,
        canvas,
        availableComponentIds: arrangeableComponentIds,
        componentCapabilities: arrangeableComponentIds.flatMap((componentId) => {
          const definition = EFFECT_REGISTRY_BY_ID.get(componentId);
          return definition
            ? [{ componentId, semantic: definition.semantic }]
            : [];
        }),
        resourceIndex,
        componentPreferenceScores: arrangementPreferences.componentScores,
      });
      const analysis = semanticTimeline.semanticAnalysis;
      const captionDefinition = definitionMap.get("SrtSemanticCaptions");
      if (!captionDefinition) {
        throw new Error("当前效果库缺少 SRT字幕语义动画，无法生成真实字幕轨道。");
      }
      const componentDefinitions = arrangeableComponentIds.flatMap((componentId) => {
        const definition = definitionMap.get(componentId);
        return definition ? [definition] : [];
      });
      await showStage("layout");
      const arrangedTimeline = applyAvoidanceLayout({
        timeline: semanticTimeline,
        canvas,
        componentDefinitions,
        includeFace: true,
        includeCaptions: true,
      });
      await showStage("quality");
      const checkedTimeline = runTimelineQualityControl({
        timeline: arrangedTimeline,
        canvas,
        componentDefinitions,
        resourceIndex,
        includeFace: true,
        includeCaptions: true,
      });
      const srtEndSeconds = Math.max(
        ...entriesOverride.map((entry) => entry.endMs),
      ) / 1000;
      const srtEndFrame = Math.max(3, Math.ceil(srtEndSeconds * fps));
      const cueAnalyses = Array.isArray(analysis.cueAnalyses)
        ? analysis.cueAnalyses
        : [];
      const semanticSourcesBySegment = Object.fromEntries(
        cueAnalyses.flatMap((rawCue) => {
          if (!isRecord(rawCue)) return [];
          const text = typeof rawCue.text === "string" ? rawCue.text.trim() : "";
          const sourceCueIndices = Array.isArray(rawCue.sourceCueIndices)
            ? rawCue.sourceCueIndices
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value))
            : Number.isFinite(Number(rawCue.cueIndex))
              ? [Number(rawCue.cueIndex)]
              : [];
          const intents = [
            ...(Array.isArray(rawCue.intents) ? rawCue.intents : []),
            ...(Array.isArray(rawCue.suppressedIntents)
              ? rawCue.suppressedIntents
              : []),
          ];
          return intents.flatMap((rawIntent) => {
            if (!isRecord(rawIntent) || typeof rawIntent.id !== "string") return [];
            return [
              [
                rawIntent.id,
                {
                  text,
                  sourceCueIndices,
                  semanticLabel:
                    typeof rawIntent.label === "string" ? rawIntent.label : "",
                },
              ],
            ];
          });
        }),
      );
      const captionCues = entriesOverride.map((entry) => {
        const cueAnalysis = cueAnalyses.find((rawCue) => {
          if (!isRecord(rawCue)) return false;
          if (Number(rawCue.cueIndex) === entry.index) return true;
          return (
            Array.isArray(rawCue.sourceCueIndices) &&
            rawCue.sourceCueIndices.some(
              (sourceIndex) => Number(sourceIndex) === entry.index,
            )
          );
        });
        const primaryIntent =
          isRecord(cueAnalysis) &&
          Array.isArray(cueAnalysis.intents) &&
          isRecord(cueAnalysis.intents[0])
            ? cueAnalysis.intents[0]
            : null;
        const semanticKey =
          primaryIntent && typeof primaryIntent.id === "string"
            ? getArrangementRouteId(primaryIntent.id)
            : "";
        const keywordSignal =
          primaryIntent && Array.isArray(primaryIntent.signals)
            ? primaryIntent.signals.find(
                (rawSignal) =>
                  isRecord(rawSignal) &&
                  rawSignal.type === "keyword" &&
                  typeof rawSignal.label === "string" &&
                  entry.text.includes(rawSignal.label),
              )
            : null;
        return {
          index: entry.index,
          start: entry.startMs / 1000,
          end: entry.endMs / 1000,
          text: entry.text,
          semanticKey,
          semanticLabel:
            primaryIntent && typeof primaryIntent.label === "string"
              ? primaryIntent.label
              : "",
          keyword:
            isRecord(keywordSignal) && typeof keywordSignal.label === "string"
              ? keywordSignal.label
              : "",
        };
      });
      const preferredMotionTimeline = (
        Array.isArray(checkedTimeline.motionTimeline)
          ? checkedTimeline.motionTimeline
          : []
      ).map((item) => ({
        ...item,
        props:
          arrangementPreferences.keepStyleConsistent && isRecord(item.props)
            ? applyConsistentAccent(
                item.props,
                arrangementPreferences.accentColor,
              )
            : item.props,
      }));
      const preferredResourceTracks = (
        Array.isArray(checkedTimeline.resourceTracks)
          ? checkedTimeline.resourceTracks
          : []
      ).filter(
        (track) => arrangementPreferences.autoAddIcons || track.kind !== "icon",
      );
      const timelineWithCaption = {
        ...checkedTimeline,
        motionTimeline: [
          ...preferredMotionTimeline,
          {
            componentId: "SrtSemanticCaptions",
            startFrame: 0,
            durationInFrames: srtEndFrame,
            position: getRegisteredEffectPosition(
              captionDefinition,
              canvasOrientation,
            ),
            backgroundOpacity: 0,
            props: {
              enabled: true,
              showIcon: false,
              cuesJson: JSON.stringify(captionCues),
              timeOffset: 0,
            },
            sourceExpressionId: SRT_CAPTION_TRACK_ID,
            sourceIntentId: SRT_CAPTION_TRACK_ID,
          },
        ],
        resourceTracks: preferredResourceTracks,
      };
      await showStage("preview");
      const baseName = (fileNameOverride || "字幕")
        .replace(/\.srt$/i, "")
        .replace(/[\\/:*?"<>|]/g, "-");
      await importTimelineJson(
        new File(
          [JSON.stringify(timelineWithCaption)],
          `${baseName}-自动语义编排.timeline.json`,
          { type: "application/json" },
        ),
      );
      setPendingArrangement((current) =>
        current
          ? {
              ...current,
              semanticSummary: {
                cueCount: analysis.cueCount,
                semanticSegmentCount: analysis.semanticSegmentCount,
                intentCount: analysis.intentCount,
                detectedIntentCount: analysis.detectedIntentCount,
                suppressedIntentCount: analysis.suppressedIntentCount,
                motionBudget: analysis.densitySummary?.motionBudget,
                skippedCueCount: analysis.skippedCueCount,
                repeatedAvoidedCount:
                  analysis.diversitySummary?.repeatedAvoidedCount,
                supportingSuppressedCount:
                  analysis.diversitySummary?.supportingSuppressedCount,
              },
              semanticSourcesBySegment,
              layoutSummary: checkedTimeline.layoutSummary,
            }
          : current,
      );
      setSrtResult({
        cueCount: analysis.cueCount,
        semanticSegmentCount: analysis.semanticSegmentCount,
        intentCount: analysis.intentCount,
        detectedIntentCount: analysis.detectedIntentCount,
        suppressedIntentCount: analysis.suppressedIntentCount,
        motionBudget: analysis.densitySummary?.motionBudget,
        motionCount: analysis.motionCount,
        resourceCount: analysis.resourceCount,
        skippedCueCount: analysis.skippedCueCount,
        messages: analysis.messages,
      });
      if (srtEndSeconds * fps > durationInFrames) {
        setVideoDuration((current) => Math.max(current, srtEndSeconds + 1));
      }
      setSrtDialogOpen(false);
      setNotice({
        tone: "info",
        text: `已识别 ${analysis.detectedIntentCount ?? analysis.intentCount} 个语义意图，密度筛选后 ${analysis.intentCount} 个进入预览；时间线尚未修改。`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "语义编排生成失败";
      setAiArrangementError(message);
      setNotice({
        tone: "error",
        text: message,
      });
    } finally {
      setSrtGenerating(false);
    }
  }

  const handleVideoFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await importVideo(file);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "视频导入失败",
      });
    }
  };

  const removeVideoTrack = async (trackId: string) => {
    const removed = videoTracks.find((track) => track.id === trackId);
    const remainingTracks = videoTracks.filter((track) => track.id !== trackId);
    if (!removed) return;
    const removedUrl = removed.url.split("?")[0];
    const stillReferenced = remainingTracks.some(
      (track) => track.url.split("?")[0] === removedUrl,
    );
    let mediaAlreadyMissing = false;
    if (!stillReferenced) {
      try {
        const response = await fetch(removedUrl, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "本地视频文件删除失败");
        }
        mediaAlreadyMissing = data.alreadyDeleted === true;
      } catch (error) {
        setNotice({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "本地视频文件删除失败，已保留轨道。",
        });
        return;
      }
    }
    setVideoTracks(remainingTracks);
    setSelectedVideoTrackId((selected) =>
      selected === trackId ? (remainingTracks[0]?.id ?? "") : selected,
    );
    if (videoUrl.split("?")[0] === removedUrl) {
      setVideoUrl(remainingTracks[0]?.url ?? "");
      setVideoName(remainingTracks[0]?.name ?? "尚未导入视频");
    }
    if (videoTracks.length === 1) {
      setVideoUrl("");
      setVideoPreviewEnabled(false);
      setVideoName("尚未导入视频");
      setVideoDuration(6);
      setManualTimelineEndFrame(0);
    }
    setContextMenu(null);
    setNotice({
      tone: "ok",
      text: stillReferenced
        ? "已删除该视频轨道；本地文件仍由其他片段使用。"
        : mediaAlreadyMissing
          ? "已移除失效视频轨道；本地媒体文件此前已删除。"
          : "已删除该视频轨道，并清理本地视频文件。",
    });
  };

  const clearAllTimelineTracks = async () => {
    if (
      videoTracks.length === 0 &&
      instances.length === 0 &&
      resourceTracks.length === 0
    ) {
      setNotice({ tone: "info", text: "时间轴已经是空的。" });
      return;
    }
    const mediaUrls = [
      ...new Set(
        videoTracks
          .map((track) => track.url.split("?")[0])
          .filter(Boolean),
      ),
    ];
    for (const url of mediaUrls) {
      try {
        await fetch(url, { method: "DELETE" });
      } catch {
        // 单个本地媒体清理失败不阻塞清空
      }
    }
    setVideoTracks([]);
    setInstances([]);
    setResourceTracks([]);
    setSelectedVideoTrackId("");
    setSelectedResourceTrackId("");
    setSelectedInstanceId("");
    setSelectedInstanceIds([]);
    setActiveArrangementBatchId("");
    setActiveArrangementIntentId("");
    setVideoUrl("");
    setVideoPreviewEnabled(false);
    setVideoName("尚未导入视频");
    setVideoDuration(6);
    setManualTimelineEndFrame(0);
    seekEditorFrame(0);
    setContextMenu(null);
    setNotice({
      tone: "ok",
      text: mediaUrls.length
        ? "已清空时间轴所有轨道，并清理本地视频文件。"
        : "已清空时间轴所有轨道。",
    });
  };

  const toggleVideoTrackVisibility = useCallback((trackId: string) => {
    setVideoTracks((current) => {
      const selected = current.find((track) => track.id === trackId);
      if (!selected) return current;
      const laneClips = current.filter((track) => track.laneId === selected.laneId);
      const shouldShow = laneClips.every((track) => track.visible === false);
      return current.map((track) =>
        track.laneId === selected.laneId
          ? { ...track, visible: shouldShow }
          : track,
      );
    });
  }, []);

  const toggleMotionTrackVisibility = useCallback((instanceIds: string[]) => {
    if (instanceIds.length === 0) return;
    const idSet = new Set(instanceIds);
    setInstances((current) => {
      const laneIds = new Set(
        current
          .filter((instance) => idSet.has(instance.id))
          .map((instance) => instance.laneId),
      );
      const selectedTracks = current.filter((instance) =>
        laneIds.has(instance.laneId),
      );
      const shouldShow = selectedTracks.every(
        (instance) => instance.visible === false,
      );
      return current.map((instance) =>
        laneIds.has(instance.laneId)
          ? { ...instance, visible: shouldShow }
          : instance,
      );
    });
  }, []);

  const toggleResourceTrackVisibility = useCallback((trackId: string) => {
    setResourceTracks((current) => {
      const selected = current.find((track) => track.id === trackId);
      if (!selected) return current;
      const laneClips = current.filter((track) => track.laneId === selected.laneId);
      const shouldShow = laneClips.every((track) => track.visible === false);
      return current.map((track) =>
        track.laneId === selected.laneId
          ? { ...track, visible: shouldShow }
          : track,
      );
    });
  }, []);

  const updateResourceTrack = useCallback(
    (
      trackId: string,
      updater: (track: ResourceTrack) => ResourceTrack,
    ) => {
      setResourceTracks((current) =>
        current.map((track) => (track.id === trackId ? updater(track) : track)),
      );
    },
    [],
  );

  const deleteResourceTrack = useCallback((trackId: string) => {
    setResourceTracks((current) => current.filter((track) => track.id !== trackId));
    setSelectedResourceTrackId((selected) => (selected === trackId ? "" : selected));
    setContextMenu(null);
    setNotice({ tone: "ok", text: "已删除资源轨道项。" });
  }, []);

  const reorderTimelineLane = useCallback(
    (
      draggedLaneId: string,
      targetLaneId: string,
      placement: "before" | "after" = "after",
    ) => {
      if (!draggedLaneId || draggedLaneId === targetLaneId) return;
      const laneIds = timelineLanes.map((lane) => lane.laneId);
      const fromIndex = laneIds.indexOf(draggedLaneId);
      const targetIndex = laneIds.indexOf(targetLaneId);
      if (fromIndex < 0 || targetIndex < 0) return;
      laneIds.splice(fromIndex, 1);
      let insertIndex = targetIndex;
      if (fromIndex < targetIndex && placement === "before") {
        insertIndex = Math.max(0, targetIndex - 1);
      } else if (fromIndex > targetIndex && placement === "after") {
        insertIndex = targetIndex + 1;
      }
      insertIndex = clamp(insertIndex, 0, laneIds.length);
      laneIds.splice(insertIndex, 0, draggedLaneId);
      const orderByLane = new Map(
        laneIds.map((laneId, index) => [laneId, index]),
      );
      setVideoTracks((current) =>
        current
          .map((track) => ({
            ...track,
            trackOrder: orderByLane.get(track.laneId) ?? track.trackOrder,
          }))
          .sort((a, b) => a.trackOrder - b.trackOrder),
      );
      setInstances((current) =>
        current
          .map((instance) => ({
            ...instance,
            trackOrder:
              orderByLane.get(instance.laneId) ?? instance.trackOrder,
          }))
          .sort((a, b) => a.trackOrder - b.trackOrder),
      );
      setResourceTracks((current) =>
        current
          .map((track) => ({
            ...track,
            trackOrder: orderByLane.get(track.laneId) ?? track.trackOrder,
          }))
          .sort((a, b) => a.trackOrder - b.trackOrder),
      );
      setNotice({ tone: "ok", text: "轨道顺序已调整。" });
    },
    [timelineLanes],
  );

  const computeLaneDropTarget = useCallback(
    (clientX: number, clientY: number, draggedLaneId: string) => {
      const all = Array.from(
        document.querySelectorAll<HTMLElement>("[data-lane-id]"),
      );
      if (all.length < 2) return null;

      const lanes = all
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            laneId: el.dataset.laneId!,
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            center: rect.top + rect.height / 2,
          };
        })
        .sort((a, b) => a.top - b.top);

      const draggedIndex = lanes.findIndex((l) => l.laneId === draggedLaneId);
      if (draggedIndex < 0) return null;

      // 找光标 Y 最接近的那条轨道，按其中心线决定插入前/后。
      // 落点区域是半个轨道高度，上下方向对称，也能一次跨越多条轨道。
      let closestIndex = -1;
      let closestDistance = Infinity;
      for (let i = 0; i < lanes.length; i++) {
        if (i === draggedIndex) continue;
        const distance = Math.abs(clientY - lanes[i].center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }
      if (closestIndex < 0) return null;

      const target = lanes[closestIndex];
      const placement = clientY < target.center ? "before" : "after";
      return { targetLaneId: target.laneId, placement };
    },
    [],
  );

  const beginLaneGesture = (
    event: React.PointerEvent<HTMLDivElement>,
    laneId: string,
  ) => {
    if ((event.target as HTMLElement).closest("button")) return;
    laneGestureRef.current = {
      laneId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      resolved: "none",
    };
  };

  useEffect(() => {
    const arbitrateLaneGesture = (event: PointerEvent) => {
      const gesture = laneGestureRef.current;
      if (
        !gesture ||
        event.pointerId !== gesture.pointerId ||
        gesture.resolved !== "none"
      )
        return;
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // 纵向主导 → 升级为轨道换位，同时取消片段的水平拖拽
        gesture.resolved = "vertical";
        videoTimelineDragState.current = null;
        resourceTimelineDragState.current = null;
        timelineDragState.current = null;
        draggedLaneIdRef.current = gesture.laneId;
        laneReorderPointerRef.current = {
          laneId: gesture.laneId,
          pointerId: gesture.pointerId,
        };
        setLaneDrop({
          draggedLaneId: gesture.laneId,
          targetLaneId: gesture.laneId,
          placement: "after",
        });
      } else {
        // 横向主导 → 片段时间拖拽，手势结束
        gesture.resolved = "horizontal";
        laneGestureRef.current = null;
      }
    };
    const clearLaneGesture = (event: PointerEvent) => {
      const gesture = laneGestureRef.current;
      if (gesture && event.pointerId === gesture.pointerId) {
        laneGestureRef.current = null;
      }
    };
    const moveLaneReorder = (event: PointerEvent) => {
      arbitrateLaneGesture(event);
      const state = laneReorderPointerRef.current;
      if (!state || event.pointerId !== state.pointerId) return;
      const drop = computeLaneDropTarget(
        event.clientX,
        event.clientY,
        state.laneId,
      );
      if (!drop) {
        setLaneDrop((current) =>
          current?.draggedLaneId === state.laneId
            ? { draggedLaneId: state.laneId, targetLaneId: state.laneId, placement: "after" }
            : current,
        );
        return;
      }
      setLaneDrop({
        draggedLaneId: state.laneId,
        targetLaneId: drop.targetLaneId,
        placement: drop.placement,
      });
    };
    const finishLaneReorder = (event: PointerEvent) => {
      clearLaneGesture(event);
      const state = laneReorderPointerRef.current;
      if (!state || event.pointerId !== state.pointerId) return;
      const drop = computeLaneDropTarget(
        event.clientX,
        event.clientY,
        state.laneId,
      );
      if (drop) {
        reorderTimelineLane(state.laneId, drop.targetLaneId, drop.placement);
      }
      draggedLaneIdRef.current = "";
      laneReorderPointerRef.current = null;
      setLaneDrop(null);
    };
    const cancelLaneReorder = (event: PointerEvent) => {
      clearLaneGesture(event);
      draggedLaneIdRef.current = "";
      laneReorderPointerRef.current = null;
      setLaneDrop(null);
    };
    window.addEventListener("pointermove", moveLaneReorder);
    window.addEventListener("pointerup", finishLaneReorder);
    window.addEventListener("pointercancel", cancelLaneReorder);
    return () => {
      window.removeEventListener("pointermove", moveLaneReorder);
      window.removeEventListener("pointerup", finishLaneReorder);
      window.removeEventListener("pointercancel", cancelLaneReorder);
    };
  }, [reorderTimelineLane, computeLaneDropTarget]);

  const splitSelectedTracks = (instanceIds: string[]) => {
    const minFrames = Math.max(3, Math.round(fps * 0.1));
    if (selectedVideoTrackId) {
      const track = videoTracks.find(
        (candidate) => candidate.id === selectedVideoTrackId,
      );
      if (
        !track ||
        currentFrame - track.startFrame < minFrames ||
        track.startFrame + track.durationInFrames - currentFrame < minFrames
      ) {
        setNotice({ tone: "info", text: "请把播放头放在视频片段内再按 W 分割。" });
        return;
      }
      const leftDuration = currentFrame - track.startFrame;
      const rightTrack: VideoTrack = {
        ...track,
        id: createVideoTrackId(),
        startFrame: currentFrame,
        sourceStartFrame: track.sourceStartFrame + leftDuration,
        durationInFrames: track.durationInFrames - leftDuration,
      };
      setVideoTracks((current) =>
        current.flatMap((candidate) =>
          candidate.id === track.id
            ? [{ ...candidate, durationInFrames: leftDuration }, rightTrack]
            : [candidate],
        ),
      );
      setSelectedVideoTrackId(rightTrack.id);
      setNotice({ tone: "ok", text: `已在 ${formatTime(currentFrame / fps)} 分割视频轨道。` });
      return;
    }

    const idSet = new Set(instanceIds);
    const createdIds: string[] = [];
    let splitCount = 0;
    const nextInstances = instances.flatMap((instance) => {
        if (!idSet.has(instance.id)) return [instance];
        const leftDuration = currentFrame - instance.startFrame;
        const rightDuration =
          instance.startFrame + instance.durationInFrames - currentFrame;
        if (leftDuration < minFrames || rightDuration < minFrames) {
          return [instance];
        }
        const rightId = createInstanceId(instance.componentId);
        createdIds.push(rightId);
        splitCount += 1;
        return [
          { ...instance, durationInFrames: leftDuration },
          {
            ...instance,
            id: rightId,
            startFrame: currentFrame,
            sourceStartFrame: instance.sourceStartFrame + leftDuration,
            durationInFrames: rightDuration,
            props: { ...instance.props },
          },
        ];
      });
    if (splitCount === 0) {
      setNotice({ tone: "info", text: "请把播放头放在所选动效片段内再按 W 分割。" });
      return;
    }
    setInstances(nextInstances);
    setSelectedInstanceIds(createdIds);
    setSelectedInstanceId(createdIds.at(-1) ?? "");
    setNotice({ tone: "ok", text: `已分割 ${splitCount} 条动效轨道。` });
  };

  const trimSelectedTracks = (
    direction: "left" | "right",
    instanceIds: string[],
  ) => {
    const minFrames = Math.max(3, Math.round(fps * 0.1));
    if (selectedVideoTrackId) {
      const track = videoTracks.find(
        (candidate) => candidate.id === selectedVideoTrackId,
      );
      if (
        !track ||
        currentFrame - track.startFrame < minFrames ||
        track.startFrame + track.durationInFrames - currentFrame < minFrames
      ) {
        setNotice({ tone: "info", text: `请把播放头放在视频片段内再按 ${direction === "left" ? "Q" : "E"}。` });
        return;
      }
      setVideoTracks((current) =>
        current.map((candidate) => {
          if (candidate.id !== track.id) return candidate;
          if (direction === "left") {
            const removedFrames = currentFrame - candidate.startFrame;
            return {
              ...candidate,
              startFrame: currentFrame,
              sourceStartFrame: candidate.sourceStartFrame + removedFrames,
              durationInFrames: candidate.durationInFrames - removedFrames,
            };
          }
          return {
            ...candidate,
            durationInFrames: currentFrame - candidate.startFrame,
          };
        }),
      );
      setNotice({ tone: "ok", text: `已向${direction === "left" ? "左" : "右"}裁剪视频轨道。` });
      return;
    }

    const idSet = new Set(instanceIds);
    let trimmedCount = 0;
    const nextInstances = instances.map((instance) => {
        if (!idSet.has(instance.id)) return instance;
        const leftDuration = currentFrame - instance.startFrame;
        const rightDuration =
          instance.startFrame + instance.durationInFrames - currentFrame;
        if (leftDuration < minFrames || rightDuration < minFrames) {
          return instance;
        }
        trimmedCount += 1;
        if (direction === "left") {
          return {
            ...instance,
            startFrame: currentFrame,
            sourceStartFrame: instance.sourceStartFrame + leftDuration,
            durationInFrames: rightDuration,
          };
        }
        return { ...instance, durationInFrames: leftDuration };
      });
    if (trimmedCount > 0) setInstances(nextInstances);
    setNotice({
      tone: trimmedCount > 0 ? "ok" : "info",
      text:
        trimmedCount > 0
          ? `已向${direction === "left" ? "左" : "右"}裁剪 ${trimmedCount} 条动效轨道。`
          : `请把播放头放在所选动效片段内再按 ${direction === "left" ? "Q" : "E"}。`,
    });
  };

  const importVideo = async (file: File) => {
    setNotice({ tone: "info", text: "正在复制视频到本地工作区…" });
    const metadataUrl = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = metadataUrl;
    await new Promise<void>((resolve, reject) => {
      probe.onloadedmetadata = () => resolve();
      probe.onerror = () => reject(new Error("浏览器无法读取该视频"));
    });
    const duration = Number.isFinite(probe.duration) ? probe.duration : 6;
    URL.revokeObjectURL(metadataUrl);
    const response = await fetch("/api/upload-video", {
      method: "POST",
      headers: {
        "X-File-Name": encodeURIComponent(file.name),
        "X-Video-Duration": String(duration),
      },
      body: file,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "视频导入失败");
    const trackId = createVideoTrackId();
    const track: VideoTrack = {
      id: trackId,
      laneId: trackId,
      trackOrder:
        Math.max(
          -1,
          ...videoTracks.map((candidate) => candidate.trackOrder),
          ...instances.map((candidate) => candidate.trackOrder),
          ...resourceTracks.map((candidate) => candidate.trackOrder),
        ) + 1,
      name: file.name,
      url: data.videoUrl,
      startFrame: 0,
      sourceStartFrame: 0,
      sourceDurationInFrames: Math.max(3, Math.round(duration * fps)),
      durationInFrames: Math.max(3, Math.round(duration * fps)),
      visible: true,
    };
    setVideoTracks((current) => [...current, track]);
    setSelectedVideoTrackId(track.id);
    setVideoPreviewEnabled(true);
    if (videoTracks.length === 0) {
      setVideoUrl(data.videoUrl);
    }
    setVideoDuration((current) => Math.max(current, duration));
    setVideoName(file.name);
    setNotice({
      tone: "ok",
      text: `已导入 ${file.name}，时长 ${duration.toFixed(2)} 秒，已添加为视频轨道。`,
    });
  };

  const importComponent = async (
    file: File,
    options?: { appendToTimeline?: boolean },
  ) => {
    const code = await file.text();
    setNotice({ tone: "info", text: "正在进行安全校验并编译组件清单…" });
    const response = await fetch("/api/import-component", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, code }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "组件导入失败");
    setActiveComponentId(data.activeComponentId ?? "");
    const appendToTimeline = options?.appendToTimeline === true;
    await loadModuleUrl(
      data.moduleUrl,
      appendToTimeline
        ? {
            sourceIncludesVideo: Boolean(data.sourceIncludesVideo),
            componentName: file.name,
            totalFrames: durationInFrames,
            appendComponentId: String(data.activeComponentId ?? ""),
            appendStartFrame: currentFrame,
            appendTrackOrder:
              Math.min(
                0,
                ...videoTracks.map((track) => track.trackOrder),
                ...instances.map((candidate) => candidate.trackOrder),
                ...resourceTracks.map((track) => track.trackOrder),
              ) - 1,
            appendOrientation: canvasOrientation,
          }
        : {
            sourceIncludesVideo: Boolean(data.sourceIncludesVideo),
            componentName: file.name,
            totalFrames: durationInFrames,
          },
    );
    await refreshHistory();
    setNotice({
      tone: "ok",
      text: appendToTimeline
        ? `已将 ${file.name} 导入到时间轴。`
        : `已加载 ${file.name}，识别到组件清单和预设时间轴。`,
    });
  };

  const importIcon = async (file: File) => {
    if (file.size > 512 * 1024) {
      throw new Error("SVG 图标不能超过 512 KB。");
    }
    const category = iconImportCategoryRef.current || "内容与素材";
    setNotice({ tone: "info", text: `正在导入“${file.name}”…` });
    const response = await fetch("/api/import-icon", {
      method: "POST",
      headers: {
        "Content-Type": "image/svg+xml",
        "X-File-Name": encodeURIComponent(file.name),
        "X-Icon-Category": encodeURIComponent(category),
      },
      body: file,
    });
    const data = await response.json();
    if (!response.ok || !data?.icon) {
      throw new Error(data?.error ?? "图标导入失败");
    }
    const icon = data.icon as IconResource;
    setIconResources((current) => [
      ...current.filter((item) => item.id !== icon.id),
      icon,
    ]);
    setArrangementResourceLibrary((current) => ({
      ...current,
      icon: [
        ...current.icon.filter((item) => item.id !== icon.id),
        icon,
      ],
    }));
    setOpenIconCategories((current) =>
      current.includes(icon.category) ? current : [...current, icon.category],
    );
    setIconSearch("");
    setNotice({ tone: "ok", text: `已将“${icon.label}”导入“${icon.category}”。` });
  };

  const importSfx = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      throw new Error("音效文件不能超过 25 MB。");
    }
    setNotice({ tone: "info", text: `正在导入音效“${file.name}”…` });
    const response = await fetch("/api/import-sfx", {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "X-File-Name": encodeURIComponent(file.name),
      },
      body: file,
    });
    const data = await response.json();
    if (!response.ok || !data?.sound) {
      throw new Error(data?.error ?? "音效导入失败");
    }
    const rawSound = data.sound as SoundResource & {
      media?: { durationSeconds?: number };
    };
    const sound: SoundResource = {
      ...rawSound,
      ...(Number.isFinite(Number(rawSound.media?.durationSeconds))
        ? { durationSeconds: Number(rawSound.media?.durationSeconds) }
        : {}),
    };
    setArrangementResourceLibrary((current) => ({
      ...current,
      sfx: [...current.sfx.filter((item) => item.id !== sound.id), sound],
    }));
    setSfxSearch("");
    setNotice({ tone: "ok", text: `已将“${sound.label}”加入音效库。` });
  };

  const importCodeTemplate = async () => {
    const code = codeTemplate.trim();
    if (!code) throw new Error("请先输入 TSX / React 代码。");
    const safeName = codeTemplateName.trim() || "我的代码动效";
    await importComponent(
      new File([code], `${safeName.replace(/[\\/:*?"<>|]/g, "-")}.tsx`, {
        type: "text/plain",
      }),
      { appendToTimeline: true },
    );
    setActiveWorkspace("editor");
  };

  const beginCodeEditorResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = codeEditorHeight;
    const resize = (moveEvent: PointerEvent) => {
      const maxHeight = Math.max(220, window.innerHeight - 245);
      setCodeEditorHeight(
        clamp(startHeight + moveEvent.clientY - startY, 160, maxHeight),
      );
    };
    const finish = () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const importTimelineJson = async (file: File) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error("JSON 格式无效，无法读取编排内容。");
    }
    const parsedRecord = isRecord(parsed) ? parsed : null;
    const semanticAnalysis = isRecord(parsedRecord?.semanticAnalysis)
      ? parsedRecord.semanticAnalysis
      : null;
    const componentCandidatesBySegment = Object.fromEntries(
      (Array.isArray(semanticAnalysis?.cueAnalyses)
        ? semanticAnalysis.cueAnalyses
        : []
      ).flatMap((rawCue) => {
        if (!isRecord(rawCue) || !Array.isArray(rawCue.intents)) return [];
        return rawCue.intents.flatMap((rawIntent) => {
          if (!isRecord(rawIntent) || typeof rawIntent.id !== "string") return [];
          const candidates = Array.isArray(rawIntent.componentCandidates)
            ? rawIntent.componentCandidates.flatMap(
                (rawCandidate, candidateIndex): ArrangementComponentCandidate[] => {
                  if (!isRecord(rawCandidate)) return [];
                  const componentId = String(rawCandidate.componentId ?? "");
                  if (!definitionMap.has(componentId)) return [];
                  return [
                    {
                      componentId,
                      rank: Math.max(
                        1,
                        Math.round(
                          finiteNumber(rawCandidate.rank, candidateIndex + 1),
                        ),
                      ),
                      reason:
                        typeof rawCandidate.reason === "string"
                          ? rawCandidate.reason
                          : "适合当前语义",
                      props: isRecord(rawCandidate.props)
                        ? rawCandidate.props
                        : {},
                    },
                  ];
                },
              )
            : [];
          return candidates.length > 0 ? [[rawIntent.id, candidates]] : [];
        });
      }),
    ) as Record<string, ArrangementComponentCandidate[]>;
    const qualityControl = isRecord(parsedRecord?.qualityControl)
      ? parsedRecord.qualityControl
      : null;
    const qualityControlChecks = Array.isArray(qualityControl?.checks)
      ? qualityControl.checks
      : [];
    const normalizedQualityControlChecks = qualityControlChecks.flatMap(
      (rawCheck) => {
        if (!isRecord(rawCheck)) return [];
        const status = String(rawCheck.status ?? "pending");
        const affectedExpressionIds = Array.isArray(
          rawCheck.affectedExpressionIds,
        )
          ? rawCheck.affectedExpressionIds.filter(
              (id): id is string => typeof id === "string" && id.length > 0,
            )
          : [];
        return [
          {
            type: String(rawCheck.type ?? "unknown"),
            status: (["passed", "failed", "pending"].includes(status)
              ? status
              : "pending") as "pending" | "passed" | "failed",
            message:
              typeof rawCheck.message === "string"
                ? rawCheck.message
                : "未提供检查说明。",
            affectedExpressionIds,
          },
        ];
      },
    );
    const rawItems = Array.isArray(parsed)
      ? parsed
      : parsedRecord
        ? parsedRecord.motionTimeline ??
          parsedRecord.timeline ??
          parsedRecord.MOTION_TIMELINE ??
          parsedRecord.instances
        : undefined;
    const rawResourceItems = parsedRecord?.resourceTracks;
    const hasMotionItems = Array.isArray(rawItems) && rawItems.length > 0;
    const hasResourceItems =
      Array.isArray(rawResourceItems) && rawResourceItems.length > 0;
    const motionItems = Array.isArray(rawItems) ? rawItems : [];
    const resourceItems = Array.isArray(rawResourceItems)
      ? rawResourceItems
      : [];
    if (!hasMotionItems && !hasResourceItems) {
      throw new Error(
        "编排需包含 motionTimeline/timeline/instances 或 resourceTracks 数组。",
      );
    }
    if (hasMotionItems && definitions.length === 0) {
      throw new Error("当前没有可用效果组件，无法导入动效轨道。");
    }

    const items = motionItems.map((rawItem, index): TimelineJsonItem => {
      if (!isRecord(rawItem)) {
        throw new Error(`第 ${index + 1} 项必须是对象。`);
      }
      const componentId =
        typeof rawItem.componentId === "string" ? rawItem.componentId.trim() : "";
      if (!componentId || !definitionMap.has(componentId)) {
        throw new Error(
          `第 ${index + 1} 项的 componentId “${componentId || "未填写"}”不在当前效果库中。`,
        );
      }
      if (
        rawItem.durationInFrames !== undefined &&
        (!Number.isFinite(rawItem.durationInFrames) ||
          Number(rawItem.durationInFrames) <= 0)
      ) {
        throw new Error(`第 ${index + 1} 项的 durationInFrames 必须大于 0。`);
      }
      if (
        rawItem.startFrame !== undefined &&
        (!Number.isFinite(rawItem.startFrame) || Number(rawItem.startFrame) < 0)
      ) {
        throw new Error(`第 ${index + 1} 项的 startFrame 必须是非负数字。`);
      }
      if (rawItem.props !== undefined && !isRecord(rawItem.props)) {
        throw new Error(`第 ${index + 1} 项的 props 必须是对象。`);
      }
      if (rawItem.position !== undefined && !isRecord(rawItem.position)) {
        throw new Error(`第 ${index + 1} 项的 position 必须是对象。`);
      }
      const positionSource = isRecord(rawItem.position) ? rawItem.position : {};
      return {
        componentId,
        startFrame: Math.round(finiteNumber(rawItem.startFrame, 0)),
        durationInFrames:
          rawItem.durationInFrames === undefined
            ? undefined
            : Math.round(finiteNumber(rawItem.durationInFrames, 3)),
        laneId:
          typeof rawItem.laneId === "string" && rawItem.laneId.trim()
            ? rawItem.laneId.trim()
            : undefined,
        trackOrder:
          rawItem.trackOrder === undefined
            ? undefined
            : finiteNumber(rawItem.trackOrder, 0),
        visible: rawItem.visible !== false,
        sourceStartFrame: Math.max(
          0,
          Math.round(finiteNumber(rawItem.sourceStartFrame, 0)),
        ),
        position: {
          ...(typeof positionSource.x === "number" && Number.isFinite(positionSource.x)
            ? { x: positionSource.x }
            : {}),
          ...(typeof positionSource.y === "number" && Number.isFinite(positionSource.y)
            ? { y: positionSource.y }
            : {}),
          ...(typeof positionSource.scale === "number" && Number.isFinite(positionSource.scale)
            ? { scale: positionSource.scale }
            : {}),
        },
        backgroundOpacity:
          rawItem.backgroundOpacity === undefined
            ? undefined
            : finiteNumber(rawItem.backgroundOpacity, 0),
        props: isRecord(rawItem.props) ? rawItem.props : undefined,
        sourceExpressionId:
          typeof rawItem.sourceExpressionId === "string"
            ? rawItem.sourceExpressionId
            : undefined,
        sourceIntentId:
          typeof rawItem.sourceIntentId === "string"
            ? rawItem.sourceIntentId
            : undefined,
      };
    });
    let indexedResources = new Set<string>();
    if (hasResourceItems) {
      const indexResponse = await fetch("/input/resource-index.json", {
        cache: "no-store",
      });
      if (!indexResponse.ok) throw new Error("无法读取固定资源索引。");
      const resourceIndex = await indexResponse.json();
      indexedResources = new Set(
        Object.entries(resourceIndex.libraries ?? {}).flatMap(
          ([library, entries]) =>
            Array.isArray(entries)
              ? entries.map(
                  (entry) =>
                    `${library}:${String(isRecord(entry) ? entry.id ?? "" : "")}`,
                )
              : [],
        ),
      );
    }
    const importedResourceTracks = ensureUniqueResourceTrackIds(
      resourceItems.map((rawTrack, index) => {
        if (!isRecord(rawTrack)) {
          throw new Error(`资源轨道第 ${index + 1} 项必须是对象。`);
        }
        const kind = String(rawTrack.kind ?? "");
        const resourceId = String(rawTrack.resourceId ?? "");
        if (!["icon", "material", "sfx"].includes(kind)) {
          throw new Error(
            `资源轨道第 ${index + 1} 项类型 ${kind || "缺失"} 不受支持。`,
          );
        }
        const library =
          kind === "icon"
            ? "icons"
            : kind === "material"
              ? "materials"
              : kind;
        if (!indexedResources.has(`${library}:${resourceId}`)) {
          throw new Error(
            `资源轨道第 ${index + 1} 项引用的 ${library}:${resourceId} 不在当前索引中。`,
          );
        }
        return restoreResourceTrack(rawTrack as Partial<ResourceTrack>, index);
      }),
      resourceTracks.map((track) => track.id),
    );
    const importTotalFrames = Math.max(
      durationInFrames,
      ...items.map((item) => {
        const definition = definitionMap.get(item.componentId)!;
        return (
          (item.startFrame ?? 0) +
          (item.durationInFrames ?? definition.durationInFrames)
        );
      }),
      ...importedResourceTracks.map(
        (track) => track.startFrame + track.durationInFrames,
      ),
    );
    const firstTrackOrder =
      Math.min(
        0,
        ...videoTracks.map((track) => track.trackOrder),
        ...instances.map((instance) => instance.trackOrder),
        ...resourceTracks.map((track) => track.trackOrder),
      ) - items.length - importedResourceTracks.length;
    const importedInstances = items.map((item, index) =>
      createInstance(
        definitionMap.get(item.componentId)!,
        item.startFrame ?? 0,
        importTotalFrames,
        {
          durationInFrames: item.durationInFrames,
          laneId: item.laneId,
          trackOrder: item.trackOrder ?? firstTrackOrder + index,
          visible: item.visible,
          sourceStartFrame: item.sourceStartFrame,
          position: item.position,
          backgroundOpacity: item.backgroundOpacity,
          props: item.props,
          sourceExpressionId: item.sourceExpressionId,
          sourceIntentId: item.sourceIntentId,
        },
      ),
    );
    const orderedResourceTracks = importedResourceTracks.map((track, index) => ({
      ...track,
      trackOrder:
        Number.isFinite(track.trackOrder) && track.trackOrder !== index
          ? track.trackOrder
          : firstTrackOrder + items.length + index,
    }));
    const arrangementBatch = createArrangementBatch({
      batchName: file.name,
      motionItems: importedInstances,
      resourceItems: orderedResourceTracks,
    });
    const captionInstance = arrangementBatch.motionItems.find(
      (instance) => instance.sourceIntentId === SRT_CAPTION_TRACK_ID,
    );
    const arrangementMotionItems = arrangementBatch.motionItems.filter(
      (instance) => instance.id !== captionInstance?.id,
    );
    const selectedKeys = [
      ...arrangementMotionItems.map((instance) => `motion:${instance.id}`),
      ...arrangementBatch.resourceItems.map((track) => `resource:${track.id}`),
      ...(captionInstance ? [`caption:${captionInstance.id}`] : []),
    ];
    setArrangementPreviewMinimized(false);
    setPendingArrangement({
      fileName: file.name,
      batchId: arrangementBatch.batchId,
      batchName: arrangementBatch.batchName,
      motionInstances: arrangementMotionItems,
      resourceTracks: arrangementBatch.resourceItems,
      captionInstance,
      selectedKeys,
      lockedSegmentIds: [],
      componentCandidatesBySegment,
      qualityControlStatus:
        typeof qualityControl?.status === "string"
          ? qualityControl.status
          : "未提供",
      qualityControlCheckCount: normalizedQualityControlChecks.length,
      qualityControlChecks: normalizedQualityControlChecks,
    });
    setNotice({
      tone: "info",
      text: `已生成 ${arrangementMotionItems.length} 个动效、${arrangementBatch.resourceItems.length} 个资源和 ${captionInstance ? 1 : 0} 条真实字幕轨的编排预览，时间线尚未修改。`,
    });
  };

  const togglePendingArrangementItem = (key: string) => {
    setPendingArrangement((current) => {
      if (!current) return current;
      const selected = new Set(current.selectedKeys);
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
      return { ...current, selectedKeys: [...selected] };
    });
  };

  const previewPendingArrangementMotion = (
    segmentId: string,
    instanceId?: string,
  ) => {
    setActivePendingPreviewSegmentId(segmentId);
    if (instanceId) setSelectedPendingPreviewInstanceId(instanceId);
    setArrangementComponentPicker(null);
    setArrangementResourcePicker(null);
    stopArrangementAudioPreview();
  };

  const activeArrangementRule =
    arrangementRules.find((rule) => rule.id === activeArrangementRuleId) ??
    arrangementRules[0];

  const openArrangementRulesLocation = async () => {
    setOpeningArrangementRulesLocation(true);
    try {
      const response = await fetch("/api/open-arrangement-rules-location", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error ?? "无法打开编排规则文件夹");
      }
      setNotice({ tone: "ok", text: "已打开自动编排规则 JSON 所在位置。" });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "无法打开编排规则文件夹",
      });
    } finally {
      setOpeningArrangementRulesLocation(false);
    }
  };

  const activateArrangementRule = (ruleId: string) => {
    const rule = arrangementRules.find((candidate) => candidate.id === ruleId);
    if (!rule) return;
    const { id: _id, name: _name, ...preferences } = rule;
    setActiveArrangementRuleId(rule.id);
    setArrangementPreferences(preferences);
    setNotice({ tone: "ok", text: `已启用编排规则“${rule.name}”。` });
  };

  const createArrangementRule = () => {
    const id = `semantic-style-${Date.now()}`;
    const name = `语义风格 ${arrangementRules.length + 1}`;
    const nextPreferences = {
      ...arrangementPreferences,
      componentScores: {},
    };
    const rule: ArrangementStyleRule = { id, name, ...nextPreferences };
    setArrangementRules((current) => [...current, rule]);
    setActiveArrangementRuleId(id);
    setArrangementPreferences(nextPreferences);
    setNotice({ tone: "ok", text: `已新建并启用“${name}”。` });
  };

  const savePendingArrangementAsNewStyle = () => {
    const name = newArrangementRuleName.trim().slice(0, 40);
    if (!name) {
      setNotice({ tone: "info", text: "请先为这套语义风格填写名称。" });
      return;
    }
    if (
      arrangementRules.some(
        (rule) => rule.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      setNotice({ tone: "info", text: `语义风格“${name}”已存在，请换一个名称。` });
      return;
    }

    // 当前预览仍可继续编辑；组件偏好只在用户确认插入后才会学习。
    const nextPreferences = {
      ...arrangementPreferences,
      componentScores: { ...arrangementPreferences.componentScores },
    };
    const rule: ArrangementStyleRule = {
      id: `semantic-style-${Date.now()}`,
      name,
      ...nextPreferences,
    };
    setArrangementRules((current) => [...current, rule]);
    setActiveArrangementRuleId(rule.id);
    setArrangementPreferences(nextPreferences);
    setNewArrangementRuleName("");
    setNotice({
      tone: "ok",
      text: `已保存“${name}”。下次 AI 自动编排可直接调用这套语义风格。`,
    });
  };

  const renameActiveArrangementRule = (name: string) => {
    setArrangementRules((current) =>
      current.map((rule) =>
        rule.id === activeArrangementRuleId ? { ...rule, name } : rule,
      ),
    );
  };

  const deleteActiveArrangementRule = () => {
    if (arrangementRules.length <= 1) {
      setNotice({ tone: "info", text: "至少需要保留一条编排规则。" });
      return;
    }
    const remaining = arrangementRules.filter(
      (rule) => rule.id !== activeArrangementRuleId,
    );
    const nextRule = remaining[0];
    const { id: _id, name: _name, ...preferences } = nextRule;
    setArrangementRules(remaining);
    setActiveArrangementRuleId(nextRule.id);
    setArrangementPreferences(preferences);
    setNotice({ tone: "ok", text: "已删除当前规则并切换到下一条规则。" });
  };

  const updateArrangementPreferences = (
    patch: Partial<Omit<ArrangementPreferences, "componentScores">>,
  ) => {
    setArrangementPreferences((current) => ({ ...current, ...patch }));
    if (patch.accentColor || patch.keepStyleConsistent === true) {
      const accentColor = patch.accentColor ?? arrangementPreferences.accentColor;
      setPendingArrangement((current) =>
        current
          ? {
              ...current,
              motionInstances: current.motionInstances.map((instance) => ({
                ...instance,
                props: applyConsistentAccent(instance.props, accentColor),
              })),
            }
          : current,
      );
    }
    if (patch.autoAddIcons === false) {
      setPendingArrangement((current) => {
        if (!current) return current;
        const removedIds = new Set(
          current.resourceTracks
            .filter(
              (track) =>
                track.kind === "icon" &&
                typeof track.sourceExpressionId === "string" &&
                track.sourceExpressionId.startsWith("icon-"),
            )
            .map((track) => track.id),
        );
        return {
          ...current,
          resourceTracks: current.resourceTracks.filter(
            (track) => !removedIds.has(track.id),
          ),
          selectedKeys: current.selectedKeys.filter(
            (key) =>
              !key.startsWith("resource:") ||
              !removedIds.has(key.slice("resource:".length)),
          ),
        };
      });
    }
  };

  const clearLearnedArrangementPreferences = () => {
    setArrangementPreferences((current) => ({
      ...current,
      componentScores: {},
    }));
    setNotice({ tone: "ok", text: "已清空 AI 编排的组件选择习惯。" });
  };

  const setAllPendingArrangementItems = (selected: boolean) => {
    setPendingArrangement((current) => {
      if (!current) return current;
      return {
        ...current,
        selectedKeys: selected
          ? [
              ...current.motionInstances.map(
                (instance) => `motion:${instance.id}`,
              ),
              ...current.resourceTracks.map(
                (track) => `resource:${track.id}`,
              ),
              ...(current.captionInstance
                ? [`caption:${current.captionInstance.id}`]
                : []),
            ]
          : [],
      };
    });
  };

  const togglePendingArrangementSegmentLock = (segmentId: string) => {
    setPendingArrangement((current) => {
      if (!current) return current;
      const locked = new Set(current.lockedSegmentIds);
      if (locked.has(segmentId)) locked.delete(segmentId);
      else locked.add(segmentId);
      return { ...current, lockedSegmentIds: [...locked] };
    });
    setArrangementComponentPicker(null);
  };

  const replacePendingArrangementMotion = (
    instanceId: string,
    candidate: ArrangementComponentCandidate,
  ) => {
    const definition = definitionMap.get(candidate.componentId);
    if (!definition) return;
    setPendingArrangement((current) => {
      if (!current) return current;
      const currentInstance = current.motionInstances.find(
        (instance) => instance.id === instanceId,
      );
      if (
        !currentInstance ||
        current.lockedSegmentIds.includes(
          getArrangementSegmentId(currentInstance),
        )
      ) {
        return current;
      }
      const compatibleProps = Object.fromEntries(
        Object.keys(definition.propsSchema)
          .filter((key) => key in currentInstance.props)
          .map((key) => [key, currentInstance.props[key]]),
      );
      return markPendingArrangementQualityChecksStale({
        ...current,
        motionInstances: current.motionInstances.map((instance) =>
          instance.id === instanceId
            ? {
                ...instance,
                componentId: definition.id,
                position: getRegisteredEffectPosition(
                  definition,
                  canvasOrientation,
                ),
                props: {
                  ...defaultsFromDefinition(definition),
                  ...compatibleProps,
                  ...candidate.props,
                },
              }
            : instance,
        ),
      });
    });
    setArrangementComponentPicker(null);
  };

  const addPendingArrangementMotion = (
    segmentId: string,
    candidate: ArrangementComponentCandidate,
  ) => {
    const definition = definitionMap.get(candidate.componentId);
    if (!definition) return;
    setPendingArrangement((current) => {
      if (!current || current.lockedSegmentIds.includes(segmentId)) return current;
      const segmentItems = [
        ...current.motionInstances,
        ...current.resourceTracks,
      ].filter((item) => getArrangementSegmentId(item) === segmentId);
      const base = segmentItems.sort(
        (left, right) => left.startFrame - right.startFrame,
      )[0];
      if (!base) return current;
      const instance = createInstance(
        definition,
        base.startFrame,
        Math.max(durationInFrames, base.startFrame + base.durationInFrames),
        {
          durationInFrames: base.durationInFrames,
          trackOrder:
            Math.max(
              -1,
              ...current.motionInstances.map((item) => item.trackOrder),
              ...current.resourceTracks.map((item) => item.trackOrder),
            ) + 1,
          backgroundOpacity: 0,
          position: getRegisteredEffectPosition(definition, canvasOrientation),
          props: candidate.props,
          sourceExpressionId: `manual-${segmentId}-${Date.now()}`,
          sourceIntentId: segmentId,
          arrangementBatchId: current.batchId,
          arrangementBatchName: current.batchName,
        },
      );
      return markPendingArrangementQualityChecksStale({
        ...current,
        motionInstances: [...current.motionInstances, instance],
        selectedKeys: [...current.selectedKeys, `motion:${instance.id}`],
      });
    });
    setArrangementComponentPicker(null);
  };

  const regeneratePendingArrangementSegment = (segmentId: string) => {
    const candidateCount =
      pendingArrangement?.componentCandidatesBySegment[segmentId]?.length ??
      arrangementComponentDefinitions.length;
    if (candidateCount < 2) {
      setNotice({ tone: "info", text: "当前语义段没有更多匹配的候选组件。" });
      return;
    }
    setPendingArrangement((current) => {
      if (!current || current.lockedSegmentIds.includes(segmentId)) return current;
      const semanticCandidates =
        current.componentCandidatesBySegment[segmentId] ??
        arrangementComponentDefinitions.map((definition, index) => ({
          componentId: definition.id,
          rank: index + 1,
          reason: "来自当前画幅的可编排组件库",
          props: {},
        }));
      const availableCandidates = semanticCandidates.filter((candidate) =>
        definitionMap.has(candidate.componentId),
      );
      if (availableCandidates.length < 2) return current;
      const segmentInstances = current.motionInstances.filter(
        (instance) => getArrangementSegmentId(instance) === segmentId,
      );
      if (segmentInstances.length === 0) return current;
      const occupied = new Set(segmentInstances.map((item) => item.componentId));
      let candidateCursor = segmentId
        .split("")
        .reduce((total, character) => total + character.charCodeAt(0), 0);
      const replacements = new Map<
        string,
        {
          definition: MotionComponentDefinition;
          candidate: ArrangementComponentCandidate;
        }
      >();
      segmentInstances.forEach((instance) => {
        const alternatives = availableCandidates.filter(
          (candidate) =>
            candidate.componentId !== instance.componentId &&
            !occupied.has(candidate.componentId),
        );
        const pool = alternatives.length > 0 ? alternatives : availableCandidates;
        const candidate = pool[candidateCursor % pool.length];
        const definition = definitionMap.get(candidate.componentId)!;
        candidateCursor += 1;
        occupied.add(definition.id);
        replacements.set(instance.id, { definition, candidate });
      });
      return markPendingArrangementQualityChecksStale({
        ...current,
        motionInstances: current.motionInstances.map((instance) => {
          const replacement = replacements.get(instance.id);
          if (!replacement) return instance;
          const { definition, candidate } = replacement;
          const compatibleProps = Object.fromEntries(
            Object.keys(definition.propsSchema)
              .filter((key) => key in instance.props)
              .map((key) => [key, instance.props[key]]),
          );
          return {
            ...instance,
            componentId: definition.id,
            position: getRegisteredEffectPosition(definition, canvasOrientation),
            props: {
              ...defaultsFromDefinition(definition),
              ...compatibleProps,
              ...candidate.props,
            },
          };
        }),
      });
    });
    setArrangementComponentPicker(null);
    setNotice({ tone: "ok", text: "已只为当前语义段换一组组件，其他段保持不变。" });
  };

  const stopArrangementAudioPreview = () => {
    arrangementAudioPreviewRef.current?.pause();
    arrangementAudioPreviewRef.current = null;
  };

  const previewArrangementAudio = (resource: ArrangementResourceEntry) => {
    stopArrangementAudioPreview();
    const audio = new window.Audio(resource.url);
    audio.volume = 0.55;
    arrangementAudioPreviewRef.current = audio;
    void audio.play().catch(() =>
      setNotice({ tone: "info", text: "浏览器暂时无法播放该音效。" }),
    );
  };

  const replacePendingArrangementResource = (
    trackId: string,
    resource: ArrangementResourceEntry,
  ) => {
    setPendingArrangement((current) => {
      if (!current) return current;
      const currentTrack = current.resourceTracks.find(
        (track) => track.id === trackId,
      );
      if (
        !currentTrack ||
        current.lockedSegmentIds.includes(getArrangementSegmentId(currentTrack))
      ) {
        return current;
      }
      const sourceFrames = resource.durationSeconds
        ? Math.max(3, Math.round(resource.durationSeconds * fps))
        : currentTrack.sourceDurationInFrames;
      return markPendingArrangementQualityChecksStale({
        ...current,
        resourceTracks: current.resourceTracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                resourceId: resource.id,
                name: resource.label,
                url: resource.url,
                mimeType: resource.mimeType,
                sourceDurationInFrames: sourceFrames,
                durationInFrames:
                  track.kind === "sfx"
                    ? Math.min(track.durationInFrames, sourceFrames)
                    : track.durationInFrames,
              }
            : track,
        ),
      });
    });
    stopArrangementAudioPreview();
    setArrangementResourcePicker(null);
    setArrangementResourceSearch("");
  };

  const addPendingArrangementResource = (
    segmentId: string,
    kind: ResourceTrack["kind"],
    resource: ArrangementResourceEntry,
  ) => {
    setPendingArrangement((current) => {
      if (!current || current.lockedSegmentIds.includes(segmentId)) return current;
      const segmentItems = [
        ...current.motionInstances,
        ...current.resourceTracks,
      ].filter((item) => getArrangementSegmentId(item) === segmentId);
      const base = [...segmentItems].sort(
        (left, right) => left.startFrame - right.startFrame,
      )[0];
      if (!base) return current;
      const id = createResourceTrackId();
      const sourceFrames = resource.durationSeconds
        ? Math.max(3, Math.round(resource.durationSeconds * fps))
        : base.durationInFrames;
      const iconSize = canvasOrientation === "portrait" ? 132 : 118;
      const materialWidth = Math.round(canvasWidth * 0.64);
      const materialHeight = Math.round(materialWidth * 0.5625);
      const track: ResourceTrack = {
        id,
        laneId: id,
        trackOrder:
          Math.max(
            -1,
            ...current.motionInstances.map((item) => item.trackOrder),
            ...current.resourceTracks.map((item) => item.trackOrder),
          ) + 1,
        kind,
        resourceId: resource.id,
        name: resource.label,
        url: resource.url,
        mimeType: resource.mimeType,
        sourceStartFrame: 0,
        sourceDurationInFrames: sourceFrames,
        startFrame: base.startFrame,
        durationInFrames:
          kind === "sfx"
            ? Math.min(sourceFrames, base.durationInFrames)
            : base.durationInFrames,
        visible: true,
        position:
          kind === "sfx"
            ? { x: 0, y: 0, width: 1, height: 1, scale: 1, zIndex: 0 }
            : kind === "icon"
              ? {
                  x: Math.round((canvasWidth - iconSize) / 2),
                  y: canvasOrientation === "portrait" ? 176 : 92,
                  width: iconSize,
                  height: iconSize,
                  scale: 1,
                  zIndex: 35,
                }
              : {
                  x: Math.round((canvasWidth - materialWidth) / 2),
                  y: canvasOrientation === "portrait" ? 420 : 180,
                  width: materialWidth,
                  height: materialHeight,
                  scale: 1,
                  zIndex: 24,
                },
        volume: kind === "sfx" ? 0.28 : 1,
        voiceDucking: kind === "sfx" ? 0.72 : 0,
        sourceExpressionId: `manual-${kind}-${segmentId}-${Date.now()}`,
        sourceIntentId: segmentId,
        arrangementBatchId: current.batchId,
        arrangementBatchName: current.batchName,
      };
      return markPendingArrangementQualityChecksStale({
        ...current,
        resourceTracks: [...current.resourceTracks, track],
        selectedKeys: [...current.selectedKeys, `resource:${track.id}`],
      });
    });
    stopArrangementAudioPreview();
    setArrangementResourcePicker(null);
    setArrangementResourceSearch("");
  };

  const applyPendingArrangement = () => {
    if (!pendingArrangement) return;
    const selectedKeys = new Set(pendingArrangement.selectedKeys);
    const selectedMotionInstances = pendingArrangement.motionInstances.filter(
      (instance) => selectedKeys.has(`motion:${instance.id}`),
    );
    const selectedCaptionInstance =
      pendingArrangement.captionInstance &&
      selectedKeys.has(`caption:${pendingArrangement.captionInstance.id}`)
        ? pendingArrangement.captionInstance
        : null;
    const selectedTimelineInstances = [
      ...selectedMotionInstances,
      ...(selectedCaptionInstance ? [selectedCaptionInstance] : []),
    ];
    const selectedResourceTracks = pendingArrangement.resourceTracks.filter(
      (track) => selectedKeys.has(`resource:${track.id}`),
    );
    if (selectedTimelineInstances.length + selectedResourceTracks.length === 0) {
      setNotice({ tone: "info", text: "请至少选择一个编排项。" });
      return;
    }
    // 编排项统一插入到轨道列表最上方（人物主轨道之上）：
    // trackOrder 越小行越靠上、图层越靠前，批次内保持原有相对顺序
    const arrangementOrderBase =
      Math.min(
        0,
        ...videoTracks.map((track) => track.trackOrder),
        ...instances.map((candidate) => candidate.trackOrder),
        ...resourceTracks.map((candidate) => candidate.trackOrder),
      ) -
      selectedTimelineInstances.length -
      selectedResourceTracks.length;
    const arrangementRankById = new Map<string, number>();
    [...selectedTimelineInstances, ...selectedResourceTracks]
      .sort((left, right) => left.trackOrder - right.trackOrder)
      .forEach((clip, index) => arrangementRankById.set(clip.id, index));
    const withArrangementTrackOrders = <
      T extends { id: string; trackOrder: number },
    >(
      clips: T[],
    ): T[] =>
      clips.map((clip) => ({
        ...clip,
        trackOrder:
          arrangementOrderBase + (arrangementRankById.get(clip.id) ?? 0),
      }));
    const nextInstances = appendClipsWithoutMovingExisting(
      instances,
      withArrangementTrackOrders(selectedTimelineInstances),
    );
    const nextResourceTracks = appendClipsWithoutMovingExisting(
      resourceTracks,
      withArrangementTrackOrders(selectedResourceTracks),
    );
    const selectedEndFrame = Math.max(
      0,
      ...selectedTimelineInstances.map(
        (instance) => instance.startFrame + instance.durationInFrames,
      ),
      ...selectedResourceTracks.map(
        (track) => track.startFrame + track.durationInFrames,
      ),
    );
    setInstances(nextInstances);
    setResourceTracks(nextResourceTracks);
    setManualTimelineEndFrame((current) =>
      Math.max(current, selectedEndFrame),
    );
    if (selectedTimelineInstances[0]) {
      selectOnlyInstance(selectedTimelineInstances[0].id);
    } else if (selectedResourceTracks[0]) {
      selectResourceTrack(selectedResourceTracks[0].id);
    }
    setActiveArrangementBatchId(pendingArrangement.batchId);
    setActiveArrangementIntentId("");
    if (arrangementPreferences.learnFromConfirmedChoices) {
      setArrangementPreferences((current) => {
        const nextScores = { ...current.componentScores };
        pendingArrangement.motionInstances.forEach((instance) => {
          const delta = selectedKeys.has(`motion:${instance.id}`) ? 2 : -1;
          nextScores[instance.componentId] = Math.max(
            -8,
            Math.min(12, (nextScores[instance.componentId] ?? 0) + delta),
          );
        });
        return { ...current, componentScores: nextScores };
      });
    }
    seekEditorFrame(
      Math.min(
        ...selectedTimelineInstances.map((instance) => instance.startFrame),
        ...selectedResourceTracks.map((track) => track.startFrame),
      ),
    );
    stopArrangementAudioPreview();
    setPendingArrangement(null);
    setArrangementComponentPicker(null);
    setArrangementResourcePicker(null);
    setArrangementResourceSearch("");
    setNotice({
      tone: "ok",
      text: `已确认插入 ${selectedMotionInstances.length} 个动效、${selectedResourceTracks.length} 个资源和 ${selectedCaptionInstance ? 1 : 0} 条真实字幕轨；原时间线内容已保留。`,
    });
  };

  const activateHistoryItem = async (item: ComponentHistoryItem) => {
    const response = await fetch("/api/activate-component", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "历史组件加载失败");
    setActiveComponentId(item.id);
    await loadModuleUrl(data.moduleUrl, {
      sourceIncludesVideo: Boolean(data.sourceIncludesVideo),
      componentName: item.name,
      totalFrames: durationInFrames,
    });
    setNotice({ tone: "ok", text: `已从历史记录加载 ${item.name}。` });
  };

  const defaultExportFileName = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${exportTransparent ? "动效透明导出" : "实时预览导出"}-${now.getFullYear()}${pad(
      now.getMonth() + 1,
    )}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.mov`;
  };

  const openExportDialog = () => {
    setExportDirDraft(
      localStorage.getItem("export-folder-path") ?? "",
    );
    setExportFileNameDraft(defaultExportFileName());
    setExportDialogError("");
    setExportDialogOpen(true);
  };

  const pickExportFolder = async () => {
    setExportPicking(true);
    try {
      const response = await fetch("/api/pick-folder", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "选择文件夹失败");
      if (data.path) {
        setExportDirDraft(String(data.path));
        setExportDialogError("");
        localStorage.setItem("export-folder-path", String(data.path));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "无法打开文件夹选择器";
      setExportDialogError(message);
      setNotice({
        tone: "error",
        text: message,
      });
    } finally {
      setExportPicking(false);
    }
  };

  const openExportFolder = async (path: string) => {
    try {
      const response = await fetch("/api/open-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "无法打开文件夹");
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "无法打开文件夹",
      });
    }
  };

  const pollRenderJob = async (jobId: string) => {
    while (true) {
      const statusResponse = await fetch(
        `/api/render-status?jobId=${encodeURIComponent(jobId)}`,
        { cache: "no-store" },
      );
      const statusData = await statusResponse.json();
      if (!statusResponse.ok) {
        throw new Error(statusData.error ?? "读取渲染进度失败");
      }
      const nextProgress: RenderProgressState = {
        jobId,
        status: statusData.status,
        stage: statusData.stage ?? "正在渲染",
        progress: clamp(Number(statusData.progress) || 0, 0, 1),
        renderedFrames: Math.max(0, Number(statusData.renderedFrames) || 0),
        encodedFrames: Math.max(0, Number(statusData.encodedFrames) || 0),
        totalFrames: Math.max(1, Number(statusData.totalFrames) || 1),
        estimatedRemainingMs:
          Number.isFinite(Number(statusData.estimatedRemainingMs)) &&
          Number(statusData.estimatedRemainingMs) > 0
            ? Number(statusData.estimatedRemainingMs)
            : null,
      };
      setRenderProgress(nextProgress);

      if (nextProgress.status === "completed") {
        if (!statusData.result) {
          throw new Error("渲染完成，但本地服务没有返回输出文件");
        }
        const result = statusData.result;
        setRenderResult(result);
        setNotice({
          tone:
            result.mode === "transparent" && result.alphaVerified === false
              ? "error"
              : "ok",
          text:
            result.mode === "transparent" && result.alphaVerified === false
              ? `导出完成，但 ffprobe 未检测到 Alpha 通道：${result.fileName}`
              : result.mode === "transparent"
                ? `透明导出完成：${result.savedTo ?? result.fileName}（ffprobe 已确认 Alpha 通道）`
                : `实时预览 MOV 导出完成：${result.savedTo ?? result.fileName}`,
        });
        return result;
      }
      if (nextProgress.status === "failed") {
        throw new Error(statusData.error ?? "本机渲染失败");
      }
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
  };

  const renderVideo = async () => {
    const outputDir = exportDirDraft.trim();
    const fileName = exportFileNameDraft.trim() || defaultExportFileName();
    if (!outputDir) {
      setExportDialogError("请先选择或填写导出文件夹。");
      setNotice({ tone: "error", text: "请先选择导出文件夹。" });
      return;
    }
    setExportDialogError("");
    setExportDialogOpen(false);
    setExportFileName(fileName);
    setRendering(true);
    setRenderProgress(null);
    setRenderResult(null);
    setNotice({
      tone: "info",
      text: exportTransparent
        ? "主视频已隐藏：仅导出未隐藏的动效轨道，生成带 Alpha 的 ProRes 4444 MOV。"
        : "主视频已显示：正在导出与实时预览一致的视频与动效合成 MOV。",
    });
    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoSrc: videoUrl,
          videoTracks: videoTracks.map((track) => ({
            ...track,
            url: track.url.split("?")[0],
          })),
          resourceTracks: resourceTracks.map((track) => ({
            ...track,
            url: track.url.split("?")[0],
          })),
          sourceIncludesVideo,
          soundEnabled,
          instances: effectiveInstances,
          timelineDurationInFrames: durationInFrames,
          ...(exportUseRegion &&
          regionInFrame !== null &&
          regionOutFrame !== null
            ? {
                regionStartFrame: Math.min(regionInFrame, regionOutFrame),
                regionEndFrame: Math.max(regionInFrame, regionOutFrame),
              }
            : {}),
          canvasWidth,
          canvasHeight,
          transparent: exportTransparent,
          outputDir,
          fileName,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "渲染失败");
      const jobId = String(data.jobId ?? "");
      if (!jobId) throw new Error("本地服务没有返回渲染任务编号");
      await pollRenderJob(jobId);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "渲染失败",
      });
    } finally {
      setRendering(false);
    }
  };

  const exportMotionInstanceTransparentMov = async (
    instance: MotionInstance,
    definition: MotionComponentDefinition,
  ) => {
    if (instance.visible === false) {
      setNotice({ tone: "error", text: "当前组件处于隐藏状态，请先显示后再导出。" });
      return;
    }
    const outputDir = localStorage.getItem("export-folder-path") ?? "";
    if (!outputDir) {
      setNotice({
        tone: "error",
        text: "请先在顶部导出对话框里选择一次输出文件夹，之后即可一键导出单个组件。",
      });
      openExportDialog();
      return;
    }
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    const fileName = `${definition.name}-透明导出-${now.getFullYear()}${pad(
      now.getMonth() + 1,
    )}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(
      now.getSeconds(),
    )}.mov`;
    setRendering(true);
    setRenderProgress(null);
    setRenderResult(null);
    setNotice({
      tone: "info",
      text: `正在单独导出「${definition.name}」透明 MOV（仅该组件、无背景视频）…`,
    });
    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoSrc: "",
          videoTracks: [],
          resourceTracks: [],
          sourceIncludesVideo: false,
          soundEnabled: false,
          instances: [{ ...instance, startFrame: 0 }],
          timelineDurationInFrames: Math.max(
            3,
            instance.durationInFrames,
          ),
          canvasWidth,
          canvasHeight,
          transparent: true,
          outputDir,
          fileName,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "渲染失败");
      const jobId = String(data.jobId ?? "");
      if (!jobId) throw new Error("本地服务没有返回渲染任务编号");
      await pollRenderJob(jobId);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "渲染失败",
      });
    } finally {
      setRendering(false);
    }
  };

  const constrainArrangementPreviewMinimizedPosition = (
    position: ArrangementPreviewMinimizedPosition,
  ): ArrangementPreviewMinimizedPosition => ({
    x: Math.min(
      Math.max(ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP, position.x),
      Math.max(
        ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP,
        window.innerWidth - ARRANGEMENT_PREVIEW_MINIMIZED_WIDTH - ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP,
      ),
    ),
    y: Math.min(
      Math.max(ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP, position.y),
      Math.max(
        ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP,
        window.innerHeight - ARRANGEMENT_PREVIEW_MINIMIZED_HEIGHT - ARRANGEMENT_PREVIEW_MINIMIZED_EDGE_GAP,
      ),
    ),
  });

  const beginArrangementPreviewMinimizedDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    arrangementPreviewMinimizedSuppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    arrangementPreviewMinimizedDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      position: arrangementPreviewMinimizedPosition,
      moved: false,
    };
  };

  const moveArrangementPreviewMinimized = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const drag = arrangementPreviewMinimizedDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) drag.moved = true;
    setArrangementPreviewMinimizedPosition(
      constrainArrangementPreviewMinimizedPosition({
        x: drag.position.x + deltaX,
        y: drag.position.y + deltaY,
      }),
    );
  };

  const endArrangementPreviewMinimizedDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const drag = arrangementPreviewMinimizedDragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    arrangementPreviewMinimizedSuppressClickRef.current = drag.moved;
    arrangementPreviewMinimizedDragRef.current = null;
  };

  const exportInstanceTransparentMov = () => {
    if (!selectedInstance || !selectedDefinition) return;
    return exportMotionInstanceTransparentMov(selectedInstance, selectedDefinition);
  };

  const seekFromPointer = (
    event: React.MouseEvent<HTMLElement>,
    element: HTMLElement,
  ) => {
    const bounds = element.getBoundingClientRect();
    const ratio = clamp(
      (event.clientX - bounds.left + timelineScroll) / timelineContentWidth,
      0,
      1,
    );
    const frame = clamp(
      Math.round(ratio * (durationInFrames - 1)),
      0,
      durationInFrames - 1,
    );
    playerRef.current?.seekTo(frame);
    setCurrentFrame(frame);
  };

  const hScrollDragRef = useRef<{
    startX: number;
    startScroll: number;
    pointerId: number;
    barWidth: number;
    contentWidth: number;
    maxScroll: number;
  } | null>(null);

  const beginHScrollbarDrag = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const barRect = event.currentTarget.getBoundingClientRect();
    const isThumb = (event.target as HTMLElement).classList.contains(
      "timeline-hscroll-thumb",
    );
    let startScroll = timelineScroll;
    if (!isThumb) {
      const ratio = clamp(
        (event.clientX - barRect.left) / Math.max(1, barRect.width),
        0,
        1,
      );
      startScroll = clamp(
        ratio * timelineContentWidth - trackViewportWidth / 2,
        0,
        timelineMaxScroll,
      );
      setTimelineScroll(startScroll);
    }
    const dragState = {
      startX: event.clientX,
      startScroll,
      pointerId: event.pointerId,
      barWidth: Math.max(1, barRect.width),
      contentWidth: timelineContentWidth,
      maxScroll: timelineMaxScroll,
    };
    hScrollDragRef.current = dragState;
    const move = (moveEvent: PointerEvent) => {
      const state = hScrollDragRef.current;
      if (!state || moveEvent.pointerId !== state.pointerId) return;
      const dx = moveEvent.clientX - state.startX;
      const scrollPerPixel = state.contentWidth / state.barWidth;
      setTimelineScroll(
        clamp(state.startScroll + dx * scrollPerPixel, 0, state.maxScroll),
      );
    };
    const finish = (upEvent: PointerEvent) => {
      if (
        hScrollDragRef.current &&
        upEvent.pointerId !== hScrollDragRef.current.pointerId
      )
        return;
      hScrollDragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  // 播放时播放头靠边则自动滚动跟随
  useEffect(() => {
    if (!isPlaying || trackViewportWidth <= 0) return;
    const headX = (timelineContentWidth * playheadPercent) / 100 - timelineScroll;
    if (headX < 0 || headX > trackViewportWidth * 0.92) {
      setTimelineScroll(
        clamp(
          (timelineContentWidth * playheadPercent) / 100 -
            trackViewportWidth * 0.3,
          0,
          timelineMaxScroll,
        ),
      );
    }
  }, [
    currentFrame,
    isPlaying,
    playheadPercent,
    timelineContentWidth,
    trackViewportWidth,
    timelineScroll,
    timelineMaxScroll,
  ]);

  const seekTimelineFromClientX = useCallback(
    (clientX: number) => {
      const timeline = timelineRef.current;
      if (!timeline) return;
      const bounds = timeline.getBoundingClientRect();
      const trackLeft = bounds.left + trackOffsetLeft;
      const ratio = clamp(
        (clientX - trackLeft + timelineScroll) / timelineContentWidth,
        0,
        1,
      );
      const frame = clamp(
        Math.round(ratio * (durationInFrames - 1)),
        0,
        durationInFrames - 1,
      );
      playerRef.current?.seekTo(frame);
      setCurrentFrame(frame);
    },
    [durationInFrames, timelineContentWidth, timelineScroll, trackOffsetLeft],
  );

  const frameFromClientX = useCallback(
    (clientX: number) => {
      const timeline = timelineRef.current;
      if (!timeline) return 0;
      const bounds = timeline.getBoundingClientRect();
      const trackLeft = bounds.left + trackOffsetLeft;
      const ratio = clamp(
        (clientX - trackLeft + timelineScroll) / timelineContentWidth,
        0,
        1,
      );
      return clamp(
        Math.round(ratio * (durationInFrames - 1)),
        0,
        durationInFrames - 1,
      );
    },
    [durationInFrames, timelineContentWidth, timelineScroll, trackOffsetLeft],
  );

  const regionDragRef = useRef<{
    side: "in" | "out";
    pointerId: number;
  } | null>(null);

  const beginRegionMarkerDrag = (side: "in" | "out") => (
    event: React.PointerEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    regionDragRef.current = { side, pointerId: event.pointerId };
    const move = (moveEvent: PointerEvent) => {
      const state = regionDragRef.current;
      if (!state || moveEvent.pointerId !== state.pointerId) return;
      const frame = frameFromClientX(moveEvent.clientX);
      if (state.side === "in") {
        setRegionInFrame(frame);
        setRegionOutFrame((out) => (out !== null && out < frame ? null : out));
      } else {
        setRegionOutFrame(frame);
        setRegionInFrame((inFrame) =>
          inFrame !== null && inFrame > frame ? null : inFrame,
        );
      }
    };
    const finish = (upEvent: PointerEvent) => {
      if (
        !regionDragRef.current ||
        upEvent.pointerId !== regionDragRef.current.pointerId
      )
        return;
      regionDragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const beginSidebarResize = (
    side: "left" | "right",
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    sidebarDragCleanupRef.current?.();

    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startWidth = side === "left" ? leftPanelWidth : rightPanelWidth;
    const oppositeWidth = side === "left" ? rightPanelWidth : leftPanelWidth;
    const minimumWidth =
      side === "left" ? MIN_LEFT_PANEL_WIDTH : MIN_RIGHT_PANEL_WIDTH;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    setResizingSidebar(side);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      const delta = moveEvent.clientX - startX;
      const requestedWidth =
        side === "left" ? startWidth + delta : startWidth - delta;
      const availableMaximum = Math.max(
        minimumWidth,
        window.innerWidth - oppositeWidth - MIN_WORKSPACE_WIDTH - 12,
      );
      const nextWidth = Math.round(
        clamp(
          requestedWidth,
          minimumWidth,
          Math.min(MAX_PANEL_WIDTH, availableMaximum),
        ),
      );
      if (side === "left") setLeftPanelWidth(nextWidth);
      else setRightPanelWidth(nextWidth);
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
      window.removeEventListener("blur", cleanup);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      setResizingSidebar(null);
      sidebarDragCleanupRef.current = null;
    };
    const handleEnd = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== pointerId) return;
      handleMove(endEvent);
      cleanup();
    };

    sidebarDragCleanupRef.current = cleanup;
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    window.addEventListener("blur", cleanup);
  };

  const beginPlayheadDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    seekTimelineFromClientX(event.clientX);
    playheadDragCleanupRef.current?.();

    const pointerId = event.pointerId;
    const handleMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      seekTimelineFromClientX(moveEvent.clientX);
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
      playheadDragCleanupRef.current = null;
    };
    const handleEnd = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== pointerId) return;
      seekTimelineFromClientX(endEvent.clientX);
      cleanup();
    };

    playheadDragCleanupRef.current = cleanup;
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
  };

  const videoTimelineDragState = useRef<{
    mode: "move" | "left" | "right";
    trackId: string;
    pointerX: number;
    startFrame: number;
    sourceStartFrame: number;
    sourceDurationInFrames: number;
    durationInFrames: number;
    width: number;
  } | null>(null);

  const beginVideoTimelineDrag = (
    event: React.PointerEvent,
    track: VideoTrack,
    mode: "move" | "left" | "right",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    selectVideoTrack(track.id);
    videoTimelineDragState.current = {
      mode,
      trackId: track.id,
      pointerX: event.clientX,
      startFrame: track.startFrame,
      sourceStartFrame: track.sourceStartFrame,
      sourceDurationInFrames: track.sourceDurationInFrames,
      durationInFrames: track.durationInFrames,
      width:
        timelineContentWidth ||
        event.currentTarget.closest(".track-body")?.clientWidth ||
        1,
    };
  };

  useEffect(() => {
    const moveVideoTimeline = (event: PointerEvent) => {
      const state = videoTimelineDragState.current;
      if (!state) return;
      event.preventDefault();
      const deltaFrames = Math.round(
        ((event.clientX - state.pointerX) / state.width) * durationInFrames,
      );
      const minFrames = Math.max(3, Math.round(fps * 0.1));
      setVideoTracks((current) =>
        current.map((track) => {
          if (track.id !== state.trackId) return track;
          const laneNeighbors = current.filter(
            (candidate) =>
              candidate.id !== track.id && candidate.laneId === track.laneId,
          );
          const previousEnd = laneNeighbors.reduce(
            (maximum, candidate) => {
              const candidateEnd =
                candidate.startFrame + candidate.durationInFrames;
              return candidateEnd <= state.startFrame
                ? Math.max(maximum, candidateEnd)
                : maximum;
            },
            0,
          );
          const originalEnd = state.startFrame + state.durationInFrames;
          const nextStart = laneNeighbors.reduce(
            (minimum, candidate) =>
              candidate.startFrame >= originalEnd
                ? Math.min(minimum, candidate.startFrame)
                : minimum,
            Number.POSITIVE_INFINITY,
          );
          if (state.mode === "move") {
            const requestedStart = state.startFrame + deltaFrames;
            const maximumStart = Number.isFinite(nextStart)
              ? nextStart - state.durationInFrames
              : Math.max(
                  durationInFrames - state.durationInFrames,
                  requestedStart,
                );
            return {
              ...track,
              startFrame: clamp(requestedStart, previousEnd, maximumStart),
            };
          }
          if (state.mode === "left") {
            const rightFrame = state.startFrame + state.durationInFrames;
            const maxStartFrame = Math.min(
              rightFrame - minFrames,
              state.startFrame +
                state.sourceDurationInFrames -
                state.sourceStartFrame -
                minFrames,
            );
            const startFrame = clamp(
              state.startFrame + deltaFrames,
              Math.max(
                previousEnd,
                0,
                state.startFrame - state.sourceStartFrame,
              ),
              maxStartFrame,
            );
            const sourceDelta = startFrame - state.startFrame;
            return {
              ...track,
              startFrame,
              sourceStartFrame: state.sourceStartFrame + sourceDelta,
              durationInFrames: rightFrame - startFrame,
            };
          }
          return {
            ...track,
            durationInFrames: clamp(
              state.durationInFrames + deltaFrames,
              minFrames,
              Math.min(
                state.sourceDurationInFrames - state.sourceStartFrame,
                (Number.isFinite(nextStart) ? nextStart : durationInFrames) -
                  state.startFrame,
              ),
            ),
          };
        }),
      );
    };
    const finishVideoTimeline = () => {
      videoTimelineDragState.current = null;
    };
    window.addEventListener("pointermove", moveVideoTimeline, { passive: false });
    window.addEventListener("pointerup", finishVideoTimeline);
    window.addEventListener("pointercancel", finishVideoTimeline);
    return () => {
      window.removeEventListener("pointermove", moveVideoTimeline);
      window.removeEventListener("pointerup", finishVideoTimeline);
      window.removeEventListener("pointercancel", finishVideoTimeline);
    };
  }, [durationInFrames, fps]);

  const resourceTimelineDragState = useRef<{
    mode: "move" | "left" | "right";
    trackId: string;
    pointerX: number;
    startFrame: number;
    sourceStartFrame: number;
    sourceDurationInFrames: number;
    durationInFrames: number;
    width: number;
  } | null>(null);

  const beginResourceTimelineDrag = (
    event: React.PointerEvent,
    track: ResourceTrack,
    mode: "move" | "left" | "right",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    selectResourceTrack(track.id);
    resourceTimelineDragState.current = {
      mode,
      trackId: track.id,
      pointerX: event.clientX,
      startFrame: track.startFrame,
      sourceStartFrame: track.sourceStartFrame,
      sourceDurationInFrames: track.sourceDurationInFrames,
      durationInFrames: track.durationInFrames,
      width:
        timelineContentWidth ||
        event.currentTarget.closest(".track-body")?.clientWidth ||
        1,
    };
  };

  useEffect(() => {
    const moveResourceTimeline = (event: PointerEvent) => {
      const state = resourceTimelineDragState.current;
      if (!state) return;
      event.preventDefault();
      const deltaFrames = Math.round(
        ((event.clientX - state.pointerX) / state.width) * durationInFrames,
      );
      const minFrames = Math.max(3, Math.round(fps * 0.1));
      setResourceTracks((current) =>
        current.map((track) => {
          if (track.id !== state.trackId) return track;
          const laneNeighbors = current.filter(
            (candidate) =>
              candidate.id !== track.id && candidate.laneId === track.laneId,
          );
          const previousEnd = laneNeighbors.reduce((maximum, candidate) => {
            const candidateEnd = candidate.startFrame + candidate.durationInFrames;
            return candidateEnd <= state.startFrame
              ? Math.max(maximum, candidateEnd)
              : maximum;
          }, 0);
          const originalEnd = state.startFrame + state.durationInFrames;
          const nextStart = laneNeighbors.reduce(
            (minimum, candidate) =>
              candidate.startFrame >= originalEnd
                ? Math.min(minimum, candidate.startFrame)
                : minimum,
            Number.POSITIVE_INFINITY,
          );
          if (state.mode === "move") {
            const startFrame = Math.max(previousEnd, state.startFrame + deltaFrames);
            const limitedStart = Number.isFinite(nextStart)
              ? Math.min(startFrame, nextStart - state.durationInFrames)
              : startFrame;
            setManualTimelineEndFrame((currentEnd) =>
              Math.max(currentEnd, limitedStart + state.durationInFrames),
            );
            return { ...track, startFrame: limitedStart };
          }
          if (state.mode === "left") {
            const rightFrame = state.startFrame + state.durationInFrames;
            const minimumStart = Math.max(
              previousEnd,
              0,
              state.startFrame - state.sourceStartFrame,
            );
            const startFrame = clamp(
              state.startFrame + deltaFrames,
              minimumStart,
              rightFrame - minFrames,
            );
            const sourceDelta = startFrame - state.startFrame;
            return {
              ...track,
              startFrame,
              sourceStartFrame: state.sourceStartFrame + sourceDelta,
              durationInFrames: rightFrame - startFrame,
            };
          }
          const maximumDuration = Number.isFinite(nextStart)
            ? nextStart - state.startFrame
            : Number.MAX_SAFE_INTEGER;
          const sourceLimit = Math.min(
            maximumDuration,
            state.sourceDurationInFrames - state.sourceStartFrame,
          );
          const duration = clamp(
            state.durationInFrames + deltaFrames,
            minFrames,
            sourceLimit,
          );
          setManualTimelineEndFrame((currentEnd) =>
            Math.max(currentEnd, state.startFrame + duration),
          );
          return { ...track, durationInFrames: duration };
        }),
      );
    };
    const finishResourceTimeline = () => {
      resourceTimelineDragState.current = null;
    };
    window.addEventListener("pointermove", moveResourceTimeline, {
      passive: false,
    });
    window.addEventListener("pointerup", finishResourceTimeline);
    window.addEventListener("pointercancel", finishResourceTimeline);
    return () => {
      window.removeEventListener("pointermove", moveResourceTimeline);
      window.removeEventListener("pointerup", finishResourceTimeline);
      window.removeEventListener("pointercancel", finishResourceTimeline);
    };
  }, [durationInFrames, fps, selectResourceTrack]);

  const timelineDragState = useRef<{
    mode: "move" | "left" | "right";
    instanceId: string;
    pointerX: number;
    startFrame: number;
    durationInFrames: number;
    baseDurationInFrames: number;
    sourceStartFrame: number;
    width: number;
    members: Array<{
      id: string;
      laneId: string;
      startFrame: number;
      durationInFrames: number;
    }>;
    minStartFrame: number;
    maxEndFrame: number;
    collisionMinDelta: number;
    collisionMaxDelta: number;
    previousEndFrame: number;
    nextStartFrame: number;
    moved: boolean;
  } | null>(null);

  const beginTimelineDrag = (
    event: React.PointerEvent,
    instance: MotionInstance,
    mode: "move" | "left" | "right",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const keepGroup =
      mode === "move" &&
      selectedInstanceIds.length > 1 &&
      selectedInstanceIdSet.has(instance.id);
    const memberIds = keepGroup ? selectedInstanceIds : [instance.id];
    if (keepGroup) {
      setSelectedInstanceId(instance.id);
    } else {
      selectOnlyInstance(instance.id);
    }
    const memberIdSet = new Set(memberIds);
    const members = instances
      .filter((candidate) => memberIdSet.has(candidate.id))
      .map((candidate) => ({
        id: candidate.id,
        laneId: candidate.laneId,
        startFrame: candidate.startFrame,
        durationInFrames: candidate.durationInFrames,
      }));
    const staticInstances = instances.filter(
      (candidate) => !memberIdSet.has(candidate.id),
    );
    let collisionMinDelta = -Math.min(
      ...members.map((member) => member.startFrame),
    );
    // 允许向右拖出当前总长：只受同轨道相邻片段约束，不再被总长锁死
    let collisionMaxDelta =
      Number.MAX_SAFE_INTEGER;
    for (const member of members) {
      const memberEnd = member.startFrame + member.durationInFrames;
      const laneNeighbors = staticInstances.filter(
        (candidate) => candidate.laneId === member.laneId,
      );
      const previousEnd = laneNeighbors.reduce((maximum, candidate) => {
        const candidateEnd = candidate.startFrame + candidate.durationInFrames;
        return candidateEnd <= member.startFrame
          ? Math.max(maximum, candidateEnd)
          : maximum;
      }, 0);
      const nextStart = laneNeighbors.reduce(
        (minimum, candidate) =>
          candidate.startFrame >= memberEnd
            ? Math.min(minimum, candidate.startFrame)
            : minimum,
        Number.MAX_SAFE_INTEGER,
      );
      collisionMinDelta = Math.max(
        collisionMinDelta,
        previousEnd - member.startFrame,
      );
      collisionMaxDelta = Math.min(
        collisionMaxDelta,
        nextStart - memberEnd,
      );
    }
    const activeEnd = instance.startFrame + instance.durationInFrames;
    const activeLaneNeighbors = staticInstances.filter(
      (candidate) => candidate.laneId === instance.laneId,
    );
    const previousEndFrame = activeLaneNeighbors.reduce(
      (maximum, candidate) => {
        const candidateEnd = candidate.startFrame + candidate.durationInFrames;
        return candidateEnd <= instance.startFrame
          ? Math.max(maximum, candidateEnd)
          : maximum;
      },
      0,
    );
    const nextStartFrame = activeLaneNeighbors.reduce(
      (minimum, candidate) =>
        candidate.startFrame >= activeEnd
          ? Math.min(minimum, candidate.startFrame)
          : minimum,
      Number.MAX_SAFE_INTEGER,
    );
    const width =
      timelineContentWidth ||
      event.currentTarget.closest(".track-body")?.clientWidth ||
      1;
    timelineDragState.current = {
      mode,
      instanceId: instance.id,
      pointerX: event.clientX,
      startFrame: instance.startFrame,
      durationInFrames: instance.durationInFrames,
      baseDurationInFrames: durationInFrames,
      sourceStartFrame: instance.sourceStartFrame,
      width,
      members,
      minStartFrame: Math.min(...members.map((member) => member.startFrame)),
      maxEndFrame: Math.max(
        ...members.map(
          (member) => member.startFrame + member.durationInFrames,
        ),
      ),
      collisionMinDelta,
      collisionMaxDelta,
      previousEndFrame,
      nextStartFrame,
      moved: false,
    };
  };

  useEffect(() => {
    const extendTimelineTo = (endFrame: number) => {
      setManualTimelineEndFrame((current) =>
        endFrame > current ? Math.ceil(endFrame) : current,
      );
    };
    const moveTimeline = (event: PointerEvent) => {
      const state = timelineDragState.current;
      if (!state) return;
      event.preventDefault();
      // 帧换算固定用拖拽开始时的总长，避免时间轴扩展后 delta 正反馈放大
      const deltaFrames = Math.round(
        ((event.clientX - state.pointerX) / state.width) *
          state.baseDurationInFrames,
      );
      if (Math.abs(event.clientX - state.pointerX) > 2) {
        state.moved = true;
      }
      const minFrames = Math.max(3, Math.round(fps * 0.1));
      if (state.mode === "move") {
        const safeDeltaFrames = clamp(
          deltaFrames,
          Math.max(-state.minStartFrame, state.collisionMinDelta),
          state.collisionMaxDelta,
        );
        const newMaxEnd = state.maxEndFrame + safeDeltaFrames;
        if (newMaxEnd > durationInFrames) {
          extendTimelineTo(newMaxEnd);
        }
        const memberMap = new Map<
          string,
          {
            id: string;
            startFrame: number;
            durationInFrames: number;
          }
        >(
          state.members.map((member) => [member.id, member]),
        );
        setInstances((current) =>
          current.map((instance) => {
            const member = memberMap.get(instance.id);
            return member
              ? {
                  ...instance,
                  startFrame: member.startFrame + safeDeltaFrames,
                }
              : instance;
          }),
        );
        return;
      }
      updateInstance(state.instanceId, (instance) => {
        if (state.mode === "left") {
          const right = state.startFrame + state.durationInFrames;
          const startFrame = clamp(
            state.startFrame + deltaFrames,
            Math.max(
              state.previousEndFrame,
              0,
              state.startFrame - state.sourceStartFrame,
            ),
            right - minFrames,
          );
          return {
            ...instance,
            startFrame,
            sourceStartFrame:
              state.sourceStartFrame + (startFrame - state.startFrame),
            durationInFrames: right - startFrame,
          };
        }
        const nextDuration = clamp(
          state.durationInFrames + deltaFrames,
          minFrames,
          state.nextStartFrame - state.startFrame,
        );
        const newEnd = state.startFrame + nextDuration;
        if (newEnd > durationInFrames) {
          extendTimelineTo(newEnd);
        }
        return {
          ...instance,
          durationInFrames: nextDuration,
        };
      });
    };
    const finishTimeline = () => {
      const state = timelineDragState.current;
      if (state && state.members.length > 1 && !state.moved) {
        selectOnlyInstance(state.instanceId);
      }
      timelineDragState.current = null;
    };
    window.addEventListener("pointermove", moveTimeline, { passive: false });
    window.addEventListener("pointerup", finishTimeline);
    window.addEventListener("pointercancel", finishTimeline);
    return () => {
      window.removeEventListener("pointermove", moveTimeline);
      window.removeEventListener("pointerup", finishTimeline);
      window.removeEventListener("pointercancel", finishTimeline);
    };
  }, [durationInFrames, fps, selectOnlyInstance, updateInstance]);

  const timelineResizeState = useRef<{
    pointerY: number;
    height: number;
  } | null>(null);
  const trackResizeState = useRef<{
    laneId: string;
    pointerY: number;
    height: number;
  } | null>(null);

  const beginTimelineResize = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    timelineResizeState.current = {
      pointerY: event.clientY,
      height: timelineHeight,
    };
  };

  const beginTrackResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    laneId: string,
    height: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    trackResizeState.current = {
      laneId,
      pointerY: event.clientY,
      height,
    };
  };

  useEffect(() => {
    const resizeTimeline = (event: PointerEvent) => {
      const state = timelineResizeState.current;
      if (!state) return;
      event.preventDefault();
      setTimelineHeight(
        clamp(
          state.height + state.pointerY - event.clientY,
          180,
          Math.max(260, window.innerHeight - 210),
        ),
      );
    };
    const finishTimelineResize = () => {
      timelineResizeState.current = null;
    };
    window.addEventListener("pointermove", resizeTimeline, { passive: false });
    window.addEventListener("pointerup", finishTimelineResize);
    window.addEventListener("pointercancel", finishTimelineResize);
    return () => {
      window.removeEventListener("pointermove", resizeTimeline);
      window.removeEventListener("pointerup", finishTimelineResize);
      window.removeEventListener("pointercancel", finishTimelineResize);
    };
  }, []);

  useEffect(() => {
    const resizeTrack = (event: PointerEvent) => {
      const state = trackResizeState.current;
      if (!state) return;
      event.preventDefault();
      setTrackHeights((heights) => ({
        ...heights,
        [state.laneId]: clamp(state.height + event.clientY - state.pointerY, 30, 180),
      }));
    };
    const finishTrackResize = () => {
      trackResizeState.current = null;
    };
    window.addEventListener("pointermove", resizeTrack, { passive: false });
    window.addEventListener("pointerup", finishTrackResize);
    window.addEventListener("pointercancel", finishTrackResize);
    return () => {
      window.removeEventListener("pointermove", resizeTrack);
      window.removeEventListener("pointerup", finishTrackResize);
      window.removeEventListener("pointercancel", finishTrackResize);
    };
  }, []);

  const timelineMarqueeState = useRef<{
    startX: number;
    startY: number;
    containerLeft: number;
    containerTop: number;
    containerWidth: number;
    containerHeight: number;
    candidates: Array<{
      id: string;
      left: number;
      top: number;
      right: number;
      bottom: number;
    }>;
  } | null>(null);

  const beginTimelineMarquee = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest(".clip, button")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const startX = clamp(event.clientX - bounds.left, 0, bounds.width);
    const startY = clamp(event.clientY - bounds.top, 0, bounds.height);
    const clips = event.currentTarget.querySelectorAll<HTMLElement>(
      ".clip[data-instance-id]",
    );
    const candidates = Array.from(clips as NodeListOf<HTMLElement>).map(
      (clip: HTMLElement) => {
      const clipBounds = clip.getBoundingClientRect();
      return {
        id: clip.dataset.instanceId ?? "",
        left: clipBounds.left,
        top: clipBounds.top,
        right: clipBounds.right,
        bottom: clipBounds.bottom,
      };
      },
    );
    event.preventDefault();
    setContextMenu(null);
    selectOnlyInstance("");
    timelineMarqueeState.current = {
      startX,
      startY,
      containerLeft: bounds.left,
      containerTop: bounds.top,
      containerWidth: bounds.width,
      containerHeight: bounds.height,
      candidates,
    };
    setTimelineMarquee({
      left: (startX / bounds.width) * 100,
      top: (startY / bounds.height) * 100,
      width: 0,
      height: 0,
    });
  };

  useEffect(() => {
    const moveTimelineMarquee = (event: PointerEvent) => {
      const state = timelineMarqueeState.current;
      if (!state) return;
      event.preventDefault();
      const currentX = clamp(
        event.clientX - state.containerLeft,
        0,
        state.containerWidth,
      );
      const currentY = clamp(
        event.clientY - state.containerTop,
        0,
        state.containerHeight,
      );
      setTimelineMarquee({
        left:
          (Math.min(state.startX, currentX) / state.containerWidth) * 100,
        top:
          (Math.min(state.startY, currentY) / state.containerHeight) * 100,
        width:
          (Math.abs(currentX - state.startX) / state.containerWidth) * 100,
        height:
          (Math.abs(currentY - state.startY) / state.containerHeight) * 100,
      });
    };
    const finishTimelineMarquee = (event: PointerEvent) => {
      const state = timelineMarqueeState.current;
      if (!state) return;
      const currentX = clamp(
        event.clientX - state.containerLeft,
        0,
        state.containerWidth,
      );
      const currentY = clamp(
        event.clientY - state.containerTop,
        0,
        state.containerHeight,
      );
      const left =
        state.containerLeft + Math.min(state.startX, currentX);
      const top = state.containerTop + Math.min(state.startY, currentY);
      const right =
        state.containerLeft + Math.max(state.startX, currentX);
      const bottom =
        state.containerTop + Math.max(state.startY, currentY);
      const selectedIds = state.candidates
        .filter(
          (candidate) =>
            candidate.id &&
            candidate.right >= left &&
            candidate.left <= right &&
            candidate.bottom >= top &&
            candidate.top <= bottom,
        )
        .map((candidate) => candidate.id);
      setSelectedInstanceIds(selectedIds);
      setSelectedInstanceId(selectedIds.at(-1) ?? "");
      timelineMarqueeState.current = null;
      setTimelineMarquee(null);
    };
    const cancelTimelineMarquee = () => {
      timelineMarqueeState.current = null;
      setTimelineMarquee(null);
    };
    window.addEventListener("pointermove", moveTimelineMarquee, {
      passive: false,
    });
    window.addEventListener("pointerup", finishTimelineMarquee);
    window.addEventListener("pointercancel", cancelTimelineMarquee);
    return () => {
      window.removeEventListener("pointermove", moveTimelineMarquee);
      window.removeEventListener("pointerup", finishTimelineMarquee);
      window.removeEventListener("pointercancel", cancelTimelineMarquee);
    };
  }, []);

  const canvasDragState = useRef<{
    mode: "move" | "scale";
    instanceId: string;
    memberIds: string[];
    pointerX: number;
    pointerY: number;
    positions: Record<string, { x: number; y: number }>;
    scale: number;
    playerWidth: number;
    playerHeight: number;
    moved: boolean;
  } | null>(null);

  const beginCanvasTransform = (
    event: React.PointerEvent<HTMLElement>,
    mode: "move" | "scale",
    instance: MotionInstance,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const player = event.currentTarget.closest(".player-wrap");
    const bounds = player?.getBoundingClientRect();
    if (!bounds) return;
    const keepGroup =
      mode === "move" &&
      selectedInstanceIds.length > 1 &&
      selectedInstanceIdSet.has(instance.id);
    const memberIds = keepGroup ? selectedInstanceIds : [instance.id];
    if (keepGroup) {
      setSelectedInstanceId(instance.id);
    } else {
      selectOnlyInstance(instance.id);
    }
    const memberIdSet = new Set(memberIds);
    const positions = Object.fromEntries(
      instances
        .filter((candidate) => memberIdSet.has(candidate.id))
        .map((candidate) => [
          candidate.id,
          {
            x: candidate.position.x,
            y: candidate.position.y,
          },
        ]),
    );
    canvasDragState.current = {
      mode,
      instanceId: instance.id,
      memberIds,
      pointerX: event.clientX,
      pointerY: event.clientY,
      positions,
      scale: instance.position.scale,
      playerWidth: bounds.width,
      playerHeight: bounds.height,
      moved: false,
    };
  };

  useEffect(() => {
    const moveCanvasTransform = (event: PointerEvent) => {
      const state = canvasDragState.current;
      if (!state) return;
      event.preventDefault();
      const deltaX = event.clientX - state.pointerX;
      const deltaY = event.clientY - state.pointerY;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        state.moved = true;
      }
      if (state.mode === "move") {
        const designDeltaX = (deltaX / state.playerWidth) * canvasWidth;
        const designDeltaY = (deltaY / state.playerHeight) * canvasHeight;
        setInstances((current) =>
          current.map((instance) => {
            const start = state.positions[instance.id];
            if (!start) return instance;
            return {
              ...instance,
              position: {
                ...instance.position,
                x: Math.round(start.x + designDeltaX),
                y: Math.round(start.y + designDeltaY),
              },
            };
          }),
        );
        return;
      }
      updateInstance(state.instanceId, (instance) => ({
        ...instance,
        position: {
          ...instance.position,
          scale: clamp(
            state.scale + (deltaX / state.playerWidth) * 2,
            0.1,
            3,
          ),
        },
      }));
    };
    const finishCanvasTransform = () => {
      const state = canvasDragState.current;
      if (
        state &&
        state.mode === "move" &&
        state.memberIds.length > 1 &&
        !state.moved
      ) {
        selectOnlyInstance(state.instanceId);
      }
      canvasDragState.current = null;
    };
    window.addEventListener("pointermove", moveCanvasTransform, {
      passive: false,
    });
    window.addEventListener("pointerup", finishCanvasTransform);
    window.addEventListener("pointercancel", finishCanvasTransform);
    return () => {
      window.removeEventListener("pointermove", moveCanvasTransform);
      window.removeEventListener("pointerup", finishCanvasTransform);
      window.removeEventListener("pointercancel", finishCanvasTransform);
    };
  }, [canvasHeight, canvasWidth, selectOnlyInstance, updateInstance]);

  const marqueeDragState = useRef<{
    startX: number;
    startY: number;
    playerLeft: number;
    playerTop: number;
    playerWidth: number;
    playerHeight: number;
    candidates: Array<{
      id: string;
      left: number;
      top: number;
      right: number;
      bottom: number;
    }>;
  } | null>(null);

  const beginMarqueeSelection = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        ".canvas-selection, button, input, select, [role='slider']",
      )
    ) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const startX = clamp(event.clientX - bounds.left, 0, bounds.width);
    const startY = clamp(event.clientY - bounds.top, 0, bounds.height);
    const candidates = instances.flatMap((instance) => {
      const definition = definitionMap.get(instance.componentId);
      const isVisible =
        instance.visible !== false &&
        currentFrame >= instance.startFrame &&
        currentFrame < instance.startFrame + instance.durationInFrames;
      if (!definition || !isVisible) return [];
      const left =
        instance.position.x +
        definition.bounds.x * instance.position.scale;
      const top =
        instance.position.y +
        definition.bounds.y * instance.position.scale;
      return [
        {
          id: instance.id,
          left,
          top,
          right:
            left + definition.bounds.width * instance.position.scale,
          bottom:
            top + definition.bounds.height * instance.position.scale,
        },
      ];
    });
    event.preventDefault();
    setContextMenu(null);
    selectOnlyInstance("");
    marqueeDragState.current = {
      startX,
      startY,
      playerLeft: bounds.left,
      playerTop: bounds.top,
      playerWidth: bounds.width,
      playerHeight: bounds.height,
      candidates,
    };
    setMarquee({
      left: (startX / bounds.width) * 100,
      top: (startY / bounds.height) * 100,
      width: 0,
      height: 0,
    });
  };

  useEffect(() => {
    const moveMarquee = (event: PointerEvent) => {
      const state = marqueeDragState.current;
      if (!state) return;
      event.preventDefault();
      const currentX = clamp(
        event.clientX - state.playerLeft,
        0,
        state.playerWidth,
      );
      const currentY = clamp(
        event.clientY - state.playerTop,
        0,
        state.playerHeight,
      );
      const left = Math.min(state.startX, currentX);
      const top = Math.min(state.startY, currentY);
      setMarquee({
        left: (left / state.playerWidth) * 100,
        top: (top / state.playerHeight) * 100,
        width:
          (Math.abs(currentX - state.startX) / state.playerWidth) * 100,
        height:
          (Math.abs(currentY - state.startY) / state.playerHeight) * 100,
      });
    };
    const finishMarquee = (event: PointerEvent) => {
      const state = marqueeDragState.current;
      if (!state) return;
      const currentX = clamp(
        event.clientX - state.playerLeft,
        0,
        state.playerWidth,
      );
      const currentY = clamp(
        event.clientY - state.playerTop,
        0,
        state.playerHeight,
      );
      const left =
        (Math.min(state.startX, currentX) / state.playerWidth) * canvasWidth;
      const top =
        (Math.min(state.startY, currentY) / state.playerHeight) * canvasHeight;
      const right =
        (Math.max(state.startX, currentX) / state.playerWidth) * canvasWidth;
      const bottom =
        (Math.max(state.startY, currentY) / state.playerHeight) * canvasHeight;
      const selectedIds = state.candidates
        .filter(
          (candidate) =>
            candidate.right >= left &&
            candidate.left <= right &&
            candidate.bottom >= top &&
            candidate.top <= bottom,
        )
        .map((candidate) => candidate.id);
      setSelectedInstanceIds(selectedIds);
      setSelectedInstanceId(selectedIds.at(-1) ?? "");
      marqueeDragState.current = null;
      setMarquee(null);
    };
    const cancelMarquee = () => {
      marqueeDragState.current = null;
      setMarquee(null);
    };
    window.addEventListener("pointermove", moveMarquee, { passive: false });
    window.addEventListener("pointerup", finishMarquee);
    window.addEventListener("pointercancel", cancelMarquee);
    return () => {
      window.removeEventListener("pointermove", moveMarquee);
      window.removeEventListener("pointerup", finishMarquee);
      window.removeEventListener("pointercancel", cancelMarquee);
    };
  }, [canvasHeight, canvasWidth]);

  const showComponentMenu = (
    event: React.MouseEvent,
    source: "preview" | "timeline",
    instanceId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const keepGroup =
      selectedInstanceIds.length > 1 &&
      selectedInstanceIdSet.has(instanceId);
    const instanceIds = keepGroup ? selectedInstanceIds : [instanceId];
    if (keepGroup) {
      setSelectedInstanceId(instanceId);
    } else {
      selectOnlyInstance(instanceId);
    }
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 118),
      source,
      instanceIds,
    });
  };

  const showVideoTrackMenu = (
    event: React.MouseEvent,
    trackId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    selectVideoTrack(trackId);
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 92),
      source: "videoTimeline",
      instanceIds: [],
      videoTrackId: trackId,
    });
  };

  const showResourceTrackMenu = (
    event: React.MouseEvent,
    trackId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    selectResourceTrack(trackId);
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 92),
      source: "resourceTimeline",
      instanceIds: [],
      resourceTrackId: trackId,
    });
  };

  const openEffectInCodeEditor = async (componentId: string) => {
    setContextMenu(null);
    try {
      const response = await fetch(
        `/api/effect-source?id=${encodeURIComponent(componentId)}`,
      );
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "读取效果源码失败");
      }
      setCodeTemplate(String(payload.code ?? ""));
      const definition =
        definitionMap.get(componentId) ?? EFFECT_REGISTRY_BY_ID.get(componentId);
      setCodeTemplateName(definition?.name ?? componentId);
      setActiveWorkspace("code");
      setNotice({ tone: "info", text: "已载入该效果源码，修改后可点导入生成新组件。" });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "读取效果源码失败",
      });
    }
  };

  const showLibraryMenu = (event: React.MouseEvent, componentId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 200),
      y: Math.min(event.clientY, window.innerHeight - 180),
      source: "library",
      instanceIds: [],
      componentId,
    });
  };

  const showLibraryGroupMenu = (
    event: React.MouseEvent,
    group: { id: string; name: string; items: Array<{ ids: string[] }> },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 126),
      source: "libraryGroup",
      instanceIds: [],
      groupId: group.id,
      groupName: group.name,
      groupComponentIds: group.items.map((item) => item.ids[0]),
    });
  };

  const showLibraryRootMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 82),
      source: "libraryRoot",
      instanceIds: [],
    });
  };

  const stopSfxLibraryPreview = () => {
    sfxLibraryAudioPreviewRef.current?.pause();
    sfxLibraryAudioPreviewRef.current = null;
    setPreviewingSfxId("");
  };

  const toggleSfxLibraryPreview = (sound: SoundResource) => {
    if (previewingSfxId === sound.id) {
      stopSfxLibraryPreview();
      return;
    }
    stopSfxLibraryPreview();
    const audio = new window.Audio(sound.url);
    audio.volume = 0.65;
    audio.onended = () => {
      sfxLibraryAudioPreviewRef.current = null;
      setPreviewingSfxId("");
    };
    sfxLibraryAudioPreviewRef.current = audio;
    setPreviewingSfxId(sound.id);
    void audio.play().catch(() => {
      stopSfxLibraryPreview();
      setNotice({ tone: "error", text: `无法试听“${sound.label}”。` });
    });
  };

  useEffect(() => {
    if (!previewingSfxId) return;
    const stillVisible = sfxCatalog.some((section) =>
      section.items.some((sound) => sound.id === previewingSfxId),
    );
    if (!stillVisible) stopSfxLibraryPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sfxCatalog, previewingSfxId]);

  const openSfxFileLocation = async (soundId: string) => {
    try {
      const response = await fetch("/api/open-sfx-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soundId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "无法打开音效所在位置");
      }
      setNotice({ tone: "ok", text: "已在资源管理器中定位音效文件。" });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "无法打开音效所在位置",
      });
    }
  };

  const deleteManualSfxResource = async (sound: SoundResource) => {
    if (sound.source !== "manual") return;
    if (
      resourceTracks.some(
        (track) => track.kind === "sfx" && track.resourceId === sound.id,
      )
    ) {
      setNotice({ tone: "error", text: "请先从时间线移除这个音效，再删除资源。" });
      return;
    }
    if (!window.confirm(`确定从音效库删除“${sound.label}”吗？`)) return;
    stopSfxLibraryPreview();
    try {
      const response = await fetch("/api/delete-manual-sfx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soundId: sound.id }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "音效删除失败");
      }
      setArrangementResourceLibrary((current) => ({
        ...current,
        sfx: current.sfx.filter((item) => item.id !== sound.id),
      }));
      setNotice({ tone: "ok", text: `已删除音效“${sound.label}”。` });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "音效删除失败",
      });
    }
  };

  const openIconFileLocation = async (iconId: string) => {
    setContextMenu(null);
    try {
      const response = await fetch("/api/open-icon-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iconId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "无法打开图标所在位置");
      }
      setNotice({ tone: "ok", text: "已在资源管理器中定位图标文件。" });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "无法打开图标所在位置",
      });
    }
  };

  const deleteManualIcon = async (icon: IconResource) => {
    setContextMenu(null);
    if (icon.source !== "manual") {
      setNotice({ tone: "error", text: "内置图标不能删除。" });
      return;
    }
    if (resourceTracks.some((track) => track.kind === "icon" && track.resourceId === icon.id)) {
      setNotice({ tone: "error", text: "请先从时间线移除这个图标，再删除资源。" });
      return;
    }
    if (!window.confirm(`确定删除“${icon.label}”吗？`)) return;
    try {
      const response = await fetch("/api/delete-manual-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iconId: icon.id }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "图标删除失败");
      }
      setIconResources((current) => current.filter((item) => item.id !== icon.id));
      setArrangementResourceLibrary((current) => ({
        ...current,
        icon: current.icon.filter((item) => item.id !== icon.id),
      }));
      setNotice({ tone: "ok", text: `已删除“${icon.label}”。` });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "图标删除失败",
      });
    }
  };

  const showIconLibraryMenu = (
    event: React.MouseEvent,
    category = "内容与素材",
    iconId?: string,
    iconGroupId?: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 210),
      y: Math.min(event.clientY, window.innerHeight - 82),
      source: "iconLibrary",
      instanceIds: [],
      groupName: category,
      iconId,
      iconGroupId,
    });
  };

  const createIconGroup = async () => {
    const name = window.prompt("新图标分组名称（最多 20 个字）")?.trim().slice(0, 20);
    if (!name) return;
    setContextMenu(null);
    try {
      const response = await fetch("/api/icon-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.group) throw new Error(payload?.error ?? "新建分组失败");
      const group = payload.group as IconCategoryGroup;
      setCustomIconGroups((current) => [...current, group]);
      setOpenIconCategories((current) => [...current, group.name]);
      setNotice({ tone: "ok", text: `已新建图标分组“${group.name}”。` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "新建分组失败" });
    }
  };

  const deleteIconGroup = async (group: IconCategoryGroup) => {
    setContextMenu(null);
    if (!window.confirm(`删除空分组“${group.name}”吗？`)) return;
    try {
      const response = await fetch(`/api/icon-groups?id=${encodeURIComponent(group.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? "删除分组失败");
      setCustomIconGroups((current) => current.filter((item) => item.id !== group.id));
      setOpenIconCategories((current) => current.filter((name) => name !== group.name));
      setNotice({ tone: "ok", text: `已删除图标分组“${group.name}”。` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "删除分组失败" });
    }
  };

  const openRenameIconGroupDialog = (group: IconCategoryGroup) => {
    setContextMenu(null);
    setIconGroupRenameTarget(group);
    setIconGroupNameDraft(group.name);
  };

  const saveIconGroupRename = async () => {
    const group = iconGroupRenameTarget;
    const name = iconGroupNameDraft.trim().slice(0, 20);
    if (!group || !name || name === group.name) {
      setIconGroupRenameTarget(null);
      return;
    }
    try {
      const response = await fetch(`/api/icon-groups?id=${encodeURIComponent(group.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.group) throw new Error(payload?.error ?? "重命名分组失败");
      const renamed = payload.group as IconCategoryGroup;
      setCustomIconGroups((current) =>
        current.map((item) => (item.id === renamed.id ? renamed : item)),
      );
      setOpenIconCategories((current) =>
        current.map((category) => (category === group.name ? renamed.name : category)),
      );
      setIconResources((current) =>
        current.map((icon) =>
          icon.category === group.name
            ? { ...icon, category: renamed.name, accent: renamed.accent }
            : icon,
        ),
      );
      setArrangementResourceLibrary((current) => ({
        ...current,
        icon: current.icon.map((icon) =>
          icon.category === group.name
            ? { ...icon, category: renamed.name, accent: renamed.accent }
            : icon,
        ),
      }));
      setIconGroupRenameTarget(null);
      setNotice({ tone: "ok", text: `已将分组重命名为“${renamed.name}”。` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "重命名分组失败" });
    }
  };

  const updateIconGroupColor = async (
    group: IconCategoryGroup,
    accent: string,
  ) => {
    if (group.builtin || !/^#[0-9a-f]{6}$/i.test(accent)) return;
    try {
      const response = await fetch(`/api/icon-groups?id=${encodeURIComponent(group.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accent }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.group) throw new Error(payload?.error ?? "分组颜色保存失败");
      const updated = payload.group as IconCategoryGroup;
      setCustomIconGroups((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setIconResources((current) =>
        current.map((icon) =>
          icon.category === updated.name ? { ...icon, accent: updated.accent } : icon,
        ),
      );
      setArrangementResourceLibrary((current) => ({
        ...current,
        icon: current.icon.map((icon) =>
          icon.category === updated.name ? { ...icon, accent: updated.accent } : icon,
        ),
      }));
      setNotice({ tone: "ok", text: `已更新“${updated.name}”的分组颜色。` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "分组颜色保存失败" });
    }
  };

  const showSfxLibraryMenu = (
    event: React.MouseEvent,
    options: { sfxGroupId?: string; soundId?: string; groupName?: string } = {},
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 210),
      y: Math.min(event.clientY, window.innerHeight - 120),
      source: options.soundId ? "sfxItem" : "sfxLibrary",
      instanceIds: [],
      sfxGroupId: options.sfxGroupId,
      soundId: options.soundId,
      groupName: options.groupName,
    });
  };

  const createSfxGroup = async () => {
    const name = window.prompt("新音效分组名称（最多 20 个字）")?.trim().slice(0, 20);
    if (!name) return;
    setContextMenu(null);
    try {
      const response = await fetch("/api/sfx-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.group) throw new Error(payload?.error ?? "新建分组失败");
      const group = payload.group as IconCategoryGroup;
      setCustomSfxGroups((current) => [...current, group]);
      setOpenSfxGroups((current) => [...current, group.name]);
      setNotice({ tone: "ok", text: `已新建音效分组“${group.name}”。` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "新建分组失败" });
    }
  };

  const deleteSfxGroup = async (group: IconCategoryGroup) => {
    setContextMenu(null);
    const memberCount = (arrangementResourceLibrary.sfx as SoundResource[]).filter(
      (sound) => sound.category === group.name,
    ).length;
    const message =
      memberCount > 0
        ? `删除音效分组“${group.name}”吗？组内 ${memberCount} 个音效会移回默认分组，不会被删除。`
        : `删除空分组“${group.name}”吗？`;
    if (!window.confirm(message)) return;
    try {
      const response = await fetch(`/api/sfx-groups?id=${encodeURIComponent(group.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? "删除分组失败");
      setCustomSfxGroups((current) => current.filter((item) => item.id !== group.id));
      setOpenSfxGroups((current) => current.filter((name) => name !== group.name));
      setArrangementResourceLibrary((current) => ({
        ...current,
        sfx: current.sfx.map((sound) =>
          sound.category === group.name
            ? { ...sound, category: sound.source === "manual" ? "自定义音效" : "音效" }
            : sound,
        ),
      }));
      setNotice({ tone: "ok", text: `已删除音效分组“${group.name}”。` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "删除分组失败" });
    }
  };

  const openRenameSfxGroupDialog = (group: IconCategoryGroup) => {
    setContextMenu(null);
    setSfxGroupRenameTarget(group);
    setSfxGroupNameDraft(group.name);
  };

  const saveSfxGroupRename = async () => {
    const group = sfxGroupRenameTarget;
    const name = sfxGroupNameDraft.trim().slice(0, 20);
    if (!group || !name || name === group.name) {
      setSfxGroupRenameTarget(null);
      return;
    }
    try {
      const response = await fetch(`/api/sfx-groups?id=${encodeURIComponent(group.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.group) throw new Error(payload?.error ?? "重命名分组失败");
      const renamed = payload.group as IconCategoryGroup;
      setCustomSfxGroups((current) =>
        current.map((item) => (item.id === renamed.id ? renamed : item)),
      );
      setOpenSfxGroups((current) =>
        current.map((section) => (section === group.name ? renamed.name : section)),
      );
      setArrangementResourceLibrary((current) => ({
        ...current,
        sfx: current.sfx.map((sound) =>
          sound.category === group.name
            ? {
                ...sound,
                category: renamed.name,
                tags: sound.tags.map((tag) => (tag === group.name ? renamed.name : tag)),
              }
            : sound,
        ),
      }));
      setSfxGroupRenameTarget(null);
      setNotice({ tone: "ok", text: `已将音效分组重命名为“${renamed.name}”。` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "重命名分组失败" });
    }
  };

  const moveSfxToGroup = async (sound: SoundResource, groupName: string) => {
    setContextMenu(null);
    try {
      const response = await fetch("/api/sfx-group-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soundId: sound.id, groupName }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? "移动音效失败");
      const nextCategory = groupName
        ? groupName
        : sound.source === "manual"
          ? "自定义音效"
          : "音效";
      setArrangementResourceLibrary((current) => ({
        ...current,
        sfx: current.sfx.map((item) =>
          item.id === sound.id ? { ...item, category: nextCategory } : item,
        ),
      }));
      setOpenSfxGroups((current) =>
        groupName && !current.includes(groupName) ? [...current, groupName] : current,
      );
      setNotice({
        tone: "ok",
        text: groupName
          ? `已将“${sound.label}”移入“${groupName}”。`
          : `已将“${sound.label}”移回默认分组。`,
      });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "移动音效失败" });
    }
  };

  const openIconImportPicker = (category = "内容与素材") => {
    iconImportCategoryRef.current = category;
    setContextMenu(null);
    iconImportInput.current?.click();
  };

  const openSfxImportPicker = () => sfxImportInput.current?.click();

  const openNewGroupDialog = () => {
    setContextMenu(null);
    setGroupRenameTarget(null);
    setGroupNameDraft("");
    setGroupDialogOpen(true);
  };

  const openRenameGroupDialog = (groupId: string, groupName: string) => {
    const group = effectCatalog.find((item) => item.id === groupId);
    setContextMenu(null);
    if (!group) return;
    setGroupRenameTarget({ id: group.id, name: group.name });
    setGroupNameDraft(groupName);
    setGroupDialogOpen(true);
  };

  const createCatalogGroup = () => {
    const name = groupNameDraft.trim().slice(0, 30);
    if (!name) return;
    const group = { id: `custom-${Date.now()}`, name };
    setCustomCatalogGroups((current) => {
      const next = [...current, group];
      window.localStorage.setItem(
        CUSTOM_GROUP_STORAGE_KEY,
        JSON.stringify(next),
      );
      return next;
    });
    setOpenCatalogCategories((current) => [...current, group.id]);
    setGroupDialogOpen(false);
    setGroupNameDraft("");
    setNotice({ tone: "ok", text: `已新建分组“${name}”。` });
  };

  const renameCatalogGroup = () => {
    const name = groupNameDraft.trim().slice(0, 30);
    if (!name || !groupRenameTarget) return;
    const previousName = groupRenameTarget.name;
    const isCustomGroup = customCatalogGroups.some(
      (group) => group.id === groupRenameTarget.id,
    );
    if (isCustomGroup) {
      setCustomCatalogGroups((current) => {
        const next = current.map((group) =>
          group.id === groupRenameTarget.id ? { ...group, name } : group,
        );
        window.localStorage.setItem(
          CUSTOM_GROUP_STORAGE_KEY,
          JSON.stringify(next),
        );
        return next;
      });
    } else {
      setEffectGroupNameOverrides((current) => {
        const next = { ...current, [groupRenameTarget.id]: name };
        window.localStorage.setItem(
          EFFECT_GROUP_NAME_STORAGE_KEY,
          JSON.stringify(next),
        );
        return next;
      });
    }
    setGroupDialogOpen(false);
    setGroupRenameTarget(null);
    setGroupNameDraft("");
    setNotice({ tone: "ok", text: `已将“${previousName}”重命名为“${name}”。` });
  };

  const updateEffectGroupColor = (groupId: string, groupName: string, accent: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(accent)) return;
    setEffectGroupColorOverrides((current) => {
      const next = { ...current, [groupId]: accent.toLowerCase() };
      window.localStorage.setItem(
        EFFECT_GROUP_COLOR_STORAGE_KEY,
        JSON.stringify(next),
      );
      return next;
    });
    setNotice({ tone: "ok", text: `已更新“${groupName}”的分组颜色。` });
  };

  const requestDeleteCatalogGroup = (
    groupId: string,
    groupName: string,
    componentIds: string[],
  ) => {
    setContextMenu(null);
    setPendingGroupDelete({ groupId, groupName, componentIds });
  };

  const openMoveEffectDialog = (componentId: string) => {
    const currentGroup = effectCatalog.find((group) =>
      group.items.some((item) => item.ids[0] === componentId),
    );
    const definition = definitionMap.get(componentId);
    setContextMenu(null);
    if (!definition) {
      setNotice({ tone: "error", text: "未找到该效果。" });
      return;
    }
    setEffectMoveTarget({
      componentId,
      effectName: definition.name,
      currentGroupId: currentGroup?.id ?? "",
    });
  };

  const moveEffectToGroup = (groupId: string, groupName: string) => {
    if (!effectMoveTarget || groupId === effectMoveTarget.currentGroupId) return;
    const effectName = effectMoveTarget.effectName;
    setEffectGroupAssignments((current) => {
      const next = { ...current, [effectMoveTarget.componentId]: groupId };
      window.localStorage.setItem(EFFECT_GROUP_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setOpenCatalogCategories((current) =>
      current.includes(groupId) ? current : [...current, groupId],
    );
    setEffectMoveTarget(null);
    setNotice({ tone: "ok", text: `已将“${effectName}”移动到“${groupName}”。` });
  };

  const deleteCatalogGroup = async ({
    groupId,
    groupName,
    componentIds,
  }: PendingGroupDelete) => {
    const isCustomGroup = customCatalogGroups.some(
      (group) => group.id === groupId,
    );
    setPendingGroupDelete(null);
    if (isCustomGroup && componentIds.length === 0) {
      setCustomCatalogGroups((current) => {
        const next = current.filter((group) => group.id !== groupId);
        window.localStorage.setItem(
          CUSTOM_GROUP_STORAGE_KEY,
          JSON.stringify(next),
        );
        return next;
      });
      setOpenCatalogCategories((current) =>
        current.filter((id) => id !== groupId),
      );
      setNotice({ tone: "ok", text: `已删除分组“${groupName}”。` });
      return;
    }
    try {
      setNotice({ tone: "info", text: `正在删除“${groupName}”及组内源码…` });
      const response = await fetch("/api/delete-effect-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentIds }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "删除分组失败");
      const idSet = new Set(componentIds);
      setInstances((current) =>
        current.filter((instance) => !idSet.has(instance.componentId)),
      );
      setEffectGroupAssignments((current) => {
        const next = Object.fromEntries(
          Object.entries(current).filter(([componentId]) => !idSet.has(componentId)),
        );
        window.localStorage.setItem(EFFECT_GROUP_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setEffectNameOverrides((current) => {
        const next = Object.fromEntries(
          Object.entries(current).filter(([componentId]) => !idSet.has(componentId)),
        );
        window.localStorage.setItem(EFFECT_NAME_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      if (isCustomGroup) {
        setCustomCatalogGroups((current) => {
          const next = current.filter((group) => group.id !== groupId);
          window.localStorage.setItem(CUSTOM_GROUP_STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      }
      setNotice({ tone: "ok", text: `已彻底删除分组“${groupName}”。` });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "删除分组失败",
      });
    }
  };

  const permanentlyDeleteEffect = async (componentId: string) => {
    setContextMenu(null);
    setNotice({ tone: "info", text: "正在彻底删除效果源码与时间轴实例…" });
    try {
      const response = await fetch("/api/delete-effect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId,
          imported: !EFFECT_REGISTRY_BY_ID.has(componentId),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "删除效果失败");
      setInstances((current) =>
        current.filter((instance) => instance.componentId !== componentId),
      );
      setDefinitions((current) =>
        current.filter((definition) => definition.id !== componentId),
      );
      setEffectGroupAssignments((current) => {
        const next = { ...current };
        delete next[componentId];
        window.localStorage.setItem(EFFECT_GROUP_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setEffectNameOverrides((current) => {
        const next = { ...current };
        delete next[componentId];
        window.localStorage.setItem(EFFECT_NAME_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setNotice({ tone: "ok", text: "已删除效果源码及全部时间轴实例。" });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "删除效果失败",
      });
    }
  };

  const duplicateInstances = (instanceIds: string[]) => {
    const idSet = new Set(instanceIds);
    const frameOffset = Math.max(1, Math.round(fps * 0.15));
    const duplicates = instances
      .filter((instance) => idSet.has(instance.id))
      .map((instance, index) => {
        const id = createInstanceId(instance.componentId);
        return {
        ...instance,
        id,
        laneId: id,
        trackOrder:
          Math.max(
            -1,
            ...videoTracks.map((track) => track.trackOrder),
            ...instances.map((candidate) => candidate.trackOrder),
            ...resourceTracks.map((track) => track.trackOrder),
          ) +
          index +
          1,
        startFrame: clamp(
          instance.startFrame + frameOffset,
          0,
          Math.max(0, durationInFrames - instance.durationInFrames),
        ),
        position: {
          ...instance.position,
          x: instance.position.x + 24 + index * 4,
          y: instance.position.y + 24 + index * 4,
        },
        props: { ...instance.props },
        };
      });
    if (duplicates.length === 0) return;
    setInstances((current) => [...current, ...duplicates]);
    const duplicateIds = duplicates.map((instance) => instance.id);
    setSelectedInstanceIds(duplicateIds);
    setSelectedInstanceId(duplicateIds.at(-1) ?? "");
    setContextMenu(null);
    setNotice({
      tone: "ok",
      text: `已复制 ${duplicates.length} 个组件。`,
    });
  };

  const deleteInstances = (instanceIds: string[]) => {
    const idSet = new Set(instanceIds);
    const removedInstances = instances.filter((instance) =>
      idSet.has(instance.id),
    );
    const remainingTempMediaUrls = new Set(
      instances
        .filter((instance) => !idSet.has(instance.id))
        .map((instance) =>
          typeof instance.props.mediaUrl === "string"
            ? instance.props.mediaUrl.split("?")[0]
            : "",
        )
        .filter((url) => url.startsWith("/api/media/temp/")),
    );
    const removableTempMediaUrls = [
      ...new Set(
        removedInstances
          .filter((instance) =>
            ["MediaSpotlightCard", "MaterialCard"].includes(
              instance.componentId,
            ),
          )
          .map((instance) =>
            typeof instance.props.mediaUrl === "string"
              ? instance.props.mediaUrl.split("?")[0]
              : "",
          )
          .filter(
            (url) =>
              url.startsWith("/api/media/temp/") &&
              !remainingTempMediaUrls.has(url),
          ),
      ),
    ];
    setInstances((current) => {
      const next = current.filter((instance) => !idSet.has(instance.id));
      setSelectedInstanceIds((selectedIds) => {
        const remainingSelected = selectedIds.filter((id) => !idSet.has(id));
        const fallbackIds =
          remainingSelected.length > 0
            ? remainingSelected
            : next[0]?.id
              ? [next[0].id]
              : [];
        setSelectedInstanceId((selected) =>
          idSet.has(selected)
            ? (fallbackIds.at(-1) ?? "")
            : selected,
        );
        return fallbackIds;
      });
      return next;
    });
    for (const url of removableTempMediaUrls) {
      void fetch(url, { method: "DELETE" }).catch(() => {
        // 轨道已删除，单个临时文件清理失败不阻塞编辑。
      });
    }
    setContextMenu(null);
  };

  const openRenameEffectDialog = (componentId: string) => {
    const definition =
      catalogDefinitionMap.get(componentId) ?? definitionMap.get(componentId);
    setContextMenu(null);
    if (!definition) {
      setNotice({ tone: "error", text: "未找到该效果。" });
      return;
    }
    setEffectRenameTarget({
      componentId,
      effectName: definition.name,
    });
    setEffectNameDraft(definition.name);
  };

  const renameEffect = () => {
    const name = effectNameDraft.trim().slice(0, 40);
    if (!name || !effectRenameTarget) return;
    const previousName = effectRenameTarget.effectName;
    setEffectNameOverrides((current) => {
      const next = { ...current, [effectRenameTarget.componentId]: name };
      window.localStorage.setItem(EFFECT_NAME_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setEffectRenameTarget(null);
    setEffectNameDraft("");
    setNotice({
      tone: "ok",
      text: `已将“${previousName}”重命名为“${name}”。`,
    });
  };

  const seekEditorFrame = (frame: number) => {
    const nextFrame = clamp(frame, 0, Math.max(0, durationInFrames - 1));
    playerRef.current?.seekTo(nextFrame);
    setCurrentFrame(nextFrame);
  };

  const focusArrangementIntent = (intentId: string) => {
    if (!activeArrangementBatch) return;
    const intent = intentId
      ? activeArrangementBatch.intents.find((candidate) => candidate.id === intentId)
      : null;
    const motionIds = intent?.motionIds ?? activeArrangementBatch.motionIds;
    const resourceIds = intent?.resourceIds ?? activeArrangementBatch.resourceIds;
    const firstMotion = instances.find((instance) => motionIds.includes(instance.id));
    const firstResource = resourceTracks.find((track) =>
      resourceIds.includes(track.id),
    );
    setActiveArrangementIntentId(intentId);
    if (firstMotion) selectOnlyInstance(firstMotion.id);
    else if (firstResource) selectResourceTrack(firstResource.id);
    seekEditorFrame(intent?.startFrame ?? activeArrangementBatch.startFrame);
    setNotice({
      tone: "info",
      text: intent
        ? `已定位“${intent.label}”语义组；点击具体轨道即可微调。`
        : "已定位并高亮本次自动编排的全部轨道。",
    });
  };

  const undoActiveArrangementBatch = () => {
    if (!activeArrangementBatch) return;
    const removed = removeArrangementBatch({
      batchId: activeArrangementBatch.id,
      motionItems: instances,
      resourceItems: resourceTracks,
    });
    const removedIds = new Set([
      ...activeArrangementBatch.motionIds,
      ...activeArrangementBatch.resourceIds,
    ]);
    setInstances(removed.motionItems);
    setResourceTracks(removed.resourceItems);
    if (removedIds.has(selectedInstanceId) || removedIds.has(selectedResourceTrackId)) {
      setSelectedInstanceId("");
      setSelectedInstanceIds([]);
      setSelectedResourceTrackId("");
    }
    setActiveArrangementBatchId("");
    setActiveArrangementIntentId("");
    setNotice({
      tone: "ok",
      text: `已撤销本次插入：移除 ${activeArrangementBatch.motionIds.length} 个动效和 ${activeArrangementBatch.resourceIds.length} 个资源，原时间线未受影响。`,
    });
  };

  const togglePlayback = () => {
    if (isPlaying) {
      playerRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    // 时间轴是唯一的播放时钟：启动前把 Remotion Player 对齐到播放头，
    // 使视频轨道的 Sequence 与动效轨道从同一帧开始播放。
    const startFrame = currentFrame >= durationInFrames - 1 ? 0 : currentFrame;
    seekEditorFrame(startFrame);
    playerRef.current?.play();
    setIsPlaying(true);
  };

  const goToTimelineStart = () => {
    playerRef.current?.pause();
    setIsPlaying(false);
    seekEditorFrame(0);
  };

  const stepTimeline = (offset: number) => {
    playerRef.current?.pause();
    setIsPlaying(false);
    seekEditorFrame(currentFrame + offset);
  };

  const openShortcutSettings = () => {
    setShortcutDraft({ ...shortcuts });
    setRecordingShortcut(null);
    setShortcutPanelOpen(true);
  };

  const saveShortcutSettings = () => {
    setShortcuts(shortcutDraft);
    window.localStorage.setItem(
      SHORTCUT_STORAGE_KEY,
      JSON.stringify(shortcutDraft),
    );
    setRecordingShortcut(null);
    setShortcutPanelOpen(false);
    setNotice({ tone: "ok", text: "剪辑台快捷键已保存到本机。" });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shortcutPanelOpen) {
        if (recordingShortcut) {
          if (event.key === "Escape") {
            event.preventDefault();
            setRecordingShortcut(null);
            return;
          }
          const nextShortcut = shortcutFromEvent(event);
          if (!nextShortcut) return;
          event.preventDefault();
          setShortcutDraft((current) => {
            const next = { ...current };
            for (const definition of SHORTCUT_DEFINITIONS) {
              if (
                definition.action !== recordingShortcut &&
                next[definition.action] === nextShortcut
              ) {
                next[definition.action] = "";
              }
            }
            next[recordingShortcut] = nextShortcut;
            return next;
          });
          setRecordingShortcut(null);
          return;
        }
        if (event.key === "Escape") {
          setShortcutPanelOpen(false);
        }
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target?.matches("input, textarea, select") ||
        target?.isContentEditable
      ) {
        return;
      }
      const pressedShortcut = shortcutFromEvent(event);
      const action = SHORTCUT_DEFINITIONS.find(
        (definition) => shortcuts[definition.action] === pressedShortcut,
      )?.action;
      if (!action) return;
      event.preventDefault();

      const selectionIds =
        selectedInstanceIds.length > 0
          ? selectedInstanceIds
          : selectedInstanceId
            ? [selectedInstanceId]
            : [];
      if (action === "undo") undoEdit();
      if (action === "redo") redoEdit();
      if (action === "playPause") togglePlayback();
      if (action === "goStart") goToTimelineStart();
      if (action === "previousFrame") stepTimeline(-1);
      if (action === "nextFrame") stepTimeline(1);
      if (action === "splitTrack") splitSelectedTracks(selectionIds);
      if (action === "trimLeft") trimSelectedTracks("left", selectionIds);
      if (action === "trimRight") trimSelectedTracks("right", selectionIds);
      if (action === "toggleVideoTrack") {
        if (selectedVideoTrackId) {
          const selectedTrack = videoTracks.find(
            (track) => track.id === selectedVideoTrackId,
          );
          toggleVideoTrackVisibility(selectedVideoTrackId);
          setNotice({
            tone: "ok",
            text: `${selectedTrack?.name ?? "视频轨道"}已${
              selectedTrack?.visible === false ? "显示" : "隐藏"
            }。`,
          });
        } else if (selectedResourceTrackId) {
          const selectedTrack = resourceTracks.find(
            (track) => track.id === selectedResourceTrackId,
          );
          toggleResourceTrackVisibility(selectedResourceTrackId);
          setNotice({
            tone: "ok",
            text: `${selectedTrack?.name ?? "资源轨道"}已${
              selectedTrack?.visible === false ? "显示" : "隐藏"
            }。`,
          });
        } else if (selectionIds.length > 0) {
          const selectedTracks = instances.filter((instance) =>
            selectionIds.includes(instance.id),
          );
          const shouldShow = selectedTracks.every(
            (instance) => instance.visible === false,
          );
          toggleMotionTrackVisibility(selectionIds);
          setNotice({
            tone: "ok",
            text: `${selectionIds.length > 1 ? `${selectionIds.length} 条动效轨道` : "动效轨道"}已${
              shouldShow ? "显示" : "隐藏"
            }。`,
          });
        }
      }
      if (action === "duplicate") duplicateInstances(selectionIds);
      if (action === "delete") {
        if (selectedVideoTrackId) removeVideoTrack(selectedVideoTrackId);
        else if (selectedResourceTrackId) {
          deleteResourceTrack(selectedResourceTrackId);
        }
        else deleteInstances(selectionIds);
      }
      if (action === "regionIn") {
        setRegionInFrame(currentFrame);
        setRegionOutFrame((out) =>
          out !== null && out < currentFrame ? null : out,
        );
        setNotice({
          tone: "ok",
          text: `区域入点已设在 ${formatTime(currentFrame / fps)}。`,
        });
      }
      if (action === "regionOut") {
        setRegionOutFrame(currentFrame);
        setRegionInFrame((inFrame) =>
          inFrame !== null && inFrame > currentFrame ? null : inFrame,
        );
        setNotice({
          tone: "ok",
          text: `区域出点已设在 ${formatTime(currentFrame / fps)}。`,
        });
      }
      if (action === "regionClear") {
        if (regionInFrame === null && regionOutFrame === null) {
          setNotice({ tone: "info", text: "当前没有区域出入点标记。" });
        } else {
          setRegionInFrame(null);
          setRegionOutFrame(null);
          setNotice({ tone: "ok", text: "已清除区域出入点标记。" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentFrame,
    durationInFrames,
    instances,
    isPlaying,
    recordingShortcut,
    regionInFrame,
    regionOutFrame,
    selectedInstanceId,
    selectedInstanceIds,
    selectedResourceTrackId,
    selectedVideoTrackId,
    shortcutPanelOpen,
    shortcuts,
    toggleMotionTrackVisibility,
    toggleResourceTrackVisibility,
    toggleVideoTrackVisibility,
    redoEdit,
    undoEdit,
    resourceTracks,
    videoTracks,
  ]);

  const updateSelectedProp = (key: string, value: unknown) => {
    if (!selectedInstance) return;
    updateInstance(selectedInstance.id, (instance) => ({
      ...instance,
      props: { ...instance.props, [key]: value },
    }));
  };

  const renderPropControl = (
    key: string,
    schema: MotionPropSchema,
    value: unknown,
  ) => {
    const label = schema.label ?? key;
    if (
      ((selectedDefinition?.id === "PortraitWorkflowPrerequisite" &&
        key === "stepCount") ||
        (selectedDefinition?.id === "PortraitBrowserRepairLoop" &&
          key === "stepCount") ||
        (selectedDefinition?.id === "PortraitSkillStepGrid" &&
          key === "stepCount") ||
        (selectedDefinition?.id === "PortraitSkillSourceFusion" &&
          key === "sourceCount") ||
        (selectedDefinition?.id === "PortraitDesignRuleChecklist" &&
          key === "ruleCount") ||
        (selectedDefinition?.id === "PortraitRiskWarning" &&
          key === "riskCount") ||
        (selectedDefinition?.id === "PortraitSkillResultComparison" &&
          key === "materialCount") ||
        (selectedDefinition?.id === "PortraitPromptIterationShowcase" &&
          key === "iterationCount") ||
        (selectedDefinition?.id === "PortraitGsapSkillShowcase" &&
          key === "capabilityCount") ||
        (selectedDefinition?.id === "PortraitCodeDecisionChecklist" &&
          key === "questionCount"))
    ) {
      const min = typeof schema.min === "number" ? schema.min : 1;
      const max = typeof schema.max === "number" ? schema.max : 8;
      const fallbackValue = ["sourceCount", "materialCount", "iterationCount", "capabilityCount"].includes(key) ? 3 : key === "riskCount" ? 3 : key === "questionCount" || selectedDefinition?.id === "PortraitBrowserRepairLoop" ? 6 : 4;
      const numericValue = clamp(
        Math.round(Number(value ?? schema.default ?? fallbackValue)),
        min,
        max,
      );
      return (
        <StepCountStepper
          key={key}
          label={label}
          value={numericValue}
          min={min}
          max={max}
          itemNoun={key === "sourceCount" ? "来源" : key === "ruleCount" ? "规则" : key === "riskCount" ? "风险" : key === "materialCount" ? "素材" : key === "iterationCount" ? "改版" : key === "capabilityCount" ? "能力" : key === "questionCount" ? "问题" : selectedDefinition?.id === "PortraitBrowserRepairLoop" ? "节点" : selectedDefinition?.id === "PortraitSkillStepGrid" ? "卡片" : "步骤"}
          onChange={(nextValue) => {
            if (!["materialCount", "iterationCount", "capabilityCount", "questionCount", "riskCount"].includes(key) || !selectedInstance) {
              updateSelectedProp(key, nextValue);
              return;
            }
            if (key === "riskCount") {
              const animationSeconds = Math.max(0.95, Number(selectedInstance.props.animationSeconds ?? 0.95));
              const interval = Math.max(0, Number(selectedInstance.props.riskIntervalSeconds ?? 0.45));
              const requiredSeconds = 0.34 * animationSeconds + Math.max(0, nextValue - 1) * interval + 0.62 * animationSeconds;
              const nextAnimationSeconds = Math.max(animationSeconds, requiredSeconds);
              const nextDuration = Math.max(selectedInstance.durationInFrames, Math.ceil(nextAnimationSeconds * fps));
              updateInstance(selectedInstance.id, (instance) => ({ ...instance, durationInFrames: nextDuration, props: { ...instance.props, riskCount: nextValue, animationSeconds: Number(nextAnimationSeconds.toFixed(2)) } }));
              setManualTimelineEndFrame((current) => Math.max(current, selectedInstance.startFrame + nextDuration));
              return;
            }
            if (key === "questionCount") {
              const firstHighlight = Math.max(0, Number(selectedInstance.props.firstHighlightSeconds ?? 0.6));
              const questionInterval = Math.max(0.1, Number(selectedInstance.props.questionIntervalSeconds ?? 0.9));
              const requiredSeconds = firstHighlight + Math.max(0, nextValue - 1) * questionInterval + 0.8;
              const nextAnimationSeconds = Math.max(Number(selectedInstance.props.animationSeconds ?? 6.72), requiredSeconds);
              const nextDuration = Math.max(selectedInstance.durationInFrames, Math.ceil(nextAnimationSeconds * fps));
              updateInstance(selectedInstance.id, (instance) => ({ ...instance, durationInFrames: nextDuration, props: { ...instance.props, questionCount: nextValue, animationSeconds: Number(nextAnimationSeconds.toFixed(2)) } }));
              setManualTimelineEndFrame((current) => Math.max(current, selectedInstance.startFrame + nextDuration));
              return;
            }
            if (key === "capabilityCount") {
              const capabilityStart = Math.max(0, Number(selectedInstance.props.capabilityStartSeconds ?? 2.8));
              const capabilityInterval = Math.max(0, Number(selectedInstance.props.capabilityIntervalSeconds ?? 1.15));
              const pairReveal = Math.max(0, Number(selectedInstance.props.pairRevealSeconds ?? 11.2));
              const conclusionReveal = Math.max(0, Number(selectedInstance.props.conclusionRevealSeconds ?? 14.1));
              const requiredSeconds = Math.max(
                capabilityStart + Math.max(0, nextValue - 1) * capabilityInterval + 1.2,
                pairReveal + 1.5,
                conclusionReveal + 1.6,
              );
              const nextAnimationSeconds = Math.max(
                Number(selectedInstance.props.animationSeconds ?? 18.73),
                requiredSeconds,
              );
              const nextDuration = Math.max(selectedInstance.durationInFrames, Math.ceil(nextAnimationSeconds * fps));
              updateInstance(selectedInstance.id, (instance) => ({ ...instance, durationInFrames: nextDuration, props: { ...instance.props, capabilityCount: nextValue, animationSeconds: Number(nextAnimationSeconds.toFixed(2)) } }));
              setManualTimelineEndFrame((current) => Math.max(current, selectedInstance.startFrame + nextDuration));
              return;
            }
            const isIteration = key === "iterationCount";
            const firstSwitch = Math.max(0, Number(selectedInstance.props[isIteration ? "firstResultSeconds" : "firstSwitchSeconds"] ?? 3.1));
            const interval = Math.max(0, Number(selectedInstance.props[isIteration ? "iterationIntervalSeconds" : "materialIntervalSeconds"] ?? (isIteration ? 5.2 : 3.5)));
            const wipeDuration = Math.max(0.1, Number(selectedInstance.props.wipeDurationSeconds ?? 0.75));
            const requiredSeconds = nextValue > 1
              ? firstSwitch + Math.max(0, nextValue - (isIteration ? 1 : 2)) * interval + wipeDuration + 0.6
              : 1.5;
            const nextAnimationSeconds = Math.max(
              Number(selectedInstance.props.animationSeconds ?? (isIteration ? 18.9 : 9.1)),
              requiredSeconds,
            );
            const nextDuration = Math.max(
              selectedInstance.durationInFrames,
              Math.ceil(nextAnimationSeconds * fps),
            );
            updateInstance(selectedInstance.id, (instance) => ({
              ...instance,
              durationInFrames: nextDuration,
              props: {
                ...instance.props,
                [key]: nextValue,
                animationSeconds: Number(nextAnimationSeconds.toFixed(2)),
              },
            }));
            setManualTimelineEndFrame((current) =>
              Math.max(current, selectedInstance.startFrame + nextDuration),
            );
          }}
        />
      );
    }
    const isSpotlightMediaUrl =
      key === "mediaUrl" &&
      ["MediaSpotlightCard", "MaterialCard"].includes(
        selectedDefinition?.id ?? "",
      ) ||
      (key === "mediaUrl" &&
        ["PortraitAgentBrowserMedia", "PortraitMediaPosterReveal"].includes(
          selectedDefinition?.id ?? "",
        ));
    const isComparisonMediaUrl =
      selectedDefinition?.id === "PortraitSkillResultComparison" &&
      /^material[1-8]Url$/.test(key);
    const isIterationMediaUrl =
      selectedDefinition?.id === "PortraitPromptIterationShowcase" &&
      /^iteration[1-8]Url$/.test(key);
    if (isSpotlightMediaUrl || isComparisonMediaUrl || isIterationMediaUrl) {
      const handleMediaUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
      ) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const previousMediaUrl = String(value ?? "").split("?")[0];
        const res = await fetch("/api/upload-media", {
          method: "POST",
          headers: { "x-file-name": encodeURIComponent(file.name) },
          body: file,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok) {
          updateSelectedProp(key, data.mediaUrl);
          if (isSpotlightMediaUrl && data.mediaType) {
            updateSelectedProp("mediaType", data.mediaType);
          }
          const nextMediaUrl = String(data.mediaUrl ?? "").split("?")[0];
          if (
            previousMediaUrl.startsWith("/api/media/temp/") &&
            previousMediaUrl !== nextMediaUrl
          ) {
            try {
              await fetch(previousMediaUrl, { method: "DELETE" });
            } catch {
              // 新素材已经可用，旧临时文件清理失败不阻塞替换。
            }
          }
        }
        event.target.value = "";
      };
      const uploadInputId = `media-upload-${selectedInstance?.id ?? "selected"}-${key}`;
      return (
        <label className="prop-field" key={key}>
          <span>{label}</span>
          <div className="media-upload-row">
            <input
              type="file"
              accept={isComparisonMediaUrl || isIterationMediaUrl ? "image/*" : "image/*,video/*"}
              onChange={handleMediaUpload}
              style={{ display: "none" }}
              id={uploadInputId}
            />
            <button
              type="button"
              className="media-upload-btn"
              onClick={() =>
                document.getElementById(uploadInputId)?.click()
              }
            >
              选择文件上传
            </button>
            <input
              type="text"
              value={String(value ?? "")}
              placeholder="或粘贴素材地址"
              onChange={(event) =>
                updateSelectedProp(key, event.target.value)
              }
            />
          </div>
        </label>
      );
    }
    if (schema.type === "boolean") {
      return (
        <label className="toggle-row" key={key}>
          <span>{label}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateSelectedProp(key, event.target.checked)}
          />
        </label>
      );
    }
    if (schema.type === "select") {
      const options = Array.isArray(schema.options) ? schema.options : [];
      return (
        <label key={key}>
          <span>{label}</span>
          <select
            value={String(value ?? "")}
            onChange={(event) => updateSelectedProp(key, event.target.value)}
          >
            {options.map((option) => {
              const optionValue =
                typeof option === "string" ? option : option.value;
              const optionLabel =
                typeof option === "string" ? option : option.label;
              return (
                <option value={optionValue} key={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        </label>
      );
    }
    if (schema.type === "color") {
      return (
        <label key={key}>
          <span>{label}</span>
          <input
            type="color"
            value={String(value ?? schema.default ?? "#65dff7")}
            onChange={(event) => updateSelectedProp(key, event.target.value)}
          />
        </label>
      );
    }
    if (schema.type === "number" && key.endsWith("FontSize")) {
      const min = typeof schema.min === "number" ? schema.min : 1;
      const max = typeof schema.max === "number" ? schema.max : 200;
      const step = typeof schema.step === "number" ? schema.step : 1;
      const numericValue = clamp(
        Number(value ?? schema.default ?? min),
        min,
        max,
      );
      return (
        <FontSizeStepper
          key={key}
          label={label}
          value={numericValue}
          min={min}
          max={max}
          step={step}
          onChange={(nextValue) => updateSelectedProp(key, nextValue)}
        />
      );
    }
    if (
      schema.type === "number" &&
      ((selectedDefinition?.id === "PortraitDesignRuleChecklist" &&
        key === "ruleIntervalSeconds") ||
        (selectedDefinition?.id === "PortraitRiskWarning" &&
          ["riskIntervalSeconds", "animationSeconds"].includes(key)) ||
        (selectedDefinition?.id === "PortraitSkillResultComparison" &&
          [
            "firstSwitchSeconds",
            "materialIntervalSeconds",
            "wipeDurationSeconds",
            "animationSeconds",
          ].includes(key)) ||
        (selectedDefinition?.id === "PortraitPromptIterationShowcase" &&
          [
            "firstResultSeconds",
            "iterationIntervalSeconds",
            "wipeDurationSeconds",
            "animationSeconds",
          ].includes(key)) ||
        (selectedDefinition?.id === "PortraitGsapSkillShowcase" &&
          [
            "capabilityStartSeconds",
            "capabilityIntervalSeconds",
            "pairRevealSeconds",
            "conclusionRevealSeconds",
            "animationSeconds",
          ].includes(key)) ||
        (selectedDefinition?.id === "PortraitSkillIdentityHeaderBar" &&
          key === "enterDurationSeconds") ||
        (selectedDefinition?.id === "PortraitCodeDecisionChecklist" &&
          ["questionEnterIntervalSeconds", "firstHighlightSeconds", "questionIntervalSeconds", "animationSeconds"].includes(key)) ||
        (selectedDefinition?.id === "PortraitBrowserRepairLoop" &&
          ["nodeEnterIntervalSeconds", "firstNodeHighlightSeconds", "nextNodeHighlightIntervalSeconds", "loopIntervalSeconds", "animationSeconds"].includes(key)) ||
        (selectedDefinition?.id === "PortraitSkillStepGrid" &&
          ["headerEnterSeconds", "cardEnterIntervalSeconds", "animationSeconds"].includes(key)) ||
        (selectedDefinition?.id === "PortraitGapHeadline" &&
          ["badgeEnterSeconds", "titleEnterSeconds", "animationSeconds"].includes(key)) ||
        (selectedDefinition?.id === "PortraitAiOutputGapQuote" &&
          ["leadEnterSeconds", "bodyEnterSeconds", "animationSeconds"].includes(key)) ||
        (selectedDefinition?.id === "PortraitAiOutputGapComparison" &&
          ["labelEnterSeconds", "firstRowEnterSeconds", "nextRowEnterIntervalSeconds", "animationSeconds"].includes(key)) ||
        (selectedDefinition?.id === "PortraitAgentBrowserMedia" &&
          ["titleEnterSeconds", "mediaEnterSeconds", "animationSeconds"].includes(key)))
    ) {
      const min = typeof schema.min === "number" ? schema.min : 0;
      const step = typeof schema.step === "number" ? schema.step : 0.1;
      const numericValue = Math.max(
        min,
        Number(value ?? schema.default ?? min),
      );
      return (
        <TimingStepper
          key={key}
          label={label}
          value={numericValue}
          min={min}
          step={step}
          onChange={(nextValue) => {
            if (
              selectedDefinition?.id === "PortraitRiskWarning" &&
              key === "riskIntervalSeconds" &&
              selectedInstance
            ) {
              const count = clamp(Math.round(Number(selectedInstance.props.riskCount ?? 3)), 1, 8);
              const animationSeconds = Math.max(0.95, Number(selectedInstance.props.animationSeconds ?? 0.95));
              const requiredSeconds = 0.34 * animationSeconds + Math.max(0, count - 1) * nextValue + 0.62 * animationSeconds;
              const nextAnimationSeconds = Math.max(animationSeconds, requiredSeconds);
              const nextDuration = Math.max(selectedInstance.durationInFrames, Math.ceil(nextAnimationSeconds * fps));
              updateInstance(selectedInstance.id, (instance) => ({ ...instance, durationInFrames: nextDuration, props: { ...instance.props, riskIntervalSeconds: nextValue, animationSeconds: Number(nextAnimationSeconds.toFixed(2)) } }));
              setManualTimelineEndFrame((current) => Math.max(current, selectedInstance.startFrame + nextDuration));
              return;
            }
            if (
              selectedDefinition?.id !== "PortraitCodeDecisionChecklist" ||
              key === "animationSeconds" ||
              !selectedInstance
            ) {
              updateSelectedProp(key, nextValue);
              return;
            }
            updateInstance(selectedInstance.id, (instance) => {
              const nextProps = { ...instance.props, [key]: nextValue };
              const count = Math.max(1, Number(nextProps.questionCount ?? 6));
              const enterInterval = Math.max(0, Number(nextProps.questionEnterIntervalSeconds ?? 0.1));
              const firstHighlight = Math.max(0, Number(nextProps.firstHighlightSeconds ?? 0.6));
              const highlightInterval = Math.max(0.1, Number(nextProps.questionIntervalSeconds ?? 0.9));
              const requiredSeconds = Math.max(
                (count - 1) * enterInterval + 0.5,
                firstHighlight + (count - 1) * highlightInterval + 0.8,
              );
              const nextAnimationSeconds = Math.max(
                Number(nextProps.animationSeconds ?? 6.72),
                requiredSeconds,
              );
              return {
                ...instance,
                durationInFrames: Math.max(instance.durationInFrames, Math.ceil(nextAnimationSeconds * fps)),
                props: {
                  ...nextProps,
                  animationSeconds: Number(nextAnimationSeconds.toFixed(2)),
                },
              };
            });
          }}
        />
      );
    }
    if (
      schema.type === "number" &&
      typeof schema.min === "number" &&
      typeof schema.max === "number"
    ) {
      const numericValue = Number(value ?? schema.default ?? schema.min);
      return (
        <label key={key}>
          <span>
            {label}
            <output>
              {numericValue.toFixed(schema.step && schema.step < 1 ? 2 : 0)}
            </output>
          </span>
          <input
            type="range"
            min={schema.min}
            max={schema.max}
            step={schema.step ?? 1}
            value={numericValue}
            onInput={(event) =>
              updateSelectedProp(
                key,
                Number((event.target as HTMLInputElement).value),
              )
            }
          />
        </label>
      );
    }
    return (
      <label key={key}>
        <span>{label}</span>
        <input
          type={schema.type === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={(event) =>
            updateSelectedProp(
              key,
              schema.type === "number"
                ? Number(event.target.value)
                : event.target.value,
            )
          }
        />
      </label>
    );
  };

  const visibleCanvasItems = useMemo(
    () =>
      instances.flatMap((instance, index) => {
        const definition = definitionMap.get(instance.componentId);
        const isVisible =
          instance.visible !== false &&
          currentFrame >= instance.startFrame &&
          currentFrame < instance.startFrame + instance.durationInFrames;
        return definition && isVisible
          ? [{ instance, definition, stackIndex: index }]
          : [];
      }),
    [currentFrame, definitionMap, instances],
  );

  return (
    <div
      className="app"
      data-theme={theme}
      style={{ zoom: workspaceZoom / 100 }}
    >
      <input
        ref={videoInput}
        type="file"
        accept="video/*"
        onChange={handleVideoFile}
        hidden
      />
      <input
        ref={srtInput}
        type="file"
        accept=".srt,text/plain"
        onChange={handleSrtFile}
        hidden
      />
      <input
        ref={componentInput}
        type="file"
        accept=".tsx,text/plain"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          importComponent(file).catch((error) => {
            setNotice({
              tone: "error",
              text:
                error instanceof Error ? error.message : "TSX 组件导入失败",
            });
          });
        }}
        hidden
      />
      <input
        ref={timelineJsonInput}
        type="file"
        accept=".json,application/json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          importTimelineJson(file).catch((error) => {
            setNotice({
              tone: "error",
              text:
                error instanceof Error ? error.message : "JSON 编排导入失败",
            });
          });
        }}
        hidden
      />
      <input
        ref={iconImportInput}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          importIcon(file).catch((error) => {
            setNotice({
              tone: "error",
              text: error instanceof Error ? error.message : "图标导入失败",
            });
          });
        }}
        hidden
      />
      <input
        ref={sfxImportInput}
        type="file"
        accept=".wav,.mp3,.ogg,.m4a,audio/wav,audio/mpeg,audio/ogg,audio/mp4"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          importSfx(file).catch((error) => {
            setNotice({
              tone: "error",
              text: error instanceof Error ? error.message : "音效导入失败",
            });
          });
        }}
        hidden
      />
      <div className="capture-strip" aria-hidden="true">
        <span />
      </div>
      <header className="studio-topbar">
        <div className="studio-brand" aria-label="动效工作台 V1.0">
          <strong>动效工作台</strong>
          <small>V1.0</small>
        </div>

        <nav className="studio-nav" aria-label="主导航">
          <button
            className={activeWorkspace === "editor" ? "active" : ""}
            onClick={() => setActiveWorkspace("editor")}
          >
            编辑台
          </button>
          <button
            className={activeWorkspace === "effects" ? "active" : ""}
            onClick={() => setActiveWorkspace("effects")}
          >
            效果库
          </button>
          <button
            className={activeWorkspace === "rules" ? "active" : ""}
            onClick={() => setActiveWorkspace("rules")}
          >
            编排规则
          </button>
          <button
            className={activeWorkspace === "icons" ? "active" : ""}
            onClick={() => setActiveWorkspace("icons")}
          >
            图标库
          </button>
          <button
            className={activeWorkspace === "sfx" ? "active" : ""}
            onClick={() => setActiveWorkspace("sfx")}
          >
            音效库
          </button>
          <button
            className={activeWorkspace === "code" ? "active" : ""}
            onClick={() => {
              setActiveWorkspace("code");
              setLeftPanelWidth((width) => Math.max(width, 460));
            }}
          >
            代码
          </button>
        </nav>

        <div className="studio-actions" aria-label="编辑操作">
          <div className="workspace-zoom-control" aria-label="工作台界面缩放">
            <button
              type="button"
              onClick={() => setWorkspaceZoom((zoom) => Math.max(50, zoom - 10))}
              disabled={workspaceZoom <= 50}
              title="缩小工作台界面"
              aria-label="缩小工作台界面"
            >
              <Minus weight="bold" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={workspaceZoomInput}
              onChange={(event) => {
                const nextText = event.target.value.replace(/\D/g, "");
                setWorkspaceZoomInput(nextText);
                const next = Number(nextText);
                if (
                  nextText &&
                  Number.isFinite(next) &&
                  next >= 50 &&
                  next <= 200
                ) {
                  setWorkspaceZoom(next);
                }
              }}
              onBlur={() => setWorkspaceZoomInput(String(workspaceZoom))}
              aria-label="工作台界面缩放百分比"
            />
            <b>%</b>
            <button
              type="button"
              onClick={() => setWorkspaceZoom((zoom) => Math.min(200, zoom + 10))}
              disabled={workspaceZoom >= 200}
              title="放大工作台界面"
              aria-label="放大工作台界面"
            >
              <Plus weight="bold" />
            </button>
            <button
              type="button"
              className="workspace-zoom-reset"
              onClick={() => setWorkspaceZoom(100)}
              disabled={workspaceZoom === 100}
              title="恢复 100% 工作台界面缩放"
            >
              重置
            </button>
          </div>
          <button
            className={canvasOrientation === "portrait" ? "format-entry active" : "format-entry"}
            onClick={toggleCanvasOrientation}
            title={
              canvasOrientation === "landscape"
                ? "切换为竖屏 9:16"
                : "切换为横屏 16:9"
            }
          >
            <DeviceMobile weight="fill" />
            {canvasOrientation === "portrait" ? "画幅 9:16" : "画幅 16:9"}
          </button>
          <button
            className={shortcutPanelOpen ? "shortcut-entry active" : "shortcut-entry"}
            onClick={openShortcutSettings}
            title="设置剪辑台快捷键"
          >
            <Keyboard weight="fill" />快捷键
          </button>
          <button onClick={togglePlayback}>
            {isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}
            {isPlaying ? "暂停" : "播放"}
          </button>
          <button onClick={openRealtimePreviewWindow} title="在独立浏览器窗口打开实时预览">
            <FrameCorners />预览窗口
          </button>
          <button onClick={goToTimelineStart}><ArrowCounterClockwise />归零</button>
          <button
            className={soundEnabled ? "sound-entry active" : "sound-entry"}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? "关闭声音" : "开启声音"}
            title={soundEnabled ? "关闭实时预览与导出声音" : "开启实时预览与导出声音"}
            onClick={() => {
              setSoundEnabled((enabled) => !enabled);
              setNotice({
                tone: "ok",
                text: soundEnabled ? "声音已关闭。" : "声音已开启。",
              });
            }}
          >
            {soundEnabled ? <SpeakerHigh /> : <SpeakerSlash />}
            {soundEnabled ? "声音" : "静音"}
          </button>
          <button
            className={srtGenerating ? "ai-arrange-entry running" : "ai-arrange-entry"}
            disabled={srtGenerating}
            onClick={openAiArrangement}
            title={srtEntries.length > 0 ? "使用已加载字幕一键重新编排" : "选择字幕并自动编排"}
          >
            <MagicWand weight="fill" />
            {srtGenerating ? "自动编排中…" : "AI 自动编排"}
          </button>
          <button
            onClick={clearAllTimelineTracks}
            title="清空时间轴所有轨道（视频、动效、资源）"
          >
            <Trash />清空
          </button>
          <button onClick={openVideoPicker}><UploadSimple />导入视频</button>
          <button
            className="export-action"
            disabled={rendering}
            onClick={openExportDialog}
          >
            <DownloadSimple weight="bold" />
            {exportTransparent ? "导出透明 MOV" : "导出预览 MOV"}
          </button>
        </div>
      </header>

      <main
        className={resizingSidebar ? "is-resizing-sidebar" : undefined}
        style={
          {
            "--left-panel-width": `${leftPanelWidth}px`,
            "--right-panel-width": `${rightPanelWidth}px`,
          } as React.CSSProperties
        }
      >
        <aside className="left-panel reference-left-panel">
          {activeWorkspace === "code" ? (
            <div className="code-template-panel">
              <header>
                <small>CODE</small>
                <strong>新建代码模板</strong>
                <span>Remotion / React / TSX</span>
              </header>
              <label>
                <span>模板名称</span>
                <input
                  value={codeTemplateName}
                  onChange={(event) => setCodeTemplateName(event.target.value)}
                  placeholder="我的代码动效"
                />
              </label>
              <label
                className="code-template-editor"
                style={{ height: `${codeEditorHeight}px` }}
              >
                <span>代码</span>
                <textarea
                  value={codeTemplate}
                  onChange={(event) => setCodeTemplate(event.target.value)}
                  spellCheck={false}
                  aria-label="TSX 代码模板"
                />
                <button
                  type="button"
                  className="code-editor-resize-handle"
                  onPointerDown={beginCodeEditorResize}
                  aria-label="上下调整代码框高度"
                  title="上下拖动调整代码框高度"
                >
                  <i />
                </button>
              </label>
              <p>需导出 <code>MOTION_COMPONENTS</code>；可选导出 <code>MOTION_TIMELINE</code>，导入后组件加入效果库，并追加到时间轴当前播放位置。</p>
              <div className="code-template-actions">
                <button
                  type="button"
                  onClick={() => {
                    setCodeTemplateName("我的代码动效");
                    setCodeTemplate(DEFAULT_CODE_TEMPLATE);
                    setNotice({ tone: "info", text: "已新建默认代码模板。" });
                  }}
                >
                  新建模板
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    importCodeTemplate().catch((error) =>
                      setNotice({
                        tone: "error",
                        text: error instanceof Error ? error.message : "代码模板导入失败",
                      }),
                    )
                  }
                >
                  导入到时间轴
                </button>
              </div>
            </div>
          ) : activeWorkspace === "rules" ? (
            <div className="semantic-rules-panel">
              <header className="semantic-rules-header">
                <div>
                  <small>AI ARRANGEMENT RULES</small>
                  <strong>编排规则</strong>
                  <span>自动编排只读取当前启用的语义风格</span>
                </div>
                <div className="semantic-rules-header-actions">
                  <span className={arrangementRulesSaveStatus}>
                    {arrangementRulesSaveStatus === "loading"
                      ? "读取中"
                      : arrangementRulesSaveStatus === "saving"
                        ? "保存中"
                        : arrangementRulesSaveStatus === "saved"
                          ? "已写入项目"
                          : "保存失败"}
                  </span>
                  <button
                    type="button"
                    disabled={!arrangementRulesFileReady}
                    onClick={createArrangementRule}
                  >
                    <Plus weight="bold" />新建
                  </button>
                </div>
              </header>

              <div className="semantic-rule-list" aria-label="语义风格规则列表">
                {arrangementRules.map((rule) => (
                  <button
                    type="button"
                    key={rule.id}
                    className={
                      rule.id === activeArrangementRuleId ? "active" : undefined
                    }
                    onClick={() => activateArrangementRule(rule.id)}
                  >
                    <i style={{ backgroundColor: rule.accentColor }} />
                    <span>
                      <strong>{rule.name}</strong>
                      <small>
                        {rule.keepStyleConsistent ? "统一风格" : "语义自动配色"}
                        {rule.autoAddIcons ? " · 自动图标" : " · 图标手动"}
                      </small>
                    </span>
                    <b>{rule.id === activeArrangementRuleId ? "使用中" : "启用"}</b>
                  </button>
                ))}
              </div>

              {activeArrangementRule ? (
                <section className="semantic-rule-editor">
                  <div className="semantic-rule-editor-title">
                    <span>
                      <small>ACTIVE SEMANTIC STYLE</small>
                      <strong>编辑当前规则</strong>
                    </span>
                    <i style={{ backgroundColor: arrangementPreferences.accentColor }} />
                  </div>

                  <label className="semantic-rule-name">
                    <span>规则名称</span>
                    <input
                      type="text"
                      value={activeArrangementRule.name}
                      onChange={(event) =>
                        renameActiveArrangementRule(event.target.value)
                      }
                      onBlur={(event) => {
                        if (!event.currentTarget.value.trim()) {
                          renameActiveArrangementRule("未命名语义风格");
                        }
                      }}
                    />
                  </label>

                  <div className="semantic-rule-fields">
                    <label>
                      <input
                        type="checkbox"
                        checked={arrangementPreferences.keepStyleConsistent}
                        onChange={(event) =>
                          updateArrangementPreferences({
                            keepStyleConsistent: event.target.checked,
                          })
                        }
                      />
                      <span>
                        <strong>保持统一视觉风格</strong>
                        <small>统一组件主强调色</small>
                      </span>
                    </label>
                    <label className="semantic-rule-color">
                      <input
                        type="color"
                        value={arrangementPreferences.accentColor}
                        disabled={!arrangementPreferences.keepStyleConsistent}
                        onChange={(event) =>
                          updateArrangementPreferences({
                            accentColor: event.target.value,
                          })
                        }
                      />
                      <span>
                        <strong>规则主色</strong>
                        <small>{arrangementPreferences.accentColor.toUpperCase()}</small>
                      </span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={arrangementPreferences.autoAddIcons}
                        onChange={(event) =>
                          updateArrangementPreferences({
                            autoAddIcons: event.target.checked,
                          })
                        }
                      />
                      <span>
                        <strong>自动添加独立图标</strong>
                        <small>关闭后仅允许手动添加</small>
                      </span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          arrangementPreferences.learnFromConfirmedChoices
                        }
                        onChange={(event) =>
                          updateArrangementPreferences({
                            learnFromConfirmedChoices: event.target.checked,
                          })
                        }
                      />
                      <span>
                        <strong>学习确认插入项</strong>
                        <small>
                          已记录 {Object.keys(arrangementPreferences.componentScores).length} 个组件
                        </small>
                      </span>
                    </label>
                  </div>

                  <div className="semantic-rule-actions">
                    <button
                      type="button"
                      disabled={
                        Object.keys(arrangementPreferences.componentScores)
                          .length === 0
                      }
                      onClick={clearLearnedArrangementPreferences}
                    >
                      清空组件习惯
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={arrangementRules.length <= 1}
                      onClick={deleteActiveArrangementRule}
                    >
                      删除规则
                    </button>
                  </div>
                </section>
              ) : null}

              <div className="semantic-rule-system-note">
                <strong>规则文件已纳入项目</strong>
                <span>
                  保存位置：public/input/arrangement-rules/rule-manifest.json。该文件可以随 Git、备份或复制到其他工作台长期复用。
                </span>
              </div>
            </div>
          ) : activeWorkspace === "effects" ? (
            <div
              className="effect-library-panel"
              onContextMenu={(event) => {
                if (event.target instanceof Element && event.target.closest("button, input, textarea, select, a")) return;
                showLibraryRootMenu(event);
              }}
              title="左侧空白处右键可新建分组"
            >
              <header className="effect-library-header">
                <div>
                  <small>LIBRARY</small>
                  <strong>效果库</strong>
                </div>
                <b>{visibleBuiltInEffectCount}</b>
              </header>

              <label className="effect-library-search">
                <MagnifyingGlass />
                <input
                  type="search"
                  value={effectSearch}
                  onChange={(event) => setEffectSearch(event.target.value)}
                  placeholder="搜索效果名称"
                />
              </label>

              <div className="effect-library-meta">
                <span>内置效果</span>
                <span>{filteredEffectCatalog.length} 个分类</span>
              </div>

              <div className="effect-library-catalog">
                {filteredEffectCatalog.map((category) => {
                  const isOpen =
                    Boolean(effectSearch.trim()) ||
                    openCatalogCategories.includes(category.id);
                  return (
                    <section
                      className="effect-library-category"
                      key={category.id}
                      style={{ "--effect-group-accent": category.accent } as React.CSSProperties}
                    >
                      <button
                        className={isOpen ? "category-toggle open" : "category-toggle"}
                        onContextMenu={(event) =>
                          showLibraryGroupMenu(event, category)
                        }
                        onClick={() =>
                          setOpenCatalogCategories((current) =>
                            current.includes(category.id)
                              ? current.filter((id) => id !== category.id)
                              : [...current, category.id],
                          )
                        }
                      >
                        <span>{category.name}</span>
                        <input
                          className="effect-group-color-swatch"
                          type="color"
                          value={category.accent}
                          title="选择分组颜色"
                          aria-label={`选择“${category.name}”的分组颜色`}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                          onInput={(event) =>
                            updateEffectGroupColor(
                              category.id,
                              category.name,
                              event.currentTarget.value,
                            )
                          }
                        />
                        <b>{category.items.length}</b>
                        <CaretDown />
                      </button>

                      {isOpen ? (
                        <div className="effect-library-items">
                          {category.items.map((item) => {
                            const definition = catalogDefinitionMap.get(item.ids[0]);
                            return (
                              <div className="effect-library-item" key={item.ids[0]}>
                                <button
                                  className="effect-library-item-main"
                                  disabled={!definition}
                                  onClick={() => definition && addInstance(definition.id)}
                                  onContextMenu={(event) =>
                                    definition && showLibraryMenu(event, definition.id)
                                  }
                                  title="单击添加到时间轴；右键可移动分组或彻底删除"
                                >
                                  <i>{item.name.slice(0, 2)}</i>
                                  <span>
                                    <strong>{item.name}</strong>
                                    <small>{definition ? "单击添加到时间轴" : "暂不可用"}</small>
                                  </span>
                                  <Plus />
                                </button>
                                <button
                                  className="effect-library-item-code"
                                  title="跳转到代码"
                                  aria-label={`跳转到 ${item.name} 的代码`}
                                  onClick={() => openEffectInCodeEditor(item.ids[0])}
                                >
                                  <Code />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>

              {filteredEffectCatalog.length === 0 ? (
                <div className="effect-library-empty">没有匹配的效果</div>
              ) : null}

              {ungroupedCustomDefinitions.length > 0 ? (
                <section className="effect-library-imported">
                  <div className="effect-library-meta">
                    <span>已导入效果</span>
                    <span>{ungroupedCustomDefinitions.length}</span>
                  </div>
                  <div className="effect-library-items">
                    {ungroupedCustomDefinitions.map((definition) => (
                      <div className="effect-library-item" key={definition.id}>
                        <button
                          className="effect-library-item-main"
                          onClick={() => addInstance(definition.id)}
                          onContextMenu={(event) => showLibraryMenu(event, definition.id)}
                          title="单击添加到时间轴；右键可移动分组或彻底删除"
                        >
                          <i>FX</i>
                          <span>
                            <strong>{definition.name}</strong>
                            <small>单击添加到时间轴</small>
                          </span>
                          <Plus />
                        </button>
                        <button
                          className="effect-library-item-code"
                          title="跳转到代码"
                          aria-label={`跳转到 ${definition.name} 的代码`}
                          onClick={() => openEffectInCodeEditor(definition.id)}
                        >
                          <Code />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : activeWorkspace === "icons" ? (
            <div
              className="icon-library-panel"
              onContextMenu={(event) => {
                if (event.target instanceof Element && event.target.closest("button, input, textarea, select, a")) return;
                showIconLibraryMenu(event);
              }}
              title="左侧空白处右键可新建分组"
            >
              <header className="icon-library-header">
                <div>
                  <small>REAL ICONS</small>
                  <strong>真实图标库</strong>
                  <span>可直接渲染进成片</span>
                </div>
                <b>{visibleIconCount}</b>
              </header>

              <label className="effect-library-search icon-library-search">
                <MagnifyingGlass />
                <input
                  type="search"
                  value={iconSearch}
                  onChange={(event) => setIconSearch(event.target.value)}
                  placeholder="搜索图标、语义或用途"
                />
              </label>

              <div className="icon-library-summary">
                <span>{iconResources.length} 个图标</span>
                <span>{filteredIconCatalog.length} 个分类</span>
              </div>

              {iconLibraryError ? (
                <div className="effect-library-empty">{iconLibraryError}</div>
              ) : null}

              <div className="icon-library-catalog">
                {filteredIconCatalog.map((category) => {
                  const isOpen =
                    Boolean(iconSearch.trim()) ||
                    openIconCategories.includes(category.name);
                  return (
                    <section
                      className="icon-library-category"
                      key={category.name}
                      style={{ "--icon-accent": category.accent } as React.CSSProperties}
                    >
                      <button
                        className={isOpen ? "icon-category-toggle open" : "icon-category-toggle"}
                        onContextMenu={(event) =>
                          showIconLibraryMenu(event, category.name, undefined, category.id)
                        }
                        onClick={() =>
                          setOpenIconCategories((current) =>
                            current.includes(category.name)
                              ? current.filter((name) => name !== category.name)
                              : [...current, category.name],
                          )
                        }
                      >
                        <span>{category.name}</span>
                        {category.builtin ? (
                          <i
                            className="icon-category-color-swatch locked"
                            style={{ background: category.accent }}
                            title="内置分组颜色不可修改"
                          />
                        ) : (
                          <input
                            className="icon-category-color-swatch"
                            type="color"
                            value={category.accent}
                            title="选择分组颜色"
                            aria-label={`选择“${category.name}”的分组颜色`}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              updateIconGroupColor(category, event.target.value)
                            }
                          />
                        )}
                        <b>{category.items.length}</b>
                        <CaretDown />
                      </button>
                      {isOpen ? (
                        <div className="icon-library-grid">
                          {category.items.map((icon) => (
                            <button
                              className="icon-library-card"
                              key={icon.id}
                              onClick={() => addIconResource(icon)}
                              title={`${icon.usage}；单击添加到时间轴；右键可导入同分类图标`}
                              onContextMenu={(event) =>
                                showIconLibraryMenu(event, category.name, icon.id, category.id)
                              }
                            >
                              <i>
                                <img src={icon.url} alt="" />
                              </i>
                              <strong>{icon.label}</strong>
                              <small>{icon.id}</small>
                              <Plus />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>

              {!iconLibraryError && filteredIconCatalog.length === 0 ? (
                <div className="effect-library-empty">没有匹配的图标</div>
              ) : null}
            </div>
          ) : activeWorkspace === "sfx" ? (
            <div
              className="sfx-library-panel"
              onContextMenu={(event) => {
                if (event.target instanceof Element && event.target.closest("button, input, textarea, select, a")) return;
                showSfxLibraryMenu(event);
              }}
              title="左侧空白处右键可新建分组"
            >
              <header className="sfx-library-header">
                <div>
                  <small>SOUND EFFECTS</small>
                  <strong>音效库</strong>
                  <span>试听后加入当前播放位置</span>
                </div>
                <b>{arrangementResourceLibrary.sfx.length}</b>
              </header>

              <button
                type="button"
                className="sfx-library-import"
                onClick={openSfxImportPicker}
              >
                <UploadSimple weight="bold" />
                <span>
                  <strong>导入本地音效</strong>
                  <small>WAV、MP3、OGG、M4A · 最大 25 MB</small>
                </span>
              </button>

              <label className="effect-library-search sfx-library-search">
                <MagnifyingGlass />
                <input
                  type="search"
                  value={sfxSearch}
                  onChange={(event) => setSfxSearch(event.target.value)}
                  placeholder="搜索音效、标签或用途"
                />
              </label>

              <div className="sfx-library-summary">
                <span>
                  {sfxCatalog.reduce(
                    (total, section) => total + section.items.length,
                    0,
                  )}{" "}
                  个结果
                </span>
                <span>{arrangementResourceLibrary.sfx.filter((sound) => sound.source === "manual").length} 个手动导入</span>
              </div>

              <div className="sfx-library-list">
                {sfxCatalog.map((section) => {
                  const isOpen =
                    Boolean(sfxSearch.trim()) ||
                    openSfxGroups.includes(section.name);
                  return (
                    <section
                      className="sfx-library-category"
                      key={section.name}
                      style={{ "--sfx-accent": section.accent } as React.CSSProperties}
                    >
                      <button
                        type="button"
                        className={isOpen ? "sfx-category-toggle open" : "sfx-category-toggle"}
                        onContextMenu={(event) =>
                          showSfxLibraryMenu(event, {
                            sfxGroupId: section.builtin ? undefined : section.id,
                            groupName: section.name,
                          })
                        }
                        onClick={() =>
                          setOpenSfxGroups((current) =>
                            current.includes(section.name)
                              ? current.filter((name) => name !== section.name)
                              : [...current, section.name],
                          )
                        }
                      >
                        <i
                          className="sfx-category-dot"
                          style={{ background: section.accent }}
                        />
                        <span>{section.name}</span>
                        <b>{section.items.length}</b>
                        <CaretDown />
                      </button>
                      {isOpen ? (
                        <div className="sfx-library-group">
                          {section.items.map((sound) => {
                            const isPreviewing = previewingSfxId === sound.id;
                            return (
                              <article
                                className={isPreviewing ? "sfx-library-card previewing" : "sfx-library-card"}
                                key={sound.id}
                                onContextMenu={(event) =>
                                  showSfxLibraryMenu(event, {
                                    soundId: sound.id,
                                    groupName: section.name,
                                  })
                                }
                              >
                                <button
                                  type="button"
                                  className="sfx-preview-button"
                                  onClick={() => toggleSfxLibraryPreview(sound)}
                                  aria-label={isPreviewing ? `停止试听 ${sound.label}` : `试听 ${sound.label}`}
                                  title={isPreviewing ? "停止试听" : "试听音效"}
                                >
                                  {isPreviewing ? <Pause weight="fill" /> : <Play weight="fill" />}
                                </button>
                                <div className="sfx-card-copy">
                                  <strong>{sound.label}</strong>
                                  <small>{sound.usage || sound.id}</small>
                                  <span>
                                    {formatSoundDuration(sound.durationSeconds)}
                                    {sound.source === "manual" ? " · 手动导入" : " · 内置"}
                                  </span>
                                </div>
                                <div className="sfx-card-actions">
                                  {sound.source === "manual" ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => void openSfxFileLocation(sound.id)}
                                        aria-label={`打开 ${sound.label} 所在位置`}
                                        title="打开文件所在位置"
                                      >
                                        <FolderOpen />
                                      </button>
                                      <button
                                        type="button"
                                        className="danger"
                                        onClick={() => void deleteManualSfxResource(sound)}
                                        aria-label={`删除 ${sound.label}`}
                                        title="从音效库删除"
                                      >
                                        <Trash />
                                      </button>
                                    </>
                                  ) : null}
                                  <button
                                    type="button"
                                    className="primary"
                                    onClick={() => addSfxResource(sound)}
                                    title="添加到当前播放位置"
                                  >
                                    <Plus /> 添加
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>

              {sfxCatalog.every((section) => section.items.length === 0) ? (
                <div className="effect-library-empty">
                  {sfxSearch.trim() ? "没有匹配的音效" : "音效库为空，可以先导入一个音效"}
                </div>
              ) : null}
            </div>
          ) : (
            <>
          <div className="reference-kicker">全局 <i>·</i> 影响所有卡片</div>

          <section className="reference-control-group">
            <label>全局底色(所有卡片)</label>
            <div className="reference-segmented">
              <button
                className={globalCardBase === "dark" ? "active" : ""}
                onClick={() => setGlobalCardBase("dark")}
                title="保持各卡片默认背景底色"
              >
                <MoonStars weight="fill" />
                暗底
              </button>
              <button
                className={globalCardBase === "light" ? "active" : ""}
                onClick={() => setGlobalCardBase("light")}
                title="所有卡片透明：去掉背景底色，只留文字与图形"
              >
                <Sun weight="fill" />
                亮底
              </button>
            </div>
          </section>

          <section className="reference-control-group">
            <label>皮肤(所有卡片)</label>
            <button className="reference-select"><SelectionForeground />晨雾象牙<span><CaretDown /></span></button>
          </section>

          <section className="reference-control-group">
            <label>风格(所有卡片)</label>
            <button className="reference-select">HUD · 现状<span><CaretDown /></span></button>
          </section>

          <button className="reference-wide-button" onClick={openVideoPicker}><VideoCamera />导入视频</button>

          <div className="reference-split-actions">
            <button
              onClick={() => componentInput.current?.click()}
              title="导入 .tsx 组件包，按 MOTION_TIMELINE 预设生成轨道"
            >
              <UploadSimple />
              导入 TSX 效果
            </button>
            <button
              onClick={() => timelineJsonInput.current?.click()}
              title="载入内部编排结果，预览并确认后才会插入时间线"
            >
              <UploadSimple />
              载入编排预览
            </button>
          </div>

          <label className="reference-checkline">
            <input type="checkbox" />
            <span>循环视频 · 运镜卡共用(需 H264)</span>
          </label>

          <div className="reference-split-actions reference-loop-actions">
            <button><FilmSlate />换全局口播</button>
            <button disabled><Trash />清除</button>
          </div>

          <div className="reference-path">/demo/8月14日.mp4</div>

          <button
            className="reference-wide-button reference-export-track"
            disabled={rendering}
            onClick={openExportDialog}
          >
            <DownloadSimple weight="bold" />导出整条时间轴({exportTransparent ? "透明" : mainVideoVisible ? "合成" : "纯色"})
          </button>

          <section className="reference-control-group">
            <label>全局字体</label>
            <button className="reference-select"><TextAa />思源黑体<span><CaretDown /></span></button>
          </section>

          <div className="reference-switch-row">
            <span>文字光晕(发虚就关)</span>
            <button className="reference-switch" aria-label="文字光晕"><i /></button>
          </div>
          <div className="reference-switch-row">
            <span>安全区参考线</span>
            <button
              type="button"
              className={`reference-switch ${safetyGuideVisible ? "active" : ""}`}
              aria-label="安全区参考线"
              aria-pressed={safetyGuideVisible}
              title={safetyGuideVisible ? "隐藏安全区参考线" : "显示安全区参考线"}
              onClick={() => setSafetyGuideVisible((visible) => !visible)}
            >
              <i />
            </button>
          </div>
          <div className="reference-switch-row">
            <span>背景纯色</span>
            <button
              type="button"
              className={`reference-switch ${solidBackgroundEnabled ? "" : "active"}`}
              aria-label="背景纯色"
              aria-pressed={!solidBackgroundEnabled}
              title={
                solidBackgroundEnabled
                  ? "开启透明棋盘格背景"
                  : "关闭透明棋盘格，恢复纯黑背景"
              }
              onClick={() =>
                setSolidBackgroundEnabled((enabled) => !enabled)
              }
            >
              <i />
            </button>
          </div>
          <div className="reference-switch-row">
            <span>运镜分屏(缩到左)</span>
            <button className="reference-switch" aria-label="运镜分屏"><FrameCorners /><i /></button>
          </div>
            </>
          )}
        </aside>

        <div
          className={`sidebar-resizer sidebar-resizer-left${
            resizingSidebar === "left" ? " active" : ""
          }`}
          role="separator"
          aria-label="调整左侧栏宽度"
          aria-orientation="vertical"
          aria-valuemin={MIN_LEFT_PANEL_WIDTH}
          aria-valuemax={MAX_PANEL_WIDTH}
          aria-valuenow={leftPanelWidth}
          title="拖动调整左侧栏宽度"
          onPointerDown={(event) => beginSidebarResize("left", event)}
          onDoubleClick={() => setLeftPanelWidth(DEFAULT_LEFT_PANEL_WIDTH)}
        />

        <section className="workspace">
          <div className="workspace-toolbar">
            <span>
              {canvasWidth} × {canvasHeight} · {fps} FPS · {instances.length} 个动效 ·{" "}
              {resourceTracks.length} 个资源
            </span>
            <span>{formatTime(timelineSeconds)}</span>
          </div>
          <div className="stage-shell reference-stage-shell">
            <div className="reference-preview-frame">
              <div className="reference-preview-pills" aria-hidden="true">
                <b>实时预览</b>
                <span>{selectedDefinition?.name ?? "动效合成"}</span>
              </div>
              <div
                className="player-wrap reference-player-wrap"
                onPointerDown={beginMarqueeSelection}
              >
              {motionModule ? (
                <Player
                  ref={playerRef}
                  component={StudioPreviewComposition}
                  inputProps={previewInputProps}
                  durationInFrames={durationInFrames}
                  fps={fps}
                  compositionWidth={canvasWidth}
                  compositionHeight={canvasHeight}
                  controls
                  loop
                  clickToPlay={false}
                  spaceKeyToPlayOrPause={false}
                  acknowledgeRemotionLicense
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: solidBackgroundEnabled
                      ? "#05070a"
                      : "transparent",
                    backgroundImage: solidBackgroundEnabled
                      ? "none"
                      : "linear-gradient(45deg, #181b22 25%, transparent 25%), linear-gradient(-45deg, #181b22 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #181b22 75%), linear-gradient(-45deg, transparent 75%, #181b22 75%)",
                    backgroundPosition: solidBackgroundEnabled
                      ? undefined
                      : "0 0, 0 8px, 8px -8px, -8px 0",
                    backgroundSize: solidBackgroundEnabled
                      ? undefined
                      : "16px 16px",
                  }}
                />
              ) : (
                <div className="loading">正在启动 Remotion Player…</div>
              )}
              {visibleCanvasItems.map(
                ({ instance, definition, stackIndex }) => {
                  const isSelected = selectedInstanceIdSet.has(instance.id);
                  const isPrimary = selectedInstanceId === instance.id;
                  const isArrangementFocused =
                    instance.arrangementBatchId === activeArrangementBatch?.id &&
                    (!activeArrangementIntentId ||
                      instance.sourceIntentId === activeArrangementIntentId);
                  return (
                    <div
                      className={`canvas-selection ${
                        isSelected ? "selected" : ""
                      } ${isPrimary ? "primary" : ""} ${
                        isArrangementFocused ? "arrangement-focused" : ""
                      }`}
                      key={instance.id}
                      role="button"
                      aria-label={`选择预览组件 ${definition.name}`}
                      aria-pressed={isSelected}
                      style={{
                        left: `${
                          ((instance.position.x +
                            definition.bounds.x *
                              instance.position.scale *
                              globalCardScale) /
                            canvasWidth) *
                          100
                        }%`,
                        top: `${
                          ((instance.position.y +
                            definition.bounds.y *
                              instance.position.scale *
                              globalCardScale) /
                            canvasHeight) *
                          100
                        }%`,
                        width: `${(definition.bounds.width / canvasWidth) * 100}%`,
                        height: `${(definition.bounds.height / canvasHeight) * 100}%`,
                        transform: `scale(${instance.position.scale * globalCardScale})`,
                        zIndex: isSelected ? 40 + stackIndex : 20 + stackIndex,
                      }}
                      onPointerDown={(event) =>
                        beginCanvasTransform(event, "move", instance)
                      }
                      onContextMenu={(event) =>
                        showComponentMenu(event, "preview", instance.id)
                      }
                      title={
                        isSelected && selectedInstanceIds.length > 1
                          ? `已选 ${selectedInstanceIds.length} 个组件，拖动可整体移动`
                          : "点击选中；拖动移动；右键复制或删除"
                      }
                    >
                      {isSelected ? (
                        <span className="canvas-selection-label">
                          {isPrimary && selectedInstanceIds.length > 1
                            ? `${definition.name} · ${selectedInstanceIds.length} 个已选`
                            : definition.name}
                        </span>
                      ) : null}
                      {isPrimary && selectedInstanceIds.length === 1 ? (
                        <span
                          className="canvas-scale-handle"
                          aria-hidden="true"
                          onPointerDown={(event) =>
                            beginCanvasTransform(event, "scale", instance)
                          }
                        />
                      ) : null}
                    </div>
                  );
                },
              )}
              {marquee ? (
                <div
                  className="canvas-marquee"
                  style={{
                    left: `${marquee.left}%`,
                    top: `${marquee.top}%`,
                    width: `${marquee.width}%`,
                    height: `${marquee.height}%`,
                  }}
                  aria-hidden="true"
                />
              ) : null}
              </div>
              <div className="reference-preview-status" aria-hidden="true">
                <FilmSlate weight="fill" />
                <span>
                  {canvasOrientation === "portrait" ? "9:16" : "16:9"} · Remotion 实时渲染
                </span>
              </div>
            </div>
          </div>

          <div
            ref={timelineRef}
            className={`timeline ${
              activeArrangementBatch ? "has-arrangement-focus" : ""
            }`}
            style={{
              height: timelineHeight,
              flexBasis: timelineHeight,
            }}
          >
            <button
              className="timeline-resize-handle"
              onPointerDown={beginTimelineResize}
              aria-label="拖动调整时间轴高度"
              title="向上拖动扩大时间轴"
            >
              <span />
            </button>
            <button
              type="button"
              className="playhead timeline-playhead"
              style={{
                left: `calc(${trackOffsetLeft}px + ${(
                  (timelineContentWidth * playheadPercent) / 100 -
                  timelineScroll
                ).toFixed(1)}px)`,
              }}
              aria-label={`拖动播放指针，当前 ${formatTime(currentFrame / fps)}`}
              title="按住拖动播放指针"
              onPointerDown={beginPlayheadDrag}
            />
            {regionInFrame !== null || regionOutFrame !== null
              ? (() => {
                  const frameToX = (frame: number) =>
                    trackOffsetLeft +
                    (timelineContentWidth * frame) /
                      Math.max(1, durationInFrames - 1) -
                    timelineScroll;
                  const inX = regionInFrame !== null ? frameToX(regionInFrame) : null;
                  const outX = regionOutFrame !== null ? frameToX(regionOutFrame) : null;
                  const bandLeft =
                    inX !== null && outX !== null ? Math.min(inX, outX) : null;
                  const bandWidth =
                    inX !== null && outX !== null ? Math.abs(outX - inX) : null;
                  return (
                    <>
                      {bandLeft !== null && bandWidth !== null && bandWidth > 1 ? (
                        <div
                          className="timeline-region-band"
                          style={{ left: `${bandLeft.toFixed(1)}px`, width: `${bandWidth.toFixed(1)}px` }}
                          onDoubleClick={() => {
                            setRegionInFrame(null);
                            setRegionOutFrame(null);
                            setNotice({ tone: "info", text: "已清除区域出入点。" });
                          }}
                          title="导出区域（双击或 Alt+X 清除；按 4/5 重新设置）"
                        />
                      ) : null}
                      {inX !== null ? (
                        <button
                          type="button"
                          className="timeline-region-marker region-in"
                          style={{ left: `${inX.toFixed(1)}px` }}
                          onPointerDown={beginRegionMarkerDrag("in")}
                          aria-label="区域入点"
                          title="区域入点（拖动调整；播放头处按 4 重新设置）"
                        />
                      ) : null}
                      {outX !== null ? (
                        <button
                          type="button"
                          className="timeline-region-marker region-out"
                          style={{ left: `${outX.toFixed(1)}px` }}
                          onPointerDown={beginRegionMarkerDrag("out")}
                          aria-label="区域出点"
                          title="区域出点（拖动调整；播放头处按 5 重新设置）"
                        />
                      ) : null}
                    </>
                  );
                })()
              : null}
            <div className="timeline-head">
              <div className="timeline-status">
                <span>
                  当前 <b>{formatTime(currentFrame / fps)}</b>
                </span>
                <span>
                  总时长 <b>{formatTime(timelineSeconds)}</b>
                </span>
                {regionInFrame !== null && regionOutFrame !== null ? (
                  <span>
                    区域{" "}
                    <b>
                      {formatTime(
                        Math.min(regionInFrame, regionOutFrame) / fps,
                      )}{" "}
                      – {formatTime(Math.max(regionInFrame, regionOutFrame) / fps)}
                    </b>
                  </span>
                ) : null}
                <span className="timeline-card-count">
                  动效 <b>{instances.length}</b> · 资源 <b>{resourceTracks.length}</b>
                </span>
              </div>
              <div className="timeline-height-controls" aria-label="时间轴显示大小">
                <button
                  type="button"
                  aria-label="缩小时间轴"
                  title="缩小时间轴"
                  onClick={() => setTimelineHeight((height) => clamp(height - 24, 180, 520))}
                >
                  <Minus weight="bold" />
                </button>
                <button
                  type="button"
                  aria-label="恢复时间轴默认大小"
                  title="恢复默认大小"
                  onClick={() => setTimelineHeight(230)}
                >
                  <ArrowsInLineVertical weight="bold" />
                </button>
                <button
                  type="button"
                  aria-label="放大时间轴"
                  title="放大时间轴"
                  onClick={() => setTimelineHeight((height) => clamp(height + 24, 180, 520))}
                >
                  <Plus weight="bold" />
                </button>
              </div>
              <div className="timeline-height-controls" aria-label="时间轴横向缩放">
                <button
                  type="button"
                  aria-label="缩小时间比例"
                  title="缩小时间比例"
                  onClick={() => {
                    autoZoomAppliedRef.current = true;
                    setTimelineZoom((zoom) =>
                      clamp(Number((zoom / 1.25).toFixed(3)), 1, 16),
                    );
                  }}
                >
                  <Minus weight="bold" />
                </button>
                <button
                  type="button"
                  aria-label="时间比例适应窗口"
                  title="时间比例适应窗口"
                  onClick={() => {
                    autoZoomAppliedRef.current = true;
                    setTimelineZoom(1);
                    setTimelineScroll(0);
                  }}
                >
                  <ArrowsInLineVertical weight="bold" />
                </button>
                <button
                  type="button"
                  aria-label="放大时间比例"
                  title="放大时间比例"
                  onClick={() => {
                    autoZoomAppliedRef.current = true;
                    setTimelineZoom((zoom) =>
                      clamp(Number((zoom * 1.25).toFixed(3)), 1, 16),
                    );
                  }}
                >
                  <Plus weight="bold" />
                </button>
              </div>
            </div>
            {activeArrangementBatch ? (
              <div
                className="arrangement-focus-bar"
                aria-label="本次自动编排微调"
              >
                <div className="arrangement-focus-title">
                  <strong>本次自动编排</strong>
                  <span>
                    {activeArrangementBatch.motionIds.length} 动效 ·{" "}
                    {activeArrangementBatch.resourceIds.length} 资源
                  </span>
                </div>
                <div className="arrangement-focus-groups">
                  <button
                    type="button"
                    className={!activeArrangementIntentId ? "active" : ""}
                    onClick={() => focusArrangementIntent("")}
                  >
                    全部
                  </button>
                  {activeArrangementBatch.intents.map((intent) => (
                    <button
                      type="button"
                      className={
                        activeArrangementIntentId === intent.id ? "active" : ""
                      }
                      key={intent.id}
                      onClick={() => focusArrangementIntent(intent.id)}
                    >
                      {intent.label} · {formatTime(intent.startFrame / fps)}
                    </button>
                  ))}
                </div>
                <div className="arrangement-focus-actions">
                  <button
                    type="button"
                    className="undo-batch"
                    onClick={undoActiveArrangementBatch}
                    title="只移除本次自动插入的内容"
                  >
                    <Trash />撤销本次插入
                  </button>
                </div>
              </div>
            ) : null}
            <div
              className="ruler"
              onClick={(event) => seekTimelineFromClientX(event.clientX)}
              title="点击跳转到此时刻"
            >
              <div
                className="timeline-scroll-content"
                style={{
                  width: timelineContentWidth,
                  transform: `translateX(${-timelineScroll}px)`,
                }}
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <span key={index} style={{ left: `${index * 20}%` }}>
                    {formatTime((timelineSeconds * index) / 5)}
                  </span>
                ))}
              </div>
            </div>
            <div
              ref={timelineTracksRef}
              className="timeline-tracks"
              onPointerDown={beginTimelineMarquee}
            >
              {timelineLanes.map((lane, laneIndex) => {
                const firstClip = lane.clips[0];
                if (!firstClip) return null;
                const laneHidden = lane.clips.every(
                  (clip) => clip.visible === false,
                );
                const laneSelected =
                  lane.kind === "video"
                    ? lane.clips.some((clip) => clip.id === selectedVideoTrackId)
                    : lane.kind === "resource"
                      ? lane.clips.some(
                          (clip) => clip.id === selectedResourceTrackId,
                        )
                      : lane.clips.some((clip) =>
                          selectedInstanceIdSet.has(clip.id),
                        );
                const definition =
                  lane.kind === "motion"
                    ? definitionMap.get(firstClip.componentId)
                    : null;
                if (lane.kind === "motion" && !definition) return null;
                const laneName =
                  lane.kind === "video" || lane.kind === "resource"
                    ? firstClip.name
                    : definition!.name;
                const laneTrackHeight = trackHeights[lane.laneId] ?? 42;
                const isDragging = laneDrop?.draggedLaneId === lane.laneId;
                const isDropTarget =
                  laneDrop && laneDrop.targetLaneId === lane.laneId;
                const isDropBefore = isDropTarget && laneDrop.placement === "before";
                const isDropAfter = isDropTarget && laneDrop.placement === "after";
                return (
                  <div
                    className={`timeline-track-row ${
                      lane.kind === "video"
                        ? "timeline-video-track"
                        : lane.kind === "resource"
                          ? `resource-timeline-track resource-${firstClip.kind}`
                          : "motion-timeline-track"
                    } ${laneHidden ? "is-hidden" : ""} ${isDragging ? "is-dragging" : ""} ${isDropBefore ? "is-drop-before" : ""} ${isDropAfter ? "is-drop-after" : ""}`}
                    key={lane.laneId}
                    data-lane-id={lane.laneId}
                    style={{ "--track-height": `${laneTrackHeight}px` }}
                    onPointerDownCapture={(event) =>
                      beginLaneGesture(event, lane.laneId)
                    }
                    title="拖动空白处上下换层；拖动左侧上下缩放图标调整轨道大小；横向拖动片段可调时间"
                  >
                    <div
                      className={`${
                        lane.kind === "video"
                          ? "video-track-controls"
                          : "motion-track-controls"
                      } ${laneSelected ? "active" : ""}`}
                    >
                      <button
                        type="button"
                        className={
                          lane.kind === "video"
                            ? "video-track-toggle"
                            : "motion-track-toggle"
                        }
                        aria-pressed={!laneHidden}
                        aria-label={`${laneHidden ? "显示" : "隐藏"}${
                          lane.kind === "video"
                            ? "视频"
                            : lane.kind === "resource"
                              ? "资源"
                              : "动效"
                        }轨道 ${laneName}`}
                        title={`${laneHidden ? "显示" : "隐藏"}轨道（V）`}
                        onClick={() => {
                          if (lane.kind === "video") {
                            selectVideoTrack(firstClip.id);
                            toggleVideoTrackVisibility(firstClip.id);
                          } else if (lane.kind === "resource") {
                            selectResourceTrack(firstClip.id);
                            toggleResourceTrackVisibility(firstClip.id);
                          } else {
                            selectOnlyInstance(firstClip.id);
                            toggleMotionTrackVisibility(
                              lane.clips.map((clip) => clip.id),
                            );
                          }
                        }}
                      >
                        {laneHidden ? <EyeSlash /> : <Eye />}
                      </button>
                      <button
                        type="button"
                        className={
                          lane.kind === "video"
                            ? "video-track-select"
                            : "motion-track-select"
                        }
                        title={`${laneName}（选中后按 V 切换显示）`}
                        onClick={() => {
                          if (lane.kind === "video") {
                            selectVideoTrack(firstClip.id);
                            seekEditorFrame(firstClip.startFrame);
                          } else if (lane.kind === "resource") {
                            selectResourceTrack(firstClip.id);
                            seekEditorFrame(firstClip.startFrame);
                          } else {
                            selectOnlyInstance(firstClip.id);
                          }
                        }}
                      >
                        {lane.kind === "video" ? (
                          <VideoCamera weight="fill" />
                        ) : lane.kind === "resource" ? (
                          firstClip.kind === "sfx" ? (
                            <SpeakerHigh weight="fill" />
                          ) : (
                            <SelectionForeground weight="fill" />
                          )
                        ) : null}
                        <span>{String(laneIndex + 1).padStart(2, "0")}</span>
                      </button>
                      <button
                        type="button"
                        className="track-height-drag-control"
                        aria-label={`拖动调整${laneName}轨道上下长度`}
                        title="按住上下拖动，独立调整此轨道高度"
                        onPointerDown={(event) =>
                          beginTrackResize(event, lane.laneId, laneTrackHeight)
                        }
                      >
                        <ArrowsOutLineVertical weight="bold" />
                      </button>
                    </div>
                    <div
                      className="track-body"
                      style={{
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        className="timeline-scroll-content"
                        style={{
                          width: timelineContentWidth,
                          transform: `translateX(${-timelineScroll}px)`,
                        }}
                        onClick={(event) => {
                          if (event.target === event.currentTarget) {
                            const body = event.currentTarget.parentElement;
                            if (body) {
                              seekFromPointer(event, body as HTMLElement);
                            }
                          }
                        }}
                      >
                        {lane.kind === "video"
                          ? lane.clips.map((track) => (
                            <div
                              className={`clip video-clip ${
                                selectedVideoTrackId === track.id
                                  ? "selected"
                                  : ""
                              }`}
                              key={track.id}
                              style={{
                                left: `${(track.startFrame / durationInFrames) * 100}%`,
                                width: `${(track.durationInFrames / durationInFrames) * 100}%`,
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                selectVideoTrack(track.id);
                              }}
                              onPointerDown={(event) =>
                                beginVideoTimelineDrag(event, track, "move")
                              }
                              onContextMenu={(event) =>
                                showVideoTrackMenu(event, track.id)
                              }
                              title="拖动移动；W 分割、Q/E 裁剪；右键或按 S 删除"
                            >
                              <button
                                className="clip-handle left"
                                onPointerDown={(event) =>
                                  beginVideoTimelineDrag(event, track, "left")
                                }
                                aria-label={`调整视频 ${track.name} 开始时间`}
                              />
                              <span className="video-clip-name" title={track.name}>
                                {track.name}
                              </span>
                              <button
                                className="clip-handle right"
                                onPointerDown={(event) =>
                                  beginVideoTimelineDrag(event, track, "right")
                                }
                                aria-label={`调整视频 ${track.name} 结束时间`}
                              />
                            </div>
                          ))
                        : lane.kind === "resource"
                          ? lane.clips.map((track) => (
                              <div
                                className={`clip resource-clip resource-${track.kind} ${
                                  selectedResourceTrackId === track.id
                                    ? "selected"
                                    : ""
                                } ${
                                  track.arrangementBatchId === activeArrangementBatch?.id &&
                                  (!activeArrangementIntentId ||
                                    track.sourceIntentId === activeArrangementIntentId)
                                    ? "arrangement-focused"
                                    : ""
                                }`}
                                key={track.id}
                                style={{
                                  left: `${(track.startFrame / durationInFrames) * 100}%`,
                                  width: `${(track.durationInFrames / durationInFrames) * 100}%`,
                                }}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  selectResourceTrack(track.id);
                                }}
                                onPointerDown={(event) =>
                                  beginResourceTimelineDrag(event, track, "move")
                                }
                                onContextMenu={(event) =>
                                  showResourceTrackMenu(event, track.id)
                                }
                                title="拖动移动；拖动两侧调整时长；右键删除"
                              >
                                <button
                                  className="clip-handle left"
                                  onPointerDown={(event) =>
                                    beginResourceTimelineDrag(event, track, "left")
                                  }
                                  aria-label={`调整 ${track.name} 开始时间`}
                                />
                                <span title={track.name}>
                                  {track.kind.toUpperCase()} · {track.name}
                                </span>
                                <button
                                  className="clip-handle right"
                                  onPointerDown={(event) =>
                                    beginResourceTimelineDrag(event, track, "right")
                                  }
                                  aria-label={`调整 ${track.name} 结束时间`}
                                />
                              </div>
                            ))
                          : lane.clips.map((instance) => {
                            const clipDefinition = definitionMap.get(
                              instance.componentId,
                            );
                            if (!clipDefinition) return null;
                            const isArrangementFocused =
                              instance.arrangementBatchId ===
                                activeArrangementBatch?.id &&
                              (!activeArrangementIntentId ||
                                instance.sourceIntentId ===
                                  activeArrangementIntentId);
                            return (
                              <div
                              className={`clip ${
                                selectedInstanceIdSet.has(instance.id)
                                  ? "selected"
                                  : ""
                              } ${
                                isArrangementFocused
                                  ? "arrangement-focused"
                                  : ""
                              }`}
                              key={instance.id}
                              data-instance-id={instance.id}
                              style={{
                                left: `${(instance.startFrame / durationInFrames) * 100}%`,
                                width: `${(instance.durationInFrames / durationInFrames) * 100}%`,
                              }}
                              onPointerDown={(event) =>
                                beginTimelineDrag(event, instance, "move")
                              }
                              onContextMenu={(event) =>
                                showComponentMenu(
                                  event,
                                  "timeline",
                                  instance.id,
                                )
                              }
                              title="拖动移动；同轨片段不会重叠；拖动两侧调整长度；右键复制或删除"
                            >
                              <button
                                className="clip-handle left"
                                onPointerDown={(event) =>
                                  beginTimelineDrag(event, instance, "left")
                                }
                                aria-label={`调整 ${clipDefinition.name} 开始时间`}
                              />
                              <span>{clipDefinition.name}</span>
                              <button
                                className="clip-handle right"
                                onPointerDown={(event) =>
                                  beginTimelineDrag(event, instance, "right")
                                }
                                aria-label={`调整 ${clipDefinition.name} 结束时间`}
                              />
                              </div>
                            );
                            })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {timelineLanes.length === 0 ? (
                <div className="empty-timeline">
                  从左侧组件清单点击添加一个组件
                </div>
              ) : null}
              {timelineMarquee ? (
                <div
                  className="timeline-marquee"
                  style={{
                    left: `${timelineMarquee.left}%`,
                    top: `${timelineMarquee.top}%`,
                    width: `${timelineMarquee.width}%`,
                    height: `${timelineMarquee.height}%`,
                  }}
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <div
              className="timeline-hscrollbar"
              onPointerDown={beginHScrollbarDrag}
              title="拖动滑块左右预览时间轴"
            >
              <div
                className="timeline-hscroll-thumb"
                style={{
                  left: `${
                    (timelineScroll / Math.max(1, timelineContentWidth)) * 100
                  }%`,
                  width: `${
                    (trackViewportWidth / Math.max(1, timelineContentWidth)) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </section>

        <div
          className={`sidebar-resizer sidebar-resizer-right${
            resizingSidebar === "right" ? " active" : ""
          }`}
          role="separator"
          aria-label="调整右侧栏宽度"
          aria-orientation="vertical"
          aria-valuemin={MIN_RIGHT_PANEL_WIDTH}
          aria-valuemax={MAX_PANEL_WIDTH}
          aria-valuenow={rightPanelWidth}
          title="拖动调整右侧栏宽度"
          onPointerDown={(event) => beginSidebarResize("right", event)}
          onDoubleClick={() => setRightPanelWidth(DEFAULT_RIGHT_PANEL_WIDTH)}
        />

        <aside className="right-panel reference-right-panel">
          <header className="reference-inspector-head">
            <small>
              单卡参数 <i>·</i>{" "}
              {selectedResourceTrack
                ? `RESOURCE · ${selectedResourceTrack.kind.toUpperCase()}`
                : selectedInstance
                ? `CARD-${String(
                    instances.findIndex(
                      (instance) => instance.id === selectedInstance.id,
                    ) + 1,
                  ).padStart(2, "0")}`
                : "NO SELECTION"}
            </small>
            <div>
              <SlidersHorizontal weight="fill" />
              <strong>
                {selectedResourceTrack?.name ?? selectedDefinition?.name ?? "未选择效果"}
              </strong>
              <span>
                {selectedResourceTrack
                  ? `${selectedResourceTrack.kind.toUpperCase()} · ${selectedResourceTrack.resourceId}`
                  : selectedDefinition?.description ?? "从时间轴或效果库选择一个组件"}
              </span>
            </div>
          </header>

          <div className="reference-inspector-body">
            <section className="reference-inspector-section">
              <div className="reference-section-title">
                <strong>全局控制</strong><small>GLOBAL</small>
              </div>
              <div className="dynamic-prop-fields">
                <div className="reference-range-group">
                  <div className="reference-range-head">
                    <label>特效整体大小</label>
                    <b>{Math.round(globalCardScale * 100)}%</b>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="1"
                    value={Math.round(globalCardScale * 100)}
                    onChange={(event) =>
                      setGlobalCardScale(Number(event.target.value) / 100)
                    }
                    title="统一缩放所有动效卡片"
                  />
                </div>
                <div className="reference-range-group">
                  <div className="reference-range-head"><label>动画速度</label><b>1.00×</b></div>
                  <input type="range" min="0" max="100" defaultValue="35" />
                </div>
              </div>
            </section>
            {selectedResourceTrack ? (
              <>
                {selectedResourceTrack.kind === "icon" ||
                selectedResourceTrack.kind === "material" ? (
                  <section className="reference-inspector-section">
                    <div className="reference-section-title">
                      <strong>资源位置</strong><small>POSITION</small>
                    </div>
                    <div className="dynamic-prop-fields">
                      <div className="reference-range-group">
                        <div className="reference-range-head">
                          <label>水平位置</label>
                          <b>{Math.round(selectedResourceTrack.position.x)}px</b>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, canvasWidth)}
                          step={1}
                          value={clamp(
                            Math.round(selectedResourceTrack.position.x),
                            0,
                            Math.max(0, canvasWidth),
                          )}
                          onChange={(event) =>
                            updateResourceTrack(selectedResourceTrack.id, (track) => ({
                              ...track,
                              position: {
                                ...track.position,
                                x: Number(event.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="reference-range-group">
                        <div className="reference-range-head">
                          <label>垂直位置</label>
                          <b>{Math.round(selectedResourceTrack.position.y)}px</b>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, canvasHeight)}
                          step={1}
                          value={clamp(
                            Math.round(selectedResourceTrack.position.y),
                            0,
                            Math.max(0, canvasHeight),
                          )}
                          onChange={(event) =>
                            updateResourceTrack(selectedResourceTrack.id, (track) => ({
                              ...track,
                              position: {
                                ...track.position,
                                y: Number(event.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="reference-range-group">
                        <div className="reference-range-head">
                          <label>资源缩放</label>
                          <b>{Math.round(selectedResourceTrack.position.scale * 100)}%</b>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={300}
                          step={1}
                          value={Math.round(selectedResourceTrack.position.scale * 100)}
                          onChange={(event) =>
                            updateResourceTrack(selectedResourceTrack.id, (track) => ({
                              ...track,
                              position: {
                                ...track.position,
                                scale: Number(event.target.value) / 100,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="reference-inspector-section">
                    <div className="reference-section-title">
                      <strong>音频参数</strong><small>AUDIO</small>
                    </div>
                    <div className="dynamic-prop-fields">
                      <div className="reference-range-group">
                        <div className="reference-range-head">
                          <label>音量</label>
                          <b>{Math.round(selectedResourceTrack.volume * 100)}%</b>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(selectedResourceTrack.volume * 100)}
                          onChange={(event) =>
                            updateResourceTrack(selectedResourceTrack.id, (track) => ({
                              ...track,
                              volume: Number(event.target.value) / 100,
                            }))
                          }
                        />
                      </div>
                      <div className="reference-range-group">
                        <div className="reference-range-head">
                          <label>人声避让</label>
                          <b>{Math.round(selectedResourceTrack.voiceDucking * 100)}%</b>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(selectedResourceTrack.voiceDucking * 100)}
                          onChange={(event) =>
                            updateResourceTrack(selectedResourceTrack.id, (track) => ({
                              ...track,
                              voiceDucking: Number(event.target.value) / 100,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </section>
                )}
                <section className="reference-inspector-section">
                  <div className="reference-section-title">
                    <strong>时间范围</strong><small>TIMING</small>
                  </div>
                  <div className="dynamic-prop-fields">
                    <label className="prop-field">
                      <span>开始时间(秒)</span>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={(selectedResourceTrack.startFrame / fps).toFixed(1)}
                        onChange={(event) => {
                          const nextStart = Math.max(
                            0,
                            Math.round(Number(event.target.value) * fps),
                          );
                          updateResourceTrack(selectedResourceTrack.id, (track) => ({
                            ...track,
                            startFrame: nextStart,
                          }));
                          setManualTimelineEndFrame((current) =>
                            Math.max(
                              current,
                              nextStart + selectedResourceTrack.durationInFrames,
                            ),
                          );
                        }}
                      />
                    </label>
                    <label className="prop-field">
                      <span>资源时长(秒)</span>
                      <input
                        type="number"
                        min={3 / fps}
                        step={0.1}
                        value={(selectedResourceTrack.durationInFrames / fps).toFixed(1)}
                        onChange={(event) => {
                          const requestedFrames = Math.max(
                            3,
                            Math.round(Number(event.target.value) * fps),
                          );
                          const nextDuration = Math.min(
                            requestedFrames,
                            selectedResourceTrack.sourceDurationInFrames -
                              selectedResourceTrack.sourceStartFrame,
                          );
                          updateResourceTrack(selectedResourceTrack.id, (track) => ({
                            ...track,
                            durationInFrames: nextDuration,
                          }));
                          setManualTimelineEndFrame((current) =>
                            Math.max(
                              current,
                              selectedResourceTrack.startFrame + nextDuration,
                            ),
                          );
                        }}
                      />
                    </label>
                  </div>
                </section>
              </>
            ) : null}
            {(!selectedResourceTrack || pendingPreviewInspectorInstance) && inspectorInstance && inspectorDefinition ? (
              <section className="reference-inspector-section">
                <div className="reference-section-title">
                  <strong>独立大小与位置</strong><small>SIZE · POSITION</small>
                </div>
                <div className="dynamic-prop-fields">
                  <div className="reference-range-group">
                    <div className="reference-range-head">
                      <label>独立大小</label>
                      <b>{Math.round(inspectorInstance.position.scale * 100)}%</b>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={3}
                      step={0.01}
                      value={clamp(inspectorInstance.position.scale, 0.1, 3)}
                      title="只缩放当前选中组件，与全局整体大小相乘"
                      onChange={(event) => {
                        const nextScale = Number(event.target.value);
                        const nextMaxX = Math.max(
                          0,
                          Math.round(
                            canvasWidth -
                              inspectorDefinition.bounds.width * nextScale,
                          ),
                        );
                        const nextMinX =
                          inspectorDefinition.id === "QuickSetupProof"
                            ? 0
                            : Math.min(
                                0,
                                Math.round(
                                  canvasWidth -
                                  inspectorDefinition.bounds.width * nextScale,
                                ),
                              );
                        const nextMaxY = Math.max(
                          0,
                          Math.round(
                            canvasHeight -
                              inspectorDefinition.bounds.height * nextScale,
                          ),
                        );
                        const nextMinY = Math.min(
                          0,
                          Math.round(
                            canvasHeight -
                              inspectorDefinition.bounds.height * nextScale,
                          ),
                        );
                        updateInspectorInstance(inspectorInstance.id, (instance) => ({
                          ...instance,
                          position: {
                            ...instance.position,
                            scale: nextScale,
                            x: clamp(instance.position.x, nextMinX, nextMaxX),
                            y: clamp(instance.position.y, nextMinY, nextMaxY),
                          },
                        }));
                      }}
                    />
                  </div>
                  <div className="reference-range-group">
                    <div className="reference-range-head">
                      <label>水平位置</label>
                      <b>{Math.round(inspectorInstance.position.x)}px</b>
                    </div>
                    <input
                      type="range"
                      min={
                        inspectorDefinition.id === "QuickSetupProof"
                          ? 0
                          : Math.min(
                              0,
                              Math.round(
                                canvasWidth -
                                inspectorDefinition.bounds.width *
                                    inspectorInstance.position.scale,
                              ),
                            )
                      }
                      max={Math.max(
                        0,
                        Math.round(
                          canvasWidth -
                            inspectorDefinition.bounds.width *
                              inspectorInstance.position.scale,
                        ),
                      )}
                      step={1}
                      value={clamp(
                        Math.round(inspectorInstance.position.x),
                        inspectorDefinition.id === "QuickSetupProof"
                          ? 0
                          : Math.min(
                              0,
                              Math.round(
                                canvasWidth -
                                inspectorDefinition.bounds.width *
                                  inspectorInstance.position.scale,
                              ),
                            ),
                        Math.max(
                          0,
                          Math.round(
                            canvasWidth -
                            inspectorDefinition.bounds.width *
                              inspectorInstance.position.scale,
                          ),
                        ),
                      )}
                      onChange={(event) =>
                        updateInspectorInstance(inspectorInstance.id, (instance) => ({
                          ...instance,
                          position: {
                            ...instance.position,
                            x: Number(event.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="reference-range-group">
                    <div className="reference-range-head">
                      <label>垂直位置</label>
                      <b>{Math.round(inspectorInstance.position.y)}px</b>
                    </div>
                    <input
                      type="range"
                      min={Math.min(
                        0,
                        Math.round(
                          canvasHeight -
                            inspectorDefinition.bounds.height *
                              inspectorInstance.position.scale,
                        ),
                      )}
                      max={Math.max(
                        0,
                        Math.round(
                          canvasHeight -
                            inspectorDefinition.bounds.height *
                              inspectorInstance.position.scale,
                        ),
                      )}
                      step={1}
                      value={clamp(
                        Math.round(inspectorInstance.position.y),
                        Math.min(
                          0,
                          Math.round(
                            canvasHeight -
                            inspectorDefinition.bounds.height *
                              inspectorInstance.position.scale,
                          ),
                        ),
                        Math.max(
                          0,
                          Math.round(
                            canvasHeight -
                            inspectorDefinition.bounds.height *
                              inspectorInstance.position.scale,
                          ),
                        ),
                      )}
                      onChange={(event) =>
                        updateInspectorInstance(inspectorInstance.id, (instance) => ({
                          ...instance,
                          position: {
                            ...instance.position,
                            y: Number(event.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </section>
            ) : null}
            {(!selectedResourceTrack || pendingPreviewInspectorInstance) && inspectorInstance && inspectorDefinition ? (
              <section className="reference-inspector-section">
                <div className="reference-section-title">
                  <strong>卡片底色</strong><small>OPACITY</small>
                </div>
                <div className="dynamic-prop-fields">
                  <span
                    className={`pill-toggle${inspectorInstance.backgroundOpacity > 0 ? ' active' : ''}`}
                    role="switch"
                    aria-checked={inspectorInstance.backgroundOpacity > 0}
                    onClick={() =>
                      updateInspectorInstance(inspectorInstance.id, (instance) => ({
                        ...instance,
                        backgroundOpacity: instance.backgroundOpacity > 0 ? 0 : 1,
                      }))
                    }
                  >
                    <span className="pill-toggle-dot" />
                    <span className="pill-toggle-text">显示卡片底色</span>
                  </span>
                  <div className="reference-range-group">
                    <div className="reference-range-head">
                      <label>底色透明度</label>
                      <b>
                        {Math.round(
                          clamp(inspectorInstance.backgroundOpacity, 0, 1) * 100,
                        )}
                        %
                      </b>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={clamp(inspectorInstance.backgroundOpacity, 0, 1)}
                      title="只调整当前选中组件的卡片底色：100% 为原设计底色，0% 为完全透明"
                      onChange={(event) =>
                        updateInspectorInstance(inspectorInstance.id, (instance) => ({
                          ...instance,
                          backgroundOpacity: clamp(
                            Number(event.target.value),
                            0,
                            1,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              </section>
            ) : null}
            {!selectedResourceTrack && selectedInstance && selectedDefinition ? (
              <section className="reference-inspector-section">
                <div className="reference-section-title">
                  <strong>单组件导出</strong><small>EXPORT</small>
                </div>
                <button
                  className="reference-wide-button single-export-action"
                  disabled={rendering}
                  onClick={exportInstanceTransparentMov}
                  title="只渲染当前选中组件：透明底 ProRes 4444 MOV，可直接拖入剪映"
                >
                  <DownloadSimple />
                  导出透明 MOV
                </button>
              </section>
            ) : null}
            {selectedResourceTrack ? null : !selectedInstance || !selectedDefinition ? (
              <div className="reference-inspector-empty">
                在时间轴中选择组件或资源后，可在这里修改参数。
              </div>
            ) : (
              <>
                <section className="reference-inspector-group">
                  <label>当前效果</label>
                  <button className="reference-inspector-select">
                    <span>{selectedDefinition.name} · {selectedDefinition.description}</span>
                  </button>
                </section>
                <section className="reference-inspector-section">
                  <div className="reference-section-title">
                    <strong>组件参数</strong><small>PROPERTIES</small>
                  </div>
                  <div className="dynamic-prop-fields">
                    {Object.entries(selectedDefinition.propsSchema).map(
                      ([key, schema]) => {
                        if (
                          selectedDefinition.id === "PortraitWorkflowPrerequisite"
                        ) {
                          const match = key.match(/^step(?:Color)?(\d+)$/);
                          const activeStepCount = clamp(
                            Math.round(
                              Number(selectedInstance.props.stepCount ?? 4),
                            ),
                            1,
                            8,
                          );
                          if (match && Number(match[1]) > activeStepCount) {
                            return null;
                          }
                        }
                        if (
                          selectedDefinition.id === "PortraitSkillSourceFusion"
                        ) {
                          const match = key.match(/^source(\d+)(?:Detail|Color)?$/);
                          const activeSourceCount = clamp(
                            Math.round(
                              Number(selectedInstance.props.sourceCount ?? 3),
                            ),
                            1,
                            8,
                          );
                          if (match && Number(match[1]) > activeSourceCount) {
                            return null;
                          }
                        }
                        if (
                          selectedDefinition.id === "PortraitDesignRuleChecklist"
                        ) {
                          const match = key.match(/^rule(\d+)$/);
                          const activeRuleCount = clamp(
                            Math.round(
                              Number(selectedInstance.props.ruleCount ?? 4),
                            ),
                            1,
                            8,
                          );
                          if (match && Number(match[1]) > activeRuleCount) {
                            return null;
                          }
                        }
                        if (selectedDefinition.id === "PortraitRiskWarning") {
                          const match = key.match(/^(?:risk|icon)(\d+)$/);
                          const activeRiskCount = clamp(
                            Math.round(Number(selectedInstance.props.riskCount ?? 3)),
                            1,
                            8,
                          );
                          if (match && Number(match[1]) > activeRiskCount) {
                            return null;
                          }
                        }
                        if (
                          selectedDefinition.id === "PortraitSkillResultComparison"
                        ) {
                          const match = key.match(/^material(\d+)(?:Url|Eyebrow|Title|Detail|Color)$/);
                          const activeMaterialCount = clamp(
                            Math.round(
                              Number(selectedInstance.props.materialCount ?? 3),
                            ),
                            1,
                            8,
                          );
                          if (match && Number(match[1]) > activeMaterialCount) {
                            return null;
                          }
                        }
                        if (
                          selectedDefinition.id === "PortraitPromptIterationShowcase"
                        ) {
                          const match = key.match(/^iteration(\d+)(?:Url|Prompt|Badge|Color)$/);
                          const activeIterationCount = clamp(
                            Math.round(
                              Number(selectedInstance.props.iterationCount ?? 3),
                            ),
                            1,
                            8,
                          );
                          if (match && Number(match[1]) > activeIterationCount) {
                            return null;
                          }
                        }
                        if (
                          selectedDefinition.id === "PortraitGsapSkillShowcase"
                        ) {
                          const match = key.match(/^capability(\d+)(?:Title|Detail)$/);
                          const activeCapabilityCount = clamp(
                            Math.round(
                              Number(selectedInstance.props.capabilityCount ?? 3),
                            ),
                            1,
                            8,
                          );
                          if (match && Number(match[1]) > activeCapabilityCount) {
                            return null;
                          }
                        }
                        if (
                          selectedDefinition.id === "PortraitCodeDecisionChecklist"
                        ) {
                          const match = key.match(/^question(\d+)$/);
                          const activeQuestionCount = clamp(
                            Math.round(
                              Number(selectedInstance.props.questionCount ?? 6),
                            ),
                            1,
                            8,
                          );
                          if (match && Number(match[1]) > activeQuestionCount) {
                            return null;
                          }
                        }
                        if (
                          selectedDefinition.id === "PortraitBrowserRepairLoop"
                        ) {
                          const match = key.match(/^step(\d+)$/);
                          const activeStepCount = clamp(
                            Math.round(
                              Number(selectedInstance.props.stepCount ?? 6),
                            ),
                            2,
                            8,
                          );
                          if (match && Number(match[1]) > activeStepCount) {
                            return null;
                          }
                        }
                        if (
                          selectedDefinition.id === "PortraitSkillStepGrid"
                        ) {
                          const match = key.match(/^step(\d+)(?:Title|Subtitle)$/);
                          const activeStepCount = clamp(
                            Math.round(Number(selectedInstance.props.stepCount ?? 4)),
                            1,
                            8,
                          );
                          if (match && Number(match[1]) > activeStepCount) {
                            return null;
                          }
                        }
                        return renderPropControl(
                          key,
                          schema,
                          selectedInstance.props[key] ?? schema.default,
                        );
                      },
                    )}
                  </div>
                </section>
                <section className="reference-inspector-section">
                  <div className="reference-section-title">
                    <strong>时间范围</strong><small>TIMING</small>
                  </div>
                  <div className="dynamic-prop-fields">
                    <TimingStepper
                      label="开始时间(秒)"
                      value={selectedInstance.startFrame / fps}
                      min={0}
                      step={0.1}
                      onChange={(nextSeconds) => {
                        const nextStart = Math.max(
                          0,
                          Math.round(nextSeconds * fps),
                        );
                        updateInstance(selectedInstance.id, (instance) => ({
                          ...instance,
                          startFrame: nextStart,
                        }));
                        setManualTimelineEndFrame((current) =>
                          Math.max(
                            current,
                            nextStart + selectedInstance.durationInFrames,
                          ),
                        );
                      }}
                    />
                    <TimingStepper
                      label="卡片时长(秒)"
                      value={selectedInstance.durationInFrames / fps}
                      min={3 / fps}
                      step={0.1}
                      onChange={(nextSeconds) => {
                        const nextDuration = Math.max(
                          3,
                          Math.round(nextSeconds * fps),
                        );
                        updateInstance(selectedInstance.id, (instance) => ({
                          ...instance,
                          durationInFrames: nextDuration,
                        }));
                        setManualTimelineEndFrame((current) =>
                          Math.max(
                            current,
                            selectedInstance.startFrame + nextDuration,
                          ),
                        );
                      }}
                    />
                  </div>
                </section>
              </>
            )}
          </div>
        </aside>

      </main>

      {shortcutPanelOpen ? (
        <div
          className="shortcut-dialog-backdrop"
          onPointerDown={() => {
            setRecordingShortcut(null);
            setShortcutPanelOpen(false);
          }}
        >
          <section
            className="shortcut-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcut-dialog-title"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <Keyboard weight="fill" />
                <span>
                  <strong id="shortcut-dialog-title">剪辑台快捷键</strong>
                  <small>点击按键框，然后按下新的组合键</small>
                </span>
              </div>
              <button
                type="button"
                aria-label="关闭快捷键设置"
                onClick={() => {
                  setRecordingShortcut(null);
                  setShortcutPanelOpen(false);
                }}
              >
                <X />
              </button>
            </header>

            <div className="shortcut-list">
              {SHORTCUT_DEFINITIONS.map((definition) => (
                <div className="shortcut-row" key={definition.action}>
                  <span>
                    <strong>{definition.label}</strong>
                    <small>{definition.description}</small>
                  </span>
                  <button
                    type="button"
                    className={
                      recordingShortcut === definition.action ? "recording" : ""
                    }
                    onClick={() => setRecordingShortcut(definition.action)}
                  >
                    <kbd>
                      {recordingShortcut === definition.action
                        ? "请按键…"
                        : formatShortcut(shortcutDraft[definition.action])}
                    </kbd>
                  </button>
                </div>
              ))}
            </div>

            <footer>
              <button
                type="button"
                className="shortcut-reset"
                onClick={() => {
                  setShortcutDraft({ ...DEFAULT_SHORTCUTS });
                  setRecordingShortcut(null);
                }}
              >
                <ArrowCounterClockwise />恢复默认
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setRecordingShortcut(null);
                    setShortcutPanelOpen(false);
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="shortcut-save"
                  onClick={saveShortcutSettings}
                >
                  <FloppyDisk weight="fill" />保存设置
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {groupDialogOpen ? (
        <div
          className="shortcut-dialog-backdrop"
          onPointerDown={() => setGroupDialogOpen(false)}
        >
          <section
            className="shortcut-dialog group-dialog"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>
                  <strong>{groupRenameTarget ? "重命名效果分组" : "新建效果分组"}</strong>
                  <small>{groupRenameTarget ? "名称修改会立即保存到当前浏览器" : "新分组会保存到当前浏览器"}</small>
                </span>
              </div>
              <button onClick={() => setGroupDialogOpen(false)}>
                <X />
              </button>
            </header>
            <div className="group-dialog-body">
              <label htmlFor="new-effect-group-name">分组名称</label>
              <input
                id="new-effect-group-name"
                autoFocus
                maxLength={30}
                value={groupNameDraft}
                onChange={(event) => setGroupNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    if (groupRenameTarget) renameCatalogGroup();
                    else createCatalogGroup();
                  }
                  if (event.key === "Escape") setGroupDialogOpen(false);
                }}
                placeholder="例如：我的常用效果"
              />
            </div>
            <footer>
              <span />
              <div>
                <button onClick={() => setGroupDialogOpen(false)}>取消</button>
                <button
                  className="shortcut-save"
                  disabled={!groupNameDraft.trim()}
                  onClick={() => {
                    if (groupRenameTarget) renameCatalogGroup();
                    else createCatalogGroup();
                  }}
                >
                  {groupRenameTarget ? "保存名称" : "新建分组"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {iconGroupRenameTarget ? (
        <div
          className="shortcut-dialog-backdrop icon-group-rename-backdrop"
          onPointerDown={() => setIconGroupRenameTarget(null)}
        >
          <section
            className="shortcut-dialog group-dialog"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>
                  <strong>重命名图标分组</strong>
                  <small>名称会同步更新该分组内的手动导入图标</small>
                </span>
              </div>
              <button onClick={() => setIconGroupRenameTarget(null)}>
                <X />
              </button>
            </header>
            <div className="group-dialog-body">
              <label htmlFor="rename-icon-group-name">分组名称</label>
              <input
                id="rename-icon-group-name"
                autoFocus
                maxLength={20}
                value={iconGroupNameDraft}
                onChange={(event) => setIconGroupNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveIconGroupRename();
                  if (event.key === "Escape") setIconGroupRenameTarget(null);
                }}
              />
            </div>
            <footer>
              <span />
              <div>
                <button onClick={() => setIconGroupRenameTarget(null)}>取消</button>
                <button
                  className="shortcut-save"
                  disabled={!iconGroupNameDraft.trim()}
                  onClick={saveIconGroupRename}
                >
                  保存名称
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {sfxGroupRenameTarget ? (
        <div
          className="shortcut-dialog-backdrop icon-group-rename-backdrop"
          onPointerDown={() => setSfxGroupRenameTarget(null)}
        >
          <section
            className="shortcut-dialog group-dialog"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>
                  <strong>重命名音效分组</strong>
                  <small>名称会同步更新该分组内的音效</small>
                </span>
              </div>
              <button onClick={() => setSfxGroupRenameTarget(null)}>
                <X />
              </button>
            </header>
            <div className="group-dialog-body">
              <label htmlFor="rename-sfx-group-name">分组名称</label>
              <input
                id="rename-sfx-group-name"
                autoFocus
                maxLength={20}
                value={sfxGroupNameDraft}
                onChange={(event) => setSfxGroupNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveSfxGroupRename();
                  if (event.key === "Escape") setSfxGroupRenameTarget(null);
                }}
              />
            </div>
            <footer>
              <span />
              <div>
                <button onClick={() => setSfxGroupRenameTarget(null)}>取消</button>
                <button
                  className="shortcut-save"
                  disabled={!sfxGroupNameDraft.trim()}
                  onClick={saveSfxGroupRename}
                >
                  保存名称
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {pendingGroupDelete ? (
        <div
          className="shortcut-dialog-backdrop delete-confirm-backdrop"
          onPointerDown={() => setPendingGroupDelete(null)}
        >
          <section
            className="delete-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-group-title"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="delete-confirm-icon">
              <Trash />
            </div>
            <div className="delete-confirm-copy">
              <small>DELETE GROUP</small>
              <h2 id="delete-group-title">删除“{pendingGroupDelete.groupName}”？</h2>
              <p>
                {pendingGroupDelete.componentIds.length > 0
                  ? `该分组包含 ${pendingGroupDelete.componentIds.length} 个效果。确认后将同时删除对应源码、效果库条目和所有时间轴实例。`
                  : "该分组当前没有效果，确认后将从效果库中移除。"}
              </p>
              <div className="delete-confirm-warning">
                此操作不可撤销，请确认已保留需要的 Git 或本地备份。
              </div>
            </div>
            <footer>
              <button
                className="delete-confirm-cancel"
                onClick={() => setPendingGroupDelete(null)}
              >
                取消
              </button>
              <button
                className="delete-confirm-submit"
                onClick={() => deleteCatalogGroup(pendingGroupDelete)}
              >
                <Trash />
                确认删除
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {effectRenameTarget ? (
        <div
          className="shortcut-dialog-backdrop"
          onPointerDown={() => setEffectRenameTarget(null)}
        >
          <section
            className="shortcut-dialog group-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-effect-title"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>
                  <strong id="rename-effect-title">重命名效果组件</strong>
                  <small>只修改工作台显示名称，组件 ID 和源码保持不变</small>
                </span>
              </div>
              <button onClick={() => setEffectRenameTarget(null)}>
                <X />
              </button>
            </header>
            <div className="group-dialog-body">
              <label htmlFor="rename-effect-name">组件名称</label>
              <input
                id="rename-effect-name"
                autoFocus
                maxLength={40}
                value={effectNameDraft}
                onChange={(event) => setEffectNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") renameEffect();
                  if (event.key === "Escape") setEffectRenameTarget(null);
                }}
                placeholder="输入新的组件名称"
              />
            </div>
            <footer>
              <span />
              <div>
                <button onClick={() => setEffectRenameTarget(null)}>取消</button>
                <button
                  className="shortcut-save"
                  disabled={!effectNameDraft.trim()}
                  onClick={renameEffect}
                >
                  保存名称
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {effectMoveTarget ? (
        <div
          className="shortcut-dialog-backdrop effect-move-backdrop"
          onPointerDown={() => setEffectMoveTarget(null)}
        >
          <section
            className="effect-move-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-effect-title"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <small>MOVE EFFECT</small>
                <h2 id="move-effect-title">移动“{effectMoveTarget.effectName}”</h2>
                <p>选择目标分组，移动结果会自动保存。</p>
              </div>
              <button
                className="effect-move-close"
                aria-label="关闭"
                onClick={() => setEffectMoveTarget(null)}
              >
                <X />
              </button>
            </header>
            <div className="effect-move-groups">
              {availableEffectMoveGroups
                .filter((group) => group.id !== effectMoveTarget.currentGroupId)
                .map((group) => (
                  <button
                    key={group.id}
                    onClick={() => moveEffectToGroup(group.id, group.name)}
                  >
                    <span>{group.name}</span>
                    <b>{group.items.length}</b>
                  </button>
                ))}
            </div>
            <footer>
              <button onClick={() => setEffectMoveTarget(null)}>取消</button>
            </footer>
          </section>
        </div>
      ) : null}

      {notice ? (
        <button
          className={`toast ${notice.tone}`}
          onClick={() => setNotice(null)}
        >
          {notice.text}
        </button>
      ) : null}
      {pendingArrangement ? (
        <div
          className={`export-dialog-layer arrangement-preview-layer${
            arrangementPreviewMinimized ? " is-minimized" : ""
          }`}
          onPointerDown={
            arrangementPreviewMinimized
              ? undefined
              : () => {
                  stopArrangementAudioPreview();
                  setPendingArrangement(null);
                  setArrangementComponentPicker(null);
                  setArrangementResourcePicker(null);
                  setArrangementResourceSearch("");
                }
          }
        >
          {arrangementPreviewMinimized ? (
            <button
              type="button"
              className="arrangement-preview-minimized"
              aria-label="恢复编排预览"
              style={{
                left: `${arrangementPreviewMinimizedPosition.x}px`,
                top: `${arrangementPreviewMinimizedPosition.y}px`,
              }}
              onPointerDown={beginArrangementPreviewMinimizedDrag}
              onPointerMove={moveArrangementPreviewMinimized}
              onPointerUp={endArrangementPreviewMinimizedDrag}
              onPointerCancel={endArrangementPreviewMinimizedDrag}
              onClick={(event) => {
                if (arrangementPreviewMinimizedSuppressClickRef.current) {
                  event.preventDefault();
                  arrangementPreviewMinimizedSuppressClickRef.current = false;
                  return;
                }
                setArrangementPreviewMinimized(false);
              }}
            >
              <span>
                <small>ARRANGEMENT PREVIEW</small>
                <strong>编排预览已最小化</strong>
              </span>
              <b>已选 {pendingArrangement.selectedKeys.length} 项</b>
              <span className="arrangement-preview-minimized-restore">
                <ArrowsOutLineVertical />恢复
              </span>
            </button>
          ) : (
          <section
            className="arrangement-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="arrangement-preview-title"
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              left: `${arrangementPreviewDialogGeometry.x}px`,
              top: `${arrangementPreviewDialogGeometry.y}px`,
              width: `${arrangementPreviewDialogGeometry.width}px`,
              height: `${arrangementPreviewDialogGeometry.height}px`,
            }}
          >
            <header
              className="arrangement-preview-titlebar"
              onPointerDown={beginArrangementPreviewDialogDrag}
              onPointerMove={moveArrangementPreviewDialog}
              onPointerUp={endArrangementPreviewDialogDrag}
              onPointerCancel={endArrangementPreviewDialogDrag}
            >
              <div>
                <small>ARRANGEMENT PREVIEW</small>
                <strong id="arrangement-preview-title">编排预览 · 尚未写入时间线</strong>
                <span>{pendingArrangement.fileName}</span>
              </div>
              <div className="arrangement-preview-titlebar-actions">
                <button
                  type="button"
                  aria-label="最小化编排预览"
                  title="最小化（保留当前编排）"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => {
                    stopArrangementAudioPreview();
                    setArrangementComponentPicker(null);
                    setArrangementResourcePicker(null);
                    setArrangementResourceSearch("");
                    setArrangementPreviewMinimized(true);
                  }}
                >
                  <Minus />
                </button>
                <button
                  type="button"
                  className="arrangement-preview-set-default"
                  onClick={saveArrangementPreviewDialogDefaultSize}
                >
                  <FloppyDisk />设为默认大小
                </button>
                <button
                  type="button"
                  className="arrangement-preview-reset-layout"
                  onClick={resetArrangementPreviewDialogGeometry}
                >
                  <ArrowCounterClockwise />恢复窗口
                </button>
                <button
                  type="button"
                  aria-label="关闭编排预览"
                  title="关闭编排预览"
                  onClick={() => {
                    stopArrangementAudioPreview();
                    setPendingArrangement(null);
                    setArrangementComponentPicker(null);
                    setArrangementResourcePicker(null);
                    setArrangementResourceSearch("");
                  }}
                >
                  <X />
                </button>
              </div>
            </header>

            <div className="arrangement-preview-summary">
              <span>
                已选 <b>{pendingArrangement.selectedKeys.length}</b> /{" "}
                {pendingArrangement.motionInstances.length +
                  pendingArrangement.resourceTracks.length +
                  (pendingArrangement.captionInstance ? 1 : 0)}
              </span>
              <span>
                动效 {pendingArrangement.motionInstances.length} · 资源{" "}
                {pendingArrangement.resourceTracks.length} · 字幕{" "}
                {pendingArrangement.captionInstance ? 1 : 0}
              </span>
              <span>
                质检 {QUALITY_CONTROL_STATUS_LABELS[
                  pendingArrangement.qualityControlStatus
                ] ?? pendingArrangement.qualityControlStatus} ·{" "}
                {pendingArrangement.qualityControlCheckCount} 项
              </span>
              {pendingArrangement.semanticSummary ? (
                <span>
                  字幕 {pendingArrangement.semanticSummary.cueCount} 句
                  {pendingArrangement.semanticSummary.semanticSegmentCount &&
                  pendingArrangement.semanticSummary.semanticSegmentCount !==
                    pendingArrangement.semanticSummary.cueCount
                    ? ` → ${pendingArrangement.semanticSummary.semanticSegmentCount} 个语义段`
                    : ""}{" "}
                   · 检测意图{" "}
                   <b>{pendingArrangement.semanticSummary.detectedIntentCount ?? pendingArrangement.semanticSummary.intentCount}</b>
                   {pendingArrangement.semanticSummary.suppressedIntentCount
                     ? ` · 预览采用 ${pendingArrangement.semanticSummary.intentCount} · 密度抑制 ${pendingArrangement.semanticSummary.suppressedIntentCount}`
                     : ""} · 跳过{" "}
                   {pendingArrangement.semanticSummary.skippedCueCount} 段
                   {pendingArrangement.semanticSummary.repeatedAvoidedCount
                     ? ` · 避免重复 ${pendingArrangement.semanticSummary.repeatedAvoidedCount}`
                     : ""}
                   {pendingArrangement.semanticSummary.supportingSuppressedCount
                     ? ` · 减少堆叠 ${pendingArrangement.semanticSummary.supportingSuppressedCount}`
                     : ""}
                 </span>
              ) : null}
              {pendingArrangement.layoutSummary ? (
                <span
                  className={
                    pendingArrangement.layoutSummary.unresolvedCount > 0
                      ? "layout-warning"
                      : "layout-ok"
                  }
                >
                  自动避让 {pendingArrangement.layoutSummary.obstacleLabels.join("+")} ·{" "}
                  已布局 <b>{pendingArrangement.layoutSummary.visualCount}</b> · 缩放{" "}
                  {pendingArrangement.layoutSummary.scaledCount} · 冲突{" "}
                  {pendingArrangement.layoutSummary.unresolvedCount}
                </span>
              ) : null}
              <span className="preserve">原时间线将保留</span>
            </div>

            <div className="arrangement-preferences" aria-label="AI 编排偏好">
              <div className="arrangement-preferences-title">
                <span>
                  <strong>
                    编排规则 · {activeArrangementRule?.name ?? "我的语义风格"}
                  </strong>
                  <small>偏好保存在本机，只从最终确认插入的选择中学习</small>
                </span>
                <div className="arrangement-preferences-title-actions">
                  <input
                    type="text"
                    value={newArrangementRuleName}
                    maxLength={40}
                    placeholder="给这套风格命名"
                    aria-label="新语义风格名称"
                    onChange={(event) => setNewArrangementRuleName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") savePendingArrangementAsNewStyle();
                    }}
                  />
                  <button
                    type="button"
                    className="arrangement-save-style"
                    disabled={!arrangementRulesFileReady}
                    onClick={savePendingArrangementAsNewStyle}
                  >
                    <Plus weight="bold" />保存为新风格
                  </button>
                  <button
                    type="button"
                    disabled={
                      Object.keys(arrangementPreferences.componentScores).length === 0
                    }
                    onClick={clearLearnedArrangementPreferences}
                  >
                    清空学习记录
                  </button>
                </div>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={arrangementPreferences.keepStyleConsistent}
                  onChange={(event) =>
                    updateArrangementPreferences({
                      keepStyleConsistent: event.target.checked,
                    })
                  }
                />
                <span>
                  <strong>保持统一视觉风格</strong>
                  <small>统一当前编排的主强调色，风险色仍保留语义区分</small>
                </span>
              </label>
              <label className="arrangement-accent-field">
                <input
                  type="color"
                  value={arrangementPreferences.accentColor}
                  disabled={!arrangementPreferences.keepStyleConsistent}
                  aria-label="统一风格主色"
                  onChange={(event) =>
                    updateArrangementPreferences({ accentColor: event.target.value })
                  }
                />
                <span>
                  <strong>统一主色</strong>
                  <small>{arrangementPreferences.accentColor.toUpperCase()}</small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={arrangementPreferences.autoAddIcons}
                  onChange={(event) =>
                    updateArrangementPreferences({
                      autoAddIcons: event.target.checked,
                    })
                  }
                />
                <span>
                  <strong>自动添加独立图标</strong>
                  <small>默认关闭；需要时仍可在每个语义段手动添加</small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={arrangementPreferences.learnFromConfirmedChoices}
                  onChange={(event) =>
                    updateArrangementPreferences({
                      learnFromConfirmedChoices: event.target.checked,
                    })
                  }
                />
                <span>
                  <strong>记住我确认的组件</strong>
                  <small>下次优先推荐保留的组件，降低未选组件权重</small>
                </span>
              </label>
            </div>

            {pendingArrangement.captionInstance ? (
              <div className="arrangement-caption-controls">
                <label className="arrangement-caption-toggle">
                  <TextAa aria-hidden="true" />
                  <span>
                    <strong>字幕</strong>
                    <small>
                      导入 {pendingArrangement.semanticSummary?.cueCount ?? 0} 句真实 SRT，按原时间戳实时显示
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={pendingArrangement.selectedKeys.includes(
                      `caption:${pendingArrangement.captionInstance.id}`,
                    )}
                    onChange={() =>
                      togglePendingArrangementItem(
                        `caption:${pendingArrangement.captionInstance!.id}`,
                      )
                    }
                  />
                  <i aria-hidden="true" />
                </label>
                <label
                  className={`arrangement-caption-toggle ${
                    pendingArrangement.selectedKeys.includes(
                      `caption:${pendingArrangement.captionInstance.id}`,
                    )
                      ? ""
                      : "is-disabled"
                  }`}
                >
                  <SelectionForeground aria-hidden="true" />
                  <span>
                    <strong>图标</strong>
                    <small>按字幕语义调用图标库，默认关闭</small>
                  </span>
                  <input
                    type="checkbox"
                    disabled={!pendingArrangement.selectedKeys.includes(
                      `caption:${pendingArrangement.captionInstance.id}`,
                    )}
                    checked={pendingArrangement.captionInstance.props.showIcon === true}
                    onChange={() =>
                      setPendingArrangement((current) =>
                        current?.captionInstance
                          ? {
                              ...current,
                              captionInstance: {
                                ...current.captionInstance,
                                props: {
                                  ...current.captionInstance.props,
                                  showIcon:
                                    current.captionInstance.props.showIcon !== true,
                                },
                              },
                            }
                          : current,
                      )
                    }
                  />
                  <i aria-hidden="true" />
                </label>
              </div>
            ) : null}

            {pendingArrangement.qualityControlChecks.length > 0 ? (
              <div className="arrangement-qc-list" aria-label="自动质检结果">
                {pendingArrangement.qualityControlChecks.map((check) => (
                  <div
                    className={`arrangement-qc-item ${check.status}`}
                    key={check.type}
                  >
                    <i>{QUALITY_CONTROL_LABELS[check.type] ?? check.type}</i>
                    <span>
                      <strong>
                        {QUALITY_CONTROL_STATUS_LABELS[check.status] ??
                          check.status}
                      </strong>
                      <small>{check.message}</small>
                    </span>
                    <b>
                      {check.affectedExpressionIds.length > 0
                        ? `${check.affectedExpressionIds.length} 项受影响`
                        : "无异常项"}
                    </b>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="arrangement-preview-actions">
              <button
                type="button"
                onClick={() => setAllPendingArrangementItems(true)}
              >
                全选
              </button>
              <button
                type="button"
                onClick={() => setAllPendingArrangementItems(false)}
              >
                全不选
              </button>
            </div>

            <div className="arrangement-preview-editor">
              <div className="arrangement-preview-list">
              {pendingArrangementSegments.map((segment, segmentIndex) => {
                const locked = pendingArrangement.lockedSegmentIds.includes(
                  segment.id,
                );
                const semanticCandidates = (
                  pendingArrangement.componentCandidatesBySegment[segment.id] ??
                  arrangementComponentDefinitions.map((definition, index) => ({
                    componentId: definition.id,
                    rank: index + 1,
                    reason: "来自当前画幅的可编排组件库",
                    props: {},
                  }))
                )
                  .filter((candidate) => definitionMap.has(candidate.componentId))
                  .sort(
                    (left, right) =>
                      (arrangementPreferences.componentScores[
                        right.componentId
                      ] ?? 0) -
                        (arrangementPreferences.componentScores[
                          left.componentId
                        ] ?? 0) || left.rank - right.rank,
                  );
                const candidateGroups = [...semanticCandidates.reduce(
                  (groups, candidate) => {
                    const definition = definitionMap.get(candidate.componentId)!;
                    const groupName =
                      EFFECT_REGISTRY_BY_ID.get(candidate.componentId)
                        ?.catalogGroup ?? definition.category;
                    const groupCandidates = groups.get(groupName) ?? [];
                    groupCandidates.push(candidate);
                    groups.set(groupName, groupCandidates);
                    return groups;
                  },
                  new Map<string, ArrangementComponentCandidate[]>(),
                )];
                const pickerTargetInstance = arrangementComponentPicker?.instanceId
                  ? segment.motionInstances.find(
                      (instance) =>
                        instance.id === arrangementComponentPicker.instanceId,
                    )
                  : null;
                const resourcePickerOpen =
                  arrangementResourcePicker?.segmentId === segment.id;
                const resourcePickerKind = resourcePickerOpen
                  ? arrangementResourcePicker.kind
                  : "icon";
                const preferredResourceIds =
                  ARRANGEMENT_RESOURCE_RECOMMENDATIONS[
                    getArrangementRouteId(segment.id)
                  ]?.[resourcePickerKind] ?? [];
                const resourceQuery = arrangementResourceSearch
                  .trim()
                  .toLocaleLowerCase("zh-CN");
                const visibleResourceCandidates = [
                  ...arrangementResourceLibrary[resourcePickerKind],
                ]
                  .filter((resource) => {
                    if (!resourceQuery) return true;
                    return [
                      resource.label,
                      resource.id,
                      resource.category,
                      resource.usage,
                      ...resource.tags,
                    ].some((text) =>
                      text.toLocaleLowerCase("zh-CN").includes(resourceQuery),
                    );
                  })
                  .sort((left, right) => {
                    const leftRank = preferredResourceIds.indexOf(left.id);
                    const rightRank = preferredResourceIds.indexOf(right.id);
                    return (
                      (leftRank < 0 ? 999 : leftRank) -
                        (rightRank < 0 ? 999 : rightRank) ||
                      left.label.localeCompare(right.label, "zh-CN")
                    );
                  });
                const resourceCandidateGroups = [
                  ...visibleResourceCandidates.reduce((groups, resource) => {
                    const groupName =
                      resourcePickerKind === "sfx"
                        ? sfxSectionName(resource, customSfxGroups)
                        : resource.category ||
                          (resourcePickerKind === "material" ? "素材" : "图标");
                    const groupResources = groups.get(groupName) ?? [];
                    groupResources.push(resource);
                    groups.set(groupName, groupResources);
                    return groups;
                  }, new Map<string, ArrangementResourceEntry[]>()),
                ];
                const pickerTargetResource = arrangementResourcePicker?.trackId
                  ? segment.resourceTracks.find(
                      (track) => track.id === arrangementResourcePicker.trackId,
                    )
                  : null;
                const pickerOpen =
                  arrangementComponentPicker?.segmentId === segment.id;
                const semanticSource =
                  pendingArrangement.semanticSourcesBySegment?.[segment.id];
                const sourceCueLabel = semanticSource?.sourceCueIndices.length
                  ? semanticSource.sourceCueIndices.length === 1
                    ? String(semanticSource.sourceCueIndices[0]).padStart(2, "0")
                    : `${String(semanticSource.sourceCueIndices[0]).padStart(2, "0")}–${String(semanticSource.sourceCueIndices.at(-1)).padStart(2, "0")}`
                  : "";
                return (
                  <section
                    className={`arrangement-segment${locked ? " locked" : ""}`}
                    key={segment.id}
                  >
                    <header className="arrangement-segment-header">
                      <div className="arrangement-segment-copy">
                        <div className="arrangement-segment-meta">
                          <strong>语义段 {segmentIndex + 1}</strong>
                          <time>
                            {formatTime(segment.startFrame / fps)} –{" "}
                            {formatTime(segment.endFrame / fps)}
                          </time>
                          <small>
                            {segment.motionInstances.length} 个动效 ·{" "}
                            {segment.resourceTracks.length} 个资源 ·{" "}
                            {semanticCandidates.length} 个语义候选
                          </small>
                        </div>
                        {semanticSource?.text ? (
                          <div className="arrangement-segment-source">
                            <b>{sourceCueLabel ? `SRT ${sourceCueLabel}` : "SRT"}</b>
                            <p>{semanticSource.text}</p>
                            {semanticSource.semanticLabel ? (
                              <i>{semanticSource.semanticLabel}</i>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="arrangement-segment-actions">
                        <button
                          type="button"
                          className={
                            activePendingPreviewSegmentId === segment.id
                              ? "active"
                              : undefined
                          }
                          onClick={() =>
                            previewPendingArrangementMotion(
                              segment.id,
                              segment.motionInstances[0]?.id,
                            )
                          }
                        >
                          调节本段
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openArrangementPreviewWindow(
                              segment.id,
                              segment.motionInstances[0]?.id,
                            )
                          }
                        >
                          <FrameCorners />打开大窗口
                        </button>
                        <button
                          type="button"
                          disabled={locked || semanticCandidates.length < 2}
                          onClick={() =>
                            regeneratePendingArrangementSegment(segment.id)
                          }
                        >
                          换一组
                        </button>
                        <button
                          type="button"
                          disabled={locked || semanticCandidates.length === 0}
                          onClick={() => {
                            stopArrangementAudioPreview();
                            setArrangementResourcePicker(null);
                            setArrangementComponentPicker({
                              mode: "add",
                              segmentId: segment.id,
                            });
                          }}
                        >
                          <Plus />添加效果
                        </button>
                        <button
                          type="button"
                          className={locked ? "active" : undefined}
                          aria-pressed={locked}
                          onClick={() =>
                            togglePendingArrangementSegmentLock(segment.id)
                          }
                        >
                          {locked ? "已锁定" : "锁定"}
                        </button>
                      </div>
                    </header>

                    <div className="arrangement-resource-actions">
                      <span>资源</span>
                      {(
                        [
                          ["icon", "图标"],
                          ["material", "素材"],
                          ["sfx", "音效"],
                        ] as const
                      ).map(([kind, label]) => {
                        const count = arrangementResourceLibrary[kind].length;
                        return (
                          <button
                            type="button"
                            key={kind}
                            disabled={locked || count === 0}
                            title={count === 0 ? `${label}库暂无可用资源` : `添加${label}`}
                            onClick={() => {
                              setArrangementComponentPicker(null);
                              setArrangementResourceSearch("");
                              setArrangementResourcePicker({
                                mode: "add",
                                segmentId: segment.id,
                                kind,
                              });
                            }}
                          >
                            <Plus />{label}
                            <b>{count}</b>
                          </button>
                        );
                      })}
                    </div>

                    {resourcePickerOpen ? (
                      <div className="arrangement-resource-picker">
                        <header>
                          <div>
                            <strong>
                              {arrangementResourcePicker.mode === "replace"
                                ? `替换${
                                    resourcePickerKind === "icon"
                                      ? "图标"
                                      : resourcePickerKind === "material"
                                        ? "素材"
                                        : "音效"
                                  }`
                                : `添加${
                                    resourcePickerKind === "icon"
                                      ? "图标"
                                      : resourcePickerKind === "material"
                                        ? "素材"
                                        : "音效"
                                  }`}
                            </strong>
                            <small>
                              前列为当前语义推荐，也可以搜索并自由选择全部固定资源
                            </small>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              stopArrangementAudioPreview();
                              setArrangementResourcePicker(null);
                              setArrangementResourceSearch("");
                            }}
                          >
                            <X />关闭
                          </button>
                        </header>
                        <label className="arrangement-resource-search">
                          <MagnifyingGlass />
                          <input
                            autoFocus
                            type="search"
                            value={arrangementResourceSearch}
                            onChange={(event) =>
                              setArrangementResourceSearch(event.target.value)
                            }
                            placeholder="搜索名称、标签或用途"
                          />
                          <b>{visibleResourceCandidates.length}</b>
                        </label>
                        {resourceCandidateGroups.length > 0 ? (
                          <div className="arrangement-resource-groups">
                            {resourceCandidateGroups.map(
                              ([groupName, groupResources]) => (
                                <section key={groupName}>
                                  <header>
                                    <strong>{groupName}</strong>
                                    <small>{groupResources.length} 项</small>
                                  </header>
                                  <div className="arrangement-resource-grid">
                                    {groupResources.map((resource) => {
                                      const isCurrent =
                                        pickerTargetResource?.resourceId ===
                                        resource.id;
                                      const isRecommended =
                                        preferredResourceIds.includes(resource.id);
                                      const applyResource = () => {
                                        if (
                                          arrangementResourcePicker.mode ===
                                            "replace" &&
                                          arrangementResourcePicker.trackId
                                        ) {
                                          replacePendingArrangementResource(
                                            arrangementResourcePicker.trackId,
                                            resource,
                                          );
                                        } else {
                                          addPendingArrangementResource(
                                            segment.id,
                                            resourcePickerKind,
                                            resource,
                                          );
                                        }
                                      };
                                      return (
                                        <article
                                          className={`arrangement-resource-card${
                                            isCurrent ? " current" : ""
                                          }`}
                                          key={resource.id}
                                        >
                                          <button
                                            type="button"
                                            className="arrangement-resource-main"
                                            disabled={isCurrent}
                                            onClick={applyResource}
                                          >
                                            <span className="arrangement-resource-preview">
                                              {resourcePickerKind === "sfx" ? (
                                                <i className="arrangement-waveform">
                                                  {Array.from({ length: 18 }, (_, index) => (
                                                    <b
                                                      key={index}
                                                      style={{
                                                        height: `${
                                                          20 +
                                                          ((index * 17 +
                                                            resource.id.length * 9) %
                                                            64)
                                                        }%`,
                                                      }}
                                                    />
                                                  ))}
                                                </i>
                                              ) : resource.mimeType.startsWith(
                                                  "video/",
                                                ) ? (
                                                <video
                                                  src={resource.url}
                                                  muted
                                                  autoPlay
                                                  loop
                                                  playsInline
                                                />
                                              ) : (
                                                <img
                                                  src={resource.url}
                                                  alt=""
                                                  loading="lazy"
                                                />
                                              )}
                                              {isRecommended ? <b>AI 推荐</b> : null}
                                            </span>
                                            <span className="arrangement-resource-copy">
                                              <strong>{resource.label}</strong>
                                              <small>{resource.usage}</small>
                                              <em>{resource.tags.join(" · ")}</em>
                                            </span>
                                          </button>
                                          <footer>
                                            <span>
                                              {resource.durationSeconds
                                                ? `${resource.durationSeconds.toFixed(2)} 秒`
                                                : resource.category}
                                            </span>
                                            {resourcePickerKind === "sfx" ? (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  previewArrangementAudio(resource)
                                                }
                                              >
                                                <Play weight="fill" />试听
                                              </button>
                                            ) : null}
                                            <button
                                              type="button"
                                              disabled={isCurrent}
                                              onClick={applyResource}
                                            >
                                              {isCurrent
                                                ? "当前资源"
                                                : arrangementResourcePicker.mode ===
                                                    "replace"
                                                  ? "使用"
                                                  : "添加"}
                                            </button>
                                          </footer>
                                        </article>
                                      );
                                    })}
                                  </div>
                                </section>
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="arrangement-resource-empty">
                            当前资源库没有匹配项
                          </div>
                        )}
                      </div>
                    ) : null}

                    {pickerOpen ? (
                      <div className="arrangement-component-picker">
                        <header>
                          <div>
                            <strong>
                              {arrangementComponentPicker.mode === "replace"
                                ? "替换当前动效"
                                : "向当前段添加效果"}
                            </strong>
                            <small>
                              只显示当前语义匹配的 {semanticCandidates.length} 个候选
                            </small>
                          </div>
                          <button
                            type="button"
                            onClick={() => setArrangementComponentPicker(null)}
                          >
                            <X />关闭
                          </button>
                        </header>
                        <div className="arrangement-candidate-groups">
                          {candidateGroups.map(([groupName, groupCandidates]) => (
                            <section key={groupName}>
                              <header>
                                <strong>{groupName}</strong>
                                <small>{groupCandidates.length} 个候选</small>
                              </header>
                              <div className="arrangement-candidate-grid">
                                {groupCandidates.map((candidate) => {
                                  const definition = definitionMap.get(
                                    candidate.componentId,
                                  )!;
                                  const isCurrent =
                                    pickerTargetInstance?.componentId ===
                                    candidate.componentId;
                                  const isUsed = segment.motionInstances.some(
                                    (instance) =>
                                      instance.componentId === candidate.componentId,
                                  );
                                  const applyCandidate = () => {
                                    if (
                                      arrangementComponentPicker.mode === "replace" &&
                                      arrangementComponentPicker.instanceId
                                    ) {
                                      replacePendingArrangementMotion(
                                        arrangementComponentPicker.instanceId,
                                        candidate,
                                      );
                                    } else {
                                      addPendingArrangementMotion(
                                        segment.id,
                                        candidate,
                                      );
                                    }
                                  };
                                  return (
                                    <button
                                      type="button"
                                      className={`arrangement-candidate-card${
                                        isCurrent ? " current" : ""
                                      }`}
                                      key={candidate.componentId}
                                      disabled={isCurrent}
                                      onClick={applyCandidate}
                                    >
                                      <span className="arrangement-candidate-preview">
                                        <Player
                                          component={definition.component}
                                          inputProps={{
                                            ...defaultsFromDefinition(definition),
                                            ...candidate.props,
                                            backgroundOpacity: 0.72,
                                          }}
                                          durationInFrames={Math.max(
                                            45,
                                            Math.min(
                                              definition.durationInFrames,
                                              120,
                                            ),
                                          )}
                                          fps={fps}
                                          compositionWidth={Math.max(
                                            1,
                                            definition.bounds.width,
                                          )}
                                          compositionHeight={Math.max(
                                            1,
                                            definition.bounds.height,
                                          )}
                                          autoPlay
                                          loop
                                          muted
                                          controls={false}
                                          clickToPlay={false}
                                          spaceKeyToPlayOrPause={false}
                                          acknowledgeRemotionLicense
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: "#080b11",
                                          }}
                                        />
                                        <b>推荐 {candidate.rank}</b>
                                      </span>
                                      <span className="arrangement-candidate-copy">
                                        <strong>{definition.name}</strong>
                                        <small>{definition.description}</small>
                                        <em>{candidate.reason}</em>
                                      </span>
                                      <span className="arrangement-candidate-footer">
                                        <i>{definition.category}</i>
                                        <b>
                                          {isCurrent
                                            ? "当前组件"
                                            : isUsed
                                              ? "再次添加"
                                              : arrangementComponentPicker.mode ===
                                                  "replace"
                                                ? "使用此组件"
                                                : "添加到本段"}
                                        </b>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="arrangement-segment-items">
                      {segment.motionInstances.map((instance) => {
                        const key = `motion:${instance.id}`;
                        const definition = definitionMap.get(instance.componentId);
                        return (
                          <div className="arrangement-preview-item" key={key}>
                            <input
                              type="checkbox"
                              disabled={locked}
                              aria-label={`选择${definition?.name ?? instance.componentId}`}
                              checked={pendingArrangement.selectedKeys.includes(key)}
                              onChange={() => togglePendingArrangementItem(key)}
                            />
                            <i className="motion">动效</i>
                            <span>
                              <strong>{definition?.name ?? instance.componentId}</strong>
                              <small>
                                {instance.componentId}
                                {typeof instance.props.title === "string" &&
                                instance.props.title
                                  ? ` · ${instance.props.title}`
                                  : ""}
                              </small>
                            </span>
                            <time>
                              {formatTime(instance.startFrame / fps)} ·{" "}
                              {formatTime(instance.durationInFrames / fps)}
                            </time>
                            <div className="arrangement-item-actions">
                              <button
                                type="button"
                                className={
                                  selectedPendingPreviewInstance?.id === instance.id
                                    ? "active"
                                    : undefined
                                }
                              onClick={() =>
                                previewPendingArrangementMotion(
                                  segment.id,
                                  instance.id,
                                )
                              }
                            >
                                调节
                              </button>
                              <button
                                type="button"
                                disabled={locked || semanticCandidates.length === 0}
                                onClick={() => {
                                  previewPendingArrangementMotion(
                                    segment.id,
                                    instance.id,
                                  );
                                  setArrangementComponentPicker({
                                    mode: "replace",
                                    segmentId: segment.id,
                                    instanceId: instance.id,
                                  });
                                }}
                              >
                                替换
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {segment.resourceTracks.map((track) => {
                        const key = `resource:${track.id}`;
                        return (
                          <div className="arrangement-preview-item resource" key={key}>
                            <input
                              type="checkbox"
                              disabled={locked}
                              aria-label={`选择${track.name}`}
                              checked={pendingArrangement.selectedKeys.includes(key)}
                              onChange={() => togglePendingArrangementItem(key)}
                            />
                            <i className={track.kind}>
                              {track.kind === "icon"
                                ? "图标"
                                : track.kind === "material"
                                  ? "素材"
                                  : "音效"}
                            </i>
                            <span>
                              <strong>{track.name}</strong>
                              <small>{track.resourceId}</small>
                            </span>
                            <time>
                              {formatTime(track.startFrame / fps)} ·{" "}
                              {formatTime(track.durationInFrames / fps)}
                            </time>
                            <button
                              type="button"
                              disabled={
                                locked ||
                                arrangementResourceLibrary[track.kind].length === 0
                              }
                              onClick={() => {
                                setArrangementComponentPicker(null);
                                setArrangementResourceSearch("");
                                setArrangementResourcePicker({
                                  mode: "replace",
                                  segmentId: segment.id,
                                  kind: track.kind,
                                  trackId: track.id,
                                });
                              }}
                            >
                              替换
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              </div>
            </div>

            <footer>
              <span
                className={
                  pendingArrangement.qualityControlStatus === "failed"
                    ? "qc-blocked"
                    : undefined
                }
              >
                {pendingArrangement.qualityControlStatus === "failed"
                  ? "质检未通过，仍可插入所选项；失败项已列出，插入后请人工调整。"
                  : pendingArrangement.qualityControlStatus === "pending"
                    ? "组件已修改，质检状态待复核；只有勾选项会被插入。"
                    : "只有勾选项会被插入，取消不会修改时间线。"}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    stopArrangementAudioPreview();
                    setPendingArrangement(null);
                    setArrangementComponentPicker(null);
                    setArrangementResourcePicker(null);
                    setArrangementResourceSearch("");
                    setSrtDialogOpen(true);
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="arrangement-apply"
                  disabled={pendingArrangement.selectedKeys.length === 0}
                  onClick={applyPendingArrangement}
                >
                  <CheckCircle weight="fill" />确认插入所选项
                </button>
              </div>
            </footer>
            {ARRANGEMENT_PREVIEW_RESIZE_DIRECTIONS.map(
              ({ direction, label }) => (
                <button
                  type="button"
                  className={`arrangement-preview-resize-handle ${direction}`}
                  aria-label={label}
                  title={label}
                  key={direction}
                  onPointerDown={(event) =>
                    beginArrangementPreviewDialogResize(event, direction)
                  }
                  onPointerMove={resizeArrangementPreviewDialog}
                  onPointerUp={endArrangementPreviewDialogResize}
                  onPointerCancel={endArrangementPreviewDialogResize}
                >
                  {direction === "se" ? <ArrowsOutLineVertical /> : null}
                </button>
              ),
            )}
          </section>
          )}
        </div>
      ) : null}
      {srtDialogOpen ? (
        <div
          className="export-dialog-layer"
          onPointerDown={() => {
            if (!srtGenerating) setSrtDialogOpen(false);
          }}
        >
          <section
            className="srt-dialog arrangement-preview-dialog"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header className="arrangement-preview-titlebar">
              <div className="srt-dialog-title">
                <small>AI AUTO ARRANGE</small>
                <strong>字幕驱动的自动视觉编排</strong>
              </div>
              <div className="arrangement-preview-titlebar-actions">
                <button aria-label="关闭" disabled={srtGenerating} onClick={() => setSrtDialogOpen(false)}><X /></button>
              </div>
            </header>

            <div className="ai-arrangement-progress" role="status" aria-live="polite">
              {AI_ARRANGEMENT_STEPS.map((step, index) => {
                const activeIndex = AI_ARRANGEMENT_STEPS.findIndex(
                  (candidate) => candidate.id === aiArrangementStage,
                );
                const state =
                  activeIndex > index
                    ? "done"
                    : activeIndex === index
                      ? aiArrangementError
                        ? "error"
                        : "active"
                      : "pending";
                return (
                  <div className={`ai-arrangement-step ${state}`} key={step.id}>
                    <i>{state === "done" ? "✓" : index + 1}</i>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>

            {aiArrangementError ? (
              <div className="ai-arrangement-error">{aiArrangementError}</div>
            ) : null}

            <div className="srt-dialog-meta">
              <span>
                {srtFileName
                  ? `${srtFileName} · ${srtEntries.length} 条字幕`
                  : "尚未选择 SRT 文件"}
              </span>
              {srtResult ? (
                <b>
                  {srtResult.cueCount} 句
                  {srtResult.semanticSegmentCount &&
                  srtResult.semanticSegmentCount !== srtResult.cueCount
                    ? ` → ${srtResult.semanticSegmentCount} 个语义段`
                    : ""}{" "}
                  · {srtResult.detectedIntentCount ?? srtResult.intentCount} 个检测意图
                  {srtResult.suppressedIntentCount
                    ? ` · ${srtResult.intentCount} 个进入预览 · ${srtResult.suppressedIntentCount} 个密度抑制`
                    : ""} ·{" "}
                  {srtResult.motionCount} 个动效 · {srtResult.resourceCount} 个资源
                </b>
              ) : null}
            </div>

            <div className="arrangement-preferences compact" aria-label="自动编排设置">
              <div className="arrangement-active-rule-field">
                <span>
                  <strong>当前编排规则</strong>
                  <small>自动编排按所选风格匹配组件</small>
                </span>
                <select
                  value={activeArrangementRuleId}
                  disabled={srtGenerating}
                  onChange={(event) => activateArrangementRule(event.target.value)}
                >
                  {arrangementRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
                <div className="arrangement-active-rule-actions">
                  <button
                    type="button"
                    disabled={
                      srtGenerating || openingArrangementRulesLocation
                    }
                    onClick={() => void openArrangementRulesLocation()}
                    title="打开 rule-manifest.json 所在文件夹"
                  >
                    <FolderOpen weight="bold" />
                    {openingArrangementRulesLocation ? "打开中…" : "打开位置"}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={srtGenerating || arrangementRules.length <= 1}
                    onClick={deleteActiveArrangementRule}
                    title={
                      arrangementRules.length <= 1
                        ? "至少保留一条规则"
                        : "删除当前语义规则"
                    }
                  >
                    删除规则
                  </button>
                </div>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={arrangementPreferences.keepStyleConsistent}
                  disabled={srtGenerating}
                  onChange={(event) =>
                    updateArrangementPreferences({
                      keepStyleConsistent: event.target.checked,
                    })
                  }
                />
                <span>
                  <strong>保持统一风格</strong>
                  <small>同一主色贯穿本次编排</small>
                </span>
              </label>
              <label className="arrangement-accent-field">
                <input
                  type="color"
                  value={arrangementPreferences.accentColor}
                  disabled={
                    srtGenerating || !arrangementPreferences.keepStyleConsistent
                  }
                  aria-label="自动编排统一主色"
                  onChange={(event) =>
                    updateArrangementPreferences({ accentColor: event.target.value })
                  }
                />
                <span>
                  <strong>主色</strong>
                  <small>{arrangementPreferences.accentColor.toUpperCase()}</small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={arrangementPreferences.autoAddIcons}
                  disabled={srtGenerating}
                  onChange={(event) =>
                    updateArrangementPreferences({
                      autoAddIcons: event.target.checked,
                    })
                  }
                />
                <span>
                  <strong>自动图标</strong>
                  <small>默认关闭，避免无关图标</small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={arrangementPreferences.learnFromConfirmedChoices}
                  disabled={srtGenerating}
                  onChange={(event) =>
                    updateArrangementPreferences({
                      learnFromConfirmedChoices: event.target.checked,
                    })
                  }
                />
                <span>
                  <strong>记住选择</strong>
                  <small>只学习最终确认插入项</small>
                </span>
              </label>
            </div>

            <div className="srt-dialog-content">
              <div className="srt-dialog-list">
                {srtEntries.length === 0 ? (
                  <button
                    type="button"
                    className="srt-dialog-empty"
                    disabled={srtGenerating}
                    onClick={openSrtPicker}
                    title="点击选择 SRT 字幕文件"
                  >
                    <UploadSimple weight="bold" />
                    <strong>点击选择 SRT 文件</strong>
                    <span>
                      {videoUrl || videoTracks.length > 0
                        ? "已检测到当前视频。选择对应 SRT 后会立即完成语义分析、选效果、布局和质检。"
                        : "选择后立即完成语义分析、选效果、布局和质检；先生成预览，不会直接修改时间线。"}
                    </span>
                  </button>
                ) : (
                  srtEntries.map((entry) => (
                    <div className="srt-dialog-row" key={entry.index}>
                      <i>{String(entry.index).padStart(2, "0")}</i>
                      <small>
                        {new Date(entry.startMs)
                          .toISOString()
                          .substring(11, 21)
                          .replace(".", ",")}
                      </small>
                      <span>{entry.text}</span>
                    </div>
                  ))
                )}
              </div>

              {srtResult && srtResult.messages.length > 0 ? (
                <div className="srt-dialog-reminders">
                  {srtResult.messages.slice(0, 6).map((message, index) => (
                    <p key={index}>· {message}</p>
                  ))}
                  {srtResult.messages.length > 6 ? (
                    <p>· … 其余 {srtResult.messages.length - 6} 条省略</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <footer>
              {srtEntries.length > 0 ? (
                <button
                  className="srt-dialog-pick"
                  disabled={srtGenerating}
                  onClick={openSrtPicker}
                >
                  <UploadSimple />重新选择 SRT
                </button>
              ) : null}
              {srtEntries.length > 0 ? (
                <button
                  className="srt-dialog-confirm"
                  disabled={srtGenerating}
                  onClick={() => void generateSrtTimeline()}
                >
                  {srtGenerating
                    ? `${AI_ARRANGEMENT_STEPS.find((step) => step.id === aiArrangementStage)?.label ?? "自动编排"}中…`
                    : aiArrangementError
                      ? "重试自动编排"
                      : "重新运行自动编排"}
                </button>
              ) : null}
            </footer>
          </section>
        </div>
      ) : null}
      {exportDialogOpen ? (
        <div
          className="export-dialog-layer"
          onPointerDown={() => setExportDialogOpen(false)}
        >
          <section
            className="export-dialog"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header>
              <strong>{exportTransparent ? "导出透明 MOV" : "导出实时预览 MOV"}</strong>
              <button
                aria-label="关闭"
                onClick={() => setExportDialogOpen(false)}
              >
                <X />
              </button>
            </header>
            <label className="export-dialog-field">
              <span>保存文件夹</span>
              <div className="export-dialog-row">
                <input
                  type="text"
                  value={exportDirDraft}
                  aria-invalid={Boolean(exportDialogError)}
                  aria-describedby={
                    exportDialogError ? "export-dialog-error" : undefined
                  }
                  onChange={(event) => {
                    setExportDirDraft(event.target.value);
                    if (exportDialogError) setExportDialogError("");
                  }}
                  placeholder="例如 D:\导出"
                  spellCheck={false}
                />
                <button
                  className="export-dialog-browse"
                  disabled={exportPicking}
                  onClick={pickExportFolder}
                >
                  <FolderOpen weight="bold" />
                  {exportPicking ? "选择中…" : "选择文件夹"}
                </button>
              </div>
            </label>
            {exportDialogError ? (
              <p
                id="export-dialog-error"
                className="export-dialog-error"
                role="alert"
              >
                {exportDialogError}
              </p>
            ) : null}
            <label className="export-dialog-field">
              <span>文件名</span>
              <input
                type="text"
                value={exportFileNameDraft}
                onChange={(event) =>
                  setExportFileNameDraft(event.target.value)
                }
                placeholder={exportTransparent ? "动效透明导出.mov" : "实时预览导出.mov"}
                spellCheck={false}
              />
            </label>
            {regionInFrame !== null && regionOutFrame !== null ? (
              <label className="export-dialog-field export-dialog-checkline">
                <input
                  type="checkbox"
                  checked={exportUseRegion}
                  onChange={(event) =>
                    setExportUseRegion(event.target.checked)
                  }
                />
                <span>
                  仅导出区域范围（
                  {formatTime(
                    Math.min(regionInFrame, regionOutFrame) / fps,
                  )}{" "}
                  –{" "}
                  {formatTime(
                    Math.max(regionInFrame, regionOutFrame) / fps,
                  )}
                  ，按 4/5 重新设置）
                </span>
              </label>
            ) : null}
            <footer>
              <button onClick={() => setExportDialogOpen(false)}>取消</button>
              <button
                className="export-dialog-confirm"
                disabled={rendering || exportPicking}
                onClick={renderVideo}
              >
                <DownloadSimple weight="bold" />开始导出
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {rendering || renderProgress || renderResult ? (
        <aside className="export-panel">
          <header>
            <strong>
              {renderResult
                ? renderResult.mode === "transparent"
                  ? "透明导出完成"
                  : "预览 MOV 导出完成"
                : exportTransparent
                  ? "正在透明导出"
                  : "正在导出预览 MOV"}
            </strong>
            <button
              aria-label="关闭"
              disabled={rendering}
              onClick={() => {
                setRenderProgress(null);
                setRenderResult(null);
              }}
            >
              <X />
            </button>
          </header>
          {!renderResult && renderProgress ? (
            <div className="export-progress">
              <div className="export-progress-bar">
                <i
                  style={{
                    width: `${Math.round(renderProgress.progress * 100)}%`,
                  }}
                />
              </div>
              <p>{renderProgress.stage}</p>
              {exportFileName ? (
                <p className="export-folder-line">
                  将保存为 <b>{exportFileName}</b>
                </p>
              ) : null}
              <small>
                {renderProgress.renderedFrames} / {renderProgress.totalFrames} 帧
                {renderProgress.estimatedRemainingMs
                  ? ` · 预计剩余 ${Math.round(
                      renderProgress.estimatedRemainingMs / 1000,
                    )} 秒`
                  : ""}
              </small>
            </div>
          ) : null}
          {renderResult ? (
            <div className="export-result">
              {renderResult.savedTo ? (
                <button
                  className="export-saved-path"
                  onClick={() =>
                    openExportFolder(renderResult.savedTo as string)
                  }
                  title="点击打开所在文件夹"
                >
                  <CheckCircle weight="bold" />
                  <span className="export-saved-text">
                    已导出到 {renderResult.savedTo}
                  </span>
                  <FolderOpen weight="bold" />
                </button>
              ) : null}
              {renderResult.downloadUrl ? (
                <a
                  className="export-download"
                  href={renderResult.downloadUrl}
                  download={renderResult.fileName}
                >
                  <DownloadSimple weight="bold" />
                  下载 {renderResult.fileName}
                </a>
              ) : null}
              <dl className="export-verify">
                {renderResult.mode === "transparent" ? <div
                  className={
                    renderResult.alphaVerified === false ? "warn" : "ok"
                  }
                >
                  <dt>Alpha 校验（ffprobe）</dt>
                  <dd>
                    {renderResult.alphaVerified === false
                      ? "未检测到 Alpha，请重新导出"
                      : `已确认 · ${renderResult.codec} ${renderResult.profile} · ${renderResult.pixelFormat}`}
                  </dd>
                </div> : (
                  <div className="ok">
                    <dt>MOV 编码</dt>
                    <dd>{`ProRes ${renderResult.profile ?? "HQ"} · ${renderResult.pixelFormat ?? "yuv422p10le"}`}</dd>
                  </div>
                )}
                <div>
                  <dt>规格</dt>
                  <dd>
                    {renderResult.width}×{renderResult.height} ·{" "}
                    {renderResult.fps} fps · {renderResult.durationInFrames} 帧
                  </dd>
                </div>
              </dl>
              <p className="export-hint">
                {renderResult.mode === "transparent"
                  ? "已封装为 ProRes 4444 MOV，可直接拖入 Premiere / Final Cut / 剪映，透明底自动透出。"
                  : "已封装为带原声的 ProRes MOV，画面与当前未隐藏视频及动效轨道一致。"}
              </p>
            </div>
          ) : null}
        </aside>
      ) : null}
      {arrangementPreviewWindow &&
      !arrangementPreviewWindow.closed &&
      pendingArrangement
        ? createPortal(
            <main className="arrangement-popout-shell">
              <section
                className={`arrangement-popout-player ${canvasOrientation}`}
              >
                <div
                  className={
                    solidBackgroundEnabled
                      ? "arrangement-popout-player-frame"
                      : "arrangement-popout-player-frame transparent-grid"
                  }
                >
                  {motionModule && activePendingPreviewSegment ? (
                    <Player
                      ref={arrangementPreviewPopoutPlayerRef}
                      component={StudioPreviewComposition}
                      inputProps={pendingArrangementPreviewInputProps}
                      durationInFrames={durationInFrames}
                      fps={fps}
                      compositionWidth={canvasWidth}
                      compositionHeight={canvasHeight}
                      controls
                      loop
                      clickToPlay={false}
                      spaceKeyToPlayOrPause
                      acknowledgeRemotionLicense
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: solidBackgroundEnabled
                          ? "#05070a"
                          : "transparent",
                        backgroundImage: solidBackgroundEnabled
                          ? "none"
                          : "linear-gradient(45deg, #181b22 25%, transparent 25%), linear-gradient(-45deg, #181b22 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #181b22 75%), linear-gradient(-45deg, transparent 75%, #181b22 75%)",
                        backgroundPosition: solidBackgroundEnabled
                          ? undefined
                          : "0 0, 0 8px, 8px -8px, -8px 0",
                        backgroundSize: solidBackgroundEnabled
                          ? undefined
                          : "16px 16px",
                      }}
                    />
                  ) : (
                    <span>主窗口选中语义段后，这里会显示对应画面。</span>
                  )}
                </div>
              </section>

              <aside className="arrangement-popout-controls">
                <header>
                  <small>GLOBAL CONTROL</small>
                  <strong>独立预览</strong>
                  <span>仅保留与主界面实时同步的全局控制。</span>
                </header>
                <section>
                  <div className="arrangement-popout-control-title"><strong>全局控制</strong><small>GLOBAL</small></div>
                  <label className="arrangement-popout-range">
                    <span>特效整体大小 <b>{Math.round(globalCardScale * 100)}%</b></span>
                    <input type="range" min="50" max="200" value={Math.round(globalCardScale * 100)} onChange={(event) => setGlobalCardScale(Number(event.target.value) / 100)} />
                  </label>
                </section>
              </aside>
            </main>,
            arrangementPreviewWindow.document.body,
          )
        : null}

      {realtimePreviewWindow && !realtimePreviewWindow.closed
        ? createPortal(
            <main className="arrangement-popout-shell realtime-preview-shell">
              <section className={`arrangement-popout-player ${canvasOrientation}`}>
                <div
                  className={
                    solidBackgroundEnabled
                      ? "arrangement-popout-player-frame"
                      : "arrangement-popout-player-frame transparent-grid"
                  }
                >
                  {motionModule ? (
                    <Player
                      ref={realtimePreviewPlayerRef}
                      component={StudioPreviewComposition}
                      inputProps={previewInputProps}
                      durationInFrames={durationInFrames}
                      fps={fps}
                      compositionWidth={canvasWidth}
                      compositionHeight={canvasHeight}
                      controls
                      loop
                      clickToPlay={false}
                      spaceKeyToPlayOrPause
                      acknowledgeRemotionLicense
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: solidBackgroundEnabled
                          ? "#05070a"
                          : "transparent",
                        backgroundImage: solidBackgroundEnabled
                          ? "none"
                          : "linear-gradient(45deg, #181b22 25%, transparent 25%), linear-gradient(-45deg, #181b22 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #181b22 75%), linear-gradient(-45deg, transparent 75%, #181b22 75%)",
                        backgroundPosition: solidBackgroundEnabled
                          ? undefined
                          : "0 0, 0 8px, 8px -8px, -8px 0",
                        backgroundSize: solidBackgroundEnabled
                          ? undefined
                          : "16px 16px",
                      }}
                    />
                  ) : <span>正在启动实时预览…</span>}
                </div>
              </section>
            </main>,
            realtimePreviewWindow.document.body,
          )
        : null}

      {contextMenu ? (
        <>
          <div
            className="context-dismiss-layer"
            onPointerDown={() => setContextMenu(null)}
          />
          <div
            ref={contextMenuRef}
            className="component-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.source === "videoTimeline" ? (
              <>
                <small>视频轨道片段</small>
                <button
                  className="delete-action"
                  onClick={() =>
                    contextMenu.videoTrackId &&
                    removeVideoTrack(contextMenu.videoTrackId)
                  }
                >
                  删除视频片段（S）
                </button>
              </>
            ) : contextMenu.source === "resourceTimeline" ? (
              <>
                <small>资源轨道片段</small>
                <button
                  className="delete-action"
                  onClick={() =>
                    contextMenu.resourceTrackId &&
                    deleteResourceTrack(contextMenu.resourceTrackId)
                  }
                >
                  删除资源片段（S）
                </button>
              </>
            ) : contextMenu.source === "library" ? (
              <>
                <small>
                  {contextMenu.componentId
                    ? catalogDefinitionMap.get(contextMenu.componentId)?.name ?? "效果组件"
                    : "效果组件"}
                </small>
                {contextMenu.componentId ? (
                  <button
                    className="code-action"
                    onClick={() =>
                      contextMenu.componentId &&
                      openEffectInCodeEditor(contextMenu.componentId)
                    }
                  >
                    跳转到代码
                  </button>
                ) : null}
                {contextMenu.componentId ? (
                  <button
                    className="move-action"
                    onClick={() =>
                      contextMenu.componentId &&
                      openMoveEffectDialog(contextMenu.componentId)
                    }
                  >
                    移动到其他分组
                  </button>
                ) : null}
                <button
                  className="delete-action"
                  onClick={() =>
                    contextMenu.componentId && permanentlyDeleteEffect(contextMenu.componentId)
                  }
                >
                  彻底删除效果
                </button>
              </>
            ) : contextMenu.source === "libraryGroup" ? (
              <>
                <small>{contextMenu.groupName ?? "效果分组"}</small>
                <button className="create-action" onClick={openNewGroupDialog}>
                  新建分组
                </button>
                {contextMenu.groupId ? (
                  <button
                    className="group-rename-action"
                    onClick={() =>
                      contextMenu.groupId &&
                      openRenameGroupDialog(
                        contextMenu.groupId,
                        contextMenu.groupName ?? "效果分组",
                      )
                    }
                  >
                    重命名分组
                  </button>
                ) : null}
                <button
                  className="delete-action"
                  onClick={() =>
                    contextMenu.groupId &&
                    requestDeleteCatalogGroup(
                      contextMenu.groupId,
                      contextMenu.groupName ?? "效果分组",
                      contextMenu.groupComponentIds ?? [],
                    )
                  }
                >
                  删除分组
                </button>
              </>
            ) : contextMenu.source === "libraryRoot" ? (
              <>
              <small>效果库分组</small>
              <button className="create-action" onClick={openNewGroupDialog}>
                新建分组
              </button>
              </>
            ) : contextMenu.source === "iconLibrary" ? (
              <>
                <small>{contextMenu.groupName ?? "图标库"}</small>
                <button
                  className="icon-import-action"
                  onClick={() =>
                    openIconImportPicker(contextMenu.groupName ?? "内容与素材")
                  }
                >
                  <UploadSimple /> 导入 SVG 图标
                </button>
                <button className="icon-new-group-action" onClick={createIconGroup}>
                  新建分组
                </button>
                {contextMenu.iconGroupId ? (() => {
                  const group = customIconGroups.find(
                    (item) => item.id === contextMenu.iconGroupId,
                  );
                  return group ? (
                    <>
                      <button
                        className="icon-rename-group-action"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openRenameIconGroupDialog(group);
                        }}
                      >
                        重命名分组
                      </button>
                      <button className="delete-action" onClick={() => deleteIconGroup(group)}>
                        删除分组
                      </button>
                    </>
                  ) : null;
                })() : null}
                {contextMenu.iconId ? (
                  <button
                    className="code-action"
                    onClick={() => openIconFileLocation(contextMenu.iconId!)}
                  >
                    打开文件所在位置
                  </button>
                ) : null}
                {contextMenu.iconId &&
                iconResources.find((icon) => icon.id === contextMenu.iconId)
                  ?.source === "manual" ? (
                  <button
                    className="delete-action"
                    onClick={() => {
                      const icon = iconResources.find(
                        (item) => item.id === contextMenu.iconId,
                      );
                      if (icon) deleteManualIcon(icon);
                    }}
                  >
                    删除图标
                  </button>
                ) : null}
              </>
            ) : contextMenu.source === "sfxLibrary" ? (
              <>
                <small>{contextMenu.groupName ?? "音效库"}</small>
                <button className="icon-new-group-action" onClick={createSfxGroup}>
                  新建分组
                </button>
                {contextMenu.sfxGroupId ? (() => {
                  const group = customSfxGroups.find(
                    (item) => item.id === contextMenu.sfxGroupId,
                  );
                  return group ? (
                    <>
                      <button
                        className="icon-rename-group-action"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openRenameSfxGroupDialog(group);
                        }}
                      >
                        重命名分组
                      </button>
                      <button className="delete-action" onClick={() => deleteSfxGroup(group)}>
                        删除分组
                      </button>
                    </>
                  ) : null;
                })() : null}
              </>
            ) : contextMenu.source === "sfxItem" ? (() => {
              const sound = (arrangementResourceLibrary.sfx as SoundResource[]).find(
                (item) => item.id === contextMenu.soundId,
              );
              const currentSection = sound
                ? sfxSectionName(sound, customSfxGroups)
                : "";
              const moveTargets = customSfxGroups.filter(
                (group) => group.name !== currentSection,
              );
              return (
                <>
                  <small>{sound?.label ?? "音效"}</small>
                  {moveTargets.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        if (sound) void moveSfxToGroup(sound, group.name);
                      }}
                    >
                      移动到「{group.name}」
                    </button>
                  ))}
                  {customSfxGroups.some((group) => group.name === currentSection) ? (
                    <button onClick={() => sound && void moveSfxToGroup(sound, "")}>
                      移回默认分组
                    </button>
                  ) : null}
                  {sound?.source === "manual" ? (
                    <>
                      <button
                        className="code-action"
                        onClick={() => {
                          setContextMenu(null);
                          void openSfxFileLocation(sound.id);
                        }}
                      >
                        打开文件所在位置
                      </button>
                      <button
                        className="delete-action"
                        onClick={() => {
                          setContextMenu(null);
                          void deleteManualSfxResource(sound);
                        }}
                      >
                        删除音效
                      </button>
                    </>
                  ) : null}
                </>
              );
            })() : (
              <>
                <small>
                  {contextMenu.source === "preview" ? "预览组件" : "时间轴组件"}
                  {contextMenu.instanceIds.length > 1
                    ? ` · 已选 ${contextMenu.instanceIds.length} 个`
                    : ""}
                </small>
                <button
                  className="copy-action"
                  onClick={() => duplicateInstances(contextMenu.instanceIds)}
                >
                  复制组件
                </button>
                <button
                  className="delete-action"
                  onClick={() => deleteInstances(contextMenu.instanceIds)}
                >
                  删除组件（S）
                </button>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing #root element");
}

const globalWithStudioRoot = globalThis as typeof globalThis & {
  __motionStudioRoot?: ReturnType<typeof createRoot>;
};
const studioRoot =
  globalWithStudioRoot.__motionStudioRoot ?? createRoot(rootElement);
globalWithStudioRoot.__motionStudioRoot = studioRoot;

studioRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
