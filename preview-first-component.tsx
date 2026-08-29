import React from "react";
import { AbsoluteFill, Composition, registerRoot } from "remotion";
import { PortraitStaggeredToolList } from "./effects/PortraitStaggeredToolList";

const FirstComponentApproval: React.FC = () => (
  <AbsoluteFill
    style={{
      overflow: "hidden",
      backgroundColor: "#030A10",
      backgroundImage:
        "radial-gradient(circle at 76% 18%, rgba(27, 224, 207, 0.11), transparent 28%), radial-gradient(circle at 18% 72%, rgba(138, 82, 255, 0.12), transparent 30%), linear-gradient(155deg, #07131a 0%, #03070c 58%, #05070c 100%)",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.18,
        backgroundImage:
          "linear-gradient(rgba(89, 214, 230, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(89, 214, 230, 0.06) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
        maskImage: "linear-gradient(to bottom, black, transparent 78%)",
      }}
    />
    <div style={{ position: "absolute", left: 90, top: 250 }}>
      <PortraitStaggeredToolList backgroundOpacity={0} />
    </div>
  </AbsoluteFill>
);

const Root: React.FC = () => (
  <Composition
    id="FirstComponentApproval"
    component={FirstComponentApproval}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
