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
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  step1?: string;
  step2?: string;
  step3?: string;
  icon1?: string;
  icon2?: string;
  icon3?: string;
  accentColor?: string;
  successColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitStepChecklist: React.FC<Props> = ({
  enabled = true,
  eyebrow = "成片之后",
  title = "再做高清增强",
  subtitle = "完成片，再高清放大",
  step1 = "完成成片",
  step2 = "增强软件",
  step3 = "高清放大",
  icon1 = "▣",
  icon2 = "✦",
  icon3 = "↗",
  accentColor = "#168CFF",
  successColor = "#14E6A1",
  panelColor = "#111318",
  textColor = "#FFFFFF",
  animationSeconds = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(14, Math.round(animationSeconds * fps));
  const staggerFrames = Math.max(4, Math.round(enterFrames * 0.2));
  const steps = [
    { label: step1, icon: icon1, color: accentColor },
    { label: step2, icon: icon2, color: accentColor },
    { label: step3, icon: icon3, color: successColor },
  ];

  if (!enabled) return null;

  return (
    <Interactive.Div
      name="竖屏步骤清单卡"
      data-effect="PortraitStepChecklist"
      style={{
        position: "relative",
        width: 520,
        height: 420,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
        opacity: interpolate(frame, [0, enterFrames], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <Interactive.Div
        name="步骤阶段标题"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 470,
          textAlign: "left",
          textShadow: "0 5px 17px rgba(0, 0, 0, 0.86)",
          opacity: interpolate(frame, [0, enterFrames * 0.56], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0, enterFrames * 0.56],
            ["34px 0px", "0px 0px"],
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
            gap: 10,
            color: accentColor,
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 0.8,
          }}
        >
          <span
            style={{
              display: "block",
              width: 42,
              height: 4,
              borderRadius: 999,
              backgroundColor: accentColor,
              boxShadow: `0 0 15px color-mix(in srgb, ${accentColor} 62%, transparent)`,
            }}
          />
          {eyebrow}
        </div>
        <div
          style={{
            marginTop: 10,
            overflow: "hidden",
            color: textColor,
            fontSize: 42,
            fontWeight: 950,
            lineHeight: 1.08,
            letterSpacing: -1.6,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 9,
            overflow: "hidden",
            color: "rgba(255, 255, 255, 0.72)",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.2,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle}
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="步骤连接线"
        style={{
          position: "absolute",
          top: 177,
          left: 70,
          width: 3,
          height: interpolate(
            frame,
            [enterFrames * 0.38, enterFrames * 1.22],
            [0, 174],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          borderRadius: 999,
          backgroundColor: `color-mix(in srgb, ${accentColor} 54%, transparent)`,
          boxShadow: `0 0 12px color-mix(in srgb, ${accentColor} 36%, transparent)`,
        }}
      />

      <Interactive.Div
        name="三步清单"
        style={{
          position: "absolute",
          top: 150,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 13,
          width: 480,
        }}
      >
        {steps.map((step, index) => {
          const startFrame = enterFrames * 0.28 + index * staggerFrames;
          const endFrame = startFrame + enterFrames * 0.62;
          return (
            <Interactive.Div
              name={`步骤 ${index + 1}`}
              key={`${index}-${step.label}`}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                width: index === 1 ? 420 : 448,
                height: 76,
                padding: "0 20px 0 78px",
                boxSizing: "border-box",
                overflow: "visible",
                border: "1px solid rgba(255, 255, 255, 0.11)",
                borderRadius: 16,
                color: textColor,
                backgroundColor: `color-mix(in srgb, ${panelColor} 86%, transparent)`,
                boxShadow: "0 14px 28px rgba(0, 0, 0, 0.36)",
                backdropFilter: "blur(14px)",
                opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: interpolate(
                  frame,
                  [startFrame, endFrame],
                  ["48px 0px", "0px 0px"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                scale: interpolate(
                  frame,
                  [startFrame, endFrame * 0.9, endFrame],
                  [0.88, 1.02, 1],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                transformOrigin: "100% 50%",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: -20,
                  top: 13,
                  display: "grid",
                  width: 50,
                  height: 50,
                  placeItems: "center",
                  border: `2px solid ${step.color}`,
                  borderRadius: "50%",
                  color: index === 2 ? "#08130F" : textColor,
                  backgroundColor:
                    index === 2
                      ? step.color
                      : `color-mix(in srgb, ${step.color} 22%, ${panelColor})`,
                  boxShadow: `0 0 19px color-mix(in srgb, ${step.color} 44%, transparent)`,
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  fontSize: 21,
                  fontWeight: 950,
                  lineHeight: 1,
                }}
              >
                {index + 1}
              </span>
              <span
                style={{
                  display: "grid",
                  flex: "0 0 auto",
                  width: 34,
                  height: 34,
                  marginRight: 14,
                  placeItems: "center",
                  borderRadius: 9,
                  color: step.color,
                  backgroundColor: `color-mix(in srgb, ${step.color} 13%, transparent)`,
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  fontSize: 18,
                  fontWeight: 950,
                  lineHeight: 1,
                }}
              >
                {step.icon}
              </span>
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  fontSize: 27,
                  fontWeight: 880,
                  lineHeight: 1.1,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </Interactive.Div>
          );
        })}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitStepChecklistEffectDef: EffectDef = {
  id: "PortraitStepChecklist",
  name: "竖屏口播·步骤清单卡",
  description: "参考竖屏口播视频的后期增强段：顶部给出阶段结论，右侧三张编号步骤卡依次滑入。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "123",
  placement: "right",
  component: PortraitStepChecklist as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 520, height: 420 },
  defaultPosition: { x: 500, y: 252, scale: 1 },
  defaultProps: {
    enabled: true,
    eyebrow: "成片之后",
    title: "再做高清增强",
    subtitle: "完成片，再高清放大",
    step1: "完成成片",
    step2: "增强软件",
    step3: "高清放大",
    icon1: "▣",
    icon2: "✦",
    icon3: "↗",
    accentColor: "#168CFF",
    successColor: "#14E6A1",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    animationSeconds: 1,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示步骤卡", default: true },
    eyebrow: { type: "text", label: "阶段引导词" },
    title: { type: "text", label: "阶段标题" },
    subtitle: { type: "text", label: "阶段说明" },
    step1: { type: "text", label: "步骤一" },
    step2: { type: "text", label: "步骤二" },
    step3: { type: "text", label: "步骤三" },
    icon1: { type: "text", label: "图标一" },
    icon2: { type: "text", label: "图标二" },
    icon3: { type: "text", label: "图标三" },
    accentColor: { type: "color", label: "主强调色", default: "#168CFF" },
    successColor: { type: "color", label: "完成强调色", default: "#14E6A1" },
    panelColor: { type: "color", label: "底板颜色", default: "#111318" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    animationSeconds: {
      type: "number",
      label: "入场时长(秒)",
      default: 1,
      min: 0.4,
      max: 2,
      step: 0.1,
    },
  },
};
