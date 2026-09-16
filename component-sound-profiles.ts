export type ComponentSoundDensity = "subtle" | "balanced" | "emphatic";

export type ComponentSoundProfile = {
  role: string;
  roleLabel: string;
  reason: string;
  trigger: {
    label: string;
    offsetSeconds: number;
  };
  primaryTags: string[];
  keywords: string[];
  avoidKeywords: string[];
  defaultDensity: ComponentSoundDensity;
  autoEnabled: boolean;
  requireKeywordMatch?: boolean;
};

type SharedProfile = Omit<ComponentSoundProfile, "reason">;

const sharedProfiles: Record<string, SharedProfile> = {
  transition: {
    role: "transition",
    roleLabel: "轻转场",
    trigger: { label: "组件开始入场", offsetSeconds: -0.06 },
    primaryTags: ["transition", "riser", "light"],
    keywords: ["whoosh", "woosh", "swoosh", "swipe", "slide", "rise", "reveal", "soft"],
    avoidKeywords: ["loop", "long", "ambient"],
    defaultDensity: "balanced",
    autoEnabled: true,
  },
  camera: {
    role: "camera",
    roleLabel: "镜头运动",
    trigger: { label: "镜头开始移动", offsetSeconds: -0.08 },
    primaryTags: ["camera", "transition"],
    keywords: ["zoom", "lens", "focus", "shutter", "swipe", "whoosh", "woosh"],
    avoidKeywords: ["loop", "applause"],
    defaultDensity: "balanced",
    autoEnabled: true,
  },
  typing: {
    role: "typing",
    roleLabel: "输入与执行",
    trigger: { label: "首行内容开始输入", offsetSeconds: 0.08 },
    primaryTags: ["text", "ui"],
    keywords: ["typewriter", "typing", "keyboard", "keypress", "keystroke", "write"],
    avoidKeywords: ["loop", "ambient", "long"],
    defaultDensity: "subtle",
    autoEnabled: true,
    requireKeywordMatch: true,
  },
  impact: {
    role: "impact",
    roleLabel: "警示落点",
    trigger: { label: "警示信息落定", offsetSeconds: 0.04 },
    primaryTags: ["impact", "glass", "data"],
    keywords: ["impact", "hit", "punch", "slam", "alert", "warning", "break", "glitch"],
    avoidKeywords: ["loop", "ambient"],
    defaultDensity: "emphatic",
    autoEnabled: true,
  },
  counter: {
    role: "counter",
    roleLabel: "数字计数",
    trigger: { label: "数值开始变化", offsetSeconds: 0.12 },
    primaryTags: ["counter", "ui", "data"],
    keywords: ["counter", "count", "tick", "score", "number", "rise", "digital", "click"],
    avoidKeywords: ["loop", "ambient", "long"],
    defaultDensity: "subtle",
    autoEnabled: true,
  },
  sequence: {
    role: "sequence",
    roleLabel: "步骤提示",
    trigger: { label: "第一项内容出现", offsetSeconds: 0.12 },
    primaryTags: ["ui", "text", "mech"],
    keywords: ["tick", "click", "select", "option", "pop", "step", "tap", "snap"],
    avoidKeywords: ["loop", "ambient", "long"],
    defaultDensity: "subtle",
    autoEnabled: true,
    requireKeywordMatch: true,
  },
  reveal: {
    role: "reveal",
    roleLabel: "素材揭示",
    trigger: { label: "主体素材开始显现", offsetSeconds: 0.04 },
    primaryTags: ["camera", "paper", "film", "transition"],
    keywords: ["shutter", "camera", "paper", "photo", "reveal", "open", "swipe", "slide"],
    avoidKeywords: ["loop", "ambient", "long"],
    defaultDensity: "balanced",
    autoEnabled: true,
  },
  confirm: {
    role: "confirm",
    roleLabel: "确认提示",
    trigger: { label: "重点信息落定", offsetSeconds: 0.08 },
    primaryTags: ["ui", "light"],
    keywords: ["confirm", "success", "notify", "message", "pop", "click", "bell", "chime"],
    avoidKeywords: ["loop", "ambient", "long"],
    defaultDensity: "subtle",
    autoEnabled: true,
    requireKeywordMatch: true,
  },
  brand: {
    role: "brand",
    roleLabel: "品牌显现",
    trigger: { label: "标识完成显现", offsetSeconds: 0.1 },
    primaryTags: ["light", "ui", "transition"],
    keywords: ["shimmer", "shine", "sparkle", "reveal", "chime", "soft", "whoosh"],
    avoidKeywords: ["loop", "hard", "heavy"],
    defaultDensity: "subtle",
    autoEnabled: true,
  },
  data: {
    role: "data",
    roleLabel: "数据变化",
    trigger: { label: "数据界面开始变化", offsetSeconds: 0.06 },
    primaryTags: ["data", "scifi", "ui"],
    keywords: ["data", "digital", "scan", "tech", "computer", "electronic", "glitch"],
    avoidKeywords: ["loop", "ambient", "long"],
    defaultDensity: "balanced",
    autoEnabled: true,
  },
  material: {
    role: "material",
    roleLabel: "实体卡片",
    trigger: { label: "卡片进入画面", offsetSeconds: 0.02 },
    primaryTags: ["paper", "camera", "film"],
    keywords: ["paper", "card", "photo", "shutter", "tape", "vinyl", "write", "page"],
    avoidKeywords: ["loop", "ambient", "long"],
    defaultDensity: "subtle",
    autoEnabled: true,
  },
  manualOnly: {
    role: "manual-only",
    roleLabel: "不自动配音",
    trigger: { label: "由用户指定", offsetSeconds: 0 },
    primaryTags: [],
    keywords: [],
    avoidKeywords: [],
    defaultDensity: "subtle",
    autoEnabled: false,
  },
};

const profile = (
  role: keyof typeof sharedProfiles,
  reason: string,
  overrides: Partial<SharedProfile> = {},
): ComponentSoundProfile => ({ ...sharedProfiles[role], ...overrides, reason });

/**
 * Built-in components use stable IDs here. The profile describes the motion event,
 * while the actual sound is resolved from the current library by tags and metadata.
 */
export const COMPONENT_SOUND_PROFILES: Readonly<Record<string, ComponentSoundProfile>> = Object.freeze({
  GlobalExpedition: profile("transition", "路线与节点进入画面，使用短转场声提示空间推进。"),
  ChapterBar: profile("transition", "章节条建立新的内容阶段，使用克制的章节转场声。"),
  FocusCamMove: profile("camera", "画面存在明确的缩放与重构图动作，声音跟随镜头启动。"),
  SrtSemanticCaptions: profile("manualOnly", "字幕持续承载口播，自动加音容易过密并干扰人声。"),
  SrtCueText: profile("manualOnly", "基础字幕不自动添加音效，避免每句字幕都产生提示音。"),
  TerminalPanel: profile("typing", "终端内容逐项出现，匹配短促的输入或按键声音。"),
  Terminal3D: profile("typing", "三维终端以输入和执行为主动作，优先匹配打字与数字按键声。"),
  PortraitChapterRail: profile("transition", "章节轨道负责段落切换，声音在入场前轻微提前。"),
  PortraitIndexedChapterTitle: profile("transition", "编号章节标题用于建立新段落，匹配短转场声。"),
  PortraitMetricDecision: profile("counter", "核心动作是数字变化与结论落定，优先匹配计数提示声。"),
  PortraitStepStageTitle: profile("transition", "阶段标题用于承接上下文，使用较轻的切换提示声。"),
  PortraitStepNumberList: profile("sequence", "编号步骤依次出现，声音与第一项落点对齐。"),
  PortraitStaggeredToolList: profile("sequence", "工具条目错峰进入，使用短促的逐项提示声。"),
  PortraitToolBadgeList: profile("confirm", "徽标与排名信息需要轻量确认感，避免重击音。"),
  PortraitToolListTitle: profile("confirm", "列表引导标题以轻提示建立注意力。"),
  PortraitPromptMistakeDiagnosis: profile("impact", "错误诊断需要清晰警示落点，优先匹配短冲击声。"),
  PortraitWorkflowPrerequisite: profile("sequence", "前置条件按顺序建立，使用步骤确认类声音。"),
  PortraitSkillSourceFusion: profile("reveal", "多个来源汇聚成结果，使用素材揭示类声音。"),
  PortraitDesignRuleChecklist: profile("sequence", "设计规则以清单方式出现，声音跟随首个勾选项。"),
  PortraitSkillResultComparison: profile("reveal", "前后结果对比依赖画面揭示，匹配切换或快门类声音。"),
  PortraitPromptIterationShowcase: profile("data", "界面与方案连续迭代，优先匹配数字界面变化声。"),
  PortraitSkillIdentityHeaderBar: profile("confirm", "身份标题条完成落位时使用轻量确认声。"),
  PortraitHeatBadge: profile("counter", "热度与数值是主要信息，声音跟随数值出现。"),
  PortraitPillText: profile("confirm", "短标签用于补充状态，匹配轻量弹出或确认声。"),
  PortraitCodeDecisionChecklist: profile("sequence", "决策项依次确认，优先匹配点击或勾选声。"),
  PortraitBrowserRepairLoop: profile("data", "浏览器检查与修复循环表现为数字流程变化，匹配科技提示声。"),
  PortraitAgentBrowserMedia: profile("reveal", "网页或截图是主要证据，使用素材显现类声音。"),
  PortraitMediaPosterReveal: profile("reveal", "海报和媒体从遮罩中显现，声音与揭示起点对齐。"),
  PortraitSkillStepGrid: profile("sequence", "多个技能步骤按网格出现，匹配短促的步骤提示声。"),
  PortraitAiOutputGapComparison: profile("data", "AI 输出差异通过界面比较呈现，匹配数字变化声。"),
  PortraitRiskWarning: profile("impact", "风险警告需要明确但短促的听觉落点。"),
  PortraitNextEpisodeTitle: profile("transition", "下集标题承担收束与转场，使用轻转场声。"),
  PortraitFollowCta: profile("confirm", "行动引导在按钮或文案落定时使用确认提示声。"),
  QuickSetupProof: profile("sequence", "安装或设置证明按步骤完成，使用短确认声。"),
  LegacyEliminationPanel: profile("impact", "淘汰信息需要明确冲击，声音跟随结论落定。"),
  MarketEliminationStamp: profile("impact", "印章动作具有清晰碰撞点，优先匹配短重击声。"),
  MaterialCard: profile("material", "实体素材卡进入画面，优先匹配纸张或卡片声音。"),
  PhoneRecordingFrameNeutral: profile("reveal", "手机录屏框架显现时使用轻快门或界面切换声。"),
  GigHourlyTitle: profile("counter", "时薪数字是主要视觉变化，声音跟随数值出现。"),
  BrollGigCardFloat: profile("material", "悬浮工作卡具有实体卡片动势，匹配轻纸张或滑入声。"),
  BrollEpisodePosterDuo: profile("reveal", "双海报依次显现，优先匹配快门或切换声。"),
  BrollPlayMilestoneBadge: profile("counter", "播放里程碑以数字落点为主，匹配计数确认声。"),
  ComparisonProgressBars: profile("counter", "对比进度条同步增长，声音跟随开始计数。"),
  MilestoneFollowerProgress: profile("counter", "粉丝进度与里程碑变化，匹配计数或上升提示声。"),
  SegmentedMeter: profile("counter", "分段能量条逐段增长，优先匹配短计数声。"),
  CaseStudySidebar: profile("material", "案例侧栏像资料卡进入，使用轻卡片或纸张声音。"),
  BrandLogo: profile("brand", "品牌标识完成显现时使用克制的光感或确认声音。"),
  TeamAttributionCard: profile("brand", "署名卡完成显现时使用轻量品牌提示声。"),
  PinBoard: profile("material", "图钉与便签具有实体落位感，匹配轻纸张或卡片声。"),
  StepTimeline: profile("sequence", "时间线节点逐个建立，匹配点击或勾选提示声。"),
  TermCard: profile("confirm", "术语卡用于解释重点概念，使用轻弹出或确认声。"),
});

const fallbackProfile = profile(
  "manualOnly",
  "该自定义组件尚未登记动作声音配置，为避免误配只提供手动选择。",
);

export const getComponentSoundProfile = (componentId: string): ComponentSoundProfile =>
  COMPONENT_SOUND_PROFILES[componentId] ?? fallbackProfile;

export const COMPONENT_SOUND_DENSITY_LABELS: Record<ComponentSoundDensity, string> = {
  subtle: "克制",
  balanced: "标准",
  emphatic: "强调",
};
