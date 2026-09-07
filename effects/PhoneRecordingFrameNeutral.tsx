import React from "react";

import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type PhoneProps = {
    mediaUrl?: string;
    mediaType?: string;
    mediaFit?: "cover" | "contain";
    enterEndSeconds?: number;
    exitStartSeconds?: number;
    exitEndSeconds?: number;
};

// Times are local to this effect. Keep every interpolation interval increasing.
const usePhoneTiming = (props: PhoneProps) => {
    const { fps } = useVideoConfig();
    const finite = (value: number | undefined, fallback: number) =>
        Number.isFinite(value) ? Number(value) : fallback;
    const enterEnd = Math.max(1, finite(props.enterEndSeconds, 1) * fps);
    const exitStart = Math.max(enterEnd, finite(props.exitStartSeconds, 5.33) * fps);
    const exitEnd = Math.max(exitStart + 1, finite(props.exitEndSeconds, 6) * fps);
    return { fps, enterEnd, exitStart, exitEnd };
};

const MONO = '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';
const SANS = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';

const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
};

const TASKS = [
    { title: "整理需求", meta: "BRIEF · 09:12", color: "#59A8FF", state: "DONE" },
    { title: "生成场景", meta: "MOTION · 09:18", color: "#B47BFF", state: "ACTIVE" },
    { title: "抽帧检查", meta: "REVIEW · 09:24", color: "#45E2A3", state: "NEXT" },
    { title: "导出预览", meta: "EXPORT · 09:30", color: "#FFB45D", state: "QUEUE" },
    { title: "完整解码", meta: "VERIFY · 09:36", color: "#45E2A3", state: "READY" },
];

const TaskCard: React.FC<{
    title: string;
    meta: string;
    color: string;
    state: string;
    index: number;
    frame: number;
    fps: number;
}> = ({ title, meta, color, state, index, frame, fps }) => {
    const delay = 24 + index * 8;
    const enter = frame < delay
        ? 0
        : spring({
            frame: frame - delay,
            fps,
            config: { damping: 20, stiffness: 155, mass: 0.8 },
        });
    return (<div style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 14,
            minHeight: 88,
            padding: "15px 16px",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.09)",
            background: "linear-gradient(145deg, rgba(25,31,43,0.97), rgba(13,17,25,0.98))",
            boxShadow: "0 16px 30px rgba(0,0,0,0.22), inset 0 1px rgba(255,255,255,0.05)",
            opacity: interpolate(enter, [0, 1], [0, 1], clamp),
            scale: interpolate(enter, [0, 1], [0.94, 1], clamp),
            translate: `${interpolate(enter, [0, 1], [28, 0], clamp)}px 0px`,
        }}>
      <div style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${color}1F`,
            border: `1px solid ${color}66`,
            color,
            fontFamily: MONO,
            fontSize: 16,
            fontWeight: 800,
            boxShadow: `0 0 20px ${color}20`,
        }}>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: 20, color: "#F7F9FC", fontWeight: 760 }}>
          {title}
        </div>
        <div style={{
            marginTop: 5,
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: 1.2,
            color: "rgba(235,241,250,0.42)",
        }}>
          {meta}
        </div>
      </div>
      <div style={{
            padding: "5px 8px",
            borderRadius: 999,
            background: `${color}16`,
            border: `1px solid ${color}44`,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: 0.8,
            color,
            fontWeight: 800,
        }}>
        {state}
      </div>
    </div>);
};

const NeutralScreen: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const scrollY = interpolate(frame, [58, 148], [0, -390], {
        ...clamp,
        easing: Easing.inOut(Easing.cubic),
    });
    const progress = interpolate(frame, [18, 132], [26, 84], {
        ...clamp,
        easing: Easing.inOut(Easing.cubic),
    });
    const pulse = interpolate(Math.sin(frame / 10), [-1, 1], [0.36, 0.75], clamp);
    return (<div style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            background: "radial-gradient(circle at 82% 4%, rgba(88,115,255,0.21), transparent 36%), linear-gradient(180deg, #111723 0%, #090D14 100%)",
            color: "#F7F9FC",
            fontFamily: SANS,
        }}>
      <div style={{
            position: "absolute",
            left: 22,
            right: 22,
            top: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 4,
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.78)",
        }}>
        <span>09:41</span>
        <span style={{ letterSpacing: 2 }}>●●●  5G  ▰</span>
      </div>

      <div style={{
            position: "absolute",
            left: 17,
            right: 17,
            top: 58,
            translate: `0px ${scrollY}px`,
        }}>
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
        }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: "#67E8B1" }}>
              WORKSPACE · LIVE
            </div>
            <div style={{ fontSize: 31, lineHeight: 1.15, fontWeight: 820, marginTop: 7 }}>任务看板</div>
          </div>
          <div style={{
            width: 47,
            height: 47,
            borderRadius: 17,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #559EFF, #8F69FF)",
            fontFamily: MONO,
            fontWeight: 900,
            fontSize: 15,
            boxShadow: "0 10px 26px rgba(95,121,255,0.34)",
        }}>
            CL
          </div>
        </div>

        <div style={{
            borderRadius: 22,
            padding: "17px 18px",
            marginBottom: 14,
            background: "linear-gradient(135deg, rgba(72,104,255,0.22), rgba(56,215,156,0.10))",
            border: "1px solid rgba(103,232,177,0.24)",
            boxShadow: `0 0 34px rgba(72,213,164,${pulse * 0.12})`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(245,248,255,0.68)" }}>今日进度</span>
            <span style={{ fontFamily: MONO, fontSize: 23, fontWeight: 850, color: "#67E8B1" }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 99, marginTop: 13, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{
            width: `${progress}%`,
            height: "100%",
            borderRadius: 99,
            background: "linear-gradient(90deg, #5C9DFF, #67E8B1)",
            boxShadow: "0 0 18px rgba(103,232,177,0.46)",
        }}/>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TASKS.map((task, index) => (<TaskCard key={task.title} {...task} index={index} frame={frame} fps={fps}/>))}
        </div>

        <div style={{
            marginTop: 14,
            minHeight: 150,
            padding: "19px 18px",
            borderRadius: 22,
            border: "1px solid rgba(89,168,255,0.26)",
            background: "linear-gradient(145deg, rgba(15,24,38,0.98), rgba(10,14,22,0.98))",
        }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1.8, color: "#59A8FF" }}>RECORDING SUMMARY</div>
          <div style={{ fontSize: 22, lineHeight: 1.35, fontWeight: 770, marginTop: 10 }}>画面、时间线和交付状态已同步</div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {["MOTION", "STILL", "VIDEO"].map((label) => (<span key={label} style={{
                padding: "6px 9px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                fontFamily: MONO,
                fontSize: 9,
                color: "rgba(255,255,255,0.52)",
            }}>
                {label}
              </span>))}
          </div>
        </div>
      </div>

      <div style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 64,
            background: "linear-gradient(180deg, transparent, rgba(6,9,14,0.96) 62%)",
            zIndex: 3,
        }}/>
    </div>);
};

const Device: React.FC<PhoneProps> = (props) => {
    const frame = useCurrentFrame();
    const { fps, enterEnd, exitStart, exitEnd } = usePhoneTiming(props);
    const delay = enterEnd * 0.13;
    const enter = frame < delay
        ? 0
        : spring({
            frame: frame - delay,
            fps,
            durationInFrames: Math.max(1, enterEnd - delay),
            config: { damping: 18, stiffness: 115, mass: 0.9 },
        });
    const exit = interpolate(frame, [exitStart, exitEnd], [0, 1], {
        ...clamp,
        easing: Easing.in(Easing.cubic),
    });
    const shineX = interpolate(frame, [24, 104], [-180, 500], {
        ...clamp,
        easing: Easing.inOut(Easing.cubic),
    });
    return (<div style={{
            position: "absolute",
            right: 300,
            top: 82,
            width: 420,
            height: 900,
            opacity: interpolate(exit, [0, 1], [1, 0], clamp),
            scale: interpolate(enter, [0, 1], [0.83, 1], clamp),
            translate: `0px ${interpolate(enter, [0, 1], [110, 0], clamp) + interpolate(exit, [0, 1], [0, -52], clamp)}px`,
            rotate: `${interpolate(enter, [0, 1], [4.5, -1.4], clamp)}deg`,
        }}>
      <div style={{
            position: "absolute",
            left: -8,
            top: 178,
            width: 9,
            height: 124,
            borderRadius: "7px 0 0 7px",
            background: "linear-gradient(90deg, #080A0E, #404752)",
            boxShadow: "-3px 0 8px rgba(0,0,0,0.54)",
        }}/>
      <div style={{
            position: "absolute",
            right: -8,
            top: 212,
            width: 9,
            height: 154,
            borderRadius: "0 7px 7px 0",
            background: "linear-gradient(90deg, #444B56, #090B10)",
            boxShadow: "3px 0 8px rgba(0,0,0,0.54)",
        }}/>

      <div style={{
            position: "absolute",
            inset: 0,
            padding: 13,
            borderRadius: 68,
            background: "linear-gradient(145deg, #737B87 0%, #252A32 10%, #07090D 38%, #353B45 68%, #11141A 100%)",
            border: "1px solid rgba(255,255,255,0.26)",
            boxShadow: "0 62px 105px rgba(0,0,0,0.70), 0 0 0 2px rgba(0,0,0,0.64), inset 0 1px rgba(255,255,255,0.42), inset 0 -2px rgba(0,0,0,0.82)",
        }}>
        <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 56,
            overflow: "hidden",
            background: "#080B11",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.78)",
        }}>
          {props.mediaUrl ? (
            props.mediaType === "video" || (props.mediaType !== "image" && /\.(mp4|mov|webm|m4v|ogg)(?:[?#].*)?$/i.test(props.mediaUrl)) ? (
              <OffthreadVideo src={props.mediaUrl} muted style={{ width: "100%", height: "100%", objectFit: props.mediaFit ?? "cover" }} />
            ) : (
              <Img src={props.mediaUrl} style={{ width: "100%", height: "100%", objectFit: props.mediaFit ?? "cover" }} />
            )
          ) : <NeutralScreen />}

          <div aria-label="灵动岛" style={{
            position: "absolute",
            left: "50%",
            top: 13,
            width: 116,
            height: 31,
            borderRadius: 18,
            translate: "-50% 0px",
            background: "#020304",
            boxShadow: "0 2px 8px rgba(0,0,0,0.72)",
            zIndex: 8,
        }}>
            <span style={{
            position: "absolute",
            right: 11,
            top: 11,
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #27416F, #08101E 70%)",
            boxShadow: "0 0 6px rgba(66,119,220,0.65)",
        }}/>
          </div>

          <div style={{
            position: "absolute",
            top: -80,
            bottom: -80,
            left: shineX,
            width: 92,
            rotate: "14deg",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
            zIndex: 7,
            pointerEvents: "none",
        }}/>
        </div>
      </div>

    </div>);
};

export const PhoneRecordingFrameNeutral: React.FC<PhoneProps> = (props) => {
    return (<AbsoluteFill style={{
            overflow: "hidden",
            background: "radial-gradient(circle at 70% 46%, rgba(68,119,255,0.19), transparent 31%), radial-gradient(circle at 52% 92%, rgba(59,226,159,0.10), transparent 38%), #070A10",
            color: "#F7F9FC",
            fontFamily: SANS,
        }}>
      <AbsoluteFill style={{
            opacity: 0.24,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "68px 68px",
            maskImage: "linear-gradient(to bottom, black, transparent 88%)",
        }}/>


      <Device {...props} />

    </AbsoluteFill>);
};



import type { EffectDef } from "../registry";

export const PhoneRecordingFrameNeutralEffectDef: EffectDef = {
  id: "PhoneRecordingFrameNeutral",
  name: "手机与竖屏录屏",
  description: "中性手机外壳与竖屏录屏展示组件，适合手机界面、录屏证据与产品演示。",
  category: "media",
  catalogGroup: "媒体展示组件",
  glyph: "PHONE",
  placement: "full",
  component: PhoneRecordingFrameNeutral as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 180,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: { mediaUrl: "", mediaType: "image", mediaFit: "cover", enterEndSeconds: 1, exitStartSeconds: 5.33, exitEndSeconds: 6 },
  propsSchema: {
    mediaUrl: { type: "text", label: "内屏图片 / 视频" },
    mediaType: { type: "select", label: "内屏素材类型", options: [{ label: "图片", value: "image" }, { label: "视频（静音）", value: "video" }] },
    mediaFit: { type: "select", label: "内屏填充方式", options: [{ label: "裁剪填满", value: "cover" }, { label: "完整显示", value: "contain" }] },
    enterEndSeconds: { type: "number", label: "入场结束（相对组件起点 / 秒）", default: 1, min: 0.1, step: 0.1 },
    exitStartSeconds: { type: "number", label: "出场开始（相对组件起点 / 秒）", default: 5.33, min: 0.1, step: 0.1 },
    exitEndSeconds: { type: "number", label: "出场结束（相对组件起点 / 秒）", default: 6, min: 0.2, step: 0.1 },
  },
};
