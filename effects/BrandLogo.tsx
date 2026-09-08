import React from "react";
import { Img, Interactive, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  logoSource?: "builtin" | "custom";
  builtinIcon?: string;
  customLogoUrl?: string;
  label?: string;
  subtitle?: string;
  accentColor?: string;
  panelColor?: string;
  width?: number;
  height?: number;
  animationSeconds?: number;
};

// Remotion 的导出浏览器默认运行在 localhost:3001，
// 但工作台资源由本地 API 服务的 41735 端口提供。使用可达的绝对地址，
// 避免预览能显示、透明导出首帧却因资源 404 失败。
export const BUILTIN_ICON_BASE_URL = "http://127.0.0.1:41735/input/icons";
export const BUILTIN_ICON_URLS: Record<string, string> = {
  arrow: `${BUILTIN_ICON_BASE_URL}/arrow.svg`,
  camera: `${BUILTIN_ICON_BASE_URL}/camera.svg`,
  chart: `${BUILTIN_ICON_BASE_URL}/chart-bar.svg`,
  users: `${BUILTIN_ICON_BASE_URL}/users.svg`,
  bank: `${BUILTIN_ICON_BASE_URL}/bank.svg`,
  robot: `${BUILTIN_ICON_BASE_URL}/robot.svg`,
  brain: `${BUILTIN_ICON_BASE_URL}/brain.svg`,
  trend: `${BUILTIN_ICON_BASE_URL}/trend-up.svg`,
  "seal-check": `${BUILTIN_ICON_BASE_URL}/seal-check.svg`,
  "check-circle": `${BUILTIN_ICON_BASE_URL}/check-circle.svg`,
};

export const BrandLogo: React.FC<Props> = ({
  enabled = true,
  logoSource = "builtin",
  builtinIcon = "camera",
  customLogoUrl = "",
  label = "拍照搜题",
  subtitle = "PHOTO SOLVE",
  accentColor = "#1699ff",
  panelColor = "rgba(9, 11, 17, 0.86)",
  width = 390,
  height = 92,
  animationSeconds = 0.45,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = Math.max(8, Math.round(animationSeconds * fps));
  const opacity = enabled
    ? interpolate(frame, [0, enter], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const src = logoSource === "builtin"
    ? (BUILTIN_ICON_URLS[builtinIcon] ?? BUILTIN_ICON_URLS.camera)
    : (customLogoUrl?.trim() || BUILTIN_ICON_URLS[builtinIcon] || BUILTIN_ICON_URLS.camera);
  return (
    <Interactive.Div name="品牌 Logo" data-effect="BrandLogo" style={{ display: "flex", alignItems: "center", gap: 16, boxSizing: "border-box", width, height, padding: "14px 22px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, backgroundColor: panelColor, boxShadow: "0 14px 34px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.06)", opacity, transform: `translateX(${interpolate(frame, [0, enter], [-14, 0], { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`, pointerEvents: "none" }}>
      <div style={{ display: "grid", placeItems: "center", width: 56, height: 56, flex: "0 0 auto", border: `1px solid ${accentColor}88`, borderRadius: 10, backgroundColor: `${accentColor}18`, boxShadow: `inset 0 0 18px ${accentColor}12` }}>
        <Img src={src} style={{ width: 32, height: 32, objectFit: "contain" }} />
      </div>
      <div style={{ minWidth: 0, overflow: "hidden" }}>
        <div style={{ overflow: "hidden", color: "#fff", fontSize: 28, fontWeight: 900, lineHeight: 1.1, letterSpacing: 0.2, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{label}</div>
        <div style={{ marginTop: 8, overflow: "hidden", color: "rgba(255,255,255,.52)", fontSize: 13, fontWeight: 800, lineHeight: 1, letterSpacing: 3.2, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{subtitle}</div>
      </div>
    </Interactive.Div>
  );
};

export const BrandLogoEffectDef: EffectDef = {
  id: "BrandLogo",
  name: "品牌 Logo",
  description: "独立品牌标识组件：可选内置图标，或使用图标库/手动添加的图片 URL。",
  category: "brand",
  catalogGroup: "品牌与标识",
  glyph: "LOGO",
  placement: "left",
  component: BrandLogo as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 180,
  bounds: { x: 0, y: 0, width: 300, height: 100 },
  defaultPosition: { x: 72, y: 120, scale: 1 },
  defaultProps: { enabled: true, logoSource: "builtin", builtinIcon: "camera", customLogoUrl: "", label: "拍照搜题", subtitle: "PHOTO SOLVE", accentColor: "#1699ff", panelColor: "#090b11", width: 390, height: 92, animationSeconds: 0.45 },
  propsSchema: {
    enabled: { type: "boolean", label: "显示品牌 Logo", default: true },
    logoSource: { type: "select", label: "Logo 来源", default: "custom", options: [{ label: "内置图标库", value: "builtin" }, { label: "手动添加图片", value: "custom" }] },
    builtinIcon: { type: "select", label: "内置图标", default: "camera", options: [{ label: "相机", value: "camera" }, { label: "图表", value: "chart" }, { label: "用户", value: "users" }, { label: "机构", value: "bank" }, { label: "机器人", value: "robot" }, { label: "大脑", value: "brain" }, { label: "趋势", value: "trend" }, { label: "箭头", value: "arrow" }] },
    customLogoUrl: { type: "text", label: "手动图片 URL" },
    label: { type: "text", label: "品牌名称" },
    subtitle: { type: "text", label: "英文副标题" },
    accentColor: { type: "color", label: "图标强调色", default: "#1699ff" },
    panelColor: { type: "color", label: "卡片颜色", default: "#090b11" },
    width: { type: "number", label: "宽度(px)", default: 390, min: 180, max: 800, step: 1 },
    height: { type: "number", label: "高度(px)", default: 92, min: 64, max: 240, step: 1 },
    animationSeconds: { type: "number", label: "入场时长(秒)", default: 0.45, min: 0.2, max: 2, step: 0.05 },
  },
};


