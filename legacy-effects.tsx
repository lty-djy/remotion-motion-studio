import React, { type CSSProperties } from "react";
import type { MotionComponentDefinition } from "./local-protocol";
import type { EffectDef } from "./registry";
import { LegacyMetricEffect } from "./effects/LegacyMetricEffects";

type LegacyProps = {
  title?: string;
  subtitle?: string;
  value?: string;
  item1?: string;
  item2?: string;
  item3?: string;
  accentColor?: string;
  secondaryColor?: string;
  animationSeconds?: number;
};

type LegacySpec = readonly [string, string, string, string, string];

const legacyGroups: ReadonlyArray<readonly [string, string, readonly LegacySpec[]]> = [
  ["数字与指标", "metric", [     ["SegmentedMeter", "分段能量条", "分段式容量、性能和能量指示", "▮▮▮", "75%"],   ["WaveformMetric", "波形指标", "连续波形和实时吞吐读数", "∿", "128/s"],  ["RadialTicks", "HUD 刻度环", "科技 HUD 刻度与中心读数", "◎", "92%"],  ]],
  ["图表与比较", "chart", [       ]],
  ["文字与叙事", "text", [       ]],
  ["图片、视频与证据", "media", [      ]],
  ["结构、流程与解释", "structure", [       ]],
  ["UI 与科技界面", "tech", [       ]],
  ["空间与聚焦", "spatial", [    ]],
  ["品牌、装饰与转场", "brand", [       ]],
];

const LegacyEffectCard: React.FC<LegacyProps> = ({ title = "动效标题", subtitle = "MOTION COMPONENT", value = "87%", item1 = "关键节点一", item2 = "关键节点二", item3 = "关键节点三", accentColor = "#68e8ff", secondaryColor = "#8b8b8b" }) => {
  const card: CSSProperties = { width: 620, padding: "32px 36px", border: "1px solid rgba(255,255,255,.20)", borderRadius: 18, background: "rgba(16,18,23,.72)", color: "#f6f7f8", fontFamily: "system-ui, sans-serif" };
  return <div style={card}><div style={{ color: accentColor, fontSize: 15, letterSpacing: 3 }}>{subtitle}</div><div style={{ display: "flex", alignItems: "baseline", gap: 20, margin: "16px 0 22px" }}><strong style={{ fontSize: 72, lineHeight: 1 }}>{value}</strong><span style={{ color: secondaryColor, fontSize: 18 }}>{title}</span></div><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>{[item1, item2, item3].map((item, index) => <div key={index} style={{ borderTop: `2px solid ${accentColor}`, paddingTop: 10, color: "#c9cdd3", fontSize: 14 }}>{item}</div>)}</div></div>;
};

const legacyDefaults = (id: string, name: string, value: string): LegacyProps & Record<string, unknown> => ({ componentType: id, enabled: true, title: name, subtitle: "MOTION COMPONENT", value, item1: "关键节点一", item2: "关键节点二", item3: "关键节点三", accentColor: "#d7d7d7", secondaryColor: "#7a7d84", animationSeconds: 1.2 });

export const LEGACY_EFFECT_DEFS: EffectDef[] = legacyGroups.flatMap(([catalogGroup, category, specs]) => specs.map(([id, name, description, glyph, value]) => ({ id, name, description: `${description} · 工作台内置模板`, category, catalogGroup, glyph, placement: "left" as const, arranger: { compiler: "legacy-metric" as const }, component: (category === "metric" ? LegacyMetricEffect : LegacyEffectCard) as MotionComponentDefinition["component"], durationInFrames: 120, bounds: { x: 0, y: 0, width: 700, height: 340 }, defaultPosition: { x: 70, y: 380, scale: 1 }, defaultProps: legacyDefaults(id, name, value), propsSchema: { title: { type: "text", label: "主标题" }, subtitle: { type: "text", label: "副标题" }, value: { type: "text", label: "核心数值" }, item1: { type: "text", label: "内容一" }, item2: { type: "text", label: "内容二" }, item3: { type: "text", label: "内容三" }, animationSeconds: { type: "number", label: "动画时长(秒)", min: 0.2, max: 8, step: 0.1 }, accentColor: { type: "color", label: "强调色" }, secondaryColor: { type: "color", label: "辅助色" } } })));
