// 从真实运行时 registry 生成 overlay-fx-generator 的组件目录。
// 不要手改 references/component-catalog.md——改组件后重新运行：
//   npm.cmd run sync:arranger-catalog
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { loadRuntimeRegistry } from "../../ai-motion-arranger/scripts/load-runtime-registry.mjs";

const root = resolve(import.meta.dirname, "..", "..");
const outputPath = resolve(
  import.meta.dirname,
  "..",
  "references",
  "component-catalog.md",
);

const INTENT_LABELS = {
  emphasis: "重点强调",
  metric: "数字展示",
  comparison: "对比差异",
  list: "列举要点",
  process: "流程说明",
  explanation: "概念解释",
  warning: "风险提醒",
  evidence: "案例与素材",
  transition: "章节转场",
  "call-to-action": "行动引导",
};

const intentLabel = (intentId) =>
  INTENT_LABELS[intentId] ?? (intentId ? String(intentId) : "—");

/** 常驻层组件：不计入密度/多样性指标，其余内容组件照常参与编排约束。 */
const RESIDENT_COMPONENT_IDS = new Set([
  "ChapterBar",
  "SrtSemanticCaptions",
  "SrtCueText",
  "PinBoard",
]);

const formatFrameDuration = (frames, fps) => `${frames} 帧（约 ${Math.round((frames / fps) * 10) / 10} 秒）`;

const renderProps = (definition) => {
  const schema = definition.propsSchema ?? {};
  const entries = Object.entries(schema);
  if (entries.length === 0) return "- 可编排 props：无";
  const lines = entries.map(([key, field]) => {
    const label = typeof field?.label === "string" ? field.label : "";
    const type = typeof field?.type === "string" ? field.type : "text";
    const suffix = [];
    if (type === "color") suffix.push("color");
    if (typeof field?.min === "number" && typeof field?.max === "number") {
      suffix.push(`${field.min}–${field.max}`);
    }
    const meta = suffix.length > 0 ? `（${suffix.join(" · ")}）` : "";
    return `- \`${key}\` — ${label}${meta}`;
  });
  return ["- 可编排 props：", ...lines].join("\n");
};

const renderComponent = (definition, fps) => {
  const semantic = definition.semantic ?? {};
  const primary = semantic.primaryIntent
    ? intentLabel(semantic.primaryIntent)
    : semantic.systemRole
      ? `系统角色：${semantic.systemRole}`
      : "—";
  const secondary = (semantic.secondaryIntents ?? []).map(intentLabel).join("、");
  const keywords = (semantic.keywords ?? []).join("、");
  const duration = semantic.durationSeconds ?? { min: 1.5, max: 6 };
  const position = definition.defaultPosition ?? { x: 0, y: 0, scale: 1 };
  const bounds = definition.bounds ?? { width: 0, height: 0 };
  const resident = RESIDENT_COMPONENT_IDS.has(definition.id);
  const lines = [
    `### \`${definition.id}\` · ${definition.name}`,
    "",
    `- 用途：${definition.description ?? ""}`,
    `- 主要语义：${primary}${secondary ? `；次要：${secondary}` : ""}`,
    `- 何时使用（检索词）：${keywords || "—"}`,
    `- 画布方向：${semantic.orientation ?? "any"}；密度：${semantic.density ?? "medium"}；建议驻留：${duration.min}–${duration.max} 秒`,
    `- 默认落位：x=${position.x}，y=${position.y}，scale=${position.scale}（占位 ${bounds.width}×${bounds.height}，placement=${definition.placement}）`,
    `- 默认时长：${formatFrameDuration(definition.durationInFrames ?? 120, fps)}`,
    `- 分组：${definition.catalogGroup ?? "未分组"}${resident ? "；**常驻层**（不计密度/多样性）" : ""}`,
    "",
    renderProps(definition),
    "",
  ];
  return lines.join("\n");
};

const main = async () => {
  const registry = await loadRuntimeRegistry();
  if (!Array.isArray(registry) || registry.length === 0) {
    throw new Error("运行时效果库为空。");
  }
  const fps = 30;
  const groups = new Map();
  for (const definition of registry) {
    const group = definition.catalogGroup ?? "未分组";
    const list = groups.get(group) ?? [];
    list.push(definition);
    groups.set(group, list);
  }

  const overview = registry.map((definition) => {
    const semantic = definition.semantic ?? {};
    const primary = semantic.primaryIntent
      ? intentLabel(semantic.primaryIntent)
      : semantic.systemRole ?? "—";
    const resident = RESIDENT_COMPONENT_IDS.has(definition.id) ? "常驻" : "";
    return `| \`${definition.id}\` | ${definition.name} | ${definition.catalogGroup ?? ""} | ${primary} | ${semantic.orientation ?? "any"} | ${resident} |`;
  });

  const lines = [
    "# 组件目录（自动生成）",
    "",
    `> 由 \`npm.cmd run sync:arranger-catalog\` 从真实运行时 registry（${registry.length} 个组件）生成。`,
    "> 不要手改本文件；组件有增删改后重新运行同步命令。",
    "",
    "编排大脑（`../SKILL.md`）**只能使用本目录登记的 componentId**，",
    "**props 只允许填写下面各组件列出的字段名**。任何不在目录中的 id / 字段都是非法输出。",
    "",
    "颜色类 props（标 color）默认**不要填写**：组件自带调试好的默认色，工作台导入时会用用户已调好的主色覆盖。确需填写时才从组件 defaultProps 的既有取值中选择，禁止发明新 hex。",
    "",
    "## 快速索引",
    "",
    "| componentId | 名称 | 分组 | 主要语义 | 方向 | 角色 |",
    "| --- | --- | --- | --- | --- | --- |",
    ...overview,
    "",
    "## 核心语义图例",
    "",
    ...Object.entries(INTENT_LABELS).map(
      ([id, label]) => `- **${label}**（\`${id}\`）`,
    ),
    "",
  ];

  for (const [group, definitions] of groups) {
    lines.push(`## ${group}`, "");
    for (const definition of definitions) {
      lines.push(renderComponent(definition, fps));
    }
  }

  lines.push(
    "## 编排建议（人工维护，随目录一起读）",
    "",
    "- 先按内容结构、素材条件及 SKILL §6.1 的选择边界选卡；普通分组仅用于浏览，不作为语义条件。在同样适合的候选中考虑视觉多样性。",
    "- 竖屏口播优先选 `方向：portrait` 的组件；横屏或 `any` 组件在竖屏使用时注意默认落位是否越界。",
    "- 一个语义段落通常 1 张主卡 + 0–2 张辅助卡；各卡承载不同信息。数字、对比、流程按实际内容和字段能力选择，不为了凑卡补造数字、目标或证据。",
    "",
  );

  await mkdir(resolve(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, `${lines.join("\n").trimEnd()}\n`, "utf8");
  console.log(
    `已生成 ${outputPath}（${registry.length} 个组件，${groups.size} 个分组）`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
