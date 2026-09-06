import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  backgroundOpacity?: number;
  questionCount?: number;
  question1?: string;
  question2?: string;
  question3?: string;
  question4?: string;
  question5?: string;
  question6?: string;
  question7?: string;
  question8?: string;
  numberFontSize?: number;
  questionFontSize?: number;
  questionEnterIntervalSeconds?: number;
  firstHighlightSeconds?: number;
  questionIntervalSeconds?: number;
  accentColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  panelColor?: string;
  animationSeconds?: number;
};

export const PortraitCodeDecisionChecklist: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  questionCount = 6,
  question1 = "这个功能真的需要吗",
  question2 = "现有代码里有没有",
  question3 = "标准库有没有",
  question4 = "原生平台有没有",
  question5 = "已装依赖有没有",
  question6 = "一行能搞定吗",
  question7 = "有没有更简单的实现",
  question8 = "最后再决定自己写",
  numberFontSize = 18,
  questionFontSize = 25,
  questionEnterIntervalSeconds = 0.1,
  firstHighlightSeconds = 0.6,
  questionIntervalSeconds = 0.9,
  accentColor = "#9A73FF",
  activeTextColor = "#F5F1FF",
  inactiveTextColor = "#A8A1B5",
  panelColor = "#090914",
  animationSeconds = 6.72,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const normalizedCount = Math.min(8, Math.max(1, Math.round(questionCount)));
  const questions = [question1, question2, question3, question4, question5, question6, question7, question8].slice(0, normalizedCount);
  const firstHighlightFrame = Math.max(0, firstHighlightSeconds * fps);
  const intervalFrames = Math.max(1, questionIntervalSeconds * fps);
  const activeIndex = Math.min(normalizedCount - 1, Math.max(0, Math.floor((frame - firstHighlightFrame) / intervalFrames)));
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const rowHeight = normalizedCount > 6 ? 60 : 70;

  return (
    <Interactive.Div name="代码决策检查清单" data-effect="PortraitCodeDecisionChecklist" style={{ position: "relative", width: 620, height: 590, boxSizing: "border-box", padding: "36px 38px", overflow: "hidden", border: bgFactor > 0 ? `1px solid color-mix(in srgb, ${accentColor} 28%, transparent)` : "1px solid transparent", borderRadius: 26, color: activeTextColor, backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(94 * bgFactor)}%, transparent)`, boxShadow: bgFactor > 0 ? `0 24px 70px rgba(0,0,0,${0.46 * bgFactor})` : "none", fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', pointerEvents: "none", opacity: interpolate(frame, [0, fps * 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
      {questions.map((question, index) => {
        const isActive = index === activeIndex && frame >= firstHighlightFrame;
        const entranceStart = index * fps * Math.max(0, questionEnterIntervalSeconds);
        return (
          <Interactive.Div name={`检查项 ${index + 1}`} key={`${index}-${question}`} style={{ height: rowHeight, display: "flex", alignItems: "center", opacity: interpolate(frame, [entranceStart, entranceStart + fps * 0.35], [0, isActive ? 1 : 0.42], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [entranceStart, entranceStart + fps * 0.35], ["-18px 0px", isActive ? "8px 0px" : "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
            <div style={{ display: "grid", width: 47, height: 47, flex: "0 0 auto", placeItems: "center", border: `1.5px solid ${isActive ? accentColor : "color-mix(in srgb, " + accentColor + " 58%, transparent)"}`, borderRadius: "50%", color: isActive ? activeTextColor : accentColor, backgroundColor: isActive ? `color-mix(in srgb, ${accentColor} 18%, transparent)` : "transparent", boxShadow: isActive ? `0 0 18px 4px color-mix(in srgb, ${accentColor} 50%, transparent)` : `0 0 8px color-mix(in srgb, ${accentColor} 24%, transparent)`, fontSize: numberFontSize, fontWeight: 800 }}>{index + 1}</div>
            <div style={{ marginLeft: 23, color: isActive ? activeTextColor : inactiveTextColor, textShadow: isActive ? `0 0 14px color-mix(in srgb, ${accentColor} 38%, transparent)` : "none", fontSize: questionFontSize, fontWeight: isActive ? 850 : 650, letterSpacing: 0.3 }}>{question}</div>
          </Interactive.Div>
        );
      })}
    </Interactive.Div>
  );
};

export const PortraitCodeDecisionChecklistEffectDef: EffectDef = {
  id: "PortraitCodeDecisionChecklist",
  name: "代码决策检查清单",
  description: "只复刻参考视频 102.333–109.050 秒的六项代码决策问题，逐行点亮，不包含身份条或行数对比。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "CHECK",
  placement: "left",
  component: PortraitCodeDecisionChecklist as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 202,
  bounds: { x: 0, y: 0, width: 620, height: 590 },
  defaultPosition: { x: 70, y: 300, scale: 1 },
  defaultProps: {
    enabled: true, backgroundOpacity: 0, questionCount: 6,
    question1: "这个功能真的需要吗", question2: "现有代码里有没有", question3: "标准库有没有", question4: "原生平台有没有", question5: "已装依赖有没有", question6: "一行能搞定吗", question7: "有没有更简单的实现", question8: "最后再决定自己写",
    numberFontSize: 18, questionFontSize: 25, questionEnterIntervalSeconds: 0.1, firstHighlightSeconds: 0.6, questionIntervalSeconds: 0.9,
    accentColor: "#9A73FF", activeTextColor: "#F5F1FF", inactiveTextColor: "#A8A1B5", panelColor: "#090914", animationSeconds: 6.72,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示代码决策检查清单", default: true }, backgroundOpacity: { type: "number", label: "底板透明度", default: 0, min: 0, max: 1, step: 0.05 }, questionCount: { type: "number", label: "问题数量", default: 6, min: 1, max: 8, step: 1 },
    question1: { type: "text", label: "问题一" }, question2: { type: "text", label: "问题二" }, question3: { type: "text", label: "问题三" }, question4: { type: "text", label: "问题四" }, question5: { type: "text", label: "问题五" }, question6: { type: "text", label: "问题六" }, question7: { type: "text", label: "问题七" }, question8: { type: "text", label: "问题八" },
    numberFontSize: { type: "number", label: "编号字号(px)", default: 18, min: 8, max: 96, step: 1 }, questionFontSize: { type: "number", label: "问题字号(px)", default: 25, min: 10, max: 120, step: 1 },
    questionEnterIntervalSeconds: { type: "number", label: "下一个问题入场间隔(秒)", default: 0.1, min: 0, step: 0.1 }, firstHighlightSeconds: { type: "number", label: "第一项点亮时间(秒)", default: 0.6, min: 0, step: 0.1 }, questionIntervalSeconds: { type: "number", label: "下一项点亮间隔(秒)", default: 0.9, min: 0.1, step: 0.1 },
    accentColor: { type: "color", label: "编号强调色", default: "#9A73FF" }, activeTextColor: { type: "color", label: "当前问题颜色", default: "#F5F1FF" }, inactiveTextColor: { type: "color", label: "未选问题颜色", default: "#A8A1B5" }, panelColor: { type: "color", label: "底板颜色", default: "#090914" }, animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 6.72, min: 2, max: 60, step: 0.1 },
  },
};
