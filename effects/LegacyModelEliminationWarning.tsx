import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  enabled?: boolean;
  kicker?: string;
  title?: string;
  subtitle?: string;
  stampText?: string;
  warningColor?: string;
  accentColor?: string;
  panelColor?: string;
  textColor?: string;
  animationSeconds?: number;
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const LegacyModelEliminationWarning: React.FC<Props> = ({
  enabled = true,
  kicker = "OLD MODEL · WARNING",
  title = "单纯卖货",
  subtitle = "PRODUCT-ONLY STORE",
  stampText = "市场淘汰",
  warningColor = "#FF4358",
  accentColor = "#FFB735",
  panelColor = "#080F19",
  textColor = "#F8FBFF",
  animationSeconds = 1.12,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const strikeEndFrame = Math.max(18, animationSeconds * fps);
  const strikeStartFrame = strikeEndFrame * (0.72 / 1.12);
  const intro = spring({
    frame,
    fps,
    durationInFrames: 16,
    config: { damping: 22, stiffness: 180, mass: 0.8 },
  });
  const stamp = spring({
    frame: frame - strikeEndFrame,
    fps,
    durationInFrames: 12,
    config: { damping: 17, stiffness: 220, mass: 0.65 },
  });

  if (!enabled) return null;

  return (
    <Interactive.Div
      name="旧方案淘汰警告"
      data-effect="LegacyModelEliminationWarning"
      style={{
        position: "relative",
        width: 900,
        height: 420,
        color: textColor,
        fontFamily:
          'Inter, "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
        opacity: intro,
        translate: `${interpolate(intro, [0, 1], [-34, 0], clamp)}px ${interpolate(
          intro,
          [0, 1],
          [20, 0],
          clamp,
        )}px`,
        scale: interpolate(intro, [0, 1], [0.975, 1], clamp),
        transformOrigin: "0% 0%",
        pointerEvents: "none",
      }}
    >
      <Interactive.Div
        name="警告标签"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: warningColor,
          fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
          fontSize: 16,
          fontWeight: 850,
          lineHeight: 1,
          letterSpacing: 2.2,
        }}
      >
        {kicker}
      </Interactive.Div>

      <Interactive.Div
        name="淘汰对象面板"
        style={{
          position: "absolute",
          top: 45,
          left: 0,
          width: 880,
          height: 198,
          padding: "36px 38px",
          boxSizing: "border-box",
          overflow: "hidden",
          border: `1px solid ${accentColor}66`,
          borderRadius: 19,
          background: `linear-gradient(180deg, color-mix(in srgb, ${panelColor} 96%, white 4%), color-mix(in srgb, ${panelColor} 92%, black 8%))`,
          boxShadow: `0 20px 52px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.045), 0 0 26px ${accentColor}14`,
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            overflow: "hidden",
            color: textColor,
            fontSize: 72,
            fontWeight: 950,
            lineHeight: 1,
            letterSpacing: -2.2,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 18,
            overflow: "hidden",
            color: accentColor,
            fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
            fontSize: 16,
            fontWeight: 850,
            lineHeight: 1,
            letterSpacing: 2.2,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle}
        </div>

        <Interactive.Div
          name="删除线"
          style={{
            position: "absolute",
            top: 91,
            left: 28,
            width: interpolate(
              frame,
              [strikeStartFrame, strikeEndFrame],
              [0, 405],
              {
                ...clamp,
                easing: Easing.out(Easing.cubic),
              },
            ),
            height: 8,
            borderRadius: 99,
            backgroundColor: warningColor,
            rotate: "-6deg",
            transformOrigin: "0% 50%",
            boxShadow: `0 0 18px ${warningColor}88`,
          }}
        />
      </Interactive.Div>

      <Interactive.Div
        name="淘汰印章"
        style={{
          position: "absolute",
          top: 277,
          left: 0,
          display: "inline-flex",
          alignItems: "center",
          maxWidth: 650,
          minHeight: 94,
          padding: "18px 25px",
          boxSizing: "border-box",
          overflow: "hidden",
          border: `3px solid ${warningColor}`,
          borderRadius: 12,
          color: warningColor,
          backgroundColor: `color-mix(in srgb, ${panelColor} 34%, transparent)`,
          fontSize: 48,
          fontWeight: 950,
          lineHeight: 1,
          letterSpacing: 3,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          rotate: "-3deg",
          scale: interpolate(stamp, [0, 1], [1.22, 1], clamp),
          opacity: stamp,
          transformOrigin: "50% 50%",
          boxShadow: `0 0 28px ${warningColor}44`,
          backdropFilter: "blur(8px)",
        }}
      >
        {stampText}
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const LegacyModelEliminationWarningEffectDef: EffectDef = {
  id: "LegacyModelEliminationWarning",
  name: "旧方案淘汰警告",
  description:
    "深色科技警告面板：标题先入场，红色删除线划过旧方案，最后盖下淘汰印章。",
  category: "warning",
  catalogGroup: "风险提醒",
  glyph: "WARN",
  placement: "left",
  component:
    LegacyModelEliminationWarning as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 96,
  bounds: { x: 0, y: 0, width: 900, height: 420 },
  defaultPosition: { x: 58, y: 455, scale: 1 },
  defaultProps: {
    enabled: true,
    kicker: "OLD MODEL · WARNING",
    title: "单纯卖货",
    subtitle: "PRODUCT-ONLY STORE",
    stampText: "市场淘汰",
    warningColor: "#FF4358",
    accentColor: "#FFB735",
    panelColor: "#080F19",
    textColor: "#F8FBFF",
    animationSeconds: 1.12,
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示淘汰警告", default: true },
    kicker: { type: "text", label: "顶部警告标签" },
    title: { type: "text", label: "淘汰对象" },
    subtitle: { type: "text", label: "英文小标签" },
    stampText: { type: "text", label: "印章结论" },
    warningColor: { type: "color", label: "警示色", default: "#FF4358" },
    accentColor: { type: "color", label: "边框强调色", default: "#FFB735" },
    panelColor: { type: "color", label: "面板颜色", default: "#080F19" },
    textColor: { type: "color", label: "标题颜色", default: "#F8FBFF" },
    animationSeconds: {
      type: "number",
      label: "划线完成时间(秒)",
      default: 1.12,
      min: 0.6,
      max: 2.2,
      step: 0.04,
    },
  },
};
