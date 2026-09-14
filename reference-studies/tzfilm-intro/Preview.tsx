import React, {useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {AbsoluteFill,Img,Sequence,Video,useCurrentFrame} from 'remotion';
import {GigHourlyTitleEffectDef} from '../../effects/GigHourlyTitle';
import {BrollGigCardFloatEffectDef} from '../../effects/BrollGigCardFloat';
import {BrollEpisodePosterDuoEffectDef} from '../../effects/BrollEpisodePosterDuo';
import {BrollPlayMilestoneBadgeEffectDef} from '../../effects/BrollPlayMilestoneBadge';
import {UnifiedMotionAnimation} from '../../effects/UniversalMotionAnimation';
import arrangement from '../../public/reference-studies/tzfilm-intro/arrangement.timeline.json';
const base='/reference-studies/tzfilm-intro/';
const definitions=[GigHourlyTitleEffectDef,BrollGigCardFloatEffectDef,BrollEpisodePosterDuoEffectDef,BrollPlayMilestoneBadgeEffectDef];
const Study=({reference=false,background=true}:{reference?:boolean;background?:boolean})=>{
 const frame=useCurrentFrame();
 if(reference)return <Video src={base+'reference.mp4'} muted style={{width:'100%',height:'100%'}}/>;
 return <AbsoluteFill style={{background:'#11161c'}}>
  {background&&<Img src={base+'backdrop.jpg'} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
  <AbsoluteFill style={{background:`rgba(0,0,0,${frame>=159?0.3:0.12})`}}/>
  {arrangement.motionTimeline.map((item,index)=>{const def=definitions.find(d=>d.id===item.componentId)!;const Component=def.component;const pos=item.position??def.defaultPosition;const props={...def.defaultProps,...item.props};return <Sequence key={index} from={item.startFrame} durationInFrames={item.durationInFrames}><AbsoluteFill style={{transform:`translate(${pos.x}px,${pos.y}px) scale(${pos.scale})`,transformOrigin:'0 0'}}><UnifiedMotionAnimation durationInFrames={item.durationInFrames} exitAnimation="fade"><Component {...props}/></UnifiedMotionAnimation></AbsoluteFill></Sequence>})}
 </AbsoluteFill>;
};
const App=()=>{
 const player=useRef<PlayerRef>(null);const [reference,setReference]=useState(false);const [background,setBackground]=useState(true);
 const seek=(seconds:number)=>{player.current?.pause();player.current?.seekTo(Math.round(seconds*30));};
 return <main><header><span>REFERENCE STUDY · 01</span><h1>时薪钩子 → 往期回顾</h1><p>12 秒 · 4 个独立效果 · 可替换素材与文案</p></header>
 <nav><button aria-pressed={!reference} onClick={()=>setReference(false)}>工作台样段</button><button aria-pressed={reference} onClick={()=>setReference(true)}>原片对照</button><label><input type="checkbox" checked={background} onChange={e=>setBackground(e.target.checked)}/>显示口播定帧</label><a href={base+'arrangement.timeline.json'} download>下载可编辑编排</a></nav>
 <Player ref={player} component={Study} inputProps={{reference,background}} compositionWidth={1920} compositionHeight={1080} durationInFrames={360} fps={30} controls loop style={{width:'100%',borderRadius:12,overflow:'hidden'}}/>
 <section>{[[0,'开始'],[2,'招聘卡片'],[5.5,'海报接棒'],[7.8,'成绩徽章'],[10,'完整构图']].map(([time,label])=><button key={time} onClick={()=>seek(Number(time))}>{time}s · {label}</button>)}</section>
 <p className="note">样段用原片首帧作构图底图，动画由现有效果组件实时生成。截图已做透视校正；文字和数字沿用参考，仅用于风格练习。当前无音轨。海报段按参考主动覆盖人物，底部保留字幕空间。</p>
 <footer>当前项目时间线未被替换。工作台可从「导入编排JSON」载入预览，再选择是否插入。</footer></main>;
};
createRoot(document.getElementById('root')!).render(<App/>);
