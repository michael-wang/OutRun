import {it,expect} from 'vitest';
import {PassBy,type PassVoice} from '../src/pass-by';
import type {TrafficActor} from '../src/traffic';
const actor=(z:number,lateral=-4,type=0,id=0):TrafficActor=>({id,type,distance:z,lateral,speed:34,lane:0,visible:true,y:0,grade:0});
function pass(side:number,rate=80,type=0){const p=new PassBy(),samples:{z:number;voice:PassVoice}[]=[];for(let i=0;i<240;i++){const z=(rate>0?30:-30)-rate*i/120;for(const v of p.update(i/120,0,0,1.55,[actor(z,side,type)]))if(v)samples.push({z,voice:{...v}});}return {p,samples};}
it('uses actual side, peaks alongside, fades behind and supports both travel directions',()=>{
 for(const side of [-4,4])for(const rate of [-80,80]){const {p,samples}=pass(side,rate);expect(p.starts).toBe(1);expect(p.crossings).toBe(1);expect(samples.some(s=>s.z*rate>0&&s.voice.gain>0)).toBe(true);const peak=samples.reduce((a,b)=>a.voice.gain>b.voice.gain?a:b);expect(Math.abs(peak.z)).toBeLessThan(2);expect(Math.sign(peak.voice.pan)).toBe(Math.sign(side));expect(Math.abs(peak.voice.pan)).toBeGreaterThan(.9);expect(p.inspect().active).toHaveLength(0);}
});
it('rejects following, distant traffic and collision corridors; stronger closing speed and larger vehicles are heavier',()=>{
 const p=new PassBy();for(let i=0;i<240;i++)p.update(i/120,0,0,1.55,[actor(12-i/60,-4,0,0),actor(200-i/2,4,0,1),actor(30-i/2,12,0,2),actor(30-i/2,0,0,3)]);expect(p.starts).toBe(0);
 const peak=(r:ReturnType<typeof pass>)=>Math.max(...r.samples.map(s=>s.voice.gain));expect(peak(pass(-4,80))).toBeGreaterThan(peak(pass(-4,20)));expect(peak(pass(-4,80,1))).toBeGreaterThan(peak(pass(-4,80,0)));expect(pass(-4,80,1).samples[5].voice.cutoff).toBeLessThan(pass(-4,80,0).samples[5].voice.cutoff);
});
it('cancels on collisions, suppresses repeats across pause and clears replay state',()=>{
 const p=new PassBy();for(let i=0;i<25;i++)p.update(i/120,0,0,1.55,[actor(25-i*.65)]);expect(p.starts).toBe(1);p.suspend();for(let i=25;i<120;i++)p.update(i/120,0,0,1.55,[actor(25-i*.65)]);expect(p.starts).toBe(1);p.reset();expect(p.inspect()).toMatchObject({starts:0,crossings:0,tracked:0,consumed:0});
 for(let i=0;i<25;i++)p.update(i/120,0,0,1.55,[actor(25-i*.65)]);p.update(.21,0,0,1.55,[actor(8)],0);expect(p.inspect().active).toHaveLength(0);for(let i=26;i<120;i++)p.update(i/120,0,0,1.55,[actor(25-i*.65)]);expect(p.starts).toBe(1);
});
it('bounds dense traffic voices and releases tracking when actors stream out',()=>{
 const p=new PassBy();for(let i=0;i<300;i++){const actors=Array.from({length:12},(_,id)=>actor(45+id*.3-i*.65,id%2?4:-4,0,id));p.update(i/120,0,0,1.55,actors);expect(p.inspect().active.length).toBeLessThanOrEqual(2);expect(p.inspect().tracked).toBeLessThanOrEqual(12);}expect(p.starts).toBeLessThanOrEqual(3);p.update(3,0,0,1.55,[]);expect(p.inspect()).toMatchObject({tracked:0,consumed:0,active:[]});
});
