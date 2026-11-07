import {smoothstep,vnoise2} from './vendor/procedural-terrains/cpuNoise.js';

// Uncultivated headlands between the farmyards, the town and the finish.
export const COAST_MEADOWS=[[1764,3408],[6995,7137],[8182,8405],[9700,10012]] as const;

export function meadowCover(x:number,d:number){
 if(x<16||x>245)return 0;
 for(const [start,end] of COAST_MEADOWS){
  if(d<=start||d>=end)continue;
  return smoothstep(start,start+16,d)*(1-smoothstep(end-24,end,d))
   *smoothstep(16,21,x)*(1-smoothstep(177,245,x));
 }
 return 0;
}

export function meadowRelief(x:number,d:number){
 const cover=meadowCover(x,d);
 if(!cover||x<=19)return 0;
 const swell=vnoise2(x/42+7,d/55),hummock=vnoise2(x/14,d/21+4);
 return cover*smoothstep(19,46,x)*(2.65*swell+.68*hummock-.54);
}
