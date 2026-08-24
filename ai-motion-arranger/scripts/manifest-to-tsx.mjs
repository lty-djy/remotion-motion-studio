#!/usr/bin/env node
// manifest-to-tsx.mjs
// 把 ai-motion-arranger Skill 输出的 manifest JSON 编译为自包含的 Remotion TSX。
//
// 用法：node scripts/manifest-to-tsx.mjs <manifest.json> > package.tsx
//
// 它是确定性的、零 AI 的：AI 输出 manifest，本脚本生成 TSX；TSX 内联所有
// 组件源码（ChapterBar + LegacyMetricEffect + useRafProgress），不 import 本地路径，
// 因此能直接走工作台的安全导入校验。
// 工作台任何 effects/*.tsx 改了源 → 重跑本脚本即可，无需手动同步。

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const effectsDir = join(root, "effects");

const metaPath = join(here, "registry-meta.mjs");
const { REGISTERED_CARDS } = await import(pathToFileURL(metaPath).href);

// 引用 palette.md §2/§3，这里用作硬枚举确保 lint。
const ALLOWED_ACCENT_TOKENS = new Set([
  "cyan",
  "violet",
  "amber",
  "lime",
  "rose",
  "teal",
  "gold",
  "neutral",
]);
const ALLOWED_SUPPORT_TOKENS = new Set([
  "support-neutral",
  "success",
  "warning",
  "danger",
  "info",
  ...ALLOWED_ACCENT_TOKENS,
]);

const ALLOWED_ANCHORS = new Set([
  "left-bottom",
  "right-bottom",
  "left-top",
  "right-top",
  "top-rail",
  "bottom-rail",
  "center-stage",
]);
const ALLOWED_DENSITY = new Set(["sparse", "balanced", "rich"]);
const ALLOWED_RHYTHM = new Set(["single", "staggered", "cascade"]);

// ---------- 设计令牌（references/design-tokens.md）----------
// theme 管基调、skin 管配色（accent+support 预设包）、style 管骨架、font 管字体栈。
// 全部是顶层字符串枚举；编译期解析为 CSS 变量并注入生成的 TSX。
const ALLOWED_THEMES = new Set(["dark", "light"]);
const ALLOWED_SKINS = new Set([
  "tech-cyan",
  "brand-amber",
  "growth-lime",
  "creative-violet",
  "soft-teaching-violet",
  "alert-rose",
  "pro-neutral",
]);
const SKIN_PRESETS = {
  "tech-cyan": { accent: "cyan", support: "info" },
  "brand-amber": { accent: "amber", support: "warning" },
  "growth-lime": { accent: "lime", support: "success" },
  "creative-violet": { accent: "violet", support: "info" },
  "soft-teaching-violet": { accent: "violet", support: "support-neutral" },
  "alert-rose": { accent: "rose", support: "danger" },
  "pro-neutral": { accent: "neutral", support: "support-neutral" },
};
const ALLOWED_STYLES = new Set(["glass", "flat", "outline", "tile", "teaching-overlay"]);
const STYLE_PRESETS = {
  glass: { radius: 18, border: "1px solid rgba(255,255,255,0.14)", shadow: "0 10px 30px rgba(0,0,0,0.35)", blur: 8 },
  flat: { radius: 8, border: "none", shadow: "none", blur: 0 },
  outline: { radius: 12, border: "2px solid var(--arranger-accent)", shadow: "none", blur: 0 },
  tile: { radius: 14, border: "none", shadow: "0 6px 18px rgba(0,0,0,0.28)", blur: 0 },
  "teaching-overlay": { radius: 26, border: "1px solid rgba(224,218,255,0.30)", shadow: "0 14px 34px rgba(11,8,22,0.22)", blur: 12 },
};
const ALLOWED_FONTS = new Set(["sans", "serif", "mono-tech"]);
const FONT_STACKS = {
  sans:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
  serif: 'Georgia, "Songti SC", "SimSun", serif',
  "mono-tech": '"JetBrains Mono", Menlo, Consolas, monospace',
};
const TOKEN_HEX = {
  cyan: "#22d3ee",
  violet: "#a78bfa",
  amber: "#fca311",
  lime: "#a3e635",
  rose: "#fb7185",
  teal: "#2dd4bf",
  gold: "#f5c542",
  neutral: "#d7d7d7",
  "support-neutral": "#8b8f98",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#60a5fa",
};

class CompileError extends Error {}

// ---------- 校验 ----------

function checkManifest(manifest) {
  if (!manifest || typeof manifest !== "object") {
    throw new CompileError("manifest 必须是 JSON 对象");
  }
  if (manifest.manifestVersion !== "1.0") {
    throw new CompileError(
      `manifestVersion 必须是 "1.0"，当前是：${manifest.manifestVersion}`,
    );
  }
  for (const [field, allowed, hint] of [
    ["theme", ALLOWED_THEMES, "dark | light"],
    ["skin", ALLOWED_SKINS, "见 references/design-tokens.md §3"],
    ["style", ALLOWED_STYLES, "glass | flat | outline | tile | teaching-overlay"],
    ["font", ALLOWED_FONTS, "sans | serif | mono-tech"],
  ]) {
    if (manifest[field] === undefined) continue;
    if (typeof manifest[field] !== "string" || !allowed.has(manifest[field])) {
      throw new CompileError(
        `顶层设计令牌 ${field} "${manifest[field]}" 非法（允许：${hint}）`,
      );
    }
  }
  if (!Array.isArray(manifest.boards)) {
    throw new CompileError("boards 必须是数组");
  }
  const fps = Number.isInteger(manifest.fps) ? manifest.fps : 30;
  const videoDurationSec = Number(manifest.videoDurationSec);
  if (!Number.isFinite(videoDurationSec) || videoDurationSec <= 0) {
    throw new CompileError("videoDurationSec 必须是正数");
  }
  const totalFrames = Math.ceil(videoDurationSec * fps);
  const cardsById = new Map(REGISTERED_CARDS.map((c) => [c.id, c]));

  let mainPaletteSet = new Set();
  let prevAccent = null;
  for (let i = 0; i < manifest.boards.length; i++) {
    const board = manifest.boards[i];
    if (!board || typeof board !== "object") {
      throw new CompileError(`boards[${i}] 不是对象`);
    }
    if (!/^board-\d{3,}$/.test(board.id ?? "")) {
      throw new CompileError(
        `boards[${i}].id 必须形如 "board-001"，当前：${board.id}`,
      );
    }
    if (!Array.isArray(board.cards)) {
      throw new CompileError(`boards[${i}].cards 必须是数组`);
    }
    const startFrame = Number(board.startFrame);
    const durationInFrames = Number(board.durationInFrames);
    const endFrame = Number(board.endFrame);
    if (
      !Number.isInteger(startFrame) ||
      !Number.isInteger(durationInFrames) ||
      !Number.isInteger(endFrame)
    ) {
      throw new CompileError(
        `boards[${i}] 缺少数值字段或不是整数（startFrame/endFrame/durationInFrames）`,
      );
    }
    if (startFrame < 0) {
      throw new CompileError(`boards[${i}].startFrame 不能小于 0`);
    }
    if (durationInFrames < 3) {
      throw new CompileError(`boards[${i}].durationInFrames 不能小于 3`);
    }
    if (Math.abs(startFrame + durationInFrames - endFrame) > 1) {
      throw new CompileError(
        `boards[${i}] 的 startFrame + durationInFrames 必须等于 endFrame`,
      );
    }
    if (endFrame > totalFrames) {
      throw new CompileError(
        `boards[${i}] 结束帧 ${endFrame} 超过视频总帧数 ${totalFrames}`,
      );
    }

    const cfg = board.board;
    if (!cfg || typeof cfg !== "object") {
      throw new CompileError(`boards[${i}].board 必须是对象`);
    }
    if (!ALLOWED_ANCHORS.has(cfg.anchor)) {
      throw new CompileError(
        `boards[${i}].board.anchor 非法：${cfg.anchor}`,
      );
    }
    if (!ALLOWED_DENSITY.has(cfg.density)) {
      throw new CompileError(
        `boards[${i}].board.density 非法：${cfg.density}`,
      );
    }
    if (!ALLOWED_RHYTHM.has(cfg.rhythm)) {
      throw new CompileError(
        `boards[${i}].board.rhythm 非法：${cfg.rhythm}`,
      );
    }
    const palette = cfg.palette;
    if (!palette || typeof palette !== "object") {
      throw new CompileError(`boards[${i}].board.palette 必须是对象`);
    }
    if (!ALLOWED_ACCENT_TOKENS.has(palette.accent)) {
      throw new CompileError(
        `boards[${i}].board.palette.accent 非法 token：${palette.accent}`,
      );
    }
    if (
      palette.support &&
      !ALLOWED_SUPPORT_TOKENS.has(palette.support)
    ) {
      throw new CompileError(
        `boards[${i}].board.palette.support 非法 token：${palette.support}`,
      );
    }
    if (prevAccent === palette.accent) {
      throw new CompileError(
        `boards[${i}] 主调 ${palette.accent} 与前一段相同，违反"相邻 Board 主调不同"硬规则`,
      );
    }
    prevAccent = palette.accent;
    mainPaletteSet.add(palette.accent);

    const bg = Number(cfg.backgroundOpacity);
    if (!Number.isFinite(bg) || bg < 0 || bg > 1) {
      throw new CompileError(
        `boards[${i}].board.backgroundOpacity 必须 ∈ [0, 1]，当前：${cfg.backgroundOpacity}`,
      );
    }

    const maxCards = { sparse: 1, balanced: 3, rich: 5 }[cfg.density];
    if (board.cards.length > maxCards) {
      throw new CompileError(
        `boards[${i}] density="${cfg.density}" 至多 ${maxCards} 张卡，实际 ${board.cards.length} 张`,
      );
    }
    if (cfg.density === "sparse" && board.cards.length === 0) {
      throw new CompileError(`boards[${i}] density="sparse" 至少 1 张卡`);
    }

    for (let j = 0; j < board.cards.length; j++) {
      const card = board.cards[j];
      if (!card || typeof card !== "object") {
        throw new CompileError(`boards[${i}].cards[${j}] 不是对象`);
      }
      if (!cardsById.has(card.id)) {
        throw new CompileError(
          `boards[${i}].cards[${j}].id "${card.id}" 不在 registry 中`,
        );
      }
      const registered = cardsById.get(card.id);
      const props = card.props ?? {};
      const allowedKeys = new Set(Object.keys(registered.propsSchema));
      for (const key of Object.keys(props)) {
        if (!allowedKeys.has(key)) {
          throw new CompileError(
            `boards[${i}].cards[${j}] props.${key} 不在 catalog 字段列表中（id=${card.id}）`,
          );
        }
      }
      for (const [fieldName, fieldDef] of Object.entries(
        registered.propsSchema,
      )) {
        if (fieldDef.type !== "color") continue;
        if (!(fieldName in props)) continue;
        const v = props[fieldName];
        if (
          !ALLOWED_ACCENT_TOKENS.has(v) &&
          !ALLOWED_SUPPORT_TOKENS.has(v)
        ) {
          throw new CompileError(
            `boards[${i}].cards[${j}].props.${fieldName} 颜色 token "${v}" 非法`,
          );
        }
      }
    }
  }

  if (mainPaletteSet.size < 2 || mainPaletteSet.size > 4) {
    throw new CompileError(
      `视频级调色板去重数必须 ∈ [2, 4]，当前：${mainPaletteSet.size}（tokens: ${[...mainPaletteSet].join(", ")})`,
    );
  }
  return { fps, videoDurationSec, totalFrames };
}

// ---------- 源码内联 ----------

// 整段删除 `export interface X { ... }`，因为其字段会跟同名 const 在 IIFE 顶层冲突。
function stripExportNamedTypeBlocks(src, kind) {
  const regex = new RegExp(`\\bexport\\s+${kind}\\s+(\\w+)\\s*=\\s*`, "g");
  let out = "";
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(src)) !== null) {
    out += src.slice(lastIndex, match.index);
    let i = regex.lastIndex;
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] === "{") {
      let depth = 1;
      i++;
      while (i < src.length && depth > 0) {
        const c = src[i];
        if (c === "{") depth++;
        else if (c === "}") depth--;
        else if (c === "`") {
          i++;
          while (i < src.length && src[i] !== "`") {
            if (src[i] === "\\") i++;
            i++;
          }
        } else if (c === '"' || c === "'") {
          i++;
          while (i < src.length && src[i] !== c) {
            if (src[i] === "\\") i++;
            i++;
          }
        }
        i++;
      }
      while (i < src.length && /[;\s]/.test(src[i])) i++;
    } else {
      while (i < src.length && src[i] !== ";") i++;
      if (src[i] === ";") i++;
    }
    lastIndex = i;
    regex.lastIndex = i;
  }
  out += src.slice(lastIndex);
  return out;
}

// 一步完成：
//   - 删除 `import ...` 行
//   - `export default X;` 整行删除
//   - `export type X = { ... }` 去掉 export 前缀（保留 type 给 IIFE 内部用）
//   - `export interface X { ... }` 整段删除
//   - `export const/let/var/function/class X` 去掉 export 前缀
//   - 删除 registry 的 `export const XEffectDef = {...}` 行
//   - 删除 `export { X }` 形式
function normalizeForInline(src) {
  let s = src;
  s = s
    .split("\n")
    .filter(
      (line) =>
        !/^\s*import\s+/.test(line) &&
        !/^\s*import\s+type\s+/.test(line) &&
        !/^\s*export\s+default\s+/.test(line),
    )
    .join("\n");
  // 整段删除 export interface，避免顶层级字段冲突
  s = stripExportNamedTypeBlocks(s, "interface");
  // export const/let/var/function/class → 去 export 前缀
  s = s.replace(
    /^(\s*)export\s+(const|let|var|function|class)\s+/gm,
    "$1$2 ",
  );
  // export type X = { ... } → 去 export 前缀（保留 type alias 给 IIFE）
  s = s.replace(/^(\s*)export\s+type\s+/gm, "$1type ");
  // 删除 ExportSpec 形式
  s = s.replace(/^\s*export\s+\{[^}]*\};?\s*\n?/gm, "");
  // 去掉 registry 的 EffectDef 导出
  s = s
    .split("\n")
    .filter((line) => !/^\s*export\s+const\s+\w+EffectDef\s*=/.test(line))
    .join("\n");
  // 折叠多余空行
  s = s.replace(/\n{3,}/g, "\n\n");
  return s;
}

async function loadInlinedSource(file, displayName) {
  let source;
  try {
    source = await readFile(file, "utf8");
  } catch (err) {
    throw new CompileError(
      `无法内联 ${displayName} (${file})：${err.message}`,
    );
  }
  return normalizeForInline(source);
}

// ---------- 代码生成 ----------

async function buildPackage(manifest, meta) {
  const usedIds = new Set();
  for (const board of manifest.boards)
    for (const card of board.cards) usedIds.add(card.id);
  const usedOrdered = REGISTERED_CARDS.filter((c) => usedIds.has(c.id));

  // 收集需要内联的组件源；用 IIFE 闭包隔离作用域，避免顶层 const 冲突。
  function wrapInScope(body, exported) {
    return `const ${exported} = (() => {\n${body}\nreturn ${exported};\n})();`;
  }

  const blocks = [];
  const useRafSource = await loadInlinedSource(
    join(effectsDir, "use-raf-progress.ts"),
    "effects/use-raf-progress.ts",
  );
  blocks.push(
    "// ====== 内联 useRafProgress ======",
    wrapInScope(useRafSource, "useRafProgress"),
  );

  const needsLegacy = usedOrdered.some(
    (c) => c.category === "metric" && c.id !== "ChapterBar",
  );
  if (needsLegacy) {
    const legacySource = await loadInlinedSource(
      join(effectsDir, "LegacyMetricEffects.tsx"),
      "effects/LegacyMetricEffects.tsx",
    );
    blocks.push(
      "// ====== 内联 LegacyMetricEffect ======",
      wrapInScope(legacySource, "LegacyMetricEffect"),
    );
  }
  if (usedIds.has("ChapterBar")) {
    const chapterSource = await loadInlinedSource(
      join(effectsDir, "ChapterBar.tsx"),
      "effects/ChapterBar.tsx",
    );
    blocks.push(
      "// ====== 内联 ChapterBar ======",
      wrapInScope(chapterSource, "ChapterBar"),
    );
  }

  const viewBlocks = [];
  const theme = manifest.theme ?? "dark";
  const skin = manifest.skin ?? "tech-cyan";
  const styleToken = manifest.style ?? "glass";
  const font = manifest.font ?? "sans";
  const skinPreset = SKIN_PRESETS[skin];
  const stylePreset = STYLE_PRESETS[styleToken];
  const cssVars = {
    "--arranger-theme": theme,
    "--arranger-accent": TOKEN_HEX[skinPreset.accent],
    "--arranger-support": TOKEN_HEX[skinPreset.support],
    "--arranger-radius": `${stylePreset.radius}px`,
    "--arranger-border": stylePreset.border,
    "--arranger-shadow": stylePreset.shadow,
    "--arranger-font": FONT_STACKS[font],
  };
  viewBlocks.push(
    `const DESIGN_TOKENS = ${JSON.stringify(
      { theme, skin, style: styleToken, font, cssVars },
      null,
      2,
    )};`,
    `const SkinShell = ({ children }) => (`,
    `  <div style={{ display: "contents", fontFamily: ${JSON.stringify(
      FONT_STACKS[font],
    )} }}>\${children}</div>`,
    `);`,
    ``,
  );
  for (const card of usedOrdered) {
    if (card.id === "ChapterBar") {
      viewBlocks.push(
        `const ChapterBarView = (props) => <SkinShell><ChapterBar {...props} /></SkinShell>;`,
      );
    } else {
      viewBlocks.push(
        `const ${card.id}View = (props) => <SkinShell><LegacyMetricEffect componentType="${card.id}" {...props} /></SkinShell>;`,
      );
    }
  }

  const manifestDefinitions = usedOrdered.map((card) => ({
    id: card.id,
    name: card.name ?? card.id,
    description: card.description ?? "",
    category: card.category,
    glyph: card.glyph ?? "FX",
    component: `${card.id}View`,
    durationInFrames: card.durationInFrames,
    bounds: card.bounds,
    defaultPosition: card.defaultPosition,
    defaultProps: card.defaultProps,
    propsSchema: card.propsSchema,
  }));

  const cardsById = new Map(REGISTERED_CARDS.map((c) => [c.id, c]));
  const skinPropsFor = (cardId, explicitProps) => {
    const filled = {};
    const registered = cardsById.get(cardId);
    if (!registered || !skinPreset) return filled;
    const schema = registered.propsSchema;
    if (schema.accentColor && !("accentColor" in explicitProps)) {
      filled.accentColor = skinPreset.accent;
    }
    if (schema.secondaryColor && !("secondaryColor" in explicitProps)) {
      filled.secondaryColor = skinPreset.support;
    }
    return filled;
  };

  const timeline = [];
  for (const board of manifest.boards) {
    const baseOpacity = Number(board.board.backgroundOpacity);
    for (const card of board.cards) {
      const explicitProps = card.props ?? {};
      timeline.push({
        componentId: card.id,
        startFrame: board.startFrame,
        durationInFrames: board.durationInFrames,
        position: { x: 0, y: 0, scale: 1 },
        backgroundOpacity: baseOpacity,
        props: { ...skinPropsFor(card.id, explicitProps), ...explicitProps },
      });
    }
  }

  const defaultExport = `${usedOrdered[0].id}View`;

  const lines = [
    `import React from "react";`,
    `import {`,
    `  interpolate,`,
    `  spring,`,
    `  useCurrentFrame,`,
    `  useVideoConfig,`,
    `} from "remotion";`,
    ``,
    `// =====================================================`,
    `// 由 ai-motion-arranger 编排 Skill + manifest-to-tsx 编译器产出。`,
    `// 编辑后会破坏"AI 只编排、不写代码"的契约，请勿手改。`,
    `// =====================================================`,
    ``,
    ...blocks,
    ``,
    `// ====== Wrapper Views ======`,
    ...viewBlocks,
    ``,
    `export const FPS = ${meta.fps};`,
    `export const DURATION_IN_FRAMES = ${meta.totalFrames};`,
    ``,
    `export const MOTION_COMPONENTS = ${JSON.stringify(manifestDefinitions, null, 2)};`,
    ``,
    `export const MOTION_TIMELINE = ${JSON.stringify(timeline, null, 2)};`,
    ``,
    `export default ${defaultExport};`,
  ];
  return lines.join("\n");
}

// ---------- 主流程 ----------

async function main() {
  const argPath = process.argv[2];
  if (!argPath) {
    process.stderr.write(
      "用法：node scripts/manifest-to-tsx.mjs <manifest.json> > package.tsx\n",
    );
    process.exit(2);
  }
  const source = await readFile(argPath, "utf8");
  const manifest = JSON.parse(source);
  const meta = checkManifest(manifest);
  const output = await buildPackage(manifest, meta);
  process.stdout.write(output);
}

main().catch((error) => {
  process.stderr.write(
    `✗ 编译 manifest 失败: ${error && error.stack ? error.stack : error.message}\n`,
  );
  process.exit(1);
});
