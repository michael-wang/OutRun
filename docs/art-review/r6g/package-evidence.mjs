import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out='docs/art-review/r6g',input='test-results/r6g';
for(const view of ['front45','rear45','side','back','chase','80','120','300','left','right']){
 const still=['front45','rear45','side','back','chase'].includes(view),panels=[];
 for(const variant of still?['before','extreme','after']:['before','after']){
  const panel=`${input}/${variant}-${view}.jpg`;panels.push(panel);
  const args=[`${input}/${variant}/${view}.${still?'png':'jpg'}`];
  if(still&&view!=='chase')args.push('-crop','800x760+400+120','+repage');
  const label={before:'R6d',extreme:'R6f',after:'R6g'}[variant];
  execFileSync('magick',[...args,'-background','#142434','-gravity','north','-splice','0x48','-fill','white','-font','Arial','-pointsize','24','-annotate','+0+9',`${label} | ${view} | same game lighting`,'-quality','94',panel]);
 }
 execFileSync('magick',[...panels,'+append','-quality','94',`${out}/${view}-comparison.jpg`]);
}
const m=JSON.parse(await readFile(`${input}/after/metrics.json`,'utf8'));
await writeFile(`${input}/concat.txt`,m.segments.map(s=>`file '${resolve(input,'after',`${s.label}.webm`).replaceAll('\\','/')}'`).join('\n'));
execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',`${input}/concat.txt`,'-an','-c:v','libx264','-crf','22','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/wild-gameplay.mp4`]);
const video=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=width,height','-of','json',`${out}/wild-gameplay.mp4`],{encoding:'utf8'}));
const degrees=r=>r*180/Math.PI;
const segments=m.segments.map(s=>{
 const peaks=Array(54).fill(0);s.samples.forEach(x=>x.spring.angles.forEach((v,i)=>peaks[i]=Math.max(peaks[i],v)));
 const layer=(from,to)=>Array.from({length:3},(_,d)=>degrees(peaks.filter((_,i)=>i>=from&&i<to&&i%3===d).reduce((a,b)=>a+b,0)/((to-from)/3)));
 return {label:s.label,first:s.samples[0],last:s.samples.at(-1),meanPeakDegrees:{primary:layer(0,24),feathers:layer(24,54)}};
});
await writeFile(`${out}/capture-summary.json`,JSON.stringify({meta:m.meta,video,errors:m.errors,segments},null,2)+'\n');
const costs={};for(const v of ['before','extreme','after'])costs[v]=JSON.parse(await readFile(`${input}/${v}/static.json`,'utf8'));
await writeFile(`${out}/render-costs.json`,JSON.stringify(costs,null,2)+'\n');
console.log(JSON.stringify({video,errors:m.errors,layers:segments.map(s=>({label:s.label,...s.meanPeakDegrees}))}));
