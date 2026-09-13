import React from "react";
import { Easing, Img, Interactive, interpolate, OffthreadVideo, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  titlePrefix?: string;
  titleHighlight?: string;
  browserLabel?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  mediaFit?: "cover" | "contain";
  mediaPositionX?: number;
  mediaPositionY?: number;
  titlePrefixFontSize?: number;
  titleHighlightFontSize?: number;
  browserLabelFontSize?: number;
  titleColor?: string;
  highlightColor?: string;
  frameColor?: string;
  browserBarColor?: string;
  browserLabelColor?: string;
  cornerRadius?: number;
  titleEnterSeconds?: number;
  mediaEnterSeconds?: number;
  animationSeconds?: number;
  muted?: boolean;
};

const isVideo = (url: string, mediaType?: string) => {
  if (mediaType === "video") return true;
  if (mediaType === "image") return false;
  return /\.(mp4|mov|webm|m4v|ogg)(?:\?.*)?$/iu.test(url);
};

export const PortraitAgentBrowserMedia: React.FC<Props> = ({
  enabled = true,
  titlePrefix = "Agent 自己开浏览器，",
  titleHighlight = "逐屏自查",
  browserLabel = "playwright · headed",
  mediaUrl = "",
  mediaType = "image",
  mediaFit = "cover",
  mediaPositionX = 50,
  mediaPositionY = 50,
  titlePrefixFontSize = 32,
  titleHighlightFontSize = 34,
  browserLabelFontSize = 15,
  titleColor = "#F6F3FF",
  highlightColor = "#638CFF",
  frameColor = "#1D2B4A",
  browserBarColor = "#171B29",
  browserLabelColor = "#7385AF",
  cornerRadius = 22,
  titleEnterSeconds = 0.55,
  mediaEnterSeconds = 0.95,
  animationSeconds = 3.52,
  muted = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;
  const videoMode = isVideo(mediaUrl, mediaType);

  return (
    <Interactive.Div name="浏览器媒体展示卡" data-effect="PortraitAgentBrowserMedia" style={{ position: "relative", width: 850, height: 800, color: titleColor, fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif', opacity: interpolate(frame, [0, fps * Math.max(0.2, animationSeconds * 0.18)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
      <Interactive.Div name="逐屏自查标题" style={{ position: "absolute", left: 90, top: 0, width: 670, minHeight: 82, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: "13px 30px", border: `1px solid color-mix(in srgb, ${frameColor} 86%, transparent)`, borderRadius: 999, backgroundColor: "rgba(7,9,17,0.78)", boxShadow: "0 12px 34px rgba(0,0,0,0.28)", opacity: interpolate(frame, [0, fps * Math.max(0.1, titleEnterSeconds)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [0, fps * Math.max(0.1, titleEnterSeconds)], ["0px -22px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
        <span style={{ color: titleColor, fontSize: titlePrefixFontSize, fontWeight: 850, whiteSpace: "nowrap" }}>{titlePrefix}</span>
        <span style={{ color: highlightColor, fontSize: titleHighlightFontSize, fontWeight: 900, whiteSpace: "nowrap", textShadow: `0 0 18px color-mix(in srgb, ${highlightColor} 35%, transparent)` }}>{titleHighlight}</span>
      </Interactive.Div>
      <Interactive.Div name="无按钮浏览器窗口" style={{ position: "absolute", left: 0, top: 112, width: 850, height: 688, overflow: "hidden", boxSizing: "border-box", border: `1px solid ${frameColor}`, borderRadius: cornerRadius, backgroundColor: "#04050A", boxShadow: "0 28px 80px rgba(0,0,0,0.48)", opacity: interpolate(frame, [fps * Math.max(0, mediaEnterSeconds * 0.35), fps * Math.max(0.2, mediaEnterSeconds)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), translate: interpolate(frame, [fps * Math.max(0, mediaEnterSeconds * 0.35), fps * Math.max(0.2, mediaEnterSeconds)], ["0px 34px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), scale: interpolate(frame, [fps * Math.max(0, mediaEnterSeconds * 0.35), fps * Math.max(0.2, mediaEnterSeconds)], [0.965, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({ damping: 200 }), output: "perceptual-scale" }) }}>
        <div style={{ height: 48, display: "flex", alignItems: "center", gap: 8, padding: "0 24px", boxSizing: "border-box", color: browserLabelColor, backgroundColor: browserBarColor, borderBottom: `1px solid color-mix(in srgb, ${frameColor} 72%, transparent)`, fontSize: browserLabelFontSize, fontWeight: 700, letterSpacing: 1.2 }}>
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF5A57", boxShadow: "0 0 8px rgba(255,90,87,0.24)" }} />
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FFBD2E", boxShadow: "0 0 8px rgba(255,189,46,0.22)" }} />
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28C840", boxShadow: "0 0 8px rgba(40,200,64,0.2)" }} />
          <span style={{ marginLeft: 7 }}>{browserLabel}</span>
        </div>
        <Interactive.Div name="上传的网页画面" style={{ position: "absolute", left: 0, right: 0, top: 48, bottom: 0, overflow: "hidden", backgroundColor: "#05060A" }}>
          {mediaUrl ? (
            videoMode ? (
              <OffthreadVideo src={mediaUrl} muted={muted} style={{ width: "100%", height: "100%", objectFit: mediaFit, objectPosition: `${mediaPositionX}% ${mediaPositionY}%` }} />
            ) : (
              <Img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: mediaFit, objectPosition: `${mediaPositionX}% ${mediaPositionY}%` }} />
            )
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.36)", background: "linear-gradient(135deg, #080A12 0%, #101526 50%, #070810 100%)", fontSize: 19, fontWeight: 700, letterSpacing: 0.8 }}>在右侧上传图片或视频</div>
          )}
        </Interactive.Div>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitAgentBrowserMediaEffectDef: EffectDef = {
  id: "PortraitAgentBrowserMedia",
  name: "浏览器媒体展示卡",
  description: "顶部标题胶囊加可上传图片或视频的浏览器画面；不包含蓝色扫线、交通灯按钮或其他绿色按钮。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "BROWSER",
  placement: "top",
  component: PortraitAgentBrowserMedia as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 106,
  bounds: { x: 0, y: 0, width: 850, height: 800 },
  defaultPosition: { x: 115, y: 230, scale: 1 },
  defaultProps: { enabled: true, titlePrefix: "Agent 自己开浏览器，", titleHighlight: "逐屏自查", browserLabel: "playwright · headed", mediaUrl: "", mediaType: "image", mediaFit: "cover", mediaPositionX: 50, mediaPositionY: 50, titlePrefixFontSize: 32, titleHighlightFontSize: 34, browserLabelFontSize: 15, titleColor: "#F6F3FF", highlightColor: "#638CFF", frameColor: "#1D2B4A", browserBarColor: "#171B29", browserLabelColor: "#7385AF", cornerRadius: 22, titleEnterSeconds: 0.55, mediaEnterSeconds: 0.95, animationSeconds: 3.52 },
  propsSchema: {
    enabled: { type: "boolean", label: "显示浏览器逐屏自查", default: true }, titlePrefix: { type: "text", label: "标题前半句" }, titleHighlight: { type: "text", label: "标题强调词" }, browserLabel: { type: "text", label: "浏览器栏文字" },
    mediaUrl: { type: "text", label: "网页图片或视频" }, mediaType: { type: "select", label: "素材类型", default: "image", options: [{ label: "图片", value: "image" }, { label: "视频", value: "video" }] }, mediaFit: { type: "select", label: "素材填充方式", default: "cover", options: [{ label: "裁剪填充", value: "cover" }, { label: "完整显示", value: "contain" }] }, mediaPositionX: { type: "number", label: "素材水平位置(%)", default: 50, min: 0, max: 100, step: 1 }, mediaPositionY: { type: "number", label: "素材垂直位置(%)", default: 50, min: 0, max: 100, step: 1 },
    titlePrefixFontSize: { type: "number", label: "标题前半句字号(px)", default: 32, min: 10, max: 120, step: 1 }, titleHighlightFontSize: { type: "number", label: "标题强调词字号(px)", default: 34, min: 10, max: 120, step: 1 }, browserLabelFontSize: { type: "number", label: "浏览器栏字号(px)", default: 15, min: 8, max: 72, step: 1 },
    titleColor: { type: "color", label: "标题颜色", default: "#F6F3FF" }, highlightColor: { type: "color", label: "强调词颜色", default: "#638CFF" }, frameColor: { type: "color", label: "浏览器边框颜色", default: "#1D2B4A" }, browserBarColor: { type: "color", label: "浏览器栏底色", default: "#171B29" }, browserLabelColor: { type: "color", label: "浏览器栏文字颜色", default: "#7385AF" }, cornerRadius: { type: "number", label: "浏览器圆角(px)", default: 22, min: 0, max: 80, step: 1 },
    titleEnterSeconds: { type: "number", label: "标题入场时间(秒)", default: 0.55, min: 0.1, step: 0.1 }, mediaEnterSeconds: { type: "number", label: "媒体窗口入场时间(秒)", default: 0.95, min: 0.1, step: 0.1 }, animationSeconds: { type: "number", label: "完整动画时长(秒)", default: 3.52, min: 1, max: 120, step: 0.1 },
  },
};
