import {spring} from "remotion";
export type GigCardConfig = {
 id:string; visible:boolean; mode:"image"|"card"; imageUrl:string; title:string; desc:string; salary:string;
 left:number; top:number; aspectRatio:number; width:number; scale:number; rotateX:number; rotateY:number; rotate:number; perspective:number; radius:number; shadow:boolean; zIndex:number; phase:number;
};
export const createGigCard = (id:string):GigCardConfig => ({id,visible:true,mode:"image",imageUrl:"",title:"兼职机会",desc:"",salary:"",left:785,top:406,aspectRatio:350/220,width:350,scale:1,rotateX:0,rotateY:0,rotate:0,perspective:1400,radius:18,shadow:true,zIndex:0,phase:0});
export const readGigCards = (props:Record<string,any>):GigCardConfig[] => {
 let input:unknown;
 try {input=JSON.parse(props.cardsJson);} catch {}
 if(Array.isArray(input)) return input.filter(c=>c && typeof c==="object").map((c,i)=>{
 const card={...createGigCard(`card-${i}`),...c};
 for(const key of ["aspectRatio","left","top","width","scale","rotateX","rotateY","rotate","perspective","radius","zIndex","phase"] as const){if(!Number.isFinite(Number(card[key]))) card[key]=createGigCard("")[key]; else card[key]=Number(card[key]);}
 card.aspectRatio=Math.max(0.01,card.aspectRatio);
 card.width=Math.max(20,card.width);card.scale=Math.max(0.05,card.scale);card.perspective=Math.max(100,card.perspective);
 return card;
 });
 const layouts=[[92,456,7,-2,0],[1352,84,-8,2.2,1.7],[1462,352,-6,-1.6,3.1],[1318,566,-7,1.8,4.4]];
 if([1,2,3,4].some(i=>`card${i}Title` in props)) return layouts.map(([left,top,rotateY,rotate,phase],i)=>({...createGigCard(`legacy-${i+1}`),mode:"card" as const,left,top,rotateY,rotate,phase,title:String(props[`card${i+1}Title`]??""),desc:String(props[`card${i+1}Desc`]??""),salary:String(props[`card${i+1}Salary`]??""),imageUrl:String(props[`card${i+1}ImageUrl`]??""),visible:!!String(props[`card${i+1}Title`]??"").trim()}));
 return [createGigCard("card-1")];
};

export const gigCardMotion=(card:GigCardConfig,index:number,frame:number,fps:number,props:Record<string,any>,unit=1)=>{
 const delay=Math.round(fps*(0.18+index*Math.max(0,Number(props.enterStaggerSeconds??0.14))));
 const enter=spring({frame:frame-delay,fps,config:{damping:17,stiffness:130,mass:0.9}});
 const bob=frame>delay?Math.sin(frame/fps*1.4+card.phase)*Number(props.floatAmplitude??9):0;
 const wiggle=frame>delay?Math.sin(frame/fps*1.1+card.phase)*Number(props.wiggleAmplitude??0.5):0;
 return {opacity:enter,transform:`perspective(${card.perspective*unit}px) translateY(${((1-enter)*140+bob)*unit}px) rotateX(${card.rotateX}deg) rotateY(${card.rotateY}deg) rotate(${card.rotate+wiggle}deg) scale(${card.scale*(0.92+enter*0.08)})`};
};
