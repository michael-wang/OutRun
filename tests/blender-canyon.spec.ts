import {test,expect} from '@playwright/test';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';

const root='art-prototype/output/integration';
const available=existsSync('art-prototype/output/canyon_art_only.glb');

test('missing local art fails explicitly instead of showing a false Blender success',async({page})=>{
 await page.route('**/__local_art/canyon_art_only.glb',route=>route.fulfill({status:404,body:'missing local asset'}));
 await page.goto('/?showcase=canyon&art=blender&qa=1');
 await expect(page.locator('#blender-art-status')).toContainText('載入失敗');
 expect(await page.evaluate(()=>(window as any).__drive)).toBeUndefined();
});

test('art parameter does not opt the 69km route into Blender',async({page})=>{
 let requested=false;page.on('request',r=>{if(r.url().includes('/__local_art/'))requested=true;});
 await page.goto('/?seed=1&art=blender&qa=1');
 await page.waitForFunction(()=>(window as any).__drive?.streaming()?.ready);
 expect(await page.evaluate(()=>(window as any).__drive.blenderArt().status)).toBe('disabled');
 expect(await page.evaluate(()=>(window as any).__drive.brick().length)).toBe(69000);
 expect(requested).toBe(false);
});

test('built local preview serves the ignored asset and starts driving',async({page})=>{
 test.skip(!available,'Local GLB not installed');
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.request.get('http://127.0.0.1:4173/__local_art/canyon_art_only.glb');
 expect(response.status()).toBe(200);expect(response.headers()['content-type']).toBe('model/gltf-binary');
 await page.goto('http://127.0.0.1:4173/?showcase=canyon&art=blender');
 await page.locator('#player-play').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
 await page.keyboard.down('Space');await page.waitForTimeout(1500);await page.keyboard.up('Space');
 expect(errors).toEqual([]);expect(await page.evaluate(()=>(window as any).__drive)).toBeUndefined();
});

for(const mobile of [false,true])for(const blender of [false,true]){
 const label=(mobile?'mobile-emulation':'desktop')+'-'+(blender?'blender':'original');
 test(`continuous normal-chase drive: ${label}`,async({browser})=>{
  test.skip(!available,'Local-only GLB is intentionally absent from Git/CI');test.setTimeout(180000);
  mkdirSync(root,{recursive:true});
  const context=await browser.newContext({viewport:mobile?{width:960,height:432}:{width:1920,height:1080},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?showcase=canyon'+(blender?'&art=blender':'')+'&qa=1&perf=1&streamdiag=1');
  await page.waitForFunction(()=>(window as any).__drive?.streaming()?.fullyReady,null,{timeout:60000});
  const startup=await page.evaluate(()=>{
   const g=(window as any).__drive,gl=document.querySelector('canvas')!.getContext('webgl2')!,ext=gl.getExtension('WEBGL_debug_renderer_info');
   return {readyMs:performance.now(),art:g.blenderArt(),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,
    asset:performance.getEntriesByType('resource').filter(e=>e.name.includes('/__local_art/')).map(e=>e.toJSON())};
  });
  await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:1000,speed:40,lateral:3.5});});
  await page.waitForTimeout(1200);
  await page.evaluate(record=>{
   const w=window as any,g=w.__drive;
   w.artAudit={frames:0,missing:0,unsafe:0,maxLateral:0,deltas:[],last:0};
   if(record){w.artVideo=[];w.artRecorder=new MediaRecorder(document.querySelector('canvas')!.captureStream(30),{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:4500000});w.artRecorder.ondataavailable=(e:BlobEvent)=>w.artVideo.push(e.data);w.artRecorder.start(1000);}
   g.manual(false);
   const drive=(now:number)=>{
    const s=g.snapshot(),frame=g.streamFrame(),a=w.artAudit;a.frames++;
    if(a.last)a.deltas.push(now-a.last);a.last=now;
    if(!frame.road||!frame.cameraRoad)a.missing++;if(!frame.safe)a.unsafe++;
    a.maxLateral=Math.max(a.maxLateral,Math.abs(s.lateral));
    g.controls({gas:s.speed<43,brake:s.speed>46,steer:Math.max(-1,Math.min(1,s.requiredSteer+(3.5-s.lateral)*.22-s.lateralRate*.07))});
    w.artDrive=requestAnimationFrame(drive);
   };w.artDrive=requestAnimationFrame(drive);
  },!mobile);
  const rows:any[]=[],shots:any[]=[];const targets=[['00_Before',1200],['01_Approach',1365],['02_Reveal',1470],['03_Exit',1585],['04_AfterHero',2050],['05_Departure',2350]] as const;
  let next=0;
  for(let i=0;i<700;i++){
   await page.waitForTimeout(100);
   const row=await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),perf:g.perf(),stream:g.streamFrame(),safety:g.streamSafety(),wheels:g.wheelContacts(),render:g.scenery().render};});rows.push(row);
   if(next<targets.length&&row.state.distance>=targets[next][1]){
    const name=targets[next++][0];await page.screenshot({path:`${root}/${label}-${name}.png`});shots.push({name,distance:row.state.distance,camera:row.state.camera});
   }
   if(row.state.distance>=2450)break;
  }
  const result=await page.evaluate(async()=>{
   const w=window as any,g=w.__drive;cancelAnimationFrame(w.artDrive);g.controls({gas:false,brake:false,steer:0});g.manual(true);
   let video:number[]|undefined;
   if(w.artRecorder){await new Promise<void>(resolve=>{w.artRecorder.onstop=()=>resolve();w.artRecorder.stop();});video=Array.from(new Uint8Array(await new Blob(w.artVideo).arrayBuffer()));}
   const probes=[];
   for(let d=1000;d<=2450;d+=10)for(const x of [-6.5,0,6.5]){const hits=g.artProbe(d,x).filter((h:any)=>h.gap>=-.01);if(hits.length)probes.push({d,x,hits});}
   return {audit:w.artAudit,final:g.snapshot(),stream:g.streaming(),diagnostics:w.__streamDiagnostics.snapshot(),probes,video};
  });
  if(result.video)writeFileSync(`${root}/${label}-drive.webm`,Buffer.from(result.video));
  const quantile=(a:number[],p:number)=>a.sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))];
  const heroOverlaps=result.probes.filter((p:any)=>p.d>=1340&&p.d<=1940);
  const fps=rows.slice(10).map(r=>r.perf.fps),summary={label,emulation:mobile,physicalPixel8:false,recorded:!mobile,readyMs:startup.readyMs,loadMs:startup.art.loadMs??null,gpu:startup.gpu,fpsMedian:quantile([...fps],.5),fpsP05:quantile([...fps],.05),fpsMin:Math.min(...fps),frameMsP95:quantile([...result.audit.deltas],.95),distance:result.final.distance,missing:result.audit.missing,unsafe:result.audit.unsafe,stalls:result.diagnostics.stalls,heroArtOverlaps:heroOverlaps.length,allArtOverlaps:result.probes.length,errors};
  const {video:omitted,...audit}=result;writeFileSync(`${root}/${label}.json`,JSON.stringify({summary,startup,shots,rows,...audit},null,2));console.log(JSON.stringify(summary));
  expect(result.final.distance).toBeGreaterThanOrEqual(2450);expect(next).toBe(targets.length);
  expect(errors).toEqual([]);expect(result.audit.missing).toBe(0);expect(result.audit.unsafe).toBe(0);expect(result.stream.fatal).toBe('');
  // Outside the authored segment, retain/report existing GLB intersections.
  // Passing drivability does not imply the exit art is visually accepted.
  expect(result.audit.maxLateral).toBeLessThan(6.5);expect(heroOverlaps).toEqual([]);
  if(blender){expect(startup.art.position).toEqual([0,0,0]);expect(startup.art.scale).toEqual([1,1,1]);expect(startup.art.quaternion).toEqual([0,0,0,1]);}
  await context.close();
 });
}
