# AI 编排规则库

`rule-manifest.json` 是工作台 AI 自动编排规则的项目级长期存储文件。

- 在“编排规则”界面新建、切换、改名或调整规则时，工作台会自动写回该文件。
- `activeRuleId` 决定下一次 AI 自动编排调用哪条规则。
- `componentScores` 记录用户最终确认插入或取消的组件偏好。
- 整个 `arrangement-rules` 目录可以纳入 Git、备份，或复制到另一份工作台复用。
- 浏览器 `localStorage` 只用于旧版本迁移和临时缓存，不再是规则的唯一来源。

手动修改 JSON 时请保持规则 ID 唯一，并使用六位十六进制颜色，例如 `#68e8ff`。
