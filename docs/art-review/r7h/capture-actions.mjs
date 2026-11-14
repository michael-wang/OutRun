// Real WebGL game views. Pose playback and positioned rival are explicit DEV fixtures.
// Event triggers are independently exercised below through ordinary race stepping.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='test-results/r7h/actions';await mkdir(out,{recursive:true});
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
 await page.goto('http://127.0.0.1:5194/?at=350&trafficSeed=42&hairWind=wild');
 await page.locator('#boot-enter:visible, #start-race:visible').first().waitFor({state:'visible'});
 if(await page.locator('#boot-enter').isVisible())await page.locator('#boot-enter').click();
 await page.locator('#start-race').click();
 await page.waitForFunction(()=>window.__drive?.driveState().mode==='ready'&&document.querySelector('#game-loading').hidden,null,{timeout:120000});
 await page.locator('#race-start').click();await page.waitForFunction(()=>window.__drive.driveState().mode==='playing');
 await page.evaluate(()=>window.__drive.manual(true));
 const events=[];
 for(const side of ['right','left']){
  await page.evaluate(()=>window.__drive.reset({distance:3210,speed:224/3.6,lateral:0}));
  await page.waitForFunction(()=>window.__drive.streamFrame().safe);
  events.push(await page.evaluate(side=>{
   const q=window.__drive,rows=[];
   for(let encounter=0;encounter<2;encounter++){
   q.heroineTarget(side,12,35);
   for(let i=0;i<110;i++){
    const s=q.driveState();q.advance(.05,{gas:true,brake:false,steer:Math.max(-1,Math.min(1,q.steering().requiredSteer-.085*s.lateral-.06*s.lateralRate))});
    rows.push({t:encounter*5.5+i*.05,action:q.occupants().heroineAction??null,lead:q.race().rivals[0].distance-q.driveState().distance,score:q.rivalPassCount()});
   }
   }
   return {side,rows};
  },side));
 }
 for(const e of events)for(const kind of ['shout','kiss'])assert(e.rows.some(r=>r.action===`${kind}${e.side==='left'?'Left':'Right'}`),JSON.stringify(e));
 await page.evaluate(()=>window.__drive.reset({distance:14548,speed:224/3.6,lateral:0}));
 await page.waitForFunction(()=>window.__drive.streamFrame().safe);
 const finish=await page.evaluate(()=>{
  const q=window.__drive;q.advance(.15,{gas:true,brake:false,steer:0});
  const first={action:q.occupants().heroineAction,finish:q.race().playerFinish,hidden:document.querySelector('#race-standings').hidden};
  q.advance(2.3);return {first,after:{action:q.occupants().heroineAction??null,hidden:document.querySelector('#race-standings').hidden}};
 });
 assert.equal(finish.first.action,'victory');assert.equal(finish.first.hidden,true);assert.equal(finish.after.hidden,false);
 await writeFile(`${out}/events.json`,JSON.stringify({events,finish,errors},null,2));
 console.log('Live overtake + finish events passed');

 await page.evaluate(()=>window.__drive.reset({distance:3210,speed:224/3.6,lateral:0}));
 await page.waitForFunction(()=>window.__drive.streamFrame().safe);
 const result=await page.evaluate(async()=>{
  const q=window.__drive,r=window.artRenderer,car=window.artScene.getObjectByName('coastal-roadster');
  // Isolated visual playback: suppress the unrelated civilian wave in this page only.
  car.userData.motion.onCleanPass=()=>undefined;
  const actions=['shoutRight','kissRight','shoutLeft','kissLeft','victory'],shots={},samples=[];
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;
  const ctx=canvas.getContext('2d'),chunks=[];
  const recorder=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:7000000});
  recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();q.manual(false);
  let segmentStart=performance.now(),segment=0;
  await new Promise(resolve=>{const frame=now=>{
   const t=(now-segmentStart)/1000,action=actions[segment],s=q.driveState();
   q.controls({gas:s.speed*3.6<224,brake:s.speed*3.6>227,steer:Math.max(-1,Math.min(1,q.steering().requiredSteer-.085*s.lateral-.06*s.lateralRate))});
   const side=action.endsWith('Left')?'left':'right';
   const target=action==='victory'?null:q.heroineTarget(side,1);
   const clipTime=Math.max(0,t-.35);q.heroinePose(action,clipTime);
   ctx.drawImage(r.domElement,0,0);
   if(target){
    const x=(target.screen[0]+1)*800,y=(1-target.screen[1])*450;
    ctx.strokeStyle='#ffdf66';ctx.lineWidth=3;ctx.strokeRect(x-100,y-55,200,110);
    ctx.fillStyle='#ffdf66';ctx.font='bold 20px sans-serif';ctx.fillText(`${side.toUpperCase()} target ${target.id}`,Math.max(12,x-100),y-66);
   }
   ctx.fillStyle='#102130ee';ctx.fillRect(0,840,1600,60);ctx.fillStyle='#fff3c7';ctx.font='bold 20px sans-serif';
   ctx.fillText(`R7H ${action} | WILD | ${Math.round(s.speed*3.6)} km/h | original chase | seed 42`,25,865);
   ctx.font='16px sans-serif';ctx.fillText('Actual game renderer / DEV clip playback + fixed rival position / no mirrored camera',25,889);
   const at=action.startsWith('kiss')?1.12:.8;
   if(!shots[action]&&clipTime>=at){shots[action]=canvas.toDataURL('image/jpeg',.94).split(',')[1];samples.push({action,clipTime,target,distance:s.distance,speed:s.speed*3.6,render:{...r.info.render}});}
   if(t>=2.8){segment++;segmentStart=now;car.userData.motion.cancelHeroine();}
   if(segment<actions.length)requestAnimationFrame(frame);else resolve();
  };requestAnimationFrame(frame);});
  q.manual(true);q.controls(undefined);
  await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});
  const video=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks));});
  return {video,shots,samples};
 });
 await writeFile(`${out}/five-actions.webm`,Buffer.from(result.video,'base64'));
 for(const [name,data] of Object.entries(result.shots))await writeFile(`${out}/game-${name}.jpg`,Buffer.from(data,'base64'));
 await writeFile(`${out}/poses.json`,JSON.stringify({samples:result.samples,errors},null,2));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify(result.samples));
}finally{await browser.close();}
