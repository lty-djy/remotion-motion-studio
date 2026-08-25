let batchSequence = 0;

const stableId = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(text) ? text : "";
};

export const createArrangementBatch = ({
  batchName,
  motionItems,
  resourceItems,
  timestamp = Date.now(),
}) => {
  batchSequence += 1;
  const batchId = `arrangement-${Math.max(0, Math.round(timestamp))}-${batchSequence}`;
  const safeName =
    typeof batchName === "string" && batchName.trim()
      ? batchName.trim()
      : "自动编排";
  const attach = (item) => {
    const {
      sourceExpressionId: rawExpressionId,
      sourceIntentId: rawIntentId,
      ...rest
    } = item;
    const sourceExpressionId = stableId(rawExpressionId);
    const sourceIntentId = stableId(rawIntentId);
    return {
      ...rest,
      arrangementBatchId: batchId,
      arrangementBatchName: safeName,
      ...(sourceExpressionId ? { sourceExpressionId } : {}),
      ...(sourceIntentId ? { sourceIntentId } : {}),
    };
  };
  return {
    batchId,
    batchName: safeName,
    motionItems: motionItems.map(attach),
    resourceItems: resourceItems.map(attach),
  };
};

const itemLabel = (item) => {
  if (typeof item.props?.title === "string" && item.props.title.trim()) {
    return item.props.title.trim();
  }
  if (typeof item.name === "string" && item.name.trim()) {
    const parts = item.name.split(" · ").map((part) => part.trim()).filter(Boolean);
    return parts.at(-1) ?? item.name.trim();
  }
  return "语义表达";
};

export const summarizeArrangementBatch = ({
  batchId,
  motionItems,
  resourceItems,
}) => {
  const motions = motionItems.filter(
    (item) => item.arrangementBatchId === batchId,
  );
  const resources = resourceItems.filter(
    (item) => item.arrangementBatchId === batchId,
  );
  if (motions.length + resources.length === 0) return null;
  const allItems = [
    ...motions.map((item) => ({ ...item, itemKind: "motion" })),
    ...resources.map((item) => ({ ...item, itemKind: "resource" })),
  ];
  const intentMap = new Map();
  for (const item of allItems) {
    const intentId = stableId(item.sourceIntentId);
    if (!intentId) continue;
    const existing = intentMap.get(intentId) ?? {
      id: intentId,
      label: itemLabel(item),
      startFrame: item.startFrame,
      motionIds: [],
      resourceIds: [],
    };
    existing.startFrame = Math.min(existing.startFrame, item.startFrame);
    if (item.itemKind === "motion") existing.motionIds.push(item.id);
    else existing.resourceIds.push(item.id);
    intentMap.set(intentId, existing);
  }
  return {
    id: batchId,
    name:
      allItems.find((item) => item.arrangementBatchName)?.arrangementBatchName ??
      "自动编排",
    motionIds: motions.map((item) => item.id),
    resourceIds: resources.map((item) => item.id),
    startFrame: Math.min(...allItems.map((item) => item.startFrame)),
    intents: [...intentMap.values()].sort(
      (left, right) => left.startFrame - right.startFrame,
    ),
  };
};

export const removeArrangementBatch = ({
  batchId,
  motionItems,
  resourceItems,
}) => ({
  motionItems: motionItems.filter(
    (item) => item.arrangementBatchId !== batchId,
  ),
  resourceItems: resourceItems.filter(
    (item) => item.arrangementBatchId !== batchId,
  ),
});
