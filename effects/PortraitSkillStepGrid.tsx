import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  stepCount?: number;
  headerText?: string;
  step1Title?: string; step1Subtitle?: string;
  step2Title?: string; step2Subtitle?: string;
  step3Title?: string; step3Subtitle?: string;
  step4Title?: string; step4Subtitle?: string;
  step5Title?: string; step5Subtitle?: string;
  step6Title?: string; step6Subtitle?: string;
  step7Title?: string; step7Subtitle?: string;
  step8Title?: string; step8Subtitle?: string;
  headerFontSize?: number; numberFontSize?: number; titleFontSize?: number; subtitleFontSize?: number;
  headerEnterSeconds?: number; cardEnterIntervalSeconds?: number; animationSeconds?: number;
  headerColor?: string; textColor?: string; subtitleColor?: string; cardColors?: string[];
};

export const PortraitSkillStepGrid: React.FC<Props> = ({
  enabled = true, stepCount = 4, headerText = "STEP 1 → 4",
  step1Title = "我自己做的 Skill", step1Subtitle = "定审美",
  step2Title = "GSAP", step2Subtitle = "跟动效",
  step3Title = "Ponytail", step3Subtitle = "保克制",
  step4Title = "Playwright MCP", step4Subtitle = "自测自修",
  step5Title = "部署", step5Subtitle = "上线",
  step6Title = "复盘", step6Subtitle = "迭代",
  step7Title = "优化", step7Subtitle = "提效",
  step8Title = "沉淀", step8Subtitle = "复用",
  headerFontSize = 22, numberFontSize = 18, titleFontSize = 20, subtitleFontSize = 16,
  headerEnterSeconds = 0.45, cardEnterIntervalSeconds = 0.16, animationSeconds = 3.2,
  headerColor = "#F2D51B", textColor = "#F5F7FA", subtitleColor = "#69D7E6",
  cardColors = ["#18D9E8", "#4FD77A", "#A36CFF", "#5986FF", "#FFB84D", "#FF6B8A", "#4DD8A7", "#7B8CFF"],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;
  const count = Math.min(8, Math.max(1, Math.round(stepCount)));
  const cards = [
    [step1Title, step1Subtitle], [step2Title, step2Subtitle], [step3Title, step3Subtitle], [step4Title, step4Subtitle],
    [step5Title, step5Subtitle], [step6Title, step6Subtitle], [step7Title, step7Subtitle], [step8Title, step8Subtitle],
  ].slice(0, count);
  const columns = count <= 4 ? count : 4;
  const cardWidth = count <= 4 ? 850 / count - 10 : 850 / columns - 10;
  const headerFrames = Math.max(6, headerEnterSeconds * fps);
  const cardIntervalFrames = Math.max(0, cardEnterIntervalSeconds * fps);
  return (
    <Interactive.Div name="多步骤卡片组" data-effect="PortraitSkillStepGrid" style={{ position: "relative", width: 900, height: count > 4 ? 500 : 360, color: textColor, fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif' }}>
      <Interactive.Div name="STEP 标题" style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: interpolate(frame, [0, headerFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [0, headerFrames], ["0px -18px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
        <span style={{ padding: "11px 28px", border: `1px solid color-mix(in srgb, ${headerColor} 30%, #273018)`, borderRadius: 999, backgroundColor: "rgba(13,18,17,0.84)", color: headerColor, fontSize: headerFontSize, fontWeight: 900, letterSpacing: 1.8 }}>{headerText}</span>
      </Interactive.Div>
      <Interactive.Div name="Skill 步骤卡片组" style={{ position: "absolute", top: 95, left: 0, right: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
        {cards.map(([title, subtitle], index) => {
          const color = cardColors[index] ?? cardColors[cardColors.length - 1];
          const start = headerFrames + index * cardIntervalFrames;
          return <Interactive.Div name={`Skill 步骤 ${index + 1}`} key={`${index}-${title}`} style={{ width: cardWidth, height: 170, boxSizing: "border-box", padding: "18px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1.5px solid color-mix(in srgb, ${color} 78%, transparent)`, borderRadius: 18, backgroundColor: "rgba(13,19,27,0.72)", boxShadow: `inset 0 0 26px color-mix(in srgb, ${color} 7%, transparent), 0 16px 36px rgba(0,0,0,0.22)`, opacity: interpolate(frame, [start, start + fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [start, start + fps * 0.4], ["0px 26px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
            <div style={{ display: "grid", width: 34, height: 34, placeItems: "center", border: `1.5px solid ${color}`, borderRadius: "50%", color, fontSize: numberFontSize, fontWeight: 850 }}>{index + 1}</div>
            <div style={{ marginTop: 13, textAlign: "center", color: textColor, fontSize: titleFontSize, fontWeight: 850, lineHeight: 1.2, whiteSpace: "nowrap" }}>{title}</div>
            <div style={{ marginTop: 7, color, fontSize: subtitleFontSize, fontWeight: 750 }}>{subtitle}</div>
          </Interactive.Div>;
        })}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitSkillStepGridEffectDef: EffectDef = {
  id: "PortraitSkillStepGrid", name: "多步骤卡片组", description: "按参考图展示 STEP 1 → 4 与四张 Skill 卡片，支持按需增减步骤。", category: "portrait-narrative", catalogGroup: "竖屏口播信息层", glyph: "STEPS", placement: "top", component: PortraitSkillStepGrid as React.ComponentType<Record<string, unknown>>, durationInFrames: 96, bounds: { x: 0, y: 0, width: 900, height: 360 }, defaultPosition: { x: 90, y: 420, scale: 1 },
  defaultProps: { enabled: true, stepCount: 4, headerText: "STEP 1 → 4", step1Title: "我自己做的 Skill", step1Subtitle: "定审美", step2Title: "GSAP", step2Subtitle: "跟动效", step3Title: "Ponytail", step3Subtitle: "保克制", step4Title: "Playwright MCP", step4Subtitle: "自测自修", step5Title: "部署", step5Subtitle: "上线", step6Title: "复盘", step6Subtitle: "迭代", step7Title: "优化", step7Subtitle: "提效", step8Title: "沉淀", step8Subtitle: "复用", headerFontSize: 22, numberFontSize: 18, titleFontSize: 20, subtitleFontSize: 16, headerEnterSeconds: 0.45, cardEnterIntervalSeconds: 0.16, animationSeconds: 3.2, headerColor: "#F2D51B", textColor: "#F5F7FA", subtitleColor: "#69D7E6" },
  propsSchema: { enabled: { type: "boolean", label: "显示 多步骤卡片组", default: true }, stepCount: { type: "number", label: "卡片数量", default: 4, min: 1, max: 8, step: 1 }, headerText: { type: "text", label: "顶部步骤标题" }, step1Title: { type: "text", label: "卡片一标题" }, step1Subtitle: { type: "text", label: "卡片一副标题" }, step2Title: { type: "text", label: "卡片二标题" }, step2Subtitle: { type: "text", label: "卡片二副标题" }, step3Title: { type: "text", label: "卡片三标题" }, step3Subtitle: { type: "text", label: "卡片三副标题" }, step4Title: { type: "text", label: "卡片四标题" }, step4Subtitle: { type: "text", label: "卡片四副标题" }, step5Title: { type: "text", label: "卡片五标题" }, step5Subtitle: { type: "text", label: "卡片五副标题" }, step6Title: { type: "text", label: "卡片六标题" }, step6Subtitle: { type: "text", label: "卡片六副标题" }, step7Title: { type: "text", label: "卡片七标题" }, step7Subtitle: { type: "text", label: "卡片七副标题" }, step8Title: { type: "text", label: "卡片八标题" }, step8Subtitle: { type: "text", label: "卡片八副标题" }, headerFontSize: { type: "number", label: "步骤标题字号(px)", default: 22, min: 10, max: 96, step: 1 }, numberFontSize: { type: "number", label: "编号字号(px)", default: 18, min: 8, max: 72, step: 1 }, titleFontSize: { type: "number", label: "卡片标题字号(px)", default: 20, min: 10, max: 96, step: 1 }, subtitleFontSize: { type: "number", label: "卡片副标题字号(px)", default: 16, min: 8, max: 72, step: 1 }, headerEnterSeconds: { type: "number", label: "步骤标题入场时间(秒)", default: 0.45, min: 0.1, step: 0.1 }, cardEnterIntervalSeconds: { type: "number", label: "下一个卡片入场间隔(秒)", default: 0.16, min: 0, step: 0.1 }, animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 3.2, min: 1, max: 120, step: 0.1 }, headerColor: { type: "color", label: "步骤标题颜色", default: "#F2D51B" }, textColor: { type: "color", label: "卡片标题颜色", default: "#F5F7FA" }, subtitleColor: { type: "color", label: "副标题颜色", default: "#69D7E6" } },
};
