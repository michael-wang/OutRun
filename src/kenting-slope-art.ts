import {fbm2} from './vendor/procedural-terrains/cpuNoise.js';

export type SlopeArtMode='baseline'|'material'|'structure';
export const parseSlopeArtMode=(value:unknown):SlopeArtMode=>value==='material'||value==='structure'?value:'baseline';

// Absolute immediate track metres, HUD = track - 350. No height writes.
export const SLOPE_ART={start:4510,entryFull:4555,exitFull:4715,end:4750,minX:16,maxX:163} as const;
const smooth=(lo:number,hi:number,v:number)=>{
 const t=Math.max(0,Math.min(1,(v-lo)/(hi-lo)));return t*t*(3-2*t);
};
export const slopeArtEnvelope=(d:number,x:number)=>
 smooth(SLOPE_ART.start,SLOPE_ART.entryFull,d)*(1-smooth(SLOPE_ART.exitFull,SLOPE_ART.end,d))
 *smooth(SLOPE_ART.minX,31,x)*(1-smooth(121,SLOPE_ART.maxX,x));

/** Low-frequency erosion colour groups. Slope takes precedence, height and
 * disturbed bedding connect exposed faces, and the foot retains soil.
 * Absolute coordinates match shared vertices and streamed edges. */
export function slopeArtMix(d:number,x:number,height:number,tilt:number){
 const envelope=slopeArtEnvelope(d,x);
 if(envelope<=0)return {rock:0,soil:0,grass:0};
 const noise=fbm2(x/79+19.4,d/88-8.3,3,.52,2.03,.51,.20);
 const erosion=.5+.5*Math.sin(d*.047+x*.072+noise*2.8);
 const bedding=.5+.5*Math.cos(height*.40-x*.071+d*.022+noise*3.10);
 const ledge=smooth(.24,.76,tilt)*(.48+.52*smooth(.32,.78,bedding));
 const hollows=smooth(.50,.89,erosion)*smooth(.16,.51,tilt)*(.3+.7*smooth(4,16,height));
 const patches=smooth(-.25,.61,noise+.32*erosion)*(.2+.27*smooth(9,23,height));
 const rock=Math.min(.88,(ledge*.79+hollows*.59+patches)*envelope);
 const toe=(1-smooth(47,91,x))*.34;
 const soil=(1-rock)*(toe+.23*erosion+.16*(1-bedding))*envelope;
 const grass=(1-rock-soil)*envelope*(.13+.25*(1-erosion)*smooth(-.48,.38,noise));
 return {rock,soil,grass};
}

// Two broken ribs and small pockets of vegetation in the intervening gully.
export const SLOPE_STRUCTURE=[
 {kind:'rock',d:4567,x:35,h:6.1,yaw:.28,key:91},
 {kind:'rock',d:4573,x:42,h:4.4,yaw:.38,key:102},
 {kind:'rock',d:4594,x:63,h:5.3,yaw:.42,key:113},
 {kind:'shrub',d:4614,x:62,h:3.1,yaw:.53,key:124},
 {kind:'shrub',d:4624,x:73,h:3.5,yaw:.76,key:135},
 {kind:'rock',d:4670,x:41,h:7.8,yaw:-.22,key:146},
 {kind:'rock',d:4678,x:47,h:6.0,yaw:-.11,key:157},
 {kind:'rock',d:4690,x:55,h:4.7,yaw:.08,key:168},
 {kind:'shrub',d:4702,x:84,h:3.8,yaw:.77,key:179},
 {kind:'shrub',d:4711,x:99,h:3.4,yaw:1.19,key:190},
] as const;
