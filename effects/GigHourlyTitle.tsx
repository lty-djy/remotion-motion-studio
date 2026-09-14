import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {EffectDef} from "../registry";
const SANS = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';

/** 滚动数字：从 0 滚到 targetValue，startFrame 为起始帧，duration 为滚动时长（帧） */
const CountUp: React.FC<{frame: number; startFrame: number; duration: number; target: number}> = ({frame, startFrame, duration, target}) => {
  const safeTarget = Number.isFinite(target) && target > 0 ? Math.round(target) : 0;
  const value = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, safeTarget],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)}
  );
  return <>{Math.round(value).toLocaleString("en-US")}</>;
};

export const GigHourlyTitle: React.FC<any> = ({
  eyebrowEn="AI SIDE GIG",
  eyebrowZh="国内 AI 兼职",
  pricePrefix="¥", // 数字前符号，可自由改为 $、€、₩ 等
  priceFrom,     // 可选数字：起始时薪（如 300）
  priceTo,       // 可选数字：结束时薪（如 3000）
  priceText,     // 兼容 fallback：直接文本（如 "¥300-3,000"）
  priceUnit="/ 小时",
  priceNote="HOURLY · 时薪不等",
  unitPlacement="inline",
  accentColor="#F5C15C",
  // 字号精细调节（所有 *FontSize 属性在属性面板自动走 FontSizeStepper）
  eyebrowEnFontSize=26,
  eyebrowZhFontSize=22,
  priceFontSize=118,
  priceUnitFontSize=34,
  priceNoteFontSize=24,
}) => {
 const frame=useCurrentFrame(); const {fps}=useVideoConfig();
 const copyDelay=Math.round(fps*0.1);
 const copyEnter=interpolate(frame,[copyDelay,copyDelay+fps*0.5],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.bezier(0.16,1,0.3,1)});

 // 数字滚动：与进场动画同步启动
 const countStart = copyDelay;                              // 与滑入同步开始
 const countDuration = Math.round(fps * 0.8);              // 滚动 0.8s
 const useText = typeof priceText === "string" && priceText.length > 0;
 const hasNumeric = !useText && typeof priceFrom === "number" && typeof priceTo === "number";
 return <AbsoluteFill style={{pointerEvents:"none"}}><div style={{position:"absolute",left:-92,top:-104,width:1920,height:1080}}>
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
              fontSize: eyebrowEnFontSize,
              fontWeight: 800,
              letterSpacing: 6,
              color: "#FFFFFF",
            }}
          >
            {eyebrowEn}
          </span>
          <span style={{ fontSize: eyebrowZhFontSize, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
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
                fontSize: priceFontSize,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: -2,
                backgroundImage: `linear-gradient(180deg, #FFE9BC 8%, ${accentColor} 58%, #D98F2B 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.38))",
                display: "inline-flex",
                alignItems: "baseline",
              }}
            >
              {hasNumeric ? (
                <>
                  {pricePrefix}<CountUp frame={frame} startFrame={countStart} duration={countDuration} target={priceFrom} />
                  <span style={{margin: "0 6px"}}>-</span>
                  <CountUp frame={frame} startFrame={countStart} duration={countDuration} target={priceTo} />
                </>
              ) : (
                priceText
              )}
            </span>
            {unitPlacement !== "below" && <span style={{ fontSize: priceUnitFontSize, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
              {priceUnit}
            </span>}
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: priceNoteFontSize,
              fontWeight: 600,
              letterSpacing: 4,
              color: "rgba(255,255,255,0.66)",
            }}
          >
            {unitPlacement === "below" ? <span style={{fontSize:priceUnitFontSize,letterSpacing:2,color:"rgba(255,255,255,0.85)"}}>{priceUnit}</span> : <span aria-hidden="true" style={{ width: 34, height: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.4)" }} />}
            {priceNote}
          </div>
        </div>

</div></AbsoluteFill>;
};
export const GigHourlyTitleEffectDef: EffectDef = {
 id:"GigHourlyTitle", name:"金色时薪标题", description:"独立的金色时薪大字、中英文标签与说明，透明背景。",category:"metric",catalogGroup:"媒体展示组件",glyph:"¥",placement:"left",component:GigHourlyTitle,durationInFrames:150,bounds:{x:0,y:0,width:850,height:230},defaultPosition:{x:92,y:104,scale:1},
 defaultProps:{
    eyebrowEn: "AI SIDE GIG",
    eyebrowZh: "国内 AI 兼职",
    pricePrefix: "¥",
    priceFrom: 300,
    priceTo: 3000,
    priceUnit: "/ 小时",
    priceNote: "HOURLY · 时薪不等",
    unitPlacement: "inline",
    accentColor: "#F5C15C",
    eyebrowEnFontSize: 26,
    eyebrowZhFontSize: 22,
    priceFontSize: 118,
    priceUnitFontSize: 34,
    priceNoteFontSize: 24,
 }, propsSchema:{
    eyebrowEn: { type: "text", label: "左上角英文标签" },
    eyebrowZh: { type: "text", label: "左上角中文标签" },
    pricePrefix: { type: "text", label: "数字前符号（¥ / $ / € 等）", default: "¥" },
    priceFrom: { type: "number", label: "起始时薪（数字滚动）", default: 300, step: 1 },
    priceTo: { type: "number", label: "结束时薪（数字滚动）", default: 3000, step: 1 },
    priceText: { type: "text", label: "手动时薪文本（不填则用上方数字滚动）" },
    priceUnit: { type: "text", label: "大字右侧单位" },
    unitPlacement: { type: "select", label: "单位位置", default: "inline", options: [{label:"数字右侧",value:"inline"},{label:"数字下方",value:"below"}] },
    priceNote: { type: "text", label: "大字下方说明" },
    accentColor: { type: "color", label: "金色强调色", default: "#F5C15C" },
    eyebrowEnFontSize: { type: "number", label: "英文标签字号(px)", default: 26, min: 10, max: 64, step: 1 },
    eyebrowZhFontSize: { type: "number", label: "中文标签字号(px)", default: 22, min: 10, max: 64, step: 1 },
    priceFontSize: { type: "number", label: "时薪大字字号(px)", default: 118, min: 40, max: 240, step: 1 },
    priceUnitFontSize: { type: "number", label: "单位字号(px)", default: 34, min: 10, max: 80, step: 1 },
    priceNoteFontSize: { type: "number", label: "说明字号(px)", default: 24, min: 10, max: 48, step: 1 },
 }
};
