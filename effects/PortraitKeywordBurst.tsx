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
  word1?: string;
  word2?: string;
  word3?: string;
  highlightIndex?: number;
  accentColor?: string;
  textColor?: string;
  shadowColor?: string;
  animationSeconds?: number;
};

const getFontSize = (text: string) => {
  if (text.length >= 4) return 92;
  if (text.length === 3) return 112;
  if (text.length === 2) return 136;
  return 164;
};

export const PortraitKeywordBurst: React.FC<Props> = ({
  enabled = true,
  word1 = "未来",
  word2 = "",
  word3 = "3年",
  highlightIndex = 0,
  accentColor = "#168CFF",
  textColor = "#FFFFFF",
  shadowColor = "#000000",
  animationSeconds = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(10, Math.round(animationSeconds * fps));
  const staggerFrames = Math.max(4, Math.round(enterFrames * 0.24));
  const words = [word1, word2, word3];

  if (!enabled) return null;

  return (
    <Interactive.Div
      name="竖屏开场大字"
      data-effect="PortraitKeywordBurst"
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        alignItems: "start",
        width: 940,
        height: 260,
        color: textColor,
        fontFamily: '"Arial Black", Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
      }}
    >
      {words.map((word, index) => {
        if (!word.trim()) return <div key={`empty-${index}`} />;
        const startFrame = 2 + index * staggerFrames;
        const endFrame = startFrame + enterFrames;
        const settleFrame = startFrame + enterFrames * 0.72;
        return (
          <Interactive.Div
            name={`关键词 ${index + 1}`}
            key={`${index}-${word}`}
            style={{
              justifySelf: index === 0 ? "start" : index === 2 ? "end" : "center",
              marginTop: index === 1 ? 0 : 22,
              maxWidth: 310,
              overflow: "visible",
              color: highlightIndex === index + 1 ? accentColor : textColor,
              fontSize: getFontSize(word),
              fontWeight: 950,
              lineHeight: 0.95,
              letterSpacing: -7,
              whiteSpace: "nowrap",
              WebkitTextStroke: "2px rgba(0, 0, 0, 0.24)",
              paintOrder: "stroke fill",
              textShadow: `0 7px 0 rgba(0, 0, 0, 0.2), 0 18px 24px ${shadowColor}`,
              opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(
                frame,
                [startFrame, endFrame],
                [index === 0 ? "-34px -48px" : index === 2 ? "34px -48px" : "0px -54px", "0px 0px"],
                {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              ),
              scale: interpolate(
                frame,
                [startFrame, settleFrame, endFrame],
                [0.72, 1.06, 1],
                {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              ),
              transformOrigin: index === 0 ? "0% 50%" : index === 2 ? "100% 50%" : "50% 50%",
            }}
          >
            {word}
          </Interactive.Div>
        );
      })}
    </Interactive.Div>
  );
};

export const PortraitKeywordBurstEffectDef: EffectDef = {
  id: "PortraitKeywordBurst",
  name: "竖屏口播·开场大字",
  description: "参考竖屏口播视频提炼的三段大字：从画面上方错位弹入，支持留空中间词以避开人物面部。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "大字",
  placement: "top",
  component: PortraitKeywordBurst as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 96,
  bounds: { x: 0, y: 0, width: 940, height: 260 },
  defaultPosition: { x: 70, y: 176, scale: 1 },
  defaultProps: {
    enabled: true,
    word1: "未来",
    word2: "",
    word3: "3年",
    highlightIndex: 3,
    accentColor: "#168CFF",
    textColor: "#FFFFFF",
    shadowColor: "#000000",
    animationSeconds: 0.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示开场大字", default: true },
    word1: { type: "text", label: "左侧关键词" },
    word2: { type: "text", label: "中间关键词" },
    word3: { type: "text", label: "右侧关键词" },
    highlightIndex: {
      type: "number",
      label: "强调第几个词(0-3)",
      default: 3,
      min: 0,
      max: 3,
      step: 1,
    },
    accentColor: { type: "color", label: "强调色", default: "#168CFF" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    shadowColor: { type: "color", label: "阴影颜色", default: "#000000" },
    animationSeconds: {
      type: "number",
      label: "入场时长(秒)",
      default: 0.8,
      min: 0.4,
      max: 2,
      step: 0.1,
    },
  },
};
