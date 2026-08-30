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
  titlePrefix?: string;
  titleEmphasis?: string;
  prompt?: string;
  issue1?: string;
  issue2?: string;
  issue3?: string;
  conclusionPrefix?: string;
  conclusionEmphasis?: string;
  eyebrowFontSize?: number;
  titleFontSize?: number;
  promptFontSize?: number;
  issueFontSize?: number;
  conclusionFontSize?: number;
  accentColor?: string;
  warningColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitPromptMistakeDiagnosis: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  eyebrow = "你是不是也这样",
  titlePrefix = "打开就",
  titleEmphasis = "直接开口",
  prompt = "帮我做一个官网",
  issue1 = "配色随机",
  issue2 = "动效生硬",
  issue3 = "代码冗余",
  conclusionPrefix = "问题不在模型，是你",
  conclusionEmphasis = "少了准备这一步",
  eyebrowFontSize = 22,
  titleFontSize = 58,
  promptFontSize = 26,
  issueFontSize = 18,
  conclusionFontSize = 24,
  accentColor = "#F2D51B",
  warningColor = "#FF6571",
  panelColor = "#0A0D14",
  textColor = "#F7F8FA",
  animationSeconds = 7.6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const totalFrames = Math.max(90, Math.round(animationSeconds * fps));
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const typedLength = Math.floor(
    interpolate(
      frame,
      [totalFrames * 0.2, totalFrames * 0.53],
      [0, prompt.length],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );
  const issues = [issue1, issue2, issue3];

  return (
    <Interactive.Div
      name="错误提问诊断"
      data-effect="PortraitPromptMistakeDiagnosis"
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
        backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(96 * bgFactor)}%, transparent)`,
        boxShadow:
          bgFactor > 0 ? "0 28px 80px rgba(0, 0, 0, 0.5)" : "none",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: bgFactor * 0.42,
          filter: "blur(13px)",
          background:
            "repeating-linear-gradient(172deg, transparent 0 34px, rgba(32,219,232,.28) 35px 41px, transparent 42px 63px, rgba(150,89,255,.2) 64px 69px, transparent 70px 92px)",
          scale: 1.12,
        }}
      />

      <Interactive.Div
        name="错误用法标题"
        style={{
          position: "absolute",
          top: 68,
          left: 90,
          width: 720,
          opacity: interpolate(
            frame,
            [0, totalFrames * 0.16],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [0, totalFrames * 0.16],
            ["0px -24px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          textAlign: "center",
          textShadow: "0 7px 24px rgba(0, 0, 0, 0.9)",
        }}
      >
        <div
          style={{
            color: "rgba(247, 248, 250, 0.58)",
            fontSize: eyebrowFontSize,
            fontWeight: 700,
            letterSpacing: 1.2,
            lineHeight: 1,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            marginTop: 17,
            fontFamily: '"Songti SC", "SimSun", serif',
            fontSize: titleFontSize,
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: -1.3,
          }}
        >
          <span>{titlePrefix}</span>
          <span style={{ marginLeft: 14, color: accentColor }}>
            {titleEmphasis}
          </span>
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="提问输入框"
        style={{
          position: "absolute",
          top: 248,
          left: 90,
          display: "flex",
          alignItems: "center",
          width: 720,
          height: 76,
          padding: "0 24px",
          boxSizing: "border-box",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.09)",
          borderRadius: 12,
          color: textColor,
          backgroundColor: "rgba(11, 14, 22, 0.88)",
          boxShadow: "0 16px 34px rgba(0, 0, 0, 0.42)",
          fontSize: promptFontSize,
          fontWeight: 650,
          lineHeight: 1,
          opacity: interpolate(
            frame,
            [totalFrames * 0.11, totalFrames * 0.23],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          scale: interpolate(
            frame,
            [totalFrames * 0.11, totalFrames * 0.23],
            [0.96, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              output: "perceptual-scale",
            },
          ),
        }}
      >
        <span>{prompt.slice(0, typedLength)}</span>
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 3,
            height: 30,
            marginLeft: 4,
            borderRadius: 3,
            backgroundColor: "#18E3F2",
            opacity: frame % 18 < 12 ? 1 : 0,
          }}
        />
      </Interactive.Div>

      <Interactive.Div
        name="问题标签组"
        style={{
          position: "absolute",
          top: 350,
          left: 90,
          display: "flex",
          gap: 14,
          width: 720,
          justifyContent: "center",
        }}
      >
        {issues.map((issue, index) => {
          const startFrame = totalFrames * 0.5 + index * totalFrames * 0.065;
          const endFrame = startFrame + totalFrames * 0.14;
          return (
            <Interactive.Div
              name={`问题标签 ${index + 1}`}
              data-issue={index + 1}
              key={`${index}-${issue}`}
              style={{
                display: "flex",
                alignItems: "center",
                minWidth: 168,
                height: 48,
                padding: "0 17px",
                boxSizing: "border-box",
                justifyContent: "center",
                border: `1px solid color-mix(in srgb, ${warningColor} 42%, transparent)`,
                borderRadius: 24,
                color: warningColor,
                backgroundColor: `color-mix(in srgb, ${warningColor} 11%, rgba(10, 13, 20, 0.72))`,
                boxShadow: `inset 0 0 20px color-mix(in srgb, ${warningColor} 7%, transparent)`,
                fontSize: issueFontSize,
                fontWeight: 800,
                lineHeight: 1,
                opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: interpolate(
                  frame,
                  [startFrame, endFrame],
                  ["0px 18px", "0px 0px"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                scale: interpolate(
                  frame,
                  [startFrame, endFrame * 0.94, endFrame],
                  [0.9, 1.03, 1],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    output: "perceptual-scale",
                  },
                ),
              }}
            >
              <span style={{ marginRight: 8, fontWeight: 950 }}>×</span>
              {issue}
            </Interactive.Div>
          );
        })}
      </Interactive.Div>

      <Interactive.Div
        name="诊断结论"
        style={{
          position: "absolute",
          top: 456,
          left: 90,
          width: 720,
          color: "rgba(247, 248, 250, 0.72)",
          fontSize: conclusionFontSize,
          fontWeight: 750,
          lineHeight: 1.25,
          textAlign: "center",
          textShadow: "0 6px 20px rgba(0, 0, 0, 0.9)",
          opacity: interpolate(
            frame,
            [totalFrames * 0.75, totalFrames * 0.95],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [totalFrames * 0.75, totalFrames * 0.95],
            ["0px 16px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        <span>{conclusionPrefix}</span>
        <span style={{ marginLeft: 8, color: accentColor, fontWeight: 900 }}>
          {conclusionEmphasis}
        </span>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitPromptMistakeDiagnosisEffectDef: EffectDef = {
  id: "PortraitPromptMistakeDiagnosis",
  name: "竖屏口播·错误提问诊断",
  description:
    "复刻参考视频 12.566–20.933 秒：逐字输入错误提问，错峰展示三项问题，最后落到缺少准备步骤的诊断结论。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "ASK",
  placement: "top",
  component:
    PortraitPromptMistakeDiagnosis as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 255,
  bounds: { x: 0, y: 0, width: 900, height: 650 },
  defaultPosition: { x: 90, y: 250, scale: 1 },
  defaultProps: {
    enabled: true,
    eyebrow: "你是不是也这样",
    titlePrefix: "打开就",
    titleEmphasis: "直接开口",
    prompt: "帮我做一个官网",
    issue1: "配色随机",
    issue2: "动效生硬",
    issue3: "代码冗余",
    conclusionPrefix: "问题不在模型，是你",
    conclusionEmphasis: "少了准备这一步",
    eyebrowFontSize: 22,
    titleFontSize: 58,
    promptFontSize: 26,
    issueFontSize: 18,
    conclusionFontSize: 24,
    accentColor: "#F2D51B",
    warningColor: "#FF6571",
    panelColor: "#0A0D14",
    textColor: "#F7F8FA",
    animationSeconds: 7.6,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示错误提问诊断", default: true },
    eyebrow: { type: "text", label: "顶部引导词" },
    titlePrefix: { type: "text", label: "标题前半句" },
    titleEmphasis: { type: "text", label: "标题强调词" },
    prompt: { type: "text", label: "输入框文案" },
    issue1: { type: "text", label: "问题一" },
    issue2: { type: "text", label: "问题二" },
    issue3: { type: "text", label: "问题三" },
    conclusionPrefix: { type: "text", label: "结论前半句" },
    conclusionEmphasis: { type: "text", label: "结论强调词" },
    eyebrowFontSize: { type: "number", label: "顶部引导词字号(px)", default: 22, min: 10, max: 72, step: 1 },
    titleFontSize: { type: "number", label: "标题字号(px)", default: 58, min: 24, max: 96, step: 1 },
    promptFontSize: { type: "number", label: "输入框字号(px)", default: 26, min: 12, max: 64, step: 1 },
    issueFontSize: { type: "number", label: "问题标签字号(px)", default: 18, min: 10, max: 42, step: 1 },
    conclusionFontSize: { type: "number", label: "结论字号(px)", default: 24, min: 12, max: 64, step: 1 },
    accentColor: { type: "color", label: "强调色", default: "#F2D51B" },
    warningColor: { type: "color", label: "问题标签颜色", default: "#FF6571" },
    panelColor: { type: "color", label: "底板颜色", default: "#0A0D14" },
    textColor: { type: "color", label: "文字颜色", default: "#F7F8FA" },
    animationSeconds: {
      type: "number",
      label: "完整入场时长(秒)",
      default: 7.6,
      min: 4.5,
      max: 10,
      step: 0.1,
    },
  },
};
