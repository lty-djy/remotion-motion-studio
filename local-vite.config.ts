import react from "@vitejs/plugin-react";
import { bundle } from "@remotion/bundler";
import {
  renderFrames,
  renderMedia,
  selectComposition,
  stitchFramesToVideo,
} from "@remotion/renderer";
import { execFile } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";

const rootDir = resolve(".");
const activeComponentPath = join(rootDir, "local-imported", "active.tsx");
const componentStoreDir = join(rootDir, "local-components");
const mediaDir = join(rootDir, "local-media");
const projectDir = join(rootDir, "local-projects");
const renderDir = join(rootDir, "outputs", "renders");
const renderEntry = join(rootDir, "local-render-entry-v2.tsx");
const statePath = join(rootDir, "local-state.json");
const effectRegistryPath = join(rootDir, "registry.ts");
const legacyEffectsPath = join(rootDir, "legacy-effects.tsx");
const systemChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Remotion 随包自带 ffmpeg/ffprobe，位于平台对应的 compositor 包中；
// 找不到时退回系统 PATH（execFile 按名字查找）。
const rendererBinaryCandidates = [
  `compositor-${process.platform}-${process.arch}-msvc`,
  `compositor-${process.platform}-${process.arch}-gnu`,
  `compositor-${process.platform}-${process.arch}`,
];
const resolveRendererBinary = (name: string) => {
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  for (const dir of rendererBinaryCandidates) {
    const candidate = join(rootDir, "node_modules", "@remotion", dir, exe);
    if (existsSync(candidate)) return candidate;
  }
  return name;
};
const ffprobeBinary = () => resolveRendererBinary("ffprobe");

const runBinary = (bin: string, args: string[]) =>
  new Promise<string>((resolvePromise, rejectPromise) => {
    execFile(
      bin,
      args,
      { maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          const detail = (stderr || error.message || "").trim();
          rejectPromise(
            new Error(
              detail
                ? `${basename(bin)} 执行失败：${detail.slice(0, 600)}`
                : `${basename(bin)} 执行失败`,
            ),
          );
          return;
        }
        resolvePromise(stdout);
      },
    );
  });

// 用 PowerShell 调起系统原生文件夹选择对话框，返回真实路径（用于直接写盘）。
// 关键点：先创建一个隐形宿主窗体作为对话框的 Owner（置顶），
// 否则 ShowDialog() 无宿主时对话框可能被隐藏进程带住、弹不到前台。
const runFolderPicker = () =>
  new Promise<string | null>((resolvePromise, rejectPromise) => {
    const script = [
      "Add-Type -AssemblyName System.Windows.Forms",
      "Add-Type -AssemblyName System.Drawing",
      "$f = New-Object System.Windows.Forms.FolderBrowserDialog",
      "$f.Description = '选择导出文件夹'",
      "$f.ShowNewFolderButton = $true",
      "$owner = New-Object System.Windows.Forms.Form",
      "$owner.StartPosition = 'CenterScreen'",
      "$owner.TopMost = $true",
      "$owner.ShowInTaskbar = $false",
      "$owner.Opacity = 0",
      "$owner.Size = New-Object System.Drawing.Size(1, 1)",
      "$owner.Show()",
      "$owner.Activate()",
      "if ($f.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) {",
      "  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
      "  Write-Output $f.SelectedPath",
      "}",
      "$owner.Close()",
    ].join("\n");
    // -EncodedCommand 用 UTF-16LE base64 传脚本，规避中文路径的编码与转义问题；
    // -STA 让 WinForms 对话框跑在正确的单线程套间。
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-STA",
        "-EncodedCommand",
        encoded,
      ],
      { maxBuffer: 1024 * 1024, windowsHide: true },
      (error, stdout) => {
        if (error) {
          rejectPromise(new Error("无法打开文件夹选择器（PowerShell 不可用）"));
          return;
        }
        const lines = stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        resolvePromise(lines.length ? lines[lines.length - 1] : null);
      },
    );
  });

// 打开所在文件夹并把资源管理器窗口置顶抢焦点到应用前面。
// 后台进程 spawn 的 explorer 窗口通常会躲在应用后面，需要用 Win32 找到
// 该文件夹的 Explorer 窗口，ShowWindow + 置顶 + AttachThreadInput 抢前台。
const openFolderScript = (target: string) => {
  const dirName = basename(dirname(target));
  const safeTarget = target.replace(/'/g, "''");
  const safeDirName = dirName.replace(/'/g, "''");
  return [
    "Add-Type -TypeDefinition @'",
    "using System;",
    "using System.Runtime.InteropServices;",
    "using System.Text;",
    "public class Fw {",
    "    public delegate bool CB(IntPtr h, IntPtr l);",
    "    [DllImport(\"user32.dll\")] public static extern bool EnumWindows(CB cb, IntPtr l);",
    "    [DllImport(\"user32.dll\")] public static extern bool IsWindowVisible(IntPtr h);",
    "    [DllImport(\"user32.dll\")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);",
    "    [DllImport(\"user32.dll\")] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);",
    "    [DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h, int c);",
    "    [DllImport(\"user32.dll\")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f);",
    "    [DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr h);",
    "    [DllImport(\"user32.dll\")] public static extern bool BringWindowToTop(IntPtr h);",
    "    [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow();",
    "    [DllImport(\"user32.dll\")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);",
    "    [DllImport(\"kernel32.dll\")] public static extern uint GetCurrentThreadId();",
    "    [DllImport(\"user32.dll\")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);",
    "    [DllImport(\"user32.dll\")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);",
    "    public static void ForceForeground(IntPtr h) {",
    "        // 模拟 ALT 键击，让系统认为本进程刚收到最后输入事件，从而获得前台激活权。",
    "        keybd_event(0x12, 0, 0, UIntPtr.Zero);",
    "        keybd_event(0x12, 0, 0x0002, UIntPtr.Zero);",
    "        uint fgThread = 0;",
    "        IntPtr fg = GetForegroundWindow();",
    "        if (fg != IntPtr.Zero) { GetWindowThreadProcessId(fg, out fgThread); }",
    "        uint curThread = GetCurrentThreadId();",
    "        uint wThread = 0;",
    "        GetWindowThreadProcessId(h, out wThread);",
    "        bool fgAttached = false;",
    "        if (fgThread != 0 && fgThread != curThread) { AttachThreadInput(fgThread, curThread, true); fgAttached = true; }",
    "        if (wThread != 0 && wThread != curThread) { AttachThreadInput(wThread, curThread, true); }",
    "        ShowWindow(h, 9);",
    "        BringWindowToTop(h);",
    "        SetWindowPos(h, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);",
    "        SetWindowPos(h, new IntPtr(-2), 0, 0, 0, 0, 0x0001 | 0x0002);",
    "        SetForegroundWindow(h);",
    "        if (wThread != 0 && wThread != curThread) { AttachThreadInput(wThread, curThread, false); }",
    "        if (fgAttached) { AttachThreadInput(fgThread, curThread, false); }",
    "    }",
    "}",
    "'@",
    `explorer.exe /select,'${safeTarget}'`,
    `$dirName = '${safeDirName}'`,
    "for ($i = 0; $i -lt 5; $i++) {",
    "    Start-Sleep -Milliseconds 400",
    "    $script:hit = [IntPtr]::Zero",
    "    $script:fallback = [IntPtr]::Zero",
    "    [Fw]::EnumWindows({ param($h, $l)",
    "        if (-not [Fw]::IsWindowVisible($h)) { return $true }",
    "        $c = New-Object System.Text.StringBuilder 128",
    "        [void][Fw]::GetClassName($h, $c, 128)",
    "        if ($c.ToString() -ne 'CabinetWClass') { return $true }",
    "        $t = New-Object System.Text.StringBuilder 512",
    "        [void][Fw]::GetWindowText($h, $t, 512)",
    "        if ($t.ToString().Length -gt 0) { $script:fallback = $h }",
    "        if ($t.ToString().IndexOf($dirName, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { $script:hit = $h; return $false }",
    "        return $true",
    "    }, [IntPtr]::Zero) | Out-Null",
    "    if ($script:hit -ne [IntPtr]::Zero) { break }",
    "}",
    "$w = [IntPtr]::Zero",
    "if ($script:hit -ne [IntPtr]::Zero) { $w = $script:hit } elseif ($script:fallback -ne [IntPtr]::Zero) { $w = $script:fallback }",
    "if ($w -ne [IntPtr]::Zero) { [Fw]::ForceForeground($w) }",
  ].join("\n");
};

const runOpenFolder = (target: string) => {
  const encoded = Buffer.from(
    openFolderScript(target),
    "utf16le",
  ).toString("base64");
  execFile(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded],
    { maxBuffer: 1024 * 1024, windowsHide: true },
    () => undefined,
  );
};

type LocalState = {
  videoName?: string;
  videoUrl?: string;
  videoDuration?: number;
  componentName?: string;
  sourceIncludesVideo?: boolean;
  activeComponentId?: string;
  componentHistory?: ComponentHistoryItem[];
  activeProjectId?: string;
  projectHistory?: ProjectHistoryItem[];
  workspaceDraft?: ProjectSnapshot;
};

type ComponentHistoryItem = {
  id: string;
  name: string;
  storedFile: string;
  importedAt: string;
  sourceIncludesVideo: boolean;
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
  videoTracks?: Array<{
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
  }>;
  instances: unknown[];
  currentFrame?: number;
  theme?: "dark" | "light";
  timelineHeight?: number;
  canvasOrientation?: "landscape" | "portrait";
  safetyGuideVisible?: boolean;
  soundEnabled?: boolean;
  createdAt?: string;
  updatedAt: string;
};

type ProjectHistoryItem = {
  id: string;
  name: string;
  storedFile: string;
  createdAt: string;
  updatedAt: string;
  videoName: string;
  componentName: string;
  instanceCount: number;
};

type RenderJobStatus =
  | "queued"
  | "bundling"
  | "preparing"
  | "rendering"
  | "completed"
  | "failed";

type RenderJob = {
  id: string;
  status: RenderJobStatus;
  stage: string;
  progress: number;
  renderedFrames: number;
  encodedFrames: number;
  totalFrames: number;
  estimatedRemainingMs: number | null;
  startedAt: string;
  updatedAt: string;
  error?: string;
  result?: {
    fileName: string;
    outputLocation: string;
    downloadUrl: string;
    mode?: "transparent" | "mp4";
    codec?: string;
    profile?: string;
    pixelFormat?: string;
    alphaVerified?: boolean;
    width?: number;
    height?: number;
    fps?: number;
    durationInFrames?: number;
  };
};

const renderJobs = new Map<string, RenderJob>();
let renderJobSequence = 0;

const managedEffectFiles: Record<
  string,
  { file: string; importLine: string; registryLine: string }
> = {
  ChapterBar: {
    file: join(rootDir, "effects", "ChapterBar.tsx"),
    importLine: 'import { ChapterBarEffectDef } from "./effects/ChapterBar";',
    registryLine: "  ChapterBarEffectDef,",
  },
  MetricFocus: {
    file: join(rootDir, "effects", "CoreNumberRoll.tsx"),
    importLine: 'import { CoreNumberRollEffectDef } from "./effects/CoreNumberRoll";',
    registryLine: "  CoreNumberRollEffectDef,",
  },
  CompareSplit: {
    file: join(rootDir, "effects", "CompareBars.tsx"),
    importLine: 'import { CompareBarsEffectDef } from "./effects/CompareBars";',
    registryLine: "  CompareBarsEffectDef,",
  },
  QuoteLockup: {
    file: join(rootDir, "effects", "QuoteLineReveal.tsx"),
    importLine: 'import { QuoteLineRevealEffectDef } from "./effects/QuoteLineReveal";',
    registryLine: "  QuoteLineRevealEffectDef,",
  },
};

const removeEffectInstances = (instances: unknown[], componentId: string) =>
  instances.filter(
    (instance) =>
      !(
        instance &&
        typeof instance === "object" &&
        "componentId" in instance &&
        (instance as { componentId?: unknown }).componentId === componentId
      ),
  );

const removeEffectFromSavedTimelines = async (componentId: string) => {
  const state = await readState();
  const workspaceDraft = state.workspaceDraft
    ? {
        ...state.workspaceDraft,
        instances: removeEffectInstances(
          state.workspaceDraft.instances ?? [],
          componentId,
        ),
        updatedAt: new Date().toISOString(),
      }
    : undefined;
  const projectHistory = await Promise.all(
    (state.projectHistory ?? []).map(async (project) => {
      const projectPath = join(projectDir, basename(project.storedFile));
      try {
        const snapshot = JSON.parse(
          await readFile(projectPath, "utf8"),
        ) as ProjectSnapshot;
        const instances = removeEffectInstances(
          snapshot.instances ?? [],
          componentId,
        );
        if (instances.length !== snapshot.instances.length) {
          await writeFile(
            projectPath,
            JSON.stringify(
              { ...snapshot, instances, updatedAt: new Date().toISOString() },
              null,
              2,
            ),
            "utf8",
          );
        }
        return { ...project, instanceCount: instances.length };
      } catch {
        return project;
      }
    }),
  );
  await saveState({ workspaceDraft, projectHistory });
};

const deleteRegisteredEffectSource = async (componentId: string) => {
  const registrySource = await readFile(effectRegistryPath, "utf8");
  const managed = managedEffectFiles[componentId];
  if (managed) {
    const nextRegistry = registrySource
      .replace(managed.importLine, "")
      .replace(managed.registryLine, "");
    if (nextRegistry === registrySource) {
      throw new Error("该效果不在当前注册表中");
    }
    await writeFile(effectRegistryPath, nextRegistry, "utf8");
    await unlink(managed.file);
    await removeEffectFromSavedTimelines(componentId);
    return { source: `effects/${basename(managed.file)}` };
  }

  const legacySource = await readFile(legacyEffectsPath, "utf8");
  const escapedId = componentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const legacySpec = new RegExp(
    `\\["${escapedId}"\\s*,[^\\]]*\\]\\s*,?`,
    "g",
  );
  const nextLegacySource = legacySource
    .replace(legacySpec, "")
    .replace(/,\\s*\\]\\]/g, "]] ");
  if (
    nextLegacySource === legacySource ||
    !registrySource.includes("...LEGACY_EFFECT_DEFS")
  ) {
    throw new Error("只能删除当前注册表中的内置效果");
  }
  await writeFile(legacyEffectsPath, nextLegacySource, "utf8");
  await removeEffectFromSavedTimelines(componentId);
  return { source: "legacy-effects.tsx" };
};

const deleteImportedEffectSource = async (componentId: string) => {
  const source = await readFile(activeComponentPath, "utf8");
  const escapedId = componentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const isFallbackComponent =
    componentId === "LegacyComponent" &&
    !source.includes("MOTION_COMPONENTS");
  const isManifestComponent = new RegExp(
    `id\\s*:\\s*["']${escapedId}["']`,
  ).test(source);
  if (!isFallbackComponent && !isManifestComponent) {
    throw new Error("没有找到该导入效果的本地源码");
  }

  const state = await readState();
  const activeHistoryItem = (state.componentHistory ?? []).find(
    (item) => item.id === state.activeComponentId,
  );
  await writeFile(
    activeComponentPath,
    "export const MOTION_COMPONENTS = [];\nexport const MOTION_TIMELINE = [];\n",
    "utf8",
  );
  if (activeHistoryItem) {
    try {
      await unlink(join(componentStoreDir, basename(activeHistoryItem.storedFile)));
    } catch {
      // The active pointer is already cleared even if its archived copy is gone.
    }
  }
  await removeEffectFromSavedTimelines(componentId);
  await saveState({
    activeComponentId: "",
    componentName: "",
    sourceIncludesVideo: false,
    componentHistory: (state.componentHistory ?? []).filter(
      (item) => item.id !== state.activeComponentId,
    ),
  });
  return {
    source: activeHistoryItem
      ? `local-components/${basename(activeHistoryItem.storedFile)}`
      : "local-imported/active.tsx",
  };
};

const updateRenderJob = (
  job: RenderJob,
  patch: Partial<Omit<RenderJob, "id" | "startedAt">>,
) => {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
};

const readState = async (): Promise<LocalState> => {
  try {
    return JSON.parse(await readFile(statePath, "utf8")) as LocalState;
  } catch {
    return {};
  }
};

const saveState = async (patch: LocalState) => {
  const current = await readState();
  await writeFile(
    statePath,
    JSON.stringify({ ...current, ...patch }, null, 2),
    "utf8",
  );
};

const normalizeProjectSnapshot = (
  input: Partial<ProjectSnapshot>,
  fallbackName = "未命名项目",
): ProjectSnapshot => {
  const now = new Date().toISOString();
  const name =
    typeof input.name === "string" && input.name.trim()
      ? input.name.trim().slice(0, 80)
      : fallbackName;
  const videoDuration = Number(input.videoDuration);
  const currentFrame = Number(input.currentFrame);
  const timelineHeight = Number(input.timelineHeight);
  return {
    version: 1,
    name,
    activeComponentId:
      typeof input.activeComponentId === "string"
        ? input.activeComponentId
        : undefined,
    componentName:
      typeof input.componentName === "string"
        ? input.componentName.slice(0, 160)
        : undefined,
    sourceIncludesVideo: Boolean(input.sourceIncludesVideo),
    videoName:
      typeof input.videoName === "string"
        ? input.videoName.slice(0, 260)
        : undefined,
    videoUrl:
      typeof input.videoUrl === "string" && input.videoUrl.startsWith("/")
        ? input.videoUrl.split("?")[0]
        : undefined,
    videoDuration:
      Number.isFinite(videoDuration) && videoDuration > 0
        ? videoDuration
        : undefined,
    videoTracks: Array.isArray(input.videoTracks)
      ? input.videoTracks.slice(0, 100).flatMap((track, index) => {
          if (!track || typeof track !== "object") return [];
          const url = typeof track.url === "string" ? track.url.split("?")[0] : "";
          if (!url.startsWith("/api/media/")) return [];
          const startFrame = Number(track.startFrame);
          const sourceStartFrame = Number(track.sourceStartFrame);
          const sourceDurationInFrames = Number(track.sourceDurationInFrames);
          const durationInFrames = Number(track.durationInFrames);
          return [
            {
              id:
                typeof track.id === "string" && track.id
                  ? track.id.slice(0, 160)
                  : `video-${Date.now()}-${index + 1}`,
              laneId:
                typeof track.laneId === "string" && track.laneId
                  ? track.laneId.slice(0, 160)
                  : typeof track.id === "string" && track.id
                    ? track.id.slice(0, 160)
                    : `video-${Date.now()}-${index + 1}`,
              trackOrder: Number.isFinite(Number(track.trackOrder))
                ? Number(track.trackOrder)
                : index,
              name:
                typeof track.name === "string" && track.name
                  ? track.name.slice(0, 260)
                  : `视频轨道 ${index + 1}`,
              url,
              sourceStartFrame:
                Number.isFinite(sourceStartFrame) && sourceStartFrame >= 0
                  ? Math.round(sourceStartFrame)
                  : 0,
              sourceDurationInFrames:
                Number.isFinite(sourceDurationInFrames) &&
                sourceDurationInFrames > 0
                  ? Math.max(3, Math.round(sourceDurationInFrames))
                  : Math.max(3, Math.round(durationInFrames) || 3),
              startFrame:
                Number.isFinite(startFrame) && startFrame >= 0
                  ? Math.round(startFrame)
                  : 0,
              durationInFrames:
                Number.isFinite(durationInFrames) && durationInFrames > 0
                  ? Math.max(3, Math.round(durationInFrames))
                  : 3,
              visible: track.visible !== false,
            },
          ];
        })
      : [],
    instances: Array.isArray(input.instances)
      ? input.instances.slice(0, 500)
      : [],
    currentFrame:
      Number.isFinite(currentFrame) && currentFrame >= 0
        ? Math.round(currentFrame)
        : 0,
    theme: input.theme === "light" ? "light" : "dark",
    timelineHeight:
      Number.isFinite(timelineHeight) && timelineHeight >= 180
        ? Math.round(timelineHeight)
        : 230,
    canvasOrientation:
      input.canvasOrientation === "portrait" ? "portrait" : "landscape",
    safetyGuideVisible: input.safetyGuideVisible !== false,
    soundEnabled: input.soundEnabled !== false,
    createdAt:
      typeof input.createdAt === "string" ? input.createdAt : undefined,
    updatedAt: now,
  };
};

const activateStoredComponent = async (
  componentId: string | undefined,
  state: LocalState,
) => {
  if (!componentId) return null;
  const item = (state.componentHistory ?? []).find(
    (historyItem) => historyItem.id === componentId,
  );
  if (!item) {
    throw new Error("项目使用的 Remotion 组件文件已不存在");
  }
  const storedPath = join(componentStoreDir, basename(item.storedFile));
  const code = await readFile(storedPath, "utf8");
  validateComponent(code);
  await writeFile(activeComponentPath, code, "utf8");
  return item;
};

const sendJson = (
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

const getBody = async (req: IncomingMessage, maxBytes: number) => {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) throw new Error("文件超过允许大小");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
};

const validateComponent = (code: string) => {
  if (!code.includes("from \"remotion\"") && !code.includes("from 'remotion'")) {
    throw new Error("源码必须从 remotion 导入组件");
  }
  if (!/\bexport\s+(default\s+)?(?:const|function|class)\b/.test(code)) {
    throw new Error("没有找到可渲染的导出组件");
  }

  const importMatches = code.matchAll(
    /\b(?:import|export)\s+(?:[\s\S]*?\sfrom\s*)?["']([^"']+)["']/g,
  );
  for (const match of importMatches) {
    if (!["react", "remotion"].includes(match[1])) {
      throw new Error(`安全模式不允许导入：${match[1]}`);
    }
  }

  const forbidden = [
    [/\bfetch\s*\(/, "fetch"],
    [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
    [/\bWebSocket\b/, "WebSocket"],
    [/\beval\s*\(/, "eval"],
    [/\bnew\s+Function\b/, "Function"],
    [/\b(?:window|document|localStorage|sessionStorage)\b/, "浏览器全局对象"],
    [/\b(?:process|require|__dirname|__filename)\b/, "Node.js 全局对象"],
    [/\bimport\s*\(/, "动态 import"],
  ] as const;
  for (const [pattern, label] of forbidden) {
    if (pattern.test(code)) throw new Error(`安全模式不允许使用：${label}`);
  }
};

const normalizeComponent = (code: string) => {
  validateComponent(code);
  if (/\bexport\s+default\b/.test(code)) return code;
  const named =
    Array.from(
      code.matchAll(
        /\bexport\s+(?:const|function|class)\s+([A-Z][A-Za-z0-9_]*)/g,
      ),
      (match) => match[1],
    ).find((name) => /[a-z]/.test(name)) ?? "";
  if (!named) throw new Error("请导出一个首字母大写的 React 组件");
  return `${code}\nexport default ${named};\n`;
};

const storeComponent = async (filename: string, code: string) => {
  const normalized = normalizeComponent(code);
  const safeName = basename(filename || "component.tsx");
  const slug =
    safeName
      .replace(/\.[^.]+$/, "")
      .replace(/[^A-Za-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "component";
  const id = `${Date.now()}-${slug}`;
  const storedFile = `${id}.tsx`;
  const sourceIncludesVideo = /<(?:Video|OffthreadVideo)\b/.test(normalized);
  await writeFile(join(componentStoreDir, storedFile), normalized, "utf8");
  await writeFile(activeComponentPath, normalized, "utf8");
  const current = await readState();
  const item: ComponentHistoryItem = {
    id,
    name: safeName,
    storedFile,
    importedAt: new Date().toISOString(),
    sourceIncludesVideo,
  };
  const componentHistory = [
    item,
    ...(current.componentHistory ?? []).filter(
      (historyItem) => historyItem.id !== id,
    ),
  ].slice(0, 50);
  await saveState({
    componentName: safeName,
    sourceIncludesVideo,
    activeComponentId: id,
    componentHistory,
  });
  return { item, sourceIncludesVideo, componentHistory };
};

const serveFile = (
  req: IncomingMessage,
  res: ServerResponse,
  filePath: string,
) => {
  if (!existsSync(filePath)) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }
  const size = statSync(filePath).size;
  const range = req.headers.range;
  const extension = extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".m4v": "video/x-m4v",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  const contentType = contentTypes[extension] ?? "application/octet-stream";
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  if (!range) {
    res.statusCode = 200;
    res.setHeader("Content-Length", size);
    createReadStream(filePath).pipe(res);
    return;
  }
  const [startText, endText] = range.replace("bytes=", "").split("-");
  const start = Number(startText);
  const end = endText ? Math.min(Number(endText), size - 1) : size - 1;
  if (!Number.isFinite(start) || start < 0 || start > end) {
    res.statusCode = 416;
    res.end();
    return;
  }
  res.statusCode = 206;
  res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
  res.setHeader("Content-Length", end - start + 1);
  createReadStream(filePath, { start, end }).pipe(res);
};

const localApi = (): Plugin => ({
  name: "motion-studio-local-api",
  configureServer(server) {
    mkdirSync(mediaDir, { recursive: true });
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(renderDir, { recursive: true });
    mkdirSync(componentStoreDir, { recursive: true });
    server.middlewares.use(async (req, res, next) => {
      try {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        if (url.pathname === "/api/health") {
          sendJson(res, 200, { ok: true, localOnly: true });
          return;
        }

        if (url.pathname === "/api/delete-effect" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { componentId?: string; imported?: boolean };
          if (!body.componentId || !/^[A-Za-z0-9_-]+$/.test(body.componentId)) {
            throw new Error("效果标识无效");
          }
          const deleted = body.imported
            ? await deleteImportedEffectSource(body.componentId)
            : await deleteRegisteredEffectSource(body.componentId);
          sendJson(res, 200, { ok: true, componentId: body.componentId, ...deleted });
          return;
        }

        if (
          url.pathname === "/api/delete-effect-group" &&
          req.method === "POST"
        ) {
          const body = JSON.parse(
            (await getBody(req, 128 * 1024)).toString("utf8"),
          ) as { componentIds?: string[] };
          const componentIds = Array.from(
            new Set(
              Array.isArray(body.componentIds)
                ? body.componentIds.filter(
                    (id): id is string =>
                      typeof id === "string" && /^[A-Za-z0-9_-]+$/.test(id),
                  )
                : [],
            ),
          );
          if (componentIds.length === 0 || componentIds.length > 100) {
            throw new Error("分组内没有可删除的注册效果");
          }
          const deleted = [];
          for (const componentId of componentIds) {
            deleted.push({
              componentId,
              ...(await deleteRegisteredEffectSource(componentId)),
            });
          }
          sendJson(res, 200, { ok: true, deleted });
          return;
        }

        if (url.pathname === "/api/state" && req.method === "GET") {
          sendJson(res, 200, { ok: true, ...(await readState()) });
          return;
        }

        if (
          url.pathname === "/api/workspace-draft" &&
          req.method === "POST"
        ) {
          const body = JSON.parse(
            (await getBody(req, 4 * 1024 * 1024)).toString("utf8"),
          ) as Partial<ProjectSnapshot>;
          const workspaceDraft = normalizeProjectSnapshot(body);
          await saveState({ workspaceDraft });
          sendJson(res, 200, {
            ok: true,
            updatedAt: workspaceDraft.updatedAt,
          });
          return;
        }

        if (url.pathname === "/api/save-project" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 4 * 1024 * 1024)).toString("utf8"),
          ) as {
            id?: string;
            name?: string;
            snapshot?: Partial<ProjectSnapshot>;
          };
          const current = await readState();
          const existing = (current.projectHistory ?? []).find(
            (item) => item.id === body.id,
          );
          const id = existing?.id ?? `${Date.now()}-project`;
          const storedFile = existing?.storedFile ?? `${id}.json`;
          const snapshot = normalizeProjectSnapshot(
            {
              ...(body.snapshot ?? {}),
              name: body.name,
              createdAt: existing?.createdAt,
            },
            existing?.name ?? "未命名项目",
          );
          const createdAt = existing?.createdAt ?? snapshot.updatedAt;
          const persistedSnapshot = {
            ...snapshot,
            createdAt,
          };
          await writeFile(
            join(projectDir, basename(storedFile)),
            JSON.stringify(persistedSnapshot, null, 2),
            "utf8",
          );
          const item: ProjectHistoryItem = {
            id,
            name: snapshot.name,
            storedFile,
            createdAt,
            updatedAt: snapshot.updatedAt,
            videoName: snapshot.videoName ?? "未导入视频",
            componentName: snapshot.componentName ?? "内置组件",
            instanceCount: snapshot.instances.length,
          };
          const projectHistory = [
            item,
            ...(current.projectHistory ?? []).filter(
              (historyItem) => historyItem.id !== id,
            ),
          ].slice(0, 100);
          await saveState({
            activeProjectId: id,
            projectHistory,
            workspaceDraft: persistedSnapshot,
          });
          sendJson(res, 200, {
            ok: true,
            project: item,
            projects: projectHistory,
            snapshot: persistedSnapshot,
          });
          return;
        }

        if (url.pathname === "/api/open-project" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { id?: string };
          const current = await readState();
          const item = (current.projectHistory ?? []).find(
            (historyItem) => historyItem.id === body.id,
          );
          if (!item) throw new Error("没有找到这个本地项目");
          const snapshot = normalizeProjectSnapshot(
            JSON.parse(
              await readFile(
                join(projectDir, basename(item.storedFile)),
                "utf8",
              ),
            ) as Partial<ProjectSnapshot>,
            item.name,
          );
          const component = await activateStoredComponent(
            snapshot.activeComponentId,
            current,
          );
          await saveState({
            activeProjectId: item.id,
            workspaceDraft: snapshot,
            activeComponentId:
              component?.id ?? snapshot.activeComponentId,
            componentName:
              component?.name ?? snapshot.componentName,
            sourceIncludesVideo:
              component?.sourceIncludesVideo ??
              snapshot.sourceIncludesVideo,
            videoName: snapshot.videoName,
            videoUrl: snapshot.videoUrl,
            videoDuration: snapshot.videoDuration,
          });
          sendJson(res, 200, {
            ok: true,
            project: item,
            snapshot,
            moduleUrl: `/local-imported/active.tsx?t=${Date.now()}`,
            sourceIncludesVideo:
              component?.sourceIncludesVideo ??
              snapshot.sourceIncludesVideo,
            activeComponentId:
              component?.id ?? snapshot.activeComponentId,
          });
          return;
        }

        if (url.pathname === "/api/component" && req.method === "GET") {
          const code = await readFile(activeComponentPath, "utf8");
          const state = await readState();
          sendJson(res, 200, {
            code,
            moduleUrl: `/local-imported/active.tsx?t=${Date.now()}`,
            sourceIncludesVideo: /<(?:Video|OffthreadVideo)\b/.test(code),
            activeComponentId: state.activeComponentId,
          });
          return;
        }

        if (
          ["/api/import-component", "/api/auto-import"].includes(
            url.pathname,
          ) &&
          req.method === "POST"
        ) {
          const body = JSON.parse(
            (await getBody(req, 1024 * 1024)).toString("utf8"),
          ) as { filename?: string; code?: string };
          if (!body.code) throw new Error("源码为空");
          const stored = await storeComponent(
            body.filename ?? "active.tsx",
            body.code,
          );
          sendJson(res, 200, {
            ok: true,
            filename: basename(body.filename ?? "active.tsx"),
            moduleUrl: `/local-imported/active.tsx?t=${Date.now()}`,
            sourceIncludesVideo: stored.sourceIncludesVideo,
            activeComponentId: stored.item.id,
            history: stored.componentHistory,
          });
          return;
        }

        if (
          url.pathname === "/api/component-history" &&
          req.method === "GET"
        ) {
          const state = await readState();
          sendJson(res, 200, {
            ok: true,
            history: state.componentHistory ?? [],
            activeComponentId: state.activeComponentId,
          });
          return;
        }

        if (
          url.pathname === "/api/activate-component" &&
          req.method === "POST"
        ) {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { id?: string };
          const state = await readState();
          const item = await activateStoredComponent(body.id, state);
          if (!item) throw new Error("没有找到这条历史组件记录");
          await saveState({
            activeComponentId: item.id,
            componentName: item.name,
            sourceIncludesVideo: item.sourceIncludesVideo,
          });
          sendJson(res, 200, {
            ok: true,
            filename: item.name,
            moduleUrl: `/local-imported/active.tsx?t=${Date.now()}`,
            sourceIncludesVideo: item.sourceIncludesVideo,
            activeComponentId: item.id,
          });
          return;
        }

        if (url.pathname === "/api/upload-video" && req.method === "POST") {
          const inputName = decodeURIComponent(
            String(req.headers["x-file-name"] ?? "video.mp4"),
          );
          const extension = [".mp4", ".mov", ".webm", ".m4v"].includes(
            extname(inputName).toLowerCase(),
          )
            ? extname(inputName).toLowerCase()
            : ".mp4";
          const body = await getBody(req, 4 * 1024 * 1024 * 1024);
          const slug =
            basename(inputName, extname(inputName))
              .replace(/[^A-Za-z0-9\u4e00-\u9fff_-]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .slice(0, 48) || "video";
          const storedName = `${Date.now()}-${slug}${extension}`;
          const filePath = join(mediaDir, storedName);
          await writeFile(filePath, body);
          const videoDuration = Number(req.headers["x-video-duration"] ?? 0);
          const videoUrl = `/api/media/${basename(filePath)}`;
          await saveState({
            videoName: basename(inputName),
            videoUrl,
            videoDuration:
              Number.isFinite(videoDuration) && videoDuration > 0
                ? videoDuration
                : undefined,
          });
          sendJson(res, 200, {
            ok: true,
            filename: basename(inputName),
            videoUrl: `${videoUrl}?t=${Date.now()}`,
          });
          return;
        }

        if (url.pathname.startsWith("/api/media/")) {
          // Browsers percent-encode Chinese and other non-ASCII filenames.
          // Decode the final path segment before matching the stored local file.
          const name = decodeURIComponent(basename(url.pathname));
          serveFile(req, res, join(mediaDir, name));
          return;
        }

        if (url.pathname.startsWith("/api/renders/")) {
          // pathname 是百分号编码的，中文文件名必须解码后才能对应磁盘上的真实文件。
          const name = decodeURIComponent(basename(url.pathname));
          const target = join(renderDir, name);
          if (req.method === "DELETE") {
            // 前端把文件写入用户选定文件夹后，删除服务端临时副本。
            if (!existsSync(target)) {
              sendJson(res, 404, { ok: false, error: "文件不存在" });
              return;
            }
            await unlink(target);
            sendJson(res, 200, { ok: true });
            return;
          }
          serveFile(req, res, target);
          return;
        }

        if (url.pathname === "/api/pick-folder" && req.method === "POST") {
          try {
            const selected = await runFolderPicker();
            sendJson(res, 200, {
              ok: true,
              path: selected ?? "",
              cancelled: selected === null,
            });
          } catch (error) {
            sendJson(res, 500, {
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : "无法打开文件夹选择器",
            });
          }
          return;
        }

        if (url.pathname === "/api/open-folder" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 1024 * 1024)).toString("utf8"),
          ) as { path?: string };
          const target = typeof body.path === "string" ? body.path.trim() : "";
          if (!target) {
            sendJson(res, 400, { ok: false, error: "缺少文件路径" });
            return;
          }
          if (!existsSync(target)) {
            sendJson(res, 400, { ok: false, error: "文件不存在" });
            return;
          }
          runOpenFolder(target);
          sendJson(res, 200, { ok: true });
          return;
        }

        if (
          url.pathname === "/api/render-status" &&
          req.method === "GET"
        ) {
          const jobId = url.searchParams.get("jobId") ?? "";
          const job = renderJobs.get(jobId);
          if (!job) {
            sendJson(res, 404, {
              ok: false,
              error: "找不到这次渲染任务，可能本地服务已经重启",
            });
            return;
          }
          sendJson(res, 200, { ok: true, ...job });
          return;
        }

        if (url.pathname === "/api/render" && req.method === "POST") {
          const inputProps = JSON.parse(
            (await getBody(req, 1024 * 1024)).toString("utf8"),
          ) as Record<string, unknown>;
          const resolvedInputProps = {
            ...inputProps,
            videoSrc:
              typeof inputProps.videoSrc === "string" &&
              inputProps.videoSrc.startsWith("/")
                ? `http://127.0.0.1:41735${inputProps.videoSrc}`
                : inputProps.videoSrc,
            videoTracks: Array.isArray(inputProps.videoTracks)
              ? inputProps.videoTracks.map((track) => {
                  if (!track || typeof track !== "object") return track;
                  const record = track as Record<string, unknown>;
                  return {
                    ...record,
                    url:
                      typeof record.url === "string" && record.url.startsWith("/")
                        ? `http://127.0.0.1:41735${record.url}`
                        : record.url,
                  };
                })
              : [],
          };
          renderJobSequence += 1;
          const jobId = `render-${Date.now()}-${renderJobSequence}`;
          const now = new Date().toISOString();
          const job: RenderJob = {
            id: jobId,
            status: "queued",
            stage: "正在准备渲染",
            progress: 0,
            renderedFrames: 0,
            encodedFrames: 0,
            totalFrames: Math.max(
              1,
              Number(inputProps.timelineDurationInFrames) || 1,
            ),
            estimatedRemainingMs: null,
            startedAt: now,
            updatedAt: now,
          };
          renderJobs.set(jobId, job);
          while (renderJobs.size > 20) {
            const oldestJobId = renderJobs.keys().next().value as
              | string
              | undefined;
            if (!oldestJobId || oldestJobId === jobId) break;
            renderJobs.delete(oldestJobId);
          }

          sendJson(res, 202, {
            ok: true,
            jobId,
          });

          void (async () => {
            try {
              updateRenderJob(job, {
                status: "bundling",
                stage: "正在安全编译动效",
                progress: 0.01,
              });
              const bundled = await bundle({
                entryPoint: renderEntry,
                onProgress: (progress) => {
                  const value =
                    typeof progress === "number"
                      ? progress
                      : Number(
                          (progress as { progress?: number } | undefined)
                            ?.progress,
                        );
                  updateRenderJob(job, {
                    progress: Number.isFinite(value)
                      ? Math.min(0.04, 0.01 + value * 0.03)
                      : job.progress,
                  });
                },
                webpackOverride: (config) => config,
              });

              updateRenderJob(job, {
                status: "preparing",
                stage:
                  inputProps.transparent === true
                    ? "正在读取组件与时间轴"
                    : "正在读取视频与组件",
                progress: 0.05,
              });
              const composition = await selectComposition({
                serveUrl: bundled,
                id: "ImportedMotion",
                inputProps: resolvedInputProps,
                browserExecutable: existsSync(systemChrome)
                  ? systemChrome
                  : undefined,
              });
              updateRenderJob(job, {
                totalFrames: composition.durationInFrames,
              });

              const transparent = inputProps.transparent === true;
              const timestamp = new Date()
                .toISOString()
                .replace(/[:.]/g, "-");
              const defaultFileName = transparent
                ? `动效透明导出-${timestamp}.mov`
                : `实时预览导出-${timestamp}.mov`;
              // 用户指定的文件名需清洗掉路径分隔符与非法字符，避免越权写出。
              const sanitizeFileName = (name: string) =>
                name
                  .replace(/[\\/:*?"<>|\x00-\x1f]/g, "")
                  .replace(/^\.+/, "")
                  .trim() || defaultFileName;
              const sanitizedFileName =
                typeof inputProps.fileName === "string" &&
                inputProps.fileName.trim()
                  ? sanitizeFileName(inputProps.fileName.trim())
                  : defaultFileName;
              const fileName =
                extname(sanitizedFileName).toLowerCase() === ".mov"
                  ? sanitizedFileName
                  : `${basename(sanitizedFileName, extname(sanitizedFileName))}.mov`;
              // 用户指定的导出目录；未指定时回退到 outputs/renders。
              const requestedOutputDir =
                typeof inputProps.outputDir === "string" &&
                inputProps.outputDir.trim()
                  ? inputProps.outputDir.trim()
                  : renderDir;
              try {
                mkdirSync(requestedOutputDir, { recursive: true });
              } catch {
                // 目录不可用时继续，让 ffmpeg 报错
              }
              const outputLocation = join(requestedOutputDir, fileName);
              const directWrite = requestedOutputDir !== renderDir;
              const downloadUrl = directWrite
                ? ""
                : `/api/renders/${encodeURIComponent(fileName)}`;

              if (transparent) {
                // 透明导出：逐帧渲染 PNG（保留 Alpha，虚拟时钟保证逐帧确定性），
                // 再用 ffmpeg 封装成 ProRes 4444 带 Alpha 的 MOV。
                const framesDir = join(renderDir, `.frames-${jobId}`);
                rmSync(framesDir, { recursive: true, force: true });
                updateRenderJob(job, {
                  status: "rendering",
                  stage: "正在逐帧渲染透明画面（虚拟时钟）",
                  progress: 0.06,
                });
                const { assetsInfo } = await renderFrames({
                  composition,
                  serveUrl: bundled,
                  inputProps: resolvedInputProps,
                  outputDir: framesDir,
                  imageFormat: "png",
                  concurrency: 4,
                  logLevel: "error",
                  browserExecutable: existsSync(systemChrome)
                    ? systemChrome
                    : undefined,
                  onStart: () => undefined,
                  onFrameUpdate: (framesRendered) => {
                    updateRenderJob(job, {
                      status: "rendering",
                      stage: "正在逐帧渲染透明画面（虚拟时钟）",
                      progress: Math.min(
                        0.72,
                        0.06 +
                          (framesRendered / composition.durationInFrames) *
                            0.66,
                      ),
                      renderedFrames: framesRendered,
                    });
                  },
                });

                updateRenderJob(job, {
                  status: "rendering",
                  stage: "正在用 ffmpeg 封装 ProRes 4444（含 Alpha）",
                  progress: 0.74,
                });
                await stitchFramesToVideo({
                  assetsInfo,
                  fps: composition.fps,
                  width: composition.width,
                  height: composition.height,
                  outputLocation,
                  codec: "prores",
                  proResProfile: "4444",
                  pixelFormat: "yuva444p10le",
                  muted: true,
                  logLevel: "error",
                  onProgress: (frame) => {
                    updateRenderJob(job, {
                      status: "rendering",
                      stage: "正在用 ffmpeg 封装 ProRes 4444（含 Alpha）",
                      progress: Math.min(
                        0.92,
                        0.74 +
                          (frame / composition.durationInFrames) * 0.18,
                      ),
                      encodedFrames: frame,
                    });
                  },
                });
                rmSync(framesDir, { recursive: true, force: true });

                updateRenderJob(job, {
                  status: "rendering",
                  stage: "正在用 ffprobe 校验 Alpha 通道",
                  progress: 0.93,
                });
                const probeOutput = await runBinary(ffprobeBinary(), [
                  "-v",
                  "error",
                  "-select_streams",
                  "v:0",
                  "-show_entries",
                  "stream=codec_name,profile,pix_fmt,width,height,avg_frame_rate",
                  "-of",
                  "json",
                  outputLocation,
                ]);
                const probe = JSON.parse(probeOutput) as {
                  streams?: Array<{
                    codec_name?: string;
                    profile?: string;
                    pix_fmt?: string;
                    width?: number;
                    height?: number;
                    avg_frame_rate?: string;
                  }>;
                };
                const stream = probe.streams?.[0];
                // ProRes 4444 在 ffprobe 中 profile 为数字 id（4 = 4444），
                // pix_fmt 以 yuva 开头即带 Alpha 通道（10/12 位均可）。
                const proresProfileLabels: Record<string, string> = {
                  "0": "Proxy",
                  "1": "LT",
                  "2": "Standard",
                  "3": "HQ",
                  "4": "4444",
                  "5": "4444 XQ",
                };
                const alphaVerified =
                  stream?.codec_name === "prores" &&
                  /^yuva/.test(stream?.pix_fmt ?? "");

                updateRenderJob(job, {
                  status: "completed",
                  stage: "透明导出完成",
                  progress: 1,
                  renderedFrames: composition.durationInFrames,
                  encodedFrames: composition.durationInFrames,
                  estimatedRemainingMs: 0,
                  result: {
                    fileName,
                    outputLocation,
                    downloadUrl,
                    mode: "transparent",
                    codec: stream?.codec_name ?? "prores",
                    profile:
                      proresProfileLabels[String(stream?.profile)] ?? "4444",
                    pixelFormat: stream?.pix_fmt ?? "yuva444p12le",
                    alphaVerified,
                    width: stream?.width ?? composition.width,
                    height: stream?.height ?? composition.height,
                    fps: composition.fps,
                    durationInFrames: composition.durationInFrames,
                    savedTo: outputLocation,
                    outputDir: requestedOutputDir,
                  },
                });
                return;
              }

              updateRenderJob(job, {
                status: "rendering",
                stage: "正在渲染画面",
              });
              await renderMedia({
                composition,
                serveUrl: bundled,
                codec: "prores",
                proResProfile: "hq",
                pixelFormat: "yuv422p10le",
                imageFormat: "png",
                audioCodec: "pcm-16",
                outputLocation,
                inputProps: resolvedInputProps,
                browserExecutable: existsSync(systemChrome)
                  ? systemChrome
                  : undefined,
                onProgress: (progress) => {
                  const estimated = Number(progress.renderEstimatedTime);
                  updateRenderJob(job, {
                    status: "rendering",
                    stage:
                      progress.stitchStage === "muxing"
                        ? "正在合成视频与原声"
                        : "正在渲染画面",
                    progress: Math.min(
                      0.99,
                      Math.max(job.progress, 0.05 + progress.progress * 0.94),
                    ),
                    renderedFrames: progress.renderedFrames,
                    encodedFrames: progress.encodedFrames,
                    estimatedRemainingMs:
                      Number.isFinite(estimated) && estimated > 0
                        ? estimated
                        : null,
                  });
                },
              });

              const previewProbeOutput = await runBinary(ffprobeBinary(), [
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=codec_name,profile,pix_fmt,width,height,avg_frame_rate",
                "-of",
                "json",
                outputLocation,
              ]);
              const previewProbe = JSON.parse(previewProbeOutput) as {
                streams?: Array<{
                  codec_name?: string;
                  profile?: string;
                  pix_fmt?: string;
                  width?: number;
                  height?: number;
                }>;
              };
              const previewStream = previewProbe.streams?.[0];
              const previewProfileLabels: Record<string, string> = {
                "0": "Proxy",
                "1": "LT",
                "2": "Standard",
                "3": "HQ",
                "4": "4444",
                "5": "4444 XQ",
              };

              updateRenderJob(job, {
                status: "completed",
                stage: "渲染完成",
                progress: 1,
                renderedFrames: composition.durationInFrames,
                encodedFrames: composition.durationInFrames,
                estimatedRemainingMs: 0,
                result: {
                  fileName,
                  outputLocation,
                  downloadUrl,
                  mode: "mov",
                  codec: previewStream?.codec_name ?? "prores",
                  profile:
                    previewProfileLabels[String(previewStream?.profile)] ??
                    previewStream?.profile ??
                    "HQ",
                  pixelFormat: previewStream?.pix_fmt ?? "yuv422p10le",
                  width: previewStream?.width ?? composition.width,
                  height: previewStream?.height ?? composition.height,
                  fps: composition.fps,
                  durationInFrames: composition.durationInFrames,
                  savedTo: outputLocation,
                  outputDir: requestedOutputDir,
                },
              });
            } catch (error) {
              updateRenderJob(job, {
                status: "failed",
                stage: "渲染失败",
                error:
                  error instanceof Error
                    ? error.message
                    : "本机渲染发生未知错误",
                estimatedRemainingMs: null,
              });
            }
          })();
          return;
        }

        next();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "本地服务发生未知错误";
        sendJson(res, 400, { ok: false, error: message });
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), localApi()],
  server: {
    host: "127.0.0.1",
    port: 41735,
    strictPort: true,
    fs: { allow: [rootDir] },
  },
  build: {
    outDir: "local-dist",
    emptyOutDir: true,
  },
});
