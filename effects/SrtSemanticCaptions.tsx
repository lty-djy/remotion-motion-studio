import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type SrtCue = {
  index: number;
  start: number;
  end: number;
  text: string;
  semanticKey?: string;
  semanticLabel?: string;
  keyword?: string;
};

// 组件只显示工作台实际导入的 SRT，不再回退到示例字幕。
const DEFAULT_CUES: SrtCue[] = [];

type SemanticTag =
  | "time"
  | "store"
  | "money"
  | "risk"
  | "online"
  | "deal"
  | "people"
  | "growth"
  | "trend"
  | "info"
  | "process"
  | "metric"
  | "comparison"
  | "completion"
  | "coverage"
  | "emphasis"
  | "cta"
  | "automation";

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
  info: "#38bdf8",
  process: "#fb923c",
  metric: "#22d3ee",
  comparison: "#c084fc",
  completion: "#4ade80",
  coverage: "#2dd4bf",
  emphasis: "#fbbf24",
  cta: "#f472b6",
  automation: "#a78bfa",
};

const SEMANTIC_KEY_TAGS: Record<string, SemanticTag> = {
  "chapter-transition": "time",
  "info-callout": "info",
  "metric-decision": "metric",
  "process-steps": "process",
  "risk-boundary": "risk",
  "next-episode-cta": "cta",
  performance: "metric",
  process: "process",
  automation: "automation",
  comparison: "comparison",
  completion: "completion",
  coverage: "coverage",
  deadline: "time",
  emphasis: "emphasis",
  number: "metric",
};

type SemanticMatch = {
  tag: SemanticTag;
  keyword: string;
};

const fallbackKeyword = (text: string) => {
  const numeric = text.match(/\d+(?:[.,]\d+)?\s*(?:%|％|万|亿|倍|k|K|元|年|天|小时|分钟|秒)?/u)?.[0];
  if (numeric) return numeric.trim();
  const explicit = text.match(
    /(?:重点|注意|必须|核心|关键|结论|总结|记住|推荐|避免|风险|提升|增长|降低|完成|成功|首先|然后|最后|下一步|接下来)/u,
  )?.[0];
  if (explicit) return explicit;
  const fragments = text
    .split(/[，,。！？!?…；;：:、\s]+/u)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
  const candidate = fragments.sort((left, right) => right.length - left.length)[0] ?? "";
  if (!candidate) return "";
  if (candidate.length <= 6) return candidate;
  const start = Math.max(0, Math.floor((candidate.length - 4) / 2));
  return candidate.slice(start, start + 4);
};

const fallbackTag = (text: string, cueIndex: number): SemanticTag => {
  if (/风险|注意|不能|避免|错误|失败|淘汰|亏损|下降/u.test(text)) return "risk";
  if (/首先|然后|接着|最后|步骤|流程/u.test(text)) return "process";
  if (/AI|代码|模型|自动|智能|JSON|API/iu.test(text)) return "automation";
  if (/完成|成功|达成|结果/u.test(text)) return "completion";
  if (/对比|相比|选择|优于|不如/u.test(text)) return "comparison";
  if (/关注|点赞|评论|下一期|下期|收藏/u.test(text)) return "cta";
  if (/重点|核心|关键|结论|记住/u.test(text)) return "emphasis";
  if (/\d|效率|速度|增长|提升|降低|成本/u.test(text)) return "metric";
  const variedFallbacks: SemanticTag[] = ["info", "people", "trend", "growth"];
  return variedFallbacks[Math.abs(cueIndex - 1) % variedFallbacks.length];
};

const matchSemantics = (cue: SrtCue): SemanticMatch => {
  const routedTag = cue.semanticKey
    ? SEMANTIC_KEY_TAGS[cue.semanticKey]
    : undefined;
  if (cue.keyword && cue.text.includes(cue.keyword)) {
    return {
      tag: routedTag ?? fallbackTag(cue.text, cue.index),
      keyword: cue.keyword,
    };
  }
  for (const entry of SEMANTIC_LEXICON) {
    for (const key of entry.keys) {
      if (key && cue.text.includes(key)) {
        return { tag: routedTag ?? entry.tag, keyword: key };
      }
    }
  }
  return {
    tag: routedTag ?? fallbackTag(cue.text, cue.index),
    keyword: fallbackKeyword(cue.text),
  };
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
    case "info":
      return (
        <g {...common}>
          <circle cx={0} cy={0} r={20} />
          <path d="M 0 -5 L 0 12" />
          <circle cx={0} cy={-12} r={1} fill={color} strokeWidth={3} />
        </g>
      );
    case "process":
      return (
        <g {...common}>
          <circle cx={-15} cy={-11} r={4} />
          <circle cx={-15} cy={0} r={4} />
          <circle cx={-15} cy={11} r={4} />
          <path d="M -7 -11 L 17 -11 M -7 0 L 17 0 M -7 11 L 17 11" />
        </g>
      );
    case "metric":
      return (
        <g {...common}>
          <path d="M -18 14 L -18 4 M -5 14 L -5 -4 M 8 14 L 8 -13" />
          <path d="M -18 -8 L -7 -15 L 2 -8 L 17 -18" />
          <path d="M 17 -18 L 8 -17 M 17 -18 L 16 -9" />
        </g>
      );
    case "comparison":
      return (
        <g {...common}>
          <path d="M -19 -8 L 14 -8 M 14 -8 L 7 -15 M 14 -8 L 7 -1" />
          <path d="M 19 9 L -14 9 M -14 9 L -7 2 M -14 9 L -7 16" />
        </g>
      );
    case "completion":
      return (
        <g {...common}>
          <circle cx={0} cy={0} r={20} />
          <path d="M -10 0 L -3 8 L 12 -9" />
        </g>
      );
    case "coverage":
      return (
        <g {...common}>
          <path d="M 0 0 L 0 -20 A 20 20 0 1 1 -14 14 Z" />
          <path d="M 5 -15 A 16 16 0 0 1 15 -3" opacity={0.5} />
        </g>
      );
    case "emphasis":
      return (
        <g {...common}>
          <path d="M 0 -19 L 0 5" />
          <circle cx={0} cy={14} r={1} fill={color} strokeWidth={4} />
          <path d="M -13 -13 L -19 -18 M 13 -13 L 19 -18" opacity={0.55} />
        </g>
      );
    case "cta":
      return (
        <g {...common}>
          <path d="M -14 8 L -9 3 L -9 -6 A 9 9 0 0 1 9 -6 L 9 3 L 14 8 Z" />
          <path d="M -4 13 A 5 4 0 0 0 4 13" />
        </g>
      );
    case "automation":
      return (
        <g {...common}>
          <rect x={-18} y={-15} width={36} height={30} rx={8} />
          <circle cx={-7} cy={-3} r={2} fill={color} strokeWidth={2} />
          <circle cx={7} cy={-3} r={2} fill={color} strokeWidth={2} />
          <path d="M -8 7 L 0 11 L 8 7 M 0 -15 L 0 -21" />
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
  timeOffset?: number;
  cuesJson?: string;
  backgroundOpacity?: number;
};

export const SrtSemanticCaptions: React.FC<SrtSemanticCaptionsProps> = ({
  enabled = true,
  fontSize = 58,
  accentMode = "auto",
  accentColor = "#f5c542",
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
              index: Number.isFinite(Number(item.index))
                ? Math.max(1, Math.round(Number(item.index)))
                : i + 1,
              start,
              end: Math.max(end, start + 0.2),
              text,
              semanticKey:
                typeof item.semanticKey === "string" ? item.semanticKey : undefined,
              semanticLabel:
                typeof item.semanticLabel === "string" ? item.semanticLabel : undefined,
              keyword: typeof item.keyword === "string" ? item.keyword : undefined,
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

  const semantic = active ? matchSemantics(active) : null;
  const tag: SemanticTag = semantic?.tag ?? "info";
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
  description: "读取导入的真实 SRT 时间戳逐句显示，支持语义配色、图标与关键词扫线",
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
    timeOffset: { type: "number", label: "时间偏移(秒)", default: 0, min: -10, max: 10, step: 0.05 },
    cuesJson: {
      type: "text",
      label: "自定义台词JSON(start/end/text)",
      default: "",
    },
  },
};
