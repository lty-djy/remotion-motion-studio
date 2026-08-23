# Palette 语义色板

> 唯一被编排 Skill 接受的颜色来源。任何色彩字面量（hex/rgb/hsl/oklch/命名色）出现在 manifest 中视为非法。

## 1. 总览

Token 分两层：

- **accent token**（8 个）：视觉主调，决定整支视频的色彩节奏。每个 Board 的 `board.palette.accent` 字段只能填这里的一个 token，整段视频至少 2、至多 4 个不同 token。
- **support token**（5 个）：状态/中性辅助，用于不抢主调的次级强调。Board 的 `board.palette.support` 字段和卡片 props 中任何接受颜色的字段都可以选这里。

## 2. Accent Token（视觉主调）

| Token | 视觉意图 | 典型用法 |
| --- | --- | --- |
| `cyan` | 科技、信息流、性能 | 数据、监控、AI、代码相关口播 |
| `violet` | 神秘、新奇、创意 | AI 模型发布、隐私、未来感 |
| `amber` | 温暖、激情、人物 | 人物故事、市场活动、品牌叙事 |
| `lime` | 成长、自然、健康 | 健身、健康饮食、可持续、生态 |
| `rose` | 警示、产品高光、对比 | 上线节奏、营销节点、修复/警告 |
| `teal` | 工业、医疗、严谨 | 制造、医疗、企业方案 |
| `gold` | 高级、收藏、总结 | 收尾、章节封顶、数据封顶 |
| `neutral` | 中性灰，几乎只与 support 协同 | 概念定义、章节标题、字幕 |

## 3. Support Token（状态/中性）

| Token | 视觉意图 | 典型用法 |
| --- | --- | --- |
| `support-neutral` | 中性灰（信息底色） | 章节分隔、低权重标签 |
| `success` | 增长、达标、好消息 | ΔBadge up、StatGrid 的正向值 |
| `warning` | 提示、临界、注意 | 接近阈值的指标、提示语 |
| `danger` | 故障、严重、对照负向 | 对比负向面、ΔBadge down |
| `info` | 信息、链接、附录 | 引用源、二级文本 |

`support-neutral` 是 board.palette.support 的默认填值；其它 support token 只在卡片层面的 `accentColor`/`secondaryColor` 等具体字段里出现，**不**用作 board 主调。

## 4. 约束（编排器必须遵守）

1. **board.palette.accent** 只在 §2 的 8 个 accent token 中选。
2. **board.palette.support** 只在 §3 的 support token 中选；缺省填 `support-neutral`。
3. 卡片 props 中任何接受颜色的字段（如 `accentColor`、`secondaryColor`、`color`），其**值**只能是 §2/§3 中的 token 字符串，不写 #hex、不写 `rgb()`、不写命名色。
4. 单条视频 accent token 的去重数 ∈ [2, 4]。
5. 相邻 Board 必须换主调（同一 acent 不得在连续两段出现），避免视觉同质化。
6. **不**通过半透明（rgba 的 alpha 通道）表达"颜色变体"——透明度需求请使用 catalog 卡片自带的 `backgroundOpacity`、`badgeOpacity` 等离散字段。

## 5. 不允许出现的颜色字面量（违禁名单）

`#` 开头的 3/4/6/8 位 hex、`rgb(`、`rgba(`、`hsl(`、`hsla(`、`oklch(`、`oklab(`、CSS 颜色关键字（`white`、`black`、`gray`、`red`...）一律视为非法。

## 6. 何时新增 token

新增 token 必须满足：

1. 与现有 13 个 token 有明确语义差异，不只是亮度差异。
2. 在 `examples/sample-manifest.json` 等示例中至少出现一次使用案例。
3. 在本文件 §2/§3 表格中追加说明，不删旧条目。

## 7. 设计目的

palette 是约束，不是选项。把"开放给 AI 的视觉自由度"从"无限 RGB 立方体"压缩到"13 个命名色"，让 AI 在零说明情况下只能选出有限组合——回答会先收敛再展开，而不是一上来用 `#fff` 把所有卡片染白。这是"AI 做编排不写代码"的色彩约束面。
