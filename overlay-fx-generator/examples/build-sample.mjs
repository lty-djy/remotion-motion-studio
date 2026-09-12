// 一次性生成 examples/sample-arrangement.timeline.json（保证 cuesJson 转义正确）。
// 生成后可删除本脚本，也可以在调整样例时重新运行。
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";

const root = resolve(import.meta.dirname, "..", "..");
const fps = 30;
const durationSec = 58;
const durationFrames = durationSec * fps;

const cues = [
  [1, 0.0, 3.2, "你手机里是不是也装了二十个效率工具", "number", "二十个"],
  [2, 3.2, 5.4, "但真正每天打开的，不到三个", "number", "三个"],
  [3, 5.4, 9.8, "今天把工具用不下去的根因一次讲清", "chapter-transition", "根因"],
  [4, 9.8, 13.4, "第一个根因：目标不清，工具替你定目标", "risk-boundary", "目标不清"],
  [5, 13.4, 16.6, "第二个根因：流程错位，工具先于场景", "risk-boundary", "流程错位"],
  [6, 16.6, 19.8, "第三个根因：反馈缺失，用了没记录", "risk-boundary", "反馈缺失"],
  [7, 19.8, 22.4, "收藏不等于学会，装了不等于在用", "comparison", "收藏"],
  [8, 22.4, 24.8, "打卡不等于产出，列清单不等于执行", "comparison", "打卡"],
  [9, 24.8, 27.6, "三个信号，说明你在用伪工作流", "emphasis", "伪工作流"],
  [10, 27.6, 33.0, "记住：差距不在工具，在使用系统", "emphasis", "差距不在工具"],
  [11, 33.0, 36.8, "第二部分，四步搭建你自己的系统", "chapter-transition", "四步"],
  [12, 36.8, 39.3, "第一步，选定唯一场景", "process-steps", "唯一场景"],
  [13, 39.3, 41.8, "第二步，定最小流程", "process-steps", "最小流程"],
  [14, 41.8, 44.3, "第三步，固定使用时间", "process-steps", "固定时间"],
  [15, 44.3, 46.8, "第四步，每周复盘一次", "process-steps", "复盘"],
  [16, 46.8, 52.0, "提示：先原样跑一周，再谈优化", "info-callout", "跑一周"],
  [17, 52.0, 58.0, "下期演示这套系统怎么搭，点个关注", "next-episode-cta", "关注"],
].map(([index, start, end, text, semanticKey, keyword]) => ({
  index,
  start,
  end,
  text,
  semanticKey,
  keyword,
}));

const item = (componentId, startSec, endSec, props, intentId, extra = {}) => ({
  componentId,
  startFrame: Math.round(startSec * fps),
  durationInFrames: Math.round((endSec - startSec) * fps),
  laneId: extra.laneId ?? "semantic",
  trackOrder: extra.trackOrder,
  props: { enabled: true, ...props },
  sourceExpressionId: extra.expressionId ?? intentId,
  sourceIntentId: intentId,
});

const doc = {
  generatedBy: "overlay-fx-generator/1",
  sourceSrt: "sample-srt.srt",
  canvas: { width: 1080, height: 1920, orientation: "portrait" },
  fps,
  durationInFrames: durationFrames,
  motionTimeline: [
    {
      componentId: "ChapterBar",
      startFrame: 0,
      durationInFrames: durationFrames,
      laneId: "resident",
      props: {
        chapters: "工具的假象 0 | 三个根因 9.8 | 四步搭建 33 | 收尾 52",
        showProgress: true,
      },
      sourceExpressionId: "expr-chapter-bar",
      sourceIntentId: "intent-chapter-bar",
    },
    {
      componentId: "SrtSemanticCaptions",
      startFrame: 0,
      durationInFrames: durationFrames,
      laneId: "caption",
      backgroundOpacity: 0,
      props: {
        enabled: true,
        showIcon: false,
        cuesJson: JSON.stringify(cues),
        timeOffset: 0,
      },
      sourceExpressionId: "srt-caption-track",
      sourceIntentId: "srt-caption-track",
    },
    item("PortraitMetricDecision", 0.5, 5.4, {
      lead: "现状",
      conclusion: "装了 20 个，常用的不到 3 个",
      metricLabel: "每天真在用的工具",
      value: "3",
      unit: "个",
      verdict: "注意力被切碎",
      animationSeconds: 0.9,
    }, "intent-hook-metric", { laneId: "hook" }),
    item("PortraitIndexedChapterTitle", 5.4, 9.8, {
      chapterNumber: "01",
      eyebrow: "WHY TOOLS FAIL",
      title: "工具用不下去的根因",
      subtitle: "三个根因，一次讲清",
    }, "intent-chapter-root"),
    item("PortraitRiskWarning", 9.8, 19.8, {
      riskCount: 3,
      eyebrow: "根因诊断",
      title: "工具救不了你",
      emphasis: "问题不在工具",
      risk1: "目标不清",
      risk2: "流程错位",
      risk3: "反馈缺失",
      riskIntervalSeconds: 3.3,
      animationSeconds: 0.95,
    }, "intent-risk-roots"),
    item("PortraitDecisionTagStack", 19.8, 27.6, {
      tagCount: 3,
      tag1: "收藏≠学会",
      tag2: "打卡≠产出",
      tag3: "清单≠执行",
      tagEnterIntervalSeconds: 2.4,
      animationSeconds: 0.9,
    }, "intent-fake-signals"),
    item("PortraitGapHeadline", 27.6, 33.0, {
      showBadge: true,
      badgeText: "记住这句话",
      titlePrefix: "缺的是",
      titleEmphasis: "系统",
    }, "intent-gap-line"),
    item("PortraitChapterRail", 33.0, 36.8, {
      index: "02",
      title: "四步搭建",
      subtitle: "先跑通，再优化",
    }, "intent-chapter-build"),
    item("PortraitStepChecklist", 36.8, 46.8, {
      eyebrow: "搭建方法",
      title: "最小可用系统",
      subtitle: "四步跑通",
      stepCount: 4,
      step1: "选定唯一场景",
      step2: "定最小流程",
      step3: "固定使用时间",
      step4: "每周复盘",
      stepEnterIntervalSeconds: 2.5,
      animationSeconds: 1,
    }, "intent-build-steps"),
    item("PortraitInfoCallout", 46.8, 52.0, {
      eyebrow: "避坑提示",
      title: "先原样跑一周",
      detail: "再谈优化",
      note: "改流程之前先攒记录",
      iconText: "!",
    }, "intent-callout-week"),
    item("PortraitNextEpisodeTitle", 52.0, 58.0, {
      eyebrow: "下期",
      title: "系统搭建实况",
      subtitle: "从零到跑通",
    }, "intent-cta-next", { laneId: "cta" }),
    item("PortraitFollowCta", 52.0, 58.0, {
      cta: "关注不迷路",
      icon: "▶",
    }, "intent-cta-next", { laneId: "cta" }),
  ],
  resourceTracks: [
    {
      kind: "sfx",
      resourceId: "whoosh-soft",
      name: "结尾轻扫音",
      laneId: "sfx",
      startFrame: Math.round(52.0 * fps),
      durationInFrames: Math.round(1.5 * fps),
      sourceExpressionId: "intent-cta-next",
      sourceIntentId: "intent-cta-next",
    },
  ],
  semanticAnalysis: {
    cueCount: cues.length,
    cueAnalyses: [
      {
        cueIndex: 1,
        text: "你手机里是不是也装了二十个效率工具",
        sourceCueIndices: [1, 2],
        intents: [
          {
            id: "intent-hook-metric",
            label: "数字展示",
            type: "metric",
            signals: [{ type: "keyword", label: "二十个" }],
            componentCandidates: [
              { componentId: "PortraitMetricDecision", rank: 1, reason: "两个对比数字，用数据决策卡定格", props: {} },
              { componentId: "SegmentedMeter", rank: 2, reason: "备选：分段能量条表达 20→3 的落差", props: {} },
            ],
          },
        ],
      },
      {
        cueIndex: 3,
        text: "今天把工具用不下去的根因一次讲清",
        sourceCueIndices: [3],
        intents: [
          {
            id: "intent-chapter-root",
            label: "章节转场",
            type: "transition",
            signals: [{ type: "keyword", label: "根因" }],
            componentCandidates: [
              { componentId: "PortraitIndexedChapterTitle", rank: 1, reason: "编号章节标题立题", props: {} },
            ],
          },
        ],
      },
      {
        cueIndex: 4,
        text: "第一个根因：目标不清，工具替你定目标",
        sourceCueIndices: [4, 5, 6],
        intents: [
          {
            id: "intent-risk-roots",
            label: "风险提醒",
            type: "warning",
            signals: [{ type: "keyword", label: "根因" }],
            componentCandidates: [
              { componentId: "PortraitRiskWarning", rank: 1, reason: "三个根因逐条落卡，间隔卡点 3.3s", props: {} },
              { componentId: "PortraitPromptMistakeDiagnosis", rank: 2, reason: "备选：错误用法诊断卡", props: {} },
            ],
          },
        ],
      },
      {
        cueIndex: 7,
        text: "收藏不等于学会，装了不等于在用",
        sourceCueIndices: [7, 8, 9],
        intents: [
          {
            id: "intent-fake-signals",
            label: "对比差异",
            type: "comparison",
            signals: [{ type: "keyword", label: "收藏" }],
            componentCandidates: [
              { componentId: "PortraitDecisionTagStack", rank: 1, reason: "三组否定式标签逐条入场", props: {} },
            ],
          },
        ],
      },
      {
        cueIndex: 10,
        text: "记住：差距不在工具，在使用系统",
        sourceCueIndices: [10],
        intents: [
          {
            id: "intent-gap-line",
            label: "重点强调",
            type: "emphasis",
            signals: [{ type: "keyword", label: "差距" }],
            componentCandidates: [
              { componentId: "PortraitGapHeadline", rank: 1, reason: "前缀+强调词的巨字金句", props: {} },
            ],
          },
        ],
      },
      {
        cueIndex: 12,
        text: "第一步，选定唯一场景",
        sourceCueIndices: [12, 13, 14, 15],
        intents: [
          {
            id: "intent-build-steps",
            label: "流程说明",
            type: "process",
            signals: [{ type: "keyword", label: "第一步" }],
            componentCandidates: [
              { componentId: "PortraitStepChecklist", rank: 1, reason: "四步逐条打勾，间隔卡点 2.5s", props: {} },
            ],
          },
        ],
      },
      {
        cueIndex: 16,
        text: "提示：先原样跑一周，再谈优化",
        sourceCueIndices: [16],
        intents: [
          {
            id: "intent-callout-week",
            label: "概念解释",
            type: "explanation",
            signals: [{ type: "keyword", label: "跑一周" }],
            componentCandidates: [
              { componentId: "PortraitInfoCallout", rank: 1, reason: "轻量提示卡", props: {} },
            ],
          },
        ],
      },
      {
        cueIndex: 17,
        text: "下期演示这套系统怎么搭，点个关注",
        sourceCueIndices: [17],
        intents: [
          {
            id: "intent-cta-next",
            label: "行动引导",
            type: "call-to-action",
            signals: [{ type: "keyword", label: "关注" }],
            componentCandidates: [
              { componentId: "PortraitNextEpisodeTitle", rank: 1, reason: "下集预告标题收尾", props: {} },
              { componentId: "PortraitFollowCta", rank: 2, reason: "图标文字收尾", props: {} },
            ],
          },
        ],
      },
    ],
  },
  qualityControl: {
    status: "pending",
    checks: [
      { type: "face-occlusion", status: "pending", affectedExpressionIds: [], message: "需结合实际人物画面确认脸部避让。" },
      { type: "caption-occlusion", status: "pending", affectedExpressionIds: [], message: "底部字幕安全区已预留，需结合实际视频确认。" },
      { type: "asset-availability", status: "passed", affectedExpressionIds: [], message: "组件与音效均来自当前效果库与资源索引。" },
      { type: "voice-masking", status: "passed", affectedExpressionIds: [], message: "音效只有 1.5s 轻扫，不会盖住人声。" },
      { type: "timeline-bounds", status: "passed", affectedExpressionIds: [], message: "所有时间段均在 58 秒范围内。" },
    ],
  },
};

// 资源轨道补上索引里的真实 url/mime
const index = JSON.parse(await readFile(resolve(root, "public", "input", "resource-index.json"), "utf8"));
const sfxEntry = (index.libraries?.sfx ?? []).find((entry) => entry.id === "whoosh-soft");
if (sfxEntry) {
  doc.resourceTracks[0].url = sfxEntry.url ?? sfxEntry.file ?? "";
  doc.resourceTracks[0].mimeType = sfxEntry.mimeType ?? "audio/wav";
}

const outPath = resolve(import.meta.dirname, "sample-arrangement.timeline.json");
await writeFile(outPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
console.log(`已生成 ${outPath}`);
