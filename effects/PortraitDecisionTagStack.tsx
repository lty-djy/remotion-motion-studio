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
  tagCount?: number;
  tag1?: string;
  tag2?: string;
  tag3?: string;
  tag4?: string;
  tag5?: string;
  tag6?: string;
  tag7?: string;
  tag8?: string;
  symbol1?: string;
  symbol2?: string;
  symbol3?: string;
  symbol4?: string;
  symbol5?: string;
  symbol6?: string;
  symbol7?: string;
  symbol8?: string;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  iconSize?: number;
  tagFontSize?: number;
  tagEnterIntervalSeconds?: number;
  animationSeconds?: number;
};

export const PortraitDecisionTagStack: React.FC<Props> = ({
  backgroundOpacity = 0,
  enabled = true,
  tagCount = 3,
  tag1 = "速度更快",
  tag2 = "成本更低",
  tag3 = "剪辑流畅",
  tag4 = "更易复用",
  tag5 = "表达清晰",
  tag6 = "节奏稳定",
  tag7 = "方便调整",
  tag8 = "结果可控",
  symbol1 = "↗",
  symbol2 = "✓",
  symbol3 = "✂",
  symbol4 = "+",
  symbol5 = "✓",
  symbol6 = "↗",
  symbol7 = "＋",
  symbol8 = "•",
  accentColor = "#14E6A1",
  panelColor = "#111318",
  textColor = "#FFFFFF",
  iconSize = 32,
  tagFontSize = 25,
  tagEnterIntervalSeconds = 0.15,
  animationSeconds = 0.9,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(12, Math.round(animationSeconds * fps));
  const normalizedCount = Math.min(8, Math.max(1, Math.round(Number(tagCount) || 3)));
  const staggerFrames = Math.max(0, Math.round((Number(tagEnterIntervalSeconds) || 0) * fps));
  const safeIconSize = Math.min(64, Math.max(18, Number(iconSize) || 32));
  const safeTagFontSize = Math.min(72, Math.max(10, Number(tagFontSize) || 25));
  const tags = [
    { text: tag1, symbol: symbol1 }, { text: tag2, symbol: symbol2 },
    { text: tag3, symbol: symbol3 }, { text: tag4, symbol: symbol4 },
    { text: tag5, symbol: symbol5 }, { text: tag6, symbol: symbol6 },
    { text: tag7, symbol: symbol7 }, { text: tag8, symbol: symbol8 },
  ].slice(0, normalizedCount);

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

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
        height: tags.length * 68 + Math.max(0, tags.length - 1) * 12,
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
              border: bgFactor > 0 ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid transparent",
              borderRadius: 15,
              color: textColor,
              backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(86 * bgFactor)}%, transparent)`,
              boxShadow: bgFactor > 0 ? "0 13px 25px rgba(0, 0, 0, 0.34)" : "none",
              backdropFilter: bgFactor > 0 ? "blur(14px)" : undefined,
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
                width: safeIconSize,
                height: safeIconSize,
                placeItems: "center",
                border: `2px solid ${accentColor}`,
                borderRadius: "50%",
                color: accentColor,
                backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: Math.max(10, Math.round(safeIconSize * 0.56)),
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
                fontSize: safeTagFontSize,
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
  name: "优缺点标签组",
  description: "可按需增减的优缺点标签组，玻璃卡严格同宽对齐并按设定间隔依次滑入。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "TAG",
  placement: "right",
  component: PortraitDecisionTagStack as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 330, height: 628 },
  defaultPosition: { x: 675, y: 371, scale: 1 },
  defaultProps: {
    enabled: true,
    tagCount: 3,
    tag1: "速度更快",
    tag2: "成本更低",
    tag3: "剪辑流畅",
    tag4: "更易复用",
    tag5: "表达清晰",
    tag6: "节奏稳定",
    tag7: "方便调整",
    tag8: "结果可控",
    symbol1: "↗",
    symbol2: "✓",
    symbol3: "✂",
    symbol4: "+",
    symbol5: "✓",
    symbol6: "↗",
    symbol7: "＋",
    symbol8: "•",
    accentColor: "#14E6A1",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    iconSize: 32,
    tagFontSize: 25,
    tagEnterIntervalSeconds: 0.15,
    animationSeconds: 0.9,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示标签组", default: true },
    tagCount: { type: "number", label: "标签数量", default: 3, min: 1, max: 8, step: 1 },
    tag1: { type: "text", label: "标签一" },
    tag2: { type: "text", label: "标签二" },
    tag3: { type: "text", label: "标签三" },
    tag4: { type: "text", label: "标签四" },
    tag5: { type: "text", label: "标签五" },
    tag6: { type: "text", label: "标签六" },
    tag7: { type: "text", label: "标签七" },
    tag8: { type: "text", label: "标签八" },
    symbol1: { type: "text", label: "图标一" },
    symbol2: { type: "text", label: "图标二" },
    symbol3: { type: "text", label: "图标三" },
    symbol4: { type: "text", label: "图标四" },
    symbol5: { type: "text", label: "图标五" },
    symbol6: { type: "text", label: "图标六" },
    symbol7: { type: "text", label: "图标七" },
    symbol8: { type: "text", label: "图标八" },
    accentColor: { type: "color", label: "强调色", default: "#14E6A1" },
    panelColor: { type: "color", label: "底板颜色", default: "#111318" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    iconSize: { type: "number", label: "图标大小(px)", default: 32, min: 18, max: 64, step: 1 },
    tagFontSize: { type: "number", label: "标签字号(px)", default: 25, min: 10, max: 72, step: 1 },
    tagEnterIntervalSeconds: { type: "number", label: "下一标签入场间隔(秒)", default: 0.15, min: 0, max: 8, step: 0.05 },
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
