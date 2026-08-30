import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  backgroundOpacity?: number;
  capabilityCount?: number;
  capability1Title?: string; capability1Detail?: string;
  capability2Title?: string; capability2Detail?: string;
  capability3Title?: string; capability3Detail?: string;
  capability4Title?: string; capability4Detail?: string;
  capability5Title?: string; capability5Detail?: string;
  capability6Title?: string; capability6Detail?: string;
  capability7Title?: string; capability7Detail?: string;
  capability8Title?: string; capability8Detail?: string;
  controlLead?: string;
  controlEmphasis?: string;
  firstSkillTitle?: string;
  firstSkillDetail?: string;
  secondSkillTitle?: string;
  secondSkillDetail?: string;
  conclusionLead?: string;
  conclusionEmphasis?: string;
  capabilityTitleFontSize?: number;
  capabilityDetailFontSize?: number;
  controlFontSize?: number;
  pairTitleFontSize?: number;
  pairDetailFontSize?: number;
  conclusionFontSize?: number;
  capabilityStartSeconds?: number;
  capabilityIntervalSeconds?: number;
  pairRevealSeconds?: number;
  conclusionRevealSeconds?: number;
  accentColor?: string;
  firstSkillColor?: string;
  plusColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

const CapabilityIcon: React.FC<{ index: number; color: string }> = ({ index, color }) => {
  if (index % 4 === 0) return <div style={{ width: "100%", height: 7, borderRadius: 99, backgroundColor: color, boxShadow: `0 0 16px ${color}` }} />;
  if (index % 4 === 1) return <div style={{ display: "flex", gap: 12 }}>{[0, 1, 2].map((item) => <span key={item} style={{ width: 17, height: 17, borderRadius: "50%", backgroundColor: color, boxShadow: `0 0 13px ${color}` }} />)}</div>;
  if (index % 4 === 2) return <div style={{ display: "flex", alignItems: "end", gap: 8, height: 48 }}>{[22, 34, 46, 58].map((height) => <span key={height} style={{ width: 15, height, borderRadius: 4, backgroundColor: color }} />)}</div>;
  return <div style={{ color, fontSize: 42, fontWeight: 950, letterSpacing: -5 }}>≋≋</div>;
};

export const PortraitGsapSkillShowcase: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  capabilityCount = 3,
  capability1Title = "ScrollTrigger", capability1Detail = "滚动进度驱动动画",
  capability2Title = "Timeline", capability2Detail = "时间轴精确编排",
  capability3Title = "Stagger", capability3Detail = "多元素错峰入场",
  capability4Title = "Easing", capability4Detail = "快慢曲线自然过渡",
  capability5Title = "Pin", capability5Detail = "滚动区间固定内容",
  capability6Title = "Scrub", capability6Detail = "动画跟随滚动进度",
  capability7Title = "MotionPath", capability7Detail = "元素沿路径运动",
  capability8Title = "Context", capability8Detail = "动画生命周期管理",
  controlLead = "什么时候出现、什么时候结束、快慢怎么给——",
  controlEmphasis = "它全管。",
  firstSkillTitle = "我自己做的 Skill",
  firstSkillDetail = "管页面好不好看",
  secondSkillTitle = "GSAP Skills",
  secondSkillDetail = "管它动得好不好看",
  conclusionLead = "一个定住美感，",
  conclusionEmphasis = "一个让它动起来",
  capabilityTitleFontSize = 20,
  capabilityDetailFontSize = 14,
  controlFontSize = 22,
  pairTitleFontSize = 25,
  pairDetailFontSize = 17,
  conclusionFontSize = 38,
  capabilityStartSeconds = 2.8,
  capabilityIntervalSeconds = 1.15,
  pairRevealSeconds = 11.2,
  conclusionRevealSeconds = 14.1,
  accentColor = "#42E589",
  firstSkillColor = "#18D9E8",
  plusColor = "#FFE326",
  panelColor = "#081118",
  textColor = "#F6F7F8",
  animationSeconds = 18.73,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const normalizedCount = Math.min(8, Math.max(1, Math.round(capabilityCount)));
  const capabilities = [
    [capability1Title, capability1Detail], [capability2Title, capability2Detail],
    [capability3Title, capability3Detail], [capability4Title, capability4Detail],
    [capability5Title, capability5Detail], [capability6Title, capability6Detail],
    [capability7Title, capability7Detail], [capability8Title, capability8Detail],
  ].slice(0, normalizedCount);
  const compact = normalizedCount > 4;
  const gridColumns = normalizedCount <= 3 ? normalizedCount : 4;
  const gridTop = 38;
  const cardHeight = compact ? 128 : 172;
  const gridRows = Math.ceil(normalizedCount / gridColumns);
  const gridHeight = gridRows * cardHeight + Math.max(0, gridRows - 1) * 14;
  const controlTop = gridTop + gridHeight + 30;
  const pairTop = controlTop + 82;
  const conclusionTop = pairTop + 184;
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div name="GSAP 动画能力与协同" data-effect="PortraitGsapSkillShowcase" style={{ position: "relative", width: 900, height: 760, overflow: "hidden", boxSizing: "border-box", border: bgFactor > 0 ? `1px solid color-mix(in srgb, ${accentColor} 24%, transparent)` : "1px solid transparent", borderRadius: 30, color: textColor, background: `linear-gradient(145deg, color-mix(in srgb, ${panelColor} ${Math.round(96 * bgFactor)}%, transparent), color-mix(in srgb, #071C20 ${Math.round(82 * bgFactor)}%, transparent))`, boxShadow: bgFactor > 0 ? `0 26px 80px rgba(0,0,0,${0.48 * bgFactor})` : "none", fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', pointerEvents: "none", opacity: interpolate(frame, [0, fps * 0.55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [0, fps * 0.55], ["0px 28px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
      <Interactive.Div name="GSAP 能力卡" style={{ position: "absolute", top: gridTop, left: 56, right: 56, display: "grid", gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`, gap: 14 }}>
        {capabilities.map(([capabilityTitle, capabilityDetail], index) => {
          const start = (capabilityStartSeconds + index * capabilityIntervalSeconds) * fps;
          return <Interactive.Div name={`能力 ${index + 1}`} key={`${index}-${capabilityTitle}`} style={{ position: "relative", height: cardHeight, boxSizing: "border-box", padding: compact ? "15px 16px" : "20px 18px", overflow: "hidden", border: "1px solid rgba(255,255,255,.13)", borderRadius: 14, backgroundColor: "rgba(8,14,20,.82)", boxShadow: index < 3 ? `inset 0 -2px 0 color-mix(in srgb, ${accentColor} 26%, transparent)` : "none", opacity: interpolate(frame, [start, start + fps * 0.55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [start, start + fps * 0.55], ["0px 22px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
            <div style={{ fontSize: capabilityTitleFontSize, fontWeight: 950 }}>{capabilityTitle}</div>
            <div style={{ position: "absolute", left: 18, right: 18, top: compact ? 50 : 67 }}><CapabilityIcon index={index} color={accentColor} /></div>
            <div style={{ position: "absolute", left: 18, right: 18, bottom: compact ? 12 : 18, color: "rgba(235,239,244,.58)", fontSize: capabilityDetailFontSize, fontWeight: 650 }}>{capabilityDetail}</div>
          </Interactive.Div>;
        })}
      </Interactive.Div>

      <Interactive.Div name="时间控制说明" style={{ position: "absolute", top: controlTop, left: 56, right: 56, textAlign: "center", fontSize: controlFontSize, fontWeight: 720, opacity: interpolate(frame, [fps * 7.8, fps * 8.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}><span style={{ color: "rgba(245,247,249,.68)" }}>{controlLead}</span><span style={{ color: accentColor, fontWeight: 950 }}>{controlEmphasis}</span></Interactive.Div>

      <Interactive.Div name="双 Skill 配合" style={{ position: "absolute", top: pairTop, left: 70, right: 70, height: 150, display: "grid", gridTemplateColumns: "1fr 64px 1fr", alignItems: "center", opacity: interpolate(frame, [pairRevealSeconds * fps, (pairRevealSeconds + 0.75) * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), scale: interpolate(frame, [pairRevealSeconds * fps, (pairRevealSeconds + 0.75) * fps], [0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1), output: "perceptual-scale" }) }}>
        <div style={{ height: 138, display: "grid", placeContent: "center", textAlign: "center", border: `1px solid color-mix(in srgb, ${firstSkillColor} 48%, transparent)`, borderRadius: 17, backgroundColor: `color-mix(in srgb, ${firstSkillColor} 7%, rgba(8,14,20,.84))` }}><div style={{ color: firstSkillColor, fontSize: 25 }}>◆</div><div style={{ marginTop: 8, fontSize: pairTitleFontSize, fontWeight: 950 }}>{firstSkillTitle}</div><div style={{ marginTop: 6, color: firstSkillColor, fontSize: pairDetailFontSize, fontWeight: 850 }}>{firstSkillDetail}</div></div>
        <div style={{ color: plusColor, textAlign: "center", fontSize: 46, fontWeight: 950, textShadow: `0 0 18px ${plusColor}` }}>+</div>
        <div style={{ height: 138, display: "grid", placeContent: "center", textAlign: "center", border: `1px solid color-mix(in srgb, ${accentColor} 48%, transparent)`, borderRadius: 17, backgroundColor: `color-mix(in srgb, ${accentColor} 7%, rgba(8,14,20,.84))` }}><div style={{ color: accentColor, fontSize: 28 }}>≋</div><div style={{ marginTop: 8, fontSize: pairTitleFontSize, fontWeight: 950 }}>{secondSkillTitle}</div><div style={{ marginTop: 6, color: accentColor, fontSize: pairDetailFontSize, fontWeight: 850 }}>{secondSkillDetail}</div></div>
      </Interactive.Div>

      <Interactive.Div name="协同结论" style={{ position: "absolute", top: conclusionTop, left: 48, right: 48, textAlign: "center", fontFamily: 'Georgia, "Songti SC", serif', fontSize: conclusionFontSize, fontWeight: 800, opacity: interpolate(frame, [conclusionRevealSeconds * fps, (conclusionRevealSeconds + 0.9) * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [conclusionRevealSeconds * fps, (conclusionRevealSeconds + 0.9) * fps], ["0px 18px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}><span>{conclusionLead}</span><span style={{ color: accentColor }}>{conclusionEmphasis}</span></Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitGsapSkillShowcaseEffectDef: EffectDef = {
  id: "PortraitGsapSkillShowcase",
  name: "竖屏口播·GSAP 高级动画",
  description: "复刻参考视频 77.000–95.733 秒：动态能力卡、时间控制说明及双 Skill 协同关系；身份条已拆为独立组件。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "GSAP",
  placement: "top",
  component: PortraitGsapSkillShowcase as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 562,
  bounds: { x: 0, y: 0, width: 900, height: 760 },
  defaultPosition: { x: 90, y: 270, scale: 1 },
  defaultProps: {
    enabled: true, capabilityCount: 3,
    capability1Title: "ScrollTrigger", capability1Detail: "滚动进度驱动动画", capability2Title: "Timeline", capability2Detail: "时间轴精确编排", capability3Title: "Stagger", capability3Detail: "多元素错峰入场", capability4Title: "Easing", capability4Detail: "快慢曲线自然过渡", capability5Title: "Pin", capability5Detail: "滚动区间固定内容", capability6Title: "Scrub", capability6Detail: "动画跟随滚动进度", capability7Title: "MotionPath", capability7Detail: "元素沿路径运动", capability8Title: "Context", capability8Detail: "动画生命周期管理",
    controlLead: "什么时候出现、什么时候结束、快慢怎么给——", controlEmphasis: "它全管。", firstSkillTitle: "我自己做的 Skill", firstSkillDetail: "管页面好不好看", secondSkillTitle: "GSAP Skills", secondSkillDetail: "管它动得好不好看", conclusionLead: "一个定住美感，", conclusionEmphasis: "一个让它动起来",
    capabilityTitleFontSize: 20, capabilityDetailFontSize: 14, controlFontSize: 22, pairTitleFontSize: 25, pairDetailFontSize: 17, conclusionFontSize: 38,
    capabilityStartSeconds: 2.8, capabilityIntervalSeconds: 1.15, pairRevealSeconds: 11.2, conclusionRevealSeconds: 14.1,
    accentColor: "#42E589", firstSkillColor: "#18D9E8", plusColor: "#FFE326", panelColor: "#081118", textColor: "#F6F7F8", animationSeconds: 18.73,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示 GSAP 高级动画", default: true }, capabilityCount: { type: "number", label: "能力数量", default: 3, min: 1, max: 8, step: 1 },
    capability1Title: { type: "text", label: "能力一标题" }, capability1Detail: { type: "text", label: "能力一说明" }, capability2Title: { type: "text", label: "能力二标题" }, capability2Detail: { type: "text", label: "能力二说明" }, capability3Title: { type: "text", label: "能力三标题" }, capability3Detail: { type: "text", label: "能力三说明" }, capability4Title: { type: "text", label: "能力四标题" }, capability4Detail: { type: "text", label: "能力四说明" }, capability5Title: { type: "text", label: "能力五标题" }, capability5Detail: { type: "text", label: "能力五说明" }, capability6Title: { type: "text", label: "能力六标题" }, capability6Detail: { type: "text", label: "能力六说明" }, capability7Title: { type: "text", label: "能力七标题" }, capability7Detail: { type: "text", label: "能力七说明" }, capability8Title: { type: "text", label: "能力八标题" }, capability8Detail: { type: "text", label: "能力八说明" },
    controlLead: { type: "text", label: "控制说明前段" }, controlEmphasis: { type: "text", label: "控制说明重点" }, firstSkillTitle: { type: "text", label: "左侧 Skill 标题" }, firstSkillDetail: { type: "text", label: "左侧 Skill 说明" }, secondSkillTitle: { type: "text", label: "右侧 Skill 标题" }, secondSkillDetail: { type: "text", label: "右侧 Skill 说明" }, conclusionLead: { type: "text", label: "协同结论前段" }, conclusionEmphasis: { type: "text", label: "协同结论重点" },
    capabilityTitleFontSize: { type: "number", label: "能力标题字号(px)", default: 20, min: 10, max: 96, step: 1 }, capabilityDetailFontSize: { type: "number", label: "能力说明字号(px)", default: 14, min: 8, max: 96, step: 1 }, controlFontSize: { type: "number", label: "控制说明字号(px)", default: 22, min: 10, max: 96, step: 1 }, pairTitleFontSize: { type: "number", label: "配合卡标题字号(px)", default: 25, min: 10, max: 96, step: 1 }, pairDetailFontSize: { type: "number", label: "配合卡说明字号(px)", default: 17, min: 8, max: 96, step: 1 }, conclusionFontSize: { type: "number", label: "协同结论字号(px)", default: 38, min: 14, max: 120, step: 1 },
    capabilityStartSeconds: { type: "number", label: "第一项能力入场时间(秒)", default: 2.8, min: 0, step: 0.1 }, capabilityIntervalSeconds: { type: "number", label: "下一项能力入场间隔(秒)", default: 1.15, min: 0, step: 0.05 }, pairRevealSeconds: { type: "number", label: "双 Skill 配合入场时间(秒)", default: 11.2, min: 0, step: 0.1 }, conclusionRevealSeconds: { type: "number", label: "协同结论入场时间(秒)", default: 14.1, min: 0, step: 0.1 },
    accentColor: { type: "color", label: "GSAP 强调色", default: "#42E589" }, firstSkillColor: { type: "color", label: "第一 Skill 强调色", default: "#18D9E8" }, plusColor: { type: "color", label: "连接加号颜色", default: "#FFE326" }, panelColor: { type: "color", label: "底板颜色", default: "#081118" }, textColor: { type: "color", label: "文字颜色", default: "#F6F7F8" }, animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 18.73, min: 6, max: 60, step: 0.1 },
  },
};
