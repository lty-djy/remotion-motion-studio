import React from "react";
import type { EffectDef } from "../registry";
import { useRafProgress } from "./use-raf-progress";

type ChapterBarProps = {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  value?: string;
  item1?: string;
  item2?: string;
  item3?: string;
  animationSeconds?: number;
  accentColor?: string;
  secondaryColor?: string;
};

export const ChapterBar = ({
  enabled = true,
  title = "开场",
  subtitle = "抽盲盒",
  value = "编辑台",
  item1 = "怎么用",
  item2 = "四大好处",
  item3 = "收尾",
  animationSeconds = 4.5,
  accentColor = "#f2f2f2",
  secondaryColor = "#3f3f46",
}: ChapterBarProps) => {
  const progress = useRafProgress(animationSeconds);
  if (!enabled) return null;
  const chapters = [title, subtitle, value, item1, item2, item3];
  const activeIndex = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));

  return (
    <div
      data-effect="ChapterBar"
      style={{
        width: 1920,
        height: 72,
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${chapters.length}, minmax(0, 1fr))`,
        alignItems: "center",
        color: "#f5f5f5",
        background: "rgba(8,8,9,.82)",
        borderBottom: "1px solid rgba(255,255,255,.14)",
        fontFamily: 'Inter, "SF Pro Display", "PingFang SC", sans-serif',
      }}
    >
      {chapters.map((chapter, index) => (
        <div
          key={`${chapter}-${index}`}
          style={{
            textAlign: "center",
            color: index === activeIndex ? accentColor : "rgba(255,255,255,.36)",
            fontSize: 19,
            fontWeight: index === activeIndex ? 620 : 460,
            letterSpacing: ".03em",
            borderRight: index < chapters.length - 1 ? "1px solid rgba(255,255,255,.1)" : "none",
            transition: "color 180ms ease, font-weight 180ms ease",
          }}
        >
          {chapter}
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: secondaryColor }}>
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: accentColor,
            transition: "width 120ms linear",
          }}
        />
      </div>
    </div>
  );
};

export const ChapterBarEffectDef: EffectDef = {
  id: "ChapterBar",
  name: "章节进度条",
  description: "随播放进度推进的顶部章节导航",
  category: "navigation",
  catalogGroup: "导航与进度",
  glyph: "CH",
  placement: "top",
  component: ChapterBar as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 18000,
  bounds: { x: 0, y: 0, width: 1920, height: 72 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: {
    enabled: true,
    title: "开场",
    subtitle: "抽盲盒",
    value: "编辑台",
    item1: "怎么用",
    item2: "四大好处",
    item3: "收尾",
    animationSeconds: 4.5,
    accentColor: "#f2f2f2",
    secondaryColor: "#3f3f46",
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示章节进度条", default: true },
    title: { type: "text", label: "章节一", default: "开场" },
    subtitle: { type: "text", label: "章节二", default: "抽盲盒" },
    value: { type: "text", label: "章节三", default: "编辑台" },
    item1: { type: "text", label: "章节四", default: "怎么用" },
    item2: { type: "text", label: "章节五", default: "四大好处" },
    item3: { type: "text", label: "章节六", default: "收尾" },
    animationSeconds: { type: "number", label: "推进时长(秒)", default: 4.5, min: 0.5, max: 600, step: 0.5 },
    accentColor: { type: "color", label: "前景颜色", default: "#f2f2f2" },
    secondaryColor: { type: "color", label: "轨道颜色", default: "#3f3f46" },
  },
};
