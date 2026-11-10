import {test,expect} from '@playwright/test';

test('standing launch spins the rear tires and a high-speed straight stop marks all four',async({page},info)=>{
 await page.setViewportSize({width:800,height:450});
 await page.goto('/?at=350');
 await page.waitForFunction(()=>(window as any).__drive?.driveState().mode==='playing',null,{timeout:90000});
 await page.locator('#game-loading').waitFor({state:'hidden',timeout:90000});
 await page.evaluate(()=>{
  const game=(window as any).__drive;
  game.manual(true);
  game.reset({distance:350,speed:0});
 });
 const driveFrames=(frames:number)=>page.evaluate(frames=>{
  const game=(window as any).__drive;
  for(let frame=0;frame<frames;frame++)game.advance(1/30);
  return game.tireEffects();
 },frames);
 await page.keyboard.down('Space');
 const launch=await driveFrames(19);
 expect(launch.emittedByWheel.slice(0,2).every((count:number)=>count>0)).toBe(true);
 expect(launch.emittedByWheel.slice(2)).toEqual([0,0]);
 expect(launch.particles).toBeGreaterThan(0);
 expect(launch.segments).toBeGreaterThan(0);
 const wheels=await page.evaluate(()=>(window as any).__drive.wheels());
 expect(wheels.find((w:any)=>!w.front).angle).toBeGreaterThan(wheels.find((w:any)=>w.front).angle*2);
 await page.screenshot({path:info.outputPath('launch.png')});
 await page.keyboard.up('Space');
 expect((await driveFrames(2)).emittedByWheel).toEqual(launch.emittedByWheel);

 const resetSpeed=(kmh:number)=>page.evaluate(kmh=>(window as any).__drive.reset({distance:350,speed:kmh/3.6}),kmh);
 await resetSpeed(25);
 await page.keyboard.down('Space');
 expect((await driveFrames(4)).emittedByWheel).toEqual([0,0,0,0]);
 await page.keyboard.up('Space');
 await resetSpeed(160);
 await page.keyboard.down('Enter');
 const stop=await driveFrames(10);
 expect(stop.emittedByWheel.every((count:number)=>count>0)).toBe(true);
 expect(stop.segments).toBeGreaterThan(0);
 expect(stop.particles).toBeGreaterThan(0);
 await page.screenshot({path:info.outputPath('braking.png')});
 await page.keyboard.up('Enter');
 expect((await driveFrames(2)).emittedByWheel).toEqual(stop.emittedByWheel);
 await resetSpeed(80);
 await page.keyboard.down('Enter');
 expect((await driveFrames(6)).emittedByWheel).toEqual([0,0,0,0]);
 await page.keyboard.up('Enter');
});
