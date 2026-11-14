// Actual Vite game, unchanged chase camera/DPR. Pixel connects through USB CDP.
// node docs/art-review/r6/capture.mjs pixel|pc new|previous [smoke|capture|perf]
import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {execFileSync,spawn} from 'node:child_process';
const [device='pc',variant='new',task='capture']=process.argv.slice(2);
const pixel=device==='pixel',adb='C:/astra-dev/tools/android/platform-tools/adb.exe';
const out=`test-results/r6/${device}-${variant}`;await mkdir(out,{recursive:true});
const browser=pixel?await chromium.connectOverCDP('http://127.0.0.1:9222'):await chromium.launch({channel:'chrome',args:['--ignore-gpu-blocklist']});
const page=pixel?browser.contexts()[0].pages().find(p=>p.url().startsWith('http://localhost:5194/')):await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 localStorage.removeItem('outrun-coast-race-checkpoint-v1'); // this test origin's own previous capture
 const ev=window.__THREE_DEVTOOLS__=new EventTarget();
 ev.addEventListener('observe',e=>{if(e.detail.isScene)e.detail.addEventListener('childadded',c=>{
  if(c.child.name==='breakdown-warning-objects')e.detail.onBeforeRender=(r,s,cam)=>{
   if(cam.isPerspectiveCamera){window.artScene=s;window.artRenderer=r;window.artCamera=cam;}
  };
 });});
});
let recorder,videoStart=0;
try{
 await page.goto(`http://${pixel?'localhost':'127.0.0.1'}:5194/?at=350&trafficSeed=42&fpsdiag=1&r5qa=1${variant==='previous'?'&r6=previous':''}`);
 await page.locator('#boot-enter:visible, #start-race:visible').first().waitFor({state:'visible'});
 if(await page.locator('#boot-enter').isVisible())await page.locator('#boot-enter').click();
 if(pixel)await page.locator('#start-race').evaluate(e=>e.click());else await page.locator('#start-race').click();
 await page.waitForFunction(()=>window.__drive?.driveState().mode==='ready'&&document.querySelector('#game-loading').hidden,null,{timeout:120000});
 await page.locator('#race-start').click();await page.waitForFunction(()=>window.__drive.driveState().mode==='playing');
 if(pixel)await page.evaluate(()=>document.documentElement.requestFullscreen().catch(()=>{}));
 await page.evaluate(()=>{const q=window.__drive;q.manual(true);q.reset({distance:7590,speed:120/3.6,lateral:0});});
 await page.waitForFunction(()=>window.__drive.streamFrame().safe);await page.waitForTimeout(1500);
 const meta=await page.evaluate(()=>{
  const car=window.artScene.getObjectByName('coastal-roadster'),r=window.artRenderer,V=car.position.constructor;
  let triangles=0,draws=0;car.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1);draws++;}});
  return {viewport:[innerWidth,innerHeight],devicePixelRatio,rendererDpr:r.getPixelRatio(),drawingBuffer:r.getDrawingBufferSize(new V()).toArray().slice(0,2),
   scale:['driver','passenger'].map(n=>car.getObjectByName(n).scale.toArray()),triangles,draws,
   hair:car.getObjectByName('blender-blonde-spring')?.name??'morph',camera:window.artCamera.position.toArray(),userAgent:navigator.userAgent};
 });
 console.log(JSON.stringify(meta));
 if(task==='smoke'||task==='review'){
  await page.screenshot({path:out+'/smoke.png'});await writeFile(out+'/smoke.json',JSON.stringify({meta,errors},null,2));
  if(task==='review'){
   for(const view of ['front','side','cockpit']){
    await page.evaluate(view=>window.__drive.carView(view),view);await page.waitForTimeout(100);
    await page.screenshot({path:out+`/seat-${view}.png`});
   }
   await page.evaluate(()=>{window.__drive.reset({distance:3210,speed:120/3.6,lateral:0});window.__drive.manual(false);});
   await page.waitForTimeout(700);await page.keyboard.press('p');
   const before=await page.evaluate(()=>window.__drive.occupants());await page.waitForTimeout(300);
   const after=await page.evaluate(()=>window.__drive.occupants());
   if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Occupants moved while paused');
   await page.locator('#tp-restart').click();
   // Pause-menu restart already confirms the race and resumes after loading.
   await page.waitForFunction(()=>window.__drive.driveState().mode==='playing',null,{timeout:60000});
   await page.evaluate(()=>{window.__drive.manual(true);window.disposals={geometry:0,material:0,skeleton:0};const mesh=window.artScene.getObjectByName('blender-blonde-spring');
    mesh.geometry.addEventListener('dispose',()=>window.disposals.geometry++);mesh.material.addEventListener('dispose',()=>window.disposals.material++);
    const old=mesh.skeleton.dispose.bind(mesh.skeleton);mesh.skeleton.dispose=()=>{window.disposals.skeleton++;old();};
   });
   await page.keyboard.press('p');await page.locator('#tp-exit').click();await page.locator('#start-race').waitFor({state:'visible'});
   const disposed=await page.evaluate(()=>window.disposals);
   await page.locator('#start-race').click();await page.waitForFunction(()=>window.__drive?.driveState().mode==='ready'&&document.querySelector('#game-loading').hidden,null,{timeout:120000});
   await writeFile(out+'/lifecycle.json',JSON.stringify({pauseFrozen:true,restartReady:true,disposed,reentry:await page.evaluate(()=>!!window.artScene.getObjectByName('blender-blonde-spring')),errors},null,2));
  }
 }else{
  const configurations=task==='perf'?[['perf120',7590,120,12]]:
   [['idle',14000,0,1],['60',14000,60,1.5],['80',14000,80,1.5],['120',14000,120,1.5],['220',13910,220,1.5],['300',13910,300,1.5],['left',3305,280,2],['right',4000,280,2],['braking',null,0,4]];
  if(task==='capture')await page.addStyleTag({content:'#ready-countdown{display:none!important}'}); // suppress repeated QA-teleport GO banner only
  if(task==='capture'&&pixel){videoStart=Date.now();recorder=spawn(adb,['shell','echo $$ > /sdcard/outrun-r6-record.pid; exec screenrecord --bit-rate 12000000 --time-limit 90 /sdcard/outrun-r6-review.mp4'],{windowsHide:true,stdio:'ignore'});}
  if(task==='capture'&&!pixel)await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;
   const rec=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:5000000}),chunks=[];
   rec.ondataavailable=e=>chunks.push(e.data);rec.start();window.reviewVideo={rec,chunks,canvas,ctx:canvas.getContext('2d')};
  });
  const segments=[];
  for(const [label,distance,target,seconds] of configurations){
   if(distance!==null){await page.evaluate(({distance,target})=>{const q=window.__drive;q.manual(true);q.reset({distance,speed:target/3.6,lateral:0});},{distance,target});await page.waitForFunction(()=>window.__drive.streamFrame().safe);}
   const segmentStart=Date.now();
   const result=await page.evaluate(async({target,seconds,label})=>{
    const q=window.__drive,r=window.artRenderer,car=window.artScene.getObjectByName('coastal-roadster'),frames=[],samples=[];
    let labelNode=document.getElementById('r6-review-label');if(!labelNode){labelNode=document.createElement('div');labelNode.id='r6-review-label';labelNode.style.cssText='position:fixed;bottom:4px;left:35%;z-index:99999;background:#162331cc;color:white;font:14px sans-serif;padding:4px;pointer-events:none';document.body.append(labelNode);}
    labelNode.textContent=`R6 ${label} | trafficSeed=42 | actual game`;
    const start=performance.now();let last=start,count=0;q.manual(false);
    await new Promise(resolve=>{
     const frame=now=>{const s=q.driveState();q.controls({gas:target>0&&s.speed*3.6<target,brake:target===0||s.speed*3.6>target+2,steer:Math.max(-1,Math.min(1,q.steering().requiredSteer-.085*s.lateral-.06*s.lateralRate))});
      frames.push(now-last);last=now;
      if(count++%6===0)samples.push({speed:s.speed*3.6,distance:s.distance,occupants:q.occupants()});
      if(window.reviewVideo)window.reviewVideo.ctx.drawImage(r.domElement,0,0,1600,900);
      if(now-start<seconds*1000)requestAnimationFrame(frame);else resolve();
     };requestAnimationFrame(frame);
    });q.manual(true);q.controls(undefined);
    return {label,frames,samples,report:window.__driveFpsDiagnostics.report()};
   },{target,seconds,label});
   result.videoStartSeconds=(segmentStart-videoStart)/1000;result.videoEndSeconds=(Date.now()-videoStart)/1000;
   segments.push(result);console.log(label,result.samples.at(-1)?.speed);
   if(task==='capture')await page.screenshot({path:out+'/'+label+'.png'});
  }
  if(task==='capture'&&pixel){
   const pid=execFileSync(adb,['shell','cat','/sdcard/outrun-r6-record.pid'],{windowsHide:true,encoding:'utf8'}).trim();
   if(/^\d+$/.test(pid)&&recorder.exitCode===null){execFileSync(adb,['shell','kill','-2',pid],{windowsHide:true});await new Promise(r=>recorder.once('exit',r));}
   execFileSync(adb,['pull','/sdcard/outrun-r6-review.mp4',out+'/capture.mp4'],{windowsHide:true,stdio:'ignore'});
   execFileSync(adb,['shell','screencap','-p','/sdcard/outrun-r6-review.png'],{windowsHide:true});
   execFileSync(adb,['pull','/sdcard/outrun-r6-review.png',out+'/native-screen.png'],{windowsHide:true,stdio:'ignore'});
  }else if(task==='capture'){
   const b64=await page.evaluate(async()=>{const a=window.reviewVideo;await new Promise(r=>{a.rec.onstop=r;a.rec.stop();});return await new Promise(resolve=>{const f=new FileReader();f.onload=()=>resolve(f.result.split(',')[1]);f.readAsDataURL(new Blob(a.chunks));});});
   await writeFile(out+'/capture.webm',Buffer.from(b64,'base64'));
  }
  await writeFile(out+`/${task}.json`,JSON.stringify({meta,segments,errors},null,2));
  if(task==='perf'){
   await page.screenshot({path:out+'/perf-120.png'});
   const timing=await page.evaluate(()=>{
    const m=window.artScene.getObjectByName('coastal-roadster').userData.motion,air={airX:2.6,airZ:0,velocityX:0,velocityZ:40,yaw:0,time:0};
    const times=[];for(let i=0;i<360;i++){air.time=i/60;const t=performance.now();m.advance(40/60,0,1/60,0,0,0,air);if(i>60)times.push(performance.now()-t);}
    m.reset();times.sort((a,b)=>a-b);return {scope:'all occupant/wheel advance; 299 warm updates, no rendering',meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[Math.floor(times.length*.95)]};
   });await writeFile(out+'/motion-cpu.json',JSON.stringify(timing,null,2));
  }
 }
 console.log(JSON.stringify({device,variant,task,errors}));
}finally{
 if(!pixel)await browser.close();else await page.evaluate(()=>document.getElementById('r6-review-label')?.remove()).catch(()=>{});
}
process.exit(0);
