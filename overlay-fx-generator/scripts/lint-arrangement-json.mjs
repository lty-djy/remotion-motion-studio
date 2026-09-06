// 编排 JSON 体检器：overlay-fx-generator 交付前的机械自检。
// 用法：
//   npm.cmd run lint:arrangement -- <编排.json> [--duration 视频秒数] [--fps 30] [--canvas portrait|landscape]
// 退出码：0 = 通过（可能带 warning）；1 = 存在 error，必须修正后重跑。
// 阈值：lint-rules.default.json（公共）+ lint-rules.local.json（个人，同名覆盖）。
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadRuntimeRegistry } from "../../ai-motion-arranger/scripts/load-runtime-registry.mjs";

const root = resolve(import.meta.dirname, "..", "..");
const DEFAULT_RULES_PATH = resolve(import.meta.dirname, "..", "lint-rules.default.json");
const LOCAL_RULES_PATH = resolve(import.meta.dirname, "..", "lint-rules.local.json");
const RESOURCE_INDEX_PATH = resolve(root, "public", "input", "resource-index.json");
const CAPTION_INTENT_ID = "srt-caption-track";

const parseArgs = (argv) => {
  const options = { file: null, durationSec: null, fps: null, canvas: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--duration") options.durationSec = Number(argv[(index += 1)]);
    else if (arg === "--fps") options.fps = Number(argv[(index += 1)]);
    else if (arg === "--canvas") options.canvas = argv[(index += 1)];
    else if (!options.file) options.file = arg;
  }
  if (!options.file) {
    console.error("用法：node lint-arrangement-json.mjs <编排.json> [--duration 秒] [--fps 30] [--canvas portrait|landscape]");
    process.exit(2);
  }
  return options;
};

const loadRules = async () => {
  const merged = {};
  for (const path of [DEFAULT_RULES_PATH, LOCAL_RULES_PATH]) {
    try {
      Object.assign(merged, JSON.parse(await readFile(path, "utf8")));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return merged;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const rules = await loadRules();
  const findings = [];
  const push = (severity, rule, message) =>
    findings.push({ severity, rule, message });

  const registry = await loadRuntimeRegistry();
  const definitions = new Map(registry.map((definition) => [definition.id, definition]));

  let doc;
  try {
    doc = JSON.parse(await readFile(options.file, "utf8"));
  } catch {
    push("error", "invalid-json", "JSON 无法解析。");
    findings.forEach(report);
    process.exit(1);
  }
  if (typeof doc !== "object" || doc === null || Array.isArray(doc)) {
    push("error", "invalid-json", "编排 JSON 顶层必须是对象。");
    findings.forEach(report);
    process.exit(1);
  }

  const rawItems =
    asArray(doc.motionTimeline).length > 0
      ? asArray(doc.motionTimeline)
      : asArray(doc.timeline).length > 0
        ? asArray(doc.timeline)
        : asArray(doc.MOTION_TIMELINE).length > 0
          ? asArray(doc.MOTION_TIMELINE)
          : asArray(doc.instances);
  const rawResources = asArray(doc.resourceTracks);
  if (rawItems.length === 0 && rawResources.length === 0) {
    push("error", "empty-arrangement", "编排需包含 motionTimeline/timeline/instances 或 resourceTracks 数组。");
  }

  const fps = Number.isFinite(options.fps) && options.fps > 0 ? options.fps : Number(doc.fps) > 0 ? Number(doc.fps) : 30;
  const canvasOrientation =
    options.canvas ??
    (typeof doc.canvas?.orientation === "string" ? doc.canvas.orientation : null);
  const durationFrames = Number.isFinite(options.durationSec) && options.durationSec > 0
    ? Math.round(options.durationSec * fps)
    : Number(doc.durationInFrames) > 0
      ? Math.round(Number(doc.durationInFrames))
      : null;

  const isCaption = (item) => {
    const semantic = definitions.get(item.componentId)?.semantic;
    return semantic?.systemRole === "caption-track" || item.sourceIntentId === CAPTION_INTENT_ID;
  };
  const isAnchored = (item) =>
    item.componentId === "ChapterBar" || item.componentId === "FocusCamMove";

  const contentItems = [];
  const captionItems = [];
  for (let index = 0; index < rawItems.length; index += 1) {
    const item = rawItems[index];
    if (typeof item !== "object" || item === null) {
      push("error", "invalid-item", `第 ${index + 1} 项必须是对象。`);
      continue;
    }
    const componentId = typeof item.componentId === "string" ? item.componentId.trim() : "";
    const definition = definitions.get(componentId);
    if (!definition) {
      push("error", "unknown-component", `第 ${index + 1} 项的 componentId "${componentId || "未填写"}" 不在当前效果库中。`);
      continue;
    }
    const startFrame = Number.isFinite(Number(item.startFrame)) ? Math.round(Number(item.startFrame)) : 0;
    const durationInFrames = item.durationInFrames === undefined || item.durationInFrames === null
      ? Math.round(Number(definition.durationInFrames) || 120)
      : Math.round(Number(item.durationInFrames));
    const normalized = { index: index + 1, componentId, startFrame, durationInFrames, raw: item };
    if (Number.isNaN(startFrame) || startFrame < 0) {
      push("error", "bad-frames", `第 ${normalized.index} 项（${componentId}）startFrame 必须是非负数字。`);
    }
    if (!Number.isFinite(durationInFrames) || durationInFrames <= 0) {
      push("error", "bad-frames", `第 ${normalized.index} 项（${componentId}）durationInFrames 必须大于 0。`);
    }
    if (durationFrames !== null && startFrame + durationInFrames > durationFrames) {
      push("error", "over-duration", `第 ${normalized.index} 项（${componentId}）在 ${(startFrame + durationInFrames) / fps}s 结束，超出视频长度 ${durationFrames / fps}s。`);
    }
    const props = typeof item.props === "object" && item.props !== null ? item.props : {};
    const schema = definition.propsSchema ?? {};
    for (const key of Object.keys(props)) {
      if (!(key in schema)) {
        push("error", "unknown-prop", `第 ${normalized.index} 项（${componentId}）的 props 字段 "${key}" 不在该组件目录中。`);
      }
    }
    for (const [key, field] of Object.entries(schema)) {
      if (
        (field?.type === "text" || field?.type === "textarea") &&
        typeof props[key] === "string" &&
        props[key].length >= 3 &&
        typeof definition.defaultProps?.[key] === "string" &&
        props[key] === definition.defaultProps[key]
      ) {
        push("warning", "placeholder-text", `第 ${normalized.index} 项（${componentId}）的 "${key}" 还是组件演示文案，必须换成这支视频的内容。`);
      }
    }
    const semantic = definition.semantic ?? {};
    if (semantic.systemRole === "caption-track" || item.sourceIntentId === CAPTION_INTENT_ID) {
      captionItems.push(normalized);
      const cuesRaw = props.cuesJson;
      let cues = cuesRaw;
      if (typeof cuesRaw === "string") {
        try {
          cues = JSON.parse(cuesRaw);
        } catch {
          push("error", "bad-caption-cues", `第 ${normalized.index} 项（字幕轨）cuesJson 不是合法 JSON。`);
          cues = null;
        }
      }
      if (Array.isArray(cues)) {
        for (const cue of cues) {
          if (typeof cue !== "object" || cue === null) continue;
          const start = Number(cue.start);
          const end = Number(cue.end);
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
            push("error", "bad-caption-cues", `第 ${normalized.index} 项（字幕轨）存在 start/end 无效的 cue（index=${cue.index ?? "?"}）。`);
          } else if (durationFrames !== null && Math.round(end * fps) > durationFrames) {
            push("error", "over-duration", `第 ${normalized.index} 项（字幕轨）cue（index=${cue.index ?? "?"}）结束时间超出视频长度。`);
          }
        }
      } else if (cues !== null && cues !== undefined) {
        push("error", "bad-caption-cues", `第 ${normalized.index} 项（字幕轨）cuesJson 必须是字幕数组。`);
      }
      continue;
    }
    if (isAnchored(item)) {
      // 锚定组件（章节条/运镜）全程在场，不参与密度与多样性统计。
      continue;
    }
    contentItems.push(normalized);
    const orientation = semantic.orientation;
    if (canvasOrientation === "landscape" && orientation === "portrait") {
      push("warning", "orientation-mismatch", `第 ${normalized.index} 项（${componentId}）是竖屏组件，当前画布是横屏。`);
    }
    if (canvasOrientation === "portrait" && orientation === "landscape") {
      push("warning", "orientation-mismatch", `第 ${normalized.index} 项（${componentId}）是横屏组件，当前画布是竖屏。`);
    }
    const dwellSec = durationInFrames / fps;
    const minDwell = Number(semantic.durationSeconds?.min ?? rules.minDwellSec ?? 1.5);
    if (dwellSec < minDwell) {
      push("warning", "short-dwell", `第 ${normalized.index} 项（${componentId}）只驻留 ${Math.round(dwellSec * 10) / 10}s，低于该组件建议下限 ${minDwell}s。`);
    }
  }

  if (rawResources.length > 0) {
    let index = null;
    try {
      index = JSON.parse(await readFile(RESOURCE_INDEX_PATH, "utf8"));
    } catch {
      push("warning", "resource-index", "无法读取 public/input/resource-index.json，跳过资源存在性检查。");
    }
    rawResources.forEach((track, position) => {
      if (typeof track !== "object" || track === null) {
        push("error", "invalid-item", `资源轨道第 ${position + 1} 项必须是对象。`);
        return;
      }
      const kind = String(track.kind ?? "");
      if (!["icon", "material", "sfx"].includes(kind)) {
        push("error", "unknown-resource", `资源轨道第 ${position + 1} 项类型 "${kind || "缺失"}" 不受支持（icon/material/sfx）。`);
        return;
      }
      if (!index) return;
      const library = kind === "icon" ? "icons" : kind === "material" ? "materials" : kind;
      const entries = asArray(index.libraries?.[library]);
      const resourceId = String(track.resourceId ?? "");
      if (!entries.some((entry) => String(entry?.id ?? "") === resourceId)) {
        push("error", "unknown-resource", `资源轨道第 ${position + 1} 项引用的 ${library}:${resourceId} 不在资源索引中。`);
      }
    });
  }

  // ---- 编辑质量规则（内容组件） ----
  const sorted = [...contentItems].sort((a, b) => a.startFrame - b.startFrame);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].componentId === sorted[i - 1].componentId) {
      push("warning", "adjacent-same", `相邻两张内容卡同为 ${sorted[i].componentId}（第 ${sorted[i - 1].index}、${sorted[i].index} 项），必须换组件或隔开。`);
    }
  }
  const counts = new Map();
  for (const item of sorted) {
    counts.set(item.componentId, (counts.get(item.componentId) ?? 0) + 1);
  }
  for (const [componentId, count] of counts) {
    if (count > (rules.maxSameComponentPerVideo ?? 4)) {
      push("warning", "kind-overuse", `${componentId} 全片用了 ${count} 次（上限 ${rules.maxSameComponentPerVideo ?? 4}），重复度过高。`);
    }
  }
  if (sorted.length > 0) {
    const distinct = counts.size;
    if (distinct < (rules.minDistinctComponents ?? 6)) {
      push("warning", "low-diversity", `全片只用了 ${distinct} 种内容组件（下限 ${rules.minDistinctComponents ?? 6}），组件调用面太窄。`);
    }
    const perWindow = rules.minDistinctComponentsPer60s ?? 3;
    if (durationFrames !== null) {
      const totalSec = durationFrames / fps;
      for (let start = 0; start < totalSec; start += 60) {
        const windowItems = sorted.filter(
          (item) =>
            item.startFrame >= start * fps &&
            item.startFrame < Math.min(start + 60, totalSec) * fps,
        );
        if (windowItems.length >= 3) {
          const windowDistinct = new Set(windowItems.map((item) => item.componentId)).size;
          if (windowDistinct < perWindow) {
            push("warning", "low-diversity", `${start}s–${Math.min(start + 60, totalSec)}s 窗口内只用了 ${windowDistinct} 种组件（下限 ${perWindow}）。`);
          }
        }
      }
    }
  }
  if (durationFrames !== null && sorted.length > 0) {
    const totalSec = durationFrames / fps;
    const perMinute = (sorted.length / totalSec) * 60;
    if (perMinute < (rules.minPerMinute ?? 4)) {
      push("warning", "density", `全片每分钟只有 ${Math.round(perMinute * 10) / 10} 张内容卡（下限 ${rules.minPerMinute ?? 4}），画面偏空。`);
    }
    if (perMinute > (rules.maxPerMinute ?? 16)) {
      push("warning", "density", `全片每分钟高达 ${Math.round(perMinute * 10) / 10} 张内容卡（上限 ${rules.maxPerMinute ?? 16}），注意喘息。`);
    }
    const actionStarts = [
      0,
      ...sorted.map((item) => item.startFrame / fps),
      ...rawResources
        .filter((track) => typeof track === "object" && track !== null)
        .map((track) => Number(track.startFrame ?? 0) / fps)
        .filter((value) => Number.isFinite(value)),
    ].sort((a, b) => a - b);
    for (let i = 1; i < actionStarts.length; i += 1) {
      const gap = actionStarts[i] - actionStarts[i - 1];
      if (gap > (rules.maxQuietGapSec ?? 10)) {
        push("warning", "quiet-gap", `${Math.round(actionStarts[i - 1])}s–${Math.round(actionStarts[i])}s 有 ${Math.round(gap)}s 没有任何新动作。`);
      }
    }
    const events = sorted
      .flatMap((item) => [
        { time: item.startFrame, delta: 1, index: item.index },
        { time: item.startFrame + item.durationInFrames, delta: -1, index: item.index },
      ])
      .sort((a, b) => a.time - b.time || a.delta - b.delta);
    let active = 0;
    for (const event of events) {
      active += event.delta;
      if (active > (rules.maxConcurrentContent ?? 4)) {
        push("warning", "crowded-screen", `第 ${event.index} 项进场时同屏内容卡已达 ${active} 张（上限 ${rules.maxConcurrentContent ?? 4}）。`);
        break;
      }
    }
  }

  const errors = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warning");
  const report = (finding) =>
    console.log(`${finding.severity === "error" ? "ERROR" : "WARN "} [${finding.rule}] ${finding.message}`);
  findings.forEach(report);
  console.log(
    `\n体检完成：${rawItems.length} 个动效项 / ${rawResources.length} 个资源项，error=${errors.length}，warning=${warnings.length}。`,
  );
  if (durationFrames !== null) {
    console.log(`视频时长按 ${durationFrames / fps}s（${durationFrames} 帧 @${fps}fps）核算。`);
  }
  if (warnings.length > 0) {
    console.log("warning 不阻塞交付，但请逐条自查是否成立。");
  }
  process.exit(errors.length > 0 ? 1 : 0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
