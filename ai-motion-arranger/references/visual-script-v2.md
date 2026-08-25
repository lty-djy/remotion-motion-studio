# Visual Script 2.0

Visual Script 2.0 是工作台内部协议，用户不需要手写、导入或理解它。

它要把一次自动编排的关键决策放在同一份 JSON 里：

` 来源字幕 → 多个语义意图 → 效果/图标/素材/音效 → 段落风格与节奏 → 避让布局 → 质检 → 确认后插入时间线 `

## 与 manifest 1.0 的关系

- `manifest 1.0` 仍供现有 Board/Card 编译器使用，本阶段不改它。
- `Visual Script 2.0` 是未来 AI 自动编排和时间线插入器共用的上层协议。
- 后续编译器可以把 `effect` 表达转成现有 MotionInstance，其他表达转成图标、素材、字幕和音频轨道项。

## 关键边界

- `segments[].intents[]` 允许同一句字幕拆出多个意图。
- `expressions[]` 通过 `intentId` 回指意图，一个意图可同时对应多个效果、图标、素材或音效。
- 效果只写已注册 `componentId` 和白名单 props；资源只写 `library + resourceId`，不写本机路径。
- 布局只表达锚点、大小意图和避让目标，不由 AI 直接生成 x/y 像素。
- 风格放在每个语义段内，允许按章节更换，不强制整支视频只用一套。
- `qualityControl` 记录确定性质检结果，不再使用 AI 自报的布尔 `selfCheck`。
- `applyPolicy` 强制先预览、必须用户确认、保留现有时间线。

## 固定资源根目录

`project.resourceCatalog.root` 固定为 `public/input`。下一阶段会建立实际索引，分为：

- `icons`
- `materials`
- `sfx`
- `bgm`

资源清单位于 `public/input/resource-manifest.json`，技术索引位于 `public/input/resource-index.json`。Visual Script 校验器会确认索引版本、资源库类型和资源 ID 都存在；`npm.cmd run validate:resources` 则进一步确认文件、哈希、大小与媒体信息没有漂移。

## 校验

```powershell
npm.cmd run validate:visual-script -- ai-motion-arranger/examples/sample-visual-script-v2.json
npm.cmd run test:visual-script
```

校验分两层：

1. JSON Schema：类型、必填字段、枚举、禁止额外字段。
2. 语义校验：唯一 ID、意图证据必须来自字幕、表达回指、时序边界、效果 registry/props、资源库匹配、质检状态一致性。
