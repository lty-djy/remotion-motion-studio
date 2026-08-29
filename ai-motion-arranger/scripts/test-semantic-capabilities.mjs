#!/usr/bin/env node

import { loadRuntimeRegistry } from "./load-runtime-registry.mjs";

const allowedIntentIds = new Set([
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
]);
const allowedContentKinds = new Set([
  "short-text",
  "long-text",
  "metric",
  "comparison",
  "list",
  "process",
  "media",
  "caption",
  "spatial",
]);

const registry = await loadRuntimeRegistry();
const failures = [];

for (const definition of registry) {
  const semantic = definition.semantic;
  if (!semantic) {
    failures.push(`${definition.id} 缺少 semantic`);
    continue;
  }
  const intentIds = [
    ...(semantic.primaryIntent ? [semantic.primaryIntent] : []),
    ...(semantic.secondaryIntents ?? []),
  ];
  const unknownIntentIds = intentIds.filter((id) => !allowedIntentIds.has(id));
  if (unknownIntentIds.length > 0) {
    failures.push(`${definition.id} 使用未知语义：${unknownIntentIds.join(", ")}`);
  }
  if (new Set(intentIds).size !== intentIds.length) {
    failures.push(`${definition.id} 的主要和次要语义重复`);
  }
  if (semantic.systemRole === "caption-track") {
    if (semantic.primaryIntent || !semantic.contentKinds?.includes("caption")) {
      failures.push(`${definition.id} 的字幕系统角色配置无效`);
    }
  } else if (!semantic.primaryIntent) {
    failures.push(`${definition.id} 缺少主要语义`);
  }
  const unknownContentKinds = (semantic.contentKinds ?? []).filter(
    (kind) => !allowedContentKinds.has(kind),
  );
  if (semantic.contentKinds?.length === 0 || unknownContentKinds.length > 0) {
    failures.push(`${definition.id} 的内容类型无效`);
  }
  if (!Array.isArray(semantic.keywords) || semantic.keywords.length < 2) {
    failures.push(`${definition.id} 至少需要两个检索关键词`);
  }
  if (
    !Number.isFinite(semantic.durationSeconds?.min) ||
    !Number.isFinite(semantic.durationSeconds?.max) ||
    semantic.durationSeconds.min <= 0 ||
    semantic.durationSeconds.max < semantic.durationSeconds.min
  ) {
    failures.push(`${definition.id} 的建议时长范围无效`);
  }
}

const captionRoleIds = registry
  .filter((definition) => definition.semantic.systemRole === "caption-track")
  .map((definition) => definition.id)
  .sort();
if (
  JSON.stringify(captionRoleIds) !==
  JSON.stringify(["SrtCueText", "SrtSemanticCaptions"])
) {
  failures.push(`字幕系统角色覆盖异常：${captionRoleIds.join(", ")}`);
}

if (failures.length > 0) {
  throw new Error(`组件语义能力校验失败：\n- ${failures.join("\n- ")}`);
}

const primaryIntentCounts = Object.fromEntries(
  [...allowedIntentIds].map((intentId) => [
    intentId,
    registry.filter(
      (definition) => definition.semantic.primaryIntent === intentId,
    ).length,
  ]),
);

console.log(
  `✓ 组件语义能力通过：components=${registry.length} captionRoles=${captionRoleIds.length} primaryIntents=${JSON.stringify(primaryIntentCounts)}`,
);

