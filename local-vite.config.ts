import react from "@vitejs/plugin-react";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
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
  instances: unknown[];
  currentFrame?: number;
  theme?: "dark" | "light";
  timelineHeight?: number;
  canvasOrientation?: "landscape" | "portrait";
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
          const name = basename(url.pathname);
          serveFile(req, res, join(mediaDir, name));
          return;
        }

        if (url.pathname.startsWith("/api/renders/")) {
          const name = basename(url.pathname);
          serveFile(req, res, join(renderDir, name));
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
                stage: "正在读取视频与组件",
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

              const fileName = `动效导出-${new Date()
                .toISOString()
                .replace(/[:.]/g, "-")}.mp4`;
              const outputLocation = join(renderDir, fileName);
              updateRenderJob(job, {
                status: "rendering",
                stage: "正在渲染画面",
              });
              await renderMedia({
                composition,
                serveUrl: bundled,
                codec: "h264",
                audioCodec: "aac",
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
                  downloadUrl: `/api/renders/${encodeURIComponent(fileName)}`,
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
