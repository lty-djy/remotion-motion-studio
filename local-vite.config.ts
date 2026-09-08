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
import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";

const rootDir = resolve(".");
const activeComponentPath = join(rootDir, "local-imported", "active.tsx");
const componentStoreDir = join(rootDir, "local-components");
const mediaDir = join(rootDir, "local-media");
const mediaTempDir = join(mediaDir, "temp");
const resourceRoot = join(rootDir, "public", "input");
const iconResourceDir = join(resourceRoot, "icons");
const materialResourceDir = join(resourceRoot, "materials");
const sfxResourceDir = join(resourceRoot, "sfx");
const resourceManifestPath = join(resourceRoot, "resource-manifest.json");
const resourceIndexPath = join(resourceRoot, "resource-index.json");
const arrangementRulesDir = join(resourceRoot, "arrangement-rules");
const arrangementRulesManifestPath = join(
  arrangementRulesDir,
  "rule-manifest.json",
);
const projectDir = join(rootDir, "local-projects");
const renderDir = join(rootDir, "outputs", "renders");
const renderEntry = join(rootDir, "local-render-entry-v2.tsx");
const statePath = join(rootDir, "local-state.json");
const effectRegistryPath = join(rootDir, "registry.ts");
const legacyEffectsPath = join(rootDir, "legacy-effects.tsx");
const systemChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const candidateThumbsDir = join(rootDir, "local-thumbs", "candidate-thumbs");

// 候选卡静态缩略图：由 outputs/generate-candidate-thumbs.cjs 生成到 local-thumbs/，
// 仅在开发服务时按需提供，不放入 public/ —— 避免 build 时拷贝进 local-dist，
// 使 emptyOutDir 的删除数量反复触发批量删除保护（SAFE_DELETE_BULK_CONFIRM_REQUIRED）。
const candidateThumbsPlugin = (): Plugin => ({
  name: "serve-candidate-thumbs",
  configureServer(server) {
    server.middlewares.use("/candidate-thumbs", (req, res, next) => {
      const relative = decodeURIComponent(String(req.url ?? "").split("?")[0]);
      const filePath = join(candidateThumbsDir, relative);
      if (
        !filePath.startsWith(candidateThumbsDir) ||
        !existsSync(filePath) ||
        !statSync(filePath).isFile()
      ) {
        next();
        return;
      }
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "no-cache");
      createReadStream(filePath).pipe(res);
    });
  },
});

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
  const targetIsDirectory = existsSync(target) && statSync(target).isDirectory();
  const dirName = targetIsDirectory ? basename(target) : basename(dirname(target));
  const safeTarget = target.replace(/'/g, "''");
  const safeDirName = dirName.replace(/'/g, "''");
  const explorerCommand = targetIsDirectory
    ? `explorer.exe '${safeTarget}'`
    : `explorer.exe /select,'${safeTarget}'`;
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
    explorerCommand,
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
  resourceTracks?: unknown[];
  instances: unknown[];
  currentFrame?: number;
  theme?: "dark" | "light";
  timelineHeight?: number;
  trackHeights?: Record<string, number>;
  canvasOrientation?: "landscape" | "portrait";
  safetyGuideVisible?: boolean;
  solidBackgroundEnabled?: boolean;
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
        return {
          ...project,
          instanceCount:
            instances.length +
            (Array.isArray(snapshot.resourceTracks)
              ? snapshot.resourceTracks.length
              : 0),
        };
      } catch {
        return project;
      }
    }),
  );
  await saveState({ workspaceDraft, projectHistory });
};

const deleteRegisteredEffectSource = async (componentId: string) => {
  const registrySource = await readFile(effectRegistryPath, "utf8");
  // 所有独立 effects/*.tsx 都由 registry.ts 的导入和导出项控制。
  // 不再依赖少数效果的硬编码表，新增的注册效果也能直接删除。
  const registryImports = [
    ...registrySource.matchAll(
      /^import\s+\{\s*(\w+)\s*\}\s+from\s+["'](\.\/effects\/[^"']+)["'];?\s*$/gm,
    ),
  ];
  for (const imported of registryImports) {
    const [, exportName, modulePath] = imported;
    const sourcePath = resolve(rootDir, `${modulePath}.tsx`);
    if (!sourcePath.startsWith(join(rootDir, "effects"))) continue;
    let effectSource = "";
    try {
      effectSource = await readFile(sourcePath, "utf8");
    } catch {
      continue;
    }
    const escapedId = componentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`id\\s*:\\s*["']${escapedId}["']`).test(effectSource)) {
      continue;
    }
    const nextRegistry = registrySource
      .replace(imported[0], "")
      .replace(new RegExp(`^\\s*${exportName},\\s*$`, "m"), "");
    if (nextRegistry === registrySource) {
      throw new Error("注册表中没有找到该效果的可删除条目");
    }
    await writeFile(effectRegistryPath, nextRegistry, "utf8");
    await unlink(sourcePath);
    await removeEffectFromSavedTimelines(componentId);
    return { source: `effects/${basename(sourcePath)}` };
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
  const trackHeights = Object.entries(input.trackHeights ?? {}).reduce<Record<string, number>>(
    (normalized, [laneId, height]) => {
      const value = Number(height);
      if (laneId && Number.isFinite(value) && value >= 30) {
        normalized[laneId.slice(0, 160)] = Math.min(180, Math.round(value));
      }
      return normalized;
    },
    {},
  );
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
    resourceTracks: Array.isArray(input.resourceTracks)
      ? input.resourceTracks.slice(0, 500).flatMap((track, index) => {
          if (!track || typeof track !== "object") return [];
          const record = track as Record<string, unknown>;
          const kind = ["icon", "material", "sfx"].includes(
            String(record.kind),
          )
            ? String(record.kind)
            : "";
          const url =
            typeof record.url === "string" ? record.url.split("?")[0] : "";
          if (!kind || !url.startsWith("/input/")) return [];
          const id =
            typeof record.id === "string" && record.id
              ? record.id.slice(0, 160)
              : `resource-${Date.now()}-${index + 1}`;
          const position =
            record.position &&
            typeof record.position === "object" &&
            !Array.isArray(record.position)
              ? (record.position as Record<string, unknown>)
              : {};
          const numberOr = (value: unknown, fallback: number) => {
            const number = Number(value);
            return Number.isFinite(number) ? number : fallback;
          };
          return [
            {
              id,
              laneId:
                typeof record.laneId === "string" && record.laneId
                  ? record.laneId.slice(0, 160)
                  : id,
              trackOrder: numberOr(record.trackOrder, index),
              kind,
              resourceId:
                typeof record.resourceId === "string"
                  ? record.resourceId.slice(0, 120)
                  : "unknown",
              name:
                typeof record.name === "string" && record.name
                  ? record.name.slice(0, 260)
                  : `资源轨道 ${index + 1}`,
              url,
              mimeType:
                typeof record.mimeType === "string"
                  ? record.mimeType.slice(0, 120)
                  : "application/octet-stream",
              sourceStartFrame: Math.max(
                0,
                Math.round(numberOr(record.sourceStartFrame, 0)),
              ),
              sourceDurationInFrames: Math.max(
                3,
                Math.round(numberOr(record.sourceDurationInFrames, 3)),
              ),
              startFrame: Math.max(0, Math.round(numberOr(record.startFrame, 0))),
              durationInFrames: Math.max(
                3,
                Math.round(numberOr(record.durationInFrames, 3)),
              ),
              visible: record.visible !== false,
              position: {
                x: numberOr(position.x, 80),
                y: numberOr(position.y, 80),
                width: Math.max(1, numberOr(position.width, kind === "icon" ? 144 : 640)),
                height: Math.max(1, numberOr(position.height, kind === "icon" ? 144 : 360)),
                scale: Math.max(0.1, Math.min(4, numberOr(position.scale, 1))),
                zIndex: Math.round(
                  Math.max(0, Math.min(100, numberOr(position.zIndex, 20))),
                ),
              },
              volume: Math.max(0, Math.min(1, numberOr(record.volume, 1))),
              voiceDucking: Math.max(
                0,
                Math.min(1, numberOr(record.voiceDucking, 0)),
              ),
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
    trackHeights,
    canvasOrientation:
      input.canvasOrientation === "portrait" ? "portrait" : "landscape",
    safetyGuideVisible: input.safetyGuideVisible !== false,
    solidBackgroundEnabled: input.solidBackgroundEnabled !== false,
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

// ===== 内置 AI 编排（overlay-fx-generator 大脑 + OpenAI 兼容接口） =====
const aiArrangeSkillDir = join(rootDir, "overlay-fx-generator");
const llmSecretsDir = join(rootDir, "local-secrets");
const llmConfigPath = join(llmSecretsDir, "llm.config.json");
const arrangementLintScript = join(
  aiArrangeSkillDir,
  "scripts",
  "lint-arrangement-json.mjs",
);

type LlmConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  jsonMode: boolean;
};

const readLlmConfig = async (): Promise<LlmConfig | null> => {
  try {
    const raw = JSON.parse(
      await readFile(llmConfigPath, "utf8"),
    ) as Record<string, unknown>;
    const config = {
      baseUrl: String(raw.baseUrl ?? "").replace(/\/+$/, ""),
      apiKey: String(raw.apiKey ?? ""),
      model: String(raw.model ?? ""),
      temperature: Number.isFinite(Number(raw.temperature))
        ? Number(raw.temperature)
        : 0.8,
      jsonMode: raw.jsonMode !== false,
    };
    return config;
  } catch {
    return null;
  }
};

/** 系统提示词 = SKILL + 组件目录 + 输出格式规范 + 用户偏好（每期实时读盘，改偏好即生效）。 */
const buildArrangerSystemPrompt = async () => {
  const read = (parts: string[]) =>
    readFile(join(...parts), "utf8").catch(() => "");
  const [skill, catalog, format, prefs, defaultPrefs, rules] =
    await Promise.all([
      read([aiArrangeSkillDir, "SKILL.md"]),
      read([aiArrangeSkillDir, "references", "component-catalog.md"]),
      read([aiArrangeSkillDir, "references", "timeline-json.md"]),
      read([aiArrangeSkillDir, "我的偏好.md"]),
      read([aiArrangeSkillDir, "我的偏好.default.md"]),
      read([aiArrangeSkillDir, "经验规则.md"]),
    ]);
  return [
    "你是动效工作台的内置编排大脑。下面是完整编排规范，必须逐条遵守：",
    "=== 编排方法论（SKILL） ===",
    skill,
    "=== 组件目录（componentId 与 props 白名单，只能用这里登记的） ===",
    catalog,
    "=== 输出 JSON 格式规范 ===",
    format,
    prefs.trim()
      ? `=== 用户偏好（优先级最高，覆盖默认） ===\n${prefs}`
      : `=== 出厂默认偏好（用户尚未沉淀个人偏好） ===\n${defaultPrefs}`,
    rules.trim() ? `=== 用户经验规则 ===\n${rules}` : "",
  ]
    .filter((block) => block.trim().length > 0)
    .join("\n\n");
};

const callChatCompletion = async (
  config: LlmConfig,
  messages: Array<{ role: string; content: string }>,
) => {
  const request = async (withJsonMode: boolean) =>
    fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        ...(withJsonMode && config.jsonMode
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
      signal: AbortSignal.timeout(180_000),
    });
  let response = await request(true);
  if (response.status === 400) {
    // 部分兼容端点不支持 response_format，去掉后重试一次。
    response = await request(false);
  }
  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!response.ok) {
    const error = payload?.error as Record<string, unknown> | undefined;
    throw new Error(
      String(error?.message ?? `模型接口返回 ${response.status}`),
    );
  }
  const choices = payload?.choices as Array<Record<string, unknown>> | undefined;
  const message = choices?.[0]?.message as Record<string, unknown> | undefined;
  const text = String(message?.content ?? "");
  if (!text.trim()) throw new Error("模型返回了空内容。");
  return { text, usage: payload?.usage ?? null };
};

const extractJsonDoc = (text: string) => {
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("模型输出里没有找到 JSON 对象。");
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
};

const runArrangementLint = async (doc: unknown, durationSec: number) => {
  const tmpPath = join(llmSecretsDir, `lint-tmp-${Date.now()}.json`);
  await mkdir(llmSecretsDir, { recursive: true });
  await writeFile(tmpPath, JSON.stringify(doc), "utf8");
  try {
    const result = await new Promise<{ failed: boolean; output: string }>(
      (resolve) => {
        execFile(
          process.execPath,
          [
            arrangementLintScript,
            tmpPath,
            "--duration",
            String(Math.max(1, Math.round(durationSec))),
          ],
          { cwd: rootDir, timeout: 60_000 },
          (error, stdout) =>
            resolve({ failed: Boolean(error), output: String(stdout ?? "") }),
        );
      },
    );
    return { ok: !result.failed, output: result.output.trim() };
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
};


const SEMANTIC_INTENT_IDS = [
  "emphasis",
  "metric",
  "comparison",
  "list",
  "process",
  "explanation",
  "warning",
  "evidence",
  "transition",
  "call-to-action",
] as const;
type SemanticIntentId = (typeof SEMANTIC_INTENT_IDS)[number];
const SEMANTIC_INTENT_ID_SET = new Set<string>(SEMANTIC_INTENT_IDS);

type SemanticTagConfig = {
  enabled: boolean;
  iconIds: string[];
  sfxIds: string[];
  componentIds: string[];
};

const buildDefaultSemanticTags = (): Record<SemanticIntentId, SemanticTagConfig> => {
  const out = {} as Record<SemanticIntentId, SemanticTagConfig>;
  for (const id of SEMANTIC_INTENT_IDS) {
    out[id] = { enabled: true, iconIds: [], sfxIds: [], componentIds: [] };
  }
  return out;
};

const normalizeIdList = (input: unknown, max: number): string[] => {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of input) {
    if (typeof id !== "string") continue;
    const clean = id.trim();
    if (!/^[A-Za-z0-9._-]{1,80}$/.test(clean)) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
    if (out.length >= max) break;
  }
  return out;
};

const normalizeSemanticTagConfig = (input: unknown): SemanticTagConfig => {
  const record = (input ?? {}) as Record<string, unknown>;
  return {
    enabled: record.enabled !== false,
    iconIds: normalizeIdList(record.iconIds, 16),
    sfxIds: normalizeIdList(record.sfxIds, 8),
    componentIds: normalizeIdList(record.componentIds, 32),
  };
};

const normalizeSemanticTagsRecord = (
  input: unknown,
): Record<SemanticIntentId, SemanticTagConfig> => {
  const fallback = buildDefaultSemanticTags();
  if (!input || typeof input !== "object") return fallback;
  const record = input as Record<string, unknown>;
  for (const id of SEMANTIC_INTENT_IDS) {
    if (SEMANTIC_INTENT_ID_SET.has(id) && record[id] && typeof record[id] === "object") {
      fallback[id] = normalizeSemanticTagConfig(record[id]);
    }
  }
  return fallback;
};

type ArrangementRuleManifest = {
  version: 2;
  activeRuleId: string;
  rules: Array<{
    id: string;
    name: string;
    keepStyleConsistent: boolean;
    accentColor: string;
    learnFromConfirmedChoices: boolean;
    componentScores: Record<string, number>;
    semanticTags: Record<SemanticIntentId, SemanticTagConfig>;
  }>;
};

const normalizeArrangementRuleManifest = (
  input: unknown,
): ArrangementRuleManifest => {
  if (!input || typeof input !== "object") {
    throw new Error("编排规则清单格式无效");
  }
  const raw = input as Record<string, unknown>;
  if (!Array.isArray(raw.rules) || raw.rules.length === 0) {
    throw new Error("至少需要一条编排规则");
  }
  if (raw.rules.length > 100) throw new Error("编排规则数量不能超过 100 条");
  const ids = new Set<string>();
  const rules = raw.rules.map((rawRule, index) => {
    if (!rawRule || typeof rawRule !== "object") {
      throw new Error(`第 ${index + 1} 条编排规则格式无效`);
    }
    const rule = rawRule as Record<string, unknown>;
    const id = typeof rule.id === "string" ? rule.id.trim() : "";
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(id) || ids.has(id)) {
      throw new Error(`第 ${index + 1} 条编排规则 ID 无效或重复`);
    }
    ids.add(id);
    const name = typeof rule.name === "string" ? rule.name.trim().slice(0, 40) : "";
    if (!name) throw new Error(`第 ${index + 1} 条编排规则名称不能为空`);
    const accentColor =
      typeof rule.accentColor === "string" &&
      /^#[0-9a-f]{6}$/i.test(rule.accentColor)
        ? rule.accentColor.toLowerCase()
        : "";
    if (!accentColor) throw new Error(`第 ${index + 1} 条编排规则主色无效`);
    const componentScores =
      rule.componentScores && typeof rule.componentScores === "object"
        ? Object.fromEntries(
            Object.entries(rule.componentScores as Record<string, unknown>)
              .filter(
                ([componentId, score]) =>
                  /^[A-Za-z0-9_-]{1,100}$/.test(componentId) &&
                  Number.isFinite(Number(score)),
              )
              .slice(0, 500)
              .map(([componentId, score]) => [
                componentId,
                Math.max(-8, Math.min(12, Number(score))),
              ]),
          )
        : {};
    const semanticTags = normalizeSemanticTagsRecord(rule.semanticTags);
    return {
      id,
      name,
      keepStyleConsistent: rule.keepStyleConsistent !== false,
      accentColor,
      learnFromConfirmedChoices: rule.learnFromConfirmedChoices !== false,
      componentScores,
      semanticTags,
    };
  });
  const requestedActiveId =
    typeof raw.activeRuleId === "string" ? raw.activeRuleId : "";
  return {
    version: 2,
    activeRuleId: ids.has(requestedActiveId) ? requestedActiveId : rules[0].id,
    rules,
  };
};

const ICON_CATEGORY_ACCENTS: Record<string, string> = {
  "内容与素材": "#2f8cff",
  "自动化与流程": "#27c4e8",
  "状态与数据": "#20d7a0",
  "商务与教育": "#f2b93d",
  "沟通与传播": "#a776f7",
  "表达与强调": "#4f9dff",
};

const readCustomIconGroups = (manifest: { iconGroups?: unknown }) =>
  Array.isArray(manifest.iconGroups)
    ? manifest.iconGroups.filter(
        (group): group is { id: string; name: string; accent: string } =>
          Boolean(group) && typeof group === "object" &&
          /^[A-Za-z0-9_-]+$/.test(String((group as Record<string, unknown>).id ?? "")) &&
          typeof (group as Record<string, unknown>).name === "string" &&
          typeof (group as Record<string, unknown>).accent === "string",
      )
    : [];

const iconCategoryAccent = (manifest: { iconGroups?: unknown }, category: string) =>
  ICON_CATEGORY_ACCENTS[category] ??
  readCustomIconGroups(manifest).find((group) => group.name === category)?.accent;

const SFX_RESERVED_GROUP_NAMES = ["内置音效", "自定义音效"];

const readCustomSfxGroups = (manifest: { sfxGroups?: unknown }) =>
  Array.isArray(manifest.sfxGroups)
    ? manifest.sfxGroups.filter(
        (group): group is { id: string; name: string; accent: string } =>
          Boolean(group) && typeof group === "object" &&
          /^[A-Za-z0-9_-]+$/.test(String((group as Record<string, unknown>).id ?? "")) &&
          typeof (group as Record<string, unknown>).name === "string" &&
          typeof (group as Record<string, unknown>).accent === "string",
      )
    : [];

const importManualIcon = async (
  filename: string,
  category: string,
  body: Buffer,
) => {
  if (extname(filename).toLowerCase() !== ".svg") {
    throw new Error("仅支持 SVG 图标文件");
  }
  const source = body.toString("utf8");
  if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(source)) {
    throw new Error("文件不是有效的 SVG");
  }
  const blockedSvgContent = [
    [/<\/?script\b/i, "脚本"],
    [/<\/?(?:foreignObject|iframe|object|embed|image)\b/i, "嵌入内容"],
    [/\son[a-z]+\s*=/i, "事件处理器"],
    [/(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|data:|javascript:|file:)/i, "外部资源"],
  ] as const;
  for (const [pattern, label] of blockedSvgContent) {
    if (pattern.test(source)) throw new Error(`SVG 不允许包含${label}`);
  }

  const manifest = JSON.parse(await readFile(resourceManifestPath, "utf8")) as {
    resources: Array<Record<string, unknown>>;
    iconGroups?: unknown;
  };
  const accent = iconCategoryAccent(manifest, category);
  if (!accent) throw new Error("图标分类无效");
  const baseName = basename(filename, extname(filename));
  const slug = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "custom-icon";
  const existingIds = new Set(
    manifest.resources
      .filter((resource) => resource.library === "icons")
      .map((resource) => String(resource.id ?? "")),
  );
  let id = slug;
  for (let suffix = 2; existingIds.has(id); suffix += 1) id = `${slug}-${suffix}`;
  const label = baseName.replace(/[_-]+/g, " ").trim().slice(0, 40) || id;
  const entry = {
    id,
    library: "icons",
    file: `icons/${id}.svg`,
    label,
    category,
    accent,
    tags: [category, "手动导入"],
    usage: "用户手动导入的 SVG 图标",
    source: "manual",
  };
  await writeFile(join(iconResourceDir, `${id}.svg`), body);
  manifest.resources.push(entry);
  await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const { createResourceIndex } = await import(
    "./ai-motion-arranger/scripts/build-resource-index.mjs"
  );
  const index = await createResourceIndex();
  await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  const indexed = index.libraries.icons.find((icon) => icon.id === id);
  if (!indexed) throw new Error("图标索引生成失败");
  return indexed;
};

const deleteManualIcon = async (iconId: string) => {
  if (!/^[A-Za-z0-9_-]+$/.test(iconId)) throw new Error("图标标识无效");
  const originalManifest = await readFile(resourceManifestPath, "utf8");
  const originalIndex = await readFile(resourceIndexPath, "utf8");
  const manifest = JSON.parse(originalManifest) as {
    resources: Array<Record<string, unknown>>;
  };
  const resource = manifest.resources.find(
    (item) => item.library === "icons" && item.id === iconId,
  );
  if (!resource || resource.source !== "manual") {
    throw new Error("只能删除手动导入的图标");
  }
  const relativeFile = typeof resource.file === "string" ? resource.file : "";
  if (!/^icons\/[A-Za-z0-9_-]+\.svg$/.test(relativeFile)) {
    throw new Error("图标文件无效");
  }
  const target = resolve(resourceRoot, relativeFile);
  const iconRoot = `${resolve(iconResourceDir)}${process.platform === "win32" ? "\\" : "/"}`;
  if (!target.startsWith(iconRoot) || !existsSync(target)) {
    throw new Error("图标文件不存在");
  }
  const originalAsset = await readFile(target);
  manifest.resources = manifest.resources.filter((item) => item !== resource);

  try {
    await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await unlink(target);
    const { createResourceIndex } = await import(
      "./ai-motion-arranger/scripts/build-resource-index.mjs"
    );
    const index = await createResourceIndex();
    await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  } catch (error) {
    await writeFile(resourceManifestPath, originalManifest);
    if (!existsSync(target)) await writeFile(target, originalAsset);
    await writeFile(resourceIndexPath, originalIndex);
    throw error;
  }
};

const SFX_EXTENSIONS = new Set([".wav", ".mp3", ".ogg", ".m4a"]);

const readAudioDuration = async (target: string) => {
  const output = await runBinary(ffprobeBinary(), [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    target,
  ]);
  const durationSeconds = Number(output.trim());
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("无法读取音效时长，请确认文件可以正常播放");
  }
  return Number(durationSeconds.toFixed(3));
};

const MATERIAL_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".mp4",
  ".mov",
  ".webm",
]);

const importManualMaterial = async (
  filename: string,
  category: string,
  body: Buffer,
) => {
  const extension = extname(filename).toLowerCase();
  if (!MATERIAL_EXTENSIONS.has(extension)) {
    throw new Error("仅支持 PNG、JPG、WEBP、GIF、MP4、MOV 或 WEBM 素材");
  }
  const safeCategory = category.trim().slice(0, 20);
  if (!safeCategory || /[\\/\u0000-\u001f]/.test(safeCategory)) {
    throw new Error("素材文件夹名称无效");
  }
  const originalManifest = await readFile(resourceManifestPath, "utf8");
  const originalIndex = await readFile(resourceIndexPath, "utf8");
  const manifest = JSON.parse(originalManifest) as {
    resources: Array<Record<string, unknown>>;
  };
  const baseName = basename(filename, extname(filename));
  const slug = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "custom-material";
  const existingIds = new Set(
    manifest.resources
      .filter((resource) => resource.library === "materials")
      .map((resource) => String(resource.id ?? "")),
  );
  let id = slug;
  for (let suffix = 2; existingIds.has(id); suffix += 1) id = `${slug}-${suffix}`;
  const storedFile = `materials/${safeCategory}/${id}${extension}`;
  const target = resolve(resourceRoot, storedFile);
  const materialRoot = `${resolve(materialResourceDir)}${process.platform === "win32" ? "\\" : "/"}`;
  if (!target.startsWith(materialRoot)) throw new Error("素材文件路径无效");
  const label = baseName.trim().slice(0, 48) || id;

  try {
    mkdirSync(dirname(target), { recursive: true });
    await writeFile(target, body);
    manifest.resources.push({
      id,
      library: "materials",
      file: storedFile,
      label,
      category: safeCategory,
      accent: "#2f8cff",
      tags: ["素材", safeCategory, "手动导入", label],
      usage: "用户手动导入的视频或图片素材",
      source: "manual",
    });
    await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    const { createResourceIndex } = await import(
      "./ai-motion-arranger/scripts/build-resource-index.mjs"
    );
    const index = await createResourceIndex();
    await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
    const indexed = index.libraries.materials.find((material) => material.id === id);
    if (!indexed) throw new Error("素材索引生成失败");
    return indexed;
  } catch (error) {
    if (existsSync(target)) await unlink(target).catch(() => undefined);
    await writeFile(resourceManifestPath, originalManifest);
    await writeFile(resourceIndexPath, originalIndex);
    throw error;
  }
};

const deleteManualMaterial = async (materialId: string) => {
  if (!/^[A-Za-z0-9._-]+$/.test(materialId)) throw new Error("素材标识无效");
  const originalManifest = await readFile(resourceManifestPath, "utf8");
  const originalIndex = await readFile(resourceIndexPath, "utf8");
  const manifest = JSON.parse(originalManifest) as {
    resources: Array<Record<string, unknown>>;
  };
  const resource = manifest.resources.find(
    (item) => item.library === "materials" && item.id === materialId,
  );
  if (!resource || resource.source !== "manual") {
    throw new Error("只能删除手动导入的素材");
  }
  const relativeFile = typeof resource.file === "string" ? resource.file : "";
  if (
    !relativeFile.startsWith("materials/") ||
    relativeFile.split("/").some((part) => !part || part === "..") ||
    !MATERIAL_EXTENSIONS.has(extname(relativeFile).toLowerCase())
  ) {
    throw new Error("素材文件无效");
  }
  const target = resolve(resourceRoot, relativeFile);
  const materialRoot = `${resolve(materialResourceDir)}${process.platform === "win32" ? "\\" : "/"}`;
  if (!target.startsWith(materialRoot) || !existsSync(target)) {
    throw new Error("素材文件不存在");
  }
  const originalAsset = await readFile(target);
  manifest.resources = manifest.resources.filter((item) => item !== resource);
  try {
    await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await unlink(target);
    const { createResourceIndex } = await import(
      "./ai-motion-arranger/scripts/build-resource-index.mjs"
    );
    const index = await createResourceIndex();
    await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  } catch (error) {
    await writeFile(resourceManifestPath, originalManifest);
    if (!existsSync(target)) await writeFile(target, originalAsset);
    await writeFile(resourceIndexPath, originalIndex);
    throw error;
  }
};

const findMaterialFile = async (materialId: string) => {
  if (!/^[A-Za-z0-9._-]+$/.test(materialId)) throw new Error("素材标识无效");
  const manifest = JSON.parse(await readFile(resourceManifestPath, "utf8")) as {
    resources: Array<Record<string, unknown>>;
  };
  const resource = manifest.resources.find(
    (item) => item.library === "materials" && item.id === materialId,
  );
  const relativeFile = typeof resource?.file === "string" ? resource.file : "";
  if (
    !relativeFile.startsWith("materials/") ||
    relativeFile.split("/").some((part) => !part || part === "..") ||
    !MATERIAL_EXTENSIONS.has(extname(relativeFile).toLowerCase())
  ) {
    throw new Error("找不到素材文件");
  }
  const target = resolve(resourceRoot, relativeFile);
  const materialRoot = `${resolve(materialResourceDir)}${process.platform === "win32" ? "\\" : "/"}`;
  if (!target.startsWith(materialRoot) || !existsSync(target)) {
    throw new Error("素材文件不存在");
  }
  return target;
};

const createMaterialFolder = (name: string) => {
  const safeName = name.trim().slice(0, 20);
  if (!safeName || /[\\/\u0000-\u001f]/.test(safeName) || safeName === "." || safeName === "..") {
    throw new Error("素材文件夹名称无效");
  }
  const target = resolve(materialResourceDir, safeName);
  const materialRoot = `${resolve(materialResourceDir)}${process.platform === "win32" ? "\\" : "/"}`;
  if (!target.startsWith(materialRoot)) throw new Error("素材文件夹路径无效");
  mkdirSync(target, { recursive: true });
  return { name: safeName };
};

const importManualSfx = async (filename: string, body: Buffer) => {
  const extension = extname(filename).toLowerCase();
  if (!SFX_EXTENSIONS.has(extension)) {
    throw new Error("仅支持 WAV、MP3、OGG 或 M4A 音效文件");
  }
  const originalManifest = await readFile(resourceManifestPath, "utf8");
  const originalIndex = await readFile(resourceIndexPath, "utf8");
  const manifest = JSON.parse(originalManifest) as {
    resources: Array<Record<string, unknown>>;
  };
  const baseName = basename(filename, extname(filename));
  const slug = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "custom-sound";
  const existingIds = new Set(
    manifest.resources
      .filter((resource) => resource.library === "sfx")
      .map((resource) => String(resource.id ?? "")),
  );
  let id = slug;
  for (let suffix = 2; existingIds.has(id); suffix += 1) id = `${slug}-${suffix}`;
  const storedFile = `sfx/${id}${extension}`;
  const target = resolve(resourceRoot, storedFile);
  const sfxRoot = `${resolve(sfxResourceDir)}${process.platform === "win32" ? "\\" : "/"}`;
  if (!target.startsWith(sfxRoot)) throw new Error("音效文件路径无效");
  const label = baseName.replace(/[_-]+/g, " ").trim().slice(0, 48) || id;

  try {
    await writeFile(target, body);
    const durationSeconds = await readAudioDuration(target);
    manifest.resources.push({
      id,
      library: "sfx",
      file: storedFile,
      label,
      category: "自定义音效",
      accent: "#a776f7",
      tags: ["音效", "手动导入", label],
      usage: "用户手动导入的短音效",
      source: "manual",
      durationSeconds,
    });
    await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    const { createResourceIndex } = await import(
      "./ai-motion-arranger/scripts/build-resource-index.mjs"
    );
    const index = await createResourceIndex();
    await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
    const indexed = index.libraries.sfx.find((sound) => sound.id === id);
    if (!indexed) throw new Error("音效索引生成失败");
    return indexed;
  } catch (error) {
    if (existsSync(target)) await unlink(target).catch(() => undefined);
    await writeFile(resourceManifestPath, originalManifest);
    await writeFile(resourceIndexPath, originalIndex);
    throw error;
  }
};

const findSfxFile = async (soundId: string) => {
  if (!/^[A-Za-z0-9._-]+$/.test(soundId)) throw new Error("音效标识无效");
  const manifest = JSON.parse(await readFile(resourceManifestPath, "utf8")) as {
    resources: Array<Record<string, unknown>>;
  };
  const resource = manifest.resources.find(
    (item) => item.library === "sfx" && item.id === soundId,
  );
  const relativeFile = typeof resource?.file === "string" ? resource.file : "";
  if (!/^sfx\/[A-Za-z0-9._-]+\.(?:wav|mp3|ogg|m4a)$/i.test(relativeFile)) {
    throw new Error("找不到音效文件");
  }
  const target = resolve(resourceRoot, relativeFile);
  const sfxRoot = `${resolve(sfxResourceDir)}${process.platform === "win32" ? "\\" : "/"}`;
  if (!target.startsWith(sfxRoot) || !existsSync(target)) {
    throw new Error("音效文件不存在");
  }
  return { manifest, resource, target };
};

const deleteManualSfx = async (soundId: string) => {
  const originalManifest = await readFile(resourceManifestPath, "utf8");
  const originalIndex = await readFile(resourceIndexPath, "utf8");
  const { manifest, resource, target } = await findSfxFile(soundId);
  if (resource?.source !== "manual") throw new Error("只能删除手动导入的音效");
  const originalAsset = await readFile(target);
  manifest.resources = manifest.resources.filter((item) => item !== resource);
  try {
    await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await unlink(target);
    const { createResourceIndex } = await import(
      "./ai-motion-arranger/scripts/build-resource-index.mjs"
    );
    const index = await createResourceIndex();
    await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  } catch (error) {
    await writeFile(resourceManifestPath, originalManifest);
    if (!existsSync(target)) await writeFile(target, originalAsset);
    await writeFile(resourceIndexPath, originalIndex);
    throw error;
  }
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

type BundledImport = {
  text: string;
  source: string;
  isTypeOnly: boolean;
  defaultName: string;
  namespaceName: string;
  namedSpecs: Array<{ imported: string; local: string }>;
};

const parseBundlerImports = (code: string): BundledImport[] => {
  const imports: BundledImport[] = [];
  const pattern =
    /^import\s+(?:[\s\S]*?\sfrom\s*)?["']([^"']+)["']\s*;?[ \t]*$/gm;
  for (const match of code.matchAll(pattern)) {
    const text = match[0];
    const clause = text
      .replace(/^import\s+/, "")
      .replace(/\s*from\s*["'][^"']+["']\s*;?\s*$/, "")
      .trim();
    if (!clause || clause.startsWith('"') || clause.startsWith("'")) {
      imports.push({
        text,
        source: match[1],
        isTypeOnly: false,
        defaultName: "",
        namespaceName: "",
        namedSpecs: [],
      });
      continue;
    }
    const isTypeOnly = /^type\s/.test(clause);
    const working = isTypeOnly ? clause.replace(/^type\s+/, "") : clause;
    const namespaceMatch = working.match(/^\*\s+as\s+(\w+)$/);
    const defaultWithNamedMatch = working.match(/^(\w+)\s*,\s*([\s\S]*)$/);
    const defaultOnlyMatch = working.match(/^(\w+)$/);
    let defaultName = "";
    let namespaceName = "";
    let namedSource = "";
    if (namespaceMatch) {
      namespaceName = namespaceMatch[1];
    } else if (defaultWithNamedMatch) {
      defaultName = defaultWithNamedMatch[1];
      namedSource = defaultWithNamedMatch[2];
    } else if (/\{[\s\S]*\}/.test(working)) {
      namedSource = working;
    } else if (defaultOnlyMatch) {
      defaultName = defaultOnlyMatch[1];
    }
    const namedSpecs: Array<{ imported: string; local: string }> = [];
    const inner = namedSource.match(/\{([\s\S]*)\}/);
    if (inner) {
      for (const part of inner[1].split(",")) {
        const trimmed = part.trim();
        if (!trimmed || /^type\s/.test(trimmed)) continue;
        const asMatch = trimmed.match(/^([\w$]+)\s+as\s+([\w$]+)$/);
        namedSpecs.push(
          asMatch
            ? { imported: asMatch[1], local: asMatch[2] }
            : { imported: trimmed, local: trimmed },
        );
      }
    }
    imports.push({
      text,
      source: match[1],
      isTypeOnly,
      defaultName,
      namespaceName,
      namedSpecs,
    });
  }
  return imports;
};

// 把效果源文件打包成单文件：相对依赖递归内联（IIFE 隔离作用域），
// 仅保留 react / remotion 外部导入，并补上 MOTION_COMPONENTS 导出，
// 使「跳转到代码」载入的源码能直接通过导入校验。
const bundleEffectSource = async (
  entryCode: string,
  entryDir: string,
  componentId: string,
): Promise<string> => {
  const externalStatements = new Set<string>();
  const visited = new Set<string>();
  let defaultCounter = 0;

  const resolveLocalModule = async (spec: string, dir: string) => {
    const base = join(dir, spec);
    const candidates = /\.(ts|tsx)$/i.test(spec)
      ? [base]
      : [`${base}.tsx`, `${base}.ts`];
    for (const candidate of candidates) {
      try {
        return { path: candidate, code: await readFile(candidate, "utf8") };
      } catch {
        continue;
      }
    }
    return null;
  };

  const stripExports = (code: string, defaultVar: string) =>
    code
      .replace(/\bexport\s+default\s+/g, `const ${defaultVar} = `)
      .replace(
        /\bexport\s+(?:(async)\s+)?(const|let|var|function|class|type|interface|enum)\b/g,
        "$1 $2",
      );

  const processModule = async (code: string, dir: string): Promise<string> => {
    let body = code;
    for (const statement of parseBundlerImports(code)) {
      let replacement = "";
      if (!statement.isTypeOnly) {
        if (!statement.source.startsWith(".")) {
          externalStatements.add(statement.text.trim());
        } else {
          const resolved = await resolveLocalModule(statement.source, dir);
          if (!resolved) {
            throw new Error(`无法内联本地依赖 ${statement.source}`);
          }
          if (!visited.has(resolved.path)) {
            visited.add(resolved.path);
            const defaultVar = `__bundledDefault${(defaultCounter += 1)}`;
            const depBody = await processModule(
              stripExports(resolved.code, defaultVar),
              dirname(resolved.path),
            );
            if (statement.namespaceName) {
              const declaredNames = new Set<string>();
              for (const declared of depBody.matchAll(
                /\b(?:const|let|var|function|class)\s+([\w$]+)/g,
              )) {
                declaredNames.add(declared[1]);
              }
              replacement = `const ${
                statement.namespaceName
              } = (() => {\n${depBody.trim()}\nreturn { ${[
                ...declaredNames,
              ].join(", ")} };\n})();`;
            } else {
              const returnKeys = statement.namedSpecs.map(
                (spec) => spec.imported,
              );
              const destructured = statement.namedSpecs.map((spec) =>
                spec.imported === spec.local
                  ? spec.imported
                  : `${spec.imported}: ${spec.local}`,
              );
              if (statement.defaultName) {
                returnKeys.push(defaultVar);
                destructured.push(`${defaultVar}: ${statement.defaultName}`);
              }
              replacement = `const { ${destructured.join(
                ", ",
              )} } = (() => {\n${depBody.trim()}\nreturn { ${returnKeys.join(
                ", ",
              )} };\n})();`;
            }
          }
        }
      }
      body = body.replace(statement.text, () => replacement);
    }
    return body;
  };

  const buildMotionComponentsExport = () => {
    if (/\bexport\s+(?:const|let|var)\s+MOTION_COMPONENTS\b/.test(entryCode)) {
      return "";
    }
    for (const defMatch of entryCode.matchAll(
      /export\s+const\s+(\w+)[^;{}]*?=\s*\{/g,
    )) {
      const windowStart = defMatch.index! + defMatch[0].length;
      const idMatch = entryCode
        .slice(windowStart, windowStart + 800)
        .match(/id\s*:\s*["']([^"']+)["']/);
      if (idMatch && idMatch[1] === componentId) {
        return `export const MOTION_COMPONENTS = [${defMatch[1]}];\n`;
      }
    }
    const listMatch = entryCode.match(
      /export\s+const\s+(\w+)\s*:\s*(?:readonly\s+)?[\w.]+(?:\[\])+/,
    );
    if (listMatch) {
      return `export const MOTION_COMPONENTS = ${
        listMatch[1]
      }.filter((def: { id?: string }) => def.id === ${JSON.stringify(
        componentId,
      )});\n`;
    }
    return "";
  };

  const entryBody = await processModule(entryCode, entryDir);
  const motionComponentsExport = buildMotionComponentsExport();
  return [
    [...externalStatements].join("\n"),
    "",
    entryBody.trim(),
    "",
    motionComponentsExport,
    motionComponentsExport ? "export default MOTION_COMPONENTS;\n" : "",
  ]
    .filter(Boolean)
    .join("\n");
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

const localApi = (): Plugin => {
  let suppressEffectSourceHmrUntil = 0;
  const normalizeWatchPath = (file: string) =>
    resolve(file).replace(/\\/g, "/").toLocaleLowerCase("en-US");
  const normalizedEffectRegistryPath = normalizeWatchPath(effectRegistryPath);
  const normalizedLegacyEffectsPath = normalizeWatchPath(legacyEffectsPath);
  const normalizedActiveComponentPath = normalizeWatchPath(activeComponentPath);
  const effectSourcePathPrefixes = [
    `${normalizeWatchPath(join(rootDir, "effects"))}/`,
    `${normalizeWatchPath(componentStoreDir)}/`,
  ];
  const isEffectSourcePath = (file: string) => {
    const normalizedFile = normalizeWatchPath(file);
    return (
      normalizedFile === normalizedEffectRegistryPath ||
      normalizedFile === normalizedLegacyEffectsPath ||
      normalizedFile === normalizedActiveComponentPath ||
      effectSourcePathPrefixes.some((prefix) => normalizedFile.startsWith(prefix))
    );
  };

  return {
  name: "motion-studio-local-api",
  hotUpdate(options) {
    if (
      Date.now() <= suppressEffectSourceHmrUntil &&
      isEffectSourcePath(options.file)
    ) {
      // Keep the current browser state, but invalidate the server cache so a
      // newly opened page receives the registry after the deletion.
      for (const module of options.modules) {
        this.environment.moduleGraph.invalidateModule(
          module,
          undefined,
          options.timestamp,
          true,
        );
      }
      return [];
    }
  },
  configureServer(server) {
    mkdirSync(mediaDir, { recursive: true });
    mkdirSync(mediaTempDir, { recursive: true });
    mkdirSync(iconResourceDir, { recursive: true });
    mkdirSync(materialResourceDir, { recursive: true });
    mkdirSync(sfxResourceDir, { recursive: true });
    mkdirSync(arrangementRulesDir, { recursive: true });
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(renderDir, { recursive: true });
    mkdirSync(componentStoreDir, { recursive: true });
    const withoutEffectSourceHotReload = async <T>(operation: () => Promise<T>) => {
      suppressEffectSourceHmrUntil = Date.now() + 2_000;
      return operation();
    };
    server.middlewares.use(async (req, res, next) => {
      try {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        if (url.pathname === "/api/health") {
          sendJson(res, 200, { ok: true, localOnly: true });
          return;
        }

        if (url.pathname === "/api/arrangement-rules" && req.method === "GET") {
          const manifest = normalizeArrangementRuleManifest(
            JSON.parse(await readFile(arrangementRulesManifestPath, "utf8")),
          );
          sendJson(res, 200, { ok: true, manifest });
          return;
        }

        if (url.pathname === "/api/arrangement-rules" && req.method === "PUT") {
          const manifest = normalizeArrangementRuleManifest(
            JSON.parse((await getBody(req, 1024 * 1024)).toString("utf8")),
          );
          const temporaryPath = `${arrangementRulesManifestPath}.tmp`;
          await writeFile(
            temporaryPath,
            `${JSON.stringify(manifest, null, 2)}\n`,
            "utf8",
          );
          await rename(temporaryPath, arrangementRulesManifestPath);
          sendJson(res, 200, {
            ok: true,
            manifest,
            path: "public/input/arrangement-rules/rule-manifest.json",
          });
          return;
        }

        if (
          url.pathname === "/api/open-arrangement-rules-location" &&
          req.method === "POST"
        ) {
          if (!existsSync(arrangementRulesManifestPath)) {
            throw new Error("编排规则文件不存在");
          }
          runOpenFolder(arrangementRulesManifestPath);
          sendJson(res, 200, { ok: true });
          return;
        }

        if (url.pathname === "/api/delete-effect" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { componentId?: string; imported?: boolean };
          if (!body.componentId || !/^[A-Za-z0-9_-]+$/.test(body.componentId)) {
            throw new Error("效果标识无效");
          }
          const deleted = await withoutEffectSourceHotReload(() =>
            body.imported
              ? deleteImportedEffectSource(body.componentId)
              : deleteRegisteredEffectSource(body.componentId),
          );
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
          const deleted = await withoutEffectSourceHotReload(async () => {
            const results = [];
            for (const componentId of componentIds) {
              results.push({
                componentId,
                ...(await deleteRegisteredEffectSource(componentId)),
              });
            }
            return results;
          });
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
            instanceCount:
              snapshot.instances.length + (snapshot.resourceTracks?.length ?? 0),
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

        if (url.pathname === "/api/review-log" && req.method === "POST") {
          // 「导出编排给AI」：保存 AI 初稿(origin) + 用户微调终稿(motionTimeline)，
          // 供 overlay-fx-generator 的「学一下」逐卡 diff。
          const body = JSON.parse(
            (await getBody(req, 8 * 1024 * 1024)).toString("utf8"),
          ) as Record<string, unknown>;
          // 文件名用本地时间，避免 UTC 时间戳看着差 8 小时。
          const now = new Date();
          const pad = (value: number) => String(value).padStart(2, "0");
          const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
          const reviewDir = join(projectDir, "review-logs");
          await mkdir(reviewDir, { recursive: true });
          const filePath = join(reviewDir, `${stamp}-review-log.json`);
          await writeFile(filePath, `${JSON.stringify(body, null, 2)}\n`, "utf8");
          sendJson(res, 200, { ok: true, path: filePath });
          return;
        }

        if (url.pathname === "/api/llm-config" && req.method === "GET") {
          const config = await readLlmConfig();
          sendJson(res, 200, {
            ok: true,
            configured: Boolean(config?.baseUrl && config?.apiKey && config?.model),
            baseUrl: config?.baseUrl ?? "",
            model: config?.model ?? "",
            temperature: config?.temperature ?? 0.8,
            jsonMode: config?.jsonMode ?? true,
            // 只回掩码，完整 key 永不下发到浏览器。
            apiKeyMasked: config?.apiKey
              ? `${config.apiKey.slice(0, 4)}****${config.apiKey.slice(-4)}`
              : "",
          });
          return;
        }

        if (url.pathname === "/api/llm-config" && req.method === "PUT") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as Record<string, unknown>;
          const baseUrl = String(body.baseUrl ?? "").trim().replace(/\/+$/, "");
          const model = String(body.model ?? "").trim();
          const apiKey = String(body.apiKey ?? "").trim();
          const previous = await readLlmConfig();
          if (!baseUrl || !model || (!apiKey && !previous?.apiKey)) {
            sendJson(res, 400, {
              ok: false,
              error: "baseUrl、模型名、API Key 三项都要有（Key 已保存过可留空）。",
            });
            return;
          }
          mkdirSync(llmSecretsDir, { recursive: true });
          await writeFile(
            llmConfigPath,
            `${JSON.stringify(
              {
                baseUrl,
                model,
                apiKey: apiKey || previous?.apiKey || "",
                temperature: Number.isFinite(Number(body.temperature))
                  ? Number(body.temperature)
                  : (previous?.temperature ?? 0.8),
                jsonMode: body.jsonMode !== false,
              },
              null,
              2,
            )}\n`,
            "utf8",
          );
          // 防止 key 进 git：.gitignore 没有就补一行。
          const gitignorePath = join(rootDir, ".gitignore");
          const gitignore = await readFile(gitignorePath, "utf8").catch(
            () => "",
          );
          if (!gitignore.split(/\r?\n/).includes("local-secrets/")) {
            await writeFile(
              gitignorePath,
              `${gitignore}${gitignore.endsWith("\n") || !gitignore ? "" : "\n"}local-secrets/\n`,
              "utf8",
            );
          }
          sendJson(res, 200, { ok: true });
          return;
        }

        if (url.pathname === "/api/ai-arrange" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 2 * 1024 * 1024)).toString("utf8"),
          ) as {
            srtText?: string;
            sourceSrt?: string;
            canvas?: { width?: number; height?: number; orientation?: string };
            fps?: number;
            durationSec?: number;
          };
          const config = await readLlmConfig();
          if (!config?.baseUrl || !config?.apiKey || !config?.model) {
            sendJson(res, 400, {
              ok: false,
              error: "尚未配置模型：先在弹窗里保存 baseUrl / 模型名 / API Key。",
            });
            return;
          }
          const srtText = String(body.srtText ?? "").trim();
          if (!srtText) {
            sendJson(res, 400, { ok: false, error: "没有 SRT 内容。" });
            return;
          }
          const fps = Number(body.fps) > 0 ? Number(body.fps) : 30;
          const durationSec =
            Number(body.durationSec) > 0 ? Number(body.durationSec) : 60;
          const canvas = body.canvas ?? {
            width: 1080,
            height: 1920,
            orientation: "portrait",
          };
          try {
            const systemPrompt = await buildArrangerSystemPrompt();
            const userPrompt = [
              "【任务】为下面的 SRT 口播字幕编排动效。",
              `【画布】${canvas.width}x${canvas.height}（${canvas.orientation}），fps=${fps}，视频时长约 ${Math.round(durationSec)} 秒。`,
              body.sourceSrt ? `【文件名】${body.sourceSrt}` : "",
              "【内置管线要求】直接输出一个编排 JSON 对象：以 { 开头、} 结尾，不要 markdown 代码块，不要输出分段脚本文本或素材清单。分段脚本与素材清单会由工作台另行展示。",
              "【SRT 内容】",
              srtText,
            ]
              .filter(Boolean)
              .join("\n");
            const messages: Array<{ role: string; content: string }> = [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ];
            let call = await callChatCompletion(config, messages);
            let doc = extractJsonDoc(call.text);
            let lint = await runArrangementLint(doc, durationSec);
            let repaired = false;
            if (!lint.ok) {
              // 自修复一轮：把 lint 报错发回给模型重写。
              repaired = true;
              messages.push(
                { role: "assistant", content: call.text },
                {
                  role: "user",
                  content: `lint 体检发现 error，必须全部修正。请重新输出完整编排 JSON（仍然只输出 JSON 本体）。lint 报告：\n${lint.output}`,
                },
              );
              call = await callChatCompletion(config, messages);
              doc = extractJsonDoc(call.text);
              lint = await runArrangementLint(doc, durationSec);
            }
            sendJson(res, 200, {
              ok: true,
              doc,
              lint,
              usage: call.usage,
              model: config.model,
              repaired,
            });
          } catch (error) {
            sendJson(res, 502, {
              ok: false,
              error:
                error instanceof Error ? error.message : "编排调用失败",
            });
          }
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

        if (url.pathname === "/api/effect-source" && req.method === "GET") {
          const componentId = url.searchParams.get("id") ?? "";
          if (!componentId) throw new Error("缺少效果 id");
          const escapedId = componentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const idPattern = new RegExp(
            `id\\s*:\\s*["']${escapedId}["']|\\[\\s*["']${escapedId}["']\\s*,`,
          );
          const candidates: string[] = [];
          const effectsDir = join(rootDir, "effects");
          try {
            for (const entry of await readdir(effectsDir)) {
              if (entry.endsWith(".tsx")) candidates.push(join(effectsDir, entry));
            }
          } catch {
            // effects 目录不存在时跳过
          }
          candidates.push(legacyEffectsPath);
          const sourceState = await readState();
          for (const item of sourceState.componentHistory ?? []) {
            if (item && typeof item.storedFile === "string") {
              candidates.push(join(componentStoreDir, basename(item.storedFile)));
            }
          }
          for (const filePath of candidates) {
            let code = "";
            try {
              code = await readFile(filePath, "utf8");
            } catch {
              continue;
            }
            if (idPattern.test(code)) {
              const bundledCode = await bundleEffectSource(
                code,
                dirname(filePath),
                componentId,
              );
              sendJson(res, 200, { ok: true, file: filePath, code: bundledCode });
              return;
            }
          }
          throw new Error("没有找到该效果的本地源码");
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

        if (
          url.pathname === "/api/open-component-location" &&
          req.method === "POST"
        ) {
          if (!existsSync(componentStoreDir)) {
            mkdirSync(componentStoreDir, { recursive: true });
          }
          runOpenFolder(componentStoreDir);
          sendJson(res, 200, { ok: true, path: "local-components" });
          return;
        }

        if (
          url.pathname === "/api/delete-component-history" &&
          req.method === "POST"
        ) {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { id?: string };
          const id = typeof body.id === "string" ? body.id : "";
          if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("导入文件标识无效");
          const state = await readState();
          const item = (state.componentHistory ?? []).find(
            (historyItem) => historyItem.id === id,
          );
          if (!item) throw new Error("没有找到该导入文件");
          try {
            await unlink(join(componentStoreDir, basename(item.storedFile)));
          } catch {
            // 历史文件已经不存在时，仍清理历史记录。
          }
          const isActive = state.activeComponentId === id;
          if (isActive) {
            await writeFile(
              activeComponentPath,
              "export const MOTION_COMPONENTS = [];\nexport const MOTION_TIMELINE = [];\n",
              "utf8",
            );
          }
          await saveState({
            componentHistory: (state.componentHistory ?? []).filter(
              (historyItem) => historyItem.id !== id,
            ),
            ...(isActive
              ? {
                  activeComponentId: "",
                  componentName: "",
                  sourceIncludesVideo: false,
                }
              : {}),
          });
          sendJson(res, 200, {
            ok: true,
            id,
            activeComponentId: isActive ? "" : state.activeComponentId,
            moduleUrl: isActive
              ? `/local-imported/active.tsx?t=${Date.now()}`
              : undefined,
          });
          return;
        }

        if (url.pathname === "/api/upload-media" && req.method === "POST") {
          const inputName = decodeURIComponent(
            String(req.headers["x-file-name"] ?? "media-file"),
          );
          const lower = extname(inputName).toLowerCase();
          const imageExt = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".avif", ".svg"];
          const videoExt = [".mp4", ".mov", ".webm", ".m4v", ".ogg"];
          const isImage = imageExt.includes(lower);
          const isVideo = videoExt.includes(lower);
          if (!isImage && !isVideo) {
            sendJson(res, 400, { ok: false, error: "仅支持图片或视频文件" });
            return;
          }
          const extension = isImage ? lower : videoExt.includes(lower) ? lower : ".mp4";
          const body = await getBody(req, 4 * 1024 * 1024 * 1024);
          const slug =
            basename(inputName, extname(inputName))
              .replace(/[^A-Za-z0-9\u4e00-\u9fff_-]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .slice(0, 48) || "media";
          const storedName = `${Date.now()}-${slug}${extension}`;
          const filePath = join(mediaTempDir, storedName);
          await writeFile(filePath, body);
          const mediaUrl = `/api/media/temp/${basename(filePath)}`;
          sendJson(res, 200, {
            ok: true,
            filename: basename(inputName),
            mediaUrl: `${mediaUrl}?t=${Date.now()}`,
            mediaType: isImage ? "image" : "video",
          });
          return;
        }

        if (url.pathname === "/api/import-icon" && req.method === "POST") {
          const filename = decodeURIComponent(
            String(req.headers["x-file-name"] ?? "custom-icon.svg"),
          );
          const category = decodeURIComponent(
            String(req.headers["x-icon-category"] ?? "内容与素材"),
          );
          const icon = await importManualIcon(
            filename,
            category,
            await getBody(req, 512 * 1024),
          );
          sendJson(res, 200, { ok: true, icon });
          return;
        }

        if (url.pathname === "/api/icon-groups" && req.method === "GET") {
          const manifest = JSON.parse(await readFile(resourceManifestPath, "utf8")) as { iconGroups?: unknown };
          sendJson(res, 200, { ok: true, groups: readCustomIconGroups(manifest).map((group) => ({ ...group, builtin: false })) });
          return;
        }

        if (url.pathname === "/api/icon-groups" && req.method === "POST") {
          const body = JSON.parse((await getBody(req, 64 * 1024)).toString("utf8")) as { name?: string };
          const name = typeof body.name === "string" ? body.name.trim().slice(0, 20) : "";
          if (!name) throw new Error("分组名称不能为空");
          const manifest = JSON.parse(await readFile(resourceManifestPath, "utf8")) as { resources: Array<Record<string, unknown>>; iconGroups?: unknown };
          const groups = readCustomIconGroups(manifest);
          if (ICON_CATEGORY_ACCENTS[name] || groups.some((group) => group.name === name)) throw new Error("分组名称已存在");
          const accents = ["#68e8ff", "#a776f7", "#f2b93d", "#20d7a0"];
          const group = { id: `custom-${Date.now()}`, name, accent: accents[groups.length % accents.length] };
          manifest.iconGroups = [...groups, group];
          await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
          sendJson(res, 200, { ok: true, group: { ...group, builtin: false } });
          return;
        }

        if (url.pathname === "/api/icon-groups" && req.method === "PATCH") {
          const id = url.searchParams.get("id") ?? "";
          if (!/^custom-[A-Za-z0-9_-]+$/.test(id)) throw new Error("内置分组不能修改");
          const body = JSON.parse((await getBody(req, 64 * 1024)).toString("utf8")) as { name?: string; accent?: string };
          const originalManifest = await readFile(resourceManifestPath, "utf8");
          const originalIndex = await readFile(resourceIndexPath, "utf8");
          const manifest = JSON.parse(originalManifest) as { resources: Array<Record<string, unknown>>; iconGroups?: unknown };
          const groups = readCustomIconGroups(manifest);
          const group = groups.find((item) => item.id === id);
          if (!group) throw new Error("找不到图标分组");
          const name = body.name === undefined
            ? group.name
            : typeof body.name === "string"
              ? body.name.trim().slice(0, 20)
              : "";
          if (!name) throw new Error("分组名称不能为空");
          const accent = body.accent === undefined
            ? group.accent
            : typeof body.accent === "string" && /^#[0-9a-f]{6}$/i.test(body.accent)
              ? body.accent.toLowerCase()
              : "";
          if (!accent) throw new Error("分组颜色无效");
          if (ICON_CATEGORY_ACCENTS[name] || groups.some((item) => item.id !== id && item.name === name)) {
            throw new Error("分组名称已存在");
          }
          const updatedGroup = { ...group, name, accent };
          manifest.iconGroups = groups.map((item) => (item.id === id ? updatedGroup : item));
          manifest.resources = manifest.resources.map((resource) => {
            if (resource.library !== "icons" || resource.category !== group.name) return resource;
            const tags = Array.isArray(resource.tags)
              ? resource.tags.map((tag) => (tag === group.name ? name : tag))
              : resource.tags;
            return { ...resource, category: name, accent, tags };
          });
          try {
            await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
            const { createResourceIndex } = await import("./ai-motion-arranger/scripts/build-resource-index.mjs");
            const index = await createResourceIndex();
            await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
          } catch (error) {
            await writeFile(resourceManifestPath, originalManifest);
            await writeFile(resourceIndexPath, originalIndex);
            throw error;
          }
          sendJson(res, 200, { ok: true, group: { ...updatedGroup, builtin: false } });
          return;
        }

        if (url.pathname === "/api/icon-groups" && req.method === "DELETE") {
          const id = url.searchParams.get("id") ?? "";
          if (!/^custom-[A-Za-z0-9_-]+$/.test(id)) throw new Error("内置分组不能删除");
          const manifest = JSON.parse(await readFile(resourceManifestPath, "utf8")) as { resources: Array<Record<string, unknown>>; iconGroups?: unknown };
          const groups = readCustomIconGroups(manifest);
          const group = groups.find((item) => item.id === id);
          if (!group) throw new Error("找不到图标分组");
          if (manifest.resources.some((resource) => resource.library === "icons" && resource.category === group.name)) {
            throw new Error("请先移除或删除该分组内的图标");
          }
          manifest.iconGroups = groups.filter((item) => item.id !== id);
          await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
          sendJson(res, 200, { ok: true, id });
          return;
        }

        if (url.pathname === "/api/sfx-groups" && req.method === "GET") {
          const manifest = JSON.parse(await readFile(resourceManifestPath, "utf8")) as { sfxGroups?: unknown };
          sendJson(res, 200, { ok: true, groups: readCustomSfxGroups(manifest).map((group) => ({ ...group, builtin: false })) });
          return;
        }

        if (url.pathname === "/api/sfx-groups" && req.method === "POST") {
          const body = JSON.parse((await getBody(req, 64 * 1024)).toString("utf8")) as { name?: string };
          const name = typeof body.name === "string" ? body.name.trim().slice(0, 20) : "";
          if (!name) throw new Error("分组名称不能为空");
          const manifest = JSON.parse(await readFile(resourceManifestPath, "utf8")) as { resources: Array<Record<string, unknown>>; sfxGroups?: unknown };
          const groups = readCustomSfxGroups(manifest);
          if (SFX_RESERVED_GROUP_NAMES.includes(name) || groups.some((group) => group.name === name)) throw new Error("分组名称已存在");
          const accents = ["#68e8ff", "#a776f7", "#f2b93d", "#20d7a0"];
          const group = { id: `custom-${Date.now()}`, name, accent: accents[groups.length % accents.length] };
          manifest.sfxGroups = [...groups, group];
          await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
          sendJson(res, 200, { ok: true, group: { ...group, builtin: false } });
          return;
        }

        if (url.pathname === "/api/sfx-groups" && req.method === "PATCH") {
          const id = url.searchParams.get("id") ?? "";
          if (!/^custom-[A-Za-z0-9_-]+$/.test(id)) throw new Error("内置分组不能修改");
          const body = JSON.parse((await getBody(req, 64 * 1024)).toString("utf8")) as { name?: string; accent?: string };
          const originalManifest = await readFile(resourceManifestPath, "utf8");
          const originalIndex = await readFile(resourceIndexPath, "utf8");
          const manifest = JSON.parse(originalManifest) as { resources: Array<Record<string, unknown>>; sfxGroups?: unknown };
          const groups = readCustomSfxGroups(manifest);
          const group = groups.find((item) => item.id === id);
          if (!group) throw new Error("找不到音效分组");
          const name = body.name === undefined
            ? group.name
            : typeof body.name === "string"
              ? body.name.trim().slice(0, 20)
              : "";
          if (!name) throw new Error("分组名称不能为空");
          const accent = body.accent === undefined
            ? group.accent
            : typeof body.accent === "string" && /^#[0-9a-f]{6}$/i.test(body.accent)
              ? body.accent.toLowerCase()
              : "";
          if (!accent) throw new Error("分组颜色无效");
          if (SFX_RESERVED_GROUP_NAMES.includes(name) || groups.some((item) => item.id !== id && item.name === name)) {
            throw new Error("分组名称已存在");
          }
          const updatedGroup = { ...group, name, accent };
          manifest.sfxGroups = groups.map((item) => (item.id === id ? updatedGroup : item));
          manifest.resources = manifest.resources.map((resource) => {
            if (resource.library !== "sfx" || resource.category !== group.name) return resource;
            const tags = Array.isArray(resource.tags)
              ? resource.tags.map((tag) => (tag === group.name ? name : tag))
              : resource.tags;
            return { ...resource, category: name, tags };
          });
          try {
            await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
            const { createResourceIndex } = await import("./ai-motion-arranger/scripts/build-resource-index.mjs");
            const index = await createResourceIndex();
            await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
          } catch (error) {
            await writeFile(resourceManifestPath, originalManifest);
            await writeFile(resourceIndexPath, originalIndex);
            throw error;
          }
          sendJson(res, 200, { ok: true, group: { ...updatedGroup, builtin: false } });
          return;
        }

        if (url.pathname === "/api/sfx-groups" && req.method === "DELETE") {
          const id = url.searchParams.get("id") ?? "";
          if (!/^custom-[A-Za-z0-9_-]+$/.test(id)) throw new Error("内置分组不能删除");
          const originalManifest = await readFile(resourceManifestPath, "utf8");
          const originalIndex = await readFile(resourceIndexPath, "utf8");
          const manifest = JSON.parse(originalManifest) as { resources: Array<Record<string, unknown>>; sfxGroups?: unknown };
          const groups = readCustomSfxGroups(manifest);
          const group = groups.find((item) => item.id === id);
          if (!group) throw new Error("找不到音效分组");
          manifest.sfxGroups = groups.filter((item) => item.id !== id);
          manifest.resources = manifest.resources.map((resource) => {
            if (resource.library !== "sfx" || resource.category !== group.name) return resource;
            if (resource.source === "manual") return { ...resource, category: "自定义音效" };
            const next = { ...resource };
            delete next.category;
            return next;
          });
          try {
            await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
            const { createResourceIndex } = await import("./ai-motion-arranger/scripts/build-resource-index.mjs");
            const index = await createResourceIndex();
            await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
          } catch (error) {
            await writeFile(resourceManifestPath, originalManifest);
            await writeFile(resourceIndexPath, originalIndex);
            throw error;
          }
          sendJson(res, 200, { ok: true, id });
          return;
        }

        if (url.pathname === "/api/open-icon-location" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { iconId?: string };
          const iconId = typeof body.iconId === "string" ? body.iconId : "";
          if (!/^[A-Za-z0-9_-]+$/.test(iconId)) {
            throw new Error("图标标识无效");
          }
          const manifest = JSON.parse(await readFile(resourceManifestPath, "utf8")) as {
            resources: Array<Record<string, unknown>>;
          };
          const resource = manifest.resources.find(
            (item) => item.library === "icons" && item.id === iconId,
          );
          const relativeFile = typeof resource?.file === "string" ? resource.file : "";
          if (!/^icons\/[A-Za-z0-9_-]+\.svg$/.test(relativeFile)) {
            throw new Error("找不到图标文件");
          }
          const target = resolve(resourceRoot, relativeFile);
          const iconRoot = `${resolve(iconResourceDir)}${process.platform === "win32" ? "\\" : "/"}`;
          if (!target.startsWith(iconRoot) || !existsSync(target)) {
            throw new Error("图标文件不存在");
          }
          runOpenFolder(target);
          sendJson(res, 200, { ok: true, iconId });
          return;
        }

        if (url.pathname === "/api/delete-manual-icon" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { iconId?: string };
          const iconId = typeof body.iconId === "string" ? body.iconId : "";
          await deleteManualIcon(iconId);
          sendJson(res, 200, { ok: true, iconId });
          return;
        }

        if (url.pathname === "/api/import-sfx" && req.method === "POST") {
          const filename = decodeURIComponent(
            String(req.headers["x-file-name"] ?? "custom-sound.wav"),
          );
          const sound = await importManualSfx(
            filename,
            await getBody(req, 25 * 1024 * 1024),
          );
          sendJson(res, 200, { ok: true, sound });
          return;
        }

        if (url.pathname === "/api/import-material" && req.method === "POST") {
          const filename = decodeURIComponent(
            String(req.headers["x-file-name"] ?? "custom-material.png"),
          );
          const category = decodeURIComponent(
            String(req.headers["x-material-category"] ?? "其他"),
          );
          const material = await importManualMaterial(
            filename,
            category,
            await getBody(req, 100 * 1024 * 1024),
          );
          sendJson(res, 200, { ok: true, material });
          return;
        }

        if (url.pathname === "/api/create-material-folder" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { name?: string };
          const name = typeof body.name === "string" ? body.name : "";
          const folder = createMaterialFolder(name);
          sendJson(res, 200, { ok: true, folder });
          return;
        }

        if (url.pathname === "/api/delete-manual-material" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { materialId?: string };
          const materialId = typeof body.materialId === "string" ? body.materialId : "";
          await deleteManualMaterial(materialId);
          sendJson(res, 200, { ok: true, materialId });
          return;
        }

        if (url.pathname === "/api/open-material-location" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { materialId?: string };
          const materialId = typeof body.materialId === "string" ? body.materialId : "";
          const target = await findMaterialFile(materialId);
          runOpenFolder(target);
          sendJson(res, 200, { ok: true, materialId });
          return;
        }

        if (url.pathname === "/api/open-sfx-location" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { soundId?: string };
          const soundId = typeof body.soundId === "string" ? body.soundId : "";
          const { target } = await findSfxFile(soundId);
          runOpenFolder(target);
          sendJson(res, 200, { ok: true, soundId });
          return;
        }

        if (url.pathname === "/api/delete-manual-sfx" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { soundId?: string };
          const soundId = typeof body.soundId === "string" ? body.soundId : "";
          await deleteManualSfx(soundId);
          sendJson(res, 200, { ok: true, soundId });
          return;
        }

        if (url.pathname === "/api/sfx-group-assign" && req.method === "POST") {
          const body = JSON.parse(
            (await getBody(req, 64 * 1024)).toString("utf8"),
          ) as { soundId?: string; groupName?: string };
          const soundId = typeof body.soundId === "string" ? body.soundId : "";
          const groupName = typeof body.groupName === "string" ? body.groupName.trim() : "";
          const originalManifest = await readFile(resourceManifestPath, "utf8");
          const originalIndex = await readFile(resourceIndexPath, "utf8");
          const manifest = JSON.parse(originalManifest) as {
            resources: Array<Record<string, unknown>>;
            sfxGroups?: unknown;
          };
          const resource = manifest.resources.find(
            (item) => item.library === "sfx" && item.id === soundId,
          );
          if (!resource) throw new Error("找不到音效");
          if (groupName) {
            if (SFX_RESERVED_GROUP_NAMES.includes(groupName)) {
              throw new Error("不能移入内置分组");
            }
            if (!readCustomSfxGroups(manifest).some((group) => group.name === groupName)) {
              throw new Error("找不到音效分组");
            }
          }
          manifest.resources = manifest.resources.map((item) => {
            if (item !== resource) return item;
            if (groupName) return { ...item, category: groupName };
            if (item.source === "manual") return { ...item, category: "自定义音效" };
            const next = { ...item };
            delete next.category;
            return next;
          });
          try {
            await writeFile(resourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
            const { createResourceIndex } = await import(
              "./ai-motion-arranger/scripts/build-resource-index.mjs"
            );
            const index = await createResourceIndex();
            await writeFile(resourceIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
          } catch (error) {
            await writeFile(resourceManifestPath, originalManifest);
            await writeFile(resourceIndexPath, originalIndex);
            throw error;
          }
          sendJson(res, 200, { ok: true, soundId, groupName });
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
          if (
            !name ||
            name === "." ||
            name === ".." ||
            name !== basename(name) ||
            /[\\/]/.test(name)
          ) {
            sendJson(res, 400, { ok: false, error: "媒体文件名无效" });
            return;
          }
          const targetDir = url.pathname.startsWith("/api/media/temp/")
            ? mediaTempDir
            : mediaDir;
          const target = join(targetDir, name);
          if (req.method === "DELETE") {
            const alreadyDeleted = !existsSync(target);
            if (!alreadyDeleted) await unlink(target);
            const state = await readState();
            if (
              state.videoUrl &&
              decodeURIComponent(basename(state.videoUrl.split("?")[0])) === name
            ) {
              await saveState({
                videoName: "尚未导入视频",
                videoUrl: "",
                videoDuration: 0,
              });
            }
            sendJson(res, 200, { ok: true, filename: name, alreadyDeleted });
            return;
          }
          serveFile(req, res, target);
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
          const resolveLocalAssetUrl = (value: unknown) => {
            if (typeof value !== "string" || !value.trim()) return value;
            if (value.startsWith("/")) {
              return `http://127.0.0.1:41735${value}`;
            }
            // 旧版本曾把本地资源保存为 Remotion 默认的 3001 地址；
            // 导出浏览器无法访问该端口，统一迁移到工作台 API 服务。
            return value
              .replace(/^http:\/\/localhost:3001(?=\/)/i, "http://127.0.0.1:41735")
              .replace(/^http:\/\/127\.0\.0\.1:3001(?=\/)/i, "http://127.0.0.1:41735");
          };
          const resolvedInputProps = {
            ...inputProps,
            videoSrc: resolveLocalAssetUrl(inputProps.videoSrc),
            videoTracks: Array.isArray(inputProps.videoTracks)
              ? inputProps.videoTracks.map((track) => {
                  if (!track || typeof track !== "object") return track;
                  const record = track as Record<string, unknown>;
                  return {
                    ...record,
                    url: resolveLocalAssetUrl(record.url),
                  };
                })
              : [],
            resourceTracks: Array.isArray(inputProps.resourceTracks)
              ? inputProps.resourceTracks.map((track) => {
                  if (!track || typeof track !== "object") return track;
                  const record = track as Record<string, unknown>;
                  return {
                    ...record,
                    url: resolveLocalAssetUrl(record.url),
                  };
                })
              : [],
            instances: Array.isArray(inputProps.instances)
              ? inputProps.instances.map((instance) => {
                  if (!instance || typeof instance !== "object") return instance;
                  const record = instance as Record<string, unknown>;
                  const props =
                    record.props && typeof record.props === "object"
                      ? (record.props as Record<string, unknown>)
                      : null;
                  return props
                    ? {
                        ...record,
                        props: {
                          ...props,
                          customLogoUrl: resolveLocalAssetUrl(props.customLogoUrl),
                        },
                      }
                    : record;
                })
              : [],
          };
          renderJobSequence += 1;
          const jobId = `render-${Date.now()}-${renderJobSequence}`;
          // 区域出入点导出：校验后转换为 Remotion frameRange
          const regionStartRaw = Number(inputProps.regionStartFrame);
          const regionEndRaw = Number(inputProps.regionEndFrame);
          const regionFrameRange: [number, number] | undefined =
            Number.isFinite(regionStartRaw) &&
            Number.isFinite(regionEndRaw) &&
            regionEndRaw > regionStartRaw
              ? [Math.max(0, Math.round(regionStartRaw)), Math.round(regionEndRaw)]
              : undefined;
          const regionTotalFrames = regionFrameRange
            ? regionFrameRange[1] - regionFrameRange[0] + 1
            : null;
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
              regionTotalFrames ||
                Number(inputProps.timelineDurationInFrames) ||
                1,
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
                totalFrames: regionTotalFrames || composition.durationInFrames,
              });

              const renderTotalFrames =
                regionTotalFrames || composition.durationInFrames;

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
                  ...(regionFrameRange ? { frameRange: regionFrameRange } : {}),
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
                          (framesRendered / renderTotalFrames) * 0.66,
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
                        0.74 + (frame / renderTotalFrames) * 0.18,
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
                ...(regionFrameRange ? { frameRange: regionFrameRange } : {}),
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
                renderedFrames: renderTotalFrames,
                encodedFrames: renderTotalFrames,
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
                  durationInFrames: renderTotalFrames,
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
  };
};

export default defineConfig({
  plugins: [react(), candidateThumbsPlugin(), localApi()],
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
