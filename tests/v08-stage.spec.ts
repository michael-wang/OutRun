import {test,expect} from '@playwright/test';
import {mkdirSync,readFileSync} from 'node:fs';
import {touchDriver} from './touch-driver';
const root='docs/evidence/v0.8';mkdirSync(root,{recursive:true});
test('stage seed, keyboard hints and retrospective review export',async({page})=>{
 await page.goto('/?stage=1&seed=42');await expect(page.locator('#l2-lab')).toContainText('S01-v0.8-r1-16-ALB1');
 const chunks=await page.evaluate(()=>(window as any).__drive.roadChunks());expect(chunks.count).toBeGreaterThan(5);expect(chunks.cullable).toBe(true);
 await expect(page.locator('#l2-play')).toHaveText('[P]lay Stage');await expect(page.locator('#l2-replay')).toHaveText('[R]eplay same');
 await expect(page.locator('.keyboard-hints')).not.toContainText('B Previous');
 await page.screenshot({path:`${root}/stage-menu.png`});await page.keyboard.press('KeyP');
 await expect(page.locator('#l2-praise')).toHaveText('[G]讚');await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.advance(8,{gas:true,brake:false,steer:0});});
 const history=await page.evaluate(()=>(window as any).__drive.recentHistory());await page.keyboard.press('KeyG');await page.keyboard.press('Digit2');await page.keyboard.press('Enter');
 const raw=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-stage-v08')!)),event:any=(Object.values(raw)[0] as any).events[0];
 expect(event.eventAt.stageCode).toBe('S01-v0.8-r1-16-ALB1');expect(event.eventAt.l2InstanceId).toBeTruthy();expect(event.eventAt.s).toBeLessThan(event.reactionAt.s);expect(history.some((x:any)=>x.trackDistance===event.eventAt.trackDistance)).toBe(true);
 await page.keyboard.press('KeyP');const download=page.waitForEvent('download');await page.locator('#l2-export').click();const data=JSON.parse(readFileSync((await (await download).path())!,'utf8'));expect(data.records[0].stageCode).toBe('S01-v0.8-r1-16-ALB1');expect(data.records[0].humanVote).toBe('UNREVIEWED');
});
test('standard pad mode, Square issue and L1 praise retain real history',async({page})=>{
 await page.addInitScript(()=>{(window as any).pad={connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[(window as any).pad]});});
 await page.goto('/?stage=1&seed=2');await page.bringToFront();await page.keyboard.press('KeyP');await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.advance(8,{gas:true,brake:false,steer:0});});
 const pulse=async(i:number)=>{await page.evaluate(i=>{(window as any).pad.buttons[i]={pressed:true,value:1};},i);await page.waitForTimeout(120);await page.evaluate(i=>{(window as any).pad.buttons[i]={pressed:false,value:0};},i);await page.waitForTimeout(120);};
 await pulse(2);await expect(page.locator('#l2-issue')).toHaveText('□ 問題');await page.screenshot({path:`${root}/gamepad-drive.png`});let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-stage-v08')!));let events:any=(Object.values(data)[0] as any).events;expect(events[0].kind).toBe('issue');expect(events[0].eventAt.s).toBeLessThan(events[0].reactionAt.s);
 await pulse(4);await expect(page.locator('#l2-feedback-dialog')).toBeVisible();await pulse(15);await pulse(0);await expect(page.locator('#l2-feedback-dialog')).toBeHidden();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-stage-v08')!));events=(Object.values(data)[0] as any).events;expect(events[1].tag).toBe('thrilling');
 await page.keyboard.press('KeyP');await expect(page.locator('#l2-play')).toContainText('[P]');await page.locator('#l2-issue-list input').fill('Roadside detail');await page.locator('#l2-issue-list input').blur();
 data=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-stage-v08')!));events=(Object.values(data)[0] as any).events;expect(events[0].note).toBe('Roadside detail');
 await page.evaluate(()=>{(window as any).pad.axes[0]=.05;});await page.waitForTimeout(250);await expect(page.locator('html')).toHaveAttribute('data-input-mode','keyboard');
 await pulse(12);await expect(page.locator('html')).toHaveAttribute('data-input-mode','gamepad');await page.evaluate(()=>{(window as any).pad.connected=false;});await expect(page.locator('html')).toHaveAttribute('data-input-mode','keyboard');
});
test('seed code reload, mobile layout and phase geometry',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/?stage=1&seed=42');
 await expect(page.locator('#stage-seed')).toHaveValue('S01-v0.8-r1-16-ALB1');
 await page.screenshot({path:`${root}/stage-mobile-menu.png`});await Promise.all([page.waitForNavigation(),page.locator('#stage-load').click()]);await expect(page).toHaveURL(/seed=42/);await page.waitForFunction(()=>!!(window as any).__drive);
 const stage=await page.evaluate(()=>(window as any).__drive.brick());await page.locator('#l2-play').click();
 for(const [i,phase] of stage.worldPhases.entries()){
  const d=350+(phase.startS+phase.endS)/2;await page.evaluate(d=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:d,speed:60});},d);
  const probe=await page.evaluate(d=>({road:(window as any).__drive.sample(d),hits:(window as any).__drive.surfaceProbe(d,0)}),d);
  expect(probe.hits.hits.some((h:any)=>h.name==='driving-surface'&&Math.abs(h.error)<.2)).toBe(true);expect(Number.isFinite(probe.road.grade)).toBe(true);
  await page.screenshot({path:`${root}/phase-${i}-${phase.world}.png`});
 }
});
test('five stage seeds keep the driving surface clear at representative beats',async({page})=>{
 for(const seed of [1,2,3,42,710]){
  await page.goto(`/?stage=1&seed=${seed}`);const data=await page.evaluate(()=>{const g=(window as any).__drive,b=g.brick(),rows=[];for(let s=0;s<b.length;s+=250){const d=350+s;rows.push({beat:`s=${s}`,road:g.sample(d),surface:g.surfaceProbe(d,0),props:g.sceneryProbe(d,0)});}return rows;});
  for(const row of data){const roadHit=row.surface.hits.find((h:any)=>h.name==='driving-surface');expect(roadHit,`${seed}/${row.beat}`).toBeTruthy();expect(Math.abs(roadHit.error)).toBeLessThan(.2);expect(row.surface.hits.filter((h:any)=>h.name!=='driving-surface'&&h.error>.15),`${seed}/${row.beat}`).toHaveLength(0);expect(row.props,`${seed}/${row.beat}`).toHaveLength(0);}
 }
});
test('stage retains simultaneous phone steering and gas',async({browser})=>{
 for(const [width,height] of [[844,390],[960,432]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage();await page.goto('/?stage=1&seed=1');await page.locator('#l2-play').tap();
  const touch=await touchDriver(page,context);await touch(.6,true,false);await page.waitForTimeout(250);
  const state=await page.evaluate(()=>(window as any).__drive.snapshot());expect(state.inputs.gas).toBe(true);expect(state.inputs.steer).toBeGreaterThan(.25);
  await expect(page.locator('#l2-praise')).toHaveText('✨ 讚');await page.screenshot({path:`${root}/touch-${width}.png`});await touch(null,false,false);await context.close();
 }
});
test('controller starts, pauses, resumes and chooses a new route',async({page})=>{
 await page.addInitScript(()=>{(window as any).pad={connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[(window as any).pad]});});
 await page.goto('/?stage=1&seed=1');await page.bringToFront();const pulse=async(i:number)=>{await page.evaluate(i=>{(window as any).pad.buttons[i]={pressed:true,value:1};},i);await page.waitForTimeout(130);await page.evaluate(i=>{(window as any).pad.buttons[i]={pressed:false,value:0};},i);await page.waitForTimeout(130);};
 await pulse(0);await expect(page.locator('#l2-feedback-bar')).toBeVisible();await pulse(9);await expect(page.locator('#l2-lab')).toBeVisible();await pulse(0);await expect(page.locator('#l2-feedback-bar')).toBeVisible();await pulse(9);await page.locator('#l2-next').focus();
 await Promise.all([page.waitForNavigation(),pulse(0)]);await expect(page).toHaveURL(/stage=1&seed=/);expect(new URL(page.url()).searchParams.get('seed')).not.toBe('1');
});
test('dramatic coast exception and canyon crest render on their actual profiles',async({page})=>{
 await page.goto('/?stage=1&seed=3');await page.locator('#l2-play').click();const stage=await page.evaluate(()=>(window as any).__drive.brick());
 for(const world of ['coast','canyon']){const beat=stage.beats.find((x:any)=>x.world===world&&x.verticality==='dramatic');expect(beat).toBeTruthy();const d=350+beat.startS+300;await page.evaluate(d=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:d,speed:60});},d);await page.screenshot({path:`${root}/dramatic-${world}.png`});const p=await page.evaluate(d=>(window as any).__drive.sample(d),d);expect(Number.isFinite(p.grade)).toBe(true);}
});
test('retrospective feedback keeps the actual earlier beat across a boundary',async({page})=>{
 await page.goto('/?stage=1&seed=1');await page.locator('#l2-play').click();
 await page.evaluate(()=>{const g=(window as any).__drive,b=g.brick();g.manual(true);g.reset({distance:350+b.beats[0].endS-250,speed:60});g.advance(3.5,{gas:true,brake:false,steer:0});});
 const history=await page.evaluate(()=>(window as any).__drive.recentHistory());await page.keyboard.press('KeyG');await page.keyboard.press('Digit1');await page.keyboard.press('Enter');
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-stage-v08')!)),event:any=(Object.values(data)[0] as any).events[0];
 expect(event.eventAt.l2InstanceId).toBe('S01-01');expect(event.reactionAt.l2InstanceId).toBe('S01-02');expect(history.some((x:any)=>x.trackDistance===event.eventAt.trackDistance&&x.l2InstanceId===event.eventAt.l2InstanceId)).toBe(true);
});
test('production stage starts and records feedback without development hooks',async({page})=>{
 await page.goto('http://127.0.0.1:4173/?stage=1&seed=3');await expect(page.locator('#l2-lab')).toContainText('S01-v0.8-r1-3-ALB1');expect(await page.evaluate(()=>!!(window as any).__drive)).toBe(false);
 await page.keyboard.press('KeyP');await expect(page.locator('#l2-feedback-bar')).toBeVisible();await page.keyboard.down('Space');await page.waitForTimeout(2500);await page.keyboard.up('Space');await page.keyboard.press('KeyG');await page.keyboard.press('Digit2');await page.keyboard.press('Enter');
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-stage-v08')!)),event:any=(Object.values(data)[0] as any).events[0];expect(event.eventAt.stageCode).toBe('S01-v0.8-r1-3-ALB1');expect(event.reactionAt.elapsedSeconds).toBeGreaterThan(event.eventAt.elapsedSeconds);
});
test('stage geometry and renderer resources remain bounded during a long run',async({page})=>{
 await page.goto('/?stage=1&seed=1');await page.locator('#l2-play').click();const result=await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);const drive=()=>{for(let i=0;i<1200;i++){const s=g.snapshot();g.advance(.2,{gas:s.speed<65,brake:false,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.1))});if(g.snapshot().mode==='paused')break;}};drive();const before=g.scenery().memory;g.reset({distance:350});drive();return {before,after:g.scenery().memory,state:g.snapshot()};});
 expect(result.state.mode).toBe('paused');expect(result.after.geometries).toBe(result.before.geometries);expect(result.after.textures).toBe(result.before.textures);
});
test('same stage seed recreates road and scenery while another changes them',async({page})=>{
 await page.goto('/?stage=1&seed=3');const first=await page.evaluate(()=>(window as any).__drive.sceneFingerprint());await page.reload();const replay=await page.evaluate(()=>(window as any).__drive.sceneFingerprint());expect(replay).toEqual(first);
 await page.goto('/?stage=1&seed=2');const other=await page.evaluate(()=>(window as any).__drive.sceneFingerprint());expect(other).not.toEqual(first);
});
test('generated valley has a visible descent and returns continuously',async({page})=>{
 await page.goto('/?stage=1&seed=1');const stage=await page.evaluate(()=>(window as any).__drive.brick()),valley=stage.placements.find((p:any)=>p.channel==='elevation'&&p.id==='E04');expect(valley).toBeTruthy();
 await page.locator('#l2-play').click();const before=350+valley.startS,mid=350+(valley.startS+valley.endS)/2,after=350+valley.endS;
 const heights=await page.evaluate(({before,mid,after})=>[before,mid,after].map(d=>(window as any).__drive.sample(d).position[1]),{before,mid,after});expect(heights[1]).toBeLessThan(heights[0]-10);expect(heights[2]).toBeCloseTo(heights[0],3);
 await page.evaluate(d=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:d,speed:60});},before+300);await page.screenshot({path:`${root}/valley.png`});
});
