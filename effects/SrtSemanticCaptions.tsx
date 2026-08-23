import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type SrtCue = {
  index: number;
  start: number;
  end: number;
  text: string;
};

// 来自「未来3年卫浴行业.srt」的逐句时间轴（秒）
const DEFAULT_CUES: SrtCue[] = [
  { index: 1, start: 0.133, end: 0.966, text: "未来3年" },
  { index: 2, start: 0.966, end: 2.083, text: "卫浴店只有这种" },
  { index: 3, start: 2.083, end: 3.166, text: "门店能够赚钱" },
  { index: 4, start: 3.2, end: 4.766, text: "单纯卖货的门店只会" },
  { index: 5, start: 4.766, end: 6.2, text: "慢慢的被市场淘汰" },
  { index: 6, start: 6.4, end: 7.883, text: "线上引流线下成交" },
  { index: 7, start: 7.883, end: 9.933, text: "才是实体店最终的出路" },
  { index: 8, start: 9.966, end: 11.483, text: "短视频做品牌种草" },
  { index: 9, start: 11.483, end: 13.0, text: "直播做精准转化" },
  { index: 10, start: 13.0, end: 13.883, text: "客流稳定" },
  { index: 11, start: 13.883, end: 14.966, text: "客单更高" },
  { index: 12, start: 15.083, end: 16.733, text: "轻松突破业绩瓶颈" },
  { index: 13, start: 16.883, end: 17.566, text: "紧跟趋势" },
  { index: 14, start: 17.683, end: 19.4, text: "轻松实现年入百万" },
];

type SemanticTag =
  | "time"
  | "store"
  | "money"
  | "risk"
  | "online"
  | "deal"
  | "people"
  | "growth"
  | "trend";

// 语义词库：按顺序匹配，第一条命中的关键词决定该句台词的视觉语义
const SEMANTIC_LEXICON: ReadonlyArray<{
  keys: string[];
  tag: SemanticTag;
}> = [
  { keys: ["年入百万", "赚钱"], tag: "money" },
  { keys: ["淘汰"], tag: "risk" },
  { keys: ["线上引流", "短视频", "直播", "种草"], tag: "online" },
  { keys: ["转化", "成交", "出路"], tag: "deal" },
  { keys: ["客流", "客单"], tag: "people" },
  { keys: ["突破", "瓶颈"], tag: "growth" },
  { keys: ["趋势"], tag: "trend" },
  { keys: ["未来3年", "3年"], tag: "time" },
  { keys: ["卫浴店", "实体店", "门店"], tag: "store" },
];

const TAG_COLORS: Record<SemanticTag, string> = {
  time: "#a78bfa",
  store: "#fca311",
  money: "#f5c542",
  risk: "#f87171",
  online: "#22d3ee",
  deal: "#34d399",
  people: "#60a5fa",
  growth: "#a3e635",
  trend: "#e879f9",
};

const TAG_LABELS: Record<SemanticTag, string> = {
  time: "周期",
  store: "门店",
  money: "收益",
  risk: "风险",
  online: "线上",
  deal: "转化",
  people: "客群",
  growth: "增长",
  trend: "趋势",
};

type SemanticMatch = {
  tag: SemanticTag;
  keyword: string;
};

const matchSemantics = (text: string): SemanticMatch => {
  for (const entry of SEMANTIC_LEXICON) {
    for (const key of entry.keys) {
      if (key && text.includes(key)) return { tag: entry.tag, keyword: key };
    }
  }
  return { tag: "store", keyword: "" };
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOutCubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;

// 中日韩全角字符按 1em、常用半角按经验系数估宽，用于手动排版与下划线定位
const isWideChar = (ch: string) =>
  /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/.test(ch);
const charEm = (ch: string) => {
  if (isWideChar(ch)) return 1;
  if (/[A-Z0-9@#%]/.test(ch)) return 0.62;
  if (/[a-z0-9]/.test(ch)) return 0.54;
  if (ch === " ") return 0.3;
  return 0.46;
};
const textWidthEm = (text: string) =>
  [...text].reduce((sum, ch) => sum + charEm(ch), 0);

// ---------- 语义图标（局部坐标，中心 0,0，外接半径约 26） ----------
const SemanticIcon: React.FC<{ tag: SemanticTag; color: string }> = ({
  tag,
  color,
}) => {
  const common = {
    stroke: color,
    strokeWidth: 5.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  switch (tag) {
    case "time":
      return (
        <g {...common}>
          <circle cx={0} cy={0} r={20} />
          <path d="M 0 -11 L 0 1 L 9 6" />
        </g>
      );
    case "store":
      return (
        <g {...common}>
          <path d="M -18 -4 L -15 -17 L 15 -17 L 18 -4 Z" />
          <path d="M -13 -4 L -13 16 L 13 16 L 13 -4" />
          <path d="M -4 16 L -4 4 L 5 4 L 5 16" />
        </g>
      );
    case "risk":
      return (
        <g {...common}>
          <path d="M 0 -19 L 19 15 L -19 15 Z" />
          <path d="M 0 -7 L 0 4" />
          <circle cx={0} cy={10.5} r={0.5} fill={color} strokeWidth={3} />
        </g>
      );
    case "online":
      return (
        <g {...common}>
          <rect x={-17} y={-13} width={34} height={26} rx={7} />
          <path d="M -4 -6 L 7 0 L -4 6 Z" fill={color} />
        </g>
      );
    case "deal":
      return (
        <g {...common}>
          <circle cx={0} cy={0} r={20} />
          <path d="M -9 1 L -2 8 L 10 -7" />
        </g>
      );
    case "people":
      return (
        <g {...common}>
          <circle cx={-3} cy={-7} r={7} />
          <path d="M -15 15 a 12 10 0 0 1 24 0" />
          <circle cx={14} cy={-8} r={5} opacity={0.55} />
          <path d="M 10 14 a 9 8 0 0 1 12 -6" opacity={0.55} />
        </g>
      );
    case "growth":
      return (
        <g {...common}>
          <path d="M -18 13 L -6 1 L 1 7 L 16 -9" />
          <path d="M 16 -9 L 6 -8 M 16 -9 L 15 1" />
        </g>
      );
    case "trend":
      return (
        <g {...common}>
          <path d="M -18 12 C -10 4 -7 16 -1 7 C 4 0 8 -4 17 -10" />
          <path d="M 17 -10 L 8 -9 M 17 -10 L 16 -1" />
        </g>
      );
    case "money":
    default:
      return (
        <g>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={30}
            fontWeight={800}
          >
            ¥
          </text>
          <path
            d="M -14 14 L 14 14"
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );
  }
};

type SrtSemanticCaptionsProps = {
  enabled?: boolean;
  fontSize?: number;
  accentMode?: string;
  accentColor?: string;
  showRail?: boolean;
  timeOffset?: number;
  cuesJson?: string;
  backgroundOpacity?: number;
};

export const SrtSemanticCaptions: React.FC<SrtSemanticCaptionsProps> = ({
  enabled = true,
  fontSize = 58,
  accentMode = "auto",
  accentColor = "#f5c542",
  showRail = true,
  timeOffset = 0,
  cuesJson = "",
  backgroundOpacity = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps: rawFps } = useVideoConfig();
  const fps = rawFps > 0 ? rawFps : 30;

  let cues = DEFAULT_CUES;
  if (cuesJson.trim()) {
    try {
      const parsed: unknown = JSON.parse(cuesJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cues = parsed.flatMap((raw, i) => {
          const item = raw as Record<string, unknown>;
          const start = Number(item.start);
          const end = Number(item.end);
          const text = typeof item.text === "string" ? item.text : "";
          if (!Number.isFinite(start) || !Number.isFinite(end) || !text)
            return [];
          return [
            {
              index: i + 1,
              start,
              end: Math.max(end, start + 0.2),
              text,
            },
          ];
        });
      }
    } catch {
      cues = DEFAULT_CUES;
    }
  }
  if (!enabled || cues.length === 0) return null;

  const fs = Math.max(24, Math.min(110, fontSize));
  const t = frame / fps + timeOffset;

  const active =
    cues.find((cue) => t >= cue.start && t < cue.end) ?? null;
  const totalDuration = cues[cues.length - 1].end;

  const semantic = active ? matchSemantics(active.text) : null;
  const tag: SemanticTag = semantic?.tag ?? "store";
  const accent =
    accentMode === "mono" ? accentColor || "#f5c542" : TAG_COLORS[tag];

  // 台词进出动画（帧驱动，无 CSS transition）
  const age = active ? t - active.start : 0;
  const kIn = active ? easeOutCubic(age / 0.24) : 0;
  const kOut = active ? clamp01((active.end - t) / 0.2) : 0;
  const groupAlpha = active ? kIn * kOut : 0;
  const groupDy = active ? (1 - kIn) * 30 - (1 - kOut) * 16 : 0;

  // 关键词三段拆分：前缀 + 关键词 + 后缀
  let pre = "";
  let post = "";
  let keyword = "";
  if (active && semantic?.keyword) {
    const at = active.text.indexOf(semantic.keyword);
    if (at >= 0) {
      pre = active.text.slice(0, at);
      keyword = semantic.keyword;
      post = active.text.slice(at + keyword.length);
    } else {
      pre = active.text;
    }
  } else if (active) {
    pre = active.text;
  }

  const preW = textWidthEm(pre) * fs;
  const kwW = textWidthEm(keyword) * fs;
  const totalW = (textWidthEm(pre) + textWidthEm(keyword) + textWidthEm(post)) * fs;

  const plateCy = 100;
  const plateH = Math.round(fs + 62);
  const badgeR = Math.max(26, Math.min(40, fs * 0.6));

  // 先按内容估宽，再整体居中重排
  const estimatedW =
    plateH / 2 + 10 + badgeR * 2 + 24 + totalW + 44;
  const plateW = Math.max(360, Math.min(1028, estimatedW));
  const plateX = 540 - plateW / 2;
  const plateY = plateCy - plateH / 2;
  const badgeCx = plateX + plateH / 2 + 10;
  const textStartX = badgeCx + badgeR + 22;
  const baselineY = plateCy + Math.round(fs * 0.35);
  const iconScale = badgeR / 26;

  const plateAlpha = 0.6 + clamp01(backgroundOpacity) * 0.38;

  // 歌词式下划线：随台词进度扫过关键词
  const cueProgress = active
    ? clamp01(age / Math.max(0.001, active.end - active.start))
    : 0;

  // 底部台词轨：整段时间轴 + 当前句高亮 + 播放游标
  const railX = 150;
  const railW = 780;
  const railY = 232;
  const railH = 6;
  const globalP = clamp01(t / Math.max(0.001, totalDuration));
  const segA = active
    ? railX + railW * clamp01(active.start / totalDuration)
    : 0;
  const segB = active
    ? railX + railW * clamp01(active.end / totalDuration)
    : 0;
  const cursorX = railX + railW * globalP;

  return (
    <div
      data-effect="SrtSemanticCaptions"
      style={{
        width: 1080,
        height: 300,
        position: "relative",
        background: "transparent",
        fontFamily:
          'Inter, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <svg
        width={1080}
        height={300}
        viewBox="0 0 1080 300"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* 台词进度轨 */}
        {showRail ? (
          <g opacity={groupAlpha > 0 ? 0.95 : 0.75}>
            <rect
              x={railX}
              y={railY}
              width={railW}
              height={railH}
              rx={railH / 2}
              fill="rgba(255,255,255,0.16)"
            />
            <rect
              x={railX}
              y={railY}
              width={Math.max(0, cursorX - railX)}
              height={railH}
              rx={railH / 2}
              fill="rgba(255,255,255,0.42)"
            />
            {active ? (
              <rect
                x={segA}
                y={railY - 1}
                width={Math.max(2, segB - segA)}
                height={railH + 2}
                rx={(railH + 2) / 2}
                fill={accent}
                opacity={0.92}
              />
            ) : null}
            {cues.map((cue) => (
              <line
                key={`tick-${cue.index}`}
                x1={railX + railW * clamp01(cue.start / totalDuration)}
                x2={railX + railW * clamp01(cue.start / totalDuration)}
                y1={railY - 6}
                y2={railY + railH + 6}
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={1.5}
              />
            ))}
            {active ? (
              <g style={{ filter: `drop-shadow(0px 0px 6px ${accent})` }}>
                <circle cx={cursorX} cy={railY + railH / 2} r={6} fill={accent} />
              </g>
            ) : null}
            {active ? (
              <text
                x={railX + railW}
                y={railY - 14}
                textAnchor="end"
                fill="rgba(255,255,255,0.55)"
                fontSize={20}
                letterSpacing={2}
              >
                {`${String(active.index).padStart(2, "0")} / ${String(
                  cues.length,
                ).padStart(2, "0")}`}
              </text>
            ) : null}
            {active ? (
              <text
                x={railX}
                y={railY - 14}
                fill={accent}
                fontSize={20}
                letterSpacing={4}
                opacity={0.85}
              >
                {`语义 · ${TAG_LABELS[tag]}`}
              </text>
            ) : null}
          </g>
        ) : null}

        {/* 台词条板：进入/退出由帧驱动位移与透明度控制 */}
        {active ? (
          <g opacity={groupAlpha} transform={`translate(0 ${groupDy.toFixed(2)})`}>
            <g style={{ filter: "drop-shadow(0px 6px 18px rgba(0,0,0,0.45))" }}>
              <rect
                x={plateX}
                y={plateY}
                width={plateW}
                height={plateH}
                rx={plateH / 2}
                fill={`rgba(10,12,17,${plateAlpha.toFixed(3)})`}
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
            </g>

            {/* 语义图标徽章 */}
            <g style={{ filter: `drop-shadow(0px 0px 8px ${accent}66)` }}>
              <circle
                cx={badgeCx}
                cy={plateCy}
                r={badgeR}
                fill={`${accent}26`}
                stroke={`${accent}99`}
                strokeWidth={2}
              />
            </g>
            <g transform={`translate(${badgeCx} ${plateCy}) scale(${iconScale.toFixed(3)})`}>
              <SemanticIcon tag={tag} color={accent} />
            </g>

            {/* 三段文本：关键词按语义色强调 */}
            <text
              x={textStartX}
              y={baselineY}
              fill="#ffffff"
              fontSize={fs}
              fontWeight={600}
              letterSpacing={1}
              style={{ paintOrder: "stroke" }}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={fs * 0.045}
            >
              <tspan>{pre}</tspan>
              {keyword ? (
                <tspan fill={accent} fontWeight={850}>
                  {keyword}
                </tspan>
              ) : null}
              <tspan>{post}</tspan>
            </text>

            {/* 关键词扫线（卡拉OK式） */}
            {keyword ? (
              <rect
                x={textStartX + preW}
                y={baselineY + fs * 0.22}
                width={kwW * cueProgress}
                height={Math.max(6, fs * 0.09)}
                rx={Math.max(3, fs * 0.045)}
                fill={accent}
                opacity={0.9}
                style={{ filter: `drop-shadow(0px 0px 6px ${accent})` }}
              />
            ) : null}

            {/* 右侧装饰刻度点：呼应语义节奏 */}
            {[0, 1, 2].map((i) => (
              <circle
                key={`dot-${i}`}
                cx={plateX + plateW - 26 - i * 16}
                cy={plateY + plateH / 2}
                r={3}
                fill="#ffffff"
                opacity={0.28 - i * 0.08}
              />
            ))}
          </g>
        ) : null}
      </svg>
    </div>
  );
};

export const SrtSemanticCaptionsEffectDef: EffectDef = {
  id: "SrtSemanticCaptions",
  name: "SRT字幕语义动画",
  description: "逐句驱动 SVG 字幕：语义词库匹配关键词配色与图标，卡拉OK扫线＋台词轨时间轴",
  category: "captions",
  catalogGroup: "字幕与台词",
  glyph: "SRT",
  placement: "bottom",
  component: SrtSemanticCaptions as React.ComponentType<
    Record<string, unknown>
  >,
  durationInFrames: 582,
  bounds: { x: 0, y: 0, width: 1080, height: 300 },
  defaultPosition: { x: 0, y: 1360, scale: 1 },
  defaultProps: {
    enabled: true,
    fontSize: 58,
    accentMode: "auto",
    accentColor: "#f5c542",
    showRail: true,
    timeOffset: 0,
    cuesJson: "",
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示字幕动画", default: true },
    fontSize: { type: "number", label: "字号(px)", default: 58, min: 24, max: 110, step: 2 },
    accentMode: {
      type: "select",
      label: "强调色模式",
      default: "auto",
      options: [
        { label: "按语义自动配色", value: "auto" },
        { label: "统一单色", value: "mono" },
      ],
    },
    accentColor: { type: "color", label: "单色模式强调色", default: "#f5c542" },
    showRail: { type: "boolean", label: "显示台词轨", default: true },
    timeOffset: { type: "number", label: "时间偏移(秒)", default: 0, min: -10, max: 10, step: 0.05 },
    cuesJson: {
      type: "text",
      label: "自定义台词JSON(start/end/text)",
      default: "",
    },
  },
};
