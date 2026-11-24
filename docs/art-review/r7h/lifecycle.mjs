import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function enter(){
 await page.locator('#start-race').click();
 await page.waitForFunction(()=>window.__drive?.driveState().mode==='ready'&&document.querySelector('#game-loading').hidden,null,{timeout:120000});
 await page.locator('#race-start').click();await page.waitForFunction(()=>window.__drive.driveState().mode==='playing');
 await page.evaluate(()=>window.__drive.manual(true));
}
try{
 await page.goto('http://127.0.0.1:5194/?trafficSeed=42&hairWind=wild');
 await page.locator('#boot-enter:visible, #start-race:visible').first().waitFor({state:'visible'});
 if(await page.locator('#boot-enter').isVisible())await page.locator('#boot-enter').click();await enter();
 await page.evaluate(()=>window.__drive.reset({distance:3210,speed:224/3.6}));
 await page.waitForFunction(()=>window.__drive.streamFrame().safe);
 const active=await page.evaluate(()=>{
  const q=window.__drive;q.heroineTarget('left',12,35);
  for(let i=0;i<20&&!q.occupants().heroineAction;i++)q.advance(.05,{gas:true,brake:false,steer:q.steering().requiredSteer});
  return q.occupants().heroineAction;
 });assert.equal(active,'shoutLeft');
 await page.keyboard.press('Escape');
 const paused=await page.evaluate(()=>{
  const q=window.__drive,a=q.occupants();q.advance(.6);return {mode:q.driveState().mode,before:a,after:q.occupants()};
 });assert.equal(paused.mode,'paused');assert.deepEqual(paused.after,paused.before);
 await page.keyboard.press('Escape');
 const resumed=await page.evaluate(()=>{const q=window.__drive;q.advance(2,{gas:false,brake:false,steer:q.steering().requiredSteer});return {mode:q.driveState().mode,action:q.occupants().heroineAction??null};});
 assert.equal(resumed.mode,'playing');assert.equal(resumed.action,null);
 await page.keyboard.press('Escape');await page.locator('#tp-restart:visible, #player-restart:visible').first().click();
 await page.waitForFunction(()=>window.__drive?.driveState().distance===350&&document.querySelector('#game-loading')?.hidden,null,{timeout:120000});
 const restarted=await page.evaluate(()=>({action:window.__drive.occupants().heroineAction??null,distance:window.__drive.driveState().distance}));
 assert.equal(restarted.action,null);assert.equal(restarted.distance,350);
 await page.evaluate(()=>window.__drive.reset({distance:14548,speed:224/3.6}));
 await page.waitForFunction(()=>window.__drive.streamFrame().safe);await page.evaluate(()=>window.__drive.advance(2.6,{gas:true,brake:false,steer:0}));
 await page.locator('#result-menu').click();await page.locator('#start-race').waitFor({state:'visible'});await enter();
 const reentered=await page.evaluate(()=>({action:window.__drive.occupants().heroineAction??null,mode:window.__drive.driveState().mode}));
 assert.equal(reentered.action,null);assert.equal(reentered.mode,'playing');assert.deepEqual(errors,[]);
 await writeFile('test-results/r7h/lifecycle.json',JSON.stringify({active,pausePreserved:true,resumed,restarted,reentered,errors},null,2));
 console.log('Pause/resume, restart, finish-to-menu, scene re-entry passed');
}finally{await browser.close();}
