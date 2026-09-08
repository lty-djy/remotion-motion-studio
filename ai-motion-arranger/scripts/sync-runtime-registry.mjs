#!/usr/bin/env node

import { build } from "esbuild";
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readLibrary } from '../../effect-library-store.mjs';
import { applyLibraryToRegistry } from '../../effect-library.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const registryPath = join(root, "registry.ts");
const overlayPath = join(here, "arranger-overlay.json");
const registryMetaPath = join(here, "registry-meta.mjs");
const componentCatalogPath = join(
  root,
  "remotion-motion-studio.component-catalog.md",
);
const semanticCatalogPath = join(
  root,
  "ai-motion-arranger",
  "references",
  "component-semantic-capabilities.md",
);

const writeIfChanged = async (path, content) => {
  const previous = await readFile(path, "utf8").catch(() => "");
  if (previous === content) return false;
  await writeFile(path, content, "utf8");
  return true;
};

const loadRuntimeRegistry = async () => {
  const result = await build({
    entryPoints: [registryPath],
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    write: false,
    logLevel: "silent",
  });
  const code = result.outputFiles[0]?.text;
  if (!code) throw new Error("无法编译运行时 registry.ts");

  const module = { exports: {} };
  const require = createRequire(registryPath);
  new Function(
    "module",
    "exports",
    "require",
    "__filename",
    "__dirname",
    code,
  )(module, module.exports, require, registryPath, root);

  const registry = module.exports.EFFECT_REGISTRY;
  if (!Array.isArray(registry) || registry.length === 0) {
    throw new Error("registry.ts 没有导出有效的 EFFECT_REGISTRY");
  }
  const semanticIntentDefinitions = module.exports.SEMANTIC_INTENT_DEFINITIONS;
  if (!Array.isArray(semanticIntentDefinitions)) {
    throw new Error("registry.ts 没有导出有效的 SEMANTIC_INTENT_DEFINITIONS");
  }
  return { registry: applyLibraryToRegistry(registry, await readLibrary(root)), semanticIntentDefinitions };
};

const assertUniqueIds = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!item?.id || typeof item.id !== "string") {
      throw new Error(`${label} 存在无效 id`);
    }
    if (seen.has(item.id)) throw new Error(`${label} 存在重复 id：${item.id}`);
    seen.add(item.id);
  }
};

const toSerializableDefinition = (definition) => {
  const { component: _component, ...metadata } = definition;
  const schemaKeys = new Set(Object.keys(metadata.propsSchema ?? {}));
  metadata.defaultProps = Object.fromEntries(
    Object.entries(metadata.defaultProps ?? {}).filter(([key]) =>
      schemaKeys.has(key),
    ),
  );
  return JSON.parse(JSON.stringify(metadata));
};

const renderComponentCatalog = (runtimeCards, arrangeableIds) => {
  const groups = new Map();
  for (const card of runtimeCards) {
    const list = groups.get(card.catalogGroup) ?? [];
    list.push(card);
    groups.set(card.catalogGroup, list);
  }

  const lines = [
    "# 组件目录（自动生成）",
    "",
    "> 由 `npm.cmd run sync:registry` 从运行时 `registry.ts` 生成。",
    "> 不要手改本文件；新增、删除或修改组件后重新运行同步命令。",
    "",
    `工作台当前实际注册 **${runtimeCards.length}** 个组件，其中 **${arrangeableIds.size}** 个已接入当前 AI manifest 编译器。`,
    "未标记为 AI 可编排的组件仍可在工作台中手动使用，后续应在组件经过确认并补齐编译支持后再开放给 AI。",
    "",
  ];

  for (const [group, cards] of groups) {
    lines.push(`## ${group}`, "");
    for (const card of cards) {
      const props = Object.keys(card.propsSchema ?? {});
      const status = arrangeableIds.has(card.id) ? "AI 可编排" : "仅工作台可用";
      lines.push(
        `- \`${card.id}\`：${card.name} — ${card.description ?? ""}（${status}；props：${props.length > 0 ? props.map((prop) => `\`${prop}\``).join("、") : "无"}）`,
      );
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
};

const renderSemanticCapabilityCatalog = (
  runtimeCards,
  semanticIntentDefinitions,
) => {
  const labels = new Map(
    semanticIntentDefinitions.map((definition) => [
      definition.id,
      definition.label,
    ]),
  );
  const groups = new Map();
  for (const card of runtimeCards) {
    const list = groups.get(card.catalogGroup) ?? [];
    list.push(card);
    groups.set(card.catalogGroup, list);
  }
  const intentLabel = (intentId) => labels.get(intentId) ?? intentId ?? "—";
  const lines = [
    "# 组件语义能力审核表（自动生成）",
    "",
    "> 由 `npm.cmd run sync:registry` 从真实效果注册表生成，请勿手改。",
    "> 普通分组继续用于人工浏览；主要和次要语义用于 AI 候选排序，不代表审核状态，也不限制组件只能用于单一语义。",
    "",
    `当前覆盖 **${runtimeCards.length}** 个注册组件。`,
    "",
    "## 核心语义",
    "",
    ...semanticIntentDefinitions.map(
      (definition) =>
        `- **${definition.label}**（\`${definition.id}\`）：${definition.description}`,
    ),
    "",
  ];

  for (const [group, cards] of groups) {
    lines.push(`## ${group}`, "");
    for (const card of cards) {
      const semantic = card.semantic;
      const primary = semantic.primaryIntent
        ? intentLabel(semantic.primaryIntent)
        : `系统角色：${semantic.systemRole ?? "未指定"}`;
      const secondary = semantic.secondaryIntents?.length
        ? semantic.secondaryIntents.map(intentLabel).join("、")
        : "无";
      lines.push(
        `- **${card.name}**（\`${card.id}\`）`,
        `  - 主要：${primary}`,
        `  - 次要：${secondary}`,
        `  - 内容：${semantic.contentKinds.join("、")}`,
        `  - 方向：${semantic.orientation}；密度：${semantic.density}；建议时长：${semantic.durationSeconds.min}–${semantic.durationSeconds.max} 秒`,
        `  - 检索词：${semantic.keywords.join("、")}`,
    );
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
};

const main = async () => {
  const { registry, semanticIntentDefinitions } = await loadRuntimeRegistry();
  assertUniqueIds(registry, "EFFECT_REGISTRY");

  const runtimeCards = registry.map(toSerializableDefinition);
  const registeredCards = runtimeCards
    .filter((card) => card.arranger?.compiler === "legacy-metric")
    .map(({ arranger: _arranger, ...card }) => card);
  const arrangeableIds = new Set(registeredCards.map((card) => card.id));

  const overlay = JSON.parse(await readFile(overlayPath, "utf8"));
  if (!Array.isArray(overlay)) throw new Error("arranger-overlay.json 必须是数组");
  assertUniqueIds(overlay, "arranger-overlay.json");
  const overlayIds = new Set(overlay.map((entry) => entry.id));
  const staleOverlayIds = [...overlayIds].filter((id) => !arrangeableIds.has(id));
  const missingOverlayIds = [...arrangeableIds].filter((id) => !overlayIds.has(id));
  if (staleOverlayIds.length > 0 || missingOverlayIds.length > 0) {
    throw new Error(
      [
        staleOverlayIds.length > 0
          ? `overlay 含非编排组件：${staleOverlayIds.join(", ")}`
          : "",
        missingOverlayIds.length > 0
          ? `编排组件缺少 overlay：${missingOverlayIds.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("；"),
    );
  }

  const registryMeta = [
    "// 此文件由 sync-runtime-registry.mjs 从运行时 registry.ts 自动生成。",
    "// 不要手改；请修改真实组件定义后运行 npm.cmd run sync:registry。",
    `export const RUNTIME_COMPONENT_COUNT = ${runtimeCards.length};`,
    `export const REGISTERED_CARDS = ${JSON.stringify(registeredCards, null, 2)};`,
    "",
  ].join("\n");

  const metaChanged = await writeIfChanged(registryMetaPath, registryMeta);
  const catalogChanged = await writeIfChanged(
    componentCatalogPath,
    renderComponentCatalog(runtimeCards, arrangeableIds),
  );
  const semanticCatalogChanged = await writeIfChanged(
    semanticCatalogPath,
    renderSemanticCapabilityCatalog(runtimeCards, semanticIntentDefinitions),
  );

  console.log(
    `✓ runtime=${runtimeCards.length} arrangeable=${registeredCards.length} meta=${metaChanged ? "updated" : "unchanged"} catalog=${catalogChanged ? "updated" : "unchanged"} semantics=${semanticCatalogChanged ? "updated" : "unchanged"}`,
  );
};

main().catch((error) => {
  console.error("✗ 同步运行时 registry 失败：", error.message);
  process.exit(1);
});
