// =============================================================================
// 数据可视化可复用组件包 (DataViz Components)
// 来源: C:\Users\10659\WorkBuddy\2026-08-25-00-02-29\dataviz-video\src
// 5 场景 + 4 可复用基元；纯编排，仅 react/remotion 导入。
// =============================================================================

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// =============================================================================
// Theme tokens (inlined — no external imports)
// =============================================================================

const COLORS = {
  bgDeep: "#0B1220",
  bgSurface: "#131E36",
  bgCard: "#1A2540",
  bgCardHover: "#1E2B4D",
  blue: "#3B82F6",
  teal: "#22D3A8",
  amber: "#FBBF24",
  rose: "#F43F5E",
  purple: "#A855F7",
  cyan: "#06B6D4",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  border: "#2A3A5C",
  gridLine: "#1E2B4D",
} as const;

const CHART_COLORS = [
  COLORS.blue,
  COLORS.teal,
  COLORS.amber,
  COLORS.rose,
  COLORS.purple,
  COLORS.cyan,
] as const;

const FONT = {
  primary:
    'Helvetica Neue, Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
  mono: '"SF Mono", "Cascadia Code", "Fira Code", monospace',
} as const;

// =============================================================================
// Helpers
// =============================================================================

const formatValue = (
  value: number,
  format: "number" | "percent" | "currency",
): string => {
  if (value <= 0) {
    if (format === "currency") return "¥0";
    if (format === "percent") return "0.0%";
    return "0";
  }
  switch (format) {
    case "currency":
      if (value >= 100000000) return `¥${(value / 100000000).toFixed(2)}亿`;
      if (value >= 10000) return `¥${(value / 10000).toFixed(1)}万`;
      return `¥${Math.round(value).toLocaleString()}`;
    case "percent":
      return `${value.toFixed(1)}%`;
    case "number":
    default:
      if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
      if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
      return Math.round(value).toLocaleString();
  }
};

const parseCsv = (raw: string): string[] => {
  if (!raw) return [];
  return raw
    .split(/[,|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const parseNumberCsv = (raw: string): number[] => {
  return parseCsv(raw)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
};

// =============================================================================
// Shared types
// =============================================================================

type KpiFormat = "number" | "percent" | "currency";

interface SceneBaseProps {
  backgroundOpacity?: number;
}

// =============================================================================
// Reusable primitive — Background (full 1920×1080 frame)
// =============================================================================

interface BackgroundDot {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

const BG_DOTS: BackgroundDot[] = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 173 + 47) % 1920,
  y: (i * 271 + 91) % 1080,
  size: 2 + ((i * 7) % 4),
  speed: 0.15 + ((i * 3) % 5) * 0.12,
  opacity: 0.06 + ((i * 11) % 10) * 0.012,
  color: [COLORS.blue, COLORS.teal, COLORS.purple, COLORS.cyan][i % 4],
}));

const DatavizBackground: React.FC<SceneBaseProps> = () => {
  const frame = useCurrentFrame();

  const glowA = {
    x: interpolate(frame, [0, 750], [-350, 2270]),
    y: interpolate(frame, [0, 750], [820, 260]),
  };
  const glowB = {
    x: interpolate(frame, [0, 750], [2270, -350]),
    y: interpolate(frame, [0, 750], [180, 620]),
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: glowA.x - 300,
          top: glowA.y - 300,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.blue}26 0%, transparent 70%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: glowB.x - 250,
          top: glowB.y - 250,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.purple}1F 0%, transparent 70%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${COLORS.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.gridLine} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          opacity: 0.35,
        }}
      />
      {BG_DOTS.map((dot, i) => {
        const y = ((dot.y + frame * dot.speed * 6) % 1200) - 60;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: dot.x,
              top: y,
              width: dot.size,
              height: dot.size,
              background: dot.color,
              borderRadius: "50%",
              opacity: dot.opacity,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(5,10,20,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// =============================================================================
// Scene container (fade in/out)
// =============================================================================

const SceneContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// =============================================================================
// Scene 1 — DatavizIntro (title card scene, full 1920×1080)
// =============================================================================

interface DatavizIntroProps extends SceneBaseProps {
  badgeText?: string;
  title?: string;
  subtitle?: string;
  period?: string;
  cornerAccentColor?: string;
}

const DatavizIntro: React.FC<DatavizIntroProps> = ({
  backgroundOpacity = 0,
  badgeText = "数据可视化报告",
  title = "2026 年度业务报告",
  subtitle = "Annual Business Intelligence Dashboard",
  period = "Q1 – Q4 2026",
  cornerAccentColor = COLORS.blue,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 80, mass: 1 },
    durationInFrames: 60,
  });
  const subSpring = spring({
    frame: frame - 12,
    fps,
    config: { damping: 200, stiffness: 80, mass: 1 },
    durationInFrames: 60,
  });
  const badgeSpring = spring({
    frame: frame - 24,
    fps,
    config: { damping: 200, stiffness: 90, mass: 0.8 },
    durationInFrames: 50,
  });

  const lineScale = interpolate(frame, [20, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  const titleY = (1 - titleSpring) * 50;
  const alpha = backgroundOpacity;

  return (
    <SceneContainer>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div
          style={{
            opacity: badgeSpring,
            transform: `scale(${0.8 + badgeSpring * 0.2})`,
            fontFamily: FONT.primary,
            fontSize: 24,
            fontWeight: 600,
            color: COLORS.teal,
            letterSpacing: 6,
            padding: "10px 32px",
            border: `1px solid ${COLORS.teal}55`,
            borderRadius: 999,
            background: `${COLORS.teal}14`,
            textTransform: "uppercase",
          }}
        >
          {badgeText}
        </div>
        <div
          style={{
            fontFamily: FONT.primary,
            fontSize: 110,
            fontWeight: 800,
            color: COLORS.textPrimary,
            letterSpacing: 4,
            opacity: titleSpring,
            transform: `translateY(${titleY}px)`,
            textShadow: "0 4px 40px rgba(59,130,246,0.25)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: 240 * lineScale,
            height: 5,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${CHART_COLORS[0]}, ${CHART_COLORS[1]}, ${CHART_COLORS[2]})`,
            boxShadow: "0 0 20px rgba(59,130,246,0.5)",
          }}
        />
        <div
          style={{
            fontFamily: FONT.primary,
            fontSize: 34,
            color: COLORS.textSecondary,
            letterSpacing: 2,
            opacity: subSpring,
            transform: `translateY(${(1 - subSpring) * 30}px)`,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: FONT.mono,
            fontSize: 26,
            color: COLORS.textMuted,
            letterSpacing: 3,
            opacity: subSpring,
          }}
        >
          {period}
        </div>
      </AbsoluteFill>
      <CornerAccent
        position={{ top: 60, left: 60 }}
        frame={frame}
        fps={fps}
        color={cornerAccentColor}
      />
      <CornerAccent
        position={{ top: 60, right: 60 }}
        frame={frame}
        fps={fps}
        color={cornerAccentColor}
      />
      <CornerAccent
        position={{ bottom: 60, left: 60 }}
        frame={frame}
        fps={fps}
        color={cornerAccentColor}
      />
      <CornerAccent
        position={{ bottom: 60, right: 60 }}
        frame={frame}
        fps={fps}
        color={cornerAccentColor}
      />
      {/* alpha kept as escape hatch — not directly used to avoid unintended dim */}
      {alpha > 0 && <div style={{ display: "none" }} />}
    </SceneContainer>
  );
};

const CornerAccent: React.FC<{
  position: React.CSSProperties;
  frame: number;
  fps: number;
  color: string;
}> = ({ position, frame, fps, color }) => {
  const grow = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.6 },
    durationInFrames: 40,
  });
  const size = 44 * grow;
  return (
    <div
      style={{
        position: "absolute",
        ...position,
        width: size,
        height: size,
        borderTop:
          position.top !== undefined ? `2px solid ${color}80` : undefined,
        borderBottom:
          position.bottom !== undefined ? `2px solid ${color}80` : undefined,
        borderLeft:
          position.left !== undefined ? `2px solid ${color}80` : undefined,
        borderRight:
          position.right !== undefined ? `2px solid ${color}80` : undefined,
      }}
    />
  );
};

// =============================================================================
// Reusable primitive — DatavizKpiCard (single card, 520×420)
// =============================================================================

interface DatavizKpiCardProps {
  label?: string;
  value?: number;
  format?: KpiFormat;
  delta?: number;
  accentColor?: string;
  delaySeconds?: number;
}

const DatavizKpiCard: React.FC<DatavizKpiCardProps> = ({
  label = "总营收",
  value = 48200000,
  format = "currency",
  delta = 23.5,
  accentColor = COLORS.blue,
  delaySeconds = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayFrames = Math.round(delaySeconds * fps);
  const local = frame - delayFrames;

  const enter = spring({
    frame: local,
    fps,
    config: { damping: 200, stiffness: 90, mass: 0.9 },
    durationInFrames: 50,
  });
  const count = spring({
    frame: local - 10,
    fps,
    config: { damping: 200, stiffness: 60, mass: 1.2 },
    durationInFrames: 80,
  });

  const labelOpacity = interpolate(local, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const deltaOpacity = interpolate(local, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const displayValue = count * value;
  const translateY = (1 - enter) * 60;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 520,
        height: 420,
        padding: "48px 40px",
        borderRadius: 24,
        background: `linear-gradient(160deg, ${COLORS.bgCard} 0%, ${COLORS.bgSurface} 100%)`,
        border: `1px solid ${COLORS.border}`,
        opacity: enter,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        boxShadow: `0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 5,
          borderRadius: 3,
          background: accentColor,
          boxShadow: `0 0 12px ${accentColor}80`,
        }}
      />
      <div
        style={{
          fontFamily: FONT.primary,
          fontSize: 26,
          color: COLORS.textSecondary,
          opacity: labelOpacity,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 72,
          fontWeight: 700,
          color: accentColor,
          lineHeight: 1,
          textShadow: `0 0 30px ${accentColor}50`,
        }}
      >
        {formatValue(displayValue, format)}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          opacity: deltaOpacity,
        }}
      >
        <div
          style={{
            fontFamily: FONT.primary,
            fontSize: 24,
            fontWeight: 600,
            color: delta >= 0 ? COLORS.teal : COLORS.rose,
            background:
              delta >= 0 ? `${COLORS.teal}1E` : `${COLORS.rose}1E`,
            padding: "6px 16px",
            borderRadius: 999,
            border: `1px solid ${delta >= 0 ? `${COLORS.teal}44` : `${COLORS.rose}44`}`,
          }}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
        </div>
        <span
          style={{
            fontFamily: FONT.primary,
            fontSize: 20,
            color: COLORS.textMuted,
          }}
        >
          同比增长
        </span>
      </div>
      <div
        style={{
          marginTop: "auto",
          height: 6,
          borderRadius: 3,
          background: COLORS.bgDeep,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${count * 100}%`,
            height: "100%",
            borderRadius: 3,
            background: `linear-gradient(90deg, ${accentColor}90, ${accentColor})`,
          }}
        />
      </div>
    </div>
  );
};

// =============================================================================
// Scene 2 — DatavizKpiScene (4 KPI cards in a row, full 1920×1080)
// =============================================================================

interface DatavizKpiSceneProps extends SceneBaseProps {
  headerTitle?: string;
  period?: string;
  kpi1Label?: string;
  kpi1Value?: number;
  kpi1Format?: KpiFormat;
  kpi1Delta?: number;
  kpi2Label?: string;
  kpi2Value?: number;
  kpi2Format?: KpiFormat;
  kpi2Delta?: number;
  kpi3Label?: string;
  kpi3Value?: number;
  kpi3Format?: KpiFormat;
  kpi3Delta?: number;
  kpi4Label?: string;
  kpi4Value?: number;
  kpi4Format?: KpiFormat;
  kpi4Delta?: number;
}

const DatavizKpiScene: React.FC<DatavizKpiSceneProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 90, mass: 0.9 },
    durationInFrames: 45,
  });

  const kpis = [
    {
      label: props.kpi1Label ?? "总营收",
      value: props.kpi1Value ?? 48200000,
      format: (props.kpi1Format ?? "currency") as KpiFormat,
      delta: props.kpi1Delta ?? 23.5,
      color: CHART_COLORS[0],
    },
    {
      label: props.kpi2Label ?? "活跃用户",
      value: props.kpi2Value ?? 1280000,
      format: (props.kpi2Format ?? "number") as KpiFormat,
      delta: props.kpi2Delta ?? 41.2,
      color: CHART_COLORS[1],
    },
    {
      label: props.kpi3Label ?? "订单量",
      value: props.kpi3Value ?? 356800,
      format: (props.kpi3Format ?? "number") as KpiFormat,
      delta: props.kpi3Delta ?? 18.7,
      color: CHART_COLORS[2],
    },
    {
      label: props.kpi4Label ?? "客户满意度",
      value: props.kpi4Value ?? 96.8,
      format: (props.kpi4Format ?? "percent") as KpiFormat,
      delta: props.kpi4Delta ?? 4.3,
      color: CHART_COLORS[3],
    },
  ];

  return (
    <SceneContainer>
      <AbsoluteFill
        style={{
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 140px",
          gap: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            opacity: headerSpring,
            transform: `translateY(${(1 - headerSpring) * 30}px)`,
          }}
        >
          <div
            style={{
              width: 10,
              height: 52,
              borderRadius: 5,
              background: `linear-gradient(180deg, ${CHART_COLORS[0]}, ${CHART_COLORS[1]})`,
              boxShadow: `0 0 16px ${CHART_COLORS[0]}80`,
              alignSelf: "center",
            }}
          />
          <div
            style={{
              fontFamily: FONT.primary,
              fontSize: 56,
              fontWeight: 700,
              color: COLORS.textPrimary,
              letterSpacing: 2,
            }}
          >
            {props.headerTitle ?? "核心指标总览"}
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 24,
              color: COLORS.textMuted,
              letterSpacing: 1,
            }}
          >
            {props.period ?? "Q1 – Q4 2026"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, height: 420 }}>
          {kpis.map((kpi, i) => (
            <DatavizKpiCard
              key={i}
              label={kpi.label}
              value={kpi.value}
              format={kpi.format}
              delta={kpi.delta}
              accentColor={kpi.color}
              delaySeconds={0.6 + i * 0.33}
            />
          ))}
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

// =============================================================================
// Reusable primitive — DatavizBarChart (1500×560, labels/values as CSV)
// =============================================================================

interface DatavizBarChartProps {
  labels?: string;
  values?: string;
  unit?: string;
  accentColor?: string;
  delaySeconds?: number;
}

const DatavizBarChart: React.FC<DatavizBarChartProps> = ({
  labels = "Q1,Q2,Q3,Q4",
  values = "920,1180,1050,1670",
  unit = "万元",
  accentColor = COLORS.blue,
  delaySeconds = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dataLabels = parseCsv(labels);
  const dataValues = parseNumberCsv(values);
  const data = dataLabels.map((label, i) => ({
    label,
    value: dataValues[i] ?? 0,
  }));
  if (data.length === 0) {
    data.push({ label: "Q1", value: 0 });
  }

  const width = 1500;
  const height = 560;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const labelArea = 56;
  const chartHeight = height - labelArea;
  const delayFrames = Math.round(delaySeconds * fps);

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: chartHeight }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: p * chartHeight,
              height: 1,
              background: i === 0 ? COLORS.border : COLORS.gridLine,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          {data.map((d, i) => {
            const local = frame - delayFrames - 15 - i * 9;
            const grow = spring({
              frame: local,
              fps,
              config: { damping: 200, stiffness: 110, mass: 0.8 },
              durationInFrames: 60,
            });
            const barH = grow * (d.value / maxVal) * (chartHeight - 60);
            const valOpacity = interpolate(local, [28, 42], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const valY = interpolate(local, [28, 42], [24, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 34,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    marginBottom: 14,
                    opacity: valOpacity,
                    transform: `translateY(${valY}px)`,
                  }}
                >
                  {d.value.toLocaleString()}
                  <span
                    style={{
                      fontSize: 20,
                      color: COLORS.textMuted,
                      marginLeft: 4,
                    }}
                  >
                    {unit}
                  </span>
                </div>
                <div
                  style={{
                    width: "42%",
                    maxWidth: 170,
                    height: barH,
                    borderRadius: "10px 10px 4px 4px",
                    background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}66 100%)`,
                    boxShadow: `0 0 24px ${accentColor}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: labelArea, display: "flex" }}>
        {data.map((d, i) => {
          const labelOpacity = interpolate(
            frame,
            [20 + i * 9, 34 + i * 9],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: FONT.primary,
                fontSize: 26,
                fontWeight: 600,
                color: COLORS.textSecondary,
                opacity: labelOpacity,
                letterSpacing: 2,
              }}
            >
              {d.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Scene 3 — DatavizBarScene (bar chart scene, full 1920×1080)
// =============================================================================

interface DatavizBarSceneProps extends SceneBaseProps {
  title?: string;
  labels?: string;
  values?: string;
  unit?: string;
  accentColor?: string;
}

const DatavizBarScene: React.FC<DatavizBarSceneProps> = ({
  title = "季度营收对比 (万元)",
  labels,
  values,
  unit,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 90, mass: 0.9 },
    durationInFrames: 45,
  });

  const cardSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200, stiffness: 70, mass: 1 },
    durationInFrames: 60,
  });

  return (
    <SceneContainer>
      <AbsoluteFill
        style={{
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 140px",
          gap: 48,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            opacity: headerSpring,
            transform: `translateY(${(1 - headerSpring) * 30}px)`,
          }}
        >
          <div
            style={{
              width: 10,
              height: 52,
              borderRadius: 5,
              background: `linear-gradient(180deg, ${CHART_COLORS[2]}, ${CHART_COLORS[0]})`,
              boxShadow: `0 0 16px ${CHART_COLORS[2]}80`,
              alignSelf: "center",
            }}
          />
          <div
            style={{
              fontFamily: FONT.primary,
              fontSize: 56,
              fontWeight: 700,
              color: COLORS.textPrimary,
              letterSpacing: 2,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            opacity: cardSpring,
            transform: `translateY(${(1 - cardSpring) * 40}px) scale(${0.97 + cardSpring * 0.03})`,
            padding: "56px 64px 40px",
            borderRadius: 28,
            background: `linear-gradient(165deg, ${COLORS.bgCard} 0%, ${COLORS.bgSurface} 100%)`,
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
          }}
        >
          <DatavizBarChart
            labels={labels}
            values={values}
            unit={unit}
            accentColor={accentColor}
          />
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

// =============================================================================
// Reusable primitive — DatavizLineChart (1500×560, multi-series via ;)
// =============================================================================

interface DatavizLineChartProps {
  xLabels?: string;
  seriesNames?: string;
  seriesValues?: string;
  accentColor?: string;
  delaySeconds?: number;
}

const DatavizLineChart: React.FC<DatavizLineChartProps> = ({
  xLabels = "1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月",
  seriesNames = "营收,利润",
  seriesValues = "210,245,280,310,295,340,365,390,420,450,510,580;65,78,92,105,98,120,135,148,165,178,210,245",
  accentColor = COLORS.blue,
  delaySeconds = 0,
}) => {
  const frame = useCurrentFrame();

  const width = 1500;
  const height = 560;
  const pad = { top: 50, right: 40, bottom: 64, left: 90 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const xLabelList = parseCsv(xLabels);
  const nameList = parseCsv(seriesNames);
  const seriesList = parseCsv(seriesValues).map((row) =>
    parseNumberCsv(row),
  );
  const series = nameList.map((name, i) => ({
    name,
    values: seriesList[i] ?? [],
  }));
  if (series.length === 0) {
    series.push({ name: "Series 1", values: [] });
  }

  const allValues = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allValues, 1) * 1.18;
  const n = Math.max(xLabelList.length, 1);
  const xStep = chartW / Math.max(n - 1, 1);

  interface Point {
    x: number;
    y: number;
  }

  const seriesPoints: Point[][] = series.map((s) =>
    s.values.map((v, i) => ({
      x: pad.left + i * xStep,
      y: pad.top + chartH - (v / maxVal) * chartH,
    })),
  );

  const linePath = (pts: Point[]): string =>
    pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
      )
      .join(" ");

  const areaPath = (pts: Point[]): string => {
    if (pts.length === 0) return "";
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${linePath(pts)} L ${last.x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} L ${first.x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} Z`;
  };

  const draw = interpolate(frame, [15, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 2.2),
  });

  const gridOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        {series.map((_, si) => {
          const color =
            si === 0
              ? accentColor
              : CHART_COLORS[(si + 1) % CHART_COLORS.length];
          return (
            <linearGradient
              key={si}
              id={`area-grad-${si}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          );
        })}
      </defs>

      {yTicks.map((p, i) => {
        const y = pad.top + p * chartH;
        const tickVal = maxVal * (1 - p);
        return (
          <g key={i} opacity={gridOpacity}>
            <line
              x1={pad.left}
              x2={pad.left + chartW}
              y1={y}
              y2={y}
              stroke={i === 0 ? COLORS.border : COLORS.gridLine}
              strokeWidth={1}
            />
            <text
              x={pad.left - 16}
              y={y + 6}
              textAnchor="end"
              fill={COLORS.textMuted}
              fontSize={17}
              fontFamily={FONT.mono}
            >
              {Math.round(tickVal)}
            </text>
          </g>
        );
      })}

      {xLabelList.map((label, i) => {
        const op = interpolate(frame, [10 + i * 4, 22 + i * 4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <text
            key={i}
            x={pad.left + i * xStep}
            y={pad.top + chartH + 38}
            textAnchor="middle"
            fill={COLORS.textSecondary}
            fontSize={18}
            fontFamily={FONT.primary}
            opacity={op}
          >
            {label}
          </text>
        );
      })}

      {series.map((s, si) => {
        const color =
          si === 0
            ? accentColor
            : CHART_COLORS[(si + 1) % CHART_COLORS.length];
        const pts = seriesPoints[si];
        const seriesDraw = interpolate(
          draw,
          [si * 0.08, 1 - (series.length - 1 - si) * 0.08],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        return (
          <g key={si}>
            <path
              d={areaPath(pts)}
              fill={`url(#area-grad-${si})`}
              opacity={seriesDraw}
            />
            <path
              d={linePath(pts)}
              fill="none"
              stroke={color}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - seriesDraw}
              style={{ filter: `drop-shadow(0 0 8px ${color}70)` }}
            />
            {pts.map((pt, pi) => {
              const start = Math.min(pi / Math.max(n - 1, 1), 0.94);
              const pointAt = interpolate(
                seriesDraw,
                [start, start + 0.06],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              return (
                <circle
                  key={pi}
                  cx={pt.x}
                  cy={pt.y}
                  r={6 * pointAt}
                  fill={COLORS.bgDeep}
                  stroke={color}
                  strokeWidth={3}
                />
              );
            })}
          </g>
        );
      })}

      {series.map((s, si) => {
        const color =
          si === 0
            ? accentColor
            : CHART_COLORS[(si + 1) % CHART_COLORS.length];
        const op = interpolate(frame, [10 + si * 6, 24 + si * 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const lx = pad.left + 10 + si * 180;
        return (
          <g key={si} opacity={op}>
            <rect x={lx} y={14} width={22} height={5} rx={2.5} fill={color} />
            <text
              x={lx + 34}
              y={22}
              fill={COLORS.textSecondary}
              fontSize={20}
              fontFamily={FONT.primary}
            >
              {s.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// =============================================================================
// Scene 4 — DatavizLineScene (line chart scene, full 1920×1080)
// =============================================================================

interface DatavizLineSceneProps extends SceneBaseProps {
  title?: string;
  unit?: string;
  xLabels?: string;
  seriesNames?: string;
  seriesValues?: string;
  accentColor?: string;
}

const DatavizLineScene: React.FC<DatavizLineSceneProps> = ({
  title = "月度增长趋势",
  unit = "万",
  xLabels,
  seriesNames,
  seriesValues,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 90, mass: 0.9 },
    durationInFrames: 45,
  });

  const cardSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200, stiffness: 70, mass: 1 },
    durationInFrames: 60,
  });

  return (
    <SceneContainer>
      <AbsoluteFill
        style={{
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 140px",
          gap: 48,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            opacity: headerSpring,
            transform: `translateY(${(1 - headerSpring) * 30}px)`,
          }}
        >
          <div
            style={{
              width: 10,
              height: 52,
              borderRadius: 5,
              background: `linear-gradient(180deg, ${CHART_COLORS[1]}, ${CHART_COLORS[4]})`,
              boxShadow: `0 0 16px ${CHART_COLORS[1]}80`,
              alignSelf: "center",
            }}
          />
          <div
            style={{
              fontFamily: FONT.primary,
              fontSize: 56,
              fontWeight: 700,
              color: COLORS.textPrimary,
              letterSpacing: 2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 24,
              color: COLORS.textMuted,
            }}
          >
            单位: {unit}
          </div>
        </div>

        <div
          style={{
            opacity: cardSpring,
            transform: `translateY(${(1 - cardSpring) * 40}px) scale(${0.97 + cardSpring * 0.03})`,
            padding: "40px 48px 24px",
            borderRadius: 28,
            background: `linear-gradient(165deg, ${COLORS.bgCard} 0%, ${COLORS.bgSurface} 100%)`,
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
          }}
        >
          <DatavizLineChart
            xLabels={xLabels}
            seriesNames={seriesNames}
            seriesValues={seriesValues}
            accentColor={accentColor}
          />
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

// =============================================================================
// Scene 5 — DatavizOutro (closing summary, full 1920×1080)
// =============================================================================

interface DatavizOutroProps extends SceneBaseProps {
  title?: string;
  ctaText?: string;
  stat1Label?: string;
  stat1Value?: string;
  stat2Label?: string;
  stat2Value?: string;
  stat3Label?: string;
  stat3Value?: string;
  stat4Label?: string;
  stat4Value?: string;
}

const DatavizOutro: React.FC<DatavizOutroProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 80, mass: 1 },
    durationInFrames: 50,
  });

  const lineScale = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  const ctaOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stats = [
    {
      label: props.stat1Label ?? "全年营收",
      value: props.stat1Value ?? "¥4,820万",
    },
    {
      label: props.stat2Label ?? "用户增长",
      value: props.stat2Value ?? "+41.2%",
    },
    {
      label: props.stat3Label ?? "订单总量",
      value: props.stat3Value ?? "35.7万",
    },
    {
      label: props.stat4Label ?? "满意度",
      value: props.stat4Value ?? "96.8%",
    },
  ];

  return (
    <SceneContainer>
      <AbsoluteFill
        style={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 56,
        }}
      >
        <div
          style={{
            fontFamily: FONT.primary,
            fontSize: 84,
            fontWeight: 800,
            color: COLORS.textPrimary,
            letterSpacing: 4,
            opacity: titleSpring,
            transform: `translateY(${(1 - titleSpring) * 40}px)`,
          }}
        >
          {props.title ?? "2026 关键成果"}
        </div>
        <div
          style={{
            width: 200 * lineScale,
            height: 5,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${CHART_COLORS[1]}, ${CHART_COLORS[0]})`,
            boxShadow: `0 0 20px ${CHART_COLORS[0]}60`,
          }}
        />
        <div style={{ display: "flex", gap: 32 }}>
          {stats.map((stat, i) => {
            const tileSpring = spring({
              frame: frame - 20 - i * 8,
              fps,
              config: { damping: 200, stiffness: 100, mass: 0.8 },
              durationInFrames: 50,
            });
            const color = CHART_COLORS[i % CHART_COLORS.length];
            return (
              <div
                key={i}
                style={{
                  minWidth: 260,
                  padding: "36px 32px",
                  borderRadius: 20,
                  background: `linear-gradient(160deg, ${COLORS.bgCard} 0%, ${COLORS.bgSurface} 100%)`,
                  border: `1px solid ${COLORS.border}`,
                  textAlign: "center",
                  opacity: tileSpring,
                  transform: `translateY(${(1 - tileSpring) * 40}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 52,
                    fontWeight: 700,
                    color,
                    textShadow: `0 0 24px ${color}45`,
                    marginBottom: 12,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: FONT.primary,
                    fontSize: 22,
                    color: COLORS.textSecondary,
                    letterSpacing: 2,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 24,
            fontFamily: FONT.primary,
            fontSize: 28,
            color: COLORS.textMuted,
            letterSpacing: 6,
            opacity: ctaOpacity,
          }}
        >
          {props.ctaText ?? "THANKS FOR WATCHING"}
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

// =============================================================================
// Manifest exports
// =============================================================================

export const FPS = 30;
export const DURATION_IN_FRAMES = 750;

export const MOTION_COMPONENTS = [
  // --- Reusable primitives (smaller bounds, drop-in building blocks) ---
  {
    id: "DatavizKpiCard",
    name: "数据可视化 · 单 KPI 卡片",
    description: "带强调色与同比徽章的滚动计数 KPI 卡片（520×420）",
    category: "metric",
    glyph: "KPI",
    component: DatavizKpiCard,
    durationInFrames: 120,
    bounds: { x: 0, y: 0, width: 520, height: 420 },
    defaultPosition: { x: 110, y: 110, scale: 1 },
    defaultProps: {
      label: "总营收",
      value: 48200000,
      format: "currency",
      delta: 23.5,
      accentColor: COLORS.blue,
      delaySeconds: 0,
    },
    defaultBackgroundOpacity: 0,
    propsSchema: {
      label: { type: "text", label: "指标标签" },
      value: { type: "number", label: "数值", min: 0, max: 1000000000, step: 1 },
      format: {
        type: "select",
        label: "格式",
        options: [
          { label: "数字", value: "number" },
          { label: "百分比", value: "percent" },
          { label: "货币", value: "currency" },
        ],
      },
      delta: { type: "number", label: "同比 %", min: -100, max: 1000, step: 0.1 },
      accentColor: { type: "color", label: "强调色" },
      delaySeconds: { type: "number", label: "进场延迟(秒)", min: 0, max: 10, step: 0.1 },
    },
  },
  {
    id: "DatavizBarChart",
    name: "数据可视化 · 柱状图",
    description: "步进增长柱状图，标签/数值用逗号或竖线分隔（1500×560）",
    category: "chart",
    glyph: "BAR",
    component: DatavizBarChart,
    durationInFrames: 120,
    bounds: { x: 0, y: 0, width: 1500, height: 560 },
    defaultPosition: { x: 210, y: 260, scale: 1 },
    defaultProps: {
      labels: "Q1,Q2,Q3,Q4",
      values: "920,1180,1050,1670",
      unit: "万元",
      accentColor: COLORS.blue,
      delaySeconds: 0,
    },
    defaultBackgroundOpacity: 0,
    propsSchema: {
      labels: { type: "text", label: "X 轴标签 (逗号分隔)" },
      values: { type: "text", label: "数值 (逗号分隔)" },
      unit: { type: "text", label: "单位" },
      accentColor: { type: "color", label: "柱体强调色" },
      delaySeconds: { type: "number", label: "进场延迟(秒)", min: 0, max: 10, step: 0.1 },
    },
  },
  {
    id: "DatavizLineChart",
    name: "数据可视化 · 折线趋势",
    description: "自绘折线 + 渐变面积填充，多系列用 ; 分行（1500×560）",
    category: "chart",
    glyph: "LINE",
    component: DatavizLineChart,
    durationInFrames: 120,
    bounds: { x: 0, y: 0, width: 1500, height: 560 },
    defaultPosition: { x: 210, y: 260, scale: 1 },
    defaultProps: {
      xLabels:
        "1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月",
      seriesNames: "营收,利润",
      seriesValues:
        "210,245,280,310,295,340,365,390,420,450,510,580;65,78,92,105,98,120,135,148,165,178,210,245",
      accentColor: COLORS.teal,
      delaySeconds: 0,
    },
    defaultBackgroundOpacity: 0,
    propsSchema: {
      xLabels: { type: "text", label: "X 轴标签 (逗号分隔)" },
      seriesNames: { type: "text", label: "系列名 (逗号分隔)" },
      seriesValues: {
        type: "text",
        label: "系列数值 (分号分行，每行逗号分隔)",
      },
      accentColor: { type: "color", label: "首系列颜色" },
      delaySeconds: { type: "number", label: "进场延迟(秒)", min: 0, max: 10, step: 0.1 },
    },
  },
  {
    id: "DatavizBackground",
    name: "数据可视化 · 动态背景",
    description: "深色渐变 + 漂浮粒子 + 漂移光晕（1920×1080）",
    category: "brand",
    glyph: "BG",
    component: DatavizBackground,
    durationInFrames: 120,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    defaultPosition: { x: 0, y: 0, scale: 1 },
    defaultProps: {},
    defaultBackgroundOpacity: 0,
    propsSchema: {},
  },

  // --- Full-frame scenes (1920×1080) ---
  {
    id: "DatavizIntro",
    name: "数据可视化 · 开场标题",
    description: "徽章 + 大标题 + 渐变下划线 + 副标题 + 角落装饰",
    category: "text",
    glyph: "INTRO",
    component: DatavizIntro,
    durationInFrames: 120,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    defaultPosition: { x: 0, y: 0, scale: 1 },
    defaultProps: {
      badgeText: "数据可视化报告",
      title: "2026 年度业务报告",
      subtitle: "Annual Business Intelligence Dashboard",
      period: "Q1 – Q4 2026",
      cornerAccentColor: COLORS.blue,
    },
    defaultBackgroundOpacity: 0,
    propsSchema: {
      badgeText: { type: "text", label: "徽章文本" },
      title: { type: "text", label: "主标题" },
      subtitle: { type: "text", label: "副标题" },
      period: { type: "text", label: "时间段" },
      cornerAccentColor: { type: "color", label: "角落装饰色" },
    },
  },
  {
    id: "DatavizKpiScene",
    name: "数据可视化 · 4 指标场景",
    description: "顶部标题 + 4 张 KPI 卡片横向排列",
    category: "metric",
    glyph: "KPI×4",
    component: DatavizKpiScene,
    durationInFrames: 180,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    defaultPosition: { x: 0, y: 0, scale: 1 },
    defaultProps: {
      headerTitle: "核心指标总览",
      period: "Q1 – Q4 2026",
      kpi1Label: "总营收",
      kpi1Value: 48200000,
      kpi1Format: "currency",
      kpi1Delta: 23.5,
      kpi2Label: "活跃用户",
      kpi2Value: 1280000,
      kpi2Format: "number",
      kpi2Delta: 41.2,
      kpi3Label: "订单量",
      kpi3Value: 356800,
      kpi3Format: "number",
      kpi3Delta: 18.7,
      kpi4Label: "客户满意度",
      kpi4Value: 96.8,
      kpi4Format: "percent",
      kpi4Delta: 4.3,
    },
    defaultBackgroundOpacity: 0,
    propsSchema: {
      headerTitle: { type: "text", label: "场景标题" },
      period: { type: "text", label: "时间段" },
      kpi1Label: { type: "text", label: "KPI1 标签" },
      kpi1Value: { type: "number", label: "KPI1 数值" },
      kpi1Format: {
        type: "select",
        label: "KPI1 格式",
        options: [
          { label: "数字", value: "number" },
          { label: "百分比", value: "percent" },
          { label: "货币", value: "currency" },
        ],
      },
      kpi1Delta: { type: "number", label: "KPI1 同比" },
      kpi2Label: { type: "text", label: "KPI2 标签" },
      kpi2Value: { type: "number", label: "KPI2 数值" },
      kpi2Format: {
        type: "select",
        label: "KPI2 格式",
        options: [
          { label: "数字", value: "number" },
          { label: "百分比", value: "percent" },
          { label: "货币", value: "currency" },
        ],
      },
      kpi2Delta: { type: "number", label: "KPI2 同比" },
      kpi3Label: { type: "text", label: "KPI3 标签" },
      kpi3Value: { type: "number", label: "KPI3 数值" },
      kpi3Format: {
        type: "select",
        label: "KPI3 格式",
        options: [
          { label: "数字", value: "number" },
          { label: "百分比", value: "percent" },
          { label: "货币", value: "currency" },
        ],
      },
      kpi3Delta: { type: "number", label: "KPI3 同比" },
      kpi4Label: { type: "text", label: "KPI4 标签" },
      kpi4Value: { type: "number", label: "KPI4 数值" },
      kpi4Format: {
        type: "select",
        label: "KPI4 格式",
        options: [
          { label: "数字", value: "number" },
          { label: "百分比", value: "percent" },
          { label: "货币", value: "currency" },
        ],
      },
      kpi4Delta: { type: "number", label: "KPI4 同比" },
    },
  },
  {
    id: "DatavizBarScene",
    name: "数据可视化 · 柱状图场景",
    description: "顶部标题 + 柱状图卡片（步进增长柱 + 数值 + 单位）",
    category: "chart",
    glyph: "BAR+",
    component: DatavizBarScene,
    durationInFrames: 210,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    defaultPosition: { x: 0, y: 0, scale: 1 },
    defaultProps: {
      title: "季度营收对比 (万元)",
      labels: "Q1,Q2,Q3,Q4",
      values: "920,1180,1050,1670",
      unit: "万元",
      accentColor: COLORS.blue,
    },
    defaultBackgroundOpacity: 0,
    propsSchema: {
      title: { type: "text", label: "场景标题" },
      labels: { type: "text", label: "X 轴标签" },
      values: { type: "text", label: "数值" },
      unit: { type: "text", label: "单位" },
      accentColor: { type: "color", label: "柱体强调色" },
    },
  },
  {
    id: "DatavizLineScene",
    name: "数据可视化 · 折线场景",
    description: "顶部标题 + 双系列折线趋势（自绘笔触 + 渐变面积）",
    category: "chart",
    glyph: "LINE+",
    component: DatavizLineScene,
    durationInFrames: 150,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    defaultPosition: { x: 0, y: 0, scale: 1 },
    defaultProps: {
      title: "月度增长趋势",
      unit: "万",
      xLabels:
        "1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月",
      seriesNames: "营收,利润",
      seriesValues:
        "210,245,280,310,295,340,365,390,420,450,510,580;65,78,92,105,98,120,135,148,165,178,210,245",
      accentColor: COLORS.teal,
    },
    defaultBackgroundOpacity: 0,
    propsSchema: {
      title: { type: "text", label: "场景标题" },
      unit: { type: "text", label: "单位" },
      xLabels: { type: "text", label: "X 轴标签" },
      seriesNames: { type: "text", label: "系列名" },
      seriesValues: { type: "text", label: "系列数值 (分号分行)" },
    },
  },
  {
    id: "DatavizOutro",
    name: "数据可视化 · 收尾总结",
    description: "标题 + 渐变分隔 + 4 项关键数据 + 行动号召",
    category: "text",
    glyph: "OUTRO",
    component: DatavizOutro,
    durationInFrames: 90,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    defaultPosition: { x: 0, y: 0, scale: 1 },
    defaultProps: {
      title: "2026 关键成果",
      ctaText: "THANKS FOR WATCHING",
      stat1Label: "全年营收",
      stat1Value: "¥4,820万",
      stat2Label: "用户增长",
      stat2Value: "+41.2%",
      stat3Label: "订单总量",
      stat3Value: "35.7万",
      stat4Label: "满意度",
      stat4Value: "96.8%",
    },
    defaultBackgroundOpacity: 0,
    propsSchema: {
      title: { type: "text", label: "总结标题" },
      ctaText: { type: "text", label: "行动号召" },
      stat1Label: { type: "text", label: "数据 1 标签" },
      stat1Value: { type: "text", label: "数据 1 值" },
      stat2Label: { type: "text", label: "数据 2 标签" },
      stat2Value: { type: "text", label: "数据 2 值" },
      stat3Label: { type: "text", label: "数据 3 标签" },
      stat3Value: { type: "text", label: "数据 3 值" },
      stat4Label: { type: "text", label: "数据 4 标签" },
      stat4Value: { type: "text", label: "数据 4 值" },
    },
  },
];

// Empty timeline — user requested not to populate the timeline.
// Workbench will fall back to inserting only the first definition as a
// single instance when the module loads, but the save→restore step below
// brings the bathroom timeline back unchanged.
export const MOTION_TIMELINE: never[] = [];

export default DatavizIntro;