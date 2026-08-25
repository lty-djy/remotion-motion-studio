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
  tag1?: string;
  tag2?: string;
  tag3?: string;
  symbol1?: string;
  symbol2?: string;
  symbol3?: string;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitDecisionTagStack: React.FC<Props> = ({
  enabled = true,
  tag1 = "速度更快",
  tag2 = "成本更低",
  tag3 = "剪辑流畅",
  symbol1 = "↗",
  symbol2 = "✓",
  symbol3 = "✂",
  accentColor = "#14E6A1",
  panelColor = "#111318",
  textColor = "#FFFFFF",
  animationSeconds = 0.9,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(12, Math.round(animationSeconds * fps));
  const staggerFrames = Math.max(3, Math.round(enterFrames * 0.16));
  const tags = [
    { text: tag1, symbol: symbol1 },
    { text: tag2, symbol: symbol2 },
    { text: tag3, symbol: symbol3 },
  ];

  if (!enabled) return null;

  return (
    <Interactive.Div
      name="竖屏优缺点标签组"
      data-effect="PortraitDecisionTagStack"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 12,
        width: 330,
        height: 228,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
      }}
    >
      {tags.map((tag, index) => {
        const startFrame = index * staggerFrames;
        const endFrame = startFrame + enterFrames * 0.68;
        return (
          <Interactive.Div
            name={`优缺点标签 ${index + 1}`}
            data-decision-stack-card={index + 1}
            key={`${index}-${tag.text}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              width: 314,
              height: 68,
              padding: "0 18px",
              boxSizing: "border-box",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 15,
              color: textColor,
              backgroundColor: `color-mix(in srgb, ${panelColor} 86%, transparent)`,
              boxShadow: "0 13px 25px rgba(0, 0, 0, 0.34)",
              backdropFilter: "blur(14px)",
              opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(
                frame,
                [startFrame, endFrame],
                ["42px 0px", "0px 0px"],
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
                display: "grid",
                flex: "0 0 auto",
                width: 32,
                height: 32,
                placeItems: "center",
                border: `2px solid ${accentColor}`,
                borderRadius: "50%",
                color: accentColor,
                backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: 18,
                fontWeight: 950,
                lineHeight: 1,
              }}
            >
              {tag.symbol}
            </span>
            <span
              style={{
                minWidth: 0,
                overflow: "hidden",
                fontSize: 25,
                fontWeight: 850,
                lineHeight: 1.1,
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {tag.text}
            </span>
          </Interactive.Div>
        );
      })}
    </Interactive.Div>
  );
};

export const PortraitDecisionTagStackEffectDef: EffectDef = {
  id: "PortraitDecisionTagStack",
  name: "竖屏口播·优缺点标签组",
  description: "从数据决策卡拆出的独立三标签组件，三张玻璃卡严格同宽对齐并依次滑入。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "TAG",
  placement: "right",
  component: PortraitDecisionTagStack as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 330, height: 228 },
  defaultPosition: { x: 675, y: 371, scale: 1 },
  defaultProps: {
    enabled: true,
    tag1: "速度更快",
    tag2: "成本更低",
    tag3: "剪辑流畅",
    symbol1: "↗",
    symbol2: "✓",
    symbol3: "✂",
    accentColor: "#14E6A1",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    animationSeconds: 0.9,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示标签组", default: true },
    tag1: { type: "text", label: "标签一" },
    tag2: { type: "text", label: "标签二" },
    tag3: { type: "text", label: "标签三" },
    symbol1: { type: "text", label: "图标一" },
    symbol2: { type: "text", label: "图标二" },
    symbol3: { type: "text", label: "图标三" },
    accentColor: { type: "color", label: "强调色", default: "#14E6A1" },
    panelColor: { type: "color", label: "底板颜色", default: "#111318" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    animationSeconds: {
      type: "number",
      label: "入场时长(秒)",
      default: 0.9,
      min: 0.4,
      max: 2,
      step: 0.1,
    },
  },
};
