export type SrtCue = {
  index: number;
  start: number;
  end: number;
  text: string;
};

// 来自「未来3年卫浴行业.srt」的逐句时间轴（秒）
export const DEFAULT_CUES: SrtCue[] = [
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

export type SemanticTag =
  | "time"
  | "store"
  | "money"
  | "risk"
  | "online"
  | "deal"
  | "people"
  | "growth"
  | "trend";

const SEMANTIC_LEXICON: ReadonlyArray<{ keys: string[]; tag: SemanticTag }> = [
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

export type SemanticMatch = { tag: SemanticTag; keyword: string };

export const matchSemantics = (text: string): SemanticMatch => {
  for (const entry of SEMANTIC_LEXICON) {
    for (const key of entry.keys) {
      if (key && text.includes(key)) return { tag: entry.tag, keyword: key };
    }
  }
  return { tag: "online", keyword: "" };
};

export const HF_BASE = "#F5F7FA";
export const HF_DIM = "#8C9BAE";
export const HF_LINK = "#007AFF";
export const HF_AMBER = "#FFC400";

export const TAG_COLORS: Record<SemanticTag, string> = {
  time: "#5E5CE6",
  store: "#FF9F0A",
  money: "#FFC400",
  risk: "#FF453A",
  online: "#007AFF",
  deal: "#30D158",
  people: "#64D2FF",
  growth: "#32D74B",
  trend: "#BF5AF2",
};

export const TAG_LABELS: Record<SemanticTag, string> = {
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

export const resolveAccent = (
  mode: string | undefined,
  override: string | undefined,
  tag: SemanticTag,
) =>
  mode === "mono" && override
    ? override
    : TAG_COLORS[tag] ?? HF_AMBER;

export const resolveCues = (cuesJson: string | undefined): SrtCue[] => {
  if (!cuesJson || !cuesJson.trim()) return DEFAULT_CUES;
  try {
    const parsed: unknown = JSON.parse(cuesJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const cues = parsed.flatMap((raw, i) => {
        const item = raw as Record<string, unknown>;
        const start = Number(item.start);
        const end = Number(item.end);
        const text = typeof item.text === "string" ? item.text : "";
        if (!Number.isFinite(start) || !Number.isFinite(end) || !text) return [];
        return [{ index: i + 1, start, end: Math.max(end, start + 0.2), text }];
      });
      if (cues.length > 0) return cues;
    }
  } catch {
    // fallthrough
  }
  return DEFAULT_CUES;
};

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

// GSAP power2.out（cubic）
export const pow2Out = (t: number) => 1 - (1 - clamp01(t)) ** 3;

// GSAP power1.inOut（quad）
export const pow1InOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
};

// GSAP back.out(k)：过冲弹入
export const backOut = (t: number, k = 1.70158) => {
  const c1 = k;
  const c3 = k + 1;
  const x = clamp01(t) - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0").slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

export const mixColor = (fromHex: string, toHex: string, t: number) => {
  const a = hexToRgb(fromHex);
  const b = hexToRgb(toHex);
  const k = clamp01(t);
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)}, ${Math.round(
    a[1] + (b[1] - a[1]) * k,
  )}, ${Math.round(a[2] + (b[2] - a[2]) * k)})`;
};

export const withAlpha = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha).toFixed(3)})`;
};
