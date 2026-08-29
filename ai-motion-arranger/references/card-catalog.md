# Card Catalog（自动生成）

> 由 `scripts/generate-card-catalog.mjs` 从
> `arranger-overlay.json`（编排层注释）
> 与自动生成的 `registry-meta.mjs`（技术字段 propsSchema/defaultProps/bounds 等）合成。
> **不要手改本文件**——修改运行时组件或 overlay 后运行 `npm.cmd run sync:registry`。

AI 编排器（即 `../SKILL.md`）只能使用本目录中存在的卡 id，
并严格使用下面登记的 `props` 字段名。任何不在登记中的字段或 id 都视为非法。

**当前卡片总数**：5 张
**覆盖分组**：1 个（数字与指标）
**registry 集合**：5 个 id
**overlay 集合**：5 个 id
## 数字与指标

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
## 自检（生成时）

- registry 条目数：5
- overlay 条目数：5
- 缺失于 registry（overlay 有但 registry 没登记）：无
- 缺失于 overlay（registry 有但 overlay 没登记）：无

---

## 维护提示

新增/修改卡片的标准流程：

1. 改 `effects/*.tsx` 或 `legacy-effects.tsx`，并让真实组件进入 `registry.ts` 的 `EFFECT_REGISTRY`。
2. 只有确定性编译器已经支持的组件，才在真实 EffectDef 上声明 `arranger.compiler`。
3. 为 AI 可编排组件在 `arranger-overlay.json` 增加语义注释。
4. 运行 `npm.cmd run sync:registry`，自动刷新技术元数据与两份组件目录。
5. 如果新卡引入新的颜色 token，参考 [`palette.md`](./palette.md) 增改 §2/§3 表，并在 `palette.md` 增加该 token 的使用约束。

未来扩展方向（目前未实现，但 SKILL 已留口子）：图表与比较 / 文字与叙事 / 图片视频与证据 /
结构流程与解释 / UI 与科技界面 / 空间与聚焦 / 品牌装饰与转场。注册这些分类的卡片，
先实现真实组件并接入运行时 registry；完成编译支持和语义注释后再开放给 AI。
