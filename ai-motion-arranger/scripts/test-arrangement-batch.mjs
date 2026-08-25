#!/usr/bin/env node

import {
  createArrangementBatch,
  removeArrangementBatch,
  summarizeArrangementBatch,
} from "../arrangement-batch.mjs";

const originalMotion = { id: "old-motion", startFrame: 0 };
const originalResource = { id: "old-resource", startFrame: 0 };
const batch = createArrangementBatch({
  batchName: "sample-srt.timeline.json",
  timestamp: 1000,
  motionItems: [
    {
      id: "motion-a",
      startFrame: 30,
      sourceExpressionId: "effect-001-performance",
      sourceIntentId: "intent-001-performance",
      props: { title: "性能与速度" },
    },
    {
      id: "motion-b",
      startFrame: 90,
      sourceExpressionId: "effect-002-process",
      sourceIntentId: "intent-002-process",
      props: { title: "流程与步骤" },
    },
  ],
  resourceItems: [
    {
      id: "resource-a",
      startFrame: 33,
      sourceExpressionId: "icon-001-performance",
      sourceIntentId: "intent-001-performance",
      name: "速度仪表 · 性能与速度",
    },
    {
      id: "resource-b",
      startFrame: 90,
      sourceExpressionId: "sfx-002-process",
      sourceIntentId: "intent-002-process",
      name: "轻点按 · 流程与步骤",
    },
  ],
});

if (!batch.batchId.startsWith("arrangement-1000-")) {
  throw new Error("编排批次 ID 未按稳定前缀生成");
}
if (
  batch.motionItems.some((item) => item.arrangementBatchId !== batch.batchId) ||
  batch.resourceItems.some((item) => item.arrangementBatchId !== batch.batchId)
) {
  throw new Error("动效与资源没有写入同一批次 ID");
}

const summary = summarizeArrangementBatch({
  batchId: batch.batchId,
  motionItems: [originalMotion, ...batch.motionItems],
  resourceItems: [originalResource, ...batch.resourceItems],
});
if (
  summary.motionIds.length !== 2 ||
  summary.resourceIds.length !== 2 ||
  summary.intents.length !== 2 ||
  summary.intents[0].motionIds.length !== 1 ||
  summary.intents[0].resourceIds.length !== 1
) {
  throw new Error("批次摘要没有保留语义组与跨轨道关联");
}

const removed = removeArrangementBatch({
  batchId: batch.batchId,
  motionItems: [originalMotion, ...batch.motionItems],
  resourceItems: [originalResource, ...batch.resourceItems],
});
if (
  removed.motionItems.length !== 1 ||
  removed.motionItems[0].id !== originalMotion.id ||
  removed.resourceItems.length !== 1 ||
  removed.resourceItems[0].id !== originalResource.id
) {
  throw new Error("整批撤销影响了插入前的原时间线");
}

process.stdout.write(
  `✓ 编排批次闭环通过：intents=${summary.intents.length} motion=${summary.motionIds.length} resources=${summary.resourceIds.length}\n`,
);
