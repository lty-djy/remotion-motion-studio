#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(here, "..", "visual-script.schema.json");
const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const resourceIndexPath = join(
  here,
  "..",
  "..",
  "public",
  "input",
  "resource-index.json",
);
const resourceIndex = JSON.parse(await readFile(resourceIndexPath, "utf8"));
const { REGISTERED_CARDS } = await import(
  pathToFileURL(join(here, "registry-meta.mjs")).href
);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
});
const validateSchema = ajv.compile(schema);

const COLOR_TOKENS = new Set([
  "cyan",
  "violet",
  "amber",
  "lime",
  "rose",
  "teal",
  "gold",
  "neutral",
  "support-neutral",
  "success",
  "warning",
  "danger",
  "info",
]);
const TRACK_BY_KIND = {
  effect: "motion",
  icon: "icon",
  material: "material",
  caption: "caption",
  sfx: "sfx",
};
const LIBRARY_BY_KIND = {
  icon: "icons",
  material: "materials",
  sfx: "sfx",
};
const REQUIRED_QC_CHECKS = new Set([
  "face-occlusion",
  "caption-occlusion",
  "asset-availability",
  "voice-masking",
  "timeline-bounds",
]);
const RESOURCE_IDS_BY_LIBRARY = new Map(
  Object.entries(resourceIndex.libraries ?? {}).map(([library, entries]) => [
    library,
    new Set((Array.isArray(entries) ? entries : []).map((entry) => entry.id)),
  ]),
);

const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const formatSchemaError = (error) => {
  const path = error.instancePath || "/";
  const detail = error.params?.additionalProperty
    ? `: ${error.params.additionalProperty}`
    : "";
  return `${path} ${error.message ?? "schema 校验失败"}${detail}`;
};

const addUnique = (set, value, path, errors) => {
  if (set.has(value)) errors.push(`${path} 重复 ID "${value}"`);
  set.add(value);
};

const validateComponentProps = (expression, path, cardsById, errors) => {
  const componentId = expression.component?.componentId;
  const definition = cardsById.get(componentId);
  if (!definition) {
    errors.push(
      `${path}.component.componentId "${componentId}" 不在当前 AI 可编排 registry 中`,
    );
    return;
  }

  const props = expression.component.props;
  const allowed = new Set(Object.keys(definition.propsSchema));
  for (const [key, value] of Object.entries(props)) {
    const field = definition.propsSchema[key];
    if (!allowed.has(key)) {
      errors.push(`${path}.component.props.${key} 不在 ${componentId} 的 props 白名单中`);
      continue;
    }
    if (field.type === "text" && typeof value !== "string") {
      errors.push(`${path}.component.props.${key} 必须是字符串`);
    }
    if (field.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        errors.push(`${path}.component.props.${key} 必须是有限数字`);
      } else {
        if (Number.isFinite(field.min) && value < field.min) {
          errors.push(`${path}.component.props.${key}=${value} 小于最小值 ${field.min}`);
        }
        if (Number.isFinite(field.max) && value > field.max) {
          errors.push(`${path}.component.props.${key}=${value} 大于最大值 ${field.max}`);
        }
      }
    }
    if (field.type === "boolean" && typeof value !== "boolean") {
      errors.push(`${path}.component.props.${key} 必须是布尔值`);
    }
    if (field.type === "color" && !COLOR_TOKENS.has(value)) {
      errors.push(`${path}.component.props.${key} 必须是语义颜色 token，当前为 "${value}"`);
    }
    if (field.type === "select" && Array.isArray(field.options)) {
      const allowedValues = field.options.map((option) =>
        typeof option === "string" ? option : option.value,
      );
      if (!allowedValues.includes(value)) {
        errors.push(
          `${path}.component.props.${key}="${value}" 不在可选值 [${allowedValues.join(", ")}] 中`,
        );
      }
    }
  }
};

export const validateVisualScript = (script) => {
  const errors = [];
  const warnings = [];
  const stats = {
    segments: 0,
    intents: 0,
    expressions: 0,
    effects: 0,
    resources: 0,
  };

  const schemaValid = validateSchema(script);
  if (!schemaValid) {
    errors.push(...(validateSchema.errors ?? []).map(formatSchemaError));
    return { valid: false, errors, warnings, stats };
  }

  const cardsById = new Map(REGISTERED_CARDS.map((card) => [card.id, card]));
  if (script.project.resourceCatalog.root !== resourceIndex.root) {
    errors.push(
      `project.resourceCatalog.root 与当前资源索引不一致：${resourceIndex.root}`,
    );
  }
  if (script.project.resourceCatalog.indexVersion !== resourceIndex.indexVersion) {
    errors.push(
      `project.resourceCatalog.indexVersion 必须为当前版本 "${resourceIndex.indexVersion}"`,
    );
  }
  const segmentIds = new Set();
  const intentIds = new Set();
  const expressionIds = new Set();
  const referencedIntentIds = new Set();
  let previousSegmentEnd = 0;

  for (const [segmentIndex, segment] of script.segments.entries()) {
    const segmentPath = `segments[${segmentIndex}]`;
    stats.segments += 1;
    addUnique(segmentIds, segment.id, `${segmentPath}.id`, errors);

    const { startFrame, endFrame, transcript } = segment.source;
    if (endFrame <= startFrame) {
      errors.push(`${segmentPath}.source.endFrame 必须大于 startFrame`);
    }
    if (endFrame > script.project.durationInFrames) {
      errors.push(
        `${segmentPath}.source.endFrame ${endFrame} 超出项目总帧数 ${script.project.durationInFrames}`,
      );
    }
    if (segmentIndex > 0 && startFrame < previousSegmentEnd) {
      errors.push(`${segmentPath}.source 与前一语义段重叠或未按时间排序`);
    }
    previousSegmentEnd = Math.max(previousSegmentEnd, endFrame);

    const localIntentIds = new Set();
    for (const [intentIndex, intent] of segment.intents.entries()) {
      const intentPath = `${segmentPath}.intents[${intentIndex}]`;
      stats.intents += 1;
      addUnique(intentIds, intent.id, `${intentPath}.id`, errors);
      localIntentIds.add(intent.id);
      if (!transcript.includes(intent.evidenceText)) {
        errors.push(`${intentPath}.evidenceText 必须是当前来源字幕的原文片段`);
      }
    }

    for (const [expressionIndex, expression] of segment.expressions.entries()) {
      const expressionPath = `${segmentPath}.expressions[${expressionIndex}]`;
      stats.expressions += 1;
      addUnique(expressionIds, expression.id, `${expressionPath}.id`, errors);
      if (!localIntentIds.has(expression.intentId)) {
        errors.push(`${expressionPath}.intentId "${expression.intentId}" 不属于当前语义段`);
      } else if (expression.enabled) {
        referencedIntentIds.add(expression.intentId);
      }

      const expectedTrack = TRACK_BY_KIND[expression.kind];
      if (expression.track !== expectedTrack) {
        errors.push(
          `${expressionPath}.track 应为 "${expectedTrack}"（kind=${expression.kind}）`,
        );
      }

      const timing = expression.timing;
      if (timing.endFrame <= timing.startFrame) {
        errors.push(`${expressionPath}.timing.endFrame 必须大于 startFrame`);
      }
      if (timing.endFrame > script.project.durationInFrames) {
        errors.push(
          `${expressionPath}.timing.endFrame ${timing.endFrame} 超出项目总帧数 ${script.project.durationInFrames}`,
        );
      }
      if (timing.endFrame <= startFrame || timing.startFrame >= endFrame) {
        errors.push(`${expressionPath}.timing 必须与来源语义段有时间交集`);
      }

      if (expression.kind === "effect") {
        stats.effects += 1;
        validateComponentProps(expression, expressionPath, cardsById, errors);
        if (expression.resource || expression.audio || expression.content) {
          errors.push(`${expressionPath} effect 不应携带 resource/audio/content`);
        }
      } else if (expression.kind === "caption") {
        if (expression.component || expression.resource || expression.audio) {
          errors.push(`${expressionPath} caption 只允许 content + layout`);
        }
      } else {
        stats.resources += 1;
        const expectedLibrary = LIBRARY_BY_KIND[expression.kind];
        if (expression.resource?.library !== expectedLibrary) {
          errors.push(
            `${expressionPath}.resource.library 应为 "${expectedLibrary}"（kind=${expression.kind}）`,
          );
        }
        const resourceId = expression.resource?.resourceId;
        if (
          expectedLibrary &&
          !RESOURCE_IDS_BY_LIBRARY.get(expectedLibrary)?.has(resourceId)
        ) {
          errors.push(
            `${expressionPath}.resource.resourceId "${resourceId}" 不在 ${expectedLibrary} 资源索引中`,
          );
        }
        if (expression.component || expression.content) {
          errors.push(`${expressionPath} 资源表达不应携带 component/content`);
        }
        if (["icon", "material"].includes(expression.kind) && expression.audio) {
          errors.push(`${expressionPath} 视觉资源不应携带 audio`);
        }
        if (expression.kind === "sfx" && expression.layout) {
          errors.push(`${expressionPath} 音频资源不应携带 layout`);
        }
      }
    }

    for (const intent of segment.intents) {
      if (!referencedIntentIds.has(intent.id)) {
        errors.push(`${segmentPath}.intents 中的 "${intent.id}" 没有任何已启用的视觉/声音表达`);
      }
    }
  }

  const qcTypes = new Set();
  const qcStatuses = [];
  for (const [index, check] of script.qualityControl.checks.entries()) {
    const checkPath = `qualityControl.checks[${index}]`;
    if (qcTypes.has(check.type)) errors.push(`${checkPath}.type "${check.type}" 重复`);
    qcTypes.add(check.type);
    qcStatuses.push(check.status);
    for (const expressionId of check.affectedExpressionIds) {
      if (!expressionIds.has(expressionId)) {
        errors.push(`${checkPath}.affectedExpressionIds 引用了不存在的 "${expressionId}"`);
      }
    }
  }
  for (const requiredType of REQUIRED_QC_CHECKS) {
    if (!qcTypes.has(requiredType)) {
      errors.push(`qualityControl.checks 缺少必需检查 "${requiredType}"`);
    }
  }
  const qcStatus = script.qualityControl.status;
  if (qcStatus === "passed" && qcStatuses.some((status) => status !== "passed")) {
    errors.push("qualityControl.status=passed 时所有检查都必须是 passed");
  }
  if (qcStatus === "failed" && !qcStatuses.includes("failed")) {
    errors.push("qualityControl.status=failed 时至少一项检查必须是 failed");
  }
  if (qcStatus === "pending" && !qcStatuses.includes("pending")) {
    errors.push("qualityControl.status=pending 时至少一项检查必须是 pending");
  }

  return { valid: errors.length === 0, errors, warnings, stats };
};

export const formatValidationReport = (result) => {
  const { stats, errors, warnings } = result;
  const lines = [
    "== Visual Script 2.0 校验报告 ==",
    `概要：segments=${stats.segments} intents=${stats.intents} expressions=${stats.expressions} effects=${stats.effects} resources=${stats.resources}`,
  ];
  if (errors.length > 0) {
    lines.push(`\n✗ error × ${errors.length}`);
    for (const error of errors) lines.push(`  - ${error}`);
  }
  if (warnings.length > 0) {
    lines.push(`\n⚠ warning × ${warnings.length}`);
    for (const warning of warnings) lines.push(`  - ${warning}`);
  }
  if (errors.length === 0 && warnings.length === 0) lines.push("\n✓ 全部检查通过");
  lines.push(errors.length === 0 ? "\n结论：通过" : "\n结论：不通过");
  return lines.join("\n");
};

const main = async () => {
  const input = process.argv[2];
  if (!input) {
    process.stderr.write(
      "用法：node scripts/validate-visual-script.mjs <visual-script.json>\n",
    );
    process.exit(2);
  }
  let script;
  try {
    script = JSON.parse(await readFile(resolve(input), "utf8"));
  } catch (error) {
    process.stderr.write(`无法读取 JSON：${error?.message ?? error}\n`);
    process.exit(1);
  }
  const result = validateVisualScript(script);
  process.stdout.write(`${formatValidationReport(result)}\n`);
  process.exit(result.valid ? 0 : 1);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`校验器异常：${error?.stack ?? error}\n`);
    process.exit(1);
  });
}
