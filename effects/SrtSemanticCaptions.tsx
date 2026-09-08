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

// 语义图标统一引用 public/input/icons 中的稳定资源 ID。
const TAG_ICON_IDS: Record<SemanticTag, string> = {
  time: "calendar",
  store: "buildings",
  money: "credit-card",
  risk: "warning",
  online: "broadcast",
  deal: "target",
  people: "users",
  growth: "trend-up",
  trend: "route",
  info: "lightbulb",
  process: "list-checks",
  metric: "chart-bar",
  comparison: "arrow",
  completion: "check-circle",
  coverage: "scan",
  emphasis: "lightning",
  cta: "megaphone",
  automation: "robot",
};

const SemanticIcon: React.FC<{ tag: SemanticTag }> = ({ tag }) => {
  const iconId = TAG_ICON_IDS[tag];
  return (
    <image
      data-icon-id={iconId}
      href={`/input/icons/${iconId}.svg`}
      x={-27}
      y={-27}
      width={54}
      height={54}
      preserveAspectRatio="xMidYMid meet"
    />
  );
};

type SrtSemanticCaptionsProps = {
  enabled?: boolean;
  showIcon?: boolean;
  fontSize?: number;
  accentMode?: string;
  accentColor?: string;
  timeOffset?: number;
  cuesJson?: string;
  backgroundOpacity?: number;
};

export const SrtSemanticCaptions: React.FC<SrtSemanticCaptionsProps> = ({
  enabled = true,
  showIcon = false,
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
  const estimatedW = showIcon
    ? plateH / 2 + 10 + badgeR * 2 + 24 + totalW + 44
    : totalW + 114;
  const plateW = Math.max(360, Math.min(1028, estimatedW));
  const plateX = 540 - plateW / 2;
  const plateY = plateCy - plateH / 2;
  const badgeCx = plateX + plateH / 2 + 10;
  const textStartX = showIcon ? badgeCx + badgeR + 22 : plateX + 44;
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
            {showIcon ? (
              <>
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
                  <SemanticIcon tag={tag} />
                </g>
              </>
            ) : null}

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
  description: "读取导入的真实 SRT 时间戳逐句显示，调用固定图标库并支持语义配色与关键词扫线",
  category: "captions",
  catalogGroup: "口播HUD常驻卡",
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
    showIcon: false,
    fontSize: 58,
    accentMode: "auto",
    accentColor: "#f5c542",
    timeOffset: 0,
    cuesJson: "",
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示字幕动画", default: true },
    showIcon: { type: "boolean", label: "显示语义图标", default: false },
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

