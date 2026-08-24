import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const CodeTemplate = ({ title = "代码模板", accent = "#8b5cf6" }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ padding: "32px 42px", borderRadius: 22, color: "white", background: "#14131c", border: `1px solid ${accent}` }}>
        <div style={{ color: accent, fontSize: 14, letterSpacing: 4 }}>CODE TEMPLATE</div>
        <div style={{ marginTop: 12, fontSize: 42, fontWeight: 800 }}>{title}</div>
      </div>
    </AbsoluteFill>
  );
};

export const MOTION_COMPONENTS = [{
  id: "code-template",
  name: "代码模板",
  description: "由代码板块新建的 Remotion 效果",
  category: "custom",
  glyph: "CODE",
  exportName: "CodeTemplate",
  durationInFrames: 150,
  bounds: { x: 300, y: 700, width: 1320, height: 420 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: { title: "代码模板", accent: "#8b5cf6" },
  propsSchema: {
    title: { type: "text", label: "标题", default: "代码模板" },
    accent: { type: "color", label: "强调色", default: "#8b5cf6" }
  }
}];

export const MOTION_TIMELINE = [{ componentId: "code-template", startFrame: 0, durationInFrames: 150 }];
export default CodeTemplate;
