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
  item1?: string;
  item2?: string;
  item3?: string;
  item4?: string;
  detail1?: string;
  detail2?: string;
  detail3?: string;
  detail4?: string;
  badge1?: string;
  badge2?: string;
  badge3?: string;
  badge4?: string;
  itemFontSize?: number;
  detailFontSize?: number;
  badgeFontSize?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitStaggeredToolList: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  item1 = "我自己做的 Skill",
  item2 = "GSAP Skills",
  item3 = "Ponytail",
  item4 = "Playwright MCP",
  detail1 = "UI 审美 · 全流程用它",
  detail2 = "高级动效",
  detail3 = "工程克制",
  detail4 = "自动测试",
  badge1 = "C 位",
  badge2 = "★ 26K",
  badge3 = "★ 80K",
  badge4 = "★ 35K",
  itemFontSize = 32,
  detailFontSize = 18,
  badgeFontSize = 16,
  color1 = "#19DCE8",
  color2 = "#20E878",
  color3 = "#9B6CFF",
  color4 = "#397BFF",
  panelColor = "#071017",
  textColor = "#F5F7FA",
  animationSeconds = 2.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const enterFrames = Math.max(54, Math.round(animationSeconds * fps));
  const rowStagger = Math.max(12, Math.round(enterFrames * 0.24));
  const rowReveal = Math.max(12, Math.round(enterFrames * 0.22));
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const rows = [
    { item: item1, detail: detail1, badge: badge1, color: color1 },
    { item: item2, detail: detail2, badge: badge2, color: color2 },
    { item: item3, detail: detail3, badge: badge3, color: color3 },
    { item: item4, detail: detail4, badge: badge4, color: color4 },
  ];

  return (
    <Interactive.Div
      name="竖屏四项工具错峰列表"
      data-effect="PortraitStaggeredToolList"
      style={{
        position: "relative",
        width: 900,
        height: 390,
        boxSizing: "border-box",
        overflow: "hidden",
        border:
          bgFactor > 0
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid transparent",
        borderRadius: 28,
        color: textColor,
        backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(
          78 * bgFactor,
        )}%, transparent)`,
        boxShadow:
          bgFactor > 0 ? "0 26px 70px rgba(0, 0, 0, 0.42)" : "none",
        backdropFilter: bgFactor > 0 ? "blur(18px)" : undefined,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
      }}
    >
      <Interactive.Div
        name="四项工具列表"
        style={{
          position: "absolute",
          right: 20,
          bottom: 18,
          left: 20,
          display: "flex",
          flexDirection: "column",
          gap: 15,
        }}
      >
        {rows.map((row, index) => {
          const startFrame = Math.round(enterFrames * 0.14) + index * rowStagger;
          const endFrame = startFrame + rowReveal;
          return (
            <Interactive.Div
              name={`工具条 ${index + 1}`}
              data-tool-row={index + 1}
              key={`${index}-${row.item}`}
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "12px minmax(0, 1fr) auto",
                alignItems: "center",
                columnGap: 18,
                width: "100%",
                height: 76,
                padding: "0 18px 0 0",
                boxSizing: "border-box",
                borderRadius: 12,
                backgroundColor:
                  bgFactor > 0
                    ? `color-mix(in srgb, ${panelColor} ${Math.round(
                        46 * bgFactor,
                      )}%, transparent)`
                    : "transparent",
                opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: interpolate(
                  frame,
                  [startFrame, endFrame],
                  ["-54px 0px", "0px 0px"],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
                filter: `blur(${interpolate(
                  frame,
                  [startFrame, endFrame],
                  [8, 0],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )}px)`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 58,
                  justifySelf: "center",
                  borderRadius: 999,
                  backgroundColor: row.color,
                  boxShadow: `0 0 17px color-mix(in srgb, ${row.color} 72%, transparent)`,
                }}
              />
              <span style={{ minWidth: 0 }}>
                <strong
                  style={{
                    display: "block",
                    overflow: "hidden",
                    color: textColor,
                    fontSize: itemFontSize,
                    fontWeight: 900,
                    lineHeight: 1.08,
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.item}
                </strong>
                <small
                  style={{
                    display: "block",
                    marginTop: 6,
                    overflow: "hidden",
                    color: "rgba(245, 247, 250, 0.48)",
                    fontSize: detailFontSize,
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: 0.4,
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.detail}
                </small>
              </span>
              <span
                style={{
                  minWidth: 84,
                  padding: "8px 14px",
                  border: `1px solid color-mix(in srgb, ${row.color} 45%, transparent)`,
                  borderRadius: 999,
                  color: row.color,
                  backgroundColor: `color-mix(in srgb, ${row.color} 10%, transparent)`,
                  boxShadow: `inset 0 0 18px color-mix(in srgb, ${row.color} 9%, transparent)`,
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  fontSize: badgeFontSize,
                  fontWeight: 900,
                  lineHeight: 1,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {row.badge}
              </span>
            </Interactive.Div>
          );
        })}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitStaggeredToolListEffectDef: EffectDef = {
  id: "PortraitStaggeredToolList",
  name: "多工具错峰列表",
  description:
    "四项工具以彩色竖线、说明与徽标依次错峰滑入；标题部分已拆分为独立的 PortraitToolListTitle 组件。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "4X",
  placement: "top",
  component:
    PortraitStaggeredToolList as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 900, height: 390 },
  defaultPosition: { x: 90, y: 470, scale: 1 },
  defaultProps: {
    enabled: true,
    item1: "我自己做的 Skill",
    item2: "GSAP Skills",
    item3: "Ponytail",
    item4: "Playwright MCP",
    detail1: "UI 审美 · 全流程用它",
    detail2: "高级动效",
    detail3: "工程克制",
    detail4: "自动测试",
    badge1: "C 位",
    badge2: "★ 26K",
    badge3: "★ 80K",
    badge4: "★ 35K",
    itemFontSize: 32,
    detailFontSize: 18,
    badgeFontSize: 16,
    color1: "#19DCE8",
    color2: "#20E878",
    color3: "#9B6CFF",
    color4: "#397BFF",
    panelColor: "#071017",
    textColor: "#F5F7FA",
    animationSeconds: 2.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示工具列表", default: true },
    item1: { type: "text", label: "工具一" },
    item2: { type: "text", label: "工具二" },
    item3: { type: "text", label: "工具三" },
    item4: { type: "text", label: "工具四" },
    detail1: { type: "text", label: "工具一说明" },
    detail2: { type: "text", label: "工具二说明" },
    detail3: { type: "text", label: "工具三说明" },
    detail4: { type: "text", label: "工具四说明" },
    badge1: { type: "text", label: "工具一徽标" },
    badge2: { type: "text", label: "工具二徽标" },
    badge3: { type: "text", label: "工具三徽标" },
    badge4: { type: "text", label: "工具四徽标" },
    itemFontSize: { type: "number", label: "工具字号(px)", default: 32, min: 14, max: 64, step: 1 },
    detailFontSize: { type: "number", label: "工具说明字号(px)", default: 18, min: 10, max: 40, step: 1 },
    badgeFontSize: { type: "number", label: "工具徽标字号(px)", default: 16, min: 10, max: 36, step: 1 },
    color1: { type: "color", label: "工具一颜色", default: "#19DCE8" },
    color2: { type: "color", label: "工具二颜色", default: "#20E878" },
    color3: { type: "color", label: "工具三颜色", default: "#9B6CFF" },
    color4: { type: "color", label: "工具四颜色", default: "#397BFF" },
    panelColor: { type: "color", label: "底板颜色", default: "#071017" },
    textColor: { type: "color", label: "文字颜色", default: "#F5F7FA" },
    animationSeconds: {
      type: "number",
      label: "四项入场总时长(秒)",
      default: 2.8,
      min: 1.8,
      max: 5,
      step: 0.1,
    },
  },
};
