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
  stepCount?: number;
  badge1?: string;
  badge2?: string;
  badge3?: string;
  badge4?: string;
  badge5?: string;
  badge6?: string;
  badge7?: string;
  badge8?: string;
  badgeFontSize?: number;
  badgeGap?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  badgesAlign?: "left" | "right";
  animationSeconds?: number;
};

export const PortraitToolBadgeList: React.FC<Props> = ({
  enabled = true,
  stepCount = 4,
  badge1 = "C 位",
  badge2 = "★ 26K",
  badge3 = "★ 80K",
  badge4 = "★ 35K",
  badge5 = "STEP 5",
  badge6 = "STEP 6",
  badge7 = "STEP 7",
  badge8 = "STEP 8",
  badgeFontSize = 16,
  badgeGap = 15,
  color1 = "#19DCE8",
  color2 = "#20E878",
  color3 = "#9B6CFF",
  color4 = "#397BFF",
  badgesAlign = "right",
  animationSeconds = 2.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const enterFrames = Math.max(54, Math.round(animationSeconds * fps));
  const rowStagger = Math.max(12, Math.round(enterFrames * 0.24));
  const rowReveal = Math.max(12, Math.round(enterFrames * 0.22));
  const normalizedStepCount = Math.min(8, Math.max(1, Math.round(Number(stepCount) || 4)));
  const safeBadgeFontSize = Math.min(36, Math.max(10, Number(badgeFontSize) || 16));
  const safeBadgeGap = Math.min(80, Math.max(-60, Number(badgeGap) || 0));
  const badgeColors = [color1, color2, color3, color4];
  const badges = [
    badge1,
    badge2,
    badge3,
    badge4,
    badge5,
    badge6,
    badge7,
    badge8,
  ]
    .slice(0, normalizedStepCount)
    .map((label, index) => ({
      label,
      color: badgeColors[index % badgeColors.length],
    }));
  const listHeight = badges.length * 76 + Math.max(0, badges.length - 1) * safeBadgeGap;

  return (
    <Interactive.Div
      name="工具徽标列表"
      data-effect="PortraitToolBadgeList"
      style={{
        position: "relative",
        width: 180,
        height: listHeight,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
      }}
    >
      <Interactive.Div
        name="徽标清单"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: badgesAlign === "left" ? "flex-start" : "flex-end",
          gap: 0,
        }}
      >
        {badges.map((badge, index) => {
          const startFrame = Math.round(enterFrames * 0.14) + index * rowStagger;
          const endFrame = startFrame + rowReveal;
          return (
            <Interactive.Div
              name={`徽标 ${index + 1}`}
              data-tool-badge={index + 1}
              key={`${index}-${badge.label}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 76,
                marginTop: index === 0 ? 0 : safeBadgeGap,
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
                  minWidth: 84,
                  padding: "8px 14px",
                  border: `1px solid color-mix(in srgb, ${badge.color} 45%, transparent)`,
                  borderRadius: 999,
                  color: badge.color,
                  backgroundColor: `color-mix(in srgb, ${badge.color} 10%, transparent)`,
                  boxShadow: `inset 0 0 18px color-mix(in srgb, ${badge.color} 9%, transparent)`,
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  fontSize: safeBadgeFontSize,
                  fontWeight: 900,
                  lineHeight: 1,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {badge.label}
              </span>
            </Interactive.Div>
          );
        })}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitToolBadgeListEffectDef: EffectDef = {
  id: "PortraitToolBadgeList",
  name: "工具徽标列表",
  description:
    "与多工具错峰列表逐行对齐的胶囊徽标（如 C 位、热度），数量随步骤数量 1–8 可调，按相同节奏错峰滑入；可独立拖动、编辑与删除。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "徽",
  placement: "top",
  component:
    PortraitToolBadgeList as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 180, height: 713 },
  defaultPosition: { x: 772, y: 488, scale: 1 },
  defaultProps: {
    enabled: true,
    stepCount: 4,
    badge1: "C 位",
    badge2: "★ 26K",
    badge3: "★ 80K",
    badge4: "★ 35K",
    badge5: "STEP 5",
    badge6: "STEP 6",
    badge7: "STEP 7",
    badge8: "STEP 8",
    badgeFontSize: 16,
    badgeGap: 15,
    color1: "#19DCE8",
    color2: "#20E878",
    color3: "#9B6CFF",
    color4: "#397BFF",
    badgesAlign: "right",
    animationSeconds: 2.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示徽标列表", default: true },
    stepCount: { type: "number", label: "步骤数量", default: 4, min: 1, max: 8, step: 1 },
    badge1: { type: "text", label: "徽标一" },
    badge2: { type: "text", label: "徽标二" },
    badge3: { type: "text", label: "徽标三" },
    badge4: { type: "text", label: "徽标四" },
    badge5: { type: "text", label: "徽标五" },
    badge6: { type: "text", label: "徽标六" },
    badge7: { type: "text", label: "徽标七" },
    badge8: { type: "text", label: "徽标八" },
    badgeFontSize: { type: "number", label: "徽标字号(px)", default: 16, min: 10, max: 36, step: 1 },
    badgeGap: { type: "number", label: "徽标上下间隙(px)", unit: "px", default: 15, min: -60, max: 80, step: 1 },
    color1: { type: "color", label: "徽标一颜色", default: "#19DCE8" },
    color2: { type: "color", label: "徽标二颜色", default: "#20E878" },
    color3: { type: "color", label: "徽标三颜色", default: "#9B6CFF" },
    color4: { type: "color", label: "徽标四颜色", default: "#397BFF" },
    badgesAlign: {
      type: "select",
      label: "徽标对齐",
      default: "right",
      options: [
        { value: "right", label: "靠右" },
        { value: "left", label: "靠左" },
      ],
    },
    animationSeconds: {
      type: "number",
      label: "入场总时长(秒)",
      default: 2.8,
      min: 1.8,
      max: 5,
      step: 0.1,
    },
  },
};
