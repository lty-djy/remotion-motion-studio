import React, { type CSSProperties } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { MotionComponentDefinition } from "./local-protocol";

export type BuiltInCatalogItem = {
  ids: string[];
  name: string;
};

export type BuiltInCatalogCategory = {
  id: string;
  name: string;
  items: BuiltInCatalogItem[];
};

type BuiltInSpec = {
  id: string;
  name: string;
  description: string;
  category: string;
  glyph: string;
  aliases?: string[];
  defaults?: Partial<BuiltInProps>;
};

type BuiltInProps = {
  componentType: string;
  enabled: boolean;
  instanceDurationInFrames: number;
  title: string;
  subtitle: string;
  value: string;
  item1: string;
  item2: string;
  item3: string;
  accentColor: string;
  secondaryColor: string;
  backgroundOpacity: number;
};

const CATALOG_SPECS: Array<{
  id: string;
  name: string;
  items: BuiltInSpec[];
}> = [
  {
    id: "navigation",
    name: "导航与进度",
    items: [
      {
        id: "ChapterBar",
        name: "章节进度条",
        description: "随视频播放推进的顶部章节导航",
        category: "navigation",
        glyph: "CH",
        defaults: {
          title: "开场",
          subtitle: "抽盲盒",
          value: "编辑台",
          item1: "怎么用",
          item2: "四大好处",
          item3: "收尾",
        },
      },
    ],
  },
  {
    id: "metric",
    name: "数字与指标",
    items: [
      { id: "MetricFocus", name: "核心数字", description: "核心数字与解释标签", category: "metric", glyph: "88", defaults: { value: "87%", title: "核心指标", subtitle: "同比提升 24%" } },
      { id: "SpeedGauge", name: "动态码表", description: "码表、速度和完成率", category: "metric", glyph: "120", defaults: { value: "120", title: "处理速度", subtitle: "FPS" } },
      { id: "CounterTicker", name: "滚动计数器", description: "快速滚动的累计数字", category: "metric", glyph: "9K", defaults: { value: "9,842", title: "实时调用", subtitle: "TOTAL REQUESTS" } },
      { id: "StatGrid", name: "指标矩阵", description: "多指标信息矩阵", category: "metric", glyph: "2×2", defaults: { value: "4.8×", title: "性能矩阵", item1: "延迟 23ms", item2: "准确率 98%", item3: "吞吐 120/s" } },
      { id: "ProgressRing", name: "环形进度", description: "环形完成率和阶段反馈", category: "metric", glyph: "◔", defaults: { value: "76%", title: "任务进度", subtitle: "正在生成" } },
      { id: "DeltaBadge", name: "涨跌标签", description: "环比、同比和涨跌提示", category: "metric", glyph: "+24%", defaults: { value: "+24.6%", title: "周增长", subtitle: "较上周期" } },
      { id: "Countdown", name: "倒计时", description: "倒计时和阶段切换", category: "metric", glyph: "03", defaults: { value: "03", title: "即将开始", subtitle: "NEXT CHAPTER" } },
      { id: "MetricBar", name: "条形指标图", description: "紧凑型条形指标和目标刻度", category: "metric", glyph: "BAR+", defaults: { value: "84%", title: "模型能力", subtitle: "TARGET 90%", item1: "推理 84%", item2: "速度 72%", item3: "稳定性 91%" } },
      { id: "SegmentedMeter", name: "分段能量条", description: "分段式容量、性能和能量指示", category: "metric", glyph: "▮▮▮", defaults: { value: "75%", title: "算力负载", subtitle: "COMPUTE POWER" } },
      { id: "DualMetricBar", name: "双向对比条", description: "双向指标差异和竞争关系", category: "metric", glyph: "⇆", defaults: { value: "+42%", title: "方案对比", subtitle: "AI VS TRADITIONAL", item1: "传统 58", item2: "AI 100" } },
      { id: "FlipCounter", name: "翻牌数字", description: "机械翻牌式核心数字", category: "metric", glyph: "8:8", defaults: { value: "12,804", title: "实时请求", subtitle: "LIVE REQUESTS" } },
      { id: "WaveformMetric", name: "波形指标", description: "连续波形和实时吞吐读数", category: "metric", glyph: "∿", defaults: { value: "128/s", title: "数据吞吐", subtitle: "STREAM VELOCITY" } },
      { id: "LiquidGauge", name: "液态仪表", description: "液态填充式完成率仪表", category: "metric", glyph: "≈", defaults: { value: "68%", title: "资源水位", subtitle: "CAPACITY" } },
      { id: "RadialTicks", name: "HUD 刻度环", description: "科技 HUD 刻度与中心读数", category: "metric", glyph: "◎", defaults: { value: "92%", title: "系统置信度", subtitle: "CONFIDENCE" } },
      { id: "PulseMetric", name: "实时脉冲", description: "心电式实时状态脉冲", category: "metric", glyph: "⌁", defaults: { value: "LIVE", title: "服务脉冲", subtitle: "23 MS · HEALTHY" } },
    ],
  },
  {
    id: "chart",
    name: "图表与比较",
    items: [
      { id: "CompareSplit", name: "左右对比", description: "两种方案左右对照", category: "chart", glyph: "VS", defaults: { title: "方案对比", item1: "传统流程", item2: "AI 工作流", value: "4.8×" } },
      { id: "BarChart", name: "柱状图", description: "横向或纵向柱状图", category: "chart", glyph: "BAR", defaults: { title: "能力对比", item1: "速度", item2: "质量", item3: "成本" } },
      { id: "LineTrend", name: "折线趋势", description: "数据趋势与拐点", category: "chart", glyph: "↗", defaults: { title: "增长趋势", value: "+38%", subtitle: "LAST 30 DAYS" } },
      { id: "AreaTrend", name: "面积趋势", description: "带面积填充的趋势图", category: "chart", glyph: "AREA", defaults: { title: "活跃度趋势", value: "2.4M", subtitle: "ACTIVE USERS" } },
      { id: "DonutShare", name: "占比环图", description: "类别占比与构成", category: "chart", glyph: "72%", defaults: { title: "市场份额", value: "72%", item1: "核心业务", item2: "增量业务" } },
      { id: "RadarProfile", name: "能力雷达", description: "多维能力雷达图", category: "chart", glyph: "RADAR", defaults: { title: "能力画像", item1: "推理", item2: "速度", item3: "创意" } },
      { id: "Leaderboard", name: "排行榜", description: "排行与名次变化", category: "chart", glyph: "#1", defaults: { title: "本周排行", item1: "01  Agent X", item2: "02  Model R", item3: "03  Vision Pro" } },
      { id: "BeforeAfter", name: "前后对照", description: "前后效果对照", category: "chart", glyph: "A/B", defaults: { title: "优化前后", item1: "BEFORE", item2: "AFTER", value: "+64%" } },
      { id: "MatrixQuadrant", name: "二维象限", description: "二维坐标与象限定位", category: "chart", glyph: "XY", defaults: { title: "产品象限", item1: "高价值", item2: "高效率", subtitle: "VALUE × EFFICIENCY" } },
    ],
  },
  {
    id: "text",
    name: "文字与叙事",
    items: [
      { id: "TitleReveal", name: "章节标题", description: "章节标题揭示", category: "text", glyph: "T", defaults: { title: "智能时代的新界面", subtitle: "CHAPTER 01" } },
      { id: "LowerThird", name: "人物信息条", description: "人物或术语下三分之一", category: "text", glyph: "ID", defaults: { title: "张明", subtitle: "AI PRODUCT DESIGNER" } },
      { id: "QuoteLockup", aliases: ["QuoteCard"], name: "金句卡", description: "金句定格与观点强调", category: "text", glyph: "“ ”", defaults: { title: "真正的效率，是让复杂消失。", subtitle: "KEY INSIGHT" } },
      { id: "KeywordBurst", name: "关键词爆发", description: "高冲击关键词动画", category: "text", glyph: "KEY", defaults: { title: "速度 × 智能", subtitle: "BREAK THE LIMIT" } },
      { id: "BulletStack", name: "逐条要点", description: "逐条出现的内容要点", category: "text", glyph: "•••", defaults: { title: "三个关键变化", item1: "模型能力跃迁", item2: "成本快速下降", item3: "应用进入生产环境" } },
      { id: "CaptionHighlight", name: "字幕高亮", description: "字幕关键词高亮", category: "text", glyph: "Aa", defaults: { title: "每个人都能拥有自己的 AI 团队", value: "AI 团队", subtitle: "CAPTION HIGHLIGHT" } },
      { id: "DefinitionCard", name: "概念定义", description: "概念和术语解释", category: "text", glyph: "DEF", defaults: { title: "Agentic Workflow", subtitle: "能够自主规划并执行多步骤任务的智能工作流。" } },
      { id: "QuestionCard", name: "问题卡", description: "问题抛出和悬念建立", category: "text", glyph: "?", defaults: { title: "下一代应用，还需要界面吗？", subtitle: "THE BIG QUESTION" } },
      { id: "ChapterMarker", name: "章节标记", description: "章节编号与阅读进度", category: "text", glyph: "01", defaults: { value: "02", title: "从工具到伙伴", subtitle: "CHAPTER" } },
    ],
  },
  {
    id: "media",
    name: "图片、视频与证据",
    items: [
      { id: "ImageFrame", name: "图片框", description: "图片框、角标和扫描线", category: "media", glyph: "IMG", defaults: { title: "影像证据", subtitle: "IMAGE 16:9" } },
      { id: "EvidenceCard", name: "证据卡", description: "截图、论文和官网证据", category: "media", glyph: "DOC", defaults: { title: "权威信源", subtitle: "RESEARCH PAPER · 2026", item1: "关键结论已通过原始资料核验" } },
      { id: "DeviceMockup", name: "设备模型", description: "手机或电脑设备框", category: "media", glyph: "▣", defaults: { title: "PRODUCT PREVIEW", subtitle: "Mobile Experience" } },
      { id: "GalleryStrip", name: "多图画廊", description: "多图胶片带展示", category: "media", glyph: "▥", defaults: { title: "产品画廊", subtitle: "01 / 03" } },
      { id: "MagnifierCallout", name: "局部放大", description: "局部细节放大标注", category: "media", glyph: "⌕", defaults: { title: "关键细节", subtitle: "ZOOM 240%", value: "240%" } },
      { id: "SourceCitation", name: "信源脚注", description: "来源与引用脚注卡", category: "media", glyph: "SRC", defaults: { title: "来源：官方技术报告", subtitle: "VERIFIED SOURCE · JUL 2026" } },
      { id: "VideoInset", name: "画中画", description: "画中画视频窗口", category: "media", glyph: "PIP", defaults: { title: "现场画面", subtitle: "LIVE FEED" } },
    ],
  },
  {
    id: "structure",
    name: "结构、流程与解释",
    items: [
      { id: "StepFlow", name: "步骤流", description: "顺序步骤与执行流程", category: "structure", glyph: "1→3", defaults: { title: "执行流程", item1: "理解", item2: "规划", item3: "执行" } },
      { id: "TimelineRail", name: "事件时间线", description: "事件节点与时间推进", category: "structure", glyph: "••→", defaults: { title: "发展时间线", item1: "2024  萌芽", item2: "2025  爆发", item3: "2026  普及" } },
      { id: "ArchitectureMap", name: "架构图", description: "系统模块和连接关系", category: "structure", glyph: "MAP", defaults: { title: "系统架构", item1: "INPUT", item2: "AGENT CORE", item3: "TOOLS" } },
      { id: "FunnelChart", name: "漏斗图", description: "漏斗转化与筛选过程", category: "structure", glyph: "▽", defaults: { title: "转化漏斗", item1: "访问 100%", item2: "意向 46%", item3: "转化 18%" } },
      { id: "DecisionTree", name: "决策树", description: "判断条件和分支", category: "structure", glyph: "Y/N", defaults: { title: "决策路径", item1: "需要实时数据？", item2: "YES · 调用工具", item3: "NO · 直接回答" } },
      { id: "CauseEffect", name: "因果链", description: "原因、机制和结果", category: "structure", glyph: "A→B", defaults: { title: "增长因果链", item1: "能力提升", item2: "成本下降", item3: "应用爆发" } },
      { id: "Roadmap", name: "路线图", description: "阶段路线和里程碑", category: "structure", glyph: "Q1", defaults: { title: "产品路线图", item1: "Q1 原型", item2: "Q2 测试", item3: "Q3 发布" } },
      { id: "Checklist", name: "检查清单", description: "任务和完成状态", category: "structure", glyph: "✓", defaults: { title: "发布检查", item1: "画面安全区", item2: "声音与字幕", item3: "导出参数" } },
    ],
  },
  {
    id: "tech",
    name: "UI 与科技界面",
    items: [
      { id: "TerminalWindow", name: "终端窗口", description: "终端命令和输出演示", category: "tech", glyph: ">_", defaults: { title: "agent@studio", item1: "$ analyze video.mp4", item2: "✓ timeline generated", item3: "✓ render ready" } },
      { id: "CodeSnippet", name: "代码片段", description: "代码片段聚焦和高亮", category: "tech", glyph: "</>", defaults: { title: "motion.tsx", item1: "const frame = useCurrentFrame();", item2: "spring({ frame, fps });", item3: "return <Scene />;" } },
      { id: "DashboardPanel", name: "仪表盘", description: "数据仪表盘面板", category: "tech", glyph: "DASH", defaults: { title: "SYSTEM OVERVIEW", value: "98.7%", item1: "CPU 34%", item2: "GPU 72%", item3: "LATENCY 23ms" } },
      { id: "StatusMonitor", name: "状态监控", description: "系统状态和实时监控", category: "tech", glyph: "LIVE", defaults: { title: "服务状态", value: "ONLINE", item1: "API 正常", item2: "渲染正常", item3: "存储正常" } },
      { id: "NotificationToast", name: "通知卡", description: "系统通知和结果反馈", category: "tech", glyph: "NEW", defaults: { title: "任务已完成", subtitle: "视频动效已成功生成" } },
      { id: "SearchBarDemo", name: "搜索演示", description: "搜索输入和答案生成", category: "tech", glyph: "⌕", defaults: { title: "搜索任何问题…", value: "AI 视频工作流", subtitle: "PRESS ENTER" } },
      { id: "AIAgentFlow", name: "Agent 流程", description: "AI Agent 的调用链", category: "tech", glyph: "AI", defaults: { title: "AGENT WORKFLOW", item1: "REASON", item2: "TOOL", item3: "ANSWER" } },
      { id: "DataPacket", name: "数据流", description: "数据包和节点传输", category: "tech", glyph: "0101", defaults: { title: "DATA STREAM", value: "128 GB/s", subtitle: "ENCRYPTED CHANNEL" } },
    ],
  },
  {
    id: "spatial",
    name: "空间与聚焦",
    items: [
      { id: "MapPin", name: "地图点位", description: "地图点位和路线", category: "spatial", glyph: "⌖", defaults: { title: "上海", subtitle: "31.2304° N · 121.4737° E" } },
      { id: "OrbitDiagram", name: "轨道关系", description: "中心与环绕关系", category: "spatial", glyph: "◎", defaults: { title: "AI CORE", item1: "DATA", item2: "TOOLS", item3: "MEMORY" } },
      { id: "CoordinateGrid", name: "坐标网格", description: "科技坐标和空间定位", category: "spatial", glyph: "XY", defaults: { title: "SPATIAL GRID", subtitle: "X 042 · Y 087" } },
      { id: "SafeAreaGuide", name: "安全区", description: "平台安全区域提示", category: "spatial", glyph: "SAFE", defaults: { title: "内容安全区", subtitle: "DOUYIN 9:16 GUIDE" } },
      { id: "FocusReticle", name: "扫描锁定", description: "目标框与扫描锁定", category: "spatial", glyph: "LOCK", defaults: { title: "TARGET LOCKED", value: "98%", subtitle: "TRACKING" } },
    ],
  },
  {
    id: "brand",
    name: "品牌、装饰与转场",
    items: [
      { id: "LogoReveal", name: "Logo 揭示", description: "品牌标识揭示", category: "brand", glyph: "LOGO", defaults: { title: "MOTION STUDIO", subtitle: "INTELLIGENCE IN MOTION" } },
      { id: "GlassPanel", name: "玻璃卡片", description: "玻璃质感信息卡", category: "brand", glyph: "GLASS", defaults: { title: "未来已经发生", subtitle: "A NEW DIGITAL ERA" } },
      { id: "NeonDivider", name: "霓虹分隔", description: "霓虹章节分隔线", category: "brand", glyph: "—", defaults: { title: "NEXT CHAPTER", subtitle: "02 · PRODUCT" } },
      { id: "WipeTransition", name: "擦除转场", description: "方向擦除转场", category: "brand", glyph: "WIPE", defaults: { title: "场景切换", subtitle: "WIPE TRANSITION" } },
      { id: "MaskReveal", name: "遮罩揭示", description: "遮罩文字和画面揭示", category: "brand", glyph: "MASK", defaults: { title: "从想法到现实", subtitle: "MASK REVEAL" } },
      { id: "ParticleField", name: "粒子场", description: "科技粒子背景", category: "brand", glyph: "•••", defaults: { title: "连接每一个智能节点", subtitle: "PARTICLE NETWORK" } },
      { id: "ScanTransition", name: "扫描转场", description: "扫描线和数字转场", category: "brand", glyph: "SCAN", defaults: { title: "SCANNING", value: "87%", subtitle: "FRAME ANALYSIS" } },
      { id: "EndLockup", name: "结尾卡", description: "结尾锁定和行动提示", category: "brand", glyph: "END", defaults: { title: "关注，继续探索 AI", subtitle: "SEE YOU IN THE NEXT VIDEO" } },
    ],
  },
];

export const BUILT_IN_CATALOG: BuiltInCatalogCategory[] = CATALOG_SPECS.map(
  (category) => ({
    id: category.id,
    name: category.name,
    items: category.items.map((item) => ({
      ids: [item.id, ...(item.aliases ?? [])],
      name: item.name,
    })),
  }),
);

export const BUILT_IN_COMPONENT_COUNT = CATALOG_SPECS.reduce(
  (total, category) => total + category.items.length,
  0,
);

const ALL_SPECS = CATALOG_SPECS.flatMap((category) => category.items);
const SPEC_MAP = new Map(ALL_SPECS.map((spec) => [spec.id, spec]));
const CATALOG_PRIMARY_BY_ID = new Map<string, string>();
for (const spec of ALL_SPECS) {
  CATALOG_PRIMARY_BY_ID.set(spec.id, spec.id);
  for (const alias of spec.aliases ?? []) {
    CATALOG_PRIMARY_BY_ID.set(alias, spec.id);
  }
}

export const BUILT_IN_COMPONENT_IDS = new Set(CATALOG_PRIMARY_BY_ID.keys());

const rgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => part + part)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);
  const number = Number.parseInt(value, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const points = (values: number[], width: number, height: number) =>
  values
    .map(
      (value, index) =>
        `${(index / (values.length - 1)) * width},${height - value * height}`,
    )
    .join(" ");

const BuiltInCatalogComponent = (rawProps: Record<string, unknown>) => {
  const frame = useCurrentFrame();
  const props = rawProps as unknown as BuiltInProps;
  const spec = SPEC_MAP.get(props.componentType) ?? ALL_SPECS[0];
  const layout = CATEGORY_LAYOUT[spec.category] ?? CATEGORY_LAYOUT.metric;
  const accent = props.accentColor || "#68e8ff";
  const secondary = props.secondaryColor || "#9478ff";
  const backgroundOpacity = Math.max(
    0,
    Math.min(1, Number(props.backgroundOpacity ?? 0)),
  );
  const pulse = (Math.sin(frame / 9) + 1) / 2;
  const chartProgress =
    0.12 +
    interpolate(frame, [0, 38], [0, 0.88], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const rootStyle: CSSProperties = {
    position: "absolute",
    left: layout.bounds.x,
    top: layout.bounds.y,
    width: layout.bounds.width,
    height: layout.bounds.height,
    overflow: "hidden",
    color: "#f6fbff",
    fontFamily:
      '"SF Pro Display", Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
  };
  const panelStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    borderRadius: 28,
    border: "none",
    background: `linear-gradient(145deg, ${rgba("#07111f", backgroundOpacity)}, ${rgba("#05070d", backgroundOpacity * 0.88)})`,
    boxShadow:
      backgroundOpacity > 0
        ? `0 28px 80px ${rgba("#000000", backgroundOpacity * 0.46)}, inset 0 1px 0 ${rgba("#ffffff", backgroundOpacity * 0.1)}`
        : "none",
    backdropFilter:
      backgroundOpacity > 0 ? `blur(${18 * backgroundOpacity}px)` : "none",
  };
  const eyebrowStyle: CSSProperties = {
    color: accent,
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 4,
    textTransform: "uppercase",
  };
  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 38,
    lineHeight: 1.08,
    fontWeight: 760,
    letterSpacing: -1.2,
  };
  const mutedStyle: CSSProperties = {
    color: "rgba(231,241,255,.62)",
    fontSize: 17,
    letterSpacing: 1.2,
  };
  const chipStyle: CSSProperties = {
    padding: "9px 14px",
    borderRadius: 999,
    border: `1px solid ${rgba(accent, 0.34)}`,
    background: rgba(accent, backgroundOpacity * 0.12),
    color: "#eafcff",
    fontSize: 16,
  };
  const items = [props.item1, props.item2, props.item3].filter(Boolean);

  if (spec.id === "ChapterBar") {
    if (props.enabled === false) return null;
    const chapters = [
      props.title,
      props.subtitle,
      props.value,
      props.item1,
      props.item2,
      props.item3,
    ].filter(Boolean);
    const duration = Math.max(1, Number(props.instanceDurationInFrames) || 1);
    const progress = Math.max(0, Math.min(1, frame / Math.max(1, duration - 1)));
    const activeIndex = Math.min(
      chapters.length - 1,
      Math.floor(progress * chapters.length),
    );
    return (
      <div
        data-studio-builtin={spec.id}
        style={{
          ...rootStyle,
          overflow: "hidden",
          background: rgba("#0c1220", Math.max(0.76, backgroundOpacity)),
          borderBottom: `1px solid ${rgba(accent, 0.28)}`,
          boxShadow: `0 8px 28px ${rgba("#000000", 0.28)}`,
        }}
      >
        <div
          style={{
            height: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(1, chapters.length)}, minmax(0, 1fr))`,
          }}
        >
          {chapters.map((chapter, index) => (
            <div
              key={`${chapter}-${index}`}
              style={{
                position: "relative",
                display: "grid",
                placeItems: "center",
                color:
                  index === activeIndex
                    ? "#ffffff"
                    : "rgba(224,232,247,.52)",
                fontSize: 21,
                fontWeight: index === activeIndex ? 800 : 650,
                letterSpacing: 0.6,
              }}
            >
              {chapter}
              {index < chapters.length - 1 ? (
                <i
                  style={{
                    position: "absolute",
                    top: 21,
                    right: 0,
                    width: 1,
                    height: 28,
                    background: rgba(accent, 0.2),
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: `${progress * 100}%`,
            height: 4,
            background: `linear-gradient(90deg, ${accent}, ${secondary})`,
            boxShadow: `0 0 16px ${rgba(accent, 0.72)}`,
          }}
        />
      </div>
    );
  }

  if (spec.category === "metric") {
    const parsedValue = Number.parseFloat(props.value) || 76;
    const normalizedValue = Math.max(0, Math.min(1, parsedValue / 100));
    const ring =
      spec.id === "SpeedGauge" || spec.id === "ProgressRing"
        ? interpolate(parsedValue, [0, 120], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 0.76;
    const waveValues = Array.from({ length: 19 }, (_, index) => {
      const base =
        Math.sin(index * 1.24 + frame / 5) * 0.18 +
        Math.sin(index * 0.46 + frame / 9) * 0.12;
      const spike =
        spec.id === "PulseMetric" && index % 6 === 3 ? 0.42 : 0;
      return Math.max(0.08, Math.min(0.92, 0.48 + base + spike));
    });
    return (
      <div data-studio-builtin={spec.id} style={rootStyle}>
        <div style={panelStyle} />
        <div style={{ position: "absolute", inset: 34, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={eyebrowStyle}>{props.title}</div>
            {["MetricBar", "SegmentedMeter", "DualMetricBar", "WaveformMetric", "PulseMetric"].includes(spec.id) ? (
              <div style={{ color: "#fff", fontSize: 25, fontWeight: 840, letterSpacing: -1 }}>{props.value}</div>
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, minHeight: 152 }}>
            {spec.id === "MetricBar" ? (
              <div style={{ flex: 1, display: "grid", gap: 13 }}>
                {items.map((item, index) => {
                  const values = [0.84, 0.72, 0.91];
                  const barColor = index === 1 ? secondary : accent;
                  return (
                    <div key={item}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "rgba(241,248,255,.76)", fontSize: 15 }}>
                        <span>{item}</span>
                        <span style={{ color: barColor }}>{Math.round(values[index] * 100)}%</span>
                      </div>
                      <div style={{ position: "relative", height: 12, overflow: "hidden", borderRadius: 999, background: rgba(barColor, 0.1), border: `1px solid ${rgba(barColor, 0.18)}` }}>
                        <div style={{ width: `${values[index] * chartProgress * 100}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${rgba(barColor, 0.44)}, ${barColor})`, boxShadow: `0 0 22px ${rgba(barColor, 0.6)}` }} />
                        <i style={{ position: "absolute", left: "90%", top: -3, width: 2, height: 18, background: "#fff", opacity: 0.5 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : spec.id === "SegmentedMeter" ? (
              <div style={{ flex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 7, height: 86, alignItems: "end" }}>
                  {Array.from({ length: 14 }, (_, index) => {
                    const active = index / 14 < normalizedValue * chartProgress;
                    const color = index > 10 ? "#ff5d8f" : index > 7 ? secondary : accent;
                    return <i key={index} style={{ height: `${42 + (index % 4) * 14}%`, borderRadius: 6, background: active ? color : rgba(color, 0.1), border: `1px solid ${rgba(color, active ? 0.75 : 0.18)}`, boxShadow: active ? `0 0 18px ${rgba(color, 0.55)}` : "none" }} />;
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, ...mutedStyle }}><span>LOW</span><span>{props.subtitle}</span><span>MAX</span></div>
              </div>
            ) : spec.id === "DualMetricBar" ? (
              <div style={{ flex: 1, display: "grid", gap: 18 }}>
                {[{ label: props.item1, value: 0.58, color: secondary }, { label: props.item2, value: 1, color: accent }].map((entry, index) => (
                  <div key={entry.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 16 }}><span>{entry.label}</span><b style={{ color: entry.color }}>{Math.round(entry.value * 100)}</b></div>
                    <div style={{ height: 22, borderRadius: 6, background: rgba(entry.color, 0.1), overflow: "hidden", transform: index === 0 ? "scaleX(-1)" : undefined }}>
                      <div style={{ width: `${entry.value * chartProgress * 100}%`, height: "100%", background: `repeating-linear-gradient(90deg, ${entry.color} 0 12px, ${rgba(entry.color, 0.34)} 12px 16px)`, boxShadow: `0 0 22px ${rgba(entry.color, 0.48)}` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : spec.id === "FlipCounter" ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                {String(props.value).split("").map((character, index) =>
                  character === "," || character === "." ? (
                    <b key={`${character}-${index}`} style={{ alignSelf: "flex-end", paddingBottom: 16, color: accent, fontSize: 34 }}>{character}</b>
                  ) : (
                    <div key={`${character}-${index}`} style={{ position: "relative", width: 52, height: 82, borderRadius: 10, border: `1px solid ${rgba(accent, 0.36)}`, background: `linear-gradient(#101a28 49%, #050911 49% 51%, #0b1420 51%)`, display: "grid", placeItems: "center", fontFamily: '"SFMono-Regular", Consolas, monospace', fontSize: 42, fontWeight: 850, boxShadow: `0 12px 25px ${rgba("#000", 0.38)}, inset 0 0 18px ${rgba(accent, 0.08)}` }}>
                      {character}
                      <i style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(255,255,255,.14)" }} />
                    </div>
                  ),
                )}
                <div style={{ ...mutedStyle, marginLeft: 10 }}>{props.subtitle}</div>
              </div>
            ) : spec.id === "WaveformMetric" || spec.id === "PulseMetric" ? (
              <div style={{ flex: 1, position: "relative", height: 145, overflow: "hidden", borderRadius: 14, background: rgba(accent, 0.05), border: `1px solid ${rgba(accent, 0.15)}` }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${rgba(accent, 0.08)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(accent, 0.08)} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
                <svg viewBox="0 0 420 145" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                  <defs><linearGradient id={`metric-wave-${spec.id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={secondary} /><stop offset="100%" stopColor={accent} /></linearGradient></defs>
                  <polyline points={points(waveValues, 420, 135)} fill="none" stroke={`url(#metric-wave-${spec.id})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <i style={{ position: "absolute", left: `${(frame * 2.4) % 100}%`, top: 0, bottom: 0, width: 2, background: accent, boxShadow: `0 0 18px 4px ${rgba(accent, 0.45)}` }} />
              </div>
            ) : spec.id === "LiquidGauge" ? (
              <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 32 }}>
                <div style={{ position: "relative", width: 145, height: 145, overflow: "hidden", borderRadius: "50%", border: `3px solid ${rgba(accent, 0.7)}`, background: rgba(accent, 0.05), boxShadow: `0 0 30px ${rgba(accent, 0.26)}, inset 0 0 26px ${rgba(accent, 0.12)}` }}>
                  <div style={{ position: "absolute", left: -18, right: -18, bottom: 0, height: `${normalizedValue * chartProgress * 100}%`, background: `linear-gradient(180deg, ${rgba(accent, 0.62)}, ${rgba(secondary, 0.76)})`, borderRadius: "44% 52% 0 0", transform: `translateX(${Math.sin(frame / 8) * 5}px) rotate(${Math.sin(frame / 12) * 2}deg)`, boxShadow: `0 -8px 22px ${rgba(accent, 0.34)}` }} />
                  <b style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 32, textShadow: "0 2px 12px #000" }}>{props.value}</b>
                </div>
                <div><b style={{ fontSize: 29 }}>{props.subtitle}</b><div style={{ ...mutedStyle, marginTop: 10 }}>LEVEL STABLE · AUTO</div></div>
              </div>
            ) : spec.id === "RadialTicks" ? (
              <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 34 }}>
                <div style={{ position: "relative", width: 154, height: 154, borderRadius: "50%", background: `repeating-conic-gradient(from -90deg, ${accent} 0deg 3deg, transparent 3deg 9deg)`, filter: `drop-shadow(0 0 14px ${rgba(accent, 0.46)})`, transform: `rotate(${frame * 0.18}deg)` }}>
                  <div style={{ position: "absolute", inset: 23, borderRadius: "50%", background: rgba("#06101b", backgroundOpacity), border: "none" }} />
                  <b style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 30, transform: `rotate(${-frame * 0.18}deg)` }}>{props.value}</b>
                </div>
                <div><div style={{ color: accent, fontSize: 17, letterSpacing: 3 }}>HUD ANALYTICS</div><div style={{ ...mutedStyle, marginTop: 10 }}>{props.subtitle}</div></div>
              </div>
            ) : spec.id === "SpeedGauge" || spec.id === "ProgressRing" ? (
              <div style={{ position: "relative", width: 150, height: 150 }}>
                <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="60" cy="60" r="48" fill="none" stroke={rgba(accent, 0.12)} strokeWidth="9" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke={accent}
                    strokeLinecap="round"
                    strokeWidth="9"
                    strokeDasharray={`${302 * ring * chartProgress} 302`}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 28, fontWeight: 820 }}>{props.value}</div>
              </div>
            ) : spec.id === "StatGrid" ? (
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[props.value, ...items].slice(0, 4).map((item, index) => (
                  <div key={`${item}-${index}`} style={{ padding: "14px 16px", borderRadius: 16, background: rgba(index % 2 ? secondary : accent, 0.11), border: `1px solid ${rgba(index % 2 ? secondary : accent, 0.24)}`, fontSize: 18, fontWeight: 720 }}>{item}</div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: spec.id === "CounterTicker" ? 76 : 92, fontWeight: 850, letterSpacing: -5, color: "#fff", textShadow: `0 0 38px ${rgba(accent, 0.38)}` }}>{props.value}</div>
            )}
            {!["MetricBar", "SegmentedMeter", "DualMetricBar", "FlipCounter", "WaveformMetric", "LiquidGauge", "RadialTicks", "PulseMetric"].includes(spec.id) ? (
              <div style={{ ...mutedStyle, paddingBottom: 12 }}>{props.subtitle}</div>
            ) : null}
          </div>
          <div style={{ height: 4, borderRadius: 4, background: rgba(accent, 0.12) }}>
            <div style={{ height: "100%", width: `${Math.max(8, chartProgress * 100)}%`, background: `linear-gradient(90deg, ${accent}, ${secondary})`, boxShadow: `0 0 20px ${rgba(accent, 0.7)}` }} />
          </div>
        </div>
      </div>
    );
  }

  if (spec.category === "chart") {
    const lineValues =
      spec.id === "AreaTrend"
        ? [0.18, 0.3, 0.26, 0.48, 0.42, 0.7, 0.82]
        : [0.22, 0.36, 0.3, 0.58, 0.5, 0.74, 0.9];
    return (
      <div data-studio-builtin={spec.id} style={rootStyle}>
        <div style={panelStyle} />
        <div style={{ position: "absolute", inset: 34 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div><div style={eyebrowStyle}>{props.subtitle || "DATA VIEW"}</div><h3 style={{ ...titleStyle, marginTop: 8 }}>{props.title}</h3></div>
            <div style={{ fontSize: 34, color: accent, fontWeight: 820 }}>{props.value}</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 4, height: 190 }}>
            {spec.id === "DonutShare" ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 56, height: "100%" }}>
                <div style={{ width: 150, height: 150, borderRadius: "50%", background: `conic-gradient(${accent} 0 72%, ${rgba(accent, 0.12)} 72% 100%)`, display: "grid", placeItems: "center" }}>
                  <div style={{ width: 102, height: 102, borderRadius: "50%", background: rgba("#06101b", backgroundOpacity), display: "grid", placeItems: "center", fontSize: 30, fontWeight: 820 }}>{props.value}</div>
                </div>
                <div style={{ display: "grid", gap: 12 }}>{items.slice(0, 2).map((item, index) => <div key={item} style={chipStyle}><span style={{ color: index ? secondary : accent }}>●</span> {item}</div>)}</div>
              </div>
            ) : spec.id === "CompareSplit" || spec.id === "BeforeAfter" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", height: "100%", alignItems: "center", gap: 20 }}>
                <div style={{ height: 135, borderRadius: 18, background: rgba(secondary, 0.13), border: `1px solid ${rgba(secondary, 0.35)}`, display: "grid", placeItems: "center", fontSize: 24, fontWeight: 750 }}>{props.item1}</div>
                <div style={{ color: accent, fontWeight: 900, fontSize: 18 }}>VS</div>
                <div style={{ height: 135, borderRadius: 18, background: rgba(accent, 0.13), border: `1px solid ${rgba(accent, 0.42)}`, display: "grid", placeItems: "center", fontSize: 24, fontWeight: 750 }}>{props.item2}</div>
              </div>
            ) : spec.id === "Leaderboard" ? (
              <div style={{ display: "grid", gap: 10, paddingTop: 12 }}>{items.map((item, index) => <div key={item} style={{ padding: "13px 18px", borderRadius: 14, background: rgba(index === 0 ? accent : secondary, index === 0 ? 0.17 : 0.08), border: `1px solid ${rgba(index === 0 ? accent : secondary, 0.25)}`, transform: `translateX(${(1 - chartProgress) * (index + 1) * 18}px)` }}>{item}</div>)}</div>
            ) : spec.id === "RadarProfile" || spec.id === "MatrixQuadrant" ? (
              <svg viewBox="0 0 560 190" style={{ width: "100%", height: "100%" }}>
                {[1, 2, 3].map((level) => <polygon key={level} points="280,10 430,95 280,180 130,95" fill="none" stroke={rgba(accent, 0.12 + level * 0.05)} transform={`translate(${280 * (1 - level / 3)} ${95 * (1 - level / 3)}) scale(${level / 3})`} />)}
                <line x1="280" y1="10" x2="280" y2="180" stroke={rgba(accent, 0.25)} />
                <line x1="130" y1="95" x2="430" y2="95" stroke={rgba(accent, 0.25)} />
                <polygon points="280,26 398,92 300,164 165,102" fill={rgba(accent, 0.16)} stroke={accent} strokeWidth="3" style={{ transform: `scale(${chartProgress})`, transformOrigin: "280px 95px" }} />
              </svg>
            ) : spec.id === "BarChart" ? (
              <div style={{ height: "100%", display: "flex", alignItems: "end", justifyContent: "space-around", gap: 28, padding: "14px 40px 0" }}>
                {[0.52, 0.78, 0.94].map((height, index) => <div key={height} style={{ width: 74, height: `${height * chartProgress * 100}%`, minHeight: 8, borderRadius: "10px 10px 3px 3px", background: `linear-gradient(180deg, ${index === 1 ? secondary : accent}, ${rgba(index === 1 ? secondary : accent, 0.24)})`, boxShadow: `0 0 26px ${rgba(index === 1 ? secondary : accent, 0.22)}` }} />)}
              </div>
            ) : (
              <svg viewBox="0 0 560 190" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                <defs><linearGradient id={`area-${spec.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity=".35" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient></defs>
                {spec.id === "AreaTrend" ? <polygon points={`0,190 ${points(lineValues.map((value) => value * chartProgress), 560, 180)} 560,190`} fill={`url(#area-${spec.id})`} /> : null}
                <polyline points={points(lineValues.map((value) => value * chartProgress), 560, 180)} fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (spec.category === "text") {
    const isLowerThird = spec.id === "LowerThird" || spec.id === "ChapterMarker";
    return (
      <div data-studio-builtin={spec.id} style={rootStyle}>
        <div style={{ ...panelStyle, borderRadius: isLowerThird ? 18 : 28 }} />
        <div style={{ position: "absolute", inset: isLowerThird ? "28px 34px" : 38, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={eyebrowStyle}>{props.subtitle}</div>
          <div style={{ width: 84 * chartProgress, height: 4, margin: "15px 0 18px", background: `linear-gradient(90deg, ${accent}, ${secondary})`, boxShadow: `0 0 18px ${rgba(accent, 0.65)}` }} />
          <h2 style={{ ...titleStyle, fontSize: spec.id === "KeywordBurst" ? 58 : spec.id === "QuoteLockup" ? 44 : 40 }}>
            {spec.id === "QuestionCard" ? "Q. " : spec.id === "QuoteLockup" ? "“" : ""}
            {props.title}
            {spec.id === "QuoteLockup" ? "”" : ""}
          </h2>
          {spec.id === "BulletStack" ? (
            <div style={{ display: "grid", gap: 9, marginTop: 18 }}>{items.map((item, index) => <div key={item} style={{ display: "flex", gap: 12, alignItems: "center", opacity: interpolate(frame, [index * 7, index * 7 + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}><b style={{ color: accent }}>0{index + 1}</b><span>{item}</span></div>)}</div>
          ) : spec.id === "CaptionHighlight" ? (
            <div style={{ marginTop: 16, color: accent, fontWeight: 800, fontSize: 22 }}>{props.value}</div>
          ) : spec.id === "DefinitionCard" ? (
            <p style={{ ...mutedStyle, fontSize: 20, lineHeight: 1.55, maxWidth: "88%", marginBottom: 0 }}>{props.subtitle}</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (spec.category === "media") {
    return (
      <div data-studio-builtin={spec.id} style={rootStyle}>
        <div style={panelStyle} />
        <div style={{ position: "absolute", inset: 22, display: "grid", gridTemplateRows: "1fr auto", gap: 16 }}>
          <div style={{ position: "relative", borderRadius: spec.id === "DeviceMockup" ? 34 : 18, border: `1px solid ${rgba(accent, 0.42)}`, overflow: "hidden", background: `radial-gradient(circle at 70% 25%, ${rgba(accent, 0.28)}, transparent 30%), linear-gradient(135deg, ${rgba(secondary, 0.2)}, ${rgba("#07111d", 0.92)})` }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${rgba(accent, 0.08)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(accent, 0.08)} 1px, transparent 1px)`, backgroundSize: "34px 34px" }} />
            {spec.id === "GalleryStrip" ? (
              <div style={{ position: "absolute", inset: 24, display: "grid", gridTemplateColumns: "1fr 1.25fr 1fr", gap: 12 }}>{[secondary, accent, secondary].map((color, index) => <div key={`${color}-${index}`} style={{ borderRadius: 14, background: `linear-gradient(145deg, ${rgba(color, 0.38)}, ${rgba("#04070d", 0.62)})`, transform: `translateY(${index === 1 ? -6 : 8}px)` }} />)}</div>
            ) : spec.id === "MagnifierCallout" ? (
              <div style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", border: `3px solid ${accent}`, left: "48%", top: "10%", display: "grid", placeItems: "center", fontSize: 30, fontWeight: 850, boxShadow: `0 0 34px ${rgba(accent, 0.34)}` }}>{props.value}</div>
            ) : spec.id === "EvidenceCard" ? (
              <div style={{ position: "absolute", inset: 26, padding: 22, borderRadius: 12, background: "rgba(245,248,252,.94)", color: "#101827" }}><b style={{ fontSize: 22 }}>{props.title}</b><div style={{ height: 5, width: "62%", background: accent, margin: "18px 0" }} /><p style={{ fontSize: 18, lineHeight: 1.45 }}>{props.item1}</p></div>
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: accent, fontWeight: 850, fontSize: 26, letterSpacing: 4 }}>{spec.glyph}</div>
            )}
            <div style={{ position: "absolute", top: `${(frame * 3) % 100}%`, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.72 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: 22 }}>{props.title}</b>
            <span style={eyebrowStyle}>{props.subtitle}</span>
          </div>
        </div>
      </div>
    );
  }

  if (spec.category === "structure") {
    const isFunnel = spec.id === "FunnelChart";
    return (
      <div data-studio-builtin={spec.id} style={rootStyle}>
        <div style={panelStyle} />
        <div style={{ position: "absolute", inset: 34 }}>
          <div style={eyebrowStyle}>LOGIC SYSTEM</div>
          <h3 style={{ ...titleStyle, marginTop: 8 }}>{props.title}</h3>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, height: 175, display: "flex", flexDirection: isFunnel ? "column" : "row", justifyContent: "center", alignItems: "center", gap: isFunnel ? 8 : 16 }}>
            {items.map((item, index) => (
              <React.Fragment key={item}>
                <div style={{ width: isFunnel ? `${88 - index * 20}%` : "30%", height: isFunnel ? 46 : 112, borderRadius: 16, border: `1px solid ${rgba(index === 1 ? secondary : accent, 0.4)}`, background: rgba(index === 1 ? secondary : accent, 0.12), display: "grid", placeItems: "center", textAlign: "center", fontSize: 18, fontWeight: 720, transform: `scale(${interpolate(frame, [index * 6, index * 6 + 14], [0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})` }}>{spec.id === "Checklist" ? "✓  " : ""}{item}</div>
                {!isFunnel && index < items.length - 1 ? <div style={{ color: accent, fontSize: 24 }}>→</div> : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (spec.category === "tech") {
    const codeLike = spec.id === "TerminalWindow" || spec.id === "CodeSnippet";
    return (
      <div data-studio-builtin={spec.id} style={rootStyle}>
        <div style={{ ...panelStyle, borderRadius: 20 }} />
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ height: 54, display: "flex", alignItems: "center", gap: 9, padding: "0 22px", borderBottom: `1px solid ${rgba(accent, 0.18)}` }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((color) => <i key={color} style={{ width: 11, height: 11, borderRadius: "50%", background: color }} />)}
            <b style={{ marginLeft: 12, color: "rgba(238,248,255,.72)", fontSize: 16 }}>{props.title}</b>
          </div>
          <div style={{ padding: 28 }}>
            {codeLike ? (
              <div style={{ fontFamily: '"SFMono-Regular", Consolas, monospace', display: "grid", gap: 15, fontSize: 18 }}>
                {items.map((item, index) => <div key={item} style={{ color: index === 0 ? accent : index === 1 ? "#c4a7ff" : "#8ef0b0" }}><span style={{ color: "rgba(255,255,255,.28)", marginRight: 18 }}>{String(index + 1).padStart(2, "0")}</span>{item}<span style={{ opacity: index === items.length - 1 ? pulse : 0 }}>▋</span></div>)}
              </div>
            ) : spec.id === "AIAgentFlow" ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 190 }}>{items.map((item, index) => <React.Fragment key={item}><div style={{ width: 150, height: 104, borderRadius: 20, background: rgba(index === 1 ? secondary : accent, 0.13), border: `1px solid ${rgba(index === 1 ? secondary : accent, 0.38)}`, display: "grid", placeItems: "center", fontWeight: 800 }}>{item}</div>{index < 2 ? <div style={{ color: accent }}>•••→</div> : null}</React.Fragment>)}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 18 }}>
                <div style={{ height: 190, borderRadius: 18, background: rgba(accent, 0.08), display: "grid", placeItems: "center" }}><b style={{ fontSize: 48, color: accent }}>{props.value}</b></div>
                <div style={{ display: "grid", gap: 10 }}>{items.map((item) => <div key={item} style={{ ...chipStyle, display: "flex", justifyContent: "space-between" }}><span>{item}</span><b style={{ color: "#7ef0a5" }}>●</b></div>)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (spec.category === "spatial") {
    return (
      <div data-studio-builtin={spec.id} style={rootStyle}>
        <div style={panelStyle} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${rgba(accent, 0.09)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(accent, 0.09)} 1px, transparent 1px)`, backgroundSize: "34px 34px" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 180 + pulse * 12, height: 180 + pulse * 12, transform: "translate(-50%, -50%)", border: `2px solid ${accent}`, borderRadius: spec.id === "FocusReticle" || spec.id === "SafeAreaGuide" ? 22 : "50%", boxShadow: `0 0 34px ${rgba(accent, 0.28)}` }}>
          <div style={{ position: "absolute", inset: 20, border: `1px dashed ${rgba(secondary, 0.62)}`, borderRadius: "inherit" }} />
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}><b style={{ fontSize: 24 }}>{spec.glyph}</b></div>
        </div>
        <div style={{ position: "absolute", left: 28, top: 24 }}><div style={eyebrowStyle}>{props.title}</div><div style={{ ...mutedStyle, marginTop: 8 }}>{props.subtitle}</div></div>
        <div style={{ position: "absolute", right: 24, bottom: 22, fontSize: 24, fontWeight: 850, color: accent }}>{props.value}</div>
      </div>
    );
  }

  const isFullFrame =
    spec.id === "WipeTransition" ||
    spec.id === "MaskReveal" ||
    spec.id === "ParticleField" ||
    spec.id === "ScanTransition";
  return (
    <div data-studio-builtin={spec.id} style={rootStyle}>
      <div style={{ ...panelStyle, borderRadius: isFullFrame ? 0 : 28 }} />
      {spec.id === "ParticleField" ? (
        <div style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 28 }, (_, index) => (
            <i key={index} style={{ position: "absolute", left: `${(index * 37) % 100}%`, top: `${(index * 61) % 100}%`, width: 3 + (index % 3), height: 3 + (index % 3), borderRadius: "50%", background: index % 2 ? accent : secondary, boxShadow: `0 0 12px ${index % 2 ? accent : secondary}`, transform: `translateY(${Math.sin((frame + index * 7) / 12) * 12}px)` }} />
          ))}
        </div>
      ) : null}
      {spec.id === "ScanTransition" ? <div style={{ position: "absolute", left: 0, right: 0, top: `${(frame * 2.4) % 100}%`, height: 5, background: accent, boxShadow: `0 0 42px 12px ${rgba(accent, 0.46)}` }} /> : null}
      {spec.id === "WipeTransition" ? <div style={{ position: "absolute", inset: 0, width: `${chartProgress * 100}%`, background: `linear-gradient(90deg, ${secondary}, ${accent})`, opacity: 0.3 }} /> : null}
      <div style={{ position: "absolute", inset: 36, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ ...eyebrowStyle, marginBottom: 18 }}>{props.subtitle}</div>
          <h2 style={{ ...titleStyle, fontSize: spec.id === "LogoReveal" ? 58 : 46 }}>{props.title}</h2>
          <div style={{ width: 140 * chartProgress, height: 4, margin: "24px auto 0", background: `linear-gradient(90deg, ${secondary}, ${accent})`, boxShadow: `0 0 22px ${rgba(accent, 0.6)}` }} />
        </div>
      </div>
    </div>
  );
};

const CATEGORY_LAYOUT: Record<
  string,
  {
    bounds: { x: number; y: number; width: number; height: number };
    position: { x: number; y: number; scale: number };
  }
> = {
  metric: {
    bounds: { x: 0, y: 0, width: 520, height: 300 },
    position: { x: 110, y: 110, scale: 1 },
  },
  navigation: {
    bounds: { x: 0, y: 0, width: 1920, height: 72 },
    position: { x: 0, y: 0, scale: 1 },
  },
  chart: {
    bounds: { x: 0, y: 0, width: 640, height: 360 },
    position: { x: 110, y: 610, scale: 1 },
  },
  text: {
    bounds: { x: 0, y: 0, width: 760, height: 260 },
    position: { x: 100, y: 120, scale: 1 },
  },
  media: {
    bounds: { x: 0, y: 0, width: 640, height: 390 },
    position: { x: 1160, y: 100, scale: 1 },
  },
  structure: {
    bounds: { x: 0, y: 0, width: 760, height: 380 },
    position: { x: 100, y: 560, scale: 1 },
  },
  tech: {
    bounds: { x: 0, y: 0, width: 700, height: 380 },
    position: { x: 1110, y: 560, scale: 1 },
  },
  spatial: {
    bounds: { x: 0, y: 0, width: 560, height: 360 },
    position: { x: 680, y: 330, scale: 1 },
  },
  brand: {
    bounds: { x: 0, y: 0, width: 760, height: 300 },
    position: { x: 580, y: 390, scale: 1 },
  },
};

const defaultPropsFor = (spec: BuiltInSpec): Record<string, unknown> => ({
  componentType: spec.id,
  enabled: true,
  title: spec.name,
  subtitle: "MOTION COMPONENT",
  value: "87%",
  item1: "关键节点一",
  item2: "关键节点二",
  item3: "关键节点三",
  accentColor: "#68e8ff",
  secondaryColor: "#9478ff",
  ...(spec.defaults ?? {}),
});

export const BUILT_IN_DEFINITIONS: MotionComponentDefinition[] = ALL_SPECS.map(
  (spec) => ({
    id: spec.id,
    name: spec.name,
    description: `${spec.description} · 工作台内置基础模板`,
    category: spec.category,
    glyph: spec.glyph,
    component: BuiltInCatalogComponent,
    durationInFrames:
      spec.id === "ChapterBar" ? 18000 : spec.category === "brand" ? 90 : 120,
    bounds: CATEGORY_LAYOUT[spec.category].bounds,
    defaultPosition: CATEGORY_LAYOUT[spec.category].position,
    defaultProps: defaultPropsFor(spec),
    propsSchema:
      spec.id === "ChapterBar"
        ? {
            enabled: { type: "boolean", label: "显示章节进度条" },
            title: { type: "text", label: "章节一" },
            subtitle: { type: "text", label: "章节二" },
            value: { type: "text", label: "章节三" },
            item1: { type: "text", label: "章节四" },
            item2: { type: "text", label: "章节五" },
            item3: { type: "text", label: "章节六" },
            accentColor: { type: "color", label: "进度颜色" },
            secondaryColor: { type: "color", label: "渐变颜色" },
          }
        : {
            title: { type: "text", label: "主标题" },
            subtitle: { type: "text", label: "副标题" },
            value: { type: "text", label: "核心数值" },
            item1: { type: "text", label: "内容一" },
            item2: { type: "text", label: "内容二" },
            item3: { type: "text", label: "内容三" },
            accentColor: { type: "color", label: "强调色" },
            secondaryColor: { type: "color", label: "辅助色" },
          },
  }),
);

export const isBuiltInDefinition = (
  definition: MotionComponentDefinition,
) => definition.component === BuiltInCatalogComponent;

export const mergeWithBuiltInDefinitions = (
  importedDefinitions: MotionComponentDefinition[],
) => {
  const overriddenPrimaryIds = new Set(
    importedDefinitions
      .map((definition) => CATALOG_PRIMARY_BY_ID.get(definition.id))
      .filter((id): id is string => Boolean(id)),
  );
  return [
    ...importedDefinitions,
    ...BUILT_IN_DEFINITIONS.filter(
      (definition) => !overriddenPrimaryIds.has(definition.id),
    ),
  ];
};
