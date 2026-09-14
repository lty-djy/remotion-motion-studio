# 数据标注开头参考样段

当前阶段：已完成 12 秒独立实时预览和工作台编排导入验证，待用户看效果。

- 预览：http://127.0.0.1:41735/tzfilm-intro.html（现有 Vite 开发服务）
- 编排：`public/reference-studies/tzfilm-intro/arrangement.timeline.json`
- 生成：`node reference-studies/tzfilm-intro/make-arrangement.mjs`
- 组件仍为四个既有 ID；没有将整段封装为效果库新组件。
- 金色时薪标题新增单位下置选项；双海报新增首张延迟、两张间隔、顶部位置、间距，扩大宽度可调范围。旧默认值和动画保持。

## 素材与编排

来源：用户提供的 `D:/360极速浏览器X下载/柱子哥TzFilm-国内的数据标注时薪有300-3000？A-20260908120556.mp4`。
素材目录：`public/reference-studies/tzfilm-intro/`。
五张招聘截图取自 2s，双海报取自 7s，经过 FFmpeg crop/perspective 透视校正；backdrop.jpg 是原片首帧；reference.mp4 是原片前 12s 无声对照。
截图属于参考练习素材，收入和播放量文案沿用原片，未另作事实核实。无 SRT 输入，不捏造字幕轨。
0–5.5s 时薪与招聘卡片，5.3–12s 海报，7.8–12s 徽章。招聘卡避让脸部；海报阶段是主动覆盖人物的媒体展示。底部 20% 留空。
独立预览只用定帧口播底图、无音轨；不是完整真人口播重剪成片。JSON 含四个动效，不含底图。

## 验证

- `npm.cmd run build` 成功；HTTP 41735 返回 200。
- `npm.cmd run lint:arrangement -- public/reference-studies/tzfilm-intro/arrangement.timeline.json --duration 12 --canvas landscape`：0 error，5 warning。三条默认文案告警来自该参考本身就是组件原型；另外两条是全片种类和每分钟密度阈值，不适用于仅 12 秒的点名参考片段，保留原始警告而未降低规则。
- 独立预览实际播放、2s 和 10s 构图、原片切换均已查看。
- 工作台实际导入：4 个动效、0 资源、0 字幕，显示“时间线尚未修改”；没有点确认插入。
- local-state.json 与 `.codex-qa/tzfilm-intro/local-state.before.json` SHA256 一致。

## 后续

用户看构图和节奏后针对这四个组件继续调。工作台当前启用个人统一主色，且导入方式可能保留旧位置；如需严格匹配独立样段，应在导入前选“完全按 JSON”并检查预览主色。没有修改个人全局偏好。
需要真实动态底片或成片时替换定帧底图，并另做声音与导出验证。
