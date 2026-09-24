import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

type MediaType = "image" | "video";
type Ratio = "landscape" | "portrait";

type Props = {
  /** 口播素材地址(视频或图片;空 = 直接收缩舞台上的口播视频) */
  mediaUrl?: string;
  mediaType?: MediaType;
  /** 素材填充方式;素材比例应与画幅一致,满屏阶段 cover 与底层画面才完全重合 */
  mediaFit?: "cover" | "contain";
  /** 口播缩到哪一侧(竖版忽略,固定上框) */
  side?: "left" | "right";
  /** 描边颜色:hex(选色器输出)或旧命名色 blue/alert/orange */
  accent?: string;
  /** 口播框圆角(px,0 = 跟随画幅默认:横版 36 / 竖版 28) */
  cornerRadius?: number;
  /** 描边显示颜色:关 = 描边变白色(无彩色),框仍然可见 */
  showRingColor?: boolean;
  showRing?: boolean;
  /** 口播框位置微调(px,相对该侧默认落位) */
  camDX?: number;
  camDY?: number;
  /** 口播框大小(px) */
  camW?: number;
  camH?: number;
  /** 框内取景焦点；起点和终点可形成轻微跟随，50% 为居中 */
  focusStartX?: number;
  focusStartY?: number;
  focusEndX?: number;
  focusEndY?: number;
  /** 由时间线渲染壳注入，用于副本模式的焦点关键帧 */
  instanceDurationInFrames?: number;
  /** 副本模式:卡片自备一份底层口播视频画在框内(预览收缩异常时的兼容开关;
   *  副本恒为静音,人声只走底层轨,避免双声) */
  useMediaCopy?: boolean;
  /** 渲染壳注入的底层口播轨地址(预览/导出同源注入),仅副本模式使用 */
  videoSrc?: string;
};

const isVideoSrc = (url: string, mediaType?: MediaType) => {
  if (mediaType === "image") return false;
  if (mediaType === "video") return true;
  return /\.(mp4|mov|webm|m4v|ogg)$/i.test(url);
};

const ACCENT_COLORS: Record<string, string> = {
  blue: "#5fa0fa",
  alert: "#e88686",
  orange: "#f0a24f",
};

/** 描边颜色:hex 直通(选色器输出);兼容旧实例的命名色(blue/alert/orange) */
const resolveAccent = (value: string | undefined) => {
  const v = (value ?? "").trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return v;
  return ACCENT_COLORS[v] ?? ACCENT_COLORS.blue;
};

/** 满屏起步时长与运镜曲线:与参考实现(overlay-studio FocusCard)完全一致 */
const CAM_MS = 1050;
const CAM_EASE = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * 运镜几何 —— 满屏矩形 → 落位小框的目标位置。
 * 横版:人缩到左/右侧 700×700,要点在另一侧;竖版没有左右,人落在上方
 * 960×720、要点排下面。画布尺寸由 useVideoConfig 运行时给出,
 * 组件内部只认这一份几何,避免预览和导出各算各的。
 */
export const camMoveGeom = (
  p: {
    side?: string;
    camDX?: number;
    camDY?: number;
    camW?: number;
    camH?: number;
    camR?: number;
  },
  ratio: Ratio,
) => {
  const vertical = ratio === "portrait";
  const x = vertical ? 60 : (p.side ?? "left") === "right" ? 1110 : 110;
  const y = vertical ? 120 : 190;
  // 700 是横版默认值,没法用 ?? 区分「没调过」;竖版把 700 当作没调过,
  // 换成竖版尺寸,用户真调过(≠700)就听用户的
  const w = vertical && (Number(p.camW) || 700) === 700 ? 960 : Number(p.camW) || 700;
  const h = vertical && (Number(p.camH) || 700) === 700 ? 720 : Number(p.camH) || 700;
  // 圆角:用户设置(>0)优先,否则横版 36 / 竖版 28
  const userR = Number(p.camR);
  const r = userR > 0 ? userR : vertical ? 28 : 36;
  return {
    x: x + (Number(p.camDX) || 0),
    y: y + (Number(p.camDY) || 0),
    w,
    h,
    r,
  };
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const focusPercent = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 50;
};

/** 两个焦点关键帧只移动框内画面，不改变画框本身。 */
const focusObjectPosition = (
  frame: number,
  fromFrame: number,
  toFrame: number,
  focus: Pick<Props, "focusStartX" | "focusStartY" | "focusEndX" | "focusEndY">,
) => {
  const progress = interpolate(
    frame,
    [fromFrame, Math.max(fromFrame + 1, toFrame)],
    [0, 1],
    { easing: Easing.inOut(Easing.ease), ...clampOpts },
  );
  const x = lerp(focusPercent(focus.focusStartX), focusPercent(focus.focusEndX), progress);
  const y = lerp(focusPercent(focus.focusStartY), focusPercent(focus.focusEndY), progress);
  return `${x}% ${y}%`;
};

const clampOpts = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** 舞台真实视频的运镜时间窗:由最早一个未手填素材的 FocusCamMove 实例决定 */
export type FocusCamStageTarget = {
  startFrame: number;
  durationInFrames: number;
  geom: ReturnType<typeof camMoveGeom>;
  mediaFit: "cover" | "contain";
  focus: Pick<Props, "focusStartX" | "focusStartY" | "focusEndX" | "focusEndY">;
};

/**
 * 从时间轴实例里解析运镜时间窗(预览/导出渲染壳共用):
 * 只认未手填 mediaUrl 且未开副本模式的 FocusCamMove——这两种情况卡片
 * 会自备素材副本,舞台视频保持不动,避免双重收缩。
 */
export const resolveFocusCamStageTarget = (
  instances: Array<{
    componentId: string;
    visible?: boolean;
    startFrame: number;
    durationInFrames: number;
    props?: Record<string, unknown>;
  }>,
  ratio: Ratio,
): FocusCamStageTarget | null => {
  const candidate = [...instances]
    .filter(
      (instance) =>
        instance.componentId === "FocusCamMove" &&
        instance.visible !== false &&
        !instance.props?.mediaUrl &&
        instance.props?.useMediaCopy !== true,
    )
    .sort((a, b) => a.startFrame - b.startFrame)[0];
  if (!candidate) return null;
  const props = candidate.props ?? {};
  return {
    startFrame: Math.max(0, Math.round(candidate.startFrame)),
    durationInFrames: Math.max(3, Math.round(candidate.durationInFrames)),
    mediaFit: props.mediaFit === "contain" ? "contain" : "cover",
    focus: {
      focusStartX: props.focusStartX as number | undefined,
      focusStartY: props.focusStartY as number | undefined,
      focusEndX: props.focusEndX as number | undefined,
      focusEndY: props.focusEndY as number | undefined,
    },
    geom: camMoveGeom(
      {
        side: props.side as string | undefined,
        camDX: props.camDX as number | undefined,
        camDY: props.camDY as number | undefined,
        camW: props.camW as number | undefined,
        camH: props.camH as number | undefined,
        camR: props.cornerRadius as number | undefined,
      },
      ratio,
    ),
  };
};

/**
 * 舞台真实视频的运镜样式——"视频元素自己收缩"(对齐 overlay-studio 的
 * 预览 PIP):运镜卡时间窗内,视频从满屏缓动缩进落位框,卡片结束前缩回满屏;
 * 窗外返回 null,调用方保持原满屏样式。必须在视频轨 Sequence 内部调用
 * (useCurrentFrame 取的是轨道相对帧)。
 */
export const useFocusCamStageStyle = (
  target: FocusCamStageTarget | null,
  trackStartFrame: number,
): React.CSSProperties | null => {
  const frame = useCurrentFrame();
  const { fps, width: stageW, height: stageH } = useVideoConfig();
  if (!target) return null;
  const camFrames = Math.max(1, Math.round((CAM_MS / 1000) * fps));
  const localStart = Math.round(target.startFrame) - Math.round(trackStartFrame);
  const localEnd = localStart + target.durationInFrames;
  if (frame < localStart || frame >= localEnd) return null;
  const into = interpolate(frame, [localStart, localStart + camFrames], [0, 1], {
    easing: CAM_EASE,
    ...clampOpts,
  });
  const outOf = interpolate(frame, [localEnd - camFrames, localEnd], [0, 1], {
    easing: CAM_EASE,
    ...clampOpts,
  });
  const progress = Math.min(into, 1 - outOf);
  const holdStart = localStart + camFrames;
  const holdEnd = localEnd - camFrames;
  return {
    position: "absolute",
    left: lerp(0, target.geom.x, progress),
    top: lerp(0, target.geom.y, progress),
    width: lerp(stageW, target.geom.w, progress),
    height: lerp(stageH, target.geom.h, progress),
    borderRadius: lerp(0, target.geom.r, progress),
    objectFit: target.mediaFit,
    objectPosition: focusObjectPosition(
      frame,
      holdEnd > holdStart ? holdStart : localStart,
      holdEnd > holdStart ? holdEnd : localEnd,
      target.focus,
    ),
  };
};

/**
 * 人物聚焦运镜:口播画面满屏起步,1050ms 内缩进圆角落位框。
 * 背景透明——框周围直接透出下方轨道的画面(上层视频缩进框里,
 * 下层视频在后面继续播)。口播素材自带的音频不放(底层轨道负责人声),
 * 避免双声。
 */
export const FocusCamMove: React.FC<Props> = ({
  mediaUrl = "",
  mediaType,
  mediaFit = "cover",
  side = "left",
  accent = "blue",
  cornerRadius = 36,
  showRingColor = true,
  showRing = true,
  camDX = 0,
  camDY = 0,
  camW = 700,
  camH = 700,
  focusStartX = 50,
  focusStartY = 50,
  focusEndX = 50,
  focusEndY = 50,
  instanceDurationInFrames = 300,
  useMediaCopy = false,
  videoSrc = "",
}) => {
  const frame = useCurrentFrame();
  const { fps, width: stageW, height: stageH } = useVideoConfig();
  const msToFrames = (ms: number) => (ms * fps) / 1000;

  const accentColor = resolveAccent(accent);
  const ratio: Ratio = stageH > stageW ? "portrait" : "landscape";
  const g = camMoveGeom(
    { side, camDX, camDY, camW, camH, camR: cornerRadius },
    ratio,
  );

  // 满屏 → 落位框
  const camProgress = interpolate(frame, [0, msToFrames(CAM_MS)], [0, 1], {
    easing: CAM_EASE,
    ...clampOpts,
  });
  const camStyle: React.CSSProperties = {
    position: "absolute",
    left: lerp(0, g.x, camProgress),
    top: lerp(0, g.y, camProgress),
    width: lerp(stageW, g.w, camProgress),
    height: lerp(stageH, g.h, camProgress),
    borderRadius: lerp(0, g.r, camProgress),
    overflow: "hidden",
  };

  // 落位框描边在收缩中段浮现
  const ringOpacity = interpolate(
    frame,
    [msToFrames(380), msToFrames(940)],
    [0, 1],
    { easing: CAM_EASE, ...clampOpts },
  );

  // 默认由渲染壳直接驱动舞台真实视频收缩(见 useFocusCamStageStyle,预览与
  // 合成导出同帧、无副本对齐问题);useMediaCopy 开启或手填 mediaUrl 时,
  // 卡片自备素材副本(用于"底层轨放录屏、口播用另一段视频"的分离场景)
  const copyUrl = mediaUrl || (useMediaCopy ? videoSrc : "");
  const hasMedia = Boolean(copyUrl);
  const videoMode = isVideoSrc(copyUrl, mediaType);
  const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: mediaFit,
    objectPosition: focusObjectPosition(
      frame,
      Math.round(msToFrames(CAM_MS)),
      Math.max(Math.round(msToFrames(CAM_MS)) + 1, instanceDurationInFrames - Math.round(msToFrames(CAM_MS))),
      { focusStartX, focusStartY, focusEndX, focusEndY },
    ),
  };

  return (
    <AbsoluteFill
      data-effect="FocusCamMove"
      style={{
        pointerEvents: "none",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      {hasMedia ? (
        <div style={camStyle}>
          {videoMode ? (
            <OffthreadVideo muted src={copyUrl} style={mediaStyle} />
          ) : (
            <Img src={copyUrl} style={mediaStyle} />
          )}
        </div>
      ) : null}

      {showRing ? (
        <div
          style={{
            position: "absolute",
            left: g.x,
            top: g.y,
            width: g.w,
            height: g.h,
            borderRadius: g.r,
            // 描边颜色开关:关 = 白色无彩色描边(框仍可见);开 = 使用描边颜色
            border: `3px solid ${showRingColor ? accentColor : "rgba(255,255,255,0.92)"}`,
            opacity: ringOpacity,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const FocusCamMoveEffectDef: EffectDef = {
  id: "FocusCamMove",
  name: "人物聚焦运镜",
  description: "人物聚焦运镜 · 口播画面满屏缩进落位框,背景透明透出下方轨道",
  category: "portrait-narrative",
  catalogGroup: "空间与聚焦",
  glyph: "FM",
  // 全屏卡:固定铺满画布不可拖拽,口播框位置走 camDX/camDY/camW/camH 参数
  placement: "full",
  component: FocusCamMove as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 300,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: {
    mediaUrl: "",
    useMediaCopy: false,
    mediaType: "video",
    mediaFit: "cover",
    side: "left",
    accent: "#5fa0fa",
    cornerRadius: 36,
    showRingColor: true,
    showRing: true,
    camDX: 0,
    camDY: 0,
    camW: 700,
    camH: 700,
    focusStartX: 50,
    focusStartY: 50,
    focusEndX: 50,
    focusEndY: 50,
  },
  propsSchema: {
    mediaUrl: { type: "text", label: "口播素材地址(空 = 收缩舞台口播视频)" },
    useMediaCopy: {
      type: "boolean",
      label: "副本模式(预览收缩异常时开启)",
      default: false,
    },
    mediaType: {
      type: "select",
      label: "素材类型",
      default: "video",
      options: [
        { label: "视频", value: "video" },
        { label: "图片", value: "image" },
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
    side: {
      type: "select",
      label: "口播缩到哪侧(竖版忽略)",
      default: "left",
      options: [
        { label: "左侧", value: "left" },
        { label: "右侧", value: "right" },
      ],
    },
    accent: {
      type: "color",
      label: "描边颜色",
      default: "#5fa0fa",
      toggleKey: "showRingColor",
    },
    cornerRadius: {
      type: "number",
      label: "口播框圆角(拉满=圆形)",
      unit: "px",
      default: 36,
      min: 0,
      max: 1000,
      step: 10,
    },
    showRing: { type: "boolean", label: "显示口播框描边", default: true },
    camDX: { type: "number", label: "口播框水平移动", unit: "px", default: 0, min: -1100, max: 1100, step: 10 },
    camDY: { type: "number", label: "口播框垂直移动", unit: "px", default: 0, min: -400, max: 600, step: 10 },
    camW: { type: "number", label: "口播框宽", unit: "px", default: 700, min: 300, max: 1200, step: 10 },
    camH: { type: "number", label: "口播框高", unit: "px", default: 700, min: 300, max: 1000, step: 10 },
    focusStartX: { type: "number", label: "人物焦点起点 X", unit: "%", default: 50, min: 0, max: 100, step: 1 },
    focusStartY: { type: "number", label: "人物焦点起点 Y", unit: "%", default: 50, min: 0, max: 100, step: 1 },
    focusEndX: { type: "number", label: "人物焦点终点 X", unit: "%", default: 50, min: 0, max: 100, step: 1 },
    focusEndY: { type: "number", label: "人物焦点终点 Y", unit: "%", default: 50, min: 0, max: 100, step: 1 },
  },
};
