# 当前项目协议与验收

先在当前 checkout 核对 `local-protocol.ts` 的 `getMotionComponents` / `getMotionTimeline`、`local-main-v2.tsx` 的数字导出读取、`local-vite.config.ts` 的 `validateComponent`。下面是 2026-09-14 的接口定位，代码变化时以实码为准。

## TSX 包

导出可渲染 React 组件及 default 组件；`MOTION_COMPONENTS` 每项含稳定 id、name、description、category、glyph、exportName（指向具名组件）、durationInFrames、bounds、defaultPosition、defaultProps、propsSchema。目前参数类型为 text/number/color/boolean/select。

`MOTION_TIMELINE` 项使用 componentId、startFrame、durationInFrames、position、props，以及需要的背景控制。导出 `FPS` 与 `DURATION_IN_FRAMES`。默认时间线从 0 开始，交付说明提醒用户导入追加到当前播放头。人物视频不嵌入组件；可独立编辑视觉层。

不要用一个巨型不可编辑 TSX 将所有内容烘死。不同内容区应有独立实例；内部关键时间和文案暴露为参数。不能要求用户先注册永久组件才能导入。

## 校验命令

从工作台根目录执行：

```powershell
node .agents/skills/srt-to-workbench-tsx/scripts/validate-tsx.mjs "本期文件.tsx" "."
npm.cmd run build
```

脚本只用于自己生成并检查过的 TSX，不是运行任意不可信代码的沙箱。它使用当前项目的源码校验器和真实协议解析，输出临时目录及报告，不触碰 active.tsx 或时间线。源码校验器定位失效时停止并更新定位，不能跳过校验冒称通过。

还要检查：

- SRT 原文/时间码保留，范围和 fps 一致，时间线不会超出约定时长；起始、关键动作、退场、回跳均正确。
- bounds 与实际可见内容一致；检查所有关键帧的溢出、文字换行、字幕区、图像/字体载入；有口播时检查实际挡脸。
- 根页面 HTTP 200 并确认服务属于当前目录。独立预览必须通过真实 getMotionComponents/getMotionTimeline 驱动 Remotion Player，不能仅展示静态仿图。
- 参数至少实际修改一个文案、一个时间值，验证画面变化与回跳可复现。
- 实际导入验证需保护用户现有工作，优先保存快照并使用隔离测试项目；如未进行，准确说明只做协议和独立预览验证。
- 提供可下载的源 TSX，不将 Vite 编译结果冒充源文件。交付有额外素材时一起打包，资源路径必须可解析。

样段预览应使用独立路径，不要覆盖用户此前保留的版本。
