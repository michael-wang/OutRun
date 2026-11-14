// R6d/R6f one-prototype comparison: unchanged wild field, game camera and scale.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const variant=process.argv[2]??'after',preset='wild';
const out=`test-results/r6f/${variant}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 const ev=window.__THREE_DEVTOOLS__=new EventTarget();
 ev.addEventListener('observe',e=>{if(e.detail.isScene)e.detail.addEventListener('childadded',c=>{
  if(c.child.name==='breakdown-warning-objects')e.detail.onBeforeRender=(r,s,cam)=>{
   if(cam.isPerspectiveCamera){window.artScene=s;window.artRenderer=r;window.artCamera=cam;}
  };
 });});
});
try{
 await page.goto(`http://127.0.0.1:5194/?at=350&trafficSeed=42&hairWind=${preset}${variant==='before'?'&hairStyle=r6d':''}`);
 await page.locator('#boot-enter:visible, #start-race:visible').first().waitFor({state:'visible'});
 if(await page.locator('#boot-enter').isVisible())await page.locator('#boot-enter').click();
 await page.locator('#start-race').click();
 await page.waitForFunction(()=>window.__drive?.driveState().mode==='ready'&&document.querySelector('#game-loading').hidden,null,{timeout:120000});
 await page.locator('#race-start').click();await page.waitForFunction(()=>window.__drive.driveState().mode==='playing');
 const meta=await page.evaluate(()=>{
  const car=window.artScene.getObjectByName('coastal-roadster'),mesh=car.getObjectByName('blender-blonde-spring'),r=window.artRenderer;
  window.__drive.manual(true);
  // Suppress random celebration ONLY in this capture page so head poses match.
  car.userData.motion.onCleanPass=()=>undefined;car.userData.motion.onRivalPass=()=>undefined;
  return {viewport:[innerWidth,innerHeight],drawingBuffer:[r.domElement.width,r.domElement.height],dpr:r.getPixelRatio(),scale:['driver','passenger'].map(n=>car.getObjectByName(n).scale.toArray()),hairTriangles:mesh.geometry.index.count/3,bones:mesh.skeleton.bones.length};
 });
 const segments=[];
 await page.evaluate(()=>window.__drive.reset({distance:14000,speed:0,lateral:0}));
 await page.waitForFunction(()=>window.__drive.streamFrame().safe);await page.waitForTimeout(800);
 const exposure=[];
 for(const view of ['chase','front45','rear45','side','back']){
  const shot=await page.evaluate(view=>{
   const car=window.artScene.getObjectByName('coastal-roadster'),r=window.artRenderer;
   const V=car.position.constructor,groom=car.getObjectByName('blender-blonde-groom');
   car.userData.motion.reset();car.updateMatrixWorld(true);
   const cam=window.artCamera.clone(),target=groom.localToWorld(new V(0,.05,0));
   if(view!=='chase'){
    const offset=new V(view==='back'?0:-.74,.27,view==='front45'?.74:view==='side'?0:-.74).applyQuaternion(car.quaternion);
    cam.position.copy(target).add(offset);cam.fov=32;cam.near=.01;cam.lookAt(target);cam.updateProjectionMatrix();cam.updateMatrixWorld();
   }
   r.render(window.artScene,cam);const png=r.domElement.toDataURL('image/png').split(',')[1];
   // Hair-only software depth raster: projected inner-cap exposure, ignoring
   // face/body occlusion and lighting. This is not a percentage of the screenshot.
   const mesh=car.getObjectByName('blender-blonde-spring'),g=mesh.geometry,p=new V(),points=[];
   mesh.skeleton.update();for(let i=0;i<g.attributes.position.count;i++){mesh.getVertexPosition(i,p).applyMatrix4(mesh.matrixWorld).project(cam);points.push([(p.x+1)*800,(1-p.y)*450,p.z]);}
   const depth=new Float32Array(1600*900).fill(Infinity),cap=new Uint8Array(depth.length);
   for(let i=0;i<g.index.count;i+=3){
    const ids=[0,1,2].map(k=>g.index.getX(i+k)),[a,b,c]=ids.map(v=>points[v]);
    const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-6)continue;
    const dark=ids.every(v=>g.attributes.color.getX(v)<.25)?1:0;
    for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));y<=Math.min(899,Math.ceil(Math.max(a[1],b[1],c[1])));y++)for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));x<=Math.min(1599,Math.ceil(Math.max(a[0],b[0],c[0])));x++){
     const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den,v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den;
     if(u<0||v<0||u+v>1)continue;const z=u*a[2]+v*b[2]+(1-u-v)*c[2],k=y*1600+x;if(z<depth[k]){depth[k]=z;cap[k]=dark;}
    }
   }
   let covered=0,inner=0;for(let i=0;i<depth.length;i++)if(Number.isFinite(depth[i])){covered++;inner+=cap[i];}
   return {png,capPercent:100*inner/covered,hairPixels:covered};
  },view);await writeFile(`${out}/${view}.png`,Buffer.from(shot.png,'base64'));exposure.push({view,capPercent:shot.capPercent,hairPixels:shot.hairPixels});
 }
 const draw=await page.evaluate(()=>{
  const r=window.artRenderer,mesh=window.artScene.getObjectByName('blender-blonde-spring');let hairCalls=0;
  mesh.onBeforeRender=()=>hairCalls++;r.render(window.artScene,window.artCamera);mesh.onBeforeRender=()=>{};
  return {hairCalls,frame:{...r.info.render},vertices:mesh.geometry.attributes.position.count};
 });
 await writeFile(`${out}/static.json`,JSON.stringify({variant,meta,draw,exposure,errors},null,2));
 if(process.argv[3]==='stills'){console.log(JSON.stringify({variant,meta,draw,errors}));await browser.close();process.exit(0);}
 const fixtures=[['idle',14000,0,2],['80',14000,80,2],['120',14000,120,2],['300',13910,300,2],['left',3305,280,2.5],['right',4000,280,2.5],['brake-settle',null,0,4.5]];
 for(const [label,distance,target,seconds] of fixtures){
  if(distance!==null){await page.evaluate(({distance,target})=>{const q=window.__drive;q.manual(true);q.reset({distance,speed:target/3.6,lateral:0});},{distance,target});await page.waitForFunction(()=>window.__drive.streamFrame().safe);}
  const result=await page.evaluate(async({label,target,seconds,preset})=>{
   const q=window.__drive,r=window.artRenderer,car=window.artScene.getObjectByName('coastal-roadster'),mesh=car.getObjectByName('blender-blonde-spring');
   const V=car.position.constructor,actual=new V(),rest=new V(),cam=window.artCamera;
   const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;const ctx=canvas.getContext('2d');
   ctx.drawImage(r.domElement,0,0,1600,900);
   const recorder=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:6500000}),chunks=[];
   recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();
   const samples=[],frames=[];let start=performance.now(),last=start,count=0;
   q.manual(false);
   await new Promise(resolve=>{
    const frame=now=>{
     const s=q.driveState();q.controls({gas:target>0&&s.speed*3.6<target,brake:target===0||s.speed*3.6>target+2,steer:Math.max(-1,Math.min(1,q.steering().requiredSteer-.085*s.lateral-.06*s.lateralRate))});
     frames.push(now-last);last=now;
     ctx.drawImage(r.domElement,0,0,1600,900);
     ctx.fillStyle='#102130e8';ctx.fillRect(0,852,1600,48);ctx.fillStyle='#fff3c7';ctx.font='bold 22px sans-serif';
     ctx.fillText(`R6f ${preset.toUpperCase()} | ${label} | ${Math.round(s.speed*3.6)} km/h | HUD ${Math.round(s.distance)} m | same 8m chase / seed 42`,25,883);
     if(count++%6===0){
      let pixels=0;for(let i=0;i<mesh.geometry.attributes.position.count;i+=5){
       rest.fromBufferAttribute(mesh.geometry.attributes.position,i).applyMatrix4(mesh.matrixWorld).project(cam);
       mesh.getVertexPosition(i,actual).applyMatrix4(mesh.matrixWorld).project(cam);
       pixels=Math.max(pixels,Math.hypot((rest.x-actual.x)*800,(rest.y-actual.y)*450));
      }
      samples.push({t:(now-start)/1000,speed:s.speed*3.6,distance:s.distance,pixels,spring:q.occupants().people[1].spring});
     }
     if(now-start<seconds*1000)requestAnimationFrame(frame);else resolve();
    };requestAnimationFrame(frame);
   });q.manual(true);q.controls(undefined);
   await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});
   const video=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks));});
   return {video,samples,frames};
  },{label,target,seconds,preset});
  if(variant!=='before')await writeFile(`${out}/${label}.webm`,Buffer.from(result.video,'base64'));delete result.video;
  segments.push({label,...result});await page.screenshot({path:`${out}/${label}.jpg`,quality:92});
  console.log(label,result.samples.at(-1)?.speed,Math.max(...result.samples.map(s=>s.pixels)));
 }
 await writeFile(`${out}/metrics.json`,JSON.stringify({preset,meta,segments,errors},null,2));
 console.log(JSON.stringify({preset,errors}));
}finally{await browser.close();}
