# 组件目录（自动生成）

> 由 `npm.cmd run sync:arranger-catalog` 从真实运行时 registry（51 个组件）生成。
> 不要手改本文件；组件有增删改后重新运行同步命令。

编排大脑（`../SKILL.md`）**只能使用本目录登记的 componentId**，
**props 只允许填写下面各组件列出的字段名**。任何不在目录中的 id / 字段都是非法输出。

颜色类 props（标 color）默认**不要填写**：组件自带调试好的默认色，工作台导入时会用用户已调好的主色覆盖。确需填写时才从组件 defaultProps 的既有取值中选择，禁止发明新 hex。

## 快速索引

| componentId | 名称 | 分组 | 主要语义 | 方向 | 角色 |
| --- | --- | --- | --- | --- | --- |
| `GlobalExpedition` | 环球征途地图 | 其他 | 案例与素材 | any |  |
| `ChapterBar` | ChapterBar | 竖屏口播信息层 | 章节转场 | any | 常驻 |
| `FocusCamMove` | FocusCamMove | 常用 | 流程说明 | any |  |
| `SrtSemanticCaptions` | SRT字幕语义动画 | 系统字幕 | caption-track | portrait | 常驻 |
| `SrtCueText` | 主字幕·关键词条 | 系统字幕 | caption-track | any | 常驻 |
| `TerminalPanel` | 终端教学面板 | 其他 | 流程说明 | any |  |
| `Terminal3D` | 3D 终端打字机 | 媒体展示组件 | 流程说明 | any |  |
| `PortraitChapterRail` | 章节条 | 竖屏口播信息层 | 章节转场 | portrait |  |
| `PortraitIndexedChapterTitle` | 编号章节标题 | 竖屏口播信息层 | 章节转场 | portrait |  |
| `PortraitInfoCallout` | 图标信息卡 | 竖屏口播信息层 | 概念解释 | portrait |  |
| `PortraitMetricDecision` | 数据决策卡 | 竖屏口播信息层 | 数字展示 | portrait |  |
| `PortraitDecisionTagStack` | 优缺点标签组 | 竖屏口播信息层 | 对比差异 | portrait |  |
| `PortraitStepChecklist` | 步骤清单卡 | 竖屏口播信息层 | 流程说明 | portrait |  |
| `PortraitStaggeredToolList` | 多工具错峰列表 | 竖屏口播信息层 | 列举要点 | portrait |  |
| `PortraitPromptMistakeDiagnosis` | 错误提问诊断 | 竖屏口播信息层 | 风险提醒 | portrait |  |
| `PortraitWorkflowPrerequisite` | 先装工作流 | 竖屏口播信息层 | 流程说明 | portrait |  |
| `PortraitSkillIdentityCard` | Skill 身份卡 | 竖屏口播信息层 | 概念解释 | portrait |  |
| `PortraitSkillSourceFusion` | Skill 来源合成 | 竖屏口播信息层 | 案例与素材 | portrait |  |
| `PortraitDesignRuleChecklist` | 网页设计规则清单 | 竖屏口播信息层 | 概念解释 | portrait |  |
| `PortraitSkillResultComparison` | Skill 效果前后对比 | 竖屏口播信息层 | 对比差异 | portrait |  |
| `PortraitPromptIterationShowcase` | 一句话连续改版 | 竖屏口播信息层 | 流程说明 | portrait |  |
| `PortraitGsapSkillShowcase` | GSAP 高级动画 | 竖屏口播信息层 | 流程说明 | portrait |  |
| `PortraitSkillIdentityHeaderBar` | Skill 身份条 | 竖屏口播信息层 | 概念解释 | portrait |  |
| `PortraitCodeDecisionChecklist` | 代码决策检查清单 | 竖屏口播信息层 | 流程说明 | portrait |  |
| `PortraitBrowserRepairLoop` | 浏览器自动修复闭环 | 竖屏口播信息层 | 流程说明 | portrait |  |
| `PortraitAgentBrowserMedia` | Agent 浏览器逐屏自查 | 竖屏口播信息层 | 案例与素材 | portrait |  |
| `PortraitMediaPosterReveal` | 右滑媒体海报 | 竖屏口播信息层 | 案例与素材 | portrait |  |
| `PortraitSkillStepGrid` | Skill 四步卡片 | 竖屏口播信息层 | 流程说明 | portrait |  |
| `PortraitGapHeadline` | 差距不在模型标题 | 竖屏口播信息层 | 重点强调 | portrait |  |
| `PortraitAiOutputGapQuote` | 同样 AI 输出差距引用 | 竖屏口播信息层 | 对比差异 | portrait |  |
| `PortraitAiOutputGapComparison` | AI 输出差距对比 | 竖屏口播信息层 | 对比差异 | portrait |  |
| `PortraitRiskWarning` | 风险提醒卡 | 风险提醒 | 风险提醒 | portrait |  |
| `PortraitNextEpisodeCta` | 下集预告卡 | 竖屏口播信息层 | 行动引导 | portrait |  |
| `QuickSetupProof` | 快速上手证明条 | 竖屏口播信息层 | 案例与素材 | portrait |  |
| `LegacyEliminationPanel` | 淘汰警告·旧方案面板 | 风险提醒 | 风险提醒 | portrait |  |
| `MarketEliminationStamp` | 淘汰警告·市场印章 | 风险提醒 | 风险提醒 | portrait |  |
| `MediaSpotlightCard` | 媒体聚焦卡 | 媒体展示组件 | 案例与素材 | any |  |
| `MaterialCard` | 素材卡 | 媒体展示组件 | 案例与素材 | any |  |
| `PhoneRecordingFrameNeutral` | 手机与竖屏录屏 | 媒体展示组件 | 案例与素材 | landscape |  |
| `BrollGigCardFloat` | 悬浮兼职卡片群 | 媒体展示组件 | 案例与素材 | landscape |  |
| `GigHourlyTitle` | 金色时薪标题 | 数字 | 数字展示 | landscape |  |
| `BrollEpisodePosterDuo` | 往期海报回顾 | 媒体展示组件 | 案例与素材 | landscape |  |
| `ComparisonProgressBars` | 对比进度条·持续扶持 | 图表与比较 | 对比差异 | portrait |  |
| `MilestoneFollowerProgress` | 里程碑增长·粉丝进度 | 数字 | 数字展示 | portrait |  |
| `CaseStudySidebar` | 案例商业数据侧栏 | 品牌与标识 | 案例与素材 | portrait |  |
| `BrandLogo` | 品牌 Logo | 品牌与标识 | 案例与素材 | portrait |  |
| `TeamAttributionCard` | Logo徽章名片 | 品牌与标识 | 案例与素材 | portrait |  |
| `PinBoard` | 要点钉板 | 口播HUD常驻卡 | 列举要点 | any | 常驻 |
| `StepTimeline` | 步骤时间线卡 | 口播HUD常驻卡 | 流程说明 | any |  |
| `TermCard` | 术语解释卡 | 口播HUD常驻卡 | 概念解释 | any |  |
| `SegmentedMeter` | 分段能量条 | 数字 | 数字展示 | any |  |

## 核心语义图例

- **重点强调**（`emphasis`）
- **数字展示**（`metric`）
- **对比差异**（`comparison`）
- **列举要点**（`list`）
- **流程说明**（`process`）
- **概念解释**（`explanation`）
- **风险提醒**（`warning`）
- **案例与素材**（`evidence`）
- **章节转场**（`transition`）
- **行动引导**（`call-to-action`）

## 其他

### `GlobalExpedition` · 环球征途地图

- 用途：正交投影地球沿大圆航线环球飞行，途经节点停靠点亮，金色航迹＋HUD 任务面板（透明背景）
- 主要语义：案例与素材；次要：流程说明、章节转场、概念解释
- 何时使用（检索词）：地图、路线、地点、全球、跨区域、行程
- 画布方向：any；密度：heavy；建议驻留：6–60 秒
- 默认落位：x=510，y=278，scale=1（占位 900×525，placement=left）
- 默认时长：660 帧（约 22 秒）
- 分组：其他

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示环球地图
- `title` — 主标题
- `subtitle` — 副标题
- `animationSeconds` — 动画时长(秒)（6–60）
- `accentColor` — 航迹强调色（color）
- `linkColor` — 大气/虚线色（color）
- `showHud` — 显示HUD面板

### `TerminalPanel` · 终端教学面板

- 用途：带命令行、步骤清单和终端状态的讲解主面板。
- 主要语义：流程说明；次要：概念解释、列举要点、案例与素材
- 何时使用（检索词）：代码、终端、命令、步骤、开发、工具
- 画布方向：any；密度：heavy；建议驻留：3–12 秒
- 默认落位：x=58，y=540，scale=1（占位 560×620，placement=left）
- 默认时长：210 帧（约 7 秒）
- 分组：其他

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示面板
- `title` — 主标题
- `subtitle` — 终端标签
- `command` — 命令行
- `stepCount` — 步骤数量（1–8）
- `item1` — 步骤一
- `item2` — 步骤二
- `item3` — 步骤三
- `item4` — 步骤四
- `item5` — 步骤五
- `item6` — 步骤六
- `item7` — 步骤七
- `item8` — 步骤八
- `itemIntervalSeconds` — 下一条入场间隔(秒)（0–8）
- `subtitleFontSize` — 终端标签字号(px)（8–32）
- `titleFontSize` — 主标题字号(px)（16–72）
- `commandFontSize` — 命令行字号(px)（8–32）
- `stepNumberFontSize` — 步骤编号字号(px)（8–32）
- `itemFontSize` — 步骤文字字号(px)（10–48）
- `statusFontSize` — 底部状态字号(px)（8–32）
- `accentColor` — 强调色（color）
- `animationSeconds` — 动画时长(秒)（0.2–8）

## 竖屏口播信息层

### `ChapterBar` · ChapterBar

- 用途：常驻章节导航 · 顶部全程在场的本期地图
- 主要语义：章节转场；次要：流程说明、重点强调
- 何时使用（检索词）：章节、章节导航、目录、本期地图、进度、全程在场
- 画布方向：any；密度：light；建议驻留：5–600 秒
- 默认落位：x=0，y=0，scale=1（占位 1920×48，placement=top）
- 默认时长：1020 帧（约 34 秒）
- 分组：竖屏口播信息层；**常驻层**（不计密度/多样性）

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `chapters` — 章节表(名称 起始秒,| 分隔)
- `lastChapterSeconds` — 最后一章时长(秒)（1–120）
- `progAlpha` — 进度色透明度（0.1–1）
- `panelColor` — 卡片底色（color）
- `speed` — 动画速度(此卡)（0.25–3）
- `showProgress` — 显示进度
- `progMode` — 进度形态
- `progAccent` — 进度色（color）
- `textColor` — 文字颜色(默认跟随底色)（color）

### `PortraitChapterRail` · 章节条

- 用途：左上章节标签：强调竖线先立起，章节编号随后滑入，主标题以遮罩上升揭示，说明文字最后轻浮上来。
- 主要语义：章节转场；次要：重点强调、流程说明
- 何时使用（检索词）：章节、下一步、接下来、阶段、开场
- 画布方向：portrait；密度：light；建议驻留：1.2–5 秒
- 默认落位：x=68，y=86，scale=1（占位 520×150，placement=top）
- 默认时长：180 帧（约 6 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示章节条
- `cardWidth` — 卡片宽度(px)（120–1920）
- `index` — 章节编号
- `title` — 章节标题
- `subtitle` — 章节说明
- `accentColor` — 强调色（color）
- `textColor` — 文字颜色（color）
- `indexFontSize` — 编号字号(px)（8–96）
- `titleFontSize` — 标题字号(px)（10–120）
- `subtitleFontSize` — 说明字号(px)（10–96）
- `animationSeconds` — 入场时长(秒)（0.3–2）

### `PortraitIndexedChapterTitle` · 编号章节标题

- 用途：参考视频复刻的编号章节标题：大号橙色序号、英文眉题、中文主标题与副标题按三拍由虚到实入场。
- 主要语义：章节转场；次要：重点强调、流程说明
- 何时使用（检索词）：章节编号、第一个、第二个、痛点、章节、阶段、开场、下一部分
- 画布方向：portrait；密度：light；建议驻留：2–8 秒
- 默认落位：x=76，y=300，scale=1（占位 760×300，placement=top）
- 默认时长：180 帧（约 6 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示编号章节标题
- `chapterNumber` — 章节编号
- `eyebrow` — 英文眉题
- `title` — 主标题
- `subtitle` — 副标题
- `accentColor` — 编号与眉题颜色（color）
- `titleColor` — 主标题颜色（color）
- `subtitleColor` — 副标题颜色（color）
- `numberFontSize` — 编号字号(px)（48–240）
- `eyebrowFontSize` — 眉题字号(px)（10–64）
- `titleFontSize` — 主标题字号(px)（24–120）
- `subtitleFontSize` — 副标题字号(px)（14–72）
- `revealDelaySeconds` — 入场等待(秒)（0–4）
- `animationSeconds` — 分段入场时长(秒)（0.6–6）

### `PortraitInfoCallout` · 图标信息卡

- 用途：参考竖屏口播视频右上信息层：引导词和标题先滑入，图标玻璃卡随后弹出。
- 主要语义：概念解释；次要：重点强调、案例与素材、流程说明、章节转场、风险提醒、行动引导
- 何时使用（检索词）：说明、方法、工具、例如、提示、补充
- 画布方向：portrait；密度：medium；建议驻留：1.5–7 秒
- 默认落位：x=585，y=334，scale=1（占位 430×230，placement=right）
- 默认时长：150 帧（约 5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示信息卡
- `eyebrow` — 引导词
- `title` — 主标题
- `detail` — 核心内容
- `note` — 补充说明
- `iconText` — 图标文字
- `accentColor` — 强调色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 入场时长(秒)（0.4–2）

### `PortraitMetricDecision` · 数据决策卡

- 用途：参考竖屏口播视频的 1K / 2K 决策段：突出核心数字、单位与推荐结论。
- 主要语义：数字展示；次要：对比差异、重点强调
- 何时使用（检索词）：数字、比例、金额、增长、降低、结果
- 画布方向：portrait；密度：medium；建议驻留：1.5–6 秒
- 默认落位：x=75，y=245，scale=1（占位 410×390，placement=left）
- 默认时长：150 帧（约 5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示决策卡
- `lead` — 结论引导词
- `conclusion` — 决策结论
- `metricLabel` — 指标名称
- `value` — 核心数字
- `unit` — 数字单位
- `verdict` — 数字结论
- `accentColor` — 强调色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 入场时长(秒)（0.4–2）

### `PortraitDecisionTagStack` · 优缺点标签组

- 用途：可按需增减的优缺点标签组，玻璃卡严格同宽对齐并按设定间隔依次滑入。
- 主要语义：对比差异；次要：列举要点、重点强调、数字展示
- 何时使用（检索词）：标签、优缺点、选择、判断、并列
- 画布方向：portrait；密度：medium；建议驻留：1.5–6 秒
- 默认落位：x=675，y=371，scale=1（占位 330×628，placement=right）
- 默认时长：150 帧（约 5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示标签组
- `tagCount` — 标签数量（1–8）
- `tag1` — 标签一
- `tag2` — 标签二
- `tag3` — 标签三
- `tag4` — 标签四
- `tag5` — 标签五
- `tag6` — 标签六
- `tag7` — 标签七
- `tag8` — 标签八
- `symbol1` — 图标一
- `symbol2` — 图标二
- `symbol3` — 图标三
- `symbol4` — 图标四
- `symbol5` — 图标五
- `symbol6` — 图标六
- `symbol7` — 图标七
- `symbol8` — 图标八
- `accentColor` — 强调色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `iconSize` — 图标大小(px)（18–64）
- `tagFontSize` — 标签字号(px)（10–72）
- `tagEnterIntervalSeconds` — 下一标签入场间隔(秒)（0–8）
- `animationSeconds` — 入场时长(秒)（0.4–2）

### `PortraitStepChecklist` · 步骤清单卡

- 用途：可按需增减的步骤清单卡，顶部给出阶段结论，步骤卡依次滑入。
- 主要语义：流程说明；次要：列举要点、概念解释
- 何时使用（检索词）：步骤、流程、首先、然后、最后
- 画布方向：portrait；密度：heavy；建议驻留：2.5–9 秒
- 默认落位：x=500，y=252，scale=1（占位 520×860，placement=right）
- 默认时长：150 帧（约 5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示步骤卡
- `eyebrow` — 阶段引导词
- `title` — 阶段标题
- `subtitle` — 阶段说明
- `stepCount` — 步骤数量（1–8）
- `step1` — 步骤一
- `step2` — 步骤二
- `step3` — 步骤三
- `step4` — 步骤四
- `step5` — 步骤五
- `step6` — 步骤六
- `step7` — 步骤七
- `step8` — 步骤八
- `accentColor` — 主强调色（color）
- `successColor` — 完成强调色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `eyebrowFontSize` — 阶段引导词字号(px)（10–64）
- `titleFontSize` — 阶段标题字号(px)（16–96）
- `subtitleFontSize` — 阶段说明字号(px)（10–64）
- `cardWidth` — 卡片宽度(px)（300–520）
- `cardsOffsetX` — 卡片水平位置(px)（-240–240）
- `textOffsetX` — 步骤文字水平位置(px)（-120–120）
- `stepFontSize` — 步骤字号(px)（10–72）
- `stepEnterIntervalSeconds` — 下一步骤入场间隔(秒)（0–8）
- `animationSeconds` — 入场时长(秒)（0.4–2）

### `PortraitStaggeredToolList` · 多工具错峰列表

- 用途：复刻参考视频 7.5–12.25 秒：标题先建立语境，四项工具以彩色竖线、说明与徽标依次滑入。
- 主要语义：列举要点；次要：概念解释、重点强调、流程说明
- 何时使用（检索词）：多个工具、多个技能、几个方法、清单、逐项讲解、skill
- 画布方向：portrait；密度：heavy；建议驻留：3–9 秒
- 默认落位：x=90，y=250，scale=1（占位 900×650，placement=top）
- 默认时长：150 帧（约 5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示工具列表
- `eyebrow` — 顶部引导词
- `titlePrefix` — 标题第一行
- `titleMain` — 标题第二行
- `titleEmphasis` — 标题强调词
- `titleSuffix` — 标题强调后缀
- `eyebrowFontSize` — 顶部引导词字号(px)（10–72）
- `titlePrefixFontSize` — 标题第一行字号(px)（24–96）
- `titleMainFontSize` — 标题第二行字号(px)（24–96）
- `titleEmphasisFontSize` — 标题强调词字号(px)（24–96）
- `titleSuffixFontSize` — 标题强调后缀字号(px)（24–96）
- `item1` — 工具一
- `item2` — 工具二
- `item3` — 工具三
- `item4` — 工具四
- `detail1` — 工具一说明
- `detail2` — 工具二说明
- `detail3` — 工具三说明
- `detail4` — 工具四说明
- `badge1` — 工具一徽标
- `badge2` — 工具二徽标
- `badge3` — 工具三徽标
- `badge4` — 工具四徽标
- `itemFontSize` — 工具字号(px)（14–64）
- `detailFontSize` — 工具说明字号(px)（10–40）
- `badgeFontSize` — 工具徽标字号(px)（10–36）
- `color1` — 工具一颜色（color）
- `color2` — 工具二颜色（color）
- `color3` — 工具三颜色（color）
- `color4` — 工具四颜色（color）
- `highlightColor` — 标题强调色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 四项入场总时长(秒)（1.8–5）

### `PortraitPromptMistakeDiagnosis` · 错误提问诊断

- 用途：复刻参考视频 12.566–20.933 秒：逐字输入错误提问，错峰展示三项问题，最后落到缺少准备步骤的诊断结论。
- 主要语义：风险提醒；次要：概念解释、重点强调
- 何时使用（检索词）：直接提问、官网、页面普通、问题不在模型、缺少准备
- 画布方向：portrait；密度：heavy；建议驻留：3–9 秒
- 默认落位：x=90，y=250，scale=1（占位 900×650，placement=top）
- 默认时长：255 帧（约 8.5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示错误提问诊断
- `eyebrow` — 顶部引导词
- `titlePrefix` — 标题前半句
- `titleEmphasis` — 标题强调词
- `prompt` — 输入框文案
- `issue1` — 问题一
- `issue2` — 问题二
- `issue3` — 问题三
- `conclusionPrefix` — 结论前半句
- `conclusionEmphasis` — 结论强调词
- `eyebrowFontSize` — 顶部引导词字号(px)（10–72）
- `titleFontSize` — 标题字号(px)（24–96）
- `promptFontSize` — 输入框字号(px)（12–64）
- `issueFontSize` — 问题标签字号(px)（10–42）
- `conclusionFontSize` — 结论字号(px)（12–64）
- `accentColor` — 强调色（color）
- `warningColor` — 问题标签颜色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 完整入场时长(秒)（4.5–10）

### `PortraitWorkflowPrerequisite` · 先装工作流

- 用途：复刻参考视频 20.966–26.483 秒：先建立工作流前置结论，再按顺序点亮可增减、自动编号的流程步骤。
- 主要语义：流程说明；次要：概念解释、列举要点、重点强调
- 何时使用（检索词）：动手之前、先装工作流、工作流装好、审美动效工程自测、顺序
- 画布方向：portrait；密度：heavy；建议驻留：4–8 秒
- 默认落位：x=90，y=250，scale=1（占位 900×650，placement=top）
- 默认时长：165 帧（约 5.5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示工作流
- `kicker` — 顶部章节标签
- `titleEmphasis` — 标题强调词
- `titleSuffix` — 标题后半句
- `subtitleLine1` — 说明第一行
- `subtitleLine2` — 说明第二行
- `workflowLabel` — 流程英文标签
- `stepCount` — 步骤数量（1–8）
- `step1` — 步骤一
- `step2` — 步骤二
- `step3` — 步骤三
- `step4` — 步骤四
- `step5` — 步骤五
- `step6` — 步骤六
- `step7` — 步骤七
- `step8` — 步骤八
- `footerEmphasis` — 底部强调词
- `footerText` — 底部说明
- `kickerFontSize` — 顶部章节标签字号(px)（10–52）
- `titleFontSize` — 标题字号(px)（24–96）
- `subtitleFontSize` — 说明字号(px)（10–52）
- `workflowLabelFontSize` — 流程英文标签字号(px)（8–36）
- `stepNumberFontSize` — 步骤编号字号(px)（8–36）
- `stepFontSize` — 步骤文字字号(px)（14–64）
- `footerFontSize` — 底部提示字号(px)（10–42）
- `accentColor` — 标题强调色（color）
- `stepColor1` — 步骤一颜色（color）
- `stepColor2` — 步骤二颜色（color）
- `stepColor3` — 步骤三颜色（color）
- `stepColor4` — 步骤四颜色（color）
- `stepColor5` — 步骤五颜色（color）
- `stepColor6` — 步骤六颜色（color）
- `stepColor7` — 步骤七颜色（color）
- `stepColor8` — 步骤八颜色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 完整入场时长(秒)（3.5–8）

### `PortraitSkillIdentityCard` · Skill 身份卡

- 用途：复刻参考视频 26.966–30.650 秒：用自动编号、身份标题、C 位徽标和持续更新胶囊介绍第一个 Skill。
- 主要语义：概念解释；次要：重点强调、案例与素材
- 何时使用（检索词）：第一个skill、我自己做的UI skill、持续更新、身份介绍
- 画布方向：portrait；密度：light；建议驻留：2.5–6 秒
- 默认落位：x=90，y=150，scale=1（占位 900×260，placement=top）
- 默认时长：111 帧（约 3.7 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示 Skill 身份卡
- `sequenceText` — Skill 编号
- `title` — Skill 主标题
- `subtitle` — Skill 副标题
- `badge` — Skill 徽标
- `updateText` — 持续更新说明
- `sequenceFontSize` — Skill 编号字号(px)（10–56）
- `titleFontSize` — Skill 主标题字号(px)（16–72）
- `subtitleFontSize` — Skill 副标题字号(px)（10–46）
- `badgeFontSize` — Skill 徽标字号(px)（8–96）
- `updateFontSize` — 持续更新说明字号(px)（8–36）
- `accentColor` — 身份卡强调色（color）
- `panelColor` — 身份卡底板颜色（color）
- `textColor` — 身份卡文字颜色（color）
- `animationSeconds` — 完整入场时长(秒)（2.4–6）

### `PortraitSkillSourceFusion` · Skill 来源合成

- 用途：复刻参考视频 30.883–39.566 秒：在 Skill 身份标题下按需增减并依次展示经验来源。
- 主要语义：案例与素材；次要：概念解释、列举要点、重点强调
- 何时使用（检索词）：taste、impeccable、自己的经验、三样拼成一个、经验来源
- 画布方向：portrait；密度：medium；建议驻留：4–12 秒
- 默认落位：x=90，y=120，scale=1（占位 900×946，placement=top）
- 默认时长：261 帧（约 8.7 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示 Skill 来源合成
- `sequenceText` — Skill 编号
- `title` — Skill 主标题
- `subtitle` — Skill 副标题
- `badge` — Skill 徽标
- `sourceCount` — 来源数量（1–8）
- `source1` — 来源一
- `source1Detail` — 来源一说明
- `source2` — 来源二
- `source2Detail` — 来源二说明
- `source3` — 来源三
- `source3Detail` — 来源三说明
- `source4` — 来源四
- `source4Detail` — 来源四说明
- `source5` — 来源五
- `source5Detail` — 来源五说明
- `source6` — 来源六
- `source6Detail` — 来源六说明
- `source7` — 来源七
- `source7Detail` — 来源七说明
- `source8` — 来源八
- `source8Detail` — 来源八说明
- `sequenceFontSize` — Skill 编号字号(px)（10–96）
- `titleFontSize` — Skill 主标题字号(px)（16–96）
- `subtitleFontSize` — Skill 副标题字号(px)（10–96）
- `badgeFontSize` — Skill 徽标字号(px)（8–96）
- `sourceFontSize` — 来源名称字号(px)（10–96）
- `sourceDetailFontSize` — 来源说明字号(px)（8–96）
- `sourceDetailOffsetX` — 来源说明水平位置(px)（-160–300）
- `accentColor` — 身份卡强调色（color）
- `source1Color` — 来源一颜色（color）
- `source2Color` — 来源二颜色（color）
- `source3Color` — 来源三颜色（color）
- `source4Color` — 来源四颜色（color）
- `source5Color` — 来源五颜色（color）
- `source6Color` — 来源六颜色（color）
- `source7Color` — 来源七颜色（color）
- `source8Color` — 来源八颜色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 完整动画时长(秒)（4–20）

### `PortraitDesignRuleChecklist` · 网页设计规则清单

- 用途：复刻参考视频 39.566–47.683 秒：依次点亮排版、留白、配色和层级等网页设计规则。
- 主要语义：概念解释；次要：列举要点、流程说明、重点强调
- 何时使用（检索词）：设计审美、怎么排版、怎么留白、怎么配色、怎么做层级、定好的规矩
- 画布方向：portrait；密度：medium；建议驻留：4–12 秒
- 默认落位：x=90，y=120，scale=1（占位 900×660，placement=top）
- 默认时长：244 帧（约 8.1 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示网页设计规则
- `ruleCount` — 规则数量（1–8）
- `rule1` — 规则一
- `rule2` — 规则二
- `rule3` — 规则三
- `rule4` — 规则四
- `rule5` — 规则五
- `rule6` — 规则六
- `rule7` — 规则七
- `rule8` — 规则八
- `ruleIntervalSeconds` — 下一条规则入场间隔(秒)
- `ruleFontSize` — 规则字号(px)（10–96）
- `ruleOffsetX` — 规则水平位置(px)（-40–420）
- `accentColor` — 卡片强调色（color）
- `bulletColor` — 规则圆点颜色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 完整动画时长(秒)（4–20）

### `PortraitSkillResultComparison` · Skill 效果前后对比

- 用途：复刻参考视频 47.733–56.800 秒：默认效果擦除到 Skill 优化效果，再切换另一行业案例。
- 主要语义：对比差异；次要：案例与素材、概念解释、重点强调
- 何时使用（检索词）：没装的时候、默认效果、装了之后、同一个AI、同一句话、换个行业、一样稳
- 画布方向：portrait；密度：heavy；建议驻留：6–14 秒
- 默认落位：x=90，y=120，scale=1（占位 900×650，placement=top）
- 默认时长：272 帧（约 9.1 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示效果前后对比
- `materialCount` — 素材数量（1–8）
- `material1Url` — 素材一
- `material1Eyebrow` — 素材一英文标题
- `material1Title` — 素材一主标题
- `material1Detail` — 素材一说明
- `material1Color` — 素材一强调色（color）
- `material2Url` — 素材二
- `material2Eyebrow` — 素材二英文标题
- `material2Title` — 素材二主标题
- `material2Detail` — 素材二说明
- `material2Color` — 素材二强调色（color）
- `material3Url` — 素材三
- `material3Eyebrow` — 素材三英文标题
- `material3Title` — 素材三主标题
- `material3Detail` — 素材三说明
- `material3Color` — 素材三强调色（color）
- `material4Url` — 素材四
- `material4Eyebrow` — 素材四英文标题
- `material4Title` — 素材四主标题
- `material4Detail` — 素材四说明
- `material4Color` — 素材四强调色（color）
- `material5Url` — 素材五
- `material5Eyebrow` — 素材五英文标题
- `material5Title` — 素材五主标题
- `material5Detail` — 素材五说明
- `material5Color` — 素材五强调色（color）
- `material6Url` — 素材六
- `material6Eyebrow` — 素材六英文标题
- `material6Title` — 素材六主标题
- `material6Detail` — 素材六说明
- `material6Color` — 素材六强调色（color）
- `material7Url` — 素材七
- `material7Eyebrow` — 素材七英文标题
- `material7Title` — 素材七主标题
- `material7Detail` — 素材七说明
- `material7Color` — 素材七强调色（color）
- `material8Url` — 素材八
- `material8Eyebrow` — 素材八英文标题
- `material8Title` — 素材八主标题
- `material8Detail` — 素材八说明
- `material8Color` — 素材八强调色（color）
- `eyebrowFontSize` — 英文标题字号(px)（8–96）
- `titleFontSize` — 主标题字号(px)（16–120）
- `detailFontSize` — 说明字号(px)（10–96）
- `browserLabelFontSize` — 案例徽标字号(px)（8–96）
- `firstSwitchSeconds` — 第二张素材切换时间(秒)
- `materialIntervalSeconds` — 下一张素材切换间隔(秒)
- `wipeDurationSeconds` — 擦除动画时长(秒)
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `mediaFit` — 素材填充方式
- `mediaPositionX` — 素材水平位置(%)（0–100）
- `mediaPositionY` — 素材垂直位置(%)（0–100）
- `animationSeconds` — 完整动画时长(秒)（4–30）

### `PortraitPromptIterationShowcase` · 一句话连续改版

- 用途：复刻参考视频 57.933–76.800 秒：提示词输入条联动页面结果，连续切换摄影官网、深色后台和产品落地页。
- 主要语义：流程说明；次要：案例与素材、概念解释、对比差异
- 何时使用（检索词）：具体怎么用、想要什么讲清楚、第一句、摄影工作室、想换方向、数据后台深色、产品落地页、只管说要什么
- 画布方向：portrait；密度：heavy；建议驻留：10–24 秒
- 默认落位：x=90，y=100，scale=1（占位 900×760，placement=top）
- 默认时长：566 帧（约 18.9 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示一句话连续改版
- `iterationCount` — 改版数量（1–8）
- `iteration1Url` — 改版一素材
- `iteration1Prompt` — 改版一提示词
- `iteration1Badge` — 改版一徽标
- `iteration1Color` — 改版一强调色（color）
- `iteration2Url` — 改版二素材
- `iteration2Prompt` — 改版二提示词
- `iteration2Badge` — 改版二徽标
- `iteration2Color` — 改版二强调色（color）
- `iteration3Url` — 改版三素材
- `iteration3Prompt` — 改版三提示词
- `iteration3Badge` — 改版三徽标
- `iteration3Color` — 改版三强调色（color）
- `iteration4Url` — 改版四素材
- `iteration4Prompt` — 改版四提示词
- `iteration4Badge` — 改版四徽标
- `iteration4Color` — 改版四强调色（color）
- `iteration5Url` — 改版五素材
- `iteration5Prompt` — 改版五提示词
- `iteration5Badge` — 改版五徽标
- `iteration5Color` — 改版五强调色（color）
- `iteration6Url` — 改版六素材
- `iteration6Prompt` — 改版六提示词
- `iteration6Badge` — 改版六徽标
- `iteration6Color` — 改版六强调色（color）
- `iteration7Url` — 改版七素材
- `iteration7Prompt` — 改版七提示词
- `iteration7Badge` — 改版七徽标
- `iteration7Color` — 改版七强调色（color）
- `iteration8Url` — 改版八素材
- `iteration8Prompt` — 改版八提示词
- `iteration8Badge` — 改版八徽标
- `iteration8Color` — 改版八强调色（color）
- `eyebrow` — 顶部英文标题
- `title` — 顶部主标题
- `emphasis` — 顶部强调标题
- `ghostNumber` — 背景编号
- `waitingText` — 等待提示
- `eyebrowFontSize` — 英文标题字号(px)（8–96）
- `titleFontSize` — 主标题字号(px)（16–120）
- `emphasisFontSize` — 强调标题字号(px)（16–120）
- `promptFontSize` — 提示词字号(px)（10–96）
- `badgeFontSize` — 改版徽标字号(px)（8–96）
- `firstResultSeconds` — 第一版出现时间(秒)
- `iterationIntervalSeconds` — 下一版切换间隔(秒)
- `wipeDurationSeconds` — 擦除动画时长(秒)
- `accentColor` — 标题强调色（color）
- `emphasisColor` — 重点文字颜色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `mediaFit` — 素材填充方式
- `mediaPositionX` — 素材水平位置(%)（0–100）
- `mediaPositionY` — 素材垂直位置(%)（0–100）
- `animationSeconds` — 完整动画时长(秒)（6–60）

### `PortraitGsapSkillShowcase` · GSAP 高级动画

- 用途：复刻参考视频 77.000–95.733 秒：动态能力卡、时间控制说明及双 Skill 协同关系；身份条已拆为独立组件。
- 主要语义：流程说明；次要：概念解释、列举要点、对比差异
- 何时使用（检索词）：第二个skill、GSAP、高级动画、滚动触发、时间轴编排、错峰入场、什么时候出现、快慢怎么给、一起用、动得好不好看
- 画布方向：portrait；密度：heavy；建议驻留：10–24 秒
- 默认落位：x=90，y=270，scale=1（占位 900×760，placement=top）
- 默认时长：562 帧（约 18.7 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示 GSAP 高级动画
- `capabilityCount` — 能力数量（1–8）
- `capability1Title` — 能力一标题
- `capability1Detail` — 能力一说明
- `capability2Title` — 能力二标题
- `capability2Detail` — 能力二说明
- `capability3Title` — 能力三标题
- `capability3Detail` — 能力三说明
- `capability4Title` — 能力四标题
- `capability4Detail` — 能力四说明
- `capability5Title` — 能力五标题
- `capability5Detail` — 能力五说明
- `capability6Title` — 能力六标题
- `capability6Detail` — 能力六说明
- `capability7Title` — 能力七标题
- `capability7Detail` — 能力七说明
- `capability8Title` — 能力八标题
- `capability8Detail` — 能力八说明
- `controlLead` — 控制说明前段
- `controlEmphasis` — 控制说明重点
- `firstSkillTitle` — 左侧 Skill 标题
- `firstSkillDetail` — 左侧 Skill 说明
- `secondSkillTitle` — 右侧 Skill 标题
- `secondSkillDetail` — 右侧 Skill 说明
- `conclusionLead` — 协同结论前段
- `conclusionEmphasis` — 协同结论重点
- `capabilityTitleFontSize` — 能力标题字号(px)（10–96）
- `capabilityDetailFontSize` — 能力说明字号(px)（8–96）
- `controlFontSize` — 控制说明字号(px)（10–96）
- `pairTitleFontSize` — 配合卡标题字号(px)（10–96）
- `pairDetailFontSize` — 配合卡说明字号(px)（8–96）
- `conclusionFontSize` — 协同结论字号(px)（14–120）
- `capabilityStartSeconds` — 第一项能力入场时间(秒)
- `capabilityIntervalSeconds` — 下一项能力入场间隔(秒)
- `pairRevealSeconds` — 双 Skill 配合入场时间(秒)
- `conclusionRevealSeconds` — 协同结论入场时间(秒)
- `accentColor` — GSAP 强调色（color）
- `firstSkillColor` — 第一 Skill 强调色（color）
- `plusColor` — 连接加号颜色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 完整动画时长(秒)（6–60）

### `PortraitSkillIdentityHeaderBar` · Skill 身份条

- 用途：从 GSAP 参考画面拆出的独立身份条：编号、Skill 标题、副标题与徽标。
- 主要语义：概念解释；次要：重点强调、列举要点、流程说明
- 何时使用（检索词）：skill、技能、GSAP、动效引擎、高级动画、编号、徽标
- 画布方向：portrait；密度：light；建议驻留：2–24 秒
- 默认落位：x=90，y=90，scale=1（占位 900×150，placement=top）
- 默认时长：120 帧（约 4 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示 Skill 身份条
- `sequenceText` — Skill 编号
- `title` — Skill 标题
- `subtitle` — Skill 副标题
- `badge` — Skill 徽标
- `sequenceFontSize` — Skill 编号字号(px)（8–120）
- `titleFontSize` — Skill 标题字号(px)（12–120）
- `subtitleFontSize` — Skill 副标题字号(px)（10–96）
- `badgeFontSize` — Skill 徽标字号(px)（8–96）
- `accentColor` — 身份条强调色（color）
- `panelColor` — 身份条底色（color）
- `textColor` — 身份条文字颜色（color）
- `enterDurationSeconds` — 身份条入场时长(秒)

### `PortraitCodeDecisionChecklist` · 代码决策检查清单

- 用途：只复刻参考视频 102.333–109.050 秒的六项代码决策问题，逐行点亮，不包含身份条或行数对比。
- 主要语义：流程说明；次要：列举要点、概念解释、风险提醒
- 何时使用（检索词）：让AI先想、功能真的需要吗、现有代码、标准库、原生平台、已装依赖、一行能搞定、实在不行才自己写
- 画布方向：portrait；密度：medium；建议驻留：4–12 秒
- 默认落位：x=70，y=300，scale=1（占位 620×590，placement=left）
- 默认时长：202 帧（约 6.7 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示代码决策检查清单
- `backgroundOpacity` — 底板透明度（0–1）
- `questionCount` — 问题数量（1–8）
- `question1` — 问题一
- `question2` — 问题二
- `question3` — 问题三
- `question4` — 问题四
- `question5` — 问题五
- `question6` — 问题六
- `question7` — 问题七
- `question8` — 问题八
- `numberFontSize` — 编号字号(px)（8–96）
- `questionFontSize` — 问题字号(px)（10–120）
- `questionEnterIntervalSeconds` — 下一个问题入场间隔(秒)
- `firstHighlightSeconds` — 第一项点亮时间(秒)
- `questionIntervalSeconds` — 下一项点亮间隔(秒)
- `accentColor` — 编号强调色（color）
- `activeTextColor` — 当前问题颜色（color）
- `inactiveTextColor` — 未选问题颜色（color）
- `panelColor` — 底板颜色（color）
- `animationSeconds` — 完整动画时长(秒)（2–60）

### `PortraitBrowserRepairLoop` · 浏览器自动修复闭环

- 用途：复刻参考视频 123.050–132.850 秒的六步浏览器自动测试与修复闭环，节点按口播顺序循环点亮。
- 主要语义：流程说明；次要：列举要点、概念解释、案例与素材
- 何时使用（检索词）：自动测试、自动修bug、打开浏览器、自己运行、自己点击、截图检查、发现问题自己改、再验证、一直循环、直到没问题
- 画布方向：portrait；密度：heavy；建议驻留：6–16 秒
- 默认落位：x=215，y=360，scale=1（占位 650×650，placement=top）
- 默认时长：294 帧（约 9.8 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示浏览器自动修复闭环
- `stepCount` — 节点数量（2–8）
- `step1` — 节点一
- `step2` — 节点二
- `step3` — 节点三
- `step4` — 节点四
- `step5` — 节点五
- `step6` — 节点六
- `step7` — 节点七
- `step8` — 节点八
- `centerTitle` — 中心主标题
- `centerSubtitle` — 中心副标题
- `numberFontSize` — 编号字号(px)（8–96）
- `stepFontSize` — 节点文字字号(px)（10–120）
- `centerTitleFontSize` — 中心主标题字号(px)（10–120）
- `centerSubtitleFontSize` — 中心副标题字号(px)（8–96）
- `nodeEnterIntervalSeconds` — 下一个节点入场间隔(秒)
- `firstNodeHighlightSeconds` — 第一节点点亮时间(秒)
- `nextNodeHighlightIntervalSeconds` — 下一节点点亮间隔(秒)
- `loopIntervalSeconds` — 每轮循环间隔(秒)
- `loopPlayback` — 循环点亮节点
- `accentColor` — 节点强调色（color）
- `textColor` — 高亮文字颜色（color）
- `inactiveColor` — 未点亮文字颜色（color）
- `ringColor` — 环线颜色（color）
- `animationSeconds` — 完整动画时长(秒)（2–120）

### `PortraitAgentBrowserMedia` · Agent 浏览器逐屏自查

- 用途：顶部标题胶囊加可上传图片或视频的浏览器画面；不包含蓝色扫线、交通灯按钮或其他绿色按钮。
- 主要语义：案例与素材；次要：流程说明、概念解释、重点强调
- 何时使用（检索词）：你现在看到的这一整页、一遍遍自查、打开浏览器、逐屏自查、页面截图、网页画面
- 画布方向：portrait；密度：heavy；建议驻留：3–12 秒
- 默认落位：x=115，y=230，scale=1（占位 850×800，placement=top）
- 默认时长：106 帧（约 3.5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示浏览器逐屏自查
- `titlePrefix` — 标题前半句
- `titleHighlight` — 标题强调词
- `browserLabel` — 浏览器栏文字
- `mediaUrl` — 网页图片或视频
- `mediaType` — 素材类型
- `mediaFit` — 素材填充方式
- `mediaPositionX` — 素材水平位置(%)（0–100）
- `mediaPositionY` — 素材垂直位置(%)（0–100）
- `titlePrefixFontSize` — 标题前半句字号(px)（10–120）
- `titleHighlightFontSize` — 标题强调词字号(px)（10–120）
- `browserLabelFontSize` — 浏览器栏字号(px)（8–72）
- `titleColor` — 标题颜色（color）
- `highlightColor` — 强调词颜色（color）
- `frameColor` — 浏览器边框颜色（color）
- `browserBarColor` — 浏览器栏底色（color）
- `browserLabelColor` — 浏览器栏文字颜色（color）
- `cornerRadius` — 浏览器圆角(px)（0–80）
- `titleEnterSeconds` — 标题入场时间(秒)
- `mediaEnterSeconds` — 媒体窗口入场时间(秒)
- `animationSeconds` — 完整动画时长(秒)（1–120）

### `PortraitMediaPosterReveal` · 右滑媒体海报

- 用途：参考右侧竖版海报效果：图片或视频从左侧快速滑入并归正，底部带强调竖线标题。
- 主要语义：案例与素材；次要：重点强调、概念解释、章节转场
- 何时使用（检索词）：展示素材、看这个案例、视频素材、图片素材、海报、作品展示、页面预览
- 画布方向：portrait；密度：medium；建议驻留：2–12 秒
- 默认落位：x=455，y=360，scale=1（占位 560×790，placement=right）
- 默认时长：117 帧（约 3.9 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示右滑媒体海报
- `mediaUrl` — 海报图片或视频
- `mediaType` — 素材类型
- `mediaFit` — 素材填充方式
- `mediaPositionX` — 裁剪水平位置(%)（0–100）
- `mediaPositionY` — 裁剪垂直位置(%)（0–100）
- `title` — 底部标题
- `accentColor` — 标题竖线颜色（color）
- `titleColor` — 标题颜色（color）
- `placeholderColor` — 素材底色（color）
- `cornerRadius` — 海报圆角(px)（0–80）
- `titleFontSize` — 标题字号(px)（12–72）
- `enterDelaySeconds` — 入场延迟(秒)（0–10）
- `enterDurationSeconds` — 滑入时长(秒)（0.12–3）
- `slideDistance` — 滑入距离(px)（40–800）
- `videoMuted` — 视频静音
- `videoVolume` — 视频音量（0–1）
- `videoLoop` — 视频循环播放
- `animationSeconds` — 建议完整时长(秒)（1–120）

### `PortraitSkillStepGrid` · Skill 四步卡片

- 用途：按参考图展示 STEP 1 → 4 与四张 Skill 卡片，支持按需增减步骤。
- 主要语义：流程说明；次要：列举要点、概念解释、章节转场
- 何时使用（检索词）：4个skill、四个skill、一个一个讲清楚、定审美、跟动效、保克制、自测自修
- 画布方向：portrait；密度：medium；建议驻留：2–8 秒
- 默认落位：x=90，y=420，scale=1（占位 900×360，placement=top）
- 默认时长：96 帧（约 3.2 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示 Skill 四步卡片
- `stepCount` — 卡片数量（1–8）
- `headerText` — 顶部步骤标题
- `step1Title` — 卡片一标题
- `step1Subtitle` — 卡片一副标题
- `step2Title` — 卡片二标题
- `step2Subtitle` — 卡片二副标题
- `step3Title` — 卡片三标题
- `step3Subtitle` — 卡片三副标题
- `step4Title` — 卡片四标题
- `step4Subtitle` — 卡片四副标题
- `step5Title` — 卡片五标题
- `step5Subtitle` — 卡片五副标题
- `step6Title` — 卡片六标题
- `step6Subtitle` — 卡片六副标题
- `step7Title` — 卡片七标题
- `step7Subtitle` — 卡片七副标题
- `step8Title` — 卡片八标题
- `step8Subtitle` — 卡片八副标题
- `headerFontSize` — 步骤标题字号(px)（10–96）
- `numberFontSize` — 编号字号(px)（8–72）
- `titleFontSize` — 卡片标题字号(px)（10–96）
- `subtitleFontSize` — 卡片副标题字号(px)（8–72）
- `headerEnterSeconds` — 步骤标题入场时间(秒)
- `cardEnterIntervalSeconds` — 下一个卡片入场间隔(秒)
- `animationSeconds` — 完整动画时长(秒)（1–120）
- `headerColor` — 步骤标题颜色（color）
- `textColor` — 卡片标题颜色（color）
- `subtitleColor` — 副标题颜色（color）

### `PortraitGapHeadline` · 差距不在模型标题

- 用途：三段拆分中的第 1 个组件：最后说一句徽标与“差距不在模型”大标题。
- 主要语义：重点强调；次要：对比差异、概念解释、章节转场
- 何时使用（检索词）：真正拉开差距、不是模型、差距不在模型、最后说一句、工作流
- 画布方向：portrait；密度：light；建议驻留：2–8 秒
- 默认落位：x=80，y=300，scale=1（占位 700×260，placement=top）
- 默认时长：120 帧（约 4 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示差距标题
- `showBadge` — 显示最后说一句徽标
- `badgeText` — 徽标文字
- `titlePrefix` — 主标题前半句
- `titleEmphasis` — 主标题强调词
- `badgeFontSize` — 徽标字号(px)（8–96）
- `titlePrefixFontSize` — 主标题前半句字号(px)（16–160）
- `titleEmphasisFontSize` — 主标题强调词字号(px)（16–160）
- `badgeColor` — 徽标颜色（color）
- `titleColor` — 主标题颜色（color）
- `emphasisColor` — 强调词颜色（color）
- `panelColor` — 底板颜色（color）
- `badgeEnterSeconds` — 徽标入场时间(秒)
- `titleEnterSeconds` — 主标题入场时间(秒)
- `animationSeconds` — 完整动画时长(秒)（1–120）

### `PortraitAiOutputGapQuote` · 同样 AI 输出差距引用

- 用途：三段拆分中的第 2 个组件：同样一个 AI，却产生不同输出档次的双行引用。
- 主要语义：对比差异；次要：概念解释、重点强调、案例与素材
- 何时使用（检索词）：同样一个AI、同样一个 AI、做出来、差了一整个档次、一眼就是AI糊的、直接上线
- 画布方向：portrait；密度：light；建议驻留：2–8 秒
- 默认落位：x=80，y=610，scale=1（占位 700×190，placement=left）
- 默认时长：120 帧（约 4 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示 AI 输出差距引用
- `showAccentLine` — 显示引用竖线
- `leadText` — 第一行文字
- `bodyText` — 第二行文字
- `leadFontSize` — 第一行字号(px)（8–120）
- `bodyFontSize` — 第二行字号(px)（8–120）
- `leadColor` — 第一行颜色（color）
- `bodyColor` — 第二行颜色（color）
- `accentColor` — 引用竖线颜色（color）
- `panelColor` — 底板颜色（color）
- `leadEnterSeconds` — 第一行入场时间(秒)（0.1–120）
- `bodyEnterSeconds` — 第二行入场时间(秒)（0.1–120）
- `animationSeconds` — 完整动画时长(秒)（1–120）

### `PortraitAiOutputGapComparison` · AI 输出差距对比

- 用途：三段拆分中的第 3 个组件：AI 糊感与可直接上线的正反结果对比。
- 主要语义：对比差异；次要：重点强调、概念解释、案例与素材
- 何时使用（检索词）：一眼就是AI糊的、一眼就是 AI 糊的、能直接上线、AI糊、THE GAP
- 画布方向：portrait；密度：light；建议驻留：2–8 秒
- 默认落位：x=90，y=850，scale=1（占位 640×300，placement=left）
- 默认时长：120 帧（约 4 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示 AI 输出差距对比
- `showGapLabel` — 显示 THE GAP 标签
- `gapLabel` — 顶部标签
- `badText` — 反面结果文字
- `goodText` — 正面结果文字
- `badSymbol` — 反面符号
- `goodSymbol` — 正面符号
- `labelFontSize` — 顶部标签字号(px)（8–96）
- `itemFontSize` — 结果文字字号(px)（12–120）
- `symbolFontSize` — 符号字号(px)（12–96）
- `labelColor` — 顶部标签颜色（color）
- `textColor` — 结果文字颜色（color）
- `badColor` — 反面颜色（color）
- `goodColor` — 正面颜色（color）
- `panelColor` — 底板颜色（color）
- `labelEnterSeconds` — 顶部标签入场时间(秒)（0.1–120）
- `firstRowEnterSeconds` — 第一条入场时间(秒)（0.1–120）
- `nextRowEnterIntervalSeconds` — 下一条入场间隔(秒)（0–120）
- `animationSeconds` — 完整动画时长(秒)（1–120）

### `PortraitNextEpisodeCta` · 下集预告卡

- 用途：参考竖屏口播结尾：右上展示下期主题、醒目关键词和关注按钮，适合预告下一集与引导关注。
- 主要语义：行动引导；次要：章节转场、重点强调
- 何时使用（检索词）：关注、点赞、收藏、下期、下一步
- 画布方向：portrait；密度：medium；建议驻留：1.5–6 秒
- 默认落位：x=640，y=285，scale=1（占位 390×270，placement=right）
- 默认时长：150 帧（约 5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示下集预告
- `eyebrow` — 预告引导语
- `title` — 核心关键词
- `subtitle` — 下集主题
- `cta` — 行动按钮
- `icon` — 按钮图标
- `accentColor` — 主题色（color）
- `secondaryColor` — 按钮强调色（color）
- `panelColor` — 按钮底色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 入场时长(秒)（0.4–2）

### `QuickSetupProof` · 快速上手证明条

- 用途：橙色勾选徽标和粗白结论先落位，两枚限制条件标签错峰弹入后分别由细红线划过。
- 主要语义：案例与素材；次要：重点强调、对比差异、列举要点
- 何时使用（检索词）：证明、快速、门槛、无需、几分钟
- 画布方向：portrait；密度：medium；建议驻留：1.5–6 秒
- 默认落位：x=0，y=118，scale=1（占位 700×245，placement=top）
- 默认时长：150 帧（约 5 秒）
- 分组：竖屏口播信息层

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示证明条
- `title` — 结论标题
- `kicker` — 英文副标
- `tag1` — 条件标签一
- `tag2` — 条件标签二
- `checkmark` — 勾选符号
- `accentColor` — 徽标强调色（color）
- `warningColor` — 条件警示色（color）
- `strikeColor` — 删除线颜色（color）
- `panelColor` — 标签底色（color）
- `textColor` — 标题颜色（color）
- `animationSeconds` — 主入场时长(秒)（0.45–1.8）

## 常用

### `FocusCamMove` · FocusCamMove

- 用途：人物聚焦运镜 · 口播画面满屏缩进落位框,背景透明透出下方轨道
- 主要语义：流程说明；次要：重点强调、章节转场
- 何时使用（检索词）：聚焦、运镜、满屏收缩、口播缩进、小窗、人物聚焦、落位框
- 画布方向：any；密度：light；建议驻留：5–600 秒
- 默认落位：x=0，y=0，scale=1（占位 1920×1080，placement=full）
- 默认时长：300 帧（约 10 秒）
- 分组：常用

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `mediaUrl` — 口播素材地址(空 = 收缩舞台口播视频)
- `useMediaCopy` — 副本模式(预览收缩异常时开启)
- `mediaType` — 素材类型
- `mediaFit` — 填充方式
- `side` — 口播缩到哪侧(竖版忽略)
- `accent` — 描边颜色（color）
- `cornerRadius` — 口播框圆角(拉满=圆形)（0–1000）
- `showRing` — 显示口播框描边
- `camDX` — 口播框水平移动（-1100–1100）
- `camDY` — 口播框垂直移动（-400–600）
- `camW` — 口播框宽（300–1200）
- `camH` — 口播框高（300–1000）

## 系统字幕

### `SrtSemanticCaptions` · SRT字幕语义动画

- 用途：读取导入的真实 SRT 时间戳逐句显示，调用固定图标库并支持语义配色与关键词扫线
- 主要语义：系统角色：caption-track；次要：重点强调
- 何时使用（检索词）：字幕、逐字、关键词高亮、语义字幕
- 画布方向：portrait；密度：light；建议驻留：0.5–20 秒
- 默认落位：x=0，y=1360，scale=1（占位 1080×300，placement=bottom）
- 默认时长：582 帧（约 19.4 秒）
- 分组：系统字幕；**常驻层**（不计密度/多样性）

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示字幕动画
- `showIcon` — 显示语义图标
- `fontSize` — 字号(px)（24–110）
- `accentMode` — 强调色模式
- `accentColor` — 单色模式强调色（color）
- `timeOffset` — 时间偏移(秒)（-10–10）
- `cuesJson` — 自定义台词JSON(start/end/text)

### `SrtCueText` · 主字幕·关键词条

- 用途：GSAP 风格底部主字幕：逐句滑入，语义关键词过冲弹入＋琥珀辉光脉冲，可开逐字扫色
- 主要语义：系统角色：caption-track
- 何时使用（检索词）：字幕、台词、原文、时间定位
- 画布方向：any；密度：light；建议驻留：0.5–20 秒
- 默认落位：x=0，y=1560，scale=1（占位 1080×220，placement=bottom）
- 默认时长：582 帧（约 19.4 秒）
- 分组：系统字幕；**常驻层**（不计密度/多样性）

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示主字幕
- `fontSize` — 字号(px)（28–110）
- `baseColor` — 正文颜色（color）
- `dimColor` — 扫色起始色（color）
- `accentMode` — 强调色模式
- `accentColor` — 单色强调色（color）
- `sweep` — 逐字扫色
- `showTagChip` — 显示语义标签
- `timeOffset` — 时间偏移(秒)（-10–10）
- `cuesJson` — 自定义台词JSON(start/end/text)

## 媒体展示组件

### `Terminal3D` · 3D 终端打字机

- 用途：3D 倾斜玻璃终端，支持命令、参数、注释、成功/失败状态逐字打出。
- 主要语义：流程说明；次要：概念解释、列举要点、案例与素材、重点强调
- 何时使用（检索词）：代码、终端、命令、命令行、参数、打字机、开发、工具、执行结果
- 画布方向：any；密度：heavy；建议驻留：3–20 秒
- 默认落位：x=1080，y=220，scale=1（占位 760×606，placement=right）
- 默认时长：240 帧（约 8 秒）
- 分组：媒体展示组件

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `theme` — 底色
- `position` — 卡片微落位
- `file` — 标题栏文件名
- `lines` — 命令行（用 | 分隔；支持 $ 参数 #注释 ✓成功 ✗失败）
- `cps` — 打字速度（8–60）
- `offsetX` — 水平微调（-900–900）
- `offsetY` — 垂直微调（-600–600）

### `MediaSpotlightCard` · 媒体聚焦卡

- 用途：可上传图片或视频的展示卡片，带缩放滑入出场动画、字幕条和强调角标。
- 主要语义：案例与素材；次要：概念解释、重点强调
- 何时使用（检索词）：图片、视频、案例、截图、作品、证据
- 画布方向：any；密度：heavy；建议驻留：2–12 秒
- 默认落位：x=100，y=240，scale=1（占位 480×480，placement=left）
- 默认时长：180 帧（约 6 秒）
- 分组：媒体展示组件

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示卡片
- `mediaUrl` — 素材地址
- `mediaType` — 素材类型
- `caption` — 字幕文字
- `eyebrow` — 引导词
- `accentColor` — 强调色（color）
- `panelColor` — 底板色（color）
- `textColor` — 文字颜色（color）
- `cornerRadius` — 圆角(px)（0–48）
- `fit` — 填充方式
- `mediaPositionX` — 裁剪水平位置(%)（0–100）
- `mediaPositionY` — 裁剪垂直位置(%)（0–100）
- `animationSeconds` — 入场时长(秒)（0.4–2）

### `MaterialCard` · 素材卡

- 用途：纯图片或视频素材卡，支持自由调整裁剪位置。
- 主要语义：案例与素材；次要：概念解释
- 何时使用（检索词）：图片、视频、素材、截图、录屏
- 画布方向：any；密度：medium；建议驻留：2–12 秒
- 默认落位：x=100，y=240，scale=1（占位 480×480，placement=left）
- 默认时长：180 帧（约 6 秒）
- 分组：媒体展示组件

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示卡片
- `mediaUrl` — 素材地址
- `mediaType` — 素材类型
- `panelColor` — 底板色（color）
- `cornerRadius` — 圆角(px)（0–48）
- `fit` — 填充方式
- `mediaPositionX` — 裁剪水平位置(%)（0–100）
- `mediaPositionY` — 裁剪垂直位置(%)（0–100）
- `animationSeconds` — 入场时长(秒)（0.4–2）

### `PhoneRecordingFrameNeutral` · 手机与竖屏录屏

- 用途：中性手机外壳与竖屏录屏展示组件，适合手机界面、录屏证据与产品演示。
- 主要语义：案例与素材；次要：概念解释、重点强调、流程说明
- 何时使用（检索词）：手机、录屏、竖屏、屏幕、界面、产品演示、设备、录制
- 画布方向：landscape；密度：heavy；建议驻留：4–8 秒
- 默认落位：x=0，y=0，scale=1（占位 1920×1080，placement=full）
- 默认时长：180 帧（约 6 秒）
- 分组：媒体展示组件

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `mediaUrl` — 内屏图片 / 视频
- `mediaType` — 内屏素材类型
- `mediaFit` — 内屏填充方式
- `enterEndSeconds` — 入场结束（相对组件起点 / 秒）
- `exitStartSeconds` — 出场开始（相对组件起点 / 秒）
- `exitEndSeconds` — 出场结束（相对组件起点 / 秒）

### `BrollGigCardFloat` · 悬浮兼职卡片群

- 用途：按需增删图片或招聘卡片；每张独立移动、缩放及三轴倾斜，透明背景。
- 主要语义：案例与素材；次要：列举要点、案例与素材、重点强调
- 何时使用（检索词）：兼职、时薪、收入、薪资、招聘、招募、机会、价格区间、副业、悬浮卡片、卡片群、b-roll
- 画布方向：landscape；密度：heavy；建议驻留：3–10 秒
- 默认落位：x=0，y=0，scale=1（占位 1920×1080，placement=full）
- 默认时长：150 帧（约 5 秒）
- 分组：媒体展示组件

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示图片卡片
- `cardsJson` — 图片列表
- `enterStaggerSeconds` — 入场间隔（秒）（0–1）
- `floatAmplitude` — 悬浮幅度（0–30）
- `wiggleAmplitude` — Z 轴摇摆幅度（度）（0–15）
- `wiggleAmplitudeY` — Y 轴摇摆幅度（度）（0–15）
- `badgeText` — 招聘卡片角标
- `ctaText` — 招聘卡片按钮

### `BrollEpisodePosterDuo` · 往期海报回顾

- 用途：横屏口播 b-roll：背景压暗，两张竖版海报带 3D 倾斜先后升入并悬浮，随后金色播放量徽章弹出，适合回顾往期内容或展示成绩。
- 主要语义：案例与素材；次要：数字展示、章节转场
- 何时使用（检索词）：往期、回顾、上一期、海报、封面、播放量、成绩、数据、两期、合集、b-roll
- 画布方向：landscape；密度：medium；建议驻留：3–10 秒
- 默认落位：x=0，y=0，scale=1（占位 1920×1080，placement=full）
- 默认时长：180 帧（约 6 秒）
- 分组：媒体展示组件

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示往期海报回顾
- `dimOpacity` — 背景压暗强度（0–0.9）
- `poster1Url` — 左海报图片
- `poster2Url` — 右海报图片
- `posterWidth` — 海报宽度(px)（220–560）
- `tiltDeg` — 3D 倾斜角度(度)（0–30）
- `badgeKicker` — 徽章小字
- `badgePrefix` — 徽章前缀
- `badgeNumber` — 徽章数字
- `accentColor` — 金色强调色（color）
- `floatAmplitude` — 悬浮幅度(px)（0–30）

## 风险提醒

### `PortraitRiskWarning` · 风险提醒卡

- 用途：参考竖屏口播的使用边界段：红色结论标题配合三条等宽风险提醒，依次滑入强调限制条件。
- 主要语义：风险提醒；次要：重点强调、列举要点、概念解释
- 何时使用（检索词）：风险、注意、限制、错误、异常、避免
- 画布方向：portrait；密度：heavy；建议驻留：2–8 秒
- 默认落位：x=58，y=292，scale=1（占位 500×900，placement=left）
- 默认时长：150 帧（约 5 秒）
- 分组：风险提醒

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示风险提醒
- `riskCount` — 风险数量（1–8）
- `eyebrow` — 警示引导语
- `title` — 结论标题
- `emphasis` — 强调结论
- `risk1` — 风险一
- `risk2` — 风险二
- `risk3` — 风险三
- `risk4` — 风险四
- `risk5` — 风险五
- `risk6` — 风险六
- `risk7` — 风险七
- `risk8` — 风险八
- `icon1` — 图标一
- `icon2` — 图标二
- `icon3` — 图标三
- `icon4` — 图标四
- `icon5` — 图标五
- `icon6` — 图标六
- `icon7` — 图标七
- `icon8` — 图标八
- `riskIntervalSeconds` — 下一条风险入场间隔(秒)
- `accentColor` — 警示色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 入场时长(秒)（0.4–2）

### `LegacyEliminationPanel` · 淘汰警告·旧方案面板

- 用途：独立的深色旧方案警告面板：标题、英文标签和红色删除线可单独编排。
- 主要语义：风险提醒；次要：对比差异、重点强调
- 何时使用（检索词）：淘汰、过时、落后、失效、旧方案
- 画布方向：portrait；密度：medium；建议驻留：1–7 秒
- 默认落位：x=58，y=300，scale=1（占位 560×190，placement=left）
- 默认时长：96 帧（约 3.2 秒）
- 分组：风险提醒

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示旧方案面板
- `kicker` — 顶部警告标签
- `title` — 淘汰对象
- `subtitle` — 英文小标签
- `warningColor` — 警示色（color）
- `accentColor` — 边框强调色（color）
- `panelColor` — 面板颜色（color）
- `textColor` — 标题颜色（color）
- `animationSeconds` — 划线完成时间(秒)（0.6–2.2）

### `MarketEliminationStamp` · 淘汰警告·市场印章

- 用途：独立的红色倾斜淘汰印章，支持字号、入场旋转角度和固定角度调整，并根据文字长度自动适配卡片尺寸。
- 主要语义：风险提醒；次要：重点强调、行动引导
- 何时使用（检索词）：市场淘汰、淘汰、出局、取代
- 画布方向：portrait；密度：light；建议驻留：0.3–4 秒
- 默认落位：x=58，y=510，scale=1（占位 560×180，placement=left）
- 默认时长：72 帧（约 2.4 秒）
- 分组：风险提醒

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示市场印章
- `stampText` — 印章结论
- `warningColor` — 警示色（color）
- `panelColor` — 底板颜色（color）
- `textColor` — 文字颜色（color）
- `fontSize` — 印章字号(px)（22–72）
- `fixedRotationDegrees` — 固定旋转角度(°)（-180–180）
- `rotationDegrees` — 入场旋转角度(°)（0–360）
- `delaySeconds` — 入场延迟(秒)（0–8）
- `animationSeconds` — 入场时长(秒)（0.15–1.5）

## 数字

### `GigHourlyTitle` · 金色时薪标题

- 用途：独立的金色时薪大字、中英文标签与说明，透明背景。
- 主要语义：数字展示；次要：重点强调
- 何时使用（检索词）：时薪、薪资、收入、金色大字、价格区间
- 画布方向：landscape；密度：light；建议驻留：2–15 秒
- 默认落位：x=92，y=104，scale=1（占位 850×230，placement=left）
- 默认时长：150 帧（约 5 秒）
- 分组：数字

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `eyebrowEn` — 左上角英文标签
- `eyebrowZh` — 左上角中文标签
- `pricePrefix` — 数字前符号（¥ / $ / € 等）
- `priceFrom` — 起始时薪（数字滚动）
- `priceTo` — 结束时薪（数字滚动）
- `priceText` — 手动时薪文本（不填则用上方数字滚动）
- `priceUnit` — 大字右侧单位
- `priceNote` — 大字下方说明
- `accentColor` — 金色强调色（color）
- `eyebrowEnFontSize` — 英文标签字号(px)（10–64）
- `eyebrowZhFontSize` — 中文标签字号(px)（10–64）
- `priceFontSize` — 时薪大字字号(px)（40–240）
- `priceUnitFontSize` — 单位字号(px)（10–80）
- `priceNoteFontSize` — 说明字号(px)（10–48）

### `MilestoneFollowerProgress` · 里程碑增长·粉丝进度

- 用途：用超大核心数值、当前值与年度目标和横向进度条表达增长里程碑。
- 主要语义：数字展示；次要：对比差异、重点强调、章节转场
- 何时使用（检索词）：粉丝、涨粉、目标、年底、里程碑、增长、达到、完成度、进度、突破、累计
- 画布方向：portrait；密度：medium；建议驻留：1.5–6 秒
- 默认落位：x=72，y=250，scale=1（占位 570×390，placement=left）
- 默认时长：150 帧（约 5 秒）
- 分组：数字

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示里程碑指标
- `eyebrow` — 顶部英文标签
- `title` — 中文标题
- `value` — 核心数值
- `unit` — 数值单位
- `currentLabel` — 当前值标签
- `goalLabel` — 目标值标签
- `progress` — 完成比例（0–1）
- `accentColor` — 当前值颜色（color）
- `goalColor` — 目标值颜色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 入场时长(秒)（0.2–2）

### `SegmentedMeter` · 分段能量条

- 用途：分段式容量、性能和能量指示 · 工作台内置模板
- 主要语义：数字展示；次要：流程说明、列举要点、重点强调
- 何时使用（检索词）：容量、阶段、进度、性能、分段
- 画布方向：any；密度：medium；建议驻留：1.5–6 秒
- 默认落位：x=70，y=380，scale=1（占位 700×340，placement=left）
- 默认时长：120 帧（约 4 秒）
- 分组：数字

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `title` — 主标题
- `subtitle` — 副标题
- `value` — 核心数值
- `item1` — 内容一
- `item2` — 内容二
- `item3` — 内容三
- `animationSeconds` — 动画时长(秒)（0.2–8）
- `accentColor` — 强调色（color）
- `secondaryColor` — 辅助色（color）

## 图表与比较

### `ComparisonProgressBars` · 对比进度条·持续扶持

- 用途：上下两张状态卡对比旧方案与持续方案，用灰色低进度和青色满进度表达差异。
- 主要语义：对比差异；次要：数字展示、流程说明、重点强调
- 何时使用（检索词）：对比、过去、现在、旧方案、新方案、短平快、深度内容、中长视频、持续、扶持、进度、差异
- 画布方向：portrait；密度：medium；建议驻留：1.5–6 秒
- 默认落位：x=72，y=390，scale=1（占位 540×266，placement=left）
- 默认时长：150 帧（约 5 秒）
- 分组：图表与比较

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示对比进度条
- `baselineLabel` — 旧方案标题
- `baselineStatus` — 旧方案状态
- `improvedLabel` — 新方案标题
- `improvedStatus` — 新方案状态
- `baselineProgress` — 旧方案进度（0–1）
- `improvedProgress` — 新方案进度（0–1）
- `accentColor` — 强调色（color）
- `mutedColor` — 弱化色（color）
- `panelColor` — 新方案底色（color）
- `textColor` — 文字颜色（color）
- `labelFontSize` — 标题字号(px)（10–64）
- `statusFontSize` — 状态字号(px)（10–64）
- `animationSeconds` — 入场时长(秒)（0.2–2）

## 品牌与标识

### `CaseStudySidebar` · 案例商业数据侧栏

- 用途：商业价值倍数、双金色数据进度条、人工审核说明与Logo徽章名片。
- 主要语义：案例与素材；次要：数字展示、重点强调、对比差异、概念解释
- 何时使用（检索词）：账号、案例、商业价值、变现、报价、收入、倍数、专业团队、AI 工具
- 画布方向：portrait；密度：medium；建议驻留：3–12 秒
- 默认落位：x=72，y=185，scale=1（占位 520×390，placement=left）
- 默认时长：300 帧（约 10 秒）
- 分组：品牌与标识

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示侧栏
- `headline` — 结论标题
- `headlineValue` — 核心倍数
- `metric1Label` — 指标一名称
- `metric1Value` — 指标一数值
- `metric1Progress` — 指标一进度(%)（0–100）
- `metric2Label` — 指标二名称
- `metric2Value` — 指标二数值
- `metric2Progress` — 指标二进度(%)（0–100）
- `reviewLabel` — 审核说明
- `reviewTime` — 审核时长
- `reviewSuffix` — 审核英文说明
- `attribution` — 团队说明
- `attributionSubtitle` — 团队英文副标题
- `accentColor` — 强调色（color）
- `textColor` — 文字颜色（color）
- `animationSeconds` — 入场时长(秒)（0.2–2）

### `BrandLogo` · 品牌 Logo

- 用途：独立品牌标识组件：可选内置图标，或使用图标库/手动添加的图片 URL。
- 主要语义：案例与素材；次要：重点强调、案例与素材、章节转场
- 何时使用（检索词）：品牌、logo、标识、抖音、平台、账号、官方图标
- 画布方向：portrait；密度：light；建议驻留：0.5–12 秒
- 默认落位：x=72，y=120，scale=1（占位 300×100，placement=left）
- 默认时长：180 帧（约 6 秒）
- 分组：品牌与标识

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示品牌 Logo
- `logoSource` — Logo 来源
- `builtinIcon` — 内置图标
- `customLogoUrl` — 手动图片 URL
- `label` — 品牌名称
- `subtitle` — 英文副标题
- `accentColor` — 图标强调色（color）
- `panelColor` — 卡片颜色（color）
- `width` — 宽度(px)（180–800）
- `height` — 高度(px)（64–240）
- `animationSeconds` — 入场时长(秒)（0.2–2）

### `TeamAttributionCard` · Logo徽章名片

- 用途：品牌、团队背书或归因结论出现时使用的黑底金边 Logo 徽章名片，可选择内置图标或导入外部图标。
- 主要语义：案例与素材；次要：重点强调、概念解释
- 何时使用（检索词）：Logo徽章名片、logo徽章、徽章、名片、团队、专业团队、团队背书、团队实力、归因、品牌标识、品牌背书、官方Logo、官方图标、AI 工具、品牌、logo、brand
- 画布方向：portrait；密度：light；建议驻留：0.5–12 秒
- 默认落位：x=72，y=420，scale=1（占位 320×74，placement=left）
- 默认时长：150 帧（约 5 秒）
- 分组：品牌与标识

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `enabled` — 显示团队卡片
- `logoSource` — 图标来源
- `builtinIcon` — 内置图标
- `customLogoUrl` — 手动图片 URL
- `attribution` — 团队说明
- `attributionSubtitle` — 英文副标题
- `accentColor` — 强调色（color）
- `textColor` — 文字颜色（color）
- `panelColor` — 卡片颜色（color）
- `width` — 宽度(px)（220–620）
- `height` — 高度(px)（56–180）
- `animationSeconds` — 入场时长(秒)（0.2–2）

## 口播HUD常驻卡

### `PinBoard` · 要点钉板

- 用途：章节标题+副题钉在角落，黑牌要点逐条落钉且全程不消失，观众随时知道讲到哪。
- 主要语义：列举要点；次要：重点强调、流程说明、章节转场
- 何时使用（检索词）：要点、钉板、重点、清单、逐条、小结、本段主题、常驻
- 画布方向：any；密度：light；建议驻留：5–120 秒
- 默认落位：x=1160，y=96，scale=1（占位 640×560，placement=right）
- 默认时长：450 帧（约 15 秒）
- 分组：口播HUD常驻卡；**常驻层**（不计密度/多样性）

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `title` — 章节标题(可空)
- `subtitle` — 强调副题(可空)
- `items` — 要点(|分隔,逐条落钉)
- `stepMs` — 每条落钉间隔(卡点用)（500–15000）
- `speed` — 动画速度（0.5–2）
- `accentColor` — 强调色(副题)（color）
- `textColor` — 文字颜色（color）
- `side` — 落位
- `offsetX` — 水平微调（-900–900）
- `offsetY` — 垂直微调（-600–600）

### `StepTimeline` · 步骤时间线卡

- 用途：章节大纲沿竖向导轨逐句冒出，未讲到的章节留空轮廓，标题支持 *关键词* 高亮。
- 主要语义：流程说明；次要：章节转场、列举要点、重点强调
- 何时使用（检索词）：章节、大纲、步骤、流程、目录、第一步、接下来、讲到第几
- 画布方向：any；密度：light；建议驻留：3–60 秒
- 默认落位：x=1040，y=200，scale=1（占位 760×680，placement=right）
- 默认时长：150 帧（约 5 秒）
- 分组：口播HUD常驻卡

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `title` — 标题(*关键词*高亮)
- `steps` — 章节(|分隔)
- `revealed` — 已讲到第几章（0–6）
- `speed` — 动画速度（0.5–2）
- `accentColor` — 标题强调色（color）
- `textColor` — 文字颜色（color）
- `side` — 落位
- `offsetX` — 水平微调（-900–900）
- `offsetY` — 垂直微调（-600–600）

### `TermCard` · 术语解释卡

- 用途：名词 + 一句人话定义的玻璃卡，讲到新概念时弹出，强调色竖条压住卡边。
- 主要语义：概念解释；次要：重点强调
- 何时使用（检索词）：术语、名词、解释、定义、概念、人话、是什么、翻译
- 画布方向：any；密度：light；建议驻留：2–20 秒
- 默认落位：x=1140，y=380，scale=1（占位 660×340，placement=right）
- 默认时长：150 帧（约 5 秒）
- 分组：口播HUD常驻卡

- 可编排 props：
- `enterAnimation` — 入场动画
- `exitAnimation` — 出场动画
- `en` — 英文/拼音(可空)
- `term` — 术语
- `definition` — 一句话定义
- `speed` — 动画速度（0.5–2）
- `accentColor` — 强调色（color）
- `textColor` — 文字颜色（color）
- `side` — 落位
- `offsetX` — 水平微调（-900–900）
- `offsetY` — 垂直微调（-600–600）

## 编排建议（人工维护，随目录一起读）

- 同类语义优先在**不同分组**间轮换选卡，避免整支视频只用一组组件。
- 竖屏口播优先选 `方向：portrait` 的组件；横屏或 `any` 组件在竖屏使用时注意默认落位是否越界。
- 一个语义段落通常 1 张主卡 + 0–2 张辅助卡；数字/对比/流程类内容优先用分组「数字与指标」「风险提醒」等专用卡，而不是纯文字卡。
