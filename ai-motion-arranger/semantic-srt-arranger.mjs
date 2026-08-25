const MAX_INTENTS_PER_CUE = 3;

const INTENT_RULES = [
  {
    id: "performance",
    type: "metric",
    label: "性能与速度",
    subtitle: "SEMANTIC / PERFORMANCE",
    match: /吞吐|速度|性能|延迟|效率|加速|耗时|帧率|实时/iu,
    componentId: "WaveformMetric",
    iconId: "speed",
    sfxId: "whoosh-soft",
    accentColor: "#55e6ff",
    fallbackValue: "128/s",
    anchor: "left-center",
    iconAnchor: "left-top",
  },
  {
    id: "process",
    type: "process",
    label: "流程与步骤",
    subtitle: "SEMANTIC / PROCESS",
    match: /流程|步骤|首先|然后|接着|最后|时间线|轨道|插入|编排/iu,
    componentId: "SegmentedMeter",
    iconId: "timeline",
    sfxId: "tick",
    accentColor: "#ffbd66",
    fallbackValue: "03",
    anchor: "right-center",
    iconAnchor: "right-top",
  },
  {
    id: "automation",
    type: "instruction",
    label: "代码与自动化",
    subtitle: "SEMANTIC / AUTOMATION",
    match: /代码|JSON|API|模型|AI|自动化|自动生成|语义分析|智能识别/iu,
    componentId: "RadialTicks",
    iconId: "code",
    sfxId: "whoosh-soft",
    accentColor: "#a879ff",
    fallbackValue: "AI",
    anchor: "left-top",
    iconAnchor: "left-bottom",
  },
  {
    id: "comparison",
    type: "comparison",
    label: "对比与差异",
    subtitle: "SEMANTIC / COMPARISON",
    match: /对比|相比|较之前|高于|低于|优于|不如|\bvs\b|从.{1,20}到/iu,
    componentId: "DualMetricBar",
    iconId: "arrow",
    sfxId: "impact",
    accentColor: "#a879ff",
    fallbackValue: "+42%",
    anchor: "right-center",
    iconAnchor: "right-top",
  },
  {
    id: "completion",
    type: "conclusion",
    label: "完成度与结果",
    subtitle: "SEMANTIC / COMPLETION",
    match: /完成率|完成度|达成|完成了|已经完成|成功率/iu,
    componentId: "ProgressRing",
    iconId: "arrow",
    sfxId: "impact",
    accentColor: "#8fe388",
    fallbackValue: "92%",
    anchor: "left-center",
    iconAnchor: "left-top",
  },
  {
    id: "coverage",
    type: "metric",
    label: "覆盖与占比",
    subtitle: "SEMANTIC / COVERAGE",
    match: /覆盖率|覆盖了|占比|存量|渗透率|容量/iu,
    componentId: "LiquidGauge",
    iconId: "speed",
    sfxId: "tick",
    accentColor: "#55d6c2",
    fallbackValue: "68%",
    anchor: "right-center",
    iconAnchor: "right-top",
  },
  {
    id: "deadline",
    type: "transition",
    label: "倒计时与截止",
    subtitle: "SEMANTIC / COUNTDOWN",
    match: /倒计时|截止|剩余|还剩|最后.{0,4}(?:秒|分钟|小时|天)/iu,
    componentId: "Countdown",
    iconId: "timeline",
    sfxId: "tick",
    accentColor: "#ff7e9f",
    fallbackValue: "03",
    anchor: "left-top",
    iconAnchor: "left-bottom",
  },
  {
    id: "emphasis",
    type: "emphasis",
    label: "重点与结论",
    subtitle: "SEMANTIC / EMPHASIS",
    match: /重点|注意|必须|核心|关键|结论|总结|记住/iu,
    componentId: "RadialTicks",
    iconId: "arrow",
    sfxId: "impact",
    accentColor: "#ffbd66",
    fallbackValue: "01",
    anchor: "right-top",
    iconAnchor: "right-bottom",
  },
  {
    id: "number",
    type: "metric",
    label: "数字指标",
    subtitle: "SEMANTIC / METRIC",
    match: /\d+(?:[.,]\d+)?\s*(?:%|％|万|亿|倍|k|K|元|年|天|小时|分钟|秒)?/u,
    componentId: "FlipCounter",
    iconId: "speed",
    sfxId: "tick",
    accentColor: "#55e6ff",
    fallbackValue: "01",
    anchor: "left-center",
    iconAnchor: "left-top",
    generic: true,
  },
];

const firstNumber = (text) => {
  const match = text.match(
    /[+-]?\d+(?:[.,]\d+)?\s*(?:%|％|万|亿|倍|k|K|元|年|天|小时|分钟|秒|ms|fps)?/iu,
  );
  return match ? match[0].replace(/\s+/g, "") : null;
};
const textParts = (text) => {
  const parts = text
    .split(/[，,。！？!?…；;：:]/u)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
};

const shorten = (text, length = 18) =>
  text.length > length ? `${text.slice(0, length)}…` : text;

const availableResource = (resourceIndex, library, resourceId) => {
  const entries = resourceIndex?.libraries?.[library];
  return Array.isArray(entries)
    ? entries.find((entry) => entry?.id === resourceId) ?? null
    : null;
};

const spanForIntent = (startFrame, endFrame, index, count) => {
  const cueFrames = Math.max(3, endFrame - startFrame);
  if (count === 1) return { startFrame, endFrame };
  const overlapRatio = count === 2 ? 0.66 : 0.56;
  const spanFrames = Math.max(12, Math.round(cueFrames * overlapRatio));
  const lastStart = Math.max(startFrame, endFrame - spanFrames);
  const offset = Math.round(((lastStart - startFrame) * index) / (count - 1));
  const intentStart = startFrame + offset;
  return {
    startFrame: intentStart,
    endFrame: Math.max(intentStart + 3, Math.min(endFrame, intentStart + spanFrames)),
  };
};

const iconPosition = (canvas, index) => {
  const portrait = canvas.orientation === "portrait";
  const size = portrait ? 132 : 118;
  const positions = portrait
    ? [
        { x: 72, y: 170 },
        { x: canvas.width - size - 72, y: 170 },
        { x: 72, y: 1080 },
      ]
    : [
        { x: 96, y: 96 },
        { x: canvas.width - size - 96, y: 96 },
        { x: canvas.width - size - 96, y: canvas.height - size - 96 },
      ];
  return { ...positions[index % positions.length], width: size, height: size, scale: 1, zIndex: 35 };
};

const qualityControl = () => ({
  status: "pending",
  checks: [
    { type: "face-occlusion", status: "pending", affectedExpressionIds: [] },
    { type: "caption-occlusion", status: "pending", affectedExpressionIds: [] },
    { type: "asset-availability", status: "pending", affectedExpressionIds: [] },
    { type: "voice-masking", status: "pending", affectedExpressionIds: [] },
    { type: "timeline-bounds", status: "pending", affectedExpressionIds: [] },
  ],
});

export const buildSemanticSrtArrangement = ({
  entries,
  fps,
  durationInFrames,
  canvas,
  availableComponentIds,
  resourceIndex,
}) => {
  const componentIds = new Set(availableComponentIds);
  const motionTimeline = [];
  const resourceTracks = [];
  const cueAnalyses = [];
  const messages = [];
  let intentCount = 0;
  let trackOrder = 0;

  for (const entry of entries) {
    const matched = INTENT_RULES.filter(
      (rule) => componentIds.has(rule.componentId) && rule.match.test(entry.text),
    );
    const contextual = matched.filter((rule) => !rule.generic);
    const selectedRules = (contextual.length > 0 ? contextual : matched).slice(
      0,
      MAX_INTENTS_PER_CUE,
    );
    const startFrame = Math.max(0, Math.round((entry.startMs / 1000) * fps));
    const endFrame = Math.max(
      startFrame + 3,
      Math.round((entry.endMs / 1000) * fps),
    );
    const detected = [];

    selectedRules.forEach((rule, ruleIndex) => {
      const sequence = String(entry.index).padStart(3, "0");
      const intentId = `intent-${sequence}-${rule.id}`;
      const expressionId = `effect-${sequence}-${rule.id}`;
      const timing = spanForIntent(
        startFrame,
        endFrame,
        ruleIndex,
        selectedRules.length,
      );
      const parts = textParts(entry.text);
      const value = firstNumber(entry.text) ?? rule.fallbackValue;
      const animationSeconds = Math.max(
        0.4,
        Math.min(1.6, Number(((timing.endFrame - timing.startFrame) / fps / 2).toFixed(2))),
      );
      motionTimeline.push({
        componentId: rule.componentId,
        startFrame: timing.startFrame,
        durationInFrames: timing.endFrame - timing.startFrame,
        laneId: `motion-${sequence}-${rule.id}`,
        trackOrder: trackOrder++,
        visible: true,
        sourceStartFrame: 0,
        backgroundOpacity: 0,
        props: {
          title: rule.label,
          subtitle: rule.subtitle,
          value,
          item1: shorten(parts[0] ?? entry.text, 22),
          item2: shorten(parts[1] ?? "人工确认后插入", 22),
          item3: shorten(parts[2] ?? "仍可继续微调", 22),
          animationSeconds,
          accentColor: rule.accentColor,
          secondaryColor: "#7a7d84",
        },
        sourceExpressionId: expressionId,
        sourceIntentId: intentId,
        layoutIntent: {
          anchor: rule.anchor,
          avoid: ["face", "captions", "ui-safe-area"],
          collisionPolicy: "relocate-then-scale",
        },
      });

      const icon = availableResource(resourceIndex, "icons", rule.iconId);
      if (icon) {
        const iconId = `icon-${sequence}-${rule.id}`;
        resourceTracks.push({
          id: `resource-${iconId}`,
          laneId: iconId,
          trackOrder: trackOrder++,
          kind: "icon",
          resourceId: icon.id,
          name: `${icon.label} · ${rule.label}`,
          url: icon.url,
          mimeType: icon.mimeType,
          sourceStartFrame: 0,
          sourceDurationInFrames: timing.endFrame - timing.startFrame,
          startFrame: Math.min(timing.endFrame - 3, timing.startFrame + 3),
          durationInFrames: Math.max(3, timing.endFrame - Math.min(timing.endFrame - 3, timing.startFrame + 3)),
          visible: true,
          position: iconPosition(canvas, ruleIndex),
          volume: 1,
          voiceDucking: 0,
          sourceExpressionId: iconId,
          sourceIntentId: intentId,
          layoutIntent: {
            anchor: rule.iconAnchor,
            avoid: ["face", "captions", "ui-safe-area"],
            collisionPolicy: "relocate-then-scale",
          },
        });
      }

      const sfx = availableResource(resourceIndex, "sfx", rule.sfxId);
      if (sfx) {
        const sfxId = `sfx-${sequence}-${rule.id}`;
        const audioFrames = Math.max(
          3,
          Math.round(Number(sfx.media?.durationSeconds ?? 0.2) * fps),
        );
        resourceTracks.push({
          id: `resource-${sfxId}`,
          laneId: sfxId,
          trackOrder: trackOrder++,
          kind: "sfx",
          resourceId: sfx.id,
          name: `${sfx.label} · ${rule.label}`,
          url: sfx.url,
          mimeType: sfx.mimeType,
          sourceStartFrame: 0,
          sourceDurationInFrames: audioFrames,
          startFrame: timing.startFrame,
          durationInFrames: Math.min(audioFrames, timing.endFrame - timing.startFrame),
          visible: true,
          position: { x: 0, y: 0, width: 1, height: 1, scale: 1, zIndex: 0 },
          volume: 0.3,
          voiceDucking: 0.72,
          sourceExpressionId: sfxId,
          sourceIntentId: intentId,
        });
      }

      detected.push({ id: intentId, type: rule.type, label: rule.label, componentId: rule.componentId });
      intentCount += 1;
    });

    if (matched.length > selectedRules.length) {
      messages.push(
        `字幕 ${entry.index} 命中 ${matched.length} 个意图，仅保留优先级最高的 ${MAX_INTENTS_PER_CUE} 个，避免画面过载。`,
      );
    }
    if (detected.length === 0) {
      messages.push(`字幕 ${entry.index} 未发现需要视觉强化的明确语义，已保留口播但不添加效果。`);
    }
    cueAnalyses.push({
      cueIndex: entry.index,
      text: entry.text,
      startFrame,
      endFrame,
      intents: detected,
    });
  }

  const matchedCueCount = cueAnalyses.filter((cue) => cue.intents.length > 0).length;
  const skippedCueCount = cueAnalyses.length - matchedCueCount;
  const maxEndFrame = Math.max(
    durationInFrames,
    ...entries.map((entry) => Math.round((entry.endMs / 1000) * fps)),
  );
  const semanticAnalysis = {
    cueCount: entries.length,
    matchedCueCount,
    skippedCueCount,
    intentCount,
    motionCount: motionTimeline.length,
    resourceCount: resourceTracks.length,
    cueAnalyses,
    messages,
  };

  return {
    timelineVersion: "2.0",
    generatedBy: "semantic-srt-arranger/1",
    project: {
      fps,
      durationInFrames: maxEndFrame,
      canvas,
      resourceCatalog: { root: "public/input", indexVersion: String(resourceIndex?.indexVersion ?? "1") },
    },
    semanticAnalysis,
    qualityControl: qualityControl(),
    applyPolicy: {
      previewBeforeApply: true,
      requireUserConfirmation: true,
      existingTimeline: "preserve",
    },
    motionTimeline,
    resourceTracks,
  };
};
