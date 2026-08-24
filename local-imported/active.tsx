import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// =====================================================
// 《未来3年卫浴行业》口播视频 · 定制动效组件包
// 依据 SRT 逐句时间戳编排：7 个语义段落 → 7 个组件
// 竖屏 9:16 画布（1080×1920），FPS 30，总长 582 帧（19.41s）
// =====================================================

export const FPS = 30;
export const DURATION_IN_FRAMES = 582;

const FONT_STACK = "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
const INK = "#f5f9ff";
const INK_SOFT = "rgba(214, 228, 240, 0.72)";
const INK_FAINT = "rgba(199, 214, 228, 0.5)";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

type CommonProps = {
  backgroundOpacity?: number;
};

const cardSurface = (alpha: number): React.CSSProperties => ({
  borderRadius: 24,
  background: `linear-gradient(158deg, rgba(9, 13, 19, ${0.9 * alpha}), rgba(13, 18, 27, ${0.62 * alpha}))`,
  border: `1px solid rgba(255, 255, 255, ${0.16 * alpha})`,
  boxShadow: `0 26px 72px rgba(0, 0, 0, ${0.46 * alpha})`,
  backdropFilter: alpha > 0.02 ? `blur(${Math.round(5 * alpha)}px)` : undefined,
});

// 进出场：进场弹簧 + 出场在实例结束前 8 帧淡出
const useScene = (exitSeconds: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.85 },
  });
  const exitAt = Math.max(0.5, exitSeconds) * fps - 8;
  const exit = interpolate(frame, [exitAt, exitAt + 8], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    frame,
    fps,
    enter,
    exit,
    sceneOpacity: (0.12 + 0.88 * enter) * exit,
    sceneRise: (1 - enter) * 26,
  };
};

const itemSpring = (
  frame: number,
  fps: number,
  startSeconds: number,
  lead = 0,
) =>
  spring({
    frame: frame - Math.max(0, startSeconds * fps - lead),
    fps,
    config: { damping: 200, stiffness: 150, mass: 0.7 },
  });

const parseItemStarts = (raw: string | undefined, count: number) => {
  const parts = String(raw ?? "")
    .split("|")
    .map((piece) => Number(piece.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return Array.from({ length: count }, (_, i) =>
    i < parts.length ? parts[i] : i * 1.1,
  );
};

const KickerChip: React.FC<{
  text: string;
  color: string;
  opacity: number;
  x?: number;
  y?: number;
}> = ({ text, color, opacity, x = 0, y = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      display: "flex",
      alignItems: "center",
      gap: 10,
      opacity,
    }}
  >
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: 3,
        background: color,
        boxShadow: `0 0 14px ${color}`,
      }}
    />
    <span
      style={{
        fontSize: 19,
        fontWeight: 700,
        letterSpacing: "0.34em",
        color: INK_SOFT,
        fontFamily: FONT_STACK,
      }}
    >
      {text}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// 1. TitleReveal · 章节标题揭示（开场钩子 0.13s–3.2s）
//    台词：未来3年 / 卫浴店只有这种 / 门店能够赚钱
// ---------------------------------------------------------------------------
type TitleRevealProps = CommonProps & {
  kicker?: string;
  titleLead?: string;
  titleNumber?: string;
  titleTail?: string;
  subtitle?: string;
  footerTag?: string;
  accentColor?: string;
  subtitleStart?: number;
  exitSeconds?: number;
};

export const TitleReveal: React.FC<TitleRevealProps> = ({
  backgroundOpacity = 0,
  kicker = "卫浴行业 · 趋势判断",
  titleLead = "未来",
  titleNumber = "3",
  titleTail = "年",
  subtitle = "只有这种门店能够赚钱",
  footerTag = "WINNING STORE MODEL",
  accentColor = "#6ee7ff",
  subtitleStart = 0.75,
  exitSeconds = 3.07,
}) => {
  const { frame, fps, sceneOpacity, sceneRise } = useScene(exitSeconds);
  const alpha = clamp01(backgroundOpacity);

  const leadIn = itemSpring(frame, fps, 0.18, 6);
  const numberIn = itemSpring(frame, fps, 0.4, 0);
  const lineIn = itemSpring(frame, fps, 0.62, 0);
  const subIn = itemSpring(frame, fps, subtitleStart, 0);
  const tagIn = itemSpring(frame, fps, subtitleStart + 0.28, 0);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 640,
        height: 330,
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: FONT_STACK,
        color: INK,
        ...cardSurface(alpha),
        opacity: sceneOpacity,
        transform: `translateY(${sceneRise}px)`,
      }}
    >
      <KickerChip
        text={kicker}
        color={accentColor}
        opacity={leadIn}
        x={44}
        y={34}
      />

      <div
        style={{
          position: "absolute",
          left: 44,
          top: 86,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          opacity: 0.1 + 0.9 * leadIn,
          transform: `translateY(${(1 - leadIn) * 18}px)`,
        }}
      >
        <span style={{ fontSize: 88, fontWeight: 800, letterSpacing: "0.02em" }}>
          {titleLead}
        </span>
        <span
          style={{
            fontSize: 132,
            fontWeight: 900,
            lineHeight: 1,
            color: accentColor,
            textShadow: `0 0 34px ${accentColor}66, 0 4px 22px rgba(0,0,0,0.55)`,
            transform: `scale(${0.55 + 0.45 * numberIn})`,
          }}
        >
          {titleNumber}
        </span>
        <span style={{ fontSize: 88, fontWeight: 800, letterSpacing: "0.02em" }}>
          {titleTail}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 44,
          top: 236,
          width: 300,
          height: 7,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}00)`,
          transformOrigin: "0 50%",
          transform: `scaleX(${lineIn})`,
          boxShadow: `0 0 18px ${accentColor}55`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 44,
          top: 258,
          fontSize: 30,
          fontWeight: 650,
          color: INK,
          textShadow: "0 3px 16px rgba(0,0,0,0.6)",
          opacity: 0.12 + 0.88 * subIn,
          transform: `translateY(${(1 - subIn) * 16}px)`,
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          position: "absolute",
          left: 44,
          bottom: 26,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.28em",
          color: INK_FAINT,
          opacity: tagIn * 0.9,
        }}
      >
        {footerTag}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. LineTrend · 下滑趋势（风险预警 3.2s–6.4s）
//    台词：单纯卖货的门店只会 / 慢慢的被市场淘汰
// ---------------------------------------------------------------------------
type LineTrendProps = CommonProps & {
  title?: string;
  subtitle?: string;
  points?: string;
  xLabels?: string;
  deltaLabel?: string;
  note?: string;
  noteStart?: number;
  accentColor?: string;
  exitSeconds?: number;
};

export const LineTrend: React.FC<LineTrendProps> = ({
  backgroundOpacity = 0,
  title = "传统卖货门店",
  subtitle = "TRAFFIC DECLINE",
  points = "98|84|70|55|42|30",
  xLabels = "Y1|Y2|Y3|Y4|Y5|Y6",
  deltaLabel = "-69%",
  note = "客流持续下滑 · 慢慢被淘汰",
  noteStart = 1.55,
  accentColor = "#ffc247",
  exitSeconds = 3.07,
}) => {
  const { frame, fps, sceneOpacity, sceneRise } = useScene(exitSeconds);
  const alpha = clamp01(backgroundOpacity);

  const values = points
    .split("|")
    .map((p) => Number(p.trim()))
    .filter((n) => Number.isFinite(n));
  const labels = xLabels.split("|");
  const chartW = 470;
  const chartH = 172;
  const baseY = 168;
  const stepX = values.length > 1 ? chartW / (values.length - 1) : chartW;
  const toY = (v: number) => baseY - (v / 100) * (chartH - 22);
  const coords = values.map((v, i) => [24 + i * stepX, toY(v)] as const);
  const pathD = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L ${coords[coords.length - 1][0].toFixed(1)} ${baseY} L ${coords[0][0].toFixed(1)} ${baseY} Z`;

  const draw = interpolate(frame, [6, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const headerIn = itemSpring(frame, fps, 0.05, 0);
  const noteIn = itemSpring(frame, fps, noteStart, 0);
  const lastPoint = coords[coords.length - 1];
  const pulse = 8 + 3 * Math.sin(frame / 2.6);

  const deltaValue = Number(deltaLabel.replace(/[^0-9.-]/g, ""));
  const shownDelta = Number.isFinite(deltaValue)
    ? Math.round(deltaValue * draw)
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 560,
        height: 360,
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: FONT_STACK,
        color: INK,
        ...cardSurface(alpha),
        opacity: sceneOpacity,
        transform: `translateY(${sceneRise}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 30,
          right: 36,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          opacity: 0.12 + 0.88 * headerIn,
          transform: `translateY(${(1 - headerIn) * 12}px)`,
        }}
      >
        <span style={{ fontSize: 30, fontWeight: 750 }}>{title}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: accentColor,
          }}
        >
          {subtitle}
        </span>
      </div>

      <svg
        viewBox="0 0 518 190"
        style={{
          position: "absolute",
          left: 24,
          top: 74,
          width: 518,
          height: 190,
        }}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((g) => (
          <line
            key={g}
            x1="24"
            x2="494"
            y1={28 + g * 46}
            y2={28 + g * 46}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        <path d={areaD} fill="url(#trendFill)" opacity={draw * 0.9} />
        <path
          d={pathD}
          fill="none"
          stroke={accentColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          style={{ filter: `drop-shadow(0 0 8px ${accentColor}88)` }}
        />
        {coords.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === coords.length - 1 ? 6 : 4}
            fill={i === coords.length - 1 ? accentColor : "rgba(255,255,255,0.55)"}
            opacity={draw > i / (coords.length - 1) - 0.03 ? 1 : 0}
          />
        ))}
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r={pulse}
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          opacity={draw > 0.97 ? 0.6 : 0}
        />
        {labels.slice(0, values.length).map((label, i) => (
          <text
            key={label + i}
            x={coords[i][0]}
            y={188}
            textAnchor="middle"
            fill="rgba(199,214,228,0.5)"
            fontSize="18"
            fontFamily={FONT_STACK}
            fontWeight={600}
          >
            {label}
          </text>
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          right: 36,
          top: 96,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          padding: "8px 16px",
          borderRadius: 12,
          background: `rgba(255, 194, 71, ${0.14 * Math.max(alpha, 0.35)})`,
          border: `1px solid ${accentColor}55`,
          opacity: draw > 0.55 ? 1 : 0,
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 850,
            color: accentColor,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {shownDelta}%
        </span>
        <span style={{ fontSize: 18, color: INK_SOFT, fontWeight: 650 }}>
          客流
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 36,
          bottom: 24,
          fontSize: 24,
          fontWeight: 650,
          color: INK,
          textShadow: "0 3px 14px rgba(0,0,0,0.55)",
          opacity: 0.12 + 0.88 * noteIn,
          transform: `translateY(${(1 - noteIn) * 14}px)`,
        }}
      >
        {note}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. StepFlow · 双节点步骤流（OMO 出路 6.4s–9.97s）
//    台词：线上引流线下成交 / 才是实体店最终的出路
// ---------------------------------------------------------------------------
type StepFlowProps = CommonProps & {
  title?: string;
  subtitle?: string;
  item1?: string;
  item1Note?: string;
  item2?: string;
  item2Note?: string;
  footer?: string;
  itemStarts?: string;
  accentColor?: string;
  exitSeconds?: number;
};

export const StepFlow: React.FC<StepFlowProps> = ({
  backgroundOpacity = 0,
  title = "实体店的最终出路",
  subtitle = "OMO PATH",
  item1 = "线上引流",
  item1Note = "短视频 · 种草获客",
  item2 = "线下成交",
  item2Note = "到店体验 · 服务转化",
  footer = "线上引流 × 线下成交 = 破局",
  itemStarts = "0.05|1.48",
  accentColor = "#b79cff",
  exitSeconds = 3.57,
}) => {
  const { frame, fps, sceneOpacity, sceneRise } = useScene(exitSeconds);
  const alpha = clamp01(backgroundOpacity);
  const starts = parseItemStarts(itemStarts, 2);

  const headerIn = itemSpring(frame, fps, 0.02, 0);
  const node1 = itemSpring(frame, fps, starts[0], 0);
  const node2 = itemSpring(frame, fps, starts[1], 0);
  const footerIn = itemSpring(frame, fps, starts[1] + 0.15, 0);
  const arrowFlow = (frame * 1.6) % 16;

  const nodeStyle = (p: number, fromX: number): React.CSSProperties => ({
    position: "absolute",
    top: 96,
    width: 286,
    height: 152,
    boxSizing: "border-box",
    padding: "22px 24px",
    borderRadius: 20,
    background: `linear-gradient(160deg, ${accentColor}22, rgba(255,255,255,${0.05 * Math.max(alpha, 0.4)}))`,
    border: `1px solid ${accentColor}${p > 0.5 ? "66" : "22"}`,
    opacity: p,
    transform: `translateX(${(1 - p) * fromX}px)`,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 720,
        height: 320,
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: FONT_STACK,
        color: INK,
        ...cardSurface(alpha),
        opacity: sceneOpacity,
        transform: `translateY(${sceneRise}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 30,
          right: 36,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          opacity: 0.12 + 0.88 * headerIn,
          transform: `translateY(${(1 - headerIn) * 12}px)`,
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 750 }}>{title}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: accentColor,
          }}
        >
          {subtitle}
        </span>
      </div>

      <div style={nodeStyle(node1, -46)}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <rect
              x="2"
              y="7"
              width="36"
              height="26"
              rx="7"
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
            />
            <path d="M17 15 L26 20 L17 25 Z" fill={accentColor} />
          </svg>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.2em",
              color: accentColor,
            }}
          >
            01
          </span>
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 38,
            fontWeight: 800,
            textShadow: "0 3px 14px rgba(0,0,0,0.55)",
          }}
        >
          {item1}
        </div>
        <div style={{ marginTop: 4, fontSize: 20, color: INK_SOFT }}>
          {item1Note}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 322,
          top: 148,
          width: 76,
          height: 48,
          opacity: Math.min(node1, node2) > 0.55 ? 1 : 0,
        }}
      >
        <svg width="76" height="48" viewBox="0 0 76 48">
          <line
            x1="2"
            y1="24"
            x2="58"
            y2="24"
            stroke={accentColor}
            strokeWidth="3"
            strokeDasharray="9 7"
            strokeDashoffset={-arrowFlow}
            strokeLinecap="round"
          />
          <path
            d="M56 12 L74 24 L56 36 Z"
            fill={accentColor}
            opacity={node2 > 0.4 ? 1 : 0.25}
          />
        </svg>
      </div>

      <div style={{ ...nodeStyle(node2, 46), left: 410 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <path
              d="M5 14 L5 9 Q5 5 9 5 L31 5 Q35 5 35 9 L35 14 Z"
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
            />
            <rect
              x="7"
              y="14"
              width="26"
              height="21"
              rx="3"
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
            />
            <rect x="16" y="21" width="8" height="14" fill={accentColor} />
          </svg>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.2em",
              color: accentColor,
            }}
          >
            02
          </span>
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 38,
            fontWeight: 800,
            textShadow: "0 3px 14px rgba(0,0,0,0.55)",
          }}
        >
          {item2}
        </div>
        <div style={{ marginTop: 4, fontSize: 20, color: INK_SOFT }}>
          {item2Note}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 36,
          bottom: 22,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: 0.12 + 0.88 * footerIn,
          transform: `translateY(${(1 - footerIn) * 14}px)`,
        }}
      >
        <span
          style={{
            width: 26,
            height: 4,
            borderRadius: 2,
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            textShadow: "0 3px 14px rgba(0,0,0,0.55)",
          }}
        >
          {footer}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. CompareSplit · 左右对比（双引擎 9.97s–13.0s）
//    台词：短视频做品牌种草 / 直播做精准转化
// ---------------------------------------------------------------------------
type CompareSplitProps = CommonProps & {
  title?: string;
  subtitle?: string;
  leftTitle?: string;
  leftNote?: string;
  leftTag?: string;
  rightTitle?: string;
  rightNote?: string;
  rightTag?: string;
  leftColor?: string;
  rightColor?: string;
  itemStarts?: string;
  exitSeconds?: number;
};

export const CompareSplit: React.FC<CompareSplitProps> = ({
  backgroundOpacity = 0,
  title = "获客双引擎",
  subtitle = "TWIN ENGINE",
  leftTitle = "短视频",
  leftNote = "品牌种草",
  leftTag = "内容获客",
  rightTitle = "直播",
  rightNote = "精准转化",
  rightTag = "即时成交",
  leftColor = "#6ee7ff",
  rightColor = "#b7f36b",
  itemStarts = "0.05|1.51",
  exitSeconds = 3.03,
}) => {
  const { frame, fps, sceneOpacity, sceneRise } = useScene(exitSeconds);
  const alpha = clamp01(backgroundOpacity);
  const starts = parseItemStarts(itemStarts, 2);

  const headerIn = itemSpring(frame, fps, 0.02, 0);
  const leftIn = itemSpring(frame, fps, starts[0], 0);
  const rightIn = itemSpring(frame, fps, starts[1], 0);

  const panel = (
    p: number,
    fromX: number,
    color: string,
  ): React.CSSProperties => ({
    position: "absolute",
    top: 92,
    width: 288,
    height: 234,
    boxSizing: "border-box",
    padding: "26px 26px 22px",
    borderRadius: 20,
    background: `linear-gradient(165deg, ${color}1f, rgba(255,255,255,${0.04 * Math.max(alpha, 0.4)}))`,
    border: `1px solid ${color}${p > 0.5 ? "5c" : "20"}`,
    opacity: p,
    transform: `translateX(${(1 - p) * fromX}px)`,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 660,
        height: 380,
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: FONT_STACK,
        color: INK,
        ...cardSurface(alpha),
        opacity: sceneOpacity,
        transform: `translateY(${sceneRise}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 30,
          right: 36,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          opacity: 0.12 + 0.88 * headerIn,
          transform: `translateY(${(1 - headerIn) * 12}px)`,
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 750 }}>{title}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: INK_SOFT,
          }}
        >
          {subtitle}
        </span>
      </div>

      <div style={panel(leftIn, -40, leftColor)}>
        <svg width="46" height="46" viewBox="0 0 46 46">
          <circle cx="23" cy="23" r="20" fill="none" stroke={leftColor} strokeWidth="2.5" />
          <path d="M19 15 L31 23 L19 31 Z" fill={leftColor} />
        </svg>
        <div
          style={{
            marginTop: 14,
            fontSize: 44,
            fontWeight: 820,
            textShadow: "0 3px 14px rgba(0,0,0,0.55)",
          }}
        >
          {leftTitle}
        </div>
        <div style={{ marginTop: 2, fontSize: 26, color: INK_SOFT, fontWeight: 650 }}>
          {leftNote}
        </div>
        <div
          style={{
            marginTop: 14,
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: 10,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: leftColor,
            border: `1px solid ${leftColor}55`,
            background: `${leftColor}14`,
          }}
        >
          {leftTag}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 312,
          top: 186,
          fontSize: 36,
          fontWeight: 850,
          color: INK_SOFT,
          opacity: Math.min(leftIn, rightIn) > 0.6 ? 0.95 : 0,
        }}
      >
        ×
      </div>

      <div style={{ ...panel(rightIn, 40, rightColor), left: 348 }}>
        <svg width="46" height="46" viewBox="0 0 46 46">
          <circle cx="23" cy="23" r="20" fill="none" stroke={rightColor} strokeWidth="2.5" />
          <circle cx="23" cy="23" r="7" fill={rightColor} />
          <path
            d="M23 1 A22 22 0 0 1 45 23"
            fill="none"
            stroke={rightColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            marginTop: 14,
            fontSize: 44,
            fontWeight: 820,
            textShadow: "0 3px 14px rgba(0,0,0,0.55)",
          }}
        >
          {rightTitle}
        </div>
        <div style={{ marginTop: 2, fontSize: 26, color: INK_SOFT, fontWeight: 650 }}>
          {rightNote}
        </div>
        <div
          style={{
            marginTop: 14,
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: 10,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: rightColor,
            border: `1px solid ${rightColor}55`,
            background: `${rightColor}14`,
          }}
        >
          {rightTag}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. BulletStack · 逐条要点（转型红利 13.0s–15.08s）
//    台词：客流稳定 / 客单更高
// ---------------------------------------------------------------------------
type BulletStackProps = CommonProps & {
  title?: string;
  subtitle?: string;
  item1?: string;
  item1Note?: string;
  item2?: string;
  item2Note?: string;
  itemStarts?: string;
  accentColor?: string;
  exitSeconds?: number;
};

export const BulletStack: React.FC<BulletStackProps> = ({
  backgroundOpacity = 0,
  title = "转型双重红利",
  subtitle = "DIVIDENDS",
  item1 = "客流稳定",
  item1Note = "线上蓄水 · 持续到店",
  item2 = "客单更高",
  item2Note = "体验升级 · 连带成交",
  itemStarts = "0.05|0.88",
  accentColor = "#b7f36b",
  exitSeconds = 2.07,
}) => {
  const { frame, fps, sceneOpacity, sceneRise } = useScene(exitSeconds);
  const alpha = clamp01(backgroundOpacity);
  const starts = parseItemStarts(itemStarts, 2);

  const headerIn = itemSpring(frame, fps, 0.02, 0);
  const rows = [
    { label: item1, note: item1Note, start: starts[0], top: 100 },
    { label: item2, note: item2Note, start: starts[1], top: 198 },
  ].map((row) => ({
    ...row,
    pop: itemSpring(frame, fps, row.start, 0),
    check: interpolate(frame, [row.start * fps + 6, row.start * fps + 22], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  }));

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
        fontFamily: FONT_STACK,
        color: INK,
        ...cardSurface(alpha),
        opacity: sceneOpacity,
        transform: `translateY(${sceneRise}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 30,
          right: 36,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          opacity: 0.12 + 0.88 * headerIn,
          transform: `translateY(${(1 - headerIn) * 12}px)`,
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 750 }}>{title}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: accentColor,
          }}
        >
          {subtitle}
        </span>
      </div>

      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            position: "absolute",
            left: 36,
            top: row.top,
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: row.pop,
            transform: `translateX(${(1 - row.pop) * -26}px)`,
          }}
        >
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke={accentColor}
              strokeWidth="3"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - row.check}
              transform="rotate(-90 26 26)"
            />
            <path
              d="M15 27 L23 35 L38 19"
              fill="none"
              stroke={accentColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - row.check}
            />
          </svg>
          <div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                textShadow: "0 3px 14px rgba(0,0,0,0.55)",
              }}
            >
              {row.label}
            </div>
            <div style={{ marginTop: 4, fontSize: 20, color: INK_SOFT }}>
              {row.note}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. BarChart · 突破瓶颈柱状图（15.08s–16.88s）
//    台词：轻松突破业绩瓶颈
// ---------------------------------------------------------------------------
type BarChartProps = CommonProps & {
  title?: string;
  subtitle?: string;
  bars?: string;
  ceiling?: number;
  ceilingLabel?: string;
  xLabels?: string;
  badgeText?: string;
  badgeStart?: number;
  unit?: string;
  accentColor?: string;
  exitSeconds?: number;
};

export const BarChart: React.FC<BarChartProps> = ({
  backgroundOpacity = 0,
  title = "突破业绩瓶颈",
  subtitle = "BREAKTHROUGH",
  bars = "38|46|52|58|66|78|96|112",
  ceiling = 100,
  ceilingLabel = "业绩瓶颈线 100",
  xLabels = "Q1|Q2|Q3|Q4|Q5|Q6|Q7|Q8",
  badgeText = "突破 +12",
  badgeStart = 1.15,
  unit = "业绩指数",
  accentColor = "#ffd76a",
  exitSeconds = 1.8,
}) => {
  const { frame, fps, sceneOpacity, sceneRise } = useScene(exitSeconds);
  const alpha = clamp01(backgroundOpacity);

  const values = bars
    .split("|")
    .map((p) => Number(p.trim()))
    .filter((n) => Number.isFinite(n));
  const labels = xLabels.split("|");
  const chartTop = 96;
  const chartH = 196;
  const baseY = chartTop + chartH;
  const maxV = Math.max(...values, ceiling) * 1.08;
  const barAreaW = 488;
  const barW = 36;
  const gap =
    values.length > 1 ? (barAreaW - values.length * barW) / (values.length - 1) : 0;
  const ceilingY = baseY - (ceiling / maxV) * chartH;

  const headerIn = itemSpring(frame, fps, 0.02, 0);
  const badgeIn = itemSpring(frame, fps, badgeStart, 0);
  const barGrow = (i: number) =>
    interpolate(
      frame,
      [8 + i * 4, 26 + i * 4],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      },
    );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 560,
        height: 380,
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: FONT_STACK,
        color: INK,
        ...cardSurface(alpha),
        opacity: sceneOpacity,
        transform: `translateY(${sceneRise}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 30,
          right: 36,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          opacity: 0.12 + 0.88 * headerIn,
          transform: `translateY(${(1 - headerIn) * 12}px)`,
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 750 }}>{title}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: accentColor,
          }}
        >
          {subtitle}
        </span>
      </div>

      <svg
        viewBox="0 0 560 380"
        style={{ position: "absolute", left: 0, top: 0, width: 560, height: 380 }}
      >
        <line
          x1="36"
          x2="524"
          y1={baseY}
          y2={baseY}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="2"
        />
        <line
          x1="36"
          x2="524"
          y1={ceilingY}
          y2={ceilingY}
          stroke={accentColor}
          strokeWidth="2.5"
          strokeDasharray="10 8"
          opacity={0.85}
        />
        {values.map((v, i) => {
          const h = (v / maxV) * chartH * barGrow(i);
          const x = 36 + 2 + i * (barW + gap);
          const y = baseY - h;
          const isBreak = v > ceiling;
          const color = isBreak ? accentColor : "rgba(255,255,255,0.34)";
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, h)}
                rx="5"
                fill={color}
                opacity={isBreak ? 1 : 0.9}
                style={
                  isBreak
                    ? { filter: `drop-shadow(0 0 10px ${accentColor}aa)` }
                    : undefined
                }
              />
              {isBreak && h > 4 ? (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.min(10, h)}
                  rx="5"
                  fill="#ffffff"
                  opacity={0.85}
                />
              ) : null}
            </g>
          );
        })}
        {labels.slice(0, values.length).map((label, i) => (
          <text
            key={label + i}
            x={36 + 2 + i * (barW + gap) + barW / 2}
            y={baseY + 26}
            textAnchor="middle"
            fill="rgba(199,214,228,0.5)"
            fontSize="18"
            fontFamily={FONT_STACK}
            fontWeight={600}
          >
            {label}
          </text>
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          left: 36,
          top: ceilingY - 30,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: accentColor,
          opacity: headerIn * 0.95,
        }}
      >
        {ceilingLabel}
      </div>

      <div
        style={{
          position: "absolute",
          right: 36,
          top: 92,
          padding: "8px 18px",
          borderRadius: 12,
          background: `rgba(255, 215, 106, ${0.18 * Math.max(alpha, 0.4)})`,
          border: `1px solid ${accentColor}66`,
          fontSize: 26,
          fontWeight: 850,
          color: accentColor,
          textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          opacity: badgeIn,
          transform: `scale(${0.6 + 0.4 * badgeIn}) rotate(${(1 - badgeIn) * -6}deg)`,
        }}
      >
        {badgeText}
      </div>

      <div
        style={{
          position: "absolute",
          right: 36,
          bottom: 20,
          fontSize: 18,
          color: INK_FAINT,
          fontWeight: 600,
        }}
      >
        {unit}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 7. EndLockup · 结尾锁定（紧跟趋势·年入百万 16.88s–19.41s）
//    台词：紧跟趋势 / 轻松实现年入百万
// ---------------------------------------------------------------------------
type EndLockupProps = CommonProps & {
  kicker?: string;
  amountPrefix?: string;
  amount?: number;
  amountUnit?: string;
  amountNote?: string;
  cta?: string;
  accentColor?: string;
  exitSeconds?: number;
};

export const EndLockup: React.FC<EndLockupProps> = ({
  backgroundOpacity = 0,
  kicker = "紧跟趋势",
  amountPrefix = "¥",
  amount = 100,
  amountUnit = "万 / 年",
  amountNote = "年入目标",
  cta = "线上引流 × 线下成交 · 轻松实现",
  accentColor = "#ffd76a",
  exitSeconds = 2.53,
}) => {
  const { frame, fps, sceneOpacity, sceneRise } = useScene(exitSeconds);
  const alpha = clamp01(backgroundOpacity);

  const kickerIn = itemSpring(frame, fps, 0.0, 0);
  const count = Math.round(
    interpolate(frame, [10, 44], [0, amount], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const lineIn = itemSpring(frame, fps, 0.5, 0);
  const noteIn = itemSpring(frame, fps, 0.7, 0);
  const ctaIn = itemSpring(frame, fps, 0.9, 0);
  const spark = (delay: number) =>
    spring({
      frame: frame - delay,
      fps,
      config: { damping: 12, stiffness: 160, mass: 0.6 },
    });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 700,
        height: 380,
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: FONT_STACK,
        color: INK,
        ...cardSurface(alpha),
        opacity: sceneOpacity,
        transform: `translateY(${sceneRise}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 20px",
          borderRadius: 999,
          border: `1px solid ${accentColor}66`,
          background: `${accentColor}16`,
          opacity: kickerIn,
          transform: `translateY(${(1 - kickerIn) * -14}px)`,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
        <span
          style={{
            fontSize: 20,
            fontWeight: 750,
            letterSpacing: "0.3em",
            color: accentColor,
          }}
        >
          {kicker}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 44,
          top: 108,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 58,
            fontWeight: 800,
            color: accentColor,
            opacity: kickerIn,
          }}
        >
          {amountPrefix}
        </span>
        <span
          style={{
            fontSize: 138,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "0.01em",
            color: INK,
            textShadow: `0 0 42px ${accentColor}55, 0 6px 26px rgba(0,0,0,0.6)`,
          }}
        >
          {count}
        </span>
        <span
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: INK_SOFT,
            opacity: noteIn,
          }}
        >
          {amountUnit}
        </span>
      </div>

      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        style={{
          position: "absolute",
          left: 486,
          top: 96,
          opacity: spark(26) * 0.95,
          transform: `scale(${0.4 + 0.6 * spark(26)}) rotate(${spark(26) * 20}deg)`,
        }}
      >
        <path
          d="M15 0 L18 12 L30 15 L18 18 L15 30 L12 18 L0 15 L12 12 Z"
          fill={accentColor}
        />
      </svg>
      <svg
        width="20"
        height="20"
        viewBox="0 0 30 30"
        style={{
          position: "absolute",
          left: 530,
          top: 176,
          opacity: spark(40) * 0.8,
          transform: `scale(${0.4 + 0.6 * spark(40)})`,
        }}
      >
        <path
          d="M15 0 L18 12 L30 15 L18 18 L15 30 L12 18 L0 15 L12 12 Z"
          fill={accentColor}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 44,
          top: 268,
          width: 380,
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}00)`,
          transformOrigin: "0 50%",
          transform: `scaleX(${lineIn})`,
          boxShadow: `0 0 16px ${accentColor}55`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 44,
          top: 288,
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          opacity: 0.12 + 0.88 * noteIn,
          transform: `translateY(${(1 - noteIn) * 12}px)`,
        }}
      >
        <span style={{ fontSize: 26, fontWeight: 750, color: accentColor }}>
          {amountNote}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 44,
          bottom: 28,
          fontSize: 24,
          fontWeight: 650,
          color: INK,
          textShadow: "0 3px 14px rgba(0,0,0,0.55)",
          opacity: 0.12 + 0.88 * ctaIn,
          transform: `translateY(${(1 - ctaIn) * 12}px)`,
        }}
      >
        {cta}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 组件清单（全部使用工作台标准 ID，导入后覆盖内置基础模板）
// ---------------------------------------------------------------------------
export const MOTION_COMPONENTS = [
  {
    id: "TitleReveal",
    name: "章节标题揭示",
    description: "开场钩子：超大数字年份 + 副标题逐层揭示",
    category: "text",
    glyph: "3",
    component: TitleReveal,
    durationInFrames: 92,
    bounds: { x: 0, y: 0, width: 640, height: 330 },
    defaultPosition: { x: 220, y: 830, scale: 1 },
    defaultProps: {
      kicker: "卫浴行业 · 趋势判断",
      titleLead: "未来",
      titleNumber: "3",
      titleTail: "年",
      subtitle: "只有这种门店能够赚钱",
      footerTag: "WINNING STORE MODEL",
      accentColor: "#6ee7ff",
      subtitleStart: 0.75,
      exitSeconds: 3.07,
      backgroundOpacity: 0,
    },
    propsSchema: {
      kicker: { type: "text", label: "眉标" },
      titleLead: { type: "text", label: "标题前段" },
      titleNumber: { type: "text", label: "核心数字" },
      titleTail: { type: "text", label: "标题后段" },
      subtitle: { type: "text", label: "副标题" },
      footerTag: { type: "text", label: "底部标签" },
      accentColor: { type: "color", label: "强调色" },
      subtitleStart: { type: "number", label: "副标题延迟(秒)", min: 0, max: 5, step: 0.05 },
      exitSeconds: { type: "number", label: "退出时间(秒)", min: 0.5, max: 10, step: 0.05 },
    },
  },
  {
    id: "LineTrend",
    name: "折线趋势",
    description: "风险预警：逐年下滑折线 + 跌幅徽章",
    category: "chart",
    glyph: "↘",
    component: LineTrend,
    durationInFrames: 92,
    bounds: { x: 0, y: 0, width: 560, height: 360 },
    defaultPosition: { x: 260, y: 830, scale: 1 },
    defaultProps: {
      title: "传统卖货门店",
      subtitle: "TRAFFIC DECLINE",
      points: "98|84|70|55|42|30",
      xLabels: "Y1|Y2|Y3|Y4|Y5|Y6",
      deltaLabel: "-69%",
      note: "客流持续下滑 · 慢慢被淘汰",
      accentColor: "#ffc247",
      noteStart: 1.55,
      exitSeconds: 3.07,
      backgroundOpacity: 0,
    },
    propsSchema: {
      title: { type: "text", label: "标题" },
      subtitle: { type: "text", label: "副标题" },
      points: { type: "text", label: "数据点(|分隔)" },
      xLabels: { type: "text", label: "横轴标签(|分隔)" },
      deltaLabel: { type: "text", label: "跌幅" },
      note: { type: "text", label: "结论注释" },
      accentColor: { type: "color", label: "强调色" },
      noteStart: { type: "number", label: "注释延迟(秒)", min: 0, max: 5, step: 0.05 },
      exitSeconds: { type: "number", label: "退出时间(秒)", min: 0.5, max: 10, step: 0.05 },
    },
  },
  {
    id: "StepFlow",
    name: "步骤流",
    description: "OMO 路径：线上引流 → 线下成交 双节点动画",
    category: "structure",
    glyph: "⇄",
    component: StepFlow,
    durationInFrames: 107,
    bounds: { x: 0, y: 0, width: 720, height: 320 },
    defaultPosition: { x: 180, y: 840, scale: 1 },
    defaultProps: {
      title: "实体店的最终出路",
      subtitle: "OMO PATH",
      item1: "线上引流",
      item1Note: "短视频 · 种草获客",
      item2: "线下成交",
      item2Note: "到店体验 · 服务转化",
      footer: "线上引流 × 线下成交 = 破局",
      itemStarts: "0.05|1.48",
      accentColor: "#b79cff",
      exitSeconds: 3.57,
      backgroundOpacity: 0,
    },
    propsSchema: {
      title: { type: "text", label: "标题" },
      subtitle: { type: "text", label: "副标题" },
      item1: { type: "text", label: "节点1" },
      item1Note: { type: "text", label: "节点1注释" },
      item2: { type: "text", label: "节点2" },
      item2Note: { type: "text", label: "节点2注释" },
      footer: { type: "text", label: "底部结论" },
      itemStarts: { type: "text", label: "逐条起始(秒,|分隔)" },
      accentColor: { type: "color", label: "强调色" },
      exitSeconds: { type: "number", label: "退出时间(秒)", min: 0.5, max: 10, step: 0.05 },
    },
  },
  {
    id: "CompareSplit",
    name: "左右对比卡",
    description: "双引擎对比：短视频种草 × 直播转化",
    category: "structure",
    glyph: "×",
    component: CompareSplit,
    durationInFrames: 91,
    bounds: { x: 0, y: 0, width: 660, height: 380 },
    defaultPosition: { x: 210, y: 820, scale: 1 },
    defaultProps: {
      title: "获客双引擎",
      subtitle: "TWIN ENGINE",
      leftTitle: "短视频",
      leftNote: "品牌种草",
      leftTag: "内容获客",
      rightTitle: "直播",
      rightNote: "精准转化",
      rightTag: "即时成交",
      leftColor: "#6ee7ff",
      rightColor: "#b7f36b",
      itemStarts: "0.05|1.51",
      exitSeconds: 3.03,
      backgroundOpacity: 0,
    },
    propsSchema: {
      title: { type: "text", label: "标题" },
      subtitle: { type: "text", label: "副标题" },
      leftTitle: { type: "text", label: "左栏标题" },
      leftNote: { type: "text", label: "左栏注释" },
      leftTag: { type: "text", label: "左栏标签" },
      rightTitle: { type: "text", label: "右栏标题" },
      rightNote: { type: "text", label: "右栏注释" },
      rightTag: { type: "text", label: "右栏标签" },
      leftColor: { type: "color", label: "左栏色" },
      rightColor: { type: "color", label: "右栏色" },
      itemStarts: { type: "text", label: "逐条起始(秒,|分隔)" },
      exitSeconds: { type: "number", label: "退出时间(秒)", min: 0.5, max: 10, step: 0.05 },
    },
  },
  {
    id: "BulletStack",
    name: "逐条要点",
    description: "转型红利：勾选动画逐条弹出",
    category: "text",
    glyph: "✓",
    component: BulletStack,
    durationInFrames: 62,
    bounds: { x: 0, y: 0, width: 520, height: 300 },
    defaultPosition: { x: 280, y: 850, scale: 1 },
    defaultProps: {
      title: "转型双重红利",
      subtitle: "DIVIDENDS",
      item1: "客流稳定",
      item1Note: "线上蓄水 · 持续到店",
      item2: "客单更高",
      item2Note: "体验升级 · 连带成交",
      itemStarts: "0.05|0.88",
      accentColor: "#b7f36b",
      exitSeconds: 2.07,
      backgroundOpacity: 0,
    },
    propsSchema: {
      title: { type: "text", label: "标题" },
      subtitle: { type: "text", label: "副标题" },
      item1: { type: "text", label: "要点1" },
      item1Note: { type: "text", label: "要点1注释" },
      item2: { type: "text", label: "要点2" },
      item2Note: { type: "text", label: "要点2注释" },
      itemStarts: { type: "text", label: "逐条起始(秒,|分隔)" },
      accentColor: { type: "color", label: "强调色" },
      exitSeconds: { type: "number", label: "退出时间(秒)", min: 0.5, max: 10, step: 0.05 },
    },
  },
  {
    id: "BarChart",
    name: "柱状图",
    description: "业绩突破：柱体增长冲破瓶颈虚线",
    category: "chart",
    glyph: "▂▄█",
    component: BarChart,
    durationInFrames: 54,
    bounds: { x: 0, y: 0, width: 560, height: 380 },
    defaultPosition: { x: 260, y: 820, scale: 1 },
    defaultProps: {
      title: "突破业绩瓶颈",
      subtitle: "BREAKTHROUGH",
      bars: "38|46|52|58|66|78|96|112",
      ceiling: 100,
      ceilingLabel: "业绩瓶颈线 100",
      xLabels: "Q1|Q2|Q3|Q4|Q5|Q6|Q7|Q8",
      badgeText: "突破 +12",
      unit: "业绩指数",
      accentColor: "#ffd76a",
      badgeStart: 1.15,
      exitSeconds: 1.8,
      backgroundOpacity: 0,
    },
    propsSchema: {
      title: { type: "text", label: "标题" },
      subtitle: { type: "text", label: "副标题" },
      bars: { type: "text", label: "柱数据(|分隔)" },
      ceiling: { type: "number", label: "瓶颈线", min: 1, max: 500, step: 1 },
      ceilingLabel: { type: "text", label: "瓶颈线标签" },
      xLabels: { type: "text", label: "横轴标签(|分隔)" },
      badgeText: { type: "text", label: "徽章文字" },
      unit: { type: "text", label: "单位" },
      accentColor: { type: "color", label: "强调色" },
      badgeStart: { type: "number", label: "徽章延迟(秒)", min: 0, max: 5, step: 0.05 },
      exitSeconds: { type: "number", label: "退出时间(秒)", min: 0.5, max: 10, step: 0.05 },
    },
  },
  {
    id: "EndLockup",
    name: "结尾锁定",
    description: "行动收尾：¥100万 数字滚动 + 行动号召",
    category: "brand",
    glyph: "¥",
    component: EndLockup,
    durationInFrames: 76,
    bounds: { x: 0, y: 0, width: 700, height: 380 },
    defaultPosition: { x: 190, y: 810, scale: 1 },
    defaultProps: {
      kicker: "紧跟趋势",
      amountPrefix: "¥",
      amount: 100,
      amountUnit: "万 / 年",
      amountNote: "年入目标",
      cta: "线上引流 × 线下成交 · 轻松实现",
      accentColor: "#ffd76a",
      exitSeconds: 2.53,
      backgroundOpacity: 0,
    },
    propsSchema: {
      kicker: { type: "text", label: "眉标" },
      amountPrefix: { type: "text", label: "货币符号" },
      amount: { type: "number", label: "金额数字", min: 0, max: 9999, step: 1 },
      amountUnit: { type: "text", label: "金额单位" },
      amountNote: { type: "text", label: "金额注释" },
      cta: { type: "text", label: "行动号召" },
      accentColor: { type: "color", label: "强调色" },
      exitSeconds: { type: "number", label: "退出时间(秒)", min: 0.5, max: 10, step: 0.05 },
    },
  },
];

// ---------------------------------------------------------------------------
// 预设时间轴（逐句对齐 SRT：00:00:00.133 → 00:00:19.400）
// 竖屏 1080×1920 画布，组件居中排布于画面中下带
// ---------------------------------------------------------------------------
export const MOTION_TIMELINE = [
  {
    // 0.13s–3.2s 未来3年 / 卫浴店只有这种 / 门店能够赚钱
    componentId: "TitleReveal",
    startFrame: 4,
    durationInFrames: 92,
    position: { x: 220, y: 830, scale: 1 },
    backgroundOpacity: 0.68,
    props: {
      kicker: "卫浴行业 · 趋势判断",
      titleLead: "未来",
      titleNumber: "3",
      titleTail: "年",
      subtitle: "只有这种门店能够赚钱",
      footerTag: "WINNING STORE MODEL",
      accentColor: "#6ee7ff",
      subtitleStart: 0.75,
      exitSeconds: 3.07,
    },
  },
  {
    // 3.2s–6.4s 单纯卖货的门店只会 / 慢慢的被市场淘汰
    componentId: "LineTrend",
    startFrame: 96,
    durationInFrames: 92,
    position: { x: 260, y: 830, scale: 1 },
    backgroundOpacity: 0.68,
    props: {
      title: "单纯卖货的门店",
      subtitle: "MARKET ELIMINATION",
      points: "98|84|70|55|42|30",
      xLabels: "Y1|Y2|Y3|Y4|Y5|Y6",
      deltaLabel: "-69%",
      note: "客流持续下滑 · 慢慢被淘汰",
      accentColor: "#ffc247",
      noteStart: 1.55,
      exitSeconds: 3.07,
    },
  },
  {
    // 6.4s–9.97s 线上引流线下成交 / 才是实体店最终的出路
    componentId: "StepFlow",
    startFrame: 192,
    durationInFrames: 107,
    position: { x: 180, y: 840, scale: 1 },
    backgroundOpacity: 0.68,
    props: {
      title: "实体店的最终出路",
      subtitle: "OMO PATH",
      item1: "线上引流",
      item1Note: "短视频 · 种草获客",
      item2: "线下成交",
      item2Note: "到店体验 · 服务转化",
      footer: "线上引流 × 线下成交 = 破局",
      itemStarts: "0.05|1.48",
      accentColor: "#b79cff",
      exitSeconds: 3.57,
    },
  },
  {
    // 9.97s–13.0s 短视频做品牌种草 / 直播做精准转化
    componentId: "CompareSplit",
    startFrame: 299,
    durationInFrames: 91,
    position: { x: 210, y: 820, scale: 1 },
    backgroundOpacity: 0.68,
    props: {
      title: "获客双引擎",
      subtitle: "TWIN ENGINE",
      leftTitle: "短视频",
      leftNote: "品牌种草",
      leftTag: "内容获客",
      rightTitle: "直播",
      rightNote: "精准转化",
      rightTag: "即时成交",
      leftColor: "#6ee7ff",
      rightColor: "#b7f36b",
      itemStarts: "0.05|1.51",
      exitSeconds: 3.03,
    },
  },
  {
    // 13.0s–15.08s 客流稳定 / 客单更高
    componentId: "BulletStack",
    startFrame: 390,
    durationInFrames: 62,
    position: { x: 280, y: 850, scale: 1 },
    backgroundOpacity: 0.68,
    props: {
      title: "转型双重红利",
      subtitle: "DIVIDENDS",
      item1: "客流稳定",
      item1Note: "线上蓄水 · 持续到店",
      item2: "客单更高",
      item2Note: "体验升级 · 连带成交",
      itemStarts: "0.05|0.88",
      accentColor: "#b7f36b",
      exitSeconds: 2.07,
    },
  },
  {
    // 15.08s–16.88s 轻松突破业绩瓶颈
    componentId: "BarChart",
    startFrame: 452,
    durationInFrames: 54,
    position: { x: 260, y: 820, scale: 1 },
    backgroundOpacity: 0.68,
    props: {
      title: "轻松突破业绩瓶颈",
      subtitle: "BREAKTHROUGH",
      bars: "38|46|52|58|66|78|96|112",
      ceiling: 100,
      ceilingLabel: "业绩瓶颈线 100",
      xLabels: "Q1|Q2|Q3|Q4|Q5|Q6|Q7|Q8",
      badgeText: "突破 +12",
      unit: "业绩指数",
      accentColor: "#ffd76a",
      badgeStart: 1.15,
      exitSeconds: 1.8,
    },
  },
  {
    // 16.88s–19.41s 紧跟趋势 / 轻松实现年入百万
    componentId: "EndLockup",
    startFrame: 506,
    durationInFrames: 76,
    position: { x: 190, y: 810, scale: 1 },
    backgroundOpacity: 0.7,
    props: {
      kicker: "紧跟趋势",
      amountPrefix: "¥",
      amount: 100,
      amountUnit: "万 / 年",
      amountNote: "年入目标",
      cta: "线上引流 × 线下成交 · 轻松实现",
      accentColor: "#ffd76a",
      exitSeconds: 2.53,
    },
  },
];

export default TitleReveal;
