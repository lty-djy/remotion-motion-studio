import React,{useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {AbsoluteFill,Sequence} from 'remotion';
import * as imported from './EarringStudy';
import source from './EarringStudy.tsx?raw';
import {getMotionComponents,getMotionTimeline} from '../../local-protocol';
const defs=getMotionComponents(imported,286);
const presets=getMotionTimeline(imported);
const sourceDownload=URL.createObjectURL(new Blob([source],{type:'text/plain;charset=utf-8'}));
const Scene=({guides=true}:{guides?:boolean})=><AbsoluteFill style={{background:guides?'radial-gradient(ellipse at 80% 15%,#29302d,transparent 50%),linear-gradient(115deg,#101922,#0d111a 58%,#211a1a)':'transparent'}}>
 {guides&&<><div style={{position:'absolute',left:655,top:120,width:590,height:716,border:'1px dashed #64728050',borderRadius:200,display:'grid',placeItems:'center',color:'#71808D',fontFamily:'Microsoft YaHei',fontSize:26}}>人物预留区 · 预览辅助线</div><div style={{position:'absolute',top:864,width:'100%',height:216,borderTop:'1px dashed #64728050',display:'grid',placeItems:'center',color:'#71808D',fontFamily:'Microsoft YaHei',fontSize:22}}>字幕安全区 · 成品 TSX 不包含辅助线与背景</div></>}
 {presets.map((p,i)=>{const d=defs.find(d=>d.id===p.componentId)!;const C=d.component;return <Sequence key={i} from={p.startFrame??0} durationInFrames={p.durationInFrames}><C {...d.defaultProps} {...p.props}/></Sequence>})}
</AbsoluteFill>;
function App(){const ref=useRef<PlayerRef>(null);const [guides,setGuides]=useState(true);return <main style={{maxWidth:1280,margin:'34px auto',padding:'0 24px',color:'#e6e8e9',fontFamily:'Microsoft YaHei'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}><div><div style={{color:'#DDB86F',letterSpacing:3,fontSize:12}}>SRT → MOTION STUDY / 01</div><h1 style={{fontSize:25,margin:'10px 0'}}>陈总 耳环 · 前 9.53 秒样段</h1></div><a href={sourceDownload} download="陈总 耳环-横屏样段.tsx" style={{color:'#DDB86F'}}>下载 TSX</a></div><Player ref={ref} component={Scene} inputProps={{guides}} compositionWidth={1920} compositionHeight={1080} durationInFrames={286} fps={30} controls loop style={{width:'100%',border:'1px solid #34404A',borderRadius:8}}/><div style={{display:'flex',gap:12,margin:'20px 0'}}>{[[1.8,'低价设问'],[6.6,'标识出现'],[8.7,'材质疑问']].map(([t,label])=><button key={label} onClick={()=>{ref.current?.pause();ref.current?.seekTo(Math.round(Number(t)*30))}} style={{background:'#19242E',color:'#e6e8e9',padding:'10px 18px',border:'1px solid #3B4C59',borderRadius:5}}>{label}</button>)}<label style={{marginLeft:'auto'}}><input type="checkbox" checked={guides} onChange={e=>setGuides(e.target.checked)}/> 显示布局辅助线</label></div><p style={{color:'#94A6B4',fontSize:14}}>已通过工作台协议读取 {defs.length} 个组件 / {presets.length} 条时间线预设。无外部素材、无音轨。来源为口播文字，耳钉为示意图。</p></main>};
createRoot(document.getElementById('root')!).render(<App/>);

