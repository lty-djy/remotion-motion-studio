#!/usr/bin/env node

import { loadRuntimeRegistry } from "./load-runtime-registry.mjs";

const registry = await loadRuntimeRegistry();
const definition = registry.find(
  (entry) => entry.id === "LegacyModelEliminationWarning",
);

if (!definition) throw new Error("效果库缺少旧方案淘汰警告组件。");
if (definition.catalogGroup !== "风险提醒") {
  throw new Error("旧方案淘汰警告没有归入风险提醒分组。");
}
if (definition.category !== "warning" || definition.placement !== "left") {
  throw new Error("旧方案淘汰警告的分类或默认落点错误。");
}
if (definition.bounds?.width !== 900 || definition.bounds?.height !== 420) {
  throw new Error("旧方案淘汰警告的设计边界错误。");
}
if (definition.durationInFrames !== 96) {
  throw new Error("旧方案淘汰警告没有保留原动画的 3.2 秒时长。");
}
if (typeof definition.component !== "function") {
  throw new Error("旧方案淘汰警告没有关联真实 React 组件。");
}

for (const prop of [
  "kicker",
  "title",
  "subtitle",
  "stampText",
  "warningColor",
  "accentColor",
  "panelColor",
  "textColor",
  "animationSeconds",
]) {
  if (!definition.propsSchema?.[prop]) {
    throw new Error(`旧方案淘汰警告缺少可调参数 ${prop}。`);
  }
}

if (definition.arranger) {
  throw new Error("新参考组件尚未验收，不应提前开放给 AI 自动选择。");
}

console.log("✓ 旧方案淘汰警告已作为独立组件归入风险提醒（仅工作台可用）");
