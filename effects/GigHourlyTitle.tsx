import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {EffectDef} from "../registry";
const SANS = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
export const GigHourlyTitle: React.FC<any> = ({eyebrowEn="AI SIDE GIG", eyebrowZh="国内 AI 兼职", priceText="¥300-3,000", priceUnit="/ 小时", priceNote="HOURLY · 时薪不等", accentColor="#F5C15C"}) => {
 const frame=useCurrentFrame(); const {fps}=useVideoConfig();
 const copyDelay=Math.round(fps*0.1);
 const copyEnter=interpolate(frame,[copyDelay,copyDelay+fps*0.5],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.bezier(0.16,1,0.3,1)});
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

</div></AbsoluteFill>;
};
export const GigHourlyTitleEffectDef: EffectDef = {
 id:"GigHourlyTitle", name:"金色时薪标题", description:"独立的金色时薪大字、中英文标签与说明，透明背景。",category:"metric",catalogGroup:"媒体展示组件",glyph:"¥",placement:"left",component:GigHourlyTitle,durationInFrames:150,bounds:{x:0,y:0,width:850,height:230},defaultPosition:{x:92,y:104,scale:1},
 defaultProps:{
    eyebrowEn: "AI SIDE GIG",
    eyebrowZh: "国内 AI 兼职",
    priceText: "¥300-3,000",
    priceUnit: "/ 小时",
    priceNote: "HOURLY · 时薪不等",
    accentColor: "#F5C15C",
 }, propsSchema:{
    eyebrowEn: { type: "text", label: "左上角英文标签" },
    eyebrowZh: { type: "text", label: "左上角中文标签" },
    priceText: { type: "text", label: "时薪大字" },
    priceUnit: { type: "text", label: "大字右侧单位" },
    priceNote: { type: "text", label: "大字下方说明" },
    accentColor: { type: "color", label: "金色强调色", default: "#F5C15C" },
 }
};
