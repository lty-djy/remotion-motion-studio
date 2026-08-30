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
  ruleCount?: number;
  rule1?: string;
  rule2?: string;
  rule3?: string;
  rule4?: string;
  rule5?: string;
  rule6?: string;
  rule7?: string;
  rule8?: string;
  ruleIntervalSeconds?: number;
  ruleFontSize?: number;
  ruleOffsetX?: number;
  accentColor?: string;
  bulletColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

export const PortraitDesignRuleChecklist: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  ruleCount = 4,
  rule1 = "排版网格",
  rule2 = "留白密度",
  rule3 = "配色层级",
  rule4 = "视觉一致性",
  rule5 = "字体规范",
  rule6 = "组件节奏",
  rule7 = "交互反馈",
  rule8 = "细节质检",
  ruleIntervalSeconds = 1.8,
  ruleFontSize = 20,
  ruleOffsetX = 0,
  accentColor = "#17D9E8",
  bulletColor = "#17D9E8",
  panelColor = "#071017",
  textColor = "#F5F7FA",
  animationSeconds = 8.1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const totalFrames = Math.max(150, Math.round(animationSeconds * fps));
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const normalizedRuleCount = Math.min(8, Math.max(1, Math.round(ruleCount)));
  const rules = [rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8].slice(
    0,
    normalizedRuleCount,
  );
  const panelHeight = Math.max(360, 68 + normalizedRuleCount * 74);
  const firstRuleFrame = totalFrames * 0.14;
  const ruleStaggerFrames = Math.max(0, ruleIntervalSeconds * fps);

  return (
    <Interactive.Div
      name="网页设计规则清单"
      data-effect="PortraitDesignRuleChecklist"
      style={{
        position: "relative",
        width: 900,
        height: panelHeight,
        overflow: "hidden",
        boxSizing: "border-box",
        border:
          bgFactor > 0
            ? `1px solid color-mix(in srgb, ${accentColor} 18%, transparent)`
            : "1px solid transparent",
        borderRadius: 28,
        color: textColor,
        backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(94 * bgFactor)}%, transparent)`,
        boxShadow:
          bgFactor > 0
            ? `0 24px 70px rgba(0, 0, 0, ${0.42 * bgFactor}), inset 0 0 50px color-mix(in srgb, ${accentColor} ${Math.round(5 * bgFactor)}%, transparent)`
            : "none",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
        opacity: interpolate(frame, [0, totalFrames * 0.08], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame,
          [0, totalFrames * 0.1],
          ["-24px 0px", "0px 0px"],
          {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        ),
      }}
    >
      {rules.map((rule, index) => {
        const start = firstRuleFrame + index * ruleStaggerFrames;
        return (
          <Interactive.Div
            key={`${index}-${rule}`}
            name={`设计规则 ${index + 1}`}
            style={{
              position: "absolute",
              top: 48 + index * 74,
              left: 58 + ruleOffsetX,
              display: "flex",
              alignItems: "center",
              minHeight: 52,
              color: textColor,
              fontSize: ruleFontSize,
              fontWeight: 760,
              letterSpacing: 0.3,
              opacity: interpolate(frame, [start, start + fps * 0.42], [0, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(
                frame,
                [start, start + fps * 0.42],
                ["-18px 0px", "0px 0px"],
                {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              ),
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                marginRight: 18,
                borderRadius: "50%",
                backgroundColor: bulletColor,
                boxShadow: `0 0 15px ${bulletColor}`,
              }}
            />
            {rule}
          </Interactive.Div>
        );
      })}
    </Interactive.Div>
  );
};

export const PortraitDesignRuleChecklistEffectDef: EffectDef = {
  id: "PortraitDesignRuleChecklist",
  name: "竖屏口播·网页设计规则清单",
  description: "复刻参考视频 39.566–47.683 秒：依次点亮排版、留白、配色和层级等网页设计规则。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "RULE",
  placement: "top",
  component: PortraitDesignRuleChecklist as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 244,
  bounds: { x: 0, y: 0, width: 900, height: 660 },
  defaultPosition: { x: 90, y: 120, scale: 1 },
  defaultProps: {
    enabled: true,
    ruleCount: 4,
    rule1: "排版网格",
    rule2: "留白密度",
    rule3: "配色层级",
    rule4: "视觉一致性",
    rule5: "字体规范",
    rule6: "组件节奏",
    rule7: "交互反馈",
    rule8: "细节质检",
    ruleIntervalSeconds: 1.8,
    ruleFontSize: 20,
    ruleOffsetX: 0,
    accentColor: "#17D9E8",
    bulletColor: "#17D9E8",
    panelColor: "#071017",
    textColor: "#F5F7FA",
    animationSeconds: 8.1,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示网页设计规则", default: true },
    ruleCount: { type: "number", label: "规则数量", default: 4, min: 1, max: 8, step: 1 },
    rule1: { type: "text", label: "规则一" },
    rule2: { type: "text", label: "规则二" },
    rule3: { type: "text", label: "规则三" },
    rule4: { type: "text", label: "规则四" },
    rule5: { type: "text", label: "规则五" },
    rule6: { type: "text", label: "规则六" },
    rule7: { type: "text", label: "规则七" },
    rule8: { type: "text", label: "规则八" },
    ruleIntervalSeconds: { type: "number", label: "下一条规则入场间隔(秒)", default: 1.8, min: 0, step: 0.1 },
    ruleFontSize: { type: "number", label: "规则字号(px)", default: 20, min: 10, max: 96, step: 1 },
    ruleOffsetX: { type: "number", label: "规则水平位置(px)", default: 0, min: -40, max: 420, step: 1 },
    accentColor: { type: "color", label: "卡片强调色", default: "#17D9E8" },
    bulletColor: { type: "color", label: "规则圆点颜色", default: "#17D9E8" },
    panelColor: { type: "color", label: "底板颜色", default: "#071017" },
    textColor: { type: "color", label: "文字颜色", default: "#F5F7FA" },
    animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 8.1, min: 4, max: 20, step: 0.1 },
  },
};
