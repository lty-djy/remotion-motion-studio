import type { MotionInstance } from "./local-protocol";

export type ComponentSoundCue = {
  id: string;
  index: number;
  label: string;
  offsetFrames: number;
};

const finiteNumber = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const countFrom = (
  owner: MotionInstance,
  key: string,
  fallback: number,
  minimum = 1,
) =>
  Math.min(
    8,
    Math.max(
      minimum,
      Math.round(finiteNumber(owner.props?.[key], fallback)),
    ),
  );

const cueLabel = (
  owner: MotionInstance,
  index: number,
  keys: string[],
  fallbackPrefix = "步骤",
) => {
  for (const key of keys) {
    const propKey = key.includes("{n}")
      ? key.replace("{n}", String(index + 1))
      : `${key}${index + 1}`;
    const value = owner.props?.[propKey];
    if (typeof value === "string" && value.trim()) {
      return `${fallbackPrefix} ${index + 1} · ${value.trim()}`;
    }
  }
  return `${fallbackPrefix} ${index + 1}`;
};

const buildCues = (
  count: number,
  startFrames: number,
  intervalFrames: number,
  label: (index: number) => string,
): ComponentSoundCue[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `step-${index + 1}`,
    index,
    label: label(index),
    offsetFrames: Math.round(startFrames + index * intervalFrames),
  }));

const buildOffsetCues = (
  offsets: number[],
  label: (index: number) => string,
): ComponentSoundCue[] =>
  offsets.map((offsetFrames, index) => ({
    id: `step-${index + 1}`,
    index,
    label: label(index),
    offsetFrames: Math.round(offsetFrames),
  }));

/**
 * Returns visual event anchors for components whose repeated items enter in stages.
 * The formulas intentionally mirror the component render code so sound cues remain
 * attached when count, animation duration, or per-item interval changes.
 */
export function getComponentSoundCues(
  owner: MotionInstance,
  fps: number,
): ComponentSoundCue[] {
  const safeFps = Math.max(1, Math.round(finiteNumber(fps, 30)));
  const props = owner.props ?? {};

  if (
    owner.componentId === "PortraitToolBadgeList" ||
    owner.componentId === "PortraitStaggeredToolList"
  ) {
    const count = countFrom(owner, "stepCount", 4);
    const enterFrames = Math.max(
      54,
      Math.round(finiteNumber(props.animationSeconds, 2.8) * safeFps),
    );
    const startFrames = Math.round(enterFrames * 0.14);
    const intervalFrames = Math.max(12, Math.round(enterFrames * 0.24));
    const keys =
      owner.componentId === "PortraitToolBadgeList"
        ? ["badge"]
        : ["item"];
    return buildCues(count, startFrames, intervalFrames, (index) =>
      cueLabel(owner, index, keys),
    );
  }

  if (owner.componentId === "PortraitStepNumberList") {
    const count = countFrom(owner, "stepCount", 3);
    const intervalFrames = Math.max(
      0,
      Math.round(
        finiteNumber(props.stepEnterIntervalSeconds, 0.2) * safeFps,
      ),
    );
    return buildCues(count, 0, intervalFrames, (index) =>
      cueLabel(owner, index, ["step"]),
    );
  }

  if (owner.componentId === "TerminalPanel") {
    const count = countFrom(owner, "stepCount", 3);
    const intervalFrames = Math.max(
      0,
      Math.round(finiteNumber(props.itemIntervalSeconds, 0.55) * safeFps),
    );
    return buildCues(count, 10, intervalFrames, (index) =>
      cueLabel(owner, index, ["item"]),
    );
  }

  if (owner.componentId === "PortraitWorkflowPrerequisite") {
    const count = countFrom(owner, "stepCount", 4);
    const totalFrames = Math.max(
      105,
      Math.round(finiteNumber(props.animationSeconds, 3.5) * safeFps),
    );
    const intervalFrames = totalFrames * (count > 4 ? 0.065 : 0.11);
    return buildCues(
      count,
      totalFrames * 0.34,
      intervalFrames,
      (index) => cueLabel(owner, index, ["step"]),
    );
  }

  if (owner.componentId === "PortraitDesignRuleChecklist") {
    const count = countFrom(owner, "ruleCount", 4);
    const totalFrames = Math.max(
      150,
      Math.round(finiteNumber(props.animationSeconds, 8.1) * safeFps),
    );
    const intervalFrames = Math.max(
      0,
      finiteNumber(props.ruleIntervalSeconds, 1.8) * safeFps,
    );
    return buildCues(
      count,
      totalFrames * 0.14,
      intervalFrames,
      (index) => cueLabel(owner, index, ["rule"], "规则"),
    );
  }

  if (owner.componentId === "PortraitSkillStepGrid") {
    const count = countFrom(owner, "stepCount", 4);
    const headerFrames = Math.max(
      6,
      finiteNumber(props.headerEnterSeconds, 0.45) * safeFps,
    );
    const intervalFrames = Math.max(
      0,
      finiteNumber(props.cardEnterIntervalSeconds, 0.16) * safeFps,
    );
    return buildCues(count, headerFrames, intervalFrames, (index) =>
      cueLabel(owner, index, ["step"], "卡片"),
    );
  }

  if (owner.componentId === "PortraitBrowserRepairLoop") {
    const count = countFrom(owner, "stepCount", 6, 2);
    const startFrames = Math.max(
      0,
      finiteNumber(props.firstNodeHighlightSeconds, 0.5) * safeFps,
    );
    const intervalFrames = Math.max(
      1,
      finiteNumber(props.nextNodeHighlightIntervalSeconds, 1.2) * safeFps,
    );
    return buildCues(count, startFrames, intervalFrames, (index) =>
      cueLabel(owner, index, ["step"], "节点"),
    );
  }

  if (owner.componentId === "PortraitRiskWarning") {
    const count = countFrom(owner, "riskCount", 3);
    const enterFrames = Math.max(
      14,
      Math.round(finiteNumber(props.animationSeconds, 0.95) * safeFps),
    );
    const intervalFrames = Math.max(
      Math.max(4, Math.round(enterFrames * 0.18)),
      Math.round(finiteNumber(props.riskIntervalSeconds, 0.45) * safeFps),
    );
    return buildCues(count, enterFrames * 0.34, intervalFrames, (index) =>
      cueLabel(owner, index, ["risk"], "风险"),
    );
  }

  if (owner.componentId === "PortraitCodeDecisionChecklist") {
    const count = countFrom(owner, "questionCount", 6);
    const startFrames = Math.max(
      0,
      finiteNumber(props.firstHighlightSeconds, 0.6) * safeFps,
    );
    const intervalFrames = Math.max(
      1,
      finiteNumber(props.questionIntervalSeconds, 0.9) * safeFps,
    );
    return buildCues(count, startFrames, intervalFrames, (index) =>
      cueLabel(owner, index, ["question"], "问题"),
    );
  }

  if (owner.componentId === "PortraitSkillSourceFusion") {
    const count = countFrom(owner, "sourceCount", 3);
    const totalFrames = Math.max(
      150,
      Math.round(finiteNumber(props.animationSeconds, 8.7) * safeFps),
    );
    const intervalFrames =
      count > 1 ? (totalFrames * 0.68) / (count - 1) : 0;
    return buildCues(count, totalFrames * 0.16, intervalFrames, (index) =>
      cueLabel(owner, index, ["source"], "来源"),
    );
  }

  if (owner.componentId === "PortraitSkillResultComparison") {
    const count = countFrom(owner, "materialCount", 3);
    const firstSwitchFrames = Math.max(
      0,
      finiteNumber(props.firstSwitchSeconds, 3.1) * safeFps,
    );
    const intervalFrames = Math.max(
      0,
      finiteNumber(props.materialIntervalSeconds, 3.5) * safeFps,
    );
    return buildOffsetCues(
      Array.from({ length: count }, (_, index) =>
        index === 0
          ? 0
          : firstSwitchFrames + (index - 1) * intervalFrames,
      ),
      (index) =>
        cueLabel(owner, index, ["material{n}Title", "material{n}Eyebrow"], "素材"),
    );
  }

  if (owner.componentId === "PortraitPromptIterationShowcase") {
    const count = countFrom(owner, "iterationCount", 3);
    const startFrames = Math.max(
      0,
      finiteNumber(props.firstResultSeconds, 3.1) * safeFps,
    );
    const intervalFrames = Math.max(
      0,
      finiteNumber(props.iterationIntervalSeconds, 5.2) * safeFps,
    );
    return buildCues(count, startFrames, intervalFrames, (index) =>
      cueLabel(owner, index, ["iteration{n}Badge", "iteration{n}Prompt"], "改版"),
    );
  }

  return [];
}
