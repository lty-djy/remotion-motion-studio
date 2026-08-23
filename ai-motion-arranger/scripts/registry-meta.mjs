// registry-meta.mjs
// 当前工作台 registry 中真正存在、可被编排器引用的卡片元数据。
// 这是 ai-motion-arranger 的事实数据来源：generate-card-catalog.mjs 和
// manifest-to-tsx.mjs 都从这里读。
//
// 维护说明：
//   - 新增/修改卡片：
//     1) effects/*.tsx 或 legacy-effects.tsx 改导出与 propsSchema；
//     2) 在下面 REGISTERED_CARDS 数组里同步加/改一条（保持技术字段一致）；
//     3) 在 arranger-overlay.json 给该 id 补一条语义注释；
//     4) 重跑 node scripts/generate-card-catalog.mjs。

export const REGISTERED_CARDS = [
  {
    id: "ChapterBar",
    category: "navigation",
    catalogGroup: "导航与进度",
    placement: "top",
    glyph: "CH",
    durationInFrames: 18000,
    bounds: { x: 0, y: 0, width: 1080, height: 64 },
    defaultPosition: { x: 0, y: 0, scale: 1 },
    defaultProps: {
      enabled: true,
      chapters: "开场|抽盲盒|编辑台|怎么用|四大好处|收尾",
      animationSeconds: 4.5,
      accentColor: "neutral",
      secondaryColor: "support-neutral",
    },
    propsSchema: {
      enabled: { type: "boolean", label: "显示章节进度条", default: true },
      chapters: {
        type: "text",
        label: "章节列表(用|分隔，可自由增删)",
        default: "开场|抽盲盒|编辑台|怎么用|四大好处|收尾",
      },
      animationSeconds: {
        type: "number",
        label: "推进时长(秒)",
        default: 4.5,
        min: 0.5,
        max: 600,
        step: 0.5,
      },
      accentColor: { type: "color", label: "前景颜色", default: "neutral" },
      secondaryColor: { type: "color", label: "轨道颜色", default: "support-neutral" },
    },
  },
];

// 所有 legacy-effects 里注册为 metric 类的卡片共享同一份 spec。
const LEGACY_METRIC_BASE = {
  category: "metric",
  catalogGroup: "数字与指标",
  placement: "left",
  durationInFrames: 120,
  bounds: { x: 0, y: 0, width: 700, height: 340 },
  defaultPosition: { x: 70, y: 380, scale: 1 },
  defaultProps: {
    title: "数字指标",
    subtitle: "LIVE METRIC",
    value: "87",
    item1: "速度 84",
    item2: "质量 72",
    item3: "稳定性 91",
    accentColor: "neutral",
    secondaryColor: "support-neutral",
    animationSeconds: 1.2,
  },
  propsSchema: {
    title: { type: "text", label: "主标题" },
    subtitle: { type: "text", label: "副标题" },
    value: { type: "text", label: "核心数值" },
    item1: { type: "text", label: "内容一" },
    item2: { type: "text", label: "内容二" },
    item3: { type: "text", label: "内容三" },
    animationSeconds: {
      type: "number",
      label: "动画时长(秒)",
      min: 0.2,
      max: 8,
      step: 0.1,
    },
    accentColor: { type: "color", label: "强调色" },
    secondaryColor: { type: "color", label: "辅助色" },
  },
};

const LEGACY_METRIC_IDS = [
  "SpeedGauge",
  "CounterTicker",
  "StatGrid",
  "ProgressRing",
  "DeltaBadge",
  "Countdown",
  "MetricBar",
  "SegmentedMeter",
  "DualMetricBar",
  "FlipCounter",
  "WaveformMetric",
  "LiquidGauge",
  "RadialTicks",
  "PulseMetric",
];

const LEGACY_GLYPHS = {
  SpeedGauge: "120",
  CounterTicker: "9K",
  StatGrid: "2×2",
  ProgressRing: "◔",
  DeltaBadge: "+24%",
  Countdown: "03",
  MetricBar: "BAR+",
  SegmentedMeter: "▮▮▮",
  DualMetricBar: "⇆",
  FlipCounter: "8:8",
  WaveformMetric: "∿",
  LiquidGauge: "≈",
  RadialTicks: "◎",
  PulseMetric: "⌁",
};

for (const id of LEGACY_METRIC_IDS) {
  REGISTERED_CARDS.push({
    id,
    ...LEGACY_METRIC_BASE,
    glyph: LEGACY_GLYPHS[id],
  });
}
