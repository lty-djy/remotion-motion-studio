# Card Catalog（自动生成）

> 由 `scripts/generate-card-catalog.mjs` 从
> `arranger-overlay.json`（编排层注释）
> 与 `registry-meta.mjs`（技术字段 propsSchema/defaultProps/bounds 等）合成。
> **不要手改本文件**——直接改源 + 重跑命令 `node scripts/generate-card-catalog.mjs`。

AI 编排器（即 `../SKILL.md`）只能使用本目录中存在的卡 id，
并严格使用下面登记的 `props` 字段名。任何不在登记中的字段或 id 都视为非法。

**当前卡片总数**：15 张
**覆盖分组**：2 个（数字与指标 / 导航与进度 / 等）
**registry 集合**：15 个 id
**overlay 集合**：15 个 id
## 导航与进度

### `ChapterBar`

**角色**：navigation  
**画布落点**：top  
**推荐调色板**：cyan / violet / gold  
**何时使用**：整支视频作为长视频导航单独存在，不进入 boards[].cards。常通过工作台单独添加。  
**视觉/语义**：顶部全宽章节进度条，覆盖整支视频。从口播句子里抽离出 3–6 个并列章节标题，按等分时间推进。

**可编排 props（共 5 个）：**

- `enabled` — true/false，缺省 true
- `chapters` — 章节标题，用 | 分隔（如 开场|卖点|收尾），3–8 个为宜，数量自适应
- `animationSeconds` — 整支视频时长（编排脚本按 videoDurationSec 自动填入）
- `accentColor` — 前景 token（推荐 cyan / gold / violet）
- `secondaryColor` — 轨道 token（推荐 support-neutral）

## 数字与指标

### `SpeedGauge`

**角色**：hero-metric  
**画布落点**：left  
**推荐调色板**：cyan / violet / gold  
**何时使用**：口播里有明确的 'A 达到 X%'、'速度 Y' 等 0–100 的数字；作为 board 的 hero 卡。  
**视觉/语义**：码表式核心数字。带刻度盘和指针，适合表达 0–100 的指标完成度。

**可编排 props（共 9 个）：**

- `title` — 指标标题（中文短词）
- `subtitle` — 副标题 / 英文标签
- `value` — 主数值（字符串，比如 87 或 87%）
- `item1` — 补充项一（文字列）
- `item2` — 补充项二（文字列）
- `item3` — 补充项三（文字列）
- `animationSeconds` — 动画时长秒数（0.2-8）
- `accentColor` — accent token
- `secondaryColor` — support token

### `CounterTicker`

**角色**：hero-metric  
**画布落点**：left  
**推荐调色板**：cyan / violet / amber  
**何时使用**：口播里有明确的累计数字、'已有 X 万用户' 之类。  
**视觉/语义**：滚动累加数字，适合表达累计数、跨步增长。

**可编排 props（共 9 个）：**

- `title` — 标题
- `subtitle` — 副标题 / 英文标签
- `value` — 起始到目标的数字范围，由 useCurrentFrame 推出；填目标字符串
- `item1` — 补充项一
- `item2` — 补充项二
- `item3` — 补充项三
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `StatGrid`

**角色**：balanced-set  
**画布落点**：left  
**推荐调色板**：cyan / violet / teal / lime  
**何时使用**：口播里一连提到 4 个并列指标 / 4 个步骤要点。  
**视觉/语义**：2×2 矩阵指标。适合一次性表达 4 个并列指标。

**可编排 props（共 9 个）：**

- `title` — 主标题
- `subtitle` — 副标题/英文标签
- `value` — 第一格主值
- `item1` — 第二格内容
- `item2` — 第三格内容
- `item3` — 第四格内容
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `ProgressRing`

**角色**：hero-metric  
**画布落点**：left  
**推荐调色板**：cyan / violet / lime  
**何时使用**：口播里 '完成率 X%' + 三条文字补充。  
**视觉/语义**：环形进度，3 行补充说明在右。适合表达完成度 + 3 条关键说明。

**可编排 props（共 9 个）：**

- `title` — 标题
- `subtitle` — 副标题 / 英文标签
- `value` — 百分比（0-100 字符串）
- `item1` — 补充说明一
- `item2` — 补充说明二
- `item3` — 补充说明三
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `DeltaBadge`

**角色**：trend  
**画布落点**：left  
**推荐调色板**：amber / rose / lime  
**何时使用**：口播里 '增长 X%' / '下跌 X%' / '同比增加'。  
**视觉/语义**：涨跌标签 + 大数字。适合表达同比/环比/增长趋势。

**可编排 props（共 9 个）：**

- `title` — 维度名（同比/环比）
- `subtitle` — 副标题 / 英文标签
- `value` — 变动数字（带正负号，例如 24.6）
- `item1` — 上下文一行
- `item2` — 上下文二行（可留空）
- `item3` — 上下文三行（可留空）
- `animationSeconds` — 动画时长
- `accentColor` — accent token（升为 amber / lime，降为 rose）
- `secondaryColor` — support token（success / danger 视方向）

### `Countdown`

**角色**：anchor  
**画布落点**：center-stage  
**推荐调色板**：rose / amber / cyan  
**何时使用**：口播里 '还有 X 秒' / '第 N 阶段倒计时' / 数字封顶。  
**视觉/语义**：倒计时 / 大数字翻转。适合表达阶段倒计时、即时数字。

**可编排 props（共 9 个）：**

- `title` — 阶段标签（中文，可留空）
- `subtitle` — 副标题 / 英文标签（必填）
- `value` — 起算数字（≥ 0 数字串）
- `item1` — 补充说明一（可留空）
- `item2` — 补充说明二（可留空）
- `item3` — 补充说明三（可留空）
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `MetricBar`

**角色**：balanced-set  
**画布落点**：left  
**推荐调色板**：cyan / violet / teal / lime  
**何时使用**：口播里 '速度 A / 质量 B / 稳定 C' 类的 2–3 条并列子项。  
**视觉/语义**：紧凑横向条形指标 + 目标刻度。适合 2–3 条并列子项对比。

**可编排 props（共 9 个）：**

- `title` — 主标题
- `subtitle` — 副标题/英文标签
- `value` — 主条形 0–100（数字串）
- `item1` — 第 1 子项标签
- `item2` — 第 2 子项标签
- `item3` — 第 3 子项标签
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `SegmentedMeter`

**角色**：balanced-set  
**画布落点**：left  
**推荐调色板**：cyan / amber / rose  
**何时使用**：口播里 '容量 X%' / '性能 Y 级' / 阈值暗示。  
**视觉/语义**：分段容量槽。适合表达能量/电池/性能等级。

**可编排 props（共 9 个）：**

- `title` — 标题
- `subtitle` — 副标题 / 英文标签
- `value` — 百分比 0–100（数字串）
- `item1` — 补充说明一
- `item2` — 补充说明二
- `item3` — 补充说明三
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `DualMetricBar`

**角色**：compare  
**画布落点**：left  
**推荐调色板**：violet / cyan / amber  
**何时使用**：口播里明确对比 A vs B / 两者差距。  
**视觉/语义**：A/B 双向条形差异对比。中心基线两侧分别表达 A 和 B。

**可编排 props（共 9 个）：**

- `title` — 对比标题
- `subtitle` — 副标题 / 英文标签
- `value` — 差值数字（带正负号字符串，比如 -20）
- `item1` — A 侧标签 + 数字（用 item1 表达 A）
- `item2` — B 侧标签 + 数字（用 item2 表达 B）
- `item3` — 补充说明（可留空）
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `FlipCounter`

**角色**：anchor  
**画布落点**：center-stage  
**推荐调色板**：cyan / amber / violet  
**何时使用**：口播里 '已经有 X 用户' / '数量突破 Y 万'。  
**视觉/语义**：机械翻牌数字。适合表达大整数（千、万、亿）。

**可编排 props（共 9 个）：**

- `title` — 标题
- `subtitle` — 副标题 / 英文标签
- `value` — 数量字符串（含千分位）
- `item1` — 补充说明一
- `item2` — 补充说明二
- `item3` — 补充说明三
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `WaveformMetric`

**角色**：live-metric  
**画布落点**：left  
**推荐调色板**：cyan / violet / teal  
**何时使用**：口播里 '实时吞吐 X / 秒' / 连续信号流。  
**视觉/语义**：实时波形 + 当前读数。适合表达吞吐/信号/帧率。

**可编排 props（共 9 个）：**

- `title` — 标题
- `subtitle` — 副标题 / 英文标签
- `value` — 当前读数（数字串 ≥ 0）
- `item1` — 补充说明一
- `item2` — 补充说明二
- `item3` — 补充说明三
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `LiquidGauge`

**角色**：hero-metric  
**画布落点**：left  
**推荐调色板**：cyan / teal / lime / amber  
**何时使用**：口播里 '存量已达 X%' / '覆盖率 Y'。  
**视觉/语义**：液态填充式百分比。适合完成率、留存、口径充满度。

**可编排 props（共 9 个）：**

- `title` — 标题
- `subtitle` — 副标题 / 英文标签
- `value` — 百分比 0–100（数字串）
- `item1` — 补充说明一
- `item2` — 补充说明二
- `item3` — 补充说明三
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `RadialTicks`

**角色**：hero-metric  
**画布落点**：left  
**推荐调色板**：cyan / violet / teal  
**何时使用**：口播里偏 HUD / 飞行仪表 / 角度读数感的内容。  
**视觉/语义**：HUD 刻度环 + 中心数字。适合科技感读数 / 角度感。

**可编排 props（共 9 个）：**

- `title` — 标题
- `subtitle` — 副标题 / 英文标签
- `value` — 百分比 0–100（数字串）
- `item1` — 补充说明一
- `item2` — 补充说明二
- `item3` — 补充说明三
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token

### `PulseMetric`

**角色**：live-metric  
**画布落点**：left  
**推荐调色板**：cyan / rose / amber  
**何时使用**：口播里 '此刻实时心跳' / '告警脉冲'。  
**视觉/语义**：心电式脉冲线 + 状态峰值。适合表达实时状态 / 突发告警。

**可编排 props（共 9 个）：**

- `title` — 标题
- `subtitle` — 副标题 / 英文标签
- `value` — 当前值（数字串）
- `item1` — 补充说明一
- `item2` — 补充说明二
- `item3` — 补充说明三
- `animationSeconds` — 动画时长
- `accentColor` — accent token
- `secondaryColor` — support token
## 自检（生成时）

- registry 条目数：15
- overlay 条目数：15
- 缺失于 registry（overlay 有但 registry 没登记）：无
- 缺失于 overlay（registry 有但 overlay 没登记）：无

---

## 维护提示

新增/修改卡片的标准流程：

1. 改 `effects/*.tsx` 或 `legacy-effects.tsx`，落地一个或多个组件定义（id 暴露在 propsSchema/MOTION_COMPONENTS/LEGACY_EFFECT_DEFS 中）。
2. 在 `scripts/registry-meta.mjs` 的 `REGISTERED_CARDS` 里追加该 id 与对应 propsSchema/defaultProps/bounds/defaultPosition/durationInFrames。
3. 在 `arranger-overlay.json` 加一条：写明 `catalogGroup`、`placement`、`purpose`、`whenToUse`、`role`、`preferredPalettes`、`propsFieldSemantics`。
4. 重跑 `node scripts/generate-card-catalog.mjs`，让本目录同步。
5. 如果新卡引入新的颜色 token，参考 [`palette.md`](./palette.md) 增改 §2/§3 表，并在 `palette.md` 增加该 token 的使用约束。

未来扩展方向（目前未实现，但 SKILL 已留口子）：图表与比较 / 文字与叙事 / 图片视频与证据 /
结构流程与解释 / UI 与科技界面 / 空间与聚焦 / 品牌装饰与转场。注册这些分类的卡片，
把它们的 id 加入 `REGISTERED_CARDS` 和 `arranger-overlay.json` 即可，编排规则无需改动。
