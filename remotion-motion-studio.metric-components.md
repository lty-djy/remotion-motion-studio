# 指标组件生成规范

本页定义工作台“数字与指标”分类中的 8 个扩展类型。生成这些类型时，组件导出名、`MOTION_COMPONENTS[].id` 和时间轴中的 `componentId` 必须使用下列大小写完全一致的标准 ID。导入后，AI 生成版本会覆盖同 ID 的内置基础模板，同时保留独立轨道、位置、尺寸和参数编辑能力。

## 类型与参数

| 标准 ID | 视觉特征 | 建议可编辑参数 |
| --- | --- | --- |
| `MetricBar` | 3 条紧凑横向指标、发光填充、目标刻度 | `title`、`subtitle`、`value`、`item1`、`item2`、`item3`、`accentColor`、`secondaryColor` |
| `SegmentedMeter` | 分段容量/能量槽、依次点亮、阈值警示 | `label`、`value`、`unit`、`segmentCount`、`dangerThreshold`、`accentColor`、`warningColor` |
| `DualMetricBar` | A/B 双向条形对比、中心基线、差值提示 | `title`、`labelA`、`valueA`、`labelB`、`valueB`、`unit`、`accentColor`、`secondaryColor` |
| `FlipCounter` | 机械翻牌数字、上下分片、翻页高光 | `label`、`value`、`prefix`、`suffix`、`digits`、`accentColor` |
| `WaveformMetric` | 实时波形、扫描光点、当前读数 | `title`、`subtitle`、`value`、`unit`、`amplitude`、`speed`、`accentColor`、`secondaryColor` |
| `LiquidGauge` | 液态填充、波面与气泡、百分比刻度 | `label`、`value`、`unit`、`accentColor`、`secondaryColor` |
| `RadialTicks` | HUD 刻度环、旋转扫描、中心数值 | `label`、`value`、`unit`、`tickCount`、`accentColor`、`secondaryColor` |
| `PulseMetric` | 心电式脉冲线、实时状态灯、峰值数字 | `title`、`status`、`value`、`unit`、`rate`、`accentColor`、`secondaryColor` |

## 推荐规格

- 默认边界：`bounds: {x: 0, y: 0, width: 520, height: 300}`。翻牌数字或环形仪表可按内容调整，但边界必须贴合真实视觉。
- 默认位置：横版画布优先 `defaultPosition: {x: 110, y: 110, scale: 1}`；需要避开人物时按视频构图移动。
- 默认时长：90–150 帧。循环形态也必须完全由当前帧计算，不使用计时器。
- `value` 建议使用 `number` 类型；显示文本、单位、前后缀、状态与颜色都应暴露为可编辑参数。
- 百分比、填充率和环形值默认约束在 0–100；速度、吞吐等无固定上限的数据需要声明合理 `min`、`max` 和 `step`。
- `backgroundOpacity` 只控制卡片底色、阴影、蒙层和背景模糊，不降低数字、文字、条形、波形和 HUD 刻度的可读性。

## 完整清单示例

```tsx
import React from "react";
import {interpolate, useCurrentFrame} from "remotion";

type MetricBarProps = {
  title?: string;
  subtitle?: string;
  value?: number;
  item1?: string;
  item2?: string;
  item3?: string;
  accentColor?: string;
  secondaryColor?: string;
  backgroundOpacity?: number;
};

export const MetricBar: React.FC<MetricBarProps> = ({
  title = "模型性能",
  subtitle = "REAL-TIME BENCHMARK",
  value = 86,
  item1 = "推理速度",
  item2 = "准确率",
  item3 = "稳定性",
  accentColor = "#67e8f9",
  secondaryColor = "#8b5cf6",
  backgroundOpacity = 0.72,
}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rows = [
    {label: item1, value},
    {label: item2, value: Math.max(0, value - 9)},
    {label: item3, value: Math.max(0, value - 16)},
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 520,
        height: 300,
        boxSizing: "border-box",
        overflow: "hidden",
        borderRadius: 28,
        padding: 30,
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
        background: `rgba(5, 12, 24, ${backgroundOpacity})`,
        border: `1px solid ${accentColor}66`,
        boxShadow: `0 20px 60px rgba(0, 0, 0, ${backgroundOpacity * 0.46})`,
      }}
    >
      <div style={{fontSize: 13, letterSpacing: 3, color: accentColor}}>{subtitle}</div>
      <div style={{fontSize: 28, fontWeight: 700, marginTop: 7}}>{title}</div>
      <div style={{display: "grid", gap: 18, marginTop: 25}}>
        {rows.map((row, index) => (
          <div key={row.label}>
            <div style={{display: "flex", justifyContent: "space-between", fontSize: 14}}>
              <span>{row.label}</span><span>{row.value}%</span>
            </div>
            <div style={{height: 8, marginTop: 7, borderRadius: 999, background: "#ffffff16"}}>
              <div
                style={{
                  width: `${row.value * reveal}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${accentColor}, ${secondaryColor})`,
                  boxShadow: `0 0 18px ${accentColor}88`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FPS = 30;
export const DURATION_IN_FRAMES = 300;

export const MOTION_COMPONENTS = [
  {
    id: "MetricBar",
    name: "条形指标",
    description: "紧凑横向指标与目标刻度",
    category: "metric",
    glyph: "BAR",
    component: MetricBar,
    durationInFrames: 120,
    bounds: {x: 0, y: 0, width: 520, height: 300},
    defaultPosition: {x: 110, y: 110, scale: 1},
    defaultProps: {
      title: "模型性能",
      subtitle: "REAL-TIME BENCHMARK",
      value: 86,
      item1: "推理速度",
      item2: "准确率",
      item3: "稳定性",
      accentColor: "#67e8f9",
      secondaryColor: "#8b5cf6",
    },
    propsSchema: {
      title: {type: "text", label: "标题"},
      subtitle: {type: "text", label: "英文副标题"},
      value: {type: "number", label: "主数值", min: 0, max: 100, step: 1},
      item1: {type: "text", label: "指标一"},
      item2: {type: "text", label: "指标二"},
      item3: {type: "text", label: "指标三"},
      accentColor: {type: "color", label: "强调色"},
      secondaryColor: {type: "color", label: "辅助色"},
    },
  },
];

export const MOTION_TIMELINE = [
  {
    componentId: "MetricBar",
    startFrame: 30,
    durationInFrames: 120,
    position: {x: 110, y: 110, scale: 1},
    backgroundOpacity: 0.72,
    props: {title: "模型性能", value: 86},
  },
];

export default MetricBar;
```

## 生成要求

- 一个 TSX 可以同时包含这些扩展指标和目录中的其他标准类型；每个定义都会成为左侧可添加组件，每个时间轴实例都会成为独立轨道。
- 每个组件至少开放标题/标签、核心数值和主色；只有确实在视觉实现中使用的字段才写入 `propsSchema`。
- 所有默认参数和时间轴参数必须可 JSON 序列化；不得传入 React 节点、函数或类实例。
- 图形优先使用 CSS 和内联 SVG。禁止远程图片、外部字体、第三方图表库和运行时网络请求。
- 所有动画必须通过 `useCurrentFrame()`、`interpolate()`、`spring()` 等 Remotion 帧函数确定，保证暂停、拖动时刻线和导出结果一致。
- 实色背景和全部视觉内容必须限制在清单声明的 `bounds` 内；透明 `AbsoluteFill` 不得携带整屏黑色背景。
- 需要生成全新、工作台尚未内置的指标类型时，可使用新的稳定 ID，同时仍要完整声明名称、类别、边界、参数协议和时间轴。
