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
  /** 全屏底色(盖住底层轨道画面) */
  bg?: "dark" | "cream" | "mist";
  /** 口播缩到哪一侧(竖版忽略,固定上框下要点) */
  side?: "left" | "right";
  /** 要点,| 分隔 */
  items?: string;
  /** 每条要点间隔(ms,卡点用) */
  stepMs?: number;
  accent?: string;
  showRing?: boolean;
  /** 口播框位置微调(px,相对该侧默认落位) */
  camDX?: number;
  camDY?: number;
  /** 口播框大小(px) */
  camW?: number;
  camH?: number;
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

const resolveAccent = (value: string | undefined) =>
  (value && ACCENT_COLORS[value]) || ACCENT_COLORS.blue;

/** 满屏起步时长与运镜曲线:与参考实现(overlay-studio FocusCard)完全一致 */
const CAM_MS = 1050;
const CAM_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const BG_GRADIENTS: Record<string, string> = {
  dark: "linear-gradient(168deg, #1a1a22 0%, #131318 60%, #0e0e13 100%)",
  cream: "linear-gradient(168deg, #f7eddd 0%, #f2e6d2 60%, #ecdec6 100%)",
  mist: "linear-gradient(168deg, #f7f7f9 0%, #efeff2 60%, #e8e8ec 100%)",
};

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
  return {
    x: x + (Number(p.camDX) || 0),
    y: y + (Number(p.camDY) || 0),
    w,
    h,
    r: vertical ? 28 : 36,
  };
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const clampOpts = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** 舞台真实视频的运镜时间窗:由最早一个未手填素材的 FocusCamMove 实例决定 */
export type FocusCamStageTarget = {
  startFrame: number;
  durationInFrames: number;
  geom: ReturnType<typeof camMoveGeom>;
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
    geom: camMoveGeom(
      {
        side: props.side as string | undefined,
        camDX: props.camDX as number | undefined,
        camDY: props.camDY as number | undefined,
        camW: props.camW as number | undefined,
        camH: props.camH as number | undefined,
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
  const into = interpolate(frame, [localStart, localStart + camFrames], [0, 1], {
    easing: CAM_EASE,
    ...clampOpts,
  });
  const outOf = interpolate(frame, [localEnd - camFrames, localEnd], [0, 1], {
    easing: CAM_EASE,
    ...clampOpts,
  });
  const progress = Math.min(into, 1 - outOf);
  return {
    position: "absolute",
    left: lerp(0, target.geom.x, progress),
    top: lerp(0, target.geom.y, progress),
    width: lerp(stageW, target.geom.w, progress),
    height: lerp(stageH, target.geom.h, progress),
    borderRadius: lerp(0, target.geom.r, progress),
    // cover:小框阶段只裁剪不变形;素材与画幅同比例时,满屏阶段与 contain 无差别
    objectFit: "cover",
    // 收缩中的画面压在效果层(底色盘/描边/要点)之上,对应 studio 的 z-index 6
    zIndex: 6,
  };
};

/**
 * 人物聚焦运镜:口播画面满屏起步,1050ms 内缩进圆角落位框,
 * 底色盘淡入盖住底层轨道,要点胶囊逐条弹入。满屏阶段素材画面与
 * 底层口播轨重合,收缩过程看起来就是底层视频自己在缩。
 * 口播素材自带的音频不放(底层轨道负责人声),避免双声。
 */
export const FocusCamMove: React.FC<Props> = ({
  mediaUrl = "",
  mediaType,
  mediaFit = "cover",
  bg = "dark",
  side = "left",
  items = "",
  stepMs = 600,
  accent = "blue",
  showRing = true,
  camDX = 0,
  camDY = 0,
  camW = 700,
  camH = 700,
  useMediaCopy = false,
  videoSrc = "",
}) => {
  const frame = useCurrentFrame();
  const { fps, width: stageW, height: stageH } = useVideoConfig();
  const msToFrames = (ms: number) => (ms * fps) / 1000;

  const accentColor = resolveAccent(accent);
  const ratio: Ratio = stageH > stageW ? "portrait" : "landscape";
  const g = camMoveGeom({ side, camDX, camDY, camW, camH }, ratio);
  const vertical = ratio === "portrait";
  const rightSide = !vertical && side === "right";

  const parsed = items
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

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

  // 底色盘先淡入(此时被满屏素材盖住,不可见),素材一缩就露出纯色底
  const bgOpacity = interpolate(frame, [0, msToFrames(520)], [0, 1], {
    easing: CAM_EASE,
    ...clampOpts,
  });
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
  };

  // 要点胶囊逐条弹入(缩到右则要点在左,滑入方向镜像)
  const chipFromX = rightSide ? -52 : 52;

  const chipListStyle: React.CSSProperties = vertical
    ? {
        position: "absolute",
        left: 80,
        right: 80,
        top: g.y + g.h + 70,
        display: "flex",
        flexDirection: "column",
        gap: 34,
      }
    : {
        position: "absolute",
        left: rightSide ? 110 : 940,
        right: rightSide ? 980 : 110,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 34,
      };

  return (
    <AbsoluteFill
      data-effect="FocusCamMove"
      style={{
        pointerEvents: "none",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <AbsoluteFill style={{ opacity: bgOpacity, background: BG_GRADIENTS[bg] ?? BG_GRADIENTS.dark }} />

      {hasMedia ? (
        <div style={camStyle}>
          {videoMode ? (
            <OffthreadVideo muted src={copyUrl} style={mediaStyle} />
          ) : (
            <Img src={copyUrl} style={mediaStyle} />
          )}
        </div>
      ) : null}

      {showRing || !hasMedia ? (
        <div
          style={{
            position: "absolute",
            left: g.x,
            top: g.y,
            width: g.w,
            height: g.h,
            borderRadius: g.r,
            border: `3px solid ${accentColor}`,
            opacity: ringOpacity,
          }}
        />
      ) : null}

      {parsed.length > 0 ? (
        <div style={chipListStyle}>
          {parsed.map((label, i) => {
            const start = msToFrames(520 + i * stepMs);
            const end = start + msToFrames(620);
            const chipOpacity = interpolate(frame, [start, end], [0, 1], {
              easing: CAM_EASE,
              ...clampOpts,
            });
            const chipX = interpolate(frame, [start, end], [chipFromX, 0], {
              easing: CAM_EASE,
              ...clampOpts,
            });
            return (
              <div
                key={`${label}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "30px 38px",
                  borderRadius: 16,
                  background:
                    bg === "dark"
                      ? "linear-gradient(160deg, rgba(255,255,255,0.13), rgba(255,255,255,0.06))"
                      : "linear-gradient(160deg, rgba(44,42,46,0.94), rgba(30,29,33,0.94))",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow:
                    bg === "dark"
                      ? "0 14px 34px rgba(0,0,0,0.35)"
                      : "0 14px 34px rgba(70,55,30,0.18)",
                  color: "#fff",
                  fontSize: 36,
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  opacity: chipOpacity,
                  transform: `translateX(${chipX}px)`,
                }}
              >
                <span style={{ color: accentColor, fontSize: 30, flex: "none" }}>✦</span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const FocusCamMoveEffectDef: EffectDef = {
  id: "FocusCamMove",
  name: "FocusCamMove",
  description: "人物聚焦运镜 · 舞台口播画面满屏缩进落位框,要点逐条弹入",
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
    bg: "dark",
    side: "left",
    items: "本段要点一|本段要点二",
    stepMs: 600,
    accent: "blue",
    showRing: true,
    camDX: 0,
    camDY: 0,
    camW: 700,
    camH: 700,
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
    bg: {
      type: "select",
      label: "全屏底色",
      default: "dark",
      options: [
        { label: "暗色", value: "dark" },
        { label: "米色", value: "cream" },
        { label: "雾白", value: "mist" },
      ],
    },
    side: {
      type: "select",
      label: "口播缩到哪侧(竖版忽略)",
      default: "left",
      options: [
        { label: "左侧(要点在右)", value: "left" },
        { label: "右侧(要点在左)", value: "right" },
      ],
    },
    items: { type: "text", label: "要点(| 分隔,空 = 留白)" },
    stepMs: { type: "number", label: "每条要点间隔", unit: "ms", default: 600, min: 200, max: 8000, step: 100 },
    accent: {
      type: "select",
      label: "强调色",
      default: "blue",
      options: [
        { label: "数据蓝", value: "blue" },
        { label: "否定红", value: "alert" },
        { label: "转变橙", value: "orange" },
      ],
    },
    showRing: { type: "boolean", label: "显示口播落位框", default: true },
    camDX: { type: "number", label: "口播框水平移动", unit: "px", default: 0, min: -1100, max: 1100, step: 10 },
    camDY: { type: "number", label: "口播框垂直移动", unit: "px", default: 0, min: -400, max: 600, step: 10 },
    camW: { type: "number", label: "口播框宽", unit: "px", default: 700, min: 300, max: 1200, step: 10 },
    camH: { type: "number", label: "口播框高", unit: "px", default: 700, min: 300, max: 1000, step: 10 },
  },
};
