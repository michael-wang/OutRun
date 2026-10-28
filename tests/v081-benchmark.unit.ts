import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createState,step} from '../src/handling';

it('records actual baseline acceleration, five shifts and grade/coast traces when requested',()=>{
 const label=process.env.OUTRUN_CAPTURE_BASELINE;if(label!=='before'&&label!=='after')return;
 const runs=[];
 for(const fps of [30,60])for(const scenario of ['flat','uphill','coast'] as const){
  const state=createState(),rows=[];if(scenario==='coast')state.speed=200/3.6;
  for(let frame=0;frame<fps*45;frame++){
   for(let remaining=1/fps;remaining>1e-9;){const dt=Math.min(remaining,1/120);step(state,{gas:scenario!=='coast',brake:false,steer:0},dt,0,1.75,7,scenario==='uphill'?.05:0);remaining-=dt;}
   rows.push({t:(frame+1)/fps,kmh:state.speed*3.6,gear:state.gear,rpm:state.rpm,gearRatio:state.gearRatio,engineTorque:state.engineTorque,shiftRemaining:state.shiftRemaining,traction:state.tractionFactor,drive:state.driveForce,drag:state.roadDrag,acceleration:state.netAcceleration,grade:state.grade,distance:state.distance});
  }
  const hit=(speed:number)=>rows.find(r=>r.kmh>=speed-1e-6)?.t??null;const shifts=rows.flatMap((r,i)=>i&&r.gear>rows[i-1].gear?[{from:rows[i-1].gear,to:r.gear,start:r.t,rows:rows.slice(Math.max(0,i-3),i+Math.ceil(fps*.4))}]:[]);
  if(scenario==='flat'){expect(hit(300)).not.toBeNull();expect(shifts).toHaveLength(5);}
  runs.push({fps,scenario,t100:hit(100),t200:hit(200),t300:hit(300),shifts,rows});
 }
 mkdirSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1',{recursive:true});writeFileSync(`docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/powertrain-${label}.json`,JSON.stringify(runs,null,2));
});
