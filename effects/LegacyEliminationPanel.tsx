import React from "react";
import { Easing, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  backgroundOpacity?: number;
  kicker?: string;
  title?: string;
  subtitle?: string;
  warningColor?: string;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const LegacyEliminationPanel: React.FC<Props> = ({
  backgroundOpacity = 1,
  enabled = true,
  kicker = "OLD MODEL · WARNING",
  title = "单纯卖货",
  subtitle = "PRODUCT-ONLY STORE",
  warningColor = "#FF4358",
  accentColor = "#FFB735",
  panelColor = "#080F19",
  textColor = "#F8FBFF",
  animationSeconds = 1.12,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const strikeEndFrame = Math.max(18, animationSeconds * fps);
  const strikeStartFrame = strikeEndFrame * 0.64;
  const intro = spring({ frame, fps, durationInFrames: 16, config: { damping: 22, stiffness: 180, mass: 0.8 } });
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div name="淘汰对象面板" data-effect="LegacyEliminationPanel" style={{ position: "relative", width: 560, height: 190, color: textColor, fontFamily: 'Inter, "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif', opacity: enabled ? intro : 0, translate: `${interpolate(intro, [0, 1], [-26, 0], clamp)}px ${interpolate(intro, [0, 1], [16, 0], clamp)}px`, scale: interpolate(intro, [0, 1], [0.975, 1], clamp), transformOrigin: "0% 0%", pointerEvents: "none" }}>
      <Interactive.Div name="淘汰对象卡片" data-card-surface style={{ position: "absolute", top: 0, left: 0, width: 548, height: 181, padding: "26px 28px", boxSizing: "border-box", overflow: "hidden", border: bgFactor > 0 ? `1px solid ${accentColor}66` : "1px solid transparent", borderRadius: 15, background: bgFactor > 0 ? `linear-gradient(180deg, color-mix(in srgb, ${panelColor} 96%, white 4%), color-mix(in srgb, ${panelColor} 92%, black 8%))` : "transparent", boxShadow: bgFactor > 0 ? `0 16px 40px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.045), 0 0 22px ${accentColor}14` : "none", backdropFilter: bgFactor > 0 ? "blur(16px)" : undefined }}>
        <div style={{ overflow: "hidden", color: textColor, fontSize: 54, fontWeight: 950, lineHeight: 1, letterSpacing: -1.6, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ marginTop: 14, overflow: "hidden", color: accentColor, fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace', fontSize: 13, fontWeight: 850, lineHeight: 1, letterSpacing: 1.8, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>
        <Interactive.Div name="删除线" style={{ position: "absolute", top: 68, left: 21, width: interpolate(frame, [strikeStartFrame, strikeEndFrame], [0, 296], { ...clamp, easing: Easing.out(Easing.cubic) }), height: 6, borderRadius: 99, backgroundColor: warningColor, rotate: "-6deg", transformOrigin: "0% 50%", boxShadow: `0 0 14px ${warningColor}88` }} />
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const LegacyEliminationPanelEffectDef: EffectDef = {
  id: "LegacyEliminationPanel",
  name: "淘汰警告·旧方案面板",
  description: "独立的深色旧方案警告面板：标题、英文标签和红色删除线可单独编排。",
  category: "warning",
  catalogGroup: "风险提醒",
  glyph: "PANEL",
  placement: "left",
  component: LegacyEliminationPanel as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 96,
  bounds: { x: 0, y: 0, width: 560, height: 190 },
  defaultPosition: { x: 58, y: 300, scale: 1 },
  defaultProps: { enabled: true, kicker: "OLD MODEL · WARNING", title: "单纯卖货", subtitle: "PRODUCT-ONLY STORE", warningColor: "#FF4358", accentColor: "#FFB735", panelColor: "#080F19", textColor: "#F8FBFF", animationSeconds: 1.12 },
  propsSchema: { enabled: { type: "boolean", label: "显示旧方案面板", default: true }, kicker: { type: "text", label: "顶部警告标签" }, title: { type: "text", label: "淘汰对象" }, subtitle: { type: "text", label: "英文小标签" }, warningColor: { type: "color", label: "警示色", default: "#FF4358" }, accentColor: { type: "color", label: "边框强调色", default: "#FFB735" }, panelColor: { type: "color", label: "面板颜色", default: "#080F19" }, textColor: { type: "color", label: "标题颜色", default: "#F8FBFF" }, animationSeconds: { type: "number", label: "划线完成时间(秒)", default: 1.12, min: 0.6, max: 2.2, step: 0.04 } },
};
