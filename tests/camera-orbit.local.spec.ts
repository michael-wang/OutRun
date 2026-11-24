import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const evidence=process.env.OUTRUN_OPTION_B_EVIDENCE;
test.skip(!evidence,'Private local evidence path required');
test('actual game right-stick orbit, held angle, R3 reset and private red/white views',async({page})=>{
 mkdirSync(evidence!,{recursive:true});
 await page.addInitScript(()=>{
  const p={id:'QA standard pad',connected:true,mapping:'standard',buttons:Array.from({length:18},()=>({pressed:false,value:0})),axes:[0,0,0,0]};
  (window as any).__qaPad=p;Object.defineProperty(navigator,'getGamepads',{value:()=>[p]});
 });
 await page.goto('/?at=850&trafficSeed=1234');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:120000});
 const read=()=>page.evaluate(()=>(window as any).__drive.cameraOrbit());
 const initial=await read();expect(initial.angle).toBe(0);
 await page.evaluate(()=>(window as any).__qaPad.axes[2]=1);
 await expect.poll(async()=>Math.abs((await read()).angle)).toBeGreaterThan(.8);
 await page.evaluate(()=>(window as any).__qaPad.axes[2]=0);
 await page.waitForTimeout(80);const held=await read();await page.waitForTimeout(250);
 expect((await read()).angle).toBe(held.angle);
 await page.screenshot({path:join(evidence!,'g3-orbit-ready.png')});
 await page.evaluate(()=>(window as any).__qaPad.buttons[11].pressed=true);
 await expect.poll(async()=>(await read()).angle).toBe(0);
 await page.evaluate(()=>(window as any).__qaPad.buttons[11].pressed=false);

 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
 await page.evaluate(()=>{const d=(window as any).__drive;d.manual(true);d.reset({distance:850,speed:0});d.advance(4,{gas:false,brake:false,steer:0});});
 // Normal chase retained: no inspection camera override for this image.
 await page.screenshot({path:join(evidence!,'g3-red-8m-chase.png')});
 for(const color of ['ferrari-red','pure-white']){
  await page.evaluate(color=>{const el=document.getElementById('car-paint') as HTMLSelectElement;el.value=color;el.dispatchEvent(new Event('change'));},color);
  for(const view of ['rear3q','side','front']){
   await page.evaluate(view=>(window as any).__drive.carView(view),view);
   await page.screenshot({path:join(evidence!,`g3-${color}-${view}.png`)});
  }
 }
 await page.evaluate(()=>{const d=(window as any).__drive;d.reset({distance:850,speed:0});d.advance(4,{gas:false,brake:false,steer:0});});
 await page.evaluate(()=>(window as any).__qaPad.axes[2]=1);
 for(const target of [1.5,3.0,4.5,5.8]){
  await expect.poll(async()=>(await read()).angle,{timeout:6000}).toBeGreaterThan(target);
  await page.evaluate(()=>(window as any).__qaPad.axes[2]=0);
  await page.screenshot({path:join(evidence!,`g3-orbit-${target}.png`)});
  await page.evaluate(()=>(window as any).__qaPad.axes[2]=1);
 }
 await expect.poll(async()=>(await read()).angle,{timeout:6000}).toBeLessThan(.8);
 await page.evaluate(()=>(window as any).__qaPad.axes[2]=0);
 await page.keyboard.press('p');await expect(page.locator('html')).toHaveAttribute('data-drive-mode','paused');
 const paused=await read();await page.evaluate(()=>(window as any).__qaPad.axes[2]=1);await page.waitForTimeout(200);expect((await read()).angle).toBe(paused.angle);
 await page.evaluate(()=>(window as any).__qaPad.axes[2]=0);
 await page.keyboard.press('r');await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');expect((await read()).angle).toBe(0);
 writeFileSync(join(evidence!,'g3-orbit-diagnostics.json'),JSON.stringify({initial,held,paused,final:await read(),input:'browser-mocked standard gamepad; no physical-pad claim'},null,2));
});
