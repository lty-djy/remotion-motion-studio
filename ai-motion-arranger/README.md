# AI 动效编排 Skill（ai-motion-arranger）

> 把一段 SRT 口播字幕编排成动效工作台的 manifest JSON。
> **AI 只做编排，不写代码。**

## 文件结构

```
ai-motion-arranger/
├── README.md                # 本文件
├── SKILL.md                 # AI 编排器主文档（请勿手改）
├── semantic-srt-arranger.mjs # 工作台内置的确定性 SRT 多意图路由器
├── avoidance-layout-planner.mjs # 已知人物/字幕安全区避让布局器
├── quality-control.mjs       # 五项确定性自动质检器
├── arrangement-batch.mjs    # 插入批次、语义组摘要与整批撤销
├── visual-script.schema.json # Visual Script 2.0 正式 JSON Schema
├── references/
│   ├── card-catalog.md      # 自动生成的卡片清单（AI 只能用这里登记的 id + props）
│   ├── palette.md           # 语义色板（AI 只能用这里登记的 token）
│   ├── design-tokens.md     # 顶层设计令牌：theme（基调）/ skin（配色）/ style（骨架）/ font（字体）
│   └── visual-script-v2.md  # 2.0 协议边界与校验说明
├── scripts/
│   ├── arranger-overlay.json        # 编排层注释（人类可读的语义）
│   ├── sync-runtime-registry.mjs    # 从真实运行时 registry 同步元数据与目录
│   ├── registry-meta.mjs            # 自动生成的技术字段，禁止手改
│   ├── generate-card-catalog.mjs    # 自动生成 references/card-catalog.md
│   ├── generate-built-in-audio.mjs  # 重建仓库自带的原创 WAV 资源
│   ├── build-resource-index.mjs     # 根据真实文件生成资源技术索引
│   ├── validate-resource-index.mjs  # 校验资源文件、哈希与索引一致性
│   ├── lint-manifest.mjs            # manifest 体检器：AI 自检清单的机械复核
│   ├── validate-visual-script.mjs   # Visual Script 2.0 schema + 语义校验
│   ├── test-visual-script.mjs       # Visual Script 2.0 正反样例回归
│   ├── test-semantic-srt-arranger.mjs # SRT 多意图与固定资源路由回归
│   ├── test-avoidance-layout.mjs # 横竖屏人物/字幕避让回归
│   ├── test-quality-control.mjs # 五项质检正反样例回归
│   ├── test-arrangement-batch.mjs # 插入批次与原时间线保护回归
│   └── manifest-to-tsx.mjs          # 把 manifest JSON 编译成 TSX（零 AI）
└── examples/
    ├── README.md
    ├── sample-srt.srt
    ├── sample-manifest.json
    ├── sample-visual-script-v2.json
    └── invalid-visual-script-v2.json
```

## Visual Script 2.0

`manifest 1.0` 继续服务现有 Board/Card 编译链路。新增的 Visual Script 2.0 是最终自动编排流程的上层内部协议，已覆盖一句多意图、多类视听表达、分段风格、避让布局、质检和确认后应用。详见 [`references/visual-script-v2.md`](references/visual-script-v2.md)。

```powershell
npm.cmd run validate:visual-script -- ai-motion-arranger/examples/sample-visual-script-v2.json
npm.cmd run test:visual-script
```

## 工作台内置 SRT 自动编排

编辑台顶部“AI 自动编排”现在使用 `semantic-srt-arranger.mjs` 逐句识别多个语义意图，并只引用当前真实效果库与固定资源索引中的 ID。首次选择 SRT 后会自动执行完整链路；字幕已经加载时，点击顶部入口即可一键重新编排。当前确定性路由覆盖性能、流程、代码自动化、对比、完成度、覆盖率、倒计时、重点和数字指标；单句最多保留 3 个意图，避免画面过载。普通寒暄等未命中明确视觉语义的字幕会跳过，不会被强行套模板。

生成结果只进入“编排预览”，默认全选但允许逐项取消；确认前不修改时间线，确认后也保留原有轨道。

确认插入后，工作台会保留每项的来源语义 ID 和本次编排批次 ID，并在时间线顶部显示“本次自动编排”微调条。用户可以按语义组定位、高亮并逐项编辑，也可以一次撤销本批插入；撤销只按批次 ID 删除新项目，不会触碰插入前的原时间线。

当前布局器会读取画幅、人工开启的“人物占位”和 SRT 底部字幕安全区，按语义首选落点依次尝试换位、缩小，并避开同一时间出现的其他视觉项。布局后会自动执行人物占位遮挡、字幕区遮挡、资源有效性、音效盖人声风险、时间线/画布边界五项确定性质检，并在编排预览中逐项显示；任一项失败时禁止确认插入。

这里的“人物”仍是已知中央占位区，不是真实人脸检测结果；关闭人物占位后该项会诚实保持“待检查”。“声音盖人声”也只是依据音量与人声闪避参数判断风险，不等同于真实响度或语音分析。

```powershell
npm.cmd run test:semantic-arranger
npm.cmd run test:avoidance-layout
npm.cmd run test:quality-control
npm.cmd run test:arrangement-batch
```

## 固定资源库

AI 只能引用 [`public/input/resource-index.json`](../public/input/resource-index.json) 中存在的 `library + resourceId`。真实文件与维护规则见 [`public/input/README.md`](../public/input/README.md)。

```powershell
npm.cmd run sync:resources
npm.cmd run validate:resources
```

`predev` / `prebuild` / `prestart` 和 Visual Script 校验前都会自动刷新索引，防止 manifest 与真实文件脱节。

## 两层架构

```
┌─ 卡片库层 · 资产 ─────────────────────────────────┐
│ 动效卡 = React 组件 + 运行时注册表（registry.ts）     │
│ 每张卡自带参数 schema → 工作台右栏面板自动生成        │
│ 设计系统 = CSS 变量令牌：skin 管配色，style 管骨架   │
└─────────────────────────────────────────────────┘
               ▲ 编译消费（manifest-to-tsx）
┌─ 编排层 · 大脑 ──────────────────────────────────┐
│ overlayJSON = { theme, skin, style, font,         │
│                 boards[] }                        │
│ AI Skill 读 SRT 出 JSON —— 唯一花 token 的一一步    │
│ lint-manifest.mjs 体检器做机械复核                  │
└─────────────────────────────────────────────────┘
```

## 验收标准

**新会话只丢 SRT、零额外说明，能直出可用 JSON。** 这是用户给项目的 hard 要求。

具体表现为：
1. AI 读 `SKILL.md` + `references/card-catalog.md` + `references/palette.md` + `references/design-tokens.md` 即可完整工作，无需追问用户。
2. AI 的输出是 manifest JSON（不是 TSX），覆盖给定的硬规则输出格式（见 SKILL §9）。
3. `node scripts/lint-manifest.mjs manifest.json` 体检通过（error=0）。
4. `node scripts/manifest-to-tsx.mjs manifest.json > package.tsx` 必须零错误生成；TSX 直接被工作台现有 `import-to-studio.ps1` 接受。

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
| 顶层设计令牌枚举封闭 | `ALLOWED_THEMES/SKINS/STYLES/FONTS`（编译器 + lint 双重校验） |
| 不写 TSX、JSX、CSS、SVG | SKILL §0 强调；manifest 输出层就只有 JSON |
| AI 看不到 component 实现 | catalog 只暴露 props/bounds，不暴露源码 |

## 维护时机

| 改了什么 | 同步动什么 |
| --- | --- |
| registry 新增/修改一张卡片 | 修改真实组件与 `registry.ts`；确认编译支持后增加 overlay → 运行 `npm.cmd run sync:registry` |
| 新增一种颜色语义 | `references/palette.md` §2/§3 + `scripts/manifest-to-tsx.mjs` 顶部 `ALLOWED_*_TOKENS` 同步 |
| 新增/修改 Board 锚点、密度、节奏枚举 | `SKILL.md` §10 + `scripts/manifest-to-tsx.mjs` 顶部 `ALLOWED_ANCHORS/DENSITY/RHYTHM` 同步 |
| 新增 theme/skin/style/font 令牌 | `references/design-tokens.md` + `scripts/manifest-to-tsx.mjs` 与 `scripts/lint-manifest.mjs` 顶部枚举/预设同步 |
| 新增编排层规则 | `SKILL.md` 全文改；`scripts/manifest-to-tsx.mjs` 校验逻辑同步 |

## 跟现有 Skill 的分工

- `remotion-motion-studio.SKILL.md` —— 给视频自由设计 Remotion 动效，生成可编辑 TSX。直接面向"创造新模板"。
- `ai-motion-arranger.SKILL.md`（本 Skill）—— 给定 SRT，编排已有标准卡的展示。直接面向"批量编排"。

两个 Skill 互不替代。当用户的需求是"想要一种新的视觉模板"，用前者；需求是"我有 30 段口播，先给我排个版"，用后者。

## 接入到工作台

用户入口已经内置为：

`AI 自动编排 → 选择 SRT（首次）→ 多意图语义分析 → 自动选择效果/图标/SFX → 自动避让 → 五项质检 → 编排预览 → 勾选确认 → 保留原时间线插入 → 按语义组人工微调或整批撤销`

当前阶段不对导入视频执行语音识别：没有字幕时会明确要求选择对应 SRT，不会把“已导入视频”误报成“字幕已生成”。视频自动转字幕留给后续独立步骤接入。

Visual Script、时间线 JSON 和资源索引都作为内部实现细节，不要求用户手写或手动导入。旧的 manifest → TSX 编译链仍可用于离线批量编排和兼容已有工具。
