#!/usr/bin/env node
// lint-manifest.mjs
// ai-motion-arranger 的 manifest 体检器：把 SKILL.md §12 的 AI 自检清单自动化。
//
// 用法：node scripts/lint-manifest.mjs <manifest.json>
// 退出码：0 = 通过（可有 warning）；1 = 存在 error。
//
// 与 manifest-to-tsx.mjs 内置校验的区别：编译器只做"能安全编译"的硬校验，
// 本脚本额外输出完整体检报告（warning 级问题、统计摘要），供编排后快速体检。

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { REGISTERED_CARDS } = await import(
  pathToFileURL(join(here, "registry-meta.mjs")).href
);

const ACCENT_TOKENS = new Set([
  "cyan", "violet", "amber", "lime", "rose", "teal", "gold", "neutral",
]);
const SUPPORT_TOKENS = new Set([
  "support-neutral", "success", "warning", "danger", "info", ...ACCENT_TOKENS,
]);
const THEMES = new Set(["dark", "light"]);
const SKINS = new Set([
  "tech-cyan", "brand-amber", "growth-lime", "creative-violet", "soft-teaching-violet", "alert-rose", "pro-neutral",
]);
const SKIN_DEFAULTS = {
  "tech-cyan": { accent: "cyan", support: "info" },
  "brand-amber": { accent: "amber", support: "warning" },
  "growth-lime": { accent: "lime", support: "success" },
  "creative-violet": { accent: "violet", support: "info" },
  "soft-teaching-violet": { accent: "violet", support: "support-neutral" },
  "alert-rose": { accent: "rose", support: "danger" },
  "pro-neutral": { accent: "neutral", support: "support-neutral" },
};
const STYLES = new Set(["glass", "flat", "outline", "tile", "teaching-overlay"]);
const FONTS = new Set(["sans", "serif", "mono-tech"]);
const ANCHORS = new Set([
  "left-bottom", "right-bottom", "left-top", "right-top", "top-rail", "bottom-rail", "center-stage",
]);
const DENSITY = new Set(["sparse", "balanced", "rich"]);
const RHYTHM = new Set(["single", "staggered", "cascade"]);
const DENSITY_MAX_CARDS = { sparse: 1, balanced: 3, rich: 5 };

const BANNED_TOP_FIELDS = new Set([
  "code", "tsx", "jsx", "react", "import", "export", "css", "className",
  "position", "transform", "width", "height", "x", "y",
]);
const COLOR_LITERAL_RE =
  /(^#|^\s*#|rgb\(|rgba\(|hsl\(|hsla\(|oklch\(|oklab\()/i;
const NAMED_COLOR_RE =
  /^(white|black|gray|grey|red|green|blue|yellow|orange|purple|pink|transparent)$/i;

const errors = [];
const warnings = [];
const stats = { boards: 0, cards: 0, accents: new Set(), skins: new Set() };

const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

function lint(manifest) {
  if (!manifest || typeof manifest !== "object") {
    err("manifest 不是 JSON 对象");
    return;
  }
  if (manifest.manifestVersion !== "1.0") {
    err(`manifestVersion 必须为 "1.0"，当前：${manifest.manifestVersion}`);
  }
  for (const key of Object.keys(manifest)) {
    if (BANNED_TOP_FIELDS.has(key)) {
      err(`顶层出现违禁字段 "${key}"（渲染层字段不允许由 AI 输出）`);
    }
  }

  const fps = Number.isInteger(manifest.fps) ? manifest.fps : 30;
  const videoDurationSec = Number(manifest.videoDurationSec);
  if (!Number.isFinite(videoDurationSec) || videoDurationSec <= 0) {
    err("videoDurationSec 缺失或非法");
  }
  const totalFrames = Math.ceil((videoDurationSec || 0) * fps);

  if (
    manifest.theme !== undefined &&
    !THEMES.has(manifest.theme)
  ) {
    err(`theme "${manifest.theme}" 不在枚举 [dark, light]`);
  }
  if (
    manifest.skin !== undefined &&
    !SKINS.has(manifest.skin)
  ) {
    err(`skin "${manifest.skin}" 不在枚举（见 references/design-tokens.md §3）`);
  }
  if (
    manifest.style !== undefined &&
    !STYLES.has(manifest.style)
  ) {
    err(`style "${manifest.style}" 不在枚举 [glass, flat, outline, tile, teaching-overlay]`);
  }
  if (
    manifest.font !== undefined &&
    !FONTS.has(manifest.font)
  ) {
    err(`font "${manifest.font}" 不在枚举 [sans, serif, mono-tech]`);
  }
  if (manifest.style !== undefined && typeof manifest.style !== "string") {
    err("style 必须是字符串枚举，不允许样式对象");
  }

  if (!Array.isArray(manifest.boards) || manifest.boards.length === 0) {
    err("boards 必须是非空数组");
    return;
  }

  const cardsById = new Map(REGISTERED_CARDS.map((c) => [c.id, c]));
  let prevAccent = null;

  manifest.boards.forEach((board, i) => {
    const tag = `boards[${i}]`;
    stats.boards++;
    if (!board || typeof board !== "object") return err(`${tag} 不是对象`);
    if (!/^board-\d{3,}$/.test(board.id ?? "")) {
      err(`${tag}.id 必须匹配 "board-001" 格式，当前：${board.id}`);
    }
    if (!board.voiceSegmentId) {
      warn(`${tag}.voiceSegmentId 缺失，无法回溯 SRT 行`);
    }
    if (typeof board.voiceText !== "string" || !board.voiceText.trim()) {
      warn(`${tag}.voiceText 缺失，建议填写口播原文便于复核`);
    }

    const startFrame = Number(board.startFrame);
    const durationInFrames = Number(board.durationInFrames);
    const endFrame = Number(board.endFrame);
    if (
      !Number.isInteger(startFrame) ||
      !Number.isInteger(durationInFrames) ||
      !Number.isInteger(endFrame)
    ) {
      err(`${tag} 缺少整数字段 startFrame/endFrame/durationInFrames`);
    } else {
      if (startFrame < 0) err(`${tag}.startFrame < 0`);
      if (durationInFrames < 3) err(`${tag}.durationInFrames < 3`);
      if (Math.abs(startFrame + durationInFrames - endFrame) > 1) {
        err(`${tag} 的 startFrame+durationInFrames 与 endFrame 不一致`);
      }
      if (endFrame > totalFrames) {
        err(`${tag} 结束帧 ${endFrame} 超出视频总帧 ${totalFrames}`);
      }
    }
    if (Number.isFinite(board.voiceStartSec)) {
      const derived = Math.floor(board.voiceStartSec * fps);
      if (Number.isInteger(startFrame) && Math.abs(derived - startFrame) > 1) {
        warn(
          `${tag}.startFrame(${startFrame}) 与 voiceStartSec×fps 推导值(${derived}) 偏差 >1 帧`,
        );
      }
    }

    const cfg = board.board;
    if (!cfg || typeof cfg !== "object") return err(`${tag}.board 不是对象`);
    if (!ANCHORS.has(cfg.anchor)) err(`${tag}.board.anchor "${cfg.anchor}" 非法`);
    if (!DENSITY.has(cfg.density)) err(`${tag}.board.density "${cfg.density}" 非法`);
    if (!RHYTHM.has(cfg.rhythm)) err(`${tag}.board.rhythm "${cfg.rhythm}" 非法`);

    const palette = cfg.palette;
    if (!palette || typeof palette !== "object") {
      err(`${tag}.board.palette 缺失`);
    } else {
      if (!ACCENT_TOKENS.has(palette.accent)) {
        err(`${tag}.board.palette.accent "${palette.accent}" 不在 accent token 集`);
      } else {
        stats.accents.add(palette.accent);
        if (prevAccent === palette.accent) {
          err(`${tag} 主调 ${palette.accent} 与前一 Board 相同（相邻 Board 必须换主调）`);
        }
        prevAccent = palette.accent;
      }
      if (palette.support && !SUPPORT_TOKENS.has(palette.support)) {
        err(`${tag}.board.palette.support "${palette.support}" 不在 support token 集`);
      }
    }

    const bg = Number(cfg.backgroundOpacity);
    if (!Number.isFinite(bg) || bg < 0 || bg > 1) {
      err(`${tag}.board.backgroundOpacity 必须在 [0,1]`);
    }

    if (!Array.isArray(board.cards)) return err(`${tag}.cards 不是数组`);
    const maxCards = DENSITY_MAX_CARDS[cfg.density] ?? 5;
    if (board.cards.length > maxCards) {
      err(`${tag} density="${cfg.density}" 最多 ${maxCards} 卡，实际 ${board.cards.length}`);
    }
    if (cfg.density === "sparse" && board.cards.length !== 1) {
      err(`${tag} density="sparse" 必须恰好 1 卡`);
    }
    if (board.cards.length === 0) {
      warn(`${tag} 没有任何卡片`);
    }

    const skinDefaults = SKIN_DEFAULTS[manifest.skin ?? "tech-cyan"];

    board.cards.forEach((card, j) => {
      const ctag = `${tag}.cards[${j}]`;
      stats.cards++;
      if (!card || typeof card !== "object") return err(`${ctag} 不是对象`);
      const registered = cardsById.get(card.id);
      if (!registered) {
        return err(`${ctag}.id "${card.id}" 不在 registry（见 references/card-catalog.md）`);
      }
      const props = card.props ?? {};
      const allowedKeys = new Set(Object.keys(registered.propsSchema));
      for (const key of Object.keys(props)) {
        if (!allowedKeys.has(key)) {
          err(`${ctag} props.${key} 不在 catalog 字段列表（id=${card.id}）`);
        }
      }
      for (const [fieldName, fieldDef] of Object.entries(registered.propsSchema)) {
        if (!(fieldName in props)) continue;
        const v = props[fieldName];
        if (fieldDef.type === "color") {
          if (typeof v !== "string" || (!ACCENT_TOKENS.has(v) && !SUPPORT_TOKENS.has(v))) {
            err(`${ctag} props.${fieldName} 颜色 token "${v}" 非法`);
          }
        } else if (fieldDef.type === "number" && typeof v === "number") {
          const min = fieldDef.min;
          const max = fieldDef.max;
          if (
            (Number.isFinite(min) && v < min) ||
            (Number.isFinite(max) && v > max)
          ) {
            err(`${ctag} props.${fieldName}=${v} 超出范围 [${min}, ${max}]`);
          }
        } else if (fieldDef.type === "select" && Array.isArray(fieldDef.options)) {
          const allowed = fieldDef.options.map((o) =>
            typeof o === "string" ? o : o.value,
          );
          if (!allowed.includes(v)) {
            err(`${ctag} props.${fieldName}="${v}" 不在 select 选项 [${allowed.join(", ")}]`);
          }
        }
      }
      if (
        !("accentColor" in props) &&
        "accentColor" in registered.propsSchema &&
        skinDefaults
      ) {
        warn(
          `${ctag} 未填 accentColor，编译器将按 skin "${manifest.skin ?? "tech-cyan"}" 补默认 "${skinDefaults.accent}"`,
        );
      }
      for (const [k, v] of Object.entries(props)) {
        if (typeof v === "string") {
          if (COLOR_LITERAL_RE.test(v.trim()) || NAMED_COLOR_RE.test(v.trim())) {
            err(`${ctag} props.${k} 疑似颜色字面量 "${v}"（必须用 token）`);
          }
        }
      }
    });
  });

  if (stats.accents.size < 2 || stats.accents.size > 4) {
    err(
      `全视频 accent token 去重数必须 ∈ [2,4]，当前 ${stats.accents.size}（${[...stats.accents].join(", ")}）`,
    );
  }
}

function report() {
  const lines = [];
  lines.push("== manifest 体检报告 ==");
  lines.push(
    `概要：boards=${stats.boards} cards=${stats.cards} accents=${stats.accents.size} [${[...stats.accents].join(", ")}]`,
  );
  if (errors.length) {
    lines.push(`\n✗ error × ${errors.length}`);
    for (const e of errors) lines.push(`  - ${e}`);
  }
  if (warnings.length) {
    lines.push(`\n⚠ warning × ${warnings.length}`);
    for (const w of warnings) lines.push(`  - ${w}`);
  }
  if (!errors.length && !warnings.length) {
    lines.push("\n✓ 全部检查通过");
  }
  lines.push(
    errors.length
      ? "\n结论：不通过（存在 error，请修正后重跑）"
      : warnings.length
        ? "\n结论：通过（带 warning，建议复核）"
        : "\n结论：通过",
  );
  return lines.join("\n");
}

async function main() {
  const argPath = process.argv[2];
  if (!argPath) {
    process.stderr.write("用法：node scripts/lint-manifest.mjs <manifest.json>\n");
    process.exit(2);
  }
  const manifest = JSON.parse(await readFile(resolve(argPath), "utf8"));
  lint(manifest);
  process.stdout.write(report() + "\n");
  process.exit(errors.length ? 1 : 0);
}

main().catch((error) => {
  process.stderr.write(`? 体检失败：${error?.message ?? error}\n`);
  process.exit(1);
});
