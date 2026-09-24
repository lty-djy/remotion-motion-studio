import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import { AbsoluteFill, Img, Sequence } from "remotion";
import { FocusCamMove, useFocusCamStageStyle, type FocusCamStageTarget } from "../../effects/FocusCamMove";
import { FocusCamKeyframeEditor } from "../../focus-cam-keyframe-editor";

const qaKeyframes = [
  { frame: 0, x: 75, y: 95, w: 440, h: 850, r: 28 },
  { frame: 90, x: 1350, y: 75, w: 460, h: 460, r: 230 },
  { frame: 145, x: 80, y: 115, w: 440, h: 850, r: 28 },
];

const Scene = ({ keyframes, trim }: { keyframes: typeof qaKeyframes; trim: number }) => {
  const target: FocusCamStageTarget = {
    startFrame: 30,
    durationInFrames: 180,
    geom: { x: 75, y: 95, w: 440, h: 850, r: 28 },
    keyframes,
    mediaFit: "cover",
    focus: { focusStartX: 25, focusStartY: 50, focusEndX: 30, focusEndY: 50 },
  };
  const style = useFocusCamStageStyle(target, 0);
  return <AbsoluteFill>
    <Img src="/artifacts/focus-cam-qa/background.jpg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    <Img src="/artifacts/focus-cam-qa/person.jpg" style={style ?? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    <Sequence from={30} trimBefore={trim} durationInFrames={180}>
      <FocusCamMove camDX={-35} camDY={-95} camW={440} camH={850} cornerRadius={28} camKeyframes={keyframes} instanceSourceStartFrame={trim} showRing accent="#65d6ec" />
    </Sequence>
  </AbsoluteFill>;
};

const initialFrame = Math.max(0, Math.min(239, Number(new URLSearchParams(location.search).get("frame")) || 0));
const trim = Math.max(0, Number(new URLSearchParams(location.search).get("trim")) || 0);
const Preview = () => {
  const [frame, setFrame] = useState(initialFrame);
  const [keyframes, setKeyframes] = useState(qaKeyframes);
  return <div style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: 16 }}>
    <Player key={frame} component={Scene} inputProps={{ keyframes, trim }} compositionWidth={1920} compositionHeight={1080} fps={30} durationInFrames={240} initialFrame={frame} controls={false} style={{ width: 960, height: 540, flex: "none" }} />
    <div style={{ width: 300, color: "white" }}>
      <label>项目帧 <input aria-label="项目帧" type="number" min={0} max={239} value={frame} onChange={event => setFrame(Number(event.target.value))} /></label>
      <FocusCamKeyframeEditor props={{ side: "left", camDX: -35, camDY: -95, camW: 440, camH: 850, cornerRadius: 28, camKeyframes: keyframes }} durationInFrames={180} currentLocalFrame={frame - 30} fps={30} ratio="landscape" onChange={setKeyframes} onSeek={localFrame => setFrame(localFrame + 30)} />
      <pre data-testid="keyframes-json">{JSON.stringify(keyframes)}</pre>
    </div>
  </div>;
};
const qaWindow = window as Window & { __focusCamQARoot?: ReturnType<typeof createRoot> };
qaWindow.__focusCamQARoot ??= createRoot(document.getElementById("root")!);
qaWindow.__focusCamQARoot.render(<Preview />);
