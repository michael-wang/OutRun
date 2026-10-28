import {test,expect} from '@playwright/test';
import {stageReady} from './stage-ready';

test('far-route physics and retrospective samples agree across 30 and 60 steps',async({page})=>{
 await page.goto('/?trip=10m&seed=3');await stageReady(page);await page.keyboard.press('KeyP');
 const runs=await page.evaluate(()=>{const g=(window as any).__drive,rows=[];for(const fps of [30,60]){g.manual(true);g.reset({distance:68000,speed:60});for(let i=0;i<fps*4;i++)g.advance(1/fps,{gas:true,brake:false,steer:.1},false);rows.push({state:g.snapshot(),history:g.recentHistory()});}return rows;});
 expect(Math.abs(runs[0].state.distance-runs[1].state.distance)).toBeLessThan(.05);expect(Math.abs(runs[0].state.lateral-runs[1].state.lateral)).toBeLessThan(.01);
 expect(runs[0].history.length).toBeGreaterThan(5);expect(runs[1].history.length).toBeGreaterThan(5);
 const a=runs[0].history.at(-1),b=runs[1].history.at(-1);expect(Math.abs(a.s-b.s)).toBeLessThan(.1);expect(a.stageCode).toBe(b.stageCode);
});
