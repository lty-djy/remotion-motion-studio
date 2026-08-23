import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";
import { WORLD_LAND } from "./worldLandData";

type LonLat = readonly [number, number];

type Waypoint = {
  name: string;
  en: string;
  coords: LonLat;
  type: "start" | "pass" | "major" | "critical" | "end";
};

const VIEW_W = 1200;
const VIEW_H = 700;
const CX = 600;
const CY = 350;
const R = 250;

const WAYPOINTS: Waypoint[] = [
  { name: "好望角(起点)", en: "Cape of Good Hope", coords: [18.47, -34.35], type: "start" },
  { name: "坦桑尼亚", en: "Tanzania", coords: [34.88, -6.36], type: "pass" },
  { name: "开罗", en: "Cairo, Egypt", coords: [31.23, 30.04], type: "major" },
  { name: "德黑兰", en: "Tehran, Iran", coords: [51.38, 35.68], type: "pass" },
  { name: "中亚腹地", en: "Central Asia", coords: [65.0, 42.0], type: "pass" },
  { name: "新西伯利亚", en: "Novosibirsk", coords: [82.93, 55.0], type: "major" },
  { name: "雅库茨克", en: "Yakutsk", coords: [129.73, 62.03], type: "pass" },
  { name: "白令海峡", en: "Bering Strait", coords: [-169.0, 65.5], type: "critical" },
  { name: "安克雷奇", en: "Anchorage", coords: [-149.9, 61.21], type: "major" },
  { name: "温哥华", en: "Vancouver", coords: [-123.12, 49.28], type: "pass" },
  { name: "巴拿马城", en: "Panama City", coords: [-79.51, 8.98], type: "major" },
  { name: "利马", en: "Lima, Peru", coords: [-77.04, -12.04], type: "pass" },
  { name: "合恩角(终点)", en: "Cape Horn", coords: [-67.29, -55.98], type: "end" },
];

const TOKEN_COLORS: Record<string, string> = {
  cyan: "#22d3ee",
  violet: "#a78bfa",
  amber: "#fca311",
  lime: "#a3e635",
  rose: "#fb7185",
  teal: "#2dd4bf",
  gold: "#fbbf24",
  neutral: "#d7d7d7",
  "support-neutral": "#8b8f98",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#60a5fa",
};

const resolveColor = (input: string, fallback: string) =>
  typeof input === "string" && input.length > 0
    ? TOKEN_COLORS[input] ?? input
    : fallback;

// ---------- 球面数学 ----------
const RAD = Math.PI / 180;

const toVec = ([lon, lat]: LonLat): [number, number, number] => {
  const la = lat * RAD;
  const lo = lon * RAD;
  return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
};

const toLonLat = (v: [number, number, number]): LonLat => {
  const lat = Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD;
  const lon = Math.atan2(v[1], v[0]) / RAD;
  return [lon, lat];
};

const angularDeg = (a: LonLat, b: LonLat) => {
  const va = toVec(a);
  const vb = toVec(b);
  const d = va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2];
  return Math.acos(Math.max(-1, Math.min(1, d))) / RAD;
};

const slerp = (a: LonLat, b: LonLat, t: number): LonLat => {
  const va = toVec(a);
  const vb = toVec(b);
  let omega = Math.acos(Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])));
  if (omega < 1e-6) return a;
  const so = Math.sin(omega);
  const ka = Math.sin((1 - t) * omega) / so;
  const kb = Math.sin(t * omega) / so;
  return toLonLat([
    ka * va[0] + kb * vb[0],
    ka * va[1] + kb * vb[1],
    ka * va[2] + kb * vb[2],
  ]);
};

// 正交投影：以 (rotLon, rotLat) 为视野中心，返回屏幕坐标与前后半球标记
type Projected = { x: number; y: number; front: boolean };

const projectPoint = (
  lonLat: LonLat,
  rotLon: number,
  rotLat: number,
): Projected => {
  const la = lonLat[1] * RAD;
  const lo = lonLat[0] * RAD;
  const rla = rotLat * RAD;
  const rlo = rotLon * RAD;
  const cosLat = Math.cos(la);
  const dl = lo - rlo;
  const cosc =
    Math.sin(rla) * Math.sin(la) + Math.cos(rla) * cosLat * Math.cos(dl);
  const x = CX + R * cosLat * Math.sin(dl);
  const y = CY - R * (Math.cos(rla) * Math.sin(la) - Math.sin(rla) * cosLat * Math.cos(dl));
  return { x, y, front: cosc >= 0 };
};

// 可见/不可见交界处按球面插值二分求边界点，避免图形越过地平线
const horizonMix = (a: LonLat, b: LonLat, rotLon: number, rotLat: number): LonLat => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const p = projectPoint(slerp(a, b, mid), rotLon, rotLat);
    if (p.front) lo = mid;
    else hi = mid;
  }
  return slerp(a, b, (lo + hi) / 2);
};

const buildGeoPath = (
  lines: LonLat[][],
  rotLon: number,
  rotLat: number,
  close: boolean,
): string => {
  const parts: string[] = [];
  for (const line of lines) {
    let open = false;
    let prev: LonLat | null = null;
    const flush = () => {
      if (open) {
        if (close) parts.push("Z");
        open = false;
      }
    };
    for (const pt of line) {
      const p = projectPoint(pt, rotLon, rotLat);
      if (p.front) {
        if (!open) {
          if (prev && !projectPoint(prev, rotLon, rotLat).front) {
            const b = horizonMix(prev, pt, rotLon, rotLat);
            const bp = projectPoint(b, rotLon, rotLat);
            parts.push(`M ${bp.x.toFixed(1)} ${bp.y.toFixed(1)} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
          } else {
            parts.push(`M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
          }
          open = true;
        } else {
          parts.push(`L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
        }
      } else {
        if (open && prev) {
          const b = horizonMix(prev, pt, rotLon, rotLat);
          const bp = projectPoint(b, rotLon, rotLat);
          parts.push(`L ${bp.x.toFixed(1)} ${bp.y.toFixed(1)}`);
        }
        flush();
      }
      prev = pt;
    }
    flush();
  }
  return parts.join(" ");
};

// ---------- 陆地与经纬网（模块级预计算） ----------
const LAND_RINGS: LonLat[][] = WORLD_LAND.split("|").map((ring) =>
  ring
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [lon, lat] = pair.split(",");
      return [Number(lon), Number(lat)] as LonLat;
    }),
);

const GRATICULE: LonLat[][] = (() => {
  const lines: LonLat[][] = [];
  for (let lon = -180; lon < 180; lon += 20) {
    const line: LonLat[] = [];
    for (let lat = -80; lat <= 80; lat += 4) line.push([lon, lat]);
    lines.push(line);
  }
  for (let lat = -80; lat <= 80; lat += 20) {
    const line: LonLat[] = [];
    for (let lon = -180; lon <= 180; lon += 4) line.push([lon, lat]);
    lines.push(line);
  }
  return lines;
})();

// ---------- 航线时间表（纯函数，按时长缓存） ----------
type Phase =
  | { kind: "leg"; t0: number; t1: number; i0: number; i1: number }
  | { kind: "pause"; t0: number; t1: number; wp: number };

type Schedule = {
  phases: Phase[];
  samples: LonLat[];
  arriveTimes: number[];
  arriveCounts: number[];
  totalT: number;
};

const TRAVEL_SHARE = 0.68;

const scheduleCache = new Map<string, Schedule>();

const getSchedule = (totalSeconds: number): Schedule => {
  const key = totalSeconds.toFixed(2);
  const cached = scheduleCache.get(key);
  if (cached) return cached;

  const n = WAYPOINTS.length;
  const angles: number[] = [];
  let totalAngle = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = angularDeg(WAYPOINTS[i].coords, WAYPOINTS[i + 1].coords);
    angles.push(a);
    totalAngle += a;
  }
  const travelTotal = totalSeconds * TRAVEL_SHARE;
  const pauseCount = n - 2;
  const pauseDur = pauseCount > 0 ? (totalSeconds * (1 - TRAVEL_SHARE)) / pauseCount : 0;

  const samples: LonLat[] = [];
  const phases: Phase[] = [];
  const arriveTimes: number[] = [0];
  const arriveCounts: number[] = [0];
  let cursor = 0;
  for (let i = 0; i < n - 1; i++) {
    const dur = (travelTotal * angles[i]) / totalAngle;
    const steps = Math.max(24, Math.ceil(angles[i] / 2));
    const i0 = samples.length;
    for (let k = 0; k <= steps; k++) {
      samples.push(slerp(WAYPOINTS[i].coords, WAYPOINTS[i + 1].coords, k / steps));
    }
    const i1 = samples.length - 1;
    phases.push({ kind: "leg", t0: cursor, t1: cursor + dur, i0, i1 });
    cursor += dur;
    arriveCounts[i + 1] = i1 + 1;
    if (i < n - 2) {
      phases.push({ kind: "pause", t0: cursor, t1: cursor + pauseDur, wp: i + 1 });
      arriveTimes[i + 1] = cursor;
      cursor += pauseDur;
    }
  }
  arriveTimes[n - 1] = cursor;
  const schedule: Schedule = { phases, samples, arriveTimes, arriveCounts, totalT: cursor };
  scheduleCache.set(key, schedule);
  return schedule;
};

type Located =
  | { kind: "leg"; pos: LonLat; phaseIndex: number }
  | { kind: "pause"; pos: LonLat; wp: number; progress: number; phaseIndex: number }
  | { kind: "done"; pos: LonLat };

const locate = (schedule: Schedule, t: number): Located => {
  const { phases, samples, totalT } = schedule;
  if (t >= totalT) {
    return { kind: "done", pos: WAYPOINTS[WAYPOINTS.length - 1].coords };
  }
  for (let pi = 0; pi < phases.length; pi++) {
    const ph = phases[pi];
    if (t >= ph.t0 && t < ph.t1) {
      if (ph.kind === "pause") {
        return {
          kind: "pause",
          pos: WAYPOINTS[ph.wp].coords,
          wp: ph.wp,
          progress: (t - ph.t0) / Math.max(1e-6, ph.t1 - ph.t0),
          phaseIndex: pi,
        };
      }
      const f = (t - ph.t0) / Math.max(1e-6, ph.t1 - ph.t0);
      const fi = ph.i0 + f * (ph.i1 - ph.i0);
      const i0 = Math.floor(fi);
      const frac = fi - i0;
      const a = samples[Math.min(i0, ph.i1)];
      const b = samples[Math.min(i0 + 1, ph.i1)];
      return { kind: "leg", pos: slerp(a, b, frac), phaseIndex: pi };
    }
  }
  return { kind: "done", pos: WAYPOINTS[WAYPOINTS.length - 1].coords };
};

const fmtCoord = (label: "N" | "S" | "E" | "W", value: number) =>
  `${Math.abs(value).toFixed(2)}° ${value >= 0 ? label : label === "N" ? "S" : label === "S" ? "N" : label === "E" ? "W" : "E"}`;

const MONO = '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';

type GlobalExpeditionProps = {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  animationSeconds?: number;
  accentColor?: string;
  linkColor?: string;
  showHud?: boolean;
};

export const GlobalExpedition: React.FC<GlobalExpeditionProps> = ({
  enabled = true,
  title = "GLOBAL EXPEDITION",
  subtitle = "TRANS-CONTINENTAL TRAJECTORY // 跨大陆征途",
  animationSeconds = 22,
  accentColor = "#FBBF24",
  linkColor = "#38BDF8",
  showHud = true,
}) => {
  const frame = useCurrentFrame();
  const { fps: rawFps } = useVideoConfig();
  if (!enabled) return null;
  const fps = rawFps > 0 ? rawFps : 30;
  const totalSeconds = Math.max(3, animationSeconds);

  const accent = resolveColor(accentColor, "#FBBF24");
  const link = resolveColor(linkColor, "#38BDF8");

  const t = Math.min(Math.max(frame / fps, 0), totalSeconds);
  const schedule = getSchedule(totalSeconds);
  const located = locate(schedule, t);
  const pos = located.pos;

  const rotLon = pos[0];
  const rotLat = pos[1];

  const done = located.kind === "done";
  const paused = located.kind === "pause";

  const activeLine: LonLat[] = (() => {
    if (located.kind === "done") return schedule.samples;
    const ph = schedule.phases[located.phaseIndex];
    if (ph.kind === "pause") {
      return schedule.samples.slice(
        0,
        schedule.arriveCounts[(located as { wp: number }).wp],
      );
    }
    const f = (t - ph.t0) / Math.max(1e-6, ph.t1 - ph.t0);
    const fi = ph.i0 + f * (ph.i1 - ph.i0);
    const cut = Math.min(ph.i1, Math.floor(fi)) + 1;
    return [...schedule.samples.slice(0, cut), located.pos];
  })();

  const progress = Math.min(1, t / totalSeconds);
  const pct = Math.floor(progress * 100);

  const lastVisitedIndex = (() => {
    let idx = 0;
    for (let i = 1; i < WAYPOINTS.length; i++) {
      if (t >= schedule.arriveTimes[i]) idx = i;
    }
    return idx;
  })();

  const statusMsg = done
    ? "MISSION ACCOMPLISHED / 抵达终点"
    : paused
      ? `ARRIVED AT: ${WAYPOINTS[(located as { wp: number }).wp].en}`
      : "TRACKING SATELLITE FEED...";
  const blinkOn = ((t % 2) + 2) % 2 < 1;
  const statusOpacity = done || paused ? 1 : blinkOn ? 1 : 0.35;

  const locationName = done
    ? WAYPOINTS[WAYPOINTS.length - 1].name
    : paused
      ? WAYPOINTS[(located as { wp: number }).wp].name
      : `EN ROUTE: ${WAYPOINTS[lastVisitedIndex].name}`;

  const lat = pos[1];
  const lon = pos[0];
  const coordText = `${fmtCoord("N", lat)}, ${fmtCoord("E", lon)}`;

  const landPath = buildGeoPath(LAND_RINGS, rotLon, rotLat, true);
  const gratPath = buildGeoPath(GRATICULE, rotLon, rotLat, false);
  const routeBgPath = buildGeoPath(
    [schedule.samples],
    rotLon,
    rotLat,
    false,
  );
  const routeActivePath = buildGeoPath([activeLine], rotLon, rotLat, false);

  const compassDeg = (t * 36) % 360;

  return (
    <div
      data-effect="GlobalExpedition"
      style={{
        width: 900,
        height: 525,
        position: "relative",
        background: "transparent",
        fontFamily: 'Inter, "SF Pro Display", "PingFang SC", sans-serif',
      }}
    >
      <svg width={900} height={525} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="geOceanGradient" cx="50%" cy="50%" r="50%" fx="25%" fy="25%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <filter id="geGlowBlue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="geGlowGold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={CX} cy={CY} r={R + 5} fill={link} opacity={0.12} filter="url(#geGlowBlue)" />
        <circle cx={CX} cy={CY} r={R} fill="url(#geOceanGradient)" stroke="#475569" strokeWidth={1} />

        <path d={gratPath} fill="none" stroke="#475569" strokeWidth={0.5} opacity={0.35} />
        <path d={landPath} fill="#1e293b" stroke="#64748b" strokeWidth={0.6} />

        <path d={routeBgPath} fill="none" stroke={link} strokeWidth={1} opacity={0.3} strokeDasharray="2 4" />
        <path
          d={routeActivePath}
          fill="none"
          stroke={accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#geGlowGold)"
        />

        {WAYPOINTS.map((wp, i) => {
          const p = projectPoint(wp.coords, rotLon, rotLat);
          if (!p.front) return null;
          const visited = t >= schedule.arriveTimes[i];
          const distToCenter = angularDeg(wp.coords, pos);
          const labelOpacity = visited ? 0.95 : distToCenter < 26 ? 0.55 : 0;
          const isEndpoint = i === 0 || i === WAYPOINTS.length - 1;
          const pointColor = wp.type === "critical" ? "#EF4444" : accent;
          let pulseR = 0;
          let pulseOpacity = 0;
          if (paused && (located as { wp: number }).wp === i) {
            pulseR = 8 + 16 * (located as { progress: number }).progress;
            pulseOpacity = 0.85 * (1 - (located as { progress: number }).progress);
          } else if (i === WAYPOINTS.length - 1 && done) {
            const pp = Math.min(1, (t - schedule.totalT + 1) / 1);
            if (pp >= 0) {
              pulseR = 8 + 16 * pp;
              pulseOpacity = 0.85 * (1 - pp);
            }
          }
          return (
            <g key={`${wp.en}-${i}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
              {pulseOpacity > 0.02 ? (
                <circle r={pulseR} fill="none" stroke={pointColor} strokeWidth={1} opacity={pulseOpacity} />
              ) : null}
              <circle r={isEndpoint ? 5 : 3} fill={pointColor} stroke="#fff" strokeWidth={1.6} />
              <text
                x={10}
                y={4}
                fontFamily={MONO}
                fontSize={12}
                fontWeight="bold"
                fill={accent}
                stroke="rgba(2,6,23,0.8)"
                strokeWidth={3}
                paintOrder="stroke"
                opacity={labelOpacity}
              >
                {wp.name}
              </text>
            </g>
          );
        })}

        {(() => {
          const p = projectPoint(pos, rotLon, rotLat);
          if (!p.front || done) return null;
          return (
            <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} opacity={0.95}>
              <circle r={6} fill="none" stroke={accent} strokeWidth={2} />
              <circle r={12} fill="none" stroke={accent} strokeWidth={1} opacity={0.5} />
              <line x1={-15} y1={0} x2={15} y2={0} stroke={accent} strokeWidth={1} />
              <line x1={0} y1={-15} x2={0} y2={15} stroke={accent} strokeWidth={1} />
            </g>
          );
        })()}

        {showHud ? (
          <g>
            <g transform={`translate(${CX} 60)`}>
              <text textAnchor="middle" fontSize={24} fontWeight={800} fill="#F8FAFC" letterSpacing={4}>
                {title}
              </text>
              <text y={25} textAnchor="middle" fontSize={12} fill="#94A3B8" letterSpacing={2}>
                {subtitle}
              </text>
              <line x1={-200} y1={40} x2={200} y2={40} stroke="#334155" strokeWidth={1} />
              <rect x={-150} y={39} width={300} height={2} fill={link} opacity={0.5} />
            </g>

            <g transform="translate(50 150)">
              <path d="M0,0 L240,0 L260,20 L260,120 L20,120 L0,100 Z" fill="rgba(15,23,42,0.85)" stroke={link} strokeWidth={1} strokeOpacity={0.5} />
              <rect x={0} y={0} width={4} height={40} fill={accent} />
              <text x={20} y={30} fontFamily={MONO} fontSize={10} fill="#94A3B8" letterSpacing={1}>
                CURRENT LOCATION / 当前位置
              </text>
              <text x={20} y={57} fontFamily={MONO} fontSize={17} fontWeight="bold" fill="#F8FAFC">
                {locationName}
              </text>
              <text x={20} y={87} fontFamily={MONO} fontSize={10} fill="#94A3B8" letterSpacing={1}>
                COORDINATES / 坐标
              </text>
              <text x={20} y={104} fontFamily={MONO} fontSize={14} fill={link}>
                {coordText}
              </text>
            </g>

            <g transform="translate(890 150)">
              <path d="M20,0 L260,0 L260,100 L240,120 L0,120 L0,20 Z" fill="rgba(15,23,42,0.85)" stroke={link} strokeWidth={1} strokeOpacity={0.5} />
              <rect x={256} y={0} width={4} height={40} fill={link} />
              <text x={240} y={30} textAnchor="end" fontFamily={MONO} fontSize={10} fill="#94A3B8" letterSpacing={1}>
                MISSION PROGRESS / 进程
              </text>
              <text x={240} y={62} textAnchor="end" fontFamily={MONO} fontSize={32} fontWeight="bold" fill="#F8FAFC">
                {`${pct}%`}
              </text>
              <rect x={40} y={80} width={200} height={4} fill="#1e293b" />
              <rect x={40} y={80} width={(200 * progress).toFixed(1)} height={4} fill={accent} filter="url(#geGlowGold)" />
            </g>

            <g transform="translate(300 620)">
              <line x1={0} y1={0} x2={600} y2={0} stroke="#334155" strokeWidth={1} />
              <circle cx={0} cy={0} r={3} fill={link} />
              <circle cx={600} cy={0} r={3} fill={link} />
              <text x={300} y={25} textAnchor="middle" fontFamily={MONO} fontSize={12} fill={accent} opacity={statusOpacity} letterSpacing={1}>
                {statusMsg}
              </text>
            </g>

            <g transform="translate(1100 600)" opacity={0.6}>
              <circle r={40} fill="none" stroke={link} strokeWidth={1} strokeDasharray="4 4" />
              <circle r={30} fill="none" stroke="#94A3B8" strokeWidth={0.5} />
              <g transform={`rotate(${compassDeg.toFixed(1)})`}>
                <path d="M0,-35 L5,-5 L35,0 L5,5 L0,35 L-5,5 L-35,0 L-5,-5 Z" fill="#1e293b" stroke={link} strokeWidth={1} />
              </g>
              <text x={0} y={-50} textAnchor="middle" fontFamily={MONO} fontSize={10} fill={link}>
                N
              </text>
            </g>
          </g>
        ) : null}
      </svg>
    </div>
  );
};

export const GlobalExpeditionEffectDef: EffectDef = {
  id: "GlobalExpedition",
  name: "环球征途地图",
  description: "正交投影地球沿大圆航线环球飞行，途经节点停靠点亮，金色航迹＋HUD 任务面板（透明背景）",
  category: "spatial",
  catalogGroup: "空间与聚焦",
  glyph: "🌍",
  placement: "left",
  component: GlobalExpedition as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 660,
  bounds: { x: 0, y: 0, width: 900, height: 525 },
  defaultPosition: { x: 510, y: 278, scale: 1 },
  defaultProps: {
    enabled: true,
    title: "GLOBAL EXPEDITION",
    subtitle: "TRANS-CONTINENTAL TRAJECTORY // 跨大陆征途",
    animationSeconds: 22,
    accentColor: "#FBBF24",
    linkColor: "#38BDF8",
    showHud: true,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示环球地图", default: true },
    title: { type: "text", label: "主标题", default: "GLOBAL EXPEDITION" },
    subtitle: { type: "text", label: "副标题", default: "TRANS-CONTINENTAL TRAJECTORY // 跨大陆征途" },
    animationSeconds: { type: "number", label: "动画时长(秒)", default: 22, min: 6, max: 60, step: 1 },
    accentColor: { type: "color", label: "航迹强调色", default: "#FBBF24" },
    linkColor: { type: "color", label: "大气/虚线色", default: "#38BDF8" },
    showHud: { type: "boolean", label: "显示HUD面板", default: true },
  },
};
