import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { EffectDef } from "../registry";

type Props = {
  chapters?: string;
  showProgress?: boolean;
  progMode?: "fill" | "line";
  /** 进度色:空 = 用默认蓝;兼容旧实例的预设名 */
  progAccent?: string;
  /** 章节文字色:空 = 用默认白;选中后按 100%/70%/44% 派生三级层次 */
  textColor?: string;
  progAlpha?: number;
  speed?: number;
  instanceDurationInFrames?: number;
};

/** 强调色默认值(原"数据蓝") */
export const CHAPTER_BAR_DEFAULT_ACCENT = "#5fa0fa";

/** 旧实例存的预设名 → hex;其余值原样透传 */
const LEGACY_ACCENT_NAMES: Record<string, string> = {
  blue: "#5fa0fa",
  alert: "#e88686",
  orange: "#f0a24f",
};

const resolveAccent = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  return LEGACY_ACCENT_NAMES[value] ?? value;
};

/** #rgb / #rrggbb → {r,g,b};非法返回 null */
const hexToRgb = (value: string): { r: number; g: number; b: number } | null => {
  const m = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(value.trim());
  if (!m) return null;
  const hex = m[1];
  const full =
    hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

/** 暗底令牌:与参考项目 hud.css 的暗色组取值一致 */
const THEME_TOKENS = {
  ink: "#ffffff",
  muted: "rgba(255, 255, 255, 0.70)",
  faint: "rgba(255, 255, 255, 0.44)",
  node: "#12121a",
  brd: "rgba(255, 255, 255, 0.22)",
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

/** 根据章节表自动推导轨道长度(秒):最后一章起始 + 最后一章保留时长。 */
export const chapterBarAutoDurationSeconds = (
  raw: string,
  lastChapterSeconds = 10,
): number => {
  const items = parseChapters(raw || "");
  const lastStart = items.length ? items[items.length - 1].start : 0;
  const tail =
    Number.isFinite(lastChapterSeconds) && lastChapterSeconds > 0
      ? lastChapterSeconds
      : 10;
  return Math.max(0, lastStart) + tail;
};

/**
 * 常驻章节导航条:整期视频的地图,贴在画面顶部全程在场。
 * 当前章节高亮 + 章内进度线,讲到哪一章观众随时知道。
 * 用法:一张卡从 0 拉到视频结尾,章节表按你的稿子分段填(秒数相对本卡起点)。
 */
export const ChapterBar: React.FC<Props> = ({
  chapters = "开场 0 | 章节名 6 | 按起始秒填 14 | 结尾 24",
  showProgress = true,
  progMode = "fill",
  progAccent = "",
  textColor = "",
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

  const tokens = THEME_TOKENS;
  // 进度色(整条上色/前沿亮边/细线进度共用);空值兼容旧实例,落到默认蓝
  const progColor = resolveAccent(progAccent, CHAPTER_BAR_DEFAULT_ACCENT);
  // 文字色为空时跟随底色主题;自定义后按透明度派生三级层次(当前章/已讲/未到)
  const customTextRgb = hexToRgb(textColor);
  const inkColor = customTextRgb ? textColor.trim() : tokens.ink;
  const mutedColor = customTextRgb
    ? `rgba(${customTextRgb.r}, ${customTextRgb.g}, ${customTextRgb.b}, 0.7)`
    : tokens.muted;
  const faintColor = customTextRgb
    ? `rgba(${customTextRgb.r}, ${customTextRgb.g}, ${customTextRgb.b}, 0.44)`
    : tokens.faint;
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
        color: inkColor,
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
              color: isOn ? inkColor : isDone ? mutedColor : faintColor,
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
                  background: progColor,
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
  name: "常驻章节导航条",
  description: "常驻章节导航 · 顶部全程在场的本期地图",
  category: "portrait-narrative",
  catalogGroup: "竖屏口播信息层",
  glyph: "CB",
  placement: "top",
  component: ChapterBar as React.ComponentType<Record<string, unknown>>,
  // 默认章节表最后一章起始 24 秒 + 最后一章保留 10 秒 = 34 秒(30fps → 1020 帧)
  durationInFrames: 1020,
  bounds: { x: 0, y: 0, width: 1920, height: 48 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: {
    chapters: "开场 0 | 章节名 6 | 按起始秒填 14 | 结尾 24",
    lastChapterSeconds: 10,
    panelColor: "#12121a",
    showProgress: true,
    progMode: "fill",
    progAccent: CHAPTER_BAR_DEFAULT_ACCENT,
    textColor: "",
    progAlpha: 0.25,
    speed: 1,
  },
  propsSchema: {
    chapters: {
      type: "text",
      label: "章节表(名称 起始秒,| 分隔)",
      default: "开场 0 | 章节名 6 | 按起始秒填 14 | 结尾 24",
    },
    lastChapterSeconds: {
      type: "number",
      label: "最后一章时长(秒)",
      default: 10,
      min: 1,
      max: 120,
      step: 1,
    },
    progAlpha: {
      type: "number",
      label: "进度色透明度",
      default: 0.25,
      min: 0.1,
      max: 1,
      step: 0.05,
    },
    panelColor: {
      type: "color",
      label: "卡片底色",
      default: "#12121a",
    },
    speed: {
      type: "number",
      label: "动画速度(此卡)",
      default: 1,
      min: 0.25,
      max: 3,
      step: 0.05,
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
      type: "color",
      label: "进度色",
      default: CHAPTER_BAR_DEFAULT_ACCENT,
    },
    textColor: {
      type: "color",
      label: "文字颜色(默认跟随底色)",
      default: "",
    },
  },
};
