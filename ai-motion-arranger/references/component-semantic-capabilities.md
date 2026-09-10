# 组件语义能力审核表（自动生成）

> 由 `npm.cmd run sync:registry` 从真实效果注册表生成，请勿手改。
> 普通分组继续用于人工浏览；主要和次要语义用于 AI 候选排序，不代表审核状态，也不限制组件只能用于单一语义。

当前覆盖 **51** 个注册组件。

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

## 其他

- **环球征途地图**（`GlobalExpedition`）
  - 主要：案例与素材
  - 次要：流程说明、章节转场、概念解释
  - 内容：spatial、process、short-text
  - 方向：any；密度：heavy；建议时长：6–60 秒
  - 检索词：地图、路线、地点、全球、跨区域、行程
- **终端教学面板**（`TerminalPanel`）
  - 主要：流程说明
  - 次要：概念解释、列举要点、案例与素材
  - 内容：process、list、long-text
  - 方向：any；密度：heavy；建议时长：3–12 秒
  - 检索词：代码、终端、命令、步骤、开发、工具

## 竖屏口播信息层

- **ChapterBar**（`ChapterBar`）
  - 主要：章节转场
  - 次要：流程说明、重点强调
  - 内容：short-text、process
  - 方向：any；密度：light；建议时长：5–600 秒
  - 检索词：章节、章节导航、目录、本期地图、进度、全程在场
- **章节条**（`PortraitChapterRail`）
  - 主要：章节转场
  - 次要：重点强调、流程说明
  - 内容：short-text、process
  - 方向：portrait；密度：light；建议时长：1.2–5 秒
  - 检索词：章节、下一步、接下来、阶段、开场
- **编号章节标题**（`PortraitIndexedChapterTitle`）
  - 主要：章节转场
  - 次要：重点强调、流程说明
  - 内容：short-text、process
  - 方向：portrait；密度：light；建议时长：2–8 秒
  - 检索词：章节编号、第一个、第二个、痛点、章节、阶段、开场、下一部分
- **图标信息卡**（`PortraitInfoCallout`）
  - 主要：概念解释
  - 次要：重点强调、案例与素材、流程说明、章节转场、风险提醒、行动引导
  - 内容：short-text、long-text
  - 方向：portrait；密度：medium；建议时长：1.5–7 秒
  - 检索词：说明、方法、工具、例如、提示、补充
- **数据决策卡**（`PortraitMetricDecision`）
  - 主要：数字展示
  - 次要：对比差异、重点强调
  - 内容：metric、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：数字、比例、金额、增长、降低、结果
- **优缺点标签组**（`PortraitDecisionTagStack`）
  - 主要：对比差异
  - 次要：列举要点、重点强调、数字展示
  - 内容：comparison、list、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：标签、优缺点、选择、判断、并列
- **步骤清单卡**（`PortraitStepChecklist`）
  - 主要：流程说明
  - 次要：列举要点、概念解释
  - 内容：process、list、short-text
  - 方向：portrait；密度：heavy；建议时长：2.5–9 秒
  - 检索词：步骤、流程、首先、然后、最后
- **多工具错峰列表**（`PortraitStaggeredToolList`）
  - 主要：列举要点
  - 次要：概念解释、重点强调、流程说明
  - 内容：list、short-text
  - 方向：portrait；密度：heavy；建议时长：3–9 秒
  - 检索词：多个工具、多个技能、几个方法、清单、逐项讲解、skill
- **错误提问诊断**（`PortraitPromptMistakeDiagnosis`）
  - 主要：风险提醒
  - 次要：概念解释、重点强调
  - 内容：short-text、list
  - 方向：portrait；密度：heavy；建议时长：3–9 秒
  - 检索词：直接提问、官网、页面普通、问题不在模型、缺少准备
- **先装工作流**（`PortraitWorkflowPrerequisite`）
  - 主要：流程说明
  - 次要：概念解释、列举要点、重点强调
  - 内容：process、list、short-text
  - 方向：portrait；密度：heavy；建议时长：4–8 秒
  - 检索词：动手之前、先装工作流、工作流装好、审美动效工程自测、顺序
- **Skill 身份卡**（`PortraitSkillIdentityCard`）
  - 主要：概念解释
  - 次要：重点强调、案例与素材
  - 内容：short-text
  - 方向：portrait；密度：light；建议时长：2.5–6 秒
  - 检索词：第一个skill、我自己做的UI skill、持续更新、身份介绍
- **Skill 来源合成**（`PortraitSkillSourceFusion`）
  - 主要：案例与素材
  - 次要：概念解释、列举要点、重点强调
  - 内容：list、short-text
  - 方向：portrait；密度：medium；建议时长：4–12 秒
  - 检索词：taste、impeccable、自己的经验、三样拼成一个、经验来源
- **网页设计规则清单**（`PortraitDesignRuleChecklist`）
  - 主要：概念解释
  - 次要：列举要点、流程说明、重点强调
  - 内容：list、short-text
  - 方向：portrait；密度：medium；建议时长：4–12 秒
  - 检索词：设计审美、怎么排版、怎么留白、怎么配色、怎么做层级、定好的规矩
- **Skill 效果前后对比**（`PortraitSkillResultComparison`）
  - 主要：对比差异
  - 次要：案例与素材、概念解释、重点强调
  - 内容：comparison、media、short-text
  - 方向：portrait；密度：heavy；建议时长：6–14 秒
  - 检索词：没装的时候、默认效果、装了之后、同一个AI、同一句话、换个行业、一样稳
- **一句话连续改版**（`PortraitPromptIterationShowcase`）
  - 主要：流程说明
  - 次要：案例与素材、概念解释、对比差异
  - 内容：process、media、short-text
  - 方向：portrait；密度：heavy；建议时长：10–24 秒
  - 检索词：具体怎么用、想要什么讲清楚、第一句、摄影工作室、想换方向、数据后台深色、产品落地页、只管说要什么
- **GSAP 高级动画**（`PortraitGsapSkillShowcase`）
  - 主要：流程说明
  - 次要：概念解释、列举要点、对比差异
  - 内容：list、process、short-text
  - 方向：portrait；密度：heavy；建议时长：10–24 秒
  - 检索词：第二个skill、GSAP、高级动画、滚动触发、时间轴编排、错峰入场、什么时候出现、快慢怎么给、一起用、动得好不好看
- **Skill 身份条**（`PortraitSkillIdentityHeaderBar`）
  - 主要：概念解释
  - 次要：重点强调、列举要点、流程说明
  - 内容：short-text
  - 方向：portrait；密度：light；建议时长：2–24 秒
  - 检索词：skill、技能、GSAP、动效引擎、高级动画、编号、徽标
- **代码决策检查清单**（`PortraitCodeDecisionChecklist`）
  - 主要：流程说明
  - 次要：列举要点、概念解释、风险提醒
  - 内容：list、process、short-text
  - 方向：portrait；密度：medium；建议时长：4–12 秒
  - 检索词：让AI先想、功能真的需要吗、现有代码、标准库、原生平台、已装依赖、一行能搞定、实在不行才自己写
- **浏览器自动修复闭环**（`PortraitBrowserRepairLoop`）
  - 主要：流程说明
  - 次要：列举要点、概念解释、案例与素材
  - 内容：process、list、short-text
  - 方向：portrait；密度：heavy；建议时长：6–16 秒
  - 检索词：自动测试、自动修bug、打开浏览器、自己运行、自己点击、截图检查、发现问题自己改、再验证、一直循环、直到没问题
- **Agent 浏览器逐屏自查**（`PortraitAgentBrowserMedia`）
  - 主要：案例与素材
  - 次要：流程说明、概念解释、重点强调
  - 内容：media、short-text
  - 方向：portrait；密度：heavy；建议时长：3–12 秒
  - 检索词：你现在看到的这一整页、一遍遍自查、打开浏览器、逐屏自查、页面截图、网页画面
- **右滑媒体海报**（`PortraitMediaPosterReveal`）
  - 主要：案例与素材
  - 次要：重点强调、概念解释、章节转场
  - 内容：media、short-text
  - 方向：portrait；密度：medium；建议时长：2–12 秒
  - 检索词：展示素材、看这个案例、视频素材、图片素材、海报、作品展示、页面预览
- **Skill 四步卡片**（`PortraitSkillStepGrid`）
  - 主要：流程说明
  - 次要：列举要点、概念解释、章节转场
  - 内容：list、process、short-text
  - 方向：portrait；密度：medium；建议时长：2–8 秒
  - 检索词：4个skill、四个skill、一个一个讲清楚、定审美、跟动效、保克制、自测自修
- **差距不在模型标题**（`PortraitGapHeadline`）
  - 主要：重点强调
  - 次要：对比差异、概念解释、章节转场
  - 内容：short-text、comparison
  - 方向：portrait；密度：light；建议时长：2–8 秒
  - 检索词：真正拉开差距、不是模型、差距不在模型、最后说一句、工作流
- **同样 AI 输出差距引用**（`PortraitAiOutputGapQuote`）
  - 主要：对比差异
  - 次要：概念解释、重点强调、案例与素材
  - 内容：comparison、short-text
  - 方向：portrait；密度：light；建议时长：2–8 秒
  - 检索词：同样一个AI、同样一个 AI、做出来、差了一整个档次、一眼就是AI糊的、直接上线
- **AI 输出差距对比**（`PortraitAiOutputGapComparison`）
  - 主要：对比差异
  - 次要：重点强调、概念解释、案例与素材
  - 内容：comparison、short-text
  - 方向：portrait；密度：light；建议时长：2–8 秒
  - 检索词：一眼就是AI糊的、一眼就是 AI 糊的、能直接上线、AI糊、THE GAP
- **下集预告卡**（`PortraitNextEpisodeCta`）
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

## 常用

- **FocusCamMove**（`FocusCamMove`）
  - 主要：流程说明
  - 次要：重点强调、章节转场
  - 内容：process
  - 方向：any；密度：light；建议时长：5–600 秒
  - 检索词：聚焦、运镜、满屏收缩、口播缩进、小窗、人物聚焦、落位框

## 系统字幕

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

## 媒体展示组件

- **3D 终端打字机**（`Terminal3D`）
  - 主要：流程说明
  - 次要：概念解释、列举要点、案例与素材、重点强调
  - 内容：process、list、long-text
  - 方向：any；密度：heavy；建议时长：3–20 秒
  - 检索词：代码、终端、命令、命令行、参数、打字机、开发、工具、执行结果
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
- **手机与竖屏录屏**（`PhoneRecordingFrameNeutral`）
  - 主要：案例与素材
  - 次要：概念解释、重点强调、流程说明
  - 内容：media、short-text
  - 方向：landscape；密度：heavy；建议时长：4–8 秒
  - 检索词：手机、录屏、竖屏、屏幕、界面、产品演示、设备、录制
- **悬浮兼职卡片群**（`BrollGigCardFloat`）
  - 主要：案例与素材
  - 次要：列举要点、案例与素材、重点强调
  - 内容：metric、list、media
  - 方向：landscape；密度：heavy；建议时长：3–10 秒
  - 检索词：兼职、时薪、收入、薪资、招聘、招募、机会、价格区间、副业、悬浮卡片、卡片群、b-roll
- **往期海报回顾**（`BrollEpisodePosterDuo`）
  - 主要：案例与素材
  - 次要：数字展示、章节转场
  - 内容：media、metric
  - 方向：landscape；密度：medium；建议时长：3–10 秒
  - 检索词：往期、回顾、上一期、海报、封面、播放量、成绩、数据、两期、合集、b-roll

## 风险提醒

- **风险提醒卡**（`PortraitRiskWarning`）
  - 主要：风险提醒
  - 次要：重点强调、列举要点、概念解释
  - 内容：list、short-text
  - 方向：portrait；密度：heavy；建议时长：2–8 秒
  - 检索词：风险、注意、限制、错误、异常、避免
- **淘汰警告·旧方案面板**（`LegacyEliminationPanel`）
  - 主要：风险提醒
  - 次要：对比差异、重点强调
  - 内容：comparison、short-text
  - 方向：portrait；密度：medium；建议时长：1–7 秒
  - 检索词：淘汰、过时、落后、失效、旧方案
- **淘汰警告·市场印章**（`MarketEliminationStamp`）
  - 主要：风险提醒
  - 次要：重点强调、行动引导
  - 内容：short-text
  - 方向：portrait；密度：light；建议时长：0.3–4 秒
  - 检索词：市场淘汰、淘汰、出局、取代

## 数字

- **金色时薪标题**（`GigHourlyTitle`）
  - 主要：数字展示
  - 次要：重点强调
  - 内容：metric、short-text
  - 方向：landscape；密度：light；建议时长：2–15 秒
  - 检索词：时薪、薪资、收入、金色大字、价格区间
- **里程碑增长·粉丝进度**（`MilestoneFollowerProgress`）
  - 主要：数字展示
  - 次要：对比差异、重点强调、章节转场
  - 内容：metric、comparison、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：粉丝、涨粉、目标、年底、里程碑、增长、达到、完成度、进度、突破、累计
- **分段能量条**（`SegmentedMeter`）
  - 主要：数字展示
  - 次要：流程说明、列举要点、重点强调
  - 内容：metric、process
  - 方向：any；密度：medium；建议时长：1.5–6 秒
  - 检索词：容量、阶段、进度、性能、分段

## 图表与比较

- **对比进度条·持续扶持**（`ComparisonProgressBars`）
  - 主要：对比差异
  - 次要：数字展示、流程说明、重点强调
  - 内容：comparison、metric、process、short-text
  - 方向：portrait；密度：medium；建议时长：1.5–6 秒
  - 检索词：对比、过去、现在、旧方案、新方案、短平快、深度内容、中长视频、持续、扶持、进度、差异

## 品牌与标识

- **案例商业数据侧栏**（`CaseStudySidebar`）
  - 主要：案例与素材
  - 次要：数字展示、重点强调、对比差异、概念解释
  - 内容：metric、short-text、list、media
  - 方向：portrait；密度：medium；建议时长：3–12 秒
  - 检索词：账号、案例、商业价值、变现、报价、收入、倍数、专业团队、AI 工具
- **品牌 Logo**（`BrandLogo`）
  - 主要：案例与素材
  - 次要：重点强调、案例与素材、章节转场
  - 内容：media、short-text
  - 方向：portrait；密度：light；建议时长：0.5–12 秒
  - 检索词：品牌、logo、标识、抖音、平台、账号、官方图标
- **Logo徽章名片**（`TeamAttributionCard`）
  - 主要：案例与素材
  - 次要：重点强调、概念解释
  - 内容：media、short-text
  - 方向：portrait；密度：light；建议时长：0.5–12 秒
  - 检索词：Logo徽章名片、logo徽章、徽章、名片、团队、专业团队、团队背书、团队实力、归因、品牌标识、品牌背书、官方Logo、官方图标、AI 工具、品牌、logo、brand

## 口播HUD常驻卡

- **要点钉板**（`PinBoard`）
  - 主要：列举要点
  - 次要：重点强调、流程说明、章节转场
  - 内容：list、short-text
  - 方向：any；密度：light；建议时长：5–120 秒
  - 检索词：要点、钉板、重点、清单、逐条、小结、本段主题、常驻
- **步骤时间线卡**（`StepTimeline`）
  - 主要：流程说明
  - 次要：章节转场、列举要点、重点强调
  - 内容：process、list、short-text
  - 方向：any；密度：light；建议时长：3–60 秒
  - 检索词：章节、大纲、步骤、流程、目录、第一步、接下来、讲到第几
- **术语解释卡**（`TermCard`）
  - 主要：概念解释
  - 次要：重点强调
  - 内容：short-text、long-text
  - 方向：any；密度：light；建议时长：2–20 秒
  - 检索词：术语、名词、解释、定义、概念、人话、是什么、翻译
