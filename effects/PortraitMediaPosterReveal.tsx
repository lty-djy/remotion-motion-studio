import React from "react";
import {
  Easing,
  Img,
  Interactive,
  interpolate,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  mediaFit?: "cover" | "contain";
  mediaPositionX?: number;
  mediaPositionY?: number;
  title?: string;
  accentColor?: string;
  titleColor?: string;
  placeholderColor?: string;
  cornerRadius?: number;
  titleFontSize?: number;
  enterDelaySeconds?: number;
  enterDurationSeconds?: number;
  slideDistance?: number;
  videoMuted?: boolean;
  videoVolume?: number;
  videoLoop?: boolean;
  animationSeconds?: number;
};

const isVideo = (url: string, mediaType?: string) => {
  if (mediaType === "video") return true;
  if (mediaType === "image") return false;
  return /\.(mp4|mov|webm|m4v|ogg)(?:\?.*)?$/iu.test(url);
};

export const PortraitMediaPosterReveal: React.FC<Props> = ({
  enabled = true,
  mediaUrl = "",
  mediaType = "image",
  mediaFit = "contain",
  mediaPositionX = 50,
  mediaPositionY = 50,
  title = "Codex+Obsidian 素材库",
  accentColor = "#F4A12C",
  titleColor = "#FFFFFF",
  placeholderColor = "#17181D",
  cornerRadius = 22,
  titleFontSize = 31,
  enterDelaySeconds = 0.12,
  enterDurationSeconds = 0.46,
  slideDistance = 280,
  videoMuted = true,
  videoVolume = 0.55,
  videoLoop = true,
  animationSeconds = 3.9,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!enabled) return null;
  const videoMode = isVideo(mediaUrl, mediaType);

  return (
    <Interactive.Div
      name="右滑媒体海报"
      data-effect="PortraitMediaPosterReveal"
      style={{
        position: "relative",
        width: 560,
        height: 790,
        color: titleColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        opacity: interpolate(
          frame,
          [fps * Math.max(0, enterDelaySeconds), fps * Math.max(0.12, enterDelaySeconds + enterDurationSeconds * 0.62)],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        ),
        translate: interpolate(
          frame,
          [fps * Math.max(0, enterDelaySeconds), fps * Math.max(0.12, enterDelaySeconds + enterDurationSeconds)],
          [`${-Math.abs(slideDistance)}px 0px`, "0px 0px"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        ),
        rotate: interpolate(
          frame,
          [fps * Math.max(0, enterDelaySeconds), fps * Math.max(0.12, enterDelaySeconds + enterDurationSeconds)],
          ["-4.5deg", "0deg"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        ),
        scale: interpolate(
          frame,
          [fps * Math.max(0, enterDelaySeconds), fps * Math.max(0.12, enterDelaySeconds + enterDurationSeconds)],
          [0.96, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          },
        ),
        transformOrigin: "50% 54%",
      }}
    >
      <Interactive.Div
        name="竖版媒体画面"
        style={{
          position: "absolute",
          left: 20,
          top: 0,
          width: 520,
          height: 680,
          overflow: "hidden",
          boxSizing: "border-box",
          border: "1px solid rgba(255,255,255,0.32)",
          borderRadius: cornerRadius,
          backgroundColor: placeholderColor,
          boxShadow: "0 28px 64px rgba(0,0,0,0.34), 0 5px 14px rgba(0,0,0,0.18)",
        }}
      >
        {mediaUrl ? (
          videoMode ? (
            <OffthreadVideo
              src={mediaUrl}
              muted={videoMuted}
              volume={Math.min(1, Math.max(0, videoVolume))}
              loop={videoLoop}
              style={{
                width: "100%",
                height: "100%",
                objectFit: mediaFit,
                objectPosition: `${mediaPositionX}% ${mediaPositionY}%`,
                backgroundColor: placeholderColor,
              }}
            />
          ) : (
            <Img
              src={mediaUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: mediaFit,
                objectPosition: `${mediaPositionX}% ${mediaPositionY}%`,
                backgroundColor: placeholderColor,
              }}
            />
          )
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              boxSizing: "border-box",
              padding: 48,
              color: "rgba(255,255,255,0.5)",
              background:
                "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.1), transparent 34%), linear-gradient(145deg, #24252B 0%, #111217 100%)",
              fontSize: 20,
              fontWeight: 750,
              lineHeight: 1.5,
              letterSpacing: 0.8,
              textAlign: "center",
            }}
          >
            在右侧上传图片或视频
          </div>
        )}
      </Interactive.Div>

      <Interactive.Div
        name="媒体海报标题"
        style={{
          position: "absolute",
          left: 20,
          top: 714,
          width: 520,
          minHeight: 50,
          display: "flex",
          alignItems: "center",
          gap: 17,
          opacity: interpolate(
            frame,
            [fps * Math.max(0, enterDelaySeconds + enterDurationSeconds * 0.42), fps * Math.max(0.16, enterDelaySeconds + enterDurationSeconds + 0.12)],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          translate: interpolate(
            frame,
            [fps * Math.max(0, enterDelaySeconds + enterDurationSeconds * 0.42), fps * Math.max(0.16, enterDelaySeconds + enterDurationSeconds + 0.12)],
            ["-34px 0px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 44,
            flex: "0 0 auto",
            borderRadius: 999,
            backgroundColor: accentColor,
            boxShadow: `0 0 18px color-mix(in srgb, ${accentColor} 35%, transparent)`,
          }}
        />
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            color: titleColor,
            fontSize: titleFontSize,
            fontWeight: 820,
            lineHeight: 1.18,
            letterSpacing: -0.5,
            textOverflow: "ellipsis",
            textShadow: "0 3px 12px rgba(0,0,0,0.68)",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const PortraitMediaPosterRevealEffectDef: EffectDef = {
  id: "PortraitMediaPosterReveal",
  name: "竖屏口播·右滑媒体海报",
  description:
    "参考右侧竖版海报效果：图片或视频从左侧快速滑入并归正，底部带强调竖线标题。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "POSTER",
  placement: "right",
  component: PortraitMediaPosterReveal as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 117,
  bounds: { x: 0, y: 0, width: 560, height: 790 },
  defaultPosition: { x: 455, y: 360, scale: 1 },
  defaultProps: {
    enabled: true,
    mediaUrl: "",
    mediaType: "image",
    mediaFit: "contain",
    mediaPositionX: 50,
    mediaPositionY: 50,
    title: "Codex+Obsidian 素材库",
    accentColor: "#F4A12C",
    titleColor: "#FFFFFF",
    placeholderColor: "#17181D",
    cornerRadius: 22,
    titleFontSize: 31,
    enterDelaySeconds: 0.12,
    enterDurationSeconds: 0.46,
    slideDistance: 280,
    videoMuted: true,
    videoVolume: 0.55,
    videoLoop: true,
    animationSeconds: 3.9,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示右滑媒体海报", default: true },
    mediaUrl: { type: "text", label: "海报图片或视频" },
    mediaType: {
      type: "select",
      label: "素材类型",
      default: "image",
      options: [
        { label: "图片", value: "image" },
        { label: "视频", value: "video" },
      ],
    },
    mediaFit: {
      type: "select",
      label: "素材填充方式",
      default: "contain",
      options: [
        { label: "完整显示", value: "contain" },
        { label: "裁剪填充", value: "cover" },
      ],
    },
    mediaPositionX: { type: "number", label: "裁剪水平位置(%)", default: 50, min: 0, max: 100, step: 1 },
    mediaPositionY: { type: "number", label: "裁剪垂直位置(%)", default: 50, min: 0, max: 100, step: 1 },
    title: { type: "text", label: "底部标题" },
    accentColor: { type: "color", label: "标题竖线颜色", default: "#F4A12C" },
    titleColor: { type: "color", label: "标题颜色", default: "#FFFFFF" },
    placeholderColor: { type: "color", label: "素材底色", default: "#17181D" },
    cornerRadius: { type: "number", label: "海报圆角(px)", default: 22, min: 0, max: 80, step: 1 },
    titleFontSize: { type: "number", label: "标题字号(px)", default: 31, min: 12, max: 72, step: 1 },
    enterDelaySeconds: { type: "number", label: "入场延迟(秒)", default: 0.12, min: 0, max: 10, step: 0.05 },
    enterDurationSeconds: { type: "number", label: "滑入时长(秒)", default: 0.46, min: 0.12, max: 3, step: 0.05 },
    slideDistance: { type: "number", label: "滑入距离(px)", default: 280, min: 40, max: 800, step: 10 },
    videoMuted: { type: "boolean", label: "视频静音", default: true },
    videoVolume: { type: "number", label: "视频音量", default: 0.55, min: 0, max: 1, step: 0.05 },
    videoLoop: { type: "boolean", label: "视频循环播放", default: true },
    animationSeconds: { type: "number", label: "建议完整时长(秒)", default: 3.9, min: 1, max: 120, step: 0.1 },
  },
};
