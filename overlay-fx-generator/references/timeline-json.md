# 编排 JSON 输出格式（工作台 timeline JSON）

这是 overlay-fx-generator 唯一的输出格式。工作台在「载入AI大模型编排JSON / 选择 JSON 文件」入口
按此格式解析（`local-main-v2.tsx` 的 `importTimelineJson`），字段名必须逐字一致。

完整可运行样例见 [`../examples/sample-arrangement.timeline.json`](../examples/sample-arrangement.timeline.json)
（配合 [`sample-srt.srt`](sample-srt.srt) 生成）。

## 顶层字段

```jsonc
{
  "generatedBy": "overlay-fx-generator/1",
  "sourceSrt": "视频名.srt",
  "canvas": { "width": 1080, "height": 1920, "orientation": "portrait" },
  "fps": 30,
  "durationInFrames": 1740,          // 覆盖视频总帧数（= 秒 × fps），供越界校验
  "motionTimeline": [ ... ],         // 动效项（必填，与 resourceTracks 至少一个非空）
  "resourceTracks": [ ... ],         // 图标 / 素材 / 音效（可选）
  "semanticAnalysis": { ... },       // 语义分析（可选，强烈建议提供）
  "qualityControl": { ... }          // 质检结果回填（可选）
}
```

- `canvas.orientation`：`portrait`（1080×1920）或 `landscape`（1920×1080）。竖屏口播默认 portrait。
- `fps` 默认 30。帧换算：`startFrame = floor(秒 × fps)`，`durationInFrames = max(3, ceil(end×fps) − startFrame)`。

## 动效项（motionTimeline[]）

```jsonc
{
  "componentId": "PortraitRiskWarning",   // 必填；只能用 references/component-catalog.md 登记的 id
  "startFrame": 294,                       // 必填；非负
  "durationInFrames": 300,                 // 必填；> 0
  "laneId": "semantic",                    // 可选；语义分组名（时间线分轨显示用）
  "trackOrder": -20,                       // 可选；省略时工作台自动分配
  "position": { "x": 58, "y": 292, "scale": 1 }, // 可选；省略 = 组件目录默认落位
  "props": { ... },                        // 只能填目录里该组件登记的字段
  "sourceExpressionId": "intent-risk-roots", // 可选；来源语义段 id
  "sourceIntentId": "intent-risk-roots"      // 可选；与 semanticAnalysis 的 intent id 对应
}
```

硬规则：

1. **componentId 白名单**：目录里没有的 id 导入直接报错。
2. **props 白名单**：props 的每个键必须出现在目录中该组件的「可编排 props」里；lint 会按字段逐个核对。
3. **不要发明像素坐标**：`position` 省略时用组件默认落位；需要错开时参考目录里的默认落位做整卡平移，不要手写一堆新坐标。
4. **颜色 props 默认不填**：组件自带调试好的配色，工作台导入时会用用户已调好的主色自动覆盖。只有用户点单指定颜色时才填。
5. 常驻组件：`ChapterBar`（贴顶章节条）与 `FocusCamMove`（运镜）全程在场，不参与密度/多样性统计；`SrtSemanticCaptions` 是字幕轨（见下）。

## 字幕轨（每期一条）

SRT 字幕语义动画由一条 `SrtSemanticCaptions` 实例承载，`startFrame: 0` 到视频结尾：

```jsonc
{
  "componentId": "SrtSemanticCaptions",
  "startFrame": 0,
  "durationInFrames": 1740,
  "laneId": "caption",
  "backgroundOpacity": 0,
  "props": {
    "enabled": true,
    "showIcon": false,
    "cuesJson": "[{\"index\":1,\"start\":0,\"end\":3.2,\"text\":\"...\",\"semanticKey\":\"number\",\"keyword\":\"二十个\"}, ...]",
    "timeOffset": 0
  },
  "sourceExpressionId": "srt-caption-track",
  "sourceIntentId": "srt-caption-track"
}
```

- `cuesJson` 是**字符串**（数组 JSON.stringify 的结果）。每个 cue：`index`（SRT 序号）、`start`/`end`（秒）、`text`（SRT 原句）、`semanticKey`、`keyword`（本句强调词，可选）。
- `semanticKey` 只能用这些值：`chapter-transition` `info-callout` `metric-decision` `process-steps` `risk-boundary` `next-episode-cta` `performance` `process` `automation` `comparison` `completion` `coverage` `deadline` `emphasis` `number`。
- 字幕开关由工作台编排预览控制；关闭时只有字幕轨不插入，其余动效照常。

## 资源轨道（resourceTracks[]）

```jsonc
{
  "kind": "sfx",                       // icon | material | sfx
  "resourceId": "whoosh-soft",         // 必须存在于 public/input/resource-index.json
  "name": "结尾轻扫音",
  "laneId": "sfx",
  "startFrame": 1560,
  "durationInFrames": 45
}
```

`resourceId` 必须真实存在（lint 与导入都会校验）；音效时长注意不要盖住人声。

## 语义分析（semanticAnalysis，建议提供）

提供后工作台的编排预览支持「按语义段定位 / 只替换当前段 / 追加效果」：

```jsonc
{
  "cueCount": 17,
  "cueAnalyses": [
    {
      "cueIndex": 4,
      "text": "第一个根因：目标不清，工具替你定目标",
      "sourceCueIndices": [4, 5, 6],
      "intents": [
        {
          "id": "intent-risk-roots",
          "label": "风险提醒",
          "type": "warning",
          "signals": [{ "type": "keyword", "label": "根因" }],
          "componentCandidates": [
            { "componentId": "PortraitRiskWarning", "rank": 1, "reason": "三个根因逐条落卡", "props": {} },
            { "componentId": "PortraitPromptMistakeDiagnosis", "rank": 2, "reason": "备选", "props": {} }
          ]
        }
      ]
    }
  ]
}
```

- `type` 用工作台内置语义：`emphasis` `metric` `comparison` `list` `process` `explanation` `warning` `evidence` `transition` `call-to-action`。
- `intent.id` 要与对应动效项的 `sourceIntentId` 一致。
- `componentCandidates` 是该语义段的备选组件（含落选方案），供用户在预览里一键替换。

## 质检回填（qualityControl，建议提供）

```jsonc
{
  "status": "pending",
  "checks": [
    { "type": "face-occlusion", "status": "pending", "affectedExpressionIds": [], "message": "需结合实际人物画面确认脸部避让。" },
    { "type": "caption-occlusion", "status": "pending", "affectedExpressionIds": [], "message": "底部字幕安全区已预留，需结合实际视频确认。" },
    { "type": "asset-availability", "status": "passed", "affectedExpressionIds": [], "message": "…" },
    { "type": "voice-masking", "status": "passed", "affectedExpressionIds": [], "message": "…" },
    { "type": "timeline-bounds", "status": "passed", "affectedExpressionIds": [], "message": "…" }
  ]
}
```

`status` 只能是 `passed` / `failed` / `pending`。人物遮挡与字幕遮挡无法离线确认时诚实写 `pending`，
不要为了好看填 `passed`。

## 交付前自检

```powershell
npm.cmd run lint:arrangement -- overlay-fx-generator/examples/sample-arrangement.timeline.json
```

error 必须清零；warning 逐条自查。详见 SKILL.md「lint 自检」一节。
