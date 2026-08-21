import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const LOCAL_COMPONENT_FPS = 30;
export const LOCAL_COMPONENT_DURATION_IN_FRAMES = 180;

export type LocalPreviewProps = {
  metric?: string;
  caption?: string;
  backgroundOpacity?: number;
};

export const LocalPreview = ({
  metric = "87%",
  caption = "关键指标",
  backgroundOpacity = 1,
}: LocalPreviewProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 105 } });
  const line = interpolate(frame, [8, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const backgroundAlpha = Math.max(0, Math.min(1, backgroundOpacity));

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 520,
          padding: "34px 42px",
          borderRadius: 28,
          color: "white",
          background: `linear-gradient(135deg, rgba(10,20,35,${
            0.9 * backgroundAlpha
          }), rgba(15,34,54,${0.72 * backgroundAlpha}))`,
          border: "1px solid rgba(120,220,255,.38)",
          boxShadow: `0 24px 80px rgba(0,0,0,${
            0.45 * backgroundAlpha
          })`,
          backdropFilter:
            backgroundAlpha > 0
              ? `blur(${18 * backgroundAlpha}px)`
              : "none",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 34}px) scale(${0.92 + enter * 0.08})`,
        }}
      >
        <div
          style={{
            color: "#72e7ff",
            fontSize: 22,
            fontWeight: 650,
            letterSpacing: "0.16em",
          }}
        >
          {caption}
        </div>
        <div style={{ fontSize: 92, lineHeight: 1.05, fontWeight: 760 }}>
          {metric}
        </div>
        <div
          style={{
            height: 3,
            marginTop: 22,
            borderRadius: 99,
            transformOrigin: "left",
            transform: `scaleX(${line})`,
            background: "linear-gradient(90deg,#60e6ff,#9378ff)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default LocalPreview;
