import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { EffectDef } from "../registry";

const SANS = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';

type CardConfig = {
  title: string;
  desc: string;
  salary: string;
  imageUrl: string;
  left: number;
  top: number;
  rotateY: number;
  rotate: number;
  phase: number;
};

type Props = {
  enabled?: boolean;
  dimOpacity?: number;
  eyebrowEn?: string;
  eyebrowZh?: string;
  priceText?: string;
  priceUnit?: string;
  priceNote?: string;
  accentColor?: string;
  badgeText?: string;
  ctaText?: string;
  enterStaggerSeconds?: number;
  floatAmplitude?: number;
  card1Title?: string;
  card1Desc?: string;
  card1Salary?: string;
  card1ImageUrl?: string;
  card2Title?: string;
  card2Desc?: string;
  card2Salary?: string;
  card2ImageUrl?: string;
  card3Title?: string;
  card3Desc?: string;
  card3Salary?: string;
  card3ImageUrl?: string;
  card4Title?: string;
  card4Desc?: string;
  card4Salary?: string;
  card4ImageUrl?: string;
};

const CARD_WIDTH = 350;
const CARD_HEIGHT = 268;

const cardLayouts: Array<Pick<CardConfig, "left" | "top" | "rotateY" | "rotate" | "phase">> = [
  { left: 92, top: 456, rotateY: 7, rotate: -2, phase: 0 },
  { left: 1352, top: 84, rotateY: -8, rotate: 2.2, phase: 1.7 },
  { left: 1462, top: 352, rotateY: -6, rotate: -1.6, phase: 3.1 },
  { left: 1318, top: 566, rotateY: -7, rotate: 1.8, phase: 4.4 },
];

const GigCard: React.FC<{
  card: CardConfig;
  index: number;
  frame: number;
  fps: number;
  badgeText: string;
  ctaText: string;
  enterStaggerSeconds: number;
  floatAmplitude: number;
}> = ({ card, index, frame, fps, badgeText, ctaText, enterStaggerSeconds, floatAmplitude }) => {
  const delay = Math.round(fps * (0.18 + index * Math.max(0, enterStaggerSeconds)));
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 17, stiffness: 130, mass: 0.9 },
  });
  const settled = frame > delay;
  const bob = settled ? Math.sin((frame / fps) * 1.4 + card.phase) * floatAmplitude : 0;
  const wiggle = settled ? Math.sin((frame / fps) * 1.1 + card.phase) * 0.5 : 0;

  return (
    <div
      data-effect-part={`gig-card-${index + 1}`}
      style={{
        position: "absolute",
        left: card.left,
        top: card.top,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        boxSizing: "border-box",
        padding: 16,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 26px 60px rgba(0,0,0,0.42), 0 6px 16px rgba(0,0,0,0.24)",
        fontFamily: SANS,
        opacity: enter,
        transform: `perspective(1400px) translateY(${(1 - enter) * 140 + bob}px) rotateY(${card.rotateY}deg) rotate(${card.rotate + wiggle}deg) scale(${0.92 + enter * 0.08})`,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 104,
          borderRadius: 10,
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #2A2E4A 0%, #4A3E8C 55%, #7B5CFF 130%)",
        }}
      >
        {card.imageUrl ? (
          <Img
            src={card.imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        {badgeText ? (
          <span
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              padding: "3px 10px",
              borderRadius: 999,
              backgroundColor: "#7B5CFF",
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {badgeText}
          </span>
        ) : null}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 17,
          fontWeight: 700,
          color: "#101216",
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 12,
          color: "#8A8F98",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {card.desc}
      </div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 800, color: "#16181D" }}>
          {card.salary}
        </span>
      </div>
      {ctaText ? (
        <div
          style={{
            marginTop: 10,
            height: 36,
            borderRadius: 10,
            backgroundColor: "#101216",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {ctaText}
        </div>
      ) : null}
    </div>
  );
};

export const BrollGigCardFloat: React.FC<Props> = ({
  enabled = true,
  dimOpacity = 0.45,
  eyebrowEn = "AI SIDE GIG",
  eyebrowZh = "国内 AI 兼职",
  priceText = "¥300-3,000",
  priceUnit = "/ 小时",
  priceNote = "HOURLY · 时薪不等",
  accentColor = "#F5C15C",
  badgeText = "招募中",
  ctaText = "立即查看",
  enterStaggerSeconds = 0.14,
  floatAmplitude = 9,
  card1Title = "语音-豆包语音深度用户-17方言",
  card1Desc = "豆包IM场景下的 TTS & ASR 语料",
  card1Salary = "200-400 元/小时",
  card1ImageUrl = "",
  card2Title = "学习与升学规划——双人对话录制",
  card2Desc = "升学规划/志愿填报/学习规划",
  card2Salary = "2800-5000 元/小时",
  card2ImageUrl = "",
  card3Title = "教师教学-双人对话录制",
  card3Desc = "真实教学、授课、培训经验",
  card3Salary = "1500-2000 元/小时",
  card3ImageUrl = "",
  card4Title = "【知心同事】招募倾听安慰知心人",
  card4Desc = "情绪疏导对话语料采集",
  card4Salary = "2000-3000 元/小时",
  card4ImageUrl = "",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  if (!enabled) return null;

  const stageScale = Math.max(width / 1920, height / 1080);
  const cards: CardConfig[] = [
    { title: card1Title, desc: card1Desc, salary: card1Salary, imageUrl: card1ImageUrl, ...cardLayouts[0] },
    { title: card2Title, desc: card2Desc, salary: card2Salary, imageUrl: card2ImageUrl, ...cardLayouts[1] },
    { title: card3Title, desc: card3Desc, salary: card3Salary, imageUrl: card3ImageUrl, ...cardLayouts[2] },
    { title: card4Title, desc: card4Desc, salary: card4Salary, imageUrl: card4ImageUrl, ...cardLayouts[3] },
  ];

  const dim = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const copyDelay = Math.round(fps * 0.1);
  const copyEnter = interpolate(frame, [copyDelay, copyDelay + fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill data-effect="BrollGigCardFloat" style={{ overflow: "hidden", pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(6,8,12,0.62) 0%, rgba(6,8,12,0.3) 46%, rgba(6,8,12,0.58) 100%)",
          opacity: dim * Math.min(1, Math.max(0, dimOpacity)),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 1920,
          height: 1080,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 104,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: copyEnter,
            transform: `translateX(${(1 - copyEnter) * -40}px)`,
            fontFamily: SANS,
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: 5, height: 26, borderRadius: 999, backgroundColor: accentColor }}
          />
          <span
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 6,
              color: "#FFFFFF",
            }}
          >
            {eyebrowEn}
          </span>
          <span style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
            {eyebrowZh}
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 92,
            top: 158,
            opacity: copyEnter,
            transform: `translateX(${(1 - copyEnter) * -56}px)`,
            fontFamily: SANS,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span
              style={{
                fontSize: 118,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: -2,
                backgroundImage: `linear-gradient(180deg, #FFE9BC 8%, ${accentColor} 58%, #D98F2B 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.38))",
              }}
            >
              {priceText}
            </span>
            <span style={{ fontSize: 34, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
              {priceUnit}
            </span>
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 4,
              color: "rgba(255,255,255,0.66)",
            }}
          >
            <span aria-hidden="true" style={{ width: 34, height: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.4)" }} />
            {priceNote}
          </div>
        </div>

        {cards.map((card, index) =>
          card.title.trim().length > 0 ? (
            <GigCard
              key={index}
              card={card}
              index={index}
              frame={frame}
              fps={fps}
              badgeText={badgeText}
              ctaText={ctaText}
              enterStaggerSeconds={enterStaggerSeconds}
              floatAmplitude={floatAmplitude}
            />
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

export const BrollGigCardFloatEffectDef: EffectDef = {
  id: "BrollGigCardFloat",
  name: "悬浮兼职卡片群",
  description:
    "横屏口播 b-roll：背景压暗，金色时薪大字与多张招聘卡片带 3D 透视先后弹入并持续悬浮，适合讲解兼职/薪资/机会类话题。",
  category: "media",
  catalogGroup: "媒体展示组件",
  glyph: "BROLL",
  placement: "full",
  component: BrollGigCardFloat as React.ComponentType<Record<string, unknown>>,
  durationInFrames: 150,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  defaultPosition: { x: 0, y: 0, scale: 1 },
  defaultProps: {
    enabled: true,
    dimOpacity: 0.45,
    eyebrowEn: "AI SIDE GIG",
    eyebrowZh: "国内 AI 兼职",
    priceText: "¥300-3,000",
    priceUnit: "/ 小时",
    priceNote: "HOURLY · 时薪不等",
    accentColor: "#F5C15C",
    badgeText: "招募中",
    ctaText: "立即查看",
    enterStaggerSeconds: 0.14,
    floatAmplitude: 9,
    card1Title: "语音-豆包语音深度用户-17方言",
    card1Desc: "豆包IM场景下的 TTS & ASR 语料",
    card1Salary: "200-400 元/小时",
    card1ImageUrl: "",
    card2Title: "学习与升学规划——双人对话录制",
    card2Desc: "升学规划/志愿填报/学习规划",
    card2Salary: "2800-5000 元/小时",
    card2ImageUrl: "",
    card3Title: "教师教学-双人对话录制",
    card3Desc: "真实教学、授课、培训经验",
    card3Salary: "1500-2000 元/小时",
    card3ImageUrl: "",
    card4Title: "【知心同事】招募倾听安慰知心人",
    card4Desc: "情绪疏导对话语料采集",
    card4Salary: "2000-3000 元/小时",
    card4ImageUrl: "",
  },
  propsSchema: {
    enabled: { type: "boolean", label: "显示悬浮兼职卡片群", default: true },
    dimOpacity: { type: "number", label: "背景压暗强度", default: 0.45, min: 0, max: 0.9, step: 0.05 },
    eyebrowEn: { type: "text", label: "左上角英文标签" },
    eyebrowZh: { type: "text", label: "左上角中文标签" },
    priceText: { type: "text", label: "时薪大字" },
    priceUnit: { type: "text", label: "大字右侧单位" },
    priceNote: { type: "text", label: "大字下方说明" },
    accentColor: { type: "color", label: "金色强调色", default: "#F5C15C" },
    badgeText: { type: "text", label: "卡片角标文字" },
    ctaText: { type: "text", label: "卡片按钮文字" },
    enterStaggerSeconds: { type: "number", label: "卡片入场间隔(秒)", default: 0.14, min: 0, max: 1, step: 0.02 },
    floatAmplitude: { type: "number", label: "悬浮幅度(px)", default: 9, min: 0, max: 30, step: 1 },
    card1Title: { type: "text", label: "卡片1标题" },
    card1Desc: { type: "text", label: "卡片1描述" },
    card1Salary: { type: "text", label: "卡片1时薪" },
    card1ImageUrl: { type: "text", label: "卡片1配图" },
    card2Title: { type: "text", label: "卡片2标题" },
    card2Desc: { type: "text", label: "卡片2描述" },
    card2Salary: { type: "text", label: "卡片2时薪" },
    card2ImageUrl: { type: "text", label: "卡片2配图" },
    card3Title: { type: "text", label: "卡片3标题" },
    card3Desc: { type: "text", label: "卡片3描述" },
    card3Salary: { type: "text", label: "卡片3时薪" },
    card3ImageUrl: { type: "text", label: "卡片3配图" },
    card4Title: { type: "text", label: "卡片4标题" },
    card4Desc: { type: "text", label: "卡片4描述" },
    card4Salary: { type: "text", label: "卡片4时薪" },
    card4ImageUrl: { type: "text", label: "卡片4配图" },
  },
};
