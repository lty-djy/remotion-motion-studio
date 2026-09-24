import React from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import { AbsoluteFill, Img, Sequence } from "remotion";
import { FocusCamMove, useFocusCamStageStyle, type FocusCamStageTarget } from "../../effects/FocusCamMove";

const target: FocusCamStageTarget = {
  startFrame: 30,
  durationInFrames: 180,
  geom: { x: 75, y: 95, w: 440, h: 850, r: 28 },
  mediaFit: "cover",
  focus: { focusStartX: 25, focusStartY: 50, focusEndX: 30, focusEndY: 50 },
};

const Scene = () => {
  const style = useFocusCamStageStyle(target, 0);
  return <AbsoluteFill>
    <Img src="/artifacts/focus-cam-qa/background.jpg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    <Img src="/artifacts/focus-cam-qa/person.jpg" style={style ?? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    <Sequence from={30} durationInFrames={180}>
      <FocusCamMove camDX={-35} camDY={-95} camW={440} camH={850} cornerRadius={28} showRing accent="#65d6ec" />
    </Sequence>
  </AbsoluteFill>;
};

const frame = Math.max(0, Math.min(239, Number(new URLSearchParams(location.search).get("frame")) || 0));
const qaWindow = window as Window & { __focusCamQARoot?: ReturnType<typeof createRoot> };
qaWindow.__focusCamQARoot ??= createRoot(document.getElementById("root")!);
qaWindow.__focusCamQARoot.render(<Player component={Scene} compositionWidth={1920} compositionHeight={1080} fps={30} durationInFrames={240} initialFrame={frame} controls={false} style={{ width: 960, height: 540 }} />);
