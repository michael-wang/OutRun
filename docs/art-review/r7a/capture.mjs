// R7A approved bust comparison: unchanged R6d hair, wild field, camera and scale.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const variant=process.argv[2]??'after',preset='wild';
const out=`test-results/r7a/${variant}`;await mkdir(out,{recursive:true});
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
 await page.goto(`http://127.0.0.1:5194/?at=350&trafficSeed=42&hairWind=${preset}${variant==='before'?'&heroine=previous':''}`);
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
  return {viewport:[innerWidth,innerHeight],drawingBuffer:[r.domElement.width,r.domElement.height],dpr:r.getPixelRatio(),scale:['driver','passenger'].map(n=>car.getObjectByName(n).scale.toArray()),hairTriangles:mesh.geometry.index.count/3,bones:mesh.skeleton.bones.length,heroine:!!car.getObjectByName('heroine-upper-body')};
 });
 await page.evaluate(()=>window.__drive.reset({distance:3210,speed:0,lateral:0}));
 await page.waitForFunction(()=>window.__drive.streamFrame().safe);await page.waitForTimeout(800);

 const costs=[];
 for(const view of ['front','front45','side','back','cockpit','chase','neutral','cheer','look-left','look-right']){
  const result=await page.evaluate(view=>{
   const car=window.artScene.getObjectByName('coastal-roadster'),r=window.artRenderer,V=car.position.constructor;
   const groom=car.getObjectByName('blender-blonde-groom');car.userData.motion.reset();
   if(view==='cheer')car.userData.motion.posePassenger(.6,'wave');
   if(view==='look-left'||view==='look-right')car.userData.motion.setPassengerLook(view==='look-left'?.5:-.5);
   const bust=car.getObjectByName('heroine-upper-body');if(view==='neutral')bust?.traverse(m=>{if(m.morphTargetInfluences)m.morphTargetInfluences.fill(0);});
   car.updateMatrixWorld(true);const cam=window.artCamera.clone();
   let target=groom.localToWorld(new V(0,-.12,0));
   if(view!=='chase'){
    let offset=new V(view==='front45'?-.60:view==='side'?-1.15:0,.10,view==='back'?-1.15:view==='side'?0:view==='front45'?.60:.70);
    cam.fov=view==='side'||view==='back'?40:view==='front45'?48:60;
    if(view==='cockpit'){target=car.localToWorld(new V(0,1.24,-.30));offset.set(.7,.50,2.1);cam.fov=55;}
    offset.applyQuaternion(car.quaternion);cam.position.copy(target).add(offset);cam.near=.01;cam.lookAt(target);cam.updateProjectionMatrix();cam.updateMatrixWorld();
   }
   let bustCalls=0;bust?.traverse(m=>{if(m.isMesh)m.onBeforeRender=()=>bustCalls++;});
   r.render(window.artScene,cam);const png=r.domElement.toDataURL('image/png').split(',')[1];
   bust?.traverse(m=>{if(m.isMesh)m.onBeforeRender=()=>{};});
   return {png,draw:{...r.info.render},bustCalls};
  },view);await writeFile(`${out}/${view}.png`,Buffer.from(result.png,'base64'));delete result.png;costs.push({view,...result});
 }
 await writeFile(`${out}/static.json`,JSON.stringify({variant,meta,costs,errors},null,2));
 console.log(JSON.stringify({variant,meta,costs:costs[0],errors}));
 if(variant==='after'){
  await page.evaluate(()=>window.__drive.reset({distance:3501,speed:224/3.6,lateral:0}));
  await page.waitForFunction(()=>window.__drive.streamFrame().safe);
  const result=await page.evaluate(async()=>{
   const q=window.__drive,r=window.artRenderer,car=window.artScene.getObjectByName('coastal-roadster');
   const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;
   const ctx=canvas.getContext('2d'),chunks=[],samples=[];
   const recorder=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:6500000});
   recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();q.manual(false);
   const start=performance.now();let still;
   await new Promise(resolve=>{const frame=now=>{
    const s=q.driveState(),t=(now-start)/1000;
    q.controls({gas:s.speed*3.6<224,brake:s.speed*3.6>226,steer:Math.max(-1,Math.min(1,q.steering().requiredSteer-.085*s.lateral-.06*s.lateralRate))});
    if(t>3&&t<4.8)car.userData.motion.posePassenger(t-3,'wave');
    ctx.drawImage(r.domElement,0,0);ctx.fillStyle='#102130e8';ctx.fillRect(0,852,1600,48);
    ctx.fillStyle='#fff3c7';ctx.font='bold 22px sans-serif';
    ctx.fillText(`R7A actual game | R6d / WILD | ${Math.round(s.speed*3.6)} km/h | HUD ${Math.round(s.distance)} m | seed 42 | original chase camera`,25,883);
    if(!still&&t>1)still=r.domElement.toDataURL('image/png').split(',')[1];
    samples.push({t,speed:s.speed*3.6,distance:s.distance,head:q.occupants().people[1].head});
    if(t<8)requestAnimationFrame(frame);else resolve();
   };requestAnimationFrame(frame);});
   q.manual(true);q.controls(undefined);
   await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});
   const video=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks));});
   return {video,still,samples};
  });
  await writeFile(`${out}/chase-wild.webm`,Buffer.from(result.video,'base64'));
  await writeFile(`${out}/chase-fast.png`,Buffer.from(result.still,'base64'));
  await writeFile(`${out}/motion.json`,JSON.stringify({samples:result.samples,errors},null,2));
 }
}finally{await browser.close();}
