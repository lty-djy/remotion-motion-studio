import React, {useId} from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";

// Original vector illustration. No external assets, screenshots or medical findings.
// Source: 陈总 耳环.srt, 00:00:00.000–00:00:09.533. Original SRT is unmodified.
export const FPS = 30;
export const DURATION_IN_FRAMES = 286;
const font = '"Microsoft YaHei", "PingFang SC", sans-serif';
const clamp = (v:number) => Math.max(0, Math.min(1,v));
const reveal = (t:number, at:number, duration=.48) => 1-Math.pow(1-clamp((t-at)/duration),3);
const defaults = {accent:"#DDB86F", warning:"#EA6661", price:"9.9", label:"S925", heading:"低价耳钉，谁来把关？", question:"标识 ≠ 材质证明", source:"依据本期口播 · 非检测结论", labelAt:5.883, questionAt:7.483, endSeconds:9.533};
type Props = Partial<typeof defaults>;
const useTiming = (p:Props) => { const f=useCurrentFrame(); const {fps}=useVideoConfig(); const t=f/fps; const d={...defaults,...p}; return {t,d,exit:1-clamp((t-d.endSeconds+.3)/.3)}; };
const micro:React.CSSProperties = {fontSize:19,letterSpacing:3,fontFamily:'Consolas, monospace'};

export const EarringAuditRail = (props:Props) => {
 const {t,d,exit}=useTiming(props); const enter=reveal(t,.133); const phase=reveal(t,d.questionAt);
 return <AbsoluteFill style={{fontFamily:font,color:"#F1F0EA",pointerEvents:"none"}}>
  <div style={{position:"absolute",left:92,top:140,width:490,opacity:enter*exit,transform:`translateX(${(1-enter)*-26}px)`}}>
   <div style={{...micro,color:d.accent,borderLeft:`3px solid ${d.accent}`,paddingLeft:15}}>01 / PRICE & PROOF</div>
   <div style={{marginTop:28,fontSize:26,fontWeight:600}}>低价耳钉观察</div>
   <div style={{height:136,display:"flex",alignItems:"baseline",gap:10,color:d.accent,textShadow:"0 4px 28px #0008"}}>
    <span style={{fontSize:43}}>¥</span><span style={{fontFamily:"Arial",fontSize:124,fontWeight:800,letterSpacing:-7}}>{d.price}</span><span style={{fontSize:24,marginLeft:12}}>包邮</span>
   </div>
   <div style={{height:1,background:`linear-gradient(90deg,${d.accent}99,transparent)`,transformOrigin:"left",transform:`scaleX(${reveal(t,.65)})`}}/>
   <div style={{marginTop:26,fontSize:32,fontWeight:700,opacity:reveal(t,1.333)}}>{d.heading}</div>
   <div style={{marginTop:38,display:"grid",gap:13}}>
    {[{at:4.05,n:"01",title:"批发价格",value:"口播提到 ¥1"},{at:d.labelAt,n:"02",title:"表面标识",value:d.label},{at:d.questionAt,n:"03",title:"实际材质",value:"需要检测证据"}].map((row,i)=>{const r=reveal(t,row.at);return <div key={row.n} style={{display:"flex",alignItems:"center",gap:16,padding:"15px 14px",borderLeft:`2px solid ${i===2?d.warning:d.accent}`,background:"linear-gradient(90deg,rgba(8,14,20,.85),rgba(8,14,20,.24))",opacity:r,transform:`translateX(${(1-r)*-16}px)`}}><span style={{...micro,color:i===2?d.warning:d.accent}}>{row.n}</span><div style={{fontSize:23,color:"#B7C0C7"}}>{row.title}</div><div style={{marginLeft:"auto",fontSize:23,fontWeight:700,color:i===2?d.warning:"#F1F0EA"}}>{row.value}</div></div>})}
   </div>
   <div style={{marginTop:26,fontSize:20,color:"#98A6B0",opacity:phase}}>{d.source}</div>
  </div>
 </AbsoluteFill>;
};

export const EarringMaterialLens = (props:Props) => {
 const {t,d,exit}=useTiming(props); const id=useId().replace(/:/g,""); const enter=reveal(t,.6); const stamp=reveal(t,d.labelAt); const doubt=reveal(t,d.questionAt);
 return <AbsoluteFill style={{fontFamily:font,color:"#F1F0EA",pointerEvents:"none"}}>
  <div style={{position:"absolute",left:1328,top:136,width:490,height:650,opacity:enter*exit,transform:`translateY(${(1-enter)*20}px)`}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",color:"#A7B7C2",...micro}}><span>OBJECT / 001</span><span style={{fontSize:17,letterSpacing:1}}>耳钉结构示意</span></div>
   <svg width="490" height="410" viewBox="0 0 490 410" style={{overflow:"visible"}}>
    <defs>
     <linearGradient id={`${id}metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFFFED"/><stop offset=".19" stopColor="#8195A8"/><stop offset=".39" stopColor="#F1F8FF"/><stop offset=".6" stopColor="#425365"/><stop offset=".8" stopColor="#C5D2DB"/><stop offset="1" stopColor="#526070"/></linearGradient>
     <radialGradient id={`${id}stone`}><stop stopColor="#F9FEFF"/><stop offset=".36" stopColor="#DDECF6"/><stop offset=".75" stopColor="#7E9EB8"/><stop offset="1" stopColor="#263E58"/></radialGradient>
     <radialGradient id={`${id}glow`}><stop stopColor="#71A7CD" stopOpacity=".14"/><stop offset="1" stopColor="#71A7CD" stopOpacity="0"/></radialGradient>
    </defs>
    <circle cx="245" cy="220" r="207" fill={`url(#${id}glow)`}/>
    <g stroke="#85A8BC" fill="none" opacity=".27"><circle cx="245" cy="213" r="158"/><circle cx="245" cy="213" r="179" strokeDasharray="2 17"/><path d="M28 213H72 M418 213H462 M245 15V49 M245 376V403"/></g>
    <g style={{transformOrigin:"245px 213px",transform:`rotate(${-13+Math.sin(t*.6)*2}deg) translateY(${Math.sin(t*1.15)*4}px)`}}>
     <path d="M245 197L359 109Q367 105 370 111L373 117Q374 122 367 126L254 219Z" fill={`url(#${id}metal)`} stroke="#D0DFE9" strokeWidth="1.5"/>
     <g transform={`translate(${doubt*22},${-doubt*15})`}><ellipse cx="343" cy="132" rx="30" ry="19" transform="rotate(-39 343 132)" fill={`url(#${id}metal)`} stroke="#DAE7ED"/><ellipse cx="343" cy="132" rx="10" ry="6" transform="rotate(-39 343 132)" fill="#182B3A"/></g>
     <path d="M139 188L185 133L259 147L291 212L242 281L166 264Z" fill={`url(#${id}metal)`} stroke="#DFEAF4" strokeWidth="3"/>
     <path d="M146 179L188 128L258 146L279 206L235 263L168 247Z" fill={`url(#${id}stone)`} stroke="#DAF0FC" strokeWidth="3"/>
     <g stroke="#EEF9FF" strokeWidth="1.5" fill="none" opacity=".85"><path d="M146 179L204 185L188 128M204 185L258 146M204 185L279 206M204 185L235 263M204 185L168 247M146 179L168 247L235 263L279 206L258 146L188 128Z"/><path d="M167 168L208 151L245 169L258 204L229 235L187 228Z"/></g>
     <path d="M177 140L183 121L187 141L207 145L188 150L183 168L178 150L159 146Z" fill="#FFFFFF" opacity={.5+.5*Math.sin(t*2)**2}/>
    </g>
    <g opacity={stamp} transform={`translate(0,${(1-stamp)*-12})`}><path d="M292 155L361 74H463" fill="none" stroke={d.accent} strokeWidth="1.5"/><circle cx="292" cy="155" r="4" fill={d.accent}/><rect x="353" y="29" width="112" height="40" rx="3" fill="#10171CEB" stroke={d.accent}/><text x="409" y="57" textAnchor="middle" fontFamily="Consolas" fontSize="27" fill={d.accent}>{d.label}</text></g>
    <g opacity={doubt}><path d="M173 248L97 323H29" fill="none" stroke={d.warning} strokeWidth="1.5"/><circle cx="173" cy="248" r="4" fill={d.warning}/><text x="28" y="352" fontSize="22" fill={d.warning}>材质？</text></g>
   </svg>
   <div style={{borderTop:"1px solid #859BA14D",paddingTop:20,display:"flex",justifyContent:"space-between",fontSize:20,color:"#ABBCC5"}}><span>可见标识</span><span style={{color:d.accent,opacity:stamp,fontFamily:"Consolas",fontSize:25}}>{d.label}</span></div>
   <div style={{marginTop:24,borderLeft:`3px solid ${d.warning}`,padding:"16px 20px",background:"linear-gradient(90deg,#1B1111E8,#1B111180)",opacity:doubt,transform:`translateY(${(1-doubt)*12}px)`}}><div style={{fontSize:30,fontWeight:700,color:d.warning}}>{d.question}</div><div style={{fontSize:18,color:"#BBAFAC",marginTop:9}}>图形仅作示意，不代表实物检测</div></div>
  </div>
 </AbsoluteFill>;
};

const schema = {
 accent:{type:"color",label:"金色强调",default:defaults.accent}, warning:{type:"color",label:"疑问强调",default:defaults.warning},
 price:{type:"text",label:"口播价格",default:defaults.price}, label:{type:"text",label:"标识文字",default:defaults.label},
 heading:{type:"text",label:"左侧设问",default:defaults.heading}, question:{type:"text",label:"右侧结论",default:defaults.question}, source:{type:"text",label:"来源说明",default:defaults.source},
 labelAt:{type:"number",label:"标识出现（秒）",min:0,max:30,step:.01,default:defaults.labelAt},questionAt:{type:"number",label:"材质疑问出现（秒）",min:0,max:30,step:.01,default:defaults.questionAt},endSeconds:{type:"number",label:"退场时间（秒）",min:1,max:60,step:.01,default:defaults.endSeconds}
};
export const MOTION_COMPONENTS = [
 {id:"EarringAuditRail",name:"耳钉观察·左侧信息",description:"跟随 SRT 逐项推进的横屏调查信息区",category:"custom",glyph:"AUDIT",exportName:"EarringAuditRail",durationInFrames:DURATION_IN_FRAMES,bounds:{x:92,y:140,width:490,height:640},defaultPosition:{x:0,y:0,scale:1},defaultProps:defaults,propsSchema:schema},
 {id:"EarringMaterialLens",name:"耳钉观察·右侧结构",description:"原创耳钉矢量示意、标识连线与材质疑问",category:"custom",glyph:"LENS",exportName:"EarringMaterialLens",durationInFrames:DURATION_IN_FRAMES,bounds:{x:1328,y:136,width:490,height:650},defaultPosition:{x:0,y:0,scale:1},defaultProps:defaults,propsSchema:schema}
];
export const MOTION_TIMELINE = MOTION_COMPONENTS.map(c=>({componentId:c.id,startFrame:0,durationInFrames:DURATION_IN_FRAMES,cardBackgroundEnabled:false,backgroundDimEnabled:false,props:{...defaults}}));
export default function EarringStudy(){return <AbsoluteFill><EarringAuditRail/><EarringMaterialLens/></AbsoluteFill>}
