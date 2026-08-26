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
  backgroundOpacity?: number;
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
  backgroundOpacity = 0,
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

  const bgFactor = Math.min(1, Math.max(0, backgroundOpacity));

  return (
    <Interactive.Div
      name="旧方案淘汰警告"
      data-effect="LegacyModelEliminationWarning"
      style={{
        position: "relative",
        width: 560,
        height: 310,
        color: textColor,
        fontFamily:
          'Inter, "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
        opacity: intro,
        translate: `${interpolate(intro, [0, 1], [-26, 0], clamp)}px ${interpolate(
          intro,
          [0, 1],
          [16, 0],
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
          fontSize: 13,
          fontWeight: 850,
          lineHeight: 1,
          letterSpacing: 1.8,
        }}
      >
        {kicker}
      </Interactive.Div>

      <Interactive.Div
        name="淘汰对象面板"
        style={{
          position: "absolute",
          top: 33,
          left: 0,
          width: 548,
          height: 148,
          padding: "26px 28px",
          boxSizing: "border-box",
          overflow: "hidden",
          border: bgFactor > 0 ? `1px solid ${accentColor}66` : "1px solid transparent",
          borderRadius: 15,
          background: bgFactor > 0 ? `linear-gradient(180deg, color-mix(in srgb, ${panelColor} ${Math.round(96 * bgFactor)}%, white 4%), color-mix(in srgb, ${panelColor} ${Math.round(92 * bgFactor)}%, black 8%))` : "transparent",
          boxShadow: bgFactor > 0 ? `0 16px 40px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.045), 0 0 22px ${accentColor}14` : "none",
          backdropFilter: bgFactor > 0 ? "blur(16px)" : undefined,
        }}
      >
        <div
          style={{
            overflow: "hidden",
            color: textColor,
            fontSize: 54,
            fontWeight: 950,
            lineHeight: 1,
            letterSpacing: -1.6,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 14,
            overflow: "hidden",
            color: accentColor,
            fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
            fontSize: 13,
            fontWeight: 850,
            lineHeight: 1,
            letterSpacing: 1.8,
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
            top: 68,
            left: 21,
            width: interpolate(
              frame,
              [strikeStartFrame, strikeEndFrame],
              [0, 296],
              {
                ...clamp,
                easing: Easing.out(Easing.cubic),
              },
            ),
            height: 6,
            borderRadius: 99,
            backgroundColor: warningColor,
            rotate: "-6deg",
            transformOrigin: "0% 50%",
            boxShadow: `0 0 14px ${warningColor}88`,
          }}
        />
      </Interactive.Div>

      <Interactive.Div
        name="淘汰印章"
        style={{
          position: "absolute",
          top: 205,
          left: 0,
          display: "inline-flex",
          alignItems: "center",
          maxWidth: 420,
          minHeight: 72,
          padding: "14px 20px",
          boxSizing: "border-box",
          overflow: "hidden",
          border: `3px solid ${warningColor}`,
          borderRadius: 10,
          color: warningColor,
          backgroundColor: `color-mix(in srgb, ${panelColor} 34%, transparent)`,
          fontSize: 37,
          fontWeight: 950,
          lineHeight: 1,
          letterSpacing: 2.4,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          rotate: "-3deg",
          scale: interpolate(stamp, [0, 1], [1.22, 1], clamp),
          opacity: stamp,
          transformOrigin: "50% 50%",
          boxShadow: `0 0 22px ${warningColor}44`,
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
  bounds: { x: 0, y: 0, width: 560, height: 310 },
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
