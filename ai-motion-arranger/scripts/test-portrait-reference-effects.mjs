#!/usr/bin/env node

import { build } from "esbuild";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const registryPath = resolve(root, "registry.ts");

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
if (!code) throw new Error("无法编译运行时效果库。");

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
if (!Array.isArray(registry)) throw new Error("效果库没有导出有效数组。");

const expected = [
  {
    id: "PortraitChapterRail",
    placement: "top",
    bounds: [520, 116],
    props: ["title", "subtitle", "accentColor", "textColor", "animationSeconds"],
  },
  {
    id: "PortraitKeywordBurst",
    placement: "top",
    bounds: [940, 260],
    props: [
      "word1",
      "word2",
      "word3",
      "highlightIndex",
      "accentColor",
      "textColor",
      "shadowColor",
      "animationSeconds",
    ],
  },
  {
    id: "PortraitInfoCallout",
    placement: "right",
    bounds: [430, 230],
    props: [
      "eyebrow",
      "title",
      "detail",
      "note",
      "iconText",
      "accentColor",
      "panelColor",
      "textColor",
      "animationSeconds",
    ],
  },
  {
    id: "PortraitMetricDecision",
    placement: "left",
    bounds: [410, 390],
    props: [
      "lead",
      "conclusion",
      "metricLabel",
      "value",
      "unit",
      "verdict",
      "accentColor",
      "panelColor",
      "textColor",
      "animationSeconds",
    ],
  },
  {
    id: "PortraitDecisionTagStack",
    placement: "right",
    bounds: [330, 228],
    props: [
      "tag1",
      "tag2",
      "tag3",
      "symbol1",
      "symbol2",
      "symbol3",
      "accentColor",
      "panelColor",
      "textColor",
      "animationSeconds",
    ],
  },
  {
    id: "PortraitStepChecklist",
    placement: "right",
    bounds: [520, 420],
    props: [
      "eyebrow",
      "title",
      "subtitle",
      "step1",
      "step2",
      "step3",
      "icon1",
      "icon2",
      "icon3",
      "accentColor",
      "successColor",
      "panelColor",
      "textColor",
      "animationSeconds",
    ],
  },
  {
    id: "PortraitRiskWarning",
    placement: "left",
    bounds: [500, 420],
    props: [
      "eyebrow",
      "title",
      "emphasis",
      "risk1",
      "risk2",
      "risk3",
      "icon1",
      "icon2",
      "icon3",
      "accentColor",
      "panelColor",
      "textColor",
      "animationSeconds",
    ],
  },
];

for (const expectation of expected) {
  const definition = registry.find((entry) => entry.id === expectation.id);
  if (!definition) throw new Error(`效果库缺少 ${expectation.id}。`);
  if (definition.catalogGroup !== "竖屏口播信息层") {
    throw new Error(`${expectation.id} 未进入竖屏口播信息层分组。`);
  }
  if (definition.placement !== expectation.placement) {
    throw new Error(`${expectation.id} 默认落点错误。`);
  }
  if (
    definition.bounds?.width !== expectation.bounds[0] ||
    definition.bounds?.height !== expectation.bounds[1]
  ) {
    throw new Error(`${expectation.id} 设计边界错误。`);
  }
  if (typeof definition.component !== "function") {
    throw new Error(`${expectation.id} 没有关联真实 React 组件。`);
  }
  for (const prop of expectation.props) {
    if (!definition.propsSchema?.[prop]) {
      throw new Error(`${expectation.id} 缺少可调参数 ${prop}。`);
    }
  }
  if (definition.arranger) {
    throw new Error(`${expectation.id} 尚未验收，不应提前开放给 AI 自动选择。`);
  }
}

console.log(
  `✓ 竖屏参考效果通过：${expected.map((entry) => entry.id).join(" + ")}（仅工作台可用）`,
);
