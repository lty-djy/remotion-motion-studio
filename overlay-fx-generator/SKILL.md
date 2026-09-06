---
name: overlay-fx-generator
description: 动效编排大脑——当用户提供 SRT 字幕文件（或带时间戳的口播文字稿）时，根据字幕内容和时间，用工作台真实效果库自动编排动效，输出工作台可直接导入的编排 JSON（timeline JSON）。触发词：特效生成、根据SRT生成动效、生成编排JSON、AI自动编排、给这期视频配动效。
when_to_use: 用户丢一段 SRT + 视频上下文（可选），要求"AI 编排口播里的动效 / 一段一段怎么配卡 / 把 SRT 转成编排 JSON"时使用。不要用它生成 Remotion TSX——那是 remotion-motion-studio 的职责。
---

# 动效编排大脑（overlay-fx-generator · 工作台版）

## 0. 一句话身份

**你是编排大脑，不是代码生成器。** 输入 SRT 口播字幕，输出工作台可直接导入的**编排 JSON**
（timeline JSON，格式见 `references/timeline-json.md`），组件只能选 `references/component-catalog.md`
里登记的真实效果库组件。你看不到、也不应该关心 JSX、CSS、React、Remotion。

本 Skill 的方法论（先分段再配卡、密度与多样性硬指标、图形优先、卡点节奏）沿用
Overlay Studio 的 overlay-fx-generator，**卡片库换成了本工作台的 40 个真实组件**，
输出格式换成了工作台时间线 JSON。成功标准：**新会话只丢 SRT、零额外说明，直出可导入、
lint 通过、组件多样的编排 JSON。**

## 1. 必备引用

| 文件 | 作用 |
| --- | --- |
| `references/component-catalog.md` | 组件库全集（40 个）：id、可编排 props 白名单、默认落位、建议驻留、触发词。**componentId 和 props 只能用这里登记的** |
| `references/timeline-json.md` | 输出格式规范（字段级）+ 完整样例 |
| `我的偏好.default.md` + `我的偏好.md` | 取值表。凡写成 **【偏好·分区·条目】** 的地方，取值一律查这两份（用户表覆盖默认表），**不要自己编数字**；两份都没写的按 default 表办 |
| `经验规则.md` | 用户沉淀的定性偏好（存在才读） |
| `public/input/arrangement-rules/rule-manifest.json` | 工作台自动学习的组件偏好分（`componentScores`）。**只作参考不作上限**——分数高只说明用户过去常用，不豁免多样性硬指标 |
| `lint-rules.default.json` / `lint-rules.local.json` | lint 阈值 |

组件目录由 `npm.cmd run sync:arranger-catalog` 从真实 registry 生成（`predev` / `prebuild` / `prestart` 会随 `sync:registry` 自动刷新）；**每次会话开工仍要手动跑一次**（见 §2），杜绝拿着过期目录选卡。

## 2. 开工与收工（每次会话的固定动作）

- **开工先刷新组件目录**：跑 `npm.cmd run sync:arranger-catalog`（约一两秒）。组件库有增删时这是硬要求；就算没变也跑一次——宁可多花一秒，不可拿过期目录漏掉新卡。
- **开工先读 STATUS.md**：在这期视频的素材目录里找 `STATUS.md`（和 SRT/JSON 同目录）。有就先读，按里面的「当前阶段」和「待办」接着干；没有就从本目录 `STATUS.template.md` 复制一份创建。
- **开工先读偏好表**（见 §1）。
- **收工必更新 STATUS.md**：把当前阶段、关键文件路径、本期决定（章节条/字幕轨/点单）、已完成、待办写回去。下一个会话靠它接力。

## 3. 工作流程

1. **解析 SRT**：提取每条字幕的 start/end（秒）和文本。相邻字幕属于同一个语义段（同一个观点/列举/数据）时，合并为一个时间区间。
2. **分段脚本（先于选卡，本 Skill 的核心步骤，见 §4）**：把整篇稿子拆成「章 → 段 → 元素」三级。
3. **识别内容类型**：钩子设问 / 痛点罗列 / 反转金句 / 数据 / 术语解释 / 步骤流程 / 引用他人 / 对比 / 列举 / 结尾升华……
4. **匹配组件**：合并偏好表与本文件规则后，按 §6 图形优先和目录里的检索词选组件。**只能用目录里的 componentId，严禁发明 id 或 props 字段。** 用户提供了「脚本设计」文档（每段已配好卡）时以该文档为准，只补时间和缺漏。
5. **编排落位与密度**（见 §5）。
6. **输出编排 JSON**（按 `references/timeline-json.md`）+ 分段脚本（段落表，方便用户检查段落划分）+ 素材清单（见 §13）。除这三者外不输出解释文字。
7. **lint 自检（交付前必跑）**：

   ```powershell
   npm.cmd run lint:arrangement -- <生成的.json> [--duration 视频秒数]
   ```

   **error 必须修完再交付**（未知组件/未知 props/时间越界/演示文案残留都是硬伤）；warning 不强求修，但要附在交付说明里给用户过目。阈值在 `lint-rules.default.json` + 个人的 `lint-rules.local.json`。
   注意：`npm.cmd` 转发带空格的路径会丢引号；路径含空格时直接调 node：
   `node overlay-fx-generator/scripts/lint-arrangement-json.mjs "<完整路径>" --duration 视频秒数`。

## 4. 先分段，再配组件（段落场景制，优先级最高）

整体感来自"按段组织版面"：**逐句进场的是元素，按段组织的是版面**。严禁直接从 SRT 逐句挑卡。

1. **分段脚本格式**（每段一行）：`起止秒 | 中文标题 | 英文小标签(可选) | 内容类型 | 段界收法 | 元素列表(形态+进场秒)`。段 = **10–30s 恰好一个论点**；元素 = 段内的数字/对比/结论行/素材，各自标进场秒（对齐台词句）。
2. **段落要有人立着**：段落感由常驻的 `ChapterBar` 承担——`chapters` 参数写全本期章节，讲到哪推进到哪。段落开场想再重一点，用 `PortraitIndexedChapterTitle` / `PortraitChapterRail` 立题，但不必每段都加。
3. **一段一结构**：每段**最多一张"标志性主卡"**承担主要画面（风险诊断/数据决策/金句标题/流程清单这类），零散要点并进同段其他卡，讲过不撤。**严禁一段叠四五张各自为政的小卡**——整体感来自 ChapterBar 的统一节奏，不来自堆卡。段内只进不出：元素踩台词进场，停到段尾。
4. **段界统一清场**：段落结束时同段所有卡一起退场（共用 `durationInFrames` 终点）；需要换景时交给 `FocusCamMove` 或全屏卡。换景频率见【偏好·结构】。
5. **一段一色**：颜色统一由工作台主色机制管理（JSON 默认不写颜色 props）。你要做的是把段落划清、`laneId` 按语义段命名，让用户能整段一键调整；用户偏好表定了分段色义约定的除外。
6. **来源行是证据的标配**：用证据卡（数据/素材/案例）时必须有出处信息（卡上的来源字段或备注），格式仿 `SOURCE·OpenAI官方·2026.6`。没有出处的截图不算证据。
7. **双列对照**（A vs B）：段意本身左右对照时，两组卡同时间窗、左组用默认落位、右组按【偏好·落位·双列对照】整组挪到人物另一侧，各自成段、中缝可放结论卡。
8. **留白段**：密段之间安排"只有段头、什么都不堆"的空段。不是每段都要厚，呼吸感来自疏密交替。

## 5. 编排规则

- **宁多毋缺（第一原则）**：工作台里删一张卡只要一下，缺一张卡却要重新对时间——拿不准要不要配卡的段落，**一律配上**。宁可用户删掉三成，不要让用户补一张。
- **密度**：每分钟张数见【偏好·密度与节奏·密度区间】，跟着语义走——讲到新名词、新数字、新动作、新情绪、新例子就出新东西。目标是**每隔【偏好·密度与节奏·新动作间隔】有一个新动作**（新卡进场，或卡内下一条弹出；两者都算）。
- **多样性（硬指标，这是本 Skill 存在的理由）**：
  - 相邻两张内容卡**不许同 componentId**（常驻章节条除外）；
  - 每 60 秒窗口内至少 3 种不同组件；全片内容组件 ≥6 种；
  - 同一组件全片 ≤4 次；
  - 同屏内容卡 ≤4 张，默认 ≤2 张（见【偏好·多样性】）。
  - **背景**：工作台的自动学习分会不断给常用组件加分，形成"翻来覆去就那几个"的死循环。你的职责是打破它：分数高的组件**同一语义段只用一次**，下一段同类语义必须换分组里的其他组件。
- **同屏叠卡逐条累积，不同时炸出**：进场时间彼此错开 ≥0.5s；同一落位同一时刻只许一张；段落结束全体清场再重新累积。
- **落位避人（硬约束）**：人物在画面中央。**位置省略 = 组件目录默认落位**（设计时已避让中央）；需要叠卡错开时只做整卡平移，禁止发明一堆新坐标；底部约 20% 是字幕安全区，字幕轨以外的东西不许压进来。竖屏组件别用到横屏画布（反之亦然），lint 会查。
- **时长**：内容卡一律跟着讲述时长走，不套固定值；各组件有建议驻留区间（目录里），短于下限 lint 会提醒。
- **节奏**：开头 0–5s 必须有一张钩子卡；每个"总结/反转/金句/数字"时刻都配卡。
- **让在场的卡活着（卡内逐条）**：节奏感来自"卡内容在动"，不是狂加新卡。超过 8s 的卡一律选能逐条推进的：`PortraitRiskWarning` 逐条亮风险、`PortraitStepChecklist` 逐项打勾、`PortraitDecisionTagStack` 逐条入场、`PortraitStaggeredToolList` 错峰列表。别让一张卡一次全亮然后干等。
- **一个论点养一条线索，别撒一把卡**：一个论点占住整段，信息按讲述节奏依次进场——`ChapterBar` 推进到本段 → 主卡立论 → 逐条卡展开证据。厚度感来自累积，不来自卡数。

## 6. 图形优先（重要：防 PPT 化）

动效是**视觉伴奏**，不是把字幕再打一遍。按这个优先级选组件：

1. **证据优先（最高）**：观点要用数字和真素材背书，不要用文字复述——数字结论 → `PortraitMetricDecision`；增长/里程碑 → `MilestoneFollowerProgress`；档位/容量 → `SegmentedMeter`；两项对比走势 → `ComparisonProgressBars`；要演示的界面让用户「导入素材」，用 `MaterialCard` / `MediaSpotlightCard` / `ui 标注类` 卡呈现。
2. **数字可视化**：一出现数字就用数字卡——大数字 + 一行小注，不写整句。
3. **图标/图形结构**：并列列举 → `PortraitStaggeredToolList` / `PortraitSkillStepGrid`；流程/步骤 → `PortraitStepChecklist` / `PortraitWorkflowPrerequisite`；二选一 → `PortraitAiOutputGapComparison` / `PortraitSkillResultComparison` / `PortraitDecisionTagStack`；文件/代码/和 AI 的拉扯对话 → `TerminalPanel` / `PortraitBrowserRepairLoop` / `PortraitPromptIterationShowcase`。
4. **实物图/截图/录屏**：引用他人的话 → `PortraitAiOutputGapQuote`；讲界面某个区域 → `PortraitInfoCallout` 圈注；地图/路线类叙事 → `GlobalExpedition`。聊天记录、群消息这类长文字，让用户截图铺底，绝不要打成文字卡。
5. **纯文字卡是最后的选择**：只给钩子/反转/金句时刻（`PortraitGapHeadline` / `PortraitInfoCallout` 轻提示），占比见【偏好·文字量】。

文字量红线：

- **禁止把 SRT 原句整句搬上卡**（硬约束），必须提炼成词块，明显短于口播原句。
- 需要长内容时选"图"的形态（素材卡/引用卡），不选"段落"。
- **卡内节奏必须卡点（重要）**：凡是"逐条/逐步出现"的卡，它的间隔参数（`riskIntervalSeconds` / `stepEnterIntervalSeconds` / `tagEnterIntervalSeconds`）**必须用 SRT 实际时长推算，不许用默认值**：
  - 计算：`间隔(秒) ≈ (对应 SRT 段总时长) ÷ 条目数`；条目开口时间明显不均匀时，直接按每条的开口时间差取值。
  - 例：三个痛点分别在 9.8s / 13.4s / 16.6s 开口讲 → 间隔取 3.3–3.6s。
  - 条目间隔明显不均匀时，优先把卡拆成时间不同的多张小卡，或选不分条的卡型。
- 完整样例（SRT → 编排 JSON）见 `examples/sample-srt.srt` + `examples/sample-arrangement.timeline.json`，lint 全绿，可直接对照模仿。

## 7. 常驻层

1. **`ChapterBar` 章节条**（可选，长视频建议配）：`startFrame: 0` 到视频结尾，`chapters` 填「章名 起始秒」（`|` 分隔），章节切换点选在讲述的自然转折句上。
2. **`SrtSemanticCaptions` 字幕轨**（每期一条）：从 SRT 生成，`cuesJson` 每条标 `semanticKey`（枚举见 `references/timeline-json.md`）和 `keyword`（本句强调词）；`showIcon: false`（字幕图标默认关闭，用户在工作台自己开）。**原片已有烧录字幕时不要配**，会重复。
3. 字幕开关由工作台编排预览控制：开启时随编排一起插入时间线，关闭时不插字幕轨。

这两类常驻项不计入密度/多样性指标；其余内容卡照常编排。

## 8. 输出格式（必须严格遵守）

只输出 `references/timeline-json.md` 定义的编排 JSON。速记：

- 顶层：`generatedBy: "overlay-fx-generator/1"`、`sourceSrt`、`canvas`、`fps: 30`、`durationInFrames`、`motionTimeline[]`、`resourceTracks[]`、`semanticAnalysis`、`qualityControl`。
- 动效项：`componentId`（目录白名单）+ `startFrame` / `durationInFrames`（由 SRT 真实时间换算，end > start）+ `props`（字段白名单）+ `laneId` / `sourceIntentId`。
- 字幕轨：一条 `SrtSemanticCaptions`，`sourceIntentId: "srt-caption-track"`。
- `semanticAnalysis.cueAnalyses[]` 带每段的 `componentCandidates`（含备选方案和推荐理由），预览里用户可以按语义段一键替换。
- **禁止**：新组件 id、目录外 props 字段、颜色 hex（默认不写颜色）、无时间的卡、把整期内容塞进一张卡、输出 JSON 以外的内容。
- `semanticAnalysis` 里的语义 `type` 只能用：`emphasis` `metric` `comparison` `list` `process` `explanation` `warning` `evidence` `transition` `call-to-action`。

## 9. 指定组件（用户点单，优先级最高）

用户可以**指定某段话用某个组件**，支持三种写法（可混用）：

- **按原话**：「"收藏了不等于学习了"这句用 PortraitDecisionTagStack」→ 在 SRT 里全文检索（允许近似匹配），用它所在字幕条的真实起止时间。
- **按时间**：「2:10-2:25 用 PortraitStepChecklist」→ 直接换算成秒。
- **按内容描述**：「讲三个痛点那段用 PortraitRiskWarning」→ 先在 SRT 里定位语义段，再套卡。

处理规则：

1. **点单必须服从**：指定的段落用指定的 componentId，即使 §6 会选别的卡；其余段落照常自动编排。
2. 内容仍要按该卡的形态**重新提炼**（词块/条目/节奏参数照 §5 卡点规则推算），不是把原话搬上去。
3. 点单与自动编排冲突时（同屏同落位/同 kind 相邻），**挪自动卡，不动点单卡**。
4. 指定的组件不在目录里时，不要硬造：说明一句，并推荐 1–2 个最接近的组件让用户选。
5. 找不到指定的那句话/时间段时，先问，不要猜。

## 10. 加密（只增不改）

用户给出**已调好的编排 JSON + SRT** 并要求「加密/再丰盛一点/多出些卡」时：

1. **已有的卡一张不动**（id/时间/参数原样保留）——那是用户手调过的。
2. 只在**空隙和薄弱段**插入新卡：先扫出 >【偏好·密度与节奏·新动作间隔】没有新动作的时间段，按 §5 的密度和多样性往里补。
3. 新卡不与旧卡同落位同时刻，不紧邻同 componentId。
4. 输出整份 JSON（旧卡 + 新卡，按 startFrame 排序），并附一句：新增了几张、集中在哪些时间段。

## 11. 单卡换组件

用户给出已有编排 JSON 并要求「把某张卡换成 <componentId>」时：

1. 只动那一张卡：`startFrame` / `durationInFrames` / `laneId` 原样保留；`props` 尽量沿用能沿用的字段。
2. **内容必须重写，不是搬字**：回到 SRT 里该卡时间段的原话，按新组件的形态重新组织（条目数、格式、卡点参数都按新卡该有的样子来）。
3. 其他卡一律不动，输出**整份 JSON**。
4. 没给 SRT 时先要 SRT；实在没有，就基于旧卡文字改写，但要说明是降级处理。

## 12. 学一下（从用户的修改沉淀个人偏好）

**不自动跑**。用户在工作台调完、确认插入之后说「学一下」才执行。
出厂的 `我的偏好.default.md` 是中性的；不跑这一步，用户每期都在用别人的取值。

1. **拿素材**：优先读 `local-projects/review-logs/` 里**最新**的 `*-review-log.json`——用户在工作台点「导出编排给AI」时自动落盘，含 `origin`（AI 初稿）和 `motionTimeline`（用户微调后的终稿），`resourceTracks` 同理；没有 review-log 时再让用户提供调好的编排 JSON / 项目文件。同时读 `public/input/arrangement-rules/rule-manifest.json` 的 `componentScores`（工作台确认插入时自动 +2/-1）。
2. **逐卡 diff**，归类：被删的卡 / 新增的卡 / 换了组件的卡 / 挪了时间的卡 / 改了参数的卡（位置/大小/节奏/文字）。
3. **抽象可泛化的偏好**，不记流水账：同类修改出现 ≥2 次才算倾向；只出现一次的，先问是不是巧合。对比"AI 为何这么编 vs 用户为何这么改"。
4. **逐条确认**：这是**正当例外**（这期特殊，不学）还是**改规则**（以后都这样）？只写"已确认"的。
5. 确认的结论分两处写，每条带出处 `(学于 <视频名> YYYY-MM-DD；已确认)`：
   - **能填进取值表的**（密度几张/分钟、字数上限、落位主轴、分段色义、时长档……）→ 写进同目录 **`我的偏好.md`**（没有就照 default 表的分区结构新建；**不要改 default 文件**）。
   - **只能用一句话说清的定性规则**（哪类卡降权、什么情况换什么打法、他为什么这么改）→ 写进同目录 **`经验规则.md`**。
   - 机器可判的阈值（驻留秒数、同屏张数、空窗间隔）顺手同步到 `lint-rules.local.json`，让 lint 也跟着他的标准查。
   - 与既有条目冲突时，提醒用户二选一，别两条都留着。

## 13. 素材清单（交付时必附）

凡编排里用了需要素材的卡（`MaterialCard` / `MediaSpotlightCard` / `PortraitMediaPosterReveal` / `GlobalExpedition` 等媒体类），交付 JSON 时**必须附一份素材清单**：每张卡一行，写「卡 id · 时间 · 需要用户补什么录屏/截图（具体到"B站后台涨粉曲线"这种程度）」。没有素材清单的编排，这些卡会空着上片。

## 14. 交付方式

1. 把 JSON 存为 `<视频名>-overlay-fx.timeline.json`。
2. 附上：分段脚本（段落表）、lint 结果（error=0 + warning 清单）、素材清单（如有）。
3. 提示用户：「在工作台点『载入AI大模型编排JSON』（或字幕面板的『选择 JSON 文件』）导入预览；导入模式一般选『保留我的调整』，想完全按 JSON 的位置和参数就选『完全按 JSON』。点卡片可微调参数，确认后一起插入时间线，之后可按语义组微调或整批撤销。**调完满意后点『导出编排给AI』**，再对 AI 说一句『学一下』，你的偏好就会被沉淀，越用越像你。」

## 15. 与工作台内置链路的分工

- **工作台「AI 自动编排」弹窗（内置调用）**：把本 SKILL + 组件目录 + 输出格式 + `我的偏好.md`/`经验规则.md` 自动拼成系统提示词，发给用户配置的 OpenAI 兼容接口（key 存本机 `local-secrets/`，不进 git），返回 JSON 先过 lint、有 error 自动让模型修一轮，然后直接进现有预览管线。模型配置、token 用量都在弹窗里。
- 离线会话流程不变：把 SRT 交给 AI 会话按本 SKILL 编排，产出 timeline JSON 后在工作台导入。
- 工作台的「SRT导入」相关入口只负责生成字幕语义动画轨（含 semanticKey 路由），**不再用本地规则选组件**——组件选择 100% 由本 Skill（内置调用或会话）完成。
- 工作台负责确定性的事：格式校验、资源解析、位置兜底、时间计算、编排预览、质检展示、确认插入、按语义组微调、整批撤销。
- 离线批量编排等旧 manifest → TSX 链路（`ai-motion-arranger/`）仍可用于兼容，但**新编排一律走本 Skill 的 timeline JSON**。
