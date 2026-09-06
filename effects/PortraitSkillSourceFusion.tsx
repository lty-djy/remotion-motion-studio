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
  sequenceText?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  sourceCount?: number;
  source1?: string;
  source1Detail?: string;
  source2?: string;
  source2Detail?: string;
  source3?: string;
  source3Detail?: string;
  source4?: string;
  source4Detail?: string;
  source5?: string;
  source5Detail?: string;
  source6?: string;
  source6Detail?: string;
  source7?: string;
  source7Detail?: string;
  source8?: string;
  source8Detail?: string;
  sequenceFontSize?: number;
  titleFontSize?: number;
  subtitleFontSize?: number;
  badgeFontSize?: number;
  sourceFontSize?: number;
  sourceDetailFontSize?: number;
  sourceDetailOffsetX?: number;
  accentColor?: string;
  source1Color?: string;
  source2Color?: string;
  source3Color?: string;
  source4Color?: string;
  source5Color?: string;
  source6Color?: string;
  source7Color?: string;
  source8Color?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

const reveal = (frame: number, start: number, duration = 18) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const PortraitSkillSourceFusion: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  sequenceText = "01",
  title = "我自己做的 Skill",
  subtitle = "UI 审美 · 全流程规范",
  badge = "C 位",
  sourceCount = 3,
  source1 = "TASTE",
  source1Detail = "审美判断 · 来自 Taste",
  source2 = "IMPECCABLE",
  source2Detail = "反廉价规则 · 来自 Impeccable",
  source3 = "自己的经验",
  source3Detail = "日常实战 · 持续积累",
  source4 = "补充来源",
  source4Detail = "补充说明 · 按需编辑",
  source5 = "补充来源 5",
  source5Detail = "补充说明 · 按需编辑",
  source6 = "补充来源 6",
  source6Detail = "补充说明 · 按需编辑",
  source7 = "补充来源 7",
  source7Detail = "补充说明 · 按需编辑",
  source8 = "补充来源 8",
  source8Detail = "补充说明 · 按需编辑",
  sequenceFontSize = 24,
  titleFontSize = 34,
  subtitleFontSize = 18,
  badgeFontSize = 14,
  sourceFontSize = 19,
  sourceDetailFontSize = 13,
  sourceDetailOffsetX = 0,
  accentColor = "#17D9E8",
  source1Color = "#A36CFF",
  source2Color = "#5986FF",
  source3Color = "#17D9E8",
  source4Color = "#14E6A1",
  source5Color = "#F2D51B",
  source6Color = "#FF9F43",
  source7Color = "#FF6B8A",
  source8Color = "#B7C0D8",
  panelColor = "#071017",
  textColor = "#F5F7FA",
  animationSeconds = 8.7,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const totalFrames = Math.max(150, Math.round(animationSeconds * fps));
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const header = reveal(frame, 0, Math.round(fps * 0.55));
  const normalizedSourceCount = Math.min(8, Math.max(1, Math.round(sourceCount)));
  const rows = [
    { name: source1, detail: source1Detail, color: source1Color },
    { name: source2, detail: source2Detail, color: source2Color },
    { name: source3, detail: source3Detail, color: source3Color },
    { name: source4, detail: source4Detail, color: source4Color },
    { name: source5, detail: source5Detail, color: source5Color },
    { name: source6, detail: source6Detail, color: source6Color },
    { name: source7, detail: source7Detail, color: source7Color },
    { name: source8, detail: source8Detail, color: source8Color },
  ].slice(0, normalizedSourceCount);
  const panelHeight = Math.max(560, 194 + normalizedSourceCount * 94);

  return (
    <Interactive.Div
      name="Skill 来源合成"
      data-effect="PortraitSkillSourceFusion"
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
        opacity: header,
        translate: `${interpolate(header, [0, 1], [-24, 0])}px 0px`,
      }}
    >
      <Interactive.Div
        name="Skill 编号"
        style={{
          position: "absolute",
          top: 44,
          left: 54,
          display: "grid",
          width: 82,
          height: 82,
          placeItems: "center",
          border: `2px solid color-mix(in srgb, ${accentColor} 76%, transparent)`,
          borderRadius: "50%",
          color: accentColor,
          backgroundColor: `color-mix(in srgb, ${accentColor} 9%, rgba(4, 16, 23, 0.9))`,
          boxShadow: `0 0 28px color-mix(in srgb, ${accentColor} 27%, transparent)`,
          fontFamily: '"SFMono-Regular", Consolas, monospace',
          fontSize: sequenceFontSize,
          fontWeight: 850,
        }}
      >
        {sequenceText}
      </Interactive.Div>

      <Interactive.Div name="Skill 主标题" style={{ position: "absolute", top: 42, left: 168, maxWidth: 540, fontSize: titleFontSize, fontWeight: 900, lineHeight: 1.14, letterSpacing: -0.7 }}>
        {title}
      </Interactive.Div>
      <Interactive.Div name="Skill 副标题" style={{ position: "absolute", top: 94, left: 168, color: accentColor, fontSize: subtitleFontSize, fontWeight: 800 }}>
        {subtitle}
      </Interactive.Div>
      <Interactive.Div
        name="Skill 徽标"
        style={{
          position: "absolute",
          top: 59,
          right: 58,
          display: "grid",
          minWidth: 68,
          minHeight: 34,
          height: Math.max(34, Math.round(badgeFontSize * 1.6)),
          padding: `0 ${Math.max(13, Math.round(badgeFontSize * 0.45))}px`,
          placeItems: "center",
          border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
          borderRadius: 999,
          color: accentColor,
          backgroundColor: `color-mix(in srgb, ${accentColor} 11%, rgba(4, 16, 23, 0.84))`,
          fontSize: badgeFontSize,
          fontWeight: 850,
        }}
      >
        {badge}
      </Interactive.Div>

      <div aria-hidden="true" style={{ position: "absolute", top: 148, left: 54, width: 720, height: 1, background: `linear-gradient(90deg, color-mix(in srgb, ${accentColor} 38%, transparent), transparent)` }} />

      {rows.map((row, index) => {
        const at = Math.round(totalFrames * (0.16 + index * (0.68 / Math.max(1, normalizedSourceCount - 1))));
        const progress = reveal(frame, at, Math.round(fps * 0.5));
        return (
          <Interactive.Div
            key={`${row.name}-${index}`}
            name={`来源 ${index + 1}`}
            style={{
              position: "absolute",
              top: 180 + index * 94,
              left: 54,
              display: "grid",
              gridTemplateColumns: "8px 190px 1fr",
              columnGap: 18,
              alignItems: "center",
              width: 710,
              minHeight: 68,
              opacity: progress,
              translate: `${interpolate(progress, [0, 1], [-20, 0])}px 0px`,
            }}
          >
            <span aria-hidden="true" style={{ width: 6, height: 52, borderRadius: 999, backgroundColor: row.color, boxShadow: `0 0 16px ${row.color}` }} />
            <span style={{ color: row.color, fontSize: sourceFontSize, fontWeight: 900, letterSpacing: 0.7 }}>{row.name}</span>
            <span
              style={{
                color: "rgba(245,247,250,0.58)",
                fontSize: sourceDetailFontSize,
                fontWeight: 650,
                translate: `${sourceDetailOffsetX}px 0px`,
              }}
            >
              {row.detail}
            </span>
          </Interactive.Div>
        );
      })}
    </Interactive.Div>
  );
};

export const PortraitSkillSourceFusionEffectDef: EffectDef = {
  id: "PortraitSkillSourceFusion",
  name: "Skill 来源合成",
  description: "复刻参考视频 30.883–39.566 秒：在 Skill 身份标题下按需增减并依次展示经验来源。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "SRC",
  placement: "top",
  component: PortraitSkillSourceFusion as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 261,
  bounds: { x: 0, y: 0, width: 900, height: 946 },
  defaultPosition: { x: 90, y: 120, scale: 1 },
  defaultProps: {
    enabled: true,
    sequenceText: "01",
    title: "我自己做的 Skill",
    subtitle: "UI 审美 · 全流程规范",
    badge: "C 位",
    sourceCount: 3,
    source1: "TASTE",
    source1Detail: "审美判断 · 来自 Taste",
    source2: "IMPECCABLE",
    source2Detail: "反廉价规则 · 来自 Impeccable",
    source3: "自己的经验",
    source3Detail: "日常实战 · 持续积累",
    source4: "补充来源",
    source4Detail: "补充说明 · 按需编辑",
    source5: "补充来源 5",
    source5Detail: "补充说明 · 按需编辑",
    source6: "补充来源 6",
    source6Detail: "补充说明 · 按需编辑",
    source7: "补充来源 7",
    source7Detail: "补充说明 · 按需编辑",
    source8: "补充来源 8",
    source8Detail: "补充说明 · 按需编辑",
    sequenceFontSize: 24,
    titleFontSize: 34,
    subtitleFontSize: 18,
    badgeFontSize: 14,
    sourceFontSize: 19,
    sourceDetailFontSize: 13,
    sourceDetailOffsetX: 0,
    accentColor: "#17D9E8",
    source1Color: "#A36CFF",
    source2Color: "#5986FF",
    source3Color: "#17D9E8",
    source4Color: "#14E6A1",
    source5Color: "#F2D51B",
    source6Color: "#FF9F43",
    source7Color: "#FF6B8A",
    source8Color: "#B7C0D8",
    panelColor: "#071017",
    textColor: "#F5F7FA",
    animationSeconds: 8.7,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示 Skill 来源合成", default: true },
    sequenceText: { type: "text", label: "Skill 编号" },
    title: { type: "text", label: "Skill 主标题" },
    subtitle: { type: "text", label: "Skill 副标题" },
    badge: { type: "text", label: "Skill 徽标" },
    sourceCount: { type: "number", label: "来源数量", default: 3, min: 1, max: 8, step: 1 },
    source1: { type: "text", label: "来源一" },
    source1Detail: { type: "text", label: "来源一说明" },
    source2: { type: "text", label: "来源二" },
    source2Detail: { type: "text", label: "来源二说明" },
    source3: { type: "text", label: "来源三" },
    source3Detail: { type: "text", label: "来源三说明" },
    source4: { type: "text", label: "来源四" },
    source4Detail: { type: "text", label: "来源四说明" },
    source5: { type: "text", label: "来源五" },
    source5Detail: { type: "text", label: "来源五说明" },
    source6: { type: "text", label: "来源六" },
    source6Detail: { type: "text", label: "来源六说明" },
    source7: { type: "text", label: "来源七" },
    source7Detail: { type: "text", label: "来源七说明" },
    source8: { type: "text", label: "来源八" },
    source8Detail: { type: "text", label: "来源八说明" },
    sequenceFontSize: { type: "number", label: "Skill 编号字号(px)", default: 24, min: 10, max: 96, step: 1 },
    titleFontSize: { type: "number", label: "Skill 主标题字号(px)", default: 34, min: 16, max: 96, step: 1 },
    subtitleFontSize: { type: "number", label: "Skill 副标题字号(px)", default: 18, min: 10, max: 96, step: 1 },
    badgeFontSize: { type: "number", label: "Skill 徽标字号(px)", default: 14, min: 8, max: 96, step: 1 },
    sourceFontSize: { type: "number", label: "来源名称字号(px)", default: 19, min: 10, max: 96, step: 1 },
    sourceDetailFontSize: { type: "number", label: "来源说明字号(px)", default: 13, min: 8, max: 96, step: 1 },
    sourceDetailOffsetX: { type: "number", label: "来源说明水平位置(px)", default: 0, min: -160, max: 300, step: 1 },
    accentColor: { type: "color", label: "身份卡强调色", default: "#17D9E8" },
    source1Color: { type: "color", label: "来源一颜色", default: "#A36CFF" },
    source2Color: { type: "color", label: "来源二颜色", default: "#5986FF" },
    source3Color: { type: "color", label: "来源三颜色", default: "#17D9E8" },
    source4Color: { type: "color", label: "来源四颜色", default: "#14E6A1" },
    source5Color: { type: "color", label: "来源五颜色", default: "#F2D51B" },
    source6Color: { type: "color", label: "来源六颜色", default: "#FF9F43" },
    source7Color: { type: "color", label: "来源七颜色", default: "#FF6B8A" },
    source8Color: { type: "color", label: "来源八颜色", default: "#B7C0D8" },
    panelColor: { type: "color", label: "底板颜色", default: "#071017" },
    textColor: { type: "color", label: "文字颜色", default: "#F5F7FA" },
    animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 8.7, min: 4, max: 20, step: 0.1 },
  },
};
