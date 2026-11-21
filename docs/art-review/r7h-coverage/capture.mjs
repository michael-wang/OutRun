// Real game capture; before uses the exact v0.10.28 GLB via a local request fixture.
import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const variant=process.argv[2]??'after',out=`test-results/r7h-coverage/${variant}`;await mkdir(out,{recursive:true});
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
if(variant==='before'){
 const body=await readFile('test-results/r7h-coverage/before-race.glb');
 await page.route('**/assets/characters/coast-heroine-r7h-race.glb',r=>r.fulfill({body,contentType:'model/gltf-binary'}));
}
try{
 await page.goto('http://127.0.0.1:5194/?at=350&trafficSeed=42&hairWind=wild');
 await page.locator('#boot-enter:visible, #start-race:visible').first().waitFor({state:'visible'});
 if(await page.locator('#boot-enter').isVisible())await page.locator('#boot-enter').click();
 await page.locator('#start-race').click();
 await page.waitForFunction(()=>window.__drive?.driveState().mode==='ready'&&document.querySelector('#game-loading').hidden,null,{timeout:120000});
 await page.locator('#race-start').click();await page.waitForFunction(()=>window.__drive.driveState().mode==='playing');
 await page.evaluate(()=>{window.__drive.manual(true);window.__drive.reset({distance:3210,speed:0,lateral:0});});
 await page.waitForFunction(()=>window.__drive.streamFrame().safe);await page.waitForTimeout(600);
 const data=await page.evaluate(()=>{
  const car=window.artScene.getObjectByName('coastal-roadster'),r=window.artRenderer,V=car.position.constructor,q=window.__drive;
  const pictures={},counts={},originalCamera=window.artCamera.clone();car.userData.motion.reset();
  for(const view of ['back','rear45','chase','shoutLeft','kissLeft','victory']){
   car.userData.motion.reset();
   if(['shoutLeft','kissLeft','victory'].includes(view))q.heroinePose(view,view==='kissLeft'?1.12:.8);
   car.updateMatrixWorld(true);const cam=originalCamera.clone();
   if(view==='back'||view==='rear45'){
    const target=car.localToWorld(new V(-.41,1.13,-.40));
    cam.position.copy(target).add(new V(view==='rear45'?-.75:0,.15,-1.15).applyQuaternion(car.quaternion));
    cam.fov=48;cam.near=.01;cam.lookAt(target);cam.updateProjectionMatrix();cam.updateMatrixWorld();
   }
   r.render(window.artScene,cam);pictures[view]=r.domElement.toDataURL('image/jpeg',.94).split(',')[1];counts[view]={...r.info.render};
  }
  q.heroinePose('victory',2.2);
  return {pictures,counts,scale:['driver','passenger'].map(n=>car.getObjectByName(n).scale.toArray())};
 });
 for(const [name,b64] of Object.entries(data.pictures))await writeFile(`${out}/${name}.jpg`,Buffer.from(b64,'base64'));
 delete data.pictures;await writeFile(`${out}/static.json`,JSON.stringify({variant,...data,errors},null,2));
 if(variant==='after'&&!process.argv.includes('--static')){
  await page.evaluate(()=>window.__drive.reset({distance:3210,speed:224/3.6,lateral:0}));
  await page.waitForFunction(()=>window.__drive.streamFrame().safe);
  const movie=await page.evaluate(async()=>{
   const q=window.__drive,r=window.artRenderer,car=window.artScene.getObjectByName('coastal-roadster');car.userData.motion.onCleanPass=()=>undefined;
   const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;const ctx=canvas.getContext('2d'),chunks=[];
   const recorder=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:6500000});
   recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();q.manual(false);
   const actions=['seated','shoutLeft','kissLeft','victory'];let segment=0,start=performance.now();
   await new Promise(resolve=>{const frame=now=>{
    const t=(now-start)/1000,action=actions[segment],s=q.driveState();
    q.controls({gas:s.speed*3.6<224,brake:s.speed*3.6>227,steer:Math.max(-1,Math.min(1,q.steering().requiredSteer-.085*s.lateral-.06*s.lateralRate))});
    if(action.endsWith('Left'))q.heroineTarget('left',1);
    if(action!=='seated')q.heroinePose(action,Math.max(0,t-.35));
    ctx.drawImage(r.domElement,0,0);ctx.fillStyle='#102130ee';ctx.fillRect(0,840,1600,60);ctx.fillStyle='#fff3c7';ctx.font='bold 21px sans-serif';
    ctx.fillText(`R7H half-open back | ${action} | WILD | ${Math.round(s.speed*3.6)} km/h | original chase`,25,866);
    ctx.font='16px sans-serif';ctx.fillText('Actual game renderer / DEV pose playback / same frozen R6d hair and five clips',25,889);
    if(t>=2.8){segment++;start=now;car.userData.motion.cancelHeroine();}
    if(segment<actions.length)requestAnimationFrame(frame);else resolve();
   };requestAnimationFrame(frame);});
   q.manual(true);q.controls(undefined);await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});
   return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks));});
  });
  await writeFile(`${out}/coverage-wild.webm`,Buffer.from(movie,'base64'));
 }
 assert.deepEqual(errors,[]);console.log(`${variant}: screenshots and browser checks passed`);
}finally{await browser.close();}
