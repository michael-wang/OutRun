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
