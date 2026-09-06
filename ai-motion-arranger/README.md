# ai-motion-arranger · 确定性编排引擎

> **编排大脑已迁移**：SRT → 编排 JSON 的 AI 编排规则现在由 [`../overlay-fx-generator/SKILL.md`](../overlay-fx-generator/SKILL.md)
> 提供（沿用 Overlay Studio 的分段场景制方法论，组件库为本工作台真实效果库）。
> 本目录降级为**确定性引擎**：工作台内置的避让布局、五项质检、插入批次、字幕语义路由、
> 资源索引与离线 manifest 编译链路的实现都在这里。**AI 编排不再使用本目录的关键词路由选组件。**

## 文件结构

```
ai-motion-arranger/
├── README.md                # 本文件
├── semantic-srt-arranger.mjs    # 字幕语义路由器：现仅为「SRT导入」生成字幕轨的 semanticKey 标注服务
├── portrait-semantic-routes.mjs # 竖屏口播语义路由表（字幕轨语义标注 + 历史测试）
├── avoidance-layout-planner.mjs # 已知人物/字幕安全区避让布局器（确定性，工作台内置编排使用）
├── quality-control.mjs         # 五项确定性自动质检器
├── arrangement-batch.mjs       # 插入批次、语义组摘要与整批撤销
├── srt-semantic-merger.mjs     # SRT 语义段合并
├── built-in-icon-catalog.mjs   # 内置图标目录
├── visual-script.schema.json   # Visual Script 2.0 正式 JSON Schema
├── references/                 # palette.md / design-tokens.md / component-semantic-capabilities.md 等
├── scripts/                    # 资源索引、registry 同步、lint-manifest、manifest-to-tsx、测试
└── examples/                   # 样例 SRT / manifest / timeline JSON
```

## 在新链路里的位置

```
SRT ──> overlay-fx-generator（AI 编排大脑，产出编排 JSON）
          │
          ▼
工作台「载入AI大模型编排JSON」导入 ── 编排预览（本引擎的批次/质检结构承载）
SRT导入入口 ──> semantic-srt-arranger（仅做字幕 semanticKey 标注）──> 字幕语义动画轨
```

- **工作台「SRT导入」**：只生成 SRT 字幕语义动画轨（逐句 `semanticKey` 高亮路由），
  不再用本地规则自动挑选效果组件——组件选择全部由 overlay-fx-generator 编排 JSON 承载。
- **工作台「载入AI大模型编排JSON」**：解析 `motionTimeline` / `resourceTracks` /
  `semanticAnalysis` / `qualityControl`，进入编排预览；确认插入由本目录的
  `arrangement-batch.mjs` 打批次、支持整批撤销。
- **离线 manifest → TSX 编译链**（`lint-manifest.mjs` / `manifest-to-tsx.mjs` /
  `references/card-catalog.md`）保留用于兼容旧工具与离线批量编排，不是新编排的必经路径。

## Visual Script 2.0

`manifest 1.0` 继续服务现有 Board/Card 编译链路。Visual Script 2.0 是内部上层协议，
已覆盖一句多意图、多类视听表达、分段风格、避让布局、质检和确认后应用。
详见 [`references/visual-script-v2.md`](references/visual-script-v2.md)。

```powershell
npm.cmd run validate:visual-script -- ai-motion-arranger/examples/sample-visual-script-v2.json
npm.cmd run test:visual-script
```

## 固定资源库

AI 只能引用 [`public/input/resource-index.json`](../public/input/resource-index.json) 中存在的 `library + resourceId`。真实文件与维护规则见 [`public/input/README.md`](../public/input/README.md)。

```powershell
npm.cmd run sync:resources
npm.cmd run validate:resources
```

`predev` / `prebuild` / `prestart` 和 Visual Script 校验前都会自动刷新索引，防止编排与真实文件脱节。

## 回归测试

```powershell
npm.cmd run test:semantic-arranger
npm.cmd run test:semantic-capabilities
npm.cmd run test:avoidance-layout
npm.cmd run test:quality-control
npm.cmd run test:arrangement-batch
npm.cmd run test:portrait-routes
npm.cmd run test:srt-merge
npm.cmd run test:timeline-v2
```

## 维护时机

| 改了什么 | 同步动什么 |
| --- | --- |
| registry 新增/修改一张卡片 | 修改真实组件与 `registry.ts`；运行 `npm.cmd run sync:registry` 和 `npm.cmd run sync:arranger-catalog`（刷新两份组件目录） |
| 新增/修改避让锚点、质检规则 | `avoidance-layout-planner.mjs` / `quality-control.mjs` + 对应 test |
| 新增编排层编辑规则 | 改 `../overlay-fx-generator/SKILL.md` 与 `lint-rules.default.json` |
