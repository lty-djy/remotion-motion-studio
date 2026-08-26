#!/usr/bin/env node

import {
  mergeSrtEntriesForSemanticAnalysis,
  summarizeSrtSemanticMerge,
} from "../srt-semantic-merger.mjs";

const texts = [
  "未来3年",
  "卫浴店只有这种",
  "门店能够赚钱",
  "单纯卖货的门店只会",
  "慢慢的被市场淘汰",
  "线上引流线下成交",
  "才是实体店最终的出路",
  "短视频做品牌种草",
  "直播做精准转化",
  "客流稳定",
  "客单更高",
  "轻松突破业绩瓶颈",
  "紧跟趋势",
  "轻松实现年入百万",
];
const ranges = [
  [133, 966],
  [966, 2083],
  [2083, 3166],
  [3200, 4766],
  [4766, 6200],
  [6400, 7883],
  [7883, 9933],
  [9966, 11483],
  [11483, 13000],
  [13000, 13883],
  [13883, 14966],
  [15083, 16733],
  [16883, 17566],
  [17683, 19400],
];
const sourceEntries = texts.map((text, index) => ({
  index: index + 1,
  startMs: ranges[index][0],
  endMs: ranges[index][1],
  text,
}));

const first = mergeSrtEntriesForSemanticAnalysis(sourceEntries);
const second = mergeSrtEntriesForSemanticAnalysis(sourceEntries);
if (JSON.stringify(first) !== JSON.stringify(second)) {
  throw new Error("相同 SRT 没有生成确定性的语义分段");
}
const expectedGroups = [
  [1, 2, 3],
  [4, 5],
  [6, 7],
  [8, 9],
  [10, 11, 12],
  [13, 14],
];
if (
  JSON.stringify(first.map((entry) => entry.sourceCueIndices)) !==
  JSON.stringify(expectedGroups)
) {
  throw new Error(
    `真实口播没有合并成预期 6 段：${JSON.stringify(first.map((entry) => entry.sourceCueIndices))}`,
  );
}
if (
  first[0].startMs !== 133 ||
  first[0].endMs !== 3166 ||
  !first[0].text.includes("门店能够赚钱")
) {
  throw new Error("合并后的语义段没有保留首尾时间和完整文本");
}
const summary = summarizeSrtSemanticMerge(sourceEntries, first);
if (
  summary.sourceCueCount !== 14 ||
  summary.semanticSegmentCount !== 6 ||
  summary.mergedCueCount !== 8
) {
  throw new Error("语义合并摘要统计不正确");
}

const punctuationBoundary = mergeSrtEntriesForSemanticAnalysis([
  { index: 1, startMs: 0, endMs: 900, text: "这是完整结论。" },
  { index: 2, startMs: 950, endMs: 1800, text: "这是下一句话" },
]);
if (punctuationBoundary.length !== 2) {
  throw new Error("完整句号后的字幕不应被继续合并");
}
const gapBoundary = mergeSrtEntriesForSemanticAnalysis([
  { index: 1, startMs: 0, endMs: 500, text: "只有这种" },
  { index: 2, startMs: 1000, endMs: 1600, text: "门店能够赚钱" },
]);
if (gapBoundary.length !== 2) {
  throw new Error("时间间隔过大的字幕不应被合并");
}

console.log(
  `✓ SRT 语义合并通过：source=${summary.sourceCueCount} segments=${summary.semanticSegmentCount} merged=${summary.mergedCueCount}`,
);
