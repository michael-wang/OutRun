// Run once to create editable Blender assets from the actual road data.
import {spawnSync} from 'node:child_process';
import {existsSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
const run=(label,cmd,args)=>{
 console.log('\n['+label+'] '+cmd+' '+args.join(' ')+'\n');
 const result=spawnSync(cmd,args,{stdio:'inherit',shell:false,env:process.env});
 if(result.error){
  if(result.error.code==='ENOENT')throw Error(label+': executable not found: '+cmd+'. Install Blender or set BLENDER_BIN to its executable path.');
  throw result.error;
 }
 if(result.status!==0)throw Error(label+': exited with '+result.status);
};
const relative='art-prototype/output';
if(existsSync(resolve(relative,'Grand_Canyon_Art_Prototype.blend'))&&!process.argv.includes('--overwrite')){
 throw Error('An editable Blender scene already exists. Render it with render_scene.py. To deliberately replace it with the starter blockout, archive your edits first and use npm run art:blockout -- --overwrite.');
}
run('exact road',process.execPath,['scripts/art-proto/export-road.mjs',
 '--output',resolve(relative,'road-reference.json')]);
run('Blender artwork',process.env.BLENDER_BIN||'blender',[
 '--background','--factory-startup','--python-exit-code','1',
 '--python','scripts/art-proto/build_scene.py','--',
 '--input',resolve(relative,'road-reference.json'),
 '--outdir',resolve(relative)]);
for(const file of ['Grand_Canyon_Art_Prototype.blend','canyon_art_only.glb',
 '01_Approach.png','02_Reveal.png','03_Exit.png']){
 const output=resolve(relative,file);
 const stat=statSync(output);
 if(!stat.isFile()||stat.size===0)throw Error('Missing or empty blockout output: '+output);
 console.log('Verified '+file+' ('+stat.size+' bytes)');
}
console.log('\nOpen art-prototype/output/Grand_Canyon_Art_Prototype.blend');
console.log('Review 01_Approach.png, 02_Reveal.png and 03_Exit.png before game integration.');
