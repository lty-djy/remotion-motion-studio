import React from "react";
import {
  AbsoluteFill,
  Composition,
  OffthreadVideo,
  Sequence,
  registerRoot,
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
};

const MultiComponentRender = ({
  videoSrc = "",
  sourceIncludesVideo = false,
  instances = [],
}: RenderProps) => (
  <AbsoluteFill style={{ backgroundColor: "#05070a" }}>
    {videoSrc ? <OffthreadVideo src={videoSrc} volume={1} /> : null}
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
              videoSrc={videoSrc}
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
    }}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(
        1,
        Math.round(
          Number(props.timelineDurationInFrames) || sourceDurationInFrames,
        ),
      ),
      props,
    })}
  />
);

registerRoot(Root);
