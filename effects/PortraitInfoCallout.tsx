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
  detail?: string;
  note?: string;
  iconText?: string;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitInfoCallout: React.FC<Props> = ({
  backgroundOpacity = 0,
  enabled = true,
  eyebrow = "先准备好",
  title = "两类核心素材",
  detail = "高清图片",
  note = "真人质感",
  iconText = "▣",
  accentColor = "#168CFF",
  panelColor = "#111318",
  textColor = "#FFFFFF",
  animationSeconds = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(10, Math.round(animationSeconds * fps));

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div
      name="竖屏图标信息卡"
      data-effect="PortraitInfoCallout"
      style={{
        position: "relative",
        width: 430,
        height: 230,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        opacity: interpolate(frame, [0, enterFrames], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >

      <Interactive.Div
        name="信息卡引导词"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          maxWidth: 390,
          overflow: "hidden",
          color: accentColor,
          fontSize: 21,
          fontWeight: 850,
          lineHeight: 1.2,
          letterSpacing: 0.5,
          textAlign: "left",
          textShadow: "0 4px 12px rgba(0, 0, 0, 0.75)",
          opacity: interpolate(frame, [1, enterFrames * 0.68], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [1, enterFrames * 0.68],
            ["28px 0px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {eyebrow}
      </Interactive.Div>

      <Interactive.Div
        name="信息卡主标题"
        style={{
          position: "absolute",
          top: 30,
          left: 0,
          maxWidth: 420,
          overflow: "hidden",
          color: textColor,
          fontSize: 38,
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: -1.2,
          whiteSpace: "nowrap",
          textShadow: "0 5px 16px rgba(0, 0, 0, 0.9)",
          opacity: interpolate(frame, [enterFrames * 0.14, enterFrames * 0.78], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [enterFrames * 0.14, enterFrames * 0.78],
            ["36px 0px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {title}
      </Interactive.Div>

      <Interactive.Div
        name="玻璃信息底板"
        style={{
          position: "absolute",
          top: 86,
          left: 0,
          display: "flex",
          alignItems: "center",
          gap: 18,
          width: 376,
          height: 116,
          // 左内边距为 0：让图标左缘与上方引导词/主标题左缘对齐。
          padding: "0 22px 0 0",
          boxSizing: "border-box",
          overflow: "hidden",
          border: bgFactor > 0 ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid transparent",
          borderRadius: 18,
          backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(84 * bgFactor)}%, transparent)`,
          boxShadow: bgFactor > 0 ? "0 16px 30px rgba(0, 0, 0, 0.34)" : "none",
          backdropFilter: bgFactor > 0 ? "blur(14px)" : undefined,
          opacity: interpolate(frame, [enterFrames * 0.34, enterFrames], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [enterFrames * 0.34, enterFrames],
            ["42px 0px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          scale: interpolate(
            frame,
            [enterFrames * 0.34, enterFrames * 0.78, enterFrames],
            [0.86, 1.025, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          transformOrigin: "0% 50%",
        }}
      >
        <Interactive.Div
          name="信息图标"
          style={{
            display: "grid",
            flex: "0 0 auto",
            width: 52,
            height: 52,
            placeItems: "center",
            border: `2px solid ${accentColor}`,
            borderRadius: 12,
            color: accentColor,
            backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
            boxShadow: `0 0 18px color-mix(in srgb, ${accentColor} 30%, transparent)`,
            fontFamily: '"SFMono-Regular", Consolas, monospace',
            fontSize: 27,
            fontWeight: 900,
            lineHeight: 1,
            scale: interpolate(
              frame,
              [enterFrames * 0.48, enterFrames * 0.82, enterFrames],
              [0.62, 1.08, 1],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          {iconText}
        </Interactive.Div>

        <Interactive.Div
          name="信息内容"
          style={{
            minWidth: 0,
            flex: 1,
            opacity: interpolate(frame, [enterFrames * 0.58, enterFrames], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [enterFrames * 0.58, enterFrames],
              ["18px 0px", "0px 0px"],
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
              overflow: "hidden",
              color: textColor,
              fontSize: 28,
              fontWeight: 850,
              lineHeight: 1.12,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {detail}
          </div>
          <div
            style={{
              marginTop: 7,
              overflow: "hidden",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 17,
              fontWeight: 650,
              lineHeight: 1.2,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {note}
          </div>
        </Interactive.Div>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitInfoCalloutEffectDef: EffectDef = {
  id: "PortraitInfoCallout",
  name: "图标信息卡",
  description: "参考竖屏口播视频右上信息层：引导词和标题先滑入，图标玻璃卡随后弹出。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "INFO",
  placement: "right",
  component: PortraitInfoCallout as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 430, height: 230 },
  defaultPosition: { x: 585, y: 334, scale: 1 },
  defaultProps: {
    enabled: true,
    eyebrow: "先准备好",
    title: "两类核心素材",
    detail: "高清图片",
    note: "真人质感",
    iconText: "▣",
    accentColor: "#168CFF",
    panelColor: "#111318",
    textColor: "#FFFFFF",
    animationSeconds: 0.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示信息卡", default: true },
    eyebrow: { type: "text", label: "引导词" },
    title: { type: "text", label: "主标题" },
    detail: { type: "text", label: "核心内容" },
    note: { type: "text", label: "补充说明" },
    iconText: { type: "text", label: "图标文字" },
    accentColor: { type: "color", label: "强调色", default: "#168CFF" },
    panelColor: { type: "color", label: "底板颜色", default: "#111318" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
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
