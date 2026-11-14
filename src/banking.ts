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
export function featureBank(distance:number,base:number,features:readonly BankFeature[]){const f=features.find(f=>distance>f.start&&distance<f.end);if(!f)return base;const envelope=smooth((distance-f.start)/f.ramp)*smooth((f.end-distance)/f.ramp);return base+(f.degrees*Math.PI/180-base)*envelope;}

/** r4: smooth ordinary banking over distance, not frames. Two box integrations
 * preserve flat/constant slopes and bridge short gaps without changing curvature. */
export function seamlessBank(length:number,raw:(d:number)=>number,features:readonly BankFeature[]){
 const step=5,n=Math.ceil(length/step)+1;let values=Array.from({length:n},(_,i)=>raw(Math.min(length,i*step)));
 for(let pass=0;pass<2;pass++){
  const prefix=[0];for(const v of values)prefix.push(prefix.at(-1)!+v);
  values=values.map((_,i)=>{const lo=Math.max(0,i-25),hi=Math.min(n,i+26);return (prefix[hi]-prefix[lo])/(hi-lo);});
 }
 return (d:number)=>{
  const x=Math.max(0,Math.min(n-1,d/step)),i=Math.min(n-2,Math.floor(x)),t=x-i,a=values[i],b=values[i+1];
  const m0=(values[Math.min(n-1,i+1)]-values[Math.max(0,i-1)])/2,m1=(values[Math.min(n-1,i+2)]-values[i])/2;
  const base=(2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*m1;
  return featureBank(d,base,features);
 };
}
