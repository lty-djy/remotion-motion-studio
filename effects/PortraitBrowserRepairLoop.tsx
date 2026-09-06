import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  stepCount?: number;
  step1?: string;
  step2?: string;
  step3?: string;
  step4?: string;
  step5?: string;
  step6?: string;
  step7?: string;
  step8?: string;
  centerTitle?: string;
  centerSubtitle?: string;
  numberFontSize?: number;
  stepFontSize?: number;
  centerTitleFontSize?: number;
  centerSubtitleFontSize?: number;
  nodeEnterIntervalSeconds?: number;
  firstNodeHighlightSeconds?: number;
  nextNodeHighlightIntervalSeconds?: number;
  loopIntervalSeconds?: number;
  loopPlayback?: boolean;
  accentColor?: string;
  textColor?: string;
  inactiveColor?: string;
  ringColor?: string;
  animationSeconds?: number;
};

export const PortraitBrowserRepairLoop: React.FC<Props> = ({
  enabled = true,
  stepCount = 6,
  step1 = "打开浏览器",
  step2 = "运行页面",
  step3 = "自动截图",
  step4 = "发现问题",
  step5 = "自动修复",
  step6 = "再验证",
  step7 = "继续检查",
  step8 = "确认完成",
  centerTitle = "一直循环",
  centerSubtitle = "直到没问题",
  numberFontSize = 18,
  stepFontSize = 19,
  centerTitleFontSize = 28,
  centerSubtitleFontSize = 18,
  nodeEnterIntervalSeconds = 0.12,
  firstNodeHighlightSeconds = 0.5,
  nextNodeHighlightIntervalSeconds = 1.2,
  loopIntervalSeconds = 0.5,
  loopPlayback = true,
  accentColor = "#4E85FF",
  textColor = "#F3F5FF",
  inactiveColor = "#6F7A9B",
  ringColor = "#27406E",
  animationSeconds = 9.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const normalizedCount = Math.min(8, Math.max(2, Math.round(stepCount)));
  const steps = [step1, step2, step3, step4, step5, step6, step7, step8].slice(0, normalizedCount);
  const highlightFrame = Math.max(0, firstNodeHighlightSeconds * fps);
  const highlightIntervalFrames = Math.max(1, nextNodeHighlightIntervalSeconds * fps);
  const elapsedHighlightFrames = Math.max(0, frame - highlightFrame);
  const activeCycleFrames = normalizedCount * highlightIntervalFrames;
  const loopPauseFrames = Math.max(0, loopIntervalSeconds * fps);
  const cycleFrames = Math.max(1, activeCycleFrames + loopPauseFrames);
  const cyclePosition = elapsedHighlightFrames % cycleFrames;
  const activeIndex = frame < highlightFrame
    ? -1
    : loopPlayback
      ? cyclePosition < activeCycleFrames
        ? Math.min(normalizedCount - 1, Math.floor(cyclePosition / highlightIntervalFrames))
        : -1
      : Math.min(normalizedCount - 1, Math.floor(elapsedHighlightFrames / highlightIntervalFrames));

  return (
    <Interactive.Div
      name="浏览器自动修复闭环"
      data-effect="PortraitBrowserRepairLoop"
      style={{
        position: "relative",
        width: 650,
        height: 650,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        opacity: interpolate(frame, [0, fps * 0.5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <Interactive.Div
        name="闭环虚线"
        style={{
          position: "absolute",
          left: 120,
          top: 120,
          width: 410,
          height: 410,
          boxSizing: "border-box",
          border: `3px dashed ${ringColor}`,
          borderRadius: "50%",
          opacity: 0.7,
          rotate: interpolate(frame, [0, fps * Math.max(6, animationSeconds)], ["0deg", "18deg"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.linear,
          }),
        }}
      />
      <Interactive.Div
        name="闭环中心结论"
        style={{
          position: "absolute",
          left: 190,
          top: 255,
          width: 270,
          height: 140,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          opacity: interpolate(frame, [fps * 0.3, fps * 0.95], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [fps * 0.3, fps * 0.95], [0.86, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <div style={{ fontSize: centerTitleFontSize, fontWeight: 850, letterSpacing: 0.4 }}>{centerTitle}</div>
        <div style={{ marginTop: 7, color: inactiveColor, fontSize: centerSubtitleFontSize, fontWeight: 650 }}>{centerSubtitle}</div>
      </Interactive.Div>
      {steps.map((label, index) => {
        const angle = -90 + (index * 360) / normalizedCount;
        const radians = (angle * Math.PI) / 180;
        const x = 325 + Math.cos(radians) * 235;
        const y = 325 + Math.sin(radians) * 235;
        const isActive = index === activeIndex;
        const entranceStart = index * fps * Math.max(0, nodeEnterIntervalSeconds);
        return (
          <Interactive.Div
            name={`闭环节点 ${index + 1}`}
            key={`${index}-${label}`}
            style={{
              position: "absolute",
              left: x - 72,
              top: y - 36,
              width: 144,
              height: 106,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: interpolate(frame, [entranceStart, entranceStart + fps * 0.4], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              scale: interpolate(frame, [entranceStart, entranceStart + fps * 0.4], [0.72, isActive ? 1.08 : 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 180 }),
                output: "perceptual-scale",
              }),
            }}
          >
            <div style={{ display: "grid", width: 54, height: 54, placeItems: "center", border: `2px solid ${isActive ? accentColor : ringColor}`, borderRadius: "50%", color: isActive ? textColor : inactiveColor, backgroundColor: isActive ? `color-mix(in srgb, ${accentColor} 22%, #091020)` : "#0A1020", boxShadow: isActive ? `0 0 24px 6px color-mix(in srgb, ${accentColor} 58%, transparent)` : `0 0 8px color-mix(in srgb, ${ringColor} 25%, transparent)`, fontSize: numberFontSize, fontWeight: 800 }}>{index + 1}</div>
            <div style={{ marginTop: 9, color: isActive ? textColor : inactiveColor, textShadow: isActive ? `0 0 12px color-mix(in srgb, ${accentColor} 45%, transparent)` : "none", fontSize: stepFontSize, fontWeight: isActive ? 800 : 650, whiteSpace: "nowrap" }}>{label}</div>
          </Interactive.Div>
        );
      })}
    </Interactive.Div>
  );
};

export const PortraitBrowserRepairLoopEffectDef: EffectDef = {
  id: "PortraitBrowserRepairLoop",
  name: "浏览器自动修复闭环",
  description: "复刻参考视频 123.050–132.850 秒的六步浏览器自动测试与修复闭环，节点按口播顺序循环点亮。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "LOOP",
  placement: "top",
  component: PortraitBrowserRepairLoop as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 294,
  bounds: { x: 0, y: 0, width: 650, height: 650 },
  defaultPosition: { x: 215, y: 360, scale: 1 },
  defaultProps: {
    enabled: true, stepCount: 6,
    step1: "打开浏览器", step2: "运行页面", step3: "自动截图", step4: "发现问题", step5: "自动修复", step6: "再验证", step7: "继续检查", step8: "确认完成",
    centerTitle: "一直循环", centerSubtitle: "直到没问题",
    numberFontSize: 18, stepFontSize: 19, centerTitleFontSize: 28, centerSubtitleFontSize: 18,
    nodeEnterIntervalSeconds: 0.1, firstNodeHighlightSeconds: 0.5, nextNodeHighlightIntervalSeconds: 1.2, loopIntervalSeconds: 0.5, loopPlayback: true,
    accentColor: "#4E85FF", textColor: "#F3F5FF", inactiveColor: "#6F7A9B", ringColor: "#27406E", animationSeconds: 9.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示浏览器自动修复闭环", default: true },
    stepCount: { type: "number", label: "节点数量", default: 6, min: 2, max: 8, step: 1 },
    step1: { type: "text", label: "节点一" }, step2: { type: "text", label: "节点二" }, step3: { type: "text", label: "节点三" }, step4: { type: "text", label: "节点四" }, step5: { type: "text", label: "节点五" }, step6: { type: "text", label: "节点六" }, step7: { type: "text", label: "节点七" }, step8: { type: "text", label: "节点八" },
    centerTitle: { type: "text", label: "中心主标题" }, centerSubtitle: { type: "text", label: "中心副标题" },
    numberFontSize: { type: "number", label: "编号字号(px)", default: 18, min: 8, max: 96, step: 1 }, stepFontSize: { type: "number", label: "节点文字字号(px)", default: 19, min: 10, max: 120, step: 1 }, centerTitleFontSize: { type: "number", label: "中心主标题字号(px)", default: 28, min: 10, max: 120, step: 1 }, centerSubtitleFontSize: { type: "number", label: "中心副标题字号(px)", default: 18, min: 8, max: 96, step: 1 },
    nodeEnterIntervalSeconds: { type: "number", label: "下一个节点入场间隔(秒)", default: 0.1, min: 0, step: 0.1 }, firstNodeHighlightSeconds: { type: "number", label: "第一节点点亮时间(秒)", default: 0.5, min: 0, step: 0.1 }, nextNodeHighlightIntervalSeconds: { type: "number", label: "下一节点点亮间隔(秒)", default: 1.2, min: 0.1, step: 0.1 }, loopIntervalSeconds: { type: "number", label: "每轮循环间隔(秒)", default: 0.5, min: 0, step: 0.1 },
    loopPlayback: { type: "boolean", label: "循环点亮节点", default: true },
    accentColor: { type: "color", label: "节点强调色", default: "#4E85FF" }, textColor: { type: "color", label: "高亮文字颜色", default: "#F3F5FF" }, inactiveColor: { type: "color", label: "未点亮文字颜色", default: "#6F7A9B" }, ringColor: { type: "color", label: "环线颜色", default: "#27406E" }, animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 9.8, min: 2, max: 120, step: 0.1 },
  },
};
