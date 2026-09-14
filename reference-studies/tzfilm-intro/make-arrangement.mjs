import {writeFileSync} from 'node:fs';
const base='/reference-studies/tzfilm-intro/';
// Positions measured from the supplied reference, then shifted off the face and subtitle band.
const cards=[
 [3,80,540,390,6,-3], [5,530,650,290,-5,-3],
 [1,1230,55,400,-7,3], [2,1290,325,390,-5,-3], [4,1210,590,400,-6,2],
].map(([asset,left,top,width,rotateY,rotate],i)=>({id:`reference-${asset}`,visible:true,mode:'image',mediaType:'image',imageUrl:base+`card-${asset}.jpg`,left,top,width,aspectRatio:600/360,scale:1,rotateX:0,rotateY,rotate,perspective:1500,radius:14,shadow:true,zIndex:i,phase:i*1.4}));
const item=(componentId,startFrame,durationInFrames,props,laneId,position)=>({componentId,startFrame,durationInFrames,laneId,props,position,sourceExpressionId:laneId,sourceIntentId:laneId});
const doc={generatedBy:'overlay-fx-generator/1',sourceVideo:'柱子哥TzFilm-国内的数据标注时薪有300-3000？A-20260908120556.mp4',canvas:{width:1920,height:1080,orientation:'landscape'},fps:30,durationInFrames:360,
 notes:'12秒参考练习；截图来自用户提供视频，数字仅复用参考文案，非经核实的收入或播放量承诺。无SRT输入，不生成字幕轨。',
 motionTimeline:[
 item('GigHourlyTitle',0,165,{priceFrom:300,priceTo:3000,priceFontSize:112,priceUnitFontSize:32,eyebrowEnFontSize:25,eyebrowZhFontSize:22,priceNoteFontSize:23,unitPlacement:'below',exitAnimation:'fade'},'hourly-hook',{x:48,y:128,scale:1}),
 item('BrollGigCardFloat',9,156,{cardsJson:JSON.stringify(cards),enterStaggerSeconds:0.19,floatAmplitude:5,wiggleAmplitude:0.3,wiggleAmplitudeY:0.25,exitAnimation:'fade'},'recruitment-evidence'),
 item('BrollEpisodePosterDuo',159,201,{poster1Url:base+'poster-1.jpg',poster2Url:base+'poster-2.jpg',posterWidth:550,posterTop:45,posterGap:55,tiltDeg:8,floatAmplitude:4,firstEnterSeconds:0.05,enterStaggerSeconds:0.25,exitAnimation:'fade'},'episode-recap'),
 item('BrollPlayMilestoneBadge',234,126,{badgeTop:710,badgeWidth:490,rotationDegrees:-2,badgeEnterSeconds:0.45,badgeKicker:'2 EPISODES · 两期视频',badgePrefix:'播放破',badgeNumber:'500万',floatAmplitude:3,exitAnimation:'fade'},'episode-recap')
 ]};
writeFileSync(new URL('../../public/reference-studies/tzfilm-intro/arrangement.timeline.json',import.meta.url),JSON.stringify(doc,null,2)+'\n');
