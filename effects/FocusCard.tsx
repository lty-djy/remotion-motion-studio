import React from "react";
import {
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

type MediaType = "image" | "video";

type Props = {
  /** 口播素材地址(视频或图片,空 = 只显示透明框) */
  mediaUrl?: string;
  mediaType?: MediaType;
  /** 口播素材填充方式 */
  mediaFit?: "cover" | "contain";
  accent?: string;
  /** 口播框位置微调(px) */
  camDX?: number;
  camDY?: number;
  /** 口播框大小(px) */
  camW?: number;
  camH?: number;
};

const isVideoSrc = (url: string, mediaType?: MediaType) => {
  if (mediaType === "image") return false;
  if (mediaType === "video") return true;
  return /\.(mp4|mov|webm|m4v|ogg)$/i.test(url);
};

/** 强调色(与参考项目 ACCENT_VAR 一致的三色语义) */
const ACCENT_COLORS: Record<string, string> = {
  blue: "#5fa0fa",
  alert: "#e88686",
  orange: "#f0a24f",
};

const resolveAccent = (value: string | undefined) =>
  (value && ACCENT_COLORS[value]) || ACCENT_COLORS.blue;

/** 默认口播框 700×700(与参考 defaults 一致) */
const CARD_SIZE = 700;

/**
 * 人物聚焦框卡:透明圆角描边框,框内直接套入视频/图片(未传素材时是纯框,
 * 透出下层轨道画面)。普通落位卡片,可在预览画布上拖动移动、拖角缩放。
 */
export const FocusCard: React.FC<Props> = ({
  mediaUrl = "",
  mediaType,
  mediaFit = "cover",
  accent = "blue",
  camDX = 0,
  camDY = 0,
  camW = CARD_SIZE,
  camH = CARD_SIZE,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const msToFrames = (ms: number) => (ms * fps) / 1000;
  const ease = Easing.bezier(0.22, 1, 0.36, 1);
  const clampOpt = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;

  const accentColor = resolveAccent(accent);
  const hasMedia = Boolean(mediaUrl);
  const videoMode = isVideoSrc(mediaUrl, mediaType);

  // 整卡 420ms 淡入
  const enter = interpolate(frame, [0, msToFrames(420)], [0, 1], {
    easing: ease,
    ...clampOpt,
  });

  const mediaStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: mediaFit,
  };

  return (
    <div
      data-effect="FocusCard"
      style={{
        position: "relative",
        width: Number(camW) || CARD_SIZE,
        height: Number(camH) || CARD_SIZE,
        borderRadius: 36,
        overflow: "hidden",
        pointerEvents: "none",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        opacity: enter,
        transform: `translate(${Number(camDX) || 0}px, ${Number(camDY) || 0}px)`,
      }}
    >
      {hasMedia ? (
        videoMode ? (
          <OffthreadVideo muted src={mediaUrl} style={mediaStyle} />
        ) : (
          <Img src={mediaUrl} style={mediaStyle} />
        )
      ) : null}
      {/* 描边放内层:渲染壳会清掉直接子元素的边框色 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 36,
          border: `3px solid ${accentColor}`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export const FocusCardEffectDef: EffectDef = {
  id: "FocusCard",
  name: "FocusCard",
  description: "人物聚焦框 · 透明圆角框套视频/图片,画布可拖动",
  category: "portrait-narrative",
  catalogGroup: "空间与聚焦",
  glyph: "FC",
  // 普通落位卡:预览画布可拖动移动、拖角缩放
  placement: "left",
  component: FocusCard as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 300,
  bounds: { x: 0, y: 0, width: CARD_SIZE, height: CARD_SIZE },
  defaultPosition: { x: 110, y: 190, scale: 1 },
  defaultProps: {
    mediaUrl: "",
    mediaType: "image",
    mediaFit: "cover",
    accent: "blue",
    camDX: 0,
    camDY: 0,
    camW: CARD_SIZE,
    camH: CARD_SIZE,
  },
  propsSchema: {
    mediaUrl: { type: "text", label: "口播素材地址(视频/图片)" },
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
      label: "填充方式",
      default: "cover",
      options: [
        { label: "裁剪填满", value: "cover" },
        { label: "完整显示", value: "contain" },
      ],
    },
    accent: {
      type: "select",
      label: "框颜色",
      default: "blue",
      options: [
        { label: "数据蓝", value: "blue" },
        { label: "否定红", value: "alert" },
        { label: "转变橙", value: "orange" },
      ],
    },
    camDX: {
      type: "number",
      label: "口播框水平移动",
      unit: "px",
      default: 0,
      min: -1100,
      max: 1100,
      step: 10,
    },
    camDY: {
      type: "number",
      label: "口播框垂直移动",
      unit: "px",
      default: 0,
      min: -400,
      max: 600,
      step: 10,
    },
    camW: {
      type: "number",
      label: "口播框宽",
      unit: "px",
      default: CARD_SIZE,
      min: 300,
      max: 1200,
      step: 10,
    },
    camH: {
      type: "number",
      label: "口播框高",
      unit: "px",
      default: CARD_SIZE,
      min: 300,
      max: 1000,
      step: 10,
    },
  },
};

