# 指标组件维护说明

当前工作台实际注册的指标组件、标准 ID、可编辑参数与 AI 编排状态，统一以自动生成的 [`remotion-motion-studio.component-catalog.md`](./remotion-motion-studio.component-catalog.md) 为准。

本文件不再维护第二份指标 ID 或参数清单，避免已删除、尚未实现或参数协议不同的组件继续被误认为工作台内置类型。

新增或修改指标组件时：

1. 在真实组件定义及 `registry.ts` 中完成运行时注册。
2. 只有确定性 manifest 编译器已经支持的组件，才声明 `arranger.compiler`。
3. 为 AI 可编排组件补充 `ai-motion-arranger/scripts/arranger-overlay.json` 语义注释。
4. 运行 `npm.cmd run sync:registry` 自动刷新技术元数据和组件目录。

组件未进入自动生成目录前，只能作为自定义 TSX 包导入，不能在 Skill、示例或提示词中声称它是工作台标准类型。
