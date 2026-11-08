import {smoothstep,vnoise2} from './vendor/procedural-terrains/cpuNoise.js';
import {FARM_HOMES,FARM_ZONES} from './coast-farm-layout';
import {COAST_DISTRICTS} from './coast-layout';
import {COAST_RURAL_SHOWCASE} from './coast-rural-layout';

// Uncultivated headlands between the farmyards, the town and the finish.
const rollingHeadlands=[[1764,3408],[6995,7137],[8182,8405],[9700,10012]] as const;

const clearings=[
 ...FARM_ZONES.flatMap(z=>[
  {start:z.rice[0],end:z.rice[1],right:z.right+3},
  {start:z.flowerApproach,end:z.flowers[1],right:z.flowerRight+3},
 ]),
 ...FARM_HOMES.map(h=>({start:h.d-14,end:h.d+14,right:h.x+16})),
 ...COAST_DISTRICTS.map(z=>({...z,right:210})),
 {...COAST_RURAL_SHOWCASE,right:150},
];

export function meadowCover(x:number,d:number){
 const open=smoothstep(14.8,18.5,x);
 if(!open)return 0;
 let cover=open;
 for(const {start,end,right} of clearings){
  const gap=Math.max(start-d,d-end,x-right);
  if(gap<=0)return 0;
  if(gap<12)cover=Math.min(cover,open*smoothstep(0,12,gap));
 }
 return cover;
}

function headlandCover(x:number,d:number){
 if(x<16||x>245)return 0;
 for(const [start,end] of rollingHeadlands){
  if(d<=start||d>=end)continue;
  return smoothstep(start,start+16,d)*(1-smoothstep(end-24,end,d))
   *smoothstep(16,21,x)*(1-smoothstep(177,245,x));
 }
 return 0;
}

export function meadowRelief(x:number,d:number){
 const cover=headlandCover(x,d);
 if(!cover||x<=19)return 0;
 const swell=vnoise2(x/42+7,d/55),hummock=vnoise2(x/14,d/21+4);
 return cover*smoothstep(19,46,x)*(2.65*swell+.68*hummock-.54);
}
