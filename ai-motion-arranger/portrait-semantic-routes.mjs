export const PORTRAIT_ROUTE_TABLE_VERSION = "1.1";

export const PORTRAIT_ROUTING_POLICY = Object.freeze({
  orientation: "portrait",
  maxIntentsPerCue: 3,
  supportsMultipleIntentsPerCue: true,
  supportsMultipleComponentsPerIntent: true,
  baseCaptionTrack: "forbidden",
  bgm: "forbidden",
  resources: {
    icons: "optional",
    materials: "optional",
    sfx: "optional",
  },
  captionSafeZone: {
    startRatio: 0.8,
    sideInsetRatio: 0.06,
    bottomInsetRatio: 0.06,
  },
  layout: {
    avoid: ["face", "captions", "ui-safe-area"],
    collisionPolicy: "relocate-then-scale",
  },
  applyPolicy: {
    previewBeforeApply: true,
    requireUserConfirmation: true,
    existingTimeline: "preserve",
  },
});

export const PORTRAIT_SEMANTIC_ROUTES = Object.freeze([
  {
    id: "chapter-transition",
    intentType: "transition",
    label: "章节转换",
    priority: 70,
    match: {
      anyKeywords: ["接下来", "下一步", "下面", "进入", "首先来看", "第二部分", "最后一部分"],
      patternSources: [
        "(?:接下来|下一步|进入).{0,8}(?:部分|环节|阶段|内容)",
        "^(?:未来|今后|接下来)(?:\\d+|一|二|三|四|五|十|几)年",
      ],
      minimumScore: 1,
    },
    resources: { iconId: "arrow", sfxId: "whoosh-soft", iconAnchor: "left-top" },
    components: [
      {
        componentId: "PortraitChapterRail",
        role: "primary",
        activation: "always",
        propBindings: {
          title: "segment.topic",
          subtitle: "segment.detail",
          accentColor: "style.accentColor",
          textColor: "style.textColor",
          animationSeconds: "timing.animationSeconds",
        },
        layout: {
          anchor: "center-top",
          fallbackAnchors: ["left-top", "right-top"],
          size: "medium",
          preferredScale: 1,
        },
      },
    ],
  },
  {
    id: "keyword-emphasis",
    intentType: "emphasis",
    label: "重点词强化",
    priority: 60,
    match: {
      anyKeywords: ["重点", "核心", "关键", "记住", "最重要", "本质", "就是"],
      patternSources: [
        "(?:重点|核心|关键)(?:是|在于|就是)?",
        "只有.{1,24}才(?:能|会|是|可以)?",
        "只有.{1,24}(?:能|会|可以|值得|适合)",
        "才是.{0,18}(?:出路|关键|核心|答案|选择|方向)",
      ],
      minimumScore: 2,
    },
    resources: { iconId: "arrow", sfxId: "impact", iconAnchor: "right-top" },
    components: [
      {
        componentId: "PortraitKeywordBurst",
        role: "primary",
        activation: "when-keywords-present",
        propBindings: {
          word1: "intent.keywords.1",
          word2: "intent.keywords.2",
          word3: "intent.keywords.3",
          highlightIndex: "intent.highlightIndex",
          accentColor: "style.accentColor",
          textColor: "style.textColor",
          shadowColor: "style.shadowColor",
          animationSeconds: "timing.animationSeconds",
        },
        layout: {
          anchor: "center-top",
          fallbackAnchors: ["left-top", "right-top"],
          size: "large",
          preferredScale: 0.72,
        },
      },
    ],
  },
  {
    id: "info-callout",
    intentType: "instruction",
    label: "补充说明",
    priority: 40,
    match: {
      anyKeywords: ["例如", "比如", "这里", "可以使用", "推荐使用", "工具", "软件", "方法"],
      patternSources: ["(?:例如|比如|推荐使用|可以使用).{1,18}"],
      minimumScore: 1,
    },
    resources: { iconId: "code", sfxId: "whoosh-soft", iconAnchor: "right-top" },
    components: [
      {
        componentId: "PortraitInfoCallout",
        role: "primary",
        activation: "always",
        propBindings: {
          eyebrow: "segment.label",
          title: "segment.topic",
          detail: "segment.detail",
          note: "segment.note",
          iconText: "resource.iconText",
          accentColor: "style.accentColor",
          panelColor: "style.panelColor",
          textColor: "style.textColor",
          animationSeconds: "timing.animationSeconds",
        },
        layout: {
          anchor: "right-top",
          fallbackAnchors: ["left-top", "right-center", "left-center"],
          size: "medium",
          preferredScale: 0.72,
        },
      },
    ],
  },
  {
    id: "metric-decision",
    intentType: "comparison",
    label: "数字决策",
    priority: 90,
    match: {
      anyKeywords: ["更推荐", "优点", "缺点", "更快", "更低", "更高", "相比", "选择", "方案"],
      patternSources: [
        "\\d+(?:[.,]\\d+)?\\s*(?:%|％|万|亿|倍|k|K|元|年|秒)?",
        "(?:相比|对比|选择|推荐).{0,18}",
      ],
      boosts: [
        {
          label: "中文数量级",
          patternSource: "(?:十万|百万|千万|上亿|过亿|破亿)",
          weight: 3,
        },
        {
          label: "收益结果",
          patternSource:
            "(?=.*(?:稳定|更高|更低|提升|增长|突破|实现|达成))(?=.*(?:客流|客单|利润|业绩|成本|效率|销量|收入|百万|千万))",
          weight: 3,
        },
      ],
      suppressors: [
        {
          label: "仅为未来时间范围",
          patternSource: "^(?:未来|今后)(?:\\d+|一|二|三|四|五|十|几)年",
          weight: 4,
        },
      ],
      minimumScore: 2,
    },
    resources: { iconId: "speed", sfxId: "tick", iconAnchor: "right-top" },
    components: [
      {
        componentId: "PortraitMetricDecision",
        role: "primary",
        activation: "when-metric-present",
        propBindings: {
          lead: "segment.label",
          conclusion: "intent.conclusion",
          metricLabel: "intent.metric.label",
          value: "intent.metric.value",
          unit: "intent.metric.unit",
          verdict: "intent.metric.verdict",
          accentColor: "style.accentColor",
          panelColor: "style.panelColor",
          textColor: "style.textColor",
          animationSeconds: "timing.animationSeconds",
        },
        layout: {
          anchor: "left-top",
          fallbackAnchors: ["right-top", "left-center"],
          size: "large",
          preferredScale: 0.64,
        },
      },
      {
        componentId: "PortraitDecisionTagStack",
        role: "supporting",
        activation: "when-supporting-labels-present",
        propBindings: {
          tag1: "intent.labels.1",
          tag2: "intent.labels.2",
          tag3: "intent.labels.3",
          symbol1: "intent.symbols.1",
          symbol2: "intent.symbols.2",
          symbol3: "intent.symbols.3",
          accentColor: "style.accentColor",
          panelColor: "style.panelColor",
          textColor: "style.textColor",
          animationSeconds: "timing.animationSeconds",
        },
        layout: {
          anchor: "right-center",
          fallbackAnchors: ["right-top", "left-center"],
          size: "medium",
          preferredScale: 0.82,
        },
      },
    ],
  },
  {
    id: "process-steps",
    intentType: "process",
    label: "操作流程",
    priority: 80,
    match: {
      anyKeywords: ["首先", "然后", "接着", "最后", "第一步", "第二步", "第三步", "流程", "步骤"],
      patternSources: [
        "(?:首先|第一步).{0,24}(?:然后|第二步|接着|最后)",
        "[^，,。]{1,14}做[^，,。]{1,14}[，,][^，,。]{1,14}做[^，,。]{1,14}",
      ],
      minimumScore: 2,
    },
    resources: { iconId: "timeline", sfxId: "tick", iconAnchor: "left-top" },
    components: [
      {
        componentId: "PortraitStepChecklist",
        role: "primary",
        activation: "when-two-or-more-steps-present",
        propBindings: {
          eyebrow: "segment.label",
          title: "segment.topic",
          subtitle: "segment.detail",
          step1: "intent.steps.1",
          step2: "intent.steps.2",
          step3: "intent.steps.3",
          icon1: "intent.symbols.1",
          icon2: "intent.symbols.2",
          icon3: "intent.symbols.3",
          accentColor: "style.accentColor",
          successColor: "style.successColor",
          panelColor: "style.panelColor",
          textColor: "style.textColor",
          animationSeconds: "timing.animationSeconds",
        },
        layout: {
          anchor: "right-top",
          fallbackAnchors: ["left-top", "right-center", "left-center"],
          size: "large",
          preferredScale: 0.62,
        },
      },
    ],
  },
  {
    id: "risk-boundary",
    intentType: "warning",
    label: "风险与限制",
    priority: 100,
    match: {
      anyKeywords: ["注意", "但是", "不过", "风险", "不能", "不等于", "避免", "限制", "边界", "错误", "失真", "异常", "淘汰", "亏损", "下滑"],
      patternSources: [
        "(?:但是|不过|注意).{0,28}(?:不能|风险|错误|失真|异常|限制)",
        "(?:只会|将会|可能会|容易|导致).{0,24}(?:淘汰|亏损|下滑|失败|流失|下降)",
      ],
      suppressors: [
        {
          label: "已解决负面结果",
          patternSource: "(?:突破|解决|摆脱|避免).{0,10}(?:瓶颈|风险|问题|亏损|下滑)",
          weight: 4,
        },
      ],
      minimumScore: 2,
    },
    resources: { iconId: "arrow", sfxId: "impact", iconAnchor: "right-top" },
    components: [
      {
        componentId: "PortraitRiskWarning",
        role: "primary",
        activation: "always",
        propBindings: {
          eyebrow: "segment.label",
          title: "segment.topic",
          emphasis: "intent.conclusion",
          risk1: "intent.risks.1",
          risk2: "intent.risks.2",
          risk3: "intent.risks.3",
          icon1: "intent.symbols.1",
          icon2: "intent.symbols.2",
          icon3: "intent.symbols.3",
          accentColor: "style.warningColor",
          panelColor: "style.panelColor",
          textColor: "style.textColor",
          animationSeconds: "timing.animationSeconds",
        },
        layout: {
          anchor: "left-top",
          fallbackAnchors: ["right-top", "left-center", "right-center"],
          size: "large",
          preferredScale: 0.64,
        },
      },
    ],
  },
  {
    id: "next-episode-cta",
    intentType: "call-to-action",
    label: "下集预告与关注",
    priority: 110,
    match: {
      anyKeywords: ["下期", "下一期", "下次", "关注", "点赞", "收藏", "评论", "记得关注"],
      patternSources: ["(?:下期|下一期|下次).{0,24}", "(?:点个|记得|欢迎)?关注"],
      minimumScore: 1,
    },
    resources: { iconId: "arrow", sfxId: "whoosh-soft", iconAnchor: "left-top" },
    components: [
      {
        componentId: "PortraitNextEpisodeCta",
        role: "primary",
        activation: "always",
        propBindings: {
          eyebrow: "segment.label",
          title: "segment.topic",
          subtitle: "segment.detail",
          cta: "intent.cta",
          icon: "resource.iconText",
          accentColor: "style.accentColor",
          secondaryColor: "style.secondaryColor",
          panelColor: "style.panelColor",
          textColor: "style.textColor",
          animationSeconds: "timing.animationSeconds",
        },
        layout: {
          anchor: "right-top",
          fallbackAnchors: ["left-top", "right-center"],
          size: "medium",
          preferredScale: 0.78,
        },
      },
    ],
  },
]);

export const PORTRAIT_ROUTE_COMPONENT_IDS = Object.freeze([
  ...new Set(
    PORTRAIT_SEMANTIC_ROUTES.flatMap((route) =>
      route.components.map((component) => component.componentId),
    ),
  ),
]);
