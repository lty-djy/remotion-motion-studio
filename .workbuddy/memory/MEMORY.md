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

## 组件渲染的透明底色（像素级规则）

- 外层渲染壳 `card-background-control.ts` 的 `.studio-card-render-shell` CSS 只把**组件根节点**的
  background / box-shadow 置为透明；组件内部元素的底色与 `box-shadow` 会原样输出到成品。
  → 素材/图片层禁止加矩形 `boxShadow`（在透明素材下会变成深色底座）。
- `OffthreadVideo` 不带 `transparent` 时，渲染期抽帧丢 Alpha：带透明通道的视频会被渲染成整块不透明矩形
  （实测盒内不透明像素 = 整个卡片盒）。素材型组件应统一 `transparent`。
- **像素回归怎么做**：流程、断言三件套、最小可用代码（PNG Alpha 解码器 + 三级脚本骨架 + fixtures 生成）
  与全部踩坑都收在技能 `.agents/skills/effect-still-alpha-qa/SKILL.md`。
  落地目录 `artifacts/gig-alpha/` 已于 2026-09-22 按要求删除；需要时按技能里的骨架重建（无代码依赖，删留都不影响组件）。
- **三级验证缺一不可**（组件级通过 ≠ 成片干净）：
  - 组件级 —— 自建 entry 注册多 Composition + `renderStill`；
  - 入口级 —— `bundle({entryPoint:"local-render-entry-v2.tsx"})` 渲 `ImportedMotion` 静帧，隔离「画面脏」与「封装脏」；
  - 链路级 —— 真实 POST `/api/render` + 产物 `.mov` 抽帧断言（服务需在线）。
  - 服务端渲染完就 `rmSync` 掉 `.frames-<jobId>`，只能从 `.mov` 用 ffmpeg `-pix_fmt rgba` 抽帧再断言；
    别只信 `alphaextract` 的可视化图，必须看数值分档。
- **阴影 vs 遮罩的判别**：都是「矩形底色」，但阴影的 alpha 随离盒距离**单调衰减**，
  遮罩/底色面板是整片**平台值**（`strength 0.32` → alpha≈82）。这决定该改组件还是改遮罩。
- **隐藏默认层**：`CardMaskLayer` 对 `cardMask` 缺省判为 `enabled: true`，会画全画布
  `rgba(0,0,0,0.32)`。外部/历史/编排 payload 必须显式写 `cardMask: { enabled: false }`
  （工作台内实例由 `createInstance` 带 `DEFAULT_CARD_MASK_NEW`，默认关闭）。
- **导出浏览器的资源地址必须是工作台源**：`local-vite.config.ts` 的 `/api/render` 用
  `normalizeLocalMediaUrlsDeep` 把 `localhost|127.0.0.1:(3000|3001|41735)` 和 `/api/...` 相对路径
  统一改写到 `http://127.0.0.1:41735`，并递归处理 `cardsJson` 这类「JSON 存在字符串里」的字段。
  历史导出失败报 `Error loading image with src: http://localhost:3000/...` 就是这条链路。

## 编排预览替换/新增的 SRT 文案回填（local-main-v2.tsx）

- `fillArrangementTextPropsFromSrt`：主文案键 ← 整句 SRT；eyebrow/label/tag/caption ← semanticLabel；subtitle/detail/note ← 第 2 子句；序号条目（risk1/step1/item1…白名单 base）← 标点子句依次分发
- 合并顺序：defaults < srtFill < compatibleProps（仅用户改过的键，≠旧默认值）< candidate.props
- 替换/新增候选池 = 语义推荐（arranger 预填 props）+ 全库备选（topUpSemanticCandidates，props 空，靠 srtFill 回填）
