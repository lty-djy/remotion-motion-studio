import React from "react";
import {
  Easing,
  Img,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  backgroundOpacity?: number;
  materialCount?: number;
  material1Url?: string; material1Eyebrow?: string; material1Title?: string; material1Detail?: string; material1Color?: string;
  material2Url?: string; material2Eyebrow?: string; material2Title?: string; material2Detail?: string; material2Color?: string;
  material3Url?: string; material3Eyebrow?: string; material3Title?: string; material3Detail?: string; material3Color?: string;
  material4Url?: string; material4Eyebrow?: string; material4Title?: string; material4Detail?: string; material4Color?: string;
  material5Url?: string; material5Eyebrow?: string; material5Title?: string; material5Detail?: string; material5Color?: string;
  material6Url?: string; material6Eyebrow?: string; material6Title?: string; material6Detail?: string; material6Color?: string;
  material7Url?: string; material7Eyebrow?: string; material7Title?: string; material7Detail?: string; material7Color?: string;
  material8Url?: string; material8Eyebrow?: string; material8Title?: string; material8Detail?: string; material8Color?: string;
  eyebrowFontSize?: number;
  titleFontSize?: number;
  detailFontSize?: number;
  browserLabelFontSize?: number;
  firstSwitchSeconds?: number;
  materialIntervalSeconds?: number;
  wipeDurationSeconds?: number;
  panelColor?: string;
  textColor?: string;
  mediaFit?: "cover" | "contain";
  mediaPositionX?: number;
  mediaPositionY?: number;
  animationSeconds?: number;
};

type StageVisualProps = {
  mediaUrl: string;
  kind: "before" | "after" | "alternate";
  label: string;
  accentColor: string;
  labelFontSize: number;
  mediaFit: "cover" | "contain";
  mediaPositionX: number;
  mediaPositionY: number;
};

const StageVisual: React.FC<StageVisualProps> = ({
  mediaUrl,
  kind,
  label,
  accentColor,
  labelFontSize,
  mediaFit,
  mediaPositionX,
  mediaPositionY,
}) => (
  <Interactive.Div
    name={`${label}案例画面`}
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      backgroundColor: kind === "before" ? "#EEF3F8" : "#090D10",
    }}
  >
    {mediaUrl ? (
      <Img
        src={mediaUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: mediaFit,
          objectPosition: `${mediaPositionX}% ${mediaPositionY}%`,
        }}
      />
    ) : kind === "before" ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #7249FA 0%, #00C9F7 100%)",
        }}
      >
        <div style={{ width: 310, textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 18, fontWeight: 850 }}>NOVA HARTMAN STUDIO</div>
          <div style={{ marginTop: 8, fontSize: 9, opacity: 0.74 }}>CREATIVE PORTFOLIO TEMPLATE</div>
          <div style={{ width: 92, height: 92, margin: "34px auto 24px", borderRadius: 10, background: "rgba(255,255,255,.74)", boxShadow: "0 14px 30px rgba(20,20,60,.25)" }} />
          <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
            {[0, 1, 2].map((item) => (
              <div key={item} style={{ width: 92, height: 50, borderRadius: 7, background: "rgba(255,255,255,.3)" }} />
            ))}
          </div>
        </div>
      </div>
    ) : kind === "after" ? (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "linear-gradient(115deg, #102718 0%, #7B8B7A 42%, #D8DED7 100%)" }}>
        <div style={{ position: "absolute", inset: "0 58% 0 0", background: "linear-gradient(155deg, rgba(3,18,12,.2), rgba(3,13,9,.84))" }} />
        <div style={{ position: "absolute", left: 34, bottom: 35, color: "#F5F2E9", fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 48, lineHeight: 0.94, letterSpacing: 2 }}>光<br />之<br />间</div>
        <div style={{ position: "absolute", left: 340, right: -85, bottom: -42, height: 238, borderRadius: "48% 42% 10% 10%", background: "linear-gradient(180deg, #FFB329, #D86316 58%, #643115)", boxShadow: "0 -8px 34px rgba(255,158,40,.28)" }} />
        <div style={{ position: "absolute", left: 442, bottom: 72, width: 112, height: 82, borderRadius: "52% 48% 22% 22%", border: "8px solid #37271C", background: "linear-gradient(140deg, #BBE4F1, #263D46)" }} />
        <div style={{ position: "absolute", left: 326, bottom: 8, width: 84, height: 84, borderRadius: "50%", border: "13px solid #1D1E1B", background: "#BFC1B8" }} />
        <div style={{ position: "absolute", right: 92, bottom: 8, width: 84, height: 84, borderRadius: "50%", border: "13px solid #1D1E1B", background: "#BFC1B8" }} />
      </div>
    ) : (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "radial-gradient(circle at 78% 38%, rgba(255,179,0,.65), transparent 28%), linear-gradient(115deg, #1B1510, #6F2D16 52%, #E58D18)" }}>
        <div style={{ position: "absolute", left: 42, top: 62, width: 315, color: "#FFF3D7", fontSize: 46, fontWeight: 900, lineHeight: 0.92, letterSpacing: -1.2 }}>Every<br />frame,<br />on the<br />beat.</div>
        <div style={{ position: "absolute", left: 48, bottom: 54, width: 120, height: 18, borderRadius: 999, background: "#DFFF00" }} />
        <div style={{ position: "absolute", right: 55, top: 92, width: 300, height: 190, border: "1px solid rgba(255,255,255,.26)", borderRadius: 8, background: "linear-gradient(140deg, #060606, #421850)", boxShadow: "0 24px 45px rgba(0,0,0,.45)" }}>
          <div style={{ height: 74, margin: 18, borderRadius: 5, background: "linear-gradient(90deg, #E43B63, #4A1595 50%, #00B6CE)" }} />
          <div style={{ height: 4, margin: "0 18px", borderRadius: 99, background: "linear-gradient(90deg, #DFFF00 46%, rgba(255,255,255,.16) 46%)" }} />
        </div>
      </div>
    )}
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        padding: "6px 12px",
        borderRadius: 999,
        color: kind === "before" ? "#FFFFFF" : "#061014",
        backgroundColor: accentColor,
        boxShadow: `0 0 20px color-mix(in srgb, ${accentColor} 42%, transparent)`,
        fontSize: labelFontSize,
        fontWeight: 900,
      }}
    >
      {label}
    </div>
  </Interactive.Div>
);

export const PortraitSkillResultComparison: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  materialCount = 3,
  material1Url = "", material1Eyebrow = "WITHOUT THE SKILL", material1Title = "没装它", material1Detail = "AI 随手做出来的默认效果", material1Color = "#FF7F67",
  material2Url = "", material2Eyebrow = "WITH THE SKILL", material2Title = "装了它", material2Detail = "同一个 AI，同一句话", material2Color = "#17D9E8",
  material3Url = "", material3Eyebrow = "ANOTHER INDUSTRY", material3Title = "换个行业", material3Detail = "质感照样稳定", material3Color = "#FFE326",
  material4Url = "", material4Eyebrow = "CASE 04", material4Title = "补充案例 4", material4Detail = "按需上传素材", material4Color = "#A36CFF",
  material5Url = "", material5Eyebrow = "CASE 05", material5Title = "补充案例 5", material5Detail = "按需上传素材", material5Color = "#14E6A1",
  material6Url = "", material6Eyebrow = "CASE 06", material6Title = "补充案例 6", material6Detail = "按需上传素材", material6Color = "#5986FF",
  material7Url = "", material7Eyebrow = "CASE 07", material7Title = "补充案例 7", material7Detail = "按需上传素材", material7Color = "#FF9F43",
  material8Url = "", material8Eyebrow = "CASE 08", material8Title = "补充案例 8", material8Detail = "按需上传素材", material8Color = "#FF5E8A",
  eyebrowFontSize = 13,
  titleFontSize = 42,
  detailFontSize = 16,
  browserLabelFontSize = 12,
  firstSwitchSeconds = 3.1,
  materialIntervalSeconds = 3.5,
  wipeDurationSeconds = 0.75,
  panelColor = "#071017",
  textColor = "#F5F7FA",
  mediaFit = "cover",
  mediaPositionX = 50,
  mediaPositionY = 50,
  animationSeconds = 9.1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;

  const normalizedMaterialCount = Math.min(8, Math.max(1, Math.round(materialCount)));
  const totalFrames = Math.max(90, Math.round(animationSeconds * fps));
  const firstSwitchFrame = Math.max(0, firstSwitchSeconds * fps);
  const intervalFrames = Math.max(0, materialIntervalSeconds * fps);
  const wipeFrames = Math.max(5, wipeDurationSeconds * fps);
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const stageProps = [
    { mediaUrl: material1Url, eyebrow: material1Eyebrow, title: material1Title, detail: material1Detail, accent: material1Color },
    { mediaUrl: material2Url, eyebrow: material2Eyebrow, title: material2Title, detail: material2Detail, accent: material2Color },
    { mediaUrl: material3Url, eyebrow: material3Eyebrow, title: material3Title, detail: material3Detail, accent: material3Color },
    { mediaUrl: material4Url, eyebrow: material4Eyebrow, title: material4Title, detail: material4Detail, accent: material4Color },
    { mediaUrl: material5Url, eyebrow: material5Eyebrow, title: material5Title, detail: material5Detail, accent: material5Color },
    { mediaUrl: material6Url, eyebrow: material6Eyebrow, title: material6Title, detail: material6Detail, accent: material6Color },
    { mediaUrl: material7Url, eyebrow: material7Eyebrow, title: material7Title, detail: material7Detail, accent: material7Color },
    { mediaUrl: material8Url, eyebrow: material8Eyebrow, title: material8Title, detail: material8Detail, accent: material8Color },
  ].slice(0, normalizedMaterialCount);
  const revealFrames = stageProps.map((_, index) =>
    index === 0 ? 0 : firstSwitchFrame + (index - 1) * intervalFrames,
  );

  return (
    <Interactive.Div
      name="Skill 效果前后对比"
      data-effect="PortraitSkillResultComparison"
      style={{
        position: "relative",
        width: 900,
        height: 650,
        overflow: "hidden",
        boxSizing: "border-box",
        border: bgFactor > 0 ? `1px solid color-mix(in srgb, ${stageProps[1]?.accent ?? stageProps[0].accent} 20%, transparent)` : "1px solid transparent",
        borderRadius: 28,
        color: textColor,
        backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(94 * bgFactor)}%, transparent)`,
        boxShadow: bgFactor > 0 ? `0 24px 70px rgba(0,0,0,${0.44 * bgFactor})` : "none",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
        opacity: interpolate(frame, [0, fps * 0.5], [0, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [0, fps * 0.6], ["0px 28px", "0px 0px"], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      {stageProps.map((stage, index) => {
        const previousStart = revealFrames[index];
        const nextStart = revealFrames[index + 1] ?? totalFrames + fps;
        return (
          <Interactive.Div
            key={`${index}-${stage.eyebrow}`}
            name={`阶段标题 ${index + 1}`}
            style={{
              position: "absolute",
              top: 42,
              left: 48,
              right: 48,
              opacity:
                index === 0
                  ? interpolate(frame, [nextStart - fps * 0.12, nextStart + fps * 0.12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
                  : interpolate(frame, [previousStart - fps * 0.12, previousStart + fps * 0.12, nextStart - fps * 0.12, nextStart + fps * 0.12], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translate: interpolate(frame, [previousStart - fps * 0.12, previousStart + fps * 0.2], ["0px 12px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
            }}
          >
            <div style={{ color: stage.accent, fontSize: eyebrowFontSize, fontWeight: 850, letterSpacing: 3 }}>{stage.eyebrow}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 9 }}>
              <span style={{ fontSize: titleFontSize, fontWeight: 950, letterSpacing: -1 }}>{stage.title}</span>
              <span style={{ color: `color-mix(in srgb, ${textColor} 62%, transparent)`, fontSize: detailFontSize, fontWeight: 650 }}>{stage.detail}</span>
            </div>
          </Interactive.Div>
        );
      })}

      <Interactive.Div
        name="浏览器案例舞台"
        style={{
          position: "absolute",
          top: 155,
          left: 48,
          width: 804,
          height: 440,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,.24)",
          borderRadius: 16,
          backgroundColor: "#090D10",
          boxShadow: "0 28px 58px rgba(0,0,0,.46)",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 34, zIndex: 20, display: "flex", alignItems: "center", gap: 7, padding: "0 14px", borderBottom: "1px solid rgba(255,255,255,.12)", background: "rgba(5,8,12,.94)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#FF665C" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#FFBE45" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#34D17B" }} />
          <span style={{ width: 230, height: 12, marginLeft: 8, borderRadius: 99, backgroundColor: "rgba(255,255,255,.08)" }} />
        </div>
        <div style={{ position: "absolute", inset: "34px 0 0" }}>
          <StageVisual mediaUrl={stageProps[0].mediaUrl} kind="before" label={stageProps[0].title} accentColor={stageProps[0].accent} labelFontSize={browserLabelFontSize} mediaFit={mediaFit} mediaPositionX={mediaPositionX} mediaPositionY={mediaPositionY} />
          {stageProps.slice(1).map((stage, overlayIndex) => {
            const index = overlayIndex + 1;
            const start = revealFrames[index];
            const progress = interpolate(frame, [start, start + wipeFrames], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.65, 0, 0.35, 1) });
            const layerZIndex = index * 2;
            return (
              <React.Fragment key={`${index}-${stage.title}`}>
                <div style={{ position: "absolute", inset: 0, zIndex: layerZIndex, clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)` }}>
                  <StageVisual mediaUrl={stage.mediaUrl} kind={index % 2 === 1 ? "after" : "alternate"} label={stage.title} accentColor={stage.accent} labelFontSize={browserLabelFontSize} mediaFit={mediaFit} mediaPositionX={mediaPositionX} mediaPositionY={mediaPositionY} />
                </div>
                <div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(${progress}% - 2px)`, zIndex: layerZIndex + 1, width: 4, backgroundColor: stage.accent, boxShadow: `0 0 24px 7px ${stage.accent}`, opacity: interpolate(frame, [start, start + fps * 0.08, start + wipeFrames - fps * 0.08, start + wipeFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                  <div style={{ position: "absolute", top: "50%", left: "50%", display: "grid", width: 34, height: 34, placeItems: "center", borderRadius: "50%", color: "#061014", backgroundColor: stage.accent, fontSize: 18, fontWeight: 950, translate: "-50% -50%", boxShadow: `0 0 24px ${stage.accent}` }}>↔</div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitSkillResultComparisonEffectDef: EffectDef = {
  id: "PortraitSkillResultComparison",
  name: "Skill 效果前后对比",
  description: "复刻参考视频 47.733–56.800 秒：默认效果擦除到 Skill 优化效果，再切换另一行业案例。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "A/B",
  placement: "top",
  component: PortraitSkillResultComparison as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 272,
  bounds: { x: 0, y: 0, width: 900, height: 650 },
  defaultPosition: { x: 90, y: 120, scale: 1 },
  defaultProps: {
    enabled: true,
    materialCount: 3,
    material1Url: "", material1Eyebrow: "WITHOUT THE SKILL", material1Title: "没装它", material1Detail: "AI 随手做出来的默认效果", material1Color: "#FF7F67",
    material2Url: "", material2Eyebrow: "WITH THE SKILL", material2Title: "装了它", material2Detail: "同一个 AI，同一句话", material2Color: "#17D9E8",
    material3Url: "", material3Eyebrow: "ANOTHER INDUSTRY", material3Title: "换个行业", material3Detail: "质感照样稳定", material3Color: "#FFE326",
    material4Url: "", material4Eyebrow: "CASE 04", material4Title: "补充案例 4", material4Detail: "按需上传素材", material4Color: "#A36CFF",
    material5Url: "", material5Eyebrow: "CASE 05", material5Title: "补充案例 5", material5Detail: "按需上传素材", material5Color: "#14E6A1",
    material6Url: "", material6Eyebrow: "CASE 06", material6Title: "补充案例 6", material6Detail: "按需上传素材", material6Color: "#5986FF",
    material7Url: "", material7Eyebrow: "CASE 07", material7Title: "补充案例 7", material7Detail: "按需上传素材", material7Color: "#FF9F43",
    material8Url: "", material8Eyebrow: "CASE 08", material8Title: "补充案例 8", material8Detail: "按需上传素材", material8Color: "#FF5E8A",
    eyebrowFontSize: 13,
    titleFontSize: 42,
    detailFontSize: 16,
    browserLabelFontSize: 12,
    firstSwitchSeconds: 3.1,
    materialIntervalSeconds: 3.5,
    wipeDurationSeconds: 0.75,
    panelColor: "#071017",
    textColor: "#F5F7FA",
    mediaFit: "cover",
    mediaPositionX: 50,
    mediaPositionY: 50,
    animationSeconds: 9.1,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示效果前后对比", default: true },
    materialCount: { type: "number", label: "素材数量", default: 3, min: 1, max: 8, step: 1 },
    material1Url: { type: "text", label: "素材一" }, material1Eyebrow: { type: "text", label: "素材一英文标题" }, material1Title: { type: "text", label: "素材一主标题" }, material1Detail: { type: "text", label: "素材一说明" }, material1Color: { type: "color", label: "素材一强调色", default: "#FF7F67" },
    material2Url: { type: "text", label: "素材二" }, material2Eyebrow: { type: "text", label: "素材二英文标题" }, material2Title: { type: "text", label: "素材二主标题" }, material2Detail: { type: "text", label: "素材二说明" }, material2Color: { type: "color", label: "素材二强调色", default: "#17D9E8" },
    material3Url: { type: "text", label: "素材三" }, material3Eyebrow: { type: "text", label: "素材三英文标题" }, material3Title: { type: "text", label: "素材三主标题" }, material3Detail: { type: "text", label: "素材三说明" }, material3Color: { type: "color", label: "素材三强调色", default: "#FFE326" },
    material4Url: { type: "text", label: "素材四" }, material4Eyebrow: { type: "text", label: "素材四英文标题" }, material4Title: { type: "text", label: "素材四主标题" }, material4Detail: { type: "text", label: "素材四说明" }, material4Color: { type: "color", label: "素材四强调色", default: "#A36CFF" },
    material5Url: { type: "text", label: "素材五" }, material5Eyebrow: { type: "text", label: "素材五英文标题" }, material5Title: { type: "text", label: "素材五主标题" }, material5Detail: { type: "text", label: "素材五说明" }, material5Color: { type: "color", label: "素材五强调色", default: "#14E6A1" },
    material6Url: { type: "text", label: "素材六" }, material6Eyebrow: { type: "text", label: "素材六英文标题" }, material6Title: { type: "text", label: "素材六主标题" }, material6Detail: { type: "text", label: "素材六说明" }, material6Color: { type: "color", label: "素材六强调色", default: "#5986FF" },
    material7Url: { type: "text", label: "素材七" }, material7Eyebrow: { type: "text", label: "素材七英文标题" }, material7Title: { type: "text", label: "素材七主标题" }, material7Detail: { type: "text", label: "素材七说明" }, material7Color: { type: "color", label: "素材七强调色", default: "#FF9F43" },
    material8Url: { type: "text", label: "素材八" }, material8Eyebrow: { type: "text", label: "素材八英文标题" }, material8Title: { type: "text", label: "素材八主标题" }, material8Detail: { type: "text", label: "素材八说明" }, material8Color: { type: "color", label: "素材八强调色", default: "#FF5E8A" },
    eyebrowFontSize: { type: "number", label: "英文标题字号(px)", default: 13, min: 8, max: 96, step: 1 },
    titleFontSize: { type: "number", label: "主标题字号(px)", default: 42, min: 16, max: 120, step: 1 },
    detailFontSize: { type: "number", label: "说明字号(px)", default: 16, min: 10, max: 96, step: 1 },
    browserLabelFontSize: { type: "number", label: "案例徽标字号(px)", default: 12, min: 8, max: 96, step: 1 },
    firstSwitchSeconds: { type: "number", label: "第二张素材切换时间(秒)", default: 3.1, min: 0, step: 0.1 },
    materialIntervalSeconds: { type: "number", label: "下一张素材切换间隔(秒)", default: 3.5, min: 0, step: 0.1 },
    wipeDurationSeconds: { type: "number", label: "擦除动画时长(秒)", default: 0.75, min: 0.1, step: 0.05 },
    panelColor: { type: "color", label: "底板颜色", default: "#071017" },
    textColor: { type: "color", label: "文字颜色", default: "#F5F7FA" },
    mediaFit: { type: "select", label: "素材填充方式", default: "cover", options: [{ label: "裁剪填充", value: "cover" }, { label: "完整显示", value: "contain" }] },
    mediaPositionX: { type: "number", label: "素材水平位置(%)", default: 50, min: 0, max: 100, step: 1 },
    mediaPositionY: { type: "number", label: "素材垂直位置(%)", default: 50, min: 0, max: 100, step: 1 },
    animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 9.1, min: 4, max: 30, step: 0.1 },
  },
};
