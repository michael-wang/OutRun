import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {stageReady,inspectAt} from './stage-ready';
const root='docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1';mkdirSync(root,{recursive:true});
test('actual stage road widths, paint and off-road boundaries agree',async({page})=>{
 await page.setViewportSize({width:960,height:432});await page.goto('/?stage=1&seed=3');await stageReady(page);await page.locator('#l2-play').click();
 const stage=await page.evaluate(()=>(window as any).__drive.brick()),narrow=stage.placements.find((p:any)=>p.channel==='width'&&p.id==='W04'),wide=stage.placements.find((p:any)=>p.channel==='width'&&p.id==='W02');expect(narrow).toBeTruthy();expect(wide).toBeTruthy();
 for(const [name,d,expected] of [['four',350,4],['narrow',350+(narrow.startS+narrow.endS)/2,2],['wide',350+wide.endS+100,wide.parameters.to]] as const){
  await inspectAt(page,d);
  const data=await page.evaluate(({d})=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:d,speed:55});const road=g.sample(d),paint=g.paintProbe(d,0);g.reset({distance:d,speed:55,lateral:road.halfWidth-1.3});const inside=g.snapshot();g.reset({distance:d,speed:55,lateral:road.halfWidth-.5});const outside=g.snapshot();g.reset({distance:d,speed:55});return {road,paint,inside,outside};},{d});
  expect(data.road.lanes).toBeCloseTo(expected,3);expect(data.road.halfWidth).toBeCloseTo(expected*3.5/2,3);expect(data.paint.length).toBeGreaterThan(0);expect(data.inside.offRoad).toBe(false);expect(data.outside.offRoad).toBe(true);await page.screenshot({path:`${root}/width-${name}.png`});
 }
});
