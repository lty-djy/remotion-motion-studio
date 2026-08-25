# 动效组件预览台（本地开源版）

一个只在本机运行的 Remotion 动效工作台：导入原视频和符合清单协议的 TSX 动效包后，可在画布中移动、缩放、框选、复制和删除组件；在多轨时间轴中调整出现时间、时长和轨道位置；最后在本机渲染 MP4。

本项目解决的核心问题是：AI 很会生成动效源码，但位置、出现时间和画面节奏的微调，不应该每次都靠口述改代码和长时间重新渲染。AI 负责生成，人直接在工作台完成最后调整。

## 主要能力

- 导入本地视频，按视频真实时长播放，保留原声且不循环；
- 导入自包含的 Remotion TSX 动效包，支持 `MOTION_COMPONENTS` 与 `MOTION_TIMELINE` 多组件清单；
- 导入 Timeline v2 JSON，把固定效果、图标、图片/录屏、音效和 BGM 作为独立轨道项；
- 资源轨道支持预览、显隐、移动、裁剪、排序、删除，并可微调画面位置/缩放或音量/人声避让；
- 画布内单选、框选、多选移动、缩放、复制、删除；
- 时间轴播放头、拖动组件条、左右裁剪，最短时长 0.1 秒；
- 根据参数协议编辑文字、数值、颜色、开关、位置、缩放和背景透明度；
- 保存命名项目、自动草稿、导入历史与本地 MP4 渲染进度；
- 内置组件目录与未知类型组件的清单驱动兼容。

## 快速启动（Windows）

1. 安装 Node.js 20 或更新版本。
2. 在本目录打开 PowerShell，执行：

   ```powershell
   npm install
   npm run start
   ```

3. 浏览器打开 `http://127.0.0.1:41735`。

安装完成后，也可以双击 `local-launcher.cmd` 启动。服务只监听本机 `127.0.0.1`，不会公开到互联网。

## 导入 AI 生成的动效

在左侧点击“导入 Remotion TSX”，或在工作台已启动后执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\import-to-studio.ps1 -FilePath "C:\你的文件\MotionPackage.tsx"
```

生成协议见 [remotion-motion-studio.protocol.md](./remotion-motion-studio.protocol.md)，可直接发给任意 AI。模板见 [remotion-motion-studio.manifest-template.tsx](./remotion-motion-studio.manifest-template.tsx)。

协议要求单文件 TSX 只导入 `react` 与 `remotion`，导出 `MOTION_COMPONENTS` 和 `MOTION_TIMELINE`；每个组件都声明自身边界、默认参数与时间轴实例。默认应透明无边框，所有视觉内容必须限制在自身矩形边界内。

## 目录说明

- `local-main-v2.tsx`：工作台主界面与编辑交互；
- `local-vite.config.ts`：本地 API、安全导入与 Remotion 渲染；
- `local-builtins.tsx`：内置组件目录；
- `local-protocol.ts`：清单协议解析与兼容层；
- `local-render-entry-v2.tsx`：导出 MP4 的 Remotion 入口；
- `public/input/resource-index.json`：固定资源 ID 到本地 URL、MIME、哈希和媒体信息的索引；
- `ai-motion-arranger/scripts/visual-script-to-timeline.mjs`：Visual Script 2.0 到 Timeline v2 的确定性转换器；
- `local-imported/active.tsx`：首次启动时可见的基础示例组件；
- `remotion-motion-studio.*`：AI 生成动效的协议、模板和组件目录。

运行后自动产生的 `local-media/`、`local-components/`、`local-projects/`、`local-state.json` 和 `outputs/renders/` 都是你的本机数据，不应提交到公开仓库。

## Visual Script 转时间线

转换器只做确定性映射：校验组件/资源 ID，计算基础锚点、尺寸与时间，并生成可导入工作台的 Timeline v2 JSON；本阶段不包含语义判断或自动避让。

```powershell
npm.cmd run convert:visual-script -- .\ai-motion-arranger\examples\sample-visual-script-v2.json .\ai-motion-arranger\examples\sample-timeline-v2.json
npm.cmd run test:timeline-v2
```

## 开源包内容与限制

本发布包不包含任何用户视频、图片、项目草稿、导入历史、渲染成片、浏览器缓存或 `node_modules`。首次启动需要自行运行 `npm install` 安装依赖。Remotion 渲染依赖可用的 Chrome/Chromium 环境。

本项目按 MIT License 发布，欢迎 Fork、修改和二次开发。请在发布的衍生版本中保留许可证文本。
