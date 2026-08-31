export const SEMANTIC_INTENT_DEFINITIONS = [
  { id: "emphasis", label: "重点强调", description: "强化一句话中的核心结论、关键词或重要信息。" },
  { id: "metric", label: "数字展示", description: "呈现数值、比例、金额、进度或量化结果。" },
  { id: "comparison", label: "对比差异", description: "表达两个或多个方案、阶段、指标之间的差异。" },
  { id: "list", label: "列举要点", description: "承载并列观点、标签、条件或清单。" },
  { id: "process", label: "流程说明", description: "表达步骤、路径、阶段或先后关系。" },
  { id: "explanation", label: "概念解释", description: "补充定义、方法、工具、原理或背景说明。" },
  { id: "warning", label: "风险提醒", description: "提示限制、错误、下降、淘汰或需要规避的问题。" },
  { id: "evidence", label: "案例与素材", description: "展示图片、视频、案例、证明或可视化证据。" },
  { id: "transition", label: "章节转场", description: "建立开场、章节切换、阶段推进或收束。" },
  { id: "call-to-action", label: "行动引导", description: "引导关注、收藏、继续观看或采取下一步行动。" },
] as const;

export type SemanticIntentId =
  (typeof SEMANTIC_INTENT_DEFINITIONS)[number]["id"];

export type SemanticContentKind =
  | "short-text"
  | "long-text"
  | "metric"
  | "comparison"
  | "list"
  | "process"
  | "media"
  | "caption"
  | "spatial";

export type EffectSystemRole = "caption-track";

export type EffectSemanticCapabilities = {
  primaryIntent?: SemanticIntentId;
  secondaryIntents: SemanticIntentId[];
  contentKinds: SemanticContentKind[];
  keywords: string[];
  orientation: "any" | "portrait" | "landscape";
  density: "light" | "medium" | "heavy";
  durationSeconds: { min: number; max: number };
  systemRole?: EffectSystemRole;
};

const capability = (
  primaryIntent: SemanticIntentId | undefined,
  secondaryIntents: SemanticIntentId[],
  contentKinds: SemanticContentKind[],
  keywords: string[],
  options: Partial<
    Pick<
      EffectSemanticCapabilities,
      "orientation" | "density" | "durationSeconds" | "systemRole"
    >
  > = {},
): EffectSemanticCapabilities => ({
  primaryIntent,
  secondaryIntents,
  contentKinds,
  keywords,
  orientation: options.orientation ?? "any",
  density: options.density ?? "medium",
  durationSeconds: options.durationSeconds ?? { min: 1.5, max: 6 },
  ...(options.systemRole ? { systemRole: options.systemRole } : {}),
});

export const EFFECT_SEMANTIC_CAPABILITIES: Readonly<
  Record<string, EffectSemanticCapabilities>
> = Object.freeze({
  GlobalExpedition: capability(
    "evidence",
    ["process", "transition", "explanation"],
    ["spatial", "process", "short-text"],
    ["地图", "路线", "地点", "全球", "跨区域", "行程"],
    { density: "heavy", durationSeconds: { min: 6, max: 60 } },
  ),
  SrtSemanticCaptions: capability(
    undefined,
    ["emphasis"],
    ["caption", "long-text"],
    ["字幕", "逐字", "关键词高亮", "语义字幕"],
    { orientation: "portrait", density: "light", systemRole: "caption-track", durationSeconds: { min: 0.5, max: 20 } },
  ),
  SrtCueText: capability(
    undefined,
    [],
    ["caption", "long-text"],
    ["字幕", "台词", "原文", "时间定位"],
    { density: "light", systemRole: "caption-track", durationSeconds: { min: 0.5, max: 20 } },
  ),
  TerminalPanel: capability(
    "process",
    ["explanation", "list", "evidence"],
    ["process", "list", "long-text"],
    ["代码", "终端", "命令", "步骤", "开发", "工具"],
    { density: "heavy", durationSeconds: { min: 3, max: 12 } },
  ),
  SoftTeachingGlassPanel: capability(
    "explanation",
    ["list", "emphasis"],
    ["list", "long-text"],
    ["教学", "解释", "知识点", "方法", "说明"],
    { density: "medium", durationSeconds: { min: 3, max: 10 } },
  ),
  PortraitChapterRail: capability(
    "transition",
    ["emphasis", "process"],
    ["short-text", "process"],
    ["章节", "下一步", "接下来", "阶段", "开场"],
    { orientation: "portrait", density: "light", durationSeconds: { min: 1.2, max: 5 } },
  ),
  PortraitIndexedChapterTitle: capability(
    "transition",
    ["emphasis", "process"],
    ["short-text", "process"],
    ["章节编号", "第一个", "第二个", "痛点", "章节", "阶段", "开场", "下一部分"],
    { orientation: "portrait", density: "light", durationSeconds: { min: 2, max: 8 } },
  ),
  PortraitInfoCallout: capability(
    "explanation",
    ["emphasis", "evidence", "process", "transition", "warning", "call-to-action"],
    ["short-text", "long-text"],
    ["说明", "方法", "工具", "例如", "提示", "补充"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 1.5, max: 7 } },
  ),
  PortraitMetricDecision: capability(
    "metric",
    ["comparison", "emphasis"],
    ["metric", "short-text"],
    ["数字", "比例", "金额", "增长", "降低", "结果"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 1.5, max: 6 } },
  ),
  PortraitDecisionTagStack: capability(
    "comparison",
    ["list", "emphasis", "metric"],
    ["comparison", "list", "short-text"],
    ["标签", "优缺点", "选择", "判断", "并列"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 1.5, max: 6 } },
  ),
  PortraitStepChecklist: capability(
    "process",
    ["list", "explanation"],
    ["process", "list", "short-text"],
    ["步骤", "流程", "首先", "然后", "最后"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 2.5, max: 9 } },
  ),
  PortraitStaggeredToolList: capability(
    "list",
    ["explanation", "emphasis", "process"],
    ["list", "short-text"],
    ["多个工具", "多个技能", "几个方法", "清单", "逐项讲解", "skill"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 3, max: 9 } },
  ),
  PortraitPromptMistakeDiagnosis: capability(
    "warning",
    ["explanation", "emphasis"],
    ["short-text", "list"],
    ["直接提问", "官网", "页面普通", "问题不在模型", "缺少准备"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 3, max: 9 } },
  ),
  PortraitWorkflowPrerequisite: capability(
    "process",
    ["explanation", "list", "emphasis"],
    ["process", "list", "short-text"],
    ["动手之前", "先装工作流", "工作流装好", "审美动效工程自测", "顺序"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 4, max: 8 } },
  ),
  PortraitSkillIdentityCard: capability(
    "explanation",
    ["emphasis", "evidence"],
    ["short-text"],
    ["第一个skill", "我自己做的UI skill", "持续更新", "身份介绍"],
    { orientation: "portrait", density: "light", durationSeconds: { min: 2.5, max: 6 } },
  ),
  PortraitSkillSourceFusion: capability(
    "evidence",
    ["explanation", "list", "emphasis"],
    ["list", "short-text"],
    ["taste", "impeccable", "自己的经验", "三样拼成一个", "经验来源"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 4, max: 12 } },
  ),
  PortraitDesignRuleChecklist: capability(
    "explanation",
    ["list", "process", "emphasis"],
    ["list", "short-text"],
    ["设计审美", "怎么排版", "怎么留白", "怎么配色", "怎么做层级", "定好的规矩"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 4, max: 12 } },
  ),
  PortraitSkillResultComparison: capability(
    "comparison",
    ["evidence", "explanation", "emphasis"],
    ["comparison", "media", "short-text"],
    ["没装的时候", "默认效果", "装了之后", "同一个AI", "同一句话", "换个行业", "一样稳"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 6, max: 14 } },
  ),
  PortraitPromptIterationShowcase: capability(
    "process",
    ["evidence", "explanation", "comparison"],
    ["process", "media", "short-text"],
    ["具体怎么用", "想要什么讲清楚", "第一句", "摄影工作室", "想换方向", "数据后台深色", "产品落地页", "只管说要什么"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 10, max: 24 } },
  ),
  PortraitGsapSkillShowcase: capability(
    "process",
    ["explanation", "list", "comparison"],
    ["list", "process", "short-text"],
    ["第二个skill", "GSAP", "高级动画", "滚动触发", "时间轴编排", "错峰入场", "什么时候出现", "快慢怎么给", "一起用", "动得好不好看"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 10, max: 24 } },
  ),
  PortraitSkillIdentityHeaderBar: capability(
    "explanation",
    ["emphasis", "list", "process"],
    ["short-text"],
    ["skill", "技能", "GSAP", "动效引擎", "高级动画", "编号", "徽标"],
    { orientation: "portrait", density: "light", durationSeconds: { min: 2, max: 24 } },
  ),
  PortraitCodeDecisionChecklist: capability(
    "process",
    ["list", "explanation", "warning"],
    ["list", "process", "short-text"],
    ["让AI先想", "功能真的需要吗", "现有代码", "标准库", "原生平台", "已装依赖", "一行能搞定", "实在不行才自己写"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 4, max: 12 } },
  ),
  PortraitBrowserRepairLoop: capability(
    "process",
    ["list", "explanation", "evidence"],
    ["process", "list", "short-text"],
    ["自动测试", "自动修bug", "打开浏览器", "自己运行", "自己点击", "截图检查", "发现问题自己改", "再验证", "一直循环", "直到没问题"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 6, max: 16 } },
  ),
  PortraitAgentBrowserMedia: capability(
    "evidence",
    ["process", "explanation", "emphasis"],
    ["media", "short-text"],
    ["你现在看到的这一整页", "一遍遍自查", "打开浏览器", "逐屏自查", "页面截图", "网页画面"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 3, max: 12 } },
  ),
  PortraitMediaPosterReveal: capability(
    "evidence",
    ["emphasis", "explanation", "transition"],
    ["media", "short-text"],
    ["展示素材", "看这个案例", "视频素材", "图片素材", "海报", "作品展示", "页面预览"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 2, max: 12 } },
  ),
  PortraitSkillStepGrid: capability(
    "process",
    ["list", "explanation", "transition"],
    ["list", "process", "short-text"],
    ["4个skill", "四个skill", "一个一个讲清楚", "定审美", "跟动效", "保克制", "自测自修"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 2, max: 8 } },
  ),
  PortraitGapHeadline: capability(
    "emphasis",
    ["comparison", "explanation", "transition"],
    ["short-text", "comparison"],
    ["真正拉开差距", "不是模型", "差距不在模型", "最后说一句", "工作流"],
    { orientation: "portrait", density: "light", durationSeconds: { min: 2, max: 8 } },
  ),
  PortraitAiOutputGapQuote: capability(
    "comparison",
    ["explanation", "emphasis", "evidence"],
    ["comparison", "short-text"],
    ["同样一个AI", "同样一个 AI", "做出来", "差了一整个档次", "一眼就是AI糊的", "直接上线"],
    { orientation: "portrait", density: "light", durationSeconds: { min: 2, max: 8 } },
  ),
  PortraitAiOutputGapComparison: capability(
    "comparison",
    ["emphasis", "explanation", "evidence"],
    ["comparison", "short-text"],
    ["一眼就是AI糊的", "一眼就是 AI 糊的", "能直接上线", "AI糊", "THE GAP"],
    { orientation: "portrait", density: "light", durationSeconds: { min: 2, max: 8 } },
  ),
  PortraitRiskWarning: capability(
    "warning",
    ["emphasis", "list", "explanation"],
    ["list", "short-text"],
    ["风险", "注意", "限制", "错误", "异常", "避免"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 2, max: 8 } },
  ),
  PortraitNextEpisodeCta: capability(
    "call-to-action",
    ["transition", "emphasis"],
    ["short-text"],
    ["关注", "点赞", "收藏", "下期", "下一步"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 1.5, max: 6 } },
  ),
  QuickSetupProof: capability(
    "evidence",
    ["emphasis", "comparison", "list"],
    ["list", "short-text"],
    ["证明", "快速", "门槛", "无需", "几分钟"],
    { orientation: "portrait", density: "medium", durationSeconds: { min: 1.5, max: 6 } },
  ),
  LegacyModelEliminationWarning: capability(
    "warning",
    ["comparison", "emphasis"],
    ["comparison", "short-text"],
    ["淘汰", "过时", "落后", "失效", "被取代"],
    { orientation: "portrait", density: "heavy", durationSeconds: { min: 1.5, max: 7 } },
  ),
  MediaSpotlightCard: capability(
    "evidence",
    ["explanation", "emphasis"],
    ["media", "short-text"],
    ["图片", "视频", "案例", "截图", "作品", "证据"],
    { density: "heavy", durationSeconds: { min: 2, max: 12 } },
  ),
  MaterialCard: capability(
    "evidence",
    ["explanation"],
    ["media"],
    ["图片", "视频", "素材", "截图", "录屏"],
    { density: "medium", durationSeconds: { min: 2, max: 12 } },
  ),
  SegmentedMeter: capability(
    "metric",
    ["process", "list", "emphasis"],
    ["metric", "process"],
    ["容量", "阶段", "进度", "性能", "分段"],
  ),
  DualMetricBar: capability(
    "comparison",
    ["metric", "emphasis"],
    ["metric", "comparison"],
    ["对比", "差异", "竞争", "前后", "双向"],
  ),
  WaveformMetric: capability(
    "metric",
    ["evidence", "emphasis"],
    ["metric"],
    ["实时", "吞吐", "速度", "波形", "连续变化"],
  ),
  LiquidGauge: capability(
    "metric",
    ["emphasis", "process"],
    ["metric"],
    ["完成率", "占比", "进度", "比例", "液位"],
  ),
  RadialTicks: capability(
    "emphasis",
    ["metric", "evidence"],
    ["metric", "short-text"],
    ["综合指标", "核心结论", "评分", "科技", "刻度"],
  ),
});

export const semanticIntentIdsFor = (
  capabilities: EffectSemanticCapabilities,
): SemanticIntentId[] => [
  ...(capabilities.primaryIntent ? [capabilities.primaryIntent] : []),
  ...capabilities.secondaryIntents,
];
