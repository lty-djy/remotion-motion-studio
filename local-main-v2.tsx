import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { Player, type PlayerRef } from "@remotion/player";
import { AbsoluteFill, OffthreadVideo, Sequence } from "remotion";
import {
  ArrowCounterClockwise,
  ArrowsInLineVertical,
  CaretDown,
  DeviceMobile,
  DownloadSimple,
  FilmSlate,
  FloppyDisk,
  FrameCorners,
  Keyboard,
  MagnifyingGlass,
  Minus,
  MoonStars,
  Pause,
  Play,
  Plus,
  SelectionForeground,
  SlidersHorizontal,
  SpeakerHigh,
  Sun,
  TextAa,
  Trash,
  UploadSimple,
  User,
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
} from "./local-protocol";
import {
  BUILT_IN_CATALOG,
  BUILT_IN_COMPONENT_IDS,
  isBuiltInDefinition,
  mergeWithBuiltInDefinitions,
} from "./local-builtins";
import { EFFECT_REGISTRY_BY_ID } from "./registry";
import "./local-styles.css";

type Notice = { tone: "ok" | "error" | "info"; text: string } | null;

type ShortcutAction =
  | "playPause"
  | "goStart"
  | "previousFrame"
  | "nextFrame"
  | "duplicate"
  | "delete";

type ShortcutMap = Record<ShortcutAction, string>;

const SHORTCUT_STORAGE_KEY = "overlay-studio-shortcuts-v1";
const PANEL_WIDTH_STORAGE_KEY = "motion-studio-panel-widths-v1";
const CUSTOM_GROUP_STORAGE_KEY = "motion-studio-custom-groups-v1";
const EFFECT_GROUP_STORAGE_KEY = "motion-studio-effect-groups-v1";
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
  playPause: "Space",
  goStart: "Home",
  previousFrame: "ArrowLeft",
  nextFrame: "ArrowRight",
  duplicate: "Control+D",
  delete: "Delete",
};

const SHORTCUT_DEFINITIONS: Array<{
  action: ShortcutAction;
  label: string;
  description: string;
}> = [
  { action: "playPause", label: "播放 / 暂停", description: "切换时间轴播放状态" },
  { action: "goStart", label: "回到开头", description: "播放头归零" },
  { action: "previousFrame", label: "上一帧", description: "向左移动一帧" },
  { action: "nextFrame", label: "下一帧", description: "向右移动一帧" },
  { action: "duplicate", label: "复制所选卡片", description: "复制当前选中的轨道卡片" },
  { action: "delete", label: "删除所选卡片", description: "删除当前选中的轨道卡片" },
];

const loadShortcuts = (): ShortcutMap => {
  try {
    const saved = window.localStorage.getItem(SHORTCUT_STORAGE_KEY);
    if (!saved) return { ...DEFAULT_SHORTCUTS };
    return { ...DEFAULT_SHORTCUTS, ...JSON.parse(saved) };
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
  instances: MotionInstance[];
  currentFrame?: number;
  theme?: "dark" | "light";
  timelineHeight?: number;
  canvasOrientation?: "landscape" | "portrait";
  createdAt?: string;
  updatedAt?: string;
};

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
    | "library"
    | "libraryGroup"
    | "libraryRoot";
  instanceIds: string[];
  componentId?: string;
  groupId?: string;
  groupName?: string;
  groupComponentIds?: string[];
};

type MarqueeRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

let instanceSequence = 0;

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
  const safeStart = clamp(
    Math.round(startFrame),
    0,
    Math.max(0, totalFrames - 1),
  );
  const maxDuration = Math.max(3, totalFrames - safeStart);
  return {
    id: createInstanceId(definition.id),
    componentId: definition.id,
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
    backgroundOpacity: clamp(overrides.backgroundOpacity ?? 0, 0, 1),
    props: {
      ...defaultsFromDefinition(definition),
      ...(overrides.props ?? {}),
    },
  };
};

const getRegisteredEffectPosition = (
  definition: MotionComponentDefinition,
  orientation: "landscape" | "portrait",
) => {
  const registeredEffect = EFFECT_REGISTRY_BY_ID.get(definition.id);
  if (!registeredEffect || orientation === "landscape") {
    return { ...definition.defaultPosition };
  }
  if (registeredEffect.placement === "top") {
    return { x: 0, y: 0, scale: 1080 / definition.bounds.width };
  }
  const scale = 0.45;
  const scaledWidth = definition.bounds.width * scale;
  const y =
    definition.id === "QuoteLockup"
      ? 1120
      : definition.id === "CompareSplit"
        ? 650
        : 430;
  return {
    x:
      registeredEffect.placement === "left"
        ? 24
        : 1080 - scaledWidth - 24,
    y,
    scale,
  };
};

type StudioPreviewProps = {
  videoUrl: string;
  sourceIncludesVideo: boolean;
  definitions: MotionComponentDefinition[];
  instances: MotionInstance[];
  canvasOrientation: "landscape" | "portrait";
};

const StudioPreviewComposition = ({
  videoUrl,
  sourceIncludesVideo,
  definitions,
  instances,
  canvasOrientation,
}: StudioPreviewProps) => {
  const previewDefinitionMap = useMemo(
    () => new Map(definitions.map((definition) => [definition.id, definition])),
    [definitions],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#05070a" }}>
      {videoUrl ? (
        <OffthreadVideo
          src={videoUrl}
          volume={1}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : null}
      {sourceIncludesVideo && !videoUrl ? (
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
      ) : (
        instances.map((instance) => {
          const definition = previewDefinitionMap.get(instance.componentId);
          if (!definition) return null;
          const Comp = definition.component;
          return (
            <Sequence
              key={instance.id}
              from={instance.startFrame}
              durationInFrames={Math.max(3, instance.durationInFrames)}
            >
              <AbsoluteFill
                style={{
                  transform: `translate(${instance.position.x}px, ${instance.position.y}px) scale(${instance.position.scale})`,
                  transformOrigin: "0 0",
                }}
              >
                <Comp
                  {...instance.props}
                  instanceDurationInFrames={instance.durationInFrames}
                  videoSrc={videoUrl}
                  hideVideo={sourceIncludesVideo}
                  backgroundOpacity={instance.backgroundOpacity}
                />
              </AbsoluteFill>
            </Sequence>
          );
        })
      )}
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
        <div
          style={{
            position: "absolute",
            top: canvasOrientation === "portrait" ? "12%" : "10%",
            bottom: canvasOrientation === "portrait" ? "10%" : "9%",
            left: "50%",
            width: canvasOrientation === "portrait" ? "38%" : "24%",
            translate: "-50% 0",
            border: "2px dashed rgba(255,255,255,.24)",
          }}
        >
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
              clipPath: "polygon(23% 0,77% 0,100% 28%,84% 100%,16% 100%,0 28%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 16,
              translate: "-50% 0",
              color: "rgba(255,255,255,.34)",
              fontSize: 16,
              letterSpacing: ".18em",
              whiteSpace: "nowrap",
            }}
          >
            人物安全区 · 禁止遮挡
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const App = () => {
  const playerRef = useRef<PlayerRef>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadDragCleanupRef = useRef<(() => void) | null>(null);
  const sidebarDragCleanupRef = useRef<(() => void) | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const componentInput = useRef<HTMLInputElement>(null);
  const activeComponentIdRef = useRef("");
  const workspaceReadyRef = useRef(false);
  const [motionModule, setMotionModule] = useState<MotionModule | null>(null);
  const [definitions, setDefinitions] = useState<MotionComponentDefinition[]>(
    [],
  );
  const [instances, setInstances] = useState<MotionInstance[]>([]);
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
  const [notice, setNotice] = useState<Notice>(null);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] =
    useState<RenderProgressState | null>(null);
  const [renderResult, setRenderResult] = useState<{
    fileName: string;
    downloadUrl: string;
    outputLocation: string;
  } | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [canvasOrientation, setCanvasOrientation] = useState<
    "landscape" | "portrait"
  >("landscape");
  const [initialPanelWidths] = useState(readStoredPanelWidths);
  const [leftPanelWidth, setLeftPanelWidth] = useState(initialPanelWidths.left);
  const [rightPanelWidth, setRightPanelWidth] = useState(initialPanelWidths.right);
  const [resizingSidebar, setResizingSidebar] = useState<"left" | "right" | null>(null);
  const [sourceIncludesVideo, setSourceIncludesVideo] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shortcutPanelOpen, setShortcutPanelOpen] = useState(false);
  const [recordingShortcut, setRecordingShortcut] =
    useState<ShortcutAction | null>(null);
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(loadShortcuts);
  const [shortcutDraft, setShortcutDraft] = useState<ShortcutMap>(loadShortcuts);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [timelineMarquee, setTimelineMarquee] =
    useState<MarqueeRect | null>(null);
  const [timelineHeight, setTimelineHeight] = useState(230);
  const [activeWorkspace, setActiveWorkspace] =
    useState<"editor" | "effects">("editor");
  const [effectSearch, setEffectSearch] = useState("");
  const [customCatalogGroups, setCustomCatalogGroups] = useState(
    loadCustomCatalogGroups,
  );
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [pendingGroupDelete, setPendingGroupDelete] =
    useState<PendingGroupDelete | null>(null);
  const [effectGroupAssignments, setEffectGroupAssignments] = useState(
    loadEffectGroupAssignments,
  );
  const [effectMoveTarget, setEffectMoveTarget] =
    useState<EffectMoveTarget | null>(null);
  const [openCatalogCategories, setOpenCatalogCategories] = useState<string[]>([
    "practice",
    "navigation",
  ]);

  useEffect(
    () => () => {
      playheadDragCleanupRef.current?.();
    },
    [],
  );

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
  const durationInFrames = Math.max(
    1,
    videoUrl ? Math.round(videoDuration * fps) : sourceFrames,
  );
  const canvasWidth = canvasOrientation === "portrait" ? 1080 : 1920;
  const canvasHeight = canvasOrientation === "portrait" ? 1920 : 1080;
  const timelineSeconds = durationInFrames / fps;
  const playheadPercent =
    (currentFrame / Math.max(1, durationInFrames - 1)) * 100;

  const definitionMap = useMemo(
    () => new Map(definitions.map((definition) => [definition.id, definition])),
    [definitions],
  );
  const selectedInstance =
    instances.find((instance) => instance.id === selectedInstanceId) ?? null;
  const selectedDefinition = selectedInstance
    ? definitionMap.get(selectedInstance.componentId) ?? null
    : null;
  const selectedInstanceIdSet = useMemo(
    () => new Set(selectedInstanceIds),
    [selectedInstanceIds],
  );
  const customDefinitions = useMemo(
    () =>
      definitions.filter(
        (definition) =>
          !BUILT_IN_COMPONENT_IDS.has(definition.id) &&
          !isBuiltInDefinition(definition),
      ),
    [definitions],
  );
  const effectCatalog = useMemo(() => {
    const groups = [
      ...BUILT_IN_CATALOG.map((group) => ({ ...group, items: [] as typeof group.items })),
      ...customCatalogGroups.map((group) => ({ ...group, items: [] })),
    ];
    const availableGroupIds = new Set(groups.map((group) => group.id));
    const sourceByComponentId = new Map<string, string>();
    const items = BUILT_IN_CATALOG.flatMap((group) =>
      group.items.map((item) => {
        sourceByComponentId.set(item.ids[0], group.id);
        return item;
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
    return groups;
  }, [customCatalogGroups, effectGroupAssignments]);
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
    })).filter(
      (category) =>
        category.items.length > 0 ||
        (!query && customCatalogGroups.some((group) => group.id === category.id)) ||
        category.name.toLocaleLowerCase("zh-CN").includes(query),
    );
  }, [customCatalogGroups, effectCatalog, effectSearch]);
  const visibleBuiltInEffectCount = useMemo(
    () =>
      filteredEffectCatalog.reduce(
        (total, category) => total + category.items.length,
        0,
      ),
    [filteredEffectCatalog],
  );
  const selectOnlyInstance = useCallback((instanceId: string) => {
    setSelectedInstanceId(instanceId);
    setSelectedInstanceIds(instanceId ? [instanceId] : []);
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
              position: savedInstance.position,
              backgroundOpacity: savedInstance.backgroundOpacity,
              props: savedInstance.props,
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
      const presetInstances = presets.flatMap((preset) => {
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
          }),
        ];
      });
      const nextInstances =
        hasRestoredInstances ? restoredInstances : presetInstances;
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
      setMotionModule(loaded);
      setDefinitions(nextDefinitions);
      setInstances(nextInstances);
      setSelectedInstanceId(nextInstances[0]?.id ?? "");
      setSelectedInstanceIds(
        nextInstances[0]?.id ? [nextInstances[0].id] : [],
      );
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
        if (storedVideoUrl) {
          setVideoUrl(`${String(storedVideoUrl).split("?")[0]}?t=${Date.now()}`);
        }
        setVideoDuration(storedDuration);
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
        if (Number(draft?.timelineHeight) >= 180) {
          setTimelineHeight(Number(draft?.timelineHeight));
        }
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
    player.addEventListener("frameupdate", updateFrame);
    return () => player.removeEventListener("frameupdate", updateFrame);
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

  const previewInputProps = useMemo<StudioPreviewProps>(
    () => ({
      videoUrl: videoPreviewEnabled ? videoUrl : "",
      sourceIncludesVideo: videoPreviewEnabled ? sourceIncludesVideo : false,
      definitions,
      instances,
      canvasOrientation,
    }),
    [
      definitions,
      instances,
      canvasOrientation,
      sourceIncludesVideo,
      videoPreviewEnabled,
      videoUrl,
    ],
  );

  const workspaceSnapshot = useMemo<ProjectSnapshot>(
    () => ({
      version: 1,
      name: projectName.trim() || "未命名项目",
      activeComponentId,
      componentName,
      sourceIncludesVideo,
      videoName,
      videoUrl: videoUrl ? videoUrl.split("?")[0] : "",
      videoDuration,
      instances,
      currentFrame,
      theme,
      timelineHeight,
      canvasOrientation,
    }),
    [
      activeComponentId,
      canvasOrientation,
      componentName,
      currentFrame,
      instances,
      projectName,
      sourceIncludesVideo,
      theme,
      timelineHeight,
      videoDuration,
      videoName,
      videoUrl,
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
      setVideoPreviewEnabled(false);
      setVideoUrl(restoredVideoUrl);
      setVideoDuration(restoredDuration);
      setTheme(snapshot.theme === "light" ? "light" : "dark");
      setCanvasOrientation(
        snapshot.canvasOrientation === "portrait" ? "portrait" : "landscape",
      );
      setTimelineHeight(
        Number(snapshot.timelineHeight) >= 180
          ? Number(snapshot.timelineHeight)
          : 230,
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

  const addInstance = (componentId: string) => {
    const definition = definitionMap.get(componentId);
    if (!definition) return;
    const instance = createInstance(
      definition,
      currentFrame,
      durationInFrames,
      { position: getRegisteredEffectPosition(definition, canvasOrientation) },
    );
    setInstances((current) => [...current, instance]);
    selectOnlyInstance(instance.id);
    setNotice({ tone: "ok", text: `已添加 ${definition.name} 到时间轴。` });
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
    setVideoUrl(data.videoUrl);
    setVideoPreviewEnabled(true);
    setVideoName(file.name);
    setVideoDuration(duration);
    setNotice({
      tone: "ok",
      text: `已导入 ${file.name}，时长 ${duration.toFixed(2)} 秒，原声音量 100%。`,
    });
  };

  const importComponent = async (file: File) => {
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
    await loadModuleUrl(data.moduleUrl, {
      sourceIncludesVideo: Boolean(data.sourceIncludesVideo),
      componentName: file.name,
      totalFrames: durationInFrames,
    });
    await refreshHistory();
    setNotice({
      tone: "ok",
      text: `已加载 ${file.name}，识别到组件清单和预设时间轴。`,
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

  const renderVideo = async () => {
    setRendering(true);
    setRenderProgress(null);
    setRenderResult(null);
    setNotice({
      tone: "info",
      text: "正在本机渲染多组件时间轴，首次渲染会准备 Chromium…",
    });
    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoSrc: videoUrl,
          sourceIncludesVideo,
          instances,
          timelineDurationInFrames: durationInFrames,
          canvasWidth,
          canvasHeight,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "渲染失败");
      const jobId = String(data.jobId ?? "");
      if (!jobId) throw new Error("本地服务没有返回渲染任务编号");

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
          setRenderResult(statusData.result);
          setNotice({
            tone: "ok",
            text: `渲染完成：${statusData.result.fileName}`,
          });
          break;
        }
        if (nextProgress.status === "failed") {
          throw new Error(statusData.error ?? "本机渲染失败");
        }
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "渲染失败",
      });
    } finally {
      setRendering(false);
    }
  };

  const seekFromPointer = (
    event: React.MouseEvent<HTMLElement>,
    element: HTMLElement,
  ) => {
    const bounds = element.getBoundingClientRect();
    const ratio = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const frame = clamp(
      Math.round(ratio * (durationInFrames - 1)),
      0,
      durationInFrames - 1,
    );
    playerRef.current?.seekTo(frame);
    setCurrentFrame(frame);
  };

  const seekTimelineFromClientX = useCallback(
    (clientX: number) => {
      const timeline = timelineRef.current;
      if (!timeline) return;
      const bounds = timeline.getBoundingClientRect();
      const trackLeft = bounds.left + 84;
      const trackWidth = Math.max(1, bounds.width - 98);
      const ratio = clamp((clientX - trackLeft) / trackWidth, 0, 1);
      const frame = clamp(
        Math.round(ratio * (durationInFrames - 1)),
        0,
        durationInFrames - 1,
      );
      playerRef.current?.seekTo(frame);
      setCurrentFrame(frame);
    },
    [durationInFrames],
  );

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

  const timelineDragState = useRef<{
    mode: "move" | "left" | "right";
    instanceId: string;
    pointerX: number;
    startFrame: number;
    durationInFrames: number;
    width: number;
    members: Array<{
      id: string;
      startFrame: number;
      durationInFrames: number;
    }>;
    minStartFrame: number;
    maxEndFrame: number;
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
        startFrame: candidate.startFrame,
        durationInFrames: candidate.durationInFrames,
      }));
    const width =
      event.currentTarget.closest(".track-body")?.clientWidth ?? 1;
    timelineDragState.current = {
      mode,
      instanceId: instance.id,
      pointerX: event.clientX,
      startFrame: instance.startFrame,
      durationInFrames: instance.durationInFrames,
      width,
      members,
      minStartFrame: Math.min(...members.map((member) => member.startFrame)),
      maxEndFrame: Math.max(
        ...members.map(
          (member) => member.startFrame + member.durationInFrames,
        ),
      ),
      moved: false,
    };
  };

  useEffect(() => {
    const moveTimeline = (event: PointerEvent) => {
      const state = timelineDragState.current;
      if (!state) return;
      event.preventDefault();
      const deltaFrames = Math.round(
        ((event.clientX - state.pointerX) / state.width) * durationInFrames,
      );
      if (Math.abs(event.clientX - state.pointerX) > 2) {
        state.moved = true;
      }
      const minFrames = Math.max(3, Math.round(fps * 0.1));
      if (state.mode === "move") {
        const safeDeltaFrames = clamp(
          deltaFrames,
          -state.minStartFrame,
          durationInFrames - state.maxEndFrame,
        );
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
            0,
            right - minFrames,
          );
          return {
            ...instance,
            startFrame,
            durationInFrames: right - startFrame,
          };
        }
        return {
          ...instance,
          durationInFrames: clamp(
            state.durationInFrames + deltaFrames,
            minFrames,
            durationInFrames - state.startFrame,
          ),
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

  const beginTimelineResize = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    timelineResizeState.current = {
      pointerY: event.clientY,
      height: timelineHeight,
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
      x: Math.min(event.clientX, window.innerWidth - 174),
      y: Math.min(event.clientY, window.innerHeight - 118),
      source,
      instanceIds,
    });
  };

  const showLibraryMenu = (event: React.MouseEvent, componentId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 186),
      y: Math.min(event.clientY, window.innerHeight - 82),
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

  const openNewGroupDialog = () => {
    setContextMenu(null);
    setGroupNameDraft("");
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
    if (!currentGroup || !definition) {
      setNotice({ tone: "error", text: "未找到该效果所属的分组。" });
      return;
    }
    setEffectMoveTarget({
      componentId,
      effectName: definition.name,
      currentGroupId: currentGroup.id,
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
      if (isCustomGroup) {
        setCustomCatalogGroups((current) => {
          const next = current.filter((group) => group.id !== groupId);
          window.localStorage.setItem(CUSTOM_GROUP_STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      }
      setNotice({ tone: "ok", text: `已彻底删除分组“${groupName}”。` });
      window.setTimeout(() => window.location.reload(), 250);
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
      setNotice({ tone: "ok", text: "已删除效果源码及全部时间轴实例。" });
      window.setTimeout(() => window.location.reload(), 250);
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
      .map((instance, index) => ({
        ...instance,
        id: createInstanceId(instance.componentId),
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
      }));
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
    setContextMenu(null);
  };

  const seekEditorFrame = (frame: number) => {
    const nextFrame = clamp(frame, 0, Math.max(0, durationInFrames - 1));
    playerRef.current?.seekTo(nextFrame);
    setCurrentFrame(nextFrame);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      playerRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    if (currentFrame >= durationInFrames - 1) seekEditorFrame(0);
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
      if (action === "playPause") togglePlayback();
      if (action === "goStart") goToTimelineStart();
      if (action === "previousFrame") stepTimeline(-1);
      if (action === "nextFrame") stepTimeline(1);
      if (action === "duplicate") duplicateInstances(selectionIds);
      if (action === "delete") deleteInstances(selectionIds);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentFrame,
    durationInFrames,
    isPlaying,
    recordingShortcut,
    selectedInstanceId,
    selectedInstanceIds,
    shortcutPanelOpen,
    shortcuts,
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
          currentFrame >= instance.startFrame &&
          currentFrame < instance.startFrame + instance.durationInFrames;
        return definition && isVisible
          ? [{ instance, definition, stackIndex: index }]
          : [];
      }),
    [currentFrame, definitionMap, instances],
  );

  return (
    <div className="app" data-theme={theme}>
      <div className="capture-strip" aria-hidden="true">
        <span />
      </div>
      <header className="studio-topbar">
        <div className="studio-brand" aria-label="动效编辑台 V1.0">
          <strong>动效编辑台</strong>
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
        </nav>

        <div className="studio-actions" aria-label="编辑操作">
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
          <button onClick={goToTimelineStart}><ArrowCounterClockwise />归零</button>
          <button><SpeakerHigh />声音</button>
          <button><UploadSimple />导入 JSON</button>
          <button><FilmSlate />示例</button>
          <button><UploadSimple />导入视频</button>
          <button className="export-action" onClick={renderVideo}>
            <DownloadSimple weight="bold" />导出透明 MOV
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
          {activeWorkspace === "effects" ? (
            <div className="effect-library-panel">
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

              <div
                className="effect-library-catalog"
                onContextMenu={showLibraryRootMenu}
                title="在空白处右键可新建分组"
              >
                {filteredEffectCatalog.map((category) => {
                  const isOpen =
                    Boolean(effectSearch.trim()) ||
                    openCatalogCategories.includes(category.id);
                  return (
                    <section className="effect-library-category" key={category.id}>
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
                        <b>{category.items.length}</b>
                        <CaretDown />
                      </button>

                      {isOpen ? (
                        <div className="effect-library-items">
                          {category.items.map((item) => {
                            const definition = catalogDefinitionMap.get(item.ids[0]);
                            return (
                              <button
                                key={item.ids[0]}
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

              {customDefinitions.length > 0 ? (
                <section className="effect-library-imported">
                  <div className="effect-library-meta">
                    <span>已导入效果</span>
                    <span>{customDefinitions.length}</span>
                  </div>
                  <div className="effect-library-items">
                    {customDefinitions.map((definition) => (
                      <button
                        key={definition.id}
                        onClick={() => addInstance(definition.id)}
                        onContextMenu={(event) => showLibraryMenu(event, definition.id)}
                        title="单击添加到时间轴；右键彻底删除"
                      >
                        <i>FX</i>
                        <span>
                          <strong>{definition.name}</strong>
                          <small>单击添加到时间轴</small>
                        </span>
                        <Plus />
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <>
          <div className="reference-left-tabs">
            <button className="active">卡片 <b>50</b></button>
            <button>字幕稿 <b>109</b></button>
            <button className="clear-button"><Trash />清空</button>
          </div>

          <div className="reference-progress" aria-label="卡片进度">
            <span />
          </div>

          <div className="reference-kicker">全局 <i>·</i> 影响所有卡片</div>

          <section className="reference-control-group">
            <label>全局底色(所有卡片)</label>
            <div className="reference-segmented">
              <button className="active"><MoonStars weight="fill" />暗底</button>
              <button><Sun weight="fill" />亮底</button>
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

          <button className="reference-wide-button"><VideoCamera />导入视频</button>

          <div className="reference-split-actions">
            <button><UploadSimple />导入 JSON</button>
            <button disabled><DownloadSimple />导出</button>
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

          <button className="reference-wide-button reference-export-track">
            <DownloadSimple weight="bold" />导出整条时间轴(透明)
          </button>

          <section className="reference-range-group">
            <div className="reference-range-head"><label>特效整体大小</label><b>100%</b></div>
            <input type="range" min="0" max="100" defaultValue="48" />
          </section>

          <section className="reference-range-group">
            <div className="reference-range-head"><label>动画速度</label><b>1.00×</b></div>
            <input type="range" min="0" max="100" defaultValue="35" />
          </section>

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
            <button className="reference-switch active" aria-label="安全区参考线"><i /></button>
          </div>
          <div className="reference-switch-row">
            <span>人物占位</span>
            <button className="reference-switch active" aria-label="人物占位"><User /><i /></button>
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
              {canvasWidth} × {canvasHeight} · {fps} FPS · {instances.length} 个实例
            </span>
            <span>{formatTime(timelineSeconds)}</span>
          </div>
          <div className="stage-shell reference-stage-shell">
            <div className="reference-preview-frame">
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
                  loop={false}
                  clickToPlay={false}
                  acknowledgeRemotionLicense
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#05070a",
                  }}
                />
              ) : (
                <div className="loading">正在启动 Remotion Player…</div>
              )}
              {visibleCanvasItems.map(
                ({ instance, definition, stackIndex }) => {
                  const isSelected = selectedInstanceIdSet.has(instance.id);
                  const isPrimary = selectedInstanceId === instance.id;
                  return (
                    <div
                      className={`canvas-selection ${
                        isSelected ? "selected" : ""
                      } ${isPrimary ? "primary" : ""}`}
                      key={instance.id}
                      role="button"
                      aria-label={`选择预览组件 ${definition.name}`}
                      aria-pressed={isSelected}
                      style={{
                        left: `${
                          ((instance.position.x +
                            definition.bounds.x * instance.position.scale) /
                            canvasWidth) *
                          100
                        }%`,
                        top: `${
                          ((instance.position.y +
                            definition.bounds.y * instance.position.scale) /
                            canvasHeight) *
                          100
                        }%`,
                        width: `${(definition.bounds.width / canvasWidth) * 100}%`,
                        height: `${(definition.bounds.height / canvasHeight) * 100}%`,
                        transform: `scale(${instance.position.scale})`,
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
            </div>
          </div>

          <div
            ref={timelineRef}
            className="timeline"
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
                left: `calc(84px + (100% - 98px) * ${playheadPercent / 100})`,
              }}
              aria-label={`拖动播放指针，当前 ${formatTime(currentFrame / fps)}`}
              title="按住拖动播放指针"
              onPointerDown={beginPlayheadDrag}
            />
            <div className="timeline-head">
              <div className="timeline-status">
                <span>
                  当前 <b>{formatTime(currentFrame / fps)}</b>
                </span>
                <span>
                  总时长 <b>{formatTime(timelineSeconds)}</b>
                </span>
                <span className="timeline-card-count">
                  <b>{instances.length}</b>/50
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
            </div>
            <div
              className="ruler"
              onClick={(event) => seekFromPointer(event, event.currentTarget)}
              title="点击跳转到此时刻"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <span key={index} style={{ left: `${index * 20}%` }}>
                  {formatTime((timelineSeconds * index) / 5)}
                </span>
              ))}
            </div>
            <div
              className="timeline-tracks"
              onPointerDown={beginTimelineMarquee}
            >
              {instances.length > 0 ? (
                instances.map((instance, index) => {
                  const definition = definitionMap.get(instance.componentId);
                  if (!definition) return null;
                  const leftPercent =
                    (instance.startFrame / durationInFrames) * 100;
                  const widthPercent =
                    (instance.durationInFrames / durationInFrames) * 100;
                  return (
                    <div className="timeline-track-row" key={instance.id}>
                      <button
                        className={`track-label-button ${
                          selectedInstanceIdSet.has(instance.id) ? "active" : ""
                        }`}
                        onClick={() => selectOnlyInstance(instance.id)}
                        title={definition.name}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </button>
                      <div
                        className="track-body"
                        onClick={(event) => {
                          if (event.target === event.currentTarget) {
                            seekFromPointer(event, event.currentTarget);
                          }
                        }}
                      >
                        <div
                          className={`clip ${
                            selectedInstanceIdSet.has(instance.id)
                              ? "selected"
                              : ""
                          }`}
                          data-instance-id={instance.id}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          onPointerDown={(event) =>
                            beginTimelineDrag(event, instance, "move")
                          }
                          onContextMenu={(event) =>
                            showComponentMenu(event, "timeline", instance.id)
                          }
                          title="拖动移动；拖动两侧调整长度；右键复制或删除"
                        >
                          <button
                            className="clip-handle left"
                            onPointerDown={(event) =>
                              beginTimelineDrag(event, instance, "left")
                            }
                            aria-label={`调整 ${definition.name} 开始时间`}
                          />
                          <span>{definition.name}</span>
                          <button
                            className="clip-handle right"
                            onPointerDown={(event) =>
                              beginTimelineDrag(event, instance, "right")
                            }
                            aria-label={`调整 ${definition.name} 结束时间`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-timeline">
                  从左侧组件清单点击添加一个组件
                </div>
              )}
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
              {selectedInstance
                ? `CARD-${String(
                    instances.findIndex(
                      (instance) => instance.id === selectedInstance.id,
                    ) + 1,
                  ).padStart(2, "0")}`
                : "NO SELECTION"}
            </small>
            <div>
              <SlidersHorizontal weight="fill" />
              <strong>{selectedDefinition?.name ?? "未选择效果"}</strong>
              <span>
                {selectedDefinition?.description ?? "从时间轴或效果库选择一个组件"}
              </span>
            </div>
          </header>

          <div className="reference-inspector-body">
            {!selectedInstance || !selectedDefinition ? (
              <div className="reference-inspector-empty">
                在时间轴中选择组件后，可在这里修改参数。
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
                      ([key, schema]) =>
                        renderPropControl(
                          key,
                          schema,
                          selectedInstance.props[key] ?? schema.default,
                        ),
                    )}
                  </div>
                </section>
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
                        max={Math.max(0, timelineSeconds - 0.1)}
                        step={0.1}
                        value={(selectedInstance.startFrame / fps).toFixed(1)}
                        onChange={(event) => {
                          const nextStart = clamp(
                            Math.round(Number(event.target.value) * fps),
                            0,
                            Math.max(0, durationInFrames - 3),
                          );
                          updateInstance(selectedInstance.id, (instance) => ({
                            ...instance,
                            startFrame: nextStart,
                            durationInFrames: Math.min(
                              instance.durationInFrames,
                              durationInFrames - nextStart,
                            ),
                          }));
                        }}
                      />
                    </label>
                    <label className="prop-field">
                      <span>卡片时长(秒)</span>
                      <input
                        type="number"
                        min={3 / fps}
                        max={(durationInFrames - selectedInstance.startFrame) / fps}
                        step={0.1}
                        value={(selectedInstance.durationInFrames / fps).toFixed(1)}
                        onChange={(event) => {
                          const nextDuration = clamp(
                            Math.round(Number(event.target.value) * fps),
                            3,
                            durationInFrames - selectedInstance.startFrame,
                          );
                          updateInstance(selectedInstance.id, (instance) => ({
                            ...instance,
                            durationInFrames: nextDuration,
                          }));
                        }}
                      />
                    </label>
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
                  <strong>新建效果分组</strong>
                  <small>新分组会保存到当前浏览器</small>
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
                  if (event.key === "Enter") createCatalogGroup();
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
                  onClick={createCatalogGroup}
                >
                  新建分组
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
              {effectCatalog
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
      {contextMenu ? (
        <>
          <div
            className="context-dismiss-layer"
            onPointerDown={() => setContextMenu(null)}
          />
          <div
            className="component-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.source === "library" ? (
              <>
                <small>效果库</small>
                {contextMenu.componentId &&
                EFFECT_REGISTRY_BY_ID.has(contextMenu.componentId) ? (
                  <button
                    className="copy-action"
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
                <button className="copy-action" onClick={openNewGroupDialog}>
                  新建分组
                </button>
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
                <button className="copy-action" onClick={openNewGroupDialog}>
                  新建分组
                </button>
              </>
            ) : (
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
                  删除组件
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
