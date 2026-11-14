import {test,expect,type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

test.use({viewport:{width:960,height:540},hasTouch:true,serviceWorkers:'block'});
async function openCoast(page:Page){
 await page.goto('/?at=2500&r5qa=1&trafficSeed=42');
 const boot=page.locator('#boot-enter');
 if(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches))await boot.tap();
 await page.locator('#start-race').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready',{timeout:120000});
 await expect(page.locator('#game-loading')).toBeHidden({timeout:120000});
}

test('a racing rival sweeps the A4 sign and its mesh stays flat in the real scene',async({page},info)=>{
 test.setTimeout(200000);
 await page.addInitScript(()=>{
  const w=window as any;
  // Three's inspection events expose the existing scene and renderer to this test only.
  w.__THREE_DEVTOOLS__=new EventTarget();
  w.__THREE_DEVTOOLS__.addEventListener('observe',(event:CustomEvent)=>{
   const obj=event.detail;
   if(obj.isScene)obj.addEventListener('childadded',(e:any)=>{
    if(e.child.name!=='breakdown-warning-objects')return;
    obj.onBeforeRender=(renderer:any,scene:any,camera:any)=>{
     if(camera.isPerspectiveCamera)Object.assign(w,{qaRenderer:renderer,qaScene:scene,qaCamera:camera});
    };
   });
  });
 });
 await openCoast(page);
 const first=await page.evaluate(()=>{
  const g=(window as any).__drive;
  const sign=g.triangles().recipe.find((s:any)=>s.id===910000*3);
  g.manual(true);
  // Stationary player in the clear lane. The rival field launches from the real 2500m grid.
  g.reset({distance:sign.distance-8,lateral:-5,speed:0});
  return sign;
 });
 await expect.poll(()=>page.evaluate(()=>Boolean((window as any).__drive.streamFrame().safe))).toBe(true);
 const contact=await page.evaluate(id=>{
  const g=(window as any).__drive,brake={gas:false,brake:true,steer:0};
  for(let i=0;i<200;i++){
   g.advance(.05,brake,false);
   const hit=g.triangles().trajectories.find((f:any)=>f.id===id);
   if(hit)return {hit,rivals:g.race().rivals,player:g.driveState()};
  }
 },first.id);
 expect(contact).toBeDefined();
 const rival=contact!.rivals.find((r:any)=>Math.abs(r.distance-first.distance)<7&&Math.abs(r.lateral-first.lateral)<2.5);
 expect(rival).toBeDefined();
 expect(rival.braking).toBe(false);
 expect(contact!.player.distance).toBeLessThan(first.distance-3.2);
 await info.attach('rival-contact',{body:JSON.stringify({sign:first,rival,throw:contact!.hit}),contentType:'application/json'});
 await page.screenshot({path:info.outputPath('rival-contact.png')});
 for(const age of [.3,1,2,4,11]){
  const result=await page.evaluate(({id,time,age,distance,flight})=>{
   const w=window as any,g=w.__drive;
   g.advance(Math.max(0,time-g.driveState().elapsed),{gas:false,brake:true,steer:0});
   const scene=w.qaScene;
   const mesh=scene.getObjectByName('breakdown-warning-objects');
   const index=g.triangles().shown.indexOf(id);
   if(index<0)throw Error('Struck reflector left the active draw list');
   const matrix=mesh.matrix.clone();mesh.getMatrixAt(index,matrix);
   const point=mesh.position.clone().setFromMatrixPosition(matrix);
   // A close inspection camera uses the game's renderer, materials and physical mesh.
   const renderer=w.qaRenderer;
   const inspection=w.qaCamera.clone();
   const road=g.sample(g.driveState().distance);
   const forward=point.clone().fromArray(road.tangent);
   inspection.position.copy(point).addScaledVector(forward,-6.5);
   inspection.position.y+=3.5;
   inspection.lookAt(point);inspection.updateMatrixWorld();
   const gaps:number[]=[];
   if(age>=2){
    // Project each drawn vertex back to road coordinates and raycast the streamed asphalt.
    const end=distance+flight.forward*.72*(1-Math.exp(-Math.min(age,flight.up/8+.55)/.72));
    const vertices=mesh.geometry.attributes.position;
    for(let i=0;i<vertices.count;i++){
     const v=point.clone().fromBufferAttribute(vertices,i).applyMatrix4(matrix);
     let d=end;
     for(let j=0;j<3;j++){
      const p=g.sample(d);
      d+=(v.x-p.position[0])*p.tangent[0]+(v.z-p.position[2])*p.tangent[2];
     }
     const p=g.sample(d);
     const x=-(v.x-p.position[0])*Math.cos(p.roadHeading)-(v.z-p.position[2])*Math.sin(p.roadHeading);
     const surface=g.surfaceProbe(d,x).hits[0];
     if(!surface)throw Error('No streamed surface beneath drawn vertex');
     gaps.push(v.y-surface.y);
    }
   }
   renderer.render(scene,inspection);
   return {image:renderer.domElement.toDataURL(),matrix:matrix.toArray(),gaps,active:mesh.count,capacity:mesh.instanceMatrix.count,
    time:g.driveState().elapsed,geometries:renderer.info.memory.geometries,calls:renderer.info.render.calls};
  },{id:first.id,time:contact!.hit.time+age,age,distance:first.distance,flight:contact!.hit});
  expect(result.capacity).toBe(48);expect(result.active).toBeLessThanOrEqual(48);
  expect(result.time-contact!.hit.time).toBeCloseTo(age,1);
  if(age>=2){
   expect(Math.min(...result.gaps)).toBeGreaterThanOrEqual(-.002);
   expect(Math.max(...result.gaps)).toBeLessThan(.15);
  }
  const path=info.outputPath('reflector-'+age+'s.png');
  await writeFile(path,Buffer.from(result.image.split(',')[1],'base64'));
  await info.attach('reflector-'+age+'s',{path,contentType:'image/png'});
  const {image,...metrics}=result;
  await writeFile(info.outputPath('pose-'+age+'.json'),JSON.stringify(metrics,null,2));
  await info.attach('pose-'+age,{body:JSON.stringify(metrics),contentType:'application/json'});
 }
});

test('pause restart returns the field to the grid and begins a fresh countdown',async({page})=>{
 await openCoast(page);
 await page.locator('#race-start').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
 await page.locator('#pause').click();
 const restart=page.locator('#tp-restart');
 await expect(restart).toHaveText('重新開始');await restart.click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
 const grid=await page.evaluate(()=>{
  const g=(window as any).__drive;
  return {distance:g.driveState().distance,time:g.race().time,rivals:g.race().rivals.map((r:any)=>r.distance)};
 });
 expect(grid.distance).toBe(350);expect(grid.time).toBe(0);
 expect(grid.rivals).toEqual([362,362,377,377,377,392,392]);
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
});

for(const input of ['gamepad','keyboard','mouse','touch'] as const){
 test('pause exit returns three stage cards via '+input,async({page},info)=>{
  await page.addInitScript(()=>{
   const buttons=Array.from({length:18},()=>({pressed:false,value:0}));
   Object.defineProperty(navigator,'getGamepads',{value:()=>[null,{connected:true,id:'Wireless Controller',mapping:'standard',buttons,axes:[0,0]}]});
   (window as any).padButtons=buttons;
  });
  await openCoast(page);
  await page.locator('#race-start').click();
  await page.locator('#pause').click();
  const exit=page.locator('#tp-exit');
  await expect(exit).toBeVisible();
  await page.evaluate(()=>history.replaceState({...history.state,retryStage:'coast'},''));
  if(input==='gamepad'){
   await exit.focus();
   await page.evaluate(()=>{(window as any).padButtons[0].pressed=true;});
  }else if(input==='keyboard')await exit.press('Enter');
  else if(input==='touch')await exit.tap();
  else await exit.click();
  await expect(page.locator('.mini-stage:visible')).toHaveCount(3);
  await expect(page.locator('#game-loading')).toBeHidden();
  expect(await page.evaluate(()=>[history.state?.retryStage,!!(window as any).__drive,document.querySelector('#view canvas')!==null])).toEqual([undefined,false,false]);
  if(input==='gamepad'){
   await page.waitForTimeout(1100); // The acceptance interval for a continuously held Cross.
   await expect(page.locator('.mini-stage:visible')).toHaveCount(3);
   await page.screenshot({path:info.outputPath('stage-select-held-cross.png')});
   await page.evaluate(async()=>{
    const b=(window as any).padButtons[0];b.pressed=false;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    b.pressed=true;
   });
   await expect(page.locator('#racing-menu')).toHaveCount(0);
   await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready',{timeout:120000});
   await expect(page.locator('#game-loading')).toBeHidden({timeout:120000});
   await expect(page.locator('#race-start')).toBeVisible();
  }
 });
}
