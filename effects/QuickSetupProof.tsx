import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  backgroundOpacity?: number;
  title?: string;
  kicker?: string;
  tag1?: string;
  tag2?: string;
  checkmark?: string;
  accentColor?: string;
  warningColor?: string;
  strikeColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const QuickSetupProof: React.FC<Props> = ({
  enabled = true,
  backgroundOpacity = 0,
  title = "只花了几分钟",
  kicker = "NO AE · NO EDITING BACKGROUND",
  tag1 = "不会 AE",
  tag2 = "没有剪辑背景的小白",
  checkmark = "✓",
  accentColor = "#F6A43B",
  warningColor = "#FF8C8C",
  strikeColor = "#FF4358",
  panelColor = "#171217",
  textColor = "#FFFFFF",
  animationSeconds = 0.9,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(18, Math.round(animationSeconds * fps));
  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  if (!enabled) return null;

  return (
    <Interactive.Div
      name="快速上手证明条"
      data-effect="QuickSetupProof"
      style={{
        position: "relative",
        width: 700,
        height: 245,
        color: textColor,
        fontFamily: 'Inter, "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        pointerEvents: "none",
      }}
    >
      <Interactive.Div
        name="勾选徽标"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "grid",
          width: 78,
          height: 78,
          placeItems: "center",
          borderRadius: 13,
          color: "#15120D",
          background: `linear-gradient(145deg, color-mix(in srgb, ${accentColor} 86%, white 14%), ${accentColor})`,
          boxShadow: `0 8px 18px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.34), 0 0 20px ${accentColor}22`,
          fontFamily: "Arial, sans-serif",
          fontSize: 54,
          fontWeight: 700,
          lineHeight: 1,
          opacity: interpolate(frame, [0, enterFrames * 0.48], [0, 1], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0, enterFrames * 0.48], ["0px 20px", "0px 0px"], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, enterFrames * 0.34, enterFrames * 0.58], [0.72, 1.08, 1], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          transformOrigin: "50% 50%",
        }}
      >
        {checkmark}
      </Interactive.Div>

      <Interactive.Div
        name="结论标题"
        style={{
          position: "absolute",
          top: -7,
          left: 100,
          width: 590,
          overflow: "hidden",
          color: textColor,
          fontSize: 68,
          fontWeight: 950,
          lineHeight: 1.16,
          letterSpacing: -2.6,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textShadow: "0 5px 13px rgba(0,0,0,.48)",
          opacity: interpolate(frame, [enterFrames * 0.12, enterFrames * 0.66], [0, 1], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [enterFrames * 0.12, enterFrames * 0.66], ["-22px 15px", "0px 0px"], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {title}
      </Interactive.Div>

      <Interactive.Div
        name="英文副标"
        style={{
          position: "absolute",
          top: 95,
          left: 2,
          maxWidth: 660,
          overflow: "hidden",
          color: accentColor,
          fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
          fontSize: 17,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: 4.1,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textShadow: `0 3px 8px ${panelColor}`,
          opacity: interpolate(frame, [enterFrames * 0.42, enterFrames * 0.88], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          }),
          translate: interpolate(frame, [enterFrames * 0.42, enterFrames * 0.88], ["0px 9px", "0px 0px"], {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          }),
        }}
      >
        {kicker}
      </Interactive.Div>

      <Interactive.Div
        name="条件标签组"
        style={{
          position: "absolute",
          top: 144,
          left: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: 700,
          height: 64,
        }}
      >
        {[tag1, tag2].map((tag, index) => (
          <Interactive.Div
            name={`条件标签 ${index + 1}`}
            data-proof-tag={index + 1}
            key={`${index}-${tag}`}
            style={{
              display: "inline-flex",
              position: "relative",
              alignItems: "center",
              maxWidth: index === 0 ? 210 : 430,
              minHeight: 54,
              padding: "0 16px",
              boxSizing: "border-box",
              overflow: "hidden",
              border: `2px solid color-mix(in srgb, ${warningColor} 72%, transparent)`,
              borderRadius: 9,
              color: warningColor,
              backgroundColor: `color-mix(in srgb, ${panelColor} ${Math.round(72 + bgFactor * 20)}%, transparent)`,
              boxShadow: `0 6px 14px rgba(0,0,0,.24), inset 0 0 16px ${warningColor}0D`,
              backdropFilter: "blur(8px)",
              fontSize: 24,
              fontWeight: 850,
              lineHeight: 1,
              letterSpacing: -0.5,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              opacity: interpolate(frame, [enterFrames * (0.76 + index * 0.28), enterFrames * (1.24 + index * 0.28)], [0, 1], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [enterFrames * (0.76 + index * 0.28), enterFrames * (1.24 + index * 0.28)], ["-18px 10px", "0px 0px"], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              scale: interpolate(frame, [enterFrames * (0.76 + index * 0.28), enterFrames * (1.12 + index * 0.28), enterFrames * (1.32 + index * 0.28)], [0.92, 1.025, 1], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              transformOrigin: "0% 50%",
            }}
          >
            <span style={{ marginRight: 7, fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 22, fontWeight: 950 }}>×</span>
            {tag}
            <Interactive.Div
              name={`标签删除线 ${index + 1}`}
              style={{
                position: "absolute",
                top: 26,
                left: 8,
                zIndex: 3,
                width: interpolate(
                  frame,
                  [enterFrames * (1.3 + index * 0.28), enterFrames * (1.66 + index * 0.28)],
                  [0, index === 0 ? 176 : 360],
                  {
                    ...clamp,
                    easing: Easing.out(Easing.cubic),
                  },
                ),
                height: 3,
                borderRadius: 99,
                backgroundColor: strikeColor,
                boxShadow: `0 0 6px ${strikeColor}66`,
                rotate: index === 0 ? "-4deg" : "-3deg",
                transformOrigin: "0% 50%",
              }}
            />
          </Interactive.Div>
        ))}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const QuickSetupProofEffectDef: EffectDef = {
  id: "QuickSetupProof",
  name: "快速上手证明条",
  description: "橙色勾选徽标和粗白结论先落位，两枚限制条件标签错峰弹入后分别由细红线划过。",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "FAST",
  placement: "top",
  component: QuickSetupProof as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 700, height: 245 },
  defaultPosition: { x: 0, y: 118, scale: 1 },
  defaultProps: {
    enabled: true,
    title: "只花了几分钟",
    kicker: "NO AE · NO EDITING BACKGROUND",
    tag1: "不会 AE",
    tag2: "没有剪辑背景的小白",
    checkmark: "✓",
    accentColor: "#F6A43B",
    warningColor: "#FF8C8C",
    strikeColor: "#FF4358",
    panelColor: "#171217",
    textColor: "#FFFFFF",
    animationSeconds: 0.9,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示证明条", default: true },
    title: { type: "text", label: "结论标题" },
    kicker: { type: "text", label: "英文副标" },
    tag1: { type: "text", label: "条件标签一" },
    tag2: { type: "text", label: "条件标签二" },
    checkmark: { type: "text", label: "勾选符号" },
    accentColor: { type: "color", label: "徽标强调色", default: "#F6A43B" },
    warningColor: { type: "color", label: "条件警示色", default: "#FF8C8C" },
    strikeColor: { type: "color", label: "删除线颜色", default: "#FF4358" },
    panelColor: { type: "color", label: "标签底色", default: "#171217" },
    textColor: { type: "color", label: "标题颜色", default: "#FFFFFF" },
    animationSeconds: { type: "number", label: "主入场时长(秒)", default: 0.9, min: 0.45, max: 1.8, step: 0.05 },
  },
};
