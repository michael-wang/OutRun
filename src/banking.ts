import {CURVATURE_PER_STEER} from './challenges';
import type {createTrack} from './track';
export type BankStrength=0|4|10;
export const BANK_SECTION={start:700,hold:860,release:1190,end:1350} as const;
const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
/** Positive means the right edge is lower. Distances are absolute, not chunk local. */
export function bankAngle(distance:number,strength:BankStrength,direction=1){const p=BANK_SECTION;return direction*strength*Math.PI/180*smooth((distance-p.start)/(p.hold-p.start))*(1-smooth((distance-p.release)/(p.end-p.release)));}
export function bankPrototype(lab:string|null,id:string|undefined,value:string|null):BankStrength{return lab==='pilots'&&id==='L2P-B'&&(value==='4'||value==='10')?Number(value) as BankStrength:0;}
/** Preserve horizontal widths and centerline. The same cross-slope reaches shoulders,
 * barriers and scenery through their existing lateral sampling. No physics input changes. */
export function bankTrack(track:ReturnType<typeof createTrack>,strength:BankStrength){if(!strength)return track;return {...track,sample:(d:number)=>{const p=track.sample(d);const angle=bankAngle(d,strength);if(angle)p.right.y=-Math.tan(angle);return p;}};}

/** Authored curve intensity, not random per-chunk tilt. Gentle corrections stay flat. */
export function generatedBank(curvature:number,weights:readonly number[],revision:2|3=2){if(revision===3){const demand=Math.abs(curvature)/CURVATURE_PER_STEER,base=weights[0]*6+weights[1]*7+weights[2]*1.5,cap=weights[0]*15+weights[1]*18+weights[2]*4;return Math.sign(curvature)*Math.PI/180*smooth((demand-.03)/.18)*(base+(cap-base)*smooth((demand-.28)/.85));}const demand=Math.abs(curvature)/CURVATURE_PER_STEER;const cap=weights[0]*8+weights[1]*12+weights[2]*4;return Math.sign(curvature)*cap*Math.PI/180*smooth((demand-.12)/.88);}

export interface BankFeature {kind:'showcase'|'straight';start:number;end:number;ramp:number;degrees:number}
/** Sparse authored moments; all distances are absolute and serialized with the r3 recipe. */
export function authorBankFeatures(b:import('./trip').TripCandidate,sample:(d:number)=>{grade:number;halfWidth:number}):BankFeature[]{
 const world=(s:number)=>b.worldPhases.find(p=>s>=p.startS&&s<p.endS)?.world;
 const candidates=b.placements.filter(p=>p.channel==='curvature'&&!['C06','C07'].includes(p.id)&&p.parameters.effort<=.7&&p.endS-p.startS>=260&&world((p.startS+p.endS)/2)!=='city'&&[.15,.5,.85].every(t=>{const q=sample(350+p.startS+(p.endS-p.startS)*t);return q.halfWidth>=7&&Math.abs(q.grade)<.2;}));
 const count=Math.min(2+b.seed%3,candidates.length),chosen:typeof candidates=[];
 // First usable scenic sweeper is deliberately early; the remainder span the journey.
 for(let i=0;i<count;i++){const target=i===0?0:b.length*i/count;const p=candidates.filter(p=>!chosen.includes(p)&&chosen.every(q=>Math.abs(p.startS-q.startS)>1200)).sort((a,z)=>Math.abs(a.startS-target)-Math.abs(z.startS-target))[0];if(p)chosen.push(p);}
 const features:BankFeature[]=chosen.map((p,i)=>({kind:'showcase',start:350+p.startS,end:350+p.endS,ramp:Math.max(90,(p.endS-p.startS)*.27),degrees:(20+(b.seed+i*2)%5)*(p.channel==='curvature'?p.parameters.direction:1)}));
 const straights=b.buffers.filter(p=>p.role==='scenic'&&p.endS-p.startS>=300&&world((p.startS+p.endS)/2)!=='city');
 for(const [i,p] of straights.entries()){const previous=b.placements.filter(q=>q.channel==='curvature'&&q.endS<=p.startS).at(-1);features.push({kind:'straight',start:350+p.startS,end:350+p.endS,ramp:Math.min(100,(p.endS-p.startS)*.25),degrees:(4+(b.seed+i)%4)*(previous?.channel==='curvature'?previous.parameters.direction:1)});}
 return features.sort((a,z)=>a.start-z.start);
}
export function featureBank(distance:number,base:number,features:readonly BankFeature[]){const f=features.find(f=>distance>f.start&&distance<f.end);if(!f)return base;const envelope=smooth((distance-f.start)/f.ramp)*smooth((f.end-distance)/f.ramp);return base+(f.degrees*Math.PI/180-base)*envelope;}
