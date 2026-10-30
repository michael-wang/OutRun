import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {generatedBank} from '../src/banking';
import {createState,step} from '../src/handling';
const root='docs/evidence/banking-2';
it('authors visible banking with frozen legacy geometry and deterministic showcases',()=>{
 mkdirSync(root,{recursive:true});const results=[];
 for(const seed of [1,2,7]){
 const b=generateTrip(seed),r2=generateTrip(seed,2),r1=generateTrip(seed,1),track=createPilotTrack(b),old=createPilotTrack(r2),flat=createPilotTrack(r1),features=b.bankFeatures!,curves:number[]=[],ordinary:number[]=[],angles:number[]=[];
 expect(b.tripCode).toBe(`TRIP-v0.9-r3-${seed.toString(36).toUpperCase()}-ALB3`);expect(r2.tripCode).toContain('r2-');expect(r1.tripCode).toContain('r1-');expect(b.placements).toEqual(r2.placements);expect(b.bankFeatures).toEqual(generateTrip(seed).bankFeatures);expect(r2.bankFeatures).toBeUndefined();
 for(let d=350;d<b.length+350;d+=10){const p=track.sample(d),q=old.sample(d),angle=Math.abs(Math.atan(p.right.y)*180/Math.PI),w=pilotWeights(b,d);expect(p.position).toEqual(q.position);expect(p.curvature).toBe(q.curvature);expect(flat.sample(d).right.y).toBe(0);expect(Math.abs(q.right.y)).toBeLessThanOrEqual(Math.tan(Math.PI/15)+1e-6);expect(angle).toBeLessThanOrEqual(25);angles.push(angle);if(Math.abs(pilotSample(b,d).demand)>.25){curves.push(angle);if(w[2]<.1&&!features.some(f=>d>=f.start&&d<=f.end))ordinary.push(angle);}expect(Math.abs(track.sample(d+.01).right.y-p.right.y)).toBeLessThan(.002);}
 ordinary.sort((a,b)=>a-b);const showcases=features.filter(f=>f.kind==='showcase'),straights=features.filter(f=>f.kind==='straight');expect(showcases.length).toBeGreaterThanOrEqual(2);expect(showcases.length).toBeLessThanOrEqual(4);expect(straights.length).toBeGreaterThan(0);if(seed===1)expect(showcases[0].start).toBeLessThan(8000);
 for(const f of features){const d=(f.start+f.end)/2,p=track.sample(d);expect(-Math.atan(p.right.y)*180/Math.PI).toBeCloseTo(f.degrees,1);if(f.kind==='straight')expect(p.curvature).toBe(0);else expect(Math.sign(f.degrees)).toBe(Math.sign(p.curvature));for(const edge of [f.start,f.end])expect(Math.abs(track.sample(edge+.01).right.y-track.sample(edge-.01).right.y)).toBeLessThan(.001);}
 results.push({seed,typicalNonCityCurveMedian:ordinary[Math.floor(ordinary.length/2)],typicalNonCityCurveP90:ordinary[Math.floor(ordinary.length*.9)],maximum:Math.max(...angles),meaningfulCurvesAtLeast6Degrees:curves.filter(a=>a>=6).length/curves.length,flatFraction:angles.filter(a=>a<1).length/angles.length,showcases:showcases.length,bankedStraights:straights.length,features});
 }
 writeFileSync(`${root}/distribution.json`,JSON.stringify(results,null,2));console.log(results.map(({features,...r})=>({...r,firstShowcase:features.find(f=>f.kind==='showcase')})));
},15000);
it('straight cross-slope adds no automatic lateral force and retains the approved relief cap',()=>{
 const flat={...createState(),speed:70,lateral:2},bank={...flat};for(let i=0;i<240;i++){step(flat,{gas:true,brake:false,steer:0},1/120,0);step(bank,{gas:true,brake:false,steer:0},1/120,0,1,7,0,7*Math.PI/180);}expect(bank.lateral).toBe(flat.lateral);expect(bank.speed).toBe(flat.speed);expect(bank.requiredSteer).toBe(0);
 expect(generatedBank(.001,[0,1,0],3)).toBeGreaterThan(generatedBank(.001,[0,1,0],2));
});
