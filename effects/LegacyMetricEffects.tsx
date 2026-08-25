import React, { type CSSProperties } from "react";
import { useRafProgress } from "./use-raf-progress";

export type LegacyMetricProps = {
  componentType?: string;
  title?: string;
  subtitle?: string;
  value?: string;
  item1?: string;
  item2?: string;
  item3?: string;
  accentColor?: string;
  secondaryColor?: string;
  animationSeconds?: number;
  cardTransparent?: boolean;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const numericValue = (value: string) => {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 87;
};

const panelBase: CSSProperties = {
  position: "relative",
  width: 620,
  height: 300,
  boxSizing: "border-box",
  padding: "28px 32px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 18,
  background: "rgba(8,10,14,.88)",
  color: "#f5f5f5",
  fontFamily: "Inter, system-ui, sans-serif",
};

// cardTransparent（亮底模式）：去掉卡片底色与阴影，只留文字与图形
const transparentPanel: CSSProperties = {
  ...panelBase,
  background: "transparent",
  border: "none",
  boxShadow: "none",
};

const makePanel = (cardTransparent?: boolean) =>
  cardTransparent ? transparentPanel : panelBase;

// Remotion controls every animated value from the current frame. Browser CSS
// interpolation would lag behind continuous preview playback and is skipped by
// isolated frame rendering, so it must be disabled for frame-exact parity.
const transition = "none";

const Header = ({ title, subtitle, accentColor }: Required<Pick<LegacyMetricProps, "title" | "subtitle" | "accentColor">>) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18 }}>
    <strong style={{ fontSize: 18, fontWeight: 650 }}>{title}</strong>
    <span style={{ color: accentColor, fontSize: 11, letterSpacing: 2.4 }}>{subtitle}</span>
  </div>
);

const Ring = ({ progress, color, size = 142, stroke = 9 }: { progress: number; color: string; size?: number; stroke?: number }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.10)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition }} />
    </svg>
  );
};

const Bars = ({ values, progress, color }: { values: number[]; progress: number; color: string }) => (
  <div style={{ height: 116, display: "flex", alignItems: "end", gap: 10 }}>
    {values.map((height, index) => (
      <div key={index} style={{ width: 18, height: `${height * progress}%`, minHeight: 2, background: index === values.length - 1 ? color : "rgba(255,255,255,.30)", borderRadius: "3px 3px 0 0", transition }} />
    ))}
  </div>
);

export const LegacyMetricEffect: React.FC<LegacyMetricProps> = ({
  componentType = "ProgressRing",
  title = "数字指标",
  subtitle = "LIVE METRIC",
  value = "87%",
  item1 = "速度 84%",
  item2 = "质量 72%",
  item3 = "稳定性 91%",
  accentColor = "#d7d7d7",
  secondaryColor = "#7a7d84",
  animationSeconds = 1.2,
  cardTransparent,
}) => {
  const panel = makePanel(cardTransparent);
  const progress = useRafProgress(animationSeconds);
  const number = numericValue(value);
  const percent = clamp01(Math.abs(number) / 100);
  const shownNumber = Math.round(number * progress).toLocaleString("zh-CN");
  const shownValue = value.replace(/[0-9,.+-]+/, shownNumber);
  const commonHeader = <Header title={title} subtitle={subtitle} accentColor={accentColor} />;

  if (componentType === "ProgressRing") {
    return <div style={panel}>{commonHeader}<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 34, marginTop: 20 }}><div style={{ position: "relative" }}><Ring progress={percent * progress} color={accentColor} /><strong style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 32 }}>{shownValue}</strong></div><div style={{ width: 180, color: secondaryColor, lineHeight: 1.8 }}>{item1}<br />{item2}<br />{item3}</div></div></div>;
  }

  if (componentType === "Countdown") {
    const remaining = Math.max(0, Math.ceil(Math.abs(number) * (1 - progress)));
    return <div style={{ ...panel, display: "grid", placeItems: "center", textAlign: "center" }}><span style={{ color: accentColor, letterSpacing: 5 }}>{subtitle}</span><strong style={{ fontFamily: "Consolas, monospace", fontSize: 124, lineHeight: 1 }}>{String(remaining).padStart(2, "0")}</strong><div style={{ width: 280, height: 2, background: "rgba(255,255,255,.12)" }}><div style={{ width: `${progress * 100}%`, height: "100%", background: accentColor, transition }} /></div></div>;
  }

  if (componentType === "SegmentedMeter") {
    return <div style={panel}>{commonHeader}<strong style={{ display: "block", marginTop: 30, fontSize: 52 }}>{shownValue}</strong><div style={{ display: "flex", gap: 7, marginTop: 24 }}>{Array.from({ length: 12 }, (_, index) => <span key={index} style={{ width: 36, height: 52, borderRadius: 4, background: index / 12 < percent * progress ? accentColor : "rgba(255,255,255,.10)", opacity: .35 + index / 18, transition }} />)}</div></div>;
  }

  if (componentType === "DualMetricBar") {
    return <div style={panel}>{commonHeader}<div style={{ marginTop: 34, display: "grid", gap: 24 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}><span>{item1}</span><div style={{ width: `${42 * progress}%`, maxWidth: 300, height: 18, background: "rgba(255,255,255,.28)", transition }} /></div><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: `${88 * progress}%`, maxWidth: 390, height: 18, background: accentColor, transition }} /><span>{item2}</span></div><strong style={{ position: "absolute", right: 34, bottom: 26, fontSize: 28 }}>{shownValue}</strong></div></div>;
  }

  if (componentType === "FlipCounter") {
    return <div style={panel}>{commonHeader}<div style={{ marginTop: 38, display: "flex", justifyContent: "center", gap: 5 }}>{String(shownNumber).split("").map((char, index) => <div key={index} style={{ position: "relative", minWidth: 58, padding: "17px 7px", overflow: "hidden", borderRadius: 6, background: "#15171b", border: "1px solid #34363c", fontFamily: "Consolas, monospace", fontSize: 52, textAlign: "center", transform: `perspective(300px) rotateX(${(1 - progress) * 70}deg)`, transition }}><span>{char}</span><i style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "#050608" }} /></div>)}</div></div>;
  }

  if (componentType === "WaveformMetric") {
    const heights = [18,32,24,56,84,42,68,28,92,48,66,34,78,22,54,30,72,40];
    return <div style={panel}>{commonHeader}<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 30 }}><Bars values={heights} progress={progress} color={accentColor} /><div style={{ textAlign: "right" }}><strong style={{ display: "block", fontSize: 48 }}>{shownValue}</strong><small style={{ color: secondaryColor }}>STREAM VELOCITY</small></div></div></div>;
  }

  if (componentType === "LiquidGauge") {
    return <div style={panel}>{commonHeader}<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 38, marginTop: 18 }}><div style={{ position: "relative", width: 140, height: 160, overflow: "hidden", border: "2px solid rgba(255,255,255,.28)", borderRadius: "14px 14px 48px 48px" }}><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${percent * progress * 100}%`, background: accentColor, opacity: .72, transition }} /><div style={{ position: "absolute", left: -20, right: -20, bottom: `${percent * progress * 100 - 2}%`, height: 12, borderRadius: "50%", borderTop: "2px solid #fff", transition }} /></div><div><strong style={{ fontSize: 58 }}>{shownValue}</strong><p style={{ color: secondaryColor }}>{item1}</p></div></div></div>;
  }

  if (componentType === "RadialTicks") {
    return <div style={panel}>{commonHeader}<div style={{ position: "relative", width: 180, height: 180, margin: "12px auto 0" }}><Ring progress={percent * progress} color={accentColor} size={180} stroke={3} />{Array.from({ length: 24 }, (_, index) => <span key={index} style={{ position: "absolute", left: 88, top: 2, width: 2, height: index / 24 < percent * progress ? 13 : 7, background: index / 24 < percent * progress ? accentColor : "#41434a", transformOrigin: "1px 88px", transform: `rotate(${index * 15}deg)`, transition }} />)}<strong style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 38 }}>{shownValue}</strong></div></div>;
  }

  return <div style={panel}>{commonHeader}<div style={{ marginTop: 34 }}><strong style={{ display: "block", fontSize: 54 }}>{shownValue}</strong><div style={{ marginTop: 18, color: secondaryColor, lineHeight: 1.8 }}>{item1}<br />{item2}<br />{item3}</div></div></div>;
};
