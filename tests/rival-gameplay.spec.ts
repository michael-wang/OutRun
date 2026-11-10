import {test,expect,type Page} from '@playwright/test';

test.use({viewport:{width:915,height:412},isMobile:true,hasTouch:true,serviceWorkers:'block'});
async function enter(page:Page,query:string){
 await page.goto('/?'+query);
 await page.locator('#boot-enter').tap();
 await page.locator('#start-race').tap();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown',{timeout:90000});
 await expect(page.locator('#game-loading')).toBeHidden();
}
const race=(p:Page)=>p.evaluate(()=>(window as any).__drive.race());
const shot=(p:Page,name:string)=>p.screenshot({path:test.info().outputPath(name+'.png')});
test('grid holds all cars and accepts throttle; pause, replay and return reset the race',async({page})=>{
 await enter(page,'trafficSeed=17');
 const before=await race(page);
 expect(before.rivals).toHaveLength(7);
 expect(before.rank).toBe(8);
 expect(before.rivals.every((r:any)=>r.distance>=350+12)).toBe(true);
 const labels=await page.evaluate(()=>(window as any).__drive.rivalTags());
 expect(labels.map((x:any)=>x.name)).toEqual(['對手一','對手二','對手三','對手四','對手五','對手六','對手七']);
 expect(labels.every((x:any)=>x.sizeAttenuation===false)).toBe(true);
 await page.keyboard.down('Space');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().rpm)).toBeGreaterThan(2500);
 const now=await race(page);
 expect(now.time).toBe(0);expect(now.rivals.map((r:any)=>r.distance)).toEqual(before.rivals.map((r:any)=>r.distance));
 expect(await page.evaluate(()=>(window as any).__drive.snapshot().speed)).toBe(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.tireEffects().particles)).toBeGreaterThan(0);
 const wheels=await page.evaluate(()=>(window as any).__drive.wheels());
 expect(wheels.every((w:any)=>w.front?w.angle===0:Math.abs(w.angle)>0)).toBe(true);
 await shot(page,'starting-grid');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().speed)).toBeGreaterThan(14);
 await shot(page,'coast-race');
 await page.keyboard.up('Space');
 await page.locator('#pause').tap();
 const stopped=await race(page);await page.waitForTimeout(250);expect((await race(page)).time).toBe(stopped.time);
 await page.keyboard.press('KeyR');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
 expect((await race(page)).time).toBe(0);
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
 await page.locator('#pause').tap();await page.locator('#tp-exit').tap();
 await expect(page.locator('#racing-menu')).toBeVisible();expect(page.workers()).toHaveLength(0);
 await page.locator('#start-race').tap();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown',{timeout:90000});
 expect((await race(page)).time).toBe(0);
});
test('parked player, remote rival chase on loaded scenery, all seven rivals cross the real finish',async({page})=>{
 test.setTimeout(240000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await enter(page,'rivaldebug=1&trafficSeed=945');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
 await page.evaluate(()=>(window as any).__drive.manual(true));
 const advance=()=>page.evaluate(()=>{(window as any).__drive.advance(.65,{gas:false,brake:false,steer:0},false);return (window as any).__drive.race();});
 await expect.poll(async()=>(await advance()).rivals[0].distance,{intervals:[10],timeout:100000}).toBeGreaterThan(6900);
 expect(await page.evaluate(()=>(window as any).__drive.snapshot().distance)).toBe(350);
 await page.getByRole('button',{name:'下一位參賽者'}).tap();
 await expect(page.locator('#race-data')).toContainText('km/h',{timeout:90000});
 const d=await race(page);
 await expect.poll(()=>page.evaluate(d=>(window as any).__drive.streaming().chunks.some((c:any)=>c.index===Math.floor(d/1000)&&c.road==='ready'&&c.scenery==='ready'),d.rivals[0].distance)).toBe(true);
 await expect(page.locator('#race-camera-name')).toHaveText('對手一');
 await expect.poll(()=>page.evaluate(()=>{
  const g=(window as any).__drive,r=g.race().rivals[0];
  const target=g.sample(r.distance).position,eye=g.snapshot().camera.position;
  return Math.hypot(eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]);
 }),{timeout:90000}).toBeLessThan(20);
 await expect(page.locator('#race-data')).toContainText('km/h');
 await shot(page,'remote-rival-debug');
 await expect.poll(async()=>(await advance()).rivals.filter((r:any)=>r.finishTime!==null).length,{intervals:[10],timeout:100000}).toBe(7);
 expect((await race(page)).rank).toBe(8);expect(errors).toEqual([]);
});
test('a player finishing first can spectate a live rival and leave immediately',async({page})=>{
 await enter(page,'at=10260&trafficSeed=17');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
 await page.evaluate(()=>{const g=(window as any).__drive;g.reset({distance:10315,speed:72,lateral:0});g.controls({gas:true,brake:false,steer:0});});
 const result=page.getByRole('region',{name:'旅程結算'});
 await expect(result).toBeVisible();
 await expect(page.locator('#player-title')).toContainText('第 1 名');
 await expect(page.locator('#race-standings-list li')).toHaveCount(8);
 await expect(page.locator('#race-standings-list li').first()).toContainText('玩家');
 await expect(page.locator('#race-standings-list li').last()).toContainText(/對手/);
 await shot(page,'race-results');
 const before=await race(page);
 await page.locator('#race-watch').tap();
 await expect(page.locator('#race-director')).toBeVisible();
 await expect.poll(async()=>(await race(page)).rivals[0].distance).toBeGreaterThan(before.rivals[0].distance);
 await page.getByRole('button',{name:'返回結算'}).tap();
 await page.locator('#results-menu').tap();
 await expect(page.locator('#racing-menu')).toBeVisible();
});

for(const input of ['touch','gamepad'] as const)test(input+' throttle carries across GO',async({page,context})=>{
 if(input==='gamepad')await page.addInitScript(()=>{
  const pad={id:'DualShock standard',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],
   buttons:Array.from({length:17},()=>({pressed:false,value:0,touched:false}))};
  Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});
  (window as any).holdTrigger=()=>{pad.buttons[7]={pressed:true,value:1,touched:true};};
 });
 await enter(page,'trafficSeed=17');
 const cdp=await context.newCDPSession(page);
 if(input==='touch'){
  const pedal=await page.locator('[data-control=gas]').boundingBox();expect(pedal).toBeTruthy();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pedal!.x+pedal!.width/2,y:pedal!.y+pedal!.height/2}]});
 }else await page.evaluate(()=>(window as any).holdTrigger());
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().rpm)).toBeGreaterThan(2500);
 expect((await race(page)).time).toBe(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().speed)).toBeGreaterThan(2);
 if(input==='touch')await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
});

test('a glancing player contact produces a reciprocal slide and the existing impact effects',async({page})=>{
 await enter(page,'trafficSeed=17');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
 const contact=await page.evaluate(()=>{
  const g=(window as any).__drive;g.manual(true);
  const x=g.race().rivals[0].lateral;
  g.reset({distance:357,speed:13,lateral:x+2.30});
  const controls={gas:true,brake:false,steer:-1};let speedBefore=13;
  for(let i=0;i<80&&!g.trafficImpact().event;i++){
   speedBefore=g.driveState().speed;g.advance(1/120,controls,false);
  }
  const speed=g.driveState().speed;
  g.advance(.05,controls);
  return {impact:g.trafficImpact(),rival:g.race().rivals[0],speed,speedBefore};
 });
 expect(contact.impact.event).toMatchObject({actorId:-100,kind:'side'});
 expect(Math.abs(contact.rival.impulse)).toBeGreaterThan(0);
 expect(contact.speed).toBeLessThan(contact.speedBefore);expect(contact.impact.sparks.particles).toBeGreaterThan(0);
 await shot(page,'rival-contact');
});

test('L1/R1 cycle the debug chase camera without opening legacy feedback or dropping throttle',async({page})=>{
 await page.addInitScript(()=>{
  const pad={id:'Standard controller',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],
   buttons:Array.from({length:17},()=>({pressed:false,value:0,touched:false}))};
  Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});
  (window as any).__testPad=pad;
 });
 await enter(page,'rivaldebug=1&trafficSeed=17');
 await page.bringToFront();
 await expect(page.locator('#race-cameras')).toContainText('L1');
 await expect(page.locator('#race-cameras')).toContainText('R1');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
 const set=(button:number,pressed:boolean)=>page.evaluate(({button,pressed})=>{
  (window as any).__testPad.buttons[button]={pressed,value:pressed?1:0,touched:pressed};
 },{button,pressed});
 const press=async(button:number)=>{
  await set(button,true);await page.waitForTimeout(140);
  await set(button,false);await page.waitForTimeout(140);
 };
 await set(7,true);
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().inputs.gas)).toBe(true);
 await press(5);
 await expect.poll(async()=>(await race(page)).observed).toBe(0);
 await expect(page.locator('#race-camera-name')).toHaveText('對手一');
 await expect(page.locator('#l2-feedback-dialog')).toBeHidden();
 expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs.gas)).toBe(true);
 await press(4);
 await expect.poll(async()=>(await race(page)).observed).toBe(-1);
 await press(4);
 await expect.poll(async()=>(await race(page)).observed).toBe(6);
 await expect(page.locator('#race-camera-name')).toHaveText('對手七');
 await set(7,false);
});

test('a real on-road Rival overtake starts the passenger applause, not a random traffic cheer',async({page})=>{
 await enter(page,'trafficSeed=17');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
 const result=await page.evaluate(()=>{
  const g=(window as any).__drive;
  g.manual(true);g.reset({distance:350,speed:72,lateral:0});
  const before=g.rivalPassCount();
  g.advance(.3,{gas:true,brake:false,steer:0},false);
  return {before,after:g.rivalPassCount(),occupants:g.occupants(),rank:g.race().rank};
 });
 expect(result.before).toBe(0);
 expect(result.after).toBeGreaterThan(0);
 expect(result.occupants.cheer).toBe('applause');
 expect(result.occupants.cheerTime).toBeGreaterThanOrEqual(0);
});
