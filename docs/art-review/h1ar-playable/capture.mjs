import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
const variant=process.argv[2]||'new',view=process.argv[3]||'chase';
const out='test-results/h1ar-playable/'+variant+'-'+view;await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1600,height:900},serviceWorkers:'block'});
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(r.url().includes('coast-blonde-bob'))requests.push(r.url());});
if(variant==='old')await page.route('**/coast-blonde-bob.glb',r=>r.fulfill({status:404,body:'baseline fallback'}));
await page.addInitScript(()=>{
 const ev=window.__THREE_DEVTOOLS__=new EventTarget();
 ev.addEventListener('observe',e=>{if(e.detail.isScene)e.detail.addEventListener('childadded',c=>{
  if(c.child.name==='breakdown-warning-objects')e.detail.onBeforeRender=(r,s,cam)=>{
   if(cam.isPerspectiveCamera){window.artScene=s;window.artRenderer=r;window.artCamera=cam;}
  };
 });});
});
try{
await page.goto('http://127.0.0.1:5194/?at=350&trafficSeed=42&r5qa=1');
await page.locator('#start-race').click();
await page.waitForFunction(()=>window.__drive?.driveState().mode==='ready'&&document.querySelector('#game-loading').hidden,null,{timeout:120000});
await page.locator('#race-start').click();await page.waitForFunction(()=>window.__drive.driveState().mode==='playing');
await page.evaluate(()=>window.__drive.manual(true));
const configurations=view==='close'?
 [['rest',5230,0,2],['120 km/h',5230,120,4],['294 km/h',5250,294,4],['left turn',3305,294,3],['right turn',4000,294,3],['braking',null,0,6]]:
 [['rest',14000,0,2],['120 km/h',14000,120,5],['294 km/h',13910,294,4],['left turn',3305,294,3],['right turn',4000,294,3],['braking',null,0,6],['settled',null,0,3]];
await page.evaluate(({variant,view})=>{
 const r=window.artRenderer,q=window.__drive,canvas=document.createElement('canvas');
 canvas.width=1600;canvas.height=900;const ctx=canvas.getContext('2d');
 const recorder=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:5000000});
 const chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);
 window.review={r,q,canvas,ctx,recorder,chunks,variant,view};
 recorder.start();
}, {variant,view});
const segments=[];
for(const [label,distance,target,seconds] of configurations){
 if(distance!==null){
  await page.evaluate(({distance,target})=>{window.__drive.manual(true);window.__drive.reset({distance,speed:target/3.6,lateral:0});}, {distance,target});
  await page.waitForFunction(()=>window.__drive.streamFrame().safe,null,{timeout:30000});
  await page.waitForTimeout(350);
 }
 const stats=await page.evaluate(async({label,target,seconds})=>{
  const {r,q,canvas,ctx,variant,view}=window.review;
  const car=window.artScene.getObjectByName('coastal-roadster'),mesh=car.getObjectByName('blender-blonde-bob');
  const Vector=car.position.constructor,cam=window.artCamera;
  const samples=[],gaps=[],motion=[];let frames=0,last=performance.now(),start=last;
  q.manual(false);
  await new Promise(resolve=>{
   const frame=now=>{
    const state=q.driveState(),steer=Math.max(-1,Math.min(1,q.steering().requiredSteer-.085*state.lateral-.06*state.lateralRate));
    q.controls({gas:target>0&&state.speed*3.6<target,brake:target===0||state.speed*3.6>target+2,steer});
    gaps.push(now-last);last=now;
    if(view==='close'){
     cam.position.copy(car.localToWorld(new Vector(-.8,1.85,-2.6)));
     cam.lookAt(car.localToWorld(new Vector(-.40,1.40,-.48)));cam.updateMatrixWorld(true);
     r.render(window.artScene,cam);
    }
    ctx.drawImage(r.domElement,0,0,1600,900);
    ctx.fillStyle='#0b1428dd';ctx.fillRect(20,18,930,90);ctx.fillStyle='#fff1b9';ctx.font='bold 23px sans-serif';
    ctx.fillText(`OutRun 0.10.19 | ${variant==='new'?'Blender blonde':'Original hair'} | ${view==='close'?'QA close camera':'NORMAL CHASE CAMERA'}`,38,49);
    ctx.font='20px sans-serif';ctx.fillText(`${label} | ${Math.round(state.speed*3.6)} km/h | HUD station ${Math.round(state.distance)}m | trafficSeed=42`,38,83);
    if(frames%6===0){
     samples.push({speed:state.speed*3.6,distance:state.distance,lateral:state.lateral,wind:q.occupants().wind,sway:q.occupants().sway,tipSway:q.occupants().tipSway});
     if(mesh){
      let max=0;
      const positions=mesh.geometry.attributes.position;
      for(let i=0;i<positions.count;i++){
       const rest=new Vector().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).project(cam);
       const actual=mesh.getVertexPosition(i,new Vector()).applyMatrix4(mesh.matrixWorld).project(cam);
       max=Math.max(max,Math.hypot((actual.x-rest.x)*800,(actual.y-rest.y)*450));
      }
      motion.push(max);
     }
    }
    frames++;
    if(now-start<seconds*1000)requestAnimationFrame(frame);else resolve();
   };requestAnimationFrame(frame);
  });
  q.manual(true);q.controls(undefined);
  let triangles=0,draws=0;car.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1);draws++;}});
  const gl=r.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info');
  return {label,seconds,samples,gaps,maxDeformationPixels:motion.length?Math.max(...motion):null,carTriangles:triangles,carDraws:draws,memory:{...r.info.memory},render:{...r.info.render},gpu:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):null};
 }, {label,target,seconds});
 segments.push(stats);
 await page.screenshot({path:out+'/'+label.replaceAll(' ','-').replaceAll('/','')+'.jpg',quality:92});
 console.log(label,stats.samples.at(-1));
}
const base64=await page.evaluate(async()=>{
 const a=window.review;
 await new Promise(resolve=>{a.recorder.onstop=resolve;a.recorder.stop();});
 return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(a.chunks,{type:'video/webm'}));});
});
await writeFile(out+'/capture.webm',Buffer.from(base64,'base64'));
await writeFile(out+'/metrics.json',JSON.stringify({variant,view,segments,errors,requests},null,2));
if(variant==='new'&&view==='chase'){
 const lifecycle=[];
 for(let cycle=0;cycle<2;cycle++){
  await page.evaluate(()=>{
   window.hairDisposed={geometry:0,material:0};
   const hair=window.artScene.getObjectByName('blender-blonde-bob');
   hair.geometry.addEventListener('dispose',()=>window.hairDisposed.geometry++);
   hair.material.addEventListener('dispose',()=>window.hairDisposed.material++);
  });
  await page.keyboard.press('p');await page.locator('#tp-exit').click();
  await page.locator('#start-race').waitFor({state:'visible'});
  const disposed=await page.evaluate(()=>window.hairDisposed);
  await page.locator('#start-race').click();
  await page.waitForFunction(()=>window.__drive?.driveState().mode==='ready'&&document.querySelector('#game-loading').hidden,null,{timeout:120000});
  await page.locator('#race-start').click();await page.waitForFunction(()=>window.__drive.driveState().mode==='playing');
  await page.evaluate(()=>window.__drive.manual(true));await page.waitForTimeout(1000);
  lifecycle.push(await page.evaluate(disposed=>({disposed,geometry:window.artScene.getObjectByName('blender-blonde-bob').geometry.uuid,
   weights:window.artScene.getObjectByName('blender-blonde-bob').morphTargetInfluences,memory:{...window.artRenderer.info.memory}}),disposed));
 }
 await writeFile(out+'/lifecycle.json',JSON.stringify({lifecycle,errors,requests},null,2));
}
console.log(JSON.stringify({errors,requests,video:out+'/capture.webm'}));
}finally{await browser.close();}
