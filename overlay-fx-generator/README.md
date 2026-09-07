# overlay-fx-generator · 动效编排大脑（工作台版）

把一段 SRT 口播字幕编排成工作台可直接导入的**编排 JSON**（timeline JSON）。
**AI 只做编排，不写代码。**

```
SRT ──> overlay-fx-generator（本 Skill，AI 编排大脑）
          │  先分段脚本，再配组件；密度/多样性/卡点硬规则
          ▼
     <视频名>-overlay-fx.timeline.json
          │  npm.cmd run lint:arrangement（机械体检，error 必须清零）
          ▼
     工作台「载入AI大模型编排JSON」导入
          │  确定性代码：格式校验、预览、质检展示、确认插入
          ▼
     编排预览（可按语义段替换/锁定/取消勾选）→ 插入时间线 → 人工微调
```

## 文件结构

```
overlay-fx-generator/
├── SKILL.md                      # 编排大脑主文档（新会话从这里开始）
├── README.md                     # 本文件
├── lint-rules.default.json       # lint 阈值（公共默认）
├── 我的偏好.default.md            # 出厂中性取值表（升级会覆盖，不要手改）
├── STATUS.template.md            # 每期状态接力模板（复制到素材目录改名 STATUS.md）
├── references/
│   ├── component-catalog.md      # 组件目录（自动生成：40 个组件的 props 白名单/落位/触发词）
│   └── timeline-json.md          # 编排 JSON 输出格式规范 + 字段说明
├── scripts/
│   ├── generate-component-catalog.mjs  # 从真实 registry 生成组件目录
│   └── lint-arrangement-json.mjs       # 编排 JSON 体检器
└── examples/
    ├── sample-srt.srt                       # 示例 SRT
    ├── sample-arrangement.timeline.json     # 示例编排（lint 全绿）
    └── build-sample.mjs                     # 示例生成脚本（改样例后重新运行）
```

## 常用命令

```powershell
npm.cmd run lint:arrangement -- <编排.json> [--duration 视频秒数]   # 体检
npm.cmd run sync:arranger-catalog                                  # registry 变了刷新组件目录
npm.cmd run prompt:web -- <SRT路径> [--out 输出.txt]               # 打包网页版 GPT 编排提示词
```

组件目录也会随 `predev` / `prebuild` / `prestart`（`sync:registry` 链）自动刷新；
个人偏好沉淀在 `我的偏好.md` / `经验规则.md` / `lint-rules.local.json`（第一次「学一下」时生成）。

## 与 ai-motion-arranger 的关系

- `overlay-fx-generator/`（本目录）是**编排大脑**：决定用哪个组件、什么内容、什么时序。
- `ai-motion-arranger/` 降级为**确定性引擎**：避让布局、五项质检、插入批次、资源索引、
  字幕语义路由等工作台内置能力的实现；其旧版 Skill（关键词路由选组件）已下线，
  工作台「SRT导入」现在只生成字幕语义动画轨，不再本地选组件。
