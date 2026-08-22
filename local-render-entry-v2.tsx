import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Composition,
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
} from "./local-protocol";
import { mergeWithBuiltInDefinitions } from "./local-builtins";

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
  sourceIncludesVideo?: boolean;
  instances?: MotionInstance[];
  timelineDurationInFrames?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  transparent?: boolean;
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

const MultiComponentRender = ({
  videoSrc = "",
  sourceIncludesVideo = false,
  instances = [],
  transparent = false,
}: RenderProps) => (
  <AbsoluteFill
    style={transparent ? undefined : { backgroundColor: "#05070a" }}
  >
    <WaitForFonts />
    <VirtualClock />
    {!transparent && videoSrc ? (
      <OffthreadVideo
        src={videoSrc}
        volume={1}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    ) : null}
    {instances.map((instance) => {
      const definition = definitionMap.get(instance.componentId);
      if (!definition) return null;
      const Comp =
        definition.component as React.ComponentType<Record<string, unknown>>;
      return (
        <Sequence
          key={instance.id}
          from={Math.max(0, Math.round(instance.startFrame))}
          durationInFrames={Math.max(
            3,
            Math.round(instance.durationInFrames),
          )}
        >
          <AbsoluteFill
            style={{
              transform: `translate(${instance.position.x}px, ${instance.position.y}px) scale(${instance.position.scale})`,
              transformOrigin: "0 0",
            }}
          >
            <Comp
              {...instance.props}
              instanceDurationInFrames={instance.durationInFrames}
              videoSrc={transparent ? "" : videoSrc}
              hideVideo={sourceIncludesVideo}
              backgroundOpacity={instance.backgroundOpacity}
            />
          </AbsoluteFill>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

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
      sourceIncludesVideo: false,
      instances: [],
      timelineDurationInFrames: sourceDurationInFrames,
      canvasWidth: 1920,
      canvasHeight: 1080,
      transparent: false,
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
