# 组件目录（自动生成）

> 由 `npm.cmd run sync:registry` 从运行时 `registry.ts` 生成。
> 不要手改本文件；新增、删除或修改组件后重新运行同步命令。

工作台当前实际注册 **24** 个组件，其中 **8** 个已接入当前 AI manifest 编译器。
未标记为 AI 可编排的组件仍可在工作台中手动使用，后续应在组件经过确认并补齐编译支持后再开放给 AI。

## 空间与聚焦

- `GlobalExpedition`：环球征途地图 — 正交投影地球沿大圆航线环球飞行，途经节点停靠点亮，金色航迹＋HUD 任务面板（透明背景）（仅工作台可用；props：`enabled`、`title`、`subtitle`、`animationSeconds`、`accentColor`、`linkColor`、`showHud`）

## 字幕与台词

- `SrtSemanticCaptions`：SRT字幕语义动画 — 逐句驱动 SVG 字幕：语义词库匹配关键词配色与图标，卡拉OK扫线＋台词轨时间轴（仅工作台可用；props：`enabled`、`fontSize`、`accentMode`、`accentColor`、`showRail`、`timeOffset`、`cuesJson`）
- `SrtCueText`：主字幕·关键词条 — GSAP 风格底部主字幕：逐句滑入，语义关键词过冲弹入＋琥珀辉光脉冲，可开逐字扫色（仅工作台可用；props：`enabled`、`fontSize`、`baseColor`、`dimColor`、`accentMode`、`accentColor`、`sweep`、`showTagChip`、`timeOffset`、`cuesJson`）

## 流程与图表

- `FlowPipeline`：数据管线流程图 — 任务控制台风格四区数据流转图：节点高亮、虚线流动、数据包飞行并在 VSM 中枢完成协议转换，底部滚动日志（中文，自动循环）（仅工作台可用；props：`enabled`、`title`、`subtitle`、`loopSeconds`、`dliColor`、`propColor`、`showHeader`、`showConsole`）

## 终端教学 HUD

- `TerminalPanel`：终端教学面板 — 带命令行、步骤清单和终端状态的讲解主面板。（仅工作台可用；props：`enabled`、`title`、`subtitle`、`command`、`item1`、`item2`、`item3`、`accentColor`、`animationSeconds`）
- `TerminalStepHero`：终端步骤主视觉 — 大号步骤编号配合一句结论，适合终端教学的章节落点。（仅工作台可用；props：`enabled`、`step`、`title`、`subtitle`、`accentColor`、`secondaryColor`、`animationSeconds`）

## 柔和教学紫

- `SoftTeachingStepRail`：柔和教学流程条 — 紫色圆形步骤、连接线与三段教学标题，适合放在实拍人物画面的顶部左侧。（仅工作台可用；props：`enabled`、`item1`、`item2`、`item3`、`accentColor`、`animationSeconds`）
- `SoftTeachingGlassPanel`：柔和教学玻璃面板 — 人物口播上方的半透明信息面板，适合标题、英文标签和三项解释。（仅工作台可用；props：`enabled`、`title`、`subtitle`、`item1`、`item2`、`item3`、`accentColor`、`animationSeconds`）
- `SoftTeachingLibraryGrid`：柔和教学动效库卡槽 — 低对比紫色卡槽矩阵，可指定一格高亮，表达动效库或能力模块新增。（仅工作台可用；props：`enabled`、`title`、`subtitle`、`columns`、`highlightIndex`、`accentColor`、`animationSeconds`）
- `SoftTeachingIncrementBadge`：柔和教学 +1 反馈 — 卡槽高亮后出现的 +1 反馈徽章，用于新增、完成或收集动作。（仅工作台可用；props：`enabled`、`value`、`label`、`accentColor`、`animationSeconds`）

## 竖屏口播信息层

- `PortraitChapterRail`：竖屏口播·章节条 — 参考竖屏口播视频提炼的左上章节标签：强调竖线、蓝色标题和白色说明分层滑入。（仅工作台可用；props：`enabled`、`title`、`subtitle`、`accentColor`、`textColor`、`animationSeconds`）
- `PortraitKeywordBurst`：竖屏口播·开场大字 — 参考竖屏口播视频提炼的三段大字：从画面上方错位弹入，支持留空中间词以避开人物面部。（仅工作台可用；props：`enabled`、`word1`、`word2`、`word3`、`highlightIndex`、`accentColor`、`textColor`、`shadowColor`、`animationSeconds`）
- `PortraitInfoCallout`：竖屏口播·图标信息卡 — 参考竖屏口播视频右上信息层：引导词和标题先滑入，图标玻璃卡随后弹出。（仅工作台可用；props：`enabled`、`eyebrow`、`title`、`detail`、`note`、`iconText`、`accentColor`、`panelColor`、`textColor`、`animationSeconds`）
- `PortraitMetricDecision`：竖屏口播·数据决策卡 — 参考竖屏口播视频的 1K / 2K 决策段：突出核心数字、单位与推荐结论。（仅工作台可用；props：`enabled`、`lead`、`conclusion`、`metricLabel`、`value`、`unit`、`verdict`、`accentColor`、`panelColor`、`textColor`、`animationSeconds`）
- `PortraitDecisionTagStack`：竖屏口播·优缺点标签组 — 从数据决策卡拆出的独立三标签组件，三张玻璃卡严格同宽对齐并依次滑入。（仅工作台可用；props：`enabled`、`tag1`、`tag2`、`tag3`、`symbol1`、`symbol2`、`symbol3`、`accentColor`、`panelColor`、`textColor`、`animationSeconds`）
- `PortraitStepChecklist`：竖屏口播·步骤清单卡 — 参考竖屏口播视频的后期增强段：顶部给出阶段结论，右侧三张编号步骤卡依次滑入。（仅工作台可用；props：`enabled`、`eyebrow`、`title`、`subtitle`、`step1`、`step2`、`step3`、`icon1`、`icon2`、`icon3`、`accentColor`、`successColor`、`panelColor`、`textColor`、`animationSeconds`）

## 数字与指标

- `ProgressRing`：环形进度 — 环形完成率和阶段反馈 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `Countdown`：倒计时 — 倒计时和阶段切换 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `SegmentedMeter`：分段能量条 — 分段式容量、性能和能量指示 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `DualMetricBar`：双向指标差异 — 双向指标差异和竞争关系 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `FlipCounter`：翻牌数字 — 机械翻牌式核心数字 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `WaveformMetric`：波形指标 — 连续波形和实时吞吐读数 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `LiquidGauge`：液态仪表 — 液态填充式完成率仪表 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `RadialTicks`：HUD 刻度环 — 科技 HUD 刻度与中心读数 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
