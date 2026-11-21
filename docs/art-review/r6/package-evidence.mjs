import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='test-results/r6',out='docs/art-review/r6';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const capture=read(`${base}/pixel-new/capture.json`);
const filters=capture.segments.map((s,i)=>`[0:v]trim=start=${(s.videoStartSeconds+.05).toFixed(3)}:end=${(s.videoEndSeconds-.07).toFixed(3)},setpts=PTS-STARTPTS[v${i}]`);
filters.push(capture.segments.map((_,i)=>`[v${i}]`).join('')+`concat=n=${capture.segments.length}:v=1:a=0[out]`);
execFileSync('ffmpeg',['-y','-i',`${base}/pixel-new/capture.mp4`,'-filter_complex',filters.join(';'),'-map','[out]','-an','-r','30','-c:v','libx264','-preset','fast','-crf','24','-movflags','+faststart',`${out}/01-pixel8-r6.mp4`,'-loglevel','error'],{windowsHide:true});
execFileSync('magick',[`${base}/pc-previous/smoke.png`,`${base}/pc-new/smoke.png`,'-append','-quality','92',`${out}/02-before-after.jpg`],{windowsHide:true});
fs.copyFileSync(`${base}/pixel-new/native-screen.png`,`${out}/03-pixel8-native.png`);
for(const [i,view] of [[4,'front'],[5,'side']])execFileSync('magick',[`${base}/pc-new/seat-${view}.png`,'-quality','92',`${out}/0${i}-seat-${view}.jpg`],{windowsHide:true});
const perf={};
for(const variant of ['previous','new']){
 const data=read(`${base}/pixel-${variant}/perf.json`),segment=data.segments[0];let elapsed=0;
 const frames=segment.frames.filter(t=>(elapsed+=t)>2000),sorted=frames.toSorted((a,b)=>a-b);
 perf[variant]={meta:data.meta,movingFps:frames.length*1000/frames.reduce((a,b)=>a+b,0),frameP95Ms:sorted[Math.ceil(frames.length*.95)-1],
  motionCpu:read(`${base}/pixel-${variant}/motion-cpu.json`),gpuTimerSupported:segment.report.gpuTimerSupported};
 fs.copyFileSync(`${base}/pixel-${variant}/perf.json`,`${out}/pixel-${variant==='new'?'r6':'previous'}-perf.json`);
}
const result={version:'0.10.20',status:'playable integration; art and mobile performance NOT accepted',
 sourceCommit:'fb52490',pixelHardware:[2400,1080],perf,
 scenes:capture.segments.map(s=>({label:s.label,actualSpeedRange:s.samples.map(x=>x.speed).reduce((a,n)=>[Math.min(a[0],n),Math.max(a[1],n)],[Infinity,-Infinity]),maxJointAngleDegrees:Math.max(...s.samples.flatMap(x=>x.occupants.people[1].spring.angles))*180/Math.PI,sourceVideoRange:[s.videoStartSeconds+.05,s.videoEndSeconds-.07]})),
 asset:read('public/assets/characters/coast-blonde-r6.audit.json'),lifecycle:read(`${base}/pc-new/lifecycle.json`),tests:{files:113,passed:498},errors:capture.errors};
fs.writeFileSync(`${out}/measurements.json`,JSON.stringify(result,null,2));
fs.copyFileSync(`${base}/verify-dev.log`,`${out}/verify-dev.txt`);
console.log(JSON.stringify(perf,null,2));
