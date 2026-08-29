# 组件目录（自动生成）

> 由 `npm.cmd run sync:registry` 从运行时 `registry.ts` 生成。
> 不要手改本文件；新增、删除或修改组件后重新运行同步命令。

工作台当前实际注册 **29** 个组件，其中 **6** 个已接入当前 AI manifest 编译器。
未标记为 AI 可编排的组件仍可在工作台中手动使用，后续应在组件经过确认并补齐编译支持后再开放给 AI。

## 空间与聚焦

- `GlobalExpedition`：环球征途地图 — 正交投影地球沿大圆航线环球飞行，途经节点停靠点亮，金色航迹＋HUD 任务面板（透明背景）（仅工作台可用；props：`enabled`、`title`、`subtitle`、`animationSeconds`、`accentColor`、`linkColor`、`showHud`）

## 字幕与台词

- `SrtSemanticCaptions`：SRT字幕语义动画 — 读取导入的真实 SRT 时间戳逐句显示，可选调用固定图标库并支持语义配色与关键词扫线（仅工作台可用；props：`enabled`、`showIcon`、`fontSize`、`accentMode`、`accentColor`、`timeOffset`、`cuesJson`）
- `SrtCueText`：主字幕·关键词条 — GSAP 风格底部主字幕：逐句滑入，语义关键词过冲弹入＋琥珀辉光脉冲，可开逐字扫色（仅工作台可用；props：`enabled`、`fontSize`、`baseColor`、`dimColor`、`accentMode`、`accentColor`、`sweep`、`showTagChip`、`timeOffset`、`cuesJson`）

## 终端教学 HUD

- `TerminalPanel`：终端教学面板 — 带命令行、步骤清单和终端状态的讲解主面板。（仅工作台可用；props：`enabled`、`title`、`subtitle`、`command`、`item1`、`item2`、`item3`、`accentColor`、`animationSeconds`）

## 柔和教学紫

- `SoftTeachingGlassPanel`：柔和教学玻璃面板 — 人物口播上方的半透明信息面板，适合标题、英文标签和三项解释。（仅工作台可用；props：`enabled`、`title`、`subtitle`、`item1`、`item2`、`item3`、`accentColor`、`animationSeconds`）

## 竖屏口播信息层

- `PortraitChapterRail`：竖屏口播·章节条 — 参考竖屏口播视频提炼的左上章节标签：强调竖线、蓝色标题和白色说明分层滑入。（仅工作台可用；props：`enabled`、`title`、`subtitle`、`accentColor`、`textColor`、`animationSeconds`）
- `PortraitInfoCallout`：竖屏口播·图标信息卡 — 参考竖屏口播视频右上信息层：引导词和标题先滑入，图标玻璃卡随后弹出。（仅工作台可用；props：`enabled`、`eyebrow`、`title`、`detail`、`note`、`iconText`、`accentColor`、`panelColor`、`textColor`、`animationSeconds`）
- `PortraitMetricDecision`：竖屏口播·数据决策卡 — 参考竖屏口播视频的 1K / 2K 决策段：突出核心数字、单位与推荐结论。（仅工作台可用；props：`enabled`、`lead`、`conclusion`、`metricLabel`、`value`、`unit`、`verdict`、`accentColor`、`panelColor`、`textColor`、`animationSeconds`）
- `PortraitDecisionTagStack`：竖屏口播·优缺点标签组 — 从数据决策卡拆出的独立三标签组件，三张玻璃卡严格同宽对齐并依次滑入。（仅工作台可用；props：`enabled`、`tag1`、`tag2`、`tag3`、`symbol1`、`symbol2`、`symbol3`、`accentColor`、`panelColor`、`textColor`、`animationSeconds`）
- `PortraitStepChecklist`：竖屏口播·步骤清单卡 — 参考竖屏口播视频的后期增强段：顶部给出阶段结论，右侧三张编号步骤卡依次滑入。（仅工作台可用；props：`enabled`、`eyebrow`、`title`、`subtitle`、`step1`、`step2`、`step3`、`icon1`、`icon2`、`icon3`、`accentColor`、`successColor`、`panelColor`、`textColor`、`animationSeconds`）
- `PortraitRiskWarning`：竖屏口播·风险提醒卡 — 参考竖屏口播的使用边界段：红色结论标题配合三条等宽风险提醒，依次滑入强调限制条件。（仅工作台可用；props：`enabled`、`eyebrow`、`title`、`emphasis`、`risk1`、`risk2`、`risk3`、`icon1`、`icon2`、`icon3`、`accentColor`、`panelColor`、`textColor`、`animationSeconds`）
- `PortraitNextEpisodeCta`：竖屏口播·下集预告卡 — 参考竖屏口播结尾：右上展示下期主题、醒目关键词和关注按钮，适合预告下一集与引导关注。（仅工作台可用；props：`enabled`、`eyebrow`、`title`、`subtitle`、`cta`、`icon`、`accentColor`、`secondaryColor`、`panelColor`、`textColor`、`animationSeconds`）
- `QuickSetupProof`：快速上手证明条 — 橙色勾选徽标和粗白结论先落位，两枚限制条件标签错峰弹入后分别由细红线划过。（仅工作台可用；props：`enabled`、`title`、`kicker`、`tag1`、`tag2`、`checkmark`、`accentColor`、`warningColor`、`strikeColor`、`panelColor`、`textColor`、`animationSeconds`）

## 风险提醒

- `LegacyModelEliminationWarning`：旧方案淘汰警告 — 深色科技警告面板：标题先入场，红色删除线划过旧方案，最后盖下淘汰印章。（仅工作台可用；props：`enabled`、`kicker`、`title`、`subtitle`、`stampText`、`warningColor`、`accentColor`、`panelColor`、`textColor`、`animationSeconds`）

## 媒体展示组件

- `MediaSpotlightCard`：媒体聚焦卡 — 可上传图片或视频的展示卡片，带缩放滑入出场动画、字幕条和强调角标。（仅工作台可用；props：`enabled`、`mediaUrl`、`mediaType`、`caption`、`eyebrow`、`accentColor`、`panelColor`、`textColor`、`cornerRadius`、`fit`、`mediaPositionX`、`mediaPositionY`、`animationSeconds`）
- `MaterialCard`：素材卡 — 纯图片或视频素材卡，支持自由调整裁剪位置。（仅工作台可用；props：`enabled`、`mediaUrl`、`mediaType`、`panelColor`、`cornerRadius`、`fit`、`mediaPositionX`、`mediaPositionY`、`animationSeconds`）

## WorkBuddy效果

- `TitleReveal`：章节标题揭示 — 开场钩子：超大数字年份 + 副标题逐层揭示（仅工作台可用；props：`kicker`、`titleLead`、`titleNumber`、`titleTail`、`subtitle`、`footerTag`、`accentColor`、`subtitleStart`、`exitSeconds`）
- `LineTrend`：折线趋势 — 风险预警：逐年下滑折线 + 跌幅徽章（仅工作台可用；props：`title`、`subtitle`、`points`、`xLabels`、`deltaLabel`、`note`、`accentColor`、`noteStart`、`exitSeconds`）
- `StepFlow`：步骤流 — OMO 路径：线上引流 → 线下成交 双节点动画（仅工作台可用；props：`title`、`subtitle`、`item1`、`item1Note`、`item2`、`item2Note`、`footer`、`itemStarts`、`accentColor`、`exitSeconds`）
- `CompareSplit`：左右对比卡 — 双引擎对比：短视频种草 × 直播转化（仅工作台可用；props：`title`、`subtitle`、`leftTitle`、`leftNote`、`leftTag`、`rightTitle`、`rightNote`、`rightTag`、`leftColor`、`rightColor`、`itemStarts`、`exitSeconds`）
- `BulletStack`：逐条要点 — 转型红利：勾选动画逐条弹出（仅工作台可用；props：`title`、`subtitle`、`item1`、`item1Note`、`item2`、`item2Note`、`itemStarts`、`accentColor`、`exitSeconds`）
- `BarChart`：柱状图 — 业绩突破：柱体增长冲破瓶颈虚线（仅工作台可用；props：`title`、`subtitle`、`bars`、`ceiling`、`ceilingLabel`、`xLabels`、`badgeText`、`unit`、`accentColor`、`badgeStart`、`exitSeconds`）
- `EndLockup`：结尾锁定 — 行动收尾：¥100万 数字滚动 + 行动号召（仅工作台可用；props：`kicker`、`amountPrefix`、`amount`、`amountUnit`、`amountNote`、`cta`、`accentColor`、`exitSeconds`）

## 数字与指标

- `Countdown`：倒计时 — 倒计时和阶段切换 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `SegmentedMeter`：分段能量条 — 分段式容量、性能和能量指示 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `DualMetricBar`：双向指标差异 — 双向指标差异和竞争关系 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `WaveformMetric`：波形指标 — 连续波形和实时吞吐读数 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `LiquidGauge`：液态仪表 — 液态填充式完成率仪表 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
- `RadialTicks`：HUD 刻度环 — 科技 HUD 刻度与中心读数 · 工作台内置模板（AI 可编排；props：`title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`animationSeconds`、`accentColor`、`secondaryColor`）
