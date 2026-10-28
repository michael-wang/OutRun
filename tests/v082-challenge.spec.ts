import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
test('braking comparison measures a real edge consequence at the same seed',async({browser})=>{
 const root='docs/evidence/v0.8.2';mkdirSync(root,{recursive:true});const outputs=[];
 for(const brake of [false,true]){const page=await browser.newPage();await page.goto('/?stage=1&seed=1');await page.keyboard.press('KeyP');const data=await page.evaluate(brake=>{const g=(window as any).__drive;g.manual(true);for(let i=0;i<2800;i++){const s=g.snapshot();if(s.mode==='paused')break;const max=Math.max(...[0,100,200,300].map(d=>Math.abs(g.sample(s.distance+d).curvature)));const limit=brake&&max>.005?50:83;g.advance(.1,{gas:s.speed<limit,brake:brake&&s.speed>limit+1,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.1))},false);}return {state:g.snapshot(),report:g.telemetry(),stage:g.brick()};},brake);outputs.push({brake,...data});await page.close();}
 writeFileSync(`${root}/challenge-comparison.json`,JSON.stringify(outputs));expect(outputs.every(x=>x.state.mode==='paused')).toBe(true);expect(outputs[1].report.metrics.brakePresses).toBeGreaterThan(0);expect(outputs[0].report.metrics.offroadSeconds).toBeGreaterThan(outputs[1].report.metrics.offroadSeconds);
});
