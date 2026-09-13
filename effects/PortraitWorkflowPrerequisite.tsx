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
  kicker?: string;
  titleEmphasis?: string;
  titleSuffix?: string;
  subtitleLine1?: string;
  subtitleLine2?: string;
  workflowLabel?: string;
  stepCount?: number;
  step1?: string;
  step2?: string;
  step3?: string;
  step4?: string;
  step5?: string;
  step6?: string;
  step7?: string;
  step8?: string;
  footerEmphasis?: string;
  footerText?: string;
  kickerFontSize?: number;
  titleFontSize?: number;
  subtitleFontSize?: number;
  workflowLabelFontSize?: number;
  stepNumberFontSize?: number;
  stepFontSize?: number;
  footerFontSize?: number;
  accentColor?: string;
  stepColor1?: string;
  stepColor2?: string;
  stepColor3?: string;
  stepColor4?: string;
  stepColor5?: string;
  stepColor6?: string;
  stepColor7?: string;
  stepColor8?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitWorkflowPrerequisite: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  kicker = "动手做网页之前",
  titleEmphasis = "先装工作流，",
  titleSuffix = "再动手",
  subtitleLine1 = "先把这套 Skill 工作流装好，",
  subtitleLine2 = "AI 才知道该按什么规矩走。",
  workflowLabel = "THE WORKFLOW",
  stepCount = 4,
  step1 = "审美",
  step2 = "动效",
  step3 = "工程",
  step4 = "自测",
  step5 = "发布",
  step6 = "复盘",
  step7 = "优化",
  step8 = "沉淀",
  footerEmphasis = "顺序不能反",
  footerText = "先定审美，最后自测",
  kickerFontSize = 18,
  titleFontSize = 54,
  subtitleFontSize = 20,
  workflowLabelFontSize = 14,
  stepNumberFontSize = 14,
  stepFontSize = 28,
  footerFontSize = 16,
  accentColor = "#17D9E8",
  stepColor1 = "#18D9E8",
  stepColor2 = "#66E56C",
  stepColor3 = "#A36CFF",
  stepColor4 = "#5986FF",
  stepColor5 = "#FFB84D",
  stepColor6 = "#FF6B8A",
  stepColor7 = "#4DD8A7",
  stepColor8 = "#7B8CFF",
  panelColor = "#071017",
  textColor = "#F5F7FA",
  animationSeconds = 5.2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const totalFrames = Math.max(105, Math.round(animationSeconds * fps));
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const normalizedStepCount = Math.min(8, Math.max(1, Math.round(stepCount)));
  const steps = [
    { label: step1, color: stepColor1 },
    { label: step2, color: stepColor2 },
    { label: step3, color: stepColor3 },
    { label: step4, color: stepColor4 },
    { label: step5, color: stepColor5 },
    { label: step6, color: stepColor6 },
    { label: step7, color: stepColor7 },
    { label: step8, color: stepColor8 },
  ].slice(0, normalizedStepCount);
  const columns = Math.min(4, normalizedStepCount);
  const usesTwoRows = normalizedStepCount > 4;

  return (
    <Interactive.Div
      name="前置准备流程"
      data-effect="PortraitWorkflowPrerequisite"
      style={{
        position: "relative",
        width: 900,
        height: 650,
        boxSizing: "border-box",
        overflow: "hidden",
        border:
          bgFactor > 0
            ? "1px solid rgba(255, 255, 255, 0.07)"
            : "1px solid transparent",
        borderRadius: 28,
        color: textColor,
        backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(95 * bgFactor)}%, transparent)`,
        boxShadow:
          bgFactor > 0 ? "0 28px 78px rgba(0, 0, 0, 0.48)" : "none",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: bgFactor * 0.4,
          filter: "blur(14px)",
          background:
            "repeating-linear-gradient(170deg, transparent 0 35px, rgba(30,218,232,.24) 36px 42px, transparent 43px 67px, rgba(146,91,255,.18) 68px 73px, transparent 74px 96px)",
          scale: 1.13,
        }}
      />

      <Interactive.Div
        name="章节标签"
        style={{
          position: "absolute",
          top: 54,
          left: 72,
          display: "flex",
          alignItems: "center",
          height: 34,
          padding: "0 16px",
          border: `1px solid color-mix(in srgb, ${accentColor} 40%, transparent)`,
          borderRadius: 17,
          color: accentColor,
          backgroundColor: `color-mix(in srgb, ${accentColor} 10%, rgba(5, 17, 23, 0.78))`,
          boxShadow: `inset 0 0 18px color-mix(in srgb, ${accentColor} 8%, transparent)`,
          fontSize: kickerFontSize,
          fontWeight: 850,
          lineHeight: 1,
          opacity: interpolate(frame, [0, totalFrames * 0.12], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0, totalFrames * 0.12],
            ["-20px 0px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        <span style={{ marginRight: 7, fontSize: 12 }}>◆</span>
        {kicker}
      </Interactive.Div>

      <Interactive.Div
        name="工作流标题"
        style={{
          position: "absolute",
          top: 112,
          left: 72,
          width: 756,
          fontFamily: '"Songti SC", "SimSun", serif',
          fontSize: titleFontSize,
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: -1.5,
          textShadow: "0 8px 28px rgba(0, 0, 0, 0.86)",
          opacity: interpolate(
            frame,
            [totalFrames * 0.05, totalFrames * 0.23],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [totalFrames * 0.05, totalFrames * 0.23],
            ["0px 22px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        <span style={{ color: accentColor }}>{titleEmphasis}</span>
        <span style={{ marginLeft: 14 }}>{titleSuffix}</span>
      </Interactive.Div>

      <Interactive.Div
        name="工作流说明"
        style={{
          position: "absolute",
          top: 205,
          left: 72,
          paddingLeft: 15,
          borderLeft: `3px solid ${accentColor}`,
          color: "rgba(245, 247, 250, 0.57)",
          fontSize: subtitleFontSize,
          fontWeight: 650,
          lineHeight: 1.45,
          letterSpacing: 0.2,
          textShadow: "0 5px 18px rgba(0, 0, 0, 0.8)",
          opacity: interpolate(
            frame,
            [totalFrames * 0.18, totalFrames * 0.34],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        <div>{subtitleLine1}</div>
        <div>{subtitleLine2}</div>
      </Interactive.Div>

      <Interactive.Div
        name="流程英文标签"
        style={{
          position: "absolute",
          top: 318,
          left: 72,
          color: "rgba(245, 247, 250, 0.42)",
          fontFamily: '"SFMono-Regular", Consolas, monospace',
          fontSize: workflowLabelFontSize,
          fontWeight: 750,
          lineHeight: 1,
          letterSpacing: 4.4,
          opacity: interpolate(
            frame,
            [totalFrames * 0.28, totalFrames * 0.4],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {workflowLabel}
      </Interactive.Div>

      <Interactive.Div
        name="动态步骤工作流"
        style={{
          position: "absolute",
          top: 355,
          left: 72,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          columnGap: 40,
          rowGap: 18,
          width: 756,
        }}
      >
        {steps.map((step, index) => {
          const stepInterval = usesTwoRows ? 0.065 : 0.11;
          const startFrame = totalFrames * 0.34 + index * totalFrames * stepInterval;
          const endFrame = startFrame + totalFrames * 0.16;
          const isRowEnd = (index + 1) % columns === 0;
          return (
              <Interactive.Div
                key={`${index}-${step.label}`}
                name={`工作流步骤 ${index + 1}`}
                data-workflow-step={index + 1}
                data-workflow-number={String(index + 1).padStart(2, "0")}
                style={{
                  position: "relative",
                  display: "grid",
                  width: "100%",
                  height: usesTwoRows ? 88 : 112,
                  placeItems: "center",
                  alignContent: "center",
                  border: `2px solid color-mix(in srgb, ${step.color} 55%, transparent)`,
                  borderRadius: 13,
                  color: textColor,
                  backgroundColor: `color-mix(in srgb, ${step.color} 9%, rgba(8, 13, 21, 0.86))`,
                  boxShadow: `0 0 28px color-mix(in srgb, ${step.color} 13%, transparent), inset 0 0 24px color-mix(in srgb, ${step.color} 7%, transparent)`,
                  opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  translate: interpolate(
                    frame,
                    [startFrame, endFrame],
                    ["0px 22px", "0px 0px"],
                    {
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  ),
                  scale: interpolate(
                    frame,
                    [startFrame, endFrame * 0.94, endFrame],
                    [0.9, 1.025, 1],
                    {
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      output: "perceptual-scale",
                    },
                  ),
                }}
              >
                <span
                  data-workflow-step-number={index + 1}
                  style={{
                    color: step.color,
                    fontFamily: '"SFMono-Regular", Consolas, monospace',
                    fontSize: stepNumberFontSize,
                    fontWeight: 850,
                    lineHeight: 1,
                    letterSpacing: 1.5,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    marginTop: 9,
                    fontFamily: '"Songti SC", "SimSun", serif',
                    fontSize: stepFontSize,
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  {step.label}
                </span>
              {index < steps.length - 1 && !isRowEnd ? (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: -31,
                    width: 22,
                    color: "rgba(245, 247, 250, 0.34)",
                    fontSize: 20,
                    fontWeight: 850,
                    textAlign: "center",
                    translate: "0px -50%",
                    opacity: interpolate(
                      frame,
                      [endFrame - totalFrames * 0.04, endFrame],
                      [0, 1],
                      {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      },
                    ),
                  }}
                >
                  →
                </span>
              ) : null}
            </Interactive.Div>
          );
        })}
      </Interactive.Div>

      <Interactive.Div
        name="顺序提示"
        style={{
          position: "absolute",
          top: usesTwoRows ? 570 : 505,
          left: 72,
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: footerFontSize,
          fontWeight: 750,
          opacity: interpolate(
            frame,
            [totalFrames * 0.78, totalFrames * 0.96],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [totalFrames * 0.78, totalFrames * 0.96],
            ["0px 14px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        <span
          style={{
            padding: "8px 14px",
            border: "1px solid rgba(242, 213, 27, 0.34)",
            borderRadius: 16,
            color: "#F2D51B",
            backgroundColor: "rgba(242, 213, 27, 0.08)",
          }}
        >
          {footerEmphasis}
        </span>
        <span style={{ color: "rgba(245, 247, 250, 0.42)" }}>
          {footerText}
        </span>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitWorkflowPrerequisiteEffectDef: EffectDef = {
  id: "PortraitWorkflowPrerequisite",
  name: "前置准备流程",
  description:
    "复刻参考视频 20.966–26.483 秒：先建立工作流前置结论，再按顺序点亮可增减、自动编号的流程步骤。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "FLOW",
  placement: "top",
  component:
    PortraitWorkflowPrerequisite as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 165,
  bounds: { x: 0, y: 0, width: 900, height: 650 },
  defaultPosition: { x: 90, y: 250, scale: 1 },
  defaultProps: {
    enabled: true,
    kicker: "动手做网页之前",
    titleEmphasis: "先装工作流，",
    titleSuffix: "再动手",
    subtitleLine1: "先把这套 Skill 工作流装好，",
    subtitleLine2: "AI 才知道该按什么规矩走。",
    workflowLabel: "THE WORKFLOW",
    stepCount: 4,
    step1: "审美",
    step2: "动效",
    step3: "工程",
    step4: "自测",
    step5: "发布",
    step6: "复盘",
    step7: "优化",
    step8: "沉淀",
    footerEmphasis: "顺序不能反",
    footerText: "先定审美，最后自测",
    kickerFontSize: 18,
    titleFontSize: 54,
    subtitleFontSize: 20,
    workflowLabelFontSize: 14,
    stepNumberFontSize: 14,
    stepFontSize: 28,
    footerFontSize: 16,
    accentColor: "#17D9E8",
    stepColor1: "#18D9E8",
    stepColor2: "#66E56C",
    stepColor3: "#A36CFF",
    stepColor4: "#5986FF",
    stepColor5: "#FFB84D",
    stepColor6: "#FF6B8A",
    stepColor7: "#4DD8A7",
    stepColor8: "#7B8CFF",
    panelColor: "#071017",
    textColor: "#F5F7FA",
    animationSeconds: 5.2,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示工作流", default: true },
    kicker: { type: "text", label: "顶部章节标签" },
    titleEmphasis: { type: "text", label: "标题强调词" },
    titleSuffix: { type: "text", label: "标题后半句" },
    subtitleLine1: { type: "text", label: "说明第一行" },
    subtitleLine2: { type: "text", label: "说明第二行" },
    workflowLabel: { type: "text", label: "流程英文标签" },
    stepCount: { type: "number", label: "步骤数量", default: 4, min: 1, max: 8, step: 1 },
    step1: { type: "text", label: "步骤一" },
    step2: { type: "text", label: "步骤二" },
    step3: { type: "text", label: "步骤三" },
    step4: { type: "text", label: "步骤四" },
    step5: { type: "text", label: "步骤五" },
    step6: { type: "text", label: "步骤六" },
    step7: { type: "text", label: "步骤七" },
    step8: { type: "text", label: "步骤八" },
    footerEmphasis: { type: "text", label: "底部强调词" },
    footerText: { type: "text", label: "底部说明" },
    kickerFontSize: { type: "number", label: "顶部章节标签字号(px)", default: 18, min: 10, max: 52, step: 1 },
    titleFontSize: { type: "number", label: "标题字号(px)", default: 54, min: 24, max: 96, step: 1 },
    subtitleFontSize: { type: "number", label: "说明字号(px)", default: 20, min: 10, max: 52, step: 1 },
    workflowLabelFontSize: { type: "number", label: "流程英文标签字号(px)", default: 14, min: 8, max: 36, step: 1 },
    stepNumberFontSize: { type: "number", label: "步骤编号字号(px)", default: 14, min: 8, max: 36, step: 1 },
    stepFontSize: { type: "number", label: "步骤文字字号(px)", default: 28, min: 14, max: 64, step: 1 },
    footerFontSize: { type: "number", label: "底部提示字号(px)", default: 16, min: 10, max: 42, step: 1 },
    accentColor: { type: "color", label: "标题强调色", default: "#17D9E8" },
    stepColor1: { type: "color", label: "步骤一颜色", default: "#18D9E8" },
    stepColor2: { type: "color", label: "步骤二颜色", default: "#66E56C" },
    stepColor3: { type: "color", label: "步骤三颜色", default: "#A36CFF" },
    stepColor4: { type: "color", label: "步骤四颜色", default: "#5986FF" },
    stepColor5: { type: "color", label: "步骤五颜色", default: "#FFB84D" },
    stepColor6: { type: "color", label: "步骤六颜色", default: "#FF6B8A" },
    stepColor7: { type: "color", label: "步骤七颜色", default: "#4DD8A7" },
    stepColor8: { type: "color", label: "步骤八颜色", default: "#7B8CFF" },
    panelColor: { type: "color", label: "底板颜色", default: "#071017" },
    textColor: { type: "color", label: "文字颜色", default: "#F5F7FA" },
    animationSeconds: {
      type: "number",
      label: "完整入场时长(秒)",
      default: 5.2,
      min: 3.5,
      max: 8,
      step: 0.1,
    },
  },
};
