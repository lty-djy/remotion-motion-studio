# MEMORY

## ai-motion-arranger Skill

**目的**：把 SRT 口播字幕编排成动效工作台 manifest JSON；零 AI 写代码、零猜测空间。

**位置**：`./ai-motion-arranger/`

**核心工作流**：`SRT → AI 编排（manifest.json） → scripts/manifest-to-tsx.mjs（确定性）→ package.tsx → 工作台 import-to-studio.ps1`

**关键约束（hard）**：
- AI 只输出 manifest JSON，从不写 TSX / JSX / CSS / SVG
- 卡片 id 来自 `references/card-catalog.md`（自动生成）；不允许捏造
- 颜色字段只填 `references/palette.md` 的 token（13 个：8 accent + 5 support），不许 hex/hsl/oklch/命名色
- 一段口播 = 一个 Board；Board 决定 palette/density/rhythm/anchor/backgroundOpacity
- 整段视频主调去重 ∈ [2, 4]；相邻 Board 主调不同
- 同 Board 多张卡共享同一 backgroundOpacity
- 顶层设计令牌 theme/skin/style/font 只能填 `references/design-tokens.md` 的枚举（两层架构：卡片库层=组件+schema+CSS变量令牌，skin 管配色 style 管骨架；编排层=overlayJSON 大脑，lint 体检器机械复核）

**数据同步链路**：
- 修改 `effects/*.tsx` 或 `legacy-effects.tsx` → 同步 `scripts/registry-meta.mjs` + `scripts/arranger-overlay.json` → `node scripts/generate-card-catalog.mjs`
- 新增 token → `references/palette.md` + `scripts/manifest-to-tsx.mjs` 顶部 `ALLOWED_*_TOKENS`
- 新增设计令牌 → `references/design-tokens.md` + `manifest-to-tsx.mjs` / `lint-manifest.mjs` 顶部枚举与预设同步

**TSX 编译细节**：工作台 `local-vite.config.ts` 的安全校验拒绝非 react/remotion 的 import；`manifest-to-tsx.mjs` 用 `normalizeForInline` strip + IIFE 闭包，把 `effects/use-raf-progress.ts` + `LegacyMetricEffects.tsx` + `ChapterBar.tsx` 的源码内联进 package.tsx。

**当前可用卡**：14 metric（SpeedGauge / CounterTicker / StatGrid / ProgressRing / DeltaBadge / Countdown / MetricBar / SegmentedMeter / DualMetricBar / FlipCounter / WaveformMetric / LiquidGauge / RadialTicks / PulseMetric）+ ChapterBar。其它 7 大类（chart / text / media / structure / tech / spatial / brand）暂空架子，等注册新组件。

## 项目边界

**AI 动效工作台**：本地 Remotion 工作台；导入 TSX 动效清单包 + 视频，在画布拖动组件位置；导出 MP4。

**两个 Skill 分工**：
- `remotion-motion-studio.SKILL.md` —— 创建新视觉模板（生成 TSX）
- `ai-motion-arranger.SKILL.md` —— 批量编排已有模板（生成 manifest）

**当前用户偏好（推断，需要验证）**：
- 偏好"容器感"而非"卡片对齐"
- 偏好"语义色板"而非"自由色"
- 偏好"AI 不写代码，纯编排"

## 已知约束

- 工作台 `import-to-studio.ps1` 是 TSX → 安全导入入口；任何修复都要走同一通道
- 工作台 `local-render-entry-v2.tsx` 的 propsSchema 字段期望 JSON-serializable
- LegacyMetricEffect 通过 `componentType` prop 决定 14 个 metric 卡的不同视觉

## 编排预览替换/新增的 SRT 文案回填（local-main-v2.tsx）

- `fillArrangementTextPropsFromSrt`：主文案键 ← 整句 SRT；eyebrow/label/tag/caption ← semanticLabel；subtitle/detail/note ← 第 2 子句；序号条目（risk1/step1/item1…白名单 base）← 标点子句依次分发
- 合并顺序：defaults < srtFill < compatibleProps（仅用户改过的键，≠旧默认值）< candidate.props
- 替换/新增候选池 = 语义推荐（arranger 预填 props）+ 全库备选（topUpSemanticCandidates，props 空，靠 srtFill 回填）
