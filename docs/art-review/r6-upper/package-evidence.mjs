import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out='docs/art-review/r6-upper',input='test-results/r6-upper';
for(const view of ['front45','rear45','chase']){
 const panels=[];
 for(const variant of ['before','after']){
  const panel=`${input}/${variant}-${view}.jpg`;panels.push(panel);
  const args=[`${input}/${variant}/${view}.png`];
  if(view!=='chase')args.push('-crop','800x760+400+120','+repage');
  execFileSync('magick',[...args,'-background','#142434','-gravity','north','-splice','0x48','-fill','white','-font','Arial','-pointsize','24','-annotate','+0+9',`${variant.toUpperCase()} | R6b ${view} | same game lighting`,'-quality','94',panel]);
 }
 execFileSync('magick',[...panels,'+append','-quality','94',`${out}/${view}-comparison.jpg`]);
}
const m=JSON.parse(await readFile(`${input}/after/metrics.json`,'utf8'));
await writeFile(`${input}/concat.txt`,m.segments.map(s=>`file '${resolve(input,'after',`${s.label}.webm`).replaceAll('\\','/')}'`).join('\n'));
execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',`${input}/concat.txt`,'-an','-c:v','libx264','-crf','22','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/wild-gameplay.mp4`]);
const video=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=width,height','-of','json',`${out}/wild-gameplay.mp4`],{encoding:'utf8'}));
await writeFile(`${out}/capture-summary.json`,JSON.stringify({meta:m.meta,video,errors:m.errors,segments:m.segments.map(s=>({label:s.label,first:s.samples[0],last:s.samples.at(-1)}))},null,2)+'\n');
await copyFile('public/assets/characters/coast-blonde-r6b-upper.audit.json',`${out}/asset-audit.json`);
console.log(JSON.stringify({video,errors:m.errors}));
