# Card Catalog（自动生成）

> 由 `scripts/generate-card-catalog.mjs` 从
> `arranger-overlay.json`（编排层注释）
> 与自动生成的 `registry-meta.mjs`（技术字段 propsSchema/defaultProps/bounds 等）合成。
> **不要手改本文件**——修改运行时组件或 overlay 后运行 `npm.cmd run sync:registry`。

AI 编排器（即 `../SKILL.md`）只能使用本目录中存在的卡 id，
并严格使用下面登记的 `props` 字段名。任何不在登记中的字段或 id 都视为非法。

**当前卡片总数**：1 张
**覆盖分组**：1 个（数字与指标）
**registry 集合**：1 个 id
**overlay 集合**：1 个 id
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
## 自检（生成时）

- registry 条目数：1
- overlay 条目数：1
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
