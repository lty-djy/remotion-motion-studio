# AI 动效编排 Skill（ai-motion-arranger）

> 把一段 SRT 口播字幕编排成动效工作台的 manifest JSON。
> **AI 只做编排，不写代码。**

## 文件结构

```
ai-motion-arranger/
├── README.md                # 本文件
├── SKILL.md                 # AI 编排器主文档（请勿手改）
├── references/
│   ├── card-catalog.md      # 自动生成的卡片清单（AI 只能用这里登记的 id + props）
│   └── palette.md           # 语义色板（AI 只能用这里登记的 token）
├── scripts/
│   ├── arranger-overlay.json        # 编排层注释（人类可读的语义）
│   ├── registry-meta.mjs            # 技术字段（propsSchema/defaultProps/bounds）
│   ├── generate-card-catalog.mjs    # 自动生成 references/card-catalog.md
│   └── manifest-to-tsx.mjs          # 把 manifest JSON 编译成 TSX（零 AI）
└── examples/
    ├── README.md
    ├── sample-srt.srt
    └── sample-manifest.json
```

## 验收标准

**新会话只丢 SRT、零额外说明，能直出可用 JSON。** 这是用户给项目的 hard 要求。

具体表现为：
1. AI 读 `SKILL.md` + `references/card-catalog.md` + `references/palette.md` 即可完整工作，无需追问用户。
2. AI 的输出是 manifest JSON（不是 TSX），覆盖给定的硬规则输出格式（见 SKILL §9）。
3. `node scripts/manifest-to-tsx.mjs manifest.json > package.tsx` 必须零错误生成；TSX 直接被工作台现有 `import-to-studio.ps1` 接受。

## 工作流

```
  SRT ─┐
       ▼
  ┌──────────────────┐
  │  AI 编排器        │  ← ai-motion-arranger.SKILL.md
  │  (本 Skill)       │
  └────────┬─────────┘
           │ manifest.json
           ▼
  ┌──────────────────┐
  │ manifest-to-tsx  │  ← scripts/manifest-to-tsx.mjs（确定性、零 AI）
  └────────┬─────────┘
           │ package.tsx
           ▼
  ┌──────────────────┐
  │ 动效工作台       │  ← import-to-studio.ps1
  └──────────────────┘
```

每一步的边界都强制：
- AI 只决定**用哪张卡 + 哪些 prop + 什么时序**；
- manifest-to-tsx 是确定性转换，零猜测空间；
- 工作台原生接口（导入 TSX、激活组件、用户拖动布局）保持不变。

## 核心约束

| 约束 | 实现位置 |
| --- | --- |
| 卡片 id 不允许捏造 | `references/card-catalog.md`（自动生成，对账 registry） |
| 卡片 props 字段不允许扩展 | 同上，每张卡 props 行即白名单 |
| 颜色只能是 token，不写 hex | `references/palette.md` + `manifest-to-tsx.mjs` 校验 |
| 一段口播对应一块 Board | `manifest-to-tsx.mjs` 校验 board 计数与时序 |
| Board 内卡片密度有上限 | 校验 `density → maxCards`（sparse=1, balanced=3, rich=5） |
| 相邻 Board 主调不同 | 校验 `prevAccent === accent` 不允许 |
| 整段视频主调去重 ∈ [2, 4] | 校验 `mainPaletteSet.size` |
| 调色板 token 字典封闭 | `ALLOWED_ACCENT_TOKENS` / `ALLOWED_SUPPORT_TOKENS` |
| 不写 TSX、JSX、CSS、SVG | SKILL §0 强调；manifest 输出层就只有 JSON |
| AI 看不到 component 实现 | catalog 只暴露 props/bounds，不暴露源码 |

## 维护时机

| 改了什么 | 同步动什么 |
| --- | --- |
| registry 新增/修改一张卡片 | `scripts/registry-meta.mjs` 加/改 + `scripts/arranger-overlay.json` 加一行 → 重跑 `generate-card-catalog.mjs` |
| 新增一种颜色语义 | `references/palette.md` §2/§3 + `scripts/manifest-to-tsx.mjs` 顶部 `ALLOWED_*_TOKENS` 同步 |
| 新增/修改 Board 锚点、密度、节奏枚举 | `SKILL.md` §10 + `scripts/manifest-to-tsx.mjs` 顶部 `ALLOWED_ANCHORS/DENSITY/RHYTHM` 同步 |
| 新增编排层规则 | `SKILL.md` 全文改；`scripts/manifest-to-tsx.mjs` 校验逻辑同步 |

## 跟现有 Skill 的分工

- `remotion-motion-studio.SKILL.md` —— 给视频自由设计 Remotion 动效，生成可编辑 TSX。直接面向"创造新模板"。
- `ai-motion-arranger.SKILL.md`（本 Skill）—— 给定 SRT，编排已有标准卡的展示。直接面向"批量编排"。

两个 Skill 互不替代。当用户的需求是"想要一种新的视觉模板"，用前者；需求是"我有 30 段口播，先给我排个版"，用后者。

## 接入到工作台

工作台现有的导入入口是：

```bash
powershell -ExecutionPolicy Bypass -File scripts/import-to-studio.ps1 -FilePath package.tsx
```

本 Skill 输出的 manifest JSON 经过 `scripts/manifest-to-tsx.mjs` 编译后调用同一接口，**工作台代码零改动**。

后续如果需要一键 "SRT → 入工作台"，可加一个：

```bash
# examples/sample-srt.srt → ai-motion-arranger manifest 编排 → package.tsx → 工作台激活
node scripts/srt-to-studio.mjs examples/sample-srt.srt
```

这是一个一站式入口脚本，方便但不必要。本目录先专注编排 SKILL 本身。
