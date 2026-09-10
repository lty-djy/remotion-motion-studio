import React from "react";
import {AbsoluteFill, Img, OffthreadVideo, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {EffectDef} from "../registry";
import {readGigCards, gigCardMotion, type GigCardConfig, type GigCardMediaType} from "./gig-card-model";
const SANS = 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
type CardConfig = GigCardConfig;
const CARD_HEIGHT=268;
const isVideoCard = (mediaType: GigCardMediaType) => mediaType === "video";
const GigCard: React.FC<{
  card: CardConfig;
  index: number;
  frame: number;
  fps: number;
  badgeText: string;
  ctaText: string;
  enterStaggerSeconds: number;
  floatAmplitude: number;
  wiggleAmplitude: number;
  wiggleAmplitudeY: number;
  videoMuted: boolean;
}> = ({ card, index, frame, fps, badgeText, ctaText, enterStaggerSeconds, floatAmplitude, wiggleAmplitude, wiggleAmplitudeY, videoMuted }) => {
  const motion=gigCardMotion(card,index,frame,fps,{enterStaggerSeconds,floatAmplitude,wiggleAmplitude,wiggleAmplitudeY});

  return (
    <div
      data-effect-part={`gig-card-${index + 1}`}
      style={{
        position: "absolute",
        left: card.left,
        top: card.top,
        width: card.width,
        height: card.mode === "image" ? card.width/card.aspectRatio : CARD_HEIGHT,
        boxSizing: "border-box",
        padding: card.mode === "image" ? 0 : 16,
        borderRadius: card.radius,
        backgroundColor: card.mode === "image" ? "transparent" : "#FFFFFF",
        boxShadow: card.shadow ? "0 26px 60px rgba(0,0,0,0.42), 0 6px 16px rgba(0,0,0,0.24)" : "none",
        zIndex: card.zIndex,
        fontFamily: SANS,
        ...motion,
        transformOrigin: "center center",
      }}
    >
      {card.mode === "image" ? (card.imageUrl ? (isVideoCard(card.mediaType) ? <OffthreadVideo src={card.imageUrl} muted={videoMuted} style={{display:"block",width:"100%",height:"100%",objectFit:"contain",borderRadius:card.radius}} /> : <Img src={card.imageUrl} style={{display:"block",width:"100%",height:"100%",objectFit:"contain",borderRadius:card.radius}} />) : <div style={{height:"100%",borderRadius:card.radius,background:"#26324b",color:"white",display:"grid",placeItems:"center"}}>{isVideoCard(card.mediaType) ? "添加视频" : "添加图片"}</div>) : <>
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
      </>}
    </div>
  );
};


export const BrollGigCardFloat: React.FC<Record<string, any>> = (props) => {
 const frame=useCurrentFrame(); const {width,height,fps}=useVideoConfig();
 if(props.enabled===false) return null;
 const stageScale=Math.min(width/1920,height/1080);
 return <AbsoluteFill style={{pointerEvents:"none"}}><div style={{position:"absolute",left:"50%",top:"50%",width:1920,height:1080,transform:`translate(-50%,-50%) scale(${stageScale})`}}>
 {readGigCards(props).filter(c=>c.visible).map((card,index)=><GigCard key={card.id} card={card} index={index} frame={frame} fps={fps} badgeText={String(props.badgeText??"招募中")} ctaText={String(props.ctaText??"立即查看")} enterStaggerSeconds={Number(props.enterStaggerSeconds??0.14)} floatAmplitude={Number(props.floatAmplitude??9)} wiggleAmplitude={Number(props.wiggleAmplitude??0.5)} wiggleAmplitudeY={Number(props.wiggleAmplitudeY??0)} videoMuted={props.muted===true || props.muteVideo===true} />)}
 </div></AbsoluteFill>;
};
export const BrollGigCardFloatEffectDef: EffectDef = {
 id:"BrollGigCardFloat",name:"悬浮兼职卡片群",description:"按需增删图片或招聘卡片；每张独立移动、缩放及三轴倾斜，透明背景。",category:"media",catalogGroup:"媒体展示组件",glyph:"BROLL",placement:"full",component:BrollGigCardFloat,durationInFrames:150,bounds:{x:0,y:0,width:1920,height:1080},defaultPosition:{x:0,y:0,scale:1},
 defaultProps:{enabled:true,cardsJson:JSON.stringify(readGigCards({})),enterStaggerSeconds:0.14,floatAmplitude:9,wiggleAmplitude:0.5,wiggleAmplitudeY:0,badgeText:"招募中",ctaText:"立即查看"},
 propsSchema:{
 enabled:{type:"boolean",label:"显示图片卡片",default:true},
 cardsJson:{type:"text",label:"图片列表"},
 enterStaggerSeconds:{type:"number",label:"入场间隔（秒）",min:0,max:1,step:0.02},
 floatAmplitude:{type:"number",label:"悬浮幅度",min:0,max:30,step:1},
 wiggleAmplitude:{type:"number",label:"Z 轴摇摆幅度（度）",min:0,max:15,step:0.1},
 wiggleAmplitudeY:{type:"number",label:"Y 轴摇摆幅度（度）",min:0,max:15,step:0.1},
 badgeText:{type:"text",label:"招聘卡片角标"},ctaText:{type:"text",label:"招聘卡片按钮"}
 }
};
