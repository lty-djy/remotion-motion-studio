import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  OffthreadVideo,
} from "remotion";
import type { EffectDef } from "../registry";

export type MediaSpotlightCardProps = {
  enabled?: boolean;
  backgroundOpacity?: number;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  caption?: string;
  eyebrow?: string;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  cornerRadius?: number;
  fit?: "cover" | "contain";
  mediaPositionX?: number;
  mediaPositionY?: number;
  showCaption?: boolean;
  showEyebrow?: boolean;
  showAccentMarker?: boolean;
  animationSeconds?: number;
};

const isVideoType = (url: string, mediaType?: string) => {
  if (mediaType === "image") return false;
  if (mediaType === "video") return true;
  return /\.(mp4|mov|webm|m4v|ogg)$/i.test(url);
};

export const MediaSpotlightCard: React.FC<MediaSpotlightCardProps> = ({
  backgroundOpacity = 0,
  enabled = true,
  mediaUrl = "",
  mediaType,
  caption = "上传你的素材",
  eyebrow = "MEDIA",
  accentColor = "#FF4B25",
  panelColor = "#0E0F14",
  textColor = "#FFFFFF",
  cornerRadius = 20,
  fit = "cover",
  mediaPositionX = 50,
  mediaPositionY = 50,
  showCaption = true,
  showEyebrow = true,
  showAccentMarker = true,
  animationSeconds = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(10, Math.round(animationSeconds * fps));

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));
  const hasMedia = Boolean(mediaUrl);
  const videoMode = isVideoType(mediaUrl, mediaType);

  const cardEnter = interpolate(frame, [0, enterFrames], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mediaEnter = interpolate(
    frame,
    [enterFrames * 0.22, enterFrames * 0.82],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const captionEnter = interpolate(
    frame,
    [enterFrames * 0.5, enterFrames],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <Interactive.Div
      name="媒体聚焦卡"
      data-effect="MediaSpotlightCard"
      style={{
        position: "relative",
        width: 480,
        height: 480,
        color: textColor,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        opacity: cardEnter,
        transform: `translateY(${((1 - cardEnter) * 48).toFixed(1)}px) scale(${(0.9 + cardEnter * 0.1).toFixed(3)})`,
        transformOrigin: "50% 100%",
      }}
    >
      {/* 引导词 */}
      {showEyebrow ? (
        <Interactive.Div
        name="媒体引导词"
        style={{
          display: "inline-block",
          marginBottom: 12,
          padding: "5px 14px",
          borderRadius: 999,
          border: `1px solid ${accentColor}55`,
          backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
          color: accentColor,
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 2,
          opacity: interpolate(frame, [0, enterFrames * 0.4], [0, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {eyebrow}
        </Interactive.Div>
      ) : null}

      {/* 卡片主体 */}
      <Interactive.Div
        name="媒体卡主体"
        style={{
          position: "relative",
          width: 480,
          height: showEyebrow ? 408 : 480,
          borderRadius: cornerRadius,
          overflow: "hidden",
          border: bgFactor > 0
            ? `1px solid ${accentColor}40`
            : "1px solid transparent",
          backgroundColor: bgFactor > 0
            ? `color-mix(in srgb, ${panelColor} ${Math.round(92 * bgFactor)}%, transparent)`
            : "transparent",
          boxShadow: bgFactor > 0
            ? `0 24px 60px rgba(0, 0, 0, 0.5), 0 0 30px ${accentColor}14`
            : "none",
          opacity: cardEnter,
          transform: `scale(${(0.92 + mediaEnter * 0.08).toFixed(3)})`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* 媒体区域 */}
        <Interactive.Div
          name="媒体画面"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            opacity: mediaEnter,
            transform: `scale(${(1.12 - mediaEnter * 0.12).toFixed(3)})`,
            transformOrigin: "50% 50%",
          }}
        >
          {hasMedia ? (
            videoMode ? (
              <OffthreadVideo
                src={mediaUrl}
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: fit,
                  objectPosition: `${mediaPositionX}% ${mediaPositionY}%`,
                }}
              />
            ) : (
              <Img
                src={mediaUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: fit,
                  objectPosition: `${mediaPositionX}% ${mediaPositionY}%`,
                }}
              />
            )
          ) : (
            <Interactive.Div
              name="占位提示"
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: `repeating-conic-gradient(${panelColor} 0% 25%, ${panelColor}88 0% 50%) 50% / 40px 40px`,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                在右侧属性面板上传图片或视频
              </div>
            </Interactive.Div>
          )}
        </Interactive.Div>

        {/* 底部渐变遮罩 + 字幕 */}
        {showCaption ? (
          <Interactive.Div
          name="媒体字幕条"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "40px 24px 22px",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.82) 100%)",
            opacity: captionEnter,
            transform: `translateY(${((1 - captionEnter) * 24).toFixed(1)}px)`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 3,
              borderRadius: 999,
              backgroundColor: accentColor,
              marginBottom: 10,
              boxShadow: `0 0 12px ${accentColor}`,
            }}
          />
          <div
            style={{
              fontSize: 24,
              fontWeight: 850,
              lineHeight: 1.25,
              color: textColor,
              textShadow: "0 3px 10px rgba(0,0,0,0.8)",
            }}
          >
            {caption}
          </div>
          </Interactive.Div>
        ) : null}

        {/* 左上角强调角标 */}
        {showAccentMarker ? (
          <Interactive.Div
          name="强调角标"
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width: 10,
            height: 10,
            borderRadius: 3,
            backgroundColor: accentColor,
            boxShadow: `0 0 14px ${accentColor}`,
            opacity: interpolate(frame, [enterFrames * 0.3, enterFrames * 0.6], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
          />
        ) : null}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const MediaSpotlightCardEffectDef: EffectDef = {
  id: "MediaSpotlightCard",
  name: "媒体聚焦卡",
  description: "可上传图片或视频的展示卡片，带缩放滑入出场动画、字幕条和强调角标。",
  category: "media",
  catalogGroup: "媒体展示组件",
  glyph: "MEDIA",
  placement: "left",
  component: MediaSpotlightCard as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 180,
  bounds: { x: 0, y: 0, width: 480, height: 480 },
  defaultPosition: { x: 100, y: 240, scale: 1 },
  defaultProps: {
    enabled: true,
    mediaUrl: "",
    mediaType: "image",
    caption: "上传你的素材",
    eyebrow: "MEDIA",
    accentColor: "#FF4B25",
    panelColor: "#0E0F14",
    textColor: "#FFFFFF",
    cornerRadius: 20,
    fit: "cover",
    mediaPositionX: 50,
    mediaPositionY: 50,
    animationSeconds: 0.8,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示卡片", default: true },
    mediaUrl: { type: "text", label: "素材地址" },
    mediaType: {
      type: "select",
      label: "素材类型",
      default: "image",
      options: [
        { label: "图片", value: "image" },
        { label: "视频", value: "video" },
      ],
    },
    caption: { type: "text", label: "字幕文字" },
    eyebrow: { type: "text", label: "引导词" },
    accentColor: { type: "color", label: "强调色", default: "#FF4B25" },
    panelColor: { type: "color", label: "底板色", default: "#0E0F14" },
    textColor: { type: "color", label: "文字颜色", default: "#FFFFFF" },
    cornerRadius: {
      type: "number",
      label: "圆角(px)",
      default: 20,
      min: 0,
      max: 48,
      step: 1,
    },
    fit: {
      type: "select",
      label: "填充方式",
      default: "cover",
      options: [
        { label: "裁剪填充", value: "cover" },
        { label: "完整显示", value: "contain" },
      ],
    },
    mediaPositionX: {
      type: "number",
      label: "裁剪水平位置(%)",
      default: 50,
      min: 0,
      max: 100,
      step: 1,
    },
    mediaPositionY: {
      type: "number",
      label: "裁剪垂直位置(%)",
      default: 50,
      min: 0,
      max: 100,
      step: 1,
    },
    animationSeconds: {
      type: "number",
      label: "入场时长(秒)",
      default: 0.8,
      min: 0.4,
      max: 2,
      step: 0.1,
    },
  },
};
