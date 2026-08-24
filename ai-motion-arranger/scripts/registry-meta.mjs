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
  {
    id: "TerminalPanel", category: "hud", catalogGroup: "终端教学 HUD", placement: "left", glyph: "CMD", durationInFrames: 210,
    bounds: { x: 0, y: 0, width: 560, height: 620 }, defaultPosition: { x: 58, y: 540, scale: 1 },
    defaultProps: { enabled: true, title: "建立可复用设计令牌", subtitle: "01 / TOKEN LAYER", command: "npm run compose -- --theme terminal-hud", item1: "定义颜色、间距、描边", item2: "把动效节奏写成规则", item3: "组件只消费令牌，不写死风格", accentColor: "cyan", animationSeconds: 1.2 },
    propsSchema: { enabled: { type: "boolean", label: "显示面板", default: true }, title: { type: "text", label: "主标题" }, subtitle: { type: "text", label: "终端标签" }, command: { type: "text", label: "命令行" }, item1: { type: "text", label: "步骤一" }, item2: { type: "text", label: "步骤二" }, item3: { type: "text", label: "步骤三" }, accentColor: { type: "color", label: "强调色", default: "cyan" }, animationSeconds: { type: "number", label: "动画时长(秒)", default: 1.2, min: 0.2, max: 8, step: 0.1 } },
  },
  {
    id: "TerminalStepHero", category: "hud", catalogGroup: "终端教学 HUD", placement: "right", glyph: "01", durationInFrames: 180,
    bounds: { x: 0, y: 0, width: 410, height: 430 }, defaultPosition: { x: 620, y: 640, scale: 1 },
    defaultProps: { enabled: true, step: "01", title: "先定义规则", subtitle: "让每一张卡片看起来属于同一套系统", accentColor: "violet", secondaryColor: "cyan", animationSeconds: 1.2 },
    propsSchema: { enabled: { type: "boolean", label: "显示主视觉", default: true }, step: { type: "text", label: "步骤编号" }, title: { type: "text", label: "结论标题" }, subtitle: { type: "text", label: "解释文字" }, accentColor: { type: "color", label: "主强调色", default: "violet" }, secondaryColor: { type: "color", label: "进度强调色", default: "cyan" }, animationSeconds: { type: "number", label: "动画时长(秒)", default: 1.2, min: 0.2, max: 8, step: 0.1 } },
  },
  {
    id: "SoftTeachingStepRail", category: "teaching", catalogGroup: "柔和教学紫", placement: "top", glyph: "STEP", durationInFrames: 210,
    bounds: { x: 0, y: 0, width: 1050, height: 250 }, defaultPosition: { x: 85, y: 92, scale: 1 },
    defaultProps: { enabled: true, item1: "如何复刻编辑台", item2: "手把手教你搭建", item3: "沉淀自己的动效", accentColor: "violet", animationSeconds: 1.2 },
    propsSchema: { enabled: { type: "boolean", label: "显示流程条", default: true }, item1: { type: "text", label: "步骤一" }, item2: { type: "text", label: "步骤二" }, item3: { type: "text", label: "步骤三" }, accentColor: { type: "color", label: "强调色", default: "violet" }, animationSeconds: { type: "number", label: "动画时长(秒)", default: 1.2, min: 0.2, max: 8, step: 0.1 } },
  },
  {
    id: "SoftTeachingGlassPanel", category: "teaching", catalogGroup: "柔和教学紫", placement: "left", glyph: "GLASS", durationInFrames: 210,
    bounds: { x: 0, y: 0, width: 650, height: 450 }, defaultPosition: { x: 90, y: 420, scale: 1 },
    defaultProps: { enabled: true, title: "你自己的动效库", subtitle: "YOUR LIBRARY", item1: "统一设计令牌", item2: "可复用效果组件", item3: "AI 语义编排", accentColor: "violet", animationSeconds: 1.2 },
    propsSchema: { enabled: { type: "boolean", label: "显示面板", default: true }, title: { type: "text", label: "主标题" }, subtitle: { type: "text", label: "英文标签" }, item1: { type: "text", label: "内容一" }, item2: { type: "text", label: "内容二" }, item3: { type: "text", label: "内容三" }, accentColor: { type: "color", label: "强调色", default: "violet" }, animationSeconds: { type: "number", label: "动画时长(秒)", default: 1.2, min: 0.2, max: 8, step: 0.1 } },
  },
  {
    id: "SoftTeachingLibraryGrid", category: "teaching", catalogGroup: "柔和教学紫", placement: "left", glyph: "GRID", durationInFrames: 210,
    bounds: { x: 0, y: 0, width: 680, height: 315 }, defaultPosition: { x: 90, y: 930, scale: 1 },
    defaultProps: { enabled: true, title: "你自己的动效库", subtitle: "YOUR LIBRARY", columns: 6, highlightIndex: 7, accentColor: "violet", animationSeconds: 1.2 },
    propsSchema: { enabled: { type: "boolean", label: "显示卡槽", default: true }, title: { type: "text", label: "主标题" }, subtitle: { type: "text", label: "英文标签" }, columns: { type: "number", label: "每行卡槽数", default: 6, min: 3, max: 8, step: 1 }, highlightIndex: { type: "number", label: "高亮第几格", default: 7, min: 1, max: 12, step: 1 }, accentColor: { type: "color", label: "高亮色", default: "violet" }, animationSeconds: { type: "number", label: "动画时长(秒)", default: 1.2, min: 0.2, max: 8, step: 0.1 } },
  },
  {
    id: "SoftTeachingIncrementBadge", category: "teaching", catalogGroup: "柔和教学紫", placement: "left", glyph: "+1", durationInFrames: 120,
    bounds: { x: 0, y: 0, width: 210, height: 108 }, defaultPosition: { x: 640, y: 980, scale: 1 },
    defaultProps: { enabled: true, value: "+1", label: "已添加到动效库", accentColor: "violet", animationSeconds: 1.2 },
    propsSchema: { enabled: { type: "boolean", label: "显示反馈", default: true }, value: { type: "text", label: "反馈数值" }, label: { type: "text", label: "反馈说明" }, accentColor: { type: "color", label: "强调色", default: "violet" }, animationSeconds: { type: "number", label: "动画时长(秒)", default: 1.2, min: 0.2, max: 8, step: 0.1 } },
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
