# 组件语义能力审核表（自动生成）

> 由 `npm.cmd run sync:registry` 从真实效果注册表生成，请勿手改。
> 普通分组继续用于人工浏览；主要和次要语义用于 AI 候选排序，不代表审核状态，也不限制组件只能用于单一语义。

当前覆盖 **29** 个注册组件。

## 核心语义

- **重点强调**（`emphasis`）：强化一句话中的核心结论、关键词或重要信息。
- **数字展示**（`metric`）：呈现数值、比例、金额、进度或量化结果。
- **对比差异**（`comparison`）：表达两个或多个方案、阶段、指标之间的差异。
- **列举要点**（`list`）：承载并列观点、标签、条件或清单。
- **流程说明**（`process`）：表达步骤、路径、阶段或先后关系。
- **概念解释**（`explanation`）：补充定义、方法、工具、原理或背景说明。
- **风险提醒**（`warning`）：提示限制、错误、下降、淘汰或需要规避的问题。
- **案例与素材**（`evidence`）：展示图片、视频、案例、证明或可视化证据。
- **章节转场**（`transition`）：建立开场、章节切换、阶段推进或收束。
- **行动引导**（`call-to-action`）：引导关注、收藏、继续观看或采取下一步行动。

## 空间与聚焦

- **环球征途地图**（`GlobalExpedition`）
  - 主要：案例与素材
  - 次要：流程说明、章节转场、概念解释
  - 内容：spatial、process、short-text
  - 方向：any；密度：heavy；建议时长：6–60 秒
  - 检索词：地图、路线、地点、全球、跨区域、行程

## 字幕与台词

- **SRT字幕语义动画**（`SrtSemanticCaptions`）
  - 主要：系统角色：caption-track
  - 次要：重点强调
  - 内容：caption、long-text
  - 方向：portrait；密度：light；建议时长：0.5–20 秒
  - 检索词：字幕、逐字、关键词高亮、语义字幕
- **主字幕·关键词条**（`SrtCueText`）
  - 主要：系统角色：caption-track
  - 次要：无
  - 内容：caption、long-text
  - 方向：any；密度：light；建议时长：0.5–20 秒
  - 检索词：字幕、台词、原文、时间定位

## 终端教学 HUD

- **终端教学面板**（`TerminalPanel`）
  - 主要：流程说明
  - 次要：概念解释、列举要点、案例与素材
  - 内容：process、list、long-text
  - 方向：any；密度：heavy；建议时长：3–12 秒
  - 检索词：代码、终端、命令、步骤、开发、工具

## 柔和教学紫

- **柔和教学玻璃面板**（`SoftTeachingGlassPanel`）
  - 主要：概念解释
  - 次要：列举要点、重点强调
  - 内容：list、long-text
  - 方向：any；密度：medium；建议时长：3–10 秒
  - 检索词：教学、解释、知识点、方法、说明

## 竖屏口播信息层

- **竖屏口播·章节条**（`PortraitChapterRail`）
  - 主要：章节转场
  - 次要：重点强调、流程说明
  - 内容：short-text、process
  - 方向：portrait；密度：light；建议时长：1.2–5 秒
  - 检索词：章节、下一步、接下来、阶段、开场
- **竖屏口播·图标信息卡**（`PortraitInfoCallout`）
  - 主要：概念解释
  - 次要：重点强调、案例与素材、流程说明、章节转场、风险提醒、行动引导
  - 内容：short-text、long-text
  - 方向：portrait；密度：medium；建议时长：1.5–7 秒
  - 检索词：说明、方法、工具、例如、提示、补充
- **竖屏口播·数据决策卡**（`PortraitMetricDecision`）
  - 主要：数字展示
  - 次要：对比差异、重点强调
  - 内容：metric、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：数字、比例、金额、增长、降低、结果
- **竖屏口播·优缺点标签组**（`PortraitDecisionTagStack`）
  - 主要：对比差异
  - 次要：列举要点、重点强调、数字展示
  - 内容：comparison、list、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：标签、优缺点、选择、判断、并列
- **竖屏口播·步骤清单卡**（`PortraitStepChecklist`）
  - 主要：流程说明
  - 次要：列举要点、概念解释
  - 内容：process、list、short-text
  - 方向：portrait；密度：heavy；建议时长：2.5–9 秒
  - 检索词：步骤、流程、首先、然后、最后
- **竖屏口播·多工具错峰列表**（`PortraitStaggeredToolList`）
  - 主要：列举要点
  - 次要：概念解释、重点强调、流程说明
  - 内容：list、short-text
  - 方向：portrait；密度：heavy；建议时长：3–9 秒
  - 检索词：多个工具、多个技能、几个方法、清单、逐项讲解、skill
- **竖屏口播·风险提醒卡**（`PortraitRiskWarning`）
  - 主要：风险提醒
  - 次要：重点强调、列举要点、概念解释
  - 内容：list、short-text
  - 方向：portrait；密度：heavy；建议时长：2–8 秒
  - 检索词：风险、注意、限制、错误、异常、避免
- **竖屏口播·下集预告卡**（`PortraitNextEpisodeCta`）
  - 主要：行动引导
  - 次要：章节转场、重点强调
  - 内容：short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：关注、点赞、收藏、下期、下一步
- **快速上手证明条**（`QuickSetupProof`）
  - 主要：案例与素材
  - 次要：重点强调、对比差异、列举要点
  - 内容：list、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：证明、快速、门槛、无需、几分钟

## 风险提醒

- **旧方案淘汰警告**（`LegacyModelEliminationWarning`）
  - 主要：风险提醒
  - 次要：对比差异、重点强调
  - 内容：comparison、short-text
  - 方向：portrait；密度：heavy；建议时长：1.5–7 秒
  - 检索词：淘汰、过时、落后、失效、被取代

## 媒体展示组件

- **媒体聚焦卡**（`MediaSpotlightCard`）
  - 主要：案例与素材
  - 次要：概念解释、重点强调
  - 内容：media、short-text
  - 方向：any；密度：heavy；建议时长：2–12 秒
  - 检索词：图片、视频、案例、截图、作品、证据
- **素材卡**（`MaterialCard`）
  - 主要：案例与素材
  - 次要：概念解释
  - 内容：media
  - 方向：any；密度：medium；建议时长：2–12 秒
  - 检索词：图片、视频、素材、截图、录屏

## WorkBuddy效果

- **章节标题揭示**（`TitleReveal`）
  - 主要：章节转场
  - 次要：重点强调、数字展示
  - 内容：metric、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–5 秒
  - 检索词：开场、章节、年份、趋势、预告
- **折线趋势**（`LineTrend`）
  - 主要：数字展示
  - 次要：风险提醒、对比差异、案例与素材
  - 内容：metric、comparison
  - 方向：portrait；密度：heavy；建议时长：2–7 秒
  - 检索词：趋势、折线、增长、下降、变化
- **步骤流**（`StepFlow`）
  - 主要：流程说明
  - 次要：对比差异、概念解释
  - 内容：process、short-text
  - 方向：portrait；密度：heavy；建议时长：2–8 秒
  - 检索词：路径、流程、节点、线上、线下
- **左右对比卡**（`CompareSplit`）
  - 主要：对比差异
  - 次要：概念解释、列举要点
  - 内容：comparison、short-text
  - 方向：portrait；密度：heavy；建议时长：2–7 秒
  - 检索词：对比、左右、方案、差异、双引擎
- **逐条要点**（`BulletStack`）
  - 主要：列举要点
  - 次要：重点强调、概念解释
  - 内容：list、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：要点、优势、清单、条件、并列
- **柱状图**（`BarChart`）
  - 主要：数字展示
  - 次要：对比差异、案例与素材、重点强调
  - 内容：metric、comparison
  - 方向：portrait；密度：heavy；建议时长：2–7 秒
  - 检索词：柱状图、业绩、突破、增长、排名
- **结尾锁定**（`EndLockup`）
  - 主要：行动引导
  - 次要：数字展示、重点强调、章节转场
  - 内容：metric、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：结尾、目标、金额、行动、实现

## 数字与指标

- **分段能量条**（`SegmentedMeter`）
  - 主要：数字展示
  - 次要：流程说明、列举要点、重点强调
  - 内容：metric、process
  - 方向：any；密度：medium；建议时长：1.5–6 秒
  - 检索词：容量、阶段、进度、性能、分段
- **双向指标差异**（`DualMetricBar`）
  - 主要：对比差异
  - 次要：数字展示、重点强调
  - 内容：metric、comparison
  - 方向：any；密度：medium；建议时长：1.5–6 秒
  - 检索词：对比、差异、竞争、前后、双向
- **波形指标**（`WaveformMetric`）
  - 主要：数字展示
  - 次要：案例与素材、重点强调
  - 内容：metric
  - 方向：any；密度：medium；建议时长：1.5–6 秒
  - 检索词：实时、吞吐、速度、波形、连续变化
- **液态仪表**（`LiquidGauge`）
  - 主要：数字展示
  - 次要：重点强调、流程说明
  - 内容：metric
  - 方向：any；密度：medium；建议时长：1.5–6 秒
  - 检索词：完成率、占比、进度、比例、液位
- **HUD 刻度环**（`RadialTicks`）
  - 主要：重点强调
  - 次要：数字展示、案例与素材
  - 内容：metric、short-text
  - 方向：any；密度：medium；建议时长：1.5–6 秒
  - 检索词：综合指标、核心结论、评分、科技、刻度
