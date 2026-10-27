import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {touchDriver} from './touch-driver';
const root='docs/evidence/v0.7d/regressions/v0.7c1/regressions/v0.7c';mkdirSync(root,{recursive:true});
test('all sixteen L2 scenes render real road and retain clean independent review defaults',async({page})=>{
 const errors:string[]=[],rows=[];page.on('pageerror',e=>errors.push(e.message));
 for(let i=1;i<=16;i++){
  const id=`L2-${String(i).padStart(3,'0')}`;await page.goto(`/?lab=l2&l2=${id}`);await expect(page.locator('#l2-progress')).toContainText('16 / 16 unreviewed');
  const row=await page.evaluate(()=>{const g=(window as any).__drive,b=g.brick();g.manual(true);const hits=[];for(let d=350;d<350+b.length;d+=25){for(const side of [-1,0,1]){const x=side*(g.sample(d).halfWidth-1),p=g.surfaceProbe(d,x),props=g.sceneryProbe(d,x);if(p.hits[0]?.name!=='driving-surface'||Math.abs(p.hits[0].error)>.06||props.length)hits.push({d,x,p,props});}}g.reset({distance:350+b.length*.5,speed:60});return {id:b.id,hits,fingerprint:g.sceneFingerprint(),memory:g.scenery().memory};});
  await page.screenshot({path:`${root}/${id}-initial.png`});expect.soft(row.hits,`${id} road must be top surface`).toEqual([]);rows.push(row);await page.reload();expect(await page.evaluate(()=>(window as any).__drive.sceneFingerprint())).toEqual(row.fingerprint);
 }
 expect(errors).toEqual([]);writeFileSync(`${root}/scene-checks.json`,JSON.stringify({rows,errors},null,2));
});
test('Pixel-like feedback controls keep two-thumb input isolated in both layouts and small keyboard viewports',async({browser})=>{
 for(const [width,height] of [[960,432],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage();await page.goto('/?lab=l2');
  for(const swapped of [false,true]){
   if(swapped){await page.locator('#l2-settings').click();await page.locator('#swap').check();await page.locator('#close-settings').click();}
   await page.screenshot({path:`${root}/l2-menu-${width}-${swapped}.png`});await page.locator('#l2-play').click();await page.evaluate(()=>(window as any).__drive.manual(true));const touch=await touchDriver(page,context);await touch(.5,true,false);await page.evaluate(()=>(window as any).__drive.advance(.2));
   expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs.gas)).toBe(true);
   await page.locator('#l2-praise').tap();await page.screenshot({path:`${root}/praise-${width}-${swapped}.png`});
   for(const text of ['超好玩!','超刺激!','超難! 但是過了超爽!','風景優美'])await expect(page.getByRole('button',{name:text,exact:true})).toBeVisible();
   await page.locator('[data-praise-tag=super_fun]').click();await touch(null,false,false);await page.locator('#l2-feedback-resume').click();expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs)).toEqual({gas:false,brake:false,steer:0});
   await page.locator('#l2-issue').tap();await page.setViewportSize({width,height:240});await page.locator('#l2-event-note').fill('手機鍵盤測試：山路轉彎');await page.keyboard.press('Space');await page.keyboard.press('KeyD');expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs)).toEqual({gas:false,brake:false,steer:0});await page.screenshot({path:`${root}/issue-keyboard-${width}-${swapped}.png`});await page.locator('#l2-save-issue').click();await page.setViewportSize({width,height});await page.locator('#pause').click();
  }
  expect(await page.evaluate(()=>localStorage.getItem('outrun-brick-reviews-v1'))).toBeNull();await context.close();
 }
});
test('praise and issue anchors precede clearing controls; completion feedback stays with the completed L2',async({page})=>{
 await page.goto('/?lab=l2&l2=L2-007');await page.locator('#l2-play').click();await page.evaluate(()=>(window as any).__drive.manual(true));await page.keyboard.down('Space');await page.keyboard.down('KeyD');await page.evaluate(()=>(window as any).__drive.advance(.3));
 const before=await page.evaluate(()=>(window as any).__drive.snapshot());await page.locator('#l2-praise').click();await expect(page.locator('#l2-feedback-dialog')).toBeVisible();await page.locator('[data-praise-tag=thrilling]').click();
 let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-l2-feedback-v1')!));let r:any=Object.values(data)[0];expect(r.humanVote).toBe('UNREVIEWED');expect(r.events[0].anchor.trackDistance).toBe(before.distance);expect(r.events[0].anchor.drive.gas).toBe(true);expect(r.events[0].anchor.drive.steerApplied).toBe(before.appliedSteer);
 await page.keyboard.up('Space');await page.keyboard.up('KeyD');await page.locator('#l2-feedback-resume').click();expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs)).toEqual({gas:false,brake:false,steer:0});
 await page.evaluate(()=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',repeat:true}));window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD',repeat:true}));(window as any).__drive.advance(.2);});expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs)).toEqual({gas:false,brake:false,steer:0});
 await page.locator('#l2-issue').click();await page.locator('#l2-event-note').fill('彎道視線：問題測試');await page.locator('#l2-save-issue').click();
 await page.evaluate(()=>{const g=(window as any).__drive,b=g.brick();g.reset({distance:350+b.length-1,speed:65});g.advance(.1,{gas:true,brake:false,steer:0});});await expect(page.locator('#l2-result')).toContainText('Completed');await page.locator('[data-end-tag=hard_but_rewarding]').click();
 await page.locator('[data-l2-vote=REWORK]').click();await page.locator('#l2-difficulty').selectOption('4');
 const download=page.waitForEvent('download');await page.locator('#l2-export').click();const output=JSON.parse(readFileSync((await (await download).path())!,'utf8'));r=output.records[6];expect(r.events).toHaveLength(3);expect(r.events[1].note).toBe('彎道視線：問題測試');expect(r.events[2].anchor.source).toBe('completion');expect(r.events[2].anchor.id).toBe('L2-007');expect(r.events[2].anchor.s).toBeGreaterThan(1000);expect(r.difficulty).toBe(4);writeFileSync(`${root}/isolated-feedback-example.json`,JSON.stringify(output,null,2));
 await page.reload();await expect(page.locator('[data-l2-vote=REWORK]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#l2-events')).toContainText('2 praise · 1 issues');
});

test('seeded scenery repeats, seed variants change props, and feedback makes no external requests',async({page})=>{
 const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5173/')&&!r.url().startsWith('blob:'))external.push(r.url());});await page.goto('/?lab=l2');
 const hashes=await page.evaluate(async()=>{
  const {createWorld}=await import('/src/world.ts' as string),{L2_CANDIDATES,createL2Track,l2Course,l2Sample}=await import('/src/l2-catalog.ts' as string);
  const b=L2_CANDIDATES[0],hashes=[];
  for(const seed of [b.seed,b.seed,b.seed+1]){const w=createWorld({track:createL2Track(b),theme:b.sceneryAct,seed,halfAt:(d:number)=>l2Sample(b,d).halfWidth,course:l2Course(b)});let hash=2166136261;w.scene.getObjectByName('scenery').traverse((o:any)=>{if(o.instanceMatrix)for(const n of o.instanceMatrix.array){hash^=Math.round(n*1000);hash=Math.imul(hash,16777619);}});hashes.push(hash>>>0);w.scene.traverse((o:any)=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])m.dispose();});}return hashes;
 });expect(hashes[0]).toBe(hashes[1]);expect(hashes[0]).not.toBe(hashes[2]);await page.locator('#l2-play').click();await page.locator('#l2-issue').click();await page.locator('#l2-event-note').fill('只留在本機');await page.locator('#l2-save-issue').click();expect(external).toEqual([]);writeFileSync(`${root}/seed-network-check.json`,JSON.stringify({hashes,external},null,2));
});

test('production L2 lab plays, pauses for praise and exports without a development driver',async({page})=>{
 await page.goto('http://127.0.0.1:4173/?lab=l2&l2=L2-015');expect(await page.evaluate(()=>'__drive' in window)).toBe(false);await expect(page.locator('#l2-progress')).toContainText('16 / 16 unreviewed');await page.locator('#l2-play').click();await page.keyboard.down('Space');await page.waitForTimeout(400);await page.locator('#l2-praise').click();await page.keyboard.up('Space');await page.locator('[data-praise-tag=beautiful_scenery]').click();await page.locator('#l2-feedback-resume').click();await expect(page.locator('#l2-feedback-dialog')).toBeHidden();await page.locator('#pause').click();const download=page.waitForEvent('download');await page.locator('#l2-export').click();const data=JSON.parse(readFileSync((await (await download).path())!,'utf8'));expect(data.records[14].events[0].anchor.id).toBe('L2-015');expect(data.records.every((r:any)=>r.humanVote==='UNREVIEWED')).toBe(true);
});
