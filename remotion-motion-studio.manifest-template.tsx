import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_IN_FRAMES = 300;

type CommonProps = {
  backgroundOpacity?: number;
};

type SpeedGaugeProps = CommonProps & {
  label?: string;
  value?: number;
  unit?: string;
  accentColor?: string;
};

export const SpeedGauge: React.FC<SpeedGaugeProps> = ({
  label = "处理速度",
  value = 87,
  unit = "SCORE",
  accentColor = "#68e8ff",
  backgroundOpacity = 0.78,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 120}});
  const progress = interpolate(frame, [0, 70], [0, value / 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const alpha = Math.max(0, Math.min(1, backgroundOpacity));

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 420,
        height: 300,
        boxSizing: "border-box",
        overflow: "hidden",
        borderRadius: 34,
        color: "#f4fbff",
        background: `rgba(7, 16, 28, ${0.88 * alpha})`,
        border: "1px solid rgba(105,229,255,0.36)",
        boxShadow: `0 28px 90px rgba(0,0,0,${0.46 * alpha})`,
        opacity: 0.15 + enter * 0.85,
        transform: `translateY(${(1 - enter) * 28}px)`,
        fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif",
      }}
    >
      <div
        style={{
          padding: "26px 30px",
          color: "rgba(220,244,252,0.68)",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "0.16em",
        }}
      >
        {label}
      </div>
      <svg viewBox="0 0 360 210" style={{width: "100%", height: 190}}>
        <path
          d="M 55 174 A 125 125 0 0 1 305 174"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="18"
          strokeLinecap="round"
          pathLength="100"
        />
        <path
          d="M 55 174 A 125 125 0 0 1 305 174"
          fill="none"
          stroke={accentColor}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset={100 - progress * 100}
          pathLength="100"
        />
        <g transform={`rotate(${-120 + progress * 240} 180 174)`}>
          <line
            x1="180"
            y1="174"
            x2="274"
            y2="174"
            stroke="#f7fcff"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <circle cx="180" cy="174" r="15" fill="#f7fcff" />
        <circle cx="180" cy="174" r="7" fill={accentColor} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 22,
          textAlign: "center",
        }}
      >
        <b style={{fontSize: 54}}>{Math.round(progress * 100)}</b>
        <span
          style={{
            marginLeft: 10,
            color: accentColor,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.16em",
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
};

type QuoteLockupProps = CommonProps & {
  quote?: string;
  source?: string;
  accentColor?: string;
};

export const QuoteLockup: React.FC<QuoteLockupProps> = ({
  quote = "让复杂的信息，一眼就被理解。",
  source = "REMOTION LAB",
  accentColor = "#8cffb7",
  backgroundOpacity = 0.72,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 16, stiffness: 105}});
  const alpha = Math.max(0, Math.min(1, backgroundOpacity));

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1120,
        height: 180,
        boxSizing: "border-box",
        padding: "34px 42px",
        overflow: "hidden",
        borderRadius: 28,
        color: "#f8fffb",
        background: `linear-gradient(120deg,rgba(8,20,15,${
          0.88 * alpha
        }),rgba(10,14,24,${0.72 * alpha}))`,
        borderLeft: `5px solid ${accentColor}`,
        boxShadow: `0 28px 90px rgba(0,0,0,${0.38 * alpha})`,
        opacity: 0.12 + enter * 0.88,
        transform: `translateX(${(1 - enter) * -42}px)`,
        fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif",
      }}
    >
      <div style={{fontSize: 44, fontWeight: 720}}>{quote}</div>
      <div
        style={{
          marginTop: 16,
          color: accentColor,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "0.18em",
        }}
      >
        {source}
      </div>
    </div>
  );
};

export const MOTION_COMPONENTS = [
  {
    id: "SpeedGauge",
    name: "动态码表",
    description: "弧形进度、指针和数值反馈",
    category: "metric",
    glyph: "87",
    component: SpeedGauge,
    durationInFrames: 100,
    bounds: {x: 0, y: 0, width: 420, height: 300},
    defaultPosition: {x: 110, y: 100, scale: 1},
    defaultProps: {
      label: "处理速度",
      value: 87,
      unit: "SCORE",
      accentColor: "#68e8ff",
    },
    propsSchema: {
      label: {type: "text", label: "标题"},
      value: {type: "number", label: "码表数值", min: 0, max: 100, step: 1},
      unit: {type: "text", label: "单位"},
      accentColor: {type: "color", label: "强调色"},
    },
  },
  {
    id: "QuoteLockup",
    name: "金句定格卡",
    description: "结论句与来源署名",
    category: "text",
    glyph: "“ ”",
    component: QuoteLockup,
    durationInFrames: 100,
    bounds: {x: 0, y: 0, width: 1120, height: 180},
    defaultPosition: {x: 220, y: 650, scale: 1},
    defaultProps: {
      quote: "让复杂的信息，一眼就被理解。",
      source: "REMOTION LAB",
      accentColor: "#8cffb7",
    },
    propsSchema: {
      quote: {type: "text", label: "金句"},
      source: {type: "text", label: "来源"},
      accentColor: {type: "color", label: "强调色"},
    },
  },
];

export const MOTION_TIMELINE = [
  {
    componentId: "SpeedGauge",
    startFrame: 0,
    durationInFrames: 105,
    position: {x: 110, y: 100, scale: 1},
    backgroundOpacity: 0.78,
  },
  {
    componentId: "QuoteLockup",
    startFrame: 176,
    durationInFrames: 100,
    position: {x: 220, y: 650, scale: 1},
    backgroundOpacity: 0.72,
  },
];

export default SpeedGauge;
