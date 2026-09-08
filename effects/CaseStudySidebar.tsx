import React from "react";
import { SHIELD_CHECK_SVG } from "./assets/phosphor-shield-check";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";
import { TeamAttributionCard } from "./TeamAttributionCard";

type Props = {
  enabled?: boolean;
  headline?: string;
  headlineValue?: string;
  metric1Label?: string;
  metric1Value?: string;
  metric1Progress?: number;
  metric2Label?: string;
  metric2Value?: string;
  metric2Progress?: number;
  reviewLabel?: string;
  reviewTime?: string;
  reviewSuffix?: string;
  logoSource?: "builtin" | "custom";
  builtinIcon?: string;
  customLogoUrl?: string;
  attribution?: string;
  attributionSubtitle?: string;
  accentColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

const WIDTH = 520;
const HEIGHT = 390;
const clampPercent = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

// Keep the number and unit editable as one field, but give them separate visual weights.
const splitMetric = (value: string) => {
  const match = value.trim().match(/^([\d,.]+)(.*)$/);
  return match ? { number: match[1], unit: match[2] } : { number: value, unit: "" };
};

export const CaseStudySidebar: React.FC<Props> = ({
  enabled = true,
  headline = "商业价值",
  headlineValue = "×4",
  metric1Label = "单月变现",
  metric1Value = "100万+",
  metric1Progress = 100,
  metric2Label = "单条报价",
  metric2Value = "40万",
  metric2Progress = 40,
  reviewLabel = "每周人工审核",
  reviewTime = "20–30 分钟",
  reviewSuffix = "Brief · steady output",
  logoSource = "builtin",
  builtinIcon = "bank",
  customLogoUrl = "",
  attribution = "专业团队 + AI 工具放大",
  attributionSubtitle = "ATTRIBUTION · BRIEF",
  accentColor = "#efb74d",
  textColor = "#ffffff",
  animationSeconds = 0.55,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = Math.max(1, Math.round(animationSeconds * fps));
  const reveal = (delay: number) => interpolate(frame, [delay, delay + enter], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const appear = (delay: number): React.CSSProperties => ({
    opacity: reveal(delay), transform: `translateY(${(1 - reveal(delay)) * 8}px)`,
  });
  const row = (label: string, value: string, percent: number, top: number, delay: number) => {
    const metric = splitMetric(value);
    const fill = clampPercent(percent) / 100 * reveal(delay);
    return (
      <Interactive.Div name={label} style={{ position: "absolute", top, left: 0, width: 516, ...appear(delay) }}>
        <div style={{ height: 43, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14, whiteSpace: "nowrap" }}>
          <span style={{ paddingTop: 9, fontSize: 20, lineHeight: "30px", fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
          <span style={{ flexShrink: 0, lineHeight: "43px", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: accentColor, fontFamily: 'Arial, "Noto Sans SC", sans-serif', fontSize: 34, fontWeight: 700, letterSpacing: -0.8 }}>{metric.number}</span>
            <span style={{ marginLeft: 3, color: textColor, fontSize: 20, fontWeight: 800 }}>{metric.unit}</span>
          </span>
        </div>
        <div role="progressbar" aria-label={label} aria-valuenow={clampPercent(percent)} aria-valuemin={0} aria-valuemax={100} style={{ position: "relative", height: 16, borderRadius: 999, backgroundColor: "rgba(255,255,255,.16)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)" }}>
          <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${fill * 100}%`, borderRadius: 999, backgroundColor: accentColor, opacity: 0.84, boxShadow: `0 0 12px color-mix(in srgb, ${accentColor} 55%, transparent), inset 0 1px 2px rgba(255,255,255,.4)` }} />
          {fill > 0 && <div style={{ position: "absolute", top: 2, left: `${fill * 100}%`, width: 12, height: 12, marginLeft: -6, borderRadius: "50%", backgroundColor: "#fffdf3", boxShadow: `0 0 9px ${accentColor}` }} />}
        </div>
      </Interactive.Div>
    );
  };

  return (
    <Interactive.Div name="案例商业数据侧栏" data-effect="CaseStudySidebar" style={{ position: "relative", width: WIDTH, height: HEIGHT, color: textColor, fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif', pointerEvents: "none", opacity: enabled ? 1 : 0, textShadow: "0 2px 4px rgba(0,0,0,.5)" }}>
      <Interactive.Div name="商业价值倍数" style={{ position: "absolute", top: -8, left: 8, height: 90, display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap", ...appear(0) }}>
        <span style={{ color: accentColor, opacity: 0.58, fontFamily: 'Arial, "Noto Sans SC", sans-serif', fontSize: 96, fontWeight: 800, lineHeight: "96px", letterSpacing: -2 }}>{/^[×xX]/.test(headlineValue) ? <><span style={{ fontSize: 116, fontWeight: 400, marginRight: 12, display: "inline-block", transform: "scale(1.28) translateY(3px)", transformOrigin: "left center" }}>×</span>{headlineValue.slice(1)}</> : headlineValue}</span>
        <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, opacity: 0.52 }}>{headline}</span>
      </Interactive.Div>
      {row(metric1Label, metric1Value, metric1Progress, 120, enter * 0.45)}
      {row(metric2Label, metric2Value, metric2Progress, 187, enter * 0.9)}
      <Interactive.Div name="人工审核说明" style={{ position: "absolute", top: 258, left: 0, width: WIDTH, height: 27, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", fontSize: 20, fontWeight: 750, lineHeight: "27px", ...appear(enter * 1.25) }}>
        <span aria-hidden="true" style={{ color: accentColor, fontFamily: "Arial, sans-serif", fontSize: 18, width: 6, flexShrink: 0 }}>•</span>
        <span style={{ opacity: 0.6 }}>{reviewLabel}</span>
        <span style={{ color: accentColor, fontWeight: 850 }}>{reviewTime}</span>
        <span style={{ opacity: 0.55, fontFamily: 'Arial, "Noto Sans SC", sans-serif', fontSize: 21, letterSpacing: 0.2 }}>{reviewSuffix}</span>
      </Interactive.Div>
      <div style={{ position: "absolute", top: 312, left: 0 }}>
        <TeamAttributionCard logoSource={logoSource} builtinIcon={builtinIcon} customLogoUrl={customLogoUrl} attribution={attribution} attributionSubtitle={attributionSubtitle} accentColor={accentColor} textColor={textColor} animationSeconds={animationSeconds} />
      </div>
    </Interactive.Div>
  );
};

export const CaseStudySidebarEffectDef: EffectDef = {
  id: "CaseStudySidebar",
  name: "案例商业数据侧栏",
  description: "商业价值倍数、双金色数据进度条、人工审核说明与Logo徽章名片。",
  category: "portrait-narrative",
  catalogGroup: "品牌与标识",
  glyph: "×4",
  placement: "left",
  component: CaseStudySidebar as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 300,
  bounds: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  defaultPosition: { x: 72, y: 185, scale: 1 },
  defaultProps: {
    enabled: true, headline: "商业价值", headlineValue: "×4", logoSource: "builtin", builtinIcon: "bank", customLogoUrl: "",
    metric1Label: "单月变现", metric1Value: "100万+", metric1Progress: 100,
    metric2Label: "单条报价", metric2Value: "40万", metric2Progress: 40,
    reviewLabel: "每周人工审核", reviewTime: "20–30 分钟", reviewSuffix: "Brief · steady output",
    attribution: "专业团队 + AI 工具放大", attributionSubtitle: "ATTRIBUTION · BRIEF",
    accentColor: "#efb74d", textColor: "#ffffff", animationSeconds: 0.55,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示侧栏", default: true },
    headline: { type: "text", label: "结论标题" },
    headlineValue: { type: "text", label: "核心倍数" },
    metric1Label: { type: "text", label: "指标一名称" },
    metric1Value: { type: "text", label: "指标一数值" },
    metric1Progress: { type: "number", label: "指标一进度(%)", default: 100, min: 0, max: 100, step: 1 },
    metric2Label: { type: "text", label: "指标二名称" },
    metric2Value: { type: "text", label: "指标二数值" },
    metric2Progress: { type: "number", label: "指标二进度(%)", default: 40, min: 0, max: 100, step: 1 },
    reviewLabel: { type: "text", label: "审核说明" },
    reviewTime: { type: "text", label: "审核时长" },
    reviewSuffix: { type: "text", label: "审核英文说明" },
    attribution: { type: "text", label: "团队说明" },
    attributionSubtitle: { type: "text", label: "团队英文副标题" },
    accentColor: { type: "color", label: "强调色", default: "#efb74d" },
    textColor: { type: "color", label: "文字颜色", default: "#ffffff" },
    animationSeconds: { type: "number", label: "入场时长(秒)", default: 0.55, min: 0.2, max: 2, step: 0.05 },
  },
};







