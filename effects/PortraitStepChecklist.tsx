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
  subtitle?: string;
  stepCount?: number;
  step1?: string;
  step2?: string;
  step3?: string;
  step4?: string;
  step5?: string;
  step6?: string;
  step7?: string;
  step8?: string;
  accentColor?: string;
  successColor?: string;
  panelColor?: string;
  textColor?: string;
  cardWidth?: number;
  cardsOffsetX?: number;
  textOffsetX?: number;
  stepFontSize?: number;
  eyebrowFontSize?: number;
  titleFontSize?: number;
  subtitleFontSize?: number;
  stepEnterIntervalSeconds?: number;
  animationSeconds?: number;
};

export const PortraitStepChecklist: React.FC<Props> = ({
  backgroundOpacity = 0,
  enabled = true,
  eyebrow = "成片之后",
  title = "再做高清增强",
  subtitle = "完成片，再高清放大",
  stepCount = 3,
  step1 = "完成成片",
  step2 = "增强软件",
  step3 = "高清放大",
  step4 = "检查细节",
  step5 = "统一色彩",
  step6 = "导出成片",
  step7 = "发布复盘",
  step8 = "持续迭代",
  accentColor = "#168CFF",
  successColor = "#14E6A1",
  panelColor = "#111318",
  textColor = "#FFFFFF",
  cardWidth = 448,
  cardsOffsetX = 0,
  textOffsetX = 0,
  stepFontSize = 27,
  eyebrowFontSize = 20,
  titleFontSize = 42,
  subtitleFontSize = 18,
  stepEnterIntervalSeconds = 0.2,
  animationSeconds = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(14, Math.round(animationSeconds * fps));
  const normalizedCount = Math.min(8, Math.max(1, Math.round(Number(stepCount) || 3)));
  const staggerFrames = Math.max(0, Math.round((Number(stepEnterIntervalSeconds) || 0) * fps));
  const safeCardWidth = Math.min(520, Math.max(300, Number(cardWidth) || 448));
  const safeCardsOffsetX = Math.min(240, Math.max(-240, Number(cardsOffsetX) || 0));
  const safeTextOffsetX = Math.min(120, Math.max(-120, Number(textOffsetX) || 0));
  const safeStepFontSize = Math.min(72, Math.max(10, Number(stepFontSize) || 27));
  const safeEyebrowFontSize = Math.min(64, Math.max(10, Number(eyebrowFontSize) || 20));
  const safeTitleFontSize = Math.min(96, Math.max(16, Number(titleFontSize) || 42));
  const safeSubtitleFontSize = Math.min(64, Math.max(10, Number(subtitleFontSize) || 18));
  const steps = [
    { label: step1, color: accentColor },
    { label: step2, color: accentColor },
    { label: step3, color: successColor },
    { label: step4, color: accentColor },
    { label: step5, color: accentColor },
    { label: step6, color: successColor },
    { label: step7, color: accentColor },
    { label: step8, color: successColor },
  ].slice(0, normalizedCount);

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div
      name="竖屏步骤清单卡"
      data-effect="PortraitStepChecklist"
      style={{
        position: "relative",
        width: 520,
        height: Math.max(420, 170 + steps.length * 76 + Math.max(0, steps.length - 1) * 13),
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
            fontSize: safeEyebrowFontSize,
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
            fontSize: safeTitleFontSize,
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
            fontSize: safeSubtitleFontSize,
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
          top: 194,
          left: 70,
          width: 3,
          height: interpolate(
            frame,
            [enterFrames * 0.38, enterFrames * 1.22],
            [0, Math.max(174, steps.length * 76 + Math.max(0, steps.length - 1) * 13 - 52)],
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
          top: 168,
          right: 12,
          transform: `translateX(${safeCardsOffsetX}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 14,
          width: 480,
        }}
      >
        {steps.map((step, index) => {
          const startFrame = enterFrames * 0.28 + index * staggerFrames;
          const endFrame = startFrame + enterFrames * 0.62;
          return (
            <Interactive.Div
              name={`步骤 ${index + 1}`}
              data-step-card={index + 1}
              key={`${index}-${step.label}`}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                width: safeCardWidth,
                height: 72,
                padding: "0 20px",
                boxSizing: "border-box",
                overflow: "visible",
                border: bgFactor > 0 ? "1px solid rgba(255, 255, 255, 0.11)" : "1px solid transparent",
                borderRadius: 16,
                color: textColor,
                backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(86 * bgFactor)}%, transparent)`,
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
                  border: `2px solid ${accentColor}`,
                  borderRadius: "50%",
                  color: textColor,
                  backgroundColor:
                    `color-mix(in srgb, ${accentColor} 22%, ${panelColor})`,
                  boxShadow: `0 0 19px color-mix(in srgb, ${accentColor} 44%, transparent)`,
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  fontSize: 20,
                  fontWeight: 950,
                  lineHeight: 1,
                }}
              >
                {index + 1}
              </span>
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  fontSize: safeStepFontSize,
                  fontWeight: 880,
                  lineHeight: 1.1,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  transform: `translateX(${safeTextOffsetX}px)`,
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
  description: "可按需增减的步骤清单卡，顶部给出阶段结论，步骤卡依次滑入。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "123",
  placement: "right",
  component: PortraitStepChecklist as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 520, height: 860 },
  defaultPosition: { x: 500, y: 252, scale: 1 },
  defaultProps: {
    enabled: true,
    eyebrow: "成片之后",
    title: "再做高清增强",
    subtitle: "完成片，再高清放大",
    stepCount: 3,
    step1: "完成成片",
    step2: "增强软件",
    step3: "高清放大",
    step4: "检查细节",
    step5: "统一色彩",
    step6: "导出成片",
    step7: "发布复盘",
    step8: "持续迭代",
    accentColor: "#168CFF",
    successColor: "#14E6A1",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    cardWidth: 448,
    cardsOffsetX: 0,
    textOffsetX: 0,
    stepFontSize: 27,
    eyebrowFontSize: 20,
    titleFontSize: 42,
    subtitleFontSize: 18,
    stepEnterIntervalSeconds: 0.2,
    animationSeconds: 1,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示步骤卡", default: true },
    eyebrow: { type: "text", label: "阶段引导词" },
    title: { type: "text", label: "阶段标题" },
    subtitle: { type: "text", label: "阶段说明" },
    stepCount: { type: "number", label: "步骤数量", default: 3, min: 1, max: 8, step: 1 },
    step1: { type: "text", label: "步骤一" },
    step2: { type: "text", label: "步骤二" },
    step3: { type: "text", label: "步骤三" },
    step4: { type: "text", label: "步骤四" },
    step5: { type: "text", label: "步骤五" },
    step6: { type: "text", label: "步骤六" },
    step7: { type: "text", label: "步骤七" },
    step8: { type: "text", label: "步骤八" },
    accentColor: { type: "color", label: "主强调色", default: "#168CFF" },
    successColor: { type: "color", label: "完成强调色", default: "#14E6A1" },
    panelColor: { type: "color", label: "底板颜色", default: "#111318" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    eyebrowFontSize: { type: "number", label: "阶段引导词字号(px)", default: 20, min: 10, max: 64, step: 1 },
    titleFontSize: { type: "number", label: "阶段标题字号(px)", default: 42, min: 16, max: 96, step: 1 },
    subtitleFontSize: { type: "number", label: "阶段说明字号(px)", default: 18, min: 10, max: 64, step: 1 },
    cardWidth: { type: "number", label: "卡片宽度(px)", default: 448, min: 300, max: 520, step: 1 },
    cardsOffsetX: { type: "number", label: "卡片水平位置(px)", default: 0, min: -240, max: 240, step: 1 },
    textOffsetX: { type: "number", label: "步骤文字水平位置(px)", default: 0, min: -120, max: 120, step: 1 },
    stepFontSize: { type: "number", label: "步骤字号(px)", default: 27, min: 10, max: 72, step: 1 },
    stepEnterIntervalSeconds: { type: "number", label: "下一步骤入场间隔(秒)", default: 0.2, min: 0, max: 8, step: 0.05 },
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
