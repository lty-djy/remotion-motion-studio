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
    componentId: "SegmentedMeter",
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
    componentId: "SegmentedMeter",
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
    componentId: "SegmentedMeter",
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
    componentId: "SegmentedMeter",
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

const LEGACY_COMPONENT_REASONS = Object.freeze({
  Countdown: "适合截止时间、阶段切换和紧迫感",
  SegmentedMeter: "适合流程、容量、占比和分阶段信息",
  DualMetricBar: "适合两组数值或方案差异",
  SegmentedMeter: "适合性能、速度、流程和重点指标",
});

const LEGACY_CANDIDATE_IDS_BY_RULE = Object.freeze({
  performance: ["SegmentedMeter"],
  process: ["SegmentedMeter", "Countdown"],
  automation: ["SegmentedMeter"],
  comparison: ["SegmentedMeter"],
  completion: ["SegmentedMeter"],
  coverage: ["SegmentedMeter"],
  deadline: ["Countdown", "SegmentedMeter"],
  emphasis: ["SegmentedMeter", "Countdown"],
  number: ["SegmentedMeter"],
});

const SEMANTIC_INTENT_IDS_BY_ROUTE_TYPE = Object.freeze({
  metric: ["metric"],
  process: ["process"],
  automation: ["process", "explanation"],
  comparison: ["comparison", "metric"],
  completion: ["metric", "emphasis"],
  coverage: ["metric", "emphasis"],
  countdown: ["transition", "emphasis"],
  emphasis: ["emphasis"],
  transition: ["transition"],
  instruction: ["explanation"],
  evidence: ["evidence"],
  list: ["list"],
  warning: ["warning"],
  "call-to-action": ["call-to-action"],
});

const semanticCapabilityMap = (componentCapabilities = []) =>
  new Map(
    componentCapabilities.flatMap((entry) =>
      entry?.componentId && entry?.semantic
        ? [[entry.componentId, entry.semantic]]
        : [],
    ),
  );

const semanticMatchFor = (componentId, routeType, capabilitiesById) => {
  const semantic = capabilitiesById.get(componentId);
  const expectedIntentIds = SEMANTIC_INTENT_IDS_BY_ROUTE_TYPE[routeType] ?? [];
  if (!semantic || expectedIntentIds.length === 0) {
    return { intentId: expectedIntentIds[0] ?? routeType, strength: "fallback" };
  }
  if (expectedIntentIds.includes(semantic.primaryIntent)) {
    return { intentId: semantic.primaryIntent, strength: "primary" };
  }
  const secondaryIntent = semantic.secondaryIntents?.find((intentId) =>
    expectedIntentIds.includes(intentId),
  );
  return secondaryIntent
    ? { intentId: secondaryIntent, strength: "secondary" }
    : { intentId: expectedIntentIds[0] ?? routeType, strength: "fallback" };
};

const semanticMatchWeight = (match) =>
  match.strength === "primary" ? 0 : match.strength === "secondary" ? 1 : 2;

const legacyComponentCandidates = (
  rule,
  availableIds,
  props,
  capabilitiesById,
) =>
  (LEGACY_CANDIDATE_IDS_BY_RULE[rule.id] ?? [rule.componentId])
    .filter((componentId) => availableIds.has(componentId))
    .map((componentId, originalIndex) => ({
      componentId,
      originalIndex,
      semanticMatch: semanticMatchFor(componentId, rule.type, capabilitiesById),
      reason:
        LEGACY_COMPONENT_REASONS[componentId] ?? `适合${rule.label}语义`,
      props,
    }))
    .sort(
      (left, right) =>
        semanticMatchWeight(left.semanticMatch) -
          semanticMatchWeight(right.semanticMatch) ||
        left.originalIndex - right.originalIndex,
    )
    .map(({ originalIndex: _originalIndex, ...candidate }, index) => ({
      ...candidate,
      rank: index + 1,
    }));

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
  componentCapabilities,
  resourceIndex,
}) => {
  const componentIds = new Set(availableComponentIds);
  const capabilitiesById = semanticCapabilityMap(componentCapabilities);
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
      const props = {
        title: rule.label,
        subtitle: rule.subtitle,
        value,
        item1: shorten(parts[0] ?? entry.text, 22),
        item2: shorten(parts[1] ?? "人工确认后插入", 22),
        item3: shorten(parts[2] ?? "仍可继续微调", 22),
        animationSeconds,
        accentColor: rule.accentColor,
        secondaryColor: "#7a7d84",
      };
      motionTimeline.push({
        componentId: rule.componentId,
        startFrame: timing.startFrame,
        durationInFrames: timing.endFrame - timing.startFrame,
        laneId: `motion-${sequence}-${rule.id}`,
        trackOrder: trackOrder++,
        visible: true,
        sourceStartFrame: 0,
        backgroundOpacity: 0,
        props,
        sourceExpressionId: expressionId,
        sourceIntentId: intentId,
        layoutIntent: {
          anchor: rule.anchor,
          avoid: ["face", "captions", "ui-safe-area"],
          collisionPolicy: "relocate-then-scale",
        },
      });

      // 图标不做自动匹配，只允许用户在语义段里手动添加。

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

      detected.push({
        id: intentId,
        type: rule.type,
        label: rule.label,
        componentId: rule.componentId,
        componentIds: [rule.componentId],
        componentCandidates: legacyComponentCandidates(
          rule,
          componentIds,
          props,
          capabilitiesById,
        ),
      });
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

const portraitRouteMatchesForEntry = (entry, componentIds) =>
  PORTRAIT_SEMANTIC_ROUTES.flatMap((route) => {
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

const planPortraitVisualIntents = (entryMatches) => {
  const density = PORTRAIT_ROUTING_POLICY.density;
  const firstStartMs = entryMatches[0]?.entry.startMs ?? 0;
  const lastEndMs = entryMatches.at(-1)?.entry.endMs ?? firstStartMs;
  const durationSeconds = Math.max(0, (lastEndMs - firstStartMs) / 1000);
  const candidates = entryMatches.flatMap(({ matched }, entryPosition) =>
    matched
      .slice(0, PORTRAIT_ROUTING_POLICY.maxIntentsPerCue)
      .map(({ route, matchResult }) => ({
        key: `${entryPosition}:${route.id}`,
        entryPosition,
        route,
        matchResult,
        baseScore:
          route.priority +
          matchResult.score * 10 +
          (entryPosition === 0 ? 16 : 0) +
          (entryPosition === entryMatches.length - 1 ? 16 : 0),
      })),
  );
  const desiredMotionBudget = Math.min(
    candidates.length,
    Math.max(
      Math.min(density.minMotionBudget, candidates.length),
      Math.min(
        density.maxMotionBudget,
        Math.round(durationSeconds / density.targetSecondsPerMotion),
      ),
    ),
  );
  const selectedKeys = new Set();
  const segmentUsage = new Map();
  const routeUsage = new Map();

  const canSelect = (candidate) =>
    !selectedKeys.has(candidate.key) &&
    (segmentUsage.get(candidate.entryPosition) ?? 0) <
      density.maxIntentsPerSegment;
  const select = (candidate) => {
    selectedKeys.add(candidate.key);
    segmentUsage.set(
      candidate.entryPosition,
      (segmentUsage.get(candidate.entryPosition) ?? 0) + 1,
    );
    routeUsage.set(
      candidate.route.id,
      (routeUsage.get(candidate.route.id) ?? 0) + 1,
    );
  };
  const dynamicScore = (candidate) => {
    const adjacentSameRoute = candidates.some(
      (selected) =>
        selectedKeys.has(selected.key) &&
        selected.route.id === candidate.route.id &&
        Math.abs(selected.entryPosition - candidate.entryPosition) === 1,
    );
    return (
      candidate.baseScore -
      (routeUsage.get(candidate.route.id) ?? 0) * 24 -
      (segmentUsage.get(candidate.entryPosition) ?? 0) * 18 -
      (adjacentSameRoute ? 16 : 0)
    );
  };
  const strongestFirst = (items) =>
    [...items].sort(
      (left, right) =>
        dynamicScore(right) - dynamicScore(left) ||
        left.entryPosition - right.entryPosition ||
        left.route.id.localeCompare(right.route.id),
    );

  const routeIds = [...new Set(candidates.map((candidate) => candidate.route.id))];
  for (const routeId of routeIds) {
    if (selectedKeys.size >= desiredMotionBudget) break;
    const candidate = strongestFirst(
      candidates.filter(
        (item) => item.route.id === routeId && canSelect(item),
      ),
    )[0];
    if (candidate) select(candidate);
  }

  while (selectedKeys.size < desiredMotionBudget) {
    const candidate = strongestFirst(candidates.filter(canSelect))[0];
    if (!candidate) break;
    select(candidate);
  }

  return {
    selectedKeys,
    motionBudget: selectedKeys.size,
    detectedIntentCount: candidates.length,
    durationSeconds,
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

const isEliminationWarning = (text) => {
  if (
    /(?:为了)?(?:避免|防止|摆脱).{0,8}(?:被)?(?:市场|行业|时代|用户)?(?:淘汰|抛弃|取代|出局|过时)/u.test(
      text,
    )
  ) {
    return false;
  }
  return /(?:单纯|只靠|只会|仍在|还在|依赖|传统|旧(?:模式|方案|做法|打法|产品|技术)?|原有).{0,24}(?:被(?:市场|行业|时代|用户)?淘汰|淘汰出局|出局|过时|落后|不再适用|不再有效|被取代|失去竞争力)|(?:市场|行业|时代|用户).{0,12}(?:正在|将|会|逐渐|开始)?(?:淘汰|抛弃|取代).{0,20}(?:单纯|只靠|只会|传统|旧|原有)/u.test(
    text,
  );
};

const eliminationDetails = (text) => {
  // 逗号后的"慢慢的/逐渐"等状语会让主语提取落到副词上，先剥离再匹配
  const cleanedText = text.replace(
    /[，,]\s*(?:慢慢|逐渐|最终|早晚|一步步|渐渐)的?/gu,
    "",
  );
  const forwardSubject = cleanedText.match(
    /(?:^|[，,。；;：:])([^，,。；;：:]{1,24}?)(?:的(?:门店|商家|品牌))?(?:只会|将会|会|正在|逐渐|慢慢|最终|早晚|已经|正|仍会|还会)?(?:慢慢|逐渐|最终)?(?:被|遭到)?(?:市场|行业|时代|用户)?(?:淘汰|抛弃|取代|淘汰出局|出局|过时|落后|不再适用|不再有效|失去竞争力)/u,
  )?.[1];
  const reverseSubject = cleanedText.match(
    /(?:市场|行业|时代|用户).{0,12}(?:正在|将|会|逐渐|开始)?(?:淘汰|抛弃|取代)([^，,。；;：:]{1,24})/u,
  )?.[1];
  const subject = (forwardSubject || reverseSubject || "旧方案")
    .replace(/^(?:这种|这样的|仍在|还在|继续)/u, "")
    .replace(/的(?:门店|商家|品牌)$/u, "")
    .replace(/^(?:只会|只靠)/u, "")
    .trim();
  const verdict = /市场淘汰|被市场淘汰/u.test(text)
    ? "市场淘汰"
    : /不再适用|不再有效/u.test(text)
      ? "不再适用"
      : /过时/u.test(text)
        ? "已经过时"
        : /取代/u.test(text)
          ? "被取代"
          : /出局/u.test(text)
            ? "淘汰出局"
            : /失去竞争力/u.test(text)
              ? "失去竞争力"
              : /落后/u.test(text)
                ? "已经落后"
                : "淘汰警告";
  return {
    kicker: "OLD MODEL · WARNING",
    subject: shorten(subject || "旧方案", 12),
    subtitle: /卖货|产品/u.test(subject)
      ? "PRODUCT-ONLY STORE"
      : "OUTDATED APPROACH",
    verdict,
  };
};

const metricFromText = (text) => {
  const match = text.match(
    /([+-]?\d+(?:[.,]\d+)?)\s*(%|％|万|亿|倍|k|K|元|块|件|年|天|小时|分钟|秒|ms|fps)?/u,
  );
  if (match) {
    return {
      raw: match[0].replace(/\s+/g, ""),
      value: match[1],
      unit: match[2] ?? "",
    };
  }
  const chineseMagnitude = text.match(/(几万|十万|百万|千万|上亿|过亿|破亿)/u)?.[1];
  const magnitudeValues = {
    几万: { value: "几", unit: "万" },
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

const portraitDocumentContextFor = (entries) => {
  const documentText = entries
    .map((entry) => String(entry?.text ?? "").trim())
    .filter(Boolean)
    .join("，");
  const enumeratedItems = [];
  const addItem = (label, detail, badge) => {
    if (!label || enumeratedItems.some((item) => item.label === label)) return;
    enumeratedItems.push({ label, detail, badge });
  };

  if (/我自己做的\s*UI\s*skill/iu.test(documentText)) {
    addItem("我自己做的 Skill", "UI 审美 · 全流程用它", "C 位");
  }
  if (/\bGSAP\b/iu.test(documentText)) {
    addItem("GSAP Skills", "高级动效", "★ 26K");
  }
  if (/\bpony(?:fill|tail)\b/iu.test(documentText)) {
    addItem("Ponytail", "工程克制", "★ 80K");
  }
  if (/\bPlayr(?:ight|wright)\s*MCP\b/iu.test(documentText)) {
    addItem("Playwright MCP", "自动测试", "★ 35K");
  }

  if (enumeratedItems.length < 2) {
    const genericMatches = [...documentText.matchAll(
      /第(?:一|二|三|四|五|六|七|八|九|十|\d+)个(?:\s*)(?:skill|技能|工具|方法)(?:是|叫)?[，,:：]?\s*([^，。；;]{2,24})/giu,
    )];
    genericMatches.forEach((match, index) => {
      const label = match[1]
        .replace(/^(?:我自己做的|就是|这个)/u, "")
        .replace(/(?:一直|负责|用来|可以).*$/u, "")
        .trim();
      addItem(label, "逐项说明", `0${index + 1}`);
    });
  }

  const promptMatch = documentText.match(
    /(?:帮|给)(?:我)?[^，。；;]{0,10}(?:官网|网站|页面)/u,
  )?.[0];
  const promptDiagnosis = {
    eyebrow: /你是不是也这样/u.test(documentText) ? "你是不是也这样" : "是不是也这样",
    titlePrefix: "打开就",
    titleEmphasis: "直接开口",
    prompt: (promptMatch ?? "帮我做一个官网").replace(/[，,]/gu, ""),
    issue1: "配色随机",
    issue2: "动效生硬",
    issue3: "代码冗余",
    conclusionPrefix: "问题不在模型，是你",
    conclusionEmphasis: /(?:少了|缺少)[^，。；;]{0,8}(?:准备|前置)/u.test(documentText)
      ? "少了准备这一步"
      : "缺少前置准备",
  };
  const workflowStartIndex = entries.findIndex((entry) =>
    /(?:动手|开始|制作).{0,6}(?:之前|前)/u.test(String(entry?.text ?? "")),
  );
  const workflowEntries = workflowStartIndex >= 0
    ? entries.slice(workflowStartIndex).slice(0, 5)
    : [];
  const workflowEndEntry = workflowEntries.find((entry) =>
    /(?:顺序|自测)/u.test(String(entry?.text ?? "")),
  ) ?? workflowEntries.at(-1);
  const workflowPrerequisite = {
    startMs: workflowEntries[0]?.startMs,
    endMs: workflowEndEntry?.endMs,
    kicker: "动手做网页之前",
    titleEmphasis: "先装工作流，",
    titleSuffix: "再动手",
    subtitleLine1: "先把这套 Skill 工作流装好，",
    subtitleLine2: "AI 才知道该按什么规矩走。",
    workflowLabel: "THE WORKFLOW",
    stepCount: 4,
    step1: "审美",
    step2: "动效",
    step3: "工程",
    step4: "自测",
    footerEmphasis: "顺序不能反",
    footerText: "先定审美，最后自测",
  };
  const skillIdentityStartIndex = entries.findIndex((entry) =>
    /第(?:一|1)个.{0,4}(?:skill|技能)/iu.test(String(entry?.text ?? "")),
  );
  const skillIdentityEntries = skillIdentityStartIndex >= 0
    ? entries.slice(skillIdentityStartIndex).slice(0, 3)
    : [];
  const skillIdentity = {
    startMs: skillIdentityEntries[0]?.startMs,
    endMs: skillIdentityEntries.at(-1)?.endMs,
    sequenceText: "01",
    title: "我自己做的 Skill",
    subtitle: "UI 审美 · 全流程规范",
    badge: "C 位",
    updateText: "持续更新中 · 新规则滚动迭代",
  };
  const skillSourceStartIndex = entries.findIndex((entry) =>
    /(?:不是凭空来的|审美判断.{0,8}taste)/iu.test(String(entry?.text ?? "")),
  );
  const skillSourceEntries = skillSourceStartIndex >= 0
    ? entries.slice(skillSourceStartIndex).slice(0, 6)
    : [];
  const skillSourceEndEntry = skillSourceEntries.find((entry) =>
    /三样.{0,6}(?:拼|合).{0,4}一个/u.test(String(entry?.text ?? "")),
  ) ?? skillSourceEntries.at(-1);
  const skillSourceFusion = {
    startMs: skillSourceEntries[0]?.startMs,
    endMs: skillSourceEndEntry?.endMs,
    sequenceText: "01",
    title: "我自己做的 Skill",
    subtitle: "UI 审美 · 全流程规范",
    badge: "C 位",
    sourceCount: 3,
    source1: "TASTE",
    source1Detail: "审美判断 · 来自 Taste",
    source2: "IMPECCABLE",
    source2Detail: "反廉价规则 · 来自 Impeccable",
    source3: "自己的经验",
    source3Detail: "日常实战 · 持续积累",
  };
  const designRulesStartIndex = entries.findIndex((entry) =>
    /负责.{0,8}网页.{0,8}设计审美/u.test(String(entry?.text ?? "")),
  );
  const designRuleEntries = designRulesStartIndex >= 0
    ? entries.slice(designRulesStartIndex).slice(0, 6)
    : [];
  const designRulesEndEntry = designRuleEntries.find((entry) =>
    /(?:AI).{0,8}(?:规矩|规则)/iu.test(String(entry?.text ?? "")),
  ) ?? designRuleEntries.at(-1);
  const designRules = {
    startMs: designRuleEntries[0]?.startMs,
    endMs: designRulesEndEntry?.endMs,
    ruleCount: 4,
    rule1: "排版网格",
    rule2: "留白密度",
    rule3: "配色层级",
    rule4: "视觉一致性",
  };
  const skillResultStartIndex = entries.findIndex((entry) =>
    /(?:没装|未安装).{0,8}(?:时候|效果)/u.test(String(entry?.text ?? "")),
  );
  const skillResultEntries = skillResultStartIndex >= 0
    ? entries.slice(skillResultStartIndex).slice(0, 8)
    : [];
  const skillResultEndEntry = skillResultEntries.find((entry) =>
    /一样稳|照样稳|依然稳/u.test(String(entry?.text ?? "")),
  ) ?? skillResultEntries.at(-1);
  const afterResultEntry = skillResultEntries.find((entry) =>
    /(?:装了|安装).{0,6}(?:之后|以后)/u.test(String(entry?.text ?? "")),
  );
  const alternateResultEntry = skillResultEntries.find((entry) =>
    /换个(?:题材|行业)/u.test(String(entry?.text ?? "")),
  );
  const skillResultStartMs = skillResultEntries[0]?.startMs;
  const secondsFromResultStart = (entry, fallback) =>
    Number.isFinite(Number(entry?.startMs)) && Number.isFinite(Number(skillResultStartMs))
      ? Number(((Number(entry.startMs) - Number(skillResultStartMs)) / 1000).toFixed(2))
      : fallback;
  const skillResultComparison = {
    startMs: skillResultStartMs,
    endMs: skillResultEndEntry?.endMs,
    materialCount: 3,
    material1Eyebrow: "WITHOUT THE SKILL",
    material1Title: "没装它",
    material1Detail: "AI 随手做出来的默认效果",
    material2Eyebrow: "WITH THE SKILL",
    material2Title: "装了它",
    material2Detail: "同一个 AI，同一句话",
    material3Eyebrow: "ANOTHER INDUSTRY",
    material3Title: "换个行业",
    material3Detail: "质感照样稳定",
    firstSwitchSeconds: secondsFromResultStart(afterResultEntry, 3.1),
    materialIntervalSeconds: Number((secondsFromResultStart(alternateResultEntry, 6.6) - secondsFromResultStart(afterResultEntry, 3.1)).toFixed(2)),
  };
  const promptIterationStartIndex = entries.findIndex((entry) =>
    /具体怎么用/u.test(String(entry?.text ?? "")),
  );
  const promptIterationEntries = promptIterationStartIndex >= 0
    ? entries.slice(promptIterationStartIndex).slice(0, 14)
    : [];
  const promptIterationEndEntry = promptIterationEntries.find((entry) =>
    /只管说要什么/u.test(String(entry?.text ?? "")),
  ) ?? promptIterationEntries.at(-1);
  const firstPromptEntry = promptIterationEntries.find((entry) =>
    /第一句|摄影/u.test(String(entry?.text ?? "")),
  );
  const secondPromptEntry = promptIterationEntries.find((entry) =>
    /改成数据后台/u.test(String(entry?.text ?? "")),
  );
  const thirdPromptEntry = promptIterationEntries.find((entry) =>
    /换成产品落地页/u.test(String(entry?.text ?? "")),
  );
  const promptIterationStartMs = promptIterationEntries[0]?.startMs;
  const secondsFromPromptIterationStart = (entry, fallback) =>
    Number.isFinite(Number(entry?.startMs)) && Number.isFinite(Number(promptIterationStartMs))
      ? Number(((Number(entry.startMs) - Number(promptIterationStartMs)) / 1000).toFixed(2))
      : fallback;
  const firstResultSeconds = secondsFromPromptIterationStart(firstPromptEntry, 3.1);
  const thirdResultSeconds = secondsFromPromptIterationStart(thirdPromptEntry, 13.3);
  const promptIterations = {
    startMs: promptIterationStartMs,
    endMs: promptIterationEndEntry?.endMs,
    iterationCount: 3,
    eyebrow: "HOW TO USE",
    title: "怎么用？",
    emphasis: "一句话，改一版",
    ghostNumber: "01",
    waitingText: "等待第一句话",
    iteration1Prompt: "做一个摄影工作室的品牌官网",
    iteration1Badge: "品牌官网",
    iteration2Prompt: "改成数据后台，深色",
    iteration2Badge: "数据后台",
    iteration3Prompt: "换成产品落地页",
    iteration3Badge: "产品落地页",
    firstResultSeconds,
    iterationIntervalSeconds: secondPromptEntry && thirdPromptEntry
      ? Number(((thirdResultSeconds - firstResultSeconds) / 2).toFixed(2))
      : 5.2,
  };
  const gsapStartIndex = entries.findIndex((entry) =>
    /第二个.{0,6}(?:skill|技能).{0,6}GSAP/iu.test(String(entry?.text ?? "")),
  );
  const gsapEntries = gsapStartIndex >= 0 ? entries.slice(gsapStartIndex).slice(0, 14) : [];
  const gsapEndEntry = gsapEntries.find((entry) =>
    /动的?好不好看/u.test(String(entry?.text ?? "")),
  ) ?? gsapEntries.at(-1);
  const pairEntry = gsapEntries.find((entry) =>
    /配着第一个|一起用/u.test(String(entry?.text ?? "")),
  );
  const conclusionEntry = gsapEntries.find((entry) =>
    /一个管页面/u.test(String(entry?.text ?? "")),
  );
  const gsapStartMs = gsapEntries[0]?.startMs;
  const secondsFromGsapStart = (entry, fallback) =>
    Number.isFinite(Number(entry?.startMs)) && Number.isFinite(Number(gsapStartMs))
      ? Number(((Number(entry.startMs) - Number(gsapStartMs)) / 1000).toFixed(2))
      : fallback;
  const gsapSkill = {
    startMs: gsapStartMs,
    endMs: gsapEndEntry?.endMs,
    sequenceText: "02",
    title: "GSAP Skills",
    subtitle: "动效引擎 · 高级动画",
    badge: "★ 26K",
    capabilityCount: 3,
    capability1Title: "ScrollTrigger",
    capability1Detail: "滚动进度驱动动画",
    capability2Title: "Timeline",
    capability2Detail: "时间轴精确编排",
    capability3Title: "Stagger",
    capability3Detail: "多元素错峰入场",
    controlLead: "什么时候出现、什么时候结束、快慢怎么给——",
    controlEmphasis: "它全管。",
    firstSkillTitle: "我自己做的 Skill",
    firstSkillDetail: "管页面好不好看",
    secondSkillTitle: "GSAP Skills",
    secondSkillDetail: "管它动得好不好看",
    conclusionLead: "一个定住美感，",
    conclusionEmphasis: "一个让它动起来",
    capabilityStartSeconds: 2.8,
    capabilityIntervalSeconds: 1.15,
    pairRevealSeconds: secondsFromGsapStart(pairEntry, 11.2),
    conclusionRevealSeconds: secondsFromGsapStart(conclusionEntry, 14.1),
  };
  const codeDecisionStartIndex = entries.findIndex((entry) =>
    /让\s*AI\s*先想/iu.test(String(entry?.text ?? "")),
  );
  const codeDecisionEntries = codeDecisionStartIndex >= 0
    ? entries.slice(codeDecisionStartIndex).slice(0, 5)
    : [];
  const codeDecisionEndEntry = codeDecisionEntries.find((entry) =>
    /实在不行才自己写/u.test(String(entry?.text ?? "")),
  ) ?? codeDecisionEntries.at(-1);
  const firstQuestionEntry = codeDecisionEntries.find((entry) =>
    /功能真的需要吗/u.test(String(entry?.text ?? "")),
  );
  const codeDecisionStartMs = codeDecisionEntries[0]?.startMs;
  const firstHighlightSeconds = Number.isFinite(Number(firstQuestionEntry?.startMs)) && Number.isFinite(Number(codeDecisionStartMs))
    ? Number(((Number(firstQuestionEntry.startMs) - Number(codeDecisionStartMs)) / 1000).toFixed(2))
    : 1.15;
  const codeDecisionEndMs = codeDecisionEndEntry?.endMs;
  const questionIntervalSeconds = Number.isFinite(Number(codeDecisionEndMs)) && Number.isFinite(Number(firstQuestionEntry?.startMs))
    ? Number(((Number(codeDecisionEndMs) - Number(firstQuestionEntry.startMs)) / 5 / 1000).toFixed(2))
    : 1.11;
  const codeDecisionChecklist = {
    startMs: codeDecisionStartMs,
    endMs: codeDecisionEndMs,
    questionCount: 6,
    question1: "这个功能真的需要吗",
    question2: "现有代码里有没有",
    question3: "标准库有没有",
    question4: "原生平台有没有",
    question5: "已装依赖有没有",
    question6: "一行能搞定吗",
    firstHighlightSeconds,
    questionIntervalSeconds,
  };
  const browserRepairStartIndex = entries.findIndex((entry) =>
    /让\s*agent\s*自己打开浏览器/iu.test(String(entry?.text ?? "")),
  );
  const browserRepairEntries = browserRepairStartIndex >= 0
    ? entries.slice(browserRepairStartIndex).slice(0, 8)
    : [];
  const browserRepairEndEntry = browserRepairEntries.find((entry) =>
    /直到整页真的没问题/u.test(String(entry?.text ?? "")),
  ) ?? browserRepairEntries.at(-1);
  const browserRepairStartMs = browserRepairEntries[0]?.startMs;
  const browserRepairEndMs = browserRepairEndEntry?.endMs;
  const browserRepairLoop = {
    startMs: browserRepairStartMs,
    endMs: browserRepairEndMs,
    stepCount: 6,
    step1: "打开浏览器",
    step2: "运行页面",
    step3: "自动截图",
    step4: "发现问题",
    step5: "自动修复",
    step6: "再验证",
    centerTitle: "一直循环",
    centerSubtitle: "直到没问题",
    firstNodeHighlightSeconds: 0.2,
    nextNodeHighlightIntervalSeconds: Number.isFinite(Number(browserRepairEndMs)) && Number.isFinite(Number(browserRepairStartMs))
      ? Number(((Number(browserRepairEndMs) - Number(browserRepairStartMs) - 1000) / 7 / 1000).toFixed(2))
      : 1.26,
    loopIntervalSeconds: 0.5,
  };
  const browserSelfCheckStartIndex = entries.findIndex((entry) =>
    /你现在看到的这一整页/u.test(String(entry?.text ?? "")),
  );
  const browserSelfCheckEntries = browserSelfCheckStartIndex >= 0
    ? entries.slice(browserSelfCheckStartIndex).slice(0, 2)
    : [];
  const browserSelfCheckMedia = {
    startMs: browserSelfCheckEntries[0]?.startMs,
    endMs: browserSelfCheckEntries.at(-1)?.endMs,
    titlePrefix: "Agent 自己开浏览器，",
    titleHighlight: "逐屏自查",
    browserLabel: "playwright · headed",
  };
  const skillStepStartIndex = entries.findIndex((entry) =>
    /就是这(?:4|四)个skill/iu.test(String(entry?.text ?? "")),
  );
  const skillStepEntries = skillStepStartIndex >= 0
    ? entries.slice(skillStepStartIndex).slice(0, 3)
    : [];
  const skillStepGrid = {
    startMs: skillStepEntries[0]?.startMs,
    endMs: skillStepEntries.at(-1)?.endMs,
    stepCount: 4,
    headerText: "STEP 1 → 4",
    step1Title: "我自己做的 Skill", step1Subtitle: "定审美",
    step2Title: "GSAP", step2Subtitle: "跟动效",
    step3Title: "Ponytail", step3Subtitle: "保克制",
    step4Title: "Playwright MCP", step4Subtitle: "自测自修",
  };
  const gapHeadlineStartIndex = entries.findIndex((entry) =>
    /真正拉开差距/u.test(String(entry?.text ?? "")),
  );
  const gapHeadlineEntries = gapHeadlineStartIndex >= 0
    ? entries.slice(gapHeadlineStartIndex).slice(0, 3)
    : [];
  const gapHeadlineEndEntry = gapHeadlineEntries.find((entry) =>
    /是工作流/u.test(String(entry?.text ?? "")),
  ) ?? gapHeadlineEntries.at(-1);
  const gapHeadline = {
    startMs: gapHeadlineEntries[0]?.startMs,
    endMs: gapHeadlineEndEntry?.endMs,
    badgeText: "最后说一句",
    titlePrefix: "差距不在",
    titleEmphasis: "模型",
  };
  const aiOutputGapStartIndex = entries.findIndex((entry) =>
    /同样一个\s*AI/iu.test(String(entry?.text ?? "")),
  );
  const aiOutputGapEntries = aiOutputGapStartIndex >= 0
    ? entries.slice(aiOutputGapStartIndex).slice(0, 3)
    : [];
  const aiOutputGapEndEntry = aiOutputGapEntries.find((entry) =>
    /能直接上线/u.test(String(entry?.text ?? "")),
  ) ?? aiOutputGapEntries.at(-1);
  const aiOutputGapQuote = {
    startMs: aiOutputGapEntries[0]?.startMs,
    endMs: aiOutputGapEndEntry?.endMs,
    leadText: "同样一个 AI，",
    bodyText: "做出来的东西却差了一整个档次。",
  };
  const aiOutputGapComparisonStartIndex = entries.findIndex((entry) =>
    /一眼就是\s*AI\s*糊/iu.test(String(entry?.text ?? "")),
  );
  const aiOutputGapComparisonEntries = aiOutputGapComparisonStartIndex >= 0
    ? entries.slice(aiOutputGapComparisonStartIndex).slice(0, 2)
    : [];
  const aiOutputGapComparisonEndEntry = aiOutputGapComparisonEntries.find((entry) =>
    /能直接上线/u.test(String(entry?.text ?? "")),
  ) ?? aiOutputGapComparisonEntries.at(-1);
  const aiOutputGapComparison = {
    startMs: aiOutputGapComparisonEntries[0]?.startMs,
    endMs: aiOutputGapComparisonEndEntry?.endMs,
    gapLabel: "THE GAP",
    badText: "一眼就是 AI 糊的",
    goodText: "能直接上线",
    badSymbol: "×",
    goodSymbol: "✓",
  };

  return {
    enumeratedItems: enumeratedItems.slice(0, 4),
    promptDiagnosis,
    workflowPrerequisite,
    skillIdentity,
    skillSourceFusion,
    designRules,
    skillResultComparison,
    promptIterations,
    gsapSkill,
    codeDecisionChecklist,
    browserRepairLoop,
    browserSelfCheckMedia,
    skillStepGrid,
    gapHeadline,
    aiOutputGapQuote,
    aiOutputGapComparison,
  };
};

const portraitStyleForRoute = (routeId) => {
  const accents = {
    "chapter-transition": "#168CFF",
    "info-callout": "#168CFF",
    "metric-decision": "#14E6A1",
    "enumerated-tool-list": "#F2D51B",
    "direct-prompt-mistake": "#F2D51B",
    "workflow-prerequisite": "#17D9E8",
    "skill-identity": "#17D9E8",
    "skill-source-fusion": "#17D9E8",
    "design-rule-checklist": "#17D9E8",
    "skill-result-comparison": "#17D9E8",
    "comparison-progress-bars": "#22F3EE",
    "milestone-follower-progress": "#20F2E9",
    "prompt-iteration-showcase": "#17D9E8",
    "gsap-skill-showcase": "#17D9E8",
    "code-decision-checklist": "#9A73FF",
    "browser-repair-loop": "#4E85FF",
    "browser-self-check-media": "#638CFF",
    "gap-headline": "#1FD9E8",
    "ai-output-gap-quote": "#1FD9E8",
    "ai-output-gap-comparison": "#1FD9E8",
    "process-steps": "#168CFF",
    "risk-boundary": "#FF493D",
    "next-episode-cta": "#168CFF",
  };
  return {
    accentColor: accents[routeId] ?? "#168CFF",
    secondaryColor: "#14E6A1",
    tertiaryColor: "#A36CFF",
    quaternaryColor: "#5986FF",
    successColor: "#14E6A1",
    warningColor: "#FF493D",
    eliminationAccentColor: "#FFB735",
    eliminationPanelColor: "#080F19",
    listHighlightColor: "#F2D51B",
    panelColor: "#111318",
    ringColor: "#27406E",
    textColor: "#FFFFFF",
    mutedTextColor: "#777887",
    shadowColor: "#000000",
  };
};

const iconTextForId = (iconId) =>
  ({
    arrow: "↗",
    code: "</>",
    speed: "↗",
    timeline: "▣",
    "seal-check": "✓",
    "list-checks": "▣",
  })[iconId] ?? "✦";

const riskConclusionForText = (text) => {
  if (/致癌/u.test(text)) return "存在致癌风险";
  if (/不达标/u.test(text)) return "检测不达标";
  if (/超标/u.test(text)) return "含量严重超标";
  if (/皮炎|红肿|流脓|伤害|肾脏|健康/u.test(text)) return "存在健康风险";
  if (/假货|骗人|露馅/u.test(text)) return "谨防假冒产品";
  if (/不划算|得不偿失/u.test(text)) return "可能得不偿失";
  return "注意风险与限制";
};

const portraitContext = ({ route, text, timing, fps, documentContext }) => {
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
  const eliminationWarning =
    route.id === "risk-boundary" && isEliminationWarning(text);
  const elimination = eliminationDetails(text);
  const documentItems = documentContext?.enumeratedItems ?? [];
  const promptDiagnosis = documentContext?.promptDiagnosis ?? {
    eyebrow: "你是不是也这样",
    titlePrefix: "打开就",
    titleEmphasis: "直接开口",
    prompt: "帮我做一个官网",
    issue1: "配色随机",
    issue2: "动效生硬",
    issue3: "代码冗余",
    conclusionPrefix: "问题不在模型，是你",
    conclusionEmphasis: "少了准备这一步",
  };
  const workflowPrerequisite = documentContext?.workflowPrerequisite ?? {
    kicker: "动手做网页之前",
    titleEmphasis: "先装工作流，",
    titleSuffix: "再动手",
    subtitleLine1: "先把这套 Skill 工作流装好，",
    subtitleLine2: "AI 才知道该按什么规矩走。",
    workflowLabel: "THE WORKFLOW",
    stepCount: 4,
    step1: "审美",
    step2: "动效",
    step3: "工程",
    step4: "自测",
    footerEmphasis: "顺序不能反",
    footerText: "先定审美，最后自测",
  };
  const skillIdentity = documentContext?.skillIdentity ?? {
    sequenceText: "01",
    title: "我自己做的 Skill",
    subtitle: "UI 审美 · 全流程规范",
    badge: "C 位",
    updateText: "持续更新中 · 新规则滚动迭代",
  };
  const skillSourceFusion = documentContext?.skillSourceFusion ?? {
    sequenceText: "01",
    title: "我自己做的 Skill",
    subtitle: "UI 审美 · 全流程规范",
    badge: "C 位",
    sourceCount: 3,
    source1: "TASTE",
    source1Detail: "审美判断 · 来自 Taste",
    source2: "IMPECCABLE",
    source2Detail: "反廉价规则 · 来自 Impeccable",
    source3: "自己的经验",
    source3Detail: "日常实战 · 持续积累",
  };
  const designRules = documentContext?.designRules ?? {
    ruleCount: 4,
    rule1: "排版网格",
    rule2: "留白密度",
    rule3: "配色层级",
    rule4: "视觉一致性",
  };
  const skillResultComparison = documentContext?.skillResultComparison ?? {
    materialCount: 3,
    material1Eyebrow: "WITHOUT THE SKILL",
    material1Title: "没装它",
    material1Detail: "AI 随手做出来的默认效果",
    material2Eyebrow: "WITH THE SKILL",
    material2Title: "装了它",
    material2Detail: "同一个 AI，同一句话",
    material3Eyebrow: "ANOTHER INDUSTRY",
    material3Title: "换个行业",
    material3Detail: "质感照样稳定",
    firstSwitchSeconds: 3.1,
    materialIntervalSeconds: 3.5,
  };
  const promptIterations = documentContext?.promptIterations ?? {
    iterationCount: 3,
    eyebrow: "HOW TO USE",
    title: "怎么用？",
    emphasis: "一句话，改一版",
    ghostNumber: "01",
    waitingText: "等待第一句话",
    iteration1Prompt: "做一个摄影工作室的品牌官网",
    iteration1Badge: "品牌官网",
    iteration2Prompt: "改成数据后台，深色",
    iteration2Badge: "数据后台",
    iteration3Prompt: "换成产品落地页",
    iteration3Badge: "产品落地页",
    firstResultSeconds: 3.1,
    iterationIntervalSeconds: 5.2,
  };
  const gsapSkill = documentContext?.gsapSkill ?? {
    sequenceText: "02",
    title: "GSAP Skills",
    subtitle: "动效引擎 · 高级动画",
    badge: "★ 26K",
    capabilityCount: 3,
    capability1Title: "ScrollTrigger",
    capability1Detail: "滚动进度驱动动画",
    capability2Title: "Timeline",
    capability2Detail: "时间轴精确编排",
    capability3Title: "Stagger",
    capability3Detail: "多元素错峰入场",
    controlLead: "什么时候出现、什么时候结束、快慢怎么给——",
    controlEmphasis: "它全管。",
    firstSkillTitle: "我自己做的 Skill",
    firstSkillDetail: "管页面好不好看",
    secondSkillTitle: "GSAP Skills",
    secondSkillDetail: "管它动得好不好看",
    conclusionLead: "一个定住美感，",
    conclusionEmphasis: "一个让它动起来",
    capabilityStartSeconds: 2.8,
    capabilityIntervalSeconds: 1.15,
    pairRevealSeconds: 11.2,
    conclusionRevealSeconds: 14.1,
  };
  const codeDecisionChecklist = documentContext?.codeDecisionChecklist ?? {
    questionCount: 6,
    question1: "这个功能真的需要吗",
    question2: "现有代码里有没有",
    question3: "标准库有没有",
    question4: "原生平台有没有",
    question5: "已装依赖有没有",
    question6: "一行能搞定吗",
    firstHighlightSeconds: 1.15,
    questionIntervalSeconds: 1.11,
  };
  const browserRepairLoop = documentContext?.browserRepairLoop ?? {
    stepCount: 6,
    step1: "打开浏览器",
    step2: "运行页面",
    step3: "自动截图",
    step4: "发现问题",
    step5: "自动修复",
    step6: "再验证",
    centerTitle: "一直循环",
    centerSubtitle: "直到没问题",
    firstNodeHighlightSeconds: 0.2,
    nextNodeHighlightIntervalSeconds: 1.26,
    loopIntervalSeconds: 0.5,
  };
  const browserSelfCheckMedia = documentContext?.browserSelfCheckMedia ?? {
    titlePrefix: "Agent 自己开浏览器，",
    titleHighlight: "逐屏自查",
    browserLabel: "playwright · headed",
  };
  const skillStepGrid = documentContext?.skillStepGrid ?? {
    stepCount: 4,
    headerText: "STEP 1 → 4",
    step1Title: "我自己做的 Skill", step1Subtitle: "定审美",
    step2Title: "GSAP", step2Subtitle: "跟动效",
    step3Title: "Ponytail", step3Subtitle: "保克制",
    step4Title: "Playwright MCP", step4Subtitle: "自测自修",
  };
  const gapHeadline = documentContext?.gapHeadline ?? {
    badgeText: "最后说一句",
    titlePrefix: "差距不在",
    titleEmphasis: "模型",
  };
  const aiOutputGapQuote = documentContext?.aiOutputGapQuote ?? {
    leadText: "同样一个 AI，",
    bodyText: "做出来的东西却差了一整个档次。",
  };
  const aiOutputGapComparison = documentContext?.aiOutputGapComparison ?? {
    gapLabel: "THE GAP",
    badText: "一眼就是 AI 糊的",
    goodText: "能直接上线",
    badSymbol: "×",
    goodSymbol: "✓",
  };
  const fallbackItems = labels.length >= 2
    ? labels.slice(0, 4).map((label, index) => ({
        label,
        detail: "逐项说明",
        badge: `0${index + 1}`,
      }))
    : [1, 2, 3, 4].map((index) => ({
        label: `工具 ${index}`,
        detail: "逐项说明",
        badge: `0${index}`,
      }));
  const enumeratedItems = (documentItems.length >= 2 ? documentItems : fallbackItems)
    .slice(0, 4);
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
    "info-callout": "补充说明",
    "evidence-source": "检测证据",
    "enumerated-tool-list": "4 个 Skill",
    "direct-prompt-mistake": "错误提问",
    "workflow-prerequisite": "先装工作流",
    "metric-decision": "推荐方案",
    "process-steps": "执行流程",
    "action-advice": "行动建议",
    "risk-boundary": "风险提醒",
    "next-episode-cta": "下期",
  };
  const topics = {
    "chapter-transition": shorten(chapterTopic || fragments[0] || text, 16),
    "info-callout": shorten(fragments[0] || text, 14),
    "evidence-source": shorten(fragments[0] || text, 14),
    "enumerated-tool-list": "多项能力准备",
    "direct-prompt-mistake": "直接提问",
    "workflow-prerequisite": "审美到自测",
    "metric-decision": shorten(text, 18),
    "process-steps": "操作步骤",
    "action-advice": shorten(fragments[0] || text, 14),
    "risk-boundary": shorten(riskTopic || fragments[0] || "风险提醒", 12),
    "next-episode-cta": englishTitle || shorten(ctaTopic || "下集预告", 12),
  };
  const detail =
    route.id === "next-episode-cta"
      ? shorten(ctaTopic.replace(englishTitle, "").trim() || "自动剪辑", 14)
      : shorten(fragments[1] || fragments[0] || text, 20);
  const segmentSeconds = (timing.endFrame - timing.startFrame) / fps;
  const animationSeconds = route.id === "enumerated-tool-list"
    ? Math.max(1.8, Math.min(3.2, Number((segmentSeconds - 0.15).toFixed(2))))
    : route.id === "direct-prompt-mistake"
      ? Math.max(4.5, Math.min(8, Number((segmentSeconds - 0.25).toFixed(2))))
      : route.id === "workflow-prerequisite"
        ? Math.max(3.5, Math.min(6, Number((segmentSeconds - 0.2).toFixed(2))))
      : route.id === "skill-result-comparison"
        ? Math.max(6, Math.min(14, Number(segmentSeconds.toFixed(2))))
      : route.id === "prompt-iteration-showcase"
        ? Math.max(10, Math.min(24, Number(segmentSeconds.toFixed(2))))
      : route.id === "gsap-skill-showcase"
        ? Math.max(10, Math.min(24, Number(segmentSeconds.toFixed(2))))
      : route.id === "code-decision-checklist"
        ? Math.max(4, Math.min(12, Number(segmentSeconds.toFixed(2))))
      : route.id === "browser-repair-loop"
        ? Math.max(6, Math.min(16, Number(segmentSeconds.toFixed(2))))
      : route.id === "browser-self-check-media"
        ? Math.max(3, Math.min(12, Number(segmentSeconds.toFixed(2))))
      : route.id === "skill-step-grid"
        ? Math.max(2, Math.min(8, Number(segmentSeconds.toFixed(2))))
      : route.id === "gap-headline"
        ? Math.max(2, Math.min(8, Number(segmentSeconds.toFixed(2))))
      : route.id === "ai-output-gap-quote"
        ? Math.max(2, Math.min(8, Number(segmentSeconds.toFixed(2))))
      : route.id === "ai-output-gap-comparison"
        ? Math.max(2, Math.min(8, Number(segmentSeconds.toFixed(2))))
      : Math.max(
          0.4,
          Math.min(1.6, Number((segmentSeconds / 2).toFixed(2))),
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
          ? riskConclusionForText(text)
          : route.id === "metric-decision"
            ? shorten(text, 18)
            : detail,
      keywords: { 1: keywords[0] ?? "", 2: keywords[1] ?? "", 3: keywords[2] ?? "" },
      highlightIndex: Math.min(3, Math.max(1, keywords.length)),
      metric: {
        label: "核心数据",
        value: metric.value,
        unit: metric.unit,
        verdict: /更推荐|推荐/u.test(text)
          ? "更推荐"
          : /更快|更低|更高|更好/u.exec(text)?.[0] ?? "重点数据",
      },
      labels: { 1: labels[0] ?? "", 2: labels[1] ?? "", 3: labels[2] ?? "" },
      items: {
        1: enumeratedItems[0]?.label ?? "工具 1",
        2: enumeratedItems[1]?.label ?? "工具 2",
        3: enumeratedItems[2]?.label ?? "工具 3",
        4: enumeratedItems[3]?.label ?? "工具 4",
      },
      itemDetails: {
        1: enumeratedItems[0]?.detail ?? "逐项说明",
        2: enumeratedItems[1]?.detail ?? "逐项说明",
        3: enumeratedItems[2]?.detail ?? "逐项说明",
        4: enumeratedItems[3]?.detail ?? "逐项说明",
      },
      itemBadges: {
        1: enumeratedItems[0]?.badge ?? "01",
        2: enumeratedItems[1]?.badge ?? "02",
        3: enumeratedItems[2]?.badge ?? "03",
        4: enumeratedItems[3]?.badge ?? "04",
      },
      promptDiagnosis,
      workflowPrerequisite,
      skillIdentity,
      skillSourceFusion,
      designRules,
      skillResultComparison,
      promptIterations,
      gsapSkill,
      codeDecisionChecklist,
      browserRepairLoop,
      browserSelfCheckMedia,
      skillStepGrid,
      gapHeadline,
      aiOutputGapQuote,
      aiOutputGapComparison,
      steps: { 1: steps[0] ?? "", 2: steps[1] ?? "", 3: steps[2] ?? "" },
      risks: { 1: risks[0] ?? "", 2: risks[1] ?? "", 3: risks[2] ?? "" },
      elimination,
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
    evidence: { keywordCount: keywords.length, labelCount: labels.length, listItemCount: enumeratedItems.length, stepCount: steps.length, riskCount: risks.length, metricFound: Boolean(metric.raw), eliminationWarning },
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
  if (activation === "when-two-or-more-list-items-present") return context.evidence.listItemCount >= 2;
  if (activation === "when-elimination-warning") return context.evidence.eliminationWarning;
  if (activation === "unless-elimination-warning") return !context.evidence.eliminationWarning;
  return true;
};

const PORTRAIT_CANDIDATE_PROFILES = Object.freeze({
  "code-decision-checklist": [
    { componentId: "PortraitCodeDecisionChecklist", reason: "按字幕顺序逐行点亮六个代码决策问题" },
  ],
  "browser-repair-loop": [
    { componentId: "PortraitBrowserRepairLoop", reason: "用六个环形节点循环展示浏览器自动测试、修复与复验流程" },
  ],
  "browser-self-check-media": [
    { componentId: "PortraitAgentBrowserMedia", reason: "用可上传的图片或视频展示 Agent 浏览器逐屏自查结果" },
  ],
  "skill-step-grid": [
    { componentId: "PortraitSkillStepGrid", reason: "用 STEP 1 到 4 的横向卡片清晰列出四个 Skill 分工" },
  ],
  "gap-headline": [
    { componentId: "PortraitGapHeadline", reason: "用徽标与超大标题强调差距不在模型这一核心结论" },
  ],
  "ai-output-gap-quote": [
    { componentId: "PortraitAiOutputGapQuote", reason: "用双行引用强调相同 AI 产生不同输出档次" },
  ],
  "ai-output-gap-comparison": [
    { componentId: "PortraitAiOutputGapComparison", reason: "用红色叉号与青色勾号对比 AI 糊感和可直接上线的结果" },
  ],
  "chapter-transition": [
    { componentId: "PortraitChapterRail", reason: "突出章节标题和阶段切换" },
    { componentId: "PortraitInfoCallout", reason: "用轻量说明卡承接新章节" },
  ],
  "info-callout": [
    { componentId: "PortraitInfoCallout", reason: "适合工具、方法和补充解释" },
    { componentId: "PortraitChapterRail", reason: "适合把说明提升为小节标题" },
  ],
  "evidence-source": [
    { componentId: "PortraitInfoCallout", reason: "适合呈现检测来源、机构结论和事实证据" },
  ],
  "enumerated-tool-list": [
    { componentId: "PortraitStaggeredToolList", reason: "按口播节奏错峰列出多个工具、技能或方法" },
    { componentId: "PortraitStepChecklist", reason: "当条目强调先后顺序时可改用步骤清单" },
    { componentId: "PortraitInfoCallout", reason: "当内容较短时可压缩为说明卡" },
  ],
  "direct-prompt-mistake": [
    { componentId: "PortraitPromptMistakeDiagnosis", reason: "逐字展示错误提问，并错峰标出视觉与代码问题" },
    { componentId: "PortraitRiskWarning", reason: "当内容只需保留风险结论时可改用提醒卡" },
    { componentId: "PortraitInfoCallout", reason: "当内容较短时可压缩为说明卡" },
  ],
  "workflow-prerequisite": [
    { componentId: "PortraitWorkflowPrerequisite", reason: "横向点亮审美、动效、工程、自测四步前置流程" },
    { componentId: "PortraitStepChecklist", reason: "当流程更适合纵向阅读时可改用步骤清单" },
    { componentId: "PortraitInfoCallout", reason: "当内容较短时可压缩为工作流说明卡" },
  ],
  "skill-identity": [
    { componentId: "PortraitSkillIdentityCard", reason: "用编号、身份标题、徽标和更新状态介绍首个 Skill" },
    { componentId: "PortraitInfoCallout", reason: "当身份信息较短时可压缩为说明卡" },
  ],
  "skill-source-fusion": [
    { componentId: "PortraitSkillSourceFusion", reason: "依次展示 Taste、Impeccable 与个人经验，并收束为一个 Skill" },
    { componentId: "PortraitStaggeredToolList", reason: "当来源数量继续增加时可改用错峰列表" },
    { componentId: "PortraitInfoCallout", reason: "当只需保留合成结论时可压缩为说明卡" },
  ],
  "design-rule-checklist": [
    { componentId: "PortraitDesignRuleChecklist", reason: "按口播顺序逐项点亮排版、留白、配色和层级规则" },
    { componentId: "PortraitStepChecklist", reason: "当规则需要强调执行先后时可改用步骤清单" },
    { componentId: "PortraitInfoCallout", reason: "当只需保留规则结论时可压缩为说明卡" },
  ],
  "skill-result-comparison": [
    { componentId: "PortraitSkillResultComparison", reason: "用发光擦除线依次对比默认效果、Skill 优化效果和另一行业案例" },
    { componentId: "ComparisonProgressBars", reason: "用上下两张状态卡和进度线对比旧方案与持续方案" },
    { componentId: "MediaSpotlightCard", reason: "当只需展示单个案例画面时可改用媒体聚焦卡" },
    { componentId: "PortraitDecisionTagStack", reason: "当没有案例素材时可压缩为文字对比标签" },
  ],
  "comparison-progress-bars": [
    { componentId: "ComparisonProgressBars", reason: "用上下两张状态卡和进度线呈现旧方案与持续方案的差异" },
  ],
  "milestone-follower-progress": [
    { componentId: "MilestoneFollowerProgress", reason: "用超大数值、当前值与年度目标表达增长里程碑" },
  ],
  "prompt-iteration-showcase": [
    { componentId: "PortraitPromptIterationShowcase", reason: "用提示词输入条和发光擦除转场连续展示多次改版结果" },
    { componentId: "PortraitSkillResultComparison", reason: "当重点是结果差异而不是操作过程时可改用素材对比" },
    { componentId: "MediaSpotlightCard", reason: "当只展示最终页面时可压缩为单个媒体聚焦卡" },
  ],
  "gsap-skill-showcase": [
    { componentId: "PortraitGsapSkillShowcase", reason: "用能力卡、时间控制说明和双 Skill 配合关系呈现 GSAP 高级动画能力" },
    { componentId: "PortraitSkillIdentityHeaderBar", reason: "用独立身份条呈现编号、Skill 名称、副标题和徽标" },
    { componentId: "PortraitStepChecklist", reason: "当重点是滚动触发、时间轴和错峰入场的执行顺序时可改用步骤清单" },
    { componentId: "PortraitInfoCallout", reason: "当只需介绍 GSAP 定位时可压缩为说明卡" },
  ],
  "metric-decision": [
    { componentId: "PortraitMetricDecision", reason: "突出核心数字和推荐结论" },
    { componentId: "PortraitDecisionTagStack", reason: "并列展示多个判断标签" },
    { componentId: "PortraitInfoCallout", reason: "弱化数据感，改用结论说明卡" },
  ],
  "process-steps": [
    { componentId: "PortraitStepChecklist", reason: "逐步呈现操作流程" },
    { componentId: "PortraitInfoCallout", reason: "将流程压缩为简短说明" },
    { componentId: "PortraitChapterRail", reason: "作为流程章节的开场提示" },
  ],
  "action-advice": [
    { componentId: "PortraitInfoCallout", reason: "适合呈现单条购买建议和处理方法" },
    { componentId: "PortraitStepChecklist", reason: "当建议包含多个步骤时可改用清单" },
  ],
  "risk-boundary": [
    { componentId: "PortraitRiskWarning", reason: "适合一般风险和使用边界" },
    { componentId: "LegacyEliminationPanel", reason: "适合过时、淘汰和被取代语义" },
    { componentId: "PortraitInfoCallout", reason: "用较克制的说明方式提示限制" },
  ],
  "next-episode-cta": [
    { componentId: "PortraitNextEpisodeCta", reason: "突出关注动作和下集内容" },
    { componentId: "PortraitChapterRail", reason: "用章节式结尾预告下一部分" },
    { componentId: "PortraitInfoCallout", reason: "以轻量卡片收束口播" },
  ],
});

const portraitCandidateAllowed = (componentId, context) => {
  if (componentId === "PortraitStaggeredToolList") {
    return context.evidence.listItemCount >= 2;
  }
  if (componentId === "PortraitMetricDecision") return context.evidence.metricFound;
  if (componentId === "PortraitDecisionTagStack") return context.evidence.labelCount >= 2;
  if (componentId === "PortraitStepChecklist") return context.evidence.stepCount >= 2;
  if (componentId === "LegacyEliminationPanel") {
    return context.evidence.eliminationWarning;
  }
  return true;
};

const portraitCandidateProps = (componentId, route, context) => {
  const routedSelection = route.components.find(
    (selection) => selection.componentId === componentId,
  );
  if (routedSelection) {
    return propsFromBindings(routedSelection.propBindings, context);
  }
  const shared = {
    accentColor: context.style.accentColor,
    panelColor: context.style.panelColor,
    textColor: context.style.textColor,
    animationSeconds: context.timing.animationSeconds,
  };
  if (componentId === "PortraitChapterRail") {
    return {
      ...shared,
      title: context.segment.topic,
      subtitle: context.segment.detail,
    };
  }
  if (componentId === "PortraitInfoCallout") {
    return {
      ...shared,
      eyebrow: context.segment.label,
      title: context.segment.topic,
      detail: context.segment.detail,
      note: context.segment.note || context.intent.conclusion,
      iconText: context.resource.iconText,
    };
  }
  if (componentId === "PortraitStepChecklist") {
    return {
      ...shared,
      eyebrow: context.segment.label,
      title: context.segment.topic,
      subtitle: context.segment.detail,
      step1: context.intent.steps[1],
      step2: context.intent.steps[2],
      step3: context.intent.steps[3],
      icon1: context.intent.symbols[1],
      icon2: context.intent.symbols[2],
      icon3: context.intent.symbols[3],
      successColor: context.style.successColor,
    };
  }
  return shared;
};

const portraitComponentCandidates = (
  route,
  context,
  availableIds,
  capabilitiesById,
) =>
  (PORTRAIT_CANDIDATE_PROFILES[route.id] ?? [])
    .filter(
      ({ componentId }) =>
        availableIds.has(componentId) && portraitCandidateAllowed(componentId, context),
    )
    .map((candidate, originalIndex) => ({
      ...candidate,
      originalIndex,
      semanticMatch: semanticMatchFor(
        candidate.componentId,
        route.intentType,
        capabilitiesById,
      ),
      props: portraitCandidateProps(candidate.componentId, route, context),
    }))
    .sort(
      (left, right) =>
        semanticMatchWeight(left.semanticMatch) -
          semanticMatchWeight(right.semanticMatch) ||
        left.originalIndex - right.originalIndex,
    )
    .map(({ originalIndex: _originalIndex, ...candidate }, index) => ({
      ...candidate,
      rank: index + 1,
    }));

const PORTRAIT_DIVERSITY_POLICY = Object.freeze({
  cooldownIntentCount: 2,
  maxIntentsPerCueForSupportingMotion: 1,
  repeatedComponentPenalty: 1000,
  semanticFallbackPenalty: 5000,
  semanticSecondaryPenalty: 1500,
  usagePenalty: 20,
});

const PORTRAIT_FALLBACK_LAYOUTS = Object.freeze({
  PortraitChapterRail: {
    anchor: "center-top",
    fallbackAnchors: ["left-top", "right-top"],
    preferredScale: 1,
  },
  PortraitInfoCallout: {
    anchor: "right-top",
    fallbackAnchors: ["left-top", "right-center", "left-center"],
    preferredScale: 0.72,
  },
  PortraitMetricDecision: {
    anchor: "left-top",
    fallbackAnchors: ["right-top", "left-center"],
    preferredScale: 0.64,
  },
  PortraitDecisionTagStack: {
    anchor: "right-center",
    fallbackAnchors: ["right-top", "left-center"],
    preferredScale: 0.82,
  },
  PortraitStepChecklist: {
    anchor: "right-top",
    fallbackAnchors: ["left-top", "right-center", "left-center"],
    preferredScale: 0.62,
  },
  PortraitStaggeredToolList: {
    anchor: "center-top",
    fallbackAnchors: ["left-top", "right-top"],
    preferredScale: 0.92,
  },
  PortraitSkillIdentityCard: {
    anchor: "left-top",
    fallbackAnchors: ["center-top", "right-top"],
    preferredScale: 1,
  },
  PortraitSkillSourceFusion: {
    anchor: "left-top",
    fallbackAnchors: ["center-top", "right-top"],
    preferredScale: 1,
  },
  PortraitDesignRuleChecklist: {
    anchor: "left-top",
    fallbackAnchors: ["center-top", "right-top"],
    preferredScale: 1,
  },
  PortraitSkillResultComparison: {
    anchor: "left-top",
    fallbackAnchors: ["center-top", "right-top"],
    preferredScale: 1,
  },
  PortraitPromptIterationShowcase: {
    anchor: "left-top",
    fallbackAnchors: ["center-top", "right-top"],
    preferredScale: 1,
  },
  PortraitGsapSkillShowcase: {
    anchor: "left-top",
    fallbackAnchors: ["center-top", "right-top"],
    preferredScale: 1,
  },
  PortraitSkillIdentityHeaderBar: {
    anchor: "left-top",
    fallbackAnchors: ["center-top", "right-top"],
    preferredScale: 1,
  },
  ComparisonProgressBars: {
    anchor: "left-center",
    fallbackAnchors: ["center-top", "right-center"],
    preferredScale: 0.9,
  },
  MilestoneFollowerProgress: {
    anchor: "left-top",
    fallbackAnchors: ["left-center", "right-top"],
    preferredScale: 0.86,
  },
  PortraitRiskWarning: {
    anchor: "left-top",
    fallbackAnchors: ["right-top", "left-center", "right-center"],
    preferredScale: 0.64,
  },
  LegacyEliminationPanel: {
    anchor: "left-top",
    fallbackAnchors: ["right-top", "left-center", "right-center"],
    preferredScale: 0.64,
  },
  PortraitNextEpisodeCta: {
    anchor: "right-top",
    fallbackAnchors: ["left-top", "right-center"],
    preferredScale: 0.78,
  },
});

const portraitLayoutForCandidate = (componentId, route) => {
  const routedLayout = route.components.find(
    (selection) => selection.componentId === componentId,
  )?.layout;
  return routedLayout ?? PORTRAIT_FALLBACK_LAYOUTS[componentId];
};

const selectDiversePortraitCandidates = ({
  route,
  context,
  availableIds,
  capabilitiesById,
  intentCountInCue,
  cueFrameCount,
  diversityState,
  componentPreferenceScores,
}) => {
  const candidates = portraitComponentCandidates(
    route,
    context,
    availableIds,
    capabilitiesById,
  );
  const activeSelections = route.components.filter(
    (selection) =>
      availableIds.has(selection.componentId) &&
      activationAllows(selection.activation, context),
  );
  if (candidates.length === 0 || activeSelections.length === 0) return [];

  if (context.evidence.eliminationWarning) {
    const eliminationCandidate = candidates.find(
      (candidate) => candidate.componentId === "LegacyEliminationPanel",
    );
    return eliminationCandidate ? [eliminationCandidate] : [];
  }

  const requiredSelections = activeSelections.filter(
    (selection) => selection.required === true,
  );
  if (requiredSelections.length > 0) {
    return activeSelections
      .filter((selection) => selection.role === "primary" || selection.required === true)
      .flatMap((selection) => {
        const candidate = candidates.find(
          (item) => item.componentId === selection.componentId,
        );
        return candidate ? [candidate] : [];
      });
  }

  const learnedCandidate = [...candidates].sort(
    (left, right) =>
      (Number(componentPreferenceScores?.[right.componentId]) || 0) -
        (Number(componentPreferenceScores?.[left.componentId]) || 0) ||
      left.rank - right.rank,
  )[0];
  if (
    learnedCandidate &&
    (Number(componentPreferenceScores?.[learnedCandidate.componentId]) || 0) > 0 &&
    activeSelections.some(
      (selection) => selection.componentId === learnedCandidate.componentId,
    )
  ) {
    return [learnedCandidate];
  }

  const routeUseCount = diversityState.routeUsage.get(route.id) ?? 0;
  if (
    activeSelections.length > 1 &&
    routeUseCount === 0 &&
    intentCountInCue <=
      PORTRAIT_DIVERSITY_POLICY.maxIntentsPerCueForSupportingMotion &&
    cueFrameCount >=
      PORTRAIT_ROUTING_POLICY.density.minCueFramesForSupportingMotion
  ) {
    return activeSelections.flatMap((selection) => {
      const candidate = candidates.find(
        (item) => item.componentId === selection.componentId,
      );
      return candidate ? [candidate] : [];
    });
  }

  if (activeSelections.length > 1) {
    diversityState.supportingSuppressedCount += activeSelections.length - 1;
  }
  const recentIds = new Set(
    diversityState.recentComponentIds.slice(
      -PORTRAIT_DIVERSITY_POLICY.cooldownIntentCount,
    ),
  );
  const ranked = [...candidates].sort((left, right) => {
    const score = (candidate) =>
      (recentIds.has(candidate.componentId)
        ? PORTRAIT_DIVERSITY_POLICY.repeatedComponentPenalty
        : 0) +
      (candidate.semanticMatch?.strength === "fallback"
        ? PORTRAIT_DIVERSITY_POLICY.semanticFallbackPenalty
        : candidate.semanticMatch?.strength === "secondary"
          ? PORTRAIT_DIVERSITY_POLICY.semanticSecondaryPenalty
          : 0) +
      (diversityState.componentUsage.get(candidate.componentId) ?? 0) *
        PORTRAIT_DIVERSITY_POLICY.usagePenalty +
      Math.max(
        -12,
        Math.min(8, Number(componentPreferenceScores?.[candidate.componentId]) || 0),
      ) * -600 +
      candidate.rank;
    return score(left) - score(right);
  });
  const chosen = ranked[0];
  const baselineId = activeSelections[0]?.componentId;
  if (baselineId && chosen.componentId !== baselineId && recentIds.has(baselineId)) {
    diversityState.repeatedAvoidedCount += 1;
  }
  return [chosen];
};

const recordPortraitCandidateUsage = (routeId, candidates, diversityState) => {
  candidates.forEach((candidate) => {
    diversityState.componentUsage.set(
      candidate.componentId,
      (diversityState.componentUsage.get(candidate.componentId) ?? 0) + 1,
    );
    diversityState.recentComponentIds.push(candidate.componentId);
  });
  diversityState.recentComponentIds = diversityState.recentComponentIds.slice(
    -PORTRAIT_DIVERSITY_POLICY.cooldownIntentCount,
  );
  diversityState.routeUsage.set(
    routeId,
    (diversityState.routeUsage.get(routeId) ?? 0) + 1,
  );
};

const buildPortraitSemanticSrtArrangement = ({
  entries,
  fps,
  durationInFrames,
  canvas,
  availableComponentIds,
  componentCapabilities,
  resourceIndex,
  documentContext,
  componentPreferenceScores = {},
}) => {
  const componentIds = new Set(availableComponentIds);
  const capabilitiesById = semanticCapabilityMap(componentCapabilities);
  const resolvedDocumentContext =
    documentContext ?? portraitDocumentContextFor(entries);
  const motionTimeline = [];
  const resourceTracks = [];
  const cueAnalyses = [];
  const messages = [];
  let intentCount = 0;
  let trackOrder = 0;
  const diversityState = {
    recentComponentIds: [],
    componentUsage: new Map(),
    routeUsage: new Map(),
    repeatedAvoidedCount: 0,
    supportingSuppressedCount: 0,
  };
  const entryMatches = entries.map((entry, entryPosition) => {
    const rawMatched = portraitRouteMatchesForEntry(entry, componentIds);
    return {
      entry,
      entryPosition,
      rawMatchedCount: rawMatched.length,
      matched: rawMatched.slice(0, PORTRAIT_ROUTING_POLICY.maxIntentsPerCue),
    };
  });
  const visualPlan = planPortraitVisualIntents(entryMatches);
  let suppressedIntentCount = 0;

  const sourceCueLabel = (entry) => {
    const indices = entry.sourceCueIndices ?? [entry.index];
    return indices.length === 1
      ? String(indices[0])
      : `${indices[0]}–${indices.at(-1)}`;
  };

  for (const {
    entry,
    entryPosition,
    matched,
    rawMatchedCount,
  } of entryMatches) {
    const selectedRoutes = matched.filter(({ route }) =>
      visualPlan.selectedKeys.has(`${entryPosition}:${route.id}`),
    );
    const suppressedRoutes = matched.filter(({ route }) =>
      !visualPlan.selectedKeys.has(`${entryPosition}:${route.id}`),
    );
    const startFrame = Math.max(0, Math.round((entry.startMs / 1000) * fps));
    const endFrame = Math.max(startFrame + 3, Math.round((entry.endMs / 1000) * fps));
    const detected = [];

    selectedRoutes.forEach(({ route, matchResult }, routeIndex) => {
      const sequence = String(entry.index).padStart(3, "0");
      const intentId = `intent-${sequence}-${route.id}`;
      const workflowEndFrame = route.id === "workflow-prerequisite" &&
        Number.isFinite(Number(resolvedDocumentContext.workflowPrerequisite?.endMs))
        ? Math.round((Number(resolvedDocumentContext.workflowPrerequisite.endMs) / 1000) * fps)
        : endFrame;
      const skillIdentityEndFrame = route.id === "skill-identity" &&
        Number.isFinite(Number(resolvedDocumentContext.skillIdentity?.endMs))
        ? Math.round((Number(resolvedDocumentContext.skillIdentity.endMs) / 1000) * fps)
        : endFrame;
      const skillSourceFusionEndFrame = route.id === "skill-source-fusion" &&
        Number.isFinite(Number(resolvedDocumentContext.skillSourceFusion?.endMs))
        ? Math.round((Number(resolvedDocumentContext.skillSourceFusion.endMs) / 1000) * fps)
        : endFrame;
      const designRulesEndFrame = route.id === "design-rule-checklist" &&
        Number.isFinite(Number(resolvedDocumentContext.designRules?.endMs))
        ? Math.round((Number(resolvedDocumentContext.designRules.endMs) / 1000) * fps)
        : endFrame;
      const skillResultEndFrame = route.id === "skill-result-comparison" &&
        Number.isFinite(Number(resolvedDocumentContext.skillResultComparison?.endMs))
        ? Math.round((Number(resolvedDocumentContext.skillResultComparison.endMs) / 1000) * fps)
        : endFrame;
      const promptIterationEndFrame = route.id === "prompt-iteration-showcase" &&
        Number.isFinite(Number(resolvedDocumentContext.promptIterations?.endMs))
        ? Math.round((Number(resolvedDocumentContext.promptIterations.endMs) / 1000) * fps)
        : endFrame;
      const gsapSkillEndFrame = route.id === "gsap-skill-showcase" &&
        Number.isFinite(Number(resolvedDocumentContext.gsapSkill?.endMs))
        ? Math.round((Number(resolvedDocumentContext.gsapSkill.endMs) / 1000) * fps)
        : endFrame;
      const codeDecisionEndFrame = route.id === "code-decision-checklist" &&
        Number.isFinite(Number(resolvedDocumentContext.codeDecisionChecklist?.endMs))
        ? Math.round((Number(resolvedDocumentContext.codeDecisionChecklist.endMs) / 1000) * fps)
        : endFrame;
      const browserRepairEndFrame = route.id === "browser-repair-loop" &&
        Number.isFinite(Number(resolvedDocumentContext.browserRepairLoop?.endMs))
        ? Math.round((Number(resolvedDocumentContext.browserRepairLoop.endMs) / 1000) * fps)
        : endFrame;
      const browserSelfCheckEndFrame = route.id === "browser-self-check-media" &&
        Number.isFinite(Number(resolvedDocumentContext.browserSelfCheckMedia?.endMs))
        ? Math.round((Number(resolvedDocumentContext.browserSelfCheckMedia.endMs) / 1000) * fps)
        : endFrame;
      const skillStepEndFrame = route.id === "skill-step-grid" &&
        Number.isFinite(Number(resolvedDocumentContext.skillStepGrid?.endMs))
        ? Math.round((Number(resolvedDocumentContext.skillStepGrid.endMs) / 1000) * fps)
        : endFrame;
      const gapHeadlineEndFrame = route.id === "gap-headline" &&
        Number.isFinite(Number(resolvedDocumentContext.gapHeadline?.endMs))
        ? Math.round((Number(resolvedDocumentContext.gapHeadline.endMs) / 1000) * fps)
        : endFrame;
      const aiOutputGapEndFrame = route.id === "ai-output-gap-quote" &&
        Number.isFinite(Number(resolvedDocumentContext.aiOutputGapQuote?.endMs))
        ? Math.round((Number(resolvedDocumentContext.aiOutputGapQuote.endMs) / 1000) * fps)
        : endFrame;
      const aiOutputGapComparisonEndFrame = route.id === "ai-output-gap-comparison" &&
        Number.isFinite(Number(resolvedDocumentContext.aiOutputGapComparison?.endMs))
        ? Math.round((Number(resolvedDocumentContext.aiOutputGapComparison.endMs) / 1000) * fps)
        : endFrame;
      const timing = spanForPortraitIntent(
        startFrame,
        Math.max(endFrame, workflowEndFrame, skillIdentityEndFrame, skillSourceFusionEndFrame, designRulesEndFrame, skillResultEndFrame, promptIterationEndFrame, gsapSkillEndFrame, codeDecisionEndFrame, browserRepairEndFrame, browserSelfCheckEndFrame, skillStepEndFrame, gapHeadlineEndFrame, aiOutputGapEndFrame, aiOutputGapComparisonEndFrame),
        routeIndex,
        selectedRoutes.length,
      );
      const context = portraitContext({
        route,
        text: entry.text,
        timing,
        fps,
        documentContext: resolvedDocumentContext,
      });
      const createdMotionIds = [];
      const selectedCandidates = selectDiversePortraitCandidates({
        route,
        context,
        availableIds: componentIds,
        capabilitiesById,
        intentCountInCue: selectedRoutes.length,
        cueFrameCount: endFrame - startFrame,
        diversityState,
        componentPreferenceScores,
      });

      selectedCandidates.forEach((candidate, componentIndex) => {
        const routedSelection = route.components.find(
          (selection) => selection.componentId === candidate.componentId,
        );
        const layout = portraitLayoutForCandidate(candidate.componentId, route);
        if (!layout) return;
        const expressionId = `effect-${sequence}-${route.id}-${componentIndex + 1}`;
        const supportingOffset = routedSelection?.role === "supporting" ? Math.min(6, Math.max(0, timing.endFrame - timing.startFrame - 3)) : 0;
        const componentStart = timing.startFrame + supportingOffset;
        motionTimeline.push({
          componentId: candidate.componentId,
          startFrame: componentStart,
          durationInFrames: Math.max(3, timing.endFrame - componentStart),
          laneId: `motion-${sequence}-${route.id}-${componentIndex + 1}`,
          trackOrder: trackOrder++,
          visible: true,
          sourceStartFrame: 0,
          backgroundOpacity: 0,
          props: candidate.props,
          sourceExpressionId: expressionId,
          sourceIntentId: intentId,
          layoutIntent: {
            anchor: layout.anchor,
            fallbackAnchors: layout.fallbackAnchors,
            preferredScale: layout.preferredScale,
            avoid: PORTRAIT_ROUTING_POLICY.layout.avoid,
            collisionPolicy: PORTRAIT_ROUTING_POLICY.layout.collisionPolicy,
          },
        });
        createdMotionIds.push(candidate.componentId);
      });

      if (createdMotionIds.length === 0) return;
      recordPortraitCandidateUsage(route.id, selectedCandidates, diversityState);

      // 图标不做自动匹配，只允许用户在语义段里手动添加。

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
        componentCandidates: portraitComponentCandidates(
          route,
          context,
          componentIds,
          capabilitiesById,
        ),
        score: matchResult.score,
        minimumScore: matchResult.minimumScore,
        signals: matchResult.signals,
      });
      intentCount += 1;
    });

    const suppressedIntents = suppressedRoutes.map(({ route, matchResult }) => {
      const sequence = String(entry.index).padStart(3, "0");
      const timing = { startFrame, endFrame };
      const context = portraitContext({
        route,
        text: entry.text,
        timing,
        fps,
        documentContext: resolvedDocumentContext,
      });
      suppressedIntentCount += 1;
      return {
        id: `intent-${sequence}-${route.id}`,
        type: route.intentType,
        label: route.label,
        componentId: null,
        componentIds: [],
        componentCandidates: portraitComponentCandidates(
          route,
          context,
          componentIds,
          capabilitiesById,
        ),
        score: matchResult.score,
        minimumScore: matchResult.minimumScore,
        signals: matchResult.signals,
        suppressionReason: "visual-density-budget",
      };
    });

    if (rawMatchedCount > PORTRAIT_ROUTING_POLICY.maxIntentsPerCue) {
      messages.push(
        `语义段 ${sourceCueLabel(entry)} 命中 ${rawMatchedCount} 个竖屏语义，仅分析优先级最高的 ${PORTRAIT_ROUTING_POLICY.maxIntentsPerCue} 个。`,
      );
    }
    if (suppressedIntents.length > 0) {
      messages.push(
        `语义段 ${sourceCueLabel(entry)} 有 ${suppressedIntents.length} 个意图因视觉密度预算未进入预览，已保留为候选记录。`,
      );
    }
    if (detected.length === 0 && suppressedIntents.length === 0) {
      messages.push(`语义段 ${sourceCueLabel(entry)} 未发现需要视觉强化的明确语义，已保留口播但不添加效果。`);
    }
    cueAnalyses.push({
      cueIndex: entry.index,
      sourceCueIndices: entry.sourceCueIndices ?? [entry.index],
      text: entry.text,
      startFrame,
      endFrame,
      intents: detected,
      suppressedIntents,
    });
  }

  const matchedCueCount = cueAnalyses.filter(
    (cue) => cue.intents.length > 0 || cue.suppressedIntents.length > 0,
  ).length;
  const appliedCueCount = cueAnalyses.filter((cue) => cue.intents.length > 0).length;
  const skippedCueCount = cueAnalyses.length - appliedCueCount;
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
    appliedCueCount,
    appliedSegmentCount: appliedCueCount,
    skippedCueCount,
    skippedSegmentCount: skippedCueCount,
    intentCount,
    detectedIntentCount: intentCount + suppressedIntentCount,
    suppressedIntentCount,
    motionCount: motionTimeline.length,
    resourceCount: resourceTracks.length,
    diversitySummary: {
      cooldownIntentCount: PORTRAIT_DIVERSITY_POLICY.cooldownIntentCount,
      repeatedAvoidedCount: diversityState.repeatedAvoidedCount,
      supportingSuppressedCount: diversityState.supportingSuppressedCount,
      componentUsage: Object.fromEntries(diversityState.componentUsage),
    },
    densitySummary: {
      targetSecondsPerMotion:
        PORTRAIT_ROUTING_POLICY.density.targetSecondsPerMotion,
      motionBudget: visualPlan.motionBudget,
      detectedIntentCount: visualPlan.detectedIntentCount,
      selectedIntentCount: intentCount,
      suppressedIntentCount,
      durationSeconds: Number(visualPlan.durationSeconds.toFixed(3)),
    },
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
    documentContext: portraitDocumentContextFor(input.entries),
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
