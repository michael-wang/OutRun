import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {effectivePace} from '../src/pace.ts';
const root='docs/evidence/v0.3.2',summary=[],ffmpeg=process.argv[2];
for(const pace of [1,1.5,1.75,2])for(const label of ['low','mid','high','launch']){
 const dir=`${root}/pace-${pace}`,data=JSON.parse(readFileSync(`${dir}/${label}.json`,'utf8'));
 const average=key=>data.audit.reduce((sum,r)=>sum+r[key],0)/data.audit.length;
 const target=label==='low'?80/3.6:label==='mid'?150/3.6:65;
 const passes=data.audit.flatMap(r=>r.markerPassWallMs);
 summary.push({pace,label,nominalExpectedMps:label==='launch'?null:target*effectivePace(target,pace),worldMps:average('worldMetersPerSecond'),trackMps:average('trackMetersPerSecond'),widthsPerSecond:average('roadWidthsPerSecond'),cameraMps:average('cameraMetersPerSecond'),postsPerSecond:(passes.length-1)/((passes.at(-1)-passes[0])/1000),dashesPerSecond:average('trackMetersPerSecond')/6,fps:average('fps'),p95FrameMs:Math.max(...data.audit.map(r=>r.p95FrameMs)),offRoadSamples:data.trace.filter(s=>s.offRoad).length,finalOffRoad:data.trace.at(-1).offRoad,brakeSamples:data.trace.filter(s=>s.controls.brake).length,maxLateral:Math.max(...data.trace.map(s=>Math.abs(s.lateral))),fovs:[...new Set(data.trace.map(s=>s.camera.fov))],errors:data.errors});
 if(ffmpeg){mkdirSync(`${dir}/frames`,{recursive:true});for(const t of label==='launch'?[3,10,17,20,23]:[1.5,1.7,2,3.8])execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(t),'-i',`${dir}/${label}.webm`,'-frames:v','1',`${dir}/frames/${label}-${t}.png`]);}
}
writeFileSync(`${root}/pace-summary.json`,JSON.stringify(summary,null,2));
const video=(pace,label)=>`<article><h3>${pace}× ${label}</h3><video controls loop muted poster="pace-${pace}/${label}.png" src="pace-${pace}/${label}.webm"></video></article>`;
writeFileSync(`${root}/review.html`,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Arcade Pace A/B</title><style>body{font:16px system-ui;background:#12313a;color:#fff4dd;margin:20px}section{display:flex;flex-wrap:wrap;gap:10px}article{width:calc(50% - 5px)}video{width:100%}button,a{padding:10px;color:#ffce86}button{background:#34515a}p{line-height:1.5}</style><h1>Arcade Pace / human GO or NO-GO</h1><p>Identical camera, scene and starting pose. These are actual browser recordings with real world travel amplification. Displayed km/h is an arcade gauge. Video has no audio; PC FPS is not Pixel FPS.</p><button onclick="document.querySelectorAll('video').forEach(v=>{v.currentTime=0;v.play()})">Restart & play comparisons</button><h2>High speed: all four world paces</h2><section>${[1,1.5,1.75,2].map(p=>video(p,'high')).join('')}</section>${[1,1.5,1.75,2].map(p=>`<h2>${p}× low / mid / launch</h2><section>${['low','mid','launch'].map(label=>video(p,label)).join('')}</section>`).join('')}<p>Phone calibration: ${[1,1.5,1.75,2].map(p=>`<a href="/?pace=${p}&velocity">${p}×</a>`).join('')} . Which looks fast and remains enjoyable to steer?</p>`);
console.log(JSON.stringify(summary,null,2));
