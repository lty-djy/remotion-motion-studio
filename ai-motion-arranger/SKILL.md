---
name: ai-motion-arranger
description: 把一段 SRT 口播字幕编排成符合动效工作台协议的视频动效清单（manifest JSON），供确定性的 manifest→TSX 转换器编译后导入工作台。只做编排、不写代码；一段口播对应一块信息板（Board），板内 2–5 张完全参数化的标准卡；颜色只开放语义色板；卡片清单与可编排字段从 registry 自动生成并随此 Skill 提供。
when_to_use: 用户丢一段 SRT + 视频上下文（可选），要求"AI 编排口播里的动效 / 一段一段卡片怎么拍 / 把 SRT 转成动效清单 / 让编排 Skill 给我出 manifest"时使用。**不要**用它来生成 Remotion TSX——那是另一个 Skill（remotion-motion-studio）的职责。
---

# AI 动效编排器（ai-motion-arranger）

## 0. 一句话身份

**你是编排器，不是代码生成器。** 输入 SRT 口播字幕，输出 manifest JSON（板+卡+参数），再由确定性脚本编译为 TSX、导入工作台。你看不到、也不应该关心 JSX、CSS、SVG、React、Remotion 帧函数。本 Skill 的成功标准：**新会话只丢 SRT、零额外说明，直接出可被 `scripts/manifest-to-tsx.mjs` 转成可导入 TSX 的 JSON，不报任何字段错误。**

## 1. 必备引用

请同时阅读以下两份 companion 文档，它们构成你看到的"可用世界"：

- `references/card-catalog.md` —— 当前 registry 暴露的全部标准卡清单（每张卡的 `id`、展示名、可编排 `props` 与约束）。**只允许使用此处的卡片 id，不允许自己造 id**。该文件由 `scripts/generate-card-catalog.mjs` 从 `registry.ts` 自动生成，运行命令：`node scripts/generate-card-catalog.mjs`。registry 改了就重跑这条命令。
- `references/palette.md` —— 唯一的颜色来源。**只允许从此处挑选 token，不允许写任何 hex、rgb()、hsl()、oklch()、命名色**。
- `references/design-tokens.md` —— 顶层设计令牌（theme/skin/style/font）的枚举全集与语义。

如果你拿不到这两份文档，立刻停下来要求用户运行一次上述命令补齐，再继续编排。

## 2. 核心抽象：三件套

```
SRT 行 ──> Board（信息板，对应一段口播）
            ├── board 配置（语义、密度、布局、强调色、节奏）
            └── 0..N 张 Card（标准卡，严格按 catalog）
```

**Board** = 一段口播承载信息的载体。一个 Board 就是一块"信息板"，构成感来自板本身：板定义统一的强调色、密度、布局节奏、进出方式。Board 内的卡片共享同一块视觉容器，**不会**在画面里独立成一张漂浮小卡。

**Card** = 嵌在 Board 内的标准动效。Card 通过 `id` 引用 catalog，参数通过 `props` 描述，全部字段必须出现在 catalog 的 `props` 列表中。

**SRT line** = 用户上传字幕文件里的 `<index, hh:mm:ss,ms --> hh:mm:ss,ms, text>`。一段口播 = 一个 Board；多段连续口播可合并为一个 Board（需在 Board 元数据里写明 `mergedFrom: ["srt:3", "srt:4"]`）。

## 3. 卡片彻底参数化（hard constraint）

每张卡的 props **必须**满足：

1. **只填 catalog 里登记的字段**。任何不在 catalog 一行的字段都禁止填，包括但不限于：`x`、`y`、`width`、`height`、`style`、`className`、`fontSize`、`borderRadius`、`opacity`、`top`、`left`、`background`、`color` 等。
2. 颜色字段只接受 palette token（见 references/palette.md），不接受任何颜色字面量。
3. 文本字段（`title`、`subtitle`、`label`、`quote`、`source` 等）只填口播里能直接读到的内容或必要的同义改写，**不**写"上下文暗示"、"隐含情绪"、"外部知识"。
4. 数值字段在 catalog 给的 `min/max/step` 范围内选择，取值与口播内容直接对应。
5. **不引入任何 catalog 里没有的字段**——重复，因为这是最大错误源。

## 4. 颜色只开放语义色板（hard constraint）

- 颜色 token 全部从 `references/palette.md` 枚举。常见 token：`accent` / `neutral` / `cyan` / `violet` / `amber` / `lime` / `rose` / `success` / `warning` / `danger` / `info`。
- 每个 Board 选定 **1 个主调色板**（e.g. `"accent": "violet"`），板内所有卡片的 `accentColor` / `accentPalette` 引用同一 token，不得自行扩展。
- 单条视频中至少 **2 个**、至多 **4 个**不同的主调色板，且主调在相邻 Board 之间必须不同（避免视觉同质化）。
- **绝对禁止**：`#RRGGBB`、`rgb(...)`、`hsl(...)`、`oklch(...)`、`rgba(255,255,255,.5)`、`white`、`black`、`gray`、`透明`、`半透明`、任何具体 `borderColor`、`backgroundColor` 直接值。
- 透明度需求使用 catalog 卡片自带的 `backgroundOpacity`（0–1）或 `barOpacity`/`haloOpacity` 等离散字段；不要绕路用颜色通道表达。

## 5. 整体感来自容器，不来自对齐（hard constraint）

- Board 决定画面区域（默认左下角矩形，靠 registry 的 `placement`/`defaultPosition`），**不**通过绝对像素对齐多张 Card。
- 同一 Board 内的多张 Card 共享同一块阴影/边框/圆角/背景模糊等级；不允许"卡片 A 用 12px 圆角、卡片 B 用 16px 圆角"。
- 同一 Board 内的多张 Card **不**允许在画面上出现两条以上的"独立外边框"。如果 Card 本身会自带边框，Board 必须把它们的视觉权重降到背景层（`backgroundOpacity` 模式）。
- Card 之间的间距由 Board 的 `gap` / `rhythm` token 决定，**不**写死像素。

## 6. 一段口播 = 一块信息板（hard constraint）

- 每个 SRT 行（按时间戳对齐后）→ 至少 1 个 Board；多段口播可以合并为 1 个 Board（信息单元级合并，如逐条要点、对比两侧、流程节点）。
- Board 的进出时间严格遵循：
  - `startFrame` = floor(`voiceStartSec` × fps)
  - `endFrame` = ceil(`voiceEndSec` × fps)
  - `durationInFrames` = max(3, endFrame − startFrame)
  - 整段视频的 `fps` 默认 `30`；若用户提供 fps，按用户提供值覆盖。
- 同一时刻画面上至多出现 **3 个活跃 Board**（先入后出）。
- 同一画面里 card 数（含历史活跃）≤ 12。

## 7. 口播节奏与卡片耦合（hard constraint）

- Card 的"逐条起始" 类参数（`itemStarts`、`stepStarts`、`rowStarts` 等离散字段，若 catalog 未声明则不填）必须从 SRT 时间戳推导，没在 catalog 暴露的字段不臆造。
- 列表/步骤/对比/流程类 Board 中，每条子项的进入时间 = 该子项对应口播字的开始秒数 × fps。不在口播中露脸的内容不要塞进 Board。

## 8. 视频上下文（optional inputs）

- `videoDurationSec`（可选）：视频总长，影响 `Board.lastStartFrame` 上限
- `fps`（可选）：默认 `30`
- `canvasOrientation`：`"landscape" | "portrait"`；默认 `"landscape"`
- `safetyGuideVisible`（可选布尔）：默认 `false`
- 若未提供视频上下文，按 SRT 自身的时间戳长度推断 `videoDurationSec` = 最后一行 `end`。

## 9. 输出格式（manifest JSON）

**完整输出** = 一个 JSON 对象，schema 强制如下：

```jsonc
{
  "manifestVersion": "1.0",
  "generatedBy": "ai-motion-arranger/1",
  "theme": "dark",                   // 可选设计令牌，缺省 dark；见 references/design-tokens.md
  "skin": "tech-cyan",               // 可选设计令牌（配色主题包），缺省 tech-cyan
  "style": "glass",                  // 可选设计令牌（骨架），缺省 glass
  "font": "sans",                    // 可选设计令牌（字体栈），缺省 sans
  "fps": 30,
  "videoDurationSec": 19.4,
  "canvasOrientation": "landscape",
  "boards": [
    {
      "id": "board-001",                 // "board-" + 3 位序号，从 1 起
      "voiceSegmentId": "srt:1",         // 对应 SRT 行号；若合并多行则写成 "srt:1+srt:2"
      "voiceText": "...",                // 该 Board 对应的口播原文
      "voiceStartSec": 0.0,              // 段首秒
      "voiceEndSec": 1.6,                // 段尾秒
      "startFrame": 0,
      "endFrame": 48,
      "durationInFrames": 48,
      "board": {                         // Board 容器配置
        "anchor": "left-bottom",         // 见 §10 Anchor Enum
        "palette": {                     // 至少 1 个，最多 4 个；本板主调
          "accent": "violet",            // 取自 references/palette.md
          "support": "neutral"           // 可选；缺省为 "neutral"
        },
        "density": "balanced",           // 见 §10 Density Enum
        "rhythm": "staggered",           // 见 §10 Rhythm Enum
        "backgroundOpacity": 0.78        // 0–1，缺省 0.72；用于卡背景/阴影/模糊
      },
      "cards": [
        {
          "id": "MetricFocus",           // 严格使用 references/card-catalog.md 中的 id
          "props": {                     // 仅允许 catalog 中登记的字段
            "label": "关键指标",
            "value": 87,
            "unit": "%"
          }
        }
      ]
    }
  ],
  "selfCheck": {                         // 自检结果；AI 在最终回答前必须跑一遍 §12
    "cardIdsAllInCatalog": true,
    "colorTokensAllInPalette": true,
    "noBannedFields": true,
    "boardsWithinDuration": true,
    "palettesUsedCount": 3,
    "mainPalettesPerBoardDistinct": true
  }
}
```

禁止出现的顶层字段：`title`、`subtitle`、`code`、`tsx`、`react`、`import`、`export`、`x`、`y`、`width`、`height` 等任何渲染层字段。**唯一例外**：`theme` / `skin` / `style` / `font` 是顶层设计令牌（字符串枚举，见 references/design-tokens.md）；`style` 仅允许 `"glass" | "flat" | "outline" | "tile"` 四个字符串值之一，样式对象（如 `{"radius":8}`）仍然违法。

## 10. 枚举全集（hard constraint）

仅以下枚举值出现在 manifest 中。AI 必须逐字使用，禁止同义改写：

### Anchor Enum（Board 在画面的默认落点）

| 值 | 含义 |
| --- | --- |
| `left-bottom` | 左下矩形（默认） |
| `right-bottom` | 右下矩形 |
| `left-top` | 左上矩形 |
| `right-top` | 右上矩形 |
| `top-rail` | 顶部全宽横条（仅当 `cards[0].id === "ChapterBar"` 时允许） |
| `bottom-rail` | 底部全宽横条 |
| `center-stage` | 中央展板（封面/总结独占） |

### Density Enum（板内信息密度）

| 值 | 含义 | 允许 cards 上限 |
| --- | --- | --- |
| `sparse` | 1 张卡，巨大留白 | 1 |
| `balanced` | 2–3 张卡，主图+标签 | 3 |
| `rich` | 3–5 张卡，多元素组合 | 5 |

### Rhythm Enum（卡片间的进入节奏）

| 值 | 含义 |
| --- | --- |
| `single` | 同时进入一起离开 |
| `staggered` | 逐条错峰进入（默认；列表/对比/流程用这个） |
| `cascade` | 从主到辅瀑布式进入（封面或渐进式数据揭示用） |

### Palette Token

完全以 `references/palette.md` 为准。任何未在那里登记的字符串都视为非法。

### Design Token Enum（顶层设计令牌）

`theme` / `skin` / `style` / `font` 四个顶层字段的枚举全集以 `references/design-tokens.md` 为准：

| 令牌 | 枚举 | 管什么 |
| --- | --- | --- |
| `theme` | `dark` · `light` | 基调（深底/浅底） |
| `skin` | `tech-cyan` · `brand-amber` · `growth-lime` · `creative-violet` · `alert-rose` · `pro-neutral` | 配色主题（accent+support 预设包，决定未显式填色卡片的缺省色） |
| `style` | `glass` · `flat` · `outline` · `tile` | 骨架（圆角/描边/阴影/模糊） |
| `font` | `sans` · `serif` · `mono-tech` | 字体栈 |

skin 不豁免 palette 硬约束：accent 去重数 ∈ [2,4]、相邻 Board 换主调仍然生效。

## 11. 视频级硬规则

- 全视频至少出现 **3 类** Board（密度/节奏/锚点的组合多样性，或至少在 §12 自检里复核 `paletteUsedCount ≥ 2`）。
- 整支视频 palette token 总数 **≥ 2, ≤ 4**；不得所有 Board 都用同一主调。
- 任何重复 SRT 行（连续时间戳完全相同的行）**必须**合并为 1 个 Board。

## 12. AI 自检清单（输出前必跑）

按顺序执行，最后把每条结果写进 `selfCheck`：

1. **catalog 校验**：`boards[].cards[].id` 全部出现在 `references/card-catalog.md` 的 id 列里；不在的卡必须把这一行从 manifest 中剔除，不要伪造 schema。
2. **palette 校验**：扫描 `boards[].board.palette.*`、以及每张卡 `props` 里任何接受颜色的字段（如 `accentColor`、`secondaryColor`），token 全部来自 `references/palette.md`；任何字面颜色（非 token）立刻替换/剔除。
3. **字段白名单**：每张卡的 `props` 键必须在 catalog 中该 id 的 `props` 行里；否则抛错（强约束）。
4. **数值范围**：catalog 中声明 `min/max/step` 的字段必须落在范围内。
5. **时序对齐**：`startFrame / endFrame / durationInFrames` 必须由 `voiceStartSec / voiceEndSec / fps` 推导，三者一致。
6. **画布不超界**：所有 Board 的 `startFrame + durationInFrames` ≤ `videoDurationSec × fps`。
7. **多调色板**：统计 `boards[].board.palette.accent` 去重后的数量 ∈ [2, 4]。
8. **板数：1 段 = 1 板**：除非多行 SRT 显式合并到同一个 `voiceSegmentId`，否则每段口播至少 1 个 Board。

任一项不通过 → 在最终回答前改 manifest，并解释改了什么；不要把 `selfCheck` 字段写成与正文矛盾的状态。

除人工自检外，输出后应运行 lint 体检器做机械复核（它把上面 8 条全部自动化，并额外扫描颜色字面量与令牌枚举）：

```bash
node scripts/lint-manifest.mjs manifest.json
```

退出码 0 = 通过（可能带 warning）；1 = 存在 error，必须修正 manifest 后重跑。

## 13. 失败模式速查（避免常见错误）

- ❌ 给卡加 `x: 100`/`y: 200` 这种像素坐标 → 改用 `board.anchor`。
- ❌ 给文字卡加 `fontSize`/`color: "#fff"` → 删除，catalog 没暴露就不该填。
- ❌ 颜色 token 写错字段：`{ "color": "violet" }` 错（应使用 catalog 中暴露的名字，如 `accentColor` 或 `palette.accent`）；写 `{ "accentColor": "#8b5cf6" }` 也错（必须从 palette token 选，不写 hex）。
- ❌ 自己造新卡 id `MySuperCard` → 改用 catalog 里已有的等价卡，或剔除这段需求。
- ❌ 输出里出现 `style`、`position`、`transform` → 整段删除。
- ❌ 输出代码、TSX、JSX → 你的工作已经交给 `scripts/manifest-to-tsx.mjs`。
- ❌ 自检全部填 `true` 但实际违规 → 自检要诚实；任一失败都先改 manifest 再声称通过。

## 14. 后续链路（你不必执行，知道即可）

1. `node scripts/lint-manifest.mjs manifest.json` → 体检（error 必须清零）
2. `node scripts/manifest-to-tsx.mjs manifest.json > package.tsx` → TSX
3. `powershell -ExecutionPolicy Bypass -File scripts/import-to-studio.ps1 -FilePath package.tsx` → 导入工作台
4. 工作台按 protocol 自动激活组件、生成时间轴实例。用户在工作台里再做位置/时序微调。

## 15. 反馈循环

如果用户告诉你哪段口播编译后渲染不对，或者某个 Board 视觉过界，记下来回到本 Skill 的对应条款修订。下一次新会话前请同步更新：

- `references/card-catalog.md`（重新跑 `scripts/generate-card-catalog.mjs`）
- `references/palette.md`（如新增 token）
- 本文件（新增禁止条款或枚举值）
