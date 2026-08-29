#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { buildSemanticSrtArrangement } from "../semantic-srt-arranger.mjs";
import { PORTRAIT_ROUTE_COMPONENT_IDS } from "../portrait-semantic-routes.mjs";
import { loadRuntimeRegistry } from "./load-runtime-registry.mjs";

const parseTimestamp = (raw) => {
  const match = String(raw)
    .trim()
    .match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/u);
  if (!match) return null;
  return (
    Number(match[1]) * 3_600_000 +
    Number(match[2]) * 60_000 +
    Number(match[3]) * 1_000 +
    Number(match[4].padEnd(3, "0"))
  );
};

const parseSrt = (content) =>
  content
    .replace(/\r\n/gu, "\n")
    .trim()
    .split(/\n\s*\n+/gu)
    .flatMap((block, position) => {
      const lines = block.split("\n").filter((line) => line.trim());
      const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
      if (timeLineIndex < 0) return [];
      const [rawStart, rawEnd] = lines[timeLineIndex].split("-->");
      const startMs = parseTimestamp(rawStart);
      const endMs = parseTimestamp(rawEnd);
      const text = lines
        .slice(timeLineIndex + 1)
        .join("")
        .replace(/\s+/gu, " ")
        .trim();
      if (startMs === null || endMs === null || endMs <= startMs || !text) {
        return [];
      }
      return [{ index: position + 1, startMs, endMs, text }];
    });

const formatTimestamp = (milliseconds) => {
  const totalSeconds = Math.max(0, milliseconds) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds
    .toFixed(3)
    .padStart(6, "0")}`;
};

const HEURISTIC_REVIEW_SIGNALS = Object.freeze([
  {
    intent: "数字展示",
    pattern: /\d[\d,.]*\s*(?:%|％|倍|块|元|件|小时|分钟|秒|万|亿)?|(?:几万|多倍)/u,
  },
  {
    intent: "风险提醒",
    pattern:
      /致癌|超标|不达标|不含|骗人|皮炎|红肿|流脓|伤害|假货|投诉|治病|不划算|不掉色|露馅|不敢|离谱/u,
  },
  {
    intent: "案例与素材",
    pattern: /央视|检测|抽检|样品|医院|接诊|患者|发现|国家标准|证据/u,
  },
  {
    intent: "流程说明",
    pattern: /认准|去正规|先在|试戴|保留证据|投诉|第一|然后|最后/u,
  },
  {
    intent: "重点强调",
    pattern: /竟然|更狠|压根|根本|全是|保证|真不|还敢|你知道吗/u,
  },
]);

const NON_METRIC_IDENTIFIER_PATTERN =
  /(?:GB\s*\d+|国家标准.{0,4}\d+|\d{5,}\s*(?:投诉|举报|热线|电话)|(?:试戴|等待|静置|浸泡|使用).{0,8}\d+(?:小时|分钟|天))/iu;

const inferredReviewSignals = (text) =>
  HEURISTIC_REVIEW_SIGNALS.filter(
    (signal) =>
      signal.pattern.test(text) &&
      !(signal.intent === "数字展示" && NON_METRIC_IDENTIFIER_PATTERN.test(text)) &&
      !(
        signal.intent === "案例与素材" &&
        /(?:保留|保存|收集).{0,3}证据/u.test(text)
      ) &&
      !(
        signal.intent === "流程说明" &&
        /最后(?:可能|也许|恐怕|要|会)/u.test(text)
      ),
  ).map((signal) => signal.intent);

const renderAudit = ({ inputPath, entries, result, definitions }) => {
  const definitionNames = new Map(
    definitions.map((definition) => [definition.id, definition.name]),
  );
  const analyses = result.semanticAnalysis.cueAnalyses;
  const rows = analyses.map((analysis) => {
    const intents = analysis.intents ?? [];
    const suppressedIntents = analysis.suppressedIntents ?? [];
    const allIntents = [...intents, ...suppressedIntents];
    const selected = intents.flatMap((intent) => intent.componentIds ?? []);
    const candidates = allIntents.flatMap((intent) =>
      (intent.componentCandidates ?? []).map((candidate) =>
        definitionNames.get(candidate.componentId) ?? candidate.componentId,
      ),
    );
    const heuristicSignals = inferredReviewSignals(analysis.text);
    const detected = allIntents.map((intent) => intent.label);
    const needsReview =
      heuristicSignals.length > 0 &&
      heuristicSignals.some((signal) => {
        if (signal === "数字展示") return !detected.includes("数字决策");
        if (signal === "风险提醒") return !detected.includes("风险与限制");
        if (signal === "流程说明") {
          return !detected.includes("操作流程") && !detected.includes("行动建议");
        }
        if (signal === "案例与素材") return !detected.includes("检测与证据");
        if (signal === "重点强调") return false;
        return false;
      });
    return {
      ...analysis,
      detected,
      selected: selected.map((id) => definitionNames.get(id) ?? id),
      candidates: [...new Set(candidates)],
      suppressed: suppressedIntents.map((intent) => intent.label),
      heuristicSignals,
      needsReview,
    };
  });
  const reviewRows = rows.filter((row) => row.needsReview);
  const skippedRows = rows.filter((row) => row.intents.length === 0);
  const durationSeconds = entries.at(-1).endMs / 1000;
  const secondsPerMotion =
    result.motionTimeline.length > 0
      ? durationSeconds / result.motionTimeline.length
      : durationSeconds;
  const densityReview = secondsPerMotion < 2.5;
  const lines = [
    "# SRT 语义与选效校准报告",
    "",
    `- 来源：\`${inputPath}\``,
    `- 原始字幕：${entries.length} 条`,
    `- 合并后语义段：${result.semanticAnalysis.semanticSegmentCount} 段`,
    `- 已识别语义段：${result.semanticAnalysis.matchedSegmentCount} 段`,
    `- 进入预览语义段：${result.semanticAnalysis.appliedSegmentCount} 段`,
    `- 未添加效果：${result.semanticAnalysis.skippedSegmentCount} 段`,
    `- 检测意图：${result.semanticAnalysis.detectedIntentCount} 个`,
    `- 进入预览意图：${result.semanticAnalysis.intentCount} 个`,
    `- 密度抑制意图：${result.semanticAnalysis.suppressedIntentCount} 个`,
    `- 生成动效：${result.motionTimeline.length} 个`,
    `- 平均动效间隔：${secondsPerMotion.toFixed(1)} 秒${densityReview ? " ⚠" : ""}`,
    `- 疑似需复核：${reviewRows.length} 段`,
    "",
    "> “当前识别”来自工作台现有确定性语义路由；“校准提示”只用于发现可能的漏识别，不是最终答案。",
    "",
    "## 逐段审核",
    "",
    "| 时间 / 来源字幕 | 合并后的内容 | 当前识别 | 首选效果 | 密度抑制 | 其他候选 | 校准提示 |",
    "|---|---|---|---|---|---|---|",
    ...rows.map((row) => {
      const source = row.sourceCueIndices?.join("、") ?? row.cueIndex;
      const time = `${formatTimestamp(row.startFrame / 30 * 1000)}–${formatTimestamp(row.endFrame / 30 * 1000)}`;
      return `| ${time}<br>${source} | ${row.text.replace(/\|/gu, "\\|")} | ${row.detected.join("、") || "未识别"} | ${row.selected.join("、") || "不添加"} | ${row.suppressed.join("、") || "—"} | ${row.candidates.join("、") || "—"} | ${row.heuristicSignals.join("、") || "—"}${row.needsReview ? " ⚠" : ""} |`;
    }),
    "",
    "## 第一轮问题汇总",
    "",
    `- 当前有 ${skippedRows.length}/${rows.length} 个语义段没有效果进入预览，但被抑制的意图仍保留在分析结果中。`,
    reviewRows.length > 0
      ? `- ${reviewRows.length} 个语义段含有明显信号，但当前语义结果可能没有完整覆盖。`
      : "- 启发式复核没有发现明显漏识别。",
    densityReview
      ? `- 当前约每 ${secondsPerMotion.toFixed(1)} 秒出现一个动效，仍属于高密度候选，应继续人工删减。`
      : `- 密度预算已把预览控制为约每 ${secondsPerMotion.toFixed(1)} 秒一个动效。`,
    reviewRows.length > 0
      ? "- 剩余警告行需要判断是规则仍有漏识别，还是该段本来就应该保持安静。"
      : "- 当前规则已经覆盖本轮校准提示，下一步应重点审核视觉密度和组件选择。",
    reviewRows.length > 0
      ? "- 本轮仍应先修正漏识别，再考虑增加组件；已有组件语义能力已经能参与候选排序。"
      : "- 本轮未发现明显漏识别，下一步优先人工审核主效果取舍与实际画面遮挡，不需要继续扩充语义标签。",
    "",
    "## 建议审核方式",
    "",
    "只需在需要调整的行旁标记：`识别错了`、`漏了语义`、`效果太多` 或 `本段不应加效果`。无需重新为组件定义标签。",
    "",
  ];
  return `${lines.join("\n").trimEnd()}\n`;
};

const inputPath = process.argv[2] ? resolve(process.argv[2]) : null;
const outputPath = process.argv[3]
  ? resolve(process.argv[3])
  : inputPath
    ? resolve(
        "ai-motion-arranger",
        "calibration",
        `${basename(inputPath).replace(/\.srt$/iu, "")}-semantic-audit.md`,
      )
    : null;

if (!inputPath || !outputPath) {
  throw new Error(
    "用法：node calibrate-srt-semantics.mjs <input.srt> [output.md]",
  );
}

const [content, resourceIndexText, definitions] = await Promise.all([
  readFile(inputPath, "utf8"),
  readFile(resolve("public", "input", "resource-index.json"), "utf8"),
  loadRuntimeRegistry(),
]);
const entries = parseSrt(content);
if (entries.length === 0) throw new Error("SRT 中没有有效字幕条目");
const resourceIndex = JSON.parse(resourceIndexText);
const durationInFrames = Math.max(
  3,
  Math.ceil((entries.at(-1).endMs / 1000) * 30),
);
const capabilities = definitions
  .filter((definition) => PORTRAIT_ROUTE_COMPONENT_IDS.includes(definition.id))
  .map((definition) => ({
    componentId: definition.id,
    semantic: definition.semantic,
  }));
const result = buildSemanticSrtArrangement({
  entries,
  fps: 30,
  durationInFrames,
  canvas: { width: 1080, height: 1920, orientation: "portrait" },
  availableComponentIds: PORTRAIT_ROUTE_COMPONENT_IDS,
  componentCapabilities: capabilities,
  resourceIndex,
});
const report = renderAudit({ inputPath, entries, result, definitions });
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, report, "utf8");

console.log(
  `✓ SRT 校准报告已生成：cues=${entries.length} segments=${result.semanticAnalysis.semanticSegmentCount} intents=${result.semanticAnalysis.intentCount} output=${outputPath}`,
);
