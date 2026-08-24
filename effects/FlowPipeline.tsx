import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";
import {
  CALLOUT_AV,
  CALLOUT_GCS,
  CALLOUT_VSM,
  DL_HOP2_END,
  DL_HOP3_END,
  EDGES,
  LOOP_SECONDS,
  LOG_SCRIPT,
  MONO,
  NODES,
  UP_HOP1_END,
  UP_HOP3_END,
  UP_START,
  ZONES,
  calloutOpacity,
  clamp01,
  evaluateFlow,
  fmtClock,
  type NodeDef,
} from "./flowPipelineData";

const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';

const NodeIcon: React.FC<{ icon: NodeDef["icon"] }> = ({ icon }) => {
  switch (icon) {
    case "uav":
      return (
        <g>
          <path
            d="M -22 14 L 0 -16 L 22 14 Z"
            fill="rgba(251,191,36,0.14)"
            stroke="#fbbf24"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <circle cx={0} cy={-6} r={4} fill="#fbbf24" />
          <line x1={-26} y1={16} x2={26} y2={16} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case "antenna":
      return (
        <g>
          <path d="M -12 15 L 0 -10 L 12 15" fill="none" stroke="#94a3b8" strokeWidth={2} />
          <path d="M -18 -8 A 20 20 0 0 1 18 -8" fill="none" stroke="#f8fafc" strokeWidth={2} strokeLinecap="round" />
          <path d="M -10 -14 A 12 12 0 0 1 10 -14" fill="none" stroke="#38bdf8" strokeWidth={2} strokeLinecap="round" />
          <circle cx={0} cy={-10} r={3} fill="#fbbf24" />
          <line x1={-15} y1={15} x2={15} y2={15} stroke="#94a3b8" strokeWidth={2} />
        </g>
      );
    case "cpu":
      return (
        <g>
          <rect x={-24} y={-24} width={48} height={48} rx={6} fill="#0f172a" stroke="#cbd5e1" strokeWidth={2} />
          <rect x={-16} y={-16} width={32} height={32} rx={3} fill="#1e293b" stroke="#38bdf8" strokeWidth={1.5} />
          <path d="M -8 0 H 8 M 0 -8 V 8" stroke="#fbbf24" strokeWidth={2} />
          <circle cx={0} cy={0} r={10} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3 2" />
        </g>
      );
    default:
      return (
        <g>
          <rect x={-26} y={-18} width={22} height={16} rx={2} fill="#1e293b" stroke="#38bdf8" strokeWidth={1.5} />
          <rect x={4} y={-18} width={22} height={16} rx={2} fill="#1e293b" stroke="#38bdf8" strokeWidth={1.5} />
          <rect x={-23} y={-15} width={16} height={10} fill="#020617" />
          <rect x={7} y={-15} width={16} height={10} fill="#020617" />
          <path d="M -20 -10 L -16 -13 L -11 -8" fill="none" stroke="#38bdf8" strokeWidth={1} />
          <path d="M -30 4 H 30 V 10 H -30 Z" fill="#334155" />
          <circle cx={0} cy={15} r={3} fill="#f8fafc" />
        </g>
      );
  }
};

type FlowPipelineProps = {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  loopSeconds?: number;
  dliColor?: string;
  propColor?: string;
  showHeader?: boolean;
  showConsole?: boolean;
  cardTransparent?: boolean;
};

export const FlowPipeline: React.FC<FlowPipelineProps> = ({
  enabled = true,
  title = "STANAG 4586 实现架构",
  subtitle = "数据转换管线：私有无人机系统 ←→ 标准化 STANAG 4586 互操作",
  loopSeconds = 0,
  dliColor = "#38bdf8",
  propColor = "#fbbf24",
  showHeader = true,
  showConsole = true,
  cardTransparent = false,
}) => {
  const frame = useCurrentFrame();
  const { fps: rawFps } = useVideoConfig();
  if (!enabled) return null;
  const fps = rawFps > 0 ? rawFps : 30;
  const loopT = loopSeconds && loopSeconds >= 8 ? loopSeconds : LOOP_SECONDS;
  const t = (frame / fps) % loopT;

  const flow = evaluateFlow(t);
  const pulse = 0.5 + 0.5 * Math.sin(((frame / fps) * Math.PI * 2) / 1.5);
  const dashOffsetDown = -(((frame / fps) * 24) % 24);
  const dashOffsetUp = ((frame / fps) * 24) % 24;

  const visibleLogs = LOG_SCRIPT.filter((l) => t >= l.t).slice(-4);
  const phaseLabel =
    flow.phase === "down"
      ? "下行链路：遥测（飞机 → 地面站）"
      : flow.phase === "up"
        ? "上行链路：指令（地面站 → 飞机）"
        : "系统空闲";

  const statusOf = (n: NodeDef) => {
    if (n.id === "gcs" && n.statusAlt && t >= DL_HOP3_END && t < UP_START)
      return n.statusAlt;
    if (n.id === "av" && n.statusAlt && t >= UP_HOP3_END) return n.statusAlt;
    return n.status;
  };

  const opAv = calloutOpacity(CALLOUT_AV, t);
  const opVsm = calloutOpacity(CALLOUT_VSM, t);
  const opGcs = calloutOpacity(CALLOUT_GCS, t);

  return (
    <div
      data-effect="FlowPipeline"
      style={{
        width: 1200,
        height: 700,
        position: "relative",
        background: "transparent",
        fontFamily: SANS,
        overflow: "hidden",
        color: "#f1f5f9",
      }}
    >
      {showHeader ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 64,
            padding: "10px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #1e293b",
            background: cardTransparent ? "transparent" : "rgba(8,11,16,0.85)",
            zIndex: 5,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: "#f8fafc",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: dliColor,
                  boxShadow: `0 0 ${(6 + pulse * 8).toFixed(1)}px ${dliColor}`,
                }}
              />
              {title}
            </div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3 }}>{subtitle}</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 14px",
              borderRadius: 4,
              background: "rgba(30,41,59,0.7)",
              border: "1px solid #1e293b",
              fontFamily: MONO,
              fontSize: 13,
              color: flow.phase === "up" ? propColor : dliColor,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: flow.phase === "up" ? propColor : dliColor,
                opacity: 0.35 + pulse * 0.65,
              }}
            />
            {phaseLabel}
            <span
              style={{
                fontSize: 10,
                background: "rgba(255,255,255,0.08)",
                padding: "2px 7px",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              NATO STANAG 4586
            </span>
          </div>
        </div>
      ) : null}

      <svg width={1200} height={700} viewBox="0 0 1200 700" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <marker id="fp-arrow" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
          </marker>
          <linearGradient id="fp-rf" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.6} />
          </linearGradient>
        </defs>

        {ZONES.map((z) => (
          <g key={z.head}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx={10}
              fill="rgba(15,23,42,0.42)"
              stroke={z.strong ? "#0284c7" : "rgba(51,65,85,0.5)"}
              strokeWidth={z.strong ? 1.5 : 1}
              strokeDasharray="4 4"
            />
            <text x={z.x + 15} y={z.y + 26} fontSize={12.5} fontWeight={700} letterSpacing={1} fill={z.color}>
              {z.head}
            </text>
            <text x={z.x + 15} y={z.y + 44} fontFamily={MONO} fontSize={10} fill="#64748b">
              {z.sub}
            </text>
          </g>
        ))}

        {EDGES.map(([from, to, label]) => {
          const a = NODES.find((n) => n.id === from)!;
          const b = NODES.find((n) => n.id === to)!;
          const active =
            flow.edgeMode === "down" ? dliColor : flow.edgeMode === "up" ? propColor : "#334155";
          return (
            <g key={`${from}-${to}`}>
              <path
                d={`M ${a.cx + a.w / 2 - 4} ${a.cy} L ${b.cx - b.w / 2 + 4} ${b.cy}`}
                fill="none"
                stroke={active}
                strokeWidth={2}
                strokeDasharray="7 5"
                strokeDashoffset={
                  flow.edgeMode === "down"
                    ? dashOffsetDown
                    : flow.edgeMode === "up"
                      ? dashOffsetUp
                      : 0
                }
                markerEnd="url(#fp-arrow)"
                opacity={flow.edgeMode === "none" ? 0.75 : 1}
              />
              <text
                x={(a.cx + b.cx) / 2}
                y={a.cy - 14}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={10.5}
                fill="#94a3b8"
              >
                {label}
              </text>
            </g>
          );
        })}

        <g transform="translate(424 300)" opacity={0.55 + pulse * 0.25}>
          <path d="M -40 -30 Q -20 -45 0 -30 T 40 -30" fill="none" stroke="url(#fp-rf)" strokeWidth={2} />
          <path d="M -40 0 Q -20 -15 0 0 T 40 0" fill="none" stroke="url(#fp-rf)" strokeWidth={2} opacity={0.8} />
          <path d="M -40 30 Q -20 15 0 30 T 40 30" fill="none" stroke="url(#fp-rf)" strokeWidth={2} opacity={0.6} />
        </g>

        {NODES.map((n) => {
          const mode = flow.nodeMode[n.id];
          const stroke =
            mode === "prop" ? propColor : mode === "dli" ? dliColor : "#334155";
          const glowFilter =
            mode === "prop"
              ? `drop-shadow(0 0 10px rgba(251,191,36,0.45))`
              : mode === "dli"
                ? `drop-shadow(0 0 10px rgba(56,189,248,0.45))`
                : undefined;
          return (
            <g key={n.id} transform={`translate(${n.cx - n.w / 2} ${n.cy - n.h / 2})`}>
              <rect
                width={n.w}
                height={n.h}
                rx={8}
                fill="rgba(15,22,36,0.92)"
                stroke={stroke}
                strokeWidth={mode !== "none" ? 1.8 : 1.5}
                style={glowFilter ? { filter: glowFilter } : undefined}
              />
              {n.id === "vsm" ? (
                <rect
                  x={4}
                  y={4}
                  width={n.w - 8}
                  height={n.h - 8}
                  rx={6}
                  fill="none"
                  stroke={
                    flow.vsmFlash
                      ? dliColor
                      : flow.nodeMode.vsm === "prop"
                        ? "rgba(251,191,36,0.4)"
                        : "rgba(56,189,248,0.4)"
                  }
                  strokeWidth={1}
                />
              ) : null}
              <g transform={`translate(35 ${n.h / 2 - 8})`}>
                <NodeIcon icon={n.icon} />
              </g>
              <g transform="translate(72 32)">
                <text fontSize={14} fontWeight={700} letterSpacing={0.5} fill="#f1f5f9">
                  {n.title}
                </text>
                <text y={19} fontFamily={MONO} fontSize={10} fill="#64748b">
                  {n.sub}
                </text>
                {n.bullets.map((b, i) => (
                  <text
                    key={b}
                    y={41 + i * 15}
                    fontFamily={MONO}
                    fontSize={10}
                    fill={n.id === "av" ? "#fbbf24" : "#94a3b8"}
                  >
                    {`• ${b}`}
                  </text>
                ))}
                <text
                  y={44 + n.bullets.length * 15 + 6}
                  fontFamily={MONO}
                  fontSize={10.5}
                  fontWeight={700}
                  fill={dliColor}
                >
                  {statusOf(n)}
                </text>
              </g>
            </g>
          );
        })}

        {flow.packet ? (
          <g transform={`translate(${flow.packet.x.toFixed(1)} ${flow.packet.y.toFixed(1)})`}>
            <rect
              x={-58}
              y={-14}
              width={116}
              height={28}
              rx={4}
              fill={flow.packet.kind === "prop" ? "#78350f" : "#0369a1"}
              stroke={flow.packet.kind === "prop" ? propColor : dliColor}
              strokeWidth={1.5}
              style={{
                filter:
                  flow.packet.kind === "prop"
                    ? "drop-shadow(0 0 8px rgba(251,191,36,0.85))"
                    : "drop-shadow(0 0 8px rgba(56,189,248,0.85))",
              }}
            />
            <text
              y={4}
              textAnchor="middle"
              fill="#ffffff"
              fontFamily={MONO}
              fontSize={11}
              fontWeight={700}
            >
              {flow.packet.label}
            </text>
          </g>
        ) : null}
      </svg>

      {opAv > 0.01 ? (
        <div style={{ position: "absolute", top: 96, left: 34, right: "auto", opacity: opAv }}>
          <CalloutCard
            opacity={opAv}
            prop
            title="飞行器（AV）域"
            body="包含飞控计算机、传感器与任务载荷，使用原生私有数据包格式。"
          />
        </div>
      ) : null}
      {opVsm > 0.01 ? (
        <div style={{ position: "absolute", top: 96, left: 560, opacity: opVsm }}>
          <CalloutCard
            opacity={opVsm}
            title="VSM 载具特定模块"
            body={
              <>
                中央<b>转换中枢</b>：将私有遥测/指令转换为标准化 STANAG 4586
                数据链接口（DLI）消息。
              </>
            }
          />
        </div>
      ) : null}
      {opGcs > 0.01 ? (
        <div style={{ position: "absolute", top: 96, left: 872, opacity: opGcs }}>
          <CalloutCard
            opacity={opGcs}
            title="地面站 GCS / CUCS 域"
            body="核心无人机控制系统（CUCS），提供人机交互界面，仅使用标准化 DLI 消息。"
          />
        </div>
      ) : null}

      {showConsole ? (
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 16,
            height: 132,
            background: cardTransparent ? "transparent" : "#020617",
            border: "1px solid #1e293b",
            borderRadius: 6,
            padding: "9px 12px",
            fontFamily: MONO,
            display: "flex",
            flexDirection: "column",
            zIndex: 5,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
              letterSpacing: 1,
              color: "#64748b",
              borderBottom: "1px solid #1e293b",
              paddingBottom: 5,
              marginBottom: 6,
            }}
          >
            <span>遥测与协议转换日志总线</span>
            <span style={{ color: dliColor }}>
              {flow.phase === "idle" ? "就绪" : "运行中"} · T+{fmtClock(t)}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
            {visibleLogs.map((l) => {
              const age = t - l.t;
              const fadeIn = clamp01(age / 0.25);
              const tagColor = l.prop ? propColor : l.tag === "VSM" ? "#f8fafc" : dliColor;
              return (
                <div key={`${l.t}-${l.tag}`} style={{ display: "flex", gap: 10, opacity: 0.35 + fadeIn * 0.65 }}>
                  <span style={{ color: "#475569" }}>[{fmtClock(l.t)}]</span>
                  <span style={{ color: tagColor, fontWeight: 600, minWidth: 42 }}>{l.tag}</span>
                  <span style={{ color: "#cbd5e1" }}>{l.msg}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const CalloutCard: React.FC<{
  opacity: number;
  prop?: boolean;
  title: string;
  body: React.ReactNode;
}> = ({ opacity, prop, title, body }) => (
  <div
    style={{
      background: "rgba(15,23,42,0.95)",
      border: "1px solid #94a3b8",
      borderRadius: 6,
      padding: "9px 13px",
      maxWidth: 300,
      boxShadow: "0 10px 25px rgba(0,0,0,0.55)",
      transform: `translateY(${((1 - opacity) * 10).toFixed(1)}px)`,
    }}
  >
    <div
      style={{
        fontWeight: 700,
        fontSize: 12.5,
        letterSpacing: 1,
        marginBottom: 4,
        color: prop ? "#fbbf24" : "#38bdf8",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: prop ? "#fbbf24" : "#38bdf8",
          display: "inline-block",
        }}
      />
      {title}
    </div>
    <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#f1f5f9" }}>{body}</div>
  </div>
);

export const FlowPipelineEffectDef: EffectDef = {
  id: "FlowPipeline",
  name: "数据管线流程图",
  description:
    "任务控制台风格四区数据流转图：节点高亮、虚线流动、数据包飞行并在 VSM 中枢完成协议转换，底部滚动日志（中文，自动循环）",
  category: "diagram",
  catalogGroup: "流程与图表",
  glyph: "流",
  placement: "left",
  component: FlowPipeline as React.ComponentType<Record<string, unknown>>,
  durationInFrames: Math.round(LOOP_SECONDS * 30),
  bounds: { x: 0, y: 0, width: 1200, height: 700 },
  defaultPosition: { x: 360, y: 190, scale: 1 },
  defaultProps: {
    enabled: true,
    title: "STANAG 4586 实现架构",
    subtitle: "数据转换管线：私有无人机系统 ←→ 标准化 STANAG 4586 互操作",
    loopSeconds: 0,
    dliColor: "#38bdf8",
    propColor: "#fbbf24",
    showHeader: true,
    showConsole: true,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示流程图", default: true },
    title: { type: "text", label: "主标题", default: "STANAG 4586 实现架构" },
    subtitle: {
      type: "text",
      label: "副标题",
      default: "数据转换管线：私有无人机系统 ←→ 标准化 STANAG 4586 互操作",
    },
    loopSeconds: { type: "number", label: "循环时长(秒,0=默认)", default: 0, min: 0, max: 60, step: 1 },
    dliColor: { type: "color", label: "标准链路色", default: "#38bdf8" },
    propColor: { type: "color", label: "私有链路色", default: "#fbbf24" },
    showHeader: { type: "boolean", label: "显示顶栏", default: true },
    showConsole: { type: "boolean", label: "显示日志台", default: true },
  },
};
