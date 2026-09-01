import React from "react";
import { Interactive, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = { enabled?: boolean; backgroundOpacity?: number; stampText?: string; warningColor?: string; panelColor?: string; textColor?: string; fontSize?: number; delaySeconds?: number; animationSeconds?: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const MarketEliminationStamp: React.FC<Props> = ({ enabled = true, backgroundOpacity = 1, stampText = "市场淘汰", warningColor = "#FF4358", panelColor = "#080F19", textColor = "#F8FBFF", fontSize = 37, delaySeconds = 0, animationSeconds = 0.42 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayFrames = Math.max(0, Math.round(delaySeconds * fps));
  const progress = spring({ frame: frame - delayFrames, fps, durationInFrames: Math.max(8, Math.round(animationSeconds * fps)), config: { damping: 17, stiffness: 220, mass: 0.65 } });
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const safeFontSize = clamp(Number.isFinite(fontSize) ? fontSize : 37, 22, 72);
  const horizontalPadding = 40;
  const textLines = String(stampText || "印章").split(/\r?\n/u);
  const lineWidths = textLines.map((line) => Array.from(line).reduce((total, char) => total + (/[\u3400-\u9fff]/u.test(char) ? 1 : 0.62), 0));
  const longestLineUnits = Math.max(1, ...lineWidths);
  const textWidth = longestLineUnits * safeFontSize + Math.max(0, longestLineUnits - 1) * 2.4;
  const cardWidth = Math.max(180, textWidth + horizontalPadding + 6);
  const lineCount = Math.max(1, textLines.length);
  const cardHeight = Math.max(100, Math.ceil(lineCount * safeFontSize * 1.08 + 28));
  return <Interactive.Div name="市场淘汰印章" data-effect="MarketEliminationStamp" style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: cardWidth, minHeight: cardHeight, padding: "14px 20px", boxSizing: "border-box", overflow: "visible", border: `3px solid ${warningColor}`, borderRadius: 10, color: warningColor, backgroundColor: bgFactor > 0 ? `color-mix(in srgb, ${panelColor} 34%, transparent)` : "transparent", fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', fontSize: safeFontSize, fontWeight: 950, lineHeight: 1.08, letterSpacing: 2.4, textAlign: "center", whiteSpace: "pre", rotate: "-3deg", scale: interpolate(progress, [0, 1], [1.22, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), opacity: enabled ? progress : 0, transformOrigin: "50% 50%", boxShadow: `0 0 22px ${warningColor}44`, backdropFilter: "blur(8px)", pointerEvents: "none" }}>{stampText}</Interactive.Div>;
};

export const MarketEliminationStampEffectDef: EffectDef = {
  id: "MarketEliminationStamp", name: "淘汰警告·市场印章", description: "独立的红色倾斜淘汰印章，支持字号调整，并根据文字长度自动适配卡片尺寸。", category: "warning", catalogGroup: "风险提醒", glyph: "STAMP", placement: "left", component: MarketEliminationStamp as React.ComponentType<Record<string, unknown>>, durationInFrames: 72, bounds: { x: 0, y: 0, width: 560, height: 180 }, defaultPosition: { x: 58, y: 510, scale: 1 }, defaultProps: { enabled: true, stampText: "市场淘汰", warningColor: "#FF4358", panelColor: "#080F19", textColor: "#F8FBFF", fontSize: 37, delaySeconds: 0, animationSeconds: 0.42 }, propsSchema: { enabled: { type: "boolean", label: "显示市场印章", default: true }, stampText: { type: "text", label: "印章结论" }, warningColor: { type: "color", label: "警示色", default: "#FF4358" }, panelColor: { type: "color", label: "底板颜色", default: "#080F19" }, textColor: { type: "color", label: "文字颜色", default: "#F8FBFF" }, fontSize: { type: "number", label: "印章字号(px)", default: 37, min: 22, max: 72, step: 1 }, delaySeconds: { type: "number", label: "入场延迟(秒)", default: 0, min: 0, max: 8, step: 0.05 }, animationSeconds: { type: "number", label: "入场时长(秒)", default: 0.42, min: 0.15, max: 1.5, step: 0.03 } },
};
