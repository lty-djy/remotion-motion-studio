#!/usr/bin/env node
// generate-card-catalog.mjs
// 从 registry-meta.mjs（技术字段）+ arranger-overlay.json（编排注释）合成 references/card-catalog.md。
//
// 用法：node scripts/generate-card-catalog.mjs
//
// 该脚本是 deterministic 的——除非上面两个源变了，输出不会有任何差异。

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const overlayPath = join(here, "arranger-overlay.json");
const registryMetaPath = join(here, "registry-meta.mjs");
const outputPath = join(
  root,
  "ai-motion-arranger",
  "references",
  "card-catalog.md",
);

const { REGISTERED_CARDS } = await import(pathToFileURL(registryMetaPath).href);

function renderPropsSection(overlay) {
  const fields = overlay.propsFieldSemantics || {};
  const rows = Object.entries(fields)
    .map(([name, sem]) => `- \`${name}\` — ${sem}`)
    .join("\n");
  return rows
    ? `**可编排 props（共 ${Object.keys(fields).length} 个）：**\n\n${rows}`
    : "_暂无 props 字段语义说明_";
}

function renderCardSection(overlay) {
  const palettes = overlay.preferredPalettes?.join(" / ") ?? "—";
  return [
    `**角色**：${overlay.role ?? "—"}  `,
    `**画布落点**：${overlay.placement ?? "—"}  `,
    `**推荐调色板**：${palettes}  `,
    `**何时使用**：${overlay.whenToUse ?? "—"}  `,
    `**视觉/语义**：${overlay.purpose ?? "—"}`,
    "",
    renderPropsSection(overlay),
  ].join("\n");
}

function renderGroup(group, items) {
  const lines = [`## ${group}`, ""];
  for (const overlay of items) {
    lines.push(`### \`${overlay.id}\``);
    lines.push("");
    lines.push(renderCardSection(overlay));
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const overlayRaw = await readFile(overlayPath, "utf8");
  const overlay = JSON.parse(overlayRaw);
  const overlayIds = new Set(overlay.map((entry) => entry.id));
  const registryIds = new Set(REGISTERED_CARDS.map((card) => card.id));

  const missingInRegistry = [...overlayIds].filter(
    (id) => !registryIds.has(id),
  );
  const needsOverlay = [...registryIds].filter(
    (id) => !overlayIds.has(id),
  );

  const overlayById = new Map(overlay.map((entry) => [entry.id, entry]));

  // 按 catalogGroup 分组
  const groups = new Map();
  // 用 registry 顺序保证稳定（不然 overlay 顺序也影响）
  for (const card of REGISTERED_CARDS) {
    const note = overlayById.get(card.id);
    if (!note) continue;
    const group = note.catalogGroup ?? card.catalogGroup ?? "未分类";
    const list = groups.get(group) ?? [];
    list.push({ ...note, id: card.id });
    groups.set(group, list);
  }

  const header = [
    "# Card Catalog（自动生成）",
    "",
    "> 由 `scripts/generate-card-catalog.mjs` 从",
    "> `arranger-overlay.json`（编排层注释）",
    "> 与 `registry-meta.mjs`（技术字段 propsSchema/defaultProps/bounds 等）合成。",
    "> **不要手改本文件**——直接改源 + 重跑命令 `node scripts/generate-card-catalog.mjs`。",
    "",
    "AI 编排器（即 `../SKILL.md`）只能使用本目录中存在的卡 id，",
    "并严格使用下面登记的 `props` 字段名。任何不在登记中的字段或 id 都视为非法。",
    "",
    `**当前卡片总数**：${REGISTERED_CARDS.length} 张`,
    `**覆盖分组**：${groups.size} 个（数字与指标 / 导航与进度 / 等）`,
    `**registry 集合**：${registryIds.size} 个 id`,
    `**overlay 集合**：${overlayIds.size} 个 id`,
    "",
  ].join("\n");

  const groupSection = [...groups.entries()]
    .map(([groupName, items]) => renderGroup(groupName, items))
    .join("\n");

  const diagnostics = [
    "## 自检（生成时）",
    "",
    `- registry 条目数：${REGISTERED_CARDS.length}`,
    `- overlay 条目数：${overlay.length}`,
    `- 缺失于 registry（overlay 有但 registry 没登记）：${
      missingInRegistry.length === 0
        ? "无"
        : "`" + missingInRegistry.join("`, `") + "`"
    }`,
    `- 缺失于 overlay（registry 有但 overlay 没登记）：${
      needsOverlay.length === 0
        ? "无"
        : "`" + needsOverlay.join("`, `") + "`"
    }`,
    "",
    "",
  ].join("\n");

  const footer = [
    "---",
    "",
    "## 维护提示",
    "",
    "新增/修改卡片的标准流程：",
    "",
    "1. 改 `effects/*.tsx` 或 `legacy-effects.tsx`，落地一个或多个组件定义（id 暴露在 propsSchema/MOTION_COMPONENTS/LEGACY_EFFECT_DEFS 中）。",
    "2. 在 `scripts/registry-meta.mjs` 的 `REGISTERED_CARDS` 里追加该 id 与对应 propsSchema/defaultProps/bounds/defaultPosition/durationInFrames。",
    "3. 在 `arranger-overlay.json` 加一条：写明 `catalogGroup`、`placement`、`purpose`、`whenToUse`、`role`、`preferredPalettes`、`propsFieldSemantics`。",
    "4. 重跑 `node scripts/generate-card-catalog.mjs`，让本目录同步。",
    "5. 如果新卡引入新的颜色 token，参考 [`palette.md`](./palette.md) 增改 §2/§3 表，并在 `palette.md` 增加该 token 的使用约束。",
    "",
    "未来扩展方向（目前未实现，但 SKILL 已留口子）：图表与比较 / 文字与叙事 / 图片视频与证据 /",
    "结构流程与解释 / UI 与科技界面 / 空间与聚焦 / 品牌装饰与转场。注册这些分类的卡片，",
    "把它们的 id 加入 `REGISTERED_CARDS` 和 `arranger-overlay.json` 即可，编排规则无需改动。",
    "",
  ].join("\n");

  const output = header + groupSection + diagnostics + footer;
  await writeFile(outputPath, output, "utf8");

  console.log(`✓ Wrote ${outputPath}`);
  if (missingInRegistry.length > 0) {
    console.warn(
      `⚠ ${missingInRegistry.length} 个 overlay id 在 registry 中未找到：` +
        missingInRegistry.join(", "),
    );
  }
  if (needsOverlay.length > 0) {
    console.warn(
      `⚠ ${needsOverlay.length} 个 registry id 需要补 overlay：` +
        needsOverlay.join(", "),
    );
  }
}

main().catch((error) => {
  console.error("✗ 生成 card-catalog 失败：", error);
  process.exit(1);
});
