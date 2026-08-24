# Design Tokens 设计令牌（theme / skin / style / font）

> manifest 顶层的全局设计令牌。与 palette.md（卡片级颜色 token）互补：
> palette 管"这一板用什么颜色"，design tokens 管"整支视频长什么气质、什么骨架、什么字体"。
> 全部为枚举字符串，禁止任何 CSS 字面量。

## 1. 在 manifest 中的位置

```jsonc
{
  "manifestVersion": "1.0",
  "theme": "dark",            // 可选，缺省 dark
  "skin": "tech-cyan",        // 可选，缺省 tech-cyan
  "style": "glass",           // 可选，缺省 glass
  "font": "sans",             // 可选，缺省 sans
  "boards": [ ... ]
}
```

编译器会把令牌解析为 CSS 变量注入生成的 TSX（`DESIGN_TOKENS.cssVars`），
并让 `skin` 决定卡片 `accentColor`/`secondaryColor` 缺省值。

## 2. theme（基调）

| Token | 含义 |
| --- | --- |
| `dark` | 深色基调（默认）：深底浅字，适配实拍视频压暗层 |
| `light` | 浅色基调：浅底深字，适配白底演示/文档风视频 |

## 3. skin（配色主题 = accent + support 预设包）

skin 是 palette token 的"成套预设"。Board 仍可用 `board.palette.accent` 覆盖主调；
skin 决定的是**未显式指定颜色时**的缺省 accent/support。

| Token | accent | support | 适用口播气质 |
| --- | --- | --- | --- |
| `tech-cyan` | cyan | info | 科技、数据、AI、性能（默认） |
| `brand-amber` | amber | warning | 人物故事、品牌、市场活动 |
| `growth-lime` | lime | success | 增长、健康、成绩汇报 |
| `creative-violet` | violet | info | 创意、发布、未来感 |
| `soft-teaching-violet` | violet | support-neutral | 人物口播、柔和解释、步骤教学 |
| `alert-rose` | rose | danger | 风险、对比、营销节点 |
| `pro-neutral` | neutral | support-neutral | 严谨、企业、章节叙述 |

规则：
1. skin 只能从上表 7 个枚举中选。
2. skin **不改变** palette.md 的硬约束：accent 去重数 ∈ [2,4]、相邻 Board 换主调仍然生效。
3. 卡片 props 里已写 `accentColor` 的以卡片为准；未写的由编译器填 skin 的 accent。

## 4. style（骨架）

| Token | 圆角 | 底 | 描边 | 阴影 | 适用 |
| --- | --- | --- | --- | --- | --- |
| `glass` | 18px | 半透明＋模糊 | 1px 亮边 | 轻 | 实拍视频叠加（默认） |
| `flat` | 8px | 实底 | 无 | 无 | 扁平演示、图表风 |
| `outline` | 12px | 透明 | 2px 主调描边 | 无 | 线框科技感 |
| `tile` | 14px | 实底 | 无 | 中投影 | 瓷片拼版、信息卡墙 |
| `teaching-overlay` | 26px | 半透明紫灰＋模糊 | 1px 低对比淡紫边 | 柔和 | 人物口播左侧信息层、步骤解释 |

## 5. font（字体栈）

| Token | 字体栈 | 适用 |
| --- | --- | --- |
| `sans` | -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif | 通用（默认） |
| `serif` | Georgia, "Songti SC", "SimSun", serif | 文化、叙事、标题感 |
| `mono-tech` | "JetBrains Mono", Menlo, Consolas, monospace | 数据、代码、终端风 |

## 6. 校验

- 四个令牌全部可选；出现但不在枚举内 → lint / 编译器直接报错。
- 顶层令牌是**字符串枚举**，不是样式对象；`"style": { "radius": 8 }` 这类写法仍然违法
  （§13 的"禁止渲染层字段"继续生效，`style` 仅允许上述 4 个字符串值之一）。
