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
  stepCount?: number;
  item1?: string;
  item2?: string;
  item3?: string;
  item4?: string;
  item5?: string;
  item6?: string;
  item7?: string;
  item8?: string;
  detail1?: string;
  detail2?: string;
  detail3?: string;
  detail4?: string;
  detail5?: string;
  detail6?: string;
  detail7?: string;
  detail8?: string;
  itemFontSize?: number;
  detailFontSize?: number;
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
  stepCount = 4,
  item1 = "我自己做的 Skill",
  item2 = "GSAP Skills",
  item3 = "Ponytail",
  item4 = "Playwright MCP",
  item5 = "复盘使用效果",
  item6 = "沉淀可复用流程",
  item7 = "持续优化细节",
  item8 = "分享最终成果",
  detail1 = "UI 审美 · 全流程用它",
  detail2 = "高级动效",
  detail3 = "工程克制",
  detail4 = "自动测试",
  detail5 = "记录结果",
  detail6 = "形成方法",
  detail7 = "减少返工",
  detail8 = "交付复用",
  itemFontSize = 32,
  detailFontSize = 18,
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
  const normalizedStepCount = Math.min(8, Math.max(1, Math.round(Number(stepCount) || 4)));
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const rows = [
    { item: item1, detail: detail1, color: color1 },
    { item: item2, detail: detail2, color: color2 },
    { item: item3, detail: detail3, color: color3 },
    { item: item4, detail: detail4, color: color4 },
    { item: item5, detail: detail5, color: color1 },
    { item: item6, detail: detail6, color: color2 },
    { item: item7, detail: detail7, color: color3 },
    { item: item8, detail: detail8, color: color4 },
  ].slice(0, normalizedStepCount);
  const listHeight = rows.length * 76 + Math.max(0, rows.length - 1) * 15 + 36;

  return (
    <Interactive.Div
      name="竖屏四项工具错峰列表"
      data-effect="PortraitStaggeredToolList"
      style={{
        position: "relative",
        width: 900,
        height: listHeight,
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
        name="工具列表"
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
                gridTemplateColumns: "12px minmax(0, 1fr)",
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
    "工具以彩色竖线与说明依次错峰滑入，步骤数量 1–8 可调；右侧徽标已拆分为独立的 PortraitToolBadgeList 组件，标题为独立的 PortraitToolListTitle 组件。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "4X",
  placement: "top",
  component:
    PortraitStaggeredToolList as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 900, height: 780 },
  defaultPosition: { x: 90, y: 470, scale: 1 },
  defaultProps: {
    enabled: true,
    stepCount: 4,
    item1: "我自己做的 Skill",
    item2: "GSAP Skills",
    item3: "Ponytail",
    item4: "Playwright MCP",
    item5: "复盘使用效果",
    item6: "沉淀可复用流程",
    item7: "持续优化细节",
    item8: "分享最终成果",
    detail1: "UI 审美 · 全流程用它",
    detail2: "高级动效",
    detail3: "工程克制",
    detail4: "自动测试",
    detail5: "记录结果",
    detail6: "形成方法",
    detail7: "减少返工",
    detail8: "交付复用",
    itemFontSize: 32,
    detailFontSize: 18,
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
    stepCount: { type: "number", label: "步骤数量", default: 4, min: 1, max: 8, step: 1 },
    item1: { type: "text", label: "工具一" },
    item2: { type: "text", label: "工具二" },
    item3: { type: "text", label: "工具三" },
    item4: { type: "text", label: "工具四" },
    item5: { type: "text", label: "工具五" },
    item6: { type: "text", label: "工具六" },
    item7: { type: "text", label: "工具七" },
    item8: { type: "text", label: "工具八" },
    detail1: { type: "text", label: "工具一说明" },
    detail2: { type: "text", label: "工具二说明" },
    detail3: { type: "text", label: "工具三说明" },
    detail4: { type: "text", label: "工具四说明" },
    detail5: { type: "text", label: "工具五说明" },
    detail6: { type: "text", label: "工具六说明" },
    detail7: { type: "text", label: "工具七说明" },
    detail8: { type: "text", label: "工具八说明" },
    itemFontSize: { type: "number", label: "工具字号(px)", default: 32, min: 14, max: 64, step: 1 },
    detailFontSize: { type: "number", label: "工具说明字号(px)", default: 18, min: 10, max: 40, step: 1 },
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
