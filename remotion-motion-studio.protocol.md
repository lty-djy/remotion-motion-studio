# Motion Component Manifest Protocol v1

## 1. 文件与导出

一个组件包是自包含的 `.tsx` 文件，只能从 `react` 和 `remotion` 导入。它至少导出：

```tsx
export const FPS = 30;
export const DURATION_IN_FRAMES = 300;
export const MOTION_COMPONENTS = [/* definitions */];
export const MOTION_TIMELINE = [/* instances */];
export default DefaultComponent;
```

禁止网络请求、动态 `import()`、`eval`、`Function`、WebSocket、Worker、Node API、`window`、`document`、`localStorage` 和运行时外部依赖。动画必须由当前帧确定，保证预览与导出一致。

## 2. 组件清单

每个定义描述一个可独立添加、选择和编辑的组件：

```tsx
export const MOTION_COMPONENTS = [
  {
    id: "ExampleGauge",
    name: "动态码表",
    description: "速度与增长率",
    category: "metric",
    glyph: "120",
    component: ExampleGauge,
    durationInFrames: 120,
    bounds: {x: 0, y: 0, width: 520, height: 300},
    defaultPosition: {x: 110, y: 110, scale: 1},
    defaultProps: {
      label: "处理速度",
      value: 120,
      unit: "FPS",
      accentColor: "#67e8f9",
    },
    propsSchema: {
      label: {type: "text", label: "标题"},
      value: {type: "number", label: "数值", min: 0, max: 999, step: 1},
      unit: {type: "text", label: "单位"},
      accentColor: {type: "color", label: "强调色"},
    },
  },
];
```

规则：

- `id` 在同一组件包内唯一且稳定，修改组件时不要随意更换。实现工作台已有类型时，必须使用自动生成组件目录中大小写完全一致的标准 ID，例如 `RadialTicks`，不能写成 `radial-ticks`；自定义类型应使用不会冒充内置组件的独立 ID。
- `component` 是 React 组件引用，不是字符串。
- `durationInFrames` 至少为 3；时间轴仍可把实例压缩到 0.1 秒。
- `bounds` 是组件自身的像素包围盒，通常从 `{x: 0, y: 0}` 开始，必须贴合真实视觉内容。
- `defaultPosition` 使用 1920×1080 设计画布中的像素坐标；`x`、`y` 是组件包围盒左上角的附加位移，`scale` 通常为 0.2–4。
- `glyph` 使用简短文字或符号，避免依赖图标库。
- 每个组件必须能独立渲染，不能依赖另一个组件先挂载。

### 边界与坐标

推荐使用“局部原点”模式：

```tsx
const ExampleMetric: React.FC<Props> = (props) => {
  return (
    <div style={{position: "absolute", left: 0, top: 0, width: 520, height: 300}}>
      {/* 所有背景、文字和图形都在此容器内 */}
    </div>
  );
};

// manifest
bounds: {x: 0, y: 0, width: 520, height: 300},
defaultPosition: {x: 110, y: 110, scale: 1},
```

- 根级 `AbsoluteFill` 只能作为透明坐标层，不得带整屏背景、阴影、边框或模糊。
- 默认视觉容器不绘制外边框，时间轴实例的 `backgroundOpacity` 默认为 `0`。只有用户主动调高背景透明度参数时，才显示卡片底色、阴影和模糊。
- 组件的实色背景、文字、SVG 和装饰必须全部落在 `bounds` 内，避免新组件覆盖整个预览画面。
- 兼容旧包时，也可以让视觉容器位于 `bounds.x`、`bounds.y`，同时把 `defaultPosition` 设为 0；不要同时应用两套位移。
- 工作台拖动、缩放和框选修改的是实例位置与缩放，不会改写组件内部布局。

## 3. 预设时间轴

`MOTION_TIMELINE` 把清单定义实例化为多条独立轨道：

```tsx
export const MOTION_TIMELINE = [
  {
    componentId: "ExampleGauge",
    startFrame: 30,
    durationInFrames: 120,
    position: {x: 110, y: 110, scale: 1},
    backgroundOpacity: 0,
    props: {label: "推理吞吐", value: 120, unit: "FPS"},
  },
];
```

- 每一项都会生成一条独立组件轨道。
- 同一 `componentId` 可出现多次，每次拥有独立位置、时长和参数。
- `startFrame` 不得小于 0；`durationInFrames` 不得小于 3。
- 不提供预设时，工作台只放入清单中的第一个组件。
- 时间轴实例超出视频时长时应裁剪，而不是延长或循环视频。
- 列表、步骤、对比两侧和流程节点应在 `props` 中提供可编辑的逐条起始时间，例如 `itemStarts: "0|1.3|3.2"`。这些时间必须来自转写的逐词或逐句时间戳，使每条内容在对应台词被说出时才开始动画。

### 移动端可读性

- 即使输出为 1920×1080 横版，也应按手机观看距离设计。主标题通常不小于 52px，正文通常不小于 26px，次要标签通常不小于 18px。
- 透明背景上的文字应使用克制的文字阴影或描边保持可读，但不得恢复整块黑色卡片、外边框或全屏蒙层。

### 信息密度、色彩与台词节奏

- 除非用户明确要求极简留白，开场之后不应出现超过约 1.5 秒的无动效空档；根据台词密度安排组件，但不遮挡人物、字幕或重点画面。
- 每个组件优先组合 2–5 条与当前台词直接相关的信息，例如核心数字加短标签、进度、微型图表、图标或图片证据；避免把不相关内容塞进同一组件。
- 整支视频至少使用三种视觉形式，并采用 2–4 个有明确层级的强调色。可在青蓝、紫、橙、绿等色系中按内容选色，但不要让所有组件使用同一套卡片或堆出无意义彩色装饰。
- 相邻台词的主组件默认不在同一时刻重叠。上一条退出后，下一条必须在对应台词开始时立即进入；列表、对比项与流程节点使用逐条起始时间实现分条弹出。

## 4. 参数协议

`propsSchema` 支持：

| type | 编辑器 | 常用字段 |
| --- | --- | --- |
| `text` | 文本框 | `label`、`placeholder` |
| `number` | 数字框 | `label`、`min`、`max`、`step` |
| `color` | 颜色选择器 | `label` |
| `boolean` | 开关 | `label` |
| `select` | 下拉框 | `label`、`options: [{label, value}]` |

`defaultProps`、时间轴 `props` 和用户编辑后的值必须是 JSON 可序列化数据。不要把函数、React 节点、类实例放入可编辑参数。

工作台会额外向组件注入：

- `videoSrc`：当前导入视频的 URL。
- `hideVideo`：导出时用于避免组件重复绘制底层视频。
- `backgroundOpacity`：0–1 的组件背景透明度。

卡片根底色、根背景模糊和显示开关由工作台统一渲染外壳控制；组件不得再自行用 `backgroundOpacity > 0` 之类的分支实现根底色，也不要对整个根节点设置 `opacity`，否则文字与图形会一起变淡。普通组件无需额外配置；如果组件根节点只是布局容器、实际卡片位于内部，应只在真实卡片节点添加 `data-card-surface`，统一控制层会保持外层透明并控制该内层表面。组件内部确有其他独立蒙层时可以读取 `backgroundOpacity` 调整该蒙层，但不能覆盖统一卡片表面逻辑。组件不得改变底层视频原声音量。

## 5. 资源与安全

- 单文件包优先使用 CSS、内联 SVG 和 data URI。
- `staticFile()` 只适用于已随本地项目分发的资源；单独上传 TSX 时不要引用不存在的文件。
- 不读取任意本地路径，不执行外部命令，不拼接远程脚本。
- 所有弹簧、插值、随机效果都必须由 Remotion 帧驱动；如需随机数，使用稳定种子。
- 预览和渲染必须在相同 FPS、尺寸和时长下得到一致结果。

## 6. 兼容、导入与历史

- 没有 `MOTION_COMPONENTS` 的旧 TSX 会作为单组件包兼容导入。
- 手动导入和自动导入走同一安全校验、编译与激活流程。
- 自动导入端点为本机 `POST /api/auto-import`，仅接受 `filename` 和 `code`。
- 工作台保存最近 50 个已成功导入文件；重新导入同名文件会新增版本，不覆盖历史文件。
- 历史列表中的任意版本都可再次激活。
- 同一标准 ID 同时存在内置模板与导入版本时，工作台优先渲染导入版本；清单中的参数协议和时间轴实例仍保持独立可编辑。
- 当前实际注册的指标 ID 与参数以自动生成的 [remotion-motion-studio.component-catalog.md](./remotion-motion-studio.component-catalog.md) 为准；[remotion-motion-studio.metric-components.md](./remotion-motion-studio.metric-components.md) 只说明维护边界，不再另行声明组件 ID。
