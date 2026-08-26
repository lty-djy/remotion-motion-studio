import {
  PORTRAIT_ROUTING_POLICY,
  PORTRAIT_SEMANTIC_ROUTES,
} from "./portrait-semantic-routes.mjs";
import {
  mergeSrtEntriesForSemanticAnalysis,
  summarizeSrtSemanticMerge,
} from "./srt-semantic-merger.mjs";

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

const spanForPortraitIntent = (startFrame, endFrame, index, count) => {
  if (count === 1) return { startFrame, endFrame };
  const cueFrames = Math.max(count * 3, endFrame - startFrame);
  const slotStart = Math.round(startFrame + (cueFrames * index) / count);
  const slotEnd =
    index === count - 1
      ? endFrame
      : Math.round(startFrame + (cueFrames * (index + 1)) / count);
  return {
    startFrame: Math.max(startFrame, slotStart),
    endFrame: Math.max(slotStart + 3, Math.min(endFrame, slotEnd)),
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

const buildLegacySemanticSrtArrangement = ({
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

const portraitRouteMatchResult = (route, text) => {
  let score = 0;
  const signals = [];
  const matchedKeywords = route.match.anyKeywords.filter((keyword) =>
    text.includes(keyword),
  );
  for (const keyword of matchedKeywords) {
    score += 1;
    signals.push({ type: "keyword", label: keyword, weight: 1 });
  }
  for (const patternSource of route.match.patternSources) {
    if (!new RegExp(patternSource, "iu").test(text)) continue;
    score += 2;
    signals.push({ type: "pattern", label: patternSource, weight: 2 });
  }
  for (const boost of route.match.boosts ?? []) {
    if (!new RegExp(boost.patternSource, "iu").test(text)) continue;
    score += boost.weight;
    signals.push({ type: "boost", label: boost.label, weight: boost.weight });
  }
  for (const suppressor of route.match.suppressors ?? []) {
    if (!new RegExp(suppressor.patternSource, "iu").test(text)) continue;
    score -= suppressor.weight;
    signals.push({
      type: "suppressor",
      label: suppressor.label,
      weight: -suppressor.weight,
    });
  }
  const minimumScore = route.match.minimumScore ?? 1;
  return {
    matched: signals.some((signal) => signal.weight > 0) && score >= minimumScore,
    score,
    minimumScore,
    signals,
  };
};

const uniqueText = (values) =>
  [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];

const listFragments = (text) =>
  uniqueText(
    text
      .split(/[，,。！？!?…；;：:、]|(?:以及|并且|同时|而且)/u)
      .map((part) => part.trim())
      .filter((part) => part.length > 1),
  );

const sequenceFragments = (text) => {
  const markerSource = "(?:首先|第一步|然后|第二步|接着|第三步|最后)";
  const hasMarker = new RegExp(markerSource, "u").test(text);
  const parts = text
    .split(new RegExp(`${markerSource}[，,:：]?`, "u"))
    .map((part) => part.replace(/[。！？!?；;]+$/u, "").trim())
    .filter(Boolean);
  return uniqueText(hasMarker ? parts.slice(1) : listFragments(text));
};

const riskFragments = (text) => {
  const tail = text
    .replace(/^.*?(?:但是|不过|注意)[，,:：]?/u, "")
    .replace(/^.*?(?:只会|将会|可能会|容易|导致)[，,:：]?/u, "");
  return uniqueText(
    tail
      .split(/[、，,。；;]|(?:以及|并且|同时|和)/u)
      .map((part) =>
        part
          .replace(/^(?:它|这|高清放大)?(?:不能|无法|不会)(?:修复|解决|避免)?/u, "")
          .trim(),
      )
      .filter((part) => part.length > 1),
  );
};

const metricFromText = (text) => {
  const match = text.match(
    /([+-]?\d+(?:[.,]\d+)?)\s*(%|％|万|亿|倍|k|K|元|年|天|小时|分钟|秒|ms|fps)?/u,
  );
  if (match) {
    return {
      raw: match[0].replace(/\s+/g, ""),
      value: match[1],
      unit: match[2] ?? "",
    };
  }
  const chineseMagnitude = text.match(/(十万|百万|千万|上亿|过亿|破亿)/u)?.[1];
  const magnitudeValues = {
    十万: { value: "10", unit: "万" },
    百万: { value: "100", unit: "万" },
    千万: { value: "1000", unit: "万" },
    上亿: { value: "1", unit: "亿+" },
    过亿: { value: "1", unit: "亿+" },
    破亿: { value: "1", unit: "亿+" },
  };
  return chineseMagnitude
    ? { raw: chineseMagnitude, ...magnitudeValues[chineseMagnitude] }
    : { raw: "", value: "", unit: "" };
};

const portraitStyleForRoute = (routeId) => {
  const accents = {
    "chapter-transition": "#168CFF",
    "keyword-emphasis": "#168CFF",
    "info-callout": "#168CFF",
    "metric-decision": "#14E6A1",
    "process-steps": "#168CFF",
    "risk-boundary": "#FF493D",
    "next-episode-cta": "#168CFF",
  };
  return {
    accentColor: accents[routeId] ?? "#168CFF",
    secondaryColor: "#14E6A1",
    successColor: "#14E6A1",
    warningColor: "#FF493D",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    shadowColor: "#000000",
  };
};

const iconTextForId = (iconId) =>
  ({ arrow: "↗", code: "</>", speed: "↗", timeline: "▣" })[iconId] ?? "✦";

const portraitContext = ({ route, text, timing, fps }) => {
  const fragments = listFragments(text);
  const metric = metricFromText(text);
  const matchedKeywords = route.match.anyKeywords.filter((keyword) =>
    text.includes(keyword),
  );
  const keywords = uniqueText([...matchedKeywords, ...fragments]).slice(0, 3);
  const labels = fragments
    .map((part) =>
      part.replace(/^(?:接下来|下一步|下面|进入|相比|对比)[，,:：]?/u, "").trim(),
    )
    .filter(Boolean)
    .slice(0, 3);
  const steps = sequenceFragments(text).slice(0, 3);
  const risks = riskFragments(text).slice(0, 3);
  const englishTitle = text.match(/\b[A-Za-z][A-Za-z0-9-]{1,18}\b/u)?.[0] ?? "";
  const ctaTopic = text
    .replace(/(?:下期|下一期|下次)/gu, "")
    .replace(/(?:记得|点个|欢迎)?(?:关注|点赞|收藏|评论).*$/u, "")
    .replace(/^介绍/u, "")
    .trim();
  const chapterTopic = /^(?:未来|今后)(?:\d+|一|二|三|四|五|十|几)年/u.test(text)
    ? fragments[0]
    : text
        .replace(/^(?:接下来|下一步|下面|进入|首先来看)[，,:：]?/u, "")
        .trim();
  const riskTopic = text
    .replace(/^.*?(?:但是|不过|注意)[，,:：]?/u, "")
    .split(/(?:不能|不等于|无法|不会|只会|将会|可能会|容易|导致)/u)[0]
    .trim();
  const routeLabels = {
    "chapter-transition": "章节提示",
    "keyword-emphasis": "重点",
    "info-callout": "补充说明",
    "metric-decision": "推荐方案",
    "process-steps": "执行流程",
    "risk-boundary": "使用边界",
    "next-episode-cta": "下期",
  };
  const topics = {
    "chapter-transition": shorten(chapterTopic || fragments[0] || text, 16),
    "keyword-emphasis": shorten(keywords[0] || text, 10),
    "info-callout": shorten(fragments[0] || text, 14),
    "metric-decision": shorten(text, 18),
    "process-steps": "操作步骤",
    "risk-boundary": shorten(riskTopic || fragments[0] || "风险提醒", 12),
    "next-episode-cta": englishTitle || shorten(ctaTopic || "下集预告", 12),
  };
  const detail =
    route.id === "next-episode-cta"
      ? shorten(ctaTopic.replace(englishTitle, "").trim() || "自动剪辑", 14)
      : shorten(fragments[1] || fragments[0] || text, 20);
  const animationSeconds = Math.max(
    0.4,
    Math.min(1.6, Number(((timing.endFrame - timing.startFrame) / fps / 2).toFixed(2))),
  );
  const symbolSet =
    route.id === "risk-boundary"
      ? ["×", "!", "⌁"]
      : route.id === "process-steps"
        ? ["▣", "✦", "↗"]
        : ["↗", "✓", "✦"];
  const style = portraitStyleForRoute(route.id);

  return {
    segment: {
      label: routeLabels[route.id] ?? route.label,
      topic: topics[route.id] ?? shorten(text, 14),
      detail,
      note: shorten(fragments[2] || "", 18),
    },
    intent: {
      conclusion:
        route.id === "risk-boundary"
          ? "≠ 万能修复"
          : route.id === "metric-decision"
            ? shorten(text, 18)
            : detail,
      keywords: { 1: keywords[0] ?? "", 2: keywords[1] ?? "", 3: keywords[2] ?? "" },
      highlightIndex: Math.min(2, Math.max(1, keywords.length)),
      metric: {
        label: "核心数据",
        value: metric.value,
        unit: metric.unit,
        verdict: /更推荐|推荐/u.test(text)
          ? "更推荐"
          : /更快|更低|更高|更好/u.exec(text)?.[0] ?? "重点数据",
      },
      labels: { 1: labels[0] ?? "", 2: labels[1] ?? "", 3: labels[2] ?? "" },
      steps: { 1: steps[0] ?? "", 2: steps[1] ?? "", 3: steps[2] ?? "" },
      risks: { 1: risks[0] ?? "", 2: risks[1] ?? "", 3: risks[2] ?? "" },
      symbols: { 1: symbolSet[0], 2: symbolSet[1], 3: symbolSet[2] },
      cta: /关注/u.test(text)
        ? "点个关注"
        : /点赞/u.test(text)
          ? "欢迎点赞"
          : /收藏/u.test(text)
            ? "记得收藏"
            : "关注下期",
    },
    resource: { iconText: iconTextForId(route.resources?.iconId) },
    style,
    timing: { animationSeconds },
    evidence: { keywordCount: keywords.length, labelCount: labels.length, stepCount: steps.length, riskCount: risks.length, metricFound: Boolean(metric.raw) },
  };
};

const valueAtPath = (record, path) =>
  path.split(".").reduce((value, key) => value?.[key], record);

const propsFromBindings = (bindings, context) =>
  Object.fromEntries(
    Object.entries(bindings).flatMap(([propName, sourcePath]) => {
      const value = valueAtPath(context, sourcePath);
      return value === undefined || value === null ? [] : [[propName, value]];
    }),
  );

const activationAllows = (activation, context) => {
  if (activation === "when-keywords-present") return context.evidence.keywordCount > 0;
  if (activation === "when-metric-present") return context.evidence.metricFound;
  if (activation === "when-supporting-labels-present") return context.evidence.labelCount >= 2;
  if (activation === "when-two-or-more-steps-present") return context.evidence.stepCount >= 2;
  return true;
};

const buildPortraitSemanticSrtArrangement = ({
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

  const sourceCueLabel = (entry) => {
    const indices = entry.sourceCueIndices ?? [entry.index];
    return indices.length === 1
      ? String(indices[0])
      : `${indices[0]}–${indices.at(-1)}`;
  };

  for (const entry of entries) {
    const matched = PORTRAIT_SEMANTIC_ROUTES.flatMap((route) => {
      if (!route.components.some((component) => componentIds.has(component.componentId))) {
        return [];
      }
      const matchResult = portraitRouteMatchResult(route, entry.text);
      return matchResult.matched ? [{ route, matchResult }] : [];
    }).sort(
      (left, right) =>
        right.route.priority - left.route.priority ||
        right.matchResult.score - left.matchResult.score,
    );
    const selectedRoutes = matched.slice(0, PORTRAIT_ROUTING_POLICY.maxIntentsPerCue);
    const startFrame = Math.max(0, Math.round((entry.startMs / 1000) * fps));
    const endFrame = Math.max(startFrame + 3, Math.round((entry.endMs / 1000) * fps));
    const detected = [];

    selectedRoutes.forEach(({ route, matchResult }, routeIndex) => {
      const sequence = String(entry.index).padStart(3, "0");
      const intentId = `intent-${sequence}-${route.id}`;
      const timing = spanForPortraitIntent(
        startFrame,
        endFrame,
        routeIndex,
        selectedRoutes.length,
      );
      const context = portraitContext({ route, text: entry.text, timing, fps });
      const createdMotionIds = [];

      route.components.forEach((selection, componentIndex) => {
        if (
          !componentIds.has(selection.componentId) ||
          !activationAllows(selection.activation, context)
        ) {
          return;
        }
        const expressionId = `effect-${sequence}-${route.id}-${componentIndex + 1}`;
        const supportingOffset = selection.role === "supporting" ? Math.min(6, Math.max(0, timing.endFrame - timing.startFrame - 3)) : 0;
        const componentStart = timing.startFrame + supportingOffset;
        motionTimeline.push({
          componentId: selection.componentId,
          startFrame: componentStart,
          durationInFrames: Math.max(3, timing.endFrame - componentStart),
          laneId: `motion-${sequence}-${route.id}-${componentIndex + 1}`,
          trackOrder: trackOrder++,
          visible: true,
          sourceStartFrame: 0,
          backgroundOpacity: 0,
          props: propsFromBindings(selection.propBindings, context),
          sourceExpressionId: expressionId,
          sourceIntentId: intentId,
          layoutIntent: {
            anchor: selection.layout.anchor,
            fallbackAnchors: selection.layout.fallbackAnchors,
            preferredScale: selection.layout.preferredScale,
            avoid: PORTRAIT_ROUTING_POLICY.layout.avoid,
            collisionPolicy: PORTRAIT_ROUTING_POLICY.layout.collisionPolicy,
          },
        });
        createdMotionIds.push(selection.componentId);
      });

      if (createdMotionIds.length === 0) return;

      const icon = availableResource(resourceIndex, "icons", route.resources?.iconId);
      if (icon && selectedRoutes.length === 1 && createdMotionIds.length === 1) {
        const iconId = `icon-${sequence}-${route.id}`;
        resourceTracks.push({
          id: `resource-${iconId}`,
          laneId: iconId,
          trackOrder: trackOrder++,
          kind: "icon",
          resourceId: icon.id,
          name: `${icon.label} · ${route.label}`,
          url: icon.url,
          mimeType: icon.mimeType,
          sourceStartFrame: 0,
          sourceDurationInFrames: timing.endFrame - timing.startFrame,
          startFrame: Math.min(timing.endFrame - 3, timing.startFrame + 3),
          durationInFrames: Math.max(3, timing.endFrame - Math.min(timing.endFrame - 3, timing.startFrame + 3)),
          visible: true,
          position: iconPosition(canvas, routeIndex),
          volume: 1,
          voiceDucking: 0,
          sourceExpressionId: iconId,
          sourceIntentId: intentId,
          layoutIntent: {
            anchor: route.resources.iconAnchor,
            avoid: PORTRAIT_ROUTING_POLICY.layout.avoid,
            collisionPolicy: PORTRAIT_ROUTING_POLICY.layout.collisionPolicy,
          },
        });
      }

      const sfx = availableResource(resourceIndex, "sfx", route.resources?.sfxId);
      if (sfx) {
        const sfxId = `sfx-${sequence}-${route.id}`;
        const audioFrames = Math.max(3, Math.round(Number(sfx.media?.durationSeconds ?? 0.2) * fps));
        resourceTracks.push({
          id: `resource-${sfxId}`,
          laneId: sfxId,
          trackOrder: trackOrder++,
          kind: "sfx",
          resourceId: sfx.id,
          name: `${sfx.label} · ${route.label}`,
          url: sfx.url,
          mimeType: sfx.mimeType,
          sourceStartFrame: 0,
          sourceDurationInFrames: audioFrames,
          startFrame: timing.startFrame,
          durationInFrames: Math.min(audioFrames, timing.endFrame - timing.startFrame),
          visible: true,
          position: { x: 0, y: 0, width: 1, height: 1, scale: 1, zIndex: 0 },
          volume: 0.28,
          voiceDucking: 0.72,
          sourceExpressionId: sfxId,
          sourceIntentId: intentId,
        });
      }

      detected.push({
        id: intentId,
        type: route.intentType,
        label: route.label,
        componentId: createdMotionIds[0],
        componentIds: createdMotionIds,
        score: matchResult.score,
        minimumScore: matchResult.minimumScore,
        signals: matchResult.signals,
      });
      intentCount += 1;
    });

    if (matched.length > selectedRoutes.length) {
      messages.push(
        `语义段 ${sourceCueLabel(entry)} 命中 ${matched.length} 个竖屏语义，仅保留优先级最高的 ${PORTRAIT_ROUTING_POLICY.maxIntentsPerCue} 个，避免画面过载。`,
      );
    }
    if (detected.length === 0) {
      messages.push(`语义段 ${sourceCueLabel(entry)} 未发现需要视觉强化的明确语义，已保留口播但不添加效果。`);
    }
    cueAnalyses.push({
      cueIndex: entry.index,
      sourceCueIndices: entry.sourceCueIndices ?? [entry.index],
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
    routingProfile: "portrait-v1",
    cueCount: entries.length,
    semanticSegmentCount: entries.length,
    matchedCueCount,
    matchedSegmentCount: matchedCueCount,
    skippedCueCount,
    skippedSegmentCount: skippedCueCount,
    intentCount,
    motionCount: motionTimeline.length,
    resourceCount: resourceTracks.length,
    cueAnalyses,
    messages,
  };

  return {
    timelineVersion: "2.0",
    generatedBy: "semantic-srt-arranger/portrait-1",
    project: {
      fps,
      durationInFrames: maxEndFrame,
      canvas,
      resourceCatalog: { root: "public/input", indexVersion: String(resourceIndex?.indexVersion ?? "1") },
    },
    semanticAnalysis,
    qualityControl: qualityControl(),
    applyPolicy: PORTRAIT_ROUTING_POLICY.applyPolicy,
    motionTimeline,
    resourceTracks,
  };
};

const buildMergedPortraitSemanticSrtArrangement = (input) => {
  const semanticEntries = mergeSrtEntriesForSemanticAnalysis(input.entries);
  const mergeSummary = summarizeSrtSemanticMerge(input.entries, semanticEntries);
  const timeline = buildPortraitSemanticSrtArrangement({
    ...input,
    entries: semanticEntries,
  });
  return {
    ...timeline,
    semanticAnalysis: {
      ...timeline.semanticAnalysis,
      cueCount: mergeSummary.sourceCueCount,
      semanticSegmentCount: mergeSummary.semanticSegmentCount,
      mergedCueCount: mergeSummary.mergedCueCount,
      mergePolicy: "adjacent-context-v1",
    },
  };
};

export const buildSemanticSrtArrangement = (input) =>
  input.canvas?.orientation === "portrait"
    ? buildMergedPortraitSemanticSrtArrangement(input)
    : buildLegacySemanticSrtArrangement(input);
