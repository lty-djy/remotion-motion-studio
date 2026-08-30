import React from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  backgroundOpacity?: number;
  iterationCount?: number;
  iteration1Url?: string; iteration1Prompt?: string; iteration1Badge?: string; iteration1Color?: string;
  iteration2Url?: string; iteration2Prompt?: string; iteration2Badge?: string; iteration2Color?: string;
  iteration3Url?: string; iteration3Prompt?: string; iteration3Badge?: string; iteration3Color?: string;
  iteration4Url?: string; iteration4Prompt?: string; iteration4Badge?: string; iteration4Color?: string;
  iteration5Url?: string; iteration5Prompt?: string; iteration5Badge?: string; iteration5Color?: string;
  iteration6Url?: string; iteration6Prompt?: string; iteration6Badge?: string; iteration6Color?: string;
  iteration7Url?: string; iteration7Prompt?: string; iteration7Badge?: string; iteration7Color?: string;
  iteration8Url?: string; iteration8Prompt?: string; iteration8Badge?: string; iteration8Color?: string;
  eyebrow?: string;
  title?: string;
  emphasis?: string;
  ghostNumber?: string;
  waitingText?: string;
  eyebrowFontSize?: number;
  titleFontSize?: number;
  emphasisFontSize?: number;
  promptFontSize?: number;
  badgeFontSize?: number;
  firstResultSeconds?: number;
  iterationIntervalSeconds?: number;
  wipeDurationSeconds?: number;
  accentColor?: string;
  emphasisColor?: string;
  panelColor?: string;
  textColor?: string;
  mediaFit?: "cover" | "contain";
  mediaPositionX?: number;
  mediaPositionY?: number;
  animationSeconds?: number;
};

type IterationVisualProps = {
  mediaUrl: string;
  index: number;
  badge: string;
  color: string;
  badgeFontSize: number;
  mediaFit: "cover" | "contain";
  mediaPositionX: number;
  mediaPositionY: number;
};

const IterationVisual: React.FC<IterationVisualProps> = ({
  mediaUrl,
  index,
  badge,
  color,
  badgeFontSize,
  mediaFit,
  mediaPositionX,
  mediaPositionY,
}) => (
  <Interactive.Div name={`迭代页面 ${index + 1}`} style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#070B10" }}>
    {mediaUrl ? (
      <Img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: mediaFit, objectPosition: `${mediaPositionX}% ${mediaPositionY}%` }} />
    ) : index % 3 === 0 ? (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", color: "white", background: "linear-gradient(120deg, #071419, #153A43 53%, #0A1E27)" }}>
        <div style={{ position: "absolute", left: 34, top: 48, width: 350, fontSize: 42, fontWeight: 950, lineHeight: 0.95 }}>Photography built<br />as a system, not a<br />single shot.</div>
        <div style={{ position: "absolute", inset: "0 0 0 55%", background: "radial-gradient(circle at 42% 52%, rgba(107,185,188,.72), transparent 28%), linear-gradient(145deg, rgba(255,255,255,.08), transparent)" }} />
        <div style={{ position: "absolute", left: 36, bottom: 48, width: 118, height: 8, borderRadius: 99, backgroundColor: color }} />
      </div>
    ) : index % 3 === 1 ? (
      <div style={{ position: "absolute", inset: 0, color: "#F2F4F5", background: "linear-gradient(145deg, #0A0D10, #151A20)" }}>
        <div style={{ position: "absolute", left: 24, top: 28, bottom: 24, width: 118, borderRadius: 10, background: "#11161C", border: "1px solid rgba(255,255,255,.08)" }} />
        <div style={{ position: "absolute", left: 166, right: 26, top: 28, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {["24,320", "12,840", "3.81%", "4.2m"].map((value) => <div key={value} style={{ height: 70, padding: 14, borderRadius: 9, background: "#11161C", border: "1px solid rgba(255,255,255,.08)", color, fontSize: 19, fontWeight: 850 }}>{value}</div>)}
        </div>
        <div style={{ position: "absolute", left: 166, right: 260, bottom: 40, height: 210, borderRadius: 12, border: "1px solid rgba(255,255,255,.08)", background: "linear-gradient(180deg, rgba(255,115,45,.1), transparent)" }}>
          <svg viewBox="0 0 500 180" style={{ width: "100%", height: "100%" }}><polyline points="0,150 55,128 105,138 165,95 225,112 290,65 350,83 415,38 500,54" fill="none" stroke={color} strokeWidth="5" /></svg>
        </div>
        <div style={{ position: "absolute", right: 28, bottom: 40, width: 208, height: 210, borderRadius: 12, background: "#11161C", border: "1px solid rgba(255,255,255,.08)" }} />
      </div>
    ) : (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", color: "#15171A", background: "linear-gradient(115deg, #F6F2E9, #E7EEF0)" }}>
        <div style={{ position: "absolute", left: 34, top: 50, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 58, fontWeight: 800, lineHeight: 0.86 }}>建造<br />留白。</div>
        <div style={{ position: "absolute", right: 40, bottom: 25, width: 480, height: 300, clipPath: "polygon(0 100%, 22% 36%, 58% 0, 100% 72%, 100% 100%)", background: "linear-gradient(145deg, rgba(255,255,255,.96), rgba(130,151,158,.24))", border: "1px solid rgba(50,65,70,.22)" }} />
        <div style={{ position: "absolute", left: 36, bottom: 36, width: 132, height: 6, backgroundColor: color }} />
      </div>
    )}
    <div style={{ position: "absolute", top: 15, right: 15, padding: "6px 12px", borderRadius: 999, color: "#061014", backgroundColor: color, boxShadow: `0 0 20px color-mix(in srgb, ${color} 45%, transparent)`, fontSize: badgeFontSize, fontWeight: 900 }}>{badge}</div>
  </Interactive.Div>
);

export const PortraitPromptIterationShowcase: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  iterationCount = 3,
  iteration1Url = "", iteration1Prompt = "做一个摄影工作室的品牌官网", iteration1Badge = "品牌官网", iteration1Color = "#17D9E8",
  iteration2Url = "", iteration2Prompt = "改成数据后台，深色", iteration2Badge = "数据后台", iteration2Color = "#FF7A2F",
  iteration3Url = "", iteration3Prompt = "换成产品落地页", iteration3Badge = "产品落地页", iteration3Color = "#17D9E8",
  iteration4Url = "", iteration4Prompt = "继续调整第四版", iteration4Badge = "方案 04", iteration4Color = "#A36CFF",
  iteration5Url = "", iteration5Prompt = "继续调整第五版", iteration5Badge = "方案 05", iteration5Color = "#14E6A1",
  iteration6Url = "", iteration6Prompt = "继续调整第六版", iteration6Badge = "方案 06", iteration6Color = "#5986FF",
  iteration7Url = "", iteration7Prompt = "继续调整第七版", iteration7Badge = "方案 07", iteration7Color = "#FF9F43",
  iteration8Url = "", iteration8Prompt = "继续调整第八版", iteration8Badge = "方案 08", iteration8Color = "#FF5E8A",
  eyebrow = "HOW TO USE",
  title = "怎么用？",
  emphasis = "一句话，改一版",
  ghostNumber = "01",
  waitingText = "等待第一句话",
  eyebrowFontSize = 13,
  titleFontSize = 36,
  emphasisFontSize = 36,
  promptFontSize = 17,
  badgeFontSize = 12,
  firstResultSeconds = 3.1,
  iterationIntervalSeconds = 5.2,
  wipeDurationSeconds = 0.75,
  accentColor = "#17D9E8",
  emphasisColor = "#FFE326",
  panelColor = "#071017",
  textColor = "#F5F7FA",
  mediaFit = "cover",
  mediaPositionX = 50,
  mediaPositionY = 50,
  animationSeconds = 18.9,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const normalizedCount = Math.min(8, Math.max(1, Math.round(iterationCount)));
  const totalFrames = Math.max(120, Math.round(animationSeconds * fps));
  const firstResultFrame = Math.max(0, firstResultSeconds * fps);
  const intervalFrames = Math.max(0, iterationIntervalSeconds * fps);
  const wipeFrames = Math.max(5, wipeDurationSeconds * fps);
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const iterations = [
    { mediaUrl: iteration1Url, prompt: iteration1Prompt, badge: iteration1Badge, color: iteration1Color },
    { mediaUrl: iteration2Url, prompt: iteration2Prompt, badge: iteration2Badge, color: iteration2Color },
    { mediaUrl: iteration3Url, prompt: iteration3Prompt, badge: iteration3Badge, color: iteration3Color },
    { mediaUrl: iteration4Url, prompt: iteration4Prompt, badge: iteration4Badge, color: iteration4Color },
    { mediaUrl: iteration5Url, prompt: iteration5Prompt, badge: iteration5Badge, color: iteration5Color },
    { mediaUrl: iteration6Url, prompt: iteration6Prompt, badge: iteration6Badge, color: iteration6Color },
    { mediaUrl: iteration7Url, prompt: iteration7Prompt, badge: iteration7Badge, color: iteration7Color },
    { mediaUrl: iteration8Url, prompt: iteration8Prompt, badge: iteration8Badge, color: iteration8Color },
  ].slice(0, normalizedCount);
  const revealFrames = iterations.map((_, index) => firstResultFrame + index * intervalFrames);
  const activeIndex = Math.max(0, revealFrames.filter((start) => frame >= start).length - 1);
  const activeIteration = iterations[activeIndex];

  return (
    <Interactive.Div name="一句话连续改版" data-effect="PortraitPromptIterationShowcase" style={{ position: "relative", width: 900, height: 760, overflow: "hidden", boxSizing: "border-box", border: bgFactor > 0 ? `1px solid color-mix(in srgb, ${accentColor} 20%, transparent)` : "1px solid transparent", borderRadius: 28, color: textColor, backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(94 * bgFactor)}%, transparent)`, boxShadow: bgFactor > 0 ? `0 24px 70px rgba(0,0,0,${0.44 * bgFactor})` : "none", fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', pointerEvents: "none", opacity: interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [0, fps * 0.55], ["0px 24px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
      <Interactive.Div name="使用方法标题" style={{ position: "absolute", top: 42, left: 48, right: 48 }}>
        <div style={{ color: accentColor, fontSize: eyebrowFontSize, fontWeight: 850, letterSpacing: 3 }}>{eyebrow}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 15, marginTop: 9 }}><span style={{ fontSize: titleFontSize, fontWeight: 950 }}>{title}</span><span style={{ color: emphasisColor, fontSize: emphasisFontSize, fontWeight: 950 }}>{emphasis}</span></div>
        <div aria-hidden="true" style={{ position: "absolute", top: -35, right: -6, color: `color-mix(in srgb, ${accentColor} 12%, transparent)`, fontFamily: '"SFMono-Regular", Consolas, monospace', fontSize: 128, fontWeight: 950, lineHeight: 1 }}>{ghostNumber}</div>
      </Interactive.Div>

      <Interactive.Div name="提示词输入条" style={{ position: "absolute", top: 156, left: 48, right: 48, height: 46, display: "flex", alignItems: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,.16)", borderRadius: 8, backgroundColor: "rgba(4,9,14,.84)", boxShadow: `inset 3px 0 0 ${activeIteration.color}` }}>
        <span style={{ marginLeft: 18, marginRight: 12, color: activeIteration.color, fontSize: promptFontSize, fontWeight: 950 }}>I</span>
        <span style={{ fontSize: promptFontSize, fontWeight: 720, opacity: interpolate(frame, [0, fps * 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{activeIteration.prompt}</span>
      </Interactive.Div>

      <Interactive.Div name="页面结果窗口" style={{ position: "absolute", top: 230, left: 48, width: 804, height: 420, overflow: "hidden", border: "1px solid rgba(255,255,255,.24)", borderRadius: 16, backgroundColor: "#070B10", boxShadow: "0 28px 58px rgba(0,0,0,.46)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 34, zIndex: 30, display: "flex", alignItems: "center", gap: 7, padding: "0 14px", borderBottom: "1px solid rgba(255,255,255,.12)", background: "rgba(5,8,12,.94)" }}><span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#FF665C" }} /><span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#FFBE45" }} /><span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#34D17B" }} /><span style={{ width: 230, height: 12, marginLeft: 8, borderRadius: 99, backgroundColor: "rgba(255,255,255,.08)" }} /></div>
        <div style={{ position: "absolute", inset: "34px 0 0", display: "grid", placeItems: "center", color: "rgba(255,255,255,.26)", fontSize: 15, fontWeight: 750 }}>{waitingText}</div>
        <div style={{ position: "absolute", inset: "34px 0 0" }}>
          {iterations.map((iteration, index) => {
            const start = revealFrames[index];
            const progress = interpolate(frame, [start, start + wipeFrames], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.65, 0, 0.35, 1) });
            return <React.Fragment key={`${index}-${iteration.prompt}`}><div style={{ position: "absolute", inset: 0, zIndex: index * 2 + 1, clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)` }}><IterationVisual mediaUrl={iteration.mediaUrl} index={index} badge={iteration.badge} color={iteration.color} badgeFontSize={badgeFontSize} mediaFit={mediaFit} mediaPositionX={mediaPositionX} mediaPositionY={mediaPositionY} /></div><div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(${progress}% - 2px)`, zIndex: index * 2 + 2, width: 4, backgroundColor: iteration.color, boxShadow: `0 0 24px 7px ${iteration.color}`, opacity: interpolate(frame, [start, start + fps * 0.08, start + wipeFrames - fps * 0.08, start + wipeFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}><div style={{ position: "absolute", top: "50%", left: "50%", display: "grid", width: 34, height: 34, placeItems: "center", borderRadius: "50%", color: "#061014", backgroundColor: iteration.color, fontSize: 18, fontWeight: 950, translate: "-50% -50%", boxShadow: `0 0 24px ${iteration.color}` }}>↔</div></div></React.Fragment>;
          })}
        </div>
      </Interactive.Div>

      <Interactive.Div name="迭代进度" style={{ position: "absolute", left: 82, right: 82, bottom: 57, display: "grid", gridTemplateColumns: `repeat(${normalizedCount}, 1fr)`, gap: 12 }}>
        {iterations.map((iteration, index) => {
          const start = revealFrames[index];
          const end = revealFrames[index + 1] ?? totalFrames;
          const fill = interpolate(frame, [start, Math.max(start + 1, end)], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return <div key={index} style={{ height: 5, overflow: "hidden", borderRadius: 99, backgroundColor: "rgba(255,255,255,.16)" }}><div style={{ width: `${fill}%`, height: "100%", borderRadius: 99, backgroundColor: iteration.color, boxShadow: `0 0 12px ${iteration.color}` }} /></div>;
        })}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitPromptIterationShowcaseEffectDef: EffectDef = {
  id: "PortraitPromptIterationShowcase",
  name: "竖屏口播·一句话连续改版",
  description: "复刻参考视频 57.933–76.800 秒：提示词输入条联动页面结果，连续切换摄影官网、深色后台和产品落地页。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "EDIT",
  placement: "top",
  component: PortraitPromptIterationShowcase as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 566,
  bounds: { x: 0, y: 0, width: 900, height: 760 },
  defaultPosition: { x: 90, y: 100, scale: 1 },
  defaultProps: {
    enabled: true, iterationCount: 3,
    iteration1Url: "", iteration1Prompt: "做一个摄影工作室的品牌官网", iteration1Badge: "品牌官网", iteration1Color: "#17D9E8",
    iteration2Url: "", iteration2Prompt: "改成数据后台，深色", iteration2Badge: "数据后台", iteration2Color: "#FF7A2F",
    iteration3Url: "", iteration3Prompt: "换成产品落地页", iteration3Badge: "产品落地页", iteration3Color: "#17D9E8",
    iteration4Url: "", iteration4Prompt: "继续调整第四版", iteration4Badge: "方案 04", iteration4Color: "#A36CFF",
    iteration5Url: "", iteration5Prompt: "继续调整第五版", iteration5Badge: "方案 05", iteration5Color: "#14E6A1",
    iteration6Url: "", iteration6Prompt: "继续调整第六版", iteration6Badge: "方案 06", iteration6Color: "#5986FF",
    iteration7Url: "", iteration7Prompt: "继续调整第七版", iteration7Badge: "方案 07", iteration7Color: "#FF9F43",
    iteration8Url: "", iteration8Prompt: "继续调整第八版", iteration8Badge: "方案 08", iteration8Color: "#FF5E8A",
    eyebrow: "HOW TO USE", title: "怎么用？", emphasis: "一句话，改一版", ghostNumber: "01", waitingText: "等待第一句话",
    eyebrowFontSize: 13, titleFontSize: 36, emphasisFontSize: 36, promptFontSize: 17, badgeFontSize: 12,
    firstResultSeconds: 3.1, iterationIntervalSeconds: 5.2, wipeDurationSeconds: 0.75,
    accentColor: "#17D9E8", emphasisColor: "#FFE326", panelColor: "#071017", textColor: "#F5F7FA",
    mediaFit: "cover", mediaPositionX: 50, mediaPositionY: 50, animationSeconds: 18.9,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示一句话连续改版", default: true },
    iterationCount: { type: "number", label: "改版数量", default: 3, min: 1, max: 8, step: 1 },
    iteration1Url: { type: "text", label: "改版一素材" }, iteration1Prompt: { type: "text", label: "改版一提示词" }, iteration1Badge: { type: "text", label: "改版一徽标" }, iteration1Color: { type: "color", label: "改版一强调色", default: "#17D9E8" },
    iteration2Url: { type: "text", label: "改版二素材" }, iteration2Prompt: { type: "text", label: "改版二提示词" }, iteration2Badge: { type: "text", label: "改版二徽标" }, iteration2Color: { type: "color", label: "改版二强调色", default: "#FF7A2F" },
    iteration3Url: { type: "text", label: "改版三素材" }, iteration3Prompt: { type: "text", label: "改版三提示词" }, iteration3Badge: { type: "text", label: "改版三徽标" }, iteration3Color: { type: "color", label: "改版三强调色", default: "#17D9E8" },
    iteration4Url: { type: "text", label: "改版四素材" }, iteration4Prompt: { type: "text", label: "改版四提示词" }, iteration4Badge: { type: "text", label: "改版四徽标" }, iteration4Color: { type: "color", label: "改版四强调色", default: "#A36CFF" },
    iteration5Url: { type: "text", label: "改版五素材" }, iteration5Prompt: { type: "text", label: "改版五提示词" }, iteration5Badge: { type: "text", label: "改版五徽标" }, iteration5Color: { type: "color", label: "改版五强调色", default: "#14E6A1" },
    iteration6Url: { type: "text", label: "改版六素材" }, iteration6Prompt: { type: "text", label: "改版六提示词" }, iteration6Badge: { type: "text", label: "改版六徽标" }, iteration6Color: { type: "color", label: "改版六强调色", default: "#5986FF" },
    iteration7Url: { type: "text", label: "改版七素材" }, iteration7Prompt: { type: "text", label: "改版七提示词" }, iteration7Badge: { type: "text", label: "改版七徽标" }, iteration7Color: { type: "color", label: "改版七强调色", default: "#FF9F43" },
    iteration8Url: { type: "text", label: "改版八素材" }, iteration8Prompt: { type: "text", label: "改版八提示词" }, iteration8Badge: { type: "text", label: "改版八徽标" }, iteration8Color: { type: "color", label: "改版八强调色", default: "#FF5E8A" },
    eyebrow: { type: "text", label: "顶部英文标题" }, title: { type: "text", label: "顶部主标题" }, emphasis: { type: "text", label: "顶部强调标题" }, ghostNumber: { type: "text", label: "背景编号" }, waitingText: { type: "text", label: "等待提示" },
    eyebrowFontSize: { type: "number", label: "英文标题字号(px)", default: 13, min: 8, max: 96, step: 1 }, titleFontSize: { type: "number", label: "主标题字号(px)", default: 36, min: 16, max: 120, step: 1 }, emphasisFontSize: { type: "number", label: "强调标题字号(px)", default: 36, min: 16, max: 120, step: 1 }, promptFontSize: { type: "number", label: "提示词字号(px)", default: 17, min: 10, max: 96, step: 1 }, badgeFontSize: { type: "number", label: "改版徽标字号(px)", default: 12, min: 8, max: 96, step: 1 },
    firstResultSeconds: { type: "number", label: "第一版出现时间(秒)", default: 3.1, min: 0, step: 0.1 }, iterationIntervalSeconds: { type: "number", label: "下一版切换间隔(秒)", default: 5.2, min: 0, step: 0.1 }, wipeDurationSeconds: { type: "number", label: "擦除动画时长(秒)", default: 0.75, min: 0.1, step: 0.05 },
    accentColor: { type: "color", label: "标题强调色", default: "#17D9E8" }, emphasisColor: { type: "color", label: "重点文字颜色", default: "#FFE326" }, panelColor: { type: "color", label: "底板颜色", default: "#071017" }, textColor: { type: "color", label: "文字颜色", default: "#F5F7FA" },
    mediaFit: { type: "select", label: "素材填充方式", default: "cover", options: [{ label: "裁剪填充", value: "cover" }, { label: "完整显示", value: "contain" }] }, mediaPositionX: { type: "number", label: "素材水平位置(%)", default: 50, min: 0, max: 100, step: 1 }, mediaPositionY: { type: "number", label: "素材垂直位置(%)", default: 50, min: 0, max: 100, step: 1 }, animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 18.9, min: 6, max: 60, step: 0.1 },
  },
};
