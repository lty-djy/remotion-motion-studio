import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  registerRoot,
  useCurrentFrame,
} from "remotion";
import * as ImportedModule from "./local-imported/active";
import {
  getMotionComponents,
  getNumberExport,
  type MotionInstance,
  type MotionModule,
  type ResourceTrack,
  type VideoTrack,
} from "./local-protocol";
import { mergeWithBuiltInDefinitions } from "./local-builtins";
import {
  ANCHORED_EFFECT_IDS,
  getAnchoredEffectPosition,
} from "./registry";
import {
  resolveFocusCamStageTarget,
  useFocusCamStageStyle,
  type FocusCamStageTarget,
} from "./effects/FocusCamMove";
import {
  CARD_BACKGROUND_CONTROL_CSS,
  getCardBackgroundControlVariables,
  supportsCardBackground,
} from "./card-background-control";
import { CardMaskLayer } from "./card-mask-control";

const motionModule = ImportedModule as MotionModule;
const fps = getNumberExport(
  motionModule,
  ["WECHAT_VIDEO_FPS", "LOCAL_COMPONENT_FPS", "FPS"],
  30,
);
const sourceDurationInFrames = getNumberExport(
  motionModule,
  [
    "WECHAT_VIDEO_DURATION_IN_FRAMES",
    "LOCAL_COMPONENT_DURATION_IN_FRAMES",
    "DURATION_IN_FRAMES",
  ],
  180,
);
const definitions = mergeWithBuiltInDefinitions(
  getMotionComponents(motionModule, sourceDurationInFrames),
);
const definitionMap = new Map(
  definitions.map((definition) => [definition.id, definition]),
);

type RenderProps = {
  videoSrc?: string;
  videoTracks?: VideoTrack[];
  resourceTracks?: ResourceTrack[];
  sourceIncludesVideo?: boolean;
  instances?: MotionInstance[];
  timelineDurationInFrames?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  transparent?: boolean;
  soundEnabled?: boolean;
};

// 页面加载时刻的真实墙钟，作为虚拟时钟的起点。
const renderStartWallClock = Date.now();

// 时钟校正：把 Date.now 固定为「帧号 / fps」的确定性虚拟时间，
// 使任何读取墙钟的动效在同一帧得到完全相同的值，不受字体加载等待时长影响。
const VirtualClock = () => {
  const frame = useCurrentFrame();
  Date.now = () => renderStartWallClock + (frame * 1000) / fps;
  return null;
};

// 等字体加载：阻塞渲染直到 document.fonts.ready（最多等 6 秒），
// 避免首帧字体未加载导致前后帧字形不一致。
const WaitForFonts = () => {
  const [handle] = useState(() => delayRender("等待字体加载"));
  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) {
        cancelled = true;
        continueRender(handle);
      }
    };
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, 6000);
    });
    Promise.race([document.fonts.ready, timeout]).then(finish);
    return () => {
      cancelled = true;
    };
  }, [handle]);
  return null;
};

/** 舞台视频轨(导出):运镜卡时间窗内套用收缩几何,窗外保持满屏 contain */
const StageCamMoveVideo: React.FC<{
  src: string;
  trimBefore: number;
  volume: number;
  muted: boolean;
  camTarget: FocusCamStageTarget | null;
  trackStartFrame: number;
}> = ({ src, trimBefore, volume, muted, camTarget, trackStartFrame }) => {
  const camStyle = useFocusCamStageStyle(camTarget, trackStartFrame);
  return (
    <OffthreadVideo
      src={src}
      trimBefore={trimBefore}
      volume={volume}
      muted={muted}
      style={
        camStyle ?? {
          // absolute:多条视频轨各自满屏叠放,DOM 顺序(上轨在后)决定压盖
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }
      }
    />
  );
};

const MultiComponentRender = ({
  videoSrc = "",
  videoTracks = [],
  resourceTracks = [],
  sourceIncludesVideo = false,
  instances = [],
  transparent = false,
  soundEnabled = true,
  canvasWidth = 1920,
  canvasHeight = 1080,
}: RenderProps) => {
  const visibleVideoTracks = transparent
    ? []
    : videoTracks.filter((track) => track.visible !== false);
  // 多条视频轨时取最上层轨(trackOrder 最小),与"上轨盖下轨"的压盖惯例一致
  const topmostVideoTrack = visibleVideoTracks.length
    ? visibleVideoTracks.reduce((top, track) =>
        track.trackOrder < top.trackOrder ? track : top,
      )
    : undefined;
  const activeVideoSrc = topmostVideoTrack?.url || videoSrc;
  const orderedLayers = [
    ...visibleVideoTracks.map((track) => ({
      kind: "video" as const,
      order: track.trackOrder,
      id: track.id,
      track,
    })),
    ...instances
      .filter((instance) => instance.visible !== false)
      .map((instance) => ({
        kind: "motion" as const,
        order: instance.trackOrder,
        id: instance.id,
        instance,
      })),
    ...resourceTracks
      .filter((track) => track.visible !== false)
      .map((track) => ({
        kind: "resource" as const,
        order: track.trackOrder,
        id: track.id,
        track,
      })),
  ].sort((a, b) => b.order - a.order);
  // 运镜卡(FocusCamMove 未手填素材)时间窗:合成导出时舞台真实视频直接收缩;
  // 透明导出无视频轨,卡片自动退回占位框,口播画面交给剪映叠放
  const camStageTarget = resolveFocusCamStageTarget(
    instances,
    canvasHeight > canvasWidth ? "portrait" : "landscape",
  );
  const camStageTrackId = camStageTarget
    ? (orderedLayers.filter((layer) => layer.kind === "video").pop()?.id ?? null)
    : null;
  return <AbsoluteFill
    style={transparent ? undefined : { backgroundColor: "#05070a" }}
  >
    <style>{CARD_BACKGROUND_CONTROL_CSS}</style>
    <WaitForFonts />
    <VirtualClock />
    {orderedLayers.map((layer) => {
      if (layer.kind === "video") {
        const track = layer.track;
        return (
        <Sequence
          key={track.id}
          from={Math.max(0, Math.round(track.startFrame))}
          durationInFrames={Math.max(3, Math.round(track.durationInFrames))}
        >
          <StageCamMoveVideo
            src={track.url}
            trimBefore={Math.max(0, Math.round(track.sourceStartFrame))}
            volume={soundEnabled ? 1 : 0}
            muted={!soundEnabled}
            camTarget={layer.id === camStageTrackId ? camStageTarget : null}
            trackStartFrame={Math.max(0, Math.round(track.startFrame))}
          />
        </Sequence>
        );
      }
      if (layer.kind === "resource") {
        const track = layer.track;
        const isAudio = track.kind === "sfx";
        const effectiveVolume = soundEnabled
          ? track.volume * (1 - track.voiceDucking)
          : 0;
        if (isAudio) {
          return (
            <Sequence
              key={track.id}
              from={Math.max(0, Math.round(track.startFrame))}
              durationInFrames={Math.max(3, Math.round(track.durationInFrames))}
            >
              <Audio
                src={track.url}
                trimBefore={Math.max(0, Math.round(track.sourceStartFrame))}
                volume={effectiveVolume}
                muted={!soundEnabled}
              />
            </Sequence>
          );
        }
        const visualStyle: React.CSSProperties = {
          position: "absolute",
          left: track.position.x,
          top: track.position.y,
          width: track.position.width,
          height: track.position.height,
          transform: `scale(${track.position.scale})`,
          transformOrigin: "0 0",
          objectFit: "contain",
          zIndex: track.position.zIndex,
        };
        return (
          <Sequence
            key={track.id}
            from={Math.max(0, Math.round(track.startFrame))}
            durationInFrames={Math.max(3, Math.round(track.durationInFrames))}
          >
            {track.mimeType.startsWith("video/") ? (
              <OffthreadVideo
                src={track.url}
                trimBefore={Math.max(0, Math.round(track.sourceStartFrame))}
                muted
                style={visualStyle}
              />
            ) : (
              <Img src={track.url} style={visualStyle} />
            )}
          </Sequence>
        );
      }
      const instance = layer.instance;
      const definition = definitionMap.get(instance.componentId);
      if (!definition) return null;
      const Comp =
        definition.component as React.ComponentType<Record<string, unknown>>;
      // 锚定效果（如 ChapterBar）：导出时与预览一致，忽略存储位置，始终贴顶全宽
      const anchored = ANCHORED_EFFECT_IDS.has(instance.componentId);
      const renderPosition = anchored
        ? getAnchoredEffectPosition(definition, canvasWidth)
        : instance.position;
      // 终端教学面板与团队归因卡片共用可选卡片底色控制。
      const cardBackgroundOn =
        supportsCardBackground(instance.componentId) &&
        instance.cardBackgroundEnabled !== false;
      return (
        <Sequence
          key={instance.id}
          from={Math.max(0, Math.round(instance.startFrame))}
          trimBefore={Math.max(0, Math.round(instance.sourceStartFrame))}
          durationInFrames={Math.max(3, instance.durationInFrames)}
        >
          <CardMaskLayer
            settings={instance.cardMask}
            bounds={definition.bounds}
            position={renderPosition}
          />
          <AbsoluteFill
            className={`studio-card-render-shell${
              !cardBackgroundOn
                ? " studio-card-background-off"
                : ""
            }${
              typeof instance.props.cardBorderColor === "string" &&
              instance.props.cardBorderColor.trim()
                ? " studio-card-border-override"
                : ""
            }`}
            style={{
              transform: `translate(${renderPosition.x}px, ${renderPosition.y}px) scale(${renderPosition.scale})`,
              transformOrigin: "0 0",
              ...getCardBackgroundControlVariables({
                enabled: cardBackgroundOn,
                opacity: instance.backgroundOpacity,
                panelColor: instance.props.panelColor,
                borderColor: instance.props.cardBorderColor,
              }),
            } as React.CSSProperties}
          >
            <Comp
              {...instance.props}
              instanceDurationInFrames={instance.durationInFrames}
              videoSrc={transparent ? "" : activeVideoSrc}
              hideVideo={sourceIncludesVideo}
              muted={!soundEnabled}
              muteVideo={!soundEnabled}
              videoVolume={soundEnabled ? 1 : 0}
              backgroundOpacity={
                cardBackgroundOn ? instance.backgroundOpacity : 0
              }
              cardTransparent={
                !cardBackgroundOn ||
                instance.props.cardTransparent === true
              }
            />
          </AbsoluteFill>
        </Sequence>
      );
    })}
    {visibleVideoTracks.length === 0 && !transparent && videoSrc ? (
      <Sequence from={0} durationInFrames={999999}>
        <StageCamMoveVideo
          src={videoSrc}
          trimBefore={0}
          volume={soundEnabled ? 1 : 0}
          muted={!soundEnabled}
          camTarget={camStageTarget}
          trackStartFrame={0}
        />
      </Sequence>
    ) : null}
  </AbsoluteFill>;
};

const Root = () => (
  <Composition
    id="ImportedMotion"
    component={MultiComponentRender}
    width={1920}
    height={1080}
    fps={fps}
    durationInFrames={sourceDurationInFrames}
    defaultProps={{
      videoSrc: "",
      videoTracks: [],
      resourceTracks: [],
      sourceIncludesVideo: false,
      instances: [],
      timelineDurationInFrames: sourceDurationInFrames,
      canvasWidth: 1920,
      canvasHeight: 1080,
      transparent: false,
      soundEnabled: true,
    }}
    calculateMetadata={({ props }) => {
      const portrait =
        Number(props.canvasWidth) === 1080 && Number(props.canvasHeight) === 1920;
      return {
        width: portrait ? 1080 : 1920,
        height: portrait ? 1920 : 1080,
        durationInFrames: Math.max(
          1,
          Math.round(
            Number(props.timelineDurationInFrames) || sourceDurationInFrames,
          ),
        ),
        props,
      };
    }}
  />
);

registerRoot(Root);

