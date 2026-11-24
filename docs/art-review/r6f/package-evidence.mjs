import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out='docs/art-review/r6f',input='test-results/r6f';
for(const view of ['front45','rear45','side','back','chase','80','120','300','left','right']){
 const panels=[];
 for(const variant of ['before','after']){
  const panel=`${input}/${variant}-${view}.jpg`;panels.push(panel);
  const still=['front45','rear45','side','back','chase'].includes(view),args=[`${input}/${variant}/${view}.${still?'png':'jpg'}`];
  if(still&&view!=='chase')args.push('-crop','800x760+400+120','+repage');
  execFileSync('magick',[...args,'-background','#142434','-gravity','north','-splice','0x48','-fill','white','-font','Arial','-pointsize','24','-annotate','+0+9',`${variant==='before'?'BEFORE R6d':'AFTER R6f'} | ${view} | same game lighting`,'-quality','94',panel]);
 }
 execFileSync('magick',[...panels,'+append','-quality','94',`${out}/${view}-comparison.jpg`]);
}
const m=JSON.parse(await readFile(`${input}/after/metrics.json`,'utf8'));
await writeFile(`${input}/concat.txt`,m.segments.map(s=>`file '${resolve(input,'after',`${s.label}.webm`).replaceAll('\\','/')}'`).join('\n'));
execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',`${input}/concat.txt`,'-an','-c:v','libx264','-crf','22','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/wild-gameplay.mp4`]);
const video=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=width,height','-of','json',`${out}/wild-gameplay.mp4`],{encoding:'utf8'}));
await writeFile(`${out}/capture-summary.json`,JSON.stringify({meta:m.meta,video,errors:m.errors,segments:m.segments.map(s=>({label:s.label,first:s.samples[0],last:s.samples.at(-1)}))},null,2)+'\n');
const before=JSON.parse(await readFile(`${input}/before/static.json`,'utf8')),after=JSON.parse(await readFile(`${input}/after/static.json`,'utf8'));
await writeFile(`${out}/render-costs.json`,JSON.stringify({before,after},null,2)+'\n');
console.log(JSON.stringify({video,errors:m.errors}));
