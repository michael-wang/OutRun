// Run after capture.mjs for each preset. Preserve full native-size game frames.
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const output='docs/art-review/r6-wind',summaries=[];
const round=n=>Math.round(n*100)/100;
for(const preset of ['baseline','dramatic','wild']){
 const input=`test-results/r6-wind/${preset}`,m=JSON.parse(await readFile(`${input}/metrics.json`,'utf8'));
 const list=`${input}/concat.txt`;
 await writeFile(list,m.segments.map(s=>`file '${resolve(input,`${s.label}.webm`).replaceAll('\\','/')}'`).join('\n'));
 execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',list,'-an','-c:v','libx264','-crf','22','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',`${output}/${preset}.mp4`]);
 const video=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=width,height','-of','json',`${output}/${preset}.mp4`],{encoding:'utf8'}));
 summaries.push({preset,...m.meta,errors:m.errors,video,segments:m.segments.map(s=>{
  const steady=s.samples.filter(v=>v.t>.5);
  return {label:s.label,firstHud:round(s.samples[0].distance),lastHud:round(s.samples.at(-1).distance),speedRange:s.samples.reduce((r,v)=>[Math.min(r[0],v.speed),Math.max(r[1],v.speed)],[Infinity,0]).map(round),peakRestDisplacementPixels:round(Math.max(...s.samples.map(v=>v.pixels))),finalRestDisplacementPixels:round(s.samples.at(-1).pixels),peakJointDegrees:round(Math.max(...s.samples.flatMap(v=>v.spring.angles))*180/Math.PI),tipAngleRangesDegrees:Array.from({length:6},(_,i)=>round((Math.max(...steady.map(v=>v.spring.angles[i*3+2]))-Math.min(...steady.map(v=>v.spring.angles[i*3+2])))*180/Math.PI))};
 })});
}
await writeFile(`${output}/measurements.json`,JSON.stringify(summaries,null,2)+'\n');
for(const name of ['wild-detail','wild-turn-detail','dramatic-detail'])await copyFile(`test-results/r6-wind/${name}.jpg`,`${output}/${name}.jpg`);
console.log(JSON.stringify(summaries.map(s=>({preset:s.preset,duration:s.video.format.duration,bytes:s.video.format.size,segments:s.segments.map(v=>({label:v.label,speeds:v.speedRange,tipRanges:v.tipAngleRangesDegrees}))})),null,2));
