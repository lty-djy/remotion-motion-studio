import React from "react";
import { Img, Interactive, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { EffectDef } from "../registry";
import { BUILTIN_ICON_URLS } from "./BrandLogo";

type Props = { enabled?: boolean; logoSource?: "builtin" | "custom"; builtinIcon?: string; customLogoUrl?: string; attribution?: string; attributionSubtitle?: string; accentColor?: string; textColor?: string; panelColor?: string; width?: number; height?: number; animationSeconds?: number };

export const TeamAttributionCard: React.FC<Props> = ({ enabled = true, logoSource = "builtin", builtinIcon = "bank", customLogoUrl = "", attribution = "专业团队 + AI 工具放大", attributionSubtitle = "ATTRIBUTION · BRIEF", accentColor = "#efb74d", textColor = "#ffffff", panelColor = "rgba(8,10,12,.88)", width = 320, height = 74, animationSeconds = 0.55 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const enter = Math.max(8, Math.round(animationSeconds * fps));
  const progress = enabled ? interpolate(frame, [0, enter], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const src = logoSource === "custom" ? customLogoUrl?.trim() || BUILTIN_ICON_URLS[builtinIcon] || BUILTIN_ICON_URLS.bank : BUILTIN_ICON_URLS[builtinIcon] || BUILTIN_ICON_URLS.bank;
  return <Interactive.Div name="Logo徽章名片" data-effect="TeamAttributionCard" style={{ width, height, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14, padding: "10px 17px", border: `1px solid color-mix(in srgb, ${accentColor} 65%, transparent)`, borderRadius: 14, backgroundColor: panelColor, boxShadow: "0 4px 12px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.06)", color: textColor, opacity: progress, transform: `translateY(${(1 - progress) * 8}px)`, fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif', pointerEvents: "none" }}>
    <Img src={src} style={{ width: 24, height: 24, flexShrink: 0, objectFit: "contain" }} />
    <div style={{ minWidth: 0, overflow: "hidden" }}><div style={{ fontSize: 24, lineHeight: "30px", fontWeight: 900, whiteSpace: "nowrap", letterSpacing: -0.4, overflow: "hidden", textOverflow: "ellipsis" }}>{attribution}</div><div style={{ marginTop: 1, color: accentColor, fontFamily: 'Arial, "Noto Sans SC", sans-serif', fontSize: 13, lineHeight: "18px", fontWeight: 800, letterSpacing: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{attributionSubtitle}</div></div>
  </Interactive.Div>;
};

export const TeamAttributionCardEffectDef: EffectDef = {
  id: "TeamAttributionCard", name: "Logo徽章名片", description: "品牌、团队背书或归因结论出现时使用的黑底金边 Logo 徽章名片，可选择内置图标或导入外部图标。", category: "brand", catalogGroup: "品牌与标识", glyph: "盾", placement: "left", component: TeamAttributionCard as React.ComponentType<Record<string, unknown>>, durationInFrames: 150, bounds: { x: 0, y: 0, width: 320, height: 74 }, defaultPosition: { x: 72, y: 420, scale: 1 },
  defaultProps: { enabled: true, logoSource: "builtin", builtinIcon: "bank", customLogoUrl: "", attribution: "专业团队 + AI 工具放大", attributionSubtitle: "ATTRIBUTION · BRIEF", accentColor: "#efb74d", textColor: "#ffffff", panelColor: "rgba(8,10,12,.88)", width: 320, height: 74, animationSeconds: 0.55 },
  propsSchema: {
    enabled: { type: "boolean", label: "显示团队卡片", default: true }, logoSource: { type: "select", label: "图标来源", default: "builtin", options: [{ label: "内置图标库", value: "builtin" }, { label: "手动添加图片", value: "custom" }] }, builtinIcon: { type: "select", label: "内置图标", default: "bank", options: [{ label: "机构", value: "bank" }, { label: "盾牌", value: "seal-check" }, { label: "完成", value: "check-circle" }, { label: "团队", value: "users" }, { label: "相机", value: "camera" }] }, customLogoUrl: { type: "text", label: "手动图片 URL" }, attribution: { type: "text", label: "团队说明" }, attributionSubtitle: { type: "text", label: "英文副标题" }, accentColor: { type: "color", label: "强调色", default: "#efb74d" }, textColor: { type: "color", label: "文字颜色", default: "#ffffff" }, panelColor: { type: "color", label: "卡片颜色", default: "rgba(8,10,12,.88)" }, width: { type: "number", label: "宽度(px)", default: 320, min: 220, max: 620, step: 1 }, height: { type: "number", label: "高度(px)", default: 74, min: 56, max: 180, step: 1 }, animationSeconds: { type: "number", label: "入场时长(秒)", default: 0.55, min: 0.2, max: 2, step: 0.05 },
  },
};


