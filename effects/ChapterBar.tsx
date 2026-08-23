import React from "react";
import type { EffectDef } from "../registry";
import { useRafProgress } from "./use-raf-progress";

type ChapterBarProps = {
  enabled?: boolean;
  chapters?: string;
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

const parseChapters = (
  chapters: string | undefined,
  legacy: readonly string[],
): string[] => {
  const fromProp = (chapters ?? "")
    .split(/[|｜]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromProp.length > 0) return fromProp;
  const fromLegacy = legacy.map((s) => (s ?? "").trim()).filter(Boolean);
  return fromLegacy.length > 0 ? fromLegacy : ["章节"];
};

export const ChapterBar = ({
  enabled = true,
  chapters = "",
  title = "",
  subtitle = "",
  value = "",
  item1 = "",
  item2 = "",
  item3 = "",
  animationSeconds = 4.5,
  accentColor = "#f2f2f2",
  secondaryColor = "#3f3f46",
}: ChapterBarProps) => {
  const progress = useRafProgress(animationSeconds);
  if (!enabled) return null;
  const chapterList = parseChapters(chapters, [
    title,
    subtitle,
    value,
    item1,
    item2,
    item3,
  ]);
  const activeIndex = Math.min(
    chapterList.length - 1,
    Math.floor(progress * chapterList.length),
  );

  return (
    <div
      data-effect="ChapterBar"
      style={{
        width: 1080,
        height: 64,
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${chapterList.length}, minmax(0, 1fr))`,
        alignItems: "center",
        color: "#f5f5f5",
        background: "rgba(8,8,9,.82)",
        borderBottom: "1px solid rgba(255,255,255,.14)",
        fontFamily: 'Inter, "SF Pro Display", "PingFang SC", sans-serif',
      }}
    >
      {chapterList.map((chapter, index) => (
        <div
          key={`${chapter}-${index}`}
          style={{
            textAlign: "center",
            color: index === activeIndex ? accentColor : "rgba(255,255,255,.36)",
            fontSize: 20,
            fontWeight: index === activeIndex ? 620 : 460,
            letterSpacing: ".03em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            padding: "0 8px",
            borderRight:
              index < chapterList.length - 1
                ? "1px solid rgba(255,255,255,.1)"
                : "none",
            transition: "none",
          }}
        >
          {chapter}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          background: secondaryColor,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: accentColor,
            transition: "none",
          }}
        />
      </div>
    </div>
  );
};

export const ChapterBarEffectDef: EffectDef = {
  id: "ChapterBar",
  name: "章节进度条",
  description: "顶部章节导航：章节数量自适应（用 | 分隔，可自由增删），随播放进度推进",
  category: "navigation",
  catalogGroup: "导航与进度",
  glyph: "CH",
  placement: "top",
  component: ChapterBar as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 18000,
  bounds: { x: 0, y: 0, width: 1080, height: 64 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: {
    enabled: true,
    chapters: "开场|抽盲盒|编辑台|怎么用|四大好处|收尾",
    animationSeconds: 4.5,
    accentColor: "#f2f2f2",
    secondaryColor: "#3f3f46",
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示章节进度条", default: true },
    chapters: {
      type: "text",
      label: "章节列表(用|分隔，可自由增删)",
      default: "开场|抽盲盒|编辑台|怎么用|四大好处|收尾",
    },
    animationSeconds: { type: "number", label: "推进时长(秒)", default: 4.5, min: 0.5, max: 600, step: 0.5 },
    accentColor: { type: "color", label: "前景颜色", default: "#f2f2f2" },
    secondaryColor: { type: "color", label: "轨道颜色", default: "#3f3f46" },
  },
};
