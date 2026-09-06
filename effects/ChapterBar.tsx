import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type AccentKey = "blue" | "alert" | "orange";

type ThemeKey = "dark" | "light";

type Props = {
  chapters?: string;
  theme?: ThemeKey;
  accent?: AccentKey;
  showProgress?: boolean;
  progMode?: "fill" | "line";
  progAccent?: "" | AccentKey;
  progAlpha?: number;
  speed?: number;
  instanceDurationInFrames?: number;
};

/** 主题令牌:与参考项目 hud.css 的亮/暗两组取值一一对应 */
const THEME_TOKENS: Record<
  ThemeKey,
  { ink: string; muted: string; faint: string; node: string; brd: string; colors: Record<AccentKey, string> }
> = {
  dark: {
    ink: "#ffffff",
    muted: "rgba(255, 255, 255, 0.70)",
    faint: "rgba(255, 255, 255, 0.44)",
    node: "#12121a",
    brd: "rgba(255, 255, 255, 0.22)",
    colors: { blue: "#5fa0fa", alert: "#e88686", orange: "#f0a24f" },
  },
  light: {
    ink: "#1a2540",
    muted: "rgba(26, 37, 64, 0.66)",
    faint: "rgba(26, 37, 64, 0.42)",
    node: "#ece6e0",
    brd: "rgba(255, 255, 255, 0.85)",
    colors: { blue: "#1e63d8", alert: "#cf5555", orange: "#d97a1c" },
  },
};

interface Chapter {
  label: string;
  start: number;
}

/** "开场 0 | 章节名 6" → [{label, start}],按 start 升序 */
function parseChapters(raw: string): Chapter[] {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^(.*?)\s+([\d.]+)$/);
      return m
        ? { label: m[1].trim(), start: parseFloat(m[2]) }
        : { label: seg, start: 0 };
    })
    .sort((a, b) => a.start - b.start);
}

/**
 * 常驻章节导航条:整期视频的地图,贴在画面顶部全程在场。
 * 当前章节高亮 + 章内进度线,讲到哪一章观众随时知道。
 * 用法:一张卡从 0 拉到视频结尾,章节表按你的稿子分段填(秒数相对本卡起点)。
 */
export const ChapterBar: React.FC<Props> = ({
  chapters = "开场 0 | 章节名 6 | 按起始秒填 14 | 结尾 24",
  theme = "dark",
  accent = "blue",
  showProgress = true,
  progMode = "fill",
  progAccent = "",
  progAlpha = 0.25,
  speed = 1,
  instanceDurationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasWidth } = useVideoConfig();
  const t = frame / fps;
  // 进度终点 = 本卡结束秒(最后一章讲到卡尾兜底)
  const cardEnd =
    typeof instanceDurationInFrames === "number" && instanceDurationInFrames > 0
      ? instanceDurationInFrames / fps
      : null;

  // 设计宽固定 1920(=bounds.width),落位层会按 画布宽/1920 整体缩放。
  // 这里反推补偿系数:无论横竖屏,条高/字号都保持 48px/21px 的观感(与参考一致)。
  const fitScale = canvasWidth / 1920;
  const barHeight = Math.round(48 / fitScale);
  const fontSize = 21 / fitScale;
  const inset = 14 / fitScale;
  const progLineHeight = 4 / fitScale;
  const edgeWidth = 3 / fitScale;

  const tokens = THEME_TOKENS[theme] ?? THEME_TOKENS.dark;
  const accentColor = tokens.colors[accent] ?? tokens.colors.blue;
  const progColor =
    progAccent && tokens.colors[progAccent as AccentKey]
      ? tokens.colors[progAccent as AccentKey]
      : accentColor;
  const alpha = Math.min(1, Math.max(0.05, progAlpha));

  // 进场:从画面上方滑入,速度倍率只作用于这段进场
  const enterFrames = Math.max(1, (0.7 * fps) / Math.max(speed, 0.1));
  const slide = interpolate(frame, [0, enterFrames], ["-110%", "0%"], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const items = parseChapters(chapters);
  if (!items.length) return null;

  // 当前章 = 最后一个 start <= t 的章节
  let active = 0;
  for (let i = 0; i < items.length; i++) if (t >= items[i].start) active = i;
  // 章内进度:本章 start → 下一章 start(最后一章用卡片结束时间兜底)
  const cs = items[active].start;
  const ce = items[active + 1]?.start ?? cardEnd ?? cs + 30;
  const pct = Math.min(1, Math.max(0, (t - cs) / Math.max(ce - cs, 0.1)));
  // 整条进度 = 已讲完的章(整格) + 当前章内进度(半格),所以颜色是一路往右推的
  const fill = ((active + pct) / items.length) * 100;
  const isFill = progMode === "fill";

  return (
    <div
      data-effect="ChapterBar"
      style={{
        position: "relative",
        // 固定设计宽:落位层的 scale(画布宽/1920) 会把它正好铺满画布宽度,
        // 不能写 100%——那是相对画布宽,再乘一次落位缩放就会变窄。
        width: 1920,
        height: barHeight,
        display: "flex",
        alignItems: "stretch",
        boxSizing: "border-box",
        overflow: "hidden",
        background: `color-mix(in srgb, ${tokens.node} 88%, transparent)`,
        borderBottom: `${1 / fitScale}px solid ${tokens.brd}`,
        color: tokens.ink,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
        transform: `translateY(${slide})`,
        pointerEvents: "none",
      }}
    >
      {showProgress && isFill ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${fill}%`,
            background: `color-mix(in srgb, ${progColor} ${Math.round(alpha * 100)}%, transparent)`,
          }}
        >
          {/* 进度前沿一道亮边:让"往前走"看得出方向 */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: edgeWidth,
              background: progColor,
              opacity: 0.9,
            }}
          />
        </div>
      ) : null}
      {items.map((c, i) => {
        const isOn = i === active;
        const isDone = i < active;
        return (
          <div
            key={`${c.label}-${i}`}
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              color: isOn ? tokens.ink : isDone ? tokens.muted : tokens.faint,
              fontSize,
              fontWeight: isOn ? 800 : 600,
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
          >
            {/* 章节之间的分隔竖线 */}
            {i > 0 ? (
              <i
                style={{
                  position: "absolute",
                  left: 0,
                  top: inset,
                  bottom: inset,
                  width: 1 / fitScale,
                  background: tokens.brd,
                }}
              />
            ) : null}
            <span>{c.label}</span>
            {/* 章内进度线:当前章底部随时间填满 */}
            {isOn && showProgress && !isFill ? (
              <i
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  height: progLineHeight,
                  width: `${pct * 100}%`,
                  background: accentColor,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export const ChapterBarEffectDef: EffectDef = {
  id: "ChapterBar",
  name: "ChapterBar",
  description: "常驻章节导航 · 顶部全程在场的本期地图",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "CB",
  placement: "top",
  component: ChapterBar as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 300,
  bounds: { x: 0, y: 0, width: 1920, height: 48 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: {
    chapters: "开场 0 | 章节名 6 | 按起始秒填 14 | 结尾 24",
    theme: "dark",
    accent: "blue",
    showProgress: true,
    progMode: "fill",
    progAccent: "",
    progAlpha: 0.25,
    speed: 1,
  },
  propsSchema: {
    chapters: {
      type: "text",
      label: "章节表(名称 起始秒,| 分隔)",
      default: "开场 0 | 章节名 6 | 按起始秒填 14 | 结尾 24",
    },
    progAlpha: {
      type: "number",
      label: "进度色透明度",
      default: 0.25,
      min: 0.1,
      max: 1,
      step: 0.05,
    },
    speed: {
      type: "number",
      label: "动画速度(此卡)",
      default: 1,
      min: 0.25,
      max: 3,
      step: 0.05,
    },
    theme: {
      type: "select",
      label: "底色(此卡独立生效)",
      default: "dark",
      options: [
        { label: "🌞 亮底", value: "light" },
        { label: "🌙 暗底", value: "dark" },
      ],
    },
    accent: {
      type: "select",
      label: "强调色",
      default: "blue",
      options: [
        { label: "数据蓝", value: "blue" },
        { label: "否定红", value: "alert" },
        { label: "转变橙", value: "orange" },
      ],
    },
    showProgress: { type: "boolean", label: "显示进度", default: true },
    progMode: {
      type: "select",
      label: "进度形态",
      default: "fill",
      options: [
        { label: "整条上色 · 往前推", value: "fill" },
        { label: "细线 · 只在当前章底部", value: "line" },
      ],
    },
    progAccent: {
      type: "select",
      label: "进度色(默认跟随强调色)",
      default: "",
      options: [
        { label: "跟随强调色", value: "" },
        { label: "数据蓝", value: "blue" },
        { label: "否定红", value: "alert" },
        { label: "转变橙", value: "orange" },
      ],
    },
  },
};
