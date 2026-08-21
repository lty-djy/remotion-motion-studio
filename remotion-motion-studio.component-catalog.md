# 组件目录

按视频信息结构选择组件，不必让一个视频包含全部类型。默认选择 4–10 个，覆盖至少三类，同一画面同时出现的主要组件不超过 3 个。

工作台当前提供 69 种标准类型。生成已知类型时必须使用下列大小写完全一致的 ID，导入后 AI 版本会覆盖同 ID 的内置模板。

## 数字与指标

- `MetricFocus`：核心数字动效
- `SpeedGauge`：码表、速度、完成率
- `CounterTicker`：滚动计数器
- `StatGrid`：多指标矩阵
- `ProgressRing`：环形进度
- `DeltaBadge`：环比、同比、涨跌
- `Countdown`：倒计时与阶段切换
- `MetricBar`：紧凑型条形指标和目标刻度
- `SegmentedMeter`：分段式容量、性能与能量指示
- `DualMetricBar`：双向指标差异与方案对比
- `FlipCounter`：机械翻牌式核心数字
- `WaveformMetric`：连续波形与实时吞吐
- `LiquidGauge`：液态填充式完成率
- `RadialTicks`：科技 HUD 刻度环
- `PulseMetric`：心电式实时状态脉冲

需要生成这些扩展指标时，读取 [metric-components.md](metric-components.md) 获取推荐参数、尺寸和视觉约束。

## 图表与比较

- `CompareSplit`：左右对比卡
- `BarChart`：横向或纵向柱状图
- `LineTrend`：折线趋势
- `AreaTrend`：面积趋势
- `DonutShare`：占比环图
- `RadarProfile`：能力雷达
- `Leaderboard`：排行与名次变化
- `BeforeAfter`：前后效果对照
- `MatrixQuadrant`：二维象限

## 文字与叙事

- `TitleReveal`：章节标题揭示
- `LowerThird`：人物或术语下三分之一
- `QuoteLockup`：金句定格卡
- `KeywordBurst`：关键词爆发
- `BulletStack`：逐条要点
- `CaptionHighlight`：字幕关键词高亮
- `DefinitionCard`：概念定义
- `QuestionCard`：问题抛出
- `ChapterMarker`：章节编号与进度

## 图片、视频与证据

- `ImageFrame`：图片框与注释
- `EvidenceCard`：截图、论文、官网证据
- `DeviceMockup`：手机或电脑设备框
- `GalleryStrip`：多图胶片带
- `MagnifierCallout`：局部放大标注
- `SourceCitation`：信源脚注卡
- `VideoInset`：画中画视频框

## 结构、流程与解释

- `StepFlow`：步骤流
- `TimelineRail`：事件时间线
- `ArchitectureMap`：系统架构关系
- `FunnelChart`：漏斗过程
- `DecisionTree`：判断分支
- `CauseEffect`：因果链
- `Roadmap`：阶段路线图
- `Checklist`：检查清单

## UI 与科技界面

- `TerminalWindow`：终端命令演示
- `CodeSnippet`：代码片段聚焦
- `DashboardPanel`：仪表盘面板
- `StatusMonitor`：系统状态监控
- `NotificationToast`：通知浮层
- `SearchBarDemo`：搜索交互演示
- `AIAgentFlow`：AI Agent 调用链
- `DataPacket`：数据流与节点传输

## 空间与聚焦

- `MapPin`：地图点位与路线
- `OrbitDiagram`：轨道关系
- `CoordinateGrid`：科技坐标网格
- `SafeAreaGuide`：安全区提示
- `FocusReticle`：目标框与扫描锁定

## 品牌、装饰与转场

- `LogoReveal`：品牌标识揭示
- `GlassPanel`：玻璃质感信息卡
- `NeonDivider`：霓虹章节分隔
- `WipeTransition`：方向擦除转场
- `MaskReveal`：遮罩揭示
- `ParticleField`：粒子背景
- `ScanTransition`：扫描线转场
- `EndLockup`：结尾锁定与行动提示

## 常用组合

- 新闻解读：`TitleReveal` + `EvidenceCard` + `MetricFocus` + `SourceCitation`
- 产品发布：`LogoReveal` + `DeviceMockup` + `StatGrid` + `CompareSplit`
- 数据复盘：`MetricFocus` + `LineTrend` + `Leaderboard` + `QuoteLockup`
- 性能发布：`MetricBar` + `SegmentedMeter` + `RadialTicks` + `PulseMetric`
- 实时监控：`FlipCounter` + `WaveformMetric` + `LiquidGauge` + `StatusMonitor`
- 教程说明：`ChapterMarker` + `StepFlow` + `CodeSnippet` + `Checklist`
- AI 技术：`AIAgentFlow` + `ArchitectureMap` + `TerminalWindow` + `StatusMonitor`
- 人物口播：`LowerThird` + `KeywordBurst` + `ImageFrame` + `QuoteLockup`
