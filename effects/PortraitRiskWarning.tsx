import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  backgroundOpacity?: number;
  eyebrow?: string;
  title?: string;
  emphasis?: string;
  risk1?: string;
  risk2?: string;
  risk3?: string;
  icon1?: string;
  icon2?: string;
  icon3?: string;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitRiskWarning: React.FC<Props> = ({
  backgroundOpacity = 0,
  enabled = true,
  eyebrow = "使用边界",
  title = "高清放大",
  emphasis = "≠ 万能修复",
  risk1 = "错误口型",
  risk2 = "表情失真",
  risk3 = "细节异常",
  icon1 = "×",
  icon2 = "!",
  icon3 = "⌁",
  accentColor = "#FF493D",
  panelColor = "#111318",
  textColor = "#FFFFFF",
  animationSeconds = 0.95,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(14, Math.round(animationSeconds * fps));
  const staggerFrames = Math.max(4, Math.round(enterFrames * 0.18));
  const risks = [
    { text: risk1, icon: icon1 },
    { text: risk2, icon: icon2 },
    { text: risk3, icon: icon3 },
  ];

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div
      name="竖屏风险提醒卡"
      data-effect="PortraitRiskWarning"
      style={{
        position: "relative",
        width: 500,
        height: 420,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
      }}
    >

      <Interactive.Div
        name="风险结论"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 460,
          paddingLeft: 17,
          boxSizing: "border-box",
          borderLeft: `5px solid ${accentColor}`,
          textShadow: "0 5px 18px rgba(0, 0, 0, 0.9)",
          opacity: interpolate(frame, [0, enterFrames * 0.62], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0, enterFrames * 0.62],
            ["-30px 0px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            color: accentColor,
            fontSize: 19,
            fontWeight: 950,
            lineHeight: 1,
            letterSpacing: 0.8,
          }}
        >
          <span
            style={{
              display: "grid",
              width: 24,
              height: 24,
              placeItems: "center",
              border: `2px solid ${accentColor}`,
              borderRadius: "50%",
              fontFamily: '"SFMono-Regular", Consolas, monospace',
              fontSize: 16,
              fontWeight: 950,
              lineHeight: 1,
            }}
          >
            ×
          </span>
          {eyebrow}
        </div>
        <div
          style={{
            marginTop: 10,
            overflow: "hidden",
            color: textColor,
            fontSize: 38,
            fontWeight: 950,
            lineHeight: 1.05,
            letterSpacing: -1.3,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 4,
            overflow: "hidden",
            color: accentColor,
            fontSize: 35,
            fontWeight: 950,
            lineHeight: 1.05,
            letterSpacing: -1.1,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {emphasis}
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="风险条目组"
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 12,
          width: 440,
        }}
      >
        {risks.map((risk, index) => {
          const startFrame = enterFrames * 0.34 + index * staggerFrames;
          const endFrame = startFrame + enterFrames * 0.62;
          return (
            <Interactive.Div
              name={`风险条目 ${index + 1}`}
              data-risk-card={index + 1}
              key={`${index}-${risk.text}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: 420,
                height: 70,
                padding: "0 18px",
                boxSizing: "border-box",
                overflow: "hidden",
                border: bgFactor > 0 ? `1px solid color-mix(in srgb, ${accentColor} 34%, rgba(255, 255, 255, 0.08))` : "1px solid transparent",
                borderRadius: 15,
                color: textColor,
                backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(88 * bgFactor)}%, transparent)`,
                boxShadow: bgFactor > 0 ? "0 14px 28px rgba(0, 0, 0, 0.36)" : "none",
                backdropFilter: bgFactor > 0 ? "blur(14px)" : undefined,
                opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: interpolate(
                  frame,
                  [startFrame, endFrame],
                  ["-38px 0px", "0px 0px"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                scale: interpolate(
                  frame,
                  [startFrame, endFrame * 0.9, endFrame],
                  [0.9, 1.02, 1],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                transformOrigin: "0% 50%",
              }}
            >
              <span
                style={{
                  display: "grid",
                  flex: "0 0 auto",
                  width: 34,
                  height: 34,
                  placeItems: "center",
                  border: `2px solid ${accentColor}`,
                  borderRadius: "50%",
                  color: accentColor,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  fontSize: 18,
                  fontWeight: 950,
                  lineHeight: 1,
                }}
              >
                {risk.icon}
              </span>
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  fontSize: 25,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {risk.text}
              </span>
            </Interactive.Div>
          );
        })}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitRiskWarningEffectDef: EffectDef = {
  id: "PortraitRiskWarning",
  name: "竖屏口播·风险提醒卡",
  description: "参考竖屏口播的使用边界段：红色结论标题配合三条等宽风险提醒，依次滑入强调限制条件。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "RISK",
  placement: "left",
  component: PortraitRiskWarning as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 500, height: 420 },
  defaultPosition: { x: 58, y: 292, scale: 1 },
  defaultProps: {
    enabled: true,
    eyebrow: "使用边界",
    title: "高清放大",
    emphasis: "≠ 万能修复",
    risk1: "错误口型",
    risk2: "表情失真",
    risk3: "细节异常",
    icon1: "×",
    icon2: "!",
    icon3: "⌁",
    accentColor: "#FF493D",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    animationSeconds: 0.95,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示风险提醒", default: true },
    eyebrow: { type: "text", label: "警示引导语" },
    title: { type: "text", label: "结论标题" },
    emphasis: { type: "text", label: "强调结论" },
    risk1: { type: "text", label: "风险一" },
    risk2: { type: "text", label: "风险二" },
    risk3: { type: "text", label: "风险三" },
    icon1: { type: "text", label: "图标一" },
    icon2: { type: "text", label: "图标二" },
    icon3: { type: "text", label: "图标三" },
    accentColor: { type: "color", label: "警示色", default: "#FF493D" },
    panelColor: { type: "color", label: "底板颜色", default: "#111318" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    animationSeconds: {
      type: "number",
      label: "入场时长(秒)",
      default: 0.95,
      min: 0.4,
      max: 2,
      step: 0.05,
    },
  },
};
